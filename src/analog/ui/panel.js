/* ---------- the floating zoom window with the control strip ---------- */
function trStrip(box, sh, m) {
  const S = sh.S,
    b = m.blk,
    keep = PU;
  PU = [];
  const mine = PU;
  const row = n => {
    const nmx = nm(S, n),
      ds = trDescOf(S, sh, n);
    return h$('div', { style: 'margin:5px 0;padding:3px 0;border-bottom:1px solid #1d2a31' }, [
      h$('div', { style: 'font-weight:bold', txt: nmx }),
      ds ? h$('div', { style: 'font-size:10px;color:#8a9', txt: ds }) : document.createTextNode(''),
      ctl(S, sh, n)
    ]);
  };
  const seen = new Set(),
    ups = [],
    walk = (n, dp) => {
      if (dp > 8 || seen.has(n)) return;
      seen.add(n);
      if (S.ext.includes(n) && !(S.xlk && S.xlk[n])) {
        ups.push(n);
        return;
      }
      for (const dr of S.drv[n] || []) {
        const x = S.blk.find(q => q.id === dr.id);
        if (!x || x.k === 'AI') continue;
        if (x.k === 'PID' || x.k === 'PIDV' || x.k === 'MAN') continue;
        for (const q of x.i || []) walk(q, dp + 1);
      }
    };
  const starts = b
    ? b.k === 'PID' || b.k === 'PIDV'
      ? (() => {
          const pn = anPins(S, b);
          return pn && pn.sv >= 0 ? [pn.sv] : [];
        })()
      : b.i || []
    : AN.sel.net != null
      ? [AN.sel.net]
      : [];
  box.append(h$('h4', { txt: 'Control strip — what you can change' }));
  if (b && b.k === 'MAN') {
    const st = S.rt.st[b.id],
      P = b.p,
      i = anEdit(h$('input', { type: 'number', step: 'any' })),
      rg = h$('input', { type: 'range', min: P.lo, max: P.hi, step: (P.hi - P.lo) / 500 }),
      set = v => {
        st.val = Math.max(P.lo, Math.min(P.hi, v));
        (sv(sh).man = sv(sh).man || {})[b.id] = st.val;
        anSave();
        settle();
      };
    i.classList.add('wr');
    rg.classList.add('wr');
    i.style.width = '80px';
    rg.style.width = '100%';
    rg.oninput = () => set(+rg.value);
    i.onchange = () => {
      const v = parseFloat(i.value);
      if (isFinite(v)) set(v);
    };
    const u = () => {
      if (+rg.min !== P.lo || +rg.max !== P.hi) {
        rg.min = P.lo;
        rg.max = P.hi;
        rg.step = (P.hi - P.lo) / 500;
      }
      if (document.activeElement !== rg) rg.value = st.val;
      if (document.activeElement !== i) i.value = (+st.val).toFixed(2);
    };
    u();
    mine.push(u);
    box.append(
      h$('div', { style: 'margin:5px 0' }, [
        h$('div', { style: 'font-weight:bold', txt: 'MAN value ▸ ' + (b.tag || (b.txt || [])[0] || '') }),
        h$('div', {
          style: 'font-size:10px;color:#8a9',
          txt: (m.desc || '') + ' · range ' + fmt(P.lo) + ' ~ ' + fmt(P.hi) + ' ' + (P.u || '')
        }),
        h$('div', { cls: 'r' }, [i, h$('span', { txt: P.u || '' })]),
        rg
      ])
    );
  }
  starts.forEach(n => walk(n, 0));
  if (ups.length) {
    box.append(
      h$('div', {
        style: 'color:#9ab;font-size:11px',
        txt: 'Inputs that feed this block (manual values / set points):'
      })
    );
    ups.slice(0, 10).forEach(n => box.append(row(n)));
  }
  if (b && (b.k === 'PID' || b.k === 'PIDV')) {
    const pf = (k, t, tt) => {
      const i = anEdit(h$('input', { type: 'number', step: 'any', value: b.p[k] }));
      i.style.width = '70px';
      i.onchange = () => {
        const v = parseFloat(i.value);
        if (isFinite(v)) {
          b.p[k] = v;
          (sv(sh).p = sv(sh).p || {})[b.id] = Object.assign({}, (sv(sh).p || {})[b.id], { [k]: v });
          anSave();
          settle();
        }
      };
      return h$('div', { cls: 'r', title: tt }, [h$('span', { cls: 'n', txt: t }), i]);
    };
    box.append(
      h$('div', { style: 'margin-top:8px;font-weight:bold', txt: 'Controller parameters ▸ ' + (b.txt[1] || b.k) }),
      pf('kp', 'Kp (= 100 / P band)', 'gain'),
      pf('ti', 'Ti (s, 0 = off)', 'integral time'),
      pf('td', 'Td (s)', 'derivative time'),
      pf('lo', 'Output low %', ''),
      pf('hi', 'Output high %', '')
    );
    try {
      procPanel(box, b, sh);
    } catch (e) {}
  }
  PU = keep;
  return mine;
}
function trZoom(sh, o0) {
  const old = document.getElementById('trbig');
  if (old) old.remove();
  const m0 = trModel(sh);
  if (!m0) return;
  const S = sh.S,
    o = Object.assign({}, o0, { big: true, hide: new Set(o0.hide), hx: null, hk: null, desc: true }),
    sheetAtOpen = sh;
  const ov = h$('div', {
      id: 'trbig',
      style:
        'position:fixed;left:6vw;top:6vh;width:86vw;height:84vh;background:#0b1013;border:1px solid var(--acc,#3a6);z-index:99999;display:flex;flex-direction:column;box-shadow:0 8px 40px #000d;resize:both;overflow:hidden;min-width:520px;min-height:300px'
    }),
    hd = h$('div', {
      style:
        'display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 8px;background:#10181d;border-bottom:1px solid #223;cursor:move'
    }),
    body = h$('div', { style: 'flex:1;display:flex;min-height:0' }),
    left = h$('div', { style: 'flex:1;display:flex;flex-direction:column;min-width:0;padding:6px' }),
    right = h$('div', {
      style: 'width:340px;overflow:auto;padding:6px 8px;border-left:1px solid #223;background:#0f1519;font-size:12px'
    }),
    cv = h$('canvas', { width: 1200, height: 620, style: 'width:100%;flex:1;min-height:0;background:#0b1013' }),
    leg = h$('div', { style: 'font-size:12px;margin-top:6px;max-height:34%;overflow:auto' }),
    xyc = m0.xy
      ? h$('canvas', {
          width: 520,
          height: 240,
          style: 'width:260px;height:120px;background:#0b1013;margin-top:4px;align-self:flex-end'
        })
      : null;
  const ws = h$(
    'select',
    {},
    [
      ['30 s', 30],
      ['1 min', 60],
      ['5 min', 300],
      ['10 min', 600],
      ['All', 0]
    ].map(([t, v]) => h$('option', { value: v, txt: t }))
  );
  ws.value = String(o.win);
  ws.onchange = () => {
    o.win = +ws.value;
    o.off = null;
  };
  const op = h$('input', {
    type: 'range',
    min: 35,
    max: 100,
    value: 100,
    style: 'width:70px',
    title: 'Transparency of this window'
  });
  op.oninput = () => {
    ov.style.opacity = op.value / 100;
  };
  const fol = h$('button', {
      txt: 'Follow live',
      onclick: () => {
        o.off = null;
      }
    }),
    cl = h$('button', {
      txt: '✕ Close',
      onclick: () => {
        ov.remove();
        clearInterval(tm);
      }
    });
  hd.append(
    h$('b', { txt: sh.name + ' · ' + m0.title, style: 'color:var(--acc)' }),
    h$('span', { txt: m0.desc || '', style: 'color:#9ab;font-size:11px;flex:1 1 200px' }),
    ws,
    fol,
    h$('span', { txt: 'opaque', style: 'color:#8a9;font-size:10px' }),
    op,
    cl,
    h$('small', {
      txt: 'wheel = time zoom · drag = move in time · hover = values · click a name = hide / show · drag this bar = move the window · corner = resize',
      style: 'flex-basis:100%;color:#8a9'
    })
  );
  left.append(cv, ...(xyc ? [xyc] : []), leg);
  body.append(left, right);
  ov.append(hd, body);
  document.body.append(ov);
  let mine = trStrip(right, sh, m0);
  let lastSel = JSON.stringify(AN.sel && { b: AN.sel.blk && AN.sel.blk.id, n: AN.sel && AN.sel.net });
  const draw = () => {
    const sh2 = cs();
    if (sh2 !== sheetAtOpen) {
    }
    trSample(sh);
    const mc = trModel(sh),
      m = mc && mc.blk === m0.blk && mc.title === m0.title ? mc : m0;
    trDraw(cv, sh, m, o);
    if (xyc && m.xy) trXY(xyc, m, S);
    trLegend(leg, S, m, o, sh);
    for (const f of mine) {
      try {
        f();
      } catch (e) {}
    }
  };
  AN.tickHooks = AN.tickHooks || [];
  const hk = () => {
    if (!ov.isConnected) {
      AN.tickHooks = AN.tickHooks.filter(x => x !== hk);
      return;
    }
    draw();
  };
  AN.tickHooks.push(hk);
  const tm = 0;
  draw();
  cv.onwheel = e => {
    e.preventDefault();
    const h = (sh._th && sh._th.t) || [];
    if (h.length < 2) return;
    const full = h[h.length - 1] - h[0],
      cur = o.win > 0 ? o.win : full,
      nw = Math.max(5, Math.min(Math.max(full, 5), cur * (e.deltaY > 0 ? 1.25 : 0.8))),
      end = o.off != null ? o.off + cur : h[h.length - 1];
    o.win = nw;
    o.off = Math.max(h[0], end - nw);
    if (o.off + nw >= h[h.length - 1] - 1e-6) o.off = null;
    ws.value = '';
  };
  let dr = null;
  cv.onmousedown = e => {
    dr = { x: e.clientX, off: o.off };
  };
  addEventListener('mouseup', () => {
    dr = null;
  });
  cv.onmouseleave = () => {
    o.hx = null;
    o.hk = null;
  };
  cv.onmousemove = e => {
    const r = cv.getBoundingClientRect();
    o.hx = ((e.clientX - r.left) / r.width) * cv.width;
    if (!dr) return;
    const h = (sh._th && sh._th.t) || [];
    if (h.length < 2) return;
    const cur = o.win > 0 ? o.win : h[h.length - 1] - h[0],
      dt = (-(e.clientX - dr.x) / cv.clientWidth) * cur,
      base = dr.off != null ? dr.off : h[h.length - 1] - cur;
    o.off = Math.max(h[0], Math.min(h[h.length - 1] - cur, base + dt));
    if (o.win <= 0) o.off = null;
  };
  hd.addEventListener('pointerdown', e => {
    if (e.target !== hd && e.target.tagName !== 'B') return;
    const r = ov.getBoundingClientRect(),
      sx = e.clientX - r.left,
      sy = e.clientY - r.top;
    const mv = ev => {
        ov.style.left = Math.max(0, ev.clientX - sx) + 'px';
        ov.style.top = Math.max(0, ev.clientY - sy) + 'px';
      },
      up = () => {
        removeEventListener('pointermove', mv);
        removeEventListener('pointerup', up);
      };
    addEventListener('pointermove', mv);
    addEventListener('pointerup', up);
  });
  addEventListener(
    'keydown',
    function k(e) {
      if (!ov.isConnected) {
        removeEventListener('keydown', k, true);
        return;
      }
      if (e.key === 'Escape') {
        e.stopPropagation();
        ov.remove();
        clearInterval(tm);
        removeEventListener('keydown', k, true);
      }
    },
    true
  );
}
function procSave(sh, b) {
  const o = sv(sh);
  o.proc = o.proc || {};
  const p = b.proc;
  o.proc[b.id] = Object.assign(
    { ver: 2, on: p.on, dist: p.dist, est: p.est ? 1 : 0 },
    p.est ? {} : { K: p.K, T: p.T, L: p.L }
  );
  anSave();
}
function procPanel(d, b, sh) {
  return;
  const p = b.proc;
  if (p && p.mode === 'shared') {
    d.append(
      h$('h4', { txt: 'Process model' }),
      h$('small', {
        txt:
          'This controller measures the SAME process variable as ' +
          p.of +
          '. The plant model of that variable is on ' +
          p.of +
          ' (one variable, one model).'
      })
    );
    return;
  }
  if (!p) {
    d.append(
      h$('small', {
        txt: 'Process model: not available here (the PV of this controller is not a field signal, or it has no SV / PV difference block).'
      })
    );
    return;
  }
  const S = sh.S,
    pvn = nm(S, p.pv);
  d.append(h$('h4', { txt: 'Process model (closed loop, simulation only)' }));
  const on = h$('input', { type: 'checkbox' });
  on.checked = !!p.on;
  on.onchange = () => {
    p.on = on.checked;
    if (!p.on) {
      delete S.rt.pm[b.id];
    }
    procSave(sh, b);
    S.procs = S.procs;
    settle();
    buildPanel();
    panelUpd(true);
  };
  d.append(
    h$('div', { cls: 'r' }, [
      h$('label', { title: 'The PV follows the valve through a simple process. Only SV is set by you.' }, [
        on,
        document.createTextNode(' PV is simulated: follows the controller output')
      ])
    ])
  );
  const f = (k, t, tt) => {
    const i = anEdit(h$('input', { type: 'number', step: 'any', value: p[k] }));
    i.style.width = '64px';
    i.onchange = () => {
      const v = parseFloat(i.value);
      if (isFinite(v)) {
        p[k] = v;
        p.est = 0;
        if (S.rt.pm) delete S.rt.pm[b.id];
        procSave(sh, b);
        settle();
      }
    };
    return h$('div', { cls: 'r', title: tt }, [h$('span', { cls: 'n', txt: t }), i]);
  };
  d.append(
    f('K', 'Process gain K (% of span per 100 % output)', '1 = the whole output swing moves the whole span'),
    f('T', 'Time constant T (s)', 'how slowly the PV answers'),
    f('L', 'Dead time (s)', 'delay between the valve and the PV')
  );
  const ds = h$('input', { type: 'range', min: -30, max: 30, step: 0.5, value: p.dist || 0 }),
    dv = h$('span', { cls: 'v', txt: (p.dist || 0) + ' %' });
  ds.oninput = () => {
    p.dist = +ds.value;
    dv.textContent = p.dist + ' %';
    procSave(sh, b);
  };
  d.append(
    h$('div', { cls: 'r', title: 'A load disturbance pushes the PV: the controller must bring it back' }, [
      h$('span', { cls: 'n', txt: 'Load disturbance (% of span)' }),
      dv
    ]),
    ds
  );
  d.append(
    h$('small', {
      txt:
        'PV = ' +
        pvn +
        ' · process input = the controller output' +
        ' · ' +
        (b.p.act < 0 ? 'reverse' : 'direct') +
        ' action. The plant writes the ' +
        (p.mode === 'transmitter' ? 'transmitter (AI) value' : 'input wire') +
        ' of this PV, the blocks of the sheet between it and the PID keep running; that value is read only while the model is ON (FORCE it to hold a value, the plant keeps running underneath). ' +
        (p.est
          ? 'Gain, time constant and dead time are ESTIMATED from the tuning of this controller (Ti ~ T, Kp x K ~ 0.6, dead time from Td): not measured on the plant.'
          : 'Gain, time constant and dead time were edited by you.') +
        ' Loop type ' +
        (b.p.lt || 'general') +
        '.'
    })
  );
}
function procLock(S, n) {
  for (const b of S.procs || []) {
    const p = b.proc;
    if (p && p.on && (p.pinExt === n || (p.mode === 'pin' && p.pv === n))) return b;
  }
  if (S.plantT && S.plantT.ext.has(n)) return { k: 'PID', txt: ['', S.plantT.ext.get(n)] };
  return null;
}
function procAI(S, id) {
  for (const b of S.procs || []) {
    const p = b.proc;
    if (p && p.on && p.ai && p.ai.includes(id)) return b;
  }
  if (S.plantT && S.plantT.ai.has(id)) return { k: 'PID', txt: ['', S.plantT.ai.get(id)] };
  return null;
}
/* the PV of a controller can come through a circle from another sheet (8 loops): the plant must write where the signal STARTS (the transmitter / input wire of the source sheet), so that every sheet that reads that signal sees the same value */
function whyTxt(S, b) {
  const v = S.rt.v,
    st = S.rt.st[b.id] || {},
    P = b.p || {},
    on = x => x > 0.5,
    val = n => (S.nets[n].dig ? (on(v[n]) ? '1' : '0') : fmt(v[n])),
    ins = b.pins.filter(p => p.role === 'in'),
    lst = a => a.map(p => (p.lab ? p.lab + ' ' : '') + nm(S, p.n) + '=' + val(p.n)).join(', '),
    o = b.o.length ? val(b.o[0]) : '';
  switch (b.k) {
    case 'AND': {
      const z = ins.filter(p => !on(v[p.n]));
      return o === '1'
        ? 'AND = 1: ALL inputs are 1.'
        : 'AND = 0: ' + (z.length ? lst(z) + ' is 0 (one 0 is enough).' : 'an input is 0.');
    }
    case 'OR': {
      const z = ins.filter(p => on(v[p.n]));
      return o === '1' ? 'OR = 1: ' + lst(z) + ' is 1 (one 1 is enough).' : 'OR = 0: ALL inputs are 0.';
    }
    case 'NOT':
      return 'NOT = ' + o + ': the input is ' + (ins[0] ? val(ins[0].n) : '?') + ', the output is the opposite.';
    case 'FF':
      return (
        'Flip-flop Q = ' +
        o +
        ': S=' +
        val(b.S) +
        ', R=' +
        val(b.Rn) +
        '. Reset (R=1) wins over Set; with both 0 it keeps its last value.'
      );
    case 'TON':
      return (
        'TON (on-delay ' +
        P.sec +
        ' s): output becomes 1 only after the input has been 1 for ' +
        P.sec +
        ' s. Timer now ' +
        (st.acc || 0).toFixed(1) +
        ' s, output ' +
        o +
        '.'
      );
    case 'TOF':
      return (
        'TOF (off-delay ' +
        P.sec +
        ' s): output stays 1 for ' +
        P.sec +
        ' s after the input drops. Timer now ' +
        (st.acc || 0).toFixed(1) +
        ' s, output ' +
        o +
        '.'
      );
    case 'TPS':
    case 'TPV':
      return (
        'Pulse: a rising edge on the input starts a pulse of ' +
        (b.k === 'TPS' ? P.sec + ' s' : 'the set time') +
        '. Running: ' +
        (st.run ? 'yes' : 'no') +
        ', output ' +
        o +
        '.'
      );
    case 'SW':
    case 'AMT':
      return (
        'Selector: leg ' + (st.pk === 'B' ? 'B' : 'A') + ' is in use (the other leg is ignored). Output ' + o + '.'
      );
    default:
      return (
        'Inputs now: ' +
        (lst(ins) || '-') +
        '  →  output ' +
        o +
        '. (A detailed explanation for ' +
        b.k +
        ' is not written yet.)'
      );
  }
}
function whyRow(d, S, b) {
  const e = h$('div', { cls: 'why' });
  const f = () => {
    try {
      e.textContent = 'Why? ' + whyTxt(S, b);
    } catch (x) {
      e.textContent = '';
    }
  };
  f._s = 1;
  PU.push(f);
  f();
  d.append(e);
}
/* ---------- panel ---------- */
let PU = [];
const num = (v, f, st) => {
  const i = anEdit(h$('input', { type: 'number', step: st || 'any' }));
  i.value = v;
  i.onchange = () => {
    i._clr();
    const x = parseFloat(i.value);
    if (isFinite(x)) f(x);
    else i.value = v;
  };
  return i;
};
function pauseHint(sh) {
  if (AN.run || !sh || !sh.S || Date.now() - (pauseHint.t || 0) < 15000) return;
  if (sh.S.blk.some(b => ['VLV', 'ACT', 'TON', 'TOF', 'TPS', 'TPV', 'RATE', 'RAMPB', 'LAG'].includes(b.k))) {
    pauseHint.t = Date.now();
    msg('Paused: the value is applied, but valves, timers and ramps only move after you press ▶ Run or Next ▶.');
  }
}
function settle() {
  const sh = cs();
  for (let i = 0; i < 6; i++) stepSet(sh, 0);
  paint();
  panelUpd();
  pauseHint(sh);
}
function nearTx(S, n) {
  const c = S.nets[n]._nt;
  if (c !== undefined) return c;
  let best = null,
    bd = 11;
  for (const i of S.nets[n].segs) {
    const s = S.seg[i];
    for (const [x, y] of [
      [s.x1, s.y1],
      [s.x2, s.y2]
    ])
      for (const t of S.tx) {
        const q = t.t.trim();
        if ((q.length < 3 && !/^(SV|PV|SP|MV)$/.test(q)) || q.length > 34 || /^[-+\d.\s%~]+$/.test(q)) continue;
        const d = Math.hypot(t.x - x, t.y - y);
        if (d < bd) {
          bd = d;
          best = q;
        }
      }
  }
  return (S.nets[n]._nt = best);
}
function cosFromNets(S, nets, self) {
  const seen = new Set();
  let fr = nets.slice(),
    g = 0;
  while (fr.length && g++ < 6) {
    const nx = [];
    for (const n of fr) {
      if (seen.has(n)) continue;
      seen.add(n);
      const l = S.lab[n];
      if (l && l.t && !/^COS/.test(l.t) && n !== nets[0]) return l.t;
      for (const b of S.cns[n] || []) {
        const tg = b.tag || (b.k === 'PID' || b.k === 'PIDV' ? (b.txt || [])[1] : '');
        if (tg && b !== self) return b.k + ' ' + tg;
        if (b.k === 'AO' || b.k === 'IP') {
          const o = (b.pins || []).map(p => S.lab[p.n] && S.lab[p.n].t).find(Boolean);
          if (o) return o;
        }
        for (const m of b.o || []) nx.push(m);
      }
    }
    fr = nx;
  }
  return '';
}
/* 2.2.0-beta.24 (M6 / checklist A10): a COS whose switch output carries no label down to the valve (AO -> I/P -> valve without a tag
   on the drawing: ABC-010, 031, 036 ~ 039 ...) is named by the controller / station on the OTHER leg of its switch (the loop it is
   the manual of). Before: "COS manual ▸ T23" (22 of 173 COS) */
