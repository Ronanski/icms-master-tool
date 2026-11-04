// 3.2.1 (IRENE, coordinator 2026-11-04): page 05 CONDENSATE (hmi-mock-cd.js) showed '-----' for six transmitters no sheet reads. They now
// come from the plant model (unit.js anCdTagStep, sources there). At "Start at 150 MW" (one world, plant model ON) the page shows a
// value for each, near the 28.png full load snapshot (TT-CD1110-4 42, TT-CD1119 41, FT-CD1115 0.0, condensate to the deaerator ~ 380);
// the deaerator storage water is at the saturation of PT-CD1104; with the deaerator level valve LCV-CD1104 closed by hand FT-CD1122
// goes to 0.
// Usage: node tests/regress/cd_page_values.js [html]
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
  const K = ['TTCD11104', 'TTCD1119', 'FTCD1115', 'FTCD1122', 'PTCD1122', 'TTCD1104'];
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
  await page.evaluate(() => document.querySelector('#pllist button[data-id="MK05"]').click());
  await page.waitForTimeout(2500);
  const read = () =>
    page.evaluate(
      K => Object.fromEntries(K.map(k => [k, (document.querySelector(`[data-v="${k}"]`) || {}).textContent || null])),
      K
    );
  const a = await read();
  const m = await page.evaluate(() => ({ tt: Object.assign({ hw: Math.round(AN.unit.cdT * 10) / 10 }, AN.unit.tt) }));
  console.log(JSON.stringify(a));
  console.log(JSON.stringify(m.tt));
  const num = s => (s == null ? NaN : parseFloat(s));
  ck(K.every(k => a[k] && !/-----/.test(a[k])), 'page 05: the six values show a number: ' + K.map(k => k + ' ' + a[k]).join(', '));
  const hw = m.tt.hw;
  ck(Math.abs(m.tt['TT-CD1110-4'] - hw - 2) <= 0.5 && m.tt['TT-CD1119'] > hw && m.tt['TT-CD1119'] < m.tt['TT-CD1101'], `flash chamber ${a.TTCD11104}, ejector condenser outlet ${a.TTCD1119}, hotwell ${hw} C (28.png: 42 / 41 over a hotwell of 40 C)`);
  ck(num(a.FTCD1115) === 0, `LP bypass spray ${a.FTCD1115} (28.png 0.0, XV-CD1114 closed)`);
  ck(num(a.FTCD1122) > 300 && num(a.FTCD1122) < 520, `condensate to the deaerator ${a.FTCD1122} (28.png condensate 380 T/H, no recirculation)`);
  ck(num(a.PTCD1122) > 1.6 && num(a.TTCD1104) > 140, `deaerator inlet ${a.PTCD1122}, storage water ${a.TTCD1104} (saturation of PT-CD1104)`);
  /* the deaerator level valve closed by hand: no condensate to the deaerator */
  await page.evaluate(() => {
    const T = AN.sheets.find(s => s.name === 'ABC-031').S,
      c = AN.hmiCtrls(T).find(x => x.tag === 'LICCD1104'),
      st = T.rt.st[c.amt.id];
    st.al = c.autoLeg;
    st.fm = c.autoLeg === 'A' ? 'B' : 'A';
    if (c.manBlk && T.rt.st[c.manBlk.id]) T.rt.st[c.manBlk.id].val = 0;
    else T.rt.ext[c.manNet] = 0;
    for (const [S3, n] of AN.modeNets('LICCD1104')) S3.rt.ext[n] = 1;
  });
  await run(60);
  await page.waitForTimeout(1500);
  const b = await read();
  ck(num(b.FTCD1122) < 5, `LCV-CD1104 MANUAL 0 %: condensate to the deaerator ${a.FTCD1122} -> ${b.FTCD1122}`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
