# v3.1.0 — Bagong shell mula sa simula

Base: 3.0.0-beta.8 (branch `claude/design-system-extraction-4dogzg`). UI lang: walang binago sa engine, logic, simulation, kulay ng drawing at sa DCS faceplate box.

## 3.1.0-beta.6 — Group display ng controllers at iisang button system
- **Problem (user, 2026-10-21):** "Yung controller list, kahit ganun lang kalaki ang faceplate, edi mas madami nagkasya. Ito lang ba inayos mo? Dami ko pa nakikita sa mga buttons na hindi professional, ang basic, nakakalito."
- **As Found:**
  - **Inventory ng lahat ng button sa 24 screen:** 43 magkakaibang itsura (taas 25 ~ 34 px, sulat 10.6 ~ 13.2 px, may border at wala).
  - Malalaking card ang controller list, kaya 2 lang ang kasya bawat hilera.
  - Doble ang icon sa ilang button (simbolo at icon na sabay).
  - Ang "Audit:" ay naputol nang patayo.
  - Ang force field ay "value" lang, at hindi malinaw ang ✓ / ✕.
  - Naka-uppercase ang Library tabs (I/O LIST…) habang ang iba ay hindi.
  - Napuputol ang salita sa gitna ("sug gested").
  - Ang UAT buttons ay may lumang ◀ ▶ 🎲.
- **Work Done (itsura lang):**
  - **Controller group display:** maliliit na DCS faceplate na magkakatabi (tag strip, PV / SV bar at MV bar, mode box A dilaw / M berde / R puti, PV value, MV %). Mga 4 bawat hilera sa kanang panel.
  - **Isang button system:**
    - Dalawang laki: md 2.125 rem para sa lahat ng button, select at field; sm 1.875 rem para sa segmented control.
    - Isang laki ng sulat: .875 rem.
    - Apat na uri: secondary, primary (asul), run (berde), ghost (tool bar).
  - Sa tablet, 2.5 rem ang taas para sa daliri.
  - **Icons:** walang doble. Kusang nilalagyan ng icon ang bagong button kahit sa mga panel na paulit-ulit na binubuo (UAT, CHECK, Inspector).
  - **Force editor:** "Force to…" na field, kasama ang asul na ✓ (force) at ✕ (release) bilang iisang grupo.
  - "Audit:" → "Record check:" (hindi naputol).
  - Library tabs: I/O list, Memory list, Wiring, Relay / SER, Calculations.
  - Plant model ON ay berdeng estado.
  - Ang salita ay nababali sa pagitan ng mga salita lang.
  - Ang DITL drawing / sheet no. ay nakatago sa screen na mas makitid sa 1500 px (para buo ang title).
- **As Left (headless, 2026-10-21):**
  - Button inventory: 35 itsura (kasama ang mga list row, DCS faceplate at zoom bar, na sinadyang iba).
  - `npm run check` SAME; `npm test` 11 PASS; 10 UI test PASS.
  - RUN 60 fps sa 4× mabagal na CPU.
- **Hindi pa nasubok:** sa tablet / exe / apk ng user.

## 3.1.0-beta.5 — Mas malaki ang drawing, mas maliit ang faceplate
- **Problem (user, 2026-10-21):** "Anlaki naman ng faceplate. Liit na nga ng drawing, sobrang laki pa ng faceplate."
- **As Found (1333 × 833):** ang drawing ay 713 px lang ang lapad. Ang kanang panel ay 360 px, at ang bawat faceplate ay mga 520 px ang taas (bar graph 250 px).
- **Work Done (itsura lang):**
  - Mas makitid ang kaliwang panel (15 % ng lapad, 200 ~ 264 px) at ang kanang panel (21 %, 264 ~ 336 px).
  - Ang faceplate ay 80 % ng dating laki (parehong DCS faceplate), at mas maikli ang bar graph.
  - Mas maliit ang controller cards.
  - Mas siksik ang mga row ng sheet list at Inputs.
  - Mas manipis ang gilid ng mesa sa paligid ng papel.
- **As Left:** ang drawing ay mga 850 px na ang lapad sa 1333 × 833 (dati 713). `npm run check` SAME; 10 UI test PASS.
- **Hindi pa nasubok:** sa tablet / exe / apk ng user.

