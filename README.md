# ICMS Master Tool

Overall tool for the Instrumentation and Control Maintenance Section.

## DCS Logic Simulator

Ang simulator (ABC analog + DITL digital) ay binubuo mula sa `src/` papunta sa ISANG html file. Ang plant references ay nasa `document-references/`.

## Start here

1. Ang gusto ng user (spec, meron / kulang, plano): [docs/SPEC.md](docs/SPEC.md). Pag-check ng user: [docs/USER_CHECK.md](docs/USER_CHECK.md).
2. Read [PROJECT_RULES.md](PROJECT_RULES.md) before modifying the project.
3. Read [HANDOFF.md](HANDOFF.md) for the current project status and next actions.
4. Mga ulat ayon sa bersyon: `docs/versions/`. ABC audit: [ABC-AUDIT.md](docs/abc-audit/ABC-AUDIT.md). Lumang files: `archive/`.

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
| `delivery/` | DELIVERY | `android/` (apk), `desktop/` (portable exe), `signing/` (apk key, huwag i-regenerate), `pwa/` (sw.js, manifest, icons ng Pages) |
| `dist/` | BUILD OUTPUT | `logic-sim-vX.Y.Z.html`, ang isang html na ginagamit ng Beta / Stable page, apk at exe |
| `.github/workflows/` | AUTOMATION | checks, site (Pages), release, clean-releases |
| `archive/` | ARCHIVE | lumang ulat at lumang build |

Ang `logic-sim-vX.Y.Z.html` sa `dist/` ay build output (huwag i-edit; `npm run build`, `npm run check`).

## Change and release control

Audit against source documents before proposing logic changes. DITL: puwede nang galawin para sa ikabubuti ng simulation (user 2026-10-15, PROJECT_RULES 4). Beta: bawat ayos ay push agad sa working branch (PROJECT_RULES 5e). Merge sa `main`: **GO BETA** lang. Stable release at workflow run: **GO STABLE** lang (user 2026-10-30).
