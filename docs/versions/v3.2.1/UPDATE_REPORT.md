# UPDATE REPORT — v3.2.1 (Beta)

## 3.2.1-beta.22 — PURGE AND TRIP, mockup page 10 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/10-purge-trip.html` → Plant view **PURGE AND TRIP** (`MK10`), `tools/hmi-mock/p10.py` →
`src/ui/plant/hmi-mock-pt.js`.
- Bagong hook ng runtime `hmi-mock.js`: `data-dy="SHEET|i/o|row+row|neg"` = Y / N ng input rows (DUI.rowVal) o output rows
  (DUI.outVal) ng drawing, AND ng lahat, `neg` = ang kabaligtaran (hal. "Total air flow above 25 % MCR" = NOT DITL-01 row 12 TOTAL
  AIR FLOW < 25% MCR); `data-dys` = buod OK / NOT OK (n of N missing) mula sa output row; `data-dfo` = MFT ACTIVE at first out.
- Furnace purge permissive (DITL-01): IDF / SAF / any FAB / PAF running (rows 0 ~ 3), total air (NOT row 12), all burners no flame
  (output ALL BURNER LOSS FLAME), oil valves closed (rows 8 ~ 11), coal feeders stopped (output ALL COAL FEEDER STOPPED), feeder outlet
  valves closed (rows 16 ~ 18), limestone rotary valve stopped (NOT row 13 MIR-M1311 RUNNING), RH damper >= 30 % (row 15), SH damper
  >= 60 % (row 19), no boiler trip command (row 14), cyclone outlet / RH outlet not H.H. (NOT DITL-03A rows 23 / 24). Buod = output
  row 10 FURNACE PURGE PERMISSIVE.
- Purge sequence (DITL-02): M.050E (row 14), burner S.A. dampers purge position (rows 1 ~ 4), FURNACE PURGE START P.B. (row 5),
  IN PROGRESS (output 6), COMPLETED (output 15), MFT reset = DITL-03A MASTER FUEL TRIP (MFT) SER = 0; FURNACE PURGE OK / NO OK at
  PURGE READY = output rows 16 / 10.
- MFT (DITL-03A): input rows 1 ~ 18 sa ayos ng mockup; MFT ACTIVE = output row 17 MASTER FUEL TRIP (MFT) SER; first out = unang
  input row (ayos ng drawing) na 1 sa sandaling dumating ang MFT, hawak hanggang ma-reset.
- Ang 4 fan row ay bumubukas ng faceplate ng fan (DITL-25A / 27A / 28A / 26A).
- NO-SOURCE ('-----'): purge time (ang 300 s ON-DELAY ng DITL-02 ay walang readout).

**Checked (headless cloud).** 150 MW + RUN: PURGE PERMISSIVE NOT OK (4 of 15 missing: coal feeders, outlet valves, limestone, RH
damper; tama sa 150 MW), purge sequence N, MFT N lahat, NO MFT. BOILER EMERGENCY TRIP P.B. (DITL-03F row 20) → MFT ACTIVE · first
out: BOILER EMERGENCY TRIP P.B. ON (CRT); IDF faceplate bumubukas; walang JS error.

**Not checked.** Live test, buong purge mula Cold (5 minuto), phone size.

## 3.2.1-beta.21 — AIR AND FLUE GAS, mockup page 09 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/09-air-flue-gas.html` → Plant view **AIR AND FLUE GAS** (`MK09`), `tools/hmi-mock/p09.py` →
`src/ui/plant/hmi-mock-fg.js`.
- Motors (motor faceplate): PAF DITL-26A, SAF DITL-27A, IDF DITL-25A, FA blower A / B DITL-28A / #B (boiler.js AN_FN.run), air
  preheater DITL-43.
- Controllers: FICFA1071 / FICFA1081 (PV / SV / MV ng MCV), PICFG108 (coupling), PICFG108A (inlet damper), HICHR1002A / B (biasing
  dampers), TICHR1002A (reheater outlet PV / SV), AICFG112 (O2 set value).
- Values: logic transmitter; kung wala, plant model AN_FN: IT-F1053 / 1054 / 1056 / 1055A, PT-FA1075, PT-FA1055-A / B,
  PT-FG1141-A / B, PT-FG1151. Runtime: bagong source na `ux:KEY.i` (isang item ng listahan ng plant model, hal. `fnGi.0`).
