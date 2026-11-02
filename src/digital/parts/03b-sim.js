/* DITL (digital logic) - the simulation, no DOM (3.2.0 Web Worker, stage b): the models of a sheet (grpModel, fieldInModel, usrModel), the net solve of a sheet (simulate, simSheet) and the
   timers, motors, flow dampers, inverters and motor-operated valves (tmStep, motStep, fdStep, invStep, simIn, mvStep), moved as they
   were from 04-render.js and 05-overlay-interaction.js. Part of ONE script (joined by src/digital/order.list, in this order). */
/* v14 user test switch: pentagon ELECTRICAL TROUBLE (arrow pointing into the wire) is a field/relay signal that does not come from the DCS: give it a switch */
/* v17 address groups: left input rows that carry the SAME address are one signal. One row writes (the PB row if there is one, else the first), the others read it (a leading "-" reads it inverted). A PB that has readers is a mode selector (AUTO PB): press = toggle, the DCS keeps the state. */
function grpModel(sh, nl) {
  const AB = x => {
      const m = String(x).match(/[IOM]\.[0-9A-F]{4}/);
      return m ? m[0] : null;
    },
    G = {};
  sh.rows.forEach((r, i) => {
    if (!nl.src.some(z => z.row === i) || (nl.mir || []).some(m => m.row === i)) return;
    /* v28: a row that follows an internal signal / connector is never part of an address group */ const txt = LEFT.map(
      c => (sh.cells[i + ':' + c] || []).map(q => q.t)
    ).flat();
    const a = txt.map(AB).find(Boolean);
    if (!a || !LEFT.some(c => (sh.cells[i + ':' + c] || []).length)) return;
    const inv = txt.some(t => /^\s*-\s*[IOM]\./.test(t)),
      pb = txt.some(t => /(^|[^A-Z])P\.?\s?B\.?($|[^A-Z])|PUSH\s*-?\s*BUTTON/i.test(t));
    (G[a] = G[a] || []).push({ row: i, inv, pb, adr: a });
  });
  const res = [];
  for (const a in G) {
    const g = G[a];
    if (g.length < 2) continue;
    const m = g.find(x => x.pb && !x.inv) || g.find(x => !x.inv) || g[0];
    res.push({
      master: m.row,
      toggle: !!m.pb,
      adr: a,
      readers: g.filter(x => x !== m).map(x => ({ row: x.row, inv: x.inv }))
    });
  }
  return res;
}
function fieldInModel(sh, nl, exist) {
  const S1 = sh.rng.S[1],
    R0 = sh.rng.RS[0],
    all = [...sh.tx, ...Object.values(sh.cells).flat()],
    drv = new Set(),
    con = new Set(),
    res = [];
  nl.src.forEach(z => {
    if (LEFT.some(c => (sh.cells[z.row + ':' + c] || []).length)) drv.add(z.n);
  });
  nl.gates.forEach(g => {
    (g.out || []).forEach(n => drv.add(n));
    [...(g.ins || []), ...(g.s || []), ...(g.r || [])].forEach(n => con.add(n));
  });
  (nl.mot || []).forEach(m => drv.add(m.mir));
  (nl.ind || []).forEach(m => drv.add(m.n));
  (nl.mir || []).forEach(m => drv.add(m.n));
  (exist || []).forEach(u => drv.add(u.n));
  const mod = new Set();
  (nl.mv || []).forEach(b => b.fb.forEach(f => mod.add(f.row)));
  nl.outs.forEach(o => {
    if (!mod.has(o.row)) con.add(o.n);
  });
  const circ = sh.raw.ci.filter(c => c[2] > 1.8 && c[2] < 4.6);
  for (const n of con) {
    if (drv.has(n)) continue;
    const sg = nl.segs.filter(q => q.n === n);
    if (!sg.length) continue;
    const pts = [];
    sg.forEach(q => {
      pts.push([q.x1, q.y1]);
      pts.push([q.h ? q.x2 : q.x1, q.h ? q.y1 : q.y2]);
    });
    if (sg.some(q => q.x1 < S1 + 3)) continue;
    if (pts.some(p => circ.some(c => Math.hypot(p[0] - c[0], p[1] - c[1]) < c[2] + 3))) continue;
    const e = pts.reduce((a, p) => (p[0] < a[0] ? p : a), pts[0]);
    const tg = all
      .filter(
        q =>
          /^[A-Z]{1,4}\d{0,2}-[A-Z0-9]{2,}[A-Z0-9-]*$/.test(q.t.trim()) && /* 2.5.0-beta.11: BI10-DO1043-A (DITL-18 row 78) */
          q.x > e[0] - 62 &&
          q.x < e[0] + 10 &&
          q.y >= e[1] - 5 &&
          q.y <= e[1] + 9
      )
      .sort(
        (a, b) => Math.hypot(a.x - e[0], a.y - e[1]) - Math.hypot(b.x - e[0], b.y - e[1])
      )[0]; /* the field tag is written above the wire start (BI8-DO1043-A, MIA-CL1061-A2) */
    if (!tg) continue;
    res.push({ n, x: e[0] - 5, y: e[1], key: 'FI' + tg.t, label: tg.t, fin: 1, pent: [1e9, 1e9, 1e9, 1e9] });
  }
  return res;
}
function usrModel(sh, nl) {
  const res = [],
    S1 = sh.rng.S[1],
    R0 = sh.rng.RS[0],
    all = [...sh.tx, ...Object.values(sh.cells).flat()],
    T = all.filter(t => /^(ELECTRIC(AL)?(\s*TROUBLE)?|TROUBLE)$/i.test(t.t) && t.x > S1 && t.x < R0),
    used = new Set();
  /* v21: the pentagon ELECTRICAL TROUBLE is drawn as lines (or a polyline) with the text in one or two lines inside; its left tip is the end of the wire. Field / relay signal: gets a TEST SWITCH. */
  for (const t of T) {
    if (used.has(t)) continue;
    const grp = T.filter(q => !used.has(q) && Math.abs(q.x - t.x) < 16 && Math.abs(q.y - t.y) < 14);
    grp.forEach(q => used.add(q));
    const minX = Math.min(...grp.map(q => q.x)),
      maxX = Math.max(...grp.map(q => q.x)) + 20,
      my = grp.reduce((a, q) => a + q.y, 0) / grp.length;
    const sg = nl.segs
      .filter(q => q.h && q.x2 >= minX - 14 && q.x2 <= minX + 1 && Math.abs(q.y1 - my) < 8)
      .sort((a, b) => Math.abs(a.y1 - my) - Math.abs(b.y1 - my))[0];
    if (!sg) continue;
    res.push({
      n: sg.n,
      x: maxX + 4,
      y: sg.y1,
      key: 'ET' + Math.round(minX) + '_' + Math.round(sg.y1),
      label: 'ELECTRICAL TROUBLE',
      pent: [minX - 9, maxX, sg.y1 - 8, sg.y1 + 8]
    });
  }
  return res;
}
/* 2.5.0-beta.14: DCS registers shared by the sheets (bottom ash step SI0130); Simulate on / off and Reset clear them */
let DREG = {};
function simulate(nl, act) {
  /* v10: keeps the last state (seal-in / latch memory) and applies one net change per step, so cross interlocks (NOT of the other command) settle instead of flipping */
  const N = nl.n;
  let v = nl._v && nl._v.length === N ? nl._v.slice() : new Array(N).fill(0);
  const q0 = nl.gates.map(g => g.q);
  for (let it = 0; it < 4 * N + 60; it++) {
    const w = new Array(N).fill(0);
    (nl.fx || []).forEach(n => (w[n] = 1));
    (nl.one || []).forEach(n => (w[n] = 1)); /* 2.5.0-beta.11: DEFAULT "1" */
    (nl.ufx || []).forEach(n => (w[n] = 1));
    const MR = nl.mir || [];
    nl.src.forEach(s => {
      if (act.has(s.row) && !MR.some(m => m.row === s.row)) w[s.n] = 1;
    });
    MR.forEach(m => {
      if (m.neg ? !v[m.n] : v[m.n])
        nl.src.forEach(z => {
          if (z.row === m.row) w[z.n] = 1;
        });
    });
    (nl.ind || []).forEach(m => {
      if (act.has(m.row)) w[m.n] = 1;
    });
    /* 2.5.0-beta.14 bottom ash step register (SI0130): "STEP=n" outputs write it, "STEP≥n" inputs read it */
    if (nl.stepW) {
      nl.stepW.forEach(o => {
        if (v[o.n]) DREG[o.reg] = o.val;
      });
      nl.stepR.forEach(r => {
        const x = DREG[r.reg] || 0;
        if (r.op === '≥' ? x >= r.val : r.op === '≤' ? x <= r.val : x === r.val)
          nl.src.forEach(z => {
            if (z.row === r.row) w[z.n] = 1;
          });
      });
    }
    nl.gates.forEach((g, gi) => {
      const I = a => a.some(n => v[n]);
      let o = 0;
      if (g.t === 'AND') o = g.ins.length && g.ins.every(n => v[n]);
      else if (g.t === 'OR') o = I(g.ins);
      else if (g.t === 'NOT') o = g.ins.length && !I(g.ins);
      else if (g.t === 'CMP') {
        const val = n => {
            const a = (nl.an || []).find(x => x.net === n);
            return a && nl.avk && nl.avk[a.key] !== undefined ? nl.avk[a.key] : a ? a.def : 0;
          },
          v0 = val(g.ins[0]),
          sp = g.spNet !== undefined ? val(g.spNet) : g.sp;
        o = g.cmp === '>' ? (g.eq ? v0 >= sp : v0 > sp) : g.eq ? v0 <= sp : v0 < sp;
      } else if (g.t === 'TMR') o = g.st.out;
      else if (g.t === 'CNT') {
        /* 2.5.0-beta.12: sequence counter (sootblower DITL-80): RESET = N 0, the input 1 -> 0 = N + 1 (kept when the sheet settles) */
        const c = I(g.ins);
        /* 2.5.0-beta.14: the bottom ash COUNTER (+1, =4) counts on the input 0 -> 1 (g.up); its RESET acts on the next scan (BA-20:
           the count 4 = LAST CYCLE OVER -> AUTOMATIC STOP -> RESET; the same scan would cancel the 4 before anyone sees it) */
        g.rq = I(g.r);
        g.Nn = (g.up ? g.rp : g.rq) ? 0 : (g.up ? !g.pin && c : g.pin && !c) ? Math.min(g.N + 1, Math.max(...g.ks)) : g.N;
        g.cin = c;
        g.out.forEach((n, j) => {
          if (g.ks[j] === g.Nn) w[n] = 1;
        });
        return;
      } else {
        const s = I(g.s),
          r = I(g.r);
        if (g.spri) {
          if (s) g.q = 1;
          else if (r) g.q = 0;
        } else if (r) g.q = 0;
        else if (s) g.q = 1;
        o = g.q;
      }
      if (o) g.out.forEach(n => (w[n] = 1));
    });
    const d = [];
    for (let n = 0; n < N; n++) if (w[n] !== v[n]) d.push(n);
    if (!d.length) break;
    const src = new Set(nl.src.map(z => z.n));
    const pick = d.find(n => src.has(n));
    if (pick !== undefined) d.filter(n => src.has(n)).forEach(n => (v[n] = w[n]));
    else v[d[0]] = w[d[0]];
  }
  nl.gates.forEach(g => {
    if (g.t === 'CNT' && g.Nn !== undefined) {
      g.N = g.Nn;
      g.pin = g.cin;
      g.rp = g.rq;
    }
  });
  nl._v = v;
  return v;
}
/* one sheet in simulate mode: active input rows, net values and active output rows (1.22.0: taken out of render so the
   drawing and the one world, src/world/world.js, compute the SAME thing) */
