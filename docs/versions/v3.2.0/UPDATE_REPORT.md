# v3.2.0 — Iisang linya at Control Room redesign

Base: pinagsama ang **2.5.0-beta.20** (PR #34 / #35, logic at data) at ang **3.1.0-beta.7** (PR #37, itsura). Plano na inaprubahan ng user (2026-10-22): P0 merge + bug fixes → P1 engine at import check → P2 shell at design system → P3 bawat screen → P4 phone / tablet, accessibility, bilis. Audit: https://claude.ai/artifact/3RbWZ8V96QbzL1y6ZMAH18 · Proposal: https://claude.ai/artifact/Qk9hqE5yBjy4EYXrXXFmPR

## 3.2.0-beta.1 — P0: pagsasama ng dalawang Beta line at mga Critical bug
- **Problem (audit 2026-10-22, C1 C2 C3 M3 M5 L2):**
  - Dalawang Beta line ang naghiwalay mula sa v2.4.0. Kapag isa lang ang i-merge, mawawala ang trabaho ng kabila.
  - Plant view: walang bumubukas kapag pinindot ang controller o valve (mouse at touch).
  - Plant view na unang binuksan: 6 / 51 lang ang live sa UNIT, at hindi na nagbabago.
  - Inspector: "(A detailed explanation ... is not written yet.)", "Record check: PASS / FAIL / NEEDS REVIEW" at "suggested speed" ay nakikita ng operator.
  - Plant view: unit ng PV ang ginamit sa MV ("MV 56.0 mm" habang ang faceplate ay 3.00 %).
  - "-0.000" / "-0.00" sa faceplate at Inspector.
- **As Found:**
  - Ang engine, logic at data ng 2.5.0-beta.20 ay walang katapat sa 3.1 (ang 3.1 ay UI lang mula v2.4.0). 18 file ang parehong binago; 6 ang may conflict (shell CSS / JS, plant CSS, version, 2 test).
  - C1: `plant.js` ay nag-`setPointerCapture` sa pointerdown, kaya ang click ay napupunta sa buong graphic. Dagdag: ang text na nasa ibabaw ng pindutan ang sumasalo ng pindot; ang click sa value na walang address ay naghahanap ng "<tag>.PV" na wala sa drawing.
  - C2: ang ABC sheets ay binabasa sa background (`loader.js` loadData). Ang Plant view ay nag-link habang wala pang sheet, at hindi na umulit.
- **Work Done:**
  - Branch `claude/project-thread-8t4984` mula sa 2.5.0-beta.20, merge ng 3.1.0-beta.7 sa ibabaw.
    - Engine, logic, data, DITL pages, HMI 1:1: galing sa 2.5.0 (walang binago).
    - Shell (itsura): 3.1. Idinagdag ang mga style ng 2.5.0 na wala sa 3.1 (DITL panel, DITL links, header, Focus / mini-map / Width), naka-kabit sa kulay ng 3.1 (Light / Dark).
    - Tinanggal ang 2.4.1 LOGIC layout (top bar ⏱, mga button sa sulok ng drawing) dahil ang 3.1 ay may sariling VIEW | RUN, ribbon at Inspector. Natira ang DITL panel tabs (Selected / Inputs / Timers / Valves / Outputs).
    - VIEW | RUN sa itaas: sa DITL, pinipindot nito ang Run / View ng DITL bar (RUN = 1x, hindi paused, gaya ng 2.5.0-beta.9). Reset, Back, Zoom, Panel ng DITL ay nasa ribbon. Width at Focus ay nasa zoom bar ng drawing.
    - VIEW sa ABC: hindi kumukupas ang inputs; may "inputs are locked" (gaya ng 2.4.1-beta.7).
  - C1: capture lang kapag talagang nag-drag (≥ 6 px); ang click na tapos ng drag ay hindi nagbubukas; text sa graphic ay hindi sumasalo ng pindot; isang listener bawat item; ang value na walang address ay nagbubukas ng info card gamit ang pangalan ng wire sa sheet. Ang value ng plant model na walang DCS tag (oil flow, bed temperature) ay hindi na mukhang pipindutin, may tooltip.
  - C2: hinihintay ng Plant view ang ABC sheets bago mag-link.
  - M3: tinanggal ang "not written yet"; ang PASS / FAIL / NEEDS REVIEW at "suggested speed" ay lalabas lang kapag bukas ang TOOLS · UAT.
  - M5: ang MV unit sa Plant view ay galing sa faceplate (PID = %, MAN station = sariling unit).
  - L2: walang "-0.000" / "-0.00".
  - Tests na binago para sa bagong layout (hindi binago ang inaasahang behavior): `ditl_selected`, `ditl_sim`, `ditl_toolbar`, `lookonly`, `layout` (isinulat muli para sa 3.2 layout).
- **As Left (ebidensya):**
  - Build: `dist/logic-sim-v3.2.0-beta.1.html`, 0 page error.
  - Plant view unang binuksan: UNIT **51 / 51** linked (dati 6 / 51); 003 **50 / 94** (pareho ng ABC-first).
  - Totoong mouse click at touch tap sa bawat item ng UNIT: **45 / 45** nagbubukas ng faceplate o info card (dati 0); drag ay hindi nagbubukas.
  - Tests ng ayos: plant_click 10 / 10 (bago), plant_view 18 / 18, faceplate, layout 26 / 26 (isinulat muli), ditl_selected, ditl_sim, ditl_toolbar, lookonly: pasado. `npm run check`: SAME.
  - UI audit tool (27 screen) sa 1333 × 833 light, 1920 dark, 800 × 1280, 390 × 844: 0 page error. Natira ang mga dati nang kilala: phone ribbon na lampas sa screen (H3, P4), Library Calculations sa 800 px (M6, P4), listahan na naka-scroll sa ilalim ng header (hindi bug).
  - Buong regression: tingnan ang 3.2.0-beta.2 sa ibaba.
- **Status:** P0 tapos, ipinush bilang Beta. Hindi pa nasubok sa tablet / exe / apk ng user.

## 3.2.0-beta.2 — Inspector button at Focus sa ABC (nakita sa buong regression)
- **Problem:** sa ABC RUN na naka-Faceplate, ang LAYERS · Inspector button ay hindi nagtatago ng panel. Ang Focus (Shift+F) sa ABC ay hindi nagsasara ng panel.
- **As Found:** ang Panel button ng DITL bar ay inilipat sa ribbon (nakatago kapag ABC). Ang faceplate (`hmi.js` tick) at ang Focus (`view.js` panelBtn) ay naghahanap ng unang "Panel / Inspector" button, kaya ang nakatagong DITL Panel ang nakukuha. Ang dalawang test (`layout`, `view`) ay may ganitong mali rin, kaya hindi ito nahuli sa beta.1.
- **Work Done:** ang faceplate ay hindi na tumitingin sa DITL Panel; ang Focus ay gumagamit ng button ng page na nasa screen (ABC: Inspector, DITL: Panel). Tests `layout` at `view`: pinipindot na ang tamang button (ABC: Inspector).
- **As Left (ebidensya):**
  - `layout` 26 / 26, `view` (ABC at DITL, VIEW at RUN, PC at phone), `faceplate`, `hmi_op`, `panel_sync`: pasado. `npm run check`: SAME.
  - Buong regression laban sa 2.5.0-beta.20 (parehong makina, parehong runner):
    - Scenarios **244 tama, 0 mali** (pareho). Engine isolated: 54 sheets, 5129 nets, pareho ang value; Reset pareho.
    - `switches` 438 kaso, 0 mali; `force_manual`, `pid_am`, `pid_auto`, `unit_load`, `unit_trip`, `world`, DITL imports (`ditl_ba`, `ditl_ls`, `ditl_sb`, `ditl_pdf`, `ditl150`): pasado sa dalawa.
    - `events`, `loaddown`, `manstation`, `overview`, `panel_sync`: pasado sa 3.2 (sa 2.5.0-beta.20 ay bagsak, dahil sa lumang layout ng test).
    - Bagsak sa DALAWA (hindi galing sa 3.2): `audit230` (LINK-1), `pv_reacts` (pareho ang listahan ng MV STUCK), `values_layout` (pareho ang 2 label), `interlock` (lampas 15 min sa cloud), `closure` / `ditl_export` (mali ang argument ng runner), `refcheck` (walang `xlrd` sa cloud).
- **Status:** ipinush bilang Beta. Hindi pa nasubok sa tablet / exe / apk ng user.

## P1 — engine at import check (walang binago sa app; 3.2.0-beta.2 pa rin)
- **Problem:** patunayan na tama ang logic bago ang malaking UI change (P2 ~ P4). Ang mga test na bagsak sa buong regression ay dapat may paliwanag.
- **As Found / Work Done (bawat test na bagsak, pinatakbo muli nang tama):**
  - `audit230` LINK-1: ang test ay mula 2.3.0 (noong wala pang sootblower logic sa app: "huwag ikabit sa DITL-80"). Mula 2.5.0-beta.12 ang ABC-017 I.024E "FROM DITL 80S-57" ay nakakabit sa (S22)DITL-80S output 57. PDF `(22)Ditl80S.pdf`: output 57 = "S/B STEAM SUPPLY MOTOR VALVE TORQUE", TO 80S-12 / 80S-27 / ABC-017; input row 12 = I.024E TORQUE. **(b) tama, may ebidensya.** Ang test ay binago: tinitingnan na nakakabit sa 80S output 57 (hindi sa DITL-80) at ang TO ng row ay ABC-017. Pasado na.
  - `interlock` (dati lampas 15 min): pinatakbo nang walang limit: ALL PASS. Ang 17 controller na "NO SINGLE TRIP INPUT" ay walang force-manual input sa drawing (kilala).
  - `closure` at `ditl_export` (dati maling argument ng runner): tumakbo nang tama. `closure`: 62 PID loop, walang error. `ditl_export`: 241 DITL sheet na-export.
  - `refcheck` (dati walang `xlrd`): F(X) 89 table, 4 kilalang exception (LN15, LN21 ratio; LN38 / LN39 sa drum-level-calculation.xls); PID / MAN / SUMA 136 row, 0 nawawala, 1 diff = ABC-020 HICHR1002A ML (workbook 19, app 10: sinadya, v2.2.0 UPDATE_REPORT, procedure "RH = 10 %"); AI range 157 tag, 0 iba, 2 walang sheet (AI0737, AI0288: input lang, kilala).
  - `pv_reacts` 18 MV STUCK at `values_layout`: listahan ng diagnostic, pareho ang bilang mula 2.4.1-beta.10 (v2.5.0 UPDATE_REPORT).
- **Bagong nakita (para sa P3, DITL panel):** sa (S22)DITL-80S ang text ng output row sa listahan / export ay galing sa row sa itaas (hal. output 57 ay nakasulat na "FULL CLOSED", ang 58 ay "TORQUE ... TRIP"), dahil ang 3-linya na label ay nagsisimula sa itaas ng wire. Ang drawing mismo, ang mga link at ang valve model ay tama (ang model ay bumabasa ng text sa ilalim ng wire). Itsura lang ng listahan: aayusin sa P3.
- **As Left:** engine isolated 54 sheets / 5129 nets pareho; scenarios 244 / 0; `switches` 438 / 0; `force_manual`, `pid_am`, `pid_auto`, DITL imports (`ditl_ba`, `ditl_ls`, `ditl_sb`, `ditl_pdf`, `ditl150`): pasado. Walang mali sa engine na nakita.
- **Status:** P1 tapos. Susunod: P2 (shell at design system).

## 3.2.0-beta.3 — P2: Control Room shell (itsura lang)
- **Problem:** ang plano (proposal "Control Room"): iisang shell sa bawat page, ang lagay ng planta ay laging nakikita, ang alarm ay laging nasa itaas (gaya ng DCS), mas kaunting kalat sa itaas.
- **As Found:** sa 3.2.0-beta.2: logo, 4 tab, ABC | DITL, sheet, search, VIEW | RUN at ⚙ sa isang hilera; walang lagay ng planta at walang alarm sa itaas. Dagdag na bug: ang ⚙ menu at Start ▾ ay walang laman mula beta.1 (nawala sa merge ang style ng bukas na menu).
- **Work Done:**
  - 900 px pataas: **rail** sa kaliwa (Plant view / Logic / Library / Tools, ⚙ sa ibaba); **unit band** sa itaas (LMYP #1 · CFB Boiler, LOAD MW, MSP, DRUM LVL, FW FLOW, search, VIEW | RUN); **alarm banner** (aktibong alarm o trip mula sa Event log, bilang ng FORCED, Events); **ABC | DITL at sheet** sa simula ng ribbon. Ang pindot sa value ng band ay nagbubukas ng sheet nito.
  - Ang mga value ng band ay BINABASA lang mula sa sheet na tumatakbo (walang kino-compile, walang sinisimulan): "—" hangga't hindi pa tumatakbo ang sheet (buksan ito o Start ▾).
  - Mas makitid sa 900 px (tablet portrait, phone): ang dating top bar, walang nagbago (P4 ang phone).
  - Ayos: ⚙ menu at Start ▾ bumubukas ulit; ang ⚙ menu ay lumalabas sa tabi ng rail.
  - Tests na inangkop sa bagong lugar ng mga button (parehong behavior): `view` (Focus = buong lapad sa kanan ng rail), `plant_view`, `ditl_toolbar` (tabs nasa rail). Bagong test: `shell_cr`.
- **As Left (ebidensya):**
  - `shell_cr` 10 / 10 (rail, band, banner, ⚙ menu at Start ▾ nasa screen, 820 px = lumang bar, balik sa 1333 px).
  - Pasado: `layout`, `view`, `ditl_toolbar`, `ditl_selected`, `ditl_sim`, `lookonly`, `plant_click`, `plant_view`, `plant_live`, `events`, `faceplate`, `hmi_op`, `panel_sync`, `sidetab`, `abcbar`, `infocard`, `overview`, `stale_beta`, `inapp_update`, `reset`, `manstation`, `ditl_pagelink`, `controllers_table`, `tests`, `diff` (lahat ng sheet pareho ang drawing). `npm run check`: SAME.
  - UI audit (27 screen) sa 900, 1024, 1333 light at 1920 dark: 0 page error; walang bagong offscreen; ang bagong maliit na pindutan (ABC | DITL, Events) ay pinalaki.
  - Engine: walang binagong file ng engine, logic o data.
- **Hindi pa nasubok:** tablet / exe / apk ng user.
- **Status:** P2 tapos, ipinush bilang Beta. Susunod: P3 (bawat screen).

## 3.2.0-beta.4 — P3: bawat screen (itsura lang)
- **Problem:** ayon sa plano (mockups after-plant, after-ditl, after-logic): sa Plant view ang listahan ng system ay laging nakabukas at maliit ang graphic; ang faceplate ay pop-up na tumatakip sa graphic; sa DITL ang TIMERS card ay nakatakip (audit M2) at ang mga pamagat ng grupo sa listahan ng sheet ay nagpapatong-patong; sa (S22)DITL-80S ang text ng output ay galing sa label ng row sa ibaba (P1 finding); ang Inspector ay walang "saan galing / saan papunta".
- **As Found:** Plant view 1333 px: listahan 240 px + values 300 px, graphic ~790 px. DITL: ang `#tp` card ay nasa ibabang kanan, nakapatong sa panel / drawing. Ang mga pamagat ng grupo (`.fhc`) ay `position: sticky` lahat sa iisang listahan kaya nagpapatong kapag nag-scroll. 80S: ang 3-linya na label ay nasa GITNA ng wire (isang linya sa itaas, isa sa wire, isa sa ibaba), pero ang pag-grupo ng cell ay kumukuha ng text hanggang 5.7 sa itaas ng wire, kaya ang unang linya ng label sa ibaba ay napupunta sa row sa itaas.
- **Work Done:**
  - **Plant view** (`src/ui/plant/plant.js`, dulo ng `app.css`): kapag ≥ 836 px ang workspace, buong lapad ang graphic; ☰ Systems = drawer; bagong screen picker sa bar: ◀ / listahan ng 30 screen / ▶ at chips (UNIT, 003 Water, 004 Extraction, 007 Air, 011 Coal, 033 CCS; ang hindi kasya ay nakatago); ⛶ full screen; Values = slide-out sa kanan; ang faceplate ay panel na naka-dock sa kanan, buong taas, at ang graphic ay hindi nag-iiba ng zoom (pareho ang lugar ng bawat item). Mas makitid: ang dating frame.
  - **DITL** (`src/ui/shell/ditl.js`): sa sheet na ang label ay nasa gitna ng wire (5 o higit pang linya ang mas malapit sa ibang wire: (S22)DITL-80S lang sa 241 sheet), ang text ng output sa panel ay kinukuha sa pinakamalapit na wire. Text lang ng panel: ang drawing, mga link at valve model ay hindi gumagamit nito. Ang TIMERS card ay nakatago habang bukas ang panel; sa Timers tab may "Edit presets" na nagbubukas nito sa tabi ng panel. Ang mga pamagat ng grupo ng listahan ay sumasama sa scroll.
  - **Inspector ABC** (`src/ui/shell/app.js`): sa card ng napiling block, COMES FROM (block na nagbibigay ng bawat input) at GOES TO (block na tumatanggap ng bawat output), may live value. Binabasa lang sa netlist ng drawing.
  - Bagong test: `tests/regress/p3_screens.js`.
- **Hindi ginawa (sa susunod):** trend strip sa ilalim ng Plant view (bagong feature, hindi ayos); filter chips ng sheet list (Forced / In alarm / MAN); "WHY IS IT 1?" ng DITL output; ang dobleng title row ng DITL (#meta) ay nanatili dahil may badge at bilang na wala sa ribbon.
  - Search sa ≤ 1280 px: ang row ng search ay nasa ilalim na ng buong top area (dati tinatakpan ang alarm banner at kalahati ng ribbon; nakita sa UI audit).
- **As Left (ebidensya):**
  - `p3_screens` 18 / 18. Pasado: `layout`, `view`, `ditl_toolbar`, `ditl_selected`, `ditl_sim`, `lookonly`, `plant_click` (bawat item, mouse at touch), `plant_view`, `plant_live`, `plant_bg`, `events`, `faceplate`, `hmi_op`, `panel_sync`, `sidetab`, `abcbar`, `infocard`, `overview`, `stale_beta`, `inapp_update`, `reset` (51 sheet, 0 iba), `manstation`, `ditl_pagelink`, `controllers_table`, `shell_cr`, `ditl_ba`, `ditl_ls`, `audit230`. `npm run check`: SAME.
  - UI audit (27 screen) sa 900, 1024, 1280 light at 1920 dark: 0 page error. Natitira (P4): Library Calculations lumalampas sa 900 px.
  - Engine: walang binagong file ng engine, logic o data.
- **Hindi pa nasubok:** tablet / exe / apk ng user.
- **Status:** P3 tapos, ipinush bilang Beta. Susunod: P4.

## 3.2.0-beta.5 — P4: phone, tablet, accessibility (itsura lang)
- **Problem:** sa phone (390 px) ang Plant view / Logic / Library / Tools ay nasa itaas kasama ng iba pang button, kaya ang ⚙ ay napupunta sa ikalawang hilera at may bakanteng hilera sa Plant view at Library; ang bar ng Plant view ay lumalampas sa screen (LIVE putol); ang status bar ay may mahabang hint text.
- **As Found:** UI audit 390 × 844 at 800 × 1280 ng 3.2.0-beta.4 (27 screen bawat isa): 0 page error; offscreen: ribbon (sinadya: naka-scroll na may fade), Plant bar LIVE, Library Calculations (sinadya: naka-scroll ang table). axe-core (WCAG 2 A / AA) sa DITL, Plant view, ABC, Library, Tools: 2 mali, parehong sa Library (station select na walang pangalan, listahan na hindi ma-focus ng keyboard).
- **Work Done:**
  - Phone (≤ 640 px, `src/ui/shell/cr.js` `phone()` + dulo ng `app.css`): ang 4 na page ay tab bar sa ibaba (icon + pangalan, 47 px ang taas, para sa daliri); ang top bar ay isang hilera (ABC | DITL, search, VIEW | RUN, ⚙); walang bakanteng hilera sa Plant view / Library / Tools; ang hint text ng status bar ay nakatago sa phone. Mas malapad: walang nagbago.
  - Plant view sa phone: ang bar ay naka-scroll pakanan (dati lumalampas).
  - Faceplate ng Plant view sa phone: bottom sheet mula sa ibaba (dati, mula beta.4, buong taas mula sa itaas). TIMERS card sa phone: nakatago (nakatakip sa zoom bar); nasa Panel > Timers, at "Edit presets" ang nagpapakita nito.
  - Library: pangalan ng station select ("Station") at ang listahan ay ma-focus na ng keyboard (axe).
  - Test `shell_cr`: dagdag na 3 check (tab bar sa phone, Library mula sa tab bar, balik sa malapad). Tests na naghahanap ng tabs: kasama ang `#crnav`.
- **Hindi ginawa:** bigat ng file (12.9 MB; target ≤ 9 MB): ang 391 HMI background ay naka-optimize na PNG (walang matitipid nang lossless), at ang drawing data ay kailangan. Mananatili. Ang KPI strip sa phone (mockup) ay hindi ginawa: ang top bar ay masikip na.
- **As Left (ebidensya):** 29 test, 0 FAIL (`p3_screens`, `shell_cr` 13 / 13 kasama ang phone, `layout`, `view`, `ditl_toolbar`, `ditl_selected`, `ditl_sim`, `lookonly`, `plant_click`, `plant_view`, `plant_live`, `plant_bg`, `events`, `faceplate`, `hmi_op`, `panel_sync`, `sidetab`, `abcbar`, `infocard`, `overview`, `stale_beta`, `inapp_update`, `reset`, `manstation`, `ditl_pagelink`, `controllers_table`, `ditl_ba`, `ditl_ls`, `audit230`). `npm run check`: SAME. UI audit 390 × 844, 800 × 1280, 1280 × 800, 1920 dark: 0 page error (natitirang offscreen: ribbon at Plant bar na naka-scroll, sinadya). axe-core WCAG 2 A / AA: 0 violation sa DITL, Plant view, ABC, Library, Tools. Engine: walang binagong file ng engine, logic o data.
- **Hindi pa nasubok:** phone / tablet / exe / apk ng user.
- **Status:** P4 tapos; tapos ang P0 ~ P4 ng Control Room redesign. Susunod: device check ng user; Stable sa GO STABLE lang.

## 3.2.0-beta.6 — Re-audit ng 20 UI findings at mga bug fix (itsura lang)
- **Problem:** tanong ng user (7:07 PM): "tapos ka na ba sa mahabang prompt ko?". Wala pang pagsukat ulit ng 20 finding ng audit (3.1.0-beta.7) laban sa "pasado kapag" ng bawat isa.
- **As Found (sinukat sa 3.2.0-beta.5, headless 1280 × 800):**
  - Plant view sa VIEW: may pangalawang "▶ Run" sa bar (M1).
  - Controller cards ng Faceplate: "-0.00" (L2, ibang formatter kaysa sa naayos sa beta.1).
  - RUN nang walang Start ▾: walang paalala, 0 MW (M4).
  - Pamagat ng sheet at paglalarawan sa Inputs list: putol, walang tooltip (L1).
  - OFF / ON ng Inputs: 24 px kahit sa touch (L4).
  - "press ▶ Run" sa DITL panel, pero wala nang ganoong button doon.
- **Work Done:**
  - Isang RUN lang: sa VIEW, ang bar ng Plant view ay may Start ▾ at CHECK lang. Sa RUN, ❚❚ Pause / Reset / bilis.
  - Walang minus sa zero sa lahat ng formatter ng faceplate at Inspector.
  - Paalala sa status line kapag RUN na walang starting state: "pick Start ▾ in the PLANT VIEW (At 150 MW, Cold, Warm, Hot)".
  - Tooltip na may buong pamagat at buong pangalan ng input.
  - 32 px na OFF / ON sa touch screen.
  - "press RUN (top right)".
  - Engine, logic, data at drawing: walang binago.
- **Re-audit ng 20 finding (3.2.0-beta.6):**

| ID | Lagay | Ebidensya |
|---|---|---|
| C1 Plant view click | SARADO | `plant_click`: bawat item, mouse at touch |
| C2 Plant view patay kung una | SARADO | `plant_click`, `plant_live`: 51 / 51 kahit Plant muna |
| C3 dalawang Beta line | SARADO | iisang branch (PR #38) mula beta.1 |
| H1 maliit na text sa Plant view | BAHAGYA | graphic 96 % ng lapad (dati 57 %); median na text 11 px, p10 10 px sa 1280 (target ≥ 12 px) |
| H2 Inputs list magkakamukha | SARADO | buong address bawat row (SIG.AB B.066A, B.0642 …), may tooltip |
| H3 phone lumalampas | SARADO | beta.5 bottom tab bar; audit 390 px 0 page error |
| H4 DITL pindutin maliit | SARADO (sa panel) | Inputs tab ng DITL panel: PRESS / 0 · OFF ≈ 32 px bawat input; ang simbolo sa drawing ay maliit pa rin sa Fit |
| M1 dalawang Run | SARADO | sa VIEW: 0 Run sa bar; RUN: ❚❚ Pause lang |
| M2 DITL "EDIT", TIMERS card | SARADO | "VIEW / TRACE"; walang "EDIT"; TIMERS nakatago habang bukas ang panel (beta.4) |
| M3 hindi tapos na Inspector text | SARADO | beta.1 |
| M4 RUN nang walang Start | SARADO | paalala sa status line |
| M5 MV unit | SARADO | beta.1 |
| M6 portrait / talaan | SARADO | beta.5 (Library Calculations naka-scroll; Plant view fit) |
| M7 halo ang wika | PASYA MO | hindi ginalaw |
| M8 accessibility | SARADO | axe-core WCAG 2 A / AA: 0 violation (beta.5) |
| L1 putol na pamagat | SARADO | tooltip ng buong pamagat at pangalan |
| L2 "-0.000" | SARADO | 0 na "-0" sa screen ng ABC-010 RUN |
| L3 O2 A / B magkalayo | TAMA ANG APP | ang HMI snapshot mismo: AIFG1122 6.4 %, AIFG1123 2.2 % (`docs/hmi/OPERATING_POINTS.md`) |
| L4 maliit na pindutan sa touch | SARADO | 32 px sa touch (pointer: coarse) |
| L5 bigat ng file | BUKAS | 12.9 MB; ang HMI PNG ay naka-optimize na |

- **Status:** ipinush bilang Beta. Hindi pa nasubok sa tablet / exe / apk ng user.

## 3.2.0-beta.6 (dagdag, 2026-10-22 gabi) — "Bakit?", first-out ng trip, madilim, mas kaunting bar

**Problem (user, 7:40 ~ 8:00 PM PHT):** "BAKIT BA PURO PUTI", "AYAW KO NG PUTI", "walang out of the box thinking", "ano ang gagawin mo sa app". Ang hinihingi: ang app ay hindi lang viewer; dapat nitong sabihin kung BAKIT.

**As Found:**
- Puti (light) ang default ng app at ng drawing mula 3.0.0. Desisyon iyon ng naunang session, hindi ng user.
- Sa Plant view, 4 na hilera ng bar ang nasa itaas ng graphic: unit band, alarm, ribbon na may Start / CHECK lang, at plant bar.
- May "FORCE MANUAL (M.0226 = 1): AUTO not allowed" sa faceplate, pero hindi sinasabi kung saan galing ang M.0226.
- Ang Event log ay naglilista ng TRIP, pero walang sanhi. Sa ABC, walang net na may pangalang TRIP, kaya ang DITL trip (MFT) ay hindi kailanman napapasok sa log.
- Ang FORCED chip ay nagbibilang ng force sa lahat ng sheet, pero ang listahan (Inspector) ay sa sheet lang na nakabukas. Walang paraan para makita ang force na nasa ibang sheet.

**Work Done (itsura at pagbasa lang; walang binago sa logic, engine, plant model at drawing):**
- **Madilim ang default** ng app at ng drawing. Bagong key ito (`ls-theme4`, `ditl.dg4`), kaya magiging madilim din ang lumang install. Puwede pa ring piliin ang Light sa ⚙.
- **Mas kaunting bar:**
  - Ang alarm line ay nasa unit band na (`cr.js`).
  - Sa Plant view, PC at tablet (900 px pataas), ang Start ▾ / CHECK at, kapag RUN, ang Pause / Reset / bilis ay nasa simula ng plant bar. Wala na ang hilerang may ilang button lang.
  - Mas malaki nang 2 hilera (mga 74 px) ang graphic.
- **"Why?" sa faceplate** (`src/ui/shell/why.js`, `hmi.js`): kapag naka-FORCE MANUAL ang loop, binabaybay ng pindot pabalik ang logic gamit ang live na value:
  - dumadaan sa OR (ang input na 1), AND (ang input na 0), NOT, flip-flop, timer, comparator at link sa ibang ABC sheet;
  - humihinto sa ugat: input ng operator / HMI, transmitter, bad signal, force ng user, o DITL;
  - may pindot na "→ 1 / → 0" sa input para baguhin ito.
- **"Why = ?" sa info card** ng bawat tag: pareho ang pagbaybay.
- **First-out ng trip** (`world.js`, `ditl.js` `DUI.cause`, `events.js`):
  - Kapag ang DITL output na TRIP / MFT / RUN BACK ay naging 1, sa mismong scan na iyon kinukuha ang input na 1. Iyon ang first-out, at isinusulat ito sa Event log ("cause ▸").
  - Hindi isinasama ang "NO TRIP PRESENT" at ang shutdown sequence ng burner at igniter.
  - Gumagana kapag ON ang One world; may paalala sa Event log kapag OFF ito.
  - Sinusundan ang sanhi sa ibang sheet: input row ng DITL-03A → output ng DITL-03E → input nito → signal ng ABC-010 (at "FORCED by you" kapag force). Ang AND ay nagpapakita ng LAHAT ng input na 1 (hal. 2 sa 3 drum level channel). Sinusundan lang ang source na talagang 1.
  - Ang mga output ng iisang sheet na sabay naging 1 sa iisang sanhi (MFT · SER, MFT 1 · TCS, MFT · IRP ...) ay ISANG event na: "MASTER FUEL TRIP (MFT) = 1 (+5 outputs)".
- **FORCED chip = listahan** ng lahat ng force ng user sa bawat ABC sheet, may Go at Release. Hindi kasama ang value ng plant model.

**As Left (sinubok sa built html, headless Chrome):**

| Test | Ano ang nakita |
|---|---|
| `why.js` | LICBR1001B (ABC-010) sa 150 MW: "FORCE MANUAL (M.0226 = 1)". Ang Why? ay nagpapakita ng M.0226 = 1 ← OR ← NOT ← FICFW1007.MAN = 0 at LICBR1001A.MAN = 0, may 2 pindot na "→ 1". |
| `why.js` | Pinindot ang BOILER EMERGENCY TRIP P.B. (DITL-03A row 14): ang Event log ay may "MASTER FUEL TRIP (MFT) = 1", cause "Input row 14 · BOILER EMERGENCY TRIP P.B. ON (CRT) = 1". Walang "NO TRIP PRESENT" sa log. |
| `why.js` | Force ng ABC-010 M.0170 at M.0172 (drum level L.L. channel 1 at 3): pagkalipas ng 5 s timer ng DITL-03E, ISANG event "MASTER FUEL TRIP (MFT) · SER = 1 (+5 outputs)", cause: DITL-03A input row 10 DRUM LEVEL L.L. ← DITL-03E output row 21 ← input row 19 (M.0172) at row 18 (M.0170) ← ABC-010 M.0172 / M.0170 = 1 · FORCED by you. Kapag isa lang na channel ang naka-force: walang MFT (tama sa drawing: AND ng dalawang channel). |
| `forcelist.js` | Plant model ON, 150 MW: walang FORCED chip. Force ng M.0228 sa ABC-010, tapos binuksan ang ABC-001C: "1 FORCED" pa rin. Ang listahan ay may ABC-010 M.0228 FORCE 1; Go → ABC-010; Release → walang force. |
| Screen walk | PC 1440 × 900, tablet 1280 × 800 / 800 × 1280, phone 390 × 844. 9 screen bawat sukat, 0 page error. Sa 150 MW: "NO ALARM". |

**Status:** nasa branch, hindi pa naka-push. Hinihintay ang pasya ng user.

## 3.2.0-beta.7 — F(X) curves page: sheet na gaya ng workbook, table na pwedeng i-edit, paliwanag ng bawat LN
- **Problem (user, 2026-10-23 12:33 PM PHT):** "gusto ko magkaroon ng option na makikita mo ang table tulad ng sa excel nya, at doon ka rin makakapag-edit ng values para malaro mo response ng planta" (ang itsura ay ang `document-references/linear-curves-fx.xls`), at "explanation ang bawat linear ... saan ito nanggaling hanggang sa huling pupuntahan, purpose, function, effect, causes".
- **As Found:**
  - Ang F(X) tables button ay nagbubukas lang ng kahon para mag-paste ng CSV / JSON at listahan ng bilang ng table. Walang kurba, walang table na gaya ng workbook, walang paliwanag.
  - Ang pag-edit ng LX / LY ay nasa Inspector lang (kapag pinili ang FX block sa drawing), maliit na listahan, walang kurba ng buong sheet.
  - 91 table ang nasa app (S1 44, S2 23, S3 24); 89 ang sheet sa workbook (ang S1-LN38 / LN39 ay galing sa drum level calculation file).
- **Work Done (walang binago sa logic, engine at drawing; ang table data ay pareho):**
  - Bagong page **F(X) curves** (`src/ui/fx/fx.js`, `fx.css`): binubuksan ng "F(X) tables" (Tools), ng "F(X)" sa ribbon ng ABC, at ng bagong "F(X) page" sa tabi ng "Edit table" sa Inspector ng FX block.
    - Kaliwa: listahan ng 91 table ayon sa station (STN101 / 102 / 103), may search (LN, title, tag). Sa phone: dropdown.
    - Ang sheet ay kopya ng workbook: STN10x LINEARIZE, Ptrn No., kurba (abong plot, putol-putol na grid, asul na linya, pangalan ng axis mula mismo sa chart ng workbook: hal. HS-COAL.MV / COAL CORR. CONSTANT), table X - INPUT | RANGE | Y - OUTPUT | RANGE | NO. | LX | LY, at title block (JOB NAME, TITLE, Ptrn No., DWG No.). Puting papel kahit madilim ang app.
    - Bawat X, Y, LX at LY ay pwedeng i-edit (pindot o Enter, Esc = cancel, arrow = lipat). Ito ang PAREHONG edit ng Inspector (`AN.lne`): naka-save, kasama sa project file, hindi nabubura ng Reset ng simulation. Dilaw ang row na iba sa workbook; "edited" sa listahan. May "Reset this table" at "Reset all edits".
    - Ang tumatakbong sheet ay gumagamit agad ng bagong value. Pulang tuldok sa kurba = live na input / output kapag tumatakbo ang sheet na gumagamit nito; "Try an input" = isulat ang X, makikita ang Y.
    - **About this curve:** What it does · Input comes from · Output goes to · Why it is there · If you change it · Used on (pindot = bubuksan ang sheet) · mga signal bago at pagkatapos (galing sa drawing sa app, pindot = info card).
  - Paliwanag ng 91 table (`src/ui/fx/fx-info.js`): isinulat mula sa title ng drawing, axis ng workbook chart, signal path sa app, I/O at memory list, PR-OPE-5002 at FHI design data.
  - Signal path at axis names (`src/ui/fx/fx-paths.js`) ay ginawa ng `tools/fx/trace.js` (binabasa ang bawat F(X) block sa built app: 111 block) + `tools/fx/axis.py` (text box ng chart sa workbook) + `tools/fx/paths.py`.
  - Engine: inilabas lang ang mga dating function (`AN.lnTables`, `lnApplyEdits`, `lneSave`, `lnResolve`, `lnOpen`) sa `boot.js`; ang dating paste panel ay bukas pa rin mula sa "Import / export".
- **As Left (sinubok sa built html, headless Chrome):**

| Test | Ano ang nakita |
|---|---|
| `fx_page.js` | Ang "F(X) tables" ay nagbubukas ng page (sarado ang lumang paste panel): 91 / 91 table, STN101 / 102 / 103. |
| `fx_page.js` | S1-LN3: 16 row; row 14 = X 50 / Y 1 / LX 50 % / LY 100 %, row 15 = X 100 / Y 1.2; title block S1-LN-03 / ABC-004A; axis HS-COAL.MV / COAL CORR. CONSTANT (gaya ng workbook). |
| `fx_page.js` | Lahat ng 91 table ay may What / From / To / Why / Change; "Used on" ABC-004A. |
| `fx_page.js` | 150 MW: LN3 block ng ABC-004A: input 33.1 % → 0.932 (gaya ng HMI snapshot). Binago sa page ang Y ng row 14 sa 1.1 → ang block mismo ay naging 0.9986 (inaasahan 0.8 + 0.3 × 33.1 / 50), dilaw ang row, naka-save. Reset this table → 0.932 ulit. |
| `fx_page.js` | Phone 390 px: dropdown sa halip na listahan, walang page na lumalampas sa screen; 0 page error. |
| axe-core | F(X) page sa 1440 × 900 at 390 × 844: 0 violation (WCAG 2 A / AA). |
| `refcheck.py` | Pareho ang table data sa workbook gaya ng dati: 89 compared, 4 kilalang exception (LN15, LN21, LN38, LN39). |
| `npm test` | 11 / 11 pasado. |
| UI regression | `shell_cr` 15, `plant_view` 18, `p3_screens` 18, `why` 6, `view` 49, `sidetab` 10, `layout` 26: pasado (pareho ng beta.6). |
| Screenshots | 1440 × 900, 1280 × 800, 800 × 1280, 390 × 844: 0 page error. |

- **Hindi nasubok:** tablet / exe / apk ng user. Ang ibang UI regression (DITL, Events, faceplate ...) ay tumatakbo pa; iuulat kapag tapos.
- **Status:** ipinush bilang Beta.

## 3.2.0-beta.8 — Guided Workbench: Home, Training, 4 na theme, mga ayos ng UI review
- **Problem (user, pinili sa card 2026-10-23 12:28 PM PHT "B + C · Guided Workbench"):** "bakit light lang, bakit dark lang, hindi pwedeng baguhin ang mga kulay?" at nahati ang isip sa B (gabay para sa nag-aaral) at C (workbench ng engineer). Mula sa UI review: walang panimulang page, hindi alam ng bagong user kung saan magsisimula; ang PR-OPE-5002 ay nasa docx lang; maliit ang text sa mga bar (9 ~ 10.5 px), maliit ang pindutan sa touch, 8 field na walang pangalan, dev tools nasa rail.
- **As Found:**
  - Dalawang theme lang (Light / Dark).
  - Ang app ay bumubukas sa huling page (Logic kadalasan), walang "saan ako magsisimula".
  - Ang Start ▾ (150 MW / Cold / Warm / Hot) ay nasa Plant view lang.
  - Pagkatapos ng Start, kapag tumatakbo ang orasan habang VIEW ang page, VIEW pa rin ang nakasindi sa switch, at walang epekto ang pindot sa VIEW.
  - Plant view: minsan nawawala ang graphic (viewBox NaN) kapag binago ang laki ng window habang nakatago ang page.
- **Work Done (walang binago sa logic, engine at drawing):**
  - **4 na theme** sa ⚙: Light, Dark (default pa rin), Control room grey, High contrast (`app.css`).
  - **Home** (bagong unang page, `src/ui/shell/home.js` + `home.css`): "What do you want to do?" (Continue, Operate the plant, Learn the start-up, Find a signal · Why?, Read the logic, F(X) curves, I/O and memory lists), Starting state (parehong Start ▾ buttons, tapos bubukas ang Plant view), at Sheets / Faceplates you opened.
  - **Training** (bagong page): ang 44 section at 663 hakbang ng PR-OPE-5002 Rev 03, kinuha ng `tools/training/extract.py` mula sa docx (`src/ui/training/pr-ope-5002.js`). Checkbox bawat hakbang (naka-save sa browser), progress bar, Tick all, Practise: Cold start. Tag ng controller / MAN station = faceplate sa Plant view; ibang DCS tag = info card; local valve / gauge = "field item".
  - **Tools** ay wala na sa rail: ⚙ > **Engineering tools**.
  - Ayos: VIEW | RUN ay RUN habang tumatakbo ang orasan; VIEW ang pumapatay (`app.js`). Plant view zoom: walang NaN (`plant.js` `keepZoom`).
  - Accessibility: pangalan ng sheet pickers, UAT at audit fields; text ng rail, tab bar, ABC | DITL, VIEW | RUN at status bar ay 12 px pataas; sa touch 44 px ang taas ng mga pindutan ng top bar at ⚙ menu.
- **As Left (sinubok sa built html, headless Chrome):**

| Test | Ano ang nakita |
|---|---|
| `home_training.js` | Bumubukas sa HOME; rail = Home / Plant view / Logic / Library / Training; ⚙ > Engineering tools = Tools page. |
| `home_training.js` | HOME At 150 MW: starting state plantLoad150, bumukas ang Plant view, VIEW ang switch. |
| `home_training.js` | Tumatakbo ang orasan habang VIEW: RUN ang nakasindi; pindot sa VIEW: tumigil, VIEW. |
| `home_training.js` | Sheets you opened: ABC-001C, ABC-010; pindot sa ABC-010 = bukas ang sheet. |
| `home_training.js` | Training: 44 section, 663 hakbang; tick ng hakbang 1 = "1 of 663", nananatili pagka-reload; Tick all = 6 / 6; FICFA1071 = faceplate; V-SW1002 = field item; phone = dropdown, 5 tab sa ibaba. |
| `fx_page.js` | Pasado pa rin (beta.7 F(X) page). |
| `npm test` | Pasado. |
| UI regression (21 test) | Pareho ng beta.7: shell_cr 15, plant_view 18, p3_screens 18, why 6, view 49, sidetab 10, layout 26, ditl_toolbar 42 (binago lang ang test: ⚙ > Engineering tools sa halip na Tools sa rail), infocard 9, events 5, forcelist 7, ui_audit20 15, abcbar 4, lookonly 8, panel_sync 12, plant_click 10, faceplate 1, ditl_pagelink 61, ditl_sim 24. Ang values_layout at check_panel ay pareho pa rin ng dati (sira / mabagal na mula pa beta.6). |
| Screenshots | Home, Plant view, Logic ABC / DITL, Library, Training, ⚙, Tools sa 1440 × 900, 1280 × 800 (touch), 800 × 1280 (touch), 390 × 844 (touch); 4 na theme; 0 page error, walang lumalampas sa screen. |

- **Hindi nasubok:** tablet / exe / apk ng user.
- **Status:** ipinush bilang Beta.

## 3.2.0-beta.9 — Force ulit mula sa Inputs list, malinaw na VIEW | RUN, paliwanag ng LN para sa operasyon
- **Problem (user, 2026-10-23 2:10 ~ 2:15 PM PHT):** "dami ko na rin hindi nafoforce pero sa lumang version na-foforce ko naman sila"; "may mga features na sa RUN lang gumagana at sa VIEW hindi ... sa VIEW nagagawa mo lahat maliban lang sa simulate / force / control, malinaw dapat ang hiwalay na function ng dalawa"; paliwanag ng LN / F(X): walang fixed na scenario (150 MW), kailan at paano nagbabago, AUTO at MANUAL. Training: huwag galawin.
- **As Found:**
  - Engine force: pareho ang v2.4.0 at 3.2.0 (sinubok ang bawat force row ng bawat sheet sa dalawa; parehong resulta). Ang sanhi ay itsura: sa 3.x hindi na ipinapakita ang mga row ng Inspector (Digital / Analog inputs, Setpoints, Timers, COS · manual values, Signals to force, From other sheets); 2 grupo lang ang nasa side Inputs list, at ang analog input ay walang field na matatype-an.
  - VIEW: naka-lock ang BUONG Inspector (pati tabs, ✕, Edit table, F(X) page), pero HINDI naka-lock ang faceplate (A / M / R, SV / MV) sa panel, sa Plant view at sa hiwalay na Plant view window ng PC.
  - I/O list at F(X) button: nasa VIEW lang, nawawala sa RUN.
  - F(X) paliwanag: may "150 MW snapshot" sa S1-LN3 at S1-LN5; walang sinasabi kung kailan nagbabago ang input at ano ang epekto ng AUTO / MANUAL.
- **Work Done (walang binago sa logic, engine at drawing; Training hindi ginalaw):**
  - **Side Inputs list** (`app.js` `inBuild`): lahat ng grupo ng 2.4.0 Inspector ulit (Digital, Analog, COS · manual values, Setpoints, Timers, Signals to force, From other sheets), may filter at nakatiklop na pamagat; ang analog input ay may number field ulit. Ang FORCE / Release ay ang mismong row ng Inspector (parehong engine path).
  - **Iisang patakaran ng VIEW | RUN** (`src/ui/shell/viewlock.js`, bago): VIEW = tingin, trace, search, info card, Why?, tabs, F(X) page, I/O list, trend range; naka-lock ang FORCE, switches, values, A / M / R, SV / MV, Engineering buttons, Bad signal. Pindot sa naka-lock = mensahe "Press RUN". Kasama ang Plant view window ng PC. Itsura: dashed / malabo ang naka-lock (nababasa pa rin ang value), may note sa itaas ng Inputs list at banner ng panel.
  - I/O list at F(X) button nasa RUN din (`app.css`); Plant view chips naka-scroll sa isang hilera.
  - **F(X)** (`src/ui/fx/fx-ops.js`, bago; `fx.js`): bawat isa sa 91 table ay may **In operation** (start-up, load up / down, shutdown, trip: ano ang ginagawa ng input at output), **AUTO / MANUAL** (AUTO, MANUAL, force manual, BU-CMD, tracking) at **Reading the curve** (awtomatikong basa ng hugis mula sa mga point: patag na bahagi, tumataas / bumababa, gaano kalakas bawat unit; sumusunod sa edit). Tinanggal ang fixed na 150 MW sa S1-LN3 / S1-LN5.
- **As Left (sinubok sa built html, headless Chrome):**

| Test | Ano ang nakita |
|---|---|
| Force harness (luma vs bago) | Pareho ang resulta ng bawat force sa v2.4.0 at beta.9. |
| `view_run.js` (bago) | VIEW: tabs, F(X) page gumagana; FORCE at A/M naka-lock na may mensahe. RUN: A/M gumagana, type 333 sa AI0258 = 333, ABC-007 may 7 grupo, FORCE 1 sa M.3131 = 1, Release gumagana, I/O list / F(X) nakikita. Balik VIEW: naka-lock ulit. |
| `plant_view.js` | Plant view window ng PC sa VIEW: M naka-lock; sa RUN: M / MV / A gumagana (in-update ang test: RUN muna). |
| `fx_page.js` | Pasado; 91 / 91 table may In operation at AUTO / MANUAL; walang "150 MW" sa general text. |
| `layout.js` | Pasado (banner "controls locked", nababasa ang value). |
| `npm test`, `home_training.js`, UI regression | Pasado. `values_layout` pareho ng beta.8 (19 sheet, lumang isyu ng puwesto ng value label, hindi galing sa beta.9). |
| Screenshots | ABC-007 VIEW / RUN, Inputs list, mensahe, faceplate, F(X) About sa 1440 × 900, 1280 × 800, 800 × 1280, 390 × 844; walang lumalampas, 0 page error. Search, info card, Library, DITL sa VIEW: gumagana. |

- **Hindi nasubok:** tablet / exe / apk ng user; ang DITL page ay may sariling VIEW | RUN (hindi binago).
- **Status:** ipinush bilang Beta.
