# Limestone injection plant model (3.2.1, SEULGI : PLANT MODEL boiler side)

Code: `src/analog/engine/boiler.js` `AN_LM` / `anLmStep`. Switch rows: `src/world/plantsw.js` (`lmSw`). Test: `tests/regress/limestone.js`.
Sand injection: hindi pa (susunod).

## Mga source
- O&M L5-3 "Limestone" (HWA JANN / Clyde Bergemann Rotofeed). Nasa PC lang: `document-references/o&m-package-phase-1/L5 Fly Ash_Sand_Limestone/L5-3 Limestone.pdf`. Mga bahagi: section 1 (design data), 2.2 ~ 2.10 (sequence, timers, alarms), 3.2 / 3.5 (start-up, isolation).
- Drawing `limestone_logic.xls` (DITL-LS10 ~ LS240, station 104).
- IO list "Station 104": I.0166 ~ I.020F, O.0243 ~ O.0259, AI0432 ~ AI0434.
- Alarm list "Alarm List _20160912": PT-LM1811 at PT-LM1812, 0 ~ 6 kg/cm2.
- Snapshot 19.PNG (150 MW): naka-STOP ang feeding, lahat ng dome valve sarado, PILM1811 0.0, PILM1812 0.1, silo 69.4 %.

## Ang model (field devices lang; hindi binago ang logic)
| Device | Command (DITL out) | Switch na binabalik (DITL in) | Source |
|---|---|---|---|
| Vent dome valve XV-LM1814A | O.0249 (LS160) | I.017B / I.017C ZSO / ZSC | IO list |
| Lock vessel inlet dome valve XV-LM1812 | O.0243 (LS170) | I.0177 / I.0178, seal PS-LM1812 I.016D | IO list, O&M 2.10 |
| Dispensing inlet dome valve XV-LM1815 | O.0244 (LS180) | I.0179 / I.017A, seal PS-LM1815 I.016E | IO list, O&M 2.10 |
| Balance dome valve XV-LM1814B | O.024A (LS190) | I.017D / I.017E | IO list |
| Equalising valve XV-LM1814C | O.0248 (LS200) | (walang switch) lock vessel pressure | O&M 2.3.3 / 2.3.5 |
| Conveying air valve XV-LM1814D ~ F | O.0247 (LS210) | dispensing vessel / line pressure | IO list |
| Isolating valves XV-LM1811A ~ H | O.0252 ~ O.0259 (LS212) | I.0200 ~ I.020F | IO list |
| Rotofeed L-1311 | O.024C (LS110) | I.0170 MIR-M1311 | IO list |
| Vent fan F-1313 | O.024E (LS214) | I.0173 MIR-LM1313 | IO list |
| Lock vessel level | | I.0168 LSH-LM1812 | IO list |
| Dispensing vessel level | | I.0169 LSL-LM1815 (1 = uncovered: DITL-LS20 OUT3 = enabled AND I.0169) | IO list, drawing |
| Air receiver | | I.016A PS-PA1811, made < 4 bar | O&M 2.9 |
| PT-LM1811 / PT-LM1812 | | analog rows DITL-LS60 r14 / r15, LS230 | IO list AI0434 / AI0433 |

Mga seal: ang dome valve ay "closed and sealed" kapag ang seal pressure ay > 5 bar (O&M 2.10). Ang seal ay pinupuno ng control air, na galing sa plant air header ng unit model (`paPU`).

Mga manual valve (field action, `AN.swValve`): HV01, ang control air isolation ng pneumatic panel PCB-1311 (O&M 3.2.1 / 3.5.4: kapag sinara, lumalambot ang mga seal), at HV11, ang conveying air isolation (O&M 3.2.4). Bukas ang dalawa habang may serbisyo.

