/* ---------- the FROM / TO DITL texts of an ABC sheet and the address descriptions (3.2.0 Web Worker, stage b: no DOM, the one world
   src/world/world.js reads them; moved as they were from ui/trace.js and data/loader.js) ---------- */
/* descriptions: station -> address -> record (IO list rows: tag, description, range, unit, type, SIG.AB address; memory lists: description,
   remark, timer type / seconds). The page fills it from its data (data/loader.js adesLoad), the engine alone from its host */
let ADES = null;
function adesFind(sh, text) {
  if (!ADES || !text) return null;
  const t = String(text).trim();
  let m = /^(?:S(\d)\s*)?([A-Z]{1,2})\.([0-9A-F]{3,4})$/i.exec(t),
    pre,
    num,
    dot = '.';
  if (m) {
    pre = m[2].toUpperCase();
    num = m[3].toUpperCase().padStart(4, '0');
  } else {
    m = /^(?:S(\d)\s*)?(TR|SI|SO|AI|AO|DI|DO|FP|PTN)(\d{1,6})$/i.exec(t);
    if (!m) return null;
    pre = m[2].toUpperCase();
    dot = '';
    num = pre === 'PTN' ? m[3].padStart(6, '0') : m[3].padStart(4, '0');
  }
  const stn = m[1] ? +m[1] : sh ? shStn(sh) : null,
    T = ADES[String(stn)],
    key = pre + dot + num,
    r = T && T[key];
  return r ? { rec: r, stn, key } : null;
}
function adesText(r) {
  if (!r) return '';
  return r.k === 'io' ? [r.tag, r.d].filter(Boolean).join(' · ') : [r.d, r.r].filter(Boolean).join(' · ');
}
const DS_RX = /(FROM|TO)\s+DITL\s*([0-9]{2}[A-Z]?)\s*-\s*(\d+)/gi;
function dsIdx(sh) {
  if (sh._ds) return sh._ds;
  const S = ensure(sh),
    from = new Map(),
    to = new Map(),
    toDig = new Map(),
    lost = [];
  for (const t of S.tx) {
    if (!/DITL/i.test(t.t)) continue;
    const isFrom = /FROM/i.test(t.t);
    DS_RX.lastIndex = 0;
    const refs = [];
    let m;
    while ((m = DS_RX.exec(t.t))) refs.push('DITL ' + m[2] + '-' + m[3]);
    /* 2.2.0-beta.3: a list after the first one ("TO DITL 02-25, DITL 03F-16, DITL 19-16", ABC-027 M.2504): every reference, not the first only */
    if (refs.length) {
      const L = /,\s*(?:DITL\s*)?([0-9]{2}[A-Z]?)\s*-\s*(\d+)/gi;
      while ((m = L.exec(t.t))) if (!refs.includes('DITL ' + m[1] + '-' + m[2])) refs.push('DITL ' + m[1] + '-' + m[2]);
    }
    if (!refs.length) refs.push(t.t.replace(/[()]/g, '').trim());
    const near = [];
    for (const nn of S.nets) {
      if (!nn.segs.length) continue;
      let d = 1e9;
      for (const i of nn.segs) d = Math.min(d, anPtSeg(t.x, t.y, S.seg[i]));
      if (d <= 20) near.push({ id: nn.id, d });
    }
    near.sort((p, q) => p.d - q.d);
    /* 1.22.0: a FROM text that touches a wire (<= 8) names THAT wire, even when an input wire is a bit farther
       (ABC-004A: the four "( FROM DITL 07-64 )" were put on the SIG.AB flags B.0723 ... at 8 ~ 9 instead of M.3410 ... at 5; ABC-003B: M.025B at 18 instead of M.3434 at 5) */
    const pick = isFrom
      ? (near[0] && near[0].d <= 8 ? near[0] : null) || near.find(q => S.ext.includes(q.id)) || near[0]
      : near.find(q => !S.ext.includes(q.id) && S.drv[q.id] && S.drv[q.id].some(d => d.k !== 'LINK')) || near[0];
    if (!pick) {
      lost.push({ t: t.t, x: Math.round(t.x), y: Math.round(t.y) });
      continue;
    }
    const M = isFrom ? from : to;
    const o = M.get(pick.id) || [];
    for (const r of refs) if (!o.includes(r)) o.push(r);
    M.set(pick.id, o);
    /* 2.2.0-beta.4: the nearest DIGITAL net driven by the logic, for a TO DITL text that sits by an analog wire (ABC-001C "TO DITL
       40-09" between the main steam pressure AI0131 and the output M.310D of its LOW LOW comparator, < 72.9 kg/cm2) */
    if (!isFrom && S.nets[pick.id] && !S.nets[pick.id].dig) {
      const dg = near.find(q => S.nets[q.id] && S.nets[q.id].dig && !S.ext.includes(q.id) && S.drv[q.id] && S.drv[q.id].length);
      if (dg) for (const r of refs) toDig.set(r + '@' + pick.id, dg.id);
    }
  }
  /* 2.3.0-beta.1 (LINK-3): a "TO DITL" text written under its own comparator box belongs to the wire named in S.dsTo (ABC-001C
     "TO DITL 40-06" = O.0177 > 134 kg/cm2, not M.3109 under it; DITL-40 rows 6 ~ 9, 13) */
  if (S.dsTo) {
    const key = r => {
      const m = /([0-9]{2,3}[A-Z]?)\s*-\s*(\d+)/.exec(r);
      return m ? m[1] + '-' + +m[2] : r;
    };
    for (const ref in S.dsTo) {
      const n = S.lab.findIndex((l, i) => l && String(l.t).trim() === S.dsTo[ref] && S.drv[i] && S.drv[i].length);
      if (n < 0) continue;
      let full = null;
      for (const [id, o] of [...to]) {
        const j = o.findIndex(r => key(r) === ref);
        if (j < 0) continue;
        full = o[j];
        o.splice(j, 1);
        if (!o.length) to.delete(id);
        toDig.delete(full + '@' + id);
      }
      if (!full) continue;
      const o = to.get(n) || [];
      if (!o.includes(full)) o.push(full);
      to.set(n, o);
    }
  }
  return (sh._ds = { from, to, toDig, lost });
}
