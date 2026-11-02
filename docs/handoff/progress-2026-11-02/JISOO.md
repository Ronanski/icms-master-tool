# JISOO (LIVE TESTER): SAVE PROGRESS (2026-11-02 PHT)

Sources: my log `live_log.md`, the findings artifact, the step files s3 ~ s16.json, `live-tester-findings-H1-H18.md` (notes folder) and my memory file. Nothing was pressed in the app for this save.

- **Findings artifact (one):** https://claude.ai/artifact/L8PGXXkK7us2NBApNLqwid (latest v27)
- **Worker test script:** `team-files/live-test-worker-15.md`

**PASS / FAIL of the user:** the user did not give a PASS / FAIL word per step. They gave "G" for each run, and judged by the reports. The only explicit verdict is 2026-11-01: the user FAILED my first H3 ~ H16 run on beta.77 for cut checks and untrue ticks ("wag mandaraya"). It was redone in full (ULIT, below).

---

## 1. Live tests, by date

### 2026-10-30 ~11:00 PM → 2026-10-31 ~00:30 AM · beta.76 build 2f48046 · H1 ~ H15
- Scope from the user: "G", H1 up to Turbine Oil.
- **H1 ~ H8 done.**
  - New findings: #39 (007 right column under the dock), #40 (purge label over PISB1040, wrong popup title ZT-FA1010), #41, #42, #43, #44, #45, #46, #47, #48, #49, #50.
  - Seen fixed: #1, #8, #10, #23, #25.
- **H9 ~ H15 done.**
  - New: #51 (ACWP-B AUTO not seen by the dock), #52.
  - Unusual: the SOP PA dryer tag is D-0704.
- **Re-check H1 ~ H15 with the 12 checks (no screenshot), 2026-10-31 ~01:55 AM.**
  - New: #53 ~ #58, then #59 (user HMI design: one Y/N button per equipment) and #60 (dock lost after a search "Show").
  - Artifact v3 ~ v4.

### 2026-10-31 · beta.76 · H16 ~ H18
- **H16 oil purifier, done.** New #61 ~ #65. Artifact v5.
- **H17 COP-A, done.** PILO1931A 163.2. New #66, #67, #68 (TCS START has no EXECUTE). Artifact v6.
- **H18 APH, STOPPED mid-step.**
  - #70 CRITICAL / chain: HMI 007 opens no faceplate (APH, HICHR1002A / B, PAF).
  - #71 biasing dampers 10 % / 100 % at Cold.
  - #69 ResizeObserver red banner.
  - Artifact v8.
- **User:** "Ipaayos na muna natin kaya lahat." Then "Wait k nlng dyan."
  - Handover of 35 findings by thread: `live-tester-findings-H1-H18.md`.

### 2026-11-01 · beta.77 build a161e47 · H1 ~ H16 (first run, FAILED by the user)
- Update now → beta.77. Cold reset (ls-train / ls-guide / ls-train-auto only).
- **H1:** 6 h purge in plant time. New #72 ~ #76. Seen fixed: #39, #42, #61, #69.
- **H2 ~ H16:** New #77 ~ #91.
  - #68 still NOT fixed.
  - Seen fixed: #51, #53, #63.
  - My error: T-1109 overfilled to 2.00 m (x10 + a missed CLOSE).
- **User caught me:** cut checks (no DITL sheet, events only on H1 / H2 / H16, artifact 3 times) and untrue ticks. Artifact v13 carries a red warning that the H3 ~ H16 PASA is not reliable.

### 2026-11-01 · beta.77 a161e47 · ULIT H3 ~ H16 (full 12 checks), DONE 14 / 14
- Cold reset, H1 (6 h purge) + H2 as setup, then H3 ~ H16 with the full 12 checks:
  - the DITL / ABC sheet opened;
  - the IO / memory list and the drawing PDF checked;
  - the Events read line by line;
  - the artifact updated every step (v14 ~ v27).
- **User decisions (from AskUserQuestion):**
  1. No value in the app → tick + HINDI NA-VERIFY + finding.
  2. Out of the SOP band (not critical) → tick + BAGSAK + finding: H9 strainer DP 0.27 (SOP 0.4 ~ 0.5); H14 "TCS alarms cleared" with PSLO1004 LOW.
- **New findings #92 ~ #108 (17, all Maliit).** CODE FIXER 9, HMI 5, APP UI/UX 3.
- **Corrected:**
  - #90: the SOP itself has "observe" before RUN.
  - #87: the D-0704 / C-0704 typo is the SOP's.
- **Still open:** #16, #44, #45, #47, #52, #62, #65, #68, #73, #80, #81, #83, #84, #85, #86, #88, #91.
- **Drawing = app, no finding:**
  - DITL-112 MWP standby < 5.0 (the CSV says 6.0).
  - DITL-114 PT-PA1706 (the IO list / HMI have PT-PA1705).
- **Plant left at H16 (t ≈ 885 min):**
  - SWP A / B and SWBP A / B running, each C on standby.
  - MWP-A running; T-1109 at 1.70 m.
  - ACWP-A running.
  - IA and PA dryer A + compressor A running.
  - TICLO1002 in AUTO.
  - Vapour extractor, MOP-A and the purifier running.
