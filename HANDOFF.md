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

## Next actions
1. Inspect Claude's existing C&E Golden work before creating duplicate test cases or competing audit formats.
2. Verify ABC pages one at a time: source diagram → trace → expected behavior → simulator result → evidence-backed verdict.
3. When findings are real, add concise version-specific reports under `docs/versions/<verified-version>/` and update this handoff.
4. Do not alter simulation logic or create a release unless approved.

## Current task status
**Completed:** Added and merged the documentation structure (PR #1). README navigation, project rules, current handoff, and ABC audit index are present on `main`.

**Not completed:** No independent ABC behavior audit, application-code change, build, or release was performed as part of this task.
