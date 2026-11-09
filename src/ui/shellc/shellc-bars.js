/* ===== RE-SHELL LAYOUT C, the two bars (user approved the direction "two bars, one Details column" on 2026-11-09, "Gawin na";
   audit and mockup: team-files/reshell/uxaudit/ux.html, artifact DMAqPXBECUGeEShYRB2QX8). Slice 1: the header.
   - the values bar: the 11 values of the strip (shellc.js), one row of 60 px;
   - the context bar under it, 48 px: Operator | Engineer on the left; then, Operator: Plant › page, TCS / Field, Fit, Full screen,
     ‹ › (the Plant view's own page bar); Engineer: the tools (Logic, Library, Curves, Loop check, More ▾ with Recent and Sheet
     tools, the buttons of shellc-eng.js) as tabs; on the right the status and the strip buttons (trip, alarms, Run, speed,
     Instructor, VIEW | RUN, PLANT, Search, Settings).
   - Engineer: the sheet tool bar (ABC | DITL | TCS, the sheet, Values, Wire values, Inputs, Inspector, Legend) is the header of the
     sheet pane, the plant page bar (Plant › page, Fit, ‹ ›) the header of the plant pane; the tool rail is gone (its width is 0).
   Nothing is rebuilt: the old controls are placed (CSS, shellc-bars.css) or moved inside the strip; their handlers, the logic, the
   HMI drawings, the plant model and the faceplates are not touched. Only with ?shell=c (body.sc). ===== */
