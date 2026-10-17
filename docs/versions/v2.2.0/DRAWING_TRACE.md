# 2.2.0 — Trace bago ang engine change (PROJECT_RULES 5c)

## beta.1 — Coal feeder A / B / C (ABC-004A / B / C): ang MV ng feeder ay % ng 0 ~ 40 T/H

- **Saklaw:** ABC-004A, ABC-004B, ABC-004C lang (unit conversion sa hangganan ng signal, gaya ng ABC-009A / B mill speed at ng ABC-001C boiler master). Walang gate, selector o link na binabago. Ang MAN station sa ibang sheet ay hindi ginagalaw.
- **Drawing (ABC-004A):**
  - MAN FICCL1061A "COAL FEEDER A FLOW CONTROL 0.0 ~ 40.0 T/H" (S1-MDL011). AUTO-MV (A leg) = SI0111 = SI0116 = FIC-CF.MV + SI0110 (A-BIAS sa LN23, "-20% ~ 20%").
  - FICCL1061A.MV ay pumupunta sa: AO0231 (INVERTER ng feeder, %), H/ "≥ 83.3 %" (M.014F), "FICCL1061A MV HIGH LIMIT SETTING VALUE 100 % / 83.3 %", at sa SI0113 (gated ng C/F A RUNNING).
  - PID FIC-CF "COAL FLOW CONTROL 0.0 ~ 100.0 %": PV = SI0143 = 1/3 × (SI0113 + SI0123 + SI0133) = average ng 3 feeder MV (%). SV = FIC-CM.MV (coal master, %).
  - FIC-CF BU-CMD: RB-MV = SI0145 = FICCL1061x.MV − bias (T/H, kapag naka-MANUAL ang feeder: bumpless).
  - Run-back ng feeder (RB-MV, SI0112 = RATE "1T / Sec" ng SI0117 = 4T / 8T o MV): T/H. Hindi binabago.
- **Snapshot (11.png):** MICL1061A / B / C PV 29.0 / 29.1 / 28.9 T/H, SV 29.1 T/H, MV 72.8 % (= 29.1 / 40), BIAS 0.0. COAL MASTER CONTROL (FIC-CM) R: PV 87.0 T/H, SV 87.4, MV 73.0 %.
- **Mali sa engine (2.1.0):** ang simulator ay nagdadala ng engineering unit, kaya ang MAN output ay T/H (29.1). Ang PV ng FIC-CF ay naging T/H (≤ 40) habang ang SV ay % (73.0): hindi kailanman nagtatagpo. FIC-CF MV → 100 %, lahat ng feeder → 40 T/H (max). Ang M.014F ay 83.3 T/H (hindi aabot kailanman).
- **Pagbabago (sa hangganan lang, T/H sa loob ng station):**
  - AUTO-MV (%) → T/H: × 0.4 sa A leg ng SV switch ng MAN FICCL1061x.
  - SI0110 / SI0120 / SI0130 (bias, T/H) → % (× 2.5) bago idagdag sa FIC-CF.MV (%).
  - FICCL1061x.MV (T/H) → % (× 2.5) sa: SI0113 / SI0123 / SI0133 (PV ng FIC-CF), at sa DEV / SW ng bumpless return sa AUTO (AO0231 / AO0356 / AO0800 laban sa SI0116 / SI0126 / SI0136, "< 1 %").
  - H/ "≥ 83.3 %" → 33.32 T/H.
  - FIC-CF RB-MV SI0145 (T/H) → % (× 2.5).
