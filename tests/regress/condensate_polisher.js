// 3.2.3 (SOHEE): the condensate polisher in the plant model (INSTRUMENT_VALVE_COVERAGE "WALA": MV-CD1007 / MV-CD1008; FT-CD1121
// "BAHAGYA"): inlet MOV MV-CD1007 (DITL-64), outlet MOV MV-CD1008 (DITL-65) and the bypass FCV-CD1121 (ABC-032 FICCD1121).
//   - 150 MW (28.png): both MOVs 0.0 %, FCV-CD1121 100.6 % M, FIQCD1121 0.0 T/H, condensate FIQCD1120 380 T/H;
//   - polisher in service (both MOVs open, bypass shut): the condensate goes through the polisher, FT-CD1121 = FT-CD1120;
//   - polisher and bypass both shut: no condensate to the deaerator.
// Usage: node tests/regress/condensate_polisher.js [html]
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
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async () => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    const r1 = x => Math.round(x * 10) / 10;
    let hold = null,
      byp = null;
    const run = async sec => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        if (hold) hold();
        if (byp != null) {
          const S2 = T('ABC-032'),
            c = ctl('ABC-032', 'FICCD1121');
          S2.rt.ext[c.manNet] = S2.rt.v[c.manNet] = byp;
        }
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
      st.hold = st.y = x; /* the MV of the PID's A / M switch in MANUAL (hmi-op.js) */
      if (c.manBlk && S2.rt.st[c.manBlk.id]) S2.rt.st[c.manBlk.id].val = x;
      else S2.rt.ext[c.manNet] = x;
      S2.rt.v[c.manNet] = x; /* the manual leg of the switch, as the faceplate writes it */
      byp = x;
      for (const [S3, n] of AN.modeNets(t)) S3.rt.ext[n] = 1;
    };
    const pv = (k, t) => {
      const S2 = T(k),
        b = S2.procs.find(z => (z.txt || [])[1] === t);
      return b ? r1(+S2.rt.v[b.proc.pv]) : null;
    };
    const mv = (k, t) => r1(+T(k).rt.v[ctl(k, t).out]);
    const U = () => AN.unit;
    const mov = n => S.sheets.find(x => new RegExp('\\)' + n + '$').test(x.name));
    const st = () => ({
      i: Math.round(AN.ditlPos('DITL-64', 0)),
      o: Math.round(AN.ditlPos('DITL-65', 0)),
      byp: mv('ABC-032', 'FICCD1121'),
      polS: r1(U().polS),
      polP: r1(U().polP),
      q1120: pv('ABC-032', 'FICCD1120'),
      q1121: pv('ABC-032', 'FICCD1121'),
      da: r1(AN_CYC.flows('t').fda)
    });
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(300);
    o.l150 = st();
    /* the polisher in service: both MOVs open, the bypass shut by hand */
    const a = mov('DITL-64'), b = mov('DITL-65');
    hold = () => {
      MST[a.name][0].pos = 100;
      MST[b.name][0].pos = 100;
    };
    man('ABC-032', 'FICCD1121', 0);
    await run(180);
    o.inSvc = st();
    /* half the bypass open again: the flow is shared */
    man('ABC-032', 'FICCD1121', 100);
    await run(120);
    o.both = st();
    /* polisher MOVs shut, bypass shut */
    hold = () => {
      MST[a.name][0].pos = 0;
      MST[b.name][0].pos = 0;
    };
    man('ABC-032', 'FICCD1121', 0);
    await run(300);
    o.shut = st();
    /* bypass open again */
    man('ABC-032', 'FICCD1121', 100);
    await run(180);
    o.back = st();
    hold = null;
    return o;
  });
  console.log(JSON.stringify(r));
  const { l150, inSvc, both, shut, back } = r;
  ck(l150.i === 0 && l150.o === 0 && l150.byp > 99 && l150.q1121 < 1 && Math.abs(l150.q1120 - 380) < 20, `150 MW: polisher MOVs ${l150.i} / ${l150.o} %, bypass ${l150.byp} %, FIQCD1121 ${l150.q1121} T/H (28.png 0.0), FIQCD1120 ${l150.q1120} T/H (28.png 380)`);
  /* FT-CD1121 range 0 ~ 200 T/H (I/O list STN102 AI0436): above it the transmitter reads its top */
  ck(inSvc.polS === 1 && inSvc.q1120 > 300 && Math.abs(inSvc.q1121 - Math.min(200, inSvc.q1120)) < 5, `polisher in service, bypass shut: FIQCD1121 ${inSvc.q1121} T/H (all of FIQCD1120 ${inSvc.q1120}, transmitter top 200)`);
  ck(both.polS > 0 && both.polS < 1 && both.q1121 > 0 && both.q1121 < both.q1120, `polisher and bypass both open: FIQCD1121 ${both.q1121} of ${both.q1120} T/H`);
  ck(shut.polP === 0 && shut.da === 0 && shut.q1121 < 1 && shut.q1120 < 10, `polisher and bypass shut: no condensate to the deaerator (${shut.da} T/H), FIQCD1120 ${shut.q1120}, FIQCD1121 ${shut.q1121}`);
  ck(back.polP === 1 && back.polS === 0 && back.da > 100 && back.q1121 < 1, `bypass open again: condensate ${back.da} T/H to the deaerator, polisher 0`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
