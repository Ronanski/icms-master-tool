# v2.4.0 — Mga Beta (bagong shell / UI)

Base: Stable v2.2.0 (`main` 9b0ae85). Bawat Beta ay push sa `claude/project-thread-u7at96` (PROJECT_RULES 5e). Hiwalay na linya ito sa 2.3.0 (drawing audit, PR #32) para hindi magbanggaan ang numero.

Utos ng user (2026-10-19): "magulo, walang direksyon, kalat" ang app. Full audit: `/mnt/project-files/app-status/FULL_AUDIT_2026-10-19.md`; disenyo: `NEW_SHELL_DESIGN.md` (parehong folder). Pinili ng user: bagong shell mula sa simula ("Scratch"). Pinayagan ng user na lumabag sa lumang UI rules basta hindi magalaw ang engine, simulation at plant model.

## 2.4.0 Stable (GO STABLE ng user, 2026-10-19)
- Ang 2.4.0-beta.1 ~ beta.5 bilang Stable. `src/version.txt` = 2.4.0, `dist/logic-sim-v2.4.0.html`, check SAME.
- **HINDI kasama:** ang 2.3.0 drawing audit (PR #32, ibang branch). Ilalagay ito sa susunod na Stable pagkatapos i-rebase sa bagong `main`.
- Release report: `Release-Report-v2.4.0.pdf`.
- **Buong regression (headless, build v2.4.0, 2026-10-19):** plant_view, tests (T1 ~ T5, S1 ~ S6), faceplate (68 controller), manstation, overview, infocard, abcbar, lookonly, events, ditl_toolbar, inapp_update, stale_beta, plant_live, world, ditl150, pid_am, loaddown, reset (51 sheet, 0 differ), switches (438 switch, 0 mali), hmi_op, unit_load, engine isolated, scenarios: PASADO. CHECK: 18 / 19 (ang kilalang M4 Cold start-up buo 16 / 17, RH 9.1). values_layout at refcheck: kapareho ng v2.2.0 (walang bago).

## 2.4.0-beta.5 — PLANT VIEW: faceplate sa graphic, sariling window sa PC
- **Problem (user, 2026-10-19):** "sa PLANT VIEW WINDOW/WORKSPACE, nacocontrol mo ang valve dito … tulad ng tunay na DCS HMI control station"; "kapag PC, dapat another window bubukas"; sa Android ay tab lang; "plant view ang name".
- **As Found:** Ang click sa controller ng plant graphic ay info card lang (walang A / M / R, SV, MV). May dalawang plant screen: ang OPERATE tab at ang lumang "Plant window" (iba at lumang graphic).
- **Work Done (UI lang; walang binago sa engine, simulation, plant model):**
  - Tab OPERATE → **PLANT VIEW**.
  - Click sa controller, MAN station o valve sa graphic = faceplate sa ibabaw ng graphic (parehong faceplate ng Operator pane: A / M / R, SV, MV, trend, interlock, force manual). Pareho ang sinusulat sa engine. "Logic" = bubuksan ang sheet ng loop sa LOGIC tab. (`src/ui/hmi/hmi.js` `AN.fpBuild`, `src/ui/plant/plant.js`.)
  - PC (mouse, ≥ 1000 px, hindi Android app): ang PLANT VIEW ay bumubukas sa sariling window na may Run / Pause, Start ▾, estado at oras; parehong engine ng main window. "Dock" o pagsara ng window = babalik sa tab. Android / phone / tablet: tab pa rin. (`src/ui/shell/app.js` `pvWindow`; exe: `delivery/desktop/main.js` window ng PLANT VIEW na may icon.)
  - Inalis ang lumang "Plant window" button (TOOLS).
- **As Left (headless):** `tests/regress/plant_view.js` ALL PASS: click sa TICBR1140 sa graphic → faceplate; M → MANUAL ng tunay na A/M station; MV 50 → engine MV 50.0; A → AUTO; PC window bumubukas, faceplate at M gumagana roon, Run tumatakbo, Dock → balik sa tab.
- **Hindi pa nasubok:** totoong exe window at Android app (sa device).

## 2.4.0-beta.4 — Plant model ON / OFF switch
- **Problem (user, 2026-10-19):** "paano i-enable/disable ang PLANT MODEL?"
- **As Found:** Laging ON ang plant model mula v1.20.39 (`AN.plantOn`, naka-save sa `ls-plantmodel2`); ang button ng engine (`bPm`, main.js) ay hindi kailanman inilagay sa screen.
- **Work Done (UI lang):** TOOLS > Simulation: button "Plant model: ON / OFF" na tumatawag sa switch ng engine (`AN.plantSwitch`). Kapag OFF, may dilaw na "PLANT MODEL OFF" sa status bar. Inalis ang lumang inline margin ng mga inilipat na button (pantay na ang pagitan ng Audit / Health).
- **As Left (headless):** ON → OFF → ON: `AN.plantOn` true / false / true, dilaw na flag lumalabas lang kapag OFF, 0 page error.
- **Hindi pa nasubok:** totoong device.

## 2.4.0-beta.3 — Icon ng app at bagong pangalan: DCS Logic Simulator
- **Problem (user, 2026-10-19):** "wala pa rin icon ang app. pangit pa rin ang name pag nirerelease/download ko."
- **As Found:** Ang apk ay ginagawa ng `npx cap add android` kaya default na Capacitor icon ang lumalabas; ang exe ay default na Electron icon; ang html ay walang favicon. Ang mga file sa Release: `Logic-Sim-v2.2.0.apk`, `Logic-Sim-v2.2.0-portable.exe`, `logic-sim-v2.2.0.html`, `Release-Report-v2.2.0.pdf`.
- **Desisyon ng user (card, 2026-10-19):** pangalan = **DCS Logic Simulator**.
- **Work Done:**
  - Bagong icon (`delivery/icons/icon.svg`): boiler drum na may tubig, risers at apoy, sa madilim na plate. Ginawa ang PNG (16 ~ 512), `icon.ico` (Windows), Android launcher icons ng bawat density + adaptive icon (`delivery/icons/android/res`).
  - `release.yml`: kinokopya ang Android icons pagkatapos ng `cap sync`; ang exe ay may `build/icon.ico` at window icon. Pangalan ng app: DCS Logic Simulator (apk at exe). Mga file sa Release: `DCS-Logic-Simulator-<ver>.apk`, `DCS-Logic-Simulator-<ver>-Windows.exe`, `DCS-Logic-Simulator-<ver>.html`, `DCS-Logic-Simulator-<ver>-Report.pdf`.
  - HTML: favicon at apple-touch icon; ang tab / window ay "DCS Logic Simulator v…". Ang `<title>` sa html file ay nananatiling "Logic Sim v…" para mahanap pa rin ng naka-install na lumang bersyon ang update; ang updater ay tumatanggap ng dalawang pangalan.
  - PWA manifest at icon, offline page, release report: bagong pangalan. Exe: ang settings ay nananatili sa lumang folder ("Logic Sim") para walang mawala. Hindi binago ang app ID ng apk: update, hindi bagong install.
- **As Left (headless, build 2.4.0-beta.3):** favicon at title "DCS Logic Simulator v2.4.0-beta.3" OK; `release.yml` valid YAML; `inapp_update` at `stale_beta` ALL PASS (pagkatapos ituro ang test sa bagong title).
- **Hindi pa nasubok:** ang apk at exe mismo (ginagawa lang sa GO STABLE release); ang icon sa totoong phone at Windows.

## 2.4.0-beta.2 — UI / UX pass: industrial, flat, walang overlap
- **Problem (user, 2026-10-19):** "dapat engineering, industrial ang look ... alignment, proper sizes, spaces, minimalist, flat ... avoid overlapping ... gamitin mo mismo ang app."
- **As Found (ginamit ang app headless: LOGIC ABC / DITL, Run, Panel, search, OPERATE Start 150 MW, Events, CHECK, UAT, LIBRARY, TOOLS, ⚙; 1440 / 1024 / 390 px; 42 screenshot):**
  - Desktop 1440: ang malaking search box ay tumakip sa View / Fit / Values / Wire / Panel (12 overlap; "Vie" lang ang kita).
  - Tablet 1024: 13 overlap sa ABC, 4 sa DITL, 2 sa OPERATE. Phone: 7 overlap sa OPERATE (Start / CHECK nasa ilalim ng search).
  - Iba-iba ang taas ng button (22 / 24 / 28 / 30 / 31 px).
  - Ang status bar: naputol ang hint na walang "…"; sa OPERATE ay dalawang hint ang sabay; ang pangalan ng sheet ay doble (header at status bar).
  - Ang mensahe ("Simulation mode: …") ay lumulutang sa gitna ng drawing nang 7 s.
  - UAT at CHECK panel: lumalabas sa kaliwa, tinatakpan ang sheet list; ang Timers ng DITL ay bukas at nakapatong sa drawing.
  - OPERATE: may bakanteng "No values for this screen" na column (300 px); "graphic + values" sa ilalim ng bawat system; sa phone ang system list ay kalahati ng screen.
  - ⚙: iba-iba ang lapad ng mga pagpipilian. Ang "⟳ Update?" ay naiiwan sa top bar kapag mabagal ang load.
  - TOOLS: "LN tables", "2nd sheet" (hindi malinaw).
- **Work Done (UI lang: `src/ui/shell/app.css`, `app.js`; walang binago sa engine, simulation, plant model):**
  - Isang taas ng control: 28 px desktop, 32 px tablet, 34 px phone; 2 px na kanto (flat).
  - Search: maliit sa desktop at lumalapad lang habang ginagamit (hindi gumagalaw ang tools); sa ≤ 1280 px ay 🔍 icon na bumubukas bilang hilera sa ilalim ng bar.
  - Tablet: 2 hilera (tabs / tools ng tab); phone: 2 hilera (tabs / ABC-DITL + tools + 🔍 + ⚙), may fade sa kanan kapag may naka-scroll.
  - Desktop: kapag bukas ang sheet list, nakatago ang ◀ sheet ▶ sa bar (doble).
  - Status bar: isang hint lang bawat tab, may "…" kapag mahaba; wala nang dobleng pangalan ng sheet. Ang mensahe ng app ay nasa status bar na (message line, 7 s, click = tago).
  - UAT / CHECK: nakadaong sa kanan, sa pagitan ng bar at status bar. DITL Timers: nakatiklop sa simula (▲ para buksan).
  - OPERATE: walang values = buong lapad sa graphic (awtomatikong Fit); plain na pangalan ng system; phone: "☰ Systems" drawer.
  - ⚙: pare-pareho ang lapad. TOOLS: "F(X) tables", "Second sheet".
- **As Left (headless, build 2.4.0-beta.2):** overlap sa top bar at status bar: desktop 0, tablet 0, phone 0 (maliban sa mga button na naka-scroll sa likod ng fade, sinadya); 0 page error sa 3 laki.
- **Hindi pa nasubok:** totoong phone / tablet, apk / exe.

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
  - Engine regression na pareho ng v2.2.0: `tests.js` T1 ~ T5 + S1 ~ S6 PASS (54 sheet, 165 timer, 105 ALM, 22 PID dMVH), faceplate 68 controller, overview, infocard, abcbar, lookonly, events, manstation, plant_live ALL PASS; `ditl_toolbar.js` ALL PASS (3 laki ng screen). world, ditl150, stale_beta, inapp_update ALL PASS. CHECK panel (plant scenarios): 18 / 19 PASADO; ang tanging mali ay ang kilalang M4 Cold start-up (buo) 16 / 17 (RH pressure 9.1, limit 9.0), pareho ng v2.2.0, hindi galing sa shell.
- **Hindi pa nasubok:** totoong tablet / phone, apk / exe.
- **Susunod na Beta (ayon sa disenyo):** DITL sa loob ng LOGIC na may parehong panel; alisin ang lumang Plant window; paikliin pa ang ⚙; linisin ang repo (package.json version, HANDOFF, lumang branch).
