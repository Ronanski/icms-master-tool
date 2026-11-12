// 3.2.3 (Mina F151-4): the COAL page showed coal feeder A "29.4 T/H, SV 29.4, MV 4.0 %" with the feeder in MANUAL at 4 T/H. The PV of a MAN
// station with no TAG.PV wire was its set input (the AUTO demand), and the MV unit was "%" while the station works in T/H. The page now shows
// the feedrate transmitter MIF-CL1061-x (AI0480 / AI0512 / AI0544, ABC-004A ~ C) as the PV and the MV in T/H. Check at "Start at 150 MW":
// feeder A to MANUAL 4 T/H, the page shows PV = the feeder flow of the plant model (4.0), MV 4.0 T/H; B and C PV = their flow.
// Usage: node tests/regress/cl_feeder_values.js [html]
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
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150 && window.LS_MOCK, null, {
    timeout: 120000
  });
  await page.waitForTimeout(2000);
  const run = sec =>
    page.evaluate(async sec => {
      const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
      WORLD.live = true;
    }, sec);
  await page.evaluate(() => {
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
  });
  await run(60);
  console.log('man: ' + (await page.evaluate(() => LS_GUIDE.A.man('FICCL1061A', 4))));
  await run(180);
  await page.evaluate(() => lsPlant(true));
  await page.waitForTimeout(1000);
  await page.evaluate(() => document.querySelector('#pllist button[data-id="MK12"]').click());
  await page.waitForTimeout(6000);
  const r = await page.evaluate(() => {
    const tx = s => ((document.querySelector(`[data-ctl="${s}"]`) || {}).textContent || '').trim();
    const U = AN.unit,
      fuel = U.fuel.map(l => (l.length ? +l[0][0].rt.st[l[0][1].id].val : NaN));
    return { fuel, pg: ['A', 'B', 'C'].map(x => ['pv|1| T/H', 'sv|1|', 'mv|1| T/H', 'mode|U'].map(w => tx('FICCL1061' + x + '|' + w))) };
  });
  console.log(JSON.stringify(r));
  const n = s => parseFloat(s);
  ['A', 'B', 'C'].forEach((x, i) =>
    ck(Math.abs(n(r.pg[i][0]) - r.fuel[i]) < 0.6, 'feeder ' + x + ' page PV ' + r.pg[i][0] + ' = feeder flow ' + r.fuel[i].toFixed(1) + ' T/H')
  );
  ck(/T\/H$/.test(r.pg[0][2]) && Math.abs(n(r.pg[0][2]) - 4) < 0.05, 'feeder A page MV ' + r.pg[0][2] + ' (MANUAL 4 T/H)');
  ck(r.pg[0][3] === 'MANUAL', 'feeder A mode ' + r.pg[0][3]);
  ck(!errs.length, 'no page errors ' + errs.slice(0, 2).join(' | '));
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
