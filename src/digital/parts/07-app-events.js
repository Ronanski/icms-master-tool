/* DITL (digital logic) - Timers, buttons, keyboard, loading of the built-in sheets. Part of ONE script (joined by src/digital/order.list, in this order). */
setInterval(() => {
  const s = cur();
  if (window.WORLD && WORLD.live) return; /* the one world steps the timers / MOV / motors of EVERY sheet (src/world/world.js) */
  if (!SIM || !s || !s.nl) {
    tick.t = 0;
    return;
  }
  const T = tmList(),
    MV = s.nl.mv || [],
    MT = s.nl.mot || [];
  if (!T.length && !MV.length && !MT.length) return;
  const now = performance.now(),
    dt = Math.min((now - (tick.t || now)) / 1000, 1) * TSP;
  tick.t = now;
  const v = simulate(s.nl, simIn(s));
  let ch = false;
  T.forEach(g => {
    if (
      tmStep(
        g,
        g.ins.some(n => v[n]),
        dt
      )
    )
      ch = true;
  });
  if (mvStep(s, v, dt)) ch = true;
  if (motStep(s, v, dt)) ch = true;
  if (ch) render();
  else {
    updateTP();
    mvUI(s);
  }
}, 100);
/* ---------- title banner ---------- */
let MUI = { al: 'center', sz: 'M' };
try {
  const v = JSON.parse(localStorage.getItem('ditl.meta') || 'null');
  if (v && v.al) MUI = v;
} catch (e) {}
const mpar = n => {
  const m = /^[_(\s]*(\d+)[_)\s]+(.+)$/.exec(n || '');
  return m ? { no: m[1], dwg: m[2].trim() } : { no: '', dwg: n || '' };
};
const MSZ = { S: [15, 11], M: [22, 13], L: [32, 17] };
function renderMeta() {
  const s = cur(),
    m = $('meta');
  m.hidden = !s;
  if (!s) return;
  if (!s.meta) s.meta = { ...mpar(s.name), title: s.title || '' };
  if (!s.meta.title && s.title) s.meta.title = s.title;
  const z = MSZ[MUI.sz] || MSZ.M,
    al = MUI.al;
  $('mtx').style.textAlign = al;
  $('m_sub').style.justifyContent = al === 'left' ? 'flex-start' : al === 'right' ? 'flex-end' : 'center';
  $('m_title').style.fontSize = z[0] + 'px';
  $('m_sub').style.fontSize = z[1] + 'px';
  $('msz').value = MUI.sz;
  document.querySelectorAll('#mctl button').forEach(b => (b.className = b.dataset.al === al ? 'on' : ''));
  document.querySelectorAll('#meta .ed').forEach(e => {
    if (document.activeElement !== e) e.textContent = s.meta[e.dataset.k] || '';
  });
}
document.querySelectorAll('#meta .ed').forEach(e => {
  e.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      e.blur();
    } else if (ev.key === 'Escape') {
      e.textContent = (cur().meta || {})[e.dataset.k] || '';
      e.blur();
    }
    ev.stopPropagation();
  });
  e.addEventListener('paste', ev => {
    ev.preventDefault();
    document.execCommand('insertText', false, (ev.clipboardData.getData('text') || '').replace(/\s+/g, ' '));
  });
  e.addEventListener('blur', () => {
    const s = cur();
    if (!s) return;
    const t = e.textContent.trim();
    if (t === (s.meta[e.dataset.k] || '')) return;
    push();
    s.meta[e.dataset.k] = t;
    render();
  });
});
document.querySelectorAll('#mctl button').forEach(
  b =>
    (b.onclick = () => {
      MUI.al = b.dataset.al;
      try {
        localStorage.setItem('ditl.meta', JSON.stringify(MUI));
      } catch (e) {}
      renderMeta();
    })
);
$('msz').onchange = e => {
  MUI.sz = e.target.value;
  try {
    localStorage.setItem('ditl.meta', JSON.stringify(MUI));
  } catch (x) {}
  renderMeta();
};
/* ---------- events ---------- */
const svg = $('svg');
let dn = null,
  tm = null,
  last = { t: 0, k: '' };
