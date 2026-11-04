# Plant model: Feedwater, deaerator at BFWP (3.2.1-beta.3, unang bahagi)

IRENE : PLANT MODEL, 2026-11-04 PHT. Code: `src/analog/engine/unit.js` `AN_FW` / `anFwStep`, `src/world/plantsw.js` (PT-FW1011,
DPT-FW1115-A / B), `src/analog/engine/source.js` + `plant.js` (deaerator pressure floor). Test: `tests/regress/feedwater.js`.
Dati na: feedwater flow at drum level (`plant.js`, FICFW1007 at LICBR1001), deaerator level (AN_CYC), BFWP suction (`plantsw.js` sucP).

## Connection
- Deaerator H-1104 (extraction no. 3 sa load, pegging steam PCV-AS1030 sa mababang load) → BFWP P-1115A / B (isa tumatakbo, isa AUTO standby; ARC valve para sa min flow) → HP heaters → FCV-FW1130-1 / -2 → economizer → drum.

## Sources
- **O&M L7 BFP (KSB HGC 5/1+6, sa PC):** data sheet: 491.04 T/H sa 1750 m; shut-off 2254.6 m; discharge 165.1 kg/cm2g sa suction 6.0; 2946 kW; motor 3550 kW; sp. gr. 0.9093; min recirculation 151 m3/h. Curve Q43446D (3580 rpm): 2250 m sa 100, 2140 sa 300, 2010 sa 400, 1620 sa 600 m3/h; power 1700 kW sa 150, 2230 sa 300, 2580 sa 400, 3100 sa 600 m3/h.
- **Snapshot 03.png (150.5 MW):** BFWP-A 289.4 A, PIFW1011 165.4, PIFW1115A 6.7, DPIFW1115A 0.29 kg/cm2, feedwater 499.1 T/H.
- **Snapshot 4.PNG:** PITS1017 (extraction no. 3) 5.30 kg/cm2, MV-TS1003 (extraction no. 3 sa deaerator) 100 %. 5.png: DEAERATOR PV 5.9.
- **DITL-23B:** row 25 PT-FW1011 < 155 kg/cm2 = M.3210 BFWP OUTLET PRESSURE LL; row 26 strainer DP > 0.8 / 0.9 (trip), > 0.6 (alarm). DITL-23A row 12 suction > 1.5 (start permissive).

## Paano gumagana
- **Flow ng BFWP:** feedwater sa drum ÷ tumatakbong BFWP, hindi bababa sa 151 m3/h (ARC).
- **PT-FW1011:** suction + head ng curve (tugma sa data sheet: 6.0 + 1750 m = 165.1).
- **Current:** 289.4 A × shaft power ÷ power sa 150 MW (snapshot).
- **Strainer DP:** 0.29 × (flow ÷ 549)².
- **Tumatakbo:** ang motor ng DITL-23A (A) at DITL-23A #B (B).
- **Deaerator pressure (bago):** sa load, hindi bababa sa extraction no. 3: 5.3 × steam ÷ 474.1 T/H. Dati ay ~1 kg/cm2 sa 150 MW (ang pegging lang ang binibilang), kaya ~1.7 lang ang BFWP suction.

## Resulta (cloud test, 150 MW, pagkatapos ng 5 min)
- BFWP-A 540 m3/h, PT-FW1011 164.5 kg/cm2 (snapshot 165.4), 287.1 A (289.4), strainer DP 0.28 (0.29). Pareho ang basa ng DITL-23B.
- BFWP suction 5.33 kg/cm2 (snapshot 6.7).
- Trip ng BFWP-A (FIELD TRIP): PT-FW1011 bumaba sa 5.3, M.3210 LL sa DITL-23B.

## BUKAS (nakita sa test, aayusin)
1. **Hindi nag-auto start ang BFWP-B** pagkatapos ng trip ng A, kahit LL na ang PT-FW1011. Hindi pa nasusuri kung aling permissive ang kulang (posibleng ang aux LOP ng B, DITL-22 #C / #D).
2. **Tuloy ang feedwater flow** kahit walang BFWP na tumatakbo: ang ABC-010 M.3343 ay galing sa DITL-23A output 55 (BFWP A RUNNING), at nananatiling 1 ang output na ito pagkatapos ng FIELD TRIP (TRIP na ang motor). Bug ito ng running feedback ng drawing na ito (sa CEP ay gumagana), aayusin.
3. **Deaerator pressure pagkatapos ng Start at 150 MW:** ~1 kg/cm2 sa simula at umaabot sa ~5 sa loob ng ilang minuto. Dapat nasa 5.3 agad.

## CALIBRATED / NO-SOURCE
- Extraction no. 3 na linear sa steam: NO-SOURCE.
- Current na proportional sa shaft power: CALIBRATED sa 03.png (walang motor curve na nabasa; TECO manual sa PC).
- Power sa 0 m3/h (1170 kW): extrapolated mula sa curve.

## Hindi pa ginawa
- HP heaters (TT-FW1105 / 1106, drains), economizer inlet PT-FW1160.
- Temperatura at vibration ng BFWP motor at pump (DITL-23B rows 10 ~ 24): default pa.
- Hindi pa live-tested sa PC ng user.
