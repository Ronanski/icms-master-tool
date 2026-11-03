/* ===== ENGINE: the name of a net (the label, the address of the wire, the text beside it, the COS manual / change-over it is, the
   block that drives it) and the COS of a net with its range. No page access.
   3.2.0 Web Worker (stage a): moved here from src/analog/ui/panel.js (the engine names the nets it reads: hmi-op.js starting states,
   plant.js, unit.js) ===== */
function nearTx(S, n) {
  const c = S.nets[n]._nt;
  if (c !== undefined) return c;
  let best = null,
    bd = 11;
  for (const i of S.nets[n].segs) {
    const s = S.seg[i];
    for (const [x, y] of [
      [s.x1, s.y1],
      [s.x2, s.y2]
    ])
      for (const t of S.tx) {
        const q = t.t.trim();
        if ((q.length < 3 && !/^(SV|PV|SP|MV)$/.test(q)) || q.length > 34 || /^[-+\d.\s%~]+$/.test(q)) continue;
        const d = Math.hypot(t.x - x, t.y - y);
        if (d < bd) {
          bd = d;
          best = q;
        }
      }
  }
  return (S.nets[n]._nt = best);
}
function cosFromNets(S, nets, self) {
  const seen = new Set();
  let fr = nets.slice(),
    g = 0;
  while (fr.length && g++ < 6) {
    const nx = [];
    for (const n of fr) {
      if (seen.has(n)) continue;
      seen.add(n);
      const l = S.lab[n];
      if (l && l.t && !/^COS/.test(l.t) && n !== nets[0]) return l.t;
      for (const b of S.cns[n] || []) {
        const tg = b.tag || (b.k === 'PID' || b.k === 'PIDV' ? (b.txt || [])[1] : '');
        if (tg && b !== self) return b.k + ' ' + tg;
        if (b.k === 'AO' || b.k === 'IP') {
          const o = (b.pins || []).map(p => S.lab[p.n] && S.lab[p.n].t).find(Boolean);
          if (o) return o;
        }
        for (const m of b.o || []) nx.push(m);
      }
    }
    fr = nx;
  }
  return '';
}
/* 2.2.0-beta.24 (M6 / checklist A10): a COS whose switch output carries no label down to the valve (AO -> I/P -> valve without a tag
   on the drawing: ABC-010, 031, 036 ~ 039 ...) is named by the controller / station on the OTHER leg of its switch (the loop it is
   the manual of). Before: "COS manual ▸ T23" (22 of 173 COS) */
