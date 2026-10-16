# v2.2.0 — Mga Beta

Base: Stable v2.1.0 (`main` 0aac342). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f).

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
