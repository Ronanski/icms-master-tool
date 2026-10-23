/* PLANT LAYER (v1.18.x): the plant answers at the INPUT of the sheet, where the field writes: the transmitter (AI block) or the input wire of the PV. The blocks between the transmitter and the PID (selection, average, square root, deviation alarm...) keep running as drawn.
   The value to write is found by feedback (secant): the PV that the PID really sees is read back and the transmitter value is corrected until it equals the plant value; this also works through scaling / square root / selectors. A value that the USER forces (the PV wire, or a transmitter) is never overwritten: the plant keeps evolving underneath, the forced value stays (like a forced point in the DCS). */
/* WHICH input of the deviation block is the PV? The drawing says it: the text "PV" / "SV" written beside the pin (nearest pin wins). Without text: reverse action -> PV on the minus pin, direct action -> PV on the plus pin (67 of 68 loops agree with their drawing). v1.18.x: before this the minus pin was always taken as PV, which is WRONG for direct-acting loops (the SV was driven as if it were the PV). */
function anPins(S, b) {
  if (b._pins !== undefined) return b._pins;
  let r = null;
  try {
    if ((b.k === 'PID' || b.k === 'PIDV') && b.in0 >= 0) {
      const d = (S.drv[b.in0] || [])
        .map(x => S.blk.find(q => q.id === x.id))
        .find(q => q && q.k === 'DEV' && q.ip && q.ip.length >= 2);
      if (d) {
        const ins = d.pins.filter(q => q.role === 'in');
        let psg = null,
          by = 0;
        for (const t of S.tx || []) {
          const tt = t.t.trim();
          if (!/^(PV|SV)$/i.test(tt) || Math.hypot(t.x - d.cx, t.y - d.cy) > 30) continue;
          const pn = ins.slice().sort((x, y) => Math.hypot(x.x - t.x, x.y - t.y) - Math.hypot(y.x - t.x, y.y - t.y))[0],
            ip = pn && d.ip.find(x => x.n === pn.n);
          if (!ip) continue;
          psg = /^PV$/i.test(tt) ? ip.sg : -ip.sg;
          by = 1;
        }
        if (psg == null) psg = b.p.act < 0 ? -1 : 1;
        const pv = d.ip.find(q => q.sg === psg) || d.ip[0],
          sv = d.ip.find(q => q !== pv);
        r = { dev: d, pv: pv.n, sv: sv ? sv.n : -1, pvSg: psg, byLabel: by };
      }
    }
  } catch (e) {
    r = null;
  }
  return (b._pins = r);
}
/* PID input: filter time constant TF (first-order filter on the PV) and low input cut CUT (PV below CUT % of a zero-based range is taken as 0 %): faceplate parameters of the parameter workbook, names and ranges in the textbook (PID panel); the exact DCS formulas are not in the repository, so this is the usual definition (Needs Verification, FINDINGS N-5) */
/* GAP (parameter workbook, 1 PID: HICBR1391 2.5 %): error inside +-GAP % of the span is treated as zero (gap / dead zone action) */
function anGap(P, e) {
  return P.gap > 0 && Math.abs(e) < P.gap ? 0 : e;
}
function anPidIn(S, b, s, v, dt) {
  const x = v[b.in0],
    P = b.p;
  if (!(P.tf > 0 || P.cut > 0)) return x;
  const r = anPins(S, b);
  if (!r || !r.byLabel || r.pv == null || r.pv < 0) return x;
  const pv = v[r.pv];
  let q = pv;
  if (P.cut > 0 && P.rlo >= 0 && P.rhi > P.rlo && q < P.rlo + (P.cut / 100) * (P.rhi - P.rlo)) q = P.rlo;
  if (P.tf > 0) {
    if (s.pvf == null || !isFinite(s.pvf)) s.pvf = q;
    else if (dt > 0) s.pvf += (q - s.pvf) * (1 - Math.exp(-dt / P.tf));
    q = s.pvf;
  } else s.pvf = q;
  return x + r.pvSg * (q - pv);
}
function anProcEst(b) {
  const P = b.p,
    lt = P.lt || 'general',
    TAU = { flow: 6, pressure: 25, temperature: 60, level: 90, analysis: 40, speed: 15, general: 30 },
    kp = P.kp > 0 ? P.kp : 1;
  /* a tuned loop: Ti is about the process time constant, Kp x K is about 0.6; dead time from Td, otherwise a tenth of T */
  const T = P.ti > 0 ? Math.min(600, Math.max(3, P.ti)) : TAU[lt] || 30,
    L = P.td > 0 ? Math.min(T / 3, Math.max(0.5, P.td * 2)) : lt === 'flow' ? 1 : Math.min(15, Math.max(1, T / 12)),
    K = Math.min(1, Math.max(0.2, (0.8 * T) / (kp * L)));
  return { K: +K.toFixed(2), T: +T.toFixed(1), L: +L.toFixed(1) };
}
/* Which transmitters (AI blocks) of the PV chain carry the measurement? Redundant transmitters of one variable all matter; compensation inputs (pressure, temperature) matter much less. The chain is probed on a COPY of the state: each AI is moved by 10 % of its range and the PV pin is read back. */
function anRtCopy(rt) {
  return structuredClone(rt);
}
function anRtBack(rt, sn) {
  for (const k in sn) {
    const a = rt[k],
      b = sn[k];
    if (Array.isArray(b) && Array.isArray(a)) {
      a.length = 0;
      for (const x of b) a.push(x);
    } else if (b && typeof b === 'object' && a && typeof a === 'object' && !Array.isArray(b)) {
      for (const q in a) if (!(q in b)) delete a[q];
      for (const q in b) a[q] = b[q];
    } else rt[k] = b;
  }
}
function anProbe(S, pr) {
  const rt = S.rt,
    sn = anRtCopy(rt),
    res = [];
  try {
    const ev = () => {
      for (let i = 0; i < 4; i++) anStep(S, 0);
      return rt.v[pr.pv];
    };
    for (const id of pr.ai) {
      const a = S.blk.find(x => x.id === id),
        s = rt.st[id],
        r = a.rng || { lo: 0, hi: 100 };
      const sp = Math.max(1e-9, r.hi - r.lo);
      for (const b2 of pr.ai) {
        const x = S.blk.find(q => q.id === b2),
          q = rt.st[b2],
          rr = x.rng || { lo: 0, hi: 100 };
        q.val = q.act = rr.lo + 0.4 * (rr.hi - rr.lo);
      }
      const p1 = ev();
      /* 1.22.0: never probe at exactly 0: the AVERAGE SELECT takes 0 as a lost signal (ABC-008 furnace pressure -600 ~ +600 mmH2O:
         50 % = 0, so no transmitter seemed to matter, the plant forced the PV to +600 while the three transmitters showed -600) */
      const f = Math.abs(r.lo + 0.5 * sp) < 1e-9 ? 0.6 : 0.5;
      s.val = s.act = r.lo + f * sp;
      const p2 = ev();
      res.push({ id, sens: ((p2 - p1) / ((f - 0.4) * sp)) * sp });
    }
  } catch (e) {}
  anRtBack(rt, sn);
  return res;
}
function anProcList(S) {
  S.procs = [];
  const out = [];
  for (const b of S.blk) {
    if (b.k !== 'PID' && b.k !== 'PIDV') continue;
    if (b.in0 == null || b.in0 < 0) continue;
    const pn = anPins(S, b);
    if (!pn) continue;
    const mi = { n: pn.pv };
    const ais = [],
      seen = new Set(),
      walk = (n, dp) => {
        if (dp > 8 || seen.has(n)) return;
        seen.add(n);
        for (const dr of S.drv[n] || []) {
          const x = S.blk.find(q => q.id === dr.id);
          if (!x) continue;
          if (x.k === 'AI') {
            if (!x.fb && !ais.includes(x.id)) ais.push(x.id);
            continue;
          }
          if (x.k === 'PID' || x.k === 'PIDV' || x.k === 'MAN') continue;
          for (const q of x.i || []) walk(q, dp + 1);
        }
      };
    walk(mi.n, 0);
    const pinExt = S.ext.includes(mi.n) && !(S.xlk && S.xlk[mi.n]);
    if (!ais.length && !pinExt) continue;
    let act = -1;
    {
      const seen2 = new Set();
      let fr = (b.o || []).slice(),
        g = 0;
      while (fr.length && act < 0 && g++ < 10) {
        const nx = [];
        for (const n of fr) {
          if (seen2.has(n)) continue;
          seen2.add(n);
          for (const x of S.cns[n] || []) {
            if (x.k === 'AO' || x.k === 'IP' || x.k === 'ACT' || x.k === 'VLV') {
              const i0 = (x.i || [])[0];
              if (i0 != null) {
                act = i0;
                break;
              }
            }
            for (const m of x.o || []) nx.push(m);
          }
          if (act >= 0) break;
        }
        fr = nx;
      }
    }
    const e = anProcEst(b);
    b.proc = b.proc || { on: true, K: e.K, T: e.T, L: e.L, dist: 0, est: 1 };
    const pr = b.proc;
    pr.pv = mi.n;
    pr.act = act;
    pr.sg = b.p.act < 0 ? 1 : -1;
    pr.svn = pn.sv;
    pr.pinExt = pinExt ? mi.n : null;
    pr.allAI = ais.slice();
    pr.ai = ais.slice();
    pr.mode = pinExt ? 'input' : 'transmitter';
    if (!pinExt) {
      const sn = anProbe(S, { pv: mi.n, ai: ais }),
        mx = Math.max(0, ...sn.map(q => Math.abs(q.sens)));
      pr.sens = sn;
      if (mx < 1e-6) {
        /* 1.22.0: a cascade master (no actuator of its own) whose transmitters are switched out by the drawing (ABC-004A FIC-CM:
           PV = average of the three coal feeders, a stopped feeder counts 0): NO plant model, the drawing computes the PV from
           the feeders (before: the PV was forced to 7.32 T/H with every feeder stopped) */
        if (act < 0) {
          pr.mode = 'none';
          pr.ai = [];
          pr.aiOut = [];
          continue;
        }
        pr.mode = 'pin';
        pr.ai = [];
      } else {
        let pick = sn.filter(q => Math.abs(q.sens) >= 0.3 * mx);
        /* 2.1.0-beta.6: only the transmitters of the measurement itself (same unit as the PV): the pressure / temperature of a
           level or flow COMPENSATION is another measurement (ABC-010: the drum level model wrote the drum pressure AI0128,
           134.2 -> 0 kg/cm2; the feedwater flow model wrote the feedwater temperature TIFW1160, 244 -> 300 °C) */
        const pu = String(b.p.unit || '')
          .trim()
          .toLowerCase();
        if (pu) {
          const same = pick.filter(q => {
            const a = S.blk.find(z => z.id === q.id);
            return (
              a &&
              a.rng &&
              String(a.rng.u || '')
                .trim()
                .toLowerCase() === pu
            );
          });
          if (same.length) pick = same;
        }
        pr.ai = pick.map(q => q.id);
      }
    }
    pr.aiOut = pr.ai.flatMap(id => {
      const a = S.blk.find(q => q.id === id);
      return a ? a.pins.filter(p => p.role === 'out').map(p => p.n) : [];
    });
    out.push(b);
  }
  /* two controllers on the SAME measurement (two valves on one level): ONE plant variable. The first controller carries the plant model, the others follow the same measurement (their own output is not part of the model). */
  {
    const byPv = {};
    for (const b of out) {
      const pr = b.proc,
        k = pr.pv;
      if (byPv[k]) {
        pr.mode = 'shared';
        pr.of = (byPv[k].txt || [])[1] || byPv[k].k;
        pr.ai = [];
        pr.aiOut = [];
        pr.pinExt = null;
      } else byPv[k] = b;
    }
  }
  S.procs = out;
  return out;
}
/* 2.0.0 (user tip): OPERATING POINTS of the real plant, from the control-room HMI snapshots (docs/hmi/operating-points.json,
   about 150 MW). The plant model is ANCHORED there: with the snapshot MV the PV settles at the snapshot PV; the slope (K) and
   the direction (ACT) stay as before. Only loops that run in AUTO / REMOTE on the snapshot with their own valve; cascade
   masters, parallel valves and measurements shared by two controllers are not anchored (their PV is made by other loops). */
