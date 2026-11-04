// 3.2.1 (IRENE, coordinator 2026-11-04: PAF / SAF stopped): at 150 MW the operator pauses (VIEW), opens the DITL page, comes back and
// presses RUN again. Before (src/digital/parts/03b-sim.js simOn): a read on the paused DITL page evaluated DITL-27A without its world
// inputs, the SAF latch was reset, the PAF followed (DITL-26A row 18) and at RUN the MFT came. Now the fans keep running.
// Usage: node tests/regress/pause_ditl_page.js [html]
const fs = require('fs');
const { open } = require('./lib.js');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async () => {
  const { browser, page, errs } = await open(html);
  let fail = 0;
  const ck = (ok, w) => {
    console.log((ok ? 'PASS ' : 'FAIL ') + w);
    if (!ok) fail++;
  };
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && S.sheets.length >= PRE_N, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  const run = sec => page.evaluate(async sec => { const C1 = AN.sheets.find(s => s.name === 'ABC-001C'); for (let i = 0; i < sec * 2; i++) { AN.stepSet(C1, 0.5); WORLD.tick(0.5); if (i % 100 === 99) await new Promise(r => setTimeout(r, 0)); } }, sec);
  const st = () => page.evaluate(() => ({ f: ['DITL-25A', 'DITL-27A', 'DITL-26A'].map(n => DUI.motState(S.sheets.find(x => x.name.endsWith(n)))).join(','), mft: DUI.outVal(S.sheets.find(x => x.name.endsWith('DITL-06')), 1), MW: Math.round(AN.unit.MW) }));
  await page.evaluate(() => { AN.run = false; AN.reset(); ditlStates(); AN.plantLoad150(); DITL150.apply(); AN.viewSet(false); AN.run = true; });
  await run(30);
  const a = await st();
  await page.evaluate(() => AN.viewSet(true));
  await page.evaluate(() => AN.setCat('dig'));
  await page.waitForTimeout(1000);
  const b = await st();
  await page.evaluate(() => AN.setCat('an'));
  await page.waitForTimeout(3000);
  await page.evaluate(() => { AN.viewSet(false); AN.run = true; });
  await run(60);
  const c = await st();
  console.log(JSON.stringify({ a, b, c }));
  ck(a.f === 'RUN,RUN,RUN', `150 MW running: IDF, SAF, PAF ${a.f}`);
  ck(b.f === 'RUN,RUN,RUN', `paused, DITL page open: IDF, SAF, PAF ${b.f}`);
  ck(c.f === 'RUN,RUN,RUN' && c.mft === 0 && c.MW > 140, `RUN again for 60 s: IDF, SAF, PAF ${c.f}, boiler trip ${c.mft}, ${c.MW} MW`);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
