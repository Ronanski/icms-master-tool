/* DITL (digital logic) - TCS sheets: the Interlock Block Diagram 310SC90-794 rev 2 as sheets of the Logic page, in the same viewer, sheet list and panel as DITL.
   A sheet is built here from the netlist TCS_IBD_SHEETS (src/analog/engine/tcs-ibd-data.js): each block stands where the IBD has it, the app draws its own symbols
   and routes the wires. The logic runs once, in the engine (src/analog/engine/tcs-trip.js); a sheet reads the values of that scan (tcsSim). */
const TCS_NAME = { A: 'AND', OR: 'OR', NOT: 'NOT', '2/3': '2/3', WO: 'WO', MID: 'MID', CMP: 'CMP', FF: 'S / R', LS: 'LS', FG: 'FG', FLK: 'FLK', PO: 'PO', DI: 'DI', DT: 'DT' };
const tcsCat = id =>
  /^\d/.test(id)
    ? 'TYPICAL LOGIC'
    : { TA: 'TURBINE TRIP AND TESTS', TB: 'TURBINE PUMPS AND MOTORS', TC: 'TURBINE VALVES', TD: 'TURBINE ALARMS', TE: 'TURBINE GROUP CONTROL', GD: 'GENERATOR' }[id.slice(0, 2)] || 'OTHER';
