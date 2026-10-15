/* ===================== HMI VIEW ===================== */
const HM_T = {
  label: { w: 160, h: 26, t: 'Text' },
  lamp: { w: 70, h: 64, t: 'Lamp' },
  num: { w: 120, h: 46, t: 'Number' },
  bar: { w: 54, h: 170, t: 'Bar' },
  button: { w: 110, h: 40, t: 'Button' },
  slider: { w: 230, h: 50, t: 'Slider (analog input)' },
  valve: { w: 64, h: 64, t: 'Valve' },
  motor: { w: 64, h: 64, t: 'Motor / fan' },
  tank: { w: 90, h: 140, t: 'Tank (level)' },
  pipe: { w: 160, h: 12, t: 'Pipe' },
  trend: { w: 280, h: 130, t: 'Trend' },
  face: { w: 214, h: 176, t: 'Faceplate (PID / MAN tag)' }
};
function hmiDef() {
  return {
    mode: 'tab',
    pages: [{ name: 'Page 1', w: 1000, h: 620, bg: null, widgets: [] }],
    cur: 0,
    float: { x: 140, y: 110, w: 780, h: 540 },
    split: 0.42,
    nid: 1
  };
}
function hmiNorm(o) {
  const d = hmiDef();
  if (!o || !Array.isArray(o.pages) || !o.pages.length) return d;
  o.pages.forEach(p => {
    p.widgets = Array.isArray(p.widgets) ? p.widgets : [];
    p.w = p.w || 1000;
    p.h = p.h || 620;
    p.name = p.name || 'Page';
  });
  return Object.assign(d, o, { cur: Math.min(o.cur || 0, o.pages.length - 1) });
}
AN.hmi = hmiDef();
AN.hmiUi = { open: false, edit: false, sel: null, add: null };
AN.hmiSheets = [];
const HM_SV = 'http://www.w3.org/2000/svg',
  hs$ = (t, a, ch) => {
    const e = document.createElementNS(HM_SV, t);
    if (a) for (const k in a) e.setAttribute(k, a[k]);
    (ch || []).forEach(c => e.append(c));
    return e;
  },
  ht$ = (s, a) => {
    const e = hs$('text', a);
    e.textContent = s;
    return e;
  };
const hmN = s =>
  String(s || '')
    .trim()
    .toUpperCase()
    .replace(/^S\d\s+/, '')
    .replace(/\s+/g, ' ');
