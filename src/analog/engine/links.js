/* ===== ENGINE: links between sheets (numbered circles, signal tags) and the stepping of the sheets that are joined by a signal (stepSet, stepTier). No page access ===== */
const famOf = n => {
  const m = /^ABC-(\d+)/.exec(n);
  return m ? +m[1] : null;
};
const codeOf = n => String(n).replace(/^ABC-/, ''),
  hasL = t => /[A-Z]$/.test(String(t)),
  posCmp = (a, b) => b.y - a.y || a.x - b.x;
const tgtOf = (c, sh) =>
  AN.sheets.filter(
    p =>
      p !== sh &&
      (codeOf(p.name) === String(c.tgt) ||
        (!hasL(c.tgt) &&
          famOf(p.name) === parseInt(c.tgt, 10) &&
          !AN.sheets.some(z => codeOf(z.name) === String(c.tgt))))
  );
const pointsTo = (q, sh) =>
  String(q.tgt) === codeOf(sh.name) || (!hasL(q.tgt) && parseInt(q.tgt, 10) === famOf(sh.name));
const role = (sh, c) => {
  if (c.sink || c.nets.some(n => sh.S.drv[n].some(d => d.k !== 'LINK'))) return true;
  if (c.nets.some(n => sh.S.cns[n].length)) return false;
  return null;
};
const pairRoles = (sh, c, p, pc) => {
  let a = role(sh, c),
    b = role(p, pc);
  if (a !== null && a === b) {
    const ca = c.nets.some(n => sh.S.cns[n].length),
      cb = pc.nets.some(n => p.S.cns[n].length);
    if (ca && !cb) {
      a = false;
      b = true;
    } else if (cb && !ca) {
      b = false;
      a = true;
    }
  }
  return [a, b];
};
const effSink = (sh, c) =>
  role(sh, c) === true; /* an arrow-less circle that is fed by a block in its own sheet sends the signal out */
function addLink(out, sh, c, p, pc, hint) {
  let [a, b] = pairRoles(sh, c, p, pc);
  if (hint && (a === null || b === null || a === b)) {
    a = hint === 'out';
    b = !a;
  }
  if (a !== null && a === b) return;
  const here = a === true || b === false ? true : b === true || a === false ? false : null;
  if (here === null) return;
  const f = here ? { sh, c } : { sh: p, c: pc },
    t = here ? { sh: p, c: pc } : { sh, c };
  out.push({
    from: f.sh,
    to: t.sh,
    fromNets: f.c.nets,
    toNets: t.c.nets,
    fromC: f.c,
    toC: t.c,
    num: c.num,
    at: { sh, c },
    peer: { sh: p, c: pc }
  });
}
const TAGX =
  /^(S\d\s*)?[MB]\.[0-9A-F]{3,5}[A-Z]?$|^(S\d\s*)?(AI|S[IO])\d{3,5}$|^[A-Z0-9]{3,}[A-Z0-9-]*\.(MV|PV|SV|REM|LOC|MAN|OUT|SIG)$/;
