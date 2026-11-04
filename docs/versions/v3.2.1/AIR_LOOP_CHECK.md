# Loop check checklist — Instrument Air at Plant Air, plant model 3.2.1-beta.3

Para sa team (loop check, memory #89): totoong pindot sa HMI page, isang tag bawat linya. Isulat ang PASS / FAIL at screenshot. Ang
inaasahan ay galing sa `AIR_PLANT_MODEL.md`. Simula: RUN, plant model ON.

## A. Panimula (Start at 150 MW)
1. IA compressor A at PA compressor A RUNNING; B at C STOPPED.
2. PT-IA0706-A / B 7.0, PT-IA1706 6.8 kg/cm2. PT-PA0705-A / B 7.0, PT-PA1705 6.8 kg/cm2.
3. IT-C0704A ~212 A. IT-C0703A ~43.8 A. TE-M0703-A1 ~61 °C.
4. FI-D0704A ~1200 m3/h, FI-D0703A ~1500 m3/h (dryer A in service).
5. Walang alarm na "PRESSURE LOW", PSL-IA1706 NORMAL.

## B. Auto start (DITL-113 / 114)
1. **Trip ng IA compressor A (I.0016, test tool).** Inaasahan:
   - bumababa ang tanks, mga 0.03 kg/cm2 bawat segundo;
   - sa < 5.0 nang 3 s: M.0300 ACTIVE;
   - START COMMAND (5 s pulse) sa B at C;
   - IA compressor B lang ang tatakbo (REMOTE). C ay LOCAL, hindi tatakbo;
   - IT-C0704B: 500 A (range) nang ~3 s, saka ~212 A;
   - bumabalik ang tanks sa 7.0.
2. **Trip ng PA compressor A (I.0011).** Pareho: M.0310, PA compressor B tumatakbo, IT-C0703B 140 A (range) nang ~10 s, saka ~43.8 A.
3. Ang compressor A ay hindi kusang babalik (trip). Annunciator "A-INST. AIR COMPRESSOR STOPPED" / "A-PLANT AIR COMPRESSOR STOPPED" (DITL-42).

## C. Instrument air MFT (DITL-03G)
1. Trip ng lahat ng IA compressor. Inaasahan:
   - < 5.0: alarm L;
   - < 3.5 (2 sa 3): instrument air MFT ng DITL-03G;
   - < 2.8: PSL-IA1706 LOW.

## D. Cold
1. Lahat ng compressor STOPPED. Tanks 0 kg/cm2.
2. Field START ng IA compressor A (local panel, Training). Inaasahan: tumatakbo, tumataas ang tanks, 7.0 sa loob ng ~6 min.

## E. Manual valves (FIELD faceplate, `FIELD_VALVES.md`; Start at 150 MW)
1. V-IA1101 → CLOSE. Inaasahan: PT-IA1706 bumababa (< 2.8 sa ~90 s), PSL-IA1706 LOW, DITL-03G row 7; tanks 7.0. Ibalik sa OPEN: 6.8.
2. V-PA0013 → OPEN, saka trip ng lahat ng IA compressor. Inaasahan: IA tanks ~6.4 mula sa plant air, walang instrument air MFT.
