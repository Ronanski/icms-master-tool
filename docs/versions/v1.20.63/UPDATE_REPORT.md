# v1.20.63 (Beta) — Scenario UAT sa loob ng app (walang babasahin sa repo)

**Problem:** (user) Ang UAT ay dapat madali, malinaw, diretso, at tama ang resulta mula input hanggang output; wala siyang babasahin sa repo; sakop ang lahat ng control ng operator na may gumagalaw na proseso.
**Work Done:**
- Sa UAT panel ng app, sa itaas ng bawat sheet na may scenario: **SCENARIO TEST** na may isang pindot (▶ LAHAT, o ▶ bawat scenario). Bawat linya = isang gawin o isang tseke: ✔ / ✖, "inaasahan" at "nakita".
- Ang runner (`src/ui/uat/scen.js`) ay ang mismong ginagamit din ng headless test (`npm run scenarios`), kaya iisa lang ang code.
- Mga scenario ay nasa `src/ui/uat/scenarios/ABC-007.json`; inalis ang `docs/scenarios` (hindi na kailangang basahin).
**ABC-007:** 14 scenario, 156 tseke, lahat tama: force manual (20 kaso), SV path, MANUAL / SV / AUTO na may proseso, AUTO -> MAN bumpless, REMOTE / LOCAL, mga mode input, trip ng fan at pagbalik.
**Na-check:** `npm run scenarios` 156 / 156; UAT dry run 2458 items, 6808 cases, 0 failing; `npm run check`; screenshot ng UAT panel sa ABC-007 (lahat ✔).
**Hindi pa na-check:** sa device (tablet / apk / exe); bilis ng mahabang scenario sa tablet (ang ilan ay 20 min ng simulation).
**Susunod:** ABC-011, 012, 019, 003A-E, 030, 052 (BU-CMD / MFT / positioner ng ABC-007 ay nasa listahan din).
