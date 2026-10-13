# v1.20.31 (Beta, branch `uat-blocks`): block-by-block UAT

Changed: the in-app UAT is rebuilt. Per sheet, every logic block and controller is tested one by one, grouped by type
(Switches, COS selectors, Gates, Comparators, Timers, Lag, F(X) curves, High/Low select, AI, AO, MAN, Totalizers, PID).
Expected values come from the block definition (truth table, set point, delay, curve table, controller action), not from the engine.
Panel: sheet selector, Test this block / group / sheet / ALL sheets, per-case expected vs got, 📍 to the block, Accept for a reviewed mismatch,
a manual "Line colours" item, FUNCTIONAL status per sheet, Copy report.
Engine: not touched. Tools: `tools/uat/{runner,gen,dry,inject,uat-ui}.js`, `tools/uat/known.json`.

Checked: dry run of all generated tests, all ABC sheets: 1767 blocks, 4927 cases, 11 blocks mismatch (`tools/uat/known.json`).
The first dry run had 84 mismatches. They were test-setup errors, not engine errors (FORCE works): the switch applies the gain drawn on a leg
(e.g. B x 20 gives 440 for 22, A x 0.05 gives 0.55 for 11), so the expected value now includes it; switches whose output net is also their own
input (hold structure), AI blocks that follow a valve feedback, and MAN / PID with active tracking are skipped or noted. Panel run on ABC-003E: 50 / 50 pass, no page errors.

Not checked: panel on the real tablet/apk/exe. The 11 remaining are real findings, Needs Verification, engine not changed:
PID direct action ABC-005 AICFG10571, ABC-008 PICFG108, ABC-034 TICAS1017 (output ~0 and slightly below its low limit);
PID reverse ABC-010 LICBR1001B, ABC-014 FICFA1055A/B (no rise when PV below SV); ABC-001C PIC-COBM (output moves opposite);
ABC-032 FICCD1121 MAN 37 gives 100; switches ABC-011/ABC-012 #14 (select 0 gives 66, A x 6); MAN ABC-001A #10 gives 0.

Next: look at the 11 on the user's order.
