/* 3.2.1 (user 2026-11-05, mockup https://claude.ai/artifact/LZf2whSWvZqX7ncNnYGy27 approved): LOOP CHECK SPLIT VIEW, "test per point, per
   press": the HMI (Plant view workspace) on the left and the logic sheet on the right, both live; below them the TAG TABLE of one batch (one
   DITL drawing: every input and output row, where else its address is used, DITL and ABC), the CONTROLLER TAGS (Static = settings, not
   live; Dynamic = PV / SV / MV / mode, live) and ALARMS AND EVENTS of the batch (the Events log, lsEvents). The test goes by batch, each
   with its progress and an overall one (kept in this browser). Every divider is dragged; each panel docks or floats (View menu).
   A faceplate opened on the HMI opens its drawing on the right and makes it the batch. */
(function () {
  const ls = {
    get: (k, d) => {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    }
  };
  const call = (f, d) => {
    try {
      return f();
    } catch (e) {
      return d;
    }
  };
  const E = (t, c, x) => {
    const e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };
  const Bt = (t, title, on) => {
    const b = E('button', '', t);
    b.type = 'button';
    if (title) b.title = title;
    if (on) b.onclick = on;
    return b;
  };
  const D = () => window.LS_DOCK;
  const DEF = { x: 0.5, b: 300, t: 0.64, hide: {}, fl: {}, pos: {} };
  let L = Object.assign({}, DEF, ls.get('ls-spl-lay', {}));
  let on = false,
    batch = ls.get('ls-spl-batch', ''),
    ctlTag = '';
  /* results: { sheetName: { row key: { exp: 0|1|null, seen: [0|1] } } } */
  const R = ls.get('ls-spl-res', {});
  const save = () => (ls.set('ls-spl-lay', L), ls.set('ls-spl-res', R), ls.set('ls-spl-batch', batch));
  const els = {};
  const PAN = [
    ['hmi', 'HMI'],
    ['logic', 'Logic'],
    ['tags', 'Tag tables'],
    ['ev', 'Alarms and events']
  ];
  /* ---------- the batch: one DITL drawing ---------- */
  const allD = () => call(() => S.sheets.concat((window.WORLD && WORLD.inst) || []).filter(s => /DITL/.test(s.name)), []);
  const dName = s => call(() => D().dName(s), s.name.replace(/^\(\d+\)/, ''));
  const sheet = () => (batch ? call(() => D().dOf(batch), null) : null);
  const tagOf = I => (I && (I.tag || (/^\s*([IMOB]\.[0-9A-F]{4})\b/.exec(I.svc || '') || [])[1])) || '';
  function usedIn(s, row, adr, out) {
    const L2 = [];
    if (adr)
      for (const x of allD()) {
        for (let r = 0; r < 64; r++) {
          const I = call(() => DUI.rowInfo(x, r), null);
          if (!I || tagOf(I) !== adr) continue;
          if (x === s && r === row && !out) continue;
          L2.push(dName(x) + ' r' + (r + 1));
        }
      }
    const W = window.WORLD && WORLD.idx;
    if (W && out) for (const e of W.ain || []) if (e.d === s && e.row === row) L2.push(e.sh + (e.ref ? ' (' + e.ref + ')' : ''));
    if (W && !out && W.din && W.din.get) for (const e of W.din.get(s) || []) if (e && e.row === row) L2.push((e.sh && e.sh.name ? e.sh.name : e.sh || 'ABC') + '');
    return [...new Set(L2)];
  }
  let rowsC = null,
    rowsK = '';
  function rows() {
    const s = sheet();
    if (!s) return [];
    if (rowsK === s.name && rowsC) return rowsC;
    const L2 = [];
    for (let r = 0; r < 64; r++) {
      const I = call(() => DUI.rowInfo(s, r), null);
      if (!I || !(I.tag || I.svc)) continue;
      const adr = tagOf(I);
      L2.push({ k: 'i' + r, adr: adr || 'r' + (r + 1), name: String(I.svc || '').replace(/^\s*[IMOB]\.[0-9A-F]{4}\s*/, ''), where: [dName(s) + ' r' + (r + 1)].concat(usedIn(s, r, adr, false)), v: () => call(() => DUI.rowVal(s, r), null) });
    }
    for (const o of call(() => DUI.outs(s), []) || []) {
      const nm = String(o.name || '').replace(/^Output row \d+ · /, '');
      L2.push({ k: 'o' + o.row, adr: 'OUT' + (o.row + 1), name: nm, where: [dName(s) + ' output'].concat(usedIn(s, o.row, '', true)), v: () => call(() => DUI.outVal(s, o.row), null) });
    }
    rowsK = s.name;
    rowsC = L2;
    return L2;
  }
  const res = () => (R[batch] = R[batch] || {});
  function prog(b) {
    const r = R[b] || {};
    let n = 0,
      ok = 0;
    for (const k in r) if (r[k].exp != null) (n++, r[k].ok && ok++);
    return { n, ok };
  }
  /* ---------- the controller of the batch (an ABC PID / MAN station named on the faceplate) ---------- */
  function ctl() {
    if (!ctlTag || !window.AN) return null;
    for (const sh of AN.sheets || []) {
      const S2 = call(() => AN.ensure(sh), null);
      if (!S2) continue;
      const c = (call(() => AN.hmiCtrls(S2), []) || []).find(c => c.tag === ctlTag);
      if (!c) continue;
      const p = (c.b && c.b.p) || {},
        v = n => (n == null ? null : S2.rt.v[n]),
        man = (c.modes || []).find(m => m.kind === 'MAN'),
        loc = (c.modes || []).find(m => m.kind === 'LOC');
      const md = man && S2.rt.v[man.n] > 0.5 ? 'MAN' : 'AUTO';
      return { sh: sh.name, p, pv: v(c.q && c.q.pv), sv: v(c.q && c.q.sv), mv: v(c.out), md: md + (loc && S2.rt.v[loc.n] > 0.5 ? ' · LOC' : '') };
    }
    return null;
  }
  /* ---------- the panels ---------- */
  function panel(id, title) {
    const p = E('div', 'pan splp');
    p.dataset.p = id;
    const ph = E('div', 'ph'),
      tt = E('b', '', title),
      d = E('span', 'd'),
      g = E('span', 'g'),
      fb = Bt(L.fl[id] ? 'Dock' : 'Float', 'Float this panel as its own window, or dock it back', () => setFloat(id, !L.fl[id])),
      hb = Bt('✕', 'Hide this panel (View menu shows it again)', () => setHide(id, true));
    hb.setAttribute('aria-label', 'Hide ' + title);
    ph.append(tt, d, g, fb, hb);
    const bd = E('div', 'bd');
    p.append(ph, bd);
    p._d = d;
    p._bd = bd;
    p._fb = fb;
    return p;
  }
  function build() {
    if (els.bar) return;
    const bar = E('div');
    bar.id = 'splbar';
    const sel = E('select');
    sel.setAttribute('aria-label', 'Batch (one logic drawing)');
    sel.onfocus = () => fillSel();
    sel.onchange = () => setBatch(sel.value, true);
    const pv = Bt('‹', 'Previous batch', () => step(-1)),
      nx = Bt('›', 'Next batch', () => step(1));
    pv.setAttribute('aria-label', 'Previous batch');
    nx.setAttribute('aria-label', 'Next batch');
    const pb = E('div', 'pg'),
      pa = E('div', 'pg all');
    pb.append(E('span'), E('i'));
    pb.lastChild.append(E('b'));
    pa.append(E('span'), E('i'));
    pa.lastChild.append(E('b'));
    const vw = Bt('View ▾', 'Show / hide, dock / float each panel', e => (e.stopPropagation(), menu()));
    const cs = Bt('Export CSV', 'The results of every batch as a CSV file', exportCsv);
    const ex = Bt('Close split', 'Back to the normal Logic page', () => toggle(false));
    bar.append(E('span', 'st', 'Loop check'), E('span', 'st', 'Batch'), sel, pv, nx, pb, pa, E('span', 'gap'), vw, cs, ex);
    const vd = E('div');
    vd.id = 'splvd';
    vd.setAttribute('aria-label', 'Drag to resize the HMI and the logic');
    const hd = E('div');
    hd.id = 'splhd';
    hd.setAttribute('aria-label', 'Drag to resize the height of the tables');
    const bot = E('div');
    bot.id = 'splbot';
    const tg = panel('tags', 'Tag monitoring'),
      vd2 = E('div', 'vd2'),
      ev = panel('ev', 'Alarms and events');
    vd2.setAttribute('aria-label', 'Drag to resize the tables and the events');
    bot.append(tg, vd2, ev);
    const mn = E('div');
    mn.id = 'splmenu';
    document.body.append(bar, vd, hd, bot, mn);
    Object.assign(els, { bar, sel, pb, pa, vd, hd, bot, tg, vd2, ev, mn, vw });
    drag(vd, (dx, dy, s) => ((L.x = Math.max(0.15, Math.min(0.85, (s.x + dx) / workW()))), layout()), () => ({ x: L.x * workW() }));
    drag(hd, (dx, dy, s) => ((L.b = Math.max(120, Math.min(innerHeight * 0.75, s.b - dy))), layout()), () => ({ b: L.b }));
    drag(vd2, (dx, dy, s) => ((L.t = Math.max(0.2, Math.min(0.85, (s.t + dx) / workW()))), layout()), () => ({ t: L.t * workW() }));
    document.addEventListener('click', e => {
      if (!mn.contains(e.target) && e.target !== vw) mn.classList.remove('open');
    });
  }
  const railW = () => call(() => document.querySelector('.tabs').getBoundingClientRect().right, 57) || 57;
  const workW = () => innerWidth - railW();
  function drag(h, mv, st0) {
    h.addEventListener('pointerdown', e => {
      e.preventDefault();
      const x0 = e.clientX,
        y0 = e.clientY,
        s = st0();
      h.setPointerCapture(e.pointerId);
      const m = ev => mv(ev.clientX - x0, ev.clientY - y0, s);
      const u = () => (h.removeEventListener('pointermove', m), h.removeEventListener('pointerup', u), save(), layout());
      h.addEventListener('pointermove', m);
      h.addEventListener('pointerup', u);
    });
  }
  function layout() {
    if (!els.bar) return;
    const R2 = document.documentElement.style,
      rw = railW(),
      ww = innerWidth - rw,
      botOn = on && !(L.hide.tags && L.hide.ev) && !(L.fl.tags && L.fl.ev) && !(L.hide.tags && L.fl.ev) && !(L.fl.tags && L.hide.ev);
    R2.setProperty('--railW', rw + 'px');
    R2.setProperty('--spl-x', Math.round(L.x * ww) + 'px');
    R2.setProperty('--spl-bv', (botOn ? Math.round(L.b) : 0) + 'px');
    document.body.classList.toggle('spl-nohmi', !!L.hide.hmi);
    document.body.classList.toggle('spl-nologic', !!L.hide.logic);
    for (const x of [els.bar]) x.style.display = on ? 'flex' : 'none';
    els.vd.style.display = on && !L.hide.hmi && !L.hide.logic ? 'block' : 'none';
    els.hd.style.display = on && botOn ? 'block' : 'none';
    els.bot.style.display = on && botOn ? 'flex' : 'none';
    /* the two lower panels: docked side by side (the divider between them), floating or hidden */
    for (const [id, p] of [
      ['tags', els.tg],
      ['ev', els.ev]
    ]) {
      const hid = !!L.hide[id] || !on,
        fl = !!L.fl[id];
      p._fb.textContent = fl ? 'Dock' : 'Float';
      if (fl && !hid) {
        if (p.parentElement !== document.body) document.body.append(p);
        p.classList.add('splfl');
        const ps = L.pos[id] || { x: 200 + (id === 'ev' ? 460 : 0), y: 200, w: 520, h: 300 };
        Object.assign(p.style, { left: ps.x + 'px', top: ps.y + 'px', width: ps.w + 'px', height: ps.h + 'px', display: 'flex', flex: '' });
        if (!p._mv) {
          p._mv = 1;
          p.querySelector('.ph').addEventListener('pointerdown', e => {
            if (e.target.closest('button') || !p.classList.contains('splfl')) return;
            const x0 = e.clientX - p.offsetLeft,
              y0 = e.clientY - p.offsetTop;
            const m = ev => ((p.style.left = Math.max(0, ev.clientX - x0) + 'px'), (p.style.top = Math.max(0, ev.clientY - y0) + 'px'));
            const u = () => (removeEventListener('pointermove', m), removeEventListener('pointerup', u), keepPos(id, p));
            addEventListener('pointermove', m);
            addEventListener('pointerup', u);
          });
          new ResizeObserver(() => p.classList.contains('splfl') && keepPos(id, p)).observe(p);
        }
      } else {
        p.classList.remove('splfl');
        if (p.parentElement !== els.bot) els.bot.insertBefore(p, id === 'tags' ? els.vd2 : null);
        Object.assign(p.style, { left: '', top: '', width: '', height: '', display: hid ? 'none' : 'flex' });
      }
    }
    const tgD = !L.hide.tags && !L.fl.tags,
      evD = !L.hide.ev && !L.fl.ev;
    els.tg.style.flex = tgD ? (evD ? '0 0 ' + Math.round(L.t * ww) + 'px' : '1 1 0') : '';
    els.ev.style.flex = evD ? '1 1 0' : '';
    els.vd2.style.display = tgD && evD ? 'block' : 'none';
    /* the HMI graphic and the logic canvas fit their new size (our own resize event is not laid out again) */
    selfRs = true;
    dispatchEvent(new Event('resize'));
    selfRs = false;
  }
  let selfRs = false;
  const keepPos = (id, p) => ((L.pos[id] = { x: p.offsetLeft, y: p.offsetTop, w: p.offsetWidth, h: p.offsetHeight }), save());
  function setFloat(id, v) {
    L.fl[id] = !!v;
    save();
    layout();
    menuPaint();
  }
  function setHide(id, v) {
    L.hide[id] = !!v;
    save();
    layout();
    menuPaint();
  }
  /* ---------- the View menu ---------- */
  function menu() {
    menuPaint();
    const r = els.vw.getBoundingClientRect();
    Object.assign(els.mn.style, { left: Math.max(8, r.right - 330) + 'px', top: r.bottom + 6 + 'px' });
    els.mn.classList.toggle('open');
  }
  function menuPaint() {
    const m = els.mn;
    if (!m) return;
    m.textContent = '';
    m.append(E('div', 'st', 'View · panels'));
    for (const [id, nm] of PAN) {
      const r = E('div', 'r'),
        cb = E('input');
      cb.type = 'checkbox';
      cb.id = 'splv-' + id;
      cb.checked = !L.hide[id];
      cb.onchange = () => setHide(id, !cb.checked);
      const lb = E('label', '', nm);
      lb.htmlFor = cb.id;
      const sg = E('div', 'seg');
      if (id === 'tags' || id === 'ev') {
        const a = Bt('Dock', '', () => setFloat(id, false)),
          b = Bt('Float', '', () => setFloat(id, true));
        a.classList.toggle('on', !L.fl[id]);
        b.classList.toggle('on', !!L.fl[id]);
        sg.append(a, b);
      } else if (id === 'hmi') {
        /* the HMI floats as its own window: the PLANT VIEW window of the app */
        const a = Bt('Dock', '', null),
          b = Bt('Float', 'The HMI in its own window (PLANT VIEW window); Dock in that window brings it back', () => call(() => window.lsPlantWindow && lsPlantWindow()));
        a.classList.add('on');
        sg.append(a, b);
      } else {
        const a = Bt('Dock', '', null);
        a.classList.add('on');
        sg.append(a);
      }
      r.append(cb, lb, sg);
      m.append(r);
    }
    const ft = E('div', 'ft');
    ft.append(
      Bt('Reset layout', 'Sizes and docks as at the start', () => ((L = Object.assign({}, DEF, { hide: {}, fl: {}, pos: {} })), save(), layout(), menuPaint())),
      Bt('Save layout', 'Keep this layout (it is kept in this browser)', () => (save(), m.classList.remove('open')))
    );
    m.append(ft);
  }
  /* ---------- batches ---------- */
  let list = null;
  function fillSel() {
    if (!list) list = allD().map(dName).filter((v, i, a) => a.indexOf(v) === i);
    const sel = els.sel;
    if (sel.options.length === list.length) return;
    sel.textContent = '';
    for (const n of list) {
      const s = call(() => D().dOf(n), null),
        o = E('option', '', n + (s && s.title ? ' · ' + String(s.title).slice(0, 48) : ''));
      o.value = n;
      sel.append(o);
    }
    sel.value = batch;
  }
  function step(d) {
    fillSel();
    const i = Math.max(0, list.indexOf(batch));
    setBatch(list[(i + d + list.length) % list.length], true);
  }
  function setBatch(n, open) {
    if (!n) return;
    batch = n;
    rowsC = null;
    save();
    fillSel();
    if (els.sel) els.sel.value = n;
    if (open) call(() => D().openD(n, null));
    paint(true);
  }
  /* ---------- painting ---------- */
  let k0 = '';
  function paint(force) {
    if (!on) return;
    const s = sheet(),
      L2 = rows(),
      r = res();
    /* what was seen of each row (0 and 1), for the result and the progress */
    for (const x of L2) {
      const v = x.v();
      if (v !== 0 && v !== 1) continue;
      const q = (r[x.k] = r[x.k] || { exp: null, seen: [] });
      if (!q.seen.includes(v)) q.seen.push(v);
      q.ok = q.exp != null && v === q.exp;
      if (q.ok && !q.okT) q.okT = 1;
      x.now = v;
    }
    const p = prog(batch);
    let all = 0,
      allOk = 0;
    for (const b in R) {
      const q = prog(b);
      all += q.n;
      allOk += q.ok;
    }
    els.pb.firstChild.textContent = 'This batch · ' + p.ok + ' ✓ of ' + L2.length + ' signals';
    els.pb.lastChild.firstChild.style.width = (L2.length ? (100 * p.ok) / L2.length : 0) + '%';
    const nb = Object.keys(R).filter(b => prog(b).n).length;
    els.pa.firstChild.textContent = 'Overall · ' + allOk + ' ✓ · ' + nb + ' batch' + (nb === 1 ? '' : 'es') + ' started';
    els.pa.lastChild.firstChild.style.width = Math.min(100, all ? (100 * allOk) / Math.max(all, 1) : 0) + '%';
    els.tg._d.textContent = s ? dName(s) + (s.title ? ' · ' + s.title : '') : 'pick a batch, or open a faceplate on the HMI';
    const key = batch + '|' + L2.map(x => x.now + (r[x.k] && r[x.k].exp)).join('') + '|' + ctlTag;
    if (force || key !== k0) {
      k0 = key;
      tagTable(L2, r);
    }
    ctlPaint();
    evPaint();
  }
  function tagTable(L2, r) {
    const bd = els.tg._bd;
    const keep = bd.scrollTop;
    bd.textContent = '';
    if (!L2.length) {
      bd.append(E('div', 'empty', 'No batch yet: pick a drawing in Batch, or click a motor or valve on the HMI.'));
    } else {
      const t = E('table'),
        th = E('thead'),
        tr = E('tr');
      for (const h of ['Address', 'Signal', 'Used in (DITL / ABC)', 'Expected', 'Value · live', 'Seen', 'Result']) tr.append(E('th', '', h));
      th.append(tr);
      const tb = E('tbody');
      for (const x of L2) {
        const q = r[x.k] || { exp: null, seen: [] },
          row = E('tr');
        const exB = Bt(q.exp == null ? '–' : String(q.exp), 'Click: the value this signal must have in the step you test (– → 1 → 0)', () => {
          const q2 = (r[x.k] = r[x.k] || { exp: null, seen: [] });
          q2.exp = q2.exp == null ? 1 : q2.exp === 1 ? 0 : null;
          save();
          paint(true);
        });
        exB.className = 'ex';
        const ex = E('td');
        ex.append(exB);
        const vv = E('td', x.now === 1 ? 'v1' : x.now === 0 ? 'v0' : '', x.now == null ? '-----' : String(x.now));
        const rs = q.exp == null ? E('td', '', 'not yet') : x.now === q.exp ? E('td', 'ok', '✓') : E('td', 'bad', '✗');
        row.append(E('td', '', x.adr), E('td', 'n', x.name), E('td', 'n', x.where.join(', ')), ex, vv, E('td', '', (q.seen || []).slice().sort().join(' / ') || '—'), rs);
        if (q.exp != null && x.now === q.exp) row.className = 'chg';
        tb.append(row);
      }
      t.append(th, tb);
      bd.append(t);
    }
    /* the controller tags of the batch */
    const sub = E('div', 'sub');
    sub.append(E('b', '', 'Controller tags'), E('span', 'd', 'Static = settings (not live) · Dynamic = live values'));
    bd.append(sub);
    const ct = E('table');
    ct.id = 'splctl';
    bd.append(ct);
    bd.scrollTop = keep;
  }
  function ctlPaint() {
    const t = document.getElementById('splctl');
    if (!t) return;
    const c = ctl();
    const f = (x, d) => (x == null || !isFinite(+x) ? '-----' : (+x).toFixed(d == null ? 1 : d));
    const key = c ? [ctlTag, f(c.pv), f(c.sv), f(c.mv), c.md].join('|') : ctlTag || '-';
    if (t._k === key) return;
    t._k = key;
    t.textContent = '';
    const h = E('tr');
    for (const x of ['Tag', 'Range', 'P · I · D', 'Alarm H / L', 'Action', 'PV', 'SV', 'MV', 'Mode']) h.append(E('th', '', x));
    const th = E('thead');
    th.append(h);
    t.append(th);
    const tb = E('tbody'),
      r = E('tr');
    if (!c) {
      const td = E('td', 'n', ctlTag ? ctlTag + ': not found in the ABC sheets' : 'Open a controller faceplate on the HMI to show it here.');
      td.colSpan = 9;
      r.append(td);
    } else {
      const p = c.p,
        u = p.unit || '';
      r.append(
        E('td', '', ctlTag + ' · ' + c.sh),
        E('td', '', f(p.rlo, 0) + ' – ' + f(p.rhi, 0) + ' ' + u),
        E('td', '', [p.kp, p.ti, p.td].map(x => (x == null ? '-' : x)).join(' · ')),
        E('td', '', (p.ph == null ? '-' : p.ph) + ' / ' + (p.pl == null ? '-' : p.pl)),
        E('td', '', p.act === 1 ? 'reverse' : p.act === 0 ? 'direct' : '-'),
        E('td', 'v1', f(c.pv) + ' ' + u),
        E('td', 'v1', f(c.sv)),
        E('td', 'v1', f(c.mv) + ' %'),
        E('td', 'v1', c.md)
      );
    }
    tb.append(r);
    t.append(tb);
  }
  let evN = -1,
    evB = '';
  function evPaint() {
    const LOG = window.lsEvents || [];
    const s = sheet(),
      nm = s ? dName(s) : '',
      L2 = rows();
    if (LOG.length === evN && evB === batch) return;
    evN = LOG.length;
    evB = batch;
    const bd = els.ev._bd;
    bd.textContent = '';
    /* the events of the batch: its drawing, or a text that names one of its signals or the machine on its faceplate */
    const names = new Set(L2.map(x => x.adr).filter(a => /^[IMB]\./.test(a)));
    const hit = e => {
      const t = String(e.text || ''),
        sh = String(e.sh || '').replace(/^\(\d+\)/, '');
      if (nm && (sh === nm || t.includes(nm))) return true;
      for (const a of names) if (t.includes(a)) return true;
      return !!(els._mach && t.includes(els._mach));
    };
    const ev = LOG.filter(hit).slice(-200).reverse();
    els.ev._d.textContent = nm ? nm + ' · ' + ev.length : 'this batch';
    if (!ev.length) bd.append(E('div', 'empty', 'No event of this batch yet. Every press, field action, alarm and return shows here.'));
    for (const e of ev) {
      const alm = /ALM|TRIP/.test(e.kind || '') && !/RTN/.test(e.kind || '');
      const r = E('div', 'ev' + (alm ? ' alm' : ''));
      r.append(E('span', 't', e.t || ''), E('span', 'k', e.kind === 'ALM' ? 'ALARM' : e.kind || ''), E('span', '', (e.sh ? String(e.sh).replace(/^\(\d+\)/, '') + ' · ' : '') + (e.text || '')));
      bd.append(r);
    }
  }
  /* ---------- CSV ---------- */
  function exportCsv() {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const lines = [['Batch', 'Address / row', 'Expected', 'Seen', 'Result'].map(q).join(',')];
    for (const b in R)
      for (const k in R[b]) {
        const x = R[b][k];
        lines.push([b, k, x.exp == null ? '' : x.exp, (x.seen || []).join('/'), x.exp == null ? 'not yet' : x.ok ? 'OK' : 'NOT OK'].map(q).join(','));
      }
    const a = E('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    a.download = 'loop-check-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
  }
  /* ---------- on / off ---------- */
  function toggle(v) {
    on = v == null ? !on : !!v;
    build();
    wrapPlant();
    document.body.classList.toggle('lssplit', on);
    if (els.rb) els.rb.classList.toggle('on', on);
    if (on) {
      call(() => window.lsSetTab && lsSetTab('logic'));
      call(() => window.lsPlant && plantRaw(true));
      if (batch) call(() => D().openD(batch, null));
    } else {
      els.mn.classList.remove('open');
      for (const id of ['tags', 'ev']) if (els[id === 'tags' ? 'tg' : 'ev'].parentElement === document.body) els.bot.append(els[id === 'tags' ? 'tg' : 'ev']);
    }
    ls.set('ls-spl-on', on);
    layout();
    if (!on) {
      for (const p of [els.tg, els.ev]) p.style.display = 'none';
      call(() => window.lsPlant && plantRaw(false));
    }
    paint(true);
  }
  /* the Logic page hides the Plant view workspace (app.js setTab: plant(false)); in the split both stay */
  let plantRaw = null;
  function wrapPlant() {
    if (window.lsPlant && !window.lsPlant._spl) {
      plantRaw = window.lsPlant;
      const w = v => (on && v === false ? undefined : plantRaw(v));
      w._spl = 1;
      window.lsPlant = w;
    }
  }
  function hook() {
    wrapPlant();
    /* another page of the rail (Home, Library, Training, Plant view alone) closes the split */
    const t = document.body.dataset.tab;
    if (on && t && t !== 'logic') toggle(false);
    /* a faceplate opened on the HMI: its drawing on the right, and the batch */
    const F = window.LS_FPOP;
    if (F && !F._spl) {
      F._spl = 1;
      for (const k of ['motor', 'mov', 'pb', 'field', 'tcs']) {
        const f0 = F[k];
        if (typeof f0 !== 'function') continue;
        F[k] = function (P) {
          const r = f0.apply(this, arguments);
          if (on && P) {
            const d = P.ad || P.d;
            els._mach = P.n || '';
            const nm = d && call(() => D().dName(D().dOf(d)), null);
            if (nm && /DITL/.test(nm)) setBatch(nm, true);
          }
          return r;
        };
      }
    }
    /* a controller faceplate of the HMI (plant.js #plfp): its tag for the controller table */
    const fp = document.getElementById('plfp');
    const tg = fp && fp.isConnected ? (fp.querySelector('b') || {}).textContent : '';
    if (on && tg && tg !== ctlTag && /^[A-Z]{2,}[-A-Z]*\d/.test(tg)) {
      ctlTag = tg.trim();
      k0 = '';
    }
  }
  function railBtn() {
    if (els.rb) return true;
    const lc = [...document.querySelectorAll('.tabs button')].find(b => b.textContent.trim() === 'Loop check');
    if (!lc) return false;
    const b = E('button', '', 'Split');
    b.type = 'button';
    b.title = 'Loop check split view: HMI | logic side by side, the tag table, the controller tags and the events of one batch';
    b.dataset.ic = 'columns';
    b.setAttribute('aria-label', 'Loop check split view');
    b.onclick = () => toggle();
    lc.after(b);
    els.rb = b;
    return true;
  }
  addEventListener('resize', () => on && !selfRs && layout());
  setInterval(() => {
    try {
      hook();
      paint(false);
    } catch (e) {}
  }, 400);
  const boot = () => (railBtn() ? 0 : setTimeout(boot, 500));
  setTimeout(boot, 600);
  window.LS_SPLIT = { toggle, setBatch, get on() {
      return on;
    }, get batch() {
      return batch;
    }, rows: () => rows().map(x => ({ adr: x.adr, name: x.name, where: x.where, v: x.v() })), get layout() {
      return L;
    } };
})();
