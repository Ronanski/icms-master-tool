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
- Traced and tested: ABC-005 (mostly), ABC-028, ABC-054, ABC-017, ABC-001B, ABC-056, ABC-033, ABC-013, ABC-055, ABC-014; structure only: ABC-001A, ABC-034; partly: ABC-006, ABC-032, ABC-008. All 89 F(X) curves checked against the workbook. Details in `PROGRESS.md`.
- Batch scan of all 54 sheets: 140 controller blocks vs the parameter workbook, 176 AI tags vs the I/O list, 15 dividers, 222 comparators, simulator Health. Everything matches except the items below.
- Fixed and verified (user approved, evidence in `FINDINGS.md`): F-1 divider B/A (ABC-005), F-3 AI0481 range (ABC-008), F-4 unlabeled divider order (ABC-032), F-5 HIC-MWRL limits (ABC-001B), F-6 comparator set points (ABC-001A), F-7 SCALE CONVERT constants are x1 in real values (16 constants on 9 sheets; basis: the ranges printed on the drawings, e.g. 648 + 432 + 35 = 1115 T/H on ABC-006).
- Closed: F-2 (PID CUT/DH swapped; simulator does not use them).
- F-8: ABC-005 limestone chain now shows real values (feeder speed 46.95 % for S 3 %, CaCO3 60 %, coal 81 T/H); user to verify the constant 13 vs 1.3.
- Open: **N-1** ABC-001B RATE LIMIT time input (T = B/A·100/60) is still of order 1e5–1e7. N-2..N-4 (ABC-005 constant 13 vs 1.3, SI0144 source, SI0337 label position) and AB0114–0116 not found in any list (Cannot Verify). "%" set points are compared as literal numbers against engineering-unit values.

## Value basis
The app shows real values (PROJECT_RULES 4a). DCS percent / count scaling is not simulated; where a drawing constant exists only for it, scaling is done as a user would, recorded with its basis and listed for the user's verification.

## Method notes
- Drawing PDFs have no text layer; read visually. The simulator is driven headless (Playwright + bundled Chromium): inputs written to external nets or forced, SIG.AB states set, time stepped, nets read. Nothing in the repo is modified by the tests.
- Rules to keep: audit before fixing, only change the ABC reader with evidence, never touch DITL without approval, no release or build claim without **GO STABLE** / **GO BETA**.

## Next actions
1. Audit the next sheets: ABC-029, 004B/C, 009B (dense, zoomed reading) and so on (order by block count in the simulator). A PDF report (per sheet, with where to look in the diagram and what to verify) is sent to the user when the run is complete; a progress copy was sent earlier.
2. ABC-004A (source of SI0144) to settle N-3 and test N-1.
3. Resolve N-1 (count-scale multiplication) from the DCS function definitions; check the same for "%" set points.
4. Release / rebuild only on GO STABLE / GO BETA.

## Current task status
**Done:** corrections F-1, F-3, F-4, F-5, F-6, F-7; seven sheets traced; batch scan; records updated.
**Not done:** remaining sheets, N-1 decision, ABC-005 PID auto dynamics / SUMA integration / ALM limits, rebuilds and release.
