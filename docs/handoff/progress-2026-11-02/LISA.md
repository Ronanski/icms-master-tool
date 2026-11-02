# LISA (CODE FIXER, before "Jessa") · progress · saved 2026-11-02 ~4:30 PM PHT

Worktree `.claude/worktrees/code-fixer-b7bfbb`. Task: the Web Worker engine (user 2026-11-02 "Worker n. Lhat n").
No PR, no merge to main, no Beta from me. Everything below was tested by me unless it says NOT TESTED.

## 1. What I did (date, PHT)

**2026-11-02, night until ~3:00 AM: stage (a), the ABC engine without DOM** (branch `claude/code-fixer-worker2`)
- `c243295`: engine keyframe (`src/analog/engine/state.js`).
- `79442e1`: engine/ctrls.js, names.js, api.js (engine functions out of the UI files); `tools/build/engine-bundle.js`. Test:
  `tests/regress/eng_headless.js` (page vs engine alone) 0 diff.
- 2:48 to ~8:50 AM: idle while a bisect ran, about 6 h lost (my fault).

**2026-11-02 morning: the Reset fix and stage (b)**
- `c0c4dac`, Reset fix (leader finding "iisa ang state pagkatapos ng Reset"): the run state of every plant model goes back
  (AN_PROC_RUN). Kept: the links and the HMI anchor `hop` / `Ka`, since a Reset that erased the ABC-019 39.PNG anchor stopped the
  roll. Also fixed: the ABC-010 FICFW1007 that "fell" to pin. Test `reset_clean.js` 0 diff.
- `0fdea39`, stage (b): DITL simulation, reader and motor state without DOM (`src/digital/parts/03b-sim.js`, `03c-read.js`),
  `engine/ds.js`; `worldBundle`. Test `eng_world.js` 0 / 5024.
- `a44a900`: WIP (c), the DITL keyframe (`03d-state.js`), sync draft.

**2026-11-02 ~10:30 AM to 2:45 PM: stage (c) radio, stage (d) worker, the 3 helpers**
- `079ef8d`: `src/world/eng.js` (the radio), the list of 225 write sites, briefs (notes folder: worker-c-write-sites.md,
  worker-c-briefs.md).
- `1b2583c`: the radio passes. Engine state found outside the slots and fixed: block states held by the unit model, proc remote,
  anPins, AN_HMI_OP anchors, fakeFrom, shared links, model fields, AN._xs (shareExt).
- `50d873c`, (d) 1/n: real Web Worker (opt-in `?worker=1`); `eng-host.js`, `eng-page.js`, `#engsrc` inline. Test
  `eng_worker.js`: worker state = page state.
- `3f5c669`, (d) 2/n: fps at 6x (ack flow, 2 patches/s, smaller patches, the hmi-sym.js visibility check every 250 ms).
- `8c895b3`, `4bfccf4`: 6x timing check, Event log from the worker.
- `8a3f850`: merged Winter, Giselle and Ningning (stage c), plus 2 bugs: args of an action reached the worker as a copy; switch
  leg `st.fm` was not sent. All pushed to `claude/code-fixer-worker2`.

**2026-11-02 ~3:00 to 4:30 PM: zero known bugs, then the long actions**
- `66a2a27` (`claude/worker-fix-after-lt`, pushed): the 4 open items (simRead in the reader, DITL150.on, LINEAR edits, b.p
  tuning) and the Simulate OFF test. Build b342bc2, the live test build at the time (Jisoo serves it on localhost:5178).
- `f168a6c`, LOCAL: the CI fix. `path.relative` wrote `src\digital\...` into `#engsrc` on Windows, so the Linux CI built another
  html. Also: Giselle's ANLN slot and anSyncStFast; ping / pong, soft engine errors on screen, ENG.fail, the eng-watch.js slot.
  Build 79216b9.
- `a2357e8`, LOCAL: C1 + C2. The long actions (Reset, Start at 150 MW / Cold, loadStart, DITL150.apply) run in the engine only
  (the page gets a promise; the progress bar comes from the worker). The patch is applied in slices of at most 4 ms. Bug fixed on
  the way: proc.remote is now sent as data. Build fea4065. Tests: eng_radio ALL PASS; eng_worker ALL PASS.
