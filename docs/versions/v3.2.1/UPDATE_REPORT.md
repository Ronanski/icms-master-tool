# UPDATE REPORT — v3.2.1 (Beta)

## 3.2.1-beta.174 — Practice: PA fan trip at 150 MW (e5 recovery, 2026-11-08, LISA)

**Work done.** New Training section PRACTICE: PA FAN TRIP AT 150 MW (live.js X10, guide stage 16) and the home button "Practise: PA fan trip". Steps: fault PA fan trips (Faults, MIT-F1053; DITL-26A ELECTRIC TROUBLE -> PAF TRIP); the drawing trips the boiler (DITL-03A row 5 PAF STOPPED -> MFT), the turbine trips through the TCS (IBD TA-9), no run-back drawn; first out, ID / SA fans on, drum level -200 ~ +200 mm for 1 min (FHI Tab 9 p21); relay reset and PA fan restart; hot restart by the purge bypass above 700 C (FHI Tab 9 p22, DITL-02 row 25 M.3339) and MFT reset.

**Checked in the page.** Practise button loads 150 MW and runs; fault: PA fan 1 -> 0, MFT 0 -> 1 within 10 s; steps 1 and 2 ticked.

**Not tested.** Steps 3 ~ 5 (restart, purge bypass), live; item sent to Mina.

## 3.2.1-beta.172 — Practice: O2 analyzer A fails (e5 recovery, 2026-11-08, LISA)

**Work done.** New Training section PRACTICE: O2 ANALYZER A FAILS (live.js X9, guide stage 15) and the home button "Practise: O2 analyzer A fails". Steps: fault analyzer A signal lost (I/O list AI0273 AT-FG1122, SIG.AB B.0671); AICFG112 follows analyzer B (ABC-002 select, AI0433 AT-FG1123); the O2 trim in AUTO and the O2 inside the alarm list band L 2.5 ~ H 5 % for 2 min; I&C clears the fault. The BFWP A trip and the O2 sections are sequential now (a step waits for the one before it): the last step of the O2 section ticked before the fault.

**Checked in the page.** Practise button loads 150 MW and runs; fault: AI0273 0, B.0671 1, AICFG112 PV 4.1 = analyzer B 4.1; steps 1 and 2 ticked.

**Not tested.** The 2 min hold and the clear step after the SEQ change, live; item sent to Mina.

## 3.2.1-beta.171 — Practice: BFWP A trip at 150 MW (e5 recovery, 2026-11-08, LISA)

