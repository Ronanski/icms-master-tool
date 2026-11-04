// 3.2.1 (IRENE: PLANT MODEL, the useful manual valves; unit.js AN_FV0 / anFv; docs/versions/v3.2.1/FIELD_VALVES.md).
// The one world ON (ABC + DITL), plant model ON, Start at 150 MW. The field operator turns a valve (AN.swValve(tag, %)):
//  closed cooling: CCWHE A and B outlets closed one by one (flow falls, then the loop is blocked: no flow, shut-off pressure);
//    ACWP-A discharge at 5 % (SOP start position: the flow falls);
//  make-up: the discharge valves of the running MWP closed (the header falls to its static pressure, the logic sees PT-MU0709 low);
//  instrument air: unit 1 header V-IA1101 closed (PT-IA1706 falls, PSL-IA1706 LOW);
//  cross-tie V-PA0013 open with all IA compressors tripped: the plant air holds the instrument air tanks (no MFT).
// Usage: node tests/regress/field_valves.js [html]
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
    const cw = () => ({ Q: U().acQ, P1: f(U().acP1), n: U().acHxN, I: f(U().acI0), N: U().acN, qA: Math.round((U()._acR || { q: [0] }).q[0]) });
    const mu = () => ({ P: f(U().muP), feed: U().muFeed, N: U().muN, d112: f((sh('DITL-112').avw || {}).r28) });
    const ia = () => ({ P: f(U().iaP), PU: f(U().iaPU), N: U().iaN, xQ: U().xQ, psl: (WORLD.plantSw() || []).filter(x => x.tag === 'PSL-IA1706').map(x => x.on) });
    const V = (t, p) => AN.swValve(t, p);
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(60);
    o.base = { cw: cw(), mu: mu(), ia: ia() };
    V('V-CW1013', 0);
    await run(20);
    o.hx1 = cw();
    V('V-CW1014', 0);
    await run(20);
    o.hx0 = cw();
    V('V-CW1013', 100);
    V('V-CW1014', 100);
    await run(20);
    o.hxBack = cw();
    V('V-CW1007', 5);
    await run(20);
    o.dis5 = cw();
    V('V-CW1007', 100);
    await run(20);
    V('V-MU0007', 0);
    V('V-MU0011', 0);
    await run(30);
    o.muShut = mu();
    V('V-MU0007', 100);
    V('V-MU0011', 100);
    await run(30);
    o.muBack = mu();
    V('V-IA1101', 0);
    await run(90);
    o.iso = ia();
    V('V-IA1101', 100);
    await run(30);
    o.isoBack = ia();
    V('V-PA0013', 100);
    for (const r of [6, 13, 20]) set('DITL-113', r, true);
    await run(300);
    o.xt = ia();
    return o;
  });
  console.log(JSON.stringify(r));
  const b = r.base;
  ck(b.cw.n === 2 && Math.abs(b.cw.Q - 1500) < 30 && Math.abs(b.cw.P1 - 6.4) < 0.1, `150 MW normal line-up: 2 CCWHE in service, ACW flow ${b.cw.Q} m3/h, PT-CW1152 ${b.cw.P1} (27.PNG 6.4)`);
  ck(r.hx1.n === 1 && r.hx1.Q < b.cw.Q && r.hx1.P1 > b.cw.P1, `CCWHE A outlet V-CW1013 closed: 1 CCWHE, flow ${r.hx1.Q}, PT-CW1152 ${r.hx1.P1}`);
  ck(r.hx0.n === 0 && r.hx0.Q === 0 && r.hx0.P1 > r.hx1.P1, `CCWHE A and B outlets closed: no flow (${r.hx0.Q}), PT-CW1152 ${r.hx0.P1} (shut-off)`);
  ck(Math.abs(r.hxBack.Q - b.cw.Q) < 30, `outlets opened again: flow ${r.hxBack.Q}`);
  ck(r.dis5.qA < 0.2 * b.cw.Q, `ACWP-A discharge V-CW1007 at 5 %: ACWP-A flow ${r.dis5.qA} m3/h (loop ${r.dis5.Q}, ${r.dis5.N} ACWP running)`);
  ck(r.muShut.feed === 0 && r.muShut.P < 5.5 && Math.abs(r.muShut.d112 - r.muShut.P) < 0.05, `MWP discharges V-MU0007 / 0011 closed: header PT-MU0709 ${r.muShut.P} kg/cm2 (static), the logic reads ${r.muShut.d112}`);
  ck(r.muBack.P > 8.5, `discharges opened: header ${r.muBack.P} kg/cm2, ${r.muBack.N} MWP running`);
  ck(r.iso.PU < 2.8 && r.iso.psl.includes(true) && r.iso.P > 6.9, `unit 1 header V-IA1101 closed: PT-IA1706 ${r.iso.PU}, PSL-IA1706 ${r.iso.psl}, tanks ${r.iso.P}`);
  ck(r.isoBack.PU > 6.5, `V-IA1101 opened: PT-IA1706 ${r.isoBack.PU}`);
  ck(r.xt.N === 0 && r.xt.P > 5 && r.xt.xQ > 0, `all IA compressors tripped, cross-tie V-PA0013 open: IA tanks ${r.xt.P} kg/cm2 from the plant air (${r.xt.xQ} m3/h)`);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
