// 3.2.1 (SEULGI : PLANT MODEL, boiler side: LIMESTONE INJECTION, src/analog/engine/boiler.js AN_LM; docs/versions/v3.2.1/
// LIMESTONE_SAND_PLANT_MODEL.md). The one world ON (ABC + DITL), plant model ON. The field switches of the Rotofeed answer the
// solenoid commands of the DITL-LS drawings (IO list station 104). Checks:
//  150 MW at rest (snapshot 19.PNG "limestone feeding sequence STOP"): every dome valve closed and sealed: ZSC rows made, seal
//    pressure switches PS-LM1812 / PS-LM1815 made, no CLOSE FAULT (DITL-LS160 ~ LS190 OUT6), no seal alarm (DITL-LS220 B.1250 ~ B.1253),
//    PT-LM1811 0.0 / PT-LM1812 0.1 kg/cm2 on the DITL-LS60 analog rows (19.PNG PILM1811 0.0, PILM1812 0.1);
//  control air isolation HV01 closed (O&M L5-3 3.5.4: the seals deflate): seal switches open, after the fault timer the lock /
//    dispensing dome valve CLOSE FAULT (the drawing's on-delay 15 s; the O&M 2.8 writes 5 s) and B.1250 / B.1251 (O&M 2.10.2 / 2.10.6 "not closed and sealed");
//  HV01 open again: the seals inflate, the faults clear.
//  isolating valves (DITL-LS212, E10211 sheet 212): the HMI SWITCH M.184C pressed once is held by its SET / RESET latch, the 8
//    isolating valve solenoids open, the bypass valves close, ISOLATING VALVES ALL OPENED M.183E (DITL-LS10 row 12) made; the
//    conveying air valve opens 12 s later (DITL-LS210 TR418, TR419 inverted); FEEDER START (DITL-LS110 row 8): the feeder runs,
//    LIMESTONE SYSTEM READY M.183F; PLANT EMERGENCY STOP (row 17, its own wire, not the PERMIT of row 15) for 60 s (TR440): the
//    latch resets and the valves close.
// Usage: node tests/regress/limestone.js [html]
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
    const i = (n, r) => DUI.rowVal(sh(n), r);
    const snap = () => ({
      cf: ['DITL-LS160', 'DITL-LS170', 'DITL-LS180', 'DITL-LS190'].map(n => o(n, 5)),
      al: [4, 7, 10, 13].map(r => o('DITL-LS220', r)),
      seal: [i('DITL-LS40', 3), i('DITL-LS70', 3)],
      zsc: [i('DITL-LS160', 12), i('DITL-LS170', 12), i('DITL-LS180', 12), i('DITL-LS190', 12)],
      p: [(sh('DITL-LS60').avw || {}).r14, (sh('DITL-LS60').avw || {}).r15],
      rdy: o('DITL-LS10', 10)
    });
    const z = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(20);
    z.rest = snap();
    AN.swValve('HV01', 0); /* the field operator closes the control air of the pneumatic panel */
    await run(3);
    z.hv3 = snap();
    await run(15);
    z.hv = snap();
    AN.swValve('HV01', 100);
    await run(10);
    z.back = snap();
    const set = (n, row, v) => {
      WORLD.live = true;
      const ok = WORLD.dset(sh(n).name, row, v);
      WORLD.live = false;
      return ok;
    };
    const press = async (n, row) => {
      set(n, row, true);
      await run(1);
      set(n, row, false);
    };
    const iso = () => ({
      sw: i('DITL-LS212', 9),
      sol: [11, 12, 13, 14, 15, 16, 17, 18].map(r => o('DITL-LS212', r)),
      byp: [o('DITL-LS212', 9), o('DITL-LS212', 10)],
      all: i('DITL-LS10', 11),
      air: i('DITL-LS110', 18),
      run: i('DITL-LS10', 10),
      rdy: o('DITL-LS10', 10)
    });
    z.iso0 = iso();
    await press('DITL-LS212', 9); /* CRT: ISOLATING VALVE A~H OPEN */
    await run(30);
    z.iso1 = iso();
    await press('DITL-LS110', 7); /* CRT: FEEDER START */
    await run(10);
    z.iso2 = iso();
    set('DITL-LS212', 16, true); /* PLANT EMERGENCY STOP held */
    await run(70);
    set('DITL-LS212', 16, false);
    await run(5);
    z.iso3 = iso();
    return z;
  });
  const s = r.rest;
  ck(
    s.cf.every(x => x === 0) && s.al.every(x => x === 0) && s.seal.every(x => x === 1) && s.zsc.every(x => x === 1),
    '150 MW at rest: dome valves closed and sealed, no close fault, no seal alarm ' + JSON.stringify(s)
  );
  ck(
    s.p[0] === 0 && s.p[1] === 0.1,
    'PT-LM1811 / PT-LM1812 on DITL-LS60 = 0.0 / 0.1 kg/cm2 (19.PNG) ' + JSON.stringify(s.p)
  );
  ck(
    r.hv3.seal.every(x => x === 0) &&
      r.hv3.cf[1] === 0 &&
      r.hv.cf[1] === 1 &&
      r.hv.cf[2] === 1 &&
      r.hv.al[0] === 1 &&
      r.hv.al[1] === 1,
    'HV01 closed: seals deflate, after the 15 s fault timer (DITL-LS170 / LS180) lock / dispensing DV CLOSE FAULT and B.1250 / B.1251 ' +
      JSON.stringify([r.hv3, r.hv])
  );
  ck(
    r.back.seal.every(x => x === 1) && r.back.cf.every(x => x === 0),
    'HV01 open again: sealed, faults clear ' + JSON.stringify(r.back)
  );
  ck(
    r.iso0.sw === 0 && r.iso0.sol.every(x => x === 0) && r.iso0.byp.every(x => x === 1) && r.iso0.all === 0,
    '150 MW at rest: isolating valves closed, bypass valves open ' + JSON.stringify(r.iso0)
  );
  ck(
    r.iso1.sw === 1 &&
      r.iso1.sol.every(x => x === 1) &&
      r.iso1.byp.every(x => x === 0) &&
      r.iso1.all === 1 &&
      r.iso1.air === 1,
    'HMI SWITCH pressed once: held by the latch, 8 isolating valves open, ALL OPENED, conveying air open ' +
      JSON.stringify(r.iso1)
  );
  ck(
    r.iso2.run === 1 && r.iso2.rdy === 1,
    'FEEDER START: feeder running, LIMESTONE SYSTEM READY ' + JSON.stringify(r.iso2)
  );
  ck(
    r.iso3.sw === 0 && r.iso3.sol.every(x => x === 0) && r.iso3.all === 0,
    'PLANT EMERGENCY STOP 60 s: the switch resets, the isolating valves close ' + JSON.stringify(r.iso3)
  );
  if (errs && errs.length) console.log('page errors: ' + errs.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