- `claude/fps-60` (pushed): an `LS_ANIM_MS` switch only, for fps measurements. fps now belongs to Winter (MU) and Ningning
  (038 / 039).
- PR: none. Beta: none from me. The Checks of my pushed branches all FAILED (because of the path bug), so none reached /beta/.

## 2. State now

| Checkpoint | Who | State |
|---|---|---|
| C1 long actions in the engine only | Lisa | done, LOCAL `a2357e8` |
| C2 patch apply in slices | Lisa | done, LOCAL `a2357e8` |
| C3 cheaper flush (sync.js) | Ningning | in progress |
| C4 watchdog / heartbeat | Giselle | LOCAL `4ce4694` on `claude/worker-heartbeat` (from 66a2a27, touches eng-host.js, eng-page.js, eng.js); diff in notes `giselle-heartbeat-4ce4694.diff`; to merge (it overlaps my ping / pong) |
| C5 merge + rebuild + eng_set + fps | Lisa | after C3 / C4; Winter's `tests/regress/eng_set.js` LOCAL `a492a61` on `claude/eng-set-winter` |

- Not yet pushed: `f168a6c`, `a2357e8` (on `claude/worker-fix-after-lt`). The leader said at ~4:20 PM that pushing branches is
  safe now (the Beta site comes only from main after PR #94), so they go next, for the Checks link.

## 2b. PAUSED 2026-11-02 ~5:00 PM PHT (the team moves to another account): RESUME HERE

- **Branch `claude/worker-fix-after-lt` @ `5dbd645` (pushed).** It is a WIP commit on top of `a2357e8` (C1 + C2, whose Checks
  passed). It contains:
  - C4, Giselle's heartbeat (from `4ce4694`), merged by hand: `acting` instead of her `busy`; the watchdog is 60 s while
    `ENG.heavy`;
  - `AN.clock0()` (engine/trace-step.js, api.js, eng.js CALLS);
  - Winter's guide.js `20dd154` (the Training start calls `AN.clock0`);
  - in the tests: Giselle's 3 watchdog checks in eng_worker, and `AN.clock0` at scan 72 in eng_radio.
- **Next steps, in this order (TEST_LOCK: CPU < 60, then lock):**
  1. `node tools/build/build.js`. The committed dist is the build BEFORE clock0 / guide.js, so the CI check fails until this
     rebuild. Then `node tools/build/build.js --check`, commit, push, and give the Checks link.
  2. `node tests/regress/eng_radio.js` (it now has clock0), then `eng_worker.js <dist html>` (real worker + watchdog). Only
     eng_radio passed on the heartbeat merge. eng_worker was stopped for the pause.
  3. Winter: `tests/regress/eng_set.js` (branch `claude/eng-set-winter` @ `d60535d`, pushed) on the new commit, from PowerShell (in
     his session Git Bash cannot launch Chrome).
  4. C3, Ningning's cheaper flush: commit `6af358e` on `claude/worker-e-ningning` (base f168a6c; sync.js only; her 4 radio tests
     ALL PASS). Merge it onto 5dbd645 (sync.js: check the overlap with the bp slot / anSyncStFast). Her interface:
     - `patch(true, { slice: true, parts: 4 })` = round-robin, a quarter of the writable slots per call (5.35 → 1.20 ms);
     - `patch(true, { keys })` = only the named writable slots (0.05 ms for 4);
     - `patch(true)` and `patch()` = as before.
     Wire it in my files:
     - eng-page.js `E._fl` (500 ms) → `AN.sync.patch(true, { slice: true })`;
     - eng.js `onMsg` patch, the flush before apply → `AN.sync.patch(true, { keys: m.p.map(x => x[0]) })`, NOT slice (her point:
       a write in a slot that slice did not look at would be covered by the engine patch and lost; with keys, only the slots in
       the patch can be covered, and those are checked);
     - the full `patch(true)` stays before each action (call wrapper).
     Then eng_radio* + eng_worker + eng_set.
  5. C5: rebuild, eng_set, fps (only when Jennie says the PC is quiet; fps tool in the notes folder `fps-tool/`). Then the commit
     and build id go to Jisoo (live test, `?worker=1`) and Jennie.
