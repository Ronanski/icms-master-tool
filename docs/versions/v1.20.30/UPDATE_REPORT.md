# v1.20.30 (Beta, branch `uat-blocks`): block-by-block UAT

Changed: the in-app UAT is rebuilt. Per sheet, every logic block and controller is tested one by one, grouped by type
(Switches, COS selectors, Gates, Comparators, Timers, Lag, F(X) curves, High/Low select, AI, AO, MAN, Totalizers, PID).
Expected values come from the block definition (truth table, set point, delay, curve table, controller action), not from the engine.
Panel: sheet selector, Test this block / group / sheet / ALL sheets, per-case expected vs got, 📍 to the block, Accept for a reviewed mismatch,
a manual "Line colours" item, FUNCTIONAL status per sheet, Copy report.
Engine: not touched. Tools: `tools/uat/{runner,gen,dry,inject,uat-ui}.js`, `tools/uat/known.json`.

Checked: dry run of all generated tests on all ABC sheets: 1797 blocks, 5009 cases, 84 blocks mismatch (listed in `tools/uat/known.json`);
gates, comparators, timers, lag, F(X), high/low select, totalizers: 0 mismatches. Panel opened and run on ABC-003E in headless Chromium, no page errors.

Not checked: panel on the real tablet/apk/exe. The 84 mismatches are NOT triaged: some are test-setup limits (a forced net is also driven
by another block), some may be real engine findings (A/M switch ABC-003E #27 got 628.6 vs 22; ABC-007 #20/#21; PID direct action in
ABC-005/ABC-008 output rises only 0.05 and output slightly below its lower limit; ABC-010 LICBR1001B). Status: Needs Verification.

Next: triage the 84 (spec fix or engine finding) only on the user's order.
