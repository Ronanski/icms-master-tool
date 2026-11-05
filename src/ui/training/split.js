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
    ctlTag = '',
    fpTag = '';
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
  /* ---------- the batch: one EQUIPMENT of the HMI pages (user 2026-11-05 "per equipment lang na batch"): every signal of its
     drawing(s), only the rows of that machine when a drawing holds several (DITL-113: 3 compressors, DITL-45: 2 dryers) ---------- */
  const allD = () =>
    call(() => S.sheets.concat((window.WORLD && WORLD.inst) || []).filter(s => /DITL/.test(s.name)), []);
  const dName = s => call(() => D().dName(s), s.name.replace(/^\(\d+\)/, ''));
  const tagOf = I => (I && (I.tag || (/^\s*([IMOB]\.[0-9A-F]{4})\b/.exec(I.svc || '') || [])[1])) || '';
  let EQ = null;
  function eqList() {
    if (EQ && EQ.length) return EQ;
    const L2 = [],
      defs = (window.LS_MOCK && LS_MOCK.defs) || [],
      order = (window.PLANT_SYS || []).map(x => x.id),
      ds = defs.slice().sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    const nm = ad => call(() => dName(D().dOf(ad)), null);
    const pre = t =>
      String(t || '')
        .replace(/^Output row \d+ · /, '')
        .replace(/\s*(RUNNING|IN OPERATION)\b.*$/, '')
        .trim();
    for (const def of ds)
      for (const id in def.mach || {}) {
        const m = def.mach[id];
        const e = {
          key: def.id + ':' + id,
          page: def.title || def.id,
          n: m.n,
          t: m.t || '',
          sh: [],
          filt: '',
          ctl: m.ctl || ''
        };
        if (m.sti) {
          const s = call(() => D().dOf(m.sti[0]), null);
          e.sh.push(m.sti[0]);
          e.filt = s ? pre(call(() => DUI.rowInfo(s, m.sti[1]).svc, '')) : '';
        } else if (m.sto) {
          const s = call(() => D().dOf(m.sto[0]), null),
            o = s && (call(() => DUI.outs(s), []) || []).find(q => q.row === m.sto[1]);
          e.sh.push(m.sto[0]);
          e.filt = o ? pre(o.name) : '';
        } else if (m.mov) {
          e.sh.push(m.mov);
          e.own = m.tg || m.n;
        } else if (m.ad && !m.fld && !/@/.test(m.ad)) {
          const a = nm(m.ad);
          if (a) e.sh.push(a);
          if (m.d && /DITL/.test(m.d) && m.d !== a && nm(m.d)) e.sh.push(m.d);
        } else if (m.df && m.d) e.sh.push(m.d);
        if (!e.sh.length && !e.ctl) continue;
        L2.push(e);
      }
    EQ = L2;
    return L2;
  }
  const eq = () => eqList().find(e => e.key === batch) || null;
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
    if (W && out)
      for (const e of W.ain || []) if (e.d === s && e.row === row) L2.push(e.sh + (e.ref ? ' (' + e.ref + ')' : ''));
    if (W && !out && W.din && W.din.get)
      for (const e of W.din.get(s) || [])
        if (e && e.row === row) L2.push((e.sh && e.sh.name ? e.sh.name : e.sh || 'ABC') + '');
    return [...new Set(L2)];
  }
  let rowsC = null,
    rowsK = '';
  function rows() {
    const e = eq();
    if (!e) return [];
    if (rowsK === e.key && rowsC) return rowsC;
    const L2 = [];
    /* user 2026-11-05 "dapat nagrereflect ung command mo sa controller doon mismo sa logic": a controller batch (no DITL drawing) = the
       signals of its PID on the ABC sheet: the mode inputs (TAG.MAN / .LOC / .REM, 0 / 1, the same nets the faceplate writes), the A/M
       station select signals, then PV, SV and MV live from the sheet */
    if (!e.sh.length && e.ctl) {
      const F = ctlFind(e.ctl);
      if (F) {
        const { sh, S2, c } = F,
          nv = n => () => call(() => S2.rt.v[n], null),
          dg = n => () => {
            const v = call(() => S2.rt.v[n], null);
            return v == null ? null : v > 0.5 ? 1 : 0;
          },
          lb = n => (S2.lab[n] && S2.lab[n].t) || '(no tag on the drawing)';
        for (const m of c.modes || [])
          L2.push({
            k: sh.name + ':m' + m.n,
            adr: m.name,
            name: 'Mode ' + m.kind + ' (faceplate button)',
            where: [sh.name],
            v: dg(m.n)
          });
        for (const g of c.sigs || [])
          L2.push({
            k: sh.name + ':s' + g.n,
            adr: /^n\d+$/.test(g.name) ? '(no tag)' : g.name,
            name: 'Auto / manual station select (' + g.role + ' leg)',
            where: [sh.name],
            v: dg(g.n)
          });
        const u = (c.b && c.b.p && c.b.p.unit) || '';
        if (c.q && c.q.pv != null)
          L2.push({
            k: sh.name + ':pv',
            adr: 'PV',
            an: u,
            name: 'Process value · ' + lb(c.q.pv),
            where: [sh.name],
            v: nv(c.q.pv)
          });
        if (c.q && c.q.sv != null)
          L2.push({
            k: sh.name + ':sv',
            adr: 'SV',
            an: u,
            name: 'Set value · ' + lb(c.q.sv),
            where: [sh.name],
            v: nv(c.q.sv)
          });
        if (c.out != null)
          L2.push({
            k: sh.name + ':mv',
            adr: 'MV',
            an: '%',
            name: 'Output to the valve / drive · ' + lb(c.out),
            where: [sh.name],
            v: nv(c.out)
          });
      }
      rowsK = e.key;
      rowsC = L2;
      return L2;
    }
    const mine = t => {
      t = String(t || '');
      if (e.filt) return t.includes(e.filt);
      if (e.own) return !/(?:XV|MV)-[A-Z]{2}\d{4}/.test(t) || t.includes(e.own);
      return true;
    };
    for (const nm of e.sh) {
      const s = call(() => D().dOf(nm), null);
      if (!s) continue;
      const dn = dName(s);
      for (let r = 0; r < 64; r++) {
        const I = call(() => DUI.rowInfo(s, r), null);
        if (!I || !(I.tag || I.svc) || !mine(I.svc)) continue;
        const adr = tagOf(I);
        L2.push({
          k: dn + ':i' + r,
          adr: adr || 'r' + (r + 1),
          name: String(I.svc || '').replace(/^\s*[IMOB]\.[0-9A-F]{4}\s*/, ''),
          where: [dn + ' r' + (r + 1)].concat(usedIn(s, r, adr, false)),
          v: () => call(() => DUI.rowVal(s, r), null)
        });
      }
      for (const o of call(() => DUI.outs(s), []) || []) {
        const n2 = String(o.name || '').replace(/^Output row \d+ · /, '');
        if (!mine(n2)) continue;
        L2.push({
          k: dn + ':o' + o.row,
          adr: 'OUT' + (o.row + 1),
          name: n2,
          where: [dn + ' output'].concat(usedIn(s, o.row, '', true)),
          v: () => call(() => DUI.outVal(s, o.row), null)
        });
      }
    }
    rowsK = e.key;
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
  /* the ABC sheet of a controller tag (its PID block): { sh, S2, c } */
  const ctlMemo = {};
  function ctlFind(tag) {
    if (!tag || !window.AN) return null;
    /* the ABC sheets load in the background only when the ABC page is opened (loader.js): start it here, then paint again */
    if (!(AN.sheets || []).length) {
      if (!ctlFind.p)
        ctlFind.p = call(
          () =>
            (AN.data || AN.loadData()).then(() => {
              rowsC = null;
              k0 = '';
              const e = eq();
              /* a controller batch picked before the sheets were there: open its ABC sheet now */
              if (on && e && !e.sh.length && e.ctl) setBatch(batch, true, true);
              else paint(true);
            }),
          null
        );
      return null;
    }
    const m = ctlMemo[tag];
    if (m) {
      const S2 = call(() => AN.ensure(m.sh), null);
      const c = m.c || (S2 && (call(() => AN.hmiCtrls(S2), []) || []).find(c => c.tag === tag));
      if (S2 && c) return { sh: m.sh, S2, c };
    }
    for (const sh of AN.sheets || []) {
      const S2 = call(() => AN.ensure(sh), null);
      if (!S2) continue;
      const c = (call(() => AN.hmiCtrls(S2), []) || []).find(c => c.tag === tag);
      if (!c) continue;
      ctlMemo[tag] = { sh };
      return { sh, S2, c };
    }
    /* not a PID: a MAN station of the ABC sheets (HIC-BM, EIC-TM, HIC-ULD, HICDO1012 ...), as plant.js links them to the faceplate */
    for (const sh of AN.sheets || []) {
      const S2 = call(() => AN.ensure(sh), null);
      if (!S2) continue;
      const b = (S2.blk || []).find(
        b =>
          b.k === 'MAN' &&
          b.o &&
          b.o[0] != null &&
          (b.tag || (b.txt || []).find(x => x && x !== 'MAN' && !/^S\d-MDL/.test(x))) === tag
      );
      if (!b) continue;
      const modes = [];
      let pv = null;
      (S2.lab || []).forEach((l, n) => {
        const t = l && l.t ? l.t.trim() : '';
        const k = t.startsWith(tag + '.') ? t.slice(tag.length + 1).toUpperCase() : '';
        if (/^(MAN|LOC|REM|AUTO|AUT|LOCAL|REMOTE|MANUAL)$/.test(k) && !modes.some(z => z.n === n || z.name === t))
          modes.push({ n, name: t, kind: k });
        if (k === 'PV' && pv == null) pv = n;
      });
      const c = { tag, b, q: { pv, sv: null }, modes, sigs: [], out: b.o[0], man: 1 };
      ctlMemo[tag] = { sh, c };
      return { sh, S2, c };
    }
    return null;
  }
  function ctl() {
    const F = ctlFind(ctlTag);
    if (!F) return null;
    {
      const sh = F.sh,
        S2 = F.S2,
        c = F.c;
      const p = (c.b && c.b.p) || {},
        v = n => (n == null ? null : S2.rt.v[n]),
        man = (c.modes || []).find(m => m.kind === 'MAN'),
        loc = (c.modes || []).find(m => m.kind === 'LOC');
      const md = man && S2.rt.v[man.n] > 0.5 ? 'MAN' : 'AUTO';
      return {
        sh: sh.name,
        p,
        pv: v(c.q && c.q.pv),
        sv: v(c.q && c.q.sv),
        mv: v(c.out),
        md: md + (loc && S2.rt.v[loc.n] > 0.5 ? ' · LOC' : '')
      };
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
      fb = Bt(L.fl[id] ? 'Dock' : 'Float', 'Float this panel as its own window, or dock it back', () =>
        setFloat(id, !L.fl[id])
      ),
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
    bar.append(
      E('span', 'st', 'Loop check'),
      E('span', 'st', 'Batch'),
      sel,
      pv,
      nx,
      pb,
      pa,
      E('span', 'gap'),
      vw,
      cs,
      ex
    );
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
    drag(
      vd,
      (dx, dy, s) => ((L.x = Math.max(0.15, Math.min(0.85, (s.x + dx) / workW()))), layout()),
      () => ({ x: L.x * workW() })
    );
    drag(
      hd,
      (dx, dy, s) => ((L.b = Math.max(120, Math.min(innerHeight * 0.75, s.b - dy))), layout()),
      () => ({ b: L.b })
    );
    drag(
      vd2,
      (dx, dy, s) => ((L.t = Math.max(0.2, Math.min(0.85, (s.t + dx) / workW()))), layout()),
      () => ({ t: L.t * workW() })
    );
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
      const u = () => (
        h.removeEventListener('pointermove', m),
        h.removeEventListener('pointerup', u),
        save(),
        layout()
      );
      h.addEventListener('pointermove', m);
      h.addEventListener('pointerup', u);
    });
  }
  function layout() {
    if (!els.bar) return;
    const R2 = document.documentElement.style,
      rw = railW(),
      ww = innerWidth - rw,
      botOn =
        on &&
        !(L.hide.tags && L.hide.ev) &&
        !(L.fl.tags && L.fl.ev) &&
        !(L.hide.tags && L.fl.ev) &&
        !(L.fl.tags && L.hide.ev);
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
        Object.assign(p.style, {
          left: ps.x + 'px',
          top: ps.y + 'px',
          width: ps.w + 'px',
          height: ps.h + 'px',
          display: 'flex',
          flex: ''
        });
        if (!p._mv) {
          p._mv = 1;
          p.querySelector('.ph').addEventListener('pointerdown', e => {
            if (e.target.closest('button') || !p.classList.contains('splfl')) return;
            const x0 = e.clientX - p.offsetLeft,
              y0 = e.clientY - p.offsetTop;
            const m = ev => (
              (p.style.left = Math.max(0, ev.clientX - x0) + 'px'),
              (p.style.top = Math.max(0, ev.clientY - y0) + 'px')
            );
            const u = () => (
              removeEventListener('pointermove', m),
              removeEventListener('pointerup', u),
              keepPos(id, p)
            );
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
  const keepPos = (id, p) => (
    (L.pos[id] = { x: p.offsetLeft, y: p.offsetTop, w: p.offsetWidth, h: p.offsetHeight }),
    save()
  );
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
          b = Bt('Float', 'The HMI in its own window (PLANT VIEW window); Dock in that window brings it back', () =>
            call(() => window.lsPlantWindow && lsPlantWindow())
          );
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
      Bt(
        'Reset layout',
        'Sizes and docks as at the start',
        () => ((L = Object.assign({}, DEF, { hide: {}, fl: {}, pos: {} })), save(), layout(), menuPaint())
      ),
      Bt('Save layout', 'Keep this layout (it is kept in this browser)', () => (save(), m.classList.remove('open')))
    );
    m.append(ft);
  }
  /* ---------- batches: the equipment, grouped by HMI page, in the page order of the Plant view ---------- */
  function fillSel() {
    const L2 = eqList(),
      sel = els.sel;
    if (sel._n !== L2.length) {
      sel._n = L2.length;
      sel.textContent = '';
      let g = null,
        pg = '';
      for (const e of L2) {
        if (e.page !== pg) {
          pg = e.page;
          g = E('optgroup');
          g.label = pg;
          sel.append(g);
        }
        const o = E('option', '', e.n + (e.t ? ' · ' + e.t : '') + (e.sh.length ? ' · ' + e.sh.join(', ') : ''));
        o.value = e.key;
        g.append(o);
      }
    }
    sel.value = batch;
  }
  function step(d) {
    const L2 = eqList();
    if (!L2.length) return;
    const i = Math.max(
      0,
      L2.findIndex(e => e.key === batch)
    );
    setBatch(L2[(i + d + L2.length) % L2.length].key, true);
  }
  function setBatch(k, open, fromHmi) {
    const e = eqList().find(x => x.key === k);
    if (!e) return;
    batch = k;
    rowsC = null;
    if (e.ctl) ctlTag = e.ctl;
    save();
    fillSel();
    if (open && e.sh[0]) call(() => D().openD(e.sh[0], null));
    else if (open && e.ctl) {
      const F = ctlFind(e.ctl);
      /* its ABC sheet, zoomed and centred on the PID / MAN block so the value of the faceplate command is read there (AN.showTag) */
      if (F) call(() => (AN.showTag ? AN.showTag(e.ctl, F.sh.name) : AN.xrefGo({ a: F.sh.name })));
    }
    /* picked in Batch / ‹ ›: the HMI on the left shows the page of the equipment (not when the HMI itself picked it) */
    if (!fromHmi) {
      const pk = document.querySelector('select.plpick'),
        pg = k.split(':')[0];
      if (pk && pk.value !== pg && [...pk.options].some(o => o.value === pg)) {
        pk.value = pg;
        pk.dispatchEvent(new Event('change'));
      }
    }
    paint(true);
  }
  /* ---------- painting ---------- */
  let k0 = '';
  function paint(force) {
    if (!on) return;
    const e0 = eq(),
      L2 = rows(),
      r = res();
    /* what was seen of each row (0 and 1), for the result and the progress */
    for (const x of L2) {
      const v = x.v();
      if (x.an != null) {
        x.now = v == null || !isFinite(+v) ? null : +v;
        continue;
      }
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
    const nD = L2.filter(x => x.an == null).length;
    els.pb.firstChild.textContent = 'This batch · ' + p.ok + ' ✓ of ' + nD + ' signals';
    els.pb.lastChild.firstChild.style.width = (nD ? (100 * p.ok) / nD : 0) + '%';
    const nb = Object.keys(R).filter(b => prog(b).n).length;
    els.pa.firstChild.textContent =
      'Overall · ' + allOk + ' ✓ · ' + nb + ' batch' + (nb === 1 ? '' : 'es') + ' started';
    els.pa.lastChild.firstChild.style.width = Math.min(100, all ? (100 * allOk) / Math.max(all, 1) : 0) + '%';
    els.tg._d.textContent = e0
      ? e0.n + (e0.t ? ' · ' + e0.t : '') + ' · ' + e0.page + (e0.sh.length ? ' · ' + e0.sh.join(', ') : '')
      : 'pick an equipment in Batch, or open a faceplate on the HMI';
    const key =
      batch +
      '|' +
      L2.map(x => (x.an != null && x.now != null ? x.now.toFixed(1) : x.now) + (r[x.k] && r[x.k].exp)).join('') +
      '|' +
      ctlTag;
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
      bd.append(
        E(
          'div',
          'empty',
          batch && eq() && eq().ctl
            ? eq().ctl + ': not found in the ABC sheets'
            : 'No batch yet: pick a drawing in Batch, or click a motor or valve on the HMI.'
        )
      );
    } else {
      const t = E('table'),
        th = E('thead'),
        tr = E('tr');
      for (const h of ['Address', 'Signal', 'Used in (DITL / ABC)', 'Expected', 'Value · live', 'Seen', 'Result'])
        tr.append(E('th', '', h));
      th.append(tr);
      const tb = E('tbody');
      for (const x of L2) {
        const q = r[x.k] || { exp: null, seen: [] },
          row = E('tr');
        if (x.an != null) {
          /* an analog value of the controller (PV / SV / MV): live from the ABC sheet, no 0 / 1 expected */
          row.append(
            E('td', '', x.adr),
            E('td', 'n', x.name),
            E('td', 'n', x.where.join(', ')),
            E('td', '', '—'),
            E('td', 'v1', x.now == null ? '-----' : x.now.toFixed(1) + (x.an ? ' ' + x.an : '')),
            E('td', '', '—'),
            E('td', '', 'live')
          );
          tb.append(row);
          continue;
        }
        const exB = Bt(
          q.exp == null ? '–' : String(q.exp),
          'Click: the value this signal must have in the step you test (– → 1 → 0)',
          () => {
            const q2 = (r[x.k] = r[x.k] || { exp: null, seen: [] });
            q2.exp = q2.exp == null ? 1 : q2.exp === 1 ? 0 : null;
            save();
            paint(true);
          }
        );
        exB.className = 'ex';
        const ex = E('td');
        ex.append(exB);
        const vv = E('td', x.now === 1 ? 'v1' : x.now === 0 ? 'v0' : '', x.now == null ? '-----' : String(x.now));
        const rs = q.exp == null ? E('td', '', 'not yet') : x.now === q.exp ? E('td', 'ok', '✓') : E('td', 'bad', '✗');
        row.append(
          E('td', '', x.adr),
          E('td', 'n', x.name),
          E('td', 'n', x.where.join(', ')),
          ex,
          vv,
          E('td', '', (q.seen || []).slice().sort().join(' / ') || '—'),
          rs
        );
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
    for (const x of ['Tag', 'Range', 'P · I · D', 'Alarm H / L', 'Action', 'PV', 'SV', 'MV', 'Mode'])
      h.append(E('th', '', x));
    const th = E('thead');
    th.append(h);
    t.append(th);
    const tb = E('tbody'),
      r = E('tr');
    if (!c) {
      const td = E(
        'td',
        'n',
        ctlTag ? ctlTag + ': not found in the ABC sheets' : 'Open a controller faceplate on the HMI to show it here.'
      );
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
    const e0 = eq(),
      nm = e0 ? e0.sh.map(x => String(x).replace(/ #.*/, '')).join('|') : '',
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
      const shs = nm ? nm.split('|') : [];
      if (e0 && e0.n && t.includes(e0.n)) return true;
      if (shs.includes(sh) && (!e0 || !(e0.filt || e0.own) || t.includes(e0.filt || e0.own))) return true;
      for (const a of names) if (t.includes(a)) return true;
      return false;
    };
    const ev = LOG.filter(hit).slice(-200).reverse();
    els.ev._d.textContent = e0 ? e0.n + ' · ' + ev.length : 'this batch';
    if (!ev.length)
      bd.append(
        E('div', 'empty', 'No event of this batch yet. Every press, field action, alarm and return shows here.')
      );
    for (const e of ev) {
      const alm = /ALM|TRIP/.test(e.kind || '') && !/RTN/.test(e.kind || '');
      const r = E('div', 'ev' + (alm ? ' alm' : ''));
      r.append(
        E('span', 't', e.t || ''),
        E('span', 'k', e.kind === 'ALM' ? 'ALARM' : e.kind || ''),
        E('span', '', (e.sh ? String(e.sh).replace(/^\(\d+\)/, '') + ' · ' : '') + (e.text || ''))
      );
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
        lines.push(
          [
            b,
            k,
            x.exp == null ? '' : x.exp,
            (x.seen || []).join('/'),
            x.exp == null ? 'not yet' : x.ok ? 'OK' : 'NOT OK'
          ]
            .map(q)
            .join(',')
        );
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
      if (batch) setBatch(batch, true);
    } else {
      els.mn.classList.remove('open');
      for (const id of ['tags', 'ev'])
        if (els[id === 'tags' ? 'tg' : 'ev'].parentElement === document.body)
          els.bot.append(els[id === 'tags' ? 'tg' : 'ev']);
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
            /* the equipment of the faceplate (its name on the HMI page) */
            const e = eqList().find(x => x.n === P.n);
            if (e) setBatch(e.key, true, true);
          }
          return r;
        };
      }
    }
    /* a controller faceplate of the HMI (plant.js #plfp): its tag for the controller table */
    const fp = document.getElementById('plfp');
    const tg = fp && fp.isConnected ? (fp.querySelector('b') || {}).textContent : '';
    /* only when the faceplate of ANOTHER controller is opened: a batch picked in Batch while a faceplate stays open is kept */
    if (!tg) fpTag = '';
    if (on && tg && tg.trim() !== fpTag && /^[A-Z]{2,}[-A-Z]*\d/.test(tg)) {
      fpTag = tg.trim();
      ctlTag = fpTag;
      k0 = '';
      const e = eqList().find(x => x.ctl === ctlTag);
      if (e && e.key !== batch) setBatch(e.key, true, true);
    }
  }
  function railBtn() {
    if (els.rb) return true;
    const lc = [...document.querySelectorAll('.tabs button')].find(b => b.textContent.trim() === 'Loop check');
    if (!lc) return false;
    const b = E('button', '', 'Split');
    b.type = 'button';
    b.title =
      'Loop check split view: HMI | logic side by side, the tag table, the controller tags and the events of one batch';
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
  window.LS_SPLIT = {
    toggle,
    setBatch,
    get on() {
      return on;
    },
    get batch() {
      return batch;
    },
    rows: () => rows().map(x => ({ adr: x.adr, name: x.name, where: x.where, v: x.v() })),
    get layout() {
      return L;
    }
  };
})();
