/* COMPACT SHELL, step 3 (user 2026-11-17, approved mockup "Compact App Shell"; "Bakit di katulad s mockup?"): the parts of the mockup
   that need a few elements of their own. Shell only: nothing here reads or writes the logic, the plant model or a drawing.
   - the newest standing alarm as ONE line above the status line, with the count and "Open list" (the alarm list of shellc-home.js);
   - the unit name at the left of the tool bar;
   - the values on top grouped as the mockup shows them (Main steam: pressure, temperature, flow; Reheat steam: pressure, temperature):
     the cell keeps its full name as its tooltip;
   - the Process / Controls / Trends of a realistic plant page as one selector in the tool bar (its own header is hidden by
     shellc-compact.css). */
(function () {
  const B = document.body;
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
  const SHORT = {
    'Main steam pressure': 'Main steam',
    'Main steam temperature': '',
    'Main steam flow': '',
    'Reheat steam pressure': 'Reheat steam',
    'Reheat steam temperature': '',
    'Bed temperature': 'Bed',
    'Furnace pressure': 'Furnace',
    'Total coal flow': 'Coal',
    'Total air flow': 'Air'
  };
  let strip = null,
    sTime = null,
    sText = null,
    sAck = null,
    sCount = null,
    sDot = null,
    view = null,
    sig = '';
  const fmtT = t => {
    if (t == null) return '';
    if (!isFinite(+t)) return String(t); /* already a clock text */
    const s = Math.max(0, Math.round(+t)),
      h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60),
      c = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(c).padStart(2, '0');
  };
  function build() {
    const foot = document.getElementById('sfoot'),
      ctx = document.getElementById('scctx');
    if (!foot || !ctx) return false;
    if (!strip) {
      strip = E('div');
      strip.id = 'scastrip';
      strip.setAttribute('role', 'status');
      strip.setAttribute('aria-label', 'Newest standing alarm');
      sDot = E('span', 'dot');
      sTime = E('span', 't');
      sText = E('span', 'x');
      sAck = E('span', 'k');
      sCount = E('span', 'n');
      const open = E('button', 'o', 'Open list');
      open.type = 'button';
      open.title = 'The alarm list with Acknowledge and the Events';
      open.onclick = () => call(() => window.lsShellC.openAl('alarms'));
      strip.append(sDot, sTime, sText, sAck, E('span', 'sp'), sCount, open);
      foot.prepend(strip);
    }
    if (!ctx.querySelector('.scunit')) {
      const u = E('span', 'scunit', 'LMYP Unit 1');
      u.title = 'Unit 1: 460 t/h circulating fluidized bed boiler, 150 MW';
      ctx.prepend(u);
    }
    for (const c of document.querySelectorAll('#scstrip .scv .sck')) {
      const i = c.querySelector('i');
      if (!i || i.dataset.full) continue;
      const full = i.textContent;
      i.dataset.full = full;
      if (full in SHORT) {
        i.textContent = SHORT[full];
        if (!SHORT[full]) c.classList.add('scgrp');
      }
    }
    return true;
  }
  /* the views of a realistic plant page (hx-core.js: .hx-tabs buttons) as one selector in the page bar */
  function syncView() {
    const tabs = [...document.querySelectorAll('#plsvg .hx-app .hx-tabs button')],
      bar = document.querySelector('#plantws .plbar');
    if (!tabs.length || !bar) {
      if (view) view.hidden = true;
      return;
    }
    if (!view) {
      view = E('select', 'scview');
      view.id = 'scview';
      view.title = 'What this plant page shows: the process picture, its controllers, or its trends';
      view.setAttribute('aria-label', 'View of this plant page');
      view.onchange = () => {
        const b = [...document.querySelectorAll('#plsvg .hx-app .hx-tabs button')].find(
          x => x.textContent.trim() === view.value
        );
        if (b) b.click();
      };
    }
    if (view.parentElement !== bar) bar.append(view);
    view.hidden = false;
    const names = tabs.map(b => b.textContent.trim()).join('|');
    if (view.dataset.n !== names) {
      view.dataset.n = names;
      view.textContent = '';
      for (const b of tabs) view.append(new Option(b.textContent.trim()));
    }
    const on = tabs.find(b => b.getAttribute('aria-selected') === 'true');
    if (on && document.activeElement !== view) view.value = on.textContent.trim();
  }
  function tick() {
    if (!B.classList.contains('sc')) return;
    if (!build()) return;
    syncView();
    const L = call(() => window.lsActiveAlarms().list, []) || [];
    const fresh = L.filter(a => !a.ack),
      top = fresh[0] || L[0] || null;
    const k = L.length + '|' + fresh.length + '|' + (top ? top.text + top.t + top.ack : '');
    if (k === sig) return;
    sig = k;
    strip.className = !top ? 'none' : fresh.length ? 'new' : 'ack';
    sTime.textContent = top ? fmtT(top.t) : '';
    sText.textContent = top ? top.text : 'No standing alarm';
    sAck.textContent = top && top.ack ? 'acknowledged' : '';
    sCount.textContent = L.length
      ? L.length + ' standing alarm' + (L.length === 1 ? '' : 's') + (fresh.length ? ' · ' + fresh.length + ' new' : '')
      : '';
  }
  setInterval(tick, 1000);
  addEventListener('load', tick);
})();
