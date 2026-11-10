/* 3.2.1 (SEULGI : PLANT MODEL HELPER, boiler side; user 2026-11-04 "Cge payag" to the split with IRENE: IRENE = turbine side,
   SEULGI = boiler side). One file for the boiler-side systems of the plant model; called by unit.js (anUnitStart / anUnitCold /
   anUnitStep: one line each). Every number has its source here and in docs/versions/v3.2.1/DIESEL_OIL_PLANT_MODEL.md; NO-SOURCE =
   not found in the documents, the value used is written down.

   ===== DIESEL OIL SYSTEM (006 DIESEL OIL SYSTEM) =====
   Connection, flow diagram K1AU3-PD-022 sheet 1/5 Rev D (RB set) and Mass Balance K1AU3-MB-022 Rev 0:
     oil service tank T-0701 (LT-DO0701) -> V-DO0003 -> V-DO0004 -> suction strainer STR-DO0002 (DPT-DO0001) -> diesel oil pumps
     P-0702A / B (screw pumps, M-0702A / B: DITL-31, machine instance #B) -> common discharge (PT-DO0005, ABC-028 PICDO0005)
       -> recirculation PCV-DO0002 back to the tank (the MV of PICDO0005)
       -> unit 2 start-up burners (closed here: unit 2 is not in the plant model)
       -> unit 1 supply FCV-DO1012 (ABC-029 HICDO1012) -> burner ring (PT-DO1008, ABC-029 PICDO1008)
            -> start-up burners A ~ D: FCV-DO1043-x3 (ABC-003x FICDO1043x) -> shut-off valves XV-DO1043-x1 / x2 (DITL-16, #B ~ #D,
               "OIL SUPPLY LINE VALVE (1) / (2) OPENED") -> PT-DO1043-x2 -> oil gun (FT-DO1043-x, PV of FICDO1043x)
            -> return PCV-DO1009 (the MV of PICDO1008: back pressure of the ring) -> tank.
   Sources:
     pump     ALLWEILER screw pump SN..ER series (O&M L14-4, on the PC): positive displacement, the flow does not depend on the
              pressure; built-in pressure relief valve (8.2: "opening pressure 10 % higher than the operating pressure").
              Capacity 25 T/H, 15 kg/cm2 (MB-022 items 2-1 / 2-2 / 3); relief 16.5 kg/cm2 = 15 x 1.1.
     header   snapshot 6.PNG: PIDO0005 12.8 kg/cm2 with PCV-DO0002 24.2 %, PIDO1008 11.0 with FCV-DO1012 100.1 % and PCV-DO1009 85.7 %,
              strainer DPIDO0001 0.029, LIDO0701 4.978 m, P-0702A 25.4 A, burners off. SOP PR-OPE-5002 sect 20: PI-DO0005 12.5,
              PI-DO1008 10.4 kg/cm2; at the start every valve fully open.
     split    MB-022 items 6 / 7: 12.5 T/H to the unit 1 burners; the rest (12.5) through PCV-DO0002 (pump 25, unit 2 closed).
              The valve sizes (K) are CALIBRATED on 6.PNG with that split; linear valves (NO-SOURCE: no valve curve). Check: PCV-DO0002
              full open passes 20.4 T/H at 2 kg/cm2 (MB-022 item 4: 25 T/H at 2 kg/cm2).
     burner   M&S load curve 1612 13-4-71 (tip N 90 AG 8, LMYP-1, on the PC): oil pressure linear in the flow, 5.0 bar at 3072 kg/h
              (MAX), 614.4 kg/h MIN (range 1:5, BMS description 1612 13-4-105); SOP 27: "Oil pressure for burner min = 1 kg/cm2 and
              max = 5 kg/cm2", "min = 614.4 ... max = 3078". Burner supply 10.5 kg/cm2 (MB-022 items 8-1 ~ 8-4): FCV-DO1043-x3 full
              open gives the MAX at that ring pressure (CALIBRATED).
     limits   alarm list "Alarm List _20160912": PT-DO0005 H 19.5 / normal 15 / L 5 / LL 3; LT-DO0701 H 7.5 / L 3, 2 / LL 0.2 m;
              DPT-DO0001 H 0.1 / HH 0.2; PT-DO1043-x2 HH 6.0 / H 5.5 / L 0.8. DITL-31 (drawing): tank < 0.2 m and strainer > 0.8
              kg/cm2 = pump trip, outlet < 5 kg/cm2 = standby AUTO start, < 7 = LOW alarm (world/plantsw.js rows r15 / r17 / r28).
     NO-SOURCE: tank diameter (A = 23.8 m2, 5.5 m), oil density 0.85, pump current split (45 % at no load), current and
              pressure lags (1 s), the unit 2 branch closed. */
const AN_DO = {
  Qp: 25 /* T/H per pump, MB-022 item 2-1 / 2-2 */,
  Prv: 16.5 /* kg/cm2, pump relief = 15 x 1.1 (ALLWEILER 8.2, MB-022 15 kg/cm2) */,
  Ka: 12.8 /* PCV-DO0002, valve sheet CV p218 */,
  Kf: 13.1 /* FCV-DO1012, valve sheet CV p228 */,
  /* 3.2.3: the split at 6.PNG from the two valve sheets (K1AU3-E2-0-123 p218 PCV-DO0002 Cv 17.4 full open = 12.8, p228 FCV-DO1012
     Cv 17.1 = 13.1; 12.5 T/H at 3.7 kg/cm2 = Cv 8.49): PCV-DO0002 24.2 % at 12.8 kg/cm2 passes 11.1 T/H, so 13.9 T/H goes to the
     unit 1 ring (MB-022 12.5 / 12.5 is the design split). FCV-DO1012 100 % alone passes 13.9 T/H with 1.1 kg/cm2; 6.PNG reads
     12.8 -> 11.0 = 1.8: the line from the header to the ring (pipe, fittings, flow element) in series takes the rest
     (CALIBRATED on 6.PNG; the pipe itself is NO-SOURCE). The return PCV-DO1009 passes the same 13.9 T/H at 85.7 % and 11.0. */
  q6: 25 - 12.8 * 0.242 * Math.sqrt(12.8),
  get Kl() {
    return 1 / Math.sqrt(1.8 / this.q6 ** 2 - 1 / 13.1 ** 2);
  },
  get Kr() {
    return this.q6 / (0.857 * Math.sqrt(11.0)) /* PCV-DO1009, 6.PNG */;
  },
  g: 0.6144 * 0.980665 /* T/H per kg/cm2 at the gun: 614.4 kg/h per bar (M&S 1612 13-4-71) */,
  Kb:
    3.072 /
    Math.sqrt(
      10.5 - 5 / 0.980665
    ) /* FCV-DO1043-x3 full open: MAX 3072 kg/h at 5 bar with 10.5 kg/cm2 ring (MB-022 8-x) */,
  dp0: 0.029 /* kg/cm2 strainer at 25 T/H, 6.PNG */,
  I0: 25.4 /* A, P-0702A at 25 T/H x 12.8 kg/cm2, 6.PNG */,
  fI: 0.45 /* NO-SOURCE: share of the current at no load */,
  A: 23.8 /* m2, NO-SOURCE */,
  rho: 0.85 /* t/m3, NO-SOURCE */,
  L0: 4.978 /* m, 6.PNG */,
  /* the field valves of the diesel oil line-up (SOP 20, PD-022 1/5 Rev D): tank outlet V-DO0003, strainer inlet V-DO0004, pump A
     suction V-DO0015 / discharge V-DO0007, pump B suction V-DO0016 / discharge V-DO0009 (SOP 20 names the discharge "V-DO0017": not
     on PD-022, the drawing is used); open in service */
  fv0: { 'V-DO0003': 100, 'V-DO0004': 100, 'V-DO0015': 100, 'V-DO0007': 100, 'V-DO0016': 100, 'V-DO0009': 100 },
  pv: [
    ['V-DO0015', 'V-DO0007'],
    ['V-DO0016', 'V-DO0009']
  ],
  pumps: ['DITL-31', 'DITL-31 #B'],
  brn: ['', ' #B', ' #C', ' #D'] /* DITL-16 machine instances: burner A ~ D */,
  svc: ['M.3410', 'M.3411', 'M.3416', 'M.3417'] /* ABC-003x "SUPPLY OIL VALVE CLOSE" (unit.js comment of AN_UNIT ao) */,
  rows: { sv1: 21, sv2: 23 } /* DITL-16 output rows (0-based) "OIL SUPPLY LINE VALVE (1) / (2) OPENED" */
};
/* the opening of a diesel oil field valve (0 ~ 100 %): the field operator's (AN_SRC.valve) or the line-up of the SOP */
function anDoFv(tag) {
  const V = (typeof AN_SRC !== 'undefined' && AN_SRC.valve) || {};
  return isFinite(V[tag]) ? V[tag] : AN_DO.fv0[tag];
}
/* the field operator sets a diesel oil manual valve; false for an unknown tag */
function anDoValve(tag, pct) {
  if (!(tag in AN_DO.fv0) && !(typeof AN_LM !== 'undefined' && tag in AN_LM.fv0))
    return false; /* + limestone HV01 / HV11 */
  AN_SRC.valve = AN_SRC.valve || {};
  AN_SRC.valve[tag] = Math.max(0, Math.min(100, +pct || 0));
  return true;
}
/* the oil flow of one burner (T/H) at ring pressure P2 through its control valve x (0 ~ 1) and the gun (Q = g x Pgun):
   Q^2 = Kb^2 x^2 (P2 - Q / g) */
