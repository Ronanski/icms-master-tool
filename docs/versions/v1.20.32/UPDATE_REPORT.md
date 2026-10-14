# v1.20.32 (Stable)

Changed
- Engine, one change (F-36): PID anti-windup. The back-calculation at the output limits used the whole output including the derivative term, so a PV step on a controller with TD wound the integral in the wrong direction (ABC-001C PIC-COBM, reverse action: PV above SV made the output go up to +23 instead of down to -25). It now uses the PI part only. Controllers without TD, and all loops without saturation, are unchanged.
- Block-by-block UAT inside the app: per sheet, every logic block and controller is forced with known inputs and checked against the block definition, grouped by type (Switches, COS, Gates, Comparators, Timers, Lag, F(X), High/Low select, AI, AO, MAN, Totalizers, PID). Test this block / group / sheet / ALL sheets, expected vs got, pin to the block, Accept, Line colours item, FUNCTIONAL status, Copy report.
- Also in this release (Beta v1.20.27-v1.20.29, merged to main): AUTO-TEST state-dependence note, grouped toolbar and tablet drawers (shell only), operator faceplate tab (UI only), English labels.

Checked
- UAT dry run on all ABC sheets: 1767 blocks, 4924 cases, 0 mismatch after the fix (before: 84, then 11; the first 73 were test errors: leg gains/og, hold structures; the 11 real ones were 8 PID, 2 switch gain, 1 MAN; the PID ones were velocity-form controllers, long TF filters, derivative-kick windup (F-36), a rate limit; test setups corrected, F-36 fixed in the engine).
- tests/regress/tests.js: all PASS (T1-T5, S1-S6). Loop closure of 62 PID: 5 loops (all PID with TD at saturation, e.g. ABC-013 PICMS1002, ABC-050 PICMS1006, ABC-052 PICHR1003, ABC-053 TICLO1002, ABC-001C PIC-COBM) differ slightly, same direction of progress.
- UAT panel opened and run on ABC-003E in headless Chromium: 50 / 50 pass, no page errors.

Not checked
- apk, exe and the panel on a real tablet/phone/PC. Line colours are a manual item in the UAT.
- Skipped cases (marked "skipped" with the reason): MAN / PID in interlock tracking, selectors with active BU-CMD, AI blocks that follow a valve feedback, switches whose output is also their own input.
