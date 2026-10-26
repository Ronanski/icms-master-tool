/* NEW PLANT HMI (3.2.0-beta.41, roadmap step 6, sample): the plant screens REDRAWN with our own vector graphics (user 2026-10-26:
   "new HMI using your own graphics, guide lang ang snapshots"). The control-room snapshots (document-references/hmi-snapshot-
   sample.zip) are only the guide for the system: equipment, flow paths, instruments. Drawn here as light SVG (no pictures), one
   style for every screen:
   - flow left to right / bottom to top, one colour per medium (cold air, hot air, flue gas, solids), arrows on every duct; a
     duct is dimmed when its flow is stopped (the fan that drives it is not running);
   - equipment grey; state colour only on what moves (plant convention, OPERATING_POINTS.md: red = running / open, green =
     stopped / closed, white = in between, grey = no signal);
   - every number is a data tag (tag, value, unit) from the simulation: the TAG.PV wire of an ABC sheet, the AI of the I/O list
     transmitter, a faceplate PV / SV / MV (same live link as the old Plant view, plant.js resolve). No signal in the DCS logic =
     "—" grey, never a snapshot number;
   - the control loops of the screen as a column of faceplate chips (tag, mode, PV, SV, MV bar); a click opens the faceplate.
   plant.js draws a system with `v2: true` through PLANT_V2.draw (the old screens are not touched). */
