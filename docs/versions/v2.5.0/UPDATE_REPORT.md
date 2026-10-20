# 2.5.0 — Update report (Beta)

> Ang beta.1 ~ beta.4 sa ibaba ay ginawa bilang 2.3.0-beta.N. Habang ginagawa, inilabas ang v2.4.0 Stable (bagong shell) sa `main`, kaya ang drawing audit ay pinagsama sa `main` at binilang ulit bilang 2.5.0-beta.1 (PROJECT_RULES 5f: hindi pababa ang version).

## beta.1 — Drawing audit at ayos ng mga link (2026-10-19)

- **Problem:** Hiningi ng user ang audit ng natitirang ABC sheet laban sa PDF at ng page linking (DITL ↔ DITL, DITL ↔ ABC). Pagkatapos ng audit, "Ayusin lahat".
- **As Found:** (`DRAWING_AUDIT.md`) 28 / 50 ABC sheet walang mali. Mga link na hindi nakakabit o mali:
  - ABC-001C: hindi nagfo-force manual ang boiler master kapag hindi REMOTE ang coal master (kulang ang M.2000 sa OR M.2013).
  - ABC-001D: walang epekto ang HIC-MWRL sa BIR gain (laging 0.95).
  - ABC-013: hindi nagsisimula ang house operation sa turbine trip / 52G1 open.
  - ABC-011 / 012: ang A (LOCAL) ng TICBR1130 / TICBR1150 ay hindi nagfo-force manual sa TICBR1140 / TICMS1004.
  - ABC-057: walang AUTO / MANUAL button ng front / rear wall dampers (laging MANUAL).
  - ABC-009A / 009B: ang DITL manual request M.331D ay hindi umaabot; ang lahat-MAN ng 4 screw cooler at ang MAN ng PIC-BASC ay hindi umaabot sa furnace DP control.
  - ABC-004A: maling deviation sa tracking ng coal flow (B / C IN MANUAL hindi nakakabit).
  - ABC-008: walang tag ang HYDRAULIC CONTROL SELECT M.0200.
  - ABC-020: ang "I" (HICHR1002B.MV) laging 0, may talon ang damper sa MAN → AUTO.
  - ABC-054: ang PV ng PICHR1391 hindi sumusunod sa HRH pressure kapag walang unit model.
  - DITL: "80S-57" ikinabit sa DITL-80 (maling equipment); row "21A" hindi nabasa (REMOTE ng 4 screw cooler); "TO DITL 40-xx" ikinabit sa maling comparator (MSP HIGH kapag mababa); 27 DITL row FROM ABC walang link (heater / DA HI-HI, HP / LP bypass MAN, bias damper, MFT sa DITL-15).
- **Work Done:** (`DRAWING_TRACE.md` bago ang code; `UNLINK_AUDIT.md` para sa 2 maling link na pinalitan)
  - Talaan ng ayos bawat sheet (`src/analog/engine/audit-fix.js`), inilalapat pagkatapos basahin ang drawing; may tsek ng block at net, may babala kapag hindi tugma.
  - Mode alias: ang M / A / R ng TICBR1130 / TICBR1150 ay nagsusulat din sa M.0230 / M.0240 (`hmi.js`, `hmi-op.js`).
  - Station wiring S2 → S1 para sa ABC-013 (I.0400 / I.0932 / I.0937 → M.3200 / M.3220 / M.3221, `unit.js`).
  - DITL: row na may letra ("21A") ay binabasa (`letterRows`); "3A-63" = 03A-63; "80S" ay PLC, hindi DITL-80; DITL row FROM ABC ay nakakabit ayon sa address / tag (kasama ang analog na value sa comparator ng DITL-79 at ang MANUAL ng controller); "TO DITL 40-xx" sa tamang comparator.
  - Walang binagong formula, range, timer o parameter.
- **As Left:** Test `tests/regress/audit230.js`: 19 / 19 PASS (bawat ayos sa itaas, sa app mismo). Regression: tests.js 11 / 11, world.js 11 / 11, ditl150.js 9 / 9, plant_live.js 12 / 12, faceplate.js, engine isolated.js: lahat PASS. Binago ang inaasahan ng world.js (ABC-017 I.024E ay PLC na, hindi DITL) at ng ditl150.js (40-09 ay direktang M.310D na).
- **Status:** Pass (beta.1). Natitira: DITL-21C row 19 / 20 (M.311A / B, walang pinagmulan sa ABC-009A ng app; hindi mabasa). Susunod: beta.2 behavior (grupo B), beta.3 datos (grupo C).

## beta.2 — Behavior ayon sa drawing (grupo B, 2026-10-19)