/* 2.2.0-beta.3: the analog values of the sheet: what the user typed, over the 150 MW values of the HMI snapshots (s.av150,
   src/world/ditl150.js; kept apart so they are never saved as the user's own values) */
function avOf(s) {
  /* 2.3.0-beta.1: s.avw = an analog value that the one world brings from the ABC (DITL-79 row 6 TICMS1022.MV of ABC-051) */
  if (s.avw) return { ...(s.av150 || {}), ...(s.av || {}), ...s.avw };
  return s.av150 ? { ...s.av150, ...(s.av || {}) } : s.av || null;
}
function xconPeer(s, c) {
  if (c.pk !== undefined) return c.pk;
  const me = (/DITL-?\s*([0-9]{1,3}[A-Z]?)\s*$/i.exec(s.name) || [])[1],
    sh = S.sheets[ditlIdx(c.peer, s)];
  let r = null;
  if (sh && me) {
    if (!sh.nl) sh.nl = netlist(sh);
    const pc = ((sh.nl && sh.nl.xcon) || []).find(o => o.dir === 'out' && o.num === c.num && o.peer === me.toUpperCase());
    if (pc) r = { sh, c: pc };
  }
  return (c.pk = r);
}
function simSheet(s) {
  s.nl.ufx = (s.nl.usr || []).filter(u => s.usw && s.usw[u.key]).map(u => u.n);
  /* 2.5.0-beta.11 (DITL PDF audit): off-sheet connector "(n) FROM DITL-xx" = the net of connector (n) "TO DITL-<this>" on that sheet
     (its last computed value; the one world runs every sheet, alone the other sheet keeps its last state) */
  for (const c of s.nl.xcon || []) {
    if (c.dir !== 'in') continue;
    const P = xconPeer(s, c),
      v = P && P.sh.nl && P.sh.nl._v;
    if (v && v[P.c.n]) s.nl.ufx.push(c.n);
  }
  /* 2.2.0-beta.3: the falling-edge mark on a NORMALLY CLOSED contact (DITL-03F rows 25 / 26 BOILER EMERGENCY TRIP P.B.(1) / (2)
     (N.C.) -> OR -> NOT -> BOILER EMERGENCY TRIP P.B. ON (OPC)) is the contact itself (closed = 1 while nobody presses it):
     read as a 2 s pulse, the trip was ON at rest and the MFT could never be reset. As a level, the trip is ON when both
     buttons are pressed. The falling pulse of a normal push button (LOCAL STOP P.B.) is unchanged */
  if (!s.nl._nc) {
    s.nl._nc = 1;
    for (const g of s.nl.gates)
      if (g.t === 'TMR' && g.k === 'npulse')
        g.nc = s.nl.src.some(z => g.ins.includes(z.n) && /N\.\s*C\./i.test((s.cells[z.row + ':S'] || []).map(x => x.t).join(' ')));
    /* 2.5.0-beta.11 (DITL PDF audit, DITL-22 / 24 / 30 / 31 / 111 / 112): the LOCAL STOP P.B. mark that feeds the MCC seal-in
       (stop -> AND(NOT remote) -> AND(start OR running) = motor run) is the normally closed contact of the button: 1 at rest, 0 while
       pressed, so the local start holds until stop is pressed. As a 2 s falling pulse it was 0 at rest and the pump could never run in
       LOCAL. Where the same mark goes to the RESET of a flip-flop (DITL-61A / 76 / 77) it stays a falling pulse */
    const into = n => s.nl.gates.filter(h => h.t === 'AND' && (h.ins || []).includes(n));
    for (const g of s.nl.gates)
      if (g.t === 'TMR' && g.k === 'npulse' && !g.nc)
        g.ncp = g.out.some(n => into(n).some(a => a.out.some(m => into(m).length)));
  }
  const rowOn = simIn(s),
    v = simulate(s.nl, rowOn),
    outOn = new Set();
  s.nl.outs.forEach(o => {
    if (v[o.n]) outOn.add(o.row);
  });
  mvOut(s, rowOn).forEach((x, row) => {
    if (x) {
      outOn.add(row);
      s.nl.outs.forEach(o => {
        if (o.row === row) v[o.n] = 1;
      });
    } else outOn.delete(row);
  });
  /* 2.5.0-beta.14: not a bottom ash indicator sheet (BA-72). 3.2.0-beta.23: not a field I/O sheet either (DITL-16 / 17: the input
     rows are the DCS commands to the solenoids, the output rows the limit switches of the device; row 21 OPEN BURNER A OIL VALVE (1)
     lit output row 21 VALVE (1) CLOSED, so the oil valves read closed while open and the burner had no oil) */
  if (!s.nl.gates.length && !s.ba && !(s.nl.usr || []).length && !(s.nl.mv || []).length) rowOn.forEach(i => outOn.add(i));
  return { rowOn, v, outOn };
}
/* ---------- timers ---------- */
const UN = { MS: 0.001, SEC: 1, MIN: 60, HR: 3600 },
  UT = { MS: 'MS', SEC: 'SEC.', MIN: 'MIN.', HR: 'HR.' };
