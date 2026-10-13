# Current Project Handoff

> Single current handoff. Replace outdated status when work changes; do not append a chat transcript.

## Project
DCS Logic Simulator in `Ronanski/icms-master-tool`. Current Stable **v1.20.26** (v1.20.27 is Beta on branch `auto-chk`, waiting for GO STABLE) (GO STABLE, 2026-10-13; in-app UAT with AUTO-TEST and 670 scenarios, update check with the user's choice): `logic-sim-v1.20.26.html` in the root (title and header badge say v1.20.26). `document-references/logic-sim-v1.20.21.html` is the unedited reference build. Work only in this repository (PROJECT_RULES 5b).

## Where things are
- Rules: `PROJECT_RULES.md`. ABC audit method, coverage and findings index: `docs/abc-audit/ABC-AUDIT.md`. Evidence: `docs/versions/v1.20.21/` (F-1 ~ F-31, batches 1 ~ 31) `docs/versions/v1.20.23/` (F-32 ~ F-35) and `docs/versions/v1.20.24/` (Channel box) and `docs/versions/v1.20.25/` (in-app UAT, update check) and `docs/versions/v1.20.26/` (pin fix, commissioning checks, update report, release report PDF).
- Sources: `document-references/` (ABC drawings zip, I/O list, memory lists, F(X), parameter workbook, legends, textbook, flow-compensation and drum-level workbooks).
- Tools: `tools/regress/` (headless checks, see its README), `tools/uat/` (`inject.js` builds the in-app UAT into the html, `make-report.js` the release report), `tools/version.js` (version from the html name; exactly one `logic-sim-vX.Y.Z.html` in the root).
- Workflows (`.github/workflows/`): `checks.yml` (title / version label / script parse on every push), `site.yml` (GitHub Pages: Stable = html of main at `/`, Beta = html of the pushed branch at `/beta/`), `release.yml` (manual, input `GO v<version>`, `dry_run`: builds one apk and one portable exe (Stable) and publishes html, apk, exe, release report and UAT form). apk signing key `signing/logic-sim.jks` is self-signed and must not be regenerated (a new key means a reinstall).

## State
- All 54 ABC sheets run in RUN mode; switches, timers, LAG, ALM, PID (dMVH, TF, CUT, GAP), F(X), parameters and AI ranges are checked against the drawings and workbooks. Units are real values (PROJECT_RULES 4a).
- Release v1.20.26 assets: html, `Logic-Sim-v1.20.26.apk`, `Logic-Sim-v1.20.26-portable.exe` (Stable only), `Release-Report-v1.20.26.pdf` (no UAT file: the UAT is inside the app, green UAT button). The apps load the Pages site; `sw.js` keeps the installed page and the app ASKS before updating (I-update ngayon / Huwag muna, button ⟳ Update?), for the PWA, the apk and the exe. Inside the app a Channel box (top right) switches Stable / Beta and remembers the choice; Beta is never a release, it is the html of a pushed branch at `/beta/`.
- Inputs next to a "( FROM ABC-xxx )" text without a partner net are operator / mode / DITL inputs by design (FINDINGS v1.20.23).
- Assumptions without a formula in the references: dMVH per 1 s, TF first-order filter, CUT low cut, GAP dead zone.

## User and style (read CLAUDE.md first)
The user is not a coder, reads on a phone / tablet, gets angry at long or technical answers and at repeated tests; the credits are nearly used up. Short Taglish, exact steps and exact expected values, honest about what was not checked.

## Notes
- Never send the html through the chat: the attachment is cut at about 160 ~ 205 KB (the html is 3.7 MB). Use the Beta page (push a branch) or the release asset.
- After a change to the logic run `node tools/uat/inject.js` so the UAT expected values follow, and `node tools/uat/make-report.js` for the report.

## Open item found by the user's AUTO-TEST (Needs Verification, v1.20.27 docs)
31 value scenarios (Normal / Kondisyon / Loop on ABC-001C, 002, 003A ~ D, 011, 012, 029, 050 ~ 053, 055) give different values when RUN was pressed before the test than in a fresh sheet (list and numbers in `docs/versions/v1.20.27/UPDATE_REPORT.md`). v1.20.27 shows them as TINGNAN. To do: find which state survives `Reset` after RUN (AI start values 0 vs 100 on ABC-053, plant start, ramp), decide the correct start state (RUN mode start), and make the expected values (tools/uat/inject.js) come from that state. Reproduce: `/tmp`-style script: open the html, go to ABC-053, click Run, open UAT, AUTO-TEST.

## Next actions
1. The user tests in the apk and the portable exe (green UAT button: AUTO-TEST LAHAT) and reports the MALI lines; fix each one. After a change to the logic run `node tools/uat/inject.js` again so the expected values follow.
2. Releases only on **GO STABLE** / **GO BETA**; new html = new version (v1.20.27 ...). No workflow run, merge or release without the user's order in that message.
3. If the user reports MALI lines from the UAT: reproduce on the sheet named (tools/regress, tools/uat), fix, `node tools/uat/inject.js`, push a branch (that is Beta), wait for GO STABLE.
4. Left to the user's device test: apk / exe start, the update question (I-update ngayon / Huwag muna), the line colours (dilaw napili / abo hindi).
