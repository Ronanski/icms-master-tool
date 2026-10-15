# v1.20.57 (Beta) — PV hindi gumagalaw kahit OK ang SV at MV

**Problem:** May mga sheet na hindi gumagalaw ang PV kahit OK ang SV at MV sa panel.

**As Found (nasuri ang 13 controller gamit `tests/regress/pv_reacts.js`, MANUAL, MV 40→65):**
- ABC-003A/B/C/D (PICDO1043x), ABC-011 TICBR1130, ABC-012 TICBR1150, ABC-019 TICHR1002, ABC-030 PICAS1005, ABC-052 TICHR1012:
  may selector (T) PAGKATAPOS ng A/M station na nasa B leg (back-up/interlock = 0). Ang MV sa panel ay lumalabas
  sa A/M station, pero ang valve command (output ng selector) ay 0. Kaya walang galaw ang PV. Ito ay galing sa drawing, hindi bug ng plant model.
  Halimbawa ABC-011: select M.0235 = OR(M.2001 low-flow ng ABC-001C ...). Sa simula 0 ang flow (SI0230 = 0), kaya M.2001 = 1 → output putol.
- ABC-003E FIC-OM, ABC-008 PICFG108A, ABC-020 TICHR1002A, ABC-030 PICAS1004: "shared" — iisang PV na hawak ng kabilang controller; hindi ito ang nagpapagalaw ng PV.
- ABC-007 (screenshot): walang bug; may force-manual na M.0190 sa simula kaya hindi makapag-AUTO.

**Work Done:** Sa operator panel, may bagong orange na babala kapag may selector pagkatapos ng controller na nasa B leg:
"OUTPUT PUTOL ng interlock: <signal> = 1 → valve command = back-up leg ng drawing". Walang binago sa engine o ibang block.

**As Left:** Naka-check sa tunay na page: ABC-011 TICBR1130 ay may babala; ABC-007 wala. panel_sync at faceplate regress: PASS.
**Hindi pa na-check:** buong UAT dry run para sa bersyong ito (UI lang ang binago); on-device test.
**Status:** Beta. Next: alamin sa drawing ng ABC-001C kung tama ang default ng M.2001 (low flow) sa simula; kung gusto, i-set ang source flow para mawala ang interlock.
