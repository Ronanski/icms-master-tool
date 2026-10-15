# Current Project Handoff

> Single current handoff. Palitan ang lumang status kapag nagbago ang trabaho; huwag mag-append ng chat transcript.

## Project
DCS Logic Simulator sa `Ronanski/icms-master-tool`. Basahin muna ang `CLAUDE.md` at `PROJECT_RULES.md`. Dito lang sa repository na ito gagawa (PROJECT_RULES 5b).

- **Stable: v1.21.0** (SemVer, PROJECT_RULES 5f; GO STABLE 2026-10-15). Laman: faceplate ng planta, engine (bumpless, proseso sa tunay na utos), UAT sa loob ng app (scenario + generic tester), malinis na code (analog + DITL), update check ng channel, phone layout (<= 700 px). Ang html ay nasa `dist/logic-sim-v1.21.0.html`. Release assets: html, `Logic-Sim-v1.21.0.apk`, `Logic-Sim-v1.21.0-portable.exe`, `Release-Report-v1.21.0.pdf`. Regression bago ang release: engine isolated 54 sheet / 5128 net PAREHO, faceplate PASS, ABC-007 184/0, block UAT 6808 case / 0 mali. Hindi pa nasusubukan ang apk / exe at ang phone layout sa totoong device. SUSUNOD: #25 sa checklist (iisang mundo ng ABC at DITL). Ang listahan ng natitirang gawain ay nasa `docs/CHECKLIST.md`; ang mga kilalang limitasyon ay nasa `docs/versions/v1.21.0/UPDATE_REPORT.md` (seksyon 1.21.0).
- **Beta: 1.22.0-beta.3** (ABC muna, utos ng user): ang PV ay sumusunod sa tunay na utos sa valve (dati, ang internal output ng PID ang ginagamit, bug sa `plant.js`); ang measurement na hawak ng dalawang sheet (reheat temp: spray ABC-019 + damper ABC-020) ay sumasagot sa dalawa; parallel valves sa iisang PV ay nagdadagdag ng flow. 55/68 loop ay gumagalaw ang PV sa MV; ang 13 ay interlock ng drawing sa cold start o cascade master (nakalista sa `docs/versions/v1.22.0/UPDATE_REPORT.md`). ABC link audit (kada station): walang tag na kinukuwenta sa isang sheet pero manual pa sa iba; ABC-033 "STATION 101" sa drawing pero ang AI0641 TT-AS1001 ay station 102 sa I/O list: tama ang app (station 2).
- Dati: **1.22.0-beta.2** (iisang mundo ABC + DITL, tingnan sa ibaba). Dati: 1.22.0-beta.1 (branch `claude/logic-sim-app-review-tbmfdr`, PR #26, base = Stable v1.21.0): malinis na DITL toolbar (wala na ang ABC toolbar sa DITL page, editor tools nasa "⋯ Tools", "▶ Simulate"), phone layout ng DITL, Health ng DITL bumubukas na. Detalye: `docs/versions/v1.22.0/UPDATE_REPORT.md`. Dati: ang 1.21.0-beta.1 ~ beta.10 ay nasa `docs/versions/v1.21.0/UPDATE_REPORT.md`.
- **DITL rule BINAWI ng user (2026-10-15):** puwede nang galawin ang DITL logic / engine / page para sa ikabubuti ng simulation (PROJECT_RULES 4).
- **Layunin ng user (2026-10-15):** (1) maayos na trace kada click; (2) forcing / scenario ("ano ang mangyayari kapag ganito"); (3) plant simulation ng buong app (iisang mundo ABC + DITL, checklist #25); (4) professional, malinis, user friendly na UI sa desktop, tablet at phone nang hindi bumabagal. Plano ng Beta: beta.1 DITL toolbar (TAPOS) → beta.2 iisang mundo ABC + DITL, unang bahagi (TAPOS, default OFF, button "🌐 ABC + DITL") → trace kada click na tumatawid sa ABC ↔ DITL → force panel (listahan + Release all) → plant scenarios (start-up / trip).
- **Iisang mundo (beta.2):** `src/world/world.js`, test `tests/regress/world.js`.
  - Bilang: 110 FROM DITL, 86 TO DITL, 874 DITL → DITL. Bawat 0.2 s, ~2 ms.
  - Ang net na kinukuwenta ng ABC logic ay hindi ginagalaw (21, nakalista sa report).
  - Ang DITL engine ay `simSheet()` na (iisa para sa drawing at sa mundo). Kapag OFF ang mundo, 134 / 134 DITL sheet ay pareho sa v1.21.0.
  - Susunod sa mundo: user values ng DITL (timer) sa lahat ng sheet kahit hindi pa nabubuksan; panel ng address (bawat address: value, pinagmulan, mga gumagamit); i-default ON kapag nasubukan mo.
- **Branch cleanup (hindi pa nagawa):** 15 lumang branch na 0 commit sa unahan ng main (auto-chk, beta/operator-hmi-v1.20.27, ccr-a82cbeb0-zyf3i8, channel-switch, clean-releases, docs/restore-claude-role, no-uat-release, operator-hmi, restore-html-android, themes, uat-blocks, uat-expected-values, uat-in-app, ui-shell, v1.20.26) at PR #8 (luma). Ang pag-delete ay na-block ng safety check ng session; kailangan ng tahasang "OK delete" ng user.
- **Kasama na ang themes** (dating v1.20.33, branch `themes`): diagram themes Standard / Calm / Clarity / Paper at UI theme Slate; kulay lang (`src/ui/theme/`, `node src/ui/theme/inject.js`). Sinuri: ang html ng themes ay pareho sa v1.20.32 maliban sa THEME block.
- Reference build na hindi ginagalaw: `archive/reference-builds/logic-sim-v1.20.21.html`.

## Saan ang mga bagay
- ABC audit (method, coverage, F-1 ~ F-36): `docs/abc-audit/ABC-AUDIT.md`. Evidence at update reports ayon sa bersyon: `archive/docs-versions/v1.20.21` ... `v1.20.32` (kasama ang `v1.20.27`, `v1.20.28`, `v1.20.29`).
- Sources: `document-references/` (ABC/DITL drawings zip, I/O list, memory lists, F(X), parameter workbook, legends, textbook, flow-compensation, drum-level).
- Tools: `tests/regress/` (headless checks), `src/ui/uat/` (`inject.js` ilalagay ang UAT sa html, `make-report.js` ang report), `src/ui/shell/` (toolbar / tablet drawers), `src/ui/hmi/` (operator faceplate), `tools/version.js` (version galing sa pangalan ng html; isa lang dapat ang `logic-sim-vX.Y.Z.html` sa root).
- Workflows (`.github/workflows/`): `checks.yml` (bawat push), `site.yml` (Pages: Stable = main sa `/`, Beta = pushed branch sa `/beta/`), `release.yml` (manual, input `GO v<version>`, `dry_run`; apk + portable exe + html + report), `clean-releases.yml`. Ang apk signing key `signing/logic-sim.jks` ay self-signed: huwag i-regenerate (reinstall ang kapalit).

## State (v1.20.32)
- 54 ABC sheets tumatakbo sa RUN mode; switches, timers, LAG, ALM, PID, F(X), parameters at AI ranges ay chine-check laban sa drawings at workbooks. Real values ang units (PROJECT_RULES 4a).
- Engine change ng v1.20.32: F-36, PID anti-windup gamit ang PI part (hindi kasama ang derivative).
- In-app UAT: block-by-block bawat sheet (Switches, COS, Gates, Comparators, Timers, Lag, F(X), High/Low select, AI, AO, MAN, Totalizers, PID). Dry run: 1767 blocks, 4924 cases, 0 mismatch. May mga "skipped" na case na may nakasulat na dahilan (`docs/versions/v1.20.32/UPDATE_REPORT.md`). Ang kulay ng linya ay manual na item sa UAT.
- Channel box sa app (kanang itaas) para lumipat Stable / Beta; ang app ay TUMATANONG bago mag-update (I-update ngayon / Huwag muna).
- Mga input na may "( FROM ABC-xxx )" na walang kapares na net ay operator / mode / DITL input by design (FINDINGS v1.20.23).
- Assumptions na walang formula sa references: dMVH kada 1 s, TF first-order filter, CUT low cut, GAP dead zone.

## Dating open item ng AUTO-TEST (v1.20.27) - SARADO / WALANG BASEHAN NA NGAYON (inayos ng v1.20.32 na pagsusuri, 2026-10-14)
- Ang lumang 619-scenario AUTO-TEST (Normal / Kondisyon / Loop, TINGNAN/HINDI TUGMA) ay **wala na** sa html mula v1.20.30; pinalitan ng block-by-block UAT na nagre-reset, nagfo-force at nagpapatay ng plant model bawat case, kaya hindi na ito nakadepende sa estado bago mag-RUN.
- Headless na pagsubok (v1.20.32; ABC-053, 011, 055, 001C, 003A): Run -> Pause -> Reset, tapos 30 s step -> **pareho** ang AI start values, plant model at AO sa fresh load. Hindi na-reproduce ang pagkakaiba. Hindi sinubok: lahat ng 31 sheets, mga ibang kombinasyon ng Plant model ON/OFF, at ang totoong apk/exe/tablet.
- Kung makita ulit ng user ang value na iba pagkatapos ng RUN, i-report ang sheet at ang numero; ire-reproduce sa `tests/regress`.

## Hindi pa nasusuri (nasa user)
- apk, portable exe at tablet/phone: pagsisimula ng app, ang tanong sa update (I-update ngayon / Huwag muna), kulay ng linya (dilaw napili / abo hindi), toolbar at drawers, operator faceplate, UAT panel.
- Ideya na hindi pa ginawa: alarm list, trend para sa AI/AO, button para i-release lahat ng force.

## Maliit na pagkakaiba sa docs (hindi pa naaayos)
- `README.md` walang link sa `docs/versions/`; `tests/regress/README.md` default na html ay v1.20.25 pa (v1.20.32 na ang tama). Ayusin kapag may susunod na docs update.

## OPLAN-L1PAT (user, 2026-10-14): organisasyon ng repo
Tapos ang hakbang 1 (walang pagbabago sa html, byte-identical): `src/` ay hiwalay na stacks; `tools/{shell,hmi,theme,uat}` -> `src/ui/`; `tools/regress` -> `tests/regress`; lumang ulat at reference build -> `archive/`. Mapa ng repo: `README.md`. Hakbang 2 (may pahintulot ng user, kasama ang pagbabago sa workflows): `android-app` -> `delivery/android`, `app` -> `delivery/desktop`, `signing` -> `delivery/signing`, `sw.js` / manifest / icons -> `delivery/pwa`, html -> `dist/`. Ang `site.yml` ay tumatanggap ng luma at bagong layout; ang `release.yml` ay para sa bago lang (hindi pa nasusubukan ang dry run pagkatapos ng paglipat; gawin bago ang susunod na release). Hakbang 3 tapos (v1.20.48): ang reader + engine (`src/analog/reader`, `src/analog/engine`, 9 file) ay DOM-free at tumatakbo mag-isa (`node tests/engine/isolated.js`, `node tools/engine/deps.js`). Susunod: ilipat sa Web Worker (UI = utos at value lang).

## Sources (v1.20.34, Beta)
Ang app ay galing sa `src/` na ngayon (nakahiwalay na ang stacks: boot, styles, digital, analog/{reader,engine,data,ui}; byte-identical pa rin ang html) (Vite dev server, `npm run build`, `npm run check`); basahin ang `src/README.md`. Ang html sa root ay build output (byte for byte, nasa Checks). Ang engine ay tumatakbo rin sa Node (`tools/engine/node-engine.js`). Susunod na hakbang ng paglilipat: ihiwalay ang engine sa drawing (hindi pa ginagawa; ang analog app ay iisang closure) at ilipat sa Worker.

## Rule ng user (2026-10-14, galit): kapag may sheet na nire-report, ang sheet LANG na iyon ang susuriin at aayusin; basahin muna ang PDF at ang text sa drawing (ang text ay reference, hindi design lang); huwag baguhin ang code ng ibang function block; walang malawakang test o ayos nang walang utos.

## Checklist ng lahat ng gagawin: `docs/CHECKLIST.md` (isang listahan, pinakamabilis hanggang pinakamatagal; ang `[F]` ay FUTURE PLAN na hindi pa ipatutupad; ang user ay nagte-test sa bawat natapos)

## Audit per sheet (user 2026-10-15)
Ang user ay gustong isa-isahin ang sheet laban sa PDF (function, process, cause and effect; lalo na AUTO / REMOTE / MANUAL). Tapos: ABC-007 (`docs/versions/v1.20.60`, scenario UAT sa app v1.20.63: `src/ui/uat/scenarios/ABC-007.json`). Rule ng user: walang babasahin sa repo; ang UAT ay nasa app, malinaw at tama ang resulta; sakop ang lahat ng control + proseso. Template ng bawat sheet: force manual / interlock truth table, SV path, MANUAL / SV / AUTO na may proseso, bumpless, REMOTE / LOCAL, mode input, trip at pagbalik. Susunod: ABC-011, 012, 019, 003A-E, 030, 052. Bukas na tanong (kailangan ng approval): F2 = 111 ext input na ang tag text ay nasa kaliwa ng dulo ng wire ay walang pangalan sa app (reader, `pins-params.js` ~137); epekto: pangalan sa panel at posibleng cross-sheet links.

## Depinisyon ng A / M / R, REM / LOC, PV / SV / MV (mula sa repo; huwag nang itanong sa user, user 2026-10-15)
- `document-references/dcs-training-textbook.pdf` (talaan ng status word ng MNO, mga hanay PID / PIDV / RF / ... ): `.MAN` = MANUAL, `.REM` = REMOTE, `.LOC` = LOCAL, `.PVT` = PV-TRACK, `.LCK` = LOCK, `.FLT` = FAULT, `.BUP` = BACK UP. Para sa PID / PIDV, ang REMOTE / LOCAL ay ang pinagmulan ng SV: REMOTE = SV mula sa logic (cascade / demand); LOCAL = SV na itinakda sa faceplate ng operator sa control room. (Sa mga hanay ng equipment tulad ng PGCS / PGCM / ON / OFF, ang REMOTE / LOCAL ay DCS laban sa field.)
- `document-references/hmi-snapshot-sample.zip` (AIRFLUEGAS_HMIDRAFT.PNG): "R-SV 999.9" na katabi ng mga flow loop = ang remote SV; ang maliit na M / R / A sa tabi ng damper at fan = mode ng loop / equipment.
- Faceplate ng planta (larawan ng user): R / A / M. R = REMOTE (SV mula sa logic, AUTO talaga); A = AUTO na may LOCAL SV (itinakda ng operator sa faceplate); M = MANUAL (MV ng operator). SV ay para sa A lang; MV ay para sa M lang.
- Ang .MAN / .LOC / .REM ng drawing ay ESTADO ng mode (1.22.0-beta.3: ang pindot ng M / A / R ay nagse-set at nananatili; dati pulse); ang `.LOC` ay ginagamit din bilang 1:BYPASS ng BUMPLESS ramp at ng SET rule (M.018D).

## Bukas (v1.20.58)
- Web Worker (OPLAN-L1PAT): HINDI KAILANGAN (user 2026-10-15: okay ang bilis sa tablet niya); buksan lang ulit kung may reklamo. Sukat: pinakamabigat na sheet 3.8 ms/step sa desktop (ABC-004A), average 1.2 ms; sukatin muna sa tablet.
- 174 COS: 42 ang hindi 'used' ng engine. 37 ay SV COS ng loop na ang SV pin ay bukas na ext net (nasasakop ng SV sa faceplate). Lahat ng 42 ay nasuri na sa PDF (v1.20.59 report): SV COS = sakop ng SV, setup COS = ext input (ABC-005 gitna ng range; ABC-001A COS#4 = AB0117 'TARGET MW SETUP' = AUTO-MV ext net, may SET rule na). 
- 26 malalim na patong ng live values (ng 2426) - hindi pa inaayos.
- Natitirang PV na 'hindi gumagalaw' ay interlock ng drawing sa cold start (ext input = 0): gamitin ang 'Sanhi?' sa panel.

## Next actions
1. Ang user ay magte-test ng Beta v1.20.34 (`/beta/` page): sariling UAT (👁 sa bawat case), switch / force, Reset. Mga MALI: reproduce sa sheet, ayusin, `node src/ui/uat/inject.js`, push.
2. Bukas (tingnan ang `docs/versions/v1.20.34/UPDATE_REPORT.md`): UAT na hindi pa sakop ang COS, SIG.AB, TXD, IP, FIELD, ilang constants (nakasulat sa panel); ramp rate (8 block na walang rate sa drawing, 1 / s ang default; ABC-052 unit); math block na walang symbol sa theme (Needs Verification); ang tiered stepping at ang naka-embed na html sa apk / exe ay hindi pa nasubukan sa totoong device.
3. BAGO ang anumang engine fix: i-trace ang drawing at isulat sa `docs/versions/<version>/DRAWING_TRACE.md` (v1.20.34: tingnan ang file). Basahin ang `document-references/values-logic-sim-end-user-report.xlsx` at PROJECT_RULES 5c. Katayuan ng 20 findings: `docs/versions/v1.20.34/EXCEL_FINDINGS_STATUS.md`. Susunod: 1, 3, 6, 13 (HINDI PA), live values rules 1 ~ 8 (tamang sukat na: 26 malalim na patong sa 2426; ang "893" ng v1.20.37 ay maling sukat), UI items, Simulation Audit export.
3. Test tools: `tests/regress/switches.js` (lahat ng switch), `tests/regress/reset.js` (Reset = fresh), `tests/regress/pid_am.js` (PID A/M), `tests/regress/tests.js`, `src/ui/uat/dry.js` (2406 items, 6706 cases, 0 bagsak).
4. Beta: bawat ayos ay push agad sa branch (PROJECT_RULES 5e, hindi na kailangan ng GO BETA). Release, merge sa main o workflow run: **GO STABLE** lang, sa mismong mensahe. Ang apk / exe ay may embedded na html mula v1.20.34: i-dry-run ang `release.yml` (`dry_run=true`) bago ang totoong release, kapag pinayagan ng user.

## Notes
- Huwag ipadala ang html sa chat (naputol sa ~160-205 KB; 3.7 MB ang html). Gamitin ang Beta page o release asset.
- Pagkatapos baguhin ang logic: i-edit ang `src/` at `npm run build` (ito na rin ang naglalagay ng UAT, shell, HMI at theme; `npm run check` ang nagpapatunay na tama ang html); `node src/ui/uat/make-report.js` para sa report.
- Ang user ay hindi coder, nagbabasa sa phone/tablet, ayaw ng mahaba/technical na sagot at ng paulit-ulit na test. Maikling Taglish, eksaktong hakbang at eksaktong inaasahang value, tapat sa hindi na-check.
