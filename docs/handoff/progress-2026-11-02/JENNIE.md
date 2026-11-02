# LEADER : JENNIE: progress (save progress, 2026-11-02 ~4:20 PM PHT)

The leader session (`local_ea5f329e`) was started on the new account on 2026-10-31. The old-account history is in the repo (`docs/handoff/PROJECT_MEMORY.md`, `HANDOFF.md`). This file lists what the leader did, decided and passed on in this session.

## 1. Team (all sub-sessions under the leader; titles are "ROLE : NAME")

| Role : Name | Session | Work |
|---|---|---|
| FIXER : LISA | local_75ccf3b8 | Code Fixer lead. Moves the engine to the Worker. |
| FIXER : WINTER | local_25aec530 | Helper. Dock / Training coach in the engine, MU fps, style and paint trace, test set eng_set.js. |
| FIXER : GISELLE | local_fc75b485 | Helper. ABC sheet and panels in the radio, apk/exe worker flag, site Beta = main (PR #94), heartbeat. |
| FIXER : NINGNING | local_ee6e0f3a | Helper. DITL view and Library on the mirror, readers, fps 038/039, shell timers, sync flush. |
| TESTER : JISOO | local_91fed919 | Live tester. The Worker live test is ON HOLD until checkpoint C5. |
| HMI : ROSÉ | local_d32c79ad | HMI pages. HMI kit moved into the app (PR #93). |
| DESIGN : YUNA | local_c0a9b55a | App UI/UX (PR #87). Outline studies (paused). |
| DOCS : KARINA | local_53ae9578 | Docs. Writes the repo MD files only on "save progress". |

## 2. Worker move (main work; user: "Worker n. Lhat n")

Plan artifact: https://claude.ai/artifact/9i6KRiXmzbRtpnJYMH9X6j. The DCS vs simulator explainer: https://claude.ai/artifact/QDoxMtqqj65Zn4hasnrS7E

**Done** (Lisa, with Winter, Giselle and Ningning):
- Stage 0: Reset fix.
- Stage a: analog engine.
- Stage b: DITL engine and world.
- Stage c: 96 presses through the radio.
- Stage d: real Web Worker (opt-in `?worker=1`).
- Commits: 8a3f850, then 66a2a27 (helpers' open items).

**Test scope** (user): 15 loop-check points, not a Cold→150 run. Training is an add-on.
- Script: `team-files/live-test-worker-15.md`.
- Prep for points 11/12/14: `worker-11-14-prep.md`.

**Found 2026-11-02 PM:**
- **"Dual":** heavy actions run on the page AND in the Worker.
- **Patch apply** is the largest main-thread cost: about 25 %, in 100 ms chunks twice a second.
- **Flush** every 500 ms scans about 3,600 blocks.
- **`:has()` CSS and text rewrites** with no change: style and paint cost.
- **Worker kill/hang** showed no message. Giselle's heartbeat fix (4ce4694) covers it; checkpoint C4 is DONE.
- **CI Checks** failed because `path.relative` writes Windows backslashes. Fixed locally (f168a6c), push pending.
- The worker is OFF in apk/exe. A flag is ready (14882a5, local).

**Checkpoints (PHT, may slip):**

| # | Time | Work | Owner |
|---|---|---|---|
| C1 | 6:15 PM | Dual removal | Lisa |
| C2 | 7:15 PM | Patch slicing | Lisa |
| C3 | 7:30 PM | Cheaper flush | Ningning |
| C4 | DONE | Heartbeat | Giselle |
| C5 | 8:15 PM | Merge + rebuild + eng_set + fps → Jisoo | Lisa, Winter |

**After C5:** the live test (15 points, one step per user "G"). Then fix all findings, then the user decides GO BETA.

## 3. Site / release

- **2026-11-02, "GO STABLE workflow site":** PR #94 was merged to main (177fcfd). Beta (`/beta/`) = main only. Stable = latest `vX.Y.Z` release. Before this, any green branch replaced the Beta, and the Beta showed hmi-kit c29ee0f.
- **Main:** beta.78 (PR #91, 5a94d18), plus 177fcfd.

## 4. HMI

**Kit** (https://claude.ai/artifact/9AtAR2oMupi3AySQZjdP6y, v78):
- Approved: piping, all valves, pump, blower, motor, fan, damper, tank, HX, drum, name plate, permissive, value box, motor status, strainer, coal feeder, expansion joint + flow element, burner, screw cooler. Log: `team-files/hmi-mockups/HMI_KIT_APPROVED.md`.
- Rosé moved the 24 approved pieces into the app as `HSYM.kit` (PR #93, open, not merged). Looks 1:1 (`kit-vs-lib.png`). fps work is pending a quiet PC.

**Studies: PAUSED by the user** ("tama na muna… until my next command"). State is in `team-files/hmi-mockups/STUDY_PROGRESS.md`.

| Study | Artifact | State |
|---|---|---|
| Furnace + cyclone | NvVu9rEPc4zhrUK796s3ZX v13 | Side view traced from PD-051/054, plus a dimension-only sheet. Waiting on the user (approval, or GA Sect 9/10). |
| Air heater | FW1sCSt9aKeNbmonMEj1EB | From Howden GA 001001. |
| ESP | DtGfqLiEvuF3hxcwhxSHNU | The Limay GA was found later (D1-0-016 p116/119); update pending. |
| Stack | 3yDNqa1HBkZv3zxJZCgH4f | |
| Silos | 2CmRM9XBm2MvxzJ2Uoviav | |
| TG | LSe68N1qJegCo7aW5s75Mr | Sister unit, Davao. |
| Back pass inside | B9eMBin5ykGTAVSdAfT9pC | |

Artifact IDs are `https://claude.ai/artifact/<id>`.

## 5. Docs folders (user)

- PHASE 1 was moved to `icms-master-tool/document-references/o&m-package-phase-1`.
- New: `tg-engineer-data` (74 K1AU3-D1 Engineering Data) and `instrument-engineer-data-asbuilt` (22 K1AU3-E2, including 121 "Graphic Design of DCS Operation Station").
- Index: `team-files/hmi-mockups/new-docs-index.md`.

## 5b. RESUME ON THE NEW ACCOUNT (user is moving the team, 2026-11-02 ~4:40 PM PHT)

All sessions were told to do a clean pause: finish the current step, commit (including WIP), push their branches (never main), write the exact resume point in their `<NAME>.md`, release TEST_LOCK, and stop their own processes.

To resume on the new account:
1. Open a new leader session in `C:/Users/Ronanski/Downloads/app-projects-ai-collections/projects/icms-master-tool`. Read, in this order:
   - `team-files/progress/system/SYSTEM.md`;
   - this file;
   - every `<NAME>.md`;
   - `team-files/TEST_LOCK_RULE.md`.
2. Memory: if the new account has no leader memory, copy `team-files/progress/system/memory-leader/*` into the new account's project memory folder.
3. Recreate the sub-sessions with the same titles ("ROLE : NAME"), nested under the leader. Brief each one from its `<NAME>.md`.
4. Recreate the BANTAY cron every 15 min. The prompt is in `memory-leader/leader-watch-idle-threads.md` and `SYSTEM.md` §3.
5. **Worker next steps (Lisa):**
   - merge C4 (Giselle's heartbeat) and C3 (Ningning's flush) into `claude/worker-fix-after-lt`;
   - Winter's eng_set runs after each merge;
   - C5: rebuild, then fps on a quiet PC, then the build id to Jisoo.
   - Then the live test (15 points, ask the user about C = deliberate worker kill), then fixes, then GO BETA.
6. **Still waiting on the user:**
   - furnace outline approval;
   - point C of the live test;
   - GO BETA after the live test;
   - the HMI studies stay paused until the user says otherwise.

## 6. User rules learned this session (also in leader memory)

- Session titles are "ROLE : NAME"; female K-pop nicknames; all sessions are subs of the leader.
- No idle. BANTAY every 15 min; nudge sessions that wait on their own runs.
- Do the recommended without asking. Ask only for taste, risk, or GO-gated items.
- Zero known bugs before a report or a live test.
- Test scope = the 15 points; no full Cold→150 run unless asked.
- PC ≤ 85 % CPU. Heavy runs one at a time via `team-files/TEST_LOCK_RULE.md`; never kill processes by name.
- Drawings:
  - Trace the user's reference drawing part by part; never invent shapes.
  - Use X/Y axes in metres, one scale per axis, and grid.
  - Black = from the docs; orange = estimate.
  - Do not show false precision.
- HMI kit: each piece shows only its OPERATION animation, plus labelled description rows.
- Times are in PHT. Check the PC clock; do not guess.
