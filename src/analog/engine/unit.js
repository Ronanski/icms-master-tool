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
  AN_SRC.fixed = null;
  for (const e of U.ld || [])
    if (e.pr) {
      e.pr.ld = 0;
      e.pr.fr = e.pr.tsat = e.pr.tcap = undefined;
    }
  U.cold = false;
  U.turb = true;
  for (const m of U.mul || []) for (const p of m.pr) p.mul = undefined;
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
  U.ld = [
    [procOf('ABC-011', 'TICBR1130'), 0],
    [procOf('ABC-012', 'TICBR1150'), U.slopeSH],
    [procOf('ABC-019', 'TICHR1002'), U.slopeRH]
  ]
    .filter(([p]) => p)
    .map(([p, s]) => Object.assign({ s }, p));
  /* the headers after the spray: SH no.2 outlet TT-BR1140-1 / -2 (PV of TICBR1140) = spray 1 outlet (PV of TICBR1130) + pickup;
     finishing SH outlet TT-MS1004-1 / -2 (PV of TICMS1004) = spray 2 outlet (PV of TICBR1150) + pickup */
  U.sh = [
    ['ABC-011', 'TICBR1130', ['AI0610', 'AI0642']],
    ['ABC-012', 'TICBR1150', ['AI0612', 'AI0644']]
  ]
    .map(([k, t, aa]) => {
      const o = ctlOut(k, t);
      if (!o || !o.c.q || o.c.q.pv == null) return null;
      const pv0 = +o.S.rt.v[o.c.q.pv],
        L = aa.map(a => ais(k, a)).filter(l => l.length);
      return isFinite(pv0) && L.length ? { S: o.S, n: o.c.q.pv, L, pv0, x: pv0 } : null;
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
  /* the transmitters this model writes: the plant model of a loop on them stops writing (ABC-001C PIC-COBM: main steam pressure) */
  const own = new Set();
  const lists = [U.msp, U.drum, U.msf, U.spd || []].concat(U.mw, U.tin, U.rhp, U.pist, U.o2, [U.pa]).concat(...U.sh.map(h => h.L));
  for (const l of lists) for (const [S2, b] of l) own.add(S2.rt.st[b.id]);
  U.own = own;
  U.on = true;
  /* 3.2.0-beta.14: the snapshot plant has its diesel oil pump in service (source.js field equipment) */
  AN_SRC.field.dop = true;
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
  for (const h of U.sh) h.x = U.Tamb;
  /* 3.2.0-beta.14: cold = the field equipment stopped too (diesel oil pump, source.js) */
  AN_SRC.field.dop = false;
  AN_SRC.t = -1;
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
  return true;
}
/* 2.2.0-beta.17 (M4 step 4): the operator on the TCS panel (outside the DCS): 'roll' (open the stop valves, IP start mode, rpm up
   at rollRate), 'sync' (at 3600 rpm: GCB closed, initial load MWinit), 'loadup' (target MW at rateUp MW/min; default 45 = NORMAL
   OPERATION). Returns the state or a reason ('' = done) */
function anTurbine(cmd, arg) {
  const U = AN_UNIT;
  if (!U.on || !U.tb) return 'walang unit model (Start cold / warm muna)';
  const tb = U.tb;
  if (cmd === 'roll') {
    if (tb.st !== 'off') return 'umiikot na ang turbine (' + tb.st + ')';
    if (!(U.vac >= 0.9)) return 'walang vacuum ang condenser (' + Math.round(100 * (U.vac || 0)) + ' %): i-start muna ang seawater pump (SWP) at condensate pump (CEP), hintayin ang VACUUM UP';
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
  /* 3.2.0-beta.14 (plan phase A, user 2026-10-23: "per loop mode, pipili ka kung anong load (MW)"): LOOP STUDY at a fixed load. The
     boiler and the turbine stand at the chosen load (AN_SRC.fixed, source.js srcLoad): drum and main steam pressure, steam flow, MW and
     reheat pressure are written as constants, so every loop is studied with the medium of that load (its source); the loops that make
     these boiler variables (PIC-COBM, the turbine) do not move them in this mode */
  if (AN_SRC.fixed) {
    const f = AN_SRC.fixed,
      Prh0 = U.rhp.length && U.rhp[0].a0.length && U.rhp[0].a0[0] > 0 ? U.rhp[0].a0[0] : 34;
    Object.assign(U, {
      Pms: f.Pms,
      Pd: f.Pms + U.kdp * f.ms * f.ms,
      ms: f.ms,
      Qs: f.ms,
      mb: 0,
      mhp: 0,
      qlp: 0,
      MW: f.mw,
      Prh: f.Prh,
      rr: f.Prh / Prh0,
      Fc: f.coal,
      unb: 0,
      rpm: 3600,
      Tb: U.Tb0
    });
    U.Tw = steamTsat(U.Pd);
    U.tb = Object.assign(U.tb || {}, { st: 'load', rpm: 3600, icv: 1, xfer: true });
    anUnitWrite(U.msp, f.Pms);
    for (const l of U.tin) anUnitWrite(l, Math.max(0, f.Pms - U.kln * f.ms * f.ms));
    anUnitWrite(U.drum, U.Pd);
    for (const l of U.mw) anUnitWrite(l, f.mw);
    const raw = anUnitVal(U.msf),
      cmp = +v[U.cn];
    anUnitWrite(U.msf, isFinite(raw) && raw > 0 && isFinite(cmp) && cmp > 1 ? (f.ms * raw) / cmp : f.ms);
    for (const L of U.rhp) anUnitWrite(L, i => L.a0[i] * U.rr);
    for (const L of U.pist) anUnitWrite(L, i => L.a0[i] * Math.max(1e-3, f.ms / U.m0));
    U.t += dt;
    return;
  }
  /* coal of the three feeders (T/H) -> steam made in the drum (T/H), first order */
  /* 2.2.0-beta.14: + the oil of the start-up burners (ao x coal); the offset of the firing line fades out below 30 % of the anchor coal */
  const F = U.fuel.reduce((a, l) => a + (anUnitVal(l) || 0), 0),
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
    /* raised by the vacuum pumps at a steady rate, lost first order */
    U.vac = Math.max(0, Math.min(1, cw > U.vac ? U.vac + dt / U.vacUp : U.vac + ((cw - U.vac) * dt) / U.vacDn));
    const tb0 = U.tb,
      l = U.vtrip;
    if (tb0 && tb0.st !== 'off' && U.vac < 0.6 && l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n) && l.S.rt.ext[l.n] !== 1) {
      l.S.rt.ext[l.n] = 1;
    }
  }
  const trip = (U.trip || []).some(t => +t.S.rt.v[t.n] > 0.5);
  /* ---- 2.2.0-beta.17 (M4 step 4): the turbine black box (see AN_UNIT rollRate ...) ---- */
  const tb = U.tb || (U.tb = { st: 'load', rpm: 3600, icv: 1, xfer: true, tgt: NaN, aim: NaN }),
    dirt = (l, x) => {
      if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n) && l.S.rt.ext[l.n] !== x) l.S.rt.ext[l.n] = x;
    };
  if (trip && tb.st !== 'off') {
    /* the TCS closes the ICV too (the HP valves below); in a start-up the machine is lost: stop valves shut, GCB open (I.0932, the
       generator protection), no transfer, no DCS mode */
    tb.icv = Math.max(0, tb.icv - dt / U.tauTrip);
    if (U.cold) {
      Object.assign(tb, { st: 'off', xfer: false, tgt: 0, aim: 0 });
      dirt(U.di.gcbOn, 0);
      dirt(U.di.gcbOff, 1);
      dirt(U.di.xfer, 0);
      dirt(U.di.perm, 0);
      dirt(U.di.on, 0);
    }
  }
  U.turb = tb.st !== 'off';
  const onGrid = tb.st === 'sync' || tb.st === 'load';
  if (tb.st === 'roll') {
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
  const k = U.Kt * U.gv,
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
    fr = Math.max(0, Math.min(1, U.Qs / Math.max(1, mso))),
    tsat = tsatOf(U.Pd);
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
    pr.ld = (pr.sg || -1) * (A * (1 - gx) + e.s * below);
  }
  /* the headers after the spray: spray outlet + the pickup of the next superheater at the anchor, metal lag */
  for (const h of U.sh) {
    const pv = +h.S.rt.v[h.n];
    if (!isFinite(pv)) continue;
    h.x += ((pv - h.x) * dt) / U.tauT;
    /* 2.2.0-beta.14 (cold): the header after the spray cannot be above the gas (bed) nor below saturation either */
    if (U.cold) {
      const cap = Math.max(tsat, U.Tb);
      for (const L of h.L) anUnitWrite(L, i => Math.max(tsat, Math.min(cap, L.a0[i] + h.x - h.pv0)));
    } else for (const L of h.L) shifted(L, h.x - h.pv0);
  }
  /* O2 of the flue gas: 21 x (1 - stoichiometric air / total air), analyzer lag; each analyzer keeps its offset of the snapshot */
  if (U.afs > 0) {
    const taf = U.taf.reduce((a, n) => a + (+U.tafS.rt.v[n] || 0), 0),
      o2s = Math.max(0, Math.min(21, 21 * (1 - (Fe * U.afs) / Math.max(1, taf))));
    U.o2v += ((o2s - U.o2v) * dt) / U.tauO2;
    for (const L of U.o2) shifted(L, U.o2v - U.O20);
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
    const run = !m.run.length || m.run.some(r => +r.S.rt.v[r.n] > 0.5);
    for (const p of m.pr) p.mul = run ? 1 : 0;
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
    }
  }
}
