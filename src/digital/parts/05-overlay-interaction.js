/* DITL (digital logic) - Overlays, wire click, mouse / touch handling. Part of ONE script (joined by src/digital/order.list, in this order). */
function drawOv() {
  const o = $('ov'),
    s = cur();
  if (!o) return;
  o.innerHTML = '';
  if (!s || SIM || !WT || !s.nl) return;
  const nl = s.nl,
    nc = n => `hsl(${(n * 137.5) % 360} 85% 62%)`;
  const ln = (q, c, w, op) =>
    el(
      'line',
      {
        x1: q.x1,
        y1: -q.y1,
        x2: q.x2,
        y2: -q.y2,
        stroke: c,
        'stroke-width': w,
        'stroke-linecap': 'round',
        opacity: op
      },
      o
    );
  if (NC) nl.segs.forEach(q => ln(q, nc(q.n), 0.9, 0.9));
  nl.dots.forEach(d =>
    el('circle', { cx: d.x, cy: -d.y, r: 1.1, fill: '#fff', stroke: '#000', 'stroke-width': 0.2 }, o)
  );
  nl.gates.forEach(g => {
    g.pp.forEach(p =>
      el('circle', { cx: p.x, cy: -p.y, r: 0.9, fill: nc(p.n), stroke: '#fff', 'stroke-width': 0.3 }, o)
    );
    if (!g.miss.length) return;
    const b = g.box;
    el(
      'rect',
      {
        x: b.x1 - 1,
        y: -b.y2 - 1,
        width: b.x2 - b.x1 + 2,
        height: b.y2 - b.y1 + 2,
        fill: 'rgba(255,154,46,.08)',
        stroke: '#ff9a2e',
        'stroke-width': 0.5,
        'stroke-dasharray': '1.5 1'
      },
      o
    );
    el('text', { x: b.x1 - 1, y: -b.y2 - 1.6, 'font-size': 2.6, fill: '#ff9a2e' }, o).textContent =
      'missing: ' + g.miss.join(', ');
  });
  nl.dang.forEach(d => {
    const gap = d.nk >= 0;
    if (gap)
      el(
        'line',
        { x1: d.x, y1: -d.y, x2: d.nx, y2: -d.ny, stroke: '#ffe14a', 'stroke-width': 0.4, 'stroke-dasharray': '.8 .6' },
        o
      );
    el(
      'circle',
      { cx: d.x, cy: -d.y, r: 1.3, fill: 'none', stroke: gap ? '#ffe14a' : '#ff4d4d', 'stroke-width': 0.5 },
      o
    );
  });
  fixMk(s).forEach((m, i) => {
    if (m.stale) return;
    const hot = i === HFIX;
    el(
      'line',
      {
        x1: m.x1,
        y1: -m.y1,
        x2: m.x2,
        y2: -m.y2,
        stroke: hot ? '#fff' : '#38c9ff',
        'stroke-width': hot ? 0.8 : 0.45,
        'stroke-dasharray': '1 1'
      },
      o
    );
    el(
      'circle',
      { cx: m.x, cy: -m.y, r: 1.5, fill: hot ? '#fff' : '#38c9ff', stroke: '#0f1418', 'stroke-width': 0.3 },
      o
    );
    el(
      'text',
      { x: m.x, y: -m.y, 'font-size': 2.2, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#0f1418' },
      o
    ).textContent = '×';
  });
  if (HOVN >= 0)
    nl.segs.forEach(q => {
      if (q.n === HOVN) ln(q, '#fff', 1.3);
    });
  if (PEND) {
    if (PEND.t === 's')
      nl.segs.forEach(q => {
        if (q.n === PEND.n) ln(q, '#ff4dd2', 1.3);
      });
    else {
      const b = nl.gates[PEND.gi].box;
      el(
        'rect',
        {
          x: b.x1 - 1,
          y: -b.y2 - 1,
          width: b.x2 - b.x1 + 2,
          height: b.y2 - b.y1 + 2,
          fill: 'none',
          stroke: '#ff4dd2',
          'stroke-width': 0.8
        },
        o
      );
    }
  }
}
function updatePanel() {
  const p = $('wp'),
    s = cur();
  p.hidden = !(WT && !SIM && s && s.nl);
  if (p.hidden) return;
  const nl = s.nl,
    mk = fixMk(s);
  $('wsum').textContent =
    `${nl.n} nets · ${nl.dots.length} junction dots · ${nl.gates.filter(g => g.miss.length).length} gate(s) missing pins · ${nl.dang.length} loose end(s)`;
  const L = $('wlist');
  L.innerHTML = '';
  if (!mk.length) {
    L.textContent = 'No manual fixes yet.';
    return;
  }
  mk.forEach((m, i) => {
    const d = document.createElement('div'),
      t = document.createElement('span'),
      b = document.createElement('button');
    d.className = 'r';
    t.textContent = m.txt;
    b.textContent = '✕';
    b.title = 'Delete this fix';
    d.onmouseenter = () => {
      HFIX = i;
      drawOv();
    };
    d.onmouseleave = () => {
      HFIX = -1;
      drawOv();
    };
    b.onclick = () => delFix(m);
    d.append(t, b);
    L.appendChild(d);
  });
}
function delFix(m) {
  const s = cur();
  push();
  (m.t === 'l' ? s.links : s.pins).splice(m.i, 1);
  HFIX = -1;
  rebuild(s);
  msg('Fix deleted (Ctrl+Z to undo).');
}
function rebuild(s) {
  s.nl = netlist(s);
  render();
}
function pinKind(g, q) {
  const cx = (g.box.x1 + g.box.x2) / 2,
    cy = (g.box.y1 + g.box.y2) / 2,
    ex = q.h ? (Math.abs(q.x1 - cx) < Math.abs(q.x2 - cx) ? q.x1 : q.x2) : q.x1,
    ey = q.y1;
  if (g.rev ? ex < cx : ex >= cx) return 'out';
  return g.t === 'FF' ? (ey > cy ? 's' : 'r') : 'in';
}
function wireClick(e) {
  const s = cur();
  if (!s || !s.nl) return;
  const [x, y] = xy(e),
    nl = s.nl,
    mk = fixMk(s);
  const m = mk.find(m => !m.stale && Math.hypot(m.x - x, m.y - y) < 1.8);
  if (m) {
    delFix(m);
    return;
  }
  const d = nl.dang.find(d => d.nk >= 0 && Math.hypot(d.x - x, d.y - y) < 1.8);
  if (d) {
    push();
    (s.links = s.links || []).push([d.k, d.nk, d.x, d.y, d.nx, d.ny]);
    PEND = null;
    rebuild(s);
    msg('Gap connected.');
    return;
  }
  const sg = nearSeg(nl, x, y, 1),
    snap = q => ({ px: Math.min(Math.max(x, q.x1), q.x2), py: Math.min(Math.max(y, q.y1), q.y2) });
  let pk = null;
  if (sg) pk = { t: 's', k: sg.k, seg: sg, n: sg.n, ...snap(sg) };
  else {
    const gi = nl.gates.findIndex(
      g => x >= g.box.x1 - 2 && x <= g.box.x2 + 2 && y >= g.box.y1 - 1 && y <= g.box.y2 + 1
    );
    if (gi >= 0) pk = { t: 'g', gi };
  }
  if (!pk) {
    PEND = null;
    drawOv();
    return;
  }
  if (!PEND) {
    PEND = pk;
    drawOv();
    return;
  }
  const a = PEND,
    b = pk;
  PEND = null;
  if (a.t === 's' && b.t === 's') {
    if (a.n === b.n) {
      drawOv();
      msg('Those two wires are already in the same net.');
      return;
    }
    push();
    (s.links = s.links || []).push([a.k, b.k, a.px, a.py, b.px, b.py]);
    rebuild(s);
    msg('Wires joined.');
  } else if (a.t === 'g' && b.t === 'g') drawOv();
  else {
    const gi = a.t === 'g' ? a.gi : b.gi,
      w = a.t === 's' ? a : b,
      g = nl.gates[gi],
      kind = pinKind(g, w.seg);
    push();
    (s.pins = s.pins || []).push({
      gt: g.t,
      gx: (g.box.x1 + g.box.x2) / 2,
      gy: (g.box.y1 + g.box.y2) / 2,
      kind,
      k: w.k,
      px: w.px,
      py: w.py
    });
    rebuild(s);
    msg('Wire attached to ' + g.t + ' as ' + PK[kind] + '.');
  }
}
$('bwire').onclick = () => {
  if (SIM || !cur()) return;
  WT = !WT;
  PEND = null;
  HOVN = -1;
  render();
  const n = cur().nl;
  if (WT)
    msg(
      `Wire fix: wires are colored per net (same color = connected). ${n.gates.filter(g => g.miss.length).length} gate(s) with missing pins (orange box), ${n.dang.length} loose end(s): yellow ring = gap to a nearby wire (click it to connect), red ring = nothing nearby.`
    );
};
$('bfix').onclick = () => {
  const s = cur();
  if (!s || !((s.links && s.links.length) || (s.pins && s.pins.length))) return;
  push();
  s.links = [];
  s.pins = [];
  PEND = null;
  rebuild(s);
  msg('All manual wire fixes cleared for this sheet.');
};
$('wnc').onchange = e => {
  NC = e.target.checked;
  drawOv();
};
$('wsave').onclick = () => {
  const s = cur();
  if (s) fixSave(s);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(fixLoad(), null, 1)], { type: 'application/json' }));
  a.download = 'ditl-wire-fixes.json';
  a.click();
  msg(
    'Wire fixes saved to file. They are also kept in this browser and re-applied automatically when you import a DXF with the same name.'
  );
};
$('wload').onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const j = JSON.parse(await f.text()),
      st = fixLoad();
    Object.assign(st, j);
    localStorage.setItem('ditl.fixes', JSON.stringify(st));
    push();
    let c = 0;
    S.sheets.forEach(x => {
      if (j[x.name]) {
        x.links = j[x.name].links || [];
        x.pins = j[x.name].pins || [];
        x.nl = null;
        c++;
      }
    });
    render();
    msg(c + ' sheet(s) updated from file.');
  } catch (x) {
    msg('Invalid fixes file.');
  }
  e.target.value = '';
};
/* the timers, motors, flow dampers, inverters and motor-operated valves (UN ... mvStep): parts/03b-sim.js */
function mvTxt(s, j) {
  const r = mvRT(s)[j],
    f = mvFlags(s, j, simIn(s));
  if (s.nl.mv[j].noZS)
    return s.nl._v && s.nl._v[s.nl.mv[j].open.n] ? 'SV COIL ENERGIZED (DCS output ON)' : 'SV coil de-energized';
  return (
    (s.nl.mv[j].sv ? 'SV ' : 'ZT ') +
    Math.round(r.pos) +
    '% · ' +
    (r.run > 0 ? 'OPENING' : r.run < 0 ? 'CLOSING' : r.pos >= 100 ? 'OPEN' : r.pos <= 0 ? 'CLOSED' : 'STOPPED') +
    (f.trip ? ' · TRIPPED' : '') +
    (f.rem ? '' : ' · LOCAL (DCS command ignored)')
  );
}
function mvUI(s) {
  (s.nl.an || []).forEach((a, k) => {
    const e = $('anst' + k);
    if (!e) return;
    const v = anVal(s, a);
    e.textContent = SIM
      ? a.g
          .map(i => {
            const g = s.nl.gates[i];
            return (
              (g.cmp === '>' ? 'H ' : 'L ') +
              g.cmp +
              (g.eq ? '=' : '') +
              (g.spNet !== undefined ? g.spVar : g.sp) +
              (cmpOn(s, g) ? ' ON' : ' off')
            );
          })
          .join(' · ')
      : '';
    e.className = 'v';
  });
  const me = $('motst');
  if (me && SIM) me.textContent = motTxt(s);
  ((s.nl && s.nl.mv) || []).forEach((b, j) => {
    const r = mvRT(s)[j],
      t = $('mvzt' + j),
      bar = $('mvzb' + j),
      e = $('mvs' + j);
    if (t) t.textContent = Math.round(r.pos) + '%';
    if (bar) bar.setAttribute('width', ((bar.dataset.w * r.pos) / 100).toFixed(2));
    if (e) {
      e.textContent = SIM ? mvTxt(s, j) : '';
      e.className = 'v' + (SIM && r.run ? ' hi' : '');
    }
  });
}
/* KN: parts/03b-sim.js */
function tmList() {
  const s = cur();
  return s && s.nl ? s.nl.gates.filter(g => g.t === 'TMR') : [];
}
/* ---------- v22 left sheet pane (replaces the wrapped tab buttons) ---------- */
/* v27: values the user typed (timers, analog values, MOV travel, motor delay, pulse times) are kept in localStorage 'ditl.uv' per sheet name and re-applied when the sheet is shown */
let UVL = {};
try {
  UVL = JSON.parse(localStorage.getItem('ditl.uv') || '{}') || {};
} catch (e) {
  UVL = {};
}
let UVKEY = JSON.stringify(UVL);
/* tmKey: parts/03e-user.js. 3.2.0 Web Worker: the kept values go in as an engine action (ditlUser 'uv'), the engine has no localStorage */
function uvApply(s) {
  if (!s || s.uvDone || !s.nl) return;
  s.uvDone = true;
  const u = UVL[s.name];
  if (!u) return;
  ditlUser(s.name, 'uv', u);
}
/* the engine started from a keyframe (a worker that starts later): the kept values of the sheets already shown go to it again */
function uvReplay() {
  S.sheets.forEach(s => s.uvDone && UVL[s.name] && ditlUser(s.name, 'uv', UVL[s.name]));
}
function uvSave() {
  const o = { ...UVL };
  S.sheets.forEach(s => {
    if (!s.uvDone) return;
    /* not applied yet: keep what is stored */ const u = {};
    if (s.av && Object.keys(s.av).length) u.av = s.av;
    if (s.mvt && Object.keys(s.mvt).length) u.mvt = s.mvt;
    if (s.pdur && Object.keys(s.pdur).length) u.pdur = s.pdur;
    if (s.mtd) u.mtd = s.mtd;
    if (s.tmo && Object.keys(s.tmo).length) u.tmo = s.tmo;
    if (Object.keys(u).length) o[s.name] = u;
    else delete o[s.name];
  });
  const j = JSON.stringify(o);
  if (j !== UVKEY) {
    UVKEY = j;
    UVL = o;
    try {
      localStorage.setItem('ditl.uv', j);
    } catch (e) {}
  }
}
/* 2.5.0-beta.11: the system of a DITL sheet, from its number (contents sheets DITL-0A ~ 0D and the sheet titles) */
const DITL_CATS = [
  'CONTENTS',
  'FURNACE PURGE / MFT / BOILER TRIP',
  'BURNER / IGNITER',
  'COAL FEEDER',
  'FANS (IDF / PAF / SAF / FAB)',
  'BOILER FEED WATER PUMP',
  'SPRAY WATER VALVES',
  'BOTTOM ASH SCREW COOLER',
  'AIR PREHEATER',
  'ALARM / ANNUNCIATOR',
  'MOTOR VALVE / OVERTIME',
  'MAIN / REHEAT STEAM DRAINS',
  'AUXILIARY STEAM',
  'EXTRACTION STEAM',
  'CONDENSATE',
  'VENT AND DRAIN',
  'AUX. COOLING WATER',
  'SEAWATER / CONDENSER CLEANING',
  'WATER SYSTEMS (INDUSTRIAL / POTABLE / WASTE)',
  'DIESEL OIL',
  'AIR SYSTEM (DRYER / COMPRESSORS)',
  'TURBINE INTERFACE',
  'SOOTBLOWER',
  'BOTTOM ASH HD600 / CONVEYORS',
  'LIMESTONE INJECTION (ROTOFEED)',
  'SAND INJECTION (SD1300)'
];
function ditlCat(x) {
  if (isSB(x)) return 'SOOTBLOWER';
  if (/^\(B\d+\)/.test(x.name || '')) return 'BOTTOM ASH HD600 / CONVEYORS'; /* 2.5.0-beta.14 */
  if (/^\(L\d+\)/.test(x.name || '')) return 'LIMESTONE INJECTION (ROTOFEED)'; /* 2.5.0-beta.15 */
  if (/^\(D\d+\)/.test(x.name || '')) return 'SAND INJECTION (SD1300)'; /* 3.2.0-beta.39 (+ sand) */
  const m = /DITL-(\d+)([A-Z]?)$/i.exec(x.name || '');
  if (!m) return /DITL-0[A-D]$/i.test(x.name || '') ? 'CONTENTS' : 'OTHER';
  const n = +m[1],
    c = DITL_CATS;
  if (/DITL-0[A-D]$/i.test(x.name)) return c[0];
  if (n <= 6) return c[1];
  if (n <= 18) return c[2];
  if (n <= 20) return c[3];
  if (n === 21 || n === 117 || n === 118) return c[7];
  if (n === 22 || n === 23) return c[5];
  if (n >= 24 && n <= 28) return c[4];
  if (n === 29 || n === 30 || n === 39 || n === 119) return c[17];
  if (n === 31) return c[19];
  if ((n >= 32 && n <= 35) || n === 79) return c[6];
  if (n === 36 || n === 37 || (n >= 40 && n <= 42)) return c[9];
  if (n === 38 || n === 50) return c[10];
  if (n === 43 || n === 44) return c[8];
  if (n === 45 || n === 113 || n === 114) return c[20];
  if ((n >= 51 && n <= 55) || n === 116) return c[12];
  if (n === 56 || n === 57) return c[15];
  if (n >= 60 && n <= 72) return c[14];
  if ((n >= 73 && n <= 75) || (n >= 79 && n <= 83) || n === 88 || n === 89 || n === 121) return c[11];
  if (n >= 76 && n <= 78) return c[16];
  if (n >= 94 && n <= 110) return c[13];
  if (n === 86 || n === 87 || n === 92 || n === 93 || n === 111 || n === 112 || n === 120) return c[18];
  if (n === 115) return c[21];
  return 'OTHER';
}
let SIDEKEY = '',
  SIDEFL = '',
  SIDEMIN = null,
  SIDESM = 'cat';
