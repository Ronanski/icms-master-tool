# 3.2.0-beta.77 (Beta, 2026-10-31, GO BETA ng user "cge go na", PR #89)

Mga ayos ng 28 finding ng live test (beta.76, H1 ~ H18). Binuo ng leader mula sa tatlong PR; ang DOCS thread ay nagtala lang mula sa ulat ng leader at ng mga thread (hindi sinuri ang code). **Hindi pa live retest**: ang user ang magsasabi ng "G H1".

## Laman
| PR | Thread | Kasama sa beta.77 |
|---|---|---|
| #88 | CODE FIXER | Lahat (draft, branch `claude/code-fixer-b7bfbb`, base 37dd4b2) |
| #87 | APP UI/UX | Lahat: Training dock v3, English text |
| #86 | HMI | Hanggang 26fcea5 LANG. **Hindi kasama** ang pahina 038 AIR PREHEATER (fc6dd79, d84daeb): hindi pa inaprubahan ng user; bukas pa ang PR #86 |

Walang version bump sa mga thread; ang leader ang nagbigay ng 3.2.0-beta.77.

## Naayos (28 finding; talaan: `docs/handoff/LIVE_TEST_FINDINGS.md`)
- **Plant HMI:** #70 (faceplate ng 007: APH, biasing damper, PAF), #48, #43, #67, #40, #45, #44, #53, #7.
- **Training dock:** #60 #64 #65 #46 #47 #52 #61 #57 #51 #63 #66 #49 #56.
- **Plant model / logic / events:** #71 #54 #62 #50 #55.
- **Iba pa:** #69 (ResizeObserver banner).

## Mga detalye ng CODE FIXER (ebidensya ng thread, hindi muling sinuri ng DOCS)
- **#57:** SOP sec 27 (Air pre-heater soot blower): 80K row 20 PLANT AIR / STEAM SELECT = M.4212 (STN102 "S/B SELECT PLANT AIR / STEAM P.B.(CRT)"); 80M row 6 M.417D → out 373 → 80K row 6 → TR317 3 s → O.077C. Headless: O.077C pulse kapag naka-RETRACT (M.4008, galing DITL80L = SB panel). "Circulation Function": walang address sa DITL-80 ~ 80T at STN102 M.4000 ~ M.4253 (c, tingnan ang UNLINK_AUDIT).
- **#71:** parameter sheet HICHR1002A SL 10 / ML 10, HICHR1002B SL 0 / ML 10, kaya ang 10 % ang pinakasarado ng DCS. Dati sa Cold: A MAN 10 (force manual), B AUTO 100 (LN5).
- **#54:** alarm list TE / VT: SWP bearing H95 / HH100, winding H145 / HH155, vibration H7.6 / HH11.9; ACWP bearing HH100, winding H155 / HH165; IDF bearing H90 / HH95 (start < 80 / 82), winding H140 / HH145 (start < 130), vibration H8 / HH11 (start < 8). Model ASSUMED: bearing 55 °C τ 30 min, winding 85 °C τ 15 min, vibration 1.8 / 2.2 mm/s.
- **#62:** TCS I/O (iolist-tcs HMI_DI / DO / AI): COP _IIA AUTO, _IIH MANUAL, _YIP STOPPED, _YIR RUNNING, _ABN FAULT, _IEP STOP FAULT, _IES START FAULT, _IET TRIPPED, _IYP CRT OPE PERM, _YEE MOTOR ELEC TROUBLE; DO _IKA / _IKH / _IYS / _JYP / _JYS / _IKR (HOLD 3000 ms); 1PTLO1931AA_XA / BA_XA LOW (auto start); P-1941 parehong DI (walang IIA / IIH) at DO IYS / JYP / JYS / IKR.
- **#50:** alarm list LT-CW1109 H 1700 (DCS), L 800 (DCS); LSLL-CW1109 300. UNUSUAL: ang H alarm ay kapareho ng NL 1.7 m ng SOP. Priming 0.4 m / 120 s ASSUMED.
- **#66 / #63:** ang generated SOP data ay "≤ 5.6" sa 16.1 (UNUSUAL sa SOP table: auto start iyon, NOTE 16.5); normal 5.6 ~ 6.6 (14.9).
- **#70 (para sa HMI):** hindi engine o event. Headless 1366 × 768, sa beta.76 at sa branch ng #88: click sa PAF / IDF fan = pop-out (`LS_FPOP.open` true), click sa HICHR1002A = controller faceplate. Ang APH H-1052 ay walang click handler sa `hmi2.js`; ang hindi bumukas sa live ay malamang UI (dock na nakatakip / #39, label na walang hit area / #48).

## Sinubok
- Build at check: pasa (ulat ng leader).
- Hindi pa live-tested ang 28 finding.
- `tests/regress/training_dock.js` ay luma na: bagsak din sa beta.76 dahil sa lumang Tagalog na pamagat at lumang class ng dock. Hindi inayos sa batch na ito.

## Bukas pa (pag-uusapan ng user bilang dalawang paksa)
1. Bagong Plant HMI: #59 (dalawang faceplate, Y / N), 038 / 039 at ang iba pang pahina, #39, #58, #16, #68, #36.
2. Pagpapaganda ng Training dock: #41, #42.
