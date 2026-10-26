# DITL Sand injection system (E10210-3-770 ~ 777) laban sa drawing — 3.2.0-beta.40

Roadmap step 7. Ito ang ikaapat na bahagi ng "SAND, LIMESTONE, BOTTOM ASH, SOOTBLOWER" (ang tatlo pa ay `docs/versions/v2.5.0/DITL_SB_AUDIT.md`, `DITL_BA_AUDIT.md`, `DITL_LS_AUDIT.md`).

## Pinagmulan

- Drawing: `sand-sootblower-logic.zip` → mga PDF na E10210-3-770 ~ 777, "SAND INJECTION SYSTEM CONTROL LOGIC (1) ~ (7)", Formosa Heavy Industries / HCE, station 103 (FM0007 P701 ~ P709). Vector PDF lang ito (walang DXF / DWG na mababasa rito).
- 770 = legend (symbol key). 771 ~ 777 = 7 logic sheet. Pangalan sa app: `(D71)DITL-771` ~ `(D77)DITL-777`. Kategorya sa sheet list: **SAND INJECTION (SD1300)**.
- Walang row table ang drawing na ito (hindi tulad ng sootblower / bottom ash). Kaya: bawat **dulo ng wire** ay row. Input row = FROM flag, push button, field switch; output row = lamp, solenoid, alarm, field output, TO flag. Ang hit area ng toggle ay nasa mismong simbolo sa drawing.

## Paano binasa (`tools/data/sand_*.py`)

1. `pdftocairo -svg` → `sand_pdf.py` / `sand_scene.py`: linya, makapal na linya (katawan ng AND), tuldok ng junction, arrow head. Ang junction dot ay dalawang bilog na outline (1.68 at 0.72 pt).
2. `sand_symbols.py` / `sand_model.py`: AND, OR (bilog sa bar), NOT (kahon na may X), ON / OFF delay (D), PO pulse, S / R flip-flop (reset-dominant), hexagon (numero = ibang sheet, letra = putol na linya sa parehong sheet), flag box.
3. Teksto: OCR (rapidocr) tapos `sand_text.json`: ayos ng typo, idinagdag na teksto ng lamp / ALARM / F(t) na hindi nabasa ng OCR, at maliit na listahan ng mga ayos na gawa-kamay (tingnan sa ibaba).
4. `sand_sheet.py` → `sand.json` → `node tools/data/ls_import.js sand.json` → `src/data/pre.txt`. Ang netlist ng sheet ay `src/digital/parts/02b-sand.js` (`sdNL`): pareho ng ibang DITL sheet ang gamit ng `simulate`, `simSheet`, render at ng one world (address sa cell).
5. F(t) (first order lag ng analog) = dumadaan lang ang signal. **Hindi sinisimulate ang halaga ng AI0387 / AI0432** (level ng silo at pressure ng vessel): ON / OFF lang ang input row (LT, PT).

## Gawa-kamay na ayos (para sa audit)

| Sheet | Ayos | Dahilan |
|---|---|---|
| 776 | OPEN / CLOSE contact ng CS (ISO. VALVE): ang -M.0870 ay NOT ng M.0870 | Ang dalawang contact ay isang memory, ang pangalawa ay baligtad (nakasulat sa drawing). `notsw` sa `sand_text.json`. |
| 776 | Hindi sinama ang gilid ng kahon ng CS bilang wire | Ang gilid ay outline ng simbolo, hindi wire. `drop`. |
| 776 | NOT sa (370,167) ay baligtad ang daloy (pataas, galing TR329 M.0876) | Walang arrow head; ang input ay ang gilid na may driver. `flipnot`. |
| 771 ~ 777 | Ilang address / caption ay inilipat sa tamang dulo (O.0608, O.0610, O.0605 ...) | Nasa pagitan ng dalawang output ang teksto. `move`. |
| 772, 776 | Hex 777 / 771 na unang nabasa nang mali ay itinama pagkatapos tingnan ang PNG | `sand_hex.json`. |

## Hindi tugma sa mismong drawing (hindi ko inayos; ito ay nasa PDF)

- 772 "VESSEL PRES. LOW" TO 771, 777: ang 777 ay walang tumatanggap na FROM flag.
- 777 "EMERGENT STOP" TO 771, 772, 774, 776: ang 771 ay walang tumatanggap na FROM flag.

Parehong output flag, walang epekto sa logic; sa app ay may row pa rin sila (output lang).

## Nasubok

`node tests/regress/ditl_sand.js` (8 check): 7 sheet sa kategorya at may output; walang block input na walang wire; oras ng mga timer ayon sa drawing (TR307 3 s, TR311 12 s, TR312 30 s, TR315 600 s, TR328 300 s, TR329 180 s, TR386 10 s, TR385 1 s pulse); 60 FROM / TO flag, bawat FROM ay may TO sa sheet na pinangalanan; 771 START → SYSTEM ON, nananatili, STOP ang nagpapatay, MFT BOILER STOP ang nagpapatay at nag-iilaw ng flag; 773 fluidizing air valve #1 tapos #2 (bawat 3 s); 775 limit switch → lamp; walang page error.

## Hindi pa nasubok

- Hindi pa nilalakad ng user (tablet / EXE / APK).
- Ang bawat gate ng bawat sheet ay ibinangga sa PDF sa pamamagitan ng overlay at screenshot (771 ~ 777), hindi ng line-by-line na test ng bawat output.
- Ang signal na galing sa ABC / HMI (hal. M.0881, M.0851) ay sumusunod sa address sa cell. Tingnan ang `tests/regress/world.js` para sa link ng ABC at DITL.
