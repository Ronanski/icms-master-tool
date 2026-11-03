// The status bar clock "t = m:ss" moves on every page while RUN (Mina's live tests M2 and M17: it stood at t = 0:00 on the Plant view;
// paint.js anClock, PR #98). Checks, local and ?worker=1: Start at 150 MW, RUN at x10, the Plant view (Operate tab) open: the text of the
// clock changes within 4 s and is not "t = 0:00". Usage: node tests/regress/status_clock.js [html]
const { open } = require('./lib.js');
const fs = require('fs'), url = require('url'), path = require('path');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
let fail = 0;
const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
/* the clock of the status bar: the span whose text starts with "t = " */
const clock = page => page.evaluate(() => ([...document.querySelectorAll('span')].find(s => /^t = \d+:\d\d/.test(s.textContent || '')) || {}).textContent || '');
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
  await page.evaluate(async () => {
    await AN.loadStart('150');
    AN.spd = 10;
    AN.runOn();
    if (window.lsSetTab) lsSetTab('operate');
  });
  await page.waitForTimeout(2000);
  const a = await clock(page);
  await page.waitForTimeout(4000);
  const b = await clock(page);
  ck(!!b && b !== 't = 0:00' && a !== b, name + ': the clock moves on the Plant view while RUN (' + a + ' -> ' + b + ')');
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
