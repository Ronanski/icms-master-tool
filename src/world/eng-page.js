/* ENG PAGE (3.2.0 Web Worker, stage d): the page side. The engine starts in a Web Worker made from the inline text #engsrc (the engine
   bundle + src/world/eng-host.js, put in by tools/build/build.js; a blob, so it runs from file://, the apk and the exe); the page keeps
   its objects as the mirror (src/world/eng.js). Off unless asked (?worker=1 or localStorage ls-worker = 1) until it is proved; ENG.boot()
   starts it by hand. A worker that fails shows a clear message on the screen (not a silent stop) and the page goes on by itself. */
(function () {
  const E = window.ENG;
  if (!E) return;
  const want = () => {
    try {
      if (/[?&]worker=1\b/.test(location.search)) return true;
      return localStorage.getItem('ls-worker') === '1';
    } catch (e) {
      return false;
    }
  };
  const txt = id => {
    const e = document.getElementById(id);
    return e ? e.textContent : '';
  };
  /* a failure: a bar on the screen, and back to the engine of the page (local) */
  const fail = (where, text) => {
    E.err = { where, text };
    try {
      console.error('ENGINE WORKER', where, text);
      let b = document.getElementById('engerr');
      if (!b) {
        b = document.createElement('div');
        b.id = 'engerr';
        b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;background:#b00020;color:#fff;font:14px/1.4 sans-serif;padding:8px 12px';
        document.body.appendChild(b);
      }
      b.textContent = 'Engine stopped (' + where + '): ' + String(text).split('\n')[0] + ' - the page runs the engine by itself now.';
    } catch (e) {}
    try {
      if (E.worker) E.worker.terminate();
    } catch (e) {}
    E.worker = null;
    clearInterval(E._fl);
    clearInterval(E._wd);
    E.stop();
  };
  /* for the watchdog (src/world/eng-watch.js): stop the worker with a message on the screen, back to the page engine */
  E.fail = fail;
  /* the watchdog (Giselle, point 12): the worker sends a heartbeat every second (eng-host.js); a worker that died (terminated, out of
     memory) or hangs sends nothing, so the page would wait for ever with the plant still. No message for 10 s = stopped; 60 s after
     'acting' or while the page waits for a long action (ENG.heavy: a starting state takes seconds there, with no heartbeat) */
  const WD = 10000,
    WD_CALL = 60000;
  const watch = () => {
    clearInterval(E._wd);
    let tk = (E.inAt = Date.now());
    E.busyAt = 0;
    E._wd = setInterval(() => {
      const now = Date.now(),
        late = now - tk > 3000;
      tk = now;
      /* the page itself was busy (its messages still wait in the queue): no verdict on this tick */
      if (late || E.mode !== 'mirror' || !E.worker) return;
      const lim = E.busyAt || E.heavy ? WD_CALL : WD;
      if (now - E.inAt > lim) fail('no answer', 'the engine in the worker stopped answering (no message for ' + lim / 1000 + ' s)');
    }, 1000);
  };
  E.boot = () =>
    new Promise((ok, no) => {
      if (E.worker) return ok(E.worker);
      const src = txt('engsrc');
      if (!src || typeof Worker === 'undefined' || !window.AN || !AN.sheets || !AN.sheets.length) return no(new Error('no engine source / sheets'));
      let w;
      try {
        w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      } catch (e) {
        fail('start', e.message);
        return no(e);
      }
      E.worker = w;
      w.onerror = e => fail('worker', (e && e.message) || e);
      w.onmessage = ev => {
        const m = ev.data;
        E.inAt = Date.now();
        if (m.t === 'beat') return;
        E.busyAt = m.t === 'acting' ? E.inAt : m.t === 'busy' ? E.busyAt : 0;
        if (m.t === 'acting') return;
        /* the worker has loaded the drawings: the page hands over the plant as it is NOW and becomes the mirror (go) */
        if (m.t === 'ready') return void E._go(w).then(ok, no);
        if (m.t === 'kf') {
          const r = E._kf && E._kf[m.id];
          if (r) delete E._kf[m.id], r(m);
          return;
        }
        /* an engine action that failed: said on the screen, the engine goes on; anything else: the worker stops */
        if (m.t === 'error' && m.soft) {
          console.error('ENGINE', m.where, m.text);
          if (typeof msg === 'function') msg('Engine: ' + m.where + ' failed (' + String(m.text).split(String.fromCharCode(10))[0] + ')');
          return;
        }
        if (m.t === 'error') return fail(m.where || 'engine', m.text);
        /* the progress bar of a long action of the engine */
        if (m.t === 'busy') {
          try {
            if (window.lsBusy && lsBusy[m.f]) lsBusy[m.f](...m.a);
          } catch (e) {}
          return;
        }
        if (m.t === 'msg') {
          if (typeof msg === 'function') msg(m.text);
          return;
        }
        E.take(m).catch(e => fail('page', e.message));
      };
      /* the page as it is now: every ABC sheet built (the slots of both sides are the same list), its keyframe */
      try {
        for (const sh of AN.sheets) AN.ensure(sh);
        if (window.WORLD && WORLD.build) WORLD.build();
        E.onPatch = () => AN.patchPaint && AN.patchPaint();
        /* the events of the engine into the Event log of the page */
        E.onEvent = a => window.lsEventAdd && lsEventAdd(...a);
        /* the DITL sheets of the page (with the user's fixes), the saved settings of the ABC (Reset applies them) */
        const ds = JSON.stringify(S.sheets, (k, v) => (k === 'nl' || k[0] === '_' ? undefined : v instanceof Set ? [...v] : v)); /* the _ keys: caches, links to instances (the keyframe carries the state ones) */
        /* 3.2.0 Web Worker: the page keeps running the plant itself (local) while the worker loads the drawings (seconds on a slow
           device: before, the page was the mirror at once and the plant stood still until the worker was ready; a Run pressed then
           started ~9 s late, mcc_valve on the cloud). The state goes over at 'ready' (E._go), so nothing done meanwhile is lost */
        w.postMessage({ t: 'init', apre: txt('apre'), ades: txt('ades'), ds, sv: AN.sv || {}, lne: AN.lne || {}, i: AN.i });
      } catch (e) {
        fail('init', e.message);
        no(e);
      }
    });
  /* the hand-over: wait until no job of the page is half done and no starting state is loading here, then the keyframe of the page
     as it is now goes to the worker (go) and the page becomes the mirror in the same moment (no scan of the page between them) */
  E._go = w =>
    new Promise((ok, no) => {
      const go = () => {
        if (!E.worker) return no(new Error('the worker stopped before the hand-over'));
        /* a starting state loading here (in slices, seconds): it ends first */
        if (AN._loading || AN._loadP) return void setTimeout(go, 100);
        try {
          /* a scan of the page that is half done (the scheduler runs jobs in slices) is finished first */
          if (AN.sched && AN.sched.flush) AN.sched.flush();
          const kf = AN.engState.capture(),
            kd = ditlCapture();
          w.postMessage({ t: 'go', sv: AN.sv || {}, lne: AN.lne || {}, kf, kd, i: AN.i, d150: !!(window.DITL150 && DITL150.on) });
          E.start('mirror', w);
        } catch (e) {
          fail('hand-over', e.message);
          return no(e);
        }
        watch();
        /* the operator's writes leave every 500 ms too (no patch comes while the plant is paused); a quarter of the writable slots
           each time, in turn (sync.js o.slice: ~1/4 of the cost, every slot seen within 2 s). A patch coming in and an action still
           flush every slot first (eng.js), so no write is ever put under */
        E._fl = setInterval(() => {
          if (E.mode !== 'mirror' || !E.port) return;
          /* and the flags of AN every time (one small slot): the Run button is a write (AN.run), so a Run pressed while paused waited
             for its quarter, up to 2 s, before the engine started (mcc_valve DITL-30: the press came before the world ran) */
          const ops = AN.sync.patch(true, { slice: true }).concat(AN.sync.patch(true, { keys: ['fl'] }));
          if (!ops.length) return;
          try {
            E.port.postMessage({ t: 'op', ops, calls: [] });
            E.sent++;
          } catch (e) {
            E.err = e;
            if (E.onError) E.onError(e);
          }
        }, 500);
        ok(w);
      };
      go();
    });
  /* the whole state of the engine (for the checks: the mirror must be the same) */
  E.peek = () =>
    new Promise(r => {
      const id = Math.random().toString(36).slice(2);
      (E._kf = E._kf || {})[id] = r;
      E.flush();
      E.worker.postMessage({ t: 'kf', id });
    });
  if (want())
    addEventListener('load', () => {
      const go = () => (window.AN && AN.sheets && AN.sheets.length >= 54 && window.WORLD && WORLD.idx ? E.boot().catch(() => {}) : setTimeout(go, 500));
      setTimeout(go, 1000);
    });
})();
