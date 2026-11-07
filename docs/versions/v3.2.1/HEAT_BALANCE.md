# Heat balance, calculated (2026-11-07)

Walang vendor heat balance sa documents. Ito ay calculated mula sa mass balance MB-011, 012, 013 sa rated load, gamit ang IAPWS-IF97.

- Enthalpy: main steam 3446.7, cold reheat 3146.9, hot reheat 3538.5 kJ/kg.
- HP: 458.3 T/H, 38.2 MW, HP efficiency 83.7 %.
- IP at LP: reheat 401 T/H less extractions 24.2, 26.79, 15.25, 12.27, 8.42, 8.42 T/H. Hanggang extraction V: 87.0 MW.
- Exhaust: 0.07 kg/cm2a. Quality 0.92 ang nagsasara sa 150.0 MW na may 1.5 % generator at mechanical loss (NO-SOURCE).
- Init sa steam: 346.9 MW, feedwater 245.4 C.
- Bahagi ng shaft power: HP 25 %, IP / LP 75 %.

Hindi ito vendor data. Rated point lang ito; ang mas mababang load ay titimplahin sa FHI curves at procedures.

## Isolated heaters (beta.49)

Calculated, not vendor data. A shut extraction stays in the turbine down to the exhaust 2378.4 kJ/kg:

- No.2 HP heater: 45.147 T/H x 1160.1 kJ/kg, 14.3 MW.
- No.1 HP heater: 25.33 T/H x 917.1 kJ/kg, 6.4 MW.
- No.3 LP heater: 15.25 T/H x 454.8 kJ/kg, 1.9 MW.
- No.2 LP heater: 12.27 T/H x 311.4 kJ/kg, 1.0 MW.

Same coal, colder feedwater: steam x 1 / (1 + 4.6 x dT / 2382). No.2 HP heater out, dT 49.7 C: steam -8.8 %. So the two effects nearly cancel in MW and the heat rate gets worse. Boiler response to colder feedwater (gas side, steam temperature) is for Phase 2. Load limit with heaters out: NO-SOURCE.
