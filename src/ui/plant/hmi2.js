/* NEW PLANT HMI (2026-10-26, roadmap step 6, sample): the plant screens REDRAWN with our own vector graphics (user 2026-10-26:
   "new HMI using your own graphics, guide lang ang snapshots"). The control-room snapshots (document-references/hmi-snapshot-
   sample.zip) are only the guide for the system: equipment, flow paths, instruments.
   Style (2nd pass, user 2026-10-27 "parang gawang bata"): a high-performance plant DCS graphic (ISA-101 / ISA 5.1 / ISO 10628):
   - neutral grey background, equipment as thin outlines on a light fill, no cartoon colours, no thick outlines;
   - ducts as thin double-line channels on an orthogonal grid, the medium only as a faint tint (air cool, hot air warm, flue gas
     brown) and a small flow arrow; a channel without flow turns blank (no tint, no arrow);
   - state colour only on the small status indicator of equipment (plant convention, OPERATING_POINTS.md: red = running / open,
     green = stopped / closed; grey = no signal); dampers show the blade at its opening;
   - every number is a data tag (small tag, white value box, unit), aligned; from the simulation (TAG.PV of an ABC sheet, AI of
     the I/O list transmitter, faceplate PV / SV / MV; plant.js resolve). No signal in the DCS logic = "-----", never a snapshot number;
   - the control loops of the screen as compact faceplates (tag bar, mode, PV, SV, MV bar); a click opens the full faceplate.
   plant.js draws a system with `v2: true` through PLANT_V2.draw (the old screens are not touched). */
