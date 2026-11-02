/* HSYM.kit: the APPROVED plant HMI kit (user 2026-11-01 / 02, one piece at a time: team-files/hmi-mockups/HMI_KIT_APPROVED.md; drawing
   = team-files/hmi-mockups/hmi-kit-piece.html, artifact 9AtAR2oMupi3AySQZjdP6y), moved 1:1 into the shared library: same shapes,
   sizes, colours and animations. NOT here (not approved yet): furnace, cyclone, back pass, air heater, precipitator, silo, turbine /
   generator, stack, condenser.

   Rules of the kit: one pipe size 4 and duct 6, black outline, square corners, crossing = hop (avoid it), no flow arrow (the moving
   light shows the direction), drain = arrow down + DRAIN, line end = dark pentagon with the colour stripe of the line, symbols after
   the P&ID legend K1AU3-PD-010, a closed valve or a stopped machine has no flow on either side, red = running / open, green =
   stopped / closed, white = a valve on its way (between its limits).

   Use (DOM, after the page's svg is in the document; g = an svg <g>, coordinates = the page's own):
     const K = HSYM.kit;
     const p = K.pump(g, 60, 66, { run: true });      p.set({ run: false });
     K.pipe(g, 'M10 66 L31 66', 'water', { flow: 24 });  K.net(g, [d1, d2], 'cold', { flow: 30 });
     K.valve(g, x, y, 'cv', { pos: 56 })  ('hand' { state: 'closed' | 'opening' | 'open' | 'closing' }, 'xv' { open }, 'mov' { pos })
   Every piece returns { el, set(o) }: set() redraws the piece with the new state (rare), the motion runs on the one 15 Hz clock of
   HSYM (no CSS / SMIL animation, no filter: light on a tablet) and stops with the page. */
