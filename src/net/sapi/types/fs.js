import { join } from "node:path";
import { code_0 } from "../codes.js";
import { defopera } from "./default.js";
import { dirRead } from "../opera/read.js";
import { ERRORCODES } from "../../../var/system.js";

async function READDIR(relativePath, oid, sdu) {
  try {
    // the readdir expects the payload to be the relative path to the file in 
    // which the user wants to read.
    const { servicePath } = sdu;
    const pathToDir = join(servicePath, relativePath);
    const entries = await dirRead(pathToDir);
    return JSON.stringify(code_0(true, "ACK/HASPAYLOAD", oid, entries)); 
  } catch(error) {
    if (error.code  === ERRORCODES.notFound) {
      return JSON.stringify(code_0(false, "ENOENTRY", oid, null)); 
    } else if (error.code  === ERRORCODES.notdirectory ) {
      return JSON.stringify(code_0(false, "OSFORBIDEN", oid, null)); 
    } else return JSON.stringify(code_0(false, "STDERR", oid, error.message)); 
  }
}

export default async function fs(request,sdu) {
  let response;
  const { OPERA, PAYLOAD, OID } = request;
  switch (OPERA) {
     case "READDIR" : response = await READDIR(PAYLOAD, OID, sdu); break
     default: response = defopera(OPERA);
  };
  return response;
}

