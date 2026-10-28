// 3.2.0-beta.16 (plan phase C, user: "paano automatic na na adjust ng mga parameters para maihold ang demand load at ... ang tamang
// paggamit ng manual controls to attain the target load"): the two PRACTICE sections of the Training (src/ui/training/live.js X3, X4).
//  - AUTO (CCS): at 150 MW the operator presses HIC-ULD ▼▼ x 6 (120 MW): the steps tick in order as the CCS brings the MW, coal and
//    pressure down, then ▲▲ x 6 back to 150 MW and the hold
//  - MANUAL: boiler master MANUAL (the turbine master follows), turbine master 120 MW -> the main steam pressure rises (> 130), boiler
//    master x 0.8 -> pressure back, then up to 150 MW, then AUTO again
//  - a practice step does not tick before the step above it (in order)
//  - "Practise: 150 MW load change" clears only the practice ticks
// Usage: node tests/regress/training_practice.js [html]
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
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.evaluate(() => {
    AN.reset();
    AN.plantLoad150();
    AN.viewSet(false);
    AN.settle();
    LS_LIVE.reset();
    AN.go(AN.sheets.findIndex(s => s.name === 'ABC-001A'));
    [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Faceplate').forEach(b => b.click());
  });
  await page.waitForSelector('#opp .fpman', { timeout: 20000 });
  await page.waitForTimeout(500);
  /* plant time with the live ticks scanned every simulated second (the app scans on its RUN timer) */
  const run = s =>
    page.evaluate(async s => {
      const C1 = AN.sheets.find(x => x.name === 'ABC-001C');
      for (let k = 0; k < s * 2; k++) {
        AN.stepSet(C1, 0.5);
        if (k % 2) LS_LIVE.scan();
        if (k % 400 === 399) await new Promise(r => setTimeout(r, 0));
      }
    }, s);
  const press = (tag, txt, n) =>
    page.evaluate(
      ([tag, txt, n]) => {
        for (let k = 0; k < n; k++) {
          const f = [...document.querySelectorAll('#opp .fpman')].find(x => x.dataset.tag === tag);
          const b = [...f.querySelectorAll('button')].find(e => e.textContent === txt);
          b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
          b.click();
        }
      },
      [tag, txt, n]
    );
  const ticks = si => page.evaluate(si => LS_PROC5002[si].s.map((x, i) => (LS_LIVE.done()[si + '.' + i] ? 1 : 0)).join(''), si);
  const P = await page.evaluate(() => ({ p: LS_LIVE.practice, n: LS_PROC5002.length, t3: LS_PROC5002[LS_LIVE.practice].t, t4: LS_PROC5002[LS_LIVE.practice + 1].t }));
  ck(P.n === P.p + 2 && /AUTO/.test(P.t3) && /MANUAL/.test(P.t4), 'Training has the two practice sections: "' + P.t3 + '", "' + P.t4 + '"');
  // AUTO
  await run(60);
  const a1 = await ticks(P.p);
  await press('HIC-ULD', '▼▼', 6);
  await run(5);
  const a2 = await ticks(P.p);
  await run(1200);
  const a3 = await ticks(P.p);
  const m120 = await page.evaluate(() => ({ mw: +AN.unit.MW, msp: CHECK.H().MSP(), coal: CHECK.H().coal() }));
  await press('HIC-ULD', '▲▲', 6);
  await run(1200);
  const a4 = await ticks(P.p);
  ck(a1 === '100000' && a2 === '110000' && a3 === '111100' && a4 === '111111',
    'AUTO practice ticks in order: 150 MW CCS ' + a1 + ', after ▼▼ x 6 ' + a2 + ', after 20 min ' + a3 + ' (MW ' + m120.mw.toFixed(1) + ', MSP ' + m120.msp.toFixed(1) + ', coal ' + m120.coal.toFixed(1) + '), after ▲▲ x 6 and 20 min ' + a4);
  // MANUAL
  const b = await page.evaluate(async () => {
    const C1 = AN.sheets.find(x => x.name === 'ABC-001C'),
      S = C1.S,
      h = CHECK.H(),
      si = LS_LIVE.practice + 1,
      tk = () => LS_PROC5002[si].s.map((x, i) => (LS_LIVE.done()[si + '.' + i] ? 1 : 0)).join('');
    const run = async s => {
      for (let k = 0; k < s * 2; k++) {
        AN.stepSet(C1, 0.5);
        if (k % 2) LS_LIVE.scan();
        if (k % 400 === 399) await new Promise(r => setTimeout(r, 0));
      }
    };
    const o = {};
    for (const [S2, n] of AN.modeNets('HIC-BM')) S2.rt.ext[n] = 1;
    await run(10);
    o.t1 = tk();
    S.rt.st[h.htm.id].val = 120;
    await run(300);
    o.t2 = tk();
    o.mspHi = h.MSP();
    const bm = +S.rt.st[h.hbm.id].val;
    S.rt.st[h.hbm.id].val = bm * 0.8;
    await run(600);
    o.t3 = tk();
    o.msp120 = h.MSP();
    S.rt.st[h.hbm.id].val = bm;
    await run(300);
    S.rt.st[h.htm.id].val = 150;
    await run(900);
    o.t4 = tk();
    o.msp150 = h.MSP();
    for (let k = 0; k < 4 && h.bit('ABC-001C', 'M.2013') > 0.5; k++) await run(120);
    for (const [S2, n] of AN.modeNets('HIC-BM')) S2.rt.ext[n] = 0;
    await run(30);
    for (const [S2, n] of AN.modeNets('EIC-TM')) S2.rt.ext[n] = 0;
    await run(30);
    o.t5 = tk();
    return o;
  });
  ck(b.t1 === '10000' && b.t2 === '11000' && b.mspHi > 130 && b.t3 === '11100' && b.t4 === '11110' && b.t5 === '11111',
    'MANUAL practice ticks in order: HIC-BM M ' + b.t1 + ', EIC-TM 120 MW ' + b.t2 + ' (MSP rises to ' + b.mspHi.toFixed(1) + '), HIC-BM x 0.8 ' + b.t3 + ' (MSP ' + b.msp120.toFixed(1) + '), back to 150 MW ' + b.t4 + ' (MSP ' + b.msp150.toFixed(1) + '), AUTO again ' + b.t5);
  // the practice button clears only the practice ticks
  const c = await page.evaluate(async () => {
    lsSetTab('training');
    await new Promise(r => setTimeout(r, 300));
    const btn = [...document.querySelectorAll('#trainws .trbtn')].find(x => x.textContent === 'Practise: 150 MW load change');
    if (!btn) return { btn: false };
    btn.click();
    await new Promise(r => setTimeout(r, 300));
    const D = LS_LIVE.done(),
      p = LS_LIVE.practice;
    return { btn: true, left: Object.keys(D).filter(k => +k.split('.')[0] >= p).length, start: AN.startState || '' };
  });
  ck(c.btn && c.left <= 1, '"Practise: 150 MW load change" button: practice ticks cleared (left ' + c.left + ': step 1 ticks again at once, the plant is at 150 MW in CCS)');
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? 'FAIL ' + fail : 'ALL PASS');
  await browser.close();
})();
