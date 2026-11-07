/* 3.2.1 plan c1: TURBINE TRIP LOGIC from the IBD (Interlock Block Diagram 310SC90-794 rev 2, 2016-07-18, SMC Limay).
   TA-9 TRIP LOGIC (TOTAL): every row of TCS_TRIP is one input of the OR of TA-9, in the order of the sheet; the OR goes to TA-1 TURBINE
   MASTER TRIP. TA-1: TURBINE TRIP P.B. of the control room and of the TCS HMI, TURBINE RESET P.B. (ATS AUTO RESET too).
   The set points: IBD sheets named in `sh`, read in team-files/plant-study/05-turbine-electrical.md section 4 and 5.
   One value per quantity: the model has one transmitter where the plant has three, so the 2oo3 of the sheet is that one value.
   A row with no value in the model (`pv` absent) is a field fault only: AN.turbine('fault', { k, on }) sets its contact.
   The state is U.tc.tt (made again by tcsInit); U.tc.trip = the first-out name, read by unit.js (it writes I.0400 TURBINE TRIP). */
const TCS_MFT_ROW = 12; /* DITL-03A out 13 = MFT (guide.js purge step) */
/* TA-21: HP first stage pressure kg/cm2 g -> TRIP limit of inlet / exhaust differential pressure, kg/cm2 */
const TCS_DP = [
  [0, 26.72],
  [31.9, 26.72],
  [51.5, 39.02],
  [72.2, 52.22],
  [104.2, 72.92],
  [107.4, 74.92],
  [111.1, 77.42],
  [150, 77.42]
];
/* TA-11: HP first stage pressure kg/cm2 g -> main steam temperature VERY LOW trip line, C */
const TCS_MST = [
  [0, 395.3],
  [33.4, 395.3],
  [42.8, 417],
  [55.2, 419.6],
  [61.7, 421.6],
  [72.2, 423.4],
  [88, 425.5],
  [104.2, 427.2],
  [150, 432]
];
const tcsFst = U => (U.pist && U.pist.length ? anUnitVal(U.pist[0]) : NaN); /* PT-ST1001 */
const tcsCrp = U => (U.rhp && U.rhp.length > 2 ? anUnitVal(U.rhp[2]) : NaN); /* PT-CR1006 */
/* a shaft vibration of bearing i (1 ~ 4): VERY HIGH 0.200 mm on X or Y AND any other shaft vibration at HIGH 0.125 mm (TA-17) */
const tcsVib = (U, i) => {
  const all = [];
  for (let j = 1; j <= 4; j++) all.push(['x' + j, +U['loVx' + j] || 0], ['y' + j, +U['loVy' + j] || 0]);
  const mine = all.filter(a => a[0].slice(1) === String(i)).sort((a, b) => b[1] - a[1])[0];
  return mine[1] >= 0.2 && all.some(a => a[0] !== mine[0] && a[1] >= 0.125) ? mine[1] : 0;
};
/* hi: on at or above on, off at or below off; lo: on at or below on, off at or above off; dl: delay s */
const TCS_TRIP = [
  {
    k: 'vac',
    t: 'CONDENSER VACUUM VERY LOW',
    sh: 'TA-10',
    pv: U => U.cdP,
    hi: 1,
    on: 0.26,
    off: 0.22,
    u: 'kg/cm2 abs'
  },
  {
    k: 'mst',
    t: 'MAIN STEAM TEMPERATURE VERY LOW',
    sh: 'TA-11',
    pv: U => tcsSteam(U).mst,
    on: U => (isFinite(tcsFst(U)) ? tcsLin(TCS_MST, tcsFst(U)) : NaN),
    dl: 3,
    u: 'C',
    arm: T => T.a20 /* armed after 20 % load, reset by the trip */
  },
  { k: 'thf', t: 'THRUST BEARING FAILURE (FRONT)', sh: 'TA-12' },
  { k: 'thr', t: 'THRUST BEARING FAILURE (REAR)', sh: 'TA-12' },
  { k: 'ctl', t: 'CONTROL OIL PRESSURE VERY LOW', sh: 'TA-13', pv: U => U.loCtl, on: 112, off: 117, u: 'kg/cm2' },
  { k: 'brg', t: 'BEARING OIL PRESSURE VERY LOW', sh: 'TA-13', pv: U => U.loBrg, on: 0.7, off: 1.05, u: 'kg/cm2' },
  {
    k: 'hood',
    t: 'LP EXHAUST HOOD TEMPERATURE VERY HIGH',
    sh: 'TA-14',
    pv: (U, c) => c.Tx,
    hi: 1,
    on: 107,
    off: 104,
    u: 'C'
  },
  {
    k: 'toil',
    t: 'TURBINE TRIP OIL PRESSURE VERY LOW',
    sh: 'TA-14',
    pv: U => U.loTrip,
    on: 81,
    off: 86,
    dl: 2,
    u: 'kg/cm2',
    arm: T => !(T.rst60 > 0) /* TA-14: the TURBINE RESET COMMAND goes through a 60 s DT into this row */
  },
  {
    k: 'bos',
    t: 'TURBINE BACK-UP OVERSPEED',
    sh: 'TA-15',
    pv: U => U.tb.rpm,
    hi: 1,
    on: 4023,
    off: 4005,
    u: 'rpm'
  } /* 111.75 %, 111.25 % */,
  {
    k: 'eos',
    t: 'TURBINE OVERSPEED',
    sh: 'TA-15',
    pv: U => U.tb.rpm,
    hi: 1,
    on: 3978,
    off: 3960,
    u: 'rpm'
  } /* 110.5 %, 110 % */,
  {
    k: 'v1',
    t: 'No.1 TURBINE SHAFT VIBRATION VERY HIGH',
    sh: 'TA-17',
    pv: U => tcsVib(U, 1),
    hi: 1,
    on: 0.2,
    off: 0.2,
    dl: 3,
    u: 'mm'
  },
  {
    k: 'v2',
    t: 'No.2 TURBINE SHAFT VIBRATION VERY HIGH',
    sh: 'TA-17',
    pv: U => tcsVib(U, 2),
    hi: 1,
    on: 0.2,
    off: 0.2,
    dl: 3,
    u: 'mm'
  },
  {
    k: 'v3',
    t: 'No.3 GENERATOR SHAFT VIBRATION VERY HIGH',
    sh: 'TA-17',
    pv: U => tcsVib(U, 3),
    hi: 1,
    on: 0.2,
    off: 0.2,
    dl: 3,
    u: 'mm'
  },
  {
    k: 'v4',
    t: 'No.4 GENERATOR SHAFT VIBRATION VERY HIGH',
    sh: 'TA-17',
    pv: U => tcsVib(U, 4),
    hi: 1,
    on: 0.2,
    off: 0.2,
    dl: 3,
    u: 'mm'
  },
  {
    k: 'hpt',
    t: 'HP EXHAUST STEAM TEMPERATURE VERY HIGH',
    sh: 'TA-20'
  } /* TE-ST1003: no value in the model; ON 420, OFF 415 C */,
  {
    k: 'hpd',
    t: 'HP INLET / EXHAUST DIFFERENTIAL PRESSURE VERY HIGH',
    sh: 'TA-21',
    pv: U => tcsFst(U) - tcsCrp(U),
    hi: 1,
    on: U => (isFinite(tcsFst(U)) ? tcsLin(TCS_DP, tcsFst(U)) : NaN),
    u: 'kg/cm2',
    arm: T => T.a30 /* active at or above 30 % load (off 27 %) */
  },
  {
    k: 'hpp',
    t: 'HP EXHAUST STEAM PRESSURE VERY HIGH',
    sh: 'TA-22',
    pv: U => tcsCrp(U),
    hi: 1,
    on: 44.9,
    off: 42.9,
    u: 'kg/cm2'
  },
  {
    k: 'mft',
    t: 'BOILER MASTER FUEL TRIP',
    sh: 'TA-9',
    pv: () => (tcsMft() ? 1 : 0),
    hi: 1,
    on: 1,
    off: 0,
    arm: T => T.mft0
  },
  { k: 'mjr', t: 'TCS MAJOR TROUBLE', sh: 'TA-9' },
  { k: 'gpa', t: 'GENERATOR / UNIT TRANSFORMER PROTECTION A', sh: 'TA-9, G-9' },
  { k: 'gpb', t: 'GENERATOR / UNIT TRANSFORMER PROTECTION B', sh: 'TA-9, G-9' },
  { k: 'ats', t: 'ATS TURBINE SHUTDOWN COMMAND', sh: 'TA-9' }
];
/* the MFT of the one world (DITL-03A), read from the engine's last scan; false with no world */
function tcsMft() {
  try {
    const W = window.WORLD;
    if (!W || !W.on || typeof S === 'undefined') return false;
    /* by index: a Reset makes the sheets again */
    if (!(S.sheets[TCS.d3i] && /DITL-03A$/.test(S.sheets[TCS.d3i].name)))
      TCS.d3i = S.sheets.findIndex(x => /DITL-03A$/.test(x.name));
    const s = S.sheets[TCS.d3i];
    const o = s && s.nl && s.nl.outs.find(x => x.row === TCS_MFT_ROW);
    return !!(o && s.nl._v && s.nl._v[o.n]);
  } catch (e) {
    return false;
  }
}
const tcsTT = c =>
  c.tt ||
  (c.tt = {
    t: 0,
    first: '',
    at: 0,
    on: {},
    d: {},
    f: {},
    a20: false,
    a30: false,
    mft0: false,
    rst60: 0,
    rst0: false,
    ext: false
  });
