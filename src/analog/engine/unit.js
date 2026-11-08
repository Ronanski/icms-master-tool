/* 2.2.0-beta.9 (M2, user: "sundin ang plant physics"): UNIT MODEL. The boiler and the turbine as ONE plant, so that a load change
   moves the plant and not only the demands of the drawing:
     coal (feeder feedrate transmitters, ABC-004A / B / C) -> firing (lag) -> steam made in the drum -> stored energy = drum
     pressure -> turbine valves of the TCS -> main steam flow -> MW.
   The TCS (turbine control system) is outside the DCS drawings: it opens the turbine valves until the generator MW equals the
   turbine master demand of ABC-001C (EIC-TM, MAN station: MW demand + pressure correction LN55). The boiler master of ABC-001C
   (feedforward LN54 + pressure PID PIC-COBM) answers the main steam pressure of this model.
   It runs only while the plant is in service ("Start at 150 MW"): Reset = cold boiler, as before.
   Numbers (docs/versions/v2.2.0/DRAWING_TRACE.md beta.9):
     - anchor: the plant at "Start at 150 MW" (MSF 474.1 T/H, drum 134.2, MSP 122.6 kg/cm2, MW of the transmitters);
     - steam per coal a and MW per steam c: the two loads of the snapshots (4.PNG / 03.png about 150 MW: coal 88.6 T/H,
       MSF 474.1 T/H, 150.5 MW; 02.png: coal 41.8 T/H, MSF 203.7 T/H, 60.3 MW);
     - superheater pressure drop: drum 134.2 - MSP 122.6 at 474.1 T/H, proportional to the flow squared;
     - storage C, firing lag, MW lag and the TCS speed: not in the repository; typical values of a 150 MW drum boiler (ASSUMED,
       written here so they can be changed) */
const AN_UNIT = {
  on: false,
  a: (474.1 - 203.7) / (88.6 - 41.8) /* T/H of steam per T/H of coal */,
  c: (149.8 - 90.3) / (481 - 304) /* MW per T/H of steam: plant trends 2026-11-08 (holds at 150 and 90 MW); the snapshots gave 0.3336 */,
  mwK: 0.3362 * 481 - 149.8 /* MW lost at the anchor line: MW = c x steam - mwK on the plant trend (149.8 MW at 481 T/H); the snapshot anchor 150.5 at 474.1 was 3 MW above it */,
  /* storage and firing lag from the TUNING OF THE PLANT (PID summary: PIC-COBM Kp 3.0, Ti 165 s, Td 7 s): the pressure of a drum
     whose steam flow the TCS holds is an integrator, and a PI on an integrator with a lag is stable only when the lag is well below
     Ti. With 700 / 150 s the loop of the plant tuning oscillated (MSP 70 ~ 126 kg/cm2 at 85 MW, the PID at +-25 %); with
     1500 / 60 s the cross-over of that PI is where its phase is best (about 0.01 rad/s). Not measured on the plant */
  C: 1500 /* (T/H) x s per kg/cm2 of drum pressure */,
  tauF: 60 /* s, coal -> steam made */,
  tauMW: 10 /* s, steam flow -> MW (reheater, ASSUMED) */,
  tcs: 20 /* s, TCS load loop (ASSUMED) */,
  /* other steam outlets of the main steam line, flow at 100 % open and the anchor pressure, as a share of the anchor flow (the valve
     sizes are not in the repository, ASSUMED): ABC-050 PICMS1006 HP turbine bypass PCV-MS1020 (main steam -> cold reheat) and
     ABC-013 PICMS1002 main steam blow-off PCV-MS1001 (start-up vent to the silencer) */
  hpb: 0.48 /* PCV-MS1020, valve sheet L21: 141.7 T/H at 62 % stroke, trim Cv 215 = about 227 T/H (plant-study/12-assumptions.md) */,
  blo: 0.46 /* PCV-MS1001, valve sheet E2-0-123 p5: 184 T/H at 76 % travel, full Cv 232 = about 217 T/H */,
  /* 2.2.0-beta.11 (M2 steps 1 ~ 3): reheat, temperatures, O2.
     - Reheat pressure (ABC-052 PT-HR1003-1 / -2, ABC-019 PT-CR1006 cold reheat, ABC-052 PT-ST1001 first stage): the IP / LP turbine
       is a fixed nozzle, so its inlet pressure is proportional to the steam through it (design: RH 181.9 T/H at 36.6 / 35.1 kg/cm2
       at MCR; 02.png: 15.0 kg/cm2 at 203.7 T/H, 4.PNG 34.0 at 474 T/H: 34.0 x 203.7 / 474 = 14.6). The HP bypass PCV-MS1020
       (ABC-050) adds steam to the cold reheat; the LP bypass PCV-HR1003 (ABC-052) takes steam out of the hot reheat (size as the
       HP bypass, lpb, ASSUMED). Reheater volume lag tauRH (ASSUMED).
     - SH / RH temperature versus load (boiler manual SECT_7 Fig 6 "SH & RH steam temperature versus load": 541 C from 100 to 60 %
       MCR; Fig 10 "SH spray versus load": spray 2.7 % of MSF at 100 %, 1.95 at 85, 1.1 at 70, 0 at 60 % MCR). The spray loops
       (ABC-011 TICBR1130, ABC-012 TICBR1150, ABC-019 TICHR1002) see a load disturbance: at 60 % MCR the spray of the snapshot is
       all closed and the temperature is still at the set point; below 60 % the temperature falls, by the slope of the snapshots
       (02.png at 203.7 T/H = 44 % MCR: MST 517 C, RHT 499 C; 4.PNG 542 / 542): the drop is linear in load (ASSUMED).
       The headers after the spray (ABC-011 TT-BR1140 SH no.2 outlet, ABC-012 TT-MS1004 finishing SH outlet) are the spray outlet
       plus the heat pickup of the next superheater, taken at the anchor (ASSUMED constant), with the metal lag tauT (ASSUMED).
     - O2 (ABC-002 AT-FG1122 / 1123): O2 = 21 x (1 - stoichiometric air / total air), total air = PA + SA + FA of ABC-006 (FT-FA1071,
       FT-FA1081, FT-FA1055), stoichiometric air per T/H of coal AN_GAS.afs (boiler.js, FHI Tab 3); it replaced the anchor (O2 4.3 % at the snapshot air and coal: excess air
       about 26 %; design 20 %). Analyzer lag tauO2 (ASSUMED). PA to the furnace FT-FA1079 (ABC-006 indicator) follows the PAF flow */
  lpb: 1.05 /* PCV-HR1010, L21: 87.4 T/H at 8.3 ata at 81 % stroke, trim Cv 1700 = about 117 T/H. Before, 0.8. */ /* 2.2.0-beta.16: was 0.3; sized so that at 7.5 kg/cm2 it passes the HP bypass flow of the bypass servicing with the valve
    in its working range (PR-OPE-5002: steam flow > 40 T/H, RH pressure 7.5 ksc held by the LP bypass in AUTO): 0.8 x 475 x 7.6 / 34.4 =
    84 T/H, about 60 % open at 50 T/H (ASSUMED; a two-stage bypass is usually sized for 60 ~ 100 % of the boiler flow) */,
  tauRH: 10,
  /* 2.2.0-beta.16 (M4 step 3, bypass system and pressure raise): while the turbine is shut (cold start, before the roll) the reheater
     is a closed volume: the HP bypass fills it, the LP bypass (ABC-052 PCV-HR1003) and the RH blow-off (ABC-054 PICHR1391, PR-OPE-5002
     "Reheat blow-off MVHR1391 open" for warming, closed when the LP bypass is in service) empty it. Crh = steam stored per kg/cm2 of
     hot reheat pressure ((T/H) x s per kg/cm2; the reheater + piping volume is not in the repository, ASSUMED about 200 m3: steam at
     7.6 kg/cm2 is about 4 kg/m3, so about 110 kg per kg/cm2 = 400 (T/H) x s; 40 T/H through the HP bypass fills 0 -> 7.6 kg/cm2 in
     about 75 s); rhb = size of the RH blow-off as a share of the anchor flow at the anchor reheat pressure (ASSUMED, as the main steam
     blow-off) */
  Crh: 400,
  rhb: 0.42 /* RH blow-off: silencer Z-1006 200 T/H (Equipment List p2); no valve sheet in the docs */,
  /* 2.2.0-beta.17 (M4 step 4, turbine roll / sync / load up; PR-OPE-5002 4.4 ~ 4.6): the turbine and its TCS are a black box outside
     the DCS drawings (the DCS only sees the TCS digital inputs of the I/O list and the TARGET MW feedback AI0420). State U.tb:
     st 'off' (stop valves shut) -> 'roll' (rpm ramps at rollRate, IP START MODE: the ICV lets roll steam from the hot reheat, icvRoll)
     -> 'sync' (3600 rpm, the TCS closes the GCB: I.0931 = 1 / I.0932 = 0, INITIAL LOAD 4.5 MW on the ICV) -> 'load' (LOAD UP
     at rate MW/min = 5 % of 150 MW per minute; at MWxf = 20 MW or the ICV full open the HP control valves take over, ICV -> CV
     TRANSFER COMPLETE I.0418 = 1, "transfer at 20 MW or HP bypass closed"). While the generator is on the grid the MW is the HP
     steam (1 - cIP) + the IP / LP steam cIP (reheat unit: about 60 % of the work in the IP / LP, ASSUMED) less the anchor losses
     (c x m0 - MW0, fading out with a small IP flow). Before the transfer the IP / LP steam comes from the HP bypass through the
     reheater (U.rr integrator of beta.16, with the ICV flow out). DCS CONTROL MODE PERMISSIVE I.0081 = 1 above MWperm (NORMAL
     OPERATION, 30 % load, PR-OPE-5002 4.6; the TCS logic is not in the repository, ASSUMED), DCS CONTROL MODE ON I.0082 set by the
     pulse O.0178 of ABC-001C while I.0081, reset by O.0179. These inputs are written only in a start-up (U.cold); the snapshot of
     "Start at 150 MW" keeps its own. */
  rollRate: 120 /* rpm/min, PR-OPE-5002 cold start (the holds at 1800 / 3600 rpm of the procedure are the operator's; not modelled) */,
  icvRoll: 0.13 /* ICV opening for the roll steam (about 14 T/H at 7.6 kg/cm2 reheat, ASSUMED) */,
  cIP: 0.75 /* calculated: HP 38 MW, IP / LP 113 MW of the shaft, HEAT_BALANCE.md */,
  MWxf: 20,
  MWperm: 45,
  MWinit: 4.5 /* PR-OPE-5002: initial load 4.5 MW */,
  rateUp: 7.5 /* MW/min = 5 % / min (PR-OPE-5002 LOAD UP), AI0421 max load-up rate 0 ~ 5 %/min */,
  tauT: 362 /* metal over steam: SH steel 232 t (B-0-001) x 0.5 kJ/kg K = 116 MJ/K, over 128 kg/s x 2.5 kJ/kg K = 0.32 MW/K */,
  /* 3.2.0-beta.39 (roadmap 2): share of the low-load / start-up fall of the SH temperature (dn) at the spray 1 outlet, the SH no.2 pickup and the
     finishing SH pickup (ASSUMED: superheat of each stage at the anchor, 61 / 68 / 80 C of the 209 C over saturation) */
  fsh: [0.3, 0.3, 0.4],
  frDb: 0.75,
  tauO2: 20,
  mcr: 460 /* T/H, boiler MCR (SECT_7) */,
  /* SH spray versus load (Fig 10), as a share of the spray at MCR: [load share of MCR, spray share] */
  /* 3.2.1 b6: plant trends 2026-11-08: spray 2 MV 30 at 150 MW, 10 to 13 at 105 MW (MSF 351 = 0.763 MCR), 0 at 90 MW (0.661); zero near 0.707 */
  sprayCurve: [
    [0.707, 0],
    [0.85, 0.722],
    [1, 1]
  ],
  /* natural steam temperature below the spray range, steam share of MCR: plant trends (90 MW MST 522, RHT 521, 2 h hold) and 02.png (60 MW
     MST 517, RHT 499); below 0.443 the FHI Fig 6 slope */
  natSH: [[0.443, 517], [0.661, 522], [0.707, 541]],
  natRH: [[0.443, 499], [0.661, 521], [0.707, 541]],
  /* temperature fall below 60 % MCR, C per unit of load share (02.png: MST 541 -> 517 and RHT 541 -> 499 at 0.443 MCR) */
  slopeSH: (541 - 524) / (0.6 - 0.4) /* FHI Fig 6: 541 at 60 %, 524 at 40 %, one curve for SH and RH. Manual outranks the snapshot 02.png */,
  slopeRH: (541 - 524) / (0.6 - 0.4),
  /* 3.2.0-beta.38 (CHECKLIST 0.6, ATS 1.4 / 1.6 / 1.71 / 1.72 at the roll): the SH / RH outlet in a start-up versus the boiler load,
     FHI SECT_7 Fig. 2 COLD STARTUP (one curve "SH / RH Out. Temp."): about 415 C from the roll to the IP / HP transfer (15 % load),
     505 C at 30 % (start coal), 541 C from 60 %. Read off the chart (+-5 C); 418 at the roll keeps the steam inside the ATS window
     (MS 400 ~ 420, RH 415 ~ 425 C). The slope of the snapshots (slopeSH) extrapolated to 12 % load gave 468 C: no roll possible.
     The plateau from the roll to the transfer goes with the start-up mode of the turbine (tcs.js): Fig. 3 WARM STARTUP 430 C; Fig. 4
     HOT STARTUP reads 455 ~ 475 C, the ATS HOT mode asks MS >= 455 and RH >= 485 C (PR-OPE-5002 8407): 500 (the reheat reads about 10 C under
     the curve with the start-up biasing damper), the turbine wins */
  suCurve: [
    [0.15, 418],
    [0.3, 505],
    [0.6, 541]
  ],
  suRoll: { warm: 430, hot: 500 },
  /* 2.2.0-beta.12 (M3, trips). The DCS drawings give the LOGIC of a trip (force manual, BU-CMD, interlock); the plant answers:
     - TURBINE TRIP (STN102 I.0400 TCS-DI1003 "#1 Turbine trip", FROM ARP; memory list STN101 M.3200 "T/B TRIP (BC FROM S2)" and
       M.3220 "52G1 OPENED (BC FROM S2)" <- I.0932 "GCB 52G1 off"): the station wiring broadcasts the S2 inputs to S1 (bcast below,
       so one input of the operator trips the whole DCS). The TCS closes the turbine valves (tauTrip, ASSUMED 1 s): no steam to the
       turbine, MW 0; the HP bypass (ABC-050) and the blow-off (ABC-013) take the steam. TURBINE TRIP is an MFT first out of the
       DITL (STN104 memory list M.053F / B.125F "TURBINE TRIP FIRST OUT"; PR-OPE-5003: the alarm is bypassed only for a normal
       shutdown), so the boiler trips with the turbine and cools down through the bypass; the pulse M.0124 / M.0256 of ABC-050 is
       also for HOUSE LOAD / 52G OPEN (I.0932 / I.0937), where the boiler keeps running (not in the trip test).
     - NO BFWP RUNNING (ABC-010 M.3343 / M.3344 <- STN103): the feedwater flow is 0 whatever the valve (FICFW1007 and the start-up
       valve LICBR1001B: plant.js pr.mul); the drum level falls at the steam flow (plant.js integrating level) to the low low
       (ABC-010 M.0170 ~ M.0172, -254 mm) where the DITL trips the boiler (STN104 M.3407 DRUM LEVEL L.L.).
     - FAN STOPPED (ABC-007 M.3302 PAF / M.3303 SAF, ABC-008 M.3304 IDF <- STN103): the air flow of a stopped fan is 0 (pr.mul on
       FICFA1071 / FICFA1081); the furnace pressure (ABC-008 PICFG108 / 108A, PT-FG1085 / 1086 / 1087) is air in minus flue gas
       out: more air in than the ID fan takes out raises it (kfp mmH2O at twice the air of the anchor, ASSUMED: the range of the
       instrument is +-600 mmH2O, FURNACE PRESSURE HIGH > 30 mmH2O M.3107), a stopped ID fan takes nothing out (plant.js pr.uf = 0
       on the IDF command).
     - MFT (I.000F "MFT FROM IRP" on every station, STN101 M.0341 MFT TPs, coal feeders stopped M.3400 ~ M.3402): the coal is 0
       (plant.js feeder model), the steam made decays with tauF, the pressure falls to MAIN STEAM PRESSURE LOW LOW (M.310D, 72.9).
     The DITL consequences (fan trip -> MFT, drum level L.L. -> MFT, MFT -> turbine trip) are the DITL's: with the one world OFF the
     operator forces them (CLAUDE.md 7, user 2026-10-16) */
  tauTrip: 1,
  kfp: 150 /* fallback; the authority of the ID fan of the anchored loop model is used when known (anUnitStart) */,
  /* 2.2.0-beta.14 (M4 step 1, PR-OPE-5002 / boiler manual SECT_7 Fig 1 / 2): COLD START. "Start cold" (hmi-op.js anPlantCold) keeps
     the anchors of "Start at 150 MW" (the gains of every loop model) and puts the plant cold: drum 0 kg/cm2, water and bed at the
     ambient, no coal, turbine valves shut (U.turb = false until the turbine is rolled, M4 step 4). The physics added here:
     - FIRING = coal + oil of the four start-up burners (ABC-003A ~ D FICDO1043A ~ D, PV SI0070 / 0380 / 0460 / 0480 = AI0515 / 0546 /
       0517 / 0548 0 ~ 3.5 T/H after the gate of the SUPPLY OIL VALVE CLOSE M.3410 / 3411 / 3416 / 3417). One T/H of oil makes ao
       times the steam of one T/H of coal (ao = 2.55: PR-OPE-5002 "2.55 TPH coal = 1 TPH diesel"; the heating values of the design
       data Tab_1 are an image without text); the offset of the firing line (m0 - a x F0) fades out below
       30 % of the anchor coal so that a small fire makes a small steam flow and the anchored behaviour above stays the same.
     - WATER HEAT-UP: below the saturation temperature of the drum pressure the firing heats the water (no steam): Cw (T/H) x s of
       steam-equivalent per C of the boiler water (ASSUMED 200 t of water: 200 t x 4.19 MJ/t/C / 2000 MJ/t x 3600 = 1508); at
       saturation the pressure rises against C + Cw x dTsat/dP (dTsat/dP of the steam table, steam.js; 3.2.0-beta.15), so the saturation
       temperature rises at firing / Cw: 2 burners about 45 T/H steam-equivalent = 107 C/h, the limit of Fig 1 (110 C/h) is the
       operator's duty (firing), as on the plant.
     - BED TEMPERATURE (no DCS transmitter: the bed thermocouples are on the DITL / local; model state U.Tb): first order (tauB) to
       Tamb + (Tb0 - Tamb) x (fuel share / air share) ^ 0.45 (Fig 8: furnace about 850 C at full load; two start-up burners at the
       light-off air give about 450 C = the coal batch permissive of PR-OPE-5002, 400 ~ 450 C; 600 C continuous).
     - STEAM TEMPERATURE while cold: the superheaters cannot give more than the gas (plant.js pr.tcap = bed temperature) and not
       less than saturation (pr.tsat); TAB_9: SH outlet <= 535 C before synchronisation */
  Tamb: 30,
  ao: 2.55 /* PR-OPE-5002 4.3.x: "Approximately: 2.55 TPH coal = 1 TPH diesel" (2.2.0-beta.15; beta.14 had 2 ASSUMED) */,
  /* 2.2.0-beta.15 (M4 step 2, coal transfer): the coal burns only in a hot bed: burnt share 0 at 350 C, 1 at 600 C (ASSUMED,
     PR-OPE-5002: batch firing at 400 ~ 450 C to see that the coal burns, continuous feeding above 600 C); the rest leaves unburnt */
  Tburn0: 350,
  Tburn1: 600,
  Cw: 1726 /* water 175.6 t (T8 Tab 2) x 4.18 + evaporative steel 437.7 t (B-0-001) x 0.5 kJ/kg K = 953 MJ/K, in units of 0.554 MW */,
  uaW: 0.58 /* heat to the water by furnace rise: 460 T/H x (2640 - 1360) kJ/kg = 164 MW over 850 - 340 C = 0.32 MW/K, in the same units */,
  kcool: 60 /* 2.2.0-beta.21: cooling of the unfired boiler by the air, T/H steam-equivalent at the anchor air and 300 C (ASSUMED, Fig. 5) */,
  kamb: 1 /* 2.2.0-beta.21: bottled boiler loss to the ambient, T/H steam-equivalent at 300 C (ASSUMED) */,
  tauB: 900,
  tauBc: 14400,
  Tb0: 850,
  /* 3.2.0-beta.15 (phase B, utilities): CONDENSER VACUUM. The turbine exhausts to the condenser, cooled by the seawater pumps (SWP-A ~ C
     M.3353 ~ M.3355) with the condensate pumps (CP-A / B M.3350 / M.3351) taking the water out (PR-OPE-5002: SWP, CEP and VACUUM UP
     before the turbine is rolled). The vacuum (share 0 ~ 1) rises in vacUp s once a SWP and a CEP run (ASSUMED 15 min with the
     vacuum pumps, a field step) and is lost in vacDn s when they stop (ASSUMED 1 min). The turbine cannot be rolled below 90 %; a
     turning or loaded turbine is tripped by the TCS below 60 % (LOW VACUUM TRIP -> ABC-050 I.0400 TURBINE TRIP) */
  vacUp: 1846 /* ED 066 p15: starting ejector 0.345 kg/cm2 A at 20 min, 65 % of full vacuum */,
  vacDn: 60
};
/* the AI blocks of one address on every sheet (station | address, like "Start at 150 MW") */
function anUnitAIs(key) {
  const out = [];
  for (const sh of AN.sheets) {
    if (/^ABC-000/.test(sh.name) || !sh.S) continue;
    let st = null;
    try {
      st = shStn(sh);
    } catch (e) {}
    const S = sh.S;
    for (const b of S.blk) {
      if (b.k !== 'AI' || !b.o || b.o[0] == null) continue;
      const m = /^(?:S(\d)\s*)?(AI\d{4})$/.exec((AN.nm(S, b.o[0]) || '').trim());
      if (m && (m[1] || st) + '|' + m[2] === key) out.push([S, b]);
    }
  }
  return out;
}
function anUnitVal(list) {
  for (const [S, b] of list) {
    const s = S.rt.st[b.id];
    if (s && isFinite(s.val)) return +s.val;
  }
  return NaN;
}
/* x: one value for every block, or a function of the index (2.2.0-beta.11: each transmitter keeps its own offset of the snapshot) */
function anUnitWrite(list, x) {
  list.forEach(([S, b], i) => {
    const s = S.rt.st[b.id];
    if (!s || b.pins.some(p => p.role === 'out' && S.rt.force[p.n] !== undefined)) return;
    const xi = typeof x === 'function' ? x(i) : x;
    if (!isFinite(xi)) return;
    const r = b.rng,
      y = r ? Math.max(r.lo, Math.min(r.hi, xi)) : xi;
    s.val = s.act = y;
  });
}
/* the value of every block of the list now (anchor of "Start at 150 MW"), kept on the list */
function anUnitAnchor(list) {
  list.a0 = list.map(([S, b]) => {
    const s = S.rt.st[b.id];
    return s && isFinite(s.val) ? +s.val : NaN;
  });
  return list;
}
/* the unit model stops (Reset = cold boiler): the load disturbance of the spray loops goes too */
function anUnitStop() {
  const U = AN_UNIT;
  AN_SRC.t = -1; /* 3.2.0-beta.14: a new plant state, the source of the loops again (source.js) */
  for (const e of U.ld || [])
    if (e.pr) {
      e.pr.ld = 0;
      e.pr.fr = e.pr.tsat = e.pr.tcap = undefined;
    }
  U.cold = false;
  U.turb = true;
  U.etLvl = NaN; /* 3.2.0-beta.63: the expansion tank starts again at its level of 27.PNG (AN_MU) */
  U.cwPrime = NaN; /* live test #50: the closed cooling loop primed as V-CW1001 of the start state (AN_MU) */
  U.mt = {};
  U.iaP = U.paP = NaN; /* 3.2.0-beta.68: the air tanks are set again by the start state (AN_AIR) */
  U.avH = {}; /* 3.2.1 the positions held by the airlocks (AN_AV) */
  U.lpT = undefined; /* 3.2.1 the LP heater temperatures start again at their steady value (AN_LP) */
  U.iaRun = U.paRun = null; /* 3.2.1: the compressors are read again from the DITL (anAirStep) */
  U.acT1 = U.acT2 = NaN; /* 3.2.0-beta.69: the aux cooling water temperatures start again (AN_ACW) */
  for (const m of U.mul || []) for (const p of m.pr) p.mul = undefined;
  for (const z of U.spr || []) z.pr.uf = undefined;
  U.lpbSp = null; /* 3.2.1 anCdTagStep: the LP bypass spray controller is found again */
  U.fwC = null; /* 3.2.1 anFwTagStep: its controllers and F(X) are found again */
  U.asC = null; /* 3.2.1 anAsTagStep: page 08 values */
  U.asT15 = U.asTgs = undefined;
  if (U.fwp && U.fwp.pr) U.fwp.pr.op = undefined;
  for (const p of U.fp || []) {
    p.pr.uf = undefined;
    p.pr.ld = 0;
    if (!p.pr.src) p.pr.smul = p.pr.sbase = undefined;
  }
  U.on = false;
}
/* start: the plant as it is now (end of "Start at 150 MW") is the steady state */
function anUnitStart() {
  const U = AN_UNIT;
  anUnitStop();
  const sh = AN.sheets.find(x => x.name === 'ABC-001C');
  if (!sh || !sh.S) return;
  const S = sh.S;
  U.S = S;
  /* coal feeder feedrate transmitters (station of each sheet) */
  U.fuel = [
    ['ABC-004A', 'AI0480'],
    ['ABC-004B', 'AI0512'],
    ['ABC-004C', 'AI0544']
  ].map(([k, ai]) => {
    const s4 = AN.sheets.find(x => x.name === k);
    return s4 && s4.S ? anUnitAIs(shStn(s4) + '|' + ai) : [];
  });
  const s1 = shStn(sh);
  U.msp = anUnitAIs(s1 + '|AI0131');
  U.drum = anUnitAIs(s1 + '|AI0128');
  U.msf = anUnitAIs(s1 + '|AI0129');
  U.mw = [s1 + '|AI0419', s1 + '|AI0774'].map(anUnitAIs);
  /* the TCS: TARGET MW SETPOINT FROM TCS (AI0420) and DCS CONTROL MODE ON FROM TCS (I.0082) */
  U.tgt = anUnitAIs(s1 + '|AI0420');
  U.dcs = S.lab.findIndex(l => l && String(l.t).trim() === 'I.0082');
  U.tm = S.blk.find(b => b.k === 'MAN' && b.tag === 'EIC-TM');
  /* the turbine inlet pressure (ABC-050 PT-MS1006-1 / -2, the PV of the HP bypass): the same steam, after the main steam line */
  const s50 = AN.sheets.find(x => x.name === 'ABC-050');
  U.tin = s50 && s50.S ? [anUnitAIs(shStn(s50) + '|AI0416'), anUnitAIs(shStn(s50) + '|AI0512')] : [];
  /* 3.2.1 the lube oil cooler outlet TE-LO1002-1 / -2 (STN102 AI0452 / AI0516, the PV of ABC-053 TICLO1002): AN_LO writes them */
  const s53 = AN.sheets.find(x => x.name === 'ABC-053');
  U.lo = s53 && s53.S ? [anUnitAIs(shStn(s53) + '|AI0452'), anUnitAIs(shStn(s53) + '|AI0516')] : [];
  /* 3.2.1 the hotwell level LT-CD1110 (STN102 AI0640, ABC-031): AN_CD reads it (the suction head of the condensate pumps). PT-CD1117
     (STN102 AI0564) is on no ABC sheet (ABC-015 AI0564 is STN103 ZT-FA1016): the DITL-61B row reads the model (plantsw.js) */
  const s31 = AN.sheets.find(x => x.name === 'ABC-031');
  U.cdHwL = s31 && s31.S ? anUnitAIs(shStn(s31) + '|AI0640') : [];
  /* 3.2.1 (IRENE: HEATER LEVELS): the level transmitters of the five feedwater heaters (STN102 LT-HD110x-1 / -2) and the outputs of
     their primary / alternate drain level controllers (ABC-035 ~ 039): AN_HD writes the levels and reads the valves */
  U.hd = AN_HD.h.map(([k, sh, ais, c1, c2]) => {
    const s = AN.sheets.find(x => x.name === sh);
    if (!s || !s.S) return null;
    const L = ais.map(ai => anUnitAIs(shStn(s) + '|' + ai)).filter(l => l.length);
    return { k, L, v1: null, v2: null, c1, c2, sh, y: NaN };
  }).filter(Boolean);
  /* the valve commands of the other outlets (output of their A / M station after the interlocks) */
  const ctlOut = (k, t) => {
    const x = AN.sheets.find(y => y.name === k),
      c = x && x.S && AN.hmiCtrls ? (AN.hmiCtrls(x.S) || []).find(q => q.tag === t) : null;
    return c && c.out != null ? { S: x.S, n: c.out, c, t } : null;
  };
  U.vlv = [
    ['ABC-050', 'PICMS1006', U.hpb, 1 /* to the cold reheat */],
    ['ABC-013', 'PICMS1002', U.blo, 0]
  ]
    .map(([k, t, f, rh]) => {
      const o = ctlOut(k, t);
      return o ? { S: o.S, n: o.n, f, rh, t } : null;
    })
    .filter(Boolean);
  /* 2.2.0-beta.14: the oil flow of the four start-up burners (PV of FICDO1043A ~ D after the gate of the drawing) */
  U.oilN = ['ABC-003A', 'ABC-003B', 'ABC-003C', 'ABC-003D']
    .map((k, i) => ctlOut(k, 'FICDO1043' + 'ABCD'[i]))
    .filter(o => o && o.c.q && o.c.q.pv != null)
    .map(o => ({ S: o.S, n: o.c.q.pv }));
  /* the demand to the TCS: SI0236 = MW demand + pressure correction LN55 (ABC-001C). On the snapshots the turbine master EIC-TM is
     MANUAL (M.2016 = 1, output 0: DCS CONTROL MODE OFF, the TCS holds the load); the TCS set point itself is not in the
     repository, so the TCS follows the unit demand of the DCS */
  U.dem = S.lab.findIndex(l => l && String(l.t).trim() === 'SI0236');
  U.cn = anCompNet(S, 'AI0129');
  if (!U.msp.length || !U.drum.length || !U.msf.length || U.dem < 0 || U.cn < 0) return;
  const F0 = U.fuel.reduce((a, l) => a + (anUnitVal(l) || 0), 0),
    m0 = +S.rt.v[U.cn],
    P0 = anUnitVal(U.msp),
    Pd0 = anUnitVal(U.drum),
    mwv = U.mw.map(anUnitVal).filter(isFinite),
    MW0 = mwv.length ? mwv.slice(0, 2).reduce((a, x) => a + x, 0) / Math.min(2, mwv.length) : NaN,
    Ptin = U.tin.length ? anUnitVal(U.tin[0]) : NaN;
  if (![F0, m0, P0, Pd0, MW0].every(isFinite) || m0 <= 0 || P0 <= 0 || Pd0 <= P0) return;
  Object.assign(U, {
    F0,
    m0,
    P0,
    Pd0,
    MW0,
    kdp: (Pd0 - P0) / (m0 * m0),
    kln: isFinite(Ptin) && Ptin <= P0 ? (P0 - Ptin) / (m0 * m0) : 0 /* main steam line drop to the turbine inlet */,
    Kt: m0 / P0 /* valve opening 1 = the opening at the anchor */,
    gv: 1,
    Pd: Pd0,
    Qs: m0,
    ms: m0,
    MW: MW0,
    tcsT: NaN,
    t: 0,
    cold: false,
    turb: true,
    tb: { st: 'load', rpm: 3600, icv: 1, xfer: true, tgt: NaN, aim: NaN },
    Tb: U.Tb0,
    Tw: steamTsat(Pd0),
    oilF: 0,
    /* 3.2.0-beta.14: the sources of the loops at the anchor (source.js), before the first step */
    Pms: P0,
    Fc: F0,
    unb: 0,
    rpm: 3600,
    mhp: 0,
    qlp: 0
  });
  /* 2.2.0-beta.11 (M2 steps 1 ~ 3, see AN_UNIT): reheat, SH / RH temperatures, O2 */
  const shOf = k => AN.sheets.find(y => y.name === k),
    stOf = k => {
      const x = shOf(k);
      try {
        return x && x.S ? shStn(x) : null;
      } catch (e) {
        return null;
      }
    },
    ais = (k, a) => {
      const st = stOf(k);
      return anUnitAnchor(st != null ? anUnitAIs(st + '|' + a) : []);
    },
    netOf = (S2, nm) => {
      for (let n = 0; n < S2.lab.length; n++) if ((AN.nm(S2, n) || '').trim() === nm) return n;
      return -1;
    },
    procOf = (k, t) => {
      const x = shOf(k),
        b = x && x.S && x.S.procs ? x.S.procs.find(z => (z.txt || [])[1] === t) : null;
      return b && b.proc ? { S: x.S, b, pr: b.proc } : null;
    };
  /* reheat: hot reheat pressure PT-HR1003-1 / -2 (PV of the LP bypass PICHR1003), cold reheat PT-CR1006 (ABC-019), first stage
     pressure PT-ST1001-1 / -2 / -3 (the set point of the LP bypass is LN12 of it + 5.1); the LP bypass valve command */
  U.rhp = [ais('ABC-052', 'AI0421'), ais('ABC-052', 'AI0513'), ais('ABC-019', 'AI0529')];
  U.pist = [ais('ABC-052', 'AI0883'), ais('ABC-052', 'AI0884'), ais('ABC-052', 'AI0885')];
  U.lpv = ctlOut('ABC-052', 'PICHR1003');
  U.rr = 1;
  U.mhp = 0;
  U.Prh = U.rhp.length && U.rhp[0].a0 && U.rhp[0].a0[0] > 0 ? U.rhp[0].a0[0] : 34;
  /* 2.2.0-beta.16 (M4 step 3): the RH blow-off PICHR1391 (ABC-054) takes steam out of the hot reheat while the turbine is shut. Its PV
     is the hot reheat pressure of ABC-052 (drawing ABC-054: "HOT REHEAT STEAM PRESSURE HRP 052 S2 SI0180" -> STN102017), a link
     between stations that the reader leaves as an input of the sheet: written here every step, like the station wiring (one address =
     one signal, CLAUDE.md 1), unless the user forces it */
  U.rhbv = ctlOut('ABC-054', 'PICHR1391');
  U.alink = [];
  {
    const s52 = shOf('ABC-052'),
      s54 = shOf('ABC-054');
    if (s52 && s52.S && s54 && s54.S) {
      const a = netOf(s52.S, 'SI0180'),
        b = netOf(s54.S, 'STN102017');
      if (a >= 0 && b >= 0 && s54.S.ext.includes(b)) U.alink.push([{ S: s52.S, n: a }, { S: s54.S, n: b }]);
      /* 2.2.0-beta.20 (bug, fixed): ABC-054 has no drawn link to the set of ABC-001C (its PV comes through this alink), so the run
         loop never stepped it: the RH blow-off stayed at the value it had when the sheet was loaded (0 %) whatever the operator or
         the PIDV did, and the unit model read that 0 (CHECK bypass stage: "RH blow-off 0 %" in every run). The sheets the unit
         model reads are stepped with the set (links.js actSet, like AN.plantSheets) */
      AN.unitSheets = ['ABC-054'];
    }
  }
  /* 3.2.0-beta.14 (bug, fixed): the headers that are the SOURCE of other loops (source.js: ABC-028 diesel oil header after the pump
     for the burners ABC-003A ~ D, ABC-030 aux steam header) have no drawn link to the set of ABC-001C either: unstepped, their PV
     stayed at the Cold value (0) after the diesel oil pump was started and the burners got no oil (CHECK cold start: drum 0 kg/cm2) */
  AN.unitSheets = [...new Set((AN.unitSheets || []).concat(['ABC-028', 'ABC-030']))];
  /* the spray loops and the fall of the temperature below 60 % MCR (C per unit of load share) */
  /* 3.2.0-beta.39 (roadmap 2) (roadmap 2, MST 555 C > H alarm 548): the SH is one chain, spray 1 outlet (TICBR1130) + SH no.2 pickup = SH no.2
     outlet (TICBR1140) - spray 2 = finishing SH inlet (TICBR1150) + finishing SH pickup = main steam (TICMS1004). Before, the fall of
     the temperature at low load was all on TICBR1150 while TICBR1140 stayed at its anchor: 389 C after a SHUT spray 2 with 458 C
     before it, so DITL-33 (finishing SH inlet > 440 C, M.2543 of ABC-012 SI0381) opened the spray 2 shut-off valve only near 80 MW
     and the main steam overshot. Now TICBR1150 with its spray shut reads TICBR1140 (up: the shift of the SH no.2 outlet), the fall
     dn is shared along the chain (fsh, ASSUMED by the superheat of each stage at the anchor: 394 / 462 / 542 C over 333 C saturation
     at 129 kg/cm2), and the spray 2 need of the load (Fig 10) is the finishing SH pickup growing with the load (122 C at the anchor,
     less the spray 2 authority at <= 60 % MCR): the main steam with the sprays shut is the same as before */
  U.ld = [
    [procOf('ABC-011', 'TICBR1130'), U.slopeSH, 'sh1'],
    [procOf('ABC-012', 'TICBR1150'), U.slopeSH, 'up'],
    [procOf('ABC-019', 'TICHR1002'), U.slopeRH]
  ]
    .filter(([p]) => p)
    .map(([p, s, r]) => Object.assign({ s, r }, p));
  /* the headers after the spray: SH no.2 outlet TT-BR1140-1 / -2 (PV of TICBR1140) = spray 1 outlet (PV of TICBR1130) + pickup;
     finishing SH outlet TT-MS1004-1 / -2 (PV of TICMS1004) = spray 2 outlet (PV of TICBR1150) + pickup */
  U.sh = [
    ['ABC-011', 'TICBR1130', ['AI0610', 'AI0642'], 'sh2'],
    ['ABC-012', 'TICBR1150', ['AI0612', 'AI0644'], 'fsh']
  ]
    .map(([k, t, aa, r]) => {
      const o = ctlOut(k, t);
      if (!o || !o.c.q || o.c.q.pv == null) return null;
      const pv0 = +o.S.rt.v[o.c.q.pv],
        L = aa.map(a => ais(k, a)).filter(l => l.length);
      return isFinite(pv0) && L.length ? { S: o.S, n: o.c.q.pv, L, pv0, x: pv0, r, pk0: L[0].a0[0] - pv0 } : null;
    })
    .filter(Boolean);
  /* O2: total air of ABC-006 (PA + SA + FA flow), the two analyzers of ABC-002, PA to the furnace FT-FA1079 */
  const s6 = shOf('ABC-006');
  U.tafS = s6 && s6.S ? s6.S : null;
  U.taf = U.tafS ? ['FIFA1071.PV', 'FIFA1081.PV', 'FIFA1055.PV'].map(nm => netOf(U.tafS, nm)).filter(n => n >= 0) : [];
  U.o2 = [ais('ABC-002', 'AI0273'), ais('ABC-002', 'AI0433')].filter(l => l.length);
  const taf0 = U.taf.reduce((a, n) => a + (+U.tafS.rt.v[n] || 0), 0),
    o2a = U.o2.map(anUnitVal).filter(isFinite),
    O20 = o2a.length ? o2a.reduce((a, q) => a + q, 0) / o2a.length : NaN;
  U.afs = 0;
  if (U.taf.length === 3 && isFinite(O20) && O20 > 0 && O20 < 21 && taf0 > 0 && F0 > 0) {
    U.afs = AN_GAS.afs; /* T/H of air per T/H of coal, stoichiometric, boiler.js */
    U.O20 = U.o2v = O20;
    U.taf0 = taf0;
  }
  U.pa = ais('ABC-006', 'AI0166');
  U.bedDp = [[ais('ABC-006', 'AI0134'), 1426], [ais('ABC-006', 'AI0262'), 1432]];
  U.soxAI = anUnitAIs('1|AI0466'); /* stack SOx, boiler.js anSoxStep */
  U.bedSc = [['ABC-009A', 'SICL1060A'], ['ABC-009A', 'SICL1060B'], ['ABC-009A', 'SICL1060C'], ['ABC-009B', 'SICL1060D']].map(([k, t]) => {
    /* MAN stations, in rpm (compile-step.js): their output pin */
    const x = shOf(k),
      b = x && x.S ? x.S.blk.find(q => q.k === 'MAN' && (q.txt || []).includes(t)) : null,
      p = b && (b.pins || []).find(q => q.role === 'out');
    return p ? { S: x.S, n: p.n } : null;
  }).filter(Boolean);
  U.paNet = U.tafS ? netOf(U.tafS, 'FIFA1071.PV') : -1;
  U.pa0 = U.paNet >= 0 ? +U.tafS.rt.v[U.paNet] : NaN;
  /* ---- 2.2.0-beta.12 (M3): trips ---- */
  const labOf = (k, l) => {
      const x = shOf(k);
      if (!x || !x.S) return null;
      const n = x.S.lab.findIndex(z => z && String(z.t).trim() === l);
      return n >= 0 ? { S: x.S, n } : null;
    },
    procsOf = (k, tags) => tags.map(t => procOf(k, t)).filter(Boolean);
  /* 3.2.1 d2 (LISA): station wiring S1 -> S2. ABC-020 reads S2 M.3154 "BOILER STEAM FLOW < 15% MCR (69T/H) (BC FROM S1)" (memory list 102);
     memory list 101 gives the same name to M.2002, the comparator of ABC-001C (and M.3154 "STN101 STATION WIRING"). Nothing wrote it: 0 */
  {
    const a = labOf('ABC-001C', 'M.2002'),
      t = labOf('ABC-020', 'S2 M.3154') || labOf('ABC-020', 'M.3154');
    if (a && t && t.S.ext.includes(t.n) && !a.S.ext.includes(a.n)) U.alink.push([a, t]);
  }
  /* station wiring: STN102 digital inputs broadcast to STN101 (memory list "BC FROM S2"); written only on nets that are inputs of
     the drawing (S.ext) and not forced by the user */
  U.bcast = [
    /* 2.3.0-beta.1 (ABC-013-1): the house operation OR of ABC-013 reads them too ("TURBINE TRIP M.3200 (FROM S2 L0400)", "52G1 OPEN
       M.3220 (FROM S2 L0932)", "52L1 OPEN FOR HOUSE OPERATION M.3221 (FROM S2 L0937)") */
    [labOf('ABC-050', 'I.0400'), [labOf('ABC-001C', 'M.3200'), labOf('ABC-010', 'M.3200'), labOf('ABC-013', 'M.3200')]],
    [labOf('ABC-050', 'I.0932'), [labOf('ABC-010', 'M.3220'), labOf('ABC-013', 'M.3220')]],
    [labOf('ABC-050', 'I.0937'), [labOf('ABC-013', 'M.3221')]]
  ]
    .filter(([a, b]) => a && a.S.ext.includes(a.n))
    .map(([a, b]) => [a, b.filter(x => x && x.S.ext.includes(x.n))]);
  U.trip = [labOf('ABC-050', 'I.0400'), labOf('ABC-001C', 'M.3200')].filter(Boolean);
  U.vtrip = labOf('ABC-050', 'I.0400');
  U.vac = 1; /* 3.2.0-beta.15: a plant in service has its condenser vacuum (Cold puts it to 0) */
  /* 2.2.0-beta.17: the TCS inputs of the I/O list this black box writes in a start-up (ABC-050 STN102: GCB 52G1 on / off, ICV -> CV
     transfer complete; ABC-001C STN101: DCS control mode permissive / on feedback), the DCS mode commands it reads (O.0178 / O.0179),
     and the turbine speed TCSAI1004 (ABC-053 AI0534, lag -> SI0261 -> ABC-010 SI0246 while the GCB is open) */
  U.di = {
    gcbOn: labOf('ABC-050', 'I.0931'),
    gcbOff: labOf('ABC-050', 'I.0932'),
    xfer: labOf('ABC-050', 'I.0418'),
    perm: labOf('ABC-001C', 'I.0081'),
    on: labOf('ABC-001C', 'I.0082'),
    onCmd: netOf(S, 'O.0178'),
    offCmd: netOf(S, 'O.0179'),
    /* 3.2.1 d1 (LISA): ABC inputs of the I/O list STN102 with no writer before: TCS-DI1042 / 1043 turbine start-up warm / hot mode (I.0413 / I.0414, ABC-050 and ABC-051),
       TCS-DI1030 turning gear engaged (I.0417, ABC-053), LS-HD1105 / 1102 / 1103 heater level H.H. (I.029E / I.029C / I.029D, ABC-035 / 038 / 039) */
    warm: [labOf('ABC-050', 'I.0413'), labOf('ABC-051', 'I.0413')].filter(Boolean),
    hot: [labOf('ABC-050', 'I.0414'), labOf('ABC-051', 'I.0414')].filter(Boolean),
    tg: labOf('ABC-053', 'I.0417'),
    /* ZSO-CD1115 LP turbine bypass desuperheater spray water control valve open (STN102 I.0892, ABC-052): the valve TCV-CD1115 at full stroke */
    lpbZso: labOf('ABC-052', 'I.0892'),
    /* memory list STN101 / 104 M.0001 ALWAYS "1" (ABC-029, ABC-001B): nothing wrote it, it read 0 */
    one: [labOf('ABC-029', 'M.0001'), labOf('ABC-001B', 'M.0001')].filter(Boolean),
    hd: [
      [labOf('ABC-035', 'I.029E'), 'H5', 140],
      [labOf('ABC-038', 'I.029C'), 'H2', 150],
      [labOf('ABC-039', 'I.029D'), 'H3', 140]
    ]
  };
  {
    const st2 = stOf('ABC-053');
    U.spd = st2 != null ? anUnitAIs(st2 + '|AI0534') : [];
  }
  /* flows that need a machine running: feedwater (BFWP A / B), primary air (PAF), secondary air (SAF) */
  U.mul = [
    {
      pr: procsOf('ABC-010', ['FICFW1007', 'LICBR1001B']).map(p => p.pr),
      run: [labOf('ABC-010', 'M.3343'), labOf('ABC-010', 'M.3344')]
    },
    { pr: procsOf('ABC-007', ['FICFA1071']).map(p => p.pr), run: [labOf('ABC-007', 'M.3302')] },
    { pr: procsOf('ABC-007', ['FICFA1081']).map(p => p.pr), run: [labOf('ABC-007', 'M.3303')] }
  ].map(m => Object.assign(m, { run: m.run.filter(Boolean) }));
  /* 3.2.1 (IRENE: FEEDWATER): the motor of the DITL drawing too (BFWP A / B = DITL-23A / #B): a FIELD TRIP (protection relay) stops the
     water although ABC-010 M.3343 (DITL-23A output 55 RUNNING) still reads 1 */
  U.mul[0].drw = U.mul[0].run.length === 2 ? ['DITL-23A', 'DITL-23A #B'] : null;
  U.mul[0].dis = U.mul[0].run.length === 2 ? [['DITL-38 #MV-FW1001', 'DITL-38 #MV-FW1391'], ['DITL-38 #MV-FW1002', 'DITL-38 #MV-FW1392']] : null;
  /* 2.2.0-beta.15 (M4 step 2): the start-up feedwater valve (ABC-010 LICBR1001B, single-element drum level control for the start-up,
     FCV-FW1060) is a second line into the drum beside the main valve of FICFW1007: its flow is added to the feedwater flow
     transmitter (plant.js pr.op of the FICFW1007 loop), ksu = 30 % of the anchor feedwater at 100 % open (ASSUMED: the size of a
     start-up control valve is not in the repository; the snapshots show it at 0.1 % M at 150 MW) */
  U.suv = ctlOut('ABC-010', 'LICBR1001B');
  U.fwp = procOf('ABC-010', 'FICFW1007');
  U.ksu = 0.3;
  /* furnace pressure: the two IDF actuators in series (hydraulic coupling PICFG108, inlet damper PICFG108A) take the flue gas out */
  U.fp = procsOf('ABC-008', ['PICFG108', 'PICFG108A']);
  U.idf = labOf('ABC-008', 'M.3304');
  U.kfpA =
    null; /* the pressure rise when the ID fan takes nothing out, from the loop model (so that no air and no ID fan = the anchor) */
  /* 3.2.0-beta.23: the furnace / cyclone thermocouples (the bed temperature, see the step) */
  U.tbed = Object.keys(AN_HMI_AI)
    .filter(k => /^TIFG(1090|1091|1095|1096|1009)[A-Z]?$/.test(AN_HMI_AI[k][1]))
    .map(k => anUnitAnchor(anUnitAIs(k)))
    .filter(l => l.length);
  /* 3.2.0-beta.39 (roadmap 2, HMI thread: in Cold, all fans stopped, the air preheater outlet kept the 150 MW snapshot): the air
     preheater outlet air temperatures TT-FA1086 / 1087 (SA, ABC-003A) and TT-FA1076 / 1077 (PA, ABC-006) follow the hot gas like
     the bed thermocouples; the SA pressures PT-FA1085 (SAF outlet, ABC-057) and PT-FA1088 (hot SA, ABC-003A) go with the square
     of the SA flow FT-FA1081 (fan law). The ID fan speed ST-LO1756 (ABC-008 AI0481, no value in the snapshots) is the hydraulic
     coupling PICFG108 over the speed range of the fan manual (I.D. fan 350 ~ 1140 rpm, linear ASSUMED), 0 with the fan stopped */
  const aiList = re =>
    Object.keys(AN_HMI_AI)
      .filter(k => re.test(AN_HMI_AI[k][1]))
      .map(k => anUnitAnchor(anUnitAIs(k)))
      .filter(l => l.length);
  U.aphT = aiList(/^TIFA(1086|1087|1076|1077)$/);
  U.aphL = { pa: aiList(/^TIFA(1076|1077)$/).flat(), sa: aiList(/^TIFA(1086|1087)$/).flat() }; /* boiler.js anAphStep */
  U.saP = aiList(/^PIFA(1085|1088)$/);
  U.saN = U.tafS ? netOf(U.tafS, 'FIFA1081.PV') : -1;
  U.sa0 = U.saN >= 0 ? +U.tafS.rt.v[U.saN] : NaN;
  U.idfS = ais('ABC-008', 'AI0481');
  U.idfV = ctlOut('ABC-008', 'PICFG108');
  U.idfRpm = [350, 1140];
  /* ---- 3.2.0 roadmap 3 (starting points: Cold = a cold plant, not the 150 MW snapshot) and the P1 fix queue of
     docs/versions/v3.2.0/INSTRUMENT_VALVE_COVERAGE.md ---- */
  /* P2 #14: the second drum pressure transmitter PT-BR1001-2 (ABC-010 AI0385) reads the drum too (it kept 134.1 kg/cm2 in a cold plant) */
  U.drum = U.drum.concat(anUnitAIs(s1 + '|AI0385'));
  /* the cold reheat pressure PT-CR1003 and the HP bypass outlet pressure PT-MS1021 (ABC-051) are the reheater inlet: the same steam as
     PT-CR1006, scaled with it (35.3 / 35.0 kg/cm2 at the anchor; they kept 35 kg/cm2 in a cold plant) */
  U.rhp = U.rhp.concat([ais('ABC-051', 'AI0528'), ais('ABC-051', 'AI0566')].filter(l => l.length));
  /* the first stage pressure of the turbine is not the only pressure that goes with the turbine steam: extraction no.4 PT-TS1022 (ABC-056,
     deaerator heating steam) too */
  U.pist = U.pist.concat([ais('ABC-056', 'AI0562')].filter(l => l.length));
  /* temperatures that kept the 150 MW snapshot in a cold plant (roadmap 3), each written from the model with the metal lag:
     - TT-CR1004 cold reheat (ABC-051): the HP turbine exhaust (the anchor 370 C moves with the main steam) and the HP bypass outlet
       TT-MS1022 (after its spray), mixed by their steam; no steam = it cools to the ambient
     - TT-CR1005-1 / -2 (ABC-019, after the RH spray): the cold reheat less the cooling of the RH spray (39 C at the anchor spray)
     - TT-HR1004 hot reheat (ABC-052): the reheater outlet, PV of TICHR1002 (TT-HR1002), with its own offset of the snapshot
     - TT-AS1003 aux steam header (ABC-034): 236 C with the header in service (PT-AS1004 source of ABC-030), ambient without it
     - TT-FW1160 economizer inlet (ABC-010): the deaerator water (saturation of PT-CD1104, ambient while it is not heated) plus the HP
       heaters, whose extraction steam goes with the turbine load (244 C at the anchor)
     - TT-FA1055-A / -B FA blower outlet (ABC-006): the heat of compression while the blowers run (81 / 76 C at the anchor) */
  U.xt = {
    cr: ais('ABC-051', 'AI0900'),
    byo: ais('ABC-051', 'AI0865'),
    rhi: [ais('ABC-019', 'AI0866'), ais('ABC-019', 'AI0898')].filter(l => l.length),
    hr: ais('ABC-052', 'AI0868'),
    rhPv: ctlOut('ABC-019', 'TICHR1002'),
    mst: ctlOut('ABC-012', 'TICMS1004'),
    aux: ais('ABC-034', 'AI0642'),
    auxP: ais('ABC-030', 'AI0514'),
    fw: ais('ABC-010', 'AI0592'),
    dea: ais('ABC-056', 'AI0417'),
    fab: [ais('ABC-006', 'AI0579'), ais('ABC-006', 'AI0627')].filter(l => l.length),
    faF: ais('ABC-006', 'AI0545'),
    /* P2 #14: the drum level transmitter LT-BR1001-2 (ABC-010 AI0258) is not one the level model writes (the PV of LICBR1001 does not
       move with it: plant.js anProbe), so it kept its value while the drum filled or emptied, and its level switches never acted.
       It reads the same water: the mean of LT-BR1001-1 / -3 with its own offset of the snapshot (2 mm against 0 / 8 mm) */
    lt2: ais('ABC-010', 'AI0258'),
    lt13: [ais('ABC-010', 'AI0130'), ais('ABC-010', 'AI0386')].filter(l => l.length)
  };
  {
    const X = U.xt,
      a = L => (L && L.a0 && isFinite(L.a0[0]) ? L.a0[0] : NaN);
    X.cr0 = a(X.cr);
    X.rhi0 = X.rhi.map(L => a(L));
    X.rhv0 = X.rhPv && X.rhPv.c.q ? +X.rhPv.S.rt.v[X.rhPv.n] : NaN; /* RH spray MV at the anchor */
    X.hrOff = X.rhPv && X.rhPv.c.q && X.rhPv.c.q.pv != null ? a(X.hr) - +X.rhPv.S.rt.v[X.rhPv.c.q.pv] : 0;
    X.fw0 = a(X.fw);
    X.dea0 = a(X.dea);
    X.faF0 = a(X.faF);
    X.MST0 = 541;
    X.lt2Off = X.lt13.length ? a(X.lt2) - X.lt13.reduce((s, L) => s + a(L), 0) / X.lt13.length : NaN;
    X.T = {};
  }
  /* P1 #1: VALVE POSITION = VALVE COMMAND. The position transmitter (ZT) of a damper / control valve follows the command of its station
     (actuator lag tauZT, ASSUMED 3 s); before, it kept the snapshot (ZT-FA1053-1 35 % with the damper shut in a cold plant) */
  U.tauZT = 3;
  const manOut = (k, t) => {
    const x = shOf(k),
      b = x && x.S ? x.S.blk.find(z => z.k === 'MAN' && (z.tag === t || (z.txt || []).includes(t))) : null;
    return b && b.o && b.o[0] != null && b.o[0] >= 0 ? { S: x.S, n: b.o[0] } : null;
  };
  const ztMap = [
    ['ABC-003A', 'FICFA1043A', 'AI0291'],
    ['ABC-003B', 'FICFA1043B', 'AI0437'],
    ['ABC-003C', 'FICFA1043C', 'AI0582'],
    ['ABC-003D', 'FICFA1043D', 'AI0629'],
    ['ABC-007', 'FICFA1071', 'AI0192'],
    ['ABC-007', 'FICFA1081', 'AI0193'],
    ['ABC-008', 'PICFG108A', 'AI0194'],
    ['ABC-008', 'PICFG108', 'AI0482'],
    ['ABC-014', 'FICFA1055A', 'AI0176'],
    ['ABC-014', 'FICFA1055B', 'AI0196']
  ];
  for (let i = 5; i <= 26; i++) {
    const t = 'HICFA10' + String(i).padStart(2, '0');
    ztMap.push([i <= 16 ? 'ABC-015' : 'ABC-016', t, null]);
  }
  ztMap.push(['ABC-020', 'HICHR1002A', 'S4 AI0368'], ['ABC-020', 'HICHR1002A', 'S4 AI0369'], ['ABC-020', 'HICHR1002A', 'S4 AI0370'], ['ABC-020', 'HICHR1002A', 'S4 AI0371']);
  ztMap.push(['ABC-020', 'HICHR1002B', 'S4 AI0372'], ['ABC-020', 'HICHR1002B', 'S4 AI0373'], ['ABC-020', 'HICHR1002B', 'S4 AI0374'], ['ABC-020', 'HICHR1002B', 'S4 AI0375']);
  U.zt = [];
  for (const [k, t, ai] of ztMap) {
    const x = shOf(k);
    if (!x || !x.S) continue;
    const S2 = x.S,
      src = ctlOut(k, t) || manOut(k, t);
    if (!src) continue;
    /* the AI block of the ZT on that sheet: by its address, or (furnace wall dampers) the ZT whose tag number is the station's */
    const L = [];
    for (const b of S2.blk) {
      if (b.k !== 'AI' || !b.o || b.o[0] == null) continue;
      const nm = (AN.nm(S2, b.o[0]) || '').trim();
      if (ai ? nm === ai : (AN.descOf ? AN.descOf(x, nm) || '' : '').startsWith('ZT-FA' + t.slice(5) + ' ')) L.push([S2, b]);
    }
    if (L.length) U.zt.push({ src, L, y: NaN, t });
  }
  /* P1 #5 SPRAY BLOCK VALVES (DITL shut-off valves; positions of the DITL valve model while the one world runs): no spray water with
     the block valve shut, whatever the control valve (plant.js pr.uf = the share of the command that reaches the process).
     ABC-011 TICBR1130 <- XV-FW1111-1 / -2 (DITL-32, #B), ABC-012 TICBR1150 <- XV-FW1121-1 / -2 (DITL-33, #B), ABC-019 TICHR1002 <-
     XV-FW1151 (DITL-35), ABC-051 TICMS1022 <- XV-FW1061 (DITL-79, HP bypass), ABC-052 TICHR1012 <- XV-CD1114 (DITL-66, LP bypass) */
  U.spr = [
    ['ABC-011', 'TICBR1130', ['DITL-32', 'DITL-32 #B']],
    ['ABC-012', 'TICBR1150', ['DITL-33', 'DITL-33 #B']],
    ['ABC-019', 'TICHR1002', ['DITL-35']],
    ['ABC-051', 'TICMS1022', ['DITL-79']],
    ['ABC-052', 'TICHR1012', ['DITL-66']]
  ]
    .map(([k, t, v]) => {
      const p = procOf(k, t);
      return p ? { pr: p.pr, v } : null;
    })
    .filter(Boolean);
  /* P1 #6 COAL FEEDER OUTLET DISCHARGE VALVE (DITL-20, #B, #C = feeder A / B / C: M.0478 / 0488 / 0498 OPEN P.B. of the memory list
     STN104): the coal of a feeder reaches the furnace only through its open outlet valve */
  U.cfo = ['DITL-20', 'DITL-20 #B', 'DITL-20 #C'];
  /* 3.2.1 the MV of TICLO1002 = TCV-CW1201 (STN102 AO0469), cooling water to the lube oil cooler (AN_LO) */
  U.loMv = ctlOut('ABC-053', 'TICLO1002') || manOut('ABC-053', 'TICLO1002');
  /* the transmitters this model writes: the plant model of a loop on them stops writing (ABC-001C PIC-COBM: main steam pressure) */
  const own = new Set();
  const lists = [U.msp, U.drum, U.msf, U.spd || []]
    .concat(U.mw, U.tin, U.rhp, U.pist, U.o2, [U.pa], U.tbed, U.aphT, U.saP, U.idfS.length ? [U.idfS] : [], (U.bedDp || []).map(x => x[0]), [U.soxAI])
    .concat(...U.sh.map(h => h.L))
    .concat([U.xt.cr, U.xt.hr, U.xt.aux, U.xt.fw, U.xt.lt2], U.xt.rhi, U.xt.fab, U.zt.map(z => z.L), U.lo || [])
    .concat(...(U.hd || []).map(h => h.L));
  for (const l of lists) for (const [S2, b] of l) own.add(S2.rt.st[b.id]);
  U.own = own;
  anBoilerStart(U); /* 3.2.1 SEULGI: the boiler-side plant model (boiler.js) */
  U.on = true;
  /* 3.2.0-beta.68: "Start at 150 MW" = the air compressors in service, the tanks at their pressure (AN_AIR, 39.PNG 7.0 kg/cm2) */
  U.iaP = U.paP = AN_AIR.P;
  U.avH = {};
  U.iaRun = U.paRun = null; /* 3.2.1: the compressors as the DITL of the scenario (anAirStep, first step) */
  U.paW0 = U.paW1 = U.paW2 = NaN;
  U.mt = {}; /* live test #54: the running motors start at their steady temperature (AN_MT) */
  for (const h of U.hd || []) h.y = NaN; /* 3.2.1: the heater levels start again from the transmitters (AN_HD) */
  U.hdSeed = true; /* 3.2.1: the drain valves of the heaters start at their steady opening at 150 MW (AN_HD) */
  U.frT = undefined;
  U.tco = null; /* 3.2.0-beta.66: the oil-only state of the snapshot (tcs.js tcsOilState) starts again */
  U.tc = null; /* 3.2.0-beta.38: the snapshot of "Start at 150 MW": the TCS model only in a start-up / shutdown (Cold, warm, hot, live) */
  /* 3.2.0-beta.14: the snapshot plant has its diesel oil pump in service (source.js field equipment) */
  AN_SRC.field.hypo = true;
  AN_SRC.field.hypoB = false; /* live test 2026-11-04: dosing pump B standby, unloading pump stopped (field, HCDSP) */
  AN_SRC.field.hypoU = false;
  AN_SRC.field.pur = true;
  AN_SRC.field.mu1033 = false;
  AN_SRC.field.cw1001 = true; /* live test #50: the expansion tank outlet open, the closed cooling loop primed */
  U.loTr = NaN; /* 3.2.1 AN_LO: the lube oil starts at its steady value */
  U.cdTs = NaN; /* 3.2.1 AN_CD: the condenser starts at its steady value */
  U.lpT = undefined; /* 3.2.1 AN_LP: the LP heaters too */
  U.bedI = NaN; /* the bed inventory starts again (anBedStep) */
  U.soxZ = NaN; /* the lime in the bed too (boiler.js anSoxStep) */
  U.bedLeg = 0;
  if (AN_SRC.valve) for (const k in AN_FV0) delete AN_SRC.valve[k]; /* 3.2.1: the field valves at their normal line-up */
  AN_SRC.field.lhd = false; /* Mina H1: the lower ring header drains (PD-019) closed while steaming */
  AN_SRC.lhdPct = 0;
  U.cwPrime = 1;
  AN_SRC.field.esp = true;
  AN.unit = U;
}
/* 2.2.0-beta.14 (M4 step 1): the plant cold, with the anchors of "Start at 150 MW" kept (called by hmi-op.js anPlantCold after
   anPlantLoad150): drum 0 kg/cm2, water and bed at the ambient, no steam, turbine shut, MW 0 */
