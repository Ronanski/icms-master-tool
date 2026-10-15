/* Ranges and curves (F(X)) of the inputs: range text near an input, min air, clamp, FX tables, AO / I-P range sources. Part of the engine (DOM-free). */
function P_isMinAir(S, b) {
  return (
    (S.tx || []).some(t => /MIN\.?\s*AIR\s*FLOW/i.test(t.t) && Math.hypot(t.x - b.cx, t.y - b.cy) <= 60) &&
    (S.tx || []).some(t => /^32\s*%/.test(t.t.trim()) && Math.hypot(t.x - b.cx, t.y - b.cy) <= 40)
  );
}
function aiBad(S, id) {
  const a = S.blk.find(z => z.id === id),
    q = a && a.sig && S.rt.st[a.sig.id];
  return !!(q && q.val > 0.5);
}
function anNetRange(S, n) {
  const d = (S.drv[n] || [])[0],
    bl = d && (d.i === undefined && d.id !== undefined ? S.blk.find(z => z.id === d.id) : d);
  if (!bl) return null;
  if (bl.k === 'AI' && bl.rng && bl.rng.hi > bl.rng.lo) return { lo: bl.rng.lo, hi: bl.rng.hi, u: bl.rng.u || '' };
  if (bl.k === 'MAN' && bl.p && bl.p.hi > bl.p.lo) return { lo: bl.p.lo, hi: bl.p.hi, u: bl.p.u || '' };
  if ((bl.k === 'PID' || bl.k === 'PIDV') && bl.p && bl.p.hi > bl.p.lo) return { lo: bl.p.lo, hi: bl.p.hi, u: '%' };
  return null;
}
function anExtRange(S, n) {
  const sg0 = S.seg[S.nets[n].segs[0]],
    r = anRange(S, { cx: sg0 ? sg0.x1 : 0, cy: sg0 ? sg0.y1 : 0 }, 45);
  if (r && r.hi > r.lo) return r;
  /* the range text written beside an input (also "RANGE : a ~ b %") belongs to the external input nearest to it (any end of any wire of the net, up to 60 units) */
  if (!S._er) {
    S._er = {};
    const rx = /(-?\d+(?:\.\d+)?)\s*~\s*(-?\d+(?:\.\d+)?)\s*(.*)$/,
      nets = S.ext.filter(m => S.nets[m] && !S.nets[m].dig);
    for (const t of S.tx) {
      const mm = t.t.replace(/%%%/g, '%').match(rx);
      if (!mm) continue;
      let bn = null,
        bd = 60;
      for (const m of nets)
        for (const i of S.nets[m].segs) {
          const s = S.seg[i];
          for (const [x, y] of [
            [s.x1, s.y1],
            [s.x2, s.y2]
          ]) {
            const d = anD(t.x, t.y, x, y);
            if (d < bd) {
              bd = d;
              bn = m;
            }
          }
        }
      if (bn != null && !(S._er[bn] && S._er[bn].d <= bd))
        S._er[bn] = { lo: +mm[1], hi: +mm[2], u: (mm[3] || '').trim(), d: bd };
    }
  }
  const q = S._er[n];
  return q && q.hi > q.lo ? { lo: q.lo, hi: q.hi, u: q.u } : null;
}
function anClamp(r, x) {
  if (!r || !(r.hi > r.lo)) return { x, cut: false };
  const y = Math.max(r.lo, Math.min(r.hi, x));
  return { x: y, cut: y !== x };
}
function anFXIn(S, b) {
  const t = b.p && b.p.tbl;
  if (!t || !(/%/.test(t.xu || '') || (/^\s*RANGE\s*$/i.test(t.xu || '') && t.xr && t.xr[0] === 0 && t.xr[1] === 100)))
    return null;
  const same = (p, q) => p.k === q.k && p.lo === q.lo && p.hi === q.hi;
  const src = (S, n, d, seen) => {
    const key = S.name + '|' + n;
    if (d > 14 || seen.has(key)) return null;
    seen.add(key);
    const dr = (S.drv[n] || []).find(q => q.k !== 'LINK');
    if (!dr) {
      if (S.ext.includes(n)) {
        /* a signal from another sheet: follow the link to the sheet that drives it */ if (!S.xlk) {
          const shh = AN.sheets.find(z => z.S === S);
          if (shh)
            try {
              linksOf(shh);
            } catch (e) {}
        }
        const l = S.xlk && S.xlk[n];
        if (l && l.from && l.from.S) {
          const FS = l.from.S,
            fn = l.fromNets.find(m => (FS.drv[m] || []).some(q => q.k !== 'LINK'));
          if (fn !== undefined) {
            const q = src(FS, fn, d + 1, seen);
            if (q) return q;
          }
        }
        const r = anExtRange(S, n);
        return r ? (r.lo === 0 && r.hi === 100 ? { k: 'id' } : { k: 'rng', lo: r.lo, hi: r.hi, u: r.u || '' }) : null;
      }
      return null;
    }
    const bl = dr.i === undefined && dr.id !== undefined ? S.blk.find(z => z.id === dr.id) : dr;
    if (!bl) return null;
    const k = bl.k;
    if (k === 'PID' || k === 'PIDV') return { k: 'id' };
    if (k === 'DIV')
      return S.kn && S.kn[bl.i[1]] !== undefined
        ? { k: 'id' }
        : { k: 'ratio' }; /* a divider by a constant written on the wire is a plain average, not a ratio */
    if (k === 'AI' || k === 'MAN') {
      const r = anNetRange(S, n);
      return r ? (r.lo === 0 && r.hi === 100 ? { k: 'id' } : { k: 'rng', lo: r.lo, hi: r.hi, u: r.u || '' }) : null;
    }
    if (k === 'FX') {
      const y = bl.p && bl.p.tbl && bl.p.tbl.yr;
      return y && y[0] === 0 && y[1] === 100 ? { k: 'id' } : null;
    }
    if (['LAG', 'LINK', 'RATE', 'RAMPB', 'ABS', 'LIM', 'HLIM', 'LLIM', 'AMT', 'SW', 'HS', 'LS', 'SEL'].includes(k)) {
      let res = null;
      for (const m of bl.i) {
        if (S.nets[m] && S.nets[m].dig) continue;
        const q = src(S, m, d + 1, seen);
        if (!q) continue;
        if (res && !same(res, q)) return null;
        res = q;
      }
      return res;
    }
    return null;
  };
  return src(S, b.i[0], 0, new Set()) || { k: '?' };
}
/* v1.20.12: range of a signal, traced to its source. src 'AI' = engineering range (AI / MAN), 'FX' = normalised factor (table Y range) */
function anRngSrc(S, n, d) {
  if (d > 12 || n == null || n < 0) return null;
  const dr = (S.drv[n] || []).find(q => q.k !== 'LINK');
  if (!dr) return null;
  const bl = dr.i === undefined && dr.id !== undefined ? S.blk.find(z => z.id === dr.id) : dr;
  if (!bl) return null;
  const k = bl.k;
  if (k === 'AI' && bl.rng && bl.rng.hi > bl.rng.lo) return { lo: bl.rng.lo, hi: bl.rng.hi, src: 'AI' };
  if (k === 'MAN' && bl.p && bl.p.hi > bl.p.lo) return { lo: bl.p.lo, hi: bl.p.hi, src: 'AI' };
  if (k === 'FX') {
    const y = bl.p && bl.p.tbl && bl.p.tbl.yr;
    return y && y[1] > y[0] ? { lo: y[0], hi: y[1], src: 'FX' } : null;
  }
  if (k === 'TP') return anRngSrc(S, bl.tpd, d + 1);
  if (['MUL', 'ABS', 'LAG', 'RATE', 'SEL', 'SW', 'AMT', 'HLIM', 'LLIM'].includes(k)) {
    let fx = null;
    for (const m of bl.i || []) {
      if (S.nets[m] && S.nets[m].dig) continue;
      const q = anRngSrc(S, m, d + 1);
      if (!q) continue;
      if (q.src === 'AI') return q;
      if (!fx) fx = q;
    }
    return fx;
  }
  return null;
}
function anAoIp(S) {
  const hasOut = (n, ex) => S.blk.some(b => b !== ex && b.pins && b.pins.some(p => p.role === 'out' && p.n === n));
  for (const a of S.blk) {
    if (a.k !== 'AO') continue;
    const po = (a.pins || []).find(p => p.role === 'out');
    if (!po || S.blk.some(b => b !== a && b.pins && b.pins.some(p => p.role === 'in' && p.n === po.n))) continue;
    let best = null,
      bd = 60;
    for (const ip of S.blk) {
      if (ip.k !== 'IP') continue;
      const pi =
        (ip.pins || []).find(p => p.role === 'in' && p.side === 'L') || (ip.pins || []).find(p => p.role === 'in');
      if (!pi || hasOut(pi.n, ip)) continue;
      const d = Math.hypot(ip.cx - a.cx, ip.cy - a.cy);
      if (d < bd) {
        bd = d;
        best = { ip, pi };
      }
    }
    if (best) best.pi.n = po.n;
  }
}
function anRngRe(S) {
  for (const b of S.blk) {
    if (b.k === 'SQRT') {
      const q = anRngSrc(S, b.i[0], 0);
      b.rin = q && q.src === 'AI' && q.lo === 0 ? q.hi : null;
      b.idn = !!b.rin;
    }
    if (b.k === 'MUL' && b.i.length >= 2) {
      const rs = b.i.map(m => anRngSrc(S, m, 0));
      if (!rs.some(q => q && q.src === 'AI')) {
        b.nrm = null;
        continue;
      }
      b.nrm = b.i.map((m, j) => {
        const dr = (S.drv[m] || []).find(q => q.k !== 'LINK'),
          q = rs[j];
        return dr && dr.k === 'FX' && q && q.src === 'FX' && q.lo === 0 && q.hi !== 1 ? q.hi : 0;
      });
      if (!b.nrm.some(x => x)) b.nrm = null;
    }
  }
}
function anFXRe(sh) {
  const S = sh.S;
  if (!S) return;
  for (const b of S.blk)
    if (b.k === 'FX' && b.p.tbl) {
      const q = anFXIn(S, b);
      b.fxin = q && q.k !== '?' && q.k !== 'id' ? q : null;
      b.fxrev = !!(q && q.k === '?');
    }
}
function anFXs(P, x) {
  const ln = P.ln,
    t = (AN.ln || {})[ln] || (P.tbl && (P.tbl.p2 || P.tbl.pts));
  if (!t || !t.length) return { y: x, st: 'NOTABLE' };
  if (!(x === x)) return { y: x, st: 'NAN' };
  const w = P.lnWarn && !(AN.ln && AN.ln[ln]) ? 'WARN' : 'OK';
  if (x < t[0][0]) return { y: t[0][1], st: 'OUT' };
  if (x > t[t.length - 1][0]) return { y: t[t.length - 1][1], st: 'OUT' };
  return { y: anFX(P, x), st: w };
}
function anFX(P, x) {
  const ln = P.ln,
    t = (AN.ln || {})[ln] || (P.tbl && (P.tbl.p2 || P.tbl.pts));
  if (!t || !t.length) return x;
  if (x <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++)
    if (x <= t[i][0]) {
      const a = t[i - 1],
        b = t[i];
      return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0] || 1);
    }
  return t[t.length - 1][1];
}
