// 3.2.3-beta.178 (SOHEE): BFWP motor winding temperature from the closed cooling water (unit.js AN_MT.cw). TECO data sheet
// 3A057H186-71069: IC81W (water-to-air cooler), 355 A, stator rise limit 80 C at S.F. 1.0, eff. 96.2 %, cooler water 430 ~ 470 L/min.
// From "Start at 150 MW", 1 h of plant. Checks:
//   - running BFWP-A winding = ACW supply (TT-CW1153) + 80 x (I / 355)^2 within 1 C, below the DITL-23B set point 150 C;
//   - DITL-23B rows 13 ~ 15 (TT-FW1115-AU / AV / AW) read that value (they read the fixed 75 C before);
//   - the standby BFWP-B (machine #B) reads its own pump: the water temperature, not the running pump's value;
//   - losing the ACW flow (both ACWP tripped): the hottest BFWP-A winding phase passes 150 C and DITL-23B row 26 (TRIP OR STOP
//     INTERLOCK CONDITION, M.1073) stops BFWP-A within 20 s of it, the stop cause names the > 150 C comparator.
// Usage: node tests/regress/bfwp_motor_ccw.js [html]
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
    const rowVal = (nm, tag) => {
      const s = (WORLD.inst || []).concat(S.sheets).find(x => x && x.name === nm);
      if (!s) return NaN;
      for (const a of s.nl.an || []) {
        const z = (s.nl.src || []).find(q => q.n === a.net);
        let I = {};
        try {
          I = DUI.rowInfo(s, z.row) || {};
        } catch (e) {}
        if (((I.tag || '') + ' ' + (I.svc || '')).includes(tag)) return s.avw ? +s.avw[a.key] : NaN;
      }
      return NaN;
    };
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    const U = AN.unit;
    await run(3600);
    const o = {
      run: U.fwRun.slice(),
      I: U.fwI0,
      Tc: U.acT2,
      Q: U.acQ,
      AU: U.mt['TT-FW1115-AU'],
      BU: U.mt['TT-FW1115-BU'],
      rowA: rowVal('(42)DITL-23B', 'TT-FW1115-AU'),
      rowB: rowVal('(42)DITL-23B #B', 'TT-FW1115-AU')
    };
    /* loss of the closed cooling water: both ACWP tripped (DITL-76 / 77 row 2 = I.0087 / its B pump trip contact, held) */
    WORLD.live = true;
    o.how = [WORLD.dset('DITL-76', 2, true), WORLD.dset('DITL-77', 2, true)].join('/');
    /* every 10 s: the highest winding while BFWP-A runs, and when it stops */
    o.max = 0;
    o.tStop = -1;
    o.t150 = -1;
    for (let t = 0; t < 3600; t += 10) {
      await run(10);
      const w = Math.max(U.mt['TT-FW1115-AU'], U.mt['TT-FW1115-AV'], U.mt['TT-FW1115-AW']);
      if (U.fwRun[0] === 1) o.max = Math.max(o.max, w);
      if (o.t150 < 0 && w > 150) o.t150 = t + 10;
      if (o.tStop < 0 && U.fwRun[0] !== 1) {
        o.tStop = t + 10;
        o.mw = U.MW;
        const s23 = S.sheets.find(x => /DITL-23A$/.test(x.name));
        o.ev = s23 && s23._stopWhy ? s23._stopWhy.lines.map(l => l.txt).join(' / ') : '';
        break;
      }
    }
    o.Q2 = U.acQ;
    o.AU2 = U.mt['TT-FW1115-AU'];
    o.run2 = U.fwRun.slice();
    return o;
  });
  console.log(JSON.stringify(r));
  const r1 = x => Math.round(x * 10) / 10;
  const want = r.Tc + 80 * Math.pow(r.I / 355, 2);
  ck(r.run[0] === 1 && Math.abs(r.AU - want) < 1 && r.AU < 150, `BFWP-A winding U ${r1(r.AU)} C at ${r1(r.I)} A, water ${r1(r.Tc)} C (CALC ${r1(want)} C, DITL-23B > 150)`);
  ck(Math.abs(r.rowA - r.AU) < 0.2, `DITL-23B row TT-FW1115-AU reads ${r.rowA} C (the plant)`);
  ck(r.run[1] === 0 && Math.abs(r.rowB - r.Tc) < 2, `DITL-23B #B (BFWP-B stopped) reads ${r.rowB} C (its water ${r1(r.Tc)} C)`);
  ck(
    r.Q2 < 100 && r.t150 > 0 && r.tStop >= r.t150 && r.tStop - r.t150 <= 20 && /TRIP OR STOP INTERLOCK/.test(r.ev) && /> 150/.test(r.ev),
    `ACW lost (flow ${r.Q2} m3/h): a BFWP-A winding phase passes 150 C at ${r.t150} s, BFWP-A stops at ${r.tStop} s, cause: ${r.ev}`
  );
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
