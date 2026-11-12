# HANDOFF — iisang file ng estado (para sa kahit sinong Claude o account)

Huling update: **2026-11-12 3:30 PM PHT** (CHAEWON: beta.107 warm-up oil, blow-off ramp, step 81 drum; B102-1 bukas pa).

Patakaran: palitan ang luma, huwag magtambak ng kasaysayan. Kasaysayan ng bawat Beta: `docs/versions/v3.2.1/UPDATE_REPORT.md` at git log.

## 1. Basahin sa ganitong ayos
1. `CLAUDE.md` — ang COMMANDMENTS (iisang rules), sino ka, at ang 10 DCS kaalaman na hindi nagbabago.
2. **Ang file na ito** — estado, bukas na PR, bukas na findings, susunod.
3. `PROJECT_RULES.md` — source of truth, Beta / Stable, lean test policy.
4. `docs/SPEC.md` — ang gusto ng user (S1 ~ S9).
5. Tunay na estado: `git log --oneline -10 origin/main`, `src/version.txt`, bukas na PR. Kapag iba ang repo sa file na ito, ang repo ang tama; ayusin ang file na ito.
6. Bagong session o account / local Claude Code sa PC: `docs/handoff/LOCAL_TAKEOVER.md` (setup at prompt).

## 2. Kasalukuyang estado (2026-11-10 PHT)
- **BUOD NG HANDOVER (basahin muna):** `docs/handoff/HANDOVER_2026-11-10.md` — lahat mula 2026-11-07, gawain ng bawat team member, at ang hindi pa tapos (re-shell at plant plan).
- **Stable:** v3.2.2 (2026-11-10, user "Ok go sa 1"; = 3.2.1 + Worker bilang default ng Stable site). Ang 3.2.1 (GO STABLE ng user) = 3.2.1-beta.281, re-shell layout C. GitHub Release: apk, Windows exe, html, report pdf. Hindi nasubok: tingnan ang `docs/versions/v3.2.1/Release-Report-v3.2.1.pdf`.
- **Beta sa `main`:** 3.2.3-beta.107 (kasama ang beta.104 at beta.106 ni JENNIE: ID fan speed). CHAEWON beta.107 ( Mina live beta.102: B/C light-off 94 ~ 106 °C/h, blow-off 94 ~ 100 %, drum -192 mm sa step 56, step 81 drum +190 / -172.5, B102-1 turbine trip + MFT sa 84 MW. Ayos sa Training guide: (1) step 54: bago sindihan ang B / C, ibinababa muna ang oil A / D sa burner minimum fire, at ang B / C ay nasa minimum fire din (PR-OPE-5002: "at minimum firing ratio", sabay-sabay na itataas para sa 1 °C kada minuto); (2) blow-off SV ramp: ang unang SV ay ang pressure ngayon (hanggang 35), hindi SV + 1 na malayo sa pressure; (3) stage 7 oil band (step 76 ~ 52G): binabasa ang 10-minute mean ng steam at gumagalaw ang oil isang beses kada 10 minuto, at ▲ lang kapag naabot na ng pressure ang SV ng HP bypass. Sanhi ng step 81 swing: ang ▼ / ▲ kada 2 minuto ang humahabol sa ugoy ng HP bypass loop (napatunayan: kapag hawak ang oil, 0 mm ang drum). Subok sa Worker mula sa save ng step 81: drum -35 / +57 (dati -175 / +136). Buong Worker run mula step 49 (x10): heating 51 °C/h pagkatapos ng B / C, walang MFT, umabot sa step 82; step 81 drum -108 / +23 tapos 0. Bukas pa: drum +187 sa step 73 (blow-off 76 % pasara sa 32.5 kg/cm², SV 35) at -168 sa step 75 (sabay bumukas ang HP bypass at blow-off), -133 sa step 57. B102-1: HINDI pa naayos; hinala ay bukas ang LP bypass PICHR1003 (mababa ang reheat pressure para sa steam flow, kaya first stage minus cold reheat umabot sa TA-21 limit); hinihintay ang log ni Mina mula step 99. Hindi pa nasubok nang live.)
- **Testing:** GitHub "Simulation tests" (`.github/workflows/sim-tests.yml`, report lang) + shell smoke test `tests/regress/shellc.js`; final proof = live test ni Mina sa Beta site.
- **Rule ng version:** sa push, version ng `main` + 1.

## 3. Team (2026-11-09)
- **JENNIE** (lead), **MINA** (live tester lang), **LISA** at **GISELLE** (fixers), **YUNA** (design). Claims: `team-files/CLAIMS.md`; tracker: https://claude.ai/artifact/9GBKXEkbqh8hrKu5vfDzMN

## 4. Bukas na findings (2026-11-10)
- (CHAEWON 2026-11-11 11 PM) Training automatic run mula sa save sa step 49 (beta.90): pumapasa na ang step 57 (3 sa 3), pero drum LOW-LOW MFT pa rin sa steps 68 ~ 81 sa 4 sa 6 run (level swing +107 / -150 mm habang isinasara ang blow-off at binubuksan ang HP bypass). Diesel tank T-0701: area 23.8 m2 NO-SOURCE (EQ list p29 300 m3 = hanggang 40 m2), walang refill sa model, walang alarm / event ng tank LL at ng diesel pump stop. `tools/training/guide_fullrun.js` hindi lumalampas sa step 40 (PA damper ▲, kamay ng trainee).
- Re-shell: 281 (Target MW, sinusuri ang tinype) naghihintay ng retest ni Mina, saka Stable 3.2.1. Para sa 4B: ang orasan ng Cold at 150 MW ay nagsisimula sa oras ng pag-load ng estado (11:29, 10:37), hindi sa 0:00.
- Plant: MST sa load up (beta.30: hugis tugma na sa plant trend, peak 547 sa dulo ng ramp, planta 548); hotwell -300 sa feedwater surge; RHT 512.7 sa 90 MW; Instructor turbine trip sa t = 0 (engine, naka-hold); Single Line Diagram wala sa PC.
- Detalye: `docs/handoff/HANDOVER_2026-11-10.md` seksyon 4; ebidensya `team-files/findings-2026-11-09-reshell.md` (PC lang).

## 5. Kulang pa
- History ng public repo: nilinis 2026-11-07 (bagong commit IDs). Ang lumang PR refs (`refs/pull/*`) ay hawak pa ng GitHub at may plant documents pa; GitHub Support lang ang makakapag-alis. Lumang Windows / apk links ay hindi apektado; ang lokal na lumang history ay nasa `refs/backup/2026-11-07/*`.
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
