// Builds the ONE-FILE mockup (hx-mockup.html, the page published as the artifact) from the parts of docs/hmi/hx/, and checks the
// pages: every value key, machine, loop and valve of hx-pages.js must be in hx-registry.js (= bound by the app today), and it
// prints what of the registry is on no page. Usage: node docs/hmi/hx/tools/build.mjs   (exit 1 when a page names something unknown)
//   --list                     also print every loop / machine that is on no page yet
//   --only=hx-page-x.js --out=/some/folder/preview.html
//                              preview of ONE page file while it is being drawn (does not touch hx-mockup.html)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = f => fs.readFileSync(path.join(dir, f), 'utf8');
/* ONE style only (user 2026-11-17: "dapat sa hmi pages, ayan yung nakikita, wala na ibang style"): the mockup holds the
   realistic pages. hx-pages.js (the 23 earlier summary pages, line symbols of hx-sym.js) is no longer in it: it stays in the
   folder as the list of what each system holds, and its page titles are shown in the rail as "to be drawn". */
const ARGS = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
/* every hx-page-*.js of the folder is a page of the mockup; ORDER = the order of the rail (others follow by name) */
const ORDER = ['hx-page-reheat.js', 'hx-page-boiler-steam.js', 'hx-page-feedwater.js', 'hx-page-condensate.js', 'hx-page-furnace-gas.js', 'hx-page-combustion-air.js', 'hx-page-coal.js', 'hx-page-limestone-sand.js', 'hx-page-ash.js', 'hx-page-sampling.js', 'hx-page-overview.js', 'hx-page-oil-burners.js', 'hx-page-aux-steam.js', 'hx-page-extraction.js', 'hx-page-turbine-oil.js', 'hx-page-sea-water.js', 'hx-page-makeup-cooling.js', 'hx-page-turbine.js', 'hx-page-purge-trip.js', 'hx-page-generator.js', 'hx-page-sootblowers.js', 'hx-page-compressed-air.js'];
const found = fs
  .readdirSync(dir)
  .filter(f => /^hx-page-.+\.js$/.test(f))
  .sort();
const REAL_PAGES = ARGS.only
  ? [ARGS.only]
  : [...ORDER.filter(f => found.includes(f)), ...found.filter(f => !ORDER.includes(f))];
if (ARGS.only && !ARGS.out) throw new Error('--only needs --out=<file.html>');
const parts = [
  'hx-real.js',
  'hx-core.js',
  'hx-cards-ui.js',
  'hx-registry.js',
  'hx-cards.js',
  'hx-sample.js',
  ...REAL_PAGES
];

/* ---- check ---- */
const win = { location: { hash: '' } };
const ctx = vm.createContext({
  window: win,
  console,
  document: { createElement: () => ({ style: {}, append() {}, set textContent(v) {} }), head: { append() {} } },
  setInterval: () => 0,
  Date,
  Math,
  JSON,
  Object,
  Array,
  String,
  Number,
  isFinite,
  Infinity,
  Set,
  Error
});
for (const f of ['hx-sym.js', 'hx-real.js', 'hx-core.js', 'hx-registry.js'])
  vm.runInContext(rd(f) + '\n;globalThis.HX=window.HX;globalThis.HXREG=window.HXREG;', ctx, { filename: f });
for (const f of REAL_PAGES) vm.runInContext(rd(f), ctx, { filename: f });
const HX = win.HX,
  R = win.HXREG;
/* the systems still to be drawn in the realistic look: the titles of the earlier summary pages (their old summary of the
   reheat system is replaced by the realistic page) */
const done = new Set(HX.pages.map(p => p.id));
const realPages = HX.pages.slice();
vm.runInContext(rd('hx-pages.js'), ctx, { filename: 'hx-pages.js' });
const soon = HX.pages
  .filter(p => !done.has(p.id) && p.id !== 'reheat-bypass')
  .map(p => ({ id: p.id, group: p.group, title: p.title }));
HX.pages.length = 0;
HX.pages.push(...realPages);
for (const k of Object.keys(HX.byId)) if (!done.has(k)) delete HX.byId[k];
const soonIds = new Set(soon.map(p => p.id));
/* value keys the app binds that no temporary page showed, so tools/make-registry.py does not list them (each one checked in
   the running app): TCS-AI1001 = the target load of the turbine control system, 151.0 MW at 150 MW (old UNIT page) */
