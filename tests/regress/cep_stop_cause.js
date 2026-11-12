// 3.2.3-beta.151 S148-3 (Mina beta.148 normal shutdown, 45 -> 30 MW): condensate pump A was STOPPED by the logic, condensate pump B did
// not start and the Event log had no cause. DITL-61A (P-1116A / B): the run flip-flop is reset by CONDENSER WATER LSLL-CD1110 LEVEL LOW LOW
// (row 12, field switch -150 mm, plantsw.js) AND M.3211 CONDENSER WATER LEVEL LL (row 13, ABC-031 hotwell < -300 mm), 2 s on delay
// TR259; the same LL blocks every start (NOT gate before the start AND). The standby auto start (M.1193) is the other pump's TRIP
// (I.0401 / M.1194 with the 2 s off delay of its RUNNING) or OUTLET PRESSURE LOW M.3217 while the other runs: a stop on LL is not a trip.
// Checks: hotwell drained (make-up MANUAL 0 %, dump MANUAL 100 %) -> CEP A stops at about -300 mm, CEP B stays stopped (drawing), the
// Event log has "... STOPPED by its logic: ... LSLL-CD1110 ... AND ... LEVEL LL"; an operator STOP of a pump gives no "by its logic" line.
// Usage: node tests/regress/cep_stop_cause.js [html]
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
    const T = k => AN.sheets.find(s => s.name === k).S;
    const ctl = (k, t) => AN.hmiCtrls(T(k)).find(c => c.tag === t);
    const man = (k, t, x) => {
      const c = ctl(k, t),
        S2 = T(k),
        st = S2.rt.st[c.amt.id];
      st.al = c.autoLeg;
      st.fm = c.autoLeg === 'A' ? 'B' : 'A';
      st.hold = st.y = x;
      if (c.manBlk && S2.rt.st[c.manBlk.id]) S2.rt.st[c.manBlk.id].val = x;
      else S2.rt.ext[c.manNet] = x;
      S2.rt.v[c.manNet] = x;
      for (const [S3, n] of AN.modeNets(t)) S3.rt.ext[n] = 1;
    };
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let drain = false;
    const A = S.sheets.find(x => /\)DITL-61A$/.test(x.name));
    /* the Event log scans every 500 ms of real time: the run yields so it sees the pumps running before the stop */
    const run = async (sec, stop) => {
      for (let i = 0; i < sec * 2; i++) {
        WORLD.live = true;
        if (drain) {
          man('ABC-031', 'LICCD1110A', 0);
          man('ABC-031', 'LICCD1110B', 100);
        }
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        if (i % 60 === 59) await sleep(550);
        if (stop && stop()) return true;
      }
      return false;
    };
    const o = {};
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    AN.startState = 'plantLoad150'; /* as the 150 MW button of the app (hmi-op.js anLoadStart): the Event log scans a loaded plant only */
    AN.loadN = (AN.loadN || 0) + 1;
    await run(60);
    await sleep(1200);
    o.l150 = { a: LS_LIVE.val('M.3350'), b: LS_LIVE.val('M.3351'), hw: Math.round(AN.unit.cdHw) };
    drain = true;
    o.stopped = await run(1500, () => DUI.outVal(A, 4) === 0);
    o.hwStop = Math.round(AN.unit.cdHw);
    drain = false;
    await run(20);
    await sleep(1500);
    o.after = { a: LS_LIVE.val('M.3350'), b: LS_LIVE.val('M.3351'), hw: Math.round(AN.unit.cdHw) };
    o.ev = lsEvents.slice(0, 15).map(e => e.kind + ' ' + e.text + (e.why ? ' | ' + e.why.map(l => l.txt).join(' ; ') : ''));
    return o;
  });
  /* operator STOP of a running pump (the Training dock STOP, as the faceplate) on a fresh page: no "by its logic" line */
  const o2 = await open(html),
    p2 = o2.page;
  await p2.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150, null, { timeout: 120000 });
  await p2.waitForTimeout(2000);
  r.op = await p2.evaluate(async () => {
    const C1 = AN.sheets.find(s => s.name === 'ABC-001C');
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const step = async n => {
      for (let i = 0; i < n; i++) {
        WORLD.live = true;
        AN.stepSet(C1, 0.5);
        WORLD.tick(0.5);
        await sleep(5); /* the dock lets its push button go after two scans */
      }
    };
    AN.run = false;
    AN.reset();
    ditlStates();
    AN.plantLoad150();
    DITL150.apply();
    AN.startState = 'plantLoad150';
    await step(60);
    const ok = LS_DOCK.dmotor('M.3350', false);
    await step(10);
    await sleep(1500);
    return { ok, a: LS_LIVE.val('M.3350'), ev: lsEvents.slice(0, 4).map(e => e.kind + ' ' + e.text) };
  });
  console.log(JSON.stringify(r, null, 1));
  ck(r.l150.a === 1 && r.l150.b === 0, '150 MW: CEP A runs, CEP B standby (' + JSON.stringify(r.l150) + ')');
  ck(r.stopped && r.hwStop <= -295 && r.hwStop >= -310, 'hotwell drained: CEP A stopped by the logic at ' + r.hwStop + ' mm (LL -300)');
  ck(r.after.a === 0 && r.after.b === 0, 'CEP B not started: the LL is not a trip of CEP A and blocks the start (DITL-61A) (' + JSON.stringify(r.after) + ')');
  const ln = r.ev.find(e => /STOPPED by its logic|stopped by its logic/.test(e));
  ck(!!ln && /LSLL-CD1110/.test(ln) && /LEVEL LL|LEVEL LOW LOW/.test(ln), 'Event log cause line: ' + (ln || 'none'));
  ck(r.ev.filter(e => /by its logic/i.test(e) && /CONDENSATE PUMP A|CEP-A|CEP A/i.test(e)).length === 1, 'one line only for the stop (not twice)');
  /* beta.157: a MOV that its logic moves after the stop has its own line (MV-CD1007 closed by CONDENSATE WATER FLOW LOW): the check is of the pump's line */
  ck(r.op.ok && r.op.a === 0 && !r.op.ev.some(e => /by its logic/.test(e) && !/\bMOV\b/.test(e)), 'operator STOP: no "by its logic" line for the pump (' + r.op.ev.join(' / ') + ')');
  ck(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
  await o2.browser.close();
  console.log(fail ? 'FAILED ' + fail : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
