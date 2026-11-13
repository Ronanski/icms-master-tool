// 3.2.3-beta.185 (SOHEE): the field switch rows that the plant model owns (src/world/plantsw.js) do not keep the field bit of the 150 MW
// load (DITL150 s.sig). Before, the bit was ORed with the switch, so a row that was 1 at 150 MW stayed 1 when the plant went 0:
// DITL-03G -NC rows (fixed 183), DITL-21A I.0163, DITL-23A ZSO-FW1031, DITL-BA03 / BA11 MIL-M1301, DITL-774 REMOTE.
// Checks: after the 150 MW load and a few scans no owned row has a field bit; the BFWP-A suction valve V-FW1001 closed -> DITL-23A
// "ZSO-FW1031 BFWP A SUCTION MANUAL VALVE OPEN" = 0; open again -> 1; a field trip set by the operator after that (WORLD.dset) still holds.
// Usage: node tests/regress/plant_sw_field_bits.js [html]
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
    await run(30);
    const all = S.sheets.concat(WORLD.inst || []);
    const sw = WORLD.plantSw() || [];
    const stale = sw.filter(x => {
      const s = all.find(q => q.name === x.sheet);
      return s && s.sig && s.sig[x.row - 1 + ':S'];
    });
    const z = sw.find(x => x.tag === 'ZSO-FW1031' && /\)DITL-23A$/.test(x.sheet));
    const s23 = all.find(q => q.name === z.sheet),
      zr = z.row - 1,
      v = () => (DUI.rowVal(s23, zr) ? 1 : 0);
    const o = { n: sw.length, stale: stale.map(x => x.sheet + ' r' + x.row + ' ' + x.tag), z0: v() };
    AN.swValve('V-FW1001', 0);
    await run(10);
    o.z1 = v();
    AN.swValve('V-FW1001', 100);
    await run(10);
    o.z2 = v();
    AN.swValve('V-FW1001', 0);
    WORLD.dset(s23.name.replace(/^\(\w+\)/, ''), zr, true);
    await run(5);
    o.z3 = v();
    return o;
  });
  ck(r.n > 50 && r.stale.length === 0, `150 MW: ${r.n} owned switch rows, with a field bit: ${JSON.stringify(r.stale)}`);
  ck(r.z0 === 1, `150 MW: DITL-23A ZSO-FW1031 BFWP A suction valve open = ${r.z0}`);
  ck(r.z1 === 0, `V-FW1001 closed: ZSO-FW1031 = ${r.z1} (stayed 1 before 185)`);
  ck(r.z2 === 1, `V-FW1001 open again: ZSO-FW1031 = ${r.z2}`);
  ck(r.z3 === 1, `valve closed, then a field force set by the operator: the row holds 1 (${r.z3})`);
  ck(!errs.length, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
