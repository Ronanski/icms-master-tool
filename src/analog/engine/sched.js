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

/* group 1: ABC. Speed (user 2026-11-03, Mina M23: the Plant view reached x110 ~ 120 before P3 and x55 ~ 68 after): the step runs at once,
   as before 18f7a64 (interaction.js), not in 4 ms slices of the queue; the queue (AN.sched) stays for the long actions and flush */
const anMirror = () => !!(window.ENG && ENG.mode === 'mirror');
/* M32 (user 2026-11-03: "x300 na 6 h, 1.2 min nalang"): the plant time of a tick is the REAL time since the last tick x the speed
   (anTick), not a fixed 0.1 s: a tick that took longer than 100 ms (x300 = 60 steps) lost the rest, so x300 ran about x100.
   anSteps: the steps of a tick, 0.5 s each up to 20 a tick, then longer steps (at most 2 s) so that a tick stays short. The same in
   the Web Worker (src/world/eng-host.js) */
let anLastT = 0;
const anTick = () => {
  const now = performance.now(),
    el = anLastT ? Math.min((now - anLastT) / 1000, 2) : 0.1;
  anLastT = now;
  return el * (AN.spd || 1);
};
/* M32 (the real site: Training, its sheets and the dock): the steps of a tick are the ones that fit in about 80 ms of CPU (AN._ms = the time
   of one step, measured), 0.5 s each when there is time, longer when not, never longer than 3 s (was: at most 20 a tick of up to 2 s: on
   the full Training a step cost more and x300 ran x225 ~ 240) */
const anSteps = dt => {
  const want = Math.ceil(dt / 0.5),
    fit = Math.max(1, Math.floor(80 / (AN._ms > 0 ? AN._ms : 2)));
  return Math.max(1, Math.min(want, Math.max(fit, Math.ceil(dt / 3))));
};
AN.anSteps = anSteps;
setInterval(() => {
  if (!live() || !AN.run || AN._loading || anMirror()) return void (anLastT = 0);
  const sh = cs();
  if (!sh || !sh.S) return;
  const dt = anTick(),
    n = anSteps(dt);
  histRec(sh, 1);
  const t0_ = performance.now(),
    K = AN.tierK || 1;
  for (let i = 0; i < n; i++) {
    if (K > 1) stepTier(sh, dt / n, K);
    else stepSet(sh, dt / n);
    /* 3.2.0-beta.21: the Training coach (src/ui/training/guide.js) acts after each step, at the time of the plant */
    if (AN.onStep)
      try {
        AN.onStep(dt / n);
      } catch (e) {}
  }
  /* speed (user 2026-11-01, 6x CPU): the drawing and the side panel are painted only while the Logic page shows them; on Home,
     Training or a plant page only the trends and the hooks run (a faceplate, the plant window), and the drawing is painted when it
     comes back (anShown) */
  if (anShown()) {
    AN._pStale = 0;
    paint();
    panelUpd();
  } else {
    AN._pStale = 1;
    panelUpd(false, true);
  }
  {
    /* M32: the light mode (tierK) is judged on the time of ONE step, not of the tick: at x300 a tick is 20 steps (~100 ms), so the
       tick time raised tierK to 6, and the tier stepping cost more than it saved (measured on the PC: x300 at tierK 1 = x308, at 6 = x157) */
    const ms = (performance.now() - t0_) / n;
    AN._ms = AN._ms == null ? ms : AN._ms * 0.85 + ms * 0.15;
    if (!AN.tierLock && (AN._tn = (AN._tn || 0) + 1) % 10 === 0) {
      const k = AN.tierK || 1;
      AN.tierK = AN._ms > 35 ? Math.min(6, k + 1) : AN._ms < 14 ? Math.max(1, k - 1) : k;
    }
  }
}, 100);

/* group 2: DITL world, one whole scan every 200 ms as before 18f7a64 (world.js setInterval): the scan job run to the end at once */
setInterval(() => {
  const W = window.WORLD;
  if (!W || !W.scanJob || anMirror()) return;
  const g = W.scanJob();
  if (!g) return;
  AN.sched.flush();
  for (const _ of g);
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
