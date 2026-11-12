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

## Heater water side (beta.50)

Valves from PD-017, PD-018. Tubes shut and bypass open: the water skips the heater and its extraction stays in the turbine. Tubes and bypass both shut: no flow through that line. No.1 LP heater: 8.42 T/H x 257.2 kJ/kg, 0.6 MW. Split between tubes and bypass while both are open: by opening, NO-SOURCE.

## Boiler side, furnace to stack (plan b1, 2026-11-12)

Calculated from FHI Part 2 Sect 7 Tab 2 / Tab 3 (MCR) and the mass balance. Steam table values (IAPWS-IF97) are read at the stated pressures; not vendor data.

Heat in (fuel): 89,000 kg/h x LHV 3,662 kcal/kg = 379.0 MW (HHV 4,008 kcal/kg = 414.8 MW).

Heat to the water and steam, by section:

- Economizer: 460 T/H, 245.4 C (1,063 kJ/kg) to 303 C (1,357 kJ/kg): 37.6 MW.
- Furnace evaporator (water walls and in-furnace evaporator panels): 303 C to saturated steam at the drum, 145 kg/cm2 g (SH outlet 129 + SH drop 16), Tsat 338.5 C (2,628 kJ/kg): 162.4 MW.
- Superheaters (in-furnace panels #1 and #2, finishing SH): 2,628 to 3,446.7 kJ/kg: 104.6 MW.
- Reheater: 401 T/H (MB-012), 3,146.9 to 3,538.5 kJ/kg: 43.6 MW.
- Total to the steam: 348.2 MW. Over the LHV input this is 91.9 %, against the Tab 3 efficiency of 90.9 % (LHV). The 1 % gap is the blowdown (about 15 T/H, MB-019) and the reading of the steam table. The balance closes.

Air preheater (Tab 3 and APH duty 1):

- Air side: PA 351.6 T/H from 45 to 285.8 C = 23.8 MW; SA 207.6 T/H from 39 to 301.6 C = 15.3 MW; total 39.1 MW.
- Gas side: 678.4 T/H from 322 to 135 C, cp about 1.08 kJ/kg C: 38.1 MW. Air and gas agree within 3 % (the gas cp and the air leakage are the open terms).

Stack loss: 678.4 T/H at 135 C over 35 C ambient, about 19.8 MW = 5.2 % of the LHV input. With the unburnt carbon and radiation this brings the boiler near the Tab 3 90.9 %.

What the model uses: the unit model is anchored at 150 MW on coal 89.5 T/H (FHI Fig 13; Tab 3 prints 89,000 kg/h, within reading) and the steam of the mass balance, so it follows this balance at the rated point. The bed temperature follows the plant DCS trends (TIFG1090 952 to 962 C from 90 to 150 MW, team-files plant-study 14), not a heat balance of its own: no document gives the split of the furnace heat between the bed, the walls and the cyclones.
