# ICMS Master Tool

Overall tool for the Instrumentation and Control Maintenance Section.

## DCS Logic Simulator

The repository includes the DCS Logic Simulator artifacts and the plant-specific reference set in `document-references/`.

## Start here

1. Read [PROJECT_RULES.md](PROJECT_RULES.md) before modifying the project.
2. Read [HANDOFF.md](HANDOFF.md) for the current project status and next actions.
3. The simulator is `logic-sim-v1.20.22.html`; `document-references/logic-sim-v1.20.21.html` is the unedited reference build. Regression checks: `tools/regress/`.
4. For the ABC analog logic audit, use [ABC Audit — Golden Reference](docs/abc-audit/ABC-AUDIT.md).
5. Keep source diagrams, spreadsheets, symbol legends, and other reference files in `document-references/`; do not duplicate them in documentation folders.

## Change and release control

Audit against source documents before proposing logic changes. Do not modify DITL behavior during ABC-only work without approval. Do not publish a Stable or Beta release until the user explicitly authorizes **GO STABLE** or **GO BETA**.
