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

## 3.2.0-beta.30 — BURNER ON: may interlock box at "Field operator" na rin

**Problem (takbo ng "tao" sa Training):** hakbang 28 "Sindihan ang burner A": ang BURNER A ON ay pinindot pero hindi sumisindi. Walang interlock box ang BURNER ON sa card, kaya hindi makita ng tao kung bakit. Ang takbong "via code" ay pumasa dahil sinet ng script ang mga field contact nang direkta.

**As Found:** DITL-12 (burner A light off) kulang: row 4 PERMISSION TO START BURNER A ← DITL-07 out 10 = 0 (field: PSL-PA1043-A1 ATOMIZING AIR PRESS. NOT LOW, PSH-DO1043-A1 DIESEL OIL SUPPLY PRESS. NOT HIGH); row 6 IGNITER A IN INSERT POSITION ← DITL-10 out 14 (sumusunod sa permission).

**Work Done:** `src/ui/training/dock.js`: ang action na may DITL na pindot (`dg`, hal. BURNER ON) ay may interlock box rin (DITL-12 out 7 BURNER READY) na may "Field operator: ayusin ang … contact", at naka-lock ang button habang may ✕ (gaya ng START ng motor).

**As Left (pindot gaya ng tao: Field operator → ignition → BURNER A ON isang beses):** burner A in service (DITL-12 out 19 = 1, M.3412 = 1), oil 0.87 T/H, tumuloy ang gabay. PASADO: training_dock.

**Status:** Beta. Itutuloy ang buong takbo ng "tao" sa beta.30.

## 3.2.0-beta.31 — Coal sa coal stage: bumababa na kapag mainit na ang bed

**Problem (takbo ng "tao" sa Training, beta.30):** sa hakbang 44 (patayin ang mga burner), drum pressure 141.2 kg/cm2 sa 0 MW, steam flow 219 T/H, coal 36 T/H (FIC-CF 30 %), bago pa ang bypass servicing.

**As Found:** ang `o2` coach ay nagtataas ng coal hanggang 30 % habang bed < 730 °C at tumatakbo ang 3 feeder; walang nagbabawas mula hakbang 40 hanggang 44 (ang bypass coach ay mula hakbang 45 pa).

**Work Done:** `src/ui/training/guide.js` (`o2` coach): coal −1 % bawat minuto (hanggang 15 %) kapag bed > 760 °C at steam > 65 T/H (PR-OPE-5002: 40 ~ 55 T/H sa yugtong ito).

**As Left:** takbo hanggang hakbang 47: pinakamataas na drum pressure 124.0 kg/cm2 (dati 141.2). PASADO: training_start.

**Bukas (para sa audit ng plant model, CHECKLIST 0.5):** sa bypass stage ay 157 ~ 160 T/H ang steam sa 123 kg/cm2 bago ang turbine (procedure: 40 ~ 55 T/H), dahil kailangan ng coal na mapanatili ang bed > 700 °C habang PA 280 T/H. Susuriin sa model (bed heat balance), hindi sa coach.

**Status:** Beta.

## 3.2.0-beta.32 — CCS handover: ang firing ay puwedeng ibaba hanggang bed 712 °C

**Problem (takbo ng "tao" sa Training, beta.31; hakbang 1 ~ 58 pasado):** hakbang 59 "Boiler master HIC-BM sa AUTO": HIC-BM A pinindot 6 na beses, nanatiling MAN. 80 MW, main steam 129.9 kg/cm2, bed 728 °C, O₂ 9.3 %.

**As Found:** main steam > 128 (SV ng MS blow-off) → bukas ang blow-off → M.0255 → M.2013 BU-CMD → HIC-BM MANUAL (tama ang drawing). Hindi ibinaba ng boiler-follow coach ang HIC-BM dahil ang patakaran ng beta.24 ay "walang pagbaba ng firing sa ilalim ng 730 °C"; ang coal trip ng drawing ay 700 °C.

**Work Done:** `src/ui/training/guide.js` (`bf` coach): pagbaba ng firing pinapayagan mula bed 712 °C; dagdag na +0.5 % kapag bed < 708 °C.

**As Left (takbo ng "tao", mouse click lang sa Training, beta.32):** UNANG BUONG TAKBO na umabot sa 150 MW: hakbang 1 ~ 63 pasado, nasa hakbang 64 "Hawakan ang 150 MW": load 149.7 MW, main steam 122.8 kg/cm2, steam 471 T/H (4.PNG 472.7), coal 86.8 T/H, drum level +19 mm, O₂ 3.7 %, walang page error. Sa unang takbo ay 553 °C ang main steam pagdating sa hakbang 64 (alarm AI0433 HIGH). **Ikalawang takbo (beta.32, mouse click lang): TAPOS ANG START-UP**: pasado ang hakbang 64 (5 minutong hold: 147 ~ 153 MW, MSP 118 ~ 128, MST ≤ 545 °C, drum ±150 mm, O₂ 3 ~ 6 %), umabot sa Practice (hakbang 65), walang trip, walang page error; nag-settle ang main steam sa loob ng limit. Video ng takbo naibigay sa user sa chat. PASADO: training_start.

