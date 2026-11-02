# Review of C1 (a2357e8, Lisa: HEAVY actions in the engine only) — Giselle, 2026-11-02 ~4:50 PM PHT (code reading only, no run)
In mirror mode a HEAVY call (AN.reset, loadStart, plantLoad150, plantCold, the Async forms, DITL150.apply) no longer runs on the page:
it returns a Promise and the page state comes later with the patch. Callers that use the result or read / step the state right after:

## 1. Reset loses its page part (BUG, the most important)
`src/analog/data/loader.js` reset() is the page AN.reset; the engine form (`tools/build/engine-bundle.js` 30) is only
`anResetAll(); 6 x stepSet`. In mirror mode now only the engine form runs, so these parts of Reset are gone:
- `DITL150.clear()` (retest #68: a motor started by hand is stopped by Reset): NOT in the engine form -> after Reset in the worker the
  DITL keeps the motors / 150 MW state (the engine never clears it; the page does not run it). Fix: engine hook
  `AN.reset=()=>{anResetAll();try{if(globalThis.DITL150)DITL150.clear()}catch(e){};...}`, or run reset's DITL / sv part in the engine.
- `AN.sv` cleanup (keep only the block settings) + `anSave()` (localStorage): not done -> the saved forces / values / switches of the
  user stay and come back (applySaved on ensure / the next start). AN.sv is a writable slot, so doing the cleanup in the engine form
  brings it to the page; the anSave must stay on the page (after the promise).
- the page UI: `AN.sel = null`, selBox, buildPanel, paint, panelUpd(true), the toast "Reset done: ..." -> not shown.
Suggestion: the wrap of a HEAVY call runs a page epilogue after the promise (for reset: the sv cleanup + anSave + UI + msg), or reset
keeps a page part split from the engine part (like loadStart's lsask).

## 2. Callers that step / read the state at once (mirror mode only; local mode unchanged)
| caller | what breaks |
|---|---|
| `src/analog/ui/interaction.js` 337-346 (Reset button) | `AN.reset();` then `coldIfNone(() => { AN.settle(); paint(); panelUpd(true) })`: runs on the old state (repaired by the patch later); with item 1 the panel is not rebuilt. Should `.then(...)`. |
| `src/ui/shell/app.js` 1593 | `const r = DITL150.apply(); if (r) msg(...)`: r is now a Promise (always truthy): the "DITL in service (MFT reset)" message shows even if apply did nothing. `await` / `.then(r => ...)`. (The loadStart .then above it is right: it waits.) |
| `src/ui/training/guide.js` 1211 | OK: `AN.loadStart('cold').then(go2)` waits. (The fallback without loadStart: reset + plantCold sync, not used.) |
| `src/ui/uat/check.js` 3079-3082 (CHECK runner) | `AN.reset(); AN.plantCold()/plantLoad150();` then at once `stages[0].run(h,o)` and the loop of `AN.stepSet` + reads of the page values: the page steps and judges the state BEFORE the load (the engine is right, the page verdicts are wrong). |
| `src/ui/uat/runner.js` 46 | `AN.reset(); plantOff(); S.rt.force = {}` + steps + reads at once: the same. |
| `src/ui/uat/scen.js` 78, 157-158, 161, 383, 397, 458, 723-724, 766-767, 1114 | reset / plantLoad150 then steps / reads at once (78: `await sleep(1200)`, Start at 150 MW takes 10-40 s): the same. |
| `src/ui/uat/uat-ui.js` 75, 549 | reset at the end of a run, result not used: OK. |
| `src/digital/parts/03b-sim.js` 823 | DITL150.apply inside the DITL reset: runs inside a wrapped call (inCall) = local: OK. |
Suggestion for the CHECK / UAT runners (they step thousands of times and read at once): run them with the engine of the page (ENG.mode
'local' for the run, or stop the worker first), or await every HEAVY call and step through the engine. My files (uat/*, interaction.js):
I can make the change once you choose.

## 3. Note
- eng-watch.js: my ping / pong version (local 4bb8e2f, NOT for merge) is superseded by your 5dbd645 (the watchdog in eng-page.js).
  Do not take it: two watchdogs. Not run (TEST_LOCK).
