// 3.2.1 (IRENE): instrument air -> pneumatic valves (unit.js AN_AV; vendor sheets K1AU3-E2-0-123 R1 "Drawing of Control valve").
// From "Start at 150 MW" the unit 1 air header is cut (field valve V-IA1101 closed, PT-IA1706 falls). Checks:
//   - modulating valves with an airlock stay where they are: the No.2 HP heater primary drain LCV-HD1106-1 (LICHD11061) and the
//     deaerator level valve LCV-CD1104 (LICCD1104) do not follow their MV in MANUAL (the heater level / deaerator answer the held opening);
//   - on / off valves go to their spring position: XV-MU1109 (spring opening) OPENS by itself although the DCS keeps it closed,
//     XV-SB1054 (spring closing) stays closed; part way while the actuator pressure is between precompression and full travel;
//   - air back (V-IA1101 open): the valves follow their command again.
// Usage: node tests/regress/air_valves.js [html]
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
    const run = async sec => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    const T = k => AN.sheets.find(s => s.name === k).S;
    const ctl = (k, t) => AN.hmiCtrls(T(k)).find(c => c.tag === t);
    const man = (k, t, x) => {
      const c = ctl(k, t),
        S2 = T(k),
        st = S2.rt.st[c.amt.id];
      st.al = c.autoLeg;
      st.fm = c.autoLeg === 'A' ? 'B' : 'A';
      if (c.manBlk && S2.rt.st[c.manBlk.id]) S2.rt.st[c.manBlk.id].val = x;
      else S2.rt.ext[c.manNet] = x;
      for (const [S3, n] of AN.modeNets(t)) S3.rt.ext[n] = 1;
    };
    const mv = (k, t) => Math.round(+T(k).rt.v[ctl(k, t).out] * 10) / 10;
    const pos = n => Math.round(AN.ditlPos(n, 0));
    const r1 = x => Math.round(x * 10) / 10;
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    const U = AN.unit;
    await run(300);
    o.P0 = r1(U.iaPU);
    o.mu0 = pos('DITL-78');
    o.sb0 = pos('DITL-80R');
    o.h6 = r1(U.hdLvl.H6);
    /* the air goes */
    AN.swValve('V-IA1101', 0);
    await run(240);
    o.P1 = r1(U.iaPU);
    o.mu1 = pos('DITL-78');
    o.muOut = AN.ditlRun('DITL-78@3');
    o.sb1 = pos('DITL-80R');
    /* the operator closes the No.2 HP heater drains and the deaerator level valve by hand: the valves do not move */
    const hold0 = Object.assign({}, U.avH);
    man('ABC-036', 'LICHD11061', 0);
    man('ABC-036', 'LICHD11062', 0);
    man('ABC-031', 'LICCD1104', 0);
    await run(60);
    o.mvHd = mv('ABC-036', 'LICHD11061');
    o.mvDa = mv('ABC-031', 'LICCD1104');
    o.heldHd = r1(U.avH.LICHD11061);
    o.heldDa = r1(U.avH.LICCD1104);
    o.hold0Hd = r1(hold0.LICHD11061);
    o.hold0Da = r1(hold0.LICCD1104);
    o.h6b = r1(U.hdLvl.H6);
    /* air back */
    AN.swValve('V-IA1101', 100);
    await run(120);
    o.P2 = r1(U.iaPU);
    o.mu2 = pos('DITL-78');
    o.h6c = r1(U.hdLvl.H6);
    o.heldHd2 = r1(U.avH.LICHD11061);
    return o;
  });
  console.log(JSON.stringify(r));
  ck(r.P0 > 6.5 && r.mu0 === 0, `150 MW: unit air ${r.P0} kg/cm2, XV-MU1109 closed (${r.mu0} %)`);
  ck(r.P1 < 1, `V-IA1101 closed: PT-IA1706 ${r.P1} kg/cm2`);
  ck(r.mu1 === 100, `XV-MU1109 (spring opening, item 39) open without air: ${r.mu1} %, DITL-78 out 4 = ${r.muOut}`);
  ck(r.sb1 === 0, `XV-SB1054 (spring closing, item 10) closed without air: ${r.sb1} %`);
  ck(r.mvHd === 0 && r.heldHd > 5 && Math.abs(r.heldHd - r.hold0Hd) < 0.01, `LCV-HD1106-1 held at ${r.heldHd} % (MV ${r.mvHd} %): airlock`);
  ck(r.mvDa === 0 && r.heldDa > 5 && Math.abs(r.heldDa - r.hold0Da) < 0.01, `LCV-CD1104 held at ${r.heldDa} % (MV ${r.mvDa} %): fail in place`);
  ck(Math.abs(r.h6b - r.h6) < 40, `No.2 HP heater level ${r.h6b} mm (was ${r.h6}): the drain did not close`);
  ck(r.P2 > 6.5 && r.mu2 === 0, `air back ${r.P2} kg/cm2: XV-MU1109 closed again (${r.mu2} %)`);
  ck(r.heldHd2 === 0 && r.h6c > r.h6b + 20, `air back: LCV-HD1106-1 follows its MV 0 % (${r.heldHd2}), level rises ${r.h6c} mm`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
