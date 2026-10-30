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
  c: (150.5 - 60.3) / (474.1 - 203.7) /* MW per T/H of steam */,
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
  hpb: 0.3,
  blo: 0.1,
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
       FT-FA1081, FT-FA1055), stoichiometric air per T/H of coal from the anchor (O2 4.3 % at the snapshot air and coal: excess air
       about 26 %; design 20 %). Analyzer lag tauO2 (ASSUMED). PA to the furnace FT-FA1079 (ABC-006 indicator) follows the PAF flow */
  lpb: 0.8 /* 2.2.0-beta.16: was 0.3; sized so that at 7.5 kg/cm2 it passes the HP bypass flow of the bypass servicing with the valve
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
  rhb: 0.1,
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
  cIP: 0.6,
  MWxf: 20,
  MWperm: 45,
  MWinit: 4.5 /* PR-OPE-5002: initial load 4.5 MW */,
  rateUp: 7.5 /* MW/min = 5 % / min (PR-OPE-5002 LOAD UP), AI0421 max load-up rate 0 ~ 5 %/min */,
  tauT: 120,
  /* 3.2.0-beta.39 (roadmap 2): share of the low-load / start-up fall of the SH temperature (dn) at the spray 1 outlet, the SH no.2 pickup and the
     finishing SH pickup (ASSUMED: superheat of each stage at the anchor, 61 / 68 / 80 C of the 209 C over saturation) */
  fsh: [0.3, 0.3, 0.4],
  frDb: 0.75,
  tauO2: 20,
  mcr: 460 /* T/H, boiler MCR (SECT_7) */,
  /* SH spray versus load (Fig 10), as a share of the spray at MCR: [load share of MCR, spray share] */
  sprayCurve: [
    [0.6, 0],
    [0.7, 0.407],
    [0.85, 0.722],
    [1, 1]
  ],
  /* temperature fall below 60 % MCR, C per unit of load share (02.png: MST 541 -> 517 and RHT 541 -> 499 at 0.443 MCR) */
  slopeSH: (541 - 517) / (0.6 - 203.7 / 460),
  slopeRH: (541 - 499) / (0.6 - 203.7 / 460),
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
  Cw: 1508,
  kcool: 60 /* 2.2.0-beta.21: cooling of the unfired boiler by the air, T/H steam-equivalent at the anchor air and 300 C (ASSUMED, Fig. 5) */,
  kamb: 1 /* 2.2.0-beta.21: bottled boiler loss to the ambient, T/H steam-equivalent at 300 C (ASSUMED) */,
  tauB: 900,
  Tb0: 850,
  /* 3.2.0-beta.15 (phase B, utilities): CONDENSER VACUUM. The turbine exhausts to the condenser, cooled by the seawater pumps (SWP-A ~ C
     M.3353 ~ M.3355) with the condensate pumps (CP-A / B M.3350 / M.3351) taking the water out (PR-OPE-5002: SWP, CEP and VACUUM UP
     before the turbine is rolled). The vacuum (share 0 ~ 1) rises in vacUp s once a SWP and a CEP run (ASSUMED 15 min with the
     vacuum pumps, a field step) and is lost in vacDn s when they stop (ASSUMED 1 min). The turbine cannot be rolled below 90 %; a
     turning or loaded turbine is tripped by the TCS below 60 % (LOW VACUUM TRIP -> ABC-050 I.0400 TURBINE TRIP) */
  vacUp: 900,
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
  U.iaP = U.paP = NaN; /* 3.2.0-beta.68: the air tanks are set again by the start state (AN_AIR) */
  U.acT1 = U.acT2 = NaN; /* 3.2.0-beta.69: the aux cooling water temperatures start again (AN_ACW) */
  for (const m of U.mul || []) for (const p of m.pr) p.mul = undefined;
  for (const z of U.spr || []) z.pr.uf = undefined;
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
  /* the valve commands of the other outlets (output of their A / M station after the interlocks) */
  const ctlOut = (k, t) => {
    const x = AN.sheets.find(y => y.name === k),
      c = x && x.S && AN.hmiCtrls ? (AN.hmiCtrls(x.S) || []).find(q => q.tag === t) : null;
    return c && c.out != null ? { S: x.S, n: c.out, c } : null;
  };
  U.vlv = [
    ['ABC-050', 'PICMS1006', U.hpb, 1 /* to the cold reheat */],
    ['ABC-013', 'PICMS1002', U.blo, 0]
  ]
    .map(([k, t, f, rh]) => {
      const o = ctlOut(k, t);
      return o ? { S: o.S, n: o.n, f, rh } : null;
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
    U.afs = ((1 - O20 / 21) * taf0) / F0; /* T/H of air per T/H of coal, stoichiometric */
    U.O20 = U.o2v = O20;
    U.taf0 = taf0;
  }
  U.pa = ais('ABC-006', 'AI0166');
  U.paN = U.tafS ? netOf(U.tafS, 'FIFA1071.PV') : -1;
  U.pa0 = U.paN >= 0 ? +U.tafS.rt.v[U.paN] : NaN;
  /* ---- 2.2.0-beta.12 (M3): trips ---- */
  const labOf = (k, l) => {
      const x = shOf(k);
      if (!x || !x.S) return null;
      const n = x.S.lab.findIndex(z => z && String(z.t).trim() === l);
      return n >= 0 ? { S: x.S, n } : null;
    },
    procsOf = (k, tags) => tags.map(t => procOf(k, t)).filter(Boolean);
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
    offCmd: netOf(S, 'O.0179')
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
    if (L.length) U.zt.push({ src, L, y: NaN });
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
  /* the transmitters this model writes: the plant model of a loop on them stops writing (ABC-001C PIC-COBM: main steam pressure) */
  const own = new Set();
  const lists = [U.msp, U.drum, U.msf, U.spd || []]
    .concat(U.mw, U.tin, U.rhp, U.pist, U.o2, [U.pa], U.tbed, U.aphT, U.saP, U.idfS.length ? [U.idfS] : [])
    .concat(...U.sh.map(h => h.L))
    .concat([U.xt.cr, U.xt.hr, U.xt.aux, U.xt.fw, U.xt.lt2], U.xt.rhi, U.xt.fab, U.zt.map(z => z.L));
  for (const l of lists) for (const [S2, b] of l) own.add(S2.rt.st[b.id]);
  U.own = own;
  U.on = true;
  /* 3.2.0-beta.68: "Start at 150 MW" = the air compressors in service, the tanks at their pressure (AN_AIR, 39.PNG 7.0 kg/cm2) */
  U.iaP = U.paP = AN_AIR.P;
  U.frT = undefined;
  U.tco = null; /* 3.2.0-beta.66: the oil-only state of the snapshot (tcs.js tcsOilState) starts again */
  U.tc = null; /* 3.2.0-beta.38: the snapshot of "Start at 150 MW": the TCS model only in a start-up / shutdown (Cold, warm, hot, live) */
  /* 3.2.0-beta.14: the snapshot plant has its diesel oil pump in service (source.js field equipment) */
  AN_SRC.field.dop = true;
  AN_SRC.field.hypo = true;
  AN_SRC.field.pur = true;
  AN_SRC.field.mu1033 = false;
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
  AN_SRC.field.dop = false;
  AN_SRC.field.hypo = false;
  AN_SRC.field.pur = false;
  AN_SRC.field.mu1033 = false;
  AN_SRC.field.esp = false;
  AN_SRC.t = -1;
  /* 3.2.0-beta.68: cold = the air compressors stopped, the air tanks empty (AN_AIR) */
  U.iaP = U.paP = 0;
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
  if (!U.on || !U.tb) return 'walang unit model (Start cold muna)';
  const tb = U.tb;
  /* 3.2.0-beta.66: the 036 TURBINE OIL pumps at the 150 MW snapshot (no TCS model): the oil-only state of tcs.js */
  if (!U.tc && cmd === 'oil') return tcsOilCmd(tcsOilState(U), arg || {});
  if (!U.tc && cmd === 'vex') {
    tcsOilState(U).vex = arg !== 0 && arg !== false;
    return '';
  }
  /* 3.2.0-beta.38 (CHECKLIST 0.6): the TCS / ATS model (tcs.js): the auxiliaries and the ATS step push buttons. 'roll' = ATS AUTO
     from the next step up to ACCELERATION (3600 rpm), 'sync' = EXCITATION + SYNCH. & INITIAL LOAD, 'loadup' = LOAD UP to the target */
  if (U.tc) {
    const c = U.tc;
    if (cmd === 'roll') {
      if (tb.st === 'sync' || tb.st === 'load') return 'naka-sync na';
      if (c.step >= 3) return 'umiikot na ang turbine (3600 rpm)';
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
      if (tb.st === 'sync' || tb.st === 'load') return 'naka-sync na';
      if (c.step < 3) return c.step < 1 ? 'i-roll muna ang turbine' : 'hindi pa 3600 rpm / tapos ang ACCELERATION (' + tb.rpm.toFixed(0) + ' rpm)';
      const r = c.cur >= 0 ? '' : tcsStepIn(U, c.step + 1);
      if (r) return r;
      c.auto = true;
      c.autoTo = 5;
      return '';
    }
    if (cmd === 'loadup') {
      if (tb.st !== 'sync' && tb.st !== 'load') return 'i-sync muna ang generator';
      if (c.step < 5) return 'hinihintay ang initial load hold (SYNCH. & INITIAL LOAD, ' + (c.tm / 60).toFixed(0) + ' / ' + (c.holdMin || 0) + ' min)';
      return tcsStepIn(U, 6, arg);
    }
    const r = tcsCmd(U, cmd, arg);
    return r == null ? 'hindi kilalang utos: ' + cmd : r;
  }
  if (cmd === 'roll') {
    if (tb.st !== 'off') return 'umiikot na ang turbine (' + tb.st + ')';
    if (!(U.vac >= 0.9)) return 'walang vacuum ang condenser (' + Math.round(100 * (U.vac || 0)) + ' %): i-start muna ang seawater pump (SWP) at condensate pump (CEP); ang VACUUM UP (ejector, gland sealing) ay kailangan ng aux steam: main steam > 12 kg/cm2';
    Object.assign(tb, { st: 'roll', xfer: false, tgt: 0, aim: 0 });
    return '';
  }
  if (cmd === 'sync') {
    if (tb.st !== 'roll') return tb.st === 'off' ? 'i-roll muna ang turbine' : 'naka-sync na';
    if (tb.rpm < 3599) return 'hindi pa 3600 rpm (' + tb.rpm.toFixed(0) + ')';
    Object.assign(tb, { st: 'sync', tgt: 0, aim: U.MWinit });
    const dirt = (l, x) => {
      if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n)) l.S.rt.ext[l.n] = x;
    };
    dirt(U.di.gcbOn, 1);
    dirt(U.di.gcbOff, 0);
    return '';
  }
  if (cmd === 'loadup') {
    if (tb.st !== 'sync' && tb.st !== 'load') return 'i-sync muna ang generator';
    tb.st = 'load';
    tb.aim = isFinite(+arg) ? +arg : 45;
    return '';
  }
  return 'hindi kilalang utos: ' + cmd;
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
   built. The same reading as the lamps of the Training dock and the HMI (events.js lsAlarms.motState, dock.js mst) */
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
    const st = window.lsAlarms ? lsAlarms.motState(s) : null;
    return st == null ? null : st === 'RUN' ? 1 : 0;
  } catch (e) {
    return null;
  }
}
/* 3.2.0-beta.59 (#116 / #117 follow-up, user 2026-10-29: the values of the 030 SEAWATER HMI come from the plant model, not from the HMI).
   No transmitter of these tags is on a logic sheet (the condenser seawater T / P are PICT 30 indications of STN102, LT-SW1501 of STN103,
   the debris filter DP gauges are PACKAGE instruments: alarm list DPT-SW1502 / 1504, 0 ~ 2000 mmH2O), so the plant model makes them
   from the machines that run and from the exhaust steam of the turbine. Anchor = the HMI snapshot 30.PNG (2 SWP running, 465.8 T/H main
   steam): condenser inlet 1.0 / 1.0 kg/cm2, outlet 0.4 / 0.5, seawater 28.5 / 28.6 -> 35.2 / 35.1 C, forebay -8.76 m, SWP-B 242.5 A,
   SWP-C 207.6 A, SWBP 87.3 A. PR-OPE-5002: condenser inlet normal 1.0 ~ 1.1 kg/cm2; START DEBRIS FILTER "Input cut in (DP conditions)
   20 mBar / 80 mBar" = a clean filter with flow 20 mbar (204 mmH2O), the backwash cuts in at 80 mbar (816 mmH2O).
     header pressure  P = 0 / 0.7 / 1.0 / 1.1 kg/cm2 with 0 / 1 / 2 / 3 SWP (ASSUMED steps between the 30.PNG point and the SOP limit);
     relative flow    w = sqrt(P / 1.0) (the condenser and the pipes are a fixed resistance: drop ~ flow^2);
     condenser out    P x 0.4 (A) / 0.5 (B) (30.PNG);
     seawater rise    30.PNG rise x (exhaust steam / 465.8) / w (exhaust = turbine steam + LP bypass to the condenser);
     filter DP        204 x w^2 x (1 + dirt): the dirt of the screen grows while water passes (ASSUMED 80 mbar after 4 h at the
                      normal flow); at 816 mmH2O the package backwashes (MV-SW1001 / 1002, local panel, ASSUMED 60 s) and the dirt is
                      washed out. The water passes the screen whether the filter runs or not; only a filter IN OPERATION (DITL-39)
                      backwashes, so a filter not started fouls on (DP up to the HIGH alarm). No pump: no flow, DP 0;
     pump current     running: the 30.PNG current x (0.4 + 0.6 x share of the flow of one pump vs 30.PNG) (ASSUMED motor load curve);
                      stopped 0. SWP-A was stopped in 30.PNG: the mean of B and C. SWBP: 87.3 A running.
   The forebay level follows the tide, not the pumps: the 30.PNG level. */
