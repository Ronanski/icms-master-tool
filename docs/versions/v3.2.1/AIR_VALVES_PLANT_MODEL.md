# Plant model — Instrument air → pneumatic valves (3.2.1-beta.6)

IRENE : PLANT MODEL, 2026-11-04 PHT. Code: `src/analog/engine/unit.js` (`AN_AV`, `anAv`, `anAvSv`), `src/digital/parts/03b-sim.js` (solenoid valve stroke), `plant.js` (loop model), `boiler.js` (diesel oil). Test: `tests/regress/air_valves.js`.

## Source

- **K1AU3-E2-0-123 R1 "Drawing of Control valve"** (FHI as-built, sa PC ng user: `document-references/instrument-engineer-data-asbuilt/`, 243 pahina, 45 item). Bawat valve ay may specification sheet: Actuator (Action, Air Pressure Available / Required, Spring Precompression, Pressure @ Full Valve Travel) at Accessories (Airlock, Solenoid Valve).
- Ang pahina ng PDF = pahina ng index + 4 (hal. item 14 LCV-CD1104 = index p70 = PDF p74).
- Ang I/O list at instrument list (`over-all-instrument-list.xlsx` sheet CV / XV) ay walang fail action; ang datasheet lang ang mayroon.

## Ano ang nangyayari kapag nawala ang hangin

1. **Modulating valve na may airlock (hawak ang puwesto).** Kapag ang unit header (PT-IA1706, `U.iaPU`) ay bumaba sa ilalim ng **3.5 kg/cm2**, hindi na gumagalaw ang valve. Gumagalaw pa rin ang MV sa DCS (tumataas o bumababa ang PID), pero hindi ang valve.
   - Ang "Air fail fixed at 3.5 kg/cm2g" ay nakasulat sa Siemens sheets: LCV-MU1110, FCV-CD1120, LCV-HD1101 ~ 1103, at PCV-MS1001 (Fisher 167DA).
   - Ang Copes sheets ay may airlock RK 2-8 kg/cm2G (adjustable range) pero walang set point. Ganoon din ang SMC IL-201 lock-up ng TCV-FW1110-1 / -2. Para sa mga ito, 3.5 din ang ginamit: **NO-SOURCE ang set point**, pareho ang airlock model.
   - Ang LCV-CD1104 at FCV-FW1130-1 ay double acting piston na "Fail in Place".
   - Mga controller na hawak: LICCD1110A, FICCD1120, LICCD1104, LICCD1110B, FICCD1121, PICCD1104, PICAS1005, PICMS1002, PICSB1052, TICBR1130, TICBR1150, FICFW1007, LICBR1001B, LICHD11011 ~ 11062 (10), TICLO1002, PICDO0005, PICDO1008, HICDO1012.
   - Kapag bumalik ang hangin (3.5 pataas), sinusundan ulit ng valve ang MV. Walang bump protection sa model.
2. **On/off valve (XV, solenoid na nagve-vent, walang airlock): papunta sa SPRING position.**
   - "Spring Opening (Direct)" = bukas kapag walang hangin.
   - "Spring Closing (Reverse)" = sarado kapag walang hangin.
   - Ang actuator ay pinapakain ng filter regulator SMC AW40 na naka-set sa 3.5 kg/cm2g ("Air Pressure Available"). Ang layo ng valve mula sa spring position ay (presyon − spring precompression) / (presyon sa full travel − precompression), mula sa dalawang presyon ng bawat sheet (bar g; ang psig ng Siemens sheets × 0.0689).
   - Kaya bumibitin sa gitna ang valve kapag nasa pagitan ng dalawang presyon ang hangin.
   - Mga valve at ang kanilang datos (spring position, precompression, full travel, sa bar):
     - XV-MS1011: bukas, 1.59 / 2.62
     - XV-MS1023: bukas, 0.6 / 1.1
     - XV-CR1011 / 1012: bukas, 0.4 / 2.1
     - XV-HR1021 / 1022: bukas, 2.0 / 3.1
     - XV-SB1054 / 1059: sarado, 2.2 / 3.0
     - XV-CD1005: bukas, 0.28 / 0.90
     - XV-CD1006: bukas, 0.28 / 1.10
     - XV-CD1104-2: bukas, 0.62 / 1.45
     - XV-CD1004: bukas, 0.28 / 1.93
     - XV-MU1109: bukas, 1.0 / 1.9
     - XV-FS1005: bukas, 0.6 / 1.7
   - Ang XV-FW1111-1 at XV-FW1121-1 ay may airlock (SMC VSA 3-way), kaya **hawak ang puwesto** (3.5, NO-SOURCE set point).
   - **Tugma ang drawing:** sa DITL netlist, naka-invert ang coil (energized = sarado) eksakto sa mga spring opening valve (DITL-57, 62, 63, 72, 73, 74, 78, 80, 81, 88, 89), at hindi naka-invert sa mga spring closing (DITL-32, 33, 80R).
3. **Wala sa package** (walang sheet, kaya sinusundan pa rin ang command): PCV-MS1020 / PCV-HR1010 (bypass), TCV-FW1060 / FW1150, PCV-AS1010, TCV-CD1115 / 1124 / 1126, XV-FW1151, XV-HR1010-1, XV-CR1013, at ang mga air damper. Ang mga ito ay "hindi mabasa ang drawing: walang sheet sa K1AU3-E2-0-123".

## Naitama (bug)