function doBurnerQ(P2, x) {
  const K = AN_DO,
    a = K.Kb * K.Kb * x * x;
  if (!(P2 > 0) || !(a > 0)) return 0;
  const b = a / K.g;
  return (-b + Math.sqrt(b * b + 4 * a * P2)) / 2;
}
/* the steady pressures of the network for a pump capacity Qc (T/H): P1 (PT-DO0005), P2 (PT-DO1008), flows */
function doSolve(Qc, xa, xf, xr, xb) {
  const K = AN_DO,
    sq = x => Math.sqrt(Math.max(0, x)),
    ring = P2 => K.Kr * xr * sq(P2) + xb.reduce((s, x) => s + doBurnerQ(P2, x), 0),
    kf = xf > 0 ? 1 / Math.sqrt(1 / (K.Kf * xf) ** 2 + 1 / K.Kl ** 2) : 0 /* FCV-DO1012 and the line, in series */;
  /* for a header P1: the ring pressure where the flow through FCV-DO1012 = return + burners */
  const p2Of = P1 => {
    if (!(xf > 0) || !(P1 > 0)) return 0;
    let a = 0,
      b = P1;
    for (let i = 0; i < 30; i++) {
      const m = (a + b) / 2;
      if (kf * sq(P1 - m) > ring(m)) a = m;
      else b = m;
    }
    return (a + b) / 2;
  };
  const out = P1 => {
    const P2 = p2Of(P1);
    return { P2, qa: K.Ka * xa * sq(P1), qf: kf * sq(P1 - P2) };
  };
  if (!(Qc > 0)) return { P1: 0, P2: 0, qa: 0, qf: 0, qrv: 0 };
  let r = out(K.Prv);
  if (r.qa + r.qf <= Qc)
    return Object.assign(r, { P1: K.Prv, qrv: Qc - r.qa - r.qf }); /* the relief valve takes the rest */
  let a = 0,
    b = K.Prv;
  for (let i = 0; i < 30; i++) {
    const m = (a + b) / 2;
    r = out(m);
    if (r.qa + r.qf < Qc) a = m;
    else b = m;
  }
  const P1 = (a + b) / 2;
  return Object.assign(out(P1), { P1, qrv: 0 });
}
/* the AI blocks (every sheet) of one I/O address on the station of a sheet */
function doAIs(sheet, ai) {
  const sh = AN.sheets.find(x => x.name === sheet);
  const st = sh && sh.S ? shStn(sh) : null;
  return st != null ? anUnitAIs(st + '|' + ai) : [];
}
/* the opening (0 ~ 1) of a valve driven by a controller / MAN station output (the HMI shows the opening = MV, plant.js) */
function doOut(sheet, tag) {
  const sh = AN.sheets.find(x => x.name === sheet),
    S = sh && sh.S;
  if (!S) return null;
  const c = AN.hmiCtrls ? (AN.hmiCtrls(S) || []).find(q => q.tag === tag) : null;
  if (c && c.out != null) return { S, n: c.out, t: tag };
  const b = S.blk.find(z => z.k === 'MAN' && (z.tag === tag || (z.txt || []).includes(tag)));
  return b && b.o && b.o[0] != null && b.o[0] >= 0 ? { S, n: b.o[0], t: tag } : null;
}
/* 3.2.1: a pneumatic valve with an airlock stays in place below 3.5 kg/cm2 of instrument air (unit.js AN_AV) */
const doX = (o, d) =>
  o && isFinite(o.S.rt.v[o.n])
    ? Math.max(0, Math.min(100, typeof anAv === 'function' ? anAv(o.t, +o.S.rt.v[o.n]) : +o.S.rt.v[o.n])) / 100
    : d;
