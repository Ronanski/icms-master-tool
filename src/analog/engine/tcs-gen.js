/* 3.2.1 plan c4: the generator side of the ATS steps 4 and 5: field switch 41 and AVR (G-4), automatic synchronizing and the close order of 52G (G-1B). The 230 kV side
   is in elec.js (plan c4): 52L1 is closed unless the instructor opens it (house load); 52G1 closes only with 52L1 closed. No relay is modelled either, so no protection operates by itself; a protection held on TA-9 trips the turbine through the IBD logic. */
/* 3.2.3-beta.236 (live Cold start, user 2026-11-14: "model dapat, physics, hindi patch"): the excitation and the automatic synchronizing are
   physics (was: a 30 s voltage ramp and a 60 s ASD timer). Sources (local notes document-references/_notes/gen-sync-llm-2026-11-14.txt):
   - main field: T'do 7.69 s (GAE-2013-0136 R2 generator data sheet p.2); the open circuit voltage = field flux x speed (the saturation
     curve is not in the docs: NO-SOURCE, linear). Brushless exciter fed by the UNITROL 6080 (GEE-2015-0152 p.7): exciter field no load
     4.5 A / 28 V, ceiling 17.6 A / 109.8 V, so the field forcing ceiling is 17.6 / 4.5 = 3.9 times the no-load field.
     NO-SOURCE: the exciter time constant (te), the AVR gains (kp, ki), the AVR set point rate during a raise / lower pulse (vrr).
   - synchronizing: ASD1 Daiichi ASY-96-S7 for 52G (GEE-2015-0141 p.20): dV 2 %, dF 0.1 Hz, dTheta 15 deg, advance 130 ms, voltage pulse
     0.2 s every 2.0 s, speed pulse 0.5 s; check synchronizing relay 25 CSY-96-S2 (p.26): dV 5 %, dF 0.15 Hz, dTheta 10 deg; 52G closes
     only while 25 is operated (Generator Logic.pdf p.4); GCB closing time 85 ~ 100 ms (Alstom FKG1N manual p.175), 0.1 s here.
     The ASD 15R / 15L pulses go to the TCS speed set, 60R / 60L to the AVR (GEE-2015-0141 p.8, Generator Logic.pdf p.11).
     NO-SOURCE: the grid frequency drift (tcsGridHz, about +-0.04 Hz), the grid voltage 1.0 pu, the speed set rate during a pulse (nrr),
     the speed loop lag (tn), the speed pulse interval (2.0 s as the voltage pulse), the 84 generator voltage relay level (95 %). */