- **XV-MU1109.** Dati ay sinasabi ng faceplate at ng Training na "walang hangin = hindi mabubuksan, gamitin ang V-MU1033". Mali ito ayon sa sheet (item 39: Spring Opening (Direct), solenoid "De-energize to vent actuator"): **kapag walang hangin, BUKAS ang valve at hindi maisasara.**
  - Ngayon, ang punuan ng expansion tank ay sumusunod sa tunay na posisyon ng valve (DITL-78 machine), hindi lang sa command.
  - Binago ang text ng faceplate at ng Training step 7. Ang step ay natatapos kahit bukas ang XV kapag walang hangin, basta sarado ang bypass.

## Resulta (cloud, headless)

- `air_valves.js` ALL PASS:
  - Simula sa 150 MW, isinara ang V-IA1101 at bumaba ang PT-IA1706 sa 0.1.
  - XV-MU1109 bukas 100 %, XV-SB1054 sarado.
  - LCV-HD1106-1 hawak sa 53.1 % at LCV-CD1104 sa 17.3 % kahit MV 0 %; hindi tumaas ang HP heater level.
  - Bumalik ang hangin: sarado ulit ang XV-MU1109, sinunod ng drain ang MV 0, at tumaas ang level sa 226 mm.

## Hindi pa nagawa

- Bump (biglang galaw) kapag bumalik ang hangin, at ang pagbaba ng presyon sa bawat valve habang ginagamit.
- Live test: hindi pa.

## Mga damper (binasa 2026-11-04 8:20 PM PHT)

- **K1AU3-E2-0-142 RA "Drawing of control damper"** (sa PC, 23 pahina, scanned): Value Valves XZ-FEA738, 12" butterfly, 44 pcs, **AUMA SA07.6 / AC01.2 ELECTRIC actuator** (460 V 3 ph, 4-20 mA control at feedback, limit at torque switch). Walang tag sa drawing; ang 44 ay tugma sa 2 unit × 22 secondary air wall dampers MCV-FA1005 ~ (instrument list, sheet SECONDARY AIR FAN, PD-053, "CONTROL DAMPER MOV"). **Hindi gumagamit ng hangin ang actuator**, kaya tama na sinusundan nila ang command kapag nawala ang instrument air: (b) tama, may ebidensya.
- Ganoon din ang iba pang "MOV" na damper sa instrument list: MCV-FA1053-1 (PAF inlet), MCV-FA1054-1 (SAF inlet), MCV-FA1043-A ~ D (burner hot SA inlet): electric.
- **ID fan damper PCD-FG1056-1 (2026-11-12, SOHEE, beta.124):** nakita ang source sa `o&m-package-phase-1/L16 FANS/LMYP-1 Fan Instruction Manual`, 4.1 "Pneumatic Actuator Data Sheet For I.D.Fan" (RF2-0582-DOC-3, STI CMV datasheet 133486SC01 rev 1): DOUBLE ACTING (line 18), air lock (lock up + 2 x 3 way valves) set 2.5 kg/cm2 (line 58), **air failure mode IN PLACE** (line 29), filter regulator set 4, supply 4 / 6; ang Fan Specification Sheet 4 of 5, 3.3.1: FAILURE = LOCK POSITION. Kaya nasa `AN_AV.hold` na ang PICFG108A, na may sariling lock 2.5 (`AN_AV.lk`): (a) bug, naayos. UNUSUAL: sa spec sheet ang "DRIVEN METHOD" ay ELECTRIC, pero ang actuator data sheet at ang I/O list ay PNEUMATIC; pareho ang sinasabi ng dalawa sa failure (lock / in place). Sa 150 MW, hydraulic coupling ang kumokontrol at 100 % ang damper ayon sa logic, kaya hindi nasubok ang paggalaw nito nang walang hangin.
- **Flue gas biasing dampers TCV-FG1116-A ~ D / TCV-FG1117-A ~ D:** binasa ang `L16 FANS/L14-7 Biasing damper/Biasing Damper O & M Manual-LMYP-1` (Promax, 208 pahina): Festo DAPS quarter turn actuator + Siemens SIPART PS2 positioner, pero ang manual ay sumasaklaw sa DAPS..R (double acting) AT DAPS..RS (spring return) at hindi sinasabi kung alin ang sa planta, walang fail position at walang laki ng buffer tank (PT-IA1064-A / B). Wala rin sa PD-051 (walang FO / FC / FL sa simbolo) at sa FHI manual. (c) hindi mabasa ang drawing: sinusundan pa rin nila ang command (NO-SOURCE).
  - **Muling hanap (2026-11-13, SOHEE):** (1) over-all-instrument-list.xlsx sheet CV rows 39 ~ 46: TCV-FG1116-A ~ D / TCV-FG1117-A ~ D = MODULATING, AO 4~20 mA, PD-051, 889 mmAq, 427 C, walang fail column; sheet PT rows 52 / 53 at PG rows 91 / 92: PT-IA1064-A / B "#1 AIR BUFFER TANK OF BIASING DAMPER A / B", 0 ~ 10 kg/cm2, PD-023 sheet 6/6. (2) Ang PD-023 sheet 6/6 na nasa PC ay Rev A (flow-diagram zip RA page 28, 2013-08-13): IA manifolds "(later)" lang, walang buffer tank; ang RB set ay walang PD-023. Kaya ang sheet na may buffer tank ay mas bagong revision na wala sa PC. (3) Biasing Damper O & M Manual (Promax, 208 pahina): pdftotext ng buong manual, walang order code ng actuator na ginamit (DAPS-...-R double acting o DAPS-...-RS spring return), walang fail position; ang pahina 28 ~ 30 ay insulation sketch. (4) K1AU3-E2-0-123 Drawing of Control valve: walang FG1116 / FG1117. Ang buffer tank ay tanda na ang disenyo ay may hangin pa ang actuator sa ilang sandali kapag nawala ang IA header, pero walang laki ng tank at walang fail position: (c) pa rin, NO-SOURCE; walang binago sa model.
