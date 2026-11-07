# UPDATE REPORT — v3.2.1 (Beta)

## 3.2.1-beta.97 — Ash cooler E-stop pattern, final (2026-11-08, JENNIE)

**Work done.** Beta.95 and 96 carried the broken text pattern; this one has the right pattern.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.96 — Ash cooler E-stop pattern (2026-11-08, JENNIE)

**Work done.** The E-stop rule of beta.95 had a broken text pattern and did nothing; fixed.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.95 — Ash cooler E-stop at load (2026-11-08, JENNIE)

**Work done.** The NOT EMERGENCY STOP row matched the stopped cooler rule first; it now reads 1 at 150 MW.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.94 — Audit values, third batch (2026-11-08, JENNIE)

**Work done.** Valve sheet sizes: PCV-DO0002, FCV-DO1012, FCV-CD1120, LCV-MU1110, TCV-CD1115. Vacuum rise from the starting ejector curve.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.93 — Steam temperature lag from steel, cooler E-stop (2026-11-08, JENNIE)

**Work done.** Steam temperature lag 362 s, worked from superheater steel 232 t. Ash cooler emergency stop released at load.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.92 — Water heat from the furnace (2026-11-07, JENNIE)

**Work done.** Boiler water takes heat by furnace rise, so it cannot pass the bed; heat stored includes the evaporative steel. From Mina item 12d.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.91 — Ash coolers can start (2026-11-07, JENNIE)

**Work done.** Chain conveyor running and the local emergency stop contacts of the coolers now reach DITL-21A, from Mina item 2.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.87 — Bed pressure drop, SOx, ash coolers (2026-11-07, JENNIE)

**Work done.** From Mina items 2, 3, 8: bed pressure drop transmitters follow the inventory, SOx is written by the plant model, ash leaves only by a running cooler, the chain conveyor STOP contact reads 0 while it runs.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.74 — Audit values, second batch (2026-11-07, JENNIE)

**Work done.** Heater drain valve capacities and alternates, RH and HP bypass spray flows, from the valve sheets.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.73 — Audit values from the documents, first batch (2026-11-07, JENNIE)

**Work done.** Valve sizes HP bypass, LP bypass, main steam and RH blow-off from the valve sheets; SH and RH fall below 60 % from FHI Fig 6; boiler water 175.6 t; air heater gas in at part load from L20.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.72 — Gas out holds with no air, furnace label (2026-11-07, JENNIE)

**Work done.** Gas leaving the air heater no longer jumps to the inlet value when the fans stop. The status strip value is the furnace temperature of Fig 8 and is now named so; the logic reads the lower bed thermocouples, about 10 % higher (F72).

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.71 — ESP sets stack dust (2026-11-07, JENNIE)

**Work done.** Stack dust and opacity follow the ESP field state. See GAS_PATH.md.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.70 — Economizer with colder feedwater (2026-11-07, JENNIE)

**Work done.** Gas to the air heater falls with colder feedwater. See GAS_PATH.md.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.69 — Silos unlimited, limestone sets SOx (2026-11-07, JENNIE)

**Work done.** Limestone and sand silo levels stand still. Stack SOx follows Ca/S with a 2 h lag. See GAS_PATH.md.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.67 — Bed heat-up (F66) (2026-11-07, JENNIE)

**Work done.** Below the start of coal (483 C, FHI Fig 2) the bed moves with a 4 h lag: refractory and bed charge are the heat sink. Live on beta.63 it rose 13 C/min; the source says 1 C/min (PR-OPE-5002), limit 153 C/h (FHI). Above 600 C the old 900 s lag stays.

**Not tested.** Live. The lag is set from Fig 2 (110 C at 1 h), so the rate with real oil flows needs the next Cold run.

## 3.2.1-beta.64 — Fan current and FA header pressure, one law (2026-11-07, JENNIE)

**Work done.** The HMI fan currents used a law of their own (0.3 + 0.7 x flow cubed); now the engine law (0.45 + 0.55). FA blower current and FA header pressure on the HMI follow the flow instead of standing at the snapshot.

**Not tested.** Live.

## 3.2.1-beta.63 — Air preheater and O2 from FHI Tab 3 (2026-11-07, JENNIE)

**Work done.** O2 from the coal analysis of Tab 3 (5.46 T of air per T of coal), one value on both analyzers; air preheater gas and air temperatures from the Tab 3 balance, rotor stop included; HMI pages use the same equations. See GAS_PATH.md.

**Not tested.** Live. Part load air stays open: the logic curves give more air than FHI Fig 12.

