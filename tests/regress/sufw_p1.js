// 3.2.3-beta.268 (SOHEE): the start-up feedwater valve FCV-FW1130-2 (LICBR1001B) takes P1 = the BFWP discharge of the plant model
// (U.fwPd = PT-FW1011) instead of the fixed sheet P1 214.5. Checks: the valve formula with the sheet anchor (76 %, drum 64.6 -> 120 T/H);
// the fallback without a pump step; at 150 MW with one stepSet per 0.5 s (WORLD.live) U.fwPd is the PT-FW1011 of the model and the valve
// flow at 47 % / drum 37 follows it; no page error.
// Usage: node tests/regress/sufw_p1.js [html]
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
    const o = {
      anchor: AN.suFw(76, 64.6, 214.5),
      fallback: AN.suFw(47, 37),
      sheet47: AN.suFw(47, 37, 214.5),
      p206: AN.suFw(47, 37, 206)
    };
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    for (let i = 0; i < 60; i++) {
      WORLD.live = true;
      AN.stepSet(C1, 0.5);
      WORLD.tick(0.5);
      await new Promise(res => setTimeout(res, 0));
    }
    const U = AN.unit;
    o.fwPd = U.fwPd;
    o.model47 = AN.suFw(47, 37, U.fwPd);
    return o;
  });
  console.log(JSON.stringify(r));
  ck(Math.abs(r.anchor - 120) < 0.5, 'sheet anchor 76 % at drum 64.6 = ' + r.anchor.toFixed(1) + ' T/H (120)');
  ck(Math.abs(r.fallback - r.sheet47) < 1e-9, 'no pump step: sheet P1 214.5 (' + r.fallback.toFixed(1) + ' T/H at 47 %)');
  ck(r.p206 < r.sheet47 && r.p206 > 0.95 * r.sheet47, 'P1 206: ' + r.p206.toFixed(1) + ' T/H, 2 ~ 3 % below the sheet P1');
  ck(r.fwPd > 155 && r.fwPd < 200, '150 MW: U.fwPd (PT-FW1011) ' + (+r.fwPd).toFixed(1) + ' kg/cm2 (03.png 165.4)');
  ck(r.model47 > 0 && r.model47 < r.sheet47, 'valve at 47 % / drum 37 with the model P1 ' + (+r.fwPd).toFixed(1) + ': ' + r.model47.toFixed(1) + ' T/H (sheet P1: ' + r.sheet47.toFixed(1) + ')');
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs[0] : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
