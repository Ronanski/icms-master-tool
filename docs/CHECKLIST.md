# Checklist: TAPOS / GAGAWIN / LALAKTAWAN / SA HINAHARAP (user, 2026-10-16)

Ito ang iisang listahan ng progress. Ina-update ito pagkatapos ng bawat Beta. Ang detalye ng bawat Beta ay nasa `docs/versions/<ver>/UPDATE_REPORT.md`.

Ang mga milestone hanggang matapos ang project (M0 ~ M6, may "pasado kung") ay nasa `docs/ROADMAP.md`.

Utos ng user (2026-10-16): **"Analog muna. Ang DITL ay i-simulate / i-force na lang."** Ang DITL signal na binabasa ng ABC ay puwedeng i-force sa ABC: ang input na "FROM DITL" ay manual input kapag OFF ang ABC + DITL, at FORCE kapag ON. Hindi na gagastos ng oras sa pagbasa ng bawat DITL row.

## A. GAGAWIN NGAYON (ABC / analog), sunod-sunod
1. [x] **(2.2.0-beta.7: 0 / 438; luma ang test, sinusunod na ang force manual rule) Switches test: 40 sa 438 kaso** ng ABC switch / AMT ay hindi bumabalik sa dating leg pagkatapos ng force at release (`tests/regress/switches.js`). Bug ng ABC, mayroon na bago pa ang 2.2.0-beta.6.
2. [x] **(2.2.0-beta.7: 27 → 11, bawat isa may paliwanag; `docs/versions/v2.2.0/UPDATE_REPORT.md`) Hindi tugma ng ABC sa 150 MW snapshot**: 33 tag sa 2.1.0-beta.11 (`docs/versions/v2.1.0/PLANT_LIVE_VS_SNAPSHOT.md`). Ang 2.2.0-beta.1 ay nag-ayos ng coal at oil (hal. FIQDO1043A ~ D: 3.5 → 0). Bibilangin muli at aayusin ang natitira.
3. [x] **(2.2.0-beta.9 unit model; 2.2.0-beta.11: temperatura SH / RH, reheat pressure at O2 ayon sa load, UNIT screen; M2 pass criterion pasado sa `unit_load.js`, hatol ng user ang natitira) Boiler / turbine physics (analog plant model)**: fuel → init → steam → pressure → MW. Ngayon, kapag nag-load down, ang demand lang ang sumusunod (MW demand, boiler master, coal, air), hindi ang main steam flow, pressure at aktwal na MW. Batayan: start-up / shutdown procedure (PR-OPE-5002 / 5003 / 5004) at HMI snapshots.
4. [x] **(2.5.0-beta.6: `tests/regress/interlock.js`: 57 A/M station na may force manual sa drawing, lahat pumapasok sa MANUAL at tumatanggi sa A habang naka-trip, 0 mali; 16 station ay walang force manual sa drawing (operator lang ang A / M); TICHR1012 = pulse ng pagsara ng LP bypass. Detalye: `docs/versions/v2.5.0/UPDATE_REPORT.md`) (2.2.0-beta.12: trip scenario ng bawat cluster na may trip sa `tests/regress/unit_trip.js`: (a) PAF / SA, (c) turbine trip + MFT, (d) BFWP + drum level LL / HH, (g) bypass sa turbine trip, 008 IDF; ang truth table / SV path / mode ng bawat cluster ay nasa generic tester na) Scenario ng mga loop ng operator, per cluster ng ABC sheet**: force manual / interlock truth table, SV path, AUTO / MAN / REMOTE, trip at pagbalik. Mga cluster:
   - (a) 003A ~ E + 007 + 006 (burner oil at hangin) — TAPOS ang 007;
   - (b) 004A ~ C + 005 + 002 (coal feeder, limestone);
   - (c) 001A ~ D + 002 + 013 + 001C (load, main steam pressure);
   - (d) 010 (drum level);
   - (e) 011 + 012 (SH temp);
   - (f) 019 + 020 (RH temp);
   - (g) 050 + 051 + 052 (bypass);
   - (h) 009A + 009B;
   - (i) 015 + 016 + 057;
   - (j) 026 ~ 030, 033, 053 ~ 056;
   - (k) 031, 032, 034 ~ 039 (condenser, heater drain).
