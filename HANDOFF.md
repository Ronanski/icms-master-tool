# HANDOFF — iisang file ng estado (para sa kahit sinong Claude o account)

Huling update: **2026-11-07 PHT** (LEADER, user "approved ko lahat" sa cleanup): nilinis ang lumang docs at branches; ang mga bagong plant document ay PC-only na (`.gitignore`). Isang rules file na lang ang binabasa ng hook: `docs/handoff/COMMANDMENTS.md`.

Patakaran: palitan ang luma, huwag magtambak ng kasaysayan. Kasaysayan ng bawat Beta: `docs/versions/v3.2.1/UPDATE_REPORT.md` at git log.

## 1. Basahin sa ganitong ayos
1. `CLAUDE.md` — ang COMMANDMENTS (iisang rules), sino ka, at ang 10 DCS kaalaman na hindi nagbabago.
2. **Ang file na ito** — estado, bukas na PR, bukas na findings, susunod.
3. `PROJECT_RULES.md` — source of truth, Beta / Stable, lean test policy.
4. `docs/SPEC.md` — ang gusto ng user (S1 ~ S9).
5. Tunay na estado: `git log --oneline -10 origin/main`, `src/version.txt`, bukas na PR. Kapag iba ang repo sa file na ito, ang repo ang tama; ayusin ang file na ito.
6. Bagong session o account / local Claude Code sa PC: `docs/handoff/LOCAL_TAKEOVER.md` (setup at prompt).

## 2. Kasalukuyang estado
- **Stable:** v3.2.0 (2026-11-03, GO STABLE ng user; = 3.2.0-beta.91, tag at GitHub Release `v3.2.0`). Hindi live-tested ang beta.90 / 91.
- **Beta sa `main`:** **3.2.1-beta.42** (d48f958, 2026-11-06 3:10 AM PHT): PR #141 pinasok: sand DITL-771 DONE (TR314 3 s) / LINE BLOCKAGE reset (umuulit ang conveying cycle), limestone DITL-LS212 isolating valves A ~ H bumubukas mula sa CRT. Hindi live-tested.
- **beta.41** (2026-11-05): split view Inject / Release para sa analog loop check (live PASS ni MINA sa PC 1600 px at tablet 1024 × 768).
- **Rule ng merge (COMMANDMENT 3):** Beta = merge sa `main` kapag pasado ang Checks, walang GO BETA (user 2026-11-06). Stable at manual workflow = GO STABLE lang.
- **Beta site:** kusang nade-deploy pagkatapos ng berdeng Checks sa `main` (`site.yml`, `/beta/`; banner "Update now").
- **Bukas na PR (2026-11-07):** #96 UI overhaul at #93 HMI kit (parehong may conflict; hintay ng desisyon sa style at HMI study). Sarado: #158 at #95. Nasa `team-files/progress/from-pr95/` ang progress files; ang lumang branches ay may backup sa PC (`refs/backup/2026-11-07/*`).

