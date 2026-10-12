# ABC Analog Logic Audit — Golden Reference

## Purpose

This is the master index for checking the simulator's ABC analog pages against the plant's actual DCS logic drawings and supporting references. It records audit scope, evidence standards, and the status of findings without duplicating the source documents.

## Current status

- Overall ABC audit: **In progress — 1 of 54 pages started (ABC-005, partial)**. Version evidence and results: `docs/versions/v1.20.21/`.
- Golden Reference source set: present in `document-references/`; individual expected behaviors still require traceable verification.
- Simulator corrections: none made by this documentation task.
- Release status: no release authorized.

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

## Findings and version reports

Keep this file as the master summary and index. Add a version-specific report only when actual findings or work exist:

`docs/versions/<verified-version>/FINDINGS.md`
`docs/versions/<verified-version>/PROGRESS.md`
`docs/versions/<verified-version>/UPDATE_REPORT.md`

Do not create empty version folders. Use the app's verified version, not a version guessed from an artifact filename. In each update report use: **Problem, As Found, Work Done, As Left, Status**. Keep the report evidence-based and concise.

## Findings summary

| ID | Page | Summary | Status |
|---|---|---|---|
| F-1 | ABC-005 | DENSITY CORRECTION ÷ is drawn B/A; simulator computes A/B | Confirmed in simulator; fix not approved |

Details: [v1.20.21 findings](../versions/v1.20.21/FINDINGS.md). Do not copy entire diagrams, spreadsheets, or PDFs into this document.

## Next step

Finish ABC-005 (control/trip logic, address cross-checks), then ABC-004A. Audit one ABC page at a time. This document organizes the work; it does not itself certify that the logic or simulator is correct.
