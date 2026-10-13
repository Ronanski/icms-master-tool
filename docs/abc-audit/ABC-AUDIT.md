# ABC Analog Logic Audit — Golden Reference

## Purpose

This is the master index for checking the simulator's ABC analog pages against the plant's actual DCS logic drawings and supporting references. It records audit scope, evidence standards, and the status of findings without duplicating the source documents.

## Current status

- Overall ABC audit: **Beta 1 level — 53 of 54 sheets traced and tested (ABC-005 partly), all 54 batch-scanned, regression run on the current build (FINDINGS batch 31)**. Version evidence and results: `docs/versions/v1.20.21/`.
- Golden Reference source set: present in `document-references/`; individual expected behaviors still require traceable verification.
- Simulator corrections: F-1, F-3 ~ F-31 (user approved, analog reader and viewer of `logic-sim-v1.20.21.html` only; DITL untouched). Open decision: R-1 (CUT / DH swapped in the PID data, so the CUT function of F-31 is inactive).
- Release status: Beta 1 published (pre-release `v1.20.21-beta.1`, GO BETA from the user). No Stable release. Release workflows exist in `.github/workflows/`; the old `.apk` / `.exe` were removed from the repository root; the shells are the assets of release `v1.20.22` and load the site. The base file `logic-sim-v1.20.21.html` stays in the root (Site, Release and `tools/version.js` need it).

## Value basis

The app shows real values; DCS % / count scaling is done as a user would (PROJECT_RULES 4a).

## Source hierarchy

1. **Plant-specific ABC logic diagrams** — primary reference for actual logic, connections, block arrangement, signal flow, and page links.
2. **DCS I/O list** — confirm tag identity, I/O type, address, and channel when listed.
3. **Memory lists STN101–STN105** — confirm station/controller and memory address references.
4. **Linear curves / F(X)** — confirm analog function and curve behavior for the applicable block.
5. **Analog/digital symbol legends** — interpret symbols and block types.
6. **PID/PIDV/SUMA/MAN summary and calculation workbooks** — confirm relevant controller parameters or calculations.
7. **DCS training textbook** — background explanation only; it does not override plant-specific drawings.

A reference's presence in the repository does not mean every value or behavior has already been checked. Record exact page, sheet, cell/range, or section when it can be identified.

## Required audit workflow

For each ABC page or test case:

1. Identify the exact drawing page and relevant block/signal path.
2. Trace the path from input to intermediate blocks to final output, including cross-page links.
3. Cross-check relevant tags, addresses, stations, curves, symbols, and parameters against the applicable supporting documents.
4. Write the expected behavior and cite its evidence before comparing the simulator.
5. Run the equivalent test in the simulator and record the actual result.
6. Assign a verdict:
   - **Pass** — actual result matches a sufficiently supported expected result.
   - **Fail** — actual result conflicts with a sufficiently supported expected result.
   - **Needs Verification** — evidence is incomplete, ambiguous, or conflicting.
   - **Cannot Verify** — required source or reproducible simulator behavior is unavailable.
7. Record any discrepancy without changing logic until its cause and the proposed fix are reviewed and approved.
8. Viewer check (added after F-28 / F-29): the test cases read net values, so they do not see what the analog viewer draws. For each page also check the drawn result in RUN mode: the energized leg of every switching block (T, A/M, HI / LO selector) is lit and the de-energized leg is grey, wire labels and values sit on the right wire, and the tracing view follows the same legs. Record these as viewer findings (UI only).

## Golden Reference test-case fields

Every meaningful test case should contain:

| Field | What to record |
|---|---|
| Test ID | Stable identifier, e.g. ABC-<page>-<number> |
| Drawing/page | Exact ABC drawing/page code |
| Block or path | Relevant block names, tags, and traced route |
| Source evidence | Document filename plus page/sheet/section |
| Input condition | Values/states applied to the test |
| Expected result | Expected intermediate/final values or states, with reasoning |
| Actual result | What the simulator produced |
| Verdict | Pass / Fail / Needs Verification / Cannot Verify |
| Notes | Plain-language explanation and unresolved questions |

Do not invent numeric values, scaling ranges, formulas, tag mappings, or output states. If the drawing alone does not determine a result, identify the additional reference needed.

