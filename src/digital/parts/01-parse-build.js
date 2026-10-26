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
/* 2.4.1-beta.4 (user 2026-10-19): the DITL page works like the ABC page; the drawing edit tools are gone (the drawing is read from the DXF) */
const NOEDIT = true;
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
/* 3.2.0-beta.35 (CHECKLIST 0.2, user 2026-10-24: "iduplicate, ireconstruct sa kapareha para hindi sama-sama ang mga address"): a drawing
   that is the same for machines A ~ D shows the machine picked on its header (S.mach[sheet index] = 1 / 2 / 3 = B / C / D): its own
   inputs, values and addresses (the machine instance of the one world, src/world/world.js) */
const cur = () => {
  const s = S.sheets[S.cur],
    k = S.mach && S.mach[S.cur];
  if (k && s && typeof WORLD !== 'undefined' && WORLD.instOf) {
    const L = WORLD.instOf.get(s);
    if (L && L[k]) return L[k];
  }
  return s;
};
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
      } else if (e.t === 'LEADER') {
        /* 2.5.0-beta.14: bottom ash BA-04 / BA-11 ...: some wires are drawn as a LEADER (a line with an arrow), read as a wire there */
        o.p = e.p.map(q => ap(M, q[0], q[1]));
      } else if (e.t === 'MTEXT') {
        /* 2.5.0-beta.13: kept for the bottom ash form only (build reads it when E.ba) */
        const A = ap(M, N(10), N(20));
        Object.assign(o.g, { 1: g[1], 10: A[0], 20: A[1], 40: (N(40) || 2.5) * sc });
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
    else if ((c0.t === 'LWPOLYLINE' || c0.t === 'LEADER') && c === '10') c0.p.push([+v, 0]);
    else if ((c0.t === 'LWPOLYLINE' || c0.t === 'LEADER') && c === '20' && c0.p.length) c0.p[c0.p.length - 1][1] = +v;
    else if (!(c in c0.g)) c0.g[c] = v;
  }
  /* v10: layers that are OFF (negative color) or FROZEN are not shown in the PDF: skip them (DCS placeholders M., I.0000, (S1) I.0091 ... and chinese) */
  const off = new Set((LY.list || []).filter(l => l.n && (l.c < 0 || l.f & 1)).map(l => l.n));
  return explode(E, B, off);
}
/* 2.5.0-beta.13: BOTTOM ASH form (JAT, "130225C-BA-xx"): the same AND / OR / NOT / timer symbols as the DITL, drawn 1.4 times larger,
   and a table LOCATION | TAG.NO | FROM | NO. | SERVICE ... SERVICE | NO. | LOCATION | TO where every row is a flag (hexagon /
   pentagon, legend BA-ELEMENT_01) at its own height (no row numbers, no 9-unit pitch). The drawing is scaled to the DITL size
   (5 / 7) and read with the same reader; the rows are the flags. FROM "BA01" + NO. "01" = output item 01 of sheet BA-01. */
