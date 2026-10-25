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

## 3.2.0-beta.10 — Live Training: kusang natse-tsek ang start-up checklist mula sa logic, cold → sync 4.5 MW → 150 MW
- **Problem (user, 2026-10-23 4:08 PM PHT):** "since may check list sa cold startup, auto check sya if nagawa mo na sa logic lahat ... hanggang sa sync 4.5 MW initial load, to load up to 150 MW". Proposal https://claude.ai/artifact/D7vFKoog3SF3AYaaVXyvCs, pinili: "Oo, gawin buong takbo".
- **As Found:** ang tsek sa Training ay naka-save lang sa browser; walang kinalaman sa logic. Natapos ang PR-OPE-5002 sa Solid firing (walang sync at load up). Bug na nakita habang ginagawa: ang listahan ng faceplate (`AN.fpFind`, `src/ui/hmi/hmi.js`) ay ginagawa nang isang beses lang; kapag tinawag habang DITL ang nasa screen, nagiging walang laman at hindi na bumabalik (walang faceplate na mahahanap hanggang reload).
- **Work Done (walang binago sa logic, engine at drawing; binabasa lang ang logic):**
  - `src/ui/training/live.js` (bago, `window.LS_LIVE`): bawat hakbang ay may uri. **AUTO** = may DCS signal (running memory M.3302 / 3303 / 3304 / 3343 / 3350 / 3353 / 3400 / 3412, mode / SV / MV ng faceplate, PV sa target, purge, MFT reset, 52G1). **FIELD** = walang DCS signal (local valve, gauge). **TCS** = turbine panel. Ang AUTO ay kusang natse-tsek habang RUN at nananatiling tsek (sequence) hanggang Practise: Cold start o Clear all ticks. Sa VIEW walang natse-tsek. Ang procedure tag (LCV-MU1110, FCV-FW1130-2) ay hinahanap sa valve → controller table ng plant graphics (`valvectl.js`). Ang MAN station na walang .MAN address (HIC-BM) ay binabasa sa A / M switch ng set input nito.
  - Dalawang bagong section pagkatapos ng Solid firing: **Synchronization and initial load (app)** (8 hakbang: 3600 rpm, 52G1, 4.5 MW, PICHR1003 REMOTE, ICV → CV, 3-element, bypass sarado, hold 45 MW) at **Load up to 150 MW (app)** (10 hakbang: air REMOTE, FIC-CM REMOTE, HIC-BM AUTO, AICFG112 AUTO, 60 / 90 / 120 / 150 MW, EIC-TM AUTO, SH spray AUTO, hold 150 MW). Target: M4 chain ng CHECK, PR-OPE-5002 sec 44, FHI design data.
  - Training screen (`home.js`, `home.css`): chip bawat hakbang (AUTO ✓ / AUTO · waiting / FIELD / TCS); hindi matse-tsek ng kamay ang AUTO; linya na "Now: ..." sa ilalim ng AUTO na hindi pa tapos; live na panel (kanan sa PC, sa ilalim ng hakbang sa tablet / phone): target, value ngayon, Why? (force manual ng drawing), button Faceplate / Sheet; "Assume field steps done"; "Tick field steps" bawat section; note sa VIEW.
  - `hmi.js` `AN.fpFind`: ginagawa ulit ang listahan kapag nagbago ang sheet list; hindi itinatago ang walang laman.
- **As Left (sinubok sa built html, headless Chrome):**

| Test | Ano ang nakita |
|---|---|
| `live_training.js` (bago) | 681 hakbang: 88 AUTO, 540 FIELD, 53 TCS; lahat ng signal ng AUTO ay nahanap. VIEW sa 150 MW: 0 natse-tsek. Buong takbo ng CHECK "full" (cold → coal → bypass → sync → 150 MW, ~3 min): 67 AUTO kusang natse-tsek; Sync 8 / 8, Load up 10 / 10. Ang hindi natse-tsek ay mga hakbang na hindi ginagawa ng CHECK chain (hal. biasing damper 100 %, fan damper 0 %, 4 burner; ang chain ay 2 burner) at nakalista sa test. Live panel, disabled AUTO box, "Assume field steps done" (FIELD / TCS lang). |
| `home_training.js` | Pasado (46 section, 681 hakbang, "Tick field steps"). |
| `view_run`, `fx_page`, `plant_view`, `layout`, `hmi_op`, `why`, `faceplate`, `force_manual` (68 / 0), `npm test`, `npm run check` | Pasado / SAME. |
| Screenshots | Training (section 19 / 45 / 46, live panel, VIEW) sa 1440 × 900, 1280 × 800, 800 × 1280, 390 × 844: walang lumalampas, 0 page error. |

- **Hindi nasubok:** tablet / exe / apk ng user; ang pagtsek ng bawat AUTO hakbang na hindi dinadaanan ng CHECK chain ay sa mismong pindot ng operator (parehong signal, hindi pa sinubok isa-isa).
- **Status:** ipinush bilang Beta.

## 3.2.0-beta.11 — F(X): operational effect (Sa HMI, Kapag mali / sira, Try it)
- **Problem (user, 2026-10-23 4:28 ~ 4:46 PM PHT):** "assume na may power plant basic knowledge kami ... paano sya ipapaliwanag sa hindi DCS engineer"; "ok ung existing, pero parang may kulang pa"; "more on operations effect or function". Card: "Lahat ng tatlo".
- **As Found:** ang About ng bawat table ay may What / From / To / Why / In operation / AUTO-MANUAL / If you change it / Reading the curve, pero walang sinasabi kung ano ang makikita sa HMI, ano ang mapapansin kapag mali o sira ang input, at walang paraan para subukan at basahin ang epekto sa planta.
- **Work Done (walang binago sa logic, engine, drawing at mga curve):**
  - `src/ui/fx/fx-hmi.js` (bago): sa 91 table, **On the HMI** (aling value sa graphics / faceplate ang gumagalaw), **If it is wrong or the input fails** (sintomas sa planta, para sa troubleshooting), at ang epekto kapag tumaas / bumaba ang output.
  - `fx.js` **Try it**: slider sa input; ipinapakita ang output at isang pangungusap: "At 30 % the table gives 0.92. If the input goes up from here: ... If it goes down: ...". Sumusunod ito sa edit ng table; kapag patag ang curve, sinasabing walang epekto. Kasabay na gumagalaw ang tuldok sa chart at ang "Try an input" box.
- **As Left (sinubok sa built html):** `fx_page.js` pasado (91 / 91 may bagong rows; S1-LN3 sa 30 % = 0.92, "speeds the feeders up"); `view_run`, `layout`, `home_training`, `npm test` pasado. Screenshots ng S1-LN3 at S2-LN3 sa 1440 × 900, 1280 × 800, 800 × 1280, 390 × 844: walang lumalampas, 0 page error.
- **Hindi nasubok:** tablet / exe / apk ng user.
- **Status:** ipinush bilang Beta.

