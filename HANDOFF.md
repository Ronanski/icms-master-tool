# Current Project Handoff

> Single current handoff. Replace outdated status when work changes; do not append a chat transcript.

## Project
DCS Logic Simulator in `Ronanski/icms-master-tool`. Current version **v1.20.24**, Stable (GO STABLE from the user, 2026-10-13): `logic-sim-v1.20.24.html` in the root (title and header badge say v1.20.24). `document-references/logic-sim-v1.20.21.html` is the unedited reference build. Work only in this repository (PROJECT_RULES 5b).

## Where things are
- Rules: `PROJECT_RULES.md`. ABC audit method, coverage and findings index: `docs/abc-audit/ABC-AUDIT.md`. Evidence: `docs/versions/v1.20.21/` (F-1 ~ F-31, batches 1 ~ 31) `docs/versions/v1.20.23/` (F-32 ~ F-35) and `docs/versions/v1.20.24/` (Channel box, update report, release report PDF, UAT form).
- Sources: `document-references/` (ABC drawings zip, I/O list, memory lists, F(X), parameter workbook, legends, textbook, flow-compensation and drum-level workbooks).
- Tools: `tools/regress/` (headless checks, see its README), `tools/uat/` (builds the UAT form and the release report), `tools/version.js` (version from the html name; exactly one `logic-sim-vX.Y.Z.html` in the root).
- Workflows (`.github/workflows/`): `checks.yml` (title / version label / script parse on every push), `site.yml` (GitHub Pages: Stable = html of main at `/`, Beta = html of the pushed branch at `/beta/`), `release.yml` (manual, input `GO v<version>`, `dry_run`: builds one apk and one portable exe (Stable) and publishes html, apk, exe, release report and UAT form). apk signing key `signing/logic-sim.jks` is self-signed and must not be regenerated (a new key means a reinstall).

## State
- All 54 ABC sheets run in RUN mode; switches, timers, LAG, ALM, PID (dMVH, TF, CUT, GAP), F(X), parameters and AI ranges are checked against the drawings and workbooks. Units are real values (PROJECT_RULES 4a).
- Release v1.20.24 assets: html, `Logic-Sim-v1.20.24.apk`, `Logic-Sim-v1.20.24-portable.exe` (Stable only), `Release-Report-v1.20.24.pdf`, `UAT-v1.20.24.html`. The apps load the Pages site and update by themselves. Inside the app a Channel box (top right) switches Stable / Beta and remembers the choice; Beta is never a release, it is the html of a pushed branch at `/beta/`.
- Inputs next to a "( FROM ABC-xxx )" text without a partner net are operator / mode / DITL inputs by design (FINDINGS v1.20.23).
- Assumptions without a formula in the references: dMVH per 1 s, TF first-order filter, CUT low cut, GAP dead zone.

## Next actions
1. The user does the UAT (`UAT-v1.20.24.html`) and reports the MALI lines; fix each one.
2. Releases only on **GO STABLE** / **GO BETA**; new html = new version (v1.20.25 ...).
