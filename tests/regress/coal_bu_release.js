// 3.2.3-beta.245 (live Cold load-up, ABC-004A): with all three coal feeders MANUAL the coal master FIC-CM is on its BU-CMD (M.0133, TOF 2 s
// of M.0131) and its output is the feeder average SI0143. The FIC-CM MV must follow that value: when a feeder goes AUTO, FORCE REMOTE
// M.0132 (TON 2 s of NOT M.0131) puts the FIC-CF set point on FIC-CM.MV, and the FIC-CF LOCAL set point (locked while MANUAL) was 0 since
// the Cold start. Before: FIC-CM MV tracked that 0 and the coal demand fell when the feeder went AUTO.
// Check at "Start at 150 MW" made like the Cold load-up: FIC-CM MANUAL, FIC-CF LOCAL set point 0, feeders MANUAL 60 s -> FIC-CM MV =
// SI0143; feeder A AUTO, 30 s later the total coal flow is within 10 %.
// Usage: node tests/regress/coal_bu_release.js [html]
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
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150 && window.LS_LIVE, null, {
    timeout: 120000
  });
  await page.waitForTimeout(2000);
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
  const rd = () =>
    page.evaluate(() => {
      const f = LS_LIVE.fp('FIC-CM');
      const fuel = AN.unit.fuel.map(l => (l.length ? +l[0][0].rt.st[l[0][1].id].val : 0));
      return {
        cm: LS_LIVE.modeOf(f),
        cmMv: +LS_LIVE.mvOf(f),
        si143: +LS_LIVE.val('SI0143'),
        m133: +LS_LIVE.val('M.0133'),
        m132: +LS_LIVE.val('M.0132'),
        fuel: fuel.reduce((a, b) => a + b, 0)
      };
    });
  await page.evaluate(() => {
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
  });
  await run(60);
  console.log(
    await page.evaluate(() => {
      LS_GUIDE.A.loc('FIC-CM');
      LS_GUIDE.A.man('FIC-CM', 75);
      ['A', 'B', 'C'].forEach(x => LS_GUIDE.A.man('FICCL1061' + x, 30));
      /* the FIC-CF set point in LOCAL (the SV switch after FIC-CM) is 0, as in the Cold start */
      const S = LS_LIVE.fp('FIC-CM').S,
        bu = S.blk.find(b => b.k === 'AMT' && b.buCmd && b.trkFrom && !b.trkFrom.length && b.upA && b.upA.length),
        sw = bu && S.blk.find(b => b.k === 'AMT' && b.upA && b.upA.some(u => u.id === bu.id));
      if (!sw || !S.ext.includes(sw.b)) return 'no SV switch';
      S.rt.ext[sw.b] = 0;
      return 'SV switch ' + sw.id;
    })
  );
  await run(60);
  const a = await rd();
  console.log('feeders MANUAL: ' + JSON.stringify(a));
  ck(a.m133 === 1, 'BU-CMD M.0133 = 1 with all feeders MANUAL');
  ck(Math.abs(a.cmMv - a.si143) < 1, 'FIC-CM MV ' + a.cmMv.toFixed(1) + ' follows SI0143 ' + a.si143.toFixed(1));
  await page.evaluate(() => LS_GUIDE.A.auto('FICCL1061A'));
  await run(30);
  const b = await rd();
  console.log('feeder A AUTO: ' + JSON.stringify(b));
  ck(b.m133 === 0 && b.m132 === 1, 'BU-CMD off and FORCE REMOTE on after feeder A goes AUTO');
  ck(Math.abs(b.fuel - a.fuel) < 0.1 * a.fuel, 'coal flow ' + a.fuel.toFixed(1) + ' -> ' + b.fuel.toFixed(1) + ' T/H, no jump');
  ck(!errs.length, 'no page errors ' + errs.slice(0, 2).join(' | '));
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
