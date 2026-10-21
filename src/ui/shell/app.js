/* ===== APP SHELL 2 (2.4.0): one top bar with four tabs (OPERATE / LOGIC / LIBRARY / TOOLS), one status bar.
   The old toolbars (#anbar of the ABC page, #bar of the DITL page) stay in the page but hidden: their buttons are the same
   elements with the same handlers, only moved into the new bar, the Start menu, the ⚙ menu or the TOOLS page.
   Nothing here touches the simulation engine. ===== */
(function () {
  const $ = id => document.getElementById(id);
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
    };
    document.addEventListener('click', e => {
      if (!w.contains(e.target)) w.classList.remove('open');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') w.classList.remove('open');
    });
    m.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') setTimeout(() => w.classList.remove('open'), 50);
    });
    return {
      w,
      m,
      head: t => m.append(E('div', { cls: 'mh', txt: t }))
    };
  }
  const TABS = [
    ['operate', 'Plant view', 'Plant graphics with the faceplates (A / M / R, SV, MV) like the operator station; on a PC it opens in its own window'],
    ['logic', 'Logic', 'The ABC (analog) and DITL (digital) drawings: trace, run, force'],
    ['library', 'Library', 'I/O list, memory list, wiring, relay / SER, calculations'],
    ['tools', 'Tools', 'Block tests, audit, health, project files, drawing edit']
  ];
  let tab = null,
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
    /* the PLANT VIEW is in its own window: bring that window to the front */
    if (t === 'operate' && pvW && !pvW.closed) {
      pvW.focus();
      return;
    }
    tab = t;
    document.body.dataset.tab = t;
    if (!keep) ls.set('ls-tab', t);
    for (const k in tabBtns) tabBtns[k].classList.toggle('on', k === t);
    const plant = window.lsPlant,
      lib = window.lsLibrary;
    try {
      if (t === 'operate') {
        /* the plant graphics run on the ABC engine: the ABC category must be the active one (its Run button is in the bar) */
        if (window.AN && AN.cat !== 'an' && AN.setCat) AN.setCat('an');
        lib && lib(false);
        plant && plant(true);
      } else if (t === 'library') {
        plant && plant(false);
        lib && lib(true);
      } else {
        plant && plant(false);
        lib && lib(false);
      }
    } catch (e) {}
    document.querySelectorAll('.ddw.open').forEach(x => x.classList.remove('open'));
    place();
    hint();
  }
  const HINTS = {
    operate: 'PLANT VIEW: pick a system on the left · click a controller or valve = faceplate (A / M / R, SV, MV) · Start ▾ = starting state · CHECK = scenarios',
    library: 'LIBRARY: search an address, tag or description · Find = open the info card',
    tools: 'TOOLS: block tests, audit, health, review marks, project files, drawing edit'
  };
  window.lsSetTab = setTab;
  function hint() {
    const h = foot && foot.querySelector('.shint');
    if (h) h.textContent = HINTS[tab] || '';
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
      }
    });
    bar.prepend(sb);
    list.addEventListener('click', () => ws.classList.remove('lsopen'));
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
        const sync = () => {
          const on = !t.hidden && !!t.textContent.trim();
          if (on) sm.textContent = t.textContent;
          document.body.classList.toggle('hasmsg', on);
        };
        new MutationObserver(sync).observe(t, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });
        sync();
      }
    }
    /* --- top bar --- */
    const ansb = $('ansb'),
      gscope = $('gscope'),
      uisel = $('uisel');
    [...gs.children].forEach(c => {
      if (c !== ansb && c !== gscope && c !== uisel && c.id !== 'updbtn' && c.id !== 'chsel' && c.id !== 'dgsel' && c.id !== 'dgtsel') c.remove();
    });
    const tabs = E('div', { cls: 'tabs' });
    TABS.forEach(([k, l, t]) => {
      const b = E('button', { txt: l, title: t, on: () => (k === 'operate' && pvPop && pvPop()) || setTab(k) });
      tabBtns[k] = b;
      tabs.append(b);
    });
    const sub = E('div', { cls: 'sub' });
    [
      ['an', 'ABC', 'Analog logic (boiler control): 54 sheets'],
      ['dig', 'DITL', 'Digital interlock logic: 134 sheets']
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
    const gDitl = E('div', { cls: 'tb g-ditl', 'data-label': 'SIM' }, [mode]);
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
    const startBtn = E('button', { txt: 'Start ▾', title: 'Starting state of the plant: 150 MW, cold, warm, hot; TCS panel; field valves' });
    const start = dropdown(startBtn, 'left');
    buildStart(start);
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
      const th = E('select', { id: 'thsel', title: 'Light or dark app (the drawing has its own setting below)' });
      [
        ['light', 'Theme: Light'],
        ['dark', 'Theme: Dark']
      ].forEach(([v, t]) => th.append(E('option', { value: v, txt: t })));
      const t0 = ls.get('ls-theme3') === 'dark' ? 'dark' : 'light';
      th.value = t0;
      document.documentElement.dataset.theme = t0;
      th.onchange = () => {
        document.documentElement.dataset.theme = th.value;
        ls.set('ls-theme3', th.value);
      };
      set.m.append(th);
    }
    if ($('dgsel')) set.m.append($('dgsel'));
    if ($('dgtsel')) set.m.append($('dgtsel'));
    {
      const hold = E('div', { hidden: '' }, [uisel, live && AN_(live), theme && AN_(theme), slive && DI_(slive)]);
      document.body.append(hold);
    }
    set.head('Channel and update');
    if ($('chsel')) set.m.append($('chsel'));
    if ($('updbtn')) {
      $('updbtn').textContent = 'Check for update';
      set.m.append($('updbtn'));
    }
    const brand = E('div', {
      cls: 'brand',
      title: 'DCS Logic Simulator',
      html: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="5" width="16" height="7" rx="3.5"/><path d="M8 12v6M16 12v6"/></svg>'
    });
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
    const TIC = { 'Plant view': 'plant', Logic: 'logic', Library: 'book', Tools: 'tool' };
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
          } else if (ditlSim()) mode.click();
        }
      }),
      segR = E('button', {
        txt: 'RUN',
        title: 'RUN: the logic runs; switch and force the inputs',
        on: () => {
          if (isAn()) {
            if (AN.view || !AN.run) run.click();
          } else if (!ditlSim()) mode.click();
        }
      }),
      seg = E('div', { cls: 'seg' }, [segV, segR]);
    srch.after(seg);
    /* VIEW ribbon: Navigate / View / Layers / Reference (the group name is under the buttons) */
    const ioBtn = E('button', { txt: 'I/O list', title: 'LIBRARY: I/O list and memory lists', on: () => setTab('library') }),
      fxBtn = E('button', { txt: 'F(X)', title: 'F(X) tables (linear curves)', on: () => ln && ln.click() }),
      gRef = E('div', { cls: 'tb g-ref', 'data-label': 'REFERENCE' }, [ioBtn, AN_(fxBtn)]);
    gNav.dataset.label = 'NAVIGATE';
    gView.after(gRef);
    {
      const lg = () => crumb.querySelector('#anmeta .lg > button');
      /* Legend & style sits with the layers (its button is rebuilt with each sheet: the ribbon button presses it) */
      const lgBtn = E('button', {
        txt: 'Legend',
        title: 'Colour code of the symbols, valves and wires; wire style',
        on: () => {
          if (lg()) lg().click();
          const p = $('anlg'),
            r = lgBtn.getBoundingClientRect();
          if (p && r.width) {
            p.style.top = r.bottom + 6 + 'px';
            p.style.right = 'auto';
            p.style.left = Math.max(8, Math.min(innerWidth - p.offsetWidth - 8, r.left)) + 'px';
          }
        }
      });
      gView.append(AN_(lgBtn));
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
      const secs = {};
      for (const k in rows) {
        const r = rows[k];
        if (!/inputs/i.test(r._sec || '')) continue;
        (secs[r._sec] = secs[r._sec] || []).push(r);
      }
      let n = 0;
      for (const s of Object.keys(secs).sort((a, b) => /digital/i.test(b) - /digital/i.test(a))) {
        inl.append(E('div', { cls: 'inh', txt: s.replace(/ inputs/i, '').toUpperCase() + ' · ' + secs[s].length }));
        for (const r of secs[s]) {
          n++;
          const tg = r.querySelector('.tg'),
            ds = r.querySelector('.ds'),
            ctl = r.querySelector('.l1 button'),
            num = r.querySelector('.l1 input[type=number]'),
            nm = E('div', { cls: 'inn' }, [E('b', { txt: tg ? tg.textContent : '' }), ds ? E('small', { txt: ds.textContent }) : null]);
          nm.onclick = () => tg && tg.click();
          const it = E('div', { cls: 'ini' }, [nm]);
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
            const v = E('span', { cls: 'inv' });
            it.append(v);
            it._u = () => (v.textContent = num.value);
          }
          inl.append(it);
        }
      }
      if (!n) inl.append(E('div', { cls: 'inh', txt: 'No inputs on this sheet' }));
      stI.textContent = 'Inputs ' + n;
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
        sim = an_ ? !(window.AN && AN.view) : ditlSim();
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
      const fmt = x => (x == null || !isFinite(x) ? '—' : Math.abs(x) >= 100 ? x.toFixed(1) : x.toFixed(2));
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
          const name = b ? b.tag || (b.txt || []).filter(Boolean)[1] || b.k + ' #' + b.id : nmf(s.net),
            kind = b ? b.k : 'WIRE',
            fp = b && b.tag && /^(PID|PIDV|MAN)/.test(b.k);
          card.append(
            E('div', { cls: 'sch' }, [E('small', { txt: b ? 'SELECTED BLOCK' : 'SELECTED WIRE' }), E('span', { cls: 'chip', txt: kind })]),
            E('b', { cls: 'scn', txt: name }),
            b && b.txt ? E('div', { cls: 'scd', txt: b.txt.filter(Boolean).join(' · ') }) : null
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
        card.querySelectorAll('.scv b').forEach(e => (e.textContent = val(e._n)));
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
    /* --- TOOLS page --- */
    toolsws = E('div', { id: 'toolsws' });
    const grid = E('div', { cls: 'tgrid' });
    toolsws.append(grid);
    const card = (title, text, els) => {
      const c = E('div', { cls: 'tcard' }, [E('h3', { txt: title }), text ? E('p', { txt: text }) : null, E('div', { cls: 'row' }, els.filter(Boolean))]);
      grid.append(c);
      return c;
    };
    const cTest = card('Block tests and controller test', 'Every block of a sheet is forced with known inputs and compared with its definition (UAT); the controller test runs the generic tester.', []);
    const cAudit = card('Check the drawing', 'Audit, Health, Review marks, F(X) tables, assumed values, the DITL signals of a sheet and a second sheet side by side.', [
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
    const cSim = card('Simulation', 'Plant model ON = the PV answers the valve (each PID loop and the boiler / turbine model); OFF = the PV is a free input, only the drawing logic runs. ABC+DITL ON = the 134 DITL sheets run with the ABC Run and pass signals both ways (one world).', [AN_(pmBtn)]);
    /* 2.4.0-beta.5: the old Plant window is replaced by the PLANT VIEW (its own window on a PC) */
    if (plantwin) plantwin.remove();
    if (prj) prj.classList.add('lp');
    const cPrj = card('Project files', 'Save or open the forced values, user values and the sheets you changed.', [AN_(save), AN_(saveas), AN_(openp), AN_(prj), AN_(importAbc), DI_(lab('fdxf')), DI_(lab('fjson')), DI_($('bsave'))]);
    const cEdit = card('DITL drawing edit', 'Only on the DITL page: cells of the drawing, loose wires, a whole sheet; the sheet title alignment and size (the title is typed in the top bar).', [DI_($('bundo')), DI_($('bredo')), DI_($('bclr')), DI_($('bdel')), DI_($('bwire')), DI_($('mctl'))]);
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
      if (c && c.parentNode !== gOp) gOp.append(c);
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
    function cardsUpd() {
      if (tab !== 'tools') return;
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
    const t0 = ls.get('ls-tab') || 'logic';
    setTab('logic', true);
    if (t0 !== 'logic') {
      let k = 0;
      const iv2 = setInterval(() => {
        if ((t0 === 'tools' || (t0 === 'operate' && window.lsPlant) || (t0 === 'library' && window.lsLibrary)) || ++k > 40) {
          clearInterval(iv2);
          setTab(t0, true);
        }
      }, 250);
    }
    return true;
  }
  /* Start ▾: the starting state of the plant (2.0.0 150 MW, 2.2.0 M4 cold / warm / hot), the TCS panel (black box, outside the
     drawings) and the drum blowdown field valve. The handlers are the same as before (they call the engine's AN.* functions). */
  function buildStart(d) {
    const btn = (id, label, title, fn) => {
      const b = E('button', { id, txt: label, title, cls: 'an-only' });
      b.onclick = fn;
      d.m.append(b);
      return b;
    };
    d.head('Starting state of the plant');
    btn('load150', 'At 150 MW (HMI snapshot)', 'Reset, then every transmitter that is on the control-room HMI snapshots takes its snapshot value (docs/hmi)', () => {
      try {
        AN.reset();
        const n = AN.plantLoad150();
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
      } catch (e) {
        msg('Could not load the 150 MW state: ' + e.message);
      }
    });
    btn('loadcold', 'Cold (start-up from zero)', 'Reset, the 150 MW anchors, then the plant cold: drum 0 kg/cm2, water and bed 30 C, feeders and fans stopped, oil valves closed, every controller LOCAL + MANUAL 0 %. The CHECK panel has the procedure.', () => {
      try {
        AN.reset();
        const n = AN.plantCold();
        AN.paint();
        msg('Plant cold: drum 0 kg/cm2, water 30 C, no fire. Press Run, then start the fans (Buttons M.3302 / 3303 / 3304), purge, open the oil valves (M.3410 / 3411 = 0) and fire the burners (FICDO1043A / B). ' + n + ' anchors.');
      } catch (e) {
        msg('Could not load the cold state: ' + e.message);
      }
    });
    btn('loadwarm', 'Warm (30 kg/cm2, burners lit)', 'Start cold, then the plant as at the end of the cold start: drum 30 kg/cm2, bed 480 C, fans running, 4 start-up burners at 30 %. For the coal transfer and the next steps of PR-OPE-5002.', () => {
      try {
        AN.reset();
        const n = AN.plantWarm();
        AN.paint();
        msg('Plant warm: drum 30 kg/cm2, bed 480 C, 4 start-up burners lit. Press Run; coal transfer: CHECK panel has the steps. ' + n + ' anchors.');
      } catch (e) {
        msg('Could not load the warm state: ' + e.message);
      }
    });
    btn('loadhot', 'Hot (123 kg/cm2 on bypass, coal)', 'Start cold, then the plant as at the end of M4 step 3: drum 123 kg/cm2 on the HP bypass (AUTO), LP bypass AUTO 7.6, bed 750 C, three coal feeders at 12 %, burners out. Ready for the turbine roll.', () => {
      try {
        AN.reset();
        const n = AN.plantHot();
        AN.paint();
        msg('Plant hot: 123 kg/cm2 on the HP bypass, bed 750 C, 3 feeders. Press Run, then Turbine ROLL (30 min to 3600 rpm), SYNC, LOAD UP. ' + n + ' anchors.');
      } catch (e) {
        msg('Could not load the hot state: ' + e.message);
      }
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
    tcs('tcsroll', 'Turbine ROLL', 'TCS panel: open the stop valves, IP start mode, 120 rpm/min to 3600 rpm (PR-OPE-5002 4.4). Needs Start cold / warm / hot and the plant running.', 'roll', null, 'TCS: turbine rolling, 120 rpm/min to 3600 (OPERATE > UNIT shows the speed).');
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
    d.head('Field valves');
    for (const [id, txt, open, ok] of [
      ['bdclose', 'Drum BLOWDOWN valve CLOSE', false, 'Blowdown sarado: walang tubig na lumalabas sa drum maliban sa steam.'],
      ['bdopen', 'Drum BLOWDOWN valve OPEN', true, 'Blowdown bukas: 25 T/H (03.png, 150 MW).']
    ])
      btn(id, txt, 'Field hand valve of the drum blowdown (not a DCS station). PR-OPE-5003: "Before stopping BFP, set the drum level near HH (blow down valve must be close)".', () =>
        msg(AN.blowdown && AN.blowdown(open) ? ok : 'Blowdown: walang drum level loop.')
      );
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