**Bukas (audit ng plant model, CHECKLIST 0.5):** O₂ 9.3 % sa 80 MW (sobra ang hangin; air demand ng drawing sa REMOTE) ang nagpapalamig sa bed.

**Status:** Beta.

## 3.2.0-beta.33 — Training isang screen: tamang tag na kokontrolin at babantayan bawat hakbang (CHECKLIST 0.4)

**Problem (user 2026-10-24: "hindi recognized kung ano ang dapat i-monitor at controllin, hindi recognized ang tamang valve, instrument, tags"):** ang "Bantayan sa hakbang na ito" ay walang pangalan at unit ("LICCD1110A PV"), may doble, at sa ilang yugto ay hindi ang tamang sukat; ang Bantayan ay natatakpan ng mga faceplate.

**As Found (audit ng 68 hakbang ng dock: tag sa text, faceplate na ipinapakita, Bantayan):**
- 5 hakbang na may binanggit na tag na hindi ipinapakita (FIC-CF sa #36 / #58, HS-COAL sa #59, HIC-MWRL sa #62, PIC-COBM sa #66): mga tag na binanggit lang bilang paliwanag; ang kokontrolin ng hakbang ay nasa card. Walang binago.
- Bantayan: "<tag> PV" lang, walang pangalan at unit; doble (PICFG108 PV + Furnace pressure, PICMS1006 PV + Main steam press, FICFA1071 PV + Total air); yugto ng tubig (hakbang 6 ~ 11): walang hotwell level at condensate flow; hakbang 14 (diesel oil pump): furnace pressure at hangin ang ipinapakita.
- Ang Bantayan ay nasa ilalim ng 2 ~ 3 faceplate (kailangang mag-scroll).

**Work Done (`src/ui/training/dock.js`, `guide.js`; hindi binago ang engine):**
- Bantayan: pangalan mula sa controller (hal. FICFW1007 "DRUM LEVEL CONTROL (FEED WATER FLOW CONTROL)" → "Feed water flow"), tag, unit mula sa range ng faceplate, at SV; MAN station = output (MV %).
- Hindi na inuulit ang sukat na nasa listahan ng yugto (furnace pressure, drum level, FW flow, deaerator level, coal, O₂, main steam press).
- Yugto ng tubig: hotwell level (LICCD1110A) at condensate flow (FICCD1120) idinagdag.
- Hakbang 14: faceplate at Bantayan PICDO0005 (diesel oil pump outlet pressure).
- Ang Bantayan ay nasa itaas ng mga faceplate (nakikita agad kasama ang card).

**As Left:** audit ulit: lahat ng Bantayan may pangalan / tag / unit (hal. "Primary air flow · FICFA1071 [T/H]", "Feed water flow · FICFW1007 [T/H]", "Hotwell level [mm]"). PASADO: training_dock, training_start, home_training.

**Patunay (takbo ng "tao", `human_run.js`, mouse click lang, beta.33):** Cold → 150 MW → Practice (hakbang 65), pasado ang hold sa 150 MW, walang trip, walang page error.

**Status:** Beta.

## 3.2.0-beta.34 — DITL A/B/C/D: tamang address ng machine B / C / D (CHECKLIST 0.2, hakbang 1)

**Problem (user 2026-10-24):** ang mga DITL sheet na iisa para sa A ~ D (SWP, CEP, BFWP, burner, feeder ...) ay nagsasama-sama ng address; ang B / C / D ay nakatagong kopya ng sheet ng A at ang address nila ay hinuhulaan.

**As Found:** 36 shared sheet. Sa talaan ng 543 row na may address sa kopya B / C / D, 313 lang ang tugma sa I/O list / memory list. Sanhi: unang grupo lang ng address ang binabasa ("O.0088/408 O.0728/1048" → burner C / D = address ng A), hindi binabasa ang 2-titik na dulo ("I.0085/88/8B"), at ang listahang kulang sa isang row ay hindi kinukumpleto mula sa ibang row.

**Work Done:** `src/world/world.js`: lahat ng grupo ng address; 2 ~ 4 na titik ng dulo; kumpletong listahan mula sa drawing; mas mahabang listahan ng TAG / service column; ang nagpapalit na row (PAF LOP A / B). Bilang ng makina: hindi binago. Ebidensya: `UNLINK_AUDIT.md` beta.34.

**As Left:** 544 / 544 address ng B / C / D tugma sa I/O list / memory list. PASADO: world, ditl_sim, ditl150, ditl_selected.

**Status:** Beta. Susunod (hakbang 2): bawat kopya bilang sariling page na may tamang letra sa drawing; link ng Training para sa B / C / D.

## 3.2.0-beta.35 — DITL A/B/C/D: bawat makina ay sariling page (CHECKLIST 0.2, hakbang 2 ~ 3)

**Problem (user 2026-10-24):** "iduplicate nalang, ireconstruct sa kapareha para hindi sama-sama ang mga address sa iisang logic sheet"; sa Training, ang SWP-B / CEP-B / BFWP-B ay binubuksan sa sheet ng A.

**As Found:** ang machine B / C / D ng 36 shared sheet ay nakatagong kopya lang (`WORLD.inst`), walang page; ang drawing at ang Inputs panel ay laging nagpapakita ng A ("SEAWATER PUMP A", "M.1150/1160 M.1170"); ang link ng Training ay nagtatanggal ng "#B".

**Work Done:**
- `src/digital/parts/01-parse-build.js` `cur()`: ang piniling makina ng sheet (`S.mach`) ang ipinapakitang sheet: sariling input, value at address.
- Header ng DITL sheet (`src/ui/shell/ditl.js`): mga button **A | B | C | D** para sa sheet na iisa para sa A ~ D; pamagat "DITL-29A · B · SEAWATER PUMP B (1)".
- Text ng drawing at ng Inputs / Outputs panel sa kopya: tamang letra at sariling address (`WORLD.showText`: "M.1150/1160 M.1170 SEAWATER PUMP A START P.B." → "M.1160 SEAWATER PUMP B START P.B.").
- Training dock: ang START ng motor, ang BURNER ON at ang "DITL-xx #B ↗" ay bumubukas sa page ng makinang iyon; sa hakbang na may ilang motor, ang susunod na hindi pa tumatakbo (pangalawang SWP → SWP-B).

**As Left:** DITL-29A B: header, drawing ("SEAWATER PUMP B START P.B.", M.1160) at panel tama; pagkatapos ma-START ang SWP-A sa Training, bumubukas ang page ng SWP-B. Ang pamagat sa ribbon (itaas) ay sa makina na rin (hal. "SEAWATER PUMP B"). Tests: world, ditl_sim, ditl_selected, training_dock, ditl_pagelink pasado. Takbo ng tao (`tools/training/human_run.js`, mouse click lang, ×300): Cold → 150 MW → Practice (hakbang 65), walang trip, 0 page error; ang hinto ng beta.34 sa hakbang 33 (burner C / D) ay hindi naulit.

**Status:** Beta.

## 3.2.0-beta.36 (2026-10-25) — CHECKLIST 0.3: ang MV ay umaabot na sa valve sa likod ng MCC PANEL

**Problem:** (user) "may block na MCC na pinutol ang MV at di na nakarating sa VALVE".

**As Found:** ABC-054 (RH blow-off PICHR1391) at ABC-055: PO → MCC PANEL → M (motor operator) → valve. Hinahati ng bilog na "M" ang wire, kaya walang pinanggagalingan ang valve: laging 0, madilim ang wire mula M hanggang valve. Sa 81 valve / actuator ng ABC, ito lang ang dalawang walang driver. Ang INVERTER (coal feeder, screw cooler) ay dulo ng drawing (walang valve sa likod) at ang plant model ay kumukuha ng MV sa station, kaya hindi putol ang physics.

**Work Done:** `src/analog/engine/compile-step.js`: ang valve na nasa ilalim ng MCC PANEL / INVERTER box at walang driver ay sumusunod sa output ng box (LINK; ang galaw ay sa stroke ng valve). Bagong test `tests/regress/mcc_valve.js`.

**As Left:** lahat ng valve / actuator ng ABC ay may driver. ABC-054 RUN: PICHR1391 MANUAL 40 % → MCC 40 → valve 40 %; MV 0 → sumasara ang valve (20 % pagkalipas ng 4 s). Walang binago sa plant model. Tests: mcc_valve, `npm test`, world, plant_live, ditl150, loaddown pasado.

**DITL (bahagi rin ng 0.3):** sa DITL, ang MCC ay nakaguhit sa mismong sheet (hal. DITL-30: MOR-P1503A START → seal-in sa MCC box → MIR-P1503A RUNNING, out row 58 → input row 1, link "30-58"); ang ibang sheet ay may motor / MOV / SV model (`src/digital/parts/03-models.js`). Sinubok: DITL-30 na naka-ON ang SWP A at REMOTE, pindot START → RUNNING 1, STOPPED 0 (`tests/regress/mcc_valve.js`). Walang binago sa DITL.

**Status:** Beta. CHECKLIST 0.3 TAPOS.

## 3.2.0-beta.37 (2026-10-25) — CHECKLIST 0.5: Training sunod sa PR-OPE-5002 at FHI Fig. 2; bagong "bawal" test; TCS kulang pa

**Problem:** audit ng engine at plant model para sa start-up (steam 160 T/H sa bypass, MST 565 °C sa 120 MW). User: "bakit wala ang vacuum up, gland steam, auxiliary steam, turning gear", "hindi genuine ang test mo", "wala ka pang turbine model at TCS".

**As Found (beta.36):**
- Coal at 123 kg/cm2 BAGO ang roll. Ang PR-OPE-5002 (8437, 10003 ~ 10021) at FHI Fig. 2 COLD STARTUP: roll 6 h sa 61 kg/cm2, sync 7 h, coal 8.6 h, burners off ~60 % load 11 h.
- Burner order A → B: ang procedure (5471, 5660) ay A → D (diagonal), tapos B at C pagkatapos ng 30 min.
- Vacuum tumataas kahit walang aux steam: ang procedure ay VACUUM UP (6512) pagkatapos ng aux steam (5708, MS > 12 kg/cm2) at gland sealing (6118).
- MST 565 °C sa 120 MW: TICBR1150 (inner) MANUAL hanggang CCS dahil hindi naabot ang PV ≥ SV − 5; ang outer TICMS1004 (I 1371 s) ay nag-windup nang i-cascade nang maaga.
- Initial load 5 minuto lang: ang procedure (9080 ~ 9123) ay 45 minuto sa cold, hanggang LP exhaust hood < 52 °C.
- Ang test (trace at takbo ng tao) ay pinatatakbo ng sariling coach ng Training: umaabot sa 150 MW kahit kulang sa SOP. Hindi nito nahuli ang vacuum / aux steam.
- Turbine = black box (off → roll → sync → load). Sa ATS criteria (310SC90-776 page 3) 5 lang sa ~40 criteria ang nasa app (`docs/tcs/ATS_CRITERIA.md`).

**Desisyon (hindi itinanong, batay sa reference):** pagkakasunod ng Training = PR-OPE-5002 at FHI Fig. 2: oil (A → D, tapos B / C sa 15 kg/cm2) → aux steam / gland / vacuum → bypass servicing → MS 61 kg/cm2 → roll → sync → initial load 45 min → 45 MW → coal (batch 400 ~ 450, feeder A 600, C 650) → 123 kg/cm2 → CCS → burners off sa ≥ 90 MW, bed > 700 → 150 MW.

**Work Done:**
- `src/ui/training/guide.js`: bagong pagkakasunod (68 hakbang; Practice = #65), coach `ofire` (oil fire sa bypass, sliding pressure pagkatapos ng sync), coach `swap` (palit oil → coal sa 45 MW, feedforward sa steam), `load` coach isang hakbang kada minuto, spray: inner SV sinusundan ng operator hanggang steam ≥ 85 % at outlet ±5 °C bago ang cascade, initial load 45 min.
- `src/analog/engine/unit.js`: ang vacuum ay tumataas lang kapag may aux steam (drum > 12 kg/cm2).
- `tests/regress/plant_utilities.js`: SWP + CEP walang aux steam → walang vacuum; may aux → roll tinanggap.
- Bagong `tests/regress/sop_bawal.js`: bawat aksyon ng operator ay sinusubukan nang MAAGA (kulang ang kondisyon), ang app ay dapat tumanggi; ang batayan ay PR-OPE-5002, DITL at ATS criteria, hindi ang coach.
- Bagong `docs/tcs/ATS_CRITERIA.md`: talaan ng ATS criteria laban sa app.

**As Left:**
- Trace Cold → Practice (beta.37, kasama ang 45-min initial load): walang trip, 150 MW MSP 122.8, MSF 471, O₂ 3.7 %, bed 833 °C; MST pinakamataas 555 °C habang load up (dati 565 ~ 575; SV 541). **FAIL laban sa alarm list** (`alarm-list.zip` 20160912, TE-MS1004-1: H 548, HH 555): lampas sa H alarm, bukas pa.
- `sop_bawal.js`: 10 PASS (BFWP walang deaerator level, SAF bago IDF, PAF walang lube oil, feeder habang MFT, burner walang purge, roll walang vacuum, sync bago roll, load up bago sync), **7 FAIL**: roll tinanggap kahit malamig ang boiler (ATS 1.3 / 1.4), at walang model ang turning gear (1.19), bearing oil (1.15), gland seal (1.10), LP exhaust hood (1.12), CV chest warming (1.33 / 2.81), rub check (2.3).
- Pasado: `tests.js`, `training_dock.js`, `unit_load.js`, `plant_utilities.js`.

**Status:** Beta. CHECKLIST 0.5: boiler side TAPOS; turbine side BUKAS → turbine + TCS model mula sa ATS Sequence / Criteria (desisyon ng user 2026-10-25: push muna beta.37, tapos TCS).

## 3.2.0-beta.38 (2026-10-26) — CHECKLIST 0.6: turbine at TCS model (ATS step 0 ~ 7)

**Problem:** user 2026-10-25: "Paano naging field step ang vacuum at auxiliary ... wala ka pang turbine model at TCS", "hindi genuine ang test mo".

**As Found (beta.37):** ang turbine ay isang pindot lang (ROLL → 3600 rpm sa 30 min, walang criteria). Sa ATS criteria (310SC90-776 page 3) 5 lang ang nasa app. Ang `sop_bawal.js` ay 7 FAIL. Sa Cold run: ang steam sa roll ay MS 462 °C at RH 474 °C (ATS: MS 400 ~ 420, RH 415 ~ 425 sa malamig na metal), kaya hindi talaga makaka-roll ayon sa ATS.

**Work Done:**
- Bagong TCS model (`src/analog/engine/tcs.js`): lube oil, EH oil, vapour extractor, turning gear (3 rpm), aux steam MV-AS1391 (MS > 12), gland sealing (aux > 7, umiikot, bukas ang vacuum breaker), vacuum up (aux > 10, gland, sarado ang breaker, ejector), LP exhaust hood spray FVCD1904. ATS step 0 HP warming, 1 preparation (CV chest warming 60 min), 2 rub check (200 rpm), 3 acceleration (heat soak sa 1800 / 3600 rpm ayon sa start-up mode), 4 excitation, 5 sync at initial load (3 % / hot 5 %, hold 40 / 15 / 0 min), 6 load up, 7 normal operation. Bawat step ay may step-in (A) at bantay (B, HOLD) mula sa criteria table; ang sagot ng TCS ay ang eksaktong criteria na kulang.
- Steam sa start-up: ang SH / RH outlet ay sumusunod sa FHI SECT_7 Fig. 2 / 3 / 4 (cold 418 °C, warm 430, hot 500 mula roll hanggang transfer; 505 sa 30 %; 541 mula 60 %). Ang SH / RH spray ay hindi puwede doon ayon sa DITL-33 / 35.
- Training: 5 bagong hakbang ng TCS auxiliaries (stage 5) at 8 ATS step (stage 7) kapalit ng isang ROLL; ang coach ng RH biasing damper (reheat 415 ~ 425 °C bago ang roll, PR-OPE-5002 8042); NORMAL OPERATION button sa 45 MW.
- Naayos: (1) MFT sa drum level (−300 mm) nang ilagay ang bypass sa 85 kg/cm² na may SV 61: ang SV ay ang pressure ngayon na, pababa 1 kada minuto hanggang 61; ang oil ay bumababa sa 20 % kapag > 50 kg/cm² bago ang bypass. (2) Load hold ng TCS na nagiging bagong target (huminto sa 18.7 MW). (3) Start hot: RH spray off bago ang transfer (DITL-35).
- Mga test: `sop_bawal.js` (roll / turning gear / aux / gland / vacuum / rub / accel nang maaga, cold boiler, LP hood 95 °C), `plant_utilities.js` (buong pagkakasunod ng auxiliaries), CHECK "M4 roll" (Start hot: ATS HOT mode, initial load 7.5 MW, oras ng acceleration bukod ang HOLD).

**As Left (ebidensya):**
- `sop_bawal.js`: 19 / 19 PASS (dati 10 PASS / 7 FAIL).
- CHECK M4 hot roll → 45 MW: 11 / 11 (may ATS HOLD sa reheat habang acceleration, nakatala).
- PASADO: `plant_utilities.js`, `training_dock.js`, `unit_load.js`, `unit_trip.js`, `training_start.js`, `home_training.js`, `tests.js` (walang FAIL).
- Cold trace (Training, Cold → 150 MW, coach ang pumipindot): walang trip. Roll sa MS 417 °C / RH 423 °C, rub check, 1800 / 3600 rpm heat soak, sync, initial load 4.4 MW hanggang LP hood < 52 °C, load up (may ATS HOLD habang naka-MANUAL ang LP bypass sa pagsara), NORMAL OPERATION sa 45 MW, 150 MW: MSP 122.8, MSF 471, O₂ 3.8 %, bed 833 °C. **MST pinakamataas 555 °C habang CCS load up: FAIL pa rin laban sa H alarm 548 (bukas).**

**Hindi nasubok:** PC / tablet / EXE ng user; takbo ng tao sa bagong TCS step cards; warm start (Fig. 3).

**Status:** Beta. CHECKLIST 0.6: TCS model TAPOS; bukas pa: MST 555 °C sa CCS load up (H alarm 548), direksyon ng RH biasing damper sa model (pagbukas ng RH damper ay nagpapababa ng RHT: susuriin laban sa ABC-020).


## 3.2.0-beta.39 (2026-10-26) — Roadmap 1: tinanggal ang Per-loop, Warm at Hot

**Problem:** sabi ng user: ang Per-loop, Warm at Hot ay "pampahaba ng code, pampagulo" at wala sa spec (`docs/SPEC.md`).

**As Found:** plant chip = OFF | Per-loop | Unit; starting state = Cold | Warm | Hot | 150 MW (chip at Home); Start menu may Loop study 45 / 60 / 90 / 120 MW; may engine ng loop study (`source.js`, `unit.js`) at ng warm / hot start (`hmi-op.js`).

**Work Done:**
- App: plant chip = OFF | Unit; starting state = Cold | 150 MW lang (chip at Home); tinanggal ang Warm, Hot at Loop study buttons.
- Engine: tinanggal ang `anPlantLoop`, `srcLoad`, ang fixed-load branch ng `unit.js`, `anPlantWarm`, `anPlantHot`, at ang 'hot' / 'aux' na start ng `tcsInit`. Walang binago sa turbine / TCS na Cold start, sa logic drawings, o sa ATS mode select (physics ng metal temperature iyon).
- CHECK panel: tinanggal ang "M4 · 45 → 150 MW" (nagsisimula sa Hot); ang coal / byp / roll ay stage na lang sa loob ng buong cold start-up.
- Tests: `loop_source.js` (tinanggal ang Hot at Loop study), `shell_cr.js` (OFF/Unit), `check_panel.js` (listahan).

**As Left (ebidensya):** build + check SAME; `sop_bawal.js` 19 / 19; `shell_cr.js` ALL PASS; `loop_source.js` ALL PASS; screenshot ng Home at plant chip sa PC 1333x833, tablet 1280x800 at 800x1280, phone 390x844 (walang sira, 2 starting state na lang); CHECK panel bumubukas, 12 scenario, walang page error.

**Hindi nasubok:** buong Cold run (`human_run.js`): huminto ang unang takbo sa hakbang 43 (bypass, MSP 35.7, steam flow 0). Itinigil ang paghahambing sa beta.38 sa utos ng user, kaya HINDI pa alam kung dati na ito. PC / tablet / EXE / APK ng user.

**Status:** Beta. Roadmap hakbang 1 TAPOS.


## 3.2.0-beta.39 (2026-10-26) — Roadmap 5: ang bawat "FROM / TO DITL" sa ABC ay page link, may Back

**Problem:** sa ABC, 10 lang sa 233 na sulat na "FROM / TO DITL xx-nn" ang napipindot (yung malapit sa bilog na connector). Ang 223 ay sulat lang. Ang lumang xref layer ay sira sa DITL: hindi nito binabasa ang 3-digit na code (DITL-100 ~ 110) at binubuksan nito ang lumang sheet list, hindi ang item.

**As Found:** `connClick` (bilog lang) at `xref` rect (`links-canvas.js`, regex `DITL[ -]?\d{1,2}`). `dsGoRef` ay nagbabasa ng "100-04" bilang "00-04" (mali). Ang DITL → ABC (FROM / TO ABC-xxx) ay gumagana na (`ditl_pagelink.js`), pero ang ABC ay walang Back pabalik sa DITL (kailangang lumipat sa DITL button).

**Work Done:**
- Ang BAWAT "FROM / TO DITL" na sulat ng 54 ABC sheet (233) ay link: bubukas ang DITL sheet at ang item row (kumikislap). Ang pindot na nasa mismong sulat ay panalo kahit may bilog sa ilalim; ang pindot sa tabi nito ay bilog pa rin. May tuldok na guhit sa ilalim ng sulat para halata.
- Ang sulat na may listahan ("TO DITL 96-18, DITL 97-18, DITL 98-18") ay nagbubukas ng pagpipilian ng page (tulad ng DITL-03A). "FOR S/B LOGIC" = sootblower DITL-80.
- `dsGoRef` ay nagbabasa na ng 3-digit na code. Ang lumang xref ay ABC-xxx na lang (inalis ang DITL na sira).
- DITL → ABC: ang ABC ay may ↩ Back na bumabalik sa DITL sheet (dati wala). Sa phone / tablet na nakatayo, ang Back ay una sa tool row (hindi na nawawala sa kanan).
- Walang binago sa engine, plant model o DITL data.

**As Left (ebidensya):** `tests/regress/abc_ditl_links.js` (bago): desktop = click sa 233 / 233 na sulat (bubukas ang tamang DITL sheet o ang pagpipilian; Back bumabalik sa parehong ABC sheet); tablet at phone = tap sa 80 / 233 (bawat ika-4 at lahat ng listahan); DITL-01 FROM ABC-006 → ABC-006 → ↩ Back → DITL-01. ALL PASS. `ditl_pagelink.js` (lumang link test) ALL PASS; `ditl_sim.js` (Simulate OFF / ON, ABC ↔ DITL) walang FAIL. Screenshot: PC 1440x900, tablet 1280x800 at 800x1280, phone 390x844 (sulat na may guhit, chooser, DITL pagkatapos ng link, Back).

**Hindi nasubok:** PC / tablet / EXE / APK ng user. Hindi pinatakbo ang Cold run (hindi plant model). Ang "null" sa DITL header at ang MSP 75 / drum −566 sa "not started" ay bukas pa (roadmap 2, ibang thread).

**Status:** Beta. Roadmap hakbang 5 (links at Back) TAPOS.


## HMI sample (PR #49, walang sariling numero; nakapatong sa base 3.2.0-beta.39) — Bagong HMI: sample na Air & Flue Gas (roadmap step 6)
- **Problem (user 2026-10-26):** pangit ang kasalukuyang Plant HMI (kopya ng larawan ng control room, 49 / 121 lang ang live sa 007). Gusto ng user ng bagong HMI na sariling graphics; ang snapshot ay gabay lang sa system, flow at linya, at dapat may improvement.
- **As Found:** ang 007 ay larawan (`hmibg.js` 3.7 MB) na may numerong pinapatungan; ang item na walang signal ay nagpapakita ng snapshot value kahit Cold. Maraming instrumento ng 007 ay nasa I/O list lang, walang ABC / DITL logic (backpass gas temps, cyclone, ESP pressures, fan currents, CEMS).
- **Work Done:**
  - `src/ui/plant/hmi2.js` (bago): library ng simbolo (duct na may arrow at dim kapag walang daloy, fan na may run state, damper na umiikot ang blade ayon sa %, data tag, faceplate chip, status lamp, header) at ang screen **AIR & FLUE GAS (new HMI)**. Lahat SVG, walang larawan.
  - `plant.js`: ang screen na may `v2` ay iginuguhit ng `PLANT_V2.draw` gamit ang parehong live link, faceplate at Values list; chip na "Air & Gas · new". Ang lumang 28 screen ay hindi ginalaw.
  - `docs/hmi/HMI_SYSTEMS.md`: listahan ng system at flow ng bagong HMI (14 screen) at mga desisyon sa disenyo.
- **As Left (ebidensya):**
  - LIVE **89 / 89** linked sa bagong screen; walang page error.
  - Click: loop chip PICFG108 / FICFA1071 / HICHR1002A / B = faceplate ng loop; damper MCVFA10531 = FICFA1071, PCDFG10561 = PICFG108A. M sa faceplate (AICFG112) = chip nagiging M.
  - Cold: fans berde (STOP), ducts dim, flows 0, bed temp 30 °C. 150 MW: fans pula (RUN), TAF 594 T/H, O2 4.3 %, furnace −17 mmH2O.
  - `plant_view.js` ALL PASS. Screenshots: PC / tablet landscape 1280 × 800, tablet portrait 800 × 1280, phone 390 × 844.
  - Nakita (plant model, hindi HMI): sa Cold, PIFA1088, PIFA1085, TIFA1086 / 1087 / 1076 / 1077 ay nananatili sa 150 MW na value.
- **Restyle (user: "Ang pangit. Parang gawang bata."):** iginuhit muli ang buong screen sa ISA-101 high-performance style (gaya ng Ovation / 800xA / Yokogawa): gray na background, manipis na orthogonal na linya, doble-linya na duct na may mahinang tint, ISA 5.1 / ISO 10628 na fan / damper / APH / ESP / tube bank, tag sa itaas at puting value box na may unit, faceplate column na may mode box. Naayos din: walang laman ang PV ng faceplate (natakpan ng SV box). Sinubok muli: LIVE 89 / 89, click test (6 faceplate + mode M), `plant_view.js` ALL PASS, screenshots 150 MW at Cold (PC), tablet portrait, phone.
- **Bagong drawing (user: "Gawang bata, kulay lang binago... Do better."):** hindi na recolor: bagong komposisyon na process mimic gaya ng operator station ng tunay na DCS. Title bar + alarm banner + navigation bar (bumubukas ang 008 / 009 / 039 / 038 / 011 / 033), equipment na may shading (furnace cut-away na umiilaw ang bed ayon sa bed temp, drum, cyclone + loop seal, backpass tube banks + louvre dampers, tubular air heater, ESP na may T/R at hoppers, fan na may volute at motor, stack na may CEMS), ducts na may gumagalaw na flow marks, ISA bubble at value sa tabi ng bawat instrumento, controller tag sa tabi ng damper nito, live trend. Sinubok: LIVE 87 / 87, click test (6 faceplate + mode M), nav click 008 = bumukas ang 008, `plant_view.js` ALL PASS, screenshots 150 MW / Cold / tablet portrait / phone. Ang CEMS ay walang DCS tag (007 ay plain text lang), kaya "-----".
- **Professional art (user: "Ok naman ang flow... graphics choice mo... gawang bata pa rin. Wala ka ba taga audit?"):** pareho ang flow, tag at logic; ang art ay sumusunod na sa HMI art spec at symbol library ng project (art audit, PR #51): solid gradient na duct na may maliit na chevron (walang gumagalaw na tuldok), fan + motor na may status band (pula = run, berde = stop), damper na may 3 blade ayon sa tunay na posisyon, furnace at stack na walang glow / brick / guhit, iisang style ng backpass / APH / ESP, label sa labas ng equipment, value #e8eef3 mono, faceplate PV / SV / MV na may outline mode pill (AUT / MAN / CAS), inalis ang walang lamang trend at CEMS box. Nasuri sa 1280x800 (150 MW at Cold), 800x1280 at 390x844.
- **Cutaway (user: "Medyo nalalakihan pa ko... 2d, medyo realistic na may animation... atleast 3 different"; pinili: "yung cutaway muna gawin. temporary"):** 3 proposal (Steel, Cutaway, Thermal) at ang Cutaway ang inilagay sa app, pansamantala. Pareho ang flow, tag, link at faceplate. Mas maliit ang equipment at text; naka-section ang lahat ng equipment; gumagalaw ayon sa live signal: fan (run bit), particle sa duct (fan ng duct), solids sa furnace at cyclone (PAF), usok (IDF), apoy at bed (bed temp). Side panel: combustion, bed temp bar, fan, alarm.
- **3 style + bagong pipe (user: "gawin rin ang steel at thermal as option ng HMI... ayusin ang pag kakagawa ng pipes, parang pinagpatong na rectangle"):** STYLE na pindutan sa ibaba ng screen (CUTAWAY / STEEL / THERMAL, naaalala). Ang mga duct ay tuloy-tuloy na path na may bilugang liko at malinis na tee sa lahat ng style. Sa Cold, abo / madilim ang mga duct at kumukupas ang init ng furnace, cyclone, backpass at APH ayon sa bed temperature.
- **Kumpletong tag at piping (user: "Ang daming kulang na tags, walang descriptions... di kita ang mga internals at externals pipes... flue gas, water, steam... temperature, pressure, flow, level, analyticals, pati ung hydraulic coupling, esp"):** muling iginuhit ang screen ayon sa P&ID PD-051 ~ 054. 109 tag, bawat isa may paglalarawan (lahat naka-link: logic, I/O list, o plant estimate na may tuldok); bed temperature table (18 TC, avg / max / min / rate); bed DP, furnace pressure, drum level at pressure, start-up burner hot SA; cyclone at seal pot; backpass gas temps (RH / SH pass); Ljungstrom APH (PA / SA / GAS sector) na may inlet / outlet T, P, O2; ESP; IDF na may hydraulic coupling (scoop, speed, current); stack CEMS; fan currents; tubo ng tubig at steam at legend ng kulay ng medium (malamig / mainit). Bug na naayos: `PICR1006` (reheat inlet pressure) ay "-----" dahil kinakain ng tag reader ang C ng area code (plant.js `tx`). Nakita (plant model, hindi HMI): walang 150 MW preset ang AI0481 (IDF speed ST-LO1756) kaya 0 sa logic sheet; estimate ang ipinapakita sa HMI.
- **Status:** sample para sa pag-apruba ng style ng user. Hindi pa ginagawa ang ibang screen; hindi pa tinatanggal ang lumang Plant HMI.
