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
      second = btn(/^2nd sheet/);
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
    sheets.title = 'Listahan ng mga sheet';
    sheets.onclick = e => {
      e.stopPropagation();
      const s = $('side');
      if (s) s.classList.toggle('uiopen');
    };
    const gSim = mk('tbg-run', 'Takbo', [run, back, next, stepSel, speedSel, reset, view]);
    const gView = mk('', 'Tingin', [fit, values, wire, panel]);
    const gSheet = mk('', 'Sheet', [sheets, shbox, time]);
    const more = document.createElement('div');
    more.className = 'tb-more';
    const mb = document.createElement('button');
    mb.textContent = '⋯ More';
    mb.title = 'Iba pang mga button';
    const menu = document.createElement('div');
    menu.className = 'tb-menu';
    const head = x => {
      const h = document.createElement('div');
      h.className = 'tb-mh';
      h.textContent = x;
      menu.append(h);
    };
    head('Tingin');
    [review, live, theme, xback].forEach(e => e && menu.append(e));
    head('Tseke');
    [health, audit, ln, assumed].forEach(e => e && menu.append(e));
    head('Iba pang pahina');
    [ditl, second].forEach(e => e && menu.append(e));
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
    const gSim = mk('tbg-run', 'Takbo', [mode]);
    const gView = mk('', 'Tingin', [fit, live]);
    const gSheet = mk('tbg-sheet', 'Sheet', [shbox]);
    const more = document.createElement('div');
    more.className = 'tb-more';
    const mb = document.createElement('button');
    mb.textContent = '⋯ Tools';
    mb.title = 'Mga tool sa pag-edit ng drawing at project';
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
    head('Edit ng drawing');
    [$('bundo'), $('bredo'), $('bclr'), $('bdel'), $('bwire')].forEach(e => e && menu.append(e));
    head('Tseke');
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
