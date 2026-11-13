// 3.2.3-beta.168 (SOHEE, after Mina S160-2): FA blower B tripped by its CURRENT L.L. (DITL-28B #B row 12 < 24.6 A -> DITL-28A #B row 17
// M.2549 -> trip pulse TR133 2 s) and the Event log named "TR133 pulse ends after 2.0 s" / "fluidizing air blower B STOPPED" as the
// cause. Two causes in the app: (1) the cause reader of a TRIP (src/digital/parts/03c-read.js, FIRST-OUT) stopped at the pulse and did not
// read its input; (2) the STOPPED status row that follows the run feedback rose 1 ~ 2 scans later and its cause ("FAB B STOPPED = 1")
// replaced the first one before the Event log wrote it (src/world/world.js s._stopWhy).
// Checks, from Mina's b142 save (150 MW): B alone (as fab_standby_current.js), its damper FICFA1055B MANUAL 0 % until B trips: the Event
// log line of the stop names CURRENT L.L., not TR133 and not "B STOPPED" as its own cause.
// Usage: node tests/regress/fab_current_ll_cause.js [html] [save json]
const { open } = require('./lib.js');
const fs = require('fs');
const html =
  process.argv.find(a => /\.html$/.test(a)) ||
  'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const svp = process.argv.find(a => /\.json$/.test(a)) || '/mnt/project-files/b142-150MW-cold-run.json';
if (!fs.existsSync(svp)) {
  console.log('SKIP: no save ' + svp);
  process.exit(0);
}
const sv = JSON.parse(fs.readFileSync(svp, 'utf8'));
(async () => {
  const { browser, page, errs } = await open(html);
  let fail = 0;
  const ck = (ok, w) => {
    console.log((ok ? 'PASS ' : 'FAIL ') + w);
    if (!ok) fail++;
  };
  await page.waitForFunction(
    () =>
      AN.sheets &&
      AN.sheets.length >= 54 &&
      window.WORLD &&
      WORLD.idx &&
      window.DITL150 &&
      window.LS_DOCK &&
      window.LS_GUIDE,
    null,
    { timeout: 120000 }
  );
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async sv => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    const r1 = x => Math.round(x * 10) / 10;
    const o = { drop: 0, iMin: 1e9 };
    const run = async (sec, f) => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (f) f();
        if (i % 4 === 3) await new Promise(r => setTimeout(r, 0));
      }
    };
    AN.run = false;
    DITL150.savePut({ kf: sv.kf, kd: sv.kd, ver: '' });
    await run(1);
    const n0 = lsEvents.length;
    /* B started by its logic with A running, as in Mina's run (the FA flow under the L.L. 20 T/H at the AUTO): A's damper down to
       25 % for the AUTO, then back */
    const mvA = LS_LIVE.mvOf(LS_LIVE.fp('FICFA1055A'));
    LS_GUIDE.A.man('FICFA1055A', 25);
    await run(15);
    o.st = r1(AN.unit.fnFaQ);
    LS_DOCK.dsel('DITL-28A #B', 1, 1, 'FAB B AUTO');
    await run(5);
    o.r5 = AN.ditlRun('DITL-28A #B');
    LS_GUIDE.A.man('FICFA1055A', +mvA);
    await run(20);
    o.both = AN.ditlRun('DITL-28A') + '/' + AN.ditlRun('DITL-28A #B');
    LS_GUIDE.A.motor('M.3308', 0);
    await run(60, () => {
      if (AN.ditlRun('DITL-28A #B') !== 1) o.drop++;
      o.iMin = Math.min(o.iMin, AN.unit.fnIb);
    });
    o.A = AN.ditlRun('DITL-28A');
    const n1 = lsEvents.length;
    o.trip = null;
    for (let i = 0; i < 120 && o.trip == null; i++) {
      LS_GUIDE.A.man('FICFA1055B', 0);
      await run(0.5);
      if (AN.ditlRun('DITL-28A #B') !== 1) o.trip = i / 2;
    }
    o.ibT = r1(AN.unit.fnIb);
    /* the page writes its Event log every 500 ms of real time: 10 s of plant with time for the scan between the steps */
    for (let i = 0; i < 20; i++) {
      await run(0.5);
      await new Promise(r => setTimeout(r, 300));
    }
    o.ev = lsEvents
      .slice(0, lsEvents.length - n1)
      .map(e => e.t + ' ' + e.text)
      .filter(x => /blower B/i.test(x));
    return o;
  }, sv);
  ck(r.both === '1/1' && r.A === 0, 'B running alone after A stopped (' + r.both + ', A ' + r.A + ')');
  ck(r.trip != null, 'B tripped with its damper at 0 % after ' + r.trip + ' s (current ' + r.ibT + ' A at the trip, L.L. 24.6 A)');
  const ln = r.ev.find(x => /STOPPED by its logic|stopped by its logic/.test(x)) || '';
  ck(/CURRENT L\.L\./.test(ln), 'the stop line names CURRENT L.L.: ' + ln);
  ck(
    ln && !/TR133|pulse ends|logic: fluidizing air blower B STOPPED/.test(ln),
    'not the TR133 pulse nor "B STOPPED" as its cause'
  );
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