5. [x] **Audit ng bawat ABC sheet laban sa PDF** (function, cause-and-effect, AUTO / REMOTE / MANUAL), kasabay ng #4. **2.3.0-beta.1 (2026-10-19): na-audit ang 50 sheet + page linking ng DITL; 28 sheet walang mali, 30 mali sa 22 sheet, 4 uri ng maling link, 4 hindi mabasa (`docs/versions/v2.5.0/DRAWING_AUDIT.md`). User: "Ayusin lahat". beta.1: mga link (grupo A, LINK-1 ~ 4); beta.2: behavior (grupo B); beta.3: datos (grupo C). 2.5.0-beta.5: DITL-21C row 19 / 20 = B.0646 / B.066E ng ABC-009A (station wiring M.311A / B, `UNLINK_AUDIT.md`). TAPOS.**
6. [x] **(2.2.0-beta.23: search nagsisimula sa planta naka-AUTO + budget 400 estado, ABC-004A 116 / 116 sa 17 min; 2.2.0-beta.8: generic tester 68 controller, 0 mali, 0 hindi nasubok; ang mahihirap ay sinubok sa planta na tumatakbo; RH spray + damper nagdadagdag) Controller na mahirap simulan**: PICFG108, AICFG112, HS-COAL, FICFW1007, PICAS1005.
7. [x] **(2.2.0-beta.24: UAT block test 2547 item / 6998 case, 0 mali pagkatapos ng huling ayos; sakop 2517 / 3573 block; bagong SQRT (identity, V-18), I/P, T/P, HLLIM, PV < SV, conditional write, drop rate, DCMP, TPV) Tester ng halaga ng bawat block** (oracle ng AND, OR, ADD, SQRT, F(X), LAG, RATE, SEL…) sa bawat net ng 54 ABC sheet.
8. [x] **(2.2.0-beta.24: latched select at operator-only A/M; 214 / 225 A/M at 155 / 159 T switch may test; 7 switch na output = isang leg ay susuriin sa PDF) Tester ng switching** (SW, AMT, T switch, selector) sa bawat leg; kasama ang #1.
9. [x] **(2.2.0-beta.23: kahon na CONTROLLER TEST sa UAT panel, isang pindot bawat controller o lahat; 2.2.0-beta.13 ~ beta.20: ang mga PLANT scenario ng M2 / M3 / M4-1 ~ M4-5 at ang buong cold start-up ay nasa app na: button CHECK, isang pindot kada scenario, ✓ / ✗; ang generic controller tester ay sa computer pa) Controller tester sa UAT panel ng app** (isang pindot kada controller). Ngayon, sa computer lang ito tumatakbo.
10. [x] **(2.2.0-beta.24: 173 COS, 0 na walang pangalan; ang 22 na "T23" ay pinangalanan ayon sa controller ng loop) Pangalan ng 7 COS / 42 COS na hindi "used"** sa panel. Nasuri na sa PDF.
11. [x] **(2.2.0-beta.19: 0 nagkakapatong na text sa 28 PLANT screen, headless detector; header at ducts gaya ng HMI) 26 na live value na nagkakapatong** sa drawing (UI lang).

## B. LALAKTAWAN NGAYON (utos ng user 2026-10-16: DITL ay i-force / i-simulate na lang)
- [-] **344 DITL field input na walang sariling rule** sa Start at 150 MW: 212 analog, 89 AUTO / MANUAL, 36 MOV limit / torque, 7 iba pa. Hindi binabasa ng ABC ang mga ito. Kung kailangan sa isang test, i-force.
- [-] **Pagsubok ng DITL logic sa lahat ng kombinasyon ng input.**
- [-] **Pagbasa ng PLC logic** (sand, sootblower, bottom ash HD600, limestone; nasa `document-references/`). Babalikan kapag ang DITL na ang trabaho.
- [-] **Pangalan ng ~600 na input na walang tag** (DITL side).

