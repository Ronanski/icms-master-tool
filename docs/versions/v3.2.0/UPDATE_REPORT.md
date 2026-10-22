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
