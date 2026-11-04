// 3.2.1 (IRENE: PLANT MODEL, CONDENSATE; unit.js AN_CD / anCondStep; docs/versions/v3.2.1/CONDENSATE_PLANT_MODEL.md).
// The one world ON (ABC + DITL), plant model ON, Start at 150 MW:
//  base: condenser pressure from the seawater and the steam (O&M L15-1), hotwell temperature, CEP flow / outlet pressure / current
//    (KSB curve Q43495D), the DITL-61B row PT-CD1117 reads the same number;
//  CEP A trips (DITL-61A row 2 MIT-P1116A): PT-CD1117 < 14 kg/cm2 -> M.3217 -> the standby CEP B (AUTO) is started by the logic;
//  condenser inlet V-SW1007 closed (one water box): the condenser pressure rises;
//  both condenser inlets closed: no seawater, the condenser pressure rises past the LOW VACUUM trip, the turbine trips;
//  make-up pumps' discharges closed: no make-up to the hotwell (the hotwell falls faster than with the make-up).
// Usage: node tests/regress/condensate.js [html]
const fs = require('fs');
const { open } = require('./lib.js');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async () => {
  const { browser, page, errs } = await open(html);
  let fail = 0;
  const ck = (ok, w) => {
    console.log((ok ? 'PASS ' : 'FAIL ') + w);
    if (!ok) fail++;
  };
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && S.sheets.length >= PRE_N, null, { timeout: 120000 });
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
    const sh = n => S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(n));
    const set = (n, row, v) => {
      WORLD.live = true;
      const ok = WORLD.dset(n, row, v);
      WORLD.live = false;
      return ok;
    };
    const f = x => Math.round(x * 1000) / 1000;
    const U = () => AN.unit;
    const g = () => ({ P: f(U().cdP), T: f(U().cdT), Q: U().cdQ, W: U().swQc, q: U().cdQp, Pd: f(U().cdPd), I: [U().cdI0, U().cdI1], dp: [U().cdDp0, U().cdDp1], d61: (sh('DITL-61B').avw || {}).r20, d55: f(window.WORLD && WORLD.condP ? WORLD.condP() : NaN), hw: f(U().cdHw), run: U().cdRun, tb: U().tb && U().tb.st, trip: !!(U().vtrip && U().vtrip.S.rt.ext[U().vtrip.n] === 1) });
    const V = (t, p) => AN.swValve(t, p);
    const o = {};
    const start = async () => {
      AN.run = false;
      AN.reset();
      ditlStates();
      AN.plantLoad150();
      DITL150.apply();
      await run(60);
    };
    await start();
    o.base = g();
    set('DITL-61A', 2, true);
    o.trMin = 99;
    o.trB = null;
    for (let i = 0; i < 20; i++) {
      await run(0.5);
      const x = g();
      o.trMin = Math.min(o.trMin, x.Pd);
      if (o.trB == null && x.run[1] === 1) o.trB = (i + 1) / 2;
      if (i === 0) o.tr05 = x;
    }
    await run(20);
    o.tr30 = g();
    set('DITL-61A', 2, false);
    await start();
    V('V-SW1007', 0);
    await run(120);
    o.box1 = g();
    V('V-SW1008', 0);
    await run(90);
    o.box0 = g();
    await start();
    const hw0 = U().cdHw;
    await run(120);
    o.hwN = f(U().cdHw - hw0);
    V('V-MU0007', 0);
    V('V-MU0011', 0);
    await run(30);
    const hw1 = U().cdHw;
    await run(120);
    o.hwMu = f(U().cdHw - hw1);
    o.muFeed = U().muFeed;
    return o;
  });
  console.log(JSON.stringify(r));
  const b = r.base;
  ck(b.P > 0.05 && b.P < 0.075 && b.T > 33 && b.T < 41, `150 MW condenser ${b.P} kg/cm2A at ${b.T} C (heat ${b.Q} MW, seawater ${b.W} m3/h; O&M design 0.070 / 38.65 C, 4.PNG 0.057, alarm list 38.6 C)`);
  ck(b.run[0] === 1 && b.run[1] === 0 && Math.abs(b.Pd - 16.9) < 0.3 && Math.abs(b.I[0] - 28.1) < 1 && b.d61 === b.Pd, `CEP A ${b.q} m3/h, PT-CD1117 ${b.Pd} kg/cm2 (28.png 16.9), ${b.I[0]} A (28.1), DITL-61B row 19 reads ${b.d61}`);
  ck(r.trMin < 14 && r.trB != null, `CEP A tripped: PT-CD1117 down to ${r.trMin} kg/cm2 (< 14.0, DITL-61B M.3217), CEP B running after ${r.trB} s`);
  ck(r.tr30.run[1] === 1 && r.tr30.Pd > 14, `the logic started CEP B: ${r.tr30.q} m3/h, PT-CD1117 ${r.tr30.Pd}, ${r.tr30.I[1]} A`);
  ck(r.box1.W < b.W && r.box1.P > b.P && !r.box1.trip, `condenser inlet V-SW1007 closed: seawater ${r.box1.W} m3/h, condenser ${r.box1.P} kg/cm2A at ${r.box1.T} C, no trip`);
  ck(r.box0.W === 0 && r.box0.P > 0.447 && r.box0.trip, `both inlets closed: no seawater, condenser ${r.box0.P} kg/cm2A, turbine LOW VACUUM trip`);
  ck(r.muFeed === 0 && r.hwMu < r.hwN - 0.5, `MWP discharges closed: no make-up, hotwell ${r.hwMu} mm in 2 min (with make-up ${r.hwN} mm)`);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
