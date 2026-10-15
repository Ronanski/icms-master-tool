# v1.22.0 (target ng susunod na Stable) — mga Beta

Base: Stable v1.21.0 (`main`, release `v1.21.0`). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f).

## 1.22.0-beta.2 — IISANG MUNDO ng ABC at DITL (CHECKLIST #25, unang bahagi)

- **Problem:** Hindi tumatakbo ang DITL kasabay ng ABC. Ang "FROM DITL" na input ng ABC ay manual na switch lang, at hindi nakakarating sa DITL ang "TO DITL" na output ng ABC. Ang DITL sheet ay hindi rin nakakatanggap mula sa ibang DITL sheet. Kaya walang plant simulation ng buong boiler.
- **As Found:** Nakasulat sa mga drawing ang lahat ng kailangan:
  - ABC: "( FROM DITL 26A-55 )" = DITL-26A, item 55 (ang item 51~79 ay output row 1~29 sa kanan), at "TO DITL 26A-05" = input row 05.
  - DITL: ang FROM column ng input row (hal. "28A-77") at ang TO column ng output (hal. DITL-07 item 64 TO "ABC-003A/3B/3C/3D ABC-004A ABC-029").
  - Bug ng app: ang pagdikit ng FROM text sa wire (`dsIdx`, `src/analog/ui/trace.js`) ay inuuna ang kahit anong free input sa loob ng 20 units. Halimbawa, sa ABC-004A, ang apat na "( FROM DITL 07-64 )" ay napunta sa SIG.AB flags na B.0723 / B.072A / B.0725 / B.072C (8~9 units) imbes na sa M.3410 / M.3411 / M.3416 / M.3417 (5 units). Sa ABC-003B, napunta sa M.025B (18) imbes na sa M.3434 (5).
- **Work Done:**
  - Bagong `src/world/world.js`: button na "🌐 ABC + DITL: ON/OFF" sa TAKBO ng dalawang toolbar. Default OFF. Kapag ON at tumatakbo (ABC Run o DITL Simulate), bawat 0.2 s:
    1. Kinukuwenta ang lahat ng 134 DITL sheet, pati timers, MOV at motor (dati, ang nakabukas na sheet lang).
    2. Ipinapasa ang DITL → DITL (FROM column, pati ang feedback sa sariling sheet, hal. 26A row 1 PAF TRIP = 26A-66).
    3. Ipinapasa ang DITL → ABC (FROM DITL). Ang ABC input ay nagiging "galing sa DITL", at FORCE ang paraan para baguhin ito.
    4. Ipinapasa ang ABC → DITL (TO DITL).
  - Isang scan ang delay, gaya ng DCS.
  - Ang net na kinukuwenta ng ABC logic ay hindi ginagalaw. Ebidensya: sa PDF ng ABC-004A, ang M.3410 = AND ng "A-BNR SUPPLY OIL VALVE(1) CLOSE" at "VALVE(2) CLOSE" (pareho sa B/C/D: M.3411 / M.3416 / M.3417), kaya ang ABC-003A / 003B / 003C / 003D / 029 ay tumatanggap mula sa ABC-004A, gaya ng dati.
  - DITL engine: hinati ang kuwenta ng isang sheet sa `simSheet()` (`src/digital/parts/04-render.js`), kaya iisa ang kuwenta ng drawing at ng mundo. Ang `simIn` ay tumatanggap ng input mula sa mundo. Ang input row na galing sa iba ay naka-dashed sa drawing.
  - ABC: ang mga sheet na may TO DITL ay sabay na tumatakbo (`AN.worldSheets` sa `actSet`).
  - `dsIdx`: ang FROM text na dumidikit sa wire (≤ 8) ay para sa wire na iyon.
  - Bagong test: `tests/regress/world.js`.
- **As Left (headless Chromium):**
  - `world.js`: 13 / 13 PASS.
    - Default OFF. Kapag OFF, walang ABC input na galing sa DITL.
    - Kapag ON: 110 FROM DITL input, 86 TO DITL, 874 DITL → DITL, 0 reference na walang katapat. Binuo sa ~1 s, isang beses lang.
    - Lahat ng 110 ABC input = output ng DITL. Ang 83 DITL row na galing sa ABC = value ng ABC net.
    - Kadena: DITL-28C "FAB A TO SILENCE SOV OPEN P.B." → output row 23 1→0 → ABC-014 I.0043 1→0.
    - Isang scan ng buong mundo: 1.6 ~ 5 ms.
    - Kapag OFF ulit, bumabalik ang dating gawi.
  - DITL, mundo OFF: 134 / 134 sheet ay pareho ang kulay ng bawat cell sa v1.21.0 (Simulate, 4 input na ON bawat sheet).
  - DITL-26A, mundo ON: "PAF STOPPED" ay ON dahil sa "PAF LUB. OIL PUMP ALL STOPPED" (24-76), "SAF STOPPED" (27A-57) at "PAF STOPPED" (03B-72), gaya ng cold start ng planta.
  - `npm run check` SAME; `npm test` 11 PASS; `ditl_toolbar.js` ALL PASS; `panel_sync.js` 0 FAIL; `faceplate.js` PASS. UAT dry run: 2458 items, 6808 cases, 0 bagsak.
  - Para sa audit ng sheet (kailangan ng PDF ng sheet):
    - 21 FROM DITL text na nasa net na kinukuwenta ng ABC logic, nakalista sa `world.js` INFO (hal. ABC-008 M.3304 25A-55, ABC-020 / 055 I.000F 03A-63, ABC-009A / B M.331D 21D-59).
    - 9 na input kung saan ang ABC link ang nananaig.
    - Ang ABC-017 I.024E "DITL 80S-57" ay itinuro sa DITL-80 item 57 "HRH DRN POT DP-HR01 DRN VLV OPEN COMMAND" (walang DITL-80S sa repo; DITL-80 = HOT REHEAT STEAM SYSTEM HRH DRN POT).
  - HINDI na-check: tunay na tablet / phone. Ang user values ng DITL (timer na binago mo) ay ginagamit lang pagkatapos mabuksan ang sheet na iyon.