## Mga numero
| Value | Ginamit | Source |
|---|---|---|
| Lock vessel / dispensing vessel | 0.7 / 1.4 m3 x 1280 kg/m3 = 896 / 1792 kg | O&M L5-3 section 1 |
| Silo | 530 m3, 69.4 % sa simula | O&M section 1, 19.PNG |
| Feeder | 0 ~ 14 T/H = MV ng AICFG10571 (ABC-005, INV-M1311) | O&M max 14,000 kg/h; DITL-LS240 OUT3 0 ~ 14 T/H |
| Seal OK | > 5 bar; air tank low < 4 bar | O&M 2.9 / 2.10 |
| Equalising air | 3.5 barg (regulator PCV11) | O&M 3.2.5 |
| Close fault timer | 15 s (drawing). Ang O&M 2.8 ay nagsasabing 5 s; ang drawing ang sinunod | DITL-LS170 / LS180 |
| Rest pressure ng dispensing vessel | 0.1 kg/cm2 | **KINUHA SA SNAPSHOT 19.PNG**, hindi physics (natitirang pressure) |
| Dome valve stroke 2 s, seal inflation 1 s, isolating valve 3 s | | **NO-SOURCE** (ang 15 s fault timer lang ang limit) |
| LSH 90 % ng lock vessel, LSL 30 % ng dispensing vessel | | **NO-SOURCE** (walang taas ng probe sa O&M) |
| Silo → lock 20 s, lock → dispensing 20 s | | **NO-SOURCE** (mas maikli sa 30 s backup timer ng O&M 2.8) |
| Conveying pressure 0.8 + 0.05 x T/H kg/cm2 | | **NO-SOURCE** (nasa pagitan ng LOW 0.5 ng LS230 at 1.5 bar blockage ng O&M) |
| Time constants ng pressure 1 / 3 / 4 s | | **NO-SOURCE** |
| Laman ng dispensing vessel sa 150 MW: 60 % | | **NO-SOURCE** |

## Ano ang nagbago sa nakikita ng operator
- **Bago:** sa 150 MW, naka-ON ang apat na CLOSE FAULT (vent, lock, dispensing, balance). Naka-flash din ang apat na seal alarm na B.1250 ~ B.1253. Dahilan: walang nagbibigay ng ZSC at seal switch, kaya hindi ma-enable ang fill cycle.
- **Ngayon:** sarado at naka-seal ang mga valve at walang fault, gaya ng 19.PNG. Kapag sinara ang HV01, lumalambot ang seal at lumalabas ang CLOSE FAULT pagkalipas ng 15 s, kasama ang B.1250 / B.1251. Kapag binuksan ulit ang HV01, nawawala ang fault.

## Mga natagpuan (hindi plant model)
1. **DITL-LS212, hindi mabuksan ang isolating valves A ~ H mula sa CRT. Uri: (c), may pangalan ang eksaktong bahagi.**
   - **Row 10 M.184C** "HMI SWITCH". Sa drawing, ito rin ang address ng output ng FF na "SET / RESET HMI SWITCH". Binabasa ito ng app (`mirModel`) bilang salamin ng output, kaya hindi ito kayang i-set ng pindot.
   - **Linya ng row 15 (M.182D PERMIT) at row 17 (M.1846 PLANT EMERGENCY STOP).** Sa app, iisang net (n4) ang dalawa: ang raw shape ay iisang connector sa x 147.5, mula y -159.4 hanggang -100.9. Pero sa render ng LibreOffice, may puwang ang linya sa ilalim ng dot. Kaya laging naka-ON ang RESET ng FF pagkalipas ng 60 s.
   - **Epekto:** walang M.183E "ISOLATING VALVES ALL OPENED", kaya hindi ma-enable ang fill cycle (DITL-LS10).
   - **Hindi ko binago ang parser.** Para ito sa logic reader at kailangan ng pasya.
2. **DITL-LS110 row 21, "I.0173 ROTOFEEDER RUNNING".** Sa IO list, ang I.0173 ay MIR-LM1313, ang running ng silo vent fan. Ang I.0170 ang running ng feeder. Ang address ang sinunod (rule 1), kaya ang HMI indicator na "ROTOFEED RUNNING" ng LS110 ay nagpapakita ng vent fan.
3. **Ang rule ng `ditl150.js` na "LIMESTONE FEEDER | ROTO FEEDER running"** ay hindi tumatama sa mga row ng LS ("ROTOFEEDER", walang space). Tama naman ito, dahil naka-STOP ang feeder sa 19.PNG (SIM1311 0.0).

## Hindi pa nasubok
- Ang buong fill cycle (step 1 ~ 8), ang pagtakbo ng feeder at ang conveying pressure. Hindi ito maabot dahil sa finding 1.
- Ang air tank low (I.016A), dahil walang paraan pa para ibaba ang plant air header sa test.
- Wala pa sa ABC ang PT-LM1811 / 1812 at ang silo level (AI0432 ~ AI0434). Nasa unit keys pa lang ito: `lmPl`, `lmPd`, `lmSilo`.