## Coverage by block type (what was tested, and how)

| Block type | Tested | How | Not yet |
|---|---|---|---|
| T switch (SW / AMT), COS A/M, HI / LO selector | all 54 sheets: 327 + 56 + 19 | select signal traced to its real inputs and driven in RUN mode; selected leg, output, scaling and drawn legs checked (batch 26, 27) | – |
| F(X) tables | 89 / 89 tables, 111 blocks | against `linear-curves-fx.xls`; interpolation in the sheet scenarios | – |
| Divider (÷) | 15 | order of A / B against the drawing (F-1, F-4, F-16) | – |
| Comparators (HC / LC / HLC) | 222 | set point and unit (F-6, F-23, F-27) | – |
| PID / MAN / SUMA parameters | 140 | against the parameter workbook | – |
| PID algorithm | 68 | integral step and output against Kp, Ti, Td; ACT text against the sign (batch 28); TF, CUT, dMVH simulated (F-31) | GAP (1 PID); exact DCS formula of TF / CUT / dMVH Needs Verification; ABC-005 auto dynamics closed by run P-2 |
| PID / MAN behavior | per sheet | direction, limits, tracking, A/M, BU-CMD (F-20, F-26) in the sheet scenarios | – |
| Timers (TON / TOF / pulse) | 159 on all sheets | time of each timer against its parameter (batch 28) | S/R flip-flops only in the sheet scenarios |
| LAG | 12 | time constant (batch 28) | – |
| RATE / RAMP | per sheet | ABC-001B, 001C, 003E, 034 and others (F-20, F-25) | – |
| Scaling / gains (F-9 ~ F-22) | per sheet | in the sheet scenarios | not a systematic test |
| SUMA integration | 7 | 12 / h for 1 h = 12 (batch 28) | reset (RES / RSTS) not simulated |
| ALM limits | 104 | level at both sides of each limit (batch 28) | on-delay timers of the alarms |
| TP compensation, SQRT | – | SQRT is identity by the user's answer (V-18) | TP against `flow-compensation.xls` |
| Viewer (UI) | switches only | lit / grey legs (F-28, F-29) | labels and values on wires |
| Regression of the current build | all 54 sheets | `tools/regress/` (batch 31): load / step, timers, LAG, ALM, F-30 hold, P-1, dMVH, differential run against older builds, F(X) / parameters / AI ranges against the workbooks | switch end-to-end sweep, P-4, P-2 not re-run; CUT of F-31 inactive (R-1) |

## Findings and version reports

Keep this file as the master summary and index. Add a version-specific report only when actual findings or work exist:

`docs/versions/<verified-version>/FINDINGS.md`
`docs/versions/<verified-version>/PROGRESS.md`
`docs/versions/<verified-version>/UPDATE_REPORT.md`

Do not create empty version folders. Use the app's verified version, not a version guessed from an artifact filename. In each update report use: **Problem, As Found, Work Done, As Left, Status**. Keep the report evidence-based and concise.

## Findings summary

