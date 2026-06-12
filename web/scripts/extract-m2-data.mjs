// Extract FILES / DISPUTES / VERIFY / DECOY_MSG from round2_v14 HTML and
// regenerate the corresponding blocks in lib/game/m2/data.ts (v14 parity).
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(process.argv[2], "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>\s*$/)?.[1] ?? html.split("<script>").pop();
const start = script.indexOf("const FILES");
const end = script.indexOf("/* ═══");
const dataChunk = script.slice(start, script.indexOf("const GS"));

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(dataChunk + "\nglobalThis.__out = { FILES, DISPUTES, DECOY_MSG, VERIFY };", sandbox);
const { FILES, DISPUTES, DECOY_MSG, VERIFY } = sandbox.__out;

const j = (v) => JSON.stringify(v, null, 2);

// FILES → Record<string, FileRecord>
let filesTs = "export const FILES: Record<string, FileRecord> = " + j(FILES) + ";";

// DISPUTES → keep fields used by the TS type (drop dqLabel/segId/lsId, those live in TOKEN_LEADS)
const disputes = DISPUTES.map(({ dqLabel, segId, lsId, ...d }) => d);
let disputesTs = "export const DISPUTES: Dispute[] = " + j(disputes) + ";";

let verifyTs = "export const VERIFY: Record<DisputeId, VerifyBlock> = " + j(VERIFY) + ";";

// DECOY_MSG values in v14 carry an "Atlas: " prefix used for sender parsing — strip it.
const decoy = Object.fromEntries(Object.entries(DECOY_MSG).map(([k, v]) => [k, v.replace(/^Atlas:\s*/, "")]));
let decoyTs = "export const DECOY_MSG: Record<string, string> = " + j(decoy) + ";";

// Splice into data.ts
const path = "lib/game/m2/data.ts";
let ts = readFileSync(path, "utf8");

function replaceBlock(src, startMarker, replacement) {
  const s = src.indexOf(startMarker);
  if (s === -1) throw new Error("marker not found: " + startMarker);
  // find the terminating "};" or "];" at column 0
  const tail = src.slice(s);
  const m = tail.match(/\n(\};|\];)/);
  if (!m) throw new Error("end not found for " + startMarker);
  const e = s + m.index + 1 + m[1].length;
  return src.slice(0, s) + replacement + src.slice(e);
}

ts = replaceBlock(ts, "export const FILES", filesTs);
ts = replaceBlock(ts, "export const DISPUTES", disputesTs);
ts = replaceBlock(ts, "export const VERIFY", verifyTs);
ts = replaceBlock(ts, "export const DECOY_MSG", decoyTs);

writeFileSync(path, ts, "utf8");
console.log("data.ts regenerated:",
  Object.keys(FILES).length, "files,",
  disputes.length, "disputes,",
  Object.keys(VERIFY).length, "verify blocks");
