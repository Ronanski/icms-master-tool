// 3.2.0-beta.37 (user 2026-10-25: "Hindi genuine ang test mo kaya dapat yan baguhin yang pamamaraan ng testing mo"): the "bawal" test.
// The yardstick is the reference, not the Training coach: every operator action is tried TOO EARLY (its precondition missing), the way a
// person would press it (START of the motor on its DITL drawing, BURNER ON push button, the TCS ROLL / SYNC / LOAD UP), and the app must
// refuse it. Each line names its reference:
//  - PR-OPE-5002-02 (start-up procedure, paragraph numbers of the .docx)
//  - DITL drawings (the interlock of the motor)
//  - ATS criteria 310SC90-776 page 3 (TCS step-in conditions A1 ~ A6, docs/tcs/ATS_CRITERIA.md)
// A FAIL is a real gap of the app against the reference. 3.2.0-beta.38: the TCS lines test the ATS model (tcs.js).
// Usage: node tests/regress/sop_bawal.js [html]
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 860 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message)));
  let fail = 0;
  const ck = (ok, w) => {
    console.log((ok ? 'PASS ' : 'FAIL ') + w);
    if (!ok) fail++;
  };
  await p.addInitScript(() => {
    window.LS_PVWIN = false;
    window.open = () => null;
    window.LS_HOME = true;
    try {
      localStorage.clear();
    } catch (e) {}
  });
  await p.goto('file://' + require('path').resolve(html));
  await p.waitForTimeout(4000);
  /* the person: Training > Gabay: Cold (the plant is cold, the one world runs) */
  await p.getByText('Training', { exact: true }).first().click();
  await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /(Gabay|Guide): Cold/ }).first().click();
  await p.waitForTimeout(6000);
  await p.waitForFunction(() => window.WORLD && WORLD.on && WORLD.live, null, { timeout: 20000 }).catch(() => {});
  const ev = (f, a) => p.evaluate(f, a);
  const bit = a => ev(a => +LS_LIVE.val(a) || 0, a);
  /* START of a motor on its DITL drawing (the START push button the person presses), 5 s, the RUNNING memory, STOP again */
  const tryStart = async (a, nm, ref) => {
    const pressed = await ev(a => !!LS_DOCK.dmotor(a, 1), a);
    await p.waitForTimeout(5000);
    const run = await bit(a);
    await ev(a => LS_DOCK.dmotor(a, 0), a);
    await p.waitForTimeout(1500);
    ck(pressed && run < 0.5, nm + ': START pressed' + (pressed ? '' : ' (NO START BUTTON FOUND)') + ', running = ' + run + ' (dapat 0). Ref: ' + ref);
  };
  const w = await ev(() => ({ on: !!(window.WORLD && WORLD.on && WORLD.live), Pd: AN.unit.Pd, tb: AN.unit.tb && AN.unit.tb.st }));
  ck(w.on && w.Pd < 1 && w.tb === 'off', 'Gabay: Cold: one world ON (' + w.on + '), drum ' + w.Pd + ' kg/cm2, turbine ' + w.tb);

  /* ---- boiler side: the DCS interlocks (the DITL drawings) ---- */
  await tryStart('M.3343', 'BFWP-A bago mapuno ang deaerator', 'PR-OPE-5002 3949 "Ensure all permissive are satisfied prior start of BFP"');
  await tryStart('M.3303', 'SAF bago ang IDF', 'PR-OPE-5002 4649 ~ 5007 (IDF muna), DITL SAF interlock');
  await tryStart('M.3302', 'PAF bago ang IDF / SAF / lube oil', 'PR-OPE-5002 5144, DITL-26A row 8 PAF LUB. OIL');
  await tryStart('M.3400', 'Coal feeder A habang MFT (walang purge, bed malamig)', 'PR-OPE-5002 10021 (bed 400 ~ 450 C), DITL-19 / DITL-03');
  {
    const pressed = await ev(() => !!LS_DOCK.dpress('DITL-09', 8));
    await p.waitForTimeout(5000);
    const svc = await ev(() => LS_DOCK.dout('DITL-12', 19));
    ck(pressed && svc !== 1, 'Burner A ON nang walang purge (MFT): in service = ' + svc + ' (dapat 0). Ref: PR-OPE-5002 5271 (purge muna), DITL-02 / DITL-03A');
  }

  /* ---- turbine side: the TCS (ATS step-in conditions, src/analog/engine/tcs.js) ---- */
  const turb = (cmd, arg) => ev(([c, a]) => AN.turbine(c, a), [cmd, arg]);
  const tc = await ev(() => AN.tcs && AN.tcs());
  ck(!!tc && tc.step === -1 && tc.mode, 'TCS model: ' + (tc ? 'start-up mode ' + tc.mode + ', HP metal ' + Math.round(tc.Thp) + ' C, step ' + tc.step : 'WALA'));
  /* the auxiliaries in the PR-OPE-5002 order: each one too early */
  const r0 = await turb('roll');
  ck(/1\.15/.test(r0) && /1\.19/.test(r0) && /1\.11/.test(r0), 'ROLL nang walang lube oil / turning gear / vacuum: "' + r0.slice(0, 90) + '" (dapat tanggihan, 1.11 / 1.15 / 1.19). Ref: ATS A0, PR-OPE-5002 7592');
  ck(/i-roll muna/.test(await turb('sync')), 'SYNC bago ang roll: tinanggihan. Ref: ATS 2.4 TURBINE RATED SPEED (A4, A5)');
  ck(/i-sync muna/.test(await turb('loadup', 45)), 'LOAD UP bago ang sync: tinanggihan. Ref: ATS 1.48 52G CLOSED (A6)');
  const r2 = await turb('tg');
  ck(/1\.15/.test(r2), 'TURNING GEAR nang walang lube oil: "' + r2 + '". Ref: ATS 1.15, PR-OPE-5002 (lube oil bago ang turning gear)');
  const r3 = await turb('aux');
  ck(/12/.test(r3), 'AUX STEAM (MV-AS1391) nang malamig ang drum: "' + r3 + '". Ref: PR-OPE-5002 5727 (main steam > 12 kg/cm2)');
  const r4 = await turb('gland');
  ck(/gland/.test(r4) && r4 !== '', 'GLAND SEALING nang walang aux steam: "' + r4 + '". Ref: PR-OPE-5002 6164 (aux > 7 kg/cm2)');
  const r5 = await turb('vacuum');
  ck(/vacuum up/.test(r5), 'VACUUM UP nang walang aux / gland: "' + r5 + '". Ref: PR-OPE-5002 6545');
  /* the auxiliaries all made ready (lube oil, EH oil, vapour extractor, turning gear, aux 12, gland, ejector, condenser vacuum) and
     steps 0 / 1 marked complete, the boiler still COLD: the ATS must refuse the RUB CHECK / ACCELERATION on the steam criteria */
  const rr = await ev(() => {
    const U = AN.unit,
      c = U.tc;
    Object.assign(c, { lop: true, eh: true, vex: true, tg: true, Pa: 12, gland: true, vb: false, ej: true, step: 1, cur: -1, rst: true });
    U.vac = 1;
    const out = { roll: AN.turbine('roll'), Pd: +U.Pd.toFixed(1) };
    c.Tx = 95;
    out.tx = AN.turbine('roll');
    c.Tx = 45;
    out.acc = c.mode === 'amb' || c.mode === 'c1' ? AN.turbine('accel') : 'tapusin muna ang step 2 (warm)';
    c.step = -1;
    out.rub = AN.turbine('rub');
    c.step = 1;
    return out;
  });
  ck(/1\.3 /.test(rr.roll) && /1\.4 /.test(rr.roll), 'ROLL na kumpleto ang auxiliaries pero malamig ang boiler (drum ' + rr.Pd + '): "' + rr.roll.slice(0, 110) + '". Ref: ATS 1.3 / 1.4 (A2), PR-OPE-5002 8254 (60 kg/cm2, 400 C)');
  ck(/1\.12/.test(rr.tx), 'ROLL na LP exhaust hood 95 C: may 1.12 sa sagot. Ref: ATS 1.12 (≤ 80 C), PR-OPE-5002 (LP exhaust < 80 C)');
  ck(/tapusin muna ang step 2/.test(rr.acc), 'ACCELERATION nang walang RUB CHECK (cold): "' + rr.acc + '". Ref: ATS 2.3, sequence page 17');
  ck(/tapusin muna ang step 1/.test(rr.rub), 'RUB CHECK nang walang PREPARATION (CV chest warming): "' + rr.rub + '". Ref: ATS 2.81 ~ 2.85, sequence page 14');
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? 'FAIL ' + fail : 'ALL PASS');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
