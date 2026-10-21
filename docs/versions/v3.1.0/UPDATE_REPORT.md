# v3.1.0 — Bagong shell mula sa simula

Base: 3.0.0-beta.8 (branch `claude/design-system-extraction-4dogzg`). UI lang: walang binago sa engine, logic, simulation, kulay ng drawing at sa DCS faceplate box.

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
