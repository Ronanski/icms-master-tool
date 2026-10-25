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
/* ---------- timers ---------- */
const UN = { MS: 0.001, SEC: 1, MIN: 60, HR: 3600 },
  UT = { MS: 'MS', SEC: 'SEC.', MIN: 'MIN.', HR: 'HR.' };
let TSP = 1;
const tick = { t: 0 };
function unorm(s) {
  const u = s.replace(/[.\s]/g, '').toUpperCase();
  return u === 'MS'
    ? 'MS'
    : /^S(EC(OND)?)?S?$/.test(u)
      ? 'SEC'
      : /^M(IN(UTE)?)?S?$/.test(u)
        ? 'MIN'
        : /^H(R|OUR)?S?$/.test(u)
          ? 'HR'
          : null;
}
function tmGet(m) {
  let v = NaN,
    u = null;
  if (m.nt && m.nt === m.ut) {
    const x = /^(\d+(?:\.\d+)?)\s*([A-Za-z.]+)$/.exec(m.nt.t);
    if (x) {
      v = +x[1];
      u = unorm(x[2]);
    }
  } else {
    if (m.nt) v = +m.nt.t;
    if (m.ut) u = unorm(m.ut.t);
  }
  if (!isFinite(v) && m.fv) return m.fv;
  return { v: isFinite(v) ? v : 5, u: u || 'SEC' };
}
function tmSet(m, v, u) {
  const t = UT[u];
  if (!m.nt) {
    m.fv = { v, u };
    return;
  }
  if (m.nt === m.ut) m.nt.t = v + ' ' + t;
  else {
    m.nt.t = String(v);
    if (m.ut) m.ut.t = t;
  }
}
const tmSecs = m => {
  const p = tmGet(m);
  return p.v * UN[p.u];
};
/* 3.2.0-beta.23: a short timer counting, a valve / device moving or a motor changing in this scan: the one world takes small steps of
   time while it lasts (src/world/world.js), so a sequence of seconds (burner light-off) is not jumped over at x300 */
let TMBUSY = false;
function tmStep(g, inp, dt) {
  const st = g.st,
    P = tmSecs(g.tm),
    was = st.out;
  if (P > 0 && P <= 30 && ((g.k === 'on' && inp && st.acc < P) || (g.k === 'off' && !inp && st.out) || st.run)) TMBUSY = true;
  if (g.k === 'on') {
    if (inp) {
      st.acc = Math.min(st.acc + dt, P);
      st.out = st.acc >= P ? 1 : 0;
    } else {
      st.acc = 0;
      st.out = 0;
    }
  } else if (g.k === 'off') {
    if (inp) {
      st.out = 1;
      st.acc = 0;
    } else if (st.out) {
      st.acc += dt;
      if (st.acc >= P) {
        st.out = 0;
        st.acc = 0;
      }
    }
  } else if (g.k === 'flash') {
    /* 2.5.0-beta.14 bottom ash flasher: ON / OFF while the input is 1 */
    if (inp) {
      st.acc = (st.acc + dt) % (g.fl[0] + g.fl[1]);
      st.out = st.acc < g.fl[0] ? 1 : 0;
    } else {
      st.acc = 0;
      st.out = 0;
    }
  } else if (g.nc) {
    st.out = inp ? 1 : 0;
  } else if (g.ncp) {
    st.out = inp ? 0 : 1; /* 2.5.0-beta.11: N.C. stop button of an MCC seal-in: open (0) only while pressed */
  } else {
    const trg = g.k === 'npulse' ? !inp && st.pre : inp && !st.pre;
    /* 3.2.0-beta.23: a pulse is 1 for at least the scan that starts it (a fast simulation steps 60 s in one scan: a 2 s pulse began
       and ended inside it and the start command never came, Training at x300) */
    const now = trg && !st.run;
    if (now) {
      st.run = 1;
      st.acc = 0;
    }
    if (st.run && !now) {
      st.acc += dt;
      if (st.acc >= P) {
        st.run = 0;
        st.acc = 0;
      }
    }
    st.out = st.run ? 1 : 0;
  }
  st.pre = inp ? 1 : 0;
  return st.out !== was;
}
/* v9 MOV runtime: valve position 0..100 %, starts CLOSED. OPEN command -> runs to 100 %, CLOSE -> runs to 0 % (sealed in, so a pulse command is enough).
 Both commands = stop. Trip (MIT input ON) = motor stops. LOCAL (MIL off) = DCS commands ignored. ZSO = 100 %, ZSC = 0 %; a left input with the same address follows it. */
let MST = {},
  MS = {};
