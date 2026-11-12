# Plant model — LP heater temperatures (3.2.1-beta.7)

IRENE : PLANT MODEL, 2026-11-04 PHT. Code: `src/analog/engine/unit.js` (`AN_LP`, `anLphStep`, `anTsatA`). Test: `tests/regress/lp_heaters.js`.

## Source

- **FHI heater O&M** (sa PC, `o&m-package-phase-1` L15-5 / L15-6 / L15-7, PDF p14 "Nominal thermal characteristics", condensate 362.594 t/h):
  - No.1 LPH: extraction 0.354 kgf/cm2A (sat 72.52 C), condensate 40 → 70.8 C, TTD 1.72, DCA 5.62, drain out 45.62 C.
  - No.2 LPH: extraction 0.785 kgf/cm2A (sat 92.48 C), condensate 70.8 → 90.7 C, TTD 1.78, DCA 5.61, drain out 76.41 C.
  - No.3 LPH: extraction 1.818 kgf/cm2A (sat 116.64 C), condensate 90.7 → 114.9 C, TTD 1.74, DCA 5.62, drain out 96.3 C.
- **Condenser O&M** L15-1 p16: 68.6 mbar abs, saturation 38.65 C = hotwell (AN_CD). Ang gland steam condenser at ejector condenser sa pagitan ng hotwell at No.1 LPH: 40 − 38.65 = 1.35 C sa design.
- **I/O list STN102:** TT-CD1101 (No.1 LPH inlet), TT-CD1102 (No.2 LPH inlet), TT-CD1103-1 / -2 (No.3 LPH inlet / outlet), TT-CD1122 (deaerator inlet), TT-HD1102 / 1103 / 1105 / 1106 (drain temperatures).
- Walang ABC o DITL sheet na bumabasa ng mga ito (hinanap ang AI0821, 0833 ~ 0838, 0929 ~ 0932 sa lahat ng sheet: ang AI0821 sa ABC-026 ay STN103, ibang signal). Kaya ang mga value ay para sa plant pages: `AN.unit.tt['TT-...']`.

## Paano gumagana

- Shell pressure (abs) = design × main steam / 458.684 × extraction MOV (DITL-97 No.3, DITL-98 No.2; walang MOV ang No.1), gaya ng AN_HP at AN_HD.
- Condensate out = saturation ng shell − TTD, hindi bababa sa pumapasok na tubig. Drain out = condensate in + DCA habang may drain; kung wala, ang saturation ng shell.
- Lag 120 s (NO-SOURCE, gaya ng AN_HP). NO-SOURCE din: ang 1.35 C ay sumasabay sa load; walang pipe loss papuntang deaerator (02.png 94 / 93 C).

## Resulta (cloud, headless)

- `lp_heaters.js` ALL PASS, 150 MW (main steam 471 T/H, hotwell 36.6 C):
  - TT-CD1101 38, TT-CD1102 71.5, TT-CD1103-1 91.5, TT-CD1103-2 = TT-CD1122 115.7 C (design 40 / 70.8 / 90.7 / 114.9).
  - Drains TT-HD1102 77.2, TT-HD1103 97.1 C (design 76.41 / 96.3). HPH drains TT-HD1105 167.9, TT-HD1106 202.5 C.
  - Isinara ang No.3 LPH drains: H.H. M.0233 sa 258 s, sarado ang DITL-97 MOV (100 → 0 %). Walang steam sa No.3 LPH: outlet 91.6 = inlet 91.5 C, deaerator inlet 115.7 → 91.6 C.
- Ihinambing sa 02.png (60 MW): TICD11031 71, TICD11032 94, TICD1122 93, TIHD1103 74 C. Tugma ang model sa ugali (shell pressure × load).
- **UNUSUAL:** 02.png TIHD1102 46 C ay mas mababa pa sa No.2 LPH inlet (TICD1102 57 C). Hindi ito kaya ng drain cooler; malamang ang sensor ay pagkatapos ng valve (flash). Hindi ito ginaya ng model; design DCA ang ginamit.

## Naitama (test)

- Ang `heater_levels.js` ay nagbabasa ng DITL-97 position pagkatapos ng loop, kapag `WORLD.live` ay false na, kaya `null` ang nakuha at pumasa pa rin (`null < 10`). Ngayon ay `WORLD.live = true` bago magbasa at bawal ang null: tunay na 100 → 0 %.

## Hindi pa nagawa

- ~~LPH bypass MV-CD1003 at outlet MOV MV-CD1002 (ZT-CD1002 / 1003): hindi pa kasama.~~ Nagawa na (2026-11-12 tala ni SOHEE): `unit.js` `anHtrPath`, No.1 LPH MV-CD1001 / 1002 / bypass 1003 = DITL-69 / 70 / 71.
- Ang deaerator ay hindi pa gumagamit ng TT-CD1122 sa heat balance niya.
- Live test: hindi pa.

## Dagdag (3.2.1-beta.13): ang anim na value ng page 05 CONDENSATE

Hiling ng coordinator (JISOO page 05, beta.12): anim na value ang '-----' dahil walang sheet o model na nagbibigay. Ngayon galing na sa model (`unit.js` `anCdTagStep`, `AN.unit.tt`; page map sa `tools/hmi-mock/p05-head.js`). Test: `tests/regress/cd_page_values.js` ALL PASS.

- **TT-CD1119** (ejector condenser outlet) = hotwell + kalahati ng 1.35 C rise ng AN_LP. Source: 28.png (151.3 MW) 40 → 41 → 42 C (hotwell → TT-CD1119 → TT-CD1120), kalahati bawat isa.
- **TT-CD1110-4** (flash chamber) = hotwell + 2 C × load. Source: 28.png 42 vs 40 C. NO-SOURCE ang hugis sa load.
- **FT-CD1122** (condensate papuntang deaerator) = ang dinadaan ng LCV-CD1104 (`plant.js` anCycFlows fda, walang recirculation). 150 MW: 376.3 T/H (28.png FT-CD1120 380, recirculation 0.1 %). Isinara ang LCV-CD1104: 0.
- **PT-CD1122** (deaerator inlet pressure) = PT-CD1104 + 1.6 kg/cm2. Source: 02.png 3.8 − 2.2. NO-SOURCE: pareho sa bawat flow.
- **TT-CD1104** (storage tank water) = saturation ng PT-CD1104. Ang 02.png ay 131 C sa 2.2 kg/cm2 (sat 135.6), 4.6 C na mas mababa; hindi ginaya.
- **FT-CD1115** (LP bypass spray) = TCV-CD1115 (ABC-052 TICHR1012 MV) × XV-CD1114 (DITL-66) × 46 T/H. NO-SOURCE: ang capacity ng valve ay kinuha sa range ng transmitter sa IO list. 28.png / 29.png: 0.0.
- **Napansin:** ang hotwell ng model ay 36.6 C sa 150 MW, ang 28.png ay 40 C (AN_CD mula sa seawater inlet at condenser O&M). Kaya ang TT-CD1110-4 39 at TT-CD1119 37 sa app (28.png 42 / 41): tama ang agwat sa hotwell, ang hotwell mismo ang mas mababa. Hindi binago sa gawaing ito.