/* index: text -> wires (all sheets), tag -> blocks */
function hmiIndex() {
  if (AN._hx) return AN._hx;
  const ix = new Map(),
    blk = new Map(),
    put = (m, k, v) => {
      k = hmN(k);
      if (!k) return;
      const a = m.get(k) || [];
      if (!a.some(q => q.sh === v.sh && q.n === v.n && q.b === v.b)) a.push(v);
      m.set(k, a);
    };
  for (const sh of AN.sheets) {
    if (/ABC-000/.test(sh.name)) continue;
    let S;
    try {
      S = ensure(sh);
    } catch (e) {
      continue;
    }
    S.lab.forEach((l, n) => {
      if (l && l.t) put(ix, l.t, { sh, n });
    });
    (S.tagN || []).forEach(q => {
      if (q.d <= 4) put(ix, q.t, { sh, n: q.n });
    });
    try {
      const d = dsIdx(sh);
      for (const [n, refs] of d.from) refs.forEach(r => put(ix, r, { sh, n, ditl: 'from' }));
      for (const [n, refs] of d.to) refs.forEach(r => put(ix, r, { sh, n, ditl: 'to' }));
    } catch (e) {}
    for (const b of S.blk) {
      if (!['PID', 'PIDV', 'MAN', 'SUMA', 'ALM', 'FX'].includes(b.k)) continue;
      for (const t of b.txt || []) {
        if (/^[A-Z][A-Z0-9\-.]{2,}$/.test(t) && !/^(PID|PIDV|MAN|SUMA|ALM|AI|AO|FX)$/i.test(t) && !/^S\d-MDL/i.test(t))
          put(blk, t, { sh, b: b.id, k: b.k });
      }
    }
  }
  return (AN._hx = { ix, blk });
}
function hmiFind(addr) {
  const c = hmiIndex().ix.get(hmN(addr)) || [];
  return c.map(q => {
    const S = q.sh.S;
    return Object.assign({}, q, {
      ext: S.ext.includes(q.n) && !(S.xlk && S.xlk[q.n]),
      drv: (S.drv[q.n] || []).some(d => d.k !== 'LINK')
    });
  });
}
function hmiPick(w, a) {
  if (a == null && !w.addr && w.nn != null && w.sheet) {
    const sh = AN.sheets.find(s => s.name === w.sheet);
    if (sh && sh.S && sh.S.nets[w.nn]) {
      const S = sh.S;
      return {
        sh,
        n: w.nn,
        ext: S.ext.includes(w.nn) && !(S.xlk && S.xlk[w.nn]),
        drv: (S.drv[w.nn] || []).some(d => d.k !== 'LINK')
      };
    }
    return null;
  }
  const ad = a == null ? w.addr : a;
  if (!ad) return null;
  const c = hmiFind(ad);
  if (!c.length) return null;
  if (w.sheet) {
    const m = c.find(q => q.sh.name === w.sheet);
    if (m) return m;
  }
  const wr = w.type === 'button' || w.type === 'slider',
    pr = wr ? q => (q.ext ? 0 : 1) : q => (q.drv ? 0 : q.ext ? 1 : 2);
  return c.slice().sort((x, y) => pr(x) - pr(y))[0];
}
function hmiVal(w, a) {
  const p = hmiPick(w, a);
  if (!p) return null;
  const S = p.sh.S;
  if (!S || !S.rt || !S.rt.v) return null;
  const v = S.rt.v[p.n];
  return v == null ? null : v;
}
function hmiDig(w, a) {
  const p = hmiPick(w, a);
  return p ? !!p.sh.S.nets[p.n].dig : true;
}
function hmiWrite(w, v, rel) {
  const p = hmiPick(w);
  if (!p) {
    msg('HMI: the address "' + w.addr + '" was not found on any sheet');
    return;
  }
  hmiSync();
  if (p.ext) {
    if (rel === true) return;
    setExt(p.sh, p.n, v);
  } else setForce(p.sh, p.n, rel === true ? undefined : v);
}
function hmiBlk(w) {
  const c = hmiIndex().blk.get(hmN(w.addr)) || [];
  if (!c.length) return null;
  const q = (w.sheet && c.find(x => x.sh.name === w.sheet)) || c[0],
    b = q.sh.S.blk.find(x => x.id === q.b);
  return b ? { sh: q.sh, b } : null;
}
function hmiNets(sh, b) {
  const S = sh.S,
    o = [],
    add = (n, name, u) => {
      if (n != null && n >= 0 && S.nets[n] && !o.some(q => q.n === n)) o.push({ n, name, u });
    };
  if ((b.k === 'PID' || b.k === 'PIDV') && b.in0 >= 0) {
    const pn = anPins(S, b);
    if (pn) {
      if (pn.sv >= 0) add(pn.sv, 'SV');
      add(pn.pv, 'PV');
    }
    (b.o || []).slice(0, 1).forEach(n => add(n, 'MV'));
  } else {
    (b.i || []).slice(0, 2).forEach((n, i) => add(n, 'IN' + (i + 1)));
    (b.o || []).slice(0, 1).forEach(n => add(n, 'OUT'));
  }
  return o;
}
/* sheets that must keep running because a widget reads / writes them */
function hmiSync() {
  const s = new Set();
  if (AN.hmiUi.open)
    for (const p of AN.hmi.pages)
      for (const w of p.widgets) {
        for (const a of [w.addr, w.addr2, w.addr3]) {
          if (!a) continue;
          const c = w.type === 'face' ? hmiBlk(w) || {} : hmiPick(w, a) || {};
          if (c.sh) s.add(c.sh.name);
        }
      }
  AN.hmiSheets = [...s];
}
/* ---------- widgets ---------- */
function hmiSlider(g, x, y, W, get, set, lo, hi, col, dis) {
  const tr = hs$('rect', { x: x, y: y + 8, width: W, height: 4, fill: '#33424b', rx: 2, 'data-ctl': 1 }),
    kn = hs$('rect', {
      x: x,
      y: y + 1,
      width: 8,
      height: 18,
      fill: col,
      rx: 2,
      style: 'cursor:ew-resize',
      'data-ctl': 1
    }),
    vt = ht$('', { x: x + W, y: y - 3, 'text-anchor': 'end', fill: '#e6edf3', 'font-size': 11 });
  const hz = hs$('rect', {
    x: x,
    y: y - 4,
    width: W,
    height: 28,
    fill: 'transparent',
    style: 'cursor:ew-resize',
    'data-ctl': 1
  });
  g.append(tr, kn, hz, vt);
  const ui = () => {
    const v = get(),
      f = v == null ? 0 : Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1)));
    kn.setAttribute('x', x + f * (W - 8));
    vt.textContent = v == null ? '--' : fmt(v);
  };
  let dr = false;
  const mv = e => {
    const sv_ = g.ownerSVGElement,
      pt = sv_.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = g.getScreenCTM().inverse(),
      q = pt.matrixTransform(m),
      f = Math.max(0, Math.min(1, (q.x - x - 4) / (W - 8)));
    set(lo + f * (hi - lo));
  };
  if (!dis) {
    const dn = e => {
      if (AN.hmiUi.edit) return;
      dr = true;
      e.stopPropagation();
      e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
      mv(e);
    };
    vt.style.cursor = 'text';
    vt.ondblclick = () => {
      if (AN.hmiUi.edit) return;
      const t = prompt('Value', get() == null ? '' : fmt(get()));
      if (t === null) return;
      const n = parseFloat(t);
      if (isFinite(n)) set(n);
    };
    [kn, tr, hz].forEach(el => {
      el.onpointerdown = dn;
      el.onpointermove = e => {
        if (dr) mv(e);
      };
      el.onpointerup = () => {
        dr = false;
      };
    });
  }
  return ui;
}
function hmiBuild(w) {
  const g = hs$('g', { 'data-id': w.id, transform: 'translate(' + w.x + ',' + w.y + ')' }),
    W = w.w,
    H = w.h,
    col = w.col || '#35e08a',
    D = () => hmiDig(w),
    on = v => v != null && v > 0.5,
    upd = [],
    tip = h$('div'),
    fm = v => (v == null ? '--' : D() ? (v > 0.5 ? '1' : '0') : fmt(v)),
    lab = (y, sz, a) =>
      ht$(w.label || '', { x: W / 2, y: y, 'text-anchor': 'middle', fill: '#c9d4dc', 'font-size': sz || 11 }),
    hit = hs$('rect', { x: 0, y: 0, width: W, height: H, fill: 'transparent' });
  const U = f => upd.push(f);
  switch (w.type) {
    case 'label':
      g.append(
        ht$(w.label || 'Text', { x: 0, y: H * 0.72, fill: w.col || '#e6edf3', 'font-size': Math.max(10, H * 0.62) })
      );
      break;
    case 'lamp': {
      const c = hs$('circle', {
        cx: W / 2,
        cy: H * 0.36,
        r: Math.max(6, Math.min(W, H * 0.7) / 2 - 2),
        stroke: '#667',
        fill: '#2a343b'
      });
      g.append(c, lab(H - 4));
      U(() => c.setAttribute('fill', on(hmiVal(w)) ? col : '#2a343b'));
      break;
    }
    case 'num': {
      const r = hs$('rect', { x: 0, y: 0, width: W, height: H, rx: 4, fill: '#10181d', stroke: '#33424b' }),
        t = ht$('', {
          x: W - 8,
          y: H - 9,
          'text-anchor': 'end',
          fill: col,
          'font-size': Math.min(22, H * 0.5),
          'font-family': 'Consolas,monospace'
        });
      g.append(r, ht$(w.label || '', { x: 6, y: 12, fill: '#9ab', 'font-size': 10 }), t);
      U(() => {
        const v = hmiVal(w);
        t.textContent = fm(v) + (w.unit && !D() ? ' ' + w.unit : '');
      });
      break;
    }
    case 'bar': {
      const lo = +w.min || 0,
        hi = w.max != null && w.max !== '' ? +w.max : 100,
        bg = hs$('rect', { x: W / 2 - 12, y: 16, width: 24, height: H - 34, fill: '#10181d', stroke: '#33424b' }),
        f = hs$('rect', { x: W / 2 - 12, y: H - 18, width: 24, height: 0, fill: col }),
        t = ht$('', { x: W / 2, y: H - 4, 'text-anchor': 'middle', fill: '#e6edf3', 'font-size': 11 });
      g.append(bg, f, lab(11, 10), t);
      U(() => {
        const v = hmiVal(w),
          p = v == null ? 0 : Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1))),
          hh = (H - 34) * p;
        f.setAttribute('y', H - 18 - hh);
        f.setAttribute('height', hh);
        t.textContent = fm(v);
      });
      break;
    }
    case 'button': {
      const r = hs$('rect', {
          x: 0,
          y: 0,
          width: W,
          height: H,
          rx: 5,
          fill: '#26323a',
          stroke: '#667',
          style: 'cursor:pointer',
          'data-ctl': 1
        }),
        t = ht$(w.label || 'Button', {
          x: W / 2,
          y: H / 2 + 4,
          'text-anchor': 'middle',
          fill: '#e6edf3',
          'font-size': 12,
          style: 'pointer-events:none'
        }),
        fo = ht$('', {
          x: W - 4,
          y: 10,
          'text-anchor': 'end',
          fill: '#ffb04d',
          'font-size': 9,
          style: 'pointer-events:none'
        });
      g.append(r, t, fo);
      U(() => {
        const p = hmiPick(w),
          v = hmiVal(w);
        r.setAttribute('fill', on(v) ? col : '#26323a');
        t.setAttribute('fill', on(v) ? '#05140b' : '#e6edf3');
        r.setAttribute('stroke', p ? '#8a98a3' : '#ff4d4d');
        const fz = p && !p.ext && p.sh.S.rt.force && p.sh.S.rt.force[p.n] !== undefined;
        fo.textContent = fz ? 'FORCED' : p && !p.ext ? 'force' : '';
      });
      r.onpointerdown = e => {
        if (AN.hmiUi.edit) return;
        e.stopPropagation();
        const p = hmiPick(w);
        if (!p) {
          msg('HMI: the address "' + w.addr + '" was not found on any sheet');
          return;
        }
        if (e.shiftKey && !p.ext) {
          hmiWrite(w, 0, true);
          return;
        }
        if (w.mom) {
          r._m = 1;
          r.setPointerCapture && r.setPointerCapture(e.pointerId);
          hmiWrite(w, 1);
        } else hmiWrite(w, on(hmiVal(w)) ? 0 : 1);
      };
      r.onpointerup = () => {
        if (w.mom && r._m) {
          r._m = 0;
          hmiWrite(w, 0);
        }
      };
      break;
    }
    case 'slider': {
      g.append(ht$(w.label || '', { x: 0, y: 10, fill: '#c9d4dc', 'font-size': 11 }));
      const lo = +w.min || 0,
        hi = w.max != null && w.max !== '' ? +w.max : 100;
      const p0 = () => hmiPick(w);
      U(
        hmiSlider(
          g,
          0,
          22,
          W,
          () => hmiVal(w),
          v => hmiWrite(w, v),
          lo,
          hi,
          col,
          false
        )
      );
      break;
    }
    case 'valve': {
      const a = hs$('polygon', {
          points: '4,' + H * 0.25 + ' ' + W / 2 + ',' + H * 0.5 + ' 4,' + H * 0.75,
          fill: '#2a343b',
          stroke: '#889'
        }),
        b = hs$('polygon', {
          points: W - 4 + ',' + H * 0.25 + ' ' + W / 2 + ',' + H * 0.5 + ' ' + (W - 4) + ',' + H * 0.75,
          fill: '#2a343b',
          stroke: '#889'
        });
      g.append(a, b, lab(H - 4, 10));
      U(() => {
        const v = hmiVal(w),
          c =
            v == null
              ? '#2a343b'
              : D()
                ? on(v)
                  ? col
                  : '#2a343b'
                : 'rgba(53,224,138,' + (0.15 + 0.85 * Math.max(0, Math.min(1, v / 100))) + ')';
        a.setAttribute('fill', c);
        b.setAttribute('fill', c);
      });
      break;
    }
    case 'motor': {
      const c = hs$('circle', { cx: W / 2, cy: H * 0.4, r: Math.min(W, H) * 0.36, fill: '#2a343b', stroke: '#889' });
      g.append(
        c,
        ht$('M', { x: W / 2, y: H * 0.4 + 5, 'text-anchor': 'middle', fill: '#e6edf3', 'font-size': 16 }),
        lab(H - 4, 10)
      );
      U(() => c.setAttribute('fill', on(hmiVal(w)) ? col : '#2a343b'));
      break;
    }
    case 'tank': {
      const lo = +w.min || 0,
        hi = w.max != null && w.max !== '' ? +w.max : 100,
        o = hs$('rect', { x: 10, y: 6, width: W - 20, height: H - 30, fill: '#10181d', stroke: '#889', rx: 6 }),
        f = hs$('rect', { x: 11, y: H - 25, width: W - 22, height: 0, fill: '#2f7fc9' }),
        t = ht$('', { x: W / 2, y: H / 2, 'text-anchor': 'middle', fill: '#fff', 'font-size': 12 });
      g.append(o, f, t, lab(H - 6, 11));
      U(() => {
        const v = hmiVal(w),
          p = v == null ? 0 : Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1))),
          hh = (H - 32) * p;
        f.setAttribute('y', H - 25 - hh);
        f.setAttribute('height', hh);
        t.textContent = fm(v);
      });
      break;
    }
    case 'pipe': {
      const vert = H > W,
        l = hs$('line', {
          x1: vert ? W / 2 : 0,
          y1: vert ? 0 : H / 2,
          x2: vert ? W / 2 : W,
          y2: vert ? H : H / 2,
          stroke: '#445',
          ['stroke-width']: Math.min(W, H) > 6 ? Math.min(W, H) : 8,
          ['stroke-linecap']: 'round'
        });
      g.append(l);
      U(() => {
        const v = w.addr ? hmiVal(w) : 1;
        l.setAttribute('stroke', on(v) ? '#37b7e0' : '#445');
      });
      break;
    }
    case 'trend': {
      const bg = hs$('rect', { x: 0, y: 0, width: W, height: H, fill: '#0b1013', stroke: '#33424b' }),
        ls = [0, 1, 2].map(i =>
          hs$('polyline', { fill: 'none', stroke: TR_COL[i], ['stroke-width']: 1.5, points: '' })
        ),
        t = ht$(w.label || '', { x: 6, y: 11, fill: '#9ab', 'font-size': 10 });
      g.append(bg, t, ...ls);
      w._buf = w._buf || [[], [], []];
      U(() => {
        const ads = [w.addr, w.addr2, w.addr3];
        let lo = 1e30,
          hi = -1e30;
        ads.forEach((a, i) => {
          if (!a) return;
          const v = hmiVal(w, a);
          if (v == null) return;
          if (i === 0) {
            const t_ = performance.now();
            w._go = t_ - (w._lt || 0) >= 240;
            if (w._go) w._lt = t_;
          }
          if (!w._go) return;
          w._buf[i].push(v);
          if (w._buf[i].length > 240) w._buf[i].shift();
        });
        ads.forEach((a, i) => {
          if (a)
            w._buf[i].forEach(v => {
              if (v < lo) lo = v;
              if (v > hi) hi = v;
            });
        });
        if (w.min !== '' && w.min != null) lo = +w.min;
        if (w.max !== '' && w.max != null) hi = +w.max;
        if (lo > hi) {
          lo = 0;
          hi = 1;
        }
        if (hi - lo < 1e-9) {
          lo -= 0.5;
          hi += 0.5;
        }
        ls.forEach((l, i) => {
          const b = w._buf[i];
          l.setAttribute(
            'points',
            b
              .map(
                (v, k) =>
                  (4 + (k * (W - 8)) / 239).toFixed(1) + ',' + (H - 6 - ((v - lo) / (hi - lo)) * (H - 18)).toFixed(1)
              )
              .join(' ')
          );
        });
      });
      break;
    }
    case 'face': {
      const r = hs$('rect', { x: 0, y: 0, width: W, height: H, rx: 6, fill: '#10181d', stroke: '#33424b' });
      g.append(r);
      const bb = hmiBlk(w);
      if (!bb) {
        g.append(
          ht$(w.addr || '(tag?)', { x: 8, y: 20, fill: '#ff4d4d', 'font-size': 12 }),
          ht$('tag not found on any sheet', { x: 8, y: 38, fill: '#9ab', 'font-size': 10 })
        );
        break;
      }
      const nets = hmiNets(bb.sh, bb.b),
        S = bb.sh.S;
      g.append(
        ht$(w.addr + (bb.b.k === 'PIDV' ? ' (PIDV)' : ''), {
          x: 8,
          y: 15,
          fill: '#e6edf3',
          'font-size': 12,
          'font-weight': 'bold'
        }),
        ht$(bb.sh.name, { x: W - 8, y: 15, 'text-anchor': 'end', fill: '#7a8a94', 'font-size': 10 })
      );
      const P = bb.b.p || {},
        rng = P.rlo != null && P.rhi != null ? [+P.rlo, +P.rhi] : [0, 100];
      nets.forEach((q, i) => {
        const y = 26 + i * 26,
          isMV = q.name === 'MV' || q.name === 'OUT',
          lo = isMV ? 0 : rng[0],
          hi = isMV ? 100 : rng[1],
          bg = hs$('rect', { x: 34, y: y + 4, width: W - 100, height: 10, fill: '#0b1013', stroke: '#33424b' }),
          f = hs$('rect', { x: 34, y: y + 4, width: 0, height: 10, fill: TR_COL[i % 7] }),
          t = ht$('', {
            x: W - 8,
            y: y + 13,
            'text-anchor': 'end',
            fill: '#e6edf3',
            'font-size': 11,
            'font-family': 'Consolas,monospace'
          });
        g.append(ht$(q.name, { x: 8, y: y + 13, fill: '#9ab', 'font-size': 11 }), bg, f, t);
        U(() => {
          const v = S.rt.v[q.n],
            p = v == null ? 0 : Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1)));
          f.setAttribute('width', (W - 100) * p);
          t.textContent = S.nets[q.n].dig ? (v > 0.5 ? '1' : '0') : fmt(v);
        });
      });
      const yy = 26 + nets.length * 26 + 4;
      if (bb.b.k === 'MAN') {
        const P2 = bb.b.p;
        g.append(ht$('set', { x: 8, y: yy + 14, fill: '#9ab', 'font-size': 10 }));
        U(
          hmiSlider(
            g,
            34,
            yy + 3,
            W - 44,
            () => {
              const s = S.rt.st[bb.b.id];
              return s ? s.val : null;
            },
            v => {
              const s = S.rt.st[bb.b.id];
              if (!s) return;
              s.val = Math.max(P2.lo, Math.min(P2.hi, v));
              (sv(bb.sh).man = sv(bb.sh).man || {})[bb.b.id] = s.val;
              anSave();
              hmiSync();
              settle();
            },
            P2.lo,
            P2.hi,
            col,
            false
          )
        );
      } else {
        const sv0 = nets.find(q => q.name === 'SV');
        if (sv0 && S.ext.includes(sv0.n) && !(S.xlk && S.xlk[sv0.n])) {
          g.append(ht$('SV', { x: 8, y: yy + 14, fill: '#9ab', 'font-size': 10 }));
          U(
            hmiSlider(
              g,
              34,
              yy + 3,
              W - 44,
              () => S.rt.ext[sv0.n],
              v => {
                setExt(bb.sh, sv0.n, v);
              },
              rng[0],
              rng[1],
              col,
              false
            )
          );
        }
      }
      const ob = hs$('rect', {
        x: W - 62,
        y: H - 24,
        width: 54,
        height: 18,
        rx: 3,
        fill: '#26323a',
        stroke: '#667',
        style: 'cursor:pointer'
      });
      g.append(
        ob,
        ht$('open ▸', {
          x: W - 35,
          y: H - 11,
          'text-anchor': 'middle',
          fill: '#e6edf3',
          'font-size': 10,
          style: 'pointer-events:none'
        })
      );
      ob.onpointerdown = e => {
        if (AN.hmiUi.edit) return;
        e.stopPropagation();
        const i = AN.sheets.indexOf(bb.sh);
        if (i < 0) return;
        if (AN.hmiUi.mode === 'tab' || AN.hmi.mode === 'tab') hmiSetMode('float');
        go(i);
        const s2 = cs();
        AN.sel = { blk: s2.S.blk.find(x => x.id === bb.b.id) };
        selBox();
        paint();
        panelUpd(true);
      };
      break;
    }
  }
  g.append(hit);
  hit.style.cursor = 'default';
  if (!AN.hmiUi.edit) hit.style.pointerEvents = 'none';
  hmiFBox(g, w, W, H, upd);
  g.style.cursor = AN.hmiUi.edit ? 'move' : 'default';
  const h0 = hit;
  g._tip = () => {
    const a = [w.addr, w.addr2, w.addr3].filter(Boolean).map(x => {
      const p = w.type === 'face' ? hmiBlk(w) : hmiPick(w, x);
      if (!p) return x + ' → NOT FOUND';
      const S = p.sh.S,
        n = p.n;
      return (
        x +
        ' → ' +
        p.sh.name +
        (p.b ? ' · block ' + p.b.k : ' · ' + nm(S, n)) +
        (p.ext ? ' · input' : p.drv ? ' · computed' : '')
      );
    });
    return a.join('\n');
  };
  g._upd = () => {
    for (const f of upd) {
      try {
        f();
      } catch (e) {}
    }
  };
  g._upd();
  return g;
}
/* ---------- the view ---------- */
const hmEl = h$('div', { id: 'hmi' }),
  hmSp = h$('div', { id: 'hmisp', title: 'Drag to resize' });
