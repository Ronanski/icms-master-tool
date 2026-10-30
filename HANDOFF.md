# HANDOFF — iisang file para magpatuloy ang kahit sinong Claude o account

> **Ito lang ang kailangan.** Kapag binigay ang repo na ito sa bagong Claude, session o account, basahin ang file na ito MUNA: nandito ang kasalukuyang estado, ang mga thread / trabaho, ang mga utos at desisyon ng user (dating nasa project memory), at ang style. Detalye ng bawat Beta: `docs/versions/v3.2.0/UPDATE_REPORT.md` at git history.
>
> **Patakaran (CLAUDE.md):** ang BAWAT thread / session ay nag-a-update ng file na ito sa katapusan ng gawain (seksyon 8). Palitan ang luma, huwag magtambak ng kasaysayan.

Huling update: **2026-10-30 10:45 PM PHT** (DOCS thread: ika-6 na role na LIVE TESTER, rule na huwag i-archive ang mga thread, rule ng COMPACT at `docs/handoff/THREAD_BRIEFS.md`; docs lang. Bago nito 10:30 PM: mga desisyon ng user sa unang session ng bagong account, PR #83). **Lumipat na sa bagong account** (Claude Code desktop sa PC ng user). Tapos ang `docs/handoff/NEW_ACCOUNT_SETUP.md` bahagi B: 49 memory na-import (5 napalitan, hindi isinama); ang 3 skill mula `docs/handoff/skills/` at ang skill na `dcs-beta-live-test` ay naka-install sa PC.

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
| **Beta sa `main`** | `3.2.0-beta.76` (PR #80, GO BETA ng user "Sige beta. G."): live test findings sa beta.74 (#23, #28, #33 ~ #38, valve pop-out). Bago nito `3.2.0-beta.75` (PR #78, GO BETA ng user "Sige beta. G."): live test #25 at #21. Bago nito `3.2.0-beta.74` (PR #76, operator UI, GO BETA ng user "Oo go beta sa dalawa"), nakapatong sa `3.2.0-beta.73` (PR #77, mga finding ng live test sa beta.72). Bago nito `3.2.0-beta.72` (PR #73, GO ng user "imerge n lahat"): 027 CLOSED COOLING WATER HMI page. Bago nito `3.2.0-beta.71` (PR #75): 036 TURBINE OIL sa HSYM. Bago nito `3.2.0-beta.70` (PR #74, GO BETA ng user 2026-10-30 "g beta"): iisang HMI style HSYM + bagong MAKE-UP WATER. Bago nito `3.2.0-beta.68` (GO BETA ng user 2026-10-30 "Ge batch 1. Sabay beta na agad"): INSTRUMENT & PLANT AIR HMI page. Bago nito `3.2.0-beta.66` (GO BETA ng user 2026-10-30 "Ge batch 1. Sabay beta na agad"): 036 TURBINE OIL HMI page. Bago nito `3.2.0-beta.63` (PR #70, 057ec26): MAKE-UP WATER HMI page. Ang beta.64 / 65 ay numero ng ibang thread ng batch (tingnan ang git log). |
| **Bukas na PR** | Wala sa thread na ito. |
| **Naghihintay ng approval** | Mockup ng #16 (030 / 007 sa HSYM): https://claude.ai/artifact/N6DCUgSmrjXMgecVrpkWhA |
| **Live test** | Huling live run: v3.2.0-beta.74 · build 3f7da0e, malinis na Cold, H1 ~ H8; huminto sa H8 (expansion tank 0.80 m, walang control ng V-MU1033 / XV-MU1109, #23). 38 findings, 21 naayos at nakita live. Bukas: #16, #21, #23, #25, #28, #33 ~ #38 (#21 / #25 claimed fixed sa beta.75; #23, #28, #33 ~ #38 sa beta.76; parehong naka-merge, hindi pa live). **User 2026-10-30 7:39 PM PHT: "Wala ng retest muna. Ung isang account n mgtutuloy nun."** Ang BAGONG account ang magre-retest LAHAT ng hakbang Cold → 150 MW sa beta.76 (naka-merge na), isa bawat "G" ng user (LIVE RETEST, seksyon 5). Buong talaan, protocol at susunod: `docs/handoff/LIVE_TEST_FINDINGS.md`. |
| **Rule ng merge** | Sagot ng user 2026-10-30 8:00 PM PHT ("Sa GO BETA mo lang"): Beta sa `main` = GO BETA lang; Stable at workflow = GO STABLE lang. Nakasulat na sa CLAUDE.md, PROJECT_RULES 4 at README. |
| **Beta site** | Kusang nade-deploy pagkatapos ng berdeng Checks sa `main` (`site.yml`, `/beta/`). Sa app: banner na "Update now". |
| **Roadmap** (`docs/SPEC.md` 3) | 1, 2, 3, 5, 7 TAPOS. 4 (Training Cold → 150 MW) at 6 (HMI) bahagi. 8 Library ang huli. 9 Stable = GO STABLE lang. |
| **HMI** | Bago: 007 Air & Flue Gas (inaprubahan), 030 Seawater (STEEL), MAKE-UP WATER (STEEL, beta.63), 036 TURBINE OIL (STEEL, beta.66; may TCS OPERATION box ng pump) INSTRUMENT & PLANT AIR (STEEL, beta.68) at 027 CLOSED COOLING WATER (STEEL, beta.72). Plant view = mga bagong page + UNIT · controllers. Ang ibang system ay isa-isa, kapag sinabi ng user (`docs/hmi/HMI_SYSTEMS.md`). |

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

## 3. Mga thread / trabaho (2026-10-30 10:45 PM PHT)
| Thread | Kalagayan | Susunod |
|---|---|---|
| LIVE TESTER | bukas (2026-10-30) | naghihintay ng "G H1" ng user |
| DOCS | bukas (2026-10-30); PR #83 naka-merge | bawat bagong utos o pagtama ng user |
| AYUSIN LAHAT NG BUKAS NA FINDINGS NG LIVE TEST (BETA.72) | beta.73 at beta.75 naka-merge | retest H1 hanggang Turbine Oil |
| BUILD ANG OPERATOR UI: POP-OUT FACEPLATE, GABAY DOCK, ALARM | beta.74 (PR #76) at beta.76 (PR #80) naka-merge | mockup #16 030 / 007 sa HSYM naghihintay ng approval |
| GUMAWA NG HMI PAGE NG CLOSE COOLING WATER | beta.69 (GO BETA ng user) | live check ng user sa H9 |
| GUMAWA NG HMI PAGE NG INSTRUMENT AT PLANT AIR | beta.68 (GO BETA ng user) | live check ng Hakbang 10 ~ 13 |
| GUMAWA NG HMI PAGE NG TURBINE CONTROL OIL | beta.66 (GO BETA ng user) | live check ng user sa H13 ~ H16 |
| IMPROVE MAKE-UP WATER HMI VISUAL (dating "GUMAWA NG HMI PAGE NG MAKE-UP WATER SYSTEM") | beta.70 PR: HSYM + bagong MAKE-UP WATER; style standard naghihintay ng approval | GO BETA ng user; saka ilipat ang ibang HMI page sa HSYM, isa bawat Beta |
| Mockup: bagong dock at HMI para sa PC at tablet landscape | naka-merge sa beta.61 | live check ng user sa beta.61 |
| Fix Training to allow starting SWP C | naka-merge sa beta.61 | live check ng user (SWBP hindi pa nasubok) |
| Live test ng start-up steps (Remote Control) | huminto sa H8 (valve pop-out) sa beta.74; walang retest sa account na ito (user 2026-10-30) | BAGONG account: retest ng lahat ng hakbang Cold → 150 MW sa beta.76, isa bawat "G" ng user (seksyon 5) |
| AYUSIN ANG 8 FINDINGS NG LIVE TEST (BETA.61) | naka-merge sa beta.62 | retest H2 ~ H8 |
| Dock: Training button = Training dock (beta.58 ~ 60) | tapos | — |
| Training: starting points at SOP alignment (fixer) | tapos | wala hanggang may bagong findings |
| Propose Seawater System HMI page | tapos (beta.56 / 59) | — |
| I-UPDATE ANG REPO PARA SA PAGPAPASA (HANDOVER) | tapos (docs lang): project instructions sa NEW_ACCOUNT_SETUP, kopya ng skills sa `docs/handoff/skills/`, live test findings sa `docs/handoff/LIVE_TEST_FINDINGS.md`, SPEC plano, plano ng Stable (seksyon 9). User 2026-10-30: "Go stable pre" tapos "Basta gsto ko lng. Updated lahat" = handover, HINDI release | wala; Stable sa susunod na GO STABLE |
| HANDOFF.md: isang file para sa lipat ng account | naka-merge (PR #65, #68, #79); docs/handoff/ handa | lipat ng account (START PROMPT sa NEW_ACCOUNT_SETUP.md) |

Lahat ng iba (audit, sand DITL, ABC ↔ DITL links, plant model MST / RH, instrument list, HMI audit) ay TAPOS at naka-merge.

## 4. Bukas na isyu at desisyon
- **Starting point 150 MW nagti-trip sa RUN (2026-10-30, beta.76 · build 2f48046, live check sa browser):** MFT DITL-03A row 17 sa unang segundo; ang cause ay input row 3 "SAF STOPPED = 1". Huminto ang PAF, SAF at FAB-A, saka ang IDF at FAB-B. Naulit 2 beses. Naka-hold (fokus = Cold → full load). Hindi pa na-trace ang sanhi.
- **Operator UI (beta.76):** may valve pop-out na ang XV-MU1109 at V-MU1033 (iba pang MOV wala pa). Hindi pa HSYM ang 030 at 007 (#16, maliit ang text sa 1366): mockup muna. Ang banner ng dock ay may button pa rin na pumipindot para sa operator sa ilang kaso (AUTO ng standby, tick ng SOP item): hindi pa binago. Ang "SOP bago i-START" ng pop-out ay ang line-up ng bukas na hakbang (sa H3 ay ang 15 item ng H2 pa: #13 ng findings thread). Bantayan ng dock at value ng HMI magkaiba minsan (#9 / #21).
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
  5. **LIVE TESTER** — siya ang nagla-live test ng Training Cold → full load sa built-in browser ng Claude app sa PC, isang hakbang bawat "G" ng user (saksi ang user). Sumusunod sa TEST SOP, LIVE RETEST at skill na `dcs-beta-live-test`. Ipinapasa niya ang findings sa leader, at ang leader ang nag-uutos ng ayos sa tamang thread. Hindi siya nag-e-edit ng code at hindi nagme-merge. Ang "G" ay tina-type ng user sa LIVE TESTER thread; naka-on ang Remote Control ng thread na iyon para makita ito sa phone.
- Ang leader lang ang nagbubukas ng thread, at kapag may trabaho lang ito. Iisang format ng sagot sa leader at sa mga thread.
- Huwag i-archive ang mga thread (user 2026-10-30); naka-off na ang auto-archive kapag na-merge ang PR.
- Brief ng bawat role (para sa simula at pagkatapos ng compact): `docs/handoff/THREAD_BRIEFS.md`.

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
4. **Screenshot bago at pagkatapos** ng bawat hakbang. **Kapag may mali (user 2026-10-30, pinalitan ang "huminto sa unang mali"):** depende sa criticality at kung may chain reaction sa susunod na hakbang. Critical o may chain = huminto at ipaayos; maliit = itala at tuloy. Ang ulat ng hakbang ay may criticality at mungkahi; ang user ang nagpapasya.
5. **Ang tanong ay sinasagot ng sagot, hindi ng aksyon.** Kapag nagtanong ang user, sumagot lang; huwag magsimula ng test o ng anumang gawain dahil sa tanong.

**LIVE RETEST (user 2026-10-30):** sa built-in browser ng Claude app sa PC ng user (Beta site pagkatapos ng "Update now"); si Claude ang pumipindot, saksi ang user. LAHAT ng hakbang Cold → 150 MW, pero isa-isa (isang hakbang bawat "G"). Bawat ulat ng hakbang: finding, criticality (critical / chain o maliit), mungkahi (huminto para ayusin o tuloy); ang user ang nagpapasya. Skill: `dcs-beta-live-test`.

- **Lahat ng testing ay LIVE** (user 2026-10-30): ang user ang SAKSI, sa sarili niyang app pagkatapos ng "Update now", isang hakbang bawat "G". Ang headless run ay HINDI live test at hindi tinatawag na live.
- Habang nag-aayos: `npm run build` + `npm run check` lang. Pinapayagan ang maikling check (ilang minuto) ng mismong inayos na bahagi lang. Bawal ang buong Cold → 150 MW run nang walang go ng user.
- Bawat check ng hakbang: 7 bahagi (Training list, dock, header, logic sheet, bagong HMI, status bar, events) + RUN pula / STOP berde / TRIP lamp + FIELD / permissive.
- Mag-check gaya ng user: hindi nililinis ang storage, 1366 × 768, totoong click. Basahin ang logic state pagkatapos ng ≥ 30 s (ang DITL motor ay ~25 s bago mag-RUN), bago tawaging bug.
- Test batay sa reference (PR-OPE-5002, DITL, ATS criteria, FHI Fig. 2, HMI snapshot), hindi sa coach ng Training. Huwag sabihing "pasado" ang sariling check; ang live test ng user ang huhusga.
- Hanapin LAHAT ng mali muna, ayusin nang sabay-sabay, isang pasada lang.

### Pag-uulat at style
- **Taglish** (~80 % Tagalog), maikli, simple, buong pangungusap. Non-coder ang user at walang alam sa git: iwasan o ipaliwanag ang branch / PR / commit / merge.
- Oras ay laging **PHT** (UTC + 8). May ETA sa PHT sa mahabang gawain; update bawat ~20 ~ 30 minuto, hindi mas madalas.
- Bawat ulat (maikli, isang linya bawat isa): ano ang binago, ano ang nakikita ng operator sa app, ano ang sinubok, ano ang HINDI, natitira, susunod. Walang pangalan ng file / test sa ulat sa user. Walang sariling-gawang termino.
- Huwag mag-claim na tapos / nakita / nasubok nang walang ebidensya (screenshot sa totoong app).
- Sabihin agad sa user pagkatapos ng bawat merge.
- Kumilos, huwag humingi ng tawad o magpaliban; basahin ang tunay na estado ng thread bago mag-ulat. Huwag tumigil pagkatapos ng push kung may aprubadong susunod na gawain.
- Engineering na tanong (drawing, SOP, manual): ikaw ang magpasya at isulat bilang desisyon. Itanong lang ang layunin o gusto ng user. Gumamit ng decision card (pipindot lang ang user).
- Ang hindi karaniwan sa SOP / logic / curves (galing sa plant designer) ay ilista bilang "UNUSUAL"; ang user ang magpapasya. Huwag tahimik na baguhin.

### App, UI / UX
- **Operator UI (user 2026-10-30, mockup v7 "G n yan"):** HMI process graphic ang nasa gitna, buo; ang click sa equipment ay maliit na pop-out faceplate SA TABI nito (controls + permissive mula sa SOP at logic); controls sa faceplate lang. Ang dock ay GABAY lang: hindi pumipindot, hindi nag-a-AUTO, hindi nagta-tick (maliban sa AUTO tick na nagbabasa ng logic), hindi lumalaktaw ng timer, hindi nagfo-force; huwag gamitin ang salitang "coach" sa app.
- Text ng app = English, propesyonal na DCS term (PV, SP, MV). Chat at docs = Taglish.
- **RUN = PULA, STOP = BERDE.**
- Magaan ang app sa LAHAT ng device (PC, tablet, phone). Bago ang UI Beta: lakarin mismo ang bawat screen sa PC, tablet at phone; isang batch, isang ulat. Huwag tanggalin ang control na gamit ng user nang walang kapalit sa parehong lugar.
- Ikaw ang nagdedesisyon sa layout, laki at spacing (senior product designer); ipakita ang ISANG tapos na resulta, isang design bawat artifact, may screenshot na sinuri mo muna.
- **HMI (user 2026-10-30):** iisang style para sa LAHAT ng HMI page: `docs/hmi/HMI_STYLE.md` + library `src/ui/plant/hmi-sym.js` (HSYM). Huwag kopyahin ang layout ng snapshot; ipakita ang loob at galaw ng equipment (animation); tuloy-tuloy na tubo, walang halatang dugtong o laktaw; professional. Mockup / proposal muna bago code. Dati: sariling vector graphics (snapshot = gabay lang); 3 style na pagpipilian (CUTAWAY / STEEL / THERMAL), Seawater = STEEL. Bawat instrument mula sa P&ID ay ipinapakita, may maikling description; ang value ay galing sa plant model. Ang redesign ay bagong komposisyon, hindi pagpalit ng kulay. Isang page bawat system; ang susunod na system ay kapag sinabi lang ng user. Ang live test ay tumitingin din kung may kulang sa HMI.
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
- Source: `src/` (`src/README.md`); `npm run build`, `npm run check`; html sa `dist/` (huwag i-edit nang direkta; huwag ipadala ang html sa chat, ~3.7 MB).
- Training dock: `src/ui/training/dock.js`, `dock.css`. HMI: `src/ui/plant/hmi2.js` (AFG), `hmi-sw.js` (030), `hmi-sym.js` (HSYM, iisang style ng HMI; `docs/hmi/HMI_STYLE.md`), `hmi-mu.js` (MAKE-UP WATER), `hmi-ia.js` (INSTRUMENT & PLANT AIR), `hmi-cw.js` (027 CLOSED COOLING WATER). Plant model: `src/analog/engine/unit.js`, `tcs.js`. Mundo ABC + DITL: `src/world/world.js`.
- Tests: `tests/regress/` (README sa loob), `tools/training/human_run.js`, `tools/ui-audit/audit.mjs`.
- Reports: `docs/versions/v3.2.0/UPDATE_REPORT.md`, `UNLINK_AUDIT.md`, `INSTRUMENT_VALVE_COVERAGE.md`; `docs/abc-audit/ABC-AUDIT.md`; HMI `docs/hmi/` (`OPERATING_POINTS.md`, `HMI_ART_SPEC.md`, `HMI_SYSTEMS.md`).
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

**Laman kapag ginawa mula sa `main` ngayon:** 3.2.0-beta.76 (higit 100 commit mula v2.4.0): iisang mundo ABC + DITL, Training Cold → 150 MW (Gabay dock), starting points Cold / 150 MW, plant model (steam table, MST / RH), operator UI (pop-out faceplate, alarm ACK), bagong HMI pages (seksyon 2).

**Itanong sa user bago magsimula (isang decision card):** kung ang kasalukuyang `main` ang ilalabas o hihintayin ang retest / susunod na Beta.

**Mga hakbang:**
1. Sa working branch mula `main`: `src/version.txt` = `3.2.0` (walang `-beta`), `npm run build` (iisang `dist/logic-sim-v3.2.0.html`), `npm run check`, mabigat na test isang beses (PROJECT_RULES 5.3), seksyon 3.2.0 sa `docs/versions/v3.2.0/UPDATE_REPORT.md`, `docs/versions/v3.2.0/Release-Report-v3.2.0.pdf` (KAILANGAN ng `release.yml`; tingnan ang `v2.4.0` para sa anyo), `HANDOFF.md`.
2. PR → merge sa `main` (GO STABLE). Hintayin ang berdeng Checks.
3. `release.yml` (manual): input `go` = `GO v3.2.0` eksakto, `dry_run` = `true` muna (build ng apk + exe lang), saka `false` (gagawa ng tag `v3.2.0` at GitHub Release: apk, portable exe, html, report pdf; tinatanggal ang Beta asset at pre-release).
4. Kusang lilipat ang Stable page ng site sa pinakabagong tag `v3.2.0` (`site.yml`); ang apk / exe ay mag-a-update nang kusa.
5. Sabihin sa user; i-update ang seksyon 2 ng file na ito.

**Panganib na sasabihin sa user bago ang GO:** live test H1 ~ H7 lang ang nasaksihan (huminto sa H8 sa beta.74; `docs/handoff/LIVE_TEST_FINDINGS.md`); H9 hanggang 150 MW hindi pa live; nagti-trip ang starting point 150 MW sa RUN (seksyon 4); bukas ang #16 (030 / 007 HSYM), valve faceplate, standby na AUTO pero LOCAL, Bantayan ≠ HMI (#9 / #21), P2 #7 ~ #12, `sop_bawal.js` 6 FAIL (lumang test). Ang Stable sa site at sa app ng lahat ay mapapalitan mula 2.4.0.

