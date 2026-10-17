# v2.2.0 — Mga Beta

Base: Stable v2.1.0 (`main` 0aac342). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (beta.1 ~ beta.7) at `ccr-3def3a81-kcpwgn` (beta.8 ~; PR #31) (PROJECT_RULES 5e, 5f).

## 2.2.0-beta.15 — M4 hakbang 2: coal transfer (batch → tuluy-tuloy na feeder → retract ng start-up burner), Start warm

- **Problem (roadmap M4 hakbang 2):** Pagkatapos ng light-off (beta.14) ay wala pang coal: ang coal ay "nasusunog" kahit malamig ang bed, walang paraan para simulan ang hakbang ng PR-OPE-5002 (batch firing sa 400 ~ 450 °C, tuluy-tuloy na feeder sa > 600 °C, pangalawa / pangatlo sa > 650 °C, retract ng burner sa > 700 ~ 750 °C), at ang start-up feedwater valve (LICBR1001B) ay walang epekto sa drum level.
- **As Found (trace: `DRAWING_TRACE.md` beta.15):**
  - PR-OPE-5002 4.3.x: "Approximately: 2.55 TPH coal = 1 TPH diesel" (beta.14 ay 2, ipinalagay → naitama); batch 10 s burping / 60 s rest; "Solid Fuel Feeder in REMOTE AUTO, Speed Demand at MINIMUM".
  - ABC-004A ~ C feeder chain: FICCL1061x.MV = AMT(M.0147 = NOT running OR M.0146) ng MAN FICCL1061x at ng minimum na demand SI0112 (SI0311 = 4 / 8 T/H sa M.025B). Ang MAN station ay FORCE MANUAL habang nakatigil ang feeder (M.0141 = NOT M.0142) at ang AUTO (FF M.0145) ay tinatanggap lang kapag maliit ang deviation (CMPK): kaya ang operator ay nagsisimula ng feeder (M.3400, DITL) → hihintayin ang RUNNING (TON) → A, na FIC-CF nasa minimum ng feeder (10 % = 4 T/H).
  - Ang `.MAN` mode status ng mga PID station sa Start cold ay 0 kahit MANUAL ang switch (ang plant.js ay nagsusulat lang ng status ng MAN station): ABC-010 M.0226 force manual ng LICBR1001B = NOT FICFW1007.MAN OR NOT LICBR1001A.MAN → hindi ma-AUTO ang start-up level control. Bug (CLAUDE.md 2), naayos: ang Start cold ay naglalatch ng .MAN = 1 sa bawat controller (`AN.latchMode`, parehong code ng faceplate).
  - ABC-004A FIC-CM (coal master) force manual M.0130 = M.0138 (burner / feeder trip) OR M.0137 OR NOT FIC-CF.REM OR NOT FICFA1071.REM OR NOT FICFA1081.REM: ang coal master ay AUTO lang kapag REMOTE ang FIC-CF at ang PA / SA flow (cascade ng boiler master, hakbang 4). Tama ayon sa drawing; ang scenario ay nagpapakita nito.
  - Oil ng warm start: FICDO1043x sa 60 % = 2.1 T/H bawat burner (steady; ang 0.8 ng beta.14 ay sa 80 s pa lang, lag 75 s); 4 burner 60 % = 8.4 T/H oil = 21 T/H coal-eq = 30 % MCR na apoy: masyado; ang Start warm ay 30 %.
- **Work Done:**
  - `unit.js`: ao = 2.55; **coal burnt share** bf = (bed − 350) / 250 (0 ~ 1; IPINALAGAY mula sa 400 ~ 450 batch / 600 tuluy-tuloy ng procedure), fuel equivalent Fe = bf·coal + 2.55·oil (ang hindi nasunog ay U.unb); **bed temperature** sa fuel share / air share (hindi sa steam made: ang fixed loss ng firing line ay nagpapalamig sa maliit na apoy), exponent 0.45 (850 °C full load, ~450 °C sa 2 burner 60 % at light-off na hangin, ~800 °C coal lamang sa O2 4 ~ 5 %); **start-up feedwater valve** LICBR1001B → + 30 % ng anchor FW sa 100 % (plant.js pr.op ng FICFW1007; IPINALAGAY ang laki).
  - `hmi-op.js`: `anPlantWarm(o)` / ⚙ **Start warm (M4: 30 kg/cm2, burners lit)** = Start cold + drum 30 kg/cm2 (tubig sa saturation), bed 480 °C, fans, 4 burner 30 %, hangin 10 %: ang dulo ng cold start, para hindi ulitin ang 3 min bago ang coal transfer (Fig 3 warm start: parehong hakbang mula sa pressure). `anOilValve(addr, open)` (AN.oilValve). Start cold: .MAN latch.
  - `hmi.js`: `AN.latchMode(tag, 'MAN' | 'LOC' | 'REM')` (ang M / A / R ng faceplate, para sa engine at CHECK).
  - `check.js`: scenario **M4 · Coal transfer** (Start warm → LICBR1001B A SV 0, blow-off A SV 35, FIC-CF 10 % → batch ng feeder A hanggang bed 600 → A tuluy-tuloy + AUTO → oil −5 % / min → B → bed 650 → C → FIC-CF 15 % habang ≤ 110 °C/h → bed 700: retract A, D, B, C → O2 3.5 ~ 5.5 (floor 10 % hangin) → FIC-CM A: ang drawing ang sumasagot). 9 tseke. Cold scenario: operator ±5 % oil (< 70 / > 90 °C/h), Fig 1 rate binabasa sa 5 min, limit 4 h. Helper `mode`, `autoSv`, `isAuto`.
- **As Left (headless, build 2.2.0-beta.15):** CHECK **M4 · Coal transfer PASADO 9 / 9** (t = 4500 s): 33 burping hanggang 600 °C; bed 759 °C sa dulo (lahat ng burner retracted); feeder A / B / C 6.0 / 6.0 / 6.0 T/H sa AUTO; oil 0; O2 6.7 ~ 8.0 % (minimum na hangin); MSP 107.5 kg/cm2 (< 125), saturation 75 °C/h; drum level −30 ~ 8 mm (LICBR1001B); FIC-CM MANUAL ayon sa M.0130, SV 18 = coal 18 T/H; MW 0, walang trip. **M4 · Cold start:** PASADO 10 / 10 (t = 11654 s): tubig 100 °C sa 63 min; 0 → 30 kg/cm2 sa 193 min; saturation 105 °C/h max sa 5 min (Fig 1 ≤ 110; ang operator ay binabantayan ang tubig bago kumulo at ang saturation pagkatapos); bed 641 °C, oil 5.2 T/H sa 4 burner; MST 449; level −6 ~ 40 mm.
- **Regression:** unit_trip 6 / 6 ALL PASS, unit_load ALL PASS, hmi_op ALL PASS (34 anchored loops), plant_live ALL PASS, switches 438 / 0, reset 51 / 0, force_manual 68 / 0, isolated 54 sheets 5128 nets PASS, scenarios 244 / 0, CHECK panel lahat PASADO (M2 14 / 14, M3 6 scenario, M4 cold 10 / 10, M4 coal 9 / 9, share); generic tester 68 controller, 2145 tama, 0 mali, 0 hindi nasubok.
- **Ano ang makikita ng operator:** ⚙ → **Start warm** → ▶ Run 300x. ABC-010 LICBR1001B: A, SV 0 (hahawak ng level ang start-up valve). ABC-004A: FIC-CF M 10 %. Buttons: M.3400 ON 10 s / OFF 60 s (batch) habang < 600 °C (UNIT.Tb sa UNIT screen); sa > 600: M.3400 ON, tapos A sa FICCL1061A faceplate (tatanggapin kapag tumatakbo at PV = SV); oil −5 %; M.3401 (B), sa > 650 M.3402 (C) at M.3405; > 700: isara ang oil valves (ABC-004A AND inputs ng M.3410 ON) at BURNER IN SERVICE OFF isa-isa; O2 sa ABC-002: bawasan ang PA / SA. Ang A sa FIC-CM ay hindi tatanggapin (M.0130) hanggang REMOTE ang FIC-CF / PA / SA (hakbang 4).
- **Ipinalagay (nakasulat sa `unit.js`):** burnt share 350 → 600 °C; exponent 0.45 ng bed; laki ng start-up FW valve 30 %; minimum na hangin ng fluidization = 10 % MV ng PA / SA (operator floor sa scenario).
- **Hindi pa nasubok:** totoong tablet / apk / exe; CO (walang CO analyzer sa I/O list; ang "check CO" ng procedure ay obserbasyon); bypass / pressure hold at turbine (hakbang 3 ~ 4: kaya tumataas ang MSP hanggang 107 sa scenario, blow-off 100 %).
- **Status:** Beta.

## 2.2.0-beta.14 — M4 hakbang 1: Start cold, oil firing, bed temperature, water heat-up, pressure raise (purge → light-off → 30 kg/cm2)

- **Problem (roadmap M4, user: "proceed M4"):** Walang cold state ang planta: ang Reset ay "cold boiler" na walang physics (lahat 0, walang init), at ang unit model ay tumatakbo lang mula sa Start at 150 MW. Hindi masimulan ang start-up procedure (PR-OPE-5002): purge, light-off ng start-up burner, pag-init ng tubig, pagtaas ng drum pressure.
- **As Found (trace: `DRAWING_TRACE.md` beta.14):**
  - Oil flow ng apat na start-up burner: ABC-003A ~ D FICDO1043A ~ D, PV SI0070 / 0380 / 0460 / 0480 = AI0515 / 0546 / 0517 / 0548 (0 ~ 3.5 T/H) sa likod ng gate SW ng **M.3410 / 3411 / 3416 / 3417 "A ~ D SU BNR SUPPLY OIL VALVE (1)(2) CLOSE (BC FROM S4)"**: kapag sarado ang dalawang valve, CONST 0 ang PV (drawing). Ang M.3410 ay HINDI input ng ABC-003A: link ito mula sa ABC-004A, kung saan ito ay AND ng dalawang limit switch input (valve (1) closed AND valve (2) closed); gayon din ang M.3411 sa ABC-004A, M.3416 / 3417 sa ABC-004B / C. Kaya ang "buksan ang oil valve" ng operator = ang dalawang input ng AND na iyon ay 0 (iisang signal, CLAUDE.md 1; walang tinanggal na link, CLAUDE.md 9).
  - BURNER IN SERVICE M.3412 / 3413 / 3418 / 3419 (BC FROM S4): galing sa DITL (burner management); forced ng operator / CHECK (CLAUDE.md 7).
  - Walang DCS transmitter ng bed temperature (I/O list: cyclone outlet AI0660 / 0661 / 0676 / 0677 0 ~ 1200 °C lang); ang bed thermocouples ay sa DITL / local. Kaya estado ng plant model ang bed temperature (UNIT screen: UNIT.Tb).
  - PICFG108 (furnace pressure, hydraulic coupling): M.0205 force manual = M.0206 LC (MV < 14 %) OR IDF stopped (M.3304) OR ...: sa maliit na hangin ng light-off ang kailangang MV ay 13 % → MANUAL ang drawing (BU-CMD, tama ayon sa drawing; CLAUDE.md 3: "itaas muna ang MV"). Hawak ang furnace pressure sa −16 mmH2O.
  - Boiler manual SECT_7 Fig 1: pinakamabilis na pagtaas ng saturation temperature ≤ 110 °C/h; Fig 2 cold start-up: 5 min purge → fire burners → roll turbine sa ~h 5. PR-OPE-5002: purge > 25 % MCR air, 5 min; light-off ng start-up burner sa minimum, dagdag ng firing paunti-unti; coal batch firing sa bed 400 ~ 450 °C. TAB_9: SH outlet ≤ 535 °C bago sync. Ang fuel heating values ng Tab_1 (design data) ay larawan na walang text: hindi mabasa.
- **Work Done:**
  - `src/analog/engine/unit.js`: (1) firing = coal + oil × ao (ao = 2, IPINALAGAY: diesel ~42 MJ/kg laban sa coal 89 T/H sa 460 T/H; Tab_1 hindi mabasa); ang offset ng firing line (m0 − a·F0) ay nawawala sa ibaba ng 30 % ng anchor coal para ang maliit na apoy ay maliit na steam (sa itaas, hindi nagbago ang M2 / M3). (2) **Water heat-up:** sa ibaba ng saturation ang apoy ay nagpapainit ng tubig (U.Tw, Cw = 1508 (T/H)·s/°C, IPINALAGAY 200 t na tubig), walang steam; sa saturation ang pressure ay tumataas laban sa C + Cw × 47.1 / (P + 1) (storage ng steam at ng saturated water): ang saturation temperature ay tumataas sa firing / Cw, kaya ang Fig 1 (≤ 110 °C/h) ay trabaho ng operator (firing), gaya ng planta. (3) **Bed temperature** U.Tb: first order (900 s) sa Tamb + 820 × (firing share / air share)^0.7 (IPINALAGAY: 850 °C sa full load, Fig 8; ~450 °C sa 2 burner at minimum na hangin = coal batch permissive). (4) Habang cold: ang steam temperature ay hindi lalampas sa gas (bed, `plant.js` pr.tcap) at hindi bababa sa saturation; ang header pagkatapos ng spray gayon din. (5) U.turb = false: sarado ang turbine stop valves hanggang i-roll (M4 hakbang 4); MW 0. (6) O2 = f(coal + oil × ao, total air). (7) `anUnitCold()`.
  - `src/analog/engine/hmi-op.js` `anPlantCold()` (⚙ → **Start cold (M4 start-up)**; `AN.plantCold`): Start at 150 MW (anchors = gains ng bawat loop model), tapos: DI ng boiler out of service (feeders at fans stopped, oil valves closed, burners out of service, GCB open, walang ICV→CV transfer); LAHAT ng controller L + M 0 % maliban sa PICFG108 / 108A; drum level model walang blowdown loss; unit cold; bawat loop model muling nagsisimula sa steady state ng bagong command (dati: feedwater 499 → 0 T/H na bumababa sa loob ng 3 min sa cold drum: level 11 → 795 mm); drum level transmitters muling ni-solve sa cold pressure (density compensation LN38 / LN39 ng drawing).
  - `src/ui/uat/check.js`: scenario **M4 · Cold start: purge, light-off, pressure raise** (Start cold → fans start → PA / SA 35 % purge 5 min → oil valves A / B bukas, burner in service, FICDO1043A / B 60 %, hangin 10 % → ang operator ay binabantayan ang saturation rate: +10 % oil kapag < 80 °C/h at > 5 kg/cm2, −10 % kapag > 100; burner C / D sa 15 kg/cm2 → tigil sa 30 kg/cm2). 10 tseke. Helper `man` (L + M + MV), `oilValve`.
  - UNIT screen (`src/ui/plant/systems.js`, `plant.js`): UNIT.oilF (oil ng 4 burner), UNIT.Tb (bed), UNIT.Tw (tubig) LIVE mula sa plant model.
  - `tests/regress/check_panel.js`: + `cold`.
- **As Left (headless, build 2.2.0-beta.14, `check_panel.js cold` PASADO 10 / 10, t = 9955 s):** purge total air 544 T/H; oil A / B 0.8 T/H bawat isa sa 60 % (0 habang sarado ang gate); tubig 30 → 100 °C sa 54 min, drum 0.0 kg/cm2 pa; drum 0 → 30 kg/cm2 sa 165 min (Fig 2: fire → roll ~5 h; compressed dahil sa Cw); saturation rate max 99 °C/h (Fig 1 ≤ 110); bed 478 °C, oil 6.9 T/H sa 4 burner; furnace −16 mmH2O, walang HIGH, PICFG108 M (force manual ng drawing, MV < 14 %); MST 449 °C (≥ saturation 263, ≤ 535); MW 0, coal 0; drum level −4 ~ 39 mm. Hot path (Start at 150 MW): walang pagbabago sa formula sa itaas ng 30 % coal; regression sa ibaba.
- **Regression:** unit_trip 6 / 6 ALL PASS, unit_load ALL PASS, hmi_op ALL PASS, plant_live ALL PASS, switches 438 / 0, reset 51 / 0, force_manual 68 / 0, isolated 54 sheets 5128 nets PASS, scenarios 244 / 0, CHECK panel lahat PASADO (M2 14 / 14, M3 6 scenario, M4 cold 10 / 10, share); generic tester 68 controller, 2145 tama, 0 mali, 0 hindi nasubok.
- **Ano ang makikita ng operator:** ⚙ → **Start cold (M4 start-up)** → ▶ Run (bilis 60x o 300x). UNIT screen: drum 0 kg/cm2, tubig 30 °C, bed 30 °C, MW 0, lahat ng faceplate M 0 %. Buttons: M.3302 / 3303 / 3304 ON (fans); FICFA1071 / 1081 M 35 % (purge); pagkatapos ng 5 min: sa ABC-004A, ang dalawang input ng AND na M.3410 (at M.3411) OFF = bukas ang oil valves ng burner A / B; M.3412 / 3413 ON; FICDO1043A / B M 60 %: lalabas ang oil flow (~0.8 T/H), tataas ang bed (UNIT.Tb), ang tubig (UNIT.Tw) hanggang 100 °C, tapos tataas ang drum pressure (PT-BR1001) at ang saturation temperature; sa UNIT screen makikita ang MST = gas temperature (bed). Kapag mabilis ang pagtaas (> 110 °C/h), bawasan ang oil. O: **CHECK → M4 · Cold start** (isang pindot, ~3 min).
- **Ipinalagay (nakasulat sa `unit.js`):** ao = 2 (Tab_1 hindi mabasa), 200 t na tubig (Cw), bed temperature exponent 0.7 at lag 900 s, 850 °C sa full load. Ang Ceff na may Cw ay sa cold mode lang (hot path walang pagbabago: M2 / M3 pasado pa).
- **Hindi pa nasubok:** totoong tablet / apk / exe; ang mga hakbang pagkatapos ng 30 kg/cm2 (coal transfer, bypass, roll, sync = M4 hakbang 2 ~ 4); warm / hot start (Fig 3 / 4); ang furnace pressure sa AUTO sa maliit na hangin (ang drawing ang nagpo-force manual sa MV < 14 %: ang operator ay maaaring itaas ang MV o gamitin ang damper 108A).
- **Status:** Beta.

## 2.2.0-beta.13 — CHECK panel (M2 / M3 sa isang pindot) at iisang address = iisang halaga sa lahat ng sheet

- **Problem (user, 2026-10-17):** "Paano i-check ang M2 at M3? Walang guide, expected result, procedure." At: "babawan mo lang, ayaw ko ng kumplikado."
- **As Found:**
  - Ang iisang digital input ng drawing na nakasulat sa maraming sheet ng iisang station (hal. I.000F MFT FROM IRP sa 7 sheet ng STN101, M.3343 sa ABC-010 at ABC-050) ay may sariling kopya sa bawat sheet: ang ON sa isang sheet ay hindi umaabot sa iba (probe sa beta.12). Lumalabag sa CLAUDE.md rule 1 (iisang signal sa buong DCS). Kaya ang MFT nang mano-mano = 11 pindot + 3 pulse + 4 feeder bit: walang praktikal na procedure.
  - Walang lugar sa app na nagsasabi ng hakbang at inaasahang resulta ng M2 / M3; nasa headless test lang (`unit_load.js`, `unit_trip.js`).
- **Work Done:**
  - `src/analog/engine/links.js` `shareExt` (sa bawat `stepSet` / `stepTier`): ang mga digital ext input na may address `I.xxxx` / `M.xxxx` / `B.xxxx` (may prefix `S<n>` = ibang station; kung wala, station ng sheet) ay iisang grupo kada station|address; ang nagbago sa isang sheet ay isinusulat sa lahat (hindi sinusulatan ang net na hawak ng link `xlk` o ng force, pero ang pagbabago nito ay kumakalat). Ang I.000F ng STN102 ay hiwalay sa I.000F ng STN101 (sariling input ng bawat station: tama sa I/O list).
  - `src/ui/uat/check.js` (bago, injected kasama ng UAT): button **CHECK** (ibabang kaliwa). 7 scenario: M2 Load 150 → 60 → 150, M3 turbine trip, MFT, BFWP trip, IDF trip, PAF trip, drum level HH. Bawat isa: Start at 150 MW, hakbang ng operator at ng DITL (forced), mabilis na pagtakbo (batch ng 0.5 s steps), live na value, tapos ✓ / ✗ sa bawat inaasahan (parehong tseke ng mga test). Taglish, maikli: "Ginagawa" at "Inaasahan" sa bawat card.
  - `docs/versions/v2.2.0/CHECK_M2_M3.md`: ang gabay (hakbang, 7 scenario, inaasahan, mano-manong paraan, saan galing ang value).
  - `tests/regress/check_panel.js` (bago): pinipindot ang CHECK sa page, tinatakbo ang bawat scenario, dapat PASADO lahat; at ang share test (I.000F ON sa ABC-007 → lahat ng sheet ng station 1; ang ibang station hindi).
- **As Left (headless, build 2.2.0-beta.13):**
  - `check_panel.js`: share PASS (7 sheet ng station 1 sumunod; S2 sheets 0); M2 Load PASADO 14 / 14 (60 MW: MW 60.0, MSF 201, coal 40.1, MSP 121.3 / SV 122.3, MST 516 / RHT 496, RHP 15.2, O2 10.7; 150 MW: MW 150.0, MSF 471, MSP 122.4, MST 541 / RHT 543 / RHP 34.7; drum ±33 mm, MSP min 119.9); turbine trip 10 / 10; MFT 7 / 7; BFWP 7 / 7; IDF 7 / 7; PAF 6 / 6; drum HH 3 / 3.
  - Regression: unit_trip 6 / 6 ALL PASS, unit_load ALL PASS, hmi_op ALL PASS (34 anchored loops), plant_live ALL PASS, switches PASS (438 / 0), reset PASS (51 / 0), force_manual PASS 68 / 0, isolated PASS (54 sheets, 5128 nets), scenarios 244 / 0, generic tester 68 controller, 2145 tama, 0 mali, 0 hindi nasubok
- **Ano ang makikita ng operator:** button **CHECK** sa ibabang kaliwa (katabi ng UAT). Pindutin ▶ Takbo sa isang scenario, hintayin ang bar, basahin ang ✓ / ✗. Pagkatapos, PLANT → UNIT at ang mga sheet ay nasa huling estado ng scenario. Sa mano-manong trip: isang ON ng I.000F sa alinmang sheet ng station 1 ay sapat para sa buong station.
- **Hindi pa nasubok:** totoong tablet / apk / exe (laki ng panel sa phone: min(460px, 100vw)); ang M2 scenario sa mabagal na device (~3 min sa desktop headless).
- **Status:** Beta.

## 2.2.0-beta.12 — M3 Trip: turbine trip, MFT, BFWP trip, IDF / PAF trip, drum level LL / HH, furnace pressure vs hangin

- **Problem (roadmap M3):** Wala pang sagot ang planta sa mga trip: nakakabit ang force manual / BU-CMD ng drawing (beta.10), pero ang PV ay hindi gumagalaw (hal. nakahinto ang BFWP pero may FW flow pa; nakahinto ang IDF pero hindi tumataas ang furnace pressure; turbine trip pero MW 150 pa). Ang input ng STN102 (I.0400 turbine trip) ay hindi dumadaan sa STN101 (M.3200).
- **As Found (trace: `DRAWING_TRACE.md` beta.12):**
  - Station wiring S2 → S1 (memory list: M.3200 "T/B TRIP (BC FROM S2)", M.3220 "52G1 OPENED (BC FROM S2)") ay hindi ginagawa ng app: dalawang magkahiwalay na ext input.
  - TURBINE TRIP ay MFT first out sa DITL (memory list STN104 M.053F / B.125F) at sa procedure PR-OPE-5003 ("bypass turbine trip alarm at MFT ... to maintain boiler operation" sa normal shutdown lang). Ang unang bersyon ng test ay umasa sa operator na pumutol ng apoy habang tumatakbo ang boiler sa bypass: umabot sa 150 kg/cm2 (dulo ng range ng AI0131) ang pressure dahil ang HP bypass 30 % + blow-off 10 % (IPINALAGAY na laki) ay hindi kaya ang 474 T/H.
  - BU-CMD tracking ng COS (beta.10) ay minsanan lang sa pagbabago: pagkatapos ng 2 s pulse ng M.020F, bumalik ang PICFG108.MV sa 45.9 % (dapat 0 hawak).
  - FT-MS1031 ay sinusulat bilang steam sa turbine lang: sa turbine trip ay 0 ang MSF kahit may 150 T/H sa bypass → M.2001 (< 46 T/H) mali, bumagsak ang FW demand, drum level 820 mm.
  - Sa MFT, umakyat ang temperatura pagkatapos ng spray (561 / 600 °C) dahil ang sarado na spray (M.0240) ay nagdadagdag ng authority sa loop model, kahit walang apoy.
  - Sa REMOTE ang FICFW1007 (cascade ng LICBR1001): naka-lock sa AUTO ang station (`hmi.js` bMan disabled); ang operator ay dapat L muna bago M.
- **Work Done:**
  - `src/analog/engine/unit.js`: (1) station wiring `U.bcast`: ABC-050 I.0400 → M.3200 (ABC-001C, ABC-010), I.0932 → M.3220 (ABC-010); (2) turbine trip: sarado ang turbine valves sa 1 s (`tauTrip`), MW → 0, TCS target 0; (3) FT-MS1031 = steam sa turbine + HP bypass + blow-off (`mso`); load share `xl = mso / MCR`; (4) firing ratio `pr.fr` at saturation `pr.tsat = 100 + 47.1 ln(Pd + 1)`: kapag walang apoy, ang mga temperatura ay bumababa patungong saturation; (5) `U.mul`: FW (FICFW1007, LICBR1001B) × BFWP running (M.3343 / M.3344), PA × M.3302, SA × M.3303; `U.fp` / `U.idf`: furnace pressure (PICFG108 / 108A) = kfp × (total air / anchor − 1), IDF command × M.3304 (`pr.uf`), `kfp` = authority ng IDF loop ng anchor (`U.kfpA`). `anUnitStop` (Reset) ay inaalis ang lahat ng ito.
  - `src/analog/engine/plant.js`: `pr.mul` (0 = nakahinto ang makina: PV = ibaba ng range nang walang lag), `pr.uf`, `pr.fr` / `pr.tsat`, drum level shrink / swell (`ks` 10 mm bawat kg/cm2, lag 60 s), start-up valve × mul, BU-CMD tracking tuluy-tuloy habang 1 ang BU-CMD (ayos ng PICFG108 sa itaas).
  - `tests/regress/unit_trip.js` (bago): 6 scenario mula Start at 150 MW, DITL forced (CLAUDE.md 7): `tt` turbine trip (+ MFT), `mft`, `bfwp`, `idf`, `paf`, `hh`; `node tests/regress/unit_trip.js [tt|mft|bfwp|idf|paf|hh] [html]`.
- **As Left (headless, build 2.2.0-beta.12, `unit_trip.js` 6 / 6 ALL PASS):**
  - **tt:** I.0400 → M.3200 sa ABC-001C at ABC-010; HIC-BM M (M.2013), EIC-TM M (M.2016); M.0124 pulse 5 s, M.0705 HP bypass BU-CMD; M.022B (FW demand = LAG ng steam); MW 0.3 pagkatapos ng 60 s; MSF 146 T/H sa bypass (HP bypass, LP bypass, blow-off umabot sa 100 %); M.2001 hindi nag-1 sa unang 60 s; MSP max 140.9 (range 150), 126.5 pagkatapos ng 300 s (122.9 dati); coal 0.
  - **mft:** I.000F sa 11 sheet; coal 0 sa 10 s; SH spray 0 % (M.0230 / M.0240); PA / SA master M (M.0098); O2 21 %; MST 455 °C pagkatapos ng 400 s; MSP 45.0 (122.9 dati) → M.310D MAIN STEAM PRESSURE LOW LOW (72.9) → DITL-40; boiler / turbine master M (M.0101).
  - **bfwp:** FW 1.2 T/H 3 s pagkatapos huminto; FICFW1007 force manual M.0228; M.0702 ALL BFWP STOPPED (15 s) → M.0705; HP bypass M; drum level LL (−254) pagkatapos ng 31 s → MFT (forced); ABC-055 M.0315 = 0 (NOT M.3407).
  - **idf:** PICFG108 force manual (M.0205), M.020F pulse, MV 0 hawak (0.0 / 0.0 %); M.3107 HIGH (> 30) sa 12.5 s; H.H. (> 300) sa 64 s → MFT + PAF / SAF trip (forced); furnace pressure bumalik sa 47 mmH2O; coal 0, PA 0.
  - **paf:** PA 0.9 T/H sa 3 s; FICFA1071 M (M.0180); furnace pressure −174 mmH2O (−19 dati); IDF demand 45.9 → 27.1 % (AUTO); coal 86.8 → 12.1 T/H sa 120 s (cross limit LN40) → MFT (forced): coal 0, O2 20.8.
  - **hh:** FICFW1007 L + M + MV 100 %: FW 501 → 550 T/H; drum level HH (+254) pagkatapos ng 217 s → MFT (forced); coal 0.
  - `unit_load.js` (M2) ALL PASS pa rin: 60 MW MW 60.0 / MSF 201 / MST 516 / RHT 496 / RHP 15.2 / O2 10.7; balik 150 MW; drum level ±33 mm; walang trip.
  - Regression: hmi_op ALL PASS (34 anchored loops), plant_live ALL PASS, switches PASS (438 control cases, 0 hindi bumalik), reset PASS (51 sheets, 0 differ), force_manual PASS 68 / FAIL 0, isolated PASS (54 sheets, 5128 nets), scenarios 244 tama / 0 mali, generic tester 68 controller, 2145 tama, 0 mali, 0 hindi nasubok
- **Ano ang makikita ng operator (RUN, pagkatapos ng Start at 150 MW, panel INPUT ng sheet):**
  - ABC-050 "S2 I.0400" = 1 (turbine trip): M ang HIC-BM at EIC-TM (ABC-001C), bumubukas ang HP bypass (ABC-050), LP bypass (ABC-052) at blow-off (ABC-013), MW → 0, MSP umaakyat hanggang ~141 tapos bumababa. Ang MFT ng DITL ay i-force (I.000F = 1, M.0341 pulse, M.3400 ~ M.3402 = 0): coal 0, bumababa ang pressure at temperatura.
  - ABC-010 "M.3343" at "M.3344" = 0 (walang BFWP): FW 0 kahit bukas ang valve, M ang FICFW1007 (M.0228), bumababa ang drum level hanggang L.L. sa ~30 s; pagkatapos ng 15 s ay M ang HP bypass (M.0702).
  - ABC-008 "M.3304" = 0 (IDF stopped): M ang PICFG108 at 0 % ang demand (hawak), tumataas ang furnace pressure (HIGH sa 12 s, H.H. sa ~1 min).
  - ABC-007 "M.3302" = 0 (PAF stopped): PA 0, M ang FICFA1071, bumababa ang furnace pressure (−170), ang IDF ay bumababa (AUTO), pinuputol ng cross limit ang coal.
  - FICFW1007 faceplate: L → M → MV 100 %: FW 550, drum level H.H. sa ~3.5 min.
- **Ipinalagay (nakasulat sa `unit.js`):** turbine valves 1 s; kfp = authority ng IDF loop (fallback 150 mmH2O); shrink / swell 10 mm bawat kg/cm2, lag 60 s; saturation fit 100 + 47.1 ln(P + 1); laki ng HP bypass 30 % / blow-off 10 % (beta.9) — ito ang dahilan kung bakit umakyat sa 141 ang MSP sa turbine trip.
- **Hindi pa nasubok:** HOUSE LOAD / 52G OPEN (I.0932 / I.0937: boiler tumatakbo sa bypass, operator ang pumuputol ng apoy); MFT → turbine trip (ARP: wiring sa `dcs-hardware-wiring.zip`, hindi pa binasa: sa test ang turbine ay tumatakbo sa stored steam pagkatapos ng MFT, MW 147 → 77); main steam pressure LL bilang trip ng DITL-40 (nakakabit sa beta.4; sa `mft` ay umaabot sa M.310D); totoong tablet / apk / exe.
- **Status:** Beta.

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
  - Regression: hmi_op ALL PASS (34 anchored loops; PIC-COBM at AICFG112 sa unit model); plant_live ALL PASS; UNIT screen: 42 / 45 item LIVE (ang 3 MAN station HIC-BM / HIC-ULD / EIC-TM ay snapshot value gaya ng screen 033: ang PLANT link ay para sa PID faceplate lang, susunod na ayos); switches PASS (438 control cases, 0 hindi bumalik), reset PASS (51 sheets, 0 differ), force_manual PASS 68 / FAIL 0, isolated PASS (54 sheets, 5128 nets), scenarios 244 tama / 0 mali, generic tester 68 controller, 2145 tama, 0 mali, 0 hindi nasubok
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