(function () {
  const H = (window.HSYM = window.HSYM || {});
  const NS = 'http://www.w3.org/2000/svg';
  const SANS = 'Inter,"Segoe UI",Arial,sans-serif',
    MONO = '"IBM Plex Mono",Consolas,monospace';
  const RUN = '#e5484d',
    STOP = '#2fa56a',
    DK = '#2b333a',
    LT = '#a9b4bd'; /* steel: lighter than the canvas, not white */
  const PW = 4; /* one pipe size for every line; ducts 6 */
  const M = {
    water: '#2f8fc0',
    steam: '#fbfcfd',
    rh: '#a596cf',
    sea: '#2a9d8f',
    oil: '#c9a227',
    cold: '#6fb0d8',
    hot: '#c98a4a',
    gas: '#b85a3c',
    ia: '#8fa3b8',
    ash: '#8a7a66'
  };
  const CANVAS = '#76818b'; /* the page background of the kit (option 3, hmi-bg-options) */
  const TXT = {
    'kit-name': `fill:#0e1216;font:700 13px ${SANS};letter-spacing:.04em`,
    'kit-tag': `fill:#1f262c;font:500 12px ${MONO}`,
    'kit-sub': `fill:#11171c;font:500 11px ${SANS}`,
    'kit-st': `font:700 10px ${SANS};letter-spacing:.12em`
  };
  const fx = s => String(s || '').replace(/var\(--mono\)/g, MONO).replace(/var\(--sans\)/g, SANS);
  function mk(p, n, a, t) {
    const e = document.createElementNS(NS, n);
    for (const k in a) e.setAttribute(k, a[k]);
    if (t != null) e.textContent = t;
    p.appendChild(e);
    return e;
  }
  /* text: the class of the mockup as an inline style, then its own override (st) */
  function T(p, x, y, c, s, a, f, st) {
    const o = { x, y, style: TXT[c] + (st ? ';' + fx(st) : '') };
    if (a) o['text-anchor'] = a;
    if (f) o.fill = f;
    return mk(p, 'text', o, s);
  }
  const rid = p => p + Math.random().toString(36).slice(2);

  /* ---------- the clock and the pieces ---------- */
  const own = new Set();
  let ownIv = 0;
  const clock = fn =>
    H.clock
      ? H.clock(fn)
      : (own.add(fn),
        ownIv ||
          (ownIv = setInterval(() => {
            if (document.hidden) return;
            const t = performance.now() / 1000;
            for (const f of own) if (f(t) === false) own.delete(f);
            if (!own.size) (clearInterval(ownIv), (ownIv = 0));
          }, 66)));
  /* a piece: its own <g>; draw(g, o, mov) draws it in state o; mov(fn) = one motion of this drawing (ends when the piece is redrawn
     or leaves the page) */
  /* a piece out of view does not move (nothing to paint there): one shared observer */
  const IO = window.IntersectionObserver ? new IntersectionObserver(es => es.forEach(e => (e.target._vis = e.isIntersecting))) : null;
  function piece(parent, o, draw) {
    const el = mk(parent, 'g', {});
    if (IO) IO.observe(el);
    let gen = 0;
    const st = Object.assign({}, o);
    const paint = () => {
      const my = ++gen;
      el.replaceChildren();
      let seen = false;
      const mov = fn =>
        clock(t => {
          if (my !== gen) return false;
          if (!el.isConnected) {
            if (seen) return (IO && IO.unobserve(el), false);
            return;
          }
          seen = true;
          if (el._vis !== false) fn(t);
        });
      return draw(el, st, mov);
    };
    /* a drawing may return upd(st): true = it took the new state without a redraw (a valve % that moves inside its limits) */
    const r = { el, st, set: n => (Object.assign(st, n), r.upd && r.upd(st) === true ? r : Object.assign(r, { upd: null }, paint() || {})) };
    Object.assign(r, paint() || {});
    return r;
  }
  /* the shading of the kit (static, no filter): cyl = round body lit from above, ball = round casing lit from top-left, vcyl = vertical
     vessel lit from the left; once per svg */
  function kitDefs(s) {
    const sv = s.ownerSVGElement || (s.tagName === 'svg' ? s : null) || s;
    if (sv.querySelector('#kitCyl')) return;
    const d = mk(sv, 'defs', {});
    const l = mk(d, 'linearGradient', { id: 'kitCyl', x1: 0, y1: 0, x2: 0, y2: 1 });
    for (const t of [[0, '#fff', 0.42], [0.4, '#fff', 0], [0.7, '#000', 0], [1, '#000', 0.28]]) mk(l, 'stop', { offset: t[0], 'stop-color': t[1], 'stop-opacity': t[2] });
    const r = mk(d, 'radialGradient', { id: 'kitBall', cx: 0.36, cy: 0.3, r: 0.8 });
    for (const t of [[0, '#fff', 0.42], [0.5, '#fff', 0], [1, '#000', 0.3]]) mk(r, 'stop', { offset: t[0], 'stop-color': t[1], 'stop-opacity': t[2] });
    const v = mk(d, 'linearGradient', { id: 'kitVcyl', x1: 0, y1: 0, x2: 1, y2: 0 });
    for (const t of [[0, '#000', 0.25], [0.3, '#fff', 0.4], [0.55, '#fff', 0], [1, '#000', 0.3]]) mk(v, 'stop', { offset: t[0], 'stop-color': t[1], 'stop-opacity': t[2] });
  }
  const shade = (s, tag, a, id) => mk(s, tag, Object.assign({}, a, { fill: 'url(#' + id + ')', 'pointer-events': 'none' }));
  const R = (x, y, w, h, f, rx, sh) => ['rect', { x, y, width: w, height: h, rx: rx || 0 }, f, sh];
  /* parts of the SAME colour are outlined together then filled (no seam inside one colour); each colour group is drawn on top of the one
     before with its own full outline, so different colours are parted by a black line */
  function solid(s, parts) {
    kitDefs(s);
    const g = mk(s, 'g', {}),
      order = [];
    for (const p of parts) if (order.indexOf(p[2]) < 0) order.push(p[2]);
    order.sort((a, b) => (a === LT || a === DK ? 0 : 1) - (b === LT || b === DK ? 0 : 1));
    for (const col of order) {
      const grp = parts.filter(p => p[2] === col);
      for (const p of grp) mk(g, p[0], Object.assign({}, p[1], { fill: '#000', stroke: '#000', 'stroke-width': 3.2, 'stroke-linejoin': 'round' }));
      for (const p of grp) mk(g, p[0], Object.assign({}, p[1], { fill: col }));
      for (const p of grp) if (p[3]) mk(g, p[0], Object.assign({}, p[1], { fill: 'url(#' + (p[3] === 'ball' ? 'kitBall' : p[3] === 'vcyl' ? 'kitVcyl' : 'kitCyl') + ')' }));
    }
    return g;
  }
  function win(s, x, y, w, h, rx) {
    const id = rid('wn');
    mk(mk(s, 'clipPath', { id }), 'rect', { x, y, width: w, height: h, rx: rx || 3 });
    const g = mk(s, 'g', { 'clip-path': 'url(#' + id + ')' });
    mk(g, 'rect', { x, y, width: w, height: h, fill: DK });
    return g;
  }
  const winEdge = (s, x, y, w, h, rx) => mk(s, 'rect', { x, y, width: w, height: h, rx: rx || 3, fill: 'none', stroke: '#000', 'stroke-width': 1.2 });
  /* moving particles from (x1, y1) to (x2, y2) with a little spread */
  function stream(g, mov, n, x1, y1, x2, y2, spread, col, r, speed, fade) {
    const a = [];
    for (let i = 0; i < n; i++) a.push({ o: i / n, j: (Math.random() - 0.5) * spread, c: mk(g, 'circle', { r, fill: col }) });
    mov(t =>
      a.forEach(p => {
        const k = (t * speed + p.o) % 1,
          dx = x2 - x1,
          dy = y2 - y1,
          L = Math.hypot(dx, dy) || 1;
        p.c.setAttribute('cx', (x1 + dx * k + (-dy / L) * p.j).toFixed(1));
        p.c.setAttribute('cy', (y1 + dy * k + (dx / L) * p.j).toFixed(1));
        p.c.setAttribute('opacity', (fade ? 1 - k * 0.8 : 0.9).toFixed(2));
      })
    );
  }

  /* ---------- 1, 2, 2b, 2d: pipe and duct (one size, black outline, square corners, moving light = direction) ---------- */
  /* pipe(g, d, med, { flow }): flow = speed of the light (0 = no flow) */
  const pipe = (g, d, m, o = {}) =>
    piece(g, o, (s, st, mov) => {
      const w = st.w >= 10 ? st.w : PW;
      mk(s, 'path', { d, fill: 'none', stroke: '#000000', 'stroke-width': w + 3, 'stroke-linejoin': 'miter' });
      mk(s, 'path', { d, fill: 'none', stroke: M[m], 'stroke-width': w, 'stroke-linejoin': 'miter' });
      if (st.flow) {
        const f = mk(s, 'path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': Math.max(1.5, w * 0.35), 'stroke-dasharray': '46 74', 'stroke-linecap': 'butt', opacity: 0.14 });
        mov(t => f.setAttribute('stroke-dashoffset', (-(t * st.flow) % 120).toFixed(1)));
      }
    });
  /* lines that meet (tee, cross): all outlines first, then all colours, so a junction has no black seam; air / gas = duct 6 */
  const net = (g, ds, m, o = {}) =>
    piece(g, o, (s, st, mov) => {
      const W = st.W || (m === 'cold' || m === 'hot' || m === 'gas' ? 6 : PW);
      for (const d of ds) mk(s, 'path', { d, fill: 'none', stroke: '#000000', 'stroke-width': W + 3, 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt' });
      for (const d of ds) mk(s, 'path', { d, fill: 'none', stroke: M[m], 'stroke-width': W, 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt' });
      if (st.flow)
        for (const d of ds) {
          const f = mk(s, 'path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': W * 0.35, 'stroke-dasharray': '46 74', opacity: 0.14 });
          mov(t => f.setAttribute('stroke-dashoffset', (-(t * st.flow) % 120).toFixed(1)));
        }
    });
  /* 2b crossing = hop: a vertical line (x, y0 -> y1) that hops (radius 12) over a horizontal line at yc */
  const hop = (g, x, y0, yc, y1, m, o) => net(g, [`M${x} ${y0} L${x} ${yc - 12} A12 12 0 0 1 ${x} ${yc + 12} L${x} ${y1}`], m, o);
  /* 2c drain: arrow down in the pipe colour at the end of a vertical line (x, y) and the word DRAIN */
  function drain(g, x, y, m) {
    return piece(g, {}, s => {
      mk(s, 'path', { d: `M${x - 8} ${y} L${x} ${y + 13} L${x + 8} ${y}Z`, fill: M[m], stroke: '#000', 'stroke-width': 2, 'stroke-linejoin': 'miter' });
      T(s, x + 14, y + 12, 'kit-name', 'DRAIN', null, null, 'font-size:11px');
    });
  }
  /* 2e line end to another page (option 3): dark pentagon pointing the way the line flows, colour stripe of the line, all caps;
     (x, y) = top left, 150 x 36; o.go = what a click does */
  function lineEnd(g, x, y, m, t1, t2, o = {}) {
    return piece(g, o, (s, st) => {
      const w = 150,
        h = 36,
        tp = 12,
        L = st.dir === 'L',
        d = L ? [[x + tp, y], [x + w, y], [x + w, y + h], [x + tp, y + h], [x, y + h / 2]] : [[x, y], [x + w - tp, y], [x + w, y + h / 2], [x + w - tp, y + h], [x, y + h]];
      if (st.go) (s.setAttribute('data-hit', 'lineend'), (s.style.cursor = 'pointer'), s.addEventListener('click', e => (e.stopPropagation(), st.go())));
      mk(s, 'path', { d: 'M' + d.map(p => p[0] + ' ' + p[1]).join(' L') + 'Z', fill: '#1d252c', stroke: '#000', 'stroke-width': 2, 'stroke-linejoin': 'miter' });
      const sx = L ? x + w - 6 : x;
      mk(s, 'rect', { x: sx, y, width: 6, height: h, fill: M[m], stroke: '#000', 'stroke-width': 2 });
      const tx = L ? x + 18 : x + 12;
      T(s, tx, y + 15, 'kit-name', t1, 'start', null, 'font-size:11px;letter-spacing:.06em;fill:#f1f4f6');
      T(s, tx, y + 28, 'kit-name', t2, 'start', null, 'font-size:8.5px;font-weight:600;letter-spacing:.08em;fill:#f1f4f6');
    });
  }

  /* ---------- 5, 6: hand, control, shut-off (S) and motor (M) valves: in the line, stem from the valve centre to the head ---------- */
  function bow(s, x, y, col, fill) {
    mk(s, 'path', { d: `M${x - 10} ${y - 7} L${x + 10} ${y + 7} L${x + 10} ${y - 7} L${x - 10} ${y + 7}Z`, fill, stroke: col, 'stroke-width': 1.6, 'stroke-linejoin': 'miter' });
  }
  /* open: false = closed (green), 'trav' = on its way (white), true = open (red); pct = the position text under the valve */
  function valveArt(s, x, y, kind, open, pct) {
    const hi = kind === 'hand' ? 14 : 16;
    mk(s, 'line', { x1: x, y1: y, x2: x, y2: y - hi, stroke: '#000', 'stroke-width': 2.4 });
    const vc = open === 'trav' ? '#eef2f5' : open ? RUN : STOP;
    for (const dx of [-12, 10]) mk(s, 'rect', { x: x + dx, y: y - 6.5, width: 2, height: 13, rx: 0.6, fill: LT, stroke: '#000', 'stroke-width': 0.9 });
    bow(s, x, y, '#000', vc);
    const hc = vc,
      ht = open === 'trav' ? '#1d252c' : '#fff';
    kitDefs(s);
    const spokes = [];
    if (kind === 'cv') {
      const cyl = { x: x - 7, y: y - hi - 17, width: 14, height: 15, rx: 2 };
      mk(s, 'rect', Object.assign({ fill: hc, stroke: '#000', 'stroke-width': 1.6 }, cyl));
      shade(s, 'rect', cyl, 'kitVcyl');
      mk(s, 'rect', { x: x - 8.5, y: y - hi - 19.5, width: 17, height: 3.5, rx: 1.2, fill: LT, stroke: '#000', 'stroke-width': 1.1 });
      mk(s, 'rect', { x: x - 2, y: y - hi - 22, width: 4, height: 3, fill: LT, stroke: '#000', 'stroke-width': 0.9 });
      mk(s, 'rect', { x: x - 8.5, y: y - hi - 3, width: 17, height: 3.5, rx: 1.2, fill: LT, stroke: '#000', 'stroke-width': 1.1 });
    }
    if (kind === 'hand') {
      mk(s, 'rect', { x: x - 3, y: y - 7, width: 6, height: 3, rx: 0.8, fill: LT, stroke: '#000', 'stroke-width': 0.9 });
      mk(s, 'line', { x1: x - 8.5, y1: y - hi, x2: x + 8.5, y2: y - hi, stroke: '#000', 'stroke-width': 2.2 });
      mk(s, 'ellipse', { cx: x, cy: y - hi, rx: 9, ry: 2.8, fill: 'none', stroke: '#000', 'stroke-width': 3.2 });
      mk(s, 'ellipse', { cx: x, cy: y - hi, rx: 9, ry: 2.8, fill: 'none', stroke: LT, 'stroke-width': 1.5 });
      for (const k of [0, 1]) {
        const a = (k * Math.PI) / 2;
        spokes.push([mk(s, 'line', { x1: x - 8 * Math.cos(a), y1: y - hi - 2.5 * Math.sin(a), x2: x + 8 * Math.cos(a), y2: y - hi + 2.5 * Math.sin(a), stroke: LT, 'stroke-width': 0.9 }), x, y - hi, k]);
      }
      mk(s, 'circle', { cx: x, cy: y - hi, r: 1.6, fill: LT, stroke: '#000', 'stroke-width': 0.8 });
    }
    if (kind === 'mov') {
      mk(s, 'circle', { cx: x + 12, cy: y - hi - 8, r: 4, fill: 'none', stroke: '#000', 'stroke-width': 2.6 });
      mk(s, 'circle', { cx: x + 12, cy: y - hi - 8, r: 4, fill: 'none', stroke: LT, 'stroke-width': 1.2 });
      const mb = { x: x - 9, y: y - hi - 15, width: 18, height: 15, rx: 2 };
      mk(s, 'rect', Object.assign({ fill: hc, stroke: '#000', 'stroke-width': 1.6 }, mb));
      shade(s, 'rect', mb, 'kitCyl');
      T(s, x, y - hi - 4, 'kit-st', 'M', 'middle', null, 'fill:' + ht);
    }
    if (kind === 'xv') {
      mk(s, 'rect', { x: x - 2, y: y - hi - 18, width: 4, height: 4, fill: LT, stroke: '#000', 'stroke-width': 1 });
      const xb = { x: x - 8, y: y - hi - 14, width: 16, height: 14, rx: 1.5 };
      mk(s, 'rect', Object.assign({ fill: hc, stroke: '#000', 'stroke-width': 1.6 }, xb));
      shade(s, 'rect', xb, 'kitCyl');
      T(s, x, y - hi - 3.5, 'kit-st', 'S', 'middle', null, 'fill:' + ht);
    }
    const tx = pct != null ? T(s, x, y + 24, 'kit-tag', pct + ' %', 'middle', null, 'fill:#0b0f13;font-weight:600') : null;
    if (tx) tx.dataset.v = pct;
    return { spokes, tx };
  }
  /* the hand wheel turning (seen from above: counterclockwise opens, clockwise closes) */
  const turn = (spokes, an0) =>
    spokes.forEach(([l, c, cy, k]) => {
      const an = an0 + (k * Math.PI) / 2;
      l.setAttribute('x1', (c - 8 * Math.cos(an)).toFixed(2));
      l.setAttribute('y1', (cy - 2.5 * Math.sin(an)).toFixed(2));
      l.setAttribute('x2', (c + 8 * Math.cos(an)).toFixed(2));
      l.setAttribute('y2', (cy + 2.5 * Math.sin(an)).toFixed(2));
    });
  /* the state of a valve: cv / mov { pos 0..100 }: green at 0 (close limit), red at 100 (open limit), white between; xv { open };
     hand { state: 'closed' | 'opening' | 'open' | 'closing' } */
  function vstate(kind, st) {
    if (kind === 'hand') return st.state === 'open' ? true : st.state === 'opening' || st.state === 'closing' ? 'trav' : false;
    if (kind === 'xv') return st.open === 'trav' ? 'trav' : !!st.open;
    const p = st.pos == null ? 0 : +st.pos;
    return p <= 0.5 ? false : p >= 99.5 ? true : 'trav';
  }
  const valve = (g, x, y, kind, o = {}) =>
    piece(g, o, (s, st, mov) => {
      const open = vstate(kind, st),
        hs = st.state,
        pc = q => (q.pos == null ? null : Number.isInteger(+q.pos) ? +q.pos : (+q.pos).toFixed(1)),
        pct = kind === 'cv' || kind === 'mov' ? pc(st) : null;
      const v = valveArt(s, x, y, kind, open, pct);
      if (kind === 'hand' && open === 'trav') {
        const dir = st.state === 'opening' ? -1 : 1;
        mov(t => turn(v.spokes, dir * t * 7));
      }
      /* the same state (and limits): only the % text changes */
      return { upd: n => (kind === 'hand' ? n.state === hs : vstate(kind, n) === open && !!v.tx === (pc(n) != null) && (!v.tx || ((v.tx.textContent = pc(n) + ' %'), true))) };
    });
  /* a valve in its line (x0 -> x1 at y, valve at xv): flow before it while the line has flow (o.flow), after it only while it is open
     (slow while it travels); the 8c rule of the kit */
  const vline = (g, x0, x1, y, xv, kind, o = {}) =>
    piece(g, Object.assign({ flow: 1 }, o), (s, st) => {
      const open = vstate(kind, st);
      pipe(s, `M${x0} ${y} L${xv - 10} ${y}`, 'water', { flow: st.flow ? 24 : 0 });
      pipe(s, `M${xv + 10} ${y} L${x1} ${y}`, 'water', { flow: !st.flow ? 0 : open === 'trav' ? 12 : open ? 24 : 0 });
      const v = valve(s, xv, y, kind, st),
        open0 = open,
        f0 = st.flow;
      return { valve: v, upd: n => vstate(kind, n) === open0 && n.flow === f0 && (v.set(n), true) };
    });
  /* 8 check valve (P&ID legend PD-010): two end bars, swing disc on the diagonal with the arrowhead pointing the way of the flow; one
     solid shape; (x, y) = the centre of the gap (22 long) */
  function check(g, x, y) {
    return piece(g, {}, s => {
      const ox = x - 130,
        oy = y - 52;
      const p = [[119, 63], [119, 41], [121, 41], [135.93, 56.94], [137.39, 55.57], [139.3, 62], [133.01, 59.67], [134.47, 58.3], [121, 43.93], [121, 63]];
      mk(s, 'path', { d: 'M' + p.map(q => (q[0] + ox).toFixed(2) + ' ' + (q[1] + oy).toFixed(2)).join(' L') + 'Z', fill: '#000' });
      mk(s, 'rect', { x: 139 + ox, y: 41 + oy, width: 2, height: 22, fill: '#000' });
    });
  }

  /* ---------- 9 ~ 13: pump, motor, blower, fan, damper (own design, one baseplate, status colour on the machine) ---------- */
  function motorParts(x, y, run, base) {
    const c = run ? RUN : STOP;
    return [
      R(x + 9, y + 10, 4, base - y - 10, LT),
      R(x + 30, y + 10, 4, base - y - 10, LT),
      R(x + 7, base - 2, 8, 3, LT),
      R(x + 28, base - 2, 8, 3, LT),
      R(x + 14, y - 17, 13, 7, LT, 1, 'cyl'),
      R(x + 27, y - 15, 4, 3, LT),
      R(x + 6, y - 15, 5, 5, LT, 2.5),
      R(x - 1, y - 9, 5, 18, LT, 1, 'cyl'),
      R(x + 34, y - 9, 11, 18, LT, 3, 'cyl'),
      R(x + 3, y - 11, 33, 22, c, 3, 'cyl')
    ];
  }
  function motorDetail(s, x, y) {
    for (let i = 0; i < 4; i++) mk(s, 'line', { x1: x + 6, y1: y - 6 + i * 4, x2: x + 33, y2: y - 6 + i * 4, stroke: '#000', 'stroke-width': 1.1, opacity: 0.28 });
    for (let j = 0; j < 3; j++) mk(s, 'line', { x1: x + 38.5 + j * 2.6, y1: y - 5, x2: x + 38.5 + j * 2.6, y2: y + 5, stroke: '#000', 'stroke-width': 1.1, opacity: 0.7 });
    mk(s, 'rect', { x: x + 15, y: y - 4, width: 9, height: 6, rx: 1, fill: DK, opacity: 0.55 }); /* name plate */
    mk(s, 'line', { x1: x + 17, y1: y - 14, x2: x + 24, y2: y - 14, stroke: '#000', 'stroke-width': 1, opacity: 0.6 });
  }
  function impeller(s, mov, cx, cy, r, run, speed, n) {
    n = n || 5;
    const g = mk(s, 'g', {});
    for (let a = 0; a < n; a++) {
      const t = (a * 2 * Math.PI) / n;
      mk(g, 'path', { d: `M${cx} ${cy} Q${(cx + Math.cos(t + 0.7) * r * 0.6).toFixed(1)} ${(cy + Math.sin(t + 0.7) * r * 0.6).toFixed(1)} ${(cx + Math.cos(t) * r).toFixed(1)} ${(cy + Math.sin(t) * r).toFixed(1)}`, fill: 'none', stroke: DK, 'stroke-width': 2 });
    }
    mk(s, 'circle', { cx, cy, r: 3, fill: LT, stroke: '#000', 'stroke-width': 1.2 });
    if (run) mov(t => g.setAttribute('transform', 'rotate(' + ((t * speed) % 360).toFixed(1) + ' ' + cx + ' ' + cy + ')'));
  }
  const pedestal = (cx, cy, b) => ['path', { d: `M${cx - 8} ${cy + 10} L${cx - 12} ${b} L${cx + 12} ${b} L${cx + 8} ${cy + 10}Z` }, LT];
  /* bearing housing + coupling guard between casing and motor */
  const drive = (cx, cy, x0) => [R(x0, cy - 5, 9, 10, LT, 1, 'cyl'), R(x0 + 9, cy - 2, 3, 4, LT), R(cx + 21, cy - 6, 4, 12, LT, 1, 'cyl')];
  function bolts(s, cx, cy, r, n) {
    for (let i = 0; i < n; i++) {
      const t = (i * 2 * Math.PI) / n + 0.3;
      mk(s, 'circle', { cx: (cx + Math.cos(t) * r).toFixed(1), cy: (cy + Math.sin(t) * r).toFixed(1), r: 0.9, fill: DK, opacity: 0.8 });
    }
  }
  /* 9 pump set (cx, cy = casing centre): suction flange on the centre line at cx - 29, discharge centred on top at cy - 29 */
  const pump = (g, cx, cy, o = {}) =>
    piece(g, o, (s, st, mov) => {
      const run = !!st.run,
        c = run ? RUN : STOP,
        b = cy + 24;
      solid(s, [R(cx - 18, b, 90, 5, LT), pedestal(cx, cy, b)].concat(drive(cx, cy, cx + 12), [R(cx - 29, cy - 8, 3, 16, LT), R(cx - 8, cy - 29, 16, 3, LT), R(cx - 26, cy - 5, 13, 10, c, 0, 'cyl'), R(cx - 5, cy - 26, 10, 13, c), ['circle', { cx, cy, r: 15 }, c, 'ball']], motorParts(cx + 24, cy, run, b)));
      bolts(s, cx, cy, 13.2, 10);
      impeller(s, mov, cx, cy, 11, run, 300);
      motorDetail(s, cx + 24, cy);
    });
  /* 10 motor alone (x = shaft face, y = shaft line, base = floor) */
  const motor = (g, x, y, o = {}) =>
    piece(g, o, (s, st) => {
      const base = st.base != null ? st.base : y + 22;
      solid(s, [R(x - 7, base, 59, 5, LT)].concat(motorParts(x, y, !!st.run, base)));
      motorDetail(s, x, y);
    });
  /* 11 blower set: same size, baseplate, drive and motor as the pump; outlet straight up at cx + 12.5, air inlet at cx - 19 */
  const blower = (g, cx, cy, o = {}) =>
    piece(g, o, (s, st, mov) => {
      const run = !!st.run,
        c = run ? RUN : STOP,
        b = cy + 24;
      solid(
        s,
        [R(cx - 18, b, 90, 5, LT), pedestal(cx, cy, b)].concat(
          drive(cx, cy, cx + 14)
            .slice(0, 1)
            .map(p => ((p[1].width = 7), p)),
          drive(cx, cy, cx + 12).slice(1),
          [R(cx + 5.5, cy - 29, 14, 3, LT), R(cx - 19, cy - 8, 3, 16, LT), ['path', { d: `M${cx + 17} ${cy - 26} L${cx + 17} ${cy} A17 17 0 0 1 ${cx} ${cy + 17} A16 16 0 0 1 ${cx - 16} ${cy} A15.5 15.5 0 0 1 ${cx + 8} ${cy - 12.6} L${cx + 8} ${cy - 26}Z` }, c, 'ball']],
          motorParts(cx + 24, cy, run, b)
        )
      );
      impeller(s, mov, cx, cy, 11, run, 260, st.n);
      mk(s, 'circle', { cx, cy, r: 6, fill: 'none', stroke: '#000', 'stroke-width': 1.2, opacity: 0.45 });
      motorDetail(s, cx + 24, cy);
    });
  /* 12 fan (induced draft, primary air, secondary air): inlet box (casing height) fed by the duct at cx - 35, widening outlet up into
     the duct at cx + 12.5, 8 blades, motor on its own stool */
  const fan = (g, cx, cy, o = {}) =>
    piece(g, o, (s, st, mov) => {
      const run = !!st.run,
        c = run ? RUN : STOP,
        b = cy + 24,
        x = cx + 24;
      solid(
        s,
        [
          R(cx - 35, b, cx + 69 - (cx - 35), 5, LT),
          pedestal(cx, cy, b),
          R(cx - 30, cy + 17, 12, b - cy - 17, LT),
          R(x - 1, cy + 11, 46, b - cy - 11, LT, 1),
          R(cx + 14, cy - 5, 7, 10, LT, 1, 'cyl'),
          R(cx + 21, cy - 2, 3, 4, LT),
          R(cx + 21, cy - 6, 4, 12, LT, 1, 'cyl'),
          R(cx - 35, cy - 8, 3, 16, LT),
          R(cx + 4, cy - 31, 17, 3, LT),
          ['path', { d: `M${cx + 8} ${cy - 18} L${cx + 6} ${cy - 28} L${cx + 19} ${cy - 28} L${cx + 17} ${cy - 18}Z` }, c, 'cyl'],
          R(cx - 32, cy - 17, 16, 34, c, 2, 'cyl'),
          ['path', { d: `M${cx + 17} ${cy - 20} L${cx + 17} ${cy} A17 17 0 0 1 ${cx} ${cy + 17} A16 16 0 0 1 ${cx - 16} ${cy} A15.5 15.5 0 0 1 ${cx + 8} ${cy - 12.6} L${cx + 8} ${cy - 20}Z` }, c, 'ball']
        ].concat(motorParts(x, cy, run, cy + 11))
      );
      impeller(s, mov, cx, cy, 11, run, 260, 8);
      mk(s, 'circle', { cx, cy, r: 6, fill: 'none', stroke: '#000', 'stroke-width': 1.2, opacity: 0.45 });
      motorDetail(s, x, cy);
    });
  /* 13 fan damper in the duct (x, y = centre): louver box, four blades at the % open, actuator with a dial on top; ducts end at x -/+ 23 */
  const damper = (g, x, y, o = {}) => piece(g, o, (s, st) => damperArt(s, x, y, +st.pct || 0));
  function damperArt(s, x, y, pct) {
    const c = pct > 0 ? RUN : STOP,
      a = 90 * (1 - pct / 100);
    solid(s, [
      ['path', { d: `M${x - 21} ${y - 6} L${x - 11} ${y - 14} L${x - 11} ${y + 14} L${x - 21} ${y + 6}Z` }, LT, 'cyl'],
      ['path', { d: `M${x + 21} ${y - 6} L${x + 11} ${y - 14} L${x + 11} ${y + 14} L${x + 21} ${y + 6}Z` }, LT, 'cyl'],
      R(x - 23, y - 7, 2, 14, LT),
      R(x + 21, y - 7, 2, 14, LT),
      R(x - 2, y - 25, 4, 8, LT),
      R(x - 14, y - 37, 3, 13, DK, 1),
      R(x + 11, y - 37, 3, 13, DK, 1),
      R(x - 11, y - 38, 22, 15, LT, 4, 'cyl'),
      R(x - 11, y - 17, 22, 34, c, 2, 'cyl')
    ]);
    mk(s, 'rect', { x: x - 7, y: y - 13, width: 14, height: 26, fill: DK, stroke: '#000', 'stroke-width': 1.2 });
    const cid = rid('dw');
    mk(mk(s, 'clipPath', { id: cid }), 'rect', { x: x - 7, y: y - 13, width: 14, height: 26 });
    const bl = mk(s, 'g', { 'clip-path': 'url(#' + cid + ')' }); /* blades stay inside the window */
    for (const o of [-9.75, -3.25, 3.25, 9.75]) {
      mk(bl, 'line', { x1: x - 5, y1: y + o, x2: x + 5, y2: y + o, stroke: LT, 'stroke-width': 2.6, 'stroke-linecap': 'round', transform: 'rotate(' + a + ' ' + x + ' ' + (y + o) + ')' });
      mk(bl, 'circle', { cx: x, cy: y + o, r: 1.1, fill: '#000' });
    }
    mk(s, 'circle', { cx: x, cy: y - 30.5, r: 5.2, fill: DK, stroke: '#000', 'stroke-width': 1.2 });
    mk(s, 'line', { x1: x - 4, y1: y - 30.5, x2: x + 4, y2: y - 30.5, stroke: '#f1f4f6', 'stroke-width': 1.8, 'stroke-linecap': 'round', transform: 'rotate(' + a + ' ' + x + ' ' + (y - 30.5) + ')' });
    mk(s, 'circle', { cx: x, cy: y - 30.5, r: 1, fill: '#f1f4f6' });
    T(s, x, y + 32, 'kit-tag', pct + ' %', 'middle', null, 'fill:#0b0f13;font-weight:600');
  }

  /* ---------- 14 ~ 16: vertical tank, heat exchanger, horizontal drum (cutaway windows) ---------- */
  function liquid(s, mov, x, y, w, h, frac, m) {
    const id = rid('lq');
    mk(mk(s, 'clipPath', { id }), 'rect', { x, y, width: w, height: h });
    const g = mk(s, 'g', { 'clip-path': 'url(#' + id + ')' }),
      ly = y + h * (1 - frac);
    mk(g, 'rect', { x, y: ly, width: w, height: h * frac, fill: M[m] });
    const wv = mk(g, 'path', { d: '', fill: '#fff', opacity: 0.22 });
    mov(t => {
      let d = 'M' + x + ' ' + (ly + 3);
      for (let i = 0; i <= w; i += 4) d += ' L' + (x + i) + ' ' + (ly + Math.sin(t * 2.2 + i * 0.35) * 1.2).toFixed(1);
      wv.setAttribute('d', d + ' L' + (x + w) + ' ' + (ly + 3) + 'Z');
    });
  }
  /* 14 vertical tank (x = centre, y = top of the shell, 64 high): top inlet at (x, y - 17), side outlet at (x + 33, y + 57) */
  const tank = (g, x, y, o = {}) =>
    piece(g, o, (s, st, mov) => {
      const h = 64,
        frac = Math.max(0, Math.min(1, st.level == null ? 0 : st.level)),
        m = st.med || 'water';
      kitDefs(s);
      const body = { d: `M${x - 22} ${y} L${x - 22} ${y + h} A22 8 0 0 0 ${x + 22} ${y + h} L${x + 22} ${y} A22 8 0 0 0 ${x - 22} ${y}Z` };
      solid(s, [R(x - 18, y + h + 4, 5, 14, LT), R(x + 13, y + h + 4, 5, 14, LT), R(x - 4, y - 15, 8, 8, LT), R(x - 7, y - 17, 14, 3, LT), R(x + 22, y + h - 11, 8, 8, LT), R(x + 30, y + h - 13, 3, 12, LT), ['path', body, LT]]);
      shade(s, 'path', body, 'kitVcyl');
      mk(s, 'rect', { x: x - 13, y: y + 3, width: 26, height: h - 6, rx: 3, fill: DK, stroke: '#000', 'stroke-width': 1.2 });
      liquid(s, mov, x - 13, y + 3, 26, h - 6, frac, m);
      for (let i = 1; i < 4; i++) mk(s, 'line', { x1: x - 13, y1: y + 3 + ((h - 6) * i) / 4, x2: x - 9, y2: y + 3 + ((h - 6) * i) / 4, stroke: '#f1f4f6', 'stroke-width': 1, opacity: 0.7 });
      mk(s, 'rect', { x: x - 13, y: y + 3, width: 26, height: h - 6, rx: 3, fill: 'none', stroke: '#000', 'stroke-width': 1.2 });
      if (st.label !== false) T(s, x, y + 110, 'kit-tag', 'LEVEL ' + Math.round(frac * 100) + ' %', 'middle', null, 'fill:#0b0f13;font-weight:600');
    });
  /* 15 heat exchanger (shell and tube, U-tubes; x = tubesheet, y = axis): cold water in at the lower channel nozzle (x - 8, y + 36),
     heated water out at the upper one (x - 8, y - 36), steam in at the top (x + 120, y - 36), condensate out at the bottom
     (x + 74, y + 36) */
  const hx = (g, x, y, o = {}) =>
    piece(g, o, (s, st, mov) => {
      const r = 26,
        yc = y - 5,
        tm = st.tm || 'water',
        sm = st.sm || 'steam',
        flow = st.flow || 0;
      kitDefs(s);
      const shell = { d: `M${x} ${y - r} L${x + 146} ${y - r} A15 ${r} 0 0 1 ${x + 146} ${y + r} L${x} ${y + r}Z` },
        chan = { d: `M${x} ${y - r} L${x - 14} ${y - r} A11 ${r} 0 0 0 ${x - 14} ${y + r} L${x} ${y + r}Z` };
      solid(s, [
        ['path', { d: `M${x + 20} ${y + 20} L${x + 16} ${y + 36} L${x + 40} ${y + 36} L${x + 36} ${y + 20}Z` }, LT],
        ['path', { d: `M${x + 112} ${y + 20} L${x + 108} ${y + 36} L${x + 132} ${y + 36} L${x + 128} ${y + 20}Z` }, LT],
        R(x - 12, y - r - 8, 8, 8, LT),
        R(x - 15, y - r - 10, 14, 3, LT),
        R(x - 12, y + r, 8, 8, LT),
        R(x - 15, y + r + 7, 14, 3, LT),
        R(x + 116, y - r - 8, 8, 8, LT),
        R(x + 113, y - r - 10, 14, 3, LT),
        R(x + 70, y + r, 8, 8, LT),
        R(x + 67, y + r + 7, 14, 3, LT),
        ['path', chan, LT],
        ['path', shell, LT]
      ]);
      shade(s, 'path', shell, 'kitCyl');
      shade(s, 'path', chan, 'kitCyl');
      solid(s, [R(x - 2, y - r - 3, 4, 2 * r + 6, DK, 1)]);
      const wx = x - 13,
        ww = 156,
        wy = y - 21,
        wh = 42,
        id = rid('hw'),
        py = y + 11;
      mk(mk(s, 'clipPath', { id }), 'rect', { x: wx, y: wy, width: ww, height: wh, rx: 3 });
      const w = mk(s, 'g', { 'clip-path': 'url(#' + id + ')' });
      mk(w, 'rect', { x: wx, y: wy, width: ww, height: wh, fill: DK });
      mk(w, 'rect', { x: x + 2, y: wy, width: ww - 15, height: wh, fill: M[sm], opacity: 0.3 }); /* steam around the tubes */
      mk(w, 'rect', { x: x + 2, y: py, width: ww - 15, height: wy + wh - py, fill: M[tm] }); /* condensate pool */
      const wv = mk(w, 'path', { d: '', fill: '#fff', opacity: 0.3 });
      mov(t => {
        let d = 'M' + (x + 2) + ' ' + (py + 3);
        for (let i = 0; i <= ww - 15; i += 5) d += ' L' + (x + 2 + i) + ' ' + (py + Math.sin(t * 2 + i * 0.3) * 1).toFixed(1);
        wv.setAttribute('d', d + ' L' + (x + ww - 13) + ' ' + (py + 3) + 'Z');
      });
      if (flow)
        [22, 58, 94, 118].forEach((o2, k) => {
          const dp = mk(w, 'circle', { cx: x + o2, cy: 0, r: 1.3, fill: '#e9f3fa' });
          mov(t => {
            const p = (t * 0.9 + k * 0.37) % 1;
            dp.setAttribute('cy', (yc + 14 + p * (py - yc - 13)).toFixed(1));
            dp.setAttribute('opacity', (1 - p * 0.6).toFixed(2));
          });
        });
      mk(w, 'rect', { x: wx, y: wy, width: 11, height: yc - wy, fill: '#e8742f' }); /* upper half: heated water out */
      mk(w, 'rect', { x: wx, y: yc, width: 11, height: wy + wh - yc, fill: M[tm] }); /* lower half: cold water in */
      mk(w, 'rect', { x: wx, y: yc - 2.2, width: 13, height: 4.4, fill: '#c3ccd3', stroke: '#000', 'stroke-width': 1.2 }); /* pass partition plate */
      if (flow)
        for (const d of [`M${x - 8} ${wy + wh} L${x - 8} ${yc + 8} L${x + 2} ${yc + 8}`, `M${x + 2} ${yc - 8} L${x - 8} ${yc - 8} L${x - 8} ${wy}`]) {
          const f = mk(w, 'path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 6', opacity: 0.8 });
          mov(t => f.setAttribute('stroke-dashoffset', (-(t * flow * 0.6) % 6.1).toFixed(2)));
        }
      for (const b of [[40, 1], [75, -1], [108, 1]]) mk(w, 'rect', { x: x + b[0] - 1.2, y: b[1] > 0 ? wy : yc - 6, width: 2.4, height: b[1] > 0 ? yc + 10 - wy : py - yc + 6, fill: '#c3ccd3' }); /* baffles */
      /* the water warms up along its way: cold blue in the lower legs, warming through the U-bend, hot orange in the upper legs */
      const COLD = M[tm],
        HOT = '#e8742f',
        gid = rid('hg'),
        df = mk(s, 'defs', {});
      const gl = mk(df, 'linearGradient', { id: gid + 'a', gradientUnits: 'userSpaceOnUse', x1: x + 2, y1: 0, x2: x + 138, y2: 0 });
      mk(gl, 'stop', { offset: 0, 'stop-color': COLD });
      mk(gl, 'stop', { offset: 1, 'stop-color': '#9a6fb0' });
      const gu = mk(df, 'linearGradient', { id: gid + 'b', gradientUnits: 'userSpaceOnUse', x1: x + 138, y1: 0, x2: x + 2, y2: 0 });
      mk(gu, 'stop', { offset: 0, 'stop-color': '#c0607a' });
      mk(gu, 'stop', { offset: 1, 'stop-color': HOT });
      const gb = mk(df, 'linearGradient', { id: gid + 'c', gradientUnits: 'userSpaceOnUse', x1: 0, y1: yc + 12, x2: 0, y2: yc - 12 });
      mk(gb, 'stop', { offset: 0, 'stop-color': '#9a6fb0' });
      mk(gb, 'stop', { offset: 1, 'stop-color': '#c0607a' });
      for (const rr of [12, 8, 4]) {
        const lo = `M${x + 2} ${yc + rr} L${x + 126} ${yc + rr}`,
          bend = `M${x + 126} ${yc + rr} A${rr} ${rr} 0 0 0 ${x + 126} ${yc - rr}`,
          up = `M${x + 126} ${yc - rr} L${x + 2} ${yc - rr}`,
          all = lo + ` A${rr} ${rr} 0 0 0 ${x + 126} ${yc - rr} L${x + 2} ${yc - rr}`;
        mk(w, 'path', { d: all, fill: 'none', stroke: '#000', 'stroke-width': 3.6 });
        mk(w, 'path', { d: lo, fill: 'none', stroke: 'url(#' + gid + 'a)', 'stroke-width': 2.2 });
        mk(w, 'path', { d: bend, fill: 'none', stroke: 'url(#' + gid + 'c)', 'stroke-width': 2.2 });
        mk(w, 'path', { d: up, fill: 'none', stroke: 'url(#' + gid + 'b)', 'stroke-width': 2.2 });
        if (flow) {
          const f = mk(w, 'path', { d: all, fill: 'none', stroke: '#fff', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 9', opacity: 0.75 });
          mov(t => f.setAttribute('stroke-dashoffset', (-(t * flow * 0.6) % 9.1).toFixed(2)));
        }
      }
      mk(w, 'rect', { x: x - 2, y: wy, width: 4, height: wh, fill: '#c3ccd3', stroke: '#000', 'stroke-width': 1 }); /* tubesheet */
      mk(s, 'rect', { x: wx, y: wy, width: ww, height: wh, rx: 3, fill: 'none', stroke: '#000', 'stroke-width': 1.2 });
    });
  /* 16 horizontal drum (deaerator, flash tank; x = left end of the shell, y = axis): water in at (x + 30, y - 30), steam / vent out at
     (x + 100, y - 30), water out at (x + 65, y + 30) */
  const drum = (g, x, y, o = {}) =>
    piece(g, o, (s, st, mov) => {
      const r = 20,
        L = 130,
        frac = Math.max(0, Math.min(1, st.level == null ? 0 : st.level));
      kitDefs(s);
      const body = { d: `M${x} ${y - r} L${x + L} ${y - r} A12 ${r} 0 0 1 ${x + L} ${y + r} L${x} ${y + r} A12 ${r} 0 0 1 ${x} ${y - r}Z` };
      solid(s, [
        ['path', { d: `M${x + 14} ${y + 14} L${x + 10} ${y + 30} L${x + 34} ${y + 30} L${x + 30} ${y + 14}Z` }, LT],
        ['path', { d: `M${x + 100} ${y + 14} L${x + 96} ${y + 30} L${x + 120} ${y + 30} L${x + 116} ${y + 14}Z` }, LT],
        R(x + 26, y - r - 8, 8, 8, LT),
        R(x + 23, y - r - 10, 14, 3, LT),
        R(x + 96, y - r - 8, 8, 8, LT),
        R(x + 93, y - r - 10, 14, 3, LT),
        R(x + 61, y + r, 8, 8, LT),
        R(x + 58, y + r + 7, 14, 3, LT),
        ['path', body, LT]
      ]);
      shade(s, 'path', body, 'kitCyl');
      const wx = x + 4,
        wy = y - 14,
        ww = L - 8,
        wh = 28,
        ly = wy + wh * (1 - frac),
        id = rid('dw');
      mk(mk(s, 'clipPath', { id }), 'rect', { x: wx, y: wy, width: ww, height: wh, rx: 3 });
      const w = mk(s, 'g', { 'clip-path': 'url(#' + id + ')' });
      mk(w, 'rect', { x: wx, y: wy, width: ww, height: wh, fill: DK });
      mk(w, 'rect', { x: wx, y: wy, width: ww, height: ly - wy, fill: M.steam, opacity: 0.28 });
      mk(w, 'rect', { x: wx, y: ly, width: ww, height: wy + wh - ly, fill: M.water });
      const wv = mk(w, 'path', { d: '', fill: '#fff', opacity: 0.3 });
      mov(t => {
        let d = 'M' + wx + ' ' + (ly + 3);
        for (let i = 0; i <= ww; i += 5) d += ' L' + (wx + i) + ' ' + (ly + Math.sin(t * 2 + i * 0.3) * 1).toFixed(1);
        wv.setAttribute('d', d + ' L' + (wx + ww) + ' ' + (ly + 3) + 'Z');
      });
      if (st.flow)
        [16, 38, 61, 84, 107].forEach((o2, k) => {
          const b = mk(w, 'circle', { cx: wx + o2, cy: 0, r: 1.2, fill: '#e9f3fa' });
          mov(t => {
            const p = (t * 0.6 + k * 0.29) % 1;
            b.setAttribute('cy', (wy + wh - 2 - p * (wy + wh - 2 - ly)).toFixed(1));
            b.setAttribute('opacity', (0.9 - p * 0.6).toFixed(2));
          });
        });
      for (let i = 1; i < 4; i++) mk(w, 'line', { x1: wx, y1: wy + (wh * i) / 4, x2: wx + 4, y2: wy + (wh * i) / 4, stroke: '#f1f4f6', 'stroke-width': 1, opacity: 0.7 });
      mk(s, 'rect', { x: wx, y: wy, width: ww, height: wh, rx: 3, fill: 'none', stroke: '#000', 'stroke-width': 1.2 });
      if (st.label !== false) T(s, x, y + 56, 'kit-tag', 'LEVEL ' + Math.round(frac * 100) + ' %', null, null, 'fill:#0b0f13;font-weight:600');
    });

  /* ---------- 18 ~ 20, 34: value box, name plate, permissive button, motor status ---------- */
  /* 18 value box 47 x 13 (x, y = top left of the box): description and tag above, value and unit inside; alarm = border colour */
  const vbox = (g, x, y, o = {}) =>
    piece(g, o, (s, st) => {
      const w = 47,
        h = 13,
        ac = st.st === 'hi' ? '#e5484d' : st.st === 'lo' ? '#e0a63a' : null;
      T(s, x, y - 8, 'kit-name', st.desc || '', null, null, 'font-size:4.3px;letter-spacing:.03em;fill:#1d252c');
      T(s, x, y - 2, 'kit-name', st.tag || '', null, null, 'font-size:4.6px;letter-spacing:.04em;fill:#0b0f13;font-weight:700');
      mk(s, 'rect', { x, y, width: w, height: h, rx: 1.5, fill: '#1d252c', stroke: ac || '#000', 'stroke-width': ac ? 1.4 : 1 });
      if (ac) mk(s, 'rect', { x: x + 0.9, y: y + 0.9, width: 2, height: h - 1.8, fill: ac });
      T(s, x + 4.5, y + 9.4, 'kit-name', st.val == null ? '-----' : st.val, null, null, 'font:700 7px var(--mono);fill:#f1f4f6');
      T(s, x + w - 2.5, y + 9.4, 'kit-name', st.unit || '', 'end', null, 'font-size:3.8px;fill:#c3ccd3');
    });
  /* 19 name plate (cx = centre under the equipment): acronym name + P&ID tag; the equipment colour shows its state */
  const nplate = (g, cx, y, name, tag) =>
    piece(g, {}, s => {
      T(s, cx, y, 'kit-name', name, 'middle', null, 'font:700 8px var(--sans);letter-spacing:.05em');
      T(s, cx, y + 9, 'kit-tag', tag, 'middle', null, 'font-size:6.5px');
    });
  /* 20 permissive button 13 x 13 beside the equipment, centred on its shaft line: Y red = complete, N green */
  const pbtn = (g, x, y, o = {}) =>
    piece(g, o, (s, st) => {
      s.setAttribute('data-eqb', st.id || 'kit');
      mk(s, 'rect', { x, y, width: 13, height: 13, rx: 2, fill: st.ok == null ? '#6b7480' : st.ok ? RUN : STOP, stroke: '#000', 'stroke-width': 1.1 });
      T(s, x + 6.5, y + 9.6, 'kit-name', st.ok == null ? '-' : st.ok ? 'Y' : 'N', 'middle', null, 'font:800 8.5px var(--sans);fill:#fff');
    });
  /* 34 motor status: chips under the name plate: A / M, R / L, VCB (red closed, green open) */
  const mstat = (g, cx, y, o = {}) =>
    piece(g, o, (s, st) => {
      const ch = [[st.mode || '-', '#3a4550'], [st.rl || '-', '#3a4550'], ['VCB', st.vcb == null ? '#6b7480' : st.vcb ? RUN : STOP]],
        ws = [8, 8, 15],
        tw = ws.reduce((a, b) => a + b) + 4;
      let x = cx - tw / 2;
      ch.forEach((c, i) => {
        mk(s, 'rect', { x, y, width: ws[i], height: 7, rx: 1.2, fill: c[1], stroke: '#000', 'stroke-width': 0.7 });
        T(s, x + ws[i] / 2, y + 5.3, 'kit-st', c[0], 'middle', null, 'fill:#fff;font:700 4.8px var(--sans)');
        x += ws[i] + 2;
      });
    });

  /* ---------- 22 ~ 26: strainer, coal feeder, burner, bottom ash cooler, expansion joint, flow element ---------- */
  /* 22 strainer / filter in the line (x, y = centre; the line stops at x -/+ 13): window with the mesh basket and the dirt */
  const strainer = (g, x, y, o = {}) =>
    piece(g, o, (s, st, mov) => {
      kitDefs(s);
      const body = { d: `M${x - 7} ${y - 8} L${x + 7} ${y - 8} L${x + 7} ${y + 10} A7 3.5 0 0 1 ${x - 7} ${y + 10}Z` };
      solid(s, [R(x - 9, y - 11, 18, 3, LT, 1, 'cyl'), R(x - 11, y - 4, 4, 8, LT), R(x + 7, y - 4, 4, 8, LT), R(x - 13, y - 5.5, 2, 11, LT), R(x + 11, y - 5.5, 2, 11, LT), ['path', body, LT]]);
      shade(s, 'path', body, 'kitVcyl');
      const w = win(s, x - 4.5, y - 6, 9, 17);
      mk(w, 'rect', { x: x - 4.5, y: y - 6, width: 9, height: 17, fill: M.water, opacity: 0.55 });
      for (let i = 0; i < 5; i++) mk(w, 'line', { x1: x - 3, y1: y - 4 + i * 3, x2: x + 3, y2: y - 4 + i * 3, stroke: '#e9eef2', 'stroke-width': 0.5, opacity: 0.8 });
      for (let j = 0; j < 3; j++) mk(w, 'line', { x1: x - 2.5 + j * 2.5, y1: y - 4, x2: x - 2.5 + j * 2.5, y2: y + 9, stroke: '#e9eef2', 'stroke-width': 0.5, opacity: 0.8 });
      for (const d of [[-1.5, 8], [1.5, 9], [0, 7], [-2, 9.5]]) mk(w, 'circle', { cx: x + d[0], cy: y + d[1], r: 0.8, fill: '#6b5a44' });
      if (st.flow) stream(w, mov, 3, x - 4.5, y - 5, x - 4.5, y + 9, 0, '#e9f3fa', 0.8, 0.6, true);
      winEdge(s, x - 4.5, y - 6, 9, 17);
    });
  /* 23 coal / limestone feeder (x, y = top left of the 90 x 22 box): inlet chute at (x + 16, y - 17), outlet chute at (x + 77, y + 36) */
  const feeder = (g, x, y, o = {}) =>
    piece(g, o, (s, st, mov) => {
      const run = !!st.run,
        fl = y + 40;
      kitDefs(s);
      solid(s, [R(x + 10, y - 14, 12, 14, LT, 1), R(x + 7, y - 17, 18, 3, LT), R(x + 71, y + 22, 12, 12, LT, 1), R(x + 68, y + 33, 18, 3, LT), R(x + 8, y + 22, 5, fl - y - 22, LT), R(x + 4, fl, 13, 4, LT), R(x + 52, y + 22, 5, fl - y - 22, LT), R(x + 48, fl, 13, 4, LT), R(x + 90, y + 8, 7, 6, LT), R(x + 94, fl, 48, 4, LT), R(x, y, 90, 22, LT, 3)].concat(motorParts(x + 97, y + 11, run, fl)));
      shade(s, 'path', { d: `M${x + 7} ${y - 17}h18v3h-3v14H${x + 87}a3 3 0 0 1 3 3v16a3 3 0 0 1 -3 3H${x + 83}v11h3v3h-18v-3h3v-11H${x + 3}a3 3 0 0 1 -3 -3v-16a3 3 0 0 1 3 -3H${x + 10}v-14h-3z` }, 'kitCyl');
      motorDetail(s, x + 97, y + 11);
      const w = win(s, x + 4, y + 2, 82, 18),
        belt = `M${x + 12} ${y + 10} L${x + 78} ${y + 10} A3.5 3.5 0 0 1 ${x + 78} ${y + 17} L${x + 12} ${y + 17} A3.5 3.5 0 0 1 ${x + 12} ${y + 10}`;
      mk(w, 'path', { d: belt, fill: 'none', stroke: '#0b0f13', 'stroke-width': 2 });
      const bd = mk(w, 'path', { d: belt, fill: 'none', stroke: '#9fb0bd', 'stroke-width': 0.8, 'stroke-dasharray': '2 3.5' });
      for (const px of [12, 78]) mk(w, 'circle', { cx: x + px, cy: y + 13.5, r: 3.1, fill: LT, stroke: '#000', 'stroke-width': 0.8 });
      const coal = [];
      for (let i = 0; i < 11; i++) coal.push(mk(w, 'circle', { cx: x + 16 + i * 5.6, cy: y + 7.4 - (i % 2) * 0.8, r: 1.3, fill: M.ash, stroke: '#000', 'stroke-width': 0.35 }));
      const fall = [];
      for (let k = 0; k < 3; k++) fall.push([mk(w, 'circle', { cx: x + 16, cy: y + 3, r: 1.1, fill: M.ash, stroke: '#000', 'stroke-width': 0.3 }), mk(w, 'circle', { cx: x + 82, cy: y + 14, r: 1.1, fill: M.ash, stroke: '#000', 'stroke-width': 0.3 })]);
      if (run)
        mov(t => {
          bd.setAttribute('stroke-dashoffset', (-t * 10).toFixed(1));
          coal.forEach((c, i) => c.setAttribute('cx', (x + 16 + ((i * 5.6 + t * 10) % 62)).toFixed(1)));
          fall.forEach((f, k) => {
            const p = (t * 1.2 + k / 3) % 1;
            f[0].setAttribute('cy', (y + 3.5 + p * 3).toFixed(1));
            f[1].setAttribute('cy', (y + 13 + p * 6).toFixed(1));
          });
        });
      else fall.forEach(f => (f[0].setAttribute('opacity', 0), f[1].setAttribute('opacity', 0)));
      winEdge(s, x + 4, y + 2, 82, 18);
    });
  /* 24 start-up burner (burner P&ID 1612 13-1-01-1G, gun drawing 1612 13-D-1-50): o.mode 'stop' | 'run' | 'seq' (the 10 s light-off and
     shut-down loop of the mockup), or o.q = () => ({ ig, gn, fl, sp }) for the live sequence (igniter in 0..1, gun in 0..1, flame 0..1,
     spark 0 / 1). Returns air: the point where the hot secondary air duct lands on the air box */
  const burner = (g, x, y, o = {}) =>
    piece(g, Object.assign({ mode: 'stop' }, o), (s, st0_, mov) => {
      const GY = y + 4,
        TT = 10;
      let IY = y - 6.5;
      const mode = st0_.mode === true ? 'seq' : st0_.mode;
      const st = t => {
        if (st0_.q) return st0_.q();
        const u = t % TT,
          ig = u < 1 ? 0 : u < 2 ? u - 1 : u < 5 ? 1 : u < 6 ? 6 - u : 0,
          gn = u < 3 ? 0 : u < 4 ? u - 3 : u < 8 ? 1 : u < 9 ? 9 - u : 0,
          fl = u < 4.2 ? 0 : u < 4.6 ? (u - 4.2) / 0.4 : u < 8 ? 1 : u < 8.3 ? (8.3 - u) / 0.3 : 0,
          sp = u >= 2 && u < 5 ? 1 : 0;
        return mode === 'seq' ? { ig, gn, fl, sp } : mode === 'run' ? { ig: 0, gn: 1, fl: 1, sp: 0 } : { ig: 0, gn: 0, fl: 0, sp: 0 };
      };
      kitDefs(s);
      /* furnace and flame (flame on the oil gun axis) */
      const w = win(s, x + 8, y - 24, 30, 48, 2);
      mk(w, 'rect', { x: x + 8, y: y - 24, width: 30, height: 48, fill: DK });
      const glow = mk(w, 'rect', { x: x + 8, y: y - 24, width: 30, height: 48, fill: '#5a2a14', opacity: 0 });
      const fr = mk(w, 'path', { d: `M${x + 8} ${GY - 8} Q${x + 26} ${GY - 22} ${x + 40} ${GY - 2} Q${x + 30} ${GY + 20} ${x + 8} ${GY + 8}Z`, fill: '#c8401e', opacity: 0 });
      const tg = [];
      for (let q = 0; q < 3; q++) tg.push(mk(w, 'path', { d: '', fill: q === 1 ? '#f39a3a' : '#d9572a', opacity: 0 }));
      const em = [];
      for (let q = 0; q < 6; q++) em.push(mk(w, 'circle', { cx: 0, cy: 0, r: 0.8, fill: '#ffd36b', opacity: 0 }));
      const fo = mk(w, 'path', { d: `M${x + 8} ${GY - 6} Q${x + 29} ${GY - 14} ${x + 37} ${GY} Q${x + 29} ${GY + 14} ${x + 8} ${GY + 6}Z`, fill: '#e8742f', opacity: 0 });
      const fi = mk(w, 'path', { d: `M${x + 8} ${GY - 3} Q${x + 21} ${GY - 6} ${x + 28} ${GY} Q${x + 21} ${GY + 6} ${x + 8} ${GY + 3}Z`, fill: '#ffd36b', opacity: 0 });
      const fc = mk(w, 'path', { d: `M${x + 8} ${GY - 1.3} Q${x + 15} ${GY - 2.5} ${x + 19} ${GY} Q${x + 15} ${GY + 2.5} ${x + 8} ${GY + 1.3}Z`, fill: '#fffbe8', opacity: 0 });
      winEdge(s, x + 8, y - 24, 30, 48);
      /* tube wall around the throat and the air box */
      solid(s, [R(x, y - 28, 8, 20, LT), R(x, y + 8, 8, 20, LT), R(x - 28, y - 14, 28, 28, LT, 2)]);
      shade(s, 'rect', { x: x - 28, y: y - 14, width: 28, height: 28, rx: 2 }, 'kitCyl');
      for (let i = 0; i < 5; i++) {
        mk(s, 'line', { x1: x + 4, y1: y - 27 + i * 4, x2: x + 4, y2: y - 25 + i * 4, stroke: '#000', 'stroke-width': 0.7, opacity: 0.35 });
        mk(s, 'line', { x1: x + 4, y1: y + 10 + i * 4, x2: x + 4, y2: y + 12 + i * 4, stroke: '#000', 'stroke-width': 0.7, opacity: 0.35 });
      }
      const rw = win(s, x - 24, y - 11, 20, 22, 1.5);
      mk(rw, 'rect', { x: x - 24, y: y - 11, width: 20, height: 22, fill: DK });
      const vn = mk(rw, 'path', { d: '', fill: 'none', stroke: '#c98a4a', 'stroke-width': 1.4, opacity: 0.9 });
      winEdge(s, x - 24, y - 11, 20, 22);
      /* fixed parts on the two axes: air cylinders behind, guide tubes through the air box */
      solid(s, [R(x - 104, GY - 5, 18, 10, LT, 2, 'cyl'), R(x - 62, GY - 2, 34, 4, LT)]);
      const IA = (Math.atan2(GY - 2.5 - IY + 6, 98) * 180) / Math.PI,
        ia = mk(s, 'g', { transform: 'rotate(' + IA.toFixed(2) + ' ' + (x + 4) + ' ' + (GY - 2.5) + ')' });
      IY = GY - 2.5;
      solid(ia, [R(x - 98, IY - 4, 12, 8, LT, 2, 'cyl'), R(x - 62, IY - 1.5, 34, 3, LT)]);
      const pr = mk(s, 'rect', { x: x - 86, y: GY - 1, width: 0, height: 2, fill: '#5d6872', stroke: '#000', 'stroke-width': 0.5 }),
        ir = mk(ia, 'rect', { x: x - 86, y: IY - 0.8, width: 0, height: 1.6, fill: '#5d6872', stroke: '#000', 'stroke-width': 0.5 });
      /* moving oil gun (lance + head) and igniter (rod + head) */
      const gg = mk(s, 'g', {});
      solid(gg, [R(x - 60, GY - 1.2, 64, 2.4, '#5d6872')]);
      const gh = mk(gg, 'rect', { x: x - 70, y: GY - 5, width: 9, height: 10, rx: 1.5, fill: STOP, stroke: '#000', 'stroke-width': 1.4 });
      shade(gg, 'rect', { x: x - 70, y: GY - 5, width: 9, height: 10, rx: 1.5 }, 'kitCyl');
      const ig = mk(ia, 'g', {});
      solid(ig, [R(x - 62, IY - 0.9, 66, 1.8, '#5d6872'), R(x - 70, IY - 3.5, 7, 7, LT, 1)]);
      const sp = mk(ia, 'path', { d: `M${x + 4} ${IY - 2} l2 2 l-1.5 .6 l2.2 2.4`, fill: 'none', stroke: '#fff3b0', 'stroke-width': 1.3, opacity: 0 });
      /* hoses ride with the gun head */
      const ho = mk(s, 'path', { fill: 'none', stroke: '#000', 'stroke-width': 3.6 }),
        hoi = mk(s, 'path', { fill: 'none', stroke: M.oil, 'stroke-width': 1.8 }),
        ha = mk(s, 'path', { fill: 'none', stroke: '#000', 'stroke-width': 3.6 }),
        hai = mk(s, 'path', { fill: 'none', stroke: M.ia, 'stroke-width': 1.8 });
      /* flame scanner on its sight tube */
      mk(s, 'line', { x1: x - 10, y1: y - 14, x2: x - 20, y2: y - 26, stroke: '#000', 'stroke-width': 5 });
      mk(s, 'line', { x1: x - 10, y1: y - 14, x2: x - 20, y2: y - 26, stroke: LT, 'stroke-width': 3 });
      solid(s, [R(x - 28, y - 34, 12, 9, LT, 2, 'cyl')]);
      const eye = mk(s, 'circle', { cx: x - 22, cy: y - 29.5, r: 2.4, fill: DK, stroke: '#000', 'stroke-width': 0.8 });
      const TR = 16;
      const frame = t => {
        const q = st(t),
          dg = (q.gn - 1) * TR,
          di = (q.ig - 1) * TR;
        gg.setAttribute('transform', 'translate(' + dg.toFixed(1) + ' 0)');
        ig.setAttribute('transform', 'translate(' + di.toFixed(1) + ' 0)');
        pr.setAttribute('width', Math.max(0, x - 70 + dg - (x - 86)).toFixed(1));
        ir.setAttribute('width', Math.max(0, x - 70 + di - (x - 86)).toFixed(1));
        gh.setAttribute('fill', q.fl > 0.5 ? RUN : STOP);
        const k = 1 + Math.sin(t * 9) * 0.07 * q.fl;
        fo.setAttribute('opacity', (0.92 * q.fl).toFixed(2));
        fi.setAttribute('opacity', (q.fl * (0.75 + Math.sin(t * 13) * 0.25)).toFixed(2));
        glow.setAttribute('opacity', (0.9 * q.fl).toFixed(2));
        fo.setAttribute('transform', 'translate(' + (x + 8) + ' ' + GY + ') scale(' + (q.fl * k).toFixed(3) + ' ' + (q.fl * (2 - k)).toFixed(3) + ') translate(' + (-x - 8) + ' ' + -GY + ')');
        const k3 = 1 + Math.sin(t * 7 + 1) * 0.08;
        fr.setAttribute('opacity', (0.85 * q.fl).toFixed(2));
        fr.setAttribute('transform', 'translate(' + (x + 8) + ' ' + GY + ') scale(' + (q.fl * k3).toFixed(3) + ' ' + (q.fl * (2 - k3)).toFixed(3) + ') translate(' + (-x - 8) + ' ' + -GY + ')');
        fc.setAttribute('opacity', (q.fl * (0.7 + Math.sin(t * 17) * 0.3)).toFixed(2));
        tg.forEach((p, j) => {
          const ph = t * 6 + j * 2.1,
            ty = GY + (j - 1) * 6 + Math.sin(ph) * 2,
            tl = x + 26 + Math.sin(ph * 1.3) * 4 + j * 2;
          p.setAttribute('d', 'M' + (x + 14) + ' ' + (ty - 2.5) + ' Q' + (tl - 6) + ' ' + (ty - 6) + ' ' + tl + ' ' + (ty + Math.sin(ph * 2) * 2) + ' Q' + (tl - 6) + ' ' + (ty + 5) + ' ' + (x + 14) + ' ' + (ty + 2.5) + 'Z');
          p.setAttribute('opacity', (q.fl * 0.85).toFixed(2));
        });
        em.forEach((e, j) => {
          const u = (t * 0.6 + j / 6) % 1;
          e.setAttribute('cx', (x + 20 + j * 2.5 + u * 8).toFixed(1));
          e.setAttribute('cy', (GY - 4 - u * 16 + Math.sin(t * 5 + j) * 1.5).toFixed(1));
          e.setAttribute('opacity', (q.fl * (1 - u)).toFixed(2));
        });
        sp.setAttribute('transform', 'translate(' + di.toFixed(1) + ' 0)');
        sp.setAttribute('opacity', q.sp && Math.sin(t * 25) > 0 ? 1 : 0);
        eye.setAttribute('fill', q.fl > 0.3 ? '#ffd36b' : DK);
        const o2 = q.fl > 0 ? (t * 10) % 6 : 0;
        let d = '';
        for (let k2 = -6; k2 < 26; k2 += 6) d += 'M' + (x - 24 + k2 + o2) + ' ' + (y + 11) + ' L' + (x - 20 + k2 + o2) + ' ' + (y - 11) + ' ';
        vn.setAttribute('d', d);
        const hx_ = x - 66 + dg,
          hy = GY + 5;
        for (const h of [[ho, hoi, 0], [ha, hai, 4]]) {
          const a = hx_ + h[2],
            dd = 'M' + a.toFixed(1) + ' ' + hy + ' C' + a.toFixed(1) + ' ' + (hy + 10) + ' ' + (x - 70 + h[2]) + ' ' + (hy + 12) + ' ' + (x - 70 + h[2]) + ' ' + (hy + 40);
          h[0].setAttribute('d', dd);
          h[1].setAttribute('d', dd);
        }
      };
      frame(0);
      mov(frame);
      return { air: [x - 8, y - 14] };
    });
  /* 25 bottom ash screw cooler (vendor drawing P1128517): 12 degrees, hot ash in at the lower end, out at the upper end, gear motor
     at the lower end, cooling water in low / out high, two hangers. Returns inlet / outlet: where the ash chutes land */
  const ashcooler = (g, x, y, o = {}) =>
    piece(g, o, (s, st, mov) => {
      const run = !!st.run,
        A = -12,
        c = Math.cos((A * Math.PI) / 180),
        sn = Math.sin((A * Math.PI) / 180),
        L = 112;
      kitDefs(s);
      const P = (u, v) => [x + u * c - v * sn, y + u * sn + v * c];
      const i0 = P(16, -12),
        o0 = P(98, 12),
        h1 = P(42, -12),
        h2 = P(84, -12),
        wi = P(6, 12),
        wo = P(L - 6, -12);
      for (const h of [h1, h2]) {
        mk(s, 'line', { x1: h[0], y1: st.top || 0, x2: h[0], y2: h[1], stroke: '#000', 'stroke-width': 3.4 });
        mk(s, 'line', { x1: h[0], y1: st.top || 0, x2: h[0], y2: h[1], stroke: LT, 'stroke-width': 1.6 });
      }
      pipe(s, 'M' + wi[0].toFixed(1) + ' ' + (wi[1] + 14).toFixed(1) + ' L' + wi[0].toFixed(1) + ' ' + wi[1].toFixed(1), 'water', { flow: run ? 24 : 0 });
      pipe(s, 'M' + wo[0].toFixed(1) + ' ' + wo[1].toFixed(1) + ' L' + wo[0].toFixed(1) + ' ' + (wo[1] - 14).toFixed(1), 'water', { flow: run ? 24 : 0 });
      solid(s, [R(i0[0] - 6, i0[1] - 30, 12, 8, LT, 1), R(i0[0] - 9, i0[1] - 33, 18, 3, LT), R(i0[0] - 6, i0[1] - 12, 12, 14, LT, 1), R(o0[0] - 6, o0[1] - 4, 12, 12, LT, 1), R(o0[0] - 9, o0[1] + 7, 18, 3, LT)]);
      const cx = i0[0],
        t0 = i0[1] - 22,
        rg = [];
      for (let k = 0; k < 4; k++) rg.push(R(cx - 8, t0 + k * 2.5, 16, 2.5, LT, 1.2, 'cyl'));
      solid(s, [R(cx - 6, t0, 12, 10, LT)].concat(rg)); /* ring bellows on the inlet chute */
      const gr = mk(s, 'g', { transform: 'rotate(' + A + ' ' + x + ' ' + y + ')' });
      solid(gr, [R(x - 4, y - 4, 4, 8, LT), R(x - 22, y - 11, 18, 22, LT, 2), R(x, y - 12, L, 24, LT, 4)]);
      const mg = mk(gr, 'g', { transform: 'translate(' + 2 * (x - 22) + ' 0) scale(-1 1)' });
      solid(mg, motorParts(x - 21, y, run, y + 12));
      motorDetail(mg, x - 21, y);
      shade(gr, 'path', { d: `M${x + 4} ${y - 12}H${x + L - 4}a4 4 0 0 1 4 4v16a4 4 0 0 1 -4 4H${x + 4}a4 4 0 0 1 -4 -4v-16a4 4 0 0 1 4 -4z` }, 'kitCyl');
      const w = win(gr, x + 6, y - 8, L - 12, 16);
      mk(w, 'rect', { x: x + 6, y: y - 8, width: L - 12, height: 2.5, fill: M.water });
      mk(w, 'rect', { x: x + 6, y: y + 5.5, width: L - 12, height: 2.5, fill: M.water });
      const spiral = mk(w, 'path', { d: '', fill: 'none', stroke: '#9fb0bd', 'stroke-width': 1, opacity: 0.7 });
      const ash = [];
      for (let i = 0; i < 11; i++) ash.push(mk(w, 'circle', { cx: 0, cy: y + 2.5 - (i % 3) * 0.8, r: 1.4 }));
      const frame = t => {
        const o2 = run ? (t * 12) % 10 : 0;
        let d = '';
        for (let i = -10; i < L; i += 10) d += 'M' + (x + 6 + i + o2) + ' ' + (y - 5) + ' L' + (x + 11 + i + o2) + ' ' + (y + 5) + ' ';
        spiral.setAttribute('d', d);
        ash.forEach((a, i) => {
          const k = (i / 11 + (run ? t * 0.12 : 0)) % 1;
          a.setAttribute('cx', (x + 10 + k * (L - 20)).toFixed(1));
          a.setAttribute('fill', 1 - k > 0.5 ? '#e8742f' : '#8a8f94');
        });
      };
      frame(0);
      mov(frame);
      winEdge(gr, x + 6, y - 8, L - 12, 16);
      return { inlet: [i0[0], i0[1] - 33], outlet: [o0[0], o0[1] + 10] };
    });
  /* 26 expansion joint on a duct (cx, y = centre; the duct stops at cx -/+ 12) */
  const expjoint = (g, cx, y) =>
    piece(g, {}, s => {
      const x = cx - 135,
        oy = y - 22;
      solid(s, [R(123 + x, 15 + oy, 3, 14, LT), R(144 + x, 15 + oy, 3, 14, LT), ['path', { d: [[126, 18], [129, 16], [132, 18], [135, 16], [138, 18], [141, 16], [144, 18], [144, 26], [141, 28], [138, 26], [135, 28], [132, 26], [129, 28], [126, 26]].map((p, i) => (i ? 'L' : 'M') + (p[0] + x) + ' ' + (p[1] + oy)).join(' ') + ' Z' }, LT, 'cyl']]);
    });
  /* 26 flow element (orifice plate; cx, y = centre; the pipe stops at cx - 5.5 / cx + 5.5) with its two impulse lines up to FT */
  const flowel = (g, cx, y) =>
    piece(g, {}, s => {
      const x = cx - 207.5,
        oy = y - 62;
      mk(s, 'line', { x1: 203.5 + x, y1: 56 + oy, x2: 203.5 + x, y2: 44 + oy, stroke: '#000', 'stroke-width': 1.2 });
      mk(s, 'line', { x1: 211.5 + x, y1: 56 + oy, x2: 211.5 + x, y2: 44 + oy, stroke: '#000', 'stroke-width': 1.2 });
      solid(s, [R(200 + x, 34 + oy, 15, 10, LT, 2), R(202 + x, 56 + oy, 3, 12, LT), R(210 + x, 56 + oy, 3, 12, LT), R(205.5 + x, 52 + oy, 4, 18, DK, 1)]);
      T(s, cx, 41.6 + oy, 'kit-name', 'FT', 'middle', null, 'font:700 5.5px var(--sans);fill:#1d252c');
    });

  H.kit = {
    M,
    CANVAS,
    RUN,
    STOP,
    PW,
    pipe,
    net,
    hop,
    drain,
    lineEnd,
    valve,
    vline,
    check,
    pump,
    motor,
    blower,
    fan,
    damper,
    tank,
    hx,
    drum,
    vbox,
    nplate,
    pbtn,
    mstat,
    strainer,
    feeder,
    burner,
    ashcooler,
    expjoint,
    flowel
  };
})();
