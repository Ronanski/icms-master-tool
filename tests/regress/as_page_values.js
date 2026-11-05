// 3.2.1 (IRENE, user 2026-11-04 "ITULOY PLANT MODEL"): page 08 AUX STEAM AND VACUUM (hmi-mock-as.js) showed '-----' for the values no
// sheet reads. They come from the plant model now (unit.js anAsTagStep; sources there and in docs/versions/v3.2.1/AUX_STEAM_PLANT_MODEL.md).
// At "Start at 150 MW" (one world, plant model ON) each shows a number near 29.PNG (151 MW): PTST11101 ~ 3 0.056 / 0.053 / 0.053 kg/cm2A,
// TEST11101 ~ 3 38 / 38 / 37 C, PCV-AS1020-1 / -2 0.1 / 32.2 %, TT-AS1015 257 C, gland header 0.32 kg/cm2, TEGS1002 / 1003 364 / 362 C,
// PV-GS1034 42.6 %, MV-AS1011 0 %; PIC-AS1005 in MANUAL 50 %: the two valves follow the ABC-030 F(X) (LN17 42.5 %, LN16 100 %).
// Usage: node tests/regress/as_page_values.js [html]
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
  const K = ['PTST11101', 'PTST11102', 'PTST11103', 'TEST11101', 'TEST11102', 'TEST11103', 'ZT-AS1020-1', 'ZT-AS1020-2', 'TT-AS1015', 'PTGS10011', 'TEGS1002', 'TEGS1003', 'PV-GS1034', 'ZT-AS1011'];
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
  await page.evaluate(() => document.querySelector('#pllist button[data-id="MK08"]').click());
  await page.waitForTimeout(2500);
  const read = () =>
    page.evaluate(K => Object.fromEntries(K.map(k => [k, (document.querySelector(`[data-v="${k}"]`) || {}).textContent || null])), K);
  const a = await read();
  const m = await page.evaluate(() => ({ cdP: AN.unit.cdP, MW: AN.unit.MW }));
  console.log(JSON.stringify(a));
  const num = s => (s == null ? NaN : parseFloat(s));
  const near = (k, v, d) => Math.abs(num(a[k]) - v) <= d;
  ck(K.every(k => a[k] && !/-----/.test(a[k])), 'page 08: every value shows a number: ' + K.map(k => k + ' ' + a[k]).join(', '));
  ck(['PTST11101', 'PTST11102', 'PTST11103'].every(k => Math.abs(num(a[k]) - m.cdP) < 0.002) && near('PTST11101', 0.056, 0.012), `exhaust hood pressure ${a.PTST11101} = condenser ${m.cdP.toFixed(3)} kg/cm2A (29.PNG 0.056 / 0.053 / 0.053)`);
  ck(near('TEST11101', 38, 3), `exhaust hood temperature ${a.TEST11101} C (29.PNG 38 / 38 / 37, the condenser saturation)`);
  ck(near('ZT-AS1020-1', 0.1, 1) && near('ZT-AS1020-2', 32.2, 2), `PCV-AS1020-1 / -2 ${a['ZT-AS1020-1']} / ${a['ZT-AS1020-2']} % (29.PNG 0.1 / 32.2)`);
  ck(near('PTGS10011', 0.32, 0.01) && near('TEGS1002', 364, 15) && near('TEGS1003', 362, 15) && near('TT-AS1015', 257, 15), `gland header ${a.PTGS10011} kg/cm2, ${a.TEGS1002} / ${a.TEGS1003} C, TT-AS1015 ${a['TT-AS1015']} C (29.PNG 0.32, 364 / 362, 257)`);
  ck(near('PV-GS1034', 42.6, 2) && num(a['ZT-AS1011']) === 0, `unloading valve PV-GS1034 ${a['PV-GS1034']} % (29.PNG 42.6), HP warming MV-AS1011 ${a['ZT-AS1011']} % (4.PNG 0.0)`);
  /* PIC-AS1005 MANUAL 50 %: the two cold reheat valves by their F(X) */
  await page.evaluate(() => {
    const T = AN.sheets.find(s => s.name === 'ABC-030').S,
      c = AN.hmiCtrls(T).find(x => x.tag === 'PICAS1005'),
      st = T.rt.st[c.amt.id];
    st.al = c.autoLeg;
    st.fm = c.autoLeg === 'A' ? 'B' : 'A';
    if (c.manBlk && T.rt.st[c.manBlk.id]) T.rt.st[c.manBlk.id].val = 50;
    else T.rt.ext[c.manNet] = 50;
    for (const [S3, n] of AN.modeNets('PICAS1005')) S3.rt.ext[n] = 1;
  });
  await run(30);
  await page.waitForTimeout(1500);
  const b = await read();
  ck(Math.abs(num(b['ZT-AS1020-1']) - 42.5) < 2 && num(b['ZT-AS1020-2']) > 98, `PIC-AS1005 MANUAL 50 %: PCV-AS1020-1 / -2 ${b['ZT-AS1020-1']} / ${b['ZT-AS1020-2']} % (F(X) LN17 42.5, LN16 100)`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
