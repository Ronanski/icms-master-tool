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

## 7. Decisions log (user's own words, PHT)
Full list of every user message in this thread (with exact text) is private: `turnover-private/jennie/USER_MESSAGES_FULL.txt` on the PC and in the project files. The decisions are:
- 2026-11-09 7:57 PM: new account; Jennie is the new LEADER, continue from HANDOVER_2026-11-10.
- 2026-11-10 6:55 AM: "Go stable" (Stable 3.2.1 from beta.281).
- 2026-11-10 8:48 AM: "Ok go sa 1" (Stable 3.2.2, Worker default on the Stable site).
- 2026-11-10 6:11 PM: Mina does one Cold to full load live test at the end; the team finishes the plan first and may self-check automatically. "Ayaw ko ng paulit2 na cold to 150MW."
- 2026-11-10 6:16 PM: split the work across threads.
- 2026-11-10 11:20 PM: "diretso ung live test ni mina s dulo nyan ha.. tuloy tuloy yan. no need n tnungin p sakin"
- 2026-11-11 6:07 AM: "Puro assumed ha. Bawal yan" (every value needs a source).
- 2026-11-12 8:41 AM: the Plant Simulator Plan count must not grow (fixed task list).
- 2026-11-12 11:17 AM: sessions must not go offline when the user is away; find a way.
- 2026-11-13 6:51 PM: "Tigil nga muna ang tester at plant model makers." (STOP)
- 2026-11-13 7:36 PM: no training guide as a basis; the plant must start the way it really starts, without the SOP.
- 2026-11-13 7:47 PM: "Ok go" (Jennie live start-up from HMI and faceplates).
- 2026-11-13 11:46 PM: no patches; "Code ang gawin. Hnd temporary fix!"
- 2026-11-14 8:16 AM: one whole physics plant; manuals and design documents allowed; no HMI snapshots, trends or start-up / shutdown procedure as a basis.
- 2026-11-14 9:42 AM: keep the existing model, fix only what is patched or incomplete; still follow DCS, TCS, PLC, GCP, HMI logic.
- 2026-11-14 10:17 AM: save before a step, fix, load and continue (no restart from Cold).
- 2026-11-14 12:30 PM: unlimited supply (silos, tanks).
- 2026-11-14 2:16 PM: "Go sync"; later excitation, sync, load up watched by the user.
- 2026-11-14 8:46 PM: start-up again, automatic in the logic; only a few manual actions; target MW on HIC-ULD with CCS AUTO.
- 2026-11-15 10:40 AM: "magload down ka sa 120MW at 90MW at 75MW then load up sa 150MW. Auto ha."
- 2026-11-15 11:12 AM: physics must include everything (sand, limestone, feeders, efficiency).
- 2026-11-15 11:48 AM: one unit, one DCS, one plant; no separate models.
- 2026-11-15 3:03 PM: the logic is the source of truth and is not modified.
- 2026-11-15 3:35 PM: "Sige tapusin mo na yan.."
- 2026-11-15 7:55 PM: "Wala ng live test, d n ntn gagamitin ung training test n un s start up n cold."
- 2026-11-15 7:56 PM: only Jennie may live test; Training is a guide only, no separate code.
- 2026-11-15 8:37 PM: turnover now, also on the PC; include artifacts, PDF and conversations.

## 8. Where to find things
- State and next steps: `HANDOFF.md`, this file, `docs/turnover/INDEX.md`.
- Rules: `CLAUDE.md` (Commandments), `PROJECT_RULES.md`, `docs/SPEC.md`.
- Beta history: `docs/versions/v3.2.3/UPDATE_REPORT.md` and `git log`.
- Plant model code: `src/analog/engine/unit.js` (boiler, bed), `hx.js` (heat exchangers), `api.js` (faceplate presses), steady state `src/data/st150.txt` (made by `tools/steady150/make.cjs`).
- Private (PC only, git-ignored): `turnover-private/` (full user messages, artifact HTML copies, PDFs), `../team-files/` (STATE.md, physics audit, findings, pictures), `../document-references/` (plant documents).
- Artifacts (claude.ai, private): Tracker `https://claude.ai/artifact/4ghD2uQkHeyKwrmqcaypTs` (bago, 2026-11-15), Plant map `https://claude.ai/artifact/39fXcpnZz3ybjCeC9s9FSN`, Plant Simulator Plan `https://claude.ai/code/artifact/2b9597e2-86ea-4b83-90b0-4ceef2e1ce58`.
- Open PRs (not mine, old): 93 HMI kit, 443 / 444 plant model 4B, 639 / 642 shell. Branch of this turnover: `claude/turnover-jennie`.
