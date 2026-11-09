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
    moreM = null;
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
      b.addEventListener('click', () => open(false));
      moreM.append(b);
    }
    const open = on => {
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

  /* where each moved control sits: the free part of the context bar (slot), the sheet tool bar and the plant pane header */
  function tick() {
    if (!ctx && !build()) return;
    tabs();
    if (more) {
      const sel = moreM.querySelector('.on');
      more.classList.toggle('on', !!sel);
      more.querySelector('.scmoreb').textContent = (sel ? sel.textContent.trim() : 'More') + ' ▾';
    }
    const r = slot.getBoundingClientRect(),
      s = B.style;
    set(B, '--scsx', Math.round(r.left) + 'px');
    set(B, '--scsy', Math.round(r.top) + 'px');
    set(B, '--scsw', Math.max(0, Math.round(r.width)) + 'px');
    set(B, '--scsh', Math.round(r.height) + 'px');
    const tb = document.querySelector('#gsbar > .tbar');
    if (tb) {
      const t = tb.getBoundingClientRect();
      set(B, '--sctby', Math.round(t.top) + 'px');
      set(B, '--sctbh', Math.round(t.height) + 'px');
    }
    void s;
    /* the breadcrumb (shellc-home.js) is the first thing of the slot: the page tools start right of it */
    const c = document.querySelector('.sccrumb');
    set(B, '--sccrw', (c && c.offsetWidth ? c.offsetWidth + 8 : 0) + 'px');
    /* no room (a long trip or alarm text in the status): the page tools go back to their own row on the page, the Engineer tabs take
       less padding (body.scsq); back again when they fit (the measure is the same in both forms) */
    const need = (() => {
      if (B.classList.contains('sceng')) {
        const n = $('scetools');
        /* measured at the padding of now: with scsq on, each tab is 8 px narrower than without it */
        const t = n ? [...n.querySelectorAll(':scope > button, :scope > .scmore')] : [];
        return t.reduce((a, e) => a + e.offsetWidth + 4, 0) + (B.classList.contains('scsq') ? 8 * t.length : 0);
      }
      const pb = document.querySelector('#plantws .plbar');
      if (!pb || B.dataset.tab !== 'operate' || B.classList.contains('scov')) return 0;
      const k = [...pb.children].filter(e => e.offsetWidth && !e.classList.contains('scpev') && !e.classList.contains('scecr'));
      return (c && c.offsetWidth ? c.offsetWidth + 8 : 0) + k.reduce((a, e) => a + e.offsetWidth + 4, 0);
    })();
    const sq = B.classList.contains('scsq');
    if (!sq && need > r.width) B.classList.add('scsq');
    else if (sq && need + 2 <= r.width) B.classList.remove('scsq');
    /* the page name can be cut with … (shellc-bars.css): its full name in the tooltip */
    const nm = c && c.querySelector('b') ? c.querySelector('b').textContent.trim() : '',
      ti = 'Back to the overview of the unit' + (nm ? '. This page: ' + nm : '');
    if (c && c.title !== ti) c.title = ti;
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
