# Plant model: Diesel Oil, start-up burners (3.2.1-beta.3)

SEULGI : PLANT MODEL (boiler side), 2026-11-04 PHT. Code: `src/analog/engine/boiler.js` `AN_DO` / `anDieselOilStep`.
Hooks: `unit.js` (anBoilerStart / anBoilerCold / anBoilerStep), `world/plantsw.js` (array `bo`, DITL-07 switches),
`api.js` `AN.doValve`. Test: `tests/regress/diesel_oil.js` (8 PASS, cloud).

## Connection (PD-022 1/5 Rev D, flow diagram RB p16 ~ 20)
- Tank T-0701 (LT-DO0701) → V-DO0003 (tank outlet) → strainer (DPT-DO0001, inlet V-DO0004) → P-0702A / B screw pumps
  (suction V-DO0015 / V-DO0016, discharge V-DO0007 / V-DO0009) → common header PT-DO0005.
- Header → PCV-DO0002 (MV ng ABC-028 PICDO0005) → recirculation pabalik sa tank.
- Header → FCV-DO1012 (HICDO1012) → unit 1 → ring PT-DO1008 → PCV-DO1009 (MV ng ABC-029 PICDO1008, return sa tank).
- Ring → 4 burner A ~ D: FT-DO1043-x / FCV (FICDO1043x, ABC-003A ~ D) → 2 shut-off valve (DITL-16 rows 21 / 23, BMS) → gun
  (PT-DO1043-x2, PSH-DO1043-x1). Atomizing air galing sa plant air (PSL-PA1043-x1).
- Pump start / stop at trip: DITL-31 (A) at DITL-31 #B. Standby auto start sa header < 5 (DITL-31 row 28).

## Sources
- **PD-022 1/5 Rev D:** line-up, valve tags, pump at tank tags.
- **Mass balance MB-022:** pump 25 T/H sa 15 kg/cm2; unit 1 12.5 T/H; burners 3.1 T/H bawat isa sa 10.5; recirculation 25 sa 2.
- **Snapshot 6.PNG (150 MW):** PIDO0005 12.8, PIDO1008 11.0, DPIDO0001 0.029, LIDO0701 4.978 m, P-0702A 25.4 A.
- **Alarm list:** PT-DO0005 H 19.5 / L 5 / LL 3; LT-DO0701 H 7.5 / L 3.2 / LL 0.2; DPT-DO0001 H 0.1 / HH 0.2;
  PT-DO1043 HH 6.0 / H 5.5 / L 0.8; PSH-DO1043 5.9; PSL-PA1043 L 3.0.
- **DITL-31 (drawing):** tank < 0.2 m trip, strainer > 0.8 trip, header < 5 LL (standby start), < 7 LOW.
- **SOP PR-OPE-5002 sect 20:** PI-DO0005 12.5, PI-DO1008 10.4. **Sect 27:** burner 1 ~ 5 kg/cm2, 614.4 ~ 3,078 kg/h.
- **O&M L14-4 (sa PC), ALLWEILER SN..ER screw pump:** positive displacement, relief mga 10 % sa ibabaw ng operating.
- **O&M L4 Burner M&S 1612 13-4-71 (sa PC):** load curve 5.0 bar sa 3,072 kg/h, MIN 614.4 kg/h, atomizing air 4.0 bar.
  **1612 13-4-105 (BMS):** range 1:5, ignition position, atomizing air 4 ~ 7 bar.

## Paano gumagana
- **Pump:** screw pump = 25 T/H na halos hindi nagbabago sa pressure; ang header pressure ay galing sa mga daanan
  (recirc PCV-DO0002, unit 1 FCV-DO1012, ring PCV-DO1009, burners). Relief sa 16.5 kg/cm2.
- **Network solver:** nested bisection: header P1, ring P2, flow ng bawat burner (Q² = Kb² x² (P2 − Q/g)).
- **Valves:** ang posisyon ng PCV / FCV ay ang MV ng controller (ZT, lag 3 s). Manual valves sa `AN.doValve(tag, %)`.
- **Burner:** dumadaloy lang kapag bukas ang dalawang shut-off valve (DITL-16 out 21 at 23). Ang BMS ang humahawak sa
  ignition position (25 %) hanggang release.
- **Tank:** bumababa ang level sa langis na nasusunog (tank area 23.8 m2, 0.85 t/m3). Sa < 0.2 m, trip ang pump (DITL-31).
- **Current:** 25.4 A × (0.45 + 0.55 × hydraulic power / 150 MW point).

## Resulta (cloud test, dist beta.3)
- **150 MW:** P1 12.80, P2 11.00, DP 0.029, level 4.978, I 25.4 A (tugma sa 6.PNG). Binabasa ng logic: PICDO0005 / PICDO1008 PV,
  DITL-31 rows 15 / 17 / 28.
- **Burner A sa oil (ignition):** 0.947 T/H, gun 1.57 bar, ring 9.79.
- **4 burner:** 0.926 T/H bawat isa, tank −0.03 m sa 10 min.
- **Trip ng pump A:** header 4.66 (< 5) → B auto start → header 12.98.
- **Parehong pump trip:** walang header, walang langis sa burner.
- **Cold SOP 20:** lahat bukas = 3.0 kg/cm2; PCV-DO0002 20 % = 16.5 (relief); sarado ang strainer inlet = 0.

## Mga kabit sa logic
- DITL-31 / #B: running → pump; row 15 (LT-DO0701), row 17 (DPT-DO0001), row 28 (PT-DO0005).
- DITL-16 (A ~ #D): rows 21 / 23 OPENED → burner flow. ABC M.3410 / 3411 / 3416 / 3417 (BMS valve) ay binabasa rin.
- DITL-07 (A ~ #D): PSH-DO1043-x1 (gun > 5.9) at PSL-PA1043-x1 (atomizing air < 3.0, galing sa plant air ni IRENE).
- ABC-028 PICDO0005, ABC-029 PICDO1008, HICDO1012, ABC-003A ~ D FICDO1043A ~ D at PICDO1043x: PV galing sa model.
- ZT-DO1012 (AI0276) dati ay 0; ngayon sumusunod sa command.

## CALIBRATED / NO-SOURCE
- Tank area 23.8 m2 at density 0.85: NO-SOURCE (walang tank drawing).
- Current 45 % sa no-load: NO-SOURCE.
- Lags (pump 1 s, valve 3 s), linear valves: NO-SOURCE.
- Unit 2 branch: sarado (main plant unit 1 lang).
- Valve K (Ka, Kf, Kr, Kb): CALIBRATED sa MB-022 at 6.PNG.

## UNUSUAL
- SOP sect 20 ay may "V-DO0017" sa pump discharge; wala ito sa PD-022 (V-DO0007 / V-DO0009 ang nasa drawing).

## Hindi pa ginawa
- Faceplate ng field valves V-DO (hmi-temp / fp-pop, sakop ni IRENE).
- Init sa ibang Start (load) bukod sa 150 MW at Cold: sumusunod sa 150 MW.
- Hindi nasubok sa PC ng user, loop check ni MINA.