const ADDRK = /^(?:S(\d)\s*)?([MB]\.[0-9A-F]{3,5}[A-Z]?|(?:AI|S[IO])\d{3,5})$/;
function tkey(sh, t) {
  const m = ADDRK.exec(String(t).trim());
  if (!m) return String(t).trim();
  let st = m[1];
  if (!st) {
    try {
      st = shStn(sh);
    } catch (e) {}
  }
  return (st == null ? '?' : st) + '|' + m[2];
}
function tagIndex() {
  if (AN.tagIdx) return AN.tagIdx;
  const ix = (AN.tagIdx = new Map());
  /* habang binubuo ang index, maaaring may sheet na makalkula na ang links gamit ang kalahating index (ang sheet na nauuna sa listahan ay hindi nakikita ang tag ng sheet na nasa dulo): pagkatapos, ibinabalik ang lahat ng links para makalkula ulit sa buong index */
  const had = AN.sheets.filter(p => p.lk);
  try {
    tagIndexBuild(ix);
  } finally {
    for (const p of AN.sheets) if (p.lk && !had.includes(p)) p.lk = null;
  }
  return ix;
}
function tagIndexBuild(ix) {
  for (const p of AN.sheets) {
    let PS;
    try {
      PS = ensure(p);
    } catch (e) {
      continue;
    }
    /* ang .MAN / .LOC / .REM ng isang controller ay HMI command: iisang signal sa buong DCS. Ang sheet na may PID / MAN block ng controller na iyon ang may-ari; ang ibang sheet na gumagamit ng parehong tag ay kumukuha ng halaga mula sa may-ari (dati ay magkakahiwalay: ang pindot sa faceplate ay hindi umaabot sa ibang sheet) */
    const ownsMode = (t, n) => {
      const m = /^(.+)\.(MAN|LOC|REM)$/.exec(String(t).trim());
      return (
        !!m &&
        PS.ext.includes(n) &&
        PS.blk.some(b => (b.k === 'PID' || b.k === 'PIDV' || b.k === 'MAN' || b.k === 'SUMA') && b.tag === m[1])
      );
    };
    const add = (t, n) => {
      if (!t || !(PS.drv[n].some(d => d.k !== 'LINK') || ownsMode(t, n))) return;
      const kk = tkey(p, t),
        a = ix.get(kk) || [];
      if (!a.some(q => q.sh === p && q.n === n)) a.push({ sh: p, n });
      ix.set(kk, a);
    };
    PS.lab.forEach((l, n) => {
      if (l) add(l.t, n);
    });
    (PS.tagN || []).forEach(q => {
      if (q.d <= 4) add(q.t, q.n);
    });
    for (const g of PS.blk)
      if (g.k === 'SIGAB') {
        const f = (g.txt || []).map(x => String(x).trim()).find(x => /^[A-Z]\.[0-9A-F]{4}$/.test(x));
        if (f) {
          const kk = tkey(p, f),
            a = ix.get(kk) || [];
          if (!a.some(q => q.flag === g.id)) {
            a.push({ sh: p, n: -1, flag: g.id });
            ix.set(kk, a);
          }
        }
      }
  }
}
function linksOf(sh) {
  if (sh.lk) return sh.lk;
  tagIndex(); /* buuin muna ang buong index bago kalkulahin ang links ng sheet na ito */
  if (sh.lk) return sh.lk;
  const S = ensure(sh),
    out = (sh.lk = []),
    my = famOf(sh.name);
  for (const c of S.xc || []) {
    let hit = null;
    for (const p of tgtOf(c, sh)) {
      let PS;
      try {
        PS = ensure(p);
      } catch (e) {
        continue;
      }
      const mine = (S.xc || []).filter(q => q.num === c.num && String(q.tgt) === String(c.tgt)).sort(posCmp),
        idx = mine.indexOf(c);
      let theirs = (PS.xc || []).filter(q => q.num === c.num && pointsTo(q, sh)).sort(posCmp);
      if (!theirs.length) theirs = (PS.conn || []).filter(q => q.num === c.num).sort(posCmp);
      if (theirs.length) {
        const sh_ = theirs.filter(q => (c.tags || []).some(t => (q.tags || []).includes(t))),
          pc = sh_.length === 1 ? sh_[0] : theirs[Math.min(idx, theirs.length - 1)],
          [a, b] = pairRoles(sh, c, p, pc);
        if (a === null || b === null || a !== b) {
          hit = [p, pc];
          break;
        }
      }
    }
    if (hit) addLink(out, sh, c, hit[0], hit[1]);
    else c.nolink = 1;
  }
  const grp = {};
  S.conn.forEach(c => {
    if (!c.lt) (grp[c.num] = grp[c.num] || []).push(c);
  });
  for (const n in grp) {
    const g = grp[n];
    for (const c of g) {
      if (g.some(q => q !== c && q.sink !== c.sink)) continue;
      for (const p of AN.sheets) {
        if (p === sh || famOf(p.name) !== my) continue;
        let PS;
        try {
          PS = ensure(p);
        } catch (e) {
          continue;
        }
        const pg = PS.conn.filter(q => q.num === c.num),
          pc = pg.find(q => q.sink !== c.sink && !pg.some(z => z !== q && z.sink !== q.sink));
        if (pc) addLink(out, sh, c, p, pc);
      }
    }
  }
  /* v1.9.0: single circles that say "( FROM ABC-003A )" / "TO ABC-xxx": go to that drawing, match number + the M.xxxx tag written next to the circle */
  {
    const linked = new Set(out.map(l => l.at.c));
    for (const c of S.conn) {
      if (linked.has(c) || !c.ref) continue;
      const rc = role(sh, c);
      if (S.conn.some(q => q !== c && q.num === c.num && role(sh, q) !== null && rc !== null && role(sh, q) !== rc))
        continue;
      const bests = [];
      for (const p of AN.sheets) {
        if (
          p === sh ||
          !(
            (c.ref.codes || [c.ref.code]).includes(codeOf(p.name)) ||
            (!hasL(c.ref.code) && famOf(p.name) === parseInt(c.ref.code, 10))
          )
        )
          continue;
        let PS;
        try {
          PS = ensure(p);
        } catch (e) {
          continue;
        }
        let best = null;
        for (const q of PS.conn.filter(z => z.num === c.num)) {
          const [a, b] = pairRoles(sh, c, p, q),
            sc =
              (c.tags || []).filter(t => (q.tags || []).includes(t)).length * 4 +
              (q.ref &&
              ((q.ref.codes || [q.ref.code]).includes(codeOf(sh.name)) || (!hasL(q.ref.code) && +q.ref.code === my))
                ? 2
                : 0) +
              (a !== null && b !== null && a !== b ? 1 : 0);
          if (!best || sc > best.sc) best = { sc, p, q };
        }
        if (best && best.sc >= 1) bests.push(best);
      }
      for (const best of bests) addLink(out, sh, c, best.p, best.q, c.ref.dir === 'FROM' ? 'in' : 'out');
    }
  }
  /* v1.0.1: a signal tag that is an OUTPUT on one sheet and an INPUT on another sheet is ONE signal (M.0124, B.0646, SICL1060A.MV ...) */
  {
    const done = new Set(out.filter(l => l.to === sh).flatMap(l => l.toNets));
    let ix = null;
    for (const n of S.ext) {
      if (done.has(n)) continue;
      let lb = S.lab[n];
      /* v1.9.0: tag a bit further from the wire, and the "( FROM ABC-xxx )" text next to it, are used too */
      const near = (rx, mx) => {
        let b = null,
          bd = mx;
        for (const t of S.tx) {
          if (!rx.test(t.t.trim())) continue;
          for (const i of S.nets[n].segs) {
            const d = anPtSeg(t.x, t.y, S.seg[i]);
            if (d < bd) {
              bd = d;
              b = t;
            }
          }
        }
        return b;
      };
      if (!lb || !TAGX.test(lb.t)) {
        const t = near(TAGX, 9);
        if (t) lb = { t: t.t.trim(), x: t.x, y: t.y };
        else {
          let w = null;
          try {
            w = wireTag(S, n);
          } catch (e) {}
          if (!w || !TAGX.test(String(w).trim())) continue;
          const sg0 = S.seg[S.nets[n].segs[0]];
          lb = { t: String(w).trim(), x: sg0 ? sg0.x1 : 0, y: sg0 ? sg0.y1 : 0 };
        }
      }
      const fr = near(/FROM\s+ABC[-\s]?\d{3}/i, 14),
        fm = fr && /FROM\s+ABC[-\s]?(\d{3}[A-Z]?)/i.exec(fr.t),
        rcode = fm && fm[1].toUpperCase(),
        rs = rcode
          ? AN.sheets.filter(p => codeOf(p.name) === rcode || (!hasL(rcode) && famOf(p.name) === parseInt(rcode, 10)))
          : [];
      ix = ix || tagIndex();
      let cl = (ix.get(tkey(sh, lb.t)) || []).filter(
        q => q.sh !== sh && (q.flag != null || q.sh.S.nets[q.n].dig === S.nets[n].dig)
      );
      if (rs.length) {
        const pr = cl.filter(q => rs.includes(q.sh));
        if (pr.length) cl = pr;
        else
          for (const p of rs) {
            let PS;
            try {
              PS = ensure(p);
            } catch (e) {
              continue;
            }
            for (const q of PS.tagN || [])
              if (
                q.t === lb.t &&
                PS.drv[q.n].some(d => d.k !== 'LINK') &&
                PS.nets[q.n].dig === S.nets[n].dig &&
                p !== sh
              )
                cl.push({ sh: p, n: q.n });
          }
      }
      const c = cl[0];
      if (!c) continue;
      const CS = c.sh.S,
        gb = c.flag != null ? CS.blk.find(z => z.id === c.flag) : null,
        sg = gb ? null : CS.seg[CS.nets[c.n].segs[0]],
        sl = gb ? { x: gb.cx, y: gb.cy } : CS.lab[c.n] || (sg ? { x: sg.x1, y: sg.y1 } : { x: 0, y: 0 });
      out.push({
        from: c.sh,
        to: sh,
        fromNets: c.flag != null ? [] : [c.n],
        flagSrc: c.flag,
        toNets: [n],
        fromC: { x: sl.x, y: sl.y, r: 4 },
        toC: { x: lb.x, y: lb.y, r: 4 },
        num: lb.t,
        tag: 1,
        at: { sh, c: null },
        peer: { sh: c.sh, c: null }
      });
    }
  }
  /* mark the nets that are fed from another sheet */
  for (const l of out)
    if (l.to === sh) {
      S.xlk = S.xlk || {};
      for (const n of l.toNets)
        if (S.ext.includes(n)) {
          S.xlk[n] = l;
          try {
            const FS = l.from.S,
              fn = l.fromNets.find(m => FS.drv[m].some(d => d.k !== 'LINK'));
            if (fn !== undefined && !!FS.nets[fn].dig !== !!S.nets[n].dig && !FS.nets[fn].sigab && !S.nets[n].sigab)
              S.nets[n].dig = FS.nets[fn].dig;
          } catch (e) {}
        }
    }
  return out;
}
function actSet(sh) {
  const set = [sh],
    seen = new Set([sh]),
    grow = () => {
      for (let i = 0; i < set.length && set.length < 64; i++) {
        for (const l of linksOf(set[i]))
          for (const y of [l.from, l.to])
            if (!seen.has(y) && set.length < 64) {
              seen.add(y);
              set.push(y);
            }
      }
    };
  grow();
  if (AN.p2 && !seen.has(AN.p2)) {
    seen.add(AN.p2);
    set.push(AN.p2);
  }
  /* AN.worldSheets (1.22.0): ABC sheets whose outputs go TO the DITL, stepped while the one world (ABC + DITL) is ON */
  for (const nm of (AN.hmiSheets || []).concat(AN.plantSheets || [], AN.worldSheets || [])) {
    const p = AN.sheets.find(s => s.name === nm);
    if (p && !seen.has(p)) {
      seen.add(p);
      set.push(p);
    }
  }
  grow();
  return set;
}
function stepSet(sh, dt) {
  const set = actSet(sh);
  for (const x of set)
    for (const l of x.lk || []) {
      if (l.to !== x) continue;
      const FS = l.from.S,
        TS = x.S;
      if (!FS || !TS) continue;
      const val =
        l.flagSrc != null
          ? FS.rt.st[l.flagSrc] && FS.rt.st[l.flagSrc].val > 0.5
            ? 1
            : 0
          : FS.rt.v[l.fromNets.find(n => FS.drv[n].length) ?? l.fromNets[0]];
      for (const n of l.toNets)
        if (TS.ext.includes(n)) {
          TS.rt.ext[n] = val;
          TS.xlk = TS.xlk || {};
          TS.xlk[n] = l;
        }
    }
  for (const x of set)
    try {
      procRemote(x);
    } catch (e) {}
  for (const x of set) anStep(x.S, dt);
}
function stepTier(sh, dt, K) {
  const full = actSet(sh),
    near = new Set([sh]);
  try {
    for (const l of linksOf(sh)) {
      near.add(l.from);
      near.add(l.to);
    }
  } catch (e) {}
  const tk = (AN._tk = (AN._tk || 0) + 1),
    due = tk % K === 0,
    set = full.filter(x => near.has(x) || due);
  for (const x of set)
    for (const l of x.lk || []) {
      if (l.to !== x) continue;
      const FS = l.from.S,
        TS = x.S;
      if (!FS || !TS) continue;
      const val =
        l.flagSrc != null
          ? FS.rt.st[l.flagSrc] && FS.rt.st[l.flagSrc].val > 0.5
            ? 1
            : 0
          : FS.rt.v[l.fromNets.find(n => FS.drv[n].length) ?? l.fromNets[0]];
      for (const n of l.toNets)
        if (TS.ext.includes(n)) {
          TS.rt.ext[n] = val;
          TS.xlk = TS.xlk || {};
          TS.xlk[n] = l;
        }
    }
  for (const x of set)
    try {
      procRemote(x);
    } catch (e) {}
  for (const x of set) {
    if (near.has(x)) anStep(x.S, dt);
    else {
      const T = dt * K,
        m = Math.max(1, Math.ceil(T / 0.5));
      for (let i = 0; i < m; i++) anStep(x.S, T / m);
    }
  }
}
function procRemote(x) {
  if (!(AN.procDefault === true || (AN.procDefault === undefined && AN.plantOn === true))) return;
  const S = x.S;
  if (!S || S._rem === 1) return;
  S._rem = 1;
  for (const b of S.procs || []) {
    const pr = b.proc;
    if (!pr || pr.mode === 'shared' || pr.mode === 'pin' || pr.mode === 'transmitter') continue;
    const l = S.xlk && S.xlk[pr.pv];
    if (!l || !l.from || !l.from.S) continue;
    const FS = l.from.S,
      sn = l.fromNets.find(n => FS.drv[n].length) ?? l.fromNets[0];
    if (sn == null) continue;
    const tag = (b.txt || [])[1] || b.k;
    const ais = [],
      seen = new Set(),
      walk = (n, dp) => {
        if (dp > 8 || seen.has(n)) return;
        seen.add(n);
        for (const dr of FS.drv[n] || []) {
          const y = FS.blk.find(q => q.id === dr.id);
          if (!y) continue;
          if (y.k === 'AI') {
            if (!y.fb && !ais.includes(y.id)) ais.push(y.id);
            continue;
          }
          if (y.k === 'PID' || y.k === 'PIDV' || y.k === 'MAN') continue;
          for (const q of y.i || []) walk(q, dp + 1);
        }
      };
    walk(sn, 0);
    const ext = FS.ext.includes(sn) && !(FS.xlk && FS.xlk[sn]) ? sn : null;
    FS.plantT = FS.plantT || { ai: new Map(), ext: new Map() };
    const own = (FS.procs || []).some(
      p =>
        p.proc && p.proc.mode !== 'shared' && ((p.proc.ai || []).some(id => ais.includes(id)) || p.proc.pinExt === sn)
    );
    if (!ais.length && ext == null) {
      pr.mode = 'pin';
      pr.ai = [];
      pr.aiOut = [];
      continue;
    }
    if (own || ais.some(id => FS.plantT.ai.has(id)) || (ext != null && FS.plantT.ext.has(ext))) {
      pr.mode = 'shared';
      pr.of = 'the controller that owns this measurement in ' + l.from.name;
      continue;
    }
    let ai = ais.slice();
    if (ais.length) {
      const pb = anProbe(FS, { pv: sn, ai: ais }),
        mx = Math.max(0, ...pb.map(q => Math.abs(q.sens)));
      if (mx < 1e-6) {
        pr.mode = 'pin';
        pr.ai = [];
        pr.aiOut = [];
        continue;
      }
      ai = pb.filter(q => Math.abs(q.sens) >= 0.3 * mx).map(q => q.id);
    }
    const aiOut = ai.flatMap(id => {
      const a = FS.blk.find(q => q.id === id);
      return a ? a.pins.filter(p => p.role === 'out').map(p => p.n) : [];
    });
    pr.remote = { S: FS, pin: sn, ai, aiOut, ext, allAI: ais };
    pr.mode = 'remote';
    pr.pinExt = null;
    pr.ai = [];
    pr.aiOut = [];
    ai.forEach(id => FS.plantT.ai.set(id, tag));
    if (ext != null) FS.plantT.ext.set(ext, tag);
  }
}
const TAGRE = /^(S\d\s*)?[A-Za-z]{1,6}\.?\d{3,6}[A-Za-z]?(\.[A-Za-z0-9]+)?$/;
function wireTag(S, n) {
  const c = S.nets[n]._wt;
  if (c !== undefined) return c;
  let best = null,
    bd = 6;
  for (const t of S.tx) {
    const q = t.t.trim();
    if (!TAGRE.test(q)) continue;
    const w = q.length * (t.h || 3) * 0.55;
    for (const i of S.nets[n].segs) {
      const sg = S.seg[i];
      const d = Math.min(
        anPtSeg(t.x, t.y, sg),
        anPtSeg(t.x + w, t.y, sg),
        anPtSeg(t.x + w / 2, t.y + (t.h || 3) * 0.4, sg)
      );
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
  }
  return (S.nets[n]._wt = best);
}
