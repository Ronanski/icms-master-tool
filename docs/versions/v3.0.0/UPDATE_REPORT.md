# v3.0.0 — Mga Beta (bagong itsura: Style 2 + CAD)

Base: Stable v2.4.0 (`main`). Bawat Beta ay push sa `claude/design-system-extraction-4dogzg` (PROJECT_RULES 5e). UI / itsura lang: walang binago sa engine, simulation, plant model at logic.

## 3.0.0-beta.1 — BINAWI
- Ginawa at na-push nang hindi pa pumipili ang user. Ibinalik ang branch sa `main` at isinara ang PR #36 (utos ng user: "Oo ibalik mo"). Walang bahagi nito ang natira.

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
