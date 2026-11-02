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
    E.stop();
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
        if (m.t === 'ready') return ok(w);
        if (m.t === 'kf') {
          const r = E._kf && E._kf[m.id];
          if (r) delete E._kf[m.id], r(m);
          return;
        }
        if (m.t === 'error') return fail(m.where || 'engine', m.text);
        if (m.t === 'msg') {
          if (typeof msg === 'function') msg(m.text);
          return;
        }
        E.onMsg(m).catch(e => fail('page', e.message));
      };
      /* the page as it is now: every ABC sheet built (the slots of both sides are the same list), its keyframe */
      try {
        for (const sh of AN.sheets) AN.ensure(sh);
        if (window.WORLD && WORLD.build) WORLD.build();
        const kf = AN.engState.capture(),
          kd = ditlCapture();
        E.onPatch = () => AN.patchPaint && AN.patchPaint();
        E.start('mirror', w);
        /* the operator's writes leave every 100 ms too (no patch comes while the plant is paused) */
        E._fl = setInterval(() => E.mode === 'mirror' && E.flush(), 100);
        /* the DITL sheets of the page (with the user's fixes), the saved settings of the ABC (Reset applies them) */
        const ds = JSON.stringify(S.sheets, (k, v) => (k === 'nl' || k[0] === '_' ? undefined : v instanceof Set ? [...v] : v)); /* the _ keys: caches, links to instances (the keyframe carries the state ones) */
        w.postMessage({ t: 'init', apre: txt('apre'), ades: txt('ades'), ds, sv: AN.sv || {}, lne: AN.lne || {}, kf, kd, i: AN.i });
      } catch (e) {
        fail('init', e.message);
        no(e);
      }
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
