/* DITL (digital logic) - Drawing of a sheet (render) and its helpers. Part of ONE script (joined by src/digital/order.list, in this order). */
/* the models of a sheet (grpModel, fieldInModel, usrModel): parts/03b-sim.js */
/* the simulation (DREG, simulate, avOf, xconPeer, simSheet): parts/03b-sim.js */
/* ---------- render ---------- */
const COL = { CON: '#4fd18b', HID: '#35505f', CEN: '#e0a030', DCS: '#ffd24a', SYM: '#4fd18b' },
  stk = l => COL[l] || '#cfd8dc';
const dash = l => (l === 'HID' ? '2 1.2' : l === 'CEN' ? '4 1 1 1' : null);
function el(n, a, p) {
  const e = document.createElementNS(NS, n);
  for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]);
  if (p) p.appendChild(e);
  return e;
}
function tx(t, p) {
  const e = el(
    'text',
    {
      x: t.x,
      y: -t.y,
      'font-size': t.h,
      fill: t.l === 'DCS' ? COL.DCS : '#e6edf3',
      'text-anchor': t.a === 1 || t.a === 4 ? 'middle' : t.a === 2 ? 'end' : 'start',
      'dominant-baseline':
        t.a === 4
          ? 'central'
          : t.b === 1
            ? 'text-after-edge'
            : t.b === 2
              ? 'central'
              : t.b === 3
                ? 'text-before-edge'
                : 'alphabetic'
    },
    p
  );
  if (t.r) e.setAttribute('transform', `rotate(${-t.r} ${t.x} ${-t.y})`);
  e.style.fontFamily = "Consolas,'Cascadia Mono',monospace";
  /* 3.2.0-beta.35: machine B / C / D of a shared drawing: its letter and its own address (WORLD.showText) */
  e.textContent = TXMAP ? TXMAP(t.t) : t.t;
  return e;
}
const SIDE = { L: ['F', 'L', 'T', 'S'], R: ['RS', 'RL', 'RT'] };
let TXMAP = null;
function render() {
  const svg = $('svg'),
    s = cur();
  TXMAP = s && s._inst && s._inst.k && typeof WORLD !== 'undefined' && WORLD.showText ? x => WORLD.showText(s, x) : null;
  svg.innerHTML = '';
  $('meta').hidden = !s;
  if (s && (!s.nl || s.nl.v !== 10)) {
    s.nl = netlist(s);
    s.uvDone = false;
  }
  if (s && s.nl) s.nl.avk = avOf(s);
  uvApply(s);
  uvSave();
  let SV = null,
    rowOn = new Set(),
    outOn = new Set(),
    barLit = new Set();
  let FRC = new Map();
  if (simOn() && s) {
    FRC = mvForced(s);
    const R = simRead(s);
    rowOn = R.rowOn;
    SV = R.v;
    outOn = R.outOn;
    (s.nl.mir || []).forEach(m => FRC.set(m.row, m.neg ? !SV[m.n] : !!SV[m.n]));
    grpState(s).forEach((v, i) => FRC.set(i, v));
    /* one world: an input row fed by another sheet shows its value (dashed = it comes from elsewhere, not from a click) */
    const WD = window.WORLD && WORLD.live && WORLD.idx && WORLD.idx.din.get(s);
    if (WD) WD.forEach((_, i) => FRC.set(i, rowOn.has(i)));
    s.nl.gates.forEach(g => {
      if (g.bar >= 0 && g.ins.some(n => SV[n])) barLit.add(g.bar);
    });
  }
  try {
    localStorage.setItem('ditl.v1', J(S));
    LSF = false;
  } catch (e) {
    if (window.PRE_N) {
      try {
        localStorage.removeItem('ditl.v1');
      } catch (x) {}
    } else if (!LSF) {
      LSF = true;
      msg('Autosave is FULL (browser storage ~5 MB). Use Save project now.');
    }
  }
  try {
    if (cur()) localStorage.setItem('ditl.curname', cur().name);
  } catch (e) {}
  if (s) fixSave(s);
  $('bundo').disabled = !hist.length;
  $('bredo').disabled = !fut.length;
  {
    const ss = $('shsel');
    if (ss) {
      ss.innerHTML = '';
      S.sheets.forEach((x, i) => {
        const o = document.createElement('option');
        o.value = i;
        o.textContent = (x.bv !== BV ? '⚠ ' : '') + x.name;
        if (i === S.cur) o.selected = true;
        ss.appendChild(o);
      });
    }
  }
  drawSide();
  if (!s) {
    svg.setAttribute('viewBox', '0 0 400 100');
    el('text', { x: 200, y: 50, 'text-anchor': 'middle', fill: '#7d8e9a', 'font-size': 6 }, svg).textContent =
      'Import a DXF (ASCII) to start';
    return;
  }
  const g = el('g', {}, svg);
  let a = [1e9, 1e9, -1e9, -1e9];
  const ext = (x, y) => {
    a[0] = Math.min(a[0], x);
    a[1] = Math.min(a[1], -y);
    a[2] = Math.max(a[2], x);
    a[3] = Math.max(a[3], -y);
  };
  const SPL = {};
  (s.nl.split || []).forEach(p => (SPL[p.k] = p));
  s.raw.ln.forEach(([x1, y1, x2, y2, l, hop], k) => {
    if (hop === 'hop') return; /* 2.5.0-beta.14: the straight wire under a hop half circle (bottom ash) is not drawn */
    ext(x1, y1);
    ext(x2, y2);
    const sp = SPL[k];
    if (sp) {
      const xa = Math.min(x1, x2),
        xb = Math.max(x1, x2);
      [
        [xa, sp.cx, sp.a],
        [sp.cx, xb, sp.b]
      ].forEach(([u1, u2, kk]) => {
        const n = SV ? s.nl.seg[kk] : undefined,
          lit = n !== undefined && SV[n];
        el(
          'line',
          {
            x1: u1,
            y1: -y1,
            x2: u2,
            y2: -y1,
            stroke: n === undefined ? stk(l) : lit ? LIVES[LIVE] : '#2b5f46',
            'stroke-width': lit ? 0.7 : 0.35
          },
          g
        );
      });
      return;
    }
    const n = SV ? s.nl.seg[k] : undefined,
      lit = n !== undefined && SV[n];
    el(
      'line',
      {
        x1,
        y1: -y1,
        x2,
        y2: -y2,
        stroke: n === undefined ? stk(l) : lit ? LIVES[LIVE] : '#2b5f46',
        'stroke-width': lit ? 0.7 : 0.35,
        'stroke-dasharray': dash(l)
      },
      g
    );
  });
  s.raw.pl.forEach(([p, c, l], k) => {
    p.forEach(q => ext(q[0], q[1]));
    const pn = SV && s.nl.plnet ? s.nl.plnet[k] : undefined,
      lit = barLit.has(k) || (pn !== undefined && SV[pn]);
    el(
      'path',
      {
        d: 'M' + p.map(q => q[0] + ' ' + -q[1]).join('L') + (c ? 'Z' : ''),
        fill: 'none',
        stroke: lit ? LIVES[LIVE] : pn !== undefined ? '#2b5f46' : stk(l),
        'stroke-width': lit ? 0.9 : 0.35,
        'stroke-dasharray': dash(l)
      },
      g
    );
  });
  (s.nl.dots || []).forEach(d =>
    el('circle', { cx: d.x, cy: -d.y, r: 0.9, fill: SV ? (d.n >= 0 && SV[d.n] ? LIVES[LIVE] : '#2b5f46') : COL.CON }, g)
  );
  for (const [x, y, r, l] of s.raw.ci) {
    ext(x, y);
    el('circle', { cx: x, cy: -y, r, fill: 'none', stroke: stk(l), 'stroke-width': 0.35 }, g);
  }
  for (const [x, y, r, a0, a1, l] of s.raw.ar) {
    const P = d => [x + r * Math.cos((d * Math.PI) / 180), -(y + r * Math.sin((d * Math.PI) / 180))],
      A = P(a0),
      B = P(a1);
    el(
      'path',
      {
        d: `M${A[0]} ${A[1]}A${r} ${r} 0 ${(a1 - a0 + 360) % 360 > 180 ? 1 : 0} 0 ${B[0]} ${B[1]}`,
        fill: 'none',
        stroke: stk(l),
        'stroke-width': 0.35
      },
      g
    );
  }
  for (const [q, l] of s.raw.so)
    el(
      'polygon',
      { points: q.map(p => p[0] + ',' + -p[1]).join(' '), fill: stk(l), stroke: stk(l), 'stroke-width': 0.1 },
      g
    );
  for (const [x, y] of s.raw.lamp || [])
    el(
      'path',
      {
        d: 'M-3 -3L3 3L3 -3L-3 3Z',
        transform: `translate(${x} ${-y})`,
        fill: 'none',
        stroke: COL.CON,
        'stroke-width': 0.35
      },
      g
    );
  for (const t of s.tx) {
    ext(t.x, t.y);
    tx(t, g);
  }
  for (const k in s.cells) {
    /* 2.5.0-beta.8: a page link (FROM / TO column) is drawn as a link */
    const lk = /:(F|RT)$/.test(k) && window.DUI && DUI.refs && DUI.refs(s.cells[k].map(t => t.t).join(' ')).length;
    for (const t of s.cells[k]) {
      ext(t.x, t.y);
      const e = tx(t, g);
      if (lk) e.classList.add('plink');
    }
  }
  /* 2.5.0-beta.20 (UI audit): the first view of a sheet is its frame (the lines), as Fit; the loose texts around the frame
     (DITL-56: "STATION 102", "76") made the sheet small */
  if (!VB[S.cur] && window.LOVIEW) {
    const e = LOVIEW.dext(s);
    if (e) VB[S.cur] = [e[0], e[1], e[2] - e[0], e[3] - e[1]];
  }
  if (!VB[S.cur]) VB[S.cur] = [a[0] - 6, a[1] - 6, a[2] - a[0] + 12, a[3] - a[1] + 12];
  svg.setAttribute('viewBox', VB[S.cur].join(' '));
  const VR = s.vr || s.rng;
  s.rows.forEach((r, i) => {
    for (const c in r.vx || s.rng) {
      const k = i + ':' + c,
        pop = SIM ? (LEFT.includes(c) ? fbk(s, i, c) : c === 'RS' && outOn.has(i)) : !!s.cells[k] || fbk(s, i, c),
        [x1, x2] = (r.vx && r.vx[c]) || VR[c],
        sl = sel && sel.k === k;
      const RB = (s.rb && s.rb[i]) || [r.y - 3.3, r.y + 5.7];
      el(
        'rect',
        {
          x: x1,
          y: -RB[1],
          width: x2 - x1,
          height: RB[1] - RB[0],
          class:
            'hit' +
            (pop && SIM && LEFT.includes(c) ? ' pop' : '') +
            (SIM && pop && (FRC.has(i) && LEFT.includes(c) ? FRC.get(i) : s.sig[k]) ? ' on' : '') +
            (SIM && pop && FRC.has(i) && LEFT.includes(c) ? ' frc' : '') +
            (SIM && pop && !LEFT.includes(c) && outOn.has(i) ? ' out' : '') +
            (!SIM && sl ? ' selc' : '')
        },
        g
      );
    }
  });
  if (SIM) {
    s.rows.forEach((r, i) => {
      if (!fbk(s, i, 'S')) return;
      const xr = r.vx && r.vx.S ? r.vx.S[1] : VR.S[1],
        cy = -(r.y + 1.2),
        on = FRC.has(i) ? FRC.get(i) : !!s.sig[i + ':S'],
        L = LIVES[LIVE];
      if (FRC.has(i)) return;
      if (isPB(s, i)) {
        const w = 6.4,
          h = 3.6,
          x = xr - w - 1.2;
        el(
          'rect',
          {
            x,
            y: cy - h / 2,
            width: w,
            height: h,
            rx: 0.9,
            fill: on ? L : '#1b2731',
            stroke: on ? L : '#7d8e9a',
            'stroke-width': 0.3,
            'pointer-events': 'none'
          },
          g
        );
        const t = el(
          'text',
          {
            x: x + w / 2,
            y: cy + 0.65,
            'font-size': 1.9,
            'text-anchor': 'middle',
            fill: on ? '#0b1013' : '#cfd8dc',
            'pointer-events': 'none'
          },
          g
        );
        t.style.fontFamily = 'Consolas,monospace';
        t.style.fontWeight = 'bold';
        t.textContent = 'PB';
      } else {
        const x = xr - 4.6;
        el(
          'rect',
          {
            x,
            y: cy - 1.3,
            width: 3.6,
            height: 2.6,
            rx: 1.3,
            fill: on ? L : '#1b2731',
            stroke: on ? L : '#7d8e9a',
            'stroke-width': 0.25,
            'pointer-events': 'none'
          },
          g
        );
        el(
          'circle',
          { cx: on ? x + 2.3 : x + 1.3, cy, r: 0.85, fill: on ? '#0b1013' : '#7d8e9a', 'pointer-events': 'none' },
          g
        );
      }
    });
  }
  if (SIM)
    (s.nl.usr || []).forEach(u => {
      const on = !!(s.usw && s.usw[u.key]),
        L = LIVES[LIVE],
        x = u.x - 1.8,
        cy = -u.y;
      el(
        'rect',
        {
          x,
          y: cy - 1.3,
          width: 3.6,
          height: 2.6,
          rx: 1.3,
          fill: on ? L : '#1b2731',
          stroke: on ? L : '#7d8e9a',
          'stroke-width': 0.25,
          'pointer-events': 'none'
        },
        g
      );
      el(
        'circle',
        { cx: on ? x + 2.3 : x + 1.3, cy, r: 0.85, fill: on ? '#0b1013' : '#7d8e9a', 'pointer-events': 'none' },
        g
      );
      const t = el(
        'text',
        {
          x: u.fin ? x : x + 4.4,
          y: u.fin ? cy - 2 : cy + 0.6,
          'font-size': 1.6,
          fill: '#7d8e9a',
          'pointer-events': 'none'
        },
        g
      );
      t.style.fontFamily = 'Consolas,monospace';
      t.textContent = u.fin ? u.label + ' (field)' : 'TEST SWITCH';
    });
  if (SIM && SV) {
    const L = LIVES[LIVE];
    (s.nl.term || []).forEach(o => {
      const on = !!SV[o.n];
      el(
        'circle',
        {
          cx: o.x + (o.dx || 0),
          cy: -o.y,
          r: 1.15,
          fill: on ? L : '#0b1013',
          stroke: on ? L : '#7d8e9a',
          'stroke-width': 0.3,
          'pointer-events': 'none'
        },
        g
      );
      if (o.lamp && on)
        el(
          'ellipse',
          { cx: o.lamp.x, cy: -o.lamp.y, rx: 5, ry: 3.1, fill: L, opacity: 0.5, 'pointer-events': 'none' },
          g
        );
    });
    (s.nl.lamps || []).forEach(l => {
      if (l.linked) return;
      if (l.nets.some(n => SV[n]))
        el('ellipse', { cx: l.x, cy: -l.y, rx: 5, ry: 3.1, fill: L, opacity: 0.5, 'pointer-events': 'none' }, g);
    });
    (s.nl.mv || []).forEach(b => {
      if (b.sv && b.coil && SV[b.open.n])
        el(
          'circle',
          { cx: b.coil.x, cy: -b.coil.y, r: b.coil.r - 0.5, fill: L, opacity: 0.45, 'pointer-events': 'none' },
          g
        );
    });
  }
  if (SIM)
    (s.nl.an || []).forEach(a => {
      if (a.row < 0) return;
      const r = s.rows[a.row],
        xr = VR.S[1],
        v = anVal(s, a),
        on = a.g.some(i => cmpOn(s, s.nl.gates[i])),
        L = LIVES[LIVE];
      const w = Math.max(9, (String(v).length + (a.unit || '').length) * 1.25 + 3);
      el(
        'rect',
        {
          x: xr - w - 1,
          y: -(r.y + 1.2) - 1.9,
          width: w,
          height: 3.8,
          rx: 0.9,
          fill: on ? L : '#1b2731',
          stroke: on ? L : '#7d8e9a',
          'stroke-width': 0.25,
          'pointer-events': 'none'
        },
        g
      );
      const t = el(
        'text',
        {
          x: xr - 1 - w / 2,
          y: -(r.y + 1.2) + 0.7,
          'font-size': 2.1,
          'text-anchor': 'middle',
          fill: on ? '#0b1013' : '#cfd8e0',
          'pointer-events': 'none'
        },
        g
      );
      t.style.fontFamily = 'Consolas,monospace';
      t.style.fontWeight = 'bold';
      t.textContent = v + (a.unit ? ' ' + a.unit.slice(0, 6) : '');
    });
  el('g', { id: 'ov', 'pointer-events': 'none' }, svg);
  drawOv();
  if (window.DUI && DUI.after) DUI.after(); /* 2.5.0-beta.8: the row a page link opened keeps blinking through a redraw (Run) */
  updatePanel();
  buildTP();
  renderMeta();
  $('bwire').textContent = 'Wire fix: ' + (WT ? 'On' : 'Off');
  $('bwire').className = WT ? 'on' : '';
  $('bmode').textContent = SIM ? '■ Stop' : '▶ Run';
  $('bmode').title = SIM
    ? 'Simulate mode: click a cell = 1 / 0. Press to go back to Edit mode.'
    : 'Edit mode: click = select. Press to simulate (click a cell = 1 / 0).';
  $('bmode').className = SIM ? 'on' : '';
}
/* ---------- state ---------- */
function push() {
  hist.push(J(S));
  if (hist.length > 40) hist.shift();
  fut = [];
}
function undo() {
  if (!hist.length) return;
  fut.push(J(S));
  S = JSON.parse(hist.pop());
  render();
}
function redo() {
  if (!fut.length) return;
  hist.push(J(S));
  S = JSON.parse(fut.pop());
  render();
}
function xy(ev) {
  const m = $('svg').getScreenCTM().inverse(),
    p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m);
  return [p.x, -p.y];
}
function hit(e) {
  const s = cur();
  if (!s) return null;
  const [x, y] = xy(e),
    VR = s.vr || s.rng;
  /* 3.2.0-beta.39 (+ sand): a sand injection row (sh.sd) has its own area (r.vx: the flag / switch / lamp on the drawing) and its own height (s.rb) */
  for (let i = 0; i < s.rows.length; i++) {
    const r = s.rows[i];
    if (r.vx) {
      const RB = s.rb[i];
      if (y < RB[0] || y >= RB[1]) continue;
      for (const c in r.vx) if (x >= r.vx[c][0] && x < r.vx[c][1]) return { i, c, k: i + ':' + c };
    }
  }
  const i = s.rows.findIndex(r => !r.vx && y >= r.y - 3.3 && y < r.y + 5.7);
  if (i < 0) return null;
  for (const c in VR) if (x >= VR[c][0] && x < VR[c][1]) return { i, c, k: i + ':' + c };
  return null;
}
let mt;
function msg(t) {
  const e = $('toast');
  e.textContent = t;
  e.hidden = false;
  clearTimeout(mt);
  mt = setTimeout(() => (e.hidden = true), 7000);
}
let EDH = null;
function closeEd() {
  EDH = null;
  $('ed').hidden = true;
}
function openEd(h, cx, cy) {
  if (NOEDIT) return;
  const s = cur(),
    ed = $('ed');
  EDH = h;
  $('edt').textContent = `Row ${s.rows[h.i].n} · ${h.c}`;
  $('eta').value = (s.cells[h.k] || []).map(t => t.t).join('\n');
  ed.hidden = false;
  ed.style.left = Math.max(4, Math.min(cx, innerWidth - 285)) + 'px';
  ed.style.top = Math.max(4, Math.min(cy + 14, innerHeight - 130)) + 'px';
  $('eta').focus();
  $('eta').select();
}
function commitEd() {
  const h = EDH,
    s = cur();
  if (!h) return;
  push();
  const it = s.cells[h.k] || [],
    ls = $('eta')
      .value.split('\n')
      .map(x => x.trim())
      .filter(Boolean),
    x0 = s.rng[h.c][0];
  const out = ls.map((t, j) =>
    it[j]
      ? { ...it[j], t }
      : {
          t,
          ix: x0 + 1.5,
          iy: s.rows[h.i].y,
          x: x0 + 1.5,
          y: s.rows[h.i].y - j * 3.4,
          h: 2.5,
          r: 0,
          a: 0,
          b: 0,
          l: 'TXT1'
        }
  );
  if (out.length) s.cells[h.k] = out;
  else delete s.cells[h.k];
  sel = h;
  closeEd();
  render();
}
$('eta').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    commitEd();
  } else if (e.key === 'Escape') closeEd();
  e.stopPropagation();
});
function clearSel() {
  if (!sel || SIM || NOEDIT) return;
  push();
  const s = cur();
  delete s.cells[sel.k];
  delete s.sig[sel.k];
  render();
}
function report(s) {
  const n = s.nl,
    c = {};
  n.gates.forEach(g => (c[g.t] = (c[g.t] || 0) + 1));
  const bad = n.gates.filter(g =>
      g.t === 'FF' ? !g.s.length || !g.r.length || !g.out.length : !g.ins.length || !g.out.length
    ).length,
    tm = s.tx.filter(t => /DELAY|PULSE/.test(t.t)).length - n.gates.filter(g => g.t === 'TMR').length;
  return (
    `${s.name}: ${n.gates.length} gates (${Object.entries(c)
      .map(e => e[0] + ' ' + e[1])
      .join(
        ', '
      )}), ${n.n} nets, ${n.dots.length} junction dots, ${new Set(n.src.map(x => x.row)).size} input rows, ${new Set(n.outs.map(x => x.row)).size} output rows` +
    (bad ? ` · ${bad} gate(s) with missing pins` : '') +
    (n.dang.length
      ? ` · ${n.dang.length} loose wire end(s) (${n.dang.filter(d => d.nk >= 0).length} with a gap to a nearby wire) — use Wire fix`
      : '') +
    (tm > 0 ? ` · ${tm} timer label(s) without a detected symbol (not simulated)` : '')
  );
}