## C. HINIHINTAY SA USER
- [x] **DITL right side pane** na tulad ng sa ABC (2.4.1-beta.6 ~ beta.10: DITL may panel at tab na gaya ng ABC).
- [x] **(2.5.0-beta.7: AYOS. Walang pulse sa simula ng "Start at 150 MW" (steady state); ang mode ng MAN station ay hindi na pinapalitan (iyon ang nagpabago sa boiler master sa unang subok). M2 ~ M5 at bawat hakbang ng M4 pasado; M4 buo, tingnan ang UPDATE_REPORT) (2.5.0-beta.6, nakita) RH / SH gas bias damper MANUAL sa "Start at 150 MW"** (HICHR1002A / B; 39.PNG: parehong A, TICHR1002A R). Sanhi: sa unang scan pagkatapos ng Reset, ang pulse ng ABC-020 (TPS ng NOT HICHR1002B.MAN) ay nag-set ng M.017A (1:B = MANUAL), at sa M.0179 pati ang RH. Sinubok ang ayos (walang pulse sa steady load + mode ng MAN station mula sa snapshot): tama ang damper pero bumaba ang M4 / M5 (load down 10 / 14, bottle-up 12 / 15, 45 → 150 MW 11 / 14) dahil ang mga scenario ay naka-tune sa damper na MANUAL. Ibinalik; kailangan ng pag-tune ng scenario kasabay ng ayos.
- [x] **(2.5.0-beta.8) Page link sa DITL** (user: "di mapindot"): FROM / TO reference ng row ay nagbubukas ng kabilang dulo (DITL row o ABC sheet), View at Run, ◀ Back. `tests/regress/ditl_pagelink.js`. Kasabay: PID sa AUTO na plant model OFF (`tests/regress/pid_auto.js`).
- [x] **(2.5.0-beta.9) DITL = VIEW / SIMULATE + bawat logic block ng ABC**: DITL bar walang step / speed; `blocks_io.js` 1,666 block 0 mali (plant OFF at ON); `ditl_sim.js` ABC+DITL OFF / ON × plant OFF / ON PASS.
- [x] **(2.5.0-beta.11) Bawat DITL sheet laban sa PDF** (user: "KAPAREHA DAPAT NG SA APP"): 39 sheet na may mali, naayos (`docs/versions/v2.5.0/DITL_PDF_AUDIT.md`); sheet list ng DITL ayon sa kategorya. `tests/regress/ditl_pdf.js`.
- [x] **(2.5.0-beta.10) FORCE ABC ↔ DITL habang SIMULATE**: iisang oras ang ABC at DITL (`ditl_sim.js` PASS).
- [ ] **(2.5.0-beta.11) DITL laban sa PDF**: 39 sheet na may mali (comparator, LOCAL STOP N.C., FF set priority, wire junction, off-sheet connector, row na DEFAULT 1, maling TO). Sheet list ng DITL ayon sa kategorya.
- [ ] **Bagong DITL page**: sootblower, bottom ash, sand, limestone (user 2026-10-20).
- [ ] **Pagsubok sa totoong tablet / apk / exe** ng 2.2.0-beta.1 ~ beta.6.
- [x] **GO STABLE** ng 2.2.0 (2026-10-18: Stable v2.2.0).
- [ ] **Branch cleanup**: 15 lumang branch (0 commit sa unahan ng `main`). Na-block ang pag-delete sa session; i-delete sa GitHub (Branches page) o sabihin ang "OK delete" para subukan ulit.

