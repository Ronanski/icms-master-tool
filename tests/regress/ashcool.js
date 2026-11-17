// 3.2.4-beta.50 (JENNIE): the bottom ash screw coolers L-1060A ~ D of the plant model (unit.js AN_BAC; Rauma E130122B). The one world
// ON, plant model ON, 150 MW. Checks:
//  at rest (16.PNG: all four coolers stopped): ash / water temperatures have values (not '-----'), water outlets = the supply
//    TT-CW1156; LT-BH1750 15.8 %; the ESP AND ASH page shows them;
//  MANUAL SEQUENCE MODE (DITL-21C row 16) and START of cooler A (DITL-21A): at its speed: ash out far below ash in, both water outlets (shell x1 / shaft x2, DITL-21A rows 14 / 13) above the supply, inside the spec
//    (ash out < 150 C at <= 2.5 rpm, water out < 60 C); the stopped ones stay as at rest.
// Usage: node tests/regress/ashcool.js [html]
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
    const U = () => AN.unit;
    const snap = () => {
      const u = U(),
        o = { sup: u.acT6, P: u.acP6, silo: u.bhSilo, MW: u.MW, Tb: u.Tb };
      for (const x of 'ABCD') o[x] = [u['bh' + x + '1'], u['bh' + x + '2'], u['bw' + x + '1'], u['bw' + x + '2']].map(v => Math.round(v * 10) / 10);
      return o;
    };
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(120);
    const rest = snap();
    let pg = null;
    try {
      lsShellC.openPage('MK14');
      await new Promise(r => setTimeout(r, 1500));
      pg = ['TT-BH1060-A1', 'TT-BH1060-A2', 'TT-CW1060-A1', 'TT-CW1060-A2', 'TT-CW1156', 'PT-CW1156', 'LT-BH1750'].map(t => {
        const e = document.querySelector('[data-v="' + t + '"]');
        return t + '=' + (e ? e.textContent : 'none');
      });
    } catch (e) {
      pg = ['err ' + e.message];
    }
    /* the coolers stand in their AUTO SEQUENCE (ditl150.js); at 150 MW the furnace DP stays under the 1500 mmH2O start of DITL-21D. The
       operator takes the MANUAL SEQUENCE MODE (DITL-21C row 16 M.2121, as 16.PNG shows MANUAL) and starts cooler A (DITL-21A START) */
    const sh = n => S.sheets.find(x => x.name.endsWith(')' + n));
    WORLD.live = true;
    const okM = LS_DOCK.dpress(sh('DITL-21C').name, 15);
    WORLD.live = false;
    await run(3);
    WORLD.live = true;
    const okS = LS_DOCK.dmotor('DITL-21A', true);
    WORLD.live = false;
    await run(900);
    const k = 0,
      on = AN.ditlRun('DITL-21A');
    const sc = (U().bedSc || [])[Math.max(0, k)];
    const rpm = sc && sc.S ? +sc.S.rt.v[sc.n] : null;
    const runA = snap();
    runA.k = k;
    runA.ok = [okM, okS];
    runA.dp = U().dpLo;
    const ev = (window.lsEvents || []).slice ? null : null;
    return { rest, pg, on, rpm, runA };
  });
  console.log(JSON.stringify(r));
  const R = r.rest;
  ck('ABCD'.split('').every(x => R[x].every(v => isFinite(v))), 'at rest: every ash / water temperature has a value');
  ck('ABCD'.split('').every(x => Math.abs(R[x][3] - R.sup) < 0.5 && Math.abs(R[x][2] - R.sup) < 0.5), 'at rest: water outlets = the supply ' + R.sup);
  ck(R.silo === 15.8, 'LT-BH1750 15.8 %');
  ck(r.pg && r.pg.every(s => !/=(none|-----)/.test(s)), 'ESP AND ASH page shows ' + (r.pg || []).join(' '));
  if (r.on === 1) {
    const x = 'ABCD'[r.runA.k],
      A = r.runA[x],
      o = 'ABCD'.split('').filter(y => y !== x && r.runA[y][1] === r.runA[y][0]);
    ck(A[0] > 500 && A[1] < A[0] - 300, 'cooler ' + x + ' started (MANUAL SEQUENCE + START), ' + r.rpm + ' rpm: ash in ' + A[0] + ' out ' + A[1]);
    ck(A[2] > r.runA.sup + 1 && A[3] > r.runA.sup + 1 && A[2] < 60, 'cooler ' + x + ' water outlets (shell / shaft) ' + A[2] + ' / ' + A[3] + ' over the supply ' + r.runA.sup);
    ck(r.rpm > 2.5 || A[1] < 150, 'cooler ' + x + ': ash out < 150 C at <= 2.5 rpm (spec)');
    ck(o.every(y => Math.abs(r.runA[y][2] - r.runA.sup) < 0.5), 'stopped coolers ' + o.join(' ') + ': water outlets = supply');
  } else ck(false, 'cooler A did not start (press ' + r.runA.ok + ', run ' + r.on + ')');
  if (errs.length) console.log('page errors', errs.slice(0, 5));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
