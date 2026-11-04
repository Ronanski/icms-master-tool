# Limestone and sand injection plant model (3.2.1, SEULGI : PLANT MODEL boiler side)

Code: `src/analog/engine/boiler.js` `AN_LM` / `anLmStep`. Switch rows: `src/world/plantsw.js` (`lmSw`). Test: `tests/regress/limestone.js`.
Sand: `AN_SD` / `anSdStep`, switch rows `sdSw`, test `tests/regress/sand.js` (seksyon sa ibaba).

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

# Sand injection (020 SAND INJECTION SYSTEM)

## Mga source
- O&M L5-2 "Sand" (HWA JANN / HCE DensePhase). Nasa PC lang: `document-references/o&m-package-phase-1/L5 Fly Ash_Sand_Limestone/L5-2 Sand.pdf`. Mga bahagi: section 0 (sequence), section 1 (design data), 4.2.1 (cycle at timers) at 5 (faults).
- Mga drawing DITL-771 ~ 777: `sand-sootblower-logic.zip`, E10210-3-771 ~ 777, station 103.
- IO list "Station 103": I.0560 ~ I.057A at O.0600 ~ O.0612.
- Alarm list: LT-SD1800 at PT-SD1800.
- Snapshot 20.PNG: sand injection naka-STOP, sarado ang lahat ng valve, LISD1800 50.1 %, PISD1800 0.0.

## Ang model
Field devices lang ang ginawa ko. Hindi ko binago ang logic.

| Device | Command (DITL-771 / 776 out) | Switch (in) |
|---|---|---|
| Inlet dome valve XV-SD1804 | OUT21 / OUT22 (SV-SD1804A) | DITL-772 rows 7 / 8, seal PS-SD1804 row 3 (made = sealed, O&M 5.3) |
| Vent valve XV-AV1803 | OUT20 (SV-AV1803) | DITL-775 rows 1 / 2 |
| Outlet valve XV-SD1801 | OUT23 / OUT24 | DITL-775 rows 3 / 4, DITL-772 row 1 |
| Conveying air XV-PA1800 | OUT25 | DITL-775 rows 5 / 6 |
| Isolating valves XV-SD1802A / B | DITL-776 OUT11 / OUT13 | DITL-776 rows 7 ~ 10 |
| Vessel LSH-SD1801 | | DITL-771 row 11 |
| Vessel PS-SD1800 | | DITL-772 row 4, made < 0.3 bar (O&M section 0 e) |
| Air buffer tank PS-PA1800 | | DITL-775 row 7, made < 4 bar (O&M 5.6) |
| Silo LSH / LSL-SD1800 | | DITL-774 rows 3 / 4 |
| Vent filter M-1301 | DITL-774 OUT22 (O.060A) | DITL-774 row 10, DITL-777 row 7 |

Paalala: ang DITL-771 OUT19 "CONTROL O.0607" ay ang remote input na dumadaan lang (net ng row 5). Hindi ito ang vent solenoid.

## Mga numero
| Value | Ginamit | Source |
|---|---|---|
| Vessel | 0.113 m3 x 1440 kg/m3 = 163 kg | O&M L5-2 section 1 |
| Silo | 100 m3, 50.1 % sa simula | O&M section 1, 20.PNG |
| Pagkonbey ng isang batch | 55 s | O&M section 1, "Peak Air Duration 55 seconds" |
| Pressure switch ng vessel | < 0.3 bar | O&M section 0 e |
| Air tank low | < 4 bar | O&M 5.6 |
| Pagpuno ng vessel | 15 s para mapuno | **NO-SOURCE** (ang filling timer ng drawing ay 20 s) |
| Pressure ng vessel habang nagkokonbey | 2.0 kg/cm2 | **NO-SOURCE** (supply ay 5 barg, O&M) |
| Silo LSH / LSL | 85 / 30 % | **NO-SOURCE** (ang LT-SD1800 alarm H / L ng alarm list; hindi alam ang taas ng switch) |
| Stroke 2 s, seal 1 s | | **NO-SOURCE** |

## Ano ang nagbago sa nakikita ng operator
- **Bago:** sa 150 MW, naka-ON ang INLET DV CLOSE FAULT, ang B.1200 at ang SYSTEM TRIP. Hindi masisimulan ang sand system.
- **Ngayon:** sarado at naka-seal ang dome valve, gaya ng 20.PNG. Kapag pinindot ang ISO VALVE OPEN, bumubukas ang dalawang isolating valve at nagiging ROUTE OK. Kapag nasa REMOTE ang PCB-300 at pinindot ang START, isang buong cycle ang tumatakbo ayon sa O&M 4.2.1:
  1. Bumubukas ang vent.
  2. Pagkalipas ng 3 s, bumubukas ang inlet dome valve.
  3. Napupuno ang vessel hanggang 83 % sa loob ng 20 s timer.
  4. Sumasara at nagse-seal ang dome valve.
  5. Bumubukas ang outlet at ang conveying air, at tumataas ang pressure sa 2.0.
  6. Lumalabas ang buong batch, bumababa ang pressure sa ilalim ng 0.3 bar, at sumasara ang outlet at ang conveying air.

## Mga natagpuan (hindi plant model)
4. **DITL-771, hindi umuulit ang cycle. Uri: (c), may pangalan ang eksaktong bahagi.**
   - Sa drawing, ang FF na "DONE" (M.081C) ay nire-reset ng sarili nitong TR314 (3 s).
   - Sa app (sand netlist, `tools/data/sand_model.py`), walang RESET ang FF na iyon (gate 47, r = []). Nananatiling 1 ang M.081C, kaya laging naka-reset ang start FF.
   - **NAAYOS 2026-11-04 11:05 PM PHT (SEULGI):** `02b-sand.js` `sdResetFix` ikinabit ang R ng DONE (TR314) at ng LINE BLOCKAGE (VESSEL PRES. LOW) ayon sa PDF; umuulit na ang cycle (`sand.js` 6 PASS). Ebidensya: `UNLINK_AUDIT.md`.
   - Ganoon din ang FF ng LINE BLOCKAGE (gate 44, r = []).
   - Isang cycle lang ang tumatakbo pagkatapos ng START. Hindi ko binago ang parser.
5. **DITL-771 row 5 (SIL-SD1300 REMOTE)** ay hindi itinatakda ng `ditl150.js`. Sa test, ako ang naglagay nito sa REMOTE bilang field action.

## Hindi pa nasubok
- Ang ikalawang cycle (dahil sa finding 4) at ang line blockage.
- Ang air tank low.
- Wala pa sa ABC ang PISD1800 at LISD1800 (AI0432 / AI0387, station 103). Nasa unit keys pa lang ang mga ito: `sdP` at `sdSilo`.
