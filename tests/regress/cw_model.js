// 3.2.1 (IRENE: CW plant model, unit.js AN_SW): the seawater system from the vendor data (pump curves, debris filters, condenser).
// Checks (plant model ON, ABC world): 150 MW = the design point (PG-SW1501 2.2 ~ 2.4, condenser inlet 1.0 ~ 1.1, drop 0.4, S-1502 DP
// 500 mmH2O, SWP current from the motor table); condenser outlet valve 40 -> 22 % = inlet pressure up, flow down; one SWP from Cold
// with its discharge valve cracked 10 %: 500 A while the soft starter ramps, then near shut-off (high PG, low flow); valve 100 % = flow
// up, pressure down; all SWP stopped = no flow, no current. Usage: node tests/regress/cw_model.js [html]
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
  await page.evaluate(() => {
    window.__setx = (l, x) => {
      for (const s of AN.sheets) {
        const T = s.S;
        if (!T || !T.ext || /ABC-000/.test(s.name)) continue;
        for (const e of T.ext) {
          const t = T.lab[e] && String(T.lab[e].t).trim();
          if ((t === l || (t && t.replace(/^S\d\s+/, '') === l)) && T.rt.force[e] === undefined) T.rt.ext[e] = x;
        }
      }
    };
    window.__run = async sec => {
      const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
      for (let i = 0; i < sec; i++) {
        AN.stepSet(C1, 1);
        if (i % 200 === 199) await new Promise(r => setTimeout(r, 0));
      }
    };
    window.__u = () => {
      const U = AN.unit, f = x => Math.round(x * 1000) / 1000;
      return { n: U.swN, q: [0, 1, 2].map(i => U['swQa' + i]), pd: [0, 1, 2].map(i => f(U['swPd' + i])), I: [0, 1, 2].map(i => f(U['swIa' + i])), pi: [f(U.swPiA), f(U.swPiB)], po: [f(U.swPoA), f(U.swPoB)], qc: U.swQc, qt: U.swQt, dp1: f(U.swDp1), to: [f(U.swToA), f(U.swToB)], low: U.swLow.slice() };
    };
  });
  const r = await page.evaluate(async () => {
    const o = {};
    AN.reset();
    AN.plantLoad150();
    await __run(60);
    o.d = __u();
    AN.swValve('V-SW1009', 22);
    AN.swValve('V-SW1010', 22);
    await __run(30);
    o.o22 = __u();
    AN.swValve('V-SW1009', 40);
    AN.swValve('V-SW1010', 40);
    __setx('M.3353', 0);
    __setx('M.3354', 0);
    __setx('M.3355', 0);
    await __run(30);
    o.off = __u();
    AN.swValve('V-SW1004', 10);
    __setx('M.3354', 1);
    await __run(3);
    o.ramp = __u();
    await __run(60);
    o.crack = __u();
    AN.swValve('V-SW1004', 100);
    await __run(30);
    o.open = __u();
    return o;
  });
  const d = r.d, run = d.q.map(q => q > 0);
  console.log(JSON.stringify(r));
  ck(d.n >= 1 && d.pd.every((p, i) => !run[i] || (p >= 2.2 && p <= 2.8)), '150 MW: ' + d.n + ' SWP, flow ' + d.q.join(' / ') + ' m3/h, PG-SW1501 ' + d.pd.join(' / ') + ' kg/cm2 (SOP 2.2 ~ 2.8)');
  ck(d.pi.every(p => p >= 0.9 && p <= 1.3) && d.pi.every((p, j) => Math.abs(p - d.po[j] - 0.4) < 0.15), 'condenser in ' + d.pi.join(' / ') + ', out ' + d.po.join(' / ') + ' kg/cm2 (SOP in 1.0 ~ 1.1, drop 0.4)');
  ck(d.I.every((I, i) => !run[i] || (I > 160 && I < 260)), 'SWP current ' + d.I.join(' / ') + ' A (TECO table, load from the EBARA shaft power)');
  ck(d.dp1 > 300 && d.dp1 < 800, 'S-1502 DP ' + d.dp1 + ' mmH2O (clean 500 at 37,800 m3/h)');
  ck(d.to.every(t => t > 30 && t < 40), 'condenser seawater out ' + d.to.join(' / ') + ' C (design 30 -> 35.6)');
  ck(r.o22.pi[0] > d.pi[0] + 0.2 && r.o22.qc < d.qc, 'outlet valves 40 -> 22 %: inlet ' + d.pi[0] + ' -> ' + r.o22.pi[0] + ' kg/cm2, condenser flow ' + d.qc + ' -> ' + r.o22.qc);
  ck(r.off.qt === 0 && r.off.I.every(I => I < 1) && r.off.pi.every(p => p < 0.05), 'all SWP stopped: flow ' + r.off.qt + ', current ' + r.off.I.join(' / ') + ', inlet ' + r.off.pi.join(' / '));
  ck(Math.abs(r.ramp.I[1] - 500) < 30, 'SWP B start: ' + r.ramp.I[1] + ' A while the soft starter ramps (SOP starting 500 A)');
  ck(r.crack.pd[1] > 3.3 && r.crack.q[1] < 5000 && r.crack.low[1] > 0, 'discharge valve 10 %: PG ' + r.crack.pd[1] + ' kg/cm2, flow ' + r.crack.q[1] + ' m3/h (< min 5,000; shut-off time ' + Math.round(r.crack.low[1]) + ' s)');
  ck(r.open.q[1] > 15000 && r.open.pd[1] < r.crack.pd[1], 'discharge valve 100 %: flow ' + r.open.q[1] + ' m3/h, PG ' + r.open.pd[1] + ' kg/cm2');
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
