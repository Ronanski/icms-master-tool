/* DOCK PRESS (3.2.0 Web Worker, stage c): the push button and the maintained selection of a DITL input row, pressed by the Training
   dock, the guide, the faceplate and the TCS (WORLD.dpress / WORLD.dset). No DOM. The press is held for two scans of the one world (and
   1.5 s of plant) and released after a scan (WORLD.onTick): the scans run in the engine, so the hold is engine state, kept in the world
   (WORLD._press, WORLD._rel: by sheet name, plain JSON, a slot of the DITL keyframe) and not in the page. Both are engine actions (ENG
   calls): they run on the page at once and in the engine. Before: src/ui/training/dock.js hold / dset (3.2.0-beta.23). */
(function (G) {
  const W = G.WORLD;
  if (!W) return;
  const all = () => (typeof S !== 'undefined' && S.sheets ? S.sheets.concat(W.inst || []) : []);
  /* a drawing by its name, machine A, or an instance "DITL-09 #B" (the same name first) */
  const sheet = nm => {
    const L = all(),
      n = String(nm).split('@')[0];
    return L.find(x => x.name === n) || L.find(x => x.name.endsWith(n)) || null;
  };
  const press = () => W._press || (W._press = {});
  const rel = () => W._rel || (W._rel = {});
  const live = () => !!(W.on && W.live);
  /* one press of a push button row: held for two scans of the one world (and 1.5 s) and released (the drawing starts on the pulse); a press
     while it is held is the same press. In scans (simulation time), not in milliseconds: at x300 a 0.8 s press was 4 minutes of
     plant and a press again within 3 s (15 minutes) was lost (the batch firing of the coal feeder, 10 s ON / 60 s OFF) */
  function hold(s, k) {
    const id = s.name + '|' + k,
      P = press(),
      R = rel();
    if (P[id]) return true;
    /* a press again right after the release (no scan saw the button open between them) is no new edge: the START pulse of the drawing
       never came and the coal feeder C never started while the guide pressed it every frame at x300. It waits one scan */
    const wait = R[id] != null && (W.tk || 0) - R[id] < 1;
    P[id] = { nm: s.name, k, tk: W.tk || 0, wait, age: 0 };
    if (!wait) s.sig[k] = true;
    W.busy = true;
    return true;
  }
  /* after each scan of the one world */
  function release(dt) {
    const P = W._press;
    if (!P) return;
    const R = rel(),
      L = all();
    for (const j of Object.keys(P)) {
      const p = P[j],
        s = L.find(x => x.name === p.nm);
      if (!s) {
        delete P[j];
        continue;
      }
      if (p.wait) {
        if ((W.tk || 0) - R[j] >= 1) {
          p.wait = false;
          p.tk = W.tk || 0;
          s.sig[p.k] = true;
          W.busy = true;
        }
        continue;
      }
      p.age = (p.age || 0) + (dt || 0);
      /* at least 1.5 s of plant too: a motor seals in through its running feedback (0.5 s) while START is held */
      if ((W.tk || 0) - p.tk >= 2 && p.age >= 1.5) {
        s.sig[p.k] = false;
        R[j] = W.tk || 0;
        delete P[j];
      }
    }
  }
  /* a push button row of a DITL drawing pressed (hold); false without the one world running */
  W.dpress = (nm, row) => {
    const s = sheet(nm);
    if (!s || !live()) return false;
    return hold(s, row + ':S');
  };
  /* a maintained selection of a DITL input row (the AUTO MODE of a shut-off valve chosen on the CRT, DITL-32 row 5 M.1012): stays until changed */
  W.dset = (nm, row, v) => {
    const s = sheet(nm);
    if (!s || !live()) return false;
    s.sig[row + ':S'] = !!v;
    W.busy = true;
    return true;
  };
  W.onTick = release;
  /* the radio: both run in the engine too (src/world/eng.js, wrapped at ENG.start) */
  if (G.ENG && G.ENG.CALLS && G.ENG.CALLS.WORLD) for (const k of ['dpress', 'dset']) if (!G.ENG.CALLS.WORLD.includes(k)) G.ENG.CALLS.WORLD.push(k);
})(typeof window !== 'undefined' ? window : globalThis);
