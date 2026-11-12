// 3.2.3 (SOHEE): the "TO SILENCE" (surge) SOV of the FA blowers XV-FA1055-A2 / B2 (INSTRUMENT_VALVE_COVERAGE "WALA"), DITL-28C output
// row 2 OPEN COMMAND: open, the blower blows to the atmosphere through its silencer, not into the FA header (boiler.js anFanStep).
// PR-OPE-5002 FAB START-UP: before the start the surge valve is OPEN and in AUTO, the discharge valve CLOSED and in AUTO; after the
// start "Ensure Surge Valve will CLOSE and FAB Discharge Valve will OPEN", then the inlet damper sets the flow (26 T/H).
// Also checked: the CLOSED limit of the outlet SOV of instance #B follows its valve (03b-sim.js mvForced; it stayed 1, the AUTO logic
// never closed the surge valve of blower B), and the FA flow follows the blowers, SOVs and dampers (source.js R.FICFA1055A).
// Usage: node tests/regress/fa_silencer.js [html]
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
    const r1 = x => Math.round(x * 10) / 10;
    const sh = n => S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(n));
    const U = () => AN.unit;
    const st = () => {
      const a = sh(')DITL-28C'),
        b = sh('DITL-28C #B');
      return {
        fa: r1(U().fnFaQ),
        runA: AN.ditlRun('DITL-28A'),
        runB: AN.ditlRun('DITL-28A #B'),
        silA: DUI.outVal(a, 1),
        silB: DUI.outVal(b, 1),
        outB: DUI.outVal(b, 25),
        clB: DUI.rowVal(b, 8),
        Ia: r1(U().fnIa)
      };
    };
    let hold = null;
    const T = [];
    const run = async (sec, f) => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        if (hold) hold();
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (f) f(i / 2);
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(120);
    o.l150 = st();
    /* the operator opens the surge valve of the running blower A (OPEN P.B., A in MANUAL mode at 150 MW) */
    hold = () => WORLD.dset('DITL-28C', 0, true);
    let low = 99,
      tB = null;
    await run(60, t => {
      const x = st();
      low = Math.min(low, x.fa);
      if (tB == null && x.runB) tB = t;
    });
    hold = null;
    o.open = st();
    o.low = low;
    o.tB = tB;
    await run(60);
    o.after = st();
    return o;
  });
  console.log(JSON.stringify(r));
  const { l150, open: op, after } = r;
  ck(l150.runA === 1 && l150.runB === 0 && l150.silA === 0 && l150.silB === 1 && Math.abs(l150.fa - 26.3) < 3, `150 MW: blower A runs with its surge valve shut, B stopped with its surge valve open (AUTO), FA ${l150.fa} T/H (9.png 26.3)`);
  ck(op.silA === 1 && r.low < 20, `surge valve of A opened: the FA flow falls below the 20 T/H low-low (lowest ${r.low})`);
  ck(r.tB != null, `the low-low starts blower B by its standby AUTO start (after ${r.tB} s)`);
  ck(after.runB === 1 && after.silB === 0 && after.outB === 1 && after.clB === 0, `blower B: its AUTO logic shut its surge valve and opened its outlet (outlet CLOSED limit ${after.clB})`);
  ck(after.fa > 5, `the FA flow comes back from blower B by its damper (${after.fa} T/H)`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
