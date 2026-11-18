# v3.2.5 Update report

## 3.2.5-beta.1 (2026-11-18 PHT, ROSÉ cloud): HMI work that waited for the Stable 3.2.4 release
- **Problem:** the last HMI work of 2026-11-17 (branch `claude/hx-overview`, sources only) was kept out of the Beta until the Stable 3.2.4 release.
- **Work done:** unit overview page in the realistic look (MK00 and UNIT go to it); links of a realistic page open their page; turbine target load on the turbine page; plume and bubble animations stepped (lighter); the readable-size tool stays on a realistic page below 1500 px width (tablet); TCS-AI1001 allowed in the page build (EXTRA). Built on top of the 3.2.4 Stable branch.
- **As left:** headless check at 1600 x 900, 150 MW: the Plant view lists the 22 realistic pages only, the overview page shows live values (151 MW, 122.3 kg/cm2, 540 C), 0 page errors. Checks steps run locally: pass.
- **Not tested:** real tablet, finger touch, live run on the Beta site.
