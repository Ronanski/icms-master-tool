# Engineering audit ng buong app (3.2.0-beta.6, 2026-10-22)

Utos ng user (2026-10-22, 7:09 PM PHT): "DCS SIMULATOR / LOGIC SIMULATOR — COMPREHENSIVE ENGINEERING AUDIT, ENTERPRISE REDESIGN & QUALITY IMPROVEMENT" (14 section). Ang UI audit (sec 2, 3) ay nasa audit report ng 3.1.0-beta.7 at sa `UPDATE_REPORT.md` (beta.1 ~ beta.6). Ang file na ito ang sagot sa iba pang bahagi: engine (sec 5, 7, 12), import (sec 4), signals at HMI (sec 6, 8, 9), at ang pinagsamang backlog (sec 10).

Batayan ng bawat "tama": ang drawing PDF / DXF, ang legend ABC-000 / DITL, ang PID / MAN / SUMA parameter summary, ang I/O at memory list, at ang operating procedure (CLAUDE.md "HINDI NAGBABAGO NA KAALAMAN" 4). Ang test ay gumagamit ng TOTOONG engine ng built html (headless Chrome, parehong engine ng EXE at APK).

⟨SUMMARY⟩

## 1. Ang repo at ang arkitektura (sec 1)

- **Iisang html file** ang app: `node tools/build/build.js` → `dist/logic-sim-v<ver>.html` (12.9 MB). `npm run check` = ang naka-commit na html ay eksaktong build ng `src/`.
- **ABC (analog)**, isang closure (`src/analog/order.list`):
  - reader `src/analog/reader` (DXF → geometry → shapes / nets / pins / blocks / params, 2,593 linya)
  - engine `src/analog/engine` (compile, step, plant model, unit model, HMI ops, links, 11,528 linya)
  - UI `src/analog/ui` (13,579 linya)
- **DITL (digital)**, global script (`src/digital/order.list`):
  - parse at netlist: `01`, `02`
  - models (valve / motor): `03`
  - `simulate()` at render: `04`
  - timers `tmStep()`: `05`
  - panels at events: `06`, `07`
- **Iisang mundo ABC ↔ DITL:** `src/world/world.js` (OFF bilang default, CLAUDE.md 7), at ang 150 MW na estado ng DITL: `ditl150.js`.
- **Shell, Plant view, HMI faceplate at in-app UAT / CHECK:** `src/ui/*`.
- **Data na nasa app:**
  - 54 ABC sheet
  - 241 DITL sheet: boiler 134, sootblower 17, bottom ash 67, limestone 23
  - 30 Plant view screen
  - 89 F(X) table
  - PID / MAN / SUMA parameters
- **Execution cycle:**
  - ABC: `AN.stepSet(sheet, dt)` ay humahakbang sa sheet at sa lahat ng naka-link na sheet. Ang dt ng RUN ay 0.25 s.
  - DITL: `simulate()` ay umuulit hanggang tumahimik ang lahat ng net. Isang net ang binabago bawat ikot, kaya natatapos nang tama ang cross-interlock. Ang FF, TMR at CNT ang may memory.
- **Tests:** 56 file sa `tests/regress` (+ `engine_units.js` ngayon).

## 2. Engine verification (sec 5, 7, 12)

### 2a. Bagong test: `tests/regress/engine_units.js` (57 check, ⟨EU⟩)

Ang inaasahang value ay isinulat mula sa legend, hindi binasa mula sa engine.

| Bahagi | Input | Inaasahan | Aktuwal |
|---|---|---|---|
| DITL AND (2 at 3 input) | lahat ng 4 / 8 kombinasyon | 1 kung lahat 1 | tugma, 12 / 12 |
| DITL OR (2 at 3 input) | lahat ng kombinasyon | 1 kung may isang 1 | tugma, 12 / 12 |
| DITL NOT | 0, 1 | 1, 0 | tugma |
| DITL flip-flop (walang bilog) | S, bitaw, R, bitaw, S + R | 1, 1, 0, 0, **0 (reset wins)** | tugma |
| DITL flip-flop (bilog sa S) | pareho | 1, 1, 0, 0, **1 (set wins)** | tugma |
| DITL comparator, SP 5 | 5, 5.01, 4.99 para sa > >= < <= | hangganan: ang > 5 ay hindi 1 sa 5.00 | tugma, 6 / 6 |
| DITL ON DELAY 5 s | input 1 | 1 sa 5.00 s; 0 agad kapag 0; 3 s + puwang + 3 s = 0 pa rin | tugma |
| DITL OFF DELAY 5 s | 1 tapos 0 | 1 agad; 0 sa 5.00 s | tugma |
| DITL PULSE 2 s | hawak na 1; mga bagong edge habang tumatakbo | 0 sa 2.00 s; hindi humahaba | tugma |
| DITL falling PULSE 2 s | 1 tapos 0 | 0 habang 1; 1 hanggang 2.00 s mula sa pagbaba | tugma |
| ABC F(X), 89 block | bawat punto, gitna ng bawat segment, ibaba ng una, itaas ng huli | value ng table; walang extrapolation sa labas | tugma, 89 / 89 |
| ABC DIV ÷ 0, 14 block | numerator 50, denominator 2 → 0 | hawak ang 25, walang Inf / NaN | tugma |
| ABC H / L limiter | H 80, L 20: 50, 95, 5, 80, 20 | 50, 80, 20, 80, 20 | tugma |
| ABC flip-flop, 48 block | S, bitaw, R, bitaw, S + R | 1, 1, 0, 0, 0 (reset wins, ABC-000) | tugma, 48 / 48 |

