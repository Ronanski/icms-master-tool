# v2.0.0 (target ng susunod na Stable) — mga Beta

Base: Stable v1.23.0 (`main`). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f). Bakit 2.0.0: bagong henerasyon ng itsura at English ang buong app (PROJECT_RULES 5f, user 2026-10-15: "standard tayo, baka umabot ng v1.9999").

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
