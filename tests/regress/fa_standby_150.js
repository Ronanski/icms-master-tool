// FA blower B stays on standby at 150 MW (Rosé, 2026-11-02; the cause is still open): 9.png has blower A running (F-1055A 37.3 A), blower B standby, the common FA
// flow FIFA1055 26.3 T/H (FT-FA1055, 0 ~ 35 T/H; OPERATING_POINTS.md). In RUN the model gave about 15 T/H
// (cloud on fd62fed: lowest 14.7), under the low-low 20 T/H of ABC-006 M.3114, so DITL-28A started blower B by its standby AUTO start.
// Checks (local): Start at 150 MW, the DITL in service, 30 s of plant: FIFA1055 within 26.3 ± 3 T/H, over 20 T/H all the time, FA blower B
// not running (ABC-014 M.3309 = 0), blower A running (M.3308 = 1). Usage: node tests/regress/fa_standby_150.js [html]
const { open } = require('./lib.js');
const fs = require('fs');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
let fail = 0;
const ck = (ok, w) => { console.log((ok ? 'PASS ' : 'FAIL ') + w); if (!ok) fail++; };
(async () => {
  const { browser, page, errs } = await open(html);
  await page.evaluate(async () => {
    await AN.plantLoad150();
    await DITL150.apply();
  });
  const r = await page.evaluate(async () => {
    const val = (sh, nm) => {
      const S = AN.ensure(AN.sheets.find(s => s.name === sh));
      const n = S.nets.findIndex((x, k) => AN.nm(S, k) === nm);
      return n < 0 ? null : +S.rt.v[n];
    };
    AN.go(AN.sheets.findIndex(s => s.name === 'ABC-014'));
    AN.spd = 1;
    AN.startState = AN.startState || 'plantLoad150';
    AN.runOn();
    let min = Infinity;
    for (let i = 0; i < 30; i++) {
      await new Promise(ok => setTimeout(ok, 1000));
      const f = val('ABC-006', 'FIFA1055.PV');
      if (f != null) min = Math.min(min, f);
    }
    return { fa: val('ABC-006', 'FIFA1055.PV'), min, a: val('ABC-014', 'M.3308'), b: val('ABC-014', 'M.3309') };
  });
  ck(r.fa != null && Math.abs(r.fa - 26.3) <= 3, 'FA common flow FIFA1055 at 150 MW = ' + (r.fa == null ? 'not found' : r.fa.toFixed(1)) + ' T/H (9.png 26.3)');
  ck(r.min > 20, 'FIFA1055 stays over the low-low 20 T/H (lowest ' + (isFinite(r.min) ? r.min.toFixed(1) : '-') + ')');
  ck(r.a === 1 && r.b === 0, 'FA blower A runs, B on standby (M.3308 ' + r.a + ', M.3309 ' + r.b + ')');
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
