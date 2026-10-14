# v1.20.34 (Beta, branch `claude/blissful-mendel-xtceew`; base = Stable v1.20.32 + themes v1.20.33)

- **Problem:** Mga finding ng user sa Beta v1.20.33: (1) may switch na hindi bumabalik sa dati pagkatapos ng FORCE ON/OFF sa RUN; (2) kailangan ng internet para buksan ang app; (3) mabagal ang unang load; (4) UAT na pasado pero hindi nahuli ang mga ito; (5) gusto ng user ng sarili niyang UAT na siya ang humahatol.
- **As Found:**
  - Switch test (bagong `tools/regress/switches.js`, lahat ng 387 SW/AMT, 438 control cases: force ON, release, force OFF, release, ikumpara sa takbo na walang force): **14 ang hindi bumalik** sa v1.20.32. ABC-013 #2, 017 #1, 020 #40 at #45 (latch), 029 #1, 033 #1, 050 #2 at #6, 051 #2, 052 #4, #23, #52, 054 #3, 055 #5. Lahat ay A/M station (AMT) na may dalawang control o latch: ang lumang code ay may "restore" lang kapag ang force ay 1, kaya ang force 0 at ang latch ay nanatili sa maling leg.
  - Reset (bagong `tools/regress/reset.js`: force, flip at RUN sa lahat ng sheet, tapos Reset, ikumpara sa fresh load): **6 sheet** ang iba sa fresh load (ABC-004A, 010, 011, 012, 013, 051, 001C): hindi ginagawa ng Reset ang "settle" na ginagawa ng fresh load.
  - Ramp / rate-limit blocks (43): 8 ay walang nakasulat na rate sa drawing (ABC-004A/B/C ang pangalawang block, 009A x3, 009B, 020; sinuri ang PDF ng 009A). Ang ginagamit ay 1 unit / s (desisyon ng user 2026-10-10). ABC-052 "Ramp X% / sec": ang rate ay galing sa signal (F(X) SI0225); hindi pa nabe-verify kung ang unit ay % ng span bawat sec.
  - Offline: ang apk at exe ay nagloload ng site (sw.js ang nagka-cache); walang naka-embed na kopya.
  - Bilis: sa headless Chromium, 60 fps sa LAHAT ng sheet sa RUN (v1.20.32 at v1.20.33 pareho). Ang engine tick ay 3 ~ 7 ms kasi bawat tick ay nag-i-step ng ~36 na sheet (linked sheets) para sa isang nakikitang sheet. Hindi na-reproduce ang bigat; sa tablet ay mas mabagal ang CPU.
- **Work Done:**
  - Engine (switch): kapag ang FORCE sa alinmang control ng switch ay na-release na (lahat), bumabalik ang leg at ang latch bago ang unang force. Plain T switch ay walang memory (sumusunod sa select), hindi ginalaw.
  - Engine (Reset): pagkatapos i-initialize ang lahat ng sheet, sini-settle silang lahat (6 step) tulad ng fresh load.
  - UAT: bawat test case ay may 👁 na button: sine-setup ang sheet (paused, plant model off) sa kondisyon ng case, ipinapakita ang block at ang dapat na value, at ang USER ang humahatol (✔ Tama / ✖ Mali sa drawing). Hiwalay ito sa awtomatikong UAT (expected + PASS/FAIL), at nakalista nang hiwalay sa "Copy report" ("Your own checks").
  - Offline: ang apk at exe ay may naka-embed na kopya ng html (bukas agad, walang internet). Ang page ay nagche-check ng `version.json` ng site; kung may bago, tinatanong ang user (I-update ngayon / Huwag muna); kapag pumayag, bubuksan ang site (naka-save ang choice at online lang ito gagamitin). Binago: `app/main.js`, `app/package.json`, `.github/workflows/release.yml`, at ang update script sa html.
- **As Left:**
  - `switches.js`: 438 cases, **0** ang hindi bumabalik (dati 14).
  - `reset.js`: 3 sheet pa ang iba sa fresh load (ABC-010, 013, 001C): ang pagkakaiba ay sa mga input na galing sa kabilang sheet (cross-sheet link) at sa PID start ng ABC-013; hindi pa nahahanap ang dahilan (Needs Verification).
  - `tests.js` T1 ~ T5, S1 ~ S6: lahat PASS. UAT dry run (1767 blocks, 4924 cases): 0 failing.
  - Headless na pagsubok ng embedded mode: offline (walang error, walang dialog), may bagong bersyon (lumalabas ang tanong), pagkatapos pumayag (bubukas ang site), at kapag naka-save ang choice (diretso sa site). 
- **Status:** Beta (pushed branch). Hindi pa Stable.

