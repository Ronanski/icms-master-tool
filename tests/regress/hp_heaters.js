// 3.2.1 (IRENE: PLANT MODEL, HP HEATERS; unit.js AN_HP / anHphStep; docs/versions/v3.2.1/HP_HEATERS_PLANT_MODEL.md).
// The one world ON (ABC + DITL), plant model ON, Start at 150 MW:
//  base: No.1 / No.2 HPH outlet (03.png TIFW1105 198 / TIFW1106 243 C), economizer inlet TT-FW1160 (ABC-010 AI0592, 03.png 244) = the
//  No.2 outlet, the drains (FHI heater O&M p14: No.2 45.1 t/h, both to the deaerator 69.35 t/h);
//  chain: the operator CLOSES the extraction no. 1 shut-off MOV MV-TS1001 (DITL-94 CLOSE P.B.): the No.2 HPH loses its steam, the
//  feedwater to the economizer falls to the No.1 outlet.
// Usage: node tests/regress/hp_heaters.js [html]
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
        WORLD.live = true; /* the world as in the app (the DITL MOV positions are read by the plant model only while it is live) */
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    const U = () => AN.unit;
    const ai = (sh, adr) => {
      const S2 = AN.sheets.find(x => x.name === sh).S;
      const b = S2.blk.find(z => z.k === 'AI' && z.o && (AN.nm(S2, z.o[0]) || '').trim() === adr);
      const st = b && S2.rt.st[b.id];
      return st && isFinite(st.val) ? Math.round(st.val * 10) / 10 : null;
    };
    const g = () => ({ T1: U().hpT1, T2: U().hpT2, F1: U().hpF1, F2: U().hpF2, D1: U().hpD1, D2: U().hpD2, fw60: ai('ABC-010', 'AI0592') });
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(300);
    o.base = g();
    WORLD.live = true;
    /* 4.PNG: the MOV is AUTO (A R); the operator selects MANUAL first (row 1 M.0283 AUTO = 0, row 6 MANUAL MODE SELECTED), then
       presses CLOSE (3.2.1 heater levels: the start state of 150 MW sets the AUTO of 4.PNG) */
    WORLD.dset('DITL-94', 0, false);
    await run(2);
    o.pr = WORLD.dpress('DITL-94', 13); /* M.0281 EXTRACTION STM NO.1 SHUT-OFF MOV CLOSE PB */
    await run(600);
    o.cl = g();
    WORLD.live = false;
    return o;
  });
  console.log(JSON.stringify(r));
  const b = r.base,
    c = r.cl;
  ck(Math.abs(b.T1 - 198) < 4 && Math.abs(b.T2 - 243) < 6, `150 MW: No.1 HPH outlet ${b.T1} C (03.png 198, design 195.7), No.2 HPH outlet ${b.T2} C (03.png 243, design 245.4)`);
  ck(b.fw60 != null && Math.abs(b.fw60 - b.T2) < 0.6, `economizer inlet TT-FW1160 (ABC-010) ${b.fw60} C = No.2 outlet (03.png 244)`);
  ck(Math.abs(b.F2 - 45.1) < 6 && Math.abs(b.F1 - 69.35) < 9, `drains: No.2 ${b.F2} t/h (design 45.1), No.1 to the deaerator ${b.F1} t/h (design 69.35); drain temp ${b.D2} / ${b.D1} C (design 201.3 / 166.3)`);
  ck(r.pr && c.T2 - c.T1 < 2 && c.F2 < 1 && c.fw60 < b.fw60 - 30, `MV-TS1001 closed by the operator: No.2 HPH no steam, outlet ${c.T2} C = No.1 outlet ${c.T1}, economizer inlet ${c.fw60} C, No.2 drain ${c.F2} t/h`);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
