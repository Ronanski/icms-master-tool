# Plant model: Fans, air at flue gas (3.2.1-beta.3)

SEULGI : PLANT MODEL (boiler side), 2026-11-04 PHT. Code: `src/analog/engine/boiler.js` `AN_FN` / `anFanStart` / `anFanStep`.
Hook: `plantsw.js` array `bo` (DITL-28B row 12). Test: `tests/regress/fans.js` (6 PASS, cloud).

## Ano ang dati na at ano ang bago
- **Dati na (unit.js, loop model):** PA flow (FICFA1071) at SA flow (FICFA1081) habang tumatakbo ang PAF / SAF, furnace pressure
  (PICFG108) sa IDF, IDF speed, SAF outlet pressure PT-FA1085, damper positions.
- **Bago:**
  - FA blowers A / B: ang fluidizing air ay galing na sa model (blower tumatakbo, outlet SOV, inlet damper).
  - Motor current ng PAF, SAF, IDF, FA blower A / B.
  - PAF outlet PT-FA1075, FA header PT-FA1055-A / B, IDF inlet PT-FG1141-A / B, IDF outlet PT-FG1151.
  - Field trip ng PAF / SAF: humihinto ang hangin nila (dati: tuloy ang PA flow kahit TRIP ang PAF, dahil ang M.3302 ay hindi
    bumababa sa field trip).

## Connection
- FA blower F-1055A / B (DITL-28A at instance #B; IO STN103 I.0046 / I.0366) → outlet SOV XV-FA1055-A3 / B3 (DITL-28C, closed limit
  I.0045 / I.008F) → common header (PT-FA1055-A / B, FT-FA1055) → seal pots / loop seal.
- FA flow → ABC-006 M.3114 "FAB OUTLET AIR FLOW L.L. < 20 T/H" → DITL-28A #B row 20 → standby blower start.
- Current IT-F1055A / B → DITL-28B / #B row 12 "FAB A CURRENT" < 24.6 A (L.L.) → DITL-28A row 17 M.2548.
- PAF / SAF / IDF running = ang motor drawing (DITL-26A / 27A / 25A).

## Sources
- **Snapshot 7.PNG (151 MW):** PAF 253.6 A, SAF 134.0 A, IDF 199.6 A; PIFA1075 1551 sa FIFA1071 354.0; PIFA1085 1427 sa FIFA1081 213.0;
  PIFG1141A / B −442 / −450; PIFG1151 −7; TAF 592.1 T/H.
- **Snapshot 9.png (150 MW):** FA BLOWER-A 37.3 A, B 0 A (standby AUTO); FIFA1055 26.3 T/H; FCVFA1055A1 42.8 % A, FCVFA1055B1 24.9 % M;
  PIFA1055A 3257, PIFA1055B 3315 mmH2O (B nakahinto at sarado ang outlet SOV pero may header pressure: nasa common side ang
  transmitter, basa mula sa snapshot).
- **IO list:** tags at ranges (IT-F1053 0 ~ 746 A, IT-F1054 0 ~ 384, IT-F1056 0 ~ 700, IT-F1055A / B 0 ~ 98).
- **DITL-28A / 28B / 28C, ABC-006 / ABC-014 (drawing sa app):** M.3114 < 20 T/H, DITL-28B row 12 < 24.6 A, FICFA1055B force manual
  (M.0276: B hindi tumatakbo, o I.008E / I.008D hindi full open).
- **Fan manual (Cheng Chen):** PAF 6907 ACMM, 2481 mmAq, 3341 BkW, motor 3700 kW; SAF 4222 ACMM, 2075 mmAq, 1698 BkW, 1850 kW; IDF
  17621 ACMM, 858 mmAq, 2850 BkW, 3300 kW. Ginamit bilang sanity check lang (nasa ilalim ng design ang 150 MW).

## Paano gumagana
- **Current:** I = I(snapshot) × (0.45 + 0.55 × air power / air power ng snapshot); air power = flow × pressure rise.
- **Pressure:** system curve, sa square ng flow (PAF, FA header); IDF inlet / outlet sa square ng total air.
- **FA flow:** 26.3 T/H × (bukas ng damper ng mga blower na tumatakbo at bukas ang SOV) / 42.8 %. Ito ang target ng loop model ng
  FICFA1055A, kaya sumusunod pa rin sa sariling lag.

