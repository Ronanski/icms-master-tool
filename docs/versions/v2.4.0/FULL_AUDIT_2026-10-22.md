# FULL AUDIT ng v2.4.0 Stable — engine, logic, UI / UX, display (2026-10-22)

Utos ng user (2026-10-22): "Perform maximum, full audit, on its engines, logic, UI and UX, and overall display. Report findings and summary and action needed."

**Sakop:** `main` = Stable v2.4.0 (`dist/logic-sim-v2.4.0.html`, commit 65cfb47). Walang binagong code sa audit na ito (report lang). Tiningnan din sandali ang dalawang bukas na Beta line (PR #34 2.5.0-beta.20, PR #37 3.1.0-beta.7) para sa mga bug na nakita rito.

**Paano sinuri (lahat headless Chromium sa cloud, hindi sa totoong tablet / apk / exe):**
- Build: `node tools/build/build.js --check` → SAME (ang html ay eksaktong galing sa `src/`).
- 29 regression / engine test (listahan sa seksyon 4), kasama ang CHECK panel (lahat ng plant scenario) at UAT dry run.
- UI: 5 laki ng screen (PC 1920 × 1080, PC 1366 × 768, tablet landscape 1280 × 800, tablet portrait 800 × 1280, phone 390 × 844), bawat tab (PLANT VIEW, LOGIC ABC, LOGIC DITL, LIBRARY, TOOLS), ⚙, Start ▾, CHECK, UAT, faceplate; sinukat ang overlap, naputol na button, maliit na pindutan, overflow, page error; 40+ screenshot.
- Code: prettier check, engine dependency map, mga ASSUMED na constant ng plant model.

---

## 1. BUOD (para sa user)

| Bahagi | Hatol |
|---|---|
| **Engine (ABC)** | **Matibay.** 54 sheet, 5128 net: engine mag-isa = buong app; Reset 51 sheet 0 differ; 438 switch 0 mali; force manual 68 / 0; scenario 244 / 0; hmi_op, unit_load, unit_trip, loaddown, world, ditl150 lahat PASS. Walang page error. |
| **Logic (drawing ↔ app)** | **Tama ayon sa ebidensya.** F(X) 89 table, parameter 136 row, AI range 157: ang mga pagkakaiba ay kilala at may desisyon na (seksyon 3). Ang isang FAIL ng `pid_am` (FIC-CM) ay mali ng TEST, hindi ng app (seksyon 3, L-1). |
| **UI / UX** | **May 1 MATAAS na bug:** ang menu ng **Start ▾** ay bumubukas pero NATATAKPAN sa lahat ng screen (tablet, phone, at PC kapag naka-tab ang PLANT VIEW) → hindi mapindot ang "At 150 MW", "Cold", "Warm", "Hot", TCS panel, TARGET MW, blowdown. Dagdag: 7 katamtaman / mababang UI isyu. |
| **Repo / proseso** | **Magulo ang Beta:** 3 magkahiwalay na linya (main 2.4.0, PR #34 2.5.0-beta.20, PR #37 3.1.0-beta.7); ang #37 ay WALANG engine / drawing fixes ng #34. Luma ang HANDOFF / README / ilang test default. |

**Pinakamahalagang aksyon:** (1) ayusin ang Start ▾ (UI lang, maliit); (2) piliin ng user kung aling Beta line ang itutuloy at pagsamahin ang #34 at #37; (3) linisin ang HANDOFF.

---

## 2. MGA FINDING — UI / UX at DISPLAY

### U-1 (MATAAS) Start ▾ menu natatakpan — hindi magamit
- **Saan:** PLANT VIEW tab → Start ▾ (top bar). `src/ui/shell/app.css` linya 35: `#gsbar .tbar{…overflow-x:auto;overflow-y:hidden}`; ang menu (`.ddm`, `position:absolute`) ay nasa loob ng `.tbar`, kaya pinuputol ito ng `overflow-y:hidden`.
- **As Found (sinukat):** menu bukas, pero 0 / 10 item ang mapipindot sa 390, 800, 1280, 1366, 1920 px (ang nasa ilalim ay ang plant graphic). Sa PC na may sariling PLANT VIEW window (`pvWindow`) gumagana, dahil inililipat doon ang Start sa `#pvbar` na walang overflow. Kaya ang TALO ay ang **Android tablet / phone** (laging tab) at ang PC kapag naka-Dock.
- **Mula kailan:** 2.4.0-beta.1 (bagong shell). Pareho pa rin sa PR #37 (3.1.0-beta.7: 0 / 10). Ang mga test (`plant_view`, `check_panel`) ay tumatawag ng function, hindi pumipindot sa menu, kaya hindi nahuli.
- **Epekto sa operator:** sa tablet hindi makapagsimula ng planta (150 MW / cold / warm / hot), walang TCS ROLL / SYNC / LOAD UP, walang TARGET MW, walang blowdown valve. Ang CHECK scenario lang ang gumagana (sila mismo ang nagse-set ng estado).
- **Ayos na mungkahi (UI lang, walang galaw sa engine):** ilabas ang menu sa `.tbar` (hal. `position:fixed` na kinukuwenta mula sa button, o ilipat ang `.ddm` sa `body` habang bukas) + test na PUMIPINDOT sa menu sa 390 / 800 / 1366 px.

### U-2 (KATAMTAMAN) Phone: mga button sa ilalim ng 🔍
- **As Found (390 px):** CHECK (`#chkb` 271–326 px) ay kalahating natatakpan ng 🔍 (`#srchbtn` 312–346 px) — "CHE…" lang ang kita; sa LOGIC ABC ang View at Fit ay nasa ilalim ng 🔍 / labas ng screen; sa DITL ang sheet select ay nasa ilalim ng 🔍. Ang toolbar ay naka-scroll pahalang pero walang scrollbar (`scrollbar-width:none`), kaya hindi alam ng user na may iba pang button (◀◀ ▶▶, step, Values, Wire, Panel, Sheets).
- **Mungkahi:** ilagay ang 🔍 / ⚙ sa unang hilera (katabi ng tabs) sa phone, o maglagay ng "⋯ More" na menu para sa natitirang tools.

### U-3 (KATAMTAMAN) PLANT VIEW sa tablet portrait / phone: maliit na graphic
- **As Found:** 800 × 1280: ang system list ay laging 200 px; ang UNIT graphic ay ~25 % na laki (hindi mabasa), malaking bakante sa itaas at ibaba. 1366 px: ang text sa graphic ay ~7 px. Phone: may "☰ Systems" na button (mabuti), pero ang graphic ay ~20 %.
- **Mungkahi:** sa portrait, gawing nakatagong drawer ang system list (gaya ng phone) at "Fit to width"; sa UNIT screen, mas malaking font o layout na pababa (3 kahon na patayo).

### U-4 (KATAMTAMAN) UNIT screen: text lumalabas sa kahon
- **Saan:** `src/ui/plant/systems.js` linya 85 ("The plant model: coal -> steam made …") at 110 ("Reheat pressure follows the steam flow …"): isang mahabang linya na walang wrap → tumatawid sa kahon ng DRUM papunta sa TURBINE at naputol sa kanang gilid.
- **Mungkahi:** hatiin sa 2 ~ 3 linya (UI lang).

### U-5 (KATAMTAMAN) CHECK panel: Tagalog sa loob ng app at hindi nagsasara
- **As Found:** ang CHECK panel ay "Isang pindot bawat scenario…", "Ginagawa", "Inaasahan", "▶ Takbo", "PASADO". Labag sa PROJECT_RULES 5f (ang app text ay professional English; ang docs / chat ang Taglish). Hindi rin nagsasara sa Esc at nananatiling bukas kapag lumipat ng tab (natatakpan ang UAT at ang faceplate sa PLANT VIEW).
- **Mungkahi:** isalin sa English ang `src/ui/uat/check.js` (title, Ginagawa → Steps, Inaasahan → Expected, Takbo → Run, PASADO → PASS); isara sa Esc at sa paglipat ng tab.

### U-6 (MABABA) Unang bukas ng app = LOGIC → DITL
- **As Found:** bagong install / walang naka-save: `ls-tab` = 'logic' at ang category ay DITL (`src/analog/boot.js`). Ang prayoridad ng user ay ABC at ang operator view.
- **Mungkahi:** unang bukas = PLANT VIEW (o LOGIC → ABC).

### U-7 (MABABA) Estado bago mag-Start ay hindi pisikal
- **As Found (bagong load, walang Start):** sa UNIT screen sabay na makikita ang drum 125 kg/cm2 pero MSP 75, MW 0 pero 3600 rpm, drum level −567 mm (alarm), bed 850 °C na walang coal. Ito ay mga panimulang value ng drawing / range, hindi isang planta.
- **Mungkahi:** banner na "Plant not started — Start ▾" hanggang pumili ang user, o awtomatikong Cold / 150 MW sa unang bukas (desisyon ng user).

### U-8 (MABABA) Maliit na pindutan para sa daliri
- **As Found:** tablet portrait: L / C / R ng DITL 19–20 × 24 px, Legend & style 24 px, Events 24 px, faceplate inputs 22–23 px (target ≥ 32 px sa touch, ayon sa sariling rule ng 2.4.0-beta.2). Ang "Review marks" sa TOOLS ay mukhang naka-ON (asul) kahit button lang.

### U-9 (MABABA) Hint ng TOOLS ay hindi tugma
- Ang hint ay "…project files, drawing edit", pero sa ABC hindi nakikita ang "Project files" / "DITL drawing edit" card (lumalabas lang sa DITL). Ang "ABC+DITL OFF" ay mukhang estado, hindi button.

---

## 3. MGA FINDING — ENGINE at LOGIC

### L-1 Test `pid_am` FAIL sa FIC-CM (ABC-004A) — mali ng TEST, tama ang app (b)
- **As Found:** `pid_am` FAIL 1 / 66: FIC-CM output 0, inaasahan 32.49. Pareho sa v2.2.0 (sinubok ang html ng 9b0ae85). **Ang UPDATE_REPORT ng v2.4.0 at v2.2.0 ay nagsabing "pid_am PASADO" — hindi totoo.**
- **Ebidensya:** ang AMT#2 / #3 / #11 ng FIC-CM ay may BU-CMD na aktibo sa cold state (`st.bu = 0`, `fman = 1`): ang drawing ang naghahawak ng output (CLAUDE.md 10, M.0130: FIC-CF / PA / SA hindi pa REMOTE). Hindi ito nililinis ng test bago sumubok ng MANUAL.
- **Aksyon:** `tests/regress/pid_am.js`: kapag `st.bu != null` bago ang manual step → "NOT TESTED: BU-CMD active (drawing)" o i-clear muna ang kondisyon ng drawing; itama ang dalawang report.

### L-2 `pv_reacts` (diagnosis lang) — walang bagong bug
- Cold: 42 / 68 sumasagot, 8 walang reaksyon, 18 MV hindi tinanggap. `--running`: 46 / 7 / 15. Ang lahat ng nakalista ay: cascade master (FIC-OM), PV na kinukuwenta ng drawing (HS-COAL, PIC-BASC), fan na nakahinto sa isolated sheet (PICFG108), o BU-CMD / force manual ng drawing (isang sheet lang ang tumatakbo sa test na ito). Sa buong planta (hmi_op 150 MW) lahat PASS. **Tooling bug:** `node tests/regress/pv_reacts.js --running` (walang html) ay nag-crash (ang `--running` ay binabasa bilang html); gumagana kapag may html.

### L-3 refcheck — mga kilalang pagkakaiba, may desisyon (b)
- F(X): 89 table, 4 "differ" = LN15 / LN21 (ratio curve na naka-factor), LN38 / LN39 (galing sa drum-level-calculation.xls) — kilala.
- Parameter: 136 row, 1 diff = MAN ABC-020 HICHR1002A ML (test: 19, app: 10). Ang app ay TAMA ayon sa 2.2.0-beta.21 (ML 10 % ng posisyon; 39.PNG 11 %; PR-OPE-5003 "RH = 10 %"). **Ang refcheck ang luma** (span mapping pa).
- AI range: 157 tag, 0 differ; 2 hindi makita sa I/O list ayon sa tag: ABC-054 S2 AI0737, ABC-057 S1 AI0288 (PT-FA1085).
- **Tooling bug:** default html ng `refcheck.py` ay `logic-sim-v1.20.29.html` (wala na) → crash kapag walang argument.

### L-4 Mga ASSUMED na constant ng plant model (hindi bug; pagkakataon)
- `src/analog/engine/unit.js`: ~25 ASSUMED (storage C, firing lag, tauMW, tcs, HP / LP bypass size, reheater volume Crh 400, rhb 0.1, cIP 0.6, ksu 30 %, kcool, kamb, burnt share 350 → 600 °C, saturation = 47.1 × ln(P + 1) ±20 °C, tubig 200 t).
- Ang `boiler-cfb-design-operation-manual.zip` at `flow-diagram-K1AU3-A1-0-001.zip` (idinagdag ng user 2026-10-17) ay malamang may valve size, water volume at reheater data. **Ang M4 kilalang isyu (RH 9.1 sa bypass stage, CHECK 16 / 17) ay galing mismo sa rhb 0.1 ASSUMED.** Mungkahi: palitan ang mga ito ng data mula sa manual / flow diagram, at steam table (IAPWS) sa halip na ln formula.

### L-5 Live values na nagkakapatong (kilala)
- `values_layout`: 2434 label, 21 "deep" (dati 26), 33 / 54 sheet may maliit na patong (wire 101, block 65, text 13, value 4). Pinakamarami: ABC-050, 007, 008, 027, 031. UI lang.

---

## 4. MGA TEST NA TUMAKBO (headless, html v2.4.0)

| Test | Resulta |
|---|---|
| build --check | SAME |
| tests.js (T1 ~ T5, S1 ~ S6) | PASS |
| engine isolated (54 sheet, 5128 net) / deps | PASS / core kailangan lang ng `AN` |
| reset | 51 sheet, 0 differ |
| switches | 438, 0 mali |
| force_manual | 68 / 0 |
| pid_am | **FAIL 1** (FIC-CM, mali ng test: L-1); 55 PASS, 10 NOT TESTED |
| faceplate, panel_sync, manstation, overview, infocard, abcbar, lookonly, events, stale_beta, inapp_update, ditl_toolbar | ALL PASS |
| plant_view, plant_live, world (4.8 ms / scan), ditl150, loaddown | ALL PASS |
| hmi_op (snapshot 150 MW) | ALL PASS |
| unit_load (M2), unit_trip (M3, 6 / 6) | ALL PASS |
| scenarios | 244 tama, 0 mali |
| check_panel | 18 / 19 (1 = kilalang M4 RH, seksyon 4a) |
| UAT dry run | 2547 item / 6998 case, 0 mali |
| refcheck | L-3 (kilala) |
| values_layout | L-5 (kilala) |
| pv_reacts | L-2 (diagnosis) |
| prettier --check | 30 file hindi naka-format (code style lang; 2 file ay bahagi ng iisang closure, hindi ma-parse nang mag-isa — normal) |

### 4a. CHECK panel at UAT dry run
- **CHECK panel (24 min real):** 18 / 19 scenario PASADO — M2 load 14 / 14; M3 turbine trip 10 / 10, MFT 7 / 7, BFWP 7 / 7, IDF 7 / 7, PAF 6 / 6, drum HH 3 / 3; M4 cold 10 / 10, coal 9 / 9, bypass 8 / 8, roll 11 / 11, 45 → 150 MW 14 / 14; M5 load down 14 / 14, normal shutdown buo PASS, bottle-up 15 / 15; "one address = one value" 3 / 3. **Ang 1 ✗ = kilalang isyu:** M4 Cold start-up (buo) 16 / 17, RH pressure 9.0 kg/cm2 (7.5 ± 1.5) sa bypass stage = rhb 0.1 ASSUMED (L-4). Walang bago mula v2.2.0.
- **UAT dry run (block test ng bawat sheet, 10 min):** 2547 item / 6998 case, **0 mali** (switch 314, COS 55, gate 647, FF 47, comparator 230, ALM 103, valve 81, math 282, timer 156, F(X) 106, AI 136, MAN 58, SUMA 7, PID 66, ramp 38, lag 12, average 60, iba pa 76). Pareho sa 2.2.0-beta.24.

---

## 5. REPO at PROSESO

- **P-1 (MATAAS) Tatlong Beta line na naghihiwalay:** `main` = 2.4.0; PR #34 (`claude/project-thread-yezgyg`) = 2.5.0-beta.20 (UI + drawing audit #32 + engine audit fixes; ang title ng PR ay "beta.4" pa); PR #37 (`claude/design-system-extraction-4dogzg`) = 3.1.0-beta.7 (bagong itsura) na **HINDI naglalaman ng #34**. Ang `/beta/` page ay laging ang HULING na-push na branch, kaya nagpapalitan ang 2.5 at 3.1 sa tablet ng user. Kailangan: desisyon ng user kung alin ang base, tapos pagsamahin (engine fixes ng #34 + itsura ng #37), isang Beta line lang.
- **P-2 Anumang push (kahit docs lang) ay pumapalit sa `/beta/` page** (`site.yml` ay sumusunod sa bawat matagumpay na Checks). Kaya ang commit ng audit na ito ay may `[skip ci]` para hindi mapalitan ang Beta ng user.
- **P-3 HANDOFF.md ay hindi "single current"**: 228 linya ng kasaysayan (2.2.0-beta.9 ~ beta.24, v1.20.x "State", dalawang "3." sa Next actions); hindi binabanggit ang PR #34 / #37. README at `tests/regress/README.md` / `refcheck.py` / `package.json` (1.20.35) luma.
- **P-4 Branch cleanup:** 15 lumang branch pa rin (listahan sa HANDOFF); ang user ang magde-delete sa GitHub web.
- **P-5 Mga report na nagsasabing PASS pero hindi:** `pid_am` (L-1), at ang Start ▾ ng 2.4.0-beta.2 ("OPERATE Start 150 MW" ginamit) — ang test ay JS click, hindi pindot sa screen. Mungkahi: ang UI test ay pumipindot sa tunay na posisyon (elementFromPoint).

---

## 6. ACTION NEEDED (sunod-sunod)

| # | Aksyon | Sino | Laki |
|---|---|---|---|
| 1 | **Ayusin ang Start ▾ (U-1)** + test na pumipindot sa menu; isama ang U-2 (phone 🔍) | AI, sa Beta line na pipiliin ng user | maliit, UI lang |
| 2 | **Piliin ang Beta line (P-1):** "2.5 (#34)" o "3.1 (#37)" bilang base; pagsasamahin ko ang kabila | **user** | desisyon |
| 3 | CHECK panel sa English + Esc / tab close (U-5); UNIT text wrap (U-4) | AI | maliit |
| 4 | Ayusin ang tests: `pid_am` BU-CMD, `refcheck` default html at HICHR1002A ML, `pv_reacts --running` (L-1 ~ L-3) | AI | maliit |
| 5 | PLANT VIEW sa tablet portrait (U-3), unang bukas (U-6), "not started" banner (U-7), touch size (U-8) | AI, pagkatapos ng OK ng user | katamtaman |
| 6 | Plant model: palitan ang ASSUMED ng data ng boiler manual / flow diagram (L-4) → ayos ng M4 RH 9.1 | AI, pagkatapos ng OK | malaki |
| 7 | Linisin ang HANDOFF (P-3), i-delete ang lumang branch (P-4) | AI / user (delete) | maliit |
| 8 | Subok sa totoong tablet / apk / exe pagkatapos ng #1 | **user** | — |

**Hindi nasuri:** totoong Android tablet, apk, portable exe (cloud lang); ang PR #34 / #37 ay sinilip lang para sa U-1 (hindi buong audit); ang DITL logic ay hindi isa-isang sinuri laban sa PDF (CHECKLIST B: lalaktawan ayon sa user).
