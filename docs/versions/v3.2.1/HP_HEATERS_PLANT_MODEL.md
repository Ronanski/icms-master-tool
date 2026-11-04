# Plant model: HP heaters at economizer inlet (3.2.1-beta.3)

IRENE : PLANT MODEL, 2026-11-04 5:03 PM PHT. Code: `src/analog/engine/unit.js` (`AN_HP`, `anHphStep`, TT-FW1160). Test: `tests/regress/hp_heaters.js`.

## Daloy
Deaerator → BFWP → No.1 HPH (extraction no. 2, MV-TS1002, DITL-95) → No.2 HPH (extraction no. 1, MV-TS1001, DITL-94) → economizer inlet (TT-FW1160, PT-FW1160).
Ang drain ng No.2 ay pumupunta sa No.1, at ang drain ng No.1 sa deaerator (cascade).

## Sources
- FHI heater O&M (PC, o&m-package-phase-1 L15-3 HPH-1 / L15-4 HPH-2, PDF p14 "Nominal thermal characteristics", feedwater 458.684 t/h):
  - No.2 HPH: extraction 37.48 kgf/cm2A (sat 245.37 °C), FW 195.7 → 245.4 °C, TTD -0.05, drain 45.147 t/h 201.3 °C.
  - No.1 HPH: extraction 14.12 kgf/cm2A (sat 194.63 °C), TTD -1.07, extraction 7.035 kg/s = 25.33 t/h. Ang FW temperatura sa sheet na ito ay hindi tugma (167 °C); ginamit ang inlet ng No.2 = 195.7 °C.
- Deaerator O&M (L15-2 p14): HPH condensate papunta sa deaerator 69.35 t/h 166.3 °C; FW out ng deaerator 158.4 °C.
- IO list STN102: TT-FW1105 AI0913, TT-FW1106 AI0914, FT-HD1105 AI0434, FT-HD1106 AI0435, TT-HD1105 AI0931, TT-HD1106 AI0932; STN101 TT-FW1160 AI0592 (ABC-010).
- DITL-94 / 95: extraction shut-off MOV MV-TS1001 / 1002 (sarado sa turbine trip at sa HP heater level HI-HI ayon sa drawing).
- Snapshot 03.png (150 MW): TIFW1105 198, TIFW1106 243, TIFW1160 244 °C.

## Model
- Shell pressure = extraction pressure × (turbine steam ÷ 458.684) × MOV (sarado na < 20 % = throttled).
- FW out = saturation ng shell + TTD, hindi bababa sa FW in. FW in ng No.1 = saturation ng deaerator (PT-CD1104).
- Extraction / drain flow = design flow × (feedwater ÷ 458.684) × (pag-init ÷ design na pag-init).
- Drain temp = FW in + DCA (No.2: 5.6, No.1: 7.9).
- Lag 120 s.
- TT-FW1160 (ABC-010) = outlet ng No.2.

## Resulta (cloud test, 150 MW, pagkatapos ng 5 min)
- No.1 outlet 196.9 °C (snapshot 198), No.2 outlet 247.1 °C (snapshot 243, design 245.4), TT-FW1160 247.1 (snapshot 244).
- Drain No.2 48.8 t/h (design 45.1), papunta sa deaerator 75.5 t/h (design 69.35).
- Chain: isinara ng operator ang MV-TS1001 (DITL-94 CLOSE P.B.) → walang steam ang No.2 → economizer inlet 197.2 °C, drain No.2 0.3 t/h.

## NO-SOURCE / CALIBRATED
- Extraction pressure na proportional sa turbine steam: NO-SOURCE (walang turbine heat balance sa repo o sa PC).
- Throttling ng MOV sa ilalim ng 20 %: NO-SOURCE.
- Lag 120 s: NO-SOURCE.

## Hindi pa ginawa
- Shell level ng HPH (ABC-035 / 036 loops: generic model pa) at ang level switch LS-HD1105 / 1106 HH (DITL-94 / 95 M.0203).
- PT-FW1160 (economizer inlet pressure): snapshot value pa.
- Epekto ng mas malamig na feedwater sa firing / steam ng boiler (boiler side).
- Hindi pa live-tested sa PC ng user.