function cosUpTag(S, n, d, seen) {
  if (n == null || n < 0 || d > 5 || seen.has(n)) return '';
  seen.add(n);
  for (const b of S.drv[n] || []) {
    const tg = b.tag || (b.k === 'PID' || b.k === 'PIDV' ? (b.txt || [])[1] : '');
    if (tg) return b.k + ' ' + tg;
    for (const i of b.i || []) {
      const r = cosUpTag(S, i, d + 1, seen);
      if (r) return r;
    }
  }
  return '';
}
function cosFromUp(S, t) {
  const seen = new Set();
  for (const n of [t.a, t.b].concat(t.i || [])) {
    const r = cosUpTag(S, n, 0, seen);
    if (r) return r + ' (manual of this loop)';
  }
  return '';
}
function cosRange(S, e) {
  const t = e.t,
    seen = new Set();
  let hit = null;
  const up = (n, d) => {
    if (hit || d > 6 || n == null || n < 0 || seen.has(n)) return;
    seen.add(n);
    for (const dr of S.drv[n] || []) {
      const b = S.blk.find(q => q.id === dr.id);
      if (!b) continue;
      if (b.k === 'MAN' && b.p && b.p.lo != null) {
        hit = { lo: b.p.rlo != null ? b.p.rlo : b.p.lo, hi: b.p.rhi != null ? b.p.rhi : b.p.hi, u: b.p.u || '%' };
        return;
      }
      if ((b.k === 'PID' || b.k === 'PIDV') && b.p) {
        hit = { lo: b.p.lo == null ? 0 : b.p.lo, hi: b.p.hi == null ? 100 : b.p.hi, u: '%' };
        return;
      }
      for (const q of b.i || []) up(q, d + 1);
    }
  };
  if (t) up(t.a, 0);
  if (!hit) {
    try {
      const r = anRange(S, { cx: e.c.cx, cy: e.c.cy }, 60);
      if (r && r.hi > r.lo) hit = { lo: r.lo, hi: r.hi, u: r.u || '' };
    } catch (x) {}
  }
  return hit || { lo: 0, hi: 100, u: '%' };
}
function cosSvRange(S, e) {
  if (!e.t) return null;
  let dr = null;
  try {
    dr = anRange(S, { cx: e.c.cx, cy: e.c.cy }, 60);
  } catch (x) {}
  if (dr && dr.hi > dr.lo) return null;
  for (const n of e.t.o || [])
    for (const b of S.cns[n] || [])
      for (const P of S.blk) {
        if ((P.k !== 'PID' && P.k !== 'PIDV') || !P.p || P.p.rlo == null || P.p.rhi == null || !(P.p.rhi > P.p.rlo))
          continue;
        const pp = anPins(S, P);
        if (pp && pp.dev === b && pp.sv === n) return { lo: P.p.rlo, hi: P.p.rhi, u: P.p.unit || '' };
      }
  return null;
}
function cosInfo(S, n) {
  if (!S._cm) {
    const m = (S._cm = new Map()),
      all = (S._cosAll = []),
      Ts = S.blk.filter(b => b.k === 'AMT' || b.k === 'SW'),
      unres = (S._cosUn = []),
      ds = (px, py, s) => {
        const dx = s.x2 - s.x1,
          dy = s.y2 - s.y1,
          l2 = dx * dx + dy * dy;
        let t = l2 ? ((px - s.x1) * dx + (py - s.y1) * dy) / l2 : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (s.x1 + t * dx), py - (s.y1 + t * dy));
      };
    for (const c of S.blk) {
      if (c.k !== 'COS') continue;
      const t = c.used
        ? S.blk.find(b => b.id === c.tb)
        : Ts.filter(x => Math.hypot(x.cx - c.cx, x.cy - c.cy) < 30).sort(
            (p, q) => Math.hypot(p.cx - c.cx, p.cy - c.cy) - Math.hypot(q.cx - c.cx, q.cy - c.cy)
          )[0];
      let e = null;
      if (t) {
        const net = c.used ? c.vnet : t.b >= 0 && S.ext.includes(t.b) ? t.b : null;
        if (net != null && !m.has(net)) e = { c, t, net, kind: 'T', dig: !!S.nets[net].dig };
      }
      if (!e) {
        /* an external wire that touches the diamond */ const ws = S.nets
          .filter(
            nn =>
              nn.segs.length &&
              S.ext.includes(nn.id) &&
              !m.has(nn.id) &&
              !(S.xlk && S.xlk[nn.id]) &&
              nn.segs.some(i => ds(c.cx, c.cy, S.seg[i]) < 16)
          )
          .map(nn => ({ nn, d: Math.min(...nn.segs.map(i => ds(c.cx, c.cy, S.seg[i]))) }))
          .sort((p, q) => p.d - q.d);
        if (ws.length) {
          const nn = ws[0].nn;
          const dv = S.blk.filter(x => x.k === 'DEV').find(x => (x.ip || []).some(q => q.n === nn.id)),
            sg = dv && dv.ip.find(q => q.n === nn.id).sg,
            pid = dv && (S.cns[dv.o[0]] || []).find(x => x.k === 'PID' || x.k === 'PIDV');
          e = {
            c,
            t: null,
            dev: dv,
            pid,
            net: nn.id,
            kind: 'W',
            role: dv
              ? pid && anPins(S, pid)
                ? anPins(S, pid).sv === nn.id
                  ? 'SV'
                  : 'PV'
                : sg > 0
                  ? 'SV'
                  : 'PV'
              : '',
            dig: !!nn.dig
          };
        }
      }
      if (!e && t && t.b >= 0 && !S.ext.includes(t.b))
        e = { c, t, net: null, kind: 'L', dig: !!S.nets[t.b].dig, sel: t.b };
      if (!e) {
        unres.push(c);
        continue;
      }
      all.push(e);
      if (e.net != null) m.set(e.net, e);
    }
  }
  const e = n === -99 ? null : S._cm.get(n);
  if (!e) return null;
  return cosFill(S, e);
}
function cosFill(S, e) {
  if (e.name) return e;
  if (e.kind === 'L') {
    const o = (e.t.o || [])[0],
      on = o != null ? cosFromNets(S, [o], e.t) : '',
      sn = e.sel >= 0 && S.lab[e.sel] ? S.lab[e.sel].t : 'net ' + e.sel;
    e.out = on;
    e.name = 'COS change-over ▸ ' + (on || 'T' + e.t.id) + ' (switched by ' + sn + ')';
    e.rng = null;
    return e;
  }
  if (e.kind === 'W') {
    const l = S.lab[e.net],
      P = (e.pid && e.pid.p) || {},
      tg = e.pid ? (e.pid.txt || [])[1] || e.pid.k : '';
    e.out = tg || cosFromNets(S, [e.net], null);
    e.name = 'COS manual ' + (e.role ? e.role + ' ' : '') + '▸ ' + (l && l.t ? l.t : e.out || 'wire ' + e.net);
    if (e.pid && P.rlo != null) e.rng = { lo: P.rlo, hi: P.rhi, u: P.unit || '' };
    else {
      let r = null;
      try {
        r = anRange(S, { cx: e.c.cx, cy: e.c.cy }, 45);
      } catch (x) {}
      e.rng = r && r.hi > r.lo ? { lo: r.lo, hi: r.hi, u: r.u || '' } : { lo: 0, hi: 100, u: '%' };
    }
    return e;
  }
  e.out = cosFromNets(S, e.t.o || [], e.t) || cosFromUp(S, e.t);
  e.name = 'COS manual' + (e.dig ? ' (on / off)' : '') + ' ▸ ' + (e.out || 'T' + e.t.id);
  e.rng = e.dig ? { lo: 0, hi: 1, u: '' } : cosSvRange(S, e) || cosRange(S, e);
  return e;
}
function nm(S, n) {
  {
    const ci = cosInfo(S, n);
    if (ci) return ci.name;
  }
  const l = S.lab[n];
  if (l) return l.t;
  if (S.ext.includes(n)) {
    const w = wireTag(S, n);
    if (w) return w;
    const t = nearTx(S, n);
    if (t) return t;
  }
  const c = S.cns[n] && S.cns[n][0],
    d = S.drv[n] && S.drv[n][0];
  if (d && d.k !== 'LINK') return d.k + (d.tag ? ' ' + d.tag : '') + ' out';
  if (c) return '→ ' + c.k + (c.tag ? ' ' + c.tag : '') + (S.nets[n].dig ? ' (digital)' : '');
  return 'net ' + n;
}
