// 3.2.1-beta.19: page 07 DRUM AND MAIN STEAM (hmi-mock-ms.js). At "Start at 150 MW" (one world, plant model ON):
// (1) the feedwater / spray tags that page 06 FEEDWATER shows (PT-FW1160, FT-FW1109 / 1119 / 1149 / 1059, ZT-FW1110 / 1120) show the
//     SAME value on page 07 (one tag, one value; before: '-----' on page 07, a number on page 06);
// (2) the drum, main steam and reheat transmitters of the logic show a number; turbine speed 3600 rpm;
// (3) no page error. NO-SOURCE tags (data-ns, no sheet and no plant model) stay '-----' and are listed, not failed.
// Usage: node tests/regress/ms_page_values.js [html]
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
  await page.evaluate(() => {
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
  });
  await page.evaluate(async () => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    for (let i = 0; i < 600; i++) {
      WORLD.live = true;
      AN.stepSet(C1, 0.5);
      WORLD.tick(0.5);
      if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
    }
    WORLD.live = true;
  });
  await page.evaluate(() => lsPlant(true));
  await page.waitForTimeout(1000);
  const SH = ['PT-FW1160', 'FT-FW1109', 'FT-FW1119', 'FT-FW1149', 'FT-FW1059', 'ZT-FW1110-1', 'ZT-FW1110-2', 'ZT-FW1120-1', 'ZT-FW1120-2'];
  const all = () =>
    page.evaluate(() => {
      const o = {};
      document.querySelectorAll('#plantpane [data-v], [data-v]').forEach(e => {
        if (e.closest('[data-ns]') || e.hasAttribute('data-ns')) return;
        o[e.dataset.v] = e.textContent;
      });
      return o;
    });
  /* both pages read the same plant instant: no stepping between the two reads */
  await page.evaluate(() => (AN.run = false));
  await page.evaluate(() => document.querySelector('#pllist button[data-id="MK06"]').click());
  await page.waitForTimeout(2500);
  const p6 = await all();
  await page.evaluate(() => document.querySelector('#pllist button[data-id="MK07"]').click());
  await page.waitForTimeout(2500);
  const p7 = await all();
  console.log('page 06', JSON.stringify(Object.fromEntries(SH.map(k => [k, p6[k]]))));
  console.log('page 07', JSON.stringify(p7));
  ck(SH.every(k => p7[k] && !/-----/.test(p7[k]) && p7[k] === p6[k]), 'feedwater / spray tags: page 07 = page 06, a number');
  const logic = ['PT-BR1001-1', 'LT-BR1001-1', 'PT-MS1002', 'FT-MS1031', 'PT-MS1006-1', 'TT-MS1022-1', 'PT-HR1003-1', 'TT-HR1004'];
  ck(logic.every(k => p7[k] && !/-----/.test(p7[k])), 'drum / main steam / reheat transmitters show a number');
  ck(/^3[56]\d\d/.test(p7.RPM || ''), 'turbine speed ' + p7.RPM);
  const dash = Object.keys(p7).filter(k => /-----/.test(p7[k]));
  console.log('still ----- (not NO-SOURCE marked): ' + (dash.join(', ') || 'none'));
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
