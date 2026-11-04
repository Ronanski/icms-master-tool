# Cross-system links ng plant model (chain reaction)

IRENE : PLANT MODEL, 2026-11-04 PHT. Tanong ng user: "In sync naman sya? May chain reaction? Kung mag adjust ka dito, mag aadjust din
doon ang effect?" Iisa ang plant model (`src/analog/engine/unit.js` `anUnitStep`). Bawat step ay sunud-sunod: seawater → make-up →
turbine oil → air → closed cooling → motors. Ang bawat system ay bumabasa ng value ng iba sa parehong step. Ang listahang ito ay
ina-update sa bawat bagong system.

## Gumagana na
1. **SWBP (seawater) → CCWHE → closed cooling temperatura.** Flow ng SWBP (`swQbT`) → effectiveness-NTU ng CCWHE → TT-CW1152 / 1153. Test: `mu_ccw_model.js` (trip ng lahat ng SWBP, 51.7 °C pagkatapos ng 10 min).
2. **Load (MW) → heat sa closed cooling.** Heat load = 3480 kW × (0.4 + 0.6 × MW / 150). Nasa code. Walang automated test, nasa loop check C3.
3. **Expansion tank level (make-up) → suction ng ACWP.** Ang level ng T-1109 (`etLvl`) ay static head ng ACW loop. Nasa code. Walang test.
4. **Make-up header → fill ng expansion tank.** Kailangan ng PT-MU0709 > 6 at XV-MU1109 / V-MU1033 bukas. Nasa code.
5. **Instrument air → MFT.** IA pressure → DITL-03G (2 sa 3 < 3.5) at PSL-IA1706 (2.8). Test: `air_model.js`.
6. **CW pump → condenser vacuum → turbine trip.** Kapag walang CW pump o condensate pump, bumababa ang vacuum at nagti-trip ang turbine sa LOW VACUUM (TCS). Nasa code. Running bit pa lang ang basa, hindi pa ang CW flow ng bagong model.
8. **Manual valves → flow / pressure → logic** (`FIELD_VALVES.md`, test `field_valves.js`). CCWHE valves → ACW flow at paglamig; ACWP discharge 5 % → PT-CW1152 < 3.5 → ACWP-B auto start; MWP discharge → PT-MU0709 → fill ng expansion tank (kailangan > 6); V-IA1101 → PSL-IA1706 → MFT; V-PA0013 → plant air ang bumubuhay sa instrument air.
7. **Lahat ng model → logic → model.** Pressure, level at flow → DITL / ABC rows. Ang START COMMAND ng logic ay nagpapatakbo ng equipment (ACWP, MWP, SWBP, air compressor). Test: bawat model test.

## Wala pa (plano, kasama sa susunod na system)
1. **Closed cooling temperature → turbine oil cooler at temperatura ng bearing / winding ng motor.** Fixed pa ang AN_MT. Kasama sa Turbine Oil (susunod).
2. **Instrument air → pneumatic valves.** Sa ilalim ng 3.5, dapat hindi gumagalaw ang air-operated valve (XV-MU1109 at iba pa). Ngayon, mensahe lang sa faceplate ito. Gagawin pagkatapos ng Turbine Oil.
3. **CW flow / seawater temperature → condenser vacuum.** Kasama sa Condensate (condenser).
4. **Chain test:** isang test na sumusunod sa buong kadena. Halimbawa: trip ng SWBP → umiinit ang CCW → umiinit ang turbine oil at bearing → alarm / trip ng logic. Gagawin kapag nakakabit na ang 1.