- **Other branches (pushed):**
  - `claude/code-fixer-worker2` @ `8a3f850` (stages a to c, the old live test build);
  - `claude/fps-60` @ the `LS_ANIM_MS` experiment (fps now belongs to Winter / Ningning);
  - helpers: `claude/worker-heartbeat` (Giselle), `claude/winter-clock0` (Winter), `claude/eng-set-winter` (Winter),
    `claude/worker-d-*` (the same 4 items as 66a2a27; not needed).

- **Giselle's review of C1** (notes folder `giselle-review-C1-a2357e8.md`), TO FIX on resume before the live test:
  1. **BUG:** in a mirror only the engine part of Reset runs (engine-bundle.js hook: anResetAll + 6 scans). The page part of
     `loader.js reset()` is lost: `DITL150.clear()` (a motor started by hand stays on after Reset, retest #68), clearing `AN.sv` and
     anSave (old forces / values / switches come back), the panel rebuild and the "Reset done" toast. Fix: give the engine the same
     Reset as the page (move the engine parts of loader.js reset into the engine form); keep the page-only parts (panel, toast) on
     the page after the promise.
  2. Callers that do not wait for the long actions:
     - interaction.js 339 (the Reset button paints the old state: should wait for the promise);
     - app.js 1593 (`if (r) msg` with a promise: the msg always shows; should await);
     - CHECK / UAT runner (check.js, runner.js, scen.js): they step and read at once. Proposal: run the runners on the page engine
       (local mode), or await. These files are Giselle's (uat/*, interaction.js); she does it after my choice.
  3. Do NOT take Giselle's local `4bb8e2f` (eng-watch.js): the watchdog is already in eng-page.js (5dbd645), and two would run.

## 3. Still open

- NOT TESTED: apk / exe on a real device (the app-folder form passed in Chromium only); Update now (needs the site); Library
  F(X) by hand on a real page; fps >= 60 at 6x (HOME 56, 038 40~48, 039 50, MU 23~25 measured on 8a3f850, quiet machine).
- Training in worker mode: the guide waits for the promise of loadStart (OK by reading the code). Winter checks it with
  train_open (`?worker=1`). The Training coach runs after each patch, not in lockstep with the engine.
- Short actions still run on both sides (dual): they are about 0.1 s each, and the next patch sets them right.
- Decisions for the user: worker ON by default (after the live test, apk / exe, Update now, fps); the plant-page animation rate
  (it changes how it looks, so it needs the user's OK).

## 4. Rules and lessons

- **Build on every OS:** use `/` in anything written into the html (`path.relative` gives `\` on Windows). Check
  `node tools/build/build.js --check` on the commit itself.
- **Build id:** it is the sha256 of the html, not a git commit. de99fb9 = 8a3f850, b342bc2 = 66a2a27, fea4065 = a2357e8.
- **Engine state:** any state the engine keeps outside AN (a cache that the unit model holds, a shared object, a field added
  later) breaks the mirror. A two-engine test finds it (eng_radio). Identity matters, not only the values.
- **Reset:** put back only the run state. Keep the links and anchors that were built once.
- **Long actions:** run them in the engine only. Short ones can run on both sides, and a full patch after each action heals the
  page.
- **Tests:** follow TEST_LOCK (one heavy run at a time, CPU < 60, lock file). fps numbers mean nothing on a busy machine. No full
  Cold → 150 MW run and no Training suite from me (user).
- **Process rules:** never kill processes by name; no push to main and no PR merge without the user's GO; no MD edits in the repo
  (this file is in team-files).
- **Worker size:** VIEW vs RUN, the page in mirror mode steps nothing; it only paints after a patch.
- **KNOWN BUG C1 (Giselle review): `team-files/progress/giselle-review-C1-a2357e8.md`.** Fix before the live test: (1) Reset in the
  worker has no `DITL150.clear()` (a motor started by hand stays after Reset, retest #68); (2) no cleanup of the saved values (`AN.sv`
  + `anSave`): old forces / values / switches come back; (3) no "Reset done" toast and no panel rebuild; and the CHECK / UAT runners
  (check.js 3079-3082, runner.js 46, scen.js) do not wait for reset / load. Lisa's choice: the runners run on the page engine (local),
  and the Reset button + app.js 1593 wait for the promise (Giselle, after the resume).