## 3.2.0-beta.12 — RUN na walang Start ▾ = boiler patay (cold), hindi na MSP 75
- **Problem (user, 2026-10-23 4:46 PM at 8:10 PM PHT):** "bakit pag pindot ko ng RUN may value ang MSP"; "patay pa naman ang boiler mo, di mo pa iniistart diba?"
- **As Found (itinama sa beta.13):** kapag RUN nang walang napiling Start ▾, ang per-loop model (`plant.js`: PV = gitna ng range + epekto ng MV, hiwa-hiwalay bawat controller) ang nagbibigay ng PV. MSP = PV ng PIC-COBM; sa MV 50 % = 75 kg/cm2 = gitna ng PT-MS1002 0 ~ 150. Hindi ito estado ng planta. (Ang unang sabi ko na "para sa flow compensation" ay mali.)
- **Work Done (walang binago sa logic, engine at drawing):** `src/analog/ui/trace.js`: ang pindot ng RUN (top bar o ribbon) nang walang starting state ay naglo-load ng **Cold** (pareho ng Start ▾ Cold: drum 0 kg/cm2, walang apoy, fans patay, controllers LOCAL + MANUAL). May mensahe sa status bar. Ang API na `AN.viewSet` (gamit ng mga test) ay hindi binago.
- **As Left (sinubok sa built html):** bukas ang app → RUN: start state `plantCold`, MSP 0.0 kg/cm2, load 0.0 MW, drum level 8 mm, FW 0.2 T/H, 0 page error. Regression pasado: `view_run`, `why`, `forcelist`, `lookonly`, `layout`, `home_training`, `ditl_selected`, `ditl_sim`, `ditl_toolbar`, `plant_view`, `live_training` (in-update: ang HICDO1012 / FCV-DO1012 ay FIELD dahil walang .MAN at A / M switch sa drawing).
- **Hindi nasubok:** tablet / exe / apk ng user.
- **Status:** ipinush bilang Beta.

## 3.2.0-beta.13 — Reset = wala nang starting state; tamang sanhi ng MSP 75
- **Problem (user, 2026-10-23 8:40 PM PHT):** "bakit nag-average sa 75 kung 0 naman talaga ... kung plant model talaga, 0 dapat yan from start"; humingi ng paliwanag ng cold start, normal operation bawat load at ng relasyon ng MSP / MSF / RHP / coal / MW / RH temp.
- **As Found:** ang 75 ay galing sa per-loop model (PV = gitna ng range kapag MV 50 %), hindi sa compensation. Pareho ang dahilan ng furnace pressure 600 mmH2O, drum level −422 mm at O2 6.25 % bago mag-Start. Pagkatapos ng Reset, nananatili pa rin ang dating starting state (hal. 150 MW), kaya hindi Cold ang sumunod na RUN: MSP 150.
- **Work Done:** `src/analog/ui/interaction.js`: tinatanggal na ng Reset button ang starting state, kaya ang RUN pagkatapos ng Reset ay Cold (beta.12 `coldIfNone`). Walang binago sa engine (sinubukan ang pagbabago sa `plant.js`, pero hindi nito naayos ang MSP; ibinalik). Dokumento para sa user: https://claude.ai/artifact/LCoqZbmKCfogMUyUHX356J.
- **As Left:** 150 MW + RUN = MSP 122.6, 151.5 MW → Reset → RUN = Cold, MSP 0.0, 0.0 MW. `reset.js` (51 sheet, 0 differ), `view_run`, `layout`, `home_training`, `plant_view` pasado.
- **Hindi nasubok:** tablet / exe / apk ng user. Natitira: sa VIEW bago mag-Start, may pekeng value pa rin ang per-loop model (nakatago bilang —).
- **Status:** ipinush bilang Beta.

## 3.2.0-beta.14 — Yugto A: source ng bawat loop (walang steam = walang PV)
- **Problem (user, 2026-10-23 9:16 ~ 9:51 PM PHT):** "halimbawa ABC-017 ... since walang steam, dapat walang ma-generate na PV ito kahit anong SV MV mo"; "per loop mode, pipili ka kung anong load (MW)"; "Sige simulan mo na plan A". Plano: https://claude.ai/artifact/8dGKf8dcXkhxERHSYcNnzZ, mapa ng loop: https://claude.ai/artifact/T85z4EWPPAUFsbtSAtLRmG.
- **As Found (sinubok sa 3.2.0-beta.13, Cold, loop sa MANUAL MV 0 → 100 %):** ABC-017 sootblower 0.3 → 48.3 kg/cm2; ABC-028 diesel oil header 15.3; ABC-030 aux steam 9.6 → 15.0; ABC-032 condensate flow 380 → 400 T/H; ABC-051 HP bypass outlet 357.5 °C; ABC-034 gland steam 185 °C; ABC-053 turbine oil 54 °C. Ang per-loop model ay gumagawa ng PV mula sa MV lang. Ang unit model ay hindi sumasaklaw sa mga loop na ito. Nananatiling "running" sa Cold ang FA blower, condensate pump at seawater pump (galing sa 150 MW snapshot).
- **Work Done (walang binago sa logic at drawing; plant model lang):**
  - `src/analog/engine/source.js` (bago): ang source ng bawat loop ayon sa mapa ng loop: walang medium = PV sa ibaba ng range o ambient (mul), hindi lalampas sa pressure ng source (cap: sootblower, aux steam, oil), hindi gumagalaw ang tank level kapag patay ang pump (hold). Ang source ay galing sa unit model (MSP, reheat, bypass flow, turbine, coal) at sa running memory ng motor sa ABC (M.3302 / 3303 / 3308 / 3309 / 3350 / 3351).
  - Loop study (Start ▾): 45 / 60 / 90 / 120 MW. Nakatayo ang boiler sa load na iyon (MSP, steam flow, reheat at MW ay galing sa 02.png at 4.PNG at sa linya ng unit model), at ang bawat loop ay sumasagot sa sarili nitong MV.
  - Field equipment (Start ▾): Diesel oil pump START / STOP (DITL-31, walang signal sa ABC). Ang "Assume field steps done" ng Training ay nagsisimula rin dito.
  - Cold: nakahinto na rin ang FA blower A / B, CP A / B at seawater pump A / B / C (PR-OPE-5002 pre-start). Warm / Hot: tumatakbo ang FA blower A, CP A at SWP B / C.
  - `plant.js`: hindi na napupunta sa "pin" mode ang loop na hawak ng source sa ibaba (dati: hindi na bumalik ang aux steam sa 10.2 pagkatapos ng Cold). Ang Cold ay nagsisimula sa steady state ng bawat loop, hindi sa PV ng snapshot.
- **As Left (sinubok sa built html, headless Chrome):** `loop_source.js` (bago) ALL PASS: Cold 7 / 7 loop ay 0 o 30 °C kahit MV 100 %; Hot: sootblower MV 0 / 40 / 100 % → 0.3 / 19.5 / 49.1 kg/cm2, MSP 124.5 (hindi lumampas); 150 MW: snapshot values (aux steam 10.2, condensate 380, oil 12.8); Loop study 60 MW: MSP 89.8 (02.png 89.9), sootblower sumusunod sa MV; DO pump patay / buhay: oil header 0.0 / 3.7 kg/cm2.
- **Bug na nakita sa regression (naayos bago i-push):** ang Training cold → 150 MW (CHECK full) ay huminto sa simula: patay ang SWP / CEP / FA blower / DO pump sa Cold, at ang ABC-028 (oil header) at ABC-030 (aux steam) ay hindi umaandar (walang drawn link sa set ng ABC-001C), kaya 0 ang langis ng burners at 0 kg/cm2 ang drum. Ayos: sinisimulan ng cold stage ang SWP, CEP, FA blower at DO pump bago ang fans (PR-OPE-5002); ang ABC-028 / ABC-030 ay kasama na sa AN.unitSheets. Ngayon: 1.2 T/H oil bawat burner, umiinit ang boiler.
- **Regression (huling build):** tests, hmi_op, plant_live, live_training (Sync 8/8, Load up 10/10, 66 / 88 AUTO steps), home_training, reset (0 / 51 sheet ang naiba), unit_trip, view_run, force_manual 68 / 68: lahat PASS. `loaddown` FAILED 3 (HIC-ULD ▼▼ hindi nagbabago ang TARGET MW): pareho sa beta.13, luma na ito, hindi galing sa pagbabagong ito; aayusin sa Yugto C.
- **Hindi nasubok:** tablet / exe / apk ng user. Ang utilities (instrument air, seawater → vacuum, aux cooling water) bilang kondisyon ng mga loop ay nasa Yugto B.
- **Status:** ipinush bilang Beta.