## 3.2.1-beta.28 — SAMPLING AND DOSING, GENERATOR, EXTRACTION AND DRAINS, OVERVIEW, mockup pages 16 ~ 18 at 00 in the app (2026-11-05, JISOO : HMI MOCKUP)

**Work done.** Ang huling apat na temporary mockup page ay nasa app na (Plant view `MK16`, `MK17`, `MK18`, `MK00`); kumpleto na ang 19 page.
- Bagong runtime hooks (`hmi-mock.js`): `data-di="TAG|on|off|neg"` = digital input ng I/O list (pula = 1, '-----' kapag walang
  sheet na bumabasa), `data-dir` = square nito; MOV `am` = "AUTO · REMOTE"; `data-movr` = kulay ng valve symbol ng MOV (pula bukas,
  berde sarado); `data-v="SHEET|ADDRESS"` = address ng sheet (ABC-001C SI0230 = compensated main steam flow, gaya ng top bar).
- **Page 16 SAMPLING AND DOSING** (`p16.py` → `hmi-mock-sp.js`): analyzers AT-SP1001 ~ 1021 (I/O list AI0320 ~ AI0358), alarms
  AL1-SP01 / AL2-SP01 / AL3-SP01 / AL-Z1110 (I.053C ~ I.053F), dosing pumps MIR-Z1107A ~ Z1109B (I.0120 ~ I.012A), agitator MIR-Z1101A
  (I.012C), tank level switches LSH / LSL / LSLL-CH1101 / 1103 / 1105 (I.0130 ~ I.0138). Pump capacity = design data ng PD-042.
  NO-SOURCE: LAHAT ng value at estado ay '-----': walang ABC / DITL sheet na bumabasa at walang water chemistry sa plant model; ang
  snapshot 21 numbers ay hindi inilagay.
- **Page 17 GENERATOR** (`p17.py` → `hmi-mock-gn.js`): 52G1 / 52L1 = DITL-03E input 3 / 2 (M.3220 / M.3221); GCB 52G1 ON = DITL-89
  input 15 (I.0931), OFF = DITL-03H input 18 (MIG-52G1-2); DS / ES, remote, ready to synchronize, generator trip = I/O list DI
  (MIG-52G1-3 ~ 6, MIL-52G1, RY-52G, RY-52L, MIT-GEN; walang sheet → '-----'); generator MW GCP-AI1001 / 1002; bearing No. 3 / 4 metal,
  outlet oil, vibration = turbine oil model (tcs.js tcsOil, ASSUMED doon, gaya ng page 04). NO-SOURCE: TCS-only values (TCA3xx, TCA775
  MVar, PF, Hz, kV, kA, field V / A, energy), cooling air, stator coil, 86G-A / B, leakage, field breaker.
- **Page 18 EXTRACTION AND DRAINS** (`p18.py` → `hmi-mock-ex.js`): shut-off MOVs MV-TS1001 ~ 1005 = DITL-94 ~ 98 (position, OPEN /
  CLOSED, AUTO · REMOTE, MOV faceplate); drain MOVs MV-TS1391 / 1397 / 1392 / 1396 / 1393 / 1399 / 1398 / 1394 / 1390 / 1395 / 1389 /
  1400 = DITL-99 ~ 110 (DITL-0D rows 14 ~ 25); flash pipe XV-FS1005 + LS-FS1410 / 1411 = DITL-57; PT-TS1013 / 1017, TT-TS1011 = plant
  model (unit.js anFwTagStep); PT-TS1022 = logic; condenser = U.cdP. NO-SOURCE: air-assisted check valves XV-TS1700 ~ 1740 (wala sa DCS
  I/O list); TT-TS1014 / 1018 / 1023 / 1027, PT-TS1026, PICR19011 ~ 13 ay '-----' (walang sheet at model).
- **Page 00 OVERVIEW** (`p00.py` → `hmi-mock-ov.js`): bawat title = link sa page nito; values GCP-AI1001, PT-MS1002, TICMS1004 PV,
  ABC-001C SI0230, FICFW1007 PV, LICBR1001B PV (compensated), PT-FG1085, FIC-CM, 52G1 / 52L1 DITL-03E, condenser cdP, turbine rpm; CCS
  HIC-ULD, EIC-TM, PIC-COBM, HIC-BM, FIC-CM (PV / SV / mode + faceplate sa click). NO-SOURCE: total air flow (suma sa loob ng ABC, walang
  transmitter), load rate, high limit, load up rate.

