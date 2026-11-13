// 3.2.3-beta.180 (SOHEE): the FA blower valves on instrument air loss (Continental P&ID 500-0ds REV03, o&m-package-phase-1 L10-5:
// inlet FCV-FA1055A1/B1 "Modulated Valve PNEUMATIC DN500 Single acting" NO, outlet XV-FA1055A3/B3 and surge (to silencer)
// XV-FA1055A2/B2 "ON/OFF Valve PNEUMATIC Single acting" NO: all three spring OPEN without air; unit.js AN_AV.spr / sv).
// From "Start at 150 MW" the unit 1 air header is cut (V-IA1101 closed). Checks:
//   - 150 MW with air: inlet at its MV, surge valve of the running blower A closed, FA flow to the header about 26 T/H;
//   - without air (PT-IA1706 < 0.6 bar): the inlet opening that reaches the blower = 100 % whatever its MV, the DITL-28C surge valve
//     position = 100 % although the DCS keeps it closed, and the FA flow to the header falls below the L.L. 20 T/H (ABC-006 M.3114:
//     the blower blows to the atmosphere);
//   - air back (V-IA1101 open): the surge valve follows its command again.
// Usage: node tests/regress/fab_air_loss.js [html]
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
    const r1 = x => Math.round(x * 10) / 10;
    const T = k => AN.sheets.find(s => s.name === k).S;
    const ctl = (k, t) => AN.hmiCtrls(T(k)).find(c => c.tag === t);
    const mvA = () => +T('ABC-014').rt.v[ctl('ABC-014', 'FICFA1055A').out];
    const snap = () => {
      const U = AN.unit;
      return {
        P: r1(U.iaPU),
        mv: r1(mvA()),
        inlet: r1(AN.av('FICFA1055A', mvA())),
        surge: Math.round(AN.ditlPos('DITL-28C', 0)),
        outlet: Math.round(AN.ditlPos('DITL-28C', 1)),
        fa: r1(U.fnFaQ),
        faT: r1(U.fnFaT),
        sil: (U.fnSil || []).slice()
      };
    };
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(300);
    const o = { a: snap() };
    AN.swValve('V-IA1101', 0);
    /* the first 10 s step where the header is below the spring travel start (0.6 bar = 0.61 kg/cm2) */
    o.t = -1;
    for (let t = 0; t < 600; t += 10) {
      await run(10);
      if (AN.unit.iaPU < 0.6 / 0.980665) {
        o.t = t + 10;
        break;
      }
    }
    await run(60);
    o.b = snap();
    AN.swValve('V-IA1101', 100);
    await run(180);
    o.c = snap();
    return o;
  });
  console.log(JSON.stringify(r));
  const { a, b, c } = r;
  ck(a.P > 6.5 && a.surge === 0 && Math.abs(a.inlet - a.mv) < 0.1 && a.fa > 20, `150 MW: air ${a.P} kg/cm2, inlet ${a.inlet} % = MV ${a.mv} %, surge valve A ${a.surge} %, FA flow ${a.fa} T/H`);
  ck(r.t > 0 && b.P < 0.62 && b.inlet === 100 && b.mv < 100, `no air (${b.P} kg/cm2 after ${r.t} s + 60 s): inlet ${b.inlet} % (spring open) with MV ${b.mv} %`);
  ck(b.surge === 100 && b.sil[0] === true, `no air: surge valve A ${b.surge} % open (spring), the blower blows to the silencer`);
  ck(b.faT < 1 && b.fa < 20, `no air: FA flow target ${b.faT} T/H, FIFA1055 ${b.fa} T/H (< L.L. 20)`);
  ck(c.P > 6.5 && c.surge === a.surge, `air back ${c.P} kg/cm2: surge valve A back to its command (${c.surge} %)`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
