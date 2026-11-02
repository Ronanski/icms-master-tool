// The radio (3.2.0 Web Worker, stage c), the DITL view (Ningning): a copy of eng_radio.js for the DITL clicks of the page
// (src/digital/parts/04 ~ 07, src/ui/shell/ditl.js). Three engines in node: A = the engine (worker), B = the mirror of the page,
// C = the reference (no radio: the same click put straight in, at the scan where A takes it). The operator works on B only, as the
// page does: a write waits for the next patch (ENG.onMsg flushes it), a wrapped action leaves at once. After every scan:
// A = B (the radio) and A = C (the click did in the engine what it does without a worker).
// Clicks: a push button press / release (07-app-events.js 152 / 229), an input switch (07 280, ditl.js 484), a user switch = the
// DITL FORCE circle (07 252), an analog row value (07 444 anAsk, ditl.js 871, 06-panels.js 191), the render of the page
// (simRead of every sheet between two patches: 04-render.js 64, ditl.js 986, ladder.js 20: read only in a mirror), the presets and
// buttons of the side panels (06-panels.js, ditl.js: the engine action ditlUser of parts/03e-user.js: timer preset, Skip, MOV
// stroke time, MOV LOCAL / REMOTE, motor feedback delay), Simulate off / on = the DITL Reset (07 347 SIM + ditlStates).
// Usage: node tests/regress/eng_radio_ningning.js
const fs = require('fs'), vm = require('vm'), zlib = require('zlib'), path = require('path');
const { worldBundle } = require('../../tools/build/engine-bundle.js');
/* parts/03e-user.js (the engine action ditlUser) is in the engine bundle once tools/build/engine-bundle.js takes the DITL parts up to
   it; until then it is added here */