try {
  SIDEMIN = localStorage.getItem('ditl.side');
  if (localStorage.getItem('ditl.sm') === 'order') SIDESM = 'order';
} catch (e) {}
if (SIDEMIN === null) SIDEMIN = innerWidth < 820 ? '1' : '0';
/* 2.5.0-beta.16 (user: "dapat pg by category, collapsible ang group title"): a category title of the sheet list (DITL and ABC) opens /
   closes its group; the choice is kept (localStorage `key`). First time: only the group of the open sheet is open. While searching
   every group with a hit is open. */
function sideGrp(list, key, name, n, isCur, filt) {
  let st = null;
  try {
    st = JSON.parse(localStorage.getItem(key) || 'null');
  } catch (e) {}
  const col = filt ? false : st ? !!st[name] : !isCur,
    h = document.createElement('div'),
    body = document.createElement('div');
  h.className = 'fh fhc';
  h.dataset.g = name;
  h.title = 'Click to open / close this group';
  const paint = c => (h.textContent = (c ? '▸ ' : '▾ ') + name + ' (' + n + ')');
  paint(col);
  body.className = 'grp';
  body.style.display = col ? 'none' : '';
  h.onclick = () => {
    let o = null;
    try {
      o = JSON.parse(localStorage.getItem(key) || 'null');
    } catch (e) {}
    if (!o) {
      o = {};
      list.querySelectorAll('.fhc').forEach(x => {
        if (x.nextSibling && x.nextSibling.style.display === 'none') o[x.dataset.g] = 1;
      });
    }
    const c = body.style.display !== 'none';
    if (c) o[name] = 1;
    else delete o[name];
    body.style.display = c ? 'none' : '';
    paint(c);
    try {
      localStorage.setItem(key, JSON.stringify(o));
    } catch (e) {}
  };
  list.appendChild(h);
  list.appendChild(body);
  return body;
}
/* the group of the sheet just opened (page link, search, ◀ ▶) is shown, without changing the kept choice */
function sideShow(b) {
  const g = b && b.parentNode;
  if (!g || !g.classList.contains('grp') || g.style.display !== 'none') return;
  g.style.display = '';
  const h = g.previousSibling;
  if (h && h.classList.contains('fhc')) h.textContent = '▾' + h.textContent.slice(1);
}
function drawSide() {
  const sd = $('side'),
    list = $('sidelist');
  if (!sd) return;
  sd.classList.toggle('min', SIDEMIN === '1');
  $('sidetg').textContent = SIDEMIN === '1' ? '▶' : '◀';
  const cn = S.sheets[S.cur] ? S.sheets[S.cur].name : '';
  $('sidect').textContent = 'Sheets (' + S.sheets.length + ')';
  $('sidevt').textContent = cn ? cn + '  ·  ' + (S.cur + 1) + '/' + S.sheets.length : 'Sheets';
  /* 2.5.0-beta.13 (user: "sa left pane, wala ang option na by order/category"): By order / By category as the ABC sheet list */
  let so = $('dsort');
  if (!so) {
    so = document.createElement('div');
    so.id = 'dsort';
    [
      ['order', 'By order', 'One list in sheet order (DITL-0A, 01, 02, 03A ... then the sootblower set)'],
      ['cat', 'By category', 'Grouped by system, each group in order']
    ].forEach(([m, t, ti]) => {
      const b = document.createElement('button');
      b.dataset.m = m;
      b.textContent = t;
      b.title = ti;
      b.onclick = () => {
        SIDESM = m;
        try {
          localStorage.setItem('ditl.sm', m);
        } catch (e) {}
        drawSide();
      };
      so.appendChild(b);
    });
    $('sidebody').insertBefore(so, $('sidefl'));
  }
  so.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === SIDESM));
  const key = S.sheets.map(x => x.name + (x.bv !== BV ? '!' : '')).join('|') + '#' + SIDEFL + '#' + SIDESM;
  if (key !== SIDEKEY) {
    SIDEKEY = key;
    list.innerHTML = '';
    const f = SIDEFL.trim().toLowerCase(),
      G = {};
    /* 2.5.0-beta.11 (user: "DAPAT BY CATEGORY DIN ANG SHEET LIST SA DITL"): grouped by system, as the ABC list (category headers in
       the order of the contents sheets DITL-0A ~ 0D); the search still filters by name and title */
    S.sheets.forEach((x, i) => {
      if (f && (x.name + ' ' + (x.title || '') + ' ' + ditlCat(x)).toLowerCase().indexOf(f) < 0) return;
      if (SIDESM === 'order') return sideBtn(x, i, list);
      (G[ditlCat(x)] = G[ditlCat(x)] || []).push(i);
    });
    if (SIDESM !== 'order') DITL_CATS.concat(Object.keys(G).filter(k => !DITL_CATS.includes(k))).forEach(c => {
      if (!G[c]) return;
      const body = sideGrp(list, 'ditl.cc', c, G[c].length, G[c].includes(S.cur), !!f);
      G[c].forEach(i => sideBtn(S.sheets[i], i, body));
    });
    function sideBtn(x, i, box) {
      const b = document.createElement('button');
      b.dataset.i = i;
      const l1 = document.createElement('span');
      l1.className = 'sn';
      l1.textContent = (x.bv !== BV ? '⚠ ' : '') + x.name;
      b.appendChild(l1);
      if (x.title) {
        const l2 = document.createElement('span');
        l2.className = 'st';
        l2.textContent = x.title;
        b.appendChild(l2);
      }
      b.title =
        x.bv !== BV
          ? 'Imported with an older version: import this DXF again (same name replaces it)'
          : x.name + (x.title ? ' - ' + x.title : '');
      b.onclick = () => {
        S.cur = i;
        sel = null;
        if (innerWidth < 820) {
          SIDEMIN = '1';
          try {
            localStorage.setItem('ditl.side', '1');
          } catch (e) {}
        }
        render();
      };
      box.appendChild(b);
    }
  }
  let on = null;
  list.querySelectorAll('button').forEach(b => {
    const o = +b.dataset.i === S.cur;
    if (o !== b.classList.contains('on')) b.classList.toggle('on', o);
    if (o) on = b;
  });
  if (on && drawSide.last !== S.cur) sideShow(on);
  if (on && SIDEMIN !== '1' && drawSide.last !== S.cur) {
    on.scrollIntoView({ block: 'nearest' });
  }
  drawSide.last = S.cur;
}
{
  const tg = document.getElementById('sidetg');
  if (tg)
    tg.onclick = () => {
      SIDEMIN = SIDEMIN === '1' ? '0' : '1';
      try {
        localStorage.setItem('ditl.side', SIDEMIN);
      } catch (e) {}
      drawSide();
      render();
    };
  const fl = document.getElementById('sidefl');
  if (fl)
    fl.oninput = () => {
      SIDEFL = fl.value;
      drawSide();
    };
}
let TPMIN = innerWidth < 820;
