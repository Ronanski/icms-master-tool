// 3.2.3-beta.152 S149-3 / S149-4 / S149-7 (Mina, beta.149 normal shutdown at 30 MW): ATS SHUT-DOWN was refused ("Finish step 7 NORMAL
// OPERATION") with no line in the Event log (only the status bar), the Turbine trip said nothing, and the Training step "turbine SHUT-DOWN
// ... MFT" ticked on the MFT alone while the generator still made 29.6 MW.
// Checks: a refused TCS command writes "<CMD> not taken: <reason>" to the Event log once (unit.js anTurbine); Turbine trip at the same
// state trips (MANUAL TRIP, I.0400 = 1, 0 MW); a second Turbine trip writes "TURBINE TRIP not taken: The turbine is already tripped";
// the Training reads I.0400 (the check of the step now needs it, live.js).
// Usage: node tests/regress/tcs_cmd_refused.js [html]
const { open } = require('./lib.js');
const fs = require('fs');
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
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async () => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    AN.startState = 'plantLoad150';
    const run = async n => {
      for (let i = 0; i < n; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(120);
    const U = AN.unit,
      o = {};
    const ev = () => lsEvents.map(e => e.kind + ' ' + e.text);
    /* the ATS as Mina had it: step 6 LOAD UP done, step 7 NORMAL OPERATION not reached (a plant from the cold start-up). The 150 MW
       snapshot has no ATS program: the first SHUT-DOWN builds it from the oil state (unit.js tcsFromOil), then the steps are put back */
    AN.turbine('shutdown');
    U.tc.step = 6;
    U.tc.cur = -1;
    await run(4);
    let n0 = lsEvents.length;
    o.sd = AN.turbine('shutdown');
    await run(2);
    o.evSd = ev().slice(0, lsEvents.length - n0);
    o.mwSd = U.MW;
    n0 = lsEvents.length;
    o.tr = AN.turbine('trip');
    await run(8);
    o.evTr = ev().slice(0, lsEvents.length - n0);
    o.mw = U.MW;
    o.i400 = LS_LIVE.val('I.0400');
    o.trip = (U.tc || U.tco).trip;
    n0 = lsEvents.length;
    o.tr2 = AN.turbine('trip');
    o.evTr2 = ev().slice(0, lsEvents.length - n0);
    return o;
  });
  console.log(JSON.stringify(r, null, 1));
  ck(/Finish step 7/.test(r.sd) && r.evSd.filter(e => /SHUT-DOWN not taken: Finish step 7/.test(e)).length === 1 && r.mwSd > 100, 'SHUT-DOWN refused at ATS step 6: one Event log line with the reason (' + r.evSd.join(' / ') + ')');
  ck(r.tr === '' && r.trip === 'MANUAL TRIP' && r.mw < 1 && r.i400 === 1, 'Turbine trip at the same state: MANUAL TRIP, 0 MW, I.0400 = 1 (' + r.trip + ', ' + r.mw + ' MW, I.0400 ' + r.i400 + ')');
  ck(r.evTr.some(e => /TURBINE TRIP, first out: MANUAL TRIP/.test(e)) && !r.evTr.some(e => /not taken/.test(e)), 'trip line in the Event log (' + r.evTr.slice(0, 4).join(' / ') + ')');
  ck(/already tripped/.test(r.tr2) && r.evTr2.some(e => /TURBINE TRIP not taken: The turbine is already tripped/.test(e)), 'second trip: not taken, with why (' + r.evTr2.join(' / ') + ')');
  ck(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
