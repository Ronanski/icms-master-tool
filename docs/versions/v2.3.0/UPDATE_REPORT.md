# 2.3.0 — Update report (Beta)

## beta.1 — Drawing audit at ayos ng mga link (2026-10-19)

- **Problem:** Hiningi ng user ang audit ng natitirang ABC sheet laban sa PDF at ng page linking (DITL ↔ DITL, DITL ↔ ABC). Pagkatapos ng audit, "Ayusin lahat".
- **As Found:** (`DRAWING_AUDIT.md`) 28 / 50 ABC sheet walang mali. Mga link na hindi nakakabit o mali:
  - ABC-001C: hindi nagfo-force manual ang boiler master kapag hindi REMOTE ang coal master (kulang ang M.2000 sa OR M.2013).
  - ABC-001D: walang epekto ang HIC-MWRL sa BIR gain (laging 0.95).
  - ABC-013: hindi nagsisimula ang house operation sa turbine trip / 52G1 open.
  - ABC-011 / 012: ang A (LOCAL) ng TICBR1130 / TICBR1150 ay hindi nagfo-force manual sa TICBR1140 / TICMS1004.
  - ABC-057: walang AUTO / MANUAL button ng front / rear wall dampers (laging MANUAL).
  - ABC-009A / 009B: ang DITL manual request M.331D ay hindi umaabot; ang lahat-MAN ng 4 screw cooler at ang MAN ng PIC-BASC ay hindi umaabot sa furnace DP control.
  - ABC-004A: maling deviation sa tracking ng coal flow (B / C IN MANUAL hindi nakakabit).
  - ABC-008: walang tag ang HYDRAULIC CONTROL SELECT M.0200.
  - ABC-020: ang "I" (HICHR1002B.MV) laging 0, may talon ang damper sa MAN → AUTO.
  - ABC-054: ang PV ng PICHR1391 hindi sumusunod sa HRH pressure kapag walang unit model.
  - DITL: "80S-57" ikinabit sa DITL-80 (maling equipment); row "21A" hindi nabasa (REMOTE ng 4 screw cooler); "TO DITL 40-xx" ikinabit sa maling comparator (MSP HIGH kapag mababa); 27 DITL row FROM ABC walang link (heater / DA HI-HI, HP / LP bypass MAN, bias damper, MFT sa DITL-15).
- **Work Done:** (`DRAWING_TRACE.md` bago ang code; `UNLINK_AUDIT.md` para sa 2 maling link na pinalitan)
  - Talaan ng ayos bawat sheet (`src/analog/engine/audit-fix.js`), inilalapat pagkatapos basahin ang drawing; may tsek ng block at net, may babala kapag hindi tugma.
  - Mode alias: ang M / A / R ng TICBR1130 / TICBR1150 ay nagsusulat din sa M.0230 / M.0240 (`hmi.js`, `hmi-op.js`).
  - Station wiring S2 → S1 para sa ABC-013 (I.0400 / I.0932 / I.0937 → M.3200 / M.3220 / M.3221, `unit.js`).
  - DITL: row na may letra ("21A") ay binabasa (`letterRows`); "3A-63" = 03A-63; "80S" ay PLC, hindi DITL-80; DITL row FROM ABC ay nakakabit ayon sa address / tag (kasama ang analog na value sa comparator ng DITL-79 at ang MANUAL ng controller); "TO DITL 40-xx" sa tamang comparator.
  - Walang binagong formula, range, timer o parameter.
- **As Left:** Test `tests/regress/audit230.js`: 19 / 19 PASS (bawat ayos sa itaas, sa app mismo). Regression: tests.js 11 / 11, world.js 11 / 11, ditl150.js 9 / 9, plant_live.js 12 / 12, faceplate.js, engine isolated.js: lahat PASS. Binago ang inaasahan ng world.js (ABC-017 I.024E ay PLC na, hindi DITL) at ng ditl150.js (40-09 ay direktang M.310D na).
- **Status:** Pass (beta.1). Natitira: DITL-21C row 19 / 20 (M.311A / B, walang pinagmulan sa ABC-009A ng app; hindi mabasa). Susunod: beta.2 behavior (grupo B), beta.3 datos (grupo C).

## beta.2 — Behavior ayon sa drawing (grupo B, 2026-10-19)

- **Problem:** Apat na gawi ng engine na iba sa nakasulat sa drawing (`DRAWING_AUDIT.md` grupo B).
- **As Found:**
  - Coal feeder A / B / C: ang MV ay umaabot sa 40 T/H kahit lahat ay REMOTE at tumatakbo (dapat ≤ 83.3 % = 33.3 T/H).
  - Burner A ~ D SA flow: ang "SET SV = 49 T/H" sa house operation ay hindi umaabot sa SV ng controller.
  - Oil master: ang tracking (SI0304) ay laging kumukuha sa burner A, kahit ibang burner ang REMOTE (may talon).
  - Ramp ng air demand / PA demand 11x / 6.5x mas mabagal; ramp ng HP bypass spray temperature SV 12x mas mabagal.
- **Work Done:** (`DRAWING_TRACE.md` beta.2) MV high limit mula sa `<tag>.MHD` sa MAN station; SET SV sa operator SV na nananatili; pili ng SI0304 mula sa REMOTE ng FICDO1043A ~ D; span ng ramp 1115 T/H, 648 T/H, 600 °C. Walang binagong link.
- **As Left:** `tests/engine/audit230b.js` 4 / 4 PASS (33.32 T/H kapag M.3405 = 1, 38 T/H kapag 0; SV 20.8 → 49 at nananatili; C lang ang REMOTE → leg C; 2.23 / 1.296 T/H bawat s, 10 °C / min). Regression: tingnan ang ulat sa chat.
- **Status:** Pass. Susunod: beta.3 datos (grupo C).
