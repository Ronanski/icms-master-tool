/* ===== TRACE STEPS (3.2.0 Web Worker, stage c): Next ▶ and ◀ Back of the ABC sheet (ui/trace.js) as ONE engine action each, so the
   radio (src/world/eng.js) sends one call, not one per step. The sheet goes by its NAME (a sheet object would reach the worker as a
   copy). No page access. ===== */
const anShByName = n => AN.sheets.find(s => s.name === n);
/* Next ▶: n steps of dt of the sheet (and its set) */
function anStepN(name, n, dt) {
  const sh = anShByName(name);
  if (!sh || !sh.S) return;
  for (let i = 0; i < n; i++) stepSet(sh, dt);
}
/* ◀ Back: the run time of each sheet of the set as it was (the history of the page: names, rt), then steps up to the time tg */
function anStepBack(names, rts, name, tg) {
  names.forEach((nm, i) => {
    const x = anShByName(nm);
    if (!x || !x.S) return;
    x.S.rt = structuredClone(rts[i]);
    x.S._tk = null;
    x.S._dk = null;
  });
  const sh = anShByName(name);
  if (!sh || !sh.S) return;
  let rem = tg - sh.S.rt.t;
  while (rem > 1e-6) {
    const d = Math.min(rem > 10 ? 0.25 : 0.1, rem);
    stepSet(sh, d);
    rem -= d;
  }
}
/* the plant time (Mina #M29, 2026-11-03): every sheet keeps its own rt.t and runs only while it is in the set that is stepped, so
   a sheet that joins the set later (ABC-053 opened by the TICLO1002 control at 25:20) is at 0:14. The time the operator sees (status
   bar, Event log, the alarm table) is the plant's: the latest time of any sheet; it goes back only when every sheet does (clock0,
   a starting state) */
function anPlantT() {
  let t = 0;
  for (const sh of AN.sheets || []) if (sh.S && sh.S.rt && sh.S.rt.t > t) t = sh.S.rt.t;
  return t;
}
/* The clock of the sheets back to 0 and their trends emptied (the Training: "the start-up begins at t = 0", walkthrough #1; was done
   by src/ui/training/guide.js on the page only: the run time t and the plant-model trends are not writable slots, so the engine kept
   its clock; Winter's finding). An engine action: it runs in the engine and on the page (src/world/eng.js CALLS). */
function anClock0() {
  for (const sh of AN.sheets)
    if (sh.S && sh.S.rt) {
      const rt = sh.S.rt;
      rt.t = 0;
      for (const k in rt.pm || {}) if (rt.pm[k] && Array.isArray(rt.pm[k].h)) rt.pm[k].h = [];
      for (const k in rt.st || {}) if (rt.st[k] && Array.isArray(rt.st[k].h)) rt.st[k].h = [];
    }
}