/* actuators in series on one fan (see u below): tag -> 1 */
const AN_SERIES = { PICFG108: 1, PICFG108A: 1 };
const AN_HMI_OP = {
  TICBR1140: { mv: 65.6, pv: 462.0, src: '03.png' },
  TICBR1130: { mv: 57.6, pv: 394.0, src: '03.png' },
  TICMS1004: { mv: 69.7, pv: 542.0, src: '03.png' },
  TICBR1150: { mv: 30.2, pv: 420.0, src: '03.png' },
  LICBR1001A: { mv: 56.0, pv: 3.0, src: '03.png' },
  FICFW1007: { mv: 56.0, pv: 499.1, src: '03.png' },
  FICCL1061A: { mv: 72.8, pv: 29.0, src: '11.png' },
  FICCL1061B: { mv: 72.8, pv: 29.1, src: '11.png' },
  FICCL1061C: { mv: 72.8, pv: 28.9, src: '11.png' },
  TICHR1002A: { mv: 36.0, pv: 541.0, src: '39.PNG' },
  TICHR1002: { mv: 79.4, pv: 541.0, src: '39.PNG' },
  HICHR1002A: { mv: 11.0, pv: 11.0, src: '39.PNG' },
  HICHR1002B: { mv: 89.0, pv: 89.0, src: '39.PNG' }
};
/* 2.2.0-beta.3: the output of the SQRT (flow compensation) whose inputs come from the transmitter ai (ABC-001C: main steam flow
   = SQRT of LN31(p) x LN32(T) x AI0129); -1 when the sheet has none */