- **Status:** Pass (headless). Default OFF habang sinusubukan mo.

## 1.22.0-beta.1 — Malinis na DITL toolbar, Health ng DITL, DITL rule binawi

- **Problem:** Sa DITL page, tatlong hilera ng toolbar: lumalabas din ang ABC toolbar (Run / Back / Next / Reset ng ABC, hindi para sa DITL) at dalawang "Digital · DITL / Analog · ABC" na button. Ang mga tool sa pag-edit ng drawing (Import DXF, Delete sheet, Clear cells, Wire fix) ay nakalabas sa operator. Sa phone: 5 hilera ng button at ang title ay 306 px, kaya ~25 % lang ng screen ang diagram. Ang **Health** ng DITL ay hindi bumubukas (error na `reading 'src'`, pati sa v1.21.0).
- **As Found:** (1) `src/ui/shell/shell.css` ay may `#anbar{display:flex}` na walang `body.an`, kaya natatalo ang patakaran ng ABC na itago ito sa DITL. (2) Ang DITL `#bar` ay hindi dumaan sa shell (hindi naka-grupo). (3) `diag()` sa `src/digital/parts/07-app-events.js` ay bumabasa ng netlist ng lahat ng sheet, pero ang netlist ay ginagawa lang kapag binuksan ang sheet.
- **Work Done:**
  - ABC toolbar: nakikita lang sa ABC page (`body:not(.an) #anbar{display:none}`).
  - DITL toolbar (`src/ui/shell/shell.js` `buildDitl`): parehong ayos ng ABC: `[ABC/DITL] [TAKBO: ▶ Simulate] [TINGIN: Fit, Live] [SHEET (tablet/phone)] … [⋯ Tools]`. Nasa "⋯ Tools": Import DXF, Open / Save project, Undo, Redo, Clear selected cells, Delete sheet, Wire fix, Health. Parehong mga button (walang bagong handler).
  - Mode button ng DITL: "▶ Simulate" (kapag Edit) / "✎ Edit" (kapag Simulate), may paliwanag sa tooltip. Dati: "Mode: Edit" na hindi malinaw kung estado o utos.
  - Phone (≤ 700 px) DITL: isang hilera `☰ ▶ Simulate Fit` + sheet; ang ☰ ang naglalabas ng search, ABC/DITL, Live at Tools. Title: 2 linya lang, nakatago ang L / C / R / size (pang-edit).
  - Health ng DITL: ginagawa na ang netlist ng sheet kung wala pa (parehong kondisyon ng `render`).
  - DITL rule ng user ay binawi: PROJECT_RULES 4, CLAUDE.md, README.
  - Tests: bago `tests/regress/ditl_toolbar.js`; `tests/regress/panel_sync.js` ay may syntax error sa main (kulang na `'`), naayos; ang inaasahan sa LOCAL + MAN ay ginawang "MV puwede, SV naka-disable" (rule ng user v1.20.66: SV para sa AUTO lang; parehong 1 FAIL sa v1.21.0 bago ang ayos).
- **As Left (nasukat sa headless Chromium):**
  - Taas ng DITL toolbar: desktop 151 → 61 px, tablet 200 → 61 px, phone 292 → 105 px. Title sa phone 306 → 61 px.
  - `ditl_toolbar.js`: 33 / 33 PASS (desktop, tablet, phone). Health: "134 sheets · 102 OK · 32 issues · 0 failed".
  - `npm run check` SAME; `npm test` 11 PASS / 0 FAIL; `panel_sync.js` 12 / 12 PASS; `faceplate.js` PASS (68 controller, 0 maling switch).
  - Ang ABC page ay pareho ang taas ng toolbar bago at pagkatapos (desktop 107 px, phone 99 px).
  - HINDI na-check: tunay na tablet / phone / apk / exe; UAT dry run (walang binago sa engine ng ABC).
- **Status:** Pass (headless). Kailangan ng tingin mo sa tablet / phone.