const PTR = new Map();
let pinch = null;
svg.addEventListener('pointerdown', e => {
  PTR.set(e.pointerId, [e.clientX, e.clientY]);
  if (PTR.size === 2) {
    const a = [...PTR.values()];
    pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) };
    if (dn) dn.m = true;
    PBD = null;
    return;
  }
  closeEd();
  dn = { x: e.clientX, y: e.clientY, m: false };
  svg.setPointerCapture(e.pointerId);
  const s = cur();
  if (SIM && s) {
    const h = hit(e);
    if (h && h.c === 'S' && fbk(s, h.i, 'S') && isPB(s, h.i) && !lockd(s, h.i)) {
      if ((s.nl.grp || []).some(g => g.master === h.i && g.toggle)) {
        s.sig[h.k] = !s.sig[h.k];
        dn.pb = 2;
        render();
        return;
      }
      PBD = { k: h.k, t: Date.now() };
      s.sig[h.k] = true;
      dn.pb = 1;
      render();
    }
  }
});
svg.addEventListener('pointermove', e => {
  const s = cur();
  if (!s) return;
  if (PTR.has(e.pointerId)) PTR.set(e.pointerId, [e.clientX, e.clientY]);
  if (PTR.size === 2 && pinch) {
    const a = [...PTR.values()],
      d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]),
      v = VB[S.cur];
    if (d > 8 && pinch.d > 8) {
      const f = pinch.d / d,
        r = svg.getBoundingClientRect(),
        cx = (a[0][0] + a[1][0]) / 2 - r.left,
        cy = (a[0][1] + a[1][1]) / 2 - r.top,
        k = svg.getScreenCTM().a,
        px = v[0] + cx / k,
        py = v[1] + cy / k;
      v[0] = px - (px - v[0]) * f;
      v[1] = py - (py - v[1]) * f;
      v[2] *= f;
      v[3] *= f;
      svg.setAttribute('viewBox', v.join(' '));
      pinch.d = d;
    }
    return;
  }
  if (dn && (dn.m || Math.hypot(e.clientX - dn.x, e.clientY - dn.y) > 4)) {
    dn.m = true;
    const k = svg.getScreenCTM().a,
      v = VB[S.cur];
    v[0] -= (e.clientX - dn.x) / k;
    v[1] -= (e.clientY - dn.y) / k;
    dn.x = e.clientX;
    dn.y = e.clientY;
    svg.setAttribute('viewBox', v.join(' '));
  }
  const p = xy(e),
    h = hit(e);
  $('st').textContent = `X ${p[0].toFixed(1)}  Y ${p[1].toFixed(1)}` + (h ? `   |  row ${s.rows[h.i].n} · ${h.c}` : '');
  if (WT && !SIM && s.nl && !(dn && dn.m)) {
    const sg = nearSeg(s.nl, p[0], p[1], 1.2),
      hn = sg ? sg.n : -1;
    if (hn !== HOVN) {
      HOVN = hn;
      drawOv();
    }
  }
});
svg.addEventListener('pointercancel', e => {
  PTR.delete(e.pointerId);
  if (PTR.size < 2) pinch = null;
});
svg.addEventListener('pointerup', e => {
  PTR.delete(e.pointerId);
  if (pinch) {
    if (PTR.size < 2) pinch = null;
    dn = null;
    return;
  }
  if (!dn) return;
  const d = dn;
  dn = null;
  if (d.pb === 2) {
    return;
  }
  if (PBD) {
    const p = PBD,
      sh = cur();
    PBD = null;
    setTimeout(
      () => {
        if (sh) {
          sh.sig[p.k] = false;
          render();
        }
      },
      Math.max(0, 600 - (Date.now() - p.t))
    );
    return;
  }
  if (d.m) return;
  const h = hit(e),
    now = Date.now(),
    s = cur();
  if (!s) return;
  clearTimeout(tm);
  if (SIM) {
    const [ux, uy] = xy(e),
      u = (s.nl.usr || []).find(u => Math.abs(ux - u.x) < 3.2 && Math.abs(uy - u.y) < 2.4);
    if (u) {
      s.usw = s.usw || {};
      s.usw[u.key] = !s.usw[u.key];
      render();
      return;
    }
  }
  if (!SIM && WT) {
    wireClick(e);
    return;
  }
  if (!SIM && h && last.k === h.k && now - last.t < 350) {
    last = { t: 0, k: '' };
    openEd(h, e.clientX, e.clientY);
    return;
  }
  last = { t: now, k: h ? h.k : '' };
  if (SIM) {
    if (h && LEFT.includes(h.c) && isAn(s, h.i)) {
      const a = s.nl.an.find(x => x.row === h.i);
      if (a) anAsk(s, a);
      return;
    }
    if (h && LEFT.includes(h.c) && fbk(s, h.i, h.c)) {
      if (lockd(s, h.i)) {
        msg(
          'This input follows the equipment (limit switch / feedback of an internal signal), it is not clicked by hand.'
        );
        return;
      }
      s.sig[h.k] = !s.sig[h.k];
      render();
    }
    return;
  }
  tm = setTimeout(
    () => {
      sel = h;
      render();
    },
    h ? 330 : 0
  );
});
svg.addEventListener(
  'wheel',
  e => {
    if (!cur()) return;
    e.preventDefault();
    const v = VB[S.cur],
      f = e.deltaY < 0 ? 0.85 : 1.18,
      p = xy(e),
      px = p[0],
      py = -p[1];
    v[0] = px - (px - v[0]) * f;
    v[1] = py - (py - v[1]) * f;
    v[2] *= f;
    v[3] *= f;
    svg.setAttribute('viewBox', v.join(' '));
  },
  { passive: false }
);
addEventListener('keydown', e => {
  if (
    document.activeElement === $('eta') ||
    document.activeElement === $('sidefl') ||
    (document.activeElement && document.activeElement.isContentEditable)
  )
    return;
  if (e.key === 'PageDown' && S.cur < S.sheets.length - 1) {
    e.preventDefault();
    S.cur++;
    sel = null;
    render();
    return;
  }
  if (e.key === 'PageUp' && S.cur > 0) {
    e.preventDefault();
    S.cur--;
    sel = null;
    render();
    return;
  }
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undo();
  } else if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    redo();
  } else if (e.key === 'Delete') clearSel();
  else if (e.key === 'Escape') {
    sel = null;
    PEND = null;
    render();
  }
});
$('bmode').onclick = () => {
  SIM = !SIM;
  MST = {};
  MS = {};
  sel = null;
  WT = false;
  PEND = null;
  closeEd();
  S.sheets.forEach(x => {
    x.sig = {};
    x.usw = {};
    if (x.nl) {
      x.nl._v = null;
      x.nl.fx = [];
      x.nl.ufx = [];
    }
    ((x.nl && x.nl.gates) || []).forEach(g => {
      if (g.t === 'FF') g.q = 0;
      if (g.t === 'TMR') g.st = { acc: 0, out: 0, pre: 0, run: 0 };
    });
  });
  tick.t = 0;
  if (SIM && cur())
    msg(
      'Simulate: click the SERVICE cell of an input row (switch icon) to turn it ON/OFF. PB rows are push buttons: press and hold.'
    );
  render();
};
$('shsel').onchange = e => {
  S.cur = +e.target.value;
  sel = null;
  render();
};
$('shprev').onclick = () => {
  if (S.cur > 0) {
    S.cur--;
    sel = null;
    render();
  }
};
$('shnext').onclick = () => {
  if (S.cur < S.sheets.length - 1) {
    S.cur++;
    sel = null;
    render();
  }
};
$('bundo').onclick = undo;
$('bredo').onclick = redo;
$('bclr').onclick = clearSel;
$('bfit').onclick = () => {
  delete VB[S.cur];
  render();
};
let dt = null;
$('bdel').onclick = function () {
  if (!cur()) return;
  if (!dt) {
    this.textContent = 'Click again to delete';
    dt = setTimeout(() => {
      dt = null;
      this.textContent = 'Delete sheet';
    }, 3000);
    return;
  }
  clearTimeout(dt);
  dt = null;
  this.textContent = 'Delete sheet';
  push();
  S.sheets.splice(S.cur, 1);
  S.cur = Math.max(0, S.cur - 1);
  sel = null;
  render();
};
$('bsave').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([J(S)], { type: 'application/json' }));
  a.download = 'ditl-project.json';
  a.click();
};
$('fjson').onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    push();
    S = j;
    VB = {};
    sel = null;
    render();
  } catch (x) {
    msg('Invalid project file.');
  }
  e.target.value = '';
};
let LSF = false,
  FAILS = [];
