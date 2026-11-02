/* ENG HOST (3.2.0 Web Worker, stage d, DRAFT): the engine in the worker. No DOM. Loaded after the engine bundle
   (tools/build/engine-bundle.js worldBundle) in the worker script that the page makes from its inline text (a blob: works from file://,
   the apk and the exe).
   Messages from the page:
   - {t:'init', apre, pre, ades, kf, kd, i}: the drawings (the same texts as the page: ABC sheets, DITL sheets, descriptions, base64
     gzip), then the keyframe of the page (ABC kf, DITL kd): the engine starts where the page is;
   - {t:'op', ...}: the radio (src/world/eng.js);
   - {t:'stop'}.
   The two scan groups of src/analog/engine/sched.js, the same rules: ABC every 100 ms (the set of the current sheet, steps of 0.5 s at
   AN.spd, the tiers), the DITL world every 200 ms (WORLD.scanJob); after each job what changed goes to the page (ENG.send). */
(function (G) {
  const gunz = async b64 => {
    const bin = Uint8Array.from(atob(b64.trim()), c => c.charCodeAt(0));
    const s = new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(s).text();
  };
  const lines = t => t.split('\n').filter(Boolean).map(l => JSON.parse(l));
  let timers = [];
  const say = m => G.postMessage(m);
  G.msg = t => say({ t: 'msg', text: String(t) });
  async function init(m) {
    const { AN, DITL, WORLD, ENG } = G;
    AN.sheets = lines(await gunz(m.apre));
    AN.plantOn = true;
    for (const sh of AN.sheets) G.ENGINE.E.ensure(sh);
    AN.adesPut(JSON.parse(await gunz(m.ades)));
    DITL.S = { sheets: lines(await gunz(m.pre)), cur: 0 };
    WORLD.set(true);
    AN.reset();
    DITL.ditlStates();
    AN.i = m.i;
    if (m.kf) AN.engState.apply(m.kf);
    if (m.kd) DITL.ditlApply(m.kd);
    ENG.start('engine', { postMessage: say });
    run();
    say({ t: 'ready' });
  }
  function run() {
    const { AN, WORLD, ENG } = G;
    let acc = 0,
      busy = false;
    const cs = () => AN.sheets[AN.i] || AN.sheets.find(x => /057/.test(x.name));
    timers.push(
      setInterval(() => {
        if (busy) return;
        if (!AN.run || AN._loading) {
          acc = 0;
          return;
        }
        const sh = cs();
        if (!sh || !sh.S) return;
        acc += 0.1 * AN.spd;
        const dt = acc,
          n = Math.max(1, Math.ceil(dt / 0.5)),
          K = AN.tierK || 1;
        acc = 0;
        busy = true;
        const t0 = performance.now();
        try {
          for (let i = 0; i < n; i++) K > 1 ? AN.stepTier(sh, dt / n, K) : G.ENGINE.E.stepSet(sh, dt / n);
        } catch (e) {
          say({ t: 'error', where: 'ABC scan', text: String((e && e.stack) || e) });
        }
        const ms = performance.now() - t0;
        AN._ms = AN._ms == null ? ms : AN._ms * 0.85 + ms * 0.15;
        if (!AN.tierLock && (AN._tn = (AN._tn || 0) + 1) % 10 === 0) {
          const k = AN.tierK || 1;
          AN.tierK = AN._ms > 35 ? Math.min(6, k + 1) : AN._ms < 14 ? Math.max(1, k - 1) : k;
        }
        busy = false;
        ENG.send();
      }, 100)
    );
    timers.push(
      setInterval(() => {
        if (busy || !WORLD.scanJob) return;
        const g = WORLD.scanJob();
        if (!g) return;
        busy = true;
        try {
          for (const _ of g);
        } catch (e) {
          say({ t: 'error', where: 'DITL scan', text: String((e && e.stack) || e) });
        }
        busy = false;
        ENG.send();
      }, 200)
    );
  }
  G.onmessage = async e => {
    const m = e.data;
    try {
      if (m.t === 'init') await init(m);
      else if (m.t === 'stop') {
        timers.forEach(clearInterval);
        timers = [];
      } else await G.ENG.onMsg(m);
    } catch (x) {
      say({ t: 'error', where: m && m.t, text: String((x && x.stack) || x) });
    }
  };
  G.onerror = e => say({ t: 'error', where: 'worker', text: String((e && e.message) || e) });
})(self);
