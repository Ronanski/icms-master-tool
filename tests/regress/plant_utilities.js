// 3.2.0-beta.15 (plan phase B, user: "Alam ko may tripping mga yan. Di makakastart ng wala yan"): the steam table and the utilities
// of the unit model (src/analog/engine/steam.js, unit.js vacUp):
//  - steam table (IAPWS-IF97 saturation line): 100.0 C at 0, 183.3 at 10, 275.4 at 60, 330.0 at 130 kg/cm2 G
//  - Cold: the turbine cannot be rolled without the condenser vacuum (no seawater / condensate pump); after SWP + CEP start and
//    the vacuum is up (15 min) the roll is accepted
//  - At 150 MW: all seawater pumps stopped -> LOW VACUUM -> TCS turbine trip (ABC-050 I.0400 = 1), the MW goes to 0
// Usage: node tests/regress/plant_utilities.js [html]
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
  /* helpers in the page: a digital input on every sheet (as CHECK setx), plant time steps */
  await page.evaluate(() => {
    window.__setx = (l, x) => {
      for (const s of AN.sheets) {
        const T = s.S;
        if (!T || !T.ext || /ABC-000/.test(s.name)) continue;
        for (const e of T.ext) {
          const t = T.lab[e] && String(T.lab[e].t).trim();
          if ((t === l || (t && t.replace(/^S\d\s+/, '') === l)) && T.rt.force[e] === undefined) T.rt.ext[e] = x;
        }
      }
    };
    window.__run = async sec => {
      const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
      for (let i = 0; i < sec; i++) {
        AN.stepSet(C1, 1);
        if (i % 200 === 199) await new Promise(r => setTimeout(r, 0));
      }
    };
  });
  const ts = await page.evaluate(() => [0, 10, 60, 130].map(p => +AN.tsat(p).toFixed(1)));
  ck(
    Math.abs(ts[0] - 100) < 0.2 && Math.abs(ts[1] - 183.3) < 0.3 && Math.abs(ts[2] - 275.4) < 0.3 && Math.abs(ts[3] - 330.0) < 0.3,
    'steam table: Tsat at 0 / 10 / 60 / 130 kg/cm2 = ' + ts.join(' / ') + ' C (IF97: 100.0 / 183.3 / 275.4 / 330.0)'
  );
  const a = await page.evaluate(async () => {
    AN.reset();
    AN.plantCold();
    await __run(10);
    const r0 = AN.turbine('roll');
    __setx('M.3354', 1);
    __setx('M.3350', 1);
    await __run(60);
    const r1 = AN.turbine('roll');
    await __run(1200);
    const vNoAux = AN.unit.vac;
    /* 3.2.0-beta.37: the vacuum up needs the aux steam (main steam > 12 kg/cm2, PR-OPE-5002) */
    /* 3.2.0-beta.38: the turbine auxiliaries of the TCS (tcs.js) in the PR-OPE-5002 order: lube oil, EH oil, vapour extractor,
       turning gear, aux steam MV-AS1391, gland sealing, vacuum up (vacuum breaker closed, ejectors) */
    AN.unit.Pd = 20;
    const rr = ['lop', 'eh', 'vex', 'tg', 'aux'].map(c => AN.turbine(c));
    await __run(600); /* aux header 10.5 kg/cm2, 2 min time constant: > 10 after about 6 min */
    rr.push(AN.turbine('gland'), AN.turbine('vacuum'));
    await __run(1200);
    const r2 = AN.turbine('roll');
    return { r0, r1, r2, rr: rr.filter(Boolean), cur: AN.tcs().cur, vac: AN.unit.vac, vNoAux };
  });
  ck(/VACUUM/i.test(a.r0) && /VACUUM/i.test(a.r1) && a.vNoAux < 0.1 && !a.rr.length && a.r2 === '' && a.cur === 0,
    'Cold: roll with no SWP / CEP refused ("' + a.r0.slice(0, 60) + '"), SWP + CEP with no aux steam: vacuum ' + Math.round(100 * a.vNoAux) + ' % after 20 min; with aux steam (drum 20 kg/cm2), lube oil, turning gear, gland and vacuum up' + (a.rr.length ? ' (REFUSED: ' + a.rr.join(' | ') + ')' : '') + ': vacuum ' + Math.round(100 * a.vac) + ' %, roll "' + (a.r2 || 'accepted') + '", ATS step ' + a.cur + ' (0 = HP TURBINE WARMING)');
  const b = await page.evaluate(async () => {
    AN.reset();
    AN.plantLoad150();
    await __run(30);
    const mw0 = +AN.unit.MW;
    for (const l of ['M.3353', 'M.3354', 'M.3355']) __setx(l, 0);
    await __run(120);
    const S = AN.sheets.find(s => s.name === 'ABC-050').S,
      n = S.lab.findIndex(z => z && String(z.t).trim() === 'I.0400');
    return { mw0, mw: +AN.unit.MW, trip: n >= 0 ? +S.rt.v[n] : NaN, vac: AN.unit.vac };
  });
  ck(b.mw0 > 140 && b.trip === 1 && b.mw < 10,
    '150 MW, all seawater pumps stopped: LOW VACUUM (' + Math.round(100 * b.vac) + ' %) -> turbine trip I.0400 = ' + b.trip + ', MW ' + b.mw0.toFixed(1) + ' -> ' + b.mw.toFixed(1));
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? 'FAIL ' + fail : 'ALL PASS');
  await browser.close();
})();