- **HMI mapping (11.png) na mali:** ang "TOTAL COAL FLOW CORRECT." (R, PV 81.2 T/H, SV 81.2 T/H, MV 33.1 %) ay ang **HS-COAL** ("TOTAL COAL FLOW CORRECTION CONTROL 0.0 ~ 120.0 T/H", S1-MDL051), hindi ang FIC-CF. Patunay: MV 33.1 % → LN3 "CORR. 80 ~ 120 %" = 0.932; 87.0 T/H × 0.932 = 81.1 T/H (calorie-corrected total coal flow); COAL-CALOR BASE 4450 × 0.932 = 4148 ≈ "COAL CALORIE CORR. 4150 Kcal/Kg" sa screen. Ang FIC-CF ay wala sa screen; ang operating point nito ay mula sa drawing: PV = average feeder MV 72.8 %, MV = 72.8 % (AUTO-MV ng feeder, bias 0), SV = FIC-CM.MV 73.0 %, REMOTE.
- **Patunay na kailangan:** sa Start at 150 MW, feeder SV 29.1 T/H / MV 72.8 %, FIC-CF PV ≈ SV ≈ 73, HS-COAL PV 81.2; regression (hmi_op, reset, isolated, scenarios ABC-004A).

## beta.3 — DITL sa 150 MW (Yugto 1 at 2) at ang mga transient ng ABC load

### A. DITL 150 MW state (`src/world/ditl150.js`, bago)
- **Problema (sinubok, 2.2.0-beta.2):** Start at 150 MW + ABC+DITL ON: 50 / 110 DITL → ABC signal ang mali. Ang DITL ay cold start: MFT naka-trip (03A-63 = 1), IDF / PAF / SAF / FAB / BFWP / coal feeders STOPPED.
- **Paraan (walang binagong logic ng drawing):**
  1. Input rows na galing sa field / CRT / local panel (hindi galing sa ibang sheet): estado ng planta. Kagamitan ayon sa snapshot (`EQ`, hal. BFWP-A tumatakbo R M, BFWP-B standby R A, FAB-B standby, SWP-A nakahinto, oil burners out of service). Valve ayon sa snapshot (`VALVES`, hal. coal feeder discharge valve bukas, oil valves sarado, SH / RH spray SOV bukas, drains sarado, HP / LP bypass sarado). Ang bit na nasa `AN_HMI_DI` (hal. I.0418 ICV → CV transfer complete) ay ginagamit muna. REMOTE = 1; TRIP / FAULT / ALARM / H.H. / L.L. = 0; push button = 0; N.C. button = 1. AUTO / MANUAL: kapag may ebidensya lang sa snapshot.
  2. Analog input ng DITL comparator: value ng snapshot (`ANALOG`, hal. condenser 0.057 kg/cm2A, HP / LP bypass 1.1 / 1.3 %, extraction MOV ~100 %), hiwalay sa value ng user (`s.av150`, hindi sine-save).
  3. Latch (FF), motor model, MOV, selector switch: inilalagay sa estado ng planta na tumatakbo (ang start ay nangyari bago ang snapshot). Isa-isa, at itinatago lang kapag mas maraming output ng sheet ang tumugma sa inaasahan: ang text ng output row, at ang DITL output na binabasa ng ABC (value ng 150 MW load ng ABC). Kasama ang valve / motor na sumusunod sa command at ang output na bumabalik bilang input ng parehong sheet (DITL-32 OPEN COMMAND → row 21).
  4. Pinipindot ang RESET push buttons ng CRT (operator acknowledge).
- **Reset / Simulate:** Reset = cold DITL. Ang Simulate ng DITL page ay bumabalik sa 150 MW kapag galing sa Start at 150 MW. Kapag naka-OFF ang ABC+DITL, ang DITL lang ang nasa 150 MW (hindi ginagalaw ang ABC).

