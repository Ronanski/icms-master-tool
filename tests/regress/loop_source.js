// 3.2.0-beta.14 (plan phase A, user: "since walang steam, dapat walang ma-generate na PV ito kahit anong SV MV mo"): the SOURCE of
// each loop (src/analog/engine/source.js). With the plant model on and a starting state:
//  - Cold: no steam / oil / water / air: the PV stays at 0 (or the ambient) whatever the MV of the loop (MANUAL 0 -> 100 %)
//  - At 150 MW: the snapshot values stay (no change from before)
//  - Diesel oil pump (field equipment): stopped = no oil header pressure; started = the header answers its MV
// Usage: node tests/regress/loop_source.js [html]
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
  /* the loop in MANUAL at mv (the station output, as the operator's MV), step ABC-001C (unit model) and the loop sheet for sec
     seconds, read the PV */
  /* rel: memories of the loop sheet held at 0 while the MV is put (the back-up command of the drawing, below) */
  const pvAt = (shn, tag, mv, sec, rel) =>
    page.evaluate(
      ([shn, tag, mv, sec, rel]) => {
        const sh = AN.sheets.find(s => s.name === shn),
          S = sh.S,
          c = AN.hmiCtrls(S).find(q => q.tag === tag),
          u = AN.sheets.find(s => s.name === 'ABC-001C');
        const relN = (rel || []).map(a => S.lab.findIndex(l => l && String(l.t).trim() === a)).filter(n => n >= 0);
        for (const n of relN) S.rt.force[n] = 0;
        /* MANUAL, as Start cold puts every controller (hmi-op.js anPlantCold) */
        if (c.amt && S.rt.st[c.amt.id]) {
          const st = S.rt.st[c.amt.id];
          st.al = c.autoLeg;
          st.fm = c.autoLeg === 'A' ? 'B' : 'A';
          st.hold = 0;
        }
        const put = () => {
          if (c.manBlk && S.rt.st[c.manBlk.id]) S.rt.st[c.manBlk.id].val = mv;
          else if (c.manNet != null) S.rt.ext[c.manNet] = mv;
        };
        for (let i = 0; i < sec * 2; i++) {
          put();
          AN.stepSet(u, 0.5);
          if (sh !== u) AN.stepSet(sh, 0.5);
        }
        const pr = c.b.proc,
          r = { pv: +S.rt.v[pr.pv], out: +S.rt.v[c.out], msp: AN.unit ? AN.unit.Pms : NaN, rel: relN.length };
        for (const n of relN) delete S.rt.force[n];
        return r;
      },
      [shn, tag, mv, sec, rel]
    );
  const state = (fn, arg) =>
    page.evaluate(
      ([fn, arg]) => {
        AN.reset();
        AN[fn](arg);
        AN.startState = fn;
        return true;
      },
      [fn, arg]
    );
  /* 1. Cold */
  await state('plantCold');
  /* 3.2.0-beta.22: Cold has the BFWP stopped now (it stayed running from the snapshot); the HP bypass spray TICMS1022 takes its water
     from the BFWP (ABC-050 M.0702 ALL BFWP STOPPED shuts it): start BFWP-A so the MV can open and the "no medium" check means steam */
  await page.evaluate(() => CHECK.H().setx(null, 'M.3343', 1));
  /* 3.2.3 SOHEE: ABC-030 PICAS1005 (cold reheat to aux steam, PCV-AS1020-1 / -2) has a BU-CMD from M.0129 (the FF of TICR1004.PV < 230 /
     > 235 C and PICR1003.PV < 9.5 / > 11.5 kg/cm2, CLAUDE.md item 3): while the cold reheat is not hot, the drawing selects the constant
     A (0 %) after the station and the station's manual value tracks it (interlock tracking), so the operator cannot open the valve at
     Cold: right as drawn (failing since beta.81 at least, MV stayed 0 %). To test the SOURCE (no steam = no PV) the BU-CMD is held
     released (M.0129 = 0) while the MV is put; the expected result is the same */
  for (const [shn, tag, top, rel] of [
    ['ABC-017', 'PICSB1052', 0.5],
    ['ABC-028', 'PICDO0005', 0.5],
    ['ABC-030', 'PICAS1005', 0.5, ['M.0129']],
    ['ABC-032', 'FICCD1120', 1],
    ['ABC-053', 'TICLO1002', 31],
    ['ABC-051', 'TICMS1022', 31],
    ['ABC-034', 'TICAS1017', 31]
  ]) {
    const a = await pvAt(shn, tag, 0, 20, rel),
      b = await pvAt(shn, tag, 100, 120, rel);
    ck(
      a.pv <= top && b.pv <= top && b.out > 50,
      `Cold ${shn} ${tag}: MV 0 % -> PV ${a.pv.toFixed(1)}, MV ${b.out.toFixed(0)} % -> PV ${b.pv.toFixed(1)} (no medium: <= ${top})`
    );
  }
  /* the drawing's protection itself: at Cold, BU-CMD M.0129 on, the operator's MV 100 % does not open PCV-AS1020 */
  {
    const h = await pvAt('ABC-030', 'PICAS1005', 100, 30);
    ck(h.out < 0.5, `Cold ABC-030 PICAS1005: BU-CMD M.0129 (cold reheat not hot) holds the valve shut: operator MV 100 % -> out ${h.out.toFixed(1)} %`);
  }
  /* 2. At 150 MW: the snapshot */
  await state('plantLoad150');
  {
    const r = await page.evaluate(() => {
      const o = {};
      for (const [shn, tag] of [
        ['ABC-030', 'PICAS1005'],
        ['ABC-032', 'FICCD1120'],
        ['ABC-051', 'TICMS1022'],
        ['ABC-053', 'TICLO1002'],
        ['ABC-028', 'PICDO0005']
      ]) {
        const S = AN.sheets.find(s => s.name === shn).S,
          b = S.procs.find(z => (z.txt || [])[1] === tag);
        o[tag] = +(+S.rt.v[b.proc.pv]).toFixed(1);
      }
      return o;
    });
    ck(
      Math.abs(r.FICCD1120 - 380) < 5 &&
        Math.abs(r.TICMS1022 - 357.5) < 20 &&
        Math.abs(r.PICDO0005 - 12.9) < 0.5 &&
        r.PICAS1005 > 9 &&
        r.TICLO1002 > 40,
      '150 MW: snapshot values kept ' + JSON.stringify(r)
    );
  }
  /* 3. Diesel oil pump, field equipment */
  await state('plantCold');
  {
    const a = await pvAt('ABC-028', 'PICDO0005', 60, 60);
    /* 3.2.1 SEULGI: the pump runs from its DITL (DITL-31, plant model boiler.js): local panel REMOTE (row 22), then START P.B. (row 4) */
    await page.evaluate(async () => {
      const set = (r, v) => ((WORLD.live = true), WORLD.dset('DITL-31', r, v), (WORLD.live = false));
      set(21, true);
      for (let i = 0; i < 4; i++) WORLD.tick(0.5);
      set(3, true);
      for (let i = 0; i < 6; i++) WORLD.tick(0.5);
      set(3, false);
      WORLD.tick(0.5);
    });
    const b = await pvAt('ABC-028', 'PICDO0005', 60, 120);
    ck(
      a.pv < 0.5 && b.pv > 2,
      `Cold, diesel oil pump stopped / started: oil header at MV 60 % -> ${a.pv.toFixed(1)} / ${b.pv.toFixed(1)} kg/cm2`
    );
  }
  ck(!errs.length, 'no page error' + (errs.length ? ' ' + errs.slice(0, 2).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAIL ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
