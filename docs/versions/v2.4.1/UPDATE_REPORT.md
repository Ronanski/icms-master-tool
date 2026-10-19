# v2.4.1 — Mga Beta (UI ayos ng PLANT VIEW)

Base: Stable v2.4.0 (`main` 65cfb47). Bawat Beta ay push sa `claude/project-thread-yezgyg` (PROJECT_RULES 5e). Version 2.4.1 (PATCH, ayos lang) para hindi magbanggaan sa 2.5.0 ng drawing audit (PR #32, ibang thread at branch).

Batayan: UI / UX audit ng v2.4.0, 2026-10-19 (`/mnt/project-files/ui-audit-2026-10-19/UI_UX_AUDIT_v2.4.0.md`; WCAG 2.2, 44 px touch, ISA-101, totoong DCS `03.png`). Pinili ng user (card): **PLANT VIEW (1-4)**.

## 2.4.1-beta.1 — PLANT VIEW: nababasang graphic, buong lapad, Start menu
- **Problem (audit):** (1) maliit ang text ng plant graphic (PC 7.5 px median, phone ~3 px; totoong DCS ~12 px sa parehong lapad); (2) blangkong banda sa itaas, sa phone 2/3 ng screen ay itim; (3) text ng UNIT lumalampas sa kahon at sa screen; (4) phone: CHECK putol ("CHE").
- **As Found (bagong nakita habang inaayos):** ang **Start ▾ menu ay hindi lumalabas** sa PLANT VIEW (PC at phone): ang menu ay nasa loob ng tool bar na naka-scroll pakanan (overflow), kaya naputol ito. Sa phone ay lumalampas din sa kanang gilid.
- **Work Done (itsura lang; walang binago sa engine, simulation, plant model):**
  - Graphic sa buong lapad ng screen sa lahat ng laki; ang listahan ng system (☰ Systems) at ang snapshot values (Values) ay pull-out sa ibabaw ng graphic; click sa graphic = isasara (`app.css`, `app.js` plantUx, `plant.js` Values).
  - Graphic nagsisimula sa itaas (dati nakagitna); sa portrait (phone) sinasakop ang taas at nagsisimula sa kaliwa, i-drag para sa kanang bahagi (`plant.js` fit).
  - Text ng graphic +1 px pa (+3 px sa drawing, dati +2): PC median 7.5 → 12.6 px, phone 3.3 → 11.4 px, tablet 6.9 → 9.1 px. Ang header bar at ang controller box ay pareho ang laki (`plant.js` txt `o.k`).
  - UNIT: ang mahabang paliwanag ay nahahati sa linya sa loob ng kahon (`wrap`); "cold reheat <- HP bypass" inilipat sa loob ng kolum. Label ng kahon na mas malapad sa kahon ay lumiliit (006 BURNER-A/B OIL FLOW).
  - 20 label na nagdikit dahil sa mas malaking text ay inusog nang kaunti (03, 04, 07, 08, 09, 39, 02, 05, 18, 19, 29, 38, 06; `systems.js`). Hindi ginalaw ang posisyon ng valve, pump at linya.
  - Phone (≤ 700 px): CHECK nasa dulo ng Start ▾ menu; sa tablet / PC nasa bar pa rin.
  - Lahat ng drop-down (Start ▾, ⚙): habang bukas, ang menu ay nasa ibabaw ng page sa ilalim ng button at nasa loob ng screen.
- **As Left (headless Chromium, build 2.4.1-beta.1, lahat ng 28 plant screen sa PC 1440, tablet 1024, phone 390):**
  - Text < 9 px: PC 4110 → 13 sa 4561; phone 4561 → 199. Blangkong banda sa itaas: 100 px → 0. Text na lampas sa drawing: 1 → 0. Nagdidikit na text: 10 / 9 / 10 → 6 / 8 / 5 (natira: mode letter ng magkatabing damper sa 04 / 08 at BAG sa 16, dati na).
  - Start ▾ menu lumalabas at napipindot (PC, tablet, phone); CHECK mula sa menu sa phone ay nagbubukas ng CHECK panel; ⚙ menu OK.
  - Regression: plant_view, plant_live, ditl_toolbar, lookonly, faceplate (68 controller), tests (T1 ~ T5, S1 ~ S6), check_panel share / tt / mft ALL PASS; `npm run check` SAME.
- **Hindi pa nasubok:** totoong tablet / phone / exe; ang PC window ng PLANT VIEW (sa headless, tab ang lumalabas); tablet landscape ay 9.1 px pa rin (ang graphic ay 1920 ang lapad; pinch zoom).

## 2.4.1-beta.2 — UI audit #5 ~ #8: kulay ng estado, laki ng pindutan, maliit na text, Zoom sa LOGIC
Pinili ng user (card): **UI ayos #5-8**. Itsura lang; walang binago sa engine, simulation at plant model. Ang kulay ng A / M sa faceplate ay hindi ginalaw (sumusunod sa DCS ng planta, v1.20.64).
- **Problem (audit):** (5) ang Pause button ay berde habang tumatakbo (kapareho ng Run); (6) pindutan sa touch 32 ~ 34 px (pamantayan 44 px), sa PC 16 na kontrol < 24 px; (7) text sa panel at listahan ng sheet 10.4 ~ 10.5 px; (8) sa Fit ang text ng drawing ay 4 px, walang mabilis na zoom.
- **As Found (bagong nakita):** pagkatapos pindutin ang Pause, ang label sa drawing ay "SIMULATION - RUNNING" pa rin habang ang footer ay "PAUSED" (dati na sa v2.4.0; ang label ay ina-update lang kapag nagre-redraw).
- **Work Done:**
  - Run / Pause: habang tumatakbo, ang button (❚❚ Pause) ay madilim na may dilaw na guhit, hindi na berde. Berde = "pindutin para tumakbo" lang. Pareho sa DITL Simulate (`app.css`).
  - Label sa drawing: nagiging "SIMULATION - PAUSED" agad pag Pause (`category-search.js`, kasama ng update ng footer chip).
  - PC: lahat ng kontrol ≥ 24 px (◀ ng sheet list, ✕, 0 · OFF, Skip, value box, slider, checkbox 18 px).
  - Touch screen (tablet / phone, `pointer:coarse`): lahat ng pindutan at field ay 44 px ang taas (A / M ng faceplate, ▲ ▼, tool bar, listahan ng sheet, LIBRARY, TOOLS). Ang PC ay hindi nagbago ang laki.
  - Maliit na text → 12 px: pangalawang linya ng sheet list, paliwanag sa panel, heading ng grupo, paliwanag ng input, LIVE · linked, DRAFT. (Ang maliit na linya sa header ng drawing ay hindi ginalaw: kapag lumaki, bumababa ang drawing ng 12 px.)
  - LOGIC: bagong **Zoom** button sa tabi ng Fit: text ng drawing ~12 px, nakasentro sa napiling block (o sa gitna kung walang napili). Fit = buong sheet ulit (`app.js`; ang selection group ay may class `selg` sa `links-canvas.js`).
- **As Left (headless Chromium, build 2.4.1-beta.2):**
  - Kontrol < 24 px sa PC: 16 → 0 (ang Auto-hide checkbox ay 18 px pero ang buong label ay pindutan). Kontrol < 44 px sa tablet 1024 (LOGIC, PLANT VIEW, faceplate, LIBRARY, TOOLS): 17 / 7 / 17 / 11 / 14 → 0 (natira lang ang Panel tab na 30 × 64).
  - Zoom: text ng drawing 4 px → 14 px (PC, tablet), 3 → 14 px (phone).
  - Pause: button kulay abo / dilaw; label at footer parehong PAUSED.
  - Regression: ditl_toolbar, lookonly, plant_view, faceplate (68 controller), manstation, check_panel share / tt / mft, tests (11 PASS) ALL PASS; values_layout kapareho ng beta.1 (2434 label); `npm run check` SAME. 0 page error.
- **Hindi pa nasubok:** totoong tablet / phone / exe; DITL drawing zoom (ang Zoom ay ABC lang; ang DITL ay may sariling Fit at pinch).
- Litrato: `/mnt/project-files/ui-audit-2026-10-19/beta2/`.

## 2.4.1-beta.3 — Auto-hide OFF: hindi na kusang nagsasara ang right panel
- **Problem (user, 2026-10-19):** dati, kapag naka-uncheck ang Auto-hide, hindi nagmi-minimize ang right panel; ngayon nagsasara pa rin.
- **As Found:** kapag sarado ang panel (✕, o maliit na window sa simula), ang click sa block ay nagbubukas nito nang pansamantala lang (`AN.tmp`), at ang click sa labas ay isinasara ulit, kahit Auto-hide OFF. Kapag inalis ang check sa Auto-hide habang sarado ang panel, nanatili itong sarado.
- **Work Done:** Auto-hide OFF: ang click sa block ay nagbubukas ng panel at nananatili itong bukas; ✕ o Panel button lang ang nagsasara. Pag-alis ng check: bubukas ang panel. Auto-hide ON: walang binago (`interaction.js` panelFor, `plant-window.js`).
- **As Left (headless):** Auto-hide OFF → ✕ → click sa block = bukas → click sa labas = bukas pa rin. Auto-hide ON → click sa block = bukas → click sa labas = sarado. Regression: ditl_toolbar, lookonly, plant_view, faceplate, panel_sync, overview, events, tests (11 PASS) pasado.
- **Hindi pa nasubok:** totoong exe / tablet.