- **Problem:** Apat na gawi ng engine na iba sa nakasulat sa drawing (`DRAWING_AUDIT.md` grupo B).
- **As Found:**
  - Coal feeder A / B / C: ang MV ay umaabot sa 40 T/H kahit lahat ay REMOTE at tumatakbo (dapat ≤ 83.3 % = 33.3 T/H).
  - Burner A ~ D SA flow: ang "SET SV = 49 T/H" sa house operation ay hindi umaabot sa SV ng controller.
  - Oil master: ang tracking (SI0304) ay laging kumukuha sa burner A, kahit ibang burner ang REMOTE (may talon).
  - Ramp ng air demand / PA demand 11x / 6.5x mas mabagal; ramp ng HP bypass spray temperature SV 12x mas mabagal.
- **Work Done:** (`DRAWING_TRACE.md` beta.2) MV high limit mula sa `<tag>.MHD` sa MAN station; SET SV sa operator SV na nananatili; pili ng SI0304 mula sa REMOTE ng FICDO1043A ~ D; span ng ramp 1115 T/H, 648 T/H, 600 °C. Walang binagong link.
- **As Left:** `tests/engine/audit230b.js` 4 / 4 PASS (33.32 T/H kapag M.3405 = 1, 38 T/H kapag 0; SV 20.8 → 49 at nananatili; C lang ang REMOTE → leg C; 2.23 / 1.296 T/H bawat s, 10 °C / min). Regression sa beta.2 html: audit230 19 / 19, tests.js 11 / 11, world 11 / 11, ditl150 9 / 9, plant_live 12 / 12, faceplate, isolated PASS. pid_am: 1 mali (FIC-CM ABC-004A, MANUAL value 0 sa halip na 32.5); pareho rin ang mali sa v2.2.0 Stable at sa beta.1, kaya hindi galing sa beta.2 (dating isyu, hiwalay na ayos).
- **Status:** Pass. Susunod: beta.3 datos (grupo C).

## beta.3 — Datos ayon sa drawing (grupo C, 2026-10-19)

- **Problem:** Apat na datos sa app na iba sa drawing (`DRAWING_AUDIT.md` grupo C).
- **As Found:**
  - LICBR1001A (drum level 1 element, ABC-010): range -24 ~ 74 mm mula sa parameter workbook; ang drawing ay "-422 ~ 820 mm" (pareho ng LICBR1001 / LICBR1001B).
  - ABC-008 AND B74 (force manual ng PICFG108A sa M.0204): ang input na "B.0664" ay hindi nakakabit (laging 0); ang FURNACE PRESSURE (A) SIG.AB sa kaliwa ng sheet ay B.0644.
  - ABC-004B / 004C: baligtad ang pangalan ng "<1 %" at TONS 2 s (M.0154 / M.0156, M.0164 / M.0166). Pangalan lang, pareho ang logic.
- **Work Done:** (`DRAWING_TRACE.md` beta.3, `UNLINK_AUDIT.md` 3) range ng LICBR1001A mula sa drawing (inilalapat pagkatapos ng parameter workbook sa bawat Reset); B74 input = B.0644; tamang pangalan ng 4 na signal. Walang inalis na link.
- **As Left:** `tests/engine/audit230c.js` 5 / 5 PASS (range -422 ~ 820 span 1242; tatlong SIG.AB → B74 = 1; mga pangalan). Build at check SAME. Regression sa beta.3 html: hmi_op 34 / 34 (kasama ang drum level loop), unit_load 19 / 19, audit230 19 / 19, audit230b 4 / 4, tests.js 11 / 11, world 11 / 11, isolated PASS.
- **Status:** Pass ang test ng ayos.

## beta.4 — Itsura: trace at status bar (user, 2026-10-19)

- **Problem:** User: "pag nagtrace may glow effect" (pangit, mahirap basahin); ang UAT / CHECK button ay nakalutang at tumatakip sa sheet list.
- **As Found:** ang trace ay blur na liwanag sa paligid ng wire (CSS drop-shadow); ang ibang wire ay 35 % pa rin ang liwanag. UAT / CHECK ay `position: fixed` sa ibabang kaliwa, sa ibabaw ng sheet list.
- **Work Done:** (itsura lang, walang binago sa logic o engine) ang na-trace na wire mismo ang may kulay: puti = pinili, asul = pinanggagalingan, magenta = pinupuntahan; mas makapal, walang blur; ang ibang wire 18 %. UAT at CHECK nasa status bar na (katabi ng Events).
- **As Left:** screenshot ng ABC-010 trace ng LICBR1001A.MV (malinaw na asul na linya, walang blur; UAT / CHECK sa status bar, hindi na natatakpan ang sheet list). tests.js 11 / 11, check SAME.
- **Status:** Pass. Susunod (hinihintay ang pili ng user): pangalan at icon ng exe / apk, Loop view, value sa bawat block, "Bakit MANUAL?".

## 2.5.0-beta.1 — Pinagsama sa v2.4.0 (2026-10-19)

