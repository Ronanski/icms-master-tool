/* ===== RE-SHELL LAYOUT C, slice 3 of the redesign (user approved "two bars, one Details column", 2026-11-09 "Gawin na"; artifact
   DMAqPXBECUGeEShYRB2QX8; PLAN.md step 5 "frame zoom", shell standard S1). Since beta.266 a page opens at Fit (the whole page, Mina 263);
   the Readable size button of the locator brings the READABLE size, its drawing text
   about 12 px on screen, anchored at the top left of the drawing where the process starts. Fit in the bar shows the whole page.
   A small locator at the lower right of the page shows which part is in view: click or drag in it to move there; at Fit it is a
   "Readable size" button. In the Engineer the plant pane fills its height (beta.254).
   No drawing code changes: the zoom and the move are the page's own wheel zoom and drag (plant.js, pan and zoom), pressed here. ===== */
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
  const NS = 'http://www.w3.org/2000/svg';
  const S = (t, a) => {
    const e = document.createElementNS(NS, t);
    for (const k in a) e.setAttribute(k, a[k]);
    return e;
  };
  const READ = 12; /* px of drawing text on screen (MEASURE_STANDARD S1) */
  /* Engineer (Jennie's finding on beta.247, user 2026-11-09): the plant page beside the sheet was fitted whole in a tall narrow pane,
     a third of its height with white space around; there it fills the height of the pane (or the readable size if that is less),
     from the top left, and the locator moves along the rest */
  const eng = () => B.classList.contains('sceng');
  const on = () =>
    B.classList.contains('sc') &&
    !B.classList.contains('pvout') &&
    (eng() ? B.classList.contains('scet-logic') && !B.classList.contains('scenopl') : B.dataset.tab === 'operate' && !B.classList.contains('scov'));
  const svg = () => $('plsvg');
  function view() {
    const s = svg();
    if (!s || !s.getClientRects().length) return null;
    const vb = s.viewBox && s.viewBox.baseVal,
      r = s.getBoundingClientRect();
    if (!vb || !vb.width || !r.width || !r.height) return null;
    const k = Math.min(r.width / vb.width, r.height / vb.height);
    return { s, vb, r, k, w: r.width / k, h: r.height / k };
  }
  /* the text size of the drawing (user units): the middle of the sizes of its text */
  let fzKey = '',
    fz = 12.5;
  function textSize(s) {
    const key = (document.querySelector('#plantws .plpick') || {}).value + '|' + s.childElementCount;
    if (key === fzKey) return fz;
    const L = [];
    for (const t of s.querySelectorAll('text')) {
      if (L.length > 600) break;
      const v = parseFloat(getComputedStyle(t).fontSize);
      if (v > 2 && v < 80) L.push(v);
    }
    L.sort((a, b) => a - b);
    fzKey = key;
    fz = L.length ? L[L.length >> 1] : 12.5;
    return fz;
  }
  /* the drawing's own extent (user units) */
  function extent(s) {
    try {
      const b = s.getBBox();
      if (b.width > 0 && b.height > 0) return b;
    } catch (e) {}
    return null;
  }
  const need = v => {
    const k = READ / textSize(v.s);
    if (!eng()) return k;
    const b = extent(v.s);
    return b ? Math.min(k, v.r.height / b.height) : k;
  };
  const readable = v => v.k >= need(v) * 0.97;

  /* the page's own wheel zoom, around the top left of the drawing */
  function toReadable() {
    const v = view();
    if (!v || readable(v)) return;
    const b = extent(v.s) || { x: v.vb.x, y: v.vb.y },
      x = Math.min(v.r.right - 2, Math.max(v.r.left + 2, v.r.left + (b.x - v.vb.x) * v.k)),
      y = Math.min(v.r.bottom - 2, Math.max(v.r.top + 2, v.r.top + (b.y - v.vb.y) * v.k)),
      n = Math.min(12, Math.ceil(Math.log(need(v) / v.k) / Math.log(1.15)));
    for (let i = 0; i < n; i++) v.s.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    /* the view starts at the drawing's top left (the fit of the page can leave an empty band above it) */
    const w = view(),
      e = w && extent(w.s);
    if (w && e) pan((inside(w.vb.x, w.w, e.x, e.width) - w.vb.x) * w.k, (inside(w.vb.y, w.h, e.y, e.height) - w.vb.y) * w.k);
  }
  /* the start of a view of length w that stays inside lo .. lo + len (centred when the page is smaller than the view) */
  const inside = (x, w, lo, len) => (w >= len ? lo + (len - w) / 2 : Math.min(Math.max(x, lo), lo + len - w));
  /* the page's own drag: moves the view by dx, dy screen px (a click ends it, so the next real click is not taken as a drag end) */
  function pan(dx, dy) {
    const v = view();
    if (!v || Math.hypot(dx, dy) < 8) return;
    const x = v.r.left + v.r.width / 2,
      y = v.r.top + v.r.height / 2,
      o = { bubbles: true, cancelable: true, pointerId: 91, pointerType: 'mouse', isPrimary: true, button: 0 };
    v.s.dispatchEvent(new PointerEvent('pointerdown', { ...o, buttons: 1, clientX: x, clientY: y }));
    v.s.dispatchEvent(new PointerEvent('pointermove', { ...o, buttons: 1, clientX: x - dx, clientY: y - dy }));
    v.s.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0, clientX: x - dx, clientY: y - dy }));
    v.s.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x - dx, clientY: y - dy }));
  }

  /* ---------- the locator ---------- */
  let box = null,
    map = null,
    pg = null,
    vr = null,
    rb = null;
  function build() {
    box = E('div');
    box.id = 'sczoom';
    box.setAttribute('aria-label', 'Where you are on the page');
    map = S('svg', { class: 'sczmap', role: 'img', 'aria-label': 'Locator: the blue box is the part of the page in view. Click or drag to move.' });
    pg = S('rect', { class: 'sczpg' });
    vr = S('rect', { class: 'sczvr' });
    map.append(pg, vr);
    rb = E('button', 'sczrb', 'Readable size');
    rb.type = 'button';
    rb.title = 'Zoom in until the drawing text is readable (about 12 px), from the top left of the page; Fit shows the whole page again';
    rb.onclick = () => toReadable();
    box.append(map, rb);
    document.body.append(box);
    let down = false;
    const go = e => {
      const v = view(),
        b = v && extent(v.s);
      if (!v || !b) return;
      const m = map.getBoundingClientRect(),
        ux = b.x + ((e.clientX - m.left) / m.width) * b.width,
        uy = b.y + ((e.clientY - m.top) / m.height) * b.height,
        /* the view is centred on the point, but stays inside the page (no empty margin at a corner) */
        x0 = inside(ux - v.w / 2, v.w, b.x, b.width),
        y0 = inside(uy - v.h / 2, v.h, b.y, b.height);
      pan((x0 - v.vb.x) * v.k, (y0 - v.vb.y) * v.k);
    };
    map.addEventListener('pointerdown', e => {
      down = true;
      try {
        map.setPointerCapture(e.pointerId);
      } catch (x) {}
      go(e);
    });
    map.addEventListener('pointermove', e => down && go(e));
    map.addEventListener('pointerup', () => (down = false));
    map.addEventListener('pointercancel', () => (down = false));
  }
  function paint() {
    const v = on() && view(),
      b = v && extent(v.s);
    const show = !!(v && b);
    B.classList.toggle('sczon', show);
    if (!show) return;
    const rd = readable(v),
      whole = v.vb.x <= b.x + 1 && v.vb.y <= b.y + 1 && v.vb.x + v.w >= b.x + b.width - 1 && v.vb.y + v.h >= b.y + b.height - 1;
    box.classList.toggle('map', !whole);
    rb.hidden = rd;
    /* the map: 168 px wide, the page's shape, at most 112 px high */
    const W = Math.min(168, (112 * b.width) / b.height),
      H = (W * b.height) / b.width;
    map.setAttribute('width', Math.round(W));
    map.setAttribute('height', Math.round(H));
    map.setAttribute('viewBox', [b.x, b.y, b.width, b.height].join(' '));
    pg.setAttribute('x', b.x);
    pg.setAttribute('y', b.y);
    pg.setAttribute('width', b.width);
    pg.setAttribute('height', b.height);
    const x0 = Math.max(b.x, v.vb.x),
      y0 = Math.max(b.y, v.vb.y),
      x1 = Math.min(b.x + b.width, v.vb.x + v.w),
      y1 = Math.min(b.y + b.height, v.vb.y + v.h);
    vr.setAttribute('x', x0);
    vr.setAttribute('y', y0);
    vr.setAttribute('width', Math.max(0, x1 - x0));
    vr.setAttribute('height', Math.max(0, y1 - y0));
    /* at the lower right of the page, above the footer */
    const m = $('plmid'),
      R = m ? m.getBoundingClientRect() : v.r;
    box.style.right = Math.round(innerWidth - R.right + 12) + 'px';
    box.style.bottom = Math.round(innerHeight - R.bottom + 12) + 'px';
  }

  /* a page that opens (the picker, a breadcrumb, a step of the Training, the first page while the plant loads) is at the readable size
     once it is drawn, and again after the page draws or fits itself (live Beta 250: the first page fitted itself at the end of the
     20 s load and stayed small). It stops as soon as the operator zooms, drags or presses Fit (a real press, not the ones of this
     file), and after 3 presses in a row that did not make it readable */
  let lastPg = '',
    auto = false,
    tries = 0;
  const mine = e => !e.isTrusted;
  addEventListener(
    'wheel',
    e => {
      if (!mine(e) && e.target.closest && e.target.closest('#plsvg')) auto = false;
    },
    true
  );
  /* a drag of the page (a real move with the button held), not a click on a valve or pump (Mina b254: a click did not zoom, but the
     next refit of the page went to Fit) */
  addEventListener(
    'pointermove',
    e => {
      if (!mine(e) && e.buttons && e.target.closest && e.target.closest('#plsvg')) auto = false;
    },
    true
  );
  addEventListener(
    'click',
    e => {
      if (mine(e) || !e.target.closest) return;
      /* Fit = the operator wants the whole page; "Readable size" = keep the readable size through the next refits (Mina b254: closing
         or opening the Details column refitted the page to Fit after a press of Readable size) */
      if (e.target.closest('#sczoom .sczrb')) {
        auto = true;
        tries = 0;
      } else if (e.target.closest('#plantws .plbar button')) auto = false;
    },
    true
  );
  function tick() {
    if (!box) build();
    const pk = document.querySelector('#plantws .plpick'),
      id = pk ? pk.value : '';
    if (!on()) lastPg = '';
    else if (id !== lastPg) {
      /* Giselle beta.266 (Jennie, Mina's live check of 263: a page opened from the overview was zoomed in, 2.5x at 1024, right and bottom
         cut): a page opens at Fit, the whole page, as the Fit button does; the Readable size button of the locator zooms in */
      lastPg = id;
      auto = false;
      tries = 0;
      fitSoon();
    }
    const v = on() && auto && view();
    /* tries counts the presses that did not make it readable in a row (a readable view resets it) */
    if (v && readable(v)) tries = 0;
    else if (v && v.s.childElementCount && tries < 3) {
      tries++;
      toReadable();
    }
    paint();
  }
  /* the Fit of the bar (plant.js lsPlantFit: the page's own fit), once the page is drawn and once more for a page drawn late */
  let ft = 0,
    ft2 = 0;
  function fitSoon() {
    clearTimeout(ft);
    clearTimeout(ft2);
    const f = () => {
      try {
        if (on() && !auto && window.lsPlantFit) lsPlantFit();
      } catch (e) {}
    };
    ft = setTimeout(f, 250);
    ft2 = setTimeout(f, 900);
  }
  /* the page area changed (the Details column opened or closed, the window resized): Fit again, unless Readable size was pressed */
  addEventListener('resize', () => on() && !auto && fitSoon());
  const iv = setInterval(() => {
    if (!B.classList.contains('scbars')) return;
    clearInterval(iv);
    setInterval(tick, 300);
    tick();
  }, 300);
  window.lsShellC = Object.assign(window.lsShellC || {}, { readable: toReadable });
})();
