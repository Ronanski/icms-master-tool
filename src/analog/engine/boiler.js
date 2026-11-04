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
  Ka: 12.5 / (0.242 * Math.sqrt(12.8)) /* PCV-DO0002, 6.PNG */,
  Kf: 12.5 / (1.001 * Math.sqrt(12.8 - 11.0)) /* FCV-DO1012, 6.PNG */,
  Kr: 12.5 / (0.857 * Math.sqrt(11.0)) /* PCV-DO1009, 6.PNG */,
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
  if (!(tag in AN_DO.fv0)) return false;
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
    ring = P2 => K.Kr * xr * sq(P2) + xb.reduce((s, x) => s + doBurnerQ(P2, x), 0);
  /* for a header P1: the ring pressure where the flow through FCV-DO1012 = return + burners */
  const p2Of = P1 => {
    if (!(xf > 0) || !(P1 > 0)) return 0;
    let a = 0,
      b = P1;
    for (let i = 0; i < 30; i++) {
      const m = (a + b) / 2;
      if (K.Kf * xf * sq(P1 - m) > ring(m)) a = m;
      else b = m;
    }
    return (a + b) / 2;
  };
  const out = P1 => {
    const P2 = p2Of(P1);
    return { P2, qa: K.Ka * xa * sq(P1), qf: K.Kf * xf * sq(P1 - P2) };
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
  if (c && c.out != null) return { S, n: c.out };
  const b = S.blk.find(z => z.k === 'MAN' && (z.tag === tag || (z.txt || []).includes(tag)));
  return b && b.o && b.o[0] != null && b.o[0] >= 0 ? { S, n: b.o[0] } : null;
}
const doX = (o, d) => (o && isFinite(o.S.rt.v[o.n]) ? Math.max(0, Math.min(100, +o.S.rt.v[o.n])) / 100 : d);
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
  anFanStart(U);
}
/* called by anUnitCold: the pumps are the DITL's (stopped in a cold plant); the tank keeps its level */
function anBoilerCold(U) {
  U.fnZ = {};
  U.doP1 = U.doP2 = NaN;
  U.doSp = null;
  U.doZ = {};
  for (const k in AN_DO.fv0) if (AN_SRC.valve) delete AN_SRC.valve[k];
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
function fnRow(n, r) {
  try {
    const s = S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(n));
    return s && typeof DUI !== 'undefined' ? DUI.rowVal(s, r) : null;
  } catch (e) {
    return null;
  }
}
function fnOut(n, r) {
  try {
    const s = S.sheets.concat(WORLD.inst || []).find(x => x.name.endsWith(n));
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
  const cur = (I0, on, x) => (on ? I0 * (K.fI + (1 - K.fI) * Math.max(0, x)) : 0);
  U.fnI = U.fnI || [0, 0, 0, 0, 0];
  U.fnIa = lag('ia', cur(K.I0.fa, fr[0], (qi[0] * pfa) / (K.fa.Q0 * K.fa.P0[0])), 2);
  U.fnIb = lag('ib', cur(K.I0.fa, fr[1], (qi[1] * pfa) / (K.fa.Q0 * K.fa.P0[0])), 2);
  /* PAF / SAF: flow of the loop model, outlet pressure on the system curve */
  const qpa = Math.max(0, val(F.qpa)) || 0,
    qsa = Math.max(0, val(F.qsa)) || 0,
    ppa = K.pa.P0 * Math.pow(qpa / K.pa.Q0, 2),
    psa = K.sa.P0 * Math.pow(qsa / K.sa.Q0, 2);
  U.fnPaP = lag('pp', ppa, 2);
  if (F.ai.pa.length) anUnitWrite(F.ai.pa, U.fnPaP);
  U.fnPafI = lag('ip', cur(K.I0.paf, fnRun(K.run.paf), (qpa * ppa) / (K.pa.Q0 * K.pa.P0)), 2);
  U.fnSafI = lag('is', cur(K.I0.saf, fnRun(K.run.saf), (qsa * psa) / (K.sa.Q0 * K.sa.P0)), 2);
  /* IDF: the flue gas is the total air (unit.js U.taf); inlet suction and outlet with its square */
  const taf = U.taf && U.tafS ? U.taf.reduce((a, n) => a + (+U.tafS.rt.v[n] || 0), 0) : 0,
    rg = Math.pow(taf / K.ga.T0, 2),
    idf = fnRun(K.run.idf);
  U.fnGi = K.ga.Pi.map((p, i) => lag('gi' + i, idf ? p * rg : 0, 2));
  U.fnGo = lag('go', idf ? K.ga.Po * rg : 0, 2);
  const dpg = U.fnGo - (U.fnGi[0] + U.fnGi[1]) / 2,
    dpg0 = K.ga.Po - (K.ga.Pi[0] + K.ga.Pi[1]) / 2;
  U.fnIdfI = lag('ii', cur(K.I0.idf, idf, ((taf / K.ga.T0) * dpg) / dpg0), 2);
  U.fnI = [U.fnPafI, U.fnSafI, U.fnIdfI, U.fnIa, U.fnIb];
}
/* the boiler-side systems, once per step of the unit model (after the air compressors: the atomizing air is plant air) */
function anBoilerStep(U, dt) {
  anDieselOilStep(U, dt);
  anFanStep(U, dt);
}
