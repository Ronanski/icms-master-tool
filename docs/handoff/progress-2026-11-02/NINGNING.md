# NINGNING: progress (save progress / PAUSE, 2026-11-02 ~5:15 PM PHT)

Role: helper of Lisa (Code Fixer) on the Worker (engine in a Web Worker) and on fps. Worktree: `.claude/worktrees/worker-c-ningning-d60ba2`.
All branches below are PUSHED (none to main). No TEST_LOCK held, no own process running.

## 1. Done, in order (2026-11-02)

| PHT | Branch @ commit (base) | What | Result |
|---|---|---|---|
| ~2:15 PM | `claude/worker-c-ningning` @ 6fd71cb → rebased **9bc2e06** (079ef8d → 1b2583c) | Worker stage (c), DITL view / panels / Library. NEW `src/digital/parts/03e-user.js`: `ditlUser(name, op, ...)` engine action (timer preset 'tm', Skip 'skip', MOV stroke 'mvt', MOV LOCAL/REMOTE 'lr', motor delay 'mtd', kept values 'uv'), `simRead(s)` (on the page mirror: the engine's last scan, read only; elsewhere simSheet). 06-panels / ditl.js Skip / 05 uvApply → ditlUser; 04-render / ditl.js values() / ladder.js → simRead; 07 page DITL step off in mirror mode. Test `tests/regress/eng_radio_ningning.js` (A engine, B mirror, C local reference) | All DITL clicks + panel actions A=B=C, 0 diff. Page tests ditl_sim, ditl_selected, ditl150, ditl_sb, abc_ditl_links, fx_page ALL PASS. Merged by Lisa in 8a3f850 |
| ~3:00 PM | `claude/worker-d-ningning` @ **5e5db74** (8a3f850) | 03c-read.js D.why / need / rowVal / outVal: simSheet → simRead (Winter's finding: a read changed the nets on the mirror) + reader check in eng_radio_ningning | eng_radio_ningning, eng_radio, eng_worker ALL PASS; with the old 4 lines the reader check fails (10 diff) |
| ~3:40 PM | `claude/fps-60-038-039` @ 5115fd1 + **16eec1d** (8a3f850) | 038 (hmi-aph.js) / 039 (hmi-bias.js): change-only writes (SA / ST); 038 flow lines of one fan/speed share one CSS variable for the dash offset | Look unchanged (screenshots before/after). Writes per 15 Hz tick: 038 setAttribute 100 → 59, textContent 5.8 → 3.2; 039 ~36 → 34. HSYM drive 038 88 → 48 ms/s, 039 52 → 41. Final fps NOT measured (busy PC) |
| ~4:15 PM | `claude/fps-shell` @ **cc986d9** (66a2a27) | app.js rulers tick 120 ms → 600 ms when calm (wake on press / wheel / key / resize / viewBox / crumb); viewlock.js mark: in RUN only removes old marks; view.js placeMap: cheap tests first, layout read only when the map can show | Rulers 25–28 → 14–19 ms/s, mark 19–22 → 12–16, placeMap 8–39 → ≤ 1. Local Checks (checks.yml) all OK, dist rebuilt in the commit |
| ~4:40 PM | `claude/worker-e-ningning` @ **6af358e** (f168a6c) | sync.js cheaper flush: `AN.sync.patch(true, {slice: true, parts: 4})` round-robin; `AN.sync.patch(true, {keys})` only named writable slots; no options = as before | Node bench 150 MW: whole 5.35 ms → slice 1.20 ms → keys(4) 0.05 ms; writes in ABC st + DITL sig found within 4 slices. eng_radio, _giselle, _ningning, _winter ALL PASS |

## 2. State now
- Pushed: worker-c-ningning 9bc2e06, worker-d-ningning 5e5db74, fps-60-038-039 16eec1d, fps-shell cc986d9, worker-e-ningning 6af358e.
- No uncommitted work. The status-chip task (below) was NOT started (no edits).

## 3. Open / not tested
- **C3 flush wiring (Lisa's files)**: eng.js / eng-page.js must call it. Interface agreed with Lisa (LISA.md RESUME HERE step 4):
  before putting a patch in: `mine = AN.sync.patch(true, { keys: <writable keys of the incoming patch> })` (so an unsent operator write is
  never put under); the 500 ms timer: `AN.sync.patch(true, { slice: true })`; the call wrapper: `patch(true)` (full) as before.
  Lisa's new base for C3: `claude/worker-fix-after-lt` @ a2357e8 / 5dbd645 (ENG.take, patch applied in slices): rebase 6af358e on it if
  she asks; sync.js only. Not tested: slice / keys inside eng.js / eng_worker (no caller yet).
- **038 / 039 final fps**: not measured (PC busy). Measure with Lisa's tool `side-session-notes/.../fps-tool/` (`WK=1 node fps.js <html>
  --pages APH,BIAS`), 8a3f850 vs 16eec1d back to back, only when Jennie says the PC is quiet.
- **Pre-existing FAILs on base 66a2a27 (not mine, same before/after)**: tests/regress/view.js 6 FAIL "tap on the map = zoom 2× there"
  (1280x800 ABC-010 VIEW/Run, 390x844 DITL-56 VIEW/Run, 390x844 ABC-010 VIEW/Run); tests/regress/view_run.js 1 FAIL "RUN: typing 333 in the
  side Inputs list sets AI0258" (TimeoutError). ladder.js 1 FAIL "all 248 DITL sheets translated" (test expects 241; same on base).
- Radio issues reported in stage (c) (findings note `side-session-notes/.../worker-c-ningning-findings.md`): DITL150.on not in keyframe;
  AN.lne / AN.ln (F(X) edits) not in a slot; 'ds' slot is one JSON per sheet (a page write can revert engine-written usw/_fd/avw: not
  shown at steady 150 MW). Check with Lisa which are done.

## 4. RESUME HERE (exact)
1. Next task in the queue (Jennie): **status chips change-only** on `claude/fps-shell` (after cc986d9): app.js `#stchip` (line ~507),
   `.sinfo` (~1070 setInterval 300 ms, and sinfoPut ~1363), `.cpath` (~1379), cr.js `#crband` (~49): write text / attributes only when they
   change (SA / ST idiom). Plus **Winter's hook** for app.js (Jennie OK'd): diff in `side-session-notes/.../winter-has-hook-app.js.diff`,
   insert after `window.lsSetTab = setTab;`: a MutationObserver on the class of #side and #dp (no subtree) → body classes side-open / dp-open
   (poll 500 ms until the elements exist). It MUST be merged together with Winter's app.css (b5261ec on claude/has-to-class) or the three
   rules break. Then local Checks (checks.yml steps) + relative ms/s (trace) under TEST_LOCK.
2. C3: when Lisa asks, rebase worker-e-ningning (sync.js) on her base and re-run all eng_radio*.js under TEST_LOCK.
3. Tools (scratch, not in repo): fps / trace / bench scripts in the session scratchpad (`trace3.js` / `trace4.js`: trace with per-function
   ms/s, writes per tick; `bench_flush.js`: patch(true) timing). Lisa's fps tool is the official one.

## 5. Lessons (trace findings)
- At 6x CPU with the worker, the main thread of 038 / 039 is ~100 % busy; the page's own animation is only 5–10 %. The big ones:
  worker patch apply `w.onmessage` (eng-page.js) 200–270 ms/s in ~100 ms chunks twice a second (the long frames), the 500 ms flush
  38–88 ms/s, and shell timers. Biggest shell timer found: **home.js Training tick (live.js `L.scan()` every second, even with the
  Training tab closed): 117–161 ms/s** (not my file; not fixed).
- A write of the same value still restyles / repaints: write only on change.
- Measure in RUN: `AN.view` must be false (my first A/B was in VIEW: no motion). With a busy PC fps is noise (3–43 fps same build);
  count DOM writes per tick and per-function ms/s instead, A/B interleaved.
- On the mirror never compute a sheet again on the page (simSheet writes nets / latches / counters): read the engine's result (simRead).
- Before a patch is put in, the flush must see every slot the patch touches (operator wins): slice only the timer flush.
- TEST_LOCK: a bash PID in the lock is not a Windows PID (Winter's lock looked dead but was running): ask, never delete.
