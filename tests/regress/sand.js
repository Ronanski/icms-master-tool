// 3.2.1 (SEULGI : PLANT MODEL, boiler side: SAND INJECTION, src/analog/engine/boiler.js AN_SD; docs/versions/v3.2.1/
// LIMESTONE_SAND_PLANT_MODEL.md). The one world ON (ABC + DITL), plant model ON. The field switches of the sand DensePhase vessel answer
// the solenoid commands of the sand drawings DITL-771 ~ 777. Checks:
//  150 MW at rest (snapshot 20.PNG: sand injection STOP, every valve closed): inlet dome valve closed and sealed, no INLET DV CLOSE
//    FAULT (DITL-772 OUT17 / B.1200), no SYSTEM TRIP (DITL-777 OUT13);
//  isolating valve switch OPEN (DITL-776 row 3): XV-SD1802A / B open, ROUTE OK;
//  PCB-300 to REMOTE (field selector SIL-SD1300) and SYSTEM START: one conveying cycle of O&M L5-2 4.2.1: vent valve, inlet dome
//    valve 3 s later, filling by the 20 s timer, dome valve closed and sealed, outlet + conveying air, vessel pressure up, the batch
//    leaves, the pressure falls below 0.3 bar (PS-SD1800) and the outlet / conveying air close.
// Usage: node tests/regress/sand.js [html]
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
    const sh = n => S.sheets.find(x => x.name.endsWith(')' + n));
    const o = (n, r) => DUI.outVal(sh(n), r);
    const set = (n, row, v) => {
      WORLD.live = true;
      const ok = WORLD.dset(sh(n).name, row, v);
      WORLD.live = false;
      return ok;
    };
    const U = () => AN.unit;
    const snap = () => ({
      cf: o('DITL-772', 16),
      b1200: o('DITL-772', 17),
      trip: o('DITL-777', 12),
      route: o('DITL-776', 13),
      sw: Object.assign({}, U().sd.sw),
      m: Math.round(U().sdM),
      p: Math.round(U().sdP * 100) / 100
    });
    const z = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(20);
    z.rest = snap();
    set('DITL-776', 2, true); /* CRT: isolating valve OPEN */
    await run(8);
    z.iso = snap();
    set('DITL-771', 4, true); /* PCB-300 local / remote selector at REMOTE (SIL-SD1300) */
    await run(2);
    set('DITL-771', 2, true); /* CRT: SYSTEM START */
    await run(1.5);
    set('DITL-771', 2, false);
    let mMax = 0,
      pMax = 0,
      sealedFull = false;
    for (let k = 0; k < 90; k++) {
      await run(1);
      const s = snap();
      mMax = Math.max(mMax, s.m);
      pMax = Math.max(pMax, s.p);
      if (s.m > 50 && s.sw.dvC && s.sw.seal) sealedFull = true;
      if (sealedFull && !z.end && s.m === 0 && s.sw.plow === 1 && s.sw.outC === 1 && s.sw.caC === 1) z.end = s;
    }
    z.end = z.end || snap();
    /* 3.2.1 SEULGI: the DONE flip-flop M.081C resets through TR314 (3 s, UNLINK_AUDIT.md): the cycle starts again by itself */
    let fills = 0,
      was = 0;
    for (let k = 0; k < 120; k++) {
      await run(1);
      const m = snap().m;
      if (m > 50 && was <= 50) fills++;
      was = m;
    }
    z.fills = fills;
    z.lb = o('DITL-771', DUI.outs(sh('DITL-771')).find(q => /LINE BLOCKAGE/.test(q.name)).row);
    Object.assign(z, { mMax, pMax, sealedFull });
    return z;
  });
  const a = r.rest;
  ck(
    a.cf === 0 && a.b1200 === 0 && a.trip === 0 && a.sw.dvC === 1 && a.sw.seal === 1,
    '150 MW at rest: inlet dome valve closed and sealed, no close fault / B.1200, no system trip ' + JSON.stringify(a)
  );
  ck(
    r.iso.route === 1 && r.iso.sw.isoAO === 1 && r.iso.sw.isoBO === 1,
    'isolating valve switch OPEN: XV-SD1802A / B open, ROUTE OK'
  );
  ck(
    r.mMax > 50 && r.sealedFull,
    'START: the vessel fills (max ' + r.mMax + ' %), the inlet dome valve closes and seals'
  );
  ck(r.pMax > 1.5, 'conveying: outlet + conveying air, vessel pressure up (max ' + r.pMax + ' kg/cm2)');
  ck(
    r.end.m === 0 && r.end.sw.plow === 1 && r.end.sw.outC === 1 && r.end.sw.caC === 1,
    'batch conveyed: vessel empty, pressure < 0.3 bar, outlet and conveying air closed ' + JSON.stringify(r.end)
  );
  ck(
    r.fills >= 1 && r.lb === 0,
    'the cycle repeats (DONE resets through TR314 3 s): ' + r.fills + ' more fill(s) in 120 s, no LINE BLOCKAGE'
  );
  if (errs && errs.length) console.log('page errors: ' + errs.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
