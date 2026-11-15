// 3.2.1 (IRENE: PLANT MODEL, FEEDWATER; unit.js AN_FW / anFwStep; docs/versions/v3.2.1/FEEDWATER_PLANT_MODEL.md).
// The one world ON (ABC + DITL), plant model ON, Start at 150 MW:
//  base: BFWP-A flow / outlet pressure PT-FW1011 / current / strainer DP from the KSB curve Q43446D, the DITL-23B rows read the same;
//  BFWP A trips (field protection relay, the dock FIELD: TRIP): PT-FW1011 < 155 kg/cm2 (M.3210 LL) -> BFWP B AUTO START (O.1400): B runs
//  (its suction manual valve V-FW1002 open = ZSO-FW1032 row 11, lube oil > 2.0, suction > 1.5) and the feedwater comes back;
//  then the suction manual valve of the running B is closed in the field: no water from B.
// Usage: node tests/regress/feedwater.js [html]
const fs = require('fs');
const { open } = require('./lib.js');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async () => {
  const { browser, page, errs } = await open(html);
  let fail = 0;
  const ck = (ok, w) => {
    console.log((ok ? 'PASS ' : 'FAIL ') + w);
    if (!ok) fail++;
  };
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && S.sheets.length >= PRE_N, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async () => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    const run = async sec => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    const sh = n => S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(n));
    const set = (n, row, v) => {
      WORLD.live = true;
      const ok = WORLD.dset(n, row, v);
      WORLD.live = false;
      return ok;
    };
    const f = x => Math.round(x * 1000) / 1000;
    const U = () => AN.unit;
    const g = () => ({ q: U().fwQp, Pd: f(U().fwPd), I: [U().fwI0, U().fwI1], dp: [U().fwDp0, U().fwDp1], run: U().fwRun, ffw: f(AN_CYC.ffw), d25: (sh('DITL-23B').avw || {}).r25, d26: (sh('DITL-23B').avw || {}).r26 });
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(300);
    o.base = g();
    o.da = f(WORLD.sucP());
    /* the protection relay of BFWP A trips in the field (the dock FIELD: TRIP, Training fault) */
    S.sheets.find(x => x.name.endsWith('DITL-23A'))._ftrip = true;
    o.trMin = 999;
    o.trB = null;
    const d6 = sh('DITL-06');
    o.mft = 0;
    for (let i = 0; i < 30; i++) {
      await run(0.5);
      const x = g();
      o.trMin = Math.min(o.trMin, x.Pd);
      if (o.trB == null && x.run[1] === 1) o.trB = (i + 1) / 2;
    }
    for (let i = 0; i < 12; i++) {
      await run(5);
      if (DUI.outVal(d6, 1) === 1) o.mft = 1;
    }
    o.tr = g();
    AN.swValve('V-FW1002', 0);
    await run(5);
    o.sv = g();
    AN.swValve('V-FW1002', 100);
    return o;
  });
  console.log(JSON.stringify(r));
  const b = r.base;
  /* 3.2.3-beta.266 (SOHEE, Jennie 2026-11-16): since beta.260 / 261 the Start at 150 MW is the steady state of the plant model (MHPS heat
     balance PPE-13-0106, 460 T/H steam + sprays + blowdown = feedwater about 472 T/H); the 03.png plant snapshot (499.1 T/H at a worse heat
     rate) is a plant check (+-6 %) only. The pump values are checked at the model flow Q by the KSB HGC 5/1+6 data sheet (O&M L7 BFP, curve
     Q43446D at 3580 rpm, sp. gr. 0.9093): outlet = suction header - branch loss 0.4 x (Q / 549)^2 + head(Q) x 0.9093 / 10, current =
     289.4 A x shaft power(Q) / shaft power(549 m3/h) (03.png ratio), strainer DP = 0.29 x (Q / 549)^2 (03.png 0.29 at 549 m3/h). */
  const lin = (X, Y, x) => {
    for (let i = 1; i < X.length; i++) if (x <= X[i]) return Y[i - 1] + ((Y[i] - Y[i - 1]) * (x - X[i - 1])) / (X[i] - X[i - 1]);
    return Y[Y.length - 1];
  };
  const qQ = [0, 100, 200, 300, 400, 500, 540, 600, 700],
    qH = [2254.6, 2250, 2215, 2140, 2010, 1840, 1750, 1620, 1380],
    pQ = [0, 150, 300, 400, 540, 600],
    pP = [1170, 1700, 2230, 2580, 2946, 3100];
  const Q = b.q,
    ePd = r.da - 0.4 * (Q / 549) * (Q / 549) + (0.9093 / 10) * lin(qQ, qH, Q),
    eI = (289.4 * lin(pQ, pP, Q)) / lin(pQ, pP, 549),
    eDp = 0.29 * (Q / 549) * (Q / 549);
  ck(Math.abs(b.ffw / 499.1 - 1) < 0.06, `150 MW feedwater ${b.ffw} T/H: plant check against 03.png 499.1 T/H (+-6 %)`);
  ck(b.run[0] === 1 && b.run[1] === 0 && Math.abs(b.Pd - ePd) < 1 && Math.abs(b.I[0] - eI) < 3 && b.d25 === b.Pd, `150 MW BFWP-A ${b.q} m3/h (feedwater ${b.ffw} T/H), suction header ${r.da} (03.png: idle BFWP-B 7.1), PT-FW1011 ${b.Pd} kg/cm2 (data sheet at Q ${ePd.toFixed(1)}; 03.png 165.4 at 549 m3/h), ${b.I[0]} A (${eI.toFixed(1)}; 03.png 289.4), DITL-23B row 25 reads ${b.d25}`);
  ck(Math.abs(b.dp[0] - eDp) < 0.01 && b.d26 === b.dp[0], `strainer DP ${b.dp[0]} kg/cm2 (${eDp.toFixed(3)} at Q; 03.png 0.29 at 549 m3/h), DITL-23B row 26 reads ${b.d26}`);
  ck(r.trMin < 155, `BFWP A tripped: PT-FW1011 down to ${r.trMin} kg/cm2 (< 155 = M.3210 LL, the AUTO START of B)`);
  ck(r.tr.run[1] === 1 && r.trB != null && r.tr.ffw > 0.8 * r.base.ffw && r.tr.Pd > 155 && r.tr.d25 === r.tr.Pd, `BFWP B started by its AUTO START after ${r.trB} s: ${r.tr.q} m3/h, PT-FW1011 ${r.tr.Pd} kg/cm2, feedwater ${r.tr.ffw} T/H after 60 s (before the trip ${r.base.ffw}), ${r.tr.I[1]} A, DITL-23B row 25 reads ${r.tr.d25}`);
  ck(r.mft === 0, `no boiler trip (DITL-06 BOILER TRIP SIGNAL PRESENT stays 0): the feedwater comes back in seconds, the drum level stays above L.L.`);
  ck(r.sv.run[1] === 0 && r.sv.ffw < 5, `V-FW1002 (suction of the running BFWP B) closed in the field: B gives no water, feedwater ${r.sv.ffw} T/H`);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
