# v1.20.58 (Beta) — PV ng "shared" na controller

**Problem:** Dalawang controller sa iisang PV (valves na magkatabi): ang plant model ay sumusunod lang sa una; ang pangalawa ay hindi nagpapagalaw ng PV.
**As Found:** ABC-008 PICFG108A at ABC-030 PICAS1004 — PV hindi gumagalaw kahit galawin ang MV.
**Work Done:** plant.js: ang PV ay sumusunod sa average ng MV ng mga magkakabahaging controller na bukas (ang saradong stand-by na 0 ay hindi nagpapahina). Walang ginalaw na ibang block.
**As Left:** pv_reacts: 13 → 11 ang hindi sumasagot; ABC-010 hindi nasira. Ang natitirang 9 ay interlock ng drawing sa cold-start (hal. ABC-011: M.2001 low-flow dahil AI0129 = 0; kapag AI0129 = 250 T/H, nawawala ang interlock at gumagalaw ang PV 396→284 — na-test). Dagdag: `pv_reacts.js --running` (diagnosis).
**Hindi pa na-check:** buong UAT dry run; ABC-052 TICHR1012; FIC-CF at PIC-BASC (MV stuck sa test).
**Status:** Beta.

## Dagdag (trace ng natitirang 11 + ABC-007)
- **ABC-011/012/030-1005:** interlock dahil 0 ang measurement (hal. AI0129 steam flow). Sa test na "boiler in service" (measurement sa gitna ng range) gumagalaw na ang PV — drawing logic ito.
- **ABC-003A–D, 019, 052:** interlock din (permissives na ext input = 0 sa cold start: hal. ABC-003A select n109 ← NOT(M.0359 FF); ABC-019 M.0173 ← NOT(n5)...; ABC-052 M.072C ← M.0729 (TON ← NOT M.3355, NOT M.3354...)). Sa ABC-052, ang pagtatakda ng M.3351 / M.3350 / PICHR1003.LOC = 1 ay nakapagpapawala ng interlock (nakita sa bagong "Sanhi?").
- **ABC-003E FIC-OM, ABC-020 TICHR1002A:** "shared"; ang primary nila (003A, 019) ang naka-interlock.
- **FIC-CF (004A), PIC-BASC (009A):** hindi ito bug. Ang PV nila ay kinukuwenta mula sa MV ng ibang controller (FICCL1061A/B/C.MV, SICL1060A.MV) — hindi sa sariling MV. Ang "MV stuck" ay artifact ng test (REMOTE sa simula sa pamamagitan ng M.0132; ang operator ay pipindot ng LOCAL). Inayos ang test.
- **ABC-007 force manual (M.0190):** = OR(... M.0198 ← NOT(n109 input)). Ang n109 ay input na 0 sa cold start (tulad ng "fan running"); drawing logic, nawawala kapag 1.
- **Bago sa panel:** button na **Sanhi?** sa babalang "OUTPUT PUTOL": sinusubukan ang bawat digital input ng sheet at ililista ang mga input na, kapag binago, magpapawala ng interlock (pindutin para itakda).
- **Performance (para sa Web Worker):** pinakamabigat na sheet 3.8 ms/step sa desktop (ABC-004A), average 1.2 ms. Sa tablet ~5–10× mas mabagal; hindi pa nagsisimula ang Worker (malaking refactor — kailangan ng approval mo sa plano).
