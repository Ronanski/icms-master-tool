// 3.2.3 (SOHEE, Mina S155-1 on beta.155): Normal shutdown 45 -> 30 MW. After the "Bed 750 C" step the PA and SA air flow controls are
// MANUAL, so the coal master FIC-CM is MANUAL too (ABC-004A M.0130): HIC-BM no longer moves the coal. The Do it of the step "By hand:
// EIC-TM to 30 MW" trimmed HIC-BM only: the coal stayed 26.8 T/H, the main steam pressure sat on the MS blow-off set point 128, the
// blow-off vented the steam the 30 MW turbine did not take and the hotwell fell to the LL (-300 mm) with the make-up full open.
// Now the Do it trims FIC-CM when it is MANUAL. Checks, from Mina's b153 save (73.5 MW) brought to 45 MW, FIC-CM MANUAL at 24 % (about 27 T/H of coal, as Mina's 26.8): the Do it of
// the 30 MW step reaches 30 MW with the pressure under 128 and the blow-off shut; the hotwell stays over -150 mm.
// Usage: node tests/regress/shutdown_30mw_coal.js [html] [save json]
const { open } = require('./lib.js');
const fs = require('fs');
const html =
  process.argv.find(a => /\.html$/.test(a)) ||
  'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const svp = process.argv.find(a => /\.json$/.test(a)) || '/mnt/project-files/b153-shutdown-73.5MW-S148-1.json';
if (!fs.existsSync(svp)) {
  console.log('SKIP: no save ' + svp);
  process.exit(0);
}
const sv = JSON.parse(fs.readFileSync(svp, 'utf8'));
(async () => {
  const { browser, page, errs } = await open(html);
  let fail = 0;
  const ck = (ok, w) => {
    console.log((ok ? 'PASS ' : 'FAIL ') + w);
    if (!ok) fail++;
  };
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150 && window.LS_GUIDE, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async sv => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    const r1 = x => Math.round(x * 10) / 10;
    const mv = t => { const f = LS_LIVE.fp(t); return f ? +LS_LIVE.mvOf(f) : NaN; };
    const md = t => { const f = LS_LIVE.fp(t); return f ? LS_LIVE.modeOf(f) : '?'; };
    const H = () => LS_GUIDE.h();
    const run = async (sec, f) => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (f) f();
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    const st = () => ({ MW: r1(H().MW()), MSP: r1(H().MSP()), blo: r1(mv('PICMS1002')), hw: r1(window.AN_CYC.y.hw), coal: r1(AN.unit.Fc || 0), cm: r1(mv('FIC-CM')) });
    AN.run = false;
    DITL150.savePut({ kf: sv.kf, kd: sv.kd, ver: sv.ver || '3.2.3-beta.153' });
    await run(5);
    /* to 45 MW the way the CCS hands over: EIC-TM and HIC-BM together */
    const tm0 = mv('EIC-TM'), bm0 = mv('HIC-BM');
    for (let k = 1; k <= 8; k++) {
      const f = Math.max(45 / 73.5, 1 - (k * (1 - 45 / 73.5)) / 6);
      LS_GUIDE.A.man('EIC-TM', tm0 * f);
      LS_GUIDE.A.man('HIC-BM', bm0 * f);
      await run(60);
    }
    /* the "Bed 750 C" step: PA and SA air flow to MANUAL; FIC-CM follows to MANUAL */
    LS_GUIDE.A.man('FICFA1071', mv('FICFA1071'));
    LS_GUIDE.A.man('FICFA1081', mv('FICFA1081'));
    await run(30);
    /* Mina's run: coal 26.8 T/H at 33 MW (with the start-up burners in): the fire is more than the 30 MW turbine needs */
    LS_GUIDE.A.man('FIC-CM', 24);
    await run(60);
    const o = { at45: st(), mdCM: md('FIC-CM') };
    const stp = LS_GUIDE.steps().find(x => /^By hand: EIC-TM to 30 MW/.test(x.t));
    o.title = stp ? stp.t : 'none';
    let pmax = 0, bmax = 0, hmin = 1e9;
    for (let k = 0; k < 40 && stp; k++) {
      await run(60, () => stp.seek && stp.seek());
      const x = st();
      pmax = Math.max(pmax, x.MSP); bmax = Math.max(bmax, x.blo); hmin = Math.min(hmin, x.hw);
      if (k % 5 === 4) (o.tr = o.tr || []).push(x);
    }
    o.end = st();
    Object.assign(o, { pmax, bmax, hmin });
    return o;
  }, sv);
  console.log(JSON.stringify(r));
  ck(r.mdCM === 'MAN', `45 MW, PA and SA MANUAL: the coal master FIC-CM is MANUAL (${r.mdCM}), coal ${r.at45.coal} T/H`);
  ck(r.end.MW <= 31, `the Do it of "${r.title}" reaches 30 MW (${r.end.MW} MW, coal ${r.end.coal} T/H, FIC-CM ${r.end.cm} %)`);
  ck(r.pmax < 128, `main steam pressure stays under the MS blow-off set point 128 (highest ${r.pmax} kg/cm2)`);
  ck(r.bmax < 1, `the MS blow-off PICMS1002 stays shut (highest MV ${r.bmax} %)`);
  ck(r.hmin > -150, `hotwell stays up (lowest ${r.hmin} mm; the LL that stops the condensate pump is -300)`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
