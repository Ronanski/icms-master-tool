/* ===== APP SHELL 2 (2.4.0): one top bar with four tabs (OPERATE / LOGIC / LIBRARY / TOOLS), one status bar.
   The old toolbars (#anbar of the ABC page, #bar of the DITL page) stay in the page but hidden: their buttons are the same
   elements with the same handlers, only moved into the new bar, the Start menu, the ⚙ menu or the TOOLS page.
   Nothing here touches the simulation engine. ===== */
(function () {
  const $ = id => document.getElementById(id);
  /* 3.2.0 retest #54 (user 2026-10-28: the page froze over 1 min with no loading sign): a progress bar over the page while a starting
     state loads (hmi-op.js anLoadStart) or the logic of the first page is read; show(text), prog(0 ~ 1), hide() */
  /* 3.2.0 retest #57 (R4: the Plant view, "Unit · not started", loaded the Cold by itself, froze and ran the time): with the plant model
     ON and no starting state picked, the operator picks one here (Cold / 150 MW); nothing loads or runs by itself. after() goes on
     once the picked state is in (RUN pressed with no state) */
  window.lsAskStart = after => {
    /* retest #59 (R5: the question covered the Training checklist after Clear, and came again at the Gabay press after "Not now"):
       never while a starting state is being loaded or prepared (Gabay, Practise: AN._startPending); asked by itself (no after: page
       open, Reset) only outside HOME / TRAINING (they have their own Gabay / Practise buttons) and not again after "Not now";
       the RUN press still asks */
    const A = window.AN || {},
      tb = document.body.dataset.tab;
    if (A._loadP || A._startPending) return;
    if (!after && (tb === 'home' || tb === 'training' || A._askNo)) return;
    let d = document.getElementById('lsask');
    if (d) {
      d._after = after || d._after;
      return;
    }
    d = document.createElement('div');
    d.id = 'lsask';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Starting state');
    d._after = after;
    d.innerHTML =
      '<div class=lsbz><b>No starting state picked</b><p>The plant model is ON but the plant is not started. Pick the starting state; it loads with a progress bar.</p><div class=lsaskb></div></div>';
    const bs = d.querySelector('.lsaskb'),
      close = () => d.remove(),
      pick = id => {
        const go = d._after;
        close();
        let k = 0;
        const iv = setInterval(() => {
          const ok = window.AN && AN.sheets && AN.sheets.length >= 54 && AN.loadStart;
          if (!ok && ++k < 240) return;
          clearInterval(iv);
          if (!ok) return;
          const b = document.getElementById(id);
          if (b) b.click();
          (AN._startP || Promise.resolve()).then(() => go && go(), () => {});
        }, 250);
      };
    [
      ['Cold (start-up from zero)', () => pick('loadcold'), 'go'],
      ['150 MW (HMI snapshot)', () => pick('load150'), ''],
      [
        'Not now',
        () => {
          if (window.AN) AN._askNo = 1;
          close();
        },
        ''
      ]
    ].forEach(([t, f, c]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = t;
      b.className = 'lsaskbtn ' + c;
      b.onclick = f;
      bs.append(b);
    });
    document.body.append(d);
    try {
      bs.firstChild.focus();
    } catch (e) {}
  };
  window.lsBusy = (() => {
    let el = null,
      t0 = 0,
      iv = null;
    const sec = () => Math.round((Date.now() - t0) / 1000) + ' s';
    return {
      show(t) {
        if (!el) {
          el = document.createElement('div');
          el.id = 'lsbusy';
          el.setAttribute('role', 'status');
          el.setAttribute('aria-live', 'polite');
          el.innerHTML = '<div class=lsbz><b></b><div class=lsbzbar><i></i></div><small></small></div>';
          document.body.append(el);
        }
        if (!el.hidden && iv) return;
        t0 = Date.now();
        el.hidden = false;
        el.querySelector('b').textContent = t || 'Nilo-load…';
        el.querySelector('i').style.width = '0%';
        el.querySelector('i').classList.add('ind');
        el.querySelector('small').textContent = 'Sandali lang · 0 s';
        clearInterval(iv);
        iv = setInterval(() => {
          if (el && !el.hidden) el.querySelector('small').textContent = 'Sandali lang · ' + sec();
        }, 1000);
      },
      prog(f) {
        if (!el || el.hidden) return;
        const i = el.querySelector('i');
        i.classList.remove('ind');
        i.style.width = Math.round(Math.max(0, Math.min(0.99, f)) * 100) + '%';
        el.querySelector('small').textContent = Math.round(Math.max(0, Math.min(0.99, f)) * 100) + ' % · ' + sec();
      },
      hide() {
        clearInterval(iv);
        iv = null;
        if (el) el.hidden = true;
      }
    };
  })();
  const E = (t, a, c) => {
    const e = document.createElement(t);
    if (a)
      for (const k in a) {
        if (k === 'cls') e.className = a[k];
        else if (k === 'txt') e.textContent = a[k];
        else if (k === 'html') e.innerHTML = a[k];
        else if (k === 'on') e.onclick = a[k];
        else e.setAttribute(k, a[k]);
      }
    (c || []).forEach(x => x && e.append(x));
    return e;
  };
  const GEAR =
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
  const ls = {
    get: k => {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    }
  };
  /* a drop-down: a button that opens a menu under it; closes on outside click, Esc, or a button click inside */
  function dropdown(btn, cls) {
    const w = E('div', { cls: 'ddw ' + (cls || '') }),
      m = E('div', { cls: 'ddm' });
    w.append(btn, m);
    btn.onclick = e => {
      e.stopPropagation();
      document.querySelectorAll('.ddw.open').forEach(x => x !== w && x.classList.remove('open'));
      w.classList.toggle('open');
      /* 2.4.1-beta.1: while open, the menu sits on the page itself (body), under its button and inside the screen. Inside
         the tool bar, which scrolls sideways, it was cut off: Start ▾ showed nothing in the PLANT VIEW, and on a phone it
         ran off the right edge */
      if (w.classList.contains('open')) {
        const d = btn.ownerDocument,
          r = btn.getBoundingClientRect(),
          vw = d.documentElement.clientWidth;
        d.body.append(m);
        m.classList.add('ddm-open');
        Object.assign(m.style, { position: 'fixed', top: r.bottom + 6 + 'px', left: '0px', right: 'auto' });
        const mw = m.offsetWidth,
          x = w.classList.contains('left') ? r.left : r.right - mw;
        m.style.left = Math.max(8, Math.min(x, vw - mw - 8)) + 'px';
      }
    };
    /* closing (from anywhere: Esc, outside click, tab change) puts the menu back in its place */
    new MutationObserver(() => {
      if (w.classList.contains('open') || m.parentNode === w) return;
      m.classList.remove('ddm-open');
      m.removeAttribute('style');
      w.append(m);
    }).observe(w, { attributes: true, attributeFilter: ['class'] });
    /* 2.5.0-beta.20 (UI audit): on the window, before the pages: the ABC page stops the keys and the 🔍 button its click,
       so Esc and 🔍 left the ⚙ menu open over the search */
    const win = btn.ownerDocument.defaultView || window;
    win.addEventListener(
      'click',
      e => {
        if (!w.contains(e.target) && !m.contains(e.target)) w.classList.remove('open');
      },
      true
    );
    win.addEventListener(
      'keydown',
      e => {
        if (e.key === 'Escape') w.classList.remove('open');
      },
      true
    );
    m.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') setTimeout(() => w.classList.remove('open'), 50);
    });
    return {
      w,
      m,
      head: t => m.append(E('div', { cls: 'mh', txt: t }))
    };
  }
  /* 3.2.0-beta.8 (Guided Workbench, user pick 2026-10-23 "B + C"): HOME (what do you want to do) and TRAINING (PR-OPE-5002 step
     by step) are pages of their own (src/ui/shell/home.js); TOOLS has no rail button any more: ⚙ > Engineering tools */
  const TABS = [
    ['home', 'Home', 'Start here: what do you want to do, starting state of the plant, recent sheets'],
    ['operate', 'Plant view', 'Plant graphics with the faceplates (A / M / R, SV, MV) like the operator station; on a PC it opens in its own window'],
    ['logic', 'Logic', 'The ABC (analog) and DITL (digital) drawings: trace, run, force'],
    ['library', 'Library', 'I/O list, memory list, wiring, relay / SER, calculations'],
    ['training', 'Training', 'The start-up procedure PR-OPE-5002 step by step, with a check box for every step'],
    ['tools', 'Tools', 'Block tests, audit, health, project files, drawing edit', 1]
  ];
  let tab = null,
    logicCat = null,
    tabBtns = {},
    subBtns = {},
    toolsws = null,
    foot = null;
  const place = () => {
    const gs = $('gsbar');
    if (!gs) return;
    const top = gs.getBoundingClientRect().bottom,
      fh = foot ? foot.getBoundingClientRect().height : 0;
    const r = document.documentElement.style;
    r.setProperty('--topH', top + 'px');
    r.setProperty('--footH', fh + 'px');
    [toolsws, $('plantws'), $('libws')].forEach(w => {
      if (!w) return;
      w.style.top = top + 'px';
      w.style.bottom = fh + 'px';
    });
  };
  let pvPop = null,
    pvW = null;
  /* 2.4.0-beta.5 PLANT VIEW window (user 2026-10-19: "kapag PC, dapat another window bubukas"; Android: the tab). The same
     workspace (graphic, faceplates) is MOVED into the window, so it runs on the same engine as the LOGIC tab; closing the window
     or Dock brings it back. Phone / tablet / Android app, and an automated browser (the tests), keep the tab. */
  const pvPc = () => {
    if (window.LS_PVWIN != null) return !!window.LS_PVWIN;
    try {
      return !window.Capacitor && !navigator.webdriver && !matchMedia('(pointer:coarse)').matches && innerWidth >= 1000;
    } catch (e) {
      return false;
    }
  };
  function pvWindow(startW, gOp, run, chip, clock) {
    if (pvW && !pvW.closed) {
      pvW.focus();
      return true;
    }
    if (!pvPc() || !window.lsPlantWs || !window.lsPlantDoc) return false;
    let w = null;
    try {
      w = window.open('', 'dcs_plantview', 'width=1400,height=880');
    } catch (e) {}
    if (!w || w.closed || !w.document) return false;
    const d = w.document;
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PLANT VIEW · DCS Logic Simulator</title></head><body></body></html>');
    d.close();
    document.querySelectorAll('style,link[rel=stylesheet],link[rel=icon]').forEach(x => d.head.append(x.cloneNode(true)));
    for (const a of document.documentElement.attributes) d.documentElement.setAttribute(a.name, a.value);
    d.head.append(
      Object.assign(d.createElement('style'), {
        textContent:
          'html,body{margin:0;height:100%;overflow:hidden;background:var(--c-bg,var(--c-well))}' +
          '#pvbar{position:fixed;left:0;right:0;top:0;height:40px;display:flex;align-items:center;gap:8px;padding:0 10px;box-sizing:border-box;background:var(--c-strip,var(--c-well));border-bottom:1px solid var(--c-line);color:var(--c-tx);font:12.5px var(--uf,system-ui);z-index:60}' +
          '#pvbar .pvt{font:600 12px var(--uf,system-ui);letter-spacing:.14em;color:var(--c-tx);margin-right:6px;white-space:nowrap}' +
          '#pvbar .pvs{font:600 11px var(--mf,monospace);color:var(--c-dim);white-space:nowrap}' +
          '#pvbar .pvs.on{color:var(--c-runtx2)}' +
          '#pvbar .pvg{flex:1}' +
          '#pvbar>button,#pvbar .ddw>button{height:28px;padding:0 12px;border-radius:2px;background:var(--c-pane);border:1px solid var(--c-line);color:var(--c-tx);font:600 12px var(--uf,system-ui);cursor:pointer;white-space:nowrap}' +
          '#pvbar>button.on{background:var(--c-runsoft);border-color:var(--c-run);color:#fff}' +
          'body.pvwin #plantws{display:grid!important;top:40px!important;bottom:0!important}'
      })
    );
    d.body.className = document.body.className + ' pvwin';
    d.body.dataset.tab = 'operate';
    const mk = (t, a) => Object.assign(d.createElement(t), a || {});
    const rb = mk('button', { title: 'Run / Pause the simulation (the same as the Run button of the LOGIC tab)', onclick: () => run && run.click() }),
      st = mk('span', { className: 'pvs' }),
      ck = mk('span', { className: 'pvs' }),
      dock = mk('button', { textContent: 'Dock', title: 'Bring the PLANT VIEW back into the main window (tab)' }),
      bar = mk('div', { id: 'pvbar' });
    bar.append(mk('span', { className: 'pvt', textContent: 'PLANT VIEW' }), rb, startW, st, ck, mk('span', { className: 'pvg' }), dock);
    const ws = window.lsPlantWs();
    plantUx(); /* Systems button and the empty values column, before the workspace leaves this document */
    d.body.append(bar, ws);
    window.lsPlantDoc(d);
    /* 3.2.0-beta.9: the VIEW lock guards the window too */
    if (window.lsViewLock) lsViewLock.attach(d);
    if (tab === 'operate') setTab('logic');
    pvW = w;
    document.body.classList.add('pvout');
    const sync = () => {
      if (!pvW) return;
      if (pvW.closed) return back();
      if (run) {
        rb.textContent = run.textContent.trim() || 'Run';
        rb.classList.toggle('on', /pause/i.test(run.textContent));
      }
      if (chip) {
        const c0 = chip.querySelector('span') || chip;
        st.textContent = c0.textContent.trim();
        st.classList.toggle('on', /^run/i.test(st.textContent));
      }
      if (clock) ck.textContent = clock.textContent.trim();
    };
    const iv = setInterval(sync, 300);
    sync();
    d.addEventListener('click', e => {
      if (!startW.contains(e.target)) startW.classList.remove('open');
    });
    w.addEventListener('resize', () => window.lsPlantFit && window.lsPlantFit());
    let done = false;
    function back(toTab) {
      if (done) return;
      done = true;
      clearInterval(iv);
      startW.classList.remove('open');
      gOp.prepend(startW);
      ws.style.display = 'none';
      document.body.append(ws);
      window.lsPlantDoc(document);
      document.body.classList.remove('pvout');
      const ww = pvW;
      pvW = null;
      try {
        if (ww && !ww.closed) ww.close();
      } catch (e) {}
      if (toTab) setTab('operate');
    }
    dock.onclick = () => {
      window.focus();
      back(true);
    };
    w.addEventListener('pagehide', () => back());
    addEventListener('pagehide', () => {
      try {
        w.close();
      } catch (e) {}
    });
    setTimeout(() => window.lsPlantFit && window.lsPlantFit(), 60);
    return true;
  }
  function setTab(t, keep) {
    if (!TABS.some(x => x[0] === t)) t = 'logic';
    /* user 2026-10-30: while the Training dock is on, the centre is the HMI (the Training list and Home are not shown) */
    try {
      if (window.LS_DOCK && LS_DOCK.tabFix) t = LS_DOCK.tabFix(t);
    } catch (e) {}
    /* the PLANT VIEW is in its own window: bring that window to the front */
    if (t === 'operate' && pvW && !pvW.closed) {
      pvW.focus();
      return;
    }
    /* retest #2 #48 (R7: ABC-057 in the centre at the SWP step while the status bar named DITL-29A #B): the Plant view switches the
       logic engine to the ABC sheets (its graphics run on them) and the Logic page came back on an ABC sheet, not on the drawing the
       Training had opened. The Logic page keeps its own sheet: the category it had is set again when it opens */
    const from = tab;
    if (from === 'logic' && t !== 'logic' && window.AN) logicCat = AN.cat;
    tab = t;
    document.body.dataset.tab = t;
    if (!keep && t !== 'home') ls.set('ls-tab', t);
    for (const k in tabBtns) tabBtns[k].classList.toggle('on', k === t);
    const plant = window.lsPlant,
      lib = window.lsLibrary;
    try {
      if (t === 'operate') {
        /* the plant graphics run on the ABC engine: the ABC category must be the active one (its Run button is in the bar) */
        if (window.AN && AN.cat !== 'an' && AN.setCat) AN.setCat('an');
        lib && lib(false);
        plant && plant(true);
        /* retest #57: the Plant view of a plant not started asks for the starting state (no load by itself) */
        if (window.AN && AN.plantOn && !AN.startState && !AN._loadP) window.lsAskStart();
      } else if (t === 'library') {
        plant && plant(false);
        lib && lib(true);
      } else {
        plant && plant(false);
        lib && lib(false);
      }
    } catch (e) {}
    try {
      if (t === 'logic' && from !== 'logic' && window.AN && logicCat && AN.cat !== logicCat && AN.setCat)
        AN.setCat(logicCat);
    } catch (e) {}
    document.querySelectorAll('.ddw.open').forEach(x => x.classList.remove('open'));
    place();
    hint();
    /* retest #13 (R5: ABC-057 / DITL-29A of an earlier visit still loaded behind the Training page): on HOME and TRAINING the logic
       workspace is not shown, not read and not focusable (inert, aria-hidden; CSS visibility in app.css); the guided start opens the
       sheet of its step when it goes to the Logic page */
    const away = t === 'home' || t === 'training';
    for (const id of ['cv', 'side', 'anp', 'tabs', 'anptab', 'meta', 'anmeta'])
      try {
        const x = $(id);
        if (!x) continue;
        x.inert = away;
        if (away) x.setAttribute('aria-hidden', 'true');
        else x.removeAttribute('aria-hidden');
      } catch (e) {}
    /* retest #13 (R6, beta.42: "DITL-29A and ABC-057 still loaded behind, even after a reload"): hiding was not enough, the drawing
       of the last sheet (remembered from the last visit) stayed in the page. Now the drawing itself is emptied on HOME / TRAINING
       when no guided start runs, and drawn again (the same sheet) when the Logic page opens */
    /* retest #13 (R7: after Clear / Gabay the hidden Logic page still held DITL-29A, opened by the Gabay on purpose): HOME and
       TRAINING never hold a drawing, with or without the Gabay; the Gabay opens the sheet of its step when the Logic page opens */
    blankLogic(away);
    if (t !== 'logic') document.body.classList.remove('lsfield');
    /* retest #2 #48: the Logic page opened while the Gabay runs (rail button, back from the Plant view): the centre shows the sheet of
       the step ("Sundan ng gitna"), or says that the step is a field step */
    if (t === 'logic' && from !== 'logic' && window.LS_GUIDE && LS_GUIDE.on && window.LS_DOCK && LS_DOCK.follow)
      LS_DOCK.follow();
  }
  /* retest #13: Clear all ticks forgets the category the Logic page had (home.js) */
  window.lsLogicForget = () => {
    logicCat = null;
  };
  function blankLogic(on) {
    const B = document.body;
    const sv = $('svg');
    if (sv && !sv._blankObs)
      try {
        /* a sheet drawn while the page is blank (the ABC sheets arriving, a DITL scan) is emptied again */
        sv._blankObs = new MutationObserver(() => {
          if (B.classList.contains('lsblank') && sv.firstChild) sv.textContent = '';
        });
        sv._blankObs.observe(sv, { childList: true });
      } catch (e) {}
    if (on) {
      if (B.classList.contains('lsblank')) return;
      B.classList.add('lsblank');
      if (sv) sv.textContent = '';
      return;
    }
    if (!B.classList.contains('lsblank')) return;
    B.classList.remove('lsblank');
    try {
      if (window.AN && AN.cat === 'an' && AN.sheets && AN.sheets.length && AN.go) AN.go(AN.i || 0);
      else {
        const ss = $('shsel');
        if (ss) ss.dispatchEvent(new Event('change'));
      }
    } catch (e) {}
  }
  const HINTS = {
    /* retest #42: short enough for the status bar; the whole text is in the tooltip */
    operate: 'PLANT VIEW: click a valve or controller = faceplate',
    library: 'LIBRARY: search an address, tag or description',
    tools: 'TOOLS: tests, drawing checks, simulation switches',
    home: 'HOME: pick what to do · Ctrl+K = search',
    training: 'TRAINING: tick each step as you do it'
  };
  window.lsSetTab = setTab;
  function hint() {
    const h = foot && foot.querySelector('.shint');
    if (h) h.textContent = h.title = HINTS[tab] || '';
  }
  function setSub(c) {
    if (window.AN && AN.setCat && AN.cat !== c) AN.setCat(c);
  }
  /* wraps an element so that it shows only on the ABC page (an-only) or only on the DITL page (dit-only); the element's own
     class list is left to its owner script (the DITL page rewrites the class of its buttons) */
  const only = (cls, e) => (e ? E('span', { cls: 'only ' + cls }, [e]) : null);
  const AN_ = e => only('an-only', e),
    DI_ = e => only('dit-only', e);
  /* finds a toolbar element by its text */
  const byText = (root, tag, re) => [...root.querySelectorAll(tag)].find(e => re.test(e.textContent.trim()));
  /* OPERATE: the values column is hidden when a screen has no values (the graphic gets the width), and on a phone the
     system list is a drawer opened from the screen bar */
  let plDone = false;
  function plantUx() {
    const ws = $('plantws'),
      bar = ws && ws.querySelector('.plbar'),
      vals = $('plvals'),
      list = $('pllist');
    if (plDone || !ws || !bar || !vals || !list) return;
    plDone = true;
    const upd = () => {
      const empty = !vals.querySelector('.pltb');
      ws.classList.toggle('noval', empty);
      if (ws.style.display === 'grid') {
        place();
        dispatchEvent(new Event('resize'));
      }
    };
    new MutationObserver(upd).observe(vals, { childList: true });
    upd();
    const sb = E('button', {
      id: 'plsys',
      cls: 'b',
      txt: '☰ Systems',
      title: 'List of plant systems',
      on: e => {
        e.stopPropagation();
        ws.classList.toggle('lsopen');
        ws.classList.remove('vals');
      }
    });
    bar.prepend(sb);
    list.addEventListener('click', () => ws.classList.remove('lsopen'));
    /* 2.4.1-beta.1: the list and the values slide out over the graphic on every screen; a click on the graphic closes them */
    const mid = $('plmid');
    if (mid) mid.addEventListener('pointerdown', e => !e.target.closest('#plfp,.plbar') && ws.classList.remove('lsopen', 'vals'));
  }
  function build() {
    const gs = $('gsbar'),
      an = $('anbar'),
      bar = $('bar'),
      chip = $('stchip'),
      st = $('st');
    if (!gs || !an || !bar || !chip || !st || !$('ansb') || !window.AN || !AN.setCat) return false;
    if (an.children.length < 12 || !$('bmode')) return false;
    /* --- ABC toolbar elements --- */
    const B = re => byText(an, 'button', re),
      S = re => byText(an, 'select', re);
    const run = B(/Run|Pause/),
      view = B(/^View$/),
      back = B(/^◀\s*Back/),
      next = B(/^Next/),
      reset = B(/^Reset$/),
      stepSel = S(/^1 s/),
      speedSel = S(/^1x/),
      fit = B(/^Fit$/),
      values = B(/^Values$/),
      wire = B(/^Wire values$/),
      panel = B(/^Panel$/),
      review = B(/^Review marks/),
      live = S(/^Live/),
      theme = S(/^Theme/),
      xback = B(/^↩\s*Back/),
      health = B(/^Health/),
      audit = B(/^Audit/),
      ln = B(/^LN tables/),
      assumed = B(/^Assumed/),
      ditlsig = B(/^DITL signals/),
      second = B(/^2nd sheet/),
      plantwin = B(/^Plant window$/),
      save = B(/^💾\s*Save/),
      saveas = B(/^Save as/),
      openp = B(/^📂\s*Open/),
      hmi = B(/^HMI$/),
      shbox = $('anshbox'),
      clock = [...an.querySelectorAll('span')].find(s => /^t\s*=/.test(s.textContent.trim())),
      prj = [...an.querySelectorAll('span')].find(s => /project file/.test(s.textContent)),
      importAbc = [...an.querySelectorAll('label')].find(l => /Import ABC DXF/.test(l.textContent));
    if (!run || !view || !fit || !panel || !shbox) return false;
    /* --- DITL toolbar elements --- */
    const mode = $('bmode'),
      dfit = $('bfit'),
      slive = $('slive'),
      dshbox = $('shbox'),
      lab = id => {
        const i = $(id);
        return i && i.closest('label');
      };
    /* --- the category buttons of both pages (ABC / DITL) keep working hidden; the new bar has its own --- */
    an.dataset.shell = '1';
    bar.dataset.shell = '1';
    /* the one-world switch of src/world/world.js looks for a .tbg-run box in each toolbar: give it one (hidden) */
    [an, bar].forEach(b => {
      if (!b.querySelector('.tbg-run')) b.append(E('div', { cls: 'tbg tbg-run' }));
    });
    run.classList.add('tb-run');
    /* short labels (the handlers do not read these texts) */
    if (back) back.textContent = '◀◀';
    if (next) next.textContent = '▶▶';
    if (wire) wire.textContent = 'Wire values';
    /* 3.0.0: the right panel is the Inspector (block details) / Faceplate */
    if (panel) panel.textContent = 'Inspector';
    [back, next, stepSel].forEach(e => e && e.classList.add('tb-step'));
    view.classList.add('tb-view');
    /* --- status bar --- */
    foot = E('div', { id: 'sfoot' });
    st.before(foot);
    foot.append(chip);
    if (clock) {
      clock.classList.add('an-only', 'sclock');
      foot.append(clock);
    }
    foot.append(st, E('span', { cls: 'shint' }), E('span', { cls: 'spm', txt: 'PLANT MODEL OFF', title: 'The plant model is OFF (TOOLS > Simulation): the PV does not answer the valves' }));
    /* the app's messages (the old toast) show in the status bar for 7 s; a click hides them */
    {
      const sm = E('span', { cls: 'smsg', title: 'Message (click to hide)', on: () => document.body.classList.remove('hasmsg') });
      foot.append(sm);
      const t = $('toast');
      if (t) {
        /* 2.5.0-beta.20 (UI audit): a message belongs to the tab it was shown on; a tab change hides it (a DITL message
           showed on LIBRARY / TOOLS) */
        let mtab = null;
        const sync = posted => {
          const on = !t.hidden && !!t.textContent.trim();
          if (on && posted) {
            sm.textContent = t.textContent;
            /* retest #42: the whole message in the tooltip (a long one is cut in the status bar) */
            sm.title = t.textContent + ' (click to hide)';
            mtab = document.body.dataset.tab;
          }
          document.body.classList.toggle('hasmsg', on && mtab === document.body.dataset.tab);
        };
        new MutationObserver(() => sync(false)).observe(document.body, { attributes: true, attributeFilter: ['data-tab'] });
        new MutationObserver(() => sync(true)).observe(t, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });
        sync(true);
      }
      /* retest #42 (R7: "…as yo…" in the status bar at 1280 px with the Training panel open): a text longer than its cell goes on two
         smaller lines in the same bar (class sf2, app.css) instead of being cut; the whole text stays in the tooltip */
      const fit2 = () =>
        foot.querySelectorAll('#st,.shint,.smsg').forEach(x => {
          x.classList.remove('sf2');
          if (x.offsetParent && x.scrollWidth > x.clientWidth + 1) x.classList.add('sf2');
        });
      new MutationObserver(() => requestAnimationFrame(fit2)).observe(foot, {
        childList: true,
        characterData: true,
        subtree: true
      });
      new MutationObserver(() => requestAnimationFrame(fit2)).observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'data-tab']
      });
      addEventListener('resize', () => requestAnimationFrame(fit2));
    }
    /* --- top bar --- */
    const ansb = $('ansb'),
      gscope = $('gscope'),
      uisel = $('uisel');
    [...gs.children].forEach(c => {
      if (c !== ansb && c !== gscope && c !== uisel && c.id !== 'updbtn' && c.id !== 'chsel' && c.id !== 'dgsel' && c.id !== 'dgtsel') c.remove();
    });
    const tabs = E('div', { cls: 'tabs' });
    TABS.forEach(([k, l, t, hid]) => {
      if (hid) return;
      const b = E('button', { txt: l, title: t, on: () => (k === 'operate' && pvPop && pvPop()) || setTab(k) });
      tabBtns[k] = b;
      tabs.append(b);
    });
    const sub = E('div', { cls: 'sub' });
    [
      ['an', 'ABC', 'Analog logic (boiler control): 54 sheets'],
      ['dig', 'DITL', 'Digital interlock logic: all the DITL sheets']
    ].forEach(([k, l, t]) => {
      const b = E('button', { txt: l, title: t, on: () => setSub(k) });
      subBtns[k] = b;
      sub.append(b);
    });
    const sheetsBtn = E('button', {
      id: 'tbsheets',
      txt: '☰ Sheets',
      title: 'Sheet list',
      on: e => {
        e.stopPropagation();
        const s = $('side');
        if (s) s.classList.toggle('uiopen');
      }
    });
    /* 3.0.0 (Style 2 + CAD): the tools are a ribbon under the top bar, in named groups (SIM / VIEW / LAYERS / TRACE).
       The same elements and handlers; Fit of ABC and of DITL sit in one VIEW group with zoom − / + (one mouse-wheel step each). */
    const zoomBy = dy => {
      const s = $('svg');
      if (!s) return;
      const r = s.getBoundingClientRect();
      for (let i = 0; i < 2; i++)
        s.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true }));
    };
    const zOut = E('button', { txt: '−', title: 'Zoom out', 'aria-label': 'Zoom out', on: () => zoomBy(100) }),
      zIn = E('button', { txt: '+', title: 'Zoom in (read the small text)', 'aria-label': 'Zoom in', on: () => zoomBy(-100) });
    const gRun = E('div', { cls: 'tb g-run', 'data-label': 'SIM' }, [run, view, reset, speedSel, back, next, stepSel]);
    /* 2.5.0-beta.9/13 (user): the DITL bar = [VIEW | ▶ Run] + Reset + Back + Zoom + Panel (src/ui/shell/ditl.js); its Fit stays in the VIEW group */
    const gDitl = E('div', { cls: 'tb g-ditl', 'data-label': 'SIM' }, window.DUI ? DUI.bar(null) : [mode]);
    const gZoom = E('div', { cls: 'tb g-zoom', 'data-label': 'VIEW' }, [AN_(fit), DI_(dfit), zOut, zIn]);
    /* 3.0.0: Inputs layer = rings on the drawing at what the operator can set or force (AN.markInputs, plant-window.js) */
    const inputs = E('button', {
      txt: 'Inputs',
      title: 'Amber rings on the drawing = the digital / analog inputs you can switch or force (listed in the Inspector)',
      on: () => {
        AN.inMark = !AN.inMark;
        inputs.classList.toggle('on', AN.inMark);
        if (AN.markInputs) AN.markInputs();
      }
    });
    /* 3.0.0: pressing Run shows the Faceplate (controllers, trend, input buttons); the Inspector tab is one click away */
    run.addEventListener('click', () =>
      setTimeout(() => {
        if (!AN.run || document.body.classList.contains('ophmi') || !document.body.classList.contains('an')) return;
        const f = [...document.querySelectorAll('.hmitabs button')].find(b => b.textContent.trim() === 'Faceplate');
        if (f) f.click();
      }, 0)
    );
    const gView = E('div', { cls: 'tb g-view', 'data-label': 'LAYERS' }, [values, wire, inputs, panel]);
    const gNav = E('div', { cls: 'tb g-nav', 'data-label': 'TRACE' }, [AN_(xback)]);
    const gSheet = E('div', { cls: 'tb g-sheet' }, [sheetsBtn, AN_(shbox), DI_(dshbox)]);
    /* OPERATE: Start ▾ (starting state of the plant, TCS, field valves) and the CHECK scenarios */
    /* 3.2.0-beta.20: the starting state and the plant model moved to the Plant chip beside VIEW | RUN (user pick B); this menu keeps
       the TCS panel and the field equipment / valves */
    const startBtn = E('button', { txt: 'TCS / Field ▾', title: 'TCS panel (turbine roll, sync, load up, target MW) and the field equipment and valves without a DCS signal. The starting state and the plant model: the Plant chip beside VIEW | RUN.' });
    const start = dropdown(startBtn, 'left');
    buildStart(start);
    buildPlantChip(start);
    const gOp = E('div', { cls: 'tb g-op' }, [start.w]);
    pvPop = () => pvWindow(start.w, gOp, run, chip, clock);
    const tbar = E('div', { cls: 'tbar' }, [gRun, gDitl, gZoom, gView, gNav, gSheet, gOp]);
    const srch = E('div', { cls: 'gs-search' }, [ansb, gscope]);
    /* narrow screens: the search is one icon; it opens as a full-width row under the bar */
    const srchBtn = E('button', {
      id: 'srchbtn',
      cls: 'ico',
      html: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="4.6"/><path d="M10.4 10.4 14 14"/></svg>',
      title: 'Search a tag, description, address or memory (ABC + DITL)',
      on: e => {
        e.stopPropagation();
        const o = !document.body.classList.contains('srchopen');
        document.body.classList.toggle('srchopen', o);
        if (o) setTimeout(() => ansb.focus(), 0);
      }
    });
    document.addEventListener('click', e => {
      if (!document.body.classList.contains('srchopen')) return;
      if (e.target.closest && e.target.closest('.gs-search,#anfind,#infocard,#srchbtn')) return;
      document.body.classList.remove('srchopen');
    });
    ansb.addEventListener('keydown', e => {
      if (e.key === 'Escape') document.body.classList.remove('srchopen');
    });
    /* plain names for two tools */
    if (ln) ln.textContent = 'F(X) tables';
    if (second) second.textContent = 'Second sheet';
    /* ⚙: appearance, channel, update */
    const setBtn = E('button', { cls: 'ico', html: GEAR, title: 'Settings: theme, drawing, channel, update' });
    const set = dropdown(setBtn, 'gs-set');
    set.head('Appearance');
    /* 3.0.0: one app font; the older look selectors (font, UI skin, live colour, symbol theme) keep their defaults and are not shown */
    document.documentElement.dataset.font = 'plexc';
    {
      const th = E('select', { id: 'thsel', title: 'Colours of the app (the drawing has its own setting below)', 'aria-label': 'App theme' });
      /* 3.2.0-beta.8 (user 2026-10-23 "bakit light lang, bakit dark lang, hindi pwedeng baguhin ang mga kulay?"): four themes */
      [
        ['light', 'Theme: Light'],
        ['dark', 'Theme: Dark'],
        ['grey', 'Theme: Control room grey'],
        ['hc', 'Theme: High contrast']
      ].forEach(([v, t]) => th.append(E('option', { value: v, txt: t })));
      /* 3.2.0-beta.6 (user 2026-10-22 "AYAW KO NG PUTI"): dark is the default; a new key so the old light default does not carry over */
      const tv = ls.get('ls-theme4'),
        t0 = ['light', 'grey', 'hc'].includes(tv) ? tv : 'dark';
      th.value = t0;
      document.documentElement.dataset.theme = t0;
      th.onchange = () => {
        document.documentElement.dataset.theme = th.value;
        ls.set('ls-theme4', th.value);
      };
      set.m.append(th);
    }
    if ($('dgsel')) set.m.append($('dgsel'));
    if ($('dgtsel')) set.m.append($('dgtsel'));
    {
      const hold = E('div', { hidden: '' }, [uisel, live && AN_(live), theme && AN_(theme), slive && DI_(slive)]);
      document.body.append(hold);
    }
    set.head('Engineering');
    set.m.append(E('button', { id: 'engtools', txt: 'Engineering tools', title: 'Block tests, audit, health, project files, drawing edit, simulation switches', on: () => setTab('tools') }));
    set.head('Channel and update');
    if ($('chsel')) set.m.append($('chsel'));
    if ($('updbtn')) {
      $('updbtn').textContent = 'Check for update';
      set.m.append($('updbtn'));
    }
    /* 3.2.0 retest #23: the update button made after the page load goes straight into this menu (it sat over the Home heading until the
       next check of the 2 s interval below) */
    window.lsUpdHome = b => {
      b.textContent = 'Check for update';
      set.m.append(b);
    };
    const brand = E('div', {
      cls: 'brand',
      title: 'DCS Logic Simulator',
      html: '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="5" width="16" height="7" rx="3.5"/><path d="M8 12v6M16 12v6"/></svg></i><span>DCS Logic Simulator</span>'
    });
    /* 3.1.0: the old dark ABC skin (category-search.js) is replaced by the shell stylesheet */
    {
      const sk = $('skin');
      if (sk) sk.remove();
    }
    gs.append(brand, tabs, sub, srchBtn, srch, set.w, tbar);
    /* 3.0.0: CAD icons on the ribbon and the tabs (CSS masks in app.css); the labels stay, no handler reads them */
    [[view, 'eye'], [reset, 'reset'], [fit, 'fit'], [dfit, 'fit'], [values, 'hash'], [wire, 'wave'], [inputs, 'target'], [panel, 'side']].forEach(
      ([b, k]) => {
        if (!b) return;
        b.dataset.ic = k;
        if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.textContent.trim());
        if (!b.title) b.title = b.textContent.trim();
      }
    );
    const TIC = { Home: 'home', 'Plant view': 'plant', Logic: 'logic', Library: 'book', Training: 'learn', Tools: 'tool' };
    tabs.querySelectorAll('button').forEach(b => {
      const k = TIC[b.textContent.trim()];
      if (k) {
        b.dataset.ic = k;
        b.setAttribute('aria-label', b.textContent.trim());
      }
    });
    /* ===== 3.0.0-beta.5 OVERHAUL (the Style 2 + CAD mockup): one top bar with the sheet name and the VIEW | RUN switch,
       a CAD ribbon (large icon buttons with the group name under them in VIEW, one compact row in RUN), Sheets | Inputs on
       the left. The elements are the app's own (same handlers); only where they sit and how they look changes. ===== */
    const isAn = () => document.body.classList.contains('an');
    const ditlSim = () => {
      try {
        return !!SIM;
      } catch (e) {
        return false;
      }
    };
    /* a button of the DITL bar (src/ui/shell/ditl.js), hidden in the ribbon: VIEW / RUN of the top bar press it */
    const dui = c => document.querySelector('#gsbar .g-ditl ' + c);
    /* the sheet name moves into the top bar: the ABC and DITL title strips themselves (their scripts keep filling them) */
    const crumb = E('div', { cls: 'crumb' });
    if ($('anmeta')) crumb.append($('anmeta'));
    if ($('meta')) crumb.append($('meta'));
    sub.after(crumb);
    /* VIEW | RUN: the one mode switch (ABC: View / Run; DITL: Run / Stop) */
    const segV = E('button', {
        txt: 'VIEW',
        title: 'VIEW: look and trace; nothing runs, the inputs are locked',
        on: () => {
          if (isAn()) {
            if (!AN.view) view.click();
            else if (AN.run) {
              /* 3.2.0-beta.8: the clock runs while the page is in VIEW (Start ▾): the View button twice = RUN off, then VIEW (stops the clock) */
              view.click();
              view.click();
            }
          } else if (dui('.tb-view')) dui('.tb-view').click();
          else if (ditlSim()) mode.click();
        }
      }),
      segR = E('button', {
        txt: 'RUN',
        title: 'RUN: the logic runs; switch and force the inputs',
        on: () => {
          if (isAn()) {
            if (AN.view || !AN.run) run.click();
          } else if (dui('.dui-run')) dui('.dui-run').click(); /* the DITL Run of ditl.js: SIM on, not paused, 1x (2.5.0-beta.9) */
          else if (!ditlSim()) mode.click();
        }
      }),
      seg = E('div', { cls: 'seg' }, [segV, segR]);
    srch.after(seg);
    /* VIEW ribbon: Navigate / View / Layers / Reference (the group name is under the buttons) */
    const ioBtn = E('button', { txt: 'I/O list', title: 'LIBRARY: I/O list and memory lists', on: () => setTab('library') }),
      fxBtn = E('button', { txt: 'F(X)', title: 'F(X) curves: the linear tables as in the workbook, editable, with what each one does', on: () => ln && ln.click() }),
      gRef = E('div', { cls: 'tb g-ref', 'data-label': 'REFERENCE' }, [ioBtn, AN_(fxBtn)]);
    gNav.dataset.label = 'NAVIGATE';
    gView.after(gRef);
    {
      const lg = () => crumb.querySelector('#anmeta .lg > button');
      /* Legend & style sits with the layers (its button is rebuilt with each sheet: the ribbon button presses it) */
      const lgMk = id =>
        E('button', {
          txt: 'Legend',
          title: id === 'anlg' ? 'Colour code of the symbols, valves and wires; wire style' : 'DITL legend: 1 / 0 colours, rows and symbols',
          on: e => {
            const p = $(id),
              r = e.currentTarget.getBoundingClientRect();
            /* R9 #90: toggles the popup itself (the sheet's own Legend button is not there on every page) */
            if (p) p.style.display = p.style.display === 'block' ? 'none' : 'block';
            if (p && r.width) {
              p.style.top = r.bottom + 6 + 'px';
              p.style.right = 'auto';
              p.style.left = Math.max(8, Math.min(innerWidth - p.offsetWidth - 8, r.left)) + 'px';
            }
          }
        });
      const lgBtn = lgMk('anlg'),
        lgDi = lgMk('dilg');
      gView.append(AN_(lgBtn));
      /* live check #90: the DITL toolbar has its own Legend (ditl.js #dilg) */
      gDitl.append(lgDi);
      lgDi.dataset.ic = 'legend';
      [[ioBtn, 'book'], [fxBtn, 'curve'], [lgBtn, 'legend'], [zIn, 'zin'], [zOut, 'zout'], [xback, 'back']].forEach(([b, k]) => b && (b.dataset.ic = k));
      zIn.textContent = 'Zoom in';
      zOut.textContent = 'Zoom out';
      if (xback) xback.title = xback.title || 'Back to where the trace jumped from';
    }
    /* left: Sheets | Inputs (ABC). Inputs = the digital / analog inputs of this sheet (the Inspector rows), each with its own
       control: a 0 / 1 press goes to the same button in the Inspector, a click on the name shows it on the drawing. */
    const side = $('side'),
      sideTabs = E('div', { id: 'sidetabs' }),
      inl = E('div', { id: 'inlist' });
    const stS = E('button', { cls: 'on', txt: 'Sheets', on: () => sideMode(false) }),
      stI = E('button', { txt: 'Inputs', on: () => sideMode(true) });
    sideTabs.append(stS, stI);
    const sideMode = on => {
      side.classList.toggle('inp', on);
      stS.classList.toggle('on', !on);
      stI.classList.toggle('on', on);
      if (on) inBuild(true);
    };
    if (side) {
      const hd = $('sidehd');
      hd ? hd.after(sideTabs) : side.prepend(sideTabs);
      sideTabs.after(inl);
    }
    let inRows = null;
    const inBuild = force => {
      const rows = window.AN && AN.rows;
      if (!rows || (!force && rows === inRows)) return;
      inRows = rows;
      inl.textContent = '';
      /* 3.2.0-beta.9 (user: "dami ko na indi nafoforce, sa lumang version na-foforce ko"): every group of the 2.4.0 Inspector list
         is here again (setpoints, timers, COS manual values and change-overs, signals to force, from other sheets), not only the
         digital and analog inputs; the long groups start folded; a filter on top */
      const secs = {};
      for (const k in rows) {
        const r = rows[k];
        if (!r._sec || /^controllers$/i.test(r._sec)) continue;
        (secs[r._sec] = secs[r._sec] || []).push(r);
      }
      const ORD = [/digital/i, /analog/i, /^COS/i, /setpoints/i, /timers/i, /signals to force/i, /other sheets/i];
      const rank = x => {
        const i = ORD.findIndex(re => re.test(x));
        return i < 0 ? 99 : i;
      };
      const flt = E('input', { cls: 'inq', type: 'search', placeholder: 'Filter: tag, address, description', 'aria-label': 'Filter the inputs of this sheet' });
      flt.value = inQ;
      flt.oninput = () => {
        inQ = flt.value;
        inFilter();
      };
      inl.append(flt);
      let n = 0;
      for (const s of Object.keys(secs).sort((a, b) => rank(a) - rank(b))) {
        const io = /inputs/i.test(s);
        if (!(s in inShut)) inShut[s] = /signals to force|other sheets/i.test(s);
        const h = E('button', {
          cls: 'inh ingh' + (inShut[s] ? ' shut' : ''),
          txt: s.replace(/ inputs/i, '').toUpperCase() + ' · ' + secs[s].length,
          'aria-expanded': String(!inShut[s]),
          on: () => {
            inShut[s] = !inShut[s];
            h.classList.toggle('shut', inShut[s]);
            h.setAttribute('aria-expanded', String(!inShut[s]));
            inFilter();
          }
        });
        h.dataset.s = s;
        inl.append(h);
        for (const r of secs[s]) {
          n++;
          if (!io) {
            /* the row of the Inspector itself, with its own control (FORCE 1 / 0, value + ✓, Auto / Force A / B, Skip, ↗ sheet) */
            const tg = r.querySelector('.tg');
            if (tg && !tg.dataset.in) {
              tg.dataset.in = '1';
              tg.title = 'Show it on the drawing';
            }
            const it = E('div', { cls: 'ini inrow' }, [r]);
            it.dataset.s = s;
            inl.append(it);
            continue;
          }
          const tg = r.querySelector('.tg'),
            ds = r.querySelector('.ds'),
            ctl = r.querySelector('.l1 button'),
            num = r.querySelector('.l1 input[type=number]'),
            nm = E('div', { cls: 'inn', title: (tg ? tg.textContent : '') + (ds ? '\n' + ds.textContent : '') }, [E('b', { txt: tg ? tg.textContent : '' }), ds ? E('small', { txt: ds.textContent }) : null]); /* 3.2.0-beta.6 (audit L1): full name on hover */
          nm.onclick = () => tg && tg.click();
          const it = E('div', { cls: 'ini' }, [nm]);
          it.dataset.s = s;
          if (ctl) {
            /* a 0 | 1 switch (OFF | ON for a bad-signal flag); F = forced by you */
            const word = /signal/i.test(ctl.textContent),
              p = E('button', {
                cls: 'inb',
                title: ctl.title || 'Switch this input',
                html: '<i>' + (word ? 'OFF' : '0') + '</i><i>' + (word ? 'ON' : '1') + '</i>',
                on: () => {
                  if (!AN.view) ctl.click();
                }
              }),
              fb = E('span', { cls: 'inf', txt: 'F', title: 'Forced' });
            it.append(fb, p);
            it._u = () => {
              const t = ctl.textContent.trim();
              p.classList.toggle('one', /^1\b|\bON\b/.test(t) && !/^0\b/.test(t));
              const fo = ctl.classList.contains('fo') || !!r.querySelector('.fo');
              it.classList.toggle('fo', fo);
              p.disabled = !!AN.view;
            };
          } else if (num) {
            /* 3.2.0-beta.9 (user: "dami ko na indi nafoforce, sa lumang version na-foforce ko"): an analog input (transmitter, COS
               manual SV / MV) is typed here again, as in the 2.4.0 Inspector list: the value goes to the same field of the row */
            const unit = r.querySelector('.l1 small'),
              v = E('input', { cls: 'inset', type: 'number', step: 'any', 'aria-label': 'Value of ' + (tg ? tg.textContent : 'input'), title: 'Type a value, Enter = set (RUN)' });
            const put = () => {
              const x = parseFloat(v.value);
              if (!isFinite(x)) return;
              num.value = x;
              num.dispatchEvent(new Event('change'));
              v.blur();
            };
            v.onkeydown = e => {
              if (e.key === 'Enter') put();
              if (e.key === 'Escape') {
                v.value = num.value;
                v.blur();
              }
            };
            v.onchange = put;
            it.append(v);
            if (unit && unit.textContent.trim()) it.append(E('small', { cls: 'inu', txt: unit.textContent.trim() }));
            it._u = () => {
              if (document.activeElement !== v) v.value = num.value;
            };
          }
          inl.append(it);
        }
      }
      if (!n) inl.append(E('div', { cls: 'inh', txt: 'No inputs on this sheet' }));
      stI.textContent = 'Inputs ' + n;
      inFilter();
    };
    let inQ = '';
    const inShut = {};
    /* the filter shows the matching rows of every group (open or folded); without a filter a folded group shows its title only */
    const inFilter = () => {
      const q = inQ.trim().toLowerCase();
      const cnt = {};
      inl.querySelectorAll('.ini').forEach(it => {
        const hit = !q || it.textContent.toLowerCase().includes(q);
        const show = hit && (q ? true : !inShut[it.dataset.s]);
        it.style.display = show ? '' : 'none';
        if (hit) cnt[it.dataset.s] = (cnt[it.dataset.s] || 0) + 1;
      });
      inl.querySelectorAll('.ingh').forEach(h => (h.style.display = !q || cnt[h.dataset.s] ? '' : 'none'));
    };
    setInterval(() => {
      if (!isAn() || tab !== 'logic') return;
      inBuild(false);
      if (side && side.classList.contains('inp')) inl.querySelectorAll('.ini').forEach(i => i._u && i._u());
      const mk = $('inmk');
      if (mk && AN.rows)
        mk.querySelectorAll('circle').forEach(c => {
          const r = AN.rows[c.dataset.k];
          c.classList.toggle('fo', !!(r && r.querySelector('.fo')));
        });
    }, 400);
    /* modes: VIEW (large ribbon) or RUN (one compact row); the switch and the status line follow */
    setInterval(() => {
      const an_ = isAn(),
        sim = an_ ? !!(window.AN && (!AN.view || AN.run)) : ditlSim(); /* 3.2.0-beta.8: Start ▾ runs the clock while the page was in VIEW: show RUN */
      document.body.classList.toggle('simmode', sim);
      segV.classList.toggle('on', !sim);
      segR.classList.toggle('on', sim);
      const paused = an_ && sim && !AN.run;
      segR.textContent = paused ? 'PAUSED' : 'RUN';
      segR.classList.toggle('paused', paused);
      if (!an_ && side && side.classList.contains('inp')) sideMode(false);
      const inf = crumb.querySelector('#anmeta small');
      if (foot) {
        let si = foot.querySelector('.sinfo');
        if (!si) foot.append((si = E('span', { cls: 'sinfo' })));
        si.textContent = an_ && inf ? inf.textContent : '';
      }
    }, 300);
    /* ===== 3.0.0-beta.7 STYLE 2 + CAD, the details of the mockups: the drawing is a sheet of paper on a desk with CAD
       rulers, a dark zoom bar floats over it (sheet ‹ ›, − zoom % +, Fit), a "selected block" card heads the Inspector,
       the status line counts the forced signals and names the selection, "/" opens the search. ===== */
    {
      const cv = $('cv'),
        svgE = $('svg');
      /* floating zoom bar: the ribbon VIEW group moves into it (the same Fit buttons) */
      const sheetBtn = (dir, title) =>
        E('button', {
          cls: 'zb',
          txt: dir < 0 ? '‹' : '›',
          title,
          on: () => {
            const box = isAn() ? $('anshbox') : $('shbox'),
              bs = box ? [...box.querySelectorAll('button')] : [];
            const b = dir < 0 ? bs[0] : bs[bs.length - 1];
            if (b) b.click();
          }
        });
      const zPct = E('span', { cls: 'zpct', txt: '100%', title: '100% = the whole sheet (Fit)' });
      const zo = E('button', { cls: 'zb', txt: '−', title: 'Zoom out', 'aria-label': 'Zoom out', on: () => zoomBy(100) }),
        zi = E('button', { cls: 'zb', txt: '+', title: 'Zoom in', 'aria-label': 'Zoom in', on: () => zoomBy(-100) });
      const fitW = [...gZoom.children].filter(x => x.querySelector && x.querySelector('#bfit, button'));
      const zbar = E('div', { id: 'zbar' }, [sheetBtn(-1, 'Previous sheet'), sheetBtn(1, 'Next sheet'), E('i', { cls: 'zsep' }), zo, zPct, zi, E('i', { cls: 'zsep' })]);
      fitW.forEach(w => zbar.append(w));
      [fit, dfit].forEach(b => b && b.addEventListener('click', () => setTimeout(() => (zRef = null), 60)));
      document.body.append(zbar);
      zIn.remove();
      zOut.remove();
      gZoom.style.display = 'none';
      /* CAD rulers along the top and left edge of the drawing, in drawing units, following pan and zoom */
      const rT = E('canvas', { id: 'rulert' }),
        rL = E('canvas', { id: 'rulerl' }),
        rC = E('div', { id: 'rulerc' });
      document.body.append(rT, rL, rC);
      let zRef = null,
        zSheet = '',
        last = '',
        ink = null;
      const nice = v => {
        const p = Math.pow(10, Math.floor(Math.log10(v))),
          m = v / p;
        return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
      };
      const drawRuler = (c, len, horiz, v0, perPx, flip) => {
        const dpr = Math.min(2, devicePixelRatio || 1),
          T = 18;
        c.width = (horiz ? len : T) * dpr;
        c.height = (horiz ? T : len) * dpr;
        const g = c.getContext('2d');
        g.scale(dpr, dpr);
        g.fillStyle = ink.bg;
        g.fillRect(0, 0, horiz ? len : T, horiz ? T : len);
        g.strokeStyle = ink.line;
        g.fillStyle = ink.tx;
        g.font = '9.5px ' + ink.font;
        g.lineWidth = 1;
        const step = nice(80 * perPx),
          minor = step / 5,
          a = v0,
          b = v0 + len * perPx;
        g.beginPath();
        for (let u = Math.ceil(a / minor) * minor; u <= b; u += minor) {
          const px = Math.round((u - a) / perPx) + 0.5,
            major = Math.abs(u / step - Math.round(u / step)) < 1e-6,
            h = major ? 9 : 4;
          if (horiz) {
            g.moveTo(px, T);
            g.lineTo(px, T - h);
          } else {
            g.moveTo(T, px);
            g.lineTo(T - h, px);
          }
          if (major) {
            const lab = String(Math.round((flip ? -u : u) * 100) / 100);
            if (horiz) g.fillText(lab, px + 3, 9);
            else {
              g.save();
              g.translate(9, px - 3);
              g.rotate(-Math.PI / 2);
              g.fillText(lab, 0, 0);
              g.restore();
            }
          }
        }
        g.stroke();
        g.beginPath();
        if (horiz) {
          g.moveTo(0, T - 0.5);
          g.lineTo(len, T - 0.5);
        } else {
          g.moveTo(T - 0.5, 0);
          g.lineTo(T - 0.5, len);
        }
        g.strokeStyle = ink.edge;
        g.stroke();
      };
      const tick = () => {
        const show = tab === 'logic' && cv && svgE && cv.offsetParent !== null;
        document.body.classList.toggle('rulers', !!show);
        if (!show) return;
        const r = svgE.getBoundingClientRect(),
          vb = (svgE.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number),
          name = (isAn() ? 'a' : 'd') + (crumb.textContent || ''),
          theme = document.documentElement.dataset.theme + (document.documentElement.dataset.dg || '');
        if (vb.length !== 4 || !(vb[2] > 0) || !r.width) return;
        if (name !== zSheet) {
          zSheet = name;
          zRef = null;
        }
        if (!zRef) zRef = vb[2];
        const key = [r.left, r.top, r.width, r.height, vb.join(','), theme].join('|');
        if (key === last) return;
        last = key;
        if (!ink || ink.k !== theme) {
          const cs = getComputedStyle(document.documentElement),
            v = n => cs.getPropertyValue(n).trim();
          ink = { k: theme, bg: v('--c-ribbon') || '#f7f8fa', line: v('--c-line2') || '#8f989f', tx: v('--c-dim') || '#5b646c', edge: v('--c-line') || '#d6dadf', font: v('--mf') || 'monospace' };
        }
        /* the svg keeps the aspect (meet): the visible drawing area is the view box widened on one axis */
        const s = Math.min(r.width / vb[2], r.height / vb[3]),
          x0 = vb[0] - (r.width / s - vb[2]) / 2,
          y0 = vb[1] - (r.height / s - vb[3]) / 2;
        rT.style.cssText = `left:${r.left + 18}px;top:${r.top}px;width:${r.width - 18}px`;
        rL.style.cssText = `left:${r.left}px;top:${r.top + 18}px;height:${r.height - 18}px`;
        rC.style.cssText = `left:${r.left}px;top:${r.top}px`;
        drawRuler(rT, r.width - 18, true, x0 + 18 / s, 1 / s, false);
        drawRuler(rL, r.height - 18, false, y0 + 18 / s, 1 / s, isAn());
        zPct.textContent = Math.round((zRef / vb[2]) * 100) + '%';
        /* centred on the part of the drawing that is not under an overlay panel (tablet) */
        let right = r.right;
        [$('anp'), $('opp')].forEach(pn => {
          if (!pn || pn.offsetParent === null) return;
          const q = pn.getBoundingClientRect();
          if (q.width && q.left > r.left + 100 && q.left < right) right = q.left;
        });
        zbar.style.left = r.left + (right - r.left) / 2 + 'px';
        zbar.style.top = r.bottom - 52 + 'px';
      };
      setInterval(tick, 120);
      /* "/" or Ctrl+K: the search */
      addEventListener('keydown', e => {
        const t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        if (e.key === '/' || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) {
          e.preventDefault();
          if (getComputedStyle(srchBtn).display !== 'none') srchBtn.click();
          ansb.focus();
          ansb.select();
        }
      });
      ansb.placeholder = 'Search tag, address, description';
      srch.append(E('kbd', { cls: 'skbd', txt: '/', title: 'Press / (or Ctrl+K) to search' }));
      /* breadcrumb: Logic › ABC analog › */
      crumb.prepend(E('span', { cls: 'cpath' }));
      /* selected block card (ABC): name, kind, the values in and out, Open faceplate */
      const card = E('div', { id: 'selcard' });
      let cardKey = '';
      const fmt = x => (x == null || !isFinite(x) ? '—' : (Math.abs(x) >= 100 ? x.toFixed(1) : x.toFixed(2)).replace(/^-(0(?:\.0+)?)$/, '$1'));
      const cardUpd = () => {
        const anp = $('anp'),
          sel = $('ansel');
        if (!anp || !sel || !isAn() || !window.AN) return;
        if (card.parentNode !== anp || card.nextSibling !== sel) sel.before(card);
        const sh = AN.sheets && AN.sheets[AN.i],
          S = sh && sh.S,
          s = AN.sel,
          b = s && s.blk;
        anp.classList.toggle('hassel', !!(s && (b || s.net != null)));
        if (!S || !s || (!b && s.net == null)) {
          if (cardKey) {
            card.textContent = '';
            cardKey = '';
          }
          return;
        }
        const nmf = n => (typeof nm === 'function' ? nm(S, n) : 'net ' + n),
          isD = n => S.nets[n] && S.nets[n].dig,
          val = n => (isD(n) ? (S.rt.v[n] > 0.5 ? '1' : '0') : fmt(S.rt.v[n])),
          key = (b ? 'b' + b.id : 'n' + s.net) + '|' + sh.name;
        if (key !== cardKey) {
          cardKey = key;
          card.textContent = '';
          /* 3.2.0-beta.18 (VIEW/TRACE audit): a wire with no tag of its own showed "net 39" and a line "null" (no block text):
             now the name of the block that drives it, as the trace rows ("F(X) out"), and no empty line */
          const drv = !b && /^net \d+$/.test(nmf(s.net)) ? S.blk.find(x => (x.o || []).includes(s.net)) : null,
            lk = !b && !drv && S.xlk ? S.xlk[s.net] : null,
            name = b
              ? b.tag || (b.txt || []).filter(Boolean)[1] || b.k + ' #' + b.id
              : drv
                ? (drv.tag || drv.k) + ' out'
                : lk && lk.from
                  ? 'from ' + lk.from.name + (lk.num != null ? ' (' + (lk.tag ? 'tag ' : 'circle ') + lk.num + ')' : '')
                  : nmf(s.net),
            kind = b ? b.k : 'WIRE',
            fp = b && b.tag && /^(PID|PIDV|MAN)/.test(b.k);
          card.append(
            E('div', { cls: 'sch' }, [E('small', { txt: b ? 'SELECTED BLOCK' : 'SELECTED WIRE' }), E('span', { cls: 'chip', txt: kind })]),
            E('b', { cls: 'scn', txt: name }),
            ...(b && b.txt ? [E('div', { cls: 'scd', txt: b.txt.filter(Boolean).join(' · ') })] : [])
          );
          const grid = E('div', { cls: 'scv' });
          const cell = (lab, n) => {
            const v = E('b', { txt: val(n) });
            v._n = n;
            grid.append(E('div', { title: nmf(n) }, [E('small', { txt: lab }), v]));
          };
          if (b) {
            (b.i || []).slice(0, 3).forEach((n, k) => cell('IN' + ((b.i || []).length > 1 ? ' ' + (k + 1) : ''), n));
            (b.o || []).slice(0, 3).forEach((n, k) => cell('OUT' + ((b.o || []).length > 1 ? ' ' + (k + 1) : ''), n));
          } else cell('VALUE', s.net);
          card.append(grid);
          /* 3.2.0 P3 (Inspector, after-logic mockup): where the signals of the block come from and go to on this sheet (read
             from the netlist of the drawing; nothing is changed) */
          if (b) {
            const who = x => x.k + ' ' + (x.tag || (x.txt || []).filter(Boolean)[1] || '#' + x.id),
              wn = n => (/^net \d+$/.test(nmf(n)) ? '' : nmf(n)),
              lst = (title, rows) => {
                if (!rows.length) return;
                const box = E('div', { cls: 'scl' }, [E('small', { txt: title })]);
                rows.slice(0, 6).forEach(([n, t]) => {
                  const v = E('b', { txt: val(n) });
                  v._n = n;
                  box.append(E('div', { title: [t, wn(n)].filter(Boolean).join(' · ') }, [E('span', { cls: 'scn2', txt: t }), E('span', { cls: 'scw', txt: wn(n) }), v]));
                });
                if (rows.length > 6) box.append(E('div', { cls: 'scm', txt: '+ ' + (rows.length - 6) + ' more' }));
                card.append(box);
              };
            lst(
              'COMES FROM',
              (b.i || []).filter(n => n != null && n >= 0).map(n => {
                const d = S.blk.find(x => x !== b && (x.o || []).includes(n));
                return [n, d ? who(d) : 'input of the sheet'];
              })
            );
            const go = [];
            (b.o || []).forEach(n => {
              if (n == null || n < 0) return;
              const L = S.blk.filter(x => x !== b && (x.i || []).includes(n));
              if (!L.length) go.push([n, 'output of the sheet']);
              L.forEach(x => go.push([n, who(x)]));
            });
            lst('GOES TO', go);
          }
          if (fp)
            card.append(
              E('button', {
                cls: 'scb keep',
                txt: 'Open faceplate',
                on: () => {
                  const f = [...document.querySelectorAll('.hmitabs button')].find(x => x.textContent.trim() === 'Faceplate');
                  if (f) f.click();
                  setTimeout(() => {
                    const c = [...document.querySelectorAll('.fpov .ovc')].find(x => x.dataset.t === b.tag);
                    if (c) c.click();
                  }, 120);
                }
              })
            );
        }
        card.querySelectorAll('.scv b,.scl b').forEach(e => (e.textContent = val(e._n)));
      };
      /* status line: forced signals and the selection */
      const sForce = E('span', { cls: 'sforce', title: 'Signals forced by you (Inspector > Forced signals)' }),
        sSel = E('span', { cls: 'ssel' });
      const sinfoPut = () => {
        const si = foot && foot.querySelector('.sinfo');
        if (si && sForce.parentNode !== foot) si.before(sSel, sForce);
      };
      setInterval(() => {
        try {
          cardUpd();
        } catch (e) {}
        sinfoPut();
        const h = [...document.querySelectorAll('#anp h4')].find(x => /FORCED SIGNALS/i.test(x.textContent)),
          n = isAn() && h ? +((h.textContent.match(/\((\d+)\)/) || [])[1] || 0) : 0;
        sForce.textContent = n ? 'FORCED ' + n : '';
        sForce.classList.toggle('on', n > 0);
        const s = isAn() && window.AN && AN.sel,
          sh = s && AN.sheets[AN.i];
        sSel.textContent = s && s.blk ? 'Selected: ' + s.blk.k + ' ' + (s.blk.tag || '#' + s.blk.id) : s && s.net != null && sh && sh.S && typeof nm === 'function' ? 'Selected: ' + nm(sh.S, s.net) : '';
        const cp = crumb.querySelector('.cpath');
        if (cp) cp.textContent = isAn() ? 'ABC analog ›' : 'DITL digital ›';
      }, 300);
    }
    /* 3.1.0-beta.3: the text symbols on the buttons of every panel (✕ ✓ ◀ ▶ ◀◀ ▶▶ ▲ ▼ ⓘ ⤢ ❚❚ …) are drawn as one set of
       line icons. The text of the button does not change (handlers and tests read it): a whole-symbol button gets
       data-g, a symbol before / after a word is wrapped in <span class="gi" data-g> and the stylesheet draws the icon. */
    {
      const G = { '✕': 'x', '×': 'x', '✖': 'x', '✓': 'check', '✔': 'check', '◀': 'cl', '‹': 'cl', '◄': 'cl', '▶': 'cr', '›': 'cr', '►': 'cr', '◀◀': 'skipb', '▶▶': 'skipf', '▲': 'cu', '▼': 'cd', '▾': 'cd', 'ⓘ': 'info', '⤢': 'expand', '−': 'minus', '+': 'plus', '❚❚': 'pause', '↩': 'back', '☰': 'menu', '📍': 'pin', '🎲': 'dice', '📂': 'folder', '💾': 'save' };
      const LEAD = { '▶': 'play', '❚❚': 'pause' };
      const skip = b => b.closest('.fp,.fpop,svg,#sidelist,#anlist,#pllist,.libg,#anfind');
      const tag = () => {
        for (const b of document.querySelectorAll('button')) {
          const t = b.textContent;
          if (b._gt === t) continue;
          b._gt = t;
          if (skip(b)) continue;
          const s = t.trim();
          b.removeAttribute('data-g');
          if (G[s]) {
            b.dataset.g = G[s];
            if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.title || s);
            continue;
          }
          if (b.querySelector('.gi')) continue;
          const n = b.firstChild;
          if (!n || n.nodeType !== 3 || b.childNodes.length !== 1) continue;
          const m = s.match(/^(❚❚|◀◀|▶▶|[▶◀✕✓↩☰📍🎲📂💾⤢▾▼▲])\s+(.+)$/u) || s.match(/^(.+?)\s+(⤢|▾|▼|▲|▶|◀)$/u);
          if (!m) continue;
          const lead = /^(❚❚|◀◀|▶▶|[▶◀✕✓↩☰📍🎲📂💾⤢▾▼▲])$/u.test(m[1]),
            g = lead ? m[1] : m[2],
            word = lead ? m[2] : m[1],
            gi = E('span', { cls: 'gi', 'data-g': (lead && LEAD[g]) || G[g], txt: g, 'aria-hidden': 'true' });
          b.textContent = '';
          if (lead) b.append(gi, ' ' + word);
          else b.append(word + ' ', gi);
          b._gt = b.textContent;
        }
      };
      /* panels that rebuild their buttons (UAT, CHECK, Inspector) get the icons at once: tag after each change, once per frame */
      let tq = false;
      new MutationObserver(() => {
        if (tq) return;
        tq = true;
        requestAnimationFrame(() => {
          tq = false;
          tag();
        });
      }).observe(document.body, { childList: true, subtree: true });
      tag();
    }
    /* --- TOOLS page --- */
    toolsws = E('div', { id: 'toolsws' });
    const grid = E('div', { cls: 'tgrid' });
    toolsws.append(grid);
    const card = (title, text, els) => {
      const c = E('div', { cls: 'tcard' }, [E('h3', { txt: title }), text ? E('p', { txt: text }) : null, E('div', { cls: 'row' }, els.filter(Boolean))]);
      grid.append(c);
      return c;
    };
    const cTest = card('Tests', '', []);
    const cAudit = card('Check the drawing', '', [
      AN_(audit),
      AN_(health),
      AN_(review),
      AN_(ln),
      AN_(assumed),
      AN_(ditlsig),
      AN_(second),
      AN_(hmi),
      DI_($('bhp'))
    ]);
    /* plant model ON / OFF (2.4.0-beta.4, user): ON = the PV answers the valve (loop model of each PID + boiler / turbine model);
       OFF = transmitters are free inputs and only the drawn logic runs (debugging the logic). The switch is the engine's own (AN.plantSwitch) */
    const pmBtn = E('button', {
      id: 'pmbtn',
      title: 'Plant model ON: the PV follows the valve (each PID loop + the boiler / turbine model). OFF: the PV is a free input, only the drawing logic runs.',
      on: () => {
        try {
          AN.plantSwitch(!AN.plantOn);
        } catch (e) {}
        pmUpd();
      }
    });
    const pmUpd = () => {
      const on = !!(window.AN && AN.plantOn);
      pmBtn.textContent = 'Plant model: ' + (on ? 'ON' : 'OFF');
      pmBtn.classList.toggle('on', on);
      document.body.classList.toggle('pmoff', !on);
    };
    const cSim = card('Simulation', '', [AN_(pmBtn)]);
    /* 2.4.0-beta.5: the old Plant window is replaced by the PLANT VIEW (its own window on a PC) */
    if (plantwin) plantwin.remove();
    if (prj) prj.classList.add('lp');
    const cPrj = card('Project files', 'Save or open the forced values and user values.', [AN_(save), AN_(saveas), AN_(openp), AN_(prj), AN_(importAbc)]);
    /* anything left in the old toolbars (future buttons) stays reachable here */
    const cOther = card('Other', '', []);
    document.body.append(toolsws);
    /* --- things created later by other scripts: UAT / CHECK buttons, update button, one-world switch, theme select --- */
    let n = 0,
      wb = null;
    setInterval(() => {
      /* after the first half minute the check runs every 2 s (late scripts: the update button comes after the page load) */
      if (++n > 80 && n % 5) return;
      const u = $('uatb'),
        c = $('chkb'),
        up = $('updbtn'),
        dg = $('dgsel'),
        w = document.querySelectorAll('.wbtn');
      if (u && u.parentNode !== cTest.querySelector('.row')) cTest.querySelector('.row').prepend(u);
      /* 2.4.1-beta.1 (UI audit): on a phone the bar has no room for CHECK (it was cut to "CHE" under the 🔍): it goes to
         the end of the Start ▾ menu there, and back to the bar on a wider screen */
      const cTo = matchMedia('(max-width:700px)').matches ? start.m : gOp;
      if (c && c.parentNode !== cTo) cTo.append(c);
      const ib = gs.querySelector(':scope > .infob');
      if (ib) srch.append(ib);
      plantUx();
      if (up && up.parentNode !== set.m) {
        up.textContent = 'Check for update';
        set.m.append(up);
      }
      if ($('chsel') && $('chsel').parentNode !== set.m) set.m.insertBefore($('chsel'), up && up.parentNode === set.m ? up : null);
      if (dg && dg.parentNode !== set.m) $('thsel') ? $('thsel').after(dg) : set.m.append(dg);
      if ($('dgtsel') && $('dgtsel').parentNode !== set.m) dg ? dg.after($('dgtsel')) : set.m.append($('dgtsel'));
      if (w.length) {
        if (!wb) wb = w[0];
        if (wb.parentNode !== cSim.querySelector('.row')) cSim.querySelector('.row').prepend(wb);
        w.forEach(x => x !== wb && (x.style.display = 'none'));
      }
      /* leftovers of the old toolbars */
      [an, bar].forEach(b => {
        [...b.children].forEach(x => {
          if (x.classList.contains('cat') || x.classList.contains('tbg') || x.id === 'tabs' || x.id === 'hp' || x.tagName === 'INPUT') return;
          if (x.tagName === 'DIV' && !x.textContent.trim()) return;
          if (x.hidden || x.style.display === 'none') return;
          cOther.querySelector('.row').append(b === an ? AN_(x) : DI_(x));
        });
      });
      cardsUpd();
    }, 400);
    /* a card with nothing to show on this page (ABC / DITL) is hidden; the wrappers (.only) have no size of their own */
    /* 2.4.1-beta.5 (user: TOOLS "panget tignan"): every tool shows what it does under its name, one tool per line */
    const TDESC = [
      [/^UAT/, 'Force each block of a sheet with known inputs and compare with its definition.'],
      [/^Audit/, 'Blocks and links the reader could not resolve.'],
      [/^Health/, 'Every sheet: OK, issue or failed.'],
      [/^Review marks/, 'Orange boxes where a link is in doubt.'],
      [/^F\(X\) tables/, 'Each linear curve as in the LINEAR CURVE workbook: edit the table, see what it does and where it goes.'],
      [/^Assumed/, 'Inputs that start from an assumed value.'],
      [/^DITL signals/, 'DITL addresses of the open sheet.'],
      [/^Second sheet/, 'Open another sheet side by side.'],
      [/^Plant model/, 'ON: the PV answers the valve (each PID loop and the boiler / turbine model). OFF: the PV is a free input.'],
      [/^ABC\s*\+\s*DITL/, 'ON: all the DITL sheets run with the ABC Run and pass signals both ways (one world).']
    ];
    function cardsUpd() {
      if (tab !== 'tools') return;
      grid.querySelectorAll('.tcard .row :is(button,label.b)').forEach(b => {
        const d = TDESC.find(x => x[0].test(b.textContent.trim()));
        if (d && b.dataset.d !== d[1]) b.dataset.d = d[1];
      });
      const w = e => e.getBoundingClientRect().width > 0;
      grid.querySelectorAll('.tcard').forEach(c => {
        c.style.display = '';
        const vis = [...c.querySelectorAll('.row > *')].some(x => (x.classList.contains('only') ? [...x.children].some(w) : w(x)));
        c.style.display = vis ? '' : 'none';
      });
    }
    setInterval(cardsUpd, 500);
    /* the active tab and category */
    setInterval(() => {
      const an_ = document.body.classList.contains('an');
      subBtns.an.classList.toggle('on', an_);
      subBtns.dig.classList.toggle('on', !an_);
      pmUpd();
    }, 300);
    addEventListener('resize', place);
    document.body.classList.add('app2');
    /* the name of the app in the window and browser tab (the html keeps <title>Logic Sim v…>: installed older versions read it to find updates) */
    document.title = document.title.replace(/^Logic Sim /, 'DCS Logic Simulator ');
    try {
      if (typeof TPMIN !== 'undefined' && !TPMIN) {
        TPMIN = true;
        if (typeof buildTP === 'function') buildTP();
      }
    } catch (e) {}
    gs.dataset.top = '1';
    /* first tab: the remembered one (OPERATE / LIBRARY need the plant and library scripts, which load after this one) */
    /* 3.2.0-beta.8: the app opens on HOME (Continue there goes back to the remembered page); an automated browser (the tests)
       keeps the remembered page, window.LS_HOME = true / false overrides */
    const home0 = window.LS_HOME != null ? !!window.LS_HOME : !navigator.webdriver;
    const t0 = home0 ? 'home' : ls.get('ls-tab') || 'logic';
    setTab('logic', true);
    if (t0 !== 'logic') {
      let k = 0;
      const iv2 = setInterval(() => {
        if ((t0 === 'tools' || ((t0 === 'home' || t0 === 'training') && window.lsHome) || (t0 === 'operate' && window.lsPlant) || (t0 === 'library' && window.lsLibrary)) || ++k > 40) {
          clearInterval(iv2);
          setTab(t0, true);
        }
      }, 250);
    }
    return true;
  }
  /* Start ▾: the starting state of the plant (150 MW, Cold), the TCS panel (black box, outside the
     drawings) and the drum blowdown field valve. The handlers are the same as before (they call the engine's AN.* functions). */
  function buildStart(d) {
    const btn = (id, label, title, fn) => {
      const b = E('button', { id, txt: label, title, cls: 'an-only' });
      b.onclick = fn;
      d.m.append(b);
      return b;
    };
    d.head('Starting state of the plant');
    /* 3.2.0 retest #54: the starting states load in slices with a progress bar (AN.loadStart); AN._startP = the load, for the
       callers that go on after it (Practise, the PLANT chip) */
    btn('load150', 'At 150 MW (HMI snapshot)', 'Reset, then every transmitter that is on the control-room HMI snapshots takes its snapshot value (docs/hmi)', () => {
      /* roadmap 3 (SPEC S5 / S6): a starting state is for the plant model ON only: picking one turns the model ON */
      AN._startP = AN.loadStart('150', true).then(
        n => {
          AN.settle();
          AN.paint();
          msg('Plant at 150 MW: ' + n + ' transmitters set from the HMI snapshots. Press Run.');
          if (window.DITL150)
            (AN.ades ? AN.ades() : Promise.resolve())
              .then(() => {
                const r = DITL150.apply();
                if (r) msg('Plant at 150 MW: ' + n + ' ABC transmitters from the HMI snapshots, DITL in service (MFT reset). Press Run.');
              })
              .catch(() => {});
        },
        e => msg('Could not load the 150 MW state: ' + e.message)
      );
    });
    btn('loadcold', 'Cold (start-up from zero)', 'Reset, the 150 MW anchors, then the plant cold: drum 0 kg/cm2, water and bed 30 C, feeders and fans stopped, oil valves closed, every controller LOCAL + MANUAL 0 %. Training has the procedure.', () => {
      AN._startP = AN.loadStart('cold', true).then(
        n => {
          AN.paint();
          msg('Plant cold: drum 0 kg/cm2, water 30 C, no fire. Press Run, then start the utilities (seawater pump M.3354 and condensate pump M.3350 on ABC-052, FA blower M.3308, diesel oil pump in Field equipment), the fans (Buttons M.3302 / 3303 / 3304), purge, open the oil valves (M.3410 / 3411 = 0) and fire the burners (FICDO1043A / B). ' + n + ' anchors.');
        },
        e => msg('Could not load the cold state: ' + e.message)
      );
    });
    d.head('TCS panel (turbine)');
    const tcs = (id, label, title, cmd, arg, ok) =>
      btn(id, label, title, () => {
        try {
          const r = AN.turbine(cmd, arg);
          msg(r ? 'TCS: ' + r : ok);
        } catch (e) {
          msg('TCS: ' + e.message);
        }
      });
    tcs('tcsroll', 'Turbine ROLL', 'TCS panel: open the stop valves, IP start mode, 120 rpm/min to 3600 rpm (PR-OPE-5002 4.4). Needs Start cold and the plant running.', 'roll', null, 'TCS: turbine rolling, 120 rpm/min to 3600 (OPERATE > UNIT shows the speed).');
    tcs('tcssync', 'SYNC + initial load 4.5 MW', 'TCS panel at 3600 rpm: GCB 52G1 closed (ABC-050 I.0931 = 1, I.0932 = 0), initial load 4.5 MW on the ICV (PR-OPE-5002 4.5).', 'sync', null, 'TCS: generator synchronised, initial load 4.5 MW.');
    tcs('tcsload', 'LOAD UP to 45 MW', 'TCS panel: target 45 MW at 5 %/min (7.5 MW/min). ICV -> CV transfer at 20 MW (I.0418 = 1), DCS control mode permissive I.0081 at 45 MW (PR-OPE-5002 4.6).', 'loadup', 45, 'TCS: load up to 45 MW at 7.5 MW/min.');
    btn('tcstarget', 'TARGET MW…', 'TCS panel: a target MW of your own (reached at 7.5 MW/min) while the DCS control mode is OFF. Once I.0082 = 1 (boiler master and PIC-COBM in AUTO above 230 T/H) the TCS follows the turbine master EIC-TM of the DCS instead.', () => {
      const x = prompt('TCS target MW (4.5 ~ 150):', '50');
      if (x == null) return;
      try {
        const r = AN.turbine('loadup', Math.max(4.5, Math.min(150, +x)));
        msg(r ? 'TCS: ' + r : 'TCS: target ' + x + ' MW at 7.5 MW/min (the DCS target takes over when I.0082 = 1).');
      } catch (e) {
        msg('TCS: ' + e.message);
      }
    });
    d.head('Field equipment (no DCS signal)');
    for (const [id, txt, on, ok] of [
      ['dopstart', 'Diesel oil pump START', true, 'Diesel oil pump tumatakbo: may oil pressure na sa header (ABC-028).'],
      ['dopstop', 'Diesel oil pump STOP', false, 'Diesel oil pump nakahinto: walang oil pressure, walang oil sa burners.']
    ])
      btn(id, txt, 'Diesel oil pump P-0005 (DITL-31, field start; no running signal on the ABC sheets). Without it the start-up burner oil header (ABC-028 PICDO0005) has no pressure.', () =>
        msg(AN.field && AN.field('dop', on) ? ok : 'Diesel oil pump: walang plant model.')
      );
    d.head('Field valves');
    for (const [id, txt, open, ok] of [
      ['bdclose', 'Drum BLOWDOWN valve CLOSE', false, 'Blowdown sarado: walang tubig na lumalabas sa drum maliban sa steam.'],
      ['bdopen', 'Drum BLOWDOWN valve OPEN', true, 'Blowdown bukas: 25 T/H (03.png, 150 MW).']
    ])
      btn(id, txt, 'Field hand valve of the drum blowdown (not a DCS station). PR-OPE-5003: "Before stopping BFP, set the drum level near HH (blow down valve must be close)".', () =>
        msg(AN.blowdown && AN.blowdown(open) ? ok : 'Blowdown: walang drum level loop.')
      );
  }
  /* 3.2.0-beta.20 (user 2026-10-24 "dpt common tools yn s simulate", pick B of https://claude.ai/artifact/ShJf2VmTtFDsMGFCMD5zeT):
     the PLANT chip beside VIEW | RUN, on every page (ABC, DITL, Plant view). It tells the plant model and the starting state at a
     glance and opens a small panel: Plant model OFF / Unit, the starting state of the unit (Cold, 150 MW) and the target MW of the unit. The handlers are
     the ones of the old Start ▾ menu (its buttons stay in the page, hidden, so nothing that clicks them changes) and the engine's
     own AN.plantSwitch / AN.turbine. VIEW: the panel shows the state, the choices wait for RUN. */
  function buildPlantChip(start) {
    const MOVED = ['load150', 'loadcold'];
    for (const id of MOVED) {
      const b = start.m.querySelector('#' + id);
      if (b) b.classList.add('lsmoved');
    }
    for (const h of start.m.querySelectorAll('.mh'))
      if (/^Starting state/.test(h.textContent)) h.classList.add('lsmoved');
    const NAMES = { plantCold: 'Cold', plantLoad150: '150 MW' };
    const model = () => (!(window.AN && AN.plantOn) ? 'off' : 'unit');
    let pick = null;
    const txt = () => {
      const m = model();
      if (m === 'off') return 'OFF';
      return 'Unit · ' + (NAMES[AN.startState] || 'not started');
    };
    const chip = E('button', { id: 'plchip', cls: 'plchip', title: 'Plant model and starting state: OFF, Unit (Cold to 150 MW)' }, [
      E('i', { 'aria-hidden': 'true' }),
      E('span', {}, [E('small', { txt: 'PLANT' }), E('em', {})]),
      E('b', { txt: '▾', 'aria-hidden': 'true' })
    ]);
    const pop = E('div', { id: 'plpop', cls: 'plpop', role: 'dialog', 'aria-label': 'Plant model' });
    pop.hidden = true;
    document.body.append(pop);
    const loaded = () => !!(window.AN && AN.sheets && AN.sheets.length >= 54 && AN.plantCold);
    /* the choices need the ABC engine: from the DITL page it is loaded first, then the page comes back */
    const withAN = fn => {
      /* the operator chose: no automatic Cold of a first ABC page on top of it (trace.js coldShow) */
      if (window.AN) AN._cold0 = 1;
      if (loaded() && AN.cat === 'an') return fn();
      const back = window.AN && AN.cat;
      try {
        AN.setCat('an');
      } catch (e) {}
      let k = 0;
      const iv = setInterval(() => {
        if (loaded() || ++k > 120) {
          clearInterval(iv);
          if (loaded()) fn();
          if (back && back !== 'an')
            try {
              AN.setCat(back);
            } catch (e) {}
          upd();
        }
      }, 250);
    };
    const say = t => {
      try {
        if (typeof msg === 'function') msg(t);
        else if (window.AN && AN.msg) AN.msg(t);
      } catch (e) {}
    };
    /* VIEW of the page (top bar VIEW | RUN): the ABC page's VIEW, or the DITL page while it does not simulate */
    const locked = () => {
      if (document.body.classList.contains('an')) return !!(window.AN && AN.view && !AN.run);
      try {
        return !SIM;
      } catch (e) {
        return false;
      }
    };
    const guard = fn => () => {
      if (locked()) {
        say('VIEW: look and trace only. Press RUN (top right) to pick the plant model or the starting state.');
        return;
      }
      fn();
      upd();
      if (!pop.hidden) render();
    };
    const seg = (items, on) => E('div', { cls: 'plseg' }, items.map(([k, label, fn]) => E('button', { cls: k === on ? 'on' : '', txt: label, on: guard(fn) })));
    const mwBox = (id, val) => E('input', { id, type: 'number', min: '45', max: '150', step: '0.5', value: String(val), inputmode: 'decimal', 'aria-label': 'MW' });
    const plantOn = on => {
      if (!!AN.plantOn !== on) AN.plantSwitch(on, true);
    };
    function render() {
      const m = pick || model();
      pop.textContent = '';
      pop.append(
        E('h5', { txt: 'Plant model' }),
        seg(
          [
            ['off', 'OFF', () => withAN(() => (pick = null, plantOn(false), say('Plant model OFF: the transmitters are free inputs, only the drawn logic runs (simulate and force).')))],
            ['unit', 'Unit', () => (pick = 'unit')]
          ],
          m
        ),
        E('small', {
          txt:
            m === 'off'
              ? 'OFF: simulate and force only. No plant answers the valves.'
              : 'Unit: the whole boiler and turbine, from Cold to 150 MW (mass and energy balance, steam table).'
        })
      );
      if (m === 'unit') {
        const st = AN.startState && NAMES[AN.startState] ? AN.startState : null,
          click = id => () =>
            withAN(() => {
              plantOn(true);
              pick = null;
              const b = $(id);
              if (b) b.click();
              upd();
              (AN._startP || Promise.resolve()).then(() => {
                upd();
                if (!pop.hidden) render();
              }, upd);
            });
        const t = mwBox('pltgt', Math.round(+(AN.unit && AN.unit.MW) || 0) >= 45 ? Math.round(+AN.unit.MW) : 150);
        t.min = '4.5';
        pop.append(
          E('h5', { txt: 'Start' }),
          seg(
            [
              ['plantCold', 'Cold', click('loadcold')],
              ['plantLoad150', '150 MW', click('load150')]
            ],
            st
          ),
          E('h5', { txt: 'Target load' }),
          E('div', { cls: 'plrow' }, [
            t,
            E('span', { txt: 'MW' }),
            E('button', {
              cls: 'plgo',
              txt: 'Set',
              on: guard(() =>
                withAN(() => {
                  const mw = Math.max(4.5, Math.min(150, +t.value || 150));
                  try {
                    const r = AN.turbine('loadup', mw);
                    say(r ? 'TCS: ' + r : 'Target ' + mw + ' MW at 7.5 MW/min (TCS). In CCS (DCS control mode ON) the load is set on HIC-ULD (ABC-001A).');
                  } catch (e) {
                    say('TCS: ' + e.message);
                  }
                })
              )
            })
          ]),
          E('small', { txt: 'Target load = the TCS target while the DCS control mode is OFF. In CCS, change HIC-ULD (ABC-001A faceplate).' })
        );
      }
      if (locked()) pop.append(E('p', { cls: 'plnote', txt: 'VIEW: press RUN to change these.' }));
    }
    function place() {
      const r = chip.getBoundingClientRect(),
        vw = document.documentElement.clientWidth,
        w = pop.offsetWidth || 340;
      pop.style.top = r.bottom + 6 + 'px';
      pop.style.left = Math.max(8, Math.min(r.right - w, vw - w - 8)) + 'px';
    }
    chip.onclick = e => {
      e.stopPropagation();
      pop.hidden = !pop.hidden;
      if (!pop.hidden) {
        pick = null;
        render();
        place();
      }
    };
    document.addEventListener(
      'click',
      e => {
        if (e.isTrusted && !pop.hidden && !pop.contains(e.target) && !chip.contains(e.target)) pop.hidden = true;
      },
      true
    );
    addEventListener('keydown', e => {
      if (e.key === 'Escape') pop.hidden = true;
    });
    addEventListener('resize', () => !pop.hidden && place());
    let last = '';
    function upd() {
      const m = model(),
        k = txt() + '|' + m + '|' + locked();
      if (k !== last) {
        last = k;
        chip.querySelector('em').textContent = txt();
        chip.setAttribute('aria-label', 'Plant model: ' + txt());
        chip.dataset.m = m;
        if (!pop.hidden) render();
      }
    }
    /* beside VIEW | RUN, wherever the bar puts them (the unit band moves the segment) */
    setInterval(() => {
      const sg = [...document.querySelectorAll('.seg')].find(x => /VIEW/.test(x.textContent) && /RUN/.test(x.textContent));
      if (sg && chip.nextSibling !== sg) sg.before(chip);
      upd();
    }, 400);
  }
  let tries = 0;
  const iv = setInterval(() => {
    try {
      if (build() || ++tries > 120) clearInterval(iv);
    } catch (e) {
      console.error('app shell', e);
      clearInterval(iv);
    }
  }, 250);
})();