document.head.appendChild(
  h$('style', {
    txt: '#hmi{display:none;flex-direction:column;background:#0b1013;color:var(--tx);font:12px sans-serif;min-width:0;min-height:0}body.an #hmi.on{display:flex}#hmi.tab{flex:1}#hmi.split{flex:0 0 42%}#hmi.float{position:fixed;z-index:9000;border:1px solid var(--acc);box-shadow:0 6px 28px #000c;resize:both;overflow:hidden;min-width:320px;min-height:220px}body.an.hmitab #cv{display:none}#hmisp{display:none;width:6px;cursor:col-resize;background:#1b2830;flex:none}body.an.hmisplit #hmisp{display:block}#hmi .hh{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:5px 8px;background:var(--panel);border-bottom:1px solid var(--line)}#hmi.float .hh{cursor:move}#hmi .hh button,#hmi .hh select{font-size:12px}#hmi .hh button.on{background:#14231b;color:var(--acc)}#hmicv{flex:1;min-height:0;position:relative;overflow:hidden}#hmicv svg{width:100%;height:100%;display:block}#hmi .hp{padding:6px 8px;background:#10181d;border-top:1px solid var(--line);font-size:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}#hmi .hp input,#hmi .hp select{font-size:12px;background:#0b1013;color:var(--tx);border:1px solid var(--line);padding:2px 4px}#hmi .hp label{display:inline-flex;gap:3px;align-items:center;color:#9ab}body.an.hmifloat #hmi{opacity:.97}'
  })
);
const hmHdr = h$('div', { cls: 'hh' }),
  hmCv = h$('div', { id: 'hmicv' }),
  hmPr = h$('div', { cls: 'hp' }),
  hmSvg = hs$('svg', { preserveAspectRatio: 'xMidYMid meet' });
