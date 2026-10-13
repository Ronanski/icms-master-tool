# Current Project Handoff

> This is the single current handoff. Replace outdated status when work changes; do not append a cumulative chat transcript.

## Project
DCS Logic Simulator in `Ronanski/icms-master-tool`. Runtime version v1.20.21 (shown in the simulator title and header badge).

## Current focus
ABC analog logic audit (Cause & Effect / Golden Reference method of `docs/abc-audit/ABC-AUDIT.md`). Simplest sheets first, then the rest in batches.

## Repository state
- Default branch `main`; work branch `claude/adoring-carson-aylw3j`. Documentation structure merged earlier through [PR #1](https://github.com/Ronanski/icms-master-tool/pull/1).
- Only `logic-sim-v1.20.21.html` has code changes (analog reader: `anCompile`, `anInit`, `anFace`). DITL is untouched. The `.apk` and `.exe` are committed binaries and are NOT rebuilt; the repository has no build files or workflow, so they cannot be rebuilt from here. No release was made.
- Source references are in `document-references/` (plant drawings, I/O list, memory lists, F(X), legends, parameter workbook, textbook). Do not copy them elsewhere.

## Documentation layout
`README.md` overview · `PROJECT_RULES.md` rules and source order · this file · `docs/abc-audit/ABC-AUDIT.md` method, summary and findings index · `docs/versions/v1.20.21/` (`FINDINGS.md` evidence, `PROGRESS.md` per-sheet status, `UPDATE_REPORT.md`).

## Audit status
- Traced and tested: ABC-005 (mostly), ABC-028, ABC-054, ABC-017, ABC-001B, ABC-056, ABC-033, ABC-013, ABC-055, ABC-014, ABC-029, ABC-004B, ABC-004C, ABC-035 to ABC-039, ABC-053, ABC-019, ABC-030, ABC-031, ABC-051, ABC-003E, ABC-011, ABC-012, ABC-004A, ABC-007, ABC-002, ABC-057, ABC-008, ABC-026, ABC-027, ABC-010, ABC-003A-D, ABC-020, ABC-050, ABC-052, ABC-015, ABC-016, ABC-001C, ABC-001D, ABC-009A, ABC-009B, ABC-001A, ABC-006, ABC-032, ABC-034, ABC-001B; structure only: ABC-001A, ABC-034; partly: ABC-006, ABC-032, ABC-008. All 89 F(X) curves checked against the workbook. Details in `PROGRESS.md`.
- Batch scan of all 54 sheets: 140 controller blocks vs the parameter workbook, 176 AI tags vs the I/O list, 15 dividers, 222 comparators, simulator Health. Everything matches except the items below.
- Fixed and verified (user approved, evidence in `FINDINGS.md`): F-1 divider B/A (ABC-005), F-3 AI0481 range (ABC-008), F-4 unlabeled divider order (ABC-032), F-5 HIC-MWRL limits (ABC-001B), F-6 comparator set points (ABC-001A), F-7 SCALE CONVERT constants are x1 in real values (16 constants on 9 sheets; basis: the ranges printed on the drawings, e.g. 648 + 432 + 35 = 1115 T/H on ABC-006).
- F-9: ABC-003E oil master % to burner T/H (x 3.5/100), burner ramp 5 %/min, SET X% 0.105 T/H; user to verify PTN004029 / label names (V-13).
- F-10: ABC-011 / 012 cascade set point % to °C (x 6); check the same pattern on ABC-004A and ABC-009A (V-14).
- F-11 stacked fraction constants (ABC-004A 1/3, ABC-009A 1/4, ABC-003A SCALE CONVERT 35/140 x 1), F-12 ABC-004A M.3400 input. ABC-009A 1/4 to be checked on its audit (V-15).
- F-13 ABC-007 PV tags tied to the flow signal. ABC-007 n87 / n100 ("PICFG108 / PICFG108A in manual" from ABC-008) show no cross-page link: check on ABC-008.
- F-14 ABC-002 diesel calorie base 4450 → 0.445 (V-16). ABC-002 #44 divider checked (a/b = SA flow / SI0042, matches).
- F-15 ABC-057 bias MAN scaling into LN23 / LN24.
- F-16 ABC-008 divider by 2 (average of PA / SA demand). V-17: MV after a BU-CMD pulse returns to the manual value (COS does not track).
- F-17 ABC-010 drum level compensation in %, F-18 master MV % to T/H (V-18, also the feed water flow compensation / SQRT question).
- F-19 selector label beside diagonal wire (ABC-003A-D, ABC-008, ABC-020 #72 to re-check).
- F-20 LAG enable / MAN set point input, F-21 ABC-001C % / T/H (V-19). Two-input MAN of 001B, 009A, 009B (SICL1060A-D), 020, 001C now follow their auto set point.
- F-22 ABC-009A / B bottom ash coolers in rpm vs % (V-20).
- F-23 % MCR set points to T/H (ABC-001C, 006), 18.7 % SA flow, ABC-010 5 %; F-24 SIG.AB tag mid-wire.
- Closed: F-2 (PID CUT/DH swapped; simulator does not use them).
- F-8: ABC-005 limestone chain now shows real values (feeder speed 46.95 % for S 3 %, CaCO3 60 %, coal 81 T/H); user to verify the constant 13 vs 1.3.
- N-1 closed by F-25 (ABC-001B rate limit). Open: N-2, N-4 (ABC-005 constant 13 vs 1.3, SI0337 label position; N-3 SI0144 source resolved: sum of the three feeder flows, assumed 7.32 T/H in the app) and AB0114–0116 not found in any list (Cannot Verify). "%" set points are compared as literal numbers against engineering-unit values.

- F-7 basis confirmed by the user: SCALE CONVERT is ×1 in T/H because total air = PA + SA + FA (`linear-curves-fx.xls` DATA sheet, drawing Design Base 606 T/H). User answers received: V-1 keep 1.3, V-13 both directions, V-18 real flow (SQRT blocks intentionally identity). V-17 settled by the legend (F-26, interlock tracking), V-8 settled as 0.2 MW (F-27). V-2 (SI0337 = ÷ output = OMV, matches memory list), V-3 (AB setup values not in any list by design) and V-12 (process model, use Force) closed. Switching blocks: all 327 T switches, 56 COS A/M selectors and 19 HS / LS tested end to end in RUN mode (FINDINGS batch 27, F-28 / F-29 UI only). Block functions tested on every instance (FINDINGS batch 28): timers, LAG, ALM, SUMA, PID algorithm; F-30 (force-to-manual pulse latches manual), F-31 (PID TF / CUT / dMVH simulated; formula Needs Verification). Plant-level runs P-1 (DATA sheet design points), P-2 (ABC-005 auto), P-3 (force-to-manual hold) in FINDINGS batch 30; V-21 closed. UAT (21 checks) skipped for now; the phone form stays open. V-4, 5, 6, 7, 9, 10, 11, 14, 15, 16, 19, 20 settled with basis.

## Value basis
The app shows real values (PROJECT_RULES 4a). DCS percent / count scaling is not simulated; where a drawing constant exists only for it, scaling is done as a user would, recorded with its basis and listed for the user's verification.

## Method notes
- Drawing PDFs have no text layer; read visually. The simulator is driven headless (Playwright + bundled Chromium): inputs written to external nets or forced, SIG.AB states set, time stepped, nets read. Nothing in the repo is modified by the tests.
- Rules to keep: audit before fixing, only change the ABC reader with evidence, never touch DITL without approval, no release or build claim without **GO STABLE** / **GO BETA**.

## Beta
GO BETA given by the user. Beta 1 is published: GitHub pre-release `v1.20.21-beta.1` (commit fd2aab6 on `main`, PR #2) with the asset `logic-sim-v1.20.21.html`, created by the manual workflow `.github/workflows/beta-release.yml` (PR #3). The `.apk` and `.exe` were not rebuilt (no Android / Electron project or signing key in the repository) and do not contain these fixes. No Stable release.

## Regression (batch 31)
Harness in `tools/regress/` (see its README). Current build: all 54 sheets load, timers / LAG / ALM / F-30 shutdown hold / P-1 / dMVH tests pass, F(X), parameters and AI ranges equal the workbooks. Differential run: F-28 / F-29 change nothing in the engine; F-30 changes ABC-008 only; F-31 explains the other 22 sheets that differ. Open from it: **R-1** the CUT function of F-31 is inactive (CUT / DH swapped in the simulator data, F-2; proposed data swap, needs approval), R-2 / R-3 documentation counts. Details in FINDINGS batch 31.

## Next actions
0. Decide R-1 (swap CUT / DH in the data of the 64 PID so CUT works).
1. User does one UAT / verification with the PDF report (V-1 ~ V-21). ABC-005 PID auto dynamics, SUMA integration and ALM limits are recorded as V-21 (not fully driven in the headless run).
2. Release / rebuild only on GO STABLE / GO BETA.

## Current task status
**Done:** corrections F-1, F-3 ~ F-8 and F-9 ~ F-25; 53 of 54 sheets traced and tested (ABC-005 partly); batch scan; records updated.
**Not done:** user verification V-1 ~ V-21 (V-21 = ABC-005 auto dynamics), rebuilds and release. The full PDF report was sent in chat.