function anCompNet(S, ai) {
  const has = (n, d) => {
    if (d > 4) return false;
    for (const x of S.drv[n] || []) {
      if (x.k === 'AI' && x.o && S.lab[x.o[0]] && String(S.lab[x.o[0]].t).trim() === ai) return true;
      if ((x.i || []).some(i => has(i, d + 1))) return true;
    }
    return false;
  };
  const q = S.blk.find(z => z.k === 'SQRT' && z.o && z.o.length && (z.i || []).some(i => has(i, 0)));
  return q ? q.o[0] : -1;
}
function anProcStep(S, dt) {
  const rt = S.rt,
    v = rt.v,
    F = rt.force,
    pm = rt.pm || (rt.pm = {}),
    pf = rt.pf || (rt.pf = {});
  /* 2.2.0-beta.9 (M2): the unit model (unit.js) steps with the sheet of the boiler master (ABC-001C) */
  if (AN_UNIT.on && S === AN_UNIT.S) anUnitStep(dt);
  for (const b of S.procs) {
    const pr = b.proc;
    if (!pr || pr.mode === 'shared') continue;
    /* a measurement of the unit model (main steam pressure ...): the loop model does not write it */
    if (
      AN_UNIT.on &&
      (anUnitOwns(pr.remote ? pr.remote.S : S, pr.remote ? pr.remote.ai : pr.ai) || anUnitOwnsPv(S, pr.pv))
    ) {
      delete pm[b.id];
      continue;
    }
    /* 3.2.0-beta.14 (source.js): the medium of this loop (steam, oil, water, air) is there or not */
    anSrcSet(b, pr, S);
    let q = pm[b.id];
    if (!pr.on) {
      if (q) delete pm[b.id];
      if (pf[pr.pv]) {
        delete F[pr.pv];
        delete pf[pr.pv];
      }
      continue;
    }
    /* the command of controller g of sheet GS (the owner sheet, or another sheet for a measurement shared across sheets) */
    const uOfS = (GS, g) => {
        const t = GS.rt.st[g.id] || {},
          v = GS.rt.v,
          S = GS;
        if (g.vel && g.velNet != null) return v[g.velNet];
        /* the process answers the COMMAND THAT REALLY GOES TO THE VALVE: the output of the A / M station after the selectors that follow it (interlock / back-up legs), not the internal output of the PID (v1.20.67: a shared controller in MANUAL or a PID that is not tracking gave 0) */ if (
          g._fo === undefined
        ) {
          g._fo = null;
          try {
            /* 1.22.0: anStationOf gives { amt, ... }: the output of the station is amt.o[0] (before: stn.o, always undefined, so the
               process answered the internal PID output, e.g. ABC-030 PICAS1005 PV did not move with MV 0 -> 100 % in MANUAL) */
            const stn = anStationOf(S, g),
              so = stn && stn.amt && stn.amt.o;
            let cur = so && so[0] >= 0 ? so[0] : null;
            g._ao = cur;
            if (cur != null) {
              const seen = new Set();
              for (let k = 0; k < 6; k++) {
                const x = S.blk.find(
                  z => (z.k === 'AMT' || z.k === 'SW') && z.a === cur && z.b !== cur && !seen.has(z.id)
                );
                if (!x || !x.o || x.o[0] == null) break;
                seen.add(x.id);
                cur = x.o[0];
              }
              g._fo = cur;
            }
          } catch (e) {}
        }
        /* 2.0.0: a cascade master: the net after its station is the SV of the slave in ENGINEERING units (ABC-011 TICBR1140.MV =
           358.2 °C for 59.7 %), not a valve command in %: the model takes the output of the station then (before: the PV went
           to the top of its range, 600 °C, whatever the MV) */
        if (g._fo != null && isFinite(v[g._fo])) {
          const fv = v[g._fo],
            plo = g.p.lo == null ? 0 : g.p.lo,
            phi = g.p.hi == null ? 100 : g.p.hi;
          if (fv >= Math.min(plo, 0) - 10 && fv <= Math.max(phi, 100) + 10) return fv;
          if (g._ao != null && isFinite(v[g._ao])) return v[g._ao];
        }
        return t.out == null ? 0 : t.out;
      },
      uOf = g => uOfS(S, g);
    let u = (() => {
      /* two controllers on the same PV (valves in parallel, e.g. A and B side): the PV answers the average of their open commands (v1.20.58) */ const sh =
        b._sh || (b._sh = S.procs.filter(g => g !== b && g.proc && g.proc.mode === 'shared' && g.proc.pv === pr.pv));
      if (!sh.length) return uOf(b);
      /* 2.1.0-beta.6: two actuators IN SERIES on one fan (ABC-008: IDF hydraulic coupling PICFG108 and IDF inlet damper
           PICFG108A; the drawing selects one of them to control, HYDRAULIC / DAMPER CONTROL SELECT): the flow answers the
           product of the two openings (7.PNG: 46.1 % x 99.1 %), not their sum */
      if ([b].concat(sh).some(g => AN_SERIES[(g.txt || [])[1]]))
        return [b].concat(sh).reduce((a, g) => (a * Math.max(0, Math.min(100, uOf(g)))) / 100, 100);
      /* 1.22.0: valves in parallel on one header: their flows ADD (a stand-by valve at 0 adds nothing), up to the top of the
           command range. Before: the average of the open valves, so closing one of two open valves did not move the PV
           (ABC-030 PICAS1004 + PICAS1005) */
      const hi = b.p.hi == null ? 100 : b.p.hi;
      /* 2.1.0-beta.10: a valve on the same PV whose PID acts the other way (ACT) works against it (ABC-031: make-up valve
           LICCD1110A raises the hotwell level, dump valve LICCD1110B lowers it): its opening is subtracted, not added */
      const dir = g => (g.p.act < 0 === b.p.act < 0 ? 1 : -1);
      return Math.max(
        -hi,
        Math.min(
          hi,
          [uOf(b)].concat(sh.map(uOf)).reduce((a, x, i) => a + (i ? dir(sh[i - 1]) : 1) * Math.max(0, x), 0)
        )
      );
    })();
    const span = b.p.span > 0 ? b.p.span : 100,
      lo = b.p.rlo != null ? b.p.rlo : 0,
      um = ((b.p.lo == null ? 0 : b.p.lo) + (b.p.hi == null ? 100 : b.p.hi)) / 2;
    /* 2.2.0-beta.12 (M3, unit.js): pr.uf = the share of the command that reaches the process (0 = the machine behind the actuator is
       stopped: ABC-008 IDF, its openings move nothing) */
    if (pr.uf != null) u = u * pr.uf + (1 - pr.uf) * (b.p.lo == null ? 0 : b.p.lo);
    /* plant: steady state PV = bottom of the range + span * (0.5 + sign * K * (command - middle) / 100) + disturbance; dead time, then first order; it cannot leave the range of the instrument */
    /* 1.22.0: controllers of OTHER sheets on this measurement (pr.xsh, links.js procRemote): each one moves the PV in its own
       direction (ACT of its PID); the PV answers the average effect of this controller and of them (one controller: as before) */
    /* 2.2.0-beta.8 (A6, plant physics): the effects of the actuators on one measurement ADD (ABC-019 RH spray TICHR1002 cools,
       ABC-020 RH / SH flue gas damper TICHR1002A heats the same reheater outlet). Before: their AVERAGE, so each one moved the
       PV by half (spray 0 -> 100 % = -33 C instead of -67 C), and the anchor at the snapshot was taken with the damper of THAT
       moment, so a damper move was cancelled by the anchor in the steady state. Now the anchor is the snapshot command of every
       actuator (xa: AN_HMI_OP mv of the other controller, else its command now) */
    const xsl = (pr.xsh || []).filter(x => x.b.proc && x.b.proc.on && x.S.rt),
      xg = x => {
        const xp = x.b.proc,
          xlo = x.b.p.lo == null ? 0 : x.b.p.lo,
          xhi = x.b.p.hi == null ? 100 : x.b.p.hi,
          xum = (xlo + xhi) / 2,
          xs = x.b.p.act < 0 ? 1 : -1,
          h = pr.hop && AN_HMI_OP[(x.b.txt || [])[1]];
        let k = xp.K || 1;
        /* anchored measurement: the other actuator, from its snapshot command to either end (0 or 100 %), keeps the PV inside the
           range of the instrument, like the gain of the owner (Ka below). Before (K = 1): the RH / SH damper from 36 to 50 %
           raised the reheater outlet by 84 C, to the top of the range */
        if (h) {
          const up = (lo + span - pr.hop.pv) / span,
            dn = (pr.hop.pv - lo) / span,
            kd = Math.min(
              (xs > 0 ? up : dn) / Math.max(1e-6, (xhi - h.mv) / 100),
              (xs > 0 ? dn : up) / Math.max(1e-6, (h.mv - xlo) / 100)
            );
          k = Math.max(0.02, Math.min(k, 0.9 * kd));
        }
        return c => (xs * k * (c - xum)) / 100;
      },
      xe = xsl.map(x => xg(x)(uOfS(x.S, x.b))),
      xa = xsl.map(x => {
        const h = AN_HMI_OP[(x.b.txt || [])[1]];
        return xg(x)(h ? h.mv : uOfS(x.S, x.b));
      }),
      eff = (c, an) => (pr.sg * (pr.Ka || pr.K) * (c - um)) / 100 + (an ? xa : xe).reduce((a, x) => a + x, 0);
    /* 2.1.0-beta.6: "Start at 150 MW" (hmi-op.js) gave the PV of the snapshot transmitters (pr.hopReq): a loop without a static
       anchor is anchored NOW at (the command that goes to the valve now -> that PV), so the plant model keeps the snapshot
       value instead of its own steady state. Not for: a static anchor, the drum level (integrating), a flow loop whose valve is closed or whose flow is 0 on the snapshot. Reset removes it (anResetAll). */
    if (pr.hopReq) {
      const hr = pr.hopReq,
        tg = (b.txt || [])[1];
      pr.hopReq = null;
      if (
        !AN_HMI_OP[tg] &&
        tg !== 'LICBR1001' &&
        /* 2.1.0-beta.11: a measurement shared with controllers of other sheets too (ABC-001C PIC-COBM main steam pressure):
           the anchor offset is fixed once (pr.hop.anc below), so their effect on the PV still works */
        /* 2.1.0-beta.10: parallel valves on one PV too: the anchor is the sum of their commands now (ABC-031 LICCD1110A + B), but
           not when that sum is at the top of the command range (clamped: the model would have no slope left) */
        !(
          b._sh &&
          b._sh.length &&
          !b._sh.concat([b]).some(g => AN_SERIES[(g.txt || [])[1]]) &&
          (hr.mv != null ? hr.mv : u) >= (b.p.hi == null ? 100 : b.p.hi) - 0.5
        ) &&
        isFinite(hr.pv) &&
        isFinite(u) &&
        hr.pv >= lo &&
        hr.pv <= lo + span &&
        (b.p.lt !== 'flow' ||
          hr.pv - lo >
            0.02 *
              span) /* a flow at 0 with the valve open = an isolation valve is shut (oil burner out of service): not the control valve. 2.2.0-beta.7: a valve almost shut with flow through it is anchored too (15.PNG MCVFA1043D 1.7 % -> FIFA1043D 26.8 T/H; 28.png min-flow recirculation FCVCD1120 0.1 % with condensate flow FIQCD1120 380 T/H): see the gain below */
      ) {
        pr.hop = {
          mv: hr.mv != null ? hr.mv : u,
          pv: hr.pv,
          src: '150 MW load',
          dyn: 1
        }; /* the MV of the snapshot when known, else the command now */
        pr.Ka = undefined;
        delete pm[b.id];
        q = null;
      }
    }
    if (pr.hop === undefined || (pr.hop && pr.hop.dyn && pr.Ka === undefined)) {
      if (pr.hop === undefined) {
        const h = AN_HMI_OP[(b.txt || [])[1]];
        pr.hop = h && !xe.length && !(b._sh && b._sh.length) && h.pv >= lo && h.pv <= lo + span ? h : null;
      }
      /* the gain of an anchored loop is limited so that MV 0 ... 100 % keeps the PV inside the range of the instrument
         (ABC-019 TICHR1002: 541 °C at 79.4 % spray; with K = 1 the PV was 600 °C, the top, for any MV below 70 %) */
      if (pr.hop) {
        const plo = b.p.lo == null ? 0 : b.p.lo,
          phi = b.p.hi == null ? 100 : b.p.hi,
          up = ((lo + span - pr.hop.pv) / span) * 100,
          dn = ((pr.hop.pv - lo) / span) * 100,
          dl = Math.max(1e-6, pr.hop.mv - plo),
          dh = Math.max(1e-6, phi - pr.hop.mv),
          /* the side the PV goes to when the valve CLOSES (MV -> 0) must stay inside the range; the other side may saturate.
             A flow is proportional to the valve (MV 0 = no flow: ABC-010 FICFW1007 499 T/H at 56 % -> 0 T/H at 0 %) */
          kdn = pr.sg > 0 ? dn / dl : up / dl;
        void dh;
        /* 2.2.0-beta.7: a flow with its valve almost shut (< 2 %) is not made by that valve alone (28.png: 380 T/H of condensate
           with the min-flow recirculation valve at 0.1 %; the condensate pump and the deaerator level valve make it): the valve
           adds to the flow of the snapshot (offset, gain K), instead of a flow proportional to a 0.1 % opening */
        pr.Ka =
          b.p.lt === 'flow' ? (pr.hop.mv < 2 ? pr.K : Math.max(0.02, kdn)) : Math.max(0.02, Math.min(pr.K, 0.9 * kdn));
      }
    }
    const ss0 = (c, an) => lo + span * (0.5 + eff(c, an)),
      anc = pr.hop
        ? pr.hop.dyn
          ? pr.hop.anc != null
            ? pr.hop.anc
            : (pr.hop.anc = pr.hop.pv - ss0(pr.hop.mv))
          : pr.hop.pv - ss0(pr.hop.mv, true)
        : 0,
      /* 2.2.0-beta.11: pr.ld = load disturbance of the unit model (unit.js), units of the PV. 2.2.0-beta.12: pr.mul = 0 when the machine that
         makes the flow is stopped (no BFWP: no feedwater; fan stopped: no air), the PV is then the bottom of the range */
      ss = c => {
        let y = ss0(c) + anc + ((pr.dist || 0) / 100) * span + (pr.op || 0) + (pr.ld || 0);
        /* 2.2.0-beta.12: pr.fr = firing ratio of the unit model (steam made / steam flowing, 0 ~ 1) on a steam temperature: without firing the
           superheat is lost and the temperature goes to the saturation temperature pr.tsat of the drum (MFT), whatever the spray does */
        if (pr.fr != null && pr.tsat != null) y = pr.tsat + (y - pr.tsat) * pr.fr;
        /* 2.2.0-beta.14 (M4 cold start): pr.tcap = the gas temperature (bed) of the unit model: a superheater cannot give more than the
           gas, and the steam is never below saturation */
        if (pr.tcap != null) y = Math.max(pr.tsat != null ? pr.tsat : -1e9, Math.min(y, pr.tcap));
        /* 3.2.0-beta.14 (source.js): no medium = the bottom of the range (or the ambient); never above the pressure of the source */
        if (pr.smul != null) y = pr.smul * y + (1 - pr.smul) * (pr.sbase != null ? pr.sbase : lo);
        if (pr.scap != null) y = Math.min(y, Math.max(lo, pr.scap));
        /* not exactly the bottom: the SELECT CIRCUIT of the drawing reads 0 as a lost transmitter and holds its last value (user rule
           v1.20.34; ABC-030 aux steam stayed 10.1 kg/cm2 in a cold plant), as the unit model does for the first stage pressure */
        if (pr.src) y = Math.max(y, lo + 1e-3 * span);
        return pr.mul == null ? y : pr.mul * y + (1 - pr.mul) * lo;
      };
    if (pr.integ === undefined) {
      pr.integ = null;
      try {
        if (b.p.lt === 'level' && (b.txt || [])[1] === 'LICBR1001') {
          const fw = S.procs.find(x => (x.txt || [])[1] === 'FICFW1007'),
            s1 = AN.sheets.find(x => x.name === 'ABC-001C');
          /* the start-up feedwater valve FCVFW11302 (LICBR1001B) feeds the drum beside the main valve: its flow is added. Its size is
             not in the repository: 30 % of the feedwater range at 100 % open is ASSUMED (a typical start-up valve) */
          const su = S.procs.find(x => (x.txt || [])[1] === 'LICBR1001B'),
            fsp = fw && fw.p ? (fw.p.span > 0 ? fw.p.span : 550) : 550;
          if (fw && fw.proc && s1)
            pr.integ = {
              fw: fw.proc.pv,
              fwp: fw.proc,
              su,
              suK: 0.3 * fsp,
              sh1: s1,
              k: 0.02,
              ks: 10,
              tauS: 60
            }; /* about 0.36 mm/s for 20 T/H of imbalance (drum about 22 m2 of water surface) */
        }
      } catch (e) {}
    }
    /* 2.2.0-beta.3: pr.y0 (Start at 150 MW): the model starts from the PV of the snapshot, then follows the valve with its own
       time constant (before: from its steady state for the command of that moment, ABC-012 TICMS1004 482 C instead of 542 C) */
    if (!q) {
      q = pm[b.id] = { y: (pr.integ || pr.y0) && isFinite(v[pr.pv]) ? v[pr.pv] : ss(u), h: [], u: null };
      pr.y0 = 0;
    }
    /* 2.2.0-beta.1: the drawing gates the measurement: the PV comes through a T switch that now selects a constant
       (ABC-003A SI0070 = 0 while both SUPPLY OIL VALVEs of burner A are closed, M.3410). The plant does not fight the gate:
       a gated flow is 0 (isolation shut, oil burner out of service) and the model never pins the PV net over the logic */
    const gate = (() => {
      for (const d of S.drv[pr.pv] || []) {
        if (d.k !== 'SW' && d.k !== 'AMT') continue;
        const st = rt.st[d.id];
        if (!st || !st.pk) continue;
        const leg = st.pk === 'B' ? d.b : d.a;
        const c = leg >= 0 ? (S.drv[leg] || []).find(x => x.k === 'CONST') : null;
        if (c) return c.p && c.p.val === 0 ? 'zero' : 'const';
      }
      return false;
    })();
    if (gate && pr.mode === 'pin') {
      if (pf[pr.pv]) {
        delete F[pr.pv];
        delete pf[pr.pv];
      }
      continue;
    }
    /* 2.0.0: the DRUM LEVEL is an integrating process: the level rises when more feedwater goes in than steam goes out
       (dL/dt = k x (feedwater flow - main steam flow)). ABC-010: feedwater flow = PV of FICFW1007 (FT-FW1007, economizer inlet),
       steam flow = FT-MS1031 (STN101 AI0129, ABC-001C). Before: a first-order answer to the command of the 3-element master,
       so the level did not follow the water balance. */
    if (pr.integ && dt > 0) {
      const S1 = pr.integ.sh1.S;
      let fst = 0;
      if (S1) {
        if (pr.integ.ai == null) {
          const a = S1.blk.find(
            z => z.k === 'AI' && z.o && S1.lab[z.o[0]] && String(S1.lab[z.o[0]].t).trim() === 'AI0129'
          ); /* engine only: the label of the net, not the UI name */
          pr.integ.ai = a ? a.id : -1;
          /* 2.2.0-beta.3: the steam flow of the balance is the COMPENSATED flow of the drawing (SQRT of LN31(p) x LN32(T) x AI0129,
             the value on the screens), not the raw transmitter */
          pr.integ.cn = anCompNet(S1, 'AI0129');
          /* 2.2.0-beta.12: the drum pressure (AI0128) for the shrink / swell */
          const pd = S1.blk.find(
            z => z.k === 'AI' && z.o && S1.lab[z.o[0]] && String(S1.lab[z.o[0]].t).trim() === 'AI0128'
          );
          pr.integ.pd = pd ? pd.id : -1;
        }
        const st = pr.integ.ai >= 0 ? S1.rt.st[pr.integ.ai] : null;
        fst =
          pr.integ.cn >= 0 && isFinite(S1.rt.v[pr.integ.cn])
            ? +S1.rt.v[pr.integ.cn]
            : st
              ? (st.act != null ? +st.act : +st.val) || 0
              : 0;
      }
      let ffw = +v[pr.integ.fw] || 0;
      if (pr.integ.su)
        ffw +=
          (Math.max(0, Math.min(100, +uOf(pr.integ.su) || 0)) / 100) *
          pr.integ.suK *
          (pr.integ.fwp && pr.integ.fwp.mul != null
            ? pr.integ.fwp.mul
            : 1); /* 2.2.0-beta.12: no BFWP, no start-up flow */
      /* 2.1.0-beta.11: water that leaves the drum besides the main steam (blowdown and the rest), from "Start at 150 MW":
         03.png feedwater 499.1 - main steam 474.1 = 25.0 T/H (pr.integLoss, removed by Reset) */
      q.y = Math.max(lo, Math.min(lo + span, q.y + dt * pr.integ.k * (ffw - fst - (pr.integLoss || 0))));
      /* 2.2.0-beta.12 (M3): SHRINK / SWELL. A fast change of the drum pressure moves the level the other way for a while (the steam
         bubbles in the water collapse when the pressure rises after a turbine trip, grow when it falls after an MFT): the level
         read is the water level minus ks x (pressure - its lag of tauS), so a pressure step gives a transient of ks mm per
         kg/cm2 that fades in tauS (ASSUMED: ks 10 mm per kg/cm2, tauS 60 s; not in the repository) */
      if (S1 && pr.integ.pd >= 0) {
        const ps = S1.rt.st[pr.integ.pd],
          P = ps && isFinite(ps.val) ? +ps.val : NaN;
        if (isFinite(P)) {
          if (q.pl == null) q.pl = P;
          q.pl += ((P - q.pl) * dt) / pr.integ.tauS;
          q.sw = pr.integ.ks * (P - q.pl);
        }
      }
      q.h.length = 0;
    } else if (dt > 0 && pr.shold) {
      q.h.length = 0; /* 3.2.0-beta.14 (source.js): the pump that moves the water is stopped: the tank level stays */
    } else if (dt > 0 && pr.mul === 0) {
      q.y =
        lo; /* 2.2.0-beta.12: the machine that makes the flow stopped (no BFWP, fan stopped): the flow is gone at once, not with the lag of the valve */
      q.h.length = 0;
    } else if (dt > 0) {
      q.h.push([rt.t, u]);
      while (q.h.length > 2 && q.h[1][0] <= rt.t - pr.L) q.h.shift();
      const tgt = ss(q.h[0][1]);
      q.y += (1 - Math.exp(-dt / Math.max(pr.T, 0.05))) * (tgt - q.y);
      q.y = Math.max(lo, Math.min(lo + span, q.y));
    }
    if (gate === 'zero' && b.p.lt === 'flow') q.y = lo;
    if (dt <= 0 && q.u != null) continue;
    const y = pr.integ && q.sw ? Math.max(lo, Math.min(lo + span, q.y - q.sw)) : q.y;
    if (pr.mode === 'pin') {
      if (F[pr.pv] === undefined || pf[pr.pv]) {
        F[pr.pv] = y;
        pf[pr.pv] = 1;
      }
      continue;
    }
    /* where the plant writes: this sheet, or (v1.18.x) the sheet where the signal really starts (PV that comes through a circle from another sheet) */
    const R = pr.remote,
      T = R ? R.S : S,
      tr = T.rt,
      tv = tr.v,
      tF = tr.force,
      tpin = R ? R.pin : pr.pv,
      tai = R ? R.ai : pr.ai,
      taiOut = R ? R.aiOut : pr.aiOut,
      text = R ? R.ext : pr.mode === 'input' ? pr.pv : null;
    if (text != null) {
      if (!R && S.xlk && S.xlk[text] && tF[text] === undefined) continue;
      if (tF[text] === undefined) {
        tr.ext[text] = y;
        (tr.ev || (tr.ev = {}))[text] = y;
        if (R && F[pr.pv] === undefined) {
          rt.ext[pr.pv] = y;
          (rt.ev || (rt.ev = {}))[pr.pv] = y;
        }
      }
      continue;
    }
    /* transmitters: write the AI blocks of this measurement */
    const pinF = F[pr.pv] !== undefined || tF[tpin] !== undefined,
      aiF = taiOut.some(n => tF[n] !== undefined);
    let w;
    if (
      q.u != null &&
      tai.length &&
      tai.every(id => {
        const s_ = tr.st[id];
        return s_ && s_.bad;
      })
    ) {
      q.bad = 0;
      continue;
    }
    if (q.u == null) {
      w = y;
      q.g = 1;
      /* 2.2.0-beta.7: several transmitters of one measurement (ABC-002 O2 before the APH: AIFG1122 side A 6.4 %, AIFG1123 side B
         2.2 %, PV = their average 4.3 %, 7.PNG) keep their own reading around the model: each keeps its offset from their mean at
         the first write (0 after a Reset: they start equal) */
      if (tai.length > 1) {
        const vs = tai.map(id => tr.st[id] && +tr.st[id].val);
        if (vs.every(isFinite)) {
          const m = vs.reduce((a, b) => a + b, 0) / vs.length;
          q.off = {};
          tai.forEach((id, i) => (q.off[id] = vs[i] - m));
        }
      }
      /* 2.2.0-beta.3: the PV already equals the model (Start at 150 MW): keep the raw transmitter where it is. A compensated
         measurement (ABC-010 drum level: raw DP level -> pressure compensation) is not equal to its raw value; writing the PV
         into the raw AI made the compensated level jump 156 mm */
      {
        const p0 = tv[tpin],
          a0 = tai.length ? tr.st[tai[0]] : null;
        if (a0 && isFinite(p0) && Math.abs(y - p0) < 0.005 * span && isFinite(a0.val))
          w = q.off ? a0.val - q.off[tai[0]] : a0.val;
      }
      /* compensation inputs of the chain (pressure, temperature...) that are not driven: start at the middle of their range, not at the bottom (a chain divided by a compensation of 0 gives nothing) */ for (const id of (R
        ? R.allAI
        : pr.allAI) || []) {
        if (tai.includes(id)) continue;
        const a = T.blk.find(x => x.id === id),
          s_ = tr.st[id],
          r = a && a.rng;
        if (s_ && r && Math.abs(s_.val - r.lo) < 1e-9) {
          s_.val = s_.act = r.lo + 0.5 * (r.hi - r.lo);
        }
      }
    } else if (!pinF && !aiF) {
      const p = tv[tpin];
      if (q.up != null && Math.abs(q.u - q.up) > 1e-6 * span) {
        const gg = (p - q.pp) / (q.u - q.up);
        if (isFinite(gg) && Math.abs(gg) > 0.02 && Math.abs(gg) < 50) q.g = gg;
      }
      q.pp = p;
      q.up = q.u;
      w = q.u + (0.7 * (y - p)) / (q.g || 1);
    } else w = (q.up != null ? q.up : q.u) + (y - (q.pp != null ? q.pp : y)) / (q.g || 1);
    {
      let rl = 1e30,
        rh = -1e30;
      for (const id of tai) {
        const a = T.blk.find(x => x.id === id),
          r = a && a.rng;
        if (r) {
          rl = Math.min(rl, r.lo);
          rh = Math.max(rh, r.hi);
        }
      }
      if (rl < rh) {
        const hit = w < rl || w > rh;
        w = Math.max(rl, Math.min(rh, w));
        const p = tv[tpin];
        /* 3.2.0-beta.14: not while the source of the loop holds it at the bottom (source.js: no steam / water / oil): that is the plant,
           not a model that cannot reach its transmitter (before: ABC-030 aux steam fell to the "pin" mode in a cold plant and never
           came back to its 150 MW anchor, 4.5 instead of 10.2 kg/cm2) */
        q.bad = hit && !pinF && !aiF && !gate && !pr.src && Math.abs(y - p) > 0.05 * span ? (q.bad || 0) + 1 : 0;
        if (q.bad >= 30) {
          pr.mode = 'pin';
          pr.fell = 1;
          pr.ai = [];
          pr.aiOut = [];
          pr.remote = null;
          continue;
        }
      }
    }
    q.u = w;
    for (const id of tai) {
      const a = T.blk.find(x => x.id === id),
        s = tr.st[id];
      if (!a || !s) continue;
      const on_ = a.pins.filter(p => p.role === 'out').map(p => p.n);
      if (on_.some(n => tF[n] !== undefined)) continue;
      const r = a.rng,
        w1 = w + ((q.off && q.off[id]) || 0),
        x = r ? Math.max(r.lo, Math.min(r.hi, w1)) : w1;
      s.val = x;
      s.act = x;
    }
  }
}
/* 2.2.0-beta.1: coal feeder A / B / C (ABC-004A / B / C). The feedrate transmitter (MIF-CL1061-A / B / C = AI0480 / AI0512 / AI0544,
   0 ~ 40 T/H) is the PV of the MAN station FICCL1061x; the feeder delivers the demand that goes to its inverter
   (FICCL1061x.MV, T/H in the simulator) while it runs (M.0142 / M.0152 / M.0162, C/F RUNNING ON/OFF DELAY), and 0 when it is
   stopped. 11.png: SV 29.1 T/H, PV 29.0 / 29.1 / 28.9 T/H. Before: the feedrate stayed at its value, so the coal master
   (PV = sum of the three) never saw its own MV */