- NO-SOURCE ('-----'): gas-in temps sa harap ng bawat bank ng back pass, ika-4 na furnace pressure, IDF speed, total air at wall
  damper demand lines, APH motor current; mga transmitter na wala sa logic at wala sa plant model (TT-FG1090 / 1091, DPT-FG1083 / 1084 /
  1183 / 1184, TT-FG1009, PT-FG1009, TT-FG1095, TT-FG1110 / 1113 / 1124 / 1125 / 1132 / 1133 / 1152, PT-FG1087 / 1121 / 1134, AT-FG1131,
  DPT-FG1052-5, stack monitor maliban sa SOx, PT-FA1078, TT-FA1073 / 1074 / 1083 / 1084).
- Finding (para sa plant model): FT-FA1079 hot primary air = 0.7 T/H sa 150 MW (logic AI), samantalang PAF 353 T/H.

**Checked (headless cloud).** 150 MW + RUN: PAF RUNNING 246 A 353 T/H, SAF 131 A 213 T/H, IDF 200 A coupling 46.1 %, FA-A 35.7 A
25.6 T/H, ESP outlet -443 / -451, IDF outlet -7 mmH2O; faceplate ng PAF at FA blower-B bumubukas; walang JS error; `npm run check` SAME.

**Not checked.** Live test, phone size, START / STOP ng fans.

## 3.2.1-beta.20 — AUX STEAM AND VACUUM, mockup page 08 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/08-aux-steam-vacuum.html` → Plant view **AUX STEAM AND VACUUM** (`MK08`),
`tools/hmi-mock/p08.py` → `src/ui/plant/hmi-mock-as.js`.
- MOV / XV faceplate; ang drawing ng bawat valve ay galing sa service name ng DITL = ZT description sa I/O list:
  MV-AS1391 DITL-51 (main steam to aux header, ZT-AS1391), MV-AS1392 DITL-52 (aux header drain), MV-AS1393 DITL-53 (gland steam
  drain separator drain), MV-AS1395 DITL-54 (start-up ejector), MV-AS1396 DITL-55 (air ejectors), MV-AV1391 DITL-56 (vacuum
  breaker, ZT-AV1391), MV-AS1394 DITL-75 (turbine warming line drain, ZT-AS1394), XV-CD1123 / 1125 DITL-67 / 68.
- Controllers ng ABC-029 / 030: PICAS1004 (SV / MV / mode), PICAS1005, PICCD1104, TICAS1001, TICAS1017.
- Values: logic (PT-AS1004, TT-AS1001 / 1003 / 1017, PV-GS1031) o plant model (PT-CD1110 `cdP`, TT-CD1119 / 1120 `AN.unit.tt`).
- Bug fix (runtime, lahat ng page): ang push button ay binabasa sa salitang katabi ng "PB" (DITL-54 "START-UP EJECTOR STEAM INLET
  SHUT-OFF MOV OPEN PB" ay naging START dati kaya walang OPEN / CLOSE).
- NO-SOURCE ('-----'): MV-AS1011, PV-GS1034, ZT-AS1020-1 / -2, TT-AS1015, PT-GS1001, TEGS1002 / 1003, PTST11101 ~ 3,
  TEST11101 ~ 3.

**Checked (headless cloud).** 150 MW + RUN: aux header 10.2 kg/cm2 236 °C, PIC-AS1004 SV 9.4, PIC-AS1005 SV 10.2 MV 4.2 %;
MV-AS1395 OPEN + EXECUTE → 100 %, CLOSE → 0 %; walang JS error; `npm run check` SAME.

**Not checked.** Live test, phone size, iba pang push button.

## 3.2.1-beta.19 — DRUM AND MAIN STEAM, mockup page 07 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/07-drum-main-steam.html` → Plant view **DRUM AND MAIN STEAM** (`MK07`), `tools/hmi-mock/p07.py`
→ `src/ui/plant/hmi-mock-ms.js`.
- Values ng logic: drum pressure at level (LICBR1001B PV = compensated level, ABC-010; LT-BR1001-1 / 2 / 3), superheater temps,
  main steam flow / pressure, main steam temp = TICMS1004 PV (ABC-012), turbine inlet PT-MS1006-1, HP bypass, cold / hot reheat.
- Controllers: PICMS1002, PICMS1006, TICMS1022, TICHR1002, PICHR1003, TICHR1012, HICBR1391, PICHR1391 (click = faceplate).
- MOV / XV faceplate: MV-BD1001 (DITL-38, ang drawing mismo), MV-BD1002 / MV-MS1391 / MV-MS1392 (DITL-38 instances, world.js W.MCV),
  MV-TS1001 (DITL-94), XV-MS1011 (DITL-88), XV-CR1011 (DITL-73), XV-HR1021 / 1022 (DITL-80 / 81).
- Turbine speed = plant model `AN.unit.rpm`.
- NO-SOURCE ('-----', walang ABC sheet at walang plant model): TT-BR1020 / 1030 / 1040, TT-BR1110, TT-BR1120-1 / -2, PT-BR1130,
  PT-BR1150, TT-MS1007, PT-HR1001, PT-FW1160, FT-FW1109 / 1119 / 1149 / 1059, ZT-FW1110 / 1120; turbine stop / control / reheat
  valve positions; XV-CR1901, FV-CR1902 (wala sa DCS sheet).

**Added in beta.19 (thread "Finish, test, and release simulator", 2026-11-04 10:50 PM PHT).** (1) PR #134 page 07 rebased on beta.18 (was
numbered beta.16, clash). (2) Page 07 now shows the same plant model value as page 06 for PT-FW1160, FT-FW1109 / 1119 / 1149 / 1059 and
ZT-FW1110-1 / -2, ZT-FW1120-1 / -2 (IRENE beta.16 `anFwTagStep`; before: '-----' on page 07, a number on page 06). New test
`tests/regress/ms_page_values.js` ALL PASS cloud. (3) SEULGI bottom ash plant model (PR #121, `BOTTOM_ASH_PLANT_MODEL.md`, test
`bottom_ash.js` PASS cloud). Observation, not changed: drum level LT-BR1001-1 / 2 / 3 reads -79 / -84 / -74 at Start at 150 MW.

