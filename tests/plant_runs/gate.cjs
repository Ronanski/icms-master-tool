/* PLANT RUN GATE (Jennie 3.2.3-beta.194, coordinator / user 2026-11-13 "Hnd n ata matapos ito"): fixes proved headless in the page
   broke live in Worker mode (S179-1, S189-2/3). Before a Beta merges, the Training runs in WORKER mode (the engine in the Web Worker,
   localStorage ls-worker = 1, as the Beta site runs on the tablet and the PC) through the four runs of the operator:
     cold      Cold -> 150 MW          (stage 0 to MW >= 148 held 2 plant minutes)
     hot       Hot restart -> 90 MW    (stage 0 to MW >= 90 held 2 plant minutes)
     warm      Warm restart -> 90 MW   (stage 0 to MW >= 90 held 2 plant minutes)
     shutdown  Normal shutdown         (from 150 MW, stage 11 to the END of the bottle-up, stage 12)
   with the guide doing each step (LS_GUIDE.auto, the Do it of the dock) and a field operator for the field steps.
   FAIL = an MFT (I.000F MFT FROM IRP goes 0 -> 1) before the step where the procedure itself makes one (shutdown: "30 MW: turbine
   SHUT-DOWN (MFT follows)"), a step that does not move for 300 plant minutes, the engine not in the worker, a page error, or the
   wall-clock limit. Usage: npm run build; node tests/plant_runs/gate.cjs [cold,hot,warm,shutdown] [--x 300] [--mins 60]
   (PLAYWRIGHT_MODULE / CHROMIUM env as the other tools; on GitHub the playwright of npm and its chromium). Exit 0 = all pass.
   Faster repeat (CHAEWON beta.200, user 2026-11-13 "Bkt kelangan ang test ay lagi nagstart sa full cold run?"): a fix is tried from a
   save point a few steps before the trouble; the full run stays the proof before a merge.
     --save-at <step> --save <file.json>   save the whole plant (the SAVE of the app: engine, DITL, Training step) when the run first
                                           reaches that step, then go on
     --from <file.json>                    start the ONE run named from that save point instead of its starting state */
const fs = require('fs'),
  path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const arg = k => {
  const i = process.argv.indexOf('--' + k);
  return i > 0 ? process.argv[i + 1] : null;
};
const RUNS = {
  cold: { btn: 'loadcold', stage: 0, mw: 148 },
  hot: { btn: 'loadhot', stage: 0, mw: 90 },
  warm: { btn: 'loadwarm', stage: 0, mw: 90 },
  shutdown: { btn: 'load150', stage: 11, end: true, mftOk: /MFT follows/ }
};
const pick = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'cold,hot,warm,shutdown').split(',');
const SPD = '×' + (arg('x') || '300'),
  MINS = +arg('mins') || 60,
  SAVE_AT = arg('save-at') != null ? +arg('save-at') : null,
  SAVE_F = arg('save'),
  FROM = arg('from'),
  TRACE = arg('trace') != null ? +arg('trace') : null;
const V = fs.readFileSync(path.join(ROOT, 'src', 'version.txt'), 'utf8').trim();
const HTML = require('url').pathToFileURL(path.join(ROOT, 'dist', 'logic-sim-v' + V + '.html')).href;

