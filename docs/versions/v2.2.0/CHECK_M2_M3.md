# Paano i-check ang M2, M3 at M4 sa app (2.2.0-beta.15)

Simple lang: nasa app na ang check. Isang pindot bawat scenario, tapos ✓ / ✗ sa bawat inaasahang resulta.

## Hakbang
1. Buksan ang app (html ng Beta, exe, o apk). Analog (ABC) ang nakabukas.
2. Pindutin ang **CHECK** (asul na button sa ibabang kaliwa, katabi ng UAT).
3. Sa bawat scenario, pindutin **▶ Takbo**. Ang app mismo ang gagawa ng:
   - Start at 150 MW (HMI snapshot), o **Start cold** sa M4 (drum 0 kg/cm2, tubig at bed 30 °C, walang apoy), o **Start warm** (dulo ng cold start: 30 kg/cm2, bed 480 °C, 4 burner),
   - hakbang ng operator (hal. TARGET MW 60, A / M sa faceplate, MV 100 %),
   - signal ng DITL na forced (hal. MFT, fan trip; CLAUDE.md 7),
   - mabilis na pagtakbo ng planta (M3: ~5 ~ 20 s; M2: ~3 min, may progress bar).
4. Tingnan ang resulta: **PASADO n / n** (lahat ✓) o **MAY MALI** (may ✗, nakasulat ang nakuhang value).
5. Pagkatapos ng scenario, nakatigil ang simulation sa huling estado: buksan ang **PLANT → UNIT** o ang sheet (hal. ABC-001C, ABC-010) para makita ang mga value at mode. Pindutin ▶ Run kung gusto mong ipagpatuloy.

## Ang 9 scenario at ang inaasahan
| Scenario | Ginagawa ng app | Inaasahan (✓) |
|---|---|---|
| **M2 · Load 150 → 60 → 150 MW** | TARGET MW 60 sa HIC-ULD (3 MW/min); sa ilalim ng 220 T/H M ang boiler master (BU-CMD), operator ang humahawak ng pressure at naglalagay ng O2 trim sa 50 %; pabalik: A sa HIC-BM / EIC-TM sa itaas ng 230 T/H, TARGET 150 | 60 MW: MW 60, MSF 204, coal 42, MSP sa SV, MST 517, RHT 499, RHP 15.0 (±5 %, 02.png), O2 5 ~ 12 %; 150 MW: MW 150, MSF 474, MST / RHT 542, RHP 34 (4.PNG); boiler master nanatiling M hanggang pinindot ang A; walang trip |
| **M3 · Turbine trip** | ABC-050 S2 I.0400 = 1; MFT (DITL: TURBINE TRIP = MFT first out, memory list STN104) | M.3200 sa ABC-001C / 010; HIC-BM at EIC-TM M; HP / LP bypass at blow-off bumukas; MW 0 sa 60 s; MSP ≤ 150 tapos bumababa; coal 0 |
| **M3 · MFT** | I.000F = 1, M.0341 pulse, feeders stopped | coal 0 sa 10 s; SH spray 0 %; PA / SA master M; O2 21 %; MST bumababa; MSP → LOW LOW 72.9 (M.310D → DITL-40) |
| **M3 · BFWP trip** | M.3343 = 0 (B standby) | FW 0 sa 3 s; FICFW1007 force manual (M.0228); HP bypass BU-CMD sa 15 s; drum level −254 mm sa ~30 s → MFT |
| **M3 · IDF trip** | M.3304 = 0 | PICFG108 force manual, demand 0 % hawak; furnace HIGH > 30 sa ~12 s; H.H. > 300 sa ~1 min → MFT + PAF / SAF trip |
| **M3 · PAF trip** | M.3302 = 0 | PA 0; FICFA1071 M; furnace pressure bumababa, IDF (AUTO) bumababa; coal pinutol ng LN40; MFT → coal 0, O2 21 |
| **M3 · Drum level HH** | FICFW1007: L, M, MV 100 % | FW 501 → ~550; drum level +254 mm sa ~3.5 min → MFT |
| **M4 · Cold start: purge, light-off, pressure raise** (beta.14) | Start cold; PAF / SAF / IDF start; PA / SA M 35 % purge 5 min; oil valves ng burner A / B bukas (ABC-004A: dalawang input ng AND M.3410 / 3411 = 0), BURNER IN SERVICE M.3412 / 3413 (DITL forced), FICDO1043A / B M 60 %, hangin 10 %; binabantayan ang saturation rate (Fig 1 ≤ 110 °C/h: +10 % oil kapag < 80, −10 % kapag > 100), burner C / D sa 15 kg/cm2; tigil sa 30 kg/cm2 (~3 min) | purge air > 150 T/H; oil A / B > 0.5 T/H; tubig 30 → 100 °C bago may pressure; 0 → 30 kg/cm2 sa loob ng 3 h; saturation ≤ 110 °C/h; bed ≥ 400 °C; furnace −50 ~ +30 mmH2O (PICFG108 M: force manual ng drawing sa MV < 14 %); MST ≥ saturation at ≤ 535 °C; MW 0, coal 0; drum level ±150 mm |
| **M4 · Coal transfer: batch → feeders → retract ng burners** (beta.15) | Start warm; LICBR1001B A SV 0; blow-off A SV 35; FIC-CF M 10 % (4 T/H minimum); batch ng feeder A (M.3400 10 s / 60 s) hanggang bed 600 °C; feeder A tuluy-tuloy + A (AUTO) pagkatapos tumakbo; oil −5 % / min; feeder B; bed 650: feeder C; FIC-CF 15 % habang ≤ 110 °C/h; bed 700: retract A, D, B, C; O2 3.5 ~ 5.5 (PA / SA, floor 10 %); FIC-CM A (~2.5 min) | coal nasusunog lang sa mainit na bed; bed ≥ 750 °C; 3 feeder AUTO ~6 T/H; oil 0; O2 3 ~ 10 %; MSP < 125, saturation ≤ 110 °C/h; drum level ±150 mm (LICBR1001B); FIC-CM MANUAL ayon sa drawing M.0130 (REMOTE ng FIC-CF / PA / SA sa hakbang 4), SV = coal; MW 0, walang trip |