/* called by anUnitStart after U.own is made: the transmitters this model writes */
function anBoilerStart(U) {
  const D = (U.do = { ai: {}, ctl: {} });
  const A = D.ai;
  A.p1 = doAIs('ABC-028', 'AI0181');
  A.p2 = doAIs('ABC-029', 'AI0514');
  A.lv = doAIs('ABC-028', 'AI0245');
  A.dp = doAIs('ABC-028', 'AI0182');
  A.za = doAIs('ABC-028', 'AI0246');
  A.zr = doAIs('ABC-029', 'AI0182');
  A.zf = doAIs('ABC-029', 'AI0276');
  A.i = [doAIs('ABC-028', 'AI0080'), doAIs('ABC-028', 'AI0096')];
  A.pb = ['AI0293', 'AI0439', 'AI0596', 'AI0771'].map((a, i) => doAIs('ABC-003' + 'ABCD'[i], a));
  A.fb = ['AI0515', 'AI0546', 'AI0517', 'AI0548'].map((a, i) => doAIs('ABC-003' + 'ABCD'[i], a));
  A.zb = ['AI0292', 'AI0438', 'AI0595', 'AI0770'].map((a, i) => doAIs('ABC-003' + 'ABCD'[i], a));
  const C = D.ctl;
  C.a = doOut('ABC-028', 'PICDO0005');
  C.r = doOut('ABC-029', 'PICDO1008');
  C.f = doOut('ABC-029', 'HICDO1012');
  C.b = 'ABCD'.split('').map(x => doOut('ABC-003' + x, 'FICDO1043' + x));
  const lists = [A.p1, A.p2, A.lv, A.dp, A.za, A.zr, A.zf].concat(A.i, A.pb, A.fb, A.zb);
  for (const l of lists) for (const [S2, b] of l) U.own.add(S2.rt.st[b.id]);
  /* the tank: the level of the starting state (6.PNG 4.978 m) */
  const lv = anUnitVal(A.lv);
  U.doLv = isFinite(lv) ? lv : AN_DO.L0;
  U.doP1 = U.doP2 = NaN; /* the first step is at the steady value */
  U.doSp = null;
  U.doZ = {};
  for (const k in AN_DO.fv0) if (AN_SRC.valve) delete AN_SRC.valve[k];
  for (const k in AN_LM.fv0) if (AN_SRC.valve) delete AN_SRC.valve[k];
  anFanStart(U);
  anLmStart(U);
  anSdStart(U, 6.8 /* the plant air header at load, kg/cm2 (AN_BA note), before its first step */);
  anBaStart(U);
}
/* called by anUnitCold: the pumps are the DITL's (stopped in a cold plant); the tank keeps its level */
function anBoilerCold(U) {
  U.fnZ = {};
  U.doP1 = U.doP2 = NaN;
  U.doSp = null;
  U.doZ = {};
  for (const k in AN_DO.fv0) if (AN_SRC.valve) delete AN_SRC.valve[k];
  anLmStart(U); /* limestone: at rest, the vessels keep the start content (NO-SOURCE) */
  anSdStart(U);
  anBaStart(U);
}
/* one step of the diesel oil system */
function anDieselOilStep(U, dt) {
  const K = AN_DO,
    D = U.do;
  if (!D) return;
  const lag = (k, x, tau) => (U[k] = isFinite(U[k]) ? U[k] + ((x - U[k]) * Math.min(dt, tau)) / tau : x);
  /* the pumps: running contact of DITL-31 (A) / #B; the suction line-up (tank outlet, strainer inlet, pump suction) and a tank
     with oil above the suction (alarm list LL 0.2 m) */
  const suc = Math.min(anDoFv('V-DO0003'), anDoFv('V-DO0004')) / 100,
    lvOk = U.doLv > 0.05 ? 1 : 0;
  const run = K.pumps.map(n => ((typeof anDitlRun === 'function' ? anDitlRun(n) === 1 : false) ? 1 : 0));
  const sp = U.doSp || (U.doSp = run.slice());
  run.forEach(
    (r, i) => (sp[i] += ((r - sp[i]) * Math.min(dt, 1)) / 1)
  ); /* screw pump: up to speed in about 1 s (NO-SOURCE) */
  const own = K.pv.map(([a, b]) => Math.min(anDoFv(a), anDoFv(b)) / 100),
    qi = sp.map(
      (s, i) => K.Qp * s * Math.min(1, own[i] * 4) * Math.min(1, suc * 4) * lvOk
    ) /* a valve 25 % open passes the full flow */,
    Qc = qi[0] + qi[1];
  /* the valves: the station outputs (the opening = MV) */
  const xa = doX(D.ctl.a, 0.242),
    xr = doX(D.ctl.r, 0.857),
    xf = doX(D.ctl.f, 1),
    vo = K.brn.map((x, i) => {
      /* the two shut-off valves open: the limit switches of the DITL valve (DITL-16 OPENED (1) and (2)), or the "SUPPLY OIL VALVE
         CLOSE" memory of the ABC sheets at 0 (M.3410 / 3411 / 3416 / 3417, the same switches; the Training opens them there:
         hmi-op.js anOilValve) */
      const s = typeof anDitlSheet === 'function' ? anDitlSheet('DITL-16' + x) : null;
      if (s && typeof DUI !== 'undefined' && DUI.outVal(s, K.rows.sv1) === 1 && DUI.outVal(s, K.rows.sv2) === 1)
        return 1;
      return typeof srcBit === 'function' && srcBit([K.svc[i]]) === 0 ? 1 : 0;
    }),
    xc = D.ctl.b.map(o => doX(o, 0)),
    xb = xc.map((x, i) => x * vo[i]);
  const r = doSolve(Qc, xa, xf, xr, xb);
  lag('doP1', r.P1, 1);
  lag('doP2', r.P2, 1);
  const qb = xb.map(x => doBurnerQ(U.doP2, x));
  U.doQb = qb;
  U.doPb = qb.map(q => q / K.g);
  U.doQ = Qc;
  U.doQa = r.qa;
  U.doQf = r.qf;
  U.doQrv = r.qrv;
  U.doVo = vo;
  U.doDp = K.dp0 * (Qc / K.Qp) ** 2;
  /* the tank: the oil burnt leaves it (the recirculation, the ring return and the relief come back) */
  const burn = qb.reduce((s, q) => s + q, 0);
  U.doBurn = burn;
  U.doLv = Math.max(0, U.doLv - (burn / K.rho / K.A / 3600) * dt);
  /* the motors: current = no-load share + hydraulic share (Q x P), 25.4 A at 25 T/H and 12.8 kg/cm2 (6.PNG) */
  U.doI = sp.map((s, i) => (run[i] ? K.I0 * (K.fI + ((1 - K.fI) * (qi[i] * U.doP1)) / (K.Qp * 12.8)) : 0));
  /* write the transmitters */
  const A = D.ai,
    w = (l, x) => l && l.length && anUnitWrite(l, x);
  w(A.p1, U.doP1);
  w(A.p2, U.doP2);
  w(A.lv, U.doLv);
  w(A.dp, U.doDp);
  A.i.forEach((l, i) => w(l, U.doI[i]));
  A.pb.forEach((l, i) => w(l, U.doPb[i]));
  A.fb.forEach((l, i) => w(l, qb[i]));
  /* valve positions follow the command (P1 #1 of unit.js: actuator lag 3 s) */
  const z = U.doZ || (U.doZ = {}),
    zl = (k, x) => (z[k] = isFinite(z[k]) ? z[k] + ((x - z[k]) * Math.min(dt, 3)) / 3 : x);
  w(A.za, zl('a', xa * 100));
  w(A.zr, zl('r', xr * 100));
  w(A.zf, zl('f', xf * 100));
  A.zb.forEach((l, i) => w(l, zl('b' + i, xc[i] * 100)));
}
/* 3.2.1 SEULGI: FANS, AIR AND FLUE GAS (docs/versions/v3.2.1/FANS_PLANT_MODEL.md). The air and gas FLOWS stay those of the loop model
   (unit.js: FICFA1071 / FICFA1081 with the PAF / SAF running, PICFG108 with the IDF); this part adds what the loop model did not have:
   - FA blowers F-1055A / B (DITL-28A and its machine instance #B, IO STN103 I.0046 / I.0366): the fluidizing air (FICFA1055A, ABC-014,
     PV FIFA1055 = FT-FA1055 AI0545) needs a blower running with its outlet SOV open (XV-FA1055-A3 / B3, DITL-28C rows 9 "OUTLET SOV
     CLOSED" I.0045 / I.008F, or its OPEN COMMAND output 25: the closed limit of instance #B stays 1 after the command, a finding
     of the DITL valve model, FANS_PLANT_MODEL.md). No blower = no FA flow -> ABC-006 M.3114 "FAB OUTLET AIR FLOW L.L. < 20 T/H" -> DITL-28A #B standby start.
     Each blower gives flow by its inlet damper (FCV-FA1055-A1 / B1, ABC-014 FICFA1055A / B MV; linear, NO-SOURCE), 26.3 T/H at 42.8 %.
     PAF / SAF field trip: their air stops (unit.js U.mul with the motor drawings DITL-26A / 27A).
   - motor currents IT-F1053 PAF / IT-F1054 SAF / IT-F1056 IDF / IT-F1055A / B (STN103 AI0454 / 0469 / 0453 / 0452 / 0468): the current
     of the snapshot times (no-load share fI + the rest x air power / air power of the snapshot), air power = flow x pressure rise
     (fan law; fI NO-SOURCE). IT-F1055A / B also feed DITL-28B row 12 "FAB A CURRENT" < 24.6 A (L.L.).
   - pressures: PAF outlet PT-FA1075 (AI0160) and FA header PT-FA1055-A / B (AI0294 / 0417) with the square of their flow (system
     curve); ESP outlet / IDF inlet PT-FG1141-A / B (AI0416 / 0772) and IDF outlet PT-FG1151 (AI0432) with the square of the total air.
   Anchors: 7.PNG (151 MW) PAF 253.6 A, SAF 134.0 A, IDF 199.6 A, PIFA1075 1551 at FIFA1071 354.0, PIFA1085 1427 at FIFA1081 213.0,
   PIFG1141A / B -442 / -450, PIFG1151 -7, TAF 592.1 T/H; 9.png (150 MW) FA BLOWER-A 37.3 A, FIFA1055 26.3 T/H, PIFA1055A 3257 /
   PIFA1055B 3315 mmH2O (B stopped with its outlet SOV closed reads the header: the transmitters are on the common side, from the
   snapshot). */
