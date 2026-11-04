# Loop check checklist — Make-Up Water at Closed Cooling Water, plant model 3.2.1-beta.2

Para sa team (loop check, memory #89): totoong pindot sa HMI page, isang tag bawat linya. Isulat ang PASS / FAIL at screenshot. Ang
inaasahan ay galing sa `MU_CCW_PLANT_MODEL.md`. Simula: RUN, plant model ON.

## A. Panimula (Start at 150 MW)
1. ACWP-A RUNNING, ACWP-B STOPPED + AUTO. PT-CW1152 6.4, PT-CW1153 5.2 kg/cm2. TT-CW1152 ~40, TT-CW1153 ~38 °C.
2. Current ng ACWP-A: ~26.8 A. Ang 27.PNG ay 28.2 A; ito ay UNUSUAL, hindi FAIL.
3. Strainer DP ng ACWP-A: 0.27 kg/cm2.
4. MWP-A at MWP-C RUNNING, MWP-B STOPPED. PT-MU0709 ~9.0 kg/cm2.
5. Current ng MWP: ~28 A. Ang SOP ay 20 A; ito ay UNUSUAL, hindi FAIL.
6. Mga value sa ash cooler page:
   - PT-CW1156 = 5.2;
   - TT-CW1060 = supply + 1 °C;
   - walang "cooling water flow low".

## B. ACWP — logic DITL-76 / 77
1. **STOP ng ACWP-A (faceplate).** Inaasahan:
   - flow 0;
   - PT-CW1152 at PT-CW1156 bumaba sa ~1.45 (static);
   - annunciator "COOLING WATER PRESSURE ABNORMAL" (DITL-41);
   - FS-CW1060 flow low (DITL-21B).
   - HINDI kusang nag-start ang B, kasi normal stop ito, hindi trip. Ayon ito sa drawing.
2. **Trip ng ACWP-A (I.0087, test tool).** Inaasahan:
   - ACWP-B AUTO START sa loob ng ilang segundo;
   - 240 A habang soft start, saka ~26.8 A;
   - flow 1500, PT-CW1152 6.4.
3. **START ng pangalawang ACWP habang tumatakbo ang isa.** Inaasahan: flow at PT-CW1152 tumaas (parallel), at bawat pump ay mas mababa ang flow.
4. **Trip interlock (DITL-76 / 77 rows 13 ~ 17, 26):**
   - bearing > 100 °C, winding > 165 °C, expansion tank < 0.3 m → trip;
   - strainer DP > 0.8 nang 5 s → trip.

## C. CCWHE / temperatura
1. Itigil ang lahat ng SWBP. Inaasahan:
   - TT-CW1152 at TT-CW1153 tumataas, ~1 °C kada minuto sa full load;
   - alarm ng TE-CW1153 sa 40 °C at ng TE-CW1152 sa 50 / 60 °C.
2. I-start ulit ang SWBP. Inaasahan: bumabalik ang temp sa ~40 / 38 sa loob ng ~10 ~ 20 min.
3. Load pababa (hal. 75 MW). Inaasahan: bahagyang bumaba ang temp (mas maliit na heat load).

## D. Make-up water — logic DITL-112 / 78 / 60
1. **STOP ng isang MWP:** header halos pareho, ang isang pump ang nagdadala ng lahat ng flow.
2. **STOP ng lahat ng MWP:**
   - header bumaba sa ~2.5 kg/cm2 (static);
   - M.2506 L.L. (< 5.5);
   - standby AUTO start kung may MWP na naka-AUTO.
3. **START ng MWP:** 451 A nang ~2 s, saka ~28 A; header ~9.
4. **XV-MU1109 OPEN, header > 6:**
   - LT-CW1109 tumataas (0.003 m/s);
   - FT-MU1001 +10 m3/h;
   - AUTO: sarado sa > 85 %.
5. **LCV-MU1110 (hotwell):** FT-MU1001 sumusunod sa make-up ng hotwell.

## E. Cold
1. Lahat ng pump STOPPED.
2. PT-CW1152 / 1153 / 1156 ~1.45 (static, low alarm).
3. 8 FS-CW1060 = flow low.
4. PT-MU0709 ~2.5.
5. Temperatura ~30 °C.

## F. Manual valves (FIELD faceplate, `FIELD_VALVES.md`; Start at 150 MW)
1. Pindutin ang V-CW1013 → CLOSE. Inaasahan: berde ang valve, ACW flow ~1334 m3/h, PT-CW1152 ~6.7.
2. V-CW1014 → CLOSE. Inaasahan: flow 0, PT-CW1152 ~8.2 (shut-off), TT-CW1152 tumataas. Ibalik pareho sa OPEN.
3. V-CW1007 → 5 %. Inaasahan: PT-CW1152 < 3.5, ACWP-B AUTO START (DITL-77), flow ~1500 m3/h. Ibalik sa OPEN.
4. V-MU0007 at V-MU0011 → CLOSE. Inaasahan: PT-MU0709 ~2.5 kg/cm2, ang logic (DITL-112) ay pareho ang basa. Ibalik sa OPEN: ~9.0.
5. Sa Start at 150 MW: lahat ng valve bumabalik sa normal (V-CW1012 / 1015 sarado, ang iba bukas).

## G. Turbine oil sa closed cooling (`TURBINE_OIL_PLANT_MODEL.md`; Start at 150 MW)
1. 036 TURBINE OIL: TILO10021 / 22 ~46 °C, TILO1001 ~62 °C, TCV-CW1201 ~52 %.
2. Trip ng lahat ng SWBP (DITL-30 A / B / C, test tool). Inaasahan: pagkatapos ng 10 min, ACW supply ~52 °C at TCV-CW1201 100 %; pagkatapos ng 25 min, TILO10021 ~73 °C at TIGE1007 ~82 °C.