Dalawang paalala mula sa pagsulat ng test:

- **Oras ng timer.** Ang input ay nagbabago sa simula ng 0.25 s na hakbang, at ang output ay binabasa sa dulo. Ang pulse na 2 s ay bumabalik sa 0 eksaktong 2.00 s mula sa edge. Pareho ito ng ON / OFF delay. Hindi ito mali.
- **LN44 ng ABC-004A.** May patayong hakbang sa table (dalawang punto sa X = -1: 1 at 0). Sa mismong X = -1, ang app ay nagbibigay ng 1 (ang unang punto). Ang drawing ay walang sinasabing value sa mismong hakbang, kaya sa tabi lang nito sinubok.

### 2b. Ang mga dati nang test, pinatakbo ulit sa 3.2.0-beta.6

⟨REGRESS⟩

### 2c. Ano ang tama, ano ang approximation (sec 5)

- **Tama ayon sa drawing (may test):** gate, flip-flop priority, timer, comparator, F(X), DIV, limiter, A/M station at switch (`switches` 438 kaso), force manual (CLAUDE.md 2, 10), PID auto / manual na bumpless (`pid_am`, `pid_auto`), MAN station (`manstation`), at reset na pareho ng bagong bukas (`reset`).
- **Approximation para sa pag-aaral (CLAUDE.md "plant physics", user 2026-10-17):**
  - Ang plant model (`src/analog/engine/plant.js`, `unit.js`) ay ideal: lag, storage at gain na kinuha sa FHI design data at sa HMI snapshot, hindi sa first-principles na modelo.
  - Ang SQRT ay identity (desisyon V-18: ang AI ay tunay nang flow).
  - Ang dt ay 0.25 s, kaya ang oras ng timer ay may resolution na 0.25 s.
- **Hindi mabasa sa drawing (may pangalan ng bahagi):**
  - ramp ng coal feeder AUTO-MV (ABC-004A ~ C)
  - ramp ng LP bypass preset (ABC-052)
  - ABC-FLAME (DWG lang, walang PDF)

  Value ng app ang ginamit sa mga ito (`DRAWING_AUDIT.md`).

## 3. Import at parsing (sec 4)

| Format | Saan sa app | Paano | Pagsuri |
|---|---|---|---|
| ABC DXF | built-in (54 sheet) at **Import ABC DXF** ng user | sariling DXF tokenizer → geometry → shapes / nets / pins / blocks (`src/analog/reader`) | 50 / 50 sheet laban sa PDF (`v2.5.0/DRAWING_AUDIT.md`: 30 mali sa 22 sheet, naayos lahat); **Review marks** sa drawing kung saan hindi nakilala ang hugis, kulang ang pin, walang table ang F(X) o walang span ang RATE; **Health** ng bawat sheet; **Imports** = listahan ng iba sa built-in |
| DITL DXF | built-in, ginawa offline (`tools/data/ditl_import.js`) | DXF → table rows / gates / timers / FF / connectors (`01`, `02`) | 134 boiler sheet laban sa PDF (`DITL_PDF_AUDIT.md`, 39 sheet na may mali, naayos), sootblower 17 (`DITL_SB_AUDIT.md`), bottom ash 67 (`DITL_BA_AUDIT.md`), test `ditl_pdf`, `ditl_sb`, `ditl_ba` |
| XLS (limestone) | built-in, offline (`ls_xlsx.py`, `ls_import.js`) | border ng cell = wire | 23 sheet (`DITL_LS_AUDIT.md`), test `ditl_ls` |
| PDF | hindi ini-import | batayan lang ng audit (300 ~ 600 dpi na pinalaki) | ang sand silo 770 ~ 777 ay PDF lang (vector, walang text): hindi pa page |
| DWG | hindi diretso | kailangang gawing DXF muna | ABC-FLAME: DWG lang, hindi mabasa rito |

Health ng reader sa 3.2.0-beta.6 (bawat sheet, sa app mismo): ⟨IMP⟩

Mga panuntunan na sinusunod na:

- Walang link na inimbento o tinanggal para lang gumana (CLAUDE.md 9, `UNLINK_AUDIT.md`).
- Ang wire na tumatawid nang walang tuldok ay hindi pinagdudugtong.
- Ang hindi nabasa ay may amber na Review mark, hindi tahimik na hinuhulaan.

## 4. Signals, forcing, HMI at scenarios (sec 6, 8, 9)

⟨SIGNALS⟩

## 5. Backlog P0 ~ P3 (sec 10)

⟨BACKLOG⟩

## 6. Hindi nasubok, limitasyon, panganib (sec 12, 14.9)

⟨LIMITS⟩
