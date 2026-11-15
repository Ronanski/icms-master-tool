# Turnover INDEX: LOGIC_SIM_PROJECT (LMYP Unit 1 DCS Logic and Plant Simulator)

Written by JENNIE (Leader), 2026-11-15 ~8:50 PM PHT. Account weekly limit 96 %, resets 2026-11-16 1 PM PHT; Max plan ends 2026-11-17.

## 1. Read first
1. `CLAUDE.md` (the Commandments, standing rules).
2. `HANDOFF.md` (state, versions, next steps).
3. This INDEX, then each thread's turnover below.
4. `docs/turnover/JENNIE_LEADER.md` (leader state, plant model open items, decisions log).

## 2. Repository and privacy
- Repo `Ronanski/icms-master-tool` is **PUBLIC** (checked 2026-11-15 with `gh repo view`). The .md files in `docs/turnover/` hold no private plant data.
- Private copies (PDF / HTML, full user messages, artifact data) are on the user's PC in `turnover-private/` inside the repo folder. This folder is in `.gitignore` and never goes to GitHub.
- The same PDFs are in the project Library (`/mnt/project-files/turnover/<name>/`, Yoona's at `/mnt/project-files/YOONA_TURNOVER.pdf`, Jennie's at `/mnt/project-files/TURNOVER_JENNIE.pdf`).
- Plant documents: PC `document-references/` and private repo `Ronanski/icms-plant-documents`. Team notes: PC `team-files/` (sibling of the repo folder).

## 3. Versions
- Stable: v3.2.2 (2026-11-10), GitHub Release with apk, exe, html, report pdf.
- Beta on `main`: 3.2.3-beta.263 (2026-11-15). Beta site deploys by itself after Checks.

## 4. Per-thread turnover PDFs (PC: `turnover-private/<name>/`)
- JENNIE : LEADER (plant model, leader): `jennie/TURNOVER_JENNIE.pdf` (+ .html, USER_MESSAGES_FULL.txt, artifacts/tracker data and snapshot). Public notes: `docs/turnover/JENNIE_LEADER.md`.
- YOONA : LIBRARIAN / DOCUMENT CONTROLLER: `yoona/YOONA_TURNOVER.pdf`.
- ARIN : CONTROL NETWORK FLOW: `arin/ARIN-turnover.pdf`.
- CHAEWON : BOILER: `chaewon/CHAEWON_BOILER_turnover.pdf`.
- HANNI : TUTOR, BECOME PLANT EXPERT: `hanni/HANNI-TURNOVER-COMPLETE.pdf`.
- MOMO : 3D PLANT: `momo-3d/TURNOVER-3D-WHOLE-PLANT.pdf`.
- SAKURA : TURBINE: `sakura/SAKURA_TURBINE_COMPLETE.pdf`.
- SOHEE : PLANT MODEL HELPER: `sohee/SOHEE_PLANT_MODEL_HELPER_COMPLETE.pdf`.

