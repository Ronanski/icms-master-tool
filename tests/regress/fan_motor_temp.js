// 3.2.3 (SOHEE): motor winding and bearing temperatures of the PAF / SAF / IDF from their TECO motor data (unit.js AN_MT.mot; Fan
// Instruction Manual 6.5 motor data sheets: Class F, stator rise limit 90 C at S.F. 1.15, rated 373 / 192 / 350 A; TECO motor manual
// 4.2.8: sleeve bearing rise about 22 C at 30 min). From "Start at 150 MW", 2 h of plant. Checks:
//   - winding = ambient + 90 x (I / (I rated x 1.15))^2 with the fan current of the model (within 1 C), below the alarm list H;
//   - motor bearings 3 / 4 = ambient + 25.3 C, fan bearings 1 / 2 keep the old running value 55 C (NO-SOURCE);
//   - the IDF stopped by a field trip of the test tool is not checked here (the MFT chain): the warm-up of the PAF motor bearing after
//     a start is checked instead from the ambient: about 12.5 C after 10 min (the TECO curve).
// Usage: node tests/regress/fan_motor_temp.js [html]
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
  await page.waitForFunction(
    () => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150,
    null,
    {
      timeout: 120000
    }
  );
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async () => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    const run = async sec => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));
      }
    };
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    const U = AN.unit;
    await run(7200);
    const T0 = isFinite(U.Tamb) ? U.Tamb : 30;
    const o = { T0, I: { PAF: U.fnPafI, SAF: U.fnSafI, IDF: U.fnIdfI }, mt: Object.assign({}, U.mt) };
    /* warm-up of a motor bearing from the ambient: put the PAF motor bearing back to the ambient, 10 min */
    U.mt['TT-FA1053-3'] = T0;
    await run(600);
    o.warm10 = U.mt['TT-FA1053-3'] - T0;
    return o;
  });
  const r1 = x => Math.round(x * 10) / 10;
  const W = { PAF: ['FA1053-', 373, 145], SAF: ['FA1054-', 192, 145], IDF: ['FG1056-', 350, 140] };
  for (const k in W) {
    const [b, Ir, hi] = W[k],
      I = r.I[k],
      want = r.T0 + 90 * Math.pow(I / (Ir * 1.15), 2),
      got = r.mt['TT-' + b + 'U'];
    ck(
      I > 0 && Math.abs(got - want) < 1 && got < hi,
      `${k} winding U ${r1(got)} C at ${r1(I)} A (CALC ${r1(want)} C, alarm H ${hi})`
    );
    ck(
      Math.abs(r.mt['TT-' + b + '3'] - (r.T0 + 25.3)) < 0.5,
      `${k} motor bearing 3 ${r1(r.mt['TT-' + b + '3'])} C (ambient ${r.T0} + 25.3)`
    );
    ck(
      Math.abs(r.mt['TT-' + b + '1'] - 55) < 0.5,
      `${k} fan bearing 1 ${r1(r.mt['TT-' + b + '1'])} C (NO-SOURCE 55, unchanged)`
    );
  }
  ck(r.warm10 > 11 && r.warm10 < 14, `PAF motor bearing warm-up ${r1(r.warm10)} C in 10 min (TECO: 11 ~ 14 C)`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