function anFeederStep(S) {
  /* 2.2.0-beta.9: a coal feeder sheet whose feeder is not found yet (its links not made yet) looks again at the next step */
  if (S.feed === undefined || (S.feed === null && S.feedTry !== undefined && S.feedTry++ < 50)) {
    S.feed = null;
    if (S.feedTry === undefined) S.feedTry = 0;
    if (/^ABC-004[ABC]$/.test(S.name)) {
      const m = S.blk.find(b => b.k === 'MAN' && /^FICCL1061[ABC]$/.test(b.tag || ''));
      const ai = m && (m.i || []).map(n => (S.drv[n] || []).find(x => x.k === 'AI')).find(Boolean);
      const lab = re => S.lab.findIndex((l, n) => l && re.test(String(l.t).trim()) && (S.drv[n] || []).length);
      const mv = m ? lab(new RegExp('^' + m.tag + '\\.MV$')) : -1,
        run = lab(/^M\.01[456]2$/);
      if (ai && mv >= 0 && run >= 0) S.feed = { ai: ai.id, mv, run, tag: m.tag };
    }
  }
  const f = S.feed;
  if (!f || !(AN.procDefault === true || (AN.procDefault === undefined && AN.plantOn === true))) return;
  const rt = S.rt,
    a = S.blk.find(x => x.id === f.ai),
    st = rt.st[f.ai];
  if (!a || !st || a.pins.some(p => p.role === 'out' && rt.force[p.n] !== undefined)) return;
  const r = a.rng || { lo: 0, hi: 40 },
    y = rt.v[f.run] > 0.5 ? +rt.v[f.mv] || 0 : r.lo;
  st.val = Math.max(r.lo, Math.min(r.hi, y));
  const T = S.plantT || (S.plantT = { ai: new Map(), ext: new Map() });
  T.ai.set(f.ai, f.tag);
}
/* a control that has a timer (TPS TPV TP TON TOF) or a flip-flop upstream: the HOLD of the switch is the drawing's own latch (BY DESIGN, user 2026-10-12 CLAUDE.md rule Q) */
function swTimer(S, b) {
  if (b._tl !== undefined) return b._tl;
  const TM = { TPS: 1, TPV: 1, TP: 1, TON: 1, TOF: 1, FF: 1 };
  const up = (n, d, seen) => {
    if (d > 8 || seen.has(n)) return false;
    seen.add(n);
    for (const g of S.drv[n] || []) {
      if (TM[g.k]) return true;
      if (g.k === 'LINK') continue;
      for (const i of g.i || []) if (up(i, d + 1, seen)) return true;
    }
    return false;
  };
  return (b._tl = (b.cs || []).some(c => up(c.n, 0, new Set())));
}
function anStep(S, dt) {
  const rt = S.rt,
    v = rt.v,
    nets = S.nets,
    B = x => (x > 0.5 ? 1 : 0);
  rt.t += dt;
  rt.k++;
  const MU = S.multi;
  if (S.kn) for (const k in S.kn) v[k] = S.kn[k];
  /* external values first */
  const F = rt.force,
    rmp = rt.ramp == null ? 0.05 : rt.ramp;
  if (S.procs === undefined) S.procs = anProcList(S);
  if (S.procs.length) anProcStep(S, dt);
  if (S.feed !== null) anFeederStep(S);
  /* analog values that the USER sets move toward the target like a real process (rmp = fraction of the range per second; 0 = jump) */
  const slew = (cur, tgt, span) => {
    if (cur == null || !isFinite(cur)) return tgt;
    if (rmp <= 0) return tgt;
    if (dt <= 0) return cur;
    const m = rmp * span * dt;
    return cur + Math.max(-m, Math.min(m, tgt - cur));
  };
  if (S.sfl === undefined) {
    S.sfl = [];
    for (const g of S.blk)
      if (g.k === 'SIGAB' && g.txt && g.txt[1])
        for (const n of S.ext) if (nets[n].dig && S.lab[n] && S.lab[n].t === g.txt[1]) S.sfl.push([g.id, n]);
  }
  for (const q of S.sfl) {
    const n = q[1];
    if (F[n] === undefined && !(S.xlk && S.xlk[n])) rt.ext[n] = rt.st[q[0]] && rt.st[q[0]].val > 0.5 ? 1 : 0;
  }
  for (const n of S.ext) {
    if (F[n] !== undefined) {
      v[n] = F[n];
      continue;
    }
    const t = rt.ext[n] || 0;
    if (nets[n].dig || (S.xlk && S.xlk[n])) {
      v[n] = t;
      continue;
    }
    const ev = rt.ev || (rt.ev = {});
    ev[n] = slew(ev[n], t, Math.max(100, Math.abs(t), Math.abs(ev[n] || 0)));
    v[n] = ev[n];
  }
  for (const k in S.pre || {}) {
    const pr = S.pre[k];
    if (S.ext.includes(+k) && F[+k] === undefined)
      for (const q of [pr].concat(pr.alt || []))
        if (q.eq === 0 ? v[q.c] < 0.5 : v[q.c] > 0.5) {
          v[+k] = q.src != null ? v[q.src] : q.val;
          /* 2.3.0-beta.2: a SET on the operator SV (COS) holds after the pulse, as the operator's own SV (ABC-003A "SET SV = 49 T/H") */
          if (q.src != null || q.hold) rt.ext[+k] = v[+k];
        }
  }
  const rd = n => (n >= 0 ? v[n] : 0);
  for (const b of S.ord) {
    if (b.k === 'LINK') {
      /* 2.3.0-beta.1: an AND link (ABC-004A "COAL FEEDER B & C ALL IN MANUAL" = FICCL1061B.MAN and FICCL1061C.MAN) */
      v[b.o[0]] =
        F[b.o[0]] !== undefined
          ? F[b.o[0]]
          : b.and
            ? +b.i.every(n => v[n] > 0.5)
            : v[b.i[0]] * (b.gain == null ? 1 : b.gain);
      continue;
    }
    const s = rt.st[b.id],
      P = b.p,
      out = x0 => {
        for (const n of b.o) {
          const x = S.aoN && S.aoN.has(n) && x0 === x0 ? Math.max(0, Math.min(100, x0)) : x0;
          if (MU[n]) {
            if (rt.stp[n] !== rt.k) {
              rt.stp[n] = rt.k;
              rt.acc[n] = x;
            } else if (x > rt.acc[n]) rt.acc[n] = x;
            v[n] = rt.acc[n];
          } else v[n] = x;
          const pr = S.pre && S.pre[n];
          if (pr)
            for (const q of [pr].concat(pr.alt || []))
              if (q.eq === 0 ? v[q.c] < 0.5 : v[q.c] > 0.5) v[n] = q.src != null ? v[q.src] : q.val;
        }
      };
    switch (b.k) {
      case 'AI': {
        const r = b.rng,
          sp = r ? Math.max(1e-9, r.hi - r.lo) : 100;
        if (b.fb) {
          const fs = rt.st[b.fb.id],
            pos = fs && fs.pos != null ? fs.pos : 0,
            lo = r ? r.lo : 0,
            hi = r ? r.hi : 100;
          s.val = lo + ((hi - lo) * pos) / 100;
          s.act = s.val;
        } else s.act = slew(s.act, s.val, sp);
        s.bad = b.sig && rt.st[b.sig.id] && rt.st[b.sig.id].val > 0.5 ? 1 : 0;
        out(s.bad ? (rt.st[b.sig.id].val > 1.5 ? (r ? r.hi : 100) : 0) : s.act);
        break;
      }
      case 'CONST':
        out(P.mt ? (P.th * P.orig) / 100 : P.val);
        break;
      case 'SIGAB':
        out(s.val > 0.5 ? 1 : 0);
        break;
      case 'MAN': {
        if (b.svI === undefined) {
          b.svI = -1;
          if (b.i)
            for (let j = 0; j < b.i.length; j++) {
              const dr = (S.drv[b.i[j]] || []).find(
                x => x.k === 'AMT' && x.sel >= 0 && /B\s*\/\s*T/.test((x.txt || []).join('/'))
              );
              if (dr) {
                b.svI = j;
                break;
              }
            }
          if (b.svI < 0 && b.i && b.i[2] != null && b.i[2] >= 0) b.svI = 2;
        }
        if (b.svI >= 0 && b.i[b.svI] != null && b.i[b.svI] >= 0) {
          const dr = (S.drv[b.i[b.svI]] || []).find(x => x.k === 'AMT');
          if (dr && rt.st[dr.id] && rt.st[dr.id].pk === 'A') s.val = rd(b.i[b.svI]);
          /* 2.2.0-beta.9: .MAN is the MODE STATUS of the station (textbook status word; CLAUDE.md 2): while its A / M switch of the
             drawing is on the operator leg (B = COS manual, A = AUTO-MV) because the drawing forces it (BU-CMD: ABC-001C M.2013 =
             NOT M.0101, main steam flow < 220 T/H), the station IS in MANUAL, and the drawing reads that status (ABC-001C "BOILER
             MASTER IN MANUAL  HIC-BM.MAN": the boiler pressure controller PIC-COBM tracks HIC-BM - feedforward, SI0224, so the
             return to AUTO is bumpless). Before, only a press on the faceplate set it: the boiler master came back to AUTO with a
             step of -11 % (36 -> 25 %), the main steam pressure fell to 89 kg/cm2 and the coal master was forced to manual at its
             top. Only the status this rule set is cleared by it (a MAN pressed by the operator stays) */
          if (dr && dr.sel != null && dr.sel >= 0 && !S.ext.includes(dr.sel) && rt.st[dr.id] && b.tag && AN.modeNets) {
            if (dr._cosB === undefined)
              dr._cosB = dr.b != null && /^COS manual/.test(AN.nm(S, dr.b) || '') && !(b.o || []).includes(dr.a);
            if (dr._cosB) {
              /* 2.2.0-beta.10 (user 2026-10-17, CLAUDE.md 10: BU-CMD = protection): the A / M switch knows its AUTO leg (A = AUTO-MV), so
                 the force-manual rule of the AMT holds it: MANUAL while the BU-CMD is 1 AND AFTER IT, until the operator selects AUTO
                 (PR-OPE-5002 "Put Boiler Master to Auto"). The operator's AUTO on a MAN station is the MAN status turned off (faceplate
                 MAN button); while the BU-CMD is still 1 the drawing keeps it MANUAL */
              const ast = rt.st[dr.id];
              if (ast.al === undefined) ast.al = 'A';
              const fm = ast.pk === 'B';
              /* only when every sheet is loaded: AN.modeNets loads the sheets, and loading a sheet inside a step ran its first
                 step before its links were made (ABC-004B / 004C coal feeders lost their feeder model, FIC feedrate stuck) */
              if (b._mn === undefined && AN.sheets.every(x => x.S || /^ABC-000/.test(x.name)))
                try {
                  b._mn = AN.modeNets(b.tag) || [];
                } catch (e) {
                  b._mn = [];
                }
              if (!b._mn) {
              } else if (fm && b._mn.length && !s.fmSet) {
                for (const [S2, n] of b._mn) if (S2.rt.force[n] === undefined) S2.rt.ext[n] = 1;
                s.fmSet = 1;
              } else if (fm && s.fmSet && ast.fman) {
                for (const [S2, n] of b._mn) if (S2.rt.force[n] === undefined) S2.rt.ext[n] = 1;
              } else if (fm && s.fmSet && b._mn.every(([S2, n]) => !(+S2.rt.ext[n] > 0.5))) {
                ast.fm = 'A'; /* the BU-CMD is gone and the operator turned MAN off: AUTO */
                s.fmSet = 0;
              } else if (!fm && s.fmSet) {
                for (const [S2, n] of b._mn) if (S2.rt.force[n] === undefined) S2.rt.ext[n] = 0;
                s.fmSet = 0;
              }
              /* the operator turned MAN on (faceplate MAN button, CLAUDE.md 2: .MAN is the mode): the A / M switch goes MANUAL too */
              else if (!fm && !s.fmSet && b._mn && b._mn.length && b._mn.some(([S2, n]) => +S2.rt.ext[n] > 0.5)) {
                ast.fm = 'B';
                s.fmSet = 1;
              }
            }
          }
        }
        if (s.trk != null) s.val = s.trk;
        /* 2.3.0-beta.2 (ABC-004A-1 ~ 004C-1): the MV high limit written on the drawing as an input "<tag>.MHD" (% of the station range:
           FICCL1061A.MHD = 83.3 % when M.3405 A / B / C ALL IN REMOTE AND RUNNING, else 100 %) limits the station output */
        if (b._mhd === undefined) b._mhd = (b.i || []).find(n => n >= 0 && S.lab[n] && String(S.lab[n].t).trim() === b.tag + '.MHD') ?? -1;
        const mhd = b._mhd >= 0 ? +v[b._mhd] : NaN,
          hiD = mhd > 0 && P.rhi > P.rlo ? Math.min(P.hi, P.rlo + (mhd / 100) * (P.rhi - P.rlo)) : P.hi;
        s.val = Math.max(P.lo, Math.min(hiD, s.val));
        out(s.val);
        break;
      }
      case 'PID':
      case 'PIDV': {
        /* v1.11.0: input = deviation e = SV - PV (EU). Reverse action (ACT:R, P.act<0): PV below SV -> output up. u = Kp*(es + I/Ti + Td*des/dt), es in % of span; clamped to [lo,hi], integral frozen / back-calculated at the limits; while the downstream selector is on another input the controller TRACKS it (bumpless) */
        const span = Math.max(1e-9, P.span || 100),
          pg =
            b._pgv !== undefined
              ? b._pgv
              : (b._pgv = (() => {
                  try {
                    const q = anPins(S, b);
                    return q && q.pvSg ? q.pvSg : null;
                  } catch (e) {
                    return null;
                  }
                })()),
          sg = pg == null ? (P.act < 0 ? 1 : -1) : (P.act < 0 ? -1 : 1) * pg,
          es = anGap(P, ((sg * anPidIn(S, b, s, v, dt)) / span) * 100),
          lo = P.lo,
          hi = P.hi,
          kp = P.kp == null ? 1 : P.kp;
        let u,
          Dt = 0;
        if (b.vel) {
          const e1 = s.ep == null ? es : s.ep;
          u = s.inited && dt > 0 ? kp * (es - e1 + (P.ti > 0 ? (es * dt) / P.ti : 0)) : 0;
          s.ep2 = e1;
          s.ep = es;
          s.out = u;
          s.es = es;
          s.pt = u;
          s.it = 0;
          s.dd = 0;
          s.inited = 1;
          out(u);
          break;
        }
        if (s.trk != null) {
          u = Math.max(lo, Math.min(hi, s.trk));
          s.I = u - kp * es;
        } else {
          if (s.inited && dt > 0) {
            if (P.ti > 0) {
              const sat = (s.out >= hi && es > 0) || (s.out <= lo && es < 0);
              if (!sat) s.I += ((kp * es) / P.ti) * dt;
            }
            if (P.td > 0) Dt = (kp * P.td * (es - (s.ep || 0))) / dt;
          }
          const pi = kp * es + s.I;
          if (pi > hi) s.I -= pi - hi;
          else if (pi < lo) s.I += lo - pi;
          /* v@@VERSION@@: the back-calculation uses the PI part only, so a derivative kick cannot wind the integral up in the wrong direction */ u =
            Math.max(lo, Math.min(hi, kp * es + s.I + Dt));
          /* dMVH: manipulated output variable change ratio upper limit (% of the MV range per sampling interval DTI, 1 s) */
          if (P.dmvh > 0 && s.inited && dt > 0 && s.out != null && isFinite(s.out)) {
            const lim = ((P.dmvh / 100) * (hi - lo) * dt) / (P.dti > 0 ? P.dti : 1);
            if (u > s.out + lim) u = s.out + lim;
            else if (u < s.out - lim) u = s.out - lim;
          }
        }
        s.ep = es;
        s.out = u;
        s.es = es;
        s.pt = kp * es;
        s.it = s.I;
        s.dd = Dt;
        s.inited = 1;
        out(u);
        break;
      }
      case 'SW':
      case 'AMT': {
        if (b.q4) {
          const q = b.q4;
          let k = -1;
          for (let i = 0; i < q.cond.length; i++) {
            /* 2.3.0-beta.2 (ABC-003E-1): the condition is a signal of the drawing (M.009A ~ D = REMOTE of FICDO1043A ~ D = its SV
               switch on the oil master leg), not a setting of the user */
            const sg = q.sig && q.sig[i];
            let on = P['c' + (i + 1)] > 0.5;
            if (sg) {
              const sh = AN.sheets.find(z => z.name === sg.sh),
                st = sh && sh.S && sh.S.rt && sh.S.rt.st[sg.blk];
              on = !!st && st.pk === sg.leg;
            }
            if (on) {
              k = i;
              break;
            }
          }
          if (k >= 0) s.q4k = k;
          const lg = q.cond[s.q4k == null ? 0 : s.q4k].leg;
          s.pk = lg.toUpperCase();
          s.q4l = lg;
          if (b.o.length) out(q.leg[lg] >= 0 ? rd(q.leg[lg]) : 0);
          break;
        }
        /* forced control (the user's FORCE ON / OFF during a test): the selection and the latch before the first force come back when the LAST force on any control of this switch is released */
        {
          const fn = [];
          if (b.sel >= 0) fn.push(b.sel);
          for (const c of b.cs || []) fn.push(c.n);
          const uf = fn.some(n => rt.force[n] !== undefined);
          if (uf && !s.uf) {
            s.uf = 1;
            s.fpk = s.pk === 'B' ? 'B' : 'A';
            s.flb = s.lb || 0;
          } else if (!uf && s.uf) {
            s.uf = 0;
            s.pk = s.fpk;
            s.lb = s.flb;
          }
        }
        const sel = b.sel >= 0 ? B(rd(b.sel)) : 0;
        let pickB = P.selA ? !sel : !!sel;
        if (b.latch) {
          if (pickB) s.lb = 1;
          else if (s.fm === 'A') s.lb = 0;
          pickB = !!s.lb;
        }
        if (b.cs && b.cs.length > 1) {
          const ua =
            !swTimer(S, b) &&
            b.cs.some(c => (rt.force[c.n] !== undefined || (S.ext && S.ext.includes(c.n))) && B(rd(c.n)));
          if (ua && !s.ub) {
            s.ub = 1;
            s.upk = s.pk === 'B' ? 'B' : 'A';
          } else if (!ua && s.ub) {
            s.ub = 0;
            s.pk = s.upk;
          }
        }
        let sigLeg = null; /* the leg that an ACTIVE select signal asks for (the drawing's 1:a / 1:b lines) */
        if (b.cs && b.cs.length > 1) {
          const wB = b.cs.some(c => !c.A && B(rd(c.n))),
            wA = b.cs.some(c => c.A && B(rd(c.n)));
          pickB = wB ? true : wA || b.k === 'SW' ? false : s.pk === 'B';
          sigLeg = wB ? 'B' : wA ? 'A' : null;
        } else if (b.sel >= 0 && sel) sigLeg = P.selA ? 'A' : 'B';
        /* FORCE MANUAL (user rule 2026-10-15): while an active select signal asks for the MANUAL leg, the operator's AUTO is refused; when the signal is gone the station STAYS manual until the operator presses AUTO (it does not go to AUTO by itself). s.al = the AUTO leg of an A/M station (anStationOf) */
        s.fman = 0;
        if (s.al && sigLeg) {
          /* an ACTIVE select signal of the drawing wins over the operator and the station KEEPS that leg afterwards (it does not go back by itself): 1:B (force manual) is a LEVEL: MANUAL while it is 1 and after it, until the operator presses AUTO; 1:A (AUTO of the logic) acts when it COMES (a pulse, e.g. M.019C); a 1:A that stays at 1 does not block the operator's MAN */
          if (sigLeg !== s.al) {
            s.fman = 1;
            s.fm = sigLeg;
            s.pa = 0;
          } else {
            if (!s.pa) s.fm = sigLeg;
            s.pa = 1;
          }
        } else s.pa = 0;
        /* REMOTE (user rule 2026-10-15): while the SV switch of this controller is on its REMOTE leg the station is AUTO and cannot be made manual (not even the SV); only a force-manual signal of the drawing can take it out */
        s.rem = 0;
        if (s.rmSw != null) {
          const q = rt.st[s.rmSw];
          if (s.fman && q) q.fm = 'B';
          /* force manual cancels REMOTE: the SV switch goes LOCAL and stays there until the operator selects REMOTE */ if (
            q &&
            q.pk === 'A' &&
            !s.fman
          ) {
            s.rem = 1;
            s.fm = s.al;
          }
        }
        if (s.fm === 'A') pickB = false;
        else if (s.fm === 'B') pickB = true;
        s.pk = pickB ? 'B' : 'A';
        let y;
        const n = pickB ? b.b : b.a;
        if (n >= 0) {
          y = rd(n);
          if (pickB && b.bg != null) y *= b.bg;
          if (!pickB && b.ag != null) y *= b.ag;
          if (b.ia && b.ia[n]) y = y * b.ia[n][0] + b.ia[n][1];
        } else y = s.hold != null ? s.hold : 0;
        if (!pickB || b.b >= 0) s.hold = y;
        s.y = y;
        /* bumpless transfer to MANUAL / LOCAL (v1.20.65): while the A leg is selected, the operator's COS (B leg: manual MV or the SV of the operator) follows the output, so the change-over to B continues from the last value (no jump) */
        if (
          !pickB &&
          b.cosB &&
          b.b >= 0 &&
          rt.force[b.b] === undefined &&
          S.ext &&
          S.ext.includes(b.b) &&
          isFinite(y)
        ) {
          rt.ext[b.b] = b.bg != null && b.bg !== 0 ? y / b.bg : y;
        }
        const other = pickB ? b.a : b.b;
        /* bumpless tracking: the PID / MAN that feeds the unselected A input follows the output */
        /* interlock tracking (legend: "INTERLOCK TRACKING FOR PID CONTROLLER & MANUAL CONTROL STATION"): a back-up value selected by a downstream selector is also tracked by the upstream A/M selector, its PID and its COS manual value */
        const bu = s.bu;
        if (b.trkFrom)
          for (const d of b.trkFrom) {
            const ds = rt.st[d.id];
            if (ds) ds.trk = bu != null ? bu : pickB ? y : s.tv != null ? s.tv : null;
          }
        if (b.trkSum)
          for (const tt of b.trkSum) {
            const ds = rt.st[tt.pid.id];
            if (ds) {
              const tg = bu != null ? bu : pickB ? y : s.tv != null ? s.tv : null;
              if (tg == null) ds.trk = null;
              else {
                let oth = 0;
                for (const q of tt.others) oth += q.sg * rd(q.n);
                ds.trk = (tg - oth) / tt.sg;
              }
            }
          }
        if (b.upA)
          for (const u of b.upA) {
            const us = rt.st[u.id];
            if (us) {
              us.bu = bu != null ? bu : pickB && b.buCmd ? y : null;
              /* bumpless through a chain of selectors: when a selector further down is on its manual / other leg, the selectors before it and the PID follow its output */ us.tv =
                pickB ? y : s.tv != null ? s.tv : null;
            }
          }
        /* 2.2.0-beta.12: the COS follows the back-up value for as long as the back-up is selected (legend: interlock tracking). Before: written
           once per change of the value, so a second back-up of the same value (ABC-008 IDF NOT RUNNING TPs -> MV 0, after the cold start had
           already written 0) left the manual value where it was and the IDF demand came back after the 2 s pulse */
        if (bu != null && b.b >= 0 && S.ext && S.ext.includes(b.b) && /B\s*\/\s*T/.test((b.txt || []).join('/'))) {
          s.bw = bu;
          rt.ext[b.b] = b.bg != null ? bu / b.bg : bu;
        } else if (bu == null) s.bw = null;
        out(b.og != null ? y * b.og : y);
        break;
      }
      case 'ADD':
      case 'SUM':
      case 'DEV':
      case 'SUB': {
        let y = 0;
        for (const q of b.ip) {
          let x = rd(q.n);
          if (q.ia) x = x * q.ia[0] + q.ia[1];
          y += q.sg * x;
        }
        out(y);
        break;
      }
      case 'MUL': {
        let y = 1;
        b.i.forEach((n, j) => {
          y *= rd(n) / (((b.nrm && b.nrm[j]) || 1) * ((b.scn && b.scn[j]) || 1));
        });
        if (b.gain != null) y *= b.gain;
        out(b.i.length ? y : 0);
        break;
      }
      case 'DIV': {
        const d = rd(b.de);
        if (Math.abs(d) < 1e-9) {
          s.bad = 1;
          out(s.good != null ? s.good : 0);
        } else {
          s.bad = 0;
          s.good = rd(b.nu) / d;
          if (b.oa) s.good = s.good * b.oa[0] + b.oa[1];
          out(s.good);
        }
        break;
      }
      case 'HLLIM': {
        let x = rd(b.main);
        if (b.lo >= 0) x = Math.max(x, rd(b.lo));
        if (b.hi >= 0) x = Math.min(x, rd(b.hi));
        out(x);
        break;
      }
      case 'ABS':
        out(Math.abs(rd(b.i[0])));
        break;
      case 'SQRT': {
        const x = rd(b.i[0]);
        if (x < 0) {
          s.bad = 1;
          out(0);
        } else {
          s.bad = 0;
          const R = b.rin || 100;
          out(b.idn ? x : R * Math.sqrt(x / R));
        }
        break;
      }
      case 'HS':
      case 'LLIM':
        if (b.cmp) {
          out(rd(b.cmpA) > rd(b.cmpB) ? 1 : 0);
          break;
        }
        out(b.i.length ? Math.max(...b.i.map(rd)) : 0);
        break;
      case 'LS':
      case 'HLIM':
        if (b.cmp) {
          out(rd(b.cmpA) < rd(b.cmpB) ? 1 : 0);
          break;
        }
        out(b.i.length ? Math.min(...b.i.map(rd)) : 0);
        break;
      case 'SEL': {
        /* AVERAGE SELECT CIRCUIT: average of the inputs whose transmitter is healthy (SIG.AB = 0); all bad: hold the last value */
        const all = b.i.map(rd),
          hk = all.map((x, k) => {
            const sid = b.sgi && b.sgi[k];
            const q = sid != null && rt.st[sid];
            return !(q && q.val > 0.5) && Math.abs(x) > 1e-9; /* zero = lost signal (user rule, SIG.AB) */
          }),
          ok = all.filter((_, k) => hk[k]);
        const md = P.mode || 'AVG',
          ki = md !== 'AVG' && b.mi ? b.mi[md] : null;
        let y;
        if (ki != null && hk[ki]) {
          y = all[ki];
          s.last = y;
          s.use = md;
        } else if (ok.length) {
          y = ok.reduce((p, q) => p + q, 0) / ok.length;
          s.last = y;
          s.use = ki != null ? 'AVG (the selected input is bad)' : 'AVG';
        } else {
          y = s.last != null ? s.last : all.length ? all.reduce((p, q) => p + q, 0) / all.length : 0;
          s.use = 'holds the last value (all inputs bad)';
        }
        s.nok = ok.length;
        out(y);
        break;
      }
      case 'SUMA': {
        const x = rd(b.i[0]);
        s.tot = (s.tot || 0) + (x * dt) / 3600;
        if (b.o.length) out(s.tot);
        break;
      }
      case 'SUMP': {
        const x = B(rd(b.i[0]));
        if (x && !s.prev) s.cnt = (s.cnt || 0) + (P.w || 1);
        s.prev = x;
        if (b.o.length) out(s.cnt || 0);
        break;
      }
      case 'PO': {
        const x = rd(b.i[0]);
        if (s.pos == null) {
          s.pos = x;
          s.ct = 0;
          s.pw = 0;
          s.pd = 0;
        }
        const cyc = P.cyc > 0 ? P.cyc : 2,
          sp = P.stroke > 0 ? P.stroke : 60,
          mn = P.minp >= 0 ? P.minp : 0.2,
          ups = 100 / sp;
        s.ct += dt;
        if (s.ct >= cyc) {
          s.ct -= cyc;
          const need = (x - s.pos) / ups;
          if (Math.abs(need) >= mn) {
            s.pd = need > 0 ? 1 : -1;
            s.pw = Math.min(Math.abs(need), cyc);
          } else {
            s.pd = 0;
            s.pw = 0;
          }
        }
        if (s.pd !== 0 && (x - s.pos) * s.pd <= 0) {
          s.pd = 0;
          s.pw = 0;
        }
        const on = s.pd !== 0 && s.ct < s.pw;
        s.up = on && s.pd > 0;
        s.dn = on && s.pd < 0;
        if (on) s.pos += s.pd * ups * dt;
        if (b.o.length) out(x);
        break;
      }
      case 'TP': {
        const dp = b.tpd >= 0 ? rd(b.tpd) : 0,
          tt = b.tpt >= 0 ? rd(b.tpt) : null;
        let y = dp;
        s.kt = 1;
        if (P.tref != null && tt != null) {
          s.kt = (tt + 273.15) / (P.tref + 273.15);
          y = s.kt > 0 ? dp / s.kt : dp;
        }
        if (b.o.length) out(y);
        break;
      }
      case 'IP':
      case 'AO':
      case 'FIELD':
      case 'ALM':
      case 'UNK': {
        if (b.k === 'IP' && b.posFb) {
          const t = Math.max(0, Math.min(100, rd(b.i[0])));
          if (s.pos == null) s.pos = t;
          const st = (100 / 30) * dt;
          s.pos += Math.max(-st, Math.min(st, t - s.pos));
        }
        if (b.o.length) out(rd(b.i[0]));
        break;
      }
      case 'FX': {
        let x = rd(b.i[0]);
        const q = b.fxin;
        if (q) {
          if (q.k === 'ratio') x = x * 100;
          else if (q.k === 'rng') x = ((x - q.lo) / (q.hi - q.lo)) * 100;
        }
        s.fxx = x;
        const r = anFXs(P, x);
        s.fxs = r.st === 'OK' && b.fxrev ? 'SCALE' : r.st;
        out(r.y);
        break;
      }
      case 'DRATE': {
        const x = rd(b.i[0]),
          H = (s.h = s.h || []);
        if (H.length && H[H.length - 1][0] === rt.t) H[H.length - 1][1] = x;
        else H.push([rt.t, x]);
        const W = P.win || 30;
        while (H.length > 2 && H[1][0] <= rt.t - W) H.shift();
        const o0 = H[0],
          dw = rt.t - o0[0];
        out(dw > 1e-6 ? ((o0[1] - x) / dw) * 60 : 0);
        break;
      }
      case 'LAG': {
        const x = rd(b.i[0]);
        if (s.y == null) s.y = x;
        s.y += (x - s.y) * (1 - Math.exp(-dt / Math.max(P.tau, 0.01)));
        out(s.y);
        break;
      }
      case 'RATE':
      case 'RAMPB': {
        if (b.tpar !== undefined) {
          const T = rd(b.tpar);
          P.rate = T > 0 && isFinite(T) ? b.span / (T * 0.036) : 1e-12;
        }
        if (b.main !== undefined) {
          const x = rd(b.main);
          if (s.y == null) s.y = x;
          if (b.byp >= 0 && B(rd(b.byp))) s.y = x;
          else {
            const fx = b.up === undefined,
              ru = fx ? P.rate : rd(b.up),
              rd_ = fx ? P.rate : rd(b.dn),
              d = x - s.y;
            s.rev = fx && !(P.rate > 0) ? 'NO RATE' : 0;
            const mu = ru > 0 ? ru * dt : Infinity,
              md = rd_ > 0 ? rd_ * dt : Infinity;
            s.y += d > 0 ? Math.min(d, mu) : -Math.min(-d, md);
          }
          out(s.y);
          break;
        }
        const x = rd(b.i[0]);
        if (s.y == null) s.y = x;
        const m = P.rate * dt;
        s.y += Math.max(-m, Math.min(m, x - s.y));
        out(s.y);
        break;
      }
      case 'HC':
      case 'LC':
      case 'HLC':
      case 'CMPK': {
        const x = rd(b.i[0]),
          sp = P.ref >= 0 ? rd(P.ref) : P.sp;
        out(P.op === '>' ? ((P.inc ? x >= sp : x > sp) ? 1 : 0) : (P.inc ? x <= sp : x < sp) ? 1 : 0);
        break;
      }
      case 'DCMP': {
        const x0 = rd(b.i[0]);
        for (const d of b.dc) {
          const x = d.neg ? -x0 : x0;
          v[d.n] = (d.op === '>' ? (d.inc ? x >= d.sp : x > d.sp) : d.inc ? x <= d.sp : x < d.sp) ? 1 : 0;
        }
        break;
      }
      case 'ACT':
      case 'VLV': {
        let x0 = rd(b.i[0]);
        if (b.k === 'VLV' && b.i.length && nets[b.i[0]].dig) x0 = x0 > 0.5 ? 100 : 0;
        const t = Math.max(0, Math.min(100, x0));
        if (s.pos == null) s.pos = t;
        const st = (100 / Math.max(P.stroke, 0.1)) * dt;
        s.pos += Math.max(-st, Math.min(st, t - s.pos));
        s.mv = Math.abs(t - s.pos) > 0.05;
        if (s.mv) s.dir = t > s.pos ? 1 : -1;
        if (b.o.length) out(s.pos);
        break;
      }
      case 'CTK': {
        /* conditional write (SET SIxxxx => TAG.SV IF ctl): while ctl = 1 it sends the input, when ctl = 0 it does NOT write (the last value stays) */
        if (B(rd(b.ctl))) s.cv = rd(b.cin);
        out(s.cv == null ? 0 : s.cv);
        break;
      }
      case 'PVSV':
        out(rd(b.pv) < rd(b.sv) ? 1 : 0);
        break;
      case 'NOT':
        out(B(rd(b.i[0])) ? 0 : 1);
        break;
      case 'AND':
        out(b.i.length && b.i.every(n => B(rd(n))) ? 1 : 0);
        break;
      case 'OR':
        out(b.i.some(n => B(rd(n))) ? 1 : 0);
        break;
      case 'FF': {
        const sv = B(rd(b.S)),
          rv = B(rd(b.Rn));
        if (rv) s.q = 0;
        else if (sv) s.q = 1;
        out(s.q);
        break;
      }
      case 'TON': {
        const x = B(rd(b.i[0]));
        if (x) {
          s.acc += dt;
          if (s.acc >= P.sec) s.out = 1;
        } else {
          s.acc = 0;
          s.out = 0;
        }
        out(s.out);
        break;
      }
      case 'TOF': {
        const x = B(rd(b.i[0]));
        if (x) {
          s.acc = 0;
          s.out = 1;
        } else if (s.out) {
          s.acc += dt;
          if (s.acc >= P.sec) {
            s.out = 0;
          }
        }
        out(s.out);
        break;
      }
      case 'TPV': {
        const x = b.sg >= 0 ? B(rd(b.sg)) : 0,
          T = b.xin >= 0 ? rd(b.xin) : 0;
        if (x && !s.prev && !s.run && !AN.steady) {
          s.run = 1;
          s.acc = 0;
        }
        if (s.run) {
          s.acc += dt;
          if (s.acc >= T) s.run = 0;
        }
        s.prev = x;
        s.out = s.run ? 1 : 0;
        out(s.out);
        break;
      }
      case 'TPS': {
        const x = B(rd(b.i[0]));
        /* 2.2.0-beta.7: not while "Start at 150 MW" loads the plant (AN.steady): the snapshot is a steady state, a signal that the load
           sets (ABC-050 I.0931 GCB 52G1 ON) closed long ago, so its pulse is over (before: a new "synchronization" pulse set ABC-052
           M.070F and the LP bypass went to its 33 % preset) */
        if (x && !s.prev && !s.run && !AN.steady) {
          s.run = 1;
          s.acc = 0;
        }
        if (s.run) {
          s.acc += dt;
          if (s.acc >= P.sec) {
            s.run = 0;
          }
        }
        s.prev = x;
        s.out = s.run ? 1 : 0;
        out(s.out);
        break;
      }
      default:
        if (b.o.length) out(rd(b.i[0]));
    }
    for (const n of b.o) if (F[n] !== undefined) v[n] = F[n];
  }
  return rt;
}
function anSettle(S, n) {
  for (let i = 0; i < (n || 6); i++) anStep(S, 0);
}
if (typeof module !== 'undefined')
  module.exports = {
    anRead,
    anExplode,
    anPtSeg,
    anBuild,
    anTimerCut,
    anNets,
    anTouch,
    anArrowAt,
    anDistPoly,
    anInPoly,
    anModel,
    anWire,
    anNum,
    anRange,
    anCompile,
    anInit,
    anFX,
    anFXs,
    anStep,
    anSettle,
    anProcList,
    anPins,
    anAddr
  };