const code0 = worldBundle();
const code = code0.includes('03e-user.js') ? code0 : code0 + ';\n' + fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'digital', 'parts', '03e-user.js'), 'utf8');
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
const cmp = (a, b) => { let n = 0; const ex = []; for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { n++; if (ex.length < 4) ex.push((a[i] || '').slice(0, 140) + ' <> ' + (b[i] || '').slice(0, 140)); } return { n, len: a.length, ex }; };
const scan = X => { X.ctx.ENGINE.E.stepSet(X.C1, 0.5); X.WORLD.tick(0.5); };
(async () => {
  const A = mk(), B = mk(), C = mk();
  A.AN.plantLoad150();
  A.ctx.DITL150.apply();
  for (let k = 0; k < 20; k++) scan(A);
  /* B and C start from the keyframe of A */
  const KA = JSON.stringify(A.AN.engState.capture()), KD = JSON.stringify(A.DITL.ditlCapture());
  for (const X of [B, C]) {
    X.AN.i = A.AN.i;
    X.AN.engState.apply(JSON.parse(KA));
    X.DITL.ditlApply(JSON.parse(KD));
    X.DITL.SIM = true;
  }
  A.DITL.SIM = true;
  /* DITL150.on is not in the keyframe (finding for the radio): the three take the engine's */
  B.ctx.DITL150.on = C.ctx.DITL150.on = A.ctx.DITL150.on;
  /* the engine action of the side panels (src/world/eng.js CALLS.G) */
  for (const X of [A, B]) if (!X.ENG.CALLS.G.includes('ditlUser')) X.ENG.CALLS.G.push('ditlUser');
  const toA = [], toB = [], sentB = [];
  A.ENG.start('engine', { postMessage: m => toB.push(structuredClone(m)) });
  B.ENG.start('mirror', { postMessage: m => { sentB.push(m); toA.push(structuredClone(m)); } });
  let c = cmp(A.dump(), C.dump());
  ck(c.n === 0, 'start: A = C: ' + c.n + ' differences of ' + c.len + ' records');
  /* the sheets of the clicks */
  const sh = (X, re) => X.DITL.S.sheets.find(x => re.test(x.name));
  const nm = re => sh(A, re).name;
  const by = (X, n) => X.DITL.S.sheets.find(x => x.name === n);
  const P15 = nm(/DITL-15$/);
  const FD = nm(/DITL-39$/); /* debris filter panels: the engine moves _fd / usw of this sheet every scan */
  const U = A.DITL.S.sheets.find(x => x.nl && (x.nl.usr || []).length && !/DITL-(16|18|39)$/.test(x.name));
  const AV = A.DITL.S.sheets.find(x => x.nl && (x.nl.an || []).length && x.avw);
  const TM = (() => {
    for (const x of A.DITL.S.sheets) for (const [i, g] of (x.nl ? x.nl.gates : []).entries()) if (g.t === 'TMR' && g.k === 'on' && g.st && g.st.out) return [x.name, i];
    return null;
  })();
  const MV = A.DITL.S.sheets.find(x => x.nl && (x.nl.mv || []).some(b => b.fb.some(f => f.ty === 'MIL' && f.mir < 0)));
  const MVj = MV ? MV.nl.mv.findIndex(b => b.fb.some(f => f.ty === 'MIL' && f.mir < 0)) : -1;
  const MT = A.DITL.S.sheets.find(x => x.nl && (x.nl.mot || []).length);
  console.log('   MOV ' + (MV && MV.name) + ' #' + MVj + ', motor ' + (MT && MT.name));
  console.log('   sheets: PB ' + P15 + ', input ' + FD + ', user switch ' + (U && U.name) + ' ' + (U && U.nl.usr[0].key) + ', analog row ' + (AV && AV.name) + ' ' + (AV && AV.nl.an[0].key) + ', timer ' + (TM && TM.join(' gate ')));
  const fdRow = Object.keys(by(A, FD).sig).find(k => /:S$/.test(k)) || '8:S';
  /* the clicks: [scan, what, (X) => the click, scans until A takes it]; B does it after the patch of that scan; a write leaves with
     the next patch (A takes it 2 scans later), an action at once (1 scan later); C takes it there too */
  const call = (X, ...a) => X.ctx.ditlUser(...a);
  const W = [
    [4, 'PB press', X => (by(X, P15).sig['11:S'] = true)],
    [8, 'PB release', X => (by(X, P15).sig['11:S'] = false)],
    [12, 'input switch ' + FD + ' ' + fdRow, X => { const s = by(X, FD); s.sig[fdRow] = !s.sig[fdRow]; }],
    [16, 'input switch back', X => { const s = by(X, FD); s.sig[fdRow] = !s.sig[fdRow]; }],
    [20, 'user switch (FORCE circle)', X => { const s = by(X, U.name); s.usw = s.usw || {}; s.usw[U.nl.usr[0].key] = !s.usw[U.nl.usr[0].key]; }],
    [24, 'user switch back', X => { const s = by(X, U.name); s.usw[U.nl.usr[0].key] = !s.usw[U.nl.usr[0].key]; }],
    [28, 'analog row value', X => { const s = by(X, AV.name); s.av = s.av || {}; s.av[AV.nl.an[0].key] = 12.5; s.nl.avk = X.ctx.avOf(s); }],
    [32, 'render (simRead of every sheet)', X => { if (X === B) for (const s of X.DITL.S.sheets) if (s.nl) X.ctx.simRead(s); }],
    [36, 'timer preset 3 sec (side panel)', X => call(X, TM[0], 'tm', TM[1], 3, 'SEC'), 1],
    [40, 'timer Skip', X => call(X, TM[0], 'skip', TM[1]), 1],
    [44, 'MOV stroke time 4 sec', X => call(X, MV.name, 'mvt', MVj, 4), 1],
    [48, 'MOV LOCAL / REMOTE', X => call(X, MV.name, 'lr', MVj), 1],
    [52, 'motor feedback delay 2 sec', X => call(X, MT.name, 'mtd', 2), 1]
  ];
  const res = [];
  /* a write of B leaves with the next patch (ENG.onMsg flush) and A takes it before the scan after that: C takes it there too */
  const pend = new Map();
  for (let k = 0; k < 58; k++) {
    while (toA.length) await A.ENG.onMsg(toA.shift());
    scan(A);
    for (const f of pend.get(k) || []) f(C);
    pend.delete(k);
    scan(C);
    A.ENG.send();
    const n0 = sentB.length;
    while (toB.length) await B.ENG.onMsg(toB.shift());
    const flushed = sentB.slice(n0).flatMap(m => m.ops.map(o => o[0]));
    for (const [at, w, f, dl] of W)
      if (at === k) {
        f(B);
        const t = k + (dl || 2);
        pend.set(t, (pend.get(t) || []).concat(f));
        res.push({ k, w, keys: null });
      }
    const r = res.find(x => x.k === k - 1);
    if (r) r.keys = flushed;
    const ab = cmp(A.dump(), B.dump()), ac = cmp(A.dump(), C.dump());
    let bad = false;
    /* B shows its click at once (A has it 2 scans later: not a difference until then) */
    for (const x of res) if (x.k < k && k <= x.k + 3) {
      if (ac.n && !x.ac) (x.ac = Object.assign(ac, { at: k })), (bad = true);
      if (k >= x.k + 2 && ab.n && !x.ab) (x.ab = Object.assign(ab, { at: k })), (bad = true);
    }
    if (bad) {
      /* the next click starts from the same state: B and C take A (a keyframe) */
      const KA = JSON.stringify(A.AN.engState.capture()), KD = JSON.stringify(A.DITL.ditlCapture());
      for (const X of [B, C]) { X.AN.engState.apply(JSON.parse(KA)); X.DITL.ditlApply(JSON.parse(KD)); }
      B.AN.sync.mark();
    }
  }
  for (const x of res) {
    const t = x.k + ' ' + x.w + ' (sent: ' + ((x.keys || []).join(' ') || 'nothing') + ')' + (x.ab || x.ac ? ' scan ' + (x.ab || x.ac).at : '');
    ck(!x.ab, 'A = B after ' + t + (x.ab ? ': ' + x.ab.n + '\n   ' + x.ab.ex.join('\n   ') : ''));
    ck(!x.ac, 'A = C after ' + t + (x.ac ? ': ' + x.ac.n + '\n   ' + x.ac.ex.join('\n   ') : ''));
  }
  /* Simulate off / on (07-app-events.js bmode: SIM = !SIM; ditlStates()): a write + a wrapped action */
  for (const on of [false, true]) {
    B.DITL.SIM = on;
    B.ctx.ditlStates();
    C.DITL.SIM = on;
    C.ctx.ditlStates();
    while (toA.length) await A.ENG.onMsg(toA.shift());
    scan(A); scan(C);
    A.ENG.send();
    while (toB.length) await B.ENG.onMsg(toB.shift());
    const ab = cmp(A.dump(), B.dump()), ac = cmp(A.dump(), C.dump());
    ck(!ab.n && !ac.n, 'Simulate ' + (on ? 'on' : 'off') + ' (bmode + ditlStates): A = B ' + ab.n + ', A = C ' + ac.n + (ab.n || ac.n ? '\n   ' + ab.ex.concat(ac.ex).join('\n   ') : ''));
  }
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
