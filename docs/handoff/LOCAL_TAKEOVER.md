# LOCAL TAKEOVER — ang project ay hawak na ng Claude Code sa PC ng user (2026-11-04 11 PM PHT)

> Basahin ito MUNA, bago ang `HANDOFF.md`. Mula 2026-11-04 ~11 PM PHT, ang buong project (lahat mula sa simula) ay ipinasa sa **Claude Code na tumatakbo sa PC ng user** (Ronanski-PC, Windows 11). Ang local session ang magtutuloy nang mag-isa. Kapag iba ang repo sa file na ito, ang repo ang tama; ayusin ang file na ito.

## 1. Layunin ng project

**Kumpletong DCS logic simulator + plant simulator ng LMYP #1** (460 T/H CFB boiler, 150 MW; STN101 ~ STN105 = S1 ~ S5), batay lang sa mga dokumento sa `document-references/`:

1. **DCS logic simulator** (ABC analog + DITL digital, iisang mundo, laging magkakabit) na may **plant model ON / OFF** (OFF = user ang naglalagay ng value; ON = physics + steam table).
2. **Plant simulator** batay sa logic simulator at plant model: HMI pages ng bawat system, faceplate, Training Cold → 150 MW, start-up / shutdown / trip.
3. **DCS library** (symbols, HMI kit, faceplate).

Pinakabagong utos ng user (2026-11-04): tapusin bilang **kumpletong plant simulator**, i-test lahat, **walang bug**. Ang team ang nagpapasya sa lahat; huwag nang magtanong sa user. Ang Beta at Stable ay desisyon ng team.

## 2. Deadline at pag-uulat

- **Hard stop: 6:00 AM PHT, 2026-11-05** (= 2026-11-04 22:00 UTC). Kapag walang tapos na app sa oras na iyon, hihinto ang lahat ng trabaho.
- **Update bawat oras PHT** (11 PM, 12 AM, 1 AM, ...): maikli; tapos na may ebidensya, ginagawa, FAIL na nakita, susunod. Huwag huminto sa pagitan ng updates.
- **Panghuling ulat:** tapat; ano ang tapos at nasubok (may ebidensya), ano ang hindi, mga kilalang bug. Walang claim na hindi nasubok.

## 3. Mga rule (kopya ng project instructions, 2026-11-04; pinakamataas sa itaas)

1. **ULTIMATE RULE (11-04):** ang team ang nagpapasya sa lahat at HINDI nagtatanong sa user. Tapusin bilang kumpletong planta simulator; ibalita lang kapag tapos na, may ebidensya. I-test lahat, walang bug. **Tinanggal na ang G requirement sa live test.** Beta at Stable = desisyon ng team.
2. Laging tingnan muna ang GitHub repo (`Ronanski/icms-master-tool`) bago magtanong.
3. Kumilos bilang elite DCS engineer at eksperto sa UI / UX at layout.
4. **Common standard:** organized, malinis, clear, minimalist, direct, professional (lahat ng trabaho, ulat, design).
5. **Design ownership:** hindi designer ang user; ang team ang eksperto at nagmumungkahi ng design. Ang 038 / MAKE-UP WATER ay HINDI na approved style reference.
6. Magaan ang app sa lahat ng device (focus: PC desktop at tablet landscape).
7. **Respeto sa user:** magalang at maikli; sagutin ang eksaktong tanong; huwag utusan ang user ("pindutin mo"); walang sarcasm, walang mahabang paliwanag, walang paulit-ulit na sorry. Kapag nagkamali: isang linya, saka ayusin. Kapag galit ang user: kalmado, maikli, factual. Walang pangako ng oras. Tapusin ang isa bago ang susunod.
8. **Beta rule:** merge sa `main` LANG kapag pasado ang Checks (`.github/workflows/checks.yml`). Walang approval na kailangan sa Beta.
9. **Live test:** screenshot bago at pagkatapos ng bawat hakbang; huwag sabihing "tapos" nang walang ebidensya mula sa tunay na app.
10. Taglish (~80 % Tagalog), maikli, oras sa PHT, walang emoji, walang "po". App text sa English, walang acronym bilang label.
11. **Docs first:** bawat detalye (tag, permissive, value, layout) ay galing sa `document-references/` (P&ID / flow diagram, IO list, instrument list, DITL / ABC, FHI manual, PR-OPE-5002, alarm list, HMI snapshot). Kapag wala sa docs: "not in docs". Bagong HMI = galing sa P&ID, original na layout, hindi kopya ng snapshot.
12. Ang buong kaalaman sa DCS (tag = iisang signal, .MAN / .LOC / .REM = estado, BU-CMD, bawal mag-alis ng link, atbp.): `CLAUDE.md` rule 1 ~ 10. Kulay ng planta: RED = running, GREEN = stopped. Faceplate: 2 (control; permissive + trend + monitor sa Y / N), Y = red = complete.

