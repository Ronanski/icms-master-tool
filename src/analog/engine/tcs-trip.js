/* 3.2.1 plan c1, c2: the TURBINE TRIP runs through the gates of the Interlock Block Diagram 310SC90-794 rev 2. The gates are the sheets of
   tcs-ibd-data.js (read from the PDF by tools/data/ibd_read.mjs); this file gives them their field values and set points, runs them and
   reads the result: TA-1 net TA1_RESET = 1 the turbine is reset; a fall of it is the trip, and the rows of TA-9 standing at that scan are the
   first out. U.tc.trip = the first-out name, read by unit.js (it writes I.0400 TURBINE TRIP).
   Symbols, sheet 13: S / R reset has priority; DI delay pick up; DT delay drop out; PO one shot; (WO) A AND NOT C; MID median; 2/3.
   The set point digits on the drawing are strokes, not text: TCS_IBD_SP holds them by sheet and block, read from the sheet images
   (team-files/plant-study/05-turbine-electrical.md sections 4 and 5). A comparator with no entry stays 0 and is listed by AN.tcsIbdMissing().
   One value per quantity: the model has one transmitter where the plant has three, so A, B and C read the same value. */
const TCS_MFT_ROW = 12; /* DITL-03A out 13 = MFT (guide.js purge step) */
const TA1_RESET = 3; /* TA-1 the A gate: all trip conditions off and reset */
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
/* the value of a field signal by its tag on the sheet; NaN = no value in the model */
const TCS_IBD_PV = [
  [/PT-STn110/, U => U.cdP],
  [/TE-MSn902/, U => tcsSteam(U).mst],
  [/PT-STn001/, U => tcsFst(U)],
  [/PT-LOn006/, U => U.loCtl],
  [/PT-LOn003/, U => U.loBrg],
  [/PT-LOn007/, U => U.loTrip],
  [/TE-STn110/, (U, c) => c.Tx],
  [/SE-STn001/, U => (U.tb ? U.tb.rpm : 0)],
  [/PT-CRn901|HP TURBINE EXHAUST .*STEAM PRESS/, U => tcsCrp(U)],
  [/GENERATOR LOAD/, U => ((+U.MW || 0) / 150) * 100]
];
/* comparators: 'sheet@x,y': [on, off], on < off = low side (on at or below), on > off = high side (on at or above); or a function of U */
const hi = (a, b) => [a, b];
const TCS_IBD_SP = {
  'TA-10@473,686': hi(0.26, 0.22),
  'TA-10@473,630': hi(0.26, 0.22),
  'TA-10@473,574': hi(0.26, 0.22),
  'TA-10@647,400': hi(0.14, 0.12) /* LOW */,
  'TA-10@647,319': [0.12, 0.14] /* NORMAL */,
  'TA-10@647,238': hi(1.0, 0.96),
  'TA-11@549,560': U => tcsSteam(U).mst <= tcsLin(TCS_MST, tcsFst(U)),
  'TA-11@549,362': U => tcsSteam(U).mst <= tcsLin(TCS_MST, tcsFst(U)),
  'TA-11@549,221': U => tcsSteam(U).mst <= tcsLin(TCS_MST, tcsFst(U)),
  'TA-11@687,664': [290, 295] /* LOW, annunciator */,
  'TA-11@442,447': hi(20, 17) /* generator load % */,
  'TA-12@548,698': hi(0.8, 0.7),
  'TA-12@548,584': hi(0.8, 0.7),
  'TA-12@548,470': hi(0.8, 0.7),
  'TA-12@548,642': [-1.18, -1.08],
  'TA-12@548,529': [-1.18, -1.08],
  'TA-12@548,415': [-1.18, -1.08],
  'TA-12@647,339': hi(0.6, 0.5),
  'TA-12@647,286': [-0.98, -0.88],
  'TA-13@549,722': [112, 117],
  'TA-13@549,666': [112, 117],
  'TA-13@549,609': [112, 117],
  'TA-13@695,548': [133, 138] /* LOW */,
  'TA-13@549,482': [0.7, 1.05],
  'TA-13@549,426': [0.7, 1.05],
  'TA-13@549,369': [0.7, 1.05],
  'TA-13@696,329': [1.05, 1.33] /* LOW */,
  'TA-13@696,269': hi(1.02, 0.71) /* NORMAL */,
  'TA-14@553,707': hi(107, 104),
  'TA-14@553,650': hi(107, 104),
  'TA-14@553,594': hi(107, 104),
  'TA-14@553,525': hi(80, 77) /* HIGH */,
  'TA-14@553,455': [81, 86],
  'TA-14@553,398': [81, 86],
  'TA-14@553,342': [81, 86],
  'TA-15@525,707': hi(4023, 4005) /* 111.75 %, 111.25 % */,
  'TA-15@525,642': hi(4023, 4005),
  'TA-15@525,577': hi(4023, 4005),
  'TA-15@525,355': hi(3978, 3960) /* 110.5 %, 110 % */,
  'TA-15@525,298': hi(3978, 3960),
  'TA-15@525,242': hi(3978, 3960),
  'TA-15@525,476': [2400, 2450],
  'TA-15@525,411': [0.67, 2],
  'TA-20@465,691': hi(420, 415),
  'TA-20@465,606': hi(420, 415),
  'TA-20@465,522': hi(420, 415),
  'TA-20@524,425': hi(400, 395),
  'TA-21@586,581': U => tcsFst(U) - tcsCrp(U) >= tcsLin(TCS_DP, tcsFst(U)),
  'TA-21@586,440': U => tcsFst(U) - tcsCrp(U) >= tcsLin(TCS_DP, tcsFst(U)),
  'TA-21@586,295': U => tcsFst(U) - tcsCrp(U) >= tcsLin(TCS_DP, tcsFst(U)),
  'TA-21@422,182': hi(30, 27) /* generator load % */,
  'TA-22@476,682': hi(44.9, 42.9),
  'TA-22@476,626': hi(44.9, 42.9),
  'TA-22@476,569': hi(44.9, 42.9),
  'TA-22@555,434': hi(42.7, 40.7) /* HIGH with the turbine tripped */
};
const TCS_IBD = {
  by: {},
  bind: null
};
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
/* once: the sheets by name, the source of each off-page link, the field value of each named input */
function tcsIbdBind() {
  if (TCS_IBD.bind) return TCS_IBD.bind;
  const L = [];
  for (const s of TCS_IBD_SHEETS) TCS_IBD.by[s.id] = s;
  for (const s of TCS_IBD_SHEETS) {
    const r = { s, link: [], pv: [], mft: [] };
    for (const [net, num, to, dep] of s.x) {
      if (!dep) continue;
      const b = TCS_IBD.by[to.split('/')[0]],
        h = b && b.x.find(x => !x[3] && x[1] === num && x[2].includes(s.id));
      if (h) r.link.push([net, b.id, h[0]]);
    }
    for (const [net, name] of s.i) {
      if (/BOILER MFT/.test(name)) r.mft.push(net);
      const p = TCS_IBD_PV.find(q => q[0].test(name));
      if (p) r.pv.push([net, p[1]]);
    }
    L.push(r);
  }
  return (TCS_IBD.bind = L);
}
const tcsIb = c =>
  c.ib ||
  (c.ib = {
    v: {},
    t: {},
    cmp: {},
    fx: {},
    pb: {},
    r1: false,
    t0: 0,
    first: '',
    at: 0,
    ext: false,
    mft0: false,
    rst0: false
  });