## Resulta (cloud test)
- **150 MW:** PAF 244.4 A, SAF 131.0 A, IDF 198.9 A, FA-A 35.7 A (snapshot 253.6 / 134.0 / 199.6 / 37.3; mas mababa ng 2 ~ 4 % dahil ang
  flow ng loop model ay 346 / 25.6, hindi 354 / 26.3). PIFA1075 1482, PIFA1055A 3081, PIFG1141A / B −440 / −448, PIFG1151 −7.
- **Trip ng FA blower A:** FA flow bumaba sa 10.7 T/H (< 20) → nag-start ang B → 14.3 T/H sa 24.9 % ng damper nito. Nananatili ang L.L.
  hanggang buksan ng operator ang damper ng B.
- **Trip ng PAF:** PA flow 0, current 0, outlet 0.
- **Cold:** walang fan, 0 lahat.

## CALIBRATED / NO-SOURCE
- No-load share ng current 0.45: NO-SOURCE (walang motor data sheet ng fans sa repo).
- Linear na damper (FA): NO-SOURCE.
- Pressure sa square ng flow: fan / system law, naka-anchor sa snapshot.
- Starting current (inrush): hindi ginawa, NO-SOURCE ang oras.

## Mga nakita (para sa ibang thread)
- **DITL-28C #B:** pagkatapos ng OPEN COMMAND (output 25) ng outlet SOV ng FA blower B, hindi bumababa ang closed limit (row 9,
  I.008F) at hindi tumataas ang open limit I.008E. Kaya FORCE MANUAL pa rin ang FICFA1055B (M.0276), at hindi tumatanggap ng bagong
  MAN value sa test. Pansamantala, ang model ay bumabasa ng OPEN COMMAND. Bug ng valve model ng DITL (hindi akin).
- **Running bit ng ABC (M.3302 / M.3303 PAF / SAF, at I.0046 FAB A RUNNING):** hindi bumababa sa field trip (`_ftrip`); ang motor drawing
  lang ang nagiging TRIP. Naayos para sa air flow sa pamamagitan ng `U.mul[].drw` (gaya ng BFWP ni IRENE).
- **Motor temperatures ng PAF / SAF / FA blowers:** may rows sa DITL-26B / 27B / 28B pero wala sa `AN_MT` (IDF lang). Kay IRENE.

## Hindi pa ginawa
- Fan curve mula sa manual (images ang curves): ang flow ay galing pa rin sa loop model.
- Hydraulic coupling working oil, PAF lube oil pumps (DITL-24), APH motor: hindi pa.
- Hindi nasubok sa PC ng user; wala pang loop check ni MINA.

## IRENE, 2026-11-04 6:11 PM PHT: PAF / SAF huminto sa screenshot run (NAAYOS)
- **Sanhi (bug ng app, hindi ng plant model):** kapag naka-VIEW / pause (hindi SIM) at binuksan ang isang DITL page, ang pagbasa ng logic
  (`src/digital/parts/03b-sim.js` `simOn()`) ay hindi gumagamit ng world inputs; na-reset ang latch ng DITL-27A (SAF RUNNING), sumunod
  ang PAF, at nag-MFT. Ang dati: `simOn()` = world lang kapag ang page ay ABC (`AN.cat === 'an'`).
- **Ayos:** `simOn()` = SIM, o ang world ay live / naka-on: ang DITL page sa VIEW ay tingin lang, hindi na nire-reset ang latch.
- **Patunay:** bagong test `tests/regress/pause_ditl_page.js`: FAIL sa lumang build, PASS sa bago.
- **Dagdag (SEULGI finding):** temperature at vibration ng PAF / SAF (DITL-26B / 27B rows 5 ~ 15) at FA blower A / B (DITL-28B at #B
  rows 1 ~ 14) galing na sa model (`unit.js` AN_MT, `plantsw.js` mtr): 150 MW bearing 55 ~ 58.6, winding 85 ~ 87 C, vibration
  2.2 ~ 2.5 mm/s (NO-SOURCE, kapareho ng IDF); ang nakatigil = 30 C / 0.1 mm/s. Walang trip sa 150 MW (PAF, SAF, FA-A RUN).
