/* NEW PLANT HMI (2026-10-26, roadmap step 6, sample): the plant screens REDRAWN with our own vector graphics (user 2026-10-26:
   "new HMI using your own graphics, guide lang ang snapshots"). The control-room snapshots (document-references/hmi-snapshot-
   sample.zip) are only the guide for the system: equipment, flow paths, instruments.
   Style (3rd pass, user 2026-10-27 "gawang bata, kulay lang binago"): a process mimic like the graphics of a modern plant DCS
   operator station (CENTUM VP / Ovation / 800xA process graphics), not a block diagram:
   - one screen frame: title bar with the process header, alarm banner, the process mimic, navigation bar to the related screens;
   - equipment drawn as equipment (shaded steel): furnace cut-away with water walls, refractory, bed glow from the live bed
     temperature, steam drum, cyclone with vortex finder / dip leg / loop seal, backpass with tube banks and louvre dampers,
     tubular air heater with its air sections, ESP with T/R sets and hoppers, centrifugal fans with volute, motor and coupling,
     stack with CEMS;
   - ducts as shaded channels routed like the plant (orthogonal, joints, a bridge where two cross), the medium by colour (cold air
     blue, hot air amber, flue gas grey-brown) and moving flow marks while there is flow; no flow = dark empty duct;
   - every value at its instrument: ISA 5.1 bubble (PT, TT, FT, AT, DPT) on the line, the value box (DCS style: black, cyan
     digits, unit) next to it; "-----" when the DCS logic has no signal, never a snapshot number;
   - each control loop as a small faceplate tag beside the damper it drives (tag, mode A / M / R, SV, MV bar); click = faceplate;
   - plant convention for state (OPERATING_POINTS.md): red = running / open, green = stopped / closed; a running fan turns.
   plant.js draws a system with `v2: true` through PLANT_V2.draw (the old screens are not touched). */
