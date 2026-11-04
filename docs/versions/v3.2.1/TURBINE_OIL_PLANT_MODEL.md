# Plant model: Turbine Oil, lube oil cooler sa closed cooling (3.2.1-beta.3)

IRENE : PLANT MODEL, 2026-11-04 PHT. Code: `src/analog/engine/unit.js` `AN_LO` / `anLubeCoolStep`. Ang pumps, pressures at
bearing temperatures ay nasa `tcs.js` (TCS_OIL, dati na). Test: `tests/regress/lube_oil.js` (6 PASS).

## Connection
- Langis: bearings → main oil tank → MOP → lube oil cooler H-1921A (B standby) → bearings.
- Tubig: ACW supply (TT-CW1153, closed cooling) → TCV-CW1201 → cooler → return. Ang TCV-CW1201 ay ang MV ng ABC-053 TICLO1002.
- Ang PV (TE-LO1002-1 / -2, STN102 AI0452 / AI0516) ay galing na sa model. Iisa ang numerong binabasa ng logic, ng HMI at ng tcs.js (TILO1001, bearing outlet, bearing metal).

## Sources
- **O&M L2 TG 2-3 LUBE OIL COOLER R2 (sa PC):**
  - plate type, 146.94 m2, 2 units;
  - oil 2,660 L/min max;
  - cooling water 170,000 kg/h max, inlet 37 °C max;
  - oil outlet 46 °C;
  - 1,300 kW max.
  - Clean UA na kinalkula: 95.8 kW/K.
- **Mass Balance MB-021 items 12 / 13:** 170 T/H, 5 → 4.75 kg/cm2, 34 → 41 °C.
- **Snapshot 36.PNG (149 MW):** TILO1001 62 °C, TILO10021 / 22 46 °C.
- **Snapshot 27.PNG:** TCV-CW1201 53.1 %, ACW supply 38 °C.

## Paano gumagana
- **Init sa Start at 150 MW:** nasa steady value ang lube oil (bisection).
- **Init sa Cold:** 30 °C ang lube oil.
- **Heat ng bearings:** 1,032 kW × speed / 3600, habang may lube oil (bearing oil > 1.05 kg/cm2).
- **Cooling water:** 170 T/H × MV × (ACW flow / 1500). Walang ACW, walang paglamig.
- **Cooler:** effectiveness-NTU, counter flow, UA 95.8 kW/K. Ang tubig ay pumapasok sa temperatura ng ACW supply.
- **Oil tank:** isang temperature node, 25,800 kJ/K. Ang cooler outlet = return − (heat na inalis ÷ oil flow).

## Resulta (cloud test)
- **150 MW:**
  - TE-LO1002 46.1 °C, TILO1001 62.1 °C, bearing No.3 outlet 55.1 °C;
  - TCV-CW1201 51.9 % (snapshot 53.1), 88 T/H.
- **Chain test, trip ng lahat ng SWBP:**
  - Pagkatapos ng 10 min: ACW supply 51.7 °C, TCV-CW1201 100 %, oil 56.0 °C.
  - Pagkatapos ng 25 min: ACW supply 69.1 °C, oil 72.6 °C, bearing No.3 outlet 81.5 °C.

## CALIBRATED / NO-SOURCE
- **Linear valve, 170 T/H sa 100 %:** NO-SOURCE, walang valve curve.
- **Oil flow 64.5 kW/K (mga 2,250 L/min) at heat na 1,032 kW:** CALIBRATED sa 36.PNG at 27.PNG gamit ang vendor UA. Mas mababa ito sa max ng vendor (2,660 L/min, 1,300 kW).
- **Heat na linear sa speed:** NO-SOURCE, pareho sa dating 16 °C × speed ng tcs.js.
- **Laki ng oil tank (mga 15 m3):** NO-SOURCE.

## Alarm
- TE-LO1002 sa DCS alarm list: walang H / L (PACKAGE T/G, FHI).
- Ang alarm at trip ng bearing ay nasa TCS. Hindi pa ito nakakabit sa model na ito.

## Hindi pa ginawa
- Cooler B (standby) at ang mga manual valve nito (V-CW1019 ~ 1022): hindi pa.
- Bearing at winding temperatura ng mga motor (AN_MT) mula sa closed cooling: hindi pa.
- Hindi pa live-tested sa PC ng user.