function cosUpTag(S, n, d, seen) {
  if (n == null || n < 0 || d > 5 || seen.has(n)) return '';
  seen.add(n);
  for (const b of S.drv[n] || []) {
    const tg = b.tag || (b.k === 'PID' || b.k === 'PIDV' ? (b.txt || [])[1] : '');
    if (tg) return b.k + ' ' + tg;
    for (const i of b.i || []) {
      const r = cosUpTag(S, i, d + 1, seen);
      if (r) return r;
    }
  }
  return '';
}
function cosFromUp(S, t) {
  const seen = new Set();
  for (const n of [t.a, t.b].concat(t.i || [])) {
    const r = cosUpTag(S, n, 0, seen);
    if (r) return r + ' (manual of this loop)';
  }
  return '';
}
function cosRange(S, e) {
  const t = e.t,
    seen = new Set();
  let hit = null;
  const up = (n, d) => {
    if (hit || d > 6 || n == null || n < 0 || seen.has(n)) return;
    seen.add(n);
    for (const dr of S.drv[n] || []) {
      const b = S.blk.find(q => q.id === dr.id);
      if (!b) continue;
      if (b.k === 'MAN' && b.p && b.p.lo != null) {
        hit = { lo: b.p.rlo != null ? b.p.rlo : b.p.lo, hi: b.p.rhi != null ? b.p.rhi : b.p.hi, u: b.p.u || '%' };
        return;
      }
      if ((b.k === 'PID' || b.k === 'PIDV') && b.p) {
        hit = { lo: b.p.lo == null ? 0 : b.p.lo, hi: b.p.hi == null ? 100 : b.p.hi, u: '%' };
        return;
      }
      for (const q of b.i || []) up(q, d + 1);
    }
  };
  if (t) up(t.a, 0);
  if (!hit) {
    try {
      const r = anRange(S, { cx: e.c.cx, cy: e.c.cy }, 60);
      if (r && r.hi > r.lo) hit = { lo: r.lo, hi: r.hi, u: r.u || '' };
    } catch (x) {}
  }
  return hit || { lo: 0, hi: 100, u: '%' };
}
function cosSvRange(S, e) {
  if (!e.t) return null;
  let dr = null;
  try {
    dr = anRange(S, { cx: e.c.cx, cy: e.c.cy }, 60);
  } catch (x) {}
  if (dr && dr.hi > dr.lo) return null;
  for (const n of e.t.o || [])
    for (const b of S.cns[n] || [])
      for (const P of S.blk) {
        if ((P.k !== 'PID' && P.k !== 'PIDV') || !P.p || P.p.rlo == null || P.p.rhi == null || !(P.p.rhi > P.p.rlo))
          continue;
        const pp = anPins(S, P);
        if (pp && pp.dev === b && pp.sv === n) return { lo: P.p.rlo, hi: P.p.rhi, u: P.p.unit || '' };
      }
  return null;
}
function cosInfo(S, n) {
  if (!S._cm) {
    const m = (S._cm = new Map()),
      all = (S._cosAll = []),
      Ts = S.blk.filter(b => b.k === 'AMT' || b.k === 'SW'),
      unres = (S._cosUn = []),
      ds = (px, py, s) => {
        const dx = s.x2 - s.x1,
          dy = s.y2 - s.y1,
          l2 = dx * dx + dy * dy;
        let t = l2 ? ((px - s.x1) * dx + (py - s.y1) * dy) / l2 : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (s.x1 + t * dx), py - (s.y1 + t * dy));
      };
    for (const c of S.blk) {
      if (c.k !== 'COS') continue;
      const t = c.used
        ? S.blk.find(b => b.id === c.tb)
        : Ts.filter(x => Math.hypot(x.cx - c.cx, x.cy - c.cy) < 30).sort(
            (p, q) => Math.hypot(p.cx - c.cx, p.cy - c.cy) - Math.hypot(q.cx - c.cx, q.cy - c.cy)
          )[0];
      let e = null;
      if (t) {
        const net = c.used ? c.vnet : t.b >= 0 && S.ext.includes(t.b) ? t.b : null;
        if (net != null && !m.has(net)) e = { c, t, net, kind: 'T', dig: !!S.nets[net].dig };
      }
      if (!e) {
        /* an external wire that touches the diamond */ const ws = S.nets
          .filter(
            nn =>
              nn.segs.length &&
              S.ext.includes(nn.id) &&
              !m.has(nn.id) &&
              !(S.xlk && S.xlk[nn.id]) &&
              nn.segs.some(i => ds(c.cx, c.cy, S.seg[i]) < 16)
          )
          .map(nn => ({ nn, d: Math.min(...nn.segs.map(i => ds(c.cx, c.cy, S.seg[i]))) }))
          .sort((p, q) => p.d - q.d);
        if (ws.length) {
          const nn = ws[0].nn;
          const dv = S.blk.filter(x => x.k === 'DEV').find(x => (x.ip || []).some(q => q.n === nn.id)),
            sg = dv && dv.ip.find(q => q.n === nn.id).sg,
            pid = dv && (S.cns[dv.o[0]] || []).find(x => x.k === 'PID' || x.k === 'PIDV');
          e = {
            c,
            t: null,
            dev: dv,
            pid,
            net: nn.id,
            kind: 'W',
            role: dv
              ? pid && anPins(S, pid)
                ? anPins(S, pid).sv === nn.id
                  ? 'SV'
                  : 'PV'
                : sg > 0
                  ? 'SV'
                  : 'PV'
              : '',
            dig: !!nn.dig
          };
        }
      }
      if (!e && t && t.b >= 0 && !S.ext.includes(t.b))
        e = { c, t, net: null, kind: 'L', dig: !!S.nets[t.b].dig, sel: t.b };
      if (!e) {
        unres.push(c);
        continue;
      }
      all.push(e);
      if (e.net != null) m.set(e.net, e);
    }
  }
  const e = n === -99 ? null : S._cm.get(n);
  if (!e) return null;
  return cosFill(S, e);
}
function cosFill(S, e) {
  if (e.name) return e;
  if (e.kind === 'L') {
    const o = (e.t.o || [])[0],
      on = o != null ? cosFromNets(S, [o], e.t) : '',
      sn = e.sel >= 0 && S.lab[e.sel] ? S.lab[e.sel].t : 'net ' + e.sel;
    e.out = on;
    e.name = 'COS change-over ▸ ' + (on || 'T' + e.t.id) + ' (switched by ' + sn + ')';
    e.rng = null;
    return e;
  }
  if (e.kind === 'W') {
    const l = S.lab[e.net],
      P = (e.pid && e.pid.p) || {},
      tg = e.pid ? (e.pid.txt || [])[1] || e.pid.k : '';
    e.out = tg || cosFromNets(S, [e.net], null);
    e.name = 'COS manual ' + (e.role ? e.role + ' ' : '') + '▸ ' + (l && l.t ? l.t : e.out || 'wire ' + e.net);
    if (e.pid && P.rlo != null) e.rng = { lo: P.rlo, hi: P.rhi, u: P.unit || '' };
    else {
      let r = null;
      try {
        r = anRange(S, { cx: e.c.cx, cy: e.c.cy }, 45);
      } catch (x) {}
      e.rng = r && r.hi > r.lo ? { lo: r.lo, hi: r.hi, u: r.u || '' } : { lo: 0, hi: 100, u: '%' };
    }
    return e;
  }
  e.out = cosFromNets(S, e.t.o || [], e.t) || cosFromUp(S, e.t);
  e.name = 'COS manual' + (e.dig ? ' (on / off)' : '') + ' ▸ ' + (e.out || 'T' + e.t.id);
  e.rng = e.dig ? { lo: 0, hi: 1, u: '' } : cosSvRange(S, e) || cosRange(S, e);
  return e;
}
function cosDesc(S, sh, e) {
  let d = '';
  const tag = e.pid ? (e.pid.txt || [])[1] || '' : '',
    F = typeof AN_DEF !== 'undefined' && AN_DEF.FACE;
  const find = t => {
    if (!F || !t) return '';
    for (const k of ['PID', 'MAN', 'SUMA']) for (const q of F[k] || []) if (q.tag === t && q.desc) return q.desc;
    return '';
  };
  d = find(tag) || find((e.out || '').replace(/^(PID|PIDV|MAN) /, ''));
  if (!d) {
    const a = adesFind(sh, (e.out || '').replace(/^[A-Z]+ /, ''));
    if (a) d = adesText(a.rec);
  }
  if (!d && e.pid) d = S._shTitle || '';
  return d;
}
function cosOn(S, e) {
  if (e.kind === 'SV' || (e.kind === 'W' && e.role))
    return { on: true, why: 'operator ' + (e.role || 'SV') + ' of the controller: always settable' };
  if (e.kind === 'W') return { on: true, why: 'operator value: always settable' };
  const t = e.t,
    st = S.rt.st[t.id] || {},
    sw = t.sel >= 0 || (t.cs && t.cs.length);
  if (e.kind === 'L') {
    const on = st.pk === 'B';
    return {
      on,
      why:
        (on ? 'ENERGIZED (manual leg selected)' : 'NOT ENERGIZED (auto leg selected)') +
        ' · switched by the logic: ' +
        (S.lab[e.sel] ? S.lab[e.sel].t : 'net ' + e.sel) +
        ' = ' +
        (S.rt.v[e.sel] > 0.5 ? 1 : 0)
    };
  }
  if (!sw) return { on: true, why: 'this T has no switching signal: always a manual input' };
  const o = (t.o || [])[0];
  if (o != null && (S.cns[o] || []).some(x => x.k === 'DEV' || x.k === 'PID' || x.k === 'PIDV'))
    return { on: true, why: 'used as SV / PV: always settable' };
  const on = st.pk === 'B',
    sn = t.sel >= 0 ? nm(S, t.sel) + ' = ' + (S.rt.v[t.sel] > 0.5 ? 1 : 0) : t.cs && t.cs.length ? 'COS select' : '';
  return {
    on,
    why:
      (on
        ? 'ENERGIZED: the T switch is on the manual leg'
        : 'NOT ENERGIZED: the T switch is on the auto (A) leg, the manual value is not used') +
      (sn ? ' · switching: ' + sn : '')
  };
}
function cosCtl(S, sh, n, e) {
  const ds = cosDesc(S, sh, e);
  if (e.dig) {
    const bx = h$('span', { cls: 'fc', style: 'flex-wrap:wrap' }),
      bt = h$('button', {}),
      wy = h$('small', { style: 'flex-basis:100%;color:#9ab' });
    bt.onclick = () => {
      if (!cosOn(S, e).on) return;
      const v = S.rt.ext[n] > 0.5 ? 0 : 1;
      S.rt.ext[n] = v;
      (sv(sh).ext = sv(sh).ext || {})[n] = v;
      anSave();
      settle();
    };
    bx.append(h$('small', { txt: ds, style: 'flex-basis:100%;color:#9ab' }), bt, wy);
    const u0 = () => {
      const o = cosOn(S, e),
        on = S.rt.ext[n] > 0.5;
      bt.textContent = on ? 'INPUT 1 · ON' : 'INPUT 0 · OFF';
      bt.classList.toggle('on', on);
      bt.disabled = !o.on;
      bx.style.opacity = o.on ? 1 : 0.5;
      wy.textContent = o.why;
      wy.style.color = o.on ? '#8fe3b0' : '#ffb04d';
    };
    u0();
    u0._s = 1;
    PU.push(u0);
    return bx;
  }
  const r = e.rng,
    box = h$('span', { cls: 'fc', style: 'flex-wrap:wrap' }),
    i = anEdit(h$('input', { type: 'number', step: 'any' })),
    rg = h$('input', { type: 'range', min: r.lo, max: r.hi, step: (r.hi - r.lo) / 1000 }),
    ok = h$('button', { txt: '✓', title: 'Accept this value (Enter)' }),
    st = h$('small', { style: 'flex-basis:100%' }),
    why = h$('small', { style: 'flex-basis:100%;color:#9ab' });
  i.style.width = '74px';
  rg.style.width = '100%';
  const set = v => {
      if (!cosOn(S, e).on) return;
      S.rt.ext[n] = v;
      (sv(sh).ext = sv(sh).ext || {})[n] = v;
      anSave();
      settle();
    },
    acc = () => {
      const v = parseFloat(i.value);
      if (isFinite(v)) {
        i._clr();
        set(Math.max(r.lo, Math.min(r.hi, v)));
      }
    };
  ok.onclick = acc;
  i.onkeydown = ev => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      acc();
    }
  };
  rg.oninput = () => set(+rg.value);
  box.append(
    h$('small', {
      txt: 'range ' + fmt(r.lo) + ' ~ ' + fmt(r.hi) + ' ' + r.u + (ds ? ' · ' + ds : ''),
      style: 'flex-basis:100%;color:#9ab'
    }),
    i,
    ok,
    rg,
    st,
    why
  );
  const u = () => {
    const o = cosOn(S, e);
    i.disabled = rg.disabled = ok.disabled = !o.on;
    box.style.opacity = o.on ? 1 : 0.5;
    why.textContent = o.why;
    why.style.color = o.on ? '#8fe3b0' : '#ffb04d';
    const tgt = S.rt.ext[n] || 0,
      now = S.rt.v[n];
    st.textContent =
      'target ' +
      fmt(tgt) +
      ' → now ' +
      fmt(now) +
      ' ' +
      r.u +
      (Math.abs(tgt - (now == null ? 0 : now)) > 1e-6 * (1 + Math.abs(tgt)) ? '  (ramping)' : '');
    if (document.activeElement !== i && !i._d) i.value = tgt;
    if (document.activeElement !== rg) rg.value = tgt;
  };
  u();
  u._s = 1;
  PU.push(u);
  return box;
}
function cosStatus(S, sh, e) {
  const box = h$('span', { cls: 'fc', style: 'flex-wrap:wrap' }),
    w = h$('small', { style: 'flex-basis:100%' }),
    ds = cosDesc(S, sh, e);
  box.append(
    h$('small', {
      txt: (ds ? ds + ' · ' : '') + 'A / M change-over by the switching logic (not a manual value)',
      style: 'flex-basis:100%;color:#9ab'
    }),
    w
  );
  const u = () => {
    const o = cosOn(S, e);
    w.textContent = o.why;
    w.style.color = o.on ? '#8fe3b0' : '#ffb04d';
  };
  u();
  u._s = 1;
  PU.push(u);
  return box;
}
function nm(S, n) {
  {
    const ci = cosInfo(S, n);
    if (ci) return ci.name;
  }
  const l = S.lab[n];
  if (l) return l.t;
  if (S.ext.includes(n)) {
    const w = wireTag(S, n);
    if (w) return w;
    const t = nearTx(S, n);
    if (t) return t;
  }
  const c = S.cns[n] && S.cns[n][0],
    d = S.drv[n] && S.drv[n][0];
  if (d && d.k !== 'LINK') return d.k + (d.tag ? ' ' + d.tag : '') + ' out';
  if (c) return '→ ' + c.k + (c.tag ? ' ' + c.tag : '') + (S.nets[n].dig ? ' (digital)' : '');
  return 'net ' + n;
}
const almLv = (b, x) => {
  const P = b.p;
  if (P.hh != null && x >= P.hh) return 'HIGH-HIGH';
  if (P.h != null && x >= P.h) return 'HIGH';
  if (P.ll != null && x <= P.ll) return 'LOW-LOW';
  if (P.l != null && x <= P.l) return 'LOW';
  return 'normal';
};
AN.almLv = almLv;
function swSet(sh, b, m) {
  const st = sh.S.rt.st[b.id];
  st.fm = m || undefined;
  (sv(sh).sw = sv(sh).sw || {})[b.id] = m || 0;
  anSave();
  settle();
}
function pSet(sh, b, k, v) {
  b.p[k] = v;
  const o = sv(sh);
  (o.p = o.p || {})[b.id] = Object.assign(o.p[b.id] || {}, { [k]: v });
  anSave();
  settle();
  try {
    AN.panelUpd && AN.panelUpd(true);
  } catch (e) {}
}
/* FORCE: any wire (input or output of any block) can be forced to a value, the same as a bypass in the DCS */
function setForce(sh, n, x) {
  const S = sh.S,
    o = sv(sh);
  o.force = o.force || {};
  if (S.rt.pf) delete S.rt.pf[n];
  if (x === undefined) {
    delete S.rt.force[n];
    delete o.force[n];
  } else {
    S.rt.force[n] = x;
    o.force[n] = x;
  }
  anSave();
  settle();
  fpUpd();
}
/* a numeric field is DIRTY from the first typed character until it is committed (check / Enter / change), cancelled (Esc, release) or abandoned (2.5 s after it lost focus). The 100 ms updater never overwrites a dirty field. */
function anEdit(i) {
  let tm = 0;
  i._d = 0;
  i._clr = () => {
    i._d = 0;
    clearTimeout(tm);
  };
  i.addEventListener('input', e => {
    i._d = 1;
    clearTimeout(tm);
    if (!e.inputType || !/^(insert|delete|history)/.test(e.inputType)) {
      /* spinner arrows / arrow keys: apply now, like Enter */ const ok =
        i.parentNode && [...i.parentNode.querySelectorAll('button')].find(b => b.textContent === '✓');
      if (ok) ok.click();
      else i.dispatchEvent(new Event('change'));
    }
  });
  i.addEventListener('focus', () => clearTimeout(tm));
  i.addEventListener('blur', () => {
    if (i._d) {
      clearTimeout(tm);
      tm = setTimeout(() => {
        i._d = 0;
      }, 2500);
    }
  });
  i.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      i._clr();
      i.blur();
    }
  });
  return i;
}
function forceCtl(S, sh, n) {
  const dig = S.nets[n].dig,
    box = h$('span', { cls: 'fc' });
  const F = S.rt.force;
  if (dig) {
    const lab = h$('small', { txt: 'FORCE' }),
      b1 = h$('button', { txt: '1', title: 'Force this signal to 1 (like a bypass in the DCS)' }),
      b0 = h$('button', { txt: '0', title: 'Force this signal to 0' }),
      x = h$('button', { txt: 'Release', title: 'Release the force: back to the value computed by the logic' });
    b1.onclick = () => setForce(sh, n, 1);
    b0.onclick = () => setForce(sh, n, 0);
    x.onclick = () => setForce(sh, n, undefined);
    box.append(lab, b1, b0, x);
    const u = () => {
      const c = F[n];
      b1.classList.toggle('fo', c !== undefined && c > 0.5);
      b0.classList.toggle('fo', c !== undefined && c <= 0.5);
      x.disabled = c === undefined;
      lab.textContent = c === undefined ? 'FORCE' : 'FORCED';
    };
    u();
    u._s = 1;
    PU.push(u);
  } else {
    const i = anEdit(h$('input', { type: 'number', step: 'any', placeholder: 'value' }));
    i.style.width = '74px';
    const ok = h$('button', { txt: '✓', title: 'Accept: force this value (Enter)' }),
      x = h$('button', { txt: '✕', title: 'Release force (back to automatic)' });
    const acc = () => {
      let v = parseFloat(i.value);
      if (isFinite(v)) {
        i._clr();
        const r_ = anNetRange(S, n) || (S.ext.includes(n) ? anExtRange(S, n) : null),
          c_ = anClamp(r_, v);
        if (c_.cut) msg('Limited to the range written on the drawing: ' + r_.lo + ' ~ ' + r_.hi + ' ' + r_.u);
        setForce(sh, n, c_.x);
      } else msg('Type a number first, then press ✓');
    };
    ok.onclick = acc;
    i.onkeydown = e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        acc();
      }
    };
    x.onclick = () => {
      i._clr();
      setForce(sh, n, undefined);
      i.value = '';
    };
    box.append(i, ok, x);
    const u = () => {
      const c = F[n];
      if (document.activeElement !== i && !i._d) i.value = c === undefined ? '' : c;
      i.classList.toggle('fo', c !== undefined);
      ok.classList.toggle('fo', c !== undefined);
    };
    u();
    u._s = 1;
    PU.push(u);
  }
  return box;
}
function fpUpd() {
  const d = $('anfp');
  if (!d) return;
  const sh = cs(),
    S = sh.S,
    ks = Object.keys(S.rt.force).filter(k => !(S.rt.pf && S.rt.pf[k]));
  d.innerHTML = '';
  d.append(h$('h4', { txt: 'Forced signals (' + ks.length + ')' }));
  ks.forEach(k => {
    const n = +k,
      x = h$('button', { txt: '✕', title: 'Release' });
    x.onclick = () => setForce(sh, n, undefined);
    d.append(
      h$('div', { cls: 'r' }, [
        h$('span', { cls: 'n', txt: nm(S, n) }),
        h$('span', {
          cls: 'v',
          txt: S.nets[n].dig ? (S.rt.force[k] > 0.5 ? 'FORCE 1' : 'FORCE 0') : String(S.rt.force[k])
        }),
        x
      ])
    );
  });
  if (ks.length > 1)
    d.append(
      h$('button', {
        txt: 'Release all',
        onclick: () => {
          ks.forEach(k => {
            delete S.rt.force[k];
          });
          delete sv(sh).force;
          anSave();
          settle();
          fpUpd();
        }
      })
    );
}
function inCtl(S, sh, n) {
  const dig = S.nets[n].dig,
    setE = x => {
      if (!S.nets[n].dig) {
        const c_ = anClamp(anExtRange(S, n), x);
        if (c_.cut) {
          const r_ = anExtRange(S, n);
          msg('Limited to the range written on the drawing: ' + r_.lo + ' ~ ' + r_.hi + ' ' + r_.u);
        }
        x = c_.x;
      }
      S.rt.ext[n] = x;
      (sv(sh).ext = sv(sh).ext || {})[n] = x;
      anSave();
      settle();
    };
  if (dig) {
    const bt = h$('button', { title: 'This is an input: click to switch it' });
    bt.onclick = () => setE(S.rt.ext[n] > 0.5 ? 0 : 1);
    const u = () => {
      const o = S.rt.ext[n] > 0.5;
      bt.textContent = o ? 'INPUT 1 · ON' : 'INPUT 0 · OFF';
      bt.classList.toggle('on', o);
    };
    u();
    u._s = 1;
    PU.push(u);
    return bt;
  }
  const i = anEdit(h$('input', { type: 'number', step: 'any' }));
  i.value = S.rt.ext[n] || 0;
  i.style.width = '74px';
  const ok = h$('button', { txt: '✓', title: 'Accept this input value (Enter)' });
  const acc = () => {
    const v = parseFloat(i.value);
    if (isFinite(v)) {
      i._clr();
      setE(v);
    } else msg('Type a number first, then press ✓');
  };
  ok.onclick = acc;
  i.onkeydown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      acc();
    }
  };
  const sg0 = S.seg[S.nets[n].segs[0]],
    rr = anExtRange(S, n) || { lo: 0, hi: 100 },
    rg = h$('input', { type: 'range', min: rr.lo, max: rr.hi, step: (rr.hi - rr.lo) / 1000 });
  rg.style.width = '100%';
  rg.value = S.rt.ext[n] || 0;
  rg.oninput = () => setE(+rg.value);
  const u = () => {
    if (document.activeElement !== i && !i._d) i.value = S.rt.ext[n] || 0;
    if (document.activeElement !== rg) rg.value = S.rt.ext[n] || 0;
  };
  u._s = 1;
  PU.push(u);
  return h$('span', { cls: 'fc', style: 'flex-wrap:wrap' }, [h$('small', { txt: 'INPUT' }), i, ok, rg]);
}
const ctl = (S, sh, n) => wrCtl(ctl0(S, sh, n));
const ctl0 = (S, sh, n) => {
  {
    const lb = procLock(S, n);
    if (lb)
      return h$('small', {
        style: 'color:#ffb04d',
        txt:
          'PV of ' +
          ((lb.txt || [])[1] || lb.k) +
          ' is simulated by its process model: set the SV instead (or turn the model off in the controller panel).'
      });
  }
  const e = cosInfo(S, n);
  if (e && S.ext.includes(n) && !(S.xlk && S.xlk[n])) return cosCtl(S, sh, n, e);
  return S.ext.includes(n) && !(S.xlk && S.xlk[n]) ? inCtl(S, sh, n) : forceCtl(S, sh, n);
};
function rowFocus(key) {
  const r = AN.rows && AN.rows[key];
  if (!r || !r.isConnected) return;
  const d = r.closest('details');
  if (d) d.open = true;
  if (r.style.display === 'none') r.style.display = '';
  {
    const a = r.closest('#anp');
    if (a) a.scrollTop += r.getBoundingClientRect().top - a.getBoundingClientRect().top - a.clientHeight / 2;
  }
  r.classList.add('hl');
  setTimeout(() => r.classList.remove('hl'), 1600);
}
