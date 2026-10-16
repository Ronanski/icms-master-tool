# v2.2.0 — Mga Beta

Base: Stable v2.1.0 (`main` 0aac342). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f).

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