const AN_FN = {
  I0: { paf: 253.6, saf: 134.0, idf: 199.6, fa: 37.3 },
  fI: 0.45,
  pa: { Q0: 354.0, P0: 1551 },
  sa: { Q0: 213.0, P0: 1427 },
  ga: { T0: 592.1, Pi: [-442, -450], Po: -7 },
  fa: { Q0: 26.3, z0: 42.8, P0: [3257, 3315] },
  run: {
    paf: 'DITL-26A',
    saf: 'DITL-27A',
    idf: 'DITL-25A',
    fa: ['DITL-28A', 'DITL-28A #B'],
    sov: ['DITL-28C', 'DITL-28C #B']
  }
};
/* motor current: no-load share + the rest x air power over the snapshot one. Same law on the HMI (api.js fanI) */
const anFanI = (I0, on, x) => (on ? I0 * (AN_FN.fI + (1 - AN_FN.fI) * Math.max(0, x)) : 0);
/* speed (F37): a DITL sheet by its name, kept: these two run many times a step and made a new list of all sheets each time */
const fnShC = new Map();
let fnShK = -1;
function fnSh(n) {
  const k = S.sheets.length * 1000 + ((WORLD.inst && WORLD.inst.length) || 0);
  if (k !== fnShK) {
    fnShK = k;
    fnShC.clear();
  }
  let s = fnShC.get(n);
  if (s === undefined) {
    s = S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(n)) || null;
    fnShC.set(n, s);
  }
  return s;
}
function fnRow(n, r) {
  try {
    const s = fnSh(n);
    return s && typeof DUI !== 'undefined' ? DUI.rowVal(s, r) : null;
  } catch (e) {
    return null;
  }
}
function fnOut(n, r) {
  try {
    const s = fnSh(n);
    return s && typeof DUI !== 'undefined' ? DUI.outVal(s, r) : null;
  } catch (e) {
    return null;
  }
}
const fnRun = n => (typeof anDitlRun === 'function' ? anDitlRun(n) === 1 : false);
function anFanStart(U) {
  const F = (U.fn = { ai: {} }),
    A = F.ai;
  A.pa = doAIs('ABC-007', 'AI0160');
  const T = (AN.sheets.find(x => x.name === 'ABC-014') || {}).S;
  F.fa = T && AN.hmiCtrls ? (AN.hmiCtrls(T) || []).find(q => q.tag === 'FICFA1055A') : null;
  F.mvA = doOut('ABC-014', 'FICFA1055A');
  F.mvB = doOut('ABC-014', 'FICFA1055B');
  F.faAI = doAIs('ABC-006', 'AI0545');
  F.qpa = doAIs('ABC-006', 'AI0484');
  F.qsa = doAIs('ABC-006', 'AI0513');
  for (const l of [A.pa]) for (const [S2, b] of l) U.own.add(S2.rt.st[b.id]);
  /* a field trip of the PAF / SAF (protection relay) stops their air: the running state of the motor drawing too (unit.js U.mul .drw,
     as the BFWP), not only the running bit M.3302 / M.3303 of ABC-007 */
  if (U.mul && U.mul[1] && U.mul[1].run.length === 1) U.mul[1].drw = ['DITL-26A'];
  if (U.mul && U.mul[2] && U.mul[2].run.length === 1) U.mul[2].drw = ['DITL-27A'];
  U.fnZ = {};
}
function anFanStep(U, dt) {
  const F = U.fn,
    K = AN_FN;
  if (!F) return;
  const z = U.fnZ || (U.fnZ = {}),
    lag = (k, x, tau) => (z[k] = isFinite(z[k]) ? z[k] + ((x - z[k]) * Math.min(dt, tau)) / tau : x),
    lagI = (k, x, tau) => (x > 0 ? lag(k, x, tau) : (z[k] = 0)) /* Mina F15: a stopped motor carries no current */,
    val = l => anUnitVal(l || []);
  /* FA blowers: running, outlet SOV not closed, inlet damper */
  const fr = K.run.fa.map(fnRun),
    sov = K.run.sov.map(n => fnOut(n, 25) === 1 || fnRow(n, 8) === 0),
    za = doX(F.mvA, 0.428) * 100,
    zb = doX(F.mvB, 0.249) * 100,
    g = [fr[0] && sov[0] ? za : 0, fr[1] && sov[1] ? zb : 0];
  /* the FA flow is this model's: the target of the loop model of FICFA1055A (plant.js: y = smul * y + (1 - smul) * sbase, its own lag),
     the flow of the snapshot at the damper of the snapshot (9.png 26.3 T/H at 42.8 %), linear in the opening (NO-SOURCE) */
  if (F.fa && F.fa.b && F.fa.b.proc) {
    F.fa.b.proc.smul = 0;
    F.fa.b.proc.sbase = (K.fa.Q0 * (g[0] + g[1])) / K.fa.z0;
  }
  U.fnG = g;
  const qfa = Math.max(0, val(F.faAI)) || 0,
    pfa = K.fa.P0[0] * Math.pow(qfa / K.fa.Q0, 2);
  U.fnFaP = K.fa.P0.map(p => lag('fp' + p, (p / K.fa.P0[0]) * pfa, 2));
  U.fnFaQ = qfa;
  const qi = g.map(x => (g[0] + g[1] > 0 ? (qfa * x) / (g[0] + g[1]) : 0));
  const cur = anFanI;
  U.fnI = U.fnI || [0, 0, 0, 0, 0];
  U.fnIa = lagI('ia', cur(K.I0.fa, fr[0], (qi[0] * pfa) / (K.fa.Q0 * K.fa.P0[0])), 2);
  U.fnIb = lagI('ib', cur(K.I0.fa, fr[1], (qi[1] * pfa) / (K.fa.Q0 * K.fa.P0[0])), 2);
  /* PAF / SAF: flow of the loop model, outlet pressure on the system curve */
  const qpa = Math.max(0, val(F.qpa)) || 0,
    qsa = Math.max(0, val(F.qsa)) || 0,
    ppa = K.pa.P0 * Math.pow(qpa / K.pa.Q0, 2),
    psa = K.sa.P0 * Math.pow(qsa / K.sa.Q0, 2);
  U.fnPaP = lag('pp', ppa, 2);
  if (F.ai.pa.length) anUnitWrite(F.ai.pa, U.fnPaP);
  U.fnPafI = lagI('ip', cur(K.I0.paf, fnRun(K.run.paf), (qpa * ppa) / (K.pa.Q0 * K.pa.P0)), 2);
  U.fnSafI = lagI('is', cur(K.I0.saf, fnRun(K.run.saf), (qsa * psa) / (K.sa.Q0 * K.sa.P0)), 2);
  /* IDF: the flue gas is the total air (unit.js U.taf); inlet suction and outlet with its square */
  const taf = U.taf && U.tafS ? U.taf.reduce((a, n) => a + (+U.tafS.rt.v[n] || 0), 0) : 0,
    rg = Math.pow(taf / K.ga.T0, 2),
    idf = fnRun(K.run.idf);
  U.fnGi = K.ga.Pi.map((p, i) => lag('gi' + i, idf ? p * rg : 0, 2));
  U.fnGo = lag('go', idf ? K.ga.Po * rg : 0, 2);
  const dpg = U.fnGo - (U.fnGi[0] + U.fnGi[1]) / 2,
    dpg0 = K.ga.Po - (K.ga.Pi[0] + K.ga.Pi[1]) / 2;
  U.fnIdfI = lagI('ii', cur(K.I0.idf, idf, ((taf / K.ga.T0) * dpg) / dpg0), 2);
  U.fnI = [U.fnPafI, U.fnSafI, U.fnIdfI, U.fnIa, U.fnIb];
}
/* AIR PREHEATER AND FLUE GAS (FHI Tab 3, Figures 7, 12, 13; docs/versions/v3.2.1/GAS_PATH.md).
   afs       air for burning 1 T of coal: 5.46 T, from the ultimate analysis of Tab 3 (C 42.97, H 2.75, S 1.49, O 11.42 %). With it
             21 x (1 - air needed / air given) gives Fig 7 from Fig 12 and 13: 40 % 8.9 (8.8), 50 % 4.8 (4.6), 60 % 3.7 (3.6), 100 % 3.8 (3.6).
   ePA, eSA  how close each air comes to the gas entering: (285.8 - 45) / (322 - 45), (301.6 - 39) / (322 - 39), Tab 3. Held at
             all loads: the change with flow is NO-SOURCE.
   kCp, gm   gas side of the same heat: 354 x 240.8 + 218 x 262.6 T/H x C of air takes the gas 681 T/H (air 598 + coal less ash) from
             322 to 135 C, so air cp / gas cp 0.894; gm = gas per T of air.
   gi        gas entering at MCR; below it the duties of the air heater manual L20, anAphIn.
   eco       colder feedwater takes more from the gas: the economizer cools the gas 43 C of the 120 C between gas in (365, snapshot
             TIFG1110 / 1113) and feedwater 245.4 (Tab 3), so gas to the air heater falls 0.36 C per C of feedwater. */