const EXTRA = new Set(['TCS-AI1001']);
const bad = [],
  used = { m: new Set(), l: new Set(), v: new Set(), k: new Set() };
const key = (p, k) => {
  const m = /^(pv|sv|mv):(.+)$/.exec(k);
  if (m) {
    if (!(m[2] in R.loops)) bad.push(`${p}: loop ${m[2]} of key ${k}`);
    return;
  }
  used.k.add(k);
  if (!(k in R.sample.values) && !EXTRA.has(k)) bad.push(`${p}: value key ${k}`);
};
for (const p of HX.pages) {
  const items = p.plan ? p.plan.items : p.lanes.flatMap(l => l.items.flatMap(i => (Array.isArray(i) ? i : [i])));
  for (const t of (p.plan && p.plan.taps) || []) for (const k of [t.key, t.key2]) if (k) key(p.id + ' tap', k);
  for (const t of (p.plan && p.plan.texts) || []) if (t.key) key(p.id + ' text', t.key);
  for (const it of items) {
    if (!win.HXSYM[it.sym] && !(win.HXREAL && win.HXREAL[it.sym]) && it.k !== 'link' && it.k !== 'hook' && it.k !== 'ats')
      bad.push(`${p.id}: symbol ${it.sym}`);
    if (it.k === 'link' && !HX.byId[it.to] && !soonIds.has(it.to)) bad.push(`${p.id}: link to ${it.to}`);
    if (it.go && !HX.byId[it.go]) bad.push(`${p.id}: go ${it.go}`);
    if (it.k === 'mach') it.mach in R.machines ? used.m.add(it.mach) : bad.push(`${p.id}: machine ${it.mach}`);
    if (it.k === 'loop') it.loop in R.loops ? used.l.add(it.loop) : bad.push(`${p.id}: loop ${it.loop}`);
    if (it.k === 'valve')
      it.valve in R.machines || it.valve in R.sample.valves
        ? used.v.add(it.valve)
        : bad.push(`${p.id}: valve ${it.valve}`);
    for (const v of it.vals || []) key(p.id, v.key);
  }
  for (const x of p.loops || []) x[0] in R.loops ? used.l.add(x[0]) : bad.push(`${p.id}: loop ${x[0]}`);
  for (const x of p.machines || []) x[0] in R.machines ? used.m.add(x[0]) : bad.push(`${p.id}: machine ${x[0]}`);
  for (const x of p.valves || [])
    x[0] in R.machines || x[0] in R.sample.valves ? used.v.add(x[0]) : bad.push(`${p.id}: valve ${x[0]}`);
  for (const g of p.trends || []) for (const pen of g.pens) key(p.id + ' trend', pen[1]);
}
const noPage = {
  loops: Object.keys(R.loops).filter(k => !used.l.has(k)),
  machines: Object.keys(R.machines).filter(k => !used.m.has(k) && !used.v.has(k))
};
const cover = `pages ${HX.pages.length} · loops on a page ${used.l.size} of ${Object.keys(R.loops).length} · machines and valves on a page ${Object.keys(R.machines).length - noPage.machines.length} of ${Object.keys(R.machines).length} · value keys used ${used.k.size} of ${Object.keys(R.sample.values).length}`;
console.log(cover);
if (ARGS.list !== undefined) {
  if (noPage.loops.length) console.log('loops on NO page:', noPage.loops.join(', '));
  if (noPage.machines.length) console.log('machines / valves on NO page:', noPage.machines.join(', '));
}
if (bad.length) {
  console.error('UNKNOWN in hx-registry.js (not bound by the app today):\n  ' + bad.join('\n  '));
  process.exit(1);
}

