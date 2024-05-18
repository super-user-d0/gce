
"use strict";

import * as readLine from "node:readline";
import { basename, join } from "node:path";
import {
    existsSync, 
    mkdirSync, 
    readFileSync, 
    rmSync, 
    writeFileSync 
} from "node:fs";
import { PATHS, SYSTEM } from "../var/system.js";
import { platform } from "node:os";
import { promisify } from "node:util";
import { supportedPlatforms as gceSupportedPlatforms } from "../var/osPaths.js";

const pkgs_registry_path = join(PATHS.pkgs,".pkgs_reg");
const update = (content) => 
   writeFileSync(pkgs_registry_path, content, SYSTEM.encoding);


/**
 * a sub-command that adds packages to gce's global registry
 * @author david, pass-me-dachips
 * @param {string} relativePath relative path to the package
 * @returns {void}
 */
async function add(relativePath) {
  if (relativePath) {
   const pathToPackage = join(process.cwd(), relativePath);
   const pathToHeaderfile = join(pathToPackage, "Headerfile.json");
   const Headerfile = JSON.parse(readFileSync(pathToHeaderfile, SYSTEM.encoding));
   let {
      author,
      name,
      version,
      repo,
      man,
      desc,
      requirements,
      supportedPlatforms,
      cmd,
      cmd1,
      args
   } = Headerfile;
   if (
      author && name && version && repo && man && desc && requirements && 
      Array.isArray(requirements) && supportedPlatforms && Array.isArray(supportedPlatforms) &&
      cmd && cmd1 && args && Array.isArray(args) && basename(man) === "Manfile"
    ) {
      man = join(process.cwd(), relativePath, man); // switch to absoulte path
      if (requirements.length > 0) {
         const rl = readLine.createInterface({
           input : process.stdin,
           output : process.stdout
         });
         const questionAsync = promisify(rl.question).bind(rl);
         console.log(`\x1b[92m${name} requires the following \x1b[0m`);
         requirements.forEach(elem => console.log(` ~ ${elem}`));
         await questionAsync("\x1b[95mare you sure you met the specified requirements?\x1b[0m hit enter to continue ");
         rl.close();
      }
      const osplatform = platform();
      if (supportedPlatforms.includes(osplatform) && 
          gceSupportedPlatforms.includes(osplatform)) {
         cmd1 = cmd1.split("{PATH}");
         cmd1[0] = pathToPackage;
         cmd1 = join(...cmd1);
         if (cmd === "{BIN}" &&
             osplatform === "android" || 
             osplatform === "darwin" || 
             osplatform === "linux") {
           cmd = cmd.replace("{BIN}", `chmod +x ${cmd1} && `);
         } else cmd = "";
        const encaps = {
          author, name, version, repo, man, desc, requirements, supportedPlatforms,
          cmd, cmd1, args,
          dateAdded: new Date(),
          gceVersion: SYSTEM.version
        }

        while (!existsSync(PATHS.pkgs)) {mkdirSync(PATHS.pkgs,{recursive: true});}
        if (existsSync(pkgs_registry_path)) {
           const previousContents = 
             JSON.parse(readFileSync(pkgs_registry_path, SYSTEM.encoding));
           if (name in previousContents) {
            console.log(`Alert: ${name} already added to the registry.`);
            console.log(`Gce would upgrade or update the previous entry with this.`);
            let contentToWrite = { ...previousContents };
            contentToWrite[name] = encaps;
            contentToWrite = JSON.stringify(contentToWrite, "", 4);
            update(contentToWrite);
          } else {
            let contentToWrite = {...previousContents, [name]:{...encaps}};
            contentToWrite = JSON.stringify(contentToWrite, "", 4);
            update(contentToWrite);
          }
        } else {
          const contentToWrite = JSON.stringify({[name]: {...encaps}},null, 4);
          update(contentToWrite);
        }  
      } else { console.log(`\x1b[5;94m${name} does not support platform: ${osplatform}\x1b[0m`); process.exit(1); }
   } else console.log(`package does not meet gce's requirements.\nvisit \x1b[95m${SYSTEM.buildAPackage_repo}\x1b[0m to learn more about Headerfiles`); process.exit(1);
  } else console.log("cannot add a package without its relative path to the source code.\nHint: make sure you run \x1b[92m\`gce pkg add <relative_path_to_package>\`\x1b[0m next time!"); process.exit(1);
}


// function remove(pkg) {
//   if (existsSync(pkgs_lock_path)) {
//     const packages = JSON.parse(readFileSync(pkgs_lock_path, GOUTFORMAT.encoding));
//     if (pkg) {
//       console.log("removing package %s .......", pkg);
//       if (pkg in packages) {
//         delete packages[pkg];
//         update(JSON.stringify(packages, "", 4));
//         console.log("removed 1 package");
//       } else throw { message: `package ${pkg} does not exists` }
//     } else {
//       console.log("\x1b[92myou are about to remove all existing packages\x1b[0m");
//       const cb = answer => {
//          rl.close();
//          if (answer === "ACK") {
//           rmSync(pkgs_lock_path);
//           console.log(`removed ${Object.keys(packages).length} packages`);
//          }
//          else throw { message: "request not acknowledge" } 
//        }
//       const rl = readLine.createInterface({
//         input: process.stdin, output: process.stdout
//       });
//       rl.question("Enter `ACK` to acknowledge request ", cb);
//     }
//   } else throw { message: "no packages found" }
// }

// function show(pkg) {
//   if (existsSync(pkgs_lock_path)) {
//     const packages = JSON.parse(readFileSync(pkgs_lock_path, GOUTFORMAT.encoding));
//     if (!pkg) {
//       const packagesName = Object.keys(packages);
//       console.log(`listing all packages........ ${packagesName.length} found`);
//       packagesName.forEach(elem => {
//         console.log(`\x1b[92m${elem}\x1b[0m  ${packages[elem].version}  ${packages[elem].fpath}`);
//       })
//     } else {
//       console.log("retrieving info about package %s ......", pkg);
//       const packageInfo = packages[pkg];
//       if (packageInfo) {
//         console.log(`  \x1b[92mname\x1b[0m  ${packageInfo.name}`);
//         console.log(`  \x1b[92mversion\x1b[0m  ${packageInfo.version}`);
//         console.log(`  \x1b[92mlocation\x1b[0m  ${packageInfo.fpath}`);
//         console.log(`  \x1b[92madded\x1b[0m  ${packageInfo.dateAdded}`);
//         console.log(`  \x1b[92mgce_v\x1b[0m  ${packageInfo.gceVersion}`);
//         console.log("want to upgrade/update this package? \x1b[92mrun gce pkg add %s\x1b[0m", pkg);
//         console.log("want to remove this package? \x1b[92mrun gce pkg remove %s \x1b[0m\n", pkg);
//       } else throw { message: `could not retreive info about package ${pkg}. \x1b[93mare you sure it exists?\x1b[0m`}
//     }
//   } else throw { message: "no packages found" }
// }



/**
 * handler for the pkg command
 * @author david, pass-me-dachips
 * @param {Array} args 
 * @returns {void}
 */
export default function Pkg(args) {
  args = args.slice(1);
  if (args[0]) {
    const option = args[0]; const sub_command_arg = args[1];
    switch(option) {
      case "add": add(sub_command_arg); break;
      case "show": show(sub_command_arg); break;
      case "remove": remove(sub_command_arg); break;
      default: throw { message: `invalid sub-command ${option}`}
    }
  } else {
    const message = "pkg expected at least 1 sub-command, got 0";
    throw { message}
  }
}