const tcsWrap = (t, n) => {
  const L = [];
  let c = '';
  for (const w of String(t).split(' ')) {
    if (c && (c + ' ' + w).length > n) {
      L.push(c);
      c = w;
    } else c = c ? c + ' ' + w : w;
  }
  if (c) L.push(c);
  return L;
};
function tcsSheet(q) {
  const K = 0.32,
    Y = y => 842 - y,
    PX = x => +(x * K).toFixed(2),
    PY = y => +(-y * K).toFixed(2),
    ln = [],
    seg = [],
    pl = [],
    ci = [],
    tx = [],
    rows = [],
    cells = {},
    rb = [],
    src = [],
    outs = [],
    an = [],
    gates = [];
  const text = (t, x, y, h, a) => ({ t, ix: PX(x), iy: PY(y), x: PX(x), y: PY(y), h: h || 2.05, r: 0, a: a || 0, b: 0, l: 'TXT1' });
  const wire = (n, P) => {
    for (let k = 1; k < P.length; k++) {
      const [a, b] = [P[k - 1], P[k]];
      if (a[0] === b[0] && a[1] === b[1]) continue;
      ln.push([PX(a[0]), PY(a[1]), PX(b[0]), PY(b[1]), 'CON']);
      seg.push(n);
    }
  };
  /* the sheet frame and its title */
  [[[18, 18], [1173, 18]], [[1173, 18], [1173, 824]], [[1173, 824], [18, 824]], [[18, 824], [18, 18]], [[18, 796], [1173, 796]]].forEach(([a, b]) => {
    ln.push([PX(a[0]), PY(a[1]), PX(b[0]), PY(b[1]), 'SYM']);
    seg.push(undefined);
  });
  tx.push(text((/^\d/.test(q.id) ? 'TYPICAL ' : '') + q.id + '  ' + q.t, 30, 815, 2.6), text('TCS SHEET ' + q.sh + ' OF 99', 1160, 815, 2.05, 2));
  /* blocks: the left edge takes the pins, the right edge gives the output */
  const B = [];
  q.g.forEach((g, gi) => {
    const [t, ins, out, x, gx, gy, gw, gh] = g;
    if (!gx) return; /* a gate the engine adds, not a block of the sheet */
    const not = t === 'NOT',
      w = not ? 16 : Math.max(gw || 28, 26),
      h = not ? 12 : Math.max(gh || 16, 16),
      bx = not ? gx - 8 : gx,
      by = not ? Y(gy) - 6 : Y(gy) - h;
    B.push({ t, gi, g, ins: ins.concat(t === 'FF' || t === 'WO' ? x : []), out, x: bx, y: by, w, h });
  });
  const use = new Map();
  B.forEach(b => b.ins.forEach(n => (use.get(n) || use.set(n, []).get(n)).push(b)));
  const driven = new Set(B.map(b => b.out));
  const SRC = new Map();
  B.forEach(b => b.out >= 0 && SRC.set(b.out, [b.x + b.w, b.y + b.h / 2]));
  /* input rows: an input of the sheet, or a link that comes in */
  const lk = new Map(q.x.filter(x => x[3]).map(x => [x[0], x]));
  const rowIn = (net, name, ex, y, left, L) => {
    const i = rows.length,
      isA = (use.get(net) || []).length && use.get(net).every(b => /CMP|MID|FG|LS/.test(b.t)),
      sw = isA ? 46 : 12,
      lines = tcsWrap(name, Math.max(20, Math.floor(((ex - 3 - left) * K) / 1.13))),
      d = (lines.length * 7.5) / 2;
    cells[i + ':S'] = lines.map((l, k) => text(l, ex - 3, y + 2.5 + (k - (lines.length - 1) / 2) * 8, 2.05, 2));
    const vx = { S: [PX(left), PX(ex + sw)] };
    if (L) {
      ci.push([PX(L[4]), PY(y), 10 * K, 'SYM']);
      tx.push(text(L[1], L[4], y + 3, 2.05, 1));
      cells[i + ':F'] = [text(L[2], L[4] + 13, y + 3, 2.05)];
      vx.F = [PX(L[4] - 10), PX(left - 1)];
    }
    rows.push({ n: i + 1, y: +(PY(y) - 1.2).toFixed(2), vx, tn: net });
    rb.push([+(PY(y) - d * K - 1).toFixed(2), +(PY(y) + d * K + 1).toFixed(2)]);
    src.push({ n: net, row: i });
    if (isA) an.push({ row: i, key: 'n' + net, label: name, unit: '', def: 0, net, g: [] });
    if (!driven.has(net)) SRC.set(net, [ex + sw, y]);
  };
  q.i.forEach(i => i[2] != null && rowIn(i[0], i[1], i[2], Y(i[3]), i[4] || i[2] - 205, lk.get(i[0])));
  q.x.forEach(x => {
    if (!x[3] || x[4] == null || q.i.some(i => i[0] === x[0] && i[2] != null) || driven.has(x[0])) return;
    rowIn(x[0], 'From ' + x[2] + ' link ' + x[1], x[4] + 90, Y(x[5]), x[4] + 14, null);
  });
  /* the wires into one block: pins in the order of their sources, channels so that they do not cross */
  const route = (dx, pins, nets) => {
    const L = nets.map((n, k) => ({ n, s: SRC.get(n), p: pins[k] })).filter(c => c.s);
    L.sort((a, b) => a.s[1] - b.s[1]);
    L.forEach((c, k) => (c.p = pins[k]));
    const down = L.filter(c => c.s[1] < c.p),
      up = L.filter(c => c.s[1] >= c.p).reverse();
    const lane = (arr, base) =>
      arr.forEach((c, k) => {
        const back = c.s[0] > dx - 6,
          cx = dx - 7 - base - k * 4;
        wire(
          c.n,
          back
            ? [c.s, [c.s[0] + 7, c.s[1]], [c.s[0] + 7, c.p + 16 + k * 4], [cx, c.p + 16 + k * 4], [cx, c.p], [dx, c.p]]
            : [c.s, [cx, c.s[1]], [cx, c.p], [dx, c.p]]
        );
      });
    lane(down, 0);
    lane(up, down.length * 4);
  };
  B.forEach(b => route(b.x, b.ins.map((_, k) => b.y + (b.h * (k + 1)) / (b.ins.length + 1)), b.ins));
  q.x.forEach(o => {
    if (o[3] || o[4] == null) return;
    const y = Y(o[5]),
      i = rows.length;
    route(o[4] - 10, [y], [o[0]]);
    ci.push([PX(o[4]), PY(y), 10 * K, 'SYM']);
    tx.push(text(o[1], o[4], y + 3, 2.05, 1));
    cells[i + ':RT'] = [text(o[2], o[4], y + 20, 2.05, 1)];
    rows.push({ n: i + 1, y: +(PY(y) - 1.2).toFixed(2), vx: { RT: [PX(o[4] - 12), PX(o[4] + 30)] }, tn: o[0] });
    rb.push([+(PY(y + 26)).toFixed(2), +(PY(y - 12)).toFixed(2)]);
    outs.push({ n: o[0], row: i });
  });
  /* the symbols; each one is a gate of the netlist, so it is selected and traced like a DITL gate */
  B.forEach(b => {
    const { x, y, w, h, t, gi, g } = b,
      box = { x1: PX(x), x2: PX(x + w), y1: PY(y + h), y2: PY(y) },
      P = a => a.map(p => [PX(p[0]), PY(p[1])]),
      ex = g[3],
      arc = (cx, cy, rx, ry, a0, a1) => {
        const o = [];
        for (let k = 0; k <= 12; k++) {
          const u = ((a0 + ((a1 - a0) * k) / 12) * Math.PI) / 180;
          o.push([cx + rx * Math.cos(u), cy + ry * Math.sin(u)]);
        }
        return o;
      };
    if (t === 'A') pl.push([P([[x, y], ...arc(x + w * 0.5, y + h / 2, w * 0.5, h / 2, -90, 90), [x, y + h]]), 1, 'SYM']);
    else if (t === 'OR')
      pl.push([P([[x, y], ...arc(x + w * 0.35, y + h / 2, w * 0.65, h / 2, -90, 90), [x, y + h], ...arc(x - w * 0.12, y + h / 2, w * 0.2, h / 2, 90, -90)]), 1, 'SYM']);
    else if (t === 'NOT') {
      pl.push([P([[x, y], [x + w - 5, y + h / 2], [x, y + h]]), 1, 'SYM']);
      ci.push([PX(x + w - 2.5), PY(y + h / 2), 2.5 * K, 'SYM']);
    } else pl.push([P([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]), 1, 'SYM']);
    if (t !== 'NOT') tx.push(text(TCS_NAME[t] || t, x + w * (t === 'A' || t === 'OR' ? 0.42 : 0.5), y + h / 2, 1.9, 4));
    const o = {
      box,
      miss: [],
      gi,
      out: [b.out],
      ins: g[1],
      t: t === 'A' ? 'AND' : t
    };
    if (t === 'FF') Object.assign(o, { s: g[1], r: ex, q: 0, ins: undefined, rt: true });
    else if (t === 'WO') o.r = ex;
    else if (t === 'CMP') {
      const c = Array.isArray(ex) ? ex : null;
      Object.assign(o, { cmp: c && !c[0] ? '<' : '>', eq: true, sp: c ? c[1] : 'the table of the sheet', unit: c ? ' ' + c[3] : '', c });
      tx.push(text(c ? (c[0] ? '≥ ' : '≤ ') + c[1] + ' ' + c[3] : 'table', x + w / 2, y + h + 8, 1.9, 1));
      const a = an.find(z => z.net === g[1][0]);
      if (a) {
        a.g.push(gates.length);
        if (c) a.unit = c[3];
      }
    } else if (t === 'DI' || t === 'DT' || t === 'PO') {
      const m = /^([0-9.]+) *(s|sec|min)/i.exec(String(ex || '')),
        k = t === 'DI' ? 'on' : t === 'DT' ? 'off' : 'pulse';
      Object.assign(o, {
        t: 'TMR',
        k,
        st: { acc: 0, out: 0, pre: 0, run: 0 },
        tm: {
          lab: k === 'on' ? 'ON DELAY' : k === 'off' ? 'OFF DELAY' : 'PULSE',
          key: 'T' + gi,
          tag: t,
          ax: (box.x1 + box.x2) / 2,
          ay: (box.y1 + box.y2) / 2,
          rr: (box.y2 - box.y1) / 2,
          bx1: box.x1,
          bx2: box.x2,
          nt: null,
          ut: null,
          fv: { v: m ? +m[1] : 0, u: m && /min/i.test(m[2]) ? 'MIN' : 'SEC' }
        }
      });
      if (ex) tx.push(text(String(ex), x + w / 2, y + h + 8, 1.9, 1));
    }
    gates.push({ gt: o, box });
  });
  /* junction dots: a wire end on the middle of another wire of the same net */
  const dots = [];
  ln.forEach((a, i) => {
    if (seg[i] === undefined) return;
    [[a[0], a[1]], [a[2], a[3]]].forEach(p =>
      ln.some((b, j) => {
        if (j === i || seg[j] !== seg[i]) return false;
        const on =
          Math.abs(p[1] - b[1]) < 0.01 && Math.abs(b[1] - b[3]) < 0.01
            ? p[0] > Math.min(b[0], b[2]) + 0.01 && p[0] < Math.max(b[0], b[2]) - 0.01
            : Math.abs(p[0] - b[0]) < 0.01 && Math.abs(b[0] - b[2]) < 0.01 && p[1] > Math.min(b[1], b[3]) + 0.01 && p[1] < Math.max(b[1], b[3]) - 0.01;
        if (on && !dots.some(d => d.x === p[0] && d.y === p[1])) dots.push({ x: p[0], y: p[1], n: seg[i] });
        return on;
      })
    );
  });
  const NO = [0, 0];
  return {
    name: 'TCS-' + q.id,
    title: q.t,
    tcs: q.id,
    cat: tcsCat(q.id),
    meta: { dwg: (/^\d/.test(q.id) ? 'Typical ' : '') + q.id, title: q.t, no: q.sh },
    raw: { ln, pl, ci, ar: [], so: [], lamp: [] },
    tx,
    rows,
    rng: { F: NO, L: NO, T: NO, S: NO, RS: NO, RL: NO, RT: NO },
    vr: { F: NO, L: NO, T: NO, S: NO, RS: NO, RL: NO, RT: NO },
    rb,
    cells,
    sig: {},
    syms: [],
    lyr: '',
    bv: BV,
    sd: { tcs: 1, n: q.n, seg, gates, src, outs, term: [], dots, xcon: [], an, anl: [...new Set(B.flatMap(b => (/CMP|MID|FG|LS/.test(b.t) ? b.ins.concat(/MID|FG|LS/.test(b.t) ? [b.out] : []) : [])))] }
  };
}
/* the TCS sheets come after the DITL sheets; they are part of S.sheets, so the search, the viewer and the panel know them */
function tcsSheetsAdd() {
  const L = typeof AN !== 'undefined' && AN.tcsIbdSheets ? AN.tcsIbdSheets() : [];
  if (!L.length) return;
  const nm = S.sheets[S.cur] && S.sheets[S.cur].name;
  S.sheets = S.sheets.filter(x => !x.tcs).concat(L.map(tcsSheet));
  const i = S.sheets.findIndex(x => x.name === nm);
  if (i >= 0) S.cur = i;
}
/* the drawing of the IBD never comes with the app: on the PC that holds it, the sheets take its lines and words (a file made by tools/data/ibd_build.mjs,
   kept in this browser, src/ui/shell/tcsdraw.js). Same viewer, same gates, same nets: only the picture of the sheet changes. L = null: the app's own drawing.
   The title block is left out, like the DITL sheets */