## Kung gusto mong gawin nang mano-mano (gaya ng operator)
- Start: ⚙ → **Start at 150 MW (HMI snapshot)**, speed **60x**, ▶ Run. Para sa M4: ⚙ → **Start cold (M4 start-up)**, speed 300x; fans ON (M.3302 / 3303 / 3304), FICFA1071 / 1081 M 35 %, pagkatapos ng 5 min: ABC-004A Buttons → dalawang input ng AND M.3410 at M.3411 OFF, M.3412 / 3413 ON, FICDO1043A / B M 60 %, FICFA1071 / 1081 M 10 %; tingnan sa PLANT → UNIT ang oil, bed (UNIT.Tb), tubig (UNIT.Tw), drum pressure. Coal transfer: ⚙ → **Start warm**, tapos ang mga hakbang sa UPDATE_REPORT beta.15 ("Ano ang makikita ng operator").
- Trip input: buksan ang sheet (hal. ABC-050), **Panel** → **Buttons (digital inputs)** → hanapin ang address (hal. `S2 I.0400`) → **ON**. Mula beta.13, ang iisang address ay iisang halaga sa lahat ng sheet ng station (hal. I.000F ng STN101: isang pindot sa alinmang sheet ng station 1). Ang I.000F ng STN102 / 103 ay sariling input (MFT FROM IRP ng bawat station): pindutin din kung kailangan.
- Faceplate: **Panel** → **Controllers (faceplate)** → tag → A / M / R / L, SV, MV.
- Tingnan: **PLANT → UNIT** (MW, MSP, MSF, coal, FW, drum level, temperatura, O2, furnace pressure, 21 faceplate) o ang **Logic flags** ng sheet (hal. ABC-001C M.2013, ABC-010 M.0170 ~ M.0175).

## Saan galing ang inaasahang value
- Drawing (ABC PDF): force manual, BU-CMD, interlock, limit (`DRAWING_TRACE.md`).
- HMI snapshot: 02.png (60 MW), 4.PNG / 03.png (150 MW): operating point (`docs/hmi/OPERATING_POINTS.md`).
- Boiler manual SECT_7 (curves vs load), procedure PR-OPE-5002 / 5003, memory list STN104 (MFT first out).
- Parehong tseke ng `tests/regress/unit_load.js`, `unit_trip.js`, at `check_panel.js` (headless).
