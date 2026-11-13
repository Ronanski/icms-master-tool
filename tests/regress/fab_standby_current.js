// 3.2.3 (SOHEE, Mina S160-2 on beta.160): FA blower B in AUTO started by its logic while A ran, A stopped, then the Event log said
// "FAB B STOPPED" and B started again. Cause: the air power of an FA blower was its flow x the header pressure, so B alone at the 25 %
// line-up damper (about 14 T/H) drew 21.5 A, under the L.L. 24.6 A of DITL-28B row 12, and the drawing tripped it (DITL-28A #B row 17
// M.2549 FAB B CURRENT L.L.); the FA flow L.L. (< 20 T/H) started it again. The FA blower is a constant speed centrifugal blower with an
// inlet damper (equipment list K1AU3-L1-0-002 item 46.1): its power follows its own flow at the head of the snapshot.
// Checks, from Mina's b142 save (150 MW): B AUTO, B running with A (its START if its logic did not start it), A stopped the way Mina did
// (LS_GUIDE.A.motor): B runs at every scan for 60 s, its current stays over 24.6 A, no "STOPPED" line of B.
// Usage: node tests/regress/fab_standby_current.js [html] [save json]
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
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150 && window.LS_DOCK && window.LS_GUIDE, null, { timeout: 120000 });
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
    o.iMin = r1(o.iMin);
    o.A = AN.ditlRun('DITL-28A');
    o.fa = r1(AN.unit.fnFaQ);
    o.ib = r1(AN.unit.fnIb);
    o.ev = lsEvents.slice(0, lsEvents.length - n0).map(e => e.t + ' ' + e.text).filter(x => /blower B/i.test(x));
    return o;
  }, sv);
  ck(r.both === '1/1', 'B running with A before A stops (' + r.both + ', FA ' + r.st + ' T/H at the AUTO, B ' + r.r5 + ')');
  ck(r.A === 0 && r.drop === 0, 'A stopped; B ran at every scan for 60 s (scans not running: ' + r.drop + ')');
  ck(r.iMin > 24.6, 'B current lowest ' + r.iMin + ' A > L.L. 24.6 A (now ' + r.ib + ' A at ' + r.fa + ' T/H)');
  ck(!r.ev.some(x => /STOPPED|stopped/.test(x)), 'no STOPPED line of blower B: ' + JSON.stringify(r.ev));
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