const AN_GAS = { afs: 5.46, gi: 322, ePA: 240.8 / 277, eSA: 262.6 / 283, kCp: 0.894, gm: 681 / 598, eco: 43 / 120, dtP: 10, dtS: 4, tauG: 60, tauR: 120 };
const anAphClamp = (x, a, b) => Math.max(a, Math.min(b, x));
/* gas entering the air preheater: k = bed rise over its MCR rise, g = gas flow over the MCR flow */
/* gas in by furnace rise, L20 air heater duties 322 / 285 / 272 C at 100 / 60 / 40 %, at the furnace rise of Fig 8 (1, 0.895, 0.778); to ambient below */
const anAphIn = (amb, k, g, fwDrop) => {
  const t = k >= 0.895 ? 285 + ((322 - 285) * (k - 0.895)) / 0.105 : k >= 0.778 ? 272 + ((285 - 272) * (k - 0.778)) / 0.117 : amb + ((272 - amb) * Math.max(0, k)) / 0.778;
  return Math.max(amb, t - AN_GAS.eco * Math.max(0, fwDrop || 0));
};
/* air leaving the fans, with the square of the flow: Tab 3 ambient 35, PA 45, SA 39 C. kind 'p' or 's' */
const anAphAir = (amb, q, kind) => amb + (kind === 'p' ? AN_GAS.dtP : AN_GAS.dtS) * anAphClamp(q, 0, 1.3) ** 2;
/* gas leaving: the gas gives what the air took */
function anAphOut(gi, fpa, tpa, tpa2, fsa, tsa, tsa2, ffa) {
  const air = fpa + fsa + ffa,
    q = fpa * Math.max(0, tpa2 - tpa) + fsa * Math.max(0, tsa2 - tsa);
  return air > 1 ? gi - (AN_GAS.kCp * q) / (air * AN_GAS.gm) : gi;
}
function anAphStep(U, dt) {
  if (!U.aphL) return;
  const K = AN_GAS,
    z = U.fnZ,
    amb = U.Tamb,
    v = U.tafS && U.taf.length === 3 ? U.taf.map(n => Math.max(0, +U.tafS.rt.v[n] || 0)) : [0, 0, 0],
    k = anAphClamp((U.Tb - amb) / Math.max(1, U.Tb0 - amb), 0, 1.3),
    g = fnRun(AN_FN.run.idf) ? anAphClamp((v[0] + v[1] + v[2]) / 594, 0, 1.4) : 0,
    gi = anAphIn(amb, k, g, U.fwDrop),
    tpa = anAphAir(amb, fnRun(AN_FN.run.paf) ? v[0] / AN_FN.pa.Q0 : 0, 'p'),
    tsa = anAphAir(amb, fnRun(AN_FN.run.saf) ? v[1] / AN_FN.sa.Q0 : 0, 's');
  z.gi = isFinite(z.gi) ? z.gi + ((gi - z.gi) * Math.min(dt, K.tauG)) / K.tauG : gi;
  /* the rotor carries the heat across: stopped, the air stops heating as the metal cools */
  const r = fnRun('DITL-43') ? 1 : 0;
  z.rot = isFinite(z.rot) ? z.rot + ((r - z.rot) * Math.min(dt, K.tauR)) / K.tauR : r;
  const pa = tpa + K.ePA * z.rot * Math.max(0, z.gi - tpa),
    sa = tsa + K.eSA * z.rot * Math.max(0, z.gi - tsa);
  U.aphGi = z.gi;
  U.aphGo = anAphOut(z.gi, v[0], tpa, pa, v[1], tsa, sa, v[2]);
  anUnitWrite(U.aphL.pa, pa);
  anUnitWrite(U.aphL.sa, sa);
}
/* ===== LIMESTONE INJECTION (019 LIMESTONE INJECTION SYSTEM; docs/versions/v3.2.1/LIMESTONE_SAND_PLANT_MODEL.md) =====
   The field devices of the Rotofeed (HWA JANN / Clyde Bergemann, O&M L5-3 "Limestone", on the PC: document-references/
   o&m-package-phase-1/L5 Fly Ash_Sand_Limestone/L5-3 Limestone.pdf) under the DITL logic of the drawing (limestone_logic.xls,
   DITL-LS10 ~ LS240, station 104). The logic is not changed: the model only answers its solenoid commands with the switches of
   the field (IO list "Station 104"):
     dome valves  vent XV-LM1814A (O.0249 -> ZSO / ZSC I.017B / I.017C), lock vessel inlet XV-LM1812 (O.0243 -> I.0177 / I.0178,
                  seal PS-LM1812 I.016D), dispensing vessel inlet XV-LM1815 (O.0244 -> I.0179 / I.017A, seal PS-LM1815 I.016E),
                  balance XV-LM1814B (O.024A -> I.017D / I.017E). O&M 2.10: a dome valve is "closed and sealed" when its seal
                  pressure is > 5 bar (the inflating seal is fed by the control air: the plant air header of the unit model, paPU);
                  open = seal deflated (< 5 bar). Stroke 2 s, seal inflation 1 s: NO-SOURCE (O&M 2.8 only gives the 5 s fault timer:
                  the valve must reach its end within it).
     equalising   XV-LM1814C (O.0248): conveying air into the lock vessel (regulator PCV11 3.5 barg, O&M 3.2.5).
     conveying    XV-LM1814D ~ F (O.0247, IO list "conveying air valve open solenoid"); isolating valves XV-LM1811A ~ H (O.0252 ~
                  O.0259 -> I.0200 ~ I.020F), stroke 3 s NO-SOURCE.
     vessels      lock vessel 0.7 m3, dispensing vessel 1.4 m3 (O&M L5-3 section 1), bulk density 1280 kg/m3 (for volume) ->
                  896 / 1792 kg. LSH-LM1812 (I.0168) covered at 90 % of the lock vessel, LSL-LM1815 (I.0169 = 1 uncovered: DITL-LS20
                  OUT3 = enabled AND I.0169) at 30 % of the dispensing vessel: NO-SOURCE (the probe heights are not in the O&M).
                  3.2.3-beta.58 (user: no ASSUMED): silo to lock vessel 30 s = the SHORT FILL TIMER (O&M L5-3 2.3.2 / 2.3.3 / 2.8, PLC
                  limestone_logic.xls sheet 40 "30s"; the filling ends at the timer or at LSH-LM1812 covered, whichever first), lock to
                  dispensing vessel 30 s = the DISPENSING VESSEL DOME VALVE OPEN TIMER (O&M 2.3.4 / 2.3.6 / 2.8, xls sheet 60 "30s"); was
                  20 / 20 NO-SOURCE. Conflict noted: the VENT TIMER is 3 s in the O&M 2.8 and 6 s in the as-built PLC (xls sheet 30); the
                  DITL-LS logic of the app keeps the PLC 6 s.
     feeder       L-1311 Rotofeed (O.024C start -> I.0170 MIR-M1311 running): volumetric, 0 ~ 14 T/H (O&M section 1 maximum
                  14,000 kg/h; DITL-LS240 OUT3 "ACTURE ROTOFEEDER SPEED 0~14T/H") = the SOx control output (ABC-005 AICFG10571,
                  the speed of INV-M1311) while the dispensing vessel has material.
     pressures    PT-LM1811 lock vessel (AI0434), PT-LM1812 dispensing vessel = conveying pressure (AI0433), 0 ~ 6 kg/cm2.
                  At rest 0.0 / 0.1 (snapshot 19.PNG, limestone feeding STOP, conveying air closed). Conveying air on: 0.8 kg/cm2 +
                  0.05 per T/H of limestone: NO-SOURCE (between the DITL-LS230 LOW 0.5 and the O&M 2.5 blockage 1.5 bar; design
                  back pressure 1020 mmAq at the boiler). Time constants 1 s (vent), 4 s (equalising), 3 s (conveying): NO-SOURCE.
     air tank     PS-PA1811 (I.016A) made below 4 bar (O&M 2.9 "air tank pressure < 4 bar") of the plant air header.
     vent fan     F-1313 (O.024E start command -> I.0173 MIR-LM1313 running, IO list). */
