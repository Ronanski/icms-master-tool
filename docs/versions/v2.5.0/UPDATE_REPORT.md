# 2.5.0 — Update report (Beta)

> Ang beta.1 ~ beta.4 sa ibaba ay ginawa bilang 2.3.0-beta.N. Habang ginagawa, inilabas ang v2.4.0 Stable (bagong shell) sa `main`, kaya ang drawing audit ay pinagsama sa `main` at binilang ulit bilang 2.5.0-beta.1 (PROJECT_RULES 5f: hindi pababa ang version).

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
- **As Left:** `tests/engine/audit230b.js` 4 / 4 PASS (33.32 T/H kapag M.3405 = 1, 38 T/H kapag 0; SV 20.8 → 49 at nananatili; C lang ang REMOTE → leg C; 2.23 / 1.296 T/H bawat s, 10 °C / min). Regression sa beta.2 html: audit230 19 / 19, tests.js 11 / 11, world 11 / 11, ditl150 9 / 9, plant_live 12 / 12, faceplate, isolated PASS. pid_am: 1 mali (FIC-CM ABC-004A, MANUAL value 0 sa halip na 32.5); pareho rin ang mali sa v2.2.0 Stable at sa beta.1, kaya hindi galing sa beta.2 (dating isyu, hiwalay na ayos).
- **Status:** Pass. Susunod: beta.3 datos (grupo C).

## beta.3 — Datos ayon sa drawing (grupo C, 2026-10-19)

- **Problem:** Apat na datos sa app na iba sa drawing (`DRAWING_AUDIT.md` grupo C).
- **As Found:**
  - LICBR1001A (drum level 1 element, ABC-010): range -24 ~ 74 mm mula sa parameter workbook; ang drawing ay "-422 ~ 820 mm" (pareho ng LICBR1001 / LICBR1001B).
  - ABC-008 AND B74 (force manual ng PICFG108A sa M.0204): ang input na "B.0664" ay hindi nakakabit (laging 0); ang FURNACE PRESSURE (A) SIG.AB sa kaliwa ng sheet ay B.0644.
  - ABC-004B / 004C: baligtad ang pangalan ng "<1 %" at TONS 2 s (M.0154 / M.0156, M.0164 / M.0166). Pangalan lang, pareho ang logic.
- **Work Done:** (`DRAWING_TRACE.md` beta.3, `UNLINK_AUDIT.md` 3) range ng LICBR1001A mula sa drawing (inilalapat pagkatapos ng parameter workbook sa bawat Reset); B74 input = B.0644; tamang pangalan ng 4 na signal. Walang inalis na link.
- **As Left:** `tests/engine/audit230c.js` 5 / 5 PASS (range -422 ~ 820 span 1242; tatlong SIG.AB → B74 = 1; mga pangalan). Build at check SAME. Regression sa beta.3 html: hmi_op 34 / 34 (kasama ang drum level loop), unit_load 19 / 19, audit230 19 / 19, audit230b 4 / 4, tests.js 11 / 11, world 11 / 11, isolated PASS.
- **Status:** Pass ang test ng ayos.

## beta.4 — Itsura: trace at status bar (user, 2026-10-19)

- **Problem:** User: "pag nagtrace may glow effect" (pangit, mahirap basahin); ang UAT / CHECK button ay nakalutang at tumatakip sa sheet list.
- **As Found:** ang trace ay blur na liwanag sa paligid ng wire (CSS drop-shadow); ang ibang wire ay 35 % pa rin ang liwanag. UAT / CHECK ay `position: fixed` sa ibabang kaliwa, sa ibabaw ng sheet list.
- **Work Done:** (itsura lang, walang binago sa logic o engine) ang na-trace na wire mismo ang may kulay: puti = pinili, asul = pinanggagalingan, magenta = pinupuntahan; mas makapal, walang blur; ang ibang wire 18 %. UAT at CHECK nasa status bar na (katabi ng Events).
- **As Left:** screenshot ng ABC-010 trace ng LICBR1001A.MV (malinaw na asul na linya, walang blur; UAT / CHECK sa status bar, hindi na natatakpan ang sheet list). tests.js 11 / 11, check SAME.
- **Status:** Pass. Susunod (hinihintay ang pili ng user): pangalan at icon ng exe / apk, Loop view, value sa bawat block, "Bakit MANUAL?".

## 2.5.0-beta.1 — Pinagsama sa v2.4.0 (2026-10-19)

- **Problem:** Inilabas ang v2.4.0 Stable (bagong shell, icon, pangalan, plant model switch) sa `main` habang bukas pa ang PR #32. Hindi kasama roon ang drawing audit.
- **Work Done:** merge ng `main` sa branch (walang rebase / force push). Bersyon 2.5.0-beta.1. Ang ayos ng UAT / CHECK sa status bar (dating beta.4) ay ibinalik sa ayos ng 2.4.0, dahil ang bagong shell na ang naglalagay sa kanila. Nanatili ang solid na trace (walang glow). Docs inilipat sa `docs/versions/v2.5.0/`.
- **As Left:** sa 2.5.0-beta.1 html: audit230 19 / 19, audit230b 4 / 4, audit230c 5 / 5, tests.js 11 / 11, world 11 / 11, ditl150 9 / 9, hmi_op 34 / 34, unit_load 19 / 19, plant_view 18 / 18 (test ng 2.4.0), isolated PASS, check SAME.
- **Status:** Pass.
