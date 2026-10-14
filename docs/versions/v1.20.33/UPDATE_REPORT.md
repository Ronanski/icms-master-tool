# v1.20.33 (Beta, branch `themes`): clearer colours and themes

Changed (colours only; engine, layout and UAT untouched)
- New selector "Diagram:" next to "UI:": Standard (old colours), Calm (softer colours), Clarity (blocks neutral, only live signals coloured), Paper (light grey page with dark ink, not pure white). Remembered (`ditl.dg`).
- New UI theme "Slate" (softer blue-grey panels).
- Clearer text everywhere: brighter default text and secondary text in the Engineering UI, a thin background-coloured halo around diagram text so letters stay readable where wires cross them, slightly heavier diagram text, lighter dead wires.
- Files: `tools/theme/{theme.css,theme.js,inject.js}`; injected between `<!--THEME-BEGIN-->` and `<!--THEME-END-->`.

Checked: page loads without errors in headless Chromium; ABC-003E running, zoomed screenshots for Standard, Calm, Clarity, Paper, Slate.
Not checked: apk, exe, tablet; other sheets and the DITL diagrams in Paper / Clarity (some colours there may still be dark on light); "UI: Light" was tried and removed (too many fixed dark colours in the toolbars).
