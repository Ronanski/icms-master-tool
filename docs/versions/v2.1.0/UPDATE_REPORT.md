# v2.1.0 (target ng susunod na Stable) — mga Beta

Base: Stable v2.0.0 (`main`). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f).

## 2.1.0-beta.1 — Info card sa LIBRARY, flow chart ng wiring, CALC (flow compensation, drum level)

- **Problem (user):** Sa LIBRARY, gusto ang popup card na gaya ng (i) sa search. Wala ang flow compensation at drum level calculation. Gusto ng mini flow chart ng wiring (may arrow) sa info card ng address o tag.
- **Work Done:**
  - `src/ui/shell/info.js`: ang card ay may I/O LIST / MEMORY LIST record (station, tag, description, range, type, SIG.AB), **WIRING flow chart** (FIELD → JB → MPL field TB → cross wiring → MPL system TB → system cable → FCS terminal board → I/O module → ADDRESS; baliktad para sa DO), at **FLOW COMPENSATION** kapag ang tag ay may compensation. Gumagana rin para sa address na wala sa drawing.
  - LIBRARY: ang pag-click sa row = info card (ang address / tag ay copy pa rin). Bagong **CALC** tab: 8 flow compensation (station, flow, P / T tag, design value, ap / bp / at / bt) at ang drum level correction table (19 row).
  - `tools/data/calc.py` → `src/ui/plant/calc.js` (mula sa `flow-compensation.xls` at `drum-level-calculation.xls`, ang merged header ay pinunan).
- **As Left (headless):** LIBRARY → FT-MS1031 → card na may I/O record + wiring chart + kung saan ginagamit sa ABC; FT-FA1081 → may FLOW COMPENSATION; CALC tab: 8 flow + drum table; walang page error.
- **Hindi pa nasubok:** totoong tablet.
- **Status:** Beta.
