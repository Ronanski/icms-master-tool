# Loop check: Condensate, condenser at hotwell (para kay MINA : TESTER)

IRENE : PLANT MODEL, 2026-11-04 PHT. Model: `CONDENSATE_PLANT_MODEL.md`. Walang bagong HMI page pa (JISOO). Basahin sa TEMP 028
CONDENSATE & FEEDWATER, sa faceplate ng LICCD1110A / FICCD1120 / LICCD1104, at sa DITL-61A / 61B / 55.

## A. Start at 150 MW
1. DITL-61B row 19 PT-CD1117 ~16.8 kg/cm2 (28.png 16.9). DITL-61A rows 24 / 27: 0.019 / 0.
2. DITL-55 row 6 PT-CD1110 ~0.063 kg/cm2A (4.PNG 0.057).
3. CP-A RUNNING, CP-B AUTO standby. LICCD1110A at LICCD1104 sa AUTO, steady.

## B. Logic
1. Trip ng CEP A (DITL-61A row 2 MIT-P1116A, test tool). Inaasahan: PT-CD1117 < 14.0 → M.3217; CEP B RUNNING sa loob ng ~2 s; PT-CD1117 ~16.8.
2. LSLL-CD1110: kapag ang hotwell < -150 mm, LOW LOW (DITL-61A row 11).

## C. Seawater → condenser (FIELD faceplate, 030 Seawater)
1. V-SW1007 → CLOSE. Inaasahan: condenser ~0.071 kg/cm2A pagkatapos ng 2 min, walang trip.
2. V-SW1008 → CLOSE din. Inaasahan: PT-CD1110 > 0.447 sa loob ng ~1 min, turbine LOW VACUUM trip.

## D. Make-up
1. V-MU0007 at V-MU0011 → CLOSE (Make-up page). Inaasahan: LCV-MU1110 bukas pero walang daloy; bumababa ang hotwell (~-29 mm sa 2 min); sa AUTO, ang LICCD1110A ay nagbubukas pa.
