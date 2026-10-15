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
| `node tests/regress/world.js [html]` | iisang mundo ABC + DITL: OFF = dating gawi; ON = lahat ng reference may katapat, ABC input = DITL output, DITL row = ABC net, kadena DITL → ABC, bilis ng scan | ~1 min |
| `node tests/regress/closure.js html out.json` | loop closure of every PID with its plant model (P-4), 900 s | ~1 min |
| `node tests/regress/diff.js old.html ... new.html` | the same seeded inputs on every sheet for several builds; lists the sheets whose nets differ. `--neutral` zeroes dMVH / TF / CUT on the last build (isolates F-31); `--hold=SECONDS` adds a steady-state state | 1 ~ 6 min |

Old builds for `diff.js`: `git show <commit>:logic-sim-v1.20.21.html > old.html`.
Needs `playwright` (module path in `PLAYWRIGHT_MODULE`), Chromium (`CHROMIUM`), `xlrd` and `openpyxl`.

## Scenario tests (tests/scenarios, `npm run scenarios`)
Mula input hanggang output ng mismong engine; ang inaasahang sagot ay isinulat mula sa PDF (hindi kinuwenta ng engine). Operator actions = pindot sa tunay na panel. Madaling basahing talaan para sa user: `docs/scenarios/<sheet>.md` (`node tests/scenarios/report.js`).
