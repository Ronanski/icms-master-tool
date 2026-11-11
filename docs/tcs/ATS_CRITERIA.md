# ATS (Automatic Turbine Start-up) — mga criteria ng bawat step, at ano ang wala pa sa app

Batayan: `document-references/tcs-references/310SC90-776 (ATS Criteria).pdf` (MHPS, Rev 0, 2015-05-29), page 2 (GENERAL), page 3 (ATS CRITERIA TABLE FOR IP START MODE), page 5 ~ 16 (CRITERIA LIST). Ang sequence ay nasa `310SC90-775 (ATS Sequence).pdf` (page 13 HP turbine warming, 14 ~ 16 preparation, 17 ~ 18 rub check, 19 ~ 22 acceleration, 24 ~ 25 synch, 26 ~ 27 load up, 28 normal operation).

Basa (page 2):
- **A** = STEP IN CONDITION: kailangang tama bago pumasok sa step.
- **B** = STEP CRITERIA: binabantayan habang tumatakbo ang step. Kapag nawala, hihinto ang step (PR-OPE-5002 7564).
- **D** = STEP OUT: kondisyon kung tapos na ang step.
- △ = sequential action lang.

Mga step: 0 HP TBN WARMING, 1 PREPARATION, 2 RUB CHECK, 3 ACCELERATION, 4 EXCITATION, 5 SYNCH & INITIAL LOAD, 6 LOAD UP, 7 NORMAL OPERATION, 8 SHUTDOWN.

## Talaan (page 3, IP start mode) laban sa app

Binasa ulit ang page 3 noong 2026-11-08: ang dating talaan ay isang column ang layo (hal. 2.3 ay D2 at A3, hindi A2 at B2). Ang "Ginagamit" ay mula sa scan; △ = sequential action; HOLD = hold column. App = `src/analog/engine/tcs.js` (`tcsCrit`, `TCS_A`, `TCS_B`). Ang mga listahan ng A / B sa code ay hindi pa ganap na tugma sa scan (TCS_A[1], TCS_A[7], walang 2.3 / 2.5 / 2.7 sa mga A).

| No. | Criteria | Ginagamit (776 p.3) | App 3.2.1 |
|---|---|---|---|
| 1.1 / 1.2 | TSI OK, TCS NORMAL | B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 | Wala (laging OK; walang TSI fault sa model) |
| 1.3 / 1.4 | Main steam press. / temp. not low | B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 | Mayroon: PR-OPE-5002 (cold 60, warm 81.6, hot 110 kg/cm2; ≥ 400 °C, hot 455). 776 p.5: blangko ang numero |
| 1.5 / 1.6 | Reheat steam press. / temp. not low | B1 A2 B2 A3 B3 A4 B4 A5 B5 | Mayroon: ≥ 7.0 kg/cm2, ≥ 415 °C (hot 485), PR-OPE-5002 |
| 1.71 / 1.72 | MS / RH temp. mismatch OK | A2 A3 | Mayroon: upper limit hanggang target (776 p.5, Fig. 2 / 3 p.21). Step-in lang |
| 1.8 | HP / LP bypass control in AUTO | B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 | Mayroon: PICMS1006 at PICHR1003 sa AUTO |
| 1.10 | Gland steam seal header press. not low | A0 B0 B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 | Proxy: gland sealing at aux > 7 (IBD TD-3 ≤ 0.1 kg/cm2g, hindi pa ginagamit) |
| 1.11 | Condenser vacuum OK | A0 B0 B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 HOLD | Mayroon: IBD TA-10 band, LOW ON ≥ 0.14, OFF ≤ 0.12 kg/cm2 abs |
| 1.12 | LP exhaust hood temp. not high | B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 HOLD | Mayroon: IBD TA-14 band, ON ≥ 80, OFF ≤ 77 °C |
| 1.14 | Control oil press. not low | B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 | Mayroon: IBD TA-13 band, ON ≤ 133, OFF ≥ 138 kg/cm2g |
| 1.15 | Bearing oil press. not low | A0 B0 B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 HOLD | Mayroon: IBD TA-13 band, ON ≤ 1.05, OFF ≥ 1.33 kg/cm2g |
| 1.16 | Bearing oil temp. OK | A0 B0 B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 | Proxy: oil in service (IBD TD-1 temperature windows, hindi pa ginagamit) |
| 1.17 | Main oil tank level OK | B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 | Laging OK |
| 1.18 | MOT vapour extractor running | A0 B0 B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 | Mayroon |
| 1.19 | Turbine turning | A0 B0 B1 A2 | Mayroon: turning gear o ≥ 4 rpm |
| 1.20 | Turbine reset | B1△ D1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 | Mayroon: walang turbine trip (TA-1) |
| 1.21 | MSV open | B1△ D1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 | Mayroon: reset ng step 1 |
| 1.22 / 1.23 / 1.25 | RSV, load limiter, drains | D1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 B1△ | Wala pa |
| 1.24 | Vibration not high | B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 HOLD | Wala (walang vibration model; IBD TA-18 ≥ 0.125 mm) |
| 1.27 ~ 1.31 | Eccentricity, diff. expansion, metal temps | B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 HOLD | Wala (laging OK) |
| 1.32 ~ 1.35 | Chest / metal temp. diff. OK | B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 D1 | Bahagi: CV chest sa step 1; Fig. 4 ~ 7 wala pa |
| 1.40 / 1.41 | (776 p.3) | A0 B0 B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 B7 | Wala pa |
| 1.42 ~ 1.47 | AVR / excitation / gen. voltage | D4 A5 B5 A6 B6 B7 A4 B4 | Mayroon: G-4 logic (41 sa rated speed, voltage), tcs-gen.js |
| 1.48 | 52G closed | B5△ D5 A6 B6 B7 | Mayroon: G-1B close order |
| 1.49 ~ 1.51 | 52G open, 41 open, turbine tripped | B8△ D8 | Mayroon: step 8 SHUT-DOWN |
| 1.52 | (776 p.3) | B5△ | Wala pa |
| 2.1 | Shell expansion OK | B3△ | Mayroon: > 3 mm pagkatapos ng 1800 soak |
| 2.3 | Rub check complete speed | D2 A3 | Mayroon: Fig. 1 p.14 (coast < 100 rpm; hindi kailangan maliban sa ambient cold / cold 1) |
| 2.4 | Turbine rated speed | D3 A4 B4 A5 | Mayroon: > 3550 rpm |
| 2.5 | Gen. load > initial load | D5 A6 | Mayroon: 3 % (hot 5 %) |
| 2.6 | IP to HP transfer complete | D6 A7 | Mayroon |
| 2.7 | V/F (start up) not operated | A4 B4 | Wala pa (G-8A) |
| 2.11 | Turbine shut-down load | B8△ | Mayroon: gen. load < 20 % (776 p.14) |
| 2.81 ~ 2.85 | CV chest warming | B1△ | Mayroon: reset muna, tapos 60 min o diff < 50 °C at outer > 180 °C |
| 2.92 | HP turbine warming complete | D0 A1 | Mayroon: HP metal > 150 °C |
| 3.1 | House load (52G closed, 52L open) | B5 | Wala (52L laging closed) |

