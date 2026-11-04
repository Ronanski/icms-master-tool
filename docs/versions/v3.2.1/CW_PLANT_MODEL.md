# Circulating Water (seawater) plant model — 3.2.1-beta.1

Thread IRENE : PLANT MODEL, 2026-11-04 PHT. User OK: "OK lang nang ok kay irene ... Tapusin muna lahat. S loop check ako makialam."
Code: `src/analog/engine/unit.js` (`AN_SW`, `swSolve`, `anSeawaterStep`, `anSwValve`), `src/analog/engine/api.js` (`AN.swValve`,
`AN.swValves`), `src/world/eng.js` (action `swValve`), `src/world/plantsw.js` (DITL-29B rows). Test: `tests/regress/cw_model.js`.

## Ano ang ginagawa ng model

Bawat hakbang, kinakalkula ang tubig sa buong seawater system (flow diagram K1AU3-PD-020 Rev D):
forebay → SWP P-1501A/B/C → check valve → V-SW1002/1004/1006 → 96" header → debris filter S-1502 → condenser path A (V-SW1007,
tubes, V-SW1009) at path B (V-SW1008, V-SW1010) → siphon pit → discharge channel. Mula sa header (node N) → SWBP P-1503A/B/C →
V-SW1016/1018/1020 → debris filter S-1504 → CCW heat exchangers H-1107A/B/C → discharge.

Ang head ng bawat tumatakbong pump (sa tunay na curve) ay tinatapat sa loss ng mga linya (loss ∝ flow²). Lumalabas: flow ng bawat
pump, pressure sa bawat gauge, DP ng filter, temperatura ng condenser, current ng motor.

## Mga source (bawat value)

Ang D1-0-0xx (tg-engineer-data) at ang O&M L18-x ay nasa PC ng user lang (`document-references/tg-engineer-data`, `document-references/o&m-package-phase-1`, wala sa git); kopya sa project files `cw-plant-model/vendor/`. Scan ang mga PDF: binasa bilang larawan.