### B. Bug ng DITL reader / world na nakita at naayos (na-check sa PDF)
- **DITL-20 (coal feeder A outlet discharge valve):** ang solenoid SV-CL1061-A ay pinapagana ng output ng FF (S = OPEN P.B., R = MFT / CLOSE P.B. / OUTLET TEMP. HIGH) sa contact 0.0242 sa loob ng field box XV-CL1061-A. Ang reader ay kumuha ng wire ng R (OR), kaya bubukas ang valve kapag may MFT at sarado sa normal. Ayos: ang wire na pumapasok sa field box ang command (`03-models.js`). Sa 30 SV ng DITL, ito lang ang nagbago.
- **DITL-03F (BOILER EMERGENCY TRIP P.B.(1) / (2) (N.C.) → "⊔" → OR → NOT → BOILER EMERGENCY TRIP P.B. ON (OPC)):** ang "⊔" sa N.C. contact ay binasang 2 s pulse sa falling edge; dahil may NOT, laging ON ang trip kapag walang pumipindot, kaya hindi kailanman nare-reset ang MFT. Ayos: sa N.C. contact, ang "⊔" ay ang contact mismo (1 habang hindi pinipindot). Trip = kapag parehong pinindot ang dalawang button. Ang "⊔" ng LOCAL STOP P.B. (DITL-22, 24, 30, 31, 111, 112) ay hindi binago (falling-edge pulse, tama sa drawing). Hindi nakasulat sa legend DITL-00 ang "⊔".
- **Ref na nasa panaklong, hal. "(19-57)", "(23A-55)":** ito ay ang parehong item ng IBANG makina na gumagamit ng drawing (DITL-19 = coal feeder A; B / C ay may sariling address). Dati ay ikinakabit sa makinang A: tumatakbo ang BFWP B kapag tumatakbo ang A, at ang "PAF LUB OIL PUMP B STOPPED" ay naka-latch. Ayos: hindi na ikinakabit.
- **ABC input ng makinang B / C sa drawing ng A** (memory list "B-BFWP RUNNING" M.3344 ← 23A-55 "BFWP A RUNNING"): hindi na ikinakabit; nananatiling input ng ABC.
- **ABC-027 "TO DITL 02-25, DITL 03F-16, DITL 19-16":** una lang ang nababasa dati; ngayon lahat (FURNACE LOWER LAYER > 700 °C ADEQUATE FOR COAL FIRING).
- **ABC-001C "TO DITL 40-09" MAIN STEAM PRESSURE LOW LOW:** ang text ay nasa tabi ng analog wire na AI0131 (122 kg/cm2, nababasang 1). Ang tunay na signal ay ang output ng comparator sa tabi nito: **LC AI0131 < 72.9 kg/cm2 → M.310D** (kasunod ang LOW < 100 → M.310A = 40-08, HIGH > 130 → M.3109 = 40-07). beta.3: hindi muna ikinabit. **beta.4 (user: "protection yan"):** nakakabit na sa M.310D; para sa TO DITL na nasa tabi ng analog wire at limit ang DITL row, ang pinakamalapit na digital net na output ng logic ang kinukuha. Sinubok: 150 MW → 0, 60 kg/cm2 → 1.

### C. ABC 150 MW load: mga transient na nagti-trip ng MFT (`hmi-op.js`, `plant.js`)
- **Raw vs compensated:** ang snapshot value ay compensated, pero isinusulat bilang raw transmitter. Ayos (`AN_HMI_COMP`): hinahanap ang raw para lumabas ang compensated ng snapshot.
  - Drum level LIBR10011/12/13: dati 393 / 146 / 393 mm, H.H. → MFT.
  - Main steam flow FIQMS1031: dati 461 sa halip na 474.1 T/H; FW SV 546–644, FW 550 T/H, drum level 285 mm.
  - PA / SA flow FIFA1071 / 1081: dati 265.5 / 157.5 sa halip na 354.0 / 213.0 T/H, PRIMARY AIR FLOW L.L. → MFT.
- **Plant model habang naglo-load:** ang loop na may snapshot transmitter ay naka-OFF hanggang matapos ang load at maitakda ang anchor. Ang model ay nagsisimula sa PV ng snapshot (`pr.y0`). Sa unang sulat, hindi pinapalitan ang raw AI kapag tugma na ang PV. Dati, ang ABC-012 main steam temperature ay 542 → 494 °C, at 541 lang pagkalipas ng 300 s.
- **Drum level balance:** ang steam flow ay ang compensated flow (SQRT), hindi ang raw AI0129.
- **LP heaters at deaerator (02.png lang ang may screen):** kontrolado ang level kaya ang level ng 02.png ang operating point. Dati ay nasa dulo ng range (LPH −320 / −287 / −310 mm, LEVEL LOW; deaerator 1095 mm, HIGH). Ang valve position ay galing sa 60 MW.
- **PAF / SAF flow control:** MV = inlet damper ng 7.PNG (35.6 / 37.1 %); dati 3.3 / 17.9 %.