const tcsVal = (x, U) => (typeof x === 'function' ? x(U) : x);
/* the comparators of the rows; returns the rows that stand at 1 now (delay and arming not asked) */
function tcsTripEval(U, c, T) {
  const L = [];
  for (const r of TCS_TRIP) {
    let on = !!T.f[r.k];
    if (r.pv) {
      const v = +r.pv(U, c),
        a = +tcsVal(r.on, U);
      if (!isFinite(v) || !isFinite(a)) {
        T.on[r.k] = false;
      } else {
        const b = r.off != null ? +tcsVal(r.off, U) : a;
        T.on[r.k] = r.hi ? v >= a || (!!T.on[r.k] && v > b) : v <= a || (!!T.on[r.k] && v < b);
      }
      on = on || T.on[r.k];
    }
    if (on) L.push(r);
  }
  return L;
}
/* the event of the engine only: a mirror page gets it from the worker */
const tcsTripLog = n => {
  if (window.lsEventAdd && !(window.ENG && ENG.mode === 'mirror'))
    lsEventAdd('TCS TA-9', 'TRIP', 'TURBINE TRIP, first out: ' + n);
};
function tcsTripFire(U, c, T, name) {
  T.first = name;
  T.at = +U.t || 0;
  c.trip = name;
  tcsTripLog(name);
}
/* every step of the TCS, no trip standing (tcsStep) */
function tcsTripScan(U, dt) {
  const c = U.tc,
    tb = U.tb,
    T = tcsTT(c);
  /* the I.0400 of the drawing went back to 0 by itself (a forced test input): the name of that trip goes with it */
  if (T.ext) {
    T.ext = false;
    T.first = '';
  }
  T.t += dt;
  if (c.rst && !T.rst0) T.rst60 = 60;
  T.rst0 = !!c.rst;
  T.rst60 = Math.max(0, T.rst60 - dt);
  const MW = +U.MW || 0;
  if (MW >= 30) T.a20 = true;
  T.a30 = MW >= 45 || (T.a30 && MW > 40.5);
  if (!tcsMft()) T.mft0 = true;
  const L = tcsTripEval(U, c, T);
  /* the first 2 s of a run: the values settle from the starting state */
  if (c.trip || T.t < 2 || !(tb.st !== 'off' || tb.rpm > 4)) return;
  for (const r of TCS_TRIP) {
    const on = L.includes(r) && (!r.arm || r.arm(T));
    T.d[r.k] = on ? (T.d[r.k] || 0) + dt : 0;
    if (on && T.d[r.k] >= (r.dl || 0)) return tcsTripFire(U, c, T, r.t);
  }
}
/* I.0400 stands: a trip that did not come through the rows above still gets its name on the panel */
function tcsTripHold(U) {
  const c = U.tc,
    T = tcsTT(c);
  if (T.first) return;
  const v = isFinite(U.cdP) && U.cdP > AN_CD.Ptrip;
  T.first = v ? TCS_TRIP[0].t : 'TURBINE TRIP (DCS I.0400)';
  T.at = +U.t || 0;
  T.ext = !v;
  tcsTripLog(T.first);
}
/* TA-1 TURBINE TRIP P.B. */
function tcsTripManual(U) {
  const c = U.tc,
    T = tcsTT(c);
  if (c.trip) return 'The turbine is already tripped: ' + c.trip;
  tcsTripFire(U, c, T, 'MANUAL TRIP');
  return '';
}
/* TA-1 TURBINE RESET P.B.: refused while the OR of TA-9 stands */
function tcsTripReset(U) {
  const c = U.tc,
    T = tcsTT(c),
    L = tcsTripEval(U, c, T).filter(r => !r.arm || r.k === 'mft');
  if (L.length) return 'Reset refused, the trip still stands: ' + L[0].t;
  c.trip = '';
  T.first = '';
  T.ext = false;
  T.d = {};
  T.a20 = false;
  T.a30 = false;
  const l = U.vtrip;
  if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n)) l.S.rt.ext[l.n] = 0;
  return '';
}
/* a contact of the field (a row with no value in the model, or a test of a row that has one) */
function tcsTripFault(U, a) {
  const c = U.tc,
    T = tcsTT(c),
    r = TCS_TRIP.find(x => x.k === (a && a.k));
  if (!r) return 'Unknown trip: ' + (a && a.k);
  T.f[r.k] = a.on !== 0 && a.on !== false;
  return '';
}
/* the text of the sheets (plan c2, src/ui/shell/tcslogic.js): field tag, comparator, vote. Tags with the unit digit 1 of the n of the IBD */
const TCS_TRIP_TXT = {
  vac: ['PT-ST1110-1, 2, 3', 'at or above 0.26, reset 0.22 kg/cm2 abs', '2 out of 3, latched'],
  mst: ['TE-MS1902-1, 2, 3', 'trip line of first stage pressure, 3 s, after 20 % load', '2 out of 3'],
  thf: ['ZE-ST1003-1, 2, 3', 'rotor position +0.8 or -1.18 mm', '2 out of 3'],
  thr: ['ZE-ST1003-1, 2, 3', 'rotor position +0.8 or -1.18 mm', '2 out of 3'],
  ctl: ['PT-LO1006-1, 2, 3', 'at or below 112, reset 117 kg/cm2', '2 out of 3'],
  brg: ['PT-LO1003-1, 2, 3', 'at or below 0.7, reset 1.05 kg/cm2', '2 out of 3'],
  hood: ['TE-ST1110-1, 2, 3', 'at or above 107, reset 104 C', '2 out of 3'],
  toil: ['PT-LO1007-1, 2, 3', 'at or below 81, reset 86 kg/cm2, 2 s, 60 s after a reset', '2 out of 3, latched'],
  bos: ['SE-ST1001', '111.75 %, reset 111.25 %', '2 out of 3'],
  eos: ['SE-ST1001', '110.5 %, reset 110 %', '2 out of 3'],
  v1: ['VE-ST1001-1, 2', '0.200 mm and another shaft 0.125 mm, 3 s', ''],
  v2: ['VE-ST1002-1, 2', '0.200 mm and another shaft 0.125 mm, 3 s', ''],
  v3: ['VE-GE1001-1, 2', '0.200 mm and another shaft 0.125 mm, 3 s', ''],
  v4: ['VE-GE1002-1, 2', '0.200 mm and another shaft 0.125 mm, 3 s', ''],
  hpt: ['TE-ST1003-1, 2, 3', 'at or above 420, reset 415 C', '2 out of 3'],
  hpd: ['PT-ST1001 minus PT-CR1901', 'limit table of first stage pressure, at 30 % load or above', '2 out of 3'],
  hpp: ['PT-CR1901-1, 2, 3', 'at or above 44.9, reset 42.9 kg/cm2', '2 out of 3']
};
/* what the TCS panel shows */
function tcsTripState(U) {
  const c = U.tc,
    T = tcsTT(c);
  return {
    first: T.first,
    at: T.at,
    rows: TCS_TRIP.map(r => ({
      k: r.k,
      t: r.t,
      sh: r.sh,
      u: r.u || '',
      on: !!(T.on[r.k] || T.f[r.k]),
      pv: r.pv ? +r.pv(U, c) : null,
      modelled: !!r.pv,
      fault: !!T.f[r.k],
      tag: (TCS_TRIP_TXT[r.k] || [])[0] || '',
      lim: (TCS_TRIP_TXT[r.k] || [])[1] || '',
      vote: (TCS_TRIP_TXT[r.k] || [])[2] || ''
    }))
  };
}