/* ---------- live color, wire fix ---------- */
const J = o => JSON.stringify(o, (k, v) => (k === 'nl' ? undefined : v));
const LIVES = { Red: '#ff4d4d', Yellow: '#ffe14a', Blue: '#4da3ff', Magenta: '#ff4dd2', Green: '#8dffb8' };
let LIVE = 'Red',
  WT = false,
  PEND = null,
  HOVN = -1,
  HFIX = -1,
  NC = true;
try {
  const v = localStorage.getItem('ditl.live');
  if (LIVES[v]) LIVE = v;
} catch (e) {}
function setLive() {
  const c = LIVES[LIVE],
    h = c.slice(1),
    rgb = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)).join(',');
  document.documentElement.style.setProperty('--live', c);
  document.documentElement.style.setProperty('--lives', `rgba(${rgb},.32)`);
  try {
    localStorage.setItem('ditl.live', LIVE);
  } catch (e) {}
}
for (const k in LIVES) {
  const o = document.createElement('option');
  o.value = k;
  o.textContent = 'Live: ' + k;
  $('slive').appendChild(o);
}
$('slive').value = LIVE;
setLive();
$('slive').onchange = e => {
  LIVE = e.target.value;
  setLive();
  render();
};
function nearSeg(nl, x, y, t) {
  let b = null;
  for (const q of nl.segs) {
    const d = Math.hypot(Math.max(q.x1 - x, 0, x - q.x2), Math.max(q.y1 - y, 0, y - q.y2));
    if (d < t && (!b || d < b.d)) b = { d, q };
  }
  return b && b.q;
}
function gOf(nl, p) {
  return p.gt
    ? nl.gates.find(
        q =>
          q.t === p.gt &&
          Math.abs((q.box.x1 + q.box.x2) / 2 - p.gx) < 2 &&
          Math.abs((q.box.y1 + q.box.y2) / 2 - p.gy) < 2
      )
    : nl.gates[p.g];
}
function fixLoad() {
  try {
    return JSON.parse(localStorage.getItem('ditl.fixes') || '{}');
  } catch (e) {
    return {};
  }
}
function fixSave(s) {
  try {
    const f = fixLoad(),
      has = (s.links && s.links.length) || (s.pins && s.pins.length);
    if (!has && !(s.name in f)) return;
    f[s.name] = { links: s.links || [], pins: s.pins || [] };
    localStorage.setItem('ditl.fixes', JSON.stringify(f));
  } catch (e) {}
}
const PK = { in: 'input', out: 'output', s: 'S input', r: 'R input' };
function wl(s, q) {
  const y = (q.y1 + q.y2) / 2,
    i = s.rows.findIndex(r => y >= r.y - 3.3 && y < r.y + 5.7);
  return (i >= 0 ? 'row ' + s.rows[i].n + ' ' : '') + 'x' + Math.round((q.x1 + q.x2) / 2);
}
function fixMk(s) {
  const nl = s.nl,
    sk = {};
  nl.segs.forEach(q => (sk[q.k] = q));
  const mid = q => [(q.x1 + q.x2) / 2, (q.y1 + q.y2) / 2],
    out = [];
  (s.links || []).forEach((l, i) => {
    const p = sk[l[0]],
      q = sk[l[1]];
    if (!p || !q) {
      out.push({ t: 'l', i, stale: true, txt: 'Stale join (wire not found)' });
      return;
    }
    const a = l.length >= 6 ? [l[2], l[3]] : mid(p),
      b = l.length >= 6 ? [l[4], l[5]] : mid(q);
    out.push({
      t: 'l',
      i,
      x1: a[0],
      y1: a[1],
      x2: b[0],
      y2: b[1],
      x: (a[0] + b[0]) / 2,
      y: (a[1] + b[1]) / 2,
      txt: 'Join ' + wl(s, p) + ' ↔ ' + wl(s, q)
    });
  });
  (s.pins || []).forEach((p, i) => {
    const g = gOf(nl, p),
      q = sk[p.k];
    if (!g || !q) {
      out.push({ t: 'p', i, stale: true, txt: 'Stale pin (gate/wire not found)' });
      return;
    }
    const a = p.px !== undefined ? [p.px, p.py] : mid(q),
      b = [(g.box.x1 + g.box.x2) / 2, (g.box.y1 + g.box.y2) / 2];
    out.push({
      t: 'p',
      i,
      x1: a[0],
      y1: a[1],
      x2: b[0],
      y2: b[1],
      x: (a[0] + b[0]) / 2,
      y: (a[1] + b[1]) / 2,
      txt: g.t + ' ' + PK[p.kind] + ' ← ' + wl(s, q)
    });
  });
  return out;
}