(function () {
  const C = {
    bg: '#11161b',
    eq: '#26303a',
    eqs: '#7b8996',
    tx: '#d4dde6',
    dim: '#7d8b98',
    val: '#7fe3ff',
    box: '#0a0e12',
    boxs: '#2c3946',
    air: '#5b93c4',
    hot: '#d58b3d',
    gas: '#9b8268',
    sol: '#8a8f94',
    run: '#ff3b30',
    stop: '#2fd05a',
    mid: '#f2f2f2',
    none: '#5d6873',
    man: '#ffd27a',
    auto: '#9ff0c4',
    hdr: '#f0b0d8'
  };
  const NS = 'http://www.w3.org/2000/svg';
  const S_ = (t, a) => {
    const e = document.createElementNS(NS, t);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    return e;
  };
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '—' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  /* ---- the symbol library: every screen is made of these ---- */
  function lib(g, api) {
    const L = {};
    L.text = (x, y, s, o) => {
      o = o || {};
      const t = S_('text', { x, y, fill: o.c || C.tx, 'font-size': o.z || 13, 'font-family': o.mono ? 'var(--mf, monospace)' : 'var(--uf, sans-serif)', 'font-weight': o.b ? 600 : 400, 'text-anchor': o.a || 'start', 'letter-spacing': o.ls || 0 });
      t.textContent = s;
      g.append(t);
      return t;
    };
    /* a duct / pipe: wide line of its medium with an arrow at the end; `on` = a ref whose value > `gt` means flow (else dimmed) */
    L.duct = (k, p, o) => {
      o = o || {};
      const c = C[k],
        w = o.w || (k === 'sol' ? 4 : 9),
        gg = S_('g', {});
      gg.append(S_('polyline', { points: p.map(q => q.join(',')).join(' '), fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-dasharray': k === 'sol' ? '7 5' : '' }));
      if (o.arrow !== false && p.length > 1) {
        const [a, b] = [p[p.length - 2], p[p.length - 1]],
          an = Math.atan2(b[1] - a[1], b[0] - a[0]),
          A = w + 7;
        gg.append(S_('polygon', { points: `${b[0] + Math.cos(an) * 4},${b[1] + Math.sin(an) * 4} ${b[0] - A * Math.cos(an - 0.5)},${b[1] - A * Math.sin(an - 0.5)} ${b[0] - A * Math.cos(an + 0.5)},${b[1] - A * Math.sin(an + 0.5)}`, fill: c }));
      }
      g.append(gg);
      if (o.on || o.onTag) api.reg({ t: 'val', tag: o.onTag || '', ref: o.on }, x => gg.setAttribute('opacity', !x || !isFinite(x.v) ? 1 : x.v > (o.gt != null ? o.gt : 0.5) ? 1 : 0.28), null);
      return gg;
    };
    L.box = (x, y, w, h, o) => {
      o = o || {};
      const r = S_('rect', { x, y, width: w, height: h, rx: o.rx != null ? o.rx : 4, fill: o.f || C.eq, stroke: o.s || C.eqs, 'stroke-width': o.sw || 1.5 });
      g.append(r);
      return r;
    };
    L.poly = (p, o) => {
      o = o || {};
      g.append(S_('polygon', { points: p.map(q => q.join(',')).join(' '), fill: o.f || C.eq, stroke: o.s || C.eqs, 'stroke-width': o.sw || 1.5 }));
    };
    /* a tube bank (heat exchanger section of the backpass): coil + name */
    L.coil = (x, y, w, h, name) => {
      L.box(x, y, w, h, { f: '#1c242c', rx: 2 });
      const n = Math.max(3, Math.floor(w / 12)),
        pts = [];
      for (let i = 0; i <= n; i++) pts.push([x + 6 + ((w - 12) * i) / n, i % 2 ? y + h - 6 : y + 6]);
      g.append(S_('polyline', { points: pts.map(q => q.join(',')).join(' '), fill: 'none', stroke: '#c9a26b', 'stroke-width': 1.6, opacity: 0.8 }));
      const t = L.text(x + w / 2, y + h / 2 + 5, name, { z: 12, b: 1, a: 'middle' });
      t.setAttribute('paint-order', 'stroke');
      t.setAttribute('stroke', '#1c242c');
      t.setAttribute('stroke-width', 4);
    };
    /* data tag: tag name (small, grey) over the value box (value + unit). Live from the simulation; no signal = "—" grey */
    L.tag = (x, y, tag, u, o) => {
      o = o || {};
      const w = o.w || 112,
        dp = o.dp != null ? o.dp : 1;
      if (tag && !o.notag) L.text(x, y - 3, o.label || tag, { z: 11, c: C.dim, mono: 1 });
      const r = S_('rect', { x, y, width: w, height: 19, rx: 2, fill: C.box, stroke: C.boxs, 'stroke-width': 1 });
      g.append(r);
      const v = L.text(x + w - 36, y + 14.5, '—', { z: 13.5, mono: 1, c: C.dim, a: 'end', b: 1 });
      L.text(x + w - 32, y + 14, u || '', { z: 10.5, c: C.dim });
      const it = { t: 'val', tag, ref: o.ref, v: '' };
      api.reg(
        it,
        X => {
          const ok = X && isFinite(X.v);
          v.textContent = ok ? fmt(X.v, dp) : '—';
          v.setAttribute('fill', ok ? C.val : C.dim);
          if (o.on) o.on(ok ? +X.v : null);
        },
        r
      );
      const ti = S_('title', {});
      ti.textContent = tag + (o.desc ? ' · ' + o.desc : '');
      r.append(ti);
      return it;
    };
    /* a value used only for a calculation on the screen (bed temperature average): registered, not drawn */
    L.hidden = (tag, on) => api.reg({ t: 'val', tag, v: '' }, X => on(X && isFinite(X.v) ? +X.v : null), null);
    /* a value calculated on the screen from live tags (not a DCS signal): drawn like a data tag, set by the caller */
    L.calc = (x, y, label, u, o) => {
      o = o || {};
      const w = o.w || 112,
        dp = o.dp != null ? o.dp : 1;
      L.text(x, y - 3, label, { z: 11, c: C.dim });
      g.append(S_('rect', { x, y, width: w, height: 19, rx: 2, fill: C.box, stroke: C.boxs, 'stroke-width': 1, 'stroke-dasharray': '3 2' }));
      const v = L.text(x + w - 36, y + 14.5, '—', { z: 13.5, mono: 1, c: C.dim, a: 'end', b: 1 });
      L.text(x + w - 32, y + 14, u || '', { z: 10.5, c: C.dim });
      return x2 => {
        v.textContent = x2 == null ? '—' : fmt(x2, dp);
        v.setAttribute('fill', x2 == null ? C.dim : C.val);
      };
    };
    /* centrifugal fan (ISA symbol: casing circle + tangential outlet), blades; run state colour */
    L.fan = (x, y, tag, name, o) => {
      o = o || {};
      const r = o.r || 22,
        dir = o.dir || 'right',
        gg = S_('g', {});
      const out = dir === 'up' ? `M${x},${y - r} L${x + r},${y - r} L${x + r},${y}` : `M${x},${y - r} L${x + r + 8},${y - r} L${x + r + 8},${y - r + 12}`;
      const ring = S_('circle', { cx: x, cy: y, r, fill: '#1a2128', stroke: C.none, 'stroke-width': 3 }),
        o2 = S_('path', { d: out, fill: 'none', stroke: C.none, 'stroke-width': 3 }),
        bl = S_('path', { d: `M${x - r * 0.55},${y + r * 0.35} L${x},${y - r * 0.6} L${x + r * 0.55},${y + r * 0.35} Z`, fill: C.none });
      gg.append(o2, ring, bl);
      g.append(gg);
      L.text(x, y + r + 15, name, { z: 12.5, b: 1, a: 'middle' });
      if (o.sub) L.text(x, y + r + 28, o.sub, { z: 10.5, c: C.dim, a: 'middle', mono: 1 });
      const it = { t: 'fan', tag };
      api.reg(
        it,
        X => {
          const c = !X || !isFinite(X.v) ? C.none : X.v > 0.5 ? C.run : C.stop;
          ring.setAttribute('stroke', c);
          o2.setAttribute('stroke', c);
          bl.setAttribute('fill', c);
          if (o.on) o.on(X && isFinite(X.v) ? X.v > 0.5 : null);
        },
        ring
      );
      const ti = S_('title', {});
      ti.textContent = name + ' · run state from the DCS logic';
      ring.append(ti);
      return it;
    };
    /* louvre damper on a duct: the blade turns with the opening (0 % across the duct, 100 % along it); colour = position (green
       closed, white between, red open); the value below. Click = the faceplate of its controller (fp) */
    L.damper = (x, y, tag, o) => {
      o = o || {};
      const vert = !!o.vert,
        gg = S_('g', { style: o.fp ? 'cursor:pointer' : '' });
      const frame = S_('rect', { x: x - 13, y: y - 13, width: 26, height: 26, rx: 3, fill: '#151b21', stroke: C.eqs, 'stroke-width': 1.2 }),
        blade = S_('line', { x1: x, y1: y - 11, x2: x, y2: y + 11, stroke: C.none, 'stroke-width': 4, 'stroke-linecap': 'round' }),
        pin = S_('circle', { cx: x, cy: y, r: 3, fill: '#0b0f13', stroke: C.none, 'stroke-width': 1.5 });
      gg.append(frame, blade, pin);
      g.append(gg);
      const lx = o.lx != null ? o.lx : x - 40,
        ly = o.ly != null ? o.ly : y + 30;
      L.text(lx, ly, tag, { z: 11, c: C.dim, mono: 1 });
      const vt = L.text(lx + (o.vw || 80), ly + 16, '—', { z: 13.5, mono: 1, b: 1, c: C.dim, a: 'end' });
      L.text(lx + (o.vw || 80) + 4, ly + 16, '%', { z: 10.5, c: C.dim });
      const it = { t: 'damper', tag, ref: o.ref, v: '' };
      api.reg(
        it,
        X => {
          const ok = X && isFinite(X.v),
            p = ok ? Math.max(0, Math.min(100, +X.v)) : 0,
            c = !ok ? C.none : p < 3 ? C.stop : p > 97 ? C.run : C.mid;
          /* blade: perpendicular to the flow when closed, along it when open */
          const base = vert ? 0 : Math.PI / 2,
            th = base - (p / 100) * (Math.PI / 2);
          blade.setAttribute('x1', x - 11 * Math.cos(th));
          blade.setAttribute('y1', y - 11 * Math.sin(th));
          blade.setAttribute('x2', x + 11 * Math.cos(th));
          blade.setAttribute('y2', y + 11 * Math.sin(th));
          blade.setAttribute('stroke', c);
          pin.setAttribute('stroke', c);
          vt.textContent = ok ? fmt(p, 1) : '—';
          vt.setAttribute('fill', ok ? C.val : C.dim);
        },
        null
      );
      if (o.fp) gg.addEventListener('click', e => (e.stopPropagation(), api.fp(o.fp)));
      const ti = S_('title', {});
      ti.textContent = tag + (o.desc ? ' · ' + o.desc : '') + (o.fp ? ' · click: faceplate of ' + o.fp : '');
      frame.append(ti);
      return it;
    };
    /* a status lamp: label + round lamp; `bad` = the value that is the abnormal state (MFT = 1) */
    L.lamp = (x, y, label, ref, o) => {
      o = o || {};
      const c0 = S_('circle', { cx: x, cy: y - 4, r: 6, fill: C.none, stroke: '#0b0f13', 'stroke-width': 1 });
      g.append(c0);
      const t = L.text(x + 12, y + 0.5, label, { z: 12.5 });
      api.reg(
        { t: o.fan ? 'fan' : 'val', tag: o.tag || '', ref, v: '' },
        X => {
          const ok = X && isFinite(X.v);
          const on = ok && X.v > 0.5;
          c0.setAttribute('fill', !ok ? C.none : o.alarm ? (on ? C.run : '#1f2a33') : on ? C.run : C.stop);
          t.textContent = label + (!ok ? ' — no signal' : o.alarm ? (on ? ' — TRIPPED' : ' — normal') : on ? ' — RUN' : ' — STOP');
          if (o.alarm) t.setAttribute('fill', ok && on ? C.run : C.tx);
        },
        null
      );
    };
    /* faceplate chip of a control loop: tag + mode, service, PV / SV, MV bar; click = full faceplate */
    L.loop = (x, y, w, tag, svc, u, o) => {
      o = o || {};
      const h = 70,
        gg = S_('g', { style: 'cursor:pointer' });
      const r = S_('rect', { x, y, width: w, height: h, rx: 4, fill: '#161d24', stroke: '#2f4456', 'stroke-width': 1.2 });
      gg.append(r);
      g.append(gg);
      const T = (xx, yy, s, oo) => {
        const t = L.text(xx, yy, s, oo);
        gg.append(t);
        return t;
      };
      T(x + 8, y + 16, tag, { z: 13, b: 1, mono: 1 });
      const mb = S_('rect', { x: x + w - 30, y: y + 4, width: 24, height: 17, rx: 2, fill: '#26303a' });
      gg.append(mb);
      const mt = T(x + w - 18, y + 17, '—', { z: 12, b: 1, a: 'middle', c: C.dim });
      T(x + 8, y + 30, svc, { z: 10.5, c: C.dim });
      const pv = T(x + 8, y + 47, 'PV —', { z: 12.5, mono: 1, c: C.dim }),
        sv = T(x + w - 8, y + 47, 'SV —', { z: 12.5, mono: 1, c: C.dim, a: 'end' });
      const bw = w - 60;
      gg.append(S_('rect', { x: x + 8, y: y + 55, width: bw, height: 8, fill: '#0a0e12', stroke: '#2c3946', 'stroke-width': 1 }));
      const bar = S_('rect', { x: x + 8, y: y + 55, width: 0, height: 8, fill: '#3f86c0' });
      gg.append(bar);
      const mv = T(x + w - 8, y + 63, 'MV —', { z: 11, mono: 1, c: C.dim, a: 'end' });
      const dp = o.dp != null ? o.dp : 1;
      const it = { t: 'ctl', tag };
      api.reg(
        it,
        X => {
          const ok = !!X;
          const m = ok ? X.m : '—';
          mt.textContent = m;
          mt.setAttribute('fill', !ok ? C.dim : m === 'M' ? '#1a1300' : '#05140c');
          mb.setAttribute('fill', !ok ? '#26303a' : m === 'M' ? C.man : m === 'R' ? '#7fc3ff' : C.auto);
          pv.textContent = 'PV ' + (ok ? fmt(X.pv, dp) : '—') + ' ' + u;
          sv.textContent = 'SV ' + (ok ? fmt(X.sv, dp) : '—');
          pv.setAttribute('fill', ok ? C.val : C.dim);
          sv.setAttribute('fill', ok ? '#ffe08a' : C.dim);
          const m0 = ok && isFinite(X.mv) ? Math.max(0, Math.min(100, X.mv)) : 0;
          bar.setAttribute('width', (bw * m0) / 100);
          mv.textContent = 'MV ' + (ok ? fmt(X.mv, 1) : '—');
          mv.setAttribute('fill', ok ? C.tx : C.dim);
        },
        r
      );
      const ti = S_('title', {});
      ti.textContent = tag + ' · ' + svc + ' · click: faceplate';
      r.append(ti);
      return it;
    };
    /* the process header of every screen (same signals as the control-room header bar) */
    L.header = (W, H) => {
      g.append(S_('rect', { x: 0, y: 0, width: W, height: H, fill: '#0b1015' }));
      g.append(S_('line', { x1: 0, y1: H, x2: W, y2: H, stroke: '#2a3a4a', 'stroke-width': 1 }));
      const K = [
        ['MSP', 'kg/cm²', 1],
        ['MST', '°C', 0],
        ['MSF', 'T/H', 1],
        ['RHP', 'kg/cm²', 1],
        ['RHT', '°C', 0],
        ['COAL', 'T/H', 1],
        ['PWR', 'MW', 1]
      ];
      const cw = W / K.length;
      K.forEach(([k, u, dp], i) => {
        const x0 = 14 + i * cw;
        L.text(x0, H / 2 + 6, k, { z: 14, b: 1, c: C.hdr });
        g.append(S_('rect', { x: x0 + 48, y: 7, width: 78, height: H - 14, rx: 3, fill: C.box, stroke: C.boxs }));
        const t = L.text(x0 + 120, H / 2 + 7, '—', { z: 17, mono: 1, b: 1, c: C.dim, a: 'end' });
        L.text(x0 + 131, H / 2 + 6, u, { z: 11, c: C.hdr });
        if (api.HDR[k])
          api.reg({ t: 'val', tag: k, ref: api.HDR[k], v: '' }, X => {
            const ok = X && isFinite(X.v);
            t.textContent = ok ? fmt(X.v, dp) : '—';
            t.setAttribute('fill', ok ? C.val : C.dim);
          }, null);
      });
    };
    L.C = C;
    return L;
  }
  /* ================= SCREEN: AIR & FLUE GAS (guide: snapshots 7.PNG 007, 8.PNG 008, 9.png 009, 38.PNG 038) =================
     Gas path: furnace -> cyclones A / B (solids back to the furnace through the seal pots, fluidized by the FA blowers) ->
     backpass (RH pass and SH pass, the RH / SH gas biasing dampers ABC-020, economizers) -> air preheater (gas side) -> ESP ->
     IDF (inlet vane PCD-FG1056-1 + hydraulic coupling, ABC-008 PICFG108 / PICFG108A) -> stack.
     Air path: SAF (inlet damper MCV-FA1054-1, ABC-007 FICFA1081) and PAF (MCV-FA1053-1, FICFA1071) -> air preheater (air side)
     -> hot SA to the furnace walls (front / rear wall dampers, 008) and hot PA to the plenum under the bed. O2 trim AICFG112 (ABC-002)
     sets the air. Run states: memory list M.3302 PAF / M.3303 SAF / M.3304 IDF / M.3308 FA-A / M.3309 FA-B; MFT M.0182 (ABC-007). */
  function airFlueGas(L, api) {
    const C = L.C;
    /* ---- furnace ---- */
    L.poly([[40, 70], [210, 70], [210, 452], [178, 512], [72, 512], [40, 452]], { f: '#2b2620', s: '#8a7a68' });
    L.poly([[72, 486], [178, 486], [178, 512], [72, 512]], { f: '#6b3f1c', s: '#8a7a68' });
    L.text(125, 504, 'BED', { z: 11, b: 1, a: 'middle', c: '#f0c090' });
    L.box(64, 520, 122, 26, { f: '#2a3036', rx: 2 });
    L.text(125, 538, 'AIR PLENUM', { z: 11, b: 1, a: 'middle', c: C.tx });
    L.text(125, 92, 'FURNACE', { z: 14, b: 1, a: 'middle', ls: 1 });
    L.text(52, 116, 'Furnace pressure', { z: 11, c: C.dim });
    L.tag(52, 126, 'PIFG1085', 'mmH2O', { w: 146, notag: 1, label: 'PIFG1085', desc: 'Furnace pressure (A)' });
    L.text(56, 140.5, 'A', { z: 11, c: C.dim, b: 1 });
    L.tag(52, 150, 'PIFG1086', 'mmH2O', { w: 146, notag: 1, desc: 'Furnace pressure (B)' });
    L.text(56, 164.5, 'B', { z: 11, c: C.dim, b: 1 });
    L.tag(52, 174, 'PIFG10871', 'mmH2O', { w: 146, notag: 1, desc: 'Furnace pressure (C)-1' });
    L.text(56, 188.5, 'C', { z: 11, c: C.dim, b: 1 });
    /* bed temperature: 18 thermocouples (TE-FG1091 A ~ I above, TE-FG1090 A ~ I under the lower layer, ABC-026 / 027): the screen
       shows the average and the spread, like FURNACE TOTAL TEMP AVERAGE of 007 */
    const TT = {},
      ids = 'ABCDEFGHI'.split('');
    const sAvg = L.calc(52, 250, 'Bed temp · average', '°C', { w: 146, dp: 0 }),
      sMax = L.calc(52, 290, 'Bed temp · max', '°C', { w: 146, dp: 0 }),
      sMin = L.calc(52, 330, 'Bed temp · min', '°C', { w: 146, dp: 0 });
    const calc = () => {
      const v = Object.values(TT).filter(x => x != null);
      sAvg(v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
      sMax(v.length ? Math.max(...v) : null);
      sMin(v.length ? Math.min(...v) : null);
    };
    for (const s of ['TIFG1091', 'TIFG1090']) for (const i of ids) L.hidden(s + i, x => ((TT[s + i] = x), calc()));
    L.text(52, 376, 'Bed DP (plenum / upper)', { z: 11, c: C.dim });
    L.tag(52, 386, 'DPIFG1081', 'mmH2O', { w: 146, dp: 0, notag: 1, desc: 'Furnace plenum / upper layer DP (A)' });
    L.text(56, 400.5, 'A', { z: 11, c: C.dim, b: 1 });
    L.tag(52, 410, 'DPIFG1082', 'mmH2O', { w: 146, dp: 0, notag: 1, desc: 'Furnace plenum / upper layer DP (B)' });
    L.text(56, 424.5, 'B', { z: 11, c: C.dim, b: 1 });
    /* ---- cyclones A / B, seal pots, FA blowers ---- */
    L.duct('gas', [[210, 98], [242, 98]], { on: 'ABC-008|M.3304' });
    L.poly([[242, 80], [322, 80], [322, 150], [292, 205], [272, 205], [242, 150]], { f: '#2b2a22', s: '#8a8662' });
    L.text(282, 118, 'CYCLONE', { z: 11.5, b: 1, a: 'middle' });
    L.text(282, 133, 'A / B', { z: 11.5, b: 1, a: 'middle' });
    L.box(276, 205, 12, 42, { f: '#2b2a22', s: '#8a8662', rx: 1 });
    L.box(250, 247, 64, 30, { f: '#2b2a22', s: '#8a8662' });
    L.text(282, 266, 'SEAL POT', { z: 10.5, b: 1, a: 'middle' });
    L.duct('sol', [[250, 262], [213, 262]]);
    L.text(214, 256, 'solids', { z: 10, c: C.dim });
    /* FA blowers under the seal pots (009) */
    L.duct('air', [[262, 318], [262, 300], [302, 300], [302, 318]], { arrow: false, w: 4 });
    L.duct('air', [[282, 300], [282, 279]], { w: 4, onTag: 'FIFA1055', gt: 1 });
    L.fan(262, 338, 'F-1055A FA BLOWER-A', 'A', { r: 13, dir: 'up' });
    L.fan(306, 338, 'F-1055B FA BLOWER-B', 'B', { r: 13, dir: 'up' });
    L.text(284, 380, 'FA BLOWERS', { z: 10.5, c: C.dim, a: 'middle' });
    L.tag(232, 398, 'FIFA1055', 'T/H', { w: 104, desc: 'FA blower outlet common air flow' });
    /* gas: cyclone outlet up and over to the backpass */
    L.duct('gas', [[282, 80], [282, 60], [372, 60], [372, 74]], { on: 'ABC-008|M.3304' });
    /* ---- backpass: RH pass (left) and SH pass (right), gas biasing dampers, economizers ---- */
    L.box(350, 74, 196, 330, { f: '#1f252b' });
    L.text(448, 92, 'BACKPASS', { z: 12, b: 1, a: 'middle', ls: 1 });
    L.text(399, 110, 'RH PASS', { z: 10.5, c: C.dim, a: 'middle' });
    L.text(497, 110, 'SH PASS', { z: 10.5, c: C.dim, a: 'middle' });
    L.coil(358, 116, 84, 74, 'REHEATER');
    L.coil(454, 116, 84, 74, 'FINISH SH');
    L.coil(454, 196, 84, 36, 'ECO #3');
    L.coil(358, 238, 84, 30, 'ECO #2R');
    L.coil(454, 238, 84, 30, 'ECO #2S');
    g_line(api, 448, 112, 448, 330);
    L.damper(400, 292, 'HICHR1002A', { ref: 'mv:HICHR1002A', fp: 'HICHR1002A', lx: 356, ly: 322, vw: 70, desc: 'RH gas biasing damper' });
    L.damper(496, 292, 'HICHR1002B', { ref: 'mv:HICHR1002B', fp: 'HICHR1002B', lx: 452, ly: 322, vw: 70, desc: 'SH gas biasing damper' });
    L.coil(358, 362, 180, 30, 'ECO #1');
    /* ---- gas to the air preheater, ESP, IDF, stack ---- */
    L.duct('gas', [[448, 404], [448, 424], [748, 424], [748, 452]], { on: 'ABC-008|M.3304' });
    L.tag(560, 378, 'AIFG1122', '%', { w: 92, desc: 'APH inlet flue gas O2 (A)' });
    L.tag(660, 378, 'AIFG1123', '%', { w: 92, desc: 'APH inlet flue gas O2 (B)' });
    L.text(560, 362, 'O2 at APH inlet', { z: 11, c: C.dim });
    /* air preheater (rotary regenerative): air side left (up), gas side right (down) */
    L.box(640, 452, 150, 150, { f: '#22302a', s: '#7fa08a' });
    g_line(api, 715, 452, 715, 602, '#7fa08a');
    L.text(677, 470, 'AIR', { z: 10.5, c: C.dim, a: 'middle' });
    L.text(752, 470, 'GAS', { z: 10.5, c: C.dim, a: 'middle' });
    L.text(715, 523, 'AIR', { z: 12.5, b: 1, a: 'middle' });
    L.text(715, 539, 'PREHEATER', { z: 12.5, b: 1, a: 'middle' });
    L.text(715, 556, 'H-1052', { z: 10.5, a: 'middle', c: C.dim, mono: 1 });
    L.duct('gas', [[752, 602], [752, 646], [878, 646]], { on: 'ABC-008|M.3304' });
    /* ESP */
    L.box(878, 616, 128, 60, { f: '#2a2a30', s: '#8f8fa0' });
    L.poly([[884, 676], [904, 676], [894, 692]], { f: '#2a2a30', s: '#8f8fa0' });
    L.poly([[932, 676], [952, 676], [942, 692]], { f: '#2a2a30', s: '#8f8fa0' });
    L.poly([[980, 676], [1000, 676], [990, 692]], { f: '#2a2a30', s: '#8f8fa0' });
    L.text(942, 642, 'ESP', { z: 12.5, b: 1, a: 'middle' });
    L.text(942, 658, 'Z-1010', { z: 10.5, a: 'middle', c: C.dim, mono: 1 });
    L.duct('gas', [[1006, 646], [1078, 646]], { arrow: false, on: 'ABC-008|M.3304' });
    L.damper(1040, 646, 'PCDFG10561', { ref: 'mv:PICFG108A', fp: 'PICFG108A', lx: 998, ly: 586, vw: 74, desc: 'IDF inlet vane control damper (PCD-FG1056-1)' });
    L.fan(1094, 646, 'F-1056 IDF', 'IDF  F-1056', { r: 20, dir: 'up' });
    L.duct('gas', [[1114, 626], [1114, 600], [1150, 600]], { on: 'ABC-008|M.3304' });
    L.text(1036, 702, 'Hydraulic coupling', { z: 11, c: C.dim });
    L.tag(1036, 712, 'ZT-LO1756', '%', { w: 100, notag: 1, ref: 'ABC-008|AI0482', desc: 'IDF hydraulic coupling scoop position (ZT-LO1756)' });
    /* stack */
    L.poly([[1150, 120], [1176, 120], [1184, 640], [1142, 640]], { f: '#2a3036' });
    L.text(1163, 108, 'STACK', { z: 12, b: 1, a: 'middle' });
    /* ---- air: SAF and PAF from the atmosphere through the inlet dampers to the air preheater ---- */
    const intake = (x, y) => {
      L.poly([[x - 16, y - 14], [x, y - 24], [x + 16, y - 14]], { f: 'none', s: C.dim });
      L.box(x - 13, y - 13, 26, 26, { f: '#151b21', s: C.dim, rx: 1 });
      for (let i = -8; i <= 8; i += 6) g_line(api, x - 9, y + i, x + 9, y + i - 3, C.dim);
    };
    intake(262, 660);
    L.text(262, 690, 'ATM.', { z: 10, c: C.dim, a: 'middle' });
    L.duct('air', [[276, 660], [438, 660]], { arrow: false, on: 'ABC-007|M.3303' });
    L.damper(332, 660, 'MCVFA10541', { ref: 'mv:FICFA1081', fp: 'FICFA1081', lx: 296, ly: 686, vw: 70, desc: 'SAF inlet flow control damper (MCV-FA1054-1)' });
    L.fan(462, 660, 'F-1054 SAF', 'SAF  F-1054', { r: 22 });
    L.duct('air', [[492, 638], [677, 638], [677, 602]], { on: 'ABC-007|M.3303' });
    L.tag(296, 612, 'FIFA1081', 'T/H', { w: 104, desc: 'SAF inlet air flow' });
    L.tag(520, 612, 'PIFA1085', 'mmH2O', { w: 116, dp: 0, desc: 'SAF outlet to APH air pressure' });
    intake(262, 748);
    L.text(262, 778, 'ATM.', { z: 10, c: C.dim, a: 'middle' });
    L.duct('air', [[276, 748], [438, 748]], { arrow: false, on: 'ABC-007|M.3302' });
    L.damper(332, 748, 'MCVFA10531', { ref: 'mv:FICFA1071', fp: 'FICFA1071', lx: 296, ly: 774, vw: 70, desc: 'PAF inlet flow control damper (MCV-FA1053-1)' });
    L.fan(462, 748, 'F-1053 PAF', 'PAF  F-1053', { r: 22 });
    L.duct('air', [[492, 726], [700, 726], [700, 602]], { on: 'ABC-007|M.3302' });
    L.tag(526, 742, 'FIFA1071', 'T/H', { w: 104, desc: 'PAF inlet air flow' });
    L.tag(408, 612, 'TIFA1082', '°C', { w: 70, dp: 0, desc: 'SAF inlet air temperature' });
    L.tag(150, 742, 'TIFA1072', '°C', { w: 74, dp: 0, desc: 'PAF inlet air temperature' });
    /* ---- hot air: SA to the furnace walls, PA to the plenum ---- */
    L.duct('hot', [[640, 482], [232, 482], [232, 430], [212, 430]], { on: 'ABC-007|M.3303' });
    L.text(236, 424, 'SA', { z: 11, b: 1, c: C.hot });
    L.tag(360, 456, 'PIFA1088', 'mmH2O', { w: 116, dp: 0, desc: 'APH outlet to furnace secondary air pressure' });
    L.tag(482, 456, 'TIFA1086', '°C', { w: 74, dp: 0, desc: 'APH outlet secondary air temp (A)' });
    L.tag(562, 456, 'TIFA1087', '°C', { w: 74, dp: 0, desc: 'APH outlet secondary air temp (B)' });
    L.text(250, 502, 'HOT SECONDARY AIR → front / rear wall dampers', { z: 10.5, c: C.dim });
    L.duct('hot', [[640, 576], [125, 576], [125, 549]], { on: 'ABC-007|M.3302' });
    L.text(140, 570, 'PA', { z: 11, b: 1, c: C.hot });
    L.tag(372, 550, 'FIFA1079', 'T/H', { w: 104, desc: 'APH outlet to furnace primary air flow' });
    L.tag(482, 550, 'TIFA1076', '°C', { w: 74, dp: 0, desc: 'APH outlet primary air temp (A)' });
    L.tag(562, 550, 'TIFA1077', '°C', { w: 74, dp: 0, desc: 'APH outlet primary air temp (B)' });
    L.text(250, 594, 'HOT PRIMARY AIR → plenum (fluidizing the bed)', { z: 10.5, c: C.dim });
    /* ---- summary and protection (top right) ---- */
    L.box(590, 70, 270, 186, { f: '#151c22', s: '#2f4456' });
    L.text(602, 90, 'AIR & DRAFT', { z: 12, b: 1, ls: 1 });
    L.tag(602, 112, 'PICFG108', 'mmH2O', { w: 120, ref: 'pv:PICFG108', label: 'Furnace pressure', desc: 'PV of PICFG108 (average of A / B / C)' });
    L.tag(730, 112, 'TAF', 'T/H', { w: 120, ref: 'ABC-006|SUM out', label: 'Total air flow', desc: 'TAF = PA + SA + FA measured (ABC-006 SUM)' });
    L.tag(602, 154, 'AICFG112', '%', { w: 120, ref: 'pv:AICFG112', label: 'O2 (APH inlet)', desc: 'PV of AICFG112 (O2 trim)' });
    L.tag(730, 154, 'FIC-CM', 'T/H', { w: 120, ref: 'pv:FIC-CM', label: 'Coal flow', desc: 'Coal master PV' });
    L.tag(602, 196, 'FIFA1071', 'T/H', { w: 120, ref: 'pv:FICFA1071', label: 'PA flow', desc: 'PV of FICFA1071' });
    L.tag(730, 196, 'FIFA1081', 'T/H', { w: 120, ref: 'pv:FICFA1081', label: 'SA flow', desc: 'PV of FICFA1081' });
    L.text(602, 240, 'Bed temperature: average of 18 thermocouples', { z: 10, c: C.dim });
    L.box(872, 70, 248, 186, { f: '#151c22', s: '#2f4456' });
    L.text(884, 90, 'PROTECTION · FANS', { z: 12, b: 1, ls: 1 });
    L.lamp(892, 116, 'MFT', 'ABC-007|M.0182', { alarm: 1 });
    L.lamp(892, 142, 'IDF', 'ABC-008|M.3304');
    L.lamp(892, 164, 'PAF', 'ABC-007|M.3302');
    L.lamp(892, 186, 'SAF', 'ABC-007|M.3303');
    L.lamp(892, 208, 'FA blower A', 'ABC-006|M.3308');
    L.lamp(892, 230, 'FA blower B', 'ABC-014|M.3309');
    /* ---- legend ---- */
    const lg = (x, k, s) => {
      L.duct(k, [[x, 778], [x + 26, 778]], { arrow: false, w: k === 'sol' ? 4 : 7 });
      L.text(x + 32, 782, s, { z: 10.5, c: C.dim });
    };
    lg(640, 'air', 'Cold air');
    lg(730, 'hot', 'Hot air');
    lg(818, 'gas', 'Flue gas');
    lg(908, 'sol', 'Solids');
    L.text(990, 782, '● red = running / open   ● green = stopped / closed   — = no DCS signal', { z: 10.5, c: C.dim });
    /* ---- control loops of this screen (faceplate chips) ---- */
    const X0 = 1206,
      W0 = 222;
    L.text(X0, 66, 'CONTROL LOOPS', { z: 11.5, b: 1, c: C.dim, ls: 1 });
    [
      ['PICFG108', 'Furnace pressure · IDF hydraulic coupling', 'mmH2O'],
      ['PICFG108A', 'Furnace pressure · IDF inlet vane', 'mmH2O'],
      ['AICFG112', 'O2 trim (air demand bias)', '%'],
      ['FICFA1071', 'Primary air flow · PAF inlet damper', 'T/H'],
      ['FICFA1081', 'Secondary air flow · SAF inlet damper', 'T/H'],
      ['FICFA1055A', 'FA blower A flow', 'T/H'],
      ['FICFA1055B', 'FA blower B flow', 'T/H'],
      ['HICHR1002A', 'RH gas biasing damper', '%'],
      ['HICHR1002B', 'SH gas biasing damper', '%']
    ].forEach(([t, s, u], i) => L.loop(X0, 76 + i * 78, W0, t, s, u));
  }
  /* a thin plain line (dividers, louvre slats) */
  let G = null;
  function g_line(api, x1, y1, x2, y2, c) {
    G.append(S_('line', { x1, y1, x2, y2, stroke: c || '#3a4652', 'stroke-width': 1.2 }));
  }
  const SCREENS = { AFG: airFlueGas };
  window.PLANT_V2 = {
    C,
    draw(g, sys, api) {
      G = g;
      const W = sys.w,
        H = sys.h;
      g.append(S_('rect', { x: 0, y: 0, width: W, height: H, fill: C.bg }));
      const L = lib(g, api);
      L.header(W, 40);
      (SCREENS[sys.screen] || (() => {}))(L, api);
    }
  };
  /* the new screens come first in the list of the Plant view; the old ones stay until the new set replaces them */
  window.PLANT_SYS = window.PLANT_SYS || [];
  window.PLANT_SYS.unshift({ id: 'AFG', title: 'AIR & FLUE GAS (new HMI)', src: '7.PNG', w: 1440, h: 792, v2: true, screen: 'AFG', items: [] });
})();
