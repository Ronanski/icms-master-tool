# Cross-system links ng plant model (chain reaction)

IRENE : PLANT MODEL, 2026-11-04 PHT. Tanong ng user: "In sync naman sya? May chain reaction? Kung mag adjust ka dito, mag aadjust din
doon ang effect?" Iisa ang plant model (`src/analog/engine/unit.js` `anUnitStep`). Bawat step ay sunud-sunod: seawater → make-up →
turbine oil → air → closed cooling → lube oil cooler → condenser at CEP → BFWP → motors. Ang bawat system ay bumabasa ng value ng iba sa parehong step. Ang listahang ito ay
ina-update sa bawat bagong system.

## Gumagana na
1. **SWBP (seawater) → CCWHE → closed cooling temperatura.** Flow ng SWBP (`swQbT`) → effectiveness-NTU ng CCWHE → TT-CW1152 / 1153. Test: `mu_ccw_model.js` (trip ng lahat ng SWBP, 51.7 °C pagkatapos ng 10 min).
2. **Load (MW) → heat sa closed cooling.** Heat load = 3480 kW × (0.4 + 0.6 × MW / 150). Nasa code. Walang automated test, nasa loop check C3.
3. **Expansion tank level (make-up) → suction ng ACWP.** Ang level ng T-1109 (`etLvl`) ay static head ng ACW loop. Nasa code. Walang test.
4. **Make-up header → fill ng expansion tank.** Kailangan ng PT-MU0709 > 6 at XV-MU1109 / V-MU1033 bukas. Nasa code.
5. **Instrument air → MFT.** IA pressure → DITL-03G (2 sa 3 < 3.5) at PSL-IA1706 (2.8). Test: `air_model.js`.
6. **Seawater flow → condenser pressure → turbine trip** (`CONDENSATE_PLANT_MODEL.md`, test `condensate.js`). Ang seawater flow at temperatura ng 030 model at ang steam → condenser pressure (PT-CD1110, DITL-55 / 73). Sarado ang isang water box: tumataas; walang seawater: LOW VACUUM trip. Kapag walang CW pump o CEP, nawawala rin ang vacuum (ejectors, dati na).
8. **Manual valves → flow / pressure → logic** (`FIELD_VALVES.md`, test `field_valves.js`). CCWHE valves → ACW flow at paglamig; ACWP discharge 5 % → PT-CW1152 < 3.5 → ACWP-B auto start; MWP discharge → PT-MU0709 → fill ng expansion tank (kailangan > 6); V-IA1101 → PSL-IA1706 → MFT; V-PA0013 → plant air ang bumubuhay sa instrument air.
9. **Closed cooling → turbine lube oil → bearings** (`TURBINE_OIL_PLANT_MODEL.md`, test `lube_oil.js`). ACW supply temperatura at flow → lube oil cooler → TE-LO1002 (PV ng TICLO1002, ABC-053) → TCV-CW1201; sa 100 % umiinit ang langis at ang bearings (tcs.js). Chain test: trip ng lahat ng SWBP → oil 72.6 °C, bearing No.3 81.5 °C pagkatapos ng 25 min.
10. **CEP → logic → standby CEP.** Trip ng CEP A → PT-CD1117 < 14.0 (DITL-61B) → AUTO start ng CEP B. Test: `condensate.js`.
11. **Make-up pumps → hotwell.** Walang MWP na nagbibigay → walang make-up sa hotwell (LCV-MU1110). Test: `condensate.js`.
12. **Extraction (load) → deaerator pressure → BFWP suction → PT-FW1011 → logic** (`FEEDWATER_PLANT_MODEL.md`, test `feedwater.js`). Trip ng BFWP-A → PT-FW1011 LL (DITL-23B M.3210) → AUTO START ng BFWP-B (kailangan: suction manual valve V-FW1002 bukas = ZSO-FW1032, lube oil > 2.0, suction > 1.5) → bumabalik ang feedwater. Walang BFWP o sarado ang suction valve → 0 ang feedwater (ABC-010).
7. **Lahat ng model → logic → model.** Pressure, level at flow → DITL / ABC rows. Ang START COMMAND ng logic ay nagpapatakbo ng equipment (ACWP, MWP, SWBP, air compressor). Test: bawat model test.
13. **Diesel oil → burners → firing; plant air → atomizing air** (`DIESEL_OIL_PLANT_MODEL.md`, test `diesel_oil.js`, SEULGI). DITL-31 pump → header PT-DO0005 → ring → 4 burner (DITL-16 shut-off valves) → oil sa firing (`oilF`); tank level / strainer / header → DITL-31 trip at standby start. Plant air (`paPU`) → PSL-PA1043-x1 → DITL-07. Chain test: trip ng pump A → header 4.66 → B auto start.
14. **FA blower → FA flow → standby blower; fans → current** (`FANS_PLANT_MODEL.md`, test `fans.js`, SEULGI). Trip ng FA blower A → FA flow < 20 T/H (ABC-006 M.3114) → DITL-28A #B start ng B. Current ng FA blower → DITL-28B row 12 (< 24.6 A L.L.). Field trip ng PAF / SAF → walang PA / SA flow (U.mul .drw).

## Wala pa (plano, kasama sa susunod na system)
1. **Closed cooling temperature → temperatura ng bearing / winding ng motor.** Fixed pa ang AN_MT. (Ang turbine oil ay tapos na, item 9.)
2. **Instrument air → pneumatic valves.** Sa ilalim ng 3.5, dapat hindi gumagalaw ang air-operated valve (XV-MU1109 at iba pa). Ngayon, mensahe lang sa faceplate ito. Gagawin pagkatapos ng Turbine Oil.
3. **HP heaters → feedwater temperature → economizer.** Kasama sa susunod na bahagi ng Feedwater.
4. **Chain test hanggang alarm / trip:** may chain test na hanggang bearing (`lube_oil.js`). Kulang pa ang alarm at trip ng TCS sa bearing temperatura, at ang mga motor (item 1).
