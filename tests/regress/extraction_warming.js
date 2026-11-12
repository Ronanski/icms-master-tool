// 3.2.3 (SOHEE): two shut-off valves of the turbine steam that the plant model did not use (INSTRUMENT_VALVE_COVERAGE "WALA"):
//   - MV-TS1003 extraction no. 3 to the deaerator (DITL-96; PD-013; 02.png 100.4 % at load): source.js Pex3 x its position. Shut,
//     the deaerator gets no extraction 3 (the pressure floor of PICCD1104 goes);
//   - XV-HR1010-1 LP bypass warming valve (DITL-83, O.0846) and TT-HR1010 (AI0870) that DITL-83 reads (unit.js AN_HRW): 150 MW rest
//     228 C (5.png, valve closed in MANUAL); AUTO opens it below 250 C (after its ON DELAY) and closes it above 330 C.
// Usage: node tests/regress/extraction_warming.js [html]
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
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async () => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    const r1 = x => Math.round(x * 10) / 10;
    let hold = null;
    const run = async (sec, f) => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        if (hold) hold();
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (f) f();
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    const UU = () => AN.unit;
    const p83 = () => {
      const s = S.sheets.find(x => /\)DITL-83$/.test(x.name));
      return s && s.avw ? Object.values(s.avw).map(r1) : [];
    };
    const st = () => ({ Prh: UU().Prh, ts3: (WORLD.live = true, AN.ditlPos('DITL-96', 0)), pex3: r1(AN.srcSt().Pex3), T10: r1(UU().hrT10), w: UU().hrW, avw: p83() });
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantCold();
    await run(120);
    o.cold = st();
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(300);
    o.l150 = st();
    /* MV-TS1003 held shut in the field */
    const v = S.sheets.find(x => /\)DITL-96$/.test(x.name));
    hold = () => {
      MST[v.name][0].pos = 0;
    };
    await run(120);
    o.shut = st();
    hold = null;
    MST[v.name][0].pos = 100;
    await run(60);
    o.back = st();
    /* XV-HR1010-1 in AUTO (DITL-83 row 10 M.0632 AUTO SELECTED) */
    hold = () => WORLD.dset('DITL-83', 0, true);
    let opened = 0, closed = 0, last = UU().hrW, Tmax = 0, Tmin = 999, tOpen = null;
    await run(3600, () => {
      if (UU().hrW !== last) {
        if (UU().hrW) { opened++; if (tOpen == null) tOpen = UU().hrT10; } else closed++;
        last = UU().hrW;
      }
      if (opened) { Tmax = Math.max(Tmax, UU().hrT10); if (closed) Tmin = Math.min(Tmin, UU().hrT10); }
    });
    o.auto = { opened, closed, Tmax: r1(Tmax), Tmin: r1(Tmin), tOpen: r1(tOpen), now: st() };
    hold = null;
    return o;
  });
  console.log(JSON.stringify(r));
  ck(Math.abs(r.cold.T10 - 30) < 1 && r.cold.w === 0, `Cold: TT-HR1010 ${r.cold.T10} C (ambient), warming valve closed`);
  ck(r.l150.ts3 === 100 && r.l150.pex3 > 4, `150 MW: MV-TS1003 ${r.l150.ts3} %, extraction 3 pressure to the deaerator ${r.l150.pex3} kg/cm2`);
  ck(Math.abs(r.l150.T10 - 228) < 5 && r.l150.w === 0 && r.l150.avw.length > 0 && r.l150.avw.every(x => Math.abs(x - r.l150.T10) < 0.5), `150 MW: TT-HR1010 ${r.l150.T10} C (5.png 228), XV-HR1010-1 closed, DITL-83 reads ${r.l150.avw.join(' / ')}`);
  ck(r.shut.ts3 < 1 && r.shut.pex3 === 0, `MV-TS1003 shut: no extraction 3 to the deaerator (${r.shut.pex3})`);
  ck(r.back.ts3 === 100 && r.back.pex3 > 4, `MV-TS1003 open again: ${r.back.pex3} kg/cm2`);
  const a = r.auto;
  ck(a.opened >= 1 && a.tOpen < 250, `AUTO: XV-HR1010-1 opens below 250 C (at ${a.tOpen} C)`);
  ck(a.closed >= 1 && a.Tmax > 330 && a.Tmax < 345, `AUTO: it closes above 330 C (peak ${a.Tmax} C)`);
  ck(a.opened >= 2 && a.Tmin < 250 && a.Tmin > 240, `AUTO: cools, opens again below 250 C (low ${a.Tmin} C; ${a.opened} opens, ${a.closed} closes in 1 h)`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