**Hold:** nakakandado hanggang HOLD OFF; walang hold sa critical speed band at sa ICV → CV transfer (775 p.11). **Criteria bypass:** isang criterion bawat pindot (775 p.3, p.10).

**Steam sa roll (boiler side):** ang SH / RH outlet sa start-up ay sumusunod sa FHI SECT_7 Fig. 2 / 3 / 4 (cold 418 °C, warm 430 °C, hot 490 °C mula roll hanggang transfer; 505 °C sa 30 % load; 541 °C mula 60 %). Ang dating extrapolation ng load test ay 468 °C sa 12 % load: hindi makaka-roll. Ang SH at RH spray ay hindi makakatulong doon ayon sa drawing (DITL-33: SOV bukas lang kapag finishing SH inlet ≥ 350 °C at steam > 46 T/H; DITL-35: RH spray pagkatapos lang ng ICV → CV transfer).

Mga numerong hindi mabasa sa drawing ("REFER TO IBD"): kinuha sa PR-OPE-5002. Ang paglamig ng metal na walang steam (tauCool) ay CALC na: 258,900 s (71.9 h), mula sa FHI SECT_7 Fig. 3 / 4 (warm = 8 ~ 56 h na shutdown) at STIE-14811 Fig. 1.4 (Hot > 420 °C, Warm 230 ~ 420 °C). Ang HP prewarming (step 0) ay CALC na: 4400 s papunta sa 157.8 °C (saturation sa 5.0 kg/cm2 g, STIE-14747 p35 ~ 36), mula sa STIE-14811 p147 Fig. 1.1. Ang ibang time constant ng metal ng turbine ay NO-SOURCE (wala sa docs ang heat capacity at rotor data ng turbine), nakasulat sa `tcs.js`; ang hangganan lang ay galing sa STIE-14811 p147 Fig. 1.1 (holding chart 3.8 h sa 0 °C hanggang 0 h sa 150 °C).

**Thermal stress (STIE-14811 TG operator manual, Davao sister unit, p147 Table 1.2 Thermal Stress Control Value).** Reference data lang; HINDI pa ito kinukuwenta ng app dahil ang stress ay kailangan ng rotor geometry at material data na NO-SOURCE. Kaya ang thermal stress hold ay hindi pa umaandar.

- HP / IP stress limit (MPa): Hot 208.0 / 182.9, Warm 396.0 / 423.3, Cold2 430.0 / 371.6, Cold1 430.0 / 331.1, A-Cold 430.0 / 405.1, Shutdown 209.3 / 209.3.
- LCFI (% bawat start) HP / IP: Hot 0 / 0, Warm 0.0851 / 0.1226, Cold2 0.1329 / 0.0583, Cold1 0.1329 / 0.0270, A-Cold 0.1329 / 0.0967.
