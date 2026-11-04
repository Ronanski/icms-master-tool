# UNLINK / link audit (3.2.1)

## DITL-771 RESET of DONE and LINE BLOCKAGE (SEULGI, 2026-11-04 11:05 PM PHT)
- Drawing: E10210-3-771 "Sand injection system control logic (1)", `document-references/sand-sootblower-logic.zip` `Sand Logic/PDF/771.pdf` (binasa bilang larawan).
- DONE flip-flop (M.081C, sa kanan ng TR313 / M.0820): ang Q ay pumupunta sa TR314 (ON DELAY 3 s), at ang output ng TR314 ay bumabalik sa R ng parehong flip-flop. Pulse na 3 s ang DONE.
- LINE BLOCKAGE flip-flop (B.1202 / M.0813): S = TR315 (600 s); R = ang wire ng I.0575 VESSEL PRES. LOW (parehong wire na pumapasok sa NOT bago ang TR315).
- App bago: walang R ang dalawang FF (PDF reader `tools/data/sand_sheet.py`), kaya ang DONE ay nananatiling 1 at hindi umuulit ang cycle.
- Ayos: `src/digital/parts/02b-sand.js` `sdResetFix`. Ikinakabit ang R ayon sa istruktura (TR314 / TR315 tag), hindi sa numero ng net. Walang link na tinanggal.
- Test: `tests/regress/sand.js` 6 PASS (umuulit ang cycle, walang LINE BLOCKAGE).