const AN_SW = {
  swp: ['M.3353', 'M.3354', 'M.3355'],
  swbp: ['DITL-30', 'DITL-30 #B', 'DITL-30 #C'],
  df: ['DITL-39@3', 'DITL-39@14'],
  Ph: [0, 0.7, 1.0, 1.1],
  I0: [210, 212, 208] /* live test 2026-10-30 #10: PR-OPE-5002 section 2 Normal Current 205 ~ 215 A (UNUSUAL: 30.PNG 225.1 / 242.5 / 207.6 A, above the SOP); the model follows the SOP, ASSUMED spread */,
  Ib: [87.3, 87.3, 87.2],
  dp0: 204,
  dpBw: 816,
  dirtT: 4 * 3600,
  bwT: 60,
  tauP: 3,
  tauT: 60,
  tauI: 2
};
function anSeawaterStep(U, dt) {
  const K = AN_SW,
    lag = (k, x, tau) => (U[k] = isFinite(U[k]) ? U[k] + ((x - U[k]) * Math.min(dt, tau)) / tau : x),
    sw = K.swp.map(a => srcBit([a])),
    bp = K.swbp.map(a => anDitlRun(a) || 0),
    df = K.df.map(a => {
      const r = anDitlRun(a);
      return r == null ? 1 : r;
    }),
    n = sw.reduce((a, b) => a + b, 0),
    nb = bp.reduce((a, b) => a + b, 0),
    P = K.Ph[n],
    w = Math.sqrt(P),
    ex = Math.max(0, (U.ms || 0) + (U.qlp || 0)),
    rise = w > 0 ? (ex / 465.8) / w : 0;
  U.swN = n;
  U.swNb = nb;
  lag('swPiA', P, K.tauP);
  lag('swPiB', P, K.tauP);
  lag('swPoA', P * 0.4, K.tauP);
  lag('swPoB', P * 0.5, K.tauP);
  U.swTiA = 28.5;
  U.swTiB = 28.6;
  lag('swToA', 28.5 + 6.7 * rise, K.tauT);
  lag('swToB', 28.6 + 6.5 * rise, K.tauT);
  U.swLvl = -8.76;
  /* the debris filters: S-1502 on the SWP header, S-1504 on the SWBP line (its flow: the SWBP running, ASSUMED 1/2 each up to 1) */
  [
    [1, w, df[0]],
    [2, Math.min(1, nb / 2), df[1]]
  ].forEach(([i, q, op]) => {
    const d = 'swDirt' + i,
      b = 'swBw' + i;
    if (!isFinite(U[d])) U[d] = 0;
    if (U[b] > 0) {
      U[b] = Math.max(0, U[b] - dt);
      U[d] = Math.max(0, U[d] - (3 * dt) / K.bwT);
    } else U[d] += (3 * q * q * dt) / K.dirtT;
    const dp = K.dp0 * q * q * (1 + U[d]);
    if (op && dp >= K.dpBw && !(U[b] > 0)) U[b] = K.bwT;
    lag('swDp' + i, dp, K.tauP);
  });
  /* the motor currents */
  K.I0.forEach((I, i) => lag('swIa' + i, sw[i] ? I * (0.4 + (0.6 * w * 2) / n) : 0, K.tauI));
  K.Ib.forEach((I, i) => lag('swIb' + i, bp[i] ? I : 0, K.tauI));
  /* live test 2026-10-30 #21: the SWBP suction and discharge pressure (PR-OPE-5002 section 5: suction 1 ~ 1.1 ksc, inlet 1.0 ksc,
     discharge 2.3 ~ 2.4 kg/cm2 at PG-SW1503A / B / C, local gauges): suction = the SWP header (the SWBP takes from it), discharge 2.35
     while its pump runs (ASSUMED mid of the SOP band), else the suction */
  K.Ib.forEach((I, i) => {
    lag('swBs' + i, P, K.tauP);
    lag('swBd' + i, bp[i] && P > 0 ? 2.35 : P, K.tauP);
  });
}
/* 3.2.0-beta.63 (MAKE-UP WATER HMI, PR-OPE-5002 section 7): the make-up water system of flow diagram K1AU3-PD-024 Rev D and the
   expansion tank of PD-021. Demi water tanks T-0708A / B -> suction header -> MWP P-0709A / B / C (DITL-112) -> common header
   (PT-MU0709) -> #1 condenser (LCV-MU1110 / MV-MU1001), deaerator and boiler initial fill, expansion tank T-1109 (XV-MU1109, DITL-78),
   unit 2. The transmitters are local (STN105 / STN103) and feed the logic only as analog rows (DITL-112 LT-MU0708-A / B,
   PT-MU0709, DPT-MU0709; DITL-76 / 77 / 78 LT-CW1109), so the plant model makes them; the world writes them into those rows
   (plantsw.js) and the HMI shows the same number. Anchor = the HMI snapshots 28.png / 27.PNG (2 MWP running): demi tanks 13.8 /
   13.7 m, header 9.0 ~ 9.1 kg/cm2, MWP 20.5 / 20.7 / 20.8 A, strainer DP 0.00 ~ 0.04 kg/cm2, expansion tank 0.80 m.
     demi tanks      the snapshot level, constant (the water treatment refills them; not modelled);
     header          no MWP: the static head of the tank water (0.1 kg/cm2 per m, ASSUMED); 1 / 2 / 3 MWP: 9.0 / 9.1 / 9.15 kg/cm2
                     (ASSUMED: the pumps work near their shut-off head at the small make-up flow; SOP: > 6.0 kg/cm2);
     strainer DP     0.03 kg/cm2 while its pump runs (ASSUMED clean strainer, inside the snapshot 0.00 ~ 0.04), 0 stopped;
     current         the snapshot current while running, 0 stopped;
     expansion tank  start 0.80 m (27.PNG); fills while XV-MU1109 is commanded open (DITL-78 row 4) and the header is above 6 kg/cm2
                     (SOP: fill to NL 1.7 m) at 0.003 m/s (ASSUMED, 0.8 -> 1.7 m in 5 min, 10 m3/h through the 3" line); the
                     closed loop loses no water (ASSUMED);
     make-up flow    FT-MU1001 = the hotwell make-up of the cycle model (plant.js 1.8 T/H per % of LCV-MU1110) + the expansion tank
                     filling, only while an MWP runs. */
