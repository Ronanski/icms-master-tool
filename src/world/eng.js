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
    AN: ['reset', 'settle', 'loadStart', 'plantLoad150', 'plantCold', 'plantLoad150Async', 'plantColdAsync', 'plantSwitch', 'latchMode', 'turbine', 'field', 'oilValve', 'blowdown', 'stepSet', 'stepTier', 'actSet', 'stepN', 'stepBack', 'clock0'],
    G: ['ditlStates', 'ditlUser'],
    DITL150: ['apply'],
    WORLD: ['tick', 'set']
  };
  /* the long actions run in the engine ONLY (user 2026-11-02 "Worker n. Lhat n"): on the page they took seconds (Start at 150 MW
     ~10 s) and froze the screen. The page sends them and gets a promise; it resolves when the engine is done and its whole state is
     on the page. The short ones (settle, A / M / R, SV, MV, a valve, a press: ~0.1 s) run on both sides: an answer at once */
  const HEAVY = new Set(['AN.reset', 'AN.loadStart', 'AN.plantLoad150', 'AN.plantCold', 'AN.plantLoad150Async', 'AN.plantColdAsync', 'DITL150.apply']);
  const waits = new Map();
  let nid = 0;
  const own = (o, k) => o && typeof o[k] === 'function';
  const E = (G.ENG = { mode: 'local', port: null, CALLS, sent: 0, got: 0, err: null });
  E.HEAVY = HEAVY;
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
          if (HEAVY.has(h + '.' + k)) {
            /* the page part of a starting state (hmi-op.js anLoadStart): a load picked anywhere closes the starting-state question */
            if (k === 'loadStart')
              try {
                const q = G.document && G.document.getElementById('lsask');
                if (q) q.remove();
              } catch (x) {}
            const id = ++nid;
            E.heavy = (E.heavy || 0) + 1;
            post({ t: 'op', ops: [], calls: [[h + '.' + k, G.AN.sync.encArgs ? G.AN.sync.encArgs(a) : a]], id });
            /* the page part of the action (f.after, e.g. loader.js reset: anSave, the panel, the message), once the engine state is in */
            const after = f.after;
            const self = this;
            return new Promise(ok => {
              const w = r => {
                if (after)
                  try {
                    after(r);
                  } catch (x) {}
                ok(r);
              };
              /* the worker stopped before its answer (E.stop): the page runs the action itself, with its own page part */
              w.local = () => {
                let r;
                try {
                  r = f.apply(self, a);
                } catch (x) {}
                Promise.resolve(r).then(ok, () => ok(null));
              };
              waits.set(id, w);
            });
          }
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
  /* a yield to the browser (a frame can be drawn): a MessageChannel message, not a timer (a timer waits 4 ms or more) */
  if (typeof G.MessageChannel === 'function' && typeof G.document !== 'undefined') {
    const ch = new G.MessageChannel(),
      q = [];
    ch.port1.onmessage = () => q.length && q.shift()();
    E.yieldNow = () => new Promise(r => (q.push(r), ch.port2.postMessage(0)));
  }
  /* the page takes the messages of the engine one after the other (a patch in slices ends before the next one) */
  let chain = Promise.resolve();
  E.take = m => (chain = chain.catch(() => {}).then(() => E.onMsg(m)));
  E.onMsg = async m => {
    E.got++;
    E.lastAt = Date.now(); /* the time of the last message from the other side (the watchdog, src/world/eng-watch.js) */
    /* the heartbeat: a ping of the page gets a pong from the engine (the engine answers between its jobs: a hung engine does not) */
    if (m.t === 'ping') return void post({ t: 'pong', id: m.id });
    if (m.t === 'done') {
      const ok = waits.get(m.id);
      waits.delete(m.id);
      E.heavy = Math.max(0, (E.heavy || 0) - 1);
      if (ok) ok(m.r);
      return;
    }
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
          let r = f.apply(holder(n.split('.')[0]), a && a.$j != null ? G.AN.sync.decArgs(a) : a);
          if (r && typeof r.then === 'function') r = await r;
          E._last = r;
        } catch (e) {
          if (G.console) console.error('ENG ' + n, e);
          /* not silent: the page stops the worker and runs the engine itself (eng-page.js fail), as for an error of a scan (Giselle) */
          if (E.mode === 'engine') post({ t: 'error', where: n, text: String((e && e.stack) || e) });
        } finally {
          inCall--;
        }
      }
      /* after an action the next patch carries everything: the page is the engine again, whatever its run of the action gave */
      if ((m.calls || []).length && E.mode === 'engine' && G.AN.sync.forget) G.AN.sync.forget();
      /* a long action of the page: its whole state now (no gap, no ack), then its answer */
      if (m.id != null && E.mode === 'engine') {
        E.wait = false;
        E._ls = 0;
        E.send();
        /* this one waits for no ack: what the next messages change goes at once */
        E.wait = false;
        let r = E._last;
        try {
          r = structuredClone(r);
        } catch (x) {
          r = null;
        }
        post({ t: 'done', id: m.id, r });
      }
    } else if (m.t === 'patch') {
      if (E.busy) {
        /* an action of the page still runs: the full state comes after it; its events wait */
        (E.evHeld = E.evHeld || []).push(...(m.ev || []));
        return void post({ t: 'ack' });
      }
      m.ev = (E.evHeld || []).concat(m.ev || []);
      E.evHeld = [];
      /* the operator wins: a write not sent yet goes first */
      /* every writable slot, not only the ones this patch carries (Ningning's sync.js keys, tried in 390e423): an operator write the engine
         did not touch in this scan (a DITL push button, an input switch) then waited for the 500 ms flush (up to 2 s in slices), too slow
         for a press; the whole flush is ~5 ms at 6x, twice a second (eng_radio_ningning: a write leaves with the next patch) */
      const mine = E.flush(),
        skip = new Set(mine.map(x => x[0]));
      /* in slices of at most 4 ms, the page draws between them (a patch at once took ~100 ms at 6x: the long frames of the 038 page,
         Ningning's trace); no slices where there is no MessageChannel (the node tests: at once) */
      if (E.yieldNow && m.p.length > 8) {
        let i = 0;
        while (i < m.p.length) {
          const t0 = performance.now();
          do G.AN.sync.apply([m.p[i++]], skip);
          while (i < m.p.length && performance.now() - t0 < 4);
          if (i < m.p.length) await E.yieldNow();
        }
      } else G.AN.sync.apply(m.p, skip);
      /* the paint after it: an error of the paint is the page's (local mode: the same paint error stops nothing), not of the data,
         so it does not stop the worker (Winter: eng-page.js fail('page') took the whole engine back for a paint error) */
      if (E.onPatch)
        try {
          E.onPatch(m);
        } catch (x) {
          if (G.console) console.error('ENG paint', x);
        }
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
    /* a long action still waiting for the worker (Reset, a starting state) would never answer: it runs here now (the page is the engine) */
    const left = [...waits.values()];
    waits.clear();
    E.heavy = 0;
    for (const w of left) if (w.local) w.local();
  };
})(typeof window !== 'undefined' ? window : globalThis);