## 3.2.0-beta.15 — Yugto B (bahagi 1): steam table, laki ng boiler, condenser vacuum
- **Problem (plano Yugto B, user 2026-10-23: "hindi mo ba ito pede ireverse calculate?", "Alam ko may tripping mga yan. Di makakastart ng wala yan"):** ang saturation ng drum ay galing sa fit, tantiya ang storage, at hindi kailangan ng turbine ang seawater / condensate.
- **As Found:** fit na Tsat = 100 + 47.1·ln(P+1): 213 °C sa 10 kg/cm2 (steam table 183), 262 sa 30 (235), 294 sa 60 (275); tama lang sa 0 at ~130. Ang turbine ay nai-roll at tumatakbo kahit patay lahat ng SWP at CEP.
- **Work Done (plant model lang; walang binago sa ABC / DITL logic):**
  - `src/analog/engine/steam.js` (bago): IAPWS-IF97 saturation line (Ts(p), P sa kg/cm2 G) at slope nito; gamit ng `unit.js` (water heat-up, pressure raise, sahig ng steam temp), `hmi-op.js` (Warm / Hot), CHECK (`AN.tsat`).
  - Storage, kinuwenta mula sa FHI CFB manual Part 2 Sect 8 Tab 2 WATER WEIGHTS (drum 31.8 t, furnace 74.5, evaporator 14.0, economizer 55.4, SH 75.8, RH 60.1; total 311.5 t): tubig na pinapainit sa cold start (drum sa normal level + furnace + evaporator + economizer) ≈ 160 t + metal (ASSUMED 2 × tubig, c 0.5 kJ/kg °C ≈ 38 t na katumbas) ≈ 198 t → Cw 1508 (200 t) TUGMA. Sa 130 kg/cm2: dh_f/dP ≈ 4.3 kJ/kg bawat kg/cm2 × 90 t + metal = ~500 MJ bawat kg/cm2 / hfg 1130 kJ/kg ≈ 0.44 t = 1590 (T/H)·s → C 1500 TUGMA (6 %). Walang binago sa C at Cw; may ebidensya na.
  - `unit.js` condenser vacuum: tumataas sa 15 min (vacuum pumps, ASSUMED) kapag may SWP (M.3353 ~ 3355) at CEP (M.3350 / 3351), nawawala sa 1 min kapag patay. ROLL tinatanggihan sa < 90 % (mensahe sa TCS panel); turbine na umiikot o may load sa < 60 % = LOW VACUUM → TCS turbine trip (ABC-050 I.0400 TCS-DI1003). Cold = vacuum 0; Warm / Hot / 150 MW = 100 %.
  - Start ▾ Cold mensahe: SWP / CEP / FA blower / DO pump muna bago ang fans.
- **As Left (sinubok sa built html, headless Chrome):** `plant_utilities.js` (bago) ALL PASS: Tsat 100.0 / 183.3 / 275.4 / 330.0 °C; Cold roll tinanggihan ("walang vacuum ang condenser"), 1 min pagkatapos ng SWP + CEP tinanggihan pa, 20 min tinanggap; 150 MW lahat ng SWP patay → vacuum 14 %, I.0400 = 1, MW 150.6 → 0.0. CHECK cold → 150 MW (buo): 30 → 100 °C sa 1.2 h, 80 ~ 90 °C/h (Fig 1 ≤ 110), cold stage 10 / 10 sa 175 min (dati 201), coal 9 / 9, 150 MW 14 / 14 (MW 150.0, MSF 471, MSP 123.0, MST 538, O2 4.2). Mintis pa rin (luma, pareho sa beta.13): bypass stage RH pressure 6.8 ~ 9.3 (7.5 ± 1.5) at roll stage drum level −150 mm: galing sa operator script ng CHECK (ang HP bypass ay biglang kumukuha ng ~80 T/H pagdating sa 123 kg/cm2), aayusin sa Yugto C.
- **Regression (huling build):** tests, loop_source, plant_utilities, hmi_op, plant_live, live_training, home_training, reset (0 / 51), unit_trip, view_run, force_manual 68 / 68: lahat PASS.
- **Hindi nasubok:** tablet / exe / apk ng user. Instrument air: walang DCS signal at walang fail position ng bawat valve sa repo: hindi ginawang kondisyon.
- **Status:** ipinush bilang Beta.

## 3.2.0-beta.16 — Yugto C: Training, pagsasanay sa load change (AUTO at MANUAL)
- **Problem (user 2026-10-23):** "paano automatic na na adjust ng mga parameters para maihold ang demand load at ... para malaman ng user ang tamang paggamit ng manual controls to attain the target load".
- **As Found:** ang Training ay hanggang "Load up to 150 MW" lang; walang pagsasanay sa pagbabago ng load. Sa Training, ang EIC-TM ay "AUTO" ang sabi habang MANUAL ito dahil sa back-up command M.2016 (lahat ng 5 mode net = 1, pero ang hanap sa pangalang EIC-TM.MAN ay 0). Ang `loaddown.js` ay FAIL mula beta.8: hindi pumipindot ng RUN, at ang VIEW ang nagla-lock ng faceplate.
- **Work Done (walang binago sa ABC / DITL logic at sa engine):**
  - `src/ui/training/live.js`: dalawang section: "PRACTICE: LOAD CHANGE IN AUTO" (6 hakbang: CCS AUTO → HIC-ULD ▼▼ 120 MW → MW at coal bumababa nang kusa → MSP 118 ~ 128 hawak ng PIC-COBM → ▲▲ 150 MW → hold 5 min) at "PRACTICE: LOAD CHANGE BY HAND (MANUAL)" (5 hakbang: HIC-BM M, sumusunod ang EIC-TM → EIC-TM 120 MW at tumataas ang MSP → ibaba ang HIC-BM MV hanggang MSP 118 ~ 128 → itaas muna ang boiler master, saka ang turbine sa 150 MW → AUTO ulit). Ang bawat hakbang ay tumi-tick lang pagkatapos ng nauna. Ang mode ng MAN station ay mula sa mode nets (`AN.modeNets`).
  - `src/ui/shell/home.js`: button "Practise: 150 MW load change" (Start at 150 MW, linis ng practice ticks lang, bukas ang AUTO practice).
  - `tests/regress/loaddown.js`: RUN muna (test lang).
