# Current Project Handoff

> This is the single current handoff. Replace outdated status when work changes; do not append a cumulative chat transcript.

## Project
DCS Logic Simulator in `Ronanski/icms-master-tool`.

## Current focus
ABC analog logic audit using a Cause & Effect / Golden Reference approach. User confirmed that Claude is already building expected behavior and comparing it with the simulator.

## Repository state checked
- Default branch: `main`.
- Existing app artifacts are named `logic-sim-v1.20.21.html`, `logic-sim-v1.20.21-portable.exe`, and `logic-sim-v1.20.21.apk`. Runtime version has not been independently verified.
- Source references are stored in `document-references/`; they include plant diagram archives/PDFs, symbol legends, DCS I/O list, memory lists STN101–STN105, linear F(X) curves, DCS training textbook, calculation workbooks, HMI samples, and PID/PIDV/SUMA/MAN parameter summary.
- Documentation organization was merged to `main` through [PR #1](https://github.com/Ronanski/icms-master-tool/pull/1).
- No simulator logic or application code has been changed as part of this documentation task.

## Documentation layout
- `README.md`: short overview and links to project documents.
- `PROJECT_RULES.md`: permanent working rules, source hierarchy, approval and release rules.
- `HANDOFF.md`: this current state and next actions.
- `docs/abc-audit/ABC-AUDIT.md`: master ABC audit method and Golden Reference index.
- Version-specific reports are created only when actual findings/progress exist.

## Audit rules
- Plant-specific drawings are the primary reference for plant logic.
- Use I/O lists, station memory lists, F(X) curves, symbol legends, parameter summaries, and calculation sheets to cross-check relevant details.
- Expected results must cite the source and page/sheet where possible.
- Mark unclear or conflicting evidence as **Needs Verification**; never invent expected values.
- Audit before fixing. Do not change DITL functionality during ABC-only work without explicit approval.
- No Stable/Beta release until the user explicitly says **GO STABLE** or **GO BETA**.

## Audit progress (v1.20.21 verified from the simulator title/badge; apk/exe not run)
- No earlier C&E Golden work existed anywhere in the repo; the audit was started fresh using `docs/abc-audit/ABC-AUDIT.md`.
- ABC-005 mostly audited: ratio, low-limit, running/SIG.AB/trip logic, manual/BU-CMD transfer, and tag/address checks Pass; **F-1** density-correction ÷ inverted (Fail); N-1..N-4 Needs Verification; AB0114-0116 and controller tags Cannot Verify. Evidence: `docs/versions/v1.20.21/`.
- Method note: ABC PDFs have no text layer (read visually). Simulator was driven headless (Playwright + bundled Chromium) by writing to the sheet's external-input nets and reading net values; nothing was modified.

- Batch scan of all 54 sheets done (read-only, automated): PID/MAN/SUMA parameters vs the workbook, and 176 AI tags vs the I/O list. Almost everything matches; open items are F-2, F-3, N-5 in `FINDINGS.md`. Audit now proceeds in batches, not page by page.

## Corrections applied (user-approved, analog reader only; details and verification in `docs/versions/v1.20.21/FINDINGS.md`)
- F-1: stacked B-over-A fraction on the ÷ block (ABC-005 density correction).
- F-4: unlabeled ÷ block uses the through-line pin as dividend (ABC-032).
- F-3: AI range text searched at 70 units when none found and no feedback model (ABC-008 AI0481).
- Only `logic-sim-v1.20.21.html` changed (6 insertions, 2 deletions in `anCompile` / `anInit`). The `.apk` and `.exe` are NOT rebuilt (the user handles them) and no release was made. The user decides about the version number.

## Next actions
1. Open items needing the user only if they want them closed: F-2 (CUT/DH swapped between sim data and workbook; unused by sim), N-5 (why HIC-MWRL MV limits are overridden in code).
2. Next audit batch: ABC-004A (source of SI0144 → N-1/N-3: magnitudes of the ABC-005 chain), then per-page logic checks (digital logic, transfer blocks, tracking) for the other pages, automated the same way as ABC-005-05..09.
3. No release without GO STABLE / GO BETA.

## Current task status
**Done:** ABC-005 traced and tested (11 tests); batch scan of all 54 sheets (parameters, AI tags, dividers, health); 3 corrections applied and verified; documents updated.
**Not done:** per-page logic checks for the other pages, ABC-005 PID auto dynamics / SUMA integration / ALM limits, N-1 magnitudes, rebuilds and release.
