# Paano i-check ang M2 at M3 sa app (2.2.0-beta.13)

Simple lang: nasa app na ang check. Isang pindot bawat scenario, tapos ✓ / ✗ sa bawat inaasahang resulta.

## Hakbang
1. Buksan ang app (html ng Beta, exe, o apk). Analog (ABC) ang nakabukas.
2. Pindutin ang **CHECK** (asul na button sa ibabang kaliwa, katabi ng UAT).
3. Sa bawat scenario, pindutin **▶ Takbo**. Ang app mismo ang gagawa ng:
   - Start at 150 MW (HMI snapshot),
   - hakbang ng operator (hal. TARGET MW 60, A / M sa faceplate, MV 100 %),
   - signal ng DITL na forced (hal. MFT, fan trip; CLAUDE.md 7),
   - mabilis na pagtakbo ng planta (M3: ~5 ~ 20 s; M2: ~3 min, may progress bar).
4. Tingnan ang resulta: **PASADO n / n** (lahat ✓) o **MAY MALI** (may ✗, nakasulat ang nakuhang value).
5. Pagkatapos ng scenario, nakatigil ang simulation sa huling estado: buksan ang **PLANT → UNIT** o ang sheet (hal. ABC-001C, ABC-010) para makita ang mga value at mode. Pindutin ▶ Run kung gusto mong ipagpatuloy.

## Ang 7 scenario at ang inaasahan
| Scenario | Ginagawa ng app | Inaasahan (✓) |
|---|---|---|
| **M2 · Load 150 → 60 → 150 MW** | TARGET MW 60 sa HIC-ULD (3 MW/min); sa ilalim ng 220 T/H M ang boiler master (BU-CMD), operator ang humahawak ng pressure at naglalagay ng O2 trim sa 50 %; pabalik: A sa HIC-BM / EIC-TM sa itaas ng 230 T/H, TARGET 150 | 60 MW: MW 60, MSF 204, coal 42, MSP sa SV, MST 517, RHT 499, RHP 15.0 (±5 %, 02.png), O2 5 ~ 12 %; 150 MW: MW 150, MSF 474, MST / RHT 542, RHP 34 (4.PNG); boiler master nanatiling M hanggang pinindot ang A; walang trip |
| **M3 · Turbine trip** | ABC-050 S2 I.0400 = 1; MFT (DITL: TURBINE TRIP = MFT first out, memory list STN104) | M.3200 sa ABC-001C / 010; HIC-BM at EIC-TM M; HP / LP bypass at blow-off bumukas; MW 0 sa 60 s; MSP ≤ 150 tapos bumababa; coal 0 |
| **M3 · MFT** | I.000F = 1, M.0341 pulse, feeders stopped | coal 0 sa 10 s; SH spray 0 %; PA / SA master M; O2 21 %; MST bumababa; MSP → LOW LOW 72.9 (M.310D → DITL-40) |
| **M3 · BFWP trip** | M.3343 = 0 (B standby) | FW 0 sa 3 s; FICFW1007 force manual (M.0228); HP bypass BU-CMD sa 15 s; drum level −254 mm sa ~30 s → MFT |
| **M3 · IDF trip** | M.3304 = 0 | PICFG108 force manual, demand 0 % hawak; furnace HIGH > 30 sa ~12 s; H.H. > 300 sa ~1 min → MFT + PAF / SAF trip |
| **M3 · PAF trip** | M.3302 = 0 | PA 0; FICFA1071 M; furnace pressure bumababa, IDF (AUTO) bumababa; coal pinutol ng LN40; MFT → coal 0, O2 21 |
| **M3 · Drum level HH** | FICFW1007: L, M, MV 100 % | FW 501 → ~550; drum level +254 mm sa ~3.5 min → MFT |

## Kung gusto mong gawin nang mano-mano (gaya ng operator)
- Start: ⚙ → **Start at 150 MW (HMI snapshot)**, speed **60x**, ▶ Run.
- Trip input: buksan ang sheet (hal. ABC-050), **Panel** → **Buttons (digital inputs)** → hanapin ang address (hal. `S2 I.0400`) → **ON**. Mula beta.13, ang iisang address ay iisang halaga sa lahat ng sheet ng station (hal. I.000F ng STN101: isang pindot sa alinmang sheet ng station 1). Ang I.000F ng STN102 / 103 ay sariling input (MFT FROM IRP ng bawat station): pindutin din kung kailangan.
- Faceplate: **Panel** → **Controllers (faceplate)** → tag → A / M / R / L, SV, MV.
- Tingnan: **PLANT → UNIT** (MW, MSP, MSF, coal, FW, drum level, temperatura, O2, furnace pressure, 21 faceplate) o ang **Logic flags** ng sheet (hal. ABC-001C M.2013, ABC-010 M.0170 ~ M.0175).

## Saan galing ang inaasahang value
- Drawing (ABC PDF): force manual, BU-CMD, interlock, limit (`DRAWING_TRACE.md`).
- HMI snapshot: 02.png (60 MW), 4.PNG / 03.png (150 MW): operating point (`docs/hmi/OPERATING_POINTS.md`).
- Boiler manual SECT_7 (curves vs load), procedure PR-OPE-5002 / 5003, memory list STN104 (MFT first out).
- Parehong tseke ng `tests/regress/unit_load.js`, `unit_trip.js`, at `check_panel.js` (headless).
