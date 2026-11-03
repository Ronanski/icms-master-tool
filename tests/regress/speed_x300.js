// The speed is the one chosen (user 2026-11-03, M32: "x300 na 6 h, 1.2 min nalang"; Mina measured about x100). Local and ?worker=1:
// Start Cold (as the Training), speed x300, RUN, the Plant view open: the plant time over 20 s of real time must be at least 0.9 x 300
// (the 6 h ESP purge of step 1 then takes at most 80 s, not 3.6 min). Prints the measured factor and the real seconds a 6 h purge takes.
// Usage: node tests/regress/speed_x300.js [html]
const { open } = require('./lib.js');
const fs = require('fs'), url = require('url'), path = require('path');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
let fail = 0;
const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
const SPD = 300, SECS = 20;
async function mode(worker) {
  const name = worker ? 'worker' : 'local';
  const { browser, page, errs } = await open(html);
  if (worker) {
    await page.goto(url.pathToFileURL(path.resolve(html)).href + '?worker=1');
    await page.waitForTimeout(2500);
    await page.evaluate(() => AN.setCat('an'));
    await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54, null, { timeout: 120000 });
    await page.waitForFunction(() => window.ENG && (ENG.mode === 'mirror' || ENG.err), null, { timeout: 180000 });
  }
  await page.evaluate(async spd => {
    await AN.loadStart('cold');
    AN.spd = spd;
    AN.runOn();
    if (window.lsSetTab) lsSetTab('operate');
  }, SPD);
  /* the plant time of the sheet on screen (the page's own in local, the mirror of the engine in the worker) */
  const t = () => page.evaluate(() => { const sh = AN.sheets[AN.i]; return sh && sh.S ? +sh.S.rt.t : NaN; });
  await page.waitForTimeout(3000);
  const t0 = await t(), w0 = Date.now();
  await page.waitForTimeout(SECS * 1000);
  const t1 = await t(), w1 = Date.now();
  const f = (t1 - t0) / ((w1 - w0) / 1000);
  console.log('INFO ' + name + ': x' + SPD + ' gives x' + f.toFixed(0) + ' (plant ' + (t1 - t0).toFixed(0) + ' s in ' + ((w1 - w0) / 1000).toFixed(1) + ' s); a 6 h purge takes ' + (21600 / f).toFixed(0) + ' s');
  ck(f >= 0.9 * SPD, name + ': the plant runs at the speed chosen (x' + f.toFixed(0) + ' of x' + SPD + ')');
  ck(!errs.length, name + ': no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
}
(async () => {
  /* one browser at a time (team-files/TEST_LOCK_RULE.md) */
  await mode(false);
  await mode(true);
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
