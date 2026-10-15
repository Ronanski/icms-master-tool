# v1.20.65 (Beta) — click sa kahon ng SV / MV (popup na pang-taas / baba) + awtomatikong tester para sa bawat controller

**Problem:** (user) Sa planta, ang pagpindot sa SV o MV ay naglalabas ng control na pang-taas / baba; clickable lang kapag enabled sa tamang scenario. At ang test ay dapat sumakop sa bawat controller, hindi sa piling sheet lang.
**Work Done:**
- `hmi.js`: i-click ang kahon ng SV o MV: may popup na ▲▲ (+10 %) ▲ (+1 %) ▼ (-1 %) ▼▼ (-10 %), kahon ng halaga, ✕; ang MV ay may 0 / 50 / 100. Hindi bumubukas kapag disabled (MV sa AUTO o REMOTE, SV sa REMOTE); nagsasara kapag nag-disable.
- `src/ui/uat/scen.js: UATS.generic` + `tests/scenarios/generic.js`: awtomatikong scenario para sa BAWAT controller na may A/M at manual MV: (G1) MANUAL, MV field, 0 / 50 / 100, popup; (G2) PV ay sumasagot sa MV (proseso); (G3) SV field, + / −, popup; (G4) AUTO: MV field at popup naka-disable, AUTO -> MAN na walang talon; (G5) REMOTE (kung meron): R, A; (G6) trip habang AUTO: MANUAL, walang talon, hindi automatic na AUTO. Ang panimulang estado at ang input na nagpapa-force ay hinahanap ng pagsubok (hill-climb), ang inaasahan ay mula sa mga patakaran ng operator.
**ABC-007:** 78 / 78 tama (parehong controller); 156 / 156 ang sulat-kamay na scenario; panel_sync 0 FAIL.
**Hindi pa:** patakbuhin ang generic sa lahat ng 68 controller (susunod); ilagay ang generic sa UAT panel ng app.
