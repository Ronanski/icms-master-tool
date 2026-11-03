// M25 (option 1, leader 2026-11-03): a cold plant = Training step 1. A Training saved at step 2 with ticks (as after a reload), then a
// Cold loaded from the plant (not the Training's own start): the Training is at step 1 again and has no ticks. And the other way: a
// reload with no new Cold keeps the saved step. Usage: node tests/regress/train_cold_reset.js [html]
const { open } = require('./lib.js');
const fs = require('fs');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
let fail = 0;
const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
(async () => {
  const { browser, page, errs } = await open(html);
  /* the saved Training of a run before: step 2 (index 1), one tick */
  await page.evaluate(() => {
    localStorage.setItem('ls-guide', JSON.stringify({ cur: 1, hold: {}, mine: { x: 1 }, pw: {}, on: true }));
    localStorage.setItem('ls-train', JSON.stringify({ '1.4': 1 }));
  });
  await page.reload();
  await page.waitForTimeout(2500);
  await page.evaluate(() => AN.setCat('an'));
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54, null, { timeout: 90000 });
  await page.waitForTimeout(1500);
  const a = await page.evaluate(() => ({ cur: LS_GUIDE.cur, tr: localStorage.getItem('ls-train') }));
  ck(a.cur === 1, 'a reload with no new Cold keeps the saved step (step ' + (a.cur + 1) + ')');
  /* a Cold from the plant, not from the Training */
  await page.evaluate(async () => {
    await AN.loadStart('cold');
  });
  await page.waitForTimeout(1500);
  const b = await page.evaluate(() => ({ cur: LS_GUIDE.cur, tr: localStorage.getItem('ls-train') }));
  ck(b.cur === 0, 'after a Cold the Training is at step 1 (step ' + (b.cur + 1) + ')');
  ck(b.tr === '{}', 'after a Cold the Training has no ticks (' + b.tr + ')');
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
