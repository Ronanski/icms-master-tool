# DITL Bottom ash (BA-01 ~ BA-74) laban sa PDF — 2.5.0-beta.14

User (2026-10-20): "pre may mga DITL pages na wala pa. SAND LIMESTONE BOTTOM ASH SOOTBLOWER". Ito ang ikalawang bahagi: BOTTOM ASH (ang SOOTBLOWER ay nasa `DITL_SB_AUDIT.md`).

## Pinagmulan

- DXF: `bottomash-limestone-logic.zip` → `Bottom Ash Logic/HD600` (BA-01 ~ 58) at `Bottom Ash Logic/CONVEYORS` (BA-59 ~ 74); PDF ng parehong sheet sa `PDF/`.
- Inilagay sa app gamit ang `node tools/data/ditl_import.js B <dxf...>`. Pangalan ng sheet: `(B<n>)DITL-BA<nn>` (hal. `(B11)DITL-BA11`). Kategorya sa sheet list: **BOTTOM ASH HD600 / CONVEYORS**.
- Station 103 (FM0006 / FM0004, nakasulat sa ibaba ng bawat sheet).
- 67 sheet ang naging page. Ang BA-30, 31, 32, 35, 57, 58 at 70 ay blangko sa PDF (walang row, walang logic): hindi ginawang page. Ang COVER, ELEMENT at LIST ay hindi logic.

## Paano binasa (bagong basa ng DITL reader, para sa BA form lang)

Ang BA form ay iba sa DITL form: LOCATION | TAG.NO | FROM | NO. | SERVICE ... SERVICE | NO. | LOCATION | TO, at ang row ay ang dulo ng flag (hindi may numero). Lahat ng bagong basa ay para lang sa sheet na BA (`sh.ba`); ang 151 dating DITL sheet ay pareho ang logic bago at pagkatapos (paghahambing ng buong logic dump ng lahat ng sheet).

- Row = dulo ng flag sa gilid ng SERVICE column (kaliwa = input, kanan = output). Isang input flag at isang output flag na hanggang 4.5 ang layo = iisang row.
- FROM "BA01" + NO. "11" = `BA01-11` (output NO. 11 ng BA-01). TO "BA-56/46/11" = ang mga sheet na bumabasa ng output na ito.
- Wire na iginuhit bilang LEADER (may arrow) at tawiran na may hop (kalahating bilog = hindi magkakabit).
- AND na may iisang manipis na bar (bus).
- Pulse glyph (TR410 ~ TR413 ng BA-02), pulse box (TR353 ng BA-20), COUNTER box (+1, =4, R ng BA-20).
- FLASHER: ang glyph sa row na "FLASHER(ON/OFF)" na may ON / OFF na oras sa sheet (BA-52 ON 1 s / OFF 0.5 s, BA-69 ON 300 ms / OFF 6 s) ay flasher. Kapag galing sa ibang sheet (BA-46 FROM BA52) ang glyph ay paliwanag lang.
- Step register SI0130: ang output "STEP=8" na may "IF M.1333 ON THEN 8 --> SI0130" ay nagsusulat ng 8; ang input "STEP≧8" ay 1 habang SI0130 ≥ 8. Iisa ang SI0130 sa lahat ng BA sheet; ang Run / Reset ay nagbabalik sa 0.
- Lamp ng HMI (BA-55, 56, 72, 73, 74: "0:BLUE 1:RED", "1:RED&YELLOW FLASH"): ang wire na papunta sa lamp symbol ay may tuldok sa dulo na umiilaw kapag 1.

## Paghahambing sa PDF

Bawat sheet ay ibinangga sa PDF (bawat output, mula sa output pabalik sa input: gate, timer at oras, NOT, seal-in, hop / tuldok). 58 sheet ang tugma sa unang basa. Ang 9 na may mali ay naayos:

| Sheet | Nakita | Hatol |
|---|---|---|
| BA-02 | START / STOP / RESET / EMG.STOP (DCS) M.1300 ~ 1303: may pulse TR410 ~ TR413 sa PDF, wala sa app | (a) bug, naayos: PULSE (walang nakasulat na oras sa drawing; 2 s ang ginamit, gaya ng ibang pulse na walang oras) |
| BA-11 | M.1331 CONVEYING PRECONDITION OK: may ekstrang guhit papunta sa AND na walang input flag (sa PDF din) | (b) tama: hindi input; dati 0 ito kaya laging OFF ang M.1331 |
| BA-20 | Walang output ang M.1305 AUTOMATIC STOP; ang M.1307 LAST CYCLE OVER ay walang COUNTER (=4) at pulse TR353 | (a) bug, naayos: M.1305 = OR(AND(M.1306, M.1307), AND(OR(I.0577, AND(NOT I.0570, M.1304)), M.1304, M.136E)); M.1307 = COUNTER(PULSE(AND(M.1306, I.0498, M.136E))) = 4, RESET = M.1305 |
| BA-21 | M.1332 MANUAL CONVEYING START: hinati sa 2 row (FROM sa isa, tag sa isa) | (a) bug, naayos (row merge) |
| BA-46 | Ang output CONVEYING INDICATOR ay nasa ibang row kaysa sa wire nito | (a) bug, naayos (row merge) |
| BA-48 | M.134C CONVEYING OVER TIME (B.Z STOP): hinati sa 2 row; ang NOT ay nasa row na walang tag | (a) bug, naayos (row merge) |
| BA-67 | M.092C SPEED FAULT: hinati sa 2 row; ang interlock ng ON COMMAND ay hindi nakakabit sa M.092C | (a) bug, naayos (row merge; ngayon ay MIRROR ng output M.092C) |
| BA-56 | Lamp EMERGENCY STOP (OR) at READY FOR START M.1373 (AND): walang ipinapakita | (a) bug, naayos (lamp sa dulo ng wire) |
| BA-72 / 73 / 74 | FROM "BA66" / "BA67" / "BA68" / "BA69" walang NO. "02" | (c) ang "02" ay nasa PDF pero wala sa DXF bilang text: inilagay mula sa PDF (`01-parse-build.js`, talaan sa `build`); ito ang output NO. 02 POWER FAULT ng sheet na iyon, na ang TO ay ang sheet na ito |

## Mga tala

1. **BA-20 LAST CYCLE OVER.** Ayon sa drawing, kapag umabot sa 4 ang COUNTER, ang M.1307 ay nagpapa-ON sa M.1305 AUTOMATIC STOP, at ang M.1305 ang RESET ng COUNTER. Kaya isang scan lang ON ang M.1307 at M.1305, tapos 0 ulit ang bilang. Sa app, ang RESET ng COUNTER na ito ay sa susunod na scan (para makita ng ibang logic ang M.1305); sa sootblower COUNTER ay hindi ito binago.
2. **BA-11 STEP≧8.** Ang simbolo ay "≧" (UniversalMath font sa DXF, sinuri sa PDF na pinalaki): ang M.1367 STEP_8 ay 1 habang ang step ay 8 o higit pa.
3. **Ang FROM ng HD600 field sheet (BA-01, BA-02)** ay ang address (I.048F, M.1300), hindi BAxx: ang TAG.NO ay ang field device (LS-BH1750).

## Test

`node tests/regress/ditl_ba.js`: 67 sheet sa kategorya (lahat may output o lamp); BA-11 M.1331 (14 input); step SI0130 (M.1333 → 8 → STEP_8 ON, Reset → 0); flasher ng BA-52; COUNTER ng BA-20 (1, 2, 3, 4 → LAST CYCLE OVER at AUTOMATIC STOP → 0); page link FROM BA01-11 at TO BA-56/46/11.