function anUnitCold() {
  const U = AN_UNIT;
  if (!U.on) return false;
  Object.assign(U, {
    cold: true,
    turb: false,
    tb: { st: 'off', rpm: 0, icv: 0, xfer: false, tgt: 0, aim: 0 },
    vac: 0,
    Pd: 0,
    Qs: 0,
    ms: 0,
    mb: 0,
    mhp: 0,
    MW: 0,
    gv: 0,
    tcsT: 0,
    rr: 0,
    Tw: U.Tamb,
    Tb: U.Tamb,
    oilF: 0,
    burn: 0,
    unb: 0,
    t: 0
  });
  U.o2v = 21;
  U.frT = undefined;
  /* 3.2.0 roadmap 3: the temperatures of anUnitStepX start at their cold value (no lag from the 150 MW anchor) */
  if (U.xt) U.xt.T = {};
  U.Pmsv = 0; /* the main steam pipe after the stop MOV: no pressure in a cold plant */
  for (const z of U.zt || []) z.y = NaN;
  for (const h of U.sh) h.x = U.Tamb;
  for (const L of U.tbed || []) anUnitWrite(L, U.Tamb);
  /* 3.2.0-beta.14: cold = the field equipment stopped too (diesel oil pump, source.js) */
  AN_SRC.field.hypo = false;
  AN_SRC.field.hypoB = false;
  AN_SRC.field.hypoU = false;
  AN_SRC.field.pur = false;
  AN_SRC.field.mu1033 = false;
  AN_SRC.field.cw1001 = false; /* live test #50: the expansion tank outlet closed, the closed cooling loop not primed */
  U.loTr = NaN; /* 3.2.1 AN_LO: the lube oil starts at its steady value */
  U.cdTs = NaN; /* 3.2.1 AN_CD: the condenser starts at its steady value */
  U.lpT = undefined; /* 3.2.1 AN_LP: the LP heaters too */
  U.bedI = NaN; /* the bed inventory starts again (anBedStep) */
  U.soxZ = NaN; /* the lime in the bed too (boiler.js anSoxStep) */
  if (AN_SRC.valve) for (const k in AN_FV0) delete AN_SRC.valve[k]; /* 3.2.1: the field valves at their normal line-up */
  AN_SRC.field.lhd = false; /* Mina H1: the lower ring header drains (PD-019) closed */
  AN_SRC.lhdPct = 0;
  U.cwPrime = 0;
  AN_SRC.field.esp = false;
  AN_SRC.t = -1;
  /* 3.2.0-beta.68: cold = the air compressors stopped, the air tanks empty (AN_AIR) */
  U.iaP = U.paP = 0;
  U.avH = {};
  U.iaRun = U.paRun = null; /* 3.2.1: the compressors as the DITL of the scenario (anAirStep, first step) */
  U.paW0 = U.paW1 = U.paW2 = NaN;
  U.mt = {}; /* live test #54: the motors start again from the ambient (AN_MT) */
  for (const h of U.hd || []) h.y = NaN; /* 3.2.1: the heater levels start again from the transmitters (AN_HD) */
  U.hdSeed = false;
  anBoilerCold(U); /* 3.2.1 SEULGI: the boiler-side plant model (boiler.js) */
  tcsInit(U, 'cold');
  return true;
}
/* 2.2.0-beta.21 (M5 shutdown): the plant at 150 MW WITH the start-up / shutdown physics on (U.cold: the water heat storage of the
   drum, the steam temperature capped by the gas, the oil of the start-up burners, the bed temperature, a turbine trip = machine off
   and GCB open, the TCS inputs of the DCS written by the model). The anchors of "Start at 150 MW" stay as they are: the plant is at
   full load, on the grid, DCS control mode ON. Called after anPlantLoad150 (hmi-op.js anPlantLive, CHECK M5) */
