/* PLANT HMI WORKSPACE (2.1.0, draft): a third workspace next to ABC and DITL. Per system (left list) a plant graphic drawn
   after the control-room HMI snapshot (src/ui/plant/systems.js, scaled), with the snapshot text and values; the value list of
   that snapshot on the right (src/ui/plant/values.js). Static snapshot values: no address is linked yet. UI only. */
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
          if (it.v != null) txt(g, it.x + 14, it.y + 6, it.v + ' ' + (it.u || '%'), { z: 13, mono: 1, c: '#5cd6ff' });
          if (it.m) txt(g, it.x - 14, it.y - 10, it.m, { z: 11, c: it.m === 'M' ? '#ffd27a' : '#9ff0c4', a: 'end', b: 1 });
        } else if (it.t === 'mov') {
          valve(g, it, it.st === 'open' ? '#e05555' : '#3fbf6a');
          if (it.tag) txt(g, it.x + 14, it.y - 10, it.tag, { z: 11 });
        } else if (it.t === 'pump' || it.t === 'fan') {
          const c = it.st === 'run' ? '#e05555' : '#3fbf6a';
          g.append(S_('circle', { cx: it.x, cy: it.y, r: 14, fill: 'none', stroke: c, 'stroke-width': 2.5 }));
          if (it.t === 'pump') g.append(S_('polygon', { points: `${it.x - 8},${it.y + 8} ${it.x + 8},${it.y} ${it.x - 8},${it.y - 8}`, fill: c }));
          else g.append(S_('path', { d: `M${it.x - 9},${it.y} L${it.x + 9},${it.y} M${it.x},${it.y - 9} L${it.x},${it.y + 9}`, stroke: c, 'stroke-width': 2.5 }));
          if (it.tag) txt(g, it.x, it.y + 30, it.tag, { z: 11, a: 'middle' });
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
          txt(g, it.x, it.y, (it.v != null ? it.v : '—') + (it.u ? ' ' + it.u : ''), { z: 14, mono: 1, c: '#5cd6ff' });
        } else if (it.t === 'ctl') {
          const bw = 190,
            bh = 74;
          g.append(S_('rect', { x: it.x, y: it.y, width: bw, height: bh, rx: 3, fill: '#0d1319', stroke: '#2a6a98', 'stroke-width': 1.5 }));
          txt(g, it.x + 6, it.y + 15, (it.label || it.tag || '').slice(0, 28), { z: 11, c: '#a9b7c4' });
          txt(g, it.x + 6, it.y + 31, it.tag || '', { z: 12, b: 1, mono: 1 });
          if (it.m) txt(g, it.x + bw - 6, it.y + 31, it.m, { z: 12, b: 1, a: 'end', c: it.m === 'M' ? '#ffd27a' : '#9ff0c4' });
          txt(g, it.x + 6, it.y + 50, 'PV ' + (it.pv != null ? it.pv : '—') + '  SV ' + (it.sv != null ? it.sv : '—'), { z: 12, mono: 1, c: '#5cd6ff' });
          txt(g, it.x + 6, it.y + 66, 'MV ' + (it.mv != null ? it.mv + ' %' : '—') + (it.u ? '   ' + it.u : ''), { z: 12, mono: 1, c: '#9ff0c4' });
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
      E('span', { cls: 'pldraft', txt: 'DRAFT · snapshot values, not live · no address linked yet' }),
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
      place();
      setTimeout(() => (cur && cur.g ? draw(cur.g) : fit()), 30);
    }
  }
  window.lsPlant = open;
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
