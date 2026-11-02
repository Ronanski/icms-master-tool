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
    AN: ['reset', 'settle', 'loadStart', 'plantLoad150', 'plantCold', 'plantLoad150Async', 'plantColdAsync', 'plantSwitch', 'latchMode', 'setForce', 'turbine', 'field', 'oilValve', 'blowdown', 'stepSet', 'stepTier', 'actSet'],
    G: ['ditlStates'],
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
          post({ t: 'op', ops: [], calls: [[h + '.' + k, a]] });
          /* what the action changed here is the engine's too: taken as seen */
          if (G.AN.sync) G.AN.sync.patch();
          return r;
        };
      }
  };
  /* a message in */
  E.onMsg = async m => {
    E.got++;
    if (m.t === 'op') {
      if (m.ops && m.ops.length) G.AN.sync.apply(m.ops);
      for (const [n, a] of m.calls || []) {
        const f = fnOf(n);
        if (!f) continue;
        inCall++;
        try {
          const r = f.apply(holder(n.split('.')[0]), a);
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
      /* the operator wins: a write not sent yet goes first */
      const mine = E.flush();
      G.AN.sync.apply(m.p, new Set(mine.map(x => x[0])));
      if (E.onPatch) E.onPatch(m);
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
  E.send = () => {
    if (E.mode !== 'engine' || !G.AN || !G.AN.sync) return 0;
    const p = G.AN.sync.patch();
    if (p.length) post({ t: 'patch', p });
    return p.length;
  };
  E.stop = () => {
    E.mode = 'local';
    E.port = null;
  };
})(typeof window !== 'undefined' ? window : globalThis);
