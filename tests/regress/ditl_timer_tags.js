// 3.2.3-beta.174 / 175 (SOHEE): the TR tag of a DITL timer as the drawing writes it (Logic page timer label, "To make it" reader, cause lines).
// Before: DITL-28A row 17 CURRENT L.L. ON DELAY 5 SEC had no tag ("timer"), its "TR132/142" is written left of the timer over its input
// line; the two-line tags of the A / B (or 3 / 4 equipment) family were read as one line ("TR133" of "TR133" over "TR143", "TR144" of
// "TR144" over "TR134"). Expected tags read from the drawing PDFs (digital-logic-ditl.zip PDF, sand-sootblower-logic.zip Sootblower PDF);
// unchanged ones are checked too. Usage: node tests/regress/ditl_timer_tags.js [html]
const { open } = require('./lib.js');
const fs = require('fs');
const html =
  process.argv.find(a => /\.html$/.test(a)) ||
  'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
/* [sheet, kind, ax, ay (drawing units, rounded), tag on the drawing] */
const EXP = [
  ['DITL-28A', 'on', 132, -180, 'TR132/142'], // row 17 FAB CURRENT L.L. ON DELAY 5 SEC
  ['DITL-28A', 'pulse', 151, -180, 'TR133/143'], // PULSE DELAY 2 SEC, "TR133" over "TR143"
  ['DITL-28A', 'off', 127, -197, 'TR134/144'], // FAB B RUNNING OFF DELAY 2 SEC, "TR144" over "TR134"
  ['DITL-28A', 'on', 137, -206, 'TR135/145'], // unchanged
  ['DITL-28A', 'on', 157, -150, 'TR92/94'], // unchanged
  ['DITL-22', 'off', 153, -164, 'TR185/186/205/206'],
  ['DITL-61A', 'on', 165, -126, 'TR258/259'], // CEP A / B condenser level LL 2 SEC
  ['DITL-112', 'on', 123, -120, 'TR25/37/47'],
  ['DITL-112', 'on', 144, -56, 'TR23/33/43'],
  ['DITL-31', 'on', 144, -56, 'TR35/45'],
  ['DITL-29A', 'off', 124, -110, 'TR202/212/222'],
  ['DITL-14', 'on', 174, -148, 'TR150/160/170/180'],
  ['DITL-80O', 'on', 153, -35, 'TR348'],
  ['DITL-80Q', 'on', 155, -91, 'TR999'],
  ['DITL-07', 'on', 176, -119, 'TR18/58/818/858'], // beta.176: the tag at the height of the timer (before: the one below, TR19)
  ['DITL-07', 'on', 177, -136, 'TR19/59/819/859'], // unchanged
  /* beta.176: DITL-80 sootblower start commands, two columns of 0.5 SEC timers, the tag of each at its own height between them */
  ['(S3)DITL-80', 'on', 275, -102, 'TR950'],
  ['(S3)DITL-80', 'on', 297, -111, 'TR951'],
  ['(S3)DITL-80', 'on', 275, -120, 'TR952'],
  ['(S3)DITL-80', 'on', 297, -129, 'TR953'],
  ['(S3)DITL-80', 'on', 297, -183, 'TR977'],
  ['(S3)DITL-80', 'on', 275, -192, 'TR983'],
  ['(S3)DITL-80', 'on', 297, -200, 'TR984'],
  ['DITL-10', 'on', 243, -127, 'TR16/56/816/856'],
  ['DITL-21A', 'off', 133, -211, 'TR443/453/463/483'],
  ['DITL-61A', 'on', 164, -227, 'TR64/66'],
  ['DITL-95', 'pulse', 153, -234, 'TR38'],
  ['DITL-80O', 'on', 252, -119, 'TR577'],
  ['DITL-80P', 'on', 247, -146, 'TR593']
];
(async () => {
  const { browser, page, errs } = await open(html);
  let fail = 0;
  const ck = (ok, w) => {
    console.log((ok ? 'PASS ' : 'FAIL ') + w);
    if (!ok) fail++;
  };
  await page.waitForFunction(
    () => window.AN && AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && window.DITL150,
    null,
    { timeout: 120000 }
  );
  await page.waitForTimeout(2000);
  const got = await page.evaluate(EXP => {
    const dn = s => s.name.replace(/^\([^)]*\)/, '');
    const r = EXP.map(([sh, k, x, y]) => {
      const s = S.sheets.find(z => z.nl && (sh[0] === '(' ? z.name === sh : dn(z) === sh));
      const g =
        s &&
        s.nl.gates.find(g => g.t === 'TMR' && g.k === k && Math.abs(g.tm.ax - x) < 1.5 && Math.abs(g.tm.ay - y) < 1.5);
      return g ? g.tm.tag || '' : null;
    });
    /* the sand silo drawing reads its timers by tag (src/digital/parts/02b-sand.js TR314 / TR315) */
    const sand = S.sheets
      .filter(z => z.nl)
      .flatMap(z => z.nl.gates.filter(g => g.t === 'TMR' && /^TR31[45]$/.test(g.tm.tag || ''))).length;
    return { r, sand };
  }, EXP);
  EXP.forEach((e, i) =>
    ck(
      got.r[i] === e[4],
      e[0] + ' ' + e[1] + ' at ' + e[2] + ', ' + e[3] + ': ' + JSON.stringify(got.r[i]) + ' (drawing ' + e[4] + ')'
    )
  );
  ck(got.sand >= 2, 'sand silo timers TR314 / TR315 still found by tag (' + got.sand + ')');
  ck(errs.length === 0, 'no page error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(fail ? fail + ' FAIL' : 'ALL PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