hmCv.append(hmSvg);
hmEl.append(hmHdr, hmCv, hmPr);
document.getElementById('cv').after(hmSp, hmEl);
const hmPg = () => AN.hmi.pages[AN.hmi.cur];
let hmTm = null,
  hmSel = null;
function hmiApplyMode() {
  const m = AN.hmi.mode,
    o = AN.hmiUi.open;
  hmEl.classList.toggle('on', o);
  ['tab', 'split', 'float'].forEach(x => hmEl.classList.toggle(x, o && m === x));
  document.body.classList.toggle('hmitab', o && m === 'tab');
  document.body.classList.toggle('hmisplit', o && m === 'split');
  document.body.classList.toggle('hmifloat', o && m === 'float');
  if (m === 'float') {
    const f = AN.hmi.float;
    hmEl.style.left = f.x + 'px';
    hmEl.style.top = f.y + 'px';
    hmEl.style.width = f.w + 'px';
    hmEl.style.height = f.h + 'px';
  } else {
    hmEl.style.left = hmEl.style.top = hmEl.style.width = hmEl.style.height = '';
    if (m === 'split') hmEl.style.flex = '0 0 ' + Math.round(AN.hmi.split * 100) + '%';
  }
  bHm.classList.toggle('on', o);
  setTimeout(() => dispatchEvent(new Event('resize')), 30);
}
function hmiSetMode(m) {
  AN.hmi.mode = m;
  persistAll();
  hmiApplyMode();
  hmiHeader();
}
function hmiOpen(m) {
  if (m) AN.hmi.mode = m;
  AN.hmiUi.open = true;
  hmiSync();
  hmiApplyMode();
  hmiHeader();
  hmiRender();
  AN.tickHooks = AN.tickHooks || [];
  if (!AN.tickHooks.includes(hmiUpd)) AN.tickHooks.push(hmiUpd);
  hmiSync();
}
function hmiClose() {
  AN.hmiUi.open = false;
  AN.hmiUi.edit = false;
  AN.hmiSheets = [];
  AN.tickHooks = (AN.tickHooks || []).filter(f => f !== hmiUpd);
  hmiApplyMode();
}
function hmiUpd() {
  if (!AN.hmiUi.open) return;
  for (const g of hmSvg.querySelectorAll('g[data-id]')) if (g._upd) g._upd();
  const pr = hmPr.querySelector('.st');
  if (pr && hmSel) hmiStatus(pr);
}
function hmiSave() {
  persistAll();
}
function hmiHeader() {
  hmHdr.innerHTML = '';
  const H = AN.hmi,
    pg = h$(
      'select',
      {},
      H.pages.map((p, i) => h$('option', { value: i, txt: p.name }))
    );
  pg.value = H.cur;
  pg.onchange = () => {
    H.cur = +pg.value;
    hmSel = null;
    hmiSave();
    hmiRender();
  };
  const b = (t, f, ti) => h$('button', { txt: t, title: ti || '', onclick: f }),
    ed = b(
      AN.hmiUi.edit ? '✎ Editing' : '✎ Edit',
      () => {
        AN.hmiUi.edit = !AN.hmiUi.edit;
        AN.hmiUi.add = null;
        hmSel = null;
        hmiHeader();
        hmiRender();
      },
      'Edit mode: place, move and bind widgets'
    );
  ed.classList.toggle('on', AN.hmiUi.edit);
  hmHdr.append(h$('b', { txt: 'HMI', style: 'color:var(--acc)' }), pg);
  if (AN.hmiUi.edit) {
    const add = h$(
      'select',
      { title: 'Pick a widget, then click on the page to place it' },
      [h$('option', { value: '', txt: '+ Add widget…' })].concat(
        Object.keys(HM_T).map(k => h$('option', { value: k, txt: HM_T[k].t }))
      )
    );
    add.onchange = () => {
      AN.hmiUi.add = add.value || null;
      hmiRender();
      if (add.value) msg('Click on the page to place the ' + HM_T[add.value].t);
    };
    const bg = h$('input', { type: 'file', accept: 'image/*', style: 'display:none' });
    bg.onchange = () => hmiBg(bg.files[0]);
    hmHdr.append(
      b('+ Page', () => {
        const n = prompt('Page name', 'Page ' + (H.pages.length + 1));
        if (n) {
          H.pages.push({ name: n, w: 1000, h: 620, bg: null, widgets: [] });
          H.cur = H.pages.length - 1;
          hmiSave();
          hmiHeader();
          hmiRender();
        }
      }),
      b('Rename', () => {
        const n = prompt('Page name', hmPg().name);
        if (n) {
          hmPg().name = n;
          hmiSave();
          hmiHeader();
        }
      }),
      b('Delete page', () => {
        if (H.pages.length > 1 && confirm('Delete page "' + hmPg().name + '"?')) {
          H.pages.splice(H.cur, 1);
          H.cur = 0;
          hmiSave();
          hmiHeader();
          hmiRender();
        }
      }),
      add,
      b(
        'Auto: this sheet',
        () => hmiAuto(),
        'New page from the sheet you are viewing: a faceplate for every PID / MAN and a button or slider for every signal that comes FROM DITL'
      ),
      b('Background…', () => bg.click(), 'A picture (for example a screenshot of the real HMI) under the widgets'),
      b(
        '✕ bg',
        () => {
          hmPg().bg = null;
          hmiSave();
          hmiRender();
        },
        'Remove the background picture'
      ),
      bg
    );
  }
  hmHdr.append(h$('span', { style: 'flex:1' }), ed);
  for (const [m, t, ti] of [
    ['tab', 'Tab', 'Own view: replaces the diagram area'],
    ['float', 'Float', 'Movable window over the diagram; the diagram keeps running behind it'],
    ['split', 'Split', 'Beside the diagram, draggable divider']
  ]) {
    const x = b(t, () => hmiSetMode(m), ti);
    x.classList.toggle('on', H.mode === m);
    hmHdr.append(x);
  }
  hmHdr.append(b('✕', () => hmiClose(), 'Close the HMI'));
}
function hmiBg(f) {
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1600 / Math.max(im.width, im.height)),
        c = document.createElement('canvas');
      c.width = Math.round(im.width * k);
      c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      const p = hmPg();
      p.bg = c.toDataURL('image/jpeg', 0.8);
      p.w = c.width;
      p.h = c.height;
      hmiSave();
      hmiRender();
      msg('Background set (' + c.width + ' x ' + c.height + '; the page now has this size)');
    };
    im.src = r.result;
  };
  r.readAsDataURL(f);
}
function hmiRender() {
  hmSvg.innerHTML = '';
  const p = hmPg();
  hmSvg.setAttribute('viewBox', '0 0 ' + p.w + ' ' + p.h);
  hmSvg.append(hs$('rect', { x: 0, y: 0, width: p.w, height: p.h, fill: '#0b1013' }));
  if (p.bg)
    hmSvg.append(hs$('image', { href: p.bg, x: 0, y: 0, width: p.w, height: p.h, preserveAspectRatio: 'none' }));
  if (AN.hmiUi.edit) {
    const g = hs$('g', {});
    for (let x = 0; x <= p.w; x += 50)
      g.append(hs$('line', { x1: x, y1: 0, x2: x, y2: p.h, stroke: '#1a242b', 'stroke-width': 1 }));
    for (let y = 0; y <= p.h; y += 50)
      g.append(hs$('line', { x1: 0, y1: y, x2: p.w, y2: y, stroke: '#1a242b', 'stroke-width': 1 }));
    hmSvg.append(g);
  }
  for (const w of p.widgets) {
    const g = hmiBuild(w);
    hmSvg.append(g);
    if (AN.hmiUi.edit) {
      g.style.cursor = 'move';
      if (hmSel === w.id) {
        const o = hs$('rect', {
          x: w.x - 3,
          y: w.y - 3,
          width: w.w + 6,
          height: w.h + 6,
          fill: 'none',
          stroke: '#ffd84d',
          'stroke-dasharray': '4 3',
          style: 'pointer-events:none'
        });
        hmSvg.append(o);
      }
    }
  }
  hmiProps();
  hmiSync();
}
function hmiPt(e) {
  const pt = hmSvg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(hmSvg.getScreenCTM().inverse());
}
const snap = v => (AN.hmiUi.snap ? Math.round(v / 5) * 5 : Math.round(v));
hmSvg.addEventListener('pointerdown', e => {
  if (!AN.hmiUi.edit) return;
  const p = hmPg(),
    q = hmiPt(e),
    gEl = e.target.closest && e.target.closest('g[data-id]');
  if (AN.hmiUi.add && !gEl) {
    const t = AN.hmiUi.add;
    AN.hmiUi.add = null;
    const w = hmiAdd(t, { x: snap(q.x), y: snap(q.y) });
    hmSel = w.id;
    hmiHeader();
    hmiRender();
    return;
  }
  if (gEl) {
    const w = p.widgets.find(x => String(x.id) === gEl.getAttribute('data-id'));
    if (!w) return;
    hmSel = w.id;
    const dx = q.x - w.x,
      dy = q.y - w.y;
    let mv = false;
    hmSvg.setPointerCapture && hmSvg.setPointerCapture(e.pointerId);
    const mm = ev => {
        const r = hmiPt(ev);
        w.x = snap(r.x - dx);
        w.y = snap(r.y - dy);
        mv = true;
        gEl.setAttribute('transform', 'translate(' + w.x + ',' + w.y + ')');
      },
      up = () => {
        hmSvg.removeEventListener('pointermove', mm);
        hmSvg.removeEventListener('pointerup', up);
        hmiSave();
        hmiRender();
      };
    hmSvg.addEventListener('pointermove', mm);
    hmSvg.addEventListener('pointerup', up);
    hmiRender();
    return;
  }
  hmSel = null;
  hmiRender();
});
hmSvg.addEventListener('mousemove', e => {
  const g = e.target.closest && e.target.closest('g[data-id]');
  hmSvg.querySelector('title') && hmSvg.querySelector('title').remove();
  if (g && g._tip) {
    const t = hs$('title');
    t.textContent = g._tip();
    g.append(t);
  }
});
function hmiAdd(type, o) {
  const H = AN.hmi,
    p = hmPg(),
    d = HM_T[type],
    w = Object.assign(
      {
        id: H.nid++,
        type,
        x: 20,
        y: 20,
        w: d.w,
        h: d.h,
        label: '',
        addr: '',
        addr2: '',
        addr3: '',
        sheet: '',
        min: '',
        max: '',
        unit: '',
        col: '#35e08a',
        mom: false
      },
      o || {}
    );
  p.widgets.push(w);
  hmiSave();
  return w;
}
function hmiStatus(el) {
  const p = hmPg(),
    w = p.widgets.find(x => x.id === hmSel);
  if (!w) {
    el.textContent = '';
    return;
  }
  const c = w.type === 'face' ? (hmiBlk(w) ? [hmiBlk(w)] : []) : hmiFind(w.addr);
  const pk = w.type === 'face' ? hmiBlk(w) : hmiPick(w);
  el.textContent = !w.addr
    ? '(no address)'
    : !c.length
      ? '✖ not found on any sheet'
      : '✔ ' +
        (pk
          ? pk.sh.name +
            (pk.b
              ? ' · ' + pk.b.k + ' ' + w.addr
              : ' · ' + nm(pk.sh.S, pk.n) + (pk.ext ? ' · INPUT' : pk.drv ? ' · computed (button = FORCE)' : ''))
          : '') +
        (c.length > 1 ? '   (' + c.length + ' places)' : '') +
        (w.type !== 'face' && pk ? '   value = ' + (hmiVal(w) == null ? '--' : fmt(hmiVal(w))) : '');
  el.style.color = !w.addr || !c.length ? '#ff8a8a' : '#8fe3b0';
}
function hmiProps() {
  hmPr.innerHTML = '';
  if (!AN.hmiUi.edit) {
    hmPr.style.display = 'none';
    return;
  }
  hmPr.style.display = 'flex';
  const p = hmPg(),
    w = p.widgets.find(x => x.id === hmSel);
  if (!w) {
    hmPr.append(
      h$('span', {
        txt: 'Edit mode: pick "+ Add widget…" and click on the page; click a widget to select it, drag to move. Address = a tag or address (M.0097, SI0150, AI0130, FICFA1043B.MV) or "DITL 13-69"; faceplate = the tag of a PID / MAN (FICFA1043B, HIC-BFAR).'
      })
    );
    return;
  }
  const f = (k, t, wd, type) => {
    const i = h$('input', {
      type: type || 'text',
      value: w[k] == null ? '' : w[k],
      style: 'width:' + (wd || 90) + 'px'
    });
    i.onchange = () => {
      w[k] = type === 'number' ? (i.value === '' ? '' : +i.value) : i.value;
      if (k === 'addr' || k === 'addr2' || k === 'addr3') w.sheet = '';
      hmiSave();
      hmiRender();
    };
    return h$('label', {}, [document.createTextNode(t + ' '), i]);
  };
  hmPr.append(
    h$('b', { txt: HM_T[w.type].t }),
    f('label', 'Label', 110),
    f('addr', w.type === 'face' ? 'Tag' : 'Address', 150)
  );
  if (w.type === 'trend') hmPr.append(f('addr2', 'Addr 2', 110), f('addr3', 'Addr 3', 110));
  if (['bar', 'tank', 'slider', 'trend'].includes(w.type))
    hmPr.append(f('min', 'Min', 50, 'number'), f('max', 'Max', 50, 'number'));
  if (w.type === 'num') hmPr.append(f('unit', 'Unit', 50));
  const cc = h$('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(w.col) ? w.col : '#35e08a' });
  cc.onchange = () => {
    w.col = cc.value;
    hmiSave();
    hmiRender();
  };
  hmPr.append(h$('label', {}, [document.createTextNode('Colour '), cc]));
  if (w.type === 'button') {
    const m = h$('input', { type: 'checkbox' });
    m.checked = !!w.mom;
    m.onchange = () => {
      w.mom = m.checked;
      hmiSave();
    };
    hmPr.append(
      h$('label', { title: 'Momentary: 1 while pressed, 0 when released' }, [m, document.createTextNode('momentary')])
    );
  }
  hmPr.append(
    f('x', 'x', 48, 'number'),
    f('y', 'y', 48, 'number'),
    f('w', 'w', 48, 'number'),
    f('h', 'h', 48, 'number')
  );
  const c = w.type === 'face' ? (hmiBlk(w) ? [1] : []) : hmiFind(w.addr);
  if (c.length > 1 && w.type !== 'face') {
    const s = h$(
      'select',
      { title: 'The address exists on several sheets: choose' },
      [h$('option', { value: '', txt: 'auto' })].concat(
        [...new Set(hmiFind(w.addr).map(q => q.sh.name))].map(n => h$('option', { value: n, txt: n }))
      )
    );
    s.value = w.sheet || '';
    s.onchange = () => {
      w.sheet = s.value;
      hmiSave();
      hmiRender();
    };
    hmPr.append(h$('label', {}, [document.createTextNode('Sheet '), s]));
  }
  hmPr.append(
    h$('button', {
      txt: 'Duplicate',
      onclick: () => {
        const n = hmiAdd(w.type, Object.assign({}, w, { id: undefined, x: w.x + 20, y: w.y + 20 }));
        n.id = AN.hmi.nid - 1;
        hmSel = n.id;
        hmiRender();
      }
    }),
    h$('button', {
      txt: 'Delete',
      onclick: () => {
        p.widgets.splice(p.widgets.indexOf(w), 1);
        hmSel = null;
        hmiSave();
        hmiRender();
      }
    })
  );
  hmPr.append(h$('span', { cls: 'st', style: 'flex-basis:100%;font-size:11px' }));
  hmiStatus(hmPr.querySelector('.st'));
}
addEventListener('keydown', e => {
  if (!AN.hmiUi.open || !AN.hmiUi.edit || hmSel == null || e.key !== 'Delete') return;
  if (/INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName)) return;
  const p = hmPg(),
    i = p.widgets.findIndex(x => x.id === hmSel);
  if (i >= 0) {
    p.widgets.splice(i, 1);
    hmSel = null;
    hmiSave();
    hmiRender();
  }
});
/* new page from the sheet being viewed: faceplates of every PID / MAN, button or slider of every FROM DITL input */
function hmiAuto() {
  const sh = cs();
  if (!sh || !sh.S) {
    msg('Open an analog sheet first');
    return;
  }
  const S = sh.S,
    H = AN.hmi,
    pg = { name: sh.name, w: 1000, h: 620, bg: null, widgets: [] };
  H.pages.push(pg);
  H.cur = H.pages.length - 1;
  let k = 0;
  const put = (t, o) => {
    const d = HM_T[t],
      w = Object.assign(
        {
          id: H.nid++,
          type: t,
          x: 20,
          y: 20,
          w: d.w,
          h: d.h,
          label: '',
          addr: '',
          addr2: '',
          addr3: '',
          sheet: sh.name,
          min: '',
          max: '',
          unit: '',
          col: '#35e08a',
          mom: false
        },
        o
      );
    pg.widgets.push(w);
    return w;
  };
  const faces = S.blk
    .filter(b => ['PID', 'PIDV', 'MAN'].includes(b.k))
    .map(b => ({
      b,
      t: (b.txt || []).find(
        x => /^[A-Z][A-Z0-9\-.]{2,}$/.test(x) && !/^(PID|PIDV|MAN)$/i.test(x) && !/^S\d-MDL/i.test(x)
      )
    }))
    .filter(x => x.t)
    .slice(0, 12);
  faces.forEach((x, i) =>
    put('face', { x: 20 + (i % 4) * 240, y: 20 + Math.floor(i / 4) * 196, addr: x.t, label: x.t })
  );
  const y0 = 20 + Math.ceil(faces.length / 4) * 196 + 10;
  let j = 0;
  try {
    const ix = dsIdx(sh);
    for (const [n, refs] of ix.from) {
      if (!S.ext.includes(n) || (S.xlk && S.xlk[n])) continue;
      if (j >= 24) break;
      const nmx = nm(S, n);
      const o = {
        x: 20 + (j % 6) * 160,
        y: y0 + Math.floor(j / 6) * 54,
        addr: refs[0],
        label: nmx.length > 20 ? nmx.slice(0, 19) + '…' : nmx
      };
      if (S.nets[n].dig) put('button', Object.assign(o, { w: 150 }));
      else put('slider', Object.assign(o, { w: 150, h: 50 }));
      j++;
    }
  } catch (e) {}
  pg.h = Math.max(620, y0 + Math.ceil(j / 6) * 54 + 30);
  AN.hmiUi.edit = true;
  hmSel = null;
  persistAll();
  hmiHeader();
  hmiRender();
  msg(
    'HMI page "' +
      sh.name +
      '": ' +
      faces.length +
      ' faceplate(s), ' +
      j +
      ' DITL input(s). Edit to move or change them.'
  );
}
/* splitter + floating window drag */
hmSp.onpointerdown = e => {
  e.preventDefault();
  hmSp.setPointerCapture(e.pointerId);
  const mid = document.getElementById('mid');
  const mv = ev => {
      const r = mid.getBoundingClientRect();
      const f = 1 - (ev.clientX - r.left) / r.width - anp.offsetWidth / r.width;
      AN.hmi.split = Math.max(0.15, Math.min(0.8, f));
      hmEl.style.flex = '0 0 ' + Math.round(AN.hmi.split * 100) + '%';
    },
    up = () => {
      hmSp.removeEventListener('pointermove', mv);
      hmSp.removeEventListener('pointerup', up);
      persistAll();
      dispatchEvent(new Event('resize'));
    };
  hmSp.addEventListener('pointermove', mv);
  hmSp.addEventListener('pointerup', up);
};
hmHdr.addEventListener('pointerdown', e => {
  if (AN.hmi.mode !== 'float' || (e.target !== hmHdr && e.target.tagName !== 'B')) return;
  const f = AN.hmi.float,
    sx = e.clientX - f.x,
    sy = e.clientY - f.y;
  const mv = ev => {
      f.x = Math.max(0, ev.clientX - sx);
      f.y = Math.max(0, ev.clientY - sy);
      hmEl.style.left = f.x + 'px';
      hmEl.style.top = f.y + 'px';
    },
    up = () => {
      removeEventListener('pointermove', mv);
      removeEventListener('pointerup', up);
      persistAll();
    };
  addEventListener('pointermove', mv);
  addEventListener('pointerup', up);
});
if (window.ResizeObserver)
  new ResizeObserver(() => {
    if (AN.hmi.mode === 'float' && AN.hmiUi.open && hmEl.offsetWidth > 0) {
      const f = AN.hmi.float;
      if (Math.abs(f.w - hmEl.offsetWidth) > 2 || Math.abs(f.h - hmEl.offsetHeight) > 2) {
        f.w = hmEl.offsetWidth;
        f.h = hmEl.offsetHeight;
        persistAll();
      }
    }
  }).observe(hmEl);
