/* ===== ENGINE STATE: the whole running state of the analog engine as one plain value (a KEYFRAME) and back. No page access.
   3.2.0 Web Worker (user 2026-11-02 "Worker n. Lhat n", stage a): the engine of a worker and the mirror of the page must hold the
   same state; a keyframe carries it from one to the other (start, a starting state, an operator action that the engine runs).
   What is in it: per sheet the run time (rt: values, inputs, forces, block states, plant model), the look, the links (xlk), the plant
   model of each block (b.proc) and the mode nets of a MAN block (b._mn); the unit / source / cycle models (AN_UNIT, AN_SRC, AN_CYC,
   AN_SW, AN_MU, AN_ACW, AN_MT, AN_AIR) and the flags of AN the engine reads. A sheet, a block or a net of a sheet is written as its
   index ({$S}, {$B}, {$N}), not copied: the other side has the same sheets (the same drawings, the same order). A function is not
   copied: the other side keeps its own ===== */
const AN_STATE_OBJ = () => ({ AN_UNIT, AN_SRC, AN_CYC, AN_SW, AN_MU, AN_ACW, AN_MT, AN_AIR });
/* the flags of AN that the engine reads (plain values) */
const AN_STATE_FLAGS = ['i', 'plantOn', 'procDefault', 'startState', 'steady', 'spd', 'run', 'view', 'tierK', '_cold0', 'load150'];
/* the sheets a step takes besides the linked ones (links.js actSet): names, and the second sheet of the page (a sheet) */
const AN_STATE_SETS = ['hmiSheets', 'plantSheets', 'unitSheets', 'checkSheets', 'worldSheets', 'p2'];
function anStateRefs() {
  const ref = new Map();
  ref.set(AN.sheets, { $all: 1 }); /* the list itself (AN_SRC.bitsOf: a cache made for this list) */
  AN.sheets.forEach((sh, i) => {
    ref.set(sh, { $sh: i });
    const S = sh.S;
    if (!S) return;
    ref.set(S, { $S: i });
    S.blk.forEach((b, j) => ref.set(b, { $B: [i, j] }));
    S.nets.forEach((n, j) => ref.set(n, { $N: [i, j] }));
  });
  return ref;
}
const AN_TA = { Float64Array, Float32Array, Int32Array, Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array };
/* a value -> plain JSON (refs by index, cycles by $id / $ref, typed arrays, Map / Set, NaN / Infinity) */
function anStateEnc(x, ref) {
  const seen = new Map();
  let nid = 0;
  const num = v => (Number.isFinite(v) ? v : { $num: String(v) });
  const enc = v => {
    if (v === undefined) return { $u: 1 };
    if (v === null || typeof v === 'boolean' || typeof v === 'string') return v;
    if (typeof v === 'number') return num(v);
    if (typeof v === 'function') return { $fn: 1 };
    if (typeof v !== 'object') return null;
    const r = ref.get(v);
    if (r) return r;
    if (seen.has(v)) return { $ref: seen.get(v) };
    const id = nid++;
    seen.set(v, id);
    if (ArrayBuffer.isView(v)) return { $id: id, $ta: v.constructor.name, a: Array.from(v, num) };
    if (Array.isArray(v)) {
      /* an array may carry named fields too (unit.js: a list of transmitters with its snapshot a0) */
      const o = { $id: id, $arr: Array.from(v, enc) },
        ks = Object.keys(v).filter(k => !/^\d+$/.test(k));
      if (ks.length) {
        o.$p = {};
        for (const k of ks) o.$p[k] = enc(v[k]);
      }
      return o;
    }
    if (v instanceof Map) return { $id: id, $map: [...v].map(([k, w]) => [enc(k), enc(w)]) };
    if (v instanceof Set) return { $id: id, $set: [...v].map(enc) };
    const o = { $id: id, $o: {} };
    for (const k of Object.keys(v)) o.$o[k] = enc(v[k]);
    return o;
  };
  return enc(x);
}
/* plain JSON -> a value with the refs of this side; keep(k, old) for a $fn: the function the old object had */
function anStateDec(x, keep) {
  const ids = new Map();
  const num = v => (v && typeof v === 'object' && '$num' in v ? Number(v.$num) : v);
  const dec = (v, old) => {
    if (v === null || typeof v !== 'object') return v;
    if (v.$u) return undefined;
    if (v.$fn) return old;
    if ('$num' in v) return Number(v.$num);
    if (v.$all) return AN.sheets;
    if (v.$sh != null) return AN.sheets[v.$sh];
    if (v.$S != null) return ensure(AN.sheets[v.$S]);
    if (v.$B) return ensure(AN.sheets[v.$B[0]]).blk[v.$B[1]];
    if (v.$N) return ensure(AN.sheets[v.$N[0]]).nets[v.$N[1]];
    if (v.$ref != null) return ids.get(v.$ref);
    if (v.$ta) {
      const a = new AN_TA[v.$ta](v.a.length);
      v.a.forEach((w, i) => (a[i] = num(w)));
      ids.set(v.$id, a);
      return a;
    }
    if (v.$arr) {
      const a = [];
      ids.set(v.$id, a);
      v.$arr.forEach((w, i) => (a[i] = dec(w, Array.isArray(old) ? old[i] : undefined)));
      for (const k in v.$p || {}) a[k] = dec(v.$p[k], old && typeof old === 'object' ? old[k] : undefined);
      return a;
    }
    if (v.$map) {
      const m = new Map();
      ids.set(v.$id, m);
      for (const [k, w] of v.$map) m.set(dec(k), dec(w));
      return m;
    }
    if (v.$set) {
      const s = new Set();
      ids.set(v.$id, s);
      for (const w of v.$set) s.add(dec(w));
      return s;
    }
    const o = {};
    ids.set(v.$id, o);
    for (const k of Object.keys(v.$o)) o[k] = dec(v.$o[k], old && typeof old === 'object' ? old[k] : undefined);
    return o;
  };
  return dec(x, keep);
}
/* one object of this side takes the decoded content in place (its identity stays: other objects hold it) */
function anStateInto(dst, src) {
  for (const k of Object.keys(dst)) if (!(k in src)) delete dst[k];
  for (const k of Object.keys(src)) if (src[k] !== undefined || !(k in dst) || typeof dst[k] !== 'function') dst[k] = src[k];
}
/* the unit / source / cycle models as the script loaded them (Reset takes them again: sheets.js anResetAll) */
const AN_STATE_INIT = anStateEnc(AN_STATE_OBJ(), new Map());
/* in place, down the tree: a key the run made goes, a value goes back; an object that was there at load stays the same object (others
   hold it: a copy in its place broke the CHECK cold start, the fans gave no air) */
