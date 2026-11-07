// Plan c2: reads one sheet of the TCS Interlock Block Diagram (310SC90-794) from the page JSON of ibd_extract.mjs into a netlist.
// The IBD is free-flow, so the DITL reader (DXF row table) does not apply. A gate is its letter plus the bar and box around it:
// A, OR, S / R (flip-flop), CMP, DI / DT (timer), MID, 2/3, and a small empty circle on a wire = NOT. Wires are the long straight lines,
// joined where an end touches another line. An input is a wire end on the bar of a gate, the output leaves its right edge.
// Usage: node tools/data/ibd_read.mjs <dir with p<n>.json> <n>...   prints the netlist of each page
import fs from 'fs';
const EPS = 0.8;
const GATEW = /^(A|OR|S|R|CMP|DI|DT|PO|FLK|FG|LS|MID|ANN|SOE|ATS|[0-9].[0-9])$/;
export function readPage(J) {
  const frame = s => Math.abs(s[0] - s[2]) > 1000 || Math.abs(s[1] - s[3]) > 700;
  const title = s => Math.max(s[0], s[2]) > 680 && Math.max(s[1], s[3]) < 140;
  const H = s => Math.abs(s[1] - s[3]) < 0.3,
    V = s => Math.abs(s[0] - s[2]) < 0.3;
  const len = s => Math.hypot(s[2] - s[0], s[3] - s[1]);
  const segs = J.segs.filter(s => !frame(s) && !title(s));
  const words = J.texts.filter(t => !(t.x > 680 && t.y < 140)).map(t => ({ ...t, cx: t.x + t.w / 2, cy: t.y + t.h / 3 }));
  const used = new Set();
  const gates = [];
  const box = w => {
    /* the box around a gate word: the nearest vertical on each side that spans the word */
    const vs = segs.filter(s => V(s) && Math.min(s[1], s[3]) <= w.cy + 1 && Math.max(s[1], s[3]) >= w.cy - 1);
    const l = vs.filter(s => s[0] < w.cx && w.cx - s[0] < 22).sort((a, b) => b[0] - a[0])[0],
      r = vs.filter(s => s[0] > w.cx && s[0] - w.cx < 22).sort((a, b) => a[0] - b[0])[0];
    if (!l || !r) return null;
    const hs = segs.filter(s => H(s) && Math.min(s[0], s[2]) <= l[0] + 1 && Math.max(s[0], s[2]) >= r[0] - 1 && Math.abs(Math.max(s[0], s[2]) - Math.min(s[0], s[2]) - (r[0] - l[0])) < 2);
    const top = hs.filter(s => s[1] > w.cy).sort((a, b) => a[1] - b[1])[0],
      bot = hs.filter(s => s[1] < w.cy).sort((a, b) => b[1] - a[1])[0];
    if (!top || !bot) return null;
    return { l, r, top, bot };
  };
  for (const w of words) {
    const t = w.s.trim();
    if (!/^(A|OR|S|R|CMP|DI|DT|PO|FLK|FG|LS|MID|\d\/\d)$/.test(t)) continue;
    const b = box(w);
    if (!b) {
      gates.push({ t, x: w.x, y: w.y, cx: w.cx, cy: w.cy, bad: 'no box' });
      continue;
    }
    for (const s of [b.l, b.r, b.top, b.bot]) used.add(s);
    const tm = words.find(o => /^[0-9.]+ *(s|sec|min)$/i.test(o.s.trim()) && Math.abs(o.cx - w.cx) < 20 && Math.abs(o.cy - w.cy) < 18);
    gates.push({ t, cx: w.cx, cy: w.cy, tm: tm ? tm.s.trim() : null, x0: b.l[0], x1: b.r[0], y0: Math.min(b.l[1], b.l[3]), y1: Math.max(b.l[1], b.l[3]), by0: b.bot[1], by1: b.top[1], ins: [], out: null });
  }
  /* S and R of one flip-flop */
  const ffs = [];
  for (const g of gates.filter(g => g.t === 'S' && !g.bad)) {
    const r = gates.find(x => x.t === 'R' && !x.bad && Math.abs(x.x0 - g.x0) < 2 && g.by0 - x.by1 < 2 && g.by0 - x.by1 > -2);
    if (r) {
      r.ff = g;
      g.r = r;
      ffs.push(g);
    }
  }
  const rects = [];
  /* the edges of a box with words in it (ANN, SOE, a push button, a valve block) are not wires: two wires that end on one box are two signals */
  {
    const hs = segs.filter(s => H(s) && len(s) > 8 && len(s) < 260 && !used.has(s)),
      vs = segs.filter(s => V(s) && len(s) > 8 && len(s) < 120 && !used.has(s));
    for (const v of vs)
      for (const w of vs) {
        if (w === v || w[0] <= v[0] || w[0] - v[0] > 260) continue;
        const lo = Math.max(Math.min(v[1], v[3]), Math.min(w[1], w[3])),
          hi = Math.min(Math.max(v[1], v[3]), Math.max(w[1], w[3]));
        if (Math.abs(Math.min(v[1], v[3]) - lo) > 0.8 || Math.abs(Math.min(w[1], w[3]) - lo) > 0.8 || Math.abs(Math.max(v[1], v[3]) - hi) > 0.8 || Math.abs(Math.max(w[1], w[3]) - hi) > 0.8) continue;
        const top = hs.find(s => Math.abs(s[1] - hi) < 0.8 && Math.min(s[0], s[2]) <= v[0] + 0.8 && Math.max(s[0], s[2]) >= w[0] - 0.8),
          bot = hs.find(s => Math.abs(s[1] - lo) < 0.8 && Math.min(s[0], s[2]) <= v[0] + 0.8 && Math.max(s[0], s[2]) >= w[0] - 0.8);
        if (!top || !bot) continue;
        if (!words.some(q => q.cx > v[0] && q.cx < w[0] && q.cy > lo && q.cy < hi)) continue;
        for (const s of [v, w, top, bot]) used.add(s);
        rects.push({ x0: v[0], x1: w[0], y0: lo, y1: hi });
      }
  }
  /* a dashed line (an analog signal): collinear dashes become one wire */
  const dashes = segs.filter(s => (H(s) || V(s)) && len(s) >= 1.5 && len(s) <= 14 && !used.has(s));
  const dashed = [];
  const inRun = new Set();
  for (const hor of [true, false]) {
    const L = dashes.filter(s => (hor ? H(s) : V(s))).map(s => (hor ? { s, c: s[1], a: Math.min(s[0], s[2]), b: Math.max(s[0], s[2]) } : { s, c: s[0], a: Math.min(s[1], s[3]), b: Math.max(s[1], s[3]) }));
    L.sort((p, q) => p.c - q.c || p.a - q.a);
    let run = [];
    const flush = () => {
      if (run.length >= 2) {
        const b = Math.max(...run.map(r => r.b)),
          { a, c } = run[0];
        dashed.push(hor ? [a, c, b, c] : [c, a, c, b]);
        for (const r of run) inRun.add(r.s);
      }
      run = [];
    };
    for (const d of L) {
      const p = run[run.length - 1];
      if (p && Math.abs(p.c - d.c) < 0.3 && d.a - p.b < 7 && d.a - p.b > 0.2) run.push(d);
      else {
        flush();
        run.push(d);
      }
    }
    flush();
  }
  /* a page of stroked text: its strokes are not wires */
  const minL = segs.length > 6000 ? 5 : 2.5;
  const wires = segs.filter(s => (H(s) || V(s)) && len(s) > minL && !used.has(s) && !inRun.has(s)).concat(dashed);
  /* NOT: a circle of small arcs with nothing written in it */
  const arcs = J.curves.filter(c => {
    const l = len(c);
    return l > 6 && l < 11;
  });
  const nots = [];
  for (const c of arcs) {
    if (nots.some(n => Math.hypot(n.cx - c[0], n.cy - c[1]) < 12)) continue;
    const near = arcs.filter(o => Math.hypot(o[0] - c[0], o[1] - c[1]) < 12);
    if (near.length < 3) continue;
    const xs = near.flatMap(o => [o[0], o[2]]),
      ys = near.flatMap(o => [o[1], o[3]]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2,
      cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    nots.push({ cx, cy, r: (Math.max(...xs) - Math.min(...xs)) / 2 });
  }
  /* a wire drawn straight through a NOT circle is two nets: cut it at the circle */
  for (const n of nots) {
    if (words.some(w => Math.hypot(w.cx - n.cx, w.cy - n.cy) < n.r + 1)) continue;
    for (let i = wires.length - 1; i >= 0; i--) {
      const s = wires[i];
      const hor = H(s) && Math.abs(s[1] - n.cy) < 1,
        ver = V(s) && Math.abs(s[0] - n.cx) < 1;
      if (hor && Math.min(s[0], s[2]) < n.cx - n.r + 0.5 && Math.max(s[0], s[2]) > n.cx + n.r - 0.5) {
        const lo = Math.min(s[0], s[2]),
          hi = Math.max(s[0], s[2]);
        wires[i] = [lo, s[1], n.cx - n.r, s[1]];
        wires.push([n.cx + n.r, s[1], hi, s[1]]);
      } else if (ver && Math.min(s[1], s[3]) < n.cy - n.r + 0.5 && Math.max(s[1], s[3]) > n.cy + n.r - 0.5) {
        const lo = Math.min(s[1], s[3]),
          hi = Math.max(s[1], s[3]);
        wires[i] = [s[0], hi, s[0], n.cy + n.r];
        wires.push([s[0], n.cy - n.r, s[0], lo]);
      }
    }
  }
  /* nets */
  const P = wires.map((_, i) => i),
    find = i => (P[i] === i ? i : (P[i] = find(P[i]))),
    join = (a, b) => (P[find(a)] = find(b));
  const on = (x, y, s) => (H(s) ? Math.abs(y - s[1]) < EPS && x >= Math.min(s[0], s[2]) - EPS && x <= Math.max(s[0], s[2]) + EPS : Math.abs(x - s[0]) < EPS && y >= Math.min(s[1], s[3]) - EPS && y <= Math.max(s[1], s[3]) + EPS);
  const D0 = wires.length - dashed.length;
  const near = (x, y, s) => {
    /* a dashed line has gaps: an end within a dash gap of it touches it */
    const e = 3.6;
    return H(s) ? Math.abs(y - s[1]) < 1.2 && x >= Math.min(s[0], s[2]) - e && x <= Math.max(s[0], s[2]) + e : Math.abs(x - s[0]) < 1.2 && y >= Math.min(s[1], s[3]) - e && y <= Math.max(s[1], s[3]) + e;
  };
  wires.forEach((a, i) => {
    wires.forEach((b, j) => {
      if (i >= j) return;
      if (on(a[0], a[1], b) || on(a[2], a[3], b) || on(b[0], b[1], a) || on(b[2], b[3], a)) join(i, j);
      else if ((i >= D0 || j >= D0) && (near(a[0], a[1], b) || near(a[2], a[3], b) || near(b[0], b[1], a) || near(b[2], b[3], a))) join(i, j);
    });
  });
  /* a junction dot joins every line through it; a dashed line may stop one gap short of the dot */
  const dotArcs = J.curves.filter(c => {
    const l = len(c);
    return l >= 1.5 && l < 4.5;
  });
  const dots = [];
  for (const c of dotArcs) {
    if (dots.some(d => Math.hypot(d[0] - c[0], d[1] - c[1]) < 5)) continue;
    const q = dotArcs.filter(o => Math.hypot(o[0] - c[0], o[1] - c[1]) < 5);
    if (q.length < 3) continue;
    const xs = q.flatMap(o => [o[0], o[2]]),
      ys = q.flatMap(o => [o[1], o[3]]);
    dots.push([(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]);
  }
  for (const [x, y] of dots) {
    const hit = [];
    wires.forEach((s, i) => {
      /* a short piece of a dashed line; not the stub after a NOT, its gap is the circle */
      const stub = nots.some(n => Math.abs(Math.hypot(s[0] - n.cx, s[1] - n.cy) - n.r) < 2 || Math.abs(Math.hypot(s[2] - n.cx, s[3] - n.cy) - n.r) < 2);
      const e = i >= D0 || (len(s) < 16 && !stub) ? 7.5 : 1.5,
        m = H(s) ? Math.abs(y - s[1]) < 1.5 && x >= Math.min(s[0], s[2]) - e && x <= Math.max(s[0], s[2]) + e : Math.abs(x - s[0]) < 1.5 && y >= Math.min(s[1], s[3]) - e && y <= Math.max(s[1], s[3]) + e;
      if (m) hit.push(i);
    });
    for (let k = 1; k < hit.length; k++) join(hit[0], hit[k]);
  }
  const ends = wires.flatMap((s, i) => [
    [s[0], s[1], i],
    [s[2], s[3], i]
  ]);
  const net = i => 'n' + find(i);
  for (const g of gates) {
    if (g.bad) continue;
    const inN = new Set();
    for (const [x, y, i] of ends) {
      if (Math.abs(x - g.x0) < 9 && x <= g.x0 + EPS && y >= g.y0 - EPS && y <= g.y1 + EPS) inN.add(net(i));
      if (Math.abs(x - g.x1) < EPS && y >= g.by0 - EPS && y <= g.by1 + EPS) g.out = net(i);
    }
    g.ins = [...inN];
  }
  /* a memory: S over R, in one box or two; the R may be a letter in a circle (reset has priority, sheet 13). The wires go by height */
  for (const g of gates.filter(g => g.t === 'S' && !g.bad)) {
    const r = gates.find(x => x.t === 'R' && x !== g && Math.abs(x.cx - g.cx) < 5 && g.cy - x.cy > 4 && g.cy - x.cy < 22);
    if (!r) continue;
    const mid = (g.cy + r.cy) / 2,
      S1 = new Set(),
      R1 = new Set();
    let out = g.out || r.out || null;
    for (const [x, y, i] of ends) {
      if (y < r.cy - 9 || y > g.cy + 9) continue;
      if (x <= g.x0 + EPS && g.x0 - x < 9) (y > mid ? S1 : R1).add(net(i));
      if (Math.abs(x - g.x1) < EPS + 1) out = net(i);
    }
    g.ins = [...S1];
    g.out = out;
    g.r = { ins: [...R1] };
    r.ff = g;
  }
  for (const n of nots) {
    /* a letter in the circle: a lamp, a link, the R of a memory; not a NOT */
    if (words.some(w => Math.hypot(w.cx - n.cx, w.cy - n.cy) < n.r + 1)) continue;
    const hit = ends.filter(([x, y]) => Math.abs(Math.hypot(x - n.cx, y - n.cy) - n.r) < 1.5);
    const a = hit.sort((p, q) => p[0] - q[0] || q[1] - p[1]);
    if (a.length >= 2) gates.push({ t: 'NOT', x0: n.cx, y0: n.cy, ins: [net(a[0][2])], out: net(a[a.length - 1][2]) });
  }
  /* (WO) wipe-out: the line passes through it, the wire from below wipes it */
  for (const w of words.filter(w => /^\W*WO\W*$/.test(w.s.trim()))) {
    const L = ends.filter(([x, y]) => Math.abs(y - w.cy) < 5 && x < w.x + 2 && w.x - x < 30).sort((a, b) => b[0] - a[0])[0],
      R = ends.filter(([x, y]) => Math.abs(y - w.cy) < 5 && x > w.x && x - w.x < 40).sort((a, b) => a[0] - b[0])[0],
      U = ends.filter(([x, y]) => y < w.cy && w.cy - y < 22 && Math.abs(x - w.cx) < 12).sort((a, b) => b[1] - a[1])[0];
    gates.push({ t: 'WO', x0: w.x, y0: w.y, ins: L ? [net(L[2])] : [], wipe: U ? net(U[2]) : null, out: R ? net(R[2]) : null });
  }
  /* a net nothing drives: the words at its left end name it */
  const driven = new Set(gates.map(g => g.out)),
    used2 = new Set(gates.flatMap(g => (g.ins || []).concat(g.wipe ? [g.wipe] : [])));
  /* the name of an input: the words of its box, on the left of the wire end; a dashed line can start inside the box, then they are on the right */
  const nameAt = (x, y) => {
    const near = words.filter(w => Math.abs(w.cy - y) < 18 && !GATEW.test(w.s.trim()));
    const left = near.filter(w => w.x < x && x - w.x < 300 && Math.abs(w.cy - y) < 17),
      L = left.length ? left : near.filter(w => w.x >= x && w.x - x < 240);
    /* the tag sits in the right part of the box, past the place a dashed line starts */
    const tags = near.filter(w => /^[A-Z]+-[A-Z]+n[0-9]/.test(w.s.trim()) && !L.includes(w) && Math.abs(w.cy - y) < 13 && Math.abs(w.x - x) < 200);
    /* the number in the off-page circle and its sheet reference are no part of the name */
    const ref = w => /^[0-9]+$/.test(w.s.trim()) || /^SH-/.test(w.s.trim()) || /^(T[A-E]|GD|G)-[0-9]/.test(w.s.trim()) || /^[(]310S/.test(w.s.trim()) || /^[(][*][0-9][)]$/.test(w.s.trim());
    return L.concat(tags)
      .filter(w => !ref(w))
      .sort((p, q) => q.y - p.y || p.x - q.x)
      .map(w => w.s.trim())
      .join(' ');
  };
  const inputs = [];
  for (const n of used2) {
    if (driven.has(n)) continue;
    const e = ends.filter(([, , i]) => net(i) === n).sort((a, b) => a[0] - b[0])[0];
    const nm = e ? nameAt(e[0], e[1]) : '';
    const bw = e ? words.filter(w => w.x < e[0] && e[0] - w.x < 300 && Math.abs(w.cy - e[1]) < 13 && nm.includes(w.s.trim())) : [];
    inputs.push({ net: n, name: nm, x: e && e[0], y: e && e[1], bx: bw.length ? Math.min(...bw.map(w => w.x)) : null });
  }
  /* what a wire ends on: a box (ANN, SOE, ATS, a valve block) or a named tag: the page draws the wire to it */
  const sinks = rects.map(r => ({ ...r, nets: [] }));
  for (const [x, y, i] of ends)
    for (const r of sinks)
      if (Math.abs(x - r.x0) < 2.5 && y > r.y0 - 1 && y < r.y1 + 1 && driven.has(net(i)) && !r.nets.some(q => q[0] === net(i))) r.nets.push([net(i), y]);
  const outputs = [];
  for (const g of gates) {
    if (!g.out || used2.has(g.out)) continue;
    const e = ends.filter(([, , i]) => net(i) === g.out).sort((a, b) => b[0] - a[0])[0];
    const nm = e ? words.filter(w => w.x > e[0] - 2 && w.x - e[0] < 330 && Math.abs(w.cy - e[1]) < 17).map(w => w.s.trim()).join(' ') : '';
    outputs.push({ net: g.out, name: nm, x: e && e[0], y: e && e[1] });
  }
  const netOf = wires.map((_, i) => net(i));
  return { gates, inputs, outputs, sinks, wires: wires.length, nots: nots.length, wireSegs: wires, netOf };
}
if (process.argv[1] && process.argv[1].endsWith('ibd_read.mjs')) {
  for (const p of process.argv.slice(3)) {
    const R = readPage(JSON.parse(fs.readFileSync(process.argv[2] + '/p' + p + '.json', 'utf8')));
    console.log('=== page', p, 'wires', R.wires, 'not', R.nots);
    for (const g of R.gates) console.log(' ', g.t, g.bad ? 'BAD ' + g.bad + ' ' + g.x + ',' + g.y : Math.round(g.x0) + ',' + Math.round(g.y0) + ' in ' + (g.ins || []).join(' ') + ' out ' + g.out);
    console.log(' inputs');
    for (const i of R.inputs) console.log('  ', i.net, Math.round(i.x), Math.round(i.y), i.name.slice(0, 90));
    console.log(' outputs');
    for (const o of R.outputs) console.log('  ', o.net, o.name.slice(0, 90));
  }
}