| ID | Page | Summary | Status |
|---|---|---|---|
| F-1 | ABC-005 | DENSITY CORRECTION ÷ is drawn B/A; simulator computed A/B | Fixed, verified |
| F-3 | ABC-008 | AI0481 (0–1200 rpm) had no range | Fixed, verified |
| F-4 | ABC-032 | Unlabeled ÷ computed constant ÷ signal | Fixed, verified |
| F-5 | ABC-001B | HIC-MWRL MV limits overridden in code | Fixed, verified |
| F-6 | ABC-001A | Comparator set points "> 0.1 %" read as 0 | Fixed, verified |
| F-2 | all PID | CUT / DH swapped between sim data and workbook (not used by sim) | Closed, no action |
| F-7 | 9 sheets | SCALE CONVERT a/b multiplied engineering-unit values (source range / destination range) | Fixed, verified |
| F-8 | ABC-005 | Limestone chain shows real values (count scale, T/H to %, density base 1.3) | Fixed, verified; user to verify constant 13 vs 1.3 |
| F-9 | ABC-003E | Burner SV took the oil master % as T/H; burner ramp 5 %/min not applied | Fixed, verified; user to verify V-13 |
| F-10 | ABC-011, 012 | Outlet temperature PID output (% of 0~600 °C) used as °C set point | Fixed, verified; user to verify V-14 |
| F-11 | ABC-004A, 009A, 003A | Stacked fraction constants (1/3, 1/4, SCALE CONVERT 35/140) read as the first number | Fixed, verified |
| F-12 | ABC-004A | M.3400 input linked to itself, could not be set | Fixed, verified |
| F-13 | ABC-007 | Controller PV tags / house-load subtraction input not tied to the flow signal | Fixed, verified |
| F-14 | ABC-002 | Diesel to coal equivalent used 4450 against a calorie in units of 10000 kcal/kg (1e4 too small) | Fixed, verified; user to verify V-16 |
| F-15 | ABC-057 | LN23 / LN24 table (X unit "RANGE") not scaled: bias MAN 0 read as −10 | Fixed, verified |
| F-16 | ABC-008 | Divider with "2" on its wire: divisor missing, then taken as a ratio (x100) | Fixed, verified; user to verify V-17 |
| F-17 | ABC-010 | Drum level pressure compensation mixed % and mm | Fixed, verified |
| F-18 | ABC-010 | Master level MV (%) added to steam flow (T/H) as a plain number | Fixed, verified; user to verify V-18 |
| F-19 | ABC-003A ~ D, 008, 020 | SW with its "1:a" label beside a diagonal wire selected b | Fixed, verified |
| F-20 | ABC-001C, 020 (and the two-input MAN of 001A / 001B / 009A / 009B) | LAG enable taken as the signal; MAN did not follow its auto set point | Fixed, verified |
| F-21 | ABC-001C | Boiler master chain mixed % and T/H | Fixed, verified; user to verify V-19 |
| F-22 | ABC-009A, 009B | Bottom ash screw cooler loop mixed rpm and % | Fixed, verified; user to verify V-20 |
| F-23 | ABC-001C, 006, 003A ~ D, 010 | "% MCR" / "%" set points compared with T/H or mm signals | Fixed, verified |
| F-24 | ABC-006 (and 28 sheets) | SIG.AB tag written mid-wire not tied to the SIG.AB box | Fixed, verified |
| F-25 | ABC-001B | Rate limit of the unit load demand 20 times too fast (SCALE CONVERT 10 / 200 taken as 1); closes N-1 | Fixed, verified |
| F-26 | ABC-008, 017, 033 and other BU-CMD sheets | BU-CMD interlock tracking not applied through the A/M selector (MV returned to the manual value) | Fixed, 14 scenario files differ after BU-CMD pulses |
| F-27 | ABC-001A | "> 0.1 %" comparators compared 0.1 MW; 0.1 % of 200 MW = 0.2 MW | Fixed |
| F-28 | all sheets (viewer) | View / Trace mode did not show the deselected leg of a switch (UI only) | Fixed |
| F-29 | all sheets (viewer) | 113 switch inputs had no lit / grey leg overlay (wire ends short of the pin) | Fixed (UI only) |
| F-30 | ABC-003A, 003B ~ D, 004A, 008, 020, 051 | Force-to-manual pulse (2 s) released the A/M switch; MV drifted after shutdown | Fixed |
| F-31 | 68 PIDs | TF, CUT, dMVH read but not simulated (N-5) | Implemented; formula Needs Verification; CUT inactive (R-1) |
| R-1 | 64 PIDs | CUT and DH swapped in the simulator data (F-2), so CUT of F-31 reads 0 | Confirmed, fix proposed, needs approval |
| R-2 / R-3 | F-30, audit counts | 8 (not 9) latched A/M switches; engine block counts higher than the audit tables | Documentation notes |

Details: [v1.20.21 findings](../versions/v1.20.21/FINDINGS.md). Do not copy entire diagrams, spreadsheets, or PDFs into this document.

## Next step

1. Decide R-1 (swap CUT and DH in the data of the 64 PIDs).
2. User verification V-1 ~ V-21 (UAT form).
3. Read ABC-036 ~ 039 against their drawings, viewer labels / values on wires, and decide the exact DCS formula of PID TF / CUT / dMVH (F-31).
4. Release / rebuild only on **GO STABLE** / **GO BETA**.

This document organizes the work; it does not itself certify that the logic or simulator is correct.
