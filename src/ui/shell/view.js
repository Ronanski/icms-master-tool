/* 2.5.0-beta.18 (user: "ung diagram mismo ng ABC at DITL. anong gagawen para maging readable ... gsto ko sana maview lahat kaso ang
   liliit", chose A + B + C of the proposal): how the drawing is SHOWN, never what is drawn (the gates, wires and layout stay as read
   from the DXF / xls).
   A  Focus: the drawing takes the whole page; the sheet list and the right panel become drawers over it (☰ Sheets, Panel).
   B  Mini-map: a small map of the whole sheet at the corner of the drawing; tap a place = zoom 2× there (or move there when already
      zoomed), drag = move. Shown in Focus and whenever the drawing is zoomed in.
   C  Width: fit the width of the sheet and start at the top (scroll / drag down for the rest).
   The ABC page keeps its view in AN.av[sheet], the DITL page in VB[S.cur]: both are [x, y, w, h] of the viewBox of the same #svg. */
(function () {
  const $ = id => document.getElementById(id);
  const ls = (k, v) => {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) {}
    return null;
  };
  const isAn = () => document.body.classList.contains('an');
  /* the view array of the open sheet (changed in place, as the pages do) */
  const view = () => {
    try {
      if (isAn()) {
        const sh = AN.cs();
        return sh ? AN.av[sh.name] : null;
      }
      return typeof VB !== 'undefined' && typeof S !== 'undefined' ? VB[S.cur] : null;
    } catch (e) {
      return null;
    }
  };
  const setView = v => {
    const a = view(),
      svg = $('svg');
    if (!a || !svg) return;
    a.splice(0, 4, ...v);
    svg.setAttribute('viewBox', a.join(' '));
  };
  /* the extent of the sheet [x0, y0, x1, y1] in viewBox units (y down): the lines of the drawing, not the loose texts around it
     (DITL-56: "STATION 102", "76" far from the frame made the sheet small) */
  const ext = () => {
    try {
      if (isAn()) {
        const sh = AN.cs();
        if (!sh || !sh.R) return null;
        const b = sh.bb || (sh.bb = bbox(sh.R));
        return [b[0] - 10, -b[3] - 10, b[2] + 10, -b[1] + 10];
      }
      return dext(S.sheets[S.cur]);
    } catch (e) {
      return null;
    }
  };
  /* the frame of a DITL sheet (also the first view of the sheet, 04-render.js) */
  function dext(s) {
    try {
      if (!s) return null;
      if (s._ext && s._ext.k === s.raw) return s._ext.e;
      let x0 = 1e9,
        y0 = 1e9,
        x1 = -1e9,
        y1 = -1e9;
      ((s.raw && s.raw.ln) || []).forEach(q => {
        x0 = Math.min(x0, q[0], q[2]);
        x1 = Math.max(x1, q[0], q[2]);
        y0 = Math.min(y0, -q[1], -q[3]);
        y1 = Math.max(y1, -q[1], -q[3]);
      });
      /* the texts of the rows (FROM / TO, tag, service) belong to the sheet even where one runs past the frame (DITL-19 row 6 TO) */
      if (x1 > x0)
        for (const k in s.cells || {})
          for (const t of s.cells[k]) {
            x0 = Math.min(x0, t.x);
            x1 = Math.max(x1, t.x + (t.t || '').length * (t.h || 2) * 0.6);
            y0 = Math.min(y0, -t.y - (t.h || 2));
            y1 = Math.max(y1, -t.y);
          }
      const e = x1 > x0 ? [x0 - 4, y0 - 4, x1 + 4, y1 + 4] : null;
      s._ext = { k: s.raw, e };
      return e;
    } catch (e) {
      return null;
    }
  }
  const box = () => {
    const svg = $('svg'),
      r = svg && svg.getBoundingClientRect();
    return r && r.width && r.height ? r : null;
  };
  /* Fit = the whole sheet, aspect of the screen */
  const fitAll = () => {
    const e = ext(),
      r = box();
    if (!e || !r) return false;
    let w = e[2] - e[0],
      h = e[3] - e[1];
    const ar = r.width / r.height;
    if (w / h < ar) w = h * ar;
    else h = w / ar;
    setView([(e[0] + e[2]) / 2 - w / 2, (e[1] + e[3]) / 2 - h / 2, w, h]);
    return true;
  };
  /* C: Width = the width of the sheet, from the top */
  const fitWidth = () => {
    const e = ext(),
      r = box();
    if (!e || !r) return;
    const w = e[2] - e[0],
      h = (w * r.height) / r.width;
    setView([e[0], e[1], w, h]);
  };
  /* ---------- A: Focus ---------- */
  let focus = ls('lo.focus') === '1';
  const panelOpen = () => {
    const a = $('anp'),
      d = $('dp');
    return isAn() ? !!(a && a.offsetWidth > 0 && !a.classList.contains('min')) : !!(d && d.offsetWidth > 0);
  };
  const panelBtn = () => document.querySelector('.lo-pnl') || [...document.querySelectorAll('#gsbar .tbar button')].find(b => /^Panel$/.test(b.textContent.trim()));
  let wasOpen = false;
  const setFocus = on => {
    const was = focus;
    focus = on;
    ls('lo.focus', on ? '1' : '0');
    /* the panel is a drawer in Focus: closed when Focus starts, opened again on exit when it was open before */
    if (on && !was) {
      wasOpen = panelOpen();
      if (wasOpen && panelBtn()) panelBtn().click();
    }
    document.body.classList.toggle('lo-focus', on);
    if (!on && was && wasOpen) {
      wasOpen = false;
      setTimeout(() => {
        if (!panelOpen() && panelBtn()) panelBtn().click();
      }, 40);
    }
    const sd = $('side');
    if (sd) sd.classList.remove('uiopen');
    paint();
    setTimeout(() => {
      dispatchEvent(new Event('resize'));
      fitAll();
      drawMap(true);
    }, 80);
  };
  /* ---------- B: mini-map ---------- */
  const map = document.createElement('div');
  map.id = 'lomap';
  map.title = 'Map of the whole sheet: tap a place to zoom 2× there, drag to move';
  const cvs = document.createElement('canvas'),
    win = document.createElement('div');
  win.className = 'lomap-win';
  map.append(cvs, win);
  document.body.append(map);
  let mk = '',
    me = null;
  /* the thumbnail: the lines of the drawing (light, drawn once per sheet) */
  function drawMap(force) {
    const e = ext();
    if (!e) return;
    const k = (isAn() ? 'a' : 'd') + (isAn() ? (AN.cs() || {}).name : S.cur) + '|' + e.join(',');
    const W = map.clientWidth || 200,
      H = Math.round((W * (e[3] - e[1])) / (e[2] - e[0]));
    if (!force && k === mk && cvs.height === H * 2) return;
    mk = k;
    me = e;
    cvs.width = W * 2;
    cvs.height = H * 2;
    cvs.style.height = H + 'px';
    const c = cvs.getContext('2d'),
      sx = (W * 2) / (e[2] - e[0]);
    c.clearRect(0, 0, cvs.width, cvs.height);
    c.strokeStyle = getComputedStyle(document.body).getPropertyValue('--c-dim').trim() || '#7d8e98';
    c.lineWidth = 1;
    c.beginPath();
    const seg = (x1, y1, x2, y2) => {
      c.moveTo((x1 - e[0]) * sx, (y1 - e[1]) * sx);
      c.lineTo((x2 - e[0]) * sx, (y2 - e[1]) * sx);
    };
    try {
      if (isAn()) (AN.cs().R.seg || []).forEach(s => seg(s.x1, -s.y1, s.x2, -s.y2));
      else ((S.sheets[S.cur].raw || {}).ln || []).forEach(q => seg(q[0], -q[1], q[2], -q[3]));
    } catch (x) {}
    c.stroke();
  }
  const zoomedIn = () => {
    const v = view(),
      e = ext();
    return !!(v && e && v[2] < (e[2] - e[0]) * 0.85 && v[3] < (e[3] - e[1]) * 0.85);
  };
  function placeMap() {
    const cv = $('cv'),
      r = cv && cv.getBoundingClientRect(),
      show = !!(r && r.width > 200 && document.body.dataset.tab === 'logic' && (focus || zoomedIn()) && view());
    map.style.display = show ? 'block' : 'none';
    if (!show) return;
    map.style.width = (r.width < 600 ? 140 : 200) + 'px';
    drawMap();
    /* bottom-left corner of the drawing (the right side has the panel and the tools) */
    map.style.left = r.left + 10 + 'px';
    map.style.top = r.bottom - map.offsetHeight - 10 + 'px';
    const v = view(),
      e = me;
    if (!v || !e) return;
    const k = map.clientWidth / (e[2] - e[0]),
      x = Math.max(0, (v[0] - e[0]) * k),
      y = Math.max(0, (v[1] - e[1]) * k),
      x2 = Math.min(map.clientWidth, (v[0] + v[2] - e[0]) * k),
      y2 = Math.min(map.clientHeight, (v[1] + v[3] - e[1]) * k);
    Object.assign(win.style, { left: x + 'px', top: y + 'px', width: Math.max(4, x2 - x) + 'px', height: Math.max(4, y2 - y) + 'px' });
  }
  /* tap = zoom 2× there (or move there when already zoomed in); drag = move */
  let drag = null;
  const at = ev => {
    const q = map.getBoundingClientRect(),
      e = me,
      k = (e[2] - e[0]) / q.width;
    return [e[0] + (ev.clientX - q.left) * k, e[1] + (ev.clientY - q.top) * k];
  };
  const centre = (p, zoom) => {
    const v = view(),
      e = me,
      r = box();
    if (!v || !e || !r) return;
    let w = v[2],
      h = v[3];
    if (zoom) {
      w = Math.min(w, (e[2] - e[0]) / 2);
      h = (w * r.height) / r.width;
    }
    setView([p[0] - w / 2, p[1] - h / 2, w, h]);
    placeMap();
  };
  map.addEventListener('pointerdown', ev => {
    if (!me) return;
    ev.preventDefault();
    ev.stopPropagation();
    drag = { x: ev.clientX, y: ev.clientY, m: false };
    try {
      map.setPointerCapture(ev.pointerId);
    } catch (x) {}
  });
  map.addEventListener('pointermove', ev => {
    if (!drag) return;
    if (!drag.m && Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 4) return;
    drag.m = true;
    centre(at(ev), false);
  });
  map.addEventListener('pointerup', ev => {
    if (drag && !drag.m) centre(at(ev), !zoomedIn());
    drag = null;
  });
  ['click', 'dblclick', 'wheel'].forEach(t => map.addEventListener(t, ev => ev.stopPropagation()));
  /* ---------- buttons on the drawing corner (next to Fit / Zoom) ---------- */
  const B = (txt, title, on) => {
    const b = document.createElement('button');
    b.textContent = txt;
    b.title = title;
    b.onclick = on;
    return b;
  };
  const bW = B('Width', 'Fit the width of the sheet, from the top (drag or scroll down for the rest)', fitWidth),
    bF = B('⛶ Focus', 'Focus: the drawing takes the whole page; ☰ Sheets and Panel open over it (key Shift+F)', () => setFocus(!focus));
  bW.className = 'lo-w';
  bF.className = 'lo-f';
  function paint() {
    bF.classList.toggle('on', focus);
    bF.textContent = focus ? '⛶ Exit focus' : '⛶ Focus';
  }
  const mount = () => {
    /* 3.2.0-beta.1: the 3.1 shell has no #lotools; Width and Focus go on the floating zoom bar (#zbar) of the drawing */
    const z = $('zbar');
    if (z) {
      z.append(bW, bF);
      return true;
    }
    const t = $('lotools');
    if (!t) return false;
    t.append(Object.assign(document.createElement('div'), { className: 'lo-vw' }));
    t.lastChild.append(bW, bF);
    return true;
  };
  if (!mount()) {
    const iv = setInterval(() => mount() && clearInterval(iv), 200);
  }
  /* the old Fit of the DITL page also used the loose texts around the frame: Fit = the frame (A) */
  const df = $('bfit');
  if (df)
    df.addEventListener('click', () => {
      setTimeout(fitAll, 0);
    });
  /* key Shift+F = Focus on / off (F alone stays Fit on the ABC page). Capture on window, as the ABC page
     listens there and stops the key for the rest of the page. */
  addEventListener(
    'keydown',
    ev => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || document.body.dataset.tab !== 'logic') return;
      const a = document.activeElement;
      if (a && (/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) || a.isContentEditable)) return;
      if (ev.shiftKey && (ev.key === 'F' || ev.key === 'f')) setFocus(!focus);
    },
    true
  );
  /* the view rectangle follows every change of the view (wheel, pinch, drag, Fit, Zoom, page link) */
  const svg = $('svg');
  if (svg && window.MutationObserver) new MutationObserver(() => placeMap()).observe(svg, { attributes: true, attributeFilter: ['viewBox'] });
  setInterval(placeMap, 400);
  addEventListener('resize', placeMap);
  if (focus) setFocus(true);
  else paint();
  window.LOVIEW = { setFocus, fitAll, fitWidth, ext, dext, view, map: () => map };
})();
