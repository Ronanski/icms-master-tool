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
  blo: 0.1
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
function anUnitWrite(list, x) {
  for (const [S, b] of list) {
    const s = S.rt.st[b.id];
    if (!s || b.pins.some(p => p.role === 'out' && S.rt.force[p.n] !== undefined)) continue;
    const r = b.rng,
      y = r ? Math.max(r.lo, Math.min(r.hi, x)) : x;
    s.val = s.act = y;
  }
}
/* start: the plant as it is now (end of "Start at 150 MW") is the steady state */
function anUnitStart() {
  const U = AN_UNIT;
  U.on = false;
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
  U.vlv = [
    ['ABC-050', 'PICMS1006', U.hpb],
    ['ABC-013', 'PICMS1002', U.blo]
  ]
    .map(([k, t, f]) => {
      const x = AN.sheets.find(y => y.name === k),
        c = x && x.S && AN.hmiCtrls ? (AN.hmiCtrls(x.S) || []).find(q => q.tag === t) : null;
      return c && c.out != null ? { S: x.S, n: c.out, f } : null;
    })
    .filter(Boolean);
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
    t: 0
  });
  /* the transmitters this model writes: the plant model of a loop on them stops writing (ABC-001C PIC-COBM: main steam pressure) */
  const own = new Set();
  for (const l of [U.msp, U.drum, U.msf].concat(U.mw, U.tin)) for (const [S2, b] of l) own.add(S2.rt.st[b.id]);
  U.own = own;
  U.on = true;
  AN.unit = U;
}
function anUnitOwns(T, ids) {
  const U = AN_UNIT;
  return U.on && ids && ids.length && ids.some(id => U.own.has(T.rt.st[id]));
}
/* one step of dt seconds (called by the plant step of ABC-001C) */
function anUnitStep(dt) {
  const U = AN_UNIT;
  if (!U.on || !(dt > 0)) return;
  const S = U.S,
    v = S.rt.v;
  /* coal of the three feeders (T/H) -> steam made in the drum (T/H), first order */
  const F = U.fuel.reduce((a, l) => a + (anUnitVal(l) || 0), 0),
    Qss = Math.max(0, U.m0 + U.a * (F - U.F0));
  U.Qs += ((Qss - U.Qs) * dt) / U.tauF;
  /* turbine valves (TCS): MW to the turbine master demand */
  /* DCS control mode ON (CCS, 33.PNG): the TCS follows the turbine master of the DCS (EIC-TM output, AO0359 TO TCS; in AUTO it is
     SI0236 = MW demand + pressure correction LN55). OFF: the TCS keeps its own target (where the load is when it went OFF) */
  const on = U.dcs < 0 || +v[U.dcs] > 0.5,
    tmo = U.tm && U.tm.o && U.tm.o[0] != null ? +v[U.tm.o[0]] : NaN,
    ds = U.dem >= 0 ? +v[U.dem] : NaN;
  if (on) U.tcsT = isFinite(tmo) ? tmo : isFinite(ds) ? ds : U.MW;
  else if (!isFinite(U.tcsT)) U.tcsT = U.MW;
  const D = U.tcsT;
  U.gv = Math.max(0.02, Math.min(1.4, U.gv + (dt * (D - U.MW)) / (U.tcs * U.MW0)));
  /* steam flow through the valves: m = Kt x gv x MSP, MSP = drum - kdp x m^2 */
  const k = U.Kt * U.gv,
    a2 = U.kdp * k,
    ms = a2 > 0 ? (-1 + Math.sqrt(1 + 4 * a2 * k * Math.max(0, U.Pd))) / (2 * a2) : k * U.Pd;
  U.ms = Math.max(0, ms);
  /* the other outlets: flow = share x anchor flow x opening x MSP / anchor MSP */
  const P1 = Math.max(0, U.Pd - U.kdp * U.ms * U.ms);
  U.mb = 0;
  for (const x of U.vlv) {
    const o = Math.max(0, Math.min(100, +x.S.rt.v[x.n] || 0));
    U.mb += (((x.f * U.m0 * o) / 100) * P1) / U.P0;
  }
  /* drum: stored energy */
  U.Pd = Math.max(0, U.Pd + ((U.Qs - U.ms - U.mb) * dt) / U.C);
  const Pms = Math.max(0, U.Pd - U.kdp * U.ms * U.ms);
  /* generator */
  const MWss = Math.max(0, U.MW0 + U.c * (U.ms - U.m0));
  U.MW += ((MWss - U.MW) * dt) / U.tauMW;
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
  const raw = anUnitVal(U.msf),
    cmp = +v[U.cn];
  if (isFinite(raw) && raw > 0 && isFinite(cmp) && cmp > 1) anUnitWrite(U.msf, (U.ms * raw) / cmp);
  else anUnitWrite(U.msf, U.ms);
}
