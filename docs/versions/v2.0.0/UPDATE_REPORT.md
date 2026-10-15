# v2.0.0 (target ng susunod na Stable) — mga Beta

Base: Stable v1.23.0 (`main`). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f). Bakit 2.0.0: bagong henerasyon ng itsura at English ang buong app (PROJECT_RULES 5f, user 2026-10-15: "standard tayo, baka umabot ng v1.9999").

## 2.0.0-beta.5 — Drum level na integrating, 150 MW state na may kagamitan at mode, SV step sa unit, Plant HMI workspace (draft)

- **Problem (user):** Ang SV ay hindi %, depende sa unit ng parameter. Masyadong makitid ang faceplate (hindi kita ang trend). Gusto ng PLANT HMI workspace, per system (draft). Ayusin muna ang logic.
- **As Found:**
  - Ang drum level ay sumasagot sa command ng 3-element master na parang first-order process, hindi sa water balance.
  - Sa naka-angklang flow loop, masyadong maliit ang gain: FICFW1007 sa MV 0 % = 440 T/H.
  - Sa 150 MW state, naka-MAN ang mga slave dahil itinakda ang mode habang aktibo pa ang force-manual ng cold start. Kulang din ang mga digital signal (BFWP running, ICV → CV transfer).
- **Work Done:**
  - `plant.js`: drum level dL/dt = 0.02 × (FW flow FICFW1007 PV − main steam FT-MS1031 AI0129); ang simula ay ang value ng transmitter. Anchored gain: ang panig na pinupuntahan ng PV kapag sumasara ang valve ay nasa loob ng range; ang flow ay proportional sa valve.
  - `hmi-op.js`: 19 digital input ng kagamitan mula sa snapshot (BFWP-A, coal feeder A/B/C, PAF, SAF, IDF, FA blower A, CP-A, SWP-B/C, ICV → CV), mode status .MAN / .LOC / .REM, LICBR1001B MANUAL; tatakbo muna nang 10 s, saka itatakda ang mode.
  - `hmi.js`: SV ▲ / ▲▲ = 1 / 5 na bilog na unit ng parameter (hal. 1 / 5 °C, 10 / 50 mm, 0.01 / 0.05 T/H); MV 1 / 5 %; faceplate max 380 px.
  - `src/ui/plant/` (bago): PLANT button sa tabi ng ABC / DITL; listahan ng system (29), viewer (fit, zoom, pan), at value list ng snapshot. Draft: walang address.
- **As Left (headless):**
  - 150 MW, pagkatapos ng 1800 s: drum level −11 mm (SV 0), FW 474.7 T/H = steam 474.1 T/H, FW MV 53.3 % (snapshot 56 %).
  - `hmi_op.js` (bago ang drum level): 5 / 7 naka-angklang loop ay nasa ±2 % ng snapshot.
  - Buong regression: tumatakbo nang i-push ito.
- **Hindi pa nasubok:** totoong tablet / exe. Ang graphics ng Plant HMI (ginagawa pa).
- **Status:** Beta.

## 2.0.0-beta.4 — Beta switch ayos, faceplate (1 % / 5 %, walang keyboard, description, makitid), legend, plant model na naka-angkla sa HMI, "Start at 150 MW"

- **Problem (user):**
  1. Sa tablet (Stable v1.23.0 apk), hindi makalipat sa Beta.
  2. Sa faceplate: ▲ = 1, ▲▲ = 5; walang keyboard kahit saan sa faceplate; may description; hindi malapad.
  3. Ang legend ng kulay sa sheet strip ay laging "tube" kahit "Solid" ang pinili.
  4. Ibangga ang plant model sa HMI snapshots.
- **As Found:**
  1. Kapag may lumang Beta na naka-save sa app (hal. 1.22.0-beta.4 mula sa v1.22 install), ang pagpili ng Beta ay **binubuksan ang lumang kopya na iyon** at hindi kumukuha ng bago. Na-reproduce sa headless (tablet 1180 px, totoong pindot sa ⚙ → Channel).
  3. Ang legend ay naka-hardcode na tube.
  4. Ang plant model ay PV = 50 % ng range kapag MV = 50 %; hindi ito nakaangkla sa tunay na planta. Sa cascade master (hal. ABC-011 TICBR1140), ang command na nahanap ng model ay ang SV ng slave sa °C (358.2), kaya laging 600 °C ang PV.