async function one(b, name) {
  const R = RUNS[name];
  if (!R) throw new Error('unknown run ' + name);
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    window.LS_PVWIN = false;
    window.open = () => null;
    try {
      localStorage.setItem('ls-worker', '1');
      localStorage.setItem('ls-shell', 'old');
      localStorage.removeItem('ls-guide');
    } catch (e) {}
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message)));
  const t0 = Date.now(),
    say = x => console.log('[' + name + ' ' + ((Date.now() - t0) / 1000).toFixed(0) + 's] ' + x);
  const fail = why => ({ name, ok: false, why });
  try {
    await p.goto(HTML);
    await p.waitForFunction(() => window.AN && AN.setCat && window.LS_GUIDE && window.LS_DOCK, null, { timeout: 240000 });
    await p.evaluate(() => {
      if (AN.cat !== 'an') AN.setCat('an');
    });
    await p.waitForFunction(() => AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx, null, { timeout: 240000 });
    await p.waitForFunction(() => window.ENG && (ENG.mode === 'mirror' || ENG.err), null, { timeout: 240000 }).catch(() => {});
    const mode = await p.evaluate(() => window.ENG && ENG.mode);
    if (mode !== 'mirror') return fail('engine not in the Worker (ENG.mode ' + mode + ')');
    await p.evaluate(async id => {
      document.getElementById(id).click();
      await AN._startP;
      if (AN.runOn) AN.runOn();
    }, R.btn);
    await p.waitForTimeout(3000);
    await p.evaluate(st => LS_GUIDE.openStage(st), R.stage);
    await p.waitForTimeout(4000);
    if (FROM) {
      const sv = JSON.parse(fs.readFileSync(FROM, 'utf8'));
      const at = await p.evaluate(async sv => {
        await DITL150.savePut({ kf: sv.kf, kd: sv.kd, ver: sv.ver || '' });
        if (sv.rk != null) AN.restartKind = sv.rk;
        if (sv.tr && sv.tr.lat && LS_LIVE.load) LS_LIVE.load(sv.tr.lat);
        if (sv.tr && sv.tr.cur != null) LS_GUIDE.open(sv.tr.cur);
        if (AN.runOn) AN.runOn();
        return LS_GUIDE.cur;
      }, sv);
      say('from save ' + path.basename(FROM) + ' (step ' + at + ')');
      await p.waitForTimeout(3000);
    }
    await p.evaluate(spd => {
      const b = [...document.querySelectorAll('#gdock .gd-seg button')].find(x => x.textContent === spd);
      if (b) b.click();
      const q = document.querySelector('#gdock .gd-pill');
      if (q && /PAUSED/.test(q.textContent)) q.click();
    }, SPD);
    /* the guide does each step; the field operator does the field steps of the card */
    await p.evaluate(() => {
      const G = LS_GUIDE;
      G.auto(true, () => {
        const s = G.steps()[G.cur];
        if (s)
          for (const a of s.a || [])
            if (a.ad)
              try {
                LS_DOCK.fieldSet(LS_DOCK.fieldOf(a.ad).field);
              } catch (e) {}
      });
    });
    let last = -1,
      lastT = 0,
      mft0 = null,
      okSince = null,
      mftSeen = false;
    while (Date.now() - t0 < MINS * 60e3) {
      const r = await p.evaluate(() => {
        const G = LS_GUIDE,
          s = G.steps()[G.cur],
          H = G.h();
        let mft = null;
        try {
          mft = +LS_LIVE.val('I.000F');
        } catch (e) {}
        return { cur: G.cur, n: G.steps().length, t: s ? s.t : 'END', end: !!(s && s.end), T: +AN.unit.t, MW: +H.MW(), MSP: +H.MSP(), lvl: +H.lvl(), fw: +H.FW(), msf: +H.MSF(), mft, eng: window.ENG && ENG.mode, err: window.ENG && ENG.err ? String(ENG.err) : '' };
      });
      if (r.eng !== 'mirror' || r.err) return fail('engine left the Worker: ' + r.eng + ' ' + r.err);
      if (errs.length) return fail('page error: ' + errs[0]);
      if (SAVE_AT != null && SAVE_F && r.cur >= SAVE_AT && !one.saved) {
        one.saved = 1;
        const sv = await p.evaluate(async () => {
          const m = ENG.peek ? await ENG.peek() : null;
          return JSON.stringify({ kf: m && m.kf, kd: m && m.kd, ver: '', rk: AN.restartKind == null ? null : AN.restartKind, tr: { lat: LS_LIVE.done ? JSON.parse(JSON.stringify(LS_LIVE.done())) : null, cur: LS_GUIDE.cur } });
        });
        fs.writeFileSync(SAVE_F, sv);
        say('saved at step ' + r.cur + ' -> ' + SAVE_F + ' (' + (sv.length / 1e6).toFixed(1) + ' MB)');
      }
      if (r.cur !== last) {
        say('T ' + (r.T / 60).toFixed(0) + ' min, step ' + r.cur + ' ' + String(r.t).slice(0, 70) + ' | MW ' + r.MW.toFixed(1) + ' MSP ' + r.MSP.toFixed(1) + ' drum ' + r.lvl.toFixed(0) + ' mm FW ' + r.fw.toFixed(0) + ' steam ' + r.msf.toFixed(0));
        last = r.cur;
        lastT = r.T;
        if (R.mftOk && R.mftOk.test(r.t)) mftSeen = true;
      }
      /* --trace N: from step N, the drum and the flows each plant minute */
      if (TRACE != null && r.cur >= TRACE && r.T - (globalThis.__tt || -1e9) >= 60) {
        globalThis.__tt = r.T;
        say('  T ' + (r.T / 60).toFixed(1) + ' drum ' + r.lvl.toFixed(0) + ' FW ' + r.fw.toFixed(0) + ' steam ' + r.msf.toFixed(0) + ' MSP ' + r.MSP.toFixed(1) + ' ' + (await p.evaluate(() => ['LICBR1001B', 'LICBR1001', 'FICFW1007', 'PICMS1002', 'PICMS1006'].map(t => { try { const f = LS_LIVE.fp(t); return t + ' ' + LS_LIVE.modeOf(f) + ' ' + (+LS_LIVE.mvOf(f)).toFixed(1); } catch (e) { return t + ' ?'; } }).join(', '))));
      }
      /* an MFT: I.000F from 0 to 1 (Cold, Warm and Hot start with the MFT latched until the purge resets it) */
      if (r.mft === 0) mft0 = 0;
      else if (r.mft === 1 && mft0 === 0 && !mftSeen) {
        const ev = await p.evaluate(() => (window.lsEvents || []).slice(0, 14).map(e => e.t + " " + e.text + (e.why ? " (" + String(e.why).slice(0, 120) + ")" : "")).join(" | "));
        return fail('MFT at step ' + r.cur + ' "' + r.t + '" T ' + (r.T / 60).toFixed(0) + ' min. Events: ' + ev);
      }
      if (r.T - lastT > 300 * 60) return fail('step ' + r.cur + ' "' + r.t + '" did not move for 300 plant minutes');
      if (R.mw) {
        if (r.MW >= R.mw) {
          if (okSince == null) okSince = r.T;
          if (r.T - okSince >= 120) return { name, ok: true, why: 'MW ' + r.MW.toFixed(1) + ' at T ' + (r.T / 60).toFixed(0) + ' min, no MFT' };
        } else okSince = null;
      }
      if (R.end && (r.t === 'END' || (r.end && (await p.evaluate(() => LS_GUIDE.ready && LS_GUIDE.ready()))))) return { name, ok: true, why: 'shutdown END at T ' + (r.T / 60).toFixed(0) + ' min' };
      await p.waitForTimeout(2000);
    }
    return fail('not finished in ' + MINS + ' wall minutes (step ' + last + ')');
  } catch (e) {
    return fail('tool error: ' + e.message);
  } finally {
    await ctx.close();
  }
}

(async () => {
  const b = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const res = [];
  for (const n of pick) res.push(await one(b, n));
  await b.close();
  console.log('\nPLANT RUN GATE v' + V);
  for (const r of res) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + ': ' + r.why);
  process.exit(res.every(r => r.ok) ? 0 : 1);
})();
