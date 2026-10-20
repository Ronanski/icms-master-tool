# Regression harness (ABC analog reader)

Headless (Playwright + Chromium) checks of `dist/logic-sim-vX.Y.Z.html` (default: the one html in `dist/`; the reference build v1.20.21 is in `document-references/`). Nothing in the repository is modified by them.

| Command | What it does | Time |
|---|---|---|
| `node tests/regress/tests.js [html]` | T1 all 54 sheets load and step 30 s; T2 timers; T3 LAG; T4 ALM; T5 block counts; S1 F-30 shutdown hold (ABC-003A); S2 F-27; S3 P-1 coal from load; S4 F-31 dMVH limit; S5 F-30 latch count | ~40 s |
| `python3 tests/regress/refcheck.py [html]` | F(X) tables vs `linear-curves-fx.xls`; PID / MAN / SUMA parameters vs the parameter workbook; AI ranges vs `dcs-io-list.xls` | ~20 s |
| `node tests/regress/reset.js [html]` | Reset fidelity: force / flip / run every sheet, press Reset, compare with a fresh load (v1.20.34: 3 sheets still differ, see docs) | ~1 min |
| `node tests/regress/switches.js [html]` | every SW / AMT block: force each control ON / OFF, release, compare with a run without force | ~3 min |
| `node tests/regress/values_layout.js [html] [--list]` | live values: does any value cover text, another value, a block or a wire; side values level, above / below values centred (measured from the rendered text, all 54 sheets) | ~30 s |
| `node tests/engine/isolated.js` | **engine mag-isa** (walang page, walang UI file) = parehong value sa lahat ng net ng 54 sheet gaya ng buong simulator; Reset ng engine | ~1 min |
| `node tools/engine/deps.js` | mapa ng dependency ng engine: ano ang kailangan ng reader + engine sa labas (dapat `AN` lang) | ~2 s |
| `node tests/regress/pid_am.js [html]` | PID auto / manual (PV, SV, MV): manual value kept, no jump when AUTO returns | ~1 min |
| `node tests/regress/faceplate.js [html]` | Operator faceplate: AUTO / MAN / MV move the real A/M station of each controller | ~30 s |
| `node tests/regress/ditl_toolbar.js [html]` | DITL page toolbar (desktop, tablet, phone): walang ABC toolbar sa DITL, Simulate / Fit nakikita, editor tools nasa "⋯ Tools", Health bumubukas, lipat sa ABC | ~30 s |
| `node tests/regress/inapp_update.js [html]` | apk / exe: Beta at update na dina-download sa app, gumagana offline, hindi lumalabas sa Chrome (mock na site) | ~1 min |
| `node tests/regress/overview.js [html]` | Operator tab: overview ng controllers, isang faceplate kapag pinili, force list (FORCE 0 ng M.0228 sa ABC-010 → AUTO), release | ~30 s |
| `node tests/regress/infocard.js [html]` | info card ng search: M.0228 (OR, 2 reader, force manual FICFW1007), M.3410 (4 lugar, link mula ABC-004A, HS-COAL, TO DITL 07-05), read only | ~30 s |
| `node tests/regress/abcbar.js [html]` | DITL page: napiling cell na may M.3302 → bar ALSO IN ABC (ABC-007, ABC-008), ⓘ = info card | ~20 s |
| `node tests/regress/lookonly.js [html]` | search / LIBRARY = tingin lang (VIEW / Simulate off, walang value sa card); LIBRARY groups (I/O: station / node / I/O unit; memory: WM TR PTN SI DI WB FP) | ~40 s |
| `node tests/regress/events.js [html]` | event log: FORCE 0 sa M.0228 (ABC-010) → FM event, pindot A → MODE FICFW1007 → AUTO, drawer | ~30 s |
| `node tests/regress/manstation.js [html]` | faceplate ng MAN station: tunay na tag, ▲ 0.1 % / ▲▲ 1 %, hold-to-ramp, walang keyboard sa touch | ~30 s |
| `node tests/regress/stale_beta.js [html]` | lumang naka-save na Beta (mas luma sa app) ay hindi binubuksan; ang Beta ay kumukuha ng pinakabago | ~30 s |
| `node tests/regress/ditl150.js [html]` | DITL 150 MW: MFT 0, kagamitan tumatakbo, 0 sa DITL → ABC ang mali, 60 s matatag, BFWP A STOP → force manual FICFW1007, Reset = cold | ~1 min |
| `node tests/regress/loaddown.js [html]` | load down: Start at 150 MW, HIC-ULD ▼▼ × 6 sa AUTO = 120 MW; MW demand 3 MW/min, coal at feeder bumababa | ~1 min |
| `node tests/regress/unit_load.js [html]` | M2 unit model: Start at 150 MW → TARGET 60 (3 MW/min) → 60 MW (02.png ±5 %) → balik 150; operator ng boiler master sa MANUAL (< 220 T/H); walang trip | ~10 min |
| `node tests/regress/hmi_op.js [html]` | plant model vs HMI snapshot: sa MV ng snapshot, PV = PV ng snapshot (±2 % ng range) | ~3 min |
| `node tests/regress/plant_live.js [html]` | PLANT LIVE: pagkatapos ng Start at 150 MW, ≥ 200 value / controller / valve ay nakakabit; FIQMS1031, TICBR1140, TIBR11401, TCVFW11101, DPIFG1081 sa tamang sheet; motor ng coal feeder A / C = M.3400 / M.3402 (2.5.0-beta.6); ang MV sa box = MV ng engine | ~1 min |
| `node tests/regress/interlock.js [html] [--sheets=ABC-010,...]` | CHECKLIST #4 (2.5.0-beta.6): bawat A/M station ng ABC, mula sa 150 MW: ang digital input ng drawing papunta sa MANUAL leg ay pinapalitan isa-isa (pati 0 → 1 na pulse, timer hanggang 20 s, AND ng sabay na input); ang input na nagpa-MANUAL = trip ng station, at dapat tumanggi ang A habang naka-trip. Output per cluster a ~ k | ~40 min |
| `node tests/regress/ditl_pagelink.js [html]` | 2.5.0-beta.8: ang FROM / TO column ng DITL row ay page link: sa View at Run, PC / tablet / phone, ang pindot ay nagbubukas ng kabilang dulo (DITL sheet + row na kumikislap, o ABC sheet), may pagpipilian kapag maraming page, ◀ Back bumabalik; ang ABC "FROM / TO DITL" ay nagbubukas din ng DITL item | ~1 min |
| `node tests/regress/pid_auto.js [html]` | 2.5.0-beta.8: bawat PID / PIDV, mula sa 150 MW tapos plant model OFF, AUTO: PV = SV hawak ang output; PV pinilit 10 % sa itaas / ibaba ng SV: ang output ay gumagalaw ayon sa ACT ng drawing (R pababa, N pataas); nasa loob ng MV limit | ~10 min |
