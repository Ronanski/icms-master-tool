// The plant keeps running on a DITL page in the Worker, as in local mode (Mina's live test #M10, 2026-11-02: opening DITL-39 from the
// Training dock froze the whole plant). setCat (src/analog/ui/category-search.js) sets AN.run = false and SIM = the run that was on: in
// local mode the one world then scans with SIM (world.js scanJob) and steps the ABC sheets of the world. The engine must know AN.cat
// (state.js AN_STATE_FLAGS 'cat') to do the same. Checks, ?worker=1: RUN on the ABC page, then the DITL page: the engine's category is
// the page's, its world scans go on, its ABC time goes on; back to the ABC page: the same. Usage: node tests/regress/worker_cat.js [html]
const { open } = require('./lib.js');
const fs = require('fs'), url = require('url'), path = require('path');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
let fail = 0;
const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
(async () => {
  const { browser, page, errs } = await open(html);
  await page.goto(url.pathToFileURL(path.resolve(html)).href + '?worker=1');
  await page.waitForTimeout(2500);
  await page.evaluate(() => AN.setCat('an'));
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54, null, { timeout: 120000 });
  await page.waitForFunction(() => window.ENG && (ENG.mode === 'mirror' || ENG.err), null, { timeout: 180000 });
  ck(await page.evaluate(() => ENG.mode === 'mirror'), 'the engine runs in the worker (mirror)');
  /* the engine's ABC time of the sheet on screen and its world scans */
  const eng = () =>
    page.evaluate(async () => {
      const k = await ENG.peek();
      return { cat: k.kf && JSON.stringify(k.kf).match(/"cat":"(\w+)"/), n: k.n };
    });
  await page.evaluate(() => {
    AN.startState = AN.startState || 'test';
    AN.run = true;
  });
  await page.waitForTimeout(2000);
  const a0 = await eng();
  await page.waitForTimeout(2000);
  const a1 = await eng();
  ck(a1.n.abc > a0.n.abc && a1.n.world > a0.n.world, 'ABC page, RUN: the engine steps (ABC ' + a0.n.abc + ' -> ' + a1.n.abc + ', world ' + a0.n.world + ' -> ' + a1.n.world + ')');
  await page.evaluate(() => AN.setCat('dig'));
  await page.waitForTimeout(2000);
  const d0 = await eng();
  await page.waitForTimeout(3000);
  const d1 = await eng();
  const pg = await page.evaluate(() => ({ cat: AN.cat, run: AN.run, SIM }));
  ck(pg.cat === 'dig' && pg.SIM === true, 'DITL page: the page keeps the simulation the user chose (cat ' + pg.cat + ', SIM ' + pg.SIM + ', AN.run ' + pg.run + ')');
  ck(d1.cat && d1.cat[1] === 'dig', 'DITL page: the engine knows the category (' + (d1.cat ? d1.cat[1] : 'none') + ')');
  ck(d1.n.world > d0.n.world && d1.n.live, 'DITL page: the engine world goes on (world ' + d0.n.world + ' -> ' + d1.n.world + ', live ' + d1.n.live + ')');
  await page.evaluate(() => AN.setCat('an'));
  await page.waitForTimeout(3000);
  const b0 = await eng();
  await page.waitForTimeout(2000);
  const b1 = await eng();
  ck(b1.cat && b1.cat[1] === 'an' && b1.n.world > b0.n.world && b1.n.abc > b0.n.abc, 'back on the ABC page: the engine runs again (cat ' + (b1.cat ? b1.cat[1] : 'none') + ', ABC ' + b0.n.abc + ' -> ' + b1.n.abc + ')');
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