**Checked (headless cloud, 150 MW + RUN).** Page 16: 21 analyzer at 20 DI '-----' (tama: walang source). Page 17: 151.3 / 151.3 MW,
52G1 / 52L1 CLOSED, GCB ON Y / OFF N, bearing No. 3 / 4 69 / 67 °C, outlet oil 55 / 56 °C. Page 18: MV-TS1001 ~ 1005 100 % OPEN AUTO ·
REMOTE, drains 0 % CLOSED, XV-FS1005 CLOSED, level hi / lo N, PT-TS1013 14.11, PT-TS1017 5.32, PT-TS1022 1.29 kg/cm2, TT-TS1011 369 °C;
faceplate ng MV-TS1001, MV-TS1391, XV-FS1005 bumubukas. Page 00: 151.3 MW, 122.6 kg/cm2, 540 °C, 474.1 T/H, 508.8 T/H, drum 17 mm,
-21 mmH2O, coal 87.5 T/H REMOTE, CCS lahat AUTO (FIC-CM REMOTE), HIC-BM faceplate bumubukas. Walang JS error. Hindi live-tested.

**Findings (para kay IRENE / SEULGI).**
- DITL-99 ~ 110 (extraction drain MOVs): input TRIP = 1 at TORQUE = 1 sa 150 MW (DRN VLV MOV TRIP CRT ANN = 1).
- DITL-94 ~ 98 (extraction shut-off MOVs): input FULLY CLOSED = 1 kasabay ng FULLY OPEN = 1, at output TRIP (CRT ANN) = 1 sa 150 MW.
- Ang sampling, dosing at generator DI ng I/O list ay walang sheet na bumabasa: hindi mafo-force sa loop check hangga't walang field
  signal sa model.

## 3.2.1-beta.26 — TURBINE START, ESP AND ASH, SOOTBLOWERS, mockup pages 13 ~ 15 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/13-turbine-start.html` → Plant view **TURBINE START** (`MK13`), `tools/hmi-mock/p13.py` →
`src/ui/plant/hmi-mock-ts.js`.
- Bagong runtime hooks (`hmi-mock.js`): `data-uy="KEY|n|on|off"` = estado ng plant model (on pula kapag value >= n), `data-uyr` = ang
  square nito; ang `ux:KEY*100` = fraction na ipinapakita bilang %; ang `tcs.` path = AN.tcs() (TCS panel state).
- Values: CV = U.gv × 100, ICV = U.tb.icv × 100, speed U.rpm, generator MW GCP-AI1001 / 1002 (I/O list AI0419 / AI0774), condenser
  U.cdP, bearing / lube / control / trip / EOP oil pressure at lube oil after cooler = AN.unit lo* (parehong numero ng page 04); main / control
  / emergency oil pumps running = loMop / loCop / loEopR; 52G1 CLOSED / OPEN = DITL-03E input row 3 M.3220 52G1 OPEN (NOT).
- ATS steps 1 ~ 8 Y / N = AN.tcs().step (huling tapos na step), exhaust hood = AN.tcs().Tx, shell expansion = AN.tcs().sexp.
- NO-SOURCE ('-----'): MSV / RSV positions, PT-MS1006 / TT-MS1007 sa 150 MW, DS, 52L1, field breaker at generator electrical values,
  vibration, differential expansion, rotor position, thrust bearing, stator coil, generator cooling air.
- Finding (para kay IRENE): ang AN.tcs() ay null sa page at walang `tc` ang AN.unit (ang engine ay nasa worker), kaya '-----' ang ATS
  steps, exhaust hood at shell expansion; kailangang ipasa ng engine ang TCS state sa page.

**Checked (headless cloud).** 150 MW + RUN: CV 99.5 %, ICV 100.0 %, 3600 rpm, generator 151.3 / 151.3 MW, 52G1 CLOSED, condenser
0.063 kg/cm2 abs, bearing oil 3.3, lube 6.1, control / trip oil 162.6, MOP A running, COP A running / B stopped, EOP stopped; walang
JS error.

**Page 14 ESP AND ASH** (`MK14`, `tools/hmi-mock/p14.py` → `src/ui/plant/hmi-mock-ea.js`).
- Screw ash coolers A ~ D = DITL-21A / #B / #C / #D (motor faceplate; RUNNING / STOPPED = input row 1 FORWARD RUNNING); chain
  conveyor L-1090, bucket elevator L-1091, screw conveyor L-1092, vibrating screens S-1092 A / B, bag filter fan F-1091 = DITL-BA59
  RUNNING inputs (rows 8 ~ 14); DPICFG108 (furnace DP) at SICL1060A (screw speed) faceplates; DPT-FG1081 / 1082, PT / TT-CW1156,
  TT-BH1060-x1 / x2, TT-CW1060-x1 / x2, LT-BH1750 (I/O list).
