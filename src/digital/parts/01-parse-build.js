/* DITL (digital logic) - Constants, state, text decoding, DXF parse and build of the sheets. Part of ONE script (joined by src/digital/order.list, in this order). */
const NS = 'http://www.w3.org/2000/svg',
  $ = id => document.getElementById(id);
const BV = 28; /* v23: dash-dot (CEN) analog wires are part of the netlist -> built-in sheets re-exported */ /* parser version: sheets imported with an older version keep old geometry/text and must be imported again */
let S = { sheets: [], cur: 0 },
  hist = [],
  fut = [],
  sel = null,
  VB = {},
  SIM = false;
const LEFT = ['F', 'L', 'T', 'S'];
try {
  const j = localStorage.getItem('ditl.v1');
  if (j) S = JSON.parse(j);
} catch (e) {}
const dec = s =>
  s
    .replace(/\\+U\+([0-9A-Fa-f]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/%%%/g, '%')
    .replace(/%%[cC]/g, 'Ø')
    .replace(/%%[dD]/g, '°')
    .replace(/%%[pP]/g, '±');
const cur = () => S.sheets[S.cur];
/* ---------- DXF parse ---------- */
const SYM = {
    LAMP1: 'lamp',
    '0LAMP1': 'lamp',
    SOLENOID: 'solenoid',
    LSWITCH: 'limit',
    ICD130: 'icd',
    SIGHI: 'hi',
    SIGLO: 'lo',
    '0SIGHI': 'hi',
    '0SIGLO': 'lo',
    '0ADJ': 'adj',
    LEADER: 'leader'
  },
  SKIPB = /^(00_FORM|WMF6|test|GENAXEH|ACAD)/i;
const NLY = l => (/I-(WIRE|INST)$/i.test(l) ? 'CON' : /I-TEXT$/i.test(l) ? 'TXT1' : l);
const mul = (m, n) => [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5]
  ],
  ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
