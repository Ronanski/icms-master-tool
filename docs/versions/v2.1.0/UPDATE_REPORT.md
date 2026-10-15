# v2.1.0 (target ng susunod na Stable) — mga Beta

Base: Stable v2.0.0 (`main`). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f).

## 2.1.0-beta.9 — LIBRARY: makikita ang VACANT sa memory list at wiring

- **Problem (user):** Sa wiring at memory list, ipakita ang mga vacant gaya ng sa I/O list.
- **As Found:** Ang embedded memory list (ADES) ay may address lang na may description o remark: STN101 WM 1638 sa 3504 row ng Excel. Ang wiring ay may 980 channel na walang tag at description, pero blangko lang ang itsura.
- **Work Done:** `tools/data/memspace.py` → `src/ui/plant/memspace.js` (mga address na walang description sa Excel, naka-run [unang address, bilang]; hex sa M. / B. / DB). Sa LIBRARY: lahat ng address ng bawat memory sheet ay nakalista gaya ng Excel; ang bakante ay "— vacant —" (grey); ang I/O at wiring channel na walang tag at description ay vacant din. Ang header ng grupo ay may bilang ng vacant. Ang search na "vacant" / "spare" ay naghahanap sa kanila.
- **As Left (headless, `tests/regress/lookonly.js`):** STN101 WM = 3504 row, 1866 vacant (gaya ng Excel); I/O STN101 node 0 unit 0: 32 row · 11 vacant; wiring STN101 AIO: 320 · 81 vacant. Walang page error.
- **Hindi pa nasubok:** totoong tablet.
- **Status:** Beta.

## 2.1.0-beta.8 — Search = tingin lang; LIBRARY naka-grupo gaya ng Excel

- **Problem (user):** (1) Kapag search lang, hindi dapat makapag-force / simulate, kahit hindi makita ang current value. (2) Sa LIBRARY, i-grupo gaya ng Excel (per sheet, may groupings).
- **As Found:** Ang result ng global search, ang info card ng search / LIBRARY at ang "Show" ay nagbubukas ng sheet sa kasalukuyang mode (RUN o DITL Simulate). Ang LIBRARY ay isang mahabang listahan. Sa Excel: ang I/O list ay may sheet bawat station at ang address ay naka-ayos sa NODE (N) / I/O UNIT (I) / channel (NO); ang memory list ay may workbook bawat station at sheet bawat uri (WM, TR, PTN, SI, DI, WB, FP).
- **Work Done (UI lang):**
  - `AN.lookOnly()` (`src/analog/boot.js`): ABC → VIEW / TRACE; DITL → Simulate off. Tinatawag sa: result ng global search (sheet / text / drawing hit), hit sa side search, "Show" ng info card na binuksan ng search o LIBRARY. Ang info card na galing sa search / LIBRARY ay walang "= value".
  - LIBRARY: `tools/data/iogroups.py` → `src/ui/plant/iogroups.js` (3816 address: N, I, NO, PICT). I/O LIST: grupo "STN10x · NODE n · I/O UNIT i · uri", rows ayon sa channel, PICT sa Range / remark. MEMORY LIST: grupo "STN10x (WM) · word memory (M.)", TR, PTN, SI, DI, WB, FP. WIRING: station · uri · FCS cabinet. RELAY / SER: panel sheet. Ang header ng grupo ay pindot = bukas / sara; walang search = sarado lahat, may search = bukas ang may tugma.
  - Ang PLANT workspace (LIVE) ay hindi apektado: doon, ang click ay may value pa rin.
- **As Left (headless, `tests/regress/lookonly.js`):** 219 I/O grupo, 7 memory sheet bawat station; LIBRARY card walang value; Show → VIEW; global search → Show → VIEW; DITL Simulate + DITL result → Simulate off. `infocard.js`, `abcbar.js`, `plant_live.js` pasado.
- **Hindi pa nasubok:** totoong tablet.
- **Status:** Beta.

## 2.1.0-beta.7 — DITL page: "ALSO IN ABC"

- **Problem (user):** "Hindi lang DITL. Dapat kung meron din sa ABC." Sa DITL page, ang napiling signal ay hindi nagpapakita kung saan ito ginagamit sa ABC.
- **Work Done (`src/ui/shell/info.js`, `shell.css`, UI lang, read only):** kapag pumili ng input / output cell sa DITL na may address o tag na nasa ABC din, lalabas sa ibaba ang bar na **ALSO IN ABC**: ang mga ABC sheet (may station), pindot = buksan ang sheet na iyon (at ang info card); **ⓘ** = info card (source, used by, Effects sa lahat ng ABC sheet na naaabot). Nawawala kapag walang napili.
- **As Left (headless, `tests/regress/abcbar.js`):** DITL-01, M.3302 (PAF running) → ABC-007, ABC-008, ABC-055 (STN101); ⓘ → info card; walang page error. `infocard.js` pasado.
- **Hindi pa nasubok:** totoong tablet.
- **Status:** Beta.

## 2.1.0-beta.6 — Start at 150 MW: mas tugma sa HMI (plant model)

- **Problem:** Sa PLANT LIVE, 66 nakakabit na tag (full-load) ang lumalayo sa snapshot pagkatapos ng Start at 150 MW.
- **As Found:** (1) Ang plant model ng loop na walang anchor (13 lang ang naka-anchor) ay may sariling steady state at isinusulat ito sa transmitter. (2) ABC-008: ang hydraulic coupling PICFG108 at inlet damper PICFG108A ng ID fan ay SERIES, pero ang model ay nagdadagdag (parallel). Ang MV preset 13 % sa pagtakbo ng ID fan (M.020E) ay pumapalit sa MV ng snapshot habang naglo-load; ang hydraulic select (FF M.0202) ay 0. (3) ABC-010: ang drum level model ay sumusulat sa drum pressure (compensation, AI0128 → 0) at ang FW flow model sa FW temperature (TIFW1160 → 300 °C).
- **Work Done (engine, plant model lang; trace: `DRAWING_TRACE.md`):**
  - Start at 150 MW: ang PV ng bawat loop ay kinukuha mula sa snapshot transmitters (plant model OFF sandali), saka naka-anchor ang loop sa (kasalukuyang MV → PV ng snapshot). Hindi: static anchor, drum level, measurement na kahati sa ibang sheet, flow na 0 o sarado ang valve. Nawawala sa Reset.
  - ABC-008: series = produkto ng dalawang bukas; PICFG108 (A 46.1 %), PICFG108A (M 99.1 %), M.0202 = 1 (7.PNG); ang MV ng snapshot ay ibinabalik pagkatapos ng 10 s.
  - Plant model ay sumusulat lang sa transmitter na kapareho ng unit ng PV.
- **As Left (headless):** mismatch 66 → 44; furnace pressure −16 mmH2O at PICFG108 AUTO 46.1 % (gaya ng 7.PNG); drum pressure 134.2. Regression: isolated PASS, tests PASS, reset 0 differ, hmi_op 24 / 24, faceplate PASS, plant_live PASS, scenarios 244 / 0.
- **Hindi pa nasubok:** totoong tablet; ang 44 natitirang tag (listahan sa `PLANT_LIVE_VS_SNAPSHOT.md`). Ang generic all-sheets run ay itinigil (luma ang build).
- **Status:** Beta.

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
