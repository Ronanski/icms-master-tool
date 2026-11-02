// The radio (3.2.0 Web Worker, stage c: src/world/eng.js + src/analog/engine/sync.js), in node only: two engines, A = the engine (as the
// worker will run it), B = the mirror of the page. B starts from the keyframe of A (ABC + DITL); then A scans and sends what changed,
// B takes it; the operator works on B only (a mode press = an action, the output of a MAN station = a write, a DITL push button =
// a write; Reset of the ABC and the DITL, Start at 150 MW = actions); everything reaches A through the radio. After every scan A and B must hold the same state (0 differences in every ABC
// value, input, block state, unit model number, DITL net, gate, input, W.out, motor / valve).
// Usage: node tests/regress/eng_radio.js
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
(async () => {
  const A = mk(), B = mk();
  A.AN.plantLoad150();
  A.ctx.DITL150.apply();
  for (let k = 0; k < 20; k++) { A.ctx.ENGINE.E.stepSet(A.C1, 0.5); A.WORLD.tick(0.5); }
  /* the start: the keyframe of the engine into the page */
  B.AN.i = A.AN.i;
  B.AN.engState.apply(JSON.parse(JSON.stringify(A.AN.engState.capture())));
  B.DITL.ditlApply(JSON.parse(JSON.stringify(A.DITL.ditlCapture())));
  /* the port: messages as the worker gets them (structured clone), delivered in order */
  const toA = [], toB = [];
  A.ENG.start('engine', { postMessage: m => toB.push(structuredClone(m)) });
  B.ENG.start('mirror', { postMessage: m => toA.push(structuredClone(m)) });
  let c = cmp(A.dump(), B.dump());
  ck(c.n === 0, 'keyframe of the engine into the page: ' + c.n + ' differences of ' + c.len + ' records' + (c.n ? '\n   ' + c.ex.join('\n   ') : ''));
  let bad = -1, worst = null, tp = 0, kb = 0;
  const S50 = n => n.AN.sheets.find(s => s.name === 'ABC-050');
  for (let k = 0; k < 80; k++) {
    /* the engine takes the operator's messages before its scan */
    while (toA.length) await A.ENG.onMsg(toA.shift());
    A.ctx.ENGINE.E.stepSet(A.C1, 0.5);
    A.WORLD.tick(0.5);
    const t0 = Date.now();
    A.ENG.send();
    tp += Date.now() - t0;
    while (toB.length) { const m = toB.shift(); kb += JSON.stringify(m).length / 1024; await B.ENG.onMsg(m); }
    /* the operator, on the page only */
    if (k === 10) B.AN.latchMode('PICMS1006', 'MAN');
    if (k === 12) {
      const c = B.AN.hmiCtrls(S50(B).S).find(x => x.tag === 'PICMS1006');
      if (c.manBlk && S50(B).S.rt.st[c.manBlk.id]) S50(B).S.rt.st[c.manBlk.id].val = 20; else S50(B).S.rt.ext[c.manNet] = 20;
      B.AN.settle();
    }
    if (k === 30) {
      /* a DITL push button held for a scan (DITL-15 row 12: a CRT row of the drawing) */
      const s = B.DITL.S.sheets.find(x => /DITL-15$/.test(x.name));
      s.sig['11:S'] = true;
    }
    if (k === 32) delete B.DITL.S.sheets.find(x => /DITL-15$/.test(x.name)).sig['11:S'];
    if (k === 50) B.AN.latchMode('PICMS1006', 'AUTO');
    /* Reset of the ABC and of the DITL from the page, then Start at 150 MW */
    if (k === 60) {
      B.AN.reset();
      B.ctx.ditlStates();
    }
    if (k === 62) B.AN.plantLoad150();
    /* the operator's writes leave at the next message (here: now) */
    B.ENG.flush();
    while (toA.length) await A.ENG.onMsg(toA.shift());
    A.ENG.send();
    while (toB.length) await B.ENG.onMsg(toB.shift());
    c = cmp(A.dump(), B.dump());
    if (c.n && bad < 0) { bad = k; worst = c; }
  }
  const hp = S50(A).S.rt.v;
  void hp;
  ck(bad < 0, '80 scans, the operator on the page (mode press, MAN output 20 %, settle, DITL push button, AUTO, Reset ABC + DITL, Start at 150 MW): ' + (bad < 0 ? '0 differences after every scan' : 'first difference after scan ' + bad + ': ' + worst.n + '\n   ' + worst.ex.join('\n   ')));
  console.log('   patch ' + (tp / 80).toFixed(1) + ' ms / scan, ' + (kb / 80).toFixed(0) + ' kB / scan');
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
