/* ===== 3.2.0-beta.7 F(X) CURVES (user 2026-10-23: "makikita mo ang table tulad ng sa excel nya, at doon ka rin makakapag-edit ng values
   para malaro mo response ng planta" + an explanation of every linear). One page:
   - the list of the 91 tables (STN101 / 102 / 103), search;
   - the sheet as in document-references/linear-curves-fx.xls: STN10x LINEARIZE, the chart (grey plot, dashed grid, blue curve, the axis
     names of the workbook), the table X - INPUT | RANGE | Y - OUTPUT | RANGE | NO. | LX | LY and the title block (TITLE, Ptrn No., DWG No.);
   - every X, Y, LX and LY cell can be edited: the edit is the same LX / LY edit as the Inspector's "Edit table" (AN.lne, saved, in the
     project file, NOT cleared by the global Reset; Reset this table brings back the workbook values). The running sheets read it at once;
   - the live point (red) on the chart when a sheet that uses the table runs, a "try a value" box, the sheets that use it;
   - About this curve: what, input from, output to, why, what a change does (src/ui/fx/fx-info.js) and the signal path read from the
     drawings (src/ui/fx/fx-paths.js).
   The engine is not changed: the page calls the engine's own functions (AN.lnTables, AN.lnApplyEdits, AN.lneSave, AN.settle). ===== */
