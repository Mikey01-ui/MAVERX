// Extract the <style> block from a legacy mission HTML file and scope every
// rule under a mission wrapper class so it can be loaded globally in Next.js
// without colliding with other missions' CSS.
//
// Usage: node scripts/extract-mission-css.mjs <input.html> <scopeClass> <output.css>

import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, scopeClass, outputPath] = process.argv;
if (!inputPath || !scopeClass || !outputPath) {
  console.error("Usage: node extract-mission-css.mjs <input.html> <scopeClass> <output.css>");
  process.exit(1);
}

const html = readFileSync(inputPath, "utf8");
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) {
  console.error("No <style> block found");
  process.exit(1);
}
const css = styleMatch[1];

const scope = `.${scopeClass}`;

function scopeSelector(sel) {
  const s = sel.trim();
  if (!s) return s;
  // :root / html / body become the wrapper itself
  if (s === ":root" || s === "html" || s === "body" || s === "html, body") return scope;
  // html.foo → wrapper.foo (state classes applied to wrapper in React)
  if (/^html\./.test(s)) return scope + s.slice(4);
  if (/^body\./.test(s)) return scope + s.slice(4);
  // universal reset stays scoped to wrapper subtree
  if (s.startsWith("*")) return s.replace(/^\*/, `${scope}, ${scope} *`).replace(/, \*::(before|after)/g, `, ${scope} *::$1`);
  return `${scope} ${s}`;
}

function scopeSelectorList(list) {
  // handle the reset rule specially: "*, *::before, *::after"
  if (/^\s*\*\s*,\s*\*::before\s*,\s*\*::after\s*$/.test(list)) {
    return `${scope}, ${scope} *, ${scope} *::before, ${scope} *::after`;
  }
  return list
    .split(",")
    .map((sel) => scopeSelector(sel))
    .join(", ");
}

let out = "";
let i = 0;
const n = css.length;

function readUntil(chars) {
  let buf = "";
  while (i < n && !chars.includes(css[i])) buf += css[i++];
  return buf;
}

function readBlock() {
  // assumes css[i] === '{'; returns content including braces balanced
  let depth = 0;
  let buf = "";
  do {
    const c = css[i++];
    buf += c;
    if (c === "{") depth++;
    else if (c === "}") depth--;
  } while (i < n && depth > 0);
  return buf;
}

while (i < n) {
  // copy whitespace
  if (/\s/.test(css[i])) {
    out += css[i++];
    continue;
  }
  // comments
  if (css.startsWith("/*", i)) {
    const end = css.indexOf("*/", i);
    out += css.slice(i, end + 2);
    i = end + 2;
    continue;
  }
  // at-rules
  if (css[i] === "@") {
    const header = readUntil("{;");
    if (css[i] === ";") {
      out += header + css[i++];
      continue;
    }
    if (/^@(media|supports)/.test(header)) {
      // recurse into block: scope inner selectors
      const block = readBlock(); // includes outer braces
      const inner = block.slice(1, -1);
      // naive inner pass: selector { decls } pairs (no nested at-rules expected)
      let innerOut = "";
      let j = 0;
      while (j < inner.length) {
        if (/\s/.test(inner[j])) {
          innerOut += inner[j++];
          continue;
        }
        if (inner.startsWith("/*", j)) {
          const e = inner.indexOf("*/", j);
          innerOut += inner.slice(j, e + 2);
          j = e + 2;
          continue;
        }
        let selBuf = "";
        while (j < inner.length && inner[j] !== "{") selBuf += inner[j++];
        let depth = 0;
        let blockBuf = "";
        do {
          const c = inner[j++];
          blockBuf += c;
          if (c === "{") depth++;
          else if (c === "}") depth--;
        } while (j < inner.length && depth > 0);
        innerOut += scopeSelectorList(selBuf) + blockBuf;
      }
      out += header + "{" + innerOut + "}";
      continue;
    }
    // @keyframes, @font-face, @import: copy verbatim
    out += header + readBlock();
    continue;
  }
  // normal rule
  const sel = readUntil("{");
  const block = readBlock();
  out += scopeSelectorList(sel) + block;
}

writeFileSync(outputPath, out, "utf8");
console.log(`Wrote ${outputPath} (${out.length} bytes), scoped under ${scope}`);