const isAn = (s, i) =>
  !!(
    s.nl &&
    s.nl.anRows &&
    s.nl.anRows.has(i)
  ); /* v26: row that feeds only limit comparators = analog input (numeric value, not a switch) */
const anVal = (s, a) => (s.av && s.av[a.key] !== undefined ? s.av[a.key] : a.def);
const anValN = (s, n) => {
  const a = (s.nl.an || []).find(x => x.net === n);
  return a ? anVal(s, a) : 0;
};
const cmpOn = (s, g) => {
  const v = anValN(s, g.ins[0]),
    sp = g.spNet !== undefined ? anValN(s, g.spNet) : g.sp;
  return g.cmp === '>' ? (g.eq ? v >= sp : v > sp) : g.eq ? v <= sp : v < sp;
};
const cmpTxt = g =>
  (g.cmp === '>' ? 'High ' : 'Low ') +
  g.cmp +
  (g.eq ? '=' : '') +
  ' ' +
  (g.spNet !== undefined ? g.spVar : g.sp) +
  (g.unit || '');
function anAsk(s, a) {
  const g = a.g.map(i => s.nl.gates[i]),
    v = prompt(
      (a.label || a.key) +
        '\n' +
        g.map(cmpTxt).join('   ') +
        '\n\nProcess value' +
        (a.unit ? ' (' + a.unit + ')' : '') +
        ':',
      anVal(s, a)
    );
  if (v === null) return;
  const x = parseFloat(String(v).replace(',', '.'));
  if (!isFinite(x)) return;
  s.av = s.av || {};
  s.av[a.key] = x;
  s.nl.avk = s.av;
  render();
}
const fbk = (s, i, c) =>
  c === 'S' &&
  s.nl &&
  s.nl.src.some(z => z.row === i) &&
  !isAn(s, i) &&
  LEFT.some(
    q => (s.cells[i + ':' + q] || []).length
  ); /* v17: no text in the row = wire stub of a bar / pulse glyph, not an input (no switch) */
