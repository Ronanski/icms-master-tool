// 3.2.1 (IRENE: INSTRUMENT AND PLANT AIR plant model, unit.js AN_AIR / anAirStep; docs/versions/v3.2.1/AIR_PLANT_MODEL.md).
// The one world ON (ABC + DITL), plant model ON. Checks:
//  150 MW: one IA and one PA compressor run (PR-OPE-5002 "at least one IA compressor and one PA compressor are running"), the tanks at
//    7.0 kg/cm2 (39.PNG, SOP), the currents from the motor data, the logic reads the plant (DITL-113 / 114 rows 1 ~ 3);
//  IA compressor A trip (DITL-113 row 7 I.0016): the tanks fall, < 5.0 kg/cm2 for 3 s = M.0300, the START COMMAND of compressor B,
//    the model runs it (its RUNNING contact I.0095 back to the logic) and the tanks come back to 7.0;
//  the same for the plant air (DITL-114, M.0310);
//  all IA compressors tripped: the instrument air header falls below 3.5 (alarm list LL, DITL-03G MFT 2 of 3) and below 2.8 (PSL-IA1706);
//  Cold: no compressor, the tanks empty.
// Usage: node tests/regress/air_model.js [html]
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
    const out = (n, row) => DUI.outVal(sh(n), row);
    const set = (n, row, v) => {
      WORLD.live = true;
      const ok = WORLD.dset(n, row, v);
      WORLD.live = false;
      return ok;
    };
    const f = x => Math.round(x * 1000) / 1000;
    const g03 = sh('DITL-03G');
    /* 3.2.3-beta.183: the output row 27 "INSTRUMENT AIR PRESS. NOT LOW" (PSL-IA1706-NC, to DITL-37 row 22) is the normally closed contact:
       0 when the pressure is low. It was counted with the L.L. rows and read 1 only because its 150 MW field bit was never cleared */
    const outsIA = (DUI.outs(g03) || []).filter(q => /INST.*AIR|AIR.*PRESS/i.test(q.name)),
      mft = outsIA.filter(q => !/\bNOT\b/i.test(q.name)).map(q => q.row),
      ncR = outsIA.filter(q => /\bNOT\b/i.test(q.name)).map(q => q.row);
    const snap = k => {
      const U = AN.unit,
        c = k === 'ia' ? 'DITL-113' : 'DITL-114',
        av = sh(c).avw || {};
      return {
        R: [0, 1, 2].map(i => U[k + 'R' + i]), I: [0, 1, 2].map(i => f(U[k + 'I' + i])), P: f(U[k + 'P']), PU: f(U[k + 'PU']), Q: f(U[k + 'Q']),
        F: [0, 1, 2].map(i => f(U[k + 'F' + i])), W: k === 'pa' ? f(U.paW0) : null,
        dRun: [5, 12, 19].map(r => DUI.rowVal(sh(c), r)), av: Object.values(av).map(f), mem: out(c, 0), cmd: [5, 12, 19].map(r => out(c, r))
      };
    };
    const o = { mft, ncR };
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    await run(60);
    o.d = { ia: snap('ia'), pa: snap('pa') };
    set('DITL-113', 6, true); /* I.0016 INSTRUMENT AIR COMPRESSOR A TRIP */
    set('DITL-114', 6, true); /* I.0011 PLANT AIR COMPRESSOR A TRIP */
    const lo = { ia: 9, pa: 9 },
      cmd = { ia: [0, 0, 0], pa: [0, 0, 0] };
    for (let t = 0; t < 240; t++) {
      await run(0.5);
      lo.ia = Math.min(lo.ia, AN.unit.iaP);
      lo.pa = Math.min(lo.pa, AN.unit.paP);
      [5, 12, 19].forEach((r, i) => {
        cmd.ia[i] = Math.max(cmd.ia[i], out('DITL-113', r) || 0);
        cmd.pa[i] = Math.max(cmd.pa[i], out('DITL-114', r) || 0);
      });
    }
    o.cmd = cmd;
    o.trip = { ia: snap('ia'), pa: snap('pa'), lo };
    await run(300);
    o.back = { ia: snap('ia'), pa: snap('pa') };
    for (const r of [6, 13, 20]) set('DITL-113', r, true);
    await run(300);
    o.noia = { ia: snap('ia'), mft: mft.map(r => out('DITL-03G', r)), psl: (WORLD.plantSw() || []).filter(x => x.tag === 'PSL-IA1706').map(x => x.on), nc: ncR.map(r => out('DITL-03G', r)) };
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantCold();
    await run(30);
    o.cold = { ia: snap('ia'), pa: snap('pa') };
    set('DITL-113', 5, true); /* the field operator starts IA compressor A at its local panel (guide.js LS_DOCK.fieldRow) */
    await run(360);
    o.loc = snap('ia');
    return o;
  });
  console.log(JSON.stringify(r));
  const near = (x, y, e) => isFinite(x) && Math.abs(x - y) <= e;
  for (const k of ['ia', 'pa']) {
    const d = r.d[k],
      K = k.toUpperCase();
    ck(d.R.join() === '1,0,0' && d.dRun.join() === '1,0,0', `150 MW ${K}: compressor A runs (model ${d.R}, logic RUNNING ${d.dRun})`);
    ck(near(d.P, 7.0, 0.05), `150 MW ${K}: tanks ${d.P} kg/cm2 (SOP / 39.PNG 7.0)`);
    ck(d.av.length >= 3 && d.av.every(v => v > 6.5 && v <= 7.0), `150 MW ${K}: the logic reads the tank / header pressures ${d.av}`);
    ck(k === 'ia' ? d.I[0] > 150 && d.I[0] < 286 : d.I[0] > 35 && d.I[0] < 69.9, `150 MW ${K}: compressor A current ${d.I[0]} A (motor data)`);
    const t = r.trip[k],
      b = r.back[k];
    ck(r.trip.lo[k] < 5.0 && r.cmd[k][1] === 1 && t.R[1] === 1 && t.dRun[1] === 1 && t.R[2] === 0, `${K} A trip: tanks fell to ${Math.round(r.trip.lo[k] * 100) / 100} (< 5.0), START COMMAND ${r.cmd[k]} (B and C: the drawing), B in REMOTE runs ${t.R[1]} (logic RUNNING ${t.dRun[1]}), C in LOCAL stays ${t.R[2]}`);
    ck(near(b.P, 7.0, 0.05) && b.R[0] === 0, `${K} A trip: tanks back to ${b.P} with compressor B, A stays stopped`);
  }
  const n = r.noia;
  ck(n.ia.P < 2.8 && n.mft.length && n.mft.every(x => x === 1) && n.psl.includes(true), `all IA compressors tripped: header ${n.ia.PU} kg/cm2, DITL-03G instrument air MFT rows ${r.mft} = ${n.mft}, PSL-IA1706 ${n.psl}`);
  ck(n.nc.length === 1 && n.nc[0] === 0, `all IA compressors tripped: DITL-03G row ${r.ncR.map(x => x + 1)} INSTRUMENT AIR PRESS. NOT LOW = ${n.nc} (the -NC contact opens below 2.8 kg/cm2)`);
  const c = r.cold;
  ck(c.ia.R.join() === '0,0,0' && c.pa.R.join() === '0,0,0' && c.ia.P === 0 && c.pa.P === 0, `Cold: no compressor, tanks ${c.ia.P} / ${c.pa.P}`);
  const l = r.loc;
  ck(l.R.join() === '1,0,0' && l.dRun[0] === 1 && near(l.P, 7.0, 0.05) && l.I[0] > 150, `Cold, IA compressor A started at its local panel: runs ${l.R}, tanks ${l.P} after 6 min, current ${l.I[0]} A`);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