- NO-SOURCE: ang buong ESP (walang snapshot at signal), fly ash silo, cooler inlet valves XV-BH1060A ~ D, cooler currents, silo outlet
  XV-BH1756; ang PT / TT-CW1156, TT-BH1060, TT-CW1060 at LT-BH1750 ay '-----' pa (walang sheet na bumabasa at walang plant model).
- Checked: bed DP 1426 / 1432 mmH2O, DPICFG108 PV 1429 / SV 1475 MANUAL, coolers STOPPED, chain / bucket / screw conveyor at fan
  RUNNING, screens STOPPED; faceplates ng cooler A at DPICFG108 bumubukas; walang JS error.

**Page 15 SOOTBLOWERS** (`MK15`, `tools/hmi-mock/p15.py` → `src/ui/plant/hmi-mock-sb.js`).
- Bawat blower label N-1011 ~ 1038 = output "N-10xx SOOTBLOWER OPERATING" ng DITL-80A ~ 80E (pula habang bumubuga); N-1040 / 1042 =
  DITL-80F AIR PREHEATER SOOTBLOWER OPERATING. Blowing permissive = DITL-80A output 21; steam supply valve / drain temperatures >
  220 °C / all retracted / remote = DITL-80A inputs 2, 24, 23, 14, 15, 13; MV-SB1001 = DITL-80S FULL CLOSED; alarms = DITL-80S OPEN /
  CLOSE OVER TIME, DITL-80Q WARMING UP FAILURE; XV-SB1054 / XV-SB1059 = DITL-80R SOV (L) / (R) OPENED; PICSB1052 (ang tag ng logic;
  PIC-SB1053 ang nakasulat sa mockup) faceplate.
- NO-SOURCE: ilang blower ang bumubuga, forward / reverse at warm-up timers, MV-SB1001 %, IT-SB01, PT-SB1040 / 1042, TT-SB1056 / 1057.
- Finding: "All blowers on retract position" (M.4008) = N sa 150 MW, pero lahat retracted sa snapshot 18 (walang retract limit switch
  sa model).
- Checked: PT-SB1052 0.4 kg/cm2, PICSB1052 0.2 % MANUAL, MV-SB1001 CLOSED, lahat ng blower hindi bumubuga, remote Y; faceplate ng
  PICSB1052 bumubukas; walang JS error.

**Not checked.** Live test, ATS steps (walang data sa page), turbine trip, phone size.

## 3.2.1-beta.25 — COAL, LIMESTONE AND SAND, mockup page 12 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/12-coal-limestone-sand.html` → Plant view **COAL, LIMESTONE AND SAND** (`MK12`),
`tools/hmi-mock/p12.py` → `src/ui/plant/hmi-mock-cls.js`.
- Coal: feeders A / B / C = DITL-19 / #B / #C (motor faceplate; alarm "inlet plugging" / "belt tracking" = CRT outputs 14 / 16 ng
  drawing, clean-out conveyor AUTO = output 23); XV-CL1061-x = DITL-20 / #B / #C (MOV faceplate, OPEN = output 6); FICCL1061A ~ C
  (PV / SV / MV / mode), FIC-CM coal master, HS-COAL (faceplate).
- Limestone (Rotofeed PLC): XV-LM1812 / XV-LM1815 = solenoid output ng DITL-LS170 / LS180, vent / balance / equalising = LS160 /
  LS190 / LS200, isolating A ~ H = DITL-LS212 output rows 12 ~ 19, bypass air = rows 10 / 11, rotary feeder RUNNING = LS110 output 21,
  vent filter = LS214 output 18; silo level at vessel pressures = plant model AN_LM (lmSilo, lmPl, lmPd).
- Sand: XV-SD1804 / XV-SD1801 / XV-PA1800 / XV-AV1803 = DITL-771 outputs 22 / 24 / 25 / 20, vent filter = DITL-774 output 22,
  isolating A / B = DITL-776 outputs 11 / 13, bypass air XV-PA1807 = output 12; silo level at vessel pressure = AN_SD (sdSilo, sdP).
- NO-SOURCE ('-----'): coal bunker levels LT-CL1008-x at totalizers MIA-CL1061-x1 (I/O list AI pero walang sheet at walang plant
  model), coal calorie correction, coal / power ratio, unit output, rotary feeder speed ST-M1311, XV-PA1805B.
