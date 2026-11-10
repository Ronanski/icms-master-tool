// 3.2.1 (SEULGI : PLANT MODEL, boiler side: DIESEL OIL SYSTEM, src/analog/engine/boiler.js AN_DO; docs/versions/v3.2.1/
// DIESEL_OIL_PLANT_MODEL.md). The one world ON (ABC + DITL), plant model ON. Checks:
//  150 MW: the snapshot 6.PNG (PIDO0005 12.8, PIDO1008 11.0, DPIDO0001 0.029, LIDO0701 4.978 m, P-0702A 25.4 A), the logic reads the
//    plant (DITL-31 rows 15 / 17 / 28);
//  burner A then all four burners on oil (shut-off valves open, FICDO1043x MAN 100 %): gun pressure <= 5 bar (M&S load curve), the
//    oil reaches the firing (FT-DO1043-x), the ring pressure drops and PICDO1008 / PICDO0005 answer, the tank level falls;
//  pump A trip (DITL-31 row 11 I.0004): the header falls, the standby pump B (AUTO) starts (DITL-31 #B), the header comes back;
//  both pumps tripped: no oil header, no oil to the burners;
//  Cold: no pump, no pressure; pump A started with every valve open (SOP 20) = low header, PCV-DO0002 throttled in MANUAL = the
//    header rises (SOP: 12.5 kg/cm2); the strainer inlet V-DO0004 closed = no flow.
// Usage: node tests/regress/diesel_oil.js [html]
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
    const sh = n => S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(n));
    const set = (n, row, v) => {
      WORLD.live = true;
      const ok = WORLD.dset(n, row, v);
      WORLD.live = false;
      return ok;
    };
    const H = CHECK.H();
    const f = x => Math.round(x * 1000) / 1000;
    const pv = (k, t) => {
      const T = AN.sheets.find(s => s.name === k).S,
        c = AN.hmiCtrls(T).find(q => q.tag === t);
      return f(+T.rt.v[c.q.pv]);
    };
    const U = () => AN.unit;
    const snap = () => ({
      P1: f(U().doP1),
      P2: f(U().doP2),
      Q: f(U().doQ),
      qa: f(U().doQa),
      qf: f(U().doQf),
      rv: f(U().doQrv),
      dp: f(U().doDp),
      lv: f(U().doLv),
      I: U().doI.map(f),
      vo: U().doVo,
      qb: U().doQb.map(f),
      pb: U().doPb.map(f),
      pv: {
        p5: pv('ABC-028', 'PICDO0005'),
        p8: pv('ABC-029', 'PICDO1008'),
        fA: pv('ABC-003A', 'FICDO1043A'),
        pA: pv('ABC-003A', 'PICDO1043A')
      },
      run: [DUI.rowVal(sh('DITL-31'), 1), DUI.rowVal(sh('DITL-31 #B'), 1)],
      oilF: f(U().oilF || 0)
    });
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(30);
    o.s150 = snap();
    o.av = Object.assign({}, sh('DITL-31').avw);
    /* burner A on oil */
    /* the BMS opens the two shut-off valves of the burner (DITL-16 rows 21 / 23 "OPEN BURNER A OIL VALVE (1) / (2)", from DITL-13) */
    const valves = (x, on) => (set('DITL-16' + x, 20, on), set('DITL-16' + x, 22, on));
    valves('', true);
    H.man('ABC-003A', 'FICDO1043A', 100);
    await run(30);
    o.bA = snap();
    o.bA.s150P2 = o.s150.P2;
    for (const x of ['B', 'C', 'D']) {
      valves(' #' + x, true);
      H.man('ABC-003' + x, 'FICDO1043' + x, 100);
    }
    const lv0 = U().doLv;
    await run(600);
    o.b4 = snap();
    o.dLv = f(lv0 - U().doLv);
    /* all burners off again, pump A trip */
    for (const x of ['', ' #B', ' #C', ' #D']) valves(x, false);
    await run(30);
    o.pre = snap();
    set('DITL-31', 10, true); /* row 11 I.0004 DOP A TRIP */
    let lo = 99;
    for (let i = 0; i < 40; i++) {
      await run(0.5);
      lo = Math.min(lo, U().doP1);
    }
    o.lo = f(lo);
    await run(60);
    o.trip = snap();
    set('DITL-31 #B', 10, true); /* pump B trip too */
    valves('', true);
    await run(30);
    o.none = snap();
    /* Cold */
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantCold();
    await run(20);
    o.cold = snap();
    /* 3.2.1 (IRENE, AN_AV): the oil valves have an airlock, they do not move without instrument air; the SOP starts the
       instrument air compressor (Step 10) before the diesel oil (Step 21): local panel RUNNING of compressor A (DITL-113 row 6) */
    set('DITL-113', 5, true);
    await run(120);
    o.iaCold = AN.unit.iaPU;
    /* SOP 20: PCV-DO0002, PCV-DO1009 M 100 %, FCV-DO1012 100 %, then START pump A */
    H.man('ABC-028', 'PICDO0005', 100);
    H.man('ABC-029', 'PICDO1008', 100);
    { /* 3.2.3: the Cold has FCV-DO1012 at 0 (closed); SOP 20 opens it: HICDO1012 is a MAN station (no faceplate controller), as guide.js A.man */
      const T = AN.sheets.find(x => x.name === 'ABC-029').S, b = T.blk.find(z => z.k === 'MAN' && (z.tag === 'HICDO1012' || (z.txt || []).includes('HICDO1012')));
      if (AN.latchMode) AN.latchMode('HICDO1012', 'MAN');
      AN.stVal('ABC-029', b.id, 100, (b.i || []).filter((n, i, L) => n >= 0 && L.indexOf(n) === i && T.ext.includes(n) && !(T.xlk && T.xlk[n]) && (AN.nm(T, n) || '').trim() === 'HICDO1012.MV'));
    }
    set('DITL-31', 21, true); /* row 22 DOP A REMOTE MODE SELECTED (local panel) */
    await run(2);
    set('DITL-31', 3, true); /* row 4 DOP A START P.B. (CRT) */
    await run(3);
    set('DITL-31', 3, false);
    await run(25);
    o.c1 = snap();
    H.man('ABC-028', 'PICDO0005', 20);
    await run(20);
    o.c2 = snap();
    AN.doValve('V-DO0004', 0);
    await run(10);
    o.c3 = snap();
    AN.doValve('V-DO0004', 100);
    return o;
  });
  const s = r.s150;
  ck(
    Math.abs(s.P1 - 12.8) < 0.2 &&
      Math.abs(s.P2 - 11.0) < 0.2 &&
      Math.abs(s.dp - 0.029) < 0.003 &&
      Math.abs(s.lv - 4.978) < 0.01 &&
      Math.abs(s.I[0] - 25.4) < 0.5 &&
      s.I[1] === 0,
    '150 MW = snapshot 6.PNG: ' + JSON.stringify(s)
  );
  ck(
    Math.abs(s.pv.p5 - s.P1) < 0.05 &&
      Math.abs(s.pv.p8 - s.P2) < 0.05 &&
      Math.abs(r.av.r28 - s.P1) < 0.05 &&
      Math.abs(r.av.r15 - s.lv) < 0.01 &&
      Math.abs(r.av.r17 - s.dp) < 0.005,
    'logic reads the plant: PICDO0005 / PICDO1008 PV, DITL-31 rows 15 / 17 / 28 ' + JSON.stringify(r.av)
  );
  /* the BMS holds the oil valve at its IGNITION POSITION (25 %, 6.PNG) until the release: the flow is between MIN 0.614 and MAX
     3.072 T/H, the gun pressure 1 ~ 5 bar (M&S 1612 13-4-71) */
  ck(
    r.bA.qb[0] > 0.6 &&
      r.bA.qb[0] <= 3.11 &&
      r.bA.pb[0] >= 0.98 &&
      r.bA.pb[0] <= 5.15 &&
      Math.abs(r.bA.pv.fA - r.bA.qb[0]) < 0.05 &&
      Math.abs(r.bA.oilF - r.bA.qb[0]) < 0.05 &&
      r.bA.P2 < r.bA.s150P2,
    'burner A on oil: ' + JSON.stringify(r.bA)
  );
  ck(
    r.b4.qb.every(q => q > 0.6) &&
      r.b4.qb.reduce((a, b) => a + b, 0) <= 12.5 &&
      Math.abs(r.dLv - r.b4.qb.reduce((a, b) => a + b, 0) / 0.85 / 23.8 / 6) < 0.005,
    'four burners: flows ' +
      JSON.stringify(r.b4.qb) +
      ' ring ' +
      r.b4.P2 +
      ' header ' +
      r.b4.P1 +
      ', tank -' +
      r.dLv +
      ' m in 10 min'
  );
  ck(
    r.lo < 5 && r.trip.run[1] === 1 && Math.abs(r.trip.P1 - 12.8) < 1.5,
    'pump A trip: header ' +
      r.lo +
      ' kg/cm2 (< 5 = L.L.), standby B started ' +
      JSON.stringify(r.trip.run) +
      ', header back ' +
      r.trip.P1
  );
  ck(
    r.none.P1 < 0.1 && r.none.qb[0] === 0,
    'both pumps tripped: no header, no oil to burner A ' + JSON.stringify(r.none)
  );
  ck(r.cold.P1 < 0.1 && r.cold.Q === 0, 'Cold: no pump, no pressure ' + JSON.stringify(r.cold));
  ck(
    r.c1.Q === 25 && r.c1.P1 > 1 && r.c1.P1 < 3 && r.c2.P1 > 10 && r.c3.Q === 0 && r.c3.P1 < 0.1,
    `Cold, SOP 20: pump A with every valve open ${r.c1.P1} kg/cm2, PCV-DO0002 20 % ${r.c2.P1}, strainer inlet closed ${r.c3.P1}`
  );
  console.log('page errors: ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
