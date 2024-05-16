
import { createServer } from "node:http";
import handleRequests from "./www/handleRequest.js";
import { WebSocketServer } from "ws";
import handleSapiRequests from "./sapi/handleRequests.js";
import url from "node:url";
import { join } from "node:path";
import { GSYSTEM, GOUTFORMAT, GPATHS } from "../var/system.js";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import Cache from "../etc/cache.js";
import execGcce from "./www/execGcce.js";

export default function Server(sdu) {
  
  const onServerStart = () => {
     const port  = www.address().port;
     const serviceId = `${port}xS${(Math.floor(Math.random() * 100000))}`;
     while (!existsSync(GPATHS.serviceLog)) {
       mkdirSync(GPATHS.serviceLog, { recursive: true });
     }
     sdu.createdAt = new Date();
     sdu.serviceId = serviceId;
     sdu.servicePort = port;
     sdu.Pid = process.pid;
     const pathToServiceLog = join(GPATHS.serviceLog,serviceId);
     writeFileSync(pathToServiceLog,JSON.stringify(sdu,"",4));

     const stdout = [
        `grand code environment(GCE) ${GSYSTEM.version}, serviceOptions -:`,
        `${GOUTFORMAT.tabA}\x1b[93mabsolute(0) ${sdu.servicePath}`,
        `${GOUTFORMAT.tabA}temp = ${sdu.isTemporary}\x1b[0m\n`,
        `service gcce options -:`,
        `${GOUTFORMAT.tabA}\x1b[93mabsolute(1) ${sdu.serviceGcce.abs}`,
        `${GOUTFORMAT.tabA}name = ${sdu.serviceGcce.name}, version = ${sdu.serviceGcce.version}\x1b[0m\n`,
        `service NET options -:`,
        `${GOUTFORMAT.tabA}\x1b[93minet = ${www.address().address}/lo, fixed`,
        `${GOUTFORMAT.tabA}family = ${www.address().family}`,
        `${GOUTFORMAT.tabA}port = ${port}, type = registered\x1b[0m\n`,
        `service started running on http://localhost:${port}\n`
     ];
     stdout.forEach(c => console.log(c));
     Cache.handleUpload(pathToServiceLog);
     Cache.handleStackUpload();
     execGcce(sdu.serviceGcce, port);
  };

  const www = createServer((req,res) => {
    let cbParams = sdu.serviceGcce;
    cbParams['serviceId'] = sdu.serviceId;
    handleRequests(req, res, sdu.serviceGcce);
  });
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws) => { handleSapiRequests(ws, sdu) });
 
  www.on("upgrade", (request, socket, head) => {
  const { pathname } = url.parse(request.url);
  if (pathname === "/sapi") {
     wss.handleUpgrade(request, socket, head, (ws) => {
       wss.emit("connection", ws);
     });
   } else socket.destroy();
  });

  www.listen(sdu.servicePort, onServerStart);
} 