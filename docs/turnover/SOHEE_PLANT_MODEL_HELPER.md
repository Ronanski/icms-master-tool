# Turnover: SOHEE : PLANT MODEL HELPER

Isinulat 2026-11-15, 8:55 PM PHT, bago mag-expire ang account (Nov 17). Thread: SOHEE : PLANT MODEL HELPER (sinimulan 2026-11-12, 5:33 PM PHT). Repo: Ronanski/icms-master-tool, branch `claude/project-thread-ef6ad4`.

Basahin muna, sa ganitong ayos: `CLAUDE.md` (COMMANDMENTS), `HANDOFF.md`, `PROJECT_RULES.md`, `docs/SPEC.md`. Dinadagdag lang ng file na ito ang alam ng thread na ito.

## 1. Goal ng thread

Gawin ang plant model ng mga main-plant system na wala pang model, at ayusin ang mga finding na nasa area ko. Kasama rito ang condensate, deaerator, FA blowers, sootblowers, instrument air, motor temperatures at BFWP. Hindi kasama ang fuel, ESP at ID fan (Jennie), ang boiler at drum (Chaewon), at ang turbine (Sakura).

Utos ng user na nagsimula nito (2026-11-12, 5:33 PM PHT): "I mean may mga d pa ata nagagawan ng plant model eh?"

## 2. Status sa isang tingin (2026-11-15)

- Main ay nasa 3.2.3-beta.263. Lahat ng PR ko hanggang beta.189 (PR 632) ay naka-merge.
- **BUKAS: PR 639** (branch `claude/project-thread-ef6ad4`, head 8c0da48, may pamagat na beta.196). Hindi pa naka-merge. Luma na ang base nito (beta.194), at nasa 263 na ang main, kaya kailangan itong i-merge sa main, bigyan ng bagong numero, at i-rebuild.
- **CRITICAL na hindi pa naayos sa main: S194-2.** Kapag sinara ang BFWP-A suction valve V-FW1001 sa 150 MW, nag-MFT ang boiler. Nasa PR 639 ang ayos. Nasuri ko noong 2026-11-15 na nasa main pa ang maling linya (`src/analog/engine/unit.js` ~line 5010: `if (m.drw && anFv(['V-FW1001', 'V-FW1002'][i]) < 5) return a;`).
- Bagong rule (coordinator, 2026-11-15): **walang merge kung walang GO ng user.** Kaya hinihintay ng PR 639 ang GO ng user.

## 3. Ang laman ng PR 639 (hindi pa naka-merge)

0. **S194-2 CRITICAL (galing sa live test ni Mina).** Ang suction valve check ng BFWP sa "machines stopped" loop ng `unit.js` ay tumatakbo sa bawat machine line na may DITL drawing. May drawing din ang PA fan (DITL-26A) at ang SA fan (DITL-27A), na galing sa `boiler.js`. Kaya kapag sarado ang V-FW1001, nagiging 0 ang flow ng dalawang fan, at nagkakaroon ng TOTAL AIR FLOW < 25 % MCR, kaya MFT sa 6 s.
   - Ayos: sa BFWP line na lang ang check (`U.mul[0].suc = ['V-FW1001','V-FW1002']`).
   - Ebidensya: bagong test `tests/regress/bfwp_suction_mft.js`. Sa lumang build, FAIL ito: PA / SA factor 0, at MFT sa 6 s ("TOTAL AIR FLOW < 25% MCR"). Sa bagong build, PASS: PA / SA factor 1, walang MFT sa 180 s, at tumatakbo ang BFWP-B na may tubig.
1. **eng_worker (app bug).** Gumagawa ng `U.el` ang `elec.js` anElec habang binabasa lang nito ang state, kaya sa Worker mode ay hindi na tugma ang page sa engine. Ginawa itong read-only.
2. **reset_worker (app bug).** Hindi nabubura ng Reset ang `_mvWhy` (`ditl150.js` D.clear) at ang `proc.nsat` (`sheets.js`). Inayos na.
3. **Tests:**
   - `eng_radio_winter`: tumatakbo ang ACWP-A sa sourced 150 MW (HMI snapshot 27.PNG, ditl150 EQ), kaya pinapahinto muna ito ng test gamit ang STOP PB (DITL-76 row 18, M.1231).
   - `reset_worker`: kinukumpara ang local at Worker nang hindi kasama ang `nl._v`, ang page-read net cache na sadyang hindi kinokopya ng mirror.

Mga test na tumakbo (2026-11-13):
- eng_set: PASS ang eng_radio x4, eng_worker, reset_worker at train_open (local at worker).
- FAIL ang eng_world, reset_clean at ditl_sim, pero FAIL din sila sa main beta.194. Pinatakbo ko ang baseline sa build ng main mismo. Sa reset_clean, bumaba ang differences mula 16 papuntang 13.
- Green ang CI (checks at sim) sa head 8c0da48.

Plant run gate (`tests/plant_runs/gate.cjs`, Worker mode) sa PR 639 (beta.196):
- cold: FAIL, MFT sa step 73 "Vacuum up". Ang unang takbo ay huminto sa step 30 diesel oil, pero hindi ito naulit sa pangalawang takbo.
- hot: FAIL, MFT sa step 68 "Condensate polisher". Kapareho ito ng kay Jennie sa main.
- warm: FAIL, MFT sa step 73.
- shutdown: FAIL, huminto sa step 121 "Load change rate HIC-MWRL".
- Hindi natapos ang baseline ng gate sa main (beta.198) dahil na-restart ang container. Ayon sa coordinator (2026-11-13), bumabagsak din ang main sa drum LL sa Cold, Warm at Hot (inaayos ni Chaewon). Rule: puwedeng mag-merge kung pareho ang resulta sa main.

## 4. Mga naayos at naka-merge (sunod-sunod)

- beta.116 (PR 563): sampling at chemical dosing (pH, oxygen, conductivity, phosphate, dosing pumps).
- beta.124 (PR 573): naka-hold ang ID fan damper PCD-FG1056-1 kapag walang instrument air.
- beta.126 (PR 574): PAF / SAF / IDF motor winding at bearing temperature.
- beta.127 (PR 575): kumukuha ng steam ang sootblowers habang nagbu-blow; kailangan ng MV-SB1001 ang header.
- beta.129 (PR 576): loop_source Cold PICAS1005, ang test ang mali (BU-CMD M.0129 ng ABC-030).
- beta.132 (PR 578): steam ng air heater blowers N-1040 / 1042.
- beta.139 (PR 580): drain temps ng sootblower TT-SB1056 / 1057; IAPWS-IF97 region 2 steam table (CALC).
- beta.140 (PR 584): docs. SA wall dampers NO-SOURCE; na-refresh ang coverage list.
- beta.148 (PR 588): MV-TS1003 (extraction papuntang DA) at XV-HR1010-1 (warming).
- beta.149 (PR 592): condensate polisher MV-CD1007 / 1008 / FCV-CD1121.
- beta.150 (PR 593): FA blower surge valves XV-FA1055-A2 / B2; 2 bug.
- beta.151 (PR 594): sanhi ng motor stop ng logic sa Event log (S148-3).
- beta.153 (PR 597): tinanggihang TCS command sa Event log, NORMAL OPERATION button (S149-3/4/7).
- beta.154 (PR 598): FA blower old save line-up, FAB step para sa B, FA damper faceplates (F151-1/2/3).
- beta.156 (PR 600): standby FA blower B ng old save (S154-3).
- beta.161 (PR 603): Event log line kapag ginalaw ng logic ang MOV (heater HI-HI ang nagsasara sa MV-TS1001 ~ 1005).
- beta.163 (PR 607): Normal shutdown 45 → 30 MW gamit ang FIC-CM (S155-1).
- beta.164 (PR 609): S160 old save line-up line; damper bago ang standby AUTO.
- beta.167 (PR 610): FAB B current L.L. trip (S160-2, S165), DA LOW-LOW switch alarm line.
- beta.171 (PR 615): "CURRENT L.L." na ang stop cause.
- beta.174 (PR 617) at beta.176 (PR 619): DITL timer TR tags, ayon sa pagkakasulat sa drawing.
- beta.178 (PR 621): BFWP motor winding mula sa closed cooling water.
- beta.179 (PR 622): BFWP bearings mula sa KSB lube oil system.
- beta.180 (PR 623): FA blower valves, spring open kapag walang instrument air.
- beta.183 (PR 626): instrument air loss MFT chain (DITL-03G NC contacts), FA blower silencer current.
- beta.185 (PR 628): plant switch rows, binubura na ang stale 150 MW field bit.
- beta.189 (PR 632): FORCED pill sa default layout, Worker AN.cat race, fw_fp at dock_open_run tests.

Wala sa mga ito ang na-live test ko. Si Mina ang live tester. Ang live-pass na alam ko: S160-1 / S160-2 (beta.165), FAB swap (beta.151), at FORCED pill (beta.189).

## 5. Mga utos ng user na sinusunod (salita niya at petsa)

- 2026-11-12, 5:33 PM PHT: "I mean may mga d pa ata nagagawan ng plant model eh?" Ito ang simula ng thread.
- 2026-11-06: "Db wala go beta". Dati, merge sa Beta kapag pasado ang Checks. Pinalitan ito ng coordinator noong 2026-11-15: walang merge kung walang GO ng user.
- 2026-11-11, 6:07 AM PHT: "BAWAL ANG ASSUMED", kaya bawat value ay may doc at page, o NO-SOURCE.
- 2026-11-11, 6:45 AM PHT: huwag humingi ng source sa user. Hanapin sa lahat ng PC doc, at CALC mula sa documented inputs.
- 2026-11-12, 8:41 AM PHT: huwag magdagdag ng task sa Plant Simulator Plan. Ang bagong fix ay sa note ng parent task.
- 2026-10-16: bawal mag-alis ng link para lang gumana.
- Mga patuloy na rule mula sa COMMANDMENTS:
  - STABLE at manual workflow ay sa "GO STABLE" lang.
  - Never kill processes by name.
  - Huwag baguhin ang test para lang pumasa.
  - Taglish 80/20, walang emoji, walang "po", PHT.

## 6. Sources na ginamit (nasa PC ng user, `document-references/`, hindi sa public repo)

- I/O list STN102 I.028F ZSO-FW1031 (BFWP-A suction manual valve open), I.032F ZSO-FW1032 (B).
- DITL-23A: row 11 / 12 suction valve permissive, row 14 RUNNING, row 20 STOP PB, row 21 / 24 REMOTE. DITL-26A (PAF), DITL-27A (SAF).
- DITL-03G / 03A row 16 / 06 row 23: IA L.L. 2 out of 3 < 3.5 kg/cm2, 2 s, MFT. Row 27 PSL-IA1706-NC 2.8 kg/cm2 (alarm list).
- DITL-28A / #B (FA blower; row 17 on delay 5 s; M.1033 / M.1043 FCD READY), DITL-61A (CEP; LL stop), DITL-76 row 18 (ACWP STOP PB M.1231), DITL-80 / 80A / 80P (sootblower), DITL-83 (XV-HR1010-1 < 250 / > 330 °C), DITL-94 ~ 98 (extraction MOVs), DITL-96 (MV-TS1003).
- ABC-030 BU-CMD M.0129; ABC-031 (hotwell, dump valve FF M.0164 / M.0165); ABC-036 M.0203.
- HMI snapshot 27.PNG (ACWP-A runs at 150 MW), 18.PNG (sootblower drains), 21 (sampling), 28.png (polisher bypassed).
- Fan Instruction Manual (Cheng Chen): 4.1 ID fan pneumatic actuator data sheet (airlock 2.5, in place), 6.5 TECO motor data (Class F, rise 90 °C).
- L10-2 sootblower O&M (Diamond Power), p93 steam data. L20 gas air heater O&M (3900 kg/h, 19 min 40 s bawat lance). PD-015 (sootblower header), PD-042 (dosing).
- KSB LOS O&M (oil 30 L/min 65 → 50 °C, cooler 13.65 kW). TECO IC81W BFWP motor (CCW 5 ~ 37 °C, 430 ~ 470 L/min, rise 80 °C, 355 A).
- Continental P&ID 500-0ds (FA blower valves single acting, normally open). Equipment list 46.1 (FA blower).
- PR-OPE-5002-02 (start-up; FAB start-up; oil warm-up 60 °C/h). TCS ATS sequence 310SC90-775 p28 ~ 29 (step 7 NORMAL OPERATION bago ang step 8 SHUT-DOWN).
- PID parameter list (LICCD1110A P 71.4 %, I 420 s).
- NO-SOURCE na naiwan:
  - fail position ng TCV-FG1116 / 1117
  - SA wall damper flow effect
  - fan bearing temperature
  - FA blower / SWP / ACWP motor temps
  - silica
  - polisher / bypass split
  - drain line warm-up (120 s / 30 min)
  - PCV-SB1053 Cv

