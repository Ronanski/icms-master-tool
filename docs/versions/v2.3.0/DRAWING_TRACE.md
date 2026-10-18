# 2.3.0 — Trace bago ang engine change (PROJECT_RULES 5c)

Batayan: `DRAWING_AUDIT.md` (parehong folder). Ang bawat ayos ay may sheet, block, net at ang nakasulat sa PDF. Ang user ang pumili ng "Ayusin lahat" (2026-10-18).

## beta.1 — Mga link (grupo A at LINK-1 ~ 4)

Saklaw: label / link / kulang na input lang. Walang binagong formula, range, timer o parameter. Ang bawat ayos ay nasa iisang talaan sa engine (`AUDIT_FIX`, compile step), may tsek na ang block at ang net ay ang inaasahan; kapag hindi tugma, hindi ginagalaw at may babala.

| ID | Sheet / block | Nakasulat sa drawing | Ayos |
|---|---|---|---|
| ABC-001C-1 | ABC-001C OR M.2013 (B67, x742 y221) | 8 input; ang ika-8 ay M.2000 = NOT FIC-CM.REM (wire mula sa tuldok x760 y150 papasok sa ilalim ng OR) | idagdag ang net M.2000 (#80) bilang input ng B67 |
| ABC-001D-1 | ABC-001D F(X) LN60 (B16) | input = "MWD CHANGE RATE (FROM ABC-001B) HIC-MWRL.PV" (RATE connector) | pangalanan ang n59 na HIC-MWRL.MV: kinukuha sa ABC-001B (MAN HIC-MWRL, #13) |
| ABC-013-1 | ABC-013 OR (B22, x704 y521) | "TURBINE TRIP M.3200 (FROM S2 L0400)", "52G1 OPEN M.3220 (FROM S2 L0932)", "52L1 OPEN FOR HOUSE OPERATION M.3221 (FROM S2 L0937)" | label M.3200 (#19), M.3220 (#9), M.3221 (#10); station wiring S2 → S1: I.0400 → M.3200, I.0932 → M.3220, I.0937 → M.3221 |
| ABC-011-1 | ABC-011 M.0230 (#15) | "1ST DE-S/H SPRAY WATER TEMP. CONTROL NOT IN REMOTE  TICBR1130.LOC" = ang wire na may sanga M.0230 | ang A / M / R ng TICBR1130 ay nagsusulat din sa #15 (mode alias, hindi binubura ang M.0230) |
| ABC-012-1 | ABC-012 M.0240 (#15) | "2ND DE-S/H ... NOT IN REMOTE  TICBR1150.LOC" | pareho, TICBR1150 |
| ABC-057-1 | ABC-057 TPS TR708 / TR709 | "FURNACE FRONT / REAR WALL AUTO MODE (CRT) S3 M.144A", "... MANUAL MODE (CRT) S3 M.144B" | label S3 M.144A (#79), S3 M.144B (#74) |
| ABC-009B-1 | ABC-009B OR M.0320 (B22) | 5 input: M.331D (FROM DITL 21D-59), AND(B.0646, B.066E), B.0641, M.331E, NOT M.0321 | ang wire ng M.331D (segment x376 ~ 448, y286) ay hiwalay na net (DITL input) at input ng OR; ang output ng AND ay walang pangalang M.331D |
| ABC-009A-1 | ABC-009A OR M.0290 (B115) | may input na M.331D (gaya ng M.0280 at M.0300) | idagdag ang M.331D (#32, kinukuha sa #31) bilang input ng B115 |
| ABC-009A-2 | ABC-009A AND M.0212 (B109) | input = SICL1060A / B / C / D.MAN | n202 ← SICL1060A.MAN (#85), n175 ← SICL1060B.MAN (#67), n174 ← SICL1060C.MAN (#49); D (#107) ay nakakabit na |
| ABC-009A-3 | ABC-009A n167 | "PIC-BASC.MAN  BOTTOM ASH SCREW COOLER CONTROL IN MANUAL" | label PIC-BASC.MAN |
| ABC-004A-2 | ABC-004A NOT → M.013C (B102) | "COAL FEEDER B & C ALL IN MANUAL (FROM ABC-004B / C)" | n176 = AND(FICCL1061B.MAN #105, FICCL1061C.MAN #104) |
| ABC-004A-3 | ABC-004A NOT (B111) | "COAL FEEDER C IN MANUAL" | n149 ← FICCL1061C.MAN (#104) |
| ABC-008-2 | ABC-008 TPS TR142 (B80) | "HYDRAULIC CONTROL SELECT (CRT) M.0200" | label M.0200 (#53) |
| ABC-020-1 | ABC-020 connector "I" | "I" = HICHR1002B.MV (output ng MAN HICHR1002B) | n37 ← #24 |
| ABC-054-1 | ABC-054 DEV PV (n21 "STN102017") | "HRP / 052  S2 SI0180" | n21 ← ABC-052 SI0180 (cross-sheet tag) |
| LINK-1 | ABC-017 I.024E "FROM DITL 80S-57 FOR S/B LOGIC" | ang 80S ay sootblower PLC logic (wala pa sa app), hindi DITL-80 | ang reference na nagtatapos sa "S" ay hindi na ibinabagsak sa DITL-80; manual / FORCE input |
| LINK-2 | DITL-21A row "21A" | numero ng row ay "21A" (row 21) | basahin ang "21A" bilang row 21 (output 71 COOLER A REMOTE) |
| LINK-3 | ABC-001C / ABC-008 "TO DITL 40-xx" | DITL-40: row 6 MSP H.H. = O.0177 (> 134), row 7 HIGH = M.3109 (> 130), row 8 LOW = M.310A (< 100), row 9 LL = M.310D (< 72.9), row 13 FURNACE PRESS HIGH = M.3107 (> 30) | ang text ay nasa ilalim ng sariling kahon: itinatali sa net sa itaas |
| LINK-4 | 27 DITL input "FROM ABC-xxx" | ang address / tag ng row (M.0506, M.3101, TICMS1022.MV ...) ay nasa ABC sheet na iyon | kinakabit ayon sa address sa ABC sheet ("TO S4 M.3101" sa tabi ng M.025B ng ABC-013); DITL-79 row 6 TICMS1022.MV ay analog (comparator > 2 % / < 1 % sa DITL); DITL-115 row 17 / 18 = MANUAL ng PICMS1006 / PICHR1003; "3A-63" (DITL-15 row 10) = 03A-63 |

Hindi kasama sa beta.1: DITL-21C row 19 / 20 (M.311A / B, walang pinagmulan sa ABC-009A ng app; nasa "hindi mabasa" ng audit).

Patunay na kailangan: sa app (headless), bawat ayos ay sinusubok: ang input ay umaabot sa block, ang mode button ay umaabot sa net, at ang DITL input ay sumusunod sa ABC (iisang mundo ON).
