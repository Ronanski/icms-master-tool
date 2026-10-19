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
