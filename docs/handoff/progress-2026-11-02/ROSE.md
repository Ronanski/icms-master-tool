# ROSÉ: HMI thread, save progress (2026-11-02, PHT)

Session: HMI thread of the DCS Logic Simulator (Ronanski/icms-master-tool, LMYP #1 CFB boiler). Worktree `.claude/worktrees/hmi-81561e`.
The leader (Jennie) relays the user's orders. I do not merge. I push only to my own branches. Repo MD files are left to the DOCS thread.

## 1. Done, by date

### 2026-10-31
- **Commits on PR #86 (branch `claude/hmi-81561e`):**
  - `26fcea5` HMI operator text in English, on the pop-outs and pages (user: "the app is English everywhere").
  - `fc6dd79` New page 038 AIR PREHEATER, approved mockup v4, with the #59 two faceplates.
  - `d84daeb` 038 v5: 2.5D rotor, quiet PERMISSIVE button, faceplates that open right of every value.
- **Shared HMI pieces:** `HSYM.eqb` (quiet PERMISSIVE Y / N button 112 x 22), `vbc`, `vb2`, `arrow` in `src/ui/plant/hmi-sym.js`.
- **Beta:** these went into 3.2.0-beta.77 (`af471da`, with #87 APP UI/UX and #88 CODE FIXER).
- **Mockups for review:** 006, 028, 002, 007, 039, and 038 v6 / v6b (X-ray view).
  - Files are in `team-files/hmi-mockups/`.
  - The style sheet `HMI_STYLE.md` was frozen (user: "sa lahat ng HMI, uniform ha").
- **Stop order:** the user said "Tigil nga muna lahat", and every drafter was stopped.

### 2026-11-01
- **User order:** "Yung mga approved. Ipalagay mo na sa app."
- **`420a4cc`** (PR #86): 038 AIR PREHEATER (mockup v15) and 039 RH / SH BIASING DAMPER (Style B, flue gas A) put into the app, 1:1 with the mockups.
  - New shared parts in `hmi-sym.js`:
    - `HSYM.layer`: the mockup drawing as an HTML layer that follows the plant pan and zoom;
    - `HSYM.clock`: one 15 Hz clock for all motion.
  - New page file `hmi-bias.js`.
  - `LS_FPOP.info`: a permissive / trend / monitor faceplate for a controller.
  - Tabs follow the mockup (`sys.nav`).
  - Live links found and used:
    - ABC-020 labels are `S4 M.0506 / 0507 / 3440 / 3441`;
    - the damper feedback is `S4 AI0368 ~ 0375` (ZT-FG1116 / 1117 A ~ D);
    - TCV-FW1150 is the MV of TICHR1002.
- **`14d07d5`** (PR #86): 039 shown whole on one screen (fitAll, leader review).
- **Beta:** both went into **3.2.0-beta.78** (PR #91, the user's GO BETA).
  - In the same beta, CODE FIXER fixed what I had found: DITL-44 O.029F, the 150 MW fans, and PIIA1064A / B.

### 2026-11-02
- **Leader order (from the user):** move the APPROVED HMI kit pieces into the shared library.
  - New branch `claude/hmi-kit`, from main beta.78.
  - **PR #93**: https://github.com/Ronanski/icms-master-tool/pull/93 (not merged).
- **`c29ee0f`:** `src/ui/plant/hmi-kit.js` = `HSYM.kit`, loaded after `hmi-sym.js`. 24 pieces, 1:1 with `hmi-kit-piece.html`, plus the drain.
  - **Pipes and lines:** pipe 4 / duct 6, connections + hop, drain, line end.
  - **Valves:** hand, control, shut-off and motor valves; valve in a line; check valve.
  - **Rotating equipment:** pump, motor, blower, fan, damper.
  - **Vessels:** vertical tank, heat exchanger, horizontal drum.
  - **Displays:** value box, name plate, permissive Y / N, motor status.
  - **Other:** strainer, coal feeder, burner (light-off sequence), bottom ash cooler, expansion joint, flow element.
  - Every piece returns `{ el, set(state) }`.
- **`0c5e860`:** lighter while it moves.
  - No layout per step: the valve % texts are laid out once and swapped.
  - Moving parts sit on their own layer (`will-change`).
  - One visibility observer per svg.
- **Side-by-side images:**
  - `team-files/hmi-mockups/kit-vs-lib.png`: 24 pieces, running state, kit taken from the built app. The leader checked it: 1:1.
  - `HMI-KIT-MOCKUP-vs-LIBRARY-1..4.png`.

## 2. Current state
- **PR #93 (HMI kit):** pushed; not merged (it needs the user's GO BETA). No page uses the kit yet, so nothing changes for the operator.
- **fps:** not yet a clean ≥ 60 at 6x with a valve sweeping all the time.
  - The PC was at 80 ~ 100 % CPU from the other sessions, so the numbers are not reliable.
  - Last runs: 51 ~ 58 fps. A blank page measured at the same time gave 60.
- **Relative measure** (main-thread ms per 15 Hz step at 6x, Chrome trace, kit page 1600 x 900):

| Paired run | Before | After |
|---|---|---|
| 1 | 27.5 | 18.4 |
| 2 | 48.2 | 34.0 |
| 3 | 55.9 | 17.9 |

  - Layout per step: 4 ~ 9 ms → ~0.
  - What is left is paint.
- **Tried and left out:**
  - pipe light moved by CSS transform: in Chrome it still lays out inside an SVG (worse, 48 ~ 51 ms per step);
  - stepping on the screen frames (more paints).
- **Running processes:** none. My idle test server (PID 14664) was stopped by its PID.

## 3. Still open
- Final fps of PR #93, measured locally only, when the leader says the PC is quiet. Method: headless Chrome 1600 x 900, 6x CPU, rAF fps, valve sweeping.
- **On hold by user order:**
  - the comparison with K1AU3-E2-0-121 / 122 / 123 / 142 (graphic design, motor valve, control valve, control damper);
  - all other studies.
- **No push** until the user decides about the Beta site.
- The next HMI mockups (028, 002, 003, 006, new 007, batches 2-4, 030) are the leader's.
- The kit pieces not approved yet: furnace, cyclone, back pass, air heater, precipitator, silo, turbine / generator, stack, condenser.

## Where to continue (new account, 2026-11-02)
- **Git state:**
  - Branch `claude/hmi-kit` is pushed at `0c5e860`; it is PR #93.
  - Branch `claude/hmi-81561e` (PR #86) is fully in main (`14d07d5` is an ancestor of main, merged with beta.78); the remote branch was deleted after the merge.
  - Nothing is left unpushed. The only untracked file is the local `.claude/launch.json`.
- **Next step:** the final fps of PR #93, run locally when the leader says the PC is quiet.
  - The test page (`kitlib.html`) and the scripts (`fps.js`, `prof.js`, `kitshots.js`) were in this session's scratchpad and are not kept.
  - Rebuild the test page by drawing the cards of `hmi-kit-piece.html` with `HSYM.kit`.
  - Measure with headless Chrome 1600 x 900, `Emulation.setCPUThrottlingRate` 6, and rAF count over 6 s.
  - The valve sweep runs on `HSYM.clock`.

## 4. User rules for the HMI that I learned
- **Approval and copying:**
  - Mockup first, approved by the user.
  - The app page is EXACTLY the mockup ("ganyan na ganyan"), with no own design.
  - The side-by-side picture goes to the leader before the user sees it.
- **Light on a tablet:**
  - one clock (15 Hz) for all motion;
  - no CSS / SMIL animation, no SVG filter or mask on the drawing, no per-frame canvas;
  - target ≥ 60 fps at 6x CPU throttle.
- **Uniform look:** one style for every page ("sa lahat ng HMI, uniform ha. iisang style. wag pabago bago").
- **Language and labels:**
  - The app text is English.
  - No acronyms as labels (tags are fine where the approved mockup shows them).
- **Two faceplates per equipment:**
  - control: click on the equipment;
  - permissive + trend + monitor: the Y / N button. Y red = complete, N green.
- **Colours:** RUN / OPEN red, STOP / CLOSED green, TRIP flashing. A valve on its way is white.
- **Kit rules:**
  - one pipe size 4, duct 6, black outline, square corners;
  - crossing = hop, but avoid crossings;
  - no flow arrow (the moving light shows the direction);
  - drain = arrow down + DRAIN;
  - line end = dark pentagon with the colour stripe;
  - symbols from the P&ID legend K1AU3-PD-010;
  - a closed valve or a stopped machine has no flow on either side.
- **Sources:**
  - Every detail traces to the docs (drawings, I/O list, FHI manual, PR-OPE-5002, HMI snapshot).
  - Say "not in docs" when it is not there.
  - Never invent a tag.
  - Never remove a link to make something work.
- **Order and process:**
  - STOP MEANS STOP.
  - Main only on GO BETA.
  - Merge only by the leader.
  - Never kill processes by name; close only what I started, by its PID.
- **Reports:** Taglish, short, PHT; what was done, what was tested, what was not tested.
