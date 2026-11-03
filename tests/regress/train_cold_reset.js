// M25 (option 1, leader 2026-11-03): a cold plant = Training step 1. A Training saved at step 2 with ticks (as after a reload), then a
// Cold loaded from the plant (not the Training's own start): the Training is at step 1 again and has no ticks. And the other way: a
// reload with no new Cold keeps the saved step. Local and ?worker=1. Usage: node tests/regress/train_cold_reset.js [html]
const { open } = require('./lib.js');
const fs = require('fs'), url = require('url'), path = require('path');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
let fail = 0;
const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
async function mode(worker) {
  const name = worker ? 'worker' : 'local';
  const { browser, page, errs } = await open(html);
  /* the saved Training of a run before: step 2 (index 1), one tick */
  await page.evaluate(() => {
    localStorage.setItem('ls-guide', JSON.stringify({ cur: 1, hold: {}, mine: { x: 1 }, pw: {}, on: true }));
    localStorage.setItem('ls-train', JSON.stringify({ '1.4': 1 }));
  });
  await page.goto(url.pathToFileURL(path.resolve(html)).href + (worker ? '?worker=1' : ''));
  await page.waitForTimeout(2500);
  await page.evaluate(() => AN.setCat('an'));
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54, null, { timeout: 120000 });
  if (worker) await page.waitForFunction(() => window.ENG && (ENG.mode === 'mirror' || ENG.err), null, { timeout: 180000 });
  await page.waitForTimeout(1500);
  const a = await page.evaluate(() => ({ cur: LS_GUIDE.cur, tr: localStorage.getItem('ls-train') }));
  ck(a.cur === 1, name + ': a reload with no new Cold keeps the saved step (step ' + (a.cur + 1) + ', ticks ' + a.tr + ')');
  /* a Cold from the plant, not from the Training */
  await page.evaluate(async () => {
    await AN.loadStart('cold');
  });
  if (worker) await page.waitForFunction(() => !ENG.heavy, null, { timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const b = await page.evaluate(() => ({ cur: LS_GUIDE.cur, tr: localStorage.getItem('ls-train') }));
  ck(b.cur === 0, name + ': after a Cold the Training is at step 1 (step ' + (b.cur + 1) + ')');
  ck(b.tr === '{}', name + ': after a Cold the Training has no ticks (' + b.tr + ')');
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