let TSP = 1;
const tick = { t: 0 };
function unorm(s) {
  const u = s.replace(/[.\s]/g, '').toUpperCase();
  return u === 'MS'
    ? 'MS'
    : /^S(EC(OND)?)?S?$/.test(u)
      ? 'SEC'
      : /^M(IN(UTE)?)?S?$/.test(u)
        ? 'MIN'
        : /^H(R|OUR)?S?$/.test(u)
          ? 'HR'
          : null;
}
function tmGet(m) {
  let v = NaN,
    u = null;
  if (m.nt && m.nt === m.ut) {
    const x = /^(\d+(?:\.\d+)?)\s*([A-Za-z.]+)$/.exec(m.nt.t);
    if (x) {
      v = +x[1];
      u = unorm(x[2]);
    }
  } else {
    if (m.nt) v = +m.nt.t;
    if (m.ut) u = unorm(m.ut.t);
  }
  if (!isFinite(v) && m.fv) return m.fv;
  return { v: isFinite(v) ? v : 5, u: u || 'SEC' };
}
function tmSet(m, v, u) {
  const t = UT[u];
  if (!m.nt) {
    m.fv = { v, u };
    return;
  }
  if (m.nt === m.ut) m.nt.t = v + ' ' + t;
  else {
    m.nt.t = String(v);
    if (m.ut) m.ut.t = t;
  }
}
const tmSecs = m => {
  const p = tmGet(m);
  return p.v * UN[p.u];
};
/* 3.2.0-beta.23: a short timer counting, a valve / device moving or a motor changing in this scan: the one world takes small steps of
   time while it lasts (src/world/world.js), so a sequence of seconds (burner light-off) is not jumped over at x300 */
