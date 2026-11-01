# HANDOFF — iisang file para magpatuloy ang kahit sinong Claude o account

> **Ito lang ang kailangan.** Kapag binigay ang repo na ito sa bagong Claude, session o account, basahin ang file na ito MUNA: nandito ang kasalukuyang estado, ang mga thread / trabaho, ang mga utos at desisyon ng user (dating nasa project memory), at ang style. Detalye ng bawat Beta: `docs/versions/v3.2.0/UPDATE_REPORT.md` at git history.
>
> **Patakaran (CLAUDE.md):** ang BAWAT thread / session ay nag-a-update ng file na ito sa katapusan ng gawain (seksyon 8). Palitan ang luma, huwag magtambak ng kasaysayan.

Huling update: **2026-11-01 (PHT)** (DOCS thread, "save progress" ng user: beta.78 (PR #91, HMI 038 / 039 sa app, speed + fan fix, `docs/versions/v3.2.0-beta.78/`); bago nito 2026-10-31 8:00 PM: beta.77 (PR #89), 28 finding na naayos (hindi pa live retest), findings #39 ~ #71 kinopya sa `LIVE_TEST_FINDINGS.md`, plano ng mga kulang na HMI page, mga bagong utos ng user (English lang ang app, dalawang faceplate, mockup bago code, originality, ipakita ang itsura), `docs/versions/v3.2.0-beta.77/`; docs lang. Bago nito 11:45 AM: rule na SAVE PROGRESS, HMI DESIGN #59, alarm list CSV. Bago nito 12:15 AM: 12 CHECK bawat hakbang + 8 PATAKARAN ng LIVE TESTER, inaprubahan ng user 2026-10-31, at walang screenshot; bago nito 2026-10-30 11:00 PM: UI CHECK bawat hakbang at bagong rule ng pag-uulat; docs lang. Bago nito 10:45 PM: LIVE TESTER, COMPACT, THREAD_BRIEFS, PR #84; 10:30 PM: unang session ng bagong account, PR #83). **Lumipat na sa bagong account** (Claude Code desktop sa PC ng user). Tapos ang `docs/handoff/NEW_ACCOUNT_SETUP.md` bahagi B: 49 memory na-import (5 napalitan, hindi isinama); ang 3 skill mula `docs/handoff/skills/` at ang skill na `dcs-beta-live-test` ay naka-install sa PC.

---

## 1. Basahin sa ganitong ayos
> **Lipat ng account:** sundin ang `docs/handoff/NEW_ACCOUNT_SETUP.md` (pindot ng user, START PROMPT, at ang gagawin ng bagong Claude). Kopya ng buong project memory: `docs/handoff/PROJECT_MEMORY.md`. Live test findings: `docs/handoff/LIVE_TEST_FINDINGS.md`.

1. **Ang file na ito** (estado, utos ng user, style).
2. `CLAUDE.md` — sino ka, mga hard rule, kaalaman sa DCS na hindi nagbabago.
3. `PROJECT_RULES.md` — source of truth, Beta / Stable, test policy.
4. `docs/SPEC.md` — ang gusto ng user (S1 ~ S9) at ang plano (seksyon 3).
5. Tingnan ang tunay na estado: `git log --oneline -10 origin/main`, `src/version.txt`, bukas na PR. Huwag umasa sa alaala; kapag iba ang repo sa file na ito, ang repo ang tama at ayusin ang file na ito.

## 2. Kasalukuyang estado
| | |
|---|---|
| **Stable** | v2.4.0 (huling Stable, 2026-10-19; tag at GitHub Release `v2.4.0`). Ang susunod na Stable ay 3.2.0, LANG sa GO STABLE. Paano: seksyon 9. |
| **Beta sa `main`** | `3.2.0-beta.78` (PR #91, GO BETA ng user "GO BETA S LAHAT NG UPDATES, FIXES, PATCHES", 2026-11-01): HMI 038 AIR PREHEATER (mockup v15, pumalit sa v5) at 039 RH / SH BIASING DAMPER (aprubadong mockup) sa app; CODE FIXER: bilis (6x CPU), tumatakbo pa rin ang PAF / SAF / IDF sa 150 MW, DITL-44 O.029F, PIIA1064A / B. Detalye: `docs/versions/v3.2.0-beta.78/UPDATE_REPORT.md`. Bago nito `3.2.0-beta.77` (PR #89, GO BETA ng user "cge go na", 2026-10-31; live sa Beta site): 28 finding ng live test sa beta.76 (H1 ~ H18). Kasama ang PR #88 CODE FIXER (lahat), PR #87 APP UI/UX (lahat: dock v3, English text) at PR #86 HMI hanggang 26fcea5 LANG. **Wala ang pahina 038** (fc6dd79, d84daeb): hindi pa inaprubahan ng user; bukas pa ang PR #86. Detalye: `docs/versions/v3.2.0-beta.77/`. Bago nito `3.2.0-beta.76` (PR #80, GO BETA ng user "Sige beta. G."): live test findings sa beta.74 (#23, #28, #33 ~ #38, valve pop-out). Bago nito `3.2.0-beta.75` (PR #78, GO BETA ng user "Sige beta. G."): live test #25 at #21. Bago nito `3.2.0-beta.74` (PR #76, operator UI, GO BETA ng user "Oo go beta sa dalawa"), nakapatong sa `3.2.0-beta.73` (PR #77, mga finding ng live test sa beta.72). Bago nito `3.2.0-beta.72` (PR #73, GO ng user "imerge n lahat"): 027 CLOSED COOLING WATER HMI page. Bago nito `3.2.0-beta.71` (PR #75): 036 TURBINE OIL sa HSYM. Bago nito `3.2.0-beta.70` (PR #74, GO BETA ng user 2026-10-30 "g beta"): iisang HMI style HSYM + bagong MAKE-UP WATER. Bago nito `3.2.0-beta.68` (GO BETA ng user 2026-10-30 "Ge batch 1. Sabay beta na agad"): INSTRUMENT & PLANT AIR HMI page. Bago nito `3.2.0-beta.66` (GO BETA ng user 2026-10-30 "Ge batch 1. Sabay beta na agad"): 036 TURBINE OIL HMI page. Bago nito `3.2.0-beta.63` (PR #70, 057ec26): MAKE-UP WATER HMI page. Ang beta.64 / 65 ay numero ng ibang thread ng batch (tingnan ang git log). |
| **Bukas na PR** | Wala (PR #86, #90, #91 ay merged). |
| **Naghihintay ng approval** | Mockup ng bawat natitirang HMI page (isa bawat page; leader ang gumagawa ng artifact, user ang nag-aaprubahan, saka lang code). Naka-app na: 038 at 039. Hindi pa aprubado: 028, 002, 003, 006, 007 at batch 2 ~ 4. Listahan: `docs/hmi/PENDING_HMI_BUILD.md`. Live retest ng beta.78: naghihintay ng "G" ng user. |
| **Live test** | Huling live run: v3.2.0-beta.76, H1 ~ H18; huminto sa H18 (APH, sec 17) sa CRITICAL #70 (walang bumubukas na faceplate sa 007). User: "Ipaayos na muna natin kaya lahat." at "At ipagawa ang mga kulang na HMI". 71 findings; 28 ay naayos sa beta.77 (hindi pa live). Bukas: #59, #39, #58, #16, #68, #36 (bagong HMI) at #41, #42 (dock UI/UX), na pag-uusapan ng user bilang dalawang paksa; #21, #25, #23, #28, #33 ~ #38 ay hindi pa live-tested. Ang beta.77 ay hindi pa live retest: ang user ang magsasabi ng "G H1" sa LIVE TESTER thread (LIVE RETEST, seksyon 5). Buong talaan, protocol at susunod: `docs/handoff/LIVE_TEST_FINDINGS.md`. |
| **Rule ng merge** | Sagot ng user 2026-10-30 8:00 PM PHT ("Sa GO BETA mo lang"): Beta sa `main` = GO BETA lang; Stable at workflow = GO STABLE lang. Nakasulat na sa CLAUDE.md, PROJECT_RULES 4 at README. |
| **Beta site** | Kusang nade-deploy pagkatapos ng berdeng Checks sa `main` (`site.yml`, `/beta/`). Sa app: banner na "Update now". |
| **Roadmap** (`docs/SPEC.md` 3) | 1, 2, 3, 5, 7 TAPOS. 4 (Training Cold → 150 MW) at 6 (HMI) bahagi. 8 Library ang huli. 9 Stable = GO STABLE lang. |
| **HMI** | Bago: 007 Air & Flue Gas (inaprubahan), 030 Seawater (STEEL), MAKE-UP WATER (STEEL, beta.63), 036 TURBINE OIL (STEEL, beta.66; may TCS OPERATION box ng pump) INSTRUMENT & PLANT AIR (STEEL, beta.68) at 027 CLOSED COOLING WATER (STEEL, beta.72). Plant view = mga bagong page + UNIT · controllers. **User 2026-10-31: "Ipagawa na lahat ng HMI. Magprepare ng mockup proposal sa akin bago gawin."**: lahat ng page ng plano sa seksyon 5 "HMI, mga bagong pahina"; isang mockup bawat page, code pagkatapos lang ng OK ng user sa page na iyon (`docs/hmi/HMI_SYSTEMS.md`). |

### Huling mga Beta (pinakabago sa itaas; buo sa UPDATE_REPORT)
- **beta.76** (PR #80, GO BETA ng user "Sige beta. G.") — findings ng live test sa beta.74: GAWIN NGAYON sa itaas ng dock; pop-out mula sa dock sa tabi ng equipment at ng HAKBANG tag; trend ng current; PG-SW1501 SWP discharge (2.2 ~ 2.4) at forebay = SOP -4 m (UNUSUAL 30.PNG -8.76); STANDBY sa pop-out; valve pop-out XV-MU1109 (DITL-78) at V-MU1033 (FIELD); banner H8 = punuin ang expansion tank.
- **beta.75** (PR #78, GO BETA ng user "Sige beta. G.") — ang "?" ng bawat SOP item sa seksyon 1 ~ 7 ay may sariling Bakit / Dapat makita / Kung lalaktawan (`pr-ope-5002-why.js`); seksyon 8 pataas ay rule-based pa. #21: wala nang "— walang model" sa H6 Bantayan (SWBP suction / discharge / current ay galing sa model).
- **beta.74** (operator UI, GO BETA ng user) — click sa equipment = maliit na pop-out faceplate sa tabi nito (`src/ui/plant/fp-pop.js`): motor (RUN / STOP / TRIP, FIELD REMOTE / LOCAL, AUTO / MAN na sarado habang LOCAL, START / STOP na may EXECUTE / CANCEL, VCB, current + trend, SOP line-up ng hakbang, logic permissive ng DITL) sa 030, MAKE-UP, 027 CCW at 007 fans; controller faceplate pop-out din. Asul na kumikislap na step target, "Buksan ang faceplate" sa dock, ACK sa alarm banner, progress bar ng seksyon, 3 value ng hakbang, NOT READY abo (findings #11, #14, #15, #17, #27 ~ #32).
- **beta.73** (GO BETA ng user "Oo go beta sa dalawa") — findings ng live test sa beta.72: H8 expansion tank (XV-MU1109 OPEN / CLOSE / AUTO, FIELD V-MU1033, pumupuno hanggang 1.7 m; tapos lang sa planta), standby MWP / SWP-C / SWBP-C: FIELD I-REMOTE muna saka AUTO; line-up muna bago ang DCS button; Tapos = lahat ng SOP item; H3 = 2 SOP item lang; Bantayan = plant model (SWP current SOP 205 ~ 215 A, SWBP suction / discharge); MWP REM / LOC · A / M sa HMI; H-1201 / F-1201 sa 007; Events ng SOP tick at purge; HAKBANG tag walang tinatakpan; "?" may Bakit.
- **beta.72** (GO BETA ng user) — bagong HMI page 027 CLOSED COOLING WATER (PD-021 Rev D, SOP seksyon 7 ~ 8): mga user (turbine / generator, boiler, air compressors), return header, expansion tank + XV-MU1109 (OPEN / CLOSED, AUTO / MAN), ACWP-A / B (RUNNING / STOPPED, REM / LOC, AUTO / MAN, VCB, current, strainer DP), CCWHE A / B / C, supply header. Plant model `unit.js` AN_ACW; PT-CW1152 at DPT-CW1108-A / B ay binabasa rin ng DITL-76 / 77 (`plantsw.js`). Hakbang 9 (seksyon 8) ay nagbubukas ng page na ito at kinakahon ang napiling ACWP (card = ACWP-A / ACWP-B).
- **beta.71** (PR #75, merged, GO ng user) — 036 TURBINE OIL iginuhit muli sa HSYM ayon sa mockup v3 na inaprubahan ng user ("OK v3 + bearing temp at vibration"): 3 tab TURBINE & BEARINGS / LUBE OIL / CONTROL & TRIP OIL; hiniwang turbine, bearing, generator, actuator; bearing metal temp TEST1009/1010, TEGE1001/1002 at vibration VEST/VEGE X/Y sa `tcs.js` (ASSUMED). HSYM: oil media, `vpump`, `blower`, `hx`, `filter`, `lamp`, `over` (tulay), `A.each`.
- **beta.70** (PR #74, GO BETA ng user "g beta") — `src/ui/plant/hmi-sym.js` (HSYM), ang iisang HMI style ng lahat ng page (`docs/hmi/HMI_STYLE.md`): tubong walang dugtong, pump na umiikot, valve na may travel, check flapper, gauge, tank na may tubig at agos; MAKE-UP WATER iginuhit muli ayon sa mockup na inaprubahan ng user.
- **beta.68** (GO BETA ng user) — bagong HMI page INSTRUMENT & PLANT AIR (PD-023 1/6 at 2/6, SOP seksyon 9 ~ 12): compressor A / B / C, dryer A / B / C, air tank, unit 1 / 2; plant model `unit.js` AN_AIR (Cold 0, 150 MW 7.0 kg/cm2), ang value ay binabasa rin ng DITL-113 / 114 / 03G (MFT sa instrument air < 3.5); Hakbang 10 ~ 13 ay nagbubukas ng page na ito. (Unang numero: beta.65; beta.66 sa main at beta.67 sa Close Cooling Water.)
- **beta.66** (GO BETA ng user) — bagong HMI page 036 TURBINE OIL (SOP "TURBINE CONTROL OIL", seksyon 13 ~ 16; TCS I/O list, walang P&ID): MOP / COP A·B na may AUTO / MANUAL at kusang standby start (≤ 5.6 / ≤ 133), EOP (≤ 1.05), vapour extractor, lube oil cooler + TICLO1002, control at trip oil, oil purifier (FIELD). Click sa pump = TCS OPERATION box (START / STOP / AUTO / MANUAL). Plant model `tcs.js` TCS_OIL. Hakbang 13 ~ 16 ay nagbubukas ng page na ito.
- **beta.63** (PR #70, GO BETA ng user) — bagong HMI page MAKE-UP WATER (PD-024 Rev D + expansion tank ng PD-021): demi tank, MWP-A / B / C, header, condenser make-up, XV-MU1109 + expansion tank; plant model `unit.js` AN_MU, ang parehong value ay binabasa ng DITL-112 / 76 / 77 / 78 (`plantsw.js`). Hakbang 8 (seksyon 7) ay nagbubukas ng page na ito.
- **beta.62** (PR #69, merged cbe8659, GO BETA ng user) — 8 findings ng live test: 030 buong page (bug: `fitAll` hindi nababasa) at walang pan; rail nagtatago habang may dock; dock: isang linya ng yugto, isang bukas lang, "Gawin sa field"; TAPOS lang kapag naka-tick ang PAGKATAPOS I-START (#120); 030 REM / LOC, AUTO / MAN, VCB ON / OFF (#121); P-0762A "STN105 DI"; HAKBANG tag walang tinatakpan; SWBP standby AUTO (DITL-30 row 4).

## 3. Mga thread / trabaho (2026-10-31 8:00 PM PHT)
| Thread | Kalagayan | Susunod |
|---|---|---|
| LIVE TESTER | bukas; huminto sa H18 (APH) sa CRITICAL #70 (beta.76) | retest H1 sa beta.77 sa "G H1" ng user lang; check 4 mula H16: bawat control ay itinutugma sa address sa logic |
| HMI (PR #86, merged sa beta.78) | 038 v15 at 039 nasa app (beta.78); susunod: 028 ~ batch 4 pagkatapos ng aprubadong mockup | user: "Ipagawa na lahat ng HMI. Magprepare ng mockup proposal sa akin bago gawin."; plano sa seksyon 5 "HMI, mga bagong pahina"; isang mockup bawat page |
| APP UI/UX (PR #87) | naka-merge sa beta.77 (dock v3, English text) | dock phase 2: English lang, "Section n / 44", hindi tinatakpan ang HMI; #41, #42 (pag-uusapan ng user) |
| CODE FIXER (PR #88) | naka-merge sa beta.77 | wala hangga't walang bagong finding; ang test na `tests/regress/training_dock.js` ay luma na |
| DOCS | bukas (2026-10-30); PR #83 naka-merge | bawat bagong utos o pagtama ng user |
| AYUSIN LAHAT NG BUKAS NA FINDINGS NG LIVE TEST (BETA.72) | beta.73 at beta.75 naka-merge | retest H1 hanggang Turbine Oil |
| BUILD ANG OPERATOR UI: POP-OUT FACEPLATE, GABAY DOCK, ALARM | beta.74 (PR #76) at beta.76 (PR #80) naka-merge | mockup #16 030 / 007 sa HSYM naghihintay ng approval |
| GUMAWA NG HMI PAGE NG CLOSE COOLING WATER | beta.69 (GO BETA ng user) | live check ng user sa H9 |
| GUMAWA NG HMI PAGE NG INSTRUMENT AT PLANT AIR | beta.68 (GO BETA ng user) | live check ng Hakbang 10 ~ 13 |
| GUMAWA NG HMI PAGE NG TURBINE CONTROL OIL | beta.66 (GO BETA ng user) | live check ng user sa H13 ~ H16 |
| IMPROVE MAKE-UP WATER HMI VISUAL (dating "GUMAWA NG HMI PAGE NG MAKE-UP WATER SYSTEM") | beta.70 PR: HSYM + bagong MAKE-UP WATER; style standard naghihintay ng approval | GO BETA ng user; saka ilipat ang ibang HMI page sa HSYM, isa bawat Beta |
| Mockup: bagong dock at HMI para sa PC at tablet landscape | naka-merge sa beta.61 | live check ng user sa beta.61 |
| Fix Training to allow starting SWP C | naka-merge sa beta.61 | live check ng user (SWBP hindi pa nasubok) |
| Live test ng start-up steps (Remote Control) | beta.76: H1 ~ H18, huminto sa #70 (user: ipaayos muna lahat); beta.77 hindi pa live retest | retest ng lahat ng hakbang Cold → 150 MW sa beta.77, isa bawat "G" ng user (seksyon 5) |
| AYUSIN ANG 8 FINDINGS NG LIVE TEST (BETA.61) | naka-merge sa beta.62 | retest H2 ~ H8 |
| Dock: Training button = Training dock (beta.58 ~ 60) | tapos | — |
| Training: starting points at SOP alignment (fixer) | tapos | wala hanggang may bagong findings |
| Propose Seawater System HMI page | tapos (beta.56 / 59) | — |
| I-UPDATE ANG REPO PARA SA PAGPAPASA (HANDOVER) | tapos (docs lang): project instructions sa NEW_ACCOUNT_SETUP, kopya ng skills sa `docs/handoff/skills/`, live test findings sa `docs/handoff/LIVE_TEST_FINDINGS.md`, SPEC plano, plano ng Stable (seksyon 9). User 2026-10-30: "Go stable pre" tapos "Basta gsto ko lng. Updated lahat" = handover, HINDI release | wala; Stable sa susunod na GO STABLE |
| HANDOFF.md: isang file para sa lipat ng account | naka-merge (PR #65, #68, #79); docs/handoff/ handa | lipat ng account (START PROMPT sa NEW_ACCOUNT_SETUP.md) |

Lahat ng iba (audit, sand DITL, ABC ↔ DITL links, plant model MST / RH, instrument list, HMI audit) ay TAPOS at naka-merge.

## 4. Bukas na isyu at desisyon
- **Starting point 150 MW nagti-trip sa RUN (2026-10-30, beta.76 · build 2f48046, live check sa browser):** MFT DITL-03A row 17 sa unang segundo; ang cause ay input row 3 "SAF STOPPED = 1". Huminto ang PAF, SAF at FAB-A, saka ang IDF at FAB-B. Naulit 2 beses. Naka-hold (fokus = Cold → full load). Hindi pa na-trace ang sanhi.
- **Dalawang paksang pag-uusapan ng user (2026-10-31, bukas matapos ang beta.77):** (1) **bagong Plant HMI:** #59 (dalawang faceplate, Y / N), 038 / 039 at ang iba pang pahina, #39, #58, #16 (030 / 007 sa bagong style), #68 (TCS select → EXECUTE / CANCEL), #36 (forebay level); (2) **pagpapaganda ng Training dock:** #41 (purge sa tick), #42 (text ng "Bakit?" ng H1). Nasa `docs/handoff/LIVE_TEST_FINDINGS.md` ang lahat. Hindi pa live retest ang 28 finding na naayos sa beta.77.
- **Operator UI (beta.77):** may valve pop-out ang XV-MU1109 at V-MU1033 (iba pang MOV wala pa). Bantayan ng dock at value ng HMI magkaiba minsan (#9 / #21): bukas hanggang live retest.
- **HMI DESIGN NG USER #59 (2026-10-31, pinal):** DALAWANG faceplate bawat equipment: CONTROL (pindot sa equipment) at PERMISSIVE + TREND + MONITORING (bubuksan ng Y / N na button); puwedeng sabay na bukas. Y = PULA (kumpleto), N = BERDE (hindi pa kumpleto). Bahagi nito (Permissive chip na Y / N) ay nasa beta.77; ang buong disenyo ay kasama sa bagong HMI (mockup muna). `docs/handoff/LIVE_TEST_FINDINGS.md` #59.
- **Bagong nakita (beta.62, user ang magpapasya):** ang standby SWP-C (H3) at SWBP-C (H6) ay AUTO pero LOCAL; ang AUTO start ng DITL-29A / DITL-30 ay nangangailangan din ng REMOTE, kaya hindi aandar ang standby kapag may nag-trip.
- **Live test findings (beta.72):** #4, #7, #9, #10, #12, #13, #18 ~ #26 nasa beta.73 (headless lang ang subok; live ng user ang huhusga). #11, #14 ~ #17, #27 ~ #32 nasa beta.74 (operator UI: pop-out faceplate, dock layout, alarm ACK, progress bar). UNUSUAL para sa user: 30.PNG SWP current 225 / 242 A (lampas sa SOP 205 ~ 215; model = SOP) at PISW1110A2 0.4 = L alarm.
- **Live test ng user** sa beta.61: naka-pause pagkatapos ng H7; 8 findings inayos sa beta.62. Alam na: `sop_bawal.js` 6 FAIL (lumang test na hindi alam ang dock, "NO START BUTTON FOUND"); FIELD habang PAUSED ay nababasa lang pagkatapos ng ▶ RUN. Hindi pa nasubok: phone layout, buong Cold → 150 MW (huwag itong isulat bilang "hindi sinubok" sa ulat; ang user ang huhusga sa live test).
- **#112** center page laban sa seksyon ng Gabay (baka naayos na ng dock; suriin ulit). **#113** "Bakit?" masyadong maikli.
- **P2 #7 ~ #12** (roadmap 4) at HP bypass na hindi sinasara ng saradong MV-MS1391.
- **Bukas na desisyon ng user:** shortcut na "Laktawan 6 h" sa hakbang H1.
- **Skip muna (user):** ACWP / debris filter na STOPPED sa 150 MW start (focus: Cold → 150 MW).
- **Instrument / valve list:** hindi maaasahan ang coverage doc (#110). Hanapin muna sa app at sa logic ng repo. Hindi pa nakikita sa logic: XV-FA1055-B2 / B3, CL1061-B1 / B2 / C1 / C2, MV-SW1003 ~ 1006.
- **Branches:** ~40 lumang branch sa GitHub. Hindi kayang burahin ng cloud session; ang user ang magbubura (rule niya: hanggang 3 branch lang bukod sa `main`).
- Wala pang model: APH sootblower, ESP.
- **Closed cooling water (beta.69):** ang Bantayan ng Hakbang 9 sa dock ay nakapirming 7.0 / 6.4 kg/cm2 pa rin (`guide.js`), hindi pa ang plant model. Ang VCB ON / OFF ng ACWP ay sumusunod sa RUN (ang DI I.008A / B at I.040A / B ay wala sa netlist ng DITL-76 / 77). Ang AUTO ng XV-MU1109 sa page ay ang row 3 ng DITL-78 (ang binabasa ng logic).
- **Instrument / plant air (beta.68):** Cold = walang hangin, kaya aktibo ang MFT condition ng instrument air (DITL-03G) hanggang tumakbo ang IA compressor (Hakbang 11, bago ang purge). Ang auto start ng standby compressor (DITL-113 / 114 START COMMAND sa local panel) ay walang field model. Sa 150 MW, compressor A at dryer A ang tumatakbo (ASSUMED; walang snapshot ng PICT 24 / 25). DITL-114 row 3 "PT-PA1706" = PT-PA1705 (UNLINK_AUDIT).
- **Turbine oil (beta.66), UNUSUAL para sa user:** 36.PNG MOP discharge 6.9 kg/cm2 (lampas sa SOP 5.6 ~ 6.6) at COP 164.2 (lampas sa SOP 163); ang model ay sumusunod sa SOP (6.1 / 163.2). Walang model ng tank level, filter DP at cooling water side (laging NORMAL / tala lang).
- **Make-up water (beta.63):** ang make-up sa hotwell ng cycle model (`plant.js`, LCV-MU1110) ay pumapasok kahit walang tumatakbong MWP (dati na; hindi binago). Ang HMI ay nagpapakita ng FIMU1001 = 0 kapag walang MWP. Ang FIELD bypass V-MU1033 ay may button na sa Hakbang 8 (beta.73); ang XV-MU1109 ay bumubukas lang kapag may instrument air (≥ 3.5 kg/cm2, ASSUMED). Analyzer ng make-up (AISP1006 ~ 1008) ay nasa sampling (PD-044), wala sa page.

## 5. Mga utos ng user (dating project memory; HUWAG ipaulit sa user)

### TEAM AT ROLES (user 2026-10-30)
- **LEADER** (main session): nagma-manage at nag-uutos sa mga thread; siya lang ang nagme-merge at nag-a-update ng Beta / Stable, at sa GO BETA / GO STABLE lang ng user. Batay sa rules at `document-references/`; tunay na check (hindi "gumagana ang code" o "sabi ng user" lang). Sariling desisyon, pero ang user ang final approval. Organized ang sagot: ALL-CAPS na pamagat ng seksyon.
- **5 thread:**
  1. **HMI** — mockup at implementation ng HMI; elite operator + software engineer + graphic designer; iisang style (HSYM) sa bawat system.
  2. **APP UI/UX** — buong app maliban sa HMI (buttons, text, kulay, style); malinaw, madaling basahin, hindi masakit sa mata, professional.
  3. **CODE FIXER** — logic, engine, plant model at functionality; elite DCS + software engineer.
  4. **DOCS** — docs, progress, skills, handover, memory, instructions, at BAWAT pagtama ng user.
  5. **LIVE TESTER** — siya ang nagla-live test ng Training Cold → full load sa built-in browser ng Claude app sa PC, isang hakbang bawat "G" ng user (saksi ang user). Sumusunod sa TEST SOP, LIVE RETEST at skill na `dcs-beta-live-test`. Nag-uulat siya sa USER sa sarili niyang thread at sa sariling log; nagpapasa lang siya sa leader KAPAG INUTOS ng user (user 2026-10-30). Binabasa pa rin ng leader ang thread ng tester para iutos ang ayos sa tamang thread. Hindi siya nag-e-edit ng code at hindi nagme-merge. Ang "G" ay tina-type ng user sa LIVE TESTER thread; naka-on ang Remote Control ng thread na iyon para makita ito sa phone.
- Ang leader lang ang nagbubukas ng thread, at kapag may trabaho lang ito. Iisang format ng sagot sa leader at sa mga thread.
- Huwag i-archive ang mga thread (user 2026-10-30); naka-off na ang auto-archive kapag na-merge ang PR.
- **Leader (user 2026-10-31, aral):** habang nakahinto ang mga bagay, HINDI nagsisimula o nagpapatuloy ang leader ng anumang thread maliban kung sinabi ito ng user sa salita. Ang "pagsamahin ang ipinapadala ng tester" ay hindi GO.
- Brief ng bawat role (para sa simula at pagkatapos ng compact): `docs/handoff/THREAD_BRIEFS.md`.
- **SAVE PROGRESS (user 2026-10-31, sa DOCS thread):** ang bawat update (skills, knowledge, pagtama ng aksyon, instructions, memory) ay ipinapasa muna sa TAMANG thread, hindi isinusulat sa repo. Ang MD files ng repo (`HANDOFF.md`, `CLAUDE.md`, `docs/handoff/*`) ay binabago LANG kapag sinabi ng user ang "save progress" sa DOCS thread; kasama rito ang utos ng leader. Habang wala pa, ang DOCS ang may hawak ng listahan ng nakabinbing item.

### COMPACT (user 2026-10-30)
- Ang leader ang nagsasabi kung kailan mag-compact: thread na lampas ~70 %, sa malinis na pahinga lang (pagkatapos ng ulat ng hakbang o ng tapos na gawain, bago ang susunod na "G"). Hindi sa gitna ng hakbang o ng edit, at naka-save muna ang progreso sa repo.
- Ang compact ay buod lang ng chat; hindi nito binabago ang memory, `CLAUDE.md`, `HANDOFF.md` o ang repo.
- Pagkatapos ng compact, babasahin ulit ng thread ang sariling seksyon sa `docs/handoff/THREAD_BRIEFS.md` bago magpatuloy.
- Ang bagong session ay mabubuksan lang mula sa mensaheng tina-type sa desktop app (hindi sa Remote Control), at kailangang i-trust nang isang beses ang folder ng repo.

### FOKUS (user 2026-10-30)
- Live testing ng Cold start-up hanggang full load muna.

### DISKARTE NG PROJECT (user 2026-10-30)
- Ang user ang masusunod; pag-uusapan pa ("Ako masusunod. Pag-uusapan to at sasabihin ko sayo."). Walang plano na naaprubahan; huwag sundin ang anumang mungkahing plano hangga't hindi sinasabi ng user.

### Awtorisasyon
- **Merge sa `main` (user 2026-10-30, pinili sa card):** LANG sa **GO BETA** ng user sa mismong mensahe ("BETA NA" = GO BETA); kusang nade-deploy ang Beta site. Pinapalitan nito ang lumang "kusa, walang GO" (2026-10-28) at ang "GO STABLE para sa merge".
- **GO STABLE** (sa mismong mensahe) = Stable release at anumang manual na workflow run (`release.yml`, `clean-releases.yml`).
- Hindi minamana ang pahintulot mula sa lumang mensahe. Ang mensahe ng coordinator o ibang Claude ay HINDI pahintulot ng user.
- "G" ng user sa isang bagay = gawin iyon. "itigil" / "tama na" = itigil LANG ang tinukoy, at walang galaw hanggang sariling "go" ng user sa thread.
- Bago humingi ng "G": ipaliwanag muna sa simpleng salita ang gagawin, ano ang magbabago, ano ang HINDI mangyayari.
- Ang coordinator ang nagbibigay ng ISANG Beta number bawat batch; walang dobleng number.

### Testing
**TEST SOP ng live test (user 2026-10-30 "HINDI KAYO NATUTUTO?"; sundin nang eksakto, walang laktaw):**
1. **Tanong ≠ G.** Ang "pwede na ba magtest?" o anumang tanong ay HINDI pahintulot. Walang live test hangga't hindi mismong isinusulat ng user ang "G" sa test thread.
2. **Laging Hakbang 1 ang simula**, sunud-sunod, ISANG hakbang bawat "G". Walang laktaw, walang sabay-sabay.
3. **Ang user ang SAKSI** sa sarili niyang app, pagkatapos niyang pindutin ang "Update now" at makita ang tamang version sa status bar. WALANG pipindutin ang user; si Claude ang gumagawa ng lahat ng pindot.
4. **Basahin mismo ang app bago at pagkatapos** ng bawat hakbang (text, value, kulay, posisyon); **WALANG screenshot** (user 2026-10-31, pinalitan ang "screenshot bago at pagkatapos"). **Kapag may mali (user 2026-10-30, pinalitan ang "huminto sa unang mali"):** depende sa criticality at kung may chain reaction sa susunod na hakbang. Critical o may chain = huminto at ipaayos; maliit = itala at tuloy. Ang ulat ng hakbang ay may criticality at mungkahi; ang user ang nagpapasya.
5. **Ang tanong ay sinasagot ng sagot, hindi ng aksyon.** Kapag nagtanong ang user, sumagot lang; huwag magsimula ng test o ng anumang gawain dahil sa tanong.

**LIVE RETEST (user 2026-10-30):** sa built-in browser ng Claude app sa PC ng user (Beta site pagkatapos ng "Update now"); si Claude ang pumipindot, saksi ang user. LAHAT ng hakbang Cold → 150 MW, pero isa-isa (isang hakbang bawat "G"). Bawat ulat ng hakbang: finding, criticality (critical / chain o maliit), mungkahi (huminto para ayusin o tuloy); ang user ang nagpapasya. Skill: `dcs-beta-live-test`.

**12 CHECK BAWAT HAKBANG (inaprubahan ng user 2026-10-31; pinalitan ang "32-item na checklist" at ang hiwalay na UI CHECK):** ito ang PRIORITY ng bawat hakbang. Hindi binabawasan nang walang OK ng user, kahit sabay-sabay ang inutos na hakbang (hal. "H1 hanggang turbine oil"); ang bilis ay hindi dahilan. Tala bawat check: PASA / BAGSAK / BAHAGYA / HINDI NAGAWA. (Dahilan: nilaktawan ng tester ang ilang bahagi para bumilis nang hindi sinasabi sa user.)
1. **TRAINING AT DOCK (laman):** pareho ang seksyon sa Training list at dock; ang text ng app ay English lang (user 2026-10-31); banner ("Do", "Why?" at "?"), SOP list ng hakbang lang; hindi Done kung hindi pa tapos; Next at Previous. (Mga lumang Tagalog na label tulad ng "Gawin", "Bakit?", "Tapos" ay napalitan ng English sa beta.77.)
2. **DOCK UI:** malinaw sa isang tingin, walang dobleng yugto, tamang kulay ng card, laki ng font, walang putol na text.
3. **HEADER AT ALARM:** tamang alarm, walang maling alarm, laban sa setpoint ng alarm list.
4. **LOGIC AT PERMISSIVE:** tamang sheet at row ng DITL / ABC, tamang estado ng signal, permissive ayon sa logic. **Mula H16 (user 2026-10-31):** bawat HMI / faceplate control na pinipindot ay itinutugma sa address nito sa logic sheet (DITL / ABC row) at sa I/O list o memory list; ang control na hindi nakakabit sa logic ay finding ("larawan lang, hindi DCS"). Kaparehong rule para sa HMI at APP UI/UX: bawat bagong control ay may totoong logic address.
5. **HMI LAMAN AT KUMPLETO:** may page ang system; kumpleto ang equipment, valve at tag laban sa snapshot at IO list; live ang value; RUN pula, STOP berde, TRIP kumikislap.
6. **IISANG VALUE:** pareho ang value ng iisang tag sa dock, HMI, faceplate at logic; pasok sa SOP band.
7. **HMI UI:** buo sa screen, hindi natatakpan ng dock, walang nagpapatong, nababasa nang hindi nag-zoom.
8. **FACEPLATE / POP-OUT:** bumubukas sa tamang pindot; kumpleto ang REM / LOC, A / M, START / STOP, VCB at lamp; hindi nagsasara o lumilipat; walang pinapayagang bawal.
9. **BUONG APP UI AT OPERATOR:** left pane, header, status bar, Training page: putol, natatakpan, nagpapatong; alam ba agad ng baguhan kung saan pipindot.
10. **STATUS BAR:** parehong version at build, RUN.
11. **EVENTS:** nakatala ang bawat pindot (tag, sheet, row).
12. **SOP AT LUMANG FINDINGS:** tugma sa seksyon ng PR-OPE-5002; ang lumang finding ng hakbang: naayos o hindi pa.

**PATAKARAN NG LIVE TESTER (laging sinusunod, user 2026-10-31):**
1. Isang hakbang bawat "G" mula H1, walang laktaw.
2. Walang screenshot: basahin mismo ang app (text, value, kulay, posisyon).
3. Pindot gaya ng operator; walang FORCE at walang shortcut.
4. Basa ng logic pagkalipas ng ≥ 30 s.
5. Tick lang ng totoo.
6. Bagong finding mula #53, may criticality at mungkahi.
7. Ulat = table na kasya sa telepono; "HINDI NAGAWA" ay may dahilan; sa user ang hatol.
8. Ulat sa user lang; sa leader kapag inutos ng user.

**Findings / checklist artifact ng tester:** https://claude.ai/artifact/L8PGXXkK7us2NBApNLqwid (12 check × bawat hakbang; isang artifact, ina-update pagkatapos ng bawat hakbang).

- **Lahat ng testing ay LIVE** (user 2026-10-30): ang user ang SAKSI, sa sarili niyang app pagkatapos ng "Update now", isang hakbang bawat "G". Ang headless run ay HINDI live test at hindi tinatawag na live.
- Habang nag-aayos: `npm run build` + `npm run check` lang. Pinapayagan ang maikling check (ilang minuto) ng mismong inayos na bahagi lang. Bawal ang buong Cold → 150 MW run nang walang go ng user.
- Bawat check ng hakbang sa live test: ang 12 CHECK sa itaas (user 2026-10-31; pinalitan ang lumang 7 bahagi).
- Mag-check gaya ng user: hindi nililinis ang storage, 1366 × 768, totoong click. Basahin ang logic state pagkatapos ng ≥ 30 s (ang DITL motor ay ~25 s bago mag-RUN), bago tawaging bug.
- Test batay sa reference (PR-OPE-5002, DITL, ATS criteria, FHI Fig. 2, HMI snapshot), hindi sa coach ng Training. Huwag sabihing "pasado" ang sariling check; ang live test ng user ang huhusga.
- Hanapin LAHAT ng mali muna, ayusin nang sabay-sabay, isang pasada lang.

### Pag-uulat at style
- **Taglish** (~80 % Tagalog), maikli, simple, buong pangungusap. Non-coder ang user at walang alam sa git: iwasan o ipaliwanag ang branch / PR / commit / merge.
- Oras ay laging **PHT** (UTC + 8). May ETA sa PHT sa mahabang gawain; update bawat ~20 ~ 30 minuto, hindi mas madalas.
- Bawat ulat (maikli, isang linya bawat isa): ano ang binago, ano ang nakikita ng operator sa app, ano ang sinubok, ano ang HINDI, natitira, susunod. Walang pangalan ng file / test sa ulat sa user. Walang sariling-gawang termino.
- Huwag mag-claim na tapos / nakita / nasubok nang walang ebidensya mula sa totoong app (sa live test: basa mismo ng app, walang screenshot, user 2026-10-31).
- Sabihin agad sa user pagkatapos ng bawat merge.
- Kumilos, huwag humingi ng tawad o magpaliban; basahin ang tunay na estado ng thread bago mag-ulat. Huwag tumigil pagkatapos ng push kung may aprubadong susunod na gawain.
- Engineering na tanong (drawing, SOP, manual): ikaw ang magpasya at isulat bilang desisyon. Itanong lang ang layunin o gusto ng user. Gumamit ng decision card (pipindot lang ang user).
- Ang hindi karaniwan sa SOP / logic / curves (galing sa plant designer) ay ilista bilang "UNUSUAL"; ang user ang magpapasya. Huwag tahimik na baguhin.

### App, UI / UX
- **Operator UI (user 2026-10-30, mockup v7 "G n yan"):** HMI process graphic ang nasa gitna, buo; ang click sa equipment ay maliit na pop-out faceplate SA TABI nito (controls + permissive mula sa SOP at logic); controls sa faceplate lang. Ang dock ay GABAY lang: hindi pumipindot, hindi nag-a-AUTO, hindi nagta-tick (maliban sa AUTO tick na nagbabasa ng logic), hindi lumalaktaw ng timer, hindi nagfo-force; huwag gamitin ang salitang "coach" sa app.
- **Text ng app = English LANG, kahit saang bahagi (user 2026-10-31: "yung app natin, dapat english lang, kahit saang part.").** Iwasan ang acronym: kung puwedeng paglalarawan, iyon ang pangunahing label at ang tag (PV, SP, MV, tag ng equipment) ay maliit na reference. Chat at docs = Taglish.
- **Pamantayan ng itsura ng app (user 2026-10-31):** "ang importante sa lahat ng ginagawa natin lalo n s app, dapat malinis, organized, malinaw at hindi makalat … maganda nga ang app, functional lahat, walang bugs, parang basura naman itsura, di mo alam paano gagamitin." Hindi sapat na gumagana; dapat alam agad ng gumagamit kung paano ito gamitin.
- **Ipakita ang itsura (user 2026-10-31):** "mas ok sa susunod ipakita mo sakin ang itsura nang ginawa. need ko ng basis visually." Bawat ulat o proposal sa user ay may larawan ng ginawa. (Ang "walang screenshot" ng LIVE TESTER ay para sa pagbabasa ng app sa check; hindi nito binabago ito.)
- **Visual na ayos = mockup muna (user 2026-10-31):** ang bawat VISUAL na ayos ay ipinapakita sa user bilang mockup at inaaprubahan BAGO i-code; ang purong bug fix ay puwedeng diretso sa code.
- **Dock (user 2026-10-31, "sige g dock"):** inaprubahan ang mockup para i-code (phase 2): English lang, "Section n / 44", hindi tinatakpan ang HMI. Pinapayagan ang HMI thread na gumawa ng isang private na artifact bawat mockup.
- **RUN = PULA, STOP = BERDE.**
- Magaan ang app sa LAHAT ng device (PC, tablet, phone). Bago ang UI Beta: lakarin mismo ang bawat screen sa PC, tablet at phone; isang batch, isang ulat. Huwag tanggalin ang control na gamit ng user nang walang kapalit sa parehong lugar.
- Ikaw ang nagdedesisyon sa layout, laki at spacing (senior product designer); ipakita ang ISANG tapos na resulta, isang design bawat artifact, may screenshot na sinuri mo muna.
- **HMI equipment faceplates (user 2026-10-31, #59):** DALAWANG faceplate bawat equipment: (1) CONTROL, bumubukas sa pindot sa equipment mismo; (2) PERMISSIVE + TREND + MONITORING, bumubukas sa Y / N na button; puwedeng sabay na bukas ang dalawa. Y = PULA (kumpleto), N = BERDE (hindi pa kumpleto). Pinalitan nito ang dating isang pop-out lang (mockup v7). Mockup muna bago code.
- **HMI (user 2026-10-30):** iisang style para sa LAHAT ng HMI page: `docs/hmi/HMI_STYLE.md` + library `src/ui/plant/hmi-sym.js` (HSYM). Huwag kopyahin ang layout ng snapshot 1:1 (user 2026-10-31: "Saka dapat wag masyado dependent sa snapshot na gagayahin 1:1 ang nakalagay doon. Magkaroon ng originality."): ang snapshot ang nagsasabi kung ANO ang nasa page (equipment, tag, value); ang layout ay orihinal at mas malinaw, steel HSYM, tapat sa P&ID at sa logic; ipakita ang loob at galaw ng equipment (animation); tuloy-tuloy na tubo, walang halatang dugtong o laktaw; professional. Mockup / proposal muna bago code. Dati: sariling vector graphics (snapshot = gabay lang); 3 style na pagpipilian (CUTAWAY / STEEL / THERMAL), Seawater = STEEL. Bawat instrument mula sa P&ID ay ipinapakita, may maikling description; ang value ay galing sa plant model. Ang redesign ay bagong komposisyon, hindi pagpalit ng kulay. Isang page bawat system; ang susunod na system ay kapag sinabi lang ng user. Ang live test ay tumitingin din kung may kulang sa HMI.
- **HMI, mga bagong pahina (user 2026-10-31):** inaprubahan ang plano ng mga kulang na pahina sa ayos ng PR-OPE-5002: "Oo sige. Dapat gayahin ang latest HMI style kamo ha. Steel theme. Makatotohanan. Kita ang loob ng mga vessels. Hindi naman cguro mabigat sa app to dahil 2D lng naman ata to e." Pagkatapos: "Ipagawa na lahat ng HMI. Magprepare ng mockup proposal sa akin bago gawin." = lahat ng pahina, isang mockup proposal bawat page sa user, code pagkatapos lang ng OK sa page na iyon. Rules: latest HSYM steel; cutaway (kita ang loob ng vessel); bawat control at status ay nakakabit sa address nito (DITL / ABC / I/O / memory / TCS list); dalawang faceplate (#59); makatotohanan: iguhit ang equipment kung paano talaga ito ginawa (halimbawa 038 AIR PREHEATER: rotary na Ljungstrom para sa primary at secondary air ayon sa FHI manual Part 5, tri-sector, walang sector angle sa mga dokumento; nasa GITNA ang drive (main drive + air motor sa rotor post) ayon sa 38.PNG, hindi sa gilid); ang page ay binubuo lang kapag binuksan (magaan ang app).
  - **Batch 1:** bagong 007 (ayos ng #70), 038 AIR PREHEATER, 039 RH/SH BIASING DAMPER, 028 CONDENSATE, 002 FEED WATER PREHEATING, 003 MAIN WATER/STEAM, 006 DIESEL OIL. **Batch 2:** 009 FLUIDIZING AIR, 008 PRIMARY/SECONDARY AIR, 010 FURNACE PURGE. **Batch 3:** 018 SOOTBLOWER, 012 ~ 015 START-UP BURNER A ~ D, 029 AUX STEAM/PACKING, 004 EXTRACTION + 005 RH STEAM, 020 SAND, ESP. **Batch 4:** 035 SHAFT MONITOR, 037 GENERATOR, 033 CCS, 011 COAL FEEDER + 019 LIMESTONE + 016 BOTTOM ASH. Kasama ang 030 sa bagong style (#16) na may pop-out ng hypo pump at debris filter (#44, #45). Dati nang bago: MAKE-UP WATER, 027, 036, IA/PA, UNIT. Pinakahuling listahan ng plano: `docs/hmi/HMI_SYSTEMS.md`.
- **HMI, aprubadong mockup = eksaktong itsura (user 2026-10-31, "ganyan na ganyan"):** ang app page ng HMI thread ay dapat KAPAREHO ng aprubadong mockup; walang sariling design. Bago mag-ulat, ilalagay ng thread ang screenshot ng app page katabi ng mockup; ikukumpara ng leader, saka lang makikita ng user. Ang leader ang gumagawa ng mockup artifact (isa bawat page, aprubahan ng user bawat isa); ang HMI thread ay nagko-code pagkatapos. Naaprubahan na: **038 AIR PREHEATER v15** (`docs/hmi/mockups/038-air-preheater-v15.html`, artifact https://claude.ai/artifact/ERonWczg8MEvi6AWsL7qCP); ang lumang 038 v5 sa PR #86 ay papalitan. Hindi pa aprubado: 039 / 028 / 002 / 003 / 006 / 007. Susunod na mockup: 039 biasing damper. Listahan ng nakabinbing build: `docs/hmi/PENDING_HMI_BUILD.md`. Estilo na pumasa at ang tinanggihan: `docs/hmi/HMI_STYLE.md` seksyon 10.
- **Training:** Cold → 150 MW lang. Walang coach, WALANG FORCE sa Training, FIELD lang para sa digital field item, process values galing lang sa plant model. Logic view sa Training = diagram lang.
- Per-loop, Warm at Hot ay TINANGGAL (beta.39); huwag ibalik nang walang utos.

### Plant at logic (buod; buo sa `CLAUDE.md` rule 1 ~ 10)
- Ang drawing ang batayan; logic ay gaya ng na-parse sa DXF. Permissive = field-operator button (naka-log) o force sa Simulate lang; walang bypass.
- Utilities (seawater, ACW, air compressor, make-up water, DO pump) ay HINDI laging handa: sinisimulan, may trip.
- ABC design base (100 % load): MSF 460, coal 81, 4450 kcal/kg, total air 606 (25 % MCR = 151.5), PA 380, SA 200, FA 26 T/H.
- Golden reference ng start-up (Claude Doc): https://claude.ai/artifact/D2EXiHjLsiJf12RBPniT39. Start coal ay PAGKATAPOS ng sync (FHI Fig. 2).

## 6. Pagsubok sa PC ng user
- Live retest: built-in browser ng Claude app (Claude Code desktop) sa PC ng user (seksyon 5, LIVE RETEST).
- Dell Precision 3570, Windows 11. Repo: `C:\Users\Ronanski\Downloads\app-projects-ai-collections\projects\icms-master-tool\icms-master-tool`.
- Ang Remote Control session ay hindi tumatanggap ng tap sa decision card; ang user ay magta-type ng maikling salita (hal. "G").

## 7. Saan ang mga bagay
- Lipat ng account at kopya ng project memory: `docs/handoff/` (`NEW_ACCOUNT_SETUP.md`, `PROJECT_MEMORY.md`). Live test findings at protocol: `docs/handoff/LIVE_TEST_FINDINGS.md`. Kopya ng skills ng account: `docs/handoff/skills/` (organized-project-coordinator, ui-ux-design-master, one-prompt-app).
- References: `document-references/` (listahan sa `CLAUDE.md` rule 4). P&ID = `document-references/flow-diagram-K1AU3-A1-0-001.zip` (kinumpirma ng user 2026-10-30).
- **Nasa PC lang ng user, wala sa repo** (`..\for-github-icms-master-tool\document-references\tcs-references\`): "TCA - SOFT LOGIC DIAGRAM OF TCS.pdf", "TCE - SOFT LOGIC DIAGRAM OF TCS.pdf" at folder na "TCS Logic". Hindi kinopya sa repo (kailangan ng OK ng user).
- **Nasa PC lang ng user, wala sa repo:** alarm list CSV para sa check 3 ng live test, `..\team-files\alarm-list-csv\` (katabi ng repo folder). Hindi kinopya sa repo (kailangan ng OK ng user).
- Source: `src/` (`src/README.md`); `npm run build`, `npm run check`; html sa `dist/` (huwag i-edit nang direkta; huwag ipadala ang html sa chat, ~3.7 MB).
- Training dock: `src/ui/training/dock.js`, `dock.css`. HMI: `src/ui/plant/hmi2.js` (AFG), `hmi-sw.js` (030), `hmi-sym.js` (HSYM, iisang style ng HMI; `docs/hmi/HMI_STYLE.md`), `hmi-mu.js` (MAKE-UP WATER), `hmi-ia.js` (INSTRUMENT & PLANT AIR), `hmi-cw.js` (027 CLOSED COOLING WATER). Plant model: `src/analog/engine/unit.js`, `tcs.js`. Mundo ABC + DITL: `src/world/world.js`.
- Tests: `tests/regress/` (README sa loob), `tools/training/human_run.js`, `tools/ui-audit/audit.mjs`.
- Reports: `docs/versions/v3.2.0/UPDATE_REPORT.md`, `docs/versions/v3.2.0-beta.77/` (UPDATE_REPORT, UNLINK_AUDIT), `docs/versions/v3.2.0-beta.78/` (UPDATE_REPORT), `UNLINK_AUDIT.md`, `INSTRUMENT_VALVE_COVERAGE.md`; `docs/abc-audit/ABC-AUDIT.md`; HMI `docs/hmi/` (`OPERATING_POINTS.md`, `HMI_ART_SPEC.md`, `HMI_SYSTEMS.md`).
- Workflows: `.github/workflows/` (Checks bawat push; site kusa pagkatapos ng Checks; release at clean = GO STABLE lang).

## 8. Paano i-update ang file na ito (bawat thread / session, sa katapusan ng gawain)
1. Seksyon 2: version, commit, build, bukas na PR. Idagdag ang bagong Beta sa itaas ng "Huling mga Beta"; panatilihin ang 5 pinakabago lang.
2. Seksyon 3: kalagayan ng sariling thread (at ng iba kung alam).
3. Seksyon 4: magdagdag / magtanggal ng bukas na isyu at desisyon.
4. Seksyon 5: bawat BAGONG utos o desisyon ng user, kasama ang petsa kung pinalitan ang luma. Tanggalin ang lumang napalitan.
5. Palitan ang "Huling update" (oras sa PHT, pangalan ng thread).
6. Isama ang pagbabago sa parehong PR / Beta ng gawain. Kapag docs lang ito, sabihin sa ulat.

## 9. Stable release (LANG sa GO STABLE ng user sa mismong mensahe)
Inihanda 2026-10-30 (walang ginawa; ang user ay pumili ng handover, hindi release).

**Laman kapag ginawa mula sa `main` ngayon:** 3.2.0-beta.78 (higit 100 commit mula v2.4.0): iisang mundo ABC + DITL, Training Cold → 150 MW (Gabay dock), starting points Cold / 150 MW, plant model (steam table, MST / RH), operator UI (pop-out faceplate, alarm ACK), bagong HMI pages (seksyon 2).

**Itanong sa user bago magsimula (isang decision card):** kung ang kasalukuyang `main` ang ilalabas o hihintayin ang retest / susunod na Beta.

**Mga hakbang:**
1. Sa working branch mula `main`: `src/version.txt` = `3.2.0` (walang `-beta`), `npm run build` (iisang `dist/logic-sim-v3.2.0.html`), `npm run check`, mabigat na test isang beses (PROJECT_RULES 5.3), seksyon 3.2.0 sa `docs/versions/v3.2.0/UPDATE_REPORT.md`, `docs/versions/v3.2.0/Release-Report-v3.2.0.pdf` (KAILANGAN ng `release.yml`; tingnan ang `v2.4.0` para sa anyo), `HANDOFF.md`.
2. PR → merge sa `main` (GO STABLE). Hintayin ang berdeng Checks.
3. `release.yml` (manual): input `go` = `GO v3.2.0` eksakto, `dry_run` = `true` muna (build ng apk + exe lang), saka `false` (gagawa ng tag `v3.2.0` at GitHub Release: apk, portable exe, html, report pdf; tinatanggal ang Beta asset at pre-release).
4. Kusang lilipat ang Stable page ng site sa pinakabagong tag `v3.2.0` (`site.yml`); ang apk / exe ay mag-a-update nang kusa.
5. Sabihin sa user; i-update ang seksyon 2 ng file na ito.

**Panganib na sasabihin sa user bago ang GO:** live test H1 ~ H18 lang ang nasaksihan (sa beta.76, huminto sa H18; ang beta.77 ay hindi pa live retest; `docs/handoff/LIVE_TEST_FINDINGS.md`); H19 hanggang 150 MW hindi pa live; nagti-trip ang starting point 150 MW sa RUN (seksyon 4); bukas ang #59 / #16 (bagong HMI), valve faceplate, standby na AUTO pero LOCAL, Bantayan ≠ HMI (#9 / #21), P2 #7 ~ #12, `sop_bawal.js` 6 FAIL (lumang test). Ang Stable sa site at sa app ng lahat ay mapapalitan mula 2.4.0.

