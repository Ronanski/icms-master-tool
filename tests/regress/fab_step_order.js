// 3.2.3 (SOHEE, Mina S165-1 / S165-2 / S165-3 on beta.165, Cold start step 35 "Start the fluidizing air blower"):
// S165-1: the "Do it" pressed "Damper of the running blower M 41 %" together with START FAB-A (the damper button stands between the two
// START buttons since beta.164): the damper left its 25 % start position, FCD READY M.1033 = 0 and FAB-A could not start. A button that
// is not a machine, listed after the first START, now waits until the blower runs.
// S165-2: the NEXT card names the damper before the standby AUTO, and the Do it puts no standby in AUTO while the damper is under 39 %.
// Checks (Worker): Cold plant, FAB step opened, IDF not running (so FAB-A cannot start): after the Do it the damper FICFA1055A is not
// at 41 %; then the step's own damper button and preSby text.
// Usage: node tests/regress/fab_step_order.js [html]
const { open } = require('./lib.js');
const fs = require('fs'),
  url = require('url'),
  path = require('path');
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
  await page.goto(url.pathToFileURL(path.resolve(html)).href + '?worker=1');
  await page.waitForTimeout(2500);
  await page.evaluate(() => AN.setCat('an'));
  await page.waitForFunction(() => window.ENG && (ENG.mode === 'mirror' || ENG.err), null, { timeout: 120000 });
  await page.evaluate(() => lsSetTab('training'));
  await page.waitForTimeout(800);
  await page.evaluate(() => [...document.querySelectorAll('#trainws button.trbtn')].find(x => /^Guide/.test(x.textContent)).click());
  await page.waitForFunction(() => LS_GUIDE.on && document.getElementById('gdock') && !ENG.heavy, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  const idx = await page.evaluate(() => LS_GUIDE.steps().findIndex(s => /^Start the fluidizing air blower/.test(s.t)));
  console.log('step', idx + 1);
  await page.evaluate(i => {
    LS_GUIDE.open(i);
    AN.runOn && AN.runOn();
  }, idx);
  await page.waitForTimeout(3000);
  const mv0 = await page.evaluate(() => +LS_LIVE.mvOf(LS_LIVE.fp('FICFA1055A')));
  for (let k = 0; k < 3; k++) {
    await page.evaluate(() => LS_GUIDE.doIt());
    await page.waitForTimeout(2500);
  }
  const r = await page.evaluate(i => {
    const s = LS_GUIDE.steps()[i];
    return {
      runA: +LS_LIVE.val('M.3308'),
      mv: +LS_LIVE.mvOf(LS_LIVE.fp('FICFA1055A')),
      pre: s.preSby ? s.preSby() : null,
      dOn: (s.a || []).filter(a => /Damper of the running blower/.test(a.l)).map(a => !!(a.on && a.on()))
    };
  }, idx);
  ck(idx >= 0, 'FAB step found (' + (idx + 1) + ')');
  ck(r.runA === 0 && !(r.mv > 39), 'FAB-A not running (no IDF): the Do it left the damper at its start position (' + mv0 + ' -> ' + r.mv + ' %, not 41)');
  ck(typeof r.pre === 'string' && /41 %/.test(r.pre) && r.dOn[0] === false, 'damper under 39 %: the step names it before the standby AUTO (' + r.pre + ')');
  ck(!errs.length, 'no page error ' + errs.slice(0, 2).join(' | '));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => {
  console.log('ERR', String(e).slice(0, 300));
  process.exit(1);
});
