# UPDATE REPORT — v3.2.2

## 3.2.2 Stable (2026-11-10, user "Ok go sa 1" 8:48 AM PHT = option 1: Stable 3.2.2 na Worker ang default ng Stable site)
- **Laman:** 3.2.2-beta.1 (PR #458, main 0d4eb79), walang ibang binago; `src/version.txt` = 3.2.2, `dist/logic-sim-v3.2.2.html` (`--check` SAME).
- **Mabigat na test (PC, sa build 3.2.2):** tests.js 11/11; switches 438 case 0 mali; blocks_io 12021 check 0 mali, plant off at on; ui-audit 27 screen, 0 page error (28 note = sadyang nakatagong label ng Search). Hindi saklaw ng mga ito ang Worker sa https.
- **Hindi nasubok:** ang Stable page na Worker ang default (makikita lang pagkatapos ng release; live check ni Mina kasunod).


- **beta.1** (2026-11-10, JENNIE): finding of Mina's check of Stable 3.2.1: the Stable site ran the page engine by default while every full live test ran with the Worker. The Worker is now the default on the web site (github.io), Beta and Stable; the page engine stays as the automatic fallback; the apk, the exe and file:// stay plain until tested on a device. No effect on the Beta page; the Stable page changes only with a Stable release on the user's word.
