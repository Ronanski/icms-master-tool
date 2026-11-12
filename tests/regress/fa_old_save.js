// 3.2.3 (SOHEE, Mina F151-1 / 2 / 3): the FA blowers after beta.150 (surge SOV XV-FA1055-A2 / B2 read by the plant model).
//   F151-1: a save point made before beta.154 (no version: every save before had none) with a running blower whose surge valve was left
//           open (opened at the FAB step of the Training, the old model ignored it) loads with no FA flow. On load such a blower is put
//           on the PR-OPE-5002 FAB START-UP line-up: surge valve CLOSE and outlet OPEN pressed (ditl150.js faLineup). A save with a
//           version is loaded as saved (an operator's own surge valve open stays open);
//   F151-2: after a swap (blower B alone) the FAB step of the Training names FICFA1055B (B's damper), not FICFA1055A;
//   F151-3: the Air and flue gas page has the inlet damper faceplates FICFA1055A / B and blower B's current IT-F1055B.
// Usage: node tests/regress/fa_old_save.js [html]
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
    const sh = n => S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(n));
    const U = () => AN.unit;
    const st = () => {
      const a = sh(')DITL-28C');
      return { fa: r1(U().fnFaQ), P: r1(U().fnFaP[0]), runA: AN.ditlRun('DITL-28A'), runB: AN.ditlRun('DITL-28A #B'), silA: DUI.outVal(a, 1), outA: DUI.outVal(a, 25), Ib: r1(U().fnIb) };
    };
    const run = async sec => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    const evs = () => (window.lsEvents || []).filter(e => /older version/.test(e.text || '')).length;
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    AN.startState = 'plantLoad150';
    await run(60);
    o.l150 = st();
    /* the state of an old save: blower A running with its surge valve open (OPEN P.B., A in MANUAL at 150 MW), caught at once */
    WORLD.dpress('DITL-28C', 0);
    await run(2);
    o.cut = st();
    const sv = { kf: AN.engState.capture(), kd: ditlCapture() };
    /* loaded as an old save (no version) */
    const e0 = evs();
    DITL150.savePut({ kf: sv.kf, kd: sv.kd, ver: '' });
    await run(60);
    o.old = st();
    o.oldEv = evs() - e0;
    /* the same state with a version: as saved, the surge valve stays open and the FA flow falls */
    const e1 = evs();
    DITL150.savePut({ kf: sv.kf, kd: sv.kd, ver: '3.2.3-beta.154' });
    await run(10);
    o.cur = st();
    o.curEv = evs() - e1;
    /* the swap: the low-low started B; A stopped by hand: the FAB step names B's damper */
    await run(30);
    if (window.LS_DOCK && LS_DOCK.dmotor) LS_DOCK.dmotor('M.3308', false);
    else WORLD.dpress('DITL-28A', 1);
    await run(30);
    o.swap = st();
    const stp = LS_GUIDE.steps().find(x => /^Start the fluidizing air blower/.test(x.t));
    o.fps = stp ? stp.fps.join(',') : 'no step';
    o.btn = stp ? stp.a.map(b => b.l).join(' | ') : '';
    /* the Air and flue gas page: the damper faceplates and B's current */
    const m = (window.LS_MOCK && LS_MOCK.defs.find(d => d.id === 'MK09')) || null;
    o.page = m ? { mach: Object.keys(m.mach || {}).join(','), ib: (m.unit || {})['IT-F1055B'] || '', art: /data-ctl="FICFA1055B\|mv/.test(m.art || '') } : null;
    return o;
  });
  console.log(JSON.stringify(r));
  const { l150, cut, old, cur, swap } = r;
  ck(l150.runA === 1 && l150.silA === 0 && Math.abs(l150.fa - 26.3) < 3, `150 MW: blower A runs, surge valve shut, FA ${l150.fa} T/H (9.png 26.3)`);
  ck(cut.runA === 1 && cut.silA === 1, `the old save state: A running with its surge valve open`);
  /* the state was caught while the flow was already falling (21.8 T/H): the low-low (< 20 T/H, ABC-006 M.3114) may start B by its standby
     AUTO before A's surge valve shuts; both blowers then feed the header. A save made at rest (the b142 save of Mina) keeps 25.6 T/H on A */
  ck(old.runA === 1 && old.silA === 0 && old.outA === 1 && old.fa > 20 && r.oldEv === 1, `old save (no version) loaded: A's surge valve closed, outlet open, FA ${old.fa} T/H (blower B ${old.runB ? 'started by the low-low' : 'standby'}), header ${old.P} mmH2O, one Event log line (${r.oldEv})`);
  ck(cur.silA === 1 && cur.fa < 20 && r.curEv === 0, `a save with a version loads as saved: surge valve open, FA ${cur.fa} T/H, no line`);
  ck(swap.runB === 1 && swap.runA === 0 && r.fps === 'FICFA1055B' && /FICFA1055B M 41/.test(r.btn), `after the swap (B alone, ${swap.Ib} A) the FAB step names FICFA1055B: ${r.fps} · ${r.btn}`);
  ck(r.page && /FCA/.test(r.page.mach) && /FCB/.test(r.page.mach) && r.page.ib === 'fnIb' && r.page.art, `Air and flue gas page: damper faceplates FICFA1055A / B and IT-F1055B (${JSON.stringify(r.page)})`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
