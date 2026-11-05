# LOCAL TAKEOVER — buong turnover ng project (update 2026-11-05 6:30 PM PHT, WENDY : FULL TURNOVER)

> Basahin ito MUNA, bago ang `HANDOFF.md`. Ang file na ito ay ang buod ng lahat ng kailangan para magpatuloy ang kahit sinong Claude (local Claude Code sa PC ng user, o bagong cloud session / account): layunin, rules, setup, roles, tapos na, bukas, kulang, at isang prompt na handang i-paste (seksyon 11). Kapag iba ang repo sa file na ito, ang repo ang tama; ayusin ang file na ito.
>
> Dahilan ng update: malapit na sa weekly limit ang user (91 %, 2026-11-05 6:20 PM PHT). Ang naunang bersyon (2026-11-04 11 PM, beta.19, deadline 6 AM) ay luma na; nasa git history.

## 1. Layunin ng project

Kumpletong **DCS logic simulator + plant simulator ng LMYP #1** (460 T/H CFB boiler, 150 MW; STN101 ~ STN105 = S1 ~ S5), batay LANG sa mga dokumento sa `document-references/`:

1. **DCS logic simulator** (ABC analog + DITL digital, iisang mundo, laging magkakabit) na may **plant model ON / OFF** (OFF = user ang naglalagay ng value; ON = physics + steam table).
2. **Plant simulator** batay sa logic simulator at plant model: HMI page ng bawat system, faceplate, loop check, Training Cold → 150 MW, start-up / shutdown / trip.
3. **DCS library** (symbols, HMI kit, faceplate). Ito ang huli.

