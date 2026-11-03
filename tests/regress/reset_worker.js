// Reset in the Worker = Reset on the page (Giselle's review of C1, team-files/progress/giselle-review-C1-a2357e8.md, item 1 and the
// Reset button of item 2). The Reset button (interaction.js bRst) is pressed twice in each mode, local and ?worker=1:
// A: on the fresh page. B: after a dirty run (Start at 150 MW, DITL in service, a DITL push button held = a motor started by hand,
// retest #68; a saved probe value in AN.sv + anSave; a block selected; 20 s of RUN).
// After each Reset: DITL150.on false, no DITL field signal left, AN.sv has only block settings (no probe), localStorage 'ditl.an' =
// AN.sv, the toast "Reset done", AN.sel null. Then B = A (the ABC state, the DITL state, AN.sv), the worker = the page mirror
// (ENG.peek), and local A = worker A. Usage: node tests/regress/reset_worker.js [html]
const { open } = require('./lib.js');
const fs = require('fs'), url = require('url'), path = require('path');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
let fail = 0;
const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
/* the first place two strings differ, with some text around it */
const dif = (a, b) => { a = String(a); b = String(b); let i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(Math.max(0, i - 80), i + 160) + '  <>  ' + b.slice(Math.max(0, i - 80), i + 160); };
/* press the Reset button, wait until the engine has done it (worker: no long action left, the last patch in), read the state */
const resetAndRead = async (page, worker) => {
  await page.evaluate(() => { const t = document.getElementById('toast'); if (t) { t.textContent = ''; t.hidden = true; } });
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent === 'Reset' && /Reset this sheet/.test(b.title)).click());
  if (worker) await page.waitForFunction(() => !ENG.heavy, null, { timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(1500);
  return page.evaluate(async worker => {
    AN.run = false;
    if (worker) { ENG.flush(); await new Promise(r => setTimeout(r, 800)); }
    const f = x => (x == null || !isFinite(x) ? String(x) : +(+x).toPrecision(12));
    const srt = v => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
    const js = o => JSON.stringify(o, (k, v) => (typeof v === 'number' ? f(v) : srt(v)));
    /* the ABC keyframe with the encoder's object numbers ($id / $ref, src/analog/engine/state.js anStateEnc) set to 0: the number is the
       order the encoder met the objects in, not plant state; where an object is shared ($ref) or a copy stays visible (Winter's diag_abc4,
       2026-11-02: all four comparisons equal once numbered alike) */
    const jsK = o => JSON.stringify(o, (k, v) => (k === '$id' || k === '$ref' ? 0 : typeof v === 'number' ? f(v) : srt(v)));
    const sig = [];
    for (const s of S.sheets.concat((window.WORLD && WORLD.inst) || [])) for (const k in s.sig || {}) if (s.sig[k]) sig.push(s.name + ' ' + k);
    /* the worker stopped (ENG.fail: worker null, the red bar): no peek, the reason is read */
    const w = worker && ENG.worker ? await ENG.peek() : null;
    return {
      on: !!DITL150.on, sig, sel: AN.sel == null, toast: (document.getElementById('toast') || {}).textContent || '',
      sv: js(AN.sv), ls: (() => { try { return js(JSON.parse(localStorage.getItem('ditl.an'))); } catch (e) { return 'unreadable'; } })(), probe: Object.keys(AN.sv).filter(k => /^__winter/.test(k)),
      abc: jsK(AN.engState.capture()), ditl: js(ditlCapture()),
      wabc: w ? jsK(w.kf) : null, wditl: w ? js(w.kd) : null, mode: window.ENG ? ENG.mode : '-', bar: !!document.getElementById('engerr'), err: window.ENG && ENG.err ? JSON.stringify(ENG.err).slice(0, 400) : ''
    };
  }, worker);
};
const one = async (A, B, name) => {
  ck(!B.on && !B.sig.length, name + ': DITL back to cold after Reset (DITL in service ' + B.on + ', field signals left ' + B.sig.length + (B.sig.length ? ': ' + B.sig.slice(0, 4).join(', ') : '') + '; on the fresh page after Reset ' + A.sig.length + ')');
  ck(!B.probe.length && B.ls === B.sv, name + ': the saved values are cleared (probe in AN.sv ' + B.probe.length + ', browser storage = AN.sv ' + (B.ls === B.sv) + ')');
  ck(/^Reset done/.test(B.toast) && B.sel, name + ': the page part of Reset (toast "' + B.toast.slice(0, 40) + '", selection cleared ' + B.sel + ')');
  ck(A.abc === B.abc, name + ': ABC state after the dirty run + Reset = Reset on the fresh page' + (A.abc === B.abc ? '' : '\n   ' + dif(A.abc, B.abc)));
  ck(A.ditl === B.ditl, name + ': DITL state after the dirty run + Reset = Reset on the fresh page' + (A.ditl === B.ditl ? '' : '\n   ' + dif(A.ditl, B.ditl)));
  ck(A.sv === B.sv, name + ': the saved values after the dirty run + Reset = Reset on the fresh page' + (A.sv === B.sv ? '' : '\n   ' + dif(A.sv, B.sv)));
};
async function mode(worker) {
  const name = worker ? 'worker' : 'local';
  const { browser, page, errs } = await open(html);
  if (worker) {
    await page.goto(url.pathToFileURL(path.resolve(html)).href + '?worker=1');
    await page.waitForTimeout(2500);
    await page.evaluate(() => AN.setCat('an'));
    await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54, null, { timeout: 120000 });
    await page.waitForFunction(() => window.ENG && (ENG.mode === 'mirror' || ENG.err), null, { timeout: 180000 });
    await page.waitForFunction(() => ENG.got > 0 || ENG.err, null, { timeout: 60000 }).catch(() => {});
  }
  await page.evaluate(() => { AN.i = AN.sheets.findIndex(s => s.name === 'ABC-001C'); });
  const A = await resetAndRead(page, worker);
  /* the dirty run */
  await page.evaluate(() => { AN.plantLoad150(); DITL150.apply(); });
  if (worker) await page.waitForFunction(() => !ENG.heavy, null, { timeout: 120000 }).catch(() => {});
  await page.evaluate(() => {
    S.sheets.find(x => /DITL-15$/.test(x.name)).sig['11:S'] = true;
    AN.sv.__winter_probe = { p: {}, f: { probe: 1 } };
    localStorage.setItem('ditl.an', JSON.stringify(AN.sv)); /* anSave is not on window: write the saved values the way anSave does */
    const C = AN.sheets[AN.i];
    if (C && C.S && C.S.blk.length) AN.sel = { blk: C.S.blk[0] }; /* the shape the app uses (interaction.js 237) */
    AN.run = true;
  });
  await page.waitForTimeout(20000);
  const B = await resetAndRead(page, worker);
  await one(A, B, name);
  if (worker) {
    ck(B.wabc === B.abc && B.wditl === B.ditl, name + ': after Reset the worker = the page mirror (ABC ' + (B.wabc === B.abc) + ', DITL ' + (B.wditl === B.ditl) + ')' + (B.wabc === B.abc ? '' : '\n   ' + dif(B.wabc, B.abc)));
    ck(B.mode === 'mirror' && !B.bar, name + ': the engine stays in the worker (mode ' + B.mode + (B.bar ? ', error bar' : '') + (B.err ? ', engine error ' + B.err : '') + ')');
  }
  ck(!errs.length, name + ': no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  return A;
}
(async () => {
  /* one browser at a time (team-files/TEST_LOCK_RULE.md) */
  const L = await mode(false);
  const W = await mode(true);
  ck(L.abc === W.abc && L.ditl === W.ditl && L.sv === W.sv, 'Reset local = Reset in the worker (ABC ' + (L.abc === W.abc) + ', DITL ' + (L.ditl === W.ditl) + ', saved values ' + (L.sv === W.sv) + ')' + (L.abc === W.abc ? '' : '\n   ' + dif(L.abc, W.abc)));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