let TMBUSY = false;
function tmStep(g, inp, dt) {
  const st = g.st,
    P = tmSecs(g.tm),
    was = st.out;
  if (P > 0 && P <= 30 && ((g.k === 'on' && inp && st.acc < P) || (g.k === 'off' && !inp && st.out) || st.run)) TMBUSY = true;
  if (g.k === 'on') {
    if (inp) {
      st.acc = Math.min(st.acc + dt, P);
      st.out = st.acc >= P ? 1 : 0;
    } else {
      st.acc = 0;
      st.out = 0;
    }
  } else if (g.k === 'off') {
    if (inp) {
      st.out = 1;
      st.acc = 0;
    } else if (st.out) {
      st.acc += dt;
      if (st.acc >= P) {
        st.out = 0;
        st.acc = 0;
      }
    }
  } else if (g.k === 'flash') {
    /* 2.5.0-beta.14 bottom ash flasher: ON / OFF while the input is 1 */
    if (inp) {
      st.acc = (st.acc + dt) % (g.fl[0] + g.fl[1]);
      st.out = st.acc < g.fl[0] ? 1 : 0;
    } else {
      st.acc = 0;
      st.out = 0;
    }
  } else if (g.nc) {
    st.out = inp ? 1 : 0;
  } else if (g.ncp) {
    st.out = inp ? 0 : 1; /* 2.5.0-beta.11: N.C. stop button of an MCC seal-in: open (0) only while pressed */
  } else {
    const trg = g.k === 'npulse' ? !inp && st.pre : inp && !st.pre;
    /* 3.2.0-beta.23: a pulse is 1 for at least the scan that starts it (a fast simulation steps 60 s in one scan: a 2 s pulse began
       and ended inside it and the start command never came, Training at x300) */
    const now = trg && !st.run;
    if (now) {
      st.run = 1;
      st.acc = 0;
    }
    if (st.run && !now) {
      st.acc += dt;
      if (st.acc >= P) {
        st.run = 0;
        st.acc = 0;
      }
    }
    st.out = st.run ? 1 : 0;
  }
  st.pre = inp ? 1 : 0;
  return st.out !== was;
}
/* v9 MOV runtime: valve position 0..100 %, starts CLOSED. OPEN command -> runs to 100 %, CLOSE -> runs to 0 % (sealed in, so a pulse command is enough).
 Both commands = stop. Trip (MIT input ON) = motor stops. LOCAL (MIL off) = DCS commands ignored. ZSO = 100 %, ZSC = 0 %; a left input with the same address follows it. */
let MST = {},
  MS = {};
