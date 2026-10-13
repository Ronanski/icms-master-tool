# Update Report — v1.20.25

- **Problem:** The UAT file made the user hunt tag addresses in a large diagram, watch the clock and the values, and had no OK / MALI per step.
- **As Found:** v1.20.24 shipped a separate UAT html (`UAT-v1.20.24.html`, also a release asset).
- **Work Done:** The UAT is now inside the simulator (`logic-sim-v1.20.25.html`): a green UAT button (bottom left) opens a panel for the current sheet. Each scenario has SETUP (the app resets, applies the forces, the switch position and the set point and starts RUN), the expected value next to the live value, a countdown, an automatic TUGMA / HINDI TUGMA verdict, a locate button for every tag, and OK / MALI. A sheet is FUNCTIONAL when all its scenarios are OK. Copy of the MALI lines at the end. 182 scenarios on 51 sheets, built from the simulator by `tools/uat/inject.js` (expected values after 10 ~ 120 s of simulated time). The separate UAT file is gone and is not a release asset (`release.yml`, `clean-releases.yml` removes old ones).
- **As Left:** Tested headless: UAT button opens, scenario 3 of ABC-003B (force M.3434 = 1) was set up by the panel, ran 13 s, all four rows turned green, status "TUGMA", OK stored; the locate button moves the view to the tag. `tests.js` passes.
- **Status:** Beta (branch `uat-in-app`, Beta page). Stable v1.20.25 only on the user's GO STABLE.
