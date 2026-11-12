// 3.2.3 (SOHEE, after Mina S155-1: the deaerator emptied and both feed pumps tripped with no deaerator LOW-LOW line before the trip).
// Alarm list "Alarm List _20160912": LT-CD1104-1 ~ 3 L -150 / LL -2174 mm (ABC-031 ALM), switch LSLL-CD1104-4 at 177 mm from the bottom
// (-2147 mm, plantsw.js), the feed pump trip (DITL-23B row 4) and the annunciator DITL-40. Checks, from Mina's b142 save (150 MW) loaded
// as the LOAD button does (lsEventsLoaded), LICCD1104 MANUAL 0 %: the deaerator level LOW line is a real alarm (not "suppressed: the
// equipment of its group is stopped" while the feed pumps run), the LSLL-CD1104-4 LOW-LOW line comes, no later than the feed pumps stop.
// Usage: node tests/regress/da_ll_alarm.js [html] [save json]
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
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150 && window.LS_GUIDE && window.lsEventsLoaded, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async sv => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    const run = async sec => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 20 === 19) await new Promise(r => setTimeout(r, 0));
      }
    };
    const bfp = () => +LS_LIVE.val('M.3343') + +LS_LIVE.val('M.3344');
    AN.run = false;
    DITL150.savePut({ kf: sv.kf, kd: sv.kd, ver: '' });
    lsEventsLoaded('b142 test');
    await run(2);
    await new Promise(r => setTimeout(r, 1200));
    const o = { bfp0: bfp() };
    LS_GUIDE.A.man('LICCD1104', 0);
    /* the alarm scan of the page runs each 500 ms of real time: 30 s steps to 12 min, then 1 s steps, so a line is not late by the test */
    for (let k = 0; k < 24; k++) {
      await run(30);
      await new Promise(r => setTimeout(r, 600));
    }
    for (let k = 0; k < 1200 && bfp() > 0; k++) {
      await run(1);
      await new Promise(r => setTimeout(r, 550));
    }
    await new Promise(r => setTimeout(r, 1200));
    o.bfp1 = bfp();
    o.ev = lsEvents.map(e => e.t + ' ' + e.kind + ' ' + e.text).filter(x => /deaerator|CD1104|feed water pump [AB] (TRIP|STOPPED)/i.test(x)).reverse();
    return o;
  }, sv);
  const i = re => r.ev.findIndex(x => re.test(x));
  const lo = r.ev.filter(x => /deaerator storage tank level \(1\) LOW\b/.test(x));
  ck(r.bfp0 === 2 && r.bfp1 === 0, 'both feed pumps ran, then tripped on the empty deaerator (' + r.bfp0 + ' -> ' + r.bfp1 + ')');
  ck(lo.length > 0 && !/suppressed/.test(lo[0]), 'deaerator level LOW is a real alarm while the feed pumps run: ' + (lo[0] || 'none'));
  /* the page scans its alarms each 500 ms of real time while the test steps the plant: the line is checked against the pumps' own
     STOPPED line of the same scan, by its time */
  const ts = x => (x ? String(x).split(' ')[0].split(':').reduce((a, b) => a * 60 + +b, 0) : NaN);
  const sw = i(/LSLL-CD1104-4 .*LOW-LOW/), tr = i(/feed water pump [AB] STOPPED/);
  ck(sw >= 0 && tr >= 0 && ts(r.ev[sw]) <= ts(r.ev[tr]), 'LSLL-CD1104-4 LOW-LOW line (' + (r.ev[sw] || 'none') + '), not after the feed pumps stopped (' + (r.ev[tr] || 'none') + ')');
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(r.ev.join('\n'));
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