## 3.1.0-beta.4 — Side panels: walang doble, malinaw na cards
- **Problem (user, 2026-10-21):** "Tama ba mga ginawa mo sa buttons? Sa side panels, tama na ba lahat?" Hindi.
- **As Found:**
  - Ang listahan ng inputs ay nasa kaliwa (Inputs) at nasa Inspector din, na may tatlong magkaibang itsura ng parehong switch: OFF | ON, "0 · OFF", "Bad Signal: OFF".
  - Ang pangalan ng sheet ay inuulit sa Inspector at sa Faceplate (nasa top bar na).
  - Dalawang heading para sa controllers.
  - Ang controller cards ay may itim na bar at putol na value ("0.00 · 0…").
  - Isang mahabang how-to na talata ang nasa Inspector.
  - Ang "Sanhi?" ay itim na DCS button sa puting faceplate.
  - Ang By order / By category ay kasing-lakas ng Sheets / Inputs.
- **Work Done (itsura lang):**
  - Inspector: wala na ang sheet name, ang how-to at ang inputs list (nasa kaliwang Inputs tab na). Kapag walang napili, isang linya: "Click a block or a wire on the drawing to inspect it." Nananatili ang forced signals.
  - Faceplate pane: wala na ang dobleng sheet name at heading.
  - Controller cards: buo ang value, magaan na bar, at mode badge (A berde, M dilaw, R asul).
  - Ang mga karaniwang button sa loob ng faceplate (Why?, MV steps) ay sumusunod sa button ng app. Ang A / M / R ay DCS pa rin.
  - "Sanhi?" → "Why?".
  - Mas tahimik ang By order / By category.
- **As Left:** `npm run check` SAME; `npm test` 11 PASS; 10 UI test PASS.
- **Hindi pa nasubok:** sa tablet / exe / apk ng user.

## 3.1.0-beta.3 — Mga button: iisang propesyonal na itsura
- **Problem (user, 2026-10-21):** "Yung buttons. Paki ayos! Gandahan mo professional!"
- **As Found (close-up ng tool bar, Inspector, sheet list, status line):**
  - Mga simbolo bilang icon (◀ ▶ ◀◀ ▶▶ ✕ ✓ ⤢ ❚❚ ▾) na magkakaiba ang laki at kapal.
  - Ang Pause ay mukhang napiling tab.
  - Ang 1x / 1 s ay mukhang text lang.
  - Ang PASS / FAIL / NEEDS REVIEW ay matingkad na kulay na naka-outline.
  - Mabigat ang border at anino.
  - Itim na ◀ sa kahon sa sheet list.
  - Sa status line, minsan dalawang mensahe ang sabay.
  - Sa DITL RUN, bakante ang tool bar.
- **Work Done (itsura lang; walang binagong text o handler ng button):**
  - **Iisang icon set:** ang simbolo sa bawat button ng buong app ay iginuguhit bilang line icon (✕ ✓ chevron, step, play / pause, info, expand, menu, pin, folder, save). Ang text ng button ay hindi binago, kaya pareho pa rin ang binabasa ng code at ng mga test.
  - **Antas ng button:**
    - Secondary ang karaniwan (puti, manipis na border).
    - Primary (asul) ang pangunahing aksyon: Open faceplate, Test this sheet, Run ALL, UAT.
    - Berde ang Run; ang Pause ay karaniwang button.
    - Ang toggle (Values, Wire values, Inspector) ay may asul na tint at gilid.
  - Ang mga select (1x, 1 s, 1 min) ay may border at arrow.
  - PASS / FAIL / NEEDS REVIEW: neutral na button na may kulay na tuldok.
  - Parisukat ang icon-only button (✓ ✕ ‹ ›).
  - Tahimik na chevron ang collapse ng sheet list.
  - Isang mensahe lang sa status line.
  - Sa DITL RUN, nananatili ang I/O list sa tool bar.
- **As Left (headless, 2026-10-21):**
  - UI audit 1333 × 833: Light 19, Dark 18 finding.
  - `npm run check` SAME; `npm test` 11 PASS; 10 UI test PASS.
  - RUN 59.8 fps sa 4× mabagal na CPU.
- **Hindi pa nasubok:** sa tablet / exe / apk ng user.

