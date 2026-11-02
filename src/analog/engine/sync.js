/* ===== ENGINE SYNC (3.2.0 Web Worker, stage c): the engine of the worker and the mirror of the page hold the same state; after a start
   from one keyframe (engine/state.js + the DITL keyframe of src/digital/parts/03d-state.js) only what changed goes across.
   The state is cut in SLOTS, the same list on both sides (the same sheets, the same order): per ABC sheet its values (rt.v, stp, acc:
   the changed entries only), its inputs and forces, the rest of its run time, each block state, each plant model; each field of the
   unit / source / cycle models; the flags of AN; per DITL sheet its inputs, its nets and parts, its forces; the DITL globals.
   AN.sync.patch(w) = the slots whose value changed since the last patch or apply of this side (w = the writable slots only: what the
   operator can write from the page); AN.sync.apply(p) puts a patch in, IN PLACE (other objects hold these: the unit model holds the
   plant models), and takes it as seen. Engine -> page: patch() after each job; page -> engine: patch(true) = the operator's writes.
   A plant model is written as its block ({$P}), not copied: the unit model points at it. No page access. ===== */
let AN_SYNC = null;
function anSyncRefs() {
  const ref = anStateRefs();
  /* across slots (one slot is decoded alone): a plant model, its remote measurement (procRemote; b.proc1 holds it too), a block state
     (the unit model holds some: U.zt ...; written as a copy, the copy moved). The keyframe is decoded at once and keeps them by $id */
  AN.sheets.forEach((sh, i) => {
    if (!sh.S) return;
    sh.S.blk.forEach((b, j) => {
      if (!b.proc) return;
      ref.set(b.proc, { $P: [i, j] });
      if (b.proc.remote && typeof b.proc.remote === 'object') ref.set(b.proc.remote, { $R: [i, j] });
    });
    for (const id of Object.keys(sh.S.rt.st)) if (sh.S.rt.st[id] && typeof sh.S.rt.st[id] === 'object') ref.set(sh.S.rt.st[id], { $T: [i, id] });
  });
  return ref;
}
/* in place, down the tree: an object keeps its identity (others hold it: the unit model, a cache), an array its items, a key that
   is gone goes; a value that is an object of this side already (a ref: a sheet, a block, a plant model) is put as it is */
