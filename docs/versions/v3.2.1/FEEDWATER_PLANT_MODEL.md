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
- **Deaerator pressure (bago):** sa load, hindi bababa sa extraction no. 3: 5.3 × steam ÷ 474.1 T/H. Dati ay ~1 kg/cm2 sa 150 MW (ang pegging lang ang binibilang), kaya ~1.7 lang ang BFWP suction. Mula 4:42 PM: floor din ito ng estado ng loop (`plant.js`), kaya 5.3 agad pagka-Start at 150 MW.
- **Suction manual valve (bago, 4:42 PM):** V-FW1001 (A) / V-FW1002 (B), field valve sa `AN_FV0` (normal: bukas). Source: PR-OPE-5002 19.16 "Fully OPEN BFPs suction (V-FW1002/V-FW1001) ... Check if the limit switch is touched"; IO list STN102 I.028F ZSO-FW1031 (A) / I.032F ZSO-FW1032 (B). Ang A = 1001 at B = 1002 ay ayon sa numero ng discharge MOV (MV-FW1001 = A, MV-FW1002 = B). Ang limit switch (DITL-23A row 11, at #B) = valve 100 % (`plantsw.js`). Sarado ang suction = walang tubig mula sa pump na iyon.

## Resulta (cloud test, 150 MW, pagkatapos ng 5 min)
- BFWP-A 540 m3/h, PT-FW1011 164.5 kg/cm2 (snapshot 165.4), 287.1 A (289.4), strainer DP 0.28 (0.29). Pareho ang basa ng DITL-23B.
- BFWP suction ~6.1 kg/cm2 agad (snapshot 6.7); dati 1.8 sa simula, 5.3 pagkatapos ng 5 min.
- Trip ng BFWP-A (FIELD TRIP): PT-FW1011 bumaba < 155, M.3210 LL sa DITL-23B → BFWP-B AUTO START (O.1400) → B tumatakbo pagkatapos ng 1.5 s; pagkatapos ng 60 s: 570 m3/h, PT-FW1011 158.7, 294.6 A, feedwater 520 T/H (bago ang trip 491).
- V-FW1002 sinara sa field habang B lang ang tumatakbo: 0 ang feedwater.

## BUKAS (nakita sa test, aayusin)
1. **NAAYOS (4:42 PM): BFWP-B auto start.** Ang dahilan ay hindi ang lube oil (I.0411 = 1). Sa drawing DITL-23A, ang START ng HV soft starter ay kailangan ng AND ng lube oil > 2.0, suction pressure > 1.5 AT "SUCTION MANUAL VALVE OPEN" (row 11, ZSO-FW1031 / 1032). Walang nagbibigay ng row na iyon sa #B (0 lagi). Ngayon ito ang limit switch ng V-FW1002 sa plant model.
2. **NAAYOS (4:29 PM):** dati, tuloy ang feedwater flow kahit walang BFWP. Ngayon, binabasa rin ng feedwater ang motor ng DITL-23A / #B: pagkatapos ng FIELD TRIP, 0 ang feedwater. Natitira: ang ABC-010 M.3343 (DITL-23A output 55 RUNNING) ay 1 pa rin pagkatapos ng FIELD TRIP; ito ang binabasa ng ibang ABC logic.
3. **NAAYOS (4:42 PM): deaerator pressure pagkatapos ng Start at 150 MW** ay 5.3 agad (dati ~1 at ilang minuto bago umabot sa 5).
5. **NAAYOS (5:17 PM): boiler trip pagkatapos ng trip ng BFWP-A.** Tumatakbo na ang B pagkatapos ng 1.5 s, pero ang feedwater ay bumabalik sa lag ng FICFW1007 loop (75 s), kaya umabot sa drum level L.L. at nag-MFT pagkatapos ng ~55 s. Ngayon, kapag bumalik ang makina (pump o fan), ang flow ay bumabalik sa start-up time na 5 s (NO-SOURCE, `plant.js`): 550 T/H sa 12 s, walang boiler trip (test `feedwater.js`).
6. **Bukas (para sa tester / fixer):** sa screenshot run lang (UI na lumilipat ng DITL sheet sa VIEW habang tumatakbo), huminto ang PAF at SAF at nag-MFT pagkatapos ng ~10 min. Hindi ito lumabas sa test na walang UI (`hp_heaters.js`, 940 s probe). Hindi pa alam ang sanhi.
4. **Tugma sa snapshot:** 02.png (60.3 MW, 203.7 T/H) PICD1104 2.2 kg/cm2, TICD1104 131 °C; model sa 203.7 T/H: 5.3 × 203.7 ÷ 474.1 = 2.3. 5.png (152.5 MW) DEAERATOR PV 5.9; model 5.3 (4.PNG PITS1017).

## CALIBRATED / NO-SOURCE
- Extraction no. 3 na linear sa steam: NO-SOURCE.
- Current na proportional sa shaft power: CALIBRATED sa 03.png (walang motor curve na nabasa; TECO manual sa PC).
- Power sa 0 m3/h (1170 kW): extrapolated mula sa curve.

## Hindi pa ginawa
- HP heaters (TT-FW1105 / 1106, drains), economizer inlet PT-FW1160.
- Temperatura at vibration ng BFWP motor at pump (DITL-23B rows 10 ~ 24): default pa.
- Hindi pa live-tested sa PC ng user.

## Dagdag (3.2.1-beta.16): ang mga value ng page 06 FEEDWATER

Hiling ng coordinator (JISOO page 06, beta.15). Galing na sa model (`unit.js` `anFwTagStep`, `AN.unit.tt`; page map sa `tools/hmi-mock/p06-head.js`). Test: `tests/regress/fw_page_values.js` ALL PASS (150 MW, main steam 471 T/H).

- **PT-TS1013 / PT-TS1017** (extraction No.2 / No.3) = snapshot × main steam / 472.7 (absolute, turbine stage). Source 4.PNG 14.07 / 5.30. Model 14.02 / 5.28.
- **TT-TS1011** (cold reheat papuntang No.2 HPH) = cold reheat temperature ng model. 4.PNG 371, model 368.7.
- **PT-FW1115-A / B** (BFWP suction) = suction header (`plantsw.js` sucP) − loss ng branch ng tumatakbong pump. Header = deaerator pressure + 1.8 kg/cm2 (static head) + level. Source: dalawang snapshot, ang pump na hindi tumatakbo (strainer DP 0.00): mababang load PICD1104 2.2 → PIFW1115B 4.0; 03.png PIFW1115B 7.1 = deaerator ng model ~5.3 + 1.8. Branch loss = strainer DP × 0.4 / 0.29 (03.png: A 6.7 = B 7.1 − 0.4 sa DP 0.29; tugma rin sa mababang load: DP 0.07 → 3.9, PIFW1115A 3.9). Model 6.7 / 7.1 (dati 5.9 / 6.1 dahil ASSUMED ang head 2.2 at loss 1.4; inalis na). Ang BFWP discharge PT-FW1011 ay mula sa inlet ng pump na ito: 165.9 (03.png 165.4).
- **TT-FW1011** (BFWP discharge) = saturation ng PT-CD1104. 03.png 162, model 160.
- **PT-FW1160** (economizer inlet) = drum + 3.5 × (feedwater / 499.1)². Source 03.png 137.7 − 134.2. Model 137.1.
- **ZT-FW1110-1 / -2, ZT-FW1120-1 / -2** = F(X) ng controller MV (ABC-011 LN47 / LN46, ABC-012 LN49 / LN48), hawak kapag walang hangin (airlock). Model 45.3 / 100, 15.5 / 100 (03.png 45.5 / 100.7, 14.9 / 99.7).
- **FT-FW1109 / FT-FW1119** (SH spray No.1 / No.2) = Cv ng valve (vendor sheets K1AU3-E2-0-123 items 19 / 20 / 23 / 24, mga punto ng travel) × block valve × √(PT-FW1011 − presyon sa spray point). Spray point = drum − 6.4 / 9.3 × (main steam / 474.1)² (03.png PIBR1130 127.8, PIBR1150 124.9). Model 37.3 / 28.8 (03.png 37.5 / 28.2).
  - **UNUSUAL:** ang No.2 spray ayon sa sheet (equal % sa 14.9 % travel) ay 9.6 T/H lang, pero 28.2 sa 03.png. Ang snapshot ang tunay na operating point (CLAUDE.md 4), kaya × 2.94 ang No.2. Hindi alam ang sanhi (posibleng characterization ng positioner).
- **FT-FW1149** (RH spray) = 14.8 × TCV-FW1150 / 66.0 × XV-FW1151 × √(dp / 130.5). Source 5.png. NO-SOURCE: linear valve at tap sa BFWP discharge (walang sheet ang TCV-FW1150). Model 19.5 sa 150 MW dahil 79.4 % ang MV sa Start at 150 MW (ibang snapshot).
- **FT-FW1059** (HP bypass spray) = 40 T/H × TCV-FW1060 × XV-FW1061 × √(dp / 130.5). NO-SOURCE: walang sheet, ang capacity ay ang range sa IO list. Ang 4.PNG 1.8 T/H sa 0.1 % at sarado ang block valve ay hindi ginaya (offset o tagas).
- **XV-TS1700 / 1710:** wala sa anumang DCS sheet: NO-SOURCE, hindi ginawa.
- Walang BFWP head (sarado ang V-FW1001 / 1002): 0 ang lahat ng spray.

## MV-TS1003 sa AUTO: hindi gumagalaw sa CLOSE + EXECUTE (tama, ayon sa drawing)

Binasa ang netlist ng DITL-96 (EXTRACTION STM NO.3 SHUT-OFF MOV MV-TS1003). Ang CLOSE command (MOS-TS1003, O.0139) ay:

- OR ng (a) **row 13 CLOSE PB (M.0301) AT row 5 MANUAL MODE SELECTED (NOT M.0303)**, at (b) row 20 AUTO MODE SELECTED AT (row 19 DEAERATOR LEVEL HI-HI M.0161 O row 18 TURBINE TRIP I.0400 O row 17 HOUSE OPERATION M.3101);
- AT row 11 REMOTE (I.001D), at hindi pa FULLY CLOSED (row 10).

Kaya sa AUTO, hindi tinatanggap ang CLOSE P.B. ng operator. Ang logic lang ang nagsasara (DA level H.H., turbine trip, house operation). Para isara ng kamay: pindutin muna ang MAN. Finding (b): tama, may ebidensya (DITL-96 rows 5, 13, 17 ~ 20). Ganoon din ang DITL-94 (rows 5, 13, 19, 20).