function motRT(s) {
  const mt = (s.nl && s.nl.mot) || [];
  let r = MS[s.name];
  if (!r || r.length !== mt.length) r = MS[s.name] = mt.map(() => ({ run: 0, acc: 0 }));
  return r;
}
function mtDelay(s) {
  const v = s.mtd && +s.mtd;
  return v > 0 ? v : 0.5;
} /* contactor / drive feedback delay, 0.5 s (editable): a push button held ~0.6 s must be able to seal in through the running feedback */
function motStep(s, v, dt) {
  const mt = (s.nl && s.nl.mot) || [];
  if (!mt.length) return false;
  const r = motRT(s),
    md = mtDelay(s);
  let ch = false;
  mt.forEach((m, j) => {
    /* 3.2.0 retest #34: a field trip of the motor (the protection relay, a Training fault from the dock: s._ftrip) stops it at once and
       holds it stopped until the field resets the relay; a new START is needed after that */
    if (s._ftrip) {
      if (r[j].run) ch = true;
      r[j].run = 0;
      r[j].tgt = 0;
      r[j].acc = 0;
      r[j].pm = !!v[m.mor];
      return;
    }
    const t = !!v[m.mor],
      sp = m.mos >= 0 && !!v[m.mos],
      x = r[j];
    if (m.mos >= 0) {
      if (t && !x.pm) {
        x.tgt = 1;
        x.acc = 0;
      }
      if (sp && !x.ps) {
        x.tgt = 0;
        x.acc = 0;
      }
      x.pm = t;
      x.ps = sp;
      if (x.tgt === undefined) x.tgt = 0;
      if (!!x.tgt !== !!x.run) {
        x.acc += dt;
        if (x.acc >= md) {
          x.run = x.tgt;
          x.acc = 0;
          ch = true;
        }
      } else x.acc = 0;
    } else if (t !== !!x.run) {
      x.acc += dt;
      if (x.acc >= md) {
        x.run = t ? 1 : 0;
        x.acc = 0;
        ch = true;
      }
    } else x.acc = 0;
  });
  s.nl.fx = mt.filter((m, j) => r[j].run).map(m => m.mir);
  return ch;
}
/* 3.2.0-beta.23 FIELD DEVICES of the burner I/O sheets: the limit switches and flame scanner contacts drawn there as field contacts
   (the small circles, s.usw) follow the DCS command like the real device. DITL-16: burner gun double solenoid SVR / SVE-DO1043-A5
   (row 2 RETRACT, row 4 INSERT -> ZSR / ZSE-A5), igniter single solenoid SVR-DO1043-A4 (row 6 INSERT -> ZSE / ZSR-A4), oil valve (2)
   SV-DO1043-A2 (row 23 -> ZSO / ZSC-A2; valve (1) is the SV block of the sheet). DITL-18: igniter transformer O.0090 (row 24) ->
   BI8 IGNITER IN OPERATION; BI9 FLAME DETECTOR ON = oil flows (both oil valves OPENED, DITL-16 of the same burner) and the igniter
   sparks or the flame is already on; BI10 FLAME DETECTOR READY at rest. Burner B / C / D = the machine instances of the one world.
   A contact is written only when the device moves, so a contact the operator toggles by hand stays until the next command */
const FD = {
  'DITL-16': [
    { on: 3, off: 1, e: 'FIZSE-DO1043-A5', r: 'FIZSR-DO1043-A5', t: 10 },
    { hold: 5, e: 'FIZSE-DO1043-A4', r: 'FIZSR-DO1043-A4', t: 5 },
    { hold: 22, e: 'FIZSO-DO1043-A2', r: 'FIZSC-DO1043-A2', t: 3 }
  ],
  'DITL-18': [{ hold: 23, e: 'FIBI8-DO1043-A', t: 1 }, { flame: 1, e: 'FIBI9-DO1043-A', t: 2 }, { rest: 1, e: 'FIBI10-DO1043-A' }],
  /* 3.2.0 retest #53: the debris filter panels (LCP) of DITL-39. REMOTE AUTO START P.B. M.0790 (row 8, pulse TR390 -> O.0281 DOR-DF1001)
     starts the SWP outlet filter system 1 at its panel; REMOTE AUTO STOP P.B. M.0791 (row 10) stops it; the panel answers I.0095
     DIR-DF1001 "SWP OUTLET DEBRIS FILTER IN OPERATION". It runs only with a seawater pump running (output row 1 ANY SEAWATER PUMP
     RUNNING M.079C, the COOLING WATER ON FEEDBACK O.0280 to the panel). System 2 (SWBP outlet): M.0792 row 19 / M.0793 row 21 ->
     I.0415 DIR-DF1002. Before: nothing answered the command, the filter stayed STOPPED */
  'DITL-39': [
    { on: 7, off: 9, req: 0, e: 'FIDIR-DF1001', t: 0 },
    { on: 18, off: 20, e: 'FIDIR-DF1002', t: 0 }
  ]
};
function fdSheet(s, code) {
  const k = (s._inst && s._inst.k) || 0;
  const t = S.sheets.find(x => new RegExp('\\)' + code + '$').test(x.name));
  if (!t || k === 0 || !window.WORLD || !WORLD.instOf) return t;
  const L = WORLD.instOf.get(t);
  return (L && L[k]) || null;
}
function fdStep(s, dt) {
  const b = (s._inst && s._inst.base) || s,
    m = /(DITL-\d+[A-Z]?)$/.exec(b.name),
    L = m && FD[m[1]];
  if (!L) return false;
  s.usw = s.usw || {};
  const act = simIn(s),
    st = (s._fd = s._fd || {});
  let ch = false;
  L.forEach((d, j) => {
    const x = (st[j] = st[j] || { pos: d.rest ? 1 : 0, init: 0 });
    let want = x.pos;
    if (d.on != null) {
      if (act.has(d.on) && !act.has(d.off)) want = 1;
      else if (act.has(d.off) && !act.has(d.on)) want = 0;
      /* a permissive output row of this sheet (DITL-39 row 1 ANY SEAWATER PUMP RUNNING) */
      if (d.req != null) {
        const o = window.WORLD && WORLD.out && WORLD.out[s.name];
        if (!(o && o.has(d.req))) want = 0;
      }
    } else if (d.hold != null) want = act.has(d.hold) ? 1 : 0;
    else if (d.flame) {
      const v16 = fdSheet(s, 'DITL-16'),
        o = v16 && window.WORLD && WORLD.out && WORLD.out[v16.name],
        oil = !!(o && o.has(21) && o.has(23)),
        ign = !!(st[0] && st[0].pos >= 1);
      want = oil && (ign || x.pos >= 1) ? 1 : 0;
    }
    if (d.rest) want = 1;
    const tgt = want ? 1 : 0;
    if (tgt !== x.pos) {
      TMBUSY = true;
      x.acc = (x.acc || 0) + dt;
      if (x.acc >= (d.t || 0) || !x.init) {
        x.pos = tgt;
        x.acc = 0;
      }
    } else x.acc = 0;
    const se = x.pos >= 1,
      sr = x.pos <= 0;
    if (!x.init || x.se !== se) {
      s.usw[d.e] = se;
      if (d.r) s.usw[d.r] = sr;
      x.se = se;
      ch = true;
    }
    x.init = 1;
  });
  return ch;
}
/* 3.2.0 R9 #79: the INVERTER PANEL of a drive drawn as a box on the sheet (DITL-43 AIR PREHEATER INVERTER PANEL): the DCS sends
   CSC-FA1052M1-1 START COMMAND (net into the box, AND of the START P.B. pulse, NOT TRIP and NOT LOCAL) and CSO-FA1052M1-1 STOP
   COMMAND (STOP P.B., or running with the speed LOW and LOW LOW after the delays); the panel answers YS-FA1052M1 I.0650 RUNNING
   (input row 10) and the speed switches SAL / SALL-FA1052 I.0653 / I.0654 SPEED NOT LOW / NOT L.L. (rows 12, 13). The panel holds the
   drive running until a STOP COMMAND or a trip (I.0651 NOT TRIP = 0, a field trip). Before: nothing answered the START COMMAND (no
   MOR / MIR label on this sheet), the air preheater stayed STOPPED */
