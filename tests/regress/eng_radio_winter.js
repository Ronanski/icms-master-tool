// The radio (3.2.0 Web Worker, stage c), Winter's part: the dock press (src/world/dock-eng.js WORLD.dpress / WORLD.dset) done on the
// mirror of the page (B) reaches the engine (A) and both hold the same state. A copy of tests/regress/eng_radio.js: B starts from the
// keyframe of A (150 MW), the one world runs (WORLD.live), A scans and sends what changed; the operator works on B only: START of the
// A-AUX. COOLING WATER PUMP (DITL-76 row 2 START PB, output row 5 RUNNING), a press again at once (it waits one scan), a maintained
// selection (DITL-78 row 1), STOP (DITL-76 row 18). After every scan: 0 differences (every ABC value, input, block state, unit model
// number, DITL net, gate, input, W.out, motor / valve) and, with --slot, the same press state (WORLD._press / _rel).
// Usage: node tests/regress/eng_radio_winter.js [--slot]   (--slot: WORLD.live, _press, _rel in the DITL globals slot, DITL_W)
const fs = require('fs'), vm = require('vm'), zlib = require('zlib'), path = require('path');
const { worldBundle } = require('../../tools/build/engine-bundle.js');
const SLOT = process.argv.includes('--slot');
let code = worldBundle();
/* dock-eng.js after eng.js (the template and the engine bundle list get it from Lisa) */
if (!/src\/world\/dock-eng\.js/.test(code)) code += '\n' + fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'world', 'dock-eng.js'), 'utf8');
if (SLOT && !/DITL_W = \[[^\]]*'_press'/.test(code)) code = code.replace("DITL_W = ['out', '_o', 'tk', '_ck', 'busy']", "DITL_W = ['out', '_o', 'tk', '_ck', 'busy', 'live', '_press', '_rel']");
const gz = f => zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'data', f), 'utf8').trim(), 'base64')).toString();
const DUMP = /const DUMP=`([\s\S]*?)`;/.exec(fs.readFileSync(path.join(__dirname, 'eng_world.js'), 'utf8'))[1];
const mk = () => {
  const ctx = { console: { log() {}, warn() {}, error: (...a) => console.log('ENGINE ERROR', ...a) }, structuredClone, setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, performance: { now: () => Date.now() }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, addEventListener() {}, msg() {}, atob: s => Buffer.from(s, 'base64').toString('binary') };
  ctx.globalThis = ctx; ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const { AN, DITL, WORLD } = ctx;
  AN.sheets = gz('apre.txt').split('\n').filter(Boolean).map(l => JSON.parse(l));
  AN.plantOn = true;
  for (const sh of AN.sheets) ctx.ENGINE.E.ensure(sh);
  AN.adesPut(JSON.parse(gz('ades.txt')));
  DITL.S = { sheets: gz('pre.txt').split('\n').filter(Boolean).map(l => JSON.parse(l)), cur: 0 };
  WORLD.set(true);
  AN.reset();
  DITL.ditlStates();
  const sh = nm => DITL.S.sheets.find(x => x.name.endsWith(nm));
  return { ctx, AN, DITL, WORLD, ENG: ctx.ENG, C1: AN.sheets.find(s => s.name === 'ABC-001C'), out: (nm, r) => { const o = WORLD.out && WORLD.out[sh(nm).name]; return o ? (o.has(r) ? 1 : 0) : null; } /* the outputs of the one world: a read only (DUI.outVal computes the sheet: it writes its nets on one side) */, sig: (nm, k) => !!sh(nm).sig[k], dump: () => vm.runInContext(DUMP, ctx)(AN, DITL.S.sheets, WORLD, DITL.MST, DITL.MS, DITL.DREG) };
};
let fail = 0;
const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
const cmp = (a, b) => { let n = 0; const ex = []; for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { n++; if (ex.length < 4) ex.push((a[i] || '').slice(0, 120) + ' <> ' + (b[i] || '').slice(0, 120)); } return { n, len: a.length, ex }; };
const pj = W => JSON.stringify([W._press || {}, W._rel || {}]);
(async () => {
  const A = mk(), B = mk();
  A.AN.plantLoad150();
  A.ctx.DITL150.apply();
  for (let k = 0; k < 20; k++) { A.ctx.ENGINE.E.stepSet(A.C1, 0.5); A.WORLD.tick(0.5); }
  /* the one world runs (in the app the engine scheduler sets it: WORLD.scanJob) */
  A.WORLD.live = true;
  B.AN.i = A.AN.i;
  B.AN.engState.apply(JSON.parse(JSON.stringify(A.AN.engState.capture())));
  B.DITL.ditlApply(JSON.parse(JSON.stringify(A.DITL.ditlCapture())));
  /* without the slot the page does not know it: set by hand */
  if (!SLOT) B.WORLD.live = true;
  const toA = [], toB = [];
  A.ENG.start('engine', { postMessage: m => toB.push(structuredClone(m)) });
  B.ENG.start('mirror', { postMessage: m => toA.push(structuredClone(m)) });
  ck(A.ENG.CALLS.WORLD.includes('dpress') && A.ENG.CALLS.WORLD.includes('dset') && !!A.WORLD.__eng_dpress && !!B.WORLD.__eng_dpress, 'WORLD.dpress / dset are engine calls (wrapped on both sides)');
  ck(B.WORLD.live === true, 'the page knows the one world runs (WORLD.live)');
  let c = cmp(A.dump(), B.dump());
  ck(c.n === 0, 'keyframe of the engine into the page: ' + c.n + ' differences of ' + c.len + ' records' + (c.n ? '\n   ' + c.ex.join('\n   ') : ''));
  ck(A.out('DITL-76', 4) === 0 && B.out('DITL-76', 4) === 0, 'A-AUX. CW PUMP not running at the start (DITL-76 row 5 = 0)');
  let bad = -1, worst = null, pbad = -1, pex = '';
  const seen = { pressA: 0, runA: -1, runB: -1, relA: -1, wait: 0, stopA: -1, selA: 0 };
  for (let k = 0; k < 60; k++) {
    while (toA.length) await A.ENG.onMsg(toA.shift());
    A.ctx.ENGINE.E.stepSet(A.C1, 0.5);
    A.WORLD.tick(0.5);
    A.ENG.send();
    while (toB.length) await B.ENG.onMsg(toB.shift());
    /* the operator, on the page only */
    if (k === 5) ck(B.WORLD.dpress('DITL-76', 1) === true, 'START PB pressed on the page: WORLD.dpress returns true');
    if (k === 20) B.WORLD.dpress('DITL-76', 1);
    if (k === 30) ck(B.WORLD.dset('DITL-78', 0, 1) === true, 'maintained selection on the page: WORLD.dset returns true');
    if (k === 40) B.WORLD.dpress('DITL-76', 17);
    B.ENG.flush();
    while (toA.length) await A.ENG.onMsg(toA.shift());
    if (k === 5) seen.pressA = A.sig('DITL-76', '1:S');
    if (k === 20) {
      const p = (A.WORLD._press || {})['(95)DITL-76|1:S'];
      seen.wait = p ? p.wait : 'none';
    }
    A.ENG.send();
    while (toB.length) await B.ENG.onMsg(toB.shift());
    if (k === 30) seen.selA = A.sig('DITL-78', '0:S') && B.sig('DITL-78', '0:S');
    if (seen.runA < 0 && A.out('DITL-76', 4) === 1) seen.runA = k;
    if (seen.runB < 0 && B.out('DITL-76', 4) === 1) seen.runB = k;
    if (seen.relA < 0 && k > 5 && k < 20 && !A.sig('DITL-76', '1:S')) seen.relA = k;
    if (seen.stopA < 0 && k > 40 && A.out('DITL-76', 4) === 0) seen.stopA = k;
    c = cmp(A.dump(), B.dump());
    if (c.n && bad < 0) { bad = k; worst = c; }
    if (SLOT && pbad < 0 && pj(A.WORLD) !== pj(B.WORLD)) { pbad = k; pex = pj(A.WORLD) + ' <> ' + pj(B.WORLD); }
  }
  ck(seen.pressA === true, 'the press reached the engine (DITL-76 row 2 START PB = 1 in A)');
  ck(seen.relA > 0, 'the engine released it after two scans (row 2 = 0 at scan ' + seen.relA + ')');
  ck(seen.runA > 0 && seen.runB === seen.runA, 'A-AUX. CW PUMP RUNNING in the engine at scan ' + seen.runA + ', on the page at scan ' + seen.runB);
  ck(seen.wait === false || seen.wait === true, 'a second press reached the engine (held: wait = ' + seen.wait + ')');
  ck(seen.selA === true, 'maintained selection DITL-78 row 1 = 1 in the engine and on the page');
  ck(seen.stopA > 40, 'STOP PB on the page stops the pump in the engine (RUNNING = 0 at scan ' + seen.stopA + ')');
  ck(bad < 0, '60 scans, the dock presses on the page: ' + (bad < 0 ? '0 differences after every scan' : 'first difference after scan ' + bad + ': ' + worst.n + '\n   ' + worst.ex.join('\n   ')));
  if (SLOT) ck(pbad < 0, 'press state WORLD._press / _rel the same on both sides after every scan' + (pbad < 0 ? '' : ': first at scan ' + pbad + '\n   ' + pex.slice(0, 300)));
  else console.log('   (without --slot the page keeps its own press state: page ' + pj(B.WORLD).slice(0, 200) + ' / engine ' + pj(A.WORLD).slice(0, 200) + ')');
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