- Finding (para kay SEULGI): DITL-LS160 / 170 / 180 / 190 output "CLOSE FAULT" = 1 sa 150 MW (FULLY CLOSE indicator = 0: walang
  fully-close limit switch ang model).

**Checked (headless cloud).** 150 MW + RUN: feeders RUNNING, FICCL1061A ~ C 29.2 T/H AUTO, coal master 87.5 / 87.1 T/H REMOTE,
HS-COAL REMOTE, XV-CL1061-x OPEN; limestone silo 69.4 %, lock / dispensing 0.0 / 0.1 kg/cm2, lahat ng valve CLOSED maliban sa bypass
air OPEN; sand silo 50.1 %, bypass air OPEN; faceplates ng feeder A, XV-CL1061-B, coal master bumubukas; walang JS error.

**Not checked.** Live test, limestone fill cycle at sand cycle mula sa page, phone size.

## 3.2.1-beta.24 — DIESEL AND BURNERS, mockup page 11 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/11-diesel-burners.html` → Plant view **DIESEL AND BURNERS** (`MK11`), `tools/hmi-mock/p11.py` →
`src/ui/plant/hmi-mock-db.js`.
- Motors: diesel oil pump A / B = DITL-31 / DITL-31 #B (boiler.js AN_DO), RUNNING / STOPPED, Remote / Auto, current IT-P0702A / B.
- Controllers (faceplate): PICDO0005 (PCV-DO0002), HICDO1012 (FCV-DO1012), PICDO1008 (PCV-DO1009), FIC-OM oil master (PV / SV / MV /
  mode), FICDO1043A ~ D (FCV-DO1043-x3), FICFA1043A ~ D (burner air PV, MCV-FA1043-x MV at mode).
- Values (I/O list): PT-DO0005, PT-DO1008, ZT-DO1012, FT-DO1043-x, PT-DO1043-x2 ng logic; LT-DO0701, DPT-DO0001, IT-P0702A / B,
  ZT-DO0002, ZT-DO1009, ZT-DO1043-x3 mula sa plant model AN_DO (walang sheet na bumabasa).
