# DITL Sootblower (DITL-80 ~ 80T) laban sa PDF — 2.5.0-beta.12

User (2026-10-20): "pre may mga DITL pages na wala pa. SAND LIMESTONE BOTTOM ASH SOOTBLOWER". Ito ang unang bahagi: SOOTBLOWER.

## Pinagmulan

- DXF: `sand-sootblower-logic.zip` → `Sootblower Logic/` (23 DXF), PDF ng parehong sheet (`Sootblower Logic/PDF/`).
- Inilagay sa app gamit ang `node tools/data/ditl_import.js S <dxf...>`. Pangalan ng sheet: `(S<n>)DITL-80<letra>` (hal. `(S14)DITL-80K`). Kategorya sa sheet list: **SOOTBLOWER**.
- Station: S2 (STN102), memory M.4000 pataas. Ang sheet `DITL-80` ng boiler (`(99)DITL-80`) ay ibang sheet; ang page link mula sa sootblower sheet ay pumupunta muna sa sootblower set.

## Mga sheet

| Sheet | Laman | Hatol |
|---|---|---|
| 80 | Program sequence: COUNTER (N=0 ~ 4, 28 ~ 31), reset, step | (b) tugma sa PDF |
| 80A | Program start / stop, pulse TR326 / TR1000 / TR325, 10 MIN ON DELAY TR330 | (b) tugma |
| 80B ~ 80F | Step ng bawat grupo ng sootblower (AND ng step, permissive) | (b) tugma |
| 80G | N-1011 sootblower control (forward / backward starter O.0760 / O.0761 sa SB PANEL) | (b) tugma |
| 80H, 80I, 80J | "AS SHEET DITL80G BLOCK" lang (N-1016 ~ 1023): walang sariling logic | hindi ginawang page (kapareho ng 80G) |
| 80K | Air preheater sootblower (O.077C / O.077D / O.077E sa SB PANEL) | (b) tugma |
| 80L | Panel box lang (gaya ng 80K para sa ibang air preheater) | hindi ginawang page (walang logic na mababasa) |
| 80M | Sootblower status (row 1 ~ 148, output 301 ~ 448) | (b) tugma |
| 80N | ANY extend / retract / start (OR sa mga row na "• • •") | (b) tugma |
| 80O | Start abnormal, extend / retract over time | (b) tugma; tingnan ang tala 1 |
| 80P | Steam drain SOV XV-SB1059 / 1054, temperatura < 220 / > 250 °C | (b) tugma |
| 80Q | Trouble preset, warming up failure | (b) tugma |
| 80R | Steam drain SOV (SV model) | (b) tugma |
| 80S | Steam supply motor valve MV-SB1001 (MCC box) | (a) bug, naayos (tala 2) |
| 80T | Alarm message ng N-1011 (reset pulse TR697) | (a) bug, naayos (tala 3) |
| 80X0, 80X1 | Talaan ng sheet at simbolo | hindi page |

## Mga tala

1. **80O row 25 ~ 27 (N-1035 ~ 38).** Sa PDF ay putol-putol ang guhit ng bahaging ito (TR340, TR510, TR511, TR512 walang kahon). Sa DXF ay buo ang timer (5 s, 0.3 s, 53 s): ang app ay sumusunod sa DXF, kapareho ng dalawang grupo sa itaas nito (122 s, 62 s).
2. **80S motor valve.** Ang MCC box ay may "VALVE OPEN COMMAND" / "VALVE CLOSE COMMAND" lang, walang ZSO / MIL label. Dati: walang valve model, kaya ang output 53 REMOTE SELECTED, 55 FULL OPENED, 56 FULL CLOSED, 57 TORQUE, 58 TRIP ay walang pinagmulan (at ang 54 LOCAL SELECTED ay laging ON). Ngayon: binabasa ang feedback mula sa service text ng output row (`03-models.js` movModel0). Ang REMOTE / TORQUE / TRIP ay ang input row na may parehong text (row 1 I.024D, row 12 I.024E, row 7 I.024C); FULL OPENED / CLOSED ay sumusunod sa posisyon ng valve (at ang input row 6 FULL OPENED ay sumusunod din).
3. **80T row 1 (N-1011~38 S/B ALARM MESSAGE RESET P.B., M.4191).** Sa PDF may pulse TR697 sa simula ng wire. Dati: hindi nabasa (nakadikit ang simbolo sa gilid ng cell), kaya ang reset ay tuloy-tuloy habang pindot. Ngayon: R = PULSE(row 1) sa 3 FF.

## Bagong basa ng DITL reader (para sa sootblower form)

- COUNTER block (`02-netlist.js`, `t: 'CNT'`): ang input 1 → 0 = N + 1, RESET = N 0; Reset ng DITL bar = N 0.
- Output sa SB PANEL (`NL.pout`): "O.0760" / "0.0760" sa ibaba ng logic; nasa kanang panel ("Outputs to SB PANEL").
- Makitid na form (80G / 80K / 80T: FROM | NO. | SERVICE), kanang NO. na +300 (80M), row na "• • •" (80N / 80Q), 4-digit na TR tag, maliit na pulse glyph, nakatayong timer, wire na may "• • •".
- Ang pangunahing DITL sheet ay hindi nagbago: ang basa ng lahat ng 134 dating sheet ay pareho bago at pagkatapos (paghahambing ng buong logic dump).

## Test

`node tests/regress/ditl_sb.js`: 17 sheet sa kategorya; COUNTER ng 80 (2 hakbang, Reset); O.077D ng 80K sa row 10 TRIP; feedback ng valve ng 80S; page link 80K ↔ DITL-43 at 80K → 80A.
