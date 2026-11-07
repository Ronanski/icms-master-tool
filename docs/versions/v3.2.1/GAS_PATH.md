# Air preheater, O2 and flue gas

Code: `src/analog/engine/boiler.js` `AN_GAS`, `anAphStep`; `unit.js` O2. Test: `tests/regress/gas_path.js`.

## O2
Air for burning 1 T of coal: 5.46 T, from the ultimate analysis of FHI Tab 3 (C 42.97, H 2.75, S 1.49, O 11.42 %).

O2 = 21 x (1 - coal x 5.46 / total air). Fig 12 total air with Fig 13 coal against Fig 7:

| Load % | Air T/H | Coal T/H | Worked O2 % | Fig 7 % |
|---|---|---|---|---|
| 40 | 365 | 38.5 | 8.9 | 8.8 |
| 50 | 332 | 47.0 | 4.8 | 4.6 |
| 60 | 371 | 56.0 | 3.7 | 3.6 |
| 70 | 427 | 64.0 | 3.8 | 3.6 |
| 100 | 596 | 89.5 | 3.8 | 3.6 |

The O2 trim set point in the logic (AICFG112) is 3.5 %.

Fig 12 total 596 is PA 354 + SA 218 + fluidizing air about 24 (FHI P2S4: blower up to 22.7 T/H; P2S6: about 3 % of the air). The study book listed that gap as unexplained.

The two analyzers read one value. FHI has one curve; the 6.4 and 2.2 % split came from one snapshot and has no source.

## Air preheater (Tab 3, MCR)
Gas 322 to 135 C. PA 45 to 285.8 C. SA 39 to 301.6 C.

- Each air comes to 86.9 % (PA) and 92.8 % (SA) of the way to the gas entering. Held at all loads: change with flow is NO-SOURCE.
- Gas leaving comes from the heat the air took. Gas flow 681 T/H (air 598 + coal less ash), air to gas specific heat 0.894, from the Tab 3 balance.
- Rotor stopped: heating fades over 120 s. Time NO-SOURCE.
- Gas entering below MCR: no curve in the docs. Kept the HMI law on bed temperature and gas flow.


## Part load: air against FHI (open)
The logic has its own curves on ABC-002: BM vs AIR DEMAND, TCF vs PA FLOW DEMAND, TFF vs TAF DEMAND, BM vs O2 DEMAND. They give more air at part load than Fig 12. Model at 120 MW after 42 min: coal 69 T/H, PA 323, SA 160, total 509 T/H, O2 5.4 %; O2 set point of the logic 4.2 %, Fig 7 3.6 %. The trim stands near 0.86. The simulator follows the logic. No part load air snapshot is in the docs, so this stays open for the match of Figures 2 to 13 (b6).

## SOx and limestone (b5)
Raw SO2 from the coal, S 1.49 % (Tab 3): about 1890 ppm in the MCR gas. Ca/S from limestone CaCO3 93.66 % (Tab 3). At Fig 13 feed Ca/S is 2.7.
Capture = exp(-11 x Ca/S), fitted to one snapshot: 41 ppm at limestone 11 % of 14 T/H (Ca/S 0.346). Fit, not a design value. The bed holds lime, lag 2 h NO-SOURCE.
Silos: limestone and sand levels stand still, scope 2026-11-07.

## Colder feedwater (b4)
A heater out sends colder water to the economizer, and it takes more from the gas: gas to the air heater falls 0.36 C per C of feedwater (43 C gas drop over 120 C gas to water, snapshot gas 365 C and Tab 3 feedwater 245.4 C). Hot air and gas out follow.

## ESP (b5)
ESP in service: dust 2.9 mg/Nm3 and opacity 12.5 % at full gas, snapshot 7.PNG. ESP out of service: the inlet dust of the design basis, 31,000 mg/Nm3, opacity 100 %. Field state AN_SRC.field.esp. Fly ash conveying stays out of scope; silos unlimited.