const AN_MU = {
  mwp: ['DITL-112', 'DITL-112 #B', 'DITL-112 #C'],
  xv: 'DITL-78@3',
  mv: 'DITL-60',
  lv: [13.8, 13.7],
  Ph: [9.0, 9.1, 9.15],
  I0: [20.5, 20.7, 20.8],
  dp: 0.03,
  et0: 0.8,
  etMax: 2.0,
  etRate: 0.003,
  etQ: 10,
  tauP: 3,
  tauI: 2
};
function anMakeupStep(U, dt) {
  const K = AN_MU,
    lag = (k, x, tau) => (U[k] = isFinite(U[k]) ? U[k] + ((x - U[k]) * Math.min(dt, tau)) / tau : x),
    run = K.mwp.map(a => anDitlRun(a) || 0),
    n = run.reduce((a, b) => a + b, 0);
  U.muN = n;
  U.muLvA = K.lv[0];
  U.muLvB = K.lv[1];
  lag('muP', n ? K.Ph[n - 1] : 0.1 * Math.max(K.lv[0], K.lv[1]), K.tauP);
  K.I0.forEach((I, i) => lag('muI' + i, run[i] ? I : 0, K.tauI));
  run.forEach((r, i) => lag('muDp' + i, r ? K.dp : 0, K.tauP));
  U.muXv = anDitlRun(K.xv) === 1 ? 1 : 0;
  const mv = anDitlPos(K.mv);
  U.muMv = mv == null ? null : mv;
  if (!isFinite(U.etLvl)) U.etLvl = K.et0;
  /* live test 2026-10-30 #23: or through the bypass V-MU1033 (manual, field operator; PR-OPE-5002 section 7 "XV-MU1109 ... or Bypass valve V-MU1033") */
  U.muByp = typeof AN_SRC !== 'undefined' && AN_SRC.field && AN_SRC.field.mu1033 ? 1 : 0;
  const fill = (U.muXv || U.muByp) && U.muP > 6 && U.etLvl < K.etMax;
  U.muFill = fill ? 1 : 0;
  if (fill) U.etLvl = Math.min(K.etMax, U.etLvl + K.etRate * dt);
  U.etPct = (100 * U.etLvl) / K.etMax;
  const hw = typeof AN_CYC !== 'undefined' ? Math.max(0, 1.8 * (AN_CYC.u.hw || 0)) : 0;
  lag('muF', n ? hw + (fill ? K.etQ : 0) : 0, K.tauP);
}
/* 3.2.0-beta.69 (027 CLOSED COOLING WATER HMI, PR-OPE-5002 sections 7 ~ 8): the aux cooling water loop of flow diagram K1AU3-PD-021
   Rev D. Return header CW-1-002 20" + expansion tank T-1109 (V-CW1001) -> suction CW-1-003 20" -> ACWP P-1108A / B (DITL-76 / 77:
   strainer DPT-CW1108-A / B) -> common discharge CW-1-007 20" (PT / TT-CW1152) -> CCWHE H-1107A / B / C (seawater of the SWBP) ->
   supply CW-1-014 20" (PT / TT-CW1153) -> the users (turbine oil coolers TCV-CW1201, generator air coolers, BFP, bottom ash screw
   conveyors PT / TT-CW1156, fans, APH, air compressors and dryers, sampling) -> return. PT-CW1152 and DPT-CW1108-A / B are analog rows
   of DITL-76 / 77 (standby AUTO start < 3.5 kg/cm2, trip > 0.8 kg/cm2 5 s): the world writes them there (plantsw.js), so the logic
   and the HMI read the same number. Anchor = the HMI snapshot 27.PNG (148 MW, ACWP-A running): PICW1152 6.4, PICW1153 5.2 kg/cm2,
   TICW1152 40, TICW1153 38 C, ACWP-A 28.2 A, DPICW1108A 0.27 kg/cm2; TICW1156 37 C, PICW1156 5.3, TICW1060 36 ~ 38 C (other pages).
     pressure     no ACWP: the static head of the expansion tank (1.0 kg/cm2 + its level, ASSUMED); 1 / 2 ACWP: 6.4 / 6.7 kg/cm2 at the
                  pump discharge (6.4 = 27.PNG, 6.7 ASSUMED), 1.2 kg/cm2 lost in the CCWHE (27.PNG 6.4 -> 5.2); the bottom ash
                  header PT-CW1156 = the supply header (ASSUMED, the same line);
     strainer DP  0.27 kg/cm2 while its pump runs (27.PNG), 0 stopped;
     current      28.2 A while running (27.PNG; SOP normal 30 A, alarm 33.7), 0 stopped;
     temperature  the heat of the users q = 0.4 + 0.6 x load / 150 MW (ASSUMED: the compressors, BFP and coolers work at no load too);
                  with an ACWP and an SWBP running the supply (TT-CW1153) goes to 28.5 C (seawater, 30.PNG) + 9.5 x q (38 C at full
                  load, 27.PNG) and the return / pump discharge (TT-CW1152) is 2 x q above it (40 C); with an ACWP but no SWBP the
                  CCWHE takes no heat away and the loop warms to 60 C (TE-CW1152 HH of the alarm list) in about 20 min; no ACWP:
                  no flow, the water goes to the room temperature 30 C (ASSUMED); the bottom ash cooler outlets TT-CW1060 = the
                  supply + 1 C while an ACWP runs (ASSUMED, the ash heat is not modelled; the snapshot reads 36 ~ 38 C at 37 C). */