## beta.6 — Machine instance B / C / D (drawing "SAME FOR B / C / D")
- **Drawing:** halimbawa DITL-23A (BFWP A), note "THE DIAGRAM IS THE SAME FOR BFWP B"; ang address ng row ay listahan (`M.3343/3344` = A / B). Ang k-th address = makina k.
- **Engine:** `src/world/world.js` `machinesOf` (bilang ng makina = letra sa note + haba ng address list, max 4), `makeInst` (kopya ng sheet, sariling `nl`, `sig`, `usw`, estado ng FF / timer / motor), `target` / `pick` (address -> letra -> kapatid na sheet -> parehong k), `remap` (iniikot ang letra ng makina sa text, sa parehong pamilya lang). `tick` ay pinapatakbo ang lahat ng sheet + instance.
- **Address group (`grpState`, 05-overlay-interaction.js):** ang master row na pinapakain ng ibang sheet (FROM) ay binabasa ang `_win`; ang reader na may sariling FROM link ay sumusunod sa link na iyon. DITL-24 row 26 "-I.037C PAF LUB OIL PUMP B STOPPED" (F = 24-61) = NOT ng LOP B RUNNING ng `DITL-24 #B`, ayon sa drawing.
- **Patunay:** `tests/regress/ditl150.js` ALL PASS; `tests/regress/world.js` (bilang ng link, 0 lost).
- **TO column na may panaklong (world.js):** DITL-03B out 70 "FAB A STOPPED" TO 28A-29, out 71 "FAB B STOPPED" TO "(28A-29)"; DITL-03D out 68 "FAB A STOP COMMAND" TO 28A-21, out 69 "FAB B STOP COMMAND" TO "(28A-21)". Ang row ng instance k ay kumukuha sa output na may "(sheet-row)" sa TO column. 2 link (`WORLD.stat.byTo`).
- **Relay contact ng DCS output (02-netlist.js):** DITL-21A: OR (RUNNING) -> O.021C "LOR-L1060A" -> relay; NOT -> O.021D "LOS-L1060A" -> relay; ang N.O. contact (dalawang bilog r 1.85, 9 ang pagitan, flat bar sa itaas) sa DC 24V line -> LCP lamp 66 RUNNING / 68 STOPPED. Ang wire ng lamp ay sumasama sa wire ng DCS output arrow sa parehong taas, kaliwa ng DC 24V line. Sinuri ang 108 two-circle contact sa lahat ng sheet: DITL-21A lang ang nagbago (ang slant-bar contact ay limit switch ng SV / MOV, hindi ginalaw).

## beta.7 — 150 MW snapshot (M1)
- **PA flow:** ABC-002 SI0045 = SW(M.008B)[ SUM( S1-LN14(HIC-TADBS), HS(RATE(S1-LN12(SI0140))) ) ]. S1-LN12: 81.0 T/H coal → 380 T/H. S1-LN14 "PA FLOW BIAS": x 0 % → −30, 50 % → 0, 100 % → +30 T/H; HIC-TADBS −50 ~ +50 → x = (MV + 50). 7.PNG PAF FLOW BIAS −30.0 → MV −50. 380 − 30 = 350 (7.PNG R-SV 354.6).
- **SA flow / O2:** SI0044 = SI0042 × S1-LN15(AICFG112 trim): x 0 → 0.8, 50 → 1.0, 100 → 1.2; AICFG112 MH 50 (PID summary). M.0103 (force manual ng trim) = OR(analyzer deviation, M.0102 = NOT FICFA1081.REM OR NOT M.0101, B.0671 AND B.0701).
- **Lube oil (ABC-053):** SV = AMT(I.0931)[ CONST 46, S2-LN22 ] → RAMPB → TICLO1002; I.0931 = STN102 MIG-52G1-1 "#1 GCB 52G1 on".
- **Sync pulse (ABC-050 → ABC-052):** I.0931 AND … → TPS 2 s (M.070D) → FF M.070F (reset: M.071D LP demand ≤ 0 %) → TON 1 s M.0714 → AMT#68 leg SI0224 (LP bypass preset). Sa snapshot, matagal nang sarado ang GCB: walang pulse.
- **Reverse valve:** ABC-029 FCV-DO1012: AO = CONST 100 − HICDO1012.MV → I/P. ABC-030 PCV-AS1020-1 / -2: signal 100 / 67.7 → opening 0.0 / 32.3 (29.PNG 0.1 / 32.2).
- **Condensate (ABC-032):** FICCD1120 = min-flow recirculation; PV FT-CD1120 = condensate flow papunta sa deaerator (380 T/H, 28.png), hindi gawa ng recirc valve (0.1 %).

