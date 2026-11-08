/* ===== RE-SHELL LAYOUT C, step 3 of 7 (build plan approved by the user 2026-11-09, mockup C RNYt8ceyxutMvDyEt2UFnu, screens
   team-files/reshell/check/shots 03 ~ 08 and 18): the system page in the new frame, the two faceplates in the C look and placement, the
   turbine start panel on the Steam and turbine page. Only with ?shell=c (body.sc, shellc.js). It does not change any logic: the bar
   buttons press the Plant view's own buttons, the turbine panel presses the buttons of the "TCS / Field" menu (app.js tcsroll, tcssync,
   tcsload, tcstarget, tcsholdoff, tcsshut), and the faceplates are only moved (fp-pop.js / plant.js still build and drive them). ===== */
(function () {
  let want = false;
  try {
    want = localStorage.getItem('ls-shell') === 'c';
  } catch (e) {}
  if (!want) return;
  const E = (t, cls, txt) => {
    const e = document.createElement(t);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  const call = (f, d) => {
    try {
      return f();
    } catch (e) {
      return d;
    }
  };
  const $ = id => document.getElementById(id);

  /* ---------- (a) the page bar: breadcrumb (shellc-home.js) · Full screen · prev / next · Fit · LIVE ......... the last event ---------- */
  let bar = null,
    ev = null,
    fsOut = null;
  function full(on) {
    document.body.classList.toggle('scfull', on);
    /* Mina beta.213: the button showed with no Full screen pressed (a button rule of the app beat display:none): hidden unless on */
    if (fsOut) fsOut.hidden = !on;
    try {
      if (on && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (e) {}
    dispatchEvent(new Event('resize'));
  }
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('scfull')) full(false);
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('scfull') && !document.querySelector('.fpo-box,#plfp')) full(false);
  });
  function buildBar() {
    const ws = $('plantws'),
      b = ws && ws.querySelector('.plbar');
    if (!b) return false;
    bar = b;
    const fs = E('button', 'scfs', 'Full screen');
    fs.type = 'button';
    fs.title = 'The page takes the whole screen; the values strip stays (Esc or "Leave full screen" to come back)';
    fs.onclick = () => full(true);
    ev = E('span', 'scpev');
    ev.setAttribute('aria-live', 'polite');
    b.append(fs, ev);
    fsOut = E('button', 'scfsout', 'Leave full screen');
    fsOut.type = 'button';
    fsOut.hidden = true;
    fsOut.onclick = () => full(false);
    document.body.append(fsOut);
    return true;
  }
  /* the bar leaves room for the breadcrumb (a fixed button of shellc-home.js over the bar's left end) */
  function tickBar() {
    if (!bar) return;
    const c = document.querySelector('.sccrumb'),
      w = c && c.offsetWidth ? c.offsetWidth : 0;
    bar.style.setProperty('--sccw', w + 'px');
    const L = call(() => window.lsEvents, null),
      e = L && L[0],
      t = e ? (e.sh && e.sh !== 'DCS' ? e.sh + ': ' : '') + (e.text || '') + (e.t ? ' · ' + e.t : '') : '';
    if (ev.textContent !== t) {
      ev.textContent = t;
      ev.title = t ? 'Last event (the Events tab of the alarm list has them all)' : '';
    }
  }

  /* ---------- (b) faceplate placement: beside the equipment, never over the pipes that run into it ---------- */
  /* the equipment that was pressed (the same element fp-pop.js anchors to), in screen coordinates */
  let anchor = null;
  document.addEventListener(
    'pointerdown',
    e => {
      const t = e.target && e.target.closest ? e.target : null,
        m = $('plmid');
      if (!t || !m || !m.contains(t) || t.closest('.fpo-box,#plfp,#sctsp,.plbar')) return;
      const a = t.closest('[data-hit],[data-mdh],[data-fan],[data-dmp],[data-eqb],[data-vth],[data-fvh]') || t.closest('g') || t;
      anchor = { el: a, r: a.getBoundingClientRect(), at: Date.now() };
    },
    true
  );
  const hitR = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  /* the free area: the page minus the Training dock (fp-pop.js area(), the same rule) */
  function area() {
    const R = $('plmid').getBoundingClientRect(),
      a = { left: R.left, top: R.top, right: R.right, bottom: R.bottom },
      d = $('gdock'),
      D = d && d.offsetParent !== null ? d.getBoundingClientRect() : null;
    if (D && D.width && D.height) {
      if (document.documentElement.classList.contains('gd-bottom')) {
        if (D.top < a.bottom && D.top > a.top + 120) a.bottom = D.top;
      } else if (D.left < a.right && D.left > a.left + 200) a.right = D.left;
    }
    const pb = bar && bar.offsetParent ? bar.getBoundingClientRect() : null;
    if (pb && pb.bottom > a.top && pb.bottom < a.bottom) a.top = pb.bottom;
    return { R, a };
  }
  /* points along every line of the drawing that touches the equipment (pipes, ducts, signal lines), in screen pixels */
  function pipePts(r) {
    const m = $('plmid'),
      near = { left: r.left - 14, right: r.right + 14, top: r.top - 14, bottom: r.bottom + 14 },
      P = [];
    for (const el of m.querySelectorAll('svg path, svg line, svg polyline')) {
      if (el.closest('.fpo-box,#plfp,#sctsp')) continue;
      const b = el.getBoundingClientRect();
      if ((!b.width && !b.height) || !hitR(b, near) || (b.width < 30 && b.height < 30)) continue;
      const len = call(() => el.getTotalLength(), 0),
        M = call(() => el.getScreenCTM(), null);
      if (!len || !M) continue;
      const k = Math.hypot(M.a, M.b) || 1,
        n = Math.min(400, Math.max(2, Math.ceil((len * k) / 6)));
      let touch = false;
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const p = call(() => el.getPointAtLength((len * i) / n), null);
        if (!p) continue;
        const x = M.a * p.x + M.c * p.y + M.e,
          y = M.b * p.x + M.d * p.y + M.f;
        pts.push([x, y]);
        if (x >= near.left && x <= near.right && y >= near.top && y <= near.bottom) touch = true;
      }
      if (touch) P.push(...pts);
    }
    return P;
  }
  function placeC(el) {
    if (!el.isConnected || !anchor || Date.now() - anchor.at > 4000 || document.body.classList.contains('scnarrow')) return;
    const { R, a } = area(),
      w = el.offsetWidth,
      h = el.offsetHeight,
      r = anchor.el.isConnected ? anchor.el.getBoundingClientRect() : anchor.r;
    if (!w || !h) return;
    const P = pipePts(r),
      other = [...document.querySelectorAll('.fpo-box,#plfp.fpo-near')].filter(x => x !== el && x.offsetParent).map(x => x.getBoundingClientRect()),
      g = 10,
      cx = (r.left + r.right) / 2,
      cy = (r.top + r.bottom) / 2,
      clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    /* above, below, right, left of the equipment (as the mockup: the control faceplate above the pump), then the same sides slid along */
    const C = [];
    const add = (x, y) => C.push([clamp(x, a.left + 6, a.right - w - 6), clamp(y, a.top + 6, a.bottom - h - 6)]);
    add(cx - w / 2, r.top - g - h);
    add(cx - w / 2, r.bottom + g);
    add(r.right + g, cy - h / 2);
    add(r.left - g - w, cy - h / 2);
    add(r.right + g, r.top);
    add(r.right + g, r.bottom - h);
    add(r.left - g - w, r.top);
    add(r.left - g - w, r.bottom - h);
    add(r.left, r.top - g - h);
    add(r.right - w, r.top - g - h);
    add(r.left, r.bottom + g);
    add(r.right - w, r.bottom + g);
    add(a.right - w - 6, a.top + 6);
    add(a.left + 6, a.top + 6);
    let best = null,
      bs = 1e9;
    C.forEach(([x, y], i) => {
      const q = { left: x, top: y, right: x + w, bottom: y + h };
      let s = hitR(q, { left: r.left - 4, top: r.top - 4, right: r.right + 4, bottom: r.bottom + 4 }) ? 1e6 : 0;
      for (const o of other) if (hitR(q, o)) s += 1e5;
      for (const [px, py] of P) if (px > q.left && px < q.right && py > q.top && py < q.bottom) s += 10;
      s += i; /* the earlier side wins a tie */
      if (s < bs) ((bs = s), (best = [x, y]));
    });
    if (!best) return;
    el.style.left = Math.round(best[0] - R.left) + 'px';
    el.style.top = Math.round(best[1] - R.top) + 'px';
    el.dataset.side = 'n';
  }
  /* a faceplate that opens (fp-pop.js .fpo-box, the controller faceplate #plfp of plant.js) is placed again by the rule above, once,
     after its content is drawn; a faceplate the operator drags stays where it is put */
  function watch() {
    const m = $('plmid');
    if (!m) return false;
    new MutationObserver(L => {
      for (const x of L)
        for (const n of x.addedNodes)
          if (n.nodeType === 1 && (n.classList.contains('fpo-box') || n.id === 'plfp'))
            requestAnimationFrame(() => requestAnimationFrame(() => placeC(n)));
    }).observe(m, { childList: true });
    return true;
  }
  /* tablet (narrow): the faceplate is a panel at the right of the page (mockup tablet 07 / 08) */
  const narrow = () => document.body.classList.toggle('scnarrow', innerWidth < 1100);
  addEventListener('resize', narrow);

  /* ---------- (c) the turbine start panel on the Steam and turbine page (MK13 TURBINE START) ---------- */
  const TSB = [
    ['tcsroll', 'Roll to 3600 rpm'],
    ['tcssync', 'Synchronize, 4.5 MW'],
    ['tcsload', 'Load up to 45 MW'],
    ['tcstarget', 'Target MW…'],
    ['tcsholdoff', 'Release hold'],
    ['tcsshut', 'Shut down']
  ];
  let tsp = null,
    tsv = null,
    tsb = [];
  function buildTsp() {
    const m = $('plmid');
    if (!m) return false;
    tsp = E('section');
    tsp.id = 'sctsp';
    tsp.setAttribute('aria-label', 'Turbine start, turbine control system');
    const hd = E('div', 'sctsh');
    hd.append(E('span', '', 'Turbine start · turbine control system'));
    const hide = E('button', 'sctsx', 'Hide');
    hide.type = 'button';
    hide.title = 'Fold the panel (click again to open)';
    hide.onclick = () => {
      tsp.classList.toggle('fold');
      hide.textContent = tsp.classList.contains('fold') ? 'Show' : 'Hide';
    };
    hd.append(hide);
    tsv = E('div', 'sctsv');
    const row = E('div', 'sctsb');
    tsb = TSB.map(([id, t]) => {
      const b = E('button', id === 'tcsshut' ? 'stop' : '', t);
      b.type = 'button';
      b.onclick = () => {
        const o = $(id);
        if (o && !o.disabled) o.click();
      };
      row.append(b);
      return { b, id };
    });
    tsp.append(hd, tsv, row);
    m.append(tsp);
    return true;
  }
  const kv = (k, v) => {
    const s = E('span');
    s.append(k + ' ', E('b', '', v));
    return s;
  };
  function tickTsp() {
    if (!tsp) return;
    const pk = document.querySelector('#plantws .plpick'),
      on = !!pk && pk.value === 'MK13';
    tsp.hidden = !on;
    if (!on) return;
    const U = call(() => AN.unit, null) || {},
      tb = U.tb || {},
      S = call(() => AN.tcs(), null),
      rpm = isFinite(+tb.rpm) ? Math.round(+tb.rpm) : null,
      gcb = tb.st === 'sync' || tb.st === 'load',
      aim = isFinite(+tb.aim) ? +tb.aim : null;
    tsv.replaceChildren(
      kv('Speed', rpm == null ? '—' : rpm + ' rpm'),
      kv('Generator breaker', tb.st ? (gcb ? 'closed' : 'open') : '—'),
      kv('Target', aim == null ? '—' : (Math.round(aim * 10) / 10) + ' MW'),
      E('span', 'sctsn', 'at 7.5 MW/min'),
      kv('Hold', S ? (S.hold ? 'on' : 'off') : '—')
    );
    for (const x of tsb) {
      const o = $(x.id);
      x.b.disabled = !o || o.disabled;
      x.b.title = o ? o.title : 'Not in this build';
    }
  }

  /* ---------- start ---------- */
  let k = 0;
  const iv = setInterval(() => {
    if (!document.body.classList.contains('sc')) {
      if (++k > 150) clearInterval(iv);
      return;
    }
    if (!bar) buildBar();
    if (!tsp) buildTsp();
    if (bar && tsp && watch()) {
      clearInterval(iv);
      narrow();
      setInterval(() => (tickBar(), tickTsp()), 1000);
      tickBar();
      tickTsp();
    }
    /* the Plant view is built the first time it opens: wait for it as long as it takes */
  }, 300);
})();