function anUnitLive() {
  const U = AN_UNIT;
  if (!U.on) return false;
  U.cold = true;
  U.turb = true;
  U.tb = { st: 'load', rpm: 3600, icv: 1, xfer: true, tgt: NaN, aim: NaN, perm: true };
  U.Tw = steamTsat(U.Pd);
  tcsInit(U, 'load');
  return true;
}
/* 2.2.0-beta.17 (M4 step 4): the operator on the TCS panel (outside the DCS): 'roll' (open the stop valves, IP start mode, rpm up
   at rollRate), 'sync' (at 3600 rpm: GCB closed, initial load MWinit), 'loadup' (target MW at rateUp MW/min; default 45 = NORMAL
   OPERATION). Returns the state or a reason ('' = done) */
function anTurbine(cmd, arg) {
  const U = AN_UNIT;
  if (!U.on || !U.tb) return 'No unit model: start from Cold first';
  const tb = U.tb;
  /* 3.2.0-beta.66: the 036 TURBINE OIL pumps at the 150 MW snapshot (no TCS model): the oil-only state of tcs.js */
  if (cmd === 'trip') return tcsTripManual(U);
  if (cmd === 'tripreset') return tcsTripReset(U);
  if (cmd === 'fault') return tcsTripFault(U, arg);
  if (!U.tc && cmd === 'oil') return tcsOilCmd(tcsOilState(U), arg || {});
  if (!U.tc && cmd === 'vex') {
    tcsOilState(U).vex = arg !== 0 && arg !== false;
    return '';
  }
  /* 3.2.0-beta.38 (CHECKLIST 0.6): the TCS / ATS model (tcs.js): the auxiliaries and the ATS step push buttons. 'roll' = ATS AUTO
     from the next step up to ACCELERATION (3600 rpm), 'sync' = EXCITATION + SYNCH. & INITIAL LOAD, 'loadup' = LOAD UP to the target */
  if (cmd === 'shutdown' && !U.tc) tcsFromOil(U);
  if (U.tc) {
    const c = U.tc;
    if (cmd === 'roll') {
      if (tb.st === 'sync' || tb.st === 'load') return 'Already synchronised';
      if (c.step >= 3) return 'The turbine is already at 3600 rpm';
      let nx = c.cur >= 0 ? c.cur : c.step + 1;
      if (nx === 0 && c.Thp > 150) nx = 1;
      if (nx === 2 && !(c.mode === 'amb' || c.mode === 'c1')) nx = 3;
      const r = c.cur >= 0 ? '' : tcsStepIn(U, nx);
      if (r) return r;
      c.auto = true;
      c.autoTo = 3;
      return '';
    }
    if (cmd === 'sync') {
      if (tb.st === 'sync' || tb.st === 'load') return 'Already synchronised';
      if (c.step >= 1 && c.step < 3 && tb.rpm > 3550) c.step = 3;
      if (c.step < 3) return c.step < 1 ? 'Roll the turbine first' : 'Not at 3600 rpm / ACCELERATION not finished (' + tb.rpm.toFixed(0) + ' rpm)';
      const r = c.cur >= 0 ? '' : tcsStepIn(U, c.step + 1);
      if (r) return r;
      c.auto = true;
      c.autoTo = 5;
      return '';
    }
    if (cmd === 'loadup') {
      if (tb.st !== 'sync' && tb.st !== 'load') return 'Synchronise the generator first';
      if (c.step < 5) return 'Waiting for the initial load hold (SYNCH. & INITIAL LOAD, ' + (c.tm / 60).toFixed(0) + ' / ' + (c.holdMin || 0) + ' min)';
      return tcsStepIn(U, 6, arg);
    }
    const r = tcsCmd(U, cmd, arg);
    return r == null ? 'Unknown command: ' + cmd : r;
  }
  if (cmd === 'roll') {
    if (tb.st !== 'off') return 'The turbine is already turning (' + tb.st + ')';
    if (!(U.vac >= 0.9)) return 'No condenser vacuum (' + Math.round(100 * (U.vac || 0)) + ' %): start the seawater pumps (SWP) and a condensate pump (CEP); VACUUM UP (ejectors, gland sealing) needs aux steam: main steam > 12 kg/cm2';
    Object.assign(tb, { st: 'roll', xfer: false, tgt: 0, aim: 0 });
    return '';
  }
  if (cmd === 'sync') {
    if (tb.st !== 'roll') return tb.st === 'off' ? 'Roll the turbine first' : 'Already synchronised';
    if (tb.rpm < 3599) return 'Not at 3600 rpm yet (' + tb.rpm.toFixed(0) + ')';
    Object.assign(tb, { st: 'sync', tgt: 0, aim: U.MWinit });
    const dirt = (l, x) => {
      if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n)) l.S.rt.ext[l.n] = x;
    };
    dirt(U.di.gcbOn, 1);
    dirt(U.di.gcbOff, 0);
    return '';
  }
  if (cmd === 'loadup') {
    if (tb.st !== 'sync' && tb.st !== 'load') return 'Synchronise the generator first';
    tb.st = 'load';
    tb.aim = isFinite(+arg) ? +arg : 45;
    return '';
  }
  return 'Unknown command: ' + cmd;
}
/* 3.2.0 roadmap 3: the position (0 ~ 100 %) of a valve of the DITL valve model (MOV / solenoid) by sheet ("DITL-32", an instance "DITL-32 #B",
   a template valve "DITL-38 MV-MS1391"), while the one world runs; null without it (the engine alone, the DITL state is the operator's) */