## beta.8 — A6 mga controller na mahirap simulan (M1); plant physics ng RH temperature
- **Force manual (mula sa netlist, 2.1.0-beta.4):** PICFG108 (ABC-008) M.0205 = OR(NOT ID fan M.3304, MV < 14 % M.0206, NOT M.0202 hydraulic select FF). AICFG112 (ABC-002) M.0103 = OR(air / fuel cross limit, M.0102 = NOT FICFA1081.REM OR NOT M.0101 steam flow > 220 T/H, SIG.AB). HS-COAL (ABC-004A) M.2020 = OR(PIC-COBM.MAN, NOT feeder A / B / C running, NOT oil valve (1) at (2) close ng burner A ~ D). FICFW1007 (ABC-010) M.0228 = OR(NOT LICBR1001B.MAN, BFWP A at B patay, SIG.AB, M.022E = TON 60 s ng MAIN STEAM FLOW < 100 T/H).
- **Bakit hindi kaya ng generic tester:** ang mga permissive ay KONDISYON NG PROSESO (tumatakbong fan / feeder / mill, daloy ng steam, hangin laban sa gatong), hindi switch. Ang random na input sa cold start ay hindi planta. Ang FICFW1007 ay "malinis" sa 20 s pero na-fo-force pagkatapos ng TON 60 s (steam flow 0 sa cold start).
- **Physics na ginamit:** ang planta na tumatakbo (Start at 150 MW: transmitter, kagamitan, mode ng operating point) ang estado ng test. Sa estadong iyon, ang lahat ng 6 ay AUTO at walang force (sinukat: PICFG108 PV −17.3 / SV −16.0 / MV 46.1; AICFG112 4.30 / 3.50 / 50.0; HS-COAL 81.4 / 81.4 / 33.1; FICFW1007 511 / 502 / 56.0; PICAS1005 10.2 / 10.2 / 4.2; TICHR1002 540.1 / 541 / 79.4).
- **RH outlet temperature (ABC-019 TICHR1002 spray + ABC-020 TICHR1002A RH / SH flue gas damper):** iisang measurement, dalawang actuator. Sa physics, ang epekto ng spray (lumalamig) at ng damper (umiinit) ay NAGDADAGDAG. Sa model dati: AVERAGE (kalahati ang epekto ng bawat isa), at ang anchor sa snapshot ay kinukuha gamit ang damper NGAYON, kaya sa steady state ay walang epekto ang damper (sinukat sa beta.7: damper 20 % o 50 % → 541.0 °C pa rin; spray 0 / 100 % → 567.5 / 534.1). Ang gain ng damper ay nililimitahan sa parehong rule ng spray (mula sa snapshot 36 % hanggang 0 o 100 %, ang PV ay nasa loob ng 0 ~ 600 °C); walang gain ng damper sa repo, kaya ito ang batayan.

