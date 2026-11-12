// 3.2.3 (SOHEE): the steam the sootblowers take (unit.js AN_SB; Diamond Power N11639-SC1 "Sootblower steam data", IK4M manual o&m L10-2
// page 93) and the sootblower header from the shut-off MOV MV-SB1001 (source.js PICSB1052; 18.PNG: MV-SB1001 0 %, header 0.4 kg/cm2,
// every lance retracted at 150 MW). Checks:
//   - Cold and "Start at 150 MW": no sootblower blows by itself (no steam taken, every lance retracted), MV-SB1001 shut;
//   - 150 MW with MV-SB1001 shut: PCV-SB1053 opened by hand (MANUAL 60 %) gives no header pressure;
//   - MV-SB1001 held open in the field and PCV-SB1053 at 60 %: the header has steam; one blower is started (its lance is sent out as
//     the EXTEND COMMAND of DITL-80G does: this test does not run the sequence of DITL-80): N-1011 (IK4M above the RH upper) takes
//     1.2 kg/s = 4.32 T/H for about 230 s, 276 kg in one operation (the table); N-1035 (common economizer, IK4M-PT) 0.9 kg/s for
//     about 98 s, 88 kg; the water that leaves the drum (AN_CYC.dl) grows by that steam; nothing after the lance is back.
// Usage: node tests/regress/sootblower_steam.js [html]
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
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150, null, {
    timeout: 120000
  });
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async () => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    const r1 = x => Math.round(x * 100) / 100;
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
    const hdr = () => {
      const S2 = T('ABC-017'),
        b = S2.procs.find(z => (z.txt || [])[1] === 'PICSB1052');
      return +S2.rt.v[b.proc.pv];
    };
    const lances = () => WORLD.sbLances();
    const pos = () => ((WORLD.live = true), AN.ditlPos('DITL-80S', 0));
    const out = () => lances().filter(s => s._lance.x > 0).length;
    const o = {};
    /* 1. Cold */
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantCold();
    await run(300);
    const U = AN.unit;
    o.cold = { msb: U.msb, n: U.sbN, out: out(), mv: pos(), P: r1(hdr()), L: lances().length };
    /* 2. Start at 150 MW */
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(300);
    o.l150 = { msb: U.msb, n: U.sbN, out: out(), mv: pos(), P: r1(hdr()), L: lances().length };
    man('ABC-017', 'PICSB1052', 60);
    await run(120);
    o.shut = { P: r1(hdr()), mv: pos() };
    /* 3. MV-SB1001 held open in the field */
    const v = S.sheets.find(x => /\)DITL-80S$/.test(x.name));
    hold = () => {
      MST[v.name][0].pos = 100;
    };
    await run(120);
    o.open = { P: r1(hdr()), mv: pos(), msb: U.msb };
    const blow = async n => {
      const s = lances().find(x => x._lance.n === n);
      const dl0 = AN.cyc ? AN.cyc.dl : AN_CYC.dl;
      let kg = 0,
        tOn = 0,
        pk = 0,
        dlPk = 0;
      s._lance.dir = 1;
      await run(270, () => {
        kg += (U.msb / 3.6) * 0.5;
        if (U.msb > 0) tOn += 0.5;
        if (U.msb > pk) {
          pk = U.msb;
          dlPk = AN_CYC.dl - dl0;
        }
      });
      return { n, kg: r1(kg), tOn, pk: r1(pk), dl: r1(dlPk), back: s._lance.x, after: U.msb, P: r1(hdr()) };
    };
    o.b1011 = await blow(1011);
    o.b1035 = await blow(1035);
    hold = null;
    return o;
  });
  console.log(JSON.stringify(r));
  for (const k of ['cold', 'l150']) {
    const x = r[k];
    ck(x.L === 28 && x.msb === 0 && x.n === 0 && x.out === 0, `${k}: no sootblower blows (${x.out} lances out of 28, steam ${x.msb} T/H)`);
    ck(x.mv === 0 && x.P < 0.5, `${k}: MV-SB1001 ${x.mv} %, header ${x.P} kg/cm2`);
  }
  ck(r.shut.mv === 0 && r.shut.P < 0.5, `150 MW, MV-SB1001 shut, PCV-SB1053 at 60 %: header ${r.shut.P} kg/cm2 (no steam)`);
  ck(r.open.mv === 100 && r.open.P > 12.9 && r.open.msb === 0, `MV-SB1001 open: header ${r.open.P} kg/cm2, no blower yet (${r.open.msb} T/H)`);
  const b = r.b1011;
  ck(Math.abs(b.pk - 4.32) < 0.01, `N-1011 blows 1.2 kg/s: ${b.pk} T/H`);
  ck(Math.abs(b.tOn - 230) <= 2 && Math.abs(b.kg - 276) < 6, `N-1011 one operation: ${b.tOn} s, ${b.kg} kg (table 230 s, 276 kg)`);
  ck(Math.abs(b.dl - b.pk) < 1, `N-1011: the water leaving the drum grows by ${b.dl} T/H (steam ${b.pk})`);
  ck(b.back === 0 && b.after === 0, `N-1011 back on its retract limit, steam ${b.after}`);
  const c = r.b1035;
  ck(Math.abs(c.pk - 3.24) < 0.01 && Math.abs(c.tOn - 98) <= 2 && Math.abs(c.kg - 88) < 3, `N-1035 0.9 kg/s: ${c.pk} T/H, ${c.tOn} s, ${c.kg} kg (table 98 s, 88 kg)`);
  ck(c.back === 0 && c.after === 0, `N-1035 back, steam ${c.after}`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
