/* ===== ENGINE SCHEDULER (P3, user 2026-11-01 "T1, 3": time-slicing; the one place where the simulation is run) =====

   SCAN GROUPS (fixed list, fixed order; nothing else steps the simulation on a timer):

   | # | group      | every  | what one job does (the same code as before, as a generator that yields after each sheet)            |
   |---|------------|--------|-----------------------------------------------------------------------------------------------------|
   | 1 | ABC        | 100 ms | the set of the current ABC sheet (links.js stepSetG / stepTierG): links -> procRemote -> shareExt ->  |
   |   |            |        | anStep of each sheet. The PLANT MODEL (unit.js anUnitStep) runs inside anStep of ABC-001C, as before. |
   |   |            |        | After each step the Training coach (AN.onStep); at the end the drawing / panel paint (Logic page)    |
   | 2 | DITL world | 200 ms | one scan of the one world (world.js WORLD.scanJob -> tickG): inputs of every DITL sheet -> plantIn ->|
   |   |            |        | simSheet + timers / MOV / motors of each sheet -> FIRST-OUT events -> W.out -> DITL -> ABC inputs    |

   Rules:
   - A job runs in slices of at most SLICE ms; the page paints between the slices. Jobs never mix: one job ends before the next
     starts, in the order they were queued (ABC -> DITL as the timers come).
   - A group whose last job is still running skips its timer; the time goes into its next job (as a speed above 1x did).
   - A synchronous step (stepSet / stepTier / WORLD.tick: a faceplate A / M / R / SV / MV, a force, a starting state, the tests)
     first finishes what is queued (flush). A step called from inside a running job (the Training coach) runs at once.
   - The result of a step is the same as before: the generators are the old step functions, cut at the sheet boundaries. */
const AN_SLICE = 4; /* ms */
AN.sched = (() => {
  const Q = [],
    mc = new MessageChannel();
  let busy = false,
    posted = false;
  const end = j => {
    if (j.end)
      try {
        j.end(j);
      } catch (e) {
        console.error(e);
      }
  };
  const post = () => {
    if (!posted) ((posted = true), mc.port2.postMessage(0));
  };
  function pump() {
    posted = false;
    if (busy) return;
    busy = true;
    const t0 = performance.now();
    try {
      while (Q.length && performance.now() - t0 < AN_SLICE) {
        const j = Q[0],
          t1 = performance.now();
        let r;
        try {
          r = j.g.next();
        } catch (e) {
          console.error(e);
          r = { done: true };
        }
        j.cpu += performance.now() - t1;
        if (r.done) (Q.shift(), end(j));
      }
    } finally {
      busy = false;
    }
    if (Q.length) post();
  }
  mc.port1.onmessage = pump;
  return {
    add(key, g, fin) {
      Q.push({ key, g, end: fin, cpu: 0 });
      post();
    },
    has: key => Q.some(j => j.key === key),
    flush() {
      if (busy) return;
      busy = true;
      try {
        while (Q.length) {
          const j = Q.shift(),
            t1 = performance.now();
          try {
            while (!j.g.next().done);
          } catch (e) {
            console.error(e);
          }
          j.cpu += performance.now() - t1;
          end(j);
        }
      } finally {
        busy = false;
      }
    },
    get size() {
      return Q.length;
    }
  };
})();

/* group 1: ABC */
let anAcc = 0;
/* 3.2.0 Web Worker (src/world/eng.js): when the engine runs in the worker, the page steps nothing (it is the mirror) */
const anMirror = () => !!(window.ENG && ENG.mode === 'mirror');
setInterval(() => {
  if (!live() || !AN.run || AN._loading || anMirror()) {
    anAcc = 0;
    return;
  }
  const sh = cs();
  if (!sh || !sh.S) return;
  anAcc += 0.1 * AN.spd;
  if (AN.sched.has('abc')) return;
  const dt = anAcc,
    n = Math.max(1, Math.ceil(dt / 0.5));
  anAcc = 0;
  histRec(sh, 1);
  const K = AN.tierK || 1;
  AN.sched.add(
    'abc',
    (function* () {
      for (let i = 0; i < n; i++) {
        if (K > 1) yield* stepTierG(sh, dt / n, K);
        else yield* stepSetG(sh, dt / n);
        /* 3.2.0-beta.21: the Training coach (src/ui/training/guide.js) acts after each step, at the time of the plant */
        if (AN.onStep)
          try {
            AN.onStep(dt / n);
          } catch (e) {}
      }
    })(),
    j => {
      /* the drawing and the side panel are painted only while the Logic page shows them (interaction.js anShown); elsewhere only
         the trends and the hooks run, and the drawing is painted when it comes back */
      if (anShown()) {
        AN._pStale = 0;
        paint();
        panelUpd();
      } else {
        AN._pStale = 1;
        panelUpd(false, true);
      }
      /* the tiers: the CPU time of the step (its slices), not the time between them */
      const ms = j.cpu;
      AN._ms = AN._ms == null ? ms : AN._ms * 0.85 + ms * 0.15;
      if (!AN.tierLock && (AN._tn = (AN._tn || 0) + 1) % 10 === 0) {
        const k = AN.tierK || 1;
        AN.tierK = AN._ms > 35 ? Math.min(6, k + 1) : AN._ms < 14 ? Math.max(1, k - 1) : k;
      }
    }
  );
}, 100);

/* group 2: DITL world */
setInterval(() => {
  const W = window.WORLD;
  if (!W || !W.scanJob || AN.sched.has('world') || anMirror()) return;
  const g = W.scanJob();
  if (g) AN.sched.add('world', g);
}, 200);
/* for the checks (the recorder that proves a sliced step = a step at once) */
AN.stepSetG = stepSetG;

/* the mirror after each patch of the engine: what a job of the page painted (the drawing, the panel, the trends, the DITL page) */
AN.patchPaint = () => {
    const sh = cs();
    if (sh && sh.S) histRec(sh, 1);
    if (anShown()) {
      AN._pStale = 0;
      paint();
      panelUpd();
    } else {
      AN._pStale = 1;
      panelUpd(false, true);
    }
    if (window.WORLD && WORLD.paintNow) WORLD.paintNow();
};