- **Correction told to the user:** H17 = SOP sec 16 Control Oil Pump (doable now); H18 = sec 17 APH (needs the 038 / 039 HMI: mockups approved, not coded).

### 2026-11-02 · Worker build (Lisa) · PREP ONLY, nothing run
- **8a3f850:** build id `de99fb9`. The id is the sha256 of the page, not git; Lisa confirmed it and cmp = SAME.
- **66a2a27:** build id `b342bc2`. The 4 open items are closed. Served at `localhost:5178/?worker=1` (preview "worker78", `serve78.js`). Before a start: no red bar, ENG.mode = local, "Unit · not started".
- Script for the 15 points written. Giselle's prep for points 11, 12 and 14 added.

## 2. State now
- **Worker test: ON HOLD** (leader: waiting for the user's decisions and Lisa's full list).
  - Browser tab "seed" = 66a2a27 / b342bc2, not started.
  - Step 1 = Home → start; read ENG.mode = 'mirror' (or Logic → ABC triggers the boot).
- **Beta.77 retest:** paused at H16. Next H17 (COP) on the user's "G".

## 3. Still open
1. Worker: the user's OK for the 2 state-changing JS lines of point 12 (broken op, terminate).
   - Without it, I only watch for the red bar.
   - Test the terminate only on the build with Giselle's 4ce4694 (heartbeat; bar "no answer" after ~10 s).
2. Worker: Lisa's new build that includes 4ce4694. Then reload, check the stamp, and tell the leader "Handa na sa Step 1 (<commit>)".
3. Point 11: the worker is OFF in the apk / exe (no ?worker=1, no button). The user / leader must decide: a button, or ON by default.
4. Point 14: no beta.79 on the site (needs GO BETA); the 66a2a27 Checks failed (the CI html is not the committed one).
5. Site risk (Giselle): `site.yml` puts ANY green branch on the Beta site. The site now = hmi-kit c29ee0f, not from a GO BETA. The leader showed it to the user.
6. fps tool name (point 15): from Lisa via the leader.
7. Beta.77: H17 ~ H44 not tested.
   - H18 APH blocked until the 038 / 039 HMI is coded.
   - Findings #92 ~ #108 not yet fixed.
   - Not sent to the leader as a step report (user rule).

## 3b. For the next account (PAUSED 2026-11-02)
- **My test server is closed.** I stopped only my own preview server.
- **My working files are copied to `team-files/progress/jisoo-files/`:**
  - `live_log.md`;
  - the artifact source `live-retest-beta76.html` (it is published as L8PGXXkK7us2NBApNLqwid);
  - `ulit.js` and s3 ~ s16.json (the artifact row helper);
  - `serve78.js` (a static server, port 5178).
- **The Worker html is not copied (11 MB).** Get it again with `git show 66a2a27:dist/logic-sim-v3.2.0-beta.78.html > worker78/index.html`, next to `serve78.js`. Then add a `.claude/launch.json` entry `worker78` (node serve78.js, port 5178) and open `http://localhost:5178/?worker=1`. The status bar must show build b342bc2.
- **The beta.77 plant state (H16) was only in the browser tab.** On a new account, start again from Cold (Hakbang 1).

## 4. The user's test rules (I follow them every time)
- **"G" and order:**
  - One step per "G"; always from Hakbang 1, in order.
  - "pwede na ba magtest?" is not a "G".
  - The user is the witness and judge; they press nothing.
- **The 12 checks on EVERY step, never fewer** (even "tuloy-tuloy"):
  1. Training & dock
  2. Dock UI
  3. Header & alarm (vs the alarm CSV in team-files/alarm-list-csv)
  4. Logic & permissive: open the sheet; every press / status has an M. / I. / B. address in sync with the IO / memory list
  5. HMI content (vs snapshot / IO list)
  6. One value (dock = HMI = faceplate = logic, within the SOP band)
  7. HMI UI
  8. Faceplate / pop-out, plus design #59: one Y/N button per equipment, controls on the equipment
  9. Whole app UI
  10. Status bar
  11. Events, line by line
  12. SOP & old findings
- **Honest ticks:**
  - Tick only what is true. Never cheat ("wag mandaraya").
  - No value → tick + HINDI NA-VERIFY + finding.
  - Out of band and not critical → tick + BAGSAK + finding.
  - Permissive N → never tick.
  - Critical / chain → stop and ask.
- **How I work in the app:**
  - Operator clicks only, no code. The only exception is clearing ls-train / ls-guide / ls-train-auto.
  - For the Worker test the leader OK'd read-only JS (ENG.mode / err / got / sent / peek), and every line is listed in the report.
- **Screenshots:** none; the app is read as text (CLAUDE.md, user 2026-10-31). Emergency only.
- **The logic read:** after at least 30 s.
- **Reporting:**
  - One artifact, updated after every step.
  - Every finding is numbered, with criticality, reco and target thread.
  - Every visual reco says "mockup muna".
  - Reports go to the user only; to the leader only when the user says.
  - Taglish, simple, with a CATEGORY column, full counts, and the latest test only.
- **Other:**
  - Never kill processes by name.
  - No heavy run outside the TEST_LOCK rule (CPU < 60, lock file).
  - No code / merge without GO BETA / GO STABLE.
