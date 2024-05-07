import { join } from "node:path";
import { code_0 } from "../codes.js";
import { defopera } from "./default.js";
import { dirRead, fileRead, getStatistics } from "../opera/read.js";
import { ERRORCODES } from "../../../var/system.js";

export function errorResponseHelper(error, oid) {
  if (error.code  === ERRORCODES.notFound) {
      return JSON.stringify(code_0(false, "ENOENTRY", oid, null)); 
  } else if (error.code === ERRORCODES.notdirectory ) {
      return JSON.stringify(code_0(false, "OSFORBIDEN", oid, null)); 
  } else return JSON.stringify(code_0(false, "STDERR", oid, error.message)); 
}

async function READDIR(relativePath, oid, sdu) {
  try {
    // the readdir expects the payload to be the relative path to the file in 
    // which the user wants to read.
    const { servicePath } = sdu;
    const pathToDir = join(servicePath, relativePath);
    const entries = await dirRead(pathToDir);
    return JSON.stringify(code_0(true, "ACK/HASPAYLOAD", oid, entries)); 
  } catch(error) {
    return errorResponseHelper(error, oid);
  }
}

export async function STATICS(relativePath, oid, sdu) {
  try {
    // the readdir expects the payload to be the relative path to the file in 
    // which the user wants to read.
    const { servicePath } = sdu;
    const path = join(servicePath ,relativePath);
    const statistics = await getStatistics(path);
    return JSON.stringify(code_0(true, "ACK/HASPAYLOAD", oid, statistics)); 
  } catch (error) {
    if (error.code === ERRORCODES.notFound) {
      return JSON.stringify(code_0(false, "ENOENTRY", oid, null));  
    } else return JSON.stringify(code_0(false, "STDERR", oid, error.message)); 
  }
}

export async function READFILE(payload, oid, sdu) {
  try {
    const { path, useDefault, window, lineHeight, page, startLine} = payload;
    if (path && typeof useDefault === "boolean") {
      const filePath = join(sdu.servicePath, path);
      const content = await fileRead( 
        filePath, useDefault, window, lineHeight, page, startLine 
      );
      return JSON.stringify(code_0(true, "ACK/HASPAYLOAD", oid, content)); 
    } else throw {  
      message : "READFILE requires the path and useDefualt fields."
    };
  } catch (error) { 
    if (error.code === ERRORCODES.notFound) {
      return JSON.stringify(code_0(false, "ENOENTRY", oid, null));  
    } else return JSON.stringify(code_0(false, "STDERR", oid, error.message)); 
  } 
}

// ++++++++ the main fs api ++++++++++++++++++
export default async function fs(request,sdu) {
  let response;
  const { OPERA, PAYLOAD, OID } = request;
  switch (OPERA) {
     case "READDIR" : response = await READDIR(PAYLOAD, OID, sdu); break
     case "STATICS" : response = await STATICS(PAYLOAD, OID, sdu); break
     case "READFILE" : response = await READFILE(PAYLOAD, OID, sdu); break
     default: response = defopera(OPERA);
  };
  return response;
}
