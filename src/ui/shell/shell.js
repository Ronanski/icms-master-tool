/* Shell only: groups the existing toolbar buttons (the same elements, so every handler keeps working) and adds the More menu and the Sheets drawer button. */
(function () {
  const $ = id => document.getElementById(id);
  function build() {
    const bar = $('anbar');
    if (!bar || bar.dataset.shell) return !!(bar && bar.dataset.shell);
    const kids = [...bar.children];
    if (kids.length < 12) return false;
    const t = e => e.textContent.trim();
    const btn = re => kids.find(k => k.tagName === 'BUTTON' && re.test(t(k)));
    const sel = re => kids.find(k => k.tagName === 'SELECT' && re.test(t(k)));
    const cat = bar.querySelector('.cat');
    const view = btn(/^View$/),
      run = btn(/Run|Pause/),
      back = btn(/^◀\s*Back/),
      next = btn(/^Next/),
      reset = btn(/^Reset$/);
    const stepSel = sel(/^1 s/),
      speedSel = sel(/^1x/);
    const fit = btn(/^Fit$/),
      values = btn(/^Values$/),
      wire = btn(/^Wire values$/),
      panel = btn(/^Panel$/);
    const review = btn(/^Review marks/),
      live = sel(/^Live/),
      theme = sel(/^Theme/),
      xback = btn(/^↩\s*Back/),
      health = btn(/^Health/),
      audit = btn(/^Audit/),
      ln = btn(/^LN tables/),
      assumed = btn(/^Assumed/),
      ditl = btn(/^DITL signals/),
      second = btn(/^2nd sheet/),
      plant = btn(/^Plant window$/);
    const shbox = $('anshbox'),
      time = kids.find(k => k.tagName === 'SPAN' && /^t\s*=/.test(t(k)));
    if (!view || !run || !fit || !panel || !shbox) return false;
    if (run) run.classList.add('tb-run');
    const mk = (cls, label, els) => {
      const g = document.createElement('div');
      g.className = 'tbg ' + cls;
      g.dataset.l = label;
      els.filter(Boolean).forEach(e => g.append(e));
      return g;
    };
    const sheets = document.createElement('button');
    sheets.id = 'tbsheets';
    sheets.textContent = '☰ Sheets';
    sheets.title = 'Sheet list';
    sheets.onclick = e => {
      e.stopPropagation();
      const s = $('side');
      if (s) s.classList.toggle('uiopen');
    };
    const gSim = mk('tbg-run', 'Run', [run, back, next, stepSel, speedSel, reset, view]);
    const gView = mk('', 'View', [fit, values, wire, panel]);
    const gSheet = mk('', 'Sheet', [sheets, shbox, time]);
    const more = document.createElement('div');
    more.className = 'tb-more';
    const mb = document.createElement('button');
    mb.textContent = '⋯ More';
    mb.title = 'More commands';
    const menu = document.createElement('div');
    menu.className = 'tb-menu';
    const head = x => {
      const h = document.createElement('div');
      h.className = 'tb-mh';
      h.textContent = x;
      menu.append(h);
    };
    head('View');
    [review, live, theme, xback].forEach(e => e && menu.append(e));
    head('Check');
    [health, audit, ln, assumed].forEach(e => e && menu.append(e));
    head('Windows');
    [second, plant, ditl].forEach(e => e && menu.append(e));
    more.append(mb, menu);
    mb.onclick = e => {
      e.stopPropagation();
      more.classList.toggle('open');
    };
    document.addEventListener('click', e => {
      if (!more.contains(e.target)) more.classList.remove('open');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        more.classList.remove('open');
        const s = $('side');
        if (s) s.classList.remove('uiopen');
      }
    });
    menu.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') setTimeout(() => more.classList.remove('open'), 50);
    });
    const rest = [...bar.children].filter(k => k !== cat);
    rest.forEach(k => {
      if (k.parentElement === bar && !k.classList.contains('tbg')) menu.append(k);
    }); /* anything else stays reachable in More */
    /* phone (<= 700 px): isang linya lang ang toolbar; ang ☰ ay naglalabas ng lahat ng iba (search, channel, update, step, speed, reset ...) */
    const mbtn = document.createElement('button');
    mbtn.id = 'mbtn';
    mbtn.textContent = '☰';
    mbtn.title = 'Menu';
    mbtn.onclick = e => {
      e.stopPropagation();
      document.body.classList.toggle('mmenu');
    };
    bar.prepend(mbtn);
    bar.append(gSim, gView, gSheet, more);
    const lst = $('anlist');
    if (lst)
      lst.addEventListener('click', () => {
        const s = $('side');
        if (s && matchMedia('(max-width:1180px)').matches) s.classList.remove('uiopen');
      });
    bar.dataset.shell = '1';
    return true;
  }
  /* DITL toolbar (1.22.0): the same elements regrouped like the ABC toolbar. Mode / Fit / Live / sheet stay in view;
     the drawing-editor tools (Import, project, Undo / Redo, Clear, Delete, Wire fix, Health) go into "⋯ Tools". Handlers are not touched. */
  function buildDitl() {
    const bar = $('bar');
    if (!bar || bar.dataset.shell) return !!(bar && bar.dataset.shell);
    const cat = bar.querySelector('.cat'),
      mode = $('bmode'),
      fit = $('bfit'),
      live = $('slive'),
      shbox = $('shbox');
    if (!cat || !mode || !fit) return false;
    const lab = id => {
      const i = $(id);
      return i && i.closest('label');
    };
    const mk = (cls, label, els) => {
      const g = document.createElement('div');
      g.className = 'tbg ' + cls;
      g.dataset.l = label;
      els.filter(Boolean).forEach(e => g.append(e));
      return g;
    };
    const gSim = mk('tbg-run', 'Run', [mode]);
    const gView = mk('', 'View', [fit, live]);
    const gSheet = mk('tbg-sheet', 'Sheet', [shbox]);
    const more = document.createElement('div');
    more.className = 'tb-more';
    const mb = document.createElement('button');
    mb.textContent = '⋯ Tools';
    mb.title = 'Drawing and project editing tools';
    const menu = document.createElement('div');
    menu.className = 'tb-menu';
    const head = x => {
      const h = document.createElement('div');
      h.className = 'tb-mh';
      h.textContent = x;
      menu.append(h);
    };
    head('Project');
    [lab('fdxf'), lab('fjson'), $('bsave')].forEach(e => e && menu.append(e));
    head('Drawing edit');
    [$('bundo'), $('bredo'), $('bclr'), $('bdel'), $('bwire')].forEach(e => e && menu.append(e));
    head('Check');
    [$('bhp')].forEach(e => e && menu.append(e));
    more.append(mb, menu);
    mb.onclick = e => {
      e.stopPropagation();
      more.classList.toggle('open');
    };
    document.addEventListener('click', e => {
      if (!more.contains(e.target)) more.classList.remove('open');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') more.classList.remove('open');
    });
    menu.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') setTimeout(() => more.classList.remove('open'), 50);
    });
    const mbtn = document.createElement('button');
    mbtn.id = 'mbtn2';
    mbtn.textContent = '☰';
    mbtn.title = 'Menu';
    mbtn.onclick = e => {
      e.stopPropagation();
      document.body.classList.toggle('mmenu');
    };
    const tabs = $('tabs');
    bar.prepend(mbtn);
    cat.after(gSim, gView, gSheet, more);
    if (tabs) bar.append(tabs);
    bar.dataset.shell = '1';
    return true;
  }
  /* ONE TOP BAR for ABC and DITL (1.23.0, mockup v2): the page toolbar (#anbar or #bar, the same elements and handlers),
     the global search and the ⚙ settings menu in one 36 px row; the status chip goes to the status bar at the bottom. Looks only. */
  const GEAR =
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
  let topTry = 0;
  function buildTop() {
    const gs = $('gsbar'),
      bar = $('bar'),
      an = $('anbar');
    if (!gs || !bar || !an || !bar.dataset.shell || !an.dataset.shell) return false;
    if (gs.dataset.top) return true;
    /* wait (max ~12 s) for the update button of the boot script and the channel box */
    if ((!$('updbtn') || !$('stchip')) && ++topTry < 40) return false;
    const mkMenu = (cls, icon, title) => {
      const w = document.createElement('div');
      w.className = 'tb-more ' + cls;
      const b = document.createElement('button');
      b.className = 'ico';
      b.innerHTML = icon;
      b.title = title;
      const m = document.createElement('div');
      m.className = 'tb-menu';
      w.append(b, m);
      b.onclick = e => {
        e.stopPropagation();
        document.querySelectorAll('.tb-more.open').forEach(x => x !== w && x.classList.remove('open'));
        w.classList.toggle('open');
      };
      document.addEventListener('click', e => {
        if (!w.contains(e.target)) w.classList.remove('open');
      });
      m.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') setTimeout(() => w.classList.remove('open'), 50);
      });
      return { w, m, head: t => {
        const h = document.createElement('div');
        h.className = 'tb-mh';
        h.textContent = t;
        m.append(h);
      } };
    };
    /* search */
    const srch = document.createElement('div');
    srch.className = 'gs-search';
    const lab = gs.querySelector(':scope > b');
    if (lab) lab.remove();
    [$('ansb'), $('gscope')].forEach(e => e && srch.append(e));
    /* settings ⚙: looks, live colour, channel and update */
    const set = mkMenu('gs-set', GEAR, 'Settings: appearance, colours, channel, update');
    set.head('Appearance');
    {
      /* font of the app (built in, works offline); the drawing keeps the font of its theme */
      const fs_ = document.createElement('select');
      fs_.id = 'fontsel';
      fs_.title = 'App font (the drawing keeps its own)';
      [
        ['plexc', 'Font: IBM Plex Sans Condensed'],
        ['barlow', 'Font: Barlow Semi Condensed'],
        ['inter', 'Font: Inter + JetBrains Mono'],
        ['plex', 'Font: IBM Plex Sans + Mono'],
        ['roboto', 'Font: Roboto + Roboto Mono'],
        ['device', 'Font: Device default']
      ].forEach(([v, t]) => {
        const o = document.createElement('option');
        o.value = v;
        o.textContent = t;
        fs_.append(o);
      });
      let f0 = 'plexc';
      try {
        f0 = localStorage.getItem('ls-font') || 'plexc';
      } catch (e) {}
      fs_.value = f0;
      document.documentElement.dataset.font = f0;
      fs_.onchange = () => {
        document.documentElement.dataset.font = fs_.value;
        try {
          localStorage.setItem('ls-font', fs_.value);
        } catch (e) {}
      };
      set.m.append(fs_);
      /* look of the app (1.24.0): Console = engineering-tool look (default), Classic = the 1.23.0 look */
      const lk = document.createElement('select');
      lk.id = 'looksel';
      lk.title = 'App look (the drawing is not changed)';
      [
        ['console', 'Look: Console'],
        ['classic', 'Look: Classic']
      ].forEach(([v, t]) => {
        const o = document.createElement('option');
        o.value = v;
        o.textContent = t;
        lk.append(o);
      });
      let l0 = 'console';
      try {
        l0 = localStorage.getItem('ls-look') || 'console';
      } catch (e) {}
      lk.value = l0;
      document.documentElement.dataset.look = l0;
      lk.onchange = () => {
        document.documentElement.dataset.look = lk.value;
        try {
          localStorage.setItem('ls-look', lk.value);
        } catch (e) {}
      };
      set.m.append(lk);
    }
    [$('uisel'), $('dgsel')].forEach(e => e && set.m.append(e));
    const anSel = [...an.querySelectorAll('.tb-menu select')];
    anSel.forEach(s => {
      s.classList.add('an-only');
      set.m.append(s);
    });
    const sl = $('slive');
    if (sl) {
      sl.classList.add('dit-only');
      set.m.append(sl);
    }
    set.head('Simulation');
    document.querySelectorAll('.wbtn').forEach(w => {
      w.classList.add(an.contains(w) ? 'an-only' : 'dit-only');
      set.m.append(w);
    });
    {
      /* 2.0.0: start the simulation like the plant in service (HMI snapshots, about 150 MW) instead of a cold boiler */
      const ld = document.createElement('button');
      ld.className = 'an-only';
      ld.id = 'load150';
      ld.textContent = 'Start at 150 MW (HMI snapshot)';
      ld.title = 'Reset, then every transmitter that is on the control-room HMI snapshots takes its snapshot value (docs/hmi)';
      ld.onclick = () => {
        try {
          AN.reset();
          const n = AN.plantLoad150();
          AN.settle();
          AN.paint();
          msg('Plant at 150 MW: ' + n + ' transmitters set from the HMI snapshots. Press Run.');
          /* 2.2.0-beta.3: the DITL sheets in the 150 MW state too (MFT reset, equipment of the snapshots running) */
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
      };
      set.m.append(ld);
      /* 2.2.0-beta.14 (M4): the plant cold, ready for the start-up procedure (PR-OPE-5002): purge, light-off, pressure raise */
      const cd = document.createElement('button');
      cd.className = 'an-only';
      cd.id = 'loadcold';
      cd.textContent = 'Start cold (M4 start-up)';
      cd.title = 'Reset, the 150 MW anchors, then the plant cold: drum 0 kg/cm2, water and bed 30 C, feeders and fans stopped, oil valves closed, every controller LOCAL + MANUAL 0 %. The CHECK panel has the procedure.';
      cd.onclick = () => {
        try {
          AN.reset();
          const n = AN.plantCold();
          AN.paint();
          msg('Plant cold: drum 0 kg/cm2, water 30 C, no fire. Press Run, then start the fans (Buttons M.3302 / 3303 / 3304), purge, open the oil valves (M.3410 / 3411 = 0) and fire the burners (FICDO1043A / B). ' + n + ' anchors.');
        } catch (e) {
          msg('Could not load the cold state: ' + e.message);
        }
      };
      set.m.append(cd);
      /* 2.2.0-beta.15 (M4 step 2): the plant warm = the end of the cold start (30 kg/cm2, bed 480 C, 4 burners lit) */
      const wm = document.createElement('button');
      wm.className = 'an-only';
      wm.id = 'loadwarm';
      wm.textContent = 'Start warm (M4: 30 kg/cm2, burners lit)';
      wm.title = 'Start cold, then the plant as at the end of the cold start: drum 30 kg/cm2, bed 480 C, fans running, 4 start-up burners at 30 %. For the coal transfer and the next steps of PR-OPE-5002.';
      wm.onclick = () => {
        try {
          AN.reset();
          const n = AN.plantWarm();
          AN.paint();
          msg('Plant warm: drum 30 kg/cm2, bed 480 C, 4 start-up burners lit. Press Run; coal transfer: CHECK panel has the steps. ' + n + ' anchors.');
        } catch (e) {
          msg('Could not load the warm state: ' + e.message);
        }
      };
      set.m.append(wm);
    }
    set.head('Channel at update');
    const ch = $('chsel'),
      up = $('updbtn');
    if (ch) set.m.append(ch);
    if (up) {
      up.textContent = 'Check for update';
      set.m.append(up);
    }
    /* short labels (the handlers do not read these texts) */
    const cats = [...document.querySelectorAll('.cat button')];
    cats.forEach(b => (b.textContent = /DITL/.test(b.textContent) ? 'DITL' : 'ABC'));
    const lbl = (re, t) => {
      const b = [...an.querySelectorAll('button')].find(x => re.test(x.textContent.trim()));
      if (b) b.textContent = t;
    };
    lbl(/^◀\s*Back$/, '◀◀');
    lbl(/^Next\s*▶$/, '▶▶');
    lbl(/^Wire values$/, 'Wire');
    lbl(/^⋯\s*More$/, '⋯');
    const tl = [...bar.querySelectorAll('button')].find(x => /^⋯\s*Tools$/.test(x.textContent.trim()));
    if (tl) tl.textContent = '⋯';
    /* status bar: RUN / VIEW chip, sheet, version + the hint line */
    const st = $('st'),
      chip = $('stchip');
    if (st && chip) {
      const foot = document.createElement('div');
      foot.id = 'sfoot';
      st.before(foot);
      foot.append(chip);
      /* the simulation clock of the ABC (t = 0:00) goes to the status bar */
      const clk = [...an.querySelectorAll('span')].find(s => /^t\s*=/.test(s.textContent.trim()));
      if (clk) {
        clk.classList.add('an-only', 'sclock');
        foot.append(clk);
      }
      foot.append(st);
    }
    gs.prepend(bar, an);
    gs.append(srch, set.w);
    gs.dataset.top = '1';
    document.body.classList.add('top1');
    return true;
  }
  let n3 = 0;
  const iv3 = setInterval(() => {
    try {
      if (buildTop() || ++n3 > 60) clearInterval(iv3);
    } catch (e) {
      clearInterval(iv3);
    }
  }, 300);
  let n = 0;
  const iv = setInterval(() => {
    try {
      if (build() || ++n > 40) clearInterval(iv);
    } catch (e) {
      clearInterval(iv);
    }
  }, 300);
  let n2 = 0;
  const iv2 = setInterval(() => {
    try {
      if (buildDitl() || ++n2 > 40) clearInterval(iv2);
    } catch (e) {
      clearInterval(iv2);
    }
  }, 300);
})();
