/* ENG (3.2.0 Web Worker, stage c): the radio between the page and the engine. No DOM.
   The page keeps a MIRROR of the engine (the same objects the UI reads); the engine runs in the worker. One port, two kinds of
   message:
   - page -> engine {t:'op', ops, calls}: ops = the operator's writes, found by AN.sync.patch(true) (inputs, forces, the output of a
     MAN station, DITL inputs and switches, the flags of AN: the write sites of the UI stay as they are); calls = the engine actions
     [name, args] (Reset, settle, a starting state, a mode press, a FORCE, the turbine, the field equipment ...). An action runs on the
     page too, at once (the mirror is the engine at the last patch: the same code gives the same result, and the caller gets its
     return value), and in the engine after the ops before it.
   - engine -> page {t:'patch', p}: what the engine changed (AN.sync.patch()); the page puts it in, but not over a write of the
     operator that has not reached the engine yet.
   ENG.mode 'local' (no worker: every call runs here only, as before) or 'mirror' (page) / 'engine' (worker). */
(function (G) {
  /* the engine actions: names on AN (engine/api.js and the page hooks), DITL (src/digital/parts), WORLD / DITL150 */
  const CALLS = {
    /* not setForce: a page function (ui/panel.js), its force goes as a write and its settle as an action */
    AN: ['reset', 'settle', 'loadStart', 'plantLoad150', 'plantCold', 'plantLoad150Async', 'plantColdAsync', 'plantSwitch', 'latchMode', 'turbine', 'field', 'oilValve', 'blowdown', 'stepSet', 'stepTier', 'actSet', 'stepN', 'stepBack'],
    G: ['ditlStates', 'ditlUser'],
    DITL150: ['apply'],
    WORLD: ['tick', 'set']
  };
  const own = (o, k) => o && typeof o[k] === 'function';
  const E = (G.ENG = { mode: 'local', port: null, CALLS, sent: 0, got: 0, err: null });
  let inCall = 0;
  const holder = h => (h === 'AN' ? G.AN : h === 'G' ? G : G[h]);
  /* the action by its name "AN.reset", "G.ditlStates", "DITL150.apply" */
  const fnOf = n => {
    const [h, k] = n.split('.');
    const o = holder(h);
    return o && (o['__eng_' + k] || o[k]);
  };
  const post = m => {
    try {
      E.port.postMessage(m);
      E.sent++;
    } catch (e) {
      E.err = e;
      if (E.onError) E.onError(e);
    }
  };
  /* the operator's writes since the last patch, to the engine */
  E.flush = () => {
    if (E.mode !== 'mirror' || !G.AN || !G.AN.sync) return [];
    const ops = G.AN.sync.patch(true);
    if (ops.length) post({ t: 'op', ops, calls: [] });
    return ops;
  };
  /* the actions are wrapped once: page = run here + send; engine = run (the worker calls them from its messages) */
  E.wrap = () => {
    for (const h in CALLS)
      for (const k of CALLS[h]) {
        const o = holder(h);
        if (!own(o, k) || o['__eng_' + k]) continue;
        const f = o[k];
        o['__eng_' + k] = f;
        o[k] = function (...a) {
          if (E.mode !== 'mirror' || inCall) return f.apply(this, a);
          /* the writes before the action first (a value typed, then settle) */
          E.flush();
          inCall++;
          let r;
          try {
            r = f.apply(this, a);
          } finally {
            inCall--;
          }
          /* the arguments by their refs (a sheet or a block as its index: a copy would be another object in the engine) */
          post({ t: 'op', ops: [], calls: [[h + '.' + k, G.AN.sync.encArgs ? G.AN.sync.encArgs(a) : a]] });
          /* an action that goes on (a starting state loads in slices): no patch is put in while it runs here (it would mix two states);
             then the whole state of the engine is asked for once */
          if (r && typeof r.then === 'function') {
            E.busy = (E.busy || 0) + 1;
            const done = () => {
              E.busy--;
              if (!E.busy) post({ t: 'full' });
            };
            r.then(done, done);
            return r;
          }
          /* what the action changed here is the engine's too: taken as seen */
          if (G.AN.sync) G.AN.sync.patch();
          return r;
        };
      }
  };
  /* a message in */
  E.onMsg = async m => {
    E.got++;
    if (m.t === 'ack') {
      E.wait = false;
      if (E.owed) (E.owed = false), E.send();
      return;
    }
    /* the page asks for the whole state (after its own long action) */
    if (m.t === 'full') {
      if (G.AN.sync.forget) G.AN.sync.forget();
      return;
    }
    if (m.t === 'op') {
      if (m.ops && m.ops.length) G.AN.sync.apply(m.ops);
      for (const [n, a] of m.calls || []) {
        const f = fnOf(n);
        if (!f) continue;
        inCall++;
        try {
          const r = f.apply(holder(n.split('.')[0]), a && a.$j != null ? G.AN.sync.decArgs(a) : a);
          if (r && typeof r.then === 'function') await r;
        } catch (e) {
          if (G.console) console.error('ENG ' + n, e);
        } finally {
          inCall--;
        }
      }
      /* after an action the next patch carries everything: the page is the engine again, whatever its run of the action gave */
      if ((m.calls || []).length && E.mode === 'engine' && G.AN.sync.forget) G.AN.sync.forget();
    } else if (m.t === 'patch') {
      if (E.busy) {
        /* an action of the page still runs: the full state comes after it; its events wait */
        (E.evHeld = E.evHeld || []).push(...(m.ev || []));
        return void post({ t: 'ack' });
      }
      m.ev = (E.evHeld || []).concat(m.ev || []);
      E.evHeld = [];
      /* the operator wins: a write not sent yet goes first */
      const mine = E.flush();
      G.AN.sync.apply(m.p, new Set(mine.map(x => x[0])));
      if (E.onPatch) E.onPatch(m);
      for (const a of m.ev || [])
        try {
          if (E.onEvent) E.onEvent(a);
        } catch (x) {}
      post({ t: 'ack' });
    }
  };
  /* start: mode 'mirror' (page) or 'engine' (worker), port = the other side (postMessage / onmessage) */
  E.start = (mode, port) => {
    E.mode = mode;
    E.port = port;
    E.wrap();
    if (G.AN && G.AN.sync) G.AN.sync.mark();
  };
  /* engine: after a job, what changed to the page */
  /* flow: the next patch only after the page has put the last one in (ack): a slow page (a phone, 6x) never gets a queue; what changes
     meanwhile is in the next patch (a patch is what changed since the last one sent) */
  E.send = () => {
    if (E.mode !== 'engine' || !G.AN || !G.AN.sync) return 0;
    if (E.wait) return void (E.owed = true), 0;
    /* at most 2 patches a second (a DCS screen shows new values about once a second): at 6x one patch carries several scans */
    const now = Date.now();
    const gap = E.gap == null ? 500 : E.gap;
    if (now - (E._ls || 0) < gap) {
      E.owed = true;
      /* sent when the gap is over, also while the plant is paused (no job comes to send it) */
      if (!E._tm) E._tm = setTimeout(() => ((E._tm = null), E.owed && ((E.owed = false), E.send())), gap - (now - (E._ls || 0)));
      return 0;
    }
    E._ls = now;
    const p = G.AN.sync.patch(),
      ev = E.evq || [];
    if (p.length || ev.length) {
      post({ t: 'patch', p, ev });
      E.evq = [];
      E.wait = true;
    }
    return p.length + ev.length;
  };
  E.stop = () => {
    E.mode = 'local';
    E.port = null;
  };
})(typeof window !== 'undefined' ? window : globalThis);
