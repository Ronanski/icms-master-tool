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
    ['operate', 'OPERATE', 'Plant graphics, faceplates, start-up and shutdown scenarios'],
    ['logic', 'LOGIC', 'The ABC (analog) and DITL (digital) drawings: trace, run, force'],
    ['library', 'LIBRARY', 'I/O list, memory list, wiring, relay / SER, calculations'],
    ['tools', 'TOOLS', 'Block tests, audit, health, project files, drawing edit']
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
  function setTab(t, keep) {
    if (!TABS.some(x => x[0] === t)) t = 'logic';
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
    operate: 'OPERATE: pick a system on the left · click a tag = faceplate (R / A / M, SV, MV) · Start ▾ = starting state · CHECK = scenarios',
    library: 'LIBRARY: search an address, tag or description · Find = open the info card',
    tools: 'TOOLS: block tests, audit, health, review marks, project files, drawing edit'
  };
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
    if (wire) wire.textContent = 'Wire';
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
      if (c !== ansb && c !== gscope && c !== uisel && c.id !== 'updbtn' && c.id !== 'chsel' && c.id !== 'dgsel') c.remove();
    });
    const tabs = E('div', { cls: 'tabs' });
    TABS.forEach(([k, l, t]) => {
      const b = E('button', { txt: l, title: t, on: () => setTab(k) });
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
    const gRun = E('div', { cls: 'tb g-run' }, [run, back, next, stepSel, speedSel, reset, view]);
    const gDitl = E('div', { cls: 'tb g-ditl' }, [mode, dfit]);
    const gView = E('div', { cls: 'tb g-view' }, [fit, values, wire, panel, xback]);
    const gSheet = E('div', { cls: 'tb g-sheet' }, [sheetsBtn, AN_(shbox), DI_(dshbox)]);
    /* OPERATE: Start ▾ (starting state of the plant, TCS, field valves) and the CHECK scenarios */
    const startBtn = E('button', { txt: 'Start ▾', title: 'Starting state of the plant: 150 MW, cold, warm, hot; TCS panel; field valves' });
    const start = dropdown(startBtn, 'left');
    buildStart(start);
    const gOp = E('div', { cls: 'tb g-op' }, [start.w]);
    const tbar = E('div', { cls: 'tbar' }, [gRun, gDitl, gView, gSheet, gOp]);
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
    const setBtn = E('button', { cls: 'ico', html: GEAR, title: 'Settings: font, colours, channel, update' });
    const set = dropdown(setBtn, 'gs-set');
    set.head('Appearance');
    {
      const fs_ = E('select', { id: 'fontsel', title: 'App font (the drawing keeps its own)' });
      [
        ['plexc', 'Font: IBM Plex Sans Condensed'],
        ['barlow', 'Font: Barlow Semi Condensed'],
        ['inter', 'Font: Inter + JetBrains Mono'],
        ['plex', 'Font: IBM Plex Sans + Mono'],
        ['roboto', 'Font: Roboto + Roboto Mono'],
        ['device', 'Font: Device default']
      ].forEach(([v, t]) => fs_.append(E('option', { value: v, txt: t })));
      const f0 = ls.get('ls-font') || 'plexc';
      fs_.value = f0;
      document.documentElement.dataset.font = f0;
      fs_.onchange = () => {
        document.documentElement.dataset.font = fs_.value;
        ls.set('ls-font', fs_.value);
      };
      set.m.append(fs_);
    }
    if (uisel) set.m.append(uisel);
    if ($('dgsel')) set.m.append($('dgsel'));
    if (live) set.m.append(AN_(live));
    if (theme) set.m.append(AN_(theme));
    if (slive) set.m.append(DI_(slive));
    set.head('Channel and update');
    if ($('chsel')) set.m.append($('chsel'));
    if ($('updbtn')) {
      $('updbtn').textContent = 'Check for update';
      set.m.append($('updbtn'));
    }
    gs.append(tabs, sub, tbar, srchBtn, srch, set.w);
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
    const cSim = card('Simulation', 'Plant model ON = the PV answers the valve (each PID loop and the boiler / turbine model); OFF = the PV is a free input, only the drawing logic runs. ABC+DITL ON = the 134 DITL sheets run with the ABC Run and pass signals both ways (one world).', [AN_(pmBtn), AN_(plantwin)]);
    if (prj) prj.classList.add('lp');
    const cPrj = card('Project files', 'Save or open the forced values, user values and the sheets you changed.', [AN_(save), AN_(saveas), AN_(openp), AN_(prj), AN_(importAbc), DI_(lab('fdxf')), DI_(lab('fjson')), DI_($('bsave'))]);
    const cEdit = card('DITL drawing edit', 'Only on the DITL page: cells of the drawing, loose wires, a whole sheet.', [DI_($('bundo')), DI_($('bredo')), DI_($('bclr')), DI_($('bdel')), DI_($('bwire'))]);
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
      if (dg && dg.parentNode !== set.m) uisel ? uisel.after(dg) : set.m.append(dg);
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