bHm.onclick = () => {
  if (AN.hmiUi.open) hmiClose();
  else hmiOpen();
};
/* ===================== control ownership, FORCE / SIM ===================== */
document.head.appendChild(
  h$('style', {
    txt: 'body.hmiown #anp .wr,body.hmiown #anp .wr *{pointer-events:none;opacity:.4}#anp .own{background:#2a1f0a;border-left:3px solid #ffb04d;padding:4px 6px;margin:4px 0;color:#ffd9a0;font-size:11px}'
  })
);
const hmiForced = (S, n) => S.rt.force[n] !== undefined && !(S.rt.pf && S.rt.pf[n]);
const hmiSrcBlk = (S, n) =>
  S.blk.find(b => ((b.k === 'AI' && !b.fb) || b.k === 'SIGAB') && b.pins.some(p => p.role === 'out' && p.n === n)) ||
  null;
const hmiPlantOwned = (S, n) => {
  for (const b of S.procs || []) {
    const p = b.proc;
    if (
      p &&
      p.on &&
      p.mode !== 'shared' &&
      (p.pinExt === n || (p.mode === 'pin' && p.pv === n) || (p.aiOut || []).includes(n))
    )
      return b;
  }
  if (S.plantT) {
    if (S.plantT.ext.has(n)) return { k: 'PID', txt: ['', S.plantT.ext.get(n)] };
    const src = hmiSrcBlk(S, n);
    if (src && S.plantT.ai.has(src.id)) return { k: 'PID', txt: ['', S.plantT.ai.get(src.id)] };
  }
  return null;
};
/* what can the user do with the point of a widget */
function hmiState(w, a) {
  const p = hmiPick(w, a);
  if (!p) return null;
  const S = p.sh.S,
    n = p.n,
    forced = hmiForced(S, n),
    own = hmiPlantOwned(S, n),
    src = hmiSrcBlk(S, n),
    field = S.ext.includes(n) || !!src;
  const how = forced ? 'forced' : own ? 'plant' : p.ext || src ? 'input' : 'computed';
  return { p, S, n, forced, own, src, field, how };
}
hmiWrite = function (w, v, rel) {
  const st = hmiState(w);
  if (!st) {
    msg('HMI: the address "' + (w.addr || 'wire ' + w.nn) + '" was not found on any sheet');
    return;
  }
  const sh = st.p.sh;
  hmiSync();
  if (rel === true) {
    if (st.forced) setForce(sh, st.n, undefined);
    return;
  }
  if (st.how === 'forced') {
    setForce(sh, st.n, v);
    return;
  }
  if (st.how === 'plant') {
    msg('HMI: this value is driven by the plant model. Set the SV, or press F (SIM / FORCE) to hold a value');
    return;
  }
  if (st.how === 'computed') {
    msg('HMI: this value is computed by the logic. Press F (FORCE) to hold a value');
    return;
  }
  if (st.p.ext) {
    setExt(sh, st.n, v);
    return;
  }
  if (st.src) {
    const s = sh.S.rt.st[st.src.id],
      r = st.src.rng,
      x = st.src.k === 'SIGAB' ? (v > 0.5 ? 1 : 0) : r ? Math.max(r.lo, Math.min(r.hi, v)) : v;
    s.val = x;
    if (st.src.k === 'AI') s.act = x;
    (sv(sh).ai = sv(sh).ai || {})[st.src.id] = x;
    anSave();
    settle();
  }
};
function hmiToggleForce(w) {
  const st = hmiState(w);
  if (!st) return;
  const sh = st.p.sh;
  if (st.forced) {
    setForce(sh, st.n, undefined);
    return;
  }
  let v = st.S.rt.v[st.n];
  if (v == null || !isFinite(v)) v = 0;
  if (st.S.nets[st.n].dig) v = v > 0.5 ? 1 : 0;
  setForce(sh, st.n, v);
}
function hmiFBox(g, w, W, H, upd) {
  if (!['button', 'slider', 'num', 'lamp', 'bar', 'tank', 'valve', 'motor', 'pipe'].includes(w.type)) return;
  if (!w.addr && w.nn == null) return;
  const r = hs$('rect', {
      x: W - 27,
      y: -3,
      width: 27,
      height: 13,
      rx: 3,
      fill: '#1b262d',
      stroke: '#667',
      style: 'cursor:pointer'
    }),
    t = ht$('F', {
      x: W - 13.5,
      y: 7,
      'text-anchor': 'middle',
      'font-size': 9,
      fill: '#9ab',
      style: 'pointer-events:none'
    }),
    ti = hs$('title');
  r.append(ti);
  g.append(r, t);
  r.onpointerdown = e => {
    if (AN.hmiUi.edit) return;
    e.stopPropagation();
    hmiToggleForce(w);
  };
  upd.push(() => {
    const st = hmiState(w);
    if (!st) {
      r.setAttribute('stroke', '#ff4d4d');
      t.textContent = '?';
      return;
    }
    const ro = st.how === 'plant' || st.how === 'computed';
    g.querySelectorAll('[data-ctl]').forEach(e => {
      e.style.opacity = ro ? '.35' : '';
      e.style.pointerEvents = ro ? 'none' : '';
    });
    if (st.forced) {
      r.setAttribute('fill', '#ff9d2e');
      r.setAttribute('stroke', '#ff9d2e');
      t.setAttribute('fill', '#1b1000');
      t.textContent = st.field ? 'SIM' : 'FRC';
      ti.textContent =
        (st.field ? 'SIMULATED' : 'FORCED') +
        ' at ' +
        fmt(st.S.rt.force[st.n]) +
        ': the plant and the logic do not change it. Click to release';
    } else {
      r.setAttribute('fill', '#1b262d');
      r.setAttribute('stroke', st.how === 'plant' ? '#4da3ff' : '#667');
      t.setAttribute('fill', st.how === 'plant' ? '#4da3ff' : '#9ab');
      t.textContent = st.how === 'plant' ? 'P' : 'F';
      ti.textContent =
        st.how === 'plant'
          ? 'Driven by the plant model (read only). Click F to simulate (hold) a value'
          : st.how === 'computed'
            ? 'Computed by the logic (read only). Click F to force (hold) a value'
            : 'Operator input. Click F to hold it as a forced / simulated point';
    }
  });
}
const _am = hmiApplyMode;
hmiApplyMode = function () {
  _am();
  document.body.classList.toggle('hmiown', !!(AN.hmiUi.open || (AN.plantUi && AN.plantUi.open)));
  try {
    const sh = cs();
    if (sh && sh.S && AN.cat === 'an') {
      buildPanel();
      panelUpd(true);
    }
  } catch (e) {}
};
