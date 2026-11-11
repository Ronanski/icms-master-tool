#!/usr/bin/env node
/* Operator text check (Mina B79-2, beta.84): no team or build name in any string the operator reads.
   Reads every string literal of the Training sources, comments skipped. Names in comments are fine. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const FILES = ['src/ui/training/guide.js', 'src/ui/training/live.js', 'src/ui/training/dock.js'];
const BAD = /\b(Mina|Jennie|Chaewon|Lisa|Sakura|Yuna|Giselle|Karina|Ros[eé]|Winter|Ningning)\b|\bbeta\.\d+|\bB\d{2,3}-\d\b/;

function strings(src) {
  const out = [];
  let i = 0, line = 1, prev = '';
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? n : e + 2; line += (src.slice(i, end).match(/\n/g) || []).length; i = end; continue; }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && /[(,=:[!&|?{};+\-*%<>~^]|^$/.test(prev)) { /* regex literal */
      i++; let cls = false;
      while (i < n && src[i] !== '\n') { const r = src[i]; if (r === '\\') { i += 2; continue; } if (r === '[') cls = true; else if (r === ']') cls = false; else if (r === '/' && !cls) break; i++; }
      i++; while (i < n && /[a-z]/i.test(src[i])) i++; prev = 'x'; continue;
    }
    if (c === '\'' || c === '"' || c === '`') {
      const q = c, l0 = line; let s = ''; i++;
      while (i < n && src[i] !== q) { if (src[i] === '\\') { s += src[i + 1]; i += 2; continue; } if (src[i] === '\n') line++; s += src[i]; i++; }
      i++; out.push({ line: l0, s }); prev = 'x'; continue;
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out;
}

let bad = 0;
for (const f of FILES) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  for (const { line, s } of strings(src)) {
    const m = s.match(BAD);
    if (m) { bad++; console.log(`${f}:${line}: "${m[0]}" in operator text: ${s.slice(0, 140)}`); }
  }
}
if (bad) { console.log(`${bad} operator text(s) carry a team or build name`); process.exit(1); }
console.log('operator text ok');