(function () {
  const $ = id => document.getElementById(id);
  const E = (t, a, kids) => {
    const e = document.createElement(t);
    if (a)
      for (const k in a) {
        const v = a[k];
        if (v == null) continue;
        if (k === 'cls') e.className = v;
        else if (k === 'txt') e.textContent = v;
        else if (k === 'on') e.onclick = v;
        else e.setAttribute(k, v);
      }
    if (kids) kids.forEach(c => c != null && e.append(c));
    return e;
  };
  const NS = 'http://www.w3.org/2000/svg';
  const S_ = (t, a, txt) => {
    const e = document.createElementNS(NS, t);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    if (txt != null) e.textContent = txt;
    return e;
  };
  const f2 = v => {
    if (!isFinite(v)) return '';
    const r = Math.round(v * 1000) / 1000;
    return (Math.abs(r) >= 1000 ? r.toFixed(0) : String(r)).replace(/^-0$/, '0');
  };
  const pc = v => (isFinite(v) ? (Math.round(v * 100) / 100).toFixed(2) + '%' : '');
  let ws = null,
    cur = null,
    tmr = null,
    filt = '';
  const tables = () => {
    try {
      return (AN.lnTables && AN.lnTables()) || [];
    } catch (e) {
      return [];
    }
  };
  const byKey = k => tables().find(t => t.key === k);
  const order = t => t.stn * 1000 + t.ln;
  const info = k => (window.LS_FXINFO || {})[k] || null;
  const P = () => window.LS_FXPATH || { axis: {}, path: {} };
  /* LX / LY in % of the ranges (the DCS parameters), from the edit or the workbook */
  function lxly(t) {
    const e = AN.lne && AN.lne[t.key];
    if (e && e.lx && e.ly && e.lx.length === t.o0.length) return { lx: e.lx.slice(), ly: e.ly.slice() };
    return {
      lx: t.o0.map(q => ((q[0] - t.xr[0]) / (t.xr[1] - t.xr[0])) * 100),
      ly: t.o0.map(q => ((q[1] - t.yr[0]) / (t.yr[1] - t.yr[0])) * 100)
    };
  }
  const toX = (t, lx) => t.xr[0] + (lx * (t.xr[1] - t.xr[0])) / 100,
    toY = (t, ly) => t.yr[0] + (ly * (t.yr[1] - t.yr[0])) / 100,
    toLX = (t, x) => ((x - t.xr[0]) / (t.xr[1] - t.xr[0])) * 100,
    toLY = (t, y) => ((y - t.yr[0]) / (t.yr[1] - t.yr[0])) * 100;
  /* the table output for an input: straight lines between the points, the end value held outside (as the engine's FX block) */
  function interp(pts, x) {
    if (!pts.length) return NaN;
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1],
        [x2, y2] = pts[i];
      if (x <= x2) return x2 === x1 ? y2 : y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
    }
    return pts[pts.length - 1][1];
  }
  /* FX blocks that use this table on the sheets that are compiled */
  function users(t) {
    const L = [];
    for (const sh of (window.AN && AN.sheets) || []) {
      const S = sh.S;
      if (!S || !S.blk) continue;
      for (const b of S.blk) if (b.k === 'FX' && b.p && b.p.tbl === t) L.push({ sh, S, b });
    }
    return L;
  }
  function commit(t, lx, ly) {
    AN.lne[t.key] = { lx: lx.slice(), ly: ly.slice() };
    save();
  }
  function save() {
    try {
      AN.lneSave && AN.lneSave();
      AN.lnApplyEdits && AN.lnApplyEdits();
      if (!AN.run && AN.settle && AN.cs && AN.cs() && AN.cs().S) AN.settle();
    } catch (e) {}
  }
  /* ---------- the page ---------- */
  function build() {
    ws = E('div', { id: 'fxws', role: 'dialog', 'aria-label': 'F(X) curves' });
    const head = E('div', { cls: 'fxhead' }, [
      E('b', { txt: 'F(X) curves' }),
      E('span', { cls: 'fxsub', txt: 'Linear tables of the DCS (LINEAR CURVE workbook). Click a cell to edit it; the running sheets use the new value at once.' }),
      E('span', { cls: 'fxgrow' }),
      E('button', { cls: 'fxbtn', id: 'fximp', txt: 'Import / export', title: 'Paste or download whole tables (CSV / JSON)', on: () => (close(), AN.lnOpen && AN.lnOpen()) }),
      E('button', { cls: 'fxbtn', id: 'fxresall', txt: 'Reset all edits', title: 'Every table back to the workbook values', on: resetAll }),
      E('button', { cls: 'fxbtn fxx', id: 'fxclose', txt: '✕ Close', 'aria-label': 'Close F(X) curves', on: close })
    ]);
    const srch = E('input', { id: 'fxq', type: 'search', placeholder: 'Search LN, title, tag…', 'aria-label': 'Search the F(X) tables', autocomplete: 'off' });
    srch.oninput = () => ((filt = srch.value.trim().toUpperCase()), list());
    const pick = E('select', { id: 'fxpick', 'aria-label': 'F(X) table' });
    pick.onchange = () => show(pick.value);
    const left = E('nav', { cls: 'fxleft', 'aria-label': 'F(X) tables' }, [srch, E('div', { id: 'fxlist' })]);
    const main = E('div', { cls: 'fxmain', id: 'fxmain' });
    ws.append(head, E('div', { cls: 'fxbody' }, [left, E('div', { cls: 'fxright' }, [pick, main])]));
    ws.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !e.target.closest('td')) close();
    });
    document.body.append(ws);
  }
  function list() {
    const box = $('fxlist'),
      pick = $('fxpick');
    if (!box) return;
    box.textContent = '';
    pick.textContent = '';
    const T = tables()
      .slice()
      .sort((a, b) => order(a) - order(b));
    let g = null;
    for (const t of T) {
      const inf = info(t.key),
        pth = P().path[t.key] || {},
        hay = [t.key, 'LN' + t.ln, t.title, t.dwg, (pth.in || []).join(' '), inf ? inf.from + ' ' + inf.to : ''].join(' ').toUpperCase();
      pick.append(E('option', { value: t.key, txt: t.key + '  ' + (t.title || '').replace(/\s+/g, ' ') }));
      if (filt && !hay.includes(filt)) continue;
      if (g !== t.stn) {
        g = t.stn;
        box.append(E('div', { cls: 'fxg', txt: 'STN10' + t.stn }));
      }
      const b = E('button', { cls: 'fxi' + (cur === t.key ? ' on' : ''), 'data-k': t.key, title: t.key + ' · ' + t.dwg }, [
        E('b', { txt: 'LN' + t.ln }),
        E('span', { txt: (t.title || '').replace(/\s+/g, ' ') }),
        t.edited ? E('i', { txt: 'edited' }) : null
      ]);
      b.onclick = () => show(t.key);
      box.append(b);
    }
    if (!box.children.length) box.append(E('div', { cls: 'fxnone', txt: 'No table matches.' }));
    if (cur) pick.value = cur;
  }
  function show(k) {
    const t = byKey(k);
    if (!t) return;
    cur = k;
    try {
      localStorage.setItem('ls-fx', k);
    } catch (e) {}
    const m = $('fxmain');
    m.textContent = '';
    m.scrollTop = 0;
    m.append(sheet(t), about(t));
    list();
    const on = document.querySelector('#fxlist .fxi.on');
    if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
    live();
  }
  /* ---------- the sheet (as in the workbook) ---------- */
  function sheet(t) {
    const ax = P().axis[t.key] || ['', ''],
      paper = E('div', { cls: 'fxpaper', id: 'fxpaper' });
    paper.append(E('div', { cls: 'fxst', txt: 'STN10' + t.stn + ' LINEARIZE' }), E('div', { cls: 'fxst', txt: t.ptn || t.key }));
    const ch = E('div', { cls: 'fxchart' });
    ch.append(chart(t, ax));
    paper.append(ch);
    /* try a value */
    const tx = E('input', { id: 'fxtry', type: 'number', step: 'any', 'aria-label': 'Input value to try', placeholder: 'X' }),
      ty = E('b', { id: 'fxtryy', txt: '—' });
    tx.oninput = () => {
      const x = parseFloat(tx.value);
      ty.textContent = isFinite(x) ? f2(interp(t.p2, x)) + ' ' + yU(t) : '—';
      mark(t, isFinite(x) ? x : null);
    };
    paper.append(
      E('div', { cls: 'fxtryrow' }, [
        E('label', { for: 'fxtry', txt: 'Try an input (' + unit(t.xu) + '):' }),
        tx,
        E('span', { txt: '→ output' }),
        ty,
        E('span', { cls: 'fxlive', id: 'fxlive' })
      ])
    );
    paper.append(table(t));
    paper.append(
      E('table', { cls: 'fxtb' }, [
        E('tbody', null, [
          E('tr', null, [
            E('td', { cls: 'fxco', rowspan: '2' }, [E('b', { txt: 'FORMOSA PLASTICS CO.,LTD' }), E('span', { txt: 'ELECTRONIC GROUP' })]),
            E('td', { cls: 'fxlb', txt: 'JOB NAME:' }),
            E('td', { cls: 'fxjv', txt: 'LMYP-1 #1 DCS PROJECT' }),
            E('td', { cls: 'fxlb', txt: 'Ptrn No.:' }),
            E('td', { cls: 'fxjv', txt: t.ptn || t.key })
          ]),
          E('tr', null, [
            E('td', { cls: 'fxlb', txt: 'TITLE:' }),
            E('td', { cls: 'fxjv', txt: (t.title || '').replace(/\s+/g, ' ') }),
            E('td', { cls: 'fxlb', txt: 'DWG No.:' }),
            E('td', { cls: 'fxjv', txt: t.dwg || '' })
          ])
        ])
      ])
    );
    const bar = E('div', { cls: 'fxsbar' }, [
      E('span', { cls: 'fxed', id: 'fxed', txt: t.edited ? 'Edited: the yellow cells differ from the workbook.' : 'Workbook values.' }),
      E('span', { cls: 'fxwarn', id: 'fxwarn' }),
      E('span', { cls: 'fxgrow' }),
      E('button', { cls: 'fxbtn', id: 'fxreset', txt: 'Reset this table', title: 'Back to the workbook values (only this table)', on: () => (delete AN.lne[t.key], save(), show(t.key)) })
    ]);
    return E('section', { cls: 'fxcard fxsheet', 'aria-label': 'Sheet ' + t.key }, [bar, E('div', { cls: 'fxscroll' }, [paper])]);
  }
  const unit = u => ((u || '').match(/\(([^)]*)\)?/) || [, ''])[1].trim() || (u || '').replace(/RANGE/i, '').trim();
  /* a "%" range of 0 ~ 1 (a ratio: calorie, O2 correction, gain) has no unit: 0.8 is a factor, not 0.8 % */
  const yU = t => (Math.abs(t.yr[1] - t.yr[0]) <= 2 && unit(t.yu) === '%' ? '' : unit(t.yu));
  /* the chart: X and Y in % of the ranges (LX / LY), as the workbook draws it */
  function chart(t, ax) {
    const { lx, ly } = lxly(t);
    const lo = v => Math.min(-20, Math.floor(Math.min(...v) / 20) * 20),
      hi = v => Math.max(120, Math.ceil(Math.max(...v) / 20) * 20);
    const x0 = lo(lx),
      x1 = hi(lx),
      y0 = lo(ly),
      y1 = hi(ly);
    const W = 640,
      H = 300,
      L = 70,
      R = 16,
      T = 12,
      B = 52;
    const X = v => L + ((v - x0) / (x1 - x0)) * (W - L - R),
      Y = v => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
    const s = S_('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'fxsvg', role: 'img', 'aria-label': 'Curve of ' + t.key });
    s.append(S_('rect', { x: L, y: T, width: W - L - R, height: H - T - B, class: 'fxplot' }));
    for (let v = y0; v <= y1 + 1e-9; v += 20) {
      s.append(S_('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'fxgrid' }));
      s.append(S_('text', { x: L - 6, y: Y(v) + 4, class: 'fxtick', 'text-anchor': 'end' }, v.toFixed(2) + '%'));
    }
    for (let v = x0; v <= x1 + 1e-9; v += 20) {
      s.append(S_('line', { x1: X(v), x2: X(v), y1: H - B, y2: H - B + 5, class: 'fxaxis' }));
      s.append(S_('text', { x: X(v), y: H - B + 18, class: 'fxtick', 'text-anchor': 'middle' }, v + '%'));
    }
    s.append(S_('line', { x1: L, x2: W - R, y1: H - B, y2: H - B, class: 'fxaxis' }), S_('line', { x1: L, x2: L, y1: T, y2: H - B, class: 'fxaxis' }));
    const pts = lx.map((v, i) => [v, ly[i]]).filter((p, i, a) => !i || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
    s.append(S_('polyline', { points: pts.map(p => X(p[0]) + ',' + Y(p[1])).join(' '), class: 'fxline' }));
    pts.forEach(p => s.append(S_('rect', { x: X(p[0]) - 3, y: Y(p[1]) - 3, width: 6, height: 6, class: 'fxpt' })));
    s.append(S_('text', { x: (L + W - R) / 2, y: H - 8, class: 'fxaxt', 'text-anchor': 'middle' }, ax[0] || 'X - INPUT'));
    s.append(S_('text', { x: 14, y: (T + H - B) / 2, class: 'fxaxt', 'text-anchor': 'middle', transform: 'rotate(-90 14 ' + (T + H - B) / 2 + ')' }, ax[1] || 'Y - OUTPUT'));
    const g = S_('g', { id: 'fxmk', style: 'display:none' });
    g.append(S_('line', { class: 'fxmkl', id: 'fxmkv' }), S_('line', { class: 'fxmkl', id: 'fxmkh' }), S_('circle', { r: 5.5, class: 'fxmkc', id: 'fxmkc' }));
    s.append(g);
    s._map = { X, Y, L, B, H, x0, x1, y0, y1 };
    return s;
  }
  /* a point on the chart (input in engineering units) */
  function mark(t, x) {
    const s = document.querySelector('#fxpaper .fxsvg'),
      g = s && s.querySelector('#fxmk');
    if (!g) return;
    if (x == null || !isFinite(x)) return void (g.style.display = 'none');
    const m = s._map,
      lx = Math.max(m.x0, Math.min(m.x1, toLX(t, x))),
      ly = Math.max(m.y0, Math.min(m.y1, toLY(t, interp(t.p2, x)))),
      px = m.X(lx),
      py = m.Y(ly);
    const set = (id, a) => Object.entries(a).forEach(([k, v]) => s.querySelector('#' + id).setAttribute(k, v));
    set('fxmkv', { x1: px, x2: px, y1: py, y2: m.H - m.B });
    set('fxmkh', { x1: m.L, x2: px, y1: py, y2: py });
    set('fxmkc', { cx: px, cy: py });
    g.style.display = '';
  }
  /* ---------- the table ---------- */
  function table(t) {
    const c = lxly(t),
      n = c.lx.length,
      o0 = t.o0;
    const tb = E('table', { cls: 'fxtb fxdata' });
    tb.append(
      E('thead', null, [
        E('tr', null, [
          E('th', { colspan: '3', txt: 'X - INPUT' }),
          E('th', { colspan: '3', txt: 'Y - OUTPUT' }),
          E('th', { colspan: '3', txt: 'CURVE PARAMETER' })
        ]),
        E('tr', null, [
          E('th', { txt: 'X - INPUT' }),
          E('th', { colspan: '2', txt: t.xu || 'RANGE' }),
          E('th', { txt: 'Y - OUTPUT' }),
          E('th', { colspan: '2', txt: t.yu || 'RANGE' }),
          E('th', { txt: 'NO.' }),
          E('th', { txt: 'LX' }),
          E('th', { txt: 'LY' })
        ])
      ])
    );
    const body = E('tbody');
    const cell = (v, k, i, txt) => {
      const d = E('td', { cls: 'fxe', tabindex: '0', role: 'textbox', 'aria-label': k.toUpperCase() + ' row ' + (i + 1), 'data-k': k, 'data-i': i, txt });
      d.onclick = () => edit(t, d);
      d.onkeydown = e => {
        if (e.target !== d) return; /* the keys typed in the cell's own input */
        if (e.key === 'Enter' || e.key === 'F2' || /^[-\d.]$/.test(e.key)) {
          e.preventDefault();
          edit(t, d, /^[-\d.]$/.test(e.key) ? e.key : null);
        } else if (/^Arrow/.test(e.key)) {
          e.preventDefault();
          nav(d, e.key);
        }
      };
      return d;
    };
    for (let i = 0; i < n; i++) {
      const x = toX(t, c.lx[i]),
        y = toY(t, c.ly[i]),
        chg = Math.abs(x - o0[i][0]) > 1e-6 || Math.abs(y - o0[i][1]) > 1e-6;
      const tr = E('tr', { cls: chg ? 'chg' : null }, [
        cell(x, 'x', i, f2(x)),
        E('td', { cls: 'fxr', txt: f2(t.xr[0]) }),
        E('td', { cls: 'fxr', txt: f2(t.xr[1]) }),
        cell(y, 'y', i, f2(y)),
        E('td', { cls: 'fxr', txt: f2(t.yr[0]) }),
        E('td', { cls: 'fxr', txt: f2(t.yr[1]) }),
        E('td', { cls: 'fxn', txt: String(i + 1).padStart(2, '0') }),
        cell(c.lx[i], 'lx', i, pc(c.lx[i])),
        cell(c.ly[i], 'ly', i, pc(c.ly[i]))
      ]);
      body.append(tr);
    }
    tb.append(body);
    return tb;
  }
  function nav(d, k) {
    const tr = d.parentNode,
      cols = [...tr.querySelectorAll('.fxe')],
      ci = cols.indexOf(d);
    let to = null;
    if (k === 'ArrowLeft') to = cols[ci - 1];
    else if (k === 'ArrowRight') to = cols[ci + 1];
    else {
      const r = k === 'ArrowUp' ? tr.previousElementSibling : tr.nextElementSibling;
      to = r && r.querySelectorAll('.fxe')[ci];
    }
    if (to) to.focus();
  }
  /* one cell in edit: Enter / Tab = keep, Esc = cancel. X / Y are engineering values, LX / LY % of the ranges (as the DCS) */
  function edit(t, d, first) {
    if (d.querySelector('input')) return;
    const k = d.dataset.k,
      i = +d.dataset.i,
      c = lxly(t),
      v0 = k === 'x' ? toX(t, c.lx[i]) : k === 'y' ? toY(t, c.ly[i]) : c[k][i];
    const inp = E('input', { type: 'text', inputmode: 'decimal', value: first != null ? first : f2(v0), 'aria-label': d.getAttribute('aria-label') });
    d.textContent = '';
    d.append(inp);
    inp.focus();
    if (first == null) inp.select();
    let done = false;
    const end = keep => {
      if (done) return;
      done = true;
      const x = parseFloat(String(inp.value).replace('%', ''));
      if (keep && isFinite(x) && Math.abs(x - v0) > 1e-9) {
        if (k === 'x') c.lx[i] = toLX(t, x);
        else if (k === 'y') c.ly[i] = toLY(t, x);
        else c[k][i] = x;
        commit(t, c.lx, c.ly);
        const pos = [k, i];
        show(t.key);
        const nd = document.querySelector('#fxpaper td.fxe[data-k="' + pos[0] + '"][data-i="' + pos[1] + '"]');
        if (nd) nd.focus();
        check(t);
      } else {
        d.textContent = k === 'lx' || k === 'ly' ? pc(v0) : f2(v0);
        d.focus();
      }
    };
    inp.onkeydown = e => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        end(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        end(false);
      }
    };
    inp.onblur = () => end(true);
  }
  function check(t) {
    const w = $('fxwarn');
    if (!w) return;
    const { lx } = lxly(t);
    let bad = false;
    for (let i = 1; i < lx.length; i++) if (lx[i] < lx[i - 1] - 1e-9) bad = true;
    w.textContent = bad ? '⚠ X must not go down from one row to the next: the DCS reads the points in order.' : '';
  }
  /* ---------- about this curve ---------- */
  function about(t) {
    const inf = info(t.key),
      p = P().path[t.key] || { sh: [], in: [], up: [], dn: [] },
      us = users(t);
    const sec = E('section', { cls: 'fxcard fxabout', 'aria-label': 'About ' + t.key });
    sec.append(E('h3', { txt: 'About ' + t.key }), E('p', { cls: 'fxtitle', txt: (t.title || '').replace(/\s+/g, ' ') }));
    const row = (h, txt) => txt && sec.append(E('div', { cls: 'fxrow' }, [E('h4', { txt: h }), E('p', { txt })]));
    if (inf) {
      row('What it does', inf.what);
      row('Input comes from', inf.from);
      row('Output goes to', inf.to);
      row('Why it is there', inf.why);
      row('If you change it', inf.change);
    } else row('What it does', 'No explanation written for this table yet.');
    /* the sheets that use it: open the drawing */
    const shs = [...new Set([...us.map(u => u.sh.name), ...(p.sh || [])])];
    if (shs.length) {
      const box = E('div', { cls: 'fxchips' });
      shs.forEach(n =>
        box.append(
          E('button', {
            cls: 'fxchip',
            txt: n,
            title: 'Open ' + n + ' (the F(X) block of this table is on it)',
            on: () => {
              close();
              try {
                if (window.lsSetTab) lsSetTab('logic');
                if (AN.cat !== 'an') AN.setCat('an');
                const i = AN.sheets.findIndex(s => s.name === n);
                if (i >= 0) AN.go(i);
              } catch (e) {}
            }
          })
        )
      );
      sec.append(E('div', { cls: 'fxrow' }, [E('h4', { txt: 'Used on' }), box]));
    }
    /* the signal path read from the drawings */
    const lst = (h, L) => {
      if (!L || !L.length) return;
      const ul = E('ul', { cls: 'fxpath' });
      L.forEach(([n, d]) => {
        const li = E('li');
        const b = E('button', { cls: 'fxtag', txt: n, title: 'Info card of ' + n });
        b.onclick = () => {
          if (!(window.lsInfo && lsInfo(n, { look: 1 }))) b.title = 'Not found in the I/O or memory lists';
        };
        li.append(b);
        if (d) li.append(E('span', { txt: ' ' + d }));
        ul.append(li);
      });
      sec.append(E('div', { cls: 'fxrow' }, [E('h4', { txt: h }), ul]));
    };
    lst('Signals before it (read from the drawing)', [...(p.in || []).map(n => [n, 'input of the F(X) block']), ...(p.up || [])]);
    lst('Signals after it (read from the drawing)', p.dn);
    sec.append(
      E('p', {
        cls: 'fxnote',
        txt: 'Source: ' + (t.src || 'LINEAR CURVE workbook (document-references/linear-curves-fx.xls), sheet ' + t.key) + '. The signal lists are read from the drawings in this app; a signal that comes through a page link is shown on the next sheet.'
      })
    );
    return sec;
  }
  /* ---------- live point ---------- */
  /* the page starts under the top bar, whose height changes with the page and the mode (VIEW ribbon / RUN row) */
  function fit() {
    const g = $('gsbar'),
      f = $('sfoot');
    if (!ws || !g) return;
    const top = Math.round(g.getBoundingClientRect().bottom),
      bot = f && f.offsetParent !== null ? Math.round(innerHeight - f.getBoundingClientRect().top) : 0;
    if (ws.style.top !== top + 'px') ws.style.top = top + 'px';
    if (ws.style.bottom !== bot + 'px') ws.style.bottom = bot + 'px';
  }
  function live() {
    fit();
    const t = cur && byKey(cur),
      el = $('fxlive');
    if (!t || !el) return;
    const u = users(t).find(x => x.S.rt && x.S.rt.st && x.S.rt.st[x.b.id] && isFinite(x.S.rt.st[x.b.id].fxx));
    if (!u) {
      el.textContent = 'Live: open a sheet that uses it and press Run to see the point.';
      el.classList.remove('on');
      if (!$('fxtry') || $('fxtry').value === '') mark(t, null);
      return;
    }
    const fxx = +u.S.rt.st[u.b.id].fxx,
      x = toX(t, fxx),
      y = u.b.o && u.b.o[0] != null ? +u.S.rt.v[u.b.o[0]] : interp(t.p2, x);
    el.textContent = 'Live on ' + u.sh.name + ': input ' + f2(x) + ' ' + unit(t.xu) + ' → output ' + f2(y) + ' ' + yU(t);
    el.classList.add('on');
    if (!$('fxtry') || $('fxtry').value === '') mark(t, x);
  }
  function resetAll() {
    if (!Object.keys(AN.lne || {}).length) return;
    AN.lne = {};
    save();
    if (cur) show(cur);
  }
  function close() {
    if (!ws) return;
    ws.classList.remove('open');
    document.body.classList.remove('fxopen');
    clearInterval(tmr);
    tmr = null;
  }
  function open(k) {
    if (!window.AN || !AN.lnTables || !tables().length) return false;
    if (!ws) build();
    ws.classList.add('open');
    document.body.classList.add('fxopen');
    let k0 = k;
    try {
      k0 = k0 || localStorage.getItem('ls-fx');
    } catch (e) {}
    if (!byKey(k0)) k0 = tables().slice().sort((a, b) => order(a) - order(b))[0].key;
    fit();
    show(k0);
    clearInterval(tmr);
    tmr = setInterval(live, 1000);
    return true;
  }
  addEventListener('resize', () => ws && ws.classList.contains('open') && fit());
  window.lsFx = open;
})();
