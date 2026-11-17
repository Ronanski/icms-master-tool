/* HX core: builds a plant page from a short description (hx-pages.js) and keeps it live. It knows nothing about the simulator:
   every number, state and click goes through ONE object, HX.data (the adapter). The mockup gives it sample data (hx-sample.js);
   the app gives it the real signals (README: "Putting it in the app").
     HX.data = {
       time()                  -> seconds of simulation time
       value(key)              -> number | null     key = a transmitter tag exactly as the app pages use it (data-v), or 'SHEET|ADDRESS'
       machine(name)           -> { st: 'run' | 'stop' | 'trip' | null, mode: 'Remote · Auto' | null, perm: true | false | null }
       loop(tag)               -> { pv, sv, mv, mode: 'AUTO' | 'MANUAL' | 'REMOTE' | ..., unit } | null
       valve(tag)              -> { pct: number | null, open: true | false | null, mode: string | null }
       open(kind, id, second)  -> opens a faceplate: kind = 'mach' | 'loop' | 'valve' | 'value'; second = true is the
                                  PERMISSIVE · TREND · MONITOR faceplate (the Y / N square), false the CONTROL faceplate
     }
   A page = lanes. A lane is one stream (its medium gives the colour) drawn left to right through its items; an array inside a
   lane is equipment in parallel (pump A / B). Items are made with HX.E (equipment), HX.M (machine), HX.C (control valve or damper
   with its loop), HX.X (on / off valve), HX.L (link to another page). The core places everything on a 1280 x 640 drawing. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg',
    W = 1280,
    H = 640,
    SYM = window.HXSYM || {},
    REAL = window.HXREAL || {};
  const HX = (window.HX = { pages: [], byId: {}, W, H, data: null });
  const esc = s =>
    String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const n1 = x => String(Math.round(x * 10) / 10);
  const fmt = (v, dp) =>
    v == null || !isFinite(v) ? '-----' : (+v).toFixed(dp == null ? 1 : dp).replace(/^-(0(?:\.0+)?)$/, '$1');
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  /* ---------- what a page is made of ---------- */
  HX.V = (label, key, unit, dp) => ({ label, key, unit: unit || '', dp: dp == null ? 1 : dp });
  HX.E = (sym, name, tag, vals, o) => Object.assign({ k: 'eq', sym, name, tag: tag || '', vals: vals || [] }, o || {});
  HX.M = (sym, mach, name, vals, o) => Object.assign({ k: 'mach', sym, mach, name, vals: vals || [] }, o || {});
  HX.C = (loop, name, o) => Object.assign({ k: 'loop', sym: 'valve', kind: 'control', loop, name, vals: [] }, o || {});
  HX.X = (valve, name, o) =>
    Object.assign(
      { k: 'valve', sym: 'valve', kind: /^MV/.test(valve) ? 'motor' : 'shutoff', valve, name, vals: [] },
      o || {}
    );
  HX.L = (to, text, o) => Object.assign({ k: 'link', to, name: text }, o || {});
  /* a push button or a state of the plant that is no machine, valve or controller: hook = the data attribute the page of
     hmi-mock.js has for it (data-tpb="trip", data-apb="ABC-010|M.054F|M.0222=0", data-dy=..., data-fv=...), so the press and
     the state are the ones of that page. press: true = a push button (a click presses it), else a state only */
  HX.B = (text, hook, o) => Object.assign({ k: 'hook', name: text, hook }, o || {});
  /* a named state for a rule: HX.hk('g52', 'data-dy=...') gives 'h:g52', true while that state of the hmi-mock.js page is
     its red one (a breaker closed, a valve open, a Y) */
  HX.HK = {};
  HX.hk = (name, hook) => ((HX.HK[name] = hook), 'h:' + name);
  /* a hand valve of the plant model (a field valve the operator sets): OPEN / CLOSED, a click opens its field faceplate */
  HX.H = (tag, text, o) => HX.B(text || tag, 'fv:' + tag, Object.assign({ press: true, state: true, w: 104 }, o || {}));
  HX.page = def => {
    def.no = HX.pages.length + 1;
    HX.pages.push(def);
    HX.byId[def.id] = def;
  };
  const MEDIA = {
    steam: 'Steam',
    reheat: 'Reheat steam',
    water: 'Feedwater',
    condensate: 'Condensate',
    cooling: 'Cooling water',
    sea: 'Sea water',
    air: 'Air',
    hotair: 'Hot air',
    gas: 'Flue gas',
    oil: 'Fuel oil',
    coal: 'Coal',
    solid: 'Limestone / sand',
    ash: 'Ash',
    lube: 'Oil',
    power: 'Electric power',
    drain: 'Drain / vent',
    signal: 'Control signal'
  };
  const regName = it => (it.k === 'mach' ? it.mach : it.k === 'loop' ? it.loop : it.k === 'valve' ? it.valve : '');
  const tagOf = it => {
    if (it.tag != null && it.tag !== '') return it.tag;
    const R = window.HXREG || {},
      m = it.k === 'mach' && R.machines && R.machines[it.mach];
    if (it.k === 'mach') return m && m.t && m.t.length < 14 ? it.mach + ' · ' + m.t : it.mach;
    return regName(it);
  };

  /* ---------- flow of a line: 'm:NAME' running, 'x:VALVE' open, 'l:LOOP' output > 1 %, 'v:KEY>n', 'h:NAME' a named state
     (HX.hk); a | b = any ---------- */
  const flowing = spec => {
    if (!spec) return null;
    const D = HX.data;
    return String(spec)
      .split('|')
      .some(s => {
        const k = s.slice(0, 2),
          a = s.slice(2);
        if (k === 'm:') return (D.machine(a) || {}).st === 'run';
        if (k === 'x:') {
          const v = D.valve(a) || {};
          return v.open === true || v.pct > 1;
        }
        if (k === 'l:') return ((D.loop(a) || {}).mv || 0) > 1;
        if (k === 'h:') return ((D.hook && HX.HK[a] && D.hook(HX.HK[a], a)) || {}).tone === 'run';
        if (k === 'v:') {
          const m = a.split('>');
          return (D.value(m[0]) || 0) > +(m[1] || 0);
        }
        return false;
      });
  };

  /* a pipe as a tube: a darker edge, the body in the colour of its medium, a light line along its top, the moving dashes */
  const tube = (d, med, w, dash) =>
    `<path class="hx-lne" d="${d}" style="stroke:color-mix(in srgb, var(--hx-m-${med}) 55%, var(--hx-ink));stroke-width:${w + 1.8}${dash ? ';stroke-dasharray:6 5' : ''}"/>` +
    `<path class="hx-ln" d="${d}" style="stroke:var(--hx-m-${med});stroke-width:${w}${dash ? ';stroke-dasharray:6 5' : ''}"/>` +
    (w >= 3.5 ? `<path class="hx-lnh" d="${d}" style="stroke-width:${Math.max(1, w * 0.26)}"/>` : '') +
    `<path class="hx-lnf" d="${d}"/>`;

  /* the same pipe in the realistic look (hx-real.js): a dark edge, the body in the colour of its medium (--m, set on the group;
     cold steel while nothing flows), a light line along it, the joints of the cladding on a large line, the moving dashes */
  const tubeR = (d, w) =>
    `<path class="rx-pe" d="${d}" style="stroke-width:${n1(w + 2.4)}"/><path class="rx-pb" d="${d}" style="stroke-width:${w}"/>` +
    (w >= 3.4 ? `<path class="rx-ph" d="${d}" style="stroke-width:${n1(Math.max(1, w * 0.3))}"/>` : '') +
    (w >= 6 ? `<path class="rx-pj" d="${d}" style="stroke-width:${w}"/>` : '') +
    `<path class="hx-lnf" d="${d}"${w >= 6 ? ' style="stroke-width:1.9"' : ''}/>`;

  /* ---------- geometry ---------- */
  const rpath = (p, r) => {
    r = r == null ? 7 : r;
    let d = `M${n1(p[0][0])} ${n1(p[0][1])}`;
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1],
        b = p[i],
        c = p[i + 1];
      if (!c) {
        d += `L${n1(b[0])} ${n1(b[1])}`;
        break;
      }
      const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]),
        l2 = Math.hypot(c[0] - b[0], c[1] - b[1]),
        q = Math.min(r, l1 / 2, l2 / 2);
      if (q < 0.5) {
        d += `L${n1(b[0])} ${n1(b[1])}`;
        continue;
      }
      d += `L${n1(b[0] - ((b[0] - a[0]) / l1) * q)} ${n1(b[1] - ((b[1] - a[1]) / l1) * q)}Q${n1(b[0])} ${n1(b[1])} ${n1(b[0] + ((c[0] - b[0]) / l2) * q)} ${n1(b[1] + ((c[1] - b[1]) / l2) * q)}`;
    }
    return d;
  };
  /* right-angle route from a to b: 'h' = leave sideways (bend at mid x), 'v' = leave up / down (bend at mid y) */
  const route = (a, b, how, mid) => {
    if (Math.abs(a[1] - b[1]) < 0.6 || Math.abs(a[0] - b[0]) < 0.6) return [a, b];
    if (how === 'vh') return [a, [a[0], b[1]], b];
    if (how === 'hv') return [a, [b[0], a[1]], b];
    if (how === 'v') {
      const y = mid == null ? (a[1] + b[1]) / 2 : mid;
      return [a, [a[0], y], [b[0], y], b];
    }
    const x = mid == null ? (a[0] + b[0]) / 2 : mid;
    return [a, [x, a[1]], [x, b[1]], b];
  };
  const wrap = (s, max) => {
    const w = String(s).split(' '),
      out = [];
    let c = '';
    for (const x of w) {
      if (c && (c + ' ' + x).length > max) {
        out.push(c);
        c = x;
      } else c = c ? c + ' ' + x : x;
    }
    if (c) out.push(c);
    return out.slice(0, 3);
  };

  /* ---------- layout: lanes -> positions ---------- */
  /* room of one item above and below its centre: symbol + the words the core writes around it */
  function measure(it) {
    if (it.k === 'link') return { up: 15, dn: 15 };
    if (it.k === 'hook') return { up: 18, dn: 18 };
    const box = SYM[it.sym](Object.assign({ id: 'm' }, it)).box,
      side = it.lab === 'r' || it.lab === 'l',
      lines = it.name ? wrap(it.name, it.wrap || (side ? 22 : 19)).length : 0,
      tg = tagOf(it) ? 1 : 0,
      rows =
        (it.k === 'mach' || it.k === 'valve' ? 1 : 0) + (it.k === 'loop' ? 1 + (it.pv ? 1 : 0) : 0) + it.vals.length;
    if (side) {
      const hh = ((lines + tg + rows) * 14) / 2 + 4;
      return { up: Math.max(-box[1] + 2, hh), dn: Math.max(box[3] + 2, hh) };
    }
    return { up: -box[1] + 8 + lines * 14 + tg * 11.5, dn: box[3] + 6 + rows * 14.5 };
  }
  function layout(def) {
    const X0 = 26,
      X1 = W - 26,
      PAD = 12,
      LAB = 24;
    let uid = 0;
    const lanes = def.lanes.map(l => ({ src: l, cols: l.items.map(it => (Array.isArray(it) ? it : [it])) }));
    for (const L of lanes) {
      L.upS = 0;
      L.dnS = 0;
      L.stack = 0;
      for (const col of L.cols) {
        for (const it of col) it._m = measure(it);
        if (col.length === 1) {
          L.upS = Math.max(L.upS, col[0]._m.up);
          L.dnS = Math.max(L.dnS, col[0]._m.dn);
        } else {
          col._tot = col.reduce((a, it) => a + it._m.up + it._m.dn, 0) + PAD * (col.length - 1);
          L.stack = Math.max(L.stack, col._tot);
        }
      }
      L.need = Math.max(L.upS + L.dnS, L.stack) + (L.src.label ? LAB : 8);
    }
    /* a page with many rows grows downwards (the width, and so the size of the text, stays) */
    const tot = lanes.reduce((a, L) => a + L.need, 0),
      Hp = Math.max(H, Math.ceil(tot + 12)),
      free = Hp - 12 - tot;
    let y = 6;
    const nodes = [];
    for (const L of lanes) {
      const hh = L.need + (free * L.need) / tot,
        lab = L.src.label ? LAB : 8,
        inner = hh - lab,
        mid = y + lab + inner / 2;
      L.top = y;
      L.cy = L.src.y != null ? L.src.y : mid + (L.upS - L.dnS) / 2;
      y += hh;
      const n = L.cols.length;
      L.cols.forEach((col, j) => {
        let cur = mid - (col._tot || 0) / 2;
        col.forEach((it, i) => {
          const jj = L.src.rev ? n - 1 - j : j,
            at = it.at != null ? it.at : col[0].at;
          it._id = it.id || 'n' + ++uid;
          it._x = at != null ? X0 + ((X1 - X0) * at) / 100 : X0 + ((X1 - X0) * (jj + 0.5)) / n;
          if (col.length === 1) it._y = L.cy + (it.dy || 0);
          else {
            it._y = cur + it._m.up;
            cur += it._m.up + it._m.dn + PAD;
          }
          it._lane = L;
          nodes.push(it);
        });
      });
    }
    return { lanes, nodes, H: Hp };
  }

  /* ---------- one node: symbol + its words ---------- */
  /* rot: a symbol may be turned (90, -90) to sit on a vertical line. lab: where its words go: 't' name above and details below,
     'b' all below, 'r' / 'l' all beside it */
  const rotP = (p, r) => (r === 90 ? [-p[1], p[0]] : r === -90 ? [p[1], -p[0]] : r === 180 ? [-p[0], -p[1]] : p);
  function drawNode(it, pageId, real) {
    const x = it._x,
      y = it._y;
    if (it.k === 'link') {
      const t = it.name,
        w = Math.max(74, t.length * 6.3 + 22),
        back = it.back;
      it._p = { l: [x - w / 2, y], r: [x + w / 2, y], t: [x, y - 13], b: [x, y + 13] };
      it._box = [x - w / 2, y - 13, x + w / 2, y + 13];
      const ready = !!HX.byId[it.to];
      return `<g class="hx-link${ready ? '' : ' soon'}"${ready ? ` data-go="${esc(it.to)}" tabindex="0" role="link"` : ''} transform="translate(${n1(x)} ${n1(y)})">${ready ? '' : '<title>This page is not drawn yet</title>'}<rect x="${n1(-w / 2)}" y="-13" width="${n1(w)}" height="26" rx="13"/><text x="0" y="4" text-anchor="middle">${back ? '‹ ' : ''}${esc(t)}${back ? '' : ' ›'}</text></g>`;
    }
    if (it.k === 'hook') {
      const t = it.name,
        w = it.w || Math.max(96, t.length * 6.3 + 24),
        line = !it.plain && (!it.press || it.state),
        h = line ? 36 : it.plain ? 22 : 30;
      it._p = { l: [x - w / 2, y], r: [x + w / 2, y], t: [x, y - h / 2], b: [x, y + h / 2] };
      it._box = [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
      return `<g class="hx-hook${it.press ? ' press' : ''}${it.plain ? ' plain' : ''}"${it.plain ? ' data-plain="1"' : ''} data-hook="${esc(it.hook)}" data-label="${esc(t)}"${it.press ? ' data-press="1" tabindex="0" role="button"' : ''} transform="translate(${n1(x)} ${n1(y)})"><rect x="${n1(-w / 2)}" y="${-h / 2}" width="${n1(w)}" height="${h}" rx="5"/><text class="hx-hkl" x="0" y="${line ? -3 : 4}" text-anchor="middle">${esc(t)}</text>${!line ? '' : '<text class="hx-hks" x="0" y="12" text-anchor="middle" data-hks="1">-----</text>'}</g>`;
    }
    const sy = ((real && REAL[it.sym]) || SYM[it.sym])(Object.assign({ id: pageId + '-' + it._id }, it)),
      rot = it.rot || 0,
      sc = it.sc || 1;
    let box = sy.box,
      ports = sy.ports;
    /* sc: a large piece may be drawn larger than its own measure (the turbine, a boiler pass). mir: it is drawn as its mirror
       image, left to right (the same piece seen from the other side); the words a symbol gives in sy.words stay readable */
    const mir = it.mir ? -1 : 1;
    if (sc !== 1 || mir < 0) {
      box = [box[0] * sc, box[1] * sc, box[2] * sc, box[3] * sc];
      if (mir < 0) box = [-box[2], box[1], -box[0], box[3]];
      ports = Object.fromEntries(Object.entries(ports).map(([k, q]) => [k, [q[0] * sc * mir, q[1] * sc]]));
      sy.svg = `<g transform="scale(${n1(sc * mir)} ${sc})">${sy.svg}</g>`;
    }
    if (sy.words)
      sy.svg += sy.words
        .map(
          w =>
            `<text class="${w.cls}" style="font-size:${n1((w.size || 9) * sc)}px" x="${n1(w.x * sc * mir)}" y="${n1(w.y * sc)}" text-anchor="middle">${esc(w.s)}</text>`
        )
        .join('');
    if (rot) {
      const c = [
        [box[0], box[1]],
        [box[2], box[1]],
        [box[0], box[3]],
        [box[2], box[3]]
      ].map(q => rotP(q, rot));
      box = [
        Math.min(...c.map(q => q[0])),
        Math.min(...c.map(q => q[1])),
        Math.max(...c.map(q => q[0])),
        Math.max(...c.map(q => q[1]))
      ];
      ports = Object.fromEntries(Object.entries(ports).map(([k, q]) => [k, rotP(q, rot)]));
    }
    it._p = Object.fromEntries(Object.entries(ports).map(([k, q]) => [k, [x + q[0], y + q[1]]]));
    it._box = [x + box[0], y + box[1], x + box[2], y + box[3]];
    const open =
      it.k === 'mach'
        ? 'mach:' + it.mach
        : it.k === 'loop'
          ? 'loop:' + it.loop
          : it.k === 'valve'
            ? 'valve:' + it.valve
            : '';
    const lab = it.lab || 't',
      side = lab === 'r' || lab === 'l';
    const lines = it.name ? wrap(it.name, it.wrap || (side ? 22 : 19)) : [],
      tg = tagOf(it);
    /* the rows of words: each gives its svg at (x, baseline y, anchor) */
    const head = [],
      body = [];
    for (const ln of lines)
      head.push([
        14,
        (bx, by, an) => `<text class="hx-name" x="${n1(bx)}" y="${n1(by)}" text-anchor="${an}">${esc(ln)}</text>`
      ]);
    if (tg)
      head.push([
        11.5,
        (bx, by, an) => `<text class="hx-tag" x="${n1(bx)}" y="${n1(by - 1.5)}" text-anchor="${an}">${esc(tg)}</text>`
      ]);
    if (it.k === 'mach')
      body.push([
        14.5,
        (bx, by, an) =>
          `<text class="hx-st none" data-st="${esc(it.mach)}" x="${n1(bx)}" y="${n1(by)}" text-anchor="${an}">-----</text>`
      ]);
    if (it.k === 'valve')
      body.push([
        14.5,
        (bx, by, an) =>
          `<text class="hx-st none" data-vs="${esc(it.valve)}" x="${n1(bx)}" y="${n1(by)}" text-anchor="${an}">-----</text>`
      ]);
    if (it.k === 'loop') {
      body.push([
        16.5,
        (bx, by, an) =>
          `<g class="hx-mode" data-mode="${esc(it.loop)}" transform="translate(${n1(bx - (an === 'middle' ? 46 : an === 'end' ? 92 : 0))} ${n1(by - 11)})"><rect width="50" height="15" rx="7.5"/><text x="25" y="11" text-anchor="middle">-----</text><text class="hx-val" data-lp="${esc(it.loop)}|mv" x="56" y="11.5">-----</text><text class="hx-unit" x="86" y="11.5"> %</text></g>`
      ]);
      if (it.pv) {
        const dp = it.pvdp == null ? 1 : it.pvdp;
        body.push([
          14.5,
          (bx, by, an) =>
            `<text class="hx-lab" x="${n1(bx)}" y="${n1(by)}" text-anchor="${an}">Measured <tspan class="hx-val" data-lp="${esc(it.loop)}|pv|${dp}">-----</tspan> · Set point <tspan class="hx-val" data-lp="${esc(it.loop)}|sv|${dp}">-----</tspan><tspan class="hx-unit"> ${esc(it.pv === true ? '' : it.pv)}</tspan></text>`
        ]);
      }
    }
    for (const v of it.vals)
      body.push([
        14,
        (bx, by, an) =>
          an === 'middle'
            ? `<text class="hx-lab" x="${n1(bx - 4)}" y="${n1(by)}" text-anchor="end">${esc(v.label)}</text><text x="${n1(bx + 3)}" y="${n1(by)}"><tspan class="hx-val" data-hv="${esc(v.key)}" data-dp="${v.dp}">-----</tspan><tspan class="hx-unit"> ${esc(v.unit)}</tspan></text>`
            : `<text class="hx-lab" x="${n1(bx)}" y="${n1(by)}" text-anchor="${an}">${esc(v.label)} <tspan class="hx-val" data-hv="${esc(v.key)}" data-dp="${v.dp}">-----</tspan><tspan class="hx-unit"> ${esc(v.unit)}</tspan></text>`
      ]);
    let words = '';
    if (side) {
      const all = head.concat(body),
        tot = all.reduce((q, r) => q + r[0], 0),
        bx = lab === 'r' ? box[2] + 7 : box[0] - 7;
      let by = -tot / 2 + 10 + (it.ly || 0);
      for (const r of all) {
        words += r[1](bx, by, lab === 'r' ? 'start' : 'end');
        by += r[0];
      }
    } else {
      let by;
      if (lab === 'b') {
        by = box[3] + 13;
        for (const r of head.concat(body)) {
          words += r[1](0, by, 'middle');
          by += r[0];
        }
      } else {
        by = box[1] - 6;
        for (let i = head.length - 1; i >= 0; i--) {
          words += head[i][1](0, by, 'middle');
          by -= head[i][0];
        }
        by = box[3] + 15;
        for (const r of body) {
          words += r[1](0, by, 'middle');
          by += r[0];
        }
      }
    }
    /* the Y / N square (second faceplate) of a machine or an on / off valve: on the side away from its words */
    const ynId = it.k === 'mach' ? 'mach:' + it.mach : it.k === 'valve' ? 'valve:' + it.valve : '',
      ynX = it.yn ? it.yn[0] : lab === 'r' ? box[0] - 18 : box[2] + 4,
      ynY = it.yn ? it.yn[1] : lab === 'b' ? box[1] - 2 : side ? box[1] - 4 : box[1] - 2;
    const yn = ynId
      ? `<g class="hx-yn" data-yn="${esc(ynId)}" transform="translate(${n1(ynX)} ${n1(ynY)})"><title>Permissive · trend · monitor</title><rect width="14" height="14" rx="3"/><text x="7" y="10.4" text-anchor="middle">-</text></g>`
      : '';
    const attr = open
      ? ` data-open="${esc(open)}" tabindex="0" role="button" aria-label="${esc(it.name || tg)}"`
      : it.go
        ? ` data-go="${esc(it.go)}" data-open="" tabindex="0" role="link" aria-label="${esc(it.name)}"`
        : '';
    const on = it.on
      ? ` data-on="${esc(it.on)}"`
      : it.k === 'mach'
        ? ` data-ms="${esc(it.mach)}"`
        : it.k === 'valve'
          ? ` data-vv="${esc(it.valve)}"`
          : it.k === 'loop'
            ? ` data-lv2="${esc(it.loop)}"`
            : '';
    const lv = it.level ? ` data-level="${esc(it.level.join('|'))}"` : '';
    const nm = it.cname || it.name ? ` data-name="${esc(it.cname || it.name)}"` : '';
    return `<g class="hx-node hx-none"${attr}${nm}${on}${lv} transform="translate(${n1(x)} ${n1(y)})"><rect class="hx-hit" x="${n1(box[0] - 4)}" y="${n1(box[1] - 4)}" width="${n1(box[2] - box[0] + 8)}" height="${n1(box[3] - box[1] + 8)}"/>${rot ? `<g transform="rotate(${rot})">${sy.svg}</g>` : sy.svg}${words}${yn}</g>`;
  }

  /* ---------- lines of a lane ---------- */
  function drawLines(L, joins) {
    const out = [],
      med = L.src.med,
      w = L.src.w || 4;
    const seg = (pts, flow, m, ww) =>
      out.push({ d: rpath(pts), med: m || med, w: ww || w, flow: flow === undefined ? L.src.flow : flow });
    const rev = L.src.rev;
    const P = (it, side) => it._p[side === 'in' ? it.pin || (rev ? 'r' : 'l') : it.pout || (rev ? 'l' : 'r')];
    if (L.src.noline) return out;
    for (let j = 0; j < L.cols.length - 1; j++) {
      const A = L.cols[j],
        B = L.cols[j + 1];
      if (L.src.cut && L.src.cut.includes(j)) continue;
      const fl = A.length > 1 || B.length > 1 ? null : undefined;
      if (A.length === 1 && B.length === 1)
        seg(route(P(A[0], 'out'), P(B[0], 'in'), 'h'), A[0].flow || undefined, A[0].med);
      else if (A.length === B.length)
        A.forEach((a, i) => seg(route(P(a, 'out'), P(B[i], 'in'), 'h'), a.flow || B[i].flow || fl, a.med));
      else {
        const ax = Math.max(...A.map(a => P(a, 'out')[0])),
          bx = Math.min(...B.map(b => P(b, 'in')[0])),
          mx = (ax + bx) / 2;
        if (A.length === 1)
          B.forEach(b => seg(route(P(A[0], 'out'), P(b, 'in'), 'h', mx - (B.length > 1 ? 0 : 0)), b.flow || fl));
        else if (B.length === 1) A.forEach(a => seg(route(P(a, 'out'), P(B[0], 'in'), 'h', mx), a.flow || fl, a.med));
        else {
          A.forEach(a => seg(route(P(a, 'out'), [mx, L.cy], 'hv'), a.flow || fl));
          B.forEach(b => seg(route([mx, L.cy], P(b, 'in'), 'vh'), b.flow || fl));
        }
      }
    }
    return out;
  }

  /* ---------- the Process view ---------- */
  function drawProcess(def) {
    if (def.plan) return drawPlan(def);
    const lay = layout(def);
    def._lay = lay;
    const byId = {};
    let nodes = '';
    for (const it of lay.nodes) {
      nodes += drawNode(it, def.id);
      byId[it._id] = it;
    }
    let lines = [];
    for (const L of lay.lanes) lines = lines.concat(drawLines(L));
    for (const j of def.joins || []) {
      const [ai, ap] = j.from.split('.'),
        [bi, bp] = j.to.split('.'),
        a = byId[ai],
        b = byId[bi];
      if (!a || !b) {
        console.warn('HX: join of page ' + def.id + ' names a missing item', j);
        continue;
      }
      const pa = a._p[ap || 'r'],
        pb = b._p[bp || 'l'];
      const how =
        j.via ||
        (/^[tb]/.test(ap || 'r') ? (/^[tb]/.test(bp || 'l') ? 'v' : 'vh') : /^[tb]/.test(bp || 'l') ? 'hv' : 'h');
      lines.push({ d: rpath(route(pa, pb, how, j.mid)), med: j.med, w: j.w || 3, flow: j.flow, dash: j.dash });
    }
    let ls = '';
    for (const l of lines)
      ls += `<g class="hx-idle"${l.flow ? ` data-flow="${esc(l.flow)}"` : ' data-flow=""'}>${tube(l.d, l.med, l.w, l.dash)}</g>`;
    let lab = '';
    for (const L of lay.lanes)
      if (L.src.label) lab += `<text class="hx-lane" x="26" y="${n1(L.top + 16)}">${esc(L.src.label)}</text>`;
    for (const t of def.notes || [])
      lab += `<text class="hx-note" x="${t[0]}" y="${t[1] < 0 ? lay.H + t[1] : t[1]}" text-anchor="${t[3] || 'start'}">${esc(t[2])}</text>`;
    const used = [...new Set(lines.map(l => l.med))];
    const legend =
      used.map(m => `<span><i style="background:var(--hx-m-${m})"></i>${MEDIA[m] || m}</span>`).join('') +
      `<em>Red = running / open · Green = stopped / closed · Y = permissive complete</em>`;
    return {
      svg: `<svg viewBox="0 0 ${W} ${lay.H}" role="img" aria-label="${esc(def.title)} process">${lab}${ls}${nodes}</svg>`,
      legend
    };
  }

  /* ---------- a page drawn as a plan: every item at its own place, every pipe from point to point ----------
     def.plan = { h, items: [item with x, y (+ rot, lab)], pipes: [{ med, w, flow, pts, to, arrow }], taps: [...], texts: [...],
     signals: [{ pts }] }. A point of a pipe is 'id.port' or [x, y]; null = the same x or y as the point before. Two points
     that are not in line get a right-angle bend (sideways first; vfirst: up / down first). */
  function drawPlan(def) {
    const P = def.plan,
      byId = {};
    const real = P.look === 'real';
    let uid = 0,
      nodes = '',
      under = '';
    for (const it of P.items) {
      it._id = it.id || 'p' + ++uid;
      it._x = it.x;
      it._y = it.y;
      /* under: large equipment that the pipes pass in front of (a turbine on its foundation, a boiler pass) */
      if (it.under) under += drawNode(it, def.id, real);
      else nodes += drawNode(it, def.id, real);
      byId[it._id] = it;
    }
    const pt = (q, prev) => {
      if (typeof q === 'string') {
        const [i, port] = q.split('.'),
          it = byId[i];
        if (!it || !it._p[port || 'r']) {
          console.warn('HX: pipe of page ' + def.id + ' names a missing point ' + q);
          return prev || [0, 0];
        }
        return it._p[port || 'r'];
      }
      return [q[0] == null ? prev[0] : q[0], q[1] == null ? prev[1] : q[1]];
    };
    const path = pp => {
      const raw = [];
      for (const q of pp.pts) raw.push(pt(q, raw[raw.length - 1]));
      const o = [raw[0]];
      for (let i = 1; i < raw.length; i++) {
        const a = o[o.length - 1],
          b = raw[i];
        if (Math.abs(a[0] - b[0]) > 0.6 && Math.abs(a[1] - b[1]) > 0.6) o.push(pp.vfirst ? [a[0], b[1]] : [b[0], a[1]]);
        o.push(b);
      }
      return o;
    };
    const head = (a, b, med, at, w) => {
      const an = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
        m = at || [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
        tr = `transform="translate(${n1(m[0])} ${n1(m[1])}) rotate(${n1(an)})"`;
      /* realistic look: the direction is painted on the pipe itself, as on a real line */
      if (real && !at && w >= 5)
        return `<path class="rx-chev" ${tr} d="M-2.4 ${n1(-w / 2 + 1.5)}L1.6 0L-2.4 ${n1(w / 2 - 1.5)}M-7.4 ${n1(-w / 2 + 1.5)}L-3.4 0L-7.4 ${n1(w / 2 - 1.5)}"/>`;
      if (real) return `<path class="hx-arw" ${tr} d="M-3.6 -3.4L3.8 0L-3.6 3.4Z" style="fill:var(--hx-m-${med})"/>`;
      return `<path class="hx-arw" ${tr} d="M-5 -4.6L5 0L-5 4.6Z" style="fill:var(--hx-m-${med})"/>`;
    };
    let ls = '',
      ends = '';
    const used = [];
    for (const pp of P.pipes) {
      const o = path(pp),
        w = pp.w || 4;
      if (!used.includes(pp.med)) used.push(pp.med);
      let ar = '';
      if (pp.arrow !== false) {
        let bi = 0,
          bl = 0;
        for (let i = 1; i < o.length; i++) {
          const l = Math.hypot(o[i][0] - o[i - 1][0], o[i][1] - o[i - 1][1]);
          if (l > bl) ((bl = l), (bi = i));
        }
        if (bl >= 44) ar = head(o[bi - 1], o[bi], pp.med, null, w);
      }
      if (pp.to) {
        const a = o[o.length - 2],
          b = o[o.length - 1],
          dx = Math.sign(Math.round(b[0] - a[0])),
          dy = Math.sign(Math.round(b[1] - a[1]));
        ar += head(a, b, pp.med, [b[0] + dx * 4, b[1] + dy * 4], w);
        ends += `<text class="hx-end" x="${n1(b[0] + dx * 13 + (pp.toSide === 'r' ? 8 : 0) + (pp.tox || 0))}" y="${n1(b[1] + dy * 13 + (dy > 0 ? 8 : dy < 0 ? -2 : 3.5) - (pp.toSide === 'r' ? 9 : 0) + (pp.toy || 0))}" text-anchor="${dx > 0 || pp.toSide === 'r' ? 'start' : dx < 0 ? 'end' : 'middle'}">${esc(pp.to)}</text>`;
      }
      const d = rpath(o, pp.r || (real ? Math.max(7, w * 1.7) : null));
      ls += real
        ? `<g class="hx-idle" data-flow="${esc(pp.flow || '')}" style="--m:var(--hx-m-${pp.med})">${tubeR(d, w)}${ar}</g>`
        : `<g class="hx-idle" data-flow="${esc(pp.flow || '')}">${tube(d, pp.med, w)}${ar}</g>`;
    }
    let sig = '';
    for (const sg of P.signals || []) sig += `<path class="hx-sig" d="${rpath(path(sg), 4)}"/>`;
    /* a tap: the transmitter on its line, with its words on one side */
    let taps = '';
    for (const t of P.taps || []) {
      const sd = t.side || 't',
        an = sd === 'r' ? 'start' : sd === 'l' ? 'end' : 'middle',
        dp = t.dp == null ? 1 : t.dp;
      const val = t.key
        ? `<tspan class="hx-val" data-hv="${esc(t.key)}" data-dp="${dp}">-----</tspan>${t.key2 ? ` / <tspan class="hx-val" data-hv="${esc(t.key2)}" data-dp="${dp}">-----</tspan>` : ''}<tspan class="hx-unit"> ${esc(t.unit || '')}</tspan>`
        : `<tspan class="hx-val hx-nov">-----</tspan><tspan class="hx-unit"> ${esc(t.unit || '')}</tspan>`;
      const open = t.key ? ` data-open="value:${esc(t.key)}" tabindex="0" role="button"` : '';
      if (real) {
        /* realistic look: the transmitter stands on its line, its value in a small display */
        const digits = t.digits || (dp ? 4.6 : 3.4),
          cw = Math.round(
            12 + digits * 7.9 * (t.key2 ? 2 : 1) + (t.key2 ? 17 : 0) + (t.unit ? 4 + t.unit.length * 5.5 : 0)
          ),
          v = sd === 't' || sd === 'b',
          sg = sd === 't' || sd === 'l' ? -1 : 1,
          stalk = v ? `M0 0V${sg * 6}` : `M0 0H${sg * 6}`,
          hx = v ? 0 : sg * 9,
          hy = v ? sg * 9 : 0,
          ox = t.dx || 0,
          x0 = (v ? -cw / 2 : sd === 'r' ? 15 : -15 - cw) + ox,
          tx0 = (v ? 0 : sd === 'r' ? 15 : -15) + ox,
          yl = sd === 't' ? -46 : sd === 'b' ? 24 : -12,
          yc = sd === 't' ? -42 : sd === 'b' ? 28 : -8,
          yt = sd === 't' ? -17 : sd === 'b' ? 53 : 18;
        taps +=
          `<g class="hx-node hx-tap"${open} aria-label="${esc(t.label)}" transform="translate(${n1(t.x)} ${n1(t.y)})"><path class="rxst" d="${stalk}"/><circle class="rxhd" cx="${hx}" cy="${hy}" r="3.3"/>` +
          `<text class="hx-lab" x="${tx0}" y="${yl}" text-anchor="${an}">${esc(t.label)}</text><rect class="rx-chip" x="${n1(x0)}" y="${yc}" width="${cw}" height="15" rx="3"/>` +
          `<text x="${n1(x0 + cw / 2)}" y="${yc + 11.2}" text-anchor="middle">${val}</text>${t.tag ? `<text class="hx-tag" x="${tx0}" y="${yt}" text-anchor="${an}">${esc(t.tag)}</text>` : ''}</g>`;
        continue;
      }
      const bx = sd === 'r' ? 9 : sd === 'l' ? -9 : 0,
        y0 = sd === 't' ? -37 : sd === 'b' ? 21 : -9;
      const lead = sd === 't' ? 'M0 -3V-9' : sd === 'b' ? 'M0 3V9' : sd === 'r' ? 'M3 0H7' : 'M-3 0H-7';
      taps += `<g class="hx-node hx-tap"${open} aria-label="${esc(t.label)}" transform="translate(${n1(t.x)} ${n1(t.y)})"><path class="hxd" d="${lead}"/><circle class="hx-dot" r="3.2"/><text class="hx-lab" x="${bx}" y="${y0}" text-anchor="${an}">${esc(t.label)}</text><text x="${bx}" y="${y0 + 14}" text-anchor="${an}">${val}</text>${t.tag ? `<text class="hx-tag" x="${bx}" y="${y0 + 25}" text-anchor="${an}">${esc(t.tag)}</text>` : ''}</g>`;
    }
    let tx = '';
    for (const t of P.texts || [])
      tx += t.key
        ? `<text class="hx-lab hx-live" x="${t.x}" y="${t.y}" text-anchor="${t.anchor || 'start'}">${esc(t.s)} <tspan class="hx-val" data-hv="${esc(t.key)}" data-dp="${t.dp == null ? 1 : t.dp}">-----</tspan><tspan class="hx-unit"> ${esc(t.unit || '')}</tspan></text>`
        : `<text class="${t.cls || 'hx-note'}" x="${t.x}" y="${t.y}" text-anchor="${t.anchor || 'start'}">${esc(t.s)}</text>`;
    const legend =
      used.map(m => `<span><i style="background:var(--hx-m-${m})"></i>${MEDIA[m] || m}</span>`).join('') +
      `<em>Red = running / open · Green = stopped / closed · Grey = no signal in the app yet</em>`;
    return {
      svg: `<svg viewBox="0 0 ${P.w || W} ${P.h}"${real ? ' class="hx-real"' : ''} role="img" aria-label="${esc(def.title)} process">${under}${tx}${ls}${sig}${ends}${nodes}${taps}</svg>`,
      legend
    };
  }

  /* ---------- what can be operated on a page (for the Controls view and the status line) ---------- */
  function inventory(def) {
    const seen = new Set(),
      loops = [],
      machs = [],
      valves = [];
    const add = (arr, id, name) => {
      if (!id || seen.has(arr === loops ? 'l' + id : arr === machs ? 'm' + id : 'v' + id)) return;
      seen.add(arr === loops ? 'l' + id : arr === machs ? 'm' + id : 'v' + id);
      arr.push({ id, name });
    };
    const all = def.plan ? def.plan.items : def.lanes.flatMap(L => L.items.flatMap(c => (Array.isArray(c) ? c : [c])));
    for (const it of all) {
      if (it.k === 'loop') add(loops, it.loop, it.cname || it.name);
      if (it.k === 'mach') add(machs, it.mach, it.cname || it.name);
      if (it.k === 'valve') add(valves, it.valve, it.cname || it.name);
    }
    for (const x of def.loops || []) add(loops, x[0], x[1]);
    for (const x of def.machines || []) add(machs, x[0], x[1]);
    for (const x of def.valves || []) add(valves, x[0], x[1]);
    return { loops, machs, valves };
  }
  const modeCls = m => (/MAN/i.test(m || '') ? 'man' : /REM|CAS/i.test(m || '') ? 'rem' : '');
  const modeTxt = m =>
    !m
      ? '-----'
      : /MAN/i.test(m)
        ? 'Manual'
        : /REM/i.test(m)
          ? 'Remote'
          : /CAS/i.test(m)
            ? 'Cascade'
            : /AUT/i.test(m)
              ? 'Auto'
              : m;
  const stTxt = s => (s === 'run' ? 'Running' : s === 'stop' ? 'Stopped' : s === 'trip' ? 'Tripped' : '-----');

  function drawControls(def, inv) {
    let h = '';
    if (inv.loops.length) {
      h += `<h2 class="hx-sec">Control loops · ${inv.loops.length}</h2><div class="hx-cards">`;
      for (const l of inv.loops)
        h += `<button class="hx-card" data-open="loop:${esc(l.id)}" data-card-loop="${esc(l.id)}"><span class="t"><b>${esc(l.name)}</b><span class="hx-pill" data-f="mode">-----</span></span><span class="g">${esc(l.id)}</span><span class="hx-row"><span>Measured</span><span class="hx-bar pv"><i data-f="pvb"></i></span><b data-f="pv">-----</b></span><span class="hx-row"><span>Set point</span><span></span><b data-f="sv">-----</b></span><span class="hx-row"><span>Output</span><span class="hx-bar"><i data-f="mvb"></i></span><b data-f="mv">-----</b></span></button>`;
      h += '</div>';
    }
    if (inv.machs.length) {
      h += `<h2 class="hx-sec">Machines · ${inv.machs.length}</h2><div class="hx-cards">`;
      for (const m of inv.machs)
        h += `<div class="hx-card" data-card-mach="${esc(m.id)}"><span class="t"><b>${esc(m.name)}</b><span class="hx-pill" data-f="st">-----</span></span><span class="g">${esc(m.id)}</span><span class="hx-foot"><span data-f="mode">-----</span><span><button class="hx-pill" data-open="mach:${esc(m.id)}">Control</button> <button class="hx-ynb" data-yn="mach:${esc(m.id)}" title="Permissive · trend · monitor">-</button></span></span></div>`;
      h += '</div>';
    }
    if (inv.valves.length) {
      h += `<h2 class="hx-sec">On / off valves · ${inv.valves.length}</h2><div class="hx-cards">`;
      for (const v of inv.valves)
        h += `<button class="hx-card" data-open="valve:${esc(v.id)}" data-card-valve="${esc(v.id)}"><span class="t"><b>${esc(v.name)}</b><span class="hx-pill" data-f="st">-----</span></span><span class="g">${esc(v.id)}</span><span class="hx-foot"><span data-f="mode"></span><span data-f="pct"></span></span></button>`;
      h += '</div>';
    }
    return h || '<p style="padding:14px;color:var(--hx-mute)">Nothing is operated from this page.</p>';
  }

  /* ---------- trend recorder: one for all pages; samples the pens every STEP seconds of simulation time ---------- */
  const REC = (HX.rec = { step: 2, keep: 7200, buf: {}, last: -1e9 });
  const penVal = key => {
    const D = HX.data,
      k = key.slice(0, 3);
    if (k === 'pv:' || k === 'sv:' || k === 'mv:') return (D.loop(key.slice(3)) || {})[k.slice(0, 2)] ?? null;
    if (key.slice(0, 2) === 'x:') {
      const v = D.valve(key.slice(2)) || {};
      return v.pct != null ? v.pct : v.open == null ? null : v.open ? 100 : 0;
    }
    return D.value(key);
  };
  REC.watch = key => REC.buf[key] || (REC.buf[key] = []);
  REC.sample = () => {
    const t = HX.data.time();
    if (t - REC.last < REC.step) return;
    REC.last = t;
    for (const k in REC.buf) {
      const b = REC.buf[k],
        v = penVal(k);
      b.push([t, v]);
      while (b.length && t - b[0][0] > REC.keep) b.shift();
    }
  };
  function drawTrends(def) {
    if (!(def.trends || []).length)
      return '<p style="padding:14px;color:var(--hx-mute)">No trend group is set for this page yet.</p>';
    let h = `<div class="hx-span"><span>Time span</span>${[
      [300, '5 min'],
      [900, '15 min'],
      [3600, '1 h'],
      [7200, '2 h']
    ]
      .map(s => `<button data-span="${s[0]}" aria-pressed="${s[0] === 900}">${s[1]}</button>`)
      .join('')}<span style="margin-left:auto">each pen has its own scale, shown beside its name</span></div>`;
    def.trends.forEach((g, gi) => {
      g.pens.forEach(p => REC.watch(p[1]));
      h += `<div class="hx-trend" data-trend="${gi}"><h3>${esc(g.title)}</h3><svg viewBox="0 0 1000 170" preserveAspectRatio="none"></svg><div class="hx-pens">${g.pens.map((p, i) => `<div><i style="background:var(--hx-pen${(i % 6) + 1})"></i><span>${esc(p[0])} <small data-rng="${i}"></small></span><b data-pen="${i}">-----</b></div>`).join('')}</div></div>`;
    });
    return h;
  }
  function paintTrends(root, def, span) {
    const now = HX.data.time();
    root.querySelectorAll('[data-trend]').forEach(box => {
      const g = def.trends[+box.dataset.trend],
        svg = box.querySelector('svg');
      let s = '';
      for (let i = 0; i <= 4; i++)
        s += `<line class="hx-grid" x1="0" x2="1000" y1="${10 + i * 37.5}" y2="${10 + i * 37.5}" vector-effect="non-scaling-stroke"/>`;
      for (let i = 0; i <= 5; i++)
        s += `<line class="hx-grid" y1="10" y2="160" x1="${i * 200}" x2="${i * 200}" vector-effect="non-scaling-stroke"/>`;
      g.pens.forEach((p, i) => {
        const b = REC.buf[p[1]] || [];
        let lo = p[4],
          hi = p[5];
        if (lo == null || hi == null) {
          let a = Infinity,
            z = -Infinity;
          for (const [t, v] of b) if (now - t <= span && v != null) ((a = Math.min(a, v)), (z = Math.max(z, v)));
          if (!isFinite(a)) ((a = 0), (z = 1));
          const pad = Math.max((z - a) * 0.25, Math.abs(z) * 0.01, 0.05);
          lo = a - pad;
          hi = z + pad;
        }
        const rg = box.querySelector(`[data-rng="${i}"]`);
        if (rg) rg.textContent = fmt(lo, p[3] == null ? 1 : p[3]) + ' to ' + fmt(hi, p[3] == null ? 1 : p[3]);
        let d = '';
        for (const [t, v] of b) {
          if (now - t > span || v == null) continue;
          const x = 1000 - ((now - t) / span) * 1000,
            y = 160 - Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1))) * 150;
          d += (d ? 'L' : 'M') + n1(x) + ' ' + n1(y);
        }
        if (d)
          s += `<path d="${d}" fill="none" style="stroke:var(--hx-pen${(i % 6) + 1})" stroke-width="1.8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
        const cur = penVal(p[1]),
          o = box.querySelector(`[data-pen="${i}"]`);
        if (o) o.textContent = fmt(cur, p[3] == null ? 1 : p[3]) + ' ' + p[2];
      });
      svg.innerHTML = s;
    });
  }

  /* the shading of equipment bodies (hx.css .hxo): one gradient for the whole document, its colours are theme tokens */
  function shading() {
    if (document.getElementById('hxg')) return;
    const d = document.createElement('div');
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML =
      '<svg width="0" height="0"><defs><linearGradient id="hxg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--hx-g1)"/><stop offset="0.5" style="stop-color:var(--hx-g2)"/><stop offset="1" style="stop-color:var(--hx-g3)"/></linearGradient>' +
      (REAL._defs || '') +
      '</defs></svg>';
    document.body.append(d);
  }

  /* ---------- mount one page into an element; returns { tick, destroy } ---------- */
  HX.mount = function (host, id, opts) {
    const def = HX.byId[id];
    opts = opts || {};
    if (!def) throw new Error('HX: no page ' + id);
    shading();
    const inv = inventory(def),
      pr = drawProcess(def);
    host.innerHTML = '';
    const page = el('div', 'hx hx-page');
    page.innerHTML =
      `<header class="hx-head"><div><h1>${esc(def.title)}</h1><p>${esc(def.about || '')}</p></div><div class="hx-status" aria-live="off"></div>` +
      `<div class="hx-tabs" role="tablist">${['Process', 'Controls', 'Trends'].map((t, i) => `<button role="tab" data-view="${t.toLowerCase()}" aria-selected="${i === 0}">${t}</button>`).join('')}</div></header>` +
      `<section class="hx-view hx-process"><div class="hx-draw">${pr.svg}</div>${(def.lists || []).length ? `<div class="hx-lists">${def.lists.map(l => `<div><h3>${esc(l.title)}</h3><small>${esc(l.src || '')}</small>${l.rows.map(r => `<p><span class="hx-ynb" data-flag="${esc((l.key || '') + '|' + r)}">-</span>${esc(r)}</p>`).join('')}</div>`).join('')}</div>` : ''}<div class="hx-legend">${pr.legend}</div></section><section class="hx-view hx-controls" hidden>${drawControls(def, inv)}</section><section class="hx-view hx-trends" hidden>${drawTrends(def)}</section>`;
    host.append(page);
    let view = opts.view || 'process',
      span = 900;
    const show = v => {
      view = v;
      page.querySelectorAll('.hx-view').forEach(s => (s.hidden = !s.classList.contains('hx-' + v)));
      page.querySelectorAll('.hx-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.view === v));
      tick(true);
    };
    page.addEventListener('click', e => {
      const t = e.target.closest('[data-view],[data-yn],[data-open],[data-go],[data-span],[data-press]');
      if (!t) return;
      if (t.dataset.view) return show(t.dataset.view);
      if (t.dataset.span) {
        span = +t.dataset.span;
        page.querySelectorAll('[data-span]').forEach(b => b.setAttribute('aria-pressed', b === t));
        return paintTrends(page, def, span);
      }
      if (t.dataset.go) return opts.go && opts.go(t.dataset.go);
      if (t.dataset.press) return void (HX.data.press && HX.data.press(t.dataset.hook));
      if (!t.dataset.open && !t.dataset.yn) return;
      const anchor = t.closest('.hx-node') || t,
        go = (kind, id, second) =>
          HX.card
            ? HX.card(kind, id, second, anchor, anchor.dataset && anchor.dataset.name)
            : HX.data.open(kind, id, second);
      if (t.dataset.yn) {
        e.stopPropagation();
        const [yk, ...yr] = t.dataset.yn.split(':');
        return go(yk, yr.join(':'), true);
      }
      const [k, ...r] = t.dataset.open.split(':');
      go(k, r.join(':'), false);
    });
    page.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.hx-node[data-open],.hx-link,.hx-hook.press')) {
        e.preventDefault();
        e.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
    const Q = s => page.querySelectorAll(s);
    /* realistic look: the mark on a valve stem rises with the opening, the blades of a louver turn with it (hx.css eases both) */
    const travel = (e, pc) => {
      const f = Math.max(0, Math.min(1, (pc || 0) / 100));
      e.querySelectorAll('[data-stem]').forEach(s => (s.style.transform = `translateY(${n1(-s.dataset.stem * f)}px)`));
      e.querySelectorAll('[data-blr]').forEach(b => (b.style.transform = `rotate(${n1(90 * f)}deg)`));
    };
    const setCls = (e, c) => {
      const cur = e.getAttribute('class').replace(/\s*hx-(run|stop|trip|none)\b/g, '');
      e.setAttribute('class', cur + ' hx-' + c);
    };
    function tick(force) {
      const D = HX.data;
      REC.sample();
      /* status line */
      let run = 0,
        man = 0,
        trip = 0;
      for (const m of inv.machs) {
        const s = (D.machine(m.id) || {}).st;
        if (s === 'run') run++;
        if (s === 'trip') trip++;
      }
      for (const l of inv.loops) if (/MAN/i.test((D.loop(l.id) || {}).mode || '')) man++;
      const st = [];
      if (inv.machs.length) st.push(`<span>${run} of ${inv.machs.length} machines running</span>`);
      if (inv.loops.length)
        st.push(
          `<span class="${man ? 'w' : ''}">${man ? man + ' of ' + inv.loops.length + ' loops in manual' : 'all ' + inv.loops.length + ' loops in auto'}</span>`
        );
      if (trip) st.push(`<span class="w">${trip} tripped</span>`);
      const sb = page.querySelector('.hx-status'),
        sh = st.join('');
      if (sb.innerHTML !== sh) sb.innerHTML = sh;
      if (view === 'process' || force) {
        Q('[data-hv]').forEach(e => {
          const t = fmt(penVal(e.dataset.hv), +e.dataset.dp);
          if (e.textContent !== t) e.textContent = t;
        });
        Q('[data-hook]').forEach(e => {
          const h = (D.hook && D.hook(e.dataset.hook, e.dataset.label)) || {},
            c =
              'hx-hook' +
              (e.dataset.press ? ' press' : '') +
              (e.dataset.plain ? ' plain' : '') +
              (h.tone ? ' ' + h.tone : '');
          if (e.getAttribute('class') !== c) e.setAttribute('class', c);
          const st = e.querySelector('[data-hks]'),
            tx = h.text || '-----';
          if (st && st.textContent !== tx) st.textContent = tx;
        });
        Q('[data-flag]').forEach(e => {
          const f = D.flag ? D.flag(e.dataset.flag) : null;
          e.className = 'hx-ynb ' + (f == null ? '' : f ? 'y' : 'n');
          e.textContent = f == null ? '-' : f ? 'Y' : 'N';
        });
        Q('[data-st]').forEach(e => {
          const m = D.machine(e.dataset.st) || {},
            t = stTxt(m.st) + (m.mode ? ' · ' + m.mode : '');
          if (e.textContent !== t) e.textContent = t;
          e.setAttribute('class', 'hx-st ' + (m.st || 'none'));
        });
        Q('.hx-node[data-ms]').forEach(e => setCls(e, (D.machine(e.dataset.ms) || {}).st || 'none'));
        Q('.hx-node[data-on]').forEach(e => setCls(e, flowing(e.dataset.on) ? 'run' : 'stop'));
        Q('.hx-node[data-vv]').forEach(e => {
          const v = D.valve(e.dataset.vv) || {},
            o = v.open != null ? v.open : v.pct != null ? v.pct > 1 : null;
          setCls(e, o == null ? 'none' : o ? 'run' : 'stop');
          travel(e, v.pct != null ? v.pct : o ? 100 : 0);
        });
        Q('.hx-node[data-lv2]').forEach(e => {
          const mv = (D.loop(e.dataset.lv2) || {}).mv;
          setCls(e, mv == null ? 'none' : mv > 1 ? 'run' : 'stop');
          travel(e, mv);
          e.querySelectorAll('[data-bl]').forEach(b =>
            b.setAttribute('transform', `rotate(${n1(90 * Math.max(0, Math.min(1, (mv || 0) / 100)))})`)
          );
        });
        Q('[data-vs]').forEach(e => {
          const v = D.valve(e.dataset.vs) || {},
            o = v.open != null ? v.open : v.pct != null ? v.pct > 1 : null,
            t = o == null ? '-----' : (o ? 'Open' : 'Closed') + (v.pct != null ? ' ' + fmt(v.pct, 0) + ' %' : '');
          if (e.textContent !== t) e.textContent = t;
          e.setAttribute('class', 'hx-st ' + (o == null ? 'none' : o ? 'run' : 'stop'));
        });
        Q('[data-mode]').forEach(e => {
          const l = D.loop(e.dataset.mode) || {};
          e.setAttribute('class', 'hx-mode ' + modeCls(l.mode));
          const t = e.querySelector('text');
          if (t.textContent !== modeTxt(l.mode)) t.textContent = modeTxt(l.mode);
        });
        Q('[data-lp]').forEach(e => {
          const [tag, f, dp] = e.dataset.lp.split('|'),
            l = D.loop(tag) || {},
            t = fmt(l[f], dp == null ? 1 : +dp);
          if (e.textContent !== t) e.textContent = t;
        });
        Q('.hx-yn[data-yn]').forEach(e => {
          const [yk, ...yr] = e.dataset.yn.split(':'),
            p = ((yk === 'valve' ? D.valve(yr.join(':')) : D.machine(yr.join(':'))) || {}).perm;
          e.setAttribute('class', 'hx-yn ' + (p == null ? '' : p ? 'y' : 'n'));
          e.querySelector('text').textContent = p == null ? '-' : p ? 'Y' : 'N';
        });
        Q('[data-level]').forEach(e => {
          const [key, lo, hi] = e.dataset.level.split('|'),
            v = D.value(key),
            r = e.querySelector('[data-lv]');
          if (!r) return;
          const [y0, y1] = r.dataset.lv.split(',').map(Number),
            f = v == null ? 0.5 : Math.max(0.04, Math.min(1, (v - lo) / (hi - lo)));
          r.setAttribute('y', n1(y1 - (y1 - y0) * f));
          r.setAttribute('height', n1((y1 - y0) * f));
        });
        Q('g[data-flow]').forEach(e => {
          const f = e.dataset.flow ? flowing(e.dataset.flow) : null;
          e.setAttribute('class', f == null ? '' : f ? 'hx-on' : 'hx-idle');
        });
      }
      if (view === 'controls') {
        Q('[data-card-loop]').forEach(c => {
          const l = D.loop(c.dataset.cardLoop) || {},
            F = f => c.querySelector(`[data-f="${f}"]`),
            u = l.unit ? ' ' + l.unit : '';
          F('mode').textContent = modeTxt(l.mode);
          F('mode').className = 'hx-pill ' + modeCls(l.mode);
          F('pv').textContent = fmt(l.pv, 1) + (l.pv == null ? '' : u);
          F('sv').textContent = fmt(l.sv, 1) + (l.sv == null ? '' : u);
          F('mv').textContent = fmt(l.mv, 1) + (l.mv == null ? '' : ' %');
          F('mvb').style.width = Math.max(0, Math.min(100, l.mv || 0)) + '%';
          F('pvb').style.width =
            l.pv == null || !l.sv ? '0%' : Math.max(0, Math.min(100, (l.pv / (l.sv * 2)) * 100)) + '%';
        });
        Q('[data-card-mach]').forEach(c => {
          const m = D.machine(c.dataset.cardMach) || {},
            F = f => c.querySelector(`[data-f="${f}"]`);
          F('st').textContent = stTxt(m.st);
          F('st').className = 'hx-pill ' + (m.st || '');
          F('mode').textContent = m.mode || '';
          const y = c.querySelector('.hx-ynb');
          y.className = 'hx-ynb ' + (m.perm == null ? '' : m.perm ? 'y' : 'n');
          y.textContent = m.perm == null ? '-' : m.perm ? 'Y' : 'N';
        });
        Q('[data-card-valve]').forEach(c => {
          const v = D.valve(c.dataset.cardValve) || {},
            o = v.open != null ? v.open : v.pct != null ? v.pct > 1 : null,
            F = f => c.querySelector(`[data-f="${f}"]`);
          F('st').textContent = o == null ? '-----' : o ? 'Open' : 'Closed';
          F('st').className = 'hx-pill ' + (o == null ? '' : o ? 'run' : 'stop');
          F('mode').textContent = v.mode || '';
          F('pct').textContent = v.pct == null ? '' : fmt(v.pct, 0) + ' %';
        });
      }
      if (view === 'trends') paintTrends(page, def, span);
    }
    (def.trends || []).forEach(g => g.pens.forEach(p => REC.watch(p[1])));
    show(view);
    const timer = opts.noTimer ? 0 : setInterval(tick, opts.period || 1000);
    return {
      tick,
      show,
      def,
      destroy: () => (clearInterval(timer), HX.closeCards && HX.closeCards(), (host.innerHTML = ''))
    };
  };

  /* ---------- the shell of the mockup: page rail + unit strip + one page. The app has its own shell: there use HX.mount only ---------- */
  HX.shell = function (host, opts) {
    opts = opts || {};
    const groups = [];
    for (const p of HX.pages)
      (groups.find(g => g.name === p.group) || groups[groups.push({ name: p.group, pages: [] }) - 1]).pages.push(p);
    /* HX.soon: systems that are not drawn yet (title only): listed grey, not clickable */
    const soonG = [];
    for (const p of HX.soon || [])
      if (!HX.byId[p.id])
        (soonG.find(g => g.name === p.group) || soonG[soonG.push({ name: p.group, pages: [] }) - 1]).pages.push(p);
    host.classList.add('hx');
    host.innerHTML =
      `<div class="hx-shell"><nav class="hx-nav" aria-label="Plant pages">${groups.map(g => `<h2>${esc(g.name)}</h2>${g.pages.map(p => `<button data-page="${p.id}"><i>${String(p.no).padStart(2, '0')}</i>${esc(p.title)}</button>`).join('')}`).join('')}${soonG.length ? `<h2 class="hx-soon-h">To be drawn in this look</h2>${soonG.map(g => g.pages.map(p => `<span class="hx-soon"><i>··</i>${esc(p.title)}</span>`).join('')).join('')}` : ''}${(opts.extra || []).map(x => `<h2>${esc(x.group)}</h2><button data-page="${x.id}"><i>··</i>${esc(x.title)}</button>`).join('')}</nav>` +
      `<div class="hx-main"><select class="hx-pick" aria-label="Plant page">${groups.map(g => `<optgroup label="${esc(g.name)}">${g.pages.map(p => `<option value="${p.id}">${String(p.no).padStart(2, '0')} ${esc(p.title)}</option>`).join('')}</optgroup>`).join('')}${(opts.extra || []).map(x => `<option value="${x.id}">${esc(x.title)}</option>`).join('')}</select>` +
      `<div class="hx-strip">${(opts.strip || []).map(s => `<div><span>${esc(s[0])}</span><b data-hv="${esc(s[1])}" data-dp="${s[3] == null ? 1 : s[3]}">-----</b><small>${esc(s[2])}</small></div>`).join('')}</div><div class="hx-slot"></div></div></div>`;
    const slot = host.querySelector('.hx-slot');
    let cur = null;
    const go = id => {
      if (cur) cur.destroy();
      cur = null;
      const x = (opts.extra || []).find(e => e.id === id);
      if (x) {
        slot.innerHTML = '';
        slot.append(x.render());
      } else {
        if (!HX.byId[id]) id = HX.pages[0].id;
        cur = HX.mount(slot, id, { go });
      }
      host
        .querySelectorAll('.hx-nav button')
        .forEach(b =>
          b.dataset.page === id ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')
        );
      host.querySelector('.hx-pick').value = id;
      try {
        history.replaceState(null, '', '#' + id);
      } catch (e) {}
    };
    host.querySelector('.hx-nav').addEventListener('click', e => {
      const b = e.target.closest('[data-page]');
      if (b) go(b.dataset.page);
    });
    host.querySelector('.hx-pick').addEventListener('change', e => go(e.target.value));
    setInterval(() => {
      host.querySelectorAll('.hx-strip [data-hv]').forEach(e => {
        const t = fmt(penVal(e.dataset.hv), +e.dataset.dp);
        if (e.textContent !== t) e.textContent = t;
      });
    }, 1000);
    go((location.hash || '').slice(1) || opts.start || HX.pages[0].id);
    return { go };
  };
})();
