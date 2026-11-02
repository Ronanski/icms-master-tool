/* DITL (digital logic) - the state of the DITL world as plain JSON, no DOM (3.2.0 Web Worker, stage c): ditlCapture() / ditlApply(k), the
   DITL half of the keyframe (the ABC half: src/analog/engine/state.js). What a scan changes (read from the page: every key of every sheet,
   netlist and part before and after a run at 150 MW): per sheet the inputs (sig), the switches (usw), the analog values (av, av150, avw),
   the automatic rows (_win), the flow dampers (_fd), the field trip (_ftrip); per netlist the nets (_v) and the forces (fx, ufx); per
   part the flip-flop, counter and timer state; the motors and valves (MST, MS), the DCS registers (DREG), the DITL clock, the outputs of
   the one world (WORLD.out) and the protection switches of the plant (src/world/plantsw.js). Part of ONE script (src/digital/order.list). */
const DITL_SH = ['sig', 'usw', 'av', 'av150', 'avw', '_win', '_fd', '_ftrip'],
  DITL_NL = ['_v', 'fx', 'ufx'],
  DITL_G = ['q', 'st', 'N', 'pin', 'rp', 'rq', 'Nn', 'cin'],
  DITL_W = ['out', '_o', 'tk', '_ck', 'busy'];
function ditlEnc(v) {
  if (v instanceof Set) return { $set: [...v] };
  if (v instanceof Map) return { $map: [...v].map(([k, w]) => [k, ditlEnc(w)]) };
  if (Array.isArray(v)) return v.map(ditlEnc);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) if (v[k] !== undefined) o[k] = ditlEnc(v[k]);
    return o;
  }
  return typeof v === 'number' && !isFinite(v) ? { $num: String(v) } : v;
}
function ditlDec(v) {
  if (Array.isArray(v)) return v.map(ditlDec);
  if (v && typeof v === 'object') {
    if (v.$set) return new Set(v.$set);
    if (v.$map) return new Map(v.$map.map(([k, w]) => [k, ditlDec(w)]));
    if ('$num' in v) return Number(v.$num);
    const o = {};
    for (const k of Object.keys(v)) o[k] = ditlDec(v[k]);
    return o;
  }
  return v;
}
const ditlAll = () => S.sheets.concat((window.WORLD && WORLD.inst) || []);
const ditlPick = (o, ks) => {
  const r = {};
  for (const k of ks) if (o[k] !== undefined) r[k] = ditlEnc(o[k]);
  return r;
};
function ditlCapture() {
  const W = window.WORLD || {};
  return {
    sh: ditlAll().map(s => ({
      name: s.name,
      s: ditlPick(s, DITL_SH),
      nl: s.nl ? { ...ditlPick(s.nl, DITL_NL), g: (s.nl.gates || []).map(g => ditlPick(g, DITL_G)) } : null
    })),
    MST: ditlEnc(MST),
    MS: ditlEnc(MS),
    DREG: ditlEnc(DREG),
    t: tick.t,
    SIM,
    W: ditlPick(W, DITL_W),
    sw: W.plantSw ? W.plantSw() : null
  };
}
/* the same keys take the values of k (a key that k does not have goes), on the sheets of this side by name */
function ditlApply(k) {
  const put = (o, ks, v) => {
    for (const x of ks)
      if (x in v) o[x] = ditlDec(v[x]);
      else delete o[x];
  };
  const by = new Map(ditlAll().map(s => [s.name, s]));
  for (const q of k.sh) {
    const s = by.get(q.name);
    if (!s) continue;
    put(s, DITL_SH, q.s);
    if (!q.nl) continue;
    if (!s.nl) s.nl = netlist(s);
    put(s.nl, DITL_NL, q.nl);
    (s.nl.gates || []).forEach((g, i) => q.nl.g[i] && put(g, DITL_G, q.nl.g[i]));
  }
  MST = ditlDec(k.MST);
  MS = ditlDec(k.MS);
  DREG = ditlDec(k.DREG);
  tick.t = k.t;
  SIM = k.SIM;
  if (window.WORLD) {
    put(WORLD, DITL_W, k.W);
    if (k.sw && WORLD.plantSwSet) WORLD.plantSwSet(k.sw);
  }
}