- Burner state: IN SERVICE / OFF = DITL-10 (#B ~ #D) input row 19 BURNER x IN SERVICE; igniter ON / OFF = DITL-10 output row 16
  ENERGIZE IGNITER TRANS.; XV-DO1043-x1 / x2 OPEN / CLOSED = DITL-16 output rows 21 / 23 (VALVE (1) / (2) CLOSED · CRT); atomizing air
  XV-PA1043-x2 = DITL-07 input row 21 ATOM. AIR VALVE OPENED. Runtime: `data-dy` may `data-on` / `data-off` na text.
- Runtime: ang controller ng isang machine na walang value hook sa page ay may faceplate na rin (FICDO1043A ~ D).
- NO-SOURCE ('-----'): flame detectors BT-DO1043-x (walang model), oil master ON / OFF, total diesel oil used, purge air valves
  XV-PA1043-x3.

**Checked (headless cloud).** 150 MW + RUN: tank 4.978 m, strainer 0.029 kg/cm2, pump A RUNNING 25.4 A, B STOPPED Remote · Auto,
PT-DO0005 12.8, PCV-DO0002 24.2 % AUTO, FCV-DO1012 100.0 % MANUAL, PT-DO1008 11.0, PCV-DO1009 85.7 % AUTO (= 6.PNG); burners OFF,
igniters OFF, oil valves CLOSED; faceplates ng pump A, FICDO1043B, FICFA1043A, FIC-OM bumubukas; walang JS error.

**Not checked.** Live test, burner light-off sequence, phone size.

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


## Mga Beta na walang sariling section (listahan mula sa git log, idinagdag 2026-11-06 TZUYU)
Ang detalye ng bawat isa ay nasa commit, sa lumang HANDOFF (`archive/handoff/HANDOFF-until-2026-11-06.md`) at sa plant model / loop check docs ng folder na ito.

- **beta.1** (2026-11-04, 4d1918a): CW (seawater) plant model from vendor data
- **beta.2** (2026-11-04, 1bc1a03): Make-Up Water and Closed Cooling Water plant model from vendor data, linked to the DITL
- **beta.3** (2026-11-04, cd6a1c8): Instrument and Plant Air plant model from vendor data, linked to the DITL
- **beta.5** (2026-11-04, b282db5): heater levels plant model, unit_trip on the one world (#122)
- **beta.6** (2026-11-04, 88a5298): instrument air to pneumatic valves (#124)
- **beta.7** (2026-11-04, f64e4f8): LP heater temperatures; control damper drawing read (#125)
- **beta.14** (2026-11-04, 2360384): page 05 CONDENSATE values from the plant model (#132)
- **beta.16** (2026-11-04, b505a6f): page 06 FEEDWATER values from the plant model (#135)
- **beta.17** (2026-11-04, fe519df): BFWP suction from the two snapshots; hotwell reviewed (#136)
- **beta.23** (2026-11-04, 20dde8f): page 08 AUX STEAM AND VACUUM values from the plant model (#145)
- **beta.27** (2026-11-05, 1dee1c7): Merge main (beta.26) into mina/cw-fixes, version 3.2.1-beta.27
- **beta.29** (2026-11-05, 41d1511): ACWP local STOP works on the first press (Worker), one alarm per motor trip
- **beta.30** (2026-11-05, 9f5282a): controller MV / SV pop-up stays inside the faceplate, manual valve OPEN · CLOSE order
- **beta.31** (2026-11-05, af86c91): CEP AUTO, MOV lamp wiring (nearest address), MOV field selector
- **beta.32** (2026-11-05, 12d06ed): BFWP lube oil pumps, DITL-38 selector, valve block reason, air preheater trip reset, Escape on controller
- **beta.33** (2026-11-05, c7b0e7e): every label of a controller opens it, % MAN station steps 1 / 5 %
- **beta.34** (2026-11-05, 2071ed8): quick ▲▲ presses add up (MAN station, controller pop-up) with the Worker
- **beta.35** (2026-11-05, 4ae9f29): ash cooler local START/FORWARD and NOT EMERGENCY STOP release
- **beta.36** (2026-11-05, cc8d965): loop check split view (HMI | logic, tag table, controller tags, events, dock / float)
- **beta.37** (2026-11-05, 4a159fc): split view batch = one equipment of the HMI pages
- **beta.38** (2026-11-05, 65e8c7f): split view controller batch opens its ABC sheet
- **beta.39** (2026-11-05, 150d2f5): split view instrument batches
- **beta.40** (2026-11-05, 3742f93): split view analog loop check
- **beta.41** (2026-11-05, 86fe376): split view Inject / Release for the analog loop check
- **beta.42** (2026-11-05, fa3318c): merge main into PR #141 (sand DITL-771 reset, limestone DITL-LS212 isolating valves)
- **beta.43** (2026-11-07): 150 MW start waits for the DITL before Run (test `tests/regress/ditl150_startp.js`)
- **beta.44** (2026-11-07): plant Phase 1 start: HP bypass steam returns to the water cycle; LOW VACUUM trip 0.26 kg/cm2 abs from IBD TA-10
- **beta.45** (2026-11-07): one water inventory: deaerator and drum level rates from their drawings; drum rate follows water density. Test `tests/regress/water_inventory.js`
- **beta.46** (2026-11-07): MW follows the vacuum; HP / IP LP shares from a calculated heat balance (HEAT_BALANCE.md)
- **beta.47** (2026-11-07): alarm limits from alarm list 2016-09-12 (58 tags, first stage C corrected by hand); primary air to the furnace FIFA1079 live (name clash with the fan count); turbine speed live at every load, limits for 3600 rpm; one condenser box shut sends its heat to the other box
- **beta.48** (2026-11-07): Worker: a press acts fast again (a whole state 1.5 s to 0.17 s, a normal patch 100 to 22 ms); a patch going in is not called a stall (Mina F11)
- **beta.49** (2026-11-07): an isolated heater changes the plant: colder feedwater makes less steam per coal, the extraction stays in the turbine and adds MW, more steam to the condenser (HEAT_BALANCE.md)
- **beta.50** (2026-11-07): water side of all five heaters: inlet, outlet and bypass valves change the temperature, the extraction and the flow; HH 140 on all five (ABC-035 ~ 039). Source: plant-study 11-heater-valves.md
- **beta.51** (2026-11-07): Feedwater page: valve V-FW1010 symbol opens its faceplate and shows its color
- **beta.52** (2026-11-07): MOV: STOP stops the valve; the torque switch no longer stays on and blocks CLOSE; the faceplate judges a press by what the valve does; polisher inlet and outlet names (Mina F22 to F27)
- **beta.53** (2026-11-07): Phase 2 begins: bed temperature follows FHI Fig 8 and Fig 12 above 40 % load (was 95 C too hot at 60 %); the start-up law stays below
- **beta.54** (2026-11-07): Mina findings: a refused LCP START says why (F18); no suppression and no "shutdown" text at load (F6); no false DITL-777 SYSTEM TRIP at the 150 MW load (F7); alarm names = tag and I/O list service (F2); make-up header rises inside the 3 s of DITL-112 TR25, the AUTO pumps stay stopped (F21); AUTO / MANUAL on every MOV whose AUTO PB is a maintained bit (MV-TS1001, F29). Test `tests/regress/mina_f_b1.js`
- **beta.55** (2026-11-07): Cold Guide no longer stops at the expansion tank (Mina F33). PR-OPE-5002 section 7 uses XV-MU1109 "if instrument air is available"; the valve is spring opening, so with no air the fill stops at the manual line valve V-MU1031 (new field valves V-MU1031 / 1032). New Guide step after the instrument air compressor: V-MU1031 open, XV-MU1109 AUTO (115 steps). ISOLATE / REINSTATE refused inside the 90 s of the drawing says so. Test `tests/regress/mina_f33.js`
- **beta.56** (2026-11-07): bed inventory: ash and limestone in, the four screw coolers out; furnace pressure drop DPIFG1081 / 1082 is the weight on the grate
- **beta.57** (2026-11-07): CFB loop: no fluidizing air at the seal pots keeps the solids in the cyclone legs and the bed empties; they return with the air
- **beta.58** (2026-11-07): Light Split view and Plant view: SMIL motion stepped 10 times a second, still in Split; body :has rules replaced by classes. Split at 4x CPU 2-3 to 24-34 fps headless. Inject stays in the loop check: off while the Guide runs, released when Split closes. A banner stands in every view while a signal is forced. Test `tests/regress/light_inject.js`
- **beta.58** (2026-11-07): the status bar shows the real speed beside the set speed; a MOV held at its end no longer keeps the world busy (x300 ran about x45, from beta.52)
- **beta.59** (2026-11-07): Guide: a valve of a step opens the valve card on any page (F42, F44); V-CW1001 is asked only after the fill is shut and the speed falls to x10 near 1.7 m (F43). Speed: a slow job no longer loses time, the DITL owes what it could not scan, the Logic page uses the steps of the ABC tick (F37; Logic x300 94 to 188-342 headless)
- **beta.60** (2026-11-07): Home opens with the Guide (F38), rail answers the first press (F34, F40), clock on the Logic page (F39), update banner waits for a pause (F41, F54). Speed button says the real speed when it is 20 % under (F37). Alternate drain valves start with the primary at 150 MW (F14). Stopped motor current 0 at once (F15), faceplate current follows the page (F20), auto start line in Events (F12), faceplate keeps its place and EXECUTE stays put (F13), ACWP on 030 opens its faceplate (F16)
- **beta.61** (2026-11-07): Guide: a MOV permissive reads no trip and REMOTE (F46); Lineup leads to the controls of the step (F50); x10 near the drum stop level (F51); own names on the pump cards (F49, F52); FIELD: OPEN V-MU1031 only after AUTO and the air closed XV-MU1109 (F45); STEP tag in English (F47); plain text for the busy PC mode (F48)
- **beta.62** (2026-11-07): FT-CD1120 on DITL-64 reads the plant (F28)
- **beta.65** (2026-11-07): Skip the purge and the Training buttons ask on the button, no browser dialog (F32, F36). Test `tests/regress/guide_press2.js`; rail list in home_training.js updated
- **beta.66** (2026-11-07): HICDO1012 in the dock moves (F57); hand stations by an engine action; Step 31 top button goes to the controls (F50); drum stop ask and band (F51); Step 42 asks 16 % first, faceplate says why in words (F56); bias damper check 99.5 % (F60); Update banner warns the plant is lost (F61). Engine step 12.7 to about 10 ms. Tests guide_step31.js

- **beta.68** (2026-11-07): Step 48 air heater soot blowing ends with the real press in Worker (F62): the engine latches the 3 s forward starter O.077C in the scan and sends it to the page, the Guide no longer computes a sheet again on the page. Check says "not done" until the step's condition is met. Test `tests/regress/guide_step48.js`

- **beta.75** (2026-11-07): Turbine trip logic from IBD TA-9 and TA-1 (plan c1): 22 causes with set points, first-out in the Event log and under the plant chip, Turbine trip and Turbine reset buttons. New file `src/analog/engine/tcs-trip.js`. Boiler MFT now trips the turbine (TA-9). Rows with no model value (thrust, HP exhaust temperature, TCS major trouble, generator protection, ATS shutdown) are field contacts by `AN.turbine('fault', { k, on })`

- **beta.76** (2026-11-07): Turbine logic sheets (plan c2, first batch): Logic page, button Turbine IBD: TA-1, TA-9 to TA-22 with live values, field contacts can be pressed. 12 of 76 logic sheets. New file `src/ui/shell/tcslogic.js`

- **beta.78** (2026-11-07): Turbine sheets are the real IBD drawing now (plan c2): 78 sheets read from the PDF by `tools/data/ibd_read.mjs`, gate by gate, simulated; the turbine trip goes through TA-9 and TA-1 and the engine reads the result. Reset follows the drawing: (WO) and the TA-1 A gate decide, no refusal in code. The list view of beta.76 is gone. Set points by sheet in `tcs-trip.js`; comparators without one stay 0, listed by `AN.tcsIbdMissing()`

- **beta.79** (2026-11-07): Turbine IBD sheets drawn from the netlist with the app own layout; the lines of the IBD taken out of the app (they stay in the git history of beta.78)

- **beta.80** (2026-11-07): IBD reader: input names read from their own box only. Fixes TA-9, where the vacuum and main steam temperature rows were taken for Boiler MFT, so those two rows did not reach the trip

- **beta.81** (2026-11-07): IBD input tags back: beta.80 lost them, so the trip sheets had no field values

- **beta.82** (2026-11-07): IBD netlist repaired: links enter through their named box, memories (S / R) read, TA-22 binding narrowed, so the trip reaches TA-1 again. Fixed set points read from the IBD text: 123 of 135 comparators, 6 more by the tables of TA-11 and TA-21, 6 with no number. Test `tests/regress/tcs_ibd_desk.js`

- **beta.83** (2026-11-07): IBD reader: box edges are no wires, a wire is cut at its NOT circle, a stub after a NOT is not joined: nets with two drivers from 62 to 3 (typical sheets 16 and 18, TE-7)

- **beta.84** (2026-11-07): Oil pumps run through the sheets TB-1, TB-2, TB-21, TB-22: standby AUTO start needs the other pump running 10 s or 15 s and its discharge low; a control oil pump stops on bearing oil very low trip; TCS major trouble starts the main oil pumps. A plain STOP of the running pump no longer starts the standby. The EOP keeps the model rule

- **beta.85** (2026-11-07): Turbine IBD page: blocks stand where the IBD has them, so a sheet reads in its order; fit to page, full names wrapped, wires in separate channels, set point under each comparator, own header with the sheet, Inputs list by a button

- **beta.86** (2026-11-07): Turbine trip logic runs at Start 150 MW too (no ATS program there, the cause of AN.tcs() null, not Worker): Turbine protection under the plant chip, Turbine trip and reset. Logic page: third tab Turbine beside ABC and DITL opens the IBD sheets

- **beta.88** (2026-11-07): TCS is its own page on the left rail, out of the ABC and DITL Logic page: sheet list with space and wrapped names, Values, Trace, Inspector, Inputs. Titles of TA-6, TA-20, TA-22 read from the IBD

- **beta.89** (2026-11-07): Turbine reset in Worker: trip, reset and field contacts write only in the engine, so the page keeps the answer of the engine and the plant chip clears after a reset

- **beta.90** (2026-11-07): TCS page: Load IBD drawing reads a file made on this PC, kept only in this browser; without it the page shows the app sheets. The drawing never enters the repository, dist or the Beta. Clean input names in the netlist

- **beta.98** (2026-11-08): Burner atomizing air valve strokes in 1 s, inside the 1.5 s of DITL-14 TR150 / 160. At x1 the 3 s default gave LIGHT OFF UNSUCCESSFUL and MFT on the first light (Mina F74)

- **beta.99** (2026-11-08): Turbine trip reaches MFT cause 18: DITL-03H row 3 TCS-DI1003 is linked to I.0400. Before, the fuel stayed on after a turbine trip

- **beta.100** (2026-11-08): Ash cooler emergency stop row reads released, so a cooler can start. ESP ON and OFF in the TCS / Field menu

- **beta.101** (2026-11-08): Ash cooler sheets read the chain conveyor run contact I.0163 from the plant model

- **beta.102** (2026-11-08): While DITL timers or valves move, the world scans each 0.5 s up to x60, so x10 follows the same timers as x1

- **beta.103** (2026-11-08): A force of the logic on a station also writes its mode status, so PA and SA go to their house operation flow after a turbine trip
