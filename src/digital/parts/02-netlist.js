/* DITL (digital logic) - Netlist of one sheet: wires, blocks, pins, nets (netlistCore). Part of ONE script (joined by src/digital/order.list, in this order). */
function netlistCore(sh, strict) {
  const r = sh.raw,
    S1 = sh.rng.S[1],
    R0 = sh.rng.RS[0],
    H = [],
    V = [],
    bars = [],
    dots = [],
    E = 0.4;
  const fr = [],
    plk = {};
  for (const c in sh.rng) fr.push(sh.rng[c][0], sh.rng[c][1]);
  r.ln.forEach((q, k) => {
    const [a, b, c, d, l] = q;
    if (
      l !== 'CON' ||
      (Math.hypot(a - c, b - d) > 130 && Math.abs(a - c) < 0.05 && fr.some(x => Math.abs(x - a) < 0.5))
    )
      return;
    if (Math.hypot(a - c, b - d) < 0.5) return; /* v21 / v27: zero-length or 0.4 long drawing noise (DITL-83, 102) */
    const dx = Math.abs(a - c),
      dy = Math.abs(b - d),
      ln = Math.hypot(dx, dy),
      sk = Math.min(dx, dy),
      isO =
        sk < 0.05 ||
        (sk < 0.25 &&
          sk / ln <
            0.02); /* v24: a wire drawn 0.06-0.2 off the grid over a long run is still a straight wire (DITL-06 reset bus 0.1 over 235; 03F, 03H, 17, 21E) */
    if (isO && dy < dx) H.push({ k, x1: Math.min(a, c), x2: Math.max(a, c), y: (b + d) / 2 });
    else if (isO) V.push({ k, x: (a + c) / 2, y1: Math.min(b, d), y2: Math.max(b, d) });
  });
  const addH = (k, a, b, y) => {
      if (Math.abs(b - a) > 0.05) H.push({ k, x1: Math.min(a, b), x2: Math.max(a, b), y });
    },
    addV = (k, x, a, b) => {
      if (Math.abs(b - a) > 0.05) V.push({ k, x, y1: Math.min(a, b), y2: Math.max(a, b) });
    };
  const tabT = sh.tx.filter(t => /^TIMER SETTING$/i.test(t.t)),
    tabB = []; /* v18: the TIMER SETTING table frame (CON layer lines) is not a wire */
  tabT.forEach(t => {
    const c = r.pl
      .filter(([p, cl]) => cl && p.length >= 4)
      .map(([p]) => {
        const xs = p.map(q => q[0]),
          ys = p.map(q => q[1]);
        return { x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) };
      })
      .filter(b => t.x >= b.x1 - 0.5 && t.x <= b.x2 + 0.5 && t.y >= b.y1 - 0.5 && t.y <= b.y2 + 0.5)
      .sort((a, b) => (b.x2 - b.x1) * (b.y2 - b.y1) - (a.x2 - a.x1) * (a.y2 - a.y1))[0];
    if (c) {
      tabB.push(c);
      return;
    }
    const ls = r.ln.filter(q => Math.abs(q[0] - t.x) < 40 && Math.abs(q[1] - t.y) < 35);
    if (ls.length > 3) {
      const xs = ls.flatMap(q => [q[0], q[2]]),
        ys = ls.flatMap(q => [q[1], q[3]]);
      tabB.push({ x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) });
    }
  });
  const inTab = (x, y) => tabB.some(b => x >= b.x1 - 0.4 && x <= b.x2 + 0.4 && y >= b.y1 - 0.4 && y <= b.y2 + 0.4);
  const fbx = sh.tx.filter(t => /^COMM\.?$|^SV-/.test(t.t)),
    fbr =
      []; /* v9: a big closed rectangle around OPEN/CLOSE COMM. text = MOV function block outline (any layer), not a wire */
  r.pl.forEach(([p], k) => {
    if (p.length < 4 || !fbx.length) return;
    const xs = p.map(q => q[0]),
      ys = p.map(q => q[1]),
      b = { k, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    if (b.x1 - b.x0 > 15 && b.y1 - b.y0 > 15 && fbx.some(t => t.x > b.x0 && t.x < b.x1 && t.y > b.y0 && t.y < b.y1))
      fbr.push(b);
  });
  /* 2.5.0-beta.11 (DITL PDF audit): the small box of a limit comparator "H/" or "/L" (legend DITL-00) drawn on the CON layer is the
     symbol, not a wire: its sides joined the wire before and after the box, so the comparator had the same net on both sides and was
     dropped (DITL-23A, 23B, 25B, 26B, 27B, 28B, 29B, 31, 43, 55, 86, 87, 111, 112: the analog row passed as a plain bit) */
  const cmpT = [...sh.tx, ...Object.values(sh.cells || {}).flat()].filter(t => /^(H\/|\/L|H\/L|HH\/|\/LL)$/.test(t.t)),
    cmpBox = new Set();
  if (cmpT.length)
    r.pl.forEach(([p], k) => {
      if (p.length < 4 || p.length > 5) return;
      const xs = p.map(q => q[0]),
        ys = p.map(q => q[1]),
        x0 = Math.min(...xs),
        x1 = Math.max(...xs),
        y0 = Math.min(...ys),
        y1 = Math.max(...ys);
      if (x1 - x0 < 2 || x1 - x0 > 9 || y1 - y0 < 2 || y1 - y0 > 7) return;
      if (cmpT.some(t => t.x > x0 - 0.3 && t.x < x1 + 0.3 && t.y > y0 - 0.6 && t.y < y1 + 0.6)) cmpBox.add(k);
    });
  r.pl.forEach(([p, c, l, w], k) => {
    if (l !== 'CON' || fbr.some(b => b.k === k) || cmpBox.has(k)) return;
    if (p.length === 2) {
      const [a, b] = p,
        len = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (len < 1.5) {
        dots.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
        return;
      }
      if (Math.abs(a[0] - b[0]) < 0.05 && (w === undefined || w > 0)) {
        bars.push({ k, x: a[0], y1: Math.min(a[1], b[1]), y2: Math.max(a[1], b[1]) });
        return;
      }
    }
    const m = p.length + (c && p.length > 2 ? 1 : 0);
    plk[k] = [];
    for (let q = 0; q + 1 < m; q++) {
      const A = p[q],
        B = p[(q + 1) % p.length],
        kk = 'p' + k + '_' + q;
      plk[k].push(kk);
      {
        const dx = Math.abs(A[0] - B[0]),
          dy = Math.abs(A[1] - B[1]),
          ln = Math.hypot(dx, dy),
          sk = Math.min(dx, dy);
        if (sk < 0.05 || (sk < 0.25 && sk / ln < 0.02)) {
          if (dy < dx) addH(kk, A[0], B[0], (A[1] + B[1]) / 2);
          else addV(kk, (A[0] + B[0]) / 2, A[1], B[1]);
        }
      }
    }
  });
  /* v23: dash-dot (CEN) lines that are connected to the wiring are WIRES too (analog PV wires TT-/AI- running from an input row to the H/ and /L comparators, DITL-03F, 03H, 23A, 44). Box outlines, row separators and field boxes are closed loops / very long lines and stay out. */
  /* v25: the dash-dot frame of the input / output cell columns (a vertical line ON the cell edge x=S1 or x=R0, or a horizontal line that crosses the cell edge) is NOT a wire: it merged all input rows of DITL-09 into one net */
  const isEdge = q => {
    const v = Math.abs(q[0] - q[2]) < 0.3,
      h = Math.abs(q[1] - q[3]) < 0.3;
    if (v) return Math.abs(q[0] - S1) < 1.6 || Math.abs(q[0] - R0) < 1.6;
    if (h) {
      const a = Math.min(q[0], q[2]),
        b = Math.max(q[0], q[2]);
      return (a < S1 - 2 && b > S1 - 3) || (a < R0 + 2 && b > R0 + 3 && a < R0 - 3) || a < S1 - 2 || b > R0 + 2;
    }
    return false;
  };
  {
    const C = [];
    r.ln.forEach((q, k) => {
      if (q[4] !== 'CEN') return;
      const ort = Math.abs(q[0] - q[2]) < 0.05 || Math.abs(q[1] - q[3]) < 0.05,
        len = Math.hypot(q[0] - q[2], q[1] - q[3]);
      if (!ort || len < 0.8 || len > 150) return;
      const x = (q[0] + q[2]) / 2;
      if (x < S1 - 6 || x > R0 + 6) return;
      if (isEdge(q)) return;
      C.push({ k, q });
    });
    r.pl.forEach(([p, c, l], k) => {
      if (l !== 'CEN' || p.length < 2) return;
      const m = p.length + (c && p.length > 2 ? 1 : 0);
      for (let i = 0; i + 1 < m; i++) {
        const A = p[i],
          B = p[(i + 1) % p.length],
          ort = Math.abs(A[0] - B[0]) < 0.05 || Math.abs(A[1] - B[1]) < 0.05,
          len = Math.hypot(A[0] - B[0], A[1] - B[1]),
          x = (A[0] + B[0]) / 2;
        if (!ort || len < 0.8 || len > 150 || x < S1 - 6 || x > R0 + 6) continue;
        if (isEdge([A[0], A[1], B[0], B[1]])) continue;
        C.push({ k: 'p' + k + '_' + i, pk: k, q: [A[0], A[1], B[0], B[1]] });
      }
    });
    if (C.length) {
      const P = C.map((_, i) => i),
        f = i => (P[i] === i ? i : (P[i] = f(P[i]))),
        near = (a, b) =>
          [
            [a.q[0], a.q[1]],
            [a.q[2], a.q[3]]
          ].some(p =>
            [
              [b.q[0], b.q[1]],
              [b.q[2], b.q[3]]
            ].some(o => Math.hypot(p[0] - o[0], p[1] - o[1]) < 0.45)
          ) ||
          [
            [a.q[0], a.q[1]],
            [a.q[2], a.q[3]]
          ].some(p => onL(p[0], p[1], b.q)) ||
          [
            [b.q[0], b.q[1]],
            [b.q[2], b.q[3]]
          ].some(p => onL(p[0], p[1], a.q)),
        onL = (x, y, q) =>
          x >= Math.min(q[0], q[2]) - 0.35 &&
          x <= Math.max(q[0], q[2]) + 0.35 &&
          y >= Math.min(q[1], q[3]) - 0.35 &&
          y <= Math.max(q[1], q[3]) + 0.35;
      C.forEach((a, i) =>
        C.forEach((b, j) => {
          if (j > i && near(a, b)) P[f(i)] = f(j);
        })
      );
      const conL = [...H.map(h => [h.x1, h.y, h.x2, h.y]), ...V.map(v => [v.x, v.y1, v.x, v.y2])],
        gp = {};
      C.forEach((c, i) => (gp[f(i)] = gp[f(i)] || []).push(c));
      for (const g of Object.values(gp)) {
        const pts = [];
        g.forEach(c => {
          pts.push([c.q[0], c.q[1]], [c.q[2], c.q[3]]);
        });
        const free = pts.filter(p => pts.filter(o => Math.hypot(o[0] - p[0], o[1] - p[1]) < 0.45).length === 1);
        if (!free.length) continue; /* closed loop = outline */
        const touches = pts.some(
          p => conL.some(l => onL(p[0], p[1], l)) || dots.some(d => Math.hypot(d[0] - p[0], d[1] - p[1]) < 0.9)
        );
        if (!touches) continue;
        g.forEach(c => {
          const q = c.q;
          if (Math.abs(q[1] - q[3]) < 0.05) addH(c.k, q[0], q[2], q[1]);
          else addV(c.k, q[0], q[1], q[3]);
          if (c.pk !== undefined) (plk[c.pk] = plk[c.pk] || []).push(c.k);
        });
      }
    }
  }
  /* v12: pulse glyph (small ⎍ drawn just above a wire, label TR## near it) = PULSE timer in that wire. The glyph lines are not wires; the wire is split at the glyph: left part = input, right part = output.
    ⎍ (middle high) = pulse on rising edge, ⊔ (middle low) = pulse on falling edge. Default 2 s, editable in the Timers panel. */
  const PG = [];
  {
    const gk = new Set(),
      allTx = [...sh.tx, ...Object.values(sh.cells).flat()];
    for (const h of H) {
      const L = h.x2 - h.x1;
      if (L < 0.8 || L > 2.6 || gk.has(h.k)) continue;
      const vv = x =>
          V.find(
            v =>
              !gk.has(v.k) &&
              Math.abs(v.x - x) < 0.06 &&
              v.y2 - v.y1 >= 1.4 &&
              v.y2 - v.y1 <= 3.6 &&
              (Math.abs(v.y1 - h.y) < 0.06 || Math.abs(v.y2 - h.y) < 0.06)
          ),
        a = vv(h.x1),
        b = vv(h.x2);
      if (!a || !b) continue;
      const oa = Math.abs(a.y1 - h.y) < 0.06 ? a.y2 : a.y1,
        ob = Math.abs(b.y1 - h.y) < 0.06 ? b.y2 : b.y1;
      if (Math.abs(oa - ob) > 0.06) continue;
      const pos = oa < h.y,
        lo = Math.min(oa, h.y),
        hi = Math.max(oa, h.y);
      const legs = H.filter(
        q =>
          q !== h &&
          !gk.has(q.k) &&
          Math.abs(q.y - oa) < 0.06 &&
          q.x2 - q.x1 <= 2.6 &&
          (Math.abs(q.x2 - h.x1) < 0.06 || Math.abs(q.x1 - h.x2) < 0.06)
      );
      const cx = (h.x1 + h.x2) / 2,
        host = H.filter(
          q =>
            q !== h &&
            !legs.includes(q) &&
            q.x2 - q.x1 > 4 &&
            q.x1 <= cx - 1.6 &&
            q.x2 >= cx + 1.6 &&
            ((q.y < lo && lo - q.y < 6) || (q.y > hi && q.y - hi < 2.7))
        ).sort(
          (p, q) => Math.min(Math.abs(p.y - lo), Math.abs(p.y - hi)) - Math.min(Math.abs(q.y - lo), Math.abs(q.y - hi))
        )[0];
      let hostIn = host;
      if (!hostIn && legs.length === 2 && Math.abs(oa - h.y) > 1.4) {
        /* 2.5.0-beta.11 (DITL PDF audit, DITL-03A row 21 BOILER PURGE COMPLETED "TR254"): the glyph drawn IN the wire at the end of the
           input cell (its legs are the wire, the wire to the gate starts just after it): the same pulse, with the wire after it as host */
        const lr = legs.reduce((p, q) => (q.x2 > p.x2 ? q : p)),
          ll = legs.reduce((p, q) => (q.x1 < p.x1 ? q : p)),
          w = H.filter(q => !gk.has(q.k) && !legs.includes(q) && Math.abs(q.y - oa) < 0.3 && q.x1 >= lr.x2 - 0.1 && q.x1 - lr.x2 < 3 && q.x2 - q.x1 > 4).sort(
            (p, q) => p.x1 - q.x1
          )[0];
        if (w) {
          w.x1 = ll.x1;
          hostIn = w;
        }
      }
      if (!hostIn) continue;
      const host2 = hostIn;
      [h, a, b, ...legs].forEach(q => gk.add(q.k));
      const tg = allTx
        .filter(t => /^TR\s?\d/i.test(t.t) && Math.hypot(t.x - cx, t.y - (lo + hi) / 2) < 9)
        .sort((p, q) => Math.hypot(p.x - cx, p.y - hi) - Math.hypot(q.x - cx, q.y - hi))[0];
      const near = allTx.filter(t => Math.hypot(t.x - cx, t.y - (lo + hi) / 2) < 10),
        cm = near.map(t => /^(\d+(?:\.\d+)?)\s*(SEC|MIN|MS|S)\b/i.exec(t.t)).find(Boolean),
        nm = !cm && near.find(t => /^\d+(\.\d+)?$/.test(t.t) && near.some(u => /^SEC/i.test(u.t))),
        dur = cm
          ? { v: +cm[1], u: unorm(cm[2]) || 'SEC' }
          : nm
            ? { v: +nm.t, u: 'SEC' }
            : null; /* duration written beside the glyph, e.g. DITL-69 TR23 "3 SEC." */
      PG.push({
        inl: host2 !== host,
        cx,
        wy: host2.y,
        pos,
        host: host2,
        dur,
        tag: tg ? tg.t : '',
        key: tg ? tg.t + '@' + cx.toFixed(0) : 'P' + cx.toFixed(0) + '_' + host2.y.toFixed(0)
      });
    }
    /* 2.5.0-beta.11 (DITL PDF audit, DITL-69 TR23): the same timer tag on two pulses is one timer setting; the time is written once */
    PG.forEach(g => {
      if (!g.dur && g.tag) {
        const o = PG.find(q => q !== g && q.dur && q.tag.replace(/\s/g, '') === g.tag.replace(/\s/g, ''));
        if (o) g.dur = o.dur;
      }
    });
    for (let i = H.length - 1; i >= 0; i--) if (gk.has(H[i].k)) H.splice(i, 1);
    for (let i = V.length - 1; i >= 0; i--) if (gk.has(V[i].k)) V.splice(i, 1);
    for (const g of PG) {
      const h = g.host,
        i = H.indexOf(h);
      if (i < 0) continue;
      /* a glyph in the input cell (DITL-03A TR254): the part before it is kept inside the wire area (x > S1 - 4.5) */
      const ax1 = g.inl ? Math.max(h.x1, S1 - 4.4) : h.x1,
        A = { k: h.k + '#a', x1: ax1, x2: g.inl ? Math.max(ax1 + 0.4, g.cx - 0.3) : g.cx - 1.5, y: h.y },
        B = { k: h.k + '#b', x1: g.cx + 1.5, x2: h.x2, y: h.y };
      H.splice(i, 1, A, B);
      g.A = A.k;
      g.B = B.k;
      g.hk = h.k;
    }
  }
  const tri = [];
  r.so.forEach(([q, l]) => {
    if (l !== 'CON' && l !== 'SYM') return;
    /* v25: some arrowheads are on the SYM layer (DITL-18) */ const u = [];
    q.forEach(p => {
      if (!u.some(v => Math.hypot(v[0] - p[0], v[1] - p[1]) < 0.05)) u.push(p);
    });
    if (u.length !== 3) return;
    const xs = u.map(p => p[0]),
      a0 = Math.min(...xs),
      a1 = Math.max(...xs),
      w = a1 - a0,
      h = Math.max(...u.map(p => p[1])) - Math.min(...u.map(p => p[1]));
    if (w < 0.8 || w > 5 || h > 3.5) return;
    const lo = u.filter(p => Math.abs(p[0] - a0) < 0.05),
      hi = u.filter(p => Math.abs(p[0] - a1) < 0.05);
    if (lo.length === 2 && hi.length === 1)
      tri.push({ x: hi[0][0], y: hi[0][1], d: 1, bx: a0, by: (lo[0][1] + lo[1][1]) / 2 });
    else if (hi.length === 2 && lo.length === 1)
      tri.push({ x: lo[0][0], y: lo[0][1], d: -1, bx: a1, by: (hi[0][1] + hi[1][1]) / 2 });
    else {
      /* v25: vertical arrowheads (tip up / down): they decide the flow direction of vertical NOT gates (DITL-09 row 14 bus through the NOT) */ const y0 =
          Math.min(...u.map(p => p[1])),
        y1 = Math.max(...u.map(p => p[1])),
        bo = u.filter(p => Math.abs(p[1] - y0) < 0.05),
        bi = u.filter(p => Math.abs(p[1] - y1) < 0.05);
      if (bo.length === 2 && bi.length === 1)
        tri.push({ x: bi[0][0], y: bi[0][1], d: 0, v: 1, bx: (bo[0][0] + bo[1][0]) / 2, by: y0 });
      else if (bi.length === 2 && bo.length === 1)
        tri.push({ x: bo[0][0], y: bo[0][1], d: 0, v: -1, bx: (bi[0][0] + bi[1][0]) / 2, by: y1 });
    }
  }); /* v20: keep the BASE of the arrowhead too: a wire ends at the base, the tip touches the gate pin */
  const TM = [],
    uA = new Set();
  /* v27: label <-> D matching is global (nearest pairs first): a label written BELOW its timer was taken by the timer under it (DITL-21D TR561 / TR623) */
  const asg = new Map();
  {
    const spn = a => (a[4] - a[3] + 360) % 360,
      Ls = sh.tx.filter(t => t.ix > S1 && t.ix < R0 && /DELAY|PULSE/i.test(t.t)),
      pr = [];
    Ls.forEach(t =>
      r.ar.forEach(a => {
        if (spn(a) > 100 && spn(a) < 260 && Math.abs(a[1] - t.y) < 12.5 && Math.abs(a[0] - t.x) < 14)
          pr.push({ t, a, d: Math.hypot(a[0] - t.x, a[1] - t.y) });
      })
    );
    pr.sort((p, q) => p.d - q.d);
    const ua = new Set(),
      ut = new Set();
    pr.forEach(o => {
      if (ua.has(o.a) || ut.has(o.t)) return;
      ua.add(o.a);
      ut.add(o.t);
      asg.set(o.t, o.a);
    });
  }
  for (const t of sh.tx.filter(t => t.ix > S1 && t.ix < R0 && /DELAY|PULSE/i.test(t.t))) {
    const sp = a => (a[4] - a[3] + 360) % 360,
      dd = (p, q) => Math.hypot(p[0] - t.x, p[1] - t.y) - Math.hypot(q[0] - t.x, q[1] - t.y),
      cd = r.ar.filter(a => sp(a) > 100 && sp(a) < 260 && Math.hypot(a[0] - t.x, a[1] - t.y) < 30 && !uA.has(a)),
      a =
        (asg.get(t) && !uA.has(asg.get(t)) ? asg.get(t) : null) ||
        cd.filter(a => a[5] === 'CON' && a[1] < t.y + 2).sort(dd)[0] ||
        cd.filter(a => a[5] === 'SYM' && Math.abs(a[1] - t.y) < 10).sort(dd)[0] ||
        cd
          .filter(a => a[5] === 'CON' && Math.abs(a[1] - t.y) < 9)
          .sort(
            dd
          )[0]; /* v18: CON-layer D with the label BELOW it (DITL-21C..E, 23A..) */ /* v18: label above (DITL-81 TR161) or below (TR191) the D */
    if (!a) continue;
    uA.add(a);
    const ax = a[0],
      ay = a[1],
      rr = a[2];
    const md = (a[3] + sp(a) / 2) % 360,
      rev =
        md > 90 &&
        md <
          270; /* v10: D that bulges to the LEFT = timer drawn right-to-left (e.g. DITL-69 TR164): input on the right, output on the left */
    let x0, bx1, bx2, ia, ib, oa, ob;
    const VS = [
      ...V,
      ...r.ln
        .filter(q => q[4] === 'SYM' && Math.abs(q[0] - q[2]) < 0.05)
        .map(q => ({ x: q[0], y1: Math.min(q[1], q[3]), y2: Math.max(q[1], q[3]) }))
    ]; /* flat side may be on the symbol layer */
    if (!rev) {
      const lv = VS.filter(
        v =>
          v.x < ax + 0.5 && v.x > ax - 2 * rr - 1 && v.y2 - v.y1 <= 2 * rr + 1.5 && v.y1 <= ay + 0.5 && v.y2 >= ay - 0.5
      ).sort((p, q) => q.x - p.x)[0];
      x0 = lv ? lv.x : a[5] === 'SYM' ? ax : ax - rr;
      bx1 = x0;
      bx2 = ax + rr;
      ia = x0 - 4;
      ib = x0 + 1;
      oa = bx2 - 0.7;
      ob = bx2 + 1.5;
    } else {
      const rv = VS.filter(
        v =>
          v.x > ax - 0.5 && v.x < ax + 2 * rr + 1 && v.y2 - v.y1 <= 2 * rr + 1.5 && v.y1 <= ay + 0.5 && v.y2 >= ay - 0.5
      ).sort((p, q) => p.x - q.x)[0];
      bx2 = rv ? rv.x : a[5] === 'SYM' ? ax : ax + rr;
      x0 = bx2;
      bx1 = ax - rr;
      ia = bx2 - 1;
      ib = bx2 + 4;
      oa = bx1 - 1.5;
      ob = bx1 + 0.7;
    }
    const ins = sh.tx.filter(q => q !== t && q.x >= bx1 - 1 && q.x <= bx2 + 0.5 && q.y >= ay - rr && q.y <= ay + rr),
      cmb = ins.find(q => /^\d+(\.\d+)?\s*[A-Za-z.]+$/.test(q.t) && unorm(q.t.replace(/^[\d.\s]+/, ''))),
      nt = cmb || ins.find(q => /^\d+(\.\d+)?$/.test(q.t)),
      ut = cmb || ins.find(q => !/^\d/.test(q.t) && unorm(q.t)),
      tg =
        sh.tx.find(q => /^TR\d+/i.test(q.t) && Math.abs(q.x - ax) < 20 && q.y < ay && q.y > ay - rr - 14) ||
        sh.tx
          .filter(q => /^TR\d+/i.test(q.t) && Math.abs(q.x - ax) < 12 && Math.abs(q.y - ay) < rr + 10)
          .sort((p, q) => Math.abs(p.y - ay) - Math.abs(q.y - ay))[0];
    TM.push({
      lab: t.t,
      kind: /OFF/i.test(t.t) ? 'off' : /PULSE/i.test(t.t) ? 'pulse' : 'on',
      ax,
      ay,
      rr,
      x0,
      rev,
      bx1,
      bx2,
      ia,
      ib,
      oa,
      ob,
      nt,
      ut,
      tag: tg ? tg.t : ''
    });
  }
  const inT = (x1, y1, x2, y2) =>
    TM.some(m =>
      [
        [x1, y1],
        [x2, y2]
      ].every(p => p[0] >= m.bx1 - E && p[0] <= m.bx2 + E && p[1] >= m.ay - m.rr - E && p[1] <= m.ay + m.rr + E)
    );
  for (let i = H.length - 1; i >= 0; i--) if (inT(H[i].x1, H[i].y, H[i].x2, H[i].y)) H.splice(i, 1);
  for (let i = H.length - 1; i >= 0; i--) if (inTab(H[i].x1, H[i].y) && inTab(H[i].x2, H[i].y)) H.splice(i, 1);
  for (let i = V.length - 1; i >= 0; i--) if (inTab(V[i].x, V[i].y1) && inTab(V[i].x, V[i].y2)) V.splice(i, 1);
  for (let i = V.length - 1; i >= 0; i--) if (inT(V[i].x, V[i].y1, V[i].x, V[i].y2)) V.splice(i, 1);
  const VE = [...V.map(v => ({ ...v, bar: 0 })), ...bars.map(v => ({ ...v, bar: 1 }))],
    rects = [];
  for (const h1 of H)
    for (const h2 of H) {
      const dy = h2.y - h1.y;
      if (
        dy < 2 ||
        dy > 12 ||
        Math.abs(h1.x1 - h2.x1) > E ||
        Math.abs(h1.x2 - h2.x2) > E ||
        h1.x1 < S1 - 1 ||
        h1.x2 > R0 + 4
      )
        continue;
      /* 2.5.0-beta.11 (DITL PDF audit, DITL-21A rows 19 / 20 SPEED LOW AND -> (13)): the thick input bar on the left side of an AND
         is drawn up to 0.5 beside the ends of the top and bottom lines */
      const ve = x => VE.find(v => Math.abs(v.x - x) < (v.bar ? 0.8 : E) && v.y1 <= h1.y + E && v.y2 >= h2.y - E),
        lv = ve(h1.x1),
        rv = ve(h1.x2);
      if (!lv || !rv) continue;
      rects.push({
        L: h1.x1,
        R: h1.x2,
        B: lv.bar ? Math.min(h1.y, lv.y1) : h1.y,
        T: lv.bar ? Math.max(h2.y, lv.y2) : h2.y,
        cx: (h1.x1 + h1.x2) / 2,
        cy: (h1.y + h2.y) / 2
      });
    }
  const lab = sh.tx.filter(t => t.ix > S1 && t.ix < R0 && /^(AND|OR|NOT|S|R)$/.test(t.t)),
    claim = new Set(),
    G = [];
  for (const t of lab.filter(t => t.t !== 'OR')) {
    const c = rects
      .map((q, i) => ({ q, i, d: Math.hypot(q.cx - t.ix, q.cy - t.iy) }))
      .filter(o => !claim.has(o.i) && o.d < 16)
      .sort((a, b) => a.d - b.d)[0];
    if (c) {
      claim.add(c.i);
      G.push({ t: t.t, q: c.q });
    }
  }
  for (const t of lab.filter(t => t.t === 'OR')) {
    const c = r.ci.find(c => c[3] === 'CON' && Math.hypot(c[0] - t.ix, c[1] - t.iy) < c[2] + 1.5);
    if (c) {
      const bus = bars.find(b => Math.abs(b.x - (c[0] - c[2])) < 0.9 && c[1] >= b.y1 - 0.5 && c[1] <= b.y2 + 0.5);
      let hb = null;
      if (!bus) {
        const [cx, cy, rr] =
          c; /* v16: vertical-flow OR: the input bar is a horizontal line touching the circle at the bottom (or top), inputs come from that side, output leaves on the other side (DITL-25A..29A, 05) */
        hb =
          H.filter(
            h =>
              h.x1 <= cx - rr * 0.6 &&
              h.x2 >= cx + rr * 0.6 &&
              h.x2 - h.x1 > 1.4 * rr &&
              h.x2 - h.x1 < 14 * rr &&
              (Math.abs(h.y - (cy - rr)) < 1.4 || Math.abs(h.y - (cy + rr)) < 1.4)
          ).sort((a, b) => a.x2 - a.x1 - (b.x2 - b.x1))[0] || null;
        if (hb) {
          hb = { ...hb, below: hb.y < cy };
          H.splice(H.indexOf(H.find(h => h.k === hb.k)), 1);
        }
      }
      G.push({ t: 'OR', c, bus, hb });
    }
  }
  /* v9: small box with an X inside = NOT gate (legend DITL-00, block 0NOT). v8 wrongly passed it through as a jumper. */
  const dg = r.ln.filter(q => q[4] === 'CON' && Math.abs(q[0] - q[2]) > 0.5 && Math.abs(q[1] - q[3]) > 0.5);
  rects.forEach((q, i) => {
    if (claim.has(i) || q.R - q.L > 6.3 || q.T - q.B > 6.3) return;
    /* v27: bigger NOT symbols (DITL-117 5.7 x 5.4) */ const w = q.R - q.L,
      x = dg.filter(
        d =>
          Math.min(d[0], d[2]) >= q.L - E &&
          Math.max(d[0], d[2]) <= q.R + E &&
          Math.min(d[1], d[3]) >= q.B - E &&
          Math.max(d[1], d[3]) <= q.T + E &&
          Math.abs(d[0] - d[2]) > w * 0.7
      ).length;
    if (x >= 2 && !G.some(g => g.q && Math.abs(g.q.cx - q.cx) < 0.6 && Math.abs(g.q.cy - q.cy) < 0.6)) {
      claim.add(i);
      G.push({ t: 'NOT', q, xb: 1 });
    }
  });
  /* v20: a gate input bar can be drawn as MANY short collinear vertical pieces (DITL-21C ORs): chain pieces that touch, a chain longer than minLen that overlaps [ylo,yhi] is the bar */
  const barPieces = (x0, x1, minLen, ylo, yhi) => {
    const gx = {},
      out = [];
    VE.filter(v => v.x >= x0 && v.x <= x1).forEach(v => {
      (gx[Math.round(v.x * 10)] = gx[Math.round(v.x * 10)] || []).push(v);
    });
    for (const k in gx) {
      const a = gx[k].sort((p, q) => p.y1 - q.y1);
      let cur = null,
        grp = [];
      const flush = () => {
        if (cur && cur.y2 - cur.y1 >= minLen && cur.y1 <= yhi && cur.y2 >= ylo) out.push(...grp);
      };
      a.forEach(v => {
        if (cur && v.y1 <= cur.y2 + 0.5) {
          cur.y2 = Math.max(cur.y2, v.y2);
          grp.push(v);
        } else {
          flush();
          cur = { y1: v.y1, y2: v.y2 };
          grp = [v];
        }
      });
      flush();
    }
    return out;
  };
  /* v9: thick AND input bar (2-3 parallel verticals at the AND left edge, longer than the box) = input bus, not a wire that joins all inputs */
  const vskip = new Set();
  G.filter(g => g.t === 'AND').forEach(g => {
    const q = g.q,
      pr = barPieces(q.L - 1.3, q.L + 1.3, q.T - q.B + 1, q.B, q.T);
    if (pr.length < 2 && !pr.some(v => v.bar))
      return; /* v20: the bar can sit up to 1.2 inside the box edge (DITL-83) and a thick bar alone is already a bus */
    g.bus = {
      x1: Math.min(...pr.map(v => v.x)),
      x2: Math.max(...pr.map(v => v.x)),
      y1: Math.min(...pr.map(v => v.y1)),
      y2: Math.max(...pr.map(v => v.y2))
    };
    pr.forEach(v => {
      if (!v.bar) vskip.add(v.k);
    });
    /* v20: shorter pieces of the same bar (split bar) are bus too */ VE.forEach(v => {
      if (!v.bar && v.x >= g.bus.x1 - 0.7 && v.x <= g.bus.x2 + 0.7 && v.y1 >= g.bus.y1 - 0.7 && v.y2 <= g.bus.y2 + 0.7)
        vskip.add(v.k);
    });
  });
  /* v10: same for the OR input bar: the bar is drawn as a thick polyline plus a plain line beside it; the plain line merged all OR inputs into one net */
  G.filter(g => g.t === 'OR').forEach(g => {
    const [cx, cy, rr] = g.c,
      pr = barPieces(cx - rr - 1.3, cx - rr + 1.3, rr * 1.6, cy - 0.5, cy + 0.5);
    if (!pr.length) return;
    g.ob = {
      x1: Math.min(...pr.map(v => v.x)),
      x2: Math.max(...pr.map(v => v.x)),
      y1: Math.min(...pr.map(v => v.y1)),
      y2: Math.max(...pr.map(v => v.y2))
    };
    pr.forEach(v => {
      if (!v.bar) vskip.add(v.k);
    });
    VE.forEach(v => {
      if (!v.bar && v.x >= g.ob.x1 - 0.7 && v.x <= g.ob.x2 + 0.7 && v.y1 >= g.ob.y1 - 0.7 && v.y2 <= g.ob.y2 + 0.7)
        vskip.add(v.k);
    });
  });
  const rr_ = rects.filter((q, i) => claim.has(i) || q.R - q.L > 5.2 || q.T - q.B > 5.2),
    inb = (x, y, x2, y2) =>
      rr_.some(q =>
        [
          [x, y],
          [x2, y2]
        ].every(p => p[0] >= q.L - E && p[0] <= q.R + E && p[1] >= q.B - E && p[1] <= q.T + E)
      ),
    segs = [];
  const edge = v => {
    /* v27: the vertical must lie inside a STACK of boxes that touch each other (S over R of a flip-flop); it used the span of ALL boxes with the same x, which also swallowed the wire between two separate NOT gates (DITL-12A) */
    const b = rr_.filter(q => Math.abs(v.x - q.L) < E || Math.abs(v.x - q.R) < E).sort((p, q) => p.B - q.B);
    if (!b.length) return false;
    const st = [];
    let cur = null;
    b.forEach(q => {
      if (cur && q.B <= cur.T + 0.7) {
        cur.T = Math.max(cur.T, q.T);
      } else {
        cur = { B: q.B, T: q.T };
        st.push(cur);
      }
    });
    return st.some(g => v.y1 >= g.B - E && v.y2 <= g.T + E);
  };
  for (const h of H)
    if (h.x1 > S1 - 4.5 && h.x2 < R0 + 6 && !inb(h.x1, h.y, h.x2, h.y))
      segs.push({ k: h.k, h: 1, x1: h.x1, x2: h.x2, y1: h.y, y2: h.y });
  /* 2.5.0-beta.11 (DITL PDF audit, DITL-61A row 8 PUMP B TRIP): a wire that bends down INSIDE the input cell (x < S1 - 1) before it
     reaches the logic: the vertical joins the END of one input-row wire to the START of a wire into the logic, it is wiring, not frame */
  const hEnd = (x, y) => H.some(h => Math.abs(h.y - y) < 0.1 && (Math.abs(h.x1 - x) < 0.1 || Math.abs(h.x2 - x) < 0.1) && h.x1 > S1 - 4.5),
    bend = v => v.x > S1 - 4.5 && v.x <= S1 - 1 && hEnd(v.x, v.y1) && hEnd(v.x, v.y2);
  for (const v of V)
    if (!vskip.has(v.k) && (v.x > S1 - 1 || bend(v)) && v.x < R0 + 6 && !inb(v.x, v.y1, v.x, v.y2) && !edge(v))
      segs.push({ k: v.k, h: 0, x1: v.x, x2: v.x, y1: v.y1, y2: v.y2 });
  const P = segs.map((_, i) => i),
    f = i => (P[i] === i ? i : (P[i] = f(P[i]))),
    u = (a, b) => {
      P[f(a)] = f(b);
    };
  const on = (x, y, s, t = 0.35) => x >= s.x1 - t && x <= s.x2 + t && y >= s.y1 - t && y <= s.y2 + t,
    en = s => [
      [s.x1, s.y1],
      [s.h ? s.x2 : s.x1, s.h ? s.y1 : s.y2]
    ];
  if (strict) {
    /* v27: strict T: an end that lies on the SIDE of a perpendicular wire connects only through a junction dot (the dots are complete); end-to-end and collinear overlaps still join */
    const near2 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.4;
    segs.forEach((a, i) =>
      segs.forEach((b, j) => {
        if (j <= i) return;
        const ea = en(a),
          eb = en(b);
        let ok = false;
        if (ea.some(p => eb.some(q => near2(p, q)))) ok = true;
        else if (a.h === b.h) ok = ea.some(p => on(p[0], p[1], b)) || eb.some(p => on(p[0], p[1], a));
        if (ok) u(i, j);
      })
    );
  } else
    segs.forEach((a, i) =>
      segs.forEach((b, j) => {
        if (j > i && (en(a).some(p => on(p[0], p[1], b)) || en(b).some(p => on(p[0], p[1], a)))) u(i, j);
      })
    );
  dots.forEach(d => {
    const m = segs.map((s, i) => (on(d[0], d[1], s, 0.8) ? i : -1)).filter(i => i >= 0);
    m.forEach(i => u(m[0], i));
  });
  /* v14: ICD130 (two small arcs ")(" on a wire, DITL-61A/76/77 rows 53/54 VCB ON/OFF) = field contact in the wire: the wire is drawn with a gap there, bridge it */
  const CM =
    []; /* v26: limit comparators (H/ /L boxes and SIGHI / SIGLO symbols): kept as CMP gates with a numeric input, the setpoint is read from the text beside the box. Without a readable setpoint they stay a plain pass-through. */
  /* v18: limit comparator box "H/" or "/L" (legend DITL-00) on a wire (temperature / vibration switches, DITL-61B, 21A..): the wire has a gap at the box, the signal passes through */
  [...sh.tx, ...Object.values(sh.cells).flat()]
    .filter(t => /^(H\/|\/L|H\/L|HH\/|\/LL)$/.test(t.t) && t.x > S1 && t.x < R0)
    .forEach(t => {
      const cy = t.y + (t.b === 0 ? 1.3 : 0),
        cand = (f, lim) =>
          segs
            .map((q, i) => ({ q, i }))
            .filter(o => o.q.h && Math.abs(o.q.y1 - cy) < 3.6 && f(o.q))
            .sort((a, b) => lim(a.q) - lim(b.q) || Math.abs(a.q.y1 - cy) - Math.abs(b.q.y1 - cy))[0];
      const Lf = cand(
          q => q.x2 <= t.x + 0.6 && q.x2 >= t.x - 9,
          q => -q.x2
        ),
        Rt = cand(
          q => q.x1 >= t.x - 0.6 && q.x1 <= t.x + 10,
          q => q.x1
        );
      if (Lf && Rt) CM.push({ Lf: Lf.i, Rt: Rt.i, cx: t.x, cy, kind: /^H/.test(t.t) ? 'H' : 'L', txt: t.t });
    });
  (sh.syms || [])
    .filter(z => z.k === 'icd' || z.k === 'hi' || z.k === 'lo')
    .forEach(z => {
      /* v21: SIGHI / SIGLO limit comparator symbols (DITL-86, 92, 93, 94...) have a 6 unit gap in the wire, bridged like ICD130 */ const c =
        (f, lim) =>
          segs
            .map((q, i) => ({ q, i }))
            .filter(o => o.q.h && Math.abs(o.q.y1 - z.y) < 2.8 && f(o.q))
            .sort((a, b) => lim(a.q) - lim(b.q) || Math.abs(a.q.y1 - z.y) - Math.abs(b.q.y1 - z.y))[0];
      const Lf = c(
          q => q.x2 <= z.x + 1 && q.x2 >= z.x - 12,
          q => -q.x2
        ),
        Rt = c(
          q => q.x1 >= z.x - 1 && q.x1 <= z.x + 12,
          q => q.x1
        );
      if (Lf && Rt) {
        /* 2.5.0-beta.11 (DITL PDF audit, DITL-76 / 77 rows 53 / 54 VCB ON / OFF): the contact bridges a wire that continues at the SAME
           height and ENDS at the contact; a lamp wire that ends on a vertical wire (GREEN / RED lamp of the running FF, drawn at the
           same height as the field contact) is not the other side of the VCB contact: the VCB ON / OFF rows are field signals */
        if (z.k === 'icd') {
          const endOn = segs.some((v, j) => j !== Lf.i && !v.h && on(Lf.q.x2, Lf.q.y1, v));
          if (Math.abs(Lf.q.y1 - Rt.q.y1) < 0.6 && !endOn) u(Lf.i, Rt.i);
        }
        else
          CM.push({
            Lf: Lf.i,
            Rt: Rt.i,
            cx: z.x + 3,
            cy: z.y,
            kind: z.k === 'hi' ? 'H' : 'L',
            txt: z.k === 'hi' ? 'SIGHI' : 'SIGLO'
          });
      }
    });
  {
    for (let i = CM.length - 1; i >= 0; i--) {
      if (
        CM.some(
          (o, j) => j < i && Math.abs(o.cx - CM[i].cx) < 5 && Math.abs(o.cy - CM[i].cy) < 2 && o.kind === CM[i].kind
        )
      )
        CM.splice(i, 1);
    } /* the same symbol can be listed twice (block inside block) */
    const allT = [...sh.tx, ...Object.values(sh.cells).flat()].filter(t =>
      /^[<>≥≤]=?\s*(-?\d|[A-Z]{1,3}\d{3,5}$)/.test(t.t)
    );
    /* 2.5.0-beta.11 (DITL PDF audit, DITL-63 rows 78 / 79): two boxes close together, ">= 85°C" above the H/ box and "<= 50°C" above
       the /L box: a limit text belongs to the box it is nearest to, so one box does not take the text of the other */
    const own = t => {
      let best = null,
        bd = 1e9;
      CM.forEach(c => {
        const d = Math.hypot(t.x - c.cx, t.y - c.cy);
        if (d < bd) {
          bd = d;
          best = c;
        }
      });
      return bd < 7 ? best : null;
    };
    CM.forEach(c => {
      const o = allT
        .filter(t => t.x >= c.cx - 11 && t.x <= c.cx + 42 && Math.abs(t.y - c.cy) < 8)
        .filter(t => {
          const w = own(t);
          return !w || w === c;
        })
        .sort((a, b) => Math.hypot(a.x - c.cx - 8, a.y - c.cy) - Math.hypot(b.x - c.cx - 8, b.y - c.cy))[0];
      if (!o) {
        /* 2.5.0-beta.11 (DITL PDF audit, DITL-55 row 6 PT-CD1110 "/L  S= 0.7 kg/cm2(A)  R= 0.75 kg/cm2(A)"): a limit written as the set
           value S= (and the reset value R=): the box kind gives the side (/L = below S, H/ = above S) */
        const so = [...sh.tx, ...Object.values(sh.cells).flat()]
          .filter(t => /^S\s*=\s*-?\d/.test(t.t) && t.x >= c.cx - 11 && t.x <= c.cx + 20 && Math.abs(t.y - c.cy) < 8)
          .sort((a, b) => Math.hypot(a.x - c.cx, a.y - c.cy) - Math.hypot(b.x - c.cx, b.y - c.cy))[0];
        const sm = so && /^S\s*=\s*(-?\d+(?:\.\d+)?)\s*(.*)$/.exec(so.t.trim());
        if (sm) {
          c.op = c.kind === 'L' ? '<' : '>';
          c.eq = false;
          c.sptxt = so.t.trim();
          c.sp = +sm[1];
          c.unit = sm[2].trim();
        }
        return;
      }
      const tt = o.t.trim(),
        m = /^([<>≥≤]=?)\s*(-?\d+(?:\.\d+)?)\s*(.*)$/.exec(tt),
        mv = !m && /^([<>≥≤]=?)\s*([A-Z]{1,3}\d{3,5})$/.exec(tt);
      if (!m && !mv) return;
      const op = (m || mv)[1];
      c.op = op[0] === '<' || op[0] === '≤' ? '<' : '>';
      c.eq = /[=≥≤]/.test(op);
      c.sptxt = tt;
      if (m) {
        c.sp = +m[2];
        c.unit = m[3].trim();
      } else {
        /* v27: the limit is another analog signal (DITL-60 ">=AB0383"): its wire enters the box from above */ const v =
          segs
            .map((q, i) => ({ q, i }))
            .filter(
              o2 => !o2.q.h && Math.abs(o2.q.x1 - c.cx) < 6 && o2.q.y1 - (c.cy + 3) > -1 && o2.q.y1 - (c.cy + 3) < 10
            )
            .sort((a, b) => Math.abs(a.q.y1 - c.cy) - Math.abs(b.q.y1 - c.cy))[0];
        if (v) {
          c.spSeg = v.i;
          c.spVar = mv[2];
          c.sp = NaN;
        }
      }
    });
    CM.forEach(c => {
      if (c.sp === undefined) u(c.Lf, c.Rt);
    });
  }
  /* 2.2.0-beta.6: relay contact of a DCS output (DITL-21A rows 66 / 68: OR -> O.021C "LOR-L1060A" -> relay; its normally open contact "o o" (two circles, flat bar) on the DC 24V line lights the LCP lamp RUNNING; NOT -> O.021D "LOS-L1060A" -> lamp STOPPED).
     The contact closes when the DCS output arrow on the same level, just left of the DC 24V line, is ON: the lamp wire joins that output wire. The DC 24V common (left of the contact) stays apart. Only a contact whose right wire runs to an output cell. */
  {
    const cc = (r.ci || []).filter(c => c[2] > 1.2 && c[2] < 2.6),
      bars = [];
    (r.ln || []).forEach(q => {
      if (Math.abs(q[1] - q[3]) < 0.3) bars.push([Math.min(q[0], q[2]), Math.max(q[0], q[2]), q[1]]);
    });
    (r.pl || []).forEach(([p]) => {
      for (let i = 0; i + 1 < p.length; i++)
        if (Math.abs(p[i][1] - p[i + 1][1]) < 0.3)
          bars.push([Math.min(p[i][0], p[i + 1][0]), Math.max(p[i][0], p[i + 1][0]), p[i][1]]);
    });
    cc.forEach(a =>
      cc.forEach(b => {
        const d = b[0] - a[0],
          y = a[1];
        if (d < 6 || d > 12 || Math.abs(a[1] - b[1]) > 0.3) return;
        if (!bars.some(z => z[0] < a[0] + 1.5 && z[1] > b[0] - 1.5 && z[1] - z[0] < d + 4 && Math.abs(z[2] - y) > 2 && Math.abs(z[2] - y) < 5)) return;
        const Rt = segs.findIndex(q => q.h && Math.abs(q.y1 - y) < 0.6 && Math.abs(q.x1 - (b[0] + b[2])) < 1.2 && q.x2 >= R0 - 8);
        const Lf = segs.findIndex(q => q.h && Math.abs(q.y1 - y) < 0.6 && Math.abs(q.x2 - (a[0] - a[2])) < 1.2);
        if (Rt < 0 || Lf < 0) return;
        const ar = tri
          .filter(t => t.d === 1 && Math.abs(t.y - y) < 1.2 && t.x < segs[Lf].x1 + 0.5 && segs[Lf].x1 - t.x < 12)
          .sort((p, q) => q.x - p.x)[0];
        if (!ar) return;
        const w = segs.findIndex(q => q.h && Math.abs(q.y1 - ar.by) < 0.6 && Math.abs(q.x2 - ar.bx) < 1.6);
        if (w >= 0) u(Rt, w);
      })
    );
  }
  /* v17: numbered circle connectors (1..14 in a small circle at the end of a wire): the same number on the same sheet = the same wire (DITL-76 timer output M.1237 -> (1) -> MOS gate). A number that appears once goes to another sheet (linking, on hold). */
  const cons = [];
  {
    const alltx = [...sh.tx, ...Object.values(sh.cells).flat()],
      byN = {};
    r.ci.forEach(([x, y, rr, l]) => {
      if (rr < 1.8 || rr > 4.6) return;
      /* 2.5.0-beta.11: letters too (DITL-26A / 26B connectors (A) / (B)) */
      const t = alltx.find(q => /^(\d{1,2}|[A-H])$/.test(q.t) && Math.hypot(q.ix - x, q.iy - y) <= rr + 1.2);
      if (!t) return;
      const c = segs
        .map((q, i) => ({ q, i }))
        .map(o => {
          const q = o.q;
          let d = 1e9;
          if (q.h && Math.abs(q.y1 - y) < 1.2) {
            if (q.x2 <= x - rr + 1 && q.x2 >= x - rr - 4.6) d = x - rr - q.x2;
            else if (q.x1 >= x + rr - 1 && q.x1 <= x + rr + 4.6) d = q.x1 - (x + rr);
          } else if (!q.h && Math.abs(q.x1 - x) < 1.2) {
            if (q.y2 <= y - rr + 1 && q.y2 >= y - rr - 4.6) d = y - rr - q.y2;
            else if (q.y1 >= y + rr - 1 && q.y1 <= y + rr + 4.6) d = q.y1 - (y + rr);
          }
          return { i: o.i, d: Math.abs(d) };
        })
        .filter(o => o.d < 1e8)
        .sort((a, b) => a.d - b.d)[0];
      cons.push({ x, y, r: rr, num: t.t, i: c ? c.i : -1 });
      if (c) (byN[t.t] = byN[t.t] || []).push(c.i);
    });
    for (const k in byN) if (byN[k].length > 1) byN[k].forEach(i => u(byN[k][0], i));
  }
  (sh.links || []).forEach(([a, b]) => {
    const i = segs.findIndex(q => q.k === a),
      j = segs.findIndex(q => q.k === b);
    if (i >= 0 && j >= 0) u(i, j);
  });
  let healed = 0;
  const gd = (x, y, t) => Math.hypot(Math.max(t.x1 - x, 0, x - t.x2), Math.max(t.y1 - y, 0, y - t.y2));
  segs.forEach((a, i) =>
    en(a).forEach(([x, y], ei) => {
      const ak = String(a.k);
      if ((/#b$/.test(ak) && ei === 0) || (/#a$/.test(ak) && ei === 1)) return;
      /* v20: the artificial end made by cutting a wire at a pulse glyph must not heal onto a neighbour wire */ if (
        tri.some(t => Math.hypot(t.x - x, t.y - y) < 1.4 || Math.hypot(t.bx - x, t.by - y) < 1.4)
      )
        return;
      /* v20: an end with an ARROWHEAD is the end of the signal flow (it points into a gate pin): never glue it to a wire that happens to run 1 unit away (DITL-94 AND output next to the OR output wire) */ if (
        segs.some((b, j) => j !== i && on(x, y, b)) ||
        dots.some(d => Math.hypot(d[0] - x, d[1] - y) < 0.8)
      )
        return;
      let bj = -1,
        bd = 1.2;
      segs.forEach((b, j) => {
        if (j === i || f(j) === f(i)) return;
        const d = gd(x, y, b);
        if (d < bd) {
          bd = d;
          bj = j;
        }
      });
      if (bj >= 0) {
        u(i, bj);
        healed++;
      }
    })
  );
  /* v21: two free ends that face each other on the same line with a gap up to 3 units are one wire (a hop, a broken drawing line) */
  {
    const fe = [];
    segs.forEach((a, i) =>
      en(a).forEach(([x, y], ei) => {
        const ak = String(a.k);
        if ((/#b$/.test(ak) && ei === 0) || (/#a$/.test(ak) && ei === 1)) return;
        if (
          segs.some((b, j) => j !== i && on(x, y, b)) ||
          dots.some(d => Math.hypot(d[0] - x, d[1] - y) < 0.8) ||
          tri.some(t => Math.hypot(t.x - x, t.y - y) < 1.4 || Math.hypot(t.bx - x, t.by - y) < 1.4)
        )
          return;
        fe.push({ i, x, y, h: a.h, out: a.h ? (ei === 0 ? -1 : 1) : ei === 0 ? -1 : 1 });
      })
    );
    fe.forEach((a, ia) =>
      fe.forEach((b, ib) => {
        if (ib <= ia || a.h !== b.h || f(a.i) === f(b.i)) return;
        const g = a.h
          ? Math.abs(a.y - b.y) < 0.2 && Math.abs(a.x - b.x)
          : Math.abs(a.x - b.x) < 0.2 && Math.abs(a.y - b.y);
        if (g < 0.4 || g > 3.0 || a.x < S1 + 6 || b.x < S1 + 6 || a.x > R0 - 6 || b.x > R0 - 6) return;
        const mx = (a.x + b.x) / 2,
          my = (a.y + b.y) / 2;
        if (
          rects.some(q => mx >= q.L - 0.5 && mx <= q.R + 0.5 && my >= q.B - 0.5 && my <= q.T + 0.5) ||
          TM.some(m => mx >= m.bx1 - 1.5 && mx <= m.bx2 + 1.5 && Math.abs(my - m.ay) < m.rr + 2) ||
          PG.some(pg => Math.abs(mx - pg.cx) < 3.2 && Math.abs(my - pg.wy) < 2)
        )
          return;
        /* never heal across a gate / timer body */ const d = a.h ? Math.sign(b.x - a.x) : Math.sign(b.y - a.y);
        if (d === a.out && d === -b.out) {
          u(a.i, b.i);
          healed++;
        }
      })
    );
  }
  const id = {};
  let n = 0;
  segs.forEach((s, i) => {
    const q = f(i);
    if (!(q in id)) id[q] = n++;
    s.n = id[q];
  });
  const ends = [];
  const freeEnd = (s, x, y) =>
    !segs.some(b => b !== s && on(x, y, b, 0.4)) &&
    !dots.some(
      d => Math.hypot(d[0] - x, d[1] - y) < 0.8
    ); /* v20: a real input / output wire starts with a FREE end; a bend that merely sits near the cell edge touches another wire and is not a source */
  segs.forEach(s => {
    if (s.h) {
      const k = String(s.k);
      ends.push({ x: s.x1, y: s.y1, n: s.n, cut: /#b$/.test(k), free: freeEnd(s, s.x1, s.y1) });
      ends.push({ x: s.x2, y: s.y1, n: s.n, cut: /#a$/.test(k), free: freeEnd(s, s.x2, s.y1) });
    }
  });
  const at = (x0, x1, y0, y1) => [
      ...new Set(ends.filter(e => e.x >= x0 && e.x <= x1 && e.y >= y0 - 0.7 && e.y <= y1 + 0.7).map(e => e.n))
    ],
    gates = [];
  /* 2.5.0-beta.11 (DITL PDF audit, DITL-61A row 11): an input of an OR bar is a wire END that points at the bar; a corner of a wire that
     turns away 4 units before the bar (row 11 bends up to the 5 s ON DELAY AND) is not an input of the OR */
  const atBar = (x0, xb, x1, y0, y1) => [
    ...new Set(
      ends.filter(e => e.x >= x0 && e.x <= x1 && e.y >= y0 - 0.7 && e.y <= y1 + 0.7 && (e.free || e.x >= xb - 1.2)).map(e => e.n)
    )
  ];
  const ai = (x, b, t) => at(x - 4.3, x + 0.7, b, t),
    ao = (x, b, t) => at(x - 0.7, x + 1.2, b, t);
  for (const g of G) {
    if (g.t === 'NOT') {
      const q = g.q,
        nr = (d, x) => tri.some(a => a.d === d && Math.abs(a.x - x) < 1.6 && a.y >= q.B - 0.8 && a.y <= q.T + 0.8),
        ev = nr(-1, q.R) && !nr(1, q.L) ? 1 : nr(1, q.L) && !nr(-1, q.R) ? -1 : 0,
        rev = ev === 1;
      gates.push({
        t: 'NOT',
        rev,
        ev,
        done: ev !== 0,
        Q: q,
        A: at(q.L - 4.3, q.L + 0.7, q.B, q.T),
        Bn: at(q.R - 0.7, q.R + 4.1, q.B, q.T),
        ins: rev ? at(q.R - 0.7, q.R + 4.1, q.B, q.T) : ai(q.L, q.B, q.T),
        out: rev ? at(q.L - 1.2, q.L + 0.7, q.B, q.T) : ao(q.R, q.B, q.T),
        box: { x1: q.L, x2: q.R, y1: q.B, y2: q.T }
      });
      const ng = gates[gates.length - 1];
      if (!ng.A.length && !ng.Bn.length) {
        /* v9: X-box NOT with vertical flow (wire enters top/bottom), default top -> bottom, direction fixed below by driven nets */
        const cx0 = (q.L + q.R) / 2,
          vt = top => [
            ...new Set(
              segs
                .filter(
                  z =>
                    !z.h &&
                    Math.abs(z.x1 - cx0) < 1.4 &&
                    (top ? z.y1 >= q.T - 0.9 && z.y1 <= q.T + 3.9 : z.y2 <= q.B + 0.9 && z.y2 >= q.B - 3.9)
                )
                .map(z => z.n)
            )
          ];
        /* v16: the arrow head sits between the wire end and the box, so the wire ends up to ~3.9 away */ ng.vert = 1;
        ng.A = vt(true);
        ng.Bn = vt(false);
        ng.ins = ng.A;
        ng.out = ng.Bn;
        ng.ev = 0;
        ng.done = false;
        const upIn = tri.some(t => t.v === 1 && Math.abs(t.x - cx0) < 1.8 && Math.abs(t.y - q.B) < 2.2),
          dnIn = tri.some(
            t => t.v === -1 && Math.abs(t.x - cx0) < 1.8 && Math.abs(t.y - q.T) < 2.2
          ); /* arrow tip on the bottom edge pointing up = signal enters from below (flow up); tip on the top edge pointing down = enters from above */
        if (upIn && !dnIn) {
          ng.rev = true;
          ng.ins = ng.Bn;
          ng.out = ng.A;
          ng.done = true;
          ng.ev = 1;
        } else if (dnIn && !upIn) {
          ng.done = true;
          ng.ev = 1;
        }
      } else if (!ng.A.length && ng.Bn.length) {
        /* v27: a NOT whose signal enters from the top / bottom and leaves to the right as well (DITL-21A row 22): top and bottom nets decide the input, the right wire is an extra output */
        const cx0 = (q.L + q.R) / 2,
          vt = top => [
            ...new Set(
              segs
                .filter(
                  z =>
                    !z.h &&
                    Math.abs(z.x1 - cx0) < 1.4 &&
                    (top ? z.y1 >= q.T - 0.9 && z.y1 <= q.T + 3.9 : z.y2 <= q.B + 0.9 && z.y2 >= q.B - 3.9)
                )
                .map(z => z.n)
            )
          ],
          tp = vt(true),
          bt = vt(false);
        if (tp.length && bt.length) {
          ng.vert = 1;
          ng.tap = ng.Bn;
          ng.A = tp;
          ng.Bn = bt;
          ng.ins = tp;
          ng.out = [...bt, ...ng.tap];
          ng.ev = 0;
          ng.done = false;
        }
      }
    } else if (g.t === 'AND')
      gates.push({
        t: g.t,
        bus: g.bus,
        ins: g.bus
          ? [...new Set([...ai(g.q.L, g.q.B, g.q.T), ...at(g.bus.x1 - 4.3, g.bus.x2 + 0.9, g.bus.y1, g.bus.y2)])]
          : ai(g.q.L, g.q.B, g.q.T),
        out: ao(g.q.R, g.q.B, g.q.T),
        box: { x1: g.q.L, x2: g.q.R, y1: g.q.B, y2: g.q.T }
      });
    else if (g.t === 'OR' && g.hb) {
      const [cx, cy, rr] = g.c,
        hb = g.hb,
        vs = segs.filter(z => !z.h),
        ii = vs.filter(
          z =>
            z.x1 >= hb.x1 - 0.7 &&
            z.x1 <= hb.x2 + 0.7 &&
            (hb.below ? z.y2 <= hb.y + 0.7 && z.y2 >= hb.y - 4.4 : z.y1 >= hb.y - 0.7 && z.y1 <= hb.y + 4.4)
        ),
        oo = vs.filter(
          z =>
            Math.abs(z.x1 - cx) < 1.4 &&
            (hb.below ? z.y1 >= cy + rr - 0.9 && z.y1 <= cy + rr + 1.4 : z.y2 <= cy - rr + 0.9 && z.y2 >= cy - rr - 1.4)
        );
      gates.push({
        t: 'OR',
        bar: -1,
        hv: 1,
        ins: [...new Set(ii.map(z => z.n))],
        out: [...new Set(oo.map(z => z.n))],
        vz: [
          {
            x1: hb.x1 - 0.7,
            x2: hb.x2 + 0.7,
            y1: hb.below ? hb.y - 4.5 : hb.y - 0.7,
            y2: hb.below ? hb.y + 0.7 : hb.y + 4.5
          },
          {
            x1: cx - 1.4,
            x2: cx + 1.4,
            y1: hb.below ? cy + rr - 0.9 : cy - rr - 1.5,
            y2: hb.below ? cy + rr + 1.5 : cy - rr + 0.9
          }
        ],
        box: { x1: hb.x1, x2: hb.x2, y1: Math.min(cy - rr, hb.y), y2: Math.max(cy + rr, hb.y) }
      });
    } else if (g.t === 'OR') {
      const [cx, cy, rr] = g.c;
      gates.push({
        t: 'OR',
        bar: g.bus ? g.bus.k : -1,
        bus: g.ob,
        ins: g.ob
          ? atBar(g.ob.x1 - 4.3, g.ob.x1, g.ob.x2 + 0.9, g.ob.y1, g.ob.y2)
          : g.bus
            ? atBar(g.bus.x - 4.3, g.bus.x, g.bus.x + 0.9, g.bus.y1, g.bus.y2)
            : ai(cx - rr, cy - rr, cy + rr),
        out: ao(cx + rr, cy - 1, cy + 1),
        box: {
          x1: g.bus ? g.bus.x : cx - rr,
          x2: cx + rr,
          y1: Math.min(cy - rr, g.bus ? g.bus.y1 : 1e9),
          y2: Math.max(cy + rr, g.bus ? g.bus.y2 : -1e9)
        }
      });
    }
  }
  const usedR =
    new Set(); /* v15: the S/R box can be drawn with R on TOP and S below (DITL-62, 63, 72...): pair either way */
  for (const s of G.filter(g => g.t === 'S')) {
    const R = G.filter(
      g =>
        g.t === 'R' &&
        !usedR.has(g) &&
        Math.abs(g.q.cx - s.q.cx) < 1 &&
        Math.abs(g.q.cy - s.q.cy) < 16 &&
        Math.abs(g.q.cy - s.q.cy) > 1
    ).sort((a, b) => Math.abs(a.q.cy - s.q.cy) - Math.abs(b.q.cy - s.q.cy))[0];
    if (R) {
      usedR.add(R);
      gates.push({
        t: 'FF',
        /* 2.5.0-beta.11 (DITL PDF audit, DITL-69 / 70 / 71): the circle drawn around the S or the R letter marks the input that wins
           when both are 1 (legend DITL-00); a circled S = set wins (MOS-CD1001 ~ 1003, M.040C). Without a circle, reset wins as before */
        spri: (r.ci || []).some(c => Math.abs(c[0] - s.q.cx) < 1.2 && Math.abs(c[1] - s.q.cy) < 1.2 && c[2] > 2 && c[2] < 4.5),
        rt: R.q.cy > s.q.cy,
        s: ai(s.q.L, s.q.B, s.q.T),
        r: ai(R.q.L, R.q.B, R.q.T),
        out: [...ao(s.q.R, s.q.B, s.q.T), ...ao(R.q.R, R.q.B, R.q.T)],
        q: 0,
        box: {
          x1: Math.min(s.q.L, R.q.L),
          x2: Math.max(s.q.R, R.q.R),
          y1: Math.min(s.q.B, R.q.B),
          y2: Math.max(s.q.T, R.q.T)
        }
      });
    }
  }
  for (const m of TM) {
    gates.push({
      t: 'TMR',
      k: m.kind,
      tm: m,
      ins: atBar(m.ia, m.bx1, m.ib, m.ay - 2.5, m.ay + 2.5) /* 2.5.0-beta.11: DITL-112 row 10 corner is not a timer input */,
      out: at(m.oa, m.ob, m.ay - 2.5, m.ay + 2.5),
      st: { acc: 0, out: 0, pre: 0, run: 0 },
      box: { x1: m.bx1, x2: m.bx2, y1: m.ay - m.rr, y2: m.ay + m.rr }
    });
  }
  {
    const sn = {};
    segs.forEach(q => (sn[q.k] = q.n));
    for (const p of PG) {
      if (sn[p.A] === undefined || sn[p.B] === undefined) continue;
      const pd = sh.pdur && sh.pdur[p.key];
      gates.push({
        t: 'TMR',
        k: p.pos ? 'pulse' : 'npulse',
        tm: {
          lab: 'PULSE',
          pg: 1,
          key: p.key,
          tag: p.tag,
          ax: p.cx,
          ay: p.wy,
          rr: 1.5,
          bx1: p.cx - 1.5,
          bx2: p.cx + 1.5,
          nt: null,
          ut: null,
          fv: pd || p.dur || { v: 2, u: 'SEC' }
        },
        ins: [sn[p.A]],
        out: [sn[p.B]],
        st: { acc: 0, out: 0, pre: 0, run: 0 },
        box: { x1: p.cx - 1.5, x2: p.cx + 1.5, y1: p.wy - 1.2, y2: p.wy + 1.2 }
      });
    }
  }
  /* v26 CMP gates: input = analog wire (left net), output = digital wire (right net) */
  CM.forEach(c => {
    if (c.sp === undefined) return;
    const nL = segs[c.Lf].n,
      nR = segs[c.Rt].n;
    if (nL === nR) return;
    gates.push({
      t: 'CMP',
      cmp: c.op,
      eq: c.eq,
      kind: c.kind,
      sp: c.sp,
      spNet: c.spSeg !== undefined ? segs[c.spSeg].n : undefined,
      spVar: c.spVar,
      unit: c.unit,
      sptxt: c.sptxt,
      ins: [nL],
      out: [nR],
      miss: [],
      pp: [],
      box: { x1: c.cx - 3.2, x2: c.cx + 3.2, y1: c.cy - 2.6, y2: c.cy + 2.6 }
    });
  });
  const row = y => sh.rows.findIndex(r => y >= r.y - 3.3 && y < r.y + 5.7),
    src = [],
    outs = [];
  const gOut = new Set();
  gates.forEach(g =>
    (g.out || []).forEach(n => gOut.add(n))
  ); /* v20: a net that a gate drives (e.g. the wire after a pulse timer) cannot also be an input row source */
  const minX = {},
    maxX = {};
  segs.forEach(q => {
    minX[q.n] = Math.min(minX[q.n] === undefined ? 1e9 : minX[q.n], q.x1);
    maxX[q.n] = Math.max(maxX[q.n] === undefined ? -1e9 : maxX[q.n], q.x2);
  });
  for (const e of ends) {
    const i = row(e.y);
    if (i < 0 || e.cut) continue;
    /* v20: a wire START is a free end, or the left-most point of its net (a bend near the cell edge has more wire to its left: DITL-99 row 1 / row 3) */
    if (e.x <= S1 + 2.2) {
      if ((e.free || minX[e.n] >= e.x - 1.5) && !gOut.has(e.n)) src.push({ n: e.n, row: i });
    } else if (e.x >= R0 - 4) {
      if (e.free || maxX[e.n] <= e.x + 1.5) outs.push({ n: e.n, row: i });
    }
  }
  /* v20: pulse glyph drawn right at the cell edge (DITL-21D, 83, 60...): no wire before the glyph, the input row feeds the timer input */
  gates.forEach(g => {
    if (g.t !== 'TMR' || !g.tm || !g.tm.pg || !g.ins.length) return;
    const i = row(g.tm.ay);
    if (i < 0 || src.some(z => z.row === i)) return;
    if (!LEFT.some(c => (sh.cells[i + ':' + c] || []).length)) return;
    if (!src.some(z => z.n === g.ins[0])) src.push({ n: g.ins[0], row: i });
  });
  for (let it = 0, ch = true; ch && it < 8; it++) {
    ch = false;
    const D = new Set(src.map(z => z.n));
    gates.forEach(g => {
      if (g.t === 'NOT' && !g.done) return;
      (g.out || []).forEach(n => D.add(n));
    });
    for (const g of gates)
      if (g.t === 'NOT' && !g.done) {
        const dA = g.A.some(n => D.has(n)),
          dB = g.Bn.some(n => D.has(n));
        if (dA === dB) continue;
        g.done = true;
        ch = true;
        const q = g.Q;
        if (dB) {
          g.rev = true;
          if (g.vert) {
            g.ins = g.Bn;
            g.out = g.A.concat(g.tap || []);
          } else {
            g.ins = at(q.R - 0.7, q.R + 4.1, q.B, q.T);
            g.out = at(q.L - 1.2, q.L + 0.7, q.B, q.T);
          }
        } else if (g.vert && g.tap) {
          g.ins = g.A;
          g.out = g.Bn.concat(g.tap);
        }
      }
  }
  const seg = {};
  segs.forEach(q => (seg[q.k] = q.n));
  const plnet = {};
  for (const k in plk) {
    const f = plk[k].find(kk => seg[kk] !== undefined);
    if (f !== undefined) plnet[k] = seg[f];
  }
  r.so.forEach(([q, l]) => {
    if (l !== 'CON') return;
    const u = [];
    q.forEach(p => {
      if (!u.some(v => Math.hypot(v[0] - p[0], v[1] - p[1]) < 0.05)) u.push(p);
    });
    if (u.length !== 3) return;
    const xs = u.map(p => p[0]),
      x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      w = x1 - x0,
      h = Math.max(...u.map(p => p[1])) - Math.min(...u.map(p => p[1]));
    if (w < 0.8 || w > 5 || h > 3.5) return;
    const lo = u.filter(p => Math.abs(p[0] - x0) < 0.05),
      hi = u.filter(p => Math.abs(p[0] - x1) < 0.05);
    if (lo.length !== 2 || hi.length !== 1) return;
    const tx = hi[0][0],
      ty = hi[0][1],
      gi = gates.findIndex(
        g => tx >= g.box.x1 - 0.8 && tx <= g.box.x1 + 1.5 && ty >= g.box.y1 - 0.5 && ty <= g.box.y2 + 0.5
      );
    if (gi < 0) return;
    const sg = segs.find(z => z.h && Math.abs(z.y1 - ty) < 0.6 && z.x1 <= tx + 0.5 && z.x2 >= tx - 4.5);
    if (!sg) return;
    const g = gates[gi],
      a = g.t === 'FF' ? (ty > (g.box.y1 + g.box.y2) / 2 !== !!g.rt ? g.s : g.r) : g.ins;
    if (!a.includes(sg.n)) a.push(sg.n);
  });
  (sh.pins || []).forEach(p => {
    const g = gOf({ gates }, p),
      n = seg[p.k];
    if (!g || n === undefined) return;
    const a = p.kind === 'in' ? g.ins : p.kind === 'out' ? g.out : p.kind === 's' ? g.s : g.r;
    if (a && !a.includes(n)) a.push(n);
  });
  gates.forEach(g => {
    const b = g.box;
    g.pp = ends
      .filter(
        e =>
          e.y >= b.y1 - 0.7 &&
          e.y <= b.y2 + 0.7 &&
          ((e.x >= b.x1 - 4.3 && e.x <= b.x1 + 0.7) || (e.x >= b.x2 - 0.7 && e.x <= b.x2 + 1.2))
      )
      .map(e => ({ x: e.x, y: e.y, n: e.n }));
  });
  gates.forEach(g => {
    g.miss = (
      g.t === 'FF'
        ? [!g.s.length && 'S input', !g.r.length && 'R input', !g.out.length && 'output']
        : [!g.ins.length && 'input', !g.out.length && 'output']
    ).filter(Boolean);
  });
  const termTx = [...sh.tx, ...Object.values(sh.cells).flat()].filter(t =>
    /^\(?(DC\s*24V|24V\s*DC|DC|24V|0V|COMMON|COM|L1|N|PE|\+|-)\)?$/i.test(t.t)
  );
  const fieldBoxes = [];
  {
    const cs = [];
    r.ln.forEach(q => {
      if (q[4] === 'CEN' && Math.hypot(q[0] - q[2], q[1] - q[3]) < 130)
        cs.push([
          [q[0], q[1]],
          [q[2], q[3]]
        ]);
    });
    r.pl.forEach(([p, c, l]) => {
      if (l === 'CEN') for (let i = 0; i + 1 < p.length; i++) cs.push([p[i], p[i + 1]]);
    });
    const cp = cs.map((_, i) => i),
      cf = i => (cp[i] === i ? i : (cp[i] = cf(cp[i]))),
      cn = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.6;
    cs.forEach((a, i) =>
      cs.forEach((b, j) => {
        if (j > i && a.some(p => b.some(q => cn(p, q)))) cp[cf(i)] = cf(j);
      })
    );
    const cg = {};
    cs.forEach((q, i) => (cg[cf(i)] = cg[cf(i)] || []).push(...q));
    Object.values(cg).forEach(w => {
      const b = {
        x1: Math.min(...w.map(z => z[0])),
        x2: Math.max(...w.map(z => z[0])),
        y1: Math.min(...w.map(z => z[1])),
        y2: Math.max(...w.map(z => z[1]))
      };
      if (b.x2 - b.x1 > 12 && b.y2 - b.y1 > 8 && b.x2 - b.x1 < 200) fieldBoxes.push(b);
    });
  }
  const termA = [];
  const adrTx = [...sh.tx, ...Object.values(sh.cells).flat()].filter(
    t => /^[IO]\.[0-9A-F]{4}|^0\.[0-9A-F]{4}/.test(t.t) && t.x > S1 && t.x < R0 + 2
  );
  const eqPts = [];
  [...sh.tx, ...Object.values(sh.cells).flat()].forEach(t => {
    if (/^\((RED|GREEN)\)$/i.test(t.t) && t.x > S1 && t.x < R0) eqPts.push([t.x + 10, t.y + 1, 18, 4.6]);
    /* MCC / softstarter indicating lamps */ if (/^(H\/|\/L|H\/L|HH\/|\/LL)$/.test(t.t) && t.x > S1 && t.x < R0)
      eqPts.push([t.x, t.y - 3, 8, 9.5]);
    /* v27: also the setpoint input that enters from above (DITL-60) */ if (
      /^MO[PT]-/.test(t.t) &&
      t.x > S1 &&
      t.x < R0
    )
      eqPts.push([t.x, t.y, 9, 5]);
  });
  (sh.syms || []).forEach(z => {
    if (z.k === 'icd') eqPts.push([z.x, z.y, 8, 3.6]);
    else if (z.k === 'hi' || z.k === 'lo')
      eqPts.push([z.x, z.y + 3, 8, 8.5]); /* limit symbol: the limit signal may enter from above (DITL-60) */
    else if (z.k === 'lamp' && z.x > S1 && z.x < R0) eqPts.push([z.x, z.y, 13, 3.8]);
  });
  const cenL = [];
  r.ln.forEach(q => {
    if (q[4] === 'CEN')
      cenL.push([Math.min(q[0], q[2]), Math.min(q[1], q[3]), Math.max(q[0], q[2]), Math.max(q[1], q[3])]);
  });
  r.pl.forEach(([p, c, l]) => {
    if (l === 'CEN')
      for (let i = 0; i + 1 < p.length; i++)
        cenL.push([
          Math.min(p[i][0], p[i + 1][0]),
          Math.min(p[i][1], p[i + 1][1]),
          Math.max(p[i][0], p[i + 1][0]),
          Math.max(p[i][1], p[i + 1][1])
        ]);
  });
  const pentB = r.pl
    .filter(([p]) => p.length >= 5 && p.length <= 8)
    .map(([p]) => {
      const xs = p.map(q => q[0]),
        ys = p.map(q => q[1]);
      return { x1: Math.min(...xs) - 6, x2: Math.max(...xs) + 6, y1: Math.min(...ys) - 4, y2: Math.max(...ys) + 4 };
    });
  const zone = (x, y) =>
      gates.some(g => {
        const b = g.box,
          u = g.bus;
        return (
          (y >= b.y1 - 0.7 &&
            y <= b.y2 + 0.7 &&
            ((x >= b.x1 - 4.3 && x <= b.x1 + 0.7) || (x >= b.x2 - 0.7 && x <= b.x2 + 1.2))) ||
          (u && y >= u.y1 - 2.2 && y <= u.y2 + 2.2 && x >= u.x1 - 4.3 && x <= u.x2 + 1.5) ||
          (g.vert && x >= b.x1 - 0.7 && x <= b.x2 + 0.7 && (Math.abs(y - b.y1) < 2.6 || Math.abs(y - b.y2) < 2.6))
        );
      }) ||
      cons.some(c => Math.hypot(x - c.x, y - c.y) < c.r + 5) ||
      gates.some(
        g =>
          g.t === 'TMR' &&
          g.tm &&
          g.tm.ia !== undefined &&
          ((x >= g.tm.ia - 1 && x <= g.tm.ib + 1) || (x >= g.tm.oa - 1.5 && x <= g.tm.ob + 2.2)) &&
          Math.abs(y - g.tm.ay) < g.tm.rr + 2
      ) ||
      gates.some(g => g.vz && g.vz.some(u => x >= u.x1 && x <= u.x2 && y >= u.y1 && y <= u.y2)) ||
      fbr.some(b => x >= b.x0 - 2.5 && x <= b.x1 + 2.5 && y >= b.y0 - 2.5 && y <= b.y1 + 2.5),
    dist = (x, y, t) => Math.hypot(Math.max(t.x1 - x, 0, x - t.x2), Math.max(t.y1 - y, 0, y - t.y2)),
    dang = [];
  segs.forEach((a, i) =>
    en(a).forEach(([x, y]) => {
      if (segs.some((b, j) => j !== i && on(x, y, b))) return;
      if (dots.some(d => Math.hypot(d[0] - x, d[1] - y) < 0.8)) return;
      if (zone(x, y) || ((x <= S1 + 2.2 || x >= R0 - 4) && row(y) >= 0)) return;
      /* v18: a wire end is NOT loose when it is a real terminal: touches any circle (contact, terminal, connector), points to a field terminal with an arrowhead (DCS output), sits at a DC / 24V / COMMON label, ends inside a dashed field assembly box, or on a pentagon (off-sheet) */
      if (
        r.ci.some(
          c => c[2] > 0.7 && c[2] < 5 && Math.abs(Math.hypot(x - c[0], y - c[1]) - c[2]) < (c[2] < 2.3 ? 2.4 : 1.1)
        )
      )
        return;
      if (
        tri.some(
          a =>
            Math.hypot(a.x - x, a.y - y) < 1.1 ||
            Math.hypot(a.bx - x, a.by - y) < 1.1 ||
            (a.d !== 0
              ? x >= Math.min(a.x, a.bx) - 0.6 && x <= Math.max(a.x, a.bx) + 0.6 && Math.abs(y - a.y) < 1.5
              : y >= Math.min(a.y, a.by) - 0.6 && y <= Math.max(a.y, a.by) + 0.6 && Math.abs(x - a.x) < 1.5)
        )
      )
        return; /* v25: a wire that ends inside the arrowhead is a terminal */
      if (termTx.some(t => x >= t.x - 3 && x <= t.x + 16 && Math.abs(t.y - y) < 8)) return;
      if (fieldBoxes.some(b => x >= b.x1 - 2.5 && x <= b.x2 + 2.5 && y >= b.y1 - 2.5 && y <= b.y2 + 2.5)) return;
      if (pentB.some(b => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2)) return;
      if (cenL.some(q => Math.hypot(Math.max(q[0] - x, 0, x - q[2]), Math.max(q[1] - y, 0, y - q[3])) < 1.2)) return;
      if (eqPts.some(e => Math.abs(e[0] - x) < e[2] && Math.abs(e[1] - y) < e[3])) return;
      if (
        gates.some(
          g =>
            g.box &&
            g.t !== 'TMR' &&
            x >= g.box.x1 - 0.3 &&
            x <= g.box.x2 + 0.3 &&
            y >= g.box.y1 - 0.5 &&
            y <= g.box.y2 + 0.5
        )
      )
        return; /* v27: a wire drawn along / inside a gate box (the part past the arrowhead, DITL-94, 96, 24) */
      {
        const at = adrTx.find(t => t.x >= x - 34 && t.x <= x + 18 && t.y >= y - 7.5 && t.y <= y + 7.5);
        if (at) {
          termA.push({ n: a.n, x, y, lab: at.t });
          return;
        }
      } /* v25: the address label may be written to the LEFT / above the arrow end (DITL-18 DCS outputs of the OR gates) */ /* v21: a gate output that ends at its DCS output address label (O.0093 / 0.0733) is a terminal */ /* v21: ends at a comparator box, a limit symbol, an ICD130 contact or a lamp symbol are terminals */ /* v21: touches a dash-dot (CEN) station / field wiring line */
      if (segs.some((b, j) => j !== i && b.n === a.n && dist(x, y, b) < 3)) return;
      let best = null;
      segs.forEach(b => {
        if (b.n === a.n) return;
        const d = dist(x, y, b);
        if (d < 3 && (!best || d < best.d)) best = { d, b };
      });
      dang.push(
        best
          ? {
              x,
              y,
              k: a.k,
              nk: best.b.k,
              nx: Math.min(Math.max(x, best.b.x1), best.b.x2),
              ny: Math.min(Math.max(y, best.b.y1), best.b.y2)
            }
          : { x, y, k: a.k, nk: -1 }
      );
    })
  );
  /* 2.5.0-beta.11 (DITL PDF audit, DITL-38 MCV OPEN / CLOSE OVERTIME): the function block FB2-OT "REFER TO DWG. NO.: DITL50" is drawn
     on DITL-50 (FUNCTION BLOCK FOR DEVICE OVERTIME ALARM): M.0040 = PULSE TPS_ON(IN_ON_CMD), M.0041 = PULSE TPS_CL(IN_CL_CMD),
     M.0044 = OR(IN_ON_FB, M.0041, IN_SP_CMD), M.0045 = OR(M.0040, IN_CL_FB, IN_SP_CMD), M.0042 = FF(S M.0040, R M.0044),
     M.0043 = FF(S M.0041, R M.0045), OUT_ON_AL = ON DELAY TON_ON(M.0042), OUT_CL_AL = ON DELAY TON_CL(M.0043),
     OUT_FAIL = OR(OUT_ON_AL, OUT_CL_AL). Times from the TIMER SETTING table of the sheet (first column) */
  {
    const all = [...sh.tx, ...Object.values(sh.cells).flat()],
      fb = all.find(t => t.t === 'FB2-OT' && t.x > S1 && t.x < R0);
    if (fb) {
      const pin = (nm, out) => {
          const t = all.find(q => q.t === nm && Math.abs(q.x - fb.x) < 50 && Math.abs(q.y - fb.y) < 25);
          if (!t) return -1;
          const w = segs
            .filter(q => q.h && Math.abs(q.y1 - t.y) < 1.6 && (out ? q.x1 >= t.x - 1 && q.x1 <= t.x + 12 : q.x2 >= t.x - 6 && q.x2 <= t.x + 1))
            .sort((p, q) => Math.abs(p.y1 - t.y) - Math.abs(q.y1 - t.y))[0];
          return w ? w.n : -1;
        },
        tset = nm => {
          const t = all.filter(q => q.t === nm).sort((p, q) => p.x - q.x)[0],
            v = t && all.find(q => /^\d+(\.\d+)?\s*SEC/i.test(q.t) && Math.abs(q.y - t.y) < 0.6 && q.x > t.x && q.x - t.x < 35);
          return { v: v ? parseFloat(v.t) : nm.startsWith('TPS') ? 2 : 10, u: 'SEC' };
        },
        P = {};
      ['IN_ON_CMD', 'IN_ON_FB', 'IN_CL_CMD', 'IN_CL_FB', 'IN_SP_CMD'].forEach(k => (P[k] = pin(k, 0)));
      ['OUT_ON_AL', 'OUT_FAIL', 'OUT_CL_AL'].forEach(k => (P[k] = pin(k, 1)));
      if (Object.values(P).every(v => v >= 0)) {
        const m40 = n++, m41 = n++, m42 = n++, m43 = n++, m44 = n++, m45 = n++,
          bx = { x1: fb.x - 30, x2: fb.x + 30, y1: fb.y - 12, y2: fb.y + 14 },
          tmr = (k, key, fv, i, o) =>
            gates.push({
              t: 'TMR',
              k,
              tm: { lab: k === 'on' ? 'ON DELAY' : 'PULSE', key: 'FB2-OT ' + key, tag: key, ax: fb.x, ay: fb.y, rr: 1.5, bx1: fb.x - 1.5, bx2: fb.x + 1.5, nt: null, ut: null, fb2: 1, fv: (sh.pdur && sh.pdur['FB2-OT ' + key]) || fv },
              ins: [i],
              out: [o],
              st: { acc: 0, out: 0, pre: 0, run: 0 },
              box: bx,
              fb2: 1
            });
        tmr('pulse', 'TPS_ON', tset('TPS_ON'), P.IN_ON_CMD, m40);
        tmr('pulse', 'TPS_CL', tset('TPS_CL'), P.IN_CL_CMD, m41);
        gates.push({ t: 'OR', bar: -1, ins: [P.IN_ON_FB, m41, P.IN_SP_CMD], out: [m44], box: bx, fb2: 1 });
        gates.push({ t: 'OR', bar: -1, ins: [m40, P.IN_CL_FB, P.IN_SP_CMD], out: [m45], box: bx, fb2: 1 });
        gates.push({ t: 'FF', s: [m40], r: [m44], q: 0, out: [m42], box: bx, fb2: 1 });
        gates.push({ t: 'FF', s: [m41], r: [m45], q: 0, out: [m43], box: bx, fb2: 1 });
        tmr('on', 'TON_ON', tset('TON_ON'), m42, P.OUT_ON_AL);
        tmr('on', 'TON_CL', tset('TON_CL'), m43, P.OUT_CL_AL);
        gates.push({ t: 'OR', bar: -1, ins: [P.OUT_ON_AL, P.OUT_CL_AL], out: [P.OUT_FAIL], box: bx, fb2: 1 });
        gates.forEach(g => {
          if (g.fb2 && !g.pp) {
            g.pp = [];
            g.miss = [];
          }
        });
      }
    }
  }
  const NL = {
    v: 10,
    split: PG.filter(p => p.A).map(p => ({ k: p.hk, cx: p.cx, a: p.A, b: p.B })),
    healed,
    n,
    seg,
    gates,
    src,
    outs,
    dang,
    plnet,
    dots: dots.map(d => {
      const q = segs.find(z => on(d[0], d[1], z, 0.8));
      return { x: d[0], y: d[1], n: q ? q.n : -1 };
    }),
    segs: segs.map(q => ({ k: q.k, h: q.h, x1: q.x1, x2: q.x2, y1: q.y1, y2: q.y2, n: q.n }))
  }; /* v26 analog inputs: one per left net of the CMP gates; default value = a normal value that leaves every comparator of that net OFF */
  {
    const by = {};
    NL.gates.forEach((g, gi) => {
      if (g.t === 'CMP') {
        (by[g.ins[0]] = by[g.ins[0]] || []).push(gi);
        if (g.spNet !== undefined) (by[g.spNet] = by[g.spNet] || []).push(gi);
      }
    });
    NL.an = [];
    NL.anRows = new Set();
    for (const n in by) {
      const gs = by[n].map(i => NL.gates[i]),
        asIn = gs.filter(g => g.ins[0] === +n),
        asSp = gs.filter(g => g.spNet === +n),
        num = asIn.filter(g => g.spNet === undefined),
        hs = num.filter(g => g.cmp === '>').map(g => g.sp),
        ls = num.filter(g => g.cmp === '<').map(g => g.sp);
      let def;
      if (asIn.length && !num.length) def = asIn.some(g => g.cmp === '>') ? 0 : 100;
      else if (!asIn.length)
        def = asSp.some(g => g.cmp === '>') ? 100 : 0; /* limit signals sit above (H) / below (L) the measured value */
      else if (hs.length && ls.length) def = (Math.min(...hs) + Math.max(...ls)) / 2;
      else if (hs.length) {
        const m = Math.min(...hs);
        def = m > 0 ? m * 0.5 : m - 1;
      } else {
        const m = Math.max(...ls);
        def = m >= 0 ? (m === 0 ? 1 : m * 1.5) : m + 1;
      }
      const rows = [
          ...new Set(
            src.filter(z => z.n === +n && LEFT.some(c => (sh.cells[z.row + ':' + c] || []).length)).map(z => z.row)
          )
        ],
        r0 = rows[0];
      const lab =
          r0 !== undefined
            ? (sh.cells[r0 + ':S'] || [])
                .map(t => t.t)
                .join(' ')
                .replace(/\\s+/g, ' ')
                .trim()
            : '',
        tag =
          r0 !== undefined
            ? (sh.cells[r0 + ':T'] || [])
                .map(t => t.t)
                .join(' ')
                .trim()
            : '';
      const key =
        r0 !== undefined
          ? 'r' + sh.rows[r0].n
          : 'n' + gs[0].box.x1.toFixed(0) + ',' + gs[0].box.y1.toFixed(0) + (asSp.length && !asIn.length ? 's' : '');
      NL.an.push({
        key,
        net: +n,
        row: r0 !== undefined ? r0 : -1,
        label: (tag ? tag + ' ' : '') + lab,
        unit: (gs.find(g => g.unit) || {}).unit || '',
        def: +def.toFixed(2),
        g: by[n]
      });
      if (r0 !== undefined && rows.length === 1) NL.anRows.add(r0);
    }
  }
  NL.mv = movModel(sh, NL);
  NL.mir = mirModel(sh, NL);
  /* 2.5.0-beta.11 (DITL PDF audit, DITL-35 rows 6 / 9 "M.0172" / "-M.0172"): an address written on the start of an input wire is that
     signal; the same address with a leading minus on another input wire is the same bit inverted (row 9 = NOT row 6) */
  {
    const w = sh.tx
      .filter(t => /^-?[IMB]\.[0-9A-F]{4}$/.test(t.t.trim()) && t.x > S1 - 2 && t.x < S1 + 10)
      .map(t => {
        const z = NL.src
          .map(z => ({ z, q: segs.find(q => q.n === z.n && q.h && Math.abs(q.y1 - t.y) < 2 && q.x1 < t.x + 2) }))
          .filter(o => o.q)
          .sort((a, b) => Math.abs(a.q.y1 - t.y) - Math.abs(b.q.y1 - t.y))[0];
        return z && { neg: t.t.trim()[0] === '-', adr: t.t.trim().replace(/^-/, ''), z: z.z };
      })
      .filter(Boolean);
    w.filter(o => o.neg).forEach(o => {
      const p = w.find(q => !q.neg && q.adr === o.adr);
      if (p && p.z.row !== o.z.row && !NL.mir.some(m => m.row === o.z.row)) NL.mir.push({ row: o.z.row, n: p.z.n, adr: '-' + o.adr, neg: 1 });
    });
  }
  /* v28: a numbered circle in the FROM column of an input row = the signal comes from the connector with the same number in the logic (DITL-21A row 5 <- (4) <- end of the row 26 wire): the row follows that net, it is not a hand switch */
  cons
    .filter(c => c.i < 0 && c.x < S1 - 1)
    .forEach(c => {
      const peer = cons.find(o => o.num === c.num && o.i >= 0 && o.x > S1);
      if (!peer) return;
      const ri = row(c.y);
      if (ri < 0 || !NL.src.some(z => z.row === ri) || NL.mir.some(m => m.row === ri)) return;
      NL.mir.push({ row: ri, n: segs[peer.i].n, adr: 'conn ' + c.num });
    });
  /* 2.5.0-beta.11 (DITL PDF audit, DITL-25A / 25B (1), 26A / 26B (A) (B), 76 / 77 (6) (7)): a numbered connector that appears ONCE
     on the sheet, with "FROM DITL-xx" or "TO DITL-xx" written beside it, is the same wire as the connector with the same number on that
     sheet (off-sheet connector). simSheet reads the other sheet's net into the FROM side */
  NL.xcon = [];
  {
    const all = [...sh.tx, ...Object.values(sh.cells).flat()],
      ref = all.filter(t => /^\(?\s*(FROM|TO)\s+DITL-?\s*([0-9]{1,3}[A-Z]?)\s*\)?$/i.test(t.t.trim()));
    cons
      .filter(c => c.i >= 0 && cons.filter(o => o.num === c.num).length === 1)
      .forEach(c => {
        const t = ref
          .map(q => ({ q, d: Math.hypot(q.x - c.x, q.y - c.y) }))
          .filter(o => (o.d < 16 || (Math.abs(o.q.y - c.y) < 6 && o.d < 28)) && !cons.some(z => z !== c && Math.hypot(o.q.x - z.x, o.q.y - z.y) < o.d))
          .sort((a, b) => a.d - b.d)[0];
        if (!t) return;
        const m = /(FROM|TO)\s+DITL-?\s*([0-9]{1,3}[A-Z]?)/i.exec(t.q.t);
        NL.xcon.push({ num: c.num, n: segs[c.i].n, dir: m[1].toUpperCase() === 'FROM' ? 'in' : 'out', peer: m[2].toUpperCase(), x: c.x, y: c.y });
      });
  }
  /* 2.5.0-beta.11 (DITL PDF audit, DITL-29A row 61 'MOP-P1501A = "1"', DITL-76 / 77 'MOP-P1108A DEFAULT "1"'): a start permission
     written as a constant 1 at the start of a wire is 1 (before, no driver: the AND before the run FF stayed 0, the pump could not start) */
  NL.one = [];
  {
    const gO = new Set();
    gates.forEach(g => (g.out || []).forEach(n => gO.add(n)));
    [...sh.tx, ...Object.values(sh.cells).flat()]
      .filter(t => /(DEFAULT\s*|=\s*)["“”]?1["“”]?\s*$/i.test(t.t) && t.x > S1 && t.x < R0)
      .forEach(t => {
        const w = segs
          .filter(q => q.h && q.x1 >= t.x - 4 && q.x1 <= t.x + 4 && q.y1 <= t.y + 1 && q.y1 >= t.y - 5 && !gO.has(q.n) && !NL.src.some(z => z.n === q.n))
          .sort((a, b) => Math.abs(a.y1 - t.y) - Math.abs(b.y1 - t.y))[0];
        if (w && !NL.one.includes(w.n)) NL.one.push(w.n);
      });
  }
  NL.ind = [];
  NL.mot = motModel(sh, NL);
  NL.usr = usrModel(sh, NL);
  NL.usr = NL.usr.concat(fieldInModel(sh, NL, NL.usr));
  NL.grp = grpModel(sh, NL);
  /* v21: the wire that ends at an equipment block (MOV / SV command, motor start / stop / running, test switch) is a terminal, not a loose end */
  {
    const cmd = new Set();
    NL.mv.forEach(b => {
      if (b.open) cmd.add(b.open.n);
      if (b.close) cmd.add(b.close.n);
    });
    NL.mot.forEach(m => {
      cmd.add(m.mor);
      if (m.mos >= 0) cmd.add(m.mos);
      cmd.add(m.mir);
    });
    NL.usr.forEach(u => cmd.add(u.n));
    NL.ind.forEach(m => cmd.add(m.n));
    /* v26 field outputs: an arrowhead that does not enter a gate, a timer, a comparator, a connector or a right-hand cell is a DCS output going to the field (DITL-18 outputs to the LCP lamps, SV coil circuits, MOV / MCC command). The indicator at its tip shows whether the DCS output is ON; a lamp symbol on the same level lights with it. */
    NL.term = [];
    {
      const gOut = new Set(),
        srcN = new Set(src.map(z => z.n));
      gates.forEach(g => (g.out || []).forEach(n => gOut.add(n)));
      const lamps = (sh.syms || [])
        .filter(z => z.k === 'lamp' && z.x > S1 && z.x + 6 < R0 - 10)
        .map(z => ({
          x: z.x + 6,
          y: z.y - 4.3,
          sx: z.x,
          sy: z.y
        })); /* centre of the lamp symbol (block box x 1.5..10.5, y -7.3..-1.3) */
      const inBox = (P, b, m) => P[0] >= b.x1 - m && P[0] <= b.x2 + m && P[1] >= b.y1 - m && P[1] <= b.y2 + m;
      tri.forEach(t => {
        const tip = [t.x, t.y],
          P = [t.x + (t.d || 0) * 1.1, t.y + (t.v || 0) * 1.1];
        if (t.x >= R0 - 6 || t.x <= S1 + 2) return;
        if (
          gates.some(g => g.box && inBox(P, g.box, 1.6)) ||
          gates.some(g => g.vz && g.vz.some(u => P[0] >= u.x1 && P[0] <= u.x2 && P[1] >= u.y1 && P[1] <= u.y2)) ||
          cons.some(c => Math.hypot(c.x - P[0], c.y - P[1]) < c.r + 3)
        )
          return;
        const sg = segs.find(q =>
          q.h
            ? Math.hypot(q.x1 - t.bx, q.y1 - t.by) < 1.6 || Math.hypot(q.x2 - t.bx, q.y1 - t.by) < 1.6
            : Math.hypot(q.x1 - t.bx, q.y1 - t.by) < 1.6 || Math.hypot(q.x1 - t.bx, q.y2 - t.by) < 1.6
        );
        if (!sg || (!gOut.has(sg.n) && !srcN.has(sg.n))) return;
        const lab = [...sh.tx, ...Object.values(sh.cells).flat()]
          .filter(
            q =>
              /^([O0]\.[0-9A-F]{4}|[A-Z]{1,3}\d?-[A-Z0-9]{2,}-?[A-Z0-9-]*)/.test(q.t) &&
              Math.abs(q.y - t.y) < 8 &&
              q.x > t.x - 40 &&
              q.x < t.x + 12
          )
          .sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y))[0];
        const lp = lamps
          .filter(l => l.x > t.x && Math.abs(l.y - t.y) < 7.5 && l.x - t.x < 200)
          .sort((a, b) => a.x - b.x)[0];
        if (!NL.term.some(o => o.n === sg.n && Math.abs(o.x - t.x) < 2 && Math.abs(o.y - t.y) < 2))
          NL.term.push({ n: sg.n, x: t.x, y: t.y, lab: lab ? lab.t : '', lamp: lp ? { x: lp.x, y: lp.y } : null });
      });
      /* a gate output that nobody consumes and that ends at a DCS output address label (O.0093 / 0.0733) is a field output (DITL-18 ORs -> LCP lamps) */
      {
        const used = new Set();
        gates.forEach(g => {
          [...(g.ins || []), ...(g.s || []), ...(g.r || [])].forEach(n => used.add(n));
        });
        outs.forEach(o => used.add(o.n));
        gates.forEach(g => {
          (g.out || []).forEach(n => {
            if (used.has(n)) return;
            const pts = [];
            segs
              .filter(q => q.n === n)
              .forEach(q => {
                pts.push([q.x1, q.y1]);
                pts.push([q.h ? q.x2 : q.x1, q.h ? q.y1 : q.y2]);
              });
            if (!pts.length) return;
            const e = pts.reduce((a, p2) => (p2[0] > a[0] ? p2 : a), pts[0]);
            const at = adrTx.find(
              q => q.x >= e[0] - 34 && q.x <= e[0] + 18 && Math.abs(q.y - e[1]) < 7.5 && /^[O0]\./.test(q.t)
            );
            if (at) termA.push({ n, x: e[0], y: e[1], lab: at.t });
          });
        });
      }
      termA.forEach(o => {
        if (!gOut.has(o.n) && !srcN.has(o.n)) return;
        if (NL.term.some(q => q.n === o.n && Math.abs(q.x - o.x) < 3 && Math.abs(q.y - o.y) < 3)) return;
        const lp = lamps
          .filter(l => l.x > o.x && Math.abs(l.y - o.y) < 7.5 && l.x - o.x < 200)
          .sort((a, b) => a.x - b.x)[0];
        NL.term.push({ n: o.n, x: o.x, y: o.y, lab: o.lab, lamp: lp ? { x: lp.x, y: lp.y } : null });
      });
      /* lamps drawn inside the sheet (MCC GREEN / RED): lit when a live wire touches them */
      NL.lamps = lamps.map(l => {
        const near = segs
          .filter(q =>
            q.h
              ? Math.abs(q.y1 - l.y) < 2.6 && q.x2 >= l.sx - 0.5 && q.x1 <= l.sx + 12
              : q.x1 >= l.sx - 0.5 && q.x1 <= l.sx + 12 && q.y1 <= l.y + 2.6 && q.y2 >= l.y - 2.6
          )
          .map(q => q.n);
        return {
          x: l.x,
          y: l.y,
          nets: [...new Set(near)],
          linked: NL.term.some(o => o.lamp && Math.abs(o.lamp.x - l.x) < 0.5 && Math.abs(o.lamp.y - l.y) < 0.5)
        };
      });
    }
    const kn = {};
    segs.forEach(q => (kn[q.k] = q.n));
    NL.dang = NL.dang.filter(
      d =>
        !cmd.has(kn[d.k]) &&
        !NL.usr.some(u => d.x >= u.pent[0] && d.x <= u.pent[1] && d.y >= u.pent[2] && d.y <= u.pent[3])
    );
  }
  return NL;
}
