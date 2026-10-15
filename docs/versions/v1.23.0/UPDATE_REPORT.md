# v1.23.0 (target ng susunod na Stable) — mga Beta

Base: Stable v1.22.0 (`main`, release `v1.22.0`). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f).

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
