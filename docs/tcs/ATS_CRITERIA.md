# ATS (Automatic Turbine Start-up) — mga criteria ng bawat step, at ano ang wala pa sa app

Batayan: `document-references/tcs-references/310SC90-776 (ATS Criteria).pdf` (MHPS, Rev 0, 2015-05-29), page 2 (GENERAL), page 3 (ATS CRITERIA TABLE FOR IP START MODE), page 5 ~ 16 (CRITERIA LIST). Ang sequence ay nasa `310SC90-775 (ATS Sequence).pdf` (page 13 HP turbine warming, 14 ~ 16 preparation, 17 ~ 18 rub check, 19 ~ 22 acceleration, 24 ~ 25 synch, 26 ~ 27 load up, 28 normal operation).

Basa (page 2):
- **A** = STEP IN CONDITION: kailangang tama bago pumasok sa step.
- **B** = STEP CRITERIA: binabantayan habang tumatakbo ang step. Kapag nawala, hihinto ang step (PR-OPE-5002 7564).
- **D** = STEP OUT: kondisyon kung tapos na ang step.
- △ = sequential action lang.

Mga step: 0 HP TBN WARMING, 1 PREPARATION, 2 RUB CHECK, 3 ACCELERATION, 4 EXCITATION, 5 SYNCH & INITIAL LOAD, 6 LOAD UP, 7 NORMAL OPERATION, 8 SHUTDOWN.

## Talaan (page 3, IP start mode) laban sa app

Ang "App beta.38" ay kung binabasa ito ng TCS model (`src/analog/engine/tcs.js`, `tcsCrit`). Ang "beta.37" ay ang dati (turbine na black box: off → roll → sync → load).

| No. | Criteria | Ginagamit sa step | beta.37 | App beta.38 |
|---|---|---|---|---|
| 1.1 / 1.2 | TSI OK, TCS NORMAL | B1, A2 ~ B7 | WALA | WALA pa (walang TSI fault sa model; laging OK) |
| 1.3 | Main steam press. not low | B1, A2 ~ B7 | WALA | MAYROON: cold 60, warm 81.6, hot 110 kg/cm2 (PR-OPE-5002 8254 / 8407) |
| 1.4 | Main steam temp. not low | B1, A2 ~ B7 | WALA | MAYROON: ≥ 400 °C (hot 455) |
| 1.5 | Reheat steam press. not low | B1, A2 ~ B5 | WALA | MAYROON: ≥ 7.5 kg/cm2 |
| 1.6 | Reheat steam temp. not low | B1, A2 ~ B5 | WALA | MAYROON: ≥ 415 °C (hot 485) |
| 1.71 | MS temp. mismatch OK | A2, A3 | WALA | MAYROON: Fig. 2 (page 21) laban sa HP first stage metal |
| 1.72 | RH temp. mismatch OK | A2, A3 | WALA | MAYROON: Fig. 3 laban sa reheat bowl metal |
| 1.8 | HP / LP bypass control in AUTO | B1, A2 ~ B6 | WALA | MAYROON: PICMS1006 at PICHR1003 sa AUTO |
| 1.10 | Gland steam seal header press. not low | A0 ~ B7 | WALA | MAYROON: gland sealing (aux > 7, turning gear, vacuum breaker bukas) |
| 1.11 | Condenser vacuum OK | A0 ~ B7, HOLD | MAYROON | MAYROON: ≥ 90 %, vacuum up kailangan ng aux > 10, gland, sarado ang vacuum breaker, ejector |
| 1.12 | LP exhaust hood temp. not high | B1, A2 ~ B7, HOLD | WALA | MAYROON: ≤ 80 °C; ang initial load ay hawak hanggang < 52 °C (PR-OPE-5002 9123) |
| 1.14 | Control oil press. not low | B1, A2 ~ B7 | WALA | MAYROON: EH oil pump |
| 1.15 / 1.16 | Bearing oil press. / temp. | A0 ~ B7, HOLD | WALA | MAYROON: lube oil pump; trip kapag nawala habang umiikot |
| 1.17 | Main oil tank level OK | B1, A2 ~ B7 | WALA | laging OK (walang leak sa model) |
| 1.18 | MOT vapour extractor running | A0 ~ B7 | WALA | MAYROON |
| 1.19 | Turbine turning (turning gear) | A0, B0, A1, A2 | WALA | MAYROON: 3 rpm, kailangan ng lube oil |
| 1.20 / 1.21 | Turbine reset, MSV open | A1 (△), B1 ~ B7 | WALA | MAYROON: sa dulo ng PREPARATION |
| 1.24 ~ 1.31 | Vibration, eccentricity, diff. expansion, bearing metal | B1 ~ B7 | WALA | WALA pa (laging OK; walang mekanikal na fault) |
| 1.32 ~ 1.35 | Chest / metal temp. diff. OK | B1 ~ B7 | WALA | bahagi: CV chest inner / outer sa PREPARATION |
| 1.42 ~ 1.47 | AVR / excitation / gen. voltage | A4 ~ B7 | WALA | MAYROON: step 4 EXCITATION (30 s) |
| 1.48 | 52G closed | A5 (△) ~ B7 | MAYROON | MAYROON |
| 2.3 | Rub check complete speed | A2, B2 | WALA | MAYROON: 200 rpm, coast < 100 rpm (ambient cold at cold 1 lang) |
| 2.4 | Turbine rated speed | A3 ~ D3, A4 | MAYROON | MAYROON: 1800 at 3600 rpm heat soak (Fig. 1 / 2), walang hold sa 1372 ~ 1723 rpm |
| 2.5 | Gen. load > initial load | A5, B5 | MAYROON | MAYROON: 3 % (hot 5 %), hold 40 / 15 / 0 min (Fig. 3) |
| 2.6 | IP to HP transfer complete | A6, B6 | MAYROON | MAYROON |
| 2.81 ~ 2.85 | CV chest warming | A1 (△) | WALA | MAYROON: 60 min, o diff < 50 °C at outer > 180 °C |
| 2.92 | HP turbine warming complete | A0, B0 | WALA | MAYROON: HP metal > 150 °C |

**Buod beta.38:** ang wala pang model: TSI / TCS fault, vibration, eccentricity, diff. expansion, bearing metal, MOT level (laging OK: ideal na planta, desisyon ng user 2026-10-17; magagamit lang bilang sinadyang fault sa susunod).

**Steam sa roll (boiler side):** ang SH / RH outlet sa start-up ay sumusunod sa FHI SECT_7 Fig. 2 / 3 / 4 (cold 418 °C, warm 430 °C, hot 490 °C mula roll hanggang transfer; 505 °C sa 30 % load; 541 °C mula 60 %). Ang dating extrapolation ng load test ay 468 °C sa 12 % load: hindi makaka-roll. Ang SH at RH spray ay hindi makakatulong doon ayon sa drawing (DITL-33: SOV bukas lang kapag finishing SH inlet ≥ 350 °C at steam > 46 T/H; DITL-35: RH spray pagkatapos lang ng ICV → CV transfer).

Mga numerong hindi mabasa sa drawing ("REFER TO IBD"): kinuha sa PR-OPE-5002. Ang time constant ng metal ng turbine ay ASSUMED (wala sa repo ang heat capacity ng turbine), nakasulat sa `tcs.js`.
