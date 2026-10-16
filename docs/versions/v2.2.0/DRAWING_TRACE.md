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
