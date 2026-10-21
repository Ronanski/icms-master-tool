# v3.0.0 — Mga Beta (bagong itsura: Style 2 + CAD)

Base: Stable v2.4.0 (`main`). Bawat Beta ay push sa `claude/design-system-extraction-4dogzg` (PROJECT_RULES 5e). UI / itsura lang: walang binago sa engine, simulation, plant model at logic.

## 3.0.0-beta.1 — BINAWI
- Ginawa at na-push nang hindi pa pumipili ang user. Ibinalik ang branch sa `main` at isinara ang PR #36 (utos ng user: "Oo ibalik mo"). Walang bahagi nito ang natira.

## 3.0.0-beta.5 — Tunay na overhaul ng ayos (layout ng Style 2 + CAD mockup)
- **Problem (user, 2026-10-21):** "Bkit di mo inoverhaul? Nagbago k lng itsura ng mga buttons at konting organize." Tama: hanggang beta.4, kulay, icons at button lang ang nabago; ang ayos ng screen ay galing pa sa v2.4.0.
- **As Found:**
  - May hiwalay na hilera para sa pangalan ng sheet. Kumakain ito ng taas ng drawing at inuulit ang mode.
  - Ang Run / View / Stop ay nasa ribbon at sa title strip.
  - Pare-pareho ang ribbon sa VIEW at RUN.
  - Ang mga input na pwedeng i-force ay nasa Inspector lang (kanan), halo sa iba.
- **Work Done (UI lang; walang binago sa engine, simulation at logic):**
  - **Top bar = isang hilera**: logo, tabs, ABC | DITL, **pangalan ng sheet** (ang mismong title strip ng ABC / DITL ay inilipat dito; ang DITL title ay pwede pa ring i-type), search, **VIEW | RUN** switch, ⚙. Wala na ang hiwalay na title row: mas mataas ang drawing.
  - **VIEW | RUN** ang iisang mode switch. ABC: VIEW = View / Trace, RUN = Run (PAUSED kapag naka-pause). DITL: RUN = Simulate, VIEW = Edit. Inalis sa ribbon ang View button at ang Run / Stop ng DITL.
  - **CAD ribbon sa VIEW:** malalaking icon na may label, pangalan ng grupo sa ilalim: VIEW (Fit, Zoom out, Zoom in), LAYERS (Values, Wire values, Inputs, Inspector, Legend), NAVIGATE (↩ Back, kapag may babalikan), REFERENCE (I/O list, F(X)).
  - **Ribbon sa RUN:** isang maliit na hilera: SIM (Pause / Run, Reset, bilis, step), VIEW, LAYERS.
  - **Kaliwa: Sheets | Inputs** (ABC). Ang Inputs ay lahat ng digital / analog input ng sheet: pangalan, paliwanag, at 0 / 1 (parehong button ng Inspector). Click sa pangalan = ipakita sa drawing. Naka-lock sa VIEW. Hal. ABC-010: Inputs 34.
  - Legend & style: nasa LAYERS. Ang "blocks · external inputs" ng sheet ay nasa status line.
  - DITL title alignment / size (L C R, Medium): nasa Tools > DITL drawing edit.
  - Ang Faceplate pane ay sa ABC page lang (dati ay lumalabas din sa DITL kapag RUN).
- **As Left (headless):** tingnan ang seksyon ng mga test sa ibaba.
- **Hindi pa nasubok:** sa tablet / phone / exe / apk ng user.

## 3.0.0-beta.4 — Bug: nasisira ang drawing sa Android na naka-dark mode
- **Problem (user, 2026-10-21, screenshot ng tablet):** madilim ang buong sheet, puti ang mga block ("sinalaula").
- **As Found:** Naka-dark mode ang Android ng user. Ang Chrome / WebView ay pilit na dinidilim ang page na light (auto dark). Dahil Light ang default mula 3.0.0-beta.2, dinilim ng system ang papel ng drawing pero hindi ang mga block, kaya puti ang mga block sa itim na background at nagiging blotch ang mga sulat. Na-reproduce sa Chromium na naka-force dark.
- **Work Done:** `color-scheme: only light` (Light) at `only dark` (Dark) sa `src/ui/shell/app.css`. Sinasabi nito sa system na huwag nang dimilim ang page; ang Dark ng ⚙ ang tanging dark.
- **As Left:** Chromium na naka-force dark: malinis na ang ABC-001B (Light at Dark). Pasado ang `npm run check`, ditl_toolbar at plant_view.
- **Hindi pa nasubok:** sa mismong tablet ng user.

