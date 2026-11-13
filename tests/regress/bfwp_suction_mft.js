// 3.2.3-beta.196 (SOHEE, Mina S194-2 CRITICAL): BFWP-A suction manual valve V-FW1001 closed at 150 MW. The BFWP-A line gives no
// water (unit.js m.suc, DITL-23A row 12 ZSO-FW1031, IO list STN102 I.028F) and BFWP-B takes over; before 196 the check ran for every
// machine line that had a DITL drawing, so the PA fan (DITL-26A) and the SA fan (DITL-27A) lines read 0 flow too: PA / SA flow L.L. ->
// MFT in about 8 s. Checks: PA / SA lines keep their flow (mul 1), no MFT in 180 s, BFWP-B running and the feedwater line gives water at the end.
// Usage: node tests/regress/bfwp_suction_mft.js [html]
const { open } = require('./lib.js');
const fs = require('fs');
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
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150, null, {
    timeout: 120000
  });
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async () => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    const U = AN.unit;
    let t = 0,
      mft = null,
      paMin = 9,
      saMin = 9,
      fwMin = 9;
    const run = async (sec, watch) => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        t += 0.5;
        if (watch) {
          if (mft == null && lsEvents.some(e => e.kind === 'TRIP' && /MASTER FUEL TRIP/.test(e.text))) mft = t;
          paMin = Math.min(paMin, ...U.mul[1].pr.map(p => p.mul));
          saMin = Math.min(saMin, ...U.mul[2].pr.map(p => p.mul));
          fwMin = Math.min(fwMin, ...U.mul[0].pr.map(p => p.mul));
        }
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    await run(60);
    lsEvents.length = 0;
    t = 0;
    AN.swValve('V-FW1001', 0);
    await run(180, 1);
    const m = lsEvents.find(e => e.kind === 'TRIP' && /MASTER FUEL TRIP/.test(e.text));
    return { fv: AN.fv('V-FW1001'), fwEnd: Math.min(...U.mul[0].pr.map(p => p.mul)), bRun: +U.mul[0].run[1].S.rt.v[U.mul[0].run[1].n], mft, why: m && m.why && m.why[0] ? m.why[0].txt : '', paMin, saMin, fwMin, MW: Math.round(+U.MW || 0) };
  });
  ck(r.fv < 5, `V-FW1001 closed (${r.fv} %)`);
  ck(r.paMin === 1 && r.saMin === 1, `PA fan line flow factor min ${r.paMin}, SA fan line min ${r.saMin} (1 = not cut by the BFWP suction valve)`);
  ck(r.mft == null, `no MFT in 180 s` + (r.mft != null ? `: MFT at ${r.mft} s "${r.why}"` : '') + `, ${r.MW} MW`);
  ck(r.bRun > 0.5 && r.fwEnd > 0, `BFWP-B running (${r.bRun}), the feedwater line gives water again: factor ${Math.round(r.fwEnd * 100) / 100} (lowest ${Math.round(r.fwMin * 100) / 100} before B takes over)`);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
