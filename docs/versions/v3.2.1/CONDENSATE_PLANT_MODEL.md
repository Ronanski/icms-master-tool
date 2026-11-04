# Plant model: Condensate, condenser at hotwell (3.2.1-beta.3)

IRENE : PLANT MODEL, 2026-11-04 PHT. Code: `src/analog/engine/unit.js` `AN_CD` / `anCondStep`, `src/world/plantsw.js`
(`condP`, PT-CD1117, DPT-CD1001 / 1002), `src/analog/engine/plant.js` `anCycFlows` (make-up). Test: `tests/regress/condensate.js` (8 PASS).
Dati na (3.2.0): hotwell level, condensate flow at deaerator level bilang water balance (`plant.js` AN_CYC). Ang bago: condenser
pressure at temperatura mula sa physics, ang CEP sa pump curve, at ang link sa logic.

## Connection
- Steam: LP turbine exhaust + LP bypass → condenser → hotwell.
- Seawater: SWP → condenser water box A / B (V-SW1007 / 1008 inlet, V-SW1009 / 1010 outlet) → dagat. Galing sa 030 Seawater model.
- Condensate: hotwell → CEP P-1116A / B (isa tumatakbo, isa AUTO standby) → LCV-CD1104 → deaerator; FCV-CD1120 recirculation pabalik sa condenser.
- Make-up: MWP → LCV-MU1110 → hotwell. Walang MWP na nagbibigay = walang make-up (bago).

## Sources
- **O&M L15-1 condenser (K2MC3A, sa PC, YERI):** 195.7 MW; exhaust 87.78 kg/s (316.0 T/H); 68.6 mbar abs (38.65 °C); seawater 31,500 T/H, 30 → 35.6 °C; cleanliness 0.85; 6,898 m2; hotwell 61.9 m3, NL FL+1814 mm (HHL +2114, LLL +1514).
- **O&M L10-1 CEP (KSB WKTB 6/1+2, sa PC):**
  - data sheet A01: 400 m3/h sa 180 m; shut-off 210 m; 252.18 kW; motor 325 kW; min flow 100 m3/h; impeller GL-4.322 m, hotwell low level GL+1700 = FL+1500 mm;
  - curve A02 (Q43495D, 1780 rpm): 160 m sa 480 m3/h; power 123 kW sa 50, 252 sa 400, 283 sa 480 m3/h.
- **Alarm list 20160912:** TE-CD1110 normal 38.6 °C (H 50, L 27); PT-CD1117 normal 15.5, L 14.0, LL 13.0; LT-CD1110 H 150 / HH 300, L -150 / LL -300 mm; PS-CD1110-1 ~ 3 (alarm lang) -0.8 kg/cm2g.
- **I/O list STN102:** PT-CD1110 AI0532 (0 ~ 6 kg/cm2A), TT-CD1110-1 AI0678, PT-CD1117 AI0564, LT-CD1110 AI0640, DPT-CD1001 AI0450 / 1002 AI0802; STN103 IT-P1116A / B AI0449 / AI0465 (0 ~ 70 A).
- **DITL-61A / 61B:** row 19 PT-CD1117 < 14.0 kg/cm2 = M.3217 OUTLET PRESSURE LOW → AUTO start ng standby CEP; strainer DP > 0.1 / 0.08.
- **Snapshot:** 28.png CP-A 28.1 A, PICD1117 16.9; 4.PNG PICD1110 0.057 kg/cm2A, TICD11101 40.0 °C.

## Paano gumagana
- **Heat:** 195.7 MW × steam sa condenser ÷ 316.0 T/H. Pareho ang steam ng seawater model (main steam + LP bypass).
- **Condenser:** effectiveness-NTU. UA 36,430 kW/K sa design flow (galing sa O&M point), × (flow ÷ design)^0.5. Seawater flow ng parehong water box mula sa 030 model. Sinusundan ng temperatura ang steady value (30 s).
- **Pressure (PT-CD1110):** saturation ng temperatura. Kapag hindi pa vacuum (ejectors, U.vac), hangin ang nagtataas hanggang atmosphere. Ito rin ang basa ng DITL-55 / DITL-73.
- **Hotwell temperatura:** = condenser temperatura (alarm list normal 38.6 = saturation ng design).
- **LOW VACUUM trip ng turbine:** condenser > 0.447 kg/cm2A.
- **CEP:** flow = (condensate sa deaerator + recirculation) ÷ tumatakbong CEP. Head mula sa curve. Outlet = suction (condenser + tubig sa ibabaw ng impeller, 6.34 m sa NL) + head − 0.96. Current = 28.1 A × shaft power ÷ 245.7 kW. Strainer DP = 0.019 × (flow ÷ 383)².

## Resulta (cloud test, 150 MW)
- Condenser 0.063 kg/cm2A, 36.6 °C; heat 200 MW; seawater 35,350 m3/h.
- CEP A 385 m3/h, PT-CD1117 16.81 kg/cm2, 28.2 A. Ang DITL-61B row 19 ay 16.81 din.
- **Chain, trip ng CEP A:** PT-CD1117 bumaba sa 0, pinatakbo ng logic ang CEP B pagkatapos ng 2 s; balik sa 16.79.
- **Chain, sarado ang V-SW1007:** seawater 24,757 m3/h, condenser 0.071 kg/cm2A, 38.9 °C, walang trip.
- **Chain, sarado rin ang V-SW1008:** walang seawater, condenser 0.916 kg/cm2A, nag-trip ang turbine sa LOW VACUUM.
- **Chain, sarado ang discharge ng MWP:** walang make-up; hotwell -28.9 mm sa 2 min (may make-up: -2.8 mm).

## Hindi tugma (nakatala)
- Condenser 0.063 kg/cm2A ng model; snapshot 4.PNG 0.057, design O&M 0.070. Hotwell 36.6 °C ng model; snapshot 40.0, alarm list 38.6. Hindi rin tugma ang snapshot sa sarili nito: ang saturation ng 0.057 ay 35 °C. Physics ang ginamit.

## CALIBRATED / NO-SOURCE
- UA factor (flow ÷ design)^0.5 at time constant 30 s: NO-SOURCE.
- LOW VACUUM trip 0.447 kg/cm2A: NO-SOURCE. Hindi mabasa ang setting sa TCS IBD (310SC90-794 "CONDENSER VACUUM VERY LOW TRIP"); ito ang dating trip ng app (U.vac 0.6).
- Transmitter offset 0.96 kg/cm2 ng PT-CD1117: CALIBRATED sa 28.png 16.9.
- CEP current na proportional sa shaft power: CALIBRATED sa 28.png 28.1 A (walang motor curve).
- Curve sa itaas ng 480 m3/h (130 m sa 560): extrapolated.
- Hotwell level rate 0.01 mm/s bawat T/H (dati): tugma sa O&M, 61.9 m3 ÷ 2.114 m ≈ 29 m2.

## Hindi pa ginawa
- PT-CD1110, TT-CD1110 at IT-P1116A / B ay wala sa ABC sheet; nasa model (`U.cdP`, `U.cdT`, `U.cdI0/1`) para sa HMI page na gagawin ni JISOO.
- Temperatura at vibration ng CEP motor (DITL-61B rows 8 ~ 15): default pa ang value.
- Coast-down ng CEP: biglang bumabagsak ang pressure.
- Hindi pa live-tested sa PC ng user.
