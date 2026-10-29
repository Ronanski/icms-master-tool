# Current Project Handoff

> Iisang kasalukuyang estado lang. Palitan kapag nagbago; huwag magdagdag ng kasaysayan (nasa `docs/versions/<ver>/UPDATE_REPORT.md` at git history). Pinaikli 2026-10-26: ang dating 200+ linya ng lumang Beta notes ay tinanggal dito.

## SIMULAN DITO (2026-10-26 PHT)

- **Stable:** v2.4.0 (huling Stable).
- **Beta:** `3.2.0-beta.53` sa `main` (2026-10-28: iisang linya; ang tine-test ay laging nasa main, Stable lang ang may GO STABLE). Kasama ang bagong HMI Air & Flue Gas, sand DITL, page links.
- **Ang gusto ng user:** `docs/SPEC.md` (S1 ~ S9). Plano = seksyon 3 ng file na iyon. Wala nang ROADMAP / CHECKLIST.
- **Pag-check ng user:** `docs/USER_CHECK.md`.
- **Rules:** `CLAUDE.md`, `PROJECT_RULES.md` (test policy = seksyon 5).
- Golden reference ng start-up (Claude Doc): https://claude.ai/artifact/D2EXiHjLsiJf12RBPniT39

## Utos ng user na madalas malimutan
- Update sa user bawat ~30 minuto habang may mahabang trabaho, may ETA sa oras (PHT). Sumagot muna bago magpatuloy.
- Test batay sa reference (PR-OPE-5002, DITL, ATS criteria, FHI Fig. 2, HMI snapshot), hindi sa coach ng Training. Ang kulang na model ay FAIL, hindi "field step".
- Huwag magpush ng paisa-isang UI fix: lakarin muna ang bawat screen (PC, tablet, phone) bago ang Beta.
- Per-loop, Warm at Hot: TINANGGAL na sa app (beta.39). Huwag ibalik hangga't hindi sinasabi ng user.

## Bagong HMI (PR #49, roadmap step 6)
- Desisyon ng user 2026-10-26: ang HMI ay GUGUHITIN MULI (sariling vector graphics); ang snapshot ay gabay lang. Pinalitan nito ang lumang "kopyahin 1:1".
- `src/ui/plant/hmi2.js`: library ng simbolo + screen `AFG` (Air & Flue Gas). `plant.js` draw: `sys.v2` → `PLANT_V2.draw` (parehong live link / faceplate).
- Huwag pa tanggalin ang lumang Plant HMI hangga't wala pang kapalit ang lahat ng system (14 screen sa `docs/hmi/HMI_SYSTEMS.md`).

## Estado ng app (links ABC ↔ DITL)
- ABC ↔ DITL: ang BAWAT "FROM / TO DITL xx-nn" sa ABC (233) ay page link (`dsTextAt` / `dsTextClick` sa `links-canvas.js`, pick sa `interaction.js`); listahan = pagpipilian; DITL → ABC ay may ↩ Back sa ABC (`AN.hist` marker `{dig:true}`). Test: `tests/regress/abc_ditl_links.js`.

## Estado ng app (beta.39 dev, PR #47)
## Estado ng app (beta.39 (+ sand))
- Sand injection DITL 771 ~ 777 (`(D71)DITL-771` ~ `(D77)DITL-777`) galing sa PDF: `docs/versions/v3.2.0/DITL_SAND_AUDIT.md`, test `tests/regress/ditl_sand.js`. Analog ng LT / PT ay ON / OFF lang.
- Turbine + TCS model (`src/analog/engine/tcs.js`, `docs/tcs/ATS_CRITERIA.md`), start-up steam ayon sa FHI Fig. 2 / 3 / 4 (`unit.js`).
- `tests/regress/sop_bawal.js`: 19 / 19 (lahat ng maagang aksyon ay tinatanggihan).
- Training: Cold → 150 MW sa isang screen (dock), sunod sa PR-OPE-5002. beta.40: ang MS blow-off at start-up valve ay sa serbisyo na bago ang vacuum stage (dati: stall sa hakbang 43, MFT sa low-low drum level).
- RH biasing damper: ang model ay bumabasa ng HICHR1002A.MV (`plant.js` `AN_XACT`); tama ang direksyon (mas bukas = mas mainit na reheat, ABC-020). Ang SH biasing damper ay nananatiling AUTO (pasya ng user, `anSelSelf`). Ang TCS / GMCB input row ng DITL ay naka-link na (`world.js` `tcsIn`).
- SH temperature (`unit.js` `U.sh` / `U.ld`): iisang kadena spray 1 → SH no.2 → spray 2 → finishing SH; lakas ng spray 2 mula sa snapshot (`plant.js` `AN_KUP`); firing ratio na may lag at deadband 0.75 (`U.frDb`).
- Plant chip: OFF | Unit lang; starting state: Cold o 150 MW lang. Plant model ON na walang starting state: header "—", ang ABC page ay bumubukas na Cold.