function explode(E, B, OFF) {
  OFF = OFF || new Set();
  const out = [];
  out.S = [];
  const go = (ents, M, pl, sym, d) => {
    let lastN = null;
    for (const e of ents) {
      const g = e.g,
        N = k => +g[k];
      if (e.t === 'SEQEND') lastN = null;
      if (OFF.has(e.l)) continue;
      if (e.t === 'ATTRIB' && d === 0 && lastN === '0NO' && g[1] != null && String(g[1]).trim() !== '') {
        /* v17: the number of a numbered connector circle is the ATTRIB of block 0NO (it was skipped, the circles looked empty) */ const o =
          {
            t: 'TEXT',
            l: NLY(e.l === '0' ? pl : e.l),
            g: { 1: g[1], 10: N(10), 20: N(20), 40: N(40) || 2, 50: 0, 72: g[72], 73: g[74] != null ? g[74] : g[73] },
            p: []
          };
        if (g[11] != null) {
          o.g[11] = N(11);
          o.g[21] = N(21);
        }
        out.push(o);
        continue;
      }
      if (e.t === 'INSERT') {
        lastN = g[2];
        const n = g[2],
          b = B[n];
        if (!b || SKIPB.test(n) || d > 6) continue;
        const a = ((N(50) || 0) * Math.PI) / 180,
          c = Math.cos(a),
          s = Math.sin(a),
          sx = g[41] != null ? N(41) : 1,
          sy = g[42] != null ? N(42) : 1;
        const M2 = mul(
          M,
          mul(
            [1, 0, 0, 1, N(10) || 0, N(20) || 0],
            mul([c, s, -s, c, 0, 0], mul([sx, 0, 0, sy, 0, 0], [1, 0, 0, 1, -b.b[0], -b.b[1]]))
          )
        );
        if (SYM[n] && !sym) {
          const q = ap(M, N(10) || 0, N(20) || 0);
          out.S.push({ k: SYM[n], n, x: q[0], y: q[1] });
        }
        go(b.e, M2, e.l === '0' ? pl : e.l, sym || SYM[n] || null, d + 1);
        continue;
      }
      if (/^(ATTRIB|ATTDEF|SEQEND|VIEWPORT)$/.test(e.t)) continue;
      const l0 = e.l === '0' ? pl : e.l;
      if (l0 === 'VPORTS' || OFF.has(l0)) continue;
      const o = { t: e.t, l: sym ? 'SYM' : NLY(l0), g: {}, p: [] },
        sc = Math.hypot(M[0], M[1]),
        rot = (Math.atan2(M[1], M[0]) * 180) / Math.PI,
        det = M[0] * M[3] - M[1] * M[2];
      if (e.t === 'LINE') {
        const A = ap(M, N(10), N(20)),
          C = ap(M, N(11), N(21));
        Object.assign(o.g, { 10: A[0], 20: A[1], 11: C[0], 21: C[1] });
      } else if (e.t === 'LWPOLYLINE') {
        o.p = e.p.map(q => ap(M, q[0], q[1]));
        o.g[70] = g[70];
        o.g[43] = Math.max(N(43) || 0, N(40) || 0, N(41) || 0) * sc;
      } else if (e.t === 'CIRCLE') {
        const A = ap(M, N(10), N(20));
        Object.assign(o.g, { 10: A[0], 20: A[1], 40: N(40) * sc });
      } else if (e.t === 'ARC') {
        const r = N(40),
          cx = N(10),
          cy = N(20),
          A = ap(M, cx, cy),
          an = d => {
            const q = ap(M, cx + r * Math.cos((d * Math.PI) / 180), cy + r * Math.sin((d * Math.PI) / 180));
            return ((Math.atan2(q[1] - A[1], q[0] - A[0]) * 180) / Math.PI + 360) % 360;
          };
        let a0 = an(N(50)),
          a1 = an(N(51));
        if (det < 0) [a0, a1] = [a1, a0];
        Object.assign(o.g, { 10: A[0], 20: A[1], 40: r * sc, 50: a0, 51: a1 });
      } else if (e.t === 'SOLID') {
        for (const [kx, ky] of [
          [10, 20],
          [11, 21],
          [12, 22],
          [13, 23]
        ])
          if (g[kx] != null) {
            const q = ap(M, N(kx), N(ky));
            o.g[kx] = q[0];
            o.g[ky] = q[1];
          }
      } else if (e.t === 'TEXT') {
        const A = ap(M, N(10), N(20));
        Object.assign(o.g, {
          1: g[1],
          10: A[0],
          20: A[1],
          40: (N(40) || 2.5) * sc,
          50: (N(50) || 0) + rot,
          72: g[72],
          73: g[73]
        });
        if (g[11] != null) {
          const q = ap(M, N(11), N(21));
          o.g[11] = q[0];
          o.g[21] = q[1];
        }
      } else continue;
      out.push(o);
    }
  };
  go(E, [1, 0, 0, 1, 0, 0], '0', null, 0);
  return out;
}
function parse(txt) {
  const L = txt.split(/\r?\n/),
    E = [],
    B = {},
    LY = {};
  let sec = '',
    c0 = null,
    cb = null,
    ly = null;
  for (let i = 0; i + 1 < L.length; i += 2) {
    const c = L[i].trim(),
      v = L[i + 1].trim();
    if (c === '0') {
      if (v === 'SECTION') {
        sec = (L[i + 3] || '').trim();
        c0 = null;
        cb = null;
        continue;
      }
      if (v === 'ENDSEC') {
        sec = '';
        c0 = null;
        cb = null;
        continue;
      }
      if (sec === 'TABLES') {
        ly = v === 'LAYER' ? {} : null;
        if (ly) (LY.list = LY.list || []).push(ly);
        continue;
      }
      if (sec === 'BLOCKS') {
        if (v === 'BLOCK') {
          cb = { n: null, b: [0, 0], e: [] };
          c0 = null;
        } else if (v === 'ENDBLK') {
          cb = null;
          c0 = null;
        } else if (cb) {
          c0 = { t: v, l: '0', g: {}, p: [] };
          cb.e.push(c0);
        }
        continue;
      }
      if (sec === 'ENTITIES') {
        c0 = { t: v, l: '0', g: {}, p: [] };
        E.push(c0);
      }
      continue;
    }
    if (sec === 'TABLES' && ly) {
      if (c === '2' && ly.n == null) ly.n = v;
      else if (c === '62') ly.c = +v;
      else if (c === '70') ly.f = +v;
      continue;
    }
    if (sec === 'BLOCKS' && cb && !c0) {
      if (c === '2' && cb.n === null) {
        cb.n = v;
        B[v] = cb;
      } else if (c === '10') cb.b[0] = +v;
      else if (c === '20') cb.b[1] = +v;
      continue;
    }
    if (!c0) continue;
    if (c === '8') c0.l = v;
    else if (c0.t === 'LWPOLYLINE' && c === '10') c0.p.push([+v, 0]);
    else if (c0.t === 'LWPOLYLINE' && c === '20' && c0.p.length) c0.p[c0.p.length - 1][1] = +v;
    else if (!(c in c0.g)) c0.g[c] = v;
  }
  /* v10: layers that are OFF (negative color) or FROZEN are not shown in the PDF: skip them (DCS placeholders M., I.0000, (S1) I.0091 ... and chinese) */
  const off = new Set((LY.list || []).filter(l => l.n && (l.c < 0 || l.f & 1)).map(l => l.n));
  return explode(E, B, off);
}
function build(E, name) {
  const raw = { ln: [], pl: [], ci: [], ar: [], so: [], lamp: [] },
    tx = [];
  for (const e of E) {
    const g = e.g,
      l = e.l,
      n = k => +g[k];
    if (l.toLowerCase() === 'chinese') continue;
    if (e.t === 'LINE') raw.ln.push([n(10), n(20), n(11), n(21), l]);
    else if (e.t === 'LWPOLYLINE')
      raw.pl.push([e.p, (+g[70] || 0) & 1, l, Math.max(+g[43] || 0, +g[40] || 0, +g[41] || 0)]);
    else if (e.t === 'CIRCLE') raw.ci.push([n(10), n(20), n(40), l]);
    else if (e.t === 'ARC') raw.ar.push([n(10), n(20), n(40), n(50), n(51), l]);
    else if (e.t === 'SOLID') {
      const p3 = g[13] != null ? [n(13), n(23)] : [n(12), n(22)];
      raw.so.push([[[n(10), n(20)], [n(11), n(21)], p3, [n(12), n(22)]], l]);
    } else if (e.t === 'TEXT') {
      const t = dec(g[1] || '').trim();
      if (!t || /[\u3000-\u9fff]/.test(t)) continue;
      const a = +g[72] || 0,
        b = +g[73] || 0,
        al = a || b;
      tx.push({
        t,
        ix: n(10),
        iy: n(20),
        x: al && g[11] != null ? n(11) : n(10),
        y: al && g[21] != null ? n(21) : n(20),
        h: n(40) || 2.5,
        r: n(50) || 0,
        a,
        b,
        l
      });
    }
  }
  const lc = {};
  const CK = ['HID', 'CEN', 'DCS', 'SYM', 'TXT1'];
  raw.ln.forEach(q => {
    if (
      !CK.includes(q[4]) &&
      (Math.abs(q[0] - q[2]) < 0.05 || Math.abs(q[1] - q[3]) < 0.05) &&
      Math.hypot(q[0] - q[2], q[1] - q[3]) < 130
    )
      lc[q[4]] = (lc[q[4]] || 0) + 1;
  });
  let lyr = '';
  if ((lc.CON || 0) < 5) {
    const b = Object.keys(lc).sort((a, c) => lc[c] - lc[a])[0];
    if (b && lc[b] >= 10) {
      lyr = b;
      raw.ln.forEach(q => {
        if (q[4] === b) q[4] = 'CON';
      });
      raw.pl.forEach(q => {
        if (q[2] === b) q[2] = 'CON';
      });
      raw.so.forEach(q => {
        if (q[1] === b) q[1] = 'CON';
      });
      raw.ar.forEach(q => {
        if (q[5] === b) q[5] = 'CON';
      });
      raw.ci.forEach(q => {
        if (q[3] === b) q[3] = 'CON';
      });
    }
  }
  /* v10: a few wires are drawn on the text layer (e.g. DITL-69 OR outputs at x=228-232): an orthogonal text-layer line chained to a wire = wire */
  {
    const o = q =>
        (Math.abs(q[0] - q[2]) < 0.05 || Math.abs(q[1] - q[3]) < 0.05) && Math.hypot(q[0] - q[2], q[1] - q[3]) > 0.3,
      tl = raw.ln.filter(q => (q[4] === 'TXT1' || q[4] === '0') && Math.hypot(q[0] - q[2], q[1] - q[3]) < 215 && o(q)),
      /* v27: long text-layer wires (DITL-76 / 77 vertical 132 long); they are chained only when they touch a wire end */ tc =
        (x, y, c) =>
          Math.min(c[0], c[2]) - 0.35 <= x &&
          x <= Math.max(c[0], c[2]) + 0.35 &&
          Math.min(c[1], c[3]) - 0.35 <= y &&
          y <= Math.max(c[1], c[3]) + 0.35;
    const CI = raw.ci.filter(c => c[3] === 'CON'),
      SO = raw.so
        .filter(z => z[1] === 'CON')
        .map(z => {
          const xs = z[0].map(p => p[0]),
            ys = z[0].map(p => p[1]);
          return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
        }),
      onC = (x, y) => CI.some(c => Math.abs(Math.hypot(x - c[0], y - c[1]) - c[2]) < 0.4),
      onS = (x, y) => SO.some(b => x >= b[0] - 0.35 && x <= b[2] + 0.35 && y >= b[1] - 0.35 && y <= b[3] + 0.35),
      hit = (q, C) =>
        [
          [q[0], q[1]],
          [q[2], q[3]]
        ].map(([x, y]) => C.some(c => tc(x, y, c)) || onC(x, y) || onS(x, y));
    const PE = [];
    raw.pl.forEach(([p, c, l]) => {
      if (l !== 'CON') return;
      const m = p.length + (c && p.length > 2 ? 1 : 0);
      for (let i = 0; i + 1 < m; i++) {
        const A = p[i],
          B = p[(i + 1) % p.length];
        PE.push([A[0], A[1], B[0], B[1], 'CON']);
      }
    }); /* v16: edges of CON boxes (S/R, AND) also seed the chain, so output wires drawn on the text layer are found */
    for (let ch = 1, it = 0; ch && it < 10; it++) {
      ch = 0;
      const C = raw.ln.filter(q => q[4] === 'CON').concat(PE);
      for (const q of tl) {
        if (q[4] !== 'TXT1' && q[4] !== '0') continue;
        const h = hit(q, C);
        if ((h[0] && h[1]) || ((h[0] || h[1]) && C.some(c => tc(q[0], q[1], c) || tc(q[2], q[3], c)))) {
          q[4] = 'CON';
          ch = 1;
        }
      }
    }
  }
  const isN = t => /^\d+$/.test(t.t),
    cl = [];
  tx.filter(isN).forEach(t => {
    const c = cl.find(c => Math.abs(c.x - t.ix) < 2.6);
    /* v20: one-digit and two-digit row numbers differ by ~2 in x (DITL-111 rows 4..8 were lost) */ c
      ? c.m.push(t)
      : cl.push({ x: t.ix, m: [t] });
  });
  const pit = c => {
      const y = c.m
        .map(t => t.iy)
        .sort((a, b) => b - a)
        .map((v, i, a) => (i ? a[i - 1] - v : 0))
        .slice(1)
        .sort((a, b) => a - b);
      return y.length && Math.abs(y[y.length >> 1] - 9) < 0.6;
    },
    good = cl.filter(c => c.m.length >= 5 && pit(c)).sort((a, b) => a.x - b.x),
    gl = good[0],
    gr = gl && good.length > 1 && good[good.length - 1].x - gl.x > 200 ? good[good.length - 1] : null;
  let Ln = gl ? gl.m : tx.filter(t => isN(t) && t.ix < 100),
    Rn = gr ? gr.m : tx.filter(t => isN(t) && t.ix > 300 && t.ix < 400);
  Ln = Ln.slice().sort((a, b) => b.iy - a.iy);
  if (!Ln.length) return null;
  const avg = a => a.reduce((s, t) => s + t.ix, 0) / a.length,
    x0 = avg(Ln),
    x1 = Rn.length ? avg(Rn) : x0 + 316.2;
  const rows = Ln.map(t => ({ n: +t.t, y: t.iy })),
    skip = new Set([...Ln, ...Rn]);
  const yv = rows.map(r => r.y),
    span = Math.max(...yv) + 9 - Math.min(...yv),
    fx = [];
  raw.ln.forEach(q => {
    if (Math.abs(q[0] - q[2]) < 0.05 && Math.abs(q[3] - q[1]) > span * 0.6) fx.push(q[0]);
  });
  /* v12b: column lines drawn as many short dashed pieces (new template) count too: sum the vertical pieces per x */
  const fv = fx.slice();
  {
    const G = {};
    raw.ln.forEach(q => {
      if (Math.abs(q[0] - q[2]) < 0.05) {
        const k = Math.round(q[0] * 5) / 5;
        G[k] = (G[k] || 0) + Math.abs(q[3] - q[1]);
      }
    });
    for (const k in G) if (G[k] > span * 0.6 && !fv.some(f => Math.abs(f - k) < 0.3)) fv.push(+k);
  }
  const snv = x => {
    let b = x,
      d = 4;
    fv.forEach(f => {
      if (Math.abs(f - x) < d) {
        d = Math.abs(f - x);
        b = f;
      }
    });
    return b;
  };
  const sn = x => {
    let b = x,
      d = 2.5;
    fx.forEach(f => {
      if (Math.abs(f - x) < d) {
        d = Math.abs(f - x);
        b = f;
      }
    });
    return b;
  };
  const LC = [-35.9, -15.2, -1.7, 7.3, 29.8, 74.8].map(d => sn(x0 + d)),
    RC = [-43.4, -2.9, 6.1, 19.6, 37.9].map(d => sn(x1 + d));
  const LV = LC.map(snv),
    RV = RC.map(snv),
    vr = {
      F: [LV[0], LV[1]],
      L: [LV[1], LV[2]],
      T: [LV[2], LV[4]],
      S: [LV[4], LV[5]],
      RS: [RV[0], RV[1]],
      RL: [RV[2], RV[3]],
      RT: [RV[3], RV[4]]
    }; /* v12b: visual cell boxes snapped to the real dashed column lines (logic still uses rng) */
  const rng = {
    F: [LC[0], LC[1]],
    L: [LC[1], LC[2]],
    T: [LC[2], LC[4]],
    S: [LC[4], LC[5]],
    RS: [RC[0], RC[1]],
    RL: [RC[2], RC[3]],
    RT: [RC[3], RC[4]]
  };
  const cells = {},
    rest = [];
  for (const t of tx) {
    if (skip.has(t)) {
      rest.push(t);
      continue;
    }
    let ri = rows.findIndex(r => t.y >= r.y - 3.3 && t.y < r.y + 5.7);
    if (ri < 0) ri = rows.findIndex(r => t.iy >= r.y - 3.3 && t.iy < r.y + 5.7);
    let col = null;
    if (ri >= 0) {
      for (const k in rng)
        if (t.ix >= rng[k][0] && t.ix < rng[k][1]) {
          col = k;
          break;
        }
      if (!col)
        for (const k in rng)
          if (t.x >= rng[k][0] && t.x < rng[k][1]) {
            col = k;
            break;
          }
    }
    if (col) {
      (cells[ri + ':' + col] = cells[ri + ':' + col] || []).push(t);
    } else rest.push(t);
  }
  for (const k in cells) cells[k].sort((a, b) => b.y - a.y);
  /* v12b: row band = between the real horizontal row lines (dashed) around each row, so highlights stay inside the row */
  const HY = {};
  raw.ln.forEach(q => {
    if (
      q[4] === 'HID' &&
      Math.abs(q[1] - q[3]) < 0.05 &&
      Math.min(q[0], q[2]) < LV[5] &&
      Math.max(q[0], q[2]) > LV[4]
    ) {
      /* v17: only the dashed row separators (layer HID); a wire that starts at the cell edge was cutting the shading in half */ const k =
        (Math.round(q[1] * 10) / 10).toFixed(1);
      HY[k] = 1;
    }
  });
  const hy = Object.keys(HY)
    .map(Number)
    .sort((a, b) => a - b);
  const rb = rows.map(r => {
    const c = r.y + 1.2,
      dn = hy.filter(y => y < c && c - y < 7).pop(),
      up = hy.find(y => y > c && y - c < 7);
    return dn !== undefined && up !== undefined && up - dn > 5 && up - dn < 11 ? [dn, up] : [r.y - 3.3, r.y + 5.7];
  });

  /* v26: the sheet content lines of the title block (bottom of the drawing: 1 line on old sheets, 3 lines on new ones) */
  const title = (() => {
    const D = rest.find(t => /^DITL-/i.test(t.t) && t.x > 380);
    const yd = D
      ? -D.y
      : 300.9; /* the drawing-number text sits in the same row band as the title block; its y changes with the page placement */
    const L = rest
      .filter(
        t =>
          t.x > 112 &&
          t.x < 222 &&
          -t.y > yd - 13 &&
          -t.y < yd + 8 &&
          !/^(TON|TPS|SHT|DWG|DITL)/i.test(t.t) &&
          !/^\d+(\.\d+)?\s*(secs?|s)?$/i.test(t.t) &&
          !/^[IOM]\.[0-9A-F]{4}/.test(t.t) &&
          t.t.length > 2
      )
      .sort((a, b) => b.y - a.y || a.x - b.x);
    const o = [];
    L.forEach(t => {
      const v = t.t.trim();
      if (v && !o.includes(v)) o.push(v);
    });
    return o.join(' ').replace(/\s+/g, ' ').trim();
  })();
  const sh = { name, title, raw, tx: rest, rows, rng, vr, rb, cells, sig: {}, syms: E.S || [], lyr, bv: BV };
  sh.nl = netlist(sh);
  return sh;
}
/* ---------- netlist + simulation ---------- */
/* v27: nets with two drivers (two gate outputs, or an input row and a gate) are a short between different signals: such a sheet is rebuilt with the strict T rule and that one is used when it has fewer shorts */
function mdCount(nl, sh) {
  const d = {};
  const add = (n, id) => {
    (d[n] = d[n] || new Set()).add(id);
  };
  nl.src.forEach(z => {
    if (LEFT.some(c => (sh.cells[z.row + ':' + c] || []).length)) add(z.n, 'r' + z.row);
  });
  nl.gates.forEach((g, i) => {
    if (g.t === 'NOT' && !g.done && g.vert) return;
    (g.out || []).forEach(n => add(n, 'g' + i));
  });
  return Object.values(d).filter(x => x.size > 1).length;
}
function netlist(sh) {
  const a = netlistCore(sh, false),
    c = mdCount(a, sh);
  if (!c) return a;
  const b = netlistCore(sh, true);
  if (mdCount(b, sh) < c) {
    b.strict = 1;
    return b;
  }
  return a;
}