## beta.9 — M2 Normal operation + load down / up: unit model (boiler + turbine)
- **ABC-001A / 001B (unit load demand):** HIC-ULD (TARGET MW) → HLLIM (HIC-MWHL / HIC-MWLL) → RATE (HIC-MWRL MW/MIN, ABC-001B: SI0208 = 0.05 × HIC-MWRL.MV ...) → SI0212 → SI0226 MW demand. 33.PNG: OUTPUT CHANGE RATE SET 3.0 MW/MIN.
  - **Bug:** ang HIC-MWRL ay 0.1 MW/MIN sa app (ang AMT ng station ay leg A = sariling output, kaya binabasa ang lumang output; ang 3.0 ng Start at 150 MW ay nabubura). Ang load ay 30× mas mabagal sa app. Ang lumang `loaddown.js` ay pumasa lang dahil ang test ay humahakbang sa ABC-001B ~30× bawat tick.
- **ABC-001C (CCS / boiler master / turbine master):**
  - Turbine master EIC-TM (MAN): A = SI0236 = SW(LAG 150 s)[MW demand] + SI0234 (LN55 ng pressure deviation); output → AO0359 TO TCS. Force manual M.2016 = OR(NOT BM in AUTO, ..., M.2017 = NOT I.0082 DCS CONTROL MODE ON FROM TCS, M.3200 turbine trip, B.0643).
  - PV EIC-TM.PV = SEL PRI/SEC/AVG (AI0419 GEN MW C, AI0774 GEN MW D) × 240/200 SCALE CONVERT (× 1 sa engineering units). **Bug:** ang dalawang AI ay pumapasok sa SEL sa T na walang tuldok; walang nakakabit, PV = 0 (33.PNG: 148.6 MW).
  - Boiler master HIC-BM (MAN): A = SI0225 = PIC-COBM.MV + SI0201 (SI0201 = LN54 ng MW demand + SI0250 + BIR SI0219); force manual **M.2013 = OR(HP BYPASS > 5 %, B.0641, M.0255, ..., NOT M.0101, M.3200, B.0643)**, **M.0101 = MSF > 220 T/H**. Kaya sa ibaba ng ~70 MW ay MANUAL ang boiler master (tugma sa PR-OPE-5002 "At 230 T/H MSF ... Put Boiler Master to Auto").
  - PIC-COBM (PID, Kp 3.0 / Ti 165 s / Td 7 s, ±25 %): A/M leg B = **SI0224 = SI0213 − SI0201** (tracking) kapag **"BOILER MASTER IN MANUAL" HIC-BM.MAN** = 1. **Bug:** (1) ang HIC-BM.MAN ay nakakabit sa mga wire ng "TURBINE MASTER IN MANUAL" (ang `modeNetsByTag` ay sumusukat sa dulo ng wire, hindi sa linya); (2) ang .MAN ay nagiging 1 lang sa pindot ng faceplate, hindi kapag ang drawing ang nag-force (BU-CMD). Resulta dati: bump na −11 % pagbalik sa AUTO, MSP 89 kg/cm2, coal master na-force manual sa itaas.