## Susunod na gagawin (roadmap sa `docs/SPEC.md` seksyon 3)
0. 2026-10-29 PM PHT: **Beta 3.2.0-beta.53** sa main = #102 / #103 / #105 / #106 ng live check R18 (air flow at furnace pressure ≤ 5 s ang tugon, Total air PA + SA + FA, oras ng alarm na lumabas sa suppression, NOTE ng H40) at #101 (40 min na nakatagong page pagkatapos ng H30).
0. 2026-10-29 PM PHT: **Beta 3.2.0-beta.52** sa main = #100 ~ #104 ng live check R16 / R17 (diesel PCV, drum level na walang FW, FA flow, purge air ayon sa SOP, IDF coupling MV ▲/▼ at AUTO).
0. 2026-10-29 ~11:30 AM PHT: **Beta 3.2.0-beta.51** sa main = 5 natitira sa beta.50 (#99 furnace pressure kapag IDF lang, #98 diesel PCV buttons, #91 Bantayan galing sa model o "— walang model", #96 NOTE ng alarm, #23 update banner).
0. 2026-10-29 ~8:30 AM PHT: **Beta 3.2.0-beta.50** sa main = 9 nakita sa live check ng beta.49 (#90 ~ #97 at #23): condensate / hotwell / deaerator water balance, BFWP suction pressure mula sa deaerator, MOV ng Hakbang 26 gumagalaw na, drum level alarm ayon sa alarm list, NOTE ng Hakbang 30, HMI Steel default at alarm strip = header, Bantayan live, DITL Legend. Check: totoong pindot Hakbang 1 → 30.
0. 2026-10-28 ~10:45 PM PHT: **Beta 3.2.0-beta.49** sa main = Plant view dalawang page lang (007 Air & Flue Gas bago, UNIT · controllers); tinanggal ang 27 lumang screen at mga larawan nito. Rule ng user: hanggang 3 branch lang bukod sa main.
0. 2026-10-28 ~10:10 PM PHT: **Beta 3.2.0-beta.48** sa main = bagong HMI (PR #49) + sand DITL (PR #48) + docs PR #44 / #50 / #51 + R9 #86 ~ #90 + maling SYSTEM TRIP alarm ng DITL-777 sa Cold. Check: totoong pindot Hakbang 1 → 20, 7 bahagi. Hindi isinama (luma / napalitan): PR #40, #41, `adoring-carson`, `feat/persistent-context-retrieval`, `ccr-8a6a202c` (listahan sa user bago burahin).
0. 2026-10-28 ~9:05 PM PHT: **Beta 3.2.0-beta.47** = 19 findings ng retest 9 (air preheater START, NOT TRIP alarm, TCS oil, SOP limits / tag / NOTE sa dock, Hakbang 14 ~ 17 hiwalay, gitna sumusunod nang tama, ‹ Nakaraan, header). Check: totoong pindot Hakbang 1 → 20 (hindi buong start-up). #23 hindi nasubok; #60 bahagi (61 / 121).
0. 2026-10-28 ~6:30 PM PHT: **Beta 3.2.0-beta.46** = retest 8 (R8) sa ugat: isang equipment block (START / STOP, FIELD, MAN / AUTO, TRIP, lamp, values) at isang step engine (✓ TAPOS + Susunod, stable na buttons, Cold reset ng DITL). Check = totoong pindot, 2 pasada nang hindi nililinis ang storage. #60: 70 item ng 007 walang plant model (flue gas path), "—".
0. 2026-10-28 ~4:00 PM PHT: **Beta 3.2.0-beta.45** = lahat ng bukas na findings ng retest 7 (sa ugat; paliwanag sa UPDATE_REPORT). Sinubok ng maikling check ng bawat linya ng check-list (hindi ang buong start-up). Susunod: live retest ng user.
0. 2026-10-28 1:20 PM PHT: **Beta 3.2.0-beta.43** (build 7b1d18c) = #13 (walang drawing ng lumang sheet sa likod ng Home / Training). HINDI nasubok.
0. 2026-10-28 1:08 PM PHT: **Beta 3.2.0-beta.42** (build 283da5c) = retest 5 fixes. Bagong rule ng user: AUTOMATIC ang Beta (bawat batch = bagong Beta number); Stable lang ang kailangan ng GO STABLE. HINDI nasubok; live test ng user ang susunod.
0. 2026-10-28 12:45 PM PHT: **Beta 3.2.0-beta.41** (build e9929bf, GO BETA ng user) = lahat ng bukas na findings ng retest 4 (#54–#58, #35, #13, #23, #42, #38, #9; table sa UPDATE_REPORT). Build at check lang; HINDI nasubok. Susunod: live test ng user.
0. 2026-10-28 ~12:00 PM PHT: **Beta 3.2.0-beta.40** (build id sa status bar) = lahat ng 29 findings ng retest 3 (table sa UPDATE_REPORT). Build at check lang; HINDI nasubok. Susunod: live test ng user mula Step 1, isang hakbang bawat G.
0. 2026-10-28 ~4:20 AM PHT: inayos (code lang) ang 18 findings ng retest (table "retest fixes" sa UPDATE_REPORT). HINDI nasubok: bawal ang anumang run / probe / headless test (user 2026-10-28); ang tanging test ay live, pinapanood ng user, isang hakbang bawat G niya.
0. 2026-10-28 (PHT): inayos ang 22 findings ng live Training test ng user (table sa `docs/versions/v3.2.0/UPDATE_REPORT.md`, "walkthrough fixes"). Ang Training ay nagsisimula na naka-PAUSE ×1; ang test tools ay pumipindot ng RUN. Ang Cold drum ay −300 mm na at pinupuno sa hakbang na STEAM DRUM FILLING. Susunod: test ulit mula Step 1, sa approval lang ng user.
1. Roadmap 3 TAPOS, 4 bahagi (2026-10-27, branch `claude/project-thread-5nq9pa`, nakapatong sa PR #47): starting points, P1 fix queue, P2 #13 / #14, Training MOV steps. Itinigil ng user ang mahahabang test: ang buong Cold → 150 MW ay HINDI pa nasubok sa build na ito. Ang user ang dadaan sa Training sa sariling PC.
2. (LUMA, napalitan ng utos 2026-10-28: walang run ni Claude) Dati: isang `tools/training/checkpoint/run.js --nostop` run (itinatala ang lahat ng hinto at switch trip, hindi humihinto), ayusin lahat, isang final run. Huwag ulit-ulitin ang buong run (user 2026-10-27).
3. Natitira: P2 #7 ~ #12; HP bypass na hindi pa sinasara ng sarado na MV-MS1391.

## Hindi pa nasubok
PC / tablet / EXE / APK ng user sa beta.25 pataas; ang `docs/USER_CHECK.md` ay hindi pa nilalakad ng user.

## Saan ang mga bagay
- References: `document-references/` (listahan: `CLAUDE.md` rule 4).
- Source: `src/` (`src/README.md`); build `npm run build`, `npm run check`; html sa `dist/`.
- Tests: `tests/regress/` (README sa loob), `tools/training/human_run.js`, `tools/ui-audit/audit.mjs`.
- Instrument / control valve / shutoff valve list laban sa plant model + fix queue (2026-10-27): `docs/versions/v3.2.0/INSTRUMENT_VALVE_COVERAGE.md`, data `instrument-coverage.csv`; source `document-references/over-all-instrument-list.xlsx`, script `tools/data/instrument_coverage.js`.
- Reports: `docs/versions/v3.2.0/UPDATE_REPORT.md`; link audit `UNLINK_AUDIT.md`; ABC audit `docs/abc-audit/ABC-AUDIT.md`; HMI operating points `docs/hmi/`.
- Workflows: `.github/workflows/` (checks bawat push; site, release, clean = GO STABLE lang).

## Mga tala
- Huwag ipadala ang html sa chat (~3.7 MB); gamitin ang Beta page.
- Hindi ma-delete ang lumang branch mula sa cloud session; ang user ang gagawa sa GitHub Branches page (kung gusto niya).