/* v11: push button input = the row text says PB / P.B. / PUSH BUTTON: momentary (ON while pressed, at least 0.4 s) */
const isPB = (s, i) =>
  LEFT.some(c =>
    (s.cells[i + ':' + c] || []).some(t => /(^|[^A-Z])P\.?\s?B\.?($|[^A-Z])|PUSH\s*-?\s*BUTTON/i.test(t.t))
  );
let PBD = null;
const lockd = (s, i) =>
  mvForced(s).has(i) ||
  (s.nl.mir || []).some(m => m.row === i) ||
  grpState(s).has(i); /* v10: the input of a row = its SERVICE cell, only rows that a wire reaches */
function diag(s) {
  /* 1.22.0: the netlist of a sheet is built when the sheet is first opened (render); Health reads every sheet, so build it here too
     (before: "Cannot read properties of undefined (reading 'src')" and the Health panel did not open) */
  if (!s.nl || s.nl.v !== 10) {
    s.nl = netlist(s);
    s.uvDone = false;
  }
  const n = s.nl,
    is = [],
    S1 = s.rng.S[1],
    R0 = s.rng.RS[0],
    sr = new Set(n.src.map(x => x.row));
  const lab = s.tx.filter(t => t.ix > S1 && t.ix < R0 && /^(AND|OR|NOT)$/.test(t.t));
  ['AND', 'OR', 'NOT'].forEach(k => {
    const d = lab.filter(t => t.t === k).length - n.gates.filter(g => g.t === k).length;
    if (d > 0) is.push(d + ' ' + k + ' label(s) with no gate detected');
  });
  const bad = n.gates.filter(g =>
    g.t === 'FF' ? !g.s.length || !g.r.length || !g.out.length : !g.ins.length || !g.out.length
  ).length;
  if (bad) is.push(bad + ' gate(s) missing pins');
  if (n.dang.length) is.push(n.dang.length + ' loose wire end(s)');
  const tm = s.tx.filter(t => /DELAY|PULSE/.test(t.t)).length - n.gates.filter(g => g.t === 'TMR').length;
  if (tm > 0) is.push(tm + ' timer(s) not detected');
  let nw = 0,
    nc = 0;
  s.rows.forEach((r, i) => {
    const has = LEFT.some(c => s.cells[i + ':' + c]);
    if (has && !sr.has(i)) nw++;
    if (!has && sr.has(i)) nc++;
  });
  if (nw) is.push(nw + ' input row(s) have text but no wire reaches them');
  if (nc) is.push(nc + ' wired row(s) have no input text (clickable at T cell)');
  const x0 = s.rng.F[0],
    orph = s.tx.filter(
      t =>
        t.ix >= x0 - 3 &&
        t.ix < S1 &&
        s.rows.some(r => t.y >= r.y - 3.3 && t.y < r.y + 5.7 && !(/^\d{1,3}$/.test(t.t) && +t.t === +r.n))
    ).length;
  if (orph) is.push(orph + ' text(s) in table rows outside any cell');
  if (!n.gates.length) is.push('no gates');
  if (!sr.size) is.push('no input wires');
  if (!n.outs.length) is.push('no output wires');
  return {
    is,
    sev: is.some(x => /no gates|no input|no output|no gate detected|missing pins/.test(x)) ? 2 : is.length ? 1 : 0
  };
}
function showHealth(only) {
  const p = $('hp'),
    rows = S.sheets.map((s, i) => ({ s, i, d: diag(s) })),
    bad = rows.filter(r => r.d.sev),
    ok = rows.length - bad.length;
  const txt =
    `DITL health: ${rows.length} sheets, ${ok} OK, ${bad.length} with issues, ${FAILS.length} failed import\n` +
    FAILS.map(f => 'FAILED ' + f).join('\n') +
    '\n' +
    bad
      .map(
        r =>
          `${r.s.name}: ${r.d.is.join('; ')}${r.s.lyr ? ' [wire layer ' + r.s.lyr + ']' : ''}${r.s.nl.healed ? ' [healed ' + r.s.nl.healed + ']' : ''}`
      )
      .join('\n');
  p.hidden = false;
  p.innerHTML = `<b>Health</b> — ${rows.length} sheets · <span style="color:#4fd18b">${ok} OK</span> · <span style="color:#ffb84a">${bad.length} issues</span> · <span style="color:#ff6b6b">${FAILS.length} failed</span>${LSF ? ' · <span style="color:#ff6b6b">AUTOSAVE FULL, use Save project</span>' : ''} <label><input type="checkbox" id="hpo" ${only === false ? '' : 'checked'}> problems only</label> <button id="hpc">Close</button><br>`;
  const L = document.createElement('div');
  p.appendChild(L);
  FAILS.forEach(f => {
    const d = document.createElement('div');
    d.style.color = '#ff6b6b';
    d.textContent = '✕ ' + f;
    L.appendChild(d);
  });
  const po = () => $('hpo').checked;
  const draw = () => {
    [...L.querySelectorAll('.hr')].forEach(x => x.remove());
    rows
      .filter(r => !po() || r.d.sev)
      .forEach(r => {
        const d = document.createElement('div');
        d.className = 'hr';
        d.style.cssText = 'cursor:pointer;padding:2px 0;border-top:1px solid #1f3340';
        d.innerHTML = `<b style="color:${r.d.sev === 2 ? '#ff6b6b' : r.d.sev ? '#ffb84a' : '#4fd18b'}">${r.s.name}</b> ${r.d.is.join(' · ') || 'OK'}`;
        d.onclick = () => {
          S.cur = r.i;
          sel = null;
          render();
        };
        L.appendChild(d);
      });
  };
  draw();
  const ta = document.createElement('textarea');
  ta.readOnly = true;
  ta.rows = 4;
  ta.style.cssText = 'width:100%;margin-top:6px';
  ta.value = txt;
  ta.onfocus = () => ta.select();
  p.appendChild(ta);
  $('hpo').onchange = draw;
  $('hpc').onclick = () => (p.hidden = true);
}
$('bhp').onclick = () => showHealth();
$('fdxf').onchange = async e => {
  const fl = [...e.target.files];
  if (!fl.length) return;
  FAILS = [];
  let ok = 0,
    lastR = '';
  push();
  for (let i = 0; i < fl.length; i++) {
    const f = fl[i];
    msg(`Importing ${i + 1}/${fl.length}: ${f.name}`);
    await new Promise(r => setTimeout(r, 0));
    try {
      const E = parse(await f.text()),
        sh = E.length ? build(E, f.name.replace(/\.dxf$/i, '')) : null;
      if (!sh) {
        FAILS.push(f.name + ': no entities or row numbers found (export as ASCII DXF)');
        continue;
      }
      const fx = fixLoad()[sh.name];
      if (fx && ((fx.links && fx.links.length) || (fx.pins && fx.pins.length))) {
        sh.links = fx.links || [];
        sh.pins = fx.pins || [];
        sh.nl = netlist(sh);
      }
      {
        const oi = S.sheets.findIndex(x => x.name === sh.name);
        if (oi >= 0) {
          sh.meta = S.sheets[oi].meta;
          sh.mvt = S.sheets[oi].mvt;
          sh.pdur = S.sheets[oi].pdur;
          S.sheets[oi] = sh;
          S.cur = oi;
          delete VB[oi];
        } else {
          S.sheets.push(sh);
          S.cur = S.sheets.length - 1;
        }
      }
      ok++;
      lastR = report(sh) + (sh.nl.healed ? ` · ${sh.nl.healed} tiny gap(s) auto-joined` : '');
    } catch (x) {
      FAILS.push(f.name + ': ' + x.message);
    }
  }
  e.target.value = '';
  sel = null;
  render();
  if (fl.length === 1) {
    msg(FAILS.length ? FAILS[0] : lastR);
  } else {
    msg(`${ok}/${fl.length} imported` + (FAILS.length ? `, ${FAILS.length} failed` : ''));
    showHealth();
  }
};
window.PRE_N = 134;
render();
{
  const n = S.sheets.filter(x => x.bv !== BV && !window.PRE_N).length;
  if (n)
    msg(
      n +
        ' sheet(s) marked ⚠ were imported with an older version. Import the DXF again to apply the fixes (same name replaces the old sheet, your fixes are kept).'
    );
}