- **As Left (sinubok sa built html, headless Chrome):** `training_practice.js` (bago): AUTO 100000 → ▼▼ 110000 → 20 min 111100 (MW 120.1, MSP 121.7, coal 73.3) → ▲▲ + 20 min 111111; MANUAL 10000 → EIC-TM 120 MW 11000 (MSP tumaas sa 140.7) → HIC-BM × 0.8 11100 (MSP 120.0) → 150 MW 11110 → AUTO 11111; button: naiwan 1 tick (hakbang 1, tama dahil 150 MW CCS agad). `loaddown.js` ALL PASS (TARGET 120, 138 sa 4 min, 120 sa 10 min, coal 85.2 → 71.8). Screenshot ng Training 1440 at 390 px: maayos.
- **Regression:** training_practice, live_training, home_training (in-update: 48 section / 692 hakbang), loaddown, view_run: lahat PASS. Ebidensya ng laki ng LP bypass (para sa natitirang RH 9.3): flow diagram K1AU3-PD-012 LP bypass line HR-1-006 18" (mula 24" hot reheat) → mga 85 T/H sa 7.6 kg/cm2 sa ~60 m/s: tugma sa model (lpb 0.8 = 84 T/H); ang sobra ay galing sa ~80 T/H na steam ng FIC-CF 10 % (minimum ng script) sa bypass stage.
- **Hindi nasubok:** tablet / exe / apk ng user. Ang 2 mintis ng CHECK start-up chain (RH 9.3 > 9.0 sa bypass stage, drum level −150 sa sync) ay hindi pa naayos.
- **Status:** ipinush bilang Beta.

