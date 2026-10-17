/* ===== ENGINE: sheets (one model per drawing: ensure), station of a sheet, F(X) tables of the LINEAR data, pull of the signals that come from other sheets. No page access: the page gives the raw tables through AN.lnSrc() and takes the result from AN.lt ===== */
function shStn(sh) {
  if (sh.stn === undefined && sh.S) sh.stn = stnOf(sh.S);
  return sh.stn;
}
function lnTables() {
  if (AN.lt) return AN.lt;
  let a = [];
  try {
    if (AN.lnSrc) a = AN.lnSrc() || [];
  } catch (x) {}
  a.forEach(t => {
    const o = [];
    (t.pts || []).forEach(p => {
      const q = o[o.length - 1];
      if (!q || q[0] !== p[0] || q[1] !== p[1]) o.push([p[0], p[1]]);
    });
    o.sort((p, q) => p[0] - q[0]);
    t.p2 = o;
  });
  AN.lt = a;
  lnApplyEdits();
  return a;
}
function lnApplyEdits() {
  for (const t of lnTables()) {
    if (!t.o0) t.o0 = (t.pts || []).map(p => [p[0], p[1]]);
    const e = AN.lne && AN.lne[t.key];
    let pts = t.o0;
    if (e && e.lx && e.ly && e.lx.length === t.o0.length && t.xr && t.yr)
      pts = e.lx.map((lx, i) => [
        t.xr[0] + (lx * (t.xr[1] - t.xr[0])) / 100,
        t.yr[0] + (e.ly[i] * (t.yr[1] - t.yr[0])) / 100
      ]);
    t.pts = pts;
    const o = [];
    pts.forEach(p => {
      const q = o[o.length - 1];
      if (!q || q[0] !== p[0] || q[1] !== p[1]) o.push([p[0], p[1]]);
    });
    o.sort((p, q) => p[0] - q[0]);
    t.p2 = o;
    t.edited = !!e;
  }
}
function stnOf(S) {
  const c = {};
  for (const t of S.tx) {
    const m = /^S(\d)-(?:MDL|LN)/i.exec(t.t.trim());
    if (m) c[m[1]] = (c[m[1]] || 0) + 1;
  }
  const e = Object.entries(c).sort((a, b) => b[1] - a[1]);
  if (e.length) return +e[0][0];
  const L = [
    ...new Set(
      S.blk
        .filter(b => b.k === 'FX' && b.p.ln)
        .map(b => +(/LN(\d+)/i.exec(b.p.ln) || [])[1])
        .filter(Boolean)
    )
  ];
  if (!L.length) return null;
  const tb = lnTables(),
    cand = [1, 2, 3, 4, 5].filter(s => L.every(n => tb.some(t => t.stn === s && t.ln === n)));
  return cand.length === 1 ? cand[0] : null;
}
function lnResolve(name, ln, stn) {
  const m = /LN(\d+)/i.exec(ln || '');
  if (!m) return {};
  const n = +m[1],
    all = lnTables().filter(t => t.ln === n);
  if (!all.length) return { warn: 'no table LN' + n + ' in the LINEAR data: the block passes the value (y = x)' };
  if (stn != null) {
    const ex = all.find(t => t.stn === stn);
    if (ex) return { t: ex };
    if (all.length === 1)
      return {
        t: all[0],
        warn:
          'station S' +
          stn +
          ' has no LN' +
          n +
          ': using ' +
          all[0].key +
          ' (the only one that exists). Check the drawing.'
      };
    return {
      warn:
        'station S' +
        stn +
        ' has no LN' +
        n +
        ' (exists in ' +
        all.map(t => 'S' + t.stn).join(', ') +
        '): no table, y = x'
    };
  }
  const t = lnFind(name, ln);
  return t
    ? { t, warn: 'station of this sheet unknown: table chosen by drawing name (' + t.key + ')' }
    : { warn: 'station unknown and table LN' + n + ' ambiguous' };
}
function lnFind(name, ln) {
  const m = /LN(\d+)/i.exec(ln || '');
  if (!m) return null;
  const n = +m[1],
    c = lnTables().filter(t => t.ln === n);
  if (!c.length) return null;
  const fo = x => {
    const q = /^ABC-(\d+)/.exec(x || '');
    return q ? +q[1] : null;
  };
  return (
    c.find(t => t.dwg === name) ||
    c.find(t => fo(t.dwg) != null && fo(t.dwg) === fo(name)) ||
    (c.length === 1 ? c[0] : null)
  );
}
function ensure(sh) {
  if (sh.S) return sh.S;
  const S = anWire(anModel(anNets(anBuild(sh.R, sh.name))));
  anAoIp(S);
  anCompile(S);
  anInit(S);
  S.procs = anProcList(S);
  if (AN.procDefault === true || (AN.procDefault === undefined && AN.plantOn === true))
    for (const b of S.procs) b.proc.on = true;
  sh.S = S;
  sh.cnt = {};
  S.blk.forEach(b => {
    sh.cnt[b.k] = (sh.cnt[b.k] || 0) + 1;
    if (b.k === 'FX' && b.p.ln) {
      if (sh.stn === undefined) sh.stn = stnOf(S);
      const r = lnResolve(sh.name, b.p.ln, sh.stn);
      if (r.t) {
        Object.defineProperty(b.p, 'tbl', { value: r.t, writable: true, enumerable: false, configurable: true });
        const q = anFXIn(S, b);
        b.fxin = q && q.k !== '?' && q.k !== 'id' ? q : null;
        b.fxrev = !!(q && q.k === '?');
      }
      if (r.warn)
        Object.defineProperty(b.p, 'lnWarn', { value: r.warn, writable: true, enumerable: false, configurable: true });
    }
    b.p0 = JSON.stringify(b.p);
  });
  anRngRe(S);
  if (AN.applySaved) AN.applySaved(sh);
  anPull(sh);
  anSettle(S, 6);
  return S;
}
function anPull(sh) {
  try {
    const S = sh.S;
    if (!S) return;
    for (const l of linksOf(sh)) {
      if (l.to !== sh) continue;
      const FS = l.from.S || ensure(l.from);
      if (!FS) continue;
      const val =
        l.flagSrc != null
          ? FS.rt.st[l.flagSrc] && FS.rt.st[l.flagSrc].val > 0.5
            ? 1
            : 0
          : FS.rt.v[l.fromNets.find(n => FS.drv[n].length) ?? l.fromNets[0]];
      for (const n of l.toNets)
        if (S.ext.includes(n)) {
          S.rt.ext[n] = val;
          S.xlk = S.xlk || {};
          S.xlk[n] = l;
        }
    }
  } catch (e) {}
}
/* RESET of the model: every sheet back to the drawing (tuning kept in AN.sv), then all sheets are settled: the same start as a fresh load, whatever the sheet order */
function anResetAll() {
  anUnitStop(); /* 2.2.0-beta.9: Reset = cold boiler, the unit model stops (2.2.0-beta.11: and its load disturbance of the spray loops) */
  for (const sh of AN.sheets) {
    if (!sh.S) continue;
    const S = sh.S;
    S.look = {};
    anInit(S);
    /* 2.1.0: the plant model of every sheet follows the same rule as a fresh load (ensure): before, a sheet loaded before the
       plant was switched on kept it OFF until RUN, so Reset on a fresh page and Reset after a run gave another start (5 sheets) */
    if (AN.procDefault === true || (AN.procDefault === undefined && AN.plantOn === true)) for (const b of S.procs || []) if (b.proc) b.proc.on = true;
    /* 2.1.0-beta.6: the anchors made by "Start at 150 MW" go away: Reset = cold start */
    for (const b of S.procs || [])
      if (b.proc) {
        if (b.proc.hop && b.proc.hop.dyn) {
          b.proc.hop = undefined;
          b.proc.Ka = undefined;
        }
        b.proc.hopReq = null;
        b.proc.integLoss = 0;
      }
    const v = AN.sv[sh.name];
    if (v && v.p)
      for (const id in v.p) {
        const b = S.blk[id];
        if (b) Object.assign(b.p, v.p[id]);
      }
    sh._hs = [];
  }
  /* 2.1.0: the controllers of other sheets on the same measurement (procRemote, pr.xsh) are known before the settle, like
     during RUN: before, the first Reset of a fresh page settled without them (ABC-001C main steam pressure 75 instead of 112.5) */
  for (const sh of AN.sheets)
    if (sh.S)
      try {
        procRemote(sh);
      } catch (e) {}
  {
    const seen = new Set(),
      fr = sh => {
        if (!sh.S || seen.has(sh)) return;
        seen.add(sh);
        try {
          for (const l of linksOf(sh)) if (l.to === sh) fr(l.from);
        } catch (e) {}
        anPull(sh);
        anSettle(sh.S, 6);
      };
    for (const sh of AN.sheets) fr(sh);
  } /* all sheets are re-initialised first, then settled: the same start as a fresh load, whatever the sheet order (cross-sheet back-up values) */
}
/* A/M STATION of a controller (PID / PIDV): the selector AFTER the PID that has a manual source (a MAN station or an operator input / COS); a selector before it (FAULT hold, back-up) stays on the controller leg. autoLeg = the leg that carries the controller output (AUTO), the other leg is MANUAL. Used by the panel and by the force-manual logic of the engine. */
function anStationOf(S, b) {
  /* the controller output is the analog output of the PID that leads to a switch (a PID can have a second output pin: ABC-005 AICFG10571) */
  const cands = b.o.filter(n => !S.nets[n].dig);
  if (!cands.length) cands.push(b.o[0]);
  let chain = [],
    st0 = cands[0],
    op = cands[0];
  for (const c0 of cands) {
    const ch = [];
    let cur = c0,
      s0 = c0;
    for (let g = 0; g < 6; g++) {
      let sw = S.blk.find(
        z =>
          (z.k === 'AMT' || z.k === 'SW') &&
          z.a != null &&
          z.b != null &&
          z.o[0] != null &&
          (z.a === cur || z.b === cur) &&
          !ch.includes(z)
      );
      if (!sw && !ch.length) {
        /* the first switch is behind summing blocks (bias / feed-forward) */ for (let h = 0; h < 3 && !sw; h++) {
          const m = S.blk.find(
            z =>
              (z.k === 'SUM' || z.k === 'ADD' || z.k === 'SUB') &&
              z.ip &&
              z.ip.some(q => q.n === cur) &&
              z.o &&
              z.o.length === 1
          );
          if (!m) break;
          cur = m.o[0];
          sw = S.blk.find(
            z =>
              (z.k === 'AMT' || z.k === 'SW') &&
              z.a != null &&
              z.b != null &&
              z.o[0] != null &&
              (z.a === cur || z.b === cur)
          );
        }
        if (sw) s0 = cur;
      }
      if (!sw) break;
      ch.push(sw);
      cur = sw.o[0];
    }
    if (ch.length) {
      chain = ch;
      st0 = s0;
      op = c0;
      break;
    }
  }
  const legOf = (sw, i) => (i === 0 ? (sw.a === st0 ? 'A' : 'B') : sw.a === chain[i - 1].o[0] ? 'A' : 'B');
  let amt = null,
    autoLeg = null,
    manNet = null,
    manBlk = null;
  for (let i = 0; i < chain.length && !amt; i++) {
    const sw = chain[i],
      pl = legOf(sw, i),
      o = pl === 'A' ? sw.b : sw.a;
    if (o == null || o < 0) continue;
    const man = (S.drv[o] || []).find(d => d.k === 'MAN');
    if (man || (S.ext.includes(o) && !S.nets[o].dig)) {
      amt = sw;
      autoLeg = pl;
      manNet = o;
      manBlk = man || null;
    }
  }
  if (!amt) {
    amt =
      S.blk.find(
        z =>
          (z.k === 'AMT' || z.k === 'SW') &&
          z.a != null &&
          z.b != null &&
          (b.o.includes(z.a) || b.o.includes(z.b)) &&
          z.o[0] != null
      ) || null;
    autoLeg = amt ? (b.o.includes(amt.a) ? 'A' : 'B') : null;
    manNet = amt ? (autoLeg === 'A' ? amt.b : amt.a) : null;
  }
  return { amt, autoLeg, manNet, manBlk, op };
}
/* the SV switch of a controller: the T switch that drives the SV of the PID and whose B leg is a COS (the operator's SV). Leg A = REMOTE (the SV path of the logic), leg B = LOCAL (the COS). null when the SV is an external input */
function anSvSwitchOf(S, b) {
  let q = null;
  try {
    q = anPins(S, b);
  } catch (e) {}
  if (!q || q.sv == null || q.sv < 0) return null;
  return (
    (S.drv[q.sv] || []).find(
      d => (d.k === 'AMT' || d.k === 'SW') && d.b >= 0 && S.blk.some(c => c.k === 'COS' && c.tb === d.id)
    ) || null
  );
}
/* does this controller have a REMOTE mode on its faceplate? Only when the drawing says so: a mode input TAG.REM, or the word REMOTE written beside the controller (REMOTE MODE, FORCE REMOTE, CONTROL REMOTE). A loop with only AUTO / MANUAL (and an SV set by the operator) has no REMOTE and no remote lock. */
function anHasRemote(S, b) {
  const tag = (b.txt || [])[1];
  if (!tag) return false;
  const esc = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    re = new RegExp('^' + esc + '\\.(REM|REMOTE)$', 'i');
  for (let n = 0; n < S.nets.length; n++) {
    const t = S.lab[n] && S.lab[n].t;
    if (t && re.test(t.trim())) return true;
  }
  return (S.tx || []).some(t => /\bREMOTE\b/i.test(t.t) && Math.hypot(t.x - b.cx, t.y - b.cy) < 160);
}
