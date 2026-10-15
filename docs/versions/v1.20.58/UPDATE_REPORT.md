# v1.20.58 (Beta) — PV ng "shared" na controller

**Problem:** Dalawang controller sa iisang PV (valves na magkatabi): ang plant model ay sumusunod lang sa una; ang pangalawa ay hindi nagpapagalaw ng PV.
**As Found:** ABC-008 PICFG108A at ABC-030 PICAS1004 — PV hindi gumagalaw kahit galawin ang MV.
**Work Done:** plant.js: ang PV ay sumusunod sa average ng MV ng mga magkakabahaging controller na bukas (ang saradong stand-by na 0 ay hindi nagpapahina). Walang ginalaw na ibang block.
**As Left:** pv_reacts: 13 → 11 ang hindi sumasagot; ABC-010 hindi nasira. Ang natitirang 9 ay interlock ng drawing sa cold-start (hal. ABC-011: M.2001 low-flow dahil AI0129 = 0; kapag AI0129 = 250 T/H, nawawala ang interlock at gumagalaw ang PV 396→284 — na-test). Dagdag: `pv_reacts.js --running` (diagnosis).
**Hindi pa na-check:** buong UAT dry run; ABC-052 TICHR1012; FIC-CF at PIC-BASC (MV stuck sa test).
**Status:** Beta.
