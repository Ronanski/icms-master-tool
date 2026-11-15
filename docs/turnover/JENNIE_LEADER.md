# Turnover: JENNIE (Leader, plant model)

Date: 2026-11-15, 8:45 PM PHT. Written on the user's PC (local repo) and pushed to GitHub.

## 1. Where things are
- Stable: v3.2.2 (2026-11-10). Release on GitHub: apk, Windows exe, html, report pdf.
- Beta on `main`: 3.2.3-beta.263 (commit 923daf98). Beta site deploys by itself after Checks pass.
- Repo: `Ronanski/icms-master-tool`. PC folder: `Downloads/app-projects-ai-collections/projects/icms-master-tool/icms-master-tool`.
- Team notes (not in the repo, PC only): sibling folder `team-files/` (STATE.md, physics-audit-2026-11-15.md, findings).
- Plant documents stay on the PC only (`document-references/`), never in the public repo.

## 2. Standing rules from the user (still in effect)
- Logic (ABC / DITL drawings) is the source of truth and is never changed to make the plant work.
- One physics plant model for every state (cold, warm, hot, 150 MW). No clamps, no curve fits, no ratios to make a number match. Every number is a design-document input or a calculation with its source.
- HMI snapshot, plant trends and SOP are checks only, not inputs.
- Load change is done in AUTO / CCS with the target only on HIC-ULD.
- Testing (user 2026-11-15): only Jennie may run a live test. The Training cold start-up is a guide only: never proof, and no separate code just for Training. Mina (tester) is still under the 11-13 STOP.
- Beta merges by itself when Checks pass. Stable only on the user's written "GO STABLE".

## 3. Done in this period (beta.261 to beta.263)
- beta.261: load up in AUTO works again. Pressing the HIC-ULD target wrote the raw target onto the limited MW demand, so the high limit tracked down and the load stopped. Fixed in the app press code, not the logic. Start at 150 MW is now the plant model's own steady state. The fitted coal-to-steam line was removed.
- beta.262: SH spray at 150 MW as the FHI design (about 12 T/H at full load). The in-furnace SH panel heat transfer was set from the design spray. New steady state at 150 MW: MW 151.0, steam 459.7 T/H, coal 82.4 T/H, bed 828 C, drum 133.4 kg/cm2, MS 540.7 C, RH 538.0 C.
- beta.263: lower furnace refractory is its own heat lump. The bed now answers the coal at the speed of its solids. The low-load swing at 75 MW became smaller (coal 41 to 51 T/H, was 39 to 54).

Load swing on beta.261, all AUTO, no trip (last minute of each hold):
- 120 MW: MW 121.5, drum 128.7, level -3, MS 548, RH 537, bed 816, O2 7.2.
- 90 MW: MW 91.5, drum 127.9, level -12, MS 545, RH 547, bed 777, O2 10.5.
- 75 MW: MW 76.4, drum 124.0, level -13, MS 541, RH 540, bed 749, O2 10.5.
- Back to 150 MW: MW 151.1, drum 133.8, level +22, MS 535, RH 538, bed 842, O2 5.4.
- Loops in MAN during the swing: SICL1060A/B/C and LICBR1001B (still to be checked against the logic).

## 4. Open items (next, in this order)
1. Coal and drum pressure still swing about every 15 min at 75 MW. Candidates: the circulation (phi) exponent 2 has no source; char burn time 60 s; PIC-COBM tuning against the bed lag.
2. Bed 828 C at 150 MW; FHI says 850 to 900 C (plant trend 955 C is a check only).
3. MS peaks at 553 C on the way down to 90 MW; spray about 3 % at 90 MW (FHI near 0 at 60 %).
4. Check in the logic whether SICL1060A/B/C and LICBR1001B in MAN is correct.
5. Regression tests that loop stepSet over all sheets run the plant about 51 times too fast; change them to one sheet set per scan.
6. bed_heatup test fails on 262 and 263; it jumps the bed to 470 C at load, so the test itself needs a review.

## 5. How to run the plant headless (correct way)
One sheet set per 0.5 s scan, as the app scheduler does:
`const C = AN.sheets.find(s => s.name === 'ABC-001C'); WORLD.live = true; AN.stepSet(C, .5); WORLD.tick(.5);`
Never loop stepSet over all sheets.

## 6. Release steps for a Beta
Version = main + 1 in `src/version.txt`, new line in HANDOFF.md and `docs/versions/v3.2.3/UPDATE_REPORT.md`, `npm run build`, `npm run check` (SAME), PR with the attribution block, then `gh pr merge N --auto --squash --delete-branch`.