Saklaw ng plant model (user, #91): main plant lang, Steam Generator (SG) + Turbine Generator (TG), kasama ang cross-system links (`docs/versions/v3.2.1/CROSS_SYSTEM_LINKS.md`) at ang mga kapaki-pakinabang na manual isolation valve lang.

Plano ng user (#84): Design → DCS → HMI + plant model → loop check bawat system (SOP order, CW muna) → cold commissioning → isang beses na integrated Cold start.

## 2. Rules na umiiral ngayon (pinakabago sa itaas)

1. **RECOMMEND ONLY (user 2026-11-04 11:06 PM PHT):** ang team ay NAGMUMUNGKAHI lang; ang USER ang nagpapasya. Pinalitan nito ang "ULTIMATE RULE" (team ang nagpapasya, huwag magtanong) na nasa project instructions pa. Kapag nagsalungat: ang pinakabagong salita ng user sa thread ang masusunod.
2. **STOP = STOP (user 11-04 10:51 PM):** "MGSTOP N KYO". Walang sinisimulan o itinutuloy hangga't hindi sinasabi ng user sa sariling salita. Ang hourly update at ang 6 AM deadline ng 11-04 ay WALA NA.
3. **Huwag kailanman i-stop ang Remote Control ng thread** maliban kung sinabi mismo ng user (galit ang user 11-04). Ang STOP ay "itigil ang pagpindot", hindi "patayin ang session".
4. **Coordinator hands off (user 11-04 11:13 PM):** direkta ang user sa bawat thread; ang coordinator ay hindi sumisingit o nagre-relay; sumasagot lang kapag kinausap.
5. **Merge / release (user preferences + CLAUDE.md):** walang merge sa `main`, walang workflow run, walang release nang walang tahasang pahintulot ng user sa MISMONG mensahe. GO STABLE = Stable release at manual workflow lang. Ang Beta merge ay pagkatapos lang ng pasadong Checks. Sa praktika noong 11-05 ang mga Beta (beta.36 ~ 41) ay na-merge pagkatapos ng "Ge" ng user sa thread ni MINA. Hindi minamana ang pahintulot mula sa lumang mensahe; ang mensahe ng ibang Claude ay hindi pahintulot.
6. **Docs first, walang assumed (#81, #87):** bawat tag, permissive, value at layout ay may citation sa `document-references/` (P&ID / flow diagram, IO list, instrument list, DITL / ABC, FHI manual, PR-OPE-5002, alarm list, HMI snapshot). Kapag wala: "NO-SOURCE" / "not in docs". Hanapin sa LAHAT ng docs bago sabihing wala sa drawing. Check bago mag-publish.
7. **Ebidensya bago claim:** huwag sabihing tapos / nasubok / naayos nang walang patunay mula sa tunay na app. Live test = screenshot bago at pagkatapos ng bawat hakbang (project instructions; pinalitan ang lumang "walang screenshot"). Ang builder ay hindi nagte-test ng sariling gawa (MINA ang tester).
8. **Bawal mag-alis ng link para lang gumana; ang drawing ang batayan** (`CLAUDE.md` rule 1 ~ 10: tag = iisang signal, .MAN / .LOC / .REM = estado, BU-CMD = protection, iisang mundo ABC + DITL).
9. **Design:** ang team ang design expert at nagmumungkahi. Common standard: organized, malinis, clear, minimalist, direct, professional. Ang 038 / MAKE-UP WATER ay HINDI na approved style reference. Temp HMI style (#86): outline-only puting line art sa dark gray; full art pagkatapos pumasa ang lahat ng loop check. Kulay: RUN = PULA, STOP = BERDE. Faceplate: 2 bawat equipment (control; permissive + trend + monitor sa Y / N); Y = pula = kumpleto. App text sa English, walang acronym bilang label. Magaan sa lahat ng device (focus PC at tablet landscape).
10. **Loop check standard (user 11-04):** LOOP CHECK = signal path lang (breaker TEST): REMOTE / LOCAL DI, START / STOP DO, RUN / STOP feedback DI, TRIP DI + alarm, current AI. FUNCTION TEST = logic: block sa LOCAL / TRIP, MAN start / stop, AUTO standby, auto cut-in sa trip, LOCAL start / stop + E-STOP sa FIELD buttons. Gumagana kahit shutdown. Kasama ang analog (user 11-05: "Di lng dpt digital signals iloopcheck, included ang mga analogs"). ISANG buong ulat, iisang sagot.
11. **Pakikipag-usap:** Taglish (~80 % Tagalog), maikli, magalang, oras sa PHT (UTC + 8). Walang "po", walang emoji, walang reaction, walang table. Sagutin ang eksaktong tanong; huwag utusan ang user; walang sarcasm, walang mahabang paliwanag, walang paulit-ulit na sorry; kapag nagkamali, isang linya saka ayusin. Walang pangako ng oras. Iulat ang nakikita ng operator. Bawat ulat: binago, sinubok, hindi sinubok, natitira, susunod.
12. **Thread names (#59):** `NAME : ROLE`, ALL CAPS, babaeng pangalan, hindi inuulit. Nagamit na: LISA, MINA, WINTER, YUNA, NINGNING, ROSÉ, KARINA, GISELLE, LIA, JISOO, IRENE, HAEWON, YERI, SANA, JENNIE, SEULGI, WENDY.

Mga lumang rule na pinalitan na (huwag sundin): "ULTIMATE RULE" ng 11-04 (team ang nagpapasya), "G requirement tinanggal", "walang screenshot", "Beta walang approval" ng 11-03, deadline 6 AM 11-05.

## 3. Setup

- **Repo:** `Ronanski/icms-master-tool` (public; huwag i-commit ang PC-only references). Version: `src/version.txt` + `package.json`.
- **PC ng user:** Ronanski-PC, Dell Precision 3570, Windows 11. Repo clone: `C:\Users\Ronanski\Downloads\app-projects-ai-collections\projects\icms-master-tool\icms-master-tool`. Ang ibang clone sa parent folder (`docs-refresh-clone`, `ui-overhaul`) ay luma, huwag gamitin. Team files (lokal): `..\team-files\` (progress, `TEST_LOCK`, `alarm-list-csv\`).
- **Memory sa PC (local Claude Code):** `C:\Users\Ronanski\.claude\projects\C--Users-Ronanski-Downloads-app-projects-ai-collections-projects-icms-master-tool\memory\` (index `MEMORY.md`). Kopya ng lumang account: `docs/handoff/PROJECT_MEMORY.md`. Ang cloud project memory ay hindi sumasama sa local; ang mahalaga ay nasa file na ito.
- **Commandments hook sa PC:** `~/.claude/hooks/icms-commandments.js` (SessionStart); kopya `docs/handoff/COMMANDMENTS.md`.
- **References na naka-commit:** `document-references/` (DITL / ABC PDF/DWG, IO / memory list 101 ~ 105, instrument list, flow diagram K1AU3-A1-0-001 RA / RB, FHI manual, PR-OPE-5002 / 5003 / 5004, alarm list, HMI snapshot, fan manual, PLC zips; listahan sa `CLAUDE.md` rule 4).
- **References sa PC LANG (hindi naka-commit):** `document-references/tg-engineer-data/`, `o&m-package-phase-1/` (L1 FHI, L5 limestone / sand, L6 bottom ash, L14 diesel, L16 fans, L18 debris filters, L20 APH, L22 DCS), `instrument-engineer-data-asbuilt/`; `..\for-github-icms-master-tool\document-references\tcs-references\` (TCS soft logic). Vendor PDF ng CW sa project files `cw-plant-model/vendor/`. Wala sa PC: drum volume, turbine HBD, historian (YERI 11-04); bahagyang heat balance ng FW train + DA 120.9 m3 + hotwell 61.9 m3.
- **Build at test:** `npm run build` (iisang html sa `dist/`, huwag i-edit), `npm run check`, `npm test` (`tests/regress/`), `npm run scenarios`. Lean test policy (`PROJECT_RULES.md` 5): walang paulit-ulit na test run; mabibigat na test isa-isa (Playwright timing fails kapag sabay-sabay), CPU ≤ 85 %. Sa Windows: Google Chrome headless (hindi nagla-launch ang Playwright Chromium). Huwag mag-kill ng process by name.
- **Beta / Stable process:** branch mula `main` → PR → Checks (`.github/workflows/checks.yml`) pasado → merge sa pahintulot ng user → kusang deploy ng Beta site (`site.yml`, `/beta/`, banner "Update now"). Tala bawat Beta sa `docs/versions/v3.2.1/UPDATE_REPORT.md` at sa `HANDOFF.md`. Stable = GO STABLE lang: `HANDOFF.md` seksyon 9 (`release.yml` input `GO vX.Y.Z`, dry run muna). Max 3 branch bukod sa `main` (user rule); ~70 lumang branch sa GitHub na ang user ang magbubura.
- **Live test method:** built-in browser ng Claude app sa PC (Beta site pagkatapos ng "Update now", tamang version sa status bar) o dev server (`npm run dev`, `.claude/launch.json`). Screenshot bago at pagkatapos ng bawat hakbang; i-attach sa ulat (phone-friendly artifact para sa plant model, #91). Basahin ang app mismo (value, kulay, text) laban sa docs. Ang Remote Control at cloud thread ay iisang usage limit; ang pagsara ng Claude desktop app ay pumapatay ng tests ng RC.

## 4. Mga thread at role (huling kalagayan 2026-11-05)

- **JENNIE : COORDINATOR** — project chat; hands off sa threads (rule 4).
- **MINA : TESTER** (cmsg_01V4rVM9gnpMDfWtQBoeoBk651SMpEYLwpceMD6GnQV94Y) — live loop check at function test; siya rin ang gumawa ng split view beta.36 ~ 41. Huling gawa 11-05 5:46 PM PHT: LP heater isolation test (seksyon 6).
- **JISOO : HMI MOCKUP** (cmsg_01V4rVM9gnpMDfWtQBoeoBk6CqBX2vfQJh442ToyWiPzUp) — 19 HMI pages (00 ~ 18), lahat nasa app na (beta.8 ~ 28). Done.
- **IRENE : PLANT MODEL** (cmsg_01V4rVM9gnpMDfWtQBoeoBk68WrT7tNKwKWEGXVM3iAcU7) — turbine side + final hookup: CW, MU, CCW, Air, Turbine Oil, Condensate, Feedwater, HP / LP heaters, Aux steam. Owns `plant.js`, `unit.js`, `world/plantsw.js`, `tcs.js`, `fp-pop.js`.
- **SEULGI : PLANT MODEL (boiler side)** (cmsg_01V4rVM9gnpMDfWtQBoeoBk6PjY1m1zvf1ocBZUejVFbJa) — `src/analog/engine/boiler.js`: diesel, fans, limestone, sand, bottom ash. Bukas: PR #141. Huwag i-prettier ang `plantsw.js`.
- **KARINA : DOCS** — PR #158 docs cleanup (12 rules), rules artifact KVn77Dgm3kP1rPckXGaBGS.
- **HAEWON : AUDITOR** (cmsg_01V4rVM9gnpMDfWtQBoeoBk6Sqr2bA7WBpsyPc8gBEk7ur) — HMI audit PASS.
- **YERI** — PC data search. **WENDY : FULL TURNOVER** — ang file na ito.
- Naka-save na ideya (huwag pang gawin): CodePLC-style Work Order / fault-finding mode (cmsg_01V4rVM9gnpMDfWtQBoeoBk6Ms9zHU7NohVMVDmSLGN2r6).

## 5. Tapos na (may ebidensya sa repo)

- **Stable v3.2.0** (2026-11-03, = 3.2.0-beta.91, `main` 6c95c5d). Hindi live-tested ang beta.90 / 91.
- **Beta sa `main`: 3.2.1-beta.41** (bb5b699, 2026-11-05 2:04 PM PHT).
- HMI pages sa app (temp style): 01 CIRCULATING WATER (beta.8), 02 MAKE-UP AND CLOSED COOLING (.9), 03 INSTRUMENT AND PLANT AIR (.10), 04 TURBINE OIL (.11), 05 CONDENSATE (.12), 06 FEEDWATER (.15), 07 DRUM AND MAIN STEAM (.19), 08 AUX STEAM AND VACUUM (.20, values .23), 09 AIR AND FLUE GAS (.21), 10 PURGE AND TRIP (.22), 11 DIESEL AND BURNERS (.24), 12 COAL, LIMESTONE AND SAND (.25), 13 ~ 15 TURBINE START, ESP AND ASH, SOOTBLOWERS (.26), 16 ~ 18 SAMPLING AND DOSING, GENERATOR, EXTRACTION AND DRAINS + 00 OVERVIEW (.28).
- Plant models (docs sa `docs/versions/v3.2.1/*_PLANT_MODEL.md`): CW, MU, CCW, Air + air valves, Turbine Oil, Condensate, Feedwater, HP heaters, LP heaters, heater levels, Aux steam, Diesel, Fans, Limestone + Sand, Bottom ash (+ air source #139). Mass balance check (`MASS_BALANCE_CHECK.md`), data answers (`DATA_ANSWERS.md`).
- Faceplate FIELD · LOCAL PANEL bawat motor (beta.18; `MOTOR_LOOP_CHECK.md`) at mga HMI fix beta.29 ~ 35 (ACWP local STOP, compressors / dryers start, CEP AUTO, MOV lamp wiring, BFWP lube oil pumps, DITL-38 selector, APH trip reset, MAN station 1 / 5 % steps, ash cooler local).
- **Split view loop check (beta.36 ~ 41):** HMI | logic, tag table (static / dynamic), controller tags, events, dock / float; batch = isang equipment; controller batch nagbubukas ng ABC sheet; instrument batches; analog Expected 0 / 25 / 50 / 75 / 100 %; **Inject / Release** (beta.41, live PASS sa PC 1600 px at tablet 1024x768: LTCD1110 Inject 25 % = -211.0 mm, forced, Release bumalik sa plant).
- Live loop check (MINA): 030 CW SWP-A, SWP-B (buong loop + function sa beta.19), SWP-C, cut-in, SWP-B LCP, SWBP-A / B / C = PASS.
- DCS check: ABC F(X) 89, PID / MAN / SUMA 136, AI ranges 157 tugma. DITL 22 / 31 lang ang na-verify.

## 6. Bukas na PR (live state 2026-11-05 6:25 PM PHT)

- **#141** Sand DITL-771 reset + limestone DITL-LS212 isolating valves open from the CRT (SEULGI, branch `claude/project-thread-6ji6uz`). Hindi naka-merge; ang base ay `main` ng 11-04 (bago ang beta.20 ~ 41), kaya i-update muna sa `main` at hintayin ang Checks bago merge.
- **#158** Docs cleanup: remove stale md files, unify rules (KARINA, `claude/docs-cleanup`). Hindi naka-merge. Pansinin: maaaring sumalungat sa file na ito; basahin bago i-merge.
- **#96** UI overhaul (style-independent part), **#93** HMI kit — luma (11-02); malamang isara o i-rebase, desisyon ng user.
- **#97, #95** docs draft — luma (11-03); malamang isara.
- Ang PR ng turnover na ito (docs lang).
- Ang #139, #140, #142 ay naka-merge na.

## 7. Bukas na findings (hindi pa naayos, maliban kung sinabi)

Mula sa live test ni MINA 2026-11-05 (beta.41, 028 CONDENSATE, MV-CD1001 LP heater inlet, DITL-69):
1. ISOLATE: tama ang logic (binuksan muna ang bypass MV-CD1003, saka sinara ang MV-CD1001 / MV-CD1002), pero **hindi naka-model ang LP heater isolation / bypass** sa plant model: hindi gumalaw ang pump outlet 16.9 kg/cm2, PT-CD1122 6.9, heater outlet 72 / 92 / 116 °C.
2. **REINSTATE: "EXECUTED" pero nanatiling 0 % ang valve**; ang limit switch FULLY OPEN (I.0280) / FULLY CLOSED sa DITL-69 ay hindi sumusunod sa galaw ng valve (naka-1 pa ang FULLY OPEN kahit 0 %).
3. **Pagkagaling sa Split, logic sheet ang lumalabas sa Plant view** sa halip na HMI.
4. **HMI Expected ay hindi sumusunod sa logic row** (split view; ayon sa coordinator, galing sa parehong test).
5. Root valve ng transmitter: wala pa sa app (hindi nasubok).
Sinabi ni MINA na aayusin ang 1 ~ 3 at live test ulit bago Beta; walang branch o PR para dito sa GitHub sa oras ng turnover = HINDI pa nasisimulan sa repo.

Mula sa CW live test (MINA beta.18 / 19):
- HIGH: SWBP faceplate START nangangailangan ng SWP-B (DITL-30 = kahit anong SWP). Commit f49f91d (beta.21) "SWBP start permissive (one running SWP is enough) and clean, resettable trip alarm" = naayos sa code; live retest hindi ko nakita.
- MED: trip alarm hindi nawawala pagkatapos ng RESET (SWP-A, SWBP-A) + raw text. Parehong commit (beta.21); live retest hindi ko nakita.
- LOW (hindi ko ma-verify kung naayos): SWP current 228 A laban sa SOP 205 ~ 215; SWBP faceplate walang current / trend; natitirang ANALOG SHEETS strip; tinatakpan ng beta banner ang alarm band.

Plant model at logic (iba pa):
- PR #141 findings: LS10 row 7 ROTOFEEDER FAULT walang NOT sa ENABLE gate (salungat sa drawing, hindi binago); LS212 rows 18 ~ 20 (MFT I.0560, 52G1 M.3224, coal feeders M.050A) hindi nakakabit; BA conveyors RUNNING static.
- DITL-28C #B SOV limit switches; pneumatic dampers PCD-FG1056-1, TCV-FG1116 / 1117 fail action hindi alam; AN_MT walang PAF / SAF / FA motor temps; PAF / SAF huminto sa isang UI screenshot run (sanhi hindi alam).
- Hotwell 36.6 laban sa 40 °C; MWP current ~20.7 / 28 A UNUSUAL; CCWHE UA 7 % ng clean.
- Lumang isyu: starting point 150 MW nagti-trip sa RUN (MFT DITL-03A row 17, "SAF STOPPED = 1"; sanhi hindi pa na-trace); HP bypass hindi sinasara ng saradong MV-MS1391.
- Pre-existing regression FAIL (pareho sa `main`): ditl150 "Reset" 1, sop_bawal 10 (Gabay Cold hindi nagsisimula ng world sa cloud), loop_source 1.
- Stray folder `undefined/` (f1.png, f2.png) sa `main`: alisin.

## 8. Kulang pa (hindi pa nagagawa)

- Live loop check at function test ng natitirang equipment: lahat ng motor sa `MOTOR_LOOP_CHECK.md` pagkatapos ng CW (MWP, ACWP, CEP, BFWP, fans, ...), lahat ng MOV / control valve at analog instrument gamit ang split view; page 07 test; debris filters, hypochlorite, manual valves.
- Gaps: ID fan cold start; Sampling page blanks; per-signal ABC / DITL tracing; AI range / alarm / IO checks; DITL 9 sa 31 hindi pa na-verify.
- Plant model: LP heater isolation / bypass (seksyon 7); transmitter root valves; APH sootblower.
- Cold commissioning at ISANG integrated Cold → 150 MW start (Training), saka shutdown / trip.
- Full HMI art (pagkatapos pumasa ang lahat ng loop check; mungkahi ng team, desisyon ng user).
- DCS library (goal 3).
- Stable v3.2.1 (GO STABLE lang, pagkatapos ng live check).

## 9. Mungkahing susunod (desisyon ng user, rule 1)

1. Ayusin ang findings 2 ~ 4 ng seksyon 7 (REINSTATE / limit switch, Split → Plant view, Expected), saka finding 1 (LP heater isolation sa plant model, IRENE side). Live test ulit ni MINA na may screenshot, saka Beta sa pahintulot ng user.
2. I-update sa `main` at i-merge ang #141 kapag pasado ang Checks at pumayag ang user; isara o i-rebase ang #93 / #95 / #96 / #97; desisyon sa #158.
3. Ituloy ang loop check bawat system ayon sa SOP order (seksyon 8).
4. Alisin ang `undefined/` sa `main`.

## 10. Saan ang mga bagay

Estado `HANDOFF.md`; gusto ng user `docs/SPEC.md`; rules `PROJECT_RULES.md`, `CLAUDE.md`, `docs/handoff/COMMANDMENTS.md`; thread briefs `docs/handoff/THREAD_BRIEFS.md`; live findings `docs/handoff/LIVE_TEST_FINDINGS.md`; bagong account `docs/handoff/NEW_ACCOUNT_SETUP.md`; skills `docs/handoff/skills/`; HMI `docs/hmi/` (ang `PENDING_HMI_BUILD.md` ay luma: 038 v15); bawat Beta `docs/versions/v3.2.1/UPDATE_REPORT.md`; plant model at loop check docs `docs/versions/v3.2.1/`. Source: HMI pages `src/ui/plant/`, split view / loop check `src/ui/training/`, plant model `src/analog/engine/` (`plant.js`, `unit.js`, `boiler.js`), switch list `src/world/plantsw.js`.

## 11. Prompt para sa bagong session (kopyahin nang buo)

```
Ito ang project na LOGIC_SIM_PROJECT (LMYP #1 DCS Logic Simulator + plant model, repo Ronanski/icms-master-tool).
Bago ang anumang trabaho:
1. Basahin nang sunud-sunod: docs/handoff/LOCAL_TAKEOVER.md, HANDOFF.md, CLAUDE.md, PROJECT_RULES.md, docs/SPEC.md.
2. Tingnan ang tunay na estado: git log origin/main -10, src/version.txt, bukas na PR at branch. Kapag iba sa LOCAL_TAKEOVER.md, ang repo ang tama.
3. Iulat sa akin (Taglish, maikli, walang table, walang emoji, walang "po", oras sa PHT): kasalukuyang Beta, bukas na PR, bukas na findings, at ang mungkahi mong susunod.
4. Huwag magsimula ng trabaho, test, merge, workflow o release hangga't hindi ko sinasabi sa mismong mensahe. Ikaw ay nagmumungkahi lang; ako ang nagpapasya.
5. Bawat value at tag ay may source sa document-references/; kapag wala, sabihin "not in docs". Walang claim na tapos o nasubok nang walang ebidensya (screenshot bago at pagkatapos sa live test).
Sa katapusan ng bawat gawain, i-update ang HANDOFF.md at ang LOCAL_TAKEOVER.md sa parehong PR.
```
