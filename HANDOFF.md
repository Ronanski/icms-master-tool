# HANDOFF — iisang file ng estado (para sa kahit sinong Claude o account)

Huling update: **2026-11-11 6:10 PM PHT** (JENNIE: beta.72 PLU power load unbalance).

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
- **Beta sa `main`:** 3.2.3-beta.72 (beta.72 PLU (power load unbalance, TG manual 2-2 TCS_R1 5.3.2.4): kapag binuksan ang 52L1 sa load at ang turbine power minus load ay lampas 40 % ng rating, mabilis na sumasara ang CV at ICV (trip rate) hanggang bumaba sa 40 %, saka bumabalik sa speed control; may event na PLU. beta.71 beta.71 Mina B66-3: may alarm na ang hotwell level LT-CD1110 ayon sa alarm list (H 150 / HH 300, L -150 / LL -300 mm), dati walang alarm bago huminto ang condensate pump sa LL -300 (ABC-031 M.3211 papuntang DITL-61A row 13). beta.70 beta.70 Mina findings: B67-1 ang AUTO MODE SELECTED (standby) ng isang pindot ay pumapasok na rin sa Worker (WORLD.dset), dati natatabunan ng Worker kaya dalawang pindot; B66-4 ang Overview end block ay "House load: 52L1 open" kapag bukas ang 52L1; B66-5 may confirm na rin ang Close 52L1. beta.68 beta.68 HP first stage pressure alarms (Mina live test, standing HIGH B / C sa 150 MW): ang alarm list 2016-09-12 (PT sheet items 84 ~ 86) ay may DCS temporary values B HH 105 / H 93.8 at C HH 125 / H 62.5 / L LL -1; ang first stage sa 150 MW ay 96.8 kg/cm2 (LP bypass REMOTE SV 36.0 ng 5.png sa ABC-052 LN12), kaya tama na nakatayo ang B at C HIGH ayon sa listahan. Ang A (PT-ST1001-1) ay walang set point sa alarm list: inalis ang HH 120 / H 110 / L 5 / LL 1 na walang source. beta.67 HP TURBINE WARMING (ATS step 0): ang HP first stage metal ay papunta sa saturation ng prewarm steam sa 5.0 kg/cm2 g (157.8 °C, STIE-14747 p35 ~ 36) na may time constant 4400 s, CALC mula sa STIE-14811 p147 Fig. 1.1 (3.8 h mula 0 °C, 2.5 h mula 95 °C, 1.75 h mula 125 °C hanggang 150 °C); dati 2400 s papunta sa main steam (NO-SOURCE). Mas matagal na ang warming: mga 3.4 h mula 30 °C. beta.66 CBD: ang tubig na umaalis sa drum bukod sa main steam ay 15 T/H na, ang design ng CBD line, mass balance MB-019 item 22 (K1AU3-A2-0-001 p11); dati 25 T/H = 03.png 499.1 - 474.1, 10 T/H dito ay walang outlet sa MB-019. Sa 150 MW: feedwater mga 495 T/H, steam 480, walang MFT sa 10 min. Ang make-up LCV-MU1110 ay bababa mula sa 14 % ng snapshot dahil mas maliit ang nawawala. beta.65 sources, walang binagong value: CBD 25 T/H = 15 T/H design ng MB-019 item 22 (K1AU3-A2-0-001 p11) + 10 T/H NO-SOURCE; drum swell ks / tauS CALC 366 kg bawat kg/cm2 at 204 mm, riser transit NO-SOURCE; deaerator LICCD1104 6 % = valve sheet p74 36 T/H, 12 % = mga 215 T/H; gland 0.32 = 29.PNG, set point CALC 0.3 (SSFV p2500 ~ 2501), LOW 0.10 (ATS 1.10); hood spray FV-CD1904 IBD TC-28, 5226 kg/h (p104, p2520 ~ 2521), ang 70 % share NO-SOURCE; EOP 1.6 sa pagitan ng 1.33 at 5.0 (V-LOn005); metal tau NO-SOURCE, hangganan STIE-14811 p147 Fig. 1.1; ATS_CRITERIA.md may Table 1.2 thermal stress limits, ang stress hold ay NO-SOURCE pa (walang rotor data). beta.64 turbine side, utos ng user "bawal ang ASSUMED": walang binagong value; ang lumang ASSUMED na may source na (HP / LP bypass L21, cIP, vacUp, bearing metal sa snapshot 035) ay itinama ang comment; hotwell normal 600 mm = CL ng condenser outline K1AU3-D1-0-039 p 4; ang wala pang source ay NO-SOURCE (tauMW, TCS loop, tauTrip, icvRoll, vacDn, metal time constants, EOP 1.6, gland curve, atbp.), listahan sa /mnt/project-files/turbine-no-source-2026-11-11.md; hinahanap ni Jennie sa PC ang TG docs. Sa turbine oil page: 'metal / vib: model on snapshot 035' (dati 'ASSUMED model'). beta.63 ash cooler E-stop: sa RUN laging 1 ang plant switch ng DITL-21A row 18 NOT EMERGENCY STOP (I.0256 / 0536 / 0646 / 0686) at may dead band 10 ng level switches, kaya walang epekto ang EMERGENCY STOP ng faceplate; ngayon sumusunod ang contact sa field (pindot = 0, RELEASE = 1), dead band 0; sa Cold released = 1 pa rin (beta.264). Ash test: EMERGENCY STOP muna tapos RELEASE, ALL PASS. beta.62: closing time ng bawat motor valve mula sa Limitorque Confirmation Sheets, K1AU3-E2-0-122 PDF p51 ~ 71, dati 10 s lahat; drain buttons at step 57 gate sa drum level alarm limits +127 / -100 mm; tinanggal ang blow-off 60 % / 300 s gate na walang source). Bukas na listahan ng NO-SOURCE: team-files/ASSUMED_sources_2026-11-11.md.
- **Testing:** GitHub "Simulation tests" (`.github/workflows/sim-tests.yml`, report lang) + shell smoke test `tests/regress/shellc.js`; final proof = live test ni Mina sa Beta site.
- **Rule ng version:** sa push, version ng `main` + 1.

## 3. Team (2026-11-09)
- **JENNIE** (lead), **MINA** (live tester lang), **LISA** at **GISELLE** (fixers), **YUNA** (design). Claims: `team-files/CLAIMS.md`; tracker: https://claude.ai/artifact/9GBKXEkbqh8hrKu5vfDzMN

## 4. Bukas na findings (2026-11-10)
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