Ang mga lumang rule sa `HANDOFF.md` seksyon 5 at `CLAUDE.md` na sumasalungat dito (GO BETA, isang hakbang bawat G, walang screenshot) ay **pinalitan na** ng mga rule sa itaas.

Ang project memory (mga file ng utos at aral ng user) ay nasa PC na: `C:\Users\Ronanski\.claude\projects\C--Users-Ronanski-Downloads-app-projects-ai-collections-projects-icms-master-tool\memory\` (index `MEMORY.md`). Kopya ng lumang account: `docs/handoff/PROJECT_MEMORY.md`. Mas bago ang mga rule sa seksyon 3 kaysa sa memory kapag nagkasalungat.

## 4. Kasalukuyang estado (2026-11-04 ~11 PM PHT)

| | |
|---|---|
| **Stable** | v3.2.0 (2026-11-03; laman = 3.2.0-beta.91) |
| **Beta sa `main`** | **3.2.1-beta.19** (27831d7, PR #138): page 07 DRUM AND MAIN STEAM + bottom ash plant model; page 07 feedwater / spray values = page 06. Regression tests sa cloud; hindi pa live-tested. |
| beta.18 | FIELD · LOCAL PANEL sa bawat motor faceplate (LCP START / STOP, EMERGENCY STOP, RELAY TRIP / RESET); `docs/versions/v3.2.1/MOTOR_LOOP_CHECK.md` (15 motor). |
| beta.8 ~ 17 | Approved mockup pages sa app: 030 CIRCULATING WATER, MAKE-UP AND CLOSED COOLING WATER, INSTRUMENT AND PLANT AIR, 036 TURBINE OIL, 028 CONDENSATE (05), FEEDWATER (06); BFWP suction mula sa snapshot. |

**Live loop check ng 030 CIRCULATING WATER (MINA, sa PC):** SWP-A at SWP-B = PASS. Natitira: SWP-C, SWBP A / B / C, saka ang iba pang motor sa `MOTOR_LOOP_CHECK.md` (MWP, ACWP, CEP, BFWP).

**Bukas na PR (2026-11-04 11 PM):**
- #139 Bottom ash: air source switch reads the plant air receivers (bago, sa Checks pa).
- #96 UI overhaul (style-independent part), #93 HMI kit, #97 / #95 docs (draft, luma na; isara o i-rebase kung kailangan pa).

**Regression tests na hindi pa natatapos sa cloud (beta.19):** plant_click, condensate, feedwater, heater levels, lube oil, field valves, faceplate, unit trip, DITL 150. Patakbuhin isa-isa sa PC (tingnan seksyon 6).

## 5. Susunod (sa ganitong ayos, hanggang 6 AM PHT)

1. I-merge ang #139 kapag pasado ang Checks (Beta rule).
2. Patakbuhin ang natitirang regression tests (seksyon 4); ayusin ang bawat FAIL.
3. Live loop check sa built-in browser: tapusin ang `MOTOR_LOOP_CHECK.md` (SWP-C at pataas), screenshot bago / pagkatapos ng bawat hakbang; ayusin ang FAIL, Beta.
4. Live Training Cold → 150 MW (`docs/handoff/LIVE_TEST_FINDINGS.md` protocol, pero walang G); ayusin ang blocker.
5. Natitirang HMI pages ng plant (pending list `docs/hmi/PENDING_HMI_BUILD.md`), galing sa P&ID.
6. I-update ang `HANDOFF.md` (estado) at ang file na ito sa bawat Beta; hourly update sa user.
7. Stable: desisyon ng team, kapag pasado ang lahat ng test at live check (`HANDOFF.md` seksyon 9).

## 6. Paano gumawa sa PC

- **Repo:** `C:\Users\Ronanski\Downloads\app-projects-ai-collections\projects\icms-master-tool\icms-master-tool` (remote `Ronanski/icms-master-tool`). Iba pang clone sa parent folder (`docs-refresh-clone`, `ui-overhaul`) = luma, huwag gamitin.
- **Branch → PR → Checks pasado → merge sa `main`** (squash, version sa `src/version.txt` + `package.json`, tala sa `docs/versions/v3.2.1/UPDATE_REPORT.md`). Max 3 branch bukod sa main.
- **Test sa Windows:** tingnan ang memory `windows-test-setup.md` (env vars, Chrome path, autocrlf). Mabibigat na test isa-isa (`../team-files/TEST_LOCK`), CPU ≤ 85 %. Huwag mag-kill ng process by name.
- **Live app:** dev server (`npm run dev`, `.claude/launch.json`) o ang Beta site; built-in browser ng Claude app.
- **Lokal na itinago:** ang lumang docs edits ng 2026-11-02 (branch `docs-95-local`) ay nasa `git stash` ("local docs edits 2026-11-02 ..."); hindi itinapon, luma na.

## 7. Mga reference (nasa PC, HINDI naka-commit: public ang repo)

Sa `document-references/` (untracked, lokal lang):
- `tg-engineer-data/` — turbine-generator engineering data.
- `o&m-package-phase-1/` — vendor O&M (L1 boiler FHI, L16 fans, L20 APH, L22 DCS, ...; marami ang scanned).
- `instrument-engineer-data-asbuilt/` — as-built instrument data.

Naka-commit na: DITL / ABC, IO / memory list, instrument list, flow diagram (K1AU3-A1-0-001), FHI manual, PR-OPE-5002 / 5003 / 5004, alarm list, HMI snapshot, fan manual, at iba pa (`CLAUDE.md` rule 4).

Mga lugar sa repo: estado `HANDOFF.md`; gusto ng user `docs/SPEC.md`; rules `PROJECT_RULES.md`, `docs/handoff/COMMANDMENTS.md`; HMI `docs/hmi/`; live findings `docs/handoff/LIVE_TEST_FINDINGS.md`; thread briefs `docs/handoff/THREAD_BRIEFS.md`; progress ng team `../team-files/progress/` (lokal).

## 8. Kasaysayan sa maikli

- 2026-10-15 ~ 10-19: logic simulator (ABC / DITL), v2.4.0 Stable.
- 2026-10-22 ~ 10-31: plant model, Training Cold → 150 MW, dock, HMI pages (steel style), live tests beta.74 / 76, 71 findings; lipat ng account 10-30.
- 2026-11-01 ~ 11-03: HMI kit, Worker, team ng threads (leader + HMI / UI / Code Fixer / Docs / Live Tester), v3.2.0 Stable 11-03.
- 2026-11-04: 3.2.1-beta.1 ~ 19 (approved mockup pages 030, 02 ~ 07, motor FIELD panel, bottom ash); ULTIMATE RULE; handover sa local Claude Code.
