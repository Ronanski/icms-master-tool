// 3.2.3-beta.183 (SOHEE): instrument air lost at 150 MW, the MFT chain against DITL-03G / 03A / 06.
// DITL-03G as drawn: PT-IA1706 (unit header), PT-IA0706-A / B (air tanks) each < 3.5 kg/cm2, 2 out of 3 (three AND + OR, S4 O.0603),
// ON DELAY 2 SEC -> output rows 8 / 10 / 11 "INSTRUMENT AIR PRESSURE L.L." (CRT, SER, IRP 03A-16) -> DITL-03A row 16 -> MFT, and
// DITL-06 row 23 first out. Row 27 PSL-IA1706-NC "INSTRUMENT AIR PRESS. NOT LOW" (alarm list 2.8 kg/cm2) is the normally closed
// contact: 0 below 2.8. Before 181 its 150 MW field bit stayed set and the row stayed 1 (also the furnace pressure / drum level -NC rows).
// Checks:
//   A. all IA compressors trip (DITL-113 trip rows): the tanks and the header fall, MFT with first out INSTRUMENT AIR PRESSURE L.L.
//      only, row 27 goes 0, the FA blower current stays inside the 0 ~ 98 A range of IT-F1055A (I/O list);
//   B. only the unit header is cut (V-IA1101 closed): the tanks stay at 7 kg/cm2, so only 1 of 3 transmitters is low: no MFT (as drawn),
//      but row 27 goes 0.
// Usage: node tests/regress/ia_loss_mft.js [html]
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
  const go = mode =>
    page.evaluate(async mode => {
      const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
      const sh = n => S.sheets.find(s => s.name.endsWith(n));
      const rv = (n, i) => (DUI.rowVal(sh(n), i) ? 1 : 0);
      AN.run = false;
      AN.reset();
      ditlStates();
      AN.plantLoad150();
      DITL150.apply();
      const U = AN.unit;
      lsEvents.length = 0;
      let t = 0,
        t0 = Infinity,
        mftT = null,
        iMax = 0;
      const run = async sec => {
        for (let i = 0; i < sec * 2; i++) {
          WORLD.live = true;
          AN.stepSet(C1, 0.5);
          WORLD.tick(0.5);
          t += 0.5;
          if (mftT == null && t > t0 && lsEvents.some(e => e.kind === 'TRIP' && /MASTER FUEL TRIP/.test(e.text))) mftT = t;
          iMax = Math.max(iMax, +U.fnIa || 0, +U.fnIb || 0);
          if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
        }
      };
      await run(60);
      const nc0 = rv('DITL-03G', 26);
      lsEvents.length = 0;
      t0 = t;
      if (mode === 'comp') [6, 13, 20].forEach(i => WORLD.dset('DITL-113', i, true));
      else AN.swValve('V-IA1101', 0);
      await run(mode === 'comp' ? 360 : 600);
      const s6 = sh('DITL-06'),
        o6 = (WORLD._o && WORLD._o[s6.name]) || new Set();
      const fo = [...o6].map(i => (s6.cells[i + ':RS'] || []).map(x => x.t).join(' ')).filter(x => /FIRST OUT/.test(x));
      const m = lsEvents.find(e => e.kind === 'TRIP' && /MASTER FUEL TRIP/.test(e.text));
      return {
        nc0,
        nc1: rv('DITL-03G', 26),
        pu: Math.round(U.iaPU * 100) / 100,
        tank: Math.round(U.iaP * 100) / 100,
        mft: mftT == null ? null : mftT - t0,
        why: m && m.why && m.why[0] ? m.why[0].txt : '',
        fo,
        iMax: Math.round(iMax * 10) / 10
      };
    }, mode);
  const a = await go('comp');
  ck(a.nc0 === 1, `150 MW: DITL-03G row 27 INSTRUMENT AIR PRESS. NOT LOW = ${a.nc0}`);
  ck(a.mft != null && /INSTRUMENT AIR PRESSURE L\.L\./.test(a.why), `A. compressors tripped: MFT after ${a.mft} s, cause "${a.why}"`);
  ck(a.fo.length === 1 && /INSTRUMENT AIR PRESSURE L\.L\. FIRST OUT/.test(a.fo[0]), `A. DITL-06 first out: ${JSON.stringify(a.fo)}`);
  ck(a.nc1 === 0 && a.pu < 2.8, `A. header ${a.pu} kg/cm2: row 27 NOT LOW = ${a.nc1}`);
  ck(a.iMax > 0 && a.iMax < 98, `A. FA blower current at most ${a.iMax} A (IT-F1055A range 0 ~ 98 A)`);
  const b = await go('hdr');
  ck(b.tank > 6.5 && b.pu < 0.5 && b.mft == null, `B. unit header cut: tanks ${b.tank}, header ${b.pu} kg/cm2, no MFT (1 of 3 transmitters low, as drawn)`);
  ck(b.nc1 === 0, `B. row 27 NOT LOW = ${b.nc1}`);
  ck(b.iMax < 98, `B. FA blower current at most ${b.iMax} A`);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