function anStateInPlace(live, init) {
  for (const k of Object.keys(live)) if (!(k in init)) delete live[k];
  for (const k of Object.keys(init)) {
    const a = live[k],
      b = init[k];
    if (typeof a === 'function') continue;
    const plain = x => x && typeof x === 'object' && !ArrayBuffer.isView(x) && !(x instanceof Map) && !(x instanceof Set);
    if (plain(a) && plain(b) && Array.isArray(a) === Array.isArray(b)) {
      if (Array.isArray(a)) a.length = b.length;
      anStateInPlace(a, b);
    } else live[k] = b;
  }
}
function anStateReset() {
  const objs = AN_STATE_OBJ(),
    st = anStateDec(AN_STATE_INIT, objs);
  for (const k in objs) anStateInPlace(objs[k], st[k]);
}
function anStateCapture() {
  const ref = anStateRefs(),
    sh = AN.sheets.map(s => {
      const S = s.S;
      if (!S) return null;
      const procs = [],
        mn = [];
      S.blk.forEach((b, j) => {
        if (b.proc) procs.push([j, b.proc]);
        if (b._mn !== undefined) mn.push([j, b._mn]);
      });
      return { rt: S.rt, look: S.look, xlk: S.xlk, plantT: S.plantT, _rem: S._rem, procs, mn };
    }),
    flags = {};
  for (const k of AN_STATE_FLAGS) flags[k] = AN[k];
  const sets = {};
  for (const k of AN_STATE_SETS) sets[k] = AN[k];
  return anStateEnc({ sh, obj: AN_STATE_OBJ(), flags, sets }, ref);
}
function anStateApply(kf) {
  const objs = AN_STATE_OBJ(),
    st = anStateDec(kf, { obj: objs });
  st.sh.forEach((r, i) => {
    if (!r) return;
    const S = ensure(AN.sheets[i]);
    S.rt = r.rt;
    S.look = r.look;
    S.xlk = r.xlk;
    S.plantT = r.plantT;
    S._rem = r._rem;
    for (const [j, p] of r.procs) S.blk[j].proc = p;
    for (const [j, m] of r.mn) S.blk[j]._mn = m;
  });
  for (const k in objs) if (st.obj[k]) anStateInto(objs[k], st.obj[k]);
  for (const k of AN_STATE_FLAGS) AN[k] = st.flags[k];
  for (const k of AN_STATE_SETS) AN[k] = st.sets[k];
  AN._asc = null; /* the step sets kept while a starting state loads */
}
