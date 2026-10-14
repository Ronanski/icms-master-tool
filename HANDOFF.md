# Current Project Handoff

> Single current handoff. Palitan ang lumang status kapag nagbago ang trabaho; huwag mag-append ng chat transcript.

## Project
DCS Logic Simulator sa `Ronanski/icms-master-tool`. Basahin muna ang `CLAUDE.md` at `PROJECT_RULES.md`. Dito lang sa repository na ito gagawa (PROJECT_RULES 5b).

- **Stable: v1.20.32** (release tag `v1.20.32`, `main`). Sa root ng branch na ito: `logic-sim-v1.20.34.html` (isa lang); sa `main`: `logic-sim-v1.20.32.html`. Release assets: html, `Logic-Sim-v1.20.32.apk`, `Logic-Sim-v1.20.32-portable.exe`, `Release-Report-v1.20.32.pdf`. Walang UAT file sa release; ang UAT ay nasa loob ng app (berdeng UAT button).
- **Beta: v1.20.34** (branch `claude/blissful-mendel-xtceew`, PR #21; base = Stable v1.20.32): switch restore pagkatapos ng FORCE (engine), Reset = fresh start (engine), 👁 own-check sa UAT, naka-embed na html sa apk/exe (offline). Detalye at ebidensya: `docs/versions/v1.20.34/UPDATE_REPORT.md`. Hindi pa nasusubukan ang apk / exe (hindi na-build). Hintay sa GO STABLE.
- **Hiwalay na Beta: v1.20.33** (branch `themes`): diagram themes at UI theme Slate, kulay lang. Hindi kasama sa v1.20.34; kailangan ng utos ng user (at pagsasama ng html) bago pagsamahin.
- Reference build na hindi ginagalaw: `document-references/logic-sim-v1.20.21.html`.

## Saan ang mga bagay
- ABC audit (method, coverage, F-1 ~ F-36): `docs/abc-audit/ABC-AUDIT.md`. Evidence at update reports ayon sa bersyon: `docs/versions/v1.20.21` ... `v1.20.32` (kasama ang `v1.20.27`, `v1.20.28`, `v1.20.29`).
- Sources: `document-references/` (ABC/DITL drawings zip, I/O list, memory lists, F(X), parameter workbook, legends, textbook, flow-compensation, drum-level).
- Tools: `tools/regress/` (headless checks), `tools/uat/` (`inject.js` ilalagay ang UAT sa html, `make-report.js` ang report), `tools/shell/` (toolbar / tablet drawers), `tools/hmi/` (operator faceplate), `tools/version.js` (version galing sa pangalan ng html; isa lang dapat ang `logic-sim-vX.Y.Z.html` sa root).
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
- Kung makita ulit ng user ang value na iba pagkatapos ng RUN, i-report ang sheet at ang numero; ire-reproduce sa `tools/regress`.

## Hindi pa nasusuri (nasa user)
- apk, portable exe at tablet/phone: pagsisimula ng app, ang tanong sa update (I-update ngayon / Huwag muna), kulay ng linya (dilaw napili / abo hindi), toolbar at drawers, operator faceplate, UAT panel.
- Ideya na hindi pa ginawa: alarm list, trend para sa AI/AO, button para i-release lahat ng force.

## Maliit na pagkakaiba sa docs (hindi pa naaayos)
- `README.md` walang link sa `docs/versions/`; `tools/regress/README.md` default na html ay v1.20.25 pa (v1.20.32 na ang tama). Ayusin kapag may susunod na docs update.
- Branch cleanup (kailangan ng desisyon ng user): 13 branches ay 0 commits sa unahan ng main (auto-chk, ui-shell, operator-hmi, uat-blocks, uat-in-app, uat-expected-values, channel-switch, no-uat-release, clean-releases, restore-html-android, beta/operator-hmi-v1.20.27, v1.20.26, ccr-a82cbeb0-zyf3i8). PR #8 (`claude/adoring-carson-aylw3j`, v1.20.22) ay luma na at superseded ng main.

## Next actions
1. Ang user ay magte-test ng Beta v1.20.34 (`/beta/` page): sariling UAT (👁 sa bawat case), switch / force, Reset. Mga MALI: reproduce sa sheet, ayusin, `node tools/uat/inject.js`, push.
2. Bukas (tingnan ang `docs/versions/v1.20.34/UPDATE_REPORT.md`): 3 sheet na iba pa rin ang Reset sa fresh (010, 013, 001C), doble-doble na live values, math block na walang symbol (hindi pa matukoy), ramp rate (8 block na walang rate sa drawing; ABC-052 unit), PV/SV/MV AUTO/MAN laban sa HMI snapshots (`document-references/hmi-snapshot-sample.zip`), bigat sa tablet (step lang ng konektadong sheet: kailangan ng approval).
3. Test tools: `tools/regress/switches.js` (lahat ng switch), `tools/regress/reset.js` (Reset = fresh), `tools/regress/tests.js`, `tools/uat/dry.js`.
4. Release, merge sa main o workflow run: **GO STABLE** / **GO BETA** lang, sa mismong mensahe. Ang apk / exe ay may embedded na html mula v1.20.34: i-dry-run ang `release.yml` (`dry_run=true`) bago ang totoong release, kapag pinayagan ng user.

## Notes
- Huwag ipadala ang html sa chat (naputol sa ~160-205 KB; 3.7 MB ang html). Gamitin ang Beta page o release asset.
- Pagkatapos baguhin ang logic: `node tools/uat/inject.js` para sumunod ang UAT expected values; `node tools/uat/make-report.js` para sa report.
- Ang user ay hindi coder, nagbabasa sa phone/tablet, ayaw ng mahaba/technical na sagot at ng paulit-ulit na test. Maikling Taglish, eksaktong hakbang at eksaktong inaasahang value, tapat sa hindi na-check.
