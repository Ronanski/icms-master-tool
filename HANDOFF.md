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

## Next actions
1. **Decision needed:** approve or reject a fix for F-1 (÷ reader should understand a stacked B-over-A fraction). Scope already checked: only 1 of 15 ÷ blocks is a readable stacked B/A (ABC-005); 6 unreadable ones (ABC-008, 000, 027, 032, 002 x2) are checked when their pages are audited. No code is changed until approved.
2. Finish ABC-005: PID auto-mode dynamics, SUMA integration, ALM limits (PID/SUMA parameters already Pass).
3. Audit ABC-004A next (source of SI0144) to settle N-1 and N-3.
4. Do not alter simulation logic or create a release unless approved.

## Current task status
**Done:** ABC-005 traced, 11 tests run, addresses cross-checked; findings documented. apk/exe testing is done by the user, not by Claude.
**Not done:** remaining 53 ABC pages, ABC-005 PID auto dynamics/SUMA integration/ALM, any fix, build, or release.
