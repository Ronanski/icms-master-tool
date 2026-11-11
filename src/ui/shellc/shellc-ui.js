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
  const srchBox = () => document.querySelector('#gsbar .gs-search');
  function openSearch() {
    B().classList.add('scsearch');
    const a = $('ansb');
    if (a)
      setTimeout(() => {
        a.focus();
        a.select();
      }, 0);
  }
  /* shell audit M24 / M25: closing the search closes the box AND its result list (the list stayed over other panes) */
  function hideList() {
    const f = $('anfind');
    if (f && f.style.display !== 'none') f.style.display = 'none';
  }
  function closeSearch() {
    B().classList.remove('scsearch');
    hideList();
    const a = $('ansb');
    if (a && document.activeElement === a) a.blur();
  }
  /* "/" and Ctrl+K open the search at every width (Jennie, live check 264: "/" did nothing at 1024 in the Operator view, where the app's
     own key handler opens its narrow-screen search row instead): the C search takes the key (capture, before the app's handler) */
  addEventListener(
    'keydown',
    e => {
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openSearch();
      }
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
      /* the Show of a Why? card goes to the sheet: the search is finished (it stayed open over the sheet) */
      const shw = t.closest && t.closest('#infocard button');
      /* closed after the click: closing at the press moved the card up and the press missed the button (Mina, 270: two presses needed) */
      if (shw && shw.textContent.trim() === 'Show') return void addEventListener('pointerup', () => setTimeout(closeSearch, 60), { once: true });
      if ((s && s.contains(t)) || (f && f.contains(t)) || (t.closest && t.closest('.scsrp,#infocard'))) return;
      closeSearch();
    },
    true
  );
  /* Escape closes the whole search wherever the focus is (capture: the search box stops the key for the rest of the page). The Why? card
     of a result closes first (Jennie, live check 264: it closed only with its ✕), then the next Escape closes the search */
  addEventListener(
    'keydown',
    e => {
      if (e.key !== 'Escape') return;
      const ic = $('infocard');
      if (ic && ic.getClientRects().length && getComputedStyle(ic).display !== 'none' && window.lsInfoClose) {
        e.preventDefault();
        e.stopImmediatePropagation();
        call(() => lsInfoClose());
        return;
      }
      if (B().classList.contains('scsearch')) closeSearch();
    },
    true
  );
  /* every result: Open (the row itself) and Why? (the info card of the tag, look only, as a search opens it) */
  /* a sheet name that some DITL row names (a contents page, a page link): its card is not empty (info.js ditlPlaces reads the same cells) */
  const NAMED = new Map();
  function named(nm) {
    const k = String(nm).trim().toUpperCase();
    if (!NAMED.has(k))
      NAMED.set(
        k,
        call(
          () => S.sheets.some(s => Object.values(s.cells || {}).some(a => a.some(t => String(t.t || '').trim().toUpperCase() === k))),
          false
        )
      );
    return NAMED.get(k);
  }
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
        /* a page-link row "( FROM ABC-010 )" names a sheet too */
        tag0 = (sn ? sn.textContent.split('  ·  ')[0].trim() : '').replace(/^\(\s*(?:FROM|TO)\s+(.+?)\s*\)$/i, '$1'),
        /* Giselle beta.260 (Jennie, from Mina's live test of 254): a sheet row is named with its page number, "(41)DITL-23A", and its
           Why? asked for a card of that text and said "No card". A sheet row now asks for the card of the bare name (DITL-23A: the
           DITL rows that name that sheet, as the card of a typed DITL-23A), and it has no Why? when no DITL row names it */
        sheet = /^(\(\w+\))?\s*(ABC|DITL)-/i.test(tag0),
        tag = sheet ? tag0.replace(/^\(\w+\)\s*/, '').replace(/\s*#\w+$/, '') : tag0;
      if (tag && (!sheet || named(tag))) {
        const w = btn('scsw', 'Why?', 'The card of ' + tag + ': where it comes from and where it goes', () => {
          const ok = call(() => window.lsInfo && lsInfo(tag, { look: true }), false);
          if (!ok) ((w.textContent = 'No card'), (w.disabled = true));
          /* the result list lay over the card it opened (beta.260): the card shows alone; the box keeps the text for the next look */ else hideList();
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
      const seen = new Set();
      x = DX[id] = btn('scbx', 'Dismiss', 'Hide this message (it comes back with a new error)', () => {
        /* Mina, live test of 279: the same error brought the banner back with all its old lines: the lines read are kept out, a new line shows alone */
        d.textContent.split('\n').forEach(l => l && seen.add(l));
        d.classList.add('scgone');
        d.textContent = '';
        x.hidden = true;
      });
      document.body.append(x);
      new MutationObserver(() => {
        if (!d.classList.contains('scgone') || !d.textContent) return;
        const n = d.textContent.split('\n').filter(l => l && !seen.has(l));
        d.textContent = n.join('\n');
        if (n.length) d.classList.remove('scgone');
      }).observe(d, { childList: true, characterData: true, subtree: true });
    }
    const on = !d.classList.contains('scgone') && d.getBoundingClientRect().height > 0;
    x.hidden = !on;
    if (on) x.style.top = Math.round(d.getBoundingClientRect().top + 6) + 'px';
  }
  /* live check beta.233: the app message ("Plant at 150 MW: ... Press Run.") stood at the bottom right over the alarm tile and the footer:
     in the C layout it is a toast under the top bar that leaves with the message (the app hides it after 7 s); a click hides it now */
  let toast = null;
  function tickToast() {
    const sm = document.querySelector('#sfoot .smsg'),
      on = B().classList.contains('hasmsg') && !!sm && !!sm.textContent.trim();
    if (!toast) {
      toast = E('div', 'sctoast');
      toast.setAttribute('role', 'status');
      toast.title = 'Click to hide';
      toast.onclick = () => (B().classList.remove('hasmsg'), (toast.hidden = true));
      toast.hidden = true;
      document.body.append(toast);
    }
    if (on && toast.textContent !== sm.textContent) toast.textContent = sm.textContent;
    toast.hidden = !on;
  }
  function tickBanners() {
    B().classList.toggle('scrun', !!(window.AN && AN.run));
    tickToast();
    dismissable('errbn');
    dismissable('engerr');
    dismissable('anerr');
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
    /* Mina B79-1: on a narrow window the gear moves into the More menu (scmore2m): insertBefore threw every pass (red ERROR banner) */
    if (scp && vr && gear && vr.parentNode !== scp) gear.parentNode === scp ? scp.insertBefore(vr, gear) : scp.append(vr);
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
    /* the height of the band (--top), its padding clear of the rail and the dock, and --scb are set by shellc.js (Jennie, beta.216 /
       220): nothing here writes them. Live check beta.233: the update banner covered the top of the overview tiles; the banners stand
       in the top bar as its last row, so the bar's real bottom (--scb, shellc.js) takes their height and the pages start under them */
    for (const id of ['updask', 'errbn', 'engerr']) {
      const d = $(id);
      if (d && d.parentNode !== band) band.append(d);
    }
  }

  /* live check beta.240: the overview map of the sheet stays hidden until the Map button of the zoom bar shows it */
  function mapBtn() {
    const z = $('zbar');
    if (!z || z.querySelector('.scmapb')) return;
    const b = btn('scmapb', 'Map', 'Show or hide the small overview map of the sheet (it shows when the sheet is zoomed in)', () => {
      const on = !B().classList.contains('scmap');
      B().classList.toggle('scmap', on);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      dispatchEvent(new Event('resize'));
    });
    b.setAttribute('aria-pressed', 'false');
    z.append(b);
  }
  /* the ABC mode label sets its colours inline (paint.js); the C colours come from shellc-ui.css (!important), RUN red by a class */
  function modeLbl() {
    const m = $('anmode');
    if (!m) return;
    const run = /RUNNING/.test(m.textContent);
    if (m.classList.contains('scrunl') !== run) m.classList.toggle('scrunl', run);
  }

  /* ---------- start ---------- */
  let k = 0,
    found = false,
    strip = false;
  const iv = setInterval(() => {
    if (!B().classList.contains('sc')) {
      ++k; /* no time limit (live check beta.241) */
      return;
    }
    if (!found) found = watchFind();
    if (!strip) strip = buildStrip();
    if (found && strip) {
      clearInterval(iv);
      /* a result list left on screen with the search closed (another view took the focus) goes too */
      const t = () => (tickBanners(), pillRow(), layout(), mapBtn(), modeLbl(), !B().classList.contains('scsearch') && document.activeElement !== $('ansb') && hideList());
      setInterval(t, 1000);
      new MutationObserver(tickToast).observe(document.body, { attributes: true, attributeFilter: ['class'] });
      addEventListener('resize', layout);
      t();
    }
  }, 300);
})();
