# Project Memory — DCS Logic Simulator

> Compact retrieval index for Claude sessions. This is a working index, not a substitute for source evidence. Update only verified facts.

## Current repository state
- Repository: `Ronanski/icms-master-tool` only.
- Last documented Stable in `HANDOFF.md`: **v2.1.0**. Next planned Beta: **2.2.0-beta.1**.
- Current documented next engineering target: compare the 150 MW plant state against the HMI snapshot; `docs/versions/v2.1.0/PLANT_LIVE_VS_SNAPSHOT.md` records 96 tags that differ from the snapshot. Verify current Git state and current handoff before acting; this index may lag.
- Main areas: ABC analog logic, DITL digital logic, combined ABC+DITL world, plant model, HMI, UAT, regression tests.

## Hard rules
- Read `CLAUDE.md`, `PROJECT_RULES.md`, and the current top-level status in `HANDOFF.md` before repository work.
- Use only this repository. Do not access or modify `Ronanski/dcs-logic-sim`.
- Never merge to `main`, run workflows, package/release Stable, or claim a build/test succeeded without explicit authorization and actual evidence. Stable/release/merge/workflow requires **GO STABLE in that same message**. A normal “GO DO IT” is not release authorization.
- Before changing ABC/DITL logic, trace the exact drawing and relevant source references. Expected results must be independent of simulator implementation.
- Keep test initialization/state controlled. Report Pass, Fail, Needs Verification, or Cannot Verify with evidence.
- Preserve working behavior. Update the existing `HANDOFF.md` after meaningful work; do not append chat transcripts or create duplicate handoffs.
- Communicate in concise Taglish; user is a non-coder.

## Source-of-truth order
1. Plant-specific ABC/DITL drawings under `document-references/` — exact sheet/page and signal path.
2. DCS I/O list and STN101–STN105 memory lists — tags, addresses, station mapping.
3. F(X) curves, symbol legends, PID/PIDV/SUMA/MAN parameter summaries and calculation workbooks.
4. DCS textbook for general explanation only.
5. Existing findings/tests as evidence of prior checks, not automatic truth. Re-check the original source when a finding conflicts, is unverified, or its source changed.

## Retrieval map
- Project rules: `CLAUDE.md`, `PROJECT_RULES.md`.
- Current status / next action: top of `HANDOFF.md`.
- ABC audit method and index: `docs/abc-audit/ABC-AUDIT.md`.
- Version reports and known plant-state mismatches: `docs/versions/<version>/`; especially `docs/versions/v2.1.0/PLANT_LIVE_VS_SNAPSHOT.md` and `UPDATE_REPORT.md`.
- Automated checks: `tests/regress/`, `src/ui/uat/`, `.github/workflows/checks.yml`.
- Original diagrams, workbooks and manuals: `document-references/`.

## Memory discipline
- Retrieve this index automatically on every submitted prompt via `.claude/settings.json`.
- Use exact sheet/tag names from the user's prompt to search relevant findings and reports before opening broad files.
- Graphify is optional acceleration, not the source of truth. If `graphify-out/graph.json` exists and the CLI is installed, query it for code relationships. Otherwise use targeted repository search and do not claim Graphify was used.
- Save only durable facts: verified source interpretation, expected values, test result, decision, unresolved issue, and source location. Never store guesses as facts.
- When a source or finding is missing/conflicting, retrieve the original reference; do not rely on recollection.
