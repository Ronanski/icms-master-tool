/* ===== RE-SHELL LAYOUT C, step 6 of 7 (build plan approved by the user 2026-11-09, mockup C screens 12 search, 14 settings, 15 update
   banner, 16 error banner, 18 full screen, tablet4x3-*): the search pill, the banners under the strip, one message line, the Settings
   panel and the tablet / Training dock layout of the strip. Only with ?shell=c (body.sc). It drives only what the app already has: the
   global search box (#ansb, scope #gscope, results #anfind of category-search.js), the info card (lsInfo) for Why?, the update check
   (lsCheckUpdate), the channel select #chsel, the drawing text select #dgtsel, the symbols select of the ABC page, the banners #updask,
   #errbn, #engerr. ===== */
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
  const B = () => document.body;
  const btn = (cls, txt, title, fn) => {
    const b = E('button', cls, txt);
    b.type = 'button';
    if (title) b.title = title;
    if (fn) b.onclick = fn;
    return b;
  };

  /* ---------- (a) search: the pill opens the app's own search box under the strip ---------- */
  const srchBox = () => document.querySelector('#crband > .gs-search') || document.querySelector('#gsbar .gs-search');
  function openSearch() {
    B().classList.add('scsearch');
    const a = $('ansb');
    if (a)
      setTimeout(() => {
        a.focus();
        a.select();
      }, 0);
  }
  function closeSearch() {
    B().classList.remove('scsearch');
  }
  /* "/" and Ctrl+K: the app's own key handler focuses #ansb; the box is shown first so the focus lands (capture, before it) */
  addEventListener(
    'keydown',
    e => {
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) B().classList.add('scsearch');
    },
    true
  );
  document.addEventListener(
    'pointerdown',
    e => {
      if (!B().classList.contains('scsearch')) return;
      const s = srchBox(),
        f = $('anfind'),
        t = e.target;
      if ((s && s.contains(t)) || (f && f.contains(t)) || (t.closest && t.closest('.scsrp,#infocard'))) return;
      closeSearch();
    },
    true
  );
  addEventListener('keydown', e => e.key === 'Escape' && B().classList.contains('scsearch') && document.activeElement === $('ansb') && closeSearch());
  /* every result: Open (the row itself) and Why? (the info card of the tag, look only, as a search opens it) */
  function decorate() {
    const f = $('anfind');
    if (!f) return;
    for (const b of f.querySelectorAll(':scope > button')) {
      if (b.parentNode.classList && b.parentNode.classList.contains('scsr')) continue;
      const row = E('div', 'scsr');
      b.before(row);
      row.append(b);
      const op = btn('scso', 'Open', b.title || 'Open', () => b.click());
      row.append(op);
      const sn = b.querySelector('.sn'),
        tag = sn ? sn.textContent.split('  ·  ')[0].trim() : '';
      /* a sheet row (its name is the sheet) has no tag: no Why? */
      if (tag && !/^(ABC|DITL)-/i.test(tag)) {
        const w = btn('scsw', 'Why?', 'The card of ' + tag + ': where it comes from and where it goes', () => {
          const ok = call(() => window.lsInfo && lsInfo(tag, { look: true }), false);
          if (!ok) ((w.textContent = 'No card'), (w.disabled = true));
        });
        row.append(w);
      }
    }
  }
  function watchFind() {
    const f = $('anfind');
    if (!f) return false;
    new MutationObserver(decorate).observe(f, { childList: true });
    return true;
  }

  /* ---------- (b) banners under the strip, one message line ---------- */
  /* an error banner gets Dismiss (a button beside it, not inside: the banner text is rewritten as a whole); it comes back when a new line
     is written into it */
  const DX = {};
  function dismissable(id) {
    const d = $(id);
    if (!d) return;
    let x = DX[id];
    if (!x) {
      x = DX[id] = btn('scbx', 'Dismiss', 'Hide this message (it comes back with a new error)', () => {
        d.dataset.scgone = d.textContent.length;
        d.classList.add('scgone');
        x.hidden = true;
      });
      document.body.append(x);
      new MutationObserver(() => {
        if (d.classList.contains('scgone') && d.textContent.length > +d.dataset.scgone) d.classList.remove('scgone');
      }).observe(d, { childList: true, characterData: true, subtree: true });
    }
    const on = !d.classList.contains('scgone') && d.getBoundingClientRect().height > 0;
    x.hidden = !on;
    if (on) x.style.top = Math.round(d.getBoundingClientRect().top + 6) + 'px';
  }
  function tickBanners() {
    B().classList.toggle('scrun', !!(window.AN && AN.run));
    dismissable('errbn');
    dismissable('engerr');
  }

  /* ---------- (c) Settings: one panel for the gear of the strip and the Settings link of the start screen ---------- */
  let set = null;
  const symSel = () => [...document.querySelectorAll('select')].find(s => s.querySelector('option[value="eng"]') && s.querySelector('option[value="color"]')) || null;
  function segOf(name, items, cur, on) {
    const g = E('div', 'scseg');
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', name);
    for (const [v, t] of items) {
      const b = btn(v === cur ? 'on' : '', t, null, () => on(v));
      b.setAttribute('aria-pressed', v === cur ? 'true' : 'false');
      g.append(b);
    }
    return g;
  }
  let lastCheck = '';
  function fillSet() {
    set.textContent = '';
    const hd = E('div', 'scshd');
    hd.append(E('b', '', 'Settings'), btn('scsx', '✕', 'Close', closeSet));
    set.append(hd);
    const row = (label, ctl, sub) => {
      const r = E('div', 'scsrow'),
        l = E('div', 'scsl', label);
      if (sub) l.append(E('small', '', sub));
      r.append(l, ctl);
      set.append(r);
    };
    const ch = $('chsel');
    if (ch)
      row(
        'Channel',
        segOf('Channel', [['stable', 'Stable'], ['beta', 'Beta']], ch.value, v => {
          if (v === ch.value) return;
          ch.value = v;
          ch.dispatchEvent(new Event('change'));
          fillSet();
        })
      );
    row(
      'Updates',
      btn('scsbtn', 'Check now', 'Look for a newer version of this channel now', () => {
        call(() => window.lsCheckUpdate && lsCheckUpdate(true));
        lastCheck = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        fillSet();
      }),
      lastCheck ? 'Last check ' + lastCheck + ': the answer shows at the bottom' : 'Not checked in this session'
    );
    const ts = $('dgtsel');
    if (ts)
      row(
        'Drawing text size',
        segOf('Drawing text size', [['100', '100 %'], ['125', '125 %'], ['150', '150 %']], ts.value, v => {
          ts.value = v;
          ts.dispatchEvent(new Event('change'));
          fillSet();
        })
      );
    const sy = symSel();
    if (sy)
      row(
        'Symbols',
        segOf('Symbols', [['color', 'Colour'], ['eng', 'Engineering']], sy.value, v => {
          sy.value = v;
          sy.dispatchEvent(new Event('change'));
          fillSet();
        }),
        'Engineering = white symbols, only wires, values and valves coloured'
      );
    const ver = (document.title.match(/v\d[\w.-]*/) || [''])[0];
    row('Version', E('span', 'scsver', ver + ' · build @@BUILD@@'));
  }
  function openSet(near) {
    if (!set) {
      set = E('div');
      set.id = 'scset';
      set.setAttribute('role', 'dialog');
      set.setAttribute('aria-label', 'Settings');
      document.body.append(set);
    }
    fillSet();
    set.hidden = false;
    const r = near && near.getBoundingClientRect();
    set.style.top = r ? Math.round(r.bottom + 6) + 'px' : '';
    set.style.right = r ? Math.max(8, Math.round(innerWidth - r.right)) + 'px' : '';
    const f = set.querySelector('button');
    if (f) f.focus();
  }
  function closeSet() {
    if (set) set.hidden = true;
  }
  document.addEventListener(
    'pointerdown',
    e => {
      if (set && !set.hidden && !set.contains(e.target) && !(e.target.closest && e.target.closest('.scgearb,#scstart .scgear'))) closeSet();
    },
    true
  );
  addEventListener('keydown', e => e.key === 'Escape' && set && !set.hidden && closeSet());
  /* the Settings link of the start screen (shellc-home.js) opens this panel instead of the old gear menu */
  document.addEventListener(
    'click',
    e => {
      const g = e.target.closest && e.target.closest('#scstart .scgear');
      if (!g) return;
      e.stopPropagation();
      e.preventDefault();
      set && !set.hidden ? closeSet() : openSet(g);
    },
    true
  );

  /* ---------- the strip: search pill, gear, VIEW | RUN in the pill row, tooltips ---------- */
  let gear = null;
  function buildStrip() {
    const scp = document.querySelector('#scstrip .scp');
    if (!scp) return false;
    const sp = btn('pill scsrp', '', 'Search a tag, address, description or memory in every sheet (keys / or Ctrl+K)', () =>
      B().classList.contains('scsearch') ? closeSearch() : openSearch()
    );
    sp.append(E('span', '', 'Search'), E('kbd', '', 'Ctrl K'));
    scp.prepend(sp);
    gear = btn('pill scgearb', '', 'Settings: channel, updates, drawing text size, symbols, version', () => (set && !set.hidden ? closeSet() : openSet(gear)));
    gear.setAttribute('aria-label', 'Settings');
    gear.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2.3"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></svg>';
    scp.append(gear);
    return true;
  }
  /* the old VIEW | RUN switch joins the pill row (one row of buttons; with the Training dock open it made the strip 3 or 4 rows) */
  function pillRow() {
    const scp = document.querySelector('#scstrip .scp'),
      vr = document.querySelector('#crband > .seg');
    if (scp && vr && gear && vr.parentNode !== scp) scp.insertBefore(vr, gear);
    /* tooltips on the strip buttons that have none */
    for (const b of document.querySelectorAll('#scstrip button:not([title])')) {
      const t = b.textContent.trim();
      b.title =
        t === 'Operator'
          ? 'Operator: the overview of the unit and its pages'
          : t === 'Engineer'
            ? 'Engineer: the logic sheets'
            : /^VIEW$/i.test(t)
              ? 'VIEW: look and trace only, the plant does not run'
              : /^RUN$/i.test(t)
                ? 'RUN: the plant runs; force, A / M / R, SV and MV work'
                : t;
    }
  }
  /* (d) the Training dock makes the page narrower than the window: the strip takes its 2-row form by the width of the band (container
     rules in shellc-ui.css). The left rail slides out over the band: the first value
     starts right of it */
  function layout() {
    const band = $('crband');
    if (!band) return;
    /* the height of the band (--top) is set by shellc.js from the rows of the strip (Jennie, beta.216); nothing here writes --top */
    const rail = $('crrail');
    let pad = '';
    if (rail && rail.offsetParent !== null && !rail.matches(':hover,:focus-within')) {
      const r = rail.getBoundingClientRect(),
        b = band.getBoundingClientRect();
      if (r.width && r.right > b.left + 1 && r.left <= b.left + 1) pad = Math.ceil(r.right - b.left + 8) + 'px';
    }
    if (pad) band.style.setProperty('padding-left', pad, 'important');
    else band.style.removeProperty('padding-left');
  }

  /* ---------- start ---------- */
  let k = 0,
    found = false,
    strip = false;
  const iv = setInterval(() => {
    if (!B().classList.contains('sc')) {
      if (++k > 150) clearInterval(iv);
      return;
    }
    if (!found) found = watchFind();
    if (!strip) strip = buildStrip();
    if (found && strip) {
      clearInterval(iv);
      const t = () => (tickBanners(), pillRow(), layout());
      setInterval(t, 1000);
      addEventListener('resize', layout);
      t();
    }
  }, 300);
})();
