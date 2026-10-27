# Bagong HMI: listahan ng system at flow (roadmap step 6)

Ginawa 2026-10-26 (HMI sample, branch claude/project-thread-1h2161; numero ng Beta ibibigay sa pagsasama). Batayan: 35 snapshot ng control room (`document-references/hmi-snapshot-sample.zip`, buod sa `OPERATING_POINTS.md`), ang ABC sheets at ang I/O list. Ang snapshot ay **gabay lang** (anong equipment, saan dumadaloy, anong instrumento). Ang bagong HMI ay sariling drawing (vector, magaan), hindi kopya ng larawan.

## 1. Mga desisyon sa disenyo (para sa lahat ng screen)

| Bagay | Desisyon | Bakit |
|---|---|---|
| Frame ng screen | Title bar (numero ng screen + pangalan + process header MSP ~ PWR), alarm banner, process mimic, navigation bar sa ibaba papunta sa kaugnay na screen | Gaya ng operator station ng tunay na DCS |
| Art | **Cutaway** (user 2026-10-27: "yung cutaway muna gawin. temporary"; napili sa 3 proposal: Steel, Cutaway, Thermal, `/mnt/project-files/hmi-proposals-2026-10-27/`). Maliwanag na engineering illustration, bawat vessel at duct ay naka-section | Kita ng operator ang proseso sa loob |
| Background | Maliwanag na abo (#d5d9dc), madilim na text at value | Malinaw sa liwanag ng control room |
| Equipment | Naka-section: furnace (apoy at bed na kumukupas ayon sa live bed temp; malamig = abo), drum na may tubig, cyclone na may umiikot na solids, loop seal, backpass na may tube banks (RH / SH pula, ECO asul), tubular APH (air kaliwa, gas kanan), ESP, fan na may motor, stack na may usok | Mukhang planta, hindi block diagram |
| Duct | Pader na madilim, loob na kulay ng medium (cold air asul, hot air amber, flue gas kayumanggi, malamig na gas abo) na may gumagalaw na particle; walang daloy (fan stop) = abo at walang particle | Kita ang daloy at kung saan tumigil |
| Instrumento | Tag + puting value box, madilim na mono na numero at unit. Walang signal = "-----" | Ang value ay nasa sinusukat |
| Control loop | Faceplate sa mimic: tag, mode pill (AUT / MAN / CAS), PV, SV, MV bar. Click = buong faceplate | Diretso sa operasyon |
| Estado | Umiikot ang fan habang 1 ang run bit; motor pula = running, berde = stop; damper blade umiikot ayon sa tunay na posisyon | Kumbensyon ng planta, galing sa logic |
| Side panel | Combustion summary, bed temperature bar (18 TE), estado ng fan, alarm | Buod bago ang detalye |
| Laki | SVG lang (walang larawan). Ang lumang 1:1 HMI ay may 3.7 MB na larawan (`hmibg.js`) | Magaan sa phone at tablet |

## 2. Mga system ng bagong HMI (iminumungkahing set)

Pinagsama ang ilang lumang screen para mas kaunti ang lipat-lipat. Ang "logic" ay ang ABC sheet na pinanggagalingan ng live value at ng faceplate.

| # | Screen (bago) | Gabay na snapshot | Daloy at equipment | Control loops / logic |
|---|---|---|---|---|
| 1 | **Unit overview** | UNIT (app), 4.PNG, 33.PNG | Coal + air → furnace → drum → SH → turbine → MW; buod ng bawat system, alarm | ABC-001A/B/C/D CCS, ABC-002 |
| 2 | **Air & flue gas** (SAMPLE, tapos) | 7.PNG, 8.PNG, 9.png, 38.PNG | Atm → SAF / PAF (inlet damper) → APH → hot SA sa wall, hot PA sa plenum; furnace → cyclone A/B (seal pot, FA blowers) → backpass (RH / SH pass, biasing damper, ECO) → APH → ESP → IDF (inlet vane + hydraulic coupling) → stack | PICFG108, PICFG108A (ABC-008), AICFG112 (ABC-002), FICFA1071/1081 (ABC-007), FICFA1055A/B (ABC-014), HICHR1002A/B (ABC-020), TAF (ABC-006) |
| 3 | Furnace SA wall dampers | 8.PNG | Hot SA header → front / rear wall upper & lower dampers MCVFA1005 ~ 1026 → furnace; bed temps | HICFA1005 ~ 1026 (ABC-015 / 016), bias HICFABIASU/L (ABC-057), ABC-026 / 027 |
| 4 | Fluidizing air & seal pots | 9.png | FA blower A/B → silencer / discharge SOV → seal pot A/B; cyclone outlet temps | FICFA1055A/B (ABC-014) |
| 5 | Coal feeders | 11.png | Bunker → feeder A/B/C → furnace; coal master | FIC-CM, feeders (ABC-004A/B/C), ABC-009A screw coolers |
| 6 | Start-up burners & diesel oil | 12 ~ 15.PNG, 6.PNG | Oil pump → header → burner A ~ D (valves, flame, air) → return | ABC-003A ~ E, ABC-028 / 029 |
| 7 | Main water / steam | 03.png | Deaerator → BFP → FW control → ECO → drum → SH 1/2/finish + spray → main steam | ABC-010 drum level, ABC-011 / 012 SH temp, ABC-013 blow-off |
| 8 | Reheat, bypass, extraction | 5.png, 39.PNG, 4.PNG | HP turbine → cold RH → RH → hot RH → IP; HP / LP bypass; extraction to heaters | ABC-019 / 020 RH temp & dampers, ABC-050 / 051 / 052 bypass, ABC-054 / 055 |
| 9 | Feedwater heaters & condensate | 02.png, 28.png | Condenser → CP → LPH 1/2/3 → deaerator → HPH 1/2 | ABC-031 / 032, ABC-035 ~ 039, ABC-056 |
| 10 | Turbine & generator | 36.PNG, 37.PNG, P35SHAFT | Oil pumps, oil cooler, shaft, generator breakers | ABC-053, TCS (plant model) |
| 11 | CCS | 33.PNG | ULD → boiler master / turbine master / coal master | ABC-001A/B/C/D |
| 12 | Auxiliaries | 27, 29, 30, 21.PNG | Aux steam, closed cooling, seawater, sampling | ABC-030, ABC-033 / 034, ABC-017 |
| 13 | Ash & additives | 16, 18, 19, 20.PNG | Bottom ash coolers, sootblowers, limestone, sand | ABC-009A/B, ABC-005, DITL BA / LS / sand / sootblower |
| 14 | **Permissives & MFT** (bago) | SCSHOT.JPG (010 furnace purge) | Purge permissives, MFT first-out, fan trip first-out | DITL (MFT, purge), ABC-007 M.0182 |

## 3. Air & flue gas (sample): ano ang live

- **89 / 89** na item ng screen ay may source sa logic (sukat ng app: LIVE 89 / 89).
- Hindi ipinakita sa sample dahil **walang signal sa ABC / DITL logic** (nasa I/O list lang, kaya walang value na maibibigay ang simulation): backpass gas temps TIFG1100 ~ 1113, cyclone outlet TIFG1095/1096, seal pot P/T PIFG1009 / TIFG1009, ESP / APH gas pressure PIFG1121 / 1134 / 1141, APH outlet gas temp TIFG1132 / 1133, fan currents IIF1053 / 1054 / 1056, stack CEMS (O2, NOx, CO, SOx). Kailangan ng plant model value para dito (hiwalay na gawain ng plant model).
- Nakita sa Cold start (plant model, hindi HMI): PIFA1088, PIFA1085, TIFA1086 / 1087 / 1076 / 1077 ay nananatili sa 150 MW na value kahit patay ang fans. Ibibigay sa plant model thread.

## 4. Susunod

1. Aprubahan ng user ang style ng sample.
2. Gawin ang screen 1 ~ 14 sa parehong library (`src/ui/plant/hmi2.js`).
3. Kapag kumpleto, tanggalin ang lumang Plant HMI (`systems.js`, `hmibg.js` 3.7 MB) sa iisang update.
