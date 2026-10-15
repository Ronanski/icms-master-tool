# v1.22.0 (target ng susunod na Stable) — mga Beta

Base: Stable v1.21.0 (`main`, release `v1.21.0`). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f).

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
