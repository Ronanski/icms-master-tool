/* in-page checkpoint: snapshot / restore of the whole simulation state (test tool only, not app code) */
window.__CK = (function () {
  const SKIP_DITL = new Set(['_inst', 'tx', 'cells', 'raw', '_alltx', 'rb', 'rows', 'rng', 'vr', 'syms', 'lyr', 'title', 'name']);
  const SKIP_NL = new Set(['dang', 'segs', 'seg', 'split']);
  const SKIP_AN = new Set(['sheets', 'data', 'hmi', 'hmiSheets', 'plantSheets', 'unitSheets', 'worldSheets', 'checkSheets', 'errs', 'hist', 'ws', 'wsr', '_xs', '_src', '_xr', 'tagIdx', 'rows', 'cat', 'run', 'view', 'i', 'spd', 'sel', 'unit', 'lnSrc', 'ades', 'hmiUi', '_ready', '_cur']);
  const WK = ['out', 'stat', 'ms', '_o', '_ck', 'busy', 'tk', 'live'];
  function snap(o, seen, d) {
    if (o === undefined) return { $u: 1 };
    if (typeof o === 'function' || typeof o === 'symbol') return undefined;
    if (o === null || typeof o !== 'object') return typeof o === 'number' && !isFinite(o) ? { $n: String(o) } : o;
    if (seen.has(o)) return { $r: 1 };
    if ((typeof Node !== 'undefined' && o instanceof Node) || o === window) return undefined;
    if (ArrayBuffer.isView(o)) return { $t: o.constructor.name, a: Array.from(o, x => (isFinite(x) ? x : null)) };
    if (o instanceof Set) return [...o].some(x => x !== null && (typeof x === 'object' || typeof x === 'function')) ? { $r: 1 } : { $set: [...o] };
    if (o instanceof Map || o instanceof WeakMap || o instanceof WeakSet || o instanceof Promise) return undefined;
    if (d > 14) return undefined;
    seen.add(o);
    if (Array.isArray(o)) return o.map(x => { const r = snap(x, seen, d + 1); return r === undefined ? { $x: 1 } : r; });
    const r = {};
    for (const k of Object.keys(o)) { let v; try { v = snap(o[k], seen, d + 1); } catch (e) { v = undefined; } if (v !== undefined) r[k] = v; }
    return r;
  }
  const pick = (o, skip) => { const r = {}; for (const k of Object.keys(o)) if (!skip.has(k)) r[k] = o[k]; return r; };
  function save() {
    const seen = new Set();
    for (const sh of AN.sheets) { seen.add(sh); if (sh.S) seen.add(sh.S); }
    for (const s of S.sheets) { seen.add(s); if (s.nl) seen.add(s.nl); }
    seen.add(S); seen.add(AN); seen.add(WORLD); if (WORLD.idx) seen.add(WORLD.idx);
    const out = { at: Date.now() };
    out.an = AN.sheets.map(sh => (sh.S && sh.S.rt ? snap(sh.S.rt, seen, 0) : null));
    out.ditl = S.sheets.map(s => { const o = snap(pick(s, new Set([...SKIP_DITL, 'nl'])), seen, 0); o.nl = s.nl ? snap(pick(s.nl, SKIP_NL), seen, 0) : null; return o; });
    out.unit = snap(AN.unit, seen, 0);
    const w = {}; for (const k of WK) w[k] = WORLD[k]; out.world = snap(w, seen, 0);
    out.dreg = snap(DREG, seen, 0); out.mst = snap(MST, seen, 0); out.ms = snap(MS, seen, 0);
    out.anx = {}; for (const k of Object.keys(AN)) if (!SKIP_AN.has(k) && typeof AN[k] !== 'function') { const v = snap(AN[k], seen, 0); const j = v === undefined ? '' : JSON.stringify(v); if (v !== undefined && j.length < 3e6 && !/"\$[rx]"/.test(j)) out.anx[k] = v; }
    out.field = AN.fieldState ? AN.fieldState() : {};
    out.co = snap(LS_GUIDE.CO, seen, 0);
    out.guide = { cur: LS_GUIDE.cur, mine: JSON.parse(JSON.stringify(LS_GUIDE.mine())) };
    out.names = { an: AN.sheets.map(s => s.name), ditl: S.sheets.map(s => s.name) };
    return JSON.stringify(out);
  }
  function dec(v) {
    if (v === null || typeof v !== 'object') return v;
    if (v.$u) return undefined; if (v.$n !== undefined) return Number(v.$n);
    if (v.$t) return new window[v.$t](v.a.map(x => (x == null ? NaN : x)));
    if (v.$set) return new Set(v.$set); if (v.$r || v.$x) return undefined;
    if (Array.isArray(v)) return v.map(dec);
    const r = {}; for (const k of Object.keys(v)) r[k] = dec(v[k]); return r;
  }
  let nPut = 0;
  function put(t, k, v) {
    nPut++;
    if (v === null || typeof v !== 'object') { t[k] = v; return; }
    if (v.$r || v.$x) return;
    if (v.$u) { t[k] = undefined; return; }
    if (v.$n !== undefined) { t[k] = Number(v.$n); return; }
    if (v.$t) { const c = t[k], a = v.a.map(x => (x == null ? NaN : x)); if (c && ArrayBuffer.isView(c) && c.length === a.length) c.set(a); else t[k] = new window[v.$t](a); return; }
    if (v.$set) { const c0 = t[k]; if (c0 instanceof Set && [...c0].some(x => x !== null && typeof x === 'object')) return; t[k] = new Set(v.$set); return; }
    const c = t[k];
    if (c && typeof c === 'object' && !(typeof Node !== 'undefined' && c instanceof Node)) merge(c, v); else t[k] = dec(v);
  }
  function merge(c, v) {
    if (Array.isArray(v) && Array.isArray(c)) { v.forEach((x, i) => put(c, i, x)); if (c.length > v.length) c.length = v.length; return; }
    for (const k of Object.keys(v)) put(c, k, v[k]);
    for (const k of Object.keys(c)) if (!(k in v)) { const x = c[k]; if (x === null || x === undefined || typeof x !== 'object' && typeof x !== 'function') delete c[k]; }
  }
  function load(txt) {
    const d = JSON.parse(txt);
    if (d.names.an.join() !== AN.sheets.map(s => s.name).join() || d.names.ditl.join() !== S.sheets.map(s => s.name).join()) throw new Error('sheet list differs: other build');
    nPut = 0;
    d.an.forEach((r, i) => { const sh = AN.sheets[i]; if (r && sh.S && sh.S.rt) merge(sh.S.rt, r); });
    d.ditl.forEach((o, i) => { const s = S.sheets[i], nl = o.nl; delete o.nl; for (const k of Object.keys(o)) put(s, k, o[k]); if (nl && s.nl) merge(s.nl, nl); });
    merge(AN.unit, d.unit);
    for (const k of Object.keys(d.world)) put(WORLD, k, d.world[k]);
    merge(DREG, d.dreg); merge(MST, d.mst); merge(MS, d.ms);
    for (const k of Object.keys(d.anx)) if (!/"\$[rx]"/.test(JSON.stringify(d.anx[k]))) put(AN, k, d.anx[k]);
    for (const k of Object.keys(d.field || {})) AN.field(k, d.field[k]);
    LS_GUIDE.open(d.guide.cur);
    const CO = LS_GUIDE.CO; for (const k of Object.keys(CO)) delete CO[k]; for (const k of Object.keys(d.co)) CO[k] = dec(d.co[k]);
    Object.assign(LS_GUIDE.mine(), d.guide.mine);
    try { AN.paint(); } catch (e) {}
    return { puts: nPut, cur: d.guide.cur, t: AN.unit.t };
  }
  return { save, load };
})();
