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

## Next actions
1. **F-1 fix is approved by the user but NOT applied:** the environment's permission system blocked editing `logic-sim-v1.20.21.html`. Needed: the user either grants the edit permission or applies the patch described in `FINDINGS.md` ("F-1 fix status"). After applying, re-scan all 15 ÷ blocks (only ABC-005 block 21 should change) and re-run ABC-005-04.
2. User decisions: F-2 (which file is the later readout for CUT/DH, unused by the sim), N-5 (why HIC-MWRL is overridden).
3. Next batch: ABC-004A (source of SI0144, N-1/N-3), the 6 ÷ blocks not readable automatically (ABC-008, 000, 027, 032, 002 x2), F-3 (AI0481), then the remaining logic checks per page (digital logic, transfer blocks, tracking) automated the same way as ABC-005-05..09.
4. Do not alter simulation logic beyond approved items, and no release unless approved.

## Current task status
**Done:** ABC-005 traced, 11 tests run; batch parameter and tag scan over all sheets; findings documented. apk/exe testing is done by the user, not by Claude.
**Not done:** F-1 fix (blocked), remaining per-page logic checks, ABC-005 PID auto dynamics/SUMA integration/ALM, any build or release.