(function () {
  const C = {
    bg: '#c8ccd0',
    pane: '#d3d7da',
    eq: '#e3e6e8',
    ln: '#4f565c',
    ln2: '#7d858c',
    tx: '#1d2125',
    dim: '#4f575e',
    val: '#0b0e11',
    box: '#f4f5f6',
    boxs: '#8a9198',
    none: '#9aa1a7',
    run: '#c62828',
    stop: '#2e7d32',
    open: '#c62828',
    shut: '#2e7d32',
    air: '#d0dbe6',
    hot: '#ecd9c4',
    gas: '#ddd3c6',
    blank: '#eceeef',
    man: '#f0c419',
    auto: '#ffffff',
    rem: '#9fd0ff',
    hdr: '#3a4046'
  };
  const NS = 'http://www.w3.org/2000/svg';
  const S_ = (t, a) => {
    const e = document.createElementNS(NS, t);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    return e;
  };
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  const UF = 'Arial, Helvetica, sans-serif';
  /* ---- the symbol library: every screen is made of these ---- */
  function lib(g, api) {
    const L = {};
    const add = (t, a, p) => {
      const e = S_(t, a);
      (p || g).append(e);
      return e;
    };
    L.add = add;
    L.text = (x, y, s, o) => {
      o = o || {};
      const t = add('text', { x, y, fill: o.c || C.tx, 'font-size': o.z || 11, 'font-family': o.mono ? 'Consolas, "Roboto Mono", monospace' : UF, 'font-weight': o.b ? 700 : 400, 'text-anchor': o.a || 'start', 'letter-spacing': o.ls || 0 }, o.p);
      t.textContent = s;
      return t;
    };
    L.line = (p, o) => {
      o = o || {};
      return add('polyline', { points: p.map(q => q.join(',')).join(' '), fill: 'none', stroke: o.c || C.ln, 'stroke-width': o.w || 1.2, 'stroke-dasharray': o.dash || '', 'stroke-linejoin': 'miter' }, o.p);
    };
    L.rect = (x, y, w, h, o) => {
      o = o || {};
      return add('rect', { x, y, width: w, height: h, rx: o.rx || 0, fill: o.f || C.eq, stroke: o.s || C.ln, 'stroke-width': o.sw || 1.2 }, o.p);
    };
    L.poly = (p, o) => {
      o = o || {};
      return add('polygon', { points: p.map(q => q.join(',')).join(' '), fill: o.f || C.eq, stroke: o.s || C.ln, 'stroke-width': o.sw || 1.2 }, o.p);
    };
    /* a duct: thin double-line channel (outline + light fill of its medium), orthogonal points; a small arrow at the end.
       `on` / `onTag` = the signal that says there is flow (fan running): without flow the channel is blank and has no arrow */
    L.duct = (k, p, o) => {
      o = o || {};
      const w = o.w || 10,
        gg = add('g', {});
      const pts = p.map(q => q.join(',')).join(' ');
      add('polyline', { points: pts, fill: 'none', stroke: C.ln, 'stroke-width': w + 2.4, 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt' }, gg);
      const body = add('polyline', { points: pts, fill: 'none', stroke: C[k], 'stroke-width': w, 'stroke-linejoin': 'miter', 'stroke-linecap': o.cap || 'square' }, gg);
      let ar = null;
      if (o.arrow !== false && p.length > 1) {
        const [a, b] = [p[p.length - 2], p[p.length - 1]],
          an = Math.atan2(b[1] - a[1], b[0] - a[0]),
          tx = b[0] - Math.cos(an) * 9,
          ty = b[1] - Math.sin(an) * 9,
          A = Math.min(7, w * 0.65);
        ar = add('polygon', { points: `${tx + A * Math.cos(an)},${ty + A * Math.sin(an)} ${tx - A * Math.cos(an - 1.1)},${ty - A * Math.sin(an - 1.1)} ${tx - A * Math.cos(an + 1.1)},${ty - A * Math.sin(an + 1.1)}`, fill: C.ln }, gg);
      }
      if (o.on || o.onTag)
        api.reg({ t: 'val', tag: o.onTag || '', ref: o.on }, x => {
          const flow = !x || !isFinite(x.v) ? true : x.v > (o.gt != null ? o.gt : 0.5);
          body.setAttribute('stroke', flow ? C[k] : C.blank);
          if (ar) ar.setAttribute('visibility', flow ? 'visible' : 'hidden');
        }, null);
      return gg;
    };
    /* a thin solids line (cyclone return through the loop seal) */
    L.solids = p => L.line(p, { c: C.ln2, w: 1.4, dash: '5 3' });
    /* tube bank of the backpass: thin serpentine tubes in an outline box, the name outside on the left */
    L.bank = (x, y, w, h, name) => {
      L.rect(x, y, w, h, { f: '#e8e9ea', sw: 1 });
      const n = Math.max(2, Math.floor((h - 6) / 7));
      const d = [];
      for (let i = 0; i < n; i++) {
        const yy = y + 5 + i * ((h - 10) / Math.max(1, n - 1));
        d.push(`M${x + 6},${yy} H${x + w - 6}`);
      }
      add('path', { d: d.join(' '), stroke: '#8c7a62', 'stroke-width': 1, fill: 'none' });
      for (let i = 0; i < n - 1; i++) {
        const y1 = y + 5 + i * ((h - 10) / Math.max(1, n - 1)),
          y2 = y + 5 + (i + 1) * ((h - 10) / Math.max(1, n - 1)),
          right = i % 2 === 0,
          xx = right ? x + w - 6 : x + 6;
        add('path', { d: `M${xx},${y1} A${(y2 - y1) / 2},${(y2 - y1) / 2} 0 0 ${right ? 1 : 0} ${xx},${y2}`, stroke: '#8c7a62', 'stroke-width': 1, fill: 'none' });
      }
      L.text(x + w / 2, y + h / 2 + 4, name, { z: 10.5, b: 1, a: 'middle', c: C.tx }).setAttribute('style', 'paint-order:stroke;stroke:#e8e9ea;stroke-width:7px');
    };
    /* data tag: tag (small) over a white value box, unit at the right of the box. No DCS signal = "-----" grey */
    L.tag = (x, y, tag, u, o) => {
      o = o || {};
      const w = o.w || 62,
        dp = o.dp != null ? o.dp : 1;
      if (!o.notag) L.text(x, y - 3, o.label || tag, { z: 10, c: C.dim });
      const r = L.rect(x, y, w, 17, { f: C.box, s: C.boxs, sw: 1 });
      const v = L.text(x + w - 4, y + 12.8, '-----', { z: 12, mono: 1, b: 1, c: C.none, a: 'end' });
      if (u) L.text(x + w + 3, y + 12.5, u, { z: 10, c: C.dim });
      const it = { t: 'val', tag, ref: o.ref, v: '' };
      api.reg(
        it,
        X => {
          const ok = X && isFinite(X.v);
          v.textContent = ok ? fmt(X.v, dp) : '-----';
          v.setAttribute('fill', ok ? C.val : C.none);
        },
        r
      );
      add('title', {}, r).textContent = tag + (o.desc ? ' · ' + o.desc : '');
      return it;
    };
    /* a value used only for a calculation on the screen (bed temperature average): registered, not drawn */
    L.hidden = (tag, on) => api.reg({ t: 'val', tag, v: '' }, X => on(X && isFinite(X.v) ? +X.v : null), null);
    /* a value calculated on the screen from live tags (not a DCS signal): same box, set by the caller */
    L.calc = (x, y, label, u, o) => {
      o = o || {};
      const w = o.w || 62,
        dp = o.dp != null ? o.dp : 1;
      L.text(x, y - 3, label, { z: 10, c: C.dim });
      L.rect(x, y, w, 17, { f: C.box, s: C.boxs, sw: 1 });
      const v = L.text(x + w - 4, y + 12.8, '-----', { z: 12, mono: 1, b: 1, c: C.none, a: 'end' });
      if (u) L.text(x + w + 3, y + 12.5, u, { z: 10, c: C.dim });
      return x2 => {
        v.textContent = x2 == null ? '-----' : fmt(x2, dp);
        v.setAttribute('fill', x2 == null ? C.none : C.val);
      };
    };
    /* status indicator of a motor (small square: red run, green stop, grey no signal) */
    const ind = (x, y) => L.rect(x - 5, y - 5, 10, 10, { f: C.none, s: C.ln, sw: 1 });
    /* centrifugal fan (ISO 10628): casing circle with a tangential outlet, motor M on the shaft, run indicator */
    L.fan = (x, y, tag, name, o) => {
      o = o || {};
      const r = o.r || 16,
        up = o.dir === 'up';
      const gg = add('g', {});
      if (up) add('path', { d: `M${x},${y - r} H${x + r} V${y - 2}`, fill: C.eq, stroke: C.ln, 'stroke-width': 1.2 }, gg);
      else add('path', { d: `M${x},${y - r} H${x + r + 6} V${y - r + 10} H${x + r * 0.85}`, fill: C.eq, stroke: C.ln, 'stroke-width': 1.2 }, gg);
      const ring = add('circle', { cx: x, cy: y, r, fill: C.eq, stroke: C.ln, 'stroke-width': 1.2 }, gg);
      add('circle', { cx: x, cy: y, r: r * 0.28, fill: 'none', stroke: C.ln, 'stroke-width': 1 }, gg);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        add('line', { x1: x + r * 0.28 * Math.cos(a), y1: y + r * 0.28 * Math.sin(a), x2: x + r * 0.78 * Math.cos(a + 0.5), y2: y + r * 0.78 * Math.sin(a + 0.5), stroke: C.ln, 'stroke-width': 1 }, gg);
      }
      if (!o.nomotor) {
        add('line', { x1: x, y1: y + r, x2: x, y2: y + r + 6, stroke: C.ln, 'stroke-width': 1.2 }, gg);
        L.rect(x - 9, y + r + 6, 18, 13, { p: gg, sw: 1.1 });
        L.text(x, y + r + 16, 'M', { z: 9.5, b: 1, a: 'middle', p: gg });
      }
      const s = ind(x + r + 4, y + r + 2);
      L.text(o.lx != null ? o.lx : x, o.ly != null ? o.ly : y + r + (o.nomotor ? 14 : 32), name, { z: 11, b: 1, a: o.la || 'middle' });
      const it = { t: 'fan', tag };
      api.reg(
        it,
        X => {
          const ok = X && isFinite(X.v);
          s.setAttribute('fill', !ok ? C.none : X.v > 0.5 ? C.run : C.stop);
        },
        ring
      );
      add('title', {}, ring).textContent = name + ' · run state from the DCS logic (red = running, green = stopped)';
      return it;
    };
    /* damper (ISA 5.1): blade with pivot inside the duct, motor actuator on top; the blade turns with the opening, the
       pivot shows the position colour (green closed, red full open); the value box next to it. Click = its controller */
    L.damper = (x, y, tag, o) => {
      o = o || {};
      const vert = !!o.vert,
        gg = add('g', { style: o.fp ? 'cursor:pointer' : '' });
      const hit = add('rect', { x: x - 10, y: y - 26, width: 20, height: 38, fill: '#000', 'fill-opacity': 0 }, gg);
      const blade = add('line', { x1: x, y1: y - 6, x2: x, y2: y + 6, stroke: C.tx, 'stroke-width': 2 }, gg);
      const pin = add('circle', { cx: x, cy: y, r: 2.6, fill: C.none, stroke: C.tx, 'stroke-width': 1 }, gg);
      if (vert) {
        add('line', { x1: x - 7, y1: y, x2: x - 15, y2: y, stroke: C.ln, 'stroke-width': 1.1 }, gg);
        L.rect(x - 27, y - 6, 12, 12, { p: gg, sw: 1.1 });
        L.text(x - 21, y + 3.5, 'M', { z: 8.5, b: 1, a: 'middle', p: gg });
      } else {
        add('line', { x1: x, y1: y - 7, x2: x, y2: y - 14, stroke: C.ln, 'stroke-width': 1.1 }, gg);
        L.rect(x - 6, y - 26, 12, 12, { p: gg, sw: 1.1 });
        L.text(x, y - 16.5, 'M', { z: 8.5, b: 1, a: 'middle', p: gg });
      }
      const lx = o.lx != null ? o.lx : x + 12,
        ly = o.ly != null ? o.ly : y - 22;
      L.text(lx, ly - 3, tag, { z: 10, c: C.dim });
      L.rect(lx, ly, 50, 17, { f: C.box, s: C.boxs, sw: 1 });
      const vt = L.text(lx + 46, ly + 12.8, '-----', { z: 12, mono: 1, b: 1, c: C.none, a: 'end' });
      L.text(lx + 53, ly + 12.5, '%', { z: 10, c: C.dim });
      const it = { t: 'damper', tag, ref: o.ref, v: '' };
      api.reg(
        it,
        X => {
          const ok = X && isFinite(X.v),
            p = ok ? Math.max(0, Math.min(100, +X.v)) : 0;
          /* blade across the duct when closed, along it when open */
          const th = (vert ? 0 : Math.PI / 2) - (p / 100) * (Math.PI / 2),
            R = 6.5;
          blade.setAttribute('x1', x - R * Math.cos(th));
          blade.setAttribute('y1', y - R * Math.sin(th));
          blade.setAttribute('x2', x + R * Math.cos(th));
          blade.setAttribute('y2', y + R * Math.sin(th));
          pin.setAttribute('fill', !ok ? C.none : p < 3 ? C.shut : p > 97 ? C.open : '#ffffff');
          vt.textContent = ok ? fmt(p, 1) : '-----';
          vt.setAttribute('fill', ok ? C.val : C.none);
        },
        null
      );
      if (o.fp) gg.addEventListener('click', e => (e.stopPropagation(), api.fp(o.fp)));
      add('title', {}, hit).textContent = tag + (o.desc ? ' · ' + o.desc : '') + (o.fp ? ' · click: faceplate of ' + o.fp : '');
      return it;
    };
    /* status row: label and a state word in a small box (RUN red / STOP green; MFT: TRIP red / NORMAL) */
    L.status = (x, y, label, ref, o) => {
      o = o || {};
      L.text(x, y + 12, label, { z: 11 });
      const r = L.rect(x + 108, y, 62, 17, { f: C.box, s: C.boxs, sw: 1 });
      const t = L.text(x + 139, y + 12.5, '-----', { z: 10.5, b: 1, a: 'middle', c: C.none });
      api.reg(
        { t: 'val', tag: '', ref, v: '' },
        X => {
          const ok = X && isFinite(X.v),
            on = ok && X.v > 0.5;
          t.textContent = !ok ? '-----' : o.alarm ? (on ? 'TRIP' : 'NORMAL') : on ? 'RUN' : 'STOP';
          t.setAttribute('fill', !ok ? C.none : o.alarm ? (on ? '#ffffff' : C.tx) : '#ffffff');
          r.setAttribute('fill', !ok ? C.box : o.alarm ? (on ? C.run : C.box) : on ? C.run : C.stop);
        },
        null
      );
    };
    /* faceplate of a control loop (DCS style): dark tag bar with the mode, PV / SV rows, MV bar; click = full faceplate */
    L.loop = (x, y, w, tag, svc, u, o) => {
      o = o || {};
      const h = 64,
        gg = add('g', { style: 'cursor:pointer' });
      const r = L.rect(x, y, w, h, { f: C.pane, s: C.ln2, sw: 1, p: gg });
      L.rect(x, y, w, 17, { f: C.hdr, s: C.hdr, sw: 1, p: gg });
      L.text(x + 6, y + 12.5, tag, { z: 11, b: 1, c: '#ffffff', p: gg });
      const mb = L.rect(x + w - 22, y + 2, 19, 13, { f: '#5b6168', s: '#20252a', sw: 1, p: gg });
      const mt = L.text(x + w - 12.5, y + 12.5, '-', { z: 10, b: 1, a: 'middle', c: '#ffffff', p: gg });
      L.text(x + 6, y + 29, svc, { z: 9.5, c: C.dim, p: gg });
      const box = (bx, k) => {
        L.text(bx - 20, y + 45.5, k, { z: 10, b: 1, c: C.dim, p: gg });
        L.rect(bx, y + 34, 66, 15, { f: C.box, s: C.boxs, sw: 1, p: gg });
        return L.text(bx + 62, y + 45.5, '-----', { z: 11, mono: 1, b: 1, a: 'end', c: C.none, p: gg });
      };
      const pv = box(x + 26, 'PV'),
        sv = box(x + 118, 'SV'),
        mvT = L.text(x + 190, y + 45.5, '', { z: 10, c: C.dim, p: gg });
      L.text(x + 6, y + 60, 'MV', { z: 10, b: 1, c: C.dim, p: gg });
      const bw = w - 72;
      L.rect(x + 26, y + 53, bw, 7, { f: C.box, s: C.boxs, sw: 1, p: gg });
      const bar = L.rect(x + 26, y + 53, 0, 7, { f: '#5a6b7b', s: 'none', sw: 0, p: gg });
      const mv = L.text(x + w - 6, y + 60.5, '-----', { z: 10.5, mono: 1, b: 1, a: 'end', c: C.none, p: gg });
      mvT.textContent = u;
      const dp = o.dp != null ? o.dp : 1;
      api.reg(
        { t: 'ctl', tag },
        X => {
          const ok = !!X,
            m = ok ? X.m : '-';
          mt.textContent = m;
          mb.setAttribute('fill', !ok ? '#5b6168' : m === 'M' ? C.man : m === 'R' ? C.rem : C.auto);
          mt.setAttribute('fill', !ok ? '#ffffff' : '#111111');
          pv.textContent = ok ? fmt(X.pv, dp) : '-----';
          sv.textContent = ok ? fmt(X.sv, dp) : '-----';
          pv.setAttribute('fill', ok ? C.val : C.none);
          sv.setAttribute('fill', ok ? C.val : C.none);
          const m0 = ok && isFinite(X.mv) ? Math.max(0, Math.min(100, X.mv)) : 0;
          bar.setAttribute('width', (bw * m0) / 100);
          mv.textContent = ok ? fmt(X.mv, 1) + '%' : '-----';
          mv.setAttribute('fill', ok ? C.val : C.none);
        },
        r
      );
      add('title', {}, r).textContent = tag + ' · ' + svc + ' · click: faceplate';
    };
    /* the process header of every screen (same signals as the control-room header bar) */
    L.header = (W, H) => {
      add('rect', { x: 0, y: 0, width: W, height: H, fill: C.hdr });
      const K = [
        ['MSP', 'kg/cm²', 1],
        ['MST', '°C', 0],
        ['MSF', 'T/H', 1],
        ['RHP', 'kg/cm²', 1],
        ['RHT', '°C', 0],
        ['COAL', 'T/H', 1],
        ['PWR', 'MW', 1]
      ];
      const cw = (W - 20) / K.length;
      K.forEach(([k, u, dp], i) => {
        const x0 = 14 + i * cw;
        L.text(x0, H / 2 + 5, k, { z: 12, b: 1, c: '#e6e9ec' });
        add('rect', { x: x0 + 44, y: 6, width: 74, height: H - 12, fill: '#f4f5f6', stroke: '#1f2428', 'stroke-width': 1 });
        const t = L.text(x0 + 114, H / 2 + 6, '-----', { z: 14, mono: 1, b: 1, c: C.none, a: 'end' });
        L.text(x0 + 123, H / 2 + 5, u, { z: 10.5, c: '#c9ced3' });
        if (api.HDR[k])
          api.reg({ t: 'val', tag: k, ref: api.HDR[k], v: '' }, X => {
            const ok = X && isFinite(X.v);
            t.textContent = ok ? fmt(X.v, dp) : '-----';
            t.setAttribute('fill', ok ? C.val : C.none);
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
     sets the air. Run states: memory list M.3302 PAF / M.3303 SAF / M.3304 IDF / M.3308 FA-A / M.3309 FA-B; MFT M.0182 (ABC-007).
     Grid: 10 px; gas band y 60..460, air band y 560..760; drawing x 20..1180, faceplates x 1196..1430. */
  function airFlueGas(L, api) {
    const C = L.C,
      IDF = 'ABC-008|M.3304',
      PAF = 'ABC-007|M.3302',
      SAF = 'ABC-007|M.3303';
    /* ---- furnace: water walls, refractory lower furnace, bed, plenum with nozzles ---- */
    L.poly([[40, 70], [220, 70], [220, 430], [190, 490], [70, 490], [40, 430]], { f: '#e6e3df' });
    for (const xx of [46, 52, 208, 214]) L.line([[xx, 74], [xx, 428]], { c: '#9a9fa4', w: 0.8 });
    L.poly([[44, 430], [216, 430], [188, 486], [72, 486]], { f: '#d9d2c8', s: '#9a9fa4', sw: 0.8 });
    L.rect(72, 470, 116, 16, { f: '#cdb89b', s: C.ln, sw: 1 });
    L.text(130, 482, 'BED', { z: 10, b: 1, a: 'middle' });
    L.rect(70, 496, 120, 22, { f: C.eq });
    for (let xx = 80; xx <= 180; xx += 10) L.line([[xx, 490], [xx, 496]], { c: C.ln, w: 1 });
    L.text(130, 511, 'PLENUM', { z: 10, b: 1, a: 'middle' });
    L.text(130, 90, 'FURNACE', { z: 12, b: 1, a: 'middle', ls: 1 });
    L.text(64, 110, 'FURNACE PRESSURE', { z: 10, b: 1, c: C.dim });
    L.tag(80, 116, 'PIFG1085', 'mmH2O', { notag: 1, desc: 'Furnace pressure (A)' });
    L.tag(80, 137, 'PIFG1086', 'mmH2O', { notag: 1, desc: 'Furnace pressure (B)' });
    L.tag(80, 158, 'PIFG10871', 'mmH2O', { notag: 1, desc: 'Furnace pressure (C)-1' });
    for (const [s, yy] of [['A', 128.5], ['B', 149.5], ['C', 170.5]]) L.text(66, yy, s, { z: 10, b: 1, c: C.dim });
    /* bed temperature: 18 thermocouples (TE-FG1091 A ~ I above, TE-FG1090 A ~ I under the lower layer, ABC-026 / 027): the screen
       shows the average and the spread, like FURNACE TOTAL TEMP AVERAGE of 007 */
    L.text(64, 204, 'BED TEMPERATURE (18 TE)', { z: 10, b: 1, c: C.dim });
    const TT = {},
      ids = 'ABCDEFGHI'.split('');
    const sAvg = L.calc(96, 218, '', '°C', { dp: 0 }),
      sMax = L.calc(96, 239, '', '°C', { dp: 0 }),
      sMin = L.calc(96, 260, '', '°C', { dp: 0 });
    for (const [s, yy] of [['AVG', 230.5], ['MAX', 251.5], ['MIN', 272.5]]) L.text(66, yy, s, { z: 10, b: 1, c: C.dim });
    const calc = () => {
      const v = Object.values(TT).filter(x => x != null);
      sAvg(v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
      sMax(v.length ? Math.max(...v) : null);
      sMin(v.length ? Math.min(...v) : null);
    };
    for (const s of ['TIFG1091', 'TIFG1090']) for (const i of ids) L.hidden(s + i, x => ((TT[s + i] = x), calc()));
    L.text(64, 306, 'BED DP (PLENUM-UPPER)', { z: 10, b: 1, c: C.dim });
    L.tag(80, 312, 'DPIFG1081', 'mmH2O', { notag: 1, dp: 0, desc: 'Furnace plenum / upper layer DP (A)' });
    L.tag(80, 333, 'DPIFG1082', 'mmH2O', { notag: 1, dp: 0, desc: 'Furnace plenum / upper layer DP (B)' });
    for (const [s, yy] of [['A', 324.5], ['B', 345.5]]) L.text(66, yy, s, { z: 10, b: 1, c: C.dim });
    /* ---- cyclone A / B with the seal pot (loop seal) and the FA blowers ---- */
    L.duct('gas', [[220, 100], [250, 100]], { arrow: false, on: IDF });
    L.poly([[250, 84], [320, 84], [320, 150], [294, 196], [276, 196], [250, 150]], { f: C.eq });
    L.line([[278, 84], [278, 112]], { c: C.ln2, w: 1 });
    L.line([[292, 84], [292, 112]], { c: C.ln2, w: 1 });
    L.text(285, 132, 'CYCLONE', { z: 10, b: 1, a: 'middle' });
    L.text(285, 145, 'A / B', { z: 10, b: 1, a: 'middle' });
    L.rect(280, 196, 10, 40, { f: C.eq });
    L.rect(260, 236, 50, 28, { f: C.eq });
    L.text(285, 253, 'SEAL POT', { z: 9, b: 1, a: 'middle' });
    L.solids([[260, 250], [222, 250]]);
    L.add('polygon', { points: '222,250 229,246 229,254', fill: C.ln2 });
    L.text(226, 244, 'SOLIDS', { z: 8.5, c: C.dim });
    /* FA blowers A / B to the seal pot (009) */
    L.duct('air', [[262, 314], [262, 292], [308, 292], [308, 314]], { w: 5, arrow: false, cap: 'butt' });
    L.duct('air', [[285, 292], [285, 264]], { w: 5, onTag: 'FIFA1055', gt: 1 });
    L.fan(262, 330, 'F-1055A FA BLOWER-A', 'FAB-A', { r: 11, dir: 'up', nomotor: 1, ly: 356 });
    L.fan(308, 330, 'F-1055B FA BLOWER-B', 'FAB-B', { r: 11, dir: 'up', nomotor: 1, ly: 356 });
    L.tag(252, 376, 'FIFA1055', 'T/H', { desc: 'FA blower outlet common air flow' });
    /* gas: cyclone outlet up and over to the backpass */
    L.duct('gas', [[285, 84], [285, 62], [390, 62], [390, 78]], { on: IDF });
    /* ---- backpass: RH pass (left) and SH pass (right), gas biasing dampers, economizers ---- */
    L.rect(360, 78, 200, 330, { f: '#e9eaeb' });
    L.line([[460, 98], [460, 326]], { c: C.ln2, w: 1 });
    L.text(460, 92, 'BACKPASS', { z: 11, b: 1, a: 'middle', ls: 1 });
    L.text(410, 108, 'RH PASS', { z: 9.5, c: C.dim, a: 'middle' });
    L.text(510, 108, 'SH PASS', { z: 9.5, c: C.dim, a: 'middle' });
    L.bank(370, 114, 80, 80, 'REHEATER');
    L.bank(470, 114, 80, 80, 'FINISH SH');
    L.bank(470, 200, 80, 36, 'ECO #3');
    L.bank(370, 242, 80, 30, 'ECO #2R');
    L.bank(470, 242, 80, 30, 'ECO #2S');
    L.damper(410, 300, 'HICHR1002A', { ref: 'mv:HICHR1002A', fp: 'HICHR1002A', lx: 372, ly: 322, desc: 'RH gas biasing damper' });
    L.damper(510, 300, 'HICHR1002B', { ref: 'mv:HICHR1002B', fp: 'HICHR1002B', lx: 472, ly: 322, desc: 'SH gas biasing damper' });
    L.bank(370, 366, 180, 32, 'ECO #1');
    /* ---- gas to the air preheater, ESP, IDF, stack ---- */
    L.duct('gas', [[460, 408], [460, 430], [760, 430], [760, 462]], { on: IDF });
    L.text(582, 392, 'O2 APH INLET', { z: 10, b: 1, c: C.dim });
    L.tag(582, 404, 'AIFG1122', '%', { notag: 1, desc: 'APH inlet flue gas O2 (A)' });
    L.tag(672, 404, 'AIFG1123', '%', { notag: 1, desc: 'APH inlet flue gas O2 (B)' });
    L.text(572, 416, 'A', { z: 10, b: 1, c: C.dim });
    L.text(662, 416, 'B', { z: 10, b: 1, c: C.dim });
    /* air preheater (rotary regenerative): housing, rotor, air side left (air up), gas side right (gas down) */
    L.rect(650, 462, 140, 130, { f: C.eq });
    L.line([[720, 462], [720, 546]], { c: C.ln, w: 1 });
    L.add('ellipse', { cx: 720, cy: 527, rx: 52, ry: 14, fill: 'none', stroke: C.ln2, 'stroke-width': 1 });
    L.line([[668, 527], [772, 527]], { c: C.ln2, w: 0.8 });
    L.text(685, 480, 'AIR', { z: 9.5, c: C.dim, a: 'middle' });
    L.text(755, 480, 'GAS', { z: 9.5, c: C.dim, a: 'middle' });
    L.text(720, 560, 'AIR PREHEATER', { z: 10.5, b: 1, a: 'middle' });
    L.text(720, 574, 'H-1052', { z: 9.5, a: 'middle', c: C.dim });
    L.duct('gas', [[760, 592], [760, 640], [880, 640]], { on: IDF });
    /* ESP: three fields, hoppers */
    L.rect(880, 610, 130, 60, { f: C.eq });
    for (const xx of [923, 967]) L.line([[xx, 610], [xx, 670]], { c: C.ln2, w: 1 });
    for (const xx of [884, 927, 971]) L.poly([[xx, 670], [xx + 34, 670], [xx + 22, 688], [xx + 12, 688]], { f: C.eq, sw: 1 });
    L.text(945, 636, 'ESP', { z: 11, b: 1, a: 'middle' });
    L.text(945, 650, 'Z-1010', { z: 9.5, a: 'middle', c: C.dim });
    L.duct('gas', [[1010, 640], [1080, 640]], { arrow: false, on: IDF });
    L.damper(1044, 640, 'PCDFG10561', { ref: 'mv:PICFG108A', fp: 'PICFG108A', lx: 990, ly: 588, desc: 'IDF inlet vane control damper (PCD-FG1056-1)' });
    L.fan(1100, 640, 'F-1056 IDF', 'IDF F-1056', { r: 18, dir: 'up' });
    L.duct('gas', [[1118, 626], [1118, 600], [1150, 600]], { on: IDF });
    L.text(1058, 712, 'HYD. COUPLING', { z: 10, b: 1, c: C.dim });
    L.tag(1058, 718, 'ZT-LO1756', '%', { notag: 1, ref: 'ABC-008|AI0482', desc: 'IDF hydraulic coupling scoop position (ZT-LO1756)' });
    /* stack */
    L.poly([[1152, 120], [1172, 120], [1180, 640], [1144, 640]], { f: C.eq });
    L.text(1162, 110, 'STACK', { z: 10.5, b: 1, a: 'middle' });
    /* ---- air: SAF and PAF from the atmosphere through the inlet dampers to the air preheater ---- */
    const intake = (x, y, name) => {
      L.rect(x - 12, y - 12, 18, 24, { f: C.eq, sw: 1.1 });
      for (let i = -7; i <= 7; i += 5) L.line([[x - 10, y + i + 2], [x + 4, y + i - 2]], { c: C.ln2, w: 0.9 });
      L.text(x - 3, y + 26, name, { z: 9.5, c: C.dim, a: 'middle' });
    };
    intake(270, 660, 'ATM');
    L.duct('air', [[276, 660], [444, 660]], { arrow: false, on: SAF });
    L.damper(340, 660, 'MCVFA10541', { ref: 'mv:FICFA1081', fp: 'FICFA1081', lx: 352, ly: 682, desc: 'SAF inlet flow control damper (MCV-FA1054-1)' });
    L.fan(462, 660, 'F-1054 SAF', 'SAF F-1054', { r: 18 });
    L.duct('air', [[486, 642], [690, 642], [690, 596]], { on: SAF });
    L.tag(296, 610, 'FIFA1081', 'T/H', { desc: 'SAF inlet air flow' });
    L.tag(390, 610, 'TIFA1082', '°C', { w: 46, dp: 0, desc: 'SAF inlet air temperature' });
    L.tag(530, 610, 'PIFA1085', 'mmH2O', { dp: 0, desc: 'SAF outlet to APH air pressure' });
    intake(270, 740, 'ATM');
    L.duct('air', [[276, 740], [444, 740]], { arrow: false, on: PAF });
    L.damper(340, 740, 'MCVFA10531', { ref: 'mv:FICFA1071', fp: 'FICFA1071', lx: 352, ly: 762, desc: 'PAF inlet flow control damper (MCV-FA1053-1)' });
    L.fan(462, 740, 'F-1053 PAF', 'PAF F-1053', { r: 18 });
    L.duct('air', [[486, 722], [750, 722], [750, 596]], { on: PAF });
    L.tag(530, 754, 'FIFA1071', 'T/H', { desc: 'PAF inlet air flow' });
    L.tag(176, 738, 'TIFA1072', '°C', { w: 46, dp: 0, desc: 'PAF inlet air temperature' });
    /* ---- hot air: SA to the furnace walls, PA to the plenum ---- */
    L.duct('hot', [[650, 480], [240, 480], [240, 420], [226, 420]], { on: SAF });
    L.text(246, 474, 'HOT SA', { z: 9.5, b: 1, c: C.dim });
    L.text(300, 500, 'TO FRONT / REAR WALL DAMPERS', { z: 9, c: C.dim });
    L.tag(372, 448, 'PIFA1088', 'mmH2O', { dp: 0, desc: 'APH outlet to furnace secondary air pressure' });
    L.tag(486, 448, 'TIFA1086', '°C', { w: 46, dp: 0, desc: 'APH outlet secondary air temp (A)' });
    L.tag(560, 448, 'TIFA1087', '°C', { w: 46, dp: 0, desc: 'APH outlet secondary air temp (B)' });
    L.duct('hot', [[650, 560], [130, 560], [130, 524]], { on: PAF });
    L.text(140, 552, 'HOT PA', { z: 9.5, b: 1, c: C.dim });
    L.tag(372, 530, 'FIFA1079', 'T/H', { desc: 'APH outlet to furnace primary air flow' });
    L.tag(486, 530, 'TIFA1076', '°C', { w: 46, dp: 0, desc: 'APH outlet primary air temp (A)' });
    L.tag(560, 530, 'TIFA1077', '°C', { w: 46, dp: 0, desc: 'APH outlet primary air temp (B)' });
    /* ---- key values and protection (top right) ---- */
    const panel = (x, y, w, h, title) => {
      L.rect(x, y, w, h, { f: C.pane, s: C.ln2, sw: 1 });
      L.rect(x, y, w, 17, { f: C.hdr, s: C.hdr, sw: 1 });
      L.text(x + 6, y + 12.5, title, { z: 10.5, b: 1, c: '#ffffff', ls: 0.5 });
    };
    panel(600, 70, 262, 150, 'COMBUSTION AIR & DRAFT');
    const kv = (x, y, label, ref, u, dp) => {
      L.text(x, y + 12.5, label, { z: 10.5 });
      L.tag(x + 112, y, label, u, { notag: 1, ref, dp });
    };
    kv(610, 96, 'Furnace press.', 'pv:PICFG108', 'mmH2O', 1);
    kv(610, 117, 'Total air flow', 'ABC-006|SUM out', 'T/H', 1);
    kv(610, 138, 'O2 (APH inlet)', 'pv:AICFG112', '%', 1);
    kv(610, 159, 'PA flow', 'pv:FICFA1071', 'T/H', 1);
    kv(610, 180, 'SA flow', 'pv:FICFA1081', 'T/H', 1);
    kv(610, 201, 'Coal flow', 'pv:FIC-CM', 'T/H', 1);
    panel(874, 70, 196, 150, 'PROTECTION');
    L.status(882, 96, 'MFT', 'ABC-007|M.0182', { alarm: 1 });
    L.status(882, 117, 'IDF', IDF);
    L.status(882, 138, 'PAF', PAF);
    L.status(882, 159, 'SAF', SAF);
    L.status(882, 180, 'FA BLOWER A', 'ABC-006|M.3308');
    L.status(882, 201, 'FA BLOWER B', 'ABC-014|M.3309');
    /* ---- legend (bottom) ---- */
    const lg = (x, k, s) => {
      L.duct(k, [[x, 782], [x + 24, 782]], { arrow: false, w: 7, cap: 'butt' });
      L.text(x + 30, 785.5, s, { z: 9.5, c: C.dim });
    };
    lg(620, 'air', 'COLD AIR');
    lg(706, 'hot', 'HOT AIR');
    lg(788, 'gas', 'FLUE GAS');
    L.rect(872, 777, 10, 10, { f: C.run, sw: 1 });
    L.text(886, 785.5, 'RUN / OPEN', { z: 9.5, c: C.dim });
    L.rect(958, 777, 10, 10, { f: C.stop, sw: 1 });
    L.text(972, 785.5, 'STOP / CLOSED', { z: 9.5, c: C.dim });
    L.text(1060, 785.5, '-----  NO DCS SIGNAL', { z: 9.5, c: C.dim });
    /* ---- control loops of this screen (faceplates) ---- */
    const X0 = 1196,
      W0 = 232;
    L.text(X0, 64, 'CONTROL LOOPS', { z: 10.5, b: 1, c: C.dim, ls: 1 });
    [
      ['PICFG108', 'Furnace pressure / IDF hydraulic coupling', 'mmH2O'],
      ['PICFG108A', 'Furnace pressure / IDF inlet vane', 'mmH2O'],
      ['AICFG112', 'O2 trim (air demand bias)', '%'],
      ['FICFA1071', 'Primary air flow / PAF inlet damper', 'T/H'],
      ['FICFA1081', 'Secondary air flow / SAF inlet damper', 'T/H'],
      ['FICFA1055A', 'FA blower A flow', 'T/H'],
      ['FICFA1055B', 'FA blower B flow', 'T/H'],
      ['HICHR1002A', 'RH gas biasing damper', '%'],
      ['HICHR1002B', 'SH gas biasing damper', '%']
    ].forEach(([t, s, u], i) => L.loop(X0, 72 + i * 79, W0, t, s, u));
  }
  const SCREENS = { AFG: airFlueGas };
  window.PLANT_V2 = {
    C,
    draw(g, sys, api) {
      const W = sys.w,
        H = sys.h;
      g.append(S_('rect', { x: 0, y: 0, width: W, height: H, fill: C.bg }));
      const L = lib(g, api);
      L.header(W, 34);
      (SCREENS[sys.screen] || (() => {}))(L, api);
    }
  };
  /* the new screens come first in the list of the Plant view; the old ones stay until the new set replaces them */
  window.PLANT_SYS = window.PLANT_SYS || [];
  window.PLANT_SYS.unshift({ id: 'AFG', title: 'AIR & FLUE GAS (new HMI)', src: '7.PNG', w: 1440, h: 796, v2: true, screen: 'AFG', items: [] });
})();