(function () {
  const C = {
    bg: '#18202a',
    bg2: '#1f2833',
    frame: '#0d1218',
    bar: '#26313d',
    ln: '#0a0e13',
    tx: '#e4eaf0',
    dim: '#93a3b3',
    lab: '#b7c4d1',
    box: '#04070a',
    boxs: '#46525e',
    val: '#3fe3ff',
    none: '#55616d',
    run: '#e53935',
    stop: '#2fb34a',
    man: '#ffd23f',
    auto: '#ffffff',
    rem: '#7cc4ff',
    alarm: '#ff5252',
    warn: '#ffb02e',
    air: ['#2f5f8c', '#7fb6e6'],
    hot: ['#a8661e', '#f3b25f'],
    gas: ['#6b5d52', '#bba796'],
    sol: '#b48a55',
    off: ['#2a323c', '#2a323c']
  };
  const NS = 'http://www.w3.org/2000/svg';
  const S_ = (t, a) => {
    const e = document.createElementNS(NS, t);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    return e;
  };
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  const UF = 'Arial, Helvetica, sans-serif',
    MF = 'Consolas, "Roboto Mono", "DejaVu Sans Mono", monospace';
  /* shared definitions: steel shading, water wall, refractory, bed glow, animations */
  const DEFS = `
    <linearGradient id="h2cylV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#55606b"/><stop offset=".35" stop-color="#c3ccd5"/><stop offset=".55" stop-color="#9aa6b2"/><stop offset="1" stop-color="#3f4952"/></linearGradient>
    <linearGradient id="h2cylH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55606b"/><stop offset=".35" stop-color="#c3ccd5"/><stop offset=".55" stop-color="#9aa6b2"/><stop offset="1" stop-color="#3f4952"/></linearGradient>
    <linearGradient id="h2case" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a5560"/><stop offset=".5" stop-color="#6b7783"/><stop offset="1" stop-color="#434d57"/></linearGradient>
    <linearGradient id="h2caseV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b7783"/><stop offset="1" stop-color="#3d4650"/></linearGradient>
    <linearGradient id="h2inner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20262d"/><stop offset="1" stop-color="#2b2420"/></linearGradient>
    <linearGradient id="h2fire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff7a1a" stop-opacity=".95"/><stop offset=".35" stop-color="#ff5a12" stop-opacity=".45"/><stop offset="1" stop-color="#ff5a12" stop-opacity="0"/></linearGradient>
    <pattern id="h2ww" width="5" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="10" fill="#56616c"/><rect x="1" width="3" height="10" fill="#8794a0"/><rect x="2" width="1" height="10" fill="#b5c0ca"/></pattern>
    <pattern id="h2ref" width="16" height="8" patternUnits="userSpaceOnUse"><rect width="16" height="8" fill="#6e4636"/><path d="M0 .5H16M0 4.5H16M4 0V4M12 4V8" stroke="#4e3025" stroke-width="1"/></pattern>
    <pattern id="h2tube" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#3c4650"/><rect x="1" width="2.2" height="6" fill="#8f9ba7"/></pattern>
    <linearGradient id="h2bed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8b07a"/><stop offset="1" stop-color="#9a7448"/></linearGradient>
    <style>
      .h2fl{stroke-dasharray:4 14;animation:h2fl 1s linear infinite}
      @keyframes h2fl{to{stroke-dashoffset:-18}}
      .h2spin{animation:h2spin 1.1s linear infinite;transform-box:fill-box;transform-origin:center}
      @keyframes h2spin{to{transform:rotate(360deg)}}
      .h2blink{animation:h2blink 1s steps(2,start) infinite}
      @keyframes h2blink{to{visibility:hidden}}
      @media (prefers-reduced-motion:reduce){.h2fl,.h2spin,.h2blink{animation:none}}
      .h2btn:hover rect{fill:#34414f}
    </style>`;
  /* ---- the symbol library: every screen is made of these ---- */
  function lib(g, api) {
    const L = {};
    const add = (t, a, p) => {
      const e = S_(t, a);
      (p || g).append(e);
      return e;
    };
    L.add = add;
    L.g = a => add('g', a || {});
    L.text = (x, y, s, o) => {
      o = o || {};
      const t = add('text', { x, y, fill: o.c || C.tx, 'font-size': o.z || 11, 'font-family': o.mono ? MF : UF, 'font-weight': o.b ? 700 : 400, 'text-anchor': o.a || 'start', 'letter-spacing': o.ls || 0 }, o.p);
      t.textContent = s;
      return t;
    };
    L.line = (p, o) => {
      o = o || {};
      return add('polyline', { points: p.map(q => q.join(',')).join(' '), fill: 'none', stroke: o.c || C.dim, 'stroke-width': o.w || 1, 'stroke-dasharray': o.dash || '', 'stroke-linejoin': 'round' }, o.p);
    };
    L.rect = (x, y, w, h, o) => {
      o = o || {};
      return add('rect', { x, y, width: w, height: h, rx: o.rx || 0, fill: o.f || 'url(#h2case)', stroke: o.s || C.ln, 'stroke-width': o.sw == null ? 1 : o.sw }, o.p);
    };
    L.path = (d, o) => {
      o = o || {};
      return add('path', { d, fill: o.f || 'url(#h2case)', stroke: o.s || C.ln, 'stroke-width': o.sw == null ? 1 : o.sw, 'stroke-linejoin': 'round' }, o.p);
    };
    /* flow signal: a live 0 / 1 (running bit, or flow > gt) that turns ducts and marks on / off */
    const flows = [];
    L.flow = (ref, tag, gt) => {
      const f = { on: true, sub: [] };
      api.reg({ t: 'val', tag: tag || '', ref, v: '' }, X => {
        f.on = !X || !isFinite(X.v) ? true : X.v > (gt != null ? gt : 0.5);
        for (const s of f.sub) s(f.on);
      }, null);
      flows.push(f);
      return f;
    };
    /* duct: shaded channel (dark outline, body of the medium, light centre line) along orthogonal points, moving flow marks
       while there is flow, an arrow head at the end; `bridge` = drawn over a crossing duct with a gap */
    L.duct = (k, p, o) => {
      o = o || {};
      const w = o.w || 16,
        gg = add('g', {}),
        pts = p.map(q => q.join(',')).join(' ');
      if (o.bridge) add('polyline', { points: pts, fill: 'none', stroke: C.bg, 'stroke-width': w + 10, 'stroke-linejoin': 'miter' }, gg);
      add('polyline', { points: pts, fill: 'none', stroke: C.ln, 'stroke-width': w + 3, 'stroke-linejoin': 'miter', 'stroke-linecap': o.cap || 'butt' }, gg);
      const body = add('polyline', { points: pts, fill: 'none', stroke: C[k][0], 'stroke-width': w, 'stroke-linejoin': 'miter', 'stroke-linecap': o.cap || 'butt' }, gg);
      const hl = add('polyline', { points: pts, fill: 'none', stroke: C[k][1], 'stroke-opacity': 0.35, 'stroke-width': Math.max(1.5, w * 0.28), 'stroke-linejoin': 'miter' }, gg);
      const fl = add('polyline', { points: pts, fill: 'none', stroke: C[k][1], 'stroke-width': Math.max(1.5, w * 0.28), 'stroke-linejoin': 'miter', class: 'h2fl' }, gg);
      let ar = null;
      if (o.arrow !== false && p.length > 1) {
        const [a, b] = [p[p.length - 2], p[p.length - 1]],
          an = Math.atan2(b[1] - a[1], b[0] - a[0]),
          A = w * 0.55 + 3,
          tx = b[0] - Math.cos(an) * (A + 1),
          ty = b[1] - Math.sin(an) * (A + 1);
        ar = add('polygon', { points: `${tx + A * Math.cos(an)},${ty + A * Math.sin(an)} ${tx + A * 0.9 * Math.cos(an + 2.3)},${ty + A * 0.9 * Math.sin(an + 2.3)} ${tx + A * 0.9 * Math.cos(an - 2.3)},${ty + A * 0.9 * Math.sin(an - 2.3)}`, fill: C[k][1], stroke: C.ln, 'stroke-width': 0.8 }, gg);
      }
      if (o.f)
        o.f.sub.push(on => {
          body.setAttribute('stroke', on ? C[k][0] : C.off[0]);
          hl.setAttribute('stroke-opacity', on ? 0.35 : 0);
          fl.setAttribute('visibility', on ? 'visible' : 'hidden');
          if (ar) ar.setAttribute('fill', on ? C[k][1] : '#4a5460');
        });
      return gg;
    };
    /* DCS value: tag over a black box with cyan digits, unit at the right; "-----" grey = no DCS signal */
    L.val = (x, y, tag, u, o) => {
      o = o || {};
      const w = o.w || 58,
        dp = o.dp != null ? o.dp : 1;
      if (!o.notag) L.text(x, y - 3, o.label || tag, { z: 9.5, c: C.lab });
      const r = L.rect(x, y, w, 16, { f: C.box, s: C.boxs });
      const v = L.text(x + w - 4, y + 12.3, '-----', { z: 12, mono: 1, b: 1, c: C.none, a: 'end' });
      if (u) L.text(x + w + 3, y + 12, u, { z: 9.5, c: C.dim });
      const it = { t: 'val', tag, ref: o.ref, v: '' };
      api.reg(
        it,
        X => {
          const ok = X && isFinite(X.v);
          v.textContent = ok ? fmt(X.v, dp) : '-----';
          v.setAttribute('fill', ok ? C.val : C.none);
          if (o.on) o.on(ok ? +X.v : null);
        },
        r
      );
      add('title', {}, r).textContent = tag + (o.desc ? ' · ' + o.desc : '');
      return it;
    };
    /* a value used only for a calculation on the screen: registered, not drawn */
    L.hidden = (tag, on, ref) => api.reg({ t: 'val', tag, ref, v: '' }, X => on(X && isFinite(X.v) ? +X.v : null), null);
    /* a value calculated on the screen from live tags (not a DCS signal): same box, set by the caller */
    L.calc = (x, y, label, u, o) => {
      o = o || {};
      const w = o.w || 58,
        dp = o.dp != null ? o.dp : 1;
      if (label) L.text(x, y - 3, label, { z: 9.5, c: C.lab });
      const r = L.rect(x, y, w, 16, { f: C.box, s: C.boxs });
      add('title', {}, r).textContent = (o.desc || label) + ' (calculated on this screen)';
      const v = L.text(x + w - 4, y + 12.3, '-----', { z: 12, mono: 1, b: 1, c: C.none, a: 'end' });
      if (u) L.text(x + w + 3, y + 12, u, { z: 9.5, c: C.dim });
      return x2 => {
        v.textContent = x2 == null ? '-----' : fmt(x2, dp);
        v.setAttribute('fill', x2 == null ? C.none : C.val);
      };
    };
    /* ISA 5.1 instrument bubble (field mounted: plain circle) with its letters, a thin connection to the process point */
    L.bub = (x, y, s, px, py) => {
      if (px != null) L.line([[px, py], [x, y]], { c: '#7d8b99', w: 0.9 });
      add('circle', { cx: x, cy: y, r: 9.5, fill: '#e9eef3', stroke: '#24303b', 'stroke-width': 1 });
      L.text(x, y + 3.3, s, { z: s.length > 2 ? 7 : 8.5, b: 1, a: 'middle', c: '#111820' });
    };
    /* centrifugal fan: volute casing (spiral) with the outlet to the right at the top, impeller that turns while running,
       motor beside it (red running, green stopped: plant convention) */
    L.fan = (cx, cy, tag, name, o) => {
      o = o || {};
      const r0 = o.r || 22,
        r1 = r0 * 1.55,
        ol = o.out || r1 * 0.8;
      const pts = [];
      for (let i = 0; i <= 36; i++) {
        const a = -Math.PI / 2 + (i / 36) * 2 * Math.PI,
          r = r0 + (r1 - r0) * (i / 36);
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      const d = 'M' + pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' L') + ` L${cx + ol},${cy - r1} L${cx + ol},${cy - r0} Z`;
      const casing = L.path(d, { f: 'url(#h2cylV)', sw: 1.2 });
      add('circle', { cx, cy, r: r0 * 0.78, fill: '#2d3640', stroke: C.ln, 'stroke-width': 1 });
      const imp = add('g', {});
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        add('path', { d: `M${cx + r0 * 0.2 * Math.cos(a)},${cy + r0 * 0.2 * Math.sin(a)} Q${cx + r0 * 0.55 * Math.cos(a + 0.2)},${cy + r0 * 0.55 * Math.sin(a + 0.2)} ${cx + r0 * 0.72 * Math.cos(a + 0.6)},${cy + r0 * 0.72 * Math.sin(a + 0.6)}`, stroke: '#cdd6df', 'stroke-width': 1.6, fill: 'none' }, imp);
      }
      add('circle', { cx, cy, r: r0 * 0.18, fill: '#9aa6b2', stroke: C.ln, 'stroke-width': 1 }, imp);
      /* motor (and the hydraulic coupling of the IDF) */
      const parts = o.hc ? ['HC', 'M'] : ['M'],
        tw = parts.length * 34 - 4 + (o.hc ? -6 : 0),
        below = !!o.below,
        mx = below ? cx - tw / 2 : o.mx != null ? o.mx : cx + r1 + 8,
        my = below ? cy + r1 + 8 : cy - 9;
      let xx = mx;
      let motor = null;
      /* the shaft: motor beside the fan (horizontal) or drawn under it (vertical) */
      L.line(below ? [[cx, cy], [cx, my]] : [[cx, cy], [mx, cy]], { c: '#9aa6b2', w: 2.2 });
      for (const p of parts) {
        const r = L.rect(xx, my, p === 'M' ? 30 : 24, 18, { f: '#4a5560', rx: 2 });
        L.text(xx + (p === 'M' ? 15 : 12), my + 13, p, { z: 10, b: 1, a: 'middle', c: '#ffffff' });
        if (p === 'M') motor = r;
        xx += (p === 'M' ? 30 : 24) + 4;
      }
      L.text(o.lx != null ? o.lx : cx, o.ly != null ? o.ly : cy + r1 + 14, name, { z: 11, b: 1, a: o.la || 'middle', c: C.tx });
      const it = { t: 'fan', tag };
      api.reg(
        it,
        X => {
          const ok = X && isFinite(X.v),
            on = ok && X.v > 0.5;
          motor.setAttribute('fill', !ok ? '#4a5560' : on ? C.run : C.stop);
          imp.setAttribute('class', on ? 'h2spin' : '');
        },
        casing
      );
      add('title', {}, casing).textContent = name + ' · run state from the DCS logic (motor red = running, green = stopped)';
      return it;
    };
    /* butterfly damper in a duct with its actuator (M) and the position (%); click = the faceplate of its controller */
    L.damper = (x, y, tag, o) => {
      o = o || {};
      const vert = !!o.vert,
        gg = add('g', { style: o.fp ? 'cursor:pointer' : '' });
      const hit = add('rect', { x: x - 12, y: y - 30, width: 24, height: 44, fill: '#000', 'fill-opacity': 0 }, gg);
      const blade = add('line', { x1: x, y1: y - 8, x2: x, y2: y + 8, stroke: '#f2f5f8', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, gg);
      const pin = add('circle', { cx: x, cy: y, r: 2.8, fill: C.none, stroke: '#0a0e13', 'stroke-width': 1 }, gg);
      if (vert) {
        add('line', { x1: x - 9, y1: y, x2: x - 16, y2: y, stroke: '#9aa6b2', 'stroke-width': 1.4 }, gg);
        L.rect(x - 32, y - 8, 16, 16, { f: '#4a5560', rx: 2, p: gg });
        L.text(x - 24, y + 4, 'M', { z: 9, b: 1, a: 'middle', c: '#fff', p: gg });
      } else {
        add('line', { x1: x, y1: y - 9, x2: x, y2: y - 16, stroke: '#9aa6b2', 'stroke-width': 1.4 }, gg);
        L.rect(x - 8, y - 32, 16, 16, { f: '#4a5560', rx: 2, p: gg });
        L.text(x, y - 20, 'M', { z: 9, b: 1, a: 'middle', c: '#fff', p: gg });
      }
      let vt = null;
      if (!o.novalue) {
        const lx = o.lx != null ? o.lx : x + 12,
          ly = o.ly != null ? o.ly : y - 32;
        L.text(lx, ly - 3, tag, { z: 9.5, c: C.lab });
        L.rect(lx, ly, 46, 16, { f: C.box, s: C.boxs });
        vt = L.text(lx + 42, ly + 12.3, '-----', { z: 12, mono: 1, b: 1, c: C.none, a: 'end' });
        L.text(lx + 49, ly + 12, '%', { z: 9.5, c: C.dim });
      }
      const it = { t: 'damper', tag, ref: o.ref, v: '' };
      api.reg(
        it,
        X => {
          const ok = X && isFinite(X.v),
            p = ok ? Math.max(0, Math.min(100, +X.v)) : 0;
          /* blade across the duct when closed, along it when open */
          const th = (vert ? 0 : Math.PI / 2) - (p / 100) * (Math.PI / 2),
            R = 8;
          blade.setAttribute('x1', x - R * Math.cos(th));
          blade.setAttribute('y1', y - R * Math.sin(th));
          blade.setAttribute('x2', x + R * Math.cos(th));
          blade.setAttribute('y2', y + R * Math.sin(th));
          pin.setAttribute('fill', !ok ? C.none : p < 3 ? C.stop : C.run);
          if (vt) {
            vt.textContent = ok ? fmt(p, 1) : '-----';
            vt.setAttribute('fill', ok ? C.val : C.none);
          }
        },
        null
      );
      if (o.fp) gg.addEventListener('click', e => (e.stopPropagation(), api.fp(o.fp)));
      add('title', {}, hit).textContent = tag + (o.desc ? ' · ' + o.desc : '') + (o.fp ? ' · click: faceplate of ' + o.fp : '');
      return it;
    };
    /* louvre damper across a gas pass (RH / SH biasing): 4 blades that turn together */
    L.louvre = (x, y, w, tag, o) => {
      o = o || {};
      const gg = add('g', { style: 'cursor:pointer' });
      add('rect', { x, y: y - 9, width: w, height: 18, fill: '#000', 'fill-opacity': 0 }, gg);
      add('line', { x1: x, y1: y, x2: x + w, y2: y, stroke: '#7d8b99', 'stroke-width': 1, 'stroke-dasharray': '2 3' }, gg);
      const n = 4,
        bl = [];
      for (let i = 0; i < n; i++) {
        const bx = x + (w / n) * (i + 0.5);
        bl.push([bx, add('line', { x1: bx - 8, y1: y, x2: bx + 8, y2: y, stroke: '#f2f5f8', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, gg)]);
        add('circle', { cx: bx, cy: y, r: 1.8, fill: '#0a0e13' }, gg);
      }
      add('line', { x1: x + w, y1: y, x2: x + w + 10, y2: y, stroke: '#9aa6b2', 'stroke-width': 1.4 }, gg);
      L.rect(x + w + 10, y - 8, 16, 16, { f: '#4a5560', rx: 2, p: gg });
      L.text(x + w + 18, y + 4, 'M', { z: 9, b: 1, a: 'middle', c: '#fff', p: gg });
      api.reg({ t: 'damper', tag, ref: o.ref, v: '' }, X => {
        const ok = X && isFinite(X.v),
          p = ok ? Math.max(0, Math.min(100, +X.v)) : 0,
          th = (p / 100) * (Math.PI / 2);
        for (const [bx, l] of bl) {
          l.setAttribute('x1', bx - 8 * Math.cos(th));
          l.setAttribute('y1', y - 8 * Math.sin(th));
          l.setAttribute('x2', bx + 8 * Math.cos(th));
          l.setAttribute('y2', y + 8 * Math.sin(th));
        }
      }, null);
      if (o.fp) gg.addEventListener('click', e => (e.stopPropagation(), api.fp(o.fp)));
      add('title', {}, gg).textContent = tag + (o.desc ? ' · ' + o.desc : '') + (o.fp ? ' · click: faceplate of ' + o.fp : '');
    };
    /* faceplate tag of a control loop beside its final element: tag, mode, SV, MV bar; click = full faceplate */
    L.loop = (x, y, tag, svc, u, o) => {
      o = o || {};
      const w = o.w || 132,
        h = 44,
        gg = add('g', { style: 'cursor:pointer' });
      const r = L.rect(x, y, w, h, { f: '#0e151c', s: '#56677a', rx: 3, p: gg });
      L.text(x + 6, y + 13, tag, { z: 10.5, b: 1, c: '#ffffff', p: gg });
      const mb = L.rect(x + w - 21, y + 3, 17, 13, { f: '#55616d', s: '#000', rx: 2, p: gg });
      const mt = L.text(x + w - 12.5, y + 13.3, '-', { z: 10, b: 1, a: 'middle', c: '#ffffff', p: gg });
      L.text(x + 6, y + 27.5, 'SV', { z: 9, b: 1, c: C.dim, p: gg });
      const sv = L.text(x + 74, y + 27.5, '-----', { z: 11, mono: 1, b: 1, a: 'end', c: C.none, p: gg });
      L.text(x + 78, y + 27.5, u, { z: 9, c: C.dim, p: gg });
      L.text(x + 6, y + 39.5, 'MV', { z: 9, b: 1, c: C.dim, p: gg });
      const bw = w - 74;
      L.rect(x + 24, y + 32, bw, 8, { f: '#000', s: '#3a4652', p: gg });
      const bar = L.rect(x + 24, y + 32, 0, 8, { f: '#3fa0ff', s: 'none', sw: 0, p: gg });
      const mv = L.text(x + w - 5, y + 39.5, '-----', { z: 10.5, mono: 1, b: 1, a: 'end', c: C.none, p: gg });
      const dp = o.dp != null ? o.dp : 1;
      api.reg(
        { t: 'ctl', tag },
        X => {
          const ok = !!X,
            m = ok ? X.m : '-';
          mt.textContent = m;
          mb.setAttribute('fill', !ok ? '#55616d' : m === 'M' ? C.man : m === 'R' ? C.rem : C.auto);
          mt.setAttribute('fill', !ok ? '#ffffff' : '#000000');
          sv.textContent = ok ? fmt(X.sv, dp) : '-----';
          sv.setAttribute('fill', ok ? C.val : C.none);
          const m0 = ok && isFinite(X.mv) ? Math.max(0, Math.min(100, X.mv)) : 0;
          bar.setAttribute('width', (bw * m0) / 100);
          mv.textContent = ok ? fmt(X.mv, 1) + '%' : '-----';
          mv.setAttribute('fill', ok ? C.val : C.none);
        },
        r
      );
      add('title', {}, r).textContent = tag + ' · ' + svc + ' · click: faceplate (A / M / R, SV, MV)';
      if (o.lead) L.line([[o.lead[0], o.lead[1]], [o.lead[2], o.lead[3]]], { c: '#56677a', w: 1, dash: '3 2' });
    };
    /* a panel on the screen (trend, CEMS, combustion): thin frame with a title strip */
    L.panel = (x, y, w, h, title) => {
      L.rect(x, y, w, h, { f: '#121a22', s: '#3a4754', rx: 3 });
      L.rect(x, y, w, 18, { f: '#26313d', s: '#3a4754', rx: 3 });
      L.text(x + 8, y + 13, title, { z: 10, b: 1, c: C.lab, ls: 0.6 });
    };
    /* title bar of the screen with the process header (same signals as the control-room header) */
    L.title = (W, num, name) => {
      add('rect', { x: 0, y: 0, width: W, height: 44, fill: C.frame });
      add('rect', { x: 0, y: 43, width: W, height: 1, fill: '#3a4754' });
      L.rect(10, 9, 44, 26, { f: '#0f5f8f', s: '#2b8fd0', rx: 3 });
      L.text(32, 27, num, { z: 14, b: 1, a: 'middle', c: '#ffffff' });
      L.text(64, 21, name, { z: 16, b: 1, c: '#ffffff', ls: 0.6 });
      L.text(64, 36, 'LMYP #1 · CFB BOILER 460 T/H · 150 MW', { z: 9.5, c: C.dim, ls: 0.4 });
      const K = [
        ['MSP', 'kg/cm²', 1],
        ['MST', '°C', 0],
        ['MSF', 'T/H', 1],
        ['RHP', 'kg/cm²', 1],
        ['RHT', '°C', 0],
        ['COAL', 'T/H', 1],
        ['PWR', 'MW', 1]
      ];
      const x0 = 520,
        cw = (W - x0 - 8) / K.length;
      K.forEach(([k, u, dp], i) => {
        const xx = x0 + i * cw;
        L.text(xx, 26.5, k, { z: 11, b: 1, c: '#c9d3dd' });
        L.rect(xx + 36, 10, 66, 24, { f: C.box, s: C.boxs });
        const t = L.text(xx + 98, 27.5, '-----', { z: 14, mono: 1, b: 1, c: C.none, a: 'end' });
        L.text(xx + 106, 26.5, u, { z: 9.5, c: C.dim });
        if (api.HDR[k])
          api.reg({ t: 'val', tag: k, ref: api.HDR[k], v: '' }, X => {
            const ok = X && isFinite(X.v);
            t.textContent = ok ? fmt(X.v, dp) : '-----';
            t.setAttribute('fill', ok ? C.val : C.none);
          }, null);
      });
    };
    /* alarm banner: the abnormal states of this system, newest rule first; "NO ACTIVE ALARM" when none */
    L.banner = (W, y, rules) => {
      add('rect', { x: 0, y, width: W, height: 22, fill: '#11171e' });
      add('rect', { x: 0, y: y + 21, width: W, height: 1, fill: '#2c3742' });
      const lamp = add('rect', { x: 10, y: y + 4, width: 58, height: 14, rx: 2, fill: '#2c3742' });
      const lt = L.text(39, y + 15, 'ALARM', { z: 9.5, b: 1, a: 'middle', c: '#93a3b3' });
      const txt = L.text(78, y + 15.5, 'NO ACTIVE ALARM', { z: 11, b: 1, c: '#6f7f8f' });
      const st = {};
      const upd = () => {
        const act = rules.filter(r => st[r.k]);
        txt.innerHTML = '';
        if (!act.length) {
          txt.textContent = 'NO ACTIVE ALARM';
          txt.setAttribute('fill', '#6f7f8f');
          lamp.setAttribute('fill', '#2c3742');
          lt.setAttribute('fill', '#93a3b3');
          lamp.removeAttribute('class');
          return;
        }
        const hi = act.some(r => r.hi);
        lamp.setAttribute('fill', hi ? C.alarm : C.warn);
        lt.setAttribute('fill', '#000');
        lamp.setAttribute('class', hi ? 'h2blink' : '');
        act.forEach((r, i) => {
          const s = S_('tspan', { fill: r.hi ? '#ff6b6b' : '#ffc04d', dx: i ? 22 : 0 });
          s.textContent = r.msg;
          txt.append(s);
        });
      };
      for (const r of rules)
        api.reg({ t: 'val', tag: '', ref: r.ref, v: '' }, X => {
          const ok = X && isFinite(X.v);
          st[r.k] = ok && (r.when ? r.when(+X.v) : X.v > 0.5);
          upd();
        }, null);
    };
    /* navigation bar: the related screens (the old screens open until the new set replaces them) */
    L.nav = (W, y, items, here) => {
      add('rect', { x: 0, y, width: W, height: 36, fill: C.frame });
      add('rect', { x: 0, y, width: W, height: 1, fill: '#3a4754' });
      let x = 10;
      for (const [id, s] of items) {
        const w = 18 + s.length * 6.6,
          on = id === here,
          gg = add('g', { class: on ? '' : 'h2btn', style: on ? '' : 'cursor:pointer' });
        add('rect', { x, y: y + 6, width: w, height: 24, rx: 3, fill: on ? '#0f5f8f' : '#1f2933', stroke: on ? '#2b8fd0' : '#3a4754' }, gg);
        L.text(x + w / 2, y + 22, s, { z: 10.5, b: 1, a: 'middle', c: on ? '#fff' : '#c9d3dd', p: gg });
        if (!on && api.go) gg.addEventListener('click', e => (e.stopPropagation(), api.go(id)));
        add('title', {}, gg).textContent = on ? 'this screen' : 'open ' + s;
        x += w + 6;
      }
    };
    /* live trend (last 5 min, 1 s samples): pens with their own range; the samples come from the screen's values */
    L.trend = (x, y, w, h, pens) => {
      L.panel(x, y, w, h, 'TREND · LAST 5 MIN');
      const px = x + 10,
        py = y + 26,
        pw = w - 170,
        ph = h - 36;
      L.rect(px, py, pw, ph, { f: '#05090d', s: '#2c3742' });
      for (let i = 1; i < 4; i++) L.line([[px, py + (ph * i) / 4], [px + pw, py + (ph * i) / 4]], { c: '#1c262f', w: 1 });
      for (let i = 1; i < 5; i++) L.line([[px + (pw * i) / 5], [px + (pw * i) / 5]].map((q, j) => [q[0], j ? py + ph : py]), { c: '#1c262f', w: 1 });
      L.text(px, py + ph + 0, '', {});
      const N = 300,
        lines = [],
        cur = [];
      pens.forEach((p, i) => {
        lines.push(add('polyline', { points: '', fill: 'none', stroke: p.c, 'stroke-width': 1.6 }));
        const ly = py + 4 + i * 30;
        add('rect', { x: px + pw + 10, y: ly, width: 10, height: 3, fill: p.c });
        L.text(px + pw + 26, ly + 5, p.name, { z: 9.5, b: 1, c: p.c });
        L.text(px + pw + 26, ly + 17, p.lo + ' … ' + p.hi + ' ' + p.u, { z: 8.5, c: C.dim });
        cur.push(L.text(x + w - 8, ly + 5, '-----', { z: 10.5, mono: 1, b: 1, a: 'end', c: p.c }));
        p.buf = [];
        p.now = null;
        L.hidden(p.tag || p.name, v => (p.now = v), p.ref);
      });
      /* one sample per tick: registered last, so every pen has its value of this tick */
      return () =>
        L.hidden('', () => {
          pens.forEach((p, i) => {
            p.buf.push(p.now);
            if (p.buf.length > N) p.buf.shift();
            const pts = [];
            p.buf.forEach((v, k) => {
              if (v == null) return;
              const f = Math.max(0, Math.min(1, (v - p.lo) / (p.hi - p.lo)));
              pts.push((px + (pw * k) / (N - 1)).toFixed(1) + ',' + (py + ph - f * ph).toFixed(1));
            });
            lines[i].setAttribute('points', pts.join(' '));
            cur[i].textContent = p.now == null ? '-----' : fmt(p.now, p.dp);
          });
        }, 'ABC-007|M.0182');
    };
    L.C = C;
    return L;
  }
  /* ================= SCREEN: AIR & FLUE GAS (guide: snapshots 7.PNG 007, 8.PNG 008, 9.png 009, 38.PNG 038) =================
     Gas path: furnace -> cyclones A / B (solids back to the furnace through the loop seal, fluidized by the FA blowers) ->
     backpass (RH pass and SH pass, the RH / SH gas biasing dampers ABC-020, economizers) -> tubular air heater H-1052 (gas in
     the tubes, downward) -> ESP Z-1010 -> IDF F-1056 (inlet vane PCD-FG1056-1 + hydraulic coupling, ABC-008 PICFG108 /
     PICFG108A) -> stack. Air path: SAF F-1054 (inlet damper MCV-FA1054-1, ABC-007 FICFA1081) and PAF F-1053 (MCV-FA1053-1,
     FICFA1071) -> air heater (SA section above, PA section below) -> hot SA to the furnace walls (front / rear wall dampers, 008)
     and hot PA to the plenum under the bed. O2 trim AICFG112 (ABC-002). Run states: memory list M.3302 PAF / M.3303 SAF /
     M.3304 IDF / M.3308 FA-A / M.3309 FA-B; MFT M.0182 (ABC-007). Canvas 1600 x 960: title 0..44, alarms 44..66, mimic,
     navigation 924..960. */
  function airFlueGas(L, api) {
    const C = L.C,
      IDF = 'ABC-008|M.3304',
      PAF = 'ABC-007|M.3302',
      SAF = 'ABC-007|M.3303',
      fG = L.flow(IDF),
      fS = L.flow(SAF),
      fP = L.flow(PAF),
      fF = L.flow('', 'FIFA1055', 1);
    /* ===== furnace: drum, water walls, refractory lower furnace, bed (glows with the bed temperature), plenum ===== */
    L.rect(166, 96, 148, 30, { f: 'url(#h2cylH)', rx: 15, sw: 1.2 });
    L.text(240, 115, 'DRUM', { z: 10, b: 1, a: 'middle', c: '#10161c' });
    for (const xx of [190, 240, 290]) L.line([[xx, 126], [xx, 150]], { c: '#9aa6b2', w: 3 });
    L.val(30, 104, 'LICBR1001', 'mm', { ref: 'pv:LICBR1001', label: 'DRUM LEVEL', desc: 'Drum level (LICBR1001 PV, ABC-010)' });
    L.bub(150, 111, 'LT', 166, 111);
    L.path('M150,150 H330 V640 L286,700 H194 L150,640 Z', { f: 'url(#h2ww)', sw: 1.4 });
    L.path('M162,160 H318 V636 L280,690 H200 L162,636 Z', { f: 'url(#h2inner)', sw: 1 });
    L.path('M162,540 H318 V636 L280,690 H200 L162,636 Z', { f: 'url(#h2ref)', sw: 1 });
    const glow = L.path('M168,470 H312 V632 L278,684 H202 L168,632 Z', { f: 'url(#h2fire)', s: 'none', sw: 0 });
    glow.setAttribute('opacity', 0);
    L.rect(200, 678, 80, 12, { f: 'url(#h2bed)', sw: 0.8 });
    L.text(240, 200, 'FURNACE', { z: 13, b: 1, a: 'middle', c: '#ffffff', ls: 2 });
    L.text(240, 216, 'CFB COMBUSTOR', { z: 9, a: 'middle', c: C.dim, ls: 1 });
    L.text(240, 600, 'REFRACTORY', { z: 8.5, a: 'middle', c: '#e0c2b2', ls: 1 });
    L.text(240, 674, 'BED', { z: 9, b: 1, a: 'middle', c: '#ffd9a8' });
    L.rect(194, 694, 92, 4, { f: '#9aa6b2', sw: 0.6 });
    for (let xx = 200; xx <= 280; xx += 10) L.line([[xx, 690], [xx, 698]], { c: '#c3ccd5', w: 1.4 });
    L.rect(190, 700, 100, 36, { f: 'url(#h2caseV)', rx: 2, sw: 1.2 });
    L.text(240, 722, 'PLENUM', { z: 10, b: 1, a: 'middle', c: '#ffffff' });
    /* furnace pressure: three transmitters on the upper furnace */
    L.text(26, 168, 'FURNACE PRESSURE', { z: 10, b: 1, c: C.tx });
    [['PIFG1085', 'A', 196], ['PIFG1086', 'B', 236], ['PIFG10871', 'C', 276]].forEach(([t, s, yy]) => {
      L.val(30, yy - 8, t, 'mmH2O', { desc: 'Furnace pressure (' + s + ')' });
      L.bub(140, yy, 'PT', 150, yy);
    });
    /* bed temperature: 18 thermocouples (TE-FG1091 A ~ I upper, TE-FG1090 A ~ I lower, ABC-026 / 027): average and spread */
    L.text(26, 492, 'BED TEMP (18 TE)', { z: 10, b: 1, c: C.tx });
    const TT = {},
      ids = 'ABCDEFGHI'.split('');
    const sAvg = L.calc(54, 506, '', '°C', { dp: 0, desc: 'Bed temperature average of 18 TE' }),
      sMax = L.calc(54, 528, '', '°C', { dp: 0, desc: 'Bed temperature highest of 18 TE' }),
      sMin = L.calc(54, 550, '', '°C', { dp: 0, desc: 'Bed temperature lowest of 18 TE' });
    for (const [s, yy] of [['AVG', 518], ['MAX', 540], ['MIN', 562]]) L.text(26, yy, s, { z: 9.5, b: 1, c: C.dim });
    L.bub(140, 590, 'TE', 150, 600);
    const calc = () => {
      const v = Object.values(TT).filter(x => x != null);
      const avg = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
      sAvg(avg);
      sMax(v.length ? Math.max(...v) : null);
      sMin(v.length ? Math.min(...v) : null);
      glow.setAttribute('opacity', avg == null ? 0 : Math.max(0, Math.min(1, (avg - 150) / 750)).toFixed(2));
    };
    for (const s of ['TIFG1091', 'TIFG1090']) for (const i of ids) L.hidden(s + i, x => ((TT[s + i] = x), calc()));
    /* bed differential pressure (plenum to upper bed) */
    L.text(26, 646, 'BED DP', { z: 10, b: 1, c: C.tx });
    L.val(40, 668, 'DPIFG1081', 'mmH2O', { dp: 0, desc: 'Furnace plenum / upper layer DP (A)' });
    L.val(40, 704, 'DPIFG1082', 'mmH2O', { dp: 0, desc: 'Furnace plenum / upper layer DP (B)' });
    L.bub(170, 718, 'DPT', 190, 718);
    /* ===== cyclone A / B, vortex finder, dip leg, loop seal, solids return, FA blowers ===== */
    L.duct('gas', [[330, 186], [384, 186]], { w: 26, arrow: false, f: fG });
    L.path('M392,160 H482 V270 L446,372 H428 L392,270 Z', { f: 'url(#h2cylV)', sw: 1.2, s: '#20262d' });
    L.path('M380,170 H470 V280 L434,382 H416 L380,280 Z', { f: 'url(#h2cylV)', sw: 1.2 });
    L.rect(413, 140, 24, 32, { f: 'url(#h2cylV)' });
    L.text(425, 236, 'CYCLONE', { z: 10, b: 1, a: 'middle', c: '#10161c' });
    L.text(425, 250, 'A / B', { z: 10, b: 1, a: 'middle', c: '#10161c' });
    L.rect(418, 382, 14, 52, { f: 'url(#h2cylV)' });
    L.path('M396,434 H456 V470 Q456,478 448,478 H404 Q396,478 396,470 Z', { f: 'url(#h2caseV)', sw: 1.2 });
    L.text(426, 459, 'LOOP SEAL', { z: 8.5, b: 1, a: 'middle', c: '#fff' });
    /* solids back to the furnace */
    L.line([[396, 452], [366, 452], [330, 500]], { c: C.sol, w: 7 });
    L.line([[396, 452], [366, 452], [330, 500]], { c: '#e4c592', w: 1.5, dash: '3 4' });
    L.text(336, 444, 'SOLIDS', { z: 8.5, c: '#d8b886' });
    /* FA blowers to the loop seal */
    L.duct('air', [[402, 524], [402, 498], [450, 498], [450, 524]], { w: 7, arrow: false, f: fF });
    L.duct('air', [[426, 498], [426, 478]], { w: 7, f: fF });
    L.fan(402, 538, 'F-1055A FA BLOWER-A', 'FAB-A', { r: 9, below: 1, lx: 380, ly: 542, la: 'end' });
    L.fan(450, 538, 'F-1055B FA BLOWER-B', 'FAB-B', { r: 9, below: 1, lx: 470, ly: 542, la: 'start' });
    L.val(482, 484, 'FIFA1055', 'T/H', { w: 52, desc: 'FA blower outlet common air flow' });
    L.bub(468, 492, 'FT', 450, 498);
    L.loop(516, 530, 'FICFA1055A', 'FA blower A flow', 'T/H', { w: 100 });
    L.loop(622, 530, 'FICFA1055B', 'FA blower B flow', 'T/H', { w: 100 });
    /* gas: cyclone outlet up and over to the backpass */
    L.duct('gas', [[425, 140], [425, 92], [640, 92], [640, 124]], { w: 22, f: fG });
    /* ===== backpass: RH pass and SH pass, tube banks, gas biasing louvres, economizer, outlet hopper ===== */
    L.rect(560, 124, 240, 372, { f: 'url(#h2case)', sw: 1.4 });
    L.rect(568, 132, 224, 356, { f: '#232b33', sw: 1 });
    L.rect(678, 150, 4, 252, { f: '#56616c', sw: 0 });
    L.text(680, 145, 'BACKPASS', { z: 10.5, b: 1, a: 'middle', c: '#ffffff', ls: 1.5 });
    L.text(623, 162, 'RH PASS', { z: 8.5, a: 'middle', c: C.dim, ls: 1 });
    L.text(737, 162, 'SH PASS', { z: 8.5, a: 'middle', c: C.dim, ls: 1 });
    const bank = (x, y, w, h, name) => {
      L.rect(x, y, w, h, { f: 'url(#h2tube)', s: '#1a2129' });
      L.rect(x - 4, y - 2, 4, h + 4, { f: '#9aa6b2', sw: 0.6 });
      L.rect(x + w, y - 2, 4, h + 4, { f: '#9aa6b2', sw: 0.6 });
      L.text(x + w / 2, y + h / 2 + 4, name, { z: 9.5, b: 1, a: 'middle', c: '#ffffff' }).setAttribute('style', 'paint-order:stroke;stroke:#1a2129;stroke-width:4px');
    };
    bank(580, 172, 88, 100, 'REHEATER');
    bank(694, 172, 88, 66, 'FINISH SH');
    bank(694, 246, 88, 26, 'ECO #3');
    bank(580, 282, 88, 40, 'ECO #2R');
    bank(694, 282, 88, 40, 'ECO #2S');
    L.louvre(576, 372, 96, 'HICHR1002A', { ref: 'mv:HICHR1002A', fp: 'HICHR1002A', desc: 'RH gas biasing damper' });
    L.louvre(690, 372, 80, 'HICHR1002B', { ref: 'mv:HICHR1002B', fp: 'HICHR1002B', desc: 'SH gas biasing damper' });
    bank(580, 420, 202, 40, 'ECO #1');
    L.path('M560,496 H800 L776,526 H704 Z', { f: 'url(#h2caseV)', sw: 1.2 });
    L.loop(812, 330, 'HICHR1002A', 'RH gas biasing damper', '%', { lead: [812, 352, 798, 372] });
    L.loop(812, 380, 'HICHR1002B', 'SH gas biasing damper', '%', { lead: [812, 402, 798, 382] });
    /* ===== gas to the air heater; O2 at the air heater inlet ===== */
    L.duct('gas', [[740, 526], [740, 548], [990, 548], [990, 574]], { w: 22, f: fG });
    L.val(770, 575, 'AIFG1122', '%', { w: 40, desc: 'APH inlet flue gas O2 (A)' });
    L.val(836, 575, 'AIFG1123', '%', { w: 40, desc: 'APH inlet flue gas O2 (B)' });
    L.bub(756, 583, 'AT', 756, 559);
    L.bub(822, 583, 'AT', 822, 559);
    L.loop(830, 488, 'AICFG112', 'O2 trim (air demand bias)', '%', { lead: [830, 510, 800, 540] });
    /* ===== tubular air heater H-1052: gas down through the tubes, SA section above, PA section below ===== */
    L.rect(912, 574, 156, 196, { f: 'url(#h2case)', sw: 1.4 });
    L.rect(924, 584, 132, 176, { f: 'url(#h2tube)', s: '#1a2129' });
    L.rect(912, 668, 156, 6, { f: '#56616c', sw: 0.8 });
    for (const [yy, s] of [[598, 'SA'], [690, 'PA']]) {
      L.rect(1068, yy, 14, 62, { f: 'url(#h2case)', rx: 6 });
      L.text(990, yy + 36, s + ' SECTION', { z: 9, b: 1, a: 'middle', c: '#ffffff' }).setAttribute('style', 'paint-order:stroke;stroke:#1a2129;stroke-width:4px');
    }
    L.path('M912,770 H1068 L1018,792 H962 Z', { f: 'url(#h2caseV)', sw: 1.2 });
    L.text(1010, 566, 'AIR HEATER  H-1052', { z: 10, b: 1, c: '#ffffff', ls: 0.5 });
    /* ===== hot air: SA to the furnace walls (lower SA ports), PA to the plenum ===== */
    L.duct('hot', [[912, 604], [330, 604]], { w: 16, f: fS });
    L.text(360, 592, 'HOT SECONDARY AIR  → FRONT / REAR WALL DAMPERS', { z: 9, b: 1, c: '#f3c98a' });
    L.val(560, 628, 'PIFA1088', 'mmH2O', { dp: 0, desc: 'APH outlet to furnace secondary air pressure' });
    L.val(668, 628, 'TIFA1086', '°C', { w: 44, dp: 0, desc: 'APH outlet secondary air temp (A)' });
    L.val(744, 628, 'TIFA1087', '°C', { w: 44, dp: 0, desc: 'APH outlet secondary air temp (B)' });
    L.bub(546, 636, 'PT', 546, 612);
    /* ===== cold air: SAF and PAF from the atmosphere through the inlet dampers to the air heater ===== */
    const intake = (x, y) => {
      L.path(`M${x},${y - 16} H${x + 34} V${y + 16} H${x} Z`, { f: 'url(#h2caseV)' });
      for (let i = -11; i <= 11; i += 5.5) L.line([[x + 4, y + i + 3], [x + 30, y + i - 3]], { c: '#c3ccd5', w: 1.2 });
      L.text(x + 17, y + 30, 'ATM', { z: 9, a: 'middle', c: C.dim });
    };
    /* SAF line */
    intake(40, 800);
    L.duct('air', [[74, 800], [330, 800]], { w: 16, arrow: false, f: fS });
    L.damper(250, 800, 'MCVFA10541', { ref: 'mv:FICFA1081', fp: 'FICFA1081', lx: 264, ly: 768, desc: 'SAF inlet flow control damper (MCV-FA1054-1)' });
    L.val(90, 768, 'FIFA1081', 'T/H', { desc: 'SAF inlet air flow' });
    L.val(176, 768, 'TIFA1082', '°C', { w: 40, dp: 0, desc: 'SAF inlet air temperature' });
    L.bub(110, 826, 'FT', 110, 808);
    L.fan(350, 800, 'F-1054 SAF', 'SAF  F-1054', { r: 20, mx: 388, lx: 424, ly: 822, la: 'start' });
    L.duct('air', [[373, 774], [860, 774], [860, 650], [912, 650]], { w: 16, f: fS });
    L.val(640, 746, 'PIFA1085', 'mmH2O', { dp: 0, desc: 'SAF outlet to APH air pressure' });
    L.bub(626, 754, 'PT', 626, 766);
    L.loop(500, 790, 'FICFA1081', 'Secondary air flow / SAF inlet damper', 'T/H');
    /* PAF line */
    intake(40, 880);
    L.duct('air', [[74, 880], [330, 880]], { w: 16, arrow: false, f: fP });
    L.damper(250, 880, 'MCVFA10531', { ref: 'mv:FICFA1071', fp: 'FICFA1071', lx: 264, ly: 848, desc: 'PAF inlet flow control damper (MCV-FA1053-1)' });
    L.val(90, 848, 'FIFA1071', 'T/H', { desc: 'PAF inlet air flow' });
    L.val(176, 848, 'TIFA1072', '°C', { w: 40, dp: 0, desc: 'PAF inlet air temperature' });
    L.fan(350, 880, 'F-1053 PAF', 'PAF  F-1053', { r: 20, mx: 388, lx: 424, ly: 902, la: 'start' });
    L.duct('air', [[373, 854], [880, 854], [880, 742], [912, 742]], { w: 16, f: fP });
    L.loop(500, 868, 'FICFA1071', 'Primary air flow / PAF inlet damper', 'T/H');
    /* hot PA (drawn after the cold SA riser: it crosses it on a bridge) */
    L.duct('hot', [[912, 704], [560, 704], [560, 718], [290, 718]], { w: 16, f: fP, bridge: true });
    L.text(600, 696, 'HOT PRIMARY AIR  → PLENUM', { z: 9, b: 1, c: '#f3c98a' });
    L.val(330, 740, 'FIFA1079', 'T/H', { desc: 'APH outlet to furnace primary air flow' });
    L.val(420, 740, 'TIFA1076', '°C', { w: 44, dp: 0, desc: 'APH outlet primary air temp (A)' });
    L.val(496, 740, 'TIFA1077', '°C', { w: 44, dp: 0, desc: 'APH outlet primary air temp (B)' });
    L.bub(316, 748, 'FT', 316, 726);
    /* ===== gas: air heater -> ESP -> IDF -> stack ===== */
    L.duct('gas', [[990, 792], [990, 808], [1080, 808], [1080, 742], [1100, 742]], { w: 22, f: fG });
    L.path('M1100,722 L1124,694 V790 L1100,762 Z', { f: 'url(#h2caseV)' });
    L.rect(1124, 690, 200, 104, { f: 'url(#h2case)', sw: 1.4 });
    for (const xx of [1190, 1258]) L.rect(xx, 690, 3, 104, { f: '#3a434c', sw: 0 });
    for (const xx of [1140, 1208, 1276]) {
      L.rect(xx, 668, 34, 22, { f: '#56616c', rx: 2 });
      L.text(xx + 17, 683, 'T/R', { z: 8.5, b: 1, a: 'middle', c: '#fff' });
      L.path(`M${xx - 10},794 H${xx + 44} L${xx + 24},834 H${xx + 10} Z`, { f: 'url(#h2caseV)' });
    }
    L.text(1224, 738, 'ESP', { z: 14, b: 1, a: 'middle', c: '#ffffff', ls: 2 });
    L.text(1224, 754, 'Z-1010 · 3 FIELDS', { z: 9, a: 'middle', c: '#d5dde5' });
    L.path('M1324,694 L1348,722 V762 L1324,790 Z', { f: 'url(#h2caseV)' });
    L.duct('gas', [[1348, 742], [1416, 742]], { w: 22, arrow: false, f: fG });
    L.damper(1380, 742, 'PCDFG10561', { ref: 'mv:PICFG108A', fp: 'PICFG108A', novalue: 1, desc: 'IDF inlet vane control damper (PCD-FG1056-1)' });
    L.loop(1268, 628, 'PICFG108A', 'Furnace pressure / IDF inlet vane', 'mmH2O', { lead: [1366, 672, 1380, 710] });
    L.fan(1440, 742, 'F-1056 IDF', 'IDF  F-1056', { r: 24, below: 1, hc: 1, ly: 813, lx: 1402, la: 'end' });
    L.duct('gas', [[1460, 705], [1500, 705]], { w: 22, f: fG });
    L.loop(1300, 866, 'PICFG108', 'Furnace pressure / IDF hydraulic coupling', 'mmH2O', { lead: [1412, 866, 1424, 818] });
    L.val(1418, 846, 'ZT-LO1756', '%', { ref: 'ABC-008|AI0482', label: 'HC SCOOP', w: 50, desc: 'IDF hydraulic coupling scoop position (ZT-LO1756)' });
    /* stack with the aviation bands and the CEMS probe */
    L.path('M1500,840 L1516,96 H1556 L1572,840 Z', { f: 'url(#h2cylV)', sw: 1.4 });
    L.path('M1516,96 H1556 L1555.2,128 H1516.8 Z', { f: '#d33', s: 'none', sw: 0 });
    L.path('M1516.6,112 H1555.4 L1555.2,120 H1516.8 Z', { f: '#f2f2f2', s: 'none', sw: 0 });
    L.text(1536, 500, 'STACK', { z: 10, b: 1, a: 'middle', c: '#10161c', ls: 1 });
    L.bub(1494, 300, 'AT', 1510, 300);
    /* ===== upper right: live trend, CEMS, combustion air summary ===== */
    const tr = L.trend(842, 84, 476, 220, [
      { name: 'FURNACE PRESS', ref: 'pv:PICFG108', lo: -60, hi: 40, u: 'mmH2O', c: '#4fc3f7', dp: 1 },
      { name: 'O2 APH INLET', ref: 'pv:AICFG112', lo: 0, hi: 21, u: '%', c: '#ffd54f', dp: 1 },
      { name: 'TOTAL AIR', ref: 'ABC-006|SUM out', lo: 0, hi: 800, u: 'T/H', c: '#81c784', dp: 0 },
      { name: 'COAL FLOW', ref: 'pv:FIC-CM', lo: 0, hi: 120, u: 'T/H', c: '#ff8a65', dp: 1 },
      { name: 'BED DP A', tag: 'DPIFG1081', lo: 0, hi: 2000, u: 'mmH2O', c: '#ce93d8', dp: 0 }
    ]);
    L.panel(1332, 220, 150, 132, 'STACK CEMS');
    /* the CEMS analyzers have no DCS tag and no logic signal (007 shows them as plain text): "-----" until the plant model gives them */
    [['O2', '%'], ['NOx', 'ppm'], ['CO', 'ppm'], ['SOx', 'ppm']].forEach(([s, u], i) => {
      L.text(1342, 254 + i * 24, s, { z: 10, b: 1, c: C.lab });
      L.calc(1376, 242 + i * 24, '', u, { w: 50, desc: 'Stack CEMS ' + s + ' (analyzer, no DCS signal)' });
    });
    L.line([[1482, 300], [1484, 300]], { c: '#7d8b99', w: 0.9 });
    L.panel(960, 318, 358, 160, 'COMBUSTION AIR');
    let taf = null,
      coal = null;
    const big = (x, y, label, ref, u, dp, on) => {
      L.text(x, y, label, { z: 10, b: 1, c: C.lab });
      L.val(x, y + 6, label, u, { notag: 1, ref, dp, w: 76, on });
    };
    big(972, 348, 'TOTAL AIR FLOW', 'ABC-006|SUM out', 'T/H', 1, v => ((taf = v), ratio()));
    big(1088, 348, 'COAL FLOW', 'pv:FIC-CM', 'T/H', 1, v => ((coal = v), ratio()));
    big(972, 394, 'PA FLOW', 'pv:FICFA1071', 'T/H', 1);
    big(1088, 394, 'SA FLOW', 'pv:FICFA1081', 'T/H', 1);
    big(972, 440, 'FURNACE PRESS', 'pv:PICFG108', 'mmH2O', 1);
    big(1088, 440, 'O2 (APH INLET)', 'pv:AICFG112', '%', 1);
    L.text(1204, 348, 'AIR / COAL RATIO', { z: 10, b: 1, c: C.lab });
    const sR = L.calc(1204, 354, '', '', { w: 76, dp: 2, desc: 'Total air flow / coal flow' });
    const ratio = () => sR(taf != null && coal != null && coal > 1 ? taf / coal : null);
    L.text(1204, 394, 'MFT', { z: 10, b: 1, c: C.lab });
    const mR = L.rect(1204, 400, 76, 16, { f: C.box, s: C.boxs });
    const mT = L.text(1242, 412.5, '-----', { z: 11, b: 1, a: 'middle', c: C.none });
    api.reg({ t: 'val', tag: '', ref: 'ABC-007|M.0182', v: '' }, X => {
      const ok = X && isFinite(X.v),
        on = ok && X.v > 0.5;
      mT.textContent = !ok ? '-----' : on ? 'TRIPPED' : 'RESET';
      mT.setAttribute('fill', !ok ? C.none : on ? '#fff' : C.stop);
      mR.setAttribute('fill', on ? C.alarm : C.box);
    }, mR);
    tr();
  }
  const SCREENS = { AFG: airFlueGas };
  const NAV = [
    ['UNIT', 'UNIT'],
    ['AFG', '007 AIR & FLUE GAS'],
    ['08', '008 PA / SA'],
    ['09', '009 FLUIDIZING AIR'],
    ['39', '039 RH / SH BIASING'],
    ['38', '038 AIR PREHEATER'],
    ['11', '011 COAL FEEDER'],
    ['33', '033 CCS']
  ];
  window.PLANT_V2 = {
    C,
    draw(g, sys, api) {
      const W = sys.w,
        H = sys.h;
      const defs = S_('defs', {});
      defs.innerHTML = DEFS;
      g.append(defs);
      g.append(S_('rect', { x: 0, y: 0, width: W, height: H, fill: C.bg }));
      const L = lib(g, api);
      L.title(W, sys.num || '', sys.name || sys.title);
      L.banner(W, 44, [
        { k: 'mft', ref: 'ABC-007|M.0182', msg: 'MFT TRIPPED', hi: 1 },
        { k: 'idf', ref: 'ABC-008|M.3304', when: v => v < 0.5, msg: 'IDF F-1056 NOT RUNNING' },
        { k: 'paf', ref: 'ABC-007|M.3302', when: v => v < 0.5, msg: 'PAF F-1053 NOT RUNNING' },
        { k: 'saf', ref: 'ABC-007|M.3303', when: v => v < 0.5, msg: 'SAF F-1054 NOT RUNNING' },
        { k: 'fp', ref: 'pv:PICFG108', when: v => v > 50 || v < -100, msg: 'FURNACE PRESSURE ABNORMAL', hi: 1 }
      ]);
      (SCREENS[sys.screen] || (() => {}))(L, api);
      L.nav(W, H - 36, NAV, sys.id);
    }
  };
  /* the new screens come first in the list of the Plant view; the old ones stay until the new set replaces them */
  window.PLANT_SYS = window.PLANT_SYS || [];
  window.PLANT_SYS.unshift({ id: 'AFG', title: 'AIR & FLUE GAS (new HMI)', num: '007', name: 'AIR & FLUE GAS SYSTEM', src: '7.PNG', w: 1600, h: 960, v2: true, screen: 'AFG', items: [] });
})();
