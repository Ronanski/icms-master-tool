# v2.1.0 (target ng susunod na Stable) — mga Beta

Base: Stable v2.0.0 (`main`). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f).

## 2.1.0-beta.5 — PLANT workspace LIVE: nakakabit na ang graphics sa simulation

- **Problem:** Ang PLANT HMI graphics (27 system) ay snapshot value lang ("no address linked yet").
- **As Found:** Ang tag sa HMI ay indicator (TIBR11302, FIQMS1031); sa I/O list ay transmitter (TT-BR1130-2, FT-MS1031); ang valve tag (TCV-FW1110-1) ay nakasulat sa drawing sa tabi ng control valve.
- **Work Done (`src/ui/plant/plant.js`, read only, walang engine change):**
  - Bawat value: (1) wire na `TAG.PV` sa sheet, o (2) transmitter ng I/O list (TI → TT / TE, PI → PT, FIQ → FT, LI → LT, DPI → DPT, AI → AT) = ang AI block nito, o (3) ang AI address sa station.
  - Bawat controller box: PV / SV / MV at A / M / R mula sa faceplate.
  - Bawat valve / damper: ang valve tag sa drawing (position demand), o ang AO address ng I/O list.
  - Button **LIVE · N / M linked** (pindot = snapshot ulit). Grey = hindi nakakabit, snapshot value. Click sa nakakabit na value / controller = info card.
- **As Left (headless, `tests/regress/plant_live.js`):** 235 sa 806 item ay nakakabit (27 system); ang MV sa box ng TICBR1140 ay sumusunod sa engine; walang page error.
- **Finding para sa plant model:** 96 na nakakabit na tag ang lumalayo sa snapshot sa "Start at 150 MW" (hal. HP bypass PCVMS1020: HMI 1.0 %, sim 86.7 %; FW flow FIQFW10071: HMI 498.9, sim 550). Tama ang link; ang estado ng simulation ang hindi pa tugma. Listahan: `PLANT_LIVE_VS_SNAPSHOT.md`. Ito ang susunod na trabaho (task: plant model vs HMI).
- **Hindi pa nasubok:** totoong tablet; ang 571 item na hindi pa nakakabit (walang AI block sa drawing para sa tag, o pangalan lang tulad ng "DRUM LEVEL").
- **Status:** Beta.

## 2.1.0-beta.4 — Test Cards: FICFW1007, HS-COAL, PICFG108, AICFG112

- **Problem (task):** Ang force manual ng apat na loop ay may maraming kondisyon; gusto ng user ng gabay na test na galing sa drawing, hindi hula.
- **As Found (trace ng netlist):**
  - **FICFW1007 (ABC-010) M.0228** = OR( NOT LICBR1001B.MAN, BFWP A M.3343 at B M.3344 parehong patay, SIG.AB, M.022E = TON 60 s ng M.022C "MAIN STEAM FLOW < 100 T/H" ). Ang M.022C ay galing sa comparator sa parehong sheet sa connector #1: nakakabit (tama).
  - **HS-COAL (ABC-004A) M.2020** = OR( PIC-COBM.MAN, NOT feeder A (M.3400, TOF 2 s) / B (M.015E) / C (M.016E), NOT "oil valve (1) at (2) close" ng burner A / B / C / D ). Ang mga oil valve close ay description lang sa drawing; sa I/O list: I.0001 / I.0003 (A), I.0321 / I.0323 (B), I.0641 / I.0643 (C), I.0961 / I.0963 (D), STN104.
  - **PICFG108 (ABC-008) M.0205** = OR( NOT ID fan M.3304, MV < 14 %, NOT M.0202 ). Ang M.0202 (FF) ay na-se-set ng CRT "HYDRAULIC CONTROL SELECT" kapag |PICFG108A.MV − F(X) ng PICFG108.MV| < 1 %. Pagtakbo ng ID fan, ang MV ay preset sa 13 % (F(X) = 92.9 %), kaya kailangang itugma muna ang damper PICFG108A MV.
  - **AICFG112 (ABC-002) M.0103** = OR( cross limit ng air (low select BM / SI0019), cross limit ng fuel (high select), M.0102 = NOT FICFA1081.REM o NOT M.0101 (steam flow > 220 T/H, ABC-001C), SIG.AB ).
- **Work Done:**
  - Bagong scenario file: `src/ui/uat/scenarios/ABC-010.json`, `ABC-004A.json`, `ABC-008.json`, `ABC-002.json` (3 ~ 4 card bawat loop: cold start = forced; permissive = clear + A; trip pabalik sa MANUAL).
  - `src/ui/uat/scen.js`: `loop` kada step (pumindot sa ibang faceplate ng sheet, hal. M ng LICBR1001B) at `nth` para sa text na inuulit (oil valve). Walang pagbabago sa engine.
  - UAT panel: ang pamagat na "TEST CARD" ay hindi na may "SCENARIO TEST:" sa unahan.
- **As Left (headless, `npm run scenarios`):** ABC-010 13 / 0, ABC-004A 16 / 0, ABC-008 17 / 0, ABC-002 14 / 0, ABC-007 184 / 0 (kabuuan 244 / 0).
- **Saan sa app:** UAT → piliin ang sheet (ABC-010, 004A, 008, 002) → kahon na "TEST CARD" → ▶ Run.
- **Hindi pa nasubok:** totoong tablet.
- **Status:** Beta.

