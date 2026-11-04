// 3.2.1 (IRENE: LP HEATERS, unit.js AN_LP; docs/versions/v3.2.1/LP_HEATERS_PLANT_MODEL.md). The one world ON, plant model ON.
//  150 MW: the condensate temperatures through the No.1 / 2 / 3 LP heaters and their drain temperatures are near the FHI design
//    (O&M L15-5 ~ 7 p14: 40 -> 70.8 -> 90.7 -> 114.9 C, drains 76.41 / 96.3 C);
//  No.3 LPH drains MANUAL 0 %: level H.H. -> DITL-97 closes the extraction No.4 MOV -> no steam into the No.3 LPH: its outlet and the
//    deaerator inlet (TT-CD1103-2 / TT-CD1122) fall to its inlet (TT-CD1103-1).
// Usage: node tests/regress/lp_heaters.js [html]
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
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(300);
    const U = AN.unit;
    o.ms = Math.round(U.ms);
    o.hw = Math.round(U.cdT * 10) / 10;
    o.t0 = Object.assign({}, U.tt);
    WORLD.live = true;
    o.pos97a = AN.ditlPos('DITL-97', 0);
    man('ABC-039', 'LICHD11031', 0);
    man('ABC-039', 'LICHD11032', 0);
    const bit = l => {
      const S2 = T('ABC-039'),
        n = S2.lab.findIndex(x => x && String(x.t).trim() === l);
      return n < 0 ? NaN : +S2.rt.v[n];
    };
    o.hhAt = null;
    for (let i = 0; i < 400 && o.hhAt == null; i++) {
      await run(1);
      if (bit('M.0233') === 1) o.hhAt = i + 1;
    }
    await run(600);
    WORLD.live = true;
    o.pos97b = AN.ditlPos('DITL-97', 0);
    o.t1 = Object.assign({}, U.tt);
    return o;
  });
  console.log(JSON.stringify(r));
  const a = r.t0,
    b = r.t1,
    near = (x, y, d) => isFinite(x) && Math.abs(x - y) <= d;
  ck(near(a['TT-CD1101'], 40, 3), `150 MW (main steam ${r.ms} T/H, hotwell ${r.hw} C): No.1 LPH inlet TT-CD1101 ${a['TT-CD1101']} C (design 40)`);
  ck(near(a['TT-CD1102'], 70.8, 4), `No.2 LPH inlet TT-CD1102 ${a['TT-CD1102']} C (design 70.8)`);
  ck(near(a['TT-CD1103-1'], 90.7, 4), `No.3 LPH inlet TT-CD1103-1 ${a['TT-CD1103-1']} C (design 90.7)`);
  ck(near(a['TT-CD1103-2'], 114.9, 4) && a['TT-CD1122'] === a['TT-CD1103-2'], `No.3 LPH outlet TT-CD1103-2 ${a['TT-CD1103-2']} C = deaerator inlet TT-CD1122 ${a['TT-CD1122']} C (design 114.9)`);
  ck(near(a['TT-HD1102'], 76.41, 4) && near(a['TT-HD1103'], 96.3, 4), `LPH drains TT-HD1102 ${a['TT-HD1102']} / TT-HD1103 ${a['TT-HD1103']} C (design 76.41 / 96.3)`);
  ck(isFinite(a['TT-HD1105']) && isFinite(a['TT-HD1106']), `HPH drains TT-HD1105 ${a['TT-HD1105']} / TT-HD1106 ${a['TT-HD1106']} C`);
  ck(r.hhAt != null && r.pos97a > 90 && r.pos97b != null && r.pos97b < 10, `No.3 LPH drains closed: H.H. M.0233 after ${r.hhAt} s, extraction No.4 MOV DITL-97 ${r.pos97a} -> ${r.pos97b} %`);
  ck(b['TT-CD1103-2'] - b['TT-CD1103-1'] < 1.5 && b['TT-CD1122'] < a['TT-CD1122'] - 15, `no steam: No.3 LPH outlet ${b['TT-CD1103-2']} C = inlet ${b['TT-CD1103-1']} C, deaerator inlet ${a['TT-CD1122']} -> ${b['TT-CD1122']} C`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