function motRT(s) {
  const mt = (s.nl && s.nl.mot) || [];
  let r = MS[s.name];
  if (!r || r.length !== mt.length) r = MS[s.name] = mt.map(() => ({ run: 0, acc: 0 }));
  return r;
}
function mtDelay(s) {
  const v = s.mtd && +s.mtd;
  return v > 0 ? v : 0.5;
} /* contactor / drive feedback delay, 0.5 s (editable): a push button held ~0.6 s must be able to seal in through the running feedback */
function motStep(s, v, dt) {
  const mt = (s.nl && s.nl.mot) || [];
  if (!mt.length) return false;
  const r = motRT(s),
    md = mtDelay(s);
  let ch = false;
  mt.forEach((m, j) => {
    const t = !!v[m.mor],
      sp = m.mos >= 0 && !!v[m.mos],
      x = r[j];
    if (m.mos >= 0) {
      if (t && !x.pm) {
        x.tgt = 1;
        x.acc = 0;
      }
      if (sp && !x.ps) {
        x.tgt = 0;
        x.acc = 0;
      }
      x.pm = t;
      x.ps = sp;
      if (x.tgt === undefined) x.tgt = 0;
      if (!!x.tgt !== !!x.run) {
        x.acc += dt;
        if (x.acc >= md) {
          x.run = x.tgt;
          x.acc = 0;
          ch = true;
        }
      } else x.acc = 0;
    } else if (t !== !!x.run) {
      x.acc += dt;
      if (x.acc >= md) {
        x.run = t ? 1 : 0;
        x.acc = 0;
        ch = true;
      }
    } else x.acc = 0;
  });
  s.nl.fx = mt.filter((m, j) => r[j].run).map(m => m.mir);
  return ch;
}
/* 3.2.0-beta.23 FIELD DEVICES of the burner I/O sheets: the limit switches and flame scanner contacts drawn there as field contacts
   (the small circles, s.usw) follow the DCS command like the real device. DITL-16: burner gun double solenoid SVR / SVE-DO1043-A5
   (row 2 RETRACT, row 4 INSERT -> ZSR / ZSE-A5), igniter single solenoid SVR-DO1043-A4 (row 6 INSERT -> ZSE / ZSR-A4), oil valve (2)
   SV-DO1043-A2 (row 23 -> ZSO / ZSC-A2; valve (1) is the SV block of the sheet). DITL-18: igniter transformer O.0090 (row 24) ->
   BI8 IGNITER IN OPERATION; BI9 FLAME DETECTOR ON = oil flows (both oil valves OPENED, DITL-16 of the same burner) and the igniter
   sparks or the flame is already on; BI10 FLAME DETECTOR READY at rest. Burner B / C / D = the machine instances of the one world.
   A contact is written only when the device moves, so a contact the operator toggles by hand stays until the next command */
