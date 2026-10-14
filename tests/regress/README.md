# Regression harness (ABC analog reader)

Headless (Playwright + Chromium) checks of the root `logic-sim-vX.Y.Z.html` (default: the one logic-sim-vX.Y.Z.html in the root; the reference build v1.20.21 is in `document-references/`). Nothing in the repository is modified by them.

| Command | What it does | Time |
|---|---|---|
| `node tests/regress/tests.js [html]` | T1 all 54 sheets load and step 30 s; T2 timers; T3 LAG; T4 ALM; T5 block counts; S1 F-30 shutdown hold (ABC-003A); S2 F-27; S3 P-1 coal from load; S4 F-31 dMVH limit; S5 F-30 latch count | ~40 s |
| `python3 tests/regress/refcheck.py [html]` | F(X) tables vs `linear-curves-fx.xls`; PID / MAN / SUMA parameters vs the parameter workbook; AI ranges vs `dcs-io-list.xls` | ~20 s |
| `node tests/regress/reset.js [html]` | Reset fidelity: force / flip / run every sheet, press Reset, compare with a fresh load (v1.20.34: 3 sheets still differ, see docs) | ~1 min |
| `node tests/regress/switches.js [html]` | every SW / AMT block: force each control ON / OFF, release, compare with a run without force | ~3 min |
| `node tests/regress/values_layout.js [html] [--list]` | live values: does any value cover text, another value, a block or a wire; side values level, above / below values centred (measured from the rendered text, all 54 sheets) | ~30 s |
| `node tests/regress/pid_am.js [html]` | PID auto / manual (PV, SV, MV): manual value kept, no jump when AUTO returns | ~1 min |
| `node tests/regress/faceplate.js [html]` | Operator faceplate: AUTO / MAN / MV move the real A/M station of each controller | ~30 s |
| `node tests/regress/closure.js html out.json` | loop closure of every PID with its plant model (P-4), 900 s | ~1 min |
| `node tests/regress/diff.js old.html ... new.html` | the same seeded inputs on every sheet for several builds; lists the sheets whose nets differ. `--neutral` zeroes dMVH / TF / CUT on the last build (isolates F-31); `--hold=SECONDS` adds a steady-state state | 1 ~ 6 min |

Old builds for `diff.js`: `git show <commit>:logic-sim-v1.20.21.html > old.html`.
Needs `playwright` (module path in `PLAYWRIGHT_MODULE`), Chromium (`CHROMIUM`), `xlrd` and `openpyxl`.