const anSyncPlain = x => x && typeof x === 'object' && !ArrayBuffer.isView(x) && !(x instanceof Map) && !(x instanceof Set);
function anSyncDeep(a, v, seen) {
  if (seen.has(a)) return;
  seen.add(a);
  if (Array.isArray(a)) a.length = v.length;
  for (const k of Object.keys(a)) if (!(k in v)) delete a[k];
  for (const k of Object.keys(v)) {
    const x = a[k],
      w = v[k];
    if (typeof x === 'function') continue;
    if (x !== w && anSyncPlain(x) && anSyncPlain(w) && Array.isArray(x) === Array.isArray(w) && !anSyncOwn.has(w)) anSyncDeep(x, w, seen);
    else a[k] = w;
  }
}
/* the objects a decode gave from the refs (this side's own): never merged into */
let anSyncOwn = new WeakSet();
function anSyncPut(o, k, v) {
  const a = o[k];
  if (a !== v && anSyncPlain(a) && anSyncPlain(v) && Array.isArray(a) === Array.isArray(v) && !anSyncOwn.has(v)) anSyncDeep(a, v, new Set());
  else o[k] = v;
}
/* the quick look at a block state for the operator's writes: every plain field (the output val, the leg fm of a switch, the mode ...) */
function anSyncStFast(q) {
  if (!q) return '';
  let s = '';
  for (const k in q) {
    const v = q[k];
    if (v === null || typeof v !== 'object') s += k + '=' + v + '|';
  }
  return s;
}
function anSyncSlots() {
  const L = [],
    add = (k, get, put, o) => L.push(Object.assign({ k, get, put }, o || {}));
  AN.sheets.forEach((sh, i) => {
    const S = sh.S;
    if (!S) return;
    /* the values: typed arrays, the changed entries only */
    for (const f of ['v', 'stp', 'acc']) add('a' + i + f, () => S.rt[f], null, { ta: f });
    /* the inputs and the forces: the operator writes them (faceplate, FORCE, the Training) */
    add('x' + i, () => ({ ext: S.rt.ext, force: S.rt.force }), d => (anSyncPut(S.rt, 'ext', d.ext), anSyncPut(S.rt, 'force', d.force)), { w: 1 });
    /* the rest of the run time and of the sheet, in three slots (what changes every scan apart from what rarely does: the links xlk
       went across with every scan before); only the keys it has (a key that is not there is not "undefined" on the other side) */
    const part = (k, keys, of, put) =>
      add(k + i, () => {
        const r = {},
          o = of();
        for (const f of keys) if (f in o) r[f] = o[f];
        return r;
      }, d => {
        const o = of();
        for (const f of keys)
          if (!(f in d)) delete o[f];
          else put(o, f, d[f]);
      });
    part('rt', ['t', 'k', 'ramp'], () => S.rt, (o, f, v) => (o[f] = v));
    part('rp', ['pm', 'pf', 'ev'], () => S.rt, anSyncPut);
    part('rs', ['look', 'xlk', 'plantT', '_rem'], () => S, (o, f, v) => (o[f] = v));
    add('rm' + i, () => {
      const mn = [];
      S.blk.forEach((b, j) => b._mn !== undefined && mn.push([j, b._mn]));
      return mn;
    }, d => { for (const [j, m] of d) S.blk[j]._mn = m; });
    /* each block state (the operator writes the output of a MAN station: st.val) */
    for (const id of Object.keys(S.rt.st))
      add('s' + i + ':' + id, () => (S.rt.st[id] ? { ...S.rt.st[id] } : S.rt.st[id]) /* its content: the state itself is a ref {$T} */, d => anSyncPut(S.rt.st, id, d), { w: 1, fast: () => anSyncStFast(S.rt.st[id]) });
    /* each plant model (the PLANT window writes its operating point / disturbance) */
    S.blk.forEach((b, j) => {
      if (b.proc) add('p' + i + ':' + j, () => ({ ...b.proc }) /* its content: the model itself is written as {$P} */, d => anSyncDeep(b.proc, d, new Set()), { w: 1, fast: () => b.proc.op + '|' + b.proc.dist + '|' + b.proc.on });
    });
  });
  const objs = AN_STATE_OBJ();
  /* the fields of each model: first the list of its fields (a run adds fields, a Reset takes them away), then each field */
  for (const o in objs) {
    const F = () => Object.keys(objs[o]).filter(f => typeof objs[o][f] !== 'function');
    add('k' + o, F, d => {
      for (const f of F()) if (!d.includes(f)) delete objs[o][f];
      for (const f of d) if (!(f in objs[o])) objs[o][f] = undefined;
    }, { raw: 1 });
    for (const f of F()) add('o' + o + '.' + f, () => objs[o][f], d => anSyncPut(objs[o], f, d));
  }
  add(
    'fl',
    () => {
      const r = { f: {}, s: {} };
      for (const k of AN_STATE_FLAGS) r.f[k] = AN[k];
      for (const k of AN_STATE_SETS) r.s[k] = AN[k];
      r.u = AN.unit === AN_UNIT ? 1 : 0;
      r.h = AN.hmiDI === AN_HMI_DI ? 1 : 0;
      return r;
    },
    d => {
      for (const k of AN_STATE_FLAGS) AN[k] = d.f[k];
      for (const k of AN_STATE_SETS) AN[k] = d.s[k];
      if (d.u) AN.unit = AN_UNIT;
      else delete AN.unit;
      if (d.h) (AN.hmiDI = AN_HMI_DI), (AN.hmiComp = hmiComp);
    },
    { w: 1 }
  );
  /* the saved settings of the ABC (the PID / MAN parameters, the LINEAR edits: Reset puts them in) */
  add('sv', () => ({ sv: AN.sv || {}, lne: AN.lne || {} }), d => ((AN.sv = d.sv), (AN.lne = d.lne)), { w: 1, raw: 1 });
  /* the one-address groups (links.js shareExt) */
  add('xs', anXsGet, anXsPut, { raw: 1 });
  /* the DITL world (src/digital/parts/03d-state.js keys), by sheet name */
  if (typeof ditlAll === 'function') {
    for (const s of ditlAll()) {
      const n = s.name;
      const sh = () => ditlAll().find(x => x.name === n);
      add('ds' + n, () => ditlPick(s, DITL_SH), d => { for (const x of DITL_SH) if (x in d) s[x] = ditlDec(d[x]); else delete s[x]; }, { w: 1, raw: 1 });
      if (!s.nl) continue;
      add('dn' + n, () => ({ v: (s.nl._v || []).map(x => (x ? 1 : 0)).join(''), g: (s.nl.gates || []).map(g => ditlPick(g, DITL_G)) }), d => {
        const nl = s.nl;
        nl._v = d.v ? Array.from(d.v, c => +c) : null;
        (nl.gates || []).forEach((g, i) => { if (d.g[i]) for (const x of DITL_G) if (x in d.g[i]) g[x] = ditlDec(d.g[i][x]); else delete g[x]; });
      }, { raw: 1 });
      add('dx' + n, () => ditlPick(s.nl, ['fx', 'ufx']), d => { for (const x of ['fx', 'ufx']) if (x in d) s.nl[x] = ditlDec(d[x]); else delete s.nl[x]; }, { w: 1, raw: 1 });
      void sh;
    }
    /* the DITL globals, one slot each (37 kB a patch as one) */
    add('dgMST', () => ditlEnc(MST), d => (MST = ditlDec(d)), { raw: 1 });
    add('dgMS', () => ditlEnc(MS), d => (MS = ditlDec(d)), { raw: 1 });
    add('dgDREG', () => ditlEnc(DREG), d => (DREG = ditlDec(d)), { raw: 1 });
    add('dgt', () => tick.t, d => (tick.t = d), { raw: 1 });
    for (const x of DITL_W)
      add('dgW' + x, () => { const W = window.WORLD || {}; return x in W ? { v: ditlEnc(W[x]) } : {}; }, d => {
        if (!window.WORLD) return;
        if ('v' in d) WORLD[x] = ditlDec(d.v);
        else delete WORLD[x];
      }, { raw: 1 });
    add('dgsw', () => (window.WORLD && WORLD.plantSw ? WORLD.plantSw() : null), d => d && window.WORLD && WORLD.plantSwSet && WORLD.plantSwSet(d), { raw: 1 });
    add('dsim', () => ({ SIM, TSP, DPAUSE: typeof DPAUSE !== 'undefined' ? DPAUSE : false }), d => {
      SIM = d.SIM;
      TSP = d.TSP;
      if (typeof DPAUSE !== 'undefined') DPAUSE = d.DPAUSE;
    }, { w: 1, raw: 1 });
  }
  return L;
}
/* the slot list and what this side last sent or took (the same sheets: built again when the sheets change) */
function anSyncState() {
  /* the fields of the models too: a run adds fields (a field made later was never sent) */
  const objs = AN_STATE_OBJ();
  let n = AN.sheets.filter(s => s.S).length + ':' + (typeof ditlAll === 'function' ? ditlAll().length : 0);
  for (const o in objs) n += '|' + Object.keys(objs[o]).length;
  n += '|' + AN.sheets.filter(s => s.lk).length;
  let np = 0,
    ns = 0;
  for (const sh of AN.sheets)
    if (sh.S) {
      for (const b of sh.S.blk) if (b._pins) np++;
      ns += Object.keys(sh.S.rt.st).length; /* a block state made later (a slot each) */
    }
  n += '|' + np + '|' + ns; /* the links of a sheet are made when it is first linked: refs again */
  if (AN_SYNC && AN_SYNC.n === n) return AN_SYNC;
  const L = anSyncSlots(),
    old = AN_SYNC;
  AN_SYNC = { n, L, by: new Map(L.map(s => [s.k, s])), last: new Map(), fast: new Map(), ref: anSyncRefs() };
  anSyncOwn = new WeakSet(AN_SYNC.ref.keys());
  /* what this side had sent or taken stays: only the new slots go across whole */
  if (old) for (const [k, v] of old.last) if (AN_SYNC.by.has(k)) AN_SYNC.last.set(k, v);
  if (old) for (const [k, v] of old.fast) if (AN_SYNC.by.has(k)) AN_SYNC.fast.set(k, v);
  return AN_SYNC;
}
/* the refs again when the objects they name may be new: a Reset / keyframe / init of a sheet makes new block states (AN._gen) */
function anSyncFresh(Y) {
  if (Y.gen === AN._gen && Y.ref) return;
  Y.gen = AN._gen;
  Y.ref = anSyncRefs();
  anSyncOwn = new WeakSet(Y.ref.keys());
}
/* a slot as JSON. Most slots hold plain values only (a block state: numbers, text, small arrays): those go as plain JSON with a '#'
   in front (2 ~ 3 times smaller, a plain JSON.parse on the other side); a slot with a ref (a sheet, a block, a plant model ...), a
   Map / Set / typed array, a cycle or a NaN / Infinity / undefined goes through anStateEnc */
