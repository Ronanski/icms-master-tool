// 3.2.1 (SEULGI : PLANT MODEL, boiler side: BOTTOM ASH, src/analog/engine/boiler.js AN_BA; docs/versions/v3.2.1/BOTTOM_ASH_PLANT_MODEL.md).
// The one world ON (ABC + DITL), plant model ON. The field devices of the bottom ash transmitter and conveyors answer the DITL-BA
// drawings (IO list station 103). Checks:
//  150 MW at rest (16.PNG: chain conveyor, bucket elevator, screw conveyor and venting fan running in REMOTE; O&M L6 p.7 primary
//    conditions): the four transmitter valves closed (ZSC made, no VALVE ABNORMAL on DITL-BA38 / BA39), vessel pressure low switch made,
//    no CONVEYORS EMG.STOP (DITL-BA62), no SPEED FAULT (DITL-BA66 / 67 / 68);
//  the air tank switch PS-BH1750 reads the plant air receivers of the model (7.0, 39.PNG) against the O&M set point 7 kg/cm2: not low,
//    no AIR SOURCE PRESSURE LOW, no SYSTEM FAULT (DITL-BA25 / BA48);
//  one charging (O&M L6 5 a, LOP "Charging"): the sand silo venting fan F-1301 started (the destination is the sand silo; DITL-BA05 row 14),
//    RESET(DCS), then LI1-S-1090 CHARGING (LOP): the inlet gate valve opens (ZSO), the vessel fills.
// Usage: node tests/regress/bottom_ash.js [html]
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
  await page.waitForFunction(
    () => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && S.sheets.length >= PRE_N,
    null,
    { timeout: 120000 }
  );
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async () => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    const run = async sec => {
      for (let i = 0; i < sec * 2; i++) {
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    const sh = n => S.sheets.find(x => x.name.endsWith(')' + n));
    const o = (n, r) => DUI.outVal(sh(n), r);
    const i = (n, r) => DUI.rowVal(sh(n), r);
    const snap = () => ({
      abn: [o('DITL-BA38', 2), o('DITL-BA38', 6), o('DITL-BA39', 2), o('DITL-BA39', 6)],
      zsc: [i('DITL-BA03', 0), i('DITL-BA03', 1), i('DITL-BA03', 2), i('DITL-BA03', 3)],
      zsoInl: i('DITL-BA38', 1),
      psl: i('DITL-BA25', 0),
      air: i('DITL-BA25', 1),
      emg: o('DITL-BA62', 2),
      spd: [o('DITL-BA66', 16), o('DITL-BA67', 14), o('DITL-BA68', 14)],
      lv: AN.unit.baLv,
      pa: AN.unit.paP,
      sf: o('DITL-BA48', 4)
    });
    const z = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(20);
    z.rest = snap();
    /* the charge: the air switch made (test only), the latched faults reset, then the LOP charging button */
    /* DITL-BA02 row 10 RESET_HMI (-> RESET(DCS) M.1302), DITL-BA01 row 3 LI1-S-1090 CHARGING_INPUT (-> I.0490) */
    const push = async (n, k) => {
      const s = sh(n);
      s.sig[k + ':S'] = true;
      await run(2);
      delete s.sig[k + ':S'];
      await run(2);
    };
    /* the charge waits for the sand silo venting fan F-1301 (DITL-BA05 row 14): CRT ON COMMAND of DITL-774 row 6 */
    const v774 = sh('DITL-774');
    v774.sig['5:S'] = true;
    await run(3);
    z.fan = i('DITL-BA05', 13);
    await push('DITL-BA02', 9);
    await push('DITL-BA01', 2);
    await run(6);
    z.chg = snap();
    delete v774.sig['5:S'];
    return z;
  });
  const s = r.rest;
  ck(
    s.abn.every(x => x === 0) && s.zsc.every(x => x === 1) && s.psl === 1 && s.zsoInl === 0,
    '150 MW at rest: transmitter valves closed (ZSC), no VALVE ABNORMAL, vessel pressure low switch made ' +
      JSON.stringify(s)
  );
  ck(
    s.emg === 0 && s.spd.every(x => x === 0),
    'conveyors: no EMG.STOP latch, no speed fault (16.PNG running in REMOTE) ' + JSON.stringify(s)
  );
  ck(
    s.air === 0 && s.pa >= 7 && s.sf === 0,
    'air tank switch PS-BH1750 not low (receivers ' +
      s.pa +
      ' kg/cm2 vs O&M 7), no SYSTEM FAULT: ' +
      s.air +
      ' / ' +
      s.sf
  );
  ck(
    r.fan === 1,
    'sand silo venting fan F-1301 running (sand model) reaches the charge permissive DITL-BA05 row 14: ' + r.fan
  );
  const c = r.chg;
  ck(
    c.zsoInl === 1 && c.lv > 0 && c.abn.every(x => x === 0),
    'LOP CHARGING: inlet gate valve open (ZSO), vessel filling, no abnormal ' + JSON.stringify(c)
  );
  if (errs.length) console.log('page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
