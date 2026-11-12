// 3.2.3 (SOHEE : PLANT MODEL HELPER: SAMPLING AND CHEMICAL DOSING plant model, unit.js AN_CHEM / anChemStep;
// docs/versions/v3.2.1/SAMPLING_DOSING_PLANT_MODEL.md). The one world ON, plant model ON. Checks:
//  150 MW: dosing pumps A running, B stopped; feedwater / main steam pH 9.0 (PR-OPE-5002), drum pH 9.5 at PO4 5 ppm (FHI Fig. 3,
//    Na/PO4 2.6), deaerator outlet O2 10 ppb (FHI: < 0.01 ppm while pressurized), economizer inlet O2 0 (carbohydrazide), pure water
//    cation conductivity 0.055 uS/cm;
//  carbohydrazide pump A stopped at its local panel: the economizer inlet O2 rises above its H alarm 4.2 ppb (alarm list) within about
//    one residence of the feedwater tank; AL2-SP01 analyzer common alarm on; started again: back to 0;
//  phosphate pump stopped for 6 h: the drum PO4 and pH fall (blowdown);
//  Cold: all dosing pumps stopped, deaerator not pressurized: O2 at the range top 100 ppb.
// Usage: node tests/regress/chem_model.js [html]
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
    const K = [
      'sp1001',
      'sp1003',
      'sp1004',
      'sp1009',
      'sp1010',
      'sp1011',
      'sp1012',
      'sp1016',
      'sp1018',
      'sp1006',
      'chPO4',
      'spAL2',
      'ch_tspA',
      'ch_tspB',
      'ch_amnA',
      'ch_chzA'
    ];
    const snap = () => Object.fromEntries(K.map(k => [k, AN.unit[k]]));
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(120);
    o.l = snap();
    o.l.ffw = AN_CYC.ffw;
    o.l.cbd = AN_CYC.cbd;
    AN.field('chzA', false);
    await run(30 * 60);
    o.n = snap();
    AN.field('chzA', true);
    await run(30 * 60);
    o.b = snap();
    AN.field('tspA', false);
    await run(6 * 3600);
    o.p = snap();
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantCold();
    await run(120);
    o.c = snap();
    return o;
  });
  const { l, n, b, p, c } = r;
  console.log(JSON.stringify(r));
  ck(
    l.ch_tspA === 1 && l.ch_tspB === 0 && l.ch_amnA === 1 && l.ch_chzA === 1,
    `150 MW: dosing pumps A running, B stopped`
  );
  ck(
    Math.abs(l.sp1001 - 9.0) < 0.05 && l.sp1003 === l.sp1001 && l.sp1016 === l.sp1001,
    `150 MW: feedwater / main steam pH ${l.sp1001} (target 9.0)`
  );
  ck(
    Math.abs(l.sp1011 - 9.5) < 0.05 && Math.abs(l.chPO4 - 5) < 0.3,
    `150 MW: drum pH ${l.sp1011} at PO4 ${l.chPO4} ppm (FHI Fig. 3: 9.5 at 5 ppm)`
  );
  ck(
    l.sp1004 === 10 && l.sp1010 === 0,
    `150 MW: deaerator outlet O2 ${l.sp1004} ppb, economizer inlet ${l.sp1010} ppb`
  );
  ck(l.sp1018 === 0.055, `150 MW: condensate cation conductivity ${l.sp1018} uS/cm`);
  ck(
    n.sp1010 > 4.2 && n.spAL2 === 1,
    `carbohydrazide pump stopped 30 min: economizer O2 ${n.sp1010} ppb (> H 4.2), common alarm ${n.spAL2}`
  );
  ck(b.sp1010 < 1, `carbohydrazide pump started again 30 min: economizer O2 ${b.sp1010} ppb`);
  ck(
    p.chPO4 < l.chPO4 - 0.5 && p.sp1011 < l.sp1011,
    `phosphate pump stopped 6 h: PO4 ${l.chPO4} -> ${p.chPO4} ppm, drum pH ${l.sp1011} -> ${p.sp1011}`
  );
  ck(
    c.ch_tspA === 0 && c.ch_amnA === 0 && c.ch_chzA === 0 && c.sp1004 === 100,
    `Cold: dosing pumps stopped, deaerator outlet O2 ${c.sp1004} ppb (not deaerated)`
  );
  ck(!errs.length, 'no page errors ' + errs.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `${fail} FAIL` : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
