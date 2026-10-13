# ABC Audit Findings — v1.20.23

Earlier findings F-1 ~ F-31 and batches 1 ~ 31: `docs/versions/v1.20.21/FINDINGS.md` (v1.20.21 is the reference build, not edited).

## F-32 — CUT and DH exchanged in the PID data (= R-1) (Confirmed, fixed)
- Basis: `summary-of-pid-pidv-suma-man-parameters.xlsx`, sheet PID, columns CUT and DH (all rows marked OK by the user): e.g. PIC-COBM CUT 5, DH 0; FICFA1043A CUT 10, DH 0. In the v1.20.21 data the same blocks had CUT 0 and DH 5 / 10 (64 of 68 PID).
- Problem: F-31 applies CUT (PV below CUT % of a zero-based range is read as the bottom of the range). With CUT 0 the function never acted.
- Work done: exchange CUT and DH in `AN_DEF.FACE.PID` for the 64 PID where they differ.
- Result: `refcheck.py` 136 rows, 0 differences (PID columns PH, PL, MH, ML, dMVH, I, D, DTI, TF, GAP, CUT, DH and P); test S6: 21 PID give the same output for PV at the bottom of the range and PV inside the cut band (v1.20.21: 0 PID with a cut). DH is not used by the engine.
- Effect: 9 sheets differ from v1.20.21 under the same inputs (ABC-003B / C / D, 009A, 009B, 017, 029, 032, 056); loops with a SV inside the cut band close more slowly (DPICFG108, PICDO1008).

## Decisions taken as DCS engineer from the repository references (no user question)
- **dMVH time base:** per sampling interval DTI (1 s), as % of the MV range; TF: first-order filter on the PV; CUT: low input cut (usual definitions). The textbook gives names and ranges only; kept as in F-31.
- **GAP:** one PID (HICBR1391, 2.5 %). No definition in the references; not simulated (low impact, one loop).
- **TP compensation vs `flow-compensation.xls`:** the workbook coefficients at / bt reproduce the factor (T + 273.15) / (Top + 273.15) (e.g. at = 600 / 575.15 = 1.0432, bt = 273.15 / 575.15 = 0.4749 for Top 302 °C), the same factor the simulator applies. Linear on the real flow by the user's earlier answer (V-18). No change.
- **Range differences ABC-010 LICBR1001A and ABC-020 HICHR1002A:** the faceplate range of the workbook is kept (user-confirmed rows).
- **ABC-051 #22 (F-30):** excluded from the latch by the rule (shares its select with a COS selector); the rule stays.

## Known limits (not resolvable from the repository)
- 25 inputs written "( FROM ABC-xxx )" on the drawings have no partner net in the other sheet's netlist (controller REM flags such as FICFA1043A.REM, HMI push buttons, M.3405, and others). They stay operator inputs in RUN.
- AB0114 ~ AB0117 addresses are in no list (Cannot Verify the address only).
- Viewer labels and values on wires were not tested automatically.

## F-33 — Percent rate compounded at every Reset (Confirmed, fixed)
- `anInit` runs at every Reset and converted `rate` from the already converted value (`rate = rate * span / 100` each time). Now the drawn percentage is kept in `ratePct0` and the rate is always `ratePct0 * span / 100`. Source: earlier v1.20.22 session; applied here by the same one-line change.

## F-34 — T switch without memory (Confirmed, fixed, SW only)
- A T switch (`SW`) with COS conditions kept its last leg when no condition was active; it follows its condition (`pickB = wB`). The A/M switch (`AMT`) keeps the last leg (batch 26 addendum, F-30 latch). The earlier session removed the memory from both; here only `SW`.
- Not taken from that session: dropping F-24. With F-24 the same cross-sheet signals are linked as net links instead of flag links (228 vs 224 links, nothing lost), and B.0733 / B.074B on ABC-006 stay tied.
- After both changes: `tests.js` T1 ~ T4, S1 ~ S6 pass.

## F-35 — GAP implemented (1 PID, HICBR1391, 2.5 %)
- Basis: parameter workbook column GAP. No formula in the references; implemented as the usual gap (dead zone) action: an error inside +-GAP % of the span is read as zero (`anGap`). Only HICBR1391 has a GAP.

## Cross-sheet inputs (closed)
- The inputs that sit next to a "( FROM ABC-xxx )" text and have no partner net are operator, mode or DITL inputs by design: `.MAN` / `.LOC` / `.REM` mode flags, HMI push buttons (M.008C / M.008D), CRT modes of ABC-057, DITL memory (M.3400 ~ M.3405), and the T switch select of ABC-009A (text conditions). They stay inputs the user sets in RUN. No signal that the drawing produces on another sheet is left unlinked.
