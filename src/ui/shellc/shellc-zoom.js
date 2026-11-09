/* ===== RE-SHELL LAYOUT C, slice 3 of the redesign (user approved "two bars, one Details column", 2026-11-09 "Gawin na"; artifact
   DMAqPXBECUGeEShYRB2QX8; PLAN.md step 5 "frame zoom", shell standard S1): a plant page opens at a READABLE size, its drawing text
   about 12 px on screen, anchored at the top left of the drawing where the process starts. Fit in the bar shows the whole page.
   A small locator at the lower right of the page shows which part is in view: click or drag in it to move there; at Fit it is a
   "Readable size" button. Operator mode only (the plant pane of the Engineer keeps Fit).
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
  const on = () => B.classList.contains('sc') && B.dataset.tab === 'operate' && !B.classList.contains('sceng') && !B.classList.contains('scov') && !B.classList.contains('pvout');
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
  const need = v => READ / textSize(v.s);
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

  /* a page that opens (the picker, a breadcrumb, a step of the Training) opens at the readable size once it is drawn */
  let lastPg = '',
    lastN = -1,
    t0 = 0;
  function tick() {
    if (!box) build();
    const pk = document.querySelector('#plantws .plpick'),
      s = svg(),
      id = pk ? pk.value : '',
      n = s ? s.childElementCount : -1;
    if (on() && (id !== lastPg || n !== lastN)) {
      if (id !== lastPg) t0 = Date.now();
      lastPg = id;
      lastN = n;
      /* the page draws and fits itself first (plant.js draw / fit) */
      if (Date.now() - t0 < 3000) setTimeout(toReadable, 250);
    }
    if (!on()) lastPg = '';
    paint();
  }
  const iv = setInterval(() => {
    if (!B.classList.contains('scbars')) return;
    clearInterval(iv);
    setInterval(tick, 300);
    tick();
  }, 300);
  window.lsShellC = Object.assign(window.lsShellC || {}, { readable: toReadable });
})();
