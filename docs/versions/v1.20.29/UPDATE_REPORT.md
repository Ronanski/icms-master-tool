# Update Report — v1.20.29

- **Problem:** The right pane (detailed) is hard to use for monitoring and for checking the logic behaviour: the operator values, the buttons that can be forced and the trend are not in one place.
- **As Found:** v1.20.28: one right pane (detailed list of inputs, setpoints, controllers) and no operator faceplate.
- **Work Done:** `logic-sim-v1.20.29.html`, UI only (code in `tools/hmi/`; the simulation engine, the analog reader and the viewer logic are not changed). The right pane now has two tabs: **Detalye** (the existing pane) and **Operator** (mini HMI). Only one is open at a time (the Panel button opens / closes the pane; the last tab used is remembered). The Operator tab is built automatically for the sheet that is open and refreshes 4 times a second:
  - a faceplate for every PID / PIDV controller: PV, SV, MV numbers and bars, **AUTO / MAN** buttons (they move the A/M switch of the loop), SV entry with − / +, manual MV entry with 0 / 50 / 100, a **trend** of PV, SV, MV (last 600 samples, kept per controller);
  - manual stations (MAN blocks) with value entry;
  - every digital input of the sheet as an **ON / OFF** button plus a **FORCE** button (inputs that come from another sheet are forced), the SIG.AB bad-signal buttons, and a search box;
  - monitoring from input to output: analog inputs (editable values) and AO outputs with live values;
  - lamps for the named flags (M. / B.) that the logic drives.
  The buttons write the same operator values as the existing pane (input value, forced signal, position of the A/M switch).
- **As Left:** Checked headless on ABC-056: tabs show, the Operator tab hides the detailed pane and the other way round, one faceplate (PICCD1104) with live PV / SV / MV, MAN puts the A/M switch to B and MV 100 is shown, AUTO returns it to A, the ON/OFF button of an input from another sheet forces it ON, the trend has points after 3 s, no page error. The html is identical to v1.20.28 outside the HMI block and the version text (compared by script). Not checked: the real tablet; every sheet; loops whose MV manual input is not an external input (shown as "walang manual input").
- **Status:** Beta (GO BETA from the user), branch `operator-hmi`. Stable only on GO STABLE.
