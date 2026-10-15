# v1.21.0 (target ng susunod na Stable) — mga Beta

**Standard ng version (PROJECT_RULES 5f):** SemVer; ang Stable ay gumagalaw lang sa GO STABLE; ang Beta ay `1.21.0-beta.N`. Ang `v1.20.60` ~ `v1.20.67` na folder ay kasaysayan bago ang standard; lahat ng iyon ay kasama sa `1.21.0-beta.1`.

## 1.21.0-beta.1 (= dating v1.20.60 ~ v1.20.67)
- Audit ng ABC-007 laban sa PDF (RAMP ng FICFA1081 = 0.216 T/s); pangalan ng 126 input (tag sa kaliwa ng wire).
- Faceplate ayon sa DCS ng planta: bar graph (PV, SV, PL~PH marker), kahon ng PV / SV / MV, selector R / A / M, tag bar; click sa SV / MV = control na pang-taas / baba (kapag enabled lang); R / A / M ay nagpa-pulse ng .REM / .LOC / .MAN; SV ay para sa AUTO lang.
- Engine: bumpless AUTO -> MAN at REMOTE -> LOCAL para sa COS leg; ang proseso ay sumasagot sa tunay na utos sa valve (output ng A/M station pagkatapos ng mga kasunod na selector); shared PV.
- UAT sa loob ng app: SCENARIO TEST (operator + proseso) para sa ABC-007 (160 tseke) at awtomatikong tester para sa bawat controller (`tests/scenarios/generic.js`, 68 controller); coverage ng input / output (`tests/scenarios/cone.js`).
- Babala at "Sanhi?" sa panel kapag may interlock na pumuputol sa output.
- Ang resulta ng awtomatikong tester sa 68 controller ay nasa HANDOFF.

## 1.21.0-beta.2 ~ beta.6
- beta.2: tester ng controller ay naghihintay sa trip, at nilalaktawan na may tala kapag ang trip ay depende sa proseso.
- beta.3: paghahanap ng estado ng tester na may pulse ng latch at pares ng input.
- beta.4: lahat ng source ng analog at ui ay naka-format (Prettier), hinati ang `compile-step.js`; napatunayang walang nagbago sa gawi.
- beta.5: multi-file na app folder (`index.html` + `js/*.js`) para sa apk / exe; iisang html pa rin para sa Pages at release.
- beta.6: DITL cleanup (format at hati sa 7 bahagi; utos ng user, istruktura lang, walang binago sa gawi).

## 1.21.0-beta.7 — Update check ayos (hindi nagtutuloy ang update)

- **Problem:** Sa Beta, laging lumalabas "May bagong bersyon: v1.21.0, gamit mo beta.3" kahit i-update; hindi natatapos.
- **As Found:** Ang `site.yml` na tumatakbo sa Pages ay yung nasa `main` (lumang bersyon): pinuputol nito ang `-beta.N` kaya `version.json` ay `v1.21.0` lang. Ang v1.21.0 (Stable) ay mas mataas kaysa beta.N kaya paulit-ulit ang tanong.
- **Work Done:** Kapag Beta at ang nasa `version.json` ay walang `-beta.N`, binabasa na ng app ang title ng mismong Beta page para sa totoong bersyon. Hindi na kailangan ang pagbabago sa `main`.
- **As Left:** Bago ang unang update: pindutin ang "I-update ngayon" nang isang beses (kukunin ang beta.7); pagkatapos nito, "Updated ka na". Hindi pa nasubukan sa tablet; ang live site ay hindi maabot mula dito.
- **Status:** Beta pushed. Ang tamang `site.yml` ay mapupunta sa main sa susunod na GO STABLE.

## 1.21.0-beta.8 — Channel (Stable/Beta) sa apk / exe

- **Problem:** Sa apk/exe (v1.20.59) walang "Channel: Stable/Beta" na option.
- **As Found:** Ang selector ay lumalabas lang kapag ang address ay `*.github.io` (browser). Ang apk/exe ay bukas sa `file:` / `localhost`, kaya wala.
- **Work Done:** Lumalabas na ang selector sa apk/exe. Ang Beta ay bubukas sa Beta page ng site at maaalala (kailangan ng internet).
- **As Left:** Nasubukan na lumalabas ang selector (file:, 2 option). Hindi pa nasubukan ang paglipat mismo sa tablet. Ang apk na nakainstall (v1.20.59) ay walang ganito hanggang sa susunod na Stable build.
- **Status:** Beta pushed.

## 1.21.0-beta.9 — #4 coverage, #5 generic tester (analog), #6 ABC-007 BU-CMD (bahagi)

- **#4:** `tests/scenarios/structure.js` (kinikilala na ang FOUT bilang output): 51 sheet, 731 input, 567 output; hindi nakakabit 1 (ABC-001A COS target, sakop ng SET rule), dead end 2 (ABC-054 n12 / ABC-055 n49: valve feedback na VLV lang ang kumakain, walang output). ABC-001C n2/n9/n11 ay umaabot sa O.0178 / O.0179 (FOUT papuntang DITL): hindi sira. Ang simulation cone (`cone.js`) ay hindi natapos sa lahat ng sheet (1 sa 4 na bahagi ay walang resulta); ang "patay" nito ay karamihan gated ng interlock o COS: Needs Verification.
- **#5:** Ang generic tester ay may huling pagsubok na analog (10/30/70/90 % ng range ng mga analog input sa cone). Resulta: ang apat ay HINDI pa rin nasubok ng generic (PICFG108 M.0205, PICAS1005 M.012A + putol M.0129, AICFG112 M.0103, HS-COAL M.2020) kasama ang TICHR1002 (M.0170 = OR(NOT M.0172 ...); M.0172 = HC > 11 °C ng SI0110 − SI0112, kondisyon ng PROSESO, hindi ng switch). Ang mga ito ay nangangailangan ng hand-written na scenario mula sa drawing (kailangang ilagay ang proseso sa tamang estado). Hindi nasubok ngayon: Needs Verification. FICFW1007 (cascade slave): hindi ginalaw.
- **#6:** ABC-007 B1 (BU-CMD: MFT pulse + damper > 50 % → MV 50 %) at B2 (damper < 50 % → walang BU-CMD). Ang M.0181 = AND(M.253F, M.0182). Pagkatapos ng pulse, nananatili ang MV sa 50 (tracking ng A/M station): Needs Verification. Hindi pa: FAULT hold (M.018B/M.019B), alarm M.3130/M.3131, SIG.AB.

