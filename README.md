# ICMS Master Tool

Overall tool for the Instrumentation and Control Maintenance Section.

## DCS Logic Simulator

Ang simulator (ABC analog + DITL digital) ay binubuo mula sa `src/` papunta sa ISANG html file. Ang plant references ay nasa `document-references/`.

## Start here

1. Read [PROJECT_RULES.md](PROJECT_RULES.md) before modifying the project.
2. Read [HANDOFF.md](HANDOFF.md) for the current project status and next actions.
3. Mga ulat ayon sa bersyon: `docs/versions/`. ABC audit: [ABC-AUDIT.md](docs/abc-audit/ABC-AUDIT.md). Lumang files: `archive/`.

## Mapa ng repo (OPLAN-L1PAT)

| Folder | Stack | Laman |
|---|---|---|
| `src/boot`, `src/styles`, `src/digital` | start-up, itsura, DITL | tingnan ang [src/README.md](src/README.md) |
| `src/analog/reader` | READER | binabasa ang drawing, gumagawa ng blocks, nets, pins |
| `src/analog/engine` | ENGINE | compile / step ng logic, plant model |
| `src/analog/ui` | DRAWING + PANELS | canvas, paint, panels, trace, plant window |
| `src/ui/{shell,hmi,theme,uat}` | UI | toolbar / drawers, operator faceplate, themes, in-app UAT |
| `src/data` | DATA | built-in drawings, F(X), address list (gzip text) |
| `tools/build`, `tools/engine`, `tools/version.js` | BUILDS | build ng html, engine sa Node, version |
| `tests/regress` | TEST | headless checks (README sa loob) |
| `docs/` | DOCS | `abc-audit/`, `versions/` |
| `document-references/` | REFERENCES | drawings, I/O list, memory lists, workbooks |
| `android-app/`, `app/`, `signing/`, `sw.js`, `manifest.webmanifest`, `icon-*.png`, `.github/` | DELIVERY | apk, portable exe, Pages (hindi inilipat: dito umaasa ang workflows) |
| `archive/` | ARCHIVE | lumang ulat at lumang build |

Ang `logic-sim-vX.Y.Z.html` sa root ay build output (huwag i-edit; `npm run build`, `npm run check`).

## Change and release control

Audit against source documents before proposing logic changes. Do not modify DITL behavior during ABC-only work without approval. Beta: bawat ayos ay push agad sa working branch (PROJECT_RULES 5e). Stable release, merge sa `main` at workflow run: **GO STABLE** lang.