function anDitlPos(name, j) {
  try {
    if (typeof S === 'undefined' || !window.WORLD || !WORLD.live || typeof MST === 'undefined') return null;
    const C = AN_UNIT._dv || (AN_UNIT._dv = {});
    let s = C[name];
    if (!s) {
      const re = new RegExp('\\)' + name.replace(/[.*+?^${}()|[\]\\#]/g, '\\$&') + '$');
      s = S.sheets.concat(WORLD.inst || []).find(x => re.test(x.name)) || null;
      if (s) C[name] = s; /* not kept while the world has not made its machine instances yet */
    }
    if (!s || !s.nl || !(s.nl.mv || []).length) return null;
    const r = MST[s.name];
    if (!r || !r[j || 0]) return s.nl.mv[j || 0].sv && s.nl.mv[j || 0].dir === 'close' ? 100 : 0;
    return Math.max(0, Math.min(100, +r[j || 0].pos || 0));
  } catch (e) {
    return null;
  }
}
/* 3.2.0-beta.59 (#116, user 2026-10-29 "DAPAT S PLANT MODEL GALING"): the run state of a DITL motor drawing (1 RUN, 0 STOP / TRIP), or
   of one output row of a drawing of two machines ("DITL-39@3" = DEBRIS FILTER S-1502 IN OPERATION); null while the one world is not
   built. The same reading as the lamps of the Training dock and the HMI (DUI.motState of src/digital/parts/03c-read.js, dock.js mst) */
function anDitlRun(addr) {
  try {
    if (typeof S === 'undefined' || !S.sheets || !window.WORLD || !WORLD.on || !WORLD.idx || !window.DUI) return null;
    const m = /^(.*?)(?:@(\d+))?$/.exec(String(addr)),
      C = AN_UNIT._dr || (AN_UNIT._dr = {});
    let s = C[m[1]];
    if (!s) {
      s = S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(m[1])) || null;
      if (s) C[m[1]] = s;
    }
    if (!s) return null;
    if (!s.nl) s.nl = netlist(s);
    if (m[2] != null) {
      const v = DUI.outVal(s, +m[2]);
      return v == null ? null : v === 1 ? 1 : 0;
    }
    const st = DUI.motState ? DUI.motState(s) : null;
    return st == null ? null : st === 'RUN' ? 1 : 0;
  } catch (e) {
    return null;
  }
}
/* 3.2.1 (IRENE: PLANT MODEL, CIRCULATING WATER; user 2026-11-04 "OK lang nang ok kay irene ... Tapusin muna lahat"): the seawater
   system of flow diagram K1AU3-PD-020 Rev D, from the vendor data of the machines (the earlier model of beta.59 used fixed steps).
   Every number has its source; the ones with none are NO-SOURCE (docs/versions/v3.2.1/CW_PLANT_MODEL.md lists them).
   Network: forebay (LT-SW1501) -> SWP P-1501A / B / C (each: pump -> PG-SW1501x -> check valve -> discharge valve V-SW1002 / 1004 /
   1006) -> 96" header -> debris filter S-1502 -> node N -> condenser path A (inlet V-SW1007, H-1110 tubes, outlet V-SW1009) and path
   B (V-SW1008, V-SW1010) -> siphon pit -> discharge channel; node N -> 24" line -> SWBP P-1503A / B / C (suction PG-SW1503x1, discharge
   PG-SW1503x2, valve V-SW1016 / 1018 / 1020) -> debris filter S-1504 -> CCW heat exchangers H-1107A / B / C -> discharge.
   The flows are solved every step: the head of each running pump on its curve meets the losses of the lines (drop ~ flow^2).
     SWP curve        EBARA 1350VZM, K1AU3-D1-0-064 p6 "Pump characteristic curve" (doc R1306832-8902-0102), read off the graph:
                      head and pump efficiency vs capacity; shaft power p6 bottom; rated 18,900 m3/h x 28 m x 507 rpm, min flow 5,000,
                      max 22,680 m3/h (p4 data sheet R1306832-8902-0101); sp. gr. 1.02 (p4) so 1 m of seawater = 0.102 kg/cm2.
     SWP gauge        PG-SW1501 at the discharge center GL +1.8 m (p4 "DISCHARGE CENTER GL +1800"): P = 0.102 x (H - 1.8 + forebay).
     SWP motor        TECO 2050 kW 6.6 kV, D1-0-064 p26 "Starting & operating performance": load 25 / 50 / 75 / 100 / 125 % =
                      166 / 182 / 216 / 260 / 317 A (load = shaft power / 2050 kW; below 25 % the 25 ~ 50 % line, extrapolated).
                      Start: soft starter (PR-OPE-5002 2.1 "SWP soft starter"), PR-OPE-5002 "Starting Current - 500A" while it ramps.
     SWBP curve       PACO CL12151, K1AU3-D1-0-034 p8 "Pump Performance Datasheet": rated 1,000 m3/h x 15 m, 1,180 rpm, head at
                      shut-off (rated diameter) 19.9 m, efficiency 80.25 % at rated, BEP 1,129.9 m3/h, rated power 50.87 kW;
                      H = 19.9 - 4.9e-6 Q^2 (through the two points), efficiency = e x (2r - r^2), r = Q / 1,129.9, e from 80.25 %.
     SWBP motor       TECO 100 HP 460 V, D1-0-034 p10: 100 % load = 120 A, Y / delta start (LRC 685 % / 3 = 274 A);
                      PR-OPE-5002 section 5: normal 90 A, alarm 120, trip 126. Current = line through (the shaft power at the SOP point,
                      90 A) and (74.6 kW = 100 HP, 120 A).
     Debris filters   S-1502 DN2400 (O&M L18-4, Technical details): normal flow 37,800 m3/h, clean DP 500 mmH2O, backwash starts at
                      800 mmH2O (PR-OPE-5002 "Input cut in 80 mBar"), flushing period 3 min, max DP 1.0 kg/cm2; S-1504 DN600 (O&M
                      L18-5): normal flow 2,000 m3/h, clean 500, backwash 800 mmH2O. DP = clean x (flow / normal)^2 x (1 + dirt).
     Calibration      the design point = the two vendor documents that agree: 2 SWP at 18,900 m3/h = 37,800 m3/h = the S-1502 normal
     (one point)      flow; SWP discharge valves 100 %, condenser inlet 100 % / outlet 40 % (PR-OPE-5002 2.31), forebay -4 m (SOP NL):
                      PG-SW1501 = 0.102 x (28 - 1.8 - 4) = 2.26 kg/cm2 (SOP 2.2 ~ 2.4), condenser inlet water box 1.05 kg/cm2 (SOP
                      1.0 ~ 1.1), condenser drop 0.4 kg/cm2 (SOP "0.4 Kg/cm2 difference"); 2 SWBP at their SOP discharge 2.35 kg/cm2
                      (SOP 2.3 ~ 2.4) with suction = node N (SOP suction 1 ~ 1.1). The constants of the lines come from this point.
     Valves           the manual valves are field valves (no DCS signal; AN_SRC.valve, set by the field operator): loss = loss at 100 %
                      / (opening)^4, flow area = opening^2 (NO-SOURCE: no valve data in the repository); closed = no flow.
     Condenser water  in: 28.5 / 28.6 C (snapshot 30.PNG); rise = 5.6 C x (condenser steam / 316 T/H) x (31,500 T/H / seawater flow)
                      (condenser design specification, K1AU3-D1-0-039 R0 p7: tube side 30 -> 35.6 C at 31,500 T/H, shell 316.024 T/H);
                      condenser steam = main steam x 316 / 460 (FHI MCR 460 T/H) + LP bypass.
   The forebay is the SOP normal level -4 m (live test beta.74 #36). UNUSUAL (in the report): the alarm list H of LT-SW1501 is -6.0 m. */
const AN_SW = {
  swp: ['M.3353', 'M.3354', 'M.3355'],
  swbp: ['DITL-30', 'DITL-30 #B', 'DITL-30 #C'],
  df: ['DITL-39@3', 'DITL-39@14'],
  /* SWP curve D1-0-064 p6 (m3/h, m, %, kW) */
  cQ: [0, 2500, 5000, 7500, 10000, 12500, 15000, 17500, 18900, 20000, 21000, 22000, 22680],
  cH: [47.0, 43.1, 39.9, 37.5, 35.5, 33.6, 31.7, 29.5, 28.0, 26.6, 25.4, 23.9, 22.6],
  pQ: [0, 5000, 10000, 15000, 18900, 22680],
  pP: [1720, 1630, 1620, 1650, 1700, 1690],
  Qr: 18900,
  Qmin: 5000,
  Qmax: 22680,
  zD: 1.8,
  kP: 0.102 /* kg/cm2 per m of seawater, sp. gr. 1.02 */,
  mL: [0, 25, 50, 75, 100, 125],
  mI: [150, 166, 182, 216, 260, 317] /* 0 % = the 25 ~ 50 % line extrapolated */,
  mkW: 2050,
  Ist: 500,
  /* SWBP D1-0-034 p8 / p10 */
  bH0: 19.9,
  bA: 4.9e-6,
  bQr: 1000,
  bBep: 1129.9,
  bEff: 0.8025,
  bkW: 74.6,
  bI100: 120,
  bIsop: 90,
  bIst: 274,
  /* debris filters (L18-4 / L18-5) */
  f1Q: 37800,
  f2Q: 2000,
  dp0: 500,
  dpBw: 800,
  bwT: 180,
  dirtBw: 0.6 /* (800 / 500) - 1 */,
  dirtT: 4 * 3600 /* NO-SOURCE: 4 h at the normal flow from clean to the backwash point */,
  /* design point (calibration) */
  dQ: 18900,
  dL: -4,
  dPci: 1.05,
  dPdc: 0.4,
  dPbd: 2.35,
  hv100: 0.3 /* m, NO-SOURCE: loss of the open discharge / check valve at 18,900 m3/h */,
  ki100: 0.02 /* kg/cm2, NO-SOURCE: loss of the open condenser inlet valve at the design path flow */,
  hb100: 0.3 /* m, NO-SOURCE: loss of the open SWBP discharge valve at 1,000 m3/h */,
  oDes: 40 /* condenser outlet opening of the design point (SOP 2.31) */,
  Tin: [28.5, 28.6],
  rise0: 5.6,
  cTH: 31500,
  cSt: 316.024,
  mcr: 460,
  ramp: 10 /* s, NO-SOURCE: soft starter ramp of the SWP */,
  bRamp: 5 /* s, NO-SOURCE: Y / delta change-over of the SWBP */,
  tauP: 2,
  tauT: 60,
  tauI: 1
};
const swInterp = (X, Y, x) => {
  if (x <= X[0]) return Y[0] + ((Y[1] - Y[0]) * (x - X[0])) / (X[1] - X[0]);
  for (let i = 1; i < X.length; i++) if (x <= X[i]) return Y[i - 1] + ((Y[i] - Y[i - 1]) * (x - X[i - 1])) / (X[i] - X[i - 1]);
  const n = X.length - 1;
  return Y[n] + ((Y[n] - Y[n - 1]) * (x - X[n])) / (X[n] - X[n - 1]);
};
/* the head of a pump at speed s (affinity: H(Q, s) = s^2 H(Q / s)) */
const swH = (Q, s) => (s > 0 ? s * s * swInterp(AN_SW.cQ, AN_SW.cH, Q / s) : 0);
const swbH = (Q, s) => (s > 0 ? s * s * AN_SW.bH0 - AN_SW.bA * Q * Q : 0);
/* the flow of a pump when the line after it is at head h: pump head - valve loss = h (0 if the pump cannot reach h: check valve) */
function swPumpQ(fH, s, kv, h, qMax) {
  if (!(s > 0) || !(kv < Infinity)) return 0;
  const f = q => fH(q, s) - kv * q * q - h;
  if (f(0) <= 0) return 0;
  let a = 0,
    b = qMax * Math.max(s, 0.05);
  if (f(b) > 0) return b;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    if (f(m) > 0) a = m;
    else b = m;
  }
  return (a + b) / 2;
}
const swBisect = (f, a, b, n) => {
  for (let i = 0; i < (n || 40); i++) {
    const m = (a + b) / 2;
    if (f(m) > 0) a = m;
    else b = m;
  }
  return (a + b) / 2;
};
/* valve: opening 0 ~ 100 % -> multiplier of its loss at 100 % (Infinity = closed); flow area = opening^2 (a butterfly valve opens
   little area at a small opening; NO-SOURCE: no valve curve in the repository) */
const swVk = pct => (pct > 0.5 ? 1 / Math.pow(Math.min(100, pct) / 100, 4) : Infinity);
/* the line constants from the design point (once) */
/* SWBP efficiency: a plain function, a function kept in K.c does not cross the Worker snapshot (Mina beta.103, c.eb is not a function) */
const swEb = (K, r) => (K.bEff / (2 * (K.bQr / K.bBep) - Math.pow(K.bQr / K.bBep, 2))) * Math.max(0, 2 * r - r * r);
function swCal() {
  const K = AN_SW;
  if (K.c) return K.c;
  const c = {};
  c.kv = K.hv100 / (K.dQ * K.dQ); /* m per (m3/h)^2, SWP valve open */
  /* SWBP at the SOP discharge 2.35 with suction = node N */
  const PN = K.dPci + K.ki100,
    hb = (K.dPbd - PN) / K.kP,
    qb = Math.sqrt((K.bH0 - hb) / K.bA);
  c.kbv = K.hb100 / (K.bQr * K.bQr);
  c.qbD = qb;
  const Pbv = K.dPbd - K.kP * c.kbv * qb * qb;
  c.kb = Pbv / Math.pow(2 * qb, 2); /* kg/cm2 per (m3/h)^2: S-1504, CCW HX and the return of the 2 SWBP */
  const Qt = 2 * K.dQ,
    q = (Qt - 2 * qb) / 2; /* per condenser path */
  c.qcD = q;
  c.ki = K.ki100 / (q * q);
  c.kc = K.dPdc / (q * q);
  c.ko = (K.dPci - K.dPdc) / (q * q) / swVk(K.oDes); /* outlet loss at 100 % open */
  const Ph = K.kP * (K.dQ ? swH(K.dQ, 1) - c.kv * K.dQ * K.dQ - K.zD + K.dL : 0),
    dpF = (K.dp0 * Math.pow(Qt / K.f1Q, 2)) / 1e4;
  c.kup = (Ph - dpF - PN) / (Qt * Qt); /* header -> node N (pipes, NO-SOURCE elevation lumped in) */
  /* SWBP shaft power at the SOP point (for its current line) */
  const eb = r => swEb(K, r);
  c.bPsop = (1020 * 9.80665 * (qb / 3600) * hb) / 1000 / Math.max(0.25, eb(qb / K.bBep));
  return (K.c = c);
}
/* the SWBP branch: the flows of the running booster pumps with node N at PN */
function swBooster(PN, sb, vb, c) {
  const K = AN_SW;
  const each = Pbv => sb.map((s, i) => swPumpQ(swbH, s, c.kbv * swVk(vb[i]), (Pbv - PN) / K.kP, 2.5 * K.bQr));
  if (!sb.some(s => s > 0) || PN <= 0) return { q: sb.map(() => 0), Q: 0, Pbv: 0 };
  const Q = swBisect(x => each(c.kb * x * x).reduce((a, b) => a + b, 0) - x, 0, 3 * 2.5 * K.bQr, 40);
  return { q: each(c.kb * Q * Q), Q, Pbv: c.kb * Q * Q };
}
/* the whole network for the speeds, the valve openings, the forebay and the dirt of S-1502 */
function swSolve(st) {
  const K = AN_SW,
    c = swCal(),
    kv = st.vd.map(p => c.kv * swVk(p)),
    pathK = [0, 1].map(j => {
      const ki = c.ki * swVk(st.vi[j]),
        ko = c.ko * swVk(st.vo[j]);
      return { ki, ko, k: ki + c.kc + ko };
    });
  const supplyAt = h => st.s.map((s, i) => swPumpQ(swH, s, kv[i], h, 1.6 * K.Qr));
  const dpF = Q => (K.dp0 * Math.pow(Q / K.f1Q, 2) * (1 + st.dirt)) / 1e4;
  const r = { q: [0, 0, 0], H: [0, 0, 0], Qt: 0, Qc: [0, 0], b: { q: [0, 0, 0], Q: 0, Pbv: 0 }, Ph: 0, PN: 0 };
  if (!st.s.some(s => s > 0)) return r;
  const solveAt = Qt => {
    /* the header head that gives this total from the pumps */
    const Hh = swBisect(h => supplyAt(h).reduce((a, b) => a + b, 0) - Qt, -200, 80, 40);
    const Ph = K.kP * (Hh - K.zD + st.L),
      PN = Ph - dpF(Qt) - c.kup * Qt * Qt;
    const qc = pathK.map(p => (PN > 0 && p.k < Infinity ? Math.sqrt(PN / p.k) : 0)),
      b = swBooster(PN, st.sb, st.vb, c);
    return { Hh, Ph, PN, qc, b, dem: qc[0] + qc[1] + b.Q };
  };
  const qMax = supplyAt(-200).reduce((a, b) => a + b, 0);
  const Qt = swBisect(Q => solveAt(Q).dem - Q, 0, qMax, 36),
    z = solveAt(Qt);
  r.Qt = Qt;
  r.q = supplyAt(z.Hh);
  r.H = r.q.map((q, i) => (st.s[i] > 0 ? swH(q, st.s[i]) : 0));
  r.Ph = z.Ph;
  r.PN = z.PN;
  r.Qc = z.qc;
  r.b = z.b;
  r.pin = z.qc.map((q, j) => Math.max(0, z.PN - pathK[j].ki * q * q));
  r.pout = z.qc.map((q, j) => (pathK[j].ko < Infinity ? pathK[j].ko * q * q : Math.max(0, z.PN - pathK[j].ki * q * q)));
  r.dpF = dpF(Qt);
  return r;
}
/* the field valves of the seawater system (no DCS signal): opening in %, set by the field operator; the normal line-up of a
   running unit (PR-OPE-5002 section 2 / 5 after the start: discharge valves open, condenser inlet 100 %, outlet 40 %) */
/* 3.2.1 (IRENE: PLANT MODEL, user 2026-11-04 "Kung ano lng ang mapapakinabangan ntn s simulation"): the useful manual valves of the
   closed cooling, make-up and air systems (field valves, no DCS signal; opening in %, normal line-up at 150 MW):
     closed cooling (PD-021 Rev D, hmi-cw.js): ACWP suction V-CW1002 / 1004, discharge V-CW1007 / 1009 (SOP: 5 % at start, then open to
       PG-CW1108 7 kg/cm2), CCWHE H-1107A / B / C inlet V-CW1010 / 1011 / 1012, outlet V-CW1013 / 1014 / 1015 (2 of 3 in service, MB-021:
       2 x 750 T/H; C standby = closed, NO-SOURCE which one stands by);
     make-up (PD-024 Rev D): demi tank outlets V-MU0001 / 0002, MWP suction V-MU0003 / 4 / 5, discharge V-MU0007 / 9 / 11, recirculation
       V-MU0013 / 15 / 17 (SOP: OPEN);
     air (PD-023 Rev C): unit 1 header isolation V-IA1101 (IA) / V-PA1087 (PA), cross-tie PA -> IA tanks V-PA0013 (normally closed). */
const AN_FV0 = {
  /* the water side of the feedwater heaters (PD-017, team-files/plant-study/11-heater-valves.md): manual gear valves, no DCS signal */
  'V-FW1009': 100, 'V-FW1010': 100, 'V-FW1011': 0, 'V-FW1012': 100, 'V-FW1013': 100, 'V-FW1014': 0,
  'V-CD1026': 100, 'V-CD1027': 100, 'V-CD1028': 0, 'V-CD1029': 100, 'V-CD1030': 100, 'V-CD1031': 0,
  'V-CW1002': 100, 'V-CW1004': 100, 'V-CW1007': 100, 'V-CW1009': 100,
  'V-CW1010': 100, 'V-CW1011': 100, 'V-CW1012': 0, 'V-CW1013': 100, 'V-CW1014': 100, 'V-CW1015': 0,
  'V-MU0001': 100, 'V-MU0002': 100, 'V-MU0003': 100, 'V-MU0004': 100, 'V-MU0005': 100,
  'V-MU0007': 100, 'V-MU0009': 100, 'V-MU0011': 100, 'V-MU0013': 100, 'V-MU0015': 100, 'V-MU0017': 100,
  /* the line to T-1109 MU-1-021 (PD-024): V-MU1031, XV-MU1109 with its bypass V-MU1033, V-MU1032. PR-OPE-5002 section 7 "Ensure Expansion
     tank inlet valve is open (V-MU1031 and V-MU1032)". XV-MU1109 is spring opening: with no instrument air these are the only way to stop the fill (Mina F33) */
  'V-MU1031': 100, 'V-MU1032': 100,
  'V-IA1101': 100, 'V-PA1087': 100, 'V-PA0013': 0,
  /* 3.2.1 (IRENE: FEEDWATER): the BFWP suction manual valves, PR-OPE-5002 19.16 "Fully OPEN BFPs suction (V-FW1002/V-FW1001) ...
     Check if the limit switch is touched" (IO list STN102 I.028F ZSO-FW1031 BFWP-A / I.032F ZSO-FW1032 BFWP-B suction manual valve
     open; V-FW1001 = A, V-FW1002 = B by the number order of the discharge MOVs MV-FW1001 A / MV-FW1002 B). Normal line-up: both open
     (the standby pump lined up for its auto start) */
  'V-FW1001': 100, 'V-FW1002': 100
};
/* the water of a heater: inlet, outlet, bypass openings (%) -> share through the tubes (s) and whether the line passes at all (p).
   The split between the tubes and the bypass by opening: bypass hydraulics NO-SOURCE */
function anHtrPath(i, o, b) {
  const th = p => Math.max(0, Math.min(1, p / 20)),
    w = Math.min(th(i), th(o)),
    y = th(b);
  return { s: w + y > 0 ? w / (w + y) : 1, p: Math.min(1, w + y) };
}
/* the opening of a field valve (0 ~ 100 %), the normal line-up while the field operator has not turned it */
const anFv = tag => {
  const V = (typeof AN_SRC !== 'undefined' && AN_SRC.valve) || {};
  return isFinite(V[tag]) ? V[tag] : tag in AN_FV0 ? AN_FV0[tag] : AN_SW_V0[tag];
};
const AN_SW_V0 = { 'V-SW1002': 100, 'V-SW1004': 100, 'V-SW1006': 100, 'V-SW1007': 100, 'V-SW1008': 100, 'V-SW1009': 40, 'V-SW1010': 40, 'V-SW1016': 100, 'V-SW1018': 100, 'V-SW1020': 100 };
function anSeawaterStep(U, dt) {
  const K = AN_SW,
    c = swCal(),
    V = (AN_SRC.valve = AN_SRC.valve || Object.assign({}, AN_SW_V0)),
    vp = k => (isFinite(V[k]) ? V[k] : AN_SW_V0[k]),
    lag = (k, x, tau) => (U[k] = isFinite(U[k]) ? U[k] + ((x - U[k]) * Math.min(dt, tau)) / tau : x),
    sw = K.swp.map(a => srcBit([a])),
    bp = K.swbp.map(a => anDitlRun(a) || 0),
    df = K.df.map(a => {
      const r = anDitlRun(a);
      return r == null ? 1 : r;
    });
  /* the speed of each pump: a start ramps it (soft starter / Y-delta), a stop drops it at once (coast-down not modelled); the first
     step after a starting state takes the running pumps at full speed (no start transient at 150 MW) */
  const first = !U.swSpd;
  U.swSpd = U.swSpd || [0, 0, 0];
  U.swbSpd = U.swbSpd || [0, 0, 0];
  sw.forEach((r, i) => (U.swSpd[i] = r ? (first ? 1 : Math.min(1, U.swSpd[i] + dt / K.ramp)) : 0));
  bp.forEach((r, i) => (U.swbSpd[i] = r ? (first ? 1 : Math.min(1, U.swbSpd[i] + dt / K.bRamp)) : 0));
  U.swN = sw.reduce((a, b) => a + b, 0);
  U.swNb = bp.reduce((a, b) => a + b, 0);
  /* live test beta.74 #36: the forebay at the SOP normal level, PR-OPE-5002 section 2 "Sea Water inlet pool (fore bay) level (NL = 4m
     below GL)" */
  U.swLvl = K.dL;
  if (!isFinite(U.swDirt1)) U.swDirt1 = 0;
  if (!isFinite(U.swDirt2)) U.swDirt2 = 0;
  const st = {
    s: U.swSpd,
    sb: U.swbSpd,
    vd: ['V-SW1002', 'V-SW1004', 'V-SW1006'].map(vp),
    vi: ['V-SW1007', 'V-SW1008'].map(vp),
    vo: ['V-SW1009', 'V-SW1010'].map(vp),
    vb: ['V-SW1016', 'V-SW1018', 'V-SW1020'].map(vp),
    L: U.swLvl,
    dirt: U.swDirt1
  };
  /* the network is solved again only when a speed, a valve, the forebay or the dirt (0.01) changed */
  const key = [st.s.map(x => x.toFixed(3)), st.sb.map(x => x.toFixed(3)), st.vd, st.vi, st.vo, st.vb, st.L, st.dirt.toFixed(2)].join('|');
  if (!U._swR || U._swK !== key) {
    U._swR = swSolve(st);
    U._swK = key;
  }
  const r = U._swR;
  U.swRunout = r.q.map(q => (q > K.Qmax ? 1 : 0)) /* above the max flow of the curve (22,680 m3/h): the curve is extrapolated */;
  /* flows (m3/h), for the HMI and the loop check */
  r.q.forEach((q, i) => (U['swQa' + i] = Math.round(q)));
  r.b.q.forEach((q, i) => (U['swQb' + i] = Math.round(q)));
  U.swQt = Math.round(r.Qt);
  U.swQcA = Math.round(r.Qc[0]);
  U.swQcB = Math.round(r.Qc[1]);
  U.swQc = U.swQcA + U.swQcB;
  U.swQbT = Math.round(r.b.Q);
  /* condenser water boxes (PT-SW1110-A1 / B1 in, A2 / B2 out) */
  const pin = r.pin || [0, 0],
    pout = r.pout || [0, 0];
  lag('swPiA', pin[0], K.tauP);
  lag('swPiB', pin[1], K.tauP);
  lag('swPoA', pout[0], K.tauP);
  lag('swPoB', pout[1], K.tauP);
  /* condenser seawater temperatures */
  U.swTiA = K.Tin[0];
  U.swTiB = K.Tin[1];
  const ws = Math.max(0, ((U.ms || 0) * K.cSt) / K.mcr + (U.qlp || 0) + (U.xtra || 0));
  const thC = (r.Qc[0] + r.Qc[1]) * 1.02; /* T/H through the condenser: the design rise is per condenser */
  [0, 1].forEach(j => {
    /* one box shut: its share of the heat goes to the other box (heat = water x rise) */
    const rise = r.Qc[j] * 1.02 > 100 ? K.rise0 * (ws / K.cSt) * (K.cTH / thC) : 0;
    lag(j ? 'swToB' : 'swToA', K.Tin[j] + Math.min(rise, 40), K.tauT);
  });
  /* PG-SW1501A / B / C: the pump side of the check valve (a stopped pump: the water column of the pit, below the gauge = 0) */
  r.q.forEach((q, i) => lag('swPd' + i, U.swSpd[i] > 0 ? Math.max(0, K.kP * (r.H[i] - K.zD + U.swLvl)) : 0, K.tauP));
  /* shut-off time of a running SWP below its min flow (EBARA O&M 4.2 / 4.4: open the discharge valve within 2 minutes) */
  U.swLow = U.swLow || [0, 0, 0];
  r.q.forEach((q, i) => (U.swLow[i] = U.swSpd[i] >= 1 && q < K.Qmin ? U.swLow[i] + dt : 0));
  /* debris filters: DP (mmH2O); the dirt grows while water passes; a filter IN OPERATION (DITL-39) backwashes at 800 for 3 min */
  [
    [1, r.Qt / K.f1Q, df[0]],
    [2, r.b.Q / K.f2Q, df[1]]
  ].forEach(([i, q, op]) => {
    const d = 'swDirt' + i,
      b = 'swBw' + i;
    if (U[b] > 0) {
      U[b] = Math.max(0, U[b] - dt);
      U[d] = Math.max(0, U[d] - (K.dirtBw * dt) / K.bwT);
    } else U[d] += (K.dirtBw * q * q * dt) / K.dirtT;
    const dp = K.dp0 * q * q * (1 + U[d]);
    if (op && dp >= K.dpBw && !(U[b] > 0)) U[b] = K.bwT;
    lag('swDp' + i, dp, K.tauP);
  });
  /* SWP motor current: 500 A while the soft starter ramps, then the load of the shaft power (motor table) */
  r.q.forEach((q, i) => {
    const s = U.swSpd[i];
    const P = s > 0 ? swInterp(K.pQ, K.pP, q / s) * s * s * s : 0;
    U['swKw' + i] = Math.round(P);
    /* Mina F15: an open breaker carries no current: stopped = 0 at once, the lag is for the start only */
    if (s <= 0) U['swIa' + i] = 0;
    else lag('swIa' + i, s < 1 ? K.Ist : swInterp(K.mL, K.mI, (100 * P) / K.mkW), K.tauI);
  });
  /* SWBP: suction (PG-SW1503x1) = node N, discharge (PG-SW1503x2) before its valve; current from its shaft power */
  r.b.q.forEach((q, i) => {
    const s = U.swbSpd[i],
      PN = Math.max(0, r.PN || 0);
    lag('swBs' + i, PN, K.tauP);
    lag('swBd' + i, s > 0 && PN > 0 ? PN + K.kP * swbH(q, s) : PN, K.tauP);
    const Pw = s > 0 ? Math.max(0.4 * 50.87, (1020 * 9.80665 * (q / 3600) * swbH(q, s)) / 1000 / Math.max(0.25, swEb(K, q / K.bBep))) : 0; /* floor 40 % of the rated 50.87 kW at low flow: NO-SOURCE */
    const I = K.bIsop + ((K.bI100 - K.bIsop) * (Pw - c.bPsop)) / (K.bkW - c.bPsop);
    if (s <= 0) U['swIb' + i] = 0;
    else lag('swIb' + i, s < 1 ? K.bIst : Math.max(0, I), K.tauI);
  });
}
/* the field operator sets a manual valve of the seawater system (V-SW1002 ... 0 ~ 100 %); returns false for an unknown tag */
function anSwValve(tag, pct) {
  if (!(tag in AN_SW_V0) && !(tag in AN_FV0)) return false;
  AN_SRC.valve = AN_SRC.valve || Object.assign({}, AN_SW_V0);
  AN_SRC.valve[tag] = Math.max(0, Math.min(100, +pct || 0));
  return true;
}
/* 3.2.1 (IRENE: PLANT MODEL, MAKE-UP WATER; user 2026-11-04 "tama connection, flow, at plant model, at dapat may communication sya sa
   logic na ABC DITL"; replaces the fixed steps of 3.2.0-beta.63). Flow diagram K1AU3-PD-024 Rev D (+ expansion tank of PD-021 Rev D):
   demi water tanks T-0708A / B -> suction header -> MWP P-0709A / B / C (DITL-112, machine instances #B / #C) -> common header
   (PT-MU0709) -> #1 condenser hotwell (LCV-MU1110 ABC-031 / MV-MU1001 DITL-60), expansion tank T-1109 (XV-MU1109 DITL-78 / bypass
   V-MU1033), each pump's recirculation line (SOP: V-MU0013 / 15 / 17 OPEN). Sources (docs/versions/v3.2.1/MU_CCW_PLANT_MODEL.md):
     pump curve   KAO HONG KEW-65/200 performance curve KEW102066C (K1AU3-D1-0-032 p6): rated 80 m3/h (1.34 CMM) x 60 m x 3500 rpm,
                  the head curve through the rated point (shut-off 65 m), MIN.FLOW 0.167 CMM = 10 m3/h; shaft power = the mean of the
                  170 / 192 mm BHP curves (the rated impeller lies between them: shut-off head 65 m between 57.5 and 72.2 m);
     motor        TECO AEHLWA-R 50 HP 2P 460 V (p8: FLC 58.2 A, LRC 775 % = 451 A, direct on line or Y / delta; p11 load characteristic:
                  18.6 / 32.8 / 44.7 / 58.0 / 70.1 A at 26.4 / 51.7 / 76.6 / 101.5 / 126.6 % load);
     header       PT-MU0709 = 0.1 kg/cm2 per m (water, sg 1.0, p6) x (tank level + z + pump head at the flow of each running pump);
                  z = 11.3 m CALIBRATED on the HMI snapshot 28.png (2 MWP running at their recirculation flow, levels 13.8 / 13.7 m,
                  PIMU0709 9.0 kg/cm2): 90 - 13.8 - 64.9 m (the heights of the tanks and of the transmitter are not in the repository);
     flow         FT-MU1001 = the hotwell make-up of the cycle model (plant.js 1.8 T/H per % of LCV-MU1110) + the expansion tank filling;
                  each running MWP also returns its recirculation 10 m3/h (p6 MIN.FLOW) to the tank;
     strainer DP  0.03 kg/cm2 while its pump runs (28.png DPIMU0709A / B / C 0.029 / 0.042 / 0.001; no strainer curve: NO-SOURCE shape);
     demi tanks   the snapshot level, constant (the water treatment refills them; not modelled); LS-MU0708-A / B (alarm list 0.2 m,
                  DITL-112 rows 19 / 21) follow it (plantsw.js);
     expansion tank (as 3.2.0-beta.63 / live test #50) fills while XV-MU1109 (DITL-78 row 4) or V-MU1033 is open and the header is above
                  6 kg/cm2 (SOP 7) at 0.003 m/s (NO-SOURCE), primes the closed loop at the first opening of V-CW1001 (NO-SOURCE volume).
   Logic: DITL-112 START / trip of each MWP drives the pumps here; PT-MU0709 (< 5.5 kg/cm2 = M.2506 L.L. = standby AUTO start),
   LT-MU0708-A / B (< 0.2 m), DPT-MU0709-A / B / C (>= 1.0 kg/cm2) go back into DITL-112, LT-CW1109 into DITL-76 / 77 / 78. */
const AN_MU = {
  mwp: ['DITL-112', 'DITL-112 #B', 'DITL-112 #C'],
  xv: 'DITL-78@3',
  mv: 'DITL-60',
  lv: [13.8, 13.7],
  cQ: [0, 30, 60, 80.4, 90, 105, 120, 135, 150],
  cH: [65.0, 64.7, 63.2, 60.3, 58.8, 55.5, 52.1, 47.5, 43.5],
  pQ: [0, 30, 60, 80.4, 90, 120, 150],
  pHP: [18.9, 22.7, 27.0, 29.6, 31.6, 35.4, 37.0],
  qRec: 10,
  /* UNUSUAL (docs/versions/v3.2.1/DATA_ANSWERS.md item 6): the vendor BHP curve gives ~26 A at the recirculation flow, the snapshot
     28.png reads MWP-A 20.5 / MWP-C 20.8 A (SOP 20 A); CLAUDE.md: the snapshot is the operating point, so the shaft power is scaled */
  pCal: 0.74,
  mL: [26.4, 51.7, 76.6, 101.5, 126.6],
  mI: [18.6, 32.8, 44.7, 58.0, 70.1],
  mkW: 37.3 /* 50 HP */,
  Ist: 451,
  ramp: 2 /* s, direct on line (NO-SOURCE time) */,
  kP: 0.1,
  z: 11.3,
  dp: 0.03,
  et0: 0.8,
  etMax: 2.0,
  etRate: 0.003,
  etQ: 20 /* T/H, Mass Balance K1AU3-MB-024 item 17 and MB-021 item 1 (make-up to the unit 1 expansion tank) */,
  etPrime: 0.4 /* m of tank level that the priming of the closed loop takes (NO-SOURCE) */,
  etPrimeT: 120 /* s (NO-SOURCE) */,
  etH: 1.7,
  etL: 0.8,
  etLL: 0.3,
  tauP: 3,
  tauH: 1 /* s, the header pressure: a full water line answers at once (NO-SOURCE number). DITL-112 gives the first pump only TR25 3 s to clear M.2506 before the AUTO pumps start (Mina F21) */,
  tauI: 2
};
function anMakeupStep(U, dt) {
  const K = AN_MU,
    lag = (k, x, tau) => (U[k] = isFinite(U[k]) ? U[k] + ((x - U[k]) * Math.min(dt, tau)) / tau : x),
    run = K.mwp.map(a => anDitlRun(a) || 0),
    n = run.reduce((a, b) => a + b, 0);
  const first = !U.muSpd;
  U.muSpd = U.muSpd || [0, 0, 0];
  run.forEach((r, i) => (U.muSpd[i] = r ? (first ? 1 : Math.min(1, U.muSpd[i] + dt / K.ramp)) : 0));
  U.muN = n;
  U.muLvA = K.lv[0];
  U.muLvB = K.lv[1];
  /* 3.2.1 the valve itself (the DITL-78 machine), not only its command: XV-MU1109 is spring opening (AN_AV), it opens without air */
  const xp = anDitlPos('DITL-78', 0);
  U.muXv = xp != null ? (xp > 0 ? 1 : 0) : anDitlRun(K.xv) === 1 ? 1 : 0;
  const mv = anDitlPos(K.mv);
  U.muMv = mv == null ? null : mv;
  if (!isFinite(U.etLvl)) U.etLvl = K.et0;
  /* live test 2026-10-30 #23: or through the bypass V-MU1033 (manual, field operator; PR-OPE-5002 section 7 "XV-MU1109 ... or Bypass valve V-MU1033") */
  U.muByp = typeof AN_SRC !== 'undefined' && AN_SRC.field && AN_SRC.field.mu1033 ? 1 : 0;
  /* the flow out of the header: the hotwell make-up and the expansion tank filling (the header pressure of the step before decides
     whether the tank fills), plus the recirculation of each running pump */
  U.muLine = anFv('V-MU1031') > 0 && anFv('V-MU1032') > 0 ? 1 : 0;
  const fill = U.muLine && (U.muXv || U.muByp) && U.muP > 6 && U.etLvl < K.etMax;
  U.muFill = fill ? 1 : 0;
  /* 3.2.1 the field valves (AN_FV0): a pump has water when a demi tank outlet (V-MU0001 / 0002) and its suction (V-MU0003 / 4 / 5) are
     open; it feeds the header through its discharge (V-MU0007 / 9 / 11) and returns its recirculation through V-MU0013 / 15 / 17; a
     running pump with no water or with both closed = no flow (shut-off power); no pump feeding = the header at its static pressure */
  const op = t => anFv(t) > 0,
    tk = op('V-MU0001') || op('V-MU0002'),
    wet = [0, 1, 2].map(i => tk && op('V-MU000' + (3 + i))),
    dis = [0, 1, 2].map(i => op('V-MU' + String(7 + 2 * i).padStart(4, '0'))),
    rec = [0, 1, 2].map(i => op('V-MU00' + (13 + 2 * i))),
    feed = U.muSpd.map((s, i) => (s > 0 && wet[i] && dis[i] ? s : 0)),
    ss = feed.reduce((a, b) => a + b, 0),
    hw = typeof AN_CYC !== 'undefined' ? Math.max(0, 1.8 * (AN_CYC.u.hw || 0)) : 0,
    qOut = ss > 0 ? hw + (fill ? K.etQ : 0) : 0,
    lv = Math.max(K.lv[0], K.lv[1]);
  /* the feeding pumps share the flow by speed (identical pumps in parallel), each with its recirculation */
  let H = 0;
  U.muQ = [0, 0, 0];
  U.muSpd.forEach((s, i) => {
    if (s > 0 && wet[i]) U.muQ[i] = (ss > 0 && feed[i] ? (qOut * s) / ss : 0) + (rec[i] ? K.qRec * s : 0);
  });
  if (ss > 0) {
    const j = feed.findIndex(s => s > 0),
      s = feed[j];
    H = s * s * swInterp(K.cQ, K.cH, U.muQ[j] / s);
  }
  U.muFeed = feed.filter(s => s > 0).length;
  lag('muP', K.kP * (lv + K.z + Math.max(0, H)), K.tauH);
  run.forEach((r, i) => {
    const s = U.muSpd[i],
      P = s > 0 ? K.pCal * 0.7457 * swInterp(K.pQ, K.pHP, U.muQ[i] / s) * s * s * s : 0;
    U['muKw' + i] = Math.round(P * 10) / 10;
    if (s <= 0) U['muI' + i] = 0;
    else lag('muI' + i, s < 1 ? K.Ist : Math.max(0, swInterp(K.mL, K.mI, (100 * P) / K.mkW)), K.tauI);
    lag('muDp' + i, r && wet[i] ? K.dp : 0, K.tauP);
  });
  if (fill) U.etLvl = Math.min(K.etMax, U.etLvl + K.etRate * dt);
  /* live test #50: PR-OPE-5002 7.20 "Open Expansion tank outlet valve to prime the close cooling line (V-CW1001)" and 7.22 "Ensure
     Expansion tank is at NL = 1.7m and make up if necessary": the first opening of V-CW1001 after a cold plant fills the closed loop
     from the tank (K.etPrime m of tank level over K.etPrimeT s, NO-SOURCE: the loop volume is not in the repository); then the level stays */
  if (!isFinite(U.cwPrime)) U.cwPrime = AN_SRC.field.cw1001 ? 1 : 0;
  if (AN_SRC.field.cw1001 && U.cwPrime < 1) {
    const d = Math.min(1 - U.cwPrime, dt / K.etPrimeT);
    U.cwPrime += d;
    U.etLvl = Math.max(0, U.etLvl - K.etPrime * d);
  }
  U.etPct = (100 * U.etLvl) / K.etMax;
  /* live test #50: the alarms of LT-CW1109 (alarm list LT: H 1700 mm (DCS), L 800 mm (DCS); LS: LSLL-CW1109 300 mm = DITL-77 row 26
     M.1238 "EXPANSION TANK LEVEL < 0.3 M", the ACWP trip). UNUSUAL: the H alarm is the normal level NL 1.7 m of the SOP */
  U.etAlm = U.etLvl <= K.etLL ? 'LL' : U.etLvl <= K.etL ? 'L' : U.etLvl > K.etH ? 'H' : '';
  lag('muF', qOut, K.tauP);
}
/* 3.2.1 (IRENE: PLANT MODEL, CLOSED COOLING WATER; replaces the fixed steps of 3.2.0-beta.69). Flow diagram K1AU3-PD-021 Rev D: return
   header CW-1-002 20" + expansion tank T-1109 (V-CW1001) -> suction CW-1-003 20" -> ACWP P-1108A / B (DITL-76 / 77; strainers
   DPT-CW1108-A / B) -> common discharge CW-1-007 20" (PT / TT-CW1152) -> CCWHE H-1107A / B / C (seawater of the SWBP, unit.js AN_SW) ->
   supply CW-1-014 20" (PT / TT-CW1153) -> the users (turbine oil coolers TCV-CW1201, generator air coolers, BFP, bottom ash screw
   coolers L-1060A ~ D PT / TT-CW1156 and TT-CW1060, fans, APH, air compressors and dryers, sampling) -> return. Sources
   (docs/versions/v3.2.1/MU_CCW_PLANT_MODEL.md):
     pump curve   PACO KP1415-1/2 "Pump Performance Datasheet" (K1AU3-D1-0-033 p8): rated 1500 m3/h x 50 m x 1750 rpm, impeller
                  377.44 mm curve (shut-off 67.8 m), shaft power curve (250 kW rated), MCSF 932.4 m3/h, water 991 kg/m3;
     motor        TECO AFJH-WR 300 kW 4P 6600 V (p10): FLC 32.1 A, eff 95.0 %, PF 86.0 %, soft start, LRC <= 240 A; current =
                  shaft power / (1.732 x 6.6 kV x eff x PF);
     line         ONE design point = HMI snapshot 27.PNG (148 MW, ACWP-A): PICW1152 6.4, PICW1153 5.2 kg/cm2, expansion tank 0.80 m, at
                  the rated 1500 m3/h (= 2 CCWHE x 750 m3/h of D1-0-041; the ACWP current there, 26.8 A, is the snapshot's 28.2 A
                  within 5 %): suction static = 6.4 - 4.955 = 1.445 kg/cm2 (tank level + its height, CALIBRATED: the height is not in
                  the repository), CCWHE + its piping 1.2 kg/cm2 at 1500 m3/h (of it the CCWHE 0.571 = 0.056 MPa of D1-0-041), the
                  users 3.755 kg/cm2 at 1500 m3/h; both as loss = k Q^2; two pumps in parallel share the flow;
     strainer DP  0.27 kg/cm2 at 1500 m3/h (27.PNG), x (Q / 1500)^2;
     CCWHE        Hisaka (D1-0-041) per unit: ACW 750 m3/h 50 -> 34 C, seawater 1000 m3/h 30 -> 42.12 C, 13,830 kW, counter flow,
                  357.5 m2: clean UA = 13830 / LMTD 5.72 = 2418 kW/K. 2 of the 3 in service (NO-SOURCE: the design flow 1500 = 2 x
                  750). The UA in service is CALIBRATED on 27.PNG (return 40 C, supply 38 C at 1500 m3/h = 3,452 kW, seawater
                  28.5 C, 2 SWBP): 7.2 % of the clean UA (UNUSUAL: fouled plates, or the snapshot heat load is not the design one);
                  effectiveness-NTU, counter flow, with the seawater of the running SWBP (U.swQbT) shared by the units in service;
     heat load    3,480 kW x (0.4 + 0.6 x load / 150 MW) (27.PNG 3,452 kW at 148 MW; the split ASSUMED as 3.2.0-beta.69);
     temperature  one node for the water of the loop, 180,000 kJ/K (about 43 m3, NO-SOURCE: the loop volume is not in the repository;
                  10 min to settle at full load, ~17 min from 40 to 60 C without seawater); no ACWP: no flow, the water goes to the
                  room temperature 30 C (NO-SOURCE) in 30 min; the bottom ash cooler outlets TT-CW1060 = the supply + 1 C while an
                  ACWP runs (ASSUMED, the ash heat is not modelled; the snapshot reads 36 ~ 38 C at 37 C).
   Logic: DITL-76 / 77 START / trip drive the pumps here; PT-CW1152 (< 3.5 kg/cm2 = standby AUTO start), DPT-CW1108-A / B (> 0.8 trip),
   LT-CW1109 (< 0.3 m trip) go back into DITL-76 / 77; PT-CW1156 (DITL-41 < 3.5 / > 7 kg/cm2 annunciator), TT-CW1060 (DITL-21A) and the
   flow switches FS-CW1060 (DITL-21B, low flow) follow this model (plantsw.js). */
const AN_ACW = {
  acwp: ['DITL-76', 'DITL-77'],
  cQ: [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400],
  cH: [67.8, 66.7, 64.3, 60.7, 55.8, 50.0, 42.5, 34.4, 25.6],
  pP: [194, 210, 224, 238, 246, 250, 246, 235, 217],
  rho: 0.0991 /* kg/cm2 per m (991 kg/m3) */,
  kV: 6.6,
  eff: 0.95,
  pf: 0.86,
  Ist: 240,
  ramp: 10 /* s, soft starter (NO-SOURCE time, as the SWP) */,
  dQ: 1500,
  dP1: 6.4,
  dP2: 5.2,
  dLv: 0.8,
  dp: 0.27,
  hxN: 2,
  kd100: 0.05 /* kg/cm2, NO-SOURCE: loss of the open ACWP discharge valve at 1500 m3/h (inside the 27.PNG calibration) */,
  heat: 3480,
  UA: 174.8 /* kW/K per CCWHE in service, CALIBRATED (see above): NTU 0.2025 at 27.PNG with 2 SWBP (2,450 m3/h of the CW model) */,
  M: 180000,
  Tsw: 28.5,
  Tamb: 30,
  tauP: 3,
  tauI: 2,
  tauA: 1800
};
/* the line constants from the design point (kg/cm2 per (m3/h)^2) */
const acwCal = (() => {
  let c = null;
  return () => {
    if (c) return c;
    const K = AN_ACW,
      Ps = K.dP1 - K.rho * swInterp(K.cQ, K.cH, K.dQ);
    c = { z: Ps - K.rho * K.dLv, kA: (K.dP1 - K.dP2) / (K.dQ * K.dQ), kU: (K.dP2 - Ps) / (K.dQ * K.dQ) };
    return c;
  };
})();
/* the flow of the loop with the pumps at speeds s[] (0 = stopped): sum of the pump flows at the head the line needs */
function acwSolve(s, kv, kA) {
  const K = AN_ACW,
    c = acwCal(),
    k = (kA == null ? c.kA : kA) + c.kU,
    qOf = (si, dp, i) => {
      const v = (kv && kv[i]) || 0;
      if (!(si > 0) || !(v < Infinity) || K.rho * si * si * K.cH[0] <= dp) return 0;
      return swBisect(q => K.rho * si * si * swInterp(K.cQ, K.cH, q / si) - v * q * q - dp, 0, 1.6 * K.cQ[K.cQ.length - 1] * si, 40);
    };
  if (!s.some(x => x > 0) || !(k < Infinity)) return { Q: 0, q: s.map(() => 0) };
  const Q = swBisect(x => s.reduce((a, si, i) => a + qOf(si, k * x * x, i), 0) - x, 0, 2 * 1.6 * K.cQ[K.cQ.length - 1], 40);
  return { Q, q: s.map((si, i) => qOf(si, k * Q * Q, i)) };
}
function anAcwStep(U, dt) {
  const K = AN_ACW,
    c = acwCal(),
    lag = (k, x, tau) => (U[k] = isFinite(U[k]) ? U[k] + ((x - U[k]) * Math.min(dt, tau)) / tau : x),
    run = K.acwp.map(a => anDitlRun(a) || 0),
    n = run.reduce((a, b) => a + b, 0),
    lv = isFinite(U.etLvl) ? U.etLvl : K.dLv,
    stat = c.z + K.rho * lv;
  const first = !U.acSpd;
  U.acSpd = U.acSpd || [0, 0];
  run.forEach((r, i) => (U.acSpd[i] = r ? (first ? 1 : Math.min(1, U.acSpd[i] + dt / K.ramp)) : 0));
  U.acN = n;
  /* 3.2.1 the field valves (AN_FV0): a closed suction = the pump has no water (no flow); the discharge throttles its pump (loss = loss
     at 100 % / opening^4, as the seawater valves; closed = no flow); the CCWHE in service = inlet and outlet open, the CCWHE part of
     the line (0.571 of the 1.2 kg/cm2 at 1500 m3/h, D1-0-041) shared by them (none = the loop blocked) */
  const op = t => Math.max(0, Math.min(100, anFv(t))) / 100,
    suc = [op('V-CW1002'), op('V-CW1004')],
    dis = [op('V-CW1007'), op('V-CW1009')],
    hxo = [0, 1, 2].map(i => Math.min(op('V-CW' + (1010 + i)), op('V-CW' + (1013 + i)))),
    nHx = hxo.reduce((a, o) => a + (o > 0 ? 1 : 0), 0),
    fx = 0.571 / 1.2,
    sc = hxo.reduce((a, o) => a + o * o, 0) /* parallel paths: flow area ~ opening^2 */,
    kA = nHx ? c.kA * (1 - fx + fx * Math.pow(K.hxN / sc, 2)) : Infinity,
    kv = dis.map(o => (o > 0 ? (K.kd100 / (K.dQ * K.dQ)) * (1 / Math.pow(o, 4) - 1) : Infinity)) /* 100 % = the calibration (27.PNG) */,
    sp = U.acSpd.map((x, i) => (suc[i] > 0 ? x : 0));
  U.acHxN = nHx;
  const key = sp.map(x => x.toFixed(3)).join(',') + '|' + dis.join(',') + '|' + hxo.join(',');
  if (!U._acR || U._acK !== key) {
    U._acR = acwSolve(sp, kv, kA);
    U._acK = key;
  }
  const r = U._acR,
    Q = r.Q;
  U.acQ = Math.round(Q);
  /* no CCWHE in service: the pumps run against the closed valves (shut-off head at PT-CW1152) */
  const shut = Math.max(0, ...sp.map((x, i) => (x > 0 && dis[i] > 0 ? K.rho * x * x * K.cH[0] : 0)));
  lag('acP1', nHx ? stat + (kA + c.kU) * Q * Q : stat + shut, K.tauP);
  lag('acP2', stat + c.kU * Q * Q, K.tauP);
  U.acP6 = U.acP2;
  r.q.forEach((q, i) => {
    const s = U.acSpd[i],
      P = s > 0 ? swInterp(K.cQ, K.pP, q / s) * s * s * s : 0;
    U['acKw' + i] = Math.round(P);
    lag('acDp' + i, s > 0 ? K.dp * Math.pow(q / K.dQ, 2) : 0, K.tauP);
    if (s <= 0) U['acI' + i] = 0;
    else lag('acI' + i, s < 1 ? K.Ist : (1000 * P) / (1732.05 * K.kV * K.eff * K.pf), K.tauI);
  });
  /* heat: the users, the CCWHE (effectiveness-NTU, counter flow) with the seawater of the running SWBP */
  const ld = Math.max(0, Math.min(1, (isFinite(U.MW) ? U.MW : 0) / 150)),
    Qload = K.heat * (0.4 + 0.6 * ld),
    Ch = (Q * 991 * 4.18) / 3600 /* kW/K */,
    Qsw = Math.max(0, U.swQbT || 0),
    Cc = (Qsw * 1025 * 3.99) / 3600;
  let hx = 0;
  if (Ch > 0 && Cc > 0) {
    const ch = Ch / Math.max(1, nHx),
      cc = Cc / Math.max(1, nHx),
      cmin = Math.min(ch, cc),
      cr = cmin / Math.max(ch, cc),
      ntu = K.UA / cmin,
      e = cr < 0.999 ? (1 - Math.exp(-ntu * (1 - cr))) / (1 - cr * Math.exp(-ntu * (1 - cr))) : ntu / (1 + ntu);
    hx = e * cmin * nHx; /* kW per K of (return - seawater) */
  }
  U.acCool = n && hx > 0 ? 1 : 0;
  if (Ch > 0) {
    /* the return (pump discharge, TT-CW1152) is the node; the first step after a starting state starts at its steady value */
    if (first || !isFinite(U.acT1)) U.acT1 = hx > 0 && Q > 0.5 * K.dQ ? K.Tsw + Qload / hx : Math.min(60, K.Tamb + 10); /* 3.2.1: a throttled first step does not start hot */
    U.acT1 += ((Qload - hx * (U.acT1 - K.Tsw)) * dt) / K.M;
    U.acT1 = Math.max(K.Tsw, Math.min(99, U.acT1));
    U.acT2 = U.acT1 - (hx * (U.acT1 - K.Tsw)) / Ch;
    U.acHx = Math.round(hx * (U.acT1 - K.Tsw));
  } else {
    if (!isFinite(U.acT1)) U.acT1 = K.Tamb;
    if (!isFinite(U.acT2)) U.acT2 = K.Tamb;
    lag('acT1', K.Tamb, K.tauA);
    lag('acT2', K.Tamb, K.tauA);
    U.acHx = 0;
  }
  U.acT6 = U.acT2;
  U.acTb = n ? U.acT2 + 1 : U.acT2;
}
/* 3.2.1 (IRENE: PLANT MODEL, TURBINE OIL; user 2026-11-04 cross-system: "Kung mag adjust ka dito, mag aadjust din doon ang effect").
   The lube oil cooler H-1921A (B standby) on the closed cooling water: oil from the bearings (main oil tank) -> cooler -> bearings; cooling
   water from the ACW supply (TT-CW1153, AN_ACW) through TCV-CW1201 (ABC-053 TICLO1002 MV) -> return. Sources:
     cooler       O&M L2 TG 2-3 LUBE OIL COOLER R2 (H-n921A / B, plate type, 146.94 m2, 2 x 100 %): oil 2,660 L/min max, cooling water
                  170,000 kg/h max, water inlet 37 C max, oil outlet 46 C, 1,300 kW max -> clean UA 95.8 kW/K (counter flow, oil
                  63.0 -> 46 C, water 37 -> 43.6 C); Mass Balance K1AU3-MB-021 items 12 / 13: 170 T/H, 34 -> 41 C;
     snapshot     36.PNG (149 MW): oil in TILO1001 62 C, out 46 C; 27.PNG: TCV-CW1201 53.1 %, ACW supply 38 C;
     calibrated   with the vendor UA and a linear valve (170 T/H x MV, NO-SOURCE: no valve curve), the snapshot gives an oil flow of 64.5 kW/K
                  (2,250 L/min, below the 2,660 maximum; ISO VG 32 0.86 kg/L x 2.0 kJ/kg K) and a bearing heat of 1,032 kW (16 C x 64.5);
     heat         1,032 kW x speed / 3600 while the lube oil flows (bearing oil pressure above 1.05 kg/cm2, tcs.js), NO-SOURCE shape (as the
                  16 C x speed of tcs.js); the water flow also needs the ACW loop (x ACW flow / 1500);
     oil tank     one temperature node (the return oil), 25,800 kJ/K (about 15 m3 of oil, NO-SOURCE: the tank volume is not in the docs);
                  the cooler outlet = the return - heat removed / oil flow. TE-LO1002-1 / -2 = the outlet: the PV of TICLO1002, so
                  the logic, tcs.js (TILO1001, the bearing outlets TIGE1007 / 1008, the bearing metal) and the HMI read the same value.
   Chain: SWBP trip -> CCWHE no seawater -> ACW supply hot (AN_ACW) -> TCV-CW1201 opens (TICLO1002 in AUTO) -> at 100 % the oil gets
   hot -> the bearings get hot (tcs.js). */
/* 3.2.1 (IRENE: CONDENSATE plant model; docs/versions/v3.2.1/CONDENSATE_PLANT_MODEL.md). The condenser and the condensate pumps
   P-1116A / B (CEP) of flow diagram PD-016.
   Sources:
     condenser    O&M L15-1 (K2MC3A, section 1.1.2): thermal load 195.7 MW at the exhaust 87.78 kg/s (316.0 T/H, = AN_SW cSt), seawater
                  31,500 T/H 30 -> 35.6 C, 68.6 mbar abs (saturation 38.65 C), cleanliness 0.85, 6898 m2, hotwell 61.9 m3, normal level
                  FL+1814 mm (HHL +2114, LLL +1514);
     alarm list   "Alarm List _20160912": TE-CD1110-1 ~ 4 normal 38.6 C (H 50, L 27); PT-CD1110 range -1 ~ 5 kg/cm2, normal -0.86;
                  PT-CD1117 normal 15.5, L 14.0, LL 13.0 kg/cm2; LT-CD1110 H 150 / HH 300, L -150 / LL -300 mm;
     CEP          KSB WKTB 6/1+2 (O&M L10-1 A01 data sheet, A02 curve Q43495D, 1780 rpm, sp. gr. 0.9926): 400 m3/h at 180 m, shut-off
                  210 m, 160 m at 480 m3/h; shaft power 123 kW at 50, 252 kW at 400, 283 kW at 480 m3/h; min flow 100 m3/h; first stage
                  impeller GL-4.322 m, hotwell low level GL+1700 = FL+1500 mm (so the normal level is 6.34 m above the impeller);
     snapshot     28.png CP-A 28.1 A at 150 MW, PICD1117 16.9 kg/cm2; 4.PNG PICD1110 0.057 kg/cm2A, TICD11101 40.0 C;
     DITL-61B     row 19 PT-CD1117 < 14.0 kg/cm2 (1 s) = M.3217 CONDENSATE PUMPS OUTLET PRESSURE LOW -> DITL-61A row 10: the standby
                  pump in AUTO starts; DITL-61A rows 24 / 27 strainer DP > 0.1 / 0.08 kg/cm2.
   How it works:
     heat         Q = 195.7 MW x steam to the condenser / 316.0 T/H (the same steam as AN_SW: main steam share + LP bypass);
     condenser    the seawater of both water boxes (AN_SW swQc) at its inlet temperature: Ts = Tin + Q / (C (1 - exp(-UA / C))),
                  UA = 36,430 kW/K at the design flow (from the O&M point: NTU = ln(8.65 / 3.05)), x (flow / design)^0.5 (NO-SOURCE:
                  the usual water velocity factor); Ts follows with tau 30 s (NO-SOURCE); no seawater = no condensing: Ts goes to 100 C;
     pressure     PT-CD1110 = saturation of Ts, and the air of a condenser not in vacuum (U.vac, the ejectors) takes it to the atmosphere;
                  hotwell temperature = Ts (alarm list normal 38.6 = saturation of the design 68.6 mbar);
     turbine      the TCS LOW VACUUM trip at 0.26 kg/cm2 abs (IBD 310SC90-794 rev 2 sheet TA-10: 2 of 3, ON >= 0.26, OFF <= 0.22; LOW alarm 0.14);
     CEP          flow of a running pump = (condensate to the deaerator + recirculation) / running pumps (plant.js AN_CYC); head from the
                  curve; outlet = suction (condenser pressure + the water above the impeller) + head - kz (kz 0.96 kg/cm2, NO-SOURCE:
                  the transmitter elevation, calibrated to 16.9 at 150 MW); current = 28.1 A x shaft power / 245.7 kW (snapshot ratio). */
const AN_CD = {
  Qd: 195700,
  Wd: 316.024,
  UA: 36430,
  Cd: 31500,
  cp: 3.994,
  tau: 30,
  Ptrip: 0.26,
  Tref: 38.65 /* C, condenser design steam side, K2MC3A */,
  qQ: [0, 100, 200, 300, 400, 450, 480, 560],
  qH: [210, 209, 205, 196, 180, 170, 160, 130],
  pQ: [0, 50, 400, 480],
  pP: [105, 123, 252, 283],
  zS: 6.336,
  kz: 0.96,
  kI: 28.1 / 245.7,
  dp0: 0.019,
  q0: 383
};
/* MW lost to the back pressure. docs/versions/v3.2.1/HEAT_BALANCE.md: calculated from the mass balance (exhaust quality 0.92 closes the
   balance at 150 MW). At constant entropy dh/dT = x hfg / T = 7.1 kJ/kg per C at 38.65 C; with 0.85 LP efficiency (NO-SOURCE) 6 kJ/kg per C,
   on the exhaust steam, 0.70 of the main steam (309.7 / 446 T/H, MB-013). A better vacuum gives a small gain, capped at 1 C. */
/* FIFA1079 / FIFA1071 at load: 328.2 / 354.0 T/H (HMI snapshot, a check value; no document gives the split of the primary air) */
const AN_PA_FURN = 328.2 / 354.0;
/* bed temperature at steady firing. FHI Fig 8 (furnace temperature) on the coal share of Fig 13, scaled to the bed of the anchor; more air than
   Fig 12 gives at that firing cools it with the same exponent 0.45. Below 40 % load no curve is printed: the start-up law of beta.15 (a small
   fire with the light-off air, 450 C with two burners) stays, and the lower of the two holds. Before: the start-up law alone, 95 C too hot at
   60 % load. Fuel share at 40, 50, 60, 70, 85, 100 % load: 38.5, 47, 56, 64, 77, 89.5 T/H of 89.5 */
/* 3.2.1 b6: plant DCS trends 2026-11-08 (team-files/plant-study/14): TIFG1090 952 to 962 C from 90 to 150 MW with the plant air, 855 C at 40 MW
   against 909 C at 150 MW the same day. The Fig 8 fall (660 to 840) and the extra air cooling are not seen on this plant: t follows the trend ratios,
   the air term has exponent 0 */
const AN_BED = { s: [0.43, 0.525, 0.626, 0.715, 0.86, 1], t: [798, 819, 840, 840, 840, 840], a: [0.612, 0.557, 0.622, 0.716, 0.861, 1] };
function anBedSS(U, fs, as) {
  const K = AN_BED,
    start = U.Tamb + (U.Tb0 - U.Tamb) * Math.pow(Math.min(3, fs / as), 0.45),
    x = Math.min(1.1, fs),
    ip = Y => {
      if (x <= K.s[0]) return Y[0];
      for (let i = 1; i < K.s.length; i++) if (x <= K.s[i]) return Y[i - 1] + ((Y[i] - Y[i - 1]) * (x - K.s[i - 1])) / (K.s[i] - K.s[i - 1]);
      return Y[Y.length - 1] + ((x - 1) * (Y[Y.length - 1] - Y[Y.length - 2])) / (1 - K.s[K.s.length - 2]);
    };
  const tab = U.Tamb + (ip(K.t) * (U.Tb0 / 840) - U.Tamb) * Math.pow(ip(K.a) / as, 0);
  /* 3.2.1 b6 (Mina beta.108 rerun: bed 841 / 771 / 741 at 150 / 105 / 90 MW, still falling; plant 954 / 955 / 955): the start-up law is for
     the small fire below 40 % load only. At part load the plant keeps more air than its coal share (PA 318 T/H at 90 MW), so fs / as < 1
     and the start-up law capped the bed under the trend. It now fades out between 30 and 43 % fuel share (no jump at 40 % load) */
  const w = Math.max(0, Math.min(1, (fs - 0.3) / (K.s[0] - 0.3)));
  return Math.min(start + (tab - start) * w, tab);
}
/* bed inventory (t of solids in the furnace). The overall furnace pressure drop is its weight on the grate: 15.51 x 7.68 m = 119 m2 (T2), so
   1 mmH2O = 1 kg/m2 = 0.119 t; 1426 mmH2O (snapshot DPIFG1081) = 170 t. In: ash of the coal 6.82 % (T3), limestone less its CO2 (93.66 % CaCO3,
   T3: 0.59 stays), sand. Of the ash and limestone 20 % stays as bottom ash (ASH L5-1, scanned page, read with care), the rest leaves as fly ash.
   Out: the four screw coolers, 2 T/H at normal, 4 T/H at 5 rpm (BAC E130122B): 0.8 T/H per rpm. The fan flow that fluidizes: NO-SOURCE, full
   reading above 30 % of the anchor primary air. Initial charge at Cold 100 t (T9 p3). */
/* The loop: the cyclones catch the solids and the seal pots give them back while the fluidizing air blows. Below the FA blower flow low low of ABC-006
   (20 T/H) the seal pots stop passing: the solids stay in the cyclone legs and the bed empties, and they come back with the air. The rate is
   NO-SOURCE: the circulation rate is not in the documents. */
const AN_BI = { t0: 169.7, tCold: 100, kA: 0.0682, kL: 0.59, kB: 0.2, q: 0.8, faLL: 20, loop: 60 };
function anBedStep(U, dt, rpm, pa, fa) {
  const K = AN_BI;
  if (!isFinite(U.bedI)) U.bedI = U.cold ? K.tCold : K.t0;
  const sol = K.kA * (U.Fc || 0) * (U.burn || 0) + K.kL * (U.lmQ || 0);
  U.bedIn = K.kB * sol + (U.sdQ || 0);
  U.bedOut = K.q * rpm;
  U.bedI = Math.max(0, U.bedI + ((U.bedIn - U.bedOut) * dt) / 3600);
  /* the solids held in the cyclone legs (t) */
  U.bedLeg = U.bedLeg || 0;
  const mv = ((K.loop * (pa > 106 ? 1 : 0)) * dt) / 3600,
    seal = fa == null || fa >= K.faLL;
  U.bedSeal = seal ? 1 : 0;
  if (!seal) {
    const d = Math.min(mv, U.bedI);
    U.bedI -= d;
    U.bedLeg += d;
  } else {
    const d = Math.min(mv * 4, U.bedLeg);
    U.bedI += d;
    U.bedLeg -= d;
  }
  U.bedK = Math.max(0, Math.min(1, pa / 106)) * (U.bedI / K.t0);
  return U.bedK;
}
function anVacMW(U) {
  if (!isFinite(U.cdT) || !(U.ms > 0)) return 0;
  const dT = Math.max(-1, U.cdT - AN_CD.Tref);
  U.dMWv = (6 * dT * 0.7 * U.ms) / 3600;
  return U.dMWv;
}
const anPsat = T => (Math.pow(10, 8.07131 - 1730.63 / (233.426 + T)) * 1.33322) / 980.665; /* kg/cm2A, Antoine (water) */
function anCondStep(U, dt) {
  const K = AN_CD,
    sw = AN_SW,
    ws = Math.max(0, ((U.ms || 0) * sw.cSt) / sw.mcr + (U.qlp || 0) + (U.xtra || 0)),
    Q = (K.Qd * ws) / K.Wd,
    Tin = isFinite(U.swTiA) ? (U.swTiA + U.swTiB) / 2 : sw.Tin[0],
    W = Math.max(0, (U.swQc || 0) * 1.02),
    C = (W / 3.6) * K.cp,
    UA = K.UA * Math.sqrt(W / K.Cd);
  let Tss = Tin;
  if (Q > 0) Tss = C > 1 ? Tin + Q / (C * (1 - Math.exp(-UA / C))) : 100;
  Tss = Math.min(100, Tss);
  if (!isFinite(U.cdTs)) U.cdTs = Tss;
  U.cdTs += (Tss - U.cdTs) * Math.min(1, dt / K.tau);
  const vac = isFinite(U.vac) ? Math.max(0, Math.min(1, U.vac)) : 1,
    Ps = Math.min(1.033, anPsat(U.cdTs));
  U.cdQ = Math.round(Q / 100) / 10; /* MW */
  U.cdT = U.cdTs;
  U.cdP = Ps + (1.033 - Ps) * (1 - vac);
  /* the condensate pumps */
  const run = [srcBit(['M.3350']) > 0.5 ? 1 : 0, srcBit(['M.3351']) > 0.5 ? 1 : 0],
    n = run[0] + run[1],
    u = (typeof AN_CYC !== 'undefined' && AN_CYC.u) || {},
    Qt = n ? (Math.min(520, 21.7 * Math.max(0, u.da || 0)) + 2.5 * Math.max(0, Math.min(100, u.cf || 0))) / 0.9926 : 0,
    q = n ? Qt / n : 0,
    hw = anUnitVal(U.cdHwL || []),
    Psuc = U.cdP - 1.033 + 0.09926 * (K.zS + (isFinite(hw) ? hw : 0) / 1000);
  U.cdQp = Math.round(q);
  U.cdQt = Math.round(Qt); /* Mina F28: FT-CD1120 of DITL-64 row 28 reads the plant, it stood at the default 75 T/H */
  U.cdHw = hw;
  U.cdRun = run;
  U.cdPd = Math.max(0, Math.min(25, Psuc + (n ? 0.09926 * swInterp(K.qQ, K.qH, q) : 0) - K.kz));
  run.forEach((r, i) => {
    U['cdI' + i] = r ? Math.round(10 * K.kI * swInterp(K.pQ, K.pP, q)) / 10 : 0;
    U['cdDp' + i] = r ? Math.round(1000 * K.dp0 * (q / K.q0) * (q / K.q0)) / 1000 : 0;
  });
}
/* 3.2.1 (IRENE: FEEDWATER plant model; docs/versions/v3.2.1/FEEDWATER_PLANT_MODEL.md). The boiler feed water pumps P-1115A / B
   (BFWP) of flow diagram PD-016 / 003.
   Sources:
     BFWP         KSB HGC 5/1+6 (O&M L7 BFP, sheet 1 / 2 of the data sheet, curve Q43446D at 3580 rpm, 158.4 C, sp. gr. 0.9093):
                  491.04 T/H at 1750 m, shut-off 2254.6 m, discharge 165.1 kg/cm2g at suction 6.0, 2946 kW (motor 3550 kW),
                  minimum recirculation 151 m3/h (ARC valve); curve 2250 m at 100, 2140 at 300, 2010 at 400, 1620 at 600 m3/h; power
                  1700 kW at 150, 2230 at 300, 2580 at 400, 3100 at 600 m3/h;
     snapshot     03.png (150.5 MW): BFWP-A 289.4 A, PIFW1011 165.4 kg/cm2, DPIFW1115A 0.29 kg/cm2, feedwater 499.1 T/H;
     DITL-23B     row 25 PT-FW1011 < 155 kg/cm2 = M.3210 BFWP OUTLET PRESSURE LOW (the standby BFWP in AUTO starts, DITL-22 / 23A);
                  row 26 DPT-FW1115-A strainer DP > 0.8 / 0.9 kg/cm2, alarm > 0.6.
   How it works: flow of a running pump = the feedwater to the drum (plant.js AN_CYC.ffw) / running pumps, at least the ARC minimum
   flow 151 m3/h; outlet PT-FW1011 = suction (plantsw.js sucP) + head of the curve (the data sheet: 6.0 + 1750 m x 0.9093 / 10 =
   165.1 kg/cm2g; kz 0); running = the DITL-23A machine (A) / #B (B);
   current = 289.4 A x shaft power / its power at 150 MW (snapshot ratio); strainer DP = 0.29 x (flow / 549)^2. */
const AN_FW = {
  sg: 0.9093,
  qQ: [0, 100, 200, 300, 400, 500, 540, 600, 700],
  qH: [2254.6, 2250, 2215, 2140, 2010, 1840, 1750, 1620, 1380],
  pQ: [0, 150, 300, 400, 540, 600],
  pP: [1170, 1700, 2230, 2580, 2946, 3100],
  qMin: 151,
  kz: 0,
  I0: 289.4,
  q0: 549,
  dp0: 0.29
};
function anFwStep(U, dt) {
  const K = AN_FW,
    dr = d => (typeof anDitlRun === 'function' ? anDitlRun(d) : null),
    /* a running pump with its suction manual valve closed (V-FW1001 / 1002) gives no head (dry: the motor protection is not modelled) */
    run = [['DITL-23A', 'M.3343', 'V-FW1001'], ['DITL-23A #B', 'M.3344', 'V-FW1002']].map(([d, m, v]) => (anFv(v) < 5 ? 0 : dr(d) != null ? (dr(d) === 1 ? 1 : 0) : srcBit([m]) > 0.5 ? 1 : 0)),
    n = run[0] + run[1],
    ffw = typeof AN_CYC !== 'undefined' && isFinite(AN_CYC.ffw) ? Math.max(0, AN_CYC.ffw) : 0,
    q = n ? Math.max(K.qMin, ffw / K.sg / n) : 0,
    ps = typeof window !== 'undefined' && window.WORLD && WORLD.sucP ? WORLD.sucP() : NaN,
    Ps = isFinite(ps) ? ps : 0,
    P0 = swInterp(K.pQ, K.pP, K.q0);
  U.fwRun = run;
  U.fwQp = Math.round(q);
  /* the pump inlet = the suction header less its branch loss (strainer + line, 0.4 kg/cm2 at q0: 03.png, see anFwTagStep) */
  U.fwPd = Math.max(0, Math.min(250, n ? Ps - 0.4 * (q / K.q0) * (q / K.q0) + (K.sg / 10) * swInterp(K.qQ, K.qH, q) - K.kz : Ps));
  run.forEach((r, i) => {
    U['fwI' + i] = r ? Math.round((10 * K.I0 * swInterp(K.pQ, K.pP, q)) / P0) / 10 : 0;
    U['fwDp' + i] = r ? Math.round(1000 * K.dp0 * (q / K.q0) * (q / K.q0)) / 1000 : 0;
  });
}
/* 3.2.1 (IRENE: HP HEATERS; docs/versions/v3.2.1/HP_HEATERS_PLANT_MODEL.md). Feedwater after the BFWP: deaerator -> No.1 HPH
   (extraction no. 2, MV-TS1002 DITL-95) -> No.2 HPH (extraction no. 1, MV-TS1001 DITL-94) -> economizer inlet (TT-FW1160 / PT-FW1160).
   Sources: FHI heater O&M (PC, o&m-package-phase-1 L15-3 / L15-4, PDF p14 "Nominal thermal characteristics", feedwater 458.684 t/h):
     No.2 HPH  extraction 37.48 kgf/cm2A (sat 245.37 C), FW 195.7 -> 245.4 C, TTD -0.05, drain 45.147 t/h 201.3 C (DCA 5.6 over FW in)
     No.1 HPH  extraction 14.12 kgf/cm2A (sat 194.63 C), FW out = sat + 1.07 (TTD -1.07) = 195.7 C, extraction 7.035 kg/s = 25.33 t/h;
               the drains of both to the deaerator: deaerator O&M (L15-2 p14) "HPH condensate" 69.35 t/h 166.3 C (FW in 158.4 C)
   The extraction pressure goes with the turbine steam (U.ms / 458.684, a turbine stage: NO-SOURCE shape, no turbine heat balance in the
   repository or on the PC); a shut-off MOV less than 20 % open throttles it (NO-SOURCE). The heater gives FW out = saturation of its
   shell + TTD, never below FW in; the extraction (= drain) flow from its heat duty, scaled on the design point. Metal / water lag 120 s
   (NO-SOURCE). The water side valves: AN_FV0, anHtrPath. */
const AN_HP = { dhX: [1160.1, 917.1, 454.8, 311.4, 257.2] /* kJ/kg down to the exhaust 2378.4: No.2 HPH hot reheat 3538.5, No.1 HPH 3295.5, No.3 LPH 2833.2, No.2 LPH 2689.8, No.1 LPH saturated 2635.6 (HEAT_BALANCE.md) */, cpFw: 4.6 /* kJ/kg per C, feedwater 195.7 to 245.4 C */, dhB: 2382 /* kJ/kg, main steam 3446.7 less feedwater 1064.4 */, F0: 458.684, P1: 37.48 - 1.0332, P2: 14.12 - 1.0332, ttd1: 1.07, ttd2: 0.05, dT1: 195.7 - 158.4, dT2: 245.4 - 195.7, m1: 25.33, m2: 45.147, dca1: 166.3 - 158.4, dca2: 201.3 - 195.7, tau: 120 };
function anHphStep(U, dt) {
  const K = AN_HP,
    ms = Math.max(0, +U.ms || 0),
    pos = n => {
      const p = typeof anDitlPos === 'function' ? anDitlPos(n, 0) : null;
      return p == null ? 100 : p;
    },
    thr = p => Math.max(0, Math.min(1, p / 20)),
    /* shell pressures (kg/cm2 g): extraction x turbine steam x MOV */
    Ps2 = (K.P1 + 1.0332) * (ms / K.F0) * thr(pos('DITL-94')) - 1.0332,
    Ps1 = (K.P2 + 1.0332) * (ms / K.F0) * thr(pos('DITL-95')) - 1.0332,
    /* deaerator pressure PT-CD1104 (ABC-056 AI0417): the water to the BFWP is at its saturation */
    Pda = U.xt && U.xt.dea ? anUnitVal(U.xt.dea) : NaN,
    Tin = isFinite(Pda) && Pda > 0.05 ? steamTsat(Pda) : isFinite(U.Tamb) ? U.Tamb : 30,
    sat = P => (P > -0.9 ? steamTsat(P) : 0),
    w1 = anHtrPath(anFv('V-FW1009'), anFv('V-FW1010'), anFv('V-FW1011')),
    w2 = anHtrPath(anFv('V-FW1012'), anFv('V-FW1013'), anFv('V-FW1014')),
    t1 = Tin + w1.s * Math.max(0, sat(Ps1) + K.ttd1 - Tin),
    t2 = t1 + w2.s * Math.max(0, sat(Ps2) + K.ttd2 - t1),
    ffw = typeof AN_CYC !== 'undefined' && isFinite(AN_CYC.ffw) ? Math.max(0, AN_CYC.ffw) : 0,
    lag = (k, x) => (U[k] = isFinite(U[k]) && dt > 0 ? U[k] + ((x - U[k]) * Math.min(dt, K.tau)) / K.tau : x);
  U.fwPath = Math.min(w1.p, w2.p); /* both the tubes and the bypass of a heater shut = no feedwater */
  U.hpT1 = Math.round(10 * lag('hpT1x', t1)) / 10;
  U.hpT2 = Math.round(10 * lag('hpT2x', t2)) / 10;
  const f = ffw / K.F0,
    e1 = ffw > 1 ? (K.m1 * f * Math.max(0, U.hpT1 - Tin)) / K.dT1 : 0,
    e2 = ffw > 1 ? (K.m2 * f * Math.max(0, U.hpT2 - U.hpT1)) / K.dT2 : 0;
  U.hpF2 = Math.round(10 * e2) / 10; /* FT-HD1106: No.2 HPH drain = its extraction */
  U.hpF1 = Math.round(10 * (e1 + e2)) / 10; /* FT-HD1105: No.1 HPH drain = its extraction + the No.2 drain (cascade) */
  U.hpD2 = Math.round(10 * (e2 > 0.5 ? U.hpT1 + K.dca2 : U.hpT2)) / 10; /* TT-HD1106 */
  U.hpD1 = Math.round(10 * (U.hpF1 > 0.5 ? Tin + K.dca1 : U.hpT1)) / 10; /* TT-HD1105 */
  U.hpPs = [Ps1, Ps2];
  U.hpMov = [pos('DITL-95'), pos('DITL-94')]; /* MV-TS1002 / MV-TS1001 position % */
  /* docs/versions/v3.2.1/HEAT_BALANCE.md: an extraction that is shut stays in the turbine and works down to the condenser, and colder
     feedwater takes more of the boiler heat per kg of steam. Measured from the same heaters with the MOVs open, so the start-up curves stay */
  const t1o = Math.max(Tin, sat((K.P2 + 1.0332) * (ms / K.F0) - 1.0332) + K.ttd1),
    t2o = Math.max(t1o, sat((K.P1 + 1.0332) * (ms / K.F0) - 1.0332) + K.ttd2),
    e1o = ffw > 1 ? (K.m1 * f * Math.max(0, t1o - Tin)) / K.dT1 : 0,
    e2o = ffw > 1 ? (K.m2 * f * Math.max(0, t2o - t1o)) / K.dT2 : 0,
    ls = U.lpS || {},
    sh = k => (isFinite(ls[k]) ? ls[k] : 1),
    x = [Math.max(0, e2o - e2), Math.max(0, e1o - e1), (15.25 * ms * (1 - (pos('DITL-97') / 100) * sh('H3'))) / K.F0, (12.27 * ms * (1 - (pos('DITL-98') / 100) * sh('H2'))) / K.F0, (8.42 * ms * (1 - sh('H1'))) / K.F0];
  U.xtra = x[0] + x[1] + x[2] + x[3]; /* T/H more to the condenser */
  U.dMWx = (x.reduce((a, q, i) => a + q * K.dhX[i], 0) * 0.985) / 3600;
  U.fwDrop = Math.max(0, t2o - U.hpT2); /* feedwater colder than with both heaters in: boiler.js anAphIn */
  U.hpFac = 1 / (1 + (K.cpFw * U.fwDrop) / K.dhB);
}
/* 3.2.1 (IRENE: HEATER LEVELS, docs/versions/v3.2.1/HEATER_LEVELS_PLANT_MODEL.md). The shell (drain) level of the No.2 / No.1 HP and
   No.3 / No.2 / No.1 LP heaters and their drain valves.
   Sources:
     drains       FHI heater O&M (PC, o&m-package-phase-1 L15-3 ~ L15-7, section 1.1.2 "Nominal thermal characteristics"): extraction
                  (= its condensate) No.2 HPH 45.147, No.1 HPH 25.33 (+ the No.2 drain), No.3 LPH 15.246, No.2 LPH 12.27 (+ 15.246 =
                  27.516 out), No.1 LPH 17.861 (+ 27.516 = 45.377 out) t/h at the design feedwater (HP 458.684, LP 362.594 t/h);
     cascade      PD-018 / IO list: No.2 HPH -> No.1 HPH (LCV-HD1106-1) -> deaerator (LCV-HD1105-1); No.3 LPH -> No.2 -> No.1 LPH
                  (LCV-HD1103-1 / 1102-1) -> condenser (LCV-HD1101-1); the alternate valves LCV-HD110x-2 to the condenser / flash chamber;
     shell        section 1.1.1 "Physical characteristics": horizontal; inside diameter / overall length No.1 HPH 1156 / 9595 (K2MC2A-001),
                  No.2 HPH 1250 / 9138.5, No.1 LPH 1130 / 13612, No.2 LPH 1080 / 10679, No.3 LPH 1030 / 10674 mm;
     levels       alarm list (LT-HD110x, from the normal level, mm): H.H. No.1 HPH / No.3 LPH 140, the others 150 (the LS-HD110x level
                  switch, DITL-41; ABC-036 M.0203 = No.2 HPH HI-HI -> DITL-94 closes MV-TS1001); H 40 / 50, L -40 / -50;
     valves       02.png (60 MW): No.3 LPH primary 32.4 % at FIQHD1103 7.7 T/H; No.2 LPH primary 99.9 % at FIQHD1102 3.4 T/H with its
                  alternate 53.7 %; No.1 LPH primary 13.6 %. The HP valves have no snapshot in service (02.png: manual, 0.1 %).
   How it works (each heater, each step):
     in           its extraction (the HP heaters: AN_HP, with its MOV; the LP heaters: design x main steam / 458.684 x the MOV of DITL-97
                  (MV-TS1004, No.3 LPH) / DITL-98 (MV-TS1005, No.2 LPH)) + the primary drain of the heater before it;
     out          primary + alternate valve: capacity at 100 % x MV / 100 x sqrt(main steam / 458.684) (the shell pressures and their
                  differences follow the load); an empty shell (below -300 mm) passes no more than it gets;
     level        d(level) / dt = (in - out) / (water density x surface), surface = diameter x length x 0.7 (NO-SOURCE: the tube bundle
                  and the heads take the rest); the water density of the design drain temperature (steam table).
   NO-SOURCE: the capacity of the HP valves (the design flow at 50 %) and of every alternate valve (= its primary); 0.7. */
const AN_HD = {
  /* key, ABC sheet, level AIs, primary / alternate controller, design extraction t/h, heater before (cascade), H.H. mm, shell ID m,
     length m, water kg/m3, primary capacity t/h at 100 % (150 MW), extraction MOV (DITL) */
  h: [
    ['H6', 'ABC-036', ['AI0677', 'AI0853'], 'LICHD11061', 'LICHD11062', 45.147, null, 140, 1.25, 9.1385, 864, 45.147 / 0.5, 'DITL-94'],
    ['H5', 'ABC-035', ['AI0676', 'AI0852'], 'LICHD11051', 'LICHD11052', 25.33, 'H6', 140, 1.156, 9.595, 900, 91 /* LCV-HD1105 sheet, E2-0-123 */, 'DITL-95'],
    ['H3', 'ABC-039', ['AI0675', 'AI0851'], 'LICHD11031', 'LICHD11032', 15.246, null, 140, 1.03, 10.674, 961, 21.3 /* LCV sheet, E2-0-123 */, 'DITL-97'],
    ['H2', 'ABC-038', ['AI0674', 'AI0850'], 'LICHD11021', 'LICHD11022', 12.27, 'H3', 140, 1.08, 10.679, 974, 35.3 /* LCV sheet, E2-0-123 */, 'DITL-98'],
    ['H1', 'ABC-037', ['AI0673', 'AI0849'], 'LICHD11011', 'LICHD11012', 17.861, 'H2', 140, 1.13, 13.612, 990, 69.9 /* LCV sheet, E2-0-123 */, null]
  ],
  F0: 458.684,
  fA: 0.7,
  /* the alternates from their valve sheets, E2-0-123 (team-files/plant-study/12-assumptions.md); H5 = its primary */
  alt: { H6: 142, H3: 27.0, H2: 37.5, H1: 57.3 }
};
function anHdStep(U, dt) {
  if (!U.hd || !U.hd.length) return;
  const K = AN_HD,
    ms = Math.max(0, +U.ms || 0),
    ld = ms / K.F0,
    sq = Math.sqrt(Math.max(0, ld)),
    pos = n => {
      if (!n) return 100;
      const p = typeof anDitlPos === 'function' ? anDitlPos(n, 0) : null;
      return p == null ? 100 : p;
    },
    thr = p => Math.max(0, Math.min(1, p / 20)),
    mv = o => (o ? Math.max(0, Math.min(100, +o.S.rt.v[o.n] || 0)) : 0),
    out = {};
  const ctl = (k, t) => {
    const x = AN.sheets.find(y => y.name === k),
      c = x && x.S && AN.hmiCtrls ? (AN.hmiCtrls(x.S) || []).find(q => q.tag === t) : null;
    return c && c.out != null ? { S: x.S, n: c.out } : null;
  };
  for (const h of U.hd) {
    const d = K.h.find(x => x[0] === h.k);
    if (!d) continue;
    const [k, , , , , ext, from, hh, D, Ls, rho, cap1, mov] = d;
    if (!h.v1) h.v1 = ctl(h.sh, h.c1);
    if (!h.v2) h.v2 = ctl(h.sh, h.c2);
    if (!isFinite(h.y)) {
      const v = anUnitVal(h.L[0]);
      h.y = isFinite(v) ? v : 0;
      h.off = h.L.map(l => (isFinite(anUnitVal(l)) ? anUnitVal(l) - h.y : 0));
    }
    /* in: the condensate of its extraction + the cascade */
    let ein;
    if (k === 'H6') ein = isFinite(U.hpF2) ? U.hpF2 : 0;
    else if (k === 'H5') ein = isFinite(U.hpF1) && isFinite(U.hpF2) ? U.hpF1 - U.hpF2 : 0;
    else ein = ext * ld * thr(pos(mov)) * (U.lpS && isFinite(U.lpS[k]) ? U.lpS[k] : 1);
    const win = ein + (from && out[from] ? out[from] : 0);
    const c2 = (K.alt[k] != null ? K.alt[k] : cap1) * sq;
    /* the split range of the drawing (ABC-035 ~ 039): the primary controller MV goes to the primary valve by an F(X) (LN38 ...) and,
       while the primary is AUTO (M.0236 ... = NOT .MAN), to the alternate station by a second F(X) (LN39 ..., EX-MV); the valve
       opening is that F(X) output (the AO is 100 % minus it: the valve opens on a falling signal) */
    if (h.v1 && !h.fx) {
      const S2 = h.v1.S,
        fxs = S2.blk.filter(b => b.k === 'FX' && b.pins.some(p => p.role === 'in' && p.n === h.v1.n)),
        outOf = b => (b.pins.find(p => p.role === 'out') || {}).n,
        toSub = b => S2.blk.some(q => q.k === 'SUB' && q.pins.some(p => p.role === 'in' && p.n === outOf(b)));
      h.fx = { p: fxs.find(toSub) || null, a: fxs.find(b => !toSub(b)) || null };
    }
    const fxv = (b, x) => (b && typeof anFXs === 'function' ? Math.max(0, Math.min(100, anFXs(b.p, x).y)) : x);
    /* "Start at 150 MW": the snapshot has no drain valve opening at full load (02.png is 60 MW), so the primary controller starts at the
       MV whose two valves pass the drain of the load, as the operator found it */
    if (U.hdSeed && sq > 0 && h.v1 && h.fx) {
      const flow = x => cap1 * sq * (fxv(h.fx.p, x) / 100) + c2 * (h.fx.a ? fxv(h.fx.a, x) / 100 : 0);
      let a = 0,
        b = 100;
      for (let i = 0; i < 30; i++) {
        const m = (a + b) / 2;
        if (flow(m) < win) a = m;
        else b = m;
      }
      const x = (a + b) / 2,
        c = (AN.hmiCtrls(h.v1.S) || []).find(q => q.out === h.v1.n);
      if (c) {
        if (h.v1.S.rt.st[c.b.id] && typeof hmiPidSet === 'function') hmiPidSet(h.v1.S.rt.st[c.b.id], c.b, x);
        h.v1.S.rt.v[h.v1.n] = x;
      }
      /* Mina F14: the alternate starts where the primary puts it. It kept its 60 MW snapshot opening (02.png 53.7 %): the No.2 LP heater drained at
         once and stood LOW-LOW, then the controller came back over 5 minutes */
      if (h.v2 && h.fx.a) {
        const x2 = fxv(h.fx.a, x),
          c3 = (AN.hmiCtrls(h.v2.S) || []).find(q => q.out === h.v2.n);
        if (c3 && h.v2.S.rt.st[c3.b.id] && typeof hmiPidSet === 'function') hmiPidSet(h.v2.S.rt.st[c3.b.id], c3.b, x2);
        h.v2.S.rt.v[h.v2.n] = x2;
      }
    }
    /* 3.2.1 the drain valves have an airlock (AN_AV): below 3.5 kg/cm2 of instrument air they stay where they are */
    let w1 = cap1 * sq * (anAv(h.c1, h.fx && h.fx.p ? fxv(h.fx.p, mv(h.v1)) : mv(h.v1)) / 100),
      w2 = c2 * (anAv(h.c2, mv(h.v2)) / 100);
    const M = (rho * D * Ls * K.fA) / 1000 /* kg per mm */;
    if (h.y <= -300 && w1 + w2 > win) {
      const f = (w1 + w2) > 0 ? win / (w1 + w2) : 0;
      w1 *= f;
      w2 *= f;
    }
    h.y = Math.max(-320, Math.min(350, h.y + ((win - w1 - w2) * 1000 / 3600 * dt) / M));
    h.win = win;
    h.w1 = w1;
    h.w2 = w2;
    h.hh = h.y >= hh;
    out[k] = w1;
    h.L.forEach((l, i) => anUnitWrite(l, h.y + (h.off[i] || 0)));
  }
  if (U.hdSeed && sq > 0) U.hdSeed = false;
  U.hdLvl = Object.fromEntries(U.hd.map(h => [h.k, Math.round(h.y * 10) / 10]));
  U.hdHH = Object.fromEntries(U.hd.map(h => [h.k, h.hh ? 1 : 0]));
}
/* 3.2.1 (IRENE: LP HEATERS, docs/versions/v3.2.1/LP_HEATERS_PLANT_MODEL.md). The condensate temperatures through the No.1 / 2 / 3 LP heaters
   and their drain temperatures (no ABC or DITL sheet reads them: the values are for the plant pages, AN.unit.tt).
   Sources: FHI heater O&M (PC, o&m-package-phase-1 L15-5 / L15-6 / L15-7, PDF p14 "Nominal thermal characteristics", condensate 362.594 t/h):
     No.1 LPH  extraction 0.354 kgf/cm2A (sat 72.52 C), condensate 40 -> 70.8 C, TTD 1.72, DCA 5.62 (drain out 45.62 C)
     No.2 LPH  extraction 0.785 kgf/cm2A (sat 92.48 C), condensate 70.8 -> 90.7 C, TTD 1.78, DCA 5.61 (drain out 76.41 C)
     No.3 LPH  extraction 1.818 kgf/cm2A (sat 116.64 C), condensate 90.7 -> 114.9 C, TTD 1.74, DCA 5.62 (drain out 96.3 C)
     condenser O&M L15-1 p16: 68.6 mbar abs, saturation 38.65 C = the hotwell (AN_CD); the gland steam condenser and the ejector condenser
               between the hotwell and the No.1 LPH inlet: 40 - 38.65 = 1.35 C at the design point.
   Tags (IO list STN102): TT-CD1101 No.1 LPH inlet, TT-CD1102 No.2 LPH inlet, TT-CD1103-1 No.3 LPH inlet, TT-CD1103-2 No.3 LPH outlet,
   TT-CD1122 deaerator inlet, TT-HD1102 / 1103 No.2 / 3 LPH drain, TT-HD1105 / 1106 No.1 / 2 HPH drain (AN_HP hpD1 / hpD2).
   How it works: the shell pressure (abs) = design x main steam / 458.684 x the extraction MOV (DITL-97 No.3, DITL-98 No.2; the No.1 LPH has
   none), as AN_HP / AN_HD; condensate out = saturation of the shell - TTD, never below the water that comes in; drain out = condensate in
   + DCA while the heater drains (else the shell saturation); lag 120 s (NO-SOURCE, as AN_HP). NO-SOURCE: the 1.35 C rise taken with
   the load share; no pipe loss to the deaerator (02.png 94 / 93 C). */
const AN_LP = {
  F0: 458.684,
  /* key, design shell kgf/cm2A, TTD, DCA, extraction MOV */
  h: [
    ['H1', 0.354, 1.72, 5.62, null],
    ['H2', 0.785, 1.78, 5.61, 'DITL-98'],
    ['H3', 1.818, 1.74, 5.62, 'DITL-97']
  ],
  rise: 40 - 38.65,
  tau: 120
};
/* saturation temperature (C) of a pressure in kg/cm2A: the Antoine inverse of anPsat */
const anTsatA = P => (P > 0.005 ? 1730.63 / (8.07131 - Math.log10((P * 980.665) / 1.33322)) - 233.426 : -Infinity);
function anLphStep(U, dt) {
  const K = AN_LP,
    ms = Math.max(0, +U.ms || 0),
    ld = ms / K.F0,
    pos = n => {
      if (!n) return 100;
      const p = typeof anDitlPos === 'function' ? anDitlPos(n, 0) : null;
      return p == null ? 100 : p;
    },
    thr = p => Math.max(0, Math.min(1, p / 20)),
    L = U.lpT || (U.lpT = {}),
    lag = (k, x) => (L[k] = isFinite(L[k]) && dt > 0 ? L[k] + ((x - L[k]) * Math.min(dt, K.tau)) / K.tau : x),
    hw = isFinite(U.cdT) ? U.cdT : isFinite(U.Tamb) ? U.Tamb : 30,
    r1 = x => Math.round(10 * x) / 10,
    hd = U.hd || [];
  /* No.1 LPH: motor valves MV-CD1001 / 1002 / bypass 1003 (DITL-69 / 70 / 71); No.2, No.3: gear valves */
  const dp = (n, d) => {
      const p = typeof anDitlPos === 'function' ? anDitlPos(n, 0) : null;
      return p == null ? d : p;
    },
    wL = {
      H1: anHtrPath(dp('DITL-69', 100), dp('DITL-70', 100), dp('DITL-71', 0)),
      H2: anHtrPath(anFv('V-CD1026'), anFv('V-CD1027'), anFv('V-CD1028')),
      H3: anHtrPath(anFv('V-CD1029'), anFv('V-CD1030'), anFv('V-CD1031'))
    };
  U.lpS = { H1: wL.H1.s, H2: wL.H2.s, H3: wL.H3.s };
  U.cdPath = Math.min(wL.H1.p, wL.H2.p, wL.H3.p); /* both the tubes and the bypass of a heater shut = no condensate */
  let tin = lag('in', hw + K.rise * Math.max(0, Math.min(1, ld)));
  const t = { in1: tin };
  for (const [k, P0, ttd, dca, mov] of K.h) {
    const Ps = P0 * ld * thr(pos(mov)),
      ts = anTsatA(Ps),
      tout = lag(k, tin + (wL[k] ? wL[k].s : 1) * Math.max(0, ts - ttd - tin)),
      h = hd.find(x => x.k === k),
      drains = h && h.win > 0.5;
    t[k] = { in: tin, out: tout, Ps, dr: lag(k + 'd', drains ? tin + dca : Math.max(tin, ts)) };
    tin = tout;
  }
  U.lpHt = t;
  U.tt = Object.assign(U.tt || {}, {
    'TT-CD1101': r1(t.H1.in),
    'TT-CD1102': r1(t.H2.in),
    'TT-CD1103-1': r1(t.H3.in),
    'TT-CD1103-2': r1(t.H3.out),
    'TT-CD1122': r1(t.H3.out),
    'TT-HD1102': r1(t.H2.dr),
    'TT-HD1103': r1(t.H3.dr),
    'TT-HD1105': U.hpD1,
    'TT-HD1106': U.hpD2
  });
  anCdTagStep(U, ld);
  anFwTagStep(U);
  anAsTagStep(U, dt);
}
/* 3.2.1 (IRENE, page 05 CONDENSATE): the other condensate transmitters of the page that no sheet reads (AN.unit.tt).
   Sources: 28.png (151.3 MW, MSF 480.3 T/H): hotwell TT-CD1110-1 / -2 40, flash chamber TT-CD1110-4 42, TT-CD1118 40, ejector condenser
   outlet TT-CD1119 41, gland steam condenser outlet TT-CD1120 42 C, LP bypass spray FT-CD1115 0.0 (XV-CD1114 closed, TCV-CD1115 0.2 %
   MANUAL); 02.png (60 MW): FT-CD1122 165.4 T/H, PT-CD1122 3.8 with PT-CD1104 2.2 kg/cm2, TT-CD1104 131 C; IO list FT-CD1115 0 ~ 46 T/H.
     TT-CD1119     hotwell + half of the ejector / gland steam condenser rise of AN_LP (28.png: 40 -> 41 -> 42 C, half each);
     TT-CD1110-4   hotwell + 2 C x load share (28.png 42 vs 40 C: the heater drains that flash in the chamber; NO-SOURCE: the load shape);
     FT-CD1122     the condensate that the deaerator level valve passes (plant.js anCycFlows fda, without the recirculation of FT-CD1120);
     PT-CD1122     deaerator pressure PT-CD1104 + 1.6 kg/cm2 (02.png 3.8 - 2.2; NO-SOURCE: kept the same at every flow, the water column to
                   the deaerator inlet; no CEP = no flow, the column stays);
     TT-CD1104     the storage tank water at the saturation of the deaerator pressure PT-CD1104 (02.png 131 C with 2.2 kg/cm2 = sat 135.6 C:
                   4.6 C under, not modelled);
     FT-CD1115     LP bypass spray: TCV-CD1115 opening (ABC-052 TICHR1012 MV, its airlock AN_AV) x the share of the block valve XV-CD1114
                   (DITL-66) x 46 T/H (NO-SOURCE: the valve capacity taken as the transmitter range of the IO list). */
function anCdTagStep(U, ld) {
  const hw = isFinite(U.cdT) ? U.cdT : isFinite(U.Tamb) ? U.Tamb : 30,
    r1 = x => (isFinite(x) ? Math.round(10 * x) / 10 : null),
    L = Math.max(0, Math.min(1, ld)),
    Pda = U.xt && U.xt.dea ? anUnitVal(U.xt.dea) : NaN,
    f = typeof anCycFlows === 'function' ? anCycFlows(0) : null;
  if (!U.lpbSp) {
    const x = AN.sheets.find(y => y.name === 'ABC-052'),
      c = x && x.S && AN.hmiCtrls ? (AN.hmiCtrls(x.S) || []).find(q => q.tag === 'TICHR1012') : null;
    U.lpbSp = c && c.out != null ? { S: x.S, n: c.out } : { n: null };
  }
  const mv = U.lpbSp.n != null ? Math.max(0, Math.min(100, +U.lpbSp.S.rt.v[U.lpbSp.n] || 0)) : NaN,
    sp = (U.spr || []).find(z => z.v[0] === 'DITL-66'),
    uf = sp && sp.pr.uf != null ? sp.pr.uf : NaN;
  Object.assign(U.tt, {
    'TT-CD1119': r1(hw + (AN_LP.rise * L) / 2),
    'TT-CD1110-4': r1(hw + 2 * L),
    'FT-CD1122': f ? r1(f.fda) : null,
    'PT-CD1122': isFinite(Pda) ? r1(Pda + 1.6) : null,
    'TT-CD1104': isFinite(Pda) && Pda > 0.05 ? r1(steamTsat(Pda)) : isFinite(Pda) ? r1(isFinite(U.Tamb) ? U.Tamb : 30) : null,
    'FT-CD1115': isFinite(mv) && isFinite(uf) ? r1((68 * anAv('TICHR1012', mv) * uf) / 100) : null
  });
}
/* 3.2.1 (IRENE, page 06 FEEDWATER): the turbine extraction, feedwater and spray transmitters of the page that no sheet reads (AN.unit.tt).
   Sources:
     4.PNG (004 EXTRACTION STEAM, 148.8 MW, MSF 472.7 T/H): PT-TS1013 (No.2 extraction) 14.07, PT-TS1017 (No.3 extraction) 5.30 kg/cm2,
       TT-TS1011 (cold reheat to the No.2 HPH) 371 C, FT-FW1059 1.8 T/H with TCV-FW1060 0.1 % MANUAL and XV-FW1061 closed;
     03.png (003 MAIN WATER / STEAM, 150.5 MW, MSF 474.1): PIFW1011 165.4, drum PIBR10011 134.2, PIBR1130 (after SH panel #1) 127.8,
       PIBR1150 (finishing SH inlet) 124.9, PIFW1160 137.7 kg/cm2, TIFW1011 162 C, PIFW1115A / B 6.7 / 7.1 with DPIFW1115A 0.29,
       TICBR1130 MV 57.6 -> TCV-FW1110-1 45.5 / -2 100.7 %, FIQFW1109 37.5; TICBR1150 MV 30.2 -> TCV-FW1120-1 14.9 / -2 99.7 %, FIQFW1119 28.2;
     5.png (005 REHEATER STEAM, 152.5 MW, MSF 482.2): TCV-FW1150 66.0 % AUTO, XV-FW1151 open, FIQFW1149 14.8 T/H;
     control valve data sheets K1AU3-E2-0-123 R1 (PC), items 19 / 20 / 23 / 24 (Copes-Vulcan): TCV-FW1110-1 linear, Cv 0.17 / 3.29 /
       9.49 / 14 at 2 / 25 / 68 / 100 % travel, 35000 kg/h at 165.3 -> 142.2 kg/cm2 g; TCV-FW1110-2 cascade 0.05 / 0.99 / 1.67 at
       6 / 59 / 100 %; TCV-FW1120-1 equal % 0.17 / 2.46 / 8.84 / 15 at 10 / 48 / 75 / 100 %; TCV-FW1120-2 equal % 0.05 / 0.99 / 1.5 at
       19 / 90 / 100 %; the start-up valves (-2) in parallel with the main (-1), each behind its block valve XV-FW1111-1 / -2 (DITL-32 /
       #B), XV-FW1121-1 / -2 (DITL-33 / #B);
     ABC-011 / 012 F(X) LN47 / LN46, LN49 / LN48: the controller MV to valve (1) / (2) (MV 57.6 -> 45.6 / 100, MV 30.2 -> 14.9 / 100).
   How it works:
     PT-TS1013 / 1017   the snapshot pressure x main steam / 472.7 (absolute, a turbine stage, as AN_HP);
     TT-TS1011          the cold reheat temperature of the unit model (anUnitStepX X.T.cr);
     PT-FW1115-A / B    the suction header (plantsw.js sucP) minus the loss of a running pump's branch = its strainer DP (AN_FW fwDp)
                        x 0.4 / 0.29 (03.png: running A 6.7 = idle B 7.1 - 0.4 at strainer DP 0.29; low load check: DP 0.07 -> 4.0 - 0.1
                        = 3.9, PIFW1115A 3.9);
     TT-FW1011          the deaerator water: saturation of PT-CD1104 (the pump heating not modelled; 03.png 162 C);
     PT-FW1160          drum pressure + 3.5 kg/cm2 x (feedwater / 499.1)^2 (03.png 137.7 - 134.2);
     ZT-FW1110 / 1120   the F(X) of the controller MV (its airlock AN_AV: the MV is held without air);
     FT-FW1109 / 1119   0.7674 T/H x (Cv(-1) x XV-1 + Cv(-2) x XV-2) x sqrt(PT-FW1011 - spray point), Cv from the travel by the sheet
                        points; spray point = drum - 6.4 / 9.3 kg/cm2 x (main steam / 474.1)^2 (03.png); 0.7674 from item 19 COND 1. The
                        No.1 spray gives 37.3 T/H at the 03.png point (37.5). The No.2 spray gives 9.6 T/H by its sheet against 28.2 in
                        03.png: UNUSUAL (the equal % curve at 14.9 % travel is far below what flows); calibrated x 2.94 to the snapshot;
     FT-FW1149          14.8 x TCV-FW1150 (TICHR1002 MV) / 66.0 x XV-FW1151 (DITL-35) x sqrt(dp / 130.5) (NO-SOURCE: linear valve, the tap
                        at the pump discharge, dp to the reheat inlet 165.4 - 34.9);
     FT-FW1059          40 T/H x TCV-FW1060 (TICMS1022 MV) x XV-FW1061 (DITL-79) x sqrt(dp / 130.5) (NO-SOURCE: no data sheet, the
                        capacity taken as the IO range; 4.PNG 1.8 T/H at 0.1 % with the block valve closed is not modelled).
   Not on any DCS sheet: XV-TS1700 / 1710 (NO-SOURCE, not modelled). */
/* 3.2.1 (IRENE: page 08 AUX STEAM AND VACUUM; docs/versions/v3.2.1/AUX_STEAM_PLANT_MODEL.md). The values of page 08 that no ABC / DITL
   sheet reads, in AN.unit.tt for the plant page.
   Sources:
     TCS IO list   iolist-tcs HMI_AI: PTST11101 ~ 3 "LP TURBINE EXHAUST HOOD STEAM PRESS. (CONDENSER VACUUM) (A / B / C)" kg/cm2 abs,
                   TEST11101 ~ 3 "LP TURBINE EXHAUST HOOD STEAM TEMP." 0 ~ 150 C, PTGS10011 / 2 "GLAND STEAM SEAL HEADER PRESS." -1 ~ 2
                   kg/cm2g, TEGS1002 "GLAND STEAM SEAL HEADER TEMP.", TEGS1003 "GLAND STEAM SEAL LP INLET TEMP.", ZTGS1034 "STEAM
                   PACKING UNLOADING VALVE POSITION", ZTAS1011 / MVAS1011 "HP TURBINE WARMING VALVE POSITION";
     DCS IO list   STN102 AI0643 TT-AS1015 gland steam desuperheater outlet, AI0706 / AI0720 ZT-AS1020-1 / -2;
     ABC-030       PIC-AS1005 MV -> F(X) LN17 (valve 1) / LN16 (valve 2) (29.PNG MV 4.2 -> 0.1 / 32.2 %; the F(X) gives 0 / 32.3);
     29.PNG 150 MW condenser 0.056 / 0.053 / 0.053 kg/cm2A, hood 38 / 38 / 37 C (= the saturation of the condenser: wet steam on load);
                   gland header 0.32 kg/cm2, TEGS1002 / 1003 364 / 362 C, TT-AS1015 257 C, aux header TT-AS1003 236 C, PV-GS1034
                   42.6 % (the unloading valve spills the HP packing leak-off on load to the No.1 LPH: the plant self-seals);
     PR-OPE-5002   GLAND SEALING: TIAS1015 220 C (cold 150 ~ 260); HP TURBINE WARMING: TCS opens MV-AS1011 to 40 ~ 42 %, closes it at the end.
   How it works:
     PTST11101 ~ 3 = PT-CD1110 (the model condenser U.cdP); TEST11101 ~ 3 = the LP exhaust hood of the TCS model (tcs.js c.Tx, start-up),
     the condenser saturation without it (Start at 150 MW);
     ZT-AS1020-1 / -2 = the F(X) of the PIC-AS1005 MV (held by the airlock without air, AN_AV);
     gland header (in service: the TCS gland sealing, or a turbine on load): 0.32 kg/cm2 = 29.PNG, the TCS steam seal set point is not
     in the docs (CALIBRATED); out of service 0;
     ASSUMED (no load curve in the docs): from no load (fed from the aux steam header, TT-AS1015 = TT-AS1003) to 150 MW (self-sealing, 29.PNG)
     linear in the load: TT-AS1015 + 21 C, TEGS1002 + 107 C over TT-AS1015, TEGS1003 = TEGS1002 - 2, PV-GS1034 42.6 %; the temperatures
     follow with 300 s;
     MV-AS1011 = 40 % while the TCS is in HP TURBINE WARMING (step 0, phase warm), else 0. */
function anAsTagStep(U, dt) {
  const r1 = x => (isFinite(x) ? Math.round(10 * x) / 10 : null),
    r3 = x => (isFinite(x) ? Math.round(1000 * x) / 1000 : null),
    C = U.asC || (U.asC = {}),
    c = U.tc,
    Ta = isFinite(U.Tamb) ? U.Tamb : 30,
    L = Math.max(0, Math.min(1, (+U.MW || 0) / 150)),
    gland = c ? !!c.gland : (U.tb && U.tb.rpm > 100) || (+U.MW || 0) > 0,
    Ps = isFinite(U.cdP) ? anTsatA(U.cdP) : NaN,
    hood = c && isFinite(c.Tx) ? c.Tx : isFinite(Ps) ? Ps : Ta;
  /* PIC-AS1005 MV -> the two valves (ABC-030 F(X)) */
  if (C.S === undefined) {
    const x = AN.sheets.find(y => y.name === 'ABC-030'),
      k = x && x.S && AN.hmiCtrls ? (AN.hmiCtrls(x.S) || []).find(q => q.tag === 'PICAS1005') : null;
    C.S = k && k.out != null ? x.S : null;
    C.n = k ? k.out : null;
    C.f1 = C.S ? C.S.blk.find(b => b.k === 'FX' && b.p && b.p.ln === 'LN17') || null : null;
    C.f2 = C.S ? C.S.blk.find(b => b.k === 'FX' && b.p && b.p.ln === 'LN16') || null : null;
    C.taux = anUnitAIs('2|AI0642');
  }
  let mv = C.S ? Math.max(0, Math.min(100, +C.S.rt.v[C.n] || 0)) : NaN;
  if (AN_AV.hold.PICAS1005) {
    const H = U.avH || (U.avH = {}),
      P = anAvP();
    if (!isFinite(P) || P >= AN_AV.lock || !isFinite(mv)) H['mv:PICAS1005'] = mv;
    else if (H['mv:PICAS1005'] == null || !isFinite(H['mv:PICAS1005'])) H['mv:PICAS1005'] = mv;
    mv = H['mv:PICAS1005'];
  }
  const fx = b => (b && isFinite(mv) ? Math.max(0, Math.min(100, anFXs(b.p, mv).y)) : NaN),
    Taux = anUnitVal(C.taux || []),
    t15 = gland ? (isFinite(Taux) ? Taux : Ta) + 21 * L : Ta,
    tgs = gland ? t15 + 107 * L : Ta,
    lag = (k, x) => (U[k] = isFinite(U[k]) && dt > 0 ? U[k] + ((x - U[k]) * Math.min(dt, 300)) / 300 : x);
  lag('asT15', t15);
  lag('asTgs', tgs);
  Object.assign(U.tt || (U.tt = {}), {
    PTST11101: r3(U.cdP),
    PTST11102: r3(U.cdP),
    PTST11103: r3(U.cdP),
    TEST11101: r1(hood),
    TEST11102: r1(hood),
    TEST11103: r1(hood),
    'ZT-AS1020-1': r1(fx(C.f1)),
    'ZT-AS1020-2': r1(fx(C.f2)),
    'TT-AS1015': r1(U.asT15),
    PTGS10011: gland ? 0.32 : 0,
    PTGS10012: gland ? 0.32 : 0,
    TEGS1002: r1(U.asTgs),
    TEGS1003: r1(U.asTgs - 2 * L),
    'PV-GS1034': gland ? r1(42.6 * L) : 0,
    'ZT-AS1011': c && c.cur === 0 && c.ph === 'warm' ? 40 : 0
  });
}
const AN_FWT = {
  ms0: 472.7,
  ts13: 14.07,
  ts17: 5.3,
  K: 35000 / (9.49 * Math.sqrt(165.3 - 142.2)) / 1000,
  cv: {
    a1: [[0, 0], [2, 0.17], [25, 3.29], [68, 9.49], [100, 14]],
    a2: [[0, 0], [6, 0.05], [59, 0.99], [100, 1.67]],
    b1: [[0, 0], [10, 0.17], [48, 2.46], [75, 8.84], [100, 15]],
    b2: [[0, 0], [19, 0.05], [90, 0.99], [100, 1.5]]
  },
  k2: 2.94
};
function anFwTagStep(U) {
  const K = AN_FWT,
    r1 = x => (isFinite(x) ? Math.round(10 * x) / 10 : null),
    r2 = x => (isFinite(x) ? Math.round(100 * x) / 100 : null),
    ms = Math.max(0, +U.ms || 0),
    stage = P => (P + 1.0332) * (ms / K.ms0) - 1.0332,
    C = U.fwC || (U.fwC = {}),
    sh = n => AN.sheets.find(y => y.name === n),
    ctl = (n, t) => {
      if (C[t] !== undefined) return C[t];
      const x = sh(n),
        c = x && x.S && AN.hmiCtrls ? (AN.hmiCtrls(x.S) || []).find(q => q.tag === t) : null;
      return (C[t] = c && c.out != null ? { S: x.S, n: c.out } : null);
    },
    mvOf = (n, t) => {
      const c = ctl(n, t);
      return c ? Math.max(0, Math.min(100, +c.S.rt.v[c.n] || 0)) : NaN;
    },
    fxs = (n, t, ln) => {
      const k = n + ln;
      if (C[k] === undefined) {
        const x = sh(n),
          c = ctl(n, t);
        C[k] = x && c ? x.S.blk.find(b => b.k === 'FX' && b.p && b.p.ln === ln) || null : null;
      }
      return C[k];
    },
    fx = (n, t, ln, m) => {
      const b = fxs(n, t, ln);
      return b && typeof anFXs === 'function' ? Math.max(0, Math.min(100, anFXs(b.p, m).y)) : NaN;
    },
    pos = n => {
      const p = typeof anDitlPos === 'function' ? anDitlPos(n, 0) : null;
      return p == null ? NaN : p / 100;
    },
    cv = (L, x) => {
      if (!isFinite(x)) return NaN;
      for (let i = 1; i < L.length; i++) if (x <= L[i][0]) return L[i - 1][1] + ((L[i][1] - L[i - 1][1]) * (x - L[i - 1][0])) / (L[i][0] - L[i - 1][0]);
      return L[L.length - 1][1];
    },
    drum = (() => {
      const L = C.drum || (C.drum = anUnitAIs('1|AI0128'));
      return anUnitVal(L);
    })(),
    Pda = U.xt && U.xt.dea ? anUnitVal(U.xt.dea) : NaN,
    ps = typeof window !== 'undefined' && window.WORLD && WORLD.sucP ? WORLD.sucP() : NaN,
    pd = isFinite(U.fwPd) ? U.fwPd : NaN,
    ffw = typeof AN_CYC !== 'undefined' && isFinite(AN_CYC.ffw) ? Math.max(0, AN_CYC.ffw) : 0,
    lf = (ms / 474.1) * (ms / 474.1),
    sq = P => (isFinite(pd) && isFinite(P) ? Math.sqrt(Math.max(0, pd - P)) : NaN);
  /* the spray valves follow their controller MV, held by the airlock without air (AN_AV) */
  const H = U.avH || (U.avH = {}),
    held = (t, m) => {
      if (!AN_AV.hold[t]) return m;
      const P = anAvP();
      if (!isFinite(P) || P >= AN_AV.lock || !isFinite(m)) return (H['mv:' + t] = m);
      if (H['mv:' + t] == null || !isFinite(H['mv:' + t])) H['mv:' + t] = m;
      return H['mv:' + t];
    },
    m1 = held('TICBR1130', mvOf('ABC-011', 'TICBR1130')),
    m2 = held('TICBR1150', mvOf('ABC-012', 'TICBR1150')),
    z11 = fx('ABC-011', 'TICBR1130', 'LN47', m1),
    z12 = fx('ABC-011', 'TICBR1130', 'LN46', m1),
    z21 = fx('ABC-012', 'TICBR1150', 'LN49', m2),
    z22 = fx('ABC-012', 'TICBR1150', 'LN48', m2),
    w1 = K.K * (cv(K.cv.a1, z11) * pos('DITL-32') + cv(K.cv.a2, z12) * pos('DITL-32 #B')) * sq(drum - 6.4 * lf),
    w2 = K.k2 * K.K * (cv(K.cv.b1, z21) * pos('DITL-33') + cv(K.cv.b2, z22) * pos('DITL-33 #B')) * sq(drum - 9.3 * lf),
    Prh = isFinite(U.Prh) ? U.Prh : 0,
    dr = isFinite(pd) ? Math.sqrt(Math.max(0, pd - Prh) / (165.4 - 34.9)) : NaN,
    wrh = (29.5 * held('TICHR1002', mvOf('ABC-019', 'TICHR1002'))) / 100 * pos('DITL-35') * dr /* 29.5 T/H at 100 %, Cv 6.2, dp 34, L21 */,
    whp = (67 * held('TICMS1022', mvOf('ABC-051', 'TICMS1022'))) / 100 * pos('DITL-79') * dr /* 67 T/H at 100 %, Cv 10.3, dp 61, L21 */,
    cr = U.xt && U.xt.T ? U.xt.T.cr : NaN;
  Object.assign(U.tt || (U.tt = {}), {
    'PT-TS1013': ms > 0 ? r2(Math.max(-1, stage(K.ts13))) : r2(0),
    'PT-TS1017': ms > 0 ? r2(Math.max(-1, stage(K.ts17))) : r2(0),
    'TT-TS1011': r1(cr),
    'PT-FW1115-A': isFinite(ps) ? r1(ps - ((U.fwDp0 || 0) * 0.4) / 0.29) : null,
    'PT-FW1115-B': isFinite(ps) ? r1(ps - ((U.fwDp1 || 0) * 0.4) / 0.29) : null,
    'TT-FW1011': isFinite(Pda) ? r1(Pda > 0.05 ? steamTsat(Pda) : isFinite(U.Tamb) ? U.Tamb : 30) : null,
    'PT-FW1160': isFinite(drum) ? r1(drum + 3.5 * (ffw / 499.1) * (ffw / 499.1)) : null,
    'ZT-FW1110-1': r1(z11),
    'ZT-FW1110-2': r1(z12),
    'ZT-FW1120-1': r1(z21),
    'ZT-FW1120-2': r1(z22),
    'FT-FW1109': r1(w1),
    'FT-FW1119': r1(w2),
    'FT-FW1149': r1(wrh),
    'FT-FW1059': r1(whp)
  });
}
const AN_LO = { UA: 95.8, Co: 64.5, Qb: 1032, Wmax: 170, M: 25800, Tamb: 30 };
function anLubeCoolStep(U, dt) {
  const K = AN_LO,
    sp = Math.max(0, Math.min(1, (U.tb ? U.tb.rpm : 0) / 3600)),
    flow = (+U.loBrg || 0) > 1.05,
    mv = U.loMv ? Math.max(0, Math.min(100, anAv('TICLO1002', +U.loMv.S.rt.v[U.loMv.n] || 0))) : 53.1,
    acw = Math.max(0, Math.min(1, (+U.acQ || 0) / 1500)),
    W = (K.Wmax * mv * acw) / 100 /* T/H */,
    Cw = (W * 1000 * 4.18) / 3600,
    Tw = isFinite(U.acT2) ? U.acT2 : K.Tamb,
    Qb = flow ? K.Qb * sp : 0;
  let q = 0;
  const hx = Ti => {
    if (!flow || !(Cw > 0)) return 0;
    const cmin = Math.min(K.Co, Cw),
      cr = cmin / Math.max(K.Co, Cw),
      ntu = K.UA / cmin,
      e = Math.abs(1 - cr) > 1e-6 ? (1 - Math.exp(-ntu * (1 - cr))) / (1 - cr * Math.exp(-ntu * (1 - cr))) : ntu / (1 + ntu);
    return Math.max(0, e * cmin * (Ti - Tw));
  };
  /* the first step after a starting state: at its steady value (bisection on the return temperature) */
  if (!isFinite(U.loTr)) {
    let a = Tw,
      b = 120;
    if (Qb > 0 && hx(b) > Qb)
      for (let i = 0; i < 40; i++) {
        const m = (a + b) / 2;
        if (hx(m) < Qb) a = m;
        else b = m;
      }
    U.loTr = Qb > 0 && Cw > 0 ? (a + b) / 2 : Math.max(Tw, K.Tamb);
  }
  q = hx(U.loTr);
  U.loTr += ((Qb - q) * dt) / K.M;
  if (!flow) U.loTr += ((K.Tamb - U.loTr) * Math.min(dt, 3600)) / 3600; /* no circulation: the tank goes to the room */
  U.loTr = Math.max(0, Math.min(99, U.loTr));
  U.loCoolOut = flow ? U.loTr - q / K.Co : U.loTr;
  U.loCwF = Math.round(W);
  U.loCwOut = Cw > 0 ? Tw + q / Cw : Tw;
  U.loQ = Math.round(q);
  for (const L of U.lo || []) anUnitWrite(L, U.loCoolOut);
}
/* 3.2.0 live test #54: MOTOR BEARING / WINDING TEMPERATURE AND VIBRATION of the seawater pumps P-1501A / B / C, the aux. cooling water
   pumps P-1108A / B and the ID fan (I/O list STN103: TT-SW1501-x3 / x4 / xU / xV / xW AI0720 ~ 0758, VT-SW1501-x1 / x2; TT-CW1108-x3 /
   x4 / xU / xV / xW AI0912 ~ 0932; TT-FG1056-1 ~ 4 / U / V / W AI0672 ~ 0678, VT-FG1056-1 ~ 4 AI0528 ~ 0531). PR-OPE-5002 2.19 / 2.21
   / 2.27 (TI SW1501A3 / A4, VI SW1501A1 / A2) and 22.13 ~ 22.15 ask the operator to read them. No curve of the motors in the repository:
     running      bearing to 55 C (ASSUMED) with a 30 min time constant, winding to 85 C (ASSUMED) with 15 min; vibration 1.8 mm/s (pumps)
                  / 2.2 mm/s (IDF) (ASSUMED) at once;
     stopped      back to the ambient 30 C with twice the time constant, vibration 0.1 mm/s;
     each element +0 ~ 2.5 C / +0 ~ 0.3 mm/s of its own (ASSUMED) so that two elements are not one number.
   Limits (alarm list "Alarm List _20160912" TE / VT): SWP bearing H 95 / HH 100, winding H 145 / HH 155, vibration H 7.6 / HH 11.9;
   ACWP bearing H 95 / HH 100, winding H 155 / HH 165 (DITL-76 / 77 rows 13 ~ 17 "> 100" / "> 165 C", plantsw.js); IDF bearing H 90 /
   HH 95 (< 80 / 82 start permissive), winding H 140 / HH 145 (< 130), vibration H 8 / HH 11 mm/s (< 8). U.mt = { tag: value } */
const AN_MT = {
  m: [
    ['SWP-A', 'M.3353', 'SW1501-A', ['3', '4'], ['1', '2'], 1.8],
    ['SWP-B', 'M.3354', 'SW1501-B', ['3', '4'], ['1', '2'], 1.8],
    ['SWP-C', 'M.3355', 'SW1501-C', ['3', '4'], ['1', '2'], 1.8],
    ['ACWP-A', 'DITL-76', 'CW1108-A', ['3', '4'], [], 1.8],
    ['ACWP-B', 'DITL-77', 'CW1108-B', ['3', '4'], [], 1.8],
    ['IDF', 'IDF', 'FG1056-', ['1', '2', '3', '4'], ['1', '2', '3', '4'], 2.2],
    /* 3.2.1 (IRENE, SEULGI finding): PAF / SAF (DITL-26B / 27B rows 5 ~ 15) and the FA blowers A / B (DITL-28B and its #B, rows 1 ~ 14):
       motor and fan bearings 1 ~ 4, windings U / V / W, vibration 1 ~ 4; the same NO-SOURCE running values as the IDF (no snapshot or
       vendor value of these temperatures in the repository; the DITL comparators: bearing 90 / 95, winding 145 C, FA blower 110 / 120 /
       155 C) */
    ['PAF', 'DITL-26A', 'FA1053-', ['1', '2', '3', '4'], ['1', '2', '3', '4'], 2.2],
    ['SAF', 'DITL-27A', 'FA1054-', ['1', '2', '3', '4'], ['1', '2', '3', '4'], 2.2],
    ['FAB-A', 'DITL-28A', 'FA1055-A', ['1', '2', '3', '4'], ['1', '2', '3', '4'], 2.2],
    ['FAB-B', 'DITL-28A #B', 'FA1055-B', ['1', '2', '3', '4'], ['1', '2', '3', '4'], 2.2]
  ],
  Tb: 55,
  Tw: 85,
  tauB: 1800,
  tauW: 900,
  vib0: 0.1
};
function anMotorStep(U, dt) {
  const K = AN_MT,
    T0 = isFinite(U.Tamb) ? U.Tamb : 30,
    mt = U.mt || (U.mt = {}),
    lag = (k, x, tau) => (mt[k] = isFinite(mt[k]) ? mt[k] + ((x - mt[k]) * Math.min(dt, tau)) / tau : x);
  for (const [, ad, base, brg, vib, v1] of K.m) {
    const run = ad === 'IDF' ? !U.idf || +U.idf.S.rt.v[U.idf.n] > 0.5 : /^DITL/.test(ad) ? anDitlRun(ad) === 1 : srcBit([ad]) > 0.5;
    brg.forEach((e, i) => lag('TT-' + base + e, run ? K.Tb + 1.2 * i : T0, run ? K.tauB : 2 * K.tauB));
    ['U', 'V', 'W'].forEach((e, i) => lag('TT-' + base + e, run ? K.Tw + 1.0 * i : T0, run ? K.tauW : 2 * K.tauW));
    vib.forEach((e, i) => (mt['VT-' + base + e] = run ? v1 + 0.1 * i : K.vib0));
  }
}
/* 3.2.1 (IRENE: INSTRUMENT AND PLANT AIR plant model from the vendor data; docs/versions/v3.2.1/AIR_PLANT_MODEL.md; replaces the
   3.2.0-beta.68 fixed rates). The compressed air systems of flow diagram K1AU3-PD-023 Rev C sheet 1/6 (plant air) and 2/6 (instrument
   air): compressors C-0703A / B / C (PA) or C-0704A / B / C (IA) -> dryers D-0703A ~ C / D-0704A ~ C (DITL-45 and its machine instances
   #B / #C) -> air tanks T-0705A / B or T-0706A / B -> unit 1 (PT-PA1705 / PT-IA1706), unit 2 and the utility area.
   Sources:
     compressors  K1AU3-D1-0-059 (IHI): turbo compressors with the constant pressure control loop (PIC, inlet guide vane), the anti-surge
                  loop (blow-off valve) and the motor overload loop (flow sheets HT225374 PA "TRE60-600kW TURBO COMPRESSOR", HT225405 IA
                  "T2A TYPE TURBO COMP."); discharge transmitter PT-1DA 0 ~ 1.5 MPa;
     PA motor     TECO 3A057H186-74409: 900 HP, 2 pole, 6600 V, 69.9 A at 100 % load, LRC 560 A, soft start; winding RTD alarm 145 /
                  trip 155 C, temperature rise limit 80 C (class F);
     IA motor     TECO-YASKAWA FELA-8T 190 kW CONT 460 V 2 P (outline P1309238 RATINGS; the thermal sheet says 165 kW): 286 A at 190 kW; starting current with a reactor 80 % tap
                  532 % (the torque / current curve);
     tanks        D1-0-059 document index and PD-023: T-0705A / B 10 m3 (PA), T-0706A / B 5 m3 (IA), max. working pressure 0.98 MPa;
     pressure     PR-OPE-5002 "Ensure Plant Air Compressor is running and compressed air pressure is up to 7 Kg/cm2"; 39.PNG 7.0;
     alarm list   tanks and unit header L 5.0, IA LL 3.5, PSL-IA1706 / PSL-PA1705 2.8 kg/cm2;
     I/O list     ranges 0 ~ 10 kg/cm2, dryer outlet flow 0 ~ 2700 (IA) / 0 ~ 5800 (PA) m3/h, compressor current 0 ~ 500 (IA) / 0 ~ 140
                  (PA) A (the transmitter holds its range top).
   How it works (per system):
     compressor   runs when the logic gives its START COMMAND (DITL-113 / 114 output rows 56 / 63 / 70 = M.0300 / M.0310 AND NOT
                  RUNNING AND NOT TRIP, 5 s pulse; the local panel starts it when it is in REMOTE) or when the field operator starts it at
                  the local panel; it stops on its TRIP contact (rows 7 / 14 / 21, a field trip of the test tool). The model owns the RUNNING
                  contact (rows 6 / 13 / 20, I.0015 / I.0095 / I.0335 IA, I.0010 / I.0090 / I.0330 PA): the logic reads it (DITL-42
                  "COMPRESSOR STOPPED", the auto start). The state of the scenario (Start at 150 MW, Cold) is taken at its first step;
     tanks        one header: dP/dt = (Q in - Q use) x 1.033 / V / 3600 (isothermal, free air m3/h, V of both tanks); the PIC holds 7.0:
                  at 7.0 the compressors give only the use, below it each gives its capacity;
     use          the consumption at 7.0 (NO-SOURCE: IA 1200, PA 1500 m3/h, as 3.2.0-beta.68) through fixed openings: proportional to the
                  absolute pressure;
     capacity     Mass Balance Diagram K1AU3-MB-023 (A2-0-001 Rev A) sheets 1/2 and 2/2, items 2 / 4 / 6: PA 5100 Nm3/h, IA 1500 Nm3/h
                  per compressor (the MB operating point has 2 running: 10200 / 3000; the SOP and the snapshot have 1); IA power at full
                  flow 176 kW = 1500 m3/h at the PA ratio 600 kW / 85 m3/min (NO-SOURCE ratio, the IA compressor power is not in the docs);
     power        proportional to the compressor flow, not below the surge flow (the anti-surge loop blows off the rest): 70 % of the
                  capacity (NO-SOURCE); 100 % = PA 600 kW (TRE60-600kW), IA 176 kW (above);
     current      the motor current at 100 % times kW / kW 100 % (PA 69.9 A at 671 kW = 900 HP; IA 286 A at 190 kW); start: PA soft start
                  3 x 69.9 A for 10 s (NO-SOURCE: the current limit of the soft starter), IA 532 % x 286 A for 3 s (NO-SOURCE: the time);
     winding T    PA motor (TE-M0703-x1, I/O list): 30 C + 80 C x (I / 69.9)^2 (the rise limit of the spec at full load), 10 min;
     unit header  the tank pressure less 0.2 kg/cm2 at the design use (NO-SOURCE), with the use squared;
     dryer outlet the tank pressure plus 0.15 kg/cm2 at the design use (NO-SOURCE), with the flow squared; flow over the dryers in
                  service, over the three while none is (their inlet valves stay open). */
const AN_AIR = {
  P: 7.0,
  Pa: 1.033,
  loss: 0.2,
  dD: 0.15,
  fs: 0.7,
  fU: 0.5 /* NO-SOURCE: the share of unit 1 in the use (unit 1, unit 2, utility area; no consumption list in the docs) */,
  Kx: 1500 /* free air m3/h at 1 kg/cm2 difference, V-PA0013 6" fully open (NO-SOURCE) */,
  sys: {
    ia: { c: 'DITL-113', d: '@14', iso: 'V-IA1101', V: 10, Qc: 1500, Qd: 1200, kW: 176, I100: 286, kW100: 190, Ist: 286 * 5.32, tSt: 3, Imax: 500 },
    pa: { c: 'DITL-114', d: '@3', iso: 'V-PA1087', V: 20, Qc: 5100, Qd: 1500, kW: 600, I100: 69.9, kW100: 671, Ist: 3 * 69.9, tSt: 10, Imax: 140 }
  },
  rows: [5, 12, 19],
  dry: ['DITL-45', 'DITL-45 #B', 'DITL-45 #C'],
  Tw: [30, 80, 600],
  tauI: 1
};
/* 3.2.1 (IRENE): the pneumatic valves on the instrument air of unit 1 (U.iaPU = PT-IA1706). Source: FHI control valve package
   K1AU3-E2-0-123 R1 "Drawing of Control valve" (as built, on the user's PC: instrument-engineer-data-asbuilt), one specification
   sheet per valve (Actuator: Action, Air Pressure Available / Required, Spring Precompression, Pressure @ Full Valve Travel;
   Accessories: Airlock, Solenoid Valve):
     modulating valves with an airlock (RK 2-8 kg/cm2G; the Siemens sheets of LCV-MU1110, FCV-CD1120, LCV-HD1101 ~ 1103 add "Air fail
     fixed at 3.5 kg/cm2g"), a lock-up valve (TCV-FW1110-1 / -2: SMC IL-201) or a double acting piston "Fail in Place"
     (LCV-CD1104, FCV-FW1130-1) STAY WHERE THEY ARE below the lock pressure: the command of the DCS still moves (the PID winds up),
     the valve does not. The lock pressure 3.5 kg/cm2g is the one printed on the Siemens sheets; the Copes sheets give the
     airlock RK 2-8 (the adjustable range) without the set point, and the SMC IL-201 sheet none: 3.5 is used for them too (NO-SOURCE
     set point, same airlock model).
     on / off valves (XV, a solenoid that vents the actuator, no airlock) go to their SPRING position as the air goes: "Spring
     Opening (Direct)" = open without air, "Spring Closing (Reverse)" = closed without air. The actuator gets the header through
     the filter regulator SMC AW40 set to 3.5 kg/cm2g ("Air Pressure Available"): its travel away from the spring position is
     (pressure - spring precompression) / (pressure at full travel - precompression), the two pressures of each sheet (bar g).
     The DITL netlist agrees with every sheet: the coil is inverted (energised = closed) exactly on the spring opening valves.
     XV-FW1111-1 / XV-FW1121-1 have an airlock (SMC VSA 3-way): they stay in place (3.5, NO-SOURCE set point).
   Not in the package (no sheet: they keep following their command): PCV-MS1020 / PCV-HR1010 bypass, TCV-FW1060 / FW1150,
   PCV-AS1010, TCV-CD1115 / 1124 / 1126, XV-FW1151, XV-HR1010-1, XV-CR1013, the air dampers. */
const AN_AV = {
  lock: 3.5,
  reg: 3.5,
  bar: 0.980665 /* bar per kg/cm2 */,
  /* controller (its MV is the valve command) -> the valve and its sheet (item of the package index) */
  hold: {
    LICCD1110A: 'LCV-MU1110 (item 17, airlock RK 2-8, fail fixed 3.5)',
    FICCD1120: 'FCV-CD1120 (item 18, airlock RK 2-8, fail fixed 3.5)',
    LICCD1104: 'LCV-CD1104 (item 14, double acting, fail in place, airlock RK 2-8 x2)',
    LICCD1110B: 'LCV-CD1110 (item 15, airlock RK 2-8)',
    FICCD1121: 'FCV-CD1121 (item 11, airlock RK 2-8)',
    PICCD1104: 'PCV-AS1030 (item 8, airlock RK 2-8)',
    PICAS1005: 'PCV-AS1020-1 / -2 (items 6 / 7, airlock RK 2-8)',
    PICMS1002: 'PCV-MS1001 (item 1, fail fixed, airlock Fisher 167DA, air fail fixed at 3.5)',
    PICSB1052: 'PCV-SB1053 (item 9, airlock RK 2-8)',
    TICBR1130: 'TCV-FW1110-1 / -2 (items 19 / 20, lock-up valve SMC IL-201)',
    TICBR1150: 'TCV-FW1120-1 / -2 (items 23 / 24, airlock RK 2-8)',
    FICFW1007: 'FCV-FW1130-1 (item 27, double acting, fail in place, airlock RK 2-8 x2)',
    LICBR1001B: 'FCV-FW1130-2 (item 28, airlock RK 2-8)',
    LICHD11011: 'LCV-HD1101-1 (item 29, airlock RK 2-8, fail fixed 3.5)',
    LICHD11012: 'LCV-HD1101-2 (item 30, airlock RK 2-8, fail fixed 3.5)',
    LICHD11021: 'LCV-HD1102-1 (item 31, airlock RK 2-8, fail fixed 3.5)',
    LICHD11022: 'LCV-HD1102-2 (item 32, airlock RK 2-8, fail fixed 3.5)',
    LICHD11031: 'LCV-HD1103-1 (item 33, airlock RK 2-8, fail fixed 3.5)',
    LICHD11032: 'LCV-HD1103-2 (item 34, airlock RK 2-8, fail fixed 3.5)',
    LICHD11051: 'LCV-HD1105-1 (item 35, airlock RK 2-8)',
    LICHD11052: 'LCV-HD1105-2 (item 36, airlock RK 2-8)',
    LICHD11061: 'LCV-HD1106-1 (item 37, airlock RK 2-8)',
    LICHD11062: 'LCV-HD1106-2 (item 38, airlock RK 2-8)',
    TICLO1002: 'TCV-CW1201 (item 40, airlock RK 2-8)',
    PICDO0005: 'PCV-DO0002 (item 41, airlock RK 2-8)',
    PICDO1008: 'PCV-DO1009 (item 42, airlock RK 2-8)',
    HICDO1012: 'FCV-DO1012 (item 43, airlock RK 2-8)'
  },
  /* on / off valves by the tag of the DITL solenoid: spring position (100 open / 0 closed, or 'hold'), precompression and full
     travel pressures (bar g; the psig of the Siemens sheets x 0.0689) */
  sv: {
    MS1011: [100, 1.586, 2.62] /* item 2: 23 / 38 psig */,
    MS1023: [100, 0.6, 1.1] /* item 3 */,
    CR1011: [100, 0.4, 2.1] /* item 4 */,
    CR1012: [100, 0.4, 2.1],
    HR1021: [100, 2.0, 3.1] /* item 5 */,
    HR1022: [100, 2.0, 3.1],
    SB1054: [0, 2.2, 3.0] /* item 10, spring closing */,
    SB1059: [0, 2.2, 3.0],
    CD1005: [100, 0.276, 0.896] /* item 12: 4 / 13 psig */,
    CD1006: [100, 0.276, 1.103] /* item 13: 4 / 16 psig */,
    'CD1104-2': [100, 0.621, 1.448] /* item 16: 9 / 21 psig */,
    'FW1111-1': ['hold'] /* item 21, airlock SMC VSA 3-way */,
    'FW1121-1': ['hold'] /* item 25 */,
    MU1109: [100, 1.0, 1.9] /* item 39 */,
    FS1005: [100, 0.6, 1.7] /* item 44 */,
    CD1004: [100, 0.276, 1.931] /* item 45: 4 / 28 psig */
  }
};
/* the unit header pressure the valves see (kg/cm2), NaN while the plant model is OFF or the air model has not run */
function anAvP() {
  if (typeof AN_UNIT === 'undefined' || !AN_UNIT.on) return NaN;
  const P = +AN_UNIT.iaPU;
  return isFinite(P) ? P : NaN;
}
/* the opening that reaches the process for the command x of controller tag: held below the lock pressure */
function anAv(tag, x) {
  if (!tag || !AN_AV.hold[tag]) return x;
  const P = anAvP(),
    H = AN_UNIT.avH || (AN_UNIT.avH = {});
  if (!isFinite(P) || P >= AN_AV.lock || !isFinite(x)) {
    H[tag] = x;
    return x;
  }
  if (H[tag] == null || !isFinite(H[tag])) H[tag] = x;
  return H[tag];
}
/* the target position (0 ~ 100) of the DITL solenoid valve tag commanded open (want) at position pos; null = not an air valve of the package */
function anAvSv(tag, want, pos) {
  const d = tag && AN_AV.sv[tag];
  if (!d) return null;
  const P = anAvP(),
    cmd = want ? 100 : 0;
  if (!isFinite(P)) return cmd;
  if (d[0] === 'hold') return P >= AN_AV.lock ? cmd : pos;
  const pb = Math.min(P, AN_AV.reg) * AN_AV.bar,
    f = Math.max(0, Math.min(1, (pb - d[1]) / (d[2] - d[1])));
  return d[0] + (cmd - d[0]) * f;
}
/* an input row of a DITL drawing (a field contact: the RUNNING / TRIP of a compressor set at its local panel); null while no world */
function anDitlIn(name, row) {
  try {
    if (typeof S === 'undefined' || !S.sheets || !window.WORLD || !WORLD.on || !window.DUI) return null;
    const C = AN_UNIT._dr || (AN_UNIT._dr = {});
    let s = C[name];
    if (!s) {
      s = S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(name)) || null;
      if (s) C[name] = s;
    }
    return s ? (DUI.rowVal(s, row) ? 1 : 0) : null;
  } catch (e) {
    return null;
  }
}
/* 3.2.1: the sheet of a DITL drawing (or machine instance) by its name, for the contacts the plant model owns */
function anDitlSheet(name) {
  try {
    if (typeof S === 'undefined' || !S.sheets || !window.WORLD || !WORLD.on || !window.DUI) return null;
    const C = AN_UNIT._dr || (AN_UNIT._dr = {});
    let s = C[name];
    if (!s) {
      s = S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(name)) || null;
      if (s) C[name] = s;
    }
    return s;
  } catch (e) {
    return null;
  }
}
function anAirStep(U, dt) {
  const K = AN_AIR,
    lag = (k, x, tau) => (U[k] = isFinite(U[k]) ? U[k] + ((x - U[k]) * Math.min(dt, tau)) / tau : x);
  /* 3.2.1 the cross-tie PA -> IA tanks V-PA0013 (PD-023, field valve, normally closed): free air = Kx x opening x sqrt(PA - IA) while the
     PA tanks are higher (check valve), the pressures of the step before */
  const dX = (+U.paP || 0) - (+U.iaP || 0),
    qx = anFv('V-PA0013') > 0 && dX > 0 ? (K.Kx * anFv('V-PA0013') * Math.sqrt(dX)) / 100 : 0;
  U.xQ = Math.round(qx);
  for (const k in K.sys) {
    const Y = K.sys[k],
      xin = k === 'ia' ? qx : -qx,
      iso = anFv(Y.iso) > 0,
      s = anDitlSheet(Y.c),
      trip = K.rows.map(r => anDitlIn(Y.c, r + 1) || 0),
      dry = K.dry.map(d => anDitlRun(d + Y.d) || 0),
      nd = dry.reduce((a, b) => a + b, 0);
    /* the compressors: the state of the scenario at the first step, then the START COMMAND of the logic (only a compressor whose
       local panel is in REMOTE), its TRIP contact, and a start / stop at the local panel (the field operator writes the RUNNING
       contact: guide.js LS_DOCK.fieldRow, PR-OPE-5002 "Ensure the compressor is in Local Position ... Initiate RUN") */
    let run = U[k + 'Run'];
    if (!Array.isArray(run)) {
      if (!s) continue;
      run = U[k + 'Run'] = K.rows.map(r => anDitlIn(Y.c, r) || 0);
      U[k + 'Ts'] = K.rows.map(() => 1e9);
      U[k + 'Wr'] = run.slice();
      /* the control location of the local panel is not a DCS signal (D1-0-059 Modbus flag "Control Location", NO-SOURCE): in
         service = the running compressor and the next one in REMOTE (the standby of the auto start); Cold = all in LOCAL */
      const j = run.indexOf(1),
        sb = j < 0 ? -1 : [1, 2].map(d => (j + d) % run.length).find(i => !run[i]);
      U[k + 'Rem'] = run.map((r, i) => (r || i === sb ? 1 : 0));
    }
    const ts = U[k + 'Ts'] || (U[k + 'Ts'] = K.rows.map(() => 1e9)),
      wr = U[k + 'Wr'] || (U[k + 'Wr'] = run.slice()),
      rem = U[k + 'Rem'] || (U[k + 'Rem'] = K.rows.map(() => 0));
    K.rows.forEach((r, i) => {
      const fld = s ? (s.sig[r + ':S'] ? 1 : 0) : wr[i];
      if (fld !== wr[i]) {
        run[i] = fld; /* the field operator at the local panel */
        if (fld) ts[i] = 0;
      }
      if (trip[i]) run[i] = 0;
      else if (!run[i] && rem[i] && s && DUI.outVal(s, r) === 1) {
        run[i] = 1;
        ts[i] = 0;
      }
      if (run[i]) ts[i] += dt;
      wr[i] = run[i];
      if (s) s.sig[r + ':S'] = !!run[i]; /* the RUNNING contact of the local panel */
    });
    const on = run.map((r, i) => (r && ts[i] >= Y.tSt ? 1 : 0)),
      n = on.reduce((a, b) => a + b, 0);
    U[k + 'N'] = run.reduce((a, b) => a + b, 0);
    run.forEach((r, i) => (U[k + 'R' + i] = r));
    trip.forEach((r, i) => (U[k + 'T' + i] = r));
    dry.forEach((r, i) => (U[k + 'D' + i] = r));
    /* the tanks */
    const P0 = isFinite(U[k + 'P']) ? Math.max(0, U[k + 'P']) : 0,
      use = ((Y.Qd * (P0 + K.Pa)) / (K.P + K.Pa)) * (iso ? 1 : 1 - K.fU);
    let P = P0 + (((n * Y.Qc + xin - use) * K.Pa) / Y.V / 3600) * dt,
      qin = n * Y.Qc;
    if (n && P >= K.P) {
      P = K.P; /* the constant pressure loop of the compressor panel */
      qin = Math.max(0, use - xin);
    }
    P = Math.max(0, P);
    U[k + 'P'] = P;
    U[k + 'PA'] = U[k + 'PB'] = P;
    U[k + 'Q'] = qin;
    U[k + 'Use'] = use;
    /* the unit 1 header: through its isolation valve (V-IA1101 / V-PA1087); closed = the unit users bleed it down (NO-SOURCE: 60 s) */
    if (iso) U[k + 'PU'] = Math.max(0, P - K.loss * (use / Y.Qd) ** 2);
    else lag(k + 'PU', 0, 60);
    U[k + 'Iso'] = iso ? 1 : 0;
    U[k + 'PD'] = P + K.dD * (qin / Y.Qd) ** 2;
    dry.forEach((r, i) => lag(k + 'F' + i, qin && (nd ? r : 1) ? qin / (nd || dry.length) : 0, 3));
    /* the motors */
    run.forEach((r, i) => {
      const f = on[i] ? Math.max(K.fs, qin / n / Y.Qc) : 0,
        kW = f * Y.kW,
        I = !r ? 0 : ts[i] < Y.tSt ? Y.Ist : (Y.I100 * kW) / Y.kW100;
      U[k + 'Kw' + i] = Math.round(kW * 10) / 10;
      lag(k + 'Im' + i, I, K.tauI);
      U[k + 'I' + i] = Math.min(Y.Imax, U[k + 'Im' + i]); /* IT-C070xx: the range of the transmitter */
      if (k === 'pa') lag('paW' + i, K.Tw[0] + K.Tw[1] * (I / Y.I100) ** 2, K.Tw[2]);
    });
  }
}
function anUnitOwns(T, ids) {
  const U = AN_UNIT;
  return U.on && ids && ids.length && ids.some(id => U.own.has(T.rt.st[id]));
}
/* 2.2.0-beta.16: a PV that is an input of the sheet and that the unit model links from another sheet (ABC-054 PICHR1391 <- ABC-052
   SI0180): the loop model of that controller does not write it */