## D. SA HINAHARAP (hindi pa gagawin; hintayin ang utos)
- [F] **Rehearsal ng start-up at shutdown**: hakbang-hakbang, may marka, ayon sa PR-OPE-5002 / 5003 / 5004. Start-up: TAPOS (2.2.0-beta.20, CHECK "M4 · Cold start-up (buo)"); shutdown normal: TAPOS (2.2.0-beta.21, CHECK "M5 · Normal shutdown (buo)" 13 / 13, OPERATOR_GUIDE seksyon 7); bottle-up: TAPOS (2.2.0-beta.22, CHECK "M5 · Shutdown to bottle-up (buo)" 15 / 15, OPERATOR_GUIDE seksyon 8). Susunod: OPERATOR GUIDE para sa mano-manong operasyon.
- [F] **"Bakit?" at "Sanhi?" na buo**: piliin ang valve o controller, sasabihin kung bakit hindi bumukas o bakit ganito ang demand, hanggang sa pinagmulang input.
- [F] **Checklist ng permissive**: ano ang kailangan para makapag-AUTO, makapag-start o makapagbukas (✔ / ✖).
- [F] **Cause-and-effect matrix**, i-export sa Excel.
- [F] **Audit ng drawing laban sa I/O list at memory list** (address, paglalarawan).
- [F] **Tuning lab**: P / I / D sa plant model; ang parameter ay mula sa summary sa repo.
- [F] **"Compare" ng dalawang bersyon ng sheet.**
- [F] **UI / UX para sa tablet**: mas malaking button, iisang ibabang bar, buong-screen na faceplate at trend.
- [F] **Plant model ng piping**: drain, vent, manual isolation valve at piping network; ang PV ay susunod sa koneksyon ng tubo at valve (user, 2026-10-19: "sa future ay ayusin natin ito").
- [F] **Linis ng code**: `plant-window.js`, `links-canvas.js` (format at paghati lang).
- [F] **DITL bilang buong plant state**: ang 344 na rule sa seksyon B, ang PLC logic, at ang DITL scenario.
- Hindi inirerekomenda: overhaul ng buong app.

## E. TAPOS (buod; detalye sa `docs/versions/`)
- **v2.2.0 Beta (branch `claude/logic-sim-app-review-tbmfdr`, PR #30)**:
  - beta.1: coal feeders, HS-COAL, oil flow = 0 kapag sarado.
  - beta.2: load down sa HIC-ULD faceplate.
  - beta.3: DITL sa 150 MW (MFT 0, kagamitan tumatakbo).
  - beta.4: DITL-40 MAIN STEAM PRESSURE LOW LOW ← M.310D.
  - beta.5: audit ng hindi ikinabit.
  - beta.6: lahat ng makinang B / C / D nakakabit (73 instance, 0 hindi nakakabit), 868 DITL output tugma, ABC 0 differ. Listahan ng lahat ng mali at ayos: `docs/versions/v2.2.0/UNLINK_AUDIT.md`.
  - Bagong references: start-up / shutdown procedure, PLC logic ng sand, sootblower, bottom ash at limestone.
- **v2.1.0 Stable**: info card, CALC, IRP / ARP / SER, Reset fidelity (51 sheet, 0 differ), Test Cards, LIBRARY, PLANT LIVE, 150 MW mas tugma (66 → 33), in-app Beta / update.
- **v2.0.0 Stable**: Console look, faceplate, Start at 150 MW, plant model naka-angkla sa HMI, PLANT workspace (27 system), LIBRARY (I/O, memory, wiring).
- **v1.22.0 ~ v1.23.0 Stable**: DITL toolbar, iisang mundo ABC + DITL, .MAN / .LOC / .REM = estado, UI mockup v2, event log, Spot check.
- **Mga dati**: coverage ng input / output (51 sheet), ABC-007 (174 tseke), controller tester (headless: 68 controller), multi-file app para sa apk / exe, linis ng analog at DITL code, SemVer.

## Tala (kasaysayan)
- **Linis ng analog code**: Prettier sa `src/analog`, `src/ui`, `src/boot`. Hinati ang `compile-step.js` (`face-defaults.js`, `ranges-fx.js`). Pareho ang minified bundle.
- **Multi-file app**: `npm run build:app` → `index.html` + `js/*.js` para sa apk / exe.
- **DITL cleanup**: `src/digital/ditl-app.js` → `src/digital/parts/01 ~ 07` (`order.list`). Istruktura lang; pareho ang minified DITL.