**Checked (headless cloud).** 150 MW + RUN: drum 134.2 kg/cm2, main steam 486.7 T/H 122.6 kg/cm2 540 °C, 3600 rpm; XV-MS1011 OPEN +
EXECUTE → OPEN, CLOSE → CLOSED; walang JS error; `npm run check` SAME.

**Not checked.** Live test, phone size, iba pang push button.

## 3.2.1-beta.18 — FIELD · LOCAL PANEL on the motor faceplate, and the motor loop check list (2026-11-04, thread "Build loop check dock in app")

**Problem.** In the live loop check of 030 CIRCULATING WATER, MINA could not test LOCAL start / stop or auto cut-in without a force on
the logic page. The user said 2026-11-04: "Local at remote dpt n start at stop", "My emergency stop din", every motor ("Kso per motor
yn"), realistic ("Mktotohanan"), and it must work with the plant shut down ("kht shutdown pre, pwede mg test nyan"). The mockup
https://claude.ai/artifact/6gyBnteyRkiaLXvhAELyGj was approved ("Ok goods yn").

**Source.** DITL-29A / DITL-30 PDF: LOCAL START P.B. row 23 and LOCAL STOP P.B. row 26, each AND NOT REMOTE (row 22). The ELECTRICAL
TROUBLE symbol goes into the TRIP OR. The auto start path is AUTO AND (other pump TRIP with its RUNNING 2 s off-delay). EMERGENCY STOP
P.B. was searched in all 248 drawings: only DITL-21A row 18 (bottom ash screw cooler) has one; the LS sheets have PLANT EMERGENCY STOP
(not a motor button).

**Work done.**
- `src/ui/plant/fp-pop.js`: the motor faceplate (CONTROL) has a new block, FIELD · LOCAL PANEL. Its rows are found in the motor's own
  drawing (the B / C copy for pump B / C):
  - LCP START / STOP: a pulse on the LOCAL START P.B. / LOCAL STOP P.B. row. Open only at LOCAL (START when stopped and not tripped,
    STOP when running).
  - EMERGENCY STOP: open only where the drawing has the row. Otherwise grey, with "not on DITL-xx".
  - RELAY TRIP / RESET: the ELECTRICAL TROUBLE symbol (`s.nl.usr`). It trips in any mode and holds until RESET.
  Each press asks EXECUTE in an amber bar and is logged in Events as "Field operator". Nothing needs the plant running or at load;
  the drawing decides. The block is shown only when the drawing has at least one of these inputs. New reason lines: LOCAL ("The local
  panel starts and stops it"), REMOTE ("the local panel START and STOP are blocked (DITL-xx rows a / b work only in LOCAL)"), and
  relay TRIP.
- `src/ui/plant/fp-pop.css`: styles of the mockup. The lit RUN (red) / STOP (green) colour of the command buttons now shows. Before,
  the general button colour of app.css (`body.app2 :is(button ...)`) covered it on every faceplate.
- `docs/versions/v3.2.1/MOTOR_LOOP_CHECK.md`: the standard loop check (signal path) and function test (logic) for each of the
  15 motors on the approved pages, one row per action, with the expected HMI result and the drawing address.

**Checked (headless cloud, Chromium, Home → Cold → RUN, real faceplate clicks).**
- LCP START → RUNNING and LCP STOP → STOPPED on SWP A / B / C, MWP A / B / C, ACWP A / B and CEP A / B.
- SWBP A / B / C and BFWP A / B did not start from Cold, as their drawings require (SWBP: one SWP running; BFWP: lube oil and
  suction). SWBP-A started by LCP START once SWP-B was running.
- SWP-A relay TRIP with SWP-B in REMOTE · AUTO: SWP-A TRIP and SWP-B started (about 500 A, then 230 A). RESET cleared it.
- At REMOTE the LCP buttons are grey. The EMERGENCY STOP note reads "not on DITL-29A" / "not on DITL-30". No JS error.
- `npm run check` SAME.

**Not checked.** Live test on the user PC. The DCS STOP path in AUTO for MWP / ACWP / CEP / BFWP (not read from their PDFs; the
checklist asks the tester to record it). Phone layout of the longer faceplate.

**Seen, not changed.** DITL-61A #B (CEP-B) address column in the app: rows 11 / 13 are swapped against the A sheet, and rows 20 ~ 28
show M.3217. To check against the PDF.

## 3.2.1-beta.15 — FEEDWATER, mockup page 06 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/06-feedwater.html` → Plant view **FEEDWATER** (`MK06`), `tools/hmi-mock/p06.py` →
`src/ui/plant/hmi-mock-fw.js`.
- BFWP-A / B = DITL-23A / DITL-23A #B; current, strainer DP at discharge pressure = plant model AN_FW (`fwI0/1`, `fwDp0/1`, `fwPd`).
- MOV / XV faceplate (`LS_FPOP.mov`): MV-FW1001 / 1391 / 1002 / 1392 (DITL-38 instances), MV-TS1001 ~ 1005 (DITL-94 ~ 98, extraction
  NO.1 ~ NO.5), XV-FW1111-1 / -2 (DITL-32 / #B), XV-FW1121-1 / -2 (DITL-33 / #B), XV-FW1151 (DITL-35), XV-FW1061 (DITL-79).
- Controllers ng logic: FICFW1007 (main, PV / SV), LICBR1001B (start-up), TICHR1002, TICMS1022, LICHD11051, LICHD11061.
- HP heater outlet TT-FW1105 / 1106 = AN_HP `hpT1` / `hpT2`; levels, feedwater flow, deaerator = logic.
- Runtime: ang push button na "CLOSED PB" (DITL-38) ay nababasa na; REMOTE ng "MCV REMOTE MODE SELECTED" / "SHUT-OFF MOV REMOTE";
  bagong `data-mov` "md" (REMOTE / AUTO mode ng valve).
- Inalis ang mga snapshot note ("snapshot 5.png", "snapshot 4.PNG") at ang mode sa main FCV na wala sa mockup.
- NO-SOURCE ('-----'): PT-TS1017, PT-TS1013, TT-TS1011, PT-FW1115-A / B, TT-FW1011, PT-FW1160, FT-FW1109, FT-FW1119, FT-FW1149,
  FT-FW1059, ZT-FW1110-1 / -2, ZT-FW1120-1 / -2 (walang ABC sheet at walang plant model); XV-TS1700 / 1710 (walang DCS sheet).

**Checked (headless cloud).** 150 MW + RUN: BFWP-A RUNNING 292.1 A, discharge 161.3 kg/cm2, feedwater 499.8 / 500.1 T/H, HPH outlet
197 / 248 °C; MV-FW1391 OPEN + EXECUTE → 100 %, CLOSE → 0 %; walang JS error; `npm run check` SAME.

**Not checked.** MV-TS1003 (AUTO): CLOSE + EXECUTE ay hindi gumalaw; hindi pa nasuri kung interlock ito ng DITL-96 o bug. Live test,
phone size, ang iba pang push button.

## 3.2.1-beta.13 — faceplate fixes from MINA's live loop check of 030 CIRCULATING WATER (2026-11-04, thread "Build loop check dock in app")

**Problem.** MINA, live loop check on beta.8 (user PC): (1) the "Logic DITL-29A" link of the SWP-A faceplate only closed the faceplate;
(2) DCS STOP + EXECUTE of a running pump in AUTO did nothing and the faceplate said nothing; (3) the STANDBY text said "or the header
pressure drops", but the drawing has no header pressure for the SWP.

**Source.** DITL-29A (PDF, sheet 53): STOP = STOP P.B. (row 17) AND REMOTE (row 18) AND NOT AUTO (row 19); auto start = AUTO (row 4) AND
[(B TRIP row 8 AND B RUNNING off-delay 2 s row 9) OR (B RUNNING AND B TRIP INTERLOCK row 11) OR the same for C (rows 12 ~ 15)]. DITL-30
(sheet 55): the same for the SWBP (STOP rows 14 / 16, auto start rows 8 ~ 11). So (2) is right in the logic; only the faceplate was silent.

**Work done (`src/ui/plant/fp-pop.js`).**
- The "Logic DITL-xx" link (motor, DCS valve, push-button faceplates) opens the Logic view first, then the drawing (the order of the
  Training dock). Before: `openD` alone, the Plant view stayed on top.
- A DCS STOP not taken in AUTO (still RUNNING 3 s after EXECUTE) shows: "STOP not taken: the drawing accepts the DCS STOP in MAN only
  (DITL-29A: STOP P.B. AND NOT AUTO). Press MAN, then STOP." The buttons are not changed.
- STANDBY text: "its drawing starts it by itself (auto cut-in: when a running pump trips, not on a normal STOP)" for DITL-29A / DITL-30.

**Checked (headless cloud, Chromium, Home → Cold, RUN).** SWP-A: REMOTE, START (peak ~500 A, then 229 A), AUTO, STOP → still RUNNING
and the new line shown; MAN, STOP → STOPPED; AUTO → the new STANDBY text. The Logic link opened DITL-29A with SIMULATION RUNNING.
Also seen (no change made): LOCAL START / STOP P.B. rows 23 / 26 start and stop the SWP; ELECTRICAL TROUBLE of a running SWP-B / SWBP-A
(the pentagon of the drawing) trips it and the AUTO standby starts (auto cut-in works in the logic and the plant model).
`npm run check` SAME.

**Not checked / not reproduced.** Live test on the user PC. The plant reset on the first Loop check press after "At 150 MW" + RUN: in
the cloud (page and worker engine) the only reset is the one of the 150 MW load itself. The page list mouse click: the Systems list
click works in the cloud; a native drop-down list cannot be clicked in headless.

**Open (needs the user).** MINA's proposal: FIELD buttons on the motor faceplate (LOCAL START / STOP P.B., TRIP of the protection relay,
high bearing / winding temperature, vibration) so the loop check needs no force. This is a visual change of the faceplate: mockup first
(rule 4). The Loop check dock cards are on hold (user: do not use the dock during the live check).

## 3.2.1-beta.12 — 028 CONDENSATE, mockup page 05 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/05-condensate.html` → Plant view **028 CONDENSATE** (`MK05`), `tools/hmi-mock/p05.py` →
`src/ui/plant/hmi-mock-cd.js`; loop check COND → page `MK05`.
- CEP-A / B = DITL-61A / 61B (M.3350 / M.3351), RUN / STOP, Y / N, current at DP ng plant model (AN_CD `cdI0/1`, `cdDp0/1`).
- Bagong MOV / XV faceplate `LS_FPOP.mov` (fp-pop.js): POSITION, OPEN / CLOSED, REMOTE / AUTO, at ang CRT push buttons na binasa mula
  sa input rows ng DITL sheet (OPEN, CLOSE, STOP, AUTO, ISOLATE, REINSTATE ...), bawat isa may EXECUTE / CANCEL → pindot ng row.
  Valves: MV-MU1001 (DITL-60), XV-CD1006 (62), XV-CD1004 / 1005 (63, flash chamber spray), MV-CD1007 (64), MV-CD1008 (65),
  XV-CD1114 (66), XV-CD1123 (67), XV-CD1125 (68), MV-CD1001 / 1002 / 1003 (69 / 70 / 71).
- Controllers ng logic: LICCD1110A, LICCD1110B, LICCD1104, FICCD1120, FICCD1121 (MV % at mode; click = faceplate).
- Values: logic transmitter kung mayroon (FT-CD1120, FT-CD1121, PT-CD1104, LT-CD1104-1 / 2 / 3), kung wala plant model:
  PT-CD1110 `cdP`, LT-CD1110 `cdHw`, PT-CD1117 `cdPd`; TT-CD1110-1 / -2 / -3 at TT-CD1118 = `cdT` (condenser saturation = hotwell,
  condenser O&M L15-1 p16); TT-CD1120 = TT-CD1101 ng AN_LP (ang ejector at gland steam condenser rise ay bago ang No.1 LPH inlet);
  LP heater temps = `AN.unit.tt`.
- NO-SOURCE (walang logic sheet at walang plant model, '-----'): TT-CD1110-4 flash chamber, TT-CD1119, FT-CD1115, FT-CD1122,
  PT-CD1122, TT-CD1104. Para sa IRENE (plant model).
- Bug fix ng runtime: ang `tt:` value ay nag-flicker sa '-----' (dalawang source sa iisang tag); ngayon iisa.

**Checked (headless cloud).** 150 MW + RUN: CEP-A RUNNING 28.1 A, pump outlet 16.8 kg/cm2, condensate flow 379.8 T/H, LCV-CD1104
17.5 % AUTO, FCV-CD1121 100 % MANUAL, MV-CD1001 / 1002 100 %; XV-CD1004 faceplate OPEN + EXECUTE → 100 % OPEN, CLOSE + EXECUTE →
0 % CLOSED; walang JS error; `npm run check` SAME.

**Not checked.** Live test sa PC ng user; bawat push button ng bawat valve (isa lang ang sinubok); phone size.

## 3.2.1-beta.11 — 036 TURBINE OIL, mockup page 04 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/04-turbine-oil.html` → Plant view **036 TURBINE OIL** (`MK04`), `tools/hmi-mock/p04.py` →
`src/ui/plant/hmi-mock-to.js`. Parehong signal ng lumang page (`hmi-to.js`): MOP-A / B, EOP, COP-A / B at vapour extractor = TCS ng
plant model (tcs.js TCS_OIL); bagong `LS_FPOP.tcs` faceplate (STATUS, MODE AUTO / MAN, TCS START / STOP, EXECUTE / CANCEL, Events;
`AN.turbine('oil' | 'vex')` gaya ng TCS OPERATION box); oil purifier = FIELD (`AN.field('pur')`); pressures at temperatures = plant
model, cooler outlet = TE-LO1002-1 / -2 ng logic (ABC-053).

**Checked (headless cloud).** 150 MW + RUN: MOP-A RUNNING 6.1, COP-A 163.2, bearing header 3.3, control / trip oil 162.6 kg/cm2,
cooler inlet 62 °C, outlet 46 / 46 °C; MOP-B faceplate START + EXECUTE → RUNNING 5.5 kg/cm2; walang JS error; `npm run check` SAME.

**Not checked.** Live test; phone layout; walang loop check cards ang Turbine Oil.

## 3.2.1-beta.10 — INSTRUMENT AND PLANT AIR, mockup page 03 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/03-instrument-plant-air.html` → Plant view **INSTRUMENT AND PLANT AIR** (`MK03`), `tools/hmi-mock/p03.py`
→ `src/ui/plant/hmi-mock-ia.js`. Parehong signal ng lumang page (`hmi-ia.js`): compressor RUN / STOP / TRIP = input rows ng DITL-113 / 114
(5 / 12 / 19, trip +1; local panel start), dryer RUN / STOP = output row ng DITL-45 (IA 14, PA 3), Remote / Local = input row (IA 15,
PA 4); current, dryer flow, dryer outlet, tank A / B at Unit 1 pressure = plant model AN_AIR. Click = info card (gaya ng dati). Bagong
`hmi-mock.js`: `sti`, `sto`, `remi`, at `data-short` (RUN / STOP kung 5 letra lang ang puwang ng mockup). Loop check dock Air → MK03.

**Checked (headless cloud).** 150 MW + RUN: IA compressor A RUN 212 A, dryer A RUN Remote 1200 m3/h, tanks 7.00, Unit 1 6.80 kg/cm2;
PA compressor A RUN 44 A, dryer A 1500 m3/h; walang JS error; `npm run check` SAME.

**Not checked.** Live test; phone layout; loop check cards ng Air (wala pa sa dock).

## 3.2.1-beta.9 — MAKE-UP AND CLOSED COOLING WATER, mockup page 02 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.**
- `docs/hmi/mockups/temp/02-makeup-closed-cooling.html` (inaprubahang mockup) → Plant view **MAKE-UP AND CLOSED COOLING WATER**
  (`MK02`), drawn exactly; ang lumang MAKE-UP WATER at 027 CLOSED COOLING WATER ay nananatili hanggang pumasa ang loop check.
- `tools/hmi-mock/mock.py`: generic na annotator para sa susunod na mga page (hooks lang; ayaw ng snapshot number na walang hook; ayaw
  ng sirang SVG). `p02.py` + `p02-head.js` → `src/ui/plant/hmi-mock-mu.js`.
- `hmi-mock.js`: valve label ng mockup → faceplate na alam ng `fp-pop.js` (`LS_FPOP.valveKind`, `valveOpen`; red = open, green = closed);
  XV-MU1109 OPEN / CLOSED (plant model) at Auto / Manual (DITL-78 AUTO SELECTED); TCV-CW1201 = MV, mode at PV ng TICLO1002 (ABC-053),
  click = faceplate ng controller; ACWP Remote / Auto mula sa output rows ng DITL-76 / 77 (gaya ng lumang page); "page:" at link ng
  mockup = page ng Plant view (ang CW page ay may link na papunta sa page 02).
- Loop check dock: MU / CCW → page 02.

**Checked (headless cloud).** 150 MW + RUN: LIMU0708A/B 13.8 / 13.7 m, PIMU0709 9.0, FIMU1001 25.2 m3/h, LICW1109 0.80 m, ACWP 26.8 A,
PICW1152 6.4, TICLO1002 MV 51.9 % Auto PV 46 °C; faceplate ng MWP-A, MWP-B (Y / N), ACWP-A, ACWP-B (STANDBY), XV-MU1109, V-MU1033,
V-CW1001, TICLO1002; link CW → page 02; walang JS error; `npm run check` SAME.

**Not checked.** Live test; phone layout; ang loop check cards ng MU / CCW (wala pa sa dock).

## 3.2.1-beta.8 — 030 CIRCULATING WATER, the approved mockup page in the app (2026-11-04, JISOO : HMI MOCKUP)

**Problem.** User 2026-11-04 ~8:25 PM PHT (MINA thread): "Yan ang ilagay sa app, yan ang iloloop check". Ang 19 temporary HMI
mockup page (inaprubahan, audit ni HAEWON PASS) ay artifact lang; ang loop check ay ginagawa sa lumang 030 SEAWATER page.

**Work done.**
- `docs/hmi/mockups/temp/01-circulating-water.html`: kopya ng inaprubahang mockup (source of truth).
- `tools/hmi-mock/cw.py` + `cw-head.js`: binabasa ang SVG ng mockup at naglalagay lang ng live hooks (walang binagong guhit);
  gumagawa ng `src/ui/plant/hmi-mock-cw.js`.
- `src/ui/plant/hmi-mock.js` (LS_MOCK): iisang runtime ng mga mockup page: RUNNING / STOPPED / TRIP (LS_DOCK.mst), Remote · Manual
  (LS_DOCK.modeOf), Breaker ON / OFF, Y / N (LS_FPOP.yn), value ng logic kapag may sheet, kung wala ang plant model (UNIT.*),
  DITL-39 rows 3 / 4 / 14 / 15 (IN OPERATION, COMMON FAIL), NO-SOURCE = '-----'. Click: equipment = CONTROL faceplate, Y / N =
  PERMISSIVE · TREND · MONITOR, debris filter = push buttons ng DITL-39, hypo pumps = FIELD, 10 field valve V-SW = FIELD valve
  faceplate. Ang faceplate ay ang dati (fp-pop.js), hindi kinopya ang itsura ng faceplate sa mockup.
- Plant view: bagong page **030 CIRCULATING WATER** bago ang lumang 030 SEAWATER (nananatili hanggang pumasa ang loop check).
- Loop check dock: ang CW ay bumubukas sa bagong page (`loopcheck.js` page 'CWN'); `LS_FPREG` ng bawat motor ay nasa bagong page.

**Checked (headless cloud, Chromium).** Start at 150 MW + RUN: value ng page tugma sa lumang page (LISW1501 -4.00, IIP1501B/C 230.0,
condenser 28.5 / 33.6 °C, SWBP 90.0 A); faceplate bumukas sa click ng SWP-B, Y / N, V-SW1016, S-1502, P-0762A; openAd('M.3353')
true; walang JS error. `npm run check` SAME.

**Not checked.** Live test sa PC ng user; ang 50 card ng loop check dock sa bagong page (gagawin ni MINA); phone layout.
Ang iba pang 18 page ay wala pa sa app.

## 3.2.1-beta.4 — Loop check dock (2026-11-04, thread "Build loop check dock in app")

**Problem.** User 2026-11-04 6:38 PM PHT (MINA thread): "may dock na checklist na makikita natin sa totoong pindot mo, at hindi code".
Ang loop check ay nasa `CW_LOOP_CHECK.md` lang (papel); ang tester ang nagbabasa ng value at nagre-report. Walang panel sa app na
nagpapakita ng PASS / FAIL habang pumipindot.

**As found.** 3.2.1-beta.3 (main 736d55c): may Training dock (`dock.js`), 030 SEAWATER page (`hmi-sw.js`) na may pop-out faceplate
(`fp-pop.js`), plant model ng CW (`unit.js` AN_SW). Walang loop check sa app.

**Work done.** Bagong `src/ui/training/loopcheck.js` + `loopcheck.css` (ayon sa mockup ni MINA
https://claude.ai/artifact/4UbnHivhBbaUUB7WNJ7k4u):
- Button na **Loop check** sa kaliwang rail (sa ilalim ng Training). Bumubukas ang panel sa kanan (parehong lugar ng Training dock;
  isa lang ang bukas: ang Training dock ay nagiging tab sa gilid) at ang 030 SEAWATER page sa gitna.
- **50 card ng Circulating Water**, isa bawat tag at aksyon, galing sa `CW_LOOP_CHECK.md` A ~ E: A (pagbasa sa 150 MW: PG-SW1501,
  PT-SW1110-A1/B1, A2/B2, DPT-SW1502, TT-SW1110-A2/B2, IT-P1501x, SWBP), B (bawat SWP: STOP, REMOTE, START, discharge valve 10 %,
  bukas hanggang PG 2.2 ~ 2.4, 100 % mag-isa, trip interlock; lahat ng SWP STOP), C (condenser path A / B: outlet 40 → 22 → 40 %,
  inlet sarado), D (S-1502 / S-1504 AUTO START / STOP), E (SWBP: START na walang SWP, START / STOP, discharge 5 %, S-1504 DP).
- Bawat card: **Plant model** (AN.unit), **Signal / address** (P.B. memory ng DITL, ang running / remote DI na binabasa ng IBANG
  sheet, hal. I.0526 sa DITL-30 row 18; AI address mula sa I/O list), **Logic row** (DITL output row + ABC memory, hal. ABC-052 M.3354).
  Ang check na walang address o logic row para sa tag (local gauge, field valve, AI na walang logic sheet) ay "–" at hindi binibilang.
- Kusang nakikita ng card ang totoong pindot (faceplate START / STOP + EXECUTE, FIELD LOCAL / REMOTE, field valve). PASS kapag
  tama ang tatlo nang 2 s (plant time) pagkatapos ng pindot; FAIL na may dahilan kapag naubos ang oras ng card. Bilang bawat system,
  PASS / FAIL / Skipped / Not done, FAIL list, Export CSV, Reset system. Ang resulta ay nasa browser (localStorage).
- Ang panel ay nagbabasa lang (LS_DOCK, DUI, WORLD, AN.unit): walang pinipindot o fino-force.
- Ang ibang system (MU / CCW, Air, Condensate) ay nakalista pero wala pang card.

**Mga hangganan ng check (sinabi sa card).** Ang "about" na value ng doc ay may check band: S-1502 DP 400 ~ 600, SWBP 90 A ± 10 %,
SWBP start 274 A ± 10 %, SWP start 500 ± 30 A (ayon sa `cw_model.js`), SWP current pagkatapos ng start 150 ~ 317 A (TECO table ng
`CW_PLANT_MODEL.md`). Ang SWP current sa labas ng SOP 205 ~ 215 A ay UNUSUAL, hindi FAIL (A2).

**As left / status.** Headless (cloud), totoong click sa faceplate: tingnan ang ulat sa thread. HINDI pa live-tested sa PC ng user.
