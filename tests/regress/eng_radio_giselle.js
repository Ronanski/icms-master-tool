// The radio, the ABC sheet and its panels (Worker stage (c), Giselle; a copy of eng_radio.js): A = the engine (the worker), B = the mirror
// of the page. Each operator action of the ABC sheet / panels / trace (src/analog/ui) is done on B only, each on a fresh pair started from
// the keyframe of A; after every scan A and B must hold the same state (0 differences), and the action must reach A.
// Actions: Next ▶ of the trace (AN.stepSet of the sheet on screen), FORCE / unforce of a wire + settle (panel.js setForce), the SV / MV
// written + settle (panel.js / interaction.js), a switch leg (panel.js swSet: st.fm) + settle, Reset (loader.js reset).
// The mode press (latchMode) is not here: its known difference is Lisa's (eng_radio.js).
// Usage: node tests/regress/eng_radio_giselle.js
const fs = require('fs'), vm = require('vm'), zlib = require('zlib'), path = require('path');
const { worldBundle } = require('../../tools/build/engine-bundle.js');
const code = worldBundle();
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
  return { ctx, AN, DITL, WORLD, ENG: ctx.ENG, C1: AN.sheets.find(s => s.name === 'ABC-001C'), dump: () => vm.runInContext(DUMP, ctx)(AN, DITL.S.sheets, WORLD, DITL.MST, DITL.MS, DITL.DREG) };
};
let fail = 0;
const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
const cmp = (a, b) => { let n = 0; const ex = []; for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { n++; if (ex.length < 4) ex.push((a[i] || '').slice(0, 120) + ' <> ' + (b[i] || '').slice(0, 120)); } return { n, len: a.length, ex }; };
const SH = 'ABC-050', TAG = 'PICMS1006';
async function pair() {
  const A = mk(), B = mk();
  A.AN.plantLoad150();
  A.ctx.DITL150.apply();
  A.AN.i = A.AN.sheets.findIndex(s => s.name === SH);
  for (let k = 0; k < 6; k++) { A.ctx.ENGINE.E.stepSet(A.C1, 0.5); A.WORLD.tick(0.5); }
  B.AN.i = A.AN.i;
  B.AN.engState.apply(JSON.parse(JSON.stringify(A.AN.engState.capture())));
  B.DITL.ditlApply(JSON.parse(JSON.stringify(A.DITL.ditlCapture())));
  const toA = [], toB = [];
  A.ENG.start('engine', { postMessage: m => toB.push(structuredClone(m)) });
  B.ENG.start('mirror', { postMessage: m => toA.push(structuredClone(m)) });
  return { A, B, toA, toB };
}
const sh = n => n.AN.sheets.find(s => s.name === SH);
const ctl = n => n.AN.hmiCtrls(sh(n).S).find(x => x.tag === TAG);
async function run(name, act, reached) {
  const { A, B, toA, toB } = await pair();
  let c = cmp(A.dump(), B.dump());
  if (c.n) return ck(false, name + ': keyframe ' + c.n + ' differences');
  let bad = -1, worst = null, got = null;
  for (let k = 0; k < 8; k++) {
    while (toA.length) await A.ENG.onMsg(toA.shift());
    A.ctx.ENGINE.E.stepSet(A.C1, 0.5);
    A.WORLD.tick(0.5);
    A.ENG.send();
    while (toB.length) await B.ENG.onMsg(toB.shift());
    if (k === 2) act(B);
    B.ENG.flush();
    while (toA.length) await A.ENG.onMsg(toA.shift());
    if (k === 2) got = reached(A, B);
    A.ENG.send();
    while (toB.length) await B.ENG.onMsg(toB.shift());
    c = cmp(A.dump(), B.dump());
    if (c.n && bad < 0) { bad = k; worst = c; }
  }
  ck(bad < 0 && got === true, name + ': ' + (got === true ? 'reached the engine' : 'NOT in the engine (' + got + ')') + ', ' + (bad < 0 ? '0 differences after every scan' : 'first difference after scan ' + bad + ' (action at scan 2): ' + worst.n + '\n   ' + worst.ex.join('\n   ')));
}
(async () => {
  const tSame = (A, B) => sh(A).S.rt.t === sh(B).S.rt.t || 't engine ' + sh(A).S.rt.t + ', page ' + sh(B).S.rt.t;
  /* trace.js stepFwd: Next ▶ of 0.5 s = 5 steps of 0.1 s of the sheet on screen (AN.stepN: engine/trace-step.js, one action) */
  await run('Next ▶ (trace)', B => { if (B.AN.stepN) B.AN.stepN(SH, 5, 0.1); else for (let i = 0; i < 5; i++) B.AN.stepSet(sh(B), 0.1); }, tSame);
  /* trace.js stepBack: the history of the page (the run time of the set), Next ▶ 0.5 s, then ◀ Back 0.3 s */
  if (!mk().AN.stepBack) ck(false, '◀ Back (trace): AN.stepN / AN.stepBack are not in the bundle yet (engine/trace-step.js: order.list, api.js, eng.js CALLS)');
  else
    await run('◀ Back (trace)', B => {
      const set = B.AN.actSet(sh(B)), t0 = sh(B).S.rt.t, rts = set.map(x => structuredClone(x.S.rt));
      B.AN.stepN(SH, 5, 0.1);
      B.AN.stepBack(set.map(x => x.name), rts, SH, t0 + 0.2);
    }, tSame);
  /* panel.js setForce: the force written, then settle */
  await run('FORCE the MAN output to 1 + settle', B => { sh(B).S.rt.force[ctl(B).manNet] = 1; B.AN.settle(); }, A => sh(A).S.rt.force[ctl(A).manNet] === 1 || 'no force');
  await run('FORCE then unforce + settle', B => { const n = ctl(B).manNet; sh(B).S.rt.force[n] = 1; B.AN.settle(); delete sh(B).S.rt.force[n]; B.AN.settle(); }, A => sh(A).S.rt.force[ctl(A).manNet] === undefined || 'still forced');
  /* panel.js / interaction.js: the SV typed (an input of the sheet), then settle */
  await run('SV written + settle', B => { const c = ctl(B); sh(B).S.rt.ext[c.q.sv] = 7.5; B.AN.settle(); }, A => sh(A).S.rt.ext[ctl(A).q.sv] === 7.5 || 'SV ' + sh(A).S.rt.ext[ctl(A).q.sv]);
  /* panel.js swSet: the leg of a switch (st.fm), then settle */
  await run('switch leg (st.fm) + settle', B => { const c = ctl(B), st = sh(B).S.rt.st[c.svSw.id]; st.fm = st.pk === 'A' ? 'B' : 'A'; B.AN.settle(); }, (A, B) => { const id = ctl(A).svSw.id; return sh(A).S.rt.st[id].fm === sh(B).S.rt.st[id].fm || 'fm engine ' + sh(A).S.rt.st[id].fm + ', page ' + sh(B).S.rt.st[id].fm; });
  /* loader.js reset */
  await run('Reset', B => B.AN.reset(), (A, B) => sh(A).S.rt.t === sh(B).S.rt.t || 't engine ' + sh(A).S.rt.t + ', page ' + sh(B).S.rt.t);
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
