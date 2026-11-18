# UPDATE REPORT — v3.2.5

- **beta.2** (2026-11-18, JENNIE, cloud; PC offline). Two findings of the overnight live Cold start (11-17), headless only:
  (1) **Coal feeder A RUNNING with feed 0** while B / C took the 4 T/H start feed. ABC-004A connector 21 "SI0311" (start feed,
  4 T/H, 8 with M.025B) has its sink circle on two wires: SI0311 and a bare stub with no driver. The reader linked BOTH to the other
  end, and the stub (0) was written last, so the 5 s start pulse (M.0146) put 0 into FICCL1061A.MV. Now a sink end with a driven wire
  feeds the other ends from that wire only, and the stub follows it (compile-step.js). Same reading fixed on ABC-003A connector 11:
  the 2 s pulse "all three coal feeders running" (#32 -> TPS -> M.0123, set of MCV-FA1043-A) reached its OR as 0 before. ABC-027
  connector A had the same shape but already the right value (unchanged, SI0121 852.7 at 150 MW before and after). Evidence:
  `UNLINK_AUDIT.md`. Probe at Cold, feeder RUN forced: MV A / B / C 0 / 4 / 4 T/H before, 4 / 4 / 4 after.
  (2) **HP bypass outlet TT-MS1022 64 C with the bypass open** (live F-T). The PV was the 150 MW snapshot loop gated by 3 % of the MCR
  flow (source.js R.TICMS1022), so a start-up bypass flow read the room temperature. Now an energy balance (unit.js anUnitStepX):
  main steam (U.Pms, TICMS1004 PV) throttled at constant enthalpy to the cold reheat pressure, mixed with the HP bypass spray water
  (TCV-FW1060, 67 T/H at 100 %, L21; deaerator water temperature) by IF97 (steam.js); TT-MS1022 also sees the HP exhaust (anchor HMI
  snapshot TIMS10221 359 C), mixed by the steam; pipe metal lag tauT; no steam = cools to the room. Probes: hot restart, bypass 8 %
  forced: 30 C flat before; after 62 / 121 / 179 / 227 / 266 C at 2 / 4 / 6 / 8 / 10 min, heading to the throttled steam (~330 C
  at 100 kg/cm2 / 430 C). 150 MW steady: 357 C (snapshot 359).
  Tests: tests.js T1-T5 / S1-S6 ALL PASS; coal_bu_release ALL PASS; loop_source 1 FAIL (ABC-030 PICAS1005 PV 10.2 at Cold, the
  known select-block hold, the same on beta.70). cl_feeder_values / ms_page_values cannot run (old page MK12 removed by the HX work).
  NOT tested: live in the app (no PC), full Cold start.
