/* ENG HOST (3.2.0 Web Worker, stage d, DRAFT): the engine in the worker. No DOM. Loaded after the engine bundle
   (tools/build/engine-bundle.js worldBundle) in the worker script that the page makes from its inline text (a blob: works from file://,
   the apk and the exe).
   Messages from the page:
   - {t:'init', apre, ades, ds | pre, sv, lne, kf, kd, i}: the drawings (the same texts as the page: ABC sheets and descriptions,
     base64 gzip; the DITL sheets of the page as JSON, with the user's fixes), the saved settings (AN.sv, AN.lne), then the keyframe of the page (ABC kf, DITL kd): the engine starts where the page is;
   - {t:'go', sv, lne, kf, kd, i, d150}: after 'ready', the plant of the page at that moment (the page ran it while this loaded);
   - {t:'op', ...}: the radio (src/world/eng.js);
   - {t:'kf', id}: the whole state back (the check that the page mirror = the engine);
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
  /* for the checks: jobs run, patches sent */
  const N = (G.ENG_N = { abc: 0, world: 0, sent: 0, skip: 0 });
  const say = m => G.postMessage(m);
  G.msg = t => say({ t: 'msg', text: String(t) });
  /* the progress bar of a long action (hmi-op.js anLoadStart: window.lsBusy) on the page; the steps at most 5 a second */
  let pt = 0;
  G.lsBusy = {
    show: t => say({ t: 'busy', f: 'show', a: [t] }),
    prog: f => {
      const n = Date.now();
      if (n - pt > 200) (pt = n), say({ t: 'busy', f: 'prog', a: [f] });
    },
    hide: () => say({ t: 'busy', f: 'hide', a: [] })
  };
  /* an event of the engine (world.js FIRST-OUT: a TRIP and its cause) goes to the Event log of the page with the patch of its scan
     (the page takes the state first, so the event has the plant time of its scan) */
  G.lsEventAdd = (...a) => ((N.ev = (N.ev || 0) + 1), (G.ENG.evq = G.ENG.evq || []).push(a));
  async function init(m) {
    const { AN, DITL, WORLD, ENG } = G;
    AN.sheets = lines(await gunz(m.apre));
    AN.plantOn = true;
    for (const sh of AN.sheets) G.ENGINE.E.ensure(sh);
    AN.adesPut(JSON.parse(await gunz(m.ades)));
    DITL.S = { sheets: m.ds ? JSON.parse(m.ds) : lines(await gunz(m.pre)), cur: 0 };
    AN.sv = m.sv || {};
    AN.lne = m.lne || {};
    WORLD.set(true);
    AN.reset();
    DITL.ditlStates();
    AN.i = m.i;
    if (m.kf) AN.engState.apply(m.kf);
    if (m.kd) DITL.ditlApply(m.kd);
    /* loaded: the page still runs the plant; it answers with the plant as it is now (go) */
    say({ t: 'ready' });
  }
  /* the hand-over (eng-page.js E._go): the plant of the page as it is at this moment, then this engine runs it */
  function go(m) {
    const { AN, DITL, ENG } = G;
    if (ENG.mode === 'engine') return;
    AN.sv = m.sv || AN.sv || {};
    AN.lne = m.lne || AN.lne || {};
    AN.i = m.i;
    if (m.kf) AN.engState.apply(m.kf);
    if (m.kd) DITL.ditlApply(m.kd);
    if (G.DITL150 && 'd150' in m) G.DITL150.on = !!m.d150;
    ENG.start('engine', { postMessage: say });
    run();
  }
  function run() {
    /* the heartbeat (Giselle): the page knows the engine is alive also while nothing changes (paused); a worker that died or hangs is
       seen there (eng-page.js watchdog) */
    timers.push(setInterval(() => say({ t: 'beat' }), 1000));
    const { AN, WORLD, ENG } = G;
    let lastLive = null,
      acc = 0,
      busy = false;
    const cs = () => AN.sheets[AN.i] || AN.sheets.find(x => /057/.test(x.name));
    timers.push(
      setInterval(() => {
        N.t = (N.t || 0) + 1;
        N.lr = AN.run;
        N.same = AN === G.AN;
        if (!AN.run || AN._loading) {
          if (!AN.run) N.norun = (N.norun || 0) + 1;
          else N.load = (N.load || 0) + 1;
          acc = 0;
          return;
        }
        /* the plant time of this tick is kept even while a world scan holds the engine (as the page scheduler, sched.js: its anAcc
           grows before the busy check); before, a tick that met a scan was lost: 4.4 s of plant a second at 6x (eng_worker, Winter) */
        acc += 0.1 * AN.spd;
        if (busy) return void N.skip++;
        const sh = cs();
        if (!sh || !sh.S) return void (N.nosh = (N.nosh || 0) + 1);
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
        N.abc++;
        N.sent += ENG.send() ? 1 : 0;
      }, 100)
    );
    timers.push(
      setInterval(() => {
        if (busy || !WORLD.scanJob) return;
        const g = WORLD.scanJob();
        if (!g) {
          /* paused: scanJob turned WORLD.live off, but no job runs to send it, so the page kept "live" (Rosé, 1 of 3 runs) */
          if (lastLive !== WORLD.live) N.sent += ENG.send() ? 1 : 0;
          lastLive = WORLD.live;
          return;
        }
        lastLive = WORLD.live;
        busy = true;
        try {
          for (const _ of g);
        } catch (e) {
          say({ t: 'error', where: 'DITL scan', text: String((e && e.stack) || e) });
        }
        busy = false;
        N.world++;
        N.sent += ENG.send() ? 1 : 0;
      }, 200)
    );
  }
  /* the messages that come while the engine is still loading wait (in order) */
  /* an action (Reset, a starting state ...) can take seconds here, with no heartbeat: the page is told first (Giselle; 'acting', not
     'busy': 'busy' is the progress bar) */
  const acting = m => m && m.t === 'op' && m.calls && m.calls.length && say({ t: 'acting' });
  let ready = false;
  const Q = [];
  G.onmessage = async e => {
    const m = e.data;
    if (m.t !== 'init' && !ready) return void Q.push(m);
    try {
      if (m.t === 'init') {
        await init(m);
        ready = true;
        while (Q.length) {
          const q = Q.shift();
          acting(q);
          await G.ENG.onMsg(q);
        }
      }
      else if (m.t === 'go') go(m);
      else if (m.t === 'kf') say({ t: 'kf', id: m.id, kf: G.AN.engState.capture(), kd: G.DITL.ditlCapture(), n: Object.assign({ loading: !!G.AN._loading, mode: G.ENG.mode, run: G.AN.run, at: Date.now(), ms: G.WORLD.ms, wait: !!G.ENG.wait, owed: !!G.ENG.owed, live: !!G.WORLD.live, wsh: (G.AN.worldSheets || []).length }, N) });
      else if (m.t === 'stop') {
        timers.forEach(clearInterval);
        timers = [];
      } else {
        acting(m);
        await G.ENG.onMsg(m);
        /* what the message changed goes back at once (no job runs while the plant is paused) */
        if (m.t === "op" || m.t === "full") G.ENG.send();
      }
    } catch (x) {
      say({ t: 'error', where: m && m.t, text: String((x && x.stack) || x) });
    }
  };
  G.onerror = e => say({ t: 'error', where: 'worker', text: String((e && e.message) || e) });
})(self);