function anUnitOwnsPv(S, n) {
  const U = AN_UNIT;
  return U.on && n != null && (U.alink || []).some(([a, t]) => t.S === S && t.n === n);
}
/* one step of dt seconds (called by the plant step of ABC-001C) */
function anUnitStep(dt) {
  const M = (typeof globalThis !== 'undefined' ? globalThis : window).LS_SIMM;
  if (M) M.on = ++M.n;
  try {
    anUnitStep0(dt);
  } finally {
    if (M) M.on = 0;
  }
}
function anUnitStep0(dt) {
  const U = AN_UNIT;
  if (!U.on || !(dt > 0)) return;
  const S = U.S,
    v = S.rt.v;
  /* coal of the three feeders (T/H) -> steam made in the drum (T/H), first order */
  /* 2.2.0-beta.14: + the oil of the start-up burners (ao x coal); the offset of the firing line fades out below 30 % of the anchor coal */
  /* 3.2.0 P1 #6: the coal of a feeder through its outlet discharge valve (DITL-20) */
  const F = U.fuel.reduce((a, l, i) => {
      const o = U.cfo ? anDitlPos(U.cfo[i], 0) : null;
      return a + (anUnitVal(l) || 0) * (o == null ? 1 : o / 100);
    }, 0),
    oil = (U.oilN || []).reduce((a, x) => a + Math.max(0, +x.S.rt.v[x.n] || 0), 0),
    bf = Math.max(0, Math.min(1, (U.Tb - U.Tburn0) / (U.Tburn1 - U.Tburn0))),
    Fe = bf * F + U.ao * oil,
    Qss = Math.max(0, U.a * Fe + (U.m0 - U.a * U.F0) * Math.min(1, Fe / (0.3 * U.F0)));
  U.oilF = oil;
  U.burn = bf;
  U.unb = F * (1 - bf);
  U.Fc = F; /* 3.2.0-beta.14: coal of the feeders (source.js: SOx) */
  U.Qs += ((Qss * (isFinite(U.hpFac) ? U.hpFac : 1) - U.Qs) * dt) / U.tauF;
  /* ---- 2.2.0-beta.12 (M3): station wiring S2 -> S1, turbine trip ---- */
  for (const [a, tg] of U.bcast || []) {
    const x = a.S.rt.force[a.n] !== undefined ? a.S.rt.force[a.n] : a.S.rt.ext[a.n];
    if (x === undefined) continue;
    for (const t of tg) if (t.S.rt.force[t.n] === undefined && t.S.rt.ext[t.n] !== x) t.S.rt.ext[t.n] = x;
  }
  for (const [a, t] of U.alink || []) {
    const x = +a.S.rt.v[a.n];
    if (isFinite(x) && t.S.rt.force[t.n] === undefined) t.S.rt.ext[t.n] = x;
  }
  /* 3.2.0-beta.15: condenser vacuum (see AN_UNIT vacUp): with no seawater or condensate pump the TCS trips the turbine on LOW VACUUM */
  {
    const cw = srcBit(['M.3353', 'M.3354', 'M.3355']) && srcBit(['M.3350', 'M.3351']) ? 1 : 0;
    if (!isFinite(U.vac)) U.vac = 1;
    /* raised by the vacuum pumps at a steady rate, lost first order. 3.2.0-beta.37 (CHECKLIST 0.5, user 2026-10-25 "bakit wala ang
       vacuum up at gland steam at auxiliary steam"): PR-OPE-5002 VACUUM UP needs the steam ejectors and the gland sealing, both on
       the auxiliary steam ("Auxiliary steam pressure is > 10 Kg/cm2"), and the aux steam is taken from the main steam ("AUXILLIARY
       WARMING UP, REQUIREMENT: MS Pressure > 12 Kg/cm2", MV-AS1391). No aux steam: the vacuum does not rise (it is held, not lost) */
    /* 3.2.0-beta.38: with the TCS model (tcs.js) the ejectors raise the vacuum: aux steam > 10, gland sealing in service, vacuum breaker
       MV-AV1391 closed (PR-OPE-5002 6545); an open vacuum breaker breaks it */
    /* an ATS program that began at a trip from Start 150 MW: the snapshot keeps the vacuum as at load, not through the start-up ejector line-up */
    const tcx = U.tc && !U.tc.fromLoad ? U.tc : null;
    /* P2 #13 (INSTRUMENT_VALVE_COVERAGE.md): with the one world the ejectors and the vacuum breaker are the DITL MOVs, not a separate
       panel state: start-up ejector MV-AS1395 (DITL-54), steam jet air ejector MV-AS1396 (DITL-55), vacuum breaker MV-AV1391 (DITL-56).
       The TCS VACUUM UP command presses them (tcs.js tcsDitl); a breaker opened on the DITL breaks the vacuum */
    if (tcx) {
      const p54 = anDitlPos('DITL-54', 0),
        p55 = anDitlPos('DITL-55', 0),
        p56 = anDitlPos('DITL-56', 0);
      if (p54 != null && p55 != null && p56 != null) {
        tcx.vb = p56 > 5;
        tcx.ej = p54 > 50 || p55 > 50;
      }
    }
    const aux = tcx ? tcx.ej && !tcx.vb && tcx.Pa > 10 && tcx.gland : U.Pd > 12,
      cw2 = tcx && tcx.vb ? 0 : cw;
    U.aux = aux ? 1 : 0;
    U.vac = Math.max(0, Math.min(1, cw2 > U.vac ? (aux ? U.vac + dt / U.vacUp : U.vac) : U.vac + ((cw2 - U.vac) * dt) / U.vacDn));
    const tb0 = U.tb,
      l = U.vtrip;
    /* I.0400 follows the valves (IBD TA-6, tcsI0400); a model without a vacuum value keeps its own rule */
    if (tb0 && tb0.st !== 'off' && !isFinite(U.cdP) && U.vac < 0.6 && l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n) && l.S.rt.ext[l.n] !== 1) {
      l.S.rt.ext[l.n] = 1;
    }
  }
  /* 3.2.0-beta.59: the seawater system (030 SEAWATER HMI), see AN_SW */
  anSeawaterStep(U, dt);
  /* 3.2.0-beta.63: the make-up water system and the expansion tank (MAKE-UP WATER HMI), see AN_MU */
  anMakeupStep(U, dt);
  /* 3.2.0-beta.66: the turbine lube and control oil (036 TURBINE OIL HMI), see TCS_OIL (tcs.js) */
  tcsOil(U, dt);
  /* 3.2.0-beta.68: the instrument and plant air systems (INSTRUMENT & PLANT AIR HMI), see AN_AIR */
  anAirStep(U, dt);
  /* 3.2.1 SEULGI: the boiler-side systems (boiler.js: diesel oil) */
  anBoilerStep(U, dt);
  /* 3.2.0-beta.69: the aux cooling water loop (027 CLOSED COOLING WATER HMI), see AN_ACW */
  anAcwStep(U, dt);
  /* 3.2.1: the turbine lube oil cooler on the closed cooling water (AN_LO) */
  anLubeCoolStep(U, dt);
  /* 3.2.1: the condenser (pressure, hotwell temperature) and the condensate pumps (AN_CD) */
  anCondStep(U, dt);
  /* 3.2.1: the boiler feed water pumps (AN_FW) */
  anFwStep(U, dt);
  anHphStep(U, dt);
  anHdStep(U, dt);
  /* 3.2.1: the LP heater temperatures (AN_LP) */
  anLphStep(U, dt);
  /* live test #54: motor bearing / winding temperature and vibration (AN_MT) */
  anMotorStep(U, dt);
  const trip = (U.trip || []).some(t => +t.S.rt.v[t.n] > 0.5);
  /* ---- 2.2.0-beta.17 (M4 step 4): the turbine black box (see AN_UNIT rollRate ...) ---- */
  const tb = U.tb || (U.tb = { st: 'load', rpm: 3600, icv: 1, xfer: true, tgt: NaN, aim: NaN }),
    dirt = (l, x) => {
      if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n) && l.S.rt.ext[l.n] !== x) l.S.rt.ext[l.n] = x;
    };
  /* 3.2.0-beta.38: the turbine auxiliaries and the ATS program (tcs.js) */
  if (U.tc && !trip) tcsStep(U, dt);
  else if (U.tc) tcsTripHold(U, dt);
  /* Start at 150 MW: no ATS program, the trip logic of the IBD runs all the same (tcs-trip.js) */
  else if (!trip) tcsTripScan(U, dt);
  else tcsTripHold(U, dt);
  if (trip && tb.st !== 'off') {
    /* the machine is lost at any start: stop valves shut, 52G open by ST TRIP (IBD TA-6, 310SD03-743 sheet 4 E-1), no transfer, no DCS mode, the ATS off (310SC90-775
       page 6). Coming back is the ATS again, there is no reload on reset: at Start 150 MW the ATS program starts here */
    tb.icv = Math.max(0, tb.icv - dt / U.tauTrip);
    if (!U.tc) tcsFromOil(U);
    Object.assign(tb, { st: 'off', xfer: false, tgt: 0, aim: 0 });
    tcsTrip(U);
    dirt(U.di.gcbOn, 0);
    dirt(U.di.gcbOff, 1);
    dirt(U.di.xfer, 0);
    dirt(U.di.perm, 0);
    dirt(U.di.on, 0);
  }
  {
    /* d1: the TCS mode, the turning gear and the heater level switches as the ABC inputs (U.di above); the heater set points as the DITL rows (plantsw.js, alarm list LS-HD110x) */
    const w = (l, x) => {
        if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n) && l.S.rt.ext[l.n] !== x) l.S.rt.ext[l.n] = x;
      },
      c = U.tc,
      m = c && c.mode,
      H = U.hdLvl || {};
    for (const l of U.di.one || []) w(l, 1);
    for (const l of U.di.warm || []) w(l, m === 'warm' ? 1 : 0);
    for (const l of U.di.hot || []) w(l, m === 'hot' ? 1 : 0);
    w(U.di.tg, c && c.tg && tb.rpm < 4 ? 1 : 0);
    if (U.lpbSp && U.lpbSp.n != null) w(U.di.lpbZso, anAv('TICHR1012', Math.max(0, Math.min(100, +U.lpbSp.S.rt.v[U.lpbSp.n] || 0))) >= 99 ? 1 : 0);
    for (const [l, k, sp] of U.di.hd || []) if (isFinite(H[k])) w(l, H[k] >= sp ? 1 : 0);
  }
  U.turb = tb.st !== 'off';
  const onGrid = tb.st === 'sync' || tb.st === 'load';
  if (U.tc) {
    /* the ATS sets the speed and the ICV (tcs.js); a stopped machine coasts down to the turning gear */
    if (!U.turb && tb.rpm > 4) tb.rpm = Math.max(0, tb.rpm - (3600 * dt) / 600);
  } else if (tb.st === 'roll') {
    tb.rpm = Math.min(3600, tb.rpm + (U.rollRate * dt) / 60);
    tb.icv = Math.min(U.icvRoll, tb.icv + (U.icvRoll * dt) / 60);
  } else if (!U.turb) tb.rpm = Math.max(0, tb.rpm - (3600 * dt) / 600);
  /* turbine valves (TCS): MW to the turbine master demand */
  /* DCS control mode ON (CCS, 33.PNG): the TCS follows the turbine master of the DCS (EIC-TM output, AO0359 TO TCS; in AUTO it is
     the unit load demand of HIC-ULD + the pressure correction; in MANUAL the operator's MW). OFF: the TCS keeps its own target
     (2.2.0-beta.17: the operator's target on the TCS panel, tb.aim, reached at rateUp MW/min: INITIAL LOAD, LOAD UP) */
  const on = U.dcs < 0 || +v[U.dcs] > 0.5,
    tmo = U.tm && U.tm.o && U.tm.o[0] != null ? +v[U.tm.o[0]] : NaN,
    ds = U.dem >= 0 ? +v[U.dem] : NaN;
  if (on) U.tcsT = isFinite(tmo) ? tmo : isFinite(ds) ? ds : U.MW;
  else if (onGrid && isFinite(tb.aim)) {
    if (!isFinite(tb.tgt)) tb.tgt = U.MW;
    tb.tgt += Math.max(-(U.rateUp * dt) / 60, Math.min((U.rateUp * dt) / 60, tb.aim - tb.tgt));
    U.tcsT = tb.tgt;
  } else if (!isFinite(U.tcsT)) U.tcsT = U.MW;
  const D = U.tcsT;
  if (U.turb === false) {
    /* 2.2.0-beta.14: cold start, the turbine is not rolled yet: the stop valves are shut (M4 step 4 opens them) */
    U.gv = 0;
    U.tcsT = 0;
    tb.icv = 0;
  } else if (trip) {
    /* turbine trip: the TCS closes the valves; the load set point is gone */
    U.gv = Math.max(0, U.gv - dt / U.tauTrip);
    U.tcsT = 0;
  } else if (tb.st === 'roll') {
    U.gv = 0;
    U.tcsT = 0;
  } else if (!tb.xfer) {
    /* IP start mode: the ICV controls the load, the HP control valves are shut; ICV -> CV transfer at MWxf or ICV full open */
    U.gv = 0;
    tb.icv = Math.max(0, Math.min(1, tb.icv + (dt * (D - U.MW)) / (2 * U.tcs * U.MWxf)));
    if (tb.icv >= 1 || U.MW >= U.MWxf) {
      tb.xfer = true;
      tb.icv = 1;
      U.gv = 0.02;
      if (U.cold) dirt(U.di.xfer, 1);
    }
  } else {
    tb.icv = 1;
    U.gv = Math.max(0.02, Math.min(1.4, U.gv + (dt * (D - U.MW)) / (U.tcs * U.MW0)));
  }
  /* steam flow through the valves: m = Kt x gv x MSP, MSP = drum - kdp x m^2 */
  /* 3.2.0 P1 #3: the steam reaches the turbine through the main steam stop MOV MV-MS1391 (or its warming bypass, anUnitStepX) */
  const k = U.Kt * U.gv * (U.msG == null ? 1 : U.msG),
    a2 = U.kdp * k,
    ms = a2 > 0 ? (-1 + Math.sqrt(1 + 4 * a2 * k * Math.max(0, U.Pd))) / (2 * a2) : k * U.Pd;
  U.ms = Math.max(0, ms);
  /* the other outlets: flow = share x anchor flow x opening x MSP / anchor MSP */
  const P1 = Math.max(0, U.Pd - U.kdp * U.ms * U.ms);
  U.mb = 0;
  U.mhp = 0;
  for (const x of U.vlv) {
    const o = Math.max(0, Math.min(100, anAv(x.t, +x.S.rt.v[x.n] || 0))),
      q = (((x.f * U.m0 * o) / 100) * P1) / U.P0;
    U.mb += q;
    if (x.rh) U.mhp += q;
  }
  /* drum: stored energy. 2.2.0-beta.14 (cold start): the firing heats the water first (U.Tw), then the pressure rises against the
     storage of the steam AND of the saturated water (C + Cw x dTsat/dP) */
  const tsatOf = steamTsat; /* 3.2.0-beta.15: IF97 steam table (steam.js), was the fit 100 + 47.1 x ln(P + 1) */
  /* air share (total air over the anchor), used by the cooling below and by the bed temperature */
  const taf = U.taf.reduce((a, n) => a + (+U.tafS.rt.v[n] || 0), 0),
    as = U.taf0 > 0 ? Math.max(0.05, taf / U.taf0) : 1;
  /* 2.2.0-beta.21 (M5 shutdown to bottle-up, PR-OPE-5004): an UNFIRED boiler is cooled by the air the fans push through it (boiler
     manual SECT_7 Fig. 5 BOILER COLD SHUTDOWN: burners off at 3.6 h, SH outlet pressure 95 -> 60 kg/cm2 in 1 h, 20 at 6 h, 0 at
     8 h with the draft running) and, bottled (fans off), by the ambient. Steam-equivalent heat loss: kcool (T/H at the anchor air
     and 300 C above the ambient; air x 0.24 kcal/kg C x dT / 500 kcal/kg, ASSUMED 60) x air share + kamb (ASSUMED 1 T/H: about
     1.5 kg/cm2 per hour bottled), times (Tw - Tamb) / 300, fading in as the firing falls below 10 % of the anchor fuel (a fired
     boiler already carries its flue gas loss in the fuel -> steam line). Start-up / shutdown physics only (U.cold) */
  let Qloss = 0;
  if (U.cold) {
    const unf = Math.max(0, 1 - Fe / (0.1 * U.F0));
    Qloss = unf * (U.kcool * as + U.kamb) * Math.max(0, (U.Tw - U.Tamb) / 300);
  }
  if (U.cold) {
    const ts = tsatOf(U.Pd),
      /* the water can only take heat from a hotter furnace (Mina item 12d: water 147 C with bed 141 C) */
      qW = Math.min(U.Qs, U.uaW * Math.max(0, U.Tb - U.Tw));
    if (U.Tw < ts - 0.01) {
      U.Tw = Math.max(U.Tamb, Math.min(ts, U.Tw + ((qW - Qloss) * dt) / U.Cw));
      U.Pd = Math.max(0, U.Pd - ((U.ms + U.mb) * dt) / U.C);
    } else {
      U.Pd = Math.max(0, U.Pd + ((qW - Qloss - U.ms - U.mb) * dt) / (U.C + U.Cw * steamDTsat(U.Pd)));
      U.Tw = tsatOf(U.Pd);
    }
  } else {
    U.Pd = Math.max(0, U.Pd + ((U.Qs - U.ms - U.mb) * dt) / U.C);
    U.Tw = tsatOf(U.Pd);
  }
  /* bed temperature: firing share over air share, first order */
  {
    const /* fuel share (coal-equivalent, burnt) over air share, exponent 0.45 (ASSUMED, calibrated: 850 C at full load, Fig 8; about
         450 C with two start-up burners at 60 % and the light-off air, the coal batch permissive of PR-OPE-5002 400 ~ 450 C; coal
         alone at O2 4 ~ 5 % about 800 C). 2.2.0-beta.15: on the fuel, not on the steam made (the fixed loss of the firing line
         made a small fire too cold) */
      Tbss = anBedSS(U, Fe / Math.max(1, U.F0), as);
    /* below the start of coal (Fig 2, 483 C) the refractory and the bed charge are the heat sink, and there is no coal burning in the bed:
       FHI Fig 2 110 C at 1 h, 483 C at 6 h; PR-OPE-5002 gradient 1 C/min, FHI limit 153 C/h. The hot lag tauB takes over by 600 C */
    const kh = Math.max(0, Math.min(1, (U.Tb - 483) / (600 - 483))),
      tauBed = U.tauBc + (U.tauB - U.tauBc) * kh;
    U.Tb += ((Math.max(U.Tamb, Tbss) - U.Tb) * dt) / tauBed;
  }
  /* 3.2.0-beta.23: the furnace and cyclone thermocouples (TIFG1090 / 1091 lower layer under / above, TIFG1095 / 1096 cyclone,
     TIFG1009 furnace) follow the bed: ambient + (snapshot - ambient) x bed rise / anchor bed rise. Before, they kept the 150 MW
     snapshot (933 C) in Cold: ABC-027 SI0122 > 700 C = M.2504 "ADEQUATE FOR COAL FIRING (PURGE BY-PASS)" was 1 on a cold boiler,
     DITL-02 completed the purge by itself and reset the MFT before the operator could press FURNACE PURGE START */
  if (U.tbed && U.tbed.length) {
    const k = Math.max(0, (U.Tb - U.Tamb) / Math.max(1, U.Tb0 - U.Tamb));
    for (const L of U.tbed) anUnitWrite(L, i => U.Tamb + (L.a0[i] - U.Tamb) * k);
  }
  if (U.saP && U.saP.length && U.sa0 > 0) {
    const r = Math.max(0, +U.tafS.rt.v[U.saN] || 0) / U.sa0;
    for (const L of U.saP) anUnitWrite(L, i => L.a0[i] * r * r);
  }
  if (U.idfS && U.idfS.length) {
    const on = !U.idf || +U.idf.S.rt.v[U.idf.n] > 0.5,
      m = U.idfV ? Math.max(0, Math.min(100, +U.idfV.S.rt.v[U.idfV.n] || 0)) : 0;
    anUnitWrite(U.idfS, () => (on ? U.idfRpm[0] + ((U.idfRpm[1] - U.idfRpm[0]) * m) / 100 : 0));
  }
  const Pms = Math.max(0, U.Pd - U.kdp * U.ms * U.ms);
  U.Pms = Pms; /* 3.2.0-beta.14: source of the reducing stations (source.js) */
  /* generator. 2.2.0-beta.17: HP steam (1 - cIP) + IP / LP steam cIP (qip = the reheat pressure x the ICV opening, = the HP steam
     when the bypass is shut and the ICV full open: the same line MW0 + c x (ms - m0) as before) less the anchor losses; 0 off the grid */
  const qip = U.m0 * U.rr * tb.icv,
    MWss = onGrid
      ? Math.max(
          0,
          U.c * ((1 - U.cIP) * U.ms + U.cIP * qip) - (U.mwK != null ? U.mwK : U.c * U.m0 - U.MW0) * Math.min(1, qip / (0.3 * U.m0)) - anVacMW(U) + (U.dMWx || 0)
        )
      : 0;
  U.MW += ((MWss - U.MW) * dt) / U.tauMW;
  /* 52G open: no load on the machine */
  if (U.tc && (tb.st === 'off' || tb.st === 'roll')) U.MW = 0;
  U.rpm = tb.rpm;
  U.icvp = 100 * tb.icv;
  U.tbn = { off: 0, roll: 1, sync: 2, load: 3 }[tb.st];
  /* the TCS inputs of the DCS in a start-up (the snapshot of "Start at 150 MW" keeps its own) */
  if (U.cold) {
    /* with a 2 MW hysteresis: the TCS permissive does not flicker at the load it is given at (45.0 MW) */
    tb.perm = onGrid && (tb.perm ? U.MW >= U.MWperm - 2 : U.MW >= U.MWperm);
    dirt(U.di.perm, tb.perm ? 1 : 0);
    if (U.di.onCmd >= 0 && +v[U.di.onCmd] > 0.5 && U.di.perm && +v[U.di.perm.n] > 0.5) dirt(U.di.on, 1);
    if (U.di.offCmd >= 0 && +v[U.di.offCmd] > 0.5) dirt(U.di.on, 0);
  }
  if (U.spd && U.spd.length) anUnitWrite(U.spd, tb.rpm);
  U.t += dt;
  /* transmitters */
  anUnitWrite(U.msp, Pms);
  for (const l of U.tin) anUnitWrite(l, Math.max(0, Pms - U.kln * U.ms * U.ms));
  anUnitWrite(U.drum, U.Pd);
  for (const l of U.mw) anUnitWrite(l, U.MW);
  anUnitWrite(U.tgt, U.tcsT);
  /* main steam flow: the RAW transmitter, so that the compensation of the drawing (SQRT(LN31(p) x LN32(T) x raw)) gives U.ms: the
     compensated flow is proportional to the raw value at a given pressure and temperature (SQRT block: out = in, in units of
     flow), so raw = U.ms x raw / compensated of the last scan */
  /* 2.2.0-beta.12: FT-MS1031 is at the boiler outlet: it sees the steam to the turbine AND to the HP bypass / blow-off (U.mb) */
  const mso = U.ms + U.mb,
    raw = anUnitVal(U.msf),
    cmp = +v[U.cn];
  if (isFinite(raw) && raw > 0 && isFinite(cmp) && cmp > 1) anUnitWrite(U.msf, (mso * raw) / cmp);
  else anUnitWrite(U.msf, mso);
  /* ---- 2.2.0-beta.11 (M2 steps 1 ~ 3) ---- */
  const scaled = (L, r) => anUnitWrite(L, i => L.a0[i] * r),
    shifted = (L, d) => anUnitWrite(L, i => L.a0[i] + d);
  /* reheat pressure: proportional to the steam through the IP / LP turbine = turbine steam + HP bypass, less what the LP bypass
     takes (its size lpb x the anchor flow at the anchor pressure); first stage pressure: proportional to the turbine steam */
  const olp = U.lpv ? Math.max(0, Math.min(100, +U.lpv.S.rt.v[U.lpv.n] || 0)) : 0;
  if (!tb.xfer) {
    /* 2.2.0-beta.16 (M4 step 3): turbine shut (no IP / LP turbine flow): the hot reheat pressure is the steam stored in the
       reheater: in = HP bypass (U.mhp), out = LP bypass + RH blow-off, each = size x anchor flow x opening x pressure / anchor
       pressure (as the outlets of the main steam line). 2.2.0-beta.17: + the ICV flow (roll steam, initial load) until the transfer */
    const Prh0 = U.rhp.length && U.rhp[0].a0.length && U.rhp[0].a0[0] > 0 ? U.rhp[0].a0[0] : 34,
      orb = U.rhbv ? Math.max(0, Math.min(100, +U.rhbv.S.rt.v[U.rhbv.n] || 0)) : 0,
      qout = (U.m0 * U.rr * (U.lpb * olp + U.rhb * orb)) / 100 + qip;
    U.rr = Math.max(0, U.rr + ((U.mhp + U.ms - qout) * dt) / (U.Crh * Prh0));
  } else {
    const rrs = (U.ms + U.mhp) / (U.m0 * (1 + (U.lpb * olp) / 100));
    U.rr += ((rrs - U.rr) * dt) / U.tauRH;
  }
  for (const L of U.rhp) scaled(L, U.rr);
  /* 3.2.0-beta.14 (source.js): hot reheat pressure and LP bypass flow, the source of the LP bypass desuperheater */
  {
    const Prh0 = U.rhp.length && U.rhp[0].a0.length && U.rhp[0].a0[0] > 0 ? U.rhp[0].a0[0] : 34;
    U.Prh = U.rr * Prh0;
    U.qlp = (U.m0 * U.rr * U.lpb * olp) / 100;
  }
  /* 2.2.0-beta.17: not exactly 0 while the HP valves are shut: the SELECT CIRCUIT of ABC-052 (SI0181) reads 0 as a lost transmitter
     (SIG.AB) and would hold the 150 MW value, so the LP bypass REMOTE set point (LN12 of the first stage + 5.1) would stay at 30.9 */
  for (const L of U.pist) scaled(L, Math.max(1e-3, U.ms / U.m0));
  /* SH / RH temperature versus load: the spray loops see a load disturbance (plant.js pr.ld, in units of the PV). At the anchor
     (MCR) it is 0; down to 60 % MCR it grows to the authority of the spray of the snapshot (the spray closes, the PV stays at the set
     point: Fig 6 / Fig 10); below 60 % the PV falls at the slope of the snapshots (02.png) */
  const xl = Math.min(
      1,
      mso / U.mcr
    ) /* 2.2.0-beta.12: the load of the boiler is all the steam it makes, bypass included */,
    cv = U.sprayCurve;
  let gx = 1;
  if (xl <= cv[0][0]) gx = 0;
  else
    for (let i = 1; i < cv.length; i++)
      if (xl <= cv[i][0]) {
        gx = cv[i - 1][1] + ((cv[i][1] - cv[i - 1][1]) * (xl - cv[i - 1][0])) / (cv[i][0] - cv[i - 1][0]);
        break;
      }
  const below = Math.max(0, cv[0][0] - xl),
    /* 2.2.0-beta.12 (M3): firing ratio = steam made / steam leaving (1 in steady state; 0 after an MFT while the stored steam still flows):
       the superheat goes with the firing, the temperature falls to the saturation temperature of the drum pressure (3.2.0-beta.15: the
       IF97 steam table of steam.js) */
    fr0 = Math.max(0, Math.min(1, U.Qs / Math.max(1, mso))),
    /* 3.2.0-beta.39 (roadmap 2) (roadmap 2, mouse Cold run: ATS HOLD in the 1800 rpm heat soak, MS 384 ~ 417 C and RH 360 ~ 413 C in a minute while
       the oil coach trimmed the fire): the steam temperatures followed the firing ratio at once. The tubes and the gas path store heat:
       the ratio the temperatures see is lagged by the metal lag tauT (after an MFT the superheat is still lost: 120 s to 37 %) */
    /* 3.2.0-beta.39 (roadmap 2, mouse Cold run 3: the sync at 3600 rpm missed ATS 1.4 / 1.6 for 6 minutes, MS 389 ~ 416 C and RH 388 ~
       412 C while the HP bypass swung 59 ~ 84 % on the pressure): a CFB superheater takes its heat from the bed, the refractory and
       the circulating solids, which carry it through a swing of the steam flow; only a real loss of the fire (MFT, fuel cut) takes
       the superheat. The ratio counts below frDb of the steam leaving (ASSUMED 0.75) */
    frE = Math.min(1, fr0 / U.frDb),
    fr = (U.frT = U.frT == null ? frE : U.frT + ((frE - U.frT) * dt) / U.tauT),
    /* 3.2.0-beta.22 (bug, user 2026-10-24 "cold na, may value pa rin ... baka sa iba ganyan din"): not above the water of the drum. In a
       cold boiler (water 30 C, no steam) the saturation temperature of 0 kg/cm2 is 99.97 C: the SH / RH steam temperatures
       (TICBR1130 / 1140 / 1150, TICMS1004, TICHR1002) read 99.97 C instead of the ambient. Once the water boils Tw = saturation */
    tsat = Math.min(tsatOf(U.Pd), isFinite(U.Tw) ? U.Tw : 1e9);
  for (const e of U.ld) {
    const pr = e.pr,
      p = e.b.p || {};
    pr.fr = fr;
    pr.tsat = tsat;
    pr.tcap = U.cold ? U.Tb : undefined;
    if (!pr.hop || !(pr.Ka > 0)) {
      pr.ld = 0;
      continue;
    }
    const plo = p.lo == null ? 0 : p.lo,
      span = p.span > 0 ? p.span : 100,
      A =
        (pr.Ka * Math.max(0, pr.hop.mv - plo) * span) /
        100; /* authority of the spray of the snapshot, units of the PV */
    /* 3.2.0-beta.38 (CHECKLIST 0.6, the ATS criteria 1.4 / 1.6 / 1.71 / 1.72 at the roll): in a start-up / shutdown (U.cold, or a turbine
       start-up not yet in NORMAL OPERATION: Start warm / hot) the SH and RH outlet follow the FHI Fig. 2 curve (suCurve). The slopes of the load test extrapolated to 12 % load gave MS 468 C (RH 388
       C with slopeRH): outside the ATS window, no roll. The spray drawings agree that no spray can help there: DITL-33 opens the SH
       spray SOV only with the finishing SH inlet >= 350 C and steam > 46 T/H, DITL-35 the RH spray only after the ICV to CV transfer */
    let dn = e.s * below;
    if (e.s > 0) {
      const N = e.r ? U.natSH : U.natRH;
      let T = N[N.length - 1][1];
      if (xl < N[0][0]) T = N[0][1] - e.s * (N[0][0] - xl);
      else for (let i = 1; i < N.length; i++) if (xl <= N[i][0]) { T = N[i - 1][1] + ((N[i][1] - N[i - 1][1]) * (xl - N[i - 1][0])) / (N[i][0] - N[i - 1][0]); break; }
      dn = Math.max(0, 541 - T);
    }
    if ((U.cold || (U.tc && U.tc.step < 7)) && e.s > 0) {
      const p0 = (U.tc && U.suRoll[U.tc.mode]) || U.suCurve[0][1],
        c = U.suCurve.map(([a, b]) => [a, Math.max(b, p0)]),
        x = Math.max(c[0][0], xl);
      let T = c[c.length - 1][1];
      for (let i = 1; i < c.length; i++)
        if (x <= c[i][0]) {
          T = c[i - 1][1] + ((c[i][1] - c[i - 1][1]) * (x - c[i - 1][0])) / (c[i][0] - c[i - 1][0]);
          break;
        }
      dn = Math.max(0, 541 - T);
    }
    pr.dn = dn;
    /* 3.2.0-beta.39 (roadmap 2): the SH chain (see U.ld): the share of the fall at the spray 1 outlet; the finishing SH inlet follows the SH no.2
       outlet (its superheat came through the chain: no second firing ratio on it) */
    if (e.r === 'sh1') {
      U.shDn = dn;
      pr.ld = (pr.sg || -1) * (A * (1 - gx) + U.fsh[0] * dn);
    } else if (e.r === 'up') {
      U.shA2 = A;
      pr.fr = 1;
      const h0 = U.sh.find(h => h.r === 'sh2');
      pr.ld = h0 ? h0.x - h0.pv0 + (h0.d || 0) : (pr.sg || -1) * (A * (1 - gx) + dn);
    } else pr.ld = (pr.sg || -1) * (A * (1 - gx) + dn);
  }
  /* the headers after the spray: spray outlet + the pickup of the next superheater, metal lag. 3.2.0-beta.39 (roadmap 2): the pickup falls with its
     share of dn, the finishing SH pickup is short of the spray 2 authority below the spray of Fig 10, and without firing (fr) the pickup
     is lost as the superheat of the spray outlet is (plant.js pr.fr) */
  for (const h of U.sh) {
    const pv = +h.S.rt.v[h.n];
    if (!isFinite(pv)) continue;
    h.x += ((pv - h.x) * dt) / U.tauT;
    const dn = U.shDn || 0,
      pkT = h.pk0 - (h.r === 'sh2' ? U.fsh[1] * dn : U.fsh[2] * dn + (U.shA2 || 0) * (1 - gx));
    /* 3.2.1 b6 (Mina beta.111: MST 550 C at 118 MW on a 0.75 MW/min ramp up, 532 C on the way down; plant 535 ~ 542 C): the pickup of the
       superheater followed the load at once while the spray outlet before it moved with the metal lag tauT, so a ramp put the main steam
       9 C off. The pickup is heat of the same tube metal: it moves with the same lag (the steady values do not change) */
    h.pk = h.pk == null ? pkT : h.pk + ((pkT - h.pk) * dt) / U.tauT;
    const pk = h.pk;
    h.d = pk * fr - h.pk0;
    /* 2.2.0-beta.14 (cold): the header after the spray cannot be above the gas (bed) nor below saturation either */
    if (U.cold) {
      const cap = Math.max(tsat, U.Tb);
      for (const L of h.L) anUnitWrite(L, i => Math.max(tsat, Math.min(cap, L.a0[i] + h.x - h.pv0 + h.d)));
    } else for (const L of h.L) shifted(L, h.x - h.pv0 + h.d);
  }
  /* O2 of the flue gas: 21 x (1 - stoichiometric air / total air), analyzer lag. Both analyzers read it: FHI gives one curve (Fig 7) and
     the 6.4 / 2.2 % of one snapshot has no source, it stood the B side on LOW-LOW at 150 MW */
  if (U.afs > 0) {
    const taf = U.taf.reduce((a, n) => a + (+U.tafS.rt.v[n] || 0), 0),
      o2s = Math.max(0, Math.min(21, 21 * (1 - (Fe * U.afs) / Math.max(1, taf))));
    U.o2v += ((o2s - U.o2v) * dt) / U.tauO2;
    for (const L of U.o2) anUnitWrite(L, U.o2v);
  }
  /* bed inventory and the furnace pressure drop */
  if (U.paNet >= 0) {
    /* only a running cooler takes ash out (DITL-21A and its instances); 16.PNG: all four stopped at 150 MW */
    const rpm = (U.bedSc || []).reduce((a, o, i) => a + (typeof anDitlRun === 'function' && anDitlRun(['DITL-21A', 'DITL-21A #B', 'DITL-21A #C', 'DITL-21A #D'][i]) === 1 ? Math.max(0, Math.min(5, +o.S.rt.v[o.n] || 0)) : 0), 0),
      k = anBedStep(U, dt, rpm, Math.max(0, +U.tafS.rt.v[U.paNet]), U.taf && U.taf.length === 3 ? Math.max(0, +U.tafS.rt.v[U.taf[2]]) : null);
    for (const [L, a] of U.bedDp || []) if (L.length) anUnitWrite(L, a * k);
  }
  /* PA to the furnace follows the PAF flow */
  if (U.paNet >= 0 && U.pa.length) anUnitWrite(U.pa, Math.max(0, +U.tafS.rt.v[U.paNet]) * AN_PA_FURN);
  /* ---- 2.2.0-beta.15 (M4 step 2): the start-up feedwater valve adds to the feedwater flow ---- */
  if (U.suv && U.fwp && U.fwp.pr) {
    const o = Math.max(0, Math.min(100, anAv('LICBR1001B', +U.suv.S.rt.v[U.suv.n] || 0))),
      fw0 = U.fwp.pr.hop && U.fwp.pr.hop.pv > 0 ? U.fwp.pr.hop.pv : 500;
    U.fwp.pr.op = (U.ksu * fw0 * o) / 100;
  }
  /* ---- 2.2.0-beta.12 (M3): machines stopped, furnace pressure ---- */
  for (const m of U.mul || []) {
    /* 3.2.0 P1 #4: a feedwater pump gives water only through its discharge MOV (MV-FW1001 / 1002) or the bypass MOV of it
       (MV-FW1391 / 1392, the filling line: ASSUMED 30 % of the flow), positions of the DITL-38 valves while the one world runs */
    const run = !m.run.length
      ? 1
      : Math.min(
          1,
          m.run.reduce((a, r, i) => {
            if (!(+r.S.rt.v[r.n] > 0.5)) return a;
            if (m.drw && anDitlRun(m.drw[i]) === 0) return a;
            /* 3.2.1 (IRENE): no water through a BFWP whose suction manual valve is closed (V-FW1001 / 1002) */
            if (m.drw && anFv(['V-FW1001', 'V-FW1002'][i]) < 5) return a;
            const d = m.dis && m.dis[i];
            if (!d) return a + 1;
            const pm = anDitlPos(d[0], 0),
              pb = anDitlPos(d[1], 0);
            return a + (pm == null || pb == null ? 1 : Math.min(1, pm / 100 + (0.3 * pb) / 100));
          }, 0)
        );
    for (const p of m.pr) p.mul = run;
  }
  if (U.fp && U.fp.length) {
    if (U.kfpA == null)
      for (const p of U.fp) {
        const pr = p.pr,
          pp = p.b.p || {};
        if (pr.hop && pr.Ka > 0) {
          U.kfpA = (pr.Ka * Math.max(0, pr.hop.mv - (pp.lo == null ? 0 : pp.lo)) * (pp.span > 0 ? pp.span : 100)) / 100;
          break;
        }
      }
    const idf = !U.idf || +U.idf.S.rt.v[U.idf.n] > 0.5,
      taf = U.taf.reduce((a, n) => a + (+U.tafS.rt.v[n] || 0), 0),
      ld = U.taf0 > 0 ? (U.kfpA > 0 ? U.kfpA : U.kfp) * (taf / U.taf0 - 1) : 0;
    /* 3.2.0-beta.19 (VIEW / TRACE audit, Cold): no ID fan and no air = the furnace open to the stack, 0 mmH2O. Before, a cold plant
       read about +200 mmH2O (the loop model with the ID fan taking nothing out and the air term). With air and no ID fan the
       pressure still rises (as before); with the ID fan running the model is unchanged. */
    const nair = !idf && U.taf0 > 0 ? Math.min(1, taf / (0.1 * U.taf0)) : null;
    for (const p of U.fp) {
      p.pr.uf = idf ? 1 : 0;
      p.pr.ld = ld;
      if (!p.pr.src) {
        p.pr.smul = nair == null ? undefined : nair;
        p.pr.sbase = nair == null ? undefined : 0;
      }
      /* the open furnace empties in seconds, not with the time constant of the draft loop (65 s) */
      const q = nair != null && nair < 1 && U.idf && U.idf.S.rt.pm ? U.idf.S.rt.pm[p.b.id] : null;
      if (q && isFinite(q.y)) q.y -= (1 - nair) * q.y * (1 - Math.exp(-dt / 5));
      /* 3.2.0-beta.51 (#99) / live check #105 #107 (PR-OPE-5002 IDF / PAF START-UP: "Hydraulic Coupling Furnace Pressure Control at
         13 %", "Adjust manually (commonly reduce) ... maintaining -15 mmH2O", "Once the Hydraulic Coupling is at 16 % MV and Furnace
         Pressure is Stable at around -15 mmH2O, set the HC Control in AUTO"): the cold furnace (no fire) is a gas path, the ID fan
         suction against the loss of the air pushed through it: fp = -A * speed^2 + Kq * (total air / 406 T/H)^2, speed of the fan
         manual (350 ~ 1140 rpm on the coupling, linear ASSUMED). A = 124: the IDF alone at 13 % = about -19.5 mmH2O (the operator
         reduces it, SOP); Kq: the purge air of the SOP (PA 180 + SA 200 + FA 26 = 406 T/H) at 16 % = -15 mmH2O. As the bed heats
         (100 ~ 300 C) the loop model of the hot plant (anchored at 150 MW) takes over. Before: the cold model was blended out at 10 %
         of the design air, and the loop model wanted 27 % at 348 T/H */
      const tb = isFinite(+U.Tb) ? +U.Tb : 30,
        ia = idf && U.idf && U.idf.S.rt.pm ? Math.max(0, Math.min(1, (tb - 100) / 200)) : 1;
      if (ia < 1 && !p.pr.src) {
        const m = U.idfV ? Math.max(0, Math.min(100, +U.idfV.S.rt.v[U.idfV.n] || 0)) : 0,
          sp = (U.idfRpm[0] + ((U.idfRpm[1] - U.idfRpm[0]) * m) / 100) / U.idfRpm[1],
          sp16 = (U.idfRpm[0] + ((U.idfRpm[1] - U.idfRpm[0]) * 16) / 100) / U.idfRpm[1],
          A = 124,
          Kq = A * sp16 * sp16 - 15,
          ylo = -A * sp * sp + Kq * Math.pow(taf / 406, 2);
        /* the target of the loop model (plant.js ss: y = smul * y + (1 - smul) * sbase); its own lag (<= 5 s) makes the response. Before
           (beta.51 ~ 53) the state was overwritten here and the loop model pulled it back each scan to its own value */
        p.pr.smul = ia;
        p.pr.sbase = ylo;
      }
    }
  }
  anUnitStepX(dt, mso);
}
/* 3.2.0 roadmap 3 / P1: the transmitters of the cold plant, valve positions, spray block valves (see anUnitStart) */
function anUnitStepX(dt, mso) {
  const U = AN_UNIT,
    X = U.xt,
    lag = (k, x, tau) => {
      const T = X.T;
      if (!isFinite(x)) return T[k];
      T[k] = !isFinite(T[k]) ? x : T[k] + ((x - T[k]) * Math.min(dt, tau)) / tau;
      return T[k];
    },
    val = L => anUnitVal(L || []),
    pvOf = o => (o && o.c && o.c.q && o.c.q.pv != null ? +o.S.rt.v[o.c.q.pv] : NaN);
  if (X) {
    /* cold reheat: the HP turbine exhaust and the HP bypass outlet, mixed by their steam */
    const mst = pvOf(X.mst),
      thx = isFinite(X.cr0) ? X.cr0 + (isFinite(mst) ? mst - X.MST0 : 0) : NaN,
      tby = val(X.byo),
      w = (U.ms || 0) + (U.mhp || 0);
    const tcr = lag('cr', w > 1 ? ((U.ms || 0) * Math.max(U.Tamb, thx) + (U.mhp || 0) * (isFinite(tby) ? tby : U.Tamb)) / w : (X.T.cr != null ? X.T.cr + ((U.Tamb - X.T.cr) * dt) / (20 * U.tauT) : U.Tamb), U.tauT);
    if (isFinite(tcr)) {
      anUnitWrite(X.cr, tcr);
      /* after the RH spray: the cooling of the anchor spray, in the share of the spray MV that reaches the water (block valve) */
      const mv = X.rhPv ? Math.max(0, +X.rhPv.S.rt.v[X.rhPv.n] || 0) : 0,
        sp = U.spr && U.spr.find(z => z.v[0] === 'DITL-35'),
        uf = sp && sp.pr.uf != null ? sp.pr.uf : 1,
        k = X.rhv0 > 1 ? Math.min(2, (mv * uf) / X.rhv0) : 0;
      X.rhi.forEach((L, i) => anUnitWrite(L, Math.max(U.Tamb, tcr - (isFinite(X.rhi0[i]) && isFinite(X.cr0) ? (X.cr0 - X.rhi0[i]) * k * (w > 1 ? 1 : 0) : 0))));
    }
    /* hot reheat temperature: the reheater outlet */
    const rht = pvOf(X.rhPv);
    if (isFinite(rht)) anUnitWrite(X.hr, rht + X.hrOff * Math.max(0, Math.min(1, (rht - U.Tamb) / 300)));
    /* aux steam header: in service with its pressure */
    const pa = val(X.auxP);
    if (X.aux && X.aux.length) {
      const a0 = X.aux.a0[0];
      anUnitWrite(X.aux, lag('aux', U.Tamb + (a0 - U.Tamb) * Math.max(0, Math.min(1, (pa || 0) / 10.2)), 300));
    }
    /* feedwater to the economizer: deaerator water + HP heaters (with the turbine load) */
    if (X.fw && X.fw.length && isFinite(X.fw0)) {
      const pd = val(X.dea),
        tdea = isFinite(pd) && pd > 0.05 ? steamTsat(pd) : U.Tamb,
        tdea0 = isFinite(X.dea0) && X.dea0 > 0.05 ? steamTsat(X.dea0) : 120,
        ld = U.MW0 > 0 ? Math.max(0, Math.min(1.1, (U.MW || 0) / U.MW0)) : 0;
      /* 3.2.1 (IRENE: HP HEATERS): the outlet of the No.2 HPH of the heater model (anHphStep), 03.png TIFW1106 243 / TIFW1160 244 C */
      anUnitWrite(X.fw, isFinite(U.hpT2) ? U.hpT2 : lag('fw', tdea + Math.max(0, X.fw0 - tdea0) * ld, 600));
    }
    /* the second drum level transmitter: the same water as the other two */
    if (isFinite(X.lt2Off) && X.lt2.length) {
      const m = X.lt13.map(L => val(L)).filter(isFinite);
      if (m.length) anUnitWrite(X.lt2, m.reduce((s, x) => s + x, 0) / m.length + X.lt2Off);
    }
    /* FA blowers: heat of compression while the air flows */
    if (X.fab.length && X.faF0 > 0) {
      const r = Math.max(0, Math.min(1.2, (val(X.faF) || 0) / X.faF0));
      X.fab.forEach((L, i) => anUnitWrite(L, lag('fab' + i, U.Tamb + (L.a0[0] - U.Tamb) * r, 120)));
    }
  }
  /* P1 #3 MAIN STEAM STOP MOV MV-MS1391 and its warming bypass MV-MS1392 (DITL-38): the share of the turbine steam that passes
     (bypass ASSUMED 10 %), and the pressure at the MSV inlet that the ATS reads (tcs.js tcsSteam): it follows the main steam
     pressure through the open MOV (30 s), slowly through the bypass alone (the warming of the pipe, 600 s), and falls with both shut
     (the steam in the pipe condenses, 1800 s). The HP bypass takes its steam before the MOV (PD-011) */
  {
    const pm = anDitlPos('DITL-38 #MV-MS1391', 0),
      pb = anDitlPos('DITL-38 #MV-MS1392', 0);
    if (pm == null || pb == null) {
      U.msG = undefined;
      U.Pmsv = undefined;
    } else {
      U.msG = Math.min(1, pm / 100 + (0.1 * pb) / 100);
      const P = isFinite(U.Pms) ? U.Pms : 0,
        tau = pm > 5 ? 30 : pb > 5 ? 600 : 1800,
        x = pm > 5 || pb > 5 ? P : 0;
      U.Pmsv = !isFinite(U.Pmsv) ? x : U.Pmsv + ((x - U.Pmsv) * Math.min(dt, tau)) / tau;
    }
  }
  /* valve position = valve command */
  for (const z of U.zt || []) {
    const c = Math.max(0, Math.min(100, anAv(z.t, +z.src.S.rt.v[z.src.n] || 0)));
    z.y = !isFinite(z.y) ? c : z.y + ((c - z.y) * Math.min(dt, U.tauZT)) / U.tauZT;
    anUnitWrite(z.L, z.y);
  }
  /* spray block valves: the share of the spray command that reaches the water */
  for (const z of U.spr || []) {
    const ps = z.v.map(n => anDitlPos(n, 0));
    z.pr.uf = ps.some(x => x == null) ? undefined : ps.reduce((a, x) => a + x, 0) / (100 * ps.length);
  }
}
