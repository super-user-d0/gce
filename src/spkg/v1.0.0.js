"use strict";

import * as quickh from "./helpers/quick.h.js";
import acfco from "./helpers/acfco.h.js";
import asciiTable from "./helpers/asciitable.h.js";
import Cache from "../etc/cache.js";
import { existsAsync } from "../etc/existsAsync.js";
import { fileWrite } from "../net/sapi/io/write.js";
import { freemem } from "node:os";
import { join } from "node:path";
import osPathLists from "./helpers/ospath.h.js";
import { readFile, rm } from "node:fs/promises";
import { SYSTEM, PATHS } from "../var/system.js";

export function add(...operands) {
  return operands.reduce((acum, elem) => acum + Number(elem), 0);
}
export function sub(...operands) {
  return operands
    .slice(1)
    .reduce((acum, elem) => acum - Number(elem), Number(operands[0]));
}
export function div(x, y) {
  x = Number(x);
  y = Number(y);
  return x / y;
}
export function multiply(x, y) {
  x = Number(x);
  y = Number(y);
  return x * y;
}
export function mod(x, y) {
  x = Number(x);
  y = Number(y);
  return x % y;
}
export function pow(x, y) {
  return Math.pow(x, y);
}
export function uint(bits) {
  bits = Number(bits);
  const size = pow(2, bits) - 1;
  if (bits === 8 || bits === 16 || bits === 32) return `0 - ${size}`;
  else if (bits === 64) return `0 - 18446744073709551615`;
  else return "out of range";
}
export function int(bits) {
  bits = Number(bits);
  let size = pow(2, bits);
  if (bits === 8 || bits === 16 || bits === 32)
    return `-${size / 2} - ${size / 2 - 1}`;
  else if (bits === 64) return `-9223372036854775808 - 9223372036854775807`;
  else return "out of range";
}

export function bytes(bit) {
  bit = Number(bit);
  return div(bit, 8).toFixed(2);
}
export const free = hmr(freemem());
export const defDirSize = hmr(4096);

export async function marshal(json) {
  try {
    return JSON.stringify(JSON.parse(json), 0, 3);
  } catch (error) {
    return error.message;
  }
}

export function hmr(bytes) {
  bytes = Number(bytes);
  const s = 1024; //s as in representing size per kb.
  if (bytes < s) return `${bytes}B`;
  else if (bytes < pow(s, 2)) return `${(bytes / pow(s, 1)).toFixed(2)} KB`;
  else if (bytes < pow(s, 3)) return `${(bytes / pow(s, 2)).toFixed(2)} MB`;
  else if (bytes < pow(s, 4)) return `${(bytes / pow(s, 3)).toFixed(2)} GB`;
  else if (bytes < pow(s, 5)) return `${(bytes / pow(s, 4)).toFixed(2)} TB`;
  else return "out of range";
}

export function osPath(os = "", pathName) {
  os = os.toLowerCase();
  if (os === "mac" || os === "windows" || os === "linux") {
    const response = osPathLists[os][pathName];
    return response ?? "cannnot determine path";
  } else return "unsupported os";
}

export const ascii = asciiTable;
export const ansiCodesForColouredOutput = acfco;

export function hex(deci) {
  deci = Number(deci);
  if (
    String(deci) !== "NaN" &&
    !String(deci).startsWith("-") &&
    !String(deci).includes(".")
  ) {
    const hexNo = 16;
    const hexTable = {
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
      10: "A",
      11: "B",
      12: "C",
      13: "D",
      14: "E",
      15: "F",
    };
    let current = deci;
    let remainders = [];
    if (deci !== 0) {
      while (current !== 0) {
        const remainder = current % hexNo;
        remainders.push(hexTable[remainder]);
        current = Math.floor(current / hexNo);
      }
      return remainders.reverse().join("");
    } else return "0";
  } else {
    return "Not A Whole Number";
  }
}

export function deci(hex) {
  hex = hex?.split("") ?? [];
  const hexReverseTable = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
  };
  const hexNo = 16;
  const remainders = hex.reverse().map((elem, index) => {
    return hexReverseTable[elem] * pow(hexNo, index);
  });
  if (!remainders.includes(NaN)) {
    return remainders.reduce((elem, acum) => elem + acum, 0);
  } else return "Cannot Convert A None Hex To Deci";
}

export function bin(deci) {
  deci = Number(deci);
  if (
    String(deci) !== "NaN" &&
    !String(deci).startsWith("-") &&
    !String(deci).includes(".")
  ) {
    const binNo = 2;
    let current = deci;
    const remainders = [];
    while (current !== 0) {
      remainders.push(mod(current, binNo));
      current = Math.floor(current / binNo);
    }
    return remainders.reverse().join("");
  } else return "Not A Whole Number";
}

export function rgb(hex) {
  if (hex.length === 6) {
    hex = hex.split("");
    const arrRep = [hex[0] + hex[1], hex[2] + hex[3], hex[4] + hex[5]];
    return `rgb(${deci(arrRep[0])},${deci(arrRep[1])},${deci(arrRep[2])})`;
  } else return "Expected 6 characters for hex";
}

export async function quick(path, key) {
  try {
    const contentToWrite = quickh[key];
    if (contentToWrite) {
      await fileWrite(path, contentToWrite);
      return true;
    } else throw { message: "NO PLACEHOLDER" };
  } catch (error) {
    throw error;
  }
}

export async function end(sdu, throwErrToCaller) {
  // remove service log =>  path: serviceLogPath + serviceId
  // remove trash => path:  trashPath + serviceId
  // if temp then wipe temp data => path: servicePath
  // empty cache
  // kill the process => pid: sdu.Pid

  const { serviceId, servicePath, Pid } = sdu;
  const logPath = join(PATHS.serviceLog, serviceId);
  const trashPath = join(PATHS.trash, serviceId);
  const rmOptions = { retryDelay: 200, recursive: true };
  await rm(logPath, rmOptions);
  if (await existsAsync(trashPath)) await rm(trashPath, rmOptions);
  if (sdu.isTemporary) await rm(servicePath, rmOptions);
  Cache.clear();
  if (throwErrToCaller) {
    try {
      process.kill(Pid);
    } catch (error) {
      throw { error };
    }
  } else {
    process.kill(Pid);
  }
  return void 0;
}

export async function getTechStack(extensive) {
  try {
    const stackPath = join(PATHS.stack, ".gcestack");
    if (await existsAsync(stackPath)) {
      const contents = JSON.parse(await readFile(stackPath, SYSTEM.encoding));
      const techs = Object.keys(contents);
      let rankings = [];
      techs.forEach((elem) => {
        rankings.push({
          tech: elem,
          score: contents[elem],
        });
      });
      rankings = rankings.sort((a, b) => b.score - a.score);
      if (!extensive) {
        rankings = rankings.slice(0, 3);
      }
      // calculate rankings percentage.
      const whole = rankings.reduce((accum, elem) => accum + elem.score, 0);
      rankings = rankings.map((elem) => {
        return {
          tech: elem.tech,
          percentage: Math.round((elem.score / whole) * 100),
        };
      });
      return rankings;
    } else {
      return [];
    }
  } catch (error) {
    return error.message;
  } //log as plain text.
}
