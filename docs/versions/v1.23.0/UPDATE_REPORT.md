# v1.23.0 (target ng susunod na Stable) — mga Beta

Base: Stable v1.22.0 (`main`, release `v1.22.0`). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f).

## 1.23.0-beta.3 — Info card sa global search (galing sa / ginagamit sa / Trip?)

- **Problem:** Bago ang activity, ang tanong: "may tripping ba ito? saan ginagamit? paano malalaman kung ginagamit nga?" Ang search ay nagbubukas lang ng sheet.
- **Work Done (`src/ui/shell/info.js`, bago; read only):** i-type ang address o tag sa search, tapos **Enter** o **ⓘ**. Lalabas ang card na galing sa netlist ng drawing:
  - **Description** (I/O list / memory list) at live value sa bawat sheet.
  - **Galing sa:** kinukuwenta ng aling block (kasama ang mga input nito at ang value), galing sa ibang sheet o DITL, o input ng sheet.
  - **Ginagamit sa:** mga block na bumabasa nito. **WALA = display lang** (walang logic na bumabasa sa sheet na iyon).
  - **Trip?:** sinusundan ang signal pababa sa sheet: force manual / AUTO select ng controller, TRIP / MFT / STOP / ESD / RUN BACK, TO DITL, at ibang sheet na naaabot.
  - **DITL:** saan ito sa DITL page (sheet, row, input / output).
  - May **Show** para buksan ang sheet at piliin ang wire.
- **As Left:** `tests/regress/infocard.js` 9 / 9:
  - M.0228: OR; ginagamit ng 2 block; FORCE MANUAL ng FICFW1007.
  - M.3410: 4 na lugar sa ABC; sa ABC-029 / 003A ay galing sa ABC-004A; FORCE MANUAL ng HS-COAL; TO DITL 07-05.
  - Walang nagbabagong value.
- **Status:** Pass (headless).

## 1.23.0-beta.2 — Overview ng mga controller, force list, at mga font na pipiliin

- **Problem:** Sa Operator tab, bawat faceplate ay mga 390 px ang taas (4 na controller = 4488 px na kailangang i-scroll). Walang mabilis na force ng mga signal ng loop. Pangit ang font sa ibang device (fallback ng system).
- **Work Done:**
  - `src/ui/hmi/overview.js` (bago, itsura at operasyon lang): grid ng maliliit na card sa itaas ng Operator tab, isa kada controller (tag, A / M / R, PV · MV, bar ng PV / SV / MV). I-click ang card: iyon lang ang faceplate na makikita, bukas ang Engineering (trend, signals), at lalabas ang **Force list** ng loop:
    - PV;
    - mga select signal ng A/M station (force manual / AUTO);
    - mga mode input (.MAN / .LOC / .REM);
    - bawat isa ay may [0] [1] (o value) at [×] release.
  - Mga font sa loob ng app (offline, OFL license, `src/ui/fonts/`): ⚙ → Appearance → **Font**: Inter + JetBrains Mono (default), IBM Plex Sans + Mono, Roboto + Roboto Mono, o Device default. Ang drawing ay may sariling font ng theme. Dagdag na laki: mga 290 KB.
- **As Left:** `tests/regress/overview.js` 9 / 9 (ABC-010: 4 card; FICFW1007 lang ang makikita; force list SI0269, M.0228, FICFW1007.MAN; FORCE 0 sa M.0228 → enabled ang AUTO; × → bumalik sa 1). Pasado ang faceplate, operator panel at ABC-007 184 / 0. Hindi pa nasubok sa tablet.
- **Status:** Pass (headless).

## 1.23.0-beta.1 — Iisang top bar (ABC + DITL), ⚙ settings, status bar, iisang font (UI ayon sa mockup v2, bahagi 1)

- **Problem:** Tatlong hilera sa itaas (search, toolbar, pamagat), malalaking button, apat na dropdown (UI, Diagram, Channel, Update) na laging nakalabas, emoji sa mga button, at magkakaibang font. Hindi pang-engineering ang dating (puna ng user sa mockup v1).
- **As Found:** Ang `#gsbar` (search) at ang toolbar ng page (`#anbar` ng ABC, `#bar` ng DITL) ay magkahiwalay na hilera.
- **Work Done (`src/ui/shell/shell.js` `buildTop`, `src/ui/shell/shell.css`; itsura lang, parehong mga button at handler):**
  - **Iisang hilera (40 px), pareho sa ABC at DITL:** [ABC | DITL] [Run ◀◀ ▶▶ step speed Reset View] [Fit Values Wire Panel] [◀ sheet ▶] [⋯] [Search] [⚙]. Sa tablet (≤ 1180 px), ang search at ⚙ ay nasa ikalawang hilera.
  - **⚙ Settings:**
    - Itsura: UI theme, Diagram theme, Live color, Theme.
    - Simulation: ABC+DITL.
    - Channel at update: Channel, "Check for update".
  - **Status bar sa ibaba:** RUN / VIEW, sheet, version, oras ng simulation (t = …), at ang hint.
  - **Iisang font:** system UI para sa text, monospace para sa mga value. Walang emoji sa toolbar (🌐, ⟳ ay tinanggal; ang ⚙ ay line icon).
  - Mas maikling label: ABC / DITL, ◀◀ / ▶▶ (Back / Next), Wire, ⋯. Ang DITL na pamagat ay isang linya rin, gaya ng ABC.
  - Hindi ginalaw: ang left pane (search ng sheet at ang By order / By category), ang drawing, ang engine at ang RUN / VIEW.
- **As Left (headless, desktop 1440, tablet 1024, phone 390):**
  - Top bar: desktop 1 hilera (40 px), tablet 2 hilera (73 px), phone 1 hilera.
  - DITL toolbar test, in-app update test at iisang mundo test: ALL PASS. ABC-007 scenarios: 184 / 0. Faceplate at operator panel: PASS. `npm test`: 11 PASS.
  - HINDI na-check: totoong tablet / phone.
- **Status:** Pass (headless). Susunod: kanang panel (faceplate grid, PID trend, force list), search card, event log, Test tab.