## 3.2.0-beta.17 — CHECK start-up: ang 3 mintis ng operator script
- **Problem:** sa CHECK (ang awtomatikong operator ng app), mintis ang 2 tseke ng buong cold start-up (luma, mintis na rin sa beta.13): RH pressure 6.8 ~ 9.3 kg/cm2 (7.5 ± 1.5) sa bypass stage, drum level −150 mm sa load up 4.5 → 45 MW. Nakita rin sa buong CHECK panel (hindi ko ito pinatakbo sa beta.15 / 16, mali ko): ang hiwalay na "Bypass system" scenario ay 7 / 8, saturation 114 °C/h (> 110 ng Fig 1), dahil mas matarik ang tunay na steam table sa 30 ~ 60 kg/cm2 kaysa sa lumang fit.
- **As Found:** (1) ang HP bypass SV ay sumusunod agad sa MSP hanggang 123, kaya halos sarado ang HP bypass habang tumataas ang pressure, tapos biglang ~70 T/H pagdating sa 123 → hindi nahabol ng LP bypass (18" line, ~85 T/H sa 7.6 kg/cm2) → RH 9.3. (2) LICBR1001A SV 0 sa load up: ang steam 23 → 157 T/H sa 5 min, nahuhuli ang feedwater → −150 mm. (3) ang operator ay nagbabawas ng apoy sa 100 °C/h lang.
- **Work Done (operator script ng CHECK lang, `src/ui/uat/check.js`; walang binago sa logic, engine at plant model):** (1) sa itaas ng 110 kg/cm2, ang HP bypass SV ay +1 bawat 90 s lang (PR-OPE-5002 "+1 / min"); (2) LICBR1001A SV +50 mm habang load up, balik sa 3-element; (3) bawas apoy sa > 90 °C/h, dagdag sa < 80.
- **As Left:** buong cold → 150 MW sa CHECK: lahat ✓ (cold 10 / 10, coal 9 / 9, bypass 8 / 8 sa 101 min, roll 11 / 11, 150 MW 14 / 14). `check_panel.js byp` PASADO 8 / 8.
- **Regression:** check_panel (lahat ng 17 CHECK scenario + share), live_training, training_practice, home_training, loop_source, plant_utilities, hmi_op, plant_live, unit_trip, reset (0 / 51), view_run, force_manual 68 / 68, loaddown, tests: lahat PASS.
- **Hindi nasubok:** tablet / exe / apk ng user.
- **Status:** ipinush bilang Beta.

## 3.2.0-beta.18 — VIEW / TRACE audit (bahagi 1)

**Problem:** Sinuri ko ang VIEW / TRACE mode sa app gamit ang tunay na click, kasama ang screenshot (ABC-010 → ABC-011 at pabalik, Plant view, DITL-56).

**As Found (mga bug):**
1. Bago pumili ng Start, ang ABC page sa VIEW ay nagpapakita ng default ng drawing: MSP 75, drum level −566.6 mm, drum pressure 125, LICBR1001 out 25 %. Walang plantang ganito.
2. Kapag pinindot ang ↩ Back pagkatapos sumunod sa trace sa ibang sheet, nawawala ang napiling block at ang trace.
3. Sa card ng napiling wire, may linyang "null", at ang pangalan ay "net 39" lang.
4. Mali ang hint sa status bar habang VIEW: "click a digital input = 1 / 0" at "Paused: ... press Run", na hindi ginagawa ng VIEW.

**Work Done:**
1. Pagbukas ng operator sa ABC page, o kapag Reset, COLD na agad ang planta (boiler patay: MSP 0, FW 0), gaya ng RUN at Start > Cold. Iniiwan ang session na may naka-save na force o input.
2. Ibinabalik ng ↩ Back ang napili at ang trace.
3. Ang wire na walang sariling tag ay pinapangalanan ayon sa block na nagpapatakbo nito ("F(X) out") o sa pinanggalingan nito ("from ABC-010 (circle DP)").
4. May sariling VIEW hint na sa status bar. Hindi na lumalabas ang Paused hint habang VIEW.

Engine at logic: walang binago.

**As Left:**
- VIEW bago Start: LOAD 0.0, MSP 0.0, DRUM 8.2, FW 0.2.
- Back: bumabalik sa ABC-010 na napili pa rin ang LICBR1001.
- Ang wire card ay nagpapakita ng "from ABC-010 (circle DP)".

**Status:** Nakita pero hindi pa naaayos (susunod na bahagi):
- Sa Cold, ang furnace pressure ay ~200 mmH2O kahit patay ang fans. Dapat ~0.
- Ang PV ng HP bypass PICMS1006 ay nananatiling 122 habang 0 ang PT-MS1006.
- Sa VIEW, nakatago ang mga value sa drawing kahit naka-ON ang Values / Wire values (para sa proposal).

## 3.2.0-beta.19 — Furnace pressure sa Cold; pagbukas na Cold para sa operator lang

**Problem:**
1. Sa Cold (patay ang lahat ng fan), ~200 mmH2O ang furnace pressure (PT-FG1085) sa Plant view.
2. Sa beta.18, ang "Cold sa pagbukas ng ABC page" ay umaandar din sa mga test na script ang nagpapatakbo. Dahil dito, nagbago ang panimula ng mga test, at bumagsak ang isang timer test: ABC-013 #31 TPS, 298 imbes na 300 s.

**Work Done:**
1. `unit.js`: kapag walang ID fan at walang hangin, bukas ang furnace sa stack, kaya 0 mmH2O. Mabilis itong bumababa (5 s) at hindi na sumusunod sa 65 s ng draft loop. Kapag tumatakbo ang ID fan, walang binago sa model.
2. Ang Cold sa pagbukas ay umaandar lang kapag may tunay na click o key ng operator, o kapag naibalik ang ABC page mula sa huling pagbisita.

**Sinubok:**
- Cold: furnace pressure 0.0.
- CHECK: IDF trip 7/7, cold 10/10, coal 9/9, bypass 8/8, roll 11/11, 45 → 150 MW 14/14.
- Tunay na click: pagbukas at Reset = MSP 0.

**Hindi isinama:** ang PV ng HP bypass PICMS1006 sa Cold ay nananatiling 122. Ang dahilan ay ang SELECT CIRCUIT ng drawing: binabasa nito ang 0 bilang nawalang transmitter at hinahawakan ang huling value (user rule v1.20.34). Sinubukan kong bigyan ng 0.1 % ang transmitter, pero bumagsak ang roll at ang 45 → 150 MW (MSP 111, drum −289). Kaya ibinalik ko ito. Kailangan itong suriin kasama ang operator script.

## 3.2.0-beta.20 — Plant chip (pili B); inalis ang UAT at CHECK sa app

**Problem (user 2026-10-24):**
- "dpt common tools yn s simulate": ang pagpili ng plant model at MW ay nakatago sa Start ▾ ng Plant view. Pinili ng user ang B: isang chip katabi ng VIEW | RUN.
- "remove uat test completely sa app mismo saka yung check sa tools".

**Work Done:**
- **Plant chip** (`app.js` buildPlantChip, `app.css`): katabi ng VIEW | RUN sa lahat ng page. Nakasulat dito ang estado (PLANT, Unit · Cold / Per-loop · 75 MW / OFF). Kapag pinindot, may panel ng pagpipilian:
  - Plant model OFF / Per-loop / Unit.
  - Per-loop: kahit anong MW mula 45 hanggang 150, tapos Set. Dati, 45 / 60 / 90 / 120 lang.
  - Unit: Start Cold / Warm / Hot / 150 MW, at Target load (TCS target).
  - Sa VIEW, naka-lock ito (ABC VIEW, o DITL na hindi nagsi-simulate).
  - Mula sa DITL page, ini-load muna ang ABC engine, tapos bumabalik sa DITL.
- **Start ▾ → TCS / Field ▾**: natira rito ang TCS panel at ang field equipment / valves. Ang mga dating button ng starting state ay nasa page pa rin pero nakatago, kaya walang nasira sa mga gumagamit nito (Home, mga test).
- **UAT at CHECK**: wala nang button o panel sa app. Ang mga runner ay nananatili para sa automated test lang (`navigator.webdriver`): check_panel, live_training, scenario tests.
- Mga hint at mensahe: "Plant ▾ (top right)" na ang nakasulat, hindi na "Start ▾ in the PLANT VIEW". Hindi ginalaw ang mga tala sa Training (user: huwag munang galawin ang Training).

**Sinubok:**
- Tunay na click sa 1440 × 900, 1280 × 800, 800 × 1280 at 390 × 844: Per-loop 75 MW (MW 75), Unit Cold (MW 0), 150 MW (151.5), OFF, at bumalik sa ON.
- Naka-lock ang panel sa VIEW.
- Walang page error.

**Tala:** sa 1280 × 800, ang alarm line sa top band ay pinaiikli ("No activ…") dahil sa chip. Buo pa rin ang NO ALARM pill.

## 3.2.0-beta.21 — Training: tunay na Cold, RUN agad, hindi na nagiging VIEW

**Problem (user 2026-10-24):** "nagtest ako ng TRAINING. ang hirap nya paganahin. nag-bbug sya ... irrun mo ba. pag bumalik ka ng logic magiging VIEW. tapos iRRUN mo."

**As Found (sinubok ko bilang baguhan, tunay na click):**
- Kapag DITL ang bukas na page, ang "Practise: Cold start" ay pumipindot ng Cold bago pa na-load ang ABC. Walang nangyari: MSP 75, drum level −567, bed 850 °C, turbine 3600 rpm.
- Pagkatapos ng Practise, naiiwan sa VIEW. Ikaw pa ang hahanap ng RUN.
- Ang tag ng isang hakbang (info card) at ang search ay naglalagay sa VIEW kahit tumatakbo ang simulation (2.1.0-beta.8 "a search is a LOOK"). Kaya humihinto ito tuwing sumisilip ka.

**Work Done:**
- `home.js`: hinihintay muna ng Practise buttons na ma-load ang ABC, saka nagse-set ng Cold o 150 MW, at agad nagra-RUN (`AN.runOn`, `trace.js`).
- `boot.js` lookOnly: kapag TUMATAKBO ang simulation, nananatili itong tumatakbo kapag sumilip ka (tag, search, info card). Kapag hindi tumatakbo, VIEW pa rin gaya ng dati.
- Tala sa Training: wala nang "Start ▾" at "CHECK".

**As Left (ebidensya):** bagong test `tests/regress/training_start.js` ALL PASS (DITL → Practise: drum 0, bed 30 °C, turbine off, MSP 0, RUN; tag HICHR1002A habang RUN = RUN pa rin). Pasado rin: lookonly, view, home_training, view_run, shell_cr.

**Status:** Beta. Ang bagong isang-screen na Training (proposal https://claude.ai/artifact/FnjLxFZYXnFqc9fjvRdHWJ) ay hinihintay ang pili ng user.

## 3.2.0-beta.22 — Cold: drum level, FW flow at steam temp na natira mula sa 150 MW

**Problem (user 2026-10-24, may screenshot ng ABC-010 sa Cold):** "na-reset ko na, cold na, may value pa rin? ... drum lvl at fw flow. baka sa iba ganyan din."

**As Found:**
- FW flow 0.2 T/H sa Cold kahit sarado ang lahat. Ang BFWP A / B (ABC-010 M.3343 / M.3344) ay naiwang tumatakbo mula sa 150 MW snapshot. May naiwan ding +0.15 T/H na offset ang FT-FW1007-2.
- Drum level gumagapang (8 → 10 mm sa 10 min). Habang nagse-settle ang Cold, ang feedwater PV ay 153 T/H pa (snapshot) at nadagdag ito sa tubig ng drum.
- SH / RH steam temp (TICBR1130 / 1140 / 1150, TICMS1004, TICHR1002 / 1002A) ay 99.97 °C sa Cold, sa halip na 30 °C. Ito ang saturation ng 0 kg/cm2, pero 30 °C pa ang tubig.
- Tama at sinadya: mga flow na 0.1 % ng range (hal. FICFA1043 0.07 T/H, FICCD1120 0.4 T/H). Ang 0 ay binabasa ng SELECT CIRCUIT bilang lost signal (user rule v1.20.34). Ang tank level (deaerator, hotwell) ay tubig na naiwan, tama.

**Work Done:**
- `hmi-op.js`: BFWP M.3343 / M.3344 = 0 sa Cold. Ang drum level model at ang mga transmitter nito ay ibinabalik kung saan sila pagkatapos ng compensation, kaya hindi na nadadagdagan ng tubig habang nagse-settle (hindi ito oras ng planta). Sa Warm / Hot, BFWP-A tumatakbo.
- `plant.js`: ang offset ng transmitter ay unti-unting nawawala papunta sa ibaba ng range (flow, pressure; hindi ang drum level).
- `unit.js`: ang steam temp ay hindi lalampas sa temperatura ng tubig sa drum (kapag kumukulo na, saturation pa rin).
- CHECK chain at `loop_source` test: ang operator ang nagsi-start ng BFWP-A bago punuin ang drum (PR-OPE-5002). Dati, umaasa sila sa BFWP na naiwang tumatakbo. Sa `loop_source`, ang HP bypass spray TICMS1022 ay kumukuha ng tubig sa BFWP (ABC-050 M.0702 ALL BFWP STOPPED).

**As Left (ebidensya):** Cold pagkalipas ng 10 min: FW 0.0 T/H, drum level 4.6 → 8 mm (steady), steam temp 30 °C. CHECK 17 / 17 scenario PASADO (Cold → 150 MW buo 17 / 17, trips, load, shutdown, bottle-up). ALL PASS: live_training, loop_source, reset, training_start, unit_trip, training_practice, home_training, tests.js.

**Status:** Beta. Hindi pa nasubok sa tablet / EXE ng user. Hinihintay ang pili ng user sa Training workspace mockup (https://claude.ai/artifact/M9TD6DVtS8XmfwrBpo4UVX).

## 3.2.0-beta.23 — Training dock: ang gabay na start-up katabi ng logic, dumadaan sa tunay na DITL interlock

**Problem (user 2026-10-24):** "sa training, ang hirap ng palipat lipat na screen, ang hirap din imonitor ng actual logic"; "si training, another workspace sya na connected pa rin sa current status ng mga logics (DITL & ABC)"; "di ba may interlock yan s kada equipment? na-icoconsider ba ito sa start-up training?". Pinili ang mockup (https://claude.ai/artifact/M9TD6DVtS8XmfwrBpo4UVX), tapos "Ituloy hanggang 150 MW sa DITL" (card).

**As Found:**
- Ang gabay (Cold → 150 MW) ay nasa sariling screen. Kapag lumipat sa Logic, nawawala ang gabay; kapag lumipat sa DITL, humihinto ang RUN.
- Ang mga motor sa gabay ay sinisimulan sa pag-force ng running memory. Hindi dumadaan sa DITL interlock (permissive, trip, MFT).
- Kapag ON ang iisang mundo (ABC + DITL), hindi umaabot ang start-up sa coal: hindi ma-reset ang MFT, hindi sumisindi ang burner, nag-MFT pagkapatay ng huling burner, at iba pa (listahan sa Work Done).

**Work Done:**
- **Training dock** (`src/ui/training/dock.js`, `dock.css`): ang gabay ay panel sa kanan (PC / tablet landscape) o sa ibaba (tablet portrait), may main values, lamp ng kagamitan, step card, interlock ng motor mula sa DITL drawing, faceplate ng hakbang at values na babantayan. Ang app ay gumagana sa tabi nito at tuloy ang RUN (ABC ↔ DITL hindi na humihinto: iisang RUN).
- **Gabay sa tunay na DITL** (iisang mundo ON habang nasa dock): ang START / STOP ng motor, ang purge, ang BURNER ON / OFF, ang discharge valve ng feeder ay pindot sa DITL drawing. Ang pindot ay binibilang sa scan ng simulation (hindi sa millisecond), kaya gumagana kahit ×300.
- **Mga mali na nakita habang pinapatakbo ang buong start-up sa DITL, at inayos** (ebidensya sa `UNLINK_AUDIT.md`):
  1. MFT hindi ma-reset: ang BOILER EMERGENCY TRIP P.B. (N.C.) ng DITL-03F ay 0 kapag hindi pinipindot. Ngayon: N.C. = 1 kapag hindi pinipindot (kasama ang "NOT OFF P.B." ng DITL-09 at DITL-21A).
  2. Kusang natapos ang purge sa malamig na boiler: ang furnace thermocouple ay naiwan sa 933 °C (150 MW). Ngayon sumusunod sa bed temperature.
  3. Hindi sumisindi ang burner: walang model ang oil valve limit switch at flame detector (DITL-16 / 18). Ngayon may field device model (valve gumagalaw ilang segundo, flame kapag bukas ang dalawang valve at may igniter). Ang ABC-004A M.3410 ~ M.3417 (oil valve closed) ay nakakabit na sa DITL-16.
  4. Feeder B at C nag-trip pagkapatay ng huling burner: wala silang furnace temperature permissive (M.2504 / M.2505). Nakakabit na (iisang furnace para sa A / B / C).
  5. MFT "PRIMARY AIR FLOW L.L." (PA < 200 T/H) kapag coal na lang: ibinaba ng gabay ang PA damper sa 10 % (~100 T/H). Ngayon: PA damper ang humahawak ng 280 T/H (PR-OPE-5002 "280 T/H = With Bed"), SA damper para sa O₂; ang huling burner ay papatayin lang kapag PA ≥ 220 T/H; ang coal sumusunod para manatiling > 700 °C ang bed.
  6. Steam pressure 140 ~ 172 kg/cm² bago ang bypass: ang blow-off lang (~13 T/H) ang naglalabas ng steam habang nagko-coal. Ngayon ang "Bypass sa serbisyo" ay BAGO ang coal (PR-OPE-5002: bypass servicing bago ang solid fuel firing): hawak ng HP bypass ang 50 kg/cm².
  7. Feeder C ayaw umandar: ang pindot ng START ay binitawan at pinindot ulit nang walang scan na nakakita ng bitaw, kaya walang bagong pulse. Ngayon may isang scan na bitaw bago ang bagong pindot.
  8. MFT "FURNACE TEMP. INADEQUATE FOR COAL FIRING": binabawasan ng bypass coach ang coal kahit lumalamig ang bed. Ngayon hindi binabawasan sa ilalim ng 730 °C, dinadagdagan sa ilalim ng 720 °C.
  9. Main steam 600 °C sa 150 MW: sarado ang spray water shut-off valve (DITL-32 / 33 / 35). Ngayon inilalagay ng gabay sa AUTO MODE (PR-OPE-5002 "servicing MS and RH desuperheater"), hinihintay na bumukas, at inuulit ang A → R ng spray controller kapag ibinalik ng drawing sa MANUAL.
- Field I/O sheet na walang gate (DITL-16 / 18) ay hindi na pass-through (ang OPEN command ay hindi na nagpapasindi ng CLOSED).
- DITL-43 row 12 ay hindi na nakakabit sa sarili niyang output (dati hindi kailanman makaka-start ang IDF).
- Gabay na WORLD OFF (Training page, walang dock): huminto sa "Furnace pressure PICFG108 sa AUTO" dahil binabasa ang lumang kopya ng M.0205 sa ibang sheet. Ngayon binabasa ang ABC-008 M.0205 mismo (ang sheet ng PICFG108).
- Batch firing: kapag lumalamig ang bed (dahil bukas na ang bypass) at bumaba sa 600 °C, hindi na natatapos ang hakbang. Ngayon tapos ang hakbang sa bed ≥ 600 °C o pagkatapos ng 3 batch (gaya ng CHECK script M4).
- Phone (390 px, dock sa ibaba): nagpapatong ang mga value. Ngayon 4 na column at mas maliit na font.
- Test `lookonly`: in-update sa iisang RUN (ang search habang Simulate ay hindi na humihinto sa Simulate, gaya ng ABC mula beta.21).

**As Left (ebidensya):** buong gabay Cold → 150 MW na ON ang iisang mundo, ×300, 6 sa huling 8 na buong run ay umabot sa 150 MW (MSP 123, main steam 541 °C, drum level ±30 mm) at sa Practice nang walang MFT. PASADO: ditl_sim, ditl150, interlock, lookonly, training_dock, training_start, home_training, training_practice, at ang check panel M1 ~ M5 (buong start-up at shutdown ng CHECK script, hindi binago).

**Status:** Beta. Ang gabay na WORLD OFF (Training page) ay umabot din sa 150 MW at Practice. Bukas pa: 2 sa 8 na run ay huminto sa CCS handover (~80 MW: bumabalik sa MANUAL ang boiler master at turbine master pagkatapos ilagay sa AUTO). Hindi pa nasubok sa tablet / EXE ng user.

## 3.2.0-beta.24 — CCS handover (~80 MW): bumabalik sa MANUAL ang HIC-BM at EIC-TM

**Problem (bukas mula beta.23):** sa gabay Cold → 150 MW (Training dock, iisang mundo ON), 2 sa 8 run ay huminto sa ~80 MW: ang boiler master HIC-BM at turbine master EIC-TM ay bumabalik o nananatili sa MANUAL, walang FM event sa log.

**As Found (ulit gamit ang `tools/training/guide_fullrun.js`, trace ng ABC-001C M.2013):**
- Ang M.2013 (BU-CMD ng HIC-BM) ay 1 kahit steam flow 297 ~ 313 T/H (> 230). Ang input na 1 ay **M.0255 = "PICMS1002 MV > 5 %"** (MS blow-off valve PCV-MS1001, ABC-013 → ABC-001C). Tama ang drawing: bukas na blow-off = back-up command, MANUAL ang boiler master (CLAUDE.md 10), at kasunod ang EIC-TM (M.2016 = NOT boiler master AUTO).
- Bakit bukas ang blow-off sa load: ang SV nito ay "HP bypass SV + 5" lang habang nasa bypass stage. Kapag natapos ang hakbang "Main steam pressure 123" bago umabot sa 123 ang HP bypass SV, naiiwan ang blow-off sa SV 117 ~ 123. Sa 80 MW (MSP 123) bukas ito nang 67 ~ 76 % (nakita: SV 123, PV 122.4, MV 76.4).
- Ang ibang run: SV 128, pero umakyat ang MSP sa 128 ~ 135 sa 45 ~ 80 MW dahil ang boiler-follow coach ay **pataas lang** ang HIC-BM (walang pagbaba kapag mataas ang pressure); bumukas ang blow-off at hindi na nagsara.
- Habang inuulit: 1 run nag-MFT sa 45 MW (bed 690 → 617 °C, huminto ang 3 feeder: DITL-19 row 16 / ABC-027 M.2504 < 700 °C). Ang load coach ay sumusunod sa pressure lang, walang bantay sa bed (ang bypass coach ay mayroon mula beta.23).
- Ang gabay ay hindi bumabalik sa naunang hakbang: kapag bumalik sa MANUAL ang HIC-BM / EIC-TM pagkatapos ng hakbang nila, nakatayo ang card sa "HIC-ULD sa AUTO" na walang paliwanag.

**Work Done (`src/ui/training/guide.js`, gabay lang; engine at drawing hindi binago):**
1. Hakbang "HP bypass sa REMOTE … sa 45 MW": dagdag ang **PICMS1002 A, SV 128** (4.PNG 148.8 MW: BLOW-OFF A, SV 128, MV 0), at tapos lang ang hakbang kapag sarado ang blow-off (M.0255 = 0).
2. Boiler-follow coach (`bf`): ibinababa na rin ang HIC-BM kapag MSP > 125 (hanggang −0.5 % bawat 10 s), pero hindi kapag bed < 730 °C; +0.5 % kapag bed < 720 °C.
3. Load coach (`load`): coal +1 kapag bed < 720 °C, hindi binabawasan sa ilalim ng 730 °C (gaya ng bypass coach).
4. Hakbang "HIC-BM sa AUTO": sinasabi na ng card kung bukas ang blow-off (M.0255) o ang HP bypass (M.0709), at tumatakbo ulit ang `bf` coach.
5. Ang mga hakbang EIC-TM, HIC-ULD, PICFG108 at "Hawakan ang 150 MW" ay may `req`: kapag ang HIC-BM o EIC-TM ay naibalik sa MANUAL ng drawing, bumabalik ang gabay sa hakbang na iyon (pindot ulit ng A kapag M.2013 / M.2016 = 0, CLAUDE.md 10).
6. `tools/training/guide_fullrun.js`: nagpi-print din ng PV / SV / MV / mode ng PICMS1002 at PICMS1006 kapag huminto.

**As Left (ebidensya, WORLD ON ×300, buong gabay):** pagkatapos ng ayos 1 ~ 5: **6 sa 6 na buong run** umabot sa 150 MW at sa Practice, walang MFT, walang hinto sa HIC-BM / EIC-TM (MSP 123.0, PICMS1002 sarado, M.0255 = 0). Bago ang ayos (beta.23): 1 sa 2 run huminto sa HIC-BM (M.0255 = 1, blow-off MV 76 %); sa gitnang bersyon (ayos 2 ~ 5 lang) 1 sa 6 huminto pa rin dahil sa SV 123 ng blow-off, kaya idinagdag ang ayos 1. PASADO: training_dock, training_start, training_practice, home_training, live_training, tests.js (0 FAIL), `npm run check` SAME.

**Status:** Beta. Hindi pa nasubok sa tablet / EXE ng user.

## 3.2.0-beta.25 — Isang utak (ABC + DITL laging iisang mundo) at ladder view (preview)

**Problem (user 2026-10-24):** "si DITL at ABC ay dapat interconnected ... most of the permissives ay nasa DITL"; "tanggalin mo na rin ang button na ABC plus DITL ON, mula ngayon isang utak na yan"; "ladder sample" para makapagdesisyon kung gagawing ladder ang DITL (sa actual DCS nila, naka-ladder lahat).

**As Found:**
- Ang iisang mundo (`src/world/world.js`) ay OFF bilang default (CLAUDE.md rule 7 ng 2026-10-15) at may button na "ABC+DITL ON / OFF". Sa OFF, ang "FROM DITL" ng ABC ay manual input, kaya hindi nararamdaman ng ABC ang mga permissive at trip ng DITL. Ang Training dock lang ang nagbubukas nito.
- Walang ladder view. Ang DITL logic ay nasa netlist ng app (gate, input row, output row, FF, timer).

**Work Done:**
1. `src/world/world.js`: laging ON; wala na ang button (at ang `ls-world` na naka-save). Ang `WORLD.set(false)` ay para na lang sa test na sumusubok ng isang DITL sheet nang mag-isa. `dock.js`: hindi na nagbubukas / nagsasara ng mundo. Event log: bagong paliwanag. CLAUDE.md rule 7 pinalitan.
2. `src/ui/ladder/` (bago): ladder ng nakabukas na DITL sheet, gawa ng app mula sa parehong logic (hindi iginuhit): bawat output row = rung na may coil; AND = sunod-sunod na contact, OR = parallel, NOT = N.C. contact; FF / timer / counter / net na ginagamit sa maraming lugar = internal relay (FF1, T1, R1) na may sariling rung. Live katabi ng drawing (berde = energized). Button "Ladder" sa DITL ribbon.
3. Test `tests/regress/ladder.js` (bago): ang power flow ng bawat rung ay ibinabangga sa value ng engine sa parehong net. `tests/regress/world.js`: "default ON, walang button".

**As Left (ebidensya):**
- Ladder: 241 / 241 DITL sheet naisalin, bawat output row may rung; 1,928 random na estado ng input (8 bawat sheet), 20,552 rung: **0 hindi tugma** sa engine. DITL-29A SEAWATER PUMP A (1): 14 rung, 8 internal relay, live habang ▶ Run.
- Nakita sa ladder: DITL-29A rung "OUTPUT row 17 SEAWATER PUMP A TRIP" ay may contact na walang pinagmulan sa drawing ("net 2", OR ng M.1153/1163). Susuriin sa CHECKLIST 0.4 (A/B/C/D).
- Bilis sa PC (ABC RUN, 150 MW): parehong 60 fps (frame 17 ms) ON at OFF; 95 % ng frame ≤ 25 ms (OFF 22 ms); ikot ng mundo ~9 ms bawat 0.2 s.
- PASADO: ladder, world, ditl_sim, training_dock, ditl150, why, events, lookonly; abcbar, audit230, blocks_io; interlock ALL PASS (54 min, mag-isa; ang unang subok ay nag-crash ang browser dahil sabay-sabay ang mga test sa iisang makina, hindi dahil sa beta.25: ABC-010 ay 162 s sa beta.24 at 170 s sa beta.25, parehong pasado).

**Status:** Beta. Ang ladder ay preview: hinihintay ang desisyon ng user kung gagawin sa lahat (CHECKLIST 0.3). Hindi pa nasubok sa tablet / EXE ng user (bilis ng iisang mundo sa tablet).

## 3.2.0-beta.26 — Page link ng Training: dinadala ka sa mismong kokontrolin

**Problem (user 2026-10-25):** "ang page link (sa start-up training) ay hindi ka dinadala kung saan ka talaga magko-control"; "hindi recognized kung ano ang dapat i-monitor at kontrolin".

**As Found (takbo ng Cold → 150 MW sa Training dock, 64 hakbang):**
- (a) Ang hakbang na may faceplate ay nagbubukas ng buong ABC sheet sa Fit: hindi naka-zoom, hindi naka-select ang block, blangko ang Inspector (hal. hakbang 8 FICCD1120, ABC-032).
- (b) Ang equipment B / C (SWP-B, CEP-B, BFWP-B, FAB-B) ay binubuksan sa DITL sheet ng A: ang B / C ay nakatagong kopya pa ng sheet ng A.
- (c) Mukhang nahuhuli ang link ng feeder; sinuri: tama ang mapa ng app (M.3402 → DITL-19 #C), ang pagbasa ng probe ang maaga. Hindi mali ng app.
- (d) Burner: ang BURNER ON ay pinipindot sa DITL-09 row 8, pero ang binubuksan ay ang ABC-003A (oil flow).
- (e) Hakbang na pang-field o paghihintay lang: hindi lumilipat ang gitna. Tama: walang kokontrolin sa DCS.
- (f) "Bantayan sa hakbang na ito" ay iisang listahan bawat yugto: sa condensate recirculation ay drum level / FW flow ang ipinapakita.

**Work Done:**
- `src/analog/ui/links-canvas.js`: `AN.showTag(tag)` = buksan ang ABC sheet ng tag, i-zoom (240 unit), i-center, i-select ang block (Inspector) at i-flash.
- `src/ui/training/dock.js` `goStep`: motor START → DITL sheet nito; pindot sa DITL (BURNER ON DITL-09 row 8, discharge valve DITL-20 row 5) → ang sheet na iyon, naka-select ang row; faceplate → `AN.showTag`. "Bantayan": una ang PV / SV ng mga tag ng hakbang at ang bilang ng tumatakbong motor ng hakbang, tapos ang mga value ng yugto.
- `src/ui/training/guide.js`: ang BURNER ON at ang feeder discharge valve ay may `dg` (sheet at row ng pindot).

**As Left:** `AN.showTag` sinubok sa 7 tag (FICCD1120 ABC-032, LICCD1110A, PICFG108, HIC-BM MAN, FICDO1043A, PICMS1006, LICBR1001B): bawat isa nasa tamang sheet, naka-select ang block (PID / MAN), naka-zoom. PASADO: training_dock, training_start, home_training; `npm run check` SAME.

**Status:** Beta. Bukas: (b) hanggang maging tunay na sheet ang A/B/C/D (CHECKLIST 0.2). Ang takbo ng "tao" (mouse click lang sa Training) ay tumatakbo pa; ang resulta ay isusulat dito.

## 3.2.0-beta.27 — Interlock box: ang susunod na motor lang ang buo

**Problem (takbo ng "tao" sa Training, mouse click lang):** sa hakbang "Simulan ang unang seawater pump", tatlong buong interlock box (SWP-A, B, C) ang lumalabas; humahaba ang card at ang huling "Field operator" button ay nasa ilalim ng screen.

**Work Done:** `src/ui/training/dock.js`: ang buong interlock (mga row, "Field operator", "Simulan pa rin") ay para lang sa unang motor ng hakbang na hindi pa tumatakbo; ang tumatakbo na ay isang linya "✓ TUMATAKBO NA", ang iba ay isang linya "SUSUNOD".

**As Left:** hakbang 2: SWP-A buo (3 row), SWP-B at C isang linya ("SUSUNOD"). PASADO: training_dock, training_start.

**Nakita rin (para sa CHECKLIST 0.2):** ang interlock ng SWP-B (`DITL-29A #B`) ay nagsasabing "SEAWATER PUMP **A** REMOTE MODE SELECTED" at iisang address sa A: ang pag-ayos ng REMOTE ng A ay nagpa-✓ din sa B. Ang B / C ay hindi pa tunay na hiwalay na sheet.

**Status:** Beta.

## 3.2.0-beta.28 — BFWP-A START naka-lock sa Training (analog na interlock row)

**Problem (takbo ng "tao" sa Training, mouse click lang, beta.27):** hakbang 1 ~ 11 pasado; hakbang 12 "Simulan ang BFWP": ang START BFWP-A ay naka-lock kahit pinindot ang "Field operator: ayusin ang 1 contact". Ang takbong "via code" ay dumaan dito dahil diretsong tinatawag ng script ang START (hindi dumaraan sa lock ng button).

**As Found:** DITL-23A row 12 "PT-FW1115-A BFWP A SUCTION PRESSURE > 1.5 kg/cm2" ay ANALOG na input (comparator ng drawing). Pagkatapos ng Field operator: value 2.25 kg/cm2, comparator out = 1 (OK sa logic). Pero ang `DUI.rowVal` (basa ng interlock box at ng lock ng START) ay bumabasa ng analog net mismo (laging 0), kaya ✕ at naka-lock.

**Work Done:** `src/ui/shell/ditl.js` `D.rowVal`: ang analog na input row ay "1" kapag 1 ang comparator ng drawing na bumabasa nito. Hindi binago ang engine (`simulate`).

**As Left:** pagkatapos ng Field operator: row 12 = 1, kulang sa interlock ng BFWP-A = wala; START BFWP-A hindi na naka-lock. PASADO: ditl_selected, ditl_sim, training_dock.

**Status:** Beta. Itutuloy ang takbo ng "tao" mula sa simula sa beta.28.

## 3.2.0-beta.29 — Burner card: tamang paliwanag ngayong laging magkadugtong ang ABC at DITL

**Problem (takbo ng "tao" sa Training):** ang card ng burner A / B / C / D ay nagsasabing "Buksan ang dalawang supply oil valve", pero walang ganoong button: sa iisang mundo, ang DITL light-off sequence (DITL-10 / 13) ang nagbubukas ng oil valve pagkatapos ng BURNER ON.

**Work Done:** `src/ui/training/guide.js`: text ng 3 card ng burner: SA damper at oil FCV sa ignition → BURNER ON (DITL-09) → ang DITL ang magpapasok ng igniter, magbubukas ng oil valve at magsisindi → oil flow.

**As Left:** PASADO: training_start. **Status:** Beta.