const AN_ACW = {
  acwp: ['DITL-76', 'DITL-77'],
  Ph: [6.4, 6.7],
  dPx: 1.2,
  dp: 0.27,
  I0: 28.2,
  Tsw: 28.5,
  Tamb: 30,
  Thot: 60,
  tauP: 3,
  tauI: 2,
  tauT: 600,
  tauA: 1800
};
function anAcwStep(U, dt) {
  const K = AN_ACW,
    lag = (k, x, tau) => (U[k] = isFinite(U[k]) ? U[k] + ((x - U[k]) * Math.min(dt, tau)) / tau : x),
    run = K.acwp.map(a => anDitlRun(a) || 0),
    n = run.reduce((a, b) => a + b, 0),
    lv = isFinite(U.etLvl) ? U.etLvl : 0.8,
    stat = 1.0 + 0.1 * lv,
    q = 0.4 + 0.6 * Math.max(0, Math.min(1, (isFinite(U.MW) ? U.MW : 0) / 150)),
    cool = (U.swNb || 0) > 0;
  U.acN = n;
  U.acCool = n && cool ? 1 : 0;
  lag('acP1', n ? K.Ph[n - 1] : stat, K.tauP);
  lag('acP2', n ? K.Ph[n - 1] - K.dPx : stat, K.tauP);
  U.acP6 = U.acP2;
  run.forEach((r, i) => {
    lag('acDp' + i, r ? K.dp : 0, K.tauP);
    lag('acI' + i, r ? K.I0 : 0, K.tauI);
  });
  const ts = n ? (cool ? K.Tsw + 9.5 * q : K.Thot) : K.Tamb;
  if (!isFinite(U.acT2)) U.acT2 = ts;
  lag('acT2', ts, n ? K.tauT : K.tauA);
  lag('acT1', n ? Math.min(K.Thot + 2, U.acT2 + 2 * q) : K.Tamb, n ? 60 : K.tauA);
  U.acT6 = U.acT2;
  U.acTb = n ? U.acT2 + 1 : U.acT2;
}
/* 3.2.0-beta.68 (INSTRUMENT & PLANT AIR HMI, PR-OPE-5002 sections 9 ~ 12): the compressed air systems of flow diagram K1AU3-PD-023
   Rev C sheet 1/6 (plant air) and 2/6 (instrument air). Each system: compressors C-0703A / B / C (PA) or C-0704A / B / C (IA), started
   at their local panel (the RUNNING / TRIP contacts of DITL-114 / DITL-113 rows 6 / 13 / 20, 7 / 14 / 21) -> dryers D-0703A ~ C /
   D-0704A ~ C (DITL-45 and its machine instances #B / #C: PLANT AIR DRYER RUNNING output row 4, INSTRUMENT AIR DRYER RUNNING row 15)
   -> air tanks T-0705A / B (10 m3) or T-0706A / B (5 m3) -> unit 1 (PT-PA1705 / PT-IA1706), unit 2 and the utility area. The
   transmitters feed the logic as analog rows (DITL-114 / 113 rows 1 ~ 3, the auto start of a standby compressor at < 5 kg/cm2;
   DITL-03G rows 9 ~ 11, the MFT on instrument air < 3.5 kg/cm2, 2 of 3), so the plant model makes them and the world writes them into
   those rows (plantsw.js); the HMI shows the same number. Anchor: 39.PNG instrument air buffer tanks 7.0 kg/cm2 (unit at 150 MW);
   alarm list: tanks and unit header L 5.0, IA LL 3.5, PSL-IA1706 / PSL-PA1705 2.8 kg/cm2; I/O list ranges (0 ~ 10 kg/cm2, dryer
   outlet flow 0 ~ 2700 (IA) / 0 ~ 5800 (PA) m3/h, compressor current 0 ~ 500 (IA) / 0 ~ 140 (PA) A).
     tanks        one or more compressors running: up to 7.0 kg/cm2 at 0.06 kg/cm2/s (ASSUMED, 0 -> 7 in 2 min; the load / unload
                  band of the compressor panel is not in the repository); none running: down at 0.033 kg/cm2/s (ASSUMED: the
                  consumption empties 2 tanks in about 3.5 min); tank A and B are one header (tank B 0.05 lower, ASSUMED);
     unit header  the tank pressure less 0.2 kg/cm2 of line loss (ASSUMED);
     dryer outlet the tank pressure plus 0.15 while a compressor runs (the dryers are upstream of the tanks), else the tank pressure;
     dryer flow   the consumption (ASSUMED IA 1200, PA 1500 m3/h: half of one dryer's range) split over the dryers in service; no dryer
                  in service: over the three (their inlet valves stay open, refrigeration off); 0 while no compressor runs;
     current      while running: IA 400 A (ASSUMED, a 380 V motor for the 2700 m3/h dryer), PA 55 A (ASSUMED, the 6.6 kV VCB motor);
     winding T    PA motor (TE-M0703-x1 ~ 3, I/O list): 35 C stopped, 85 C running (ASSUMED), time constant 10 min. */
