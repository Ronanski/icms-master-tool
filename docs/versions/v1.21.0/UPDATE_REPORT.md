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
