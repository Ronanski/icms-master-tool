// 3.2.1 (SEULGI : PLANT MODEL, boiler side: FANS, AIR AND FLUE GAS, src/analog/engine/boiler.js AN_FN; docs/versions/v3.2.1/
// FANS_PLANT_MODEL.md). The one world ON (ABC + DITL), plant model ON. Checks:
//  150 MW: the motor currents and pressures of the snapshots 7.PNG / 9.png (within 5 %: the flows are the loop model's);
//  FA blower A field trip: no FA flow -> ABC-006 M.3114 "FAB OUTLET AIR FLOW L.L. < 20 T/H" -> standby B starts (DITL-28A #B), its
//    outlet SOV OPEN COMMAND, flow back by its inlet damper (24.9 %, 9.png: below 20 T/H, the L.L. stays until the damper opens);
//    IT-F1055A / B are the rows of DITL-28B / #B (row 12 "FAB A CURRENT");
//  PAF field trip: no PA flow, PAF current 0, PAF outlet pressure 0;
//  Cold: no fan, every current and pressure 0.
// Usage: node tests/regress/fans.js [html]
const fs = require('fs');
const { open } = require('./lib.js');
const html =
  process.argv.find(a => /\.html$/.test(a)) ||
  'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async () => {
  const { browser, page, errs } = await open(html);
  let fail = 0;
  const ck = (ok, w) => {
    console.log((ok ? 'PASS ' : 'FAIL ') + w);
    if (!ok) fail++;
  };
  await page.waitForFunction(
    () => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && S.sheets.length >= PRE_N,
    null,
    { timeout: 120000 }
  );
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
    const f = x => Math.round(x * 10) / 10;
    const ai = (sheet, a) => {
      const s = AN.sheets.find(x => x.name === sheet);
      for (const b of s.S.blk)
        if (b.k === 'AI' && b.o && (AN.nm(s.S, b.o[0]) || '').trim().endsWith(a)) return f(+s.S.rt.v[b.o[0]]);
      return null;
    };
    const lab = (sheet, t) => {
      const S2 = AN.sheets.find(x => x.name === sheet).S,
        n = S2.lab.findIndex(x => x && String(x.t).trim() === t);
      return n >= 0 ? +S2.rt.v[n] : null;
    };
    const U = () => AN.unit;
    const snap = () => ({
      I: U().fnI.map(f),
      g: U().fnG.map(f),
      mvB: (() => {
        const T = AN.sheets.find(x => x.name === 'ABC-014').S,
          c = AN.hmiCtrls(T).find(q => q.tag === 'FICFA1055B');
        return f(+T.rt.v[c.out]);
      })(),
      paP: f(U().fnPaP),
      faP: U().fnFaP.map(f),
      fa: ai('ABC-006', 'AI0545'),
      pa: ai('ABC-006', 'AI0484'),
      gi: U().fnGi.map(f),
      go: f(U().fnGo),
      ll: lab('ABC-006', 'M.3114'),
      A: DUI.motState(sh('DITL-28A')),
      B: DUI.motState(sh('DITL-28A #B')),
      PAF: DUI.motState(sh('DITL-26A')),
      r12: [(sh('DITL-28B').avw || {}).r12, (sh('DITL-28B #B').avw || {}).r12]
    });
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(30);
    o.s150 = snap();
    /* FA blower A trips at the field (protection relay) */
    sh('DITL-28A')._ftrip = true;
    set('DITL-28A', 3, true); /* row 4 I.0047 FAB A TRIP */
    let lo = 99;
    for (let i = 0; i < 60; i++) {
      await run(0.5);
      lo = Math.min(lo, ai('ABC-006', 'AI0545'));
    }
    o.lo = lo;
    await run(60);
    o.fb = snap();
    /* PAF field trip */
    sh('DITL-26A')._ftrip = true;
    set('DITL-26A', 0, true); /* row 1 I.0361 PAF TRIP */
    await run(30);
    o.paf = snap();
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantCold();
    await run(20);
    o.cold = snap();
    return o;
  });
  const s = r.s150,
    near = (a, b, p) => Math.abs(a - b) <= Math.abs(b) * p;
  ck(
    near(s.I[0], 253.6, 0.05) &&
      near(s.I[1], 134.0, 0.05) &&
      near(s.I[2], 199.6, 0.05) &&
      near(s.I[3], 37.3, 0.05) &&
      s.I[4] === 0,
    '150 MW currents PAF / SAF / IDF / FA-A / FA-B (7.PNG 253.6 / 134.0 / 199.6, 9.png 37.3 / 0): ' +
      JSON.stringify(s.I)
  );
  ck(
    near(s.paP, 1551, 0.06) &&
      near(s.faP[0], 3257, 0.08) &&
      near(s.gi[0], -442, 0.05) &&
      near(s.gi[1], -450, 0.05) &&
      near(s.go, -7, 0.1),
    '150 MW pressures PIFA1075 1551, PIFA1055A 3257, PIFG1141A / B -442 / -450, PIFG1151 -7: ' + JSON.stringify(s)
  );
  ck(
    near(s.r12[0], s.I[3], 0.01) && s.r12[1] === 0,
    'DITL-28B / #B row 12 FAB current = IT-F1055A / B ' + JSON.stringify(s.r12)
  );
  ck(
    r.lo < 20 &&
      r.fb.A === 'TRIP' &&
      r.fb.B === 'RUN' &&
      r.fb.fa > 10 &&
      r.fb.I[4] > 0 &&
      r.fb.I[3] === 0 &&
      Math.abs(r.fb.r12[1] - r.fb.I[4]) < 0.1,
    'FA blower A trip: FA flow ' +
      r.lo +
      ' T/H (< 20 = M.3114), standby B started, flow back ' +
      r.fb.fa +
      ' with its damper 24.9 % ' +
      JSON.stringify(r.fb)
  );
  ck(
    r.paf.PAF === 'TRIP' && r.paf.pa < 1 && r.paf.I[0] === 0 && r.paf.paP < 1,
    'PAF trip: PA flow ' + r.paf.pa + ', current ' + r.paf.I[0] + ', outlet ' + r.paf.paP
  );
  ck(
    r.cold.I.every(x => x === 0) && r.cold.paP === 0 && r.cold.go === 0 && r.cold.gi.every(x => x === 0),
    'Cold: no fan, no current, no pressure ' + JSON.stringify(r.cold)
  );
  console.log('page errors: ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
