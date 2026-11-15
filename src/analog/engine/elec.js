/* 3.2.3 plan c4: a simple electrical model of the unit from the Single Line Diagram (as built):
   - K1AU3E1-0003 rev 2 KEY ONE LINE DIAGRAM: generator G1 176.5 MVA 13.8 kV 0.85 pf -> GMCB G1 10000 A (= 52G1) -> main transformer
     TR 2310 180 / 225 MVA (ONAN / ONFA) 13.8 / 230 kV Z 14 % -> GCB 2310 (SYN, 245 kV 4000 A = 52L1) -> 230 kV line. The unit auxiliary
     transformer TR-1A1 13.8 / 6.6 kV 34 / 44 MVA Z 10 % is tapped between the GMCB and the main transformer and feeds 6.6 kV BUS 1AM
     (4000 A) through VCB1AM; TR-1B1 / TR-1B2 6.6 kV / 460 V 2500 kVA feed the 460 V buses.
   - K1AU3E1-0008: the 6.6 kV motors of bus 1A (ACWP, CEP A / B, BFP A / B, IDF, PAF, SAF, FA blower A / B, PA compressor, seawater pump),
     all with soft starters. Their currents are the plant model currents below (the same values the HMI pages show).
   The house load = the 6.6 kV motors: P = 1.732 x 6.6 kV x I x pf. pf 0.85 = NO-SOURCE (no motor data sheet for every motor). The 460 V
   loads (IA compressors, SWBP, make-up water pumps, lighting, etc.) are NOT counted: NO-SOURCE for their sum.
   Before 52G1 closes the house load comes back from the 230 kV grid through the main transformer and TR-1A1 (back-feed, 52L1 closed).
   House load operation (52L1 open while 52G1 is closed, the ABC-050 input I.0937 "52L1 OPEN FOR HOUSE OPERATION"): the turbine
   carries the house load only (the TCS speed control keeps 3600 rpm; the load swing itself is NO-SOURCE, the model goes to the house
   load at the TCS valve rate; the 106 % speed peak of a load rejection (SU) is not modelled). The relays 78 / 81 open 52L1 in the plant
   (generator protection relay settings, plant study 05); here the instructor opens it. 52L1 closes again from the instructor command:
   the plant synchronizes it with ASD2 (sync check relay 25), the model closes it at once; then the operator raises the load again.
   Not modelled: a blackout of the 6.6 kV bus, the 6.6 kV bus transfer, the diesel generator DG1. */
const AN_EL = {
  kV: 6.6,
  pf: 0.85 /* NO-SOURCE */,
  mt: 180 /* MVA, TR 2310 ONAN */,
  uat: 34 /* MVA, TR-1A1 ONAN */,
  bus: 4000 /* A, BUS 1AM */,
  /* plant model currents of the 6.6 kV motors of K1AU3E1-0008 */
  mot: [
    ['swIa0', 'Seawater pump A'],
    ['swIa1', 'Seawater pump B'],
    ['swIa2', 'Seawater pump C'],
    ['fnPafI', 'Primary air fan'],
    ['fnSafI', 'Secondary air fan'],
    ['fnIdfI', 'Induced draft fan'],
    ['fnIa', 'Fluidizing air blower A'],
    ['fnIb', 'Fluidizing air blower B'],
    ['fwI0', 'Boiler feed water pump A'],
    ['fwI1', 'Boiler feed water pump B'],
    ['cdI0', 'Condensate pump A'],
    ['cdI1', 'Condensate pump B'],
    ['acI0', 'Auxiliary cooling water pump A'],
    ['acI1', 'Auxiliary cooling water pump B'],
    ['paI0', 'Plant air compressor A'],
    ['paI1', 'Plant air compressor B'],
    ['paI2', 'Plant air compressor C']
  ]
};
function anElec(U) {
  U = U || AN_UNIT;
  if (!U || !U.on) return null;
  const e = U.el || (U.el = { l52: true }),
    tb = U.tb || {},
    g52 = tb.st === 'sync' || tb.st === 'load',
    G = typeof anGenEl === 'function' ? anGenEl() : null,
    I = AN_EL.mot.reduce((a, [k]) => a + Math.max(0, +U[k] || 0), 0),
    Pa = (Math.sqrt(3) * AN_EL.kV * I * AN_EL.pf) / 1000,
    Qa = Pa * Math.tan(Math.acos(AN_EL.pf)),
    Pg = g52 && G ? +U.MW || 0 : 0 /* beta.240: negative = reverse power from the grid */,
    Qg = g52 && G ? G.MVAr || 0 : 0,
    /* the main transformer carries the generator minus the house load (export), or the house load from the grid (back-feed) */
    Pt = e.l52 ? Pg - Pa : 0,
    Qt = e.l52 ? Qg - Qa : 0,
    St = Math.hypot(Pt, Qt),
    Su = Math.hypot(Pa, Qa);
  return {
    l52: e.l52 ? 1 : 0,
    g52: g52 ? 1 : 0,
    house: !e.l52 && g52 ? 1 : 0,
    busA: I,
    busPct: (100 * I) / AN_EL.bus,
    aux: Pa,
    auxMVAr: Qa,
    gen: Pg,
    exp: Pt,
    mtMVA: St,
    mtPct: (100 * St) / AN_EL.mt,
    uatMVA: Su,
    uatPct: (100 * Su) / AN_EL.uat,
    src: g52 ? 'generator' : e.l52 ? 'grid (back-feed)' : 'none'
  };
}
/* the line breaker 52L1 as an ABC input (I.0937) and the turbine target on house load; called by the unit step */
function anElecStep(U) {
  const e = U.el || (U.el = { l52: true }),
    tb = U.tb || {},
    g52 = tb.st === 'sync' || tb.st === 'load',
    l = U.di && U.di.l52;
  if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n)) l.S.rt.ext[l.n] = e.l52 ? 0 : 1;
  if (!e.l52 && g52) {
    const x = anElec(U);
    if (x) U.tcsT = x.aux;
    /* the turbine is on speed control: the DCS control mode (TCS-DI I.0082 DCS CONTROL MODE ON) drops, so that the TCS does not take the
       turbine master demand of the DCS when 52L1 closes again (NO-SOURCE: the TCS drawings read here do not show this release) */
    const m = U.di && U.di.on;
    if (m && m.S.rt.force[m.n] === undefined && m.S.ext.includes(m.n)) m.S.rt.ext[m.n] = 0;
  }
}
/* instructor command: 0 = open 52L1 (house load operation), 1 = close it */
function anElecL52(U, on) {
  const e = U.el || (U.el = { l52: true }),
    tb = U.tb || {},
    g52 = tb.st === 'sync' || tb.st === 'load';
  on = on !== 0 && on !== false && on !== '0';
  if (on === e.l52) return on ? '52L1 is already closed' : '52L1 is already open';
  if (!on && !g52)
    return 'Open 52L1 only with the generator on line (52G1 closed): before it the house load comes from the grid through 52L1';
  e.l52 = on;
  if (on && g52) {
    /* back on the grid: the TCS keeps the house load as its target, the operator raises the load again */
    tb.tgt = tb.aim = +U.MW || 0;
  }
  return '';
}
