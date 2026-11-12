// 3.2.3 (SOHEE: SAMPLING AND DOSING page): the page shows the plant model (unit.js AN_CHEM) with real mouse clicks.
// Start at 150 MW: the analyzers have values (pH 9.0, drum pH 9.5, deaerator O2 10 ppb ...), the dosing pumps A RUNNING / B STOPPED;
// a click on carbohydrazide pump A = the FIELD pop-out, STOP + EXECUTE -> STOPPED; 30 min later the economizer inlet O2 is above 4.2 ppb
// and the analyzer common alarm is Y (it is already Y at 150 MW: drum conductivity CALC above the alarm list H 10, UNUSUAL in SAMPLING_DOSING_PLANT_MODEL.md). Screenshots before / after in the folder given by --shots=DIR (optional).
// Usage: node tests/regress/chem_page.js [html] [--shots=DIR]
const { open } = require('./lib.js');
const fs = require('fs');
const html =
  process.argv.find(a => /\.html$/.test(a)) ||
  'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const shots = (process.argv.find(a => /^--shots=/.test(a)) || '').slice(8);
(async () => {
  const { browser, page, errs } = await open(html);
  let fail = 0;
  const ck = (ok, w) => {
    console.log((ok ? 'PASS ' : 'FAIL ') + w);
    if (!ok) fail++;
  };
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.waitForFunction(
    () => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && S.sheets.length >= PRE_N,
    null,
    { timeout: 120000 }
  );
  await page.evaluate(async () => {
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    for (let i = 0; i < 240; i++) (AN.stepSet(C1, 0.5), WORLD.tick(0.5));
  });
  await page.evaluate(() => {
    if (AN.view) AN.viewSet(false);
    AN.run = true;
  });
  /* the start screen of layout C covers the app: close it the way the operator does, then open the page as the layout does */
  await page.evaluate(() => {
    const k = document.querySelector('#scstart .scskip');
    if (k && k.offsetParent) k.click();
  });
  await page.waitForTimeout(1000);
  await page.evaluate(() =>
    window.lsShellC && lsShellC.openPage
      ? lsShellC.openPage('MK16')
      : (lsPlant(true), document.querySelector('#pllist button[data-id="MK16"]').click())
  );
  await page.waitForTimeout(4000);
  const read = () =>
    page.evaluate(() => {
      const v = t => [...document.querySelectorAll(`[data-v="${t}"]`)].map(e => e.textContent)[0];
      const st = i => [...document.querySelectorAll(`[data-st="${i}"]`)].map(e => e.textContent)[0];
      const di = t =>
        [...document.querySelectorAll('[data-di]')]
          .filter(e => e.dataset.di.split('|')[0] === t)
          .map(e => e.textContent)[0];
      return {
        ph: v('AT-SP1001'),
        drum: v('AT-SP1011'),
        cond: v('AT-SP1012'),
        o2da: v('AT-SP1004'),
        o2eco: v('AT-SP1010'),
        cat: v('AT-SP1018'),
        mu: v('AT-SP1006'),
        sil: v('AT-SP1013'),
        tspA: st('TSPA'),
        tspB: st('TSPB'),
        chzA: st('CHZA'),
        al2: di('AL2-SP01'),
        al1: di('AL1-SP01')
      };
    });
  const a = await read();
  console.log(JSON.stringify(a));
  if (shots) await page.screenshot({ path: shots + '/chem-1-150MW.png' });
  ck(
    /^9\.0/.test(a.ph) && /^9\.5/.test(a.drum) && /^10\.0/.test(a.o2da) && /^0\.0/.test(a.o2eco),
    `150 MW values: pH ${a.ph}, drum pH ${a.drum}, O2 ${a.o2da} / ${a.o2eco}`
  );
  ck(
    /RUN/.test(a.tspA) && /STOP/.test(a.tspB) && /RUN/.test(a.chzA),
    `pumps: phosphate A ${a.tspA}, B ${a.tspB}, carbohydrazide A ${a.chzA}`
  );
  ck(a.sil === '-----', `silica (NO-SOURCE) stays ----- (${a.sil})`);
  const b = await page.evaluate(() => {
    const e = [...document.querySelectorAll('[data-hit="CHZA"]')].find(x => x.getBoundingClientRect().width > 0);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return [r.x + r.width / 2, r.y + r.height / 2];
  });
  ck(!!b, 'carbohydrazide pump A has a click area');
  if (b) await page.mouse.click(b[0], b[1]);
  await page.waitForTimeout(800);
  if (shots) await page.screenshot({ path: shots + '/chem-2-field-popout.png' });
  const btn = async t => {
    const q = await page.evaluate(t => {
      const p = document.getElementById('fpop');
      if (!p) return null;
      const e = [...p.querySelectorAll('button')].find(x => x.textContent.trim() === t && x.offsetParent);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return [r.x + r.width / 2, r.y + r.height / 2, e.disabled];
    }, t);
    if (q && !q[2]) await page.mouse.click(q[0], q[1]);
    return q ? (q[2] ? 'disabled' : 'ok') : 'none';
  };
  ck((await btn('STOP')) === 'ok', 'FIELD STOP');
  await page.waitForTimeout(300);
  ck((await btn('EXECUTE')) === 'ok', 'EXECUTE');
  await page.waitForTimeout(1500);
  ck((await page.evaluate(() => AN.fieldState().chzA)) === false, 'carbohydrazide pump A stopped in the model');
  await page.evaluate(() => window.LS_FPOP && LS_FPOP.close());
  await page.evaluate(async () => {
    AN.run = false;
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    for (let i = 0; i < 3600; i++) {
      AN.stepSet(C1, 0.5);
      WORLD.tick(0.5);
      if (i % 200 === 199) await new Promise(r => setTimeout(r, 0));
    }
    AN.run = true;
  });
  await page.waitForTimeout(3000);
  const c = await read();
  console.log(JSON.stringify(c));
  if (shots) await page.screenshot({ path: shots + '/chem-3-after-30min.png' });
  ck(
    /STOP/.test(c.chzA) && parseFloat(c.o2eco) > 4.2 && c.al2 === 'Y',
    `30 min later: pump ${c.chzA}, economizer O2 ${c.o2eco}, common alarm ${c.al2}`
  );
  ck(!errs.length, 'no page errors ' + errs.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `${fail} FAIL` : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
