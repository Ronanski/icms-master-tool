// 3.2.1 (IRENE, coordinator 2026-11-04): page 06 FEEDWATER (hmi-mock-fw.js) showed '-----' for the turbine extraction, feedwater and
// spray transmitters no sheet reads. They now come from the plant model (unit.js anFwTagStep, sources there). At "Start at 150 MW"
// (one world, plant model ON) the page shows a value for each, near the snapshots (4.PNG PT-TS1013 14.07, PT-TS1017 5.30, TT-TS1011
// 371; 03.png PT-FW1115-A 6.7, TT-FW1011 162, PT-FW1160 137.7, FT-FW1109 37.5, FT-FW1119 28.2; 5.png FT-FW1149 14.8); the spray valve
// positions follow the F(X) of their controller (ABC-011 LN47 / LN46). Both BFWP suction valves closed: no spray flow.
// Usage: node tests/regress/fw_page_values.js [html]
const fs = require('fs');
const { open } = require('./lib.js');
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
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150 && window.LS_MOCK, null, {
    timeout: 120000
  });
  await page.waitForTimeout(2000);
  const K = ['PT-TS1013', 'PT-TS1017', 'TT-TS1011', 'PT-FW1115-A', 'PT-FW1115-B', 'TT-FW1011', 'PT-FW1160', 'FT-FW1109', 'FT-FW1119', 'FT-FW1149', 'FT-FW1059', 'ZT-FW1110-1', 'ZT-FW1110-2', 'ZT-FW1120-1', 'ZT-FW1120-2'];
  const run = sec =>
    page.evaluate(async sec => {
      const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
      WORLD.live = true;
    }, sec);
  await page.evaluate(() => {
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
  });
  await run(300);
  await page.evaluate(() => lsPlant(true));
  await page.waitForTimeout(1000);
  await page.evaluate(() => document.querySelector('#pllist button[data-id="MK06"]').click());
  await page.waitForTimeout(2500);
  const read = () => page.evaluate(K => Object.fromEntries(K.map(k => [k, (document.querySelector(`[data-v="${k}"]`) || {}).textContent || null])), K);
  const tt = () =>
    page.evaluate(() => {
      const T = AN.sheets.find(s => s.name === 'ABC-011').S,
        c = AN.hmiCtrls(T).find(x => x.tag === 'TICBR1130');
      return Object.assign({ ms: Math.round(AN.unit.ms), mv1: Math.round(+T.rt.v[c.out] * 10) / 10 }, AN.unit.tt);
    });
  const a = await read(),
    m = await tt();
  console.log(JSON.stringify(a));
  console.log(JSON.stringify(m));
  const near = (k, y, d) => isFinite(m[k]) && Math.abs(m[k] - y) <= d;
  ck(K.every(k => a[k] && !/-----/.test(a[k])), 'page 06: the 15 values show a number');
  ck(near('PT-TS1013', 14.07, 1.5) && near('PT-TS1017', 5.3, 0.8), `main steam ${m.ms} T/H: extraction No.2 ${m['PT-TS1013']}, No.3 ${m['PT-TS1017']} kg/cm2 (4.PNG 14.07 / 5.30 at 472.7 T/H)`);
  ck(near('TT-TS1011', 371, 25), `cold reheat to No.2 HPH ${m['TT-TS1011']} C (4.PNG 371)`);
  ck(near('PT-FW1115-A', 6.7, 0.3) && near('PT-FW1115-B', 7.1, 0.3), `BFWP suction A ${m['PT-FW1115-A']} / B ${m['PT-FW1115-B']} kg/cm2 (03.png 6.7 / 7.1)`);
  ck(near('TT-FW1011', 162, 8) && near('PT-FW1160', 137.7, 8), `BFWP discharge ${m['TT-FW1011']} C, economizer inlet ${m['PT-FW1160']} kg/cm2 (03.png 162 / 137.7)`);
  ck(m['ZT-FW1110-2'] >= 99 && m['ZT-FW1110-1'] > 0, `No.1 SH spray MV ${m.mv1} %: valves ${m['ZT-FW1110-1']} / ${m['ZT-FW1110-2']} % (LN47 / LN46)`);
  ck(m['FT-FW1109'] > 5 && m['FT-FW1109'] <= 60 && m['FT-FW1119'] >= 0 && m['FT-FW1149'] >= 0 && m['FT-FW1059'] >= 0, `spray flows No.1 ${m['FT-FW1109']}, No.2 ${m['FT-FW1119']}, RH ${m['FT-FW1149']}, HP bypass ${m['FT-FW1059']} T/H`);
  /* both BFWP suction valves closed by hand (V-FW1001 / 1002): no pump head, the sprays have no pressure to flow */
  await page.evaluate(() => {
    AN.swValve('V-FW1001', 0);
    AN.swValve('V-FW1002', 0);
  });
  await run(20);
  const b = await tt();
  ck(b['FT-FW1109'] === 0 && b['FT-FW1119'] === 0 && b['FT-FW1149'] === 0, `BFWP suction valves closed: sprays No.1 ${m['FT-FW1109']} -> ${b['FT-FW1109']}, No.2 ${b['FT-FW1119']}, RH ${b['FT-FW1149']} T/H`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
