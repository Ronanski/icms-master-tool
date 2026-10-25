# ATS (Automatic Turbine Start-up) — mga criteria ng bawat step, at ano ang wala pa sa app

Batayan: `document-references/tcs-references/310SC90-776 (ATS Criteria).pdf` (MHPS, Rev 0, 2015-05-29), page 2 (GENERAL), page 3 (ATS CRITERIA TABLE FOR IP START MODE), page 5 ~ 16 (CRITERIA LIST). Ang sequence ay nasa `310SC90-775 (ATS Sequence).pdf` (page 13 HP turbine warming, 14 ~ 16 preparation, 17 ~ 18 rub check, 19 ~ 22 acceleration, 24 ~ 25 synch, 26 ~ 27 load up, 28 normal operation).

Basa (page 2):
- **A** = STEP IN CONDITION: kailangang tama bago pumasok sa step.
- **B** = STEP CRITERIA: binabantayan habang tumatakbo ang step. Kapag nawala, hihinto ang step (PR-OPE-5002 7564).
- **D** = STEP OUT: kondisyon kung tapos na ang step.
- △ = sequential action lang.

Mga step: 0 HP TBN WARMING, 1 PREPARATION, 2 RUB CHECK, 3 ACCELERATION, 4 EXCITATION, 5 SYNCH & INITIAL LOAD, 6 LOAD UP, 7 NORMAL OPERATION, 8 SHUTDOWN.

## Talaan (page 3, IP start mode) laban sa app 3.2.0-beta.37

Ang "App" ay kung binabasa ito ng turbine model ngayon (`src/analog/engine/unit.js` anTurbine at anUnitStep). Ang turbine sa app ay black box pa: off → roll → sync → load.

| No. | Criteria | Ginagamit sa step | App beta.37 |
|---|---|---|---|
| 1.1 | TSI OK | B1, A2 ~ B7 | WALA |
| 1.2 | TCS NORMAL | B1, A2 ~ B7 | WALA |
| 1.3 | Main steam press. not low | B1, A2 ~ B7 | WALA (roll kahit anong pressure) |
| 1.4 | Main steam temp. not low | B1, A2 ~ B7 | WALA |
| 1.5 | Reheat steam press. not low | B1, A2 ~ B5 | WALA |
| 1.6 | Reheat steam temp. not low | B1, A2 ~ B5 | WALA |
| 1.71 | MS temp. mismatch OK (MSV inlet laban sa HP 1st stage metal) | A2, A3 | WALA (walang metal temp) |
| 1.72 | RH temp. mismatch OK (laban sa reheat bowl metal) | A2, A3 | WALA |
| 1.8 | HP / LP bypass control in AUTO | B1, A2 ~ B6 | WALA (hindi binabasa) |
| 1.10 | Gland steam seal header press. not low | A0, B0, B1, A2 ~ B7 | WALA (walang gland / aux steam header) |
| 1.11 | Condenser vacuum OK | A0, B0, B1, A2 ~ B7, HOLD | MAYROON: roll kailangan ng vacuum ≥ 90 %; trip sa < 60 % |
| 1.12 | LP exhaust hood temp. not high | B1, A2 ~ B7, HOLD | WALA |
| 1.14 | Control oil press. not low | B1, A2 ~ B7 | WALA |
| 1.15 | Bearing oil press. not low | A0, B0, B1, A2 ~ B7, HOLD | WALA (walang lube oil) |
| 1.16 | Bearing oil temp. OK | A0, B0, B1, A2 ~ B7 | WALA |
| 1.17 | Main oil tank level OK | B1, A2 ~ B7 | WALA |
| 1.18 | MOT vapour extractor running | A0, B0, B1, A2 ~ B7 | WALA |
| 1.19 | Turbine turning (turning gear) | A0, B0, A1, A2 | WALA |
| 1.20 ~ 1.23 | Turbine reset, MSV open, RSV open, load limiter upper | A1 (△), B1 ~ B7 | WALA (isang "roll" lang) |
| 1.24, 1.27 ~ 1.31 | Vibration, eccentricity, diff. expansion, rotor position, bearing / thrust metal temp. | B1 ~ B7 | WALA |
| 1.25 | Drain valve open | B1 ~ A6 | WALA |
| 1.32 ~ 1.35 | MSV / CV chest, HP 1st stage, reheat bowl temp. diff. OK | B1 ~ B7 (1.33 A1 rin) | WALA |
| 1.40, 1.41 | Generator temp., walang electrical trip demand | A0 ~ B7 | WALA |
| 1.42 ~ 1.47 | AVR OK / AUTO, 41 (field breaker) closed, gen. voltage OK, ASD, DISCON closed | A4 ~ B7 | WALA (walang excitation step) |
| 1.48 | 52G closed | A5 (△) ~ B7 | MAYROON (SYNC nagsasara ng GCB, I.0931) |
| 2.3 | Rub check complete speed | A2, B2 | WALA (diretso 3600 rpm) |
| 2.4 | Turbine rated speed | A3 ~ D3, A4 | MAYROON (sync kailangan 3600 rpm) |
| 2.5 | Gen. load > initial load | A5, B5 | MAYROON (initial load 4.5 MW) |
| 2.6 | IP to HP transfer complete | A6, B6 | MAYROON (transfer sa 20 MW) |
| 2.81 ~ 2.85 | CV chest warming | A1 (△) | WALA |
| 2.92 | HP turbine warming complete | A0, B0 | WALA |

**Buod:** sa 40 linya, 5 lang ang nasa app. Ang iba ay hindi "field step": bahagi sila ng TCS at dapat ay may model at test (user, 2026-10-25: "wala ka pang turbine model at TCS").

Hindi pa nababasa: ang mga set point (page 5 ~ 15 "NOT LESS THAN"; page 21 Fig. 2 / 3 allowable mismatch) at ang sequence page 13 ~ 28. Iyon ang susunod bago gawin ang model.