const AN_LM = {
  m: { lock: 0.7 * 1280, disp: 1.4 * 1280 },
  lsh: 0.9,
  lsl: 0.3,
  tFill: 30,
  tXfer: 30,
  qMax: 14,
  stroke: 2,
  seal: 1,
  iso: 3,
  sealBar: 5,
  tankBar: 4,
  pRest: 0.1,
  pAir: 0.8,
  kQ: 0.05,
  pEq: 3.5 / 0.980665,
  /* the manual valves of the Rotofeed pneumatic panel PCB-1311 (O&M L5-3 3.2 / 3.5, the names of the O&M): control air isolation HV01
     (closed = the dome valve seals deflate, 3.5.4) and conveying air isolation HV11 (3.2.4); open in service */
  fv0: { HV01: 100, HV11: 100 }
};
function lmOut(n, r) {
  return fnOut(')' + n, r) === 1;
}
function anLmStart(U) {
  const L = (U.lm = { v: {}, sw: {} });
  L.mDisp =
    AN_LM.m.disp *
    0.6; /* NO-SOURCE: the dispensing vessel above its LSL at the 150 MW start (19.PNG: feeding STOP, no filling) */
  L.mLock = 0;
  L.pl = 0;
  L.pd = AN_LM.pRest;
  L.sp = doOut('ABC-005', 'AICFG10571');
  L.silo = 69.4; /* 19.PNG LILM1800 69.4 % */
  lmPub(U);
}
/* a dome / isolating valve: position 0 (closed) ~ 1 (open) toward its solenoid, the seal inflated after it is closed */
function lmValve(L, k, cmd, dt, stroke, seal) {
  const v = (L.v[k] = L.v[k] || { x: 0, s: seal ? AN_LM.seal : 0 });
  v.x = Math.max(0, Math.min(1, v.x + (cmd ? 1 : -1) * (dt / stroke)));
  if (seal) v.s = v.x <= 0 ? Math.min(AN_LM.seal, v.s + dt) : 0;
  return v;
}
function anLmStep(U, dt) {
  const L = U.lm;
  if (!L) return;
  const K = AN_LM,
    fv = t => {
      const V = (typeof AN_SRC !== 'undefined' && AN_SRC.valve) || {};
      return isFinite(V[t]) ? V[t] : K.fv0[t];
    },
    pa = isFinite(U.paPU) ? U.paPU * 0.980665 : 0 /* the plant air header, bar */,
    air = fv('HV01') > 0 ? pa : 0 /* control air of the panel (seals, solenoids) */,
    v = {};
  v.vent = lmValve(L, 'vent', lmOut('DITL-LS160', 1), dt, K.stroke, 1);
  v.lock = lmValve(L, 'lock', lmOut('DITL-LS170', 1), dt, K.stroke, 1);
  v.disp = lmValve(L, 'disp', lmOut('DITL-LS180', 1), dt, K.stroke, 1);
  v.bal = lmValve(L, 'bal', lmOut('DITL-LS190', 1), dt, K.stroke, 1);
  const eq = lmOut('DITL-LS200', 1),
    conv = lmOut('DITL-LS210', 2) && fv('HV11') > 0 && pa > K.tankBar;
  const iso = 'ABCDEFGH'.split('').map((x, i) => lmValve(L, 'iso' + x, lmOut('DITL-LS212', 11 + i), dt, K.iso, 0));
  const route = iso.some(q => q.x >= 1);
  /* the feeder (the VFD runs on its start command; no trip in the model) */
  L.run = lmOut('DITL-LS110', 6);
  L.fan = lmOut('DITL-LS214', 13);
  const mv = L.sp ? +L.sp.S.rt.v[L.sp.n] : 0;
  L.q = L.run && route && conv && L.mDisp > 0 ? (Math.max(0, Math.min(100, isFinite(mv) ? mv : 0)) / 100) * K.qMax : 0;
  /* material: silo -> lock (lock dome open), lock -> dispensing (dispensing dome open), dispensing -> conveying line (feeder) */
  const sil = L.silo > 0 ? (v.lock.x * K.m.lock * dt) / K.tFill : 0,
    toLock = Math.min(sil, K.m.lock - L.mLock);
  L.mLock += toLock;
  /* the silo level stands: silos are unlimited in this simulator (scope 2026-11-07) */
  const xf = Math.min(L.mLock, (v.disp.x * K.m.lock * dt) / K.tXfer, K.m.disp - L.mDisp);
  L.mLock -= xf;
  L.mDisp = Math.max(0, L.mDisp + xf - (L.q * 1000 * dt) / 3600);
  /* pressures (kg/cm2): the dispensing vessel is the conveying line; the lock vessel vents, is pressed by the equalising air, or
     shares the dispensing vessel through its open dome / balance valve */
  const lag = (x, y, tau) => x + (y - x) * Math.min(1, dt / tau);
  L.pd = lag(L.pd, conv ? (route ? K.pAir + K.kQ * L.q : K.pEq) : K.pRest, 3);
  if (v.disp.x > 0 || v.bal.x > 0) L.pl = lag(L.pl, L.pd, 1);
  else if (v.vent.x > 0) L.pl = lag(L.pl, 0, 1);
  else if (eq && fv('HV11') > 0 && pa > K.tankBar) L.pl = lag(L.pl, K.pEq, 4);
  if (eq && (v.disp.x > 0 || v.bal.x > 0)) L.pd = Math.max(L.pd, L.pl);
  /* the field switches (1 = made) */
  const sealOk = q => q.x <= 0 && q.s >= K.seal && air > K.sealBar;
  const W = L.sw;
  W.ventO = v.vent.x >= 1 ? 1 : 0;
  W.ventC = v.vent.x <= 0 ? 1 : 0;
  W.lockO = v.lock.x >= 1 ? 1 : 0;
  W.lockC = v.lock.x <= 0 ? 1 : 0;
  W.dispO = v.disp.x >= 1 ? 1 : 0;
  W.dispC = v.disp.x <= 0 ? 1 : 0;
  W.balO = v.bal.x >= 1 ? 1 : 0;
  W.balC = v.bal.x <= 0 ? 1 : 0;
  W.lockSeal = sealOk(v.lock) ? 1 : 0;
  W.dispSeal = sealOk(v.disp) ? 1 : 0;
  W.lsh = L.mLock >= K.lsh * K.m.lock ? 1 : 0;
  W.lsl = L.mDisp < K.lsl * K.m.disp ? 1 : 0;
  W.tank = pa < K.tankBar ? 1 : 0; /* the air receiver of the system (PS-PA1811) is fed by the plant air */
  W.run = L.run ? 1 : 0;
  W.fan = L.fan ? 1 : 0;
  iso.forEach((q, i) => {
    W['isoO' + i] = q.x >= 1 ? 1 : 0;
    W['isoC' + i] = q.x <= 0 ? 1 : 0;
  });
  lmPub(U);
}
function lmPub(U) {
  const L = U.lm;
  U.lmPl = Math.max(0, L.pl);
  U.lmPd = Math.max(0, L.pd);
  U.lmQ = L.q || 0;
  U.lmLock = (100 * L.mLock) / AN_LM.m.lock;
  U.lmDisp = (100 * L.mDisp) / AN_LM.m.disp;
  U.lmSilo = L.silo;
}
/* ===== SAND INJECTION (020 SAND INJECTION SYSTEM; docs/versions/v3.2.1/LIMESTONE_SAND_PLANT_MODEL.md) =====
   The field devices of the DensePhase vessel (HWA JANN / HCE, O&M L5-2 "Sand", on the PC) under the DITL logic of the sand drawings
   DITL-771 ~ 777 (E10210-3-771 ~ 777, station 103; the rows carry the terminal text, no address):
     inlet dome valve XV-SD1804 (SV-SD1804A, DITL-771 OUT21 / OUT22) -> DITL-772 rows 7 / 8 FULLY OPEN / CLOSE LS, row 3 SEAL PRESSURE
       SW (PS-SD1804, made = sealed: O&M 5.3 "seal pressure switch is not enable when dome valve closed" = the close fault);
     vent valve XV-AV1803 (SV-AV1803, OUT20), outlet valve XV-SD1801 (SV-SD1801, OUT23 / OUT24), conveying air XV-PA1800
       (SV-PA1800, OUT25) -> DITL-775 rows 1 ~ 6; isolating valves XV-SD1802A / B (DITL-776 OUT11 / OUT13) -> DITL-776 rows 7 ~ 10;
     vessel high level LSH-SD1801 (DITL-771 row 11), vessel pressure low PS-SD1800 (DITL-772 row 4: < 0.3 bar, O&M section 0 e);
     air buffer tank PS-PA1800 (DITL-775 row 7: < 4 bar, O&M 5.6), silo LSH / LSL-SD1800 (DITL-774 rows 3 / 4), vent filter
       M-1301 running (DITL-774 row 10, DITL-777 row 7) on its start command (DITL-774 OUT22 O.060A).
   Numbers: vessel 0.113 m3 x 1440 kg/m3 = 163 kg, silo 100 m3, max 6000 kg/h (O&M L5-2 section 1); conveying of one batch 55 s
   ("Peak Air Duration 55 seconds"); silo 50.1 % at 150 MW (20.PNG). Fill of the vessel 20 s (3.2.3-beta.58, was 15 s NO-SOURCE): the inlet
   dome valve stays open 20 s or until the level high LSH-SD1801, whichever first (O&M L5-2 system start cycle IV; filling timer 20 s,
   4.2.1). NO-SOURCE: valve stroke 2 s, seal 1 s, vessel pressure while conveying 2.0 kg/cm2 (L5-2 gives only the end of conveying,
   120 s AND PT-SD1800 < 0.5 bar, conveying air 5.0 barg, vessel design 7.0 barg), silo LSH / LSL at the LT-SD1800 alarms 85 / 30 %
   (alarm list; the switch heights are not given). */
