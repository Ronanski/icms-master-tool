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