## 2.1.0-beta.3 — Reset fidelity ayos (51 / 0); IRP / ARP / SER sa LIBRARY at info card

- **Problem:** (1) Pagkatapos ng Reset, 5 sheet ay hindi bumabalik sa simulang value (luma na, nasa v1.23.0 din). (2) Wala pa sa app ang IRP / ARP / SER list (`IRP_ARP_SER.xls` ng user).
- **As Found:** (1) Ang `pr.xsh` (controller sa ibang sheet na kahati sa iisang measurement, hal. reheat temp ABC-019 + ABC-020) ay ginagawa lang ng `procRemote` sa unang load, hindi bago ang settle ng Reset; kaya iba ang PV pagkatapos ng Reset. (2) Walang data file.
- **Work Done:**
  - `src/analog/engine/sheets.js` (`anResetAll`): tinatawag ang `procRemote` ng bawat sheet bago ang settle; ang plant model ON / OFF default ay ibinabalik din.
  - `tools/data/relay.py` → `src/ui/plant/relay.js`: 290 item (SER 144, IRP 105, ARP 41). Pinunan ang merged cell; ang column na walang pamagat = "Remark".
  - LIBRARY: bagong **RELAY / SER** tab (search, station filter, click = popup card).
  - Info card: section na **RELAY / SER** kapag ang address o tag ay nasa list (hal. O.0771 STN103 → ARP-1 item 01; S-MFT → IRP-1 #87, SER-1 #01).
  - UAT G3 (generic): ang inaasahang SV pagkatapos ng "−" ay sumusunod na sa bagong ▲ / ▼ step (dati 39 % ang hinihintay, mali ang test, tama ang app).
- **As Left (headless):** `reset.js`: 51 sheet, 0 differ. Engine isolated: PASS (54 sheet, 5128 net). LIBRARY RELAY / SER "IDF" → 8 row, walang page error.
- **Hindi pa nasubok:** totoong tablet.
- **Status:** Beta.

## 2.1.0-beta.2 — Wiring chart pahalang; "Effects" sa lahat ng sheet (interlock, switch, force manual, trip, TO DITL)

- **Problem (user):** Mas maganda kung pahalang ang wiring flow. Hindi lang dapat trip ang hinahanap, kundi pati ang interlock na apektado, sa lahat ng sheet.
- **As Found:** Ang "Trip?" ng info card ay naghahanap lang ng pangalang TRIP / MFT / STOP at force manual sa iisang sheet; ang ibang sheet ay pangalan lang.
- **Work Done (`src/ui/shell/info.js`, read only):**
  - Wiring chart: kaliwa → kanan na may →, nag-wa-wrap kapag makitid; mas malapad ang card kapag may wiring. DO: "controller → field".
  - **Effects:** sinusundan ang signal pababa sa logic at sa link papunta sa ibang sheet (hanggang 14 sheet). Kada sheet:
    - INTERLOCK: selector pagkatapos ng output ng controller na pumuputol papunta sa back-up leg (`c.dn` ng faceplate);
    - SWITCH: ibang selector na nagpapalit ng leg;
    - FORCE MANUAL / AUTO select;
    - TRIP / MFT;
    - TO DITL.
  - Mga tag sa itaas: TRIP, INTERLOCK, FORCE MANUAL, SWITCH. Walang duplicate na linya.
- **As Left (headless):** AI0129 (main steam flow) → umaabot sa 13 sheet: interlock ng LICBR1001 / 1001A / FICFW1007 (ABC-010), TICBR1130 M.0235 (011), TICBR1150 M.0245 (012), PICMS1006 M.0705 (050), TICHR1012 M.072C (052), PICFG108A M.0202 (008), at iba pa. `infocard.js`: 9 / 9.
- **Hindi pa nasubok:** totoong tablet.
- **Status:** Beta.

## 2.1.0-beta.1 — Info card sa LIBRARY, flow chart ng wiring, CALC (flow compensation, drum level)

- **Problem (user):** Sa LIBRARY, gusto ang popup card na gaya ng (i) sa search. Wala ang flow compensation at drum level calculation. Gusto ng mini flow chart ng wiring (may arrow) sa info card ng address o tag.
- **Work Done:**
  - `src/ui/shell/info.js`: ang card ay may I/O LIST / MEMORY LIST record (station, tag, description, range, type, SIG.AB), **WIRING flow chart** (FIELD → JB → MPL field TB → cross wiring → MPL system TB → system cable → FCS terminal board → I/O module → ADDRESS; baliktad para sa DO), at **FLOW COMPENSATION** kapag ang tag ay may compensation. Gumagana rin para sa address na wala sa drawing.
  - LIBRARY: ang pag-click sa row = info card (ang address / tag ay copy pa rin). Bagong **CALC** tab: 8 flow compensation (station, flow, P / T tag, design value, ap / bp / at / bt) at ang drum level correction table (19 row).
  - `tools/data/calc.py` → `src/ui/plant/calc.js` (mula sa `flow-compensation.xls` at `drum-level-calculation.xls`, ang merged header ay pinunan).
- **As Left (headless):** LIBRARY → FT-MS1031 → card na may I/O record + wiring chart + kung saan ginagamit sa ABC; FT-FA1081 → may FLOW COMPENSATION; CALC tab: 8 flow + drum table; walang page error.
- **Hindi pa nasubok:** totoong tablet.
- **Status:** Beta.