- **33.PNG CCS OPERATION:** EIC-TM A (SV 150, MV 75 %), TARGET MW SETPOINT FROM TCS 149.5, HIC-BM A, PIC-COBM A, FIC-CM R. **Bug ng Start at 150 MW:** I.0082 = 0 (DCS control mode OFF), kaya naka-MANUAL ang turbine master.
- **ABC-004B / 004C feeder:** ang feeder model (`anFeederStep`) ay hinahanap nang isang beses; kapag ang sheet ay unang humakbang bago nakakabit ang link ng running bit (M.0152 / M.0162), `null` ang na-cache at hindi na sumusunod ang feedrate sa MV.
- **ABC-050 PICMS1006 (HP bypass PCV-MS1020):** PV = SEL(AI0416, AI0512 PT-MS1006 turbine main steam pressure, STN102); SV sa REMOTE = PV + 2; M.0709 = MV > 5 % → "HP BYPASS VALVE OPENED > 5 %" → M.2013.
- **Procedure:** PR-OPE-5003: reduce load 150 → 90 MW 1.2 MW/min, 90 → 45 MW 0.6 MW/min; **"Maintain MS Pressure (123-126 ksc)"**; "0.6 t/h of coal = 1 MW". PR-OPE-5002: sa ibaba ng ~75 MW, "Put COAL MASTER to REMOTE and adjust boiler load using BOILER MASTER"; ">90 MW we can set CCS".
- **Physics (unit model, `src/analog/engine/unit.js`):**
  - coal (AI0480 + AI0512 + AI0544 feedrate) → steam na nagagawa: anchor sa Start at 150 MW, a = 5.78 T/H steam bawat T/H coal (4.PNG / 03.png 88.6 → 474.1; 02.png 41.8 → 203.7), lag 60 s;
  - drum pressure: C × dPd/dt = steam na nagagawa − steam na lumalabas (turbine + HP bypass + blow-off);
  - MSP = Pd − kdp × m² (134.2 − 122.6 sa 474.1 T/H); turbine inlet (ABC-050) = MSP − linya;
  - turbine (TCS): m = Kt × gv × MSP; ang TCS ay nagbubukas ng valve hanggang MW = target (EIC-TM output habang ON ang DCS control mode; kung OFF, ang sariling target ng TCS);
  - MW = MW0 + 0.334 × (m − m0) (parehong 2 snapshot), lag 10 s;
  - C = 1500 at lag 60 s ay galing sa tuning ng planta (PIC-COBM PI Ti 165 s): sa 700 / 150 s, ang tuning ng planta ay nag-o-oscillate (MSP 70 ~ 126). Hindi nasukat sa planta; ang laki ng HP bypass (30 %) at blow-off (10 %) ay ipinalagay.

## beta.10 — BU-CMD = protection (ABC-001C HIC-BM / EIC-TM, at lahat ng MAN station na may BU-CMD)
- **Drawing (ABC-001C):** HIC-BM (MAN) A/M switch, leg A = AUTO-MV SI0225, leg B = COS manual; select = **M.2013 BU-CMD** = OR(HP BYPASS > 5 %, B.0641, M.0255, NOT M.0101 [MSF > 220 T/H], M.3200 turbine trip, B.0643). EIC-TM (MAN): select = **M.2016** = OR(NOT boiler master AUTO, M.2017 = NOT I.0082, M.3200, B.0643). Text ng drawing: "BOILER MASTER IN MANUAL  HIC-BM.MAN" → PIC-COBM leg B (tracking SI0224).
- **Legend (ABC-000, `analog logic symbols legend.pdf`, larawan lang, walang text layer):** IISANG simbolo ang "AUTO/MANUAL SWITCH FOR PID CONTROLLER & MANUAL CONTROL STATION" (T na may 1:B, COS sa leg B) at "INTERLOCK TRACKING FOR PID CONTROLLER & MANUAL CONTROL STATION". Kaya ang rule ng A/M switch ng PID (1:B = LEVEL, MANUAL hanggang AUTO ng operator) ay para rin sa MAN station. Ang "BU-CMD" ay ang pangalan ng select signal sa mismong sheet (ABC-001C), hindi nasa legend; walang nakasulat na awtomatikong pagbalik sa AUTO.
- **Textbook (`dcs-training-textbook.pdf`, status word ng MNO):** `.MAN` = MANUAL, `.BUP` = BACK UP (hiwalay na bit). Ang drawing ay bumabasa ng `.MAN`, kaya `.MAN` = 1 habang naka-BU-CMD.
- **Procedure (PR-OPE-5002 Start Up, `plant-operation-procedure.zip`):** "At 230 T/H MSF ... Put Boiler Master to Auto" = ang operator ang nagpa-AUTO; hindi kusa.
- **Kaya sa app:** ang A/M switch ng MAN station ay sumusunod sa force-manual rule ng AMT (1:B = LEVEL; MANUAL hanggang AUTO ng operator; user rule 2026-10-15 + CLAUDE.md 10). Sa Start at 150 MW, ang operator ang nagpa-AUTO pagkatapos ng 10 s ng cold start (snapshot 33.PNG: HIC-BM A, EIC-TM A; 11.png feeders A).
