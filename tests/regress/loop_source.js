// 3.2.0-beta.14 (plan phase A, user: "since walang steam, dapat walang ma-generate na PV ito kahit anong SV MV mo"): the SOURCE of
// each loop (src/analog/engine/source.js). With the plant model on and a starting state:
//  - Cold: no steam / oil / water / air: the PV stays at 0 (or the ambient) whatever the MV of the loop (MANUAL 0 -> 100 %)
//  - Hot (123 kg/cm2 on the bypass): the sootblower steam pressure answers its MV and is never above the main steam pressure
//  - At 150 MW: the snapshot values stay (no change from before)
//  - Loop study at 60 MW: the boiler is held at that load (MSP about 90 kg/cm2), each loop answers its own MV
//  - Diesel oil pump (field equipment): stopped = no oil header pressure; started = the header answers its MV
// Usage: node tests/regress/loop_source.js [html]
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
  /* the loop in MANUAL at mv (the station output, as the operator's MV), step ABC-001C (unit model) and the loop sheet for sec
     seconds, read the PV */
  const pvAt = (shn, tag, mv, sec) =>
    page.evaluate(
      ([shn, tag, mv, sec]) => {
        const sh = AN.sheets.find(s => s.name === shn),
          S = sh.S,
          c = AN.hmiCtrls(S).find(q => q.tag === tag),
          u = AN.sheets.find(s => s.name === 'ABC-001C');
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
        const pr = c.b.proc;
        return { pv: +S.rt.v[pr.pv], out: +S.rt.v[c.out], msp: AN.unit ? AN.unit.Pms : NaN };
      },
      [shn, tag, mv, sec]
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
  for (const [shn, tag, top] of [
    ['ABC-017', 'PICSB1052', 0.5],
    ['ABC-028', 'PICDO0005', 0.5],
    ['ABC-030', 'PICAS1005', 0.5],
    ['ABC-032', 'FICCD1120', 1],
    ['ABC-053', 'TICLO1002', 31],
    ['ABC-051', 'TICMS1022', 31],
    ['ABC-034', 'TICAS1017', 31]
  ]) {
    const a = await pvAt(shn, tag, 0, 20),
      b = await pvAt(shn, tag, 100, 120);
    ck(a.pv <= top && b.pv <= top && b.out > 50, `Cold ${shn} ${tag}: MV 0 % -> PV ${a.pv.toFixed(1)}, MV ${b.out.toFixed(0)} % -> PV ${b.pv.toFixed(1)} (no medium: <= ${top})`);
  }
  /* 2. Hot */
  await state('plantHot');
  {
    const a = await pvAt('ABC-017', 'PICSB1052', 0, 60),
      b = await pvAt('ABC-017', 'PICSB1052', 40, 120),
      c = await pvAt('ABC-017', 'PICSB1052', 100, 120);
    ck(b.pv > a.pv + 2 && c.pv >= b.pv && c.pv <= c.msp + 0.1, `Hot ABC-017 sootblower: MV 0 / 40 / 100 % -> PV ${a.pv.toFixed(1)} / ${b.pv.toFixed(1)} / ${c.pv.toFixed(1)} kg/cm2, MSP ${c.msp.toFixed(1)} (answers MV, never above MSP)`);
  }
  /* 3. At 150 MW: the snapshot */
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
    ck(Math.abs(r.FICCD1120 - 380) < 5 && Math.abs(r.TICMS1022 - 357.5) < 20 /* 343.5 after a Hot run, as in 3.2.0-beta.13 (lag of the loop) */ && Math.abs(r.PICDO0005 - 12.9) < 0.5 && r.PICAS1005 > 9 && r.TICLO1002 > 40, '150 MW: snapshot values kept ' + JSON.stringify(r));
  }
  /* 4. Loop study at 60 MW */
  await state('plantLoop', 60);
  {
    const a = await pvAt('ABC-017', 'PICSB1052', 0, 60),
      b = await pvAt('ABC-017', 'PICSB1052', 40, 120);
    ck(Math.abs(b.msp - 89.9) < 1.5 && b.pv > a.pv + 2 && b.pv <= b.msp, `Loop study 60 MW: MSP ${b.msp.toFixed(1)} kg/cm2 (02.png 89.9), sootblower MV 0 / 40 % -> PV ${a.pv.toFixed(1)} / ${b.pv.toFixed(1)}`);
  }
  /* 5. Diesel oil pump, field equipment */
  await state('plantCold');
  {
    const a = await pvAt('ABC-028', 'PICDO0005', 60, 60);
    await page.evaluate(() => AN.field('dop', true));
    const b = await pvAt('ABC-028', 'PICDO0005', 60, 120);
    ck(a.pv < 0.5 && b.pv > 2, `Cold, diesel oil pump stopped / started: oil header at MV 60 % -> ${a.pv.toFixed(1)} / ${b.pv.toFixed(1)} kg/cm2`);
  }
  ck(!errs.length, 'no page error' + (errs.length ? ' ' + errs.slice(0, 2).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAIL ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