## 3.0.0-beta.3 — Overhaul ng lahat ng panel, popup at button
- **Problem (user, 2026-10-21):** "sabi ko ayusin lahat e. pati buttons. overhaul nga ni" — kulang ang beta.2: ilang panel ay madilim pa at lumang itsura.
- **As Found (tinignan ang 24 screen, luma vs bago):**
  - Madilim pa at lumang kulay: Legend & style, Event log, Health, Audit (form), F(X) tables, Assumed values, block popups, Library (buong tab), listahan at header ng Plant view, faceplate overview cards at force list.
  - **Bug (mula 2.4.0-beta.1):** walang style ang info card ng search (Enter / ⓘ). Lumalabas ito sa ilalim ng page na parang sirang teksto. Nawala ang CSS nito noong ginawa ang bagong shell.
  - Walang madaling paraan para makita sa drawing kung alin ang pwedeng i-force.
  - Sa RUN, kailangan pang pindutin ang Faceplate.
- **Work Done (itsura lang; walang binago sa engine, simulation at logic):**
  - **Iisang sistema ng kulay:** mga 330 lumang nakasulat na kulay (hex) sa CSS ng 16 file ay pinalitan ng theme token. Light at Dark ay sumusunod na sa lahat ng panel, popup, dialog, table at button. Bagong token: run / man / alm "soft" at "text".
  - **Hindi binago (sinadya):** ang graphic ng Plant view at ang faceplate box (madilim na DCS faceplate, gaya ng HMI ng control room), ang kulay ng drawing (theme.css), at ang PDF report.
  - **Info card:** ibinalik at bagong itsura (card sa ilalim ng search).
  - **Legend:** sa Light paper, ang kulay ng legend ay kapareho na ng drawing.
  - **Icons (CAD):** View, Reset, Fit, Values, Wire values, Inputs, Inspector, at ang 4 tab. Sa tablet ay icon lang ang ribbon (may tooltip); sa phone ay icon lang ang tabs.
  - **Bagong layer na Inputs** (LAYERS): dilaw na bilog sa drawing sa bawat digital / analog input na pwedeng i-switch o i-force (ang mga input ng Inspector). Hal. ABC-010: 133 row sa Inspector, inputs lang ang may bilog.
  - **RUN:** ang pagpindot ng Run (ABC) ay kusang nagbubukas ng Faceplate (controllers, trend, input buttons). Isang click lang pabalik sa Inspector.
  - Pangalan: "◀ Panel" → "◀ Inspector".
- **As Left (headless, 2026-10-21):**
  - `npm run check` SAME; `npm test` PASS lahat.
  - PASS: ditl_toolbar 36, plant_view 18, check_panel 17/18, manstation 12, panel_sync 12, inapp_update 12, plant_live 12, world 11, infocard 9, overview 9, lookonly 8, events 5, abcbar 4, stale_beta 4, faceplate, force_manual, switches.
  - Hindi pasado pero pareho sa v2.4.0 (hindi galing sa itsura): check_panel M4 cold start-up 16/17 (kilalang isyu); pid_am FIC-CM (ABC-004A) 1 fail.
  - Bilis sa RUN, CPU 4× mabagal: v2.4.0 59.7 fps, beta.3 59.7 fps.
  - Screenshot: Light at Dark 1366, tablet 1024, phone 390. Inputs layer sa ABC-010 ay may bilog; Run → Faceplate. 0 page error.
- **Hindi pa nasubok:** tunay na tablet / phone / exe / apk.

