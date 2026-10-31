# UNLINK_AUDIT 3.2.0-beta.77 (CODE FIXER, PR #88; ebidensya ng thread, tala ng DOCS)

Walang link na inalis para lang gumana. Ang bawat pagbabago ay naglalagay ng tamang basa ng drawing.

- **DITL-80G / 80K** (makitid na form FROM | NO. | SERVICE): ang FROM text ay x 19.4 ~ 22.0, kaliwa sa FROM column line 22.5, kaya wala sa cell; ang 80K ay walang input link. PDF (14)Ditl80K: row 1 80A-56, 2 80F-76, 3 80A-71, 4 80Q-65, 6 80M-373, 8 80F-78, 9 80A-60, 11 80M-445, 13 80A-51, 14 DITL-43-70, 15 DITL-43-71. Ayos: `fromFix` (`01-parse-build.js`), isang salita ≤ 4 unit sa kaliwa ng line. Nagbago lang: 80G (FROM cells 1 → 13), 80K (3 → 18).
- **DITL-09 rows 5 / 7 / 9 / 11:** address list "M.0110/210/1610/1710" (atbp.) x 115 > SERVICE end 113.3, kaya walang TAG. Memory list STN104: M.0110 A-IGNITER ON PB, M.0111 OFF, M.0118 A-OIL BNR ON PB, M.0119 OFF; M.0210 B-, M.1610 C-, M.1710 D-IGNITER ON PB. Ayos: `tagFix`. Iba pang naayos (lahat tunay na address ng row): DITL-01 r5 ~ 12 (M.012F flame A … M.1722), DITL-07 r4 / 5 / 15 / 16, DITL-08 r7 / 13, DITL-14 r22, DITL-32 r6 / 9 / 11, DITL-33 r6 / 9 / 11, DITL-35 r6 (M.0172), 80G, 80K (r20 M.4212), BA03, BA04. One-world links: 2359 bago = 2359 pagkatapos, magkapareho.
- **DITL-38 rows 5 / 9 / 11** (MCV OPEN / STOP / CLOSE P.B.): (c) hindi nakasulat sa drawing. PDF (62)DITL-38 TAG NO. blangko; memory list STN101 / 102 B.1400 ~ B.1465 OVERTIME lang, walang CRT P.B. ng 8 MOV.
- **DITL-76 / 77 rows 1 at 4** parehong M.1232 / M.1242 (AUTO MODE (CRT), STN103): ang "iisang address" na check ng dock ay tumitingin na rin sa TAG NO.
- **Machine A ng shared drawing:** ang tag ay ang huling address ng listahan (DITL-45 dryer A M.112A = dryer C). Ayos: `addrK` / `showText` para sa k 0.
- **SOP sec 27 "Circulation Function"** (#57): (c) walang address sa DITL-80 ~ 80T at STN102 M.4000 ~ M.4253.