/* a time written on a timer of the sheet, seconds */
const tcsIbdT = x => {
  const m = /^([0-9.]+) *(s|sec|min)/i.exec(String(x || ''));
  return m ? +m[1] * (m[2].toLowerCase() === 'min' ? 60 : 1) : 0;
};
function tcsIbdStep(U, c, dt) {
  const ib = tcsIb(c),
    B = tcsIbdBind();
  for (const r of B) {
    const s = r.s,
      id = s.id,
      v = ib.v[id] || (ib.v[id] = new Array(s.n).fill(0));
    for (const [net, sh, n] of r.link) v[net] = (ib.v[sh] && ib.v[sh][n]) || 0;
    for (const [net, f] of r.pv) v[net] = +f(U, c);
    if (r.mft.length) for (const net of r.mft) v[net] = ib.mft0 && tcsMft() ? 1 : 0;
    if (id === 'TA-1') {
      /* the push buttons of TA-1 and the ATS AUTO RESET COMMAND (the ATS program sets c.rst, tcs.js) */
      if (c.rst && !ib.rst0)
        ib.pb.auto = 2; /* held 2 s: a (WO) of the trip sheets needs the command through its own scan */
      for (const [net, name] of s.i) {
        if (/TURBINE RESET/.test(name)) v[net] = ib.pb.rst > 0 ? 1 : 0;
        else if (/AUTO RESET/.test(name)) v[net] = ib.pb.auto > 0 ? 1 : 0;
        else if (/PB/.test(name)) v[net] = ib.pb.trip > 0 ? 1 : 0;
      }
    }
    for (const k in ib.fx) if (k.startsWith(id + ':')) v[+k.split(':')[1]] = ib.fx[k];
    /* two passes: a chain of gates settles in one step */
    for (let pass = 0; pass < 2; pass++)
      s.g.forEach((g, i) => {
        const [t, ins, out, x] = g;
        if (out < 0) return;
        const a = ins.map(n => v[n] || 0);
        let o = 0;
        if (t === 'A') o = a.length && a.every(q => q > 0.5) ? 1 : 0;
        else if (t === 'OR') o = a.some(q => q > 0.5) ? 1 : 0;
        else if (t === 'NOT') o = a[0] > 0.5 ? 0 : 1;
        else if (t === '2/3') o = a.filter(q => q > 0.5).length >= 2 ? 1 : 0;
        else if (t === 'WO') o = a[0] > 0.5 && !(v[x[0]] > 0.5) ? 1 : 0;
        else if (t === 'FF') o = x.some(n => v[n] > 0.5) ? 0 : ins.some(n => v[n] > 0.5) ? 1 : v[out];
        else if (t === 'MID') {
          const q = ins
            .map(n => v[n])
            .filter(isFinite)
            .sort((p, w) => p - w);
          o = q.length ? q[(q.length - 1) >> 1] : NaN;
        } else if (t === 'CMP') {
          const key = id + '@' + g[4] + ',' + g[5],
            sp = TCS_IBD_SP[key],
            pv = v[ins[0]];
          if (typeof sp === 'function') o = sp(U) ? 1 : 0;
          else if (!sp || !isFinite(pv)) o = 0;
          else if (sp[0] >= sp[1]) o = pv >= sp[0] || (v[out] > 0.5 && pv > sp[1]) ? 1 : 0;
          else o = pv <= sp[0] || (v[out] > 0.5 && pv < sp[1]) ? 1 : 0;
        } else if (t === 'DI' || t === 'DT' || t === 'PO') {
          const k = id + ':' + i,
            T = tcsIbdT(x),
            on = a[0] > 0.5;
          if (pass === 0) {
            if (t === 'DI') ib.t[k] = on ? (ib.t[k] || 0) + dt : 0;
            else if (t === 'DT') ib.t[k] = on ? T : Math.max(0, (ib.t[k] || 0) - dt);
            else {
              if (on && !ib.t[k + 'e']) ib.t[k] = T;
              ib.t[k + 'e'] = on ? 1 : 0;
              ib.t[k] = Math.max(0, (ib.t[k] || 0) - dt);
            }
          }
          o =
            t === 'DI' ? (on && ib.t[k] >= T ? 1 : 0) : t === 'DT' ? (on || ib.t[k] > 0 ? 1 : 0) : ib.t[k] > 0 ? 1 : 0;
        } else
          o =
            a[0] ||
            0; /* FG, LS, FLK: the value passes; a sheet that needs them has its comparator as a function above */
        v[out] = o;
      });
    for (const k in ib.fx) if (k.startsWith(id + ':')) v[+k.split(':')[1]] = ib.fx[k];
  }
  ib.rst0 = !!c.rst;
  ib.pb.trip = Math.max(0, (ib.pb.trip || 0) - dt);
  ib.pb.rst = Math.max(0, (ib.pb.rst || 0) - dt);
  ib.pb.auto = Math.max(0, (ib.pb.auto || 0) - dt);
}
/* the event of the engine only: a mirror page gets it from the worker */
const tcsTripLog = n => {
  if (window.lsEventAdd && !(window.ENG && ENG.mode === 'mirror'))
    lsEventAdd('TCS TA-9', 'TRIP', 'TURBINE TRIP, first out: ' + n);
};
/* the name of a row of TA-9 without its off-page number */
const tcsIbdName = n =>
  n
    .replace(/SH-.*$/, '')
    .replace(/\(\*[0-9]\)/g, '')
    .replace(/\b[0-9]+\b/g, '')
    .replace(/ +/g, ' ')
    .trim();