## Dagdag (pangalawang bahagi ng v1.20.34): ang UAT ay hindi pala sumasaklaw sa lahat
- **Tapat na sukat ng lumang UAT (v1.20.32):** 1767 items ang "pasado" sa mahigit 3,800 na blocks. Walang test ang math blocks (SUM, SUB, ADD, MUL, DIV, DEV, SQRT, ABS), ang ramp / rate blocks (43), ang flip-flops (47), ang average selects (30) at ang constants; at ang report ay binibilang ang skipped bilang pass.
- **Idinagdag na tests (expected galing sa kahulugan ng block o sa text ng drawing, hindi sa engine):** math (add / subtract / sum / deviation; multiply / divide / square root / abs), constants, flip-flops S / R, average select, CMPK, at ramps: ang rate ay binabasa mula sa text ng drawing ("RAMP:1% / sec", "(1T / Sec)", "2 kg/cm2 / min", "18% / Hr" ...) at ikinukumpara sa aktwal na taas ng output sa takdang oras. Ang mga ramp na walang nakasulat na rate, o ang rate ay galing sa signal, ay "NOT TESTED" na may dahilan.
- **Resulta:** 2235 items, 6055 cases, 0 bagsak (dry run, 165 s). Sa unang takbo ay 37 ang bagsak: lahat ay mali sa setup ng test (ang ramp ay nagsisimula sa 0, may mga constant na hindi dapat i-force, ang mga net na papunta sa AO ay naka-clamp 0 ~ 100, ang constants na "%" ay ginagawang real value ayon sa PROJECT_RULES 4a); inayos ang test, hindi ang engine. Ang rate ng mga ramp na may text ay tumugma sa drawing.
- **Hindi pa sakop ng UAT** (nakasulat din sa panel at sa report): AO, valves / actuators (ACT, VLV, IP), alarms (ALM), COS, SIG.AB, TXD, FIELD, ilang constants at comparators. Ang 103 na cases ay skipped (may dahilan).
- **Ang Copy report** ay hiwalay na ngayong nagbibilang ng pass, NOT TESTED at fail.
- **PV / SV / MV AUTO / MAN** (`tools/regress/pid_am.js`): MAN na may manual value habang ang PV ay 20 % sa itaas ng SV, tapos AUTO: 32 sa 32 PID ang tama (hawak ang manual value, sumusunod ang controller, walang talon). 13 PID ang hindi nasubukan dahil ang interlock back-up (BU-CMD) ay active by default at ang controller ay sumusunod doon ayon sa drawing (ABC-003A/B/C/D, 010, 011, 012, 019, 030, 032, 051, 052, 002). Ang HMI snapshots ay mga plant graphics (operating values), hindi faceplate: hindi nagagamit na basehan ng A/M.
- **Doble-doble na live values (UI lang):** ang AO ay hindi na naglalagay ng ikalawang number sa block kung may address value na ng parehong net (halimbawa AO0352 0.00 at 0.00%), at kapag parehong may address value ang input at output ng AO, isa lang ang ipinapakita (halimbawa MCV-FA1054-1 0.00). Ang actuator (damper) % ay nananatili. Nasubukan sa headless sa ABC-007; hindi pa sa ibang sheet.
- **Bumabagal (paliwanag, hindi pa ginagawa):** bawat 0.1 s, kinukwenta ng app ang ~36 na sheet kahit isa lang ang tinitingnan, dahil may mga signal na dumadaan sa pagitan ng mga sheet. Ang ayos: kuwentahin lang ang mga sheet na nagpapadala ng signal sa tinitingnang sheet (at ang sa kanila). Ang mga sheet na hindi konektado ay hihinto habang hindi tinitingnan (pareho na ito ngayon sa mga hindi konektado). Dapat ma-verify na pareho ang mga value; kailangan ng approval ng user.
- **Themes (v1.20.33):** kasama na (merge ng branch `themes`; ang html nila ay THEME block lang kaya inilagay ito ng `tools/theme/inject.js` sa v1.20.34).

## Hindi pa nasusuri / bukas
- apk at exe ay HINDI pa na-build at HINDI nasubukan (walang Android / Windows build dito). Ang workflow ay may `dry_run` para sa build lang.
- Ang embedded na kopya ay hiwalay ang storage sa site: ang saved settings ng user sa site ay hindi nakikita sa embedded (at kabaligtaran).
- Bumabagal sa tablet: panukala, kailangan ng approval: i-step lang ang mga sheet na talagang konektado sa nakikitang sheet at i-throttle ang paint. Engine change, hindi pa ginawa.
- "Math blocks na walang symbol": ang ADD, SUB, MUL, SUM at DEV na tiningnan (ABC-001D) ay may symbol; hindi ko pa matukoy kung alin ang tinutukoy.
- Ramp rate: 8 blocks na walang rate sa drawing (1 / s ang default) at ABC-052 (unit ng X% / sec).
- PV/SV/MV: ang 13 PID na may interlock back-up active by default ay hindi pa nasubukan sa MAN / AUTO.