(function () {
  let want = false;
  try {
    want = localStorage.getItem('ls-shell') === 'c';
  } catch (e) {}
  if (!want) return;
  const $ = id => document.getElementById(id);
  const B = document.body;
  const E = (t, cls, txt) => {
    const e = document.createElement(t);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  let ctx = null,
    slot = null,
    more = null,
    moreM = null,
    main = [],
    open = () => {},
    full = 0;
  const set = (el, k, v) => {
    if (el.style.getPropertyValue(k) !== v) el.style.setProperty(k, v);
  };

  function build() {
    const st = $('scstrip'),
      scp = st && st.querySelector(':scope > .scp'),
      seg = scp && [...scp.querySelectorAll(':scope > .seg')].find(s => /Operator/.test(s.textContent));
    if (!st || !scp || !seg) return false;
    ctx = E('div');
    ctx.id = 'scctx';
    ctx.setAttribute('role', 'toolbar');
    ctx.setAttribute('aria-label', 'Where you are and what you can do');
    slot = E('div', 'scslot');
    ctx.append(seg, slot, scp);
    st.append(ctx);
    B.classList.add('scbars');
    return true;
  }

  /* Engineer: the tools of shellc-eng.js as tabs; Recent and Sheet tools go into More ▾ (the mockup: four tabs and the picker) */
  function tabs() {
    const nav = $('scetools');
    if (!nav || nav.querySelector('.scmore')) return;
    const bs = [...nav.querySelectorAll(':scope > button')],
      rest = bs.filter(b => /^(Recent|Sheet tools)$/.test(b.textContent.trim()));
    if (rest.length < 2) return;
    const lg = bs.find(b => b.textContent.trim() === 'Logic side by side');
    if (lg) {
      lg.textContent = 'Logic';
      lg.title = 'Logic side by side: the plant page and its logic sheet, with Why is it?';
    }
    nav.setAttribute('role', 'tablist');
    more = E('div', 'scmore');
    const mb = E('button', 'scmoreb', 'More ▾');
    mb.type = 'button';
    mb.title = 'Recent sheets and faceplates, sheet tools';
    mb.setAttribute('aria-haspopup', 'true');
    mb.setAttribute('aria-expanded', 'false');
    moreM = E('div', 'scmorem');
    moreM.setAttribute('role', 'menu');
    for (const b of rest) {
      b.setAttribute('role', 'menuitem');
      moreM.append(b);
    }
    main = bs.filter(b => !rest.includes(b));
    /* a choice in the menu closes it (the tabs that move into it on a narrow bar too, body.scsq2) */
    moreM.addEventListener('click', e => {
      if (e.target.closest('button')) open(false);
    });
    open = on => {
      more.classList.toggle('open', on);
      mb.setAttribute('aria-expanded', String(on));
    };
    mb.onclick = () => open(!more.classList.contains('open'));
    document.addEventListener('click', e => {
      if (!more.contains(e.target)) open(false);
    });
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && more.classList.contains('open')) {
        open(false);
        mb.focus();
      }
    });
    more.append(mb, moreM);
    nav.append(more);
  }

  /* Engineer: the tabs at their width; then 8 px less padding each (scsq); then, when even that does not fit (a tablet, a long
     status), every tab goes into the menu, whose button names the tool that is open (scsq2). Back again when they fit */
  function engFit(W) {
    const n = $('scetools');
    if (!n || !more) return;
    const sq2 = B.classList.contains('scsq2'),
      cnt = main.length + 1;
    if (!sq2) full = [...main, more].reduce((a, e) => a + e.offsetWidth + 4, 0) + (B.classList.contains('scsq') ? 8 * cnt : 0);
    if (!full) return;
    /* the level that fits with 2 px to spare (the measure is the same at every level, so it does not swing) */
    const tight = full - 8 * cnt,
      nl = full + 2 <= W ? 0 : tight + 2 <= W ? 1 : 2;
    B.classList.toggle('scsq', nl >= 1);
    B.classList.toggle('scsq2', nl === 2);
    if (nl === 2 && main[0].parentElement !== moreM) {
      moreM.prepend(...main);
      for (const b of main) b.setAttribute('role', 'menuitem');
    } else if (nl < 2 && main[0].parentElement === moreM) {
      for (const b of main) {
        n.insertBefore(b, more);
        b.removeAttribute('role');
      }
    }
  }

  /* ---------- slice 4, tablet (under 1280 px, or a touch screen under 1366): 8 values + More, the rare buttons in More ▾ ---------- */
  /* Mina b265: with the Training dock open the page is narrower than the window (the dock takes the right part): the width that counts
     is the page's (at 1366 with the dock the 11 values got 82 px each and their names were cut) */
  const pageW = () => Math.min(innerWidth, B.clientWidth || innerWidth);
  const tabW = () => pageW() < 1280 || (matchMedia('(pointer:coarse)').matches && pageW() < 1366);
  let vMore = null,
    vPop = null,
    cMore = null,
    cMenu = null;
  function menuOf(wrap, btn, pop) {
    const open = on => {
      wrap.classList.toggle('open', on);
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-expanded', String(on));
      if (pop) pop.hidden = !on;
    };
    btn.onclick = () => open(!btn.classList.contains('on'));
    document.addEventListener('click', e => {
      if (!wrap.contains(e.target) && !(pop && pop.contains(e.target))) open(false);
    });
    /* capture: a panel under it (the Training dock, the Details column) does not take the Escape first (Mina b265: the value list stayed) */
    addEventListener(
      'keydown',
      e => {
        if (e.key === 'Escape' && btn.classList.contains('on')) {
          open(false);
          btn.focus();
        }
      },
      true
    );
    return open;
  }
  function tablet() {
    const st = $('scstrip'),
      scv = st && st.querySelector('.scv'),
      scp = ctx && ctx.querySelector('.scp');
    if (!scv || !scp) return;
    if (!vMore) {
      vMore = E('button', 'sckmore', 'More ▾');
      vMore.type = 'button';
      vMore.title = 'The other plant values: furnace pressure, total coal flow, total air flow';
      vMore.setAttribute('aria-haspopup', 'true');
      vMore.setAttribute('aria-expanded', 'false');
      vPop = E('div');
      vPop.id = 'scvm';
      vPop.hidden = true;
      vPop.setAttribute('role', 'group');
      vPop.setAttribute('aria-label', 'More plant values');
      document.body.append(vPop);
      menuOf(vMore, vMore, vPop);
      vMore.addEventListener('click', () => {
        if (vPop.hidden) return;
        /* Mina b265 (1024, dock open): the list opened at x -88. It is placed from where a fixed box really stands (the dock gives the
           body a transform) and kept inside the page */
        const r = vMore.getBoundingClientRect(),
          o = origin(),
          w = vPop.offsetWidth || 224,
          pw = pageW();
        vPop.style.right = 'auto';
        vPop.style.top = Math.round(r.bottom + 4 - o.y) + 'px';
        vPop.style.left = Math.round(Math.max(8, Math.min(pw - w - 8, r.right - o.x - w))) + 'px';
      });
      cMore = E('div', 'scmore2');
      const b = E('button', 'scmore2b', 'More ▾');
      b.type = 'button';
      b.title = 'Instructor console, Search, Details, Settings';
      b.setAttribute('aria-haspopup', 'true');
      b.setAttribute('aria-expanded', 'false');
      cMenu = E('div', 'scmore2m');
      cMenu.setAttribute('role', 'menu');
      cMore.append(b, cMenu);
      const close = menuOf(cMore, b, null);
      cMenu.addEventListener('click', e => {
        if (e.target.closest('button')) setTimeout(() => close(false), 0);
      });
    }
    const on = tabW();
    B.classList.toggle('sctab', on);
    if (vMore.parentElement !== scv) scv.append(vMore);
    if (cMore.parentElement !== scp) scp.append(cMore);
    /* the values: the last 3 cells in the More popover on a tablet, back in the bar on a PC (shellc.js keeps writing their numbers) */
    if (on && scv.querySelectorAll(':scope > .sck').length > 8) for (const c of [...scv.querySelectorAll(':scope > .sck')].slice(8)) vPop.append(c);
    if (!on && vPop.children.length) {
      for (const c of [...vPop.children]) scv.insertBefore(c, vMore);
      vPop.hidden = true;
    }
    /* the rare buttons: Instructor, Search, Details, Settings (View | RUN must already be in the bar: shellc-ui.js puts it before Settings) */
    const q = sel => scp.querySelector(':scope > ' + sel) || cMenu.querySelector(':scope > ' + sel),
      rare = [q('.pill.ins'), q('.scdetb'), q('.scsrp'), q('.scgearb')].filter(Boolean);
    /* the gear has no name of its own (an icon): a "Settings" label, shown only in the menu (shellc-bars.css .scmlbl) */
    const gear = q('.scgearb');
    if (gear && !gear.querySelector('.scmlbl')) gear.append(E('span', 'scmlbl', 'Settings'));
    const vr = [...scp.querySelectorAll(':scope > .seg')].some(s => /VIEW/.test(s.textContent));
    /* in this order in the menu; moved only when the order is not right yet (a move takes the focus away) */
    if (on && vr && rare.some((x, i) => cMenu.children[i] !== x)) for (const x of rare) cMenu.append(x);
    if (!on && cMenu.children.length) for (const x of [...cMenu.children]) scp.insertBefore(x, cMore);
  }

  /* Mina b254 (search result "Show" did not open the DITL sheet): while the Training is on a field step, dock.js covers the sheet area
     with "Step N is a field step … Pick a sheet in the list" (body.lsfield) and takes the cover away only on a click in the old sheet
     list (#side, #shsel, #tabs), which layout C does not show. A sheet the operator opens in layout C (search Open, Show of a card,
     ABC | DITL | TCS) takes the cover away the same way: the open sheet differs from the one under the cover */
  let fieldBase = null;
  function fieldCover() {
    if (!B.classList.contains('lsfield')) return void (fieldBase = null);
    let k = '';
    try {
      k = AN.cat + ':' + (AN.cat === 'an' ? AN.i : S.cur);
    } catch (e) {
      return;
    }
    if (fieldBase == null) fieldBase = k;
    else if (k !== fieldBase) {
      B.classList.remove('lsfield');
      fieldBase = null;
    }
  }

  /* layout C never shows the old Home page of the app (Jennie, 259): if the app opens it (a path of the old frame), the Operator
     overview takes its place; the start screen (shellc-home.js) is the one place to choose a start state */
  function noHome() {
    if (B.dataset.tab === 'home' && !$('scstart') && window.lsShellC && lsShellC.showOv) lsShellC.showOv();
  }
  /* the Why? card of a search result (#infocard, info.js) stood over the left part of the search box: it opens under the box */
  function searchCard() {
    const sb = document.querySelector('#gsbar .gs-search'),
      r = B.classList.contains('scsearch') && sb && sb.getClientRects().length ? sb.getBoundingClientRect() : null;
    set(B, '--scsrchb', r && r.height ? Math.round(r.bottom) + 'px' : '');
  }

  /* where each moved control sits: the free part of the context bar (slot), the sheet tool bar and the plant pane header */
  function tick() {
    if (!ctx && !build()) return;
    tabs();
    tablet();
    fieldCover();
    noHome();
    searchCard();
    if (more) {
      const sel = moreM.querySelector('.on');
      more.classList.toggle('on', !!sel);
      more.querySelector('.scmoreb').textContent = (sel ? sel.textContent.trim() : 'More') + ' ▾';
    }
    /* Jennie, live check 264 (Engineer while a training runs, 1366): the plant pane header stood at y -16 over the value bar, also after the
       dock was minimized. With the Training dock the body has a transform, so a position: fixed box is placed from the body, not from the
       screen, and a page scrolled by 16 px counted twice. The places below are measured from where a fixed box at 0, 0 really stands */
    /* Mina b265 (Engineer while a training runs): the whole page stood 16 px up (the value bar labels cut, the plant pane header at
       y -16): the document had been scrolled, which this layout never does (every pane is fixed). The page goes back to the top */
    for (const el of [document.scrollingElement, document.documentElement, B]) if (el && el.scrollTop) el.scrollTop = 0;
    /* Mina b265: a value cell narrower than its two-line name (a narrow page with the dock) cut the name and drew the value over it:
       then the cells take two rows of the values bar instead (shellc-bars.css body.scvwrap) */
    {
      const sv = document.querySelector('#scstrip .scv'),
        cs = sv ? [...sv.querySelectorAll(':scope > .sck')].filter(c => c.offsetWidth) : [],
        free = sv ? sv.clientWidth - (vMore && vMore.offsetWidth ? vMore.offsetWidth + 12 : 0) : 0,
        want = cs.length && free / cs.length < 104;
      if (B.classList.contains('scvwrap') !== !!want) B.classList.toggle('scvwrap', !!want);
      /* the context bar: its buttons that do not fit take a second row instead of running under the dock */
      const narrow = !!ctx && ctx.scrollWidth > ctx.clientWidth + 1;
      if (narrow && !B.classList.contains('scctxwrap')) B.classList.add('scctxwrap');
      else if (!narrow && B.classList.contains('scctxwrap') && ctx.clientWidth > (ctx._w || 0) + 40) B.classList.remove('scctxwrap');
      if (narrow) ctx._w = ctx.clientWidth;
    }
    const o = origin(),
      r0 = slot.getBoundingClientRect(),
      r = { left: r0.left - o.x, top: r0.top - o.y, width: r0.width, height: r0.height },
      s = B.style;
    set(B, '--scsx', Math.round(r.left) + 'px');
    set(B, '--scsy', Math.round(r.top) + 'px');
    set(B, '--scsw', Math.max(0, Math.round(r.width)) + 'px');
    set(B, '--scsh', Math.round(r.height) + 'px');
    /* Mina, live test of 269 (Engineer with the Training panel open): the Training panel hides this tool bar, so its place measured 0 and
       the plant pane header went above the window. Without the bar the header stays in its own row at the top of the plant pane */
    const tb = document.querySelector('#gsbar > .tbar'),
      tbOn = !!(tb && tb.getClientRects().length && tb.offsetHeight);
    B.classList.toggle('sctbno', !tbOn);
    if (tbOn) {
      const t = tb.getBoundingClientRect();
      set(B, '--sctby', Math.round(t.top - o.y) + 'px');
      set(B, '--sctbh', Math.round(t.height) + 'px');
    }
    void s;
    /* the breadcrumb (shellc-home.js) is the first thing of the slot: the page tools start right of it */
    const c = document.querySelector('.sccrumb');
    set(B, '--sccrw', (c && c.offsetWidth ? c.offsetWidth + 8 : 0) + 'px');
    /* no room (a long trip or alarm text in the status): the page tools go back to their own row on the page, the Engineer tabs take
       less padding (body.scsq); back again when they fit (the measure is the same in both forms) */
    if (B.classList.contains('sceng')) engFit(r.width);
    else {
      B.classList.remove('scsq2');
      const pb = document.querySelector('#plantws .plbar');
      const k = pb && B.dataset.tab === 'operate' && !B.classList.contains('scov') ? [...pb.children].filter(e => e.offsetWidth && !e.classList.contains('scpev') && !e.classList.contains('scecr')) : [];
      const need = k.length ? (c && c.offsetWidth ? c.offsetWidth + 8 : 0) + k.reduce((a, e) => a + e.offsetWidth + 4, 0) : 0;
      const sq = B.classList.contains('scsq');
      if (!sq && need > r.width) B.classList.add('scsq');
      else if (sq && need + 2 <= r.width) B.classList.remove('scsq');
    }
    /* the page name can be cut with … (shellc-bars.css): its full name in the tooltip */
    const nm = c && c.querySelector('b') ? c.querySelector('b').textContent.trim() : '',
      ti = 'Back to the overview of the unit' + (nm ? '. This page: ' + nm : '');
    if (c && c.title !== ti) c.title = ti;
  }
  /* where a position: fixed box with left 0, top 0 stands on the screen (0, 0 unless an ancestor has a transform and the page scrolled) */
  let probe = null;
  function origin() {
    if (!probe || !probe.isConnected) {
      probe = E('div');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none';
      B.append(probe);
    }
    const p = probe.getBoundingClientRect();
    return { x: p.left, y: p.top };
  }
  const iv = setInterval(() => {
    if (!B.classList.contains('sc')) return;
    if (build()) {
      clearInterval(iv);
      setInterval(tick, 250);
      addEventListener('resize', tick);
      tick();
      dispatchEvent(new Event('resize'));
    }
  }, 300);
})();