## 3.1.0-beta.2 — Ayos ng mga natirang screen
- **Problem:** pagkatapos ng beta.1, sinuri ang 27 screen (Light / Dark, 1333 × 833). May mga detalyeng mali pa:
  - Plant view: monospace ang listahan ng system at putol ang mga pangalan.
  - Status line: may bakanteng cell, at minsan dalawang mensahe ang sabay na lumalabas.
  - Ang "Events" ay hindi nakagitna.
  - Sa Dark, kulay papel ang mga sample ng Legend.
  - Sa phone, nawawala ang Fit.
  - Sa DITL, lumalabas ang "◀ Inspector" tab.
- **Work Done:**
  - Plant list sa UI font, buong pangalan.
  - Plant view columns ay sumusunod sa lapad.
  - Isang mensahe lang sa status line, walang bakanteng cell, at nakagitna ang Events.
  - Legend: kulay papel sa Light lang.
  - Fit nakikita sa phone.
  - Walang Inspector tab sa DITL.
- **As Left:**
  - UI audit Dark 1333: 19 finding (beta.1: 88).
  - `npm run check` SAME; `npm test` 11 PASS; 10 UI test PASS.

## 3.1.0-beta.1 — Bagong shell (GO ng user, 2026-10-21)
- **Problem (user):** "parang walang nangyari, hindi professional tingnan at gamitin"; "dapat auto adjust kahit anong screen size"; "lahat, buong app".
- **As Found:**
  - Ang 3.0.0-beta.2 ~ beta.8 ay tagpi-tagpi: 656 linya ng CSS na nagpapatong-patong (bawat beta ay dagdag na override sa luma), kasama pa ang lumang madilim na skin ng ABC page (`#skin`).
  - Nakapirming pixel ang mga sukat, at may hiwalay na ayos sa 700 / 1180 / 1333 px.
  - Hindi magkakapareho ang button, select at tab sa bawat panel.
- **Work Done:**
  - `src/ui/shell/app.css` ay isinulat mula sa simula (iisang design system):
    - **Fluid:** ang base size ay sumusunod sa window (13 px sa phone ~ 15 px sa malaking monitor). Ang lahat ng taas, gap at lapad ng panel ay sumusunod dito (rem / clamp). Ang kaliwang panel ay 17 % ng lapad, ang kanang panel ay 27 % (may min at max).
    - **Kusang umaangkop:**
      - < 1280 px: ang search ay icon.
      - < 1100 px: ang kanang panel ay lumulutang sa ibabaw ng drawing, at icon lang ang mga tab.
      - < 900 px: ang sheet list ay drawer (☰ Sheets).
      - < 640 px: dalawang hilera sa top bar, at bottom sheet ang panel.
      - Ang tool bar ay nagiging icon lang kapag kulang ang lapad nito (container query).
      - Sa touch (daliri), mas malaki ang lahat ng control.
    - **Isang set ng control** para sa buong app: button, select (may sariling arrow), input, segmented control (ABC | DITL, VIEW | RUN, Sheets | Inputs, By order | By category, Library tabs), tab, card, menu, dialog.
    - **Font:** Inter para sa UI, JetBrains Mono para sa tag at value.
    - **Light at Dark** na magkatugma. Hindi binabago ng Android auto-dark.
    - **Tool bar:** isang hilera sa VIEW at RUN. Iisang filled button lang (Run / Pause).
    - **Top bar:** logo at "DCS Logic Simulator", tabs, ABC | DITL, sheet, search, VIEW | RUN, ⚙.
  - Inalis ang lumang `#skin` ng ABC page (`src/ui/shell/app.js`).
- **As Left (headless, 2026-10-21):**
  - 6 na laki ng screen (360, 768, 1024, 1333, 1600, 1920) sa Light at Dark: walang horizontal scroll ng page, 0 page error.
  - UI audit 1333 × 833: Light 58, Dark 88 finding (dati 673 / 624 sa beta.7). Ang natitira ay karamihang maliit na target (status line Events, search scope) at overlap na hindi totoo (scroll ng listahan, bukas na ⚙ menu); ang dark RUN chip ay pinadilim pagkatapos ng audit.
  - `npm run check` SAME; `npm test` 11 PASS; PASS ang 10 UI test (ditl_toolbar 36, plant_view 18, manstation 12, panel_sync 12, overview 9, infocard 9, lookonly 8, events 5, abcbar 4, faceplate).
  - Bilis sa RUN, CPU 4× mabagal: 60 fps.
- **Hindi pa nasubok:** sa tablet / phone / exe / apk ng user.