const FD = {
  'DITL-16': [
    { on: 3, off: 1, e: 'FIZSE-DO1043-A5', r: 'FIZSR-DO1043-A5', t: 10 },
    { hold: 5, e: 'FIZSE-DO1043-A4', r: 'FIZSR-DO1043-A4', t: 5 },
    { hold: 22, e: 'FIZSO-DO1043-A2', r: 'FIZSC-DO1043-A2', t: 3 }
  ],
  'DITL-18': [{ hold: 23, e: 'FIBI8-DO1043-A', t: 1 }, { flame: 1, e: 'FIBI9-DO1043-A', t: 2 }, { rest: 1, e: 'FIBI10-DO1043-A' }]
};
function fdSheet(s, code) {
  const k = (s._inst && s._inst.k) || 0;
  const t = S.sheets.find(x => new RegExp('\\)' + code + '$').test(x.name));
  if (!t || k === 0 || !window.WORLD || !WORLD.instOf) return t;
  const L = WORLD.instOf.get(t);
  return (L && L[k]) || null;
}
function fdStep(s, dt) {
  const b = (s._inst && s._inst.base) || s,
    m = /(DITL-\d+[A-Z]?)$/.exec(b.name),
    L = m && FD[m[1]];
  if (!L) return false;
  s.usw = s.usw || {};
  const act = simIn(s),
    st = (s._fd = s._fd || {});
  let ch = false;
  L.forEach((d, j) => {
    const x = (st[j] = st[j] || { pos: d.rest ? 1 : 0, init: 0 });
    let want = x.pos;
    if (d.on != null) {
      if (act.has(d.on) && !act.has(d.off)) want = 1;
      else if (act.has(d.off) && !act.has(d.on)) want = 0;
    } else if (d.hold != null) want = act.has(d.hold) ? 1 : 0;
    else if (d.flame) {
      const v16 = fdSheet(s, 'DITL-16'),
        o = v16 && window.WORLD && WORLD.out && WORLD.out[v16.name],
        oil = !!(o && o.has(21) && o.has(23)),
        ign = !!(st[0] && st[0].pos >= 1);
      want = oil && (ign || x.pos >= 1) ? 1 : 0;
    }
    if (d.rest) want = 1;
    const tgt = want ? 1 : 0;
    if (tgt !== x.pos) {
      TMBUSY = true;
      x.acc = (x.acc || 0) + dt;
      if (x.acc >= (d.t || 0) || !x.init) {
        x.pos = tgt;
        x.acc = 0;
      }
    } else x.acc = 0;
    const se = x.pos >= 1,
      sr = x.pos <= 0;
    if (!x.init || x.se !== se) {
      s.usw[d.e] = se;
      if (d.r) s.usw[d.r] = sr;
      x.se = se;
      ch = true;
    }
    x.init = 1;
  });
  return ch;
}
function motTxt(s) {
  const mt = s.nl.mot || [],
    r = motRT(s);
  return mt
    .map(
      (m, j) =>
        'MOT ' +
        m.tag +
        ': ' +
        (r[j].run ? 'RUNNING' : 'STOPPED') +
        ((m.mos < 0 && !!r[j].run !== !!simulate(s.nl, simIn(s))[m.mor]) || (m.mos >= 0 && !!r[j].tgt !== !!r[j].run)
          ? ' (changing…)'
          : '')
    )
    .join(' | ');
}
function mvRT(s) {
  const mv = (s.nl && s.nl.mv) || [];
  let r = MST[s.name];
  if (!r || r.length !== mv.length)
    r = MST[s.name] = mv.map(b => ({ pos: b.sv && b.dir === 'close' ? 100 : 0, run: 0, lr: 1, tq: 0 }));
  return r;
}
function mvTr(s, j) {
  const v = s.mvt && +s.mvt[j];
  return v > 0 ? v : s.nl.mv[j] && s.nl.mv[j].sv ? 3 : 10;
}
function mvForced(s) {
  const F = new Map(),
    mv = (s.nl && s.nl.mv) || [];
  if (!mv.length) return F;
  const rt = mvRT(s);
  mv.forEach((b, j) =>
    b.fb.forEach(f => {
      if ((f.ty === 'ZSO' || f.ty === 'ZSC') && f.mir >= 0)
        F.set(f.mir, f.ty === 'ZSO' ? rt[j].pos >= 100 : rt[j].pos <= 0);
    })
  );
  return F;
}
function grpState(s) {
  const m = new Map(),
    /* one world (2.2.0-beta.6): the master row can be fed by another sheet (FROM column); a reader that has its own FROM link follows that link */
    W = window.WORLD && WORLD.live && s._win,
    D = W && WORLD.idx && WORLD.idx.din.get(s);
  ((s.nl && s.nl.grp) || []).forEach(g => {
    const v = !!s.sig[g.master + ':S'] || !!(W && s._win.has(g.master));
    g.readers.forEach(r => {
      if (!(D && D.has(r.row))) m.set(r.row, r.inv ? !v : v);
    });
  });
  return m;
}
/* simulate mode: the DITL Simulate button, or the one world (ABC + DITL, src/world/world.js) while it runs */
function simOn() {
  return SIM || !!(window.WORLD && WORLD.live);
}
function simIn(s) {
  const sim = simOn(),
    on = new Set(),
    F = sim ? mvForced(s) : new Map(),
    GR = sim ? grpState(s) : new Map();
  /* one world: input rows driven by another DITL sheet (FROM column, e.g. 28A-77) or by the ABC (TO DITL) */
  if (sim && s._win) s._win.forEach(i => on.add(i));
  /* 3.2.0-beta.23: a normally closed push button (DITL-03F rows 25 / 26 BOILER EMERGENCY TRIP P.B.(1) / (2) (N.C.); the LCP contacts
     "NOT OFF P.B." / "NOT LOCAL STOP P.B." of DITL-09 rows 18 / 22 and DITL-21A row 25) is closed (1) while nobody presses it: a cold
     start had it 0 = pressed, the trip / OFF was ON for ever (the MFT could never be reset, a burner never lit). A press (or the
     operator's hand value) sets it 0 */
  if (!s._ncRows) {
    s._ncRows = [];
    for (let i = 0; i < (s.rows || []).length; i++) {
      const t = (s.cells[i + ':S'] || []).map(x => x.t).join(' ');
      if ((/N\.\s*C\./i.test(t) || /\bNOT\b.*\b(OFF|STOP)\b/i.test(t)) && /P\.\s*B|PUSH/i.test(t)) s._ncRows.push(i);
    }
  }
  for (const i of s._ncRows) if (s.sig[i + ':S'] === undefined) s.sig[i + ':S'] = true;
  for (const k in s.sig)
    if (s.sig[k] && k.split(':')[1] === 'S') {
      const i = +k.split(':')[0];
      if (!F.has(i) && !GR.has(i)) on.add(i);
    }
  GR.forEach((v, i) => {
    if (v) on.add(i);
  });
  F.forEach((v, i) => {
    if (v) on.add(i);
  });
  if (sim && s.nl && s.nl.mv && s.nl.mv.length) {
    const rt = mvRT(s);
    s.nl.mv.forEach((b, j) => {
      if (rt[j].tq)
        b.fb.forEach(f => {
          if (f.ty === 'TS' && f.mir >= 0) on.add(f.mir);
        });
    });
  }
  return on;
}
function mvOut(s, act) {
  const M = new Map(),
    mv = (s.nl && s.nl.mv) || [];
  if (!mv.length) return M;
  const rt = mvRT(s);
  mv.forEach((b, j) => {
    const r = rt[j];
    b.fb.forEach(f => {
      let v = 0;
      if (f.ty === 'ZSO') v = r.pos >= 100;
      else if (f.ty === 'ZSC') v = r.pos <= 0;
      else if (f.ty === 'MIL') v = f.mir >= 0 ? act.has(f.mir) : !!r.lr;
      else if (f.ty === 'MIT') v = f.mir >= 0 && act.has(f.mir);
      else if (f.ty === 'TS') v = (f.mir >= 0 && act.has(f.mir)) || r.tq;
      M.set(f.row, v ? 1 : 0);
    });
  });
  return M;
}
function mvFlags(s, j, act) {
  const b = s.nl.mv[j],
    r = mvRT(s)[j],
    mil = b.fb.find(f => f.ty === 'MIL');
  return {
    rem: !mil || (mil.mir >= 0 ? act.has(mil.mir) : !!r.lr),
    trip: b.fb.some(f => f.ty === 'MIT' && f.mir >= 0 && act.has(f.mir))
  };
}
function mvStep(s, v, dt) {
  const mv = (s.nl && s.nl.mv) || [];
  if (!mv.length) return false;
  const rt = mvRT(s),
    act = simIn(s);
  let ch = false;
  mv.forEach((b, j) => {
    const r = rt[j],
      o = !!(b.open && b.open.n >= 0 && v[b.open.n]),
      c = !!(b.close && b.close.n >= 0 && v[b.close.n]),
      { rem, trip } = mvFlags(s, j, act),
      st = x => (x >= 100 ? 2 : x <= 0 ? 0 : 1),
      s0 = st(r.pos),
      run0 = r.run;
    if (b.sv) {
      const cmd = b.inv ? !o : o,
        wantOpen = b.dir === 'close' ? !cmd : cmd;
      if (!r.init) {
        r.init = 1;
        r.pos = wantOpen ? 100 : 0;
      }
      r.run = wantOpen ? (r.pos < 100 ? 1 : 0) : r.pos > 0 ? -1 : 0;
    } else if (trip) r.run = 0;
    else if (rem) {
      if (o && c) r.run = 0;
      else if (o && r.pos < 100) r.run = 1;
      else if (c && r.pos > 0) r.run = -1;
    }
    if (r.run) TMBUSY = true;
    r.pos = Math.max(0, Math.min(100, r.pos + (r.run * dt * 100) / mvTr(s, j)));
    if ((r.run > 0 && r.pos >= 100) || (r.run < 0 && r.pos <= 0)) r.run = 0;
    const tq0 = r.tq;
    r.tq =
      !b.sv && ((r.pos <= 0 && c && !o) || (r.pos >= 100 && o && !c))
        ? 1
        : 0; /* v12b: torque switch (TS) trips when the valve is at the end and the motor is still commanded (seats the valve, breaks the seal-in) */
    if (st(r.pos) !== s0 || r.run !== run0 || r.tq !== tq0) ch = true;
  });
  return ch;
}
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
const KN = { on: 'ON DELAY', off: 'OFF DELAY', pulse: 'PULSE', npulse: 'PULSE (falling)', flash: 'FLASHER' };
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
const tmKey = g => (g.tm.tag || '') + '|' + (g.tm.lab || '') + '|' + g.tm.ax.toFixed(0) + ',' + g.tm.ay.toFixed(0);
function uvApply(s) {
  if (!s || s.uvDone || !s.nl) return;
  s.uvDone = true;
  const u = UVL[s.name];
  if (!u) return;
  if (u.av) s.av = { ...(s.av || {}), ...u.av };
  if (u.mvt) s.mvt = { ...(s.mvt || {}), ...u.mvt };
  if (u.pdur) s.pdur = { ...(s.pdur || {}), ...u.pdur };
  if (u.mtd) s.mtd = u.mtd;
  if (u.tmo) {
    s.tmo = { ...(s.tmo || {}), ...u.tmo };
    s.nl.gates.forEach(g => {
      if (g.t !== 'TMR' || !g.tm) return;
      const o = s.tmo[tmKey(g)];
      if (o && o[0] >= 0) {
        if (g.tm.pg) g.tm.fv = { v: o[0], u: o[1] };
        else tmSet(g.tm, o[0], o[1]);
      }
    });
  }
  s.nl.avk = avOf(s);
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
  'LIMESTONE INJECTION (ROTOFEED)'
];
function ditlCat(x) {
  if (isSB(x)) return 'SOOTBLOWER';
  if (/^\(B\d+\)/.test(x.name || '')) return 'BOTTOM ASH HD600 / CONVEYORS'; /* 2.5.0-beta.14 */
  if (/^\(L\d+\)/.test(x.name || '')) return 'LIMESTONE INJECTION (ROTOFEED)'; /* 2.5.0-beta.15 */
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
  const cn = cur() ? cur().name : '';
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
  const IO = (window.WORLD && WORLD.instOf) || null,
    key = S.sheets.map(x => x.name + (x.bv !== BV ? '!' : '')).join('|') + '#' + SIDEFL + '#' + SIDESM + '#' + ((window.WORLD && WORLD.inst) || []).length;
  if (key !== SIDEKEY) {
    SIDEKEY = key;
    list.innerHTML = '';
    const f = SIDEFL.trim().toLowerCase(),
      G = {};
    /* 2.5.0-beta.11 (user: "DAPAT BY CATEGORY DIN ANG SHEET LIST SA DITL"): grouped by system, as the ABC list (category headers in
       the order of the contents sheets DITL-0A ~ 0D); the search still filters by name and title */
    const instTxt = x => ((IO && IO.get(x)) || []).map(y => y.title || '').join(' ');
    S.sheets.forEach((x, i) => {
      if (f && (x.name + ' ' + (x.title || '') + ' ' + ditlCat(x) + ' ' + instTxt(x)).toLowerCase().indexOf(f) < 0) return;
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
      const open = k => {
        goInst(i, k);
        sel = null;
        if (innerWidth < 820) {
          SIDEMIN = '1';
          try {
            localStorage.setItem('ditl.side', '1');
          } catch (e) {}
        }
        render();
      };
      b.onclick = () => open(0);
      box.appendChild(b);
      /* 3.2.0-beta.33 (CHECKLIST 0.2): machine B / C / D of a shared drawing ("THE DIAGRAM IS THE SAME FOR BURNER B,C,D") is a page of
         its own under drawing A: its own letters, addresses and state */
      const L = IO && IO.get(x);
      if (L && L.length > 1)
        L.forEach((y, k) => {
          if (!k) return;
          const c = document.createElement('button');
          c.dataset.i = i;
          c.dataset.k = k;
          c.className = 'dinst';
          const n1 = document.createElement('span');
          n1.className = 'sn';
          n1.textContent = '↳ ' + x.name.replace(/^\(\w+\)/, '') + ' · ' + WORLD.instLabel(y);
          c.appendChild(n1);
          const n2 = document.createElement('span');
          n2.className = 'st';
          n2.textContent = y.title || '';
          c.appendChild(n2);
          c.title = 'Machine ' + WORLD.instLabel(y) + ' of ' + x.name + ' (same drawing, own addresses and state)';
          c.onclick = () => open(k);
          box.appendChild(c);
        });
    }
  }
  let on = null;
  const ik = S.ikFor === S.cur ? S.ik || 0 : 0;
  list.querySelectorAll('button').forEach(b => {
    const o = +b.dataset.i === S.cur && (+b.dataset.k || 0) === ik;
    if (o !== b.classList.contains('on')) b.classList.toggle('on', o);
    if (o) on = b;
  });
  const lk = S.cur + ':' + ik;
  if (on && drawSide.last !== lk) sideShow(on);
  if (on && SIDEMIN !== '1' && drawSide.last !== lk) {
    on.scrollIntoView({ block: 'nearest' });
  }
  drawSide.last = lk;
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
