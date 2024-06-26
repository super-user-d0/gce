"use strict";

import * as readLine from "node:readline";
import { end } from "../spkg/v1.0.0.js";
import { existsAsync } from "../etc/existsAsync.js";
import { join } from "node:path";
import { PATHS, SYSTEM } from "../var/system.js";
import { readFile, readdir } from "node:fs/promises";
import { promisify } from "node:util";

/** handler for the rkill command
 * @author david, super-user-d0
 * @returns {void}
 */
export default async function Rkill() {
  const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let rlAsync = promisify(rl.question).bind(rl);
  await rlAsync("Hit enter to acknowledge this request ");
  rl.close();

  const services = (await existsAsync(PATHS.serviceLog))
    ? await readdir(PATHS.serviceLog, SYSTEM.encoding)
    : [];
  if (services.length > 0) {
    for (let i = 0; i < services.length; i++) {
      const serviceId = services[i];
      const servicePath = join(PATHS.serviceLog, serviceId);
      try {
        if (existsAsync(servicePath)) {
          const sdu = await readFile(servicePath, SYSTEM.encoding);
          await end(JSON.parse(sdu), true);
          console.log(`\x1b[93mkilled service ${serviceId} [success]\x1b[0m`);
        } else
          console.log(
            `\x1b[95mcannot find service ${serviceId} [failed]\x1b[0m`
          );
      } catch {
        console.log(`\x1b[93mremoved ghost ${serviceId} [success]\x1b[0m`);
      }
    }
  } else console.log("no service to kill");
  return void 0;
}