const INV = { 'DITL-43': { st: 'START COMMAND', sp: 'STOP COMMAND', run: 9, spd: [11, 12], ok: 4, t: 2 } };
function invNets(s) {
  if (s.nl._inv) return s.nl._inv;
  const all = [...s.tx, ...Object.values(s.cells).flat()],
    net = w => {
      const t = all.find(q => q.t === w);
      if (!t) return -1;
      const g = s.nl.segs
        .filter(q => q.h && q.x2 >= t.x - 2 && q.x2 <= t.x + 12 && q.y1 > t.y && q.y1 - t.y <= 8)
        .sort((a, b) => a.y1 - b.y1)[0];
      return g ? g.n : -1;
    };
  const b = (s._inst && s._inst.base) || s,
    d = INV[/(DITL-\d+[A-Z]?)$/.exec(b.name)[1]];
  return (s.nl._inv = { st: net(d.st), sp: net(d.sp) });
}
function invStep(s, v, dt) {
  const b = (s._inst && s._inst.base) || s,
    m = /(DITL-\d+[A-Z]?)$/.exec(b.name),
    d = m && INV[m[1]];
  if (!d || !s.nl) return false;
  const N = invNets(s);
  if (N.st < 0) return false;
  s.sig = s.sig || {};
  const F = (s._fd = s._fd || {}),
    x = (F.inv = F.inv || { run: s.sig[d.run + ':S'] ? 1 : 0, acc: 0 });
  let tgt = x.tgt == null ? x.run : x.tgt;
  if (v[N.st] && !(N.sp >= 0 && v[N.sp])) tgt = 1;
  if (N.sp >= 0 && v[N.sp]) tgt = 0;
  const trip = s._ftrip || !s.sig[d.ok + ':S'];
  if (trip) tgt = 0;
  x.tgt = tgt;
  let ch = false;
  if (tgt !== x.run) {
    TMBUSY = true;
    x.acc += dt;
    if (x.acc >= d.t || trip) {
      x.run = tgt;
      x.acc = 0;
      s.sig[d.run + ':S'] = !!tgt;
      d.spd.forEach(r => (s.sig[r + ':S'] = !!tgt));
      ch = true;
    }
  } else x.acc = 0;
  return ch;
}
function motTxt(s) {
  const mt = s.nl.mot || [],
    r = motRT(s);
  return mt
    .map(
      (m, j) =>
        'MOT ' +
        m.tag +
        ': ' +
        (r[j].run ? 'RUNNING' : 'STOPPED') +
        ((m.mos < 0 && !!r[j].run !== !!simulate(s.nl, simIn(s))[m.mor]) || (m.mos >= 0 && !!r[j].tgt !== !!r[j].run)
          ? ' (changing…)'
          : '')
    )
    .join(' | ');
}
function mvRT(s) {
  const mv = (s.nl && s.nl.mv) || [];
  let r = MST[s.name];
  if (!r || r.length !== mv.length)
    r = MST[s.name] = mv.map(b => ({ pos: b.sv && b.dir === 'close' ? 100 : 0, run: 0, lr: 1, tq: 0 }));
  return r;
}
function mvTr(s, j) {
  const v = s.mvt && +s.mvt[j];
  return v > 0 ? v : s.nl.mv[j] && s.nl.mv[j].sv ? 3 : 10;
}
function mvForced(s) {
  const F = new Map(),
    mv = (s.nl && s.nl.mv) || [];
  if (!mv.length) return F;
  const rt = mvRT(s);
  mv.forEach((b, j) =>
    b.fb.forEach(f => {
      if ((f.ty === 'ZSO' || f.ty === 'ZSC') && f.mir >= 0)
        F.set(f.mir, f.ty === 'ZSO' ? rt[j].pos >= 100 : rt[j].pos <= 0);
    })
  );
  return F;
}
function grpState(s) {
  const m = new Map(),
    /* one world (2.2.0-beta.6): the master row can be fed by another sheet (FROM column); a reader that has its own FROM link follows that link */
    W = window.WORLD && WORLD.live && s._win,
    D = W && WORLD.idx && WORLD.idx.din.get(s);
  ((s.nl && s.nl.grp) || []).forEach(g => {
    const v = !!s.sig[g.master + ':S'] || !!(W && s._win.has(g.master));
    g.readers.forEach(r => {
      if (!(D && D.has(r.row))) m.set(r.row, r.inv ? !v : v);
    });
  });
  return m;
}
/* simulate mode: the DITL Simulate button, or the one world (ABC + DITL, src/world/world.js) while it runs */
/* 2026-11-01 (user "Ge ayusin pre", 150 MW: PAF / SAF / IDF STOPPED in the logic, M.3302 / 3303 / 3304 = 0): the ABC PAUSED is the
   simulation with its time stopped, not a plant with its wires cut. A read while paused (the alarm scan, a faceplate, an HMI page:
   DUI.outVal -> simSheet) evaluated the latches without the inputs from the other sheets (_win): DITL-27A saw "IDF RUNNING" = 0 and
   its SAF latch was reset, at RUN the PAF followed (DITL-26A row 18 SAF STOPPED -> TR120 -> reset). The one world with its links keeps
   its inputs while the ABC page is paused too */