function tcsTripFirst(c) {
  const ib = tcsIb(c),
    s = TCS_IBD.by['TA-9'],
    v = ib.v['TA-9'] || [];
  if (ib.pb.trip > 0) return 'MANUAL TRIP';
  const r = s && s.i.find(i => v[i[0]] > 0.5);
  return r ? tcsIbdName(r[1]) : 'TURBINE TRIP COMMAND';
}
/* every step of the TCS, no trip standing (tcsStep) */
function tcsTripScan(U, dt) {
  const c = U.tc,
    tb = U.tb,
    ib = tcsIb(c);
  /* the I.0400 of the drawing went back to 0 by itself (a forced test input): the name of that trip goes with it */
  if (ib.ext) {
    ib.ext = false;
    ib.first = '';
  }
  ib.t0 += dt;
  if (!tcsMft()) ib.mft0 = true;
  const a = !!(ib.v['TA-1'] && ib.v['TA-1'][TA1_RESET] > 0.5);
  tcsIbdStep(U, c, dt);
  const b = ib.v['TA-1'][TA1_RESET] > 0.5;
  if (b) {
    ib.r1 = true;
    if (c.trip) {
      c.trip = '';
      ib.first = '';
      const l = U.vtrip;
      if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n)) l.S.rt.ext[l.n] = 0;
    }
  }
  /* the first 2 s of a run: the values settle from the starting state */
  if (ib.t0 < 2) return;
  if (a && !b && !c.trip && (tb.st !== 'off' || tb.rpm > 4)) {
    ib.first = tcsTripFirst(c);
    ib.at = +U.t || 0;
    c.trip = ib.first;
    tcsTripLog(ib.first);
  }
}
/* I.0400 stands: the sheets go on, so a Turbine reset is seen; a trip that did not pass TA-1 still gets its name */
function tcsTripHold(U, dt) {
  const c = U.tc,
    ib = tcsIb(c);
  tcsIbdStep(U, c, dt);
  if (ib.v['TA-1'][TA1_RESET] > 0.5 && c.trip) {
    c.trip = '';
    ib.first = '';
    const l = U.vtrip;
    if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n)) l.S.rt.ext[l.n] = 0;
    return;
  }
  if (ib.first) return;
  const v = isFinite(U.cdP) && U.cdP > AN_CD.Ptrip;
  ib.first = v ? 'CONDENSER VACUUM VERY LOW TRIP' : 'TURBINE TRIP (DCS I.0400)';
  ib.at = +U.t || 0;
  ib.ext = !v;
  tcsTripLog(ib.first);
}
/* TA-1 TURBINE TRIP P.B. */
function tcsTripManual(U) {
  const c = U.tc,
    ib = tcsIb(c);
  if (c.trip) return 'The turbine is already tripped: ' + c.trip;
  ib.pb.trip = 1.5;
  return '';
}
/* TA-1 TURBINE RESET P.B.: the gates decide; a held TA-9 keeps the A gate at 0 */
function tcsTripReset(U) {
  const ib = tcsIb(U.tc);
  ib.pb.rst = 1.5;
  return '';
}
/* a signal of a sheet held at a value (a field contact, a test) */
function tcsTripFault(U, a) {
  const ib = tcsIb(U.tc),
    k = a.id + ':' + a.net;
  if (a.on == null) delete ib.fx[k];
  else ib.fx[k] = a.on ? 1 : 0;
  return '';
}
/* what the TCS panel shows */
function tcsTripState(U) {
  const ib = tcsIb(U.tc);
  return { first: ib.first, at: ib.at };
}
/* the live values of one sheet, for the drawing */
function tcsIbdState(id) {
  const c = AN_UNIT.tc,
    ib = c && c.ib;
  return ib ? { v: ib.v[id] || [], fx: ib.fx } : null;
}
/* the comparators of the sheets with no set point yet (no assumed value: they stay 0) */
function tcsIbdMissing() {
  const L = [];
  for (const s of TCS_IBD_SHEETS)
    for (const g of s.g)
      if (g[0] === 'CMP' && !TCS_IBD_SP[s.id + '@' + g[4] + ',' + g[5]]) L.push(s.id + '@' + g[4] + ',' + g[5]);
  return L;
}