const AN_AIR = {
  P: 7.0,
  up: 0.06,
  dn: 0.033,
  dB: 0.05,
  loss: 0.2,
  dD: 0.15,
  sys: {
    ia: { c: 'DITL-113', d: '@14', Q: 1200, I: 400 },
    pa: { c: 'DITL-114', d: '@3', Q: 1500, I: 55 }
  },
  rows: [5, 12, 19],
  dry: ['DITL-45', 'DITL-45 #B', 'DITL-45 #C'],
  Tw: [35, 85, 600],
  tauI: 2
};
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
function anAirStep(U, dt) {
  const K = AN_AIR,
    lag = (k, x, tau) => (U[k] = isFinite(U[k]) ? U[k] + ((x - U[k]) * Math.min(dt, tau)) / tau : x);
  for (const k in K.sys) {
    const Y = K.sys[k],
      run = K.rows.map(r => (anDitlIn(Y.c, r) && !anDitlIn(Y.c, r + 1) ? 1 : 0)),
      trip = K.rows.map(r => anDitlIn(Y.c, r + 1) || 0),
      dry = K.dry.map(d => anDitlRun(d + Y.d) || 0),
      n = run.reduce((a, b) => a + b, 0),
      nd = dry.reduce((a, b) => a + b, 0);
    U[k + 'N'] = n;
    run.forEach((r, i) => (U[k + 'R' + i] = r));
    trip.forEach((r, i) => (U[k + 'T' + i] = r));
    dry.forEach((r, i) => (U[k + 'D' + i] = r));
    const P0 = isFinite(U[k + 'P']) ? U[k + 'P'] : 0;
    U[k + 'P'] = n ? Math.min(K.P, P0 + K.up * dt) : Math.max(0, P0 - K.dn * dt);
    U[k + 'PA'] = U[k + 'P'];
    U[k + 'PB'] = Math.max(0, U[k + 'P'] - K.dB);
    U[k + 'PU'] = Math.max(0, U[k + 'P'] - K.loss);
    U[k + 'PD'] = U[k + 'P'] + (n ? K.dD : 0);
    dry.forEach((r, i) => lag(k + 'F' + i, n && (nd ? r : 1) ? Y.Q / (nd || dry.length) : 0, 3));
    run.forEach((r, i) => lag(k + 'I' + i, r ? Y.I : 0, K.tauI));
    if (k === 'pa') run.forEach((r, i) => lag('paW' + i, r ? K.Tw[1] : K.Tw[0], K.Tw[2]));
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
  U.Qs += ((Qss - U.Qs) * dt) / U.tauF;
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
    const tcx = U.tc;
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
    if (tb0 && (tb0.st !== 'off' || (U.tc && U.tc.trip)) && (U.vac < 0.6 || (U.tc && U.tc.trip)) && l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n) && l.S.rt.ext[l.n] !== 1) {
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
  /* 3.2.0-beta.69: the aux cooling water loop (027 CLOSED COOLING WATER HMI), see AN_ACW */
  anAcwStep(U, dt);
  const trip = (U.trip || []).some(t => +t.S.rt.v[t.n] > 0.5);
  /* ---- 2.2.0-beta.17 (M4 step 4): the turbine black box (see AN_UNIT rollRate ...) ---- */
  const tb = U.tb || (U.tb = { st: 'load', rpm: 3600, icv: 1, xfer: true, tgt: NaN, aim: NaN }),
    dirt = (l, x) => {
      if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n) && l.S.rt.ext[l.n] !== x) l.S.rt.ext[l.n] = x;
    };
  /* 3.2.0-beta.38: the turbine auxiliaries and the ATS program (tcs.js) */
  if (U.tc && !trip) tcsStep(U, dt);
  if (trip && tb.st !== 'off') {
    /* the TCS closes the ICV too (the HP valves below); in a start-up the machine is lost: stop valves shut, GCB open (I.0932, the
       generator protection), no transfer, no DCS mode */
    tb.icv = Math.max(0, tb.icv - dt / U.tauTrip);
    if (U.cold) {
      Object.assign(tb, { st: 'off', xfer: false, tgt: 0, aim: 0 });
      tcsTrip(U);
      dirt(U.di.gcbOn, 0);
      dirt(U.di.gcbOff, 1);
      dirt(U.di.xfer, 0);
      dirt(U.di.perm, 0);
      dirt(U.di.on, 0);
    }
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
    /* turbine trip: the TCS closes the valves; the load set point is gone (the TCS reloads the unit when the trip is reset) */
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
    const o = Math.max(0, Math.min(100, +x.S.rt.v[x.n] || 0)),
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
    const ts = tsatOf(U.Pd);
    if (U.Tw < ts - 0.01) {
      U.Tw = Math.max(U.Tamb, Math.min(ts, U.Tw + ((U.Qs - Qloss) * dt) / U.Cw));
      U.Pd = Math.max(0, U.Pd - ((U.ms + U.mb) * dt) / U.C);
    } else {
      U.Pd = Math.max(0, U.Pd + ((U.Qs - Qloss - U.ms - U.mb) * dt) / (U.C + U.Cw * steamDTsat(U.Pd)));
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
      Tbss = U.Tamb + (U.Tb0 - U.Tamb) * Math.pow(Math.min(3, Fe / Math.max(1, U.F0) / as), 0.45);
    U.Tb += ((Math.max(U.Tamb, Tbss) - U.Tb) * dt) / U.tauB;
  }
  /* 3.2.0-beta.23: the furnace and cyclone thermocouples (TIFG1090 / 1091 lower layer under / above, TIFG1095 / 1096 cyclone,
     TIFG1009 furnace) follow the bed: ambient + (snapshot - ambient) x bed rise / anchor bed rise. Before, they kept the 150 MW
     snapshot (933 C) in Cold: ABC-027 SI0122 > 700 C = M.2504 "ADEQUATE FOR COAL FIRING (PURGE BY-PASS)" was 1 on a cold boiler,
     DITL-02 completed the purge by itself and reset the MFT before the operator could press FURNACE PURGE START */
  if (U.tbed && U.tbed.length) {
    const k = Math.max(0, (U.Tb - U.Tamb) / Math.max(1, U.Tb0 - U.Tamb));
    for (const L of U.tbed) anUnitWrite(L, i => U.Tamb + (L.a0[i] - U.Tamb) * k);
    for (const L of U.aphT || []) anUnitWrite(L, i => U.Tamb + (L.a0[i] - U.Tamb) * k);
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
          U.c * ((1 - U.cIP) * U.ms + U.cIP * qip) - (U.c * U.m0 - U.MW0) * Math.min(1, qip / (0.3 * U.m0))
        )
      : 0;
  U.MW += ((MWss - U.MW) * dt) / U.tauMW;
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
    if (U.spd && U.spd.length) anUnitWrite(U.spd, tb.rpm);
  }
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
      pk = h.pk0 - (h.r === 'sh2' ? U.fsh[1] * dn : U.fsh[2] * dn + (U.shA2 || 0) * (1 - gx));
    h.d = pk * fr - h.pk0;
    /* 2.2.0-beta.14 (cold): the header after the spray cannot be above the gas (bed) nor below saturation either */
    if (U.cold) {
      const cap = Math.max(tsat, U.Tb);
      for (const L of h.L) anUnitWrite(L, i => Math.max(tsat, Math.min(cap, L.a0[i] + h.x - h.pv0 + h.d)));
    } else for (const L of h.L) shifted(L, h.x - h.pv0 + h.d);
  }
  /* O2 of the flue gas: 21 x (1 - stoichiometric air / total air), analyzer lag; each analyzer keeps its offset of the snapshot */
  if (U.afs > 0) {
    const taf = U.taf.reduce((a, n) => a + (+U.tafS.rt.v[n] || 0), 0),
      o2s = Math.max(0, Math.min(21, 21 * (1 - (Fe * U.afs) / Math.max(1, taf))));
    U.o2v += ((o2s - U.o2v) * dt) / U.tauO2;
    /* 3.2.0 roadmap 3: each analyzer keeps its offset of the snapshot only in the flue gas: in air (no fire, 21 %) both read 21 (Cold
       read 23.1 / 18.9 %) */
    const ko = Math.max(0, Math.min(1, (21 - U.o2v) / Math.max(0.5, 21 - U.O20)));
    for (const L of U.o2) anUnitWrite(L, i => Math.max(0, Math.min(21, U.o2v + (L.a0[i] - U.O20) * ko)));
  }
  /* PA to the furnace follows the PAF flow */
  if (U.paN >= 0 && U.pa0 > 0 && U.pa.length) scaled(U.pa, Math.max(0, +U.tafS.rt.v[U.paN]) / U.pa0);
  /* ---- 2.2.0-beta.15 (M4 step 2): the start-up feedwater valve adds to the feedwater flow ---- */
  if (U.suv && U.fwp && U.fwp.pr) {
    const o = Math.max(0, Math.min(100, +U.suv.S.rt.v[U.suv.n] || 0)),
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
      anUnitWrite(X.fw, lag('fw', tdea + Math.max(0, X.fw0 - tdea0) * ld, 600));
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
    const c = Math.max(0, Math.min(100, +z.src.S.rt.v[z.src.n] || 0));
    z.y = !isFinite(z.y) ? c : z.y + ((c - z.y) * Math.min(dt, U.tauZT)) / U.tauZT;
    anUnitWrite(z.L, z.y);
  }
  /* spray block valves: the share of the spray command that reaches the water */
  for (const z of U.spr || []) {
    const ps = z.v.map(n => anDitlPos(n, 0));
    z.pr.uf = ps.some(x => x == null) ? undefined : ps.reduce((a, x) => a + x, 0) / (100 * ps.length);
  }
}