function simOn() {
  return SIM || !!(window.WORLD && (WORLD.live || (WORLD.on && WORLD.idx && window.AN && AN.cat === 'an')));
}
function simIn(s) {
  const sim = simOn(),
    on = new Set(),
    F = sim ? mvForced(s) : new Map(),
    GR = sim ? grpState(s) : new Map();
  /* one world: input rows driven by another DITL sheet (FROM column, e.g. 28A-77) or by the ABC (TO DITL) */
  if (sim && s._win) s._win.forEach(i => on.add(i));
  /* 3.2.0-beta.23: a normally closed push button (DITL-03F rows 25 / 26 BOILER EMERGENCY TRIP P.B.(1) / (2) (N.C.); the LCP contacts
     "NOT OFF P.B." / "NOT LOCAL STOP P.B." of DITL-09 rows 18 / 22 and DITL-21A row 25) is closed (1) while nobody presses it: a cold
     start had it 0 = pressed, the trip / OFF was ON for ever (the MFT could never be reset, a burner never lit). A press (or the
     operator's hand value) sets it 0 */
  if (!s._ncRows) {
    s._ncRows = [];
    for (let i = 0; i < (s.rows || []).length; i++) {
      const t = (s.cells[i + ':S'] || []).map(x => x.t).join(' ');
      if ((/N\.\s*C\./i.test(t) || /\bNOT\b.*\b(OFF|STOP)\b/i.test(t)) && /P\.\s*B|PUSH/i.test(t)) s._ncRows.push(i);
    }
  }
  for (const i of s._ncRows) if (s.sig[i + ':S'] === undefined) s.sig[i + ':S'] = true;
  for (const k in s.sig)
    if (s.sig[k] && k.split(':')[1] === 'S') {
      const i = +k.split(':')[0];
      if (!F.has(i) && !GR.has(i)) on.add(i);
    }
  GR.forEach((v, i) => {
    if (v) on.add(i);
  });
  F.forEach((v, i) => {
    if (v) on.add(i);
  });
  if (sim && s.nl && s.nl.mv && s.nl.mv.length) {
    const rt = mvRT(s);
    s.nl.mv.forEach((b, j) => {
      if (rt[j].tq)
        b.fb.forEach(f => {
          if (f.ty === 'TS' && f.mir >= 0) on.add(f.mir);
        });
    });
  }
  return on;
}
function mvOut(s, act) {
  const M = new Map(),
    mv = (s.nl && s.nl.mv) || [];
  if (!mv.length) return M;
  const rt = mvRT(s);
  mv.forEach((b, j) => {
    const r = rt[j];
    b.fb.forEach(f => {
      let v = 0;
      if (f.ty === 'ZSO') v = r.pos >= 100;
      else if (f.ty === 'ZSC') v = r.pos <= 0;
      else if (f.ty === 'MIL') v = f.mir >= 0 ? act.has(f.mir) : !!r.lr;
      else if (f.ty === 'MIT') v = f.mir >= 0 && act.has(f.mir);
      else if (f.ty === 'TS') v = (f.mir >= 0 && act.has(f.mir)) || r.tq;
      M.set(f.row, v ? 1 : 0);
    });
  });
  return M;
}
function mvFlags(s, j, act) {
  const b = s.nl.mv[j],
    r = mvRT(s)[j],
    mil = b.fb.find(f => f.ty === 'MIL');
  return {
    rem: !mil || (mil.mir >= 0 ? act.has(mil.mir) : !!r.lr),
    trip: b.fb.some(f => f.ty === 'MIT' && f.mir >= 0 && act.has(f.mir))
  };
}
function mvStep(s, v, dt) {
  const mv = (s.nl && s.nl.mv) || [];
  if (!mv.length) return false;
  const rt = mvRT(s),
    act = simIn(s);
  let ch = false;
  mv.forEach((b, j) => {
    const r = rt[j],
      o = !!(b.open && b.open.n >= 0 && v[b.open.n]),
      c = !!(b.close && b.close.n >= 0 && v[b.close.n]),
      { rem, trip } = mvFlags(s, j, act),
      st = x => (x >= 100 ? 2 : x <= 0 ? 0 : 1),
      s0 = st(r.pos),
      run0 = r.run;
    if (b.sv) {
      const cmd = b.inv ? !o : o,
        wantOpen = b.dir === 'close' ? !cmd : cmd;
      if (!r.init) {
        r.init = 1;
        r.pos = wantOpen ? 100 : 0;
      }
      r.run = wantOpen ? (r.pos < 100 ? 1 : 0) : r.pos > 0 ? -1 : 0;
    } else if (trip) r.run = 0;
    else if (rem) {
      if (o && c) r.run = 0;
      else if (o && r.pos < 100) r.run = 1;
      else if (c && r.pos > 0) r.run = -1;
    }
    if (r.run) TMBUSY = true;
    r.pos = Math.max(0, Math.min(100, r.pos + (r.run * dt * 100) / mvTr(s, j)));
    if ((r.run > 0 && r.pos >= 100) || (r.run < 0 && r.pos <= 0)) r.run = 0;
    const tq0 = r.tq;
    r.tq =
      !b.sv && ((r.pos <= 0 && c && !o) || (r.pos >= 100 && o && !c))
        ? 1
        : 0; /* v12b: torque switch (TS) trips when the valve is at the end and the motor is still commanded (seats the valve, breaks the seal-in) */
    if (st(r.pos) !== s0 || r.run !== run0 || r.tq !== tq0) ch = true;
  });
  return ch;
}
/* the analog input rows, comparators, locked rows and timer kinds (from 07-app-events.js and 05-overlay-interaction.js) */
const isAn = (s, i) =>
  !!(
    s.nl &&
    s.nl.anRows &&
    s.nl.anRows.has(i)
  ); /* v26: row that feeds only limit comparators = analog input (numeric value, not a switch) */
