// plan c4 (3.2.3): the electrical model of elec.js (house load of the 6.6 kV motors, export, transformer loading, 52L1), in Node. Usage: node tests/regress/elec_desk.js
const fs = require('fs'),
  vm = require('vm');
const G = { MVAr: 33.1 };
const ctx = { Math, isFinite, Object, AN_UNIT: null, anGenEl: () => G };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/analog/engine/elec.js', 'utf8') + ';this.API={anElec,anElecStep,anElecL52}', ctx);
const { anElec, anElecStep, anElecL52 } = ctx.API;
const lab = () => ({ S: { rt: { force: {}, ext: {} }, ext: [5] }, n: 5 });
/* the 150 MW currents of the plant model (A): SWP 230 + 230, PAF 253.5, SAF 137.3, IDF 206.9, FAB A 35.7, BFP A 290.5, CEP A 28.1, ACWP A 26.8, PA compressor A 43.8 */
const mk = () => ({ on: true, MW: 150, tcsT: 150, tb: { st: 'load', rpm: 3600 }, di: { l52: lab(), on: lab() }, swIa0: 230, swIa1: 230, fnPafI: 253.5, fnSafI: 137.3, fnIdfI: 206.9, fnIa: 35.7, fwI0: 290.5, cdI0: 28.1, acI0: 26.8, paI0: 43.8, iaI: 300 });
let fail = 0;
const ck = (ok, w, x) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + w + (x !== undefined ? ' ' + JSON.stringify(x) : ''));
  if (!ok) fail++;
};
let U = mk(),
  e = anElec(U);
ck(Math.abs(e.busA - 1482.6) < 0.1, '6.6 kV bus current = sum of the 6.6 kV motors (460 V IA compressor not counted)', e.busA);
ck(Math.abs(e.aux - 14.41) < 0.05, 'house load 1.732 x 6.6 x 1482.6 A x 0.85 = 14.4 MW', +e.aux.toFixed(2));
ck(Math.abs(e.exp - (150 - e.aux)) < 1e-9 && e.mtPct > 70 && e.mtPct < 80, 'export = 150 - house load, main transformer % of 180 MVA', [+e.exp.toFixed(1), +e.mtPct.toFixed(1)]);
ck(Math.abs(e.uatPct - (100 * e.aux) / 0.85 / 34) < 1e-6, 'unit auxiliary transformer % of 34 MVA', +e.uatPct.toFixed(1));
anElecStep(U);
ck(U.di.l52.S.rt.ext[5] === 0, '52L1 closed: I.0937 = 0');
U.tb.st = 'off';
ck(/generator on line/.test(anElecL52(U, 0)), 'open 52L1 refused with 52G1 open');
e = anElec(U);
ck(e.exp < 0 && e.src === 'grid (back-feed)', 'before sync: the house load comes from the grid', [+e.exp.toFixed(1), e.src]);
U = mk();
ck(anElecL52(U, 0) === '', 'open 52L1 on load: accepted');
U.di.on.S.rt.ext[5] = 1;
anElecStep(U);
e = anElec(U);
ck(U.di.l52.S.rt.ext[5] === 1 && e.house === 1 && e.exp === 0, 'house load: I.0937 = 1, nothing to the grid');
ck(Math.abs(U.tcsT - e.aux) < 1e-9, 'house load: the turbine target = the house load', +U.tcsT.toFixed(2));
ck(U.di.on.S.rt.ext[5] === 0, 'house load: DCS control mode on feedback off');
U.MW = 15;
ck(anElecL52(U, 1) === '' && U.tb.aim === 15 && U.tb.tgt === 15, 'close 52L1: the TCS target stays at the load of the moment');
ck(/already closed/.test(anElecL52(U, 1)), 'close again: refused');
console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
process.exit(fail ? 1 : 0);