- **Work Done:**
  1. `update-question.js`: ang naka-save na kopyang mas luma sa kopya sa loob ng app ay hindi na binubuksan (tinatanggal). `category-search.js`: ang Beta ay laging nagda-download ng pinakabago kapag may internet; ang naka-save na kopya ay para lang sa offline.
  2. `hmi.js`: ▲ / ▼ = 1 % ng range, ▲▲ / ▼▼ = 5 %, hold-to-ramp; ang value box sa faceplate ay walang keyboard sa lahat ng device; ang header ng faceplate ay description (126 / 126 faceplate); ang faceplate ay max 300 px.
  3. `paint.js`: ang legend ay sumusunod sa Legend & style (solid / tube, kulay, kapal).
  4. `plant.js`: ang 13 loop na tumatakbo sa snapshot (A / R, sariling valve) ay naka-angkla: sa MV ng snapshot, ang PV ay ang PV ng snapshot (hal. FICFW1007 MV 56 % → 499 T/H). Cascade master: kapag ang command ay nasa engineering unit, ang output ng station (%) ang ginagamit.
  5. **Bago: ⚙ → Simulation → "Start at 150 MW (HMI snapshot)"** (`src/analog/engine/hmi-op.js`): Reset, tapos 105 transmitter (AI, per station at address) at 36 controller (SV, MV, A / R / M) ay itinatakda mula sa mga snapshot. Hindi na cold start.
- **As Left (headless):**
  - `stale_beta.js` 4 / 4; `inapp_update.js` ALL PASS; `manstation.js` 12 / 12; overview, faceplate: PASS.
  - Sa 150 MW state (pagkatapos ng 300 s): TICBR1130 PV 395.5 °C (snapshot 394), TICBR1150 420.1 (420), TICBR1140 461.0 (462, AUTO), FICFW1007 494.9 T/H (499.1). TICMS1004 ay papalapit (569 → SV 541).
  - Buong regression: tingnan ang commit.
- **Hindi pa:**
  - Sa 150 MW state, ang FICFW1007 / TICBR1130 / TICBR1150 ay naka-MAN dahil sa force manual ng drawing. Kailangan ang mga digital signal ng planta (hal. BFWP A running M.3343, galing DITL); wala pa ang mga ito sa snapshot data.
  - Ang drum level (tatlong controller sa iisang PV) ay hindi pa naka-angkla.
  - Ang Stable v1.23.0 na naka-install ay may lumang code pa. Gawin sa tablet: piliin ang Beta. Kung ang bumukas ay v1.22.0-beta.x, pindutin ang ⚙ / Update → "I-update ngayon" (na-subok sa headless: lilipat sa pinakabagong Beta).
- **Status:** Pass (headless), Beta.

## 2.0.0-beta.3 — Faceplate ng MAN station, ▲ ▼ na pino at hold-to-ramp, walang keyboard sa tablet; HMI operating points

- **Problem (user):** Ang MAN station sa Operator tab ay walang faceplate at "MAN" lang ang pangalan. Ang − / + ay 1 % ng range (5 sa range na 0~500). Sa tablet, lumalabas ang keyboard sa SV / MV.
- **As Found:** `hmi.js` ay gumagamit ng `b.txt[0]` bilang tag, pero sa 58 MAN block, ang `txt[0]` ay karaniwang "MAN"; ang tunay na tag ay `b.tag`.
- **Work Done:**
  - Faceplate ng MAN station: description (MAN parameter workbook, `AN.descOf`), output bar, MV box, ▲▲ ▲ ▼ ▼▼, tag + range + station (S3-MDL001), MAN button na umiilaw.
  - ▲ / ▼ = 0.1 % ng range, ▲▲ / ▼▼ = 1 %. Kapag hinawakan, umuulit (10 / s) at bumibilis ×5 pagkalipas ng 2 s. Pareho sa SV / MV popup ng PID faceplate.
  - Tablet / phone (`pointer:coarse`): ang value box ay readonly at `inputmode=none`, kaya walang keyboard.
  - `docs/hmi/OPERATING_POINTS.md` at `operating-points.json`: 35 HMI snapshot, 1019 item; 53 controller ay may katapat na ABC tag at sheet.
