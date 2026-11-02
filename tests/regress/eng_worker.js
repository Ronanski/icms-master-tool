// The engine in a real Web Worker (3.2.0, stage d: src/world/eng-page.js + eng-host.js + eng.js), in the page from file:// with
// ?worker=1. The worker starts from the page (keyframe), the page is the mirror. Checks: the worker starts (no error bar); RUN: the
// plant time moves on the page (the engine runs, the patches arrive); the operator on the page (HP bypass PICMS1006 to MAN, MV 20 %,
// AUTO again, a DITL push button) reaches the engine; after a pause the whole state of the worker (ABC + DITL keyframe) = the page
// mirror. Usage: node tests/regress/eng_worker.js [html]
const { open } = require('./lib.js');
const fs = require('fs'), url = require('url'), path = require('path');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async () => {
  const { browser, page, errs } = await open(html);
  let fail = 0;
  const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
  await page.goto(url.pathToFileURL(path.resolve(html)).href + '?worker=1');
  await page.waitForTimeout(2500);
  await page.evaluate(() => AN.setCat('an'));
  await page.waitForFunction(() => window.ENG && (ENG.mode === 'mirror' || ENG.err), null, { timeout: 180000 });
  await page.waitForFunction(() => ENG.got > 0 || ENG.err, null, { timeout: 60000 }).catch(() => {});
  const st = await page.evaluate(() => ({ mode: ENG.mode, err: ENG.err, bar: !!document.getElementById('engerr') }));
  ck(st.mode === 'mirror' && !st.err && !st.bar, 'the engine starts in the worker' + (st.err ? ': ' + JSON.stringify(st.err).slice(0, 300) : ''));
  /* RUN at 1x: the plant time of ABC-001C moves on the page */
  const t0 = await page.evaluate(() => { const C = AN.sheets.find(s => s.name === 'ABC-001C'); AN.i = AN.sheets.indexOf(C); AN.plantLoad150(); AN.run = true; return C.S.rt.t; });
  /* the engine first runs the same Start at 150 MW (some seconds), then the patches come */
  const g0 = Date.now();
  await page.waitForFunction(() => ENG.got > 0, null, { timeout: 90000 }).catch(() => {});
  const tw = (Date.now() - g0) / 1000;
  const ta = await page.evaluate(() => AN.sheets.find(s => s.name === 'ABC-001C').S.rt.t);
  await page.waitForTimeout(5000);
  const t1 = await page.evaluate(() => AN.sheets.find(s => s.name === 'ABC-001C').S.rt.t);
  ck(t1 > ta + 3, 'RUN: the plant time moves on the page from the worker: ' + ta.toFixed(1) + ' -> ' + t1.toFixed(1) + ' s in 5 s (first patch ' + tw.toFixed(1) + ' s after Start at 150 MW)');
  /* the operator on the page */
  await page.evaluate(() => {
    AN.latchMode('PICMS1006', 'MAN');
    const S50 = AN.sheets.find(s => s.name === 'ABC-050'), c = AN.hmiCtrls(S50.S).find(x => x.tag === 'PICMS1006');
    if (c.manBlk && S50.S.rt.st[c.manBlk.id]) S50.S.rt.st[c.manBlk.id].val = 20; else S50.S.rt.ext[c.manNet] = 20;
  });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    const s = S.sheets.find(x => /DITL-15$/.test(x.name));
    s.sig['11:S'] = true;
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { delete S.sheets.find(x => /DITL-15$/.test(x.name)).sig['11:S']; AN.latchMode('PICMS1006', 'AUTO'); });
  await page.waitForTimeout(3000);
  /* pause, let the last patch arrive, then the whole state of the worker against the page */
  const r = await page.evaluate(async () => {
    AN.run = false;
    ENG.flush();
    await new Promise(r => setTimeout(r, 800));
    const w = await ENG.peek();
    await new Promise(r => setTimeout(r, 300));
    const a = JSON.stringify(w.kf), b = JSON.stringify(AN.engState.capture()), c = JSON.stringify(w.kd), d = JSON.stringify(ditlCapture());
    const at = (x, y) => { let i = 0; while (i < x.length && x[i] === y[i]) i++; return i; };
    const ia = at(a, b), id = at(c, d);
    return { abc: a === b, ditl: c === d, la: a.length, ld: c.length, ea: a === b ? '' : a.slice(Math.max(0, ia - 60), ia + 260) + ' <> ' + b.slice(Math.max(0, ia - 60), ia + 260), ed: c === d ? '' : c.slice(Math.max(0, id - 120), id + 60) + ' <> ' + d.slice(Math.max(0, id - 120), id + 60), sent: ENG.sent, got: ENG.got };
  });
  ck(r.abc, 'ABC state: worker = page mirror (' + (r.la >> 10) + ' kB)' + (r.abc ? '' : '\n   ' + r.ea));
  ck(r.ditl, 'DITL state: worker = page mirror (' + (r.ld >> 10) + ' kB)' + (r.ditl ? '' : '\n   ' + r.ed));
  console.log('   messages: page sent ' + r.sent + ', got ' + r.got);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
