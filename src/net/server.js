
import { createServer } from "node:http";
import handleRequests from "./www/handleRequest.js";
import { WebSocketServer } from "ws";
import handleSapiRequests from "./sapi/handleRequests.js";
import url from "node:url";
import { join } from "node:path";
import { GSYSTEM, GOUTFORMAT, GPATHS } from "../var/system.js";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import execBrowser from "./www/openBrower.js";

export default function Server(sdu) {
  
  const onServerStart = () => {
     const port  = www.address().port;
     const serviceId = `${port}xS${(Math.floor(Math.random() * 100000))}`;
     while (!existsSync(GPATHS.serviceLog)) {
       mkdirSync(GPATHS.serviceLog, { recursive: true });
     }
     writeFileSync(join(GPATHS.serviceLog,serviceId),JSON.stringify(sdu,"",4));
     sdu.serviceId = serviceId;
     sdu.servicePort = port;

     const stdout = [
        `grand code environment(GCE) ${GSYSTEM.version}, serviceOptions -:`,
        `${GOUTFORMAT.tabA}absolute(0) ${sdu.servicePath}`,
        `${GOUTFORMAT.tabA}temp = ${sdu.isTemporary}`,
        `service gcce options -:`,
        `${GOUTFORMAT.tabA}absolute(1) ${sdu.serviceGcce.abs}`,
        `${GOUTFORMAT.tabA}name = ${sdu.serviceGcce.name}, version = ${sdu.serviceGcce.version}`,
        `service NET options -:`,
        `${GOUTFORMAT.tabA}inet = ${www.address().address}/lo, fixed`,
        `${GOUTFORMAT.tabA}family = ${www.address().family}`,
        `${GOUTFORMAT.tabA}port = ${port}, type = registered`,
        `\x1b[33mservice started running on http://localhost:${port}\x1b[0m`
     ];
     stdout.forEach(c => console.log(c));
     execBrowser(`http://localhost:${port}`);
  };

  const www = createServer((req,res) => handleRequests(req, res, sdu.serviceGcce));
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