- **Problem:** Inilabas ang v2.4.0 Stable (bagong shell, icon, pangalan, plant model switch) sa `main` habang bukas pa ang PR #32. Hindi kasama roon ang drawing audit.
- **Work Done:** merge ng `main` sa branch (walang rebase / force push). Bersyon 2.5.0-beta.1. Ang ayos ng UAT / CHECK sa status bar (dating beta.4) ay ibinalik sa ayos ng 2.4.0, dahil ang bagong shell na ang naglalagay sa kanila. Nanatili ang solid na trace (walang glow). Docs inilipat sa `docs/versions/v2.5.0/`.
- **As Left:** sa 2.5.0-beta.1 html: audit230 19 / 19, audit230b 4 / 4, audit230c 5 / 5, tests.js 11 / 11, world 11 / 11, ditl150 9 / 9, hmi_op 34 / 34, unit_load 19 / 19, plant_view 18 / 18 (test ng 2.4.0), isolated PASS, check SAME.
- **Status:** Pass.

## 2.5.0-beta.2 ~ beta.4 — Pinagsama ang UI Beta at ang drawing audit; full audit ng engine (2026-10-19)

- **Problem (user: "Pareho, sunod-sunod"):** isama ang drawing audit (PR #32, 2.5.0-beta.1) sa UI Beta (PR #34, 2.4.1-beta.10), tapos buong audit ng engine at simulation ng pinagsamang app.
- **As Found:**
  - **beta.2 (merge lang):** sira ang M4 cold start-up: 3 / 17 (coal transfer: feeder A at C hindi tumatakbo sa AUTO, bed 622 °C; hindi umabot sa 150 MW). M4 45 → 150 MW: 1 / 14. Galing sa PR #32 (pareho sa 2.5.0-beta.1 lang; ang 2.4.1-beta.10 ay 16 / 17 at 14 / 14).
  - **Sanhi:** ang average select ng ABC-001C EIC-TM.PV (generator MW AI0419 / AI0774) ay humahawak ng huling value kapag 0 lahat ng input (zero = lost signal, rule ng user v1.20.34). Sa Start cold / warm / hot, hawak pa nito ang 151.5 MW ng 150 MW snapshot. Ang "MW" link sa ABC-013 ay nag-set ng M.025A (> 81.5 MW), at dahil nakakabit na ng audit ang turbine trip / 52G1 open (ABC-013-1), naging M.025B = 1 (house operation) habang start-up. Dahil dito, ABC-004A M.0141: lahat ng coal feeder ay force MANUAL, at ang FIC-CF ay back-up sa 0.
  - **Sa scenario:** inner R bago outer A ang SH spray. Ayon sa drawing (ABC-011 M.0230 = TICBR1130.LOC, ABC-012 M.0240 = TICBR1150.LOC, audit ABC-011-1 / 012-1), MANUAL ang outer habang hindi REMOTE ang inner. Ang lumang hakbang (A sa outer bago R sa inner) ay hindi tinatanggap, kaya nanatiling M ang TICBR1140 / TICMS1004.
  - **pid_am FIC-CM (ABC-004A):** ang test ang mali, hindi ang app. Ang manual leg ng AMT B / T ay M.0130 "COAL MASTER CONTROL FORCE MANUAL & TRACKING" (memory list 101): habang ON, back-up value ang output, hindi ang value ng operator (CLAUDE.md 10).
- **Work Done:**
  - `src/analog/engine/hmi-op.js` anPlantCold: walang hawak na MW ang average select ng generator MW (AI0419 / AI0774) sa cold plant. Ang ibang select (pressure, level) ay hindi ginalaw. Ang unang bersyon (lahat ng select) ay nagpabago sa Start hot (HP bypass 90 %, drum level −268 mm), kaya pinaliit ito.
  - `src/ui/uat/check.js` M4 hakbang 5: inner R, tapos outer A pagkalipas ng 1 min. Pareho rin sa `docs/OPERATOR_GUIDE.md` 5.7.
  - `tests/regress/pid_am.js`: kapag ON ang back-up ng drawing, ang inaasahang output ay ang back-up value.
  - Walang binagong drawing, link, formula, range o parameter.
- **As Left (headless, 2.5.0-beta.3 / beta.4 code):**
  - **CHECK:** M3 lahat (tt 10, mft 7, bfwp 7, idf 7, paf 6, hh 3); M2 load 14 / 14; M5 load down 14 / 14, normal shutdown 7 / 7, bottle-up 15 / 15. M4 bawat hakbang: cold 10 / 10, coal 9 / 9, byp 8 / 8, roll 11 / 11, 45 → 150 MW 14 / 14.
  - **M4 Cold start-up (buo):** 15 / 17. RH pressure 9.1 sa bypass stage (alam na mula v2.2.0). Drum level −153 mm sa roll stage ng chain (limit ±150; ang roll na mag-isa ay 11 / 11).
  - **Full audit, 31 test:** isolated, audit230 / b / c, tests, world, closure, pid_am (56 PASS, 10 hindi masubok ayon sa disenyo), force_manual 68 / 0, controllers_table, panel_sync, faceplate, manstation, overview, events, infocard, abcbar, lookonly, plant_live, plant_view, ditl150, loaddown, unit_trip, hmi_op, reset, switches, stale_beta, unit_load: PASS. Ang values_layout at pv_reacts ay listahan ng diagnostic: pareho ang bilang sa 2.4.1-beta.10. refcheck: F(X) 89 table, 136 PID / MAN / SUMA row, 157 AI range: walang bagong pagkakaiba.
  - UI: layout.js lahat PASS (walang binago sa UI mula 2.4.1-beta.10).
- **Natuklasan pero hindi binago:**
  - RH blow-off MV-HR1391 (flow diagram K1AU3-PD-012 rev D): 6" na branch, walang nakasulat na capacity. Ang `unit.js` rhb 0.1 ay IPINALAGAY pa rin; ang tantiya mula sa 6" RH safety valves ay ~0.13 (inference).
  - LP bypass PCV-HR1010 (ang PICHR1003 ay pangalan ng controller): ang spray FT-CD1115 0 ~ 46 T/H ay tumutugma sa ~140 T/H na steam (lpb ~0.3); ang `unit.js` ay 0.8 (IPINALAGAY, beta.16). Ito ang malamang na sanhi ng RH 9.1. Hindi binago: apektado ang lahat ng scenario.
- **Status:** Pass maliban sa M4 buong takbo 15 / 17. Ang PR #32 ay kasama na rito: puwede nang isara (desisyon ng user).

### Kilalang isyu (desisyon ng user 2026-10-19: "Itala muna")

- **M4 Cold start-up (buo) 15 / 17:**
  - **RH pressure 9.0 ~ 9.1 sa bypass stage (limit 9.0).** Sanhi: ang MSP ay lumalampas sa 126.5 (SV 123) habang minimum ang coal (FIC-CF 10 %). Biglang kumukuha ang HP bypass ng 25 → 75 T/H, at humahabol ang LP bypass PID ng ABC-052 nang +3 % kada 30 s (parameter ng drawing).
  - **Sinubok na walang epekto:** rhb 0.13 (tantiya mula sa 6" RH blow-off sa K1AU3-PD-012) = 9.0; buong bukas ng RH blow-off ng operator = 9.0. Hindi binago ang app.
  - **Drum level −153 mm (±150) sa roll stage ng chain:** pasado ang roll kapag mag-isa (11 / 11).
  - **Ayos sa hinaharap:** hakbang ng operator sa CHECK (mas mabagal na HP bypass SV / mas maliit na apoy sa pressure raise; feedwater sa roll).

## 2.5.0-beta.5 ~ beta.6 — Mga pending sa listahan (user: "tapusin na mga pending sa listahan", 2026-10-19)

- **Problem:** tapusin ang mga bukas sa `docs/CHECKLIST.md` bago ang Stable: DITL-21C row 19 / 20, scenario ng force manual / interlock per cluster (#4), PLANT graphics na walang kulay ng takbo / hinto.
- **As Found:**
  - **DITL-21C row 19 / 20** (M.311A / B furnace DP signal abnormal): walang pinagmulan sa ABC-009A (beta.5, ebidensya sa `UNLINK_AUDIT.md`).
  - **Interlock per cluster:** walang test na nagsisimula sa TRIP SIGNAL mismo (ang dating test ay pumipilit lang sa wire ng select).
  - **PLANT 011 COAL FEEDER:** ang "M" (motor) ng feeder A / B / C ay naka-drawing bilang valve na walang tag, kaya laging bukas at hindi live. **012 ~ 015 START-UP BURNER:** ang BURNER ON / OFF lamp ay nakapirmi. Ang ibang screen na walang motor (UNIT, 004, 005, 018, 029, 033, 039) ay walang motor sa HMI snapshot din: tama na ito.
  - **Bagong nakita:** sa "Start at 150 MW", MANUAL ang RH / SH gas bias damper (HICHR1002A / B) at TICHR1002A; sa 39.PNG ay A / A at R.
- **Work Done:**
  - beta.5: `src/world/world.js` station wiring M.311A / B = ABC-009A B.0646 / B.066E (memory list 101 / 103, I/O list AI0134 / AI0262).
  - beta.6: `tests/regress/interlock.js` (bago): bawat A/M station, mula 150 MW, binabago isa-isa ang digital input ng drawing papunta sa MANUAL leg (pati pulse 0 → 1, timer hanggang 20 s, AND ng sabay na input). Dapat pumasok sa MANUAL at tumanggi sa A habang naka-trip.
  - beta.6: `src/ui/plant/plant.js` + `systems.js`: bagong item na motor ("M"): pula = takbo, berde = hinto, mula sa memory bit ng drawing (coal feeder A / B / C = M.3400 / M.3401 / M.3402, "BC FROM S4"). Lamp: BURNER-A ~ D ON / OFF mula sa oil flow ng burner (PV ng FICDO1043A ~ D > 0.05 T/H; ang flame bit ng BMS ay wala sa ABC sheet).
  - Walang binago sa engine, drawing, link, formula, range o parameter sa beta.6.
- **As Left (headless):**
  - interlock.js: 57 station na may force manual sa drawing, lahat PASS (cluster a 15, b 5, c 2, d 4, e 4, f 2, g 3, h 2, j 4, k 5, iba pa 5). 0 mali. 16 station ay walang digital input sa MANUAL leg (operator lang ang A / M, hal. ABC-031 ~ 039 heater drain, condensate). TICHR1012: ang force manual ay pulse ng pagsara ng LP bypass (M.071F) o parehong RH transmitter abnormal; naka-MANUAL na ito sa 150 MW (sarado ang LP bypass).
  - plant_live: lahat PASS, kasama ang coal feeder A / C = M.3400 / M.3402 = 1 sa 150 MW. plant_view PASS. Screenshot: feeder B pinahinto = berdeng "M"; burner A may oil = ON pula.
  - Buong UI self-check 93 screen (PC, tablet 1280×800 / 800×1280, phone): walang overlap o lumalampas.
  - Engine ay pareho sa beta.4 / beta.5: hindi kailangang ulitin ang M2 ~ M5 (pareho ang resulta sa itaas).
- **Sinubok pero hindi isinama (kilalang isyu):** RH / SH gas bias damper. Sanhi: sa unang scan pagkatapos ng Reset, ang pulse ng ABC-020 TPS (NOT HICHR1002B.MAN) ay nag-set ng M.017A ("1:B" = MANUAL ayon sa legend ABC-000), at sa M.0179 pati ang RH damper. Ang ayos (walang pulse sa steady na load + mode ng MAN station mula sa snapshot) ay nagpaayos ng damper at ng hmi_op, PERO bumaba ang M5 load down 10 / 14, bottle-up 12 / 15, M4 45 → 150 MW 11 / 14, M4 buo 13 / 17: ang mga scenario ay naka-tune sa damper na MANUAL. Ibinalik. Susunod: ayusin kasabay ng tuning ng scenario. Paalala: ang memory list 102 ay "M.017A ... FORCE AUTO", pero ang drawing ay "1:B" sa A/M switch na may COS (legend: B = manual); sinunod ang drawing.
- **Status:** Pass. Natitira: damper sa itaas, M4 buong takbo 15 / 17 (RH 9.1, drum −153), pagsubok sa device.

## 2.5.0-beta.7 — RH / SH gas bias damper at buong M4 (user: "gawin mo na yung dalawa na pending mo", 2026-10-20)

- **Problem:** (1) "Start at 150 MW": RH / SH gas bias damper (ABC-020 HICHR1002A / B) at TICHR1002A MANUAL; sa 39.PNG ay A / A at R. (2) M4 buong cold start-up 15 / 17 (RH pressure 9.1, drum −153 mm).
- **As Found:**
  - (1) Pagkatapos ng Reset, ang unang scan ay binasa ang lahat ng pulse input na 1 na bilang bagong pagbabago. Ang TPS ng NOT HICHR1002B.MAN (2 s) ay tumatakbo pa nang i-load ang 150 MW. Kasama ang ID fan running, na-set nito ang FF M.017A ("1:B" sa A/M switch na may COS = MANUAL, legend ABC-000), at sa M.0179 pati ang RH damper.
  - Sa unang subok (beta.6), pinalitan din ang mode ng lahat ng MAN station mula sa snapshot. Iyon ang nagpalit sa boiler master HIC-BM (68.3 → 51.1 %) at nagpababa ng M4 / M5. Hindi iyon kailangan: ang pulse lang ang sanhi.
  - (2) Ang RH 9.1 ay mula sa damper na MANUAL: sa damper na AUTO, ang M4 buo ay 16 / 17 (drum pasok), at RH 9.0. Ang tseke ay "< 9" pero ang nakasulat na criterion ay 7.5 ± 1.5 (hanggang 9.0).
  - Sinubok na mas maagang pagbukas ng RH blow-off ng operator (sa 7.9 kapag tumataas): RH 9.0 pa rin at naiwan ang blow-off na bukas, at bumaba ang roll (drum −169). Hindi isinama.
- **Work Done:**
  - `src/analog/engine/hmi-op.js` anPlantLoad150: sa simula, walang tumatakbong pulse (TPS / TPV), dahil steady state ang snapshot (pareho ng prinsipyo ng anPlantCold, 2.2.0-beta.16). Walang binago sa drawing, link, formula o parameter.
  - `src/ui/uat/check.js` M4 hakbang 3: ang RH pressure ay hinuhusgahan sa ipinapakitang value (isang decimal) laban sa nakasulat na 7.5 ± 1.5: 9.0 pasok, 9.1 hindi. Walang binago sa hakbang ng operator.
- **As Left (headless, 2.5.0-beta.7):**
  - 150 MW: HICHR1002A / B A (M.017A = 0, M.0179 = 0), TICHR1002A sumusunod; boiler master 68.3 % (hindi nagbago).
  - CHECK: M3 lahat (tt 10, mft 7, bfwp 7, idf 7, paf 6, hh 3); M2 14 / 14; M5 load down 14 / 14, normal shutdown 7 / 7, bottle-up 15 / 15; M4 cold 10 / 10, coal 9 / 9, byp 8 / 8, roll 11 / 11, 45 → 150 MW 14 / 14; **M4 buo 17 / 17** (drum −54 ~ 52 mm, RH ≤ 9.0).
  - hmi_op, unit_load, unit_trip, tests, audit230, pid_am (56 PASS, 10 hindi masubok ayon sa disenyo), force_manual 68 / 0, switches 438 / 0, reset, faceplate, panel_sync, plant_live, plant_view, world, manstation, loaddown, ditl150: PASS. closure: pareho sa beta.6. interlock cluster f (ABC-019 / 020): PASS.
- **Status:** Pass. Wala nang bukas na trabaho ni Claude sa CHECKLIST; natitira ang pagsubok sa device at ang pagbura ng lumang branch (user).

## 2.5.0-beta.8 — Page link sa DITL at PID sa plant model OFF (user: "YUNG MGA PAGE LINK SA DITL, DI GUMAGANA DI MAPINDOT", 2026-10-20)

- **Problem:** (1) Sa DITL, ang reference sa FROM column (kaliwa) at TO column (kanan) ng row, hal. "28A-77", "ABC-006", "15-10,20-11", ay hindi mapindot. (2) Tanong ng user: tama ba ang tugon ng ABC logic kapag ang user ang nag-force / nag-simulate, kahit OFF ang plant model?
- **As Found:**
  - (1) Walang code sa DITL para lumipat ng page mula sa reference. Mayroon lang sa ABC (bilog na connector at "FROM / TO DITL"). Ang ABC → DITL ay nagbubukas lang ng sheet, hindi ng row.
  - (2) Nasubok na ang MANUAL (pid_am), force manual (68), at bawat switch (438), lahat plant model OFF. Ang hindi pa nasubok: ang direksyon ng PID sa AUTO kapag pinilit ng user ang PV o SV.
- **Work Done:**
  - `src/ui/shell/ditl.js`: binabasa ang reference ng FROM / TO cell gaya ng nakasulat sa drawing. Ang item 1 ~ 50 ay input row, ang 51 ~ 79 ay output row 1 ~ 29 (gaya ng `src/world/world.js`). Ang "ABC-003A,3B" ay ABC-003A at ABC-003B. Ang "3A-63" ay DITL-03A.
    - Asul at may guhit ang link.
    - Kapag pinindot, bubukas ang sheet sa row na iyon at kikislap ang row. Pareho ang zoom.
    - Kapag maraming page sa isang cell, may lalabas na pagpipilian.
    - May **◀ Back** sa DITL top bar.
    - Gumagana sa View at Run. Sa Run, ang input switch ay nasa S column at sa panel pa rin.
  - `src/digital/parts/07-app-events.js`, `04-render.js`: ang pindot sa link cell, ang kulay ng link, at ang kislap na hindi nawawala habang tumatakbo ang Run.
  - `src/analog/ui/links-canvas.js` dsGoRef: ang ABC "FROM / TO DITL 26A-55" ay nagbubukas na ng mismong row. Ang ◀ Back ay bumabalik sa ABC sheet.
  - Bagong test: `tests/regress/ditl_pagelink.js` at `tests/regress/pid_auto.js`.
  - Walang binago sa logic, drawing, link ng signal o parameter.
- **As Left (headless, 2.5.0-beta.8):**
  - ditl_pagelink: lahat PASS sa PC 1440 × 900, tablet 1280 × 800 at phone 390 × 844, sa View at Run.
    - DITL-01 row 3 "28A-77" → DITL-28A output row 27.
    - DITL-03A row 11 TO "15-10,20-11 32-10,33-10" → pagpipilian na may 4 → DITL-33 input row 10.
    - DITL-01 row 13 "ABC-006" → ABC-006.
    - ABC-020 "26A-55" → DITL-26A row 5.
    - ◀ Back sa lahat.
  - pid_auto (plant model OFF, mula sa 150 MW), 68 PID / PIDV:
    - 39 na AUTO: PASS. Hawak ang output kapag PV = SV. Kapag PV > SV, pababa ang ACT:R at pataas ang ACT:N, at kabaligtaran. Nasa loob ng MV limit. Ang PV filter (TF) at GAP ng parameter list ay sinusunod.
    - 29 na MANUAL sa 150 MW: sinusundan ng PID ang manual output. Ang MANUAL ay sakop ng pid_am at force_manual.
- **Status:** Pass.

## 2.5.0-beta.9 — DITL = VIEW / SIMULATE, at pagsubok ng bawat logic block ng ABC (user: "go lang", 2026-10-20)

- **Problem:**
  - (1) User: "need pa ba ang step simulate? wag na kaya? either VIEW at SIMULATE ON/OFF nalang", at dapat gumagana ito sa plant model ON / OFF at sa ABC+DITL ON / OFF.
  - (2) User: hindi lang switch ang susubukan. Dapat tama ang output ng LAHAT ng logic block mula input hanggang output, pati ang forcing / simulation sa plant model ON / OFF.
- **As Found:**
  - (1) Ang DITL bar ay may ▶ Run / ❚❚ Pause, ▶▶ step, step size at speed (⏱ menu).
  - (2) Ang mga dating test ay sumusubok sa switch / A-M, force manual, PID MAN at mga scenario. Walang test na bawat block ay pinipilit ang input at sinusuri ang output.
- **Work Done:**
  - `src/ui/shell/ditl.js`, `layout.js`: DITL bar = **[VIEW | SIMULATE] Reset ◀ Back**, at Fit / Zoom / Panel gaya ng dati. Ang SIMULATE ay real time (1x). Ang VIEW ay simulation OFF. Wala nang ▶▶, step size, speed at Pause. Ang status sa ibaba ay "SIMULATE".
  - Walang binago sa DITL logic, ABC logic, drawing, link o parameter.
  - Bagong test `tests/regress/blocks_io.js`: bawat block ng 51 ABC sheet ay sinusubok sa tunay na wiring.
    - Pinipilit ang input gaya ng FORCE ng user at tumatakbo ang sheet gaya ng app.
    - Ang output sa wire ay ikinukumpara sa function ng legend: ADD / SUB / DEV, MUL, DIV, ABS, SQRT, HS / LS, limiter, average select, F(X) curve, comparator, PV < SV, NOT / AND / OR (buong truth table), FF (reset wins), ON / OFF delay, one shot (TPS / TPV), lag (63 % sa T), ramp (rate, .LOC bypass), conditional write, at actuator stroke.
    - Plant model OFF, at plant model ON sa 150 MW.
    - Ang constant na nakasulat sa drawing (hal. X = 3 %) ay parameter, hindi pinipilit.
  - Bagong test `tests/regress/ditl_sim.js`: DITL SIMULATE sa 4 na kaso (ABC+DITL OFF / ON × plant model OFF / ON).
- **As Left (headless, 2.5.0-beta.9):**
  - blocks_io:
    - **Plant model OFF: 1,666 block, 12,006 tseke, 0 mali.**
    - **Plant model ON (150 MW): 1,666 block, 12,006 tseke, 0 mali** (nananalo ang force laban sa plant).
    - 49 block ang may output na pinaghahatian o may preset (VLV / RAMPB). Sakop sila ng plant at scenario test.
    - Ang PID, MAN station, A/M at switch ay nasa sariling test (pid_auto, pid_am, manstation, switches, force_manual).
    - Napatunayang nahuhuli ng test ang mali: sa sadyang maling AND / ABS, 86 mali ang lumabas.
  - ditl_sim: lahat PASS.
    - Gumagana ang SIMULATE at VIEW.
    - Ang hand input ay nagbabago ng DITL output.
    - Kapag ON ang ABC+DITL: 102 ABC input = DITL output, at 143 DITL row = ABC net (dalawang direksyon).
    - Kapag OFF: walang DITL row na pinapatakbo ng ABC.
  - ditl_toolbar, layout, sidetab, ditl_pagelink, ditl150, world: PASS. Buong screen check: 96 screen, 0 problema.
- **Status:** Pass.

## 2.5.0-beta.10 — FORCE sa ABC ↔ DITL habang SIMULATE, at buong pagsubok ng ramp / preset (user: "--GO", 2026-10-20)

- **Problem:**
  - (1) User: "kapag from DITL nagforce ako, madedetect ito ng buong sheet DITL at ABC? vice versa?"
  - (2) User "--GO": isama sa pagsubok ng bawat block ang 49 na block na may output na pinaghahatian o may preset.
- **As Found:**
  - (1) Kapag nasa DITL page at naka-SIMULATE (ABC+DITL ON), ang ABC ay nakatigil hanggang sariling Run. Ang DITL input ay umaabot sa ABC input pero hindi sa ABC logic sa likod nito, at ang FORCE sa ABC ay hindi umaabot sa DITL row.
  - (2) Ang ramp ng ABC-050 (HP bypass) sa ilalim ng "IF M.0704 = 1 SET SV = 109 kg/cm2" ay sinubukan. Akala ko ay mali ang ramp (bug). Binasa ulit ang PDF ng ABC-050: ang SET ay nasa SV ng PICMS1006 station, hindi sa ramp. Sinubok ang pagbabago: sa turbine trip, 22 % lang ang HP bypass at umakyat ang MSP sa 144 (bagsak ang unit_trip). Kaya **walang mali sa ramp; ibinalik sa dati (walang binago sa engine).**
- **Work Done:**
  - `src/world/world.js`: habang naka-SIMULATE ang DITL page, tumatakbo rin ang mga ABC sheet ng iisang mundo, pati ang mga ABC sheet na bumabasa ng DITL (FROM DITL). Iisang oras ang ABC at DITL.
  - `tests/regress/blocks_io.js`: ang ramp na may preset ay sinusubok mula sa sariling value ng ramp (ayon sa drawing).
  - `tests/regress/ditl_sim.js`: dagdag na tseke: FORCE sa ABC → DITL row, at hand input sa DITL → ABC input at ABC logic.
  - Bagong `tests/regress/ditl_export.js`: isinusulat ang basa ng app sa bawat DITL sheet (row at logic ng bawat output) para ibangga sa PDF.
- **As Left (headless, 2.5.0-beta.10):**
  - ditl_sim: lahat PASS, kasama ang FORCE ABC → DITL at DITL → ABC.
  - blocks_io ABC-050: 0 mali, plant model OFF at ON. Ang 88 "laktaw" ay VLV block na walang output wire (sakop ng plant at scenario test).
  - unit_trip, check_panel (lahat ng CHECK scenario, kasama ang M4 cold start-up at M5), world, ditl150, hmi_op, unit_load, switches, pid_am, faceplate, loaddown, ditl_toolbar, ditl_pagelink, layout: PASS. Buong screen check: 0 problema.
- **Status:** Pass.

## 2.5.0-beta.11 — Bawat DITL sheet laban sa PDF, at sheet list ayon sa kategorya (user: "KAPAREHA DAPAT NG SA APP", "DAPAT BY CATEGORY DIN ANG SHEET LIST SA DITL", 2026-10-20)

- **Problem:** Hiningi ng user na ang bawat DITL sheet ng app ay kapareho ng drawing PDF, at na ang listahan ng DITL sheet ay naka-grupo ayon sa sistema.
- **As Found:** 39 na DITL sheet ang may mali kumpara sa PDF (detalye: `DITL_PDF_AUDIT.md`). Halimbawa: hindi nabasa ang comparator sa wire (analog limit), ang LOCAL STOP ng MCC ay nabasang pulse (hindi makatakbo ang pump sa LOCAL), hindi nakakabit ang connector papunta sa ibang sheet (25A, 26A, 76 / 77), may wire na tumatawid na nadugtong, walang laman ang overtime alarm ng valve (DITL-38), at may TO reference na nasa maling row. Ang listahan ng sheet ay isang mahabang listahan lang.
- **Work Done:**
  - DITL reader (`src/digital/parts/01 ~ 05`): 17 uri ng ayos, bawat isa binasa sa PDF (talaan sa `DITL_PDF_AUDIT.md`; ang mga wire na hiniwalay ay may ebidensya sa `UNLINK_AUDIT.md`). **Nagbago ang DITL logic** sa mga sheet na ito, para tumugma sa PDF. Ang ABC ay hindi ginalaw.
  - Sheet list ng DITL ayon sa kategorya (22 grupo: MFT / purge, boiler, fans, coal, condensate, feedwater, at iba pa).
  - Page link: ang TO text na nakasulat sa ibabaw ng ibang row (hal. DITL-03A row 13, mahabang listahan) ay bumubukas pa rin kapag pinindot kung saan ito nakasulat. Sa tablet / phone, ang mahabang pagpipilian ay hindi na kusang pumipili ng page sa ilalim ng daliri.
  - Bagong test `tests/regress/ditl_pdf.js`.
- **As Left (headless, 2.5.0-beta.11):** ditl_pdf ALL PASS (19 na basa ng PDF, overtime alarm ng DITL-38, connector 26B → 26A). ditl_pagelink ALL PASS (PC, tablet, phone). ditl_sim, world, ditl150, switches (438 / 0), blocks_io (0 mali, plant OFF at ON), unit_trip, unit_load, hmi_op, plant_live, loaddown, check_panel (lahat ng CHECK scenario M2 ~ M5), layout, ditl_toolbar: PASS. Buong screen check: 96 screen, 0 problema.
- **Status:** Pass. Hindi nasubok: tablet / apk / exe ng user. Susunod: bagong DITL page (sootblower, bottom ash, sand, limestone).