const TCS_GEN = {
  x3: 3 /* G-1B */,
  to: 300 /* G-1B 5 min */,
  tdo: 7.69,
  ceil: 17.6 / 4.5,
  te: 0.4 /* s, NO-SOURCE */,
  kp: 6 /* NO-SOURCE: picked for no overshoot, 98 % in about 4 s at x1 */,
  ki: 0.6 /* 1/s, NO-SOURCE */,
  vrr: 0.01 /* pu/s, NO-SOURCE */,
  dV: 0.02,
  dF: 0.1,
  dTh: 15,
  adv: 0.13,
  vpw: 0.2,
  vpi: 2.0,
  fpw: 0.5,
  r25: { dV: 0.05, dF: 0.15, dTh: 10 },
  tcb: 0.1,
  nrr: 3.6 /* rpm/s while a speed pulse is on, NO-SOURCE */,
  tn: 1.0 /* s, NO-SOURCE */,
  v84: 0.95 /* NO-SOURCE */
};
/* the grid frequency, Hz (NO-SOURCE: a slow drift, so the slip and the phase angle move as on a real grid) */
function tcsGridHz(t) {
  return 60 + 0.03 * Math.sin((2 * Math.PI * t) / 420) + 0.012 * Math.sin((2 * Math.PI * t) / 97 + 1);
}
function tcsWrap(a) {
  return ((((a + 180) % 360) + 360) % 360) - 180;
}
function tcsGen(U) {
  if (U.gen) return U.gen;
  const on = !!U.tb && (U.tb.st === 'sync' || U.tb.st === 'load');
  return (U.gen = {
    f41: on,
    V: on ? 1 : 0,
    rated: on,
    ex: false,
    start: false,
    x25: false,
    tx: 0,
    ty: 0,
    on25: false,
    close: false,
    last: ''
  });
}
function tcsGenStep(U, dt) {
  const g = tcsGen(U),
    K = TCS_GEN,
    tb = U.tb,
    g52 = tb.st === 'sync' || tb.st === 'load',
    c = U.tc;
  /* a save point of before beta.236 has no field state: the flux is the voltage it had */
  if (!isFinite(g.eq)) g.eq = g.f41 ? g.V || 0 : 0;
  if (!isFinite(g.efd)) g.efd = g.eq;
  if (!isFinite(g.ai)) g.ai = g.eq;
  if (!isFinite(g.vr)) g.vr = 1;
  if (!isFinite(g.th)) g.th = 120;
  g.t = (g.t || 0) + dt;
  const fgr = tcsGridHz(isFinite(U.t) ? U.t : g.t);
  /* turbine speed before 52G (ATS step 4 / 5 at rated speed): the TCS speed control holds the speed set; the ASD 15R / 15L pulses move it */
  if (!g52 && c && c.step >= 3 && c.cur !== 3 && tb.rpm > 3500 && !c.trip) {
    if (!isFinite(g.nref)) g.nref = 3600;
    g.nref += K.nrr * dt * ((g.pR > 0 ? 1 : 0) - (g.pL > 0 ? 1 : 0));
    tb.rpm += (g.nref - tb.rpm) * Math.min(1, dt / K.tn);
  } else g.nref = NaN;
  const rpm = tb.rpm || 0,
    n = Math.max(0, Math.min(1.2, rpm / 3600));
  /* TURBINE RATED SPEED: ON >= 3550, OFF <= 3540 (IBD TD-1) */
  if (rpm >= 3550) g.rated = true;
  else if (rpm <= 3540) g.rated = false;
  /* G-4: 41_CLOSE_CMD = ES_AND_52G_OPEN AND TURBINE_RATED_SPEED AND NOT 41_TRIP AND 41_CLOSE_REQ; EXCITATION AUTO START is a pulse of ATS step 4 */
  if (g.ex && !g52 && g.rated) g.f41 = true;
  g.ex = false;
  /* field and AVR in sub-steps of 0.05 s: AVR (PI on the terminal voltage, output 0 ~ ceiling) -> exciter (lag te) -> main field (T'do)
     -> open circuit terminal voltage = flux x speed. With 52G closed the grid holds the terminal voltage */
  if (g.f41) {
    const m = Math.max(1, Math.ceil(dt / 0.05)),
      h = dt / m;
    for (let i = 0; i < m; i++) {
      const e = g.vr - (g52 ? 1 : g.eq * n);
      g.ai = Math.max(0, Math.min(K.ceil, g.ai + K.ki * e * h));
      const u = Math.max(0, Math.min(K.ceil, g.ai + K.kp * e));
      g.efd += ((u - g.efd) * h) / K.te;
      g.eq += ((g.efd - g.eq) * h) / K.tdo;
    }
  } else {
    g.ai = 0;
    g.efd = 0;
    g.eq = Math.max(0, g.eq - (g.eq * dt) / K.tdo);
    if (g.eq < 1e-3) g.eq = 0;
    g.vr = 1;
  }
  g.V = g52 ? 1 : g.eq * n;
  /* the synchronizing quantities: slip, phase angle (the integral of the slip), voltage difference */
  g.fgr = fgr;
  g.fg = rpm / 60;
  g.slip = g.fg - fgr;
  g.dv = g.V - 1;
  const th0 = g.th;
  g.th = g52 ? 0 : tcsWrap(g.th + 360 * g.slip * dt);
  /* G-1B: the automatic synchronizing, 52L closed. 84GI = generator voltage on; the 5 min timer takes 25X1 away */
  const gv = g.V >= K.v84,
    can = g.f41 && !g52 && gv;
  /* c2 gap 4 (310SC90-773 rev 2 DO 79 TCS-DO1006 AUTO SYN START PB ON, pulse, SH-G-3): the DCS output O.0492 = DITL-115 "AUTO SYNCHRONIZE
     START COMMAND" starts the synchronizing too (25X1 seal-in, same conditions). The ATS step 5 path (g.start) stays as it is */
  const pb = typeof tcsDitlOut === 'function' && tcsDitlOut('DITL-115', /^AUTO SYNCHRONIZE START COMMAND/);
  if (can && (g.start || pb) && !g.x25 && g.ty < K.to) g.x25 = true;
  if (!can) g.x25 = false;
  g.tx = g.x25 ? g.tx + dt : 0;
  const y1 = g.x25 && g.tx >= K.x3;
  g.ty = y1 ? g.ty + dt : 0;
  if (g.ty >= K.to) {
    g.x25 = false;
    g.start = false;
    g.last = 'Auto synchronizing timed out (5 min): start it again';
  }
  /* ASD matching pulses: voltage 60R / 60L (0.2 s every 2 s) to the AVR set, speed 15R / 15L (0.5 s every 2 s) to the TCS speed set */
  g.pV = Math.max(0, (g.pV || 0) - dt);
  g.pR = Math.max(0, (g.pR || 0) - dt);
  g.pL = Math.max(0, (g.pL || 0) - dt);
  g.pT = Math.max(0, (g.pT || 0) - dt);
  if (y1 && g.pT <= 0) {
    if (Math.abs(g.dv) > K.dV) {
      g.pV = K.vpw;
      g.vs = g.dv > 0 ? -1 : 1;
    }
    if (g.slip > K.dF) g.pL = K.fpw;
    else if (g.slip < -K.dF) g.pR = K.fpw;
    if (g.pV > 0 || g.pR > 0 || g.pL > 0) g.pT = K.vpi;
  }
  if (g.pV > 0) g.vr = Math.max(0.9, Math.min(1.1, g.vr + g.vs * K.vrr * dt));
  /* the close command at the advance angle (the phase angle 130 ms before 0) with dV and dF inside the ASD and the 25 relay windows; the
     crossing is found inside the step (a step can be up to 1 s at x10) */
  const ok = Math.abs(g.dv) <= Math.min(K.dV, K.r25.dV) && Math.abs(g.slip) <= Math.min(K.dF, K.r25.dF);
  if (y1 && !g52 && !g.cmd && ok && Math.abs(g.slip) > 1e-4) {
    const tgt = -360 * g.slip * K.adv,
      d = 360 * g.slip * dt,
      r0 = tcsWrap(th0 - tgt),
      r1 = r0 + d;
    if ((d > 0 && r0 <= 0 && r1 >= 0) || (d < 0 && r0 >= 0 && r1 <= 0)) {
      g.cmd = true;
      g.tcl = 0;
      g.thCmd = tgt;
    }
  }
  if (g.cmd) {
    g.tcl += dt;
    if (g.tcl >= K.tcb) {
      /* the main contacts touch after the closing time: the phase angle at that moment; 25 must still be operated */
      g.thC = g.thCmd + 360 * g.slip * K.tcb;
      g.on25 = Math.abs(g.thC) <= K.r25.dTh;
      g.cmd = false;
    }
  }
  if (!g.x25) {
    g.cmd = false;
    g.on25 = false;
  }
  /* 52G_CLOSE_ORDER = 52G_REMOTE AND 52G_AUTO AND 25_ON AND protection not operated AND 41 and 52L closed */
  g.close = g.on25 && can && !(U.el && U.el.l52 === false);
}
/* a turbine trip: 52G is open, so ST TRIP opens 41 and the AVR (G-4) */
function tcsGenTrip(U) {
  Object.assign(tcsGen(U), {
    f41: false,
    V: 0,
    eq: 0,
    efd: 0,
    ai: 0,
    cmd: false,
    ex: false,
    start: false,
    x25: false,
    tx: 0,
    ty: 0,
    on25: false,
    close: false
  });
}