**Work done.** New Training section PRACTICE: BFWP A TRIP AT 150 MW (live.js X8, guide stage 14) and the home button "Practise: BFWP A trip" (loads 150 MW, pauses first if running). Steps: standby BFWP B in REMOTE + AUTO (DITL-23A #B rows 24 / 18; 03.png BFWP-B standby); fault BFWP A trips (Faults, MIT-P1115A; DITL-23A out 65 TRIP resets the running latch out 55); BFWP B starts by itself (BFWP B AUTO STARTING) or from the CRT; feedwater and drum level inside the alarm list H / L (+127 / -100 mm, LT-BR1001-2) for 2 min; relay reset, BFWP A becomes the standby. No run-back: none is drawn on the ABC or DITL sheets. The checks read the logic.

**Checked in the page.** Practise button: 150 MW loaded and running. Fault: BFWP A 0, BFWP B 1 within 7 s (its AUTO start); drum level 16 -> -65 mm in 80 s; steps 1 ~ 3 ticked by the checks.

**Not tested.** The 2 min hold and the last step, live; item sent to Mina.

## 3.2.1-beta.167 — Faults 3: control valve sticks (e5, 2026-11-08, LISA)

**Work done.** The Faults list gets three stuck control valves: feedwater FCV-FW1130-1 (FICFW1007), SH spray TCV-FW1110 (TICBR1130), deaerator level LCV-CD1104 (LICCD1104) (valve of each controller: unit.js AN_AV, the valve sheets of the package index). The valve stays at the opening it had when it stuck; the controller output keeps moving (wind-up) until the operator takes MANUAL. Every valve model reads its opening through the airlock function anAv (plant.js loop models, unit.js) or the spray valve hold (unit.js), which now return the stuck opening. Clear: the valve follows its command again. Reset clears it. Events FAULT: ....

**Checked.** Static: the three valve models pass through the stuck check. In the page at 150 MW the feedwater fault goes on and off with its events.

**Not tested.** The wind-up with a changing demand, live; items sent to Mina.

## 3.2.1-beta.165 — Faults 2: motor field trips (e5, 2026-11-08, LISA)

**Work done.** The Faults list gets the field trip of seven running motors: BFWP A, PA fan, SA fan, ID fan, coal feeder A, condensate pump A, seawater pump A. The fault sets the ELECTRIC TROUBLE flag of the motor drawing (DITL-23A PDF sheet 41: BFWP A TRIP, MIT-P1115A, = TRIP COMMAND or ELECTRIC TROUBLE; the TRIP resets the RUNNING latch MIR-P1115A), so the logic trips the motor and decides what follows; the motor shows TRIP (as the dock FIELD: TRIP). Coal feeder A stops by its motor model (DITL-19). Clear = the relay reset in the field; the operator starts the motor again. Reset clears every field trip. Events FAULT: ....

**Checked in the page (DITL 150 MW state).** BFWP A, condensate pump A, ID fan: RUNNING 1 -> 0, TRIP; the ID fan trip gives the MFT (DITL-03A). Coal feeder A stops; after the clear it runs again (its start command is still on). Seawater pump A is the standby at 150 MW (stopped), so its trip changes nothing there.

**Not tested.** Live; items sent to Mina.

## 3.2.1-beta.157 — Faults 1: transmitter fails (e5, 2026-11-08, LISA)

**Work done.** New "Faults (trainer)" list in the starting state menu, below the Save points. A transmitter fault puts the AI at the end of its I/O list range (signal lost = lo, over range = hi) on every ABC sheet of its station and sets its SIG.AB flag (the I/O list SIG.AB address); the select circuits and interlocks of the drawings decide what follows. O2 analyzer A AT-FG1122 (AI0273, 0 ~ 25 %, B.0671), drum level transmitter 1 LT-BR1001-1 (AI0130, -422 ~ 820 mm, B.0642), main steam pressure PT-MS1002 (AI0131, 0 ~ 150 kg/cm2, B.0643). A second press clears it; Clear all faults and Reset clear every fault. Each fault and clear is an event "FAULT: ...". Runs in the page and in the Worker (ENG call AN.fault).

**Checked in the page (150 MW).** O2 A lost: AI0273 0, B.0671 = 1, AICFG112 PV follows analyzer B (3.66 %). Drum level 1 lost: AI0130 -422, LICBR1001 PV stays at the other transmitters (18 mm). MSP lost: AI0131 0, B.0643 = 1, PIC-COBM PV 0 (single transmitter: the drawing decides). Clear: all back.

**Not tested.** Live; items sent to Mina.

## 3.2.1-beta.156 — Sootblower lance travel (d1, 2026-11-08, LISA)

**Work done.** The sootblower lances now travel. Source: Diamond Power N11639-SC1 Sootblower steam data (IK4M manual, o&m L10-2 page 93): 50.8 mm/s; 6210 mm for the 14 IK4M (N-1011 ~ 22, 25, 26: unit operation 244 s, out and back), 3050 mm for the 10 IK4M-PT (N-1023, 24, 27 ~ 34: 120 s), 2580 mm for the 4 of the common economizer (N-1035 ~ 38: 102 s); the groups match DITL-80O. The EXTEND COMMAND of DITL-80G (and of each copy) sends the lance out to its front end and back; the RETRACT COMMAND brings it back. The retract limit switch of each lance, ANY ON EXTEND (M.4232) and the ALL ON RETRACT memories (M.4008, M.4246, M.4240, M.4242) follow the lances. The air heater blowers N-1040 / N-1042 have no travel data and stand at rest.

**Checked in the page.** All 28 lances at 0 at the start (all retract = 1); N-1011 out 508 mm after 10 s (its retract switch, M.4008 and M.4246 = 0, M.4240 = 1); front end at 122 s, back at 0 after the full cycle (M.4008 = 1 again).

**Not tested.** A full sootblower program run; item sent to Mina.

## 3.2.1-beta.152 — Sootblower lances at rest (d1, 2026-11-08, LISA)

**Work done.** The sootblower position rows had no source and read 0 ("not retracted"). They now stand at the rest state of 18.PNG (150 MW: all 30 sootblowers retracted, no blowing): the retract limit switch of each lance (DITL-80G row 12 and its 27 copies), the reset positions of N-1040 / N-1042 (DITL-80K rows 24 / 22), and the ALL ON RETRACT memories M.4008 / 4246 / 4240 / 4242 (made by DITL-80L, not in the app). Lance travel while blowing stays NO-SOURCE. Sootblower trips and the plant air / steam select (M.4212, STEAM on 18.PNG) are field / operator inputs, right as drawn.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.151 — Sand rows linked (d1, 2026-11-08, LISA)

**Work done.** Thirteen sand input rows (DITL-771 ~ 777, station 103) had no source. Eleven now read the sand output of the same signal (SYSTEM READY, SYSTEM TRIP M.0880, ROUTE OK M.0872, INLET DV OPEN M.081B, SYSTEM ON M.0810, AIR TANK PRESSURE L M.0860, INLET DV OPEN / CLOSE FAULT, VENTING FAN ON COMMAND M.1375 from DITL-BA21); names from memory list 103. DITL-771 rows 12 / 13 read the seal pressure and vessel pressure low switches of the sand model (I.0573 / I.0575). The rest of the group are operator buttons or field trips (team-files/d1-unlinked-rows.md).

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.149 — Reset gives the cold DITL at once (2026-11-08, LISA)

**Work done.** Simulation test ditl150 "Reset: DITL cold again" (FAIL since before beta.121): after Reset the MFT of DITL-03A came only at the third scan, because Reset clears every flip-flop and the trip travels one scan per sheet (DITL-25A IDF STOPPED -> 03B -> 03A). The first scan of a cold DITL (after a start or a Reset, not at 150 MW) now repeats with no time until no output changes (12 at most), so the cold DITL stands MFT tripped with every motor stopped at once (src/world/ditl150.js: the DITL starts cold, MFT tripped). The test is not changed.

**Checked in the page.** 150 MW load: MFT 0; Reset: MFT 1 at the first scan (before: third).

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.148 — Heater levels steady at the 150 MW start (2026-11-08, LISA)

**Work done.** Mina saw NO.1 HPH level (2) LOW-LOW and NO.1 / NO.2 LPH level HIGH at a steady 150 MW. Two causes in the heater model (unit.js AN_HD): (1) the level started from its transmitter, which the loop model of the drawing had moved at the end of the load under the 02.png (60 MW) valve openings (LPH2 -5 -> -97 mm), so the controller refilled it past HIGH; it now starts at the SV of its primary controller (the 150 MW start is a steady state). (2) The drain valves were seeded on the first step only, when the inflow was not steady yet (HPH1 108 t/h, then 79 t/h), leaving out 109 t/h against in 79 t/h; they are now seeded until every inflow holds. Alarm limits unchanged (alarm list LT-HD1102, LT-HD1105-2).

**Checked in the page (not a live test).** Fresh 150 MW load, RUN: in = out on all five heaters from the 5th step; levels within a few mm of their SV over the run.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.139 — Sand SYSTEM TRIP at the 150 MW load (2026-11-08, LISA)

**Work done.** The header showed SYSTEM TRIP (D77)DITL-777 on a fresh 150 MW load. Cause: NOT REMOTE CONTROL in the OR of SYSTEM TRIP (E10210-3-777). The remote selector SIL-SD1300 (STN103 I.057A, DITL-771 row 5 -> M.081D -> DITL-777 row 3) had no source and read 0. It now stands at REMOTE, as on 20.PNG at 149.5 MW (SAND SYSTEM REMOTE checked). The MFT input of DITL-777 is 0 after the load (it was not the cause); SYSTEM TRIP on DITL-777 has no latch.

**Not tested.** Live; item sent to Mina.

## 3.2.1-beta.136 — I.041D / I.041E service text (2026-11-08, LISA)

**Work done.** The I/O view showed the old WIRING.xls text "52G1 opened" / "52L1 opened for house load" on S2 I.041D / I.041E. Corrected to the DCS I/O list STN102 (ades.json station 2) and 310SC90-773 rev 2: TCS-DI1050 "#1 HP-CV full close", TCS-DI1051-1 "#1 MSV(A) test". No logic reads these two inputs. The breakers keep their own inputs (I.0931 / I.0932, I.0937).

**Not tested.** Live; item sent to Mina.

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

- **beta.104** (2026-11-08): Burner gun stroke 3 s and oil valve stroke 0.8 s, inside the DITL-14 and DITL-15 timers, so OFF ends in a retract with no false LIGHT OFF UNSUCCESSFUL

- **beta.105** (2026-11-08): Worker hand-over at 150 MW: mode status from a force only on the PA and SA stations of a running plant, SWBP efficiency out of the snapshot

- **beta.106** (2026-11-08): Burner oil valve stroke 0.5 s, so a normal OFF closes the oil before the atomizing air and gives no LIGHT OFF UNSUCCESSFUL pulse at x1

- **beta.107** (2026-11-08): Part load from the plant trends: bed temperature, natural steam temperature and spray range, O2 trim held and PA bias at the 150 MW start

- **beta.108** (2026-11-08): Ash cooler speed switch follows its running cooler in the Worker
- **beta.109** (2026-11-08): Training adds the Normal shutdown section (PR-OPE-5003-01 steps 4.1 ~ 4.20): load rates 1.2 / 0.6 / 0.4 MW/min, hold 90 and 45 MW, burners in at bed 750 °C, coal out at 700 °C, turbine SHUT-DOWN at 30 MW (MFT on this unit).
- **beta.110** (2026-11-08): Bed temperature holds at part load (start-up law fades out above 30 % fuel share; was capping the bed at 741 °C at 90 MW). MW per steam flow from the plant trends (MW = 0.3362 x steam - 11.9: 150 MW at 481 T/H, 90 MW at 304 T/H).
- **beta.111** (2026-11-08): Training adds the Bottle-up section (PR-OPE-5004-01): steam lines isolated, drum +200 mm, BFP stop, burners out, biasing dampers 100 %, PA fan / FA blowers / SA fan / ID fan stop, furnace pressure -20 ~ +20 mmH2O on the damper.
- **beta.112** (2026-11-08): Ash cooler speed switch of machines B, C, D follows its own cooler (the rows of #B carried the tag of A and followed cooler A).
- **beta.113** (2026-11-08): Main steam temperature on a load ramp: the superheater pickup moves with the tube metal lag like the spray outlet (was 550 C on the way up, 532 C on the way down).
- **beta.114** (2026-11-08): HIC-MWRL load rate keeps the operator's value (it read its own old output back); MAN station faceplates in their own unit step 0.1 (MW/min); Training button Practise: Normal shutdown.
- **beta.115** (2026-11-08): Normal shutdown follows the drawing below 220 T/H steam: HIC-BM and EIC-TM go MANUAL by the back-up command M.2013 near 63 MW, the trainee lowers EIC-TM and HIC-BM by hand to 45 and 30 MW.
- **beta.116** (2026-11-08): HIC-MWRL operator value written onto its own AUTO loop too (the Worker kept 3.0); Practise: Normal shutdown opens the guided dock at the first shutdown step.
- **beta.117** (2026-11-08): Ash cooler speed switch reads SPEED LOW while its cooler is stopped at 150 MW (the load set every SPEED NOT LOW row to 1).
- **beta.118** (2026-11-08): HIC-MWRL: the operator's value is kept by the station (s.op) and wins over its own loop read-back.
- **beta.119** (2026-11-08): Hotwell water area 68.8 m2 from the condenser O&M (61.9 m3 to HHL 900 mm); was 27.8 m2, so the level moved 2.5 times too fast and emptied in 6 min at 30 MW.
- **beta.120** (2026-11-08): HMI page 13 TURBINE START: ATS step 9 SHUT-DOWN with its push buttons, and the turbine protection band: TRIPPED / RESET, first out, TURBINE TRIP / RESET push buttons, the 23 trip inputs of TA-9 (mockup 13-turbine-protection-v1, approved by the user).
- **beta.121** (2026-11-08): The Practise buttons pause the simulation while 150 MW loads (a reload of a running plant tripped it in 20 s).
- **beta.122** (2026-11-08): Bottle-up steps: close the drum blowdown valve before the BFP stop (PR-OPE-5003), FA blowers to MANUAL before the stop (the AUTO standby restarted), ID fan coupling in MANUAL lowered with each fan damper (furnace kept near -15 mmH2O).
- **beta.123** (2026-11-08): Reheat temperature at part load: below the spray range the natural curve (plant trend 521 C at 90 MW) is the value with the biasing dampers at their end; their assumed extra gain no longer lifts it to 536 C.
- **beta.124** (2026-11-08): Page 13 protection band: RESET / first out read from the TCS trip state (was ----- at 150 MW and [object Object] after a trip), NORMAL step at the 150 MW snapshot, larger text.
- **beta.125** (2026-11-08): HIC-MWRL (and any station that an A / M switch tracks): the operator's value also goes on the manual leg of that switch, so the tracking no longer puts the old value back every scan.
- **beta.126** (2026-11-08): Practise buttons pause only a running plant (in VIEW the pause asked for a starting state); Practise: Normal shutdown opens the shutdown step again after the dock settles.
- **beta.127** (2026-11-08): Normal shutdown steps teach the coal master in MANUAL: ABC-004A M.0130 forces FIC-CM to MANUAL when the PA or SA air flow control leaves REMOTE (the procedure puts them in MANUAL at bed 750 C); FIC-CM buttons on the burner, 45 MW hold and feeder stop steps.
- **beta.128** (2026-11-08): Shutdown and bottle-up steps say what the drawings force: drum level 1 ELEMENT button (ABC-010), start-up level control below 120 T/H, level controls inhibited with both feed pumps stopped, ID fan coupling MANUAL below 14 % with PA / SA forced MANUAL (ABC-008 / 007), DAMPER CONTROL select and damper 5 / 2.5 % buttons.
- **beta.129** (2026-11-08): Events: no "started by its logic" lines for the units that already run on the 150 MW load (seawater B / C, MWP C, PAF lube oil B ... showed STOP until the first RUN scan).
- **beta.130** (2026-11-08): Page 13 push buttons take a click anywhere on the button and log the press before the trip lines (TURBINE TRIP press was missing from Events).
- **beta.131** (2026-11-08): Cold start bed heat-up fitted to the plant cold start trend (339 C at 1.5 h, 523 C at 4 h, 726 C at 6 h on oil; was 141 C at 2 h): cold bed lag 9000 s, start-up exponent 0.168.
- **beta.132** (2026-11-08): Steam per coal from the plant trends (5.31 T/H per T/H, 484 T/H at 89.7 and 302 at 55.4; was 5.78 from two snapshots): coal at 90 MW about 56 T/H (plant 55.4, was 57.4).
- **beta.133** (2026-11-08): Training section TURBINE TRIP AT LOAD AND HOT RESTART from the FHI CFB manual Tab 9 (trip at 150 MW, first outs, fans kept running, drum level, hot restart above 700 C bed with no purge, coal feeders); button Practise: Turbine trip and hot restart.
- **beta.134** (2026-11-08): New starting states Warm restart (FHI Fig 3: drum 40 kg/cm2, bed about 360 C, turbine WARM) and Hot restart (Fig 4: 100 kg/cm2, bed about 700 C, turbine HOT); equipment stopped as in Cold.
- **beta.135** (2026-11-08): TCS initial load hold also waits for the LP exhaust hood below 52 C before load up (PR-OPE-5002 9123).
- **beta.137** (2026-11-08): Page 17 GENERATOR shows the generator electrical values from a generator model (data sheet GAE-2013-0136 R2 and control room snapshot 37): voltage 13.8 kV, frequency, reactive power and power factor 0.977 (33 MVar at 151 MW), stator current 6.5 kA, exciter field 46 VDC / 8.7 A at full load (field follows the internal voltage, data sheet Xd), field breaker = TCS excitation, energy meters counting from the snapshot reading.
- **beta.138** (2026-11-08): Training dock, unit load demand (HIC-ULD) in AUTO: ▼ / ▼▼ / ▲ / ▲▲ now move the TARGET MW as the plant view faceplate does (was "In AUTO: press M first"); the CCS ramps to the new target.
- **beta.141** (2026-11-08): Training list: after a starting state loads, an "auto ✓" of the practice / shutdown / trip sections whose condition is not true in the new plant is removed (an old run left ULD to 90 / hold 90 / MWRL 0.6 ticked at 150 MW). The start-up sections keep their ticks.
- **beta.143** (2026-11-08): Page 13 TURBINE START: MSV / RSV A / B show OPEN / CLOSED (the turbine reset, ATS criteria 1.21), DS and 52L1 show their state as on page 17, the field breaker, field V / A and kV / kA / Hz / MVar / power factor come from the generator model (page 17). Left without a source: vibration, differential expansion, rotor position, thrust bearing, stator coil, generator cooling air.
- **beta.144** (2026-11-08): Turbine and generator bearings from the shaft monitor snapshot (035, 3596 rpm): bearing metal No. 1 to 4 91 / 102 / 80 / 78 C (was assumed 71 / 74 / 68 / 66), thrust bearing front / rear 55 / 62 C, shaft vibration X / Y per bearing (0.016 to 0.063 mm). Page 13 shows the highest turbine vibration and the thrust bearing front / rear.
- **beta.145** (2026-11-08): Training: the practice sections (shutdown, bottle-up, trip and hot restart) tick only while the guide is on that section (the hot restart items ticked themselves at 150 MW); the guide goes back to an earlier step only inside the same stage (near 63 MW the BU-CMD MANUAL of HIC-BM sent "›" back to a start-up step).
- **beta.146** (2026-11-08): Condenser vacuum when the condensate pumps stop with the seawater on: the steam still condenses and only the air ejector stops (its condensers are cooled by the condensate), so the pressure rises by the air in-leakage, 25.5 kg/h in 338 m3 (ejector engineering data ED 066 p2 / p15), about 1.1 mbar per minute (the LOW VACUUM trip came 17 s after a CEP stop before; now about 2.7 h).
- **beta.147** (2026-11-08): Bottle-up step "Fill the drum to +200 mm": the main feedwater valve LICBR1001 goes to MANUAL 0 % first and the fill is on the start-up valve only (in AUTO it kept feeding for 2 min and the drum went to +437 mm); buttons for both valves, feedwater flow on the dock.
- **beta.150** (2026-11-08): Generator temperatures from the shaft monitor snapshot (035, 130 MW): air cooler outlet A to D 39 / 38 / 43 / 44 C, AC exciter outlet air 80 C, stator coil 79 to 84 C; the stator rise goes with the current squared and the exciter air with the field current squared (at 150 MW stator about 95 to 99 C). Page 17 shows all of them, page 13 the hottest stator coil and the mean cooling air.
- **beta.153** (2026-11-08): Save points: in the starting state menu, SAVE the plant now keeps the whole plant (every ABC and DITL sheet, turbine, plant models, modes, Training ticks and step) in this browser under a name; LOAD a save point puts it back and pauses; Delete removes one. A test goes on from the step before a fault instead of from Cold (user testing plan 2026-11-08).
- **beta.154** (2026-11-08): FIX beta.153: the SAVE / LOAD menu code had a line break inside a text and stopped the starting state menu script; fixed. Trend recorder: one row each minute of plant time (MW, steam flow, MSP, MST, RHT, coal, PA, SA, FA, O2, bed, drum level, feedwater, furnace and drum pressure, reheat pressure) since the last starting state; "Download recorder CSV" in the starting state menu, for the comparison with the plant trends on the PC (user testing plan 2026-11-08).
- **beta.155** (2026-11-08): Training: while the step is a HOLD (hold 90 MW, purge 5 min, drum level 30 s ...) and its condition is met, the plant runs x10 by itself (only from a lower speed); the trainee speed comes back when the hold is done, the step moves on or the condition is lost; both logged as events (user testing plan 2026-11-08).
- **beta.158** (2026-11-08): Generator breaker 52G1 / 52L1 on the DITL: DITL-03E rows 2 / 3 (52L1 OPEN FOR HOUSE OPERATION M.3221, 52G1 OPEN M.3220, "FROM STATION WIRING S2") had no source, so pages 13 / 17 kept 52G1 CLOSED after a turbine trip; they now read the station 2 inputs I.0937 / I.0932 (ABC-050) the unit model writes. New GitHub test tests/regress/gcb.js (150 MW and after a trip).
- **beta.159** (2026-11-08): ATS SHUT-DOWN (step 8): the turbine is tripped by the TURBINE SHUTDOWN COMMAND input of IBD TA-9 (row 18), so the first out reads TURBINE SHUTDOWN COMMAND and its TA-9 lamp lights (was MANUAL TRIP); page 13 step 9 stays Y after the shut-down trip until the next TURBINE RESET.
- **beta.160** (2026-11-08): Practise turbine trip and hot restart: the hot restart check reads the logic's purge by-pass permit M.3339 (furnace lower layer > 700 C) and the MFT reset (was the model bed >= 625 C); the step has the FURNACE PURGE START button: with M.3339 = 1 the purge completes at once (DITL-02 out 16) and the MFT resets, so the coal feeders can start. Bottle-up drum fill text: use the LICBR1001 / LICBR1001B faceplates.
- **beta.161** (2026-11-08): Trend recorder: also the water inventory (hotwell level, condensate flow, deaerator level and its valve LCV-CD1104, hotwell make-up valve LCV-MU1110), for the hotwell low on a feedwater surge.
- **beta.162** (2026-11-08): Training: while the guide is in a practice stage, the start-up sections do not tick by themselves (a trip at 150 MW ticked 22.18 / 25.12 / 26.10). Save points: the default name is the load and the time of day; Delete asks for a confirm.
- **beta.163** (2026-11-08): PLANT chip: Warm and Hot restart are starting states beside Cold and 150 MW (were only in the TCS / Field menu), the chip names them; a starting state picked on the chip while the plant runs pauses first (it gave a dead plant). Page 13: the start-up mode of the TCS (AMBIENT COLD, COLD 1, COLD 2, WARM, HOT) at the top.
- **beta.164** (2026-11-08): GitHub simulation run: a load ramp as the operator does it (HIC-MWRL 1.2 MW/min, HIC-ULD 150 -> 90 -> 150 in AUTO, every sheet and the DITL stepping), with the recorder CSV in the log for the PC comparison with the plant trends; the recorder can write a row at once (recNow).
- **beta.166** (2026-11-08): Pages 13 / 17: the disconnect switch DS shows CLOSED and the earth switch OPEN while the plant model runs (field contacts of the I/O list that no sheet reads; snapshot 37: DS closed); a sheet that reads them wins.
- **beta.168** (2026-11-08): HIGH fix: a step of the plant is never longer than 1 s (was up to 3 s at x60 on a slow PC, sched.js and the Web Worker): the PA flow and the furnace pressure loops swung until a TAF / furnace LOW-LOW MFT at a steady 150 MW (Mina beta.156 / 157). Above what the PC can give, the real speed is lower (the speed button shows it). GitHub 40 min hold at 0.5 s steps: steady, no MFT. Page 13 exhaust hood temperature at 150 MW = the condenser saturation of the plant model (was -----).
- **beta.169** (2026-11-08): Training dock after LOAD of a save point: the plant helpers of the guide are made again when the sheets get their new run-time state (MW, MSP and MSF read 0 / frozen for the whole run after a LOAD over a tripped plant).
- **beta.170** (2026-11-08): Reheat at part load: the RH / SH biasing damper reaches only what the drawing lets its PID move it (ABC-020: damper = LN7 of the PID output + LN3 of the unit load, 86.9 % at most at 90 MW, not 100 %), so the reheat with the controller at its end is the plant value (RHT 513 vs plant 521 at 90 MW in the trend compare).
- **beta.173** (2026-11-08): HIGH fix, MFT at 150 MW after x60 on a slow PC (Mina beta.156 / 157): the light mode of a slow PC held the inputs of the far sheets for K steps (up to 6 x 1 s), so the PA flow and furnace pressure loops between sheets ran with a 6 s dead time and swung. The hold is now never longer than 1 s (links.js stepTier). Proof on GitHub (hold test with a 4 MW load bump): light mode 6 x 3 s = furnace pressure -77 ~ +136 mmH2O, PA 0 / 659 T/H, SA 0 by min 14; no light mode with 1 s and 3 s steps = steady 40 min. Beta.168 (1 s step) alone did not cover the light mode. PLANT chip in Worker mode: shows "Unit · Warm restart" / "Unit · Hot restart" after such a load (the restart kind now goes to the page with the other flags; was always "Unit · Cold").
- **beta.175** (2026-11-08): Worker mode had no I/O list, so the rows that the one world links by their field tag stayed unlinked there: page 17 "Generator breaker 52G1 off" (DITL-03H row 18 MIG-52G1-2 = I.0932) stayed N after a trip, and the sootblower starters MOR / MOS by tag. The worker now gets a slim copy of the I/O list (address and tag, 1912 rows, 64 kB). GitHub test of the light mode fix (beta.173): 40 min at 150 MW with the far sheets at 0.5 s x 6 = steady (PA 360 ~ 368, furnace -13 ~ -17), was PA 0 / 659 and SA 0 before.
- **beta.176** (2026-11-08): Header: CONDENSER pressure PT-CD1110 in kg/cm2 abs (about 0.07 at 150 MW, turbine trip at 0.26) in place of VACUUM % that read 100.0 % in every state (Mina beta.170). Seawater pump A trip with no standby start: correct by DITL-29A (the auto start needs the pump in AUTO and REMOTE; at 150 MW SWP-B and C run and A is stopped in MANUAL, 30.PNG).
- **beta.177** (2026-11-08, LISA): Mina's beta.170 findings. (1) Drum level after a turbine trip: the feedwater flow followed its valve with the Ti of FICFW1007 (75 s, PID parameters) as a process lag, so the flow stayed 100 ~ 140 T/H above the steam; a water flow answers its valve in seconds (now at most 5 s, like the air flows). Page check: peak +348 mm about 5 min after the trip, then back to about 0 (was +415 and still rising). No MFT on the drum level HIGH-HIGH within 10 min of a turbine trip is the drawing: DITL-03E TURBINE TRIP / 52G1 OPEN / 52L1 house operation -> PULSE 600 SEC = DRUM LEVEL H.H. BYPASS (out 1), it blocks the 2-out-of-3 HH. (2) Main steam pressure transmitter lost: the drum balance took the compensated steam flow (an instrument reading) as the steam that leaves the drum, so a lost PT-MS1002 made the level RISE. ABC-001C compensates the steam flow with AI0131 (SQRT of F(AI0131) x F(AI0420) x AI0129, no SIG.AB switch), so the 3-element feedwater falls by the drawing; the plant now keeps the real steam (raw flow x the last good factor) while a compensation transmitter is failed: the level FALLS to L.L. and MFT unless the operator takes the feedwater to MANUAL. (3) Seawater fault: it tripped SWP-A, which stands STOPPED at 150 MW (snapshot: B and C run, A REMOTE MANUAL); now SWP-B (machine B of DITL-29A). No auto start of A is the drawing (A is not in AUTO MODE). After SWP-B trips the condenser pressure rises 0.063 -> 0.073 kg/cm2 A (header CONDENSER, beta.176). (4) Dock: a TRIP button asks for a second press within 4 s; equipment names in words in the header and the events (COAL FEEDER A TRIP, PA fan, SA fan, ID fan, FA blower, condensate pump; was DITL-19 / PAF ...); a MAN station MV in its unit (HIC-ULD MW); TCS / Field stays on the Plant view bar while the Training is open (the trainer Faults are there). (5) Page 18 "All blowers on retract position" (DITL-80A row 13 M.4008, from DITL-80L) now follows the lances: Y at 150 MW.
- **beta.178** (2026-11-08): Training hot restart step (practice turbine trip, step 141) ticks: it read M.3339 by address, but M.3339 is only a DITL-02 input row (row 25, station wiring), so the check read nothing (Mina beta.173). Now it reads the row of the drawing, and the by-pass counts if it was on in the last 2 min (the bed falls under 700 C seconds after the reset).
- **beta.179** (2026-11-08, YUNA): Mina beta.175 UI. (1) Page 13 TURBINE START had about 6 px text at Fit beside the dock (1366 x 768): the page has a frame of its own size (1632 x 1512, not the 1920 x 1000 frame with empty sides), opens fitted to the width from the top (drag down for the shut-down, protection and trip first-out band) and its text is 1.35 x larger (the trip first-out list 1.15 x, the long notes as drawn so nothing runs into the next column): the step and check-list text is about 9 px on screen (was about 4). hmi-mock.js frameOf / def.tall / fz / fzAt, plant.js fitW, p13-head.js. (2) Event log and alarm list: full names in every text, the faceplate and dock presses too (induced draft fan, primary air fan, secondary air fan, fluidizing air blower A, boiler feed water pump A, condensate pump A; was IDF / PAF / ID fan / PA fan / BFWP A). The turbine trip chip confirm, the HIC-ULD unit and the TCS / Field menu with the dock open came in beta.177 (LISA).
- **beta.180** (2026-11-08, LISA): Push button faceplates on two Plant view pages (src/ui/plant/hmi-mock-pb.js; the pages are generated, so the clicks are added at run time). SOOTBLOWERS: a click on a blower label (N-1011 ~ N-1042) opens its faceplate (Mina beta.173: it opened the PLANT chip menu): STATUS = "N-10xx SOOTBLOWER OPERATING" of DITL-80A ~ 80F, START = row r "START COMMAND" (M.4011 ...), SKIP = row r + 1 "SKIPPED" (M.4010 ...), read on all 30 rows. A START with the blowing permissive not met (steam supply valve open 600 s, drain temperatures) does nothing, by the drawing. COAL, LIMESTONE AND SAND: the label Sand = SAND SYSTEM faceplate (DITL-771 START M.0800 / STOP M.0802, status SYSTEM ON), the labels XV-SD1802A / B = ISOLATING VALVES faceplate (DITL-776 OPEN M.0870, status ROUTE OK), the order of the drawings (20.PNG). Page check at 150 MW: OPEN -> ROUTE OK, SYSTEM READY; START -> SYSTEM ON, vent filter running. hmi-mock.js: a push button faceplate may name its own status texts (df.on / df.off).
- **beta.181** (2026-11-08, YUNA): Training: a practice section (after the start-up, section index >= the start-up sections) no longer says "Ahead of the procedure" for a machine of another practice: on step 141 (hot restart of the turbine trip practice) the PA fan, running and the start of practice 54, showed as "a later step" (Mina beta.175). A start-up step compares with later start-up steps only, a practice step with later steps of its own section (guide.js early).
- **beta.182** (2026-11-08, LISA): Worker boot in a hidden Browser pane (Mina beta.176: the worker answered 1 to 2.5 min after the boot, At 150 MW did nothing for 2 min). Code reading of eng-page.js / eng-host.js: after the worker says ready, the page hands the plant over only when no starting state is loading, and it waited for that with a 100 ms setTimeout chain; a browser throttles a timer chain of a hidden page (1 s, then one wake-up a minute after 5 min hidden), so the hand-over could wait minutes after the load had ended. It now waits for the end of the load itself (AN._loadP, whose slices go by message). Not run here (no sim runs on this PC): Mina checks the boot with the pane hidden. Other timer chains on the boot path left as they are: the first start waits for the sheets with a 500 ms chain (eng-page.js, before the worker exists).
- **beta.183** (2026-11-08): Practice PA fan trip, step 5 (hot restart) reads the purge by-pass from DITL-02 row 25 as step 141 does (it read M.3339 by address: "—", Mina beta.175).
- **beta.184** (2026-11-08, LISA): PA fan trip practice step 4 (Mina beta.175: after RESET of the relay on the PA fan faceplate, START PA fan did nothing and the status stayed TRIP). The trainer fault holds the motor by two things: the ELECTRIC TROUBLE switches of the drawing (DITL-26A) and the field trip s._ftrip (03b-sim.js motStep keeps the motor stopped while it stands). The faceplate RESET took off one ELECTRIC TROUBLE only. Now a RESET of the protection relay on a motor faceplate also ends the trainer fault of that drawing (WORLD.ftrip, an engine action: page and Worker). Step 5 by-pass row: beta.183; step 1 check text "PA fan stopped". Build and check only; Mina checks the practice live.
- **beta.185** (2026-11-08, YUNA): Faceplates beside the Training dock, never under it (Mina beta.175 PA fan practice, 1366 x 768: "Open faceplate: Primary air fan" opened at x 881 ~ 1209 under the dock). The free area of every pop-out faceplate (motor, valve, controller; from the dock or from the graphic) is the Plant view minus the dock; an equipment under the dock gets its faceplate at the left of the dock; the open ones move back in when the Plant view gets narrower (fp-pop.js area, ResizeObserver). Checked at 1366 x 768 (anchor at x 1000 / 1250: faceplate ends at 920, dock at 926) and 800 x 600. SV pad ✕ (Mina beta.173): closes on a click in this build (the ✕ is the top element at its place, the pad goes away); not reproduced, left for the retest.
- **beta.186** (2026-11-08, GISELLE): the PLANT chip menu also closes on a pointer press anywhere outside it (window, capture phase, the first event of a press), as the Training section list does. Mina beta.175 (800 x 600, Worker, Training dock): a click inside the plant page left it open. On beta.184 in VIEW without the dock a click there did close it (trusted click reached the old listener), so the exact path of Mina's case was not reproduced; the press closes it on any path.
- **beta.187** (2026-11-08, GISELLE): DITL-80S row 17 (S/B STEAM SUPPLY MOTOR VALVE CLOSE COMMAND) reads M.4008 "all blowers on retract position" like 80 / 80A / 80G / 80K / 80O (DITL-80L PDF sheet 15: TO 80-5, 80A-14, 80S-17, 80K-5); it stayed 0 at 150 MW with every lance retracted. Page 18 faceplates are Lisa's beta.180.
- **beta.188** (2026-11-08, YUNA): Design review of the new faceplates, one style. (1) Push button faceplates (fp-pop.js pb): the second button is the STOP of the first only when it says STOP / CLOSE; the SKIP of a sootblower (DITL-80x row r + 1) is its own press, enabled in RUN and no longer lit green as "stopped". (2) COAL, LIMESTONE AND SAND: titles as the other faceplates (tag or short name, full name under it): "XV-SD1802A / B" · Sand isolating valves, "Sand system" · Sand injection system (were ISOLATING VALVES / SAND SYSTEM in capitals). (3) Training dock TRIP press: the button itself says "Press again: TURBINE TRIP (TA-1)" for 5 s, as every other press that cannot be undone (was a 4 s warning line). These faceplates have no Y / N square in their approved mockups (pages 18 and 20), so no permissive faceplate is added: that needs a mockup change.
- **beta.189** (2026-11-08, LISA): Main steam pressure transmitter alarm (Mina beta.173 Faults: PT-MS1002 over range at 150.0 gave no alarm). No ALM block reads AI0131; the drawing alarms it with comparators on ABC-001C (> 134 O.0177, > 130 M.3109, < 100 M.310A, < 72.9 M.310D) into the annunciator DITL-40 (MAIN STEAM PRESSURE H.H. / HIGH / LOW / LOW LOW), and the alarm list has the same set points for PT-MS1002 (HH 134, H 131 / 130, L 100, LL 72.9 kg/cm2). The header and the alarm list now show PIMS1002 HIGH-HIGH / HIGH / LOW / LOW-LOW from the transmitter value with those limits (a cold plant: LOW-LOW standing at the load, suppressed). Signal lost (0) giving MFT: the level falls to L.L. by the 3-element feedwater (beta.177); over range (150): the feedforward rises, the level controller takes it back. Build and check only.
- **beta.190** (2026-11-08, LISA): Boot with the site data cleared in a hidden pane (Mina beta.187: after 219 s no sheets, no Worker, At 150 MW did nothing, no message). The drawings wait for the saved settings of IndexedDB (loader.js loadData: await AN.kv) with no time limit; an open that never answers held them for ever, and the Worker boot waits for the drawings. They now wait 3 s at most; the settings apply when they come. Found by code reading as the one wait on that path with no limit and no message; not proved to be the cause: Mina reads the console (MINA_NEXT "hidden pane boot, site data cleared") if it happens again. Build and check only.
- **beta.191** (2026-11-08, LISA): HIGH, Worker never started on a fresh open of /beta/ with no #a= hash (Mina beta.187 / 189, page visible: AN.sheets 0 for 97 s and 219 s, RUN ran the page engine; opening Logic > ABC loaded the 54 sheets and the Worker answered 9 s later). The ABC sheets loaded only when the ABC page opened (setCat an -> loadData), and the Worker boot (eng-page.js) waited for them. The boot now loads the ABC data itself with the same loader (loader.js loadData, once). A starting state picked before the sheets are in (Home > At 150 MW, the PLANT chip: anLoadStart built nothing, the press did nothing) now waits for the data first, then loads. Build and check only; Mina retests on a fresh open.
- **beta.192** (2026-11-08, GISELLE): alarm list, header and event log: equipment names, not drawing names or short forms (Mina beta.170 Faults 2). Coal feeder A trip already reads COAL FEEDER A (beta.179, RUNNING output). Now also: diesel oil pump (DITL-31), seawater booster pump (DITL-30), industrial water pump (DITL-111), make-up water pump (DITL-112), auxiliary lube oil pump (DITL-22), lube oil pump; sand injection system (DITL-771 / 777, was "O.0608 SYSTEM" / "SYSTEM"), sand silo vent filter (DITL-774), limestone system / rotofeeder / silo vent filter (DITL-LS10 / LS110 / LS214, was "O.024B SYSTEM", "ROTOFEED", "VENT FILTER TRIP OR RUN FAULT"); names from the drawing titles and rows and the I/O list. The sheet reference after "·" drops its "(L10)" / "(D71)" prefix.
- **beta.193** (2026-11-08, LISA): Alarms standing at a steady 150 MW (sweep item 1, findings 11-07 lines 44 / 176 / 1419). Bed temperatures: the limits of TIFG1090A ~ L and TIFG1091A ~ I were not from a source (H 950 / HH 1000 / L 750 / LL 650 and H 960 / HH 1020 / L 800 / LL 700, "basis: same"). The drawing ABC-026 FURNACE TEMPERATURE (1) alarms the bed by comparators into the annunciator DITL-40: HIGH > 950 C (M.3334), H.H. > 980 C (M.3333), LOW < 820 C (M.3335); the alarm list gives no number per thermocouple ("FHI"). Now the averages TIFG1091 / TIFG1090L: H 950, HH 980, L 820; each thermocouple: HH 980, L 820, no HIGH (the 150 MW snapshot has single thermocouples at 951 ~ 960 C with the average at 942 C, so a 950 HIGH per thermocouple stood at load). PIST10012 / 10013 HIGH at 150 MW stays: the alarm list gives H 93.8 / 62.5 (dcs) for PT-ST1001-2 / -3 against 95.9 at load (correct by the list). SIM1311 LOW-LOW stays while the limestone feeder is stopped at 150 MW (sweep item 8). Build and check only.
- **beta.194** (2026-11-08, LISA): Guide step 52 (sweep item 4, Mina F65): "Air to minimum: PA and SA dampers 10 %" lowered the PA and SA flows after light-off and the total air fell under 25 % MCR: MFT, burners out. PR-OPE-5002 has no air reduction after light-off; its 10 % is the secondary staging air nozzle dampers at their limit stop in the FURNACE PURGE line-up ("Dampers of secondary staging air nozzles close to limit stop (10% OPEN)", "Total Air Flow > 25% MCR"). The step is now a confirm step with that source (the step numbers stay): keep the air above the purge minimum; no button lowers the air. Build and check only.
- **beta.195** (2026-11-08, GISELLE): the copy of a drawing for machine B / C / D shows the tag of its own machine: DITL-21A #B rows 19 / 20 / 21 read MIL-L1060B, SS-BH1060-B, LIS4-L1060B (were the -A tags of the drawing, Mina 11-07 sweep 19). Only when the I/O list gives that tag the very address the copy reads (a one-address row such as DITL-112 LS-MU0708-A, demi tank A, keeps its tag). Sweep 18 (ash cooler current -----): NO-SOURCE, no data in the docs for the screw cooler motor current (IT-L1060A ~ D, I/O list STN103 AI0772 / 788 / 804 / 900; hmi-op.js has only the 150 MW snapshot 0.0 A), so the page keeps -----.
- **beta.196** (2026-11-08, GISELLE): Escape closes the event log and the Training speed menu (×1 ▾) (Mina 11-08 #4 / #6). A page change in the Plant view closes an open faceplate, motor / valve pop-out and info card (LICBR1001 opened on the UNIT page stayed over the next pages, Mina 11-08). Sweep 17 (PAUSED after At 150 MW): by design, At 150 MW loads the state and says "Press Run" (home page note, app.js load150); the "starts the simulation (RUN)" titles are the Training buttons, which do run.
- **beta.197** (2026-11-08, LISA): Fan currents and FA blower pressures on the AIR / FLUE GAS page (sweep item 6, Mina item 5 beta.72): FAB-A 37.3 A and PIFA1055A 3257 mmH2O never moved and the PA fan current was 4 ~ 5 A above the engine. The page (hmi2.js) had its own estimates (PAF 253.6 x flow cubed ...) beside the engine model (boiler.js: U.fnPafI / fnSafI / fnIdfI / fnIa / fnIb from air power, U.fnFaP for PT-FA1055-A / B). The page now shows the engine values, its estimate only without them. Build and check only.
- **beta.198** (2026-11-08, GISELLE): Training panel ☰ section list: a first entry "Practise and start" shows the Training start page (Cold start and the Practise buttons) in the panel while a section runs; "Back to the running step" or a section of the list brings the step back (Mina 11-07 / 11-08 sweep 20: the Practise buttons showed only after Stop Training). The loads keep their "Press again".
- **beta.199** (2026-11-08, LISA): Limestone start path (sweep item 8, Mina item 8a: no control could start the limestone feed; the feeder stands stopped at 150 MW, as the snapshot: SIM1311 0.0 %). On COAL, LIMESTONE AND SAND, faceplates in the order of the drawings DITL-LS10 / LS212 / LS110: Limestone = Limestone system (LS10 FILL CYCLE START PB row 3 M.1800 / STOP row 5 M.1801, status FILLING CYCLE ENABLED FLAG M.180F); XV-LM1811A ~ H = isolating valves (LS212 row 10 ISOLATING VALVE A~H OPEN/CLOSE SW M.184C, a maintained HMI switch, OPEN / CLOSE; status ISOLATING VALVE O/C FLAG M.1810); rotary feeder L-1311 (LS110 FEEDER START COMMAND PB row 8 M.1847 / STOP row 9 M.1848; status ROTOFEED START/STOP COMMAND O.024C). The limestone model (boiler.js) answers those commands. A push button faceplate can now set or reset a maintained switch row (WORLD.dset). Build and check only.
- **beta.200** (2026-11-08, LISA): Training dock, a confirm step done in the control room (sweep item 26, Mina beta.152: step 139 "read the first outs" said NEXT · FIELD OPERATOR, "Confirm done in the field"). A step flag cr marks a confirm step of the control room: the card says CONTROL ROOM, "Confirm when done", the button "Done", the stage "Done in the control room". Set on step 139 (turbine trip practise: read the first outs) and step 52 (air stays above the purge minimum). Build and check only.
- **beta.201** (2026-11-08, GISELLE): sweep 16, 26, 31. ESP ON / OFF and the drum blowdown valve (TCS / Field menu) write a FIELD line in the Event log. Training step "Read the first outs" (turbine trip and hot restart) is a CONTROL ROOM item, not FIELD OPERATOR (the sections the app adds can name who does an item, AO / CRO as the SOP tables). BFWP A trip practice, last step: the dock shows the standby card of BFWP A (REMOTE + AUTO MODE SELECTED, as the MWP / SWBP standby) and the relay reset as its field action.
- **beta.202** (2026-11-08): Warm / Hot restart start with the drum at +200 mm, the level of the bottle-up (PR-OPE-5004-01 step 4), not the empty drum of Cold (-296 mm, Mina beta.170). The transmitters are set at the restart drum pressure and the ABC-010 level model starts from that level. GitHub test tests/regress/restart_drum.js: warm 204 mm, hot 204 mm at load and after 2 min.
- **beta.203** (2026-11-08, LISA): Unfired bed cooling by the air (sweep item 25, Mina beta.163: Hot state with every fan stopped, bed 708 -> 652 C in 1.3 min). An unfired bed that cools now has a time constant from FHI Fig 4 HOT STARTUP: no air (banked) 33,750 s (780 -> 700 C in 1 h with the fans stopped), at the purge air about 4,640 s (700 -> 650 C in 0.1 h after the fans start): tau = 33,750 / (1 + 20.9 x air share). Fired bed unchanged (tauB 900 s). With every fan running after a trip the first minutes are about 26 C/min (was about 45). Build and check only.
- **beta.204** (2026-11-08, GISELLE): sweep 2 and 34. Event log at rest (Mina F35, 86 -> 206 lines with one real alarm): a suppressed LOW alarm of a stopped group that comes and goes around its limit wrote a "(suppressed ...)" line and a "back to normal" line at every crossing (the ALM compare has no hysteresis, panel.js almLv; the DCS textbook gives no hysteresis value, so none is added). Now it is written once per point per load, and a suppressed alarm that clears writes nothing. AN.unit.MW read NaN once after a chip load (Mina beta.175): the load begins with the Reset to the script's unit object, which had no MW, so MW was undefined until the starting state set it; the unit object now starts with MW 0.
- **beta.205** (2026-11-08): Update question: Update now says to SAVE a save point first and LOAD it after (sweep 35, save points are the way to keep the plant). Training text of PR-OPE-5002 burner oil flow keeps the procedure words and adds a note: the unit is kg/hr, about 0.6 ~ 3.1 T/H of diesel (sweep 36).
- **beta.206** (2026-11-08, LISA): Dock FAULT buttons of the practices ("FAULT: PA fan trips", "FAULT: BFWP A trips", "FAULT: O2 analyzer A signal lost") ask "Press again" like TURBINE TRIP (Mina beta.189: the fault came at the first press). DITL sheet list (sweep 27, Mina beta.156: "DITL-80" opened the HRH drain pot sheet): two drawings are named DITL-80, (99) HOT REHEAT STEAM SYSTEM HRH DRN POT DP-HR01 and (S3) SOOTBLOWER CONTROL LOGIC DIAGRAM(1); the list now shows each sheet with its title. Build and check only.
- **beta.207** (2026-11-08, GISELLE): sweep 3 (Mina F58: a search result row took two tries, the list opened late). Back in the search box, the rows of the same search show again at once (before, the focus searched again and the list stood empty, "Searching…", under the first click); the first focus of the box loads the lists the search reads, so the first search has its rows at once.
- **beta.208** (2026-11-08, LISA): sweep item 7 (Mina 11-07, FEEDWATER V-FW1011: a real mouse click on the valve symbol did not open its faceplate, a dispatched click did). The bowtie valve symbol is two small triangles that meet at one point in the middle, where the pipe runs, so the middle had almost nothing to hit: every valve symbol of the mockup pages gets a clear box over the whole symbol, on top of the page (hmi-mock.js), and every field valve group (fp-pop.js) a clear box over its outline. A press whose release never reached the drawing no longer leaves an old drag that panned the page on a plain mouse move (plant.js). Build and check only on this PC; the real click needs a live retest.
- **beta.209** (2026-11-09, JENNIE): re-shell layout C, step 1 of 7 (user approved mockup C and the build plan 2026-11-09). New status strip with the 11 major values the user picked (load, main steam pressure / temperature / flow, reheat steam pressure / temperature, drum level, bed temperature, furnace pressure, total coal flow, total air flow), trip, alarms (opens the alarm list with ACK), speed and Operator / Engineer, in the new Leonardo colour set. Only with the link ?shell=c (kept until Old layout); the old app is unchanged without it. Values read the same signals as the Training recorder (LS_LIVE.getV). Build and check only; live test by Mina.
- **beta.210** (2026-11-09, JENNIE): re-shell layout C, step 2 of 7 (only with ?shell=c). Start screen: Operator / Engineer, start state Cold / Warm / Hot / 150 MW (the app's own starting-state buttons), Continue (loads the newest save point), Settings, version. Overview of the unit: 9 system tiles (coal limestone and sand, boiler and drum, steam and turbine, generator, air and flue gas, feedwater, condenser and condensate, cooling and seawater, ash and precipitator) with live values, a 30 min trend line, the running / stopped / tripped count of the page's machines (LS_DOCK.mst, RUN red / STOP green), and an alarm tile; a tile opens its Plant view page, the breadcrumb goes back. New alarm list with Acknowledge / Acknowledge all and an Events tab (the event log). Save point load is one function now (lsSaves) used by the old menu and Continue. Build and check only; live test by Mina.
- **beta.211** (2026-11-09, JENNIE): re-shell step 1 fixes from Mina's live test of beta.209 (?shell=c). The strip values are drawn (the old #gsbar b {display:none} hid them), labels and units 12 px, values 16 px, the 11 cells share the width. Trip pill: turbine trip (ABC-050 I.0400) and MFT (I.000F) first, an equipment trip count only when the unit is not tripped (was the newest equipment trip, SAND INJECTION). Alarm pill and alarm list count the same alarms. Engineer pressed = blue (the old VIEW / RUN colours reached it). Old layout moved from the strip to the start screen (in the strip it reloaded a running plant with no warning). Build and check only; retest by Mina.
- **beta.212** (2026-11-09, LISA): re-shell layout C step 3, only with ?shell=c (src/ui/shellc/shellc-pages.js / .css). System page: the Plant view takes the whole width under the strip; its bar is Plant › page (breadcrumb), Full screen, previous / next page, Fit, LIVE and the last event at the right; the systems list, the page picker, the chips and the Values panel give their place to the overview (the old layout keeps them). Full screen keeps the values strip and has Leave full screen (and Esc). The two faceplates (control, and permissive · trend · monitor) take the C colours and open above, below or beside the equipment at the place that covers the fewest pipe points of the lines that run into it; on a tablet (narrower than 1100 px) they are a panel at the right of the page. Steam and turbine page (MK13): the turbine start panel with speed, generator breaker, target MW and hold, and the buttons Roll to 3600 rpm, Synchronize 4.5 MW, Load up to 45 MW, Target MW, Release hold, Shut down, which press the same buttons of the TCS / Field menu (no copy of the logic). Without ?shell=c nothing changes. Build and check only on this PC; needs the live test.
- **beta.213** (2026-11-09, JENNIE): re-shell layout C, step 5 of 7 (only with ?shell=c). Instructor button in the strip opens the Instructor console: start state Cold / Warm / Hot / 150 MW, the practice sections (the Practise buttons of the Training page), save point Save now / Load / Delete, speed, the field faults (engine/faults.js and the motor trips, on / clear, Clear all faults), Turbine trip (the same command as the Training dock, AN.turbine('trip')), the way to the MFT push button (Purge and trip page), criteria bypass and the recorder CSV. Every press that cannot be undone asks Press again (5 s). The training step card: when the Training panel is folded, a card at the bottom right shows the step, step N of M, its Y / N, Next step (when ready) and All steps / Open (the whole panel); the card never covers the alarm tile. Build and check only; live test by Mina.
- **beta.214** (2026-11-09, JENNIE): re-shell step 2 fixes from Mina's live test of beta.210 (?shell=c). Esc closes the alarm list and the Instructor console (caught before the app's own key handler). Run / Pause in the strip on every screen (it was covered on the overview). The overview lamps wait grey (press Run to read the machines) after a start state or save point until the plant has run (they showed old states). The old No starting state question no longer shows behind the loading bar of a state picked on the start screen. Save point names are asked in the Instructor console, with the list of save points and Load / Delete (two presses), no browser prompt (blocked in the built-in browser); the old menu keeps its own. Version on the start screen, its text 14 px, a plain cover instead of the old Home while it builds. The breadcrumb shows only over a plant page. Event text: "in the alarm list" (was the old header ALARM chip). Build and check only; retest by Mina.
- **beta.215** (2026-11-09, LISA): re-shell layout C step 6, only with ?shell=c (src/ui/shellc/shellc-ui.js / .css). Search: a Search Ctrl K pill first in the strip opens the app's own search box as a panel under the strip (scope All / Analog sheets / Digital sheets); every result row has Open and Why? (the info card of the tag, look only); / and Ctrl+K open it too. Banners: the update question, the start-up error and the engine stop banners stand under the strip in the C colours; the update question is not shown while the plant runs; the error banners have Dismiss (they come back with a new error). The status bar at the bottom is the one message line in the C colours. Settings: the gear at the end of the strip and the Settings link of the start screen open one panel: channel Stable / Beta, Check now, drawing text size 100 / 125 / 150 %, symbols Colour / Engineering, version and build; each presses the app's own control. Tablet and Training dock: the strip keeps 2 rows (values, then the buttons; VIEW | RUN joins the button row) by the width of the band, the page moves down by that height, the first value starts right of the left rail, the overview has 3 tiles a row with the dock open. Build and check only on this PC; needs the live test.
- **beta.216** (2026-11-09, JENNIE): re-shell fixes from Mina's retest of beta.213 (?shell=c). The alarm list has rows for the unit trips: TURBINE TRIP (ABC-050 I.0400) and MASTER FUEL TRIP (MFT, I.000F), at the top with their own Acknowledge, counted by the alarm pill too (they are logic signals, not motor alarms of the alarm table). The top bar takes the height the strip needs (it was fixed at 3.5 rem and the page under it covered the units and the reheat values at 1366). Build and check only; retest by Mina.
- **beta.217** (2026-11-09, JENNIE): TCS: ROLL, SYNC and LOAD UP are refused while the turbine trip is latched (Mina 2026-11-09, re-shell step 3: ROLL was accepted after a turbine trip and said rolling while the speed fell). The message names the trip and says to press TURBINE RESET first (IBD TA-1: a trip stays until TURBINE RESET). Cold, warm and hot starts have no latched trip, so their roll is unchanged. Build and check only; retest by Mina.
- **beta.218** (2026-11-09, JENNIE): re-shell strip (Mina beta.216, HIGH: at 1366 the 11 value cells shrank to 35 px and the numbers printed over each other, because the search, Run / Pause, Instructor, VIEW | RUN and the PLANT chip shared their row). The values have a row of their own at every width (cells at least 88 px, wrapping to a second line only on narrow screens); the buttons are on the row under them; the top bar takes the height of both rows. Build and check only; retest by Mina.
- **beta.219** (2026-11-09, JENNIE): re-shell fixes from Mina's step 5 test and step 2 retest on beta.216 (?shell=c). The Instructor's MFT button opened the Purge and trip page with a page error (it looked for a tile of that page; the breadcrumb follows the page by itself). Esc closes the alarm list and the Instructor console from the window, before any other key handler. The start screen links and texts 14 px (the app's own button rule outranked them). Build and check only; retest by Mina.
- **beta.220** (2026-11-09, JENNIE): re-shell top bar (Mina retest of beta.219, ?shell=c). On the overview the overview's own bar covered the strip's button row (HIGH): the overview, the alarm list, the Instructor console and the breadcrumb now sit under the real bottom of the bar and the strip's rows (--scb). With the Training dock open the strip started under the left rail and its right end went under the dock: the bar keeps clear of the rail and the dock on every width. Build and check only; retest by Mina.
- **beta.221** (2026-11-09, GISELLE): re-shell layout C, step 4 of 7, the Engineer mode (only with ?shell=c and the Engineer button; mockup C screens pc1366-09 and pc1366-17, build plan approved by the user 2026-11-09 "G"). New files src/ui/shellc/shellc-eng.js and shellc-eng.css, 2 include lines in inject.js. A tool rail on the left (Logic side by side, Library, Curves, Loop check, Recent, Sheet tools). Logic side by side: the Plant view page and the logic sheet beside each other, both live from the one plant; the plant page follows the sheet (an analog sheet: the page whose transmitter values and controllers are wires of the sheet, e.g. ABC-010 -> Feedwater, ABC-013 -> Drum and main steam; a digital sheet: the page whose machine is drawn on it). Under the sheet "Why is it X?" = AN.why (why.js) of the selected wire, with Open analog sheet (where the cause comes from), Signal details (the info card) and Force a signal (Run + the Inspector tab with Force to). A bar under the strip: Plant › page › sheet, LOGIC View | Run (presses the app's VIEW / RUN) and PLANT MODEL On | Off (presses the Tools switch); the strip's VIEW | RUN is not shown in the Engineer mode. Library (lsLibrary), Curves (lsFx) and Loop check (LS_LOOP) open in the right-hand pane with the plant page kept on the left (their "close the other page" calls are held while the Engineer mode is on, as the loop check split does). Recent = the sheets and faceplates the app records (ls-recent). Sheet tools = Legend and style, Diagnostics and settings file (in Legend and style), Linear curve tables (AN.lnOpen), Drawing health; Controller tuning is shown greyed: the gain / integral / derivative rows need the test panel (Tools · UAT), not in this build. Operator / Engineer switch keeps the one plant (no reset). Without ?shell=c nothing changes. Checked in the built-in browser at 1024 x 768 with 150 MW loaded; not tested by hand at 1366, on DITL sheets beside the plant, or on a touch tablet (Mina).
- **beta.222** (2026-11-09, JENNIE): re-shell with the Training dock open (Mina retest of beta.220): the strip still started under the left rail, because the rail and the dock are fixed boxes and the check used offsetParent (always empty for them): they are seen by their boxes now, so the bar keeps clear of the rail and the dock. The overview starts right of the rail as drawn (--railW is 14 px with the dock open while the rail stays wide) and sits over the Logic page panels (an ANALOG SHEETS header showed through). Build and check only; retest by Mina.

- **beta.224** (2026-11-09, JENNIE): re-shell overview tiles and alarm tile left aligned as the mockup (the live screenshots of beta.219 / 220 showed them centred: the app's own button rule outranked the tile rule). Build and check only; retest by Mina.
- **beta.225** (2026-11-09, JENNIE): re-shell start screen (Giselle, beta.221): with the app last on a digital sheet, Operator / Engineer with a start state and Continue waited 60 s and loaded nothing (the analog sheets were never read). They put the analog sheets in first, like the Practise buttons of the Home page, with no starting-state question meanwhile. Build and check only; retest by Mina.
- **beta.226** (2026-11-09, LISA): overview tiles of the C layout (Mina step 2 note 11c, shellc-home.js): the trend line starts at its first real sample (the newest at the right end; a first 0 read before the plant values came is dropped), and its scale spans at least 2 % of the value, shown under the line as "scale low – high unit" (87.4 -> 88.6 t/h now reads as the small change it is). Also the line of beta.223 above (its PR merged before the line was added). Build and check only on this PC. Shell audit (Yuna 2026-11-09, MEASURE_STANDARD S1 to S7, Jennie design-auditor pass), shell files only: pill row one height and one centre line, it wraps instead of running under the Training dock (M06, M08), 40 px targets on a tablet and 44 px on a touch screen for the pill row, search results, Settings, page bar, turbine panel and banners (M07, M20, M21, M26); Escape closes the search box and its result list, and a result list left on screen goes (M24, M25); result text wraps (M26); Settings text 12 px and up, spacing 4 / 8 / 12 / 16 (M32); the page bar wraps instead of pushing LIVE past the right edge and the last event line wraps (M17, M18); the tablet faceplate panel starts under the page bar (M23); every shell text 12 px and up, spacing on the 4 px scale, z-index from the ladder of shellc.css.
- **beta.227** (2026-11-09, JENNIE): shell size audit (Yuna rows M01-M05, M07, M09-M15, M27-M31; design-auditor code audit), shellc.css only: the shell is written in px (the app's html font-size made rem text fall to 9-11 px and off the 4 px grid); text 12 px or more, spacing on 4 / 8, tablet targets 40 px, strip labels wrap (no cut), 4 px between label / value / unit, 'no value' dash readable (5.70:1), footer text 12 px with the clock / info colour 5.70:1, rail labels 12 px, start cards inside the tablet screen, overview / Instructor / alarm list end on the real footer top, training card is a bar under the page on a tablet, trip lamp still for reduced motion. No logic, HMI, faceplate content, plant model or engine change.
- **beta.228** (2026-11-09, LISA): shell size audit follow-up, shell files only (shellc-ui.css, shellc-pages.css): every size in px (the html font-size changes with the screen, so rem fell under 12 px and off the 4 px grid): text 12 / 13 / 14 / 16 px, spacing 4 / 8 / 12 / 16 px; z-index from the ladder of shellc.css (search panel and its results --z-menu, banners --z-float, Settings over the start screen --z-cover + 1); the pill and Operator / Engineer sizes and the footer are left to shellc.css; the search pill, the gear and the PLANT chip take the pill height (32 px, 40 px on a tablet or touch screen) for one centre line. Build and check only on this PC.
- **beta.229** (2026-11-09, GISELLE): re-shell shell audit, Engineer mode only (src/ui/shellc/shellc-eng.js / .css; Yuna's measure audit https://claude.ai/artifact/HENZNBGwcNFiLQTS5u2ioD, team-files/reshell/MEASURE_STANDARD.md, Jennie's design-auditor pass). No logic sheet, HMI drawing, faceplate content or plant model changed. M30: the Why box sits above the footer and the tablet training-card bar (bottom = --footH + --sccardh + 8 px). M33: the Loop check cards scroll above its footer (Open the HMI page and Skip no longer under it). M34: Curves in the narrow pane is one column with the table picker, the About card under the table, not over Reset this table. M35: the Library list in the pane uses its own 3-row layout, nothing past the right edge. M36: the zoom bar of the sheet sits 8 px above the Why box. M37: tool rail 136 px at every width, buttons 40 px at tablet width (44 px on a touch screen), names on one or two lines. All Engineer sizes in px (the app's root font is 13.5 to 14.2 px): text 12 / 13 / 14 / 16 px, spacing 4 / 8 / 12 / 16 px, z-index from the shell ladder (--z-float). Measured in the built-in browser at 1366 x 768 and 1024 x 768 (150 MW): smallest text 12 px, smallest target 32 px (PC) / 40 px (tablet), no Engineer box over another; touch screen not tested.
- **beta.230** (2026-11-09, JENNIE): re-shell C: the old dark page rail on the left is gone (user: it is not in mockup C). Its buttons already have a place in the new shell (Overview, Engineer, the Engineer tool rail, Instructor, the strip Settings); the start screen Settings opens the strip Settings. Shell files only.
- **beta.231** (2026-11-09, JENNIE): re-shell C, tablet: the ABC / DITL / TCS buttons of the Engineer tool bar are 40 px (were 27 px), the bar 48 px (shell audit S3, note from Giselle). Shell files only.
- **beta.232** (2026-11-09, GISELLE): re-shell shell audit, Loop check buttons (only with ?shell=c): 40 px high at tablet width (1279 px and less) and 44 px on a touch screen, text 13 px; they were 26 px with 11 px text (MEASURE_STANDARD S1, S3; design-auditor touch 44). An override in shellc-eng.css under body.sc; loopcheck.css is not changed; the FAIL list rows keep their height. Measured in the built-in browser at 1024 x 768: all 10 buttons 40 px (Open the HMI page, Skip, systems, Export CSV, Reset system); touch screen not tested.
- **beta.233** (2026-11-09, JENNIE): re-shell C live check (user: many parts were not re-shelled): with the app on its dark theme the old frame panels stayed dark; under shell C the frame takes the shell colours (tool bar, Library, Loop check, Inspector, zoom bar, loading box, footer); the old start-state question no longer shows over the new start screen. HMI drawings and logic sheets not changed (their look waits for the approved mockup).
- **beta.234** (2026-11-09, JENNIE): re-shell C live check of beta.233: the old start question no longer shows during the 6 ~ 10 s boot (start screen waits up to 60 s for a slow load); the logic zoom bar takes the shell colours (was a dark pill); a faceplate placed near the bottom moves up so the footer no longer hides its last buttons; the Loop check panel chips are light on the dark theme; the footer hint is one line with its full text in a tooltip. Shell files only (src/ui/shellc).
- **beta.235** (2026-11-09, JENNIE): re-shell C: the old dark row of page buttons at the foot of every HMI page (navigation of the old HMI frame, hmi2.js frame(); source found by Yuna) is hidden under shell C, where the page picker and the path do that job; it also covered the last Instructor fault button on a PC (M28). The drawing itself is unchanged. Shell files only.
- **beta.236** (2026-11-09, GISELLE): re-shell Engineer view (Jennie's live check of beta 233, ?shell=c): no second row under the strip any more (it repeated LOGIC View | Run of the strip and took 28 px of the logic). Plant › page is now at the start of the plant page's own bar; the sheet name stays in the Engineer tool bar; VIEW | RUN is the strip's; Plant model OFF | Unit is the PLANT chip menu of the strip (already there, the same switch). In the narrow plant pane the Full screen button of the Operator pages is not shown and the last-event message shortens, so the plant bar stays one row (48 px). shellc-eng.js / .css only. Measured at 1366 x 768 (150 MW): logic area starts right under the tool bar, plant bar one row, zoom bar above the Why box.
- **beta.237** (2026-11-09, LISA): re-shell C live check (beta.233), shell files only. Operator page bar: TCS / Field, Fit, Full screen and the page arrows are the shell pills (32 px, 40 px on a tablet or touch screen); the LIVE · linked / no model chip is not shown in the Plant view of the C layout (an engineer detail). The update question and the error banners are the last row of the top bar, so the pages and the overview start under them (no tile covered). The app message (for example Plant at 150 MW ... Press Run.) is a toast under the top bar that leaves with the message (click hides it), not a box over the alarm tile and the footer. shellc-ui.js no longer writes the padding of the band (shellc.js keeps it clear of the rail and the dock). Build and check only on this PC.
- **beta.238** (2026-11-09, JENNIE): re-shell C, Mina's retest of beta.236: the Run / Pause pill of the strip said Paused while the plant ran on a DITL page; it now reads the same run test as the plant clock (ABC: Run; DITL: Run and not paused), and its press pauses / runs the DITL there. Shell file only (shellc.js).
- **beta.239** (2026-11-09, JENNIE): re-shell C Engineer view at 1366 x 768 (user: logic page looks bad). The unit of each strip value sits beside the value (the strip is 18 px lower); the logic sheet ends above the Why box instead of under it. Shell files only (shellc.css, shellc-eng.css); logic sheets and HMI drawings unchanged.
- **beta.240** (2026-11-09, YUNA): re-shell C content look (user approval 2026-11-09, Jennie: light default with ?shell=c): the HMI pages (all 36 of the picker) and the logic sheets (ABC, DITL, TCS, VIEW and RUN) draw on the shell colours: light paper, dark ink, one grey for process lines, RUN red / STOP green kept, the symbol colours of the Legend kept by hue (darker, 4.5:1 on paper), text halo paper coloured, IBM Plex fonts, thinnest lines lifted. One new file `src/ui/shellc/shellc-content.css` (+1 line in `src/ui/shell/inject.js`), generated from the colour inventory of the live app (team-files/reshell/content-mockup/gen.cjs, inventory-colors.json): every rule maps one colour value of the drawing (the method of theme.css). Colour, font and line width only: no shape, tag, value, logic, plant model or engine change; only with ?shell=c (body.sc); `body.sc-dgdark` keeps the dark drawing (Settings row to come). Checked on a local build: no dark fill, light text or neon colour left on the 36 pages and the sampled sheets (checker proved on the dark look: 12 hits on TCC), style recalculation of the 2264-element 007 page the same with and without the layer (219 / 238 ms).
- **beta.241** (2026-11-09, JENNIE): re-shell C after the user's look at the Engineer view. The plant page takes 42 % of the width left by the tool rail and the open sheet panel, so the logic sheet is not squeezed between them; the old header row (values) and alarm line at the top of an HMI page are hidden in layout C, as the page-button row was (they repeat the strip and its alarm pill; frame, not drawing). Shell files only.
- **beta.242** (2026-11-09, LISA): re-shell C live check (beta.240, Engineer, logic side by side), shell files only (shellc-ui.js / .css): the small overview map of the sheet no longer covers the drawing: it is hidden until the new Map button of the zoom bar shows it (it shows when the sheet is zoomed in), in the shell colours. The mode label of the sheet (VIEW / TRACE - NO SIMULATION, SIMULATION - RUNNING / PAUSED) is in the shell colours, RUNNING red. Build and check only on this PC.
- **beta.243** (2026-11-09, YUNA): re-shell C content look, part 2 (Jennie, user approval of the light look): the Faceplate panel at the right of the Engineer view (#opp: controller cards LICBR1001 / FICFW1007 …, the manual control box, faceplate tabs) on the shell colours: light cards and boxes, dark ink, the PV / SV / MV bar colours and the A / M / R mode colours kept by hue. Colour only, appended to `src/ui/shellc/shellc-content.css` (generated by team-files/reshell/content-mockup/remap.cjs from the colour declarations of src/ui/hmi/hmi.css and the body.app2 panel rules of src/ui/shell/app.css); no layout, size or faceplate logic change; ?shell=c only, body.sc-dgdark keeps the dark panel.
- **beta.244** (2026-11-09, JENNIE): re-shell C, shell files only. One light confirmation dialog (new shellc-ask.js: the question, what happens, Cancel first and the verb on the button) before a press that replaces or changes the running plant: start state Cold / Warm / Hot / 150 MW, practice sections, save point Load / Delete, faults, Turbine trip / reset, Plant model OFF, DITL Reset, F(X) table resets; the Instructor 'press twice' becomes this dialog. Faceplate START / STOP / OPEN / CLOSE keep their own question. The PLANT chip menu is light (was the last dark box of the live dark scan). The new layout no longer gives up after 30 to 60 s when the first window is narrow or slow (the old dark app stayed). The plant page of the Engineer view fits again when its pane changes width.
- **beta.245** (2026-11-09, JENNIE): re-shell C, Mina's live test of beta.244, shell files only. Esc closes the confirmation dialog (it listens first on the window while open); the verb button of a dangerous press is red (its class no longer collides with the old app's blue button.go); the ABC / plant page Reset asks first too; a window narrower than 900 px shows a light note to widen it instead of an empty grey page.
- **beta.246** (2026-11-09, YUNA): re-shell C redesign slice 1 of 5, the two bars (user approved the direction "two bars, one Details column", "Gawin na"; audit and mockup artifact DMAqPXBECUGeEShYRB2QX8, team-files/reshell/uxaudit/). Shell files only (new shellc-bars.js / shellc-bars.css, two lines of shellc.js, inject.js). The header is a values bar (11 values, one row, 60 px) and a context bar (48 px): Operator | Engineer on the left; Operator: Plant › page, TCS / Field, Fit, Full screen (icon), ‹ › (the Plant view's own page bar, placed there); Engineer: Logic, Library, Curves, Loop check and More ▾ (Recent, Sheet tools) as tabs (the tool rail is gone); right: trip, alarms, Run with its speed (×1), Instructor, VIEW | RUN, PLANT, Search (icon), Settings. Engineer: the sheet tool bar is the header of the sheet pane and the plant page bar the header of the plant pane, on one 40 px row; I/O list and F(X) of the sheet bar are the Library and Curves tabs. Header 1366: Operator 156 → 110 px, Engineer 197 → 150 px (with the pane headers). When the status grows (turbine trip, many alarms) and the page tools do not fit, they go back to their own row on the page (never cut). Tablet (under 1280 px) keeps its two value rows until slice 4. No logic, HMI drawing, plant model, faceplate or engine change.
- **beta.247** (2026-11-09, YUNA): re-shell C redesign slice 2 of 5, the Details column (user approval "Gawin na", artifact DMAqPXBECUGeEShYRB2QX8). Shell files only (new shellc-details.js / shellc-details.css, shellc-bars.js, inject.js). One 320 px column at the right with tabs: Engineer Why / Inspector / Faceplate / Training / Alarms, Operator Training / Alarms; the Details button of the context bar (icon) opens and closes it, its ✕ too. The Why box no longer floats over the sheet (it is the Why tab); the sheet's own Inspector (#anp), Faceplate (#opp) and DITL panel (#dp) fill the Inspector / Faceplate tabs (pressed with their own buttons; Force a signal goes to the Inspector); the training step card is the Training tab (the full Training panel still opens with All steps, and the column steps aside while it is open); Alarms shows the last event and the standing alarms with a link to the alarm list. The vertical Panel tab, the panel's own Hide ✕ and Auto-hide and the Inspector / Panel buttons of the sheet bar give their place to the column. PC: the page and the sheet give the column its width; tablet: closed at start, it comes over the page. Also (slice 1 bug found at 1024): the Engineer tabs went over the status pills on a narrow bar; they now take less padding and then go into one menu named after the open tool ("Logic ▾"). No logic, HMI drawing, plant model, faceplate or engine change.
- **beta.249** (2026-11-09, JENNIE): re-shell C one compact density (user "Nalalakihan ako s mga cards at fonts. Pwede bang minimalistic, simple, organized and clean?"). New shellc-dense.css, loaded last; shell CSS only. Type scale 11 / 12 / 13 / 14 px, IBM Plex Sans and Mono only. Values bar 60 -> 48 px (names may take two lines, values line up at the bottom), context bar 48 -> 38 px with 28 px controls (touch keeps 36 px), overview tiles about 196 -> 116 px (flat 1 px border, 4 px radius, short trend line), Details column 320 -> 288 px with 12 px text and tight rows, smaller start screen cards and dialog buttons; the search / settings / Details icons were squeezed by padding and now show whole. No logic, HMI drawing, plant model, faceplate or engine change.
- **beta.248** (2026-11-09, YUNA): re-shell C redesign slice 3 of 5, one control per task and the readable page size (user approval "Gawin na", artifact DMAqPXBECUGeEShYRB2QX8; PLAN.md step 5). Shell files only (new shellc-zoom.js / shellc-zoom.css, shellc-details.js, inject.js). A plant page (Operator) opens at a readable size: the drawing text about 12 px on screen (all 36 pages 12.1 to 13.8 px at 1366), from the top left of the drawing; Fit in the bar shows the whole page, and a "Readable size" button at the lower right brings the readable size back. A small locator at the lower right shows the part in view: click or drag in it to move (the view stays inside the page). The zoom and the move are the page's own wheel zoom and drag (plant.js not changed). Duplicates: Pause and the speed list of the page bar and the sheet header repeat the Run pill and its ×1 of the context bar, so they are out of sight (the pill still presses them; Reset and the step buttons stay); the sheet-list switch no longer shows in the Operator mode. Also: the Training tab now says "A training is running" with "Open the Training panel" when a training runs with no step card (it said the panel was open), and the column steps aside for the open Training panel again (a fixed panel has no offsetParent). No logic, HMI drawing, plant model, faceplate or engine change.
- **beta.250** (2026-11-09, YUNA): re-shell C redesign slice 4 of 5, tablet (user approval "Gawin na", artifact DMAqPXBECUGeEShYRB2QX8). Shell files only (shellc-bars.js / shellc-bars.css). Under 1280 px wide (or a touch screen under 1366): the values bar shows 8 values and a "More" with the other 3 (furnace pressure, total coal flow, total air flow; still live); the context bar keeps Operator | Engineer, trip, alarms, Run ×1, View | Run and PLANT, and its More ▾ holds Instructor, Details, Search and Settings (named in the menu). Heights and text follow the compact density of beta.249 (28 px with a mouse, 36 px on a touch screen). Also: the ‹ › and Full screen icons of the page bar printed their text over the icon since the density (12 px forced on every page bar button); their text is out of sight again. Nothing cut at 1024; at 1366 the header is 87 px and all 36 pages keep their page tools in the bar.
- **beta.251** (2026-11-09, YUNA): re-shell C redesign slice 5 of 5, the dark ring on the DITL sheets (UX audit top 10 item 6; my bug of beta.240). The page links at the edge of a DITL sheet ("56-62"), the value labels (text.bd) and black-stroked text had a dark grey halo (#4d5b6a): the content generator (team-files/reshell/content-mockup/gen.cjs) gave a text stroke the ink colour. A text stroke is its halo, so it is paper now (#f7f8f8): 4 rules of shellc-content.css change, nothing else (CSS only, colour only).
- **beta.252** (2026-11-09, YUNA): re-shell C, the Details button of the context bar printed "Detai" over its icon since the compact density of beta.249 (its 12 px text rule had the same weight and came later); the icon-only rule weighs more now. CSS only.
- **beta.254** (2026-11-09, JENNIE): layout C is the DEFAULT layout (user "Gawin na": build the redesign, then make it the default; all 5 slices merged in 246 ~ 253). The app opens in C without ?shell=c. ?shell=old or "Old layout" on the start screen keeps the old layout (stored), ?shell=c brings C back. Shell files only (shellc-ask.js decides first, shellc.js and shellc-home.js store "old" instead of removing the key). No logic, HMI drawing, plant model, faceplate or engine change.
- **beta.253** (2026-11-09, YUNA): re-shell C, readable page size (slice 3) after a refit. Live Beta 250: the page fitted itself again at the end of the plant load (about 20 s) and stayed small (text 6 px), because the readable size was set only in the first 3 s after a page opened. Now a page that opens stays at the readable size each time it draws or fits itself again, until the operator zooms, drags or presses Fit (real presses only); 3 presses in a row that do not make it readable stop it. Checked: page from the overview tile and from the picker 12.4 px; a real Fit press stays at Fit. shellc-zoom.js only.
- **beta.255** (2026-11-09, YUNA): re-shell C, the plant page of the Engineer view (Jennie's finding on the beta.247 picture: the page filled a third of the left pane, white space around it). In the Engineer the plant page now fills the height of its pane (or the readable size if that is less), from the top left, with the locator for the rest; its Fit still shows the whole page. Checked at 1366: the Feedwater page fills 1.01 of the pane height; the Fit of sheet ABC-010 draws at 465 to 1065 px, inside the sheet area that ends where the Details column starts (1078 px), so the column hides nothing. shellc-zoom.js only, no new size.
- **beta.257** (2026-11-09, JENNIE): re-shell C top-bar values line up (Mina beta.254: values at y 22 under a one-line name, y 27 under a two-line name, two-line names cut 3 px). shellc-dense.css only: each value cell is a fixed 25 px name row (name at its bottom) plus the value row, so all 11 values sit on one line and no name is cut. Shell CSS only.
- **beta.256** (2026-11-09, YUNA): re-shell C, Jennie's findings on the b250 / b255 pictures. (1) The Search, Details and Settings buttons of the context bar showed as empty circles: since the compact density the button's flex box squeezed their 16 px icons to 6, 1 and 6 px wide; the icons keep 16 px, and Details "on" is a light steel fill with a steel border and icon (it was solid steel). (2) Nothing floats over the drawing: the app message ("Plant at 150 MW: … Press Run.") showed as a toast under the bars; it is the message of the status line at the foot (as in the old layout, full text in its tooltip) and the toast copy is out of sight. (3) The overview no longer shows the page tools (TCS / Field, Fit, ‹ ›) of the page behind it. The Readable size button is on the 249 scale (12 px, 28 px). Shell CSS and one line of shellc.js (the tooltip).
- **beta.258** (2026-11-09, YUNA): re-shell C, Mina's live test of 254 (team-files/findings-2026-11-09-reshell.md). (1) The readable page size fell back to Fit when the Details column closed or opened after a press of "Readable size": that press keeps the readable size through refits, and a click on a valve or pump no longer counts as a drag (only a real drag, a wheel zoom or Fit stop it). (2) 1024 More menu: Details, Search and Settings are full-width rows with icon and name again (they were 28 px boxes with the names beside them, the gear outside the menu). (3) "Running" and "×1" overlapped 3 px: they share one border now. (4) Search result Open / card Show seemed not to open a DITL sheet: the sheet opened behind the Training's "Step N is a field step" cover (dock.js lsfield), which only the old sheet list (hidden in layout C) took away; a sheet opened in layout C takes the cover away the same way. The icons Mina measured on 254 (gear 6 px, Details 1 px, Search 6 px) were fixed in 256 (16 px, checked live). Shell only (shellc-bars.js / .css, shellc-zoom.js).
