# 3.2.0-beta.78: update report (2026-11-01, PHT)

Merged to `main` as PR #91 on the user's GO BETA ("GO BETA S LAHAT NG UPDATES, FIXES, PATCHES"). Branch: HMI thread (PR #86 branch) + CODE FIXER.
Source of this report: the commit messages of 420a4cc, 14d07d5, 11a0e75, 3914ac4 (not re-tested by DOCS).

## Bago sa app

| Page / area | Ano | Commit |
| --- | --- | --- |
| HMI 038 AIR PREHEATER | Approved mockup v15 as it is (replaces v5). Live: DITL-43 / 44, fans, EST values. | 420a4cc |
| HMI 039 RH / SH BIASING DAMPER | New page, approved mockup (Style B x-ray cut-away, flue gas option A). Controllers TICHR1002A / HICHR1002A / B / TICHR1002, ZT feedback S4 AI0368 ~ 0375, interlocks S4 M.0506 / 0507 / 3440 / 3441 of ABC-020. | 420a4cc |
| Faceplates | `LS_FPOP.info`: PERMISSIVE · TREND · MONITOR faceplate for a controller (039 Y / N). | 420a4cc |
| Shared HMI code | `HSYM.layer` (mockup drawing in an HTML layer that follows plant pan / zoom), `HSYM.clock` (one 15 Hz clock for all motion), `sys.nav` (tabs). Light: no CSS / SMIL animation on the drawings. | 420a4cc |
| 039 fit | Whole page on one screen (fitAll, leader review); the fitW fit removed. | 14d07d5 |

## CODE FIXER (user 2026-11-01 "Ge ayusin pre")

- **150 MW fans:** PAF / SAF / IDF stopped in the logic at RUN (M.3302 / 3303 / 3304 = 0). A read while the ABC was PAUSED (alarm scan -> DUI.outVal -> simSheet) evaluated the DITL latches without inputs from other sheets and reset the SAF latch (DITL-27A); the PAF (DITL-26A row 18) followed. Fixed in `simOn()`: the one world keeps its inputs while the ABC is paused.
- **038 SV-PA1052:** DITL-44 has no output row; its logic ends at DO O.029F (I/O list: SV-PA1052 open command, Logic DITL44, PICT 38). `LS_DOCK.pout` now reads it.
- **039 PT-IA1064-A / B (AI0438 / AI0470):** on no logic sheet; instrument list P&ID PD-023 6/6 = compressed air. Shown from instrument air pressure of the plant model (U.iaP, 7.0 kg/cm2 at 150 MW = 39.PNG) when no logic value.
- **Speed (about 6x less CPU):** `modeNetsByTag` kept per tag; HMI symbol loop and MU / CW pages write only changed values; one page refresh per LIVE pass; icon tagging only for new / changed buttons; status bar measured only on change; ABC drawing and panel not painted while Logic page is hidden; root CSS variables written only on change.

## Hindi pa nasubok

- Live retest ng beta.78 (at ng 28 fix ng beta.77): naghihintay ng "G" ng user.
- Evidence ng CODE FIXER: `code-fixer-perf-ditl44-fans-piia.md` sa notes folder ng leader (hindi kinopya sa repo).