function tcsDraw(L) {
  const K = 0.32,
    X = x => +(x * K).toFixed(2),
    Y = y => +(-y * K).toFixed(2),
    title = (x, y) => x >= 636 && y >= 663,
    key = (a, b) => [a[0], a[1], b[0], b[1]].map(v => v.toFixed(1)).join() + '|' + [b[0], b[1], a[0], a[1]].map(v => v.toFixed(1)).join(),
    parse = d => {
      const out = [],
        re = /([MLCZ])([^MLCZ]*)/g;
      let c = null,
        m;
      while ((m = re.exec(d))) {
        const n = m[2].trim().split(/[ ,]+/).filter(Boolean).map(Number);
        if (m[1] === 'M') out.push((c = { p: [[n[0], n[1]]], z: 0, cv: 0 }));
        else if (m[1] === 'L') c.p.push([n[0], n[1]]);
        else if (m[1] === 'Z') c.z = 1;
        else {
          const [x0, y0] = c.p[c.p.length - 1];
          c.cv = 1;
          for (let i = 1; i <= 8; i++) {
            const t = i / 8,
              u = 1 - t,
              B = (a, b, e, f) => u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * e + t * t * t * f;
            c.p.push([B(x0, n[0], n[2], n[4]), B(y0, n[1], n[3], n[5])]);
          }
        }
      }
      return out;
    };
  for (const s of S.sheets) {
    if (!s.tcs) continue;
    if (!s._app) s._app = { raw: s.raw, tx: s.tx, seg: s.sd.seg, dots: s.sd.dots };
    const D = L && L.find(q => q.id === s.tcs && q.n === s.sd.gates.length);
    s.drw = D ? 1 : 0;
    if (!D) Object.assign(s, { raw: s._app.raw, tx: s._app.tx }), Object.assign(s.sd, { seg: s._app.seg, dots: s._app.dots });
    else {
      const ln = [],
        seg = [],
        pl = [],
        wk = new Set();
      for (const n in D.w)
        for (const q of parse(D.w[n]))
          for (let i = 1; i < q.p.length; i++) {
            ln.push([X(q.p[i - 1][0]), Y(q.p[i - 1][1]), X(q.p[i][0]), Y(q.p[i][1]), 'CON']);
            seg.push(+n);
            key(q.p[i - 1], q.p[i]).split('|').forEach(k => wk.add(k));
          }
      /* the other lines: a live wire is not drawn twice, the frame first (Fit reads it) */
      parse(D.d).forEach((q, j) => {
        if (q.p.length < 2) return;
        if (q.z) q.p.push(q.p[0]);
        if (j === 0) {
          for (let i = 1; i < q.p.length; i++) {
            ln.push([X(q.p[i - 1][0]), Y(q.p[i - 1][1]), X(q.p[i][0]), Y(q.p[i][1]), 'SYM']);
            seg.push(undefined);
          }
          return;
        }
        if (q.p.every(a => title(a[0], a[1]))) return;
        let c = [q.p[0]];
        const flush = () => {
          if (c.length > 1) pl.push([c.map(a => [X(a[0]), Y(a[1])]), 0, 'SYM']);
        };
        for (let i = 1; i < q.p.length; i++) {
          if (!q.cv && wk.has(key(q.p[i - 1], q.p[i]).split('|')[0])) {
            flush();
            c = [q.p[i]];
          } else c.push(q.p[i]);
        }
        flush();
      });
      s.raw = { ln, pl, ci: [], ar: [], so: [], lamp: [] };
      s.sd.seg = seg;
      s.sd.dots = [];
      s.tx = D.t
        .filter(t => !title(t[1], t[2]))
        .map(([t, x, y, h, a, w]) => ({ t, ix: X(x), iy: Y(y), x: X(x), y: Y(y), h: +(h * K * 0.86).toFixed(2), r: a || 0, a: 0, b: 0, l: 'TXT1', w: w > 0 ? +(w * K).toFixed(2) : 0 }));
    }
    s.nl = null;
    s._ext = null;
  }
  VB = {};
}
/* an input of a TCS sheet is held in the engine: tcsTripFault (on = 1 / 0 / a value, null = back to the plant) */
const tcsHeld = (s, n) => {
  const st = AN.tcsIbd(s.tcs);
  return !!(st && st.fx && s.tcs + ':' + n in st.fx);
};
function tcsInput(s, n, on) {
  const q = AN.turbine('fault', { id: s.tcs, net: n, on });
  if (q) msg(q);
}
function tcsToggle(s, i) {
  const n = s.rows[i].tn;
  tcsInput(s, n, tcsHeld(s, n) ? null : !(s.nl._v && s.nl._v[n]));
}
const shFam = d => !!S.sheets[S.cur + d] && !!S.sheets[S.cur + d].tcs === !!S.sheets[S.cur].tcs;
/* the Logic tabs DITL and TCS: both show the DITL viewer, each comes back to its own last sheet */
if (typeof window !== 'undefined') {
  const last = { dig: null, tcs: 'TCS-TA-9' };
  window.LS_TCSV = {
    on: () => !!(S.sheets[S.cur] && S.sheets[S.cur].tcs),
    tab(c) {
      const s = S.sheets[S.cur],
        was = s && s.tcs ? 'tcs' : 'dig';
      if (!s || was === c) return;
      last[was] = s.name;
      const i = S.sheets.findIndex(x => (last[c] ? x.name === last[c] : !x.tcs));
      if (i >= 0) {
        S.cur = i;
        sel = null;
        render();
      }
    }
  };
}
/* one sheet in RUN: the values of the engine's scan */
function tcsSim(s) {
  const st = typeof AN !== 'undefined' && AN.tcsIbd ? AN.tcsIbd(s.tcs) : null,
    nl = s.nl,
    raw = (st && st.v) || [],
    v = new Array(nl.n).fill(0);
  for (let n = 0; n < nl.n; n++) v[n] = raw[n] > 0.5 ? 1 : 0;
  for (const n of nl.anl || []) v[n] = 0;
  nl._v = v;
  s.avw = {};
  for (const a of nl.an) if (isFinite(raw[a.net])) s.avw[a.key] = +(+raw[a.net]).toFixed(Math.abs(raw[a.net]) < 100 ? 2 : 1);
  nl.avk = avOf(s);
  const T = (st && st.t) || {};
  for (const g of nl.gates)
    if (g.t === 'TMR') {
      g.st.acc = T[s.tcs + ':' + g.gi] || 0;
      g.st.out = v[g.out[0]];
    }
  const rowOn = new Set(),
    outOn = new Set();
  for (const z of nl.src) if (v[z.n]) rowOn.add(z.row);
  for (const o of nl.outs) if (v[o.n]) outOn.add(o.row);
  return { rowOn, v, outOn };
}
