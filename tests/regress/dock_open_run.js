// Opening a drawing from the Training dock never changes RUN, and the DITL keeps scanning (Mina's live test #M26 / #M27, 2026-11-03):
// in da4f51b the dock's openD pressed RUN again after AN.xrefGo (src/ui/training/dock.js, "RUN kept"), at another moment than setCat's own
// carry-over (src/analog/ui/category-search.js), so the status went RUN / PAUSED / "RUN (ABC)" and the DCS START of SWP-A / B and the
// FIELD REMOTE did nothing. Now setCat alone carries RUN (and a paused DITL page stays paused). Checks, local and ?worker=1: 150 MW, the
// DITL in service, ABC RUN; LS_DOCK.openD of a DITL drawing: RUN stays on with no toggle for 2 s, no "RUN kept" event, the world scans;
// the START PB of the A-AUX. COOLING WATER PUMP (DITL-76 row 2, as eng_radio_winter.js) runs it (row 5 RUNNING); a maintained selection
// (DITL-78 row 1) stays; back to ABC: RUN on; a paused DITL page opens the ABC page paused. Usage: node tests/regress/dock_open_run.js [html]
const { open } = require('./lib.js');
const fs = require('fs'), url = require('url'), path = require('path');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
let fail = 0;
const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
const isRun = () =>
  AN.cat === 'an' ? !!AN.run && !AN.view : typeof SIM !== 'undefined' && !!SIM && !(typeof DPAUSE !== 'undefined' && DPAUSE);
async function mode(worker) {
  const name = worker ? 'worker' : 'local';
  const { browser, page, errs } = await open(html);
  if (worker) {
    await page.goto(url.pathToFileURL(path.resolve(html)).href + '?worker=1');
    await page.waitForTimeout(2500);
  }
  await page.evaluate(() => AN.setCat('an'));
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54, null, { timeout: 120000 });
  if (worker) await page.waitForFunction(() => window.ENG && (ENG.mode === 'mirror' || ENG.err), null, { timeout: 180000 });
  await page.evaluate(async () => {
    const C = AN.sheets.find(s => s.name === 'ABC-001C');
    AN.i = AN.sheets.indexOf(C);
    await AN.plantLoad150();
    await DITL150.apply();
    AN.spd = 1;
  });
  if (worker) await page.waitForFunction(() => !ENG.heavy, null, { timeout: 120000 }).catch(() => {});
  await page.evaluate(() => AN.runOn());
  await page.waitForTimeout(1000);
  ck(await page.evaluate(isRun), name + ': ABC RUN on before the drawing is opened');
  /* open a DITL drawing from the dock; sample RUN every 100 ms for 2 s */
  const r = await page.evaluate(async isRunS => {
    const isRun = eval(isRunS);
    const ev0 = (window.lsEvents ? lsEvents() : []).length;
    LS_DOCK.openD('DITL-76');
    const seen = [];
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 100));
      seen.push(isRun());
    }
    let flips = 0;
    for (let i = 1; i < seen.length; i++) if (seen[i] !== seen[i - 1]) flips++;
    const tk0 = WORLD.tk || 0;
    await new Promise(r => setTimeout(r, 1500));
    const logTxt = document.body.innerText;
    return { cat: AN.cat, run: isRun(), flips, scans: (WORLD.tk || 0) - tk0, kept: /RUN kept while opening/.test(logTxt), ev0 };
  }, '(' + isRun.toString() + ')');
  ck(r.cat !== 'an' && r.run && r.flips === 0, name + ': DITL-76 opened from the dock, RUN on, no toggle in 2 s (cat ' + r.cat + ', flips ' + r.flips + ')');
  ck(!r.kept, name + ': no second RUN press ("RUN kept" event) while opening');
  ck(r.scans > 0, name + ': the DITL world scans on the drawing (' + r.scans + ' scans in 1.5 s)');
  /* the DCS START of a pump on the opened drawing runs it; a maintained selection stays */
  const out = (nm, row) => {
    const k = Object.keys(WORLD.out || {}).find(x => new RegExp('\\)' + nm + '$').test(x));
    return k && WORLD.out[k] && WORLD.out[k].has(row) ? 1 : 0;
  };
  const p = await page.evaluate(async outS => {
    const out = eval(outS);
    const before = out('DITL-76', 4);
    const pr = WORLD.dpress('DITL-76', 1),
      sel = WORLD.dset('DITL-78', 0, 1);
    let run = 0;
    for (let i = 0; i < 60 && !run; i++) {
      await new Promise(r => setTimeout(r, 100));
      run = out('DITL-76', 4);
    }
    await new Promise(r => setTimeout(r, 1500));
    const s78 = S.sheets.find(s => /\)DITL-78$/.test(s.name));
    return { before, pr, sel, run, keep: !!(s78 && s78.sig && s78.sig['0:S']) };
  }, '(' + out.toString() + ')');
  ck(p.before === 0 && p.pr === true && p.run === 1, name + ': START PB DITL-76 row 2 runs the A-AUX. CW PUMP (RUNNING ' + p.before + ' -> ' + p.run + ')');
  ck(p.sel === true && p.keep, name + ': maintained selection DITL-78 row 1 stays 1');
  /* back to the ABC page: RUN on again (setCat, once) */
  await page.evaluate(() => AN.setCat('an'));
  await page.waitForTimeout(2500);
  ck(await page.evaluate(isRun), name + ': back on the ABC page, RUN on');
  /* a paused DITL page: the ABC page it opens stays paused */
  await page.evaluate(() => AN.setCat('dig'));
  await page.waitForTimeout(800);
  await page.evaluate(() => (DPAUSE = true));
  await page.evaluate(() => AN.setCat('an'));
  await page.waitForTimeout(2500);
  ck(!(await page.evaluate(isRun)), name + ': a paused DITL page opens the ABC page paused');
  ck(!errs.length, name + ': no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
}
(async () => {
  await mode(false);
  await mode(true);
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