/* ---- README.md -> the "For the next coder" page (headings, lists, code, tables of the README only) ---- */
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inl = s =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
function md(src) {
  const out = [];
  let list = null,
    code = null;
  const close = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  for (const ln of src.split(/\r?\n/)) {
    if (code != null) {
      if (/^```/.test(ln)) {
        out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
        code = null;
      } else code.push(ln);
      continue;
    }
    if (/^```/.test(ln)) {
      close();
      code = [];
      continue;
    }
    let m;
    if ((m = /^(#{1,3})\s+(.*)/.exec(ln))) {
      close();
      out.push(`<h${m[1].length + 1}>${inl(m[2])}</h${m[1].length + 1}>`);
    } else if ((m = /^\s*[-*]\s+(.*)/.exec(ln))) {
      if (list !== 'ul') (close(), out.push('<ul>'), (list = 'ul'));
      out.push('<li>' + inl(m[1]) + '</li>');
    } else if ((m = /^\s*\d+\.\s+(.*)/.exec(ln))) {
      if (list !== 'ol') (close(), out.push('<ol>'), (list = 'ol'));
      out.push('<li>' + inl(m[1]) + '</li>');
    } else if (!ln.trim()) close();
    else {
      close();
      out.push('<p>' + inl(ln) + '</p>');
    }
  }
  close();
  return out.join('\n');
}
const doc = md(rd('README.md'));

const html = `<title>LMYP HMI SHELL</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans+Condensed:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
<style>
${rd('hx.css')}
body { background: var(--hx-bg); color: var(--hx-ink); font-family: var(--hx-font); }
.wrap { padding-block: 12px 28px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); max-width: 1760px; margin: 0 auto; }
.top { display: flex; flex-wrap: wrap; gap: 4px 16px; align-items: baseline; margin: 0 2px 10px; }
.top h1 { font: 600 20px/1.2 var(--hx-cond); letter-spacing: 0.04em; margin: 0; }
.top p { margin: 0; font-size: 12.5px; color: var(--hx-mute); }
.top .tag { font: 600 11px var(--hx-font); padding: 2px 8px; border-radius: 99px; background: var(--hx-warn-bg); color: var(--hx-warn); border: 1px solid var(--hx-warn); }
.doc { background: var(--hx-panel); border: 1px solid var(--hx-rule); border-radius: 10px; padding: 8px 22px 22px; max-width: 900px; font-size: 14px; line-height: 1.55; }
.doc h2 { font: 600 20px/1.2 var(--hx-cond); margin: 18px 0 6px; }
.doc h3 { font: 600 16px/1.25 var(--hx-font); margin: 20px 0 6px; padding-top: 12px; border-top: 1px solid var(--hx-rule); }
.doc h4 { font: 600 14px var(--hx-font); margin: 14px 0 4px; }
.doc p, .doc li { max-width: 70ch; }
.doc ul, .doc ol { padding-left: 22px; margin: 6px 0; }
.doc li { margin: 3px 0; }
.doc code { font: 500 12.5px var(--hx-mono); background: var(--hx-panel2); border: 1px solid var(--hx-rule); border-radius: 4px; padding: 0 4px; }
.doc pre { background: var(--hx-panel2); border: 1px solid var(--hx-rule); border-radius: 8px; padding: 10px 12px; overflow-x: auto; }
.doc pre code { border: 0; background: none; padding: 0; font-size: 12px; line-height: 1.5; }
</style>
<div class="wrap">
  <div class="top"><h1>LMYP #1 HMI SHELL</h1><span class="tag">Mockup · sample data</span><p>One look for every page: the plant as it stands, cut open, with every valve, spray, drain pot and transmitter on its own line. The systems still to be drawn in this look are listed grey in the rail. Values are what the app showed at 150 MW (3.2.3-beta.272); the small ripple is only so the trends move.</p></div>
  <div id="hx"></div>
</div>
<template id="doc"><div class="doc">${doc}</div></template>
<script>
${parts.map(rd).join('\n')}
HX.soon = ${JSON.stringify(ARGS.only ? [] : soon)};
HX.shell(document.getElementById('hx'), {
  strip: [['Load', 'GCP-AI1001', 'MW'], ['Steam pressure', 'PT-MS1002', 'kg/cm²'], ['Steam temperature', 'pv:TICMS1004', '°C', 0], ['Steam flow', 'FT-MS1031', 't/h'], ['Reheat temperature', 'TT-HR1002-1', '°C', 0], ['Drum level', 'pv:LICBR1001B', 'mm', 0], ['Bed temperature', 'TT-FG1090', '°C', 0], ['Furnace pressure', 'PT-FG1085', 'mmH₂O', 0], ['Coal flow', 'pv:FIC-CM', 't/h'], ['Total air flow', 'ABC-002|SI0060', 't/h']],
  start: ${JSON.stringify(realPages[0].id)},
  extra: [{ id: 'next-coder', group: 'Handoff', title: 'For the next coder', render: () => document.getElementById('doc').content.cloneNode(true).firstElementChild }]
});
</script>
`;
const outFile = ARGS.out ? path.resolve(ARGS.out) : path.join(dir, 'hx-mockup.html');
fs.writeFileSync(outFile, html);
console.log('built', ARGS.out ? outFile : 'hx-mockup.html', html.length, 'bytes');
