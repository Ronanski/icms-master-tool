# v2.2.0 — Mga Beta

Base: Stable v2.1.0 (`main` 0aac342). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (beta.1 ~ beta.7) at `ccr-3def3a81-kcpwgn` (beta.8 ~; PR #31) (PROJECT_RULES 5e, 5f).

## 2.2.0-beta.11 — M2 hakbang 1 ~ 4: reheat pressure, temperatura SH / RH ayon sa load, O2, UNIT screen

- **Problem (roadmap M2, natitira pagkatapos ng beta.9 / 10):** Sa 60 MW ang temperatura ay 541 °C pa rin (02.png: MST 517, RHT 499), ang hot reheat pressure 35 kg/cm2 (02.png: 15.0), ang first stage pressure 96.8 (hindi gumagalaw), ang O2 4.3 (hindi gumagalaw; Fig 7 ng boiler manual: 8.8 % sa 40 % MCR). Walang iisang screen ng unit.
- **As Found (trace: `DRAWING_TRACE.md` beta.11):**
  - ABC-052: PV ng LP bypass PICHR1003 = hot reheat pressure (AI0421 / AI0513 + 0.6), SV = LN12(first stage pressure AI0883 / 0884 / 0885) + 5.1. Ang mga transmitter na ito ay hawak ng sariling loop model (walang kaugnayan sa steam flow).
  - ABC-011 / 012: ang PV ng master (TICBR1140 TT-BR1140, TICMS1004 TT-MS1004) ay sariling modelo na function ng sariling MV, kaya kahit sarado na ang spray ay hindi bumababa ang final temperature. Walang load disturbance sa spray loops.
  - ABC-002: ang O2 analyzers (AI0273 / AI0433) ay naka-anchor sa snapshot; walang kaugnayan sa coal / hangin.
  - Sa load down, nakita sa probe (drawing + bagong physics): tumataas ang O2 → pinuputol ng O2 trim ang SA → ang fuel / air cross limit (SI0019 = 1.2 × LN40(total air)) ang naglilimita ng coal → **M.0103 = 1: na-force MANUAL ang O2 trim** sa huling halaga (14.3 % = ×0.857) at NANANATILI (force manual = level + latch, user rule 2026-10-15) → bumaba ang hangin sa ilalim ng minimum (LN40 tuhod 446 T/H) → bumagsak ang coal 43 → 28 T/H, MSP 115, tapos 63 T/H at MSP 150 (runaway, blow-off bumukas). Tama ang drawing: ganito ang reaksyon ng logic kapag iniwan sa MANUAL ang O2 correction sa ×0.857. Ang kulang ay ang aksyon ng operator (sa test).
- **Work Done:**
  - `src/analog/engine/unit.js`: (1) hot reheat pressure (ABC-052 AI0421 / AI0513), cold reheat pressure (ABC-019 AI0529) at first stage pressure (ABC-052 AI0883 / 0884 / 0885) ∝ steam flow (turbine steam + HP bypass; bawas ang LP bypass; lag 10 s); (2) load disturbance `pr.ld` sa spray loops TICBR1130, TICBR1150, TICHR1002: 0 sa MCR, hanggang ang authority ng spray ng snapshot sa 60 % MCR (Fig 6 / Fig 10: sarado ang spray, PV sa SV pa), tapos ang slope ng snapshot 02.png sa ibaba (MST 517, RHT 499 sa 44 % MCR); (3) final temperatures TT-BR1140 at TT-MS1004 = PV ng spray loop + heat pickup ng susunod na superheater (anchor), lag 120 s; (4) O2 = 21 × (1 − stoichiometric air / total air ng ABC-006), stoichiometric air mula sa anchor (5.4 T/H hangin kada T/H coal), lag 20 s, bawat analyzer may sariling offset; PA to furnace (AI0166) sumusunod sa PAF flow. Bawat transmitter na sinusulat ng unit model ay inaalis sa loop model (`anUnitOwns`). Reset = `anUnitStop()` (inaalis din ang `pr.ld`).
  - `src/analog/engine/plant.js`: isang linya: `+ (pr.ld || 0)` sa steady state ng PV. `src/analog/engine/sheets.js`: Reset → `anUnitStop()`.
  - `src/ui/plant/systems.js`: bagong unang screen **UNIT: BOILER + TURBINE (plant model)** sa PLANT tab: coal feeders, PA / SA / FA, O2, furnace pressure, drum pressure, FW, SH temperatures (4 header), MSP, MSF, turbine inlet, first stage, cold / hot reheat pressure, RHT, GEN MW, TCS target, at 21 faceplate (LIVE link gaya ng ibang screen).
  - `tests/regress/unit_load.js`: bagong tseke sa 150 MW (MST / RHT / RHP), sa 60 MW (MST 517, RHT 499, RHP 15.0, ±5 %; O2 5 ~ 12 %), pabalik sa 150 MW (MST / RHT / RHP / O2; O2 trim AUTO ulit); aksyon ng operator sa O2 trim (habang MANUAL: correction sa neutral 50 % = ×1.0; AUTO ulit kapag wala na ang limit, > 220 T/H, malapit sa SV ang O2).
- **As Left (headless, build 2.2.0-beta.11):**
  - `unit_load.js` ALL PASS: 150 MW steady (MW 149.9, MSF 470.5, MSP 122.3, MST 540, RHT 544, RHP 34.7, O2 4.2); load down 3 MW/min; **60 MW: MW 60.0, MSF 201.0, coal 40.1, MSP 121.3 (SV 122.3), MST 516 (02.png 517), RHT 496 (499), RHP 15.2 (15.0), O2 10.7 (Fig 7: 8.8 sa 40 %, 4.6 sa 50 %)**, boiler master MANUAL; balik sa 150 MW: MW 150.0, MSF 470.9, MSP 122.4, MST 541, RHT 543, RHP 34.7, O2 4.1; drum level ±29 mm; pinakamababang MSP 119.9; walang trip.
  - Nakita sa load up (hindi tseke): RHT umakyat hanggang 557 °C (alarm H 550) nang ilang minuto habang binubukas ulit ang RH spray mula 0 % (damper HICHR1002A MANUAL sa snapshot); bumalik sa 543.
  - Regression: hmi_op ALL PASS (34 anchored loops; PIC-COBM at AICFG112 sa unit model); plant_live ALL PASS; UNIT screen: 42 / 45 item LIVE (ang 3 MAN station HIC-BM / HIC-ULD / EIC-TM ay snapshot value gaya ng screen 033: ang PLANT link ay para sa PID faceplate lang, susunod na ayos); switches, reset, force_manual, isolated, scenarios 244, generic 68: tumatakbo sa oras ng commit na ito, resulta sa susunod na commit
- **Ano ang makikita ng operator:** PLANT tab → unang screen UNIT. Start at 150 MW, TARGET MW 60 sa HIC-ULD: bumababa ang RHP 34.7 → 15 kg/cm2 at ang first stage pressure 96.8 → 41 kasabay ng steam flow; sa ibaba ng ~276 T/H (60 % MCR) sarado na ang SH / RH spray at bumababa ang MST / RHT hanggang 516 / 496 sa 60 MW; tumataas ang O2 (4.3 → ~10 %), bumababa ang O2 trim output, at kapag nalimitahan ng hangin ang coal, **M ang O2 trim (AICFG112) at mananatiling M**: ibalik mo ang output nito sa 50 % (neutral) at pindutin ang A kapag wala na ang limit (gaya ng boiler master). Kung iiwan sa mababang output ang O2 trim, puputulin ng cross limit ang coal at tataas ang MSP (ganito ang drawing).
- **Ipinalagay (nakasulat sa `unit.js`):** laki ng LP bypass (= HP bypass, 30 % ng anchor flow), lag ng reheater 10 s, lag ng superheater metal 120 s, lag ng analyzer 20 s, linear na pagbaba ng temperatura sa ilalim ng 60 % MCR, constant na heat pickup ng finishing SH / SH no.2.
- **Hindi pa nasubok:** totoong tablet / apk / exe; ang UNIT screen ay nasubok lang sa pagbuo (walang page error) at sa LIVE link ng tags (probe: 42 / 45 LIVE, 0 page error).
- **Status:** Beta.

## 2.2.0-beta.10 — BU-CMD = protection: ang MAN station ay nananatiling MANUAL hanggang ang operator ang mag-AUTO

- **Problem (user, 2026-10-17, CLAUDE.md 10):** Kapag nag-BU-CMD ang isang MAN station (ABC-001C HIC-BM M.2013 = MSF < 220 T/H, HP bypass > 5 %, turbine trip; EIC-TM M.2016), MANUAL ito at hawak ang MV. Sa beta.9, kusang bumabalik sa AUTO ang station kapag nawala ang BU-CMD. Sa planta, ang operator ang nagpa-AUTO (PR-OPE-5002 "At 230 T/H MSF ... Put Boiler Master to Auto").
- **As Found (trace: `DRAWING_TRACE.md` beta.10):**
  - Ang A/M switch (AMT) ng MAN station ay walang `al` (AUTO leg), kaya hindi ito sinasakop ng force-manual rule ng AMT (plant.js: 1:B = LEVEL, MANUAL hanggang pindutin ang AUTO). Ang PID stations ay may `al` na (user rule 2026-10-15); ang MAN stations wala.
  - Sinimulan ng naunang session (wip patch, hindi na-push): ang `unit_load.js` ay bumagsak (10 FAIL) dahil ang operator AUTO sa Start at 150 MW ay ginawa PAGKATAPOS ng MV re-write at ng anchor ng plant model: ang coal feeder A / B / C ay nanatili sa halagang na-track nila habang MANUAL (26.5 / 38.2 / 38.2 T/H, snapshot 29), kaya ang unit model ay naka-anchor sa 103 T/H ng coal sa halip na 87.5; bumaba ang MSP, umakyat ang boiler master sa 92 %, na-force manual ang coal master sa itaas.
- **Work Done:**
  - `src/analog/engine/plant.js` (MAN station): ang AMT na may BU-CMD ay may `al = 'A'` (AUTO-MV leg), kaya hawak ito ng latch ng AMT: MANUAL habang 1 ang BU-CMD AT PAGKATAPOS, hanggang ang operator ang mag-AUTO. `.MAN` = 1 sa pagpasok (tracking ng PIC-COBM, bumpless). Operator MAN off (faceplate) = AUTO kapag wala na ang BU-CMD; habang may BU-CMD, nananatiling MANUAL. Operator MAN on = MANUAL din ang A/M switch.
  - `src/analog/engine/hmi-op.js` (Start at 150 MW): pagkatapos ng 10 s ng cold start, ang operator ang nagpa-AUTO (MAN off) sa mga station na na-latch ng BU-CMD habang naglo-load, maliban sa M sa snapshot o may BU-CMD pa. Inilagay ito BAGO ang MV re-write ng snapshot at ang anchor ng plant model (ito ang ayos ng pagbagsak sa itaas).
  - `tests/regress/unit_load.js`: ang operator ang nagpa-AUTO sa HIC-BM, tapos sa EIC-TM, sa itaas ng 230 T/H at kapag wala na ang BU-CMD; bagong tseke: ang boiler master ay HINDI kusang bumalik sa AUTO.
- **As Left (headless, build 2.2.0-beta.10):**
  - Start at 150 MW: feeders 29.2 / 29.2 / 29.2 T/H, coal anchor 87.6 T/H (gaya ng beta.9); HIC-BM AUTO 68.3 %, EIC-TM AUTO 150.
  - `unit_load.js` ALL PASS (150 MW steady; 60 MW: MW 60.0, MSF 201.0, coal 40.1, MSP 121.3; boiler master MANUAL sa ibaba ng 220 T/H, NANATILING MANUAL pagkatapos mawala ang BU-CMD hanggang pinindot ng operator; balik 150 MW: MW 150.0, MSF 470.9, MSP 122.4; drum level ±29 mm; walang trip).
  - Regression: switches 0 / 438; reset 51 / 0; hmi_op ALL PASS (38 anchored loops); manstation, force_manual (68 / 0), isolated engine (5128 net) PASS; scenarios 244 / 0; `npm test` PASS. Generic tester (lahat ng sheet, build beta.10): 68 controller, 2145 tama, 0 mali, 0 hindi nasubok.
- **Ano ang makikita ng operator:** sa load down sa ibaba ng 220 T/H ng main steam, ang boiler master HIC-BM ay MANUAL (M sa faceplate); pag-akyat pabalik sa itaas ng 220 T/H, nananatili itong M hanggang pindutin mo ang A (dati kusang A). Kapag pinindot ang A habang may BU-CMD pa, mananatiling M.
- **Hindi pa nasubok:** totoong tablet / apk / exe.
- **Status:** Beta.

## 2.2.0-beta.9 — M2: Normal operation + load down / up (unit model: boiler + turbine)

- **Problem:** Sa load down mula 150 MW, ang demand lang ang sumusunod (MW demand, coal, air). Hindi gumagalaw ang MW, ang main steam pressure / flow at ang FW (150 → 60 MW: MW 151.9, MSF 489, MSP 122.3 pa rin). Ang coal ay bumababa hanggang 7 T/H (02.png: 41.8).
- **As Found (trace: `DRAWING_TRACE.md` beta.9):**
  - Walang modelo ng planta mismo: gatong → steam → pressure → turbine → MW.
  - HIC-MWRL (OUTPUT CHANGE RATE) = 0.1 MW/MIN sa app, hindi 3.0 (33.PNG): ang station ay binabasa ang sarili nitong lumang output. Ang load ay 30× mas mabagal. Natatakpan ng lumang `loaddown.js` (humahakbang sa ABC-001B ~30× bawat tick).
  - Start at 150 MW: naka-MANUAL ang turbine master EIC-TM (M.2017 = NOT I.0082), pero sa 33.PNG ay CCS (EIC-TM A, TARGET MW SETPOINT FROM TCS 149.5).
  - HIC-BM.MAN ("BOILER MASTER IN MANUAL") ay nakakabit sa mga wire ng "TURBINE MASTER IN MANUAL" (sinusukat ang dulo ng wire, hindi ang linya), at ang .MAN ay hindi nagiging 1 kapag ang drawing ang nag-force manual (BU-CMD). Kaya walang tracking ng PIC-COBM (SI0224) at may bump pagbalik sa AUTO.
  - EIC-TM.PV = 0: ang GEN MW C / D (AI0419 / AI0774) ay pumapasok sa PRI/SEC/AVG SELECT sa T na walang tuldok.
  - ABC-004B / 004C: ang feeder model ay hindi nakikita kapag nauna ang step bago ang link (feedrate hindi sumusunod sa MV).
- **Work Done:**
  - `src/analog/engine/unit.js` (bago): unit model. Coal ng 3 feeder → steam (lag 60 s, 5.78 T/H bawat T/H coal) → drum pressure (storage) → MSP (pressure drop ∝ flow²) → turbine valve ng TCS (MW = target; ang target ay ang output ng EIC-TM habang ON ang DCS control mode) → MW (0.334 MW bawat T/H). Lumalabas din ang steam sa HP bypass (PICMS1006) at blow-off (PICMS1002). Sinusulat ang MSP, drum pressure, MSF (raw, kaya tama ang compensated), GEN MW C / D, TCS target, turbine inlet pressure. Tumatakbo lang pagkatapos ng Start at 150 MW; Reset = cold.
  - `hmi-op.js`: HIC-MWRL 3.0 ay nananatili; CCS: STN101 I.0081 / I.0082 = 1 sa ABC-001C lang (ang I.0082 ng STN102 ay ibang signal: CP-A REMOTE SELECTED).
  - `plant.js`: .MAN ng MAN station = 1 habang ang A/M switch ng drawing ay nasa operator leg dahil sa BU-CMD; feeder model hinahanap ulit; gumagamit ng unit model ang mga loop na hawak nito.
  - `hmi.js`: tag text → wire: layo sa linya ng wire (≤ 8), hindi sa dulo; hindi kasama ang address na may station (S2 M.2502) at ang "1:B".
  - `compile-step.js`: SEL input na walang driver → ang AI na ang wire ay nagtatapos sa gilid nito (ABC-001C lang ang nagbago).
  - Tests: bagong `tests/regress/unit_load.js`; `loaddown.js`, `ditl150.js`, `hmi_op.js` inayos para sa unit model at sa stepping ng app.
- **As Left (headless):**
  - `unit_load.js` ALL PASS: 150 MW steady (MW 149.9, MSF 470.5, MSP 122.3); load down 3 MW/min, MW sumusunod sa turbine demand SI0236; **60 MW: MW 60.0, MSF 201.0 T/H, coal 40.1 T/H (02.png 60.3 / 203.7 / 41.8), MSP 121.2 (SV 122.3)**; boiler master MANUAL sa ibaba ng 220 T/H (drawing); balik sa 150 MW: MW 150.0, MSF 470.9, MSP 122.1, AUTO; pinakamababang MSP 119.8, drum level ±29 mm, walang trip.
  - Regression: switches 0 / 438; reset 51 / 0; hmi_op 38 PASS (2 = unit model); ditl150, loaddown (3 MW/min = 138 MW sa 4 min), plant_live, world, tests.js, pid_am, faceplate, overview, events, infocard, manstation: PASS. Mode nets: 2 tag lang ang nagbago (HIC-BM.MAN, EIC-TM.MAN). SEL: 1 block lang ang nagbago.
  - Generic tester (lahat ng sheet): 68 controller, 2145 tama, 0 mali, 0 hindi nasubok. Scenarios 244 / 0. Isolated engine PASS.
- **Hindi pa nasubok:** temperatura sa mababang load (02.png MST 517 / RHT 499, sa app 541: hindi pa ginagawa); totoong device.
- **Status:** Beta (save ng progress).

## 2.2.0-beta.8 — A6: mga controller na mahirap simulan, sa planta na tumatakbo (plant physics)

- **Problem:** Generic operator tester (68 controller, 2.1.0): 3 hindi nasubok (PICFG108, AICFG112, HS-COAL) at 4 mali (FICFW1007 G6 ×3, TICHR1002 G2 ×1). Sa beta.7, may isa pa: ABC-003C FICDO1043C G2.
- **As Found:**
  - Ang force manual ng mga ito ay KONDISYON NG PROSESO (ID fan at MV ≥ 14 %, air / fuel cross limit, lahat ng feeder at mill tumatakbo, steam flow > 100 T/H nang 60 s), hindi switch. Ang random na input sa cold start ay hindi planta. Ang FICFW1007 ay malinis sa 20 s, pero na-fo-force pagkatapos ng TON 60 s.
  - TICHR1002 (bug ng plant model): ang epekto ng spray (ABC-019) at ng RH / SH damper TICHR1002A (ABC-020) sa iisang RH outlet temperature ay **ina-average**. Kaya kalahati lang ang epekto ng spray (0 → 100 %: −33 °C sa halip na −67 °C). Ang damper ay **walang epekto** sa steady state (20 % o 50 % → 541.0 °C pa rin), dahil kinukuha ang anchor gamit ang damper sa kasalukuyan.
  - PICFG108 G6 (tama ang drawing): pagtakbo ulit ng ID fan, ang start pulse M.020E ay nagpe-preset ng MV sa 13 %, kaya M.0206 (MV < 14 %) = 1 at nananatili ang force. Itataas muna ng operator ang MV.
  - ABC-003C FICDO1043C G2 (tama ang drawing, mali ang test): ang estado ng test ay M.3416 = 1 (sarado ang supply oil valve ng burner C). Ang PV SI0460 = SW(M.3416)[ AI0517, CONST ], kaya 0 ang flow kahit MV 100 %.
- **Work Done:**
  - `src/ui/uat/scen.js` (generic tester):
    - ang malinis na estado ay dapat manatiling malinis nang 80 s pa;
    - kapag wala, ang estado ay ang **planta na tumatakbo** (Start at 150 MW; bagong hakbang na `load150`), at ang trip ay ang unang input sa cone na nagfo-force;
    - G6: kapag may force pa rin pagkatapos bumalik ang trip input, itinataas ng operator ang MV sa MANUAL (hakbang `opclear`);
    - kapag naka-gate sa CONST ang PV, in service ang kagamitan (kung malinis pa rin).
  - `src/analog/engine/plant.js`: ang epekto ng mga actuator sa iisang measurement ay **nagdadagdag**. Ang anchor ay ang snapshot command ng bawat actuator. Ang gain ng damper ay nililimitahan sa rule ng spray (0 ~ 100 % mula sa operating point, nasa loob ng 0 ~ 600 °C).
  - Trace: `DRAWING_TRACE.md` beta.8.
- **As Left (headless):**
  - Generic tester, lahat ng sheet: **68 controller, 2145 tama, 1 mali, 0 hindi nasubok**. Ang 1 mali (ABC-003C) ay naayos at sinubok ulit sa huling build: 003B + 003C, 212 / 212.
  - Ang 5 na gumagamit ng planta na tumatakbo: AICFG112 32/32, HS-COAL 41/41, FICFW1007 42/42, PICFG108 32/32, LICBR1001 31/31. TICHR1002 42/42, PICAS1005 32/32.
  - RH outlet: spray 0 / 100 % → 594.1 / 527.2 °C; damper 36 → 50 % = 552.6 °C, 36 → 20 % = 527.7 °C.
  - Start at 150 MW + 300 s: ang 2 loop na may actuator ng ibang sheet (TICHR1002 541.00, PIC-COBM 122.30) ay pareho sa beta.7, kaya walang bagong mismatch sa snapshot.
  - Regression: switches 0 / 438; reset 51 sheet, 0 iba; `hmi_op` 40 ALL PASS; isolated engine PASS (5128 net); `npm run check` SAME.
- **Hindi pa nasubok:** ang buong run ay sa build bago ang ayos ng ABC-003C (ang ayos ay nag-a-apply lang kapag naka-gate ang PV sa estado ng test; ang mga pasado ay hindi naka-gate); totoong device.
- **Status:** Beta. A6 tapos.

## 2.2.0-beta.7 — M1 "ABC malinis": switches test at ang 150 MW snapshot

- **Problem:** (1) Switches test: 40 / 438 ang hindi bumabalik. (2) Start at 150 MW: 27 value ang lumalayo sa snapshot (PLANT LIVE, 300 s).
- **As Found:**
  - (1) Lahat ng 40 ay A/M station. Ang engine ay sumusunod sa rule ng user (2026-10-15): kapag na-force manual, MANUAL ang station hanggang pindutin ang AUTO. Luma ang test (2026-10-14).
  - (2) Mga sanhi:
    - mali ang link ng PLANT screen (FIC-CF sa halip na HS-COAL; reverse valve; text na "( NORMAL )");
    - kulang ang 150 MW load: SOx AI0466, PAF FLOW BIAS −30 (HIC-TADBS), GCB 52G1 ON (I.0931), O2 trim MV;
    - ang O2 trim ay naiwang na-force manual (M.0102 = NOT FICFA1081.REM sa unang scan);
    - may pulse ng drawing na nag-fire habang nagla-load (sync pulse ng I.0931 → LP bypass preset 33 %);
    - ang manual MV ay sumunod sa PID sa cold start (HP bypass spray);
    - plant model: ang valve na halos sarado ay hindi na-anchor (burner D hot SA, condensate min-flow); iisang value ang isinusulat sa dalawang O2 analyzer.
- **Work Done:**
  - `tests/regress/switches.js`: ang A/M station ay dapat manatili sa forced leg at bumalik sa pindot ng operator. Ang reference at ang force run ay nasa parehong oras.
  - `src/ui/plant/systems.js` / `plant.js`: HS-COAL; reverse valve (AO = 100 − MV) = opening; tag na may paliwanag sa panaklong.
  - `src/analog/engine/hmi-op.js`:
    - AI0466 41 ppm, HIC-TADBS −50, I.0931 = 1, AICFG112 MV 50 %;
    - ilalapat ulit ang mga mode at ang manual MV pagkatapos mag-settle;
    - walang pulse habang nagla-load (`AN.steady`).
  - `src/analog/engine/plant.js`:
    - anchor ng flow na halos sarado ang valve (offset, gain K);
    - offset ng bawat transmitter ng iisang measurement;
    - TPS / TPV walang edge habang `AN.steady`.
- **As Left (headless, 300 s):**
  - Snapshot: 27 → 11 na lumalayo, bawat isa may paliwanag (`DRAWING_TRACE.md` beta.7):
    - O2 / SA: naka-AUTO, kaya O2 → SV 3.5 % (4.3 sa snapshot, hindi pa nasa SV);
    - drum level: SV 0 (3 mm = 0.2 % ng range);
    - FW = steam + loss (499 sa snapshot habang tumataas ang level, may HH alarm sa 11.png);
    - TCVFW1150: 79.4 % sa 39.PNG, 66 % sa 5.png;
    - TICHR1002A: ML = 50 % sa PID summary;
    - FIFA1055: 0.7 T/H.
  - Switches: 0 / 438.
- **Hindi pa nasubok:** totoong device.
- **Status:** Beta.

## 2.2.0-beta.6 — Lahat ng B / C / D nakakabit sa tamang makina; DITL 150 ayon sa drawing at snapshot

- **Problem (user):** "Wala kang tatanggalin. Ikokonek mo sa tamang connection. Magbabase sa repo, PDF, diagram." Sa beta.5, 79 DITL row at 48 ABC input ng makinang B / C / D ay hindi nakakabit; may mga estado ng 150 MW na hula.
- **As Found:**
  - 35 drawing ay "SAME FOR B / C / D" na may address list, pero iisang kopya (A) lang ang nasa app.
  - Ang address group ay pindot lang ang binabasa (PAF trip).
  - Ang TO column "(28A-29)" ay hindi binabasa (FAB B ay kumukuha ng signal ng FAB A).
  - Ang relay contact ng DCS output (DITL-21A lamp 66 / 68) ay hindi binabasa.
  - May mga text rule na hula (listahan: `UNLINK_AUDIT.md` "LAHAT NG MALI KO").
- **Work Done:**
  - `src/world/world.js`:
    - bawat makinang B / C / D = sariling instance ng drawing (73);
    - ang link ay pinipili ayon sa address list, letra ng makina, kapatid na sheet, memory list, at TO column na may panaklong.
  - `src/digital/parts/05-overlay-interaction.js`: ang address group ay sumusunod sa nakakabit na row.
  - `src/digital/parts/02-netlist.js`: ang N.O. contact ng relay ng DCS output sa DC 24V ay sumusunod sa output na iyon (DITL-21A lang ang tinamaan; sinuri ang 108 contact sa lahat ng sheet).
  - `src/world/ditl150.js`:
    - ang estado ay galing sa snapshot (9.png, 28.png, 29.PNG, 02.png, 37.PNG, 4.PNG) at sa drawing (pulse / READY / PLC output ay hindi estado; ang RESET FIRST OUT ay galing sa MFT reset ng huling start-up);
    - talaan: `UNLINK_AUDIT.md` seksyon 4.
- **As Left (headless):**
  - Link: 0 hindi nakakabit (dati 79 + 48), 0 lost.
  - Start at 150 MW:
    - MFT 0;
    - BFWP A, IDF, PAF, SAF, FAB A, coal feeder A / B / C tumatakbo;
    - lahat ng 868 output na may inaasahang estado ay tugma (dati 70 hindi tugma);
    - ang DITL output na binabasa ng ABC = 150 MW load ng ABC (0 differ);
    - 60 s stable.
  - BFWP A STOP: M.3343 0, force manual FICFW1007.
  - DITL-40 LL gumagana.
- **Natitira (`UNLINK_AUDIT.md` seksyon 5):** 344 field input row na wala pang sariling rule (212 analog, 89 AUTO / MANUAL ng MOV / pump na wala sa snapshot, 36 MOV limit / torque, 7 iba pa); boiler / turbine physics.
- **Regression (headless, beta.6):** world, ditl150, tests, reset (51 / 0), hmi_op, plant_live, loaddown, abcbar, lookonly, ditl_toolbar, faceplate, manstation, infocard, events, overview, stale_beta, force_manual 68 / 0, panel_sync, scenarios 244 / 0, isolated PASS. Ang switches ay 40 / 438 na hindi bumabalik, PAREHO sa beta.5 (hindi galing sa beta.6): susunod na trabaho.
- **Hindi pa nasubok:** totoong device.
- **Status:** Beta.

## 2.2.0-beta.5 — Audit ng hindi ikinabit; DITL-21E naibalik

- **Problem (user):** "Ilang address ang ginawa mong ganyan, inalis para lang may gumana? Sinuri mo ba sa PDF?"
- **As Found:** beta.3 nilaktawan ang LAHAT ng ref na nasa panaklong (84). Sa PDF, 4 sa DITL-21E ay hindi ibang makina (output 70 / 74 = command ng B~D): mali ang paglaktaw.
- **Work Done:** lalaktawan lang kapag magkaiba ang makina ng row at ng output (o ang drawing ay may note na "SAME FOR ..."); DITL-21E row 2 / 5 / 16 / 19 nakakabit na. Buong listahan at ebidensya: `UNLINK_AUDIT.md`.
- **As Left (headless):** 79 row ng makinang B / C / D na hindi ikinakabit sa A (bawat isa may letra ng ibang makina o note "SAME FOR"); 48 ABC input ng makinang B / C. ditl150 ALL PASS, world ALL PASS, scenarios 244 / 0.
- **Status:** Beta.

## 2.2.0-beta.4 — DITL-40 MAIN STEAM PRESSURE LOW LOW nakakabit na (protection)

- **Problem (user):** "Bakit hindi kinabit? Paano yan magti-trigger? Protection yan."
- **As Found:** sa beta.3, ang link ay inalis (mali ang napiling wire: analog AI0131 sa tabi ng text). Ang tunay na signal sa ABC-001C ay M.310D = AI0131 < 72.9 kg/cm2.
- **Work Done:** ang tag reader (`trace.js` dsIdx) ay nagtatala ng pinakamalapit na digital net ng logic; ang world ay ikinakabit ang DITL-40 row 9 sa M.310D.
- **As Left (headless):** 150 MW (122.4 kg/cm2) → DITL-40 LOW LOW 0; 60 kg/cm2 → 1. ditl150, world, infocard, lookonly ALL PASS; scenarios 244 / 0.
- **Status:** Beta.

## 2.2.0-beta.3 — DITL sa 150 MW (Yugto 1 at 2), at ang ABC load na walang trip

- **Problem (user):** "Sige DITL 150": dapat nasa 150 MW din ang DITL sheets para magamit ang ABC + DITL nang sabay sa trip / load scenario.
- **As Found:** ang DITL ay cold start (MFT naka-trip, lahat ng motor STOPPED): 50 / 110 DITL → ABC signal ang mali kapag ABC+DITL ON. Habang inaayos, may nakitang 6 na bug ng reader / world at 6 na transient ng ABC 150 MW load (detalye: `DRAWING_TRACE.md` beta.3).
- **Work Done:**
  - Bago: `src/world/ditl150.js` (field inputs mula sa snapshot, latch / motor / valve sa estado ng tumatakbong planta, RESET ng operator).
  - Start at 150 MW = ABC + DITL; Reset = cold; Simulate ng DITL page = bumabalik sa 150 MW.
  - DITL reader: DITL-20 discharge valve command (FF output, hindi ang reset wire); DITL-03F N.C. emergency trip buttons.
  - World: ref sa panaklong = ibang makina; ABC input ng makinang B / C; listahan ng TO DITL sa ABC-027; analog net ≠ limit row.
  - ABC load: raw vs compensated (drum level, main steam flow, PA / SA flow); plant model naka-hold hanggang may anchor; LP heater / deaerator level mula 02.png; PAF / SAF MV mula 7.PNG.
- **As Left (headless):**
  - Start at 150 MW, ABC+DITL ON: MFT = 0.
  - Tumatakbo: BFWP A, IDF, PAF, SAF, FAB A, coal feeder A.
  - 0 sa 110 DITL → ABC signal na may ebidensya ang mali.
  - 585 output row ng DITL ang tiningnan; 7 ang hindi tugma (maliliit na indicator: ash cooler mode, FAB A FCD READY, PAF STOPPED FIRST OUT).
  - Pagkalipas ng 60 s: MFT 0, drum level 0.0 mm.
  - BFWP A STOP P.B. sa DITL → ABC M.3343 = 0 → force manual ng FICFW1007.
  - Reset → cold. DITL 150 = 1.2 s (desktop).
  - `tests/regress/ditl150.js` ALL PASS.
- **Hindi pa nasubok:** totoong tablet / exe / apk; ang bilis sa tablet.
- **Limitasyon (tama, may ebidensya):** ang "IDF STOPPED" ng MFT ay galing sa M.3318 (FROM STATION WIRING, breaker status ng ibang station na wala sa drawing). Kaya ang IDF breaker trip ay hindi pa umaabot sa MFT sa simulation; ang trip ng drawing (STOP P.B., bearing / winding H.H.) ay umaandar.
- **Status:** Beta.

## 2.2.0-beta.2 — Load down mula sa Start at 150 MW (HIC-ULD TARGET MW)

- **Problem (tanong ng user):** "Pde ako mag-load down?" Sa faceplate ng HIC-ULD (ABC-001A, TARGET MW), ang ▲ / ▼ ay walang epekto habang naka-AUTO ang station.
- **As Found:** sa AUTO, ang station ay sumusunod sa set input nito (A leg = COS SI0243 "TARGET MW SETUP FROM CCS CRT"). Ang faceplate ay sumusulat lang sa value ng station, na pinapalitan ng target sa susunod na step.
- **Work Done:** `src/ui/hmi/hmi.js`: kapag naka-AUTO ang station at ang A leg ay set input ng operator (input ng sheet, hindi link), ang ▲ / ▼ / type ay sumusulat sa target na iyon. Walang binago sa engine.
- **As Left (headless, `tests/regress/loaddown.js`):** 150 MW → ▼▼ × 6 = TARGET 120 MW; MW demand 134.4 sa 4 min (3 MW/min, HIC-MWRL), 120.0 sa 10 min; coal demand 86.9 → 70.6 T/H; feeder A 29.0 → 23.5 T/H. manstation PASS, faceplate PASS, tests PASS, scenarios 244 / 0.
- **Limitasyon (tama, may ebidensya):** ang sumusunod sa load ay ang DEMAND side (MW demand, boiler master, coal, air). Ang planta mismo (main steam flow AI0129, FW flow, main steam pressure, aktwal na MW) ay hindi sumusunod: walang boiler / turbine model (fuel → steam → MW) ang app; bawat loop ay may sariling plant model lang.
- **Status:** Beta.

## 2.2.0-beta.1 — Coal feeders, coal master at oil sa Start at 150 MW

- **Problem:** Sa Start at 150 MW, ang FIC-CF ay PV 40 / MV 100 %, ang 3 coal feeder ay umaakyat sa 40 T/H (max), at ang coal master (FIC-CM) ay bumababa sa 0 % sa loob ng 300 s. Snapshot 11.png: feeder SV 29.1 T/H / MV 72.8 %, coal master PV 87.0 / SV 87.4 / MV 73.0 %.
- **As Found (trace: `DRAWING_TRACE.md` beta.1):**
  1. Ang MV ng feeder MAN station (FICCL1061A / B / C) ay % ng 0 ~ 40 T/H sa drawing (AO sa inverter, alarm "≥ 83.3 %", PV ng FIC-CF = average ng 3 MV). Ang engine ay T/H, kaya ang PV ng FIC-CF (≤ 40) ay hindi kailanman umaabot sa SV (73 %).
  2. Mali ang HMI mapping: ang "TOTAL COAL FLOW CORRECT." sa 11.png ay ang **HS-COAL** (calorie correction), hindi ang FIC-CF. Tugma ang numero: MV 33.1 % → LN3 0.932; 87.0 T/H × 0.932 = 81.1 T/H; 4450 × 0.932 = 4150 Kcal/Kg ("COAL CALORIE CORR." sa screen).
  3. Ang oil burner flow (FICDO1043A ~ D) ay 0.88 T/H bawat isa kahit sarado ang supply oil valves: ang plant model ay "nag-pin" ng PV net at tinabunan ang gate ng drawing (ABC-003A SI0070 = 0 kapag M.3410 = 1). Kaya ang coal demand ay (81.48 − 6.29 oil) / 0.932 = 81.4 sa halip na 87.4.
  4. Ang feedrate transmitter ng feeder (AI0480 / AI0512 / AI0544) ay hindi sumusunod sa feeder MV (walang plant model), kaya hindi nakikita ng coal master ang sarili nitong MV.
- **Work Done:**
  - ABC-004A / B / C: unit conversion sa hangganan lang (AUTO-MV % → T/H; bias T/H → %; feeder MV T/H → % sa PV ng FIC-CF at sa bumpless return; "≥ 83.3 %" = 33.32 T/H; RB-MV ng FIC-CF T/H → %).
  - 150 MW load: HS-COAL = R, PV 81.2 / SV 81.2 / MV 33.1 % (11.png); FIC-CF = R, PV 72.8 / SV 73.0 / MV 72.8 % (mula sa drawing). `docs/hmi/operating-points.json` naitama.
  - Plant model: kapag ang gate ng drawing ang pumipili ng 0 (isolation sarado), 0 ang flow at hindi tinatabunan ng plant model ang logic.
  - Coal feeder model: ang feedrate = feeder MV (T/H) habang tumatakbo ang feeder (M.0142 / M.0152 / M.0162), 0 kapag huminto.
- **As Left (headless, Start at 150 MW + 300 s):** feeders 28.97 T/H (snapshot 29.0 / 29.1 / 28.9); coal master PV 86.9 / SV 86.9 / MV 72.4 % (87.0 / 87.4 / 73.0); FIC-CF PV 72.4 = SV; HS-COAL PV 81.5 (81.2); oil term 0. Regression: isolated PASS, tests PASS, reset 0 differ, hmi_op 30 / 30, plant_live PASS, scenarios 244 / 0.
- **Hindi pa nasubok:** bilang ng mismatch sa PLANT LIVE (hindi muling binilang); totoong device.
- **Status:** Beta.