## 3. Mga thread (2026-11-06)
- **JENNIE : COORDINATOR** — project chat; hands off (direkta ang user sa bawat thread).
- **MINA : TESTER** — live loop check at function test, split view (beta.36 ~ 41). Huling gawa: LP heater isolation test (seksyon 4).
- **IRENE : PLANT MODEL** — turbine side + final hookup (`plant.js`, `unit.js`, `world/plantsw.js`, `tcs.js`, `fp-pop.js`).
- **SEULGI : PLANT MODEL (boiler side)** — `src/analog/engine/boiler.js`: diesel, fans, limestone, sand, bottom ash. #141 naka-merge (beta.42). Huwag i-prettier ang `plantsw.js`.
- **JISOO : HMI MOCKUP** — 19 HMI pages (00 ~ 18) nasa app na (temp style). Done.
- **HAEWON : AUDITOR** — HMI audit PASS. **YERI** — PC data search. **WENDY** — full turnover (`LOCAL_TAKEOVER.md`).
- **TZUYU : AUDIT NG DOCUMENTS AT REFERENCES** — audit (Claude Doc https://claude.ai/artifact/DuDeRGgJHSCqzRtdmpsbNU) at ang docs cleanup na ito.
- Naka-save na ideya (huwag pang gawin): CodePLC-style Work Order / fault-finding mode.

## 4. Bukas na findings
Mula sa live test ni MINA 2026-11-05 (beta.41, 028 CONDENSATE, MV-CD1001, DITL-69):
1. ISOLATE: tama ang logic, pero hindi naka-model ang LP heater isolation / bypass (hindi gumagalaw ang pump outlet 16.9, PT-CD1122 6.9, heater outlet 72 / 92 / 116 °C).
2. REINSTATE: "EXECUTED" pero nanatiling 0 % ang valve; ang limit switch FULLY OPEN (I.0280) / FULLY CLOSED sa DITL-69 ay hindi sumusunod sa valve.
3. Pagkagaling sa Split, logic sheet ang lumalabas sa Plant view sa halip na HMI.
4. HMI Expected ay hindi sumusunod sa logic row (split view).
5. Root valve ng transmitter: wala pa sa app.

Plant model at logic:
- LS10 row 7 ROTOFEEDER FAULT walang NOT sa ENABLE gate (salungat sa drawing, hindi binago); LS212 rows 18 ~ 20 (MFT I.0560, 52G1 M.3224, coal feeders M.050A) hindi nakakabit; BA conveyors RUNNING static.
- DITL-28C #B SOV limit switches; pneumatic dampers PCD-FG1056-1, TCV-FG1116 / 1117 fail action hindi alam; AN_MT walang PAF / SAF / FA motor temps.
- UNUSUAL para sa user: hotwell 36.6 laban sa 40 °C; MWP current ~20.7 / 28 A; CCWHE UA 7 % ng clean; SWP current 228 A laban sa SOP 205 ~ 215.
- Starting point 150 MW nagti-trip sa RUN (MFT DITL-03A row 17, "SAF STOPPED = 1"; sanhi hindi pa na-trace); HP bypass hindi sinasara ng saradong MV-MS1391.
- CW live test (beta.18 / 19) HIGH SWBP START permissive at MED trip alarm RESET: naayos sa code (beta.21, f49f91d); live retest wala pang tala.
- Pre-existing regression FAIL (pareho sa `main`): ditl150 "Reset" 1, sop_bawal 10, loop_source 1.

Docs at references (audit 2026-11-06, hindi pa naayos):
- `document-references/tcs-references/Generator Logic.pdf` at `Generator Protection.pdf` ay iisang file (pareho ang md5): kulang ang tunay na isa.
- `tcs-references/Trip interlock test 2X650MW.pdf` ay galing sa ibang planta: huwag gamiting citation ng LMYP #1.
- `docs/audit/ASSUMED_REGISTER.md`: 70 ASSUMED na kailangang palitan ng source o NO-SOURCE.
- Walang section sa UPDATE_REPORT v3.2.1 ang ilang Beta; may listahan na mula sa git log sa dulo ng file na iyon.

## 5. Kulang pa
- Ikabit sa model ang drum 32 t (DATA_ANSWERS item 7); ikumpara sa app ang BFP motor, generator at compressor data (`document-references/INDEX.md`).
- Live loop check at function test ng natitirang equipment (`docs/versions/v3.2.1/MOTOR_LOOP_CHECK.md` pagkatapos ng CW; lahat ng MOV / control valve at analog instrument gamit ang split view); page 07 test; debris filters, hypochlorite, manual valves.
- Gaps: ID fan cold start; Sampling page blanks; per-signal ABC / DITL tracing; AI range / alarm / IO checks; DITL 9 sa 31 hindi pa na-verify.
- Plant model: LP heater isolation / bypass; transmitter root valves; APH sootblower; ESP.
- Cold commissioning at ISANG integrated Cold → 150 MW start, saka shutdown / trip.
- Full HMI art (pagkatapos ng lahat ng loop check; mockup muna). DCS library (goal 3). Stable v3.2.1 (GO STABLE lang).

## 6. Mga utos ng user na umiiral (bukod sa COMMANDMENTS)
- **Plano (#84):** Design → DCS → HMI + plant model → loop check bawat system (SOP order, CW muna) → cold commissioning → isang beses na integrated Cold start.
- **Plant model (11-04):** "Gawin nio lng ng gawin, basta tama connection, flow, at plant model, at dapat may communication sya sa logic na ABC DITL." Bawat system: ang model ay nagbibigay ng AI / DI sa ABC / DITL, at ang output ng logic ang nagpapagalaw sa model. Saklaw (#91): main plant (SG + TG), cross-system links (`docs/versions/v3.2.1/CROSS_SYSTEM_LINKS.md`), kapaki-pakinabang na manual isolation valves lang.
- **Loop check standard (11-04, 11-05):** LOOP CHECK = signal path lang (breaker TEST): REMOTE / LOCAL DI, START / STOP DO, RUN / STOP feedback DI, TRIP DI + alarm, current AI; kasama ang analog. FUNCTION TEST = logic: block sa LOCAL / TRIP, MAN start / stop, AUTO standby, auto cut-in sa trip, LOCAL start / stop + E-STOP sa FIELD buttons. Gumagana kahit shutdown. ISANG buong ulat, iisang sagot.
- **12 CHECK bawat hakbang ng live test (10-31):** (1) Training at dock laman; (2) dock UI; (3) header at alarm laban sa alarm list; (4) logic at permissive: bawat control ay itinutugma sa address sa logic at I/O / memory list; (5) HMI kumpleto laban sa snapshot at IO list; (6) iisang value sa dock, HMI, faceplate at logic; (7) HMI UI buo at nababasa; (8) faceplate / pop-out kumpleto; (9) buong app UI; (10) status bar version at build; (11) events; (12) SOP at lumang findings. Tala: PASA / BAGSAK / BAHAGYA / HINDI NAGAWA. Basahin ang logic pagkalipas ng ≥ 30 s bago tawaging bug. Pindot gaya ng operator; walang FORCE at walang shortcut.
- **App UI:** text ng app English lang; paglalarawan ang pangunahing label, ang tag ay maliit na reference. Malinis, organized, malinaw. Huwag tanggalin ang control na gamit ng user nang walang kapalit. Thread names: `NAME : ROLE`, ALL CAPS, babaeng pangalan, hindi inuulit (nagamit na: LISA, MINA, WINTER, YUNA, NINGNING, ROSÉ, KARINA, GISELLE, LIA, JISOO, IRENE, HAEWON, YERI, SANA, JENNIE, SEULGI, WENDY, TZUYU).
- **Training:** Cold → 150 MW lang. Walang coach, walang FORCE, FIELD lang para sa digital field item, process values galing sa plant model. Per-loop, Warm at Hot ay tinanggal (beta.39); huwag ibalik nang walang utos.
- **Plant at logic:** ang drawing ang batayan; utilities (seawater, ACW, air, make-up, DO pump) ay hindi laging handa (sinisimulan, may trip). ABC design base (100 %): MSF 460, coal 81, 4450 kcal/kg, total air 606, PA 380, SA 200, FA 26 T/H. Golden reference ng start-up: https://claude.ai/artifact/D2EXiHjLsiJf12RBPniT39 (start coal PAGKATAPOS ng sync, FHI Fig. 2). Ang hindi karaniwan sa SOP / logic / curves ay "UNUSUAL"; ang user ang magpapasya.

## 7. Saan ang mga bagay
- References: `document-references/INDEX.md` (laman ng bawat file at zip, at ang PC-only folders). P&ID = `flow-diagram-K1AU3-A1-0-001.zip` (RB kung mayroon, kung wala RA).
- Rules: `CLAUDE.md` (COMMANDMENTS), kopya para sa hook `docs/handoff/COMMANDMENTS.md`; `PROJECT_RULES.md`; paano mag-publish ng Beta: `docs/handoff/PUBLISH_BETA.md`.
- Setup ng bagong session: `docs/handoff/LOCAL_TAKEOVER.md`, `docs/handoff/NEW_ACCOUNT_SETUP.md`; skills `docs/handoff/skills/`.
- Bawat Beta: `docs/versions/v3.2.1/UPDATE_REPORT.md`; plant model at loop check docs: `docs/versions/v3.2.1/`. Lumang Training live test (beta.76): `docs/handoff/LIVE_TEST_FINDINGS.md`.
- HMI: `docs/hmi/` (`HMI_STYLE.md`, `HMI_SYSTEMS.md`, `OPERATING_POINTS.md`, `operating-points.json`). Source: HMI pages `src/ui/plant/`, split view / loop check `src/ui/training/`, plant model `src/analog/engine/` (`plant.js`, `unit.js`, `boiler.js`, `tcs.js`), switch list `src/world/plantsw.js`, mundo ABC + DITL `src/world/world.js`.
- Build at test: `npm run build` (iisang html sa `dist/`, huwag i-edit), `npm run check`, `tests/regress/` (README sa loob).
- Workflows: `.github/workflows/` (`checks.yml` bawat push; `site.yml` kusa pagkatapos ng Checks; `release.yml` at `clean-releases.yml` = GO STABLE lang).
- Kasaysayan: `archive/handoff/` (lumang HANDOFF at PROJECT_MEMORY ng lumang account), git log.

## 8. Paano i-update ang file na ito (bawat thread, sa katapusan ng gawain)
1. "Huling update": oras sa PHT, pangalan ng thread, isang pangungusap.
2. Seksyon 2: version, commit, bukas na PR (2 pinakabagong Beta lang).
3. Seksyon 3 ~ 5: kalagayan ng thread, bukas na findings, kulang. Tanggalin ang naayos na.
4. Seksyon 6: bagong utos ng user, may petsa; tanggalin ang napalitan. Kapag rule ito, sa COMMANDMENTS ng `CLAUDE.md` at sa `docs/handoff/COMMANDMENTS.md` din.
5. Isama sa parehong PR ng gawain.

## 9. Stable release (LANG sa GO STABLE ng user sa mismong mensahe)
1. Sa working branch mula `main`: `src/version.txt` = `X.Y.Z` (walang `-beta`), `npm run build`, `npm run check`, mabigat na test isang beses (PROJECT_RULES 5.3), section sa `docs/versions/vX.Y.Z/UPDATE_REPORT.md` at `Release-Report-vX.Y.Z.pdf`.
2. PR → merge sa `main`; hintayin ang berdeng Checks.
3. `release.yml` (manual): input `go` = `GO vX.Y.Z` eksakto, `dry_run` = `true` muna, saka `false` (tag at GitHub Release: apk, portable exe, html, report pdf).
4. Kusang lilipat ang Stable page ng site sa bagong tag (`site.yml`).
5. Sabihin sa user ang panganib bago ang GO: ano ang hindi pa live-tested; i-update ang seksyon 2.