const AN_SD = {
  m: 0.113 * 1440,
  silo: 100,
  tFill: 20,
  tConv: 55,
  stroke: 2,
  seal: 1,
  sealBar: 5,
  tankBar: 4,
  pLowBar: 0.3,
  pConv: 2.0,
  lsh: 0.9,
  siloH: 85,
  siloL: 30
};
function sdOut(n, ...rows) {
  return rows.some(r => fnOut(')' + n, r) === 1);
}
function anSdStart(U, pa0) {
  U.sd = { v: {}, sw: {}, m: 0, p: 0, silo: 50.1 /* 20.PNG LISD1800 */ };
  /* Mina F7: the field switches stand from the first scan. With no switch yet the DITL read "dome valve not closed, no seal" for one scan at
     the 150 MW load: INLET DV CLOSE FAULT, SYSTEM TRIP on DITL-777, reset 2 s later */
  anSdStep(U, 1e-3, pa0);
}
function anSdStep(U, dt, pa0) {
  const D = U.sd;
  if (!D) return;
  const K = AN_SD,
    pa = (isFinite(U.paPU) ? U.paPU : pa0 || 0) * 0.980665,
    vv = (k, cmd, seal) => lmValve(D, k, cmd, dt, K.stroke, seal);
  const dv = vv('dv', sdOut('DITL-771', 20, 21), 1),
    vent = vv('vent', sdOut('DITL-771', 19), 0),
    out = vv('out', sdOut('DITL-771', 22, 23), 0),
    ca = vv('ca', sdOut('DITL-771', 24) && pa > K.tankBar, 0),
    iso = [vv('isoA', sdOut('DITL-776', 10), 0), vv('isoB', sdOut('DITL-776', 12), 0)];
  D.fan = sdOut('DITL-774', 21);
  /* filling: silo -> vessel through the inlet dome valve (the vent lets the air out) */
  const fill = D.silo > 0 ? Math.min((dv.x * K.m * dt) / K.tFill, K.m - D.m) : 0;
  D.m += fill;
  /* the silo level stands: silos are unlimited in this simulator (scope 2026-11-07) */
  /* conveying: conveying air + outlet + a route to the boiler; the batch leaves in 55 s, the vessel pressure falls when it is empty */
  const route = iso.some(q => q.x >= 1),
    conv = ca.x > 0 && out.x > 0 && route,
    q = conv && D.m > 0 ? Math.min(D.m, (K.m * dt) / K.tConv) : 0;
  D.m -= q;
  D.q = (q / dt) * 3.6; /* T/H */
  const tgt = ca.x > 0 && out.x > 0 && !route ? pa / 0.980665 : conv && D.m > 0 ? K.pConv : 0;
  D.p += (tgt - D.p) * Math.min(1, dt / (vent.x > 0 ? 1 : 3));
  const W = D.sw;
  const sealOk = v => v.x <= 0 && v.s >= AN_LM.seal && pa > K.sealBar;
  W.dvO = dv.x >= 1 ? 1 : 0;
  W.dvC = dv.x <= 0 ? 1 : 0;
  W.seal = sealOk(dv) ? 1 : 0;
  W.ventO = vent.x >= 1 ? 1 : 0;
  W.ventC = vent.x <= 0 ? 1 : 0;
  W.outO = out.x >= 1 ? 1 : 0;
  W.outC = out.x <= 0 ? 1 : 0;
  W.caO = ca.x >= 1 ? 1 : 0;
  W.caC = ca.x <= 0 ? 1 : 0;
  W.isoAO = iso[0].x >= 1 ? 1 : 0;
  W.isoBO = iso[1].x >= 1 ? 1 : 0;
  W.isoAC = iso[0].x <= 0 ? 1 : 0;
  W.isoBC = iso[1].x <= 0 ? 1 : 0;
  W.lsh = D.m >= K.lsh * K.m ? 1 : 0;
  W.plow = D.p * 0.980665 < K.pLowBar ? 1 : 0;
  W.tank = pa < K.tankBar ? 1 : 0;
  W.siloH = D.silo >= K.siloH ? 1 : 0;
  W.siloL = D.silo <= K.siloL ? 1 : 0;
  W.fan = D.fan ? 1 : 0;
  sdPub(U);
}
function sdPub(U) {
  const D = U.sd;
  U.sdP = Math.max(0, D.p);
  U.sdM = (100 * D.m) / AN_SD.m;
  U.sdSilo = D.silo;
  U.sdQ = D.q || 0;
}
/* ===== BOTTOM ASH TRANSMITTER AND CONVEYORS (016 BOTTOM ASH REMOVAL SYSTEM, PICT 16 / 17; docs/versions/v3.2.1/BOTTOM_ASH_PLANT_MODEL.md)
   The field devices of the bottom ash handling system (J.A.T. Engineering 130225, O&M L6 "Bottom ash" on the PC) under the drawings
   DITL-BA01 ~ BA74 (130225C-BA-xx, station 103, IO list "Station 103" B/A Feeding / B/A Handling).
   Ash transmitter (HD600 vessel): inlet knife gate valve SV-BH1759 (DITL-BA53 OUT7), venting valve SV-BH1753 (OUT1), outlet valve
     SV-BH1752 (OUT8), pressing valve SVO / SVC-BH1750 (OUT9 / OUT10, double solenoid: it stays where it is between the commands) ->
     ZSO / ZSC I.0482 ~ I.0489 (DITL-BA03, BA11, BA38, BA39); vessel pressure switches PSH-BH1750 I.048A (1.8 kg/cm2) and PSL-BH1750
     I.048B (0.5 kg/cm2, 1 = low: DITL-BA25 TR358), air tank PS-BH1750 I.048D (1 = low < 7 kg/cm2: DITL-BA03 NOT, BA25 TR359), vessel
     high level LS-BH1750 I.048F. O&M L6 p.7 ~ 10: primary conditions "all valves closed, air source > 7 Kg/cm2, transmitter < 0.5
     Kg/cm2"; pressing at the regulator 3.5 Kg/cm2-G, outlet opens at 1.8, cleaning below 0.5.
   Mechanical conveyors (DITL-BA59 / BA60 rows by tag, no address): remote selectors MIL-x at REMOTE (16.PNG "R"), local emergency stop
     contacts ES-L-1090 ~ 1092 closed (IO list "not emergency stop", N.C. from local; DITL-BA62 NOT), speed switches SS-BH1750 ~ 1752 made
     while the machine turns (IO list "1 : speed OK"), block switches not made.
   NO-SOURCE (O&M L6 JAT 130225-OMM-01 p 4 ~ 10 searched 2026-11-11: charging ends at the high level or the charging time, not printed;
   conveying runs until the low pressure 0.5 kg/cm2 G, then cleaning 10 s and vent 2 s, over-time alarm 900 s; pressing over-time 60 s):
   valve stroke 2 s, charging of the vessel 30 s, conveying of one batch 60 s, vessel pressure while conveying 1.5 kg/cm2,
     the buffer tank (not modelled: the charge assumes ash in the buffer tank). The air tank PS-BH1750 reads the plant air receiver tanks of the
     model (U.paP, 39.PNG 7.0 kg/cm2), ASSUMED: the transmitter's own air tank is charged at rest with no flow, so it stands at the
     supply pressure, not at the unit header under full plant use (U.paPU 6.8, whose 0.2 drop is NO-SOURCE); decided by SEULGI 2026-11-04
     (user: "ikaw lahat magdecide"). Low = below 7 kg/cm2 (O&M L6 p.9). */
