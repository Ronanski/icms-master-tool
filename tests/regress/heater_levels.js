// 3.2.1 (IRENE: HEATER LEVELS, unit.js AN_HD; docs/versions/v3.2.1/HEATER_LEVELS_PLANT_MODEL.md). The one world ON, plant model ON.
//  150 MW: the five heater levels (ABC-035 ~ 039, LT-HD110x) stay at their set points in AUTO, each drain passes what comes in
//    (FHI design condensate), no level switch H.H.;
//  No.2 HPH drain valves LCV-HD1106-1 / -2 MANUAL 0 %: the level rises to the H.H. 150 mm -> ABC-036 M.0203 -> DITL-94 closes the
//    extraction MOV MV-TS1001 -> no steam into the heater (the economizer inlet temperature falls), the level switch LS-HD1106
//    (DITL-41 row 18) is ON;
//  No.3 LPH primary MANUAL 0 % (LICHD11031.MAN): the alternate station goes MANUAL with it (ABC-039); the operator opens the
//    alternate by hand and the level comes back below the H.H.
// Usage: node tests/regress/heater_levels.js [html]
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
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    const sh = n => S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(n));
    const U = () => AN.unit;
    const T = k => AN.sheets.find(s => s.name === k).S;
    const ctl = (k, t) => AN.hmiCtrls(T(k)).find(c => c.tag === t);
    const mv = (k, t) => Math.round(+T(k).rt.v[ctl(k, t).out] * 10) / 10;
    const pk = (k, t) => T(k).rt.st[ctl(k, t).amt.id].pk;
    const man = (k, t, x) => {
      const c = ctl(k, t),
        S2 = T(k),
        st = S2.rt.st[c.amt.id];
      st.al = c.autoLeg;
      st.fm = c.autoLeg === 'A' ? 'B' : 'A';
      if (c.manBlk && S2.rt.st[c.manBlk.id]) S2.rt.st[c.manBlk.id].val = x;
      else S2.rt.ext[c.manNet] = x;
      /* the MANUAL mode address of the station (.MAN), as the faceplate M button: ABC-039 hands the alternate valve to its own
         controller when the primary is MANUAL (LICHD11031.MAN), else the alternate follows the primary MV by LN39 */
      for (const [S3, n] of AN.modeNets(t)) S3.rt.ext[n] = 1;
    };
    const bit = (k, l) => {
      const S2 = T(k),
        n = S2.lab.findIndex(x => x && String(x.t).trim() === l);
      return n < 0 ? NaN : +S2.rt.v[n];
    };
    const lv = () => Object.assign({}, U().hdLvl);
    const fl = () => Object.fromEntries(U().hd.map(h => [h.k, [Math.round(h.win * 10) / 10, Math.round((h.w1 + h.w2) * 10) / 10]]));
    const row = (n, i) => {
      const s = sh(n);
      try {
        return DUI.rowVal ? DUI.rowVal(s, i) : null;
      } catch (e) {
        return null;
      }
    };
    const ls = () => {
      const s = sh('DITL-41');
      const v = [];
      for (const i of [14, 17, 20, 23, 26]) v.push(typeof dRead === 'function' ? dRead(s, i) : WORLD.dget ? WORLD.dget('DITL-41', i) : null);
      return v;
    };
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(900);
    o.l150 = lv();
    o.f150 = fl();
    o.mv150 = ['ABC-036|LICHD11061', 'ABC-036|LICHD11062', 'ABC-035|LICHD11051', 'ABC-035|LICHD11052', 'ABC-039|LICHD11031', 'ABC-039|LICHD11032', 'ABC-038|LICHD11021', 'ABC-038|LICHD11022', 'ABC-037|LICHD11011', 'ABC-037|LICHD11012'].map(x => {
      const [k, t] = x.split('|');
      return t + ' ' + pk(k, t) + ' ' + mv(k, t);
    });
    o.hh150 = Object.assign({}, U().hdHH);
    o.m0203a = bit('ABC-036', 'M.0203');
    o.T2a = U().hpT2;
    o.pos94a = U().hpMov[1];
    /* No.2 HPH drains closed by hand */
    man('ABC-036', 'LICHD11061', 0);
    man('ABC-036', 'LICHD11062', 0);
    let hhAt = null,
      lmax = -999;
    for (let i = 0; i < 240; i++) {
      await run(1);
      lmax = Math.max(lmax, U().hdLvl.H6);
      if (hhAt == null && bit('ABC-036', 'M.0203') > 0.5) hhAt = i + 1;
    }
    o.hhAt = hhAt;
    o.lmax = lmax;
    o.pos94b = U().hpMov[1];
    o.T2b = U().hpT2;
    o.ls6 = U().hdHH.H6;
    o.f6 = fl().H6;
    /* No.3 LPH primary MANUAL 0 %: by the drawing (ABC-039) the alternate station goes MANUAL with it (LICHD11031.MAN -> A/M) and
       holds; the operator opens the alternate by hand and the level comes back */
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(120);
    man('ABC-039', 'LICHD11031', 0);
    await run(60);
    o.l3a = U().hdLvl.H3;
    o.pk3alt = pk('ABC-039', 'LICHD11032');
    man('ABC-039', 'LICHD11032', 60);
    let l3max = -999;
    for (let i = 0; i < 300; i++) {
      await run(1);
      l3max = Math.max(l3max, U().hdLvl.H3);
    }
    o.l3max = l3max;
    o.l3end = U().hdLvl.H3;
    return o;
  });
  console.log(JSON.stringify(r));
  const L = r.l150,
    F = r.f150;
  ck(['H6', 'H5', 'H3', 'H2', 'H1'].every(k => Math.abs(L[k]) < 30), '150 MW: the five heater levels within 30 mm of the normal level ' + JSON.stringify(L));
  ck(Object.keys(F).every(k => Math.abs(F[k][1] - F[k][0]) < 0.1 * F[k][0] + 0.5) && F.H3[0] > 13 && F.H6[0] > 40, '150 MW: each drain passes what comes in (in / out T/H; No.3 LPH 15.2, No.2 HPH 45.1 design) ' + JSON.stringify(F));
  ck(Object.values(r.hh150).every(x => x === 0) && r.m0203a === 0, '150 MW: no level H.H. (M.0203 ' + r.m0203a + ')');
  ck(r.hhAt != null && r.hhAt < 200, 'No.2 HPH drains closed: level H.H. ABC-036 M.0203 after ' + r.hhAt + ' s (max ' + r.lmax + ' mm)');
  ck(r.pos94a > 90 && r.pos94b != null && r.pos94b < 10, 'DITL-94 MV-TS1001 closes on M.0203: ' + r.pos94a + ' -> ' + r.pos94b + ' %');
  ck(r.T2b < r.T2a - 20, 'no extraction into the No.2 HPH: its outlet ' + r.T2a + ' -> ' + r.T2b + ' C');
  ck(r.ls6 === 1, 'level switch LS-HD1106 H.H. ON (DITL-41 row 18)');
  ck(r.l3a > r.l150.H3 + 20 && r.pk3alt === 'B', 'No.3 LPH primary MANUAL 0 %: the level rises (' + r.l3a + ' mm after 60 s), the alternate station is MANUAL too (' + r.pk3alt + ', ABC-039 A/M = LICHD11031.MAN)');
  ck(r.l3max < 140 && r.l3end < r.l3a, 'operator opens the alternate 60 %: level max ' + r.l3max + ', end ' + r.l3end + ' mm (below the H.H. 140)');
  if (errs.length) console.log('page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