## 5. Threads (state on 2026-11-15)
Active or open:
- JENNIE : LEADER (working; turnover).
- YOONA : LIBRARIAN / DOCUMENT CONTROLLER (working; stays open by rule).
- HANNI : TUTOR, BECOME PLANT EXPERT (working).
- MOMO : 3D PLANT (working).
- SAKURA : TURBINE (working; owns turbine and MW).
- CHAEWON : BOILER (review ready).
- ARIN : CONTROL NETWORK FLOW (review ready).
- SOHEE : PLANT MODEL HELPER (review ready).
- MINA : TESTER (done; under the user's STOP of 2026-11-13).
- YUJIN : STOP SESSION DROPS (blocked, waiting for the user).
- CHAEYOUNG : SIGNAL MASTERLIST IN APP (blocked, waiting for the user).
- DAHYUN : DCS AI 2W DRY/WET CHECK (done).
- Hourly team check (done).

Closed since 2026-11-02 (resolved): WINTER and LIA (fixer helpers), MINA re-shell retest beta.268, HANDOVER full project to local Claude Code, LISA : FIXER, YUNA : DESIGN, KARINA : DOCS, YEJI : STEPS AUDIT, RYUJIN : AUDITOR, YUQI : DESIGN DATA, MIYEON : IO LIST, SOYEON : LOOP DOCK, JISOO : HMI MOCKUP, IRENE : PLANT MODEL, KAZUHA : PR CLEANUP, JIHYO : PLANNER, LISA : PLANT MODEL 4B (boiler side), GISELLE : PLANT MODEL 4B (turbine side), TZUYU : audit of documents and references, NAYEON : FIELD CONTROLS, NINGNING : SKILLS, ROSÉ : HMI (two threads), show major plant parameters at the top, WENDY : FULL TURNOVER, SEULGI : PLANT MODEL BOILER SIDE, finish/test/release the simulator, study CodePLC Skool model, GISELLE : fixer helper, SANA : PIXEL OFFICE, study Spec Kit, YERI : find data on the PC, HAEWON : HMI AUDITOR, read the working folder and report, read NEXT-ACCOUNT-START, CLOUD : build the app, AUDIT: prove no cheating in fixes, CLOUD TEST : GitHub check, read and explain SYSTEM.md.

## 6. Open pull requests (2026-11-15)
- 93 HMI kit (claude/hmi-kit), 443 drum level rate (claude/plant-4b-boiler), 444 turbine side (claude/plant-turbine), 639 BFWP-A suction MFT (claude/project-thread-ef6ad4), 642 stack monitor values (claude/s199-stack). All older than 2 days; each needs a decision by its owner thread (rebase or close).
- This turnover: branch `claude/turnover-jennie`.

## 7. Project-wide user rules (with dates)
- 2026-10-15: one tag = one signal across the DCS; .MAN/.LOC/.REM are mode states; the logic tells the scenario; no "dead input" or "needs verification" words.
- 2026-10-16: never remove a link to make something work; find the right source.
- 2026-10-17: BU-CMD is a protection; station goes MAN, holds MV, operator presses A.
- 2026-10-24: ABC and DITL are one world, always ON.
- 2026-11-04 11:06 PM: the team recommends, the user decides; STOP = STOP.
- 2026-11-04 (pinned): the team decides everything and does not ask the user; test everything, no bugs; G for live tests removed.
- 2026-11-06: "Db wala go beta": Beta merges when Checks pass. Stable and manual workflows only on written "GO STABLE".
- 2026-11-07: plant documents never in the public repo; manuals, procedures, drawings and logic first, HMI snapshot only a check; one unit, coal yard and water treatment out (unlimited silos and tanks).
- 2026-11-08: progress visible in the tracker; Taglish, short, plain words; no tables in chat.
- 2026-11-10: Mina does one Cold to full load live test at the end; no repeated Cold runs.
- 2026-11-11: "Puro assumed ha. Bawal yan": every value has a source or says NO-SOURCE.
- 2026-11-12: the Plant Simulator Plan has a fixed 39-task list; sessions must not go offline when the user is away.
- 2026-11-13 6:51 PM: STOP for the tester and plant model makers (Mina still stopped).
- 2026-11-13: no training guide or SOP as a basis for start-up; no patches, real model code only.
- 2026-11-14: one whole physics plant; manuals and design docs allowed; HMI snapshots, trends and start-up / shutdown procedures are not a basis; follow DCS, TCS, PLC, GCP, HMI logic; SAVE before steps, fix, LOAD and continue; auto in the logic with few manual actions; target MW on HIC-ULD with CCS AUTO.
- 2026-11-15: the logic is the source of truth and is not changed; one model for every load; only Jennie may live test; Training is a guide only, never proof, no separate code; turnover on the PC and in the project files, with artifacts, PDFs and conversations.