## 7. Open issues (sa area ko)

1. **S194-2 CRITICAL**: nasa PR 639, hindi pa naka-merge (section 3).
2. **S194-3 MEDIUM**: ang permissive faceplate ng BFWP-A ay "REMOTE MODE SELECTED" lang ang pinapakita, at walang "suction valve open" (ZSO-FW1031).
   - Sanhi na nakita ko (probe, 2026-11-13): ang `LS_DOCK.interlock('DITL-23A')` (`src/ui/training/dock.js` interlock / needNet) ay naglilista lang ng kulang para maging 1 ang start output. Habang tumatakbo ang pump, naka-set na ang FF, kaya wala itong nilalista. Ang REMOTE rows lang ang idinadagdag nang hiwalay.
   - Ayos na iminumungkahi: ipakita ang buong START permissive ng drawing (lahat ng input ng start AND bago ang FF: suction valve row 11, lube oil HIGH row 17, at iba pa), na may live 0 / 1 kahit tumatakbo ang pump.
   - Hindi pa ginawa.
3. **FORCED banner, List / Go**: nagiging itim na kahon pagkapindot (live check ni Mina, 2026-11-13).
   - Code: `src/ui/shell/cr.js` fBar (`#crfbar`), fFill (`#crflist`).
   - CSS: `src/ui/shell/app.css:985-998` (`#crfbar button` transparent, `color:#fff`).
   - Hinala, hindi pa napatunayan: focus / active style ng default layout. Kailangan ng screenshot bago at pagkatapos pindutin.
4. **Tests na bumabagsak din sa main**: eng_world (page vs engine sa 120 scans, 672 / 1119 / 1154 differences), reset_clean (13 differences), ditl_sim (SIMULATE real time check, ABC → DITL rows). Hindi pa sinimulan. Malamang luma ang ditl_sim sa bagong layout at sa "one world always on" rule.
5. Tanong na bukas pa: sa probe, nanatiling 1 ang DITL-23A row 14 RUNNING kahit pinindot ang STOP PB (row 20) sa 150 MW. Hindi ko sinundan. Baka sa AUTO / standby o sa paraan ng probe ang sanhi.

## 8. Susunod, sa ayos

1. Kunin ang GO ng user para sa PR 639. Pagkatapos:
   - i-merge ang main sa branch
   - bigyan ng susunod na libreng numero (lampas 263)
   - i-rebuild (`npm run build`, `npm run check` = SAME)
   - patakbuhin ang `bfwp_suction_mft.js` at ang gate, at ikumpara sa gate ng main
   - isulat ang baseline sa PR body, saka mag-merge
2. S194-3: buong START permissive sa BFWP faceplate. Ang List / Go itim na kahon: screenshot muna, saka ayos.
3. eng_world, reset_clean, ditl_sim: alamin muna kung test o app ang mali.

## 9. Saan hahanapin

- Mga PR: https://github.com/Ronanski/icms-master-tool/pulls (639 bukas). Git log ng main: `git log --oneline origin/main | grep beta.<n>`.
- Changelog: `docs/versions/v3.2.3/UPDATE_REPORT.md`.
- Mga test ko: `tests/regress/` (bfwp_suction_mft, ia_loss_mft, air_model, plant_sw_field_bits, forcelist, fw_fp, dock_open_run, fab_current_ll_cause, ditl_timer_tags, cep_stop_cause, at iba pa).
- Gate: `tests/plant_runs/gate.cjs`.
- Findings ni Mina: `/mnt/project-files/findings-2026-11-09-reshell*.md`. Mga larawan ni Mina: `/mnt/project-files/b32*.jpg`. Ang larawan ng S194-2 ay nasa team-files/pictures/b32194-bfwpA-suction-closed-MFT-air.jpg (sa PC).
- Mga larawan ko: `/mnt/project-files/sohee-plant-model/`.
- Old save ni Mina: `/mnt/project-files/b142-150MW-cold-run.json`.
