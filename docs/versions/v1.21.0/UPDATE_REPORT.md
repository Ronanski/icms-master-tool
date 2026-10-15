# v1.21.0 (target ng susunod na Stable) — mga Beta

**Standard ng version (PROJECT_RULES 5f):** SemVer; ang Stable ay gumagalaw lang sa GO STABLE; ang Beta ay `1.21.0-beta.N`. Ang `v1.20.60` ~ `v1.20.67` na folder ay kasaysayan bago ang standard; lahat ng iyon ay kasama sa `1.21.0-beta.1`.

## 1.21.0-beta.1 (= dating v1.20.60 ~ v1.20.67)
- Audit ng ABC-007 laban sa PDF (RAMP ng FICFA1081 = 0.216 T/s); pangalan ng 126 input (tag sa kaliwa ng wire).
- Faceplate ayon sa DCS ng planta: bar graph (PV, SV, PL~PH marker), kahon ng PV / SV / MV, selector R / A / M, tag bar; click sa SV / MV = control na pang-taas / baba (kapag enabled lang); R / A / M ay nagpa-pulse ng .REM / .LOC / .MAN; SV ay para sa AUTO lang.
- Engine: bumpless AUTO -> MAN at REMOTE -> LOCAL para sa COS leg; ang proseso ay sumasagot sa tunay na utos sa valve (output ng A/M station pagkatapos ng mga kasunod na selector); shared PV.
- UAT sa loob ng app: SCENARIO TEST (operator + proseso) para sa ABC-007 (160 tseke) at awtomatikong tester para sa bawat controller (`tests/scenarios/generic.js`, 68 controller); coverage ng input / output (`tests/scenarios/cone.js`).
- Babala at "Sanhi?" sa panel kapag may interlock na pumuputol sa output.
- Ang resulta ng awtomatikong tester sa 68 controller ay nasa HANDOFF.
