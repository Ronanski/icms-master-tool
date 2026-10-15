/* ===== ANALOG builder part 1: shapes, digital gate bodies, glyphs, wires, nets ===== */
const BARMAX = 200;
const anD = (a, b, c, d) => Math.hypot(a - c, b - d);
function anPtSeg(px, py, s) {
  const dx = s.x2 - s.x1,
    dy = s.y2 - s.y1,
    l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - s.x1) * dx + (py - s.y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (s.x1 + t * dx), py - (s.y1 + t * dy));
}
function anBuild(R, name) {
  const S = { name, seg: [], shp: [], gate: [], dot: [], nets: [], tx: R.tx, warn: [], R };
  const isH = s => Math.abs(s.y1 - s.y2) < 0.06,
    isV = s => Math.abs(s.x1 - s.x2) < 0.06,
    len = s => anD(s.x1, s.y1, s.x2, s.y2);
  /* dots: closed 2-vertex donuts + pairs of tiny arcs */
  S.dot = R.dot.map(d => ({ x: d.x, y: d.y, r: Math.max(d.r, 0.8) }));
  for (const c of R.ci)
    if (/^MEM$/i.test(c.l) && c.r <= 2.2 && !S.dot.some(d => anD(d.x, d.y, c.x, c.y) < 0.8))
      S.dot.push({ x: c.x, y: c.y, r: Math.max(c.r, 0.8) });
  {
    const g = {};
    for (const a of R.ar)
      if (a.r < 1.4) {
        const k = Math.round(a.x / 0.5) + ',' + Math.round(a.y / 0.5);
        (g[k] = g[k] || []).push(a);
      }
    for (const k in g)
      if (g[k].length >= 2 && !S.dot.some(d => anD(d.x, d.y, g[k][0].x, g[k][0].y) < 0.8))
        S.dot.push({ x: g[k][0].x, y: g[k][0].y, r: 1.2 });
  }
  /* shapes from closed polylines */
  for (const s of R.pl) {
    const xs = s.p.map(q => q[0]),
      ys = s.p.map(q => q[1]),
      x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys),
      w = x1 - x0,
      h = y1 - y0;
    if (w < 2 || h < 1.5) continue;
    let ty = 'poly';
    const n = s.p.length;
    if (n === 4) {
      const ax = s.p.every((q, i) => {
        const r = s.p[(i + 1) % 4];
        return Math.abs(q[0] - r[0]) < 0.1 || Math.abs(q[1] - r[1]) < 0.1;
      });
      const dg = s.p.every((q, i) => {
        const r = s.p[(i + 1) % 4];
        return (
          Math.abs(Math.abs(q[0] - r[0]) - Math.abs(q[1] - r[1])) < Math.max(w, h) * 0.15 && Math.abs(q[0] - r[0]) > 0.3
        );
      });
      ty = ax ? 'rect' : dg ? 'dia' : 'quad';
    } else if (n === 3) ty = 'tri';
    else if (n >= 5 && n <= 7) ty = 'flag';
    S.shp.push({ p: s.p, x0, y0, x1, y1, w, h, ty, l: s.l, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
  }
  const inb = (sh, x, y, m = 0) => x >= sh.x0 - m && x <= sh.x1 + m && y >= sh.y0 - m && y <= sh.y1 + m;
  /* wire candidates */
  const SG = R.seg.filter(s => len(s) > 0.05 && !/圖框|FRAME/i.test(s.l)).map((s, i) => ({ ...s, i, use: 0, net: -1 }));
  /* rectangles drawn as separate lines (edges may be split in pieces by a wire joining at the middle) */
  {
    const E = 0.4,
      runs = (isX, key, lo, hi) => {
        const m = new Map();
        for (const s of SG.filter(isX)) {
          if (s.use) continue;
          const k = Math.round(s[key] / 0.2);
          (m.get(k) || m.set(k, []).get(k)).push(s);
        }
        const out = [];
        for (const L of m.values()) {
          L.sort((p, q) => Math.min(p[lo], p[hi]) - Math.min(q[lo], q[hi]));
          let cur = null;
          for (const s of L) {
            const a = Math.min(s[lo], s[hi]),
              b = Math.max(s[lo], s[hi]);
            if (cur && a <= cur.b + 0.15) {
              cur.b = Math.max(cur.b, b);
              cur.parts.push(s);
            } else {
              cur = { c: s[key], a, b, parts: [s] };
              out.push(cur);
            }
          }
        }
        return out;
      },
      HR = runs(isH, 'y1', 'x1', 'x2'),
      VR = runs(isV, 'x1', 'y1', 'y2');
    const cover = (R, c, xa, xb) =>
      R.filter(r => Math.abs(r.c - c) < E && r.a <= xb + E && r.b >= xa - E).some(r => r.a <= xa + E && r.b >= xb - E);
    const sorted = VR.filter(r => r.b - r.a >= 2.4 && r.b - r.a <= 40).sort((p, q) => p.a - q.a);
    for (let i = 0; i < sorted.length; i++) {
      const l = sorted[i];
      if (l.done) continue;
      for (let j = 0; j < sorted.length; j++) {
        const r = sorted[j];
        if (r === l || r.done || r.c - l.c < 2.4 || r.c - l.c > 40) continue;
        if (Math.abs(r.a - l.a) > E || Math.abs(r.b - l.b) > E) continue;
        if (cover(HR, l.a, l.c, r.c) && cover(HR, l.b, l.c, r.c)) {
          const xa = l.c,
            xb = r.c,
            ys = l.a,
            yt = l.b;
          S.shp.push({
            p: [
              [xa, ys],
              [xb, ys],
              [xb, yt],
              [xa, yt]
            ],
            x0: xa,
            y0: ys,
            x1: xb,
            y1: yt,
            w: xb - xa,
            h: yt - ys,
            ty: 'rect',
            l: l.parts[0].l,
            cx: (xa + xb) / 2,
            cy: (ys + yt) / 2,
            fromLines: 1
          });
          l.parts.concat(r.parts).forEach(q => (q.use = 3));
          HR.filter(h => (Math.abs(h.c - ys) < E || Math.abs(h.c - yt) < E) && h.a <= xb + E && h.b >= xa - E).forEach(
            h =>
              h.parts.forEach(q => {
                if (Math.min(q.x1, q.x2) >= xa - E && Math.max(q.x1, q.x2) <= xb + E) q.use = 3;
              })
          );
          l.done = r.done = 1;
          break;
        }
      }
    }
    const D = SG.filter(s => !s.use && !isH(s) && !isV(s) && len(s) >= 3 && len(s) <= 20);
    for (const a of D) {
      if (a.use === 3) continue;
      const ends = [
        [a.x1, a.y1],
        [a.x2, a.y2]
      ];
      /* chain 4 diagonal lines into a rhombus */
      const path = [a],
        tryNext = (pt, from) =>
          D.find(
            q =>
              q.use !== 3 &&
              !path.includes(q) &&
              (anD(q.x1, q.y1, pt[0], pt[1]) < E || anD(q.x2, q.y2, pt[0], pt[1]) < E)
          );
      let pt = ends[1];
      for (let k = 0; k < 3; k++) {
        const q = tryNext(pt);
        if (!q) break;
        path.push(q);
        pt = anD(q.x1, q.y1, pt[0], pt[1]) < E ? [q.x2, q.y2] : [q.x1, q.y1];
      }
      if (path.length === 4 && anD(pt[0], pt[1], ends[0][0], ends[0][1]) < E) {
        const P = [];
        let c = ends[1];
        P.push(ends[0]);
        P.push(ends[1]);
        let cur = ends[1];
        for (let k = 1; k < 4; k++) {
          const q = path[k];
          const nx = anD(q.x1, q.y1, cur[0], cur[1]) < E ? [q.x2, q.y2] : [q.x1, q.y1];
          if (k < 3) P.push(nx);
          cur = nx;
        }
        const xs = P.map(q => q[0]),
          ys = P.map(q => q[1]),
          x0 = Math.min(...xs),
          x1 = Math.max(...xs),
          y0 = Math.min(...ys),
          y1 = Math.max(...ys);
        if (x1 - x0 > 4 && y1 - y0 > 4 && x1 - x0 < 30 && Math.abs(x1 - x0 - (y1 - y0)) < (x1 - x0) * 0.35) {
          S.shp.push({
            p: P,
            x0,
            y0,
            x1,
            y1,
            w: x1 - x0,
            h: y1 - y0,
            ty: 'dia',
            l: a.l,
            cx: (x0 + x1) / 2,
            cy: (y0 + y1) / 2,
            fromLines: 1
          });
          path.forEach(q => (q.use = 3));
        }
      }
    }
  }
  /* glyph lines inside small shapes are not wires */
  for (const sh of S.shp) {
    if (sh.w > 34 || sh.h > 34) continue;
    for (const s of SG) if (!s.use && inb(sh, s.x1, s.y1, 0.25) && inb(sh, s.x2, s.y2, 0.25)) s.use = 1;
  }
  /* control valve = bowtie: two triangles tip to tip (4 diagonals meeting in one point + 2 parallel sides). Not wires. */
  S.valves = [];
  {
    const D = SG.filter(s => !s.use && !isH(s) && !isV(s) && len(s) > 3 && len(s) < 30),
      E4 = 0.4,
      ends = [];
    for (const s of D) {
      ends.push([s.x1, s.y1, s]);
      ends.push([s.x2, s.y2, s]);
    }
    for (const p of ends) {
      const g = ends.filter(q => anD(q[0], q[1], p[0], p[1]) < E4);
      if (g.length !== 4) continue;
      const segs = [...new Set(g.map(q => q[2]))];
      if (segs.length !== 4 || segs.some(q => q.use)) continue;
      const far = segs.map(s => (anD(s.x1, s.y1, p[0], p[1]) < E4 ? [s.x2, s.y2] : [s.x1, s.y1])),
        xs = far.map(q => q[0]),
        ys = far.map(q => q[1]),
        x0 = Math.min(...xs),
        x1 = Math.max(...xs),
        y0 = Math.min(...ys),
        y1 = Math.max(...ys);
      const vx = new Set(xs.map(x => Math.round(x / 0.5))).size === 2,
        hy = new Set(ys.map(y => Math.round(y / 0.5))).size === 2;
      if (!vx && !hy) continue;
      if (x1 - x0 < 3 || y1 - y0 < 3) continue;
      const onFar = (x, y) => far.some(q => anD(q[0], q[1], x, y) < E4),
        sides = SG.filter(s => !s.use && (vx ? isV(s) : isH(s)) && onFar(s.x1, s.y1) && onFar(s.x2, s.y2));
      if (sides.length < 1) continue;
      segs.forEach(s => (s.use = 1));
      sides.forEach(s => (s.use = 1));
      S.valves.push({
        x: p[0],
        y: p[1],
        x0,
        y0,
        x1,
        y1,
        tri: vx
          ? [
              [
                [x0, y0],
                [p[0], p[1]],
                [x0, y1]
              ],
              [
                [x1, y0],
                [p[0], p[1]],
                [x1, y1]
              ]
            ]
          : [
              [
                [x0, y0],
                [p[0], p[1]],
                [x1, y0]
              ],
              [
                [x0, y1],
                [p[0], p[1]],
                [x1, y1]
              ]
            ]
      });
    }
  }
  /* pill (rounded box): two facing arcs + two horizontal lines joining their ends = one symbol, the lines are not wires */
  S.pills = [];
  {
    const ep = a => {
        const t = v => (v * Math.PI) / 180;
        return [
          [a.x + a.r * Math.cos(t(a.a0)), a.y + a.r * Math.sin(t(a.a0))],
          [a.x + a.r * Math.cos(t(a.a1)), a.y + a.r * Math.sin(t(a.a1))]
        ];
      },
      nr = (p, q) => anD(p[0], p[1], q[0], q[1]) < 0.8,
      AR = R.ar.filter(a => a.r >= 2 && a.r <= 20),
      used = new Set();
    for (const L of AR) {
      if (used.has(L)) continue;
      for (const Q of AR) {
        if (Q === L || used.has(Q) || Math.abs(L.y - Q.y) > 0.3 || Math.abs(L.r - Q.r) > 0.3 || Q.x <= L.x + 2)
          continue;
        const el = ep(L),
          er = ep(Q),
          lt = el[0][1] > el[1][1] ? el[0] : el[1],
          lb = el[0][1] > el[1][1] ? el[1] : el[0],
          rt = er[0][1] > er[1][1] ? er[0] : er[1],
          rb = er[0][1] > er[1][1] ? er[1] : er[0];
        const find = (p, q) =>
          SG.find(
            s =>
              !s.use &&
              isH(s) &&
              ((nr([s.x1, s.y1], p) && nr([s.x2, s.y2], q)) || (nr([s.x2, s.y2], p) && nr([s.x1, s.y1], q)))
          );
        const top = find(lt, rt),
          bot = find(lb, rb);
        if (top && bot) {
          top.use = 1;
          bot.use = 1;
          used.add(L);
          used.add(Q);
          S.pills.push({ x0: L.x - L.r, x1: Q.x + Q.r, y0: Math.min(lb[1], rb[1]), y1: Math.max(lt[1], rt[1]) });
          break;
        }
      }
    }
  }
  /* hatch marks of a pneumatic line: two tiny parallel diagonals across a longer wire = symbol, not wires */
  S.hatch = [];
  {
    const T = SG.filter(s => !s.use && !isH(s) && !isV(s) && len(s) < 3.6),
      LW = SG.filter(s => !s.use && len(s) >= 6 && (isH(s) || isV(s)));
    for (const a of T) {
      if (a.use) continue;
      const mx = (a.x1 + a.x2) / 2,
        my = (a.y1 + a.y2) / 2;
      const w = LW.find(l => anPtSeg(mx, my, l) < 0.9);
      if (!w) continue;
      const b = T.find(
        q =>
          q !== a &&
          !q.use &&
          Math.abs((q.x1 + q.x2) / 2 - mx) < 1.8 &&
          Math.abs((q.y1 + q.y2) / 2 - my) < 1.8 &&
          anPtSeg((q.x1 + q.x2) / 2, (q.y1 + q.y2) / 2, w) < 0.9
      );
      if (b) {
        a.use = 1;
        b.use = 1;
        a.hatch = 1;
        b.hatch = 1;
      }
    }
  }
  /* actuator head of a valve: half disc (arc 180 degrees, not on the timer layer) + its straight chord */
  S.heads = [];
  for (const a of R.ar) {
    if (Math.abs(((a.a1 - a.a0 + 360) % 360) - 180) > 8 || a.r < 3 || a.r > 10 || /^CON$/i.test(a.l)) continue;
    const up = (a.a0 < 8 || a.a0 > 352) && Math.abs(a.a1 - 180) < 8,
      dn = Math.abs(a.a0 - 180) < 8 && (a.a1 > 352 || a.a1 < 8);
    if (!up && !dn) continue;
    const ch = SG.find(
      s =>
        !s.use &&
        isH(s) &&
        Math.abs(s.y1 - a.y) < 0.4 &&
        Math.abs(len(s) - 2 * a.r) < 1.2 &&
        Math.abs((s.x1 + s.x2) / 2 - a.x) < 0.8
    );
    if (!ch) continue;
    ch.use = 1;
    S.heads.push({ x: a.x, y: a.y, r: a.r, up });
  }
  /* digital gate bodies on CON: bar + (square | circle) */
  const bars = [];
  for (const s of SG) {
    if (s.use || !/(CON$|^DCS-LP$|^0$)/i.test(s.l)) continue;
    const L = len(s);
    if (L < 6 || L > BARMAX) continue;
    if (isV(s) || isH(s)) bars.push(s);
  }
  const CIc = R.ci.filter(
    c =>
      /(CON$|^DCS-LP$|^0$)/i.test(c.l) &&
      c.r > 2.5 &&
      c.r < 7.2 &&
      (/CON$/i.test(c.l) || !R.tx.some(q => Math.hypot(q.x - c.x, q.y - c.y) <= c.r))
  );
  for (const b of bars) {
    if (b.use) continue;
    const v = isV(b),
      a0 = v ? Math.min(b.y1, b.y2) : Math.min(b.x1, b.x2),
      a1 = v ? Math.max(b.y1, b.y2) : Math.max(b.x1, b.x2),
      bp = v ? b.x1 : b.y1;
    /* circle tangent to the bar -> OR */
    for (const c of CIc) {
      const side = v
        ? Math.abs(c.x - c.r - bp) < 0.7
          ? 1
          : Math.abs(c.x + c.r - bp) < 0.7
            ? -1
            : 0
        : Math.abs(c.y - c.r - bp) < 0.7
          ? 1
          : Math.abs(c.y + c.r - bp) < 0.7
            ? -1
            : 0;
      const along = v ? c.y : c.x;
      if (side && along >= a0 - 0.5 && along <= a1 + 0.5) {
        const pg = c.used ? S.gate.find(q => q.k === 'OR' && q.body && q.body.cx === c.x && q.body.cy === c.y) : null;
        if (pg) {
          pg.a0 = Math.min(pg.a0, a0);
          pg.a1 = Math.max(pg.a1, a1);
          pg.used.push(b);
          b.use = 2;
          break;
        }
        S.gate.push({
          k: 'OR',
          v,
          bar: b,
          bp,
          a0,
          a1,
          side,
          out: v ? { x: c.x + side * c.r, y: c.y } : { x: c.x, y: c.y + side * c.r },
          body: { cx: c.x, cy: c.y, r: c.r },
          used: [b]
        });
        b.use = 2;
        c.used = 1;
        break;
      }
    }
    if (b.use) continue;
    /* small square attached to the bar -> AND */
    const hs = SG.filter(
      s =>
        !s.use &&
        s !== b &&
        /(CON$|^DCS-LP$|^0$)/i.test(s.l) &&
        (v ? isH(s) : isV(s)) &&
        len(s) > 3 &&
        len(s) < 8 &&
        (v
          ? (Math.abs(s.x1 - bp) < 0.5 || Math.abs(s.x2 - bp) < 0.5) &&
            Math.min(s.y1, s.y2) >= a0 - 0.5 &&
            Math.max(s.y1, s.y2) <= a1 + 0.5
          : (Math.abs(s.y1 - bp) < 0.5 || Math.abs(s.y2 - bp) < 0.5) &&
            Math.min(s.x1, s.x2) >= a0 - 0.5 &&
            Math.max(s.x1, s.x2) <= a1 + 0.5)
    );
    if (hs.length >= 2) {
      const t = hs[0],
        u = hs[1];
      const sd = v ? ((t.x1 + t.x2) / 2 > bp ? 1 : -1) : (t.y1 + t.y2) / 2 > bp ? 1 : -1;
      const far = v
        ? sd > 0
          ? Math.max(t.x1, t.x2)
          : Math.min(t.x1, t.x2)
        : sd > 0
          ? Math.max(t.y1, t.y2)
          : Math.min(t.y1, t.y2);
      const mid = v ? (t.y1 + u.y1) / 2 : (t.x1 + u.x1) / 2;
      /* closing line at the far end */
      const cl = SG.find(
        s =>
          !s.use &&
          s !== b &&
          (v ? isV(s) && Math.abs(s.x1 - far) < 0.5 : isH(s) && Math.abs(s.y1 - far) < 0.5) &&
          len(s) > 3 &&
          Math.abs(len(s) - (v ? Math.abs(t.y1 - u.y1) : Math.abs(t.x1 - u.x1))) < 1.2 &&
          (v
            ? Math.abs(Math.min(s.y1, s.y2) - Math.min(t.y1, u.y1)) < 1.2 &&
              Math.abs(Math.max(s.y1, s.y2) - Math.max(t.y1, u.y1)) < 1.2
            : Math.abs(Math.min(s.x1, s.x2) - Math.min(t.x1, u.x1)) < 1.2 &&
              Math.abs(Math.max(s.x1, s.x2) - Math.max(t.x1, u.x1)) < 1.2)
      );
      if (cl) {
        let BB = b,
          BP = bp,
          A0 = a0,
          A1 = a1,
          SD = sd,
          FAR = far;
        const LB = SG.find(
          s =>
            !s.use &&
            s !== b &&
            s !== cl &&
            (v ? isV(s) && Math.abs(s.x1 - far) < 0.5 : isH(s) && Math.abs(s.y1 - far) < 0.5) &&
            len(s) > (v ? Math.abs(t.y1 - u.y1) : Math.abs(t.x1 - u.x1)) + 1.5 &&
            (v
              ? Math.min(s.y1, s.y2) <= Math.min(t.y1, u.y1) + 0.6 && Math.max(s.y1, s.y2) >= Math.max(t.y1, u.y1) - 0.6
              : Math.min(s.x1, s.x2) <= Math.min(t.x1, u.x1) + 0.6 &&
                Math.max(s.x1, s.x2) >= Math.max(t.x1, u.x1) - 0.6)
        );
        if (LB) {
          BB = LB;
          BP = v ? LB.x1 : LB.y1;
          A0 = v ? Math.min(LB.y1, LB.y2) : Math.min(LB.x1, LB.x2);
          A1 = v ? Math.max(LB.y1, LB.y2) : Math.max(LB.x1, LB.x2);
          SD = -sd;
          FAR = bp;
          LB.use = 2;
        }
        S.gate.push({
          k: 'AND',
          v,
          bar: BB,
          bp: BP,
          a0: A0,
          a1: A1,
          side: SD,
          out: v ? { x: FAR, y: mid } : { x: mid, y: FAR },
          body: { x0: Math.min(BP, FAR), x1: Math.max(BP, FAR), y0: Math.min(t.y1, u.y1), y1: Math.max(t.y1, u.y1) },
          used: [b, t, u, cl]
        });
        [b, t, u, cl].forEach(s => (s.use = 2));
      }
    } else {
      const rc = (S.shp || []).find(
        sh =>
          sh.ty === 'rect' &&
          !sh.taken &&
          sh.w > 3 &&
          sh.w < 8.5 &&
          sh.h > 3 &&
          !R.tx.some(t => t.x >= sh.x0 && t.x <= sh.x1 && t.y >= sh.y0 && t.y <= sh.y1) &&
          (v
            ? (Math.abs(sh.x0 - bp) < 0.6 || Math.abs(sh.x1 - bp) < 0.6) && sh.y0 >= a0 - 0.6 && sh.y1 <= a1 + 0.6
            : (Math.abs(sh.y0 - bp) < 0.6 || Math.abs(sh.y1 - bp) < 0.6) && sh.x0 >= a0 - 0.6 && sh.x1 <= a1 + 0.6)
      );
      if (rc) {
        const sd = v ? (rc.cx > bp ? 1 : -1) : rc.cy > bp ? 1 : -1;
        const far = v ? (sd > 0 ? rc.x1 : rc.x0) : sd > 0 ? rc.y1 : rc.y0;
        const mid = v ? (rc.y0 + rc.y1) / 2 : (rc.x0 + rc.x1) / 2;
        rc.taken = 1;
        S.gate.push({
          k: 'AND',
          v,
          bar: b,
          bp,
          a0,
          a1,
          side: sd,
          out: v ? { x: far, y: mid } : { x: mid, y: far },
          body: {
            x0: Math.min(bp, far),
            x1: Math.max(bp, far),
            y0: v ? rc.y0 : Math.min(bp, far),
            y1: v ? rc.y1 : Math.max(bp, far)
          },
          used: [b]
        });
        b.use = 2;
      }
    }
  }
  /* NOT: square with X (two diagonals) */
  for (const sh of S.shp) {
    if (sh.ty !== 'rect' || sh.w > 8.5 || sh.h > 8.5) continue;
    const g = SG.filter(
      s => s.use === 1 && inb(sh, s.x1, s.y1, 0.25) && inb(sh, s.x2, s.y2, 0.25) && !isH(s) && !isV(s)
    );
    if (g.length === 2 && !R.tx.some(t => inb(sh, t.x, t.y))) S.gate.push({ k: 'NOT', box: sh, used: [] });
  }
  /* wires = every segment that is not a gate or glyph part */
  S.seg = SG.filter(s => !s.use);
  S.gl = SG.filter(s => s.use === 1);
  S.edge = SG.filter(s => s.use === 3);
  return S;
}
