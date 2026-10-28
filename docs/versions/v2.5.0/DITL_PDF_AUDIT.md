# DITL laban sa PDF (2.5.0-beta.11)

Utos ng user (2026-10-20): "PANO DITL? YUNG PDF REFERENCE MO LANG YAN NA BABASAHIN MO RIN, PAG NAINTINDIHAN MO ANG FLOW AS PDF. KAPAREHA DAPAT NG SA APP."

## Paano sinuri

- Ang 134 DITL sheet ng app ay isinulat bilang text: bawat row (FROM / TO) at ang logic ng bawat output hanggang sa input row (`tests/regress/ditl_export.js`).
- Ang bawat sheet ay ibinangga sa drawing PDF (300 dpi, may zoom), gate por gate.
- Resulta ng bawat sheet: `/mnt/project-files/ditl-audit-2026-10-20/findings/`. Ang PNG ng drawing: `.../png/`.
- 39 na sheet ang may mali. Ang iba ay tugma sa drawing.

## Mga mali na naayos (bawat isa ay binasa sa PDF)

| # | Ano ang mali sa app | Sheet | Ayos |
|---|---|---|---|
| 1 | Ang comparator na H/ o /L (kahon sa wire) ay hindi nabasa: ang analog row ay dumaan bilang bit | 23A, 23B, 25B, 26B, 27B, 28B, 29B, 31, 43, 55, 63, 83, 86, 87, 111, 112 | 95 na limit na ang binabasa (hal. 112 row 78 < 5.6 kg/cm2, 63 >= 85 °C, 55 S= 0.7 kg/cm2) |
| 2 | LOCAL STOP P.B. ng MCC (N.C. contact) ay nabasang 2 s pulse: hindi makatakbo ang pump sa LOCAL | 22, 24, 30, 31, 111, 112 | 1 habang hindi pinipindot, 0 habang pinipindot |
| 3 | Ang bilog sa S ng flip-flop (set wins) ay hindi sinusunod | 69, 70, 71 | set wins kung may bilog ang S |
| 4 | BOILER PURGE COMPLETED (TR254) ay level, hindi pulse: kusang nare-reset ang MFT | 03A | PULSE ng row 21 |
| 5 | Wire na tumatawid nang walang tuldok ay nadugtong | 61A, 76, 77, 112, 26A | tingnan ang `UNLINK_AUDIT.md` 2.5.0-beta.11 |
| 6 | Connector papunta sa ibang sheet ay hindi nakakabit | 25A ← 25B (1), 26A ← 26B (A) (B), 76 ↔ 77 (6) (7) | ang connector ay binabasa ang kabilang sheet |
| 7 | Connector (13) SPEED LOW ay walang pinagmulan: hindi gumagana ang trip sa mababang speed | 21A | AND(ON DELAY 15 s row 19, NOT OFF DELAY 5 s row 20) |
| 8 | Trip lamp na kapareho ng address ng isang input ay walang pinagmulan | 21A row 57 / 62, 24 row 64, 30 row 64 | sumusunod sa input na may parehong address |
| 9 | "DEFAULT 1" / `= "1"` (start permission) ay walang pinagmulan: hindi makapagsimula ang pump | 29A, 76, 77 | laging 1 |
| 10 | Row 9 "-M.0172" ay hiwalay na input | 35 | row 9 = NOT row 6 |
| 11 | SV-CR1011 ay pinapatakbo ng maling wire | 73 | NOT(OPEN COMMAND row 23) |
| 12 | TR23 pulse ay 2 s | 69 | 3 s (iisang TR23) |
| 13 | Overtime alarm ng motor valve (FB2-OT) ay walang laman | 38 | ayon sa DITL-50: pulse 2 s, FF, ON DELAY TON_ON / TON_CL (11 s, unang column ng TIMER SETTING), OR = OVERTIME FAIL |
| 14 | VCB ON / OFF ay nakadugtong sa lamp ng running FF | 76, 77 | field signal (test switch), gaya ng 61A |
| 15 | Field signal na BI10 (flame detector ready) ay walang test switch | 18 | may test switch na |
| 16 | Ang pangalan ng timer (TRxxx) ay nabasang text ng input row | 45 sheet | inalis sa row (nasa logic pa rin) |
| 17 | TO reference na nasa maling row | 03A, 21C, 21D, 29A, 29B, 73, 111 | inilipat sa tamang row (talaan sa `01-parse-build.js` ROWFIX) |

## Tama, may ebidensya (inulat ng audit pero tama ang app habang tumatakbo)

- DITL-22 row 64, DITL-76 / 77 row 67 (trip): sumusunod sa input na may parehong address (wala lang sa export).
- DITL-16, 17, 20 (limit switch ng valve), 19 row 57 (running), 21A connector (7) (reverse running): pinapatakbo ng valve / motor model ng app.
- DITL-43 (APH inverter panel), 39 (debris filter panel), 18 (flame scanner): field signal mula sa panel; sa app ay test switch o input row, gaya ng drawing (walang DCS logic sa loob ng panel).
- DITL-03E row 69: may wire sa drawing hanggang sa lamp box; walang epekto.

## Hindi mabasa

- Walang bahagi na hindi mabasa. Ang mga pulse na walang nakasulat na oras (hal. TR440 ~ 481, TR360) ay 2 s sa app.

## Test

- `tests/regress/ditl_pdf.js`: ang logic na binasa sa PDF para sa bawat ayos sa itaas, at sa SIMULATE ang overtime alarm ng DITL-38 at ang connector DITL-26B (A) → 26A.