- SWP head at efficiency vs flow (0 ~ 22,680 m3/h; shut-off 47 m, 28 m sa 18,900). Source: EBARA 1350VZM, K1AU3-D1-0-064 p6 "Pump characteristic curve" R1306832-8902-0102 (binasa sa graph).
- SWP rated 18,900 m3/h × 28 m × 507 rpm × 2050 kW, min 5,000, max 22,680, sp.gr 1.02, discharge center GL +1.8 m, LLWL GL -9.78. Source: D1-0-064 p4 "Vertical pump data sheet" R1306832-8902-0101.
- SWP shaft power vs flow (1,620 ~ 1,720 kW). Source: D1-0-064 p6 (ibaba ng graph).
- SWP motor current: load 25/50/75/100/125 % = 166/182/216/260/317 A. Source: TECO 3A057H238-05900, D1-0-064 p26.
- SWP starting current 500 A (soft starter). Source: PR-OPE-5002 sec 2 "Starting Current – 500A", "SWP soft starter".
- SWBP: 1,000 m3/h × 15 m, shut-off 19.9 m, eff 80.25 %, BEP 1,129.9 m3/h, 50.87 kW. Source: PACO CL12151, K1AU3-D1-0-034 p8.
- SWBP motor: 100 HP 460 V, 120 A sa 100 %, LRC 685 %, Y/Δ start. Source: TECO, D1-0-034 p10.
- SWBP current normal 90 / alarm 120 / trip 126 A, suction 1 ~ 1.1, discharge 2.3 ~ 2.4. Source: PR-OPE-5002 sec 5.
- S-1502: normal 37,800 m3/h, clean DP 500 mmH2O, backwash 800, flushing 3 min, max 1.0 kg/cm2. Source: Debris filter DN2400 O&M (o&m-package L18-4), Technical details.
- S-1504: normal 2,000 m3/h, clean 500, backwash 800 mmH2O. Source: Debris filter DN600 O&M (L18-5).
- Condenser: tube side 30 → 35.6 °C sa 31,500 T/H, steam 316.024 T/H. Source: K1AU3-D1-0-039 R0 p7 Design specification.
- Condenser inlet 1.0 ~ 1.1, drop 0.4, outlet valve 22 % → 40 %, discharge valve 10 % crack, PG-SW1501 2.2 ~ 2.4 (monitor 2.2 ~ 2.8). Source: PR-OPE-5002 sec 2.
- Seawater inlet 28.5 / 28.6 °C. Source: HMI snapshot 30.PNG.
- Forebay -4 m. Source: PR-OPE-5002 sec 2 "NL = 4m below GL" (live test beta.74 #36).
- Trip ng SWP: bearing HH 100, winding HH 155, vibration HH 11.9 (pump B 16.8) mm/s, 5 s. Source: Alarm list 2016-09-12 (TE / VT), DITL-29B OUT18.
- Shut-off: buksan ang discharge valve sa loob ng 2 min. Source: EBARA O&M R1306832-8902-0134 p4-2, p4-4.

Calibration (isang design point lang, kung saan nagtutugma ang dalawang vendor doc): 2 SWP × 18,900 = 37,800 m3/h = normal flow ng
S-1502. Sa puntong iyon: PG-SW1501 = 0.102 × (28 − 1.8 − 4) = 2.26 kg/cm2 (SOP 2.2 ~ 2.4), condenser inlet 1.05, drop 0.4, 2 SWBP
sa 2.35 kg/cm2. Ang lahat ng ibang operating point ay galing sa physics ng curve at linya, hindi hula.

## NO-SOURCE (walang dokumento; nakasulat sa code)

1. Valve characteristic ng mga manual butterfly valve: flow area = opening² (loss × 1/opening⁴). Walang valve data sa repo o sa O&M.
2. Loss ng bukas na valve: SWP discharge 0.3 m sa 18,900 m3/h, condenser inlet 0.02 kg/cm2, SWBP discharge 0.3 m sa 1,000 m3/h.
3. Elevation ng PT-SW1110 at ng siphon: isinama sa line constant (galing sa design point).
4. Ramp ng soft starter ng SWP 10 s; Y/Δ ng SWBP 5 s.
5. Bilis ng dumi ng filter: 4 h mula malinis hanggang 800 mmH2O.
6. SWBP power sa mababang flow: hindi bababa sa 40 % ng 50.87 kW.
7. SWP current sa 0 % load: 150 A (extrapolation ng 25 ~ 50 % ng TECO table).
8. Motor temperature / vibration (dati na, `AN_MT`): ASSUMED pa rin.

## UNUSUAL (magkasalungat ang mga dokumento; hindi binago, para sa user)

1. SWP current: model ~229 A sa 18,500 m3/h (EBARA shaft power 1,700 kW = 83 % load → TECO 229 A). SOP normal 205 ~ 215 A. Snapshot
   30.PNG: 207.6 / 225.1 / 242.5 A. Sumusunod ang model sa vendor data (nasa loob ng snapshot).
2. Forebay: SOP NL -4 m, pero alarm list LT-SW1501 H -6.0 m (range -13 ~ -3, pit bottom GL -14.73). Sa -4 m dapat naka-H alarm.
   30.PNG = -8.76 m. Iniwan sa -4 (desisyon ng live test #36).
3. Condenser flow sa design point 35,350 m3/h (≈ 36,060 T/H) vs D1-0-039 "max flowrate 31,500 T/H" (+15 %).
4. S-1502 clean DP: vendor 500 mmH2O (50 mbar) vs SOP "Input cut in 20 mBar"; backwash 800 mmH2O = SOP 80 mbar (tugma).
5. S-1504 DP mga 750 mmH2O sa 2 SWBP (2,450 m3/h, SOP 2.35 discharge) vs vendor normal 2,000 m3/h → 500; malapit sa backwash 800.
6. Isang SWP na fully open ang valve: 25,600 m3/h (lampas sa max 22,680, extrapolated ang curve: run-out). `U.swRunout` = 1.
   Sa SOP, ina-adjust ng operator ang valve hanggang 2.2 ~ 2.4 kg/cm2.

## Bagong value sa `AN.unit` (para sa HMI at loop check)

`swQa0..2` flow ng SWP, `swQb0..2` flow ng SWBP, `swQt` kabuuan, `swQcA / swQcB / swQc` condenser, `swQbT` SWBP kabuuan,
`swKw0..2` shaft power, `swLow0..2` (array `swLow`) segundo sa ilalim ng min flow, `swRunout`, `swSpd / swbSpd` bilis.
Dati pa at pareho ang pangalan: `swPiA/B`, `swPoA/B`, `swTiA/B`, `swToA/B`, `swPd0..2`, `swDp1/2`, `swIa0..2`, `swIb0..2`,
`swBs0..2`, `swBd0..2`, `swLvl`, `swN`, `swNb`.

Field valves: `AN.swValve('V-SW1002', 10)`; `AN.swValves()`. Default = normal line-up ng tumatakbong unit (discharge 100 %,
condenser inlet 100 %, outlet 40 %, SWBP discharge 100 %). Wala pang pindutan sa HMI: ang bagong CW page (mockup ni JISOO) ang
magkakabit.

## Hindi pa nagagawa

- Hypochlorite (PD-043, 1.2 m3/h bawat pump): field equipment pa rin (`AN_SRC.field.hypo`), walang hydraulic.
- Priming air ejector at water box vent: hindi modelo (walang hangin sa linya sa model).
- Tide ng forebay: constant.
- Vacuum ng condenser: nakadepende pa rin sa "SWP tumatakbo", hindi sa flow.

## Nasubok (cloud, headless; HINDI live)

- `tests/regress/cw_model.js` 11 PASS: 150 MW design point, outlet 40 → 22 %, lahat STOP, start 500 A, crack 10 %, open 100 %.
- Start at 150 MW (world ON, RUN): SWP B / C 18,900 m3/h, 230 A, PG 2.26; condenser 1.05 / 0.65 kg/cm2, 33.6 / 33.7 °C; S-1502 500 mmH2O; SWBP A / C 90 A (larawan sa project files `cw-plant-model/cw-150MW-model.png`).
- `tests.js`, `eng_headless.js`, `plant_utilities.js` PASS. `check_panel.js` M4 Cold start 3 / 10 at `loop_source.js` 2 FAIL: pareho sa `main` (3.2.0) bago ang pagbabagong ito.