const anSyncPlainJ = (v, Y) => {
  const seen = new Set();
  let ok = true;
  const t = (x, d) => {
    if (!ok) return;
    if (x === undefined || (typeof x === 'number' && !isFinite(x)) || typeof x === 'function') return void (ok = false);
    if (!x || typeof x !== 'object') return;
    if (Y.ref.has(x) || seen.has(x) || ArrayBuffer.isView(x) || x instanceof Map || x instanceof Set || d > 8) return void (ok = false);
    seen.add(x);
    if (Array.isArray(x)) {
      for (const e of x) t(e, d + 1);
      if (Object.keys(x).length !== x.length) ok = false;
    } else for (const k in x) t(x[k], d + 1);
  };
  t(v, 0);
  return ok ? '#' + JSON.stringify(v) : null;
};
const anSyncJ = (s, Y) => {
  if (s.raw) return JSON.stringify(s.get());
  const v = s.get();
  return anSyncPlainJ(v, Y) || JSON.stringify(anStateEnc(v, Y.ref));
};
/* the slots that changed: [[key, json]] or, for the values, [[key, [index, value] ...]] */
function anSyncPatch(w) {
  const Y = anSyncState(),
    out = [];
  anSyncFresh(Y);
  for (const s of Y.L) {
    if (w && !s.w) continue;
    if (s.ta) {
      const a = s.get();
      if (!a) continue;
      let b = Y.last.get(s.k);
      const ch = [];
      if (!b || b.length !== a.length) {
        for (let i = 0; i < a.length; i++) ch.push(i, a[i]);
        Y.last.set(s.k, (b = a.slice()));
      } else
        for (let i = 0; i < a.length; i++)
          if (!Object.is(a[i], b[i])) {
            ch.push(i, a[i]);
            b[i] = a[i];
          }
      if (ch.length) out.push([s.k, ch.map(x => (typeof x === 'number' && !isFinite(x) ? String(x) : x)), a.length]);
      continue;
    }
    /* the operator's writes: a quick look first (a block state: its output only) */
    if (w && s.fast) {
      const f = s.fast();
      if (Y.fast.get(s.k) === f) continue;
      Y.fast.set(s.k, f);
    }
    const j = anSyncJ(s, Y);
    if (Y.last.get(s.k) === j) continue;
    Y.last.set(s.k, j);
    out.push([s.k, j]);
  }
  return out;
}
/* a patch in (skip = keys this side wrote itself since: the operator wins) */
function anSyncApply(p, skip) {
  const Y = anSyncState();
  anSyncFresh(Y);
  let Y2 = Y;
  for (const [k, j, n] of p) {
    if (skip && skip.has(k)) continue;
    /* a slot made on the other side since (a new field after its field list): the list again */
    let s = Y2.by.get(k);
    if (!s) {
      Y2 = anSyncState();
      anSyncFresh(Y2);
      s = Y2.by.get(k);
    }
    if (!s) continue;
    if (s.ta) {
      const a = s.get();
      if (!a) continue;
      let b = Y2.last.get(k);
      if (!b || b.length !== a.length) Y2.last.set(k, (b = a.slice()));
      for (let i = 0; i < j.length; i += 2) a[j[i]] = b[j[i]] = Number(j[i + 1]);
      void n;
      continue;
    }
    s.put(s.raw ? JSON.parse(j) : j[0] === '#' ? JSON.parse(j.slice(1)) : anStateDec(JSON.parse(j), s.get()));
    /* as this side writes it now (the keys of an object put in place can come in another order): needed only where the operator's
       writes are found by the JSON itself (a writable slot with no quick look); elsewhere the JSON that came is enough */
    Y2.last.set(k, s.w && !s.fast ? anSyncJ(s, Y2) : j);
    if (s.fast) Y2.fast.set(k, s.fast());
  }
}
/* after a keyframe (or any change of the whole state): this side takes the state as it is now as seen */
function anSyncMark() {
  AN_SYNC = null;
  anSyncPatch();
  const Y = anSyncState();
  for (const s of Y.L) if (s.fast) Y.fast.set(s.k, s.fast());
}
/* the engine after an action: the next patch carries every slot (the page ran the same action; whatever came out different there is
   put right; the action is rare, the full patch is a few hundred kB) */
function anSyncForget() {
  const Y = anSyncState();
  Y.last.clear();
}
/* the arguments of an engine action, for the radio (src/world/eng.js): a sheet, a block, a net ... as its ref */
function anSyncEncArgs(a) {
  const Y = anSyncState();
  anSyncFresh(Y);
  return { $j: JSON.stringify(anStateEnc(a, Y.ref)) };
}
function anSyncDecArgs(x) {
  return anStateDec(JSON.parse(x.$j));
}
