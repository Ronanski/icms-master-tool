// 3.2.3 (SOHEE, Sakura beta.150 from Jennie's list): the heater drain levels went to +350 mm (over the H.H. 140 / 150) and the extraction
// MOVs MV-TS1001 / 1002 stayed 100 % with no close event. By the drawings a heater level HI-HI closes its extraction MOV in AUTO:
// ABC-036 M.0203 No.2 HPH -> DITL-94 MV-TS1001, M.0193 No.1 HPH -> DITL-95 MV-TS1002, No.3 LPH -> DITL-97 MV-TS1004, No.2 LPH -> DITL-98
// MV-TS1005 (MV-TS1003 DITL-96 goes to the deaerator: no heater level). The 150 MW state has them in AUTO (ditl150.js, 4.PNG "A R").
// Checks: from 150 MW, the five drain level controls MANUAL 0 %: the four MOVs close, MV-TS1003 stays open; the Event log has one line
// "... CLOSE by its logic: <heater> LEVEL HI-HI" for each (world.js s._mvWhy, events.js); an operator CLOSE press writes no such line.
// Usage: node tests/regress/heater_hihi_mov.js [html]
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
  await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150 && window.LS_GUIDE, null, { timeout: 120000 });
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async () => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    const D = ['DITL-94', 'DITL-95', 'DITL-96', 'DITL-97', 'DITL-98'];
    /* anDitlPos is null while WORLD.live is off (between the scans of the test loop): read it live */
    const pos = () => ((WORLD.live = true), D.map(d => Math.round(AN.ditlPos(d, 0))));
    const run = async sec => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 40 === 39) await new Promise(r => setTimeout(r, 0));
      }
    };
    const ev = re => (window.lsEvents || []).filter(e => re.test(e.text || '')).map(e => e.sh + ': ' + e.text);
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    AN.startState = 'plantLoad150';
    AN.loadN = (AN.loadN || 0) + 1;
    await run(30);
    o.p150 = pos();
    for (const t of ['LICHD11011', 'LICHD11021', 'LICHD11031', 'LICHD11051', 'LICHD11061']) LS_GUIDE.A.man(t, 0);
    await run(600);
    o.pHH = pos();
    o.lines = ev(/SHUT-OFF MOV MV-TS100\d CLOSE by its logic/);o.all = ev(/by its logic|DITL-96/).filter(l => /DITL-96|TS1003/.test(l));
    /* the operator closes MV-TS1003 (DITL-96 CLOSE P.B., row 14) */
    const n0 = ev(/by its logic/).length;
    WORLD.dset('DITL-96', 0, false);
    WORLD.dset('DITL-96', 20, false);
    WORLD.dset('DITL-96', 5, true);
    await run(2);
    WORLD.dpress('DITL-96', 13);
    await run(120);
    o.p96 = pos()[2];
    o.op = ev(/by its logic/).slice(n0).filter(l => /DITL-96/.test(l));
    return o;
  });
  console.log(JSON.stringify(r));
  const L = r.lines.join(' | ');
  ck(r.p150.every(x => x === 100), `150 MW: the five extraction MOVs open (${r.p150})`);
  ck(r.pHH[0] === 0 && r.pHH[1] === 0 && r.pHH[3] === 0 && r.pHH[4] === 0 && r.pHH[2] === 100, `heater levels HI-HI: MV-TS1001 / 1002 / 1004 / 1005 closed, MV-TS1003 (deaerator) open (${r.pHH})`);
  ck(/MV-TS1001 CLOSE by its logic: HP HEATER NO.2 LEVEL HI-HI/.test(L) && /MV-TS1002 CLOSE by its logic: HP HEATER NO.1 LEVEL HI-HI/.test(L), 'Event log: MV-TS1001 / MV-TS1002 closed by the HP heater HI-HI');
  ck(/MV-TS1004 CLOSE by its logic: LP HEATER NO.3 LEVEL HI-HI/.test(L) && /MV-TS1005 CLOSE by its logic: LP HEATER NO.2 LEVEL HI-HI/.test(L), 'Event log: MV-TS1004 / MV-TS1005 closed by the LP heater HI-HI');
  ck(r.lines.length === 4, `one line each (${r.lines.length}): ${L}`);
  ck(r.p96 === 0 && r.op.length === 0, `operator CLOSE of MV-TS1003 (now ${r.p96} %): no "by its logic" line (${r.op.join(' | ')})`);
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