const anVal = (s, a) => {
  const v = avOf(s);
  return v && v[a.key] !== undefined ? v[a.key] : a.def;
};
const anValN = (s, n) => {
  const a = (s.nl.an || []).find(x => x.net === n);
  return a ? anVal(s, a) : 0;
};
const cmpOn = (s, g) => {
  const v = anValN(s, g.ins[0]),
    sp = g.spNet !== undefined ? anValN(s, g.spNet) : g.sp;
  return g.cmp === '>' ? (g.eq ? v >= sp : v > sp) : g.eq ? v <= sp : v < sp;
};
const cmpTxt = g =>
  (g.cmp === '>' ? 'High ' : 'Low ') +
  g.cmp +
  (g.eq ? '=' : '') +
  ' ' +
  (g.spNet !== undefined ? g.spVar : g.sp) +
  (g.unit || '');
const lockd = (s, i) =>
  mvForced(s).has(i) ||
  (s.nl.mir || []).some(m => m.row === i) ||
  grpState(s).has(i); /* v10: the input of a row = its SERVICE cell, only rows that a wire reaches */
const KN = { on: 'ON DELAY', off: 'OFF DELAY', pulse: 'PULSE', npulse: 'PULSE (falling)', flash: 'FLASHER' };
/* SIMULATE on / off (the bmode button, 07-app-events.js) and Reset: the DITL states start again (3.2.0 Web Worker: no DOM, the engine
   runs it too) */
function ditlStates() {
  DREG = {};
  MST = {};
  MS = {};
  S.sheets.forEach(x => {
    /* 3.2.0 retest #28 #16 (beta.45 check: the field action "SWP-A REMOTE" done while the Training was PAUSED was lost at the first
       RUN, START SWP-A stayed blocked): entering RUN keeps the inputs set before it (the field contacts of the Training); leaving RUN
       (VIEW, and the Reset button = leave + enter) clears them as before */
    if (!SIM) x.sig = {};
    x.usw = {};
    x._fd = null;
    if (x.nl) {
      x.nl._v = null;
      x.nl.fx = [];
      x.nl.ufx = [];
    }
    ((x.nl && x.nl.gates) || []).forEach(g => {
      if (g.t === 'FF') g.q = 0;
      if (g.t === 'CNT') g.N = g.pin = g.rp = 0;
      if (g.t === 'TMR') g.st = { acc: 0, out: 0, pre: 0, run: 0 };
    });
  });
  tick.t = 0;
  /* 2.2.0-beta.3: after "Start at 150 MW" the DITL starts again in the 150 MW state (src/world/ditl150.js) */
  try {
    if (SIM && window.DITL150 && DITL150.on) DITL150.apply();
  } catch (e) {}
}