- **As Left (headless):** `tests/regress/manstation.js` 12 / 12 (desktop + touch); overview: ALL PASS. Ang operator scenario (generic) ng ABC-010 at ABC-008 ay tumatakbo pa nang i-push ito.
- **Hindi pa nasubok:** totoong tablet.
- **Status:** Pass (headless), Beta.

## 2.0.0-beta.2 — English ang text ng scenario test (UAT)

- **Problem:** Tagalog pa ang mga hakbang at resulta ng scenario test sa UAT panel (ABC-007), at ang "expected / actual" ng Spot check.
- **Work Done:**
  - `src/ui/uat/scen.js` (~111 string) at `src/ui/uat/scenarios/ABC-007.json` (177 string): English ang title, step, drawing text at why.
  - Ang mga salitang ikinukumpara rin ng code ay pinalitan sa dalawang file nang sabay: unchanged, increased / decreased, at SV, open, cut / free, none.
  - `uat-ui.js`: Running..., expected / actual.
  - `tests/scenarios/generic.js`: regex ng "REMAINING STEPS NOT TESTED".
  - Ang "Needs Verification" sa isang why ay pinalitan: "The drawing shows no MV restore: the MV follows the bumpless tracking of the A/M station as drawn."
- **As Left (headless):** ABC-007 scenarios 184 / 0; info card, overview, event log, in-app update: ALL PASS.
- **Hindi pa nasubok:** totoong tablet / phone.
- **Status:** Pass (headless), Beta.

## 2.0.0-beta.1 — Console look, English sa app, Plant window ibinalik

- **Problem:** Gusto ng user ng technical, "maangas" na itsura na pang-engineer (inspirasyon: ABB Control Builder, Yokogawa CENTUM VP, TIA Portal). Magkakaiba ang laki ng font, may halong Tagalog sa app, at nawala ang Plant window (2nd monitor, plant graphics per system).
- **As Found:**
  - Ang button na "Plant" (`bPl`, `src/analog/ui/main.js`) ay ginawa pero hindi kailanman inilagay sa toolbar, kahit noong unang ginawa ang `src/`. Buo pa ang `src/analog/ui/plant-window.js`.
  - Ang "2nd sheet" ay nasa ⋯ menu.
- **Work Done:**
  - `src/ui/shell/console.css` (bago, itsura lang): Console look (default). ⚙ → Look: Classic = ang itsura ng 1.23.0.
    - Manipis na border, pane title strip (ALL CAPS na 11 px na label lang), at kulay para sa estado lang (asul = napili, berde = RUN / AUTO, amber = MAN, pula = alarm).
    - Dot grid sa likod ng drawing at segmented status bar.
    - 4 na laki ng font: 11 px label, 12.5 px text at button, 14 px title, at mono para sa values.
  - Mga font: **IBM Plex Sans Condensed** (default) at Barlow Semi Condensed (bago, OFL, `src/ui/fonts/`). Ang tag at numero ay JetBrains Mono.
  - English ang lahat ng text sa app: faceplate, info card, event log, Spot check, update question ("Update now" / "Later"), one world, at ang mga toolbar group.
  - Ang Plant window ay nasa ⋯ → Windows (kasama ang 2nd sheet at DITL signals).
  - PROJECT_RULES 5f: PATCH = fix lang; MINOR = pinagsamang mga bagong feature; MAJOR = bagong henerasyon. Ang app ay English, ang chat at docs ay Taglish.
- **As Left (headless):** info card, overview, event log, DITL toolbar, in-app update: ALL PASS. Screenshot: desktop, tablet, phone.
- **Hindi pa nasubok:** totoong tablet / phone. Ang Plant window sa apk (pop-out window sa Android). Ang pagsasalin ng scenario text (ABC-007) ay ginagawa pa.
- **Status:** Pass (headless), Beta.
