// 3.2.1 (IRENE: PLANT MODEL, TURBINE OIL: the lube oil cooler on the closed cooling water; unit.js AN_LO / anLubeCoolStep;
// docs/versions/v3.2.1/TURBINE_OIL_PLANT_MODEL.md). The one world ON, plant model ON. Checks:
//  150 MW: TE-LO1002 (TICLO1002 PV) at 46 C (36.PNG), TILO1001 62 C, TCV-CW1201 near 53 % (27.PNG), the logic reads the model value;
//  chain test: all SWBP tripped (DITL-30 row 3) -> no seawater to the CCWHE -> ACW supply hot -> TCV-CW1201 opens -> lube oil and
//  bearing outlets hot.
// Usage: node tests/regress/lube_oil.js [html]
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
    const set = (n, row, v) => {
      WORLD.live = true;
      const ok = WORLD.dset(n, row, v);
      WORLD.live = false;
      return ok;
    };
    const f = x => Math.round(x * 100) / 100;
    const U = () => AN.unit;
    const s53 = AN.sheets.find(s => s.name === 'ABC-053');
    const pv = () => {
      /* the AI blocks of TE-LO1002-1 / -2 on ABC-053 (STN102 AI0452 / AI0516): the PV of TICLO1002 */
      const L = (U().lo || []).map(l => l[0]).filter(Boolean);
      return { pv: L.length ? f(+L[0][0].rt.st[L[0][1].id].val) : NaN, n: L.length, sheet: L.length ? L[0][0] === s53.S : false };
    };
    const snap = () => ({ out: f(U().loCoolOut), tin: f(U().loTin), tb3: f(U().loTb3), mv: U().loMv ? f(+U().loMv.S.rt.v[U().loMv.n]) : null, cw: U().loCwF, sup: f(U().acT2), ctl: pv() });
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(120);
    o.d = snap();
    for (const n of ['DITL-30', 'DITL-30 #B', 'DITL-30 #C']) set(n, 2, true);
    await run(600);
    o.t10 = snap();
    await run(900);
    o.t25 = snap();
    return o;
  });
  console.log(JSON.stringify(r));
  const d = r.d;
  ck(Math.abs(d.out - 46) < 1 && Math.abs(d.tin - 62) < 1.5, `150 MW: lube oil cooler outlet TE-LO1002 ${d.out} C (36.PNG 46), inlet TILO1001 ${d.tin} (62)`);
  ck(d.mv > 40 && d.mv < 70, `150 MW: TCV-CW1201 ${d.mv} % (27.PNG 53.1), cooling water ${d.cw} T/H, ACW supply ${d.sup} C`);
  ck(d.ctl && d.ctl.n === 2 && d.ctl.sheet && Math.abs(d.ctl.pv - d.out) < 0.2, `the logic (ABC-053 TE-LO1002-1 / -2, the PV of TICLO1002) reads the model: ${d.ctl && d.ctl.pv}`);
  ck(r.t10.sup > d.sup + 5 && r.t10.mv > d.mv + 10, `all SWBP tripped 10 min: ACW supply ${r.t10.sup} C, TCV-CW1201 opens to ${r.t10.mv} %`);
  ck(r.t25.out > d.out + 3 && r.t25.tb3 > d.tb3 + 3, `25 min: lube oil ${r.t25.out} C (was ${d.out}), bearing No.3 outlet ${r.t25.tb3} C (was ${d.tb3}), TCV-CW1201 ${r.t25.mv} %`);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
