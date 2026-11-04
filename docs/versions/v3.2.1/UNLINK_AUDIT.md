# UNLINK / link audit (3.2.1)

## DITL-771 RESET of DONE and LINE BLOCKAGE (SEULGI, 2026-11-04 11:05 PM PHT)
- Drawing: E10210-3-771 "Sand injection system control logic (1)", `document-references/sand-sootblower-logic.zip` `Sand Logic/PDF/771.pdf` (binasa bilang larawan).
- DONE flip-flop (M.081C, sa kanan ng TR313 / M.0820): ang Q ay pumupunta sa TR314 (ON DELAY 3 s), at ang output ng TR314 ay bumabalik sa R ng parehong flip-flop. Pulse na 3 s ang DONE.
- LINE BLOCKAGE flip-flop (B.1202 / M.0813): S = TR315 (600 s); R = ang wire ng I.0575 VESSEL PRES. LOW (parehong wire na pumapasok sa NOT bago ang TR315).
- App bago: walang R ang dalawang FF (PDF reader `tools/data/sand_sheet.py`), kaya ang DONE ay nananatiling 1 at hindi umuulit ang cycle.
- Ayos: `src/digital/parts/02b-sand.js` `sdResetFix`. Ikinakabit ang R ayon sa istruktura (TR314 / TR315 tag), hindi sa numero ng net. Walang link na tinanggal.
- Test: `tests/regress/sand.js` 6 PASS (umuulit ang cycle, walang LINE BLOCKAGE).

## DITL-LS212 / LS210 / LS100 limestone (SEULGI, 2026-11-05 12:00 AM PHT)
- Drawing: `document-references/bottomash-limestone-logic.zip` `Limestone Logic/limestone_logic.xls`, E10211 sheet 212 "ISOLATING VALVE", sheet 210 "CONVEY AIR VALVE", sheet 100 "FILLING CYCLE STEP 8" (LibreOffice PDF, binasa bilang larawan sa 300 / 900 dpi; cell borders ng .xlsx copy).
- **LS212 row 15 / row 17 = dalawang wire.** Sa column 9 (x 147.5) walang border ang rows 63 ~ 64 ng Excel: ang wire ng row 15 M.182D PERMIT ay T sa dot (y -141.4) papunta sa dalawang AND; ang wire ng row 17 M.1846 PLANT EMERGENCY STOP ay umaakyat lang hanggang y -145.9 at lumiliko pakanan (L, walang dot) papunta sa TR440. Ang reader (`tools/data/ls_xlsx.py`, "gaps up to 2 rows are the same wire") ay nagdudugtong dito, kaya iisang net ang PERMIT at E-STOP, at laging naka-RESET ang HMI switch pagkalipas ng 60 s. Ayos: hindi dinudugtong ang puwang kapag ang itaas ay natatapos sa horizontal wire at ang ibaba ay nagsisimula sa kanto. LS212 lang ang nagbago sa 23 sheet (sinuri ang lahat ng wire).
- **LS212 row 10 M.184C "SET / RESET HMI SWITCH".** Iisang bit ang input row 10, ang S ng FF, at ang output ng FF. Ang pindot sa CRT ang nagse-set ng bit, ang FF ang humahawak, ang R (E-STOP / MFT / 52G1 / coal feeders stop, 60 s) ang nag-a-alis. Dati: salamin lang ng output ang row (`mirModel`), kaya hindi ma-set. Ayos (`03-models.js` `mirModel`, `03b-sim.js`): kapag ang row ang S ng latch na ang output ay ang address nito, ang row = pindot O output (`hmi`). Sa lahat ng sheet, LS212 row 10 lang ang ganito (sinuri ang 150 mirror row).
- **"LINE 3" na walang SHEET = output ng parehong sheet.** LS212 row 15 M.182D ← out LINE 3 M.182D; LS60 row 4 M.1837 ← out LINE 13 M.1837 (parehong address). Ayos: `src/world/world.js`. Walang link na tinanggal.
- **Negation circle na 0.5 sa itaas ng wire.** LS210 AND ng M.1835: ang input mula TR419 (M.1836, 600 s) ay may bilog; LS100 AND ng M.1830: ang input mula row 11 FILLING CYCLE ENABLED ay may bilog. Hindi ito nabasa (tolerance 0.4) kaya walang NOT. Ayos: tolerance 0.9 (2.25 ang pagitan ng mga pin). LS210 at LS100 lang ang nagbago.
- Test: `tests/regress/limestone.js` 8 PASS, `ditl_ls.js` ALL PASS.