## 1.21.0-beta.10 — Phone layout (≤ 700 px)

- **Problem:** Sa cp, 60 % ng screen ay toolbar; naputol ang kanang bahagi; ang UAT ay nakaharang; maliliit ang tap target.
- **As Found:** Walang phone layout; ang toolbar ay stacked na 4 na hanay.
- **Work Done:** Sa lapad ≤ 700 px: isang hanay ng toolbar (☰, Run, Fit, Panel, sheet ◀ ▶); ang ☰ ay naglalabas ng lahat ng iba; ang Panel ay bottom sheet; mas malaking tap target (40 px); ang UAT button ay nasa gilid at lumalabas lang kapag bukas ang ☰. CSS at shell lang; hindi ginalaw ang engine at logic. Ang tablet at desktop ay hindi nagbago.
- **As Left:** Nasubok sa emulation (390×780, touch): walang horizontal scroll, walang page error, ang faceplate ay mababasa at gumagana ang R/A/M. Hindi pa nasubok sa totoong cp; ang diagram na pahalang ay maliit pa rin sa portrait (gumamit ng pinch-zoom).
- **Status:** Beta pushed.

## 1.21.0 — STABLE (GO STABLE ng user, 2026-10-15)

- **Problem:** Kailangang mailabas ang lahat ng ayos mula v1.20.59: bagong faceplate, mas tamang engine, UAT at tester, malinis na code, update check, at phone layout.
- **As Found:** Stable v1.20.59.
- **Work Done:** Lahat ng 1.21.0-beta.1 ~ beta.10 (tingnan sa itaas), at bago ang release:
  - **Iisang mundo ng mga address (links):** ang `.MAN` ay idinagdag sa tag ng links; ang tag index ay binubuo nang buo bago kalkulahin ang links (dati, ang sheet na nauuna sa listahan ay hindi nakikita ang tag ng sheet na nasa dulo). Resulta: 33 na cross-sheet link na dati ay putol ay nakakabit na (hal. M.3410/3411/3416/3417 ABC-004A -> 003A~D at 029; B.0759/B.0761 ABC-003A -> 003B~D; B.071C/0721/0729/0734/074C ABC-006 -> 007; FICFA1071.REM / FICFA1081.REM ABC-007 -> 002, 003E, 004A); walang nawala.
  - **HMI command sa lahat ng sheet:** ang R / A / M ng faceplate ay pumipindot ng `.REM` / `.LOC` / `.MAN` ng tag sa LAHAT ng sheet (hal. FIC-CM.REM sa ABC-001C, FICDO1043A.LOC sa ABC-003E). May MAN button na ang mga manual station (FICCL1061A/B/C, SICL1060A~D, HICHR1002A/B).
  - **Tester ng controller:** ang kondisyon ay kinukuha mula sa logic (transmitter AI, sabay na analog, MV na itinaas muna, pares ng switch). TICHR1002 42/42 (M.0172 = temperatura > saturation + 11 °C). PICAS1005 31/32.
  - **ABC-007:** B1/B2 BU-CMD (M.0181 = M.253F AND M.0182), B3 alarm M.3130 (< 220 T/H) at M.3131 (< 200 T/H, TON 5 s) 9/9, B4 FAULT hold (M.018B = TPS 2 s ng M.025B) 4/4. Ang SIG.AB B.0660 ay walang kumakain sa ABC-007 (tseke ng netlist).
  - **Paalala sa bawat mensahe** (`.claude/settings.json` hook) at permanenteng kaalaman sa `CLAUDE.md`.
- **As Left:** Stable 1.21.0. Mga nasuri: `npm run check`; regression pagkatapos ng link fix: engine na nag-iisa vs buong simulator 54 sheet / 5128 net PAREHO, Reset PASS; faceplate 68 controller PASS; ABC-007 scenario 184 tama / 0 mali; block UAT 2458 item / 6808 case / 0 mali; ACT:R / ACT:N 68/68 tugma sa drawing; phone layout sa emulation.
- **Mga kilalang bug na hindi pa naayos:** (1) Ang ABC at ang DITL ay dalawang hiwalay na engine pa: 103 na address sa ABC ay galing sa DITL o sa field at manual na switch pa (hal. M.3302, I.000F); ang susunod na trabaho ay ang global address registry (station + address = isang halaga) at ang DITL engine na kasabay ng ABC. (2) PICAS1005: hindi gumagalaw ang PV kapag binago ang MV (process model). (3) Ang tester ay hindi pa nakakarating sa estado ng PICFG108 (kailangan MV >= 14 %), AICFG112 (air / fuel cross limit) at HS-COAL (lahat ng feeder at mill tumatakbo) kahit alam na ang kondisyon mula sa drawing. (4) FICFW1007 (cascade slave) 38/42. (5) Hindi pa nasubok sa totoong device ang apk / exe at ang phone layout.
- **Status:** Stable 1.21.0.
