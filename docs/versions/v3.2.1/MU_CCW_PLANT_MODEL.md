# Plant model — Make-Up Water at Closed Cooling Water (3.2.1-beta.2)

IRENE : PLANT MODEL, 2026-11-04 PHT. Utos ng user (2026-11-04, sa coordinator): "Gawin nio lng ng gawin, basta tama connection, flow,
at plant model, at dapat may communication sya sa logic na ABC DITL." Pinalitan nito ang fixed steps ng 3.2.0-beta.63 (make-up) at
3.2.0-beta.69 (closed cooling). Code: `src/analog/engine/unit.js` `AN_MU` / `anMakeupStep`, `AN_ACW` / `acwSolve` / `anAcwStep`.

## Connection (flow diagram)
- **Make-up (K1AU3-PD-024 Rev D):**
  - Daloy: demi tanks T-0708A / B → MWP P-0709A / B / C (DITL-112, #B, #C) → common header PT-MU0709.
  - Mula sa header, papunta sa: hotwell (LCV-MU1110 ABC-031, MV-MU1001 DITL-60), expansion tank T-1109 (XV-MU1109 DITL-78 / bypass V-MU1033), at recirculation ng bawat pump.
- **Closed cooling (K1AU3-PD-021 Rev D):**
  - Daloy: return + expansion tank (V-CW1001) → ACWP P-1108A / B (DITL-76 / 77, strainer DPT-CW1108) → PT / TT-CW1152 → CCWHE H-1107A / B / C (seawater ng SWBP) → PT / TT-CW1153 → users (bottom ash coolers PT-CW1156, TT-CW1060, FS-CW1060 …) → return.

## Sources (vendor data sa PC ng user, `document-references/tg-engineer-data/`)
- **MWP, K1AU3-D1-0-032 (KAO HONG KEW-65/200):**
  - p6 performance curve: rated 80 m3/h (1.34 CMM) × 60 m × 3500 rpm; MIN.FLOW 0.167 CMM = 10 m3/h.
  - Head curve sa rated point (m3/h → m): 0 → 65.0, 30 → 64.7, 60 → 63.2, 80.4 → 60.3, 90 → 58.8, 105 → 55.5, 120 → 52.1, 135 → 47.5, 150 → 43.5.
  - BHP ng impeller na iyon = average ng 170 / 192 mm BHP curves (nasa pagitan ng dalawa ang rated impeller: shut-off 65 m, sa pagitan ng 57.5 at 72.2 m).
  - p8 TECO AEHLWA-R motor: 50 HP, 460 V, FLC 58.2 A, LRC 775 % = 451 A.
  - p11 load curve: 18.6 / 32.8 / 44.7 / 58.0 / 70.1 A sa 26.4 / 51.7 / 76.6 / 101.5 / 126.6 % load.
- **ACWP, K1AU3-D1-0-033 R1 (PACO KP1415-1/2):**
  - p8 datasheet: 1500 m3/h × 50 m × 1750 rpm, impeller 377.44 mm, MCSF 932.4 m3/h, 991 kg/m3.
  - Head curve (m3/h → m): 0 → 67.8, 300 → 66.7, 600 → 64.3, 900 → 60.7, 1200 → 55.8, 1500 → 50.0, 1800 → 42.5, 2100 → 34.4, 2400 → 25.6.
  - Power curve: 194 kW sa 0 m3/h, 250 kW sa 1500 m3/h, 217 kW sa 2400 m3/h.
  - p10 TECO AFJH-WR motor: 300 kW, 6600 V, FLC 32.1 A, eff 95 %, PF 86 %, soft start, LRC ≤ 240 A.
- **CCWHE, K1AU3-D1-0-041 (Hisaka), bawat unit:**
  - ACW side: 750 m3/h, 50 → 34 °C, ΔP 0.056 MPa.
  - Seawater side: 1000 m3/h, 30 → 42.12 °C, ΔP 0.100 MPa.
  - 13,830 kW, counter flow, 357.5 m2. Clean UA = 13830 / LMTD 5.72 = 2418 kW/K.
- **HMI snapshot (operating point):**
  - 27.PNG (148 MW): PICW1152 6.4, PICW1153 5.2, TICW1152 40, TICW1153 38, ACWP-A 28.2 A, DPICW1108A 0.27, expansion tank 0.80 m.
  - 28.png: PIMU0709 9.0, demi tanks 13.8 / 13.7 m, MWP 20.5 / 20.8 A.
- **Alarm list "Alarm List _20160912":**
  - PT-CW1152: H 7.0, L 5.3. PT-CW1153: H 7.0, L 5.0, LL 4.8.
  - PT-MU0709: H 9.2, L 6.5, LL 6.0. PT-CW1156: 3.5 / 7 (DITL-41).
  - TE-CW1152: 60 / 50. TE-CW1153: 40 / 34.
  - LS-MU0708-A / B: 0.2 m. LSLL-CW1109: 300 mm.
- **Logic:**
  - DITL-112: PT-MU0709 < 5.5 = M.2506 L.L. (standby start); LT-MU0708 < 0.2 m; DPT-MU0709 ≥ 1.0.
  - DITL-76 / 77: auto start ng standby kapag trip o trip interlock ng kabila, o kapag PT-CW1152 low habang tumatakbo ang kabila nang 5 s; trip DPT > 0.8, LT-CW1109 < 0.3 m.
  - DITL-41 row 14: PT-CW1156 < 3.5 / > 7 → annunciator.
  - DITL-21A rows 13 / 14 (TT-CW1060); DITL-21B rows 27 / 28 (FS-CW1060 flow low).
- **SOP PR-OPE-5002:**
  - MWP: current normal 20 A, alarm 61.1; pressure normal 10, alarm 6.5 ksc.
  - ACWP: current 30 / 33.7 A; strainer DP 0.4 ~ 0.5 / 0.55 / 0.8; expansion tank NL 1.7 m.

## Paano gumagana
- **MWP header:**
  - Formula: PT-MU0709 = 0.1 × (tank level + z + pump head sa flow ng bawat pump).
  - z = 11.3 m, CALIBRATED sa 28.png (9.0 kg/cm2 na may 2 MWP). Wala sa repo ang taas ng tank at ng transmitter.
  - Flow = hotwell make-up ng cycle model + pagpuno ng expansion tank + 10 m3/h recirculation bawat pump.
  - Current = shaft power (BHP curve) → motor load curve. Sa start: 451 A nang 2 s.
- **ACW loop:**
  - Pump curve laban sa line loss k·Q².
  - Isang design point (27.PNG sa rated 1500 m3/h):
    - suction static 1.445 kg/cm2 (CALIBRATED);
    - CCWHE + piping 1.2 kg/cm2 (ang CCWHE mismo ay 0.571);
    - users 3.755 kg/cm2.
  - Kapag dalawang pump: parallel, mas mataas na flow at pressure.
  - Strainer DP = 0.27 × (q / 1500)².
  - Current = P / (1.732 × 6.6 × 0.95 × 0.86): 26.8 A sa 1500 m3/h.
  - Sa start: 240 A nang 10 s (soft start).
- **ACW temperature:**
  - Isang node ang tubig ng loop, 180,000 kJ/K.
  - Heat load = 3,480 kW × (0.4 + 0.6 × MW/150).
  - CCWHE: effectiveness-NTU, counter flow, 2 unit in service, gamit ang seawater ng tumatakbong SWBP (`U.swQbT` ng CW model).
  - UA in service = 174.8 kW/K bawat unit (CALIBRATED sa 27.PNG).
  - Walang ACWP: walang flow; papunta sa 30 °C nang 30 min.

## Communication sa logic (model → logic at logic → model)
- **Logic → model:** DITL-112 / 76 / 77 RUNNING (START, STOP, trip, auto start) ang nagpapaandar ng pumps dito; DITL-78 XV-MU1109, DITL-60 MV-MU1001, ABC-031 LCV-MU1110 (hotwell); SWBP ng DITL-30 (seawater sa CCWHE).
- **Model → logic, mga dati na:**
  - PT-MU0709, LT-MU0708-A / B, DPT-MU0709-A / B / C (DITL-112);
  - LT-CW1109 (DITL-76 / 77 / 78);
  - DPT-CW1108-A / B, PT-CW1152 (DITL-76 / 77);
  - motor temp TT-CW1108 (DITL-76 / 77).
- **Model → logic, BAGO:**
  - PT-CW1156 → DITL-41 row 14 (annunciator);
  - TT-CW1060-x1 / x2 → DITL-21A rows 13 / 14 (lahat ng 4 cooler);
  - FS-CW1060-x1 / x2 (flow low, Q < 150 m3/h) → DITL-21B rows 27 / 28 (4 cooler);
  - LS-MU0708-A / B (< 0.2 m) → DITL-112 rows 19 / 21.
- **Bug na naayos (`src/world/ditl150.js`):**
  - Bug 1: sa Start at 150 MW, walang ACWP na tumatakbo (walang rule). Ngayon: ACWP-A RUN, ACWP-B standby AUTO (27.PNG).
  - Bug 2: ang row 1 "AUTO PB" ng DITL-76 / 77 ay parehong address ng row 4 "AUTO SELECTED" (M.1232 / M.1242, memory list STN103 AUTO MODE (CRT)). Kinukuha ng drawing ang output 51 AUTO SELECTED nang diretso mula rito. Dati ito ay 0 sa 150 MW, kaya hindi nag-auto start ang ACWP-B.

## NO-SOURCE (walang value sa docs)
- Ramp ng MWP start (2 s) at ng ACWP soft start (10 s).
- Volume ng loop (180,000 kJ/K, mga 43 m3) at room temp 30 °C.
- Ilang CCWHE ang in service: 2 sa 3 (ang design 1500 = 2 × 750).
- Hugis ng strainer DP ng MWP (pare-parehong 0.03).
- Hatian ng heat load (0.4 + 0.6 × load), mula pa sa beta.69.
- Set point ng FS-CW1060 (150 m3/h): package switch ito, walang value sa alarm list.
- Dead band ng LS-MU0708 (0.05 m).
- Pagpuno at priming ng expansion tank (mula pa sa beta.63).

## UNUSUAL (magkaiba ang docs; ang pinili at bakit)
1. **MWP current:**
   - Ang model ay ~28 A bawat MWP sa 150 MW, galing sa vendor BHP at motor curve.
   - Ang 28.png ay 20.5 / 20.8 A, at ang SOP normal ay 20 A.
   - Vendor ang ginamit, pareho ng pasya sa SWP ng CW model.
2. **MWP header:**
   - Ang vendor curve lang ay nagbibigay ng 7.8 kg/cm2.
   - Ang snapshot ay 9.0, at ang SOP normal ay 10.
   - Ang z (taas) ang na-calibrate para tumugma sa snapshot.
3. **CCWHE UA:**
   - Ang UA in service ay 7.2 % lang ng clean UA ng vendor.
   - Ganoon ang kailangan para sa 40 → 38 °C ng 27.PNG.
   - Posibleng dahilan: maruming plates, o hindi design ang heat load ng snapshot.
4. **ACWP strainer DP:** ang 27.PNG ay 0.27, mas mababa sa SOP normal na 0.4 ~ 0.5. Snapshot ang ginamit.
5. **ACWP current:** ang model ay 26.8 A, ang snapshot ay 28.2 A (5 %).
6. **Expansion tank sa 27.PNG:** 0.80 m, na nasa L alarm 800 mm. Ang SOP NL ay 1.7 m.

## Mga bagong key (AN.unit)
- muSpd[], muQ[], muKw0..2;
- acSpd[], acQ, acKw0..1, acHx;
- ang mga dati ay pareho ang pangalan: muP, muI0..2, muDp0..2, muF, acP1 / P2 / P6, acT1 / T2 / T6, acTb, acI0..1, acDp0..1.

## Test (cloud, headless; HINDI live test)
- **`tests/regress/mu_ccw_model.js`, 14 PASS:**
  - 150 MW design point;
  - ang logic ay bumabasa ng parehong numero;
  - ACWP-A trip → ACWP-B auto start;
  - lahat ng SWBP trip → umiinit ang loop (51.7 °C sa 10 min);
  - Cold: static pressure, 8 FS switch ON, header 2.5.
- **PASS:** `cw_model.js`, `eng_world.js` (page = engine, 0 diff), `plant_utilities.js`, `eng_headless.js`.
- **`ditl150.js`:** 1 FAIL "Reset: DITL cold again". Pareho rin ito sa naunang build (4d1918a), kaya hindi galing dito.
- **`sop_bawal.js`:** 10 FAIL, pareho sa `main` 3.2.0. Sa cloud na ito, hindi nagsisimula ang one world sa "Gabay: Cold", kaya environment ang sanhi.

## Hindi pa
- Ang bagong HMI page (JISOO) ang dapat bumasa ng mga bagong key.
- Wala pang field valves ng ACWP discharge (V-CW1007 / 1009, SOP 5 % → 7 kg/cm2) at ng CCWHE inlet / outlet.
- Hindi pa sinasabi ng HMI kung ilang CCWHE ang in service.
- Loop check ng team: `MU_CCW_LOOP_CHECK.md`.