## 3.0.0-beta.2 — Style 2 (Workbench) + kaunting CAD
- **Problem (user, 2026-10-21):** "mahirap gamitin, mahirap basahin"; ang overall visual ang problema, hindi ang laman. Pinili: **Style 2 + kaunting CAD**. Hindi dapat ma-kompromiso ang view ng diagram; sa RUN dapat kita ang logic, faceplate at trend; alisin ang redundant, palitan ang pangalan kung kailangan; smooth sa low-end device.
- **As Found:** madilim at siksik ang lahat ng bahagi; isang hilera lang ang toolbar na halo-halo ang mga button; dalawang beses ipinapakita ang mode (title strip at status); ang mga button ay "Panel", "Wire", "Operator", "Details", "▶ Simulate / Edit"; may font selector na walang silbi sa trabaho; walang Zoom button (gulong / pinch lang).
- **Work Done (itsura lang):**
  - **Light ang default**, **Dark** sa ⚙ (Theme). Kulay may kahulugan lang: berde = RUN / ON, dilaw = forced / manual, pula = alarm.
  - **Top bar:** logo, tab na *Plant view / Logic / Library / Tools*, ABC | DITL, search, ⚙.
  - **CAD ribbon** (pangalawang hilera, may pangalan ang bawat grupo): **SIM** (Run / View / Reset / speed / ◀◀ ▶▶ / step), **VIEW** (Fit, −, +: bagong zoom button), **LAYERS** (Values, Wire values, Inspector), **TRACE** (↩ Back, lumalabas lang kapag may babalikan).
  - **Status line** na madilim (CAD): RUN / PAUSED / VIEW, bersyon, oras, Events, mensahe. Inalis ang pangalawang mode label sa title strip.
  - **Pangalan:** Panel → *Inspector*, Wire → *Wire values*, Operator → *Faceplate*, Details → *Inspector*, DITL ▶ Simulate / Edit → *▶ Run / ■ Stop*.
  - **⚙ menu:** Theme (Light / Dark), Diagram (Light paper default, Dark, Dark calm, Dark clarity), **Drawing text** 100 / 125 / 150 % (mas malaking sulat sa drawing kapag maliit ang screen). Inalis ang font selector (iisang font na).
  - **Inspector (ABC):** pangalan ng tag, section, input at highlight ay sumusunod na sa theme (dati puting sulat sa puting background).
  - Ang graphic ng Plant view ay HMI-dark pa rin (frame lang ang nagbago).
  - Bug na nahuli ng test at inayos: ang Faceplate pane ay naghahanap ng button na may pangalang "Panel"; ngayon tumatanggap din ng "Inspector" (`src/ui/hmi/hmi.js`, `src/ui/uat/uat-ui.js`, `src/ui/uat/scen.js`).
- **As Left (headless, 2026-10-21):**
  - `npm run check` SAME; `npm test` lahat PASS (T1 ~ T5, S1 ~ S6).
  - ditl_toolbar 36, plant_view 18, manstation 12, panel_sync 12, overview 9, lookonly 8, events 5, faceplate (68 controller), infocard, abcbar: lahat PASS. Ang tests na may lumang pangalan ng button ay in-update sa bagong pangalan (Faceplate, Plant view, Run / Stop, taas ng top bar + ribbon).
  - values_layout: parehong resulta ng v2.4.0 (13 text, 4 value, 65 block; wire 98 vs 101 dati); ang test na ito ay hindi rin pasado sa v2.4.0.
  - Bilis sa RUN, ABC, CPU 4× mas mabagal (Chromium throttle), 8 s: v2.4.0 ≈ 60 fps, beta.2 ≈ 60 fps (p95 16.7 ms pareho).
  - Screenshot light at dark: ABC VIEW, ABC RUN, DITL, Plant view, Tools + ⚙: 0 page error.
- **Hindi pa nasubok:** tunay na tablet / phone / exe / apk (sa device ng user).
- **Susunod (beta.3, mungkahi):** "Inputs" tab sa kaliwa (listahan ng mga ma-fo-force na address), "Forceable" layer na nagha-highlight sa drawing, kusang Faceplate + trend sa RUN.