/* ---------- v19 built-in sheets: all DXF logic sheets are inside this file (no import needed, works on a phone) ---------- */
addEventListener('load', async () => {
  const e0 = document.getElementById('pre');
  if (!e0 || !window.PRE_N) return;
  const stale = S.sheets.some(x => x.bv !== BV);
  if (S.sheets.length >= PRE_N && !stale) return;
  if (typeof DecompressionStream === 'undefined') {
    msg('This browser is too old to open the built-in sheets. Update Chrome / Safari.');
    return;
  }
  msg('Loading built-in sheets...');
  try {
    const bin = Uint8Array.from(atob(e0.textContent.trim()), c => c.charCodeAt(0));
    const txt = await gunz(bin);
    const pre = txt
        .split('\n')
        .filter(Boolean)
        .map(l => JSON.parse(l)),
      old = new Map(S.sheets.map(x => [x.name, x])),
      fx = fixLoad();
    const out = pre.map(p => {
      const o = old.get(p.name);
      if (o && o.bv === BV) return o;
      if (o) {
        p.meta = o.meta || p.meta;
        p.mvt = o.mvt;
        p.pdur = o.pdur;
      }
      const f = fx[p.name];
      if (f) {
        p.links = f.links || p.links;
        p.pins = f.pins || p.pins;
      }
      return p;
    });
    S.sheets.forEach(x => {
      if (!pre.some(p => p.name === x.name)) out.push(x);
    });
    let cn = null;
    try {
      cn = localStorage.getItem('ditl.curname');
    } catch (e) {}
    cn = cn || (S.sheets[S.cur] && S.sheets[S.cur].name);
    S.sheets = out;
    const ix = out.findIndex(x => x.name === cn);
    S.cur =
      ix >= 0
        ? ix
        : Math.max(
            0,
            out.findIndex(x => /DITL-56$/.test(x.name))
          );
    VB = {};
    hist = [];
    fut = [];
    render();
    msg(out.length + ' sheets loaded. Pick a page from the sheet list on the left (the arrow button hides it).');
  } catch (e) {
    msg('Could not load the built-in sheets: ' + e.message);
  }
});
