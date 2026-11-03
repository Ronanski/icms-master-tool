// NO-CHEAT CHECK (independent audit 2026-11-03; user: "Paano ko makakasiguro na hindi daya ... at tunay na buong loop"). Read only: it
// never writes the engine except as the operator does (Training > Guide: Cold, the dock RUN pill, the speed). The test never opens a
// logic page itself (no AN.setCat / sheet click); the app shows what it shows on start, as on the user's PC.
//  A. WORKER, NO PAGE OPEN: every ABC sheet (not the ABC-000x index) is stepped: its plant time moves (a sheet that stands still until
//     its page is opened is the H2 family of bugs).
//  B. WORKER = PLAIN: the START permissive (dock interlock rows) of every motor of the Training steps is the same in the Worker as on
//     the page engine at the same plant state. A row that the page engine reads complete but the Worker does not (or the reverse) is a
//     communication bug between the two, not a plant fact (H2: DITL-23A row 12 PT-FW1115-A on beta.89).
//  C. TICKS BACKED BY STATE: an SOP item that the SOP gives to the control room (CRO) and that names a tag the app HAS (a controller or
//     a signal on the ABC sheets) must tick from that signal (kind "auto"), not by hand ("field" = "Done in field" / a check box).
// Usage: node tests/regress/no_cheat.js [html]   (exit 1 on any FAIL)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs'),
  path = require('path');
const html = process.argv.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
let fail = 0;
const ck = (ok, t) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + t);
  if (!ok) fail++;
};
async function cold(b, worker) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message)));
  await p.addInitScript(() => {
    window.LS_HOME = false;
    window.LS_PVWIN = false;
    window.open = () => null;
    try {
      localStorage.setItem('ls-tab', '"logic"');
      localStorage.removeItem('ls-guide');
    } catch (e) {}
  });
  await p.goto('file://' + path.resolve(html) + '?worker=' + worker);
  await p.waitForTimeout(4000);
  const clickTxt = async (sel, txt) => {
    for (const e of await p.$$(sel)) if ((await e.textContent()).includes(txt) && (await e.isVisible())) return e.click().then(() => true);
    return false;
  };
  await clickTxt('button', 'Training');
  await p.waitForTimeout(800);
  await clickTxt('#trainws button', 'Guide: Cold');
  await p.waitForFunction(() => window.AN && !AN._loading && AN.startState === 'plantCold' && window.LS_GUIDE && LS_GUIDE.on, null, { timeout: 240000 }).catch(() => {});
  await p.waitForTimeout(2000);
  await p.click('#gdock .gd-pill');
  await p.evaluate(() => (AN.spd = 60));
  return { p, errs };
}
/* the START permissive of every motor of the Training steps, as the dock shows it */
const perms = p =>
  p.evaluate(() => {
    const o = {};
    for (const s of LS_GUIDE.steps())
      for (const a of s.a || [])
        if (a && a.stop && a.ad && !(a.ad in o))
          try {
            const I = LS_DOCK.interlock(a.ad);
            if (I && I.live) o[a.ad] = I.sheet + ': ' + I.miss.map(m => m.no).sort((x, y) => x - y).join(',');
          } catch (e) {}
    return o;
  });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  /* A */
  const W = await cold(b, 1);
  const mode = await W.p.evaluate(() => window.ENG && ENG.mode);
  ck(mode === 'mirror', 'the engine runs in the Worker (ENG.mode ' + mode + ')');
  const snap = () => W.p.evaluate(() => Object.fromEntries(AN.sheets.filter(s => !/^ABC-000/.test(s.name)).map(s => [s.name, s.S ? s.S.rt.t : null])));
  const a0 = await snap();
  await W.p.waitForTimeout(10000);
  const a1 = await snap();
  const still = Object.keys(a0).filter(k => !(a1[k] > a0[k]));
  ck(!still.length, 'A. Worker, no page opened by the test: every ABC sheet is stepped (' + Object.keys(a0).length + ' sheets' + (still.length ? '; STOOD STILL: ' + still.join(' ') : '') + ')');
  const pw = await perms(W.p);
  /* B */
  const P = await cold(b, 0);
  await P.p.waitForTimeout(10000);
  const pp = await perms(P.p);
  const diff = Object.keys(pp).filter(k => pw[k] !== pp[k]);
  ck(Object.keys(pp).length > 10 && !diff.length, 'B. START permissive Worker = page engine for ' + Object.keys(pp).length + ' motors' + diff.map(k => '\n     ' + k + ' Worker [' + pw[k] + '] page [' + pp[k] + ']').join(''));
  /* C */
  const c = await P.p.evaluate(() => {
    const L = [],
      LIM = window.LS_PROC5002_LIM || {};
    let auto = 0,
      field = 0,
      tcs = 0;
    LS_PROC5002.forEach((sec, si) =>
      sec.s.forEach((st, i) => {
        const q = LS_LIVE.kind(si, i),
          lim = LIM[si + '.' + i] || {};
        if (q.k === 'auto') auto++;
        else if (q.k === 'tcs') tcs++;
        else field++;
        if (q.k !== 'field' || !/\bCRO\b/.test(lim.by || '') || /\bAO\b/.test(lim.by || '')) return;
        const tags = String((lim.g || '') + ' ' + st.t).match(/\b[A-Z]{1,4}-?[A-Z]{2}\d{3,4}[A-Z0-9]*\b/g) || [];
        const has = tags.map(t => t.replace(/-/g, '')).filter(t => LS_LIVE.has(t) || (LS_LIVE.ctlTag && LS_LIVE.ctlTag(t)));
        if (has.length) L.push(si + 1 + '.' + (i + 1) + ' [' + [...new Set(has)].join(' ') + '] ' + st.t.slice(0, 90));
      })
    );
    return { L, auto, field, tcs };
  });
  console.log('     SOP items: ' + c.auto + ' tick from a signal, ' + c.field + ' by hand (field), ' + c.tcs + ' TCS');
  ck(!c.L.length, 'C. CRO items that name a tag the app has tick from that signal' + c.L.map(x => '\n     by hand: ' + x).join(''));
  ck(!W.errs.length && !P.errs.length, 'no page error ' + JSON.stringify(W.errs.concat(P.errs).slice(0, 2)));
  await b.close();
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
