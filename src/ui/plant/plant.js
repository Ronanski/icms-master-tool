/* PLANT HMI WORKSPACE (2.1.0, draft): a third workspace next to ABC and DITL. Per system (left list) a plant graphic drawn
   after the control-room HMI snapshot (src/ui/plant/systems.js, scaled), with the snapshot text and values; the value list of
   that snapshot on the right (src/ui/plant/values.js). LIVE (2.1.0-beta.5): values, controllers and valves read the simulation
   (read only); what is not linked keeps the snapshot value, grey. UI only. */
(function () {
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const E = (t, a, kids) => {
    const e = document.createElement(t);
    if (a)
      for (const k in a) {
        if (k === 'txt') e.textContent = a[k];
        else if (k === 'cls') e.className = a[k];
        else if (k === 'on') e.onclick = a[k];
        else e.setAttribute(k, a[k]);
      }
    (kids || []).forEach(x => x != null && e.append(typeof x === 'string' ? document.createTextNode(x) : x));
    return e;
  };
  const S_ = (t, a) => {
    const e = document.createElementNS(NS, t);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    return e;
  };
  /* line colours by medium (plant HMI convention: steam red, water blue, air grey, flue gas brown, oil yellow) */
  const KC = {
    steam: '#e05555',
    water: '#3d9be0',
    cond: '#5cc8ff',
    air: '#9aa7b4',
    gas: '#c08a52',
    oil: '#d8b860',
    coal: '#8d7a66',
    ash: '#8a8f94',
    sig: '#6f8191'
  };
  const SYS = () => window.PLANT_SYS || [],
    VALS = () => window.PLANT_VALS || [];
  let ws = null,
    svg = null,
    cur = null,
    vb = null,
    btn = null;
  const list = () => {
    /* systems with a graphic first (in their order), then the snapshots that have values only */
    const out = SYS().map(s => ({ id: s.id, title: s.title, src: s.src, g: s }));
    for (const v of VALS())
      if (!out.some(o => o.src === v.src) && v.items.length && !/9999/.test(v.note || ''))
        out.push({ id: v.src, title: v.title, src: v.src, g: null });
    return out;
  };
  /* ---- LIVE LINK (2.1.0-beta.5): each value / controller / valve of the graphic is tied to the engine (read only):
     val   : TAG.PV wire of a sheet, else the I/O list transmitter of the indicator (TI -> TT / TE, PI -> PT, FIQ -> FT ...) = its AI block;
     ctl   : the faceplate of the controller (PV, SV, MV, A / M / R);
     valve : the valve tag written on the drawing next to a control valve (its position demand), else the AO address of the I/O list.
     Not linked = the snapshot value, shown grey. ---- */
  const N = t => String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  let IX = null,
    liveOn = true,
    LV = [],
    tmr = null;
  const shOf = n => (window.AN && AN.sheets ? AN.sheets.find(s => s.name === n) : null);
  async function index() {
    if (IX) return IX;
    const A = window.AN;
    if (!A || !A.sheets) return null;
    try {
      await A.ades();
    } catch (e) {}
    const pv = new Map(),
      ctl = new Map(),
      vt = new Map(),
      lab = new Map(),
      ai = new Map();
    for (const sh of A.sheets) {
      if (/ABC-000/.test(sh.name)) continue;
      let S;
      try {
        S = A.ensure(sh);
      } catch (e) {
        continue;
      }
      if (!S) continue;
      try {
        A.adesFind(sh, 'AI0001'); /* sets sh.stn */
      } catch (e) {}
      S.lab.forEach((l, n) => {
        const t = l && l.t ? l.t.trim() : '';
        if (!t) return;
        if (/\.PV$/.test(t) && !pv.has(N(t.slice(0, -3)))) pv.set(N(t.slice(0, -3)), { sh: sh.name, n });
        if ((/^(AI|AO)\d{4}$/.test(t) || /^[IOMB]\.[0-9A-F]{4}$/.test(t)) && !lab.has(sh.stn + '|' + t)) lab.set(sh.stn + '|' + t, { sh: sh.name, n });
      });
      try {
        for (const c of A.hmiCtrls(S) || []) if (!ctl.has(c.tag)) ctl.set(c.tag, { sh: sh.name, c });
      } catch (e) {}
      /* valve tag text next to a control valve symbol */
      for (const b of S.blk)
        if (b.k === 'VLV' && b.pins && b.pins.length) {
          let best = null,
            bd = 60;
          for (const t of S.tx || []) {
            const x = t.t.trim();
            if (!/^[A-Z]{2,4}-[A-Z]{2}\d{4}(-[A-Z0-9]{1,3})?$/.test(x) || !/V|D/.test(x.split('-')[0])) continue;
            const d = Math.hypot(t.x - b.cx, t.y - b.cy);
            if (d < bd) {
              bd = d;
              best = x;
            }
          }
          if (best && !vt.has(N(best))) vt.set(N(best), { sh: sh.name, n: b.pins[0].n });
        }
    }
    try {
      for (const [k, L] of A.plAIs()) if (L && L.length) ai.set(N(k), { sh: L[0].sh.name, n: L[0].n });
    } catch (e) {}
    const io = new Map(),
      run = new Map();
    try {
      const D = await A.ades();
      for (const st in D)
        for (const a in D[st]) {
          const r = D[st][a];
          if (r && r.tag && (/^A[IO]\d{4}$/.test(a) || /^[IO]\.[0-9A-F]{4}$/.test(a))) {
            const k = N(r.tag);
            if (!io.has(k)) io.set(k, { st: +st, a });
          }
          /* memory list: "A-BFWP RUNNING (BC FROM S3)" = the run state that the ABC sheets use (M.3343) */
          const m = r && r.k !== 'io' && /^([A-Z0-9 \-\/]+?)\s+RUNNING\b/.exec(String(r.d || '').toUpperCase());
          if (m && /^M\./.test(a)) {
            const k = N(m[1]);
            if (!run.has(k)) run.set(k, []);
            /* the equipment bit itself first ("(BC FROM S3)", remark "STATION WIRING"), not a pulse or a timer made from it (M.020E) */
            run.get(k).push({ st: +st, a, p: /BC FROM|STATION WIRING/i.test(String(r.d || '') + ' ' + String(r.r || '')) ? 0 : 1 });
            run.get(k).sort((x, y) => x.p - y.p);
          }
        }
    } catch (e) {}
    IX = { pv, ctl, vt, lab, ai, io, run };
    return IX;
  }
  /* the transmitter tag of an indicator tag: TIBR11302 -> TTBR11302 / TEBR11302; FIQMS1031 -> FTMS1031 */
  const tx = k => {
    const m = /^(D?P|T|F|L|A|S|E|Z|W|H|J)I(?:Q|C)?(.*)$/.exec(k);
    return m ? [m[1] + 'T' + m[2], m[1] + 'E' + m[2]] : [];
  };
  function resolve(it) {
    if (!IX || !it.tag) return null;
    const k = N(String(it.tag).split('/')[0]);
    if (it.t === 'ctl') {
      const c = IX.ctl.get(it.tag);
      return c ? { k: 'ctl', sh: c.sh, c: c.c } : null;
    }
    if (it.t === 'val') {
      if (/AVERAGE/i.test(it.v || '')) return null;
      if (IX.pv.has(k)) return Object.assign({ k: 'net', how: it.tag + '.PV' }, IX.pv.get(k));
      for (const c of [k].concat(tx(k))) {
        if (IX.ai.has(c)) return Object.assign({ k: 'net', how: 'AI of ' + c }, IX.ai.get(c));
        const r = IX.io.get(c);
        if (r && IX.lab.has(r.st + '|' + r.a)) return Object.assign({ k: 'net', how: r.a + ' STN10' + r.st, a: r.a, st: r.st }, IX.lab.get(r.st + '|' + r.a));
      }
      return null;
    }
    if (it.t === 'pump' || it.t === 'fan') {
      /* the run state: the memory bit the ABC sheets use (memory list "... RUNNING"), else the running DI of the I/O list (MIR-P1115A) */
      const words = String(it.tag).toUpperCase().split(/\s+/).filter(w => !/^[PF]-?\d{4}/.test(w)),
        full = words.join(' '),
        sw = /^(.+)-([A-Z])$/.exec(full),
        cands = [N(full)].concat(sw ? [N(sw[2] + '-' + sw[1])] : []);
      for (const c of cands)
        for (const x of IX.run.get(c) || []) if (IX.lab.has(x.st + '|' + x.a)) return Object.assign({ k: 'dig', how: x.a + ' STN10' + x.st, a: x.a, st: x.st }, IX.lab.get(x.st + '|' + x.a));
      const eq = /([PF])-?(\d{4}[A-Z]?\d?)/.exec(String(it.tag).toUpperCase());
      const r = eq && IX.io.get('MIR' + eq[1] + eq[2]);
      if (r && IX.lab.has(r.st + '|' + r.a)) return Object.assign({ k: 'dig', how: r.a + ' STN10' + r.st, a: r.a, st: r.st }, IX.lab.get(r.st + '|' + r.a));
      return null;
    }
    if (it.t === 'mov') {
      /* open / close limit switches of the I/O list: ZSO-BR1391 / ZSC-BR1391 for MVBR1391 */
      const rest = k.slice(2);
      for (const [pre, open] of [['ZSO', 1], ['ZSC', 0]]) {
        const r = IX.io.get(pre + rest);
        if (r && IX.lab.has(r.st + '|' + r.a)) return Object.assign({ k: 'dig', open, how: r.a + ' STN10' + r.st, a: r.a, st: r.st }, IX.lab.get(r.st + '|' + r.a));
      }
      return null;
    }
    if (it.t === 'valve' || it.t === 'damper') {
      /* 2.1.0-beta.10: the controller of the valve (HMI snapshot mapping): used when the drawing has no valve for the tag (its MV),
         and to read a fail-open valve right: its signal on the drawing is 100 - MV, the HMI shows the opening = MV */
      const vc = (window.PLANT_VALVE_CTL || {})[k],
        cc = vc && IX.ctl.get(vc);
      if (IX.vt.has(k)) return Object.assign({ k: 'net', how: 'valve on the drawing', cc }, IX.vt.get(k));
      if (cc) return { k: 'mv', sh: cc.sh, c: cc.c, how: 'MV of ' + vc };
      const r = IX.io.get(k);
      if (r && IX.lab.has(r.st + '|' + r.a)) return Object.assign({ k: 'net', how: r.a + ' STN10' + r.st, a: r.a, st: r.st }, IX.lab.get(r.st + '|' + r.a));
    }
    return null;
  }
  const fmtV = (x, ref) => {
    if (x == null || !isFinite(x)) return '—';
    const d = String(ref || '').split('.')[1];
    const n = d ? Math.min(3, d.length) : Math.abs(x) >= 100 ? 0 : 1;
    return x.toFixed(n);
  };
  function netVal(r) {
    const sh = shOf(r.sh);
    return sh && sh.S && sh.S.rt ? sh.S.rt.v[r.n] : null;
  }
  function liveTick() {
    if (!ws || ws.style.display !== 'grid') return;
    for (const o of LV) {
      const r = o.r;
      try {
        if (!liveOn || !r) {
          o.set(null);
          continue;
        }
        if (r.k === 'ctl') {
          const sh = shOf(r.sh),
            S = sh && sh.S,
            c = r.c,
            v = S.rt.v;
          const pk = c.amt && S.rt.st[c.amt.id] ? S.rt.st[c.amt.id].pk : c.autoLeg;
          const auto = !c.amt || pk === c.autoLeg,
            rem = !!(c.remote && c.svSw && S.rt.st[c.svSw.id] && S.rt.st[c.svSw.id].pk === 'A');
          o.set({ pv: v[c.q.pv], sv: v[c.q.sv], mv: v[c.out], m: !auto ? 'M' : rem ? 'R' : 'A' });
        } else if (r.k === 'mv') {
          const S = shOf(r.sh).S;
          o.set({ v: S.rt.v[r.c.out], r });
        } else if (r.cc) {
          let x = netVal(r);
          const mv = shOf(r.cc.sh).S.rt.v[r.cc.c.out];
          if (isFinite(x) && isFinite(mv) && Math.abs(x - (100 - mv)) < 0.5 && Math.abs(x - mv) > 1) x = 100 - x; /* fail-open valve */
          o.set({ v: x, r });
        } else o.set({ v: netVal(r), r });
      } catch (e) {}
    }
  }
  function liveCount() {
    const n = LV.filter(o => o.r).length;
    const el = $('pllive');
    if (el) {
      el.textContent = liveOn ? 'LIVE · ' + n + ' / ' + LV.length + ' linked' : 'SNAPSHOT';
      el.classList.toggle('on', liveOn);
    }
  }
  function valve(g, it, c) {
    const x = it.x,
      y = it.y,
      s = 9,
      p = it.r === 90 ? `${x - s},${y - s} ${x + s},${y - s} ${x - s},${y + s} ${x + s},${y + s}` : `${x - s},${y - s} ${x - s},${y + s} ${x + s},${y - s} ${x + s},${y + s}`;
    g.append(S_('polygon', { points: p, fill: c, stroke: '#0b0f13', 'stroke-width': 1 }));
    g.append(S_('line', { x1: x, y1: y, x2: x, y2: y - 14, stroke: c, 'stroke-width': 2 }));
    g.append(S_('rect', { x: x - 6, y: y - 20, width: 12, height: 7, fill: c }));
  }
  function txt(g, x, y, s, o) {
    o = o || {};
    const t = S_('text', {
      x,
      y,
      fill: o.c || '#d3dce5',
      'font-size': o.z || 13,
      'font-family': o.mono ? 'var(--mf, monospace)' : 'var(--uf, sans-serif)',
      'font-weight': o.b ? 600 : 400,
      'text-anchor': o.a || 'start'
    });
    t.textContent = s;
    g.append(t);
    return t;
  }
  function draw(sys) {
    svg.innerHTML = '';
    LV = [];
    const g = S_('g', {});
    svg.append(g);
    const w = sys.w || 1920,
      h = sys.h || 1000;
    g.append(S_('rect', { x: 0, y: 0, width: w, height: h, fill: '#06090c' }));
    for (const it of sys.items || []) {
      try {
        if (it.t === 'line') {
          const c = KC[it.k] || KC.sig;
          g.append(S_('polyline', { points: it.p.map(q => q.join(',')).join(' '), fill: 'none', stroke: c, 'stroke-width': it.k === 'sig' ? 1 : 2.5, 'stroke-dasharray': it.k === 'sig' ? '4 3' : '' }));
          if (it.a && it.p.length > 1) {
            const [a, b] = [it.p[it.p.length - 2], it.p[it.p.length - 1]],
              an = Math.atan2(b[1] - a[1], b[0] - a[0]),
              L = 10;
            g.append(
              S_('polygon', {
                points: `${b[0]},${b[1]} ${b[0] - L * Math.cos(an - 0.45)},${b[1] - L * Math.sin(an - 0.45)} ${b[0] - L * Math.cos(an + 0.45)},${b[1] - L * Math.sin(an + 0.45)}`,
                fill: c
              })
            );
          }
        } else if (it.t === 'valve' || it.t === 'damper') {
          const open = parseFloat(it.v) > 1;
          valve(g, it, open ? '#e05555' : '#3fbf6a');
          txt(g, it.x + 14, it.y - 10, it.tag || '', { z: 12, b: 1 });
          const vt = txt(g, it.x + 14, it.y + 6, (it.v != null ? it.v : '—') + ' ' + (it.u || '%'), { z: 13, mono: 1, c: '#5cd6ff' });
          if (it.m) txt(g, it.x - 14, it.y - 10, it.m, { z: 11, c: it.m === 'M' ? '#ffd27a' : '#9ff0c4', a: 'end', b: 1 });
          reg(it, x => {
            vt.textContent = x ? fmtV(x.v, it.v) + ' ' + (it.u || '%') : (it.v != null ? it.v : '—') + ' ' + (it.u || '%');
            vt.setAttribute('fill', x ? '#5cd6ff' : '#7f90a0');
          });
        } else if (it.t === 'mov') {
          valve(g, it, it.st === 'open' ? '#e05555' : '#3fbf6a');
          {
            const parts = [...g.childNodes].slice(-3);
            reg(it, x => {
              const on = x && x.v != null ? (x.r && x.r.open === 0 ? x.v < 0.5 : x.v > 0.5) : it.st === 'open';
              const c = on ? '#e05555' : '#3fbf6a';
              for (const e of parts) e.setAttribute(e.tagName === 'line' ? 'stroke' : 'fill', c);
            }, parts[0]);
          }
          if (it.tag) txt(g, it.x + 14, it.y - 10, it.tag, { z: 11 });
          if (it.v != null) txt(g, it.x + 14, it.y + 6, it.v + ' ' + (it.u || '%'), { z: 12, mono: 1, c: '#5cd6ff' });
          if (it.m) txt(g, it.x - 14, it.y - 10, it.m, { z: 10, c: '#9ff0c4', a: 'end', b: 1 });
        } else if (it.t === 'pump' || it.t === 'fan') {
          const c = it.st === 'run' ? '#e05555' : '#3fbf6a';
          g.append(S_('circle', { cx: it.x, cy: it.y, r: 14, fill: 'none', stroke: c, 'stroke-width': 2.5 }));
          const ring = g.lastChild;
          if (it.t === 'pump') g.append(S_('polygon', { points: `${it.x - 8},${it.y + 8} ${it.x + 8},${it.y} ${it.x - 8},${it.y - 8}`, fill: c }));
          else g.append(S_('path', { d: `M${it.x - 9},${it.y} L${it.x + 9},${it.y} M${it.x},${it.y - 9} L${it.x},${it.y + 9}`, stroke: c, 'stroke-width': 2.5 }));
          {
            const sym = g.lastChild;
            reg(it, x => {
              const on = x && x.v != null ? x.v > 0.5 : it.st === 'run';
              const c2 = on ? '#e05555' : '#3fbf6a';
              ring.setAttribute('stroke', c2);
              sym.setAttribute(it.t === 'pump' ? 'fill' : 'stroke', c2);
            }, ring);
          }
          if (it.tag) txt(g, it.x, it.y + 30, it.tag, { z: 11, a: 'middle' });
          if (it.m) txt(g, it.x + 18, it.y - 12, it.m, { z: 10, c: '#9ff0c4', b: 1 });
        } else if (it.t === 'vessel') {
          const rx = it.shape === 'drum' || it.shape === 'tank' ? Math.min(it.w, it.h) / 2 : it.shape === 'turbine' ? 4 : 6;
          if (it.shape === 'turbine')
            g.append(S_('polygon', { points: `${it.x},${it.y + it.h * 0.3} ${it.x + it.w},${it.y} ${it.x + it.w},${it.y + it.h} ${it.x},${it.y + it.h * 0.7}`, fill: '#1b2530', stroke: '#8b9aa8', 'stroke-width': 2 }));
          else g.append(S_('rect', { x: it.x, y: it.y, width: it.w, height: it.h, rx, fill: '#121a22', stroke: '#8b9aa8', 'stroke-width': 2 }));
          if (it.label) txt(g, it.x + it.w / 2, it.y + it.h / 2 + 5, it.label, { z: 13, a: 'middle', b: 1 });
        } else if (it.t === 'text') {
          txt(g, it.x, it.y, it.s, { z: it.z || 13, b: it.b, c: it.c });
        } else if (it.t === 'val') {
          if (it.tag) txt(g, it.x, it.y - 15, it.tag, { z: 11, c: '#a9b7c4' });
          const vt = txt(g, it.x, it.y, (it.v != null ? it.v : '—') + (it.u ? ' ' + it.u : ''), { z: 14, mono: 1, c: '#5cd6ff' });
          reg(it, x => {
            vt.textContent = (x ? fmtV(x.v, it.v) : it.v != null ? it.v : '—') + (it.u ? ' ' + it.u : '');
            vt.setAttribute('fill', x ? '#5cd6ff' : '#7f90a0');
          }, vt);
        } else if (it.t === 'ctl') {
          const bw = 168,
            bh = 70;
          const box = S_('rect', { x: it.x, y: it.y, width: bw, height: bh, rx: 3, fill: '#0d1319', stroke: '#2a6a98', 'stroke-width': 1.5 });
          g.append(box);
          txt(g, it.x + 6, it.y + 15, (it.label || it.tag || '').slice(0, 28), { z: 11, c: '#a9b7c4' });
          txt(g, it.x + 6, it.y + 31, it.tag || '', { z: 12, b: 1, mono: 1 });
          const mt = txt(g, it.x + bw - 6, it.y + 31, it.m || '', { z: 12, b: 1, a: 'end', c: it.m === 'M' ? '#ffd27a' : '#9ff0c4' });
          const t1 = txt(g, it.x + 6, it.y + 50, 'PV ' + (it.pv != null ? it.pv : '—') + '  SV ' + (it.sv != null ? it.sv : '—'), { z: 12, mono: 1, c: '#5cd6ff' });
          const t2 = txt(g, it.x + 6, it.y + 66, 'MV ' + (it.mv != null ? it.mv + ' %' : '—') + (it.u ? '   ' + it.u : ''), { z: 12, mono: 1, c: '#9ff0c4' });
          reg(it, x => {
            const m = x ? x.m : it.m || '';
            mt.textContent = m;
            mt.setAttribute('fill', m === 'M' ? '#ffd27a' : '#9ff0c4');
            t1.textContent = 'PV ' + (x ? fmtV(x.pv, it.pv) : it.pv != null ? it.pv : '—') + '  SV ' + (x ? fmtV(x.sv, it.sv) : it.sv != null ? it.sv : '—');
            t2.textContent = 'MV ' + (x ? fmtV(x.mv, it.mv) + ' %' : it.mv != null ? it.mv + ' %' : '—') + (it.u ? '   ' + it.u : '');
            t1.setAttribute('fill', x ? '#5cd6ff' : '#7f90a0');
            t2.setAttribute('fill', x ? '#9ff0c4' : '#7f90a0');
          }, box);
        } else if (it.t === 'header') {
          let x = 20;
          g.append(S_('rect', { x: 0, y: 0, width: w, height: 34, fill: '#141c25' }));
          for (const [k, v, u] of it.items || []) {
            txt(g, x, 23, k, { z: 14, c: '#a9b7c4', b: 1 });
            const t = txt(g, x + 50, 23, v + ' ' + (u || ''), { z: 15, mono: 1, c: '#5cd6ff' });
            x += 60 + Math.max(90, (v + ' ' + (u || '')).length * 10);
            void t;
          }
        }
      } catch (e) {}
    }
    vb = [0, 0, w, h];
    fit();
    index().then(() => {
      for (const o of LV) o.r = resolve(o.it);
      for (const o of LV)
        if (o.r && o.hit) {
          o.hit.style.cursor = 'pointer';
          o.hit.addEventListener('click', e => {
            e.stopPropagation();
            try {
              if (o.r.k === 'ctl') window.lsInfo && window.lsInfo(o.it.tag);
              else if (o.r.k === 'mv') window.lsInfo && window.lsInfo(o.r.c.tag);
              else if (o.r.a) window.lsInfo && window.lsInfo(o.r.a, { stn: o.r.st });
              else window.lsInfo && window.lsInfo(o.it.tag + '.PV');
            } catch (x) {}
          });
        }
      liveCount();
      liveTick();
    });
  }
  function reg(it, set, hit) {
    LV.push({ it, set, hit, r: null });
  }
  function fit() {
    if (!vb || !svg) return;
    const r = svg.getBoundingClientRect(),
      w = vb[2],
      h = vb[3],
      s = Math.max(w / Math.max(1, r.width), h / Math.max(1, r.height));
    vb = [(w - r.width * s) / 2, (h - r.height * s) / 2, r.width * s, r.height * s];
    svg.setAttribute('viewBox', vb.join(' '));
  }
  function valsOf(src) {
    return VALS().find(v => v.src === src);
  }
  function showVals(src) {
    const box = $('plvals');
    box.innerHTML = '';
    const v = valsOf(src);
    if (!v) {
      box.append(E('div', { cls: 'sub', txt: 'No values for this screen.' }));
      return;
    }
    const f = E('input', { cls: 'plf', placeholder: 'Filter tag…' }),
      tb = E('div', { cls: 'pltb' });
    const fill = () => {
      tb.innerHTML = '';
      const q = f.value.trim().toUpperCase();
      for (const [tag, val, u, m, k] of v.items) {
        if (q && !String(tag).toUpperCase().includes(q)) continue;
        tb.append(E('div', { cls: 'plr k-' + k }, [E('b', { txt: tag }), E('span', { cls: 'v', txt: val + (u && !String(val).includes(u) ? ' ' + u : '') }), E('span', { cls: 'm', txt: m || '' })]));
      }
    };
    f.oninput = fill;
    box.append(
      E('div', { cls: 'plh' }, [E('b', { txt: 'Snapshot values' }), E('span', { txt: v.items.length + ' · ' + (v.time || v.src) })]),
      v.note ? E('div', { cls: 'sub', txt: v.note }) : null,
      f,
      tb
    );
    fill();
  }
  function select(o) {
    cur = o;
    for (const b of document.querySelectorAll('#pllist button')) b.classList.toggle('on', b.dataset.id === o.id);
    $('pltitle').textContent = o.title;
    if (o.g) draw(o.g);
    else {
      svg.innerHTML = '';
      const g = S_('g', {});
      svg.append(g);
      vb = [0, 0, 960, 500];
      txt(g, 480, 230, o.title, { z: 22, a: 'middle', b: 1 });
      txt(g, 480, 262, 'Graphic not drawn yet: the snapshot values are in the list on the right.', { z: 14, a: 'middle', c: '#7f90a0' });
      fit();
    }
    showVals(o.src);
    try {
      localStorage.setItem('ls-plant-sys', o.id);
    } catch (e) {}
  }
  function build() {
    ws = E('div', { id: 'plantws' });
    const left = E('div', { id: 'plleft' }),
      mid = E('div', { id: 'plmid' }),
      right = E('div', { id: 'plright' });
    const fl = E('input', { cls: 'plf', placeholder: 'Find system…' });
    const ul = E('div', { id: 'pllist' });
    const fillList = () => {
      ul.innerHTML = '';
      const q = fl.value.trim().toUpperCase();
      for (const o of list()) {
        if (q && !o.title.toUpperCase().includes(q)) continue;
        const b = E('button', { cls: o.g ? '' : 'novg', 'data-id': o.id, on: () => select(o) }, [E('b', { txt: o.title }), E('small', { txt: o.g ? 'graphic + values' : 'values only' })]);
        ul.append(b);
      }
    };
    fl.oninput = fillList;
    left.append(E('div', { cls: 'plh' }, [E('b', { txt: 'PLANT HMI · systems' })]), fl, ul);
    svg = S_('svg', { id: 'plsvg' });
    const bar = E('div', { cls: 'plbar' }, [
      E('b', { id: 'pltitle', txt: '' }),
      E('button', {
        id: 'pllive',
        cls: 'b pllive on',
        txt: 'LIVE',
        title: 'LIVE: values from the simulation (tag.PV, I/O list address, valve on the drawing); grey = not linked, snapshot value. Click: show the snapshot values.',
        on: () => {
          liveOn = !liveOn;
          liveCount();
          liveTick();
        }
      }),
      E('button', { cls: 'b', txt: 'Fit', on: () => (cur && cur.g ? draw(cur.g) : fit()) }),
      E('button', { cls: 'b', txt: 'Values', on: () => ws.classList.toggle(matchMedia('(max-width:1180px)').matches ? 'vals' : 'novals') })
    ]);
    mid.append(bar, svg);
    right.id = 'plvals';
    ws.append(left, mid, right);
    document.body.append(ws);
    fillList();
    /* pan (drag) and zoom (wheel / pinch) */
    let drag = null;
    svg.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, v: vb.slice() };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', e => {
      if (!drag || !vb) return;
      const r = svg.getBoundingClientRect(),
        s = vb[2] / r.width;
      vb = [drag.v[0] - (e.clientX - drag.x) * s, drag.v[1] - (e.clientY - drag.y) * s, vb[2], vb[3]];
      svg.setAttribute('viewBox', vb.join(' '));
    });
    svg.addEventListener('pointerup', () => (drag = null));
    svg.addEventListener(
      'wheel',
      e => {
        e.preventDefault();
        if (!vb) return;
        const r = svg.getBoundingClientRect(),
          k = e.deltaY > 0 ? 1.15 : 1 / 1.15,
          px = vb[0] + ((e.clientX - r.left) / r.width) * vb[2],
          py = vb[1] + ((e.clientY - r.top) / r.height) * vb[3];
        vb = [px - (px - vb[0]) * k, py - (py - vb[1]) * k, vb[2] * k, vb[3] * k];
        svg.setAttribute('viewBox', vb.join(' '));
      },
      { passive: false }
    );
    let last = null;
    try {
      last = localStorage.getItem('ls-plant-sys');
    } catch (e) {}
    const all = list();
    select(all.find(o => o.id === last) || all[0]);
  }
  function place() {
    if (!ws) return;
    const top = $('gsbar') ? $('gsbar').getBoundingClientRect().bottom : 40,
      foot = $('sfoot') ? $('sfoot').getBoundingClientRect().height : 0;
    ws.style.top = top + 'px';
    ws.style.bottom = foot + 'px';
  }
  function open(on) {
    if (on && !ws) build();
    if (!ws) return;
    ws.style.display = on ? 'grid' : 'none';
    document.body.classList.toggle('plant', !!on);
    if (btn) btn.classList.toggle('on', !!on);
    document.querySelectorAll('#gsbar .cat button').forEach(b => b !== btn && on && b.classList.remove('on'));
    if (on) {
      try {
        window.lsLibrary && window.lsLibrary(false);
      } catch (e) {}
      place();
      setTimeout(() => (cur && cur.g ? draw(cur.g) : fit()), 30);
      if (!tmr) tmr = setInterval(liveTick, 1000);
    }
  }
  window.lsPlant = open;
  window.lsPlantLive = () => LV.map(o => ({ tag: o.it.tag, t: o.it.t, snap: o.it.t === 'ctl' ? o.it.pv + '/' + o.it.sv + '/' + o.it.mv + ' ' + o.it.m : o.it.v, how: o.r ? o.r.how || o.r.k : null, sh: o.r ? o.r.sh : null, live: o.r && o.r.k === 'mv' ? shOf(o.r.sh).S.rt.v[o.r.c.out] : o.r && o.r.cc ? (() => { const x = netVal(o.r), mv = shOf(o.r.cc.sh).S.rt.v[o.r.cc.c.out]; return Math.abs(x - (100 - mv)) < 0.5 && Math.abs(x - mv) > 1 ? 100 - x : x; })() : o.r && (o.r.k === 'net' || o.r.k === 'dig') ? netVal(o.r) : o.r && o.r.k === 'ctl' ? (() => { const S = shOf(o.r.sh).S, c = o.r.c; return [S.rt.v[c.q.pv], S.rt.v[c.q.sv], S.rt.v[c.out]].map(x => +(+x).toFixed(1)).join('/'); })() : null })); /* for the tests */
  addEventListener('resize', () => {
    if (ws && ws.style.display === 'grid') {
      place();
      fit();
    }
  });
  const iv = setInterval(() => {
    const cats = document.querySelectorAll('#gsbar .cat');
    if (!cats.length) return;
    cats.forEach(cat => {
      if (cat.querySelector('.plbtn')) return;
      const b = E('button', { cls: 'plbtn', txt: 'PLANT', title: 'Plant HMI workspace (draft): plant graphics per system with the control-room snapshot values' });
      b.onclick = e => {
        e.stopPropagation();
        open(!(ws && ws.style.display === 'grid'));
      };
      cat.append(b);
      btn = b;
      /* ABC / DITL close the plant workspace */
      cat.querySelectorAll('button:not(.plbtn)').forEach(x => x.addEventListener('click', () => open(false)));
    });
    clearInterval(iv);
  }, 400);
})();
