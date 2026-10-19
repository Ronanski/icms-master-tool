# v2.4.0 — Mga Beta (bagong shell / UI)

Base: Stable v2.2.0 (`main` 9b0ae85). Bawat Beta ay push sa `claude/project-thread-u7at96` (PROJECT_RULES 5e). Hiwalay na linya ito sa 2.3.0 (drawing audit, PR #32) para hindi magbanggaan ang numero.

Utos ng user (2026-10-19): "magulo, walang direksyon, kalat" ang app. Full audit: `/mnt/project-files/app-status/FULL_AUDIT_2026-10-19.md`; disenyo: `NEW_SHELL_DESIGN.md` (parehong folder). Pinili ng user: bagong shell mula sa simula ("Scratch"). Pinayagan ng user na lumabag sa lumang UI rules basta hindi magalaw ang engine, simulation at plant model.

## 2.4.0-beta.1 — Bagong shell: isang top bar, 4 na tab, status bar
- **Problem:** Sa ABC screen ay may ~234 button, 4 na search box, ⚙ na may 17 item, toolbar na hindi sumusunod sa tab, lumulutang na UAT / CHECK panel, lumang Plant window na kapareho ng PLANT tab.
- **As Found:** Ang lumang shell (`src/ui/shell/shell.js`, `shell.css`, `console.css`) ay nagsusulat lang sa ibabaw ng mga toolbar ng engine (`#anbar` ng ABC, `#bar` ng DITL) at ng global bar (`#gsbar`). Ang engine ay walang alam sa UI na ito; ang mga button nito ay nahahanap sa text o sa id.
- **Work Done (UI lang; walang binago sa `src/analog/`, `src/digital/`, `src/plant/`, `src/world/`):**
  - Bago: `src/ui/shell/app.js` + `app.css` (pinalitan ang shell.js / shell.css / console.css). Ang mga button ng engine ay INILILIPAT lang (hindi ginagaya) sa bagong lugar, kaya pareho pa rin ang handler.
  - Top bar: 4 na tab **OPERATE** (plant graphics + Run), **LOGIC** (ABC / DITL sub-tab, Run / View / Sheet groups), **LIBRARY**, **TOOLS** (cards: block tests, check the drawing, simulation, project files, DITL drawing edit). Isang search box, isang ⚙ (font, UI, diagram colours, live, theme, DITL live, update).
  - Status bar sa ibaba: mode chip (EDIT / VIEW / RUN), oras, hint, Events, UAT at CHECK button (hindi na lumulutang).
  - Phone (≤ 700 px): tabs sa itaas, isang hilera na toolbar na nagi-scroll, panel bilang bottom sheet. Tablet (≤ 1180 px): drawer ang sheet list.
  - Test: `tests/regress/ditl_toolbar.js` isinulat muli para sa bagong shell (desktop / tablet / phone).
- **As Left (headless, build 2.4.0-beta.1):**
  - Screenshot ng bawat tab at ng phone layout: malinis, isang hilera ang top bar sa 1280 / 1440 px (40 px), 87 px sa phone.
  - Engine regression na pareho ng v2.2.0: `tests.js` T1 ~ T5 + S1 ~ S6 PASS (54 sheet, 165 timer, 105 ALM, 22 PID dMVH), faceplate 68 controller, overview, infocard, abcbar, lookonly, events, manstation, plant_live ALL PASS; `ditl_toolbar.js` ALL PASS (3 laki ng screen). Tingnan ang HANDOFF para sa natitira (world, check_panel, ditl150, stale_beta, inapp_update).
- **Hindi pa nasubok:** totoong tablet / phone, apk / exe.
- **Susunod na Beta (ayon sa disenyo):** DITL sa loob ng LOGIC na may parehong panel; alisin ang lumang Plant window; paikliin pa ang ⚙; linisin ang repo (package.json version, HANDOFF, lumang branch).