const BAK = 5 / 7;
function baScale(E) {
  const tt = E.filter(e => e.t === 'TEXT').map(e => (e.g[1] || '').trim());
  /* the bottom ash form (FHI / JAT, 130225C-BA-xx): "TAG.NO" (with a dot, the DITL / sootblower forms write "TAG NO."), two SERVICE and two LOCATION */
  if (!tt.includes('TAG.NO') || tt.filter(t => t === 'SERVICE').length < 2 || tt.filter(t => t === 'LOCATION').length < 2) return E;
  const k = BAK,
    G = ['10', '20', '11', '21', '12', '22', '13', '23', '40'];
  const o = E.map(e => {
    const g = { ...e.g };
    G.forEach(f => {
      if (g[f] != null && !(e.t === 'ARC' && f === '50')) g[f] = String(+g[f] * k);
    });
    if (e.t === 'LWPOLYLINE') ['41', '43'].forEach(f => g[f] != null && (g[f] = String(+g[f] * k)));
    return { ...e, g, p: e.p ? e.p.map(q => [q[0] * k, q[1] * k]) : e.p };
  });
  o.ba = 1;
  o.S = E.S;
  return o;
}
function baForm(tx, raw) {
  const H = n => tx.filter(t => t.t === n).sort((a, b) => a.ix - b.ix),
    loc = H('LOCATION'),
    svc = H('SERVICE'),
    to = H('TO')[0] || H('TAG')[0] || H('TAG NO.')[0]; /* a sheet of field outputs writes TAG (the field device) where the others write TO */
  if (loc.length < 1 || svc.length < 2 || !to) return null;
  const xL = loc[0].ix - 4,
    xR = to.ix + 22,
    G = {};
  raw.ln.forEach(q => {
    if (Math.abs(q[0] - q[2]) < 0.05 && q[0] > xL && q[0] < xR) {
      const c = Math.round(q[0] * 10) / 10;
      G[c] = (G[c] || 0) + Math.abs(q[3] - q[1]);
    }
  });
  const V = Object.keys(G)
      .map(Number)
      .filter(x => G[x] > 200)
      .sort((a, b) => a - b),
    a = V.filter(x => x < svc[0].ix + 60),
    b = V.filter(x => x > svc[1].ix - 25);
  if (a.length < 5 || b.length < 4) return null;
  const [a0, a1, a2, a3, a4] = a.slice(-5),
    [b0, b1, b2, b3] = b.slice(0, 4),
    rng = { F: [a1, a2], L: [xL, a0], T: [a0, a1], S: [a3, a4], RS: [b0, b1], RL: [b2, b3], RT: [b3, xR] };
  /* the rows: the point of a flag (two slanted lines meeting on the left edge of the SERVICE column) */
  const sl = raw.ln.filter(q => q[4] === 'CON' && Math.abs(q[0] - q[2]) > 0.3 && Math.abs(q[1] - q[3]) > 0.3),
    ys = [];
  /* the point of the flag is on the left edge of the SERVICE column, or on its right edge (conveyors BA-59: the input flag points
     to the logic) */
  for (const [x0, side] of [
    [a3, 'L'],
    [a4, 'L'],
    [b0, 'R'],
    [b1, 'R']
  ]) {
    const P = {};
    sl.forEach(q =>
      [
        [q[0], q[1]],
        [q[2], q[3]]
      ].forEach(([x, y]) => {
        if (Math.abs(x - x0) < 0.5) {
          const kk = y.toFixed(1);
          P[kk] = (P[kk] || 0) + 1;
        }
      })
    );
    Object.keys(P).forEach(kk => P[kk] >= 2 && !ys.some(v => v.side === side && Math.abs(v.y - kk) < 1) && ys.push({ y: +kk, side }));
  }
  /* a rounded flag (internal data register, STEP_n): two half circles */
  raw.ar.forEach(q => {
    if (q[5] !== 'CON' || q[2] > 4.5) return;
    const side = q[0] >= a3 - 0.3 && q[0] <= a4 + 0.3 ? 'L' : q[0] >= b0 - 0.3 && q[0] <= b1 + 0.3 ? 'R' : '';
    if (!side) return;
    q[5] = 'FLAG';
    if (!ys.some(v => v.side === side && Math.abs(v.y - q[1]) < 1)) ys.push({ y: q[1], side });
  });
  /* a wire hop (a half circle where a wire jumps over another one, BA-05 / BA-06 ...): the wire goes on straight under it
     (a hidden line, the half circle stays drawn); a crossing without a dot is not a connection */
  raw.ar.forEach(q => {
    if (q[5] !== 'CON' || q[2] > 6) return;
    const sp = (((q[4] - q[3]) % 360) + 360) % 360;
    if (Math.abs(sp - 180) > 3) return;
    const P = [q[3], q[4]].map(d => [q[0] + q[2] * Math.cos((d * Math.PI) / 180), q[1] + q[2] * Math.sin((d * Math.PI) / 180)]),
      /* the wire goes on beyond each end, on the line of the two ends (a timer D has its flat side between the ends instead) */
      at = (p, o) =>
        raw.ln.some(l => {
          if (l[4] !== 'CON') return false;
          const e = Math.hypot(l[0] - p[0], l[1] - p[1]) < 0.3 ? [l[2], l[3]] : Math.hypot(l[2] - p[0], l[3] - p[1]) < 0.3 ? [l[0], l[1]] : null;
          if (!e) return false;
          const cr = (o[0] - p[0]) * (e[1] - p[1]) - (o[1] - p[1]) * (e[0] - p[0]);
          return Math.abs(cr) < 0.05 * Math.hypot(o[0] - p[0], o[1] - p[1]) * Math.hypot(e[0] - p[0], e[1] - p[1]) && Math.hypot(e[0] - o[0], e[1] - o[1]) > Math.hypot(p[0] - o[0], p[1] - o[1]);
        });
    if (!at(P[0], P[1]) || !at(P[1], P[0])) return;
    raw.ln.push([P[0][0], P[0][1], P[1][0], P[1][1], 'CON', 'hop']);
    q[5] = 'HOP';
  });
  /* 2.5.0-beta.14 (PDF audit BA-20 M.1307 LAST CYCLE OVER): the pulse box (a square with the pulse glyph, its TR tag above) and the
     COUNTER box ("+1", "=4", R at the bottom) are blocks, not wires: their lines go to layer BOX, the netlist makes the gates */
  raw.bab = [];
  {
    const inB = (q, b) => [[q[0], q[1]], [q[2], q[3]]].every(([x, y]) => x >= b.x1 - 0.1 && x <= b.x2 + 0.1 && y >= b.y1 - 0.1 && y <= b.y2 + 0.1);
    raw.pl.forEach(p => {
      if (p[2] !== 'CON' || p[0].length < 4 || p[0].length > 5) return;
      const xs = p[0].map(q => q[0]),
        ys = p[0].map(q => q[1]),
        b = { x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) };
      if (b.x2 - b.x1 < 8 || b.x2 - b.x1 > 15 || b.y2 - b.y1 < 8 || b.y2 - b.y1 > 15) return;
      const tg = tx.find(t => /^TR\s?\d+$/i.test(t.t) && t.ix > b.x1 - 4 && t.ix < b.x2 + 4 && t.iy > b.y2 && t.iy < b.y2 + 6);
      const gl = raw.ln.filter(q => q[4] === 'CON' && inB(q, b));
      if (!tg || gl.length < 3) return;
      p[2] = 'BOX';
      gl.forEach(q => (q[4] = 'BOX'));
      raw.bab.push({ k: 'pulse', tag: tg.t, ...b });
    });
    tx.filter(t => /^COUNTER\b/i.test(t.t)).forEach(t => {
      const top = raw.ln.find(q => q[4] === 'CON' && Math.abs(q[1] - q[3]) < 0.05 && q[1] < t.iy && t.iy - q[1] < 3 && Math.abs(Math.min(q[0], q[2]) - t.ix) < 4);
      if (!top) return;
      const x1 = Math.min(top[0], top[2]),
        x2 = Math.max(top[0], top[2]),
        lv = raw.ln.filter(q => q[4] === 'CON' && Math.abs(q[0] - q[2]) < 0.05 && Math.abs(q[0] - x1) < 0.1 && Math.max(q[1], q[3]) >= top[1] - 0.1);
      if (!lv.length) return;
      const b = { x1, x2, y1: Math.min(...lv.map(q => Math.min(q[1], q[3]))), y2: top[1] };
      const pre = tx.find(t2 => /^=\s*\d+$/.test(t2.t) && t2.ix > x1 && t2.ix < x2 && t2.iy > b.y1 && t2.iy < b.y2);
      raw.ln.forEach(q => q[4] === 'CON' && inB(q, b) && (q[4] = 'BOX'));
      raw.bab.push({ k: 'cnt', pre: pre ? +pre.t.replace(/\D/g, '') : 1, ...b });
    });
  }
  const rows = [];
  /* 2.5.0-beta.14 (PDF audit BA-21 M.1332, BA-48 M.134C, BA-67 M.092C): an input flag and an output flag up to 4.5 apart are one
     row (the row is at the input flag: its tag, FROM and service); before, two rows and the input wire on the empty one */
  ys.sort((p, q) => q.y - p.y).forEach(v => {
    const r = rows.find(r => Math.abs(r.wy - v.y) < 1) || rows.find(r => !r[v.side] && Math.abs(r.wy - v.y) < 4.5);
    if (r) {
      if (v.side === 'L') {
        if (r.R && Math.abs(r.wy - v.y) >= 1) r.ry = r.wy;
        r.wy = v.y;
      } else if (Math.abs(r.wy - v.y) >= 1) r.ry = v.y;
      r[v.side] = 1;
    } else rows.push({ wy: v.y, [v.side]: 1 });
  });
  if (!rows.length) return null;
  /* the flags and the NO. circles are drawn, they are not wires */
  const inC = (x, c) => x >= c[0] - 0.3 && x <= c[1] + 0.3;
  raw.ln.forEach(q => {
    if (q[4] !== 'CON') return;
    if ((inC(q[0], [a2, a4]) && inC(q[2], [a2, a4])) || (inC(q[0], [b0, b2]) && inC(q[2], [b0, b2]))) q[4] = 'FLAG';
  });
  raw.ci.forEach(c => {
    if (c[3] === 'CON' && (inC(c[0], [a2, a3]) || inC(c[0], [b1, b2]))) c[3] = 'FLAG';
  });
  const out = rows.map((r, i) => Object.assign({ n: i + 1, y: r.wy - 1.04, L: r.L, R: r.R }, r.ry === undefined ? {} : { ry: r.ry - 1.04 })),
    band = (t, r) => t.iy >= r.y - 3.3 && t.iy < r.y + 5.7,
    num = /^\d{1,2}$/,
    drop = new Set();
  out.forEach(r => {
    const it = tx.find(t => num.test(t.t) && t.ix >= a2 - 1 && t.ix < a3 + 1 && band(t, r)),
      fr = tx.find(t => /^BA\d{2}$/.test(t.t) && t.ix >= a1 - 1 && t.ix < a2 + 1 && band(t, r)),
      ri = tx.find(t => num.test(t.t) && t.ix >= b1 - 1 && t.ix < b2 + 1 && band(t, r));
    if (it && fr) {
      fr.t = fr.t + '-' + it.t.padStart(2, '0');
      drop.add(it);
    }
    if (ri && r.R) r.rn = +ri.t;
    else if (r.R && r.ry !== undefined) {
      const q = tx.find(t => num.test(t.t) && t.ix >= b1 - 1 && t.ix < b2 + 1 && t.iy >= r.ry - 3.3 && t.iy < r.ry + 5.7);
      if (q) r.rn = +q.t;
    }
  });
  for (let i = tx.length - 1; i >= 0; i--) if (drop.has(tx[i])) tx.splice(i, 1);
  out.forEach(r => {
    delete r.L;
    delete r.R;
  });
  return { rows: out, skip: new Set(), rng, vr: rng, LV: [xL, a0, a1, a2, a3, a4] };
}
function build(E, name) {
  E = baScale(E);
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
    } else if (e.t === 'LEADER' && E.ba) {
      for (let k = 1; k < e.p.length; k++) raw.ln.push([e.p[k - 1][0], e.p[k - 1][1], e.p[k][0], e.p[k][1], l]);
      /* its arrow head is at the first point (drawn as the DITL arrow: a 3 x 1 solid triangle) */
      if (e.p.length > 1) {
        const [x, y] = e.p[0],
          d = Math.hypot(e.p[1][0] - x, e.p[1][1] - y) || 1,
          ux = (e.p[1][0] - x) / d,
          uy = (e.p[1][1] - y) / d,
          b = [x + 3 * ux, y + 3 * uy];
        raw.so.push([[[b[0] - 0.5 * uy, b[1] + 0.5 * ux], [x, y], [b[0] + 0.5 * uy, b[1] - 0.5 * ux], [b[0] + 0.5 * uy, b[1] - 0.5 * ux]], l]);
      }
    } else if (e.t === 'MTEXT' && E.ba) {
      /* bottom ash: "STEP≧2" is an MTEXT (font UniversalMath "]" = ≧) */
      const t = String(g[1] || '')
        .replace(/\\fUniversalMath[^;]*;\]/g, '≥')
        .replace(/\\fUniversalMath[^;]*;\[/g, '≤')
        .replace(/\\[fFHWQACTp][^;]*;/g, '')
        .replace(/\\P/g, ' ')
        .replace(/[{}]/g, '')
        .trim();
      if (t) tx.push({ t, ix: n(10), iy: n(20), x: n(10), y: n(20) - (n(40) || 2.5) / 2, h: n(40) || 2.5, r: 0, a: 1, b: 0, l });
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
  const F0 = E.ba
    ? baForm(tx, raw)
    : (() => {
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
        /* 2.3.0-beta.1 (LINK-2): a row number written with a letter (DITL-21A row "21A", COOLER A REMOTE MODE SELECTED, output 71) is
     that row: a text "<number><letter>" in the number column, on the row pitch, whose number is missing */
        if (Ln.length >= 5) {
          const xs = Ln.reduce((s, t) => s + t.ix, 0) / Ln.length,
            have = new Set(Ln.map(t => +t.t));
          for (const t of tx)
            if (/^\d+[A-Z]$/.test(t.t) && Math.abs(t.ix - xs) < 4 && !have.has(parseInt(t.t, 10))) {
              have.add(parseInt(t.t, 10));
              Ln = Ln.concat([t]);
            }
        }
        Ln = Ln.slice().sort((a, b) => b.iy - a.iy);
        if (!Ln.length) return null;
        const avg = a => a.reduce((s, t) => s + t.ix, 0) / a.length,
          x0 = avg(Ln),
          x1 = Rn.length ? avg(Rn) : x0 + 316.2;
        const rows = Ln.map(t => ({ n: parseInt(t.t, 10), y: t.iy })),
          skip = new Set([...Ln, ...Rn]);
        /* 2.5.0-beta.12 (sootblower DITL-80N): the right NO. column is numbered on its own (left 1, "• • •", 29, 30 ... / right 73, 74,
     75 ...): each row keeps its right number (rn); a right number beside a "• • •" band of the left side is a row of its own */
        if (
          gr &&
          gl &&
          Rn.some(
            t =>
              !rows.some(r => Math.abs(r.y - t.iy) < 1) || rows.some(r => Math.abs(r.y - t.iy) < 1 && +t.t - r.n !== 50)
          )
        ) {
          for (const t of Rn) {
            const r = rows.find(q => Math.abs(q.y - t.iy) < 1);
            if (r) r.rn = +t.t;
            else if (!rows.some(q => Math.abs(q.y - t.iy) < 4.5) && !rows.some(q => q.n === +t.t))
              rows.push({ n: +t.t, y: t.iy, rn: +t.t });
          }
          rows.sort((a, b) => b.y - a.y);
        }
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
        /* 2.5.0-beta.12 (sootblower DITL-80G / 80K): the narrow form FROM | NO. | SERVICE (no LOCATION / TAG NO. column, the address is
     written at the end of the SERVICE cell) and no output column: the outputs go to the SB PANEL (O.07xx) below the logic */
        {
          const svc = tx.find(t => t.t === 'SERVICE' && t.x > x0 && t.x - x0 < 35);
          if (svc && !tx.some(t => /^(TAG NO\.|LOCATION)$/.test(t.t))) {
            const lv = fv.filter(f => f < x0).sort((a, b) => b - a),
              rv = fv.filter(f => f > x0).sort((a, b) => a - b),
              L0 = lv.length ? lv[0] : x0 - 5,
              L1 = rv.length ? rv[0] : x0 + 4,
              L2 = rv.find(f => f > svc.x) || svc.x + 25,
              Fl = lv.length > 1 ? lv[1] : L0 - 15,
              xm =
                Math.max(
                  ...raw.ln.filter(q => q[4] === 'CON').flatMap(q => [q[0], q[2]]),
                  ...raw.pl.filter(q => q[2] === 'CON').flatMap(q => q[0].map(p => p[0]))
                ) + 20;
            LC.splice(0, 6, Fl, L0, L0, L0, L1, L2);
            RC.splice(0, 5, xm, xm + 40, xm + 41, xm + 60, xm + 80);
          }
        }
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
        return { rows, skip, rng, vr, LV };
      })();
  if (!F0) return null;
  const { rows, skip, rng, vr, LV } = F0;
  const cells = {},
    rest = [];
  for (const t of tx) {
    if (skip.has(t)) {
      rest.push(t);
      continue;
    }
    /* 2.5.0-beta.14: the right-hand cells of a bottom ash row with its output flag a little off (r.ry) */
    const rgt = ['RS', 'RL', 'RT'].some(k => rng[k] && t.ix >= rng[k][0] && t.ix < rng[k][1]),
      yr = r => (rgt && r.ry !== undefined ? r.ry : r.y);
    let ri = rows.findIndex(r => t.y >= yr(r) - 3.3 && t.y < yr(r) + 5.7);
    if (ri < 0) ri = rows.findIndex(r => t.iy >= yr(r) - 3.3 && t.iy < yr(r) + 5.7);
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
  /* 2.5.0-beta.14 (PDF audit): the NO. "02" of these FROM cells is drawn in the PDF but is not a text of the DXF (the output NO. 02
     POWER FAULT of BA-66 / 67 / 68 / 69, whose TO column names this sheet) */
  if (E.ba) {
    const me = (/BA(\d{2})$/.exec(name || '') || [])[1];
    for (const [sh, rn, fr] of [
      ['72', 9, 'BA66'],
      ['73', 3, 'BA67'],
      ['73', 9, 'BA68'],
      ['74', 3, 'BA69']
    ]) {
      const c = me === sh && cells[rn - 1 + ':F'],
        t = c && c.find(q => q.t === fr);
      if (t) t.t = fr + '-02';
    }
  }
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
  if (E.ba) sh.ba = 1; /* bottom ash form (netlist: a single thin bar on an AND box is its input bus) */
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
/* 2.3.0-beta.1 (LINK-2): the built-in and saved sheets were read before rows numbered with a letter were known (DITL-21A row "21A",
   BOTTOM ASH SCREW COOLER A REMOTE MODE SELECTED, output 71 COOLER A REMOTE to 21A-6, 21B-3, 21C-01 ...): add the missing row, give it
   the texts of its band, and move the cells of the rows below it by one (idempotent: nothing to do once the row is there) */
function letterRows(sh) {
  if (!sh || !sh.rows || !sh.rows.length || !sh.rng || !sh.rng.T || !Array.isArray(sh.tx)) return;
  const x0 = sh.rng.T[0] + 1.7,
    have = new Set(sh.rows.map(r => +r.n));
  for (const t of sh.tx.slice()) {
    if (!/^\d+[A-Z]$/.test(String(t.t).trim()) || Math.abs(t.ix - x0) > 4) continue;
    const n = parseInt(t.t, 10);
    if (have.has(n)) continue;
    let at = sh.rows.findIndex(r => r.y < t.iy);
    if (at < 0) at = sh.rows.length;
    if ((at > 0 && +sh.rows[at - 1].n !== n - 1) || (at < sh.rows.length && +sh.rows[at].n !== n + 1)) continue;
    have.add(n);
    const sh1 = o => {
      if (!o) return o;
      const q = {};
      for (const k in o) {
        const m = /^(\d+):(.*)$/.exec(k);
        q[m && +m[1] >= at ? +m[1] + 1 + ':' + m[2] : k] = o[k];
      }
      return q;
    };
    sh.cells = sh1(sh.cells);
    sh.sig = sh1(sh.sig || {});
    sh.rows.splice(at, 0, { n, y: t.iy });
    if (Array.isArray(sh.rb)) sh.rb.splice(at, 0, [t.iy - 3.3, t.iy + 5.7]);
    sh.tx = sh.tx.filter(z => z !== t);
    for (const z of sh.tx.slice()) {
      if (!(z.y >= t.iy - 3.3 && z.y < t.iy + 5.7) && !(z.iy >= t.iy - 3.3 && z.iy < t.iy + 5.7)) continue;
      let col = null;
      for (const k in sh.rng)
        if (z.ix >= sh.rng[k][0] && z.ix < sh.rng[k][1]) {
          col = k;
          break;
        }
      if (!col) continue;
      (sh.cells[at + ':' + col] = sh.cells[at + ':' + col] || []).push(z);
      sh.tx = sh.tx.filter(q => q !== z);
    }
    for (const k in sh.cells) if (k.startsWith(at + ':')) sh.cells[k].sort((a, b) => b.y - a.y);
    sh._alltx = undefined;
  }
}
/* 2.5.0-beta.11 (DITL PDF audit, DITL-73 / 74 / 75 / 78 / 80 / 81 / 83 and more): the timer tag of a pulse drawn at the end of the input
   cell ("TR360") was read as the text of an input row (row 18 became an input "TR360"). It is a label of the logic: move it out of the
   row cells (idempotent) */
function trCells(sh) {
  if (!sh || !sh.cells || !Array.isArray(sh.tx) || sh._trc) return;
  sh._trc = 1;
  for (const k in sh.cells) {
    if (!LEFT.includes(k.split(':')[1])) continue;
    const keep = sh.cells[k].filter(t => !/^TR\s?\d{1,4}(\s*[/,]\s*\d{1,4})*\/?$/.test(String(t.t).trim()));
    if (keep.length === sh.cells[k].length) continue;
    sh.cells[k].filter(t => !keep.includes(t)).forEach(t => sh.tx.push(t));
    if (keep.length) sh.cells[k] = keep;
    else delete sh.cells[k];
  }
}
/* 2.5.0-beta.11 (DITL PDF audit, "References wrong"): texts of an output row that overflow into the band of the row above / below
   (a long TO list, the address written under the lamp). Each entry was read on the drawing PDF: [sheet, text, from row, to row]
   (row = NO. 1-50 of the app line; '*' = every text of that row's right cells; from row 0 = a loose text of the sheet) */
const ROWFIX = [
  ['03A', '*', 10, 13],
  ['03A', '*', 11, 13],
  ['03A', '*', 12, 13],
  ['21C', '21D-09', 5, 4],
  ['21C', '21D-13', 7, 6],
  ['21D', '21E-6,21E-20', 3, 2],
  ['29A', 'I.032A/526/81A', 4, 5],
  ['29A', '(29A-9)', 4, 5],
  ['29A', '(29A-13)', 4, 5],
  ['29A', '39-2,ABC-052', 6, 5],
  ['29A', '(39-3)', 6, 5],
  ['29A', '(39-4)', 6, 5],
  ['29A', 'I.032D/529/81D', 6, 7],
  ['29A', '(29A-12)', 18, 17],
  ['29A', 'I.032B/527/81B', 18, 17],
  ['29A', 'I.032C/528/81C', 13, 12],
  ['29B', '(29A-15)', 19, 18],
  ['29B', '*', 6, 5],
  ['29B', '*', 11, 10],
  ['29B', '*', 13, 12],
  ['111', '120-13', 9, 8],
  ['111', '(120-14)', 9, 8],
  ['73', '*', 28, 27],
  ['73', '*', 29, 27],
  ['73', '107-03,108-02', 0, 27],
  ['73', '109-03,110-03', 0, 27]
];
/* 2.5.0-beta.12 (user: "may mga DITL pages na wala pa ... SOOTBLOWER"): the sootblower logic (station 102, drawing set
   "SOOTBLOWER CONTROL LOGIC DIAGRAM", sheets "(S3)DITL-80" ~ "(S23)DITL-80T") has its own DITL-80, not the HRH drain DITL-80.
   A reference "80-12" / "80K-14" goes to the sootblower sheet when it is written on a sootblower sheet, or when only the
   sootblower set has that code (DITL-43 "80K-14 (FOR S/B LOGIC)") */
const isSB = x => /^\(S\d+\)/.test((x && x.name) || '');
function ditlIdx(code, from) {
  const re = new RegExp('DITL-' + code + '$', 'i'),
    sb = isSB(from);
  let i = S.sheets.findIndex(x => re.test(x.name) && isSB(x) === sb);
  if (i < 0) i = S.sheets.findIndex(x => re.test(x.name));
  if (i < 0 && /[A-Z]$/.test(code)) {
    const r2 = new RegExp('DITL-' + code.replace(/[A-Z]$/, '') + '$', 'i');
    i = S.sheets.findIndex(x => r2.test(x.name) && !isSB(x) && !sb);
  }
  return i;
}
/* 2.5.0-beta.12: the item number of an output row = its row number + the offset of the right NO. column: 50 on the DITL form
   (row 1 = item 51), 300 on sootblower DITL-80M (rows 1 ~ 148, outputs 301 ~ 448) */
function rOff(sh) {
  if (sh._roff) return sh._roff;
  let o = 50;
  const r0 = sh.rows && sh.rows[0];
  if (r0 && sh.rng && sh.rng.RS && sh.rng.RL) {
    const t = (sh.tx || []).find(
      q =>
        /^\d{2,3}$/.test(q.t) &&
        Math.abs(q.iy - r0.y) < 1 &&
        q.ix > sh.rng.RS[1] - 2 &&
        q.ix < sh.rng.RL[1] + 2 &&
        +q.t > r0.n
    );
    if (t) o = +t.t - r0.n;
  }
  return (sh._roff = o);
}
/* item nn of a sheet (FROM / TO "80M-302"): {i: row index, side: 'L' input / 'R' output} or null */
function ditlItem(sh, nn) {
  if (sh.rows.some(r => r.rn)) {
    const j = sh.rows.findIndex(r => r.rn === nn);
    if (j >= 0) return { i: j, side: 'R' };
    const k = sh.rows.findIndex(r => +r.n === nn && r.rn !== +r.n);
    return k < 0 ? null : { i: k, side: 'L' };
  }
  const o = rOff(sh),
    out = nn > o,
    i = sh.rows.findIndex(r => +r.n === (out ? nn - o : nn));
  return i < 0 ? null : { i, side: out ? 'R' : 'L' };
}
function rowFix(sh) {
  if (!sh || !sh.cells || !sh.rows || sh._rfx) return;
  sh._rfx = 1;
  const me = !isSB(sh) && (/DITL-(\w+)$/.exec(sh.name) || [])[1],
    ix = n => sh.rows.findIndex(r => +r.n === n);
  for (const [nm, tx, a, b] of ROWFIX) {
    if (nm !== me) continue;
    const j = ix(b);
    if (j < 0) continue;
    if (!a) {
      const t = sh.tx.find(q => q.t === tx);
      if (!t) continue;
      sh.tx.splice(sh.tx.indexOf(t), 1);
      (sh.cells[j + ':RL'] = sh.cells[j + ':RL'] || []).push(t);
      continue;
    }
    const i = ix(a);
    if (i < 0) continue;
    for (const c of ['RS', 'RL', 'RT']) {
      const k = i + ':' + c,
        mv = (sh.cells[k] || []).filter(t => tx === '*' || t.t === tx);
      if (!mv.length) continue;
      sh.cells[k] = sh.cells[k].filter(t => !mv.includes(t));
      if (!sh.cells[k].length) delete sh.cells[k];
      (sh.cells[j + ':' + c] = sh.cells[j + ':' + c] || []).push(...mv);
      sh.cells[j + ':' + c].sort((p, q) => q.y - p.y);
    }
  }
}
function netlist(sh) {
  if (sh.sd) return sdNL(sh); /* 3.2.0-beta.40: sand injection (PDF drawing, no row table): the netlist comes from sh.sd (02b-sand.js) */
  letterRows(sh);
  trCells(sh);
  rowFix(sh);
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