const AN_BA = {
  stroke: 2,
  tFill: 30,
  tConv: 60,
  pReg: 3.5,
  pHi: 1.8,
  pLo: 0.5,
  pConv: 1.5,
  airSw: 7,
  lsh: 100
};
/* the transmitter's air tank: the plant air receivers (no flow into it at rest), else the header */
function baTank(U) {
  /* before the first step of the air model (the 150 MW start): the receivers at their start pressure (unit.js AN_AIR.P) */
  return isFinite(U.paP) ? U.paP : typeof AN_AIR !== 'undefined' ? AN_AIR.P : 0;
}
function anBaStart(U) {
  U.ba = { v: {}, sw: {}, lv: 0, p: 0, press: 0 };
  /* at rest (O&M L6 primary conditions): every valve closed, the vessel empty and at atmosphere; the field switches are known before
     the first step, so the start of the DITL (ditl150.js) reads them */
  const W = U.ba.sw;
  for (const k of ['inl', 'vent', 'out', 'prs']) {
    W[k + 'O'] = 0;
    W[k + 'C'] = 1;
  }
  W.psh = 0;
  W.psl = 1;
  W.air = baTank(U) >= AN_BA.airSw ? 0 : 1;
  W.lsh = 0;
  W.rem = 1;
  W.es = 1;
  baPub(U);
}
function anBaStep(U, dt) {
  /* chain conveyor L-1090: runs at load (16.PNG); from Cold on its ON COMMAND, DITL-BA68 output 5 */
  U.baConv = !U.cold || fnOut('DITL-BA68', 5) === 1 ? 1 : 0;
  const B = U.ba;
  if (!B) return;
  const K = AN_BA,
    o = r => fnOut(')DITL-BA53', r) === 1,
    vv = (k, cmd) => lmValve(B, k, cmd, dt, K.stroke, 0),
    pa = isFinite(U.paPU) ? U.paPU : 0; /* kg/cm2 */
  /* the pressing valve has two solenoids: open on SVO, close on SVC, it stays between them */
  if (o(8)) B.press = 1;
  if (o(9)) B.press = 0;
  const inl = vv('inl', o(6)),
    vent = vv('vent', o(0)),
    out = vv('out', o(7)),
    prs = vv('prs', B.press);
  /* charging: ash falls from the buffer tank while the inlet gate is open (the vent lets the air out) */
  B.lv = Math.min(100, B.lv + (inl.x * 100 * dt) / K.tFill);
  /* conveying: outlet open with pressing air, the batch leaves in tConv */
  const conv = out.x > 0 && prs.x > 0 && B.p > K.pLo;
  if (conv) B.lv = Math.max(0, B.lv - (100 * dt) / K.tConv);
  const air = prs.x > 0 ? Math.min(K.pReg, pa) : 0,
    tgt =
      vent.x > 0 || inl.x > 0
        ? 0
        : out.x > 0
          ? prs.x > 0 && B.lv > 0
            ? Math.min(K.pConv, air)
            : 0
          : prs.x > 0
            ? air
            : B.p;
  B.p += (tgt - B.p) * Math.min(1, dt / (vent.x > 0 || inl.x > 0 ? 1 : out.x > 0 ? 3 : 5));
  const W = B.sw;
  for (const [k, v] of [
    ['inl', inl],
    ['vent', vent],
    ['out', out],
    ['prs', prs]
  ]) {
    W[k + 'O'] = v.x >= 1 ? 1 : 0;
    W[k + 'C'] = v.x <= 0 ? 1 : 0;
  }
  W.psh = B.p >= K.pHi ? 1 : 0;
  W.psl = B.p < K.pLo ? 1 : 0;
  W.air = baTank(U) < K.airSw ? 1 : 0;
  W.lsh = B.lv >= K.lsh ? 1 : 0;
  W.rem = 1;
  W.es = 1;
  baPub(U);
}
function baPub(U) {
  const B = U.ba;
  U.baP = Math.max(0, B.p);
  U.baLv = B.lv;
}
/* the boiler-side systems, once per step of the unit model (after the air compressors: the atomizing air is plant air) */
/* SOx at the stack. Raw SO2 of the coal, S 1.49 % (Tab 3), about 1890 ppm in the MCR gas. Limestone CaCO3 93.66 % (Tab 3) gives Ca/S.
   The bed holds lime, so the capture follows Ca/S with a lag: tau 2 h NO-SOURCE. Fit to the snapshot: 41 ppm at limestone 11 % of 14 T/H
   (Ca/S 0.346): capture = exp(-11 x Ca/S). soxF is the factor on the anchor of source.js R.AICFG10571 */
const AN_SOX = { z0: 0.346, k: 11, tau: 7200, max: 1890 / 41 };
function anSoxStep(U, dt) {
  const K = AN_SOX;
  if (!isFinite(U.soxZ)) U.soxZ = K.z0;
  const c = U.Fc || 0;
  if (c > 1) U.soxZ += ((((U.lmQ || 0) * 0.9366) / 100 / ((c * 0.0149) / 32) - U.soxZ) * Math.min(dt, K.tau)) / K.tau;
  U.soxF = Math.min(K.max, Math.exp(-K.k * (U.soxZ - K.z0)));
  /* written here: the loop model limited the factor (Mina item 8, flat at 96 ppm) */
  if (U.soxAI && U.soxAI.length) anUnitWrite(U.soxAI, 41 * U.soxF * Math.min(1.1, c / Math.max(1, U.F0)));
}
function anBoilerStep(U, dt) {
  anDieselOilStep(U, dt);
  anFanStep(U, dt);
  anAphStep(U, dt);
  anLmStep(U, dt);
  anSoxStep(U, dt);
  anSdStep(U, dt);
  anBaStep(U, dt);
}
