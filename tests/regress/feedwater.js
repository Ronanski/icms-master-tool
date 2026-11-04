// 3.2.1 (IRENE: PLANT MODEL, FEEDWATER; unit.js AN_FW / anFwStep; docs/versions/v3.2.1/FEEDWATER_PLANT_MODEL.md).
// The one world ON (ABC + DITL), plant model ON, Start at 150 MW:
//  base: BFWP-A flow / outlet pressure PT-FW1011 / current / strainer DP from the KSB curve Q43446D, the DITL-23B rows read the same;
//  BFWP A trips (field protection relay, the dock FIELD: TRIP): PT-FW1011 < 155 kg/cm2 (M.3210 LL). The auto start of BFWP B is OPEN.
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
    for (let i = 0; i < 30; i++) {
      await run(0.5);
      const x = g();
      o.trMin = Math.min(o.trMin, x.Pd);
      if (o.trB == null && x.run[1] === 1) o.trB = (i + 1) / 2;
    }
    await run(20);
    o.tr = g();
    return o;
  });
  console.log(JSON.stringify(r));
  const b = r.base;
  ck(b.run[0] === 1 && b.run[1] === 0 && Math.abs(b.Pd - 165.4) < 3.5 && Math.abs(b.I[0] - 289.4) < 5 && b.d25 === b.Pd, `150 MW BFWP-A ${b.q} m3/h (feedwater ${b.ffw} T/H), suction ${r.da} (03.png 6.7), PT-FW1011 ${b.Pd} kg/cm2 (03.png 165.4), ${b.I[0]} A (289.4), DITL-23B row 25 reads ${b.d25}`);
  ck(Math.abs(b.dp[0] - 0.29) < 0.03 && b.d26 === b.dp[0], `strainer DP ${b.dp[0]} kg/cm2 (03.png 0.29), DITL-23B row 26 reads ${b.d26}`);
  ck(r.trMin < 155 && r.tr.d25 < 155, `BFWP A tripped: PT-FW1011 down to ${r.trMin} kg/cm2, DITL-23B row 25 reads ${r.tr.d25} (< 155 = M.3210 LL)`);
  /* OPEN (FEEDWATER_PLANT_MODEL.md): the standby BFWP B is not started by the logic in this test, and the feedwater flow of ABC-010
     stays (M.3343 follows the RUNNING row, not the field trip); printed, not judged */
  console.log(`INFO BFWP B after the trip: running ${r.tr.run[1]} (after ${r.trB} s), feedwater ${r.tr.ffw} T/H`);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
