# DITL Limestone injection (ROTOFEED, LS-10 ~ LS-240) laban sa drawing — 2.5.0-beta.15

User (2026-10-20): "pre may mga DITL pages na wala pa. SAND LIMESTONE BOTTOM ASH SOOTBLOWER". Ito ang ikatlong bahagi: LIMESTONE (ang SOOTBLOWER ay nasa `DITL_SB_AUDIT.md`, ang BOTTOM ASH ay nasa `DITL_BA_AUDIT.md`).

## Pinagmulan

- Drawing: `bottomash-limestone-logic.zip` → `Limestone Logic/limestone_logic.xls`. Excel ito, hindi DXF: ang wire at ang kahon ng block ay **border ng cell**; ang bilog ng NOT, ang tuldok ng junction, ang ≥1 at ilang wire ay drawing object; ang text ay laman ng cell.
- 23 logic sheet (tab 10, 20, ..., 110, 160 ~ 240; walang 120 ~ 150 sa file). Ang tab na Contents ang pinagkunan ng pamagat; ang tab na 250 ay Symbol Key (legend), hindi page.
- Station 104 (FM0008 P802, nakasulat sa ibaba ng bawat sheet).
- Basa: `soffice --headless --convert-to xlsx` → `python3 tools/data/ls_xlsx.py <xlsx folder> ls.json` → `node tools/data/ls_import.js ls.json`. Ang PDF na pinaghambingan ay ang print ng parehong xls (`soffice --convert-to pdf`).
- Pangalan ng sheet: `(L<n>)DITL-LS<n>` (hal. `(L210)DITL-LS210`). Kategorya sa sheet list: **LIMESTONE INJECTION (ROTOFEED)**.

## Paano binasa (para sa limestone sheet lang, `sh.ls`)

- Row: LINE NO. 1 ~ 21 sa kaliwa at kanan. Kaliwa: TAG NUMBER / FROM (itaas), DESCRIPTION (ibaba), DCS ADDRESSING, TYPE / SIG. STATUS. Kanan: TO, DESCRIPTION, ADDRESS, TYPE.
- Block (Symbol Key, tab 250): `&` = AND, `≥1` = OR, kahon na may `t1 / t2` = time delay (t1 = on delay, t2 = off delay), `PO` = pulse (oras sa itaas, hal. 1S, 3 SEC), `X ≥ Y` / `X ≤ Y` = compare (X = itaas na input, Y = ibaba), `R` / `S` = SET / RESET, bilog = NOT, tuldok = junction (walang tuldok = tawiran lang).
- INT. REGISTER (LS-60, LS-230): ang Y ng compare ay analog input na ang simula ay ang halaga sa drawing (hal. 2.5 at 0.5 kg/cm2), at ang PV ay nagsisimula sa gitna (1.5) para OFF ang dalawang limit.
- Page link: FROM "SHEET 214 - LINE21" → output row 21 ng LS-214; TO "SHEET 40 - LINE 3" → input row 3 ng LS-40.
- Ang 218 dating DITL sheet (DITL, sootblower, bottom ash): pareho ang logic bago at pagkatapos (paghahambing ng buong netlist dump ng bawat sheet, HEAD laban sa bago: IDENTICAL). ABC hindi ginalaw.

## Paghahambing sa PDF

Bawat sheet ay ibinangga sa PDF (screenshot ng app sa tabi ng PDF: block, timer at oras, NOT, seal-in, tuldok / tawiran, row ng input at output). Lahat ng 23 ay tugma. Ang mga nakita habang binabasa, at naayos sa reader bago ang paghahambing:

| Sheet | Nakita | Hatol |
|---|---|---|
| LS-10 | Ang putol-putol na patayong wire ay drawing object na bahagyang lihis sa grid (193.501 laban sa 193.51): hindi nakakabit sa mga input ng NOT / AND | (a) bug, naayos: ini-snap sa grid at pinagdugtong ang mga piraso ng iisang patayong wire |
| LS-50 | Ang text ng ≥1 ay "1 1 1 1" (umaapaw sa print): hindi nakilala ang OR, kaya walang input ang AND ng STEP 3 | (a) bug, naayos: OR; isang "1" ang ipinapakita |
| LS-210 | TR419 600 s (CONVEY AIR VALVE CLOSE ON DELAY): ang kaliwang gilid ng label cell ay ang wire ng input | (a) bug, naayos: ang gilid na tuloy-tuloy na wire ay hindi tinatanggal |
| LS-210 | Line 3 SV-PA1812A: ang output wire ay nasa guhit sa pagitan ng line 2 at 3 | (b) tama: line 3 ang may output text; doon ito ikinabit |
| LS-214 | TR421 nakasulat na "ON DELAY    TR421" na malayo sa kahon | (a) bug, naayos: TR421 (dati walang tag) |
| LS-230 | Ang compare symbol ay nasa Symbol font ("X / Y", "X £ Y") | (b) tama: X ≥ Y (CONV. PRESS. HIGH LIMIT, 2.5 kg/cm2) at X ≤ Y (LOW LIMIT, 0.5 kg/cm2) |
| LS-230 | Line 4 kaliwa: "STN104 Range : 0.0 ~ 6.0 kg/cm2" walang wire | (b) tama: range ng PILM1812.PV (line 5), paliwanag lang |
| LS-212 | M.184C (SET / RESET HMI SWITCH, ISOLATING A-H OPEN SW BIT) ay output ng SET / RESET at input din sa line 9 ng parehong sheet | (b) tama: iisang address, nakakabit (mirror) |
| LS-110 | TR427 "ROTOFEED OFF DELAY TIMER" ay may 5s sa t1 at 0 sa t2 | (b) tama ayon sa Symbol Key: t1 = on delay. Ang pangalan ay "off delay" pero ang drawing ay on delay 5 s; sinunod ang drawing |
| LS-110, LS-240 | Mali ang LINE NO. sa kanan (LS-110: "... 20, 18"; LS-240: "1, 1, 1") | (b) tama ang row: ang posisyon sa sheet ang numero (21; 1, 2, 3); ang text ay iniwan gaya ng drawing |
| LS-240 | Ang apat na ALARM LAG TIMER 3 s ay walang TR number | (b) tama: walang nakasulat sa drawing |
| LS-10, LS-210 | TR400 / TR401 na label sa wire ng HMI push button | (b) tama: label lang; ang ilalim na border ang wire |
| LS-212 / 213 | Ang title block ay "CONVEY AIR VALVE" (kinopya) | (b) tama: ang pamagat ay mula sa Contents (ISOLATING VALVE, ISOLATING VALVE INDICATION) |

## Test

`node tests/regress/ditl_ls.js`: 23 sheet sa kategorya at may output; walang block input na walang wire; lahat ng timer at oras; LS-90 STEP 7 (seal-in, TR405 3 s, TERMINATE); LS-230 limit (1.5 → wala, 3 → HIGH, 0.5 → LOW); LS-214 TR432 pulse 1 s; page link FROM / TO.
