// Makes src/data/st150.txt: the steady state of the plant model at 150 MW (every loop in AUTO), the start "At 150 MW".
// It opens the built html (dist/), presses "At 150 MW" (the snapshot line-up, or the st150 of the build), then runs the
// whole plant (ABC + DITL + plant model, 0.5 s scans) in chunks of CHUNK plant minutes. Between the chunks the page is
// reopened and the plant is put back by a save point (the browser runs out of memory on long runs). It stops when the
// last 3 minutes moved less than the limits below, or at MAX minutes. Then: node tools/build/build.js.
// Usage: PLAYWRIGHT_MODULE=... CHROMIUM=... node tools/steady150/make.cjs [MAX=120] [CHUNK=10]
// One scan = one step of the ABC-001C set (the set of linked sheets, as the app does) + one DITL tick, 0.5 s. About 7 s of computer time per plant minute.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.resolve(__dirname, '..', '..');
process.chdir(root);
const { open } = require(path.join(root, 'tests/regress/lib.js'));
const html = 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const MAX = +process.argv[2] || 120, CHUNK = +process.argv[3] || 10;
const LIM = { MW: 0.3, Tb: 1, Pd: 0.3, msT: 1, rh: 1, F: 0.5 };
async function chunk(sv, min, log) {
  const { browser, page } = await open(html);
  try {
    await page.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx && S.sheets.length >= PRE_N, null, { timeout: 120000 });
    await page.waitForTimeout(1500);
    await page.evaluate(async sv => {
      await AN.ades();
      WORLD.set(true);
      document.getElementById('load150').click();
      await AN._startP;
      if (sv) { const o = JSON.parse(sv); await DITL150.savePut({ kf: o.kf, kd: o.kd, ver: 'st150' }); }
      window.__h = { C: AN.sheets.find(s => s.name === 'ABC-001C') };
    }, sv);
    for (let m = 0; m < min; m++) {
      const e = await page.evaluate(() => {
        const h = window.__h, U = AN.unit;
        for (let k = 0; k < 120; k++) { WORLD.live = true; AN.stepSet(h.C, 0.5); WORLD.tick(0.5); }
        const pv = (sh, t) => { const x = AN.sheets.find(y => y.name === sh); const b = x.S.procs.find(z => (z.txt || [])[1] === t); return b ? +x.S.rt.v[b.proc.pv] : NaN; };
        const f = x => (isFinite(x) ? +(+x).toFixed(2) : null);
        return { MW: f(U.MW), F: f(U.Fc), Tb: f(U.Tb), Pd: f(U.Pd), ms: f(U.ms), msT: f(pv('ABC-012', 'TICMS1004')), rh: f(pv('ABC-019', 'TICHR1002')) };
      });
      log.push(e);
      console.log(log.length, JSON.stringify(e));
    }
    return await page.evaluate(() => JSON.stringify({ kf: AN.engState.capture(), kd: (typeof ditlCapture === 'function' ? ditlCapture : window.DITL.ditlCapture)() }));
  } finally { await browser.close(); }
}
(async () => {
  const log = [];
  let sv = null;
  while (log.length < MAX) {
    sv = await chunk(sv, CHUNK, log);
    if (log.length >= 6) {
      const a = log[log.length - 4], b = log[log.length - 1];
      if (b.MW < 140) { console.error('not at 150 MW (trip?): nothing written'); process.exit(1); }
      if (Object.keys(LIM).every(k => Math.abs(b[k] - a[k]) <= LIM[k])) { console.log('steady after', log.length, 'min'); break; }
    }
  }
  const o = JSON.parse(sv);
  o.ver = 'st150 ' + fs.readFileSync('src/version.txt', 'utf8').trim() + ' ' + log.length + ' min';
  o.end = log[log.length - 1];
  const txt = zlib.gzipSync(JSON.stringify(o), { level: 9 }).toString('base64');
  fs.writeFileSync('src/data/st150.txt', txt);
  console.log('written src/data/st150.txt', txt.length, 'chars', JSON.stringify(o.end));
})();
