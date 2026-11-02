// RUN on a DITL page keeps the logic (Mina's live test #M9, 2026-11-02): the Training dock's RUN chip on a DITL page clicks the DITL
// "▶ Run" (src/ui/training/dock.js runNow -> .dui-run); with the one world ON that RUN only turns the simulation on (src/ui/shell/ditl.js),
// it no longer goes through the old Simulate button (ditlStates = the DITL Reset). Checks, local and ?worker=1: the plant at 150 MW with
// the DITL in service (motor / valve states MST, latched flip-flops), the DITL page opened while not simulating, the dock RUN pressed:
// SIM on, the motor / valve states and the latches are still there, the speed is the plant's. Then the DITL "Reset" button still resets.
// Usage: node tests/regress/ditl_run_keeps.js [html]
const { open } = require('./lib.js');
const fs = require('fs'), url = require('url'), path = require('path');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
let fail = 0;
const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
/* the DITL logic memory: motor / valve states and the latched flip-flops (the engine's in Worker mode) */
const mem = (page, worker) =>
  page.evaluate(async worker => {
    if (worker) await new Promise(r => setTimeout(r, 1200));
    const k = worker ? (await ENG.peek()).kd : ditlCapture();
    let ff = 0;
    for (const s of k.sh) for (const g of (s.nl && s.nl.g) || []) if (g.q === 1) ff++;
    const p = k.sh.find(s => /\)DITL-15$/.test(s.name));
    return { mst: Object.keys(k.MST || {}).length, ff, SIM, TSP, spd: AN.spd, probe: !!(p && p.s.sig && p.s.sig["11:S"]) };
  }, worker);
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
  /* 150 MW, the DITL in service, the plant speed x10, paused (the DITL page then opens not simulating) */
  await page.evaluate(async () => {
    await AN.plantLoad150();
    await DITL150.apply();
    AN.spd = 10;
    AN.run = false;
  });
  if (worker) await page.waitForFunction(() => !ENG.heavy, null, { timeout: 120000 }).catch(() => {});
  await page.evaluate(() => AN.setCat('dig'));
  await page.waitForTimeout(1500);
  const a = await mem(page, worker);
  ck(a.SIM === false && a.mst > 0 && a.ff > 0, name + ': before RUN, the DITL page is not simulating and the logic has its memory (SIM ' + a.SIM + ', motor / valve states ' + a.mst + ', latches ' + a.ff + ')');
  /* the Training dock's RUN on a DITL page does exactly this (dock.js runNow) */
  await page.evaluate(() => document.querySelector('.dui-run').click());
  await page.waitForTimeout(2000);
  const b = await mem(page, worker);
  ck(b.SIM === true, name + ': RUN turns the simulation on (SIM ' + b.SIM + ')');
  ck(b.mst >= a.mst && b.ff >= Math.round(a.ff * 0.9), name + ': RUN keeps the logic (motor / valve states ' + a.mst + ' -> ' + b.mst + ', latches ' + a.ff + ' -> ' + b.ff + ')');
  ck(b.TSP === b.spd, name + ': RUN keeps the plant speed (DITL speed ' + b.TSP + ', plant x' + b.spd + ')');
  /* the DITL "Reset" button is still the DITL Reset ("all inputs OFF"). Not the latch count: with the plant at 150 MW and the DITL in
     service, ditlStates applies the 150 MW DITL state again right after (03b-sim.js: SIM && DITL150.on), and the running world latches
     the same interlocks again, so the latches come back by design. A manual input (DITL-15 row 11, a push button no plant drives) must go */
  await page.evaluate(() => (S.sheets.find(x => /\)DITL-15$/.test(x.name)).sig["11:S"] = true));
  await page.waitForTimeout(1500);
  const p0 = await mem(page, worker);
  await page.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent === 'Reset' && /Start again/.test(x.title)).click());
  await page.waitForTimeout(2000);
  const c = await mem(page, worker);
  ck(p0.probe && !c.probe, name + ": the DITL Reset button still resets (the manual input DITL-15 row 11: " + p0.probe + " -> " + c.probe + ")");
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
