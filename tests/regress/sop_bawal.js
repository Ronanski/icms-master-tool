// 3.2.0-beta.37 (user 2026-10-25: "Hindi genuine ang test mo kaya dapat yan baguhin yang pamamaraan ng testing mo"): the "bawal" test.
// The yardstick is the reference, not the Training coach: every operator action is tried TOO EARLY (its precondition missing), the way a
// person would press it (START of the motor on its DITL drawing, BURNER ON push button, the TCS ROLL / SYNC / LOAD UP), and the app must
// refuse it. Each line names its reference:
//  - PR-OPE-5002-02 (start-up procedure, paragraph numbers of the .docx)
//  - DITL drawings (the interlock of the motor)
//  - ATS criteria 310SC90-776 page 3 (TCS step-in conditions A1 ~ A6, docs/tcs/ATS_CRITERIA.md)
// A FAIL is a real gap of the app against the reference (the TCS lines fail until the turbine + TCS model exists).
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
  await p.getByRole('button', { name: /Gabay: Cold/ }).first().click();
  await p.waitForTimeout(6000);
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
  ck(w.on && w.Pd < 1 && w.tb === 'off', 'Gabay: Cold: one world ON, drum ' + w.Pd + ' kg/cm2, turbine ' + w.tb);

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

  /* ---- turbine side: the TCS (ATS step-in conditions) ---- */
  const turb = (cmd, arg) => ev(([c, a]) => AN.turbine(c, a), [cmd, arg]);
  const r0 = await turb('roll');
  ck(/vacuum/.test(r0), 'ROLL nang walang vacuum: "' + r0.slice(0, 50) + '" (dapat tanggihan). Ref: ATS 1.11 CONDENSER VACUUM OK (A2), PR-OPE-5002 7592');
  ck(/i-roll muna/.test(await turb('sync')), 'SYNC bago ang roll: tinanggihan. Ref: ATS 2.4 TURBINE RATED SPEED (A4, A5)');
  ck(/i-sync muna/.test(await turb('loadup', 45)), 'LOAD UP bago ang sync: tinanggihan. Ref: ATS 1.48 52G CLOSED (A6)');
  /* the condenser vacuum alone made ready (the only TCS item the app has), every other ATS step-in condition still missing: cold boiler
     (MS 0 kg/cm2, 30 C), no turning gear, no lube oil, no gland seal, no chest warming. The ATS must refuse the roll */
  const st = await ev(() => {
    AN.unit.vac = 1;
    return { Pd: +AN.unit.Pd.toFixed(1), Tw: Math.round(AN.unit.Tw || 0) };
  });
  const r1 = await turb('roll');
  ck(r1 !== '', 'ROLL na may vacuum pero malamig ang boiler (drum ' + st.Pd + ' kg/cm2, ' + st.Tw + ' C): "' + (r1 || 'TINANGGAP') + '" (dapat tanggihan). Ref: ATS 1.3 / 1.4 MAIN STEAM PRESS. / TEMP. NOT LOW, PR-OPE-5002 8437 (61.2 kg/cm2)');
  for (const [no, nm] of [
    ['1.19', 'TURBINE TURNING (turning gear)'],
    ['1.15', 'BEARING OIL PRESS. NOT LOW (lube oil pump)'],
    ['1.10', 'GLAND STEAM SEAL HEADER PRESS. NOT LOW'],
    ['1.12', 'LP TURBINE EXHAUST HOOD STEAM TEMP. NOT HIGH'],
    ['1.33 / 2.81', 'CV CHEST TEMP. DIFF. OK / CV chest warming'],
    ['2.3', 'RUB CHECK complete speed (hold bago ang 3600 rpm)']
  ]) {
    const has = await ev(n => {
      const U = AN.unit;
      return { '1.19': 'tg', '1.15': 'lo', '1.10': 'gland', '1.12': 'lpx', '1.33 / 2.81': 'chest', '2.3': 'rub' }[n] in U;
    }, no);
    ck(has, 'ATS ' + no + ' ' + nm + ': ' + (has ? 'may model' : 'WALANG MODEL sa app (hindi masubok kung tatanggihan ang roll)'));
  }
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? 'FAIL ' + fail : 'ALL PASS');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
