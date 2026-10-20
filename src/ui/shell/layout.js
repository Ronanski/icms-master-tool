/* 2.4.1-beta.7 LOGIC page layout (user approved the proposal "Lahat", 2026-10-19): the same buttons, moved and grouped.
   Top bar = [VIEW | Run] ▶▶ ⏱ menu; Fit / Zoom / Values / Wire / Back on the corner of the drawing; right panel with tabs
   (ABC: Selected / Inputs / Timers / Controllers / Forced / Operator, DITL: Inputs / Timers / Valves / Outputs).
   Only places elements and hides list sections; no handler, engine, simulation or drawing change. */
(() => {
  const $ = id => document.getElementById(id),
    E = (t, a = {}, k = []) => {
      const e = document.createElement(t);
      for (const x in a) x === 'txt' ? (e.textContent = a[x]) : x === 'cls' ? (e.className = a[x]) : x === 'on' ? (e.onclick = a[x]) : e.setAttribute(x, a[x]);
      k.forEach(c => c && e.append(c));
      return e;
    };
  const kids = g => [...g.querySelectorAll('button,select')];
  const byTxt = (g, re) => kids(g).find(x => re.test(x.textContent.trim()));
  /* ⏱ menu: step back, step size, speed, start again */
  function pop(items, title) {
    const b = E('button', { cls: 'lo-tm', txt: '⏱ ▾', title }),
      m = E('div', { cls: 'lo-pop' });
    items.forEach(([h, el]) => el && m.append(E('div', { cls: 'lo-row' }, [E('span', { txt: h }), el])));
    document.body.append(m);
    b.onclick = e => {
      e.stopPropagation();
      const r = b.getBoundingClientRect();
      m.style.left = Math.max(4, Math.min(r.left, innerWidth - 250)) + 'px';
      m.style.top = r.bottom + 6 + 'px';
      m.classList.toggle('open');
    };
    document.addEventListener('click', e => !m.contains(e.target) && e.target !== b && m.classList.remove('open'));
    return b;
  }
  function bar() {
    const gs = document.querySelector('#gsbar .tbar'),
      gRun = gs && gs.querySelector('.g-run'),
      gView = gs && gs.querySelector('.g-view'),
      gDitl = gs && gs.querySelector('.g-ditl');
    if (!gRun || !gView || !gDitl || !gDitl.querySelector('.dui-run')) return false;
    document.body.classList.add('lo');
    /* ABC */
    {
      const run = byTxt(gRun, /Run|Pause/),
        view = byTxt(gRun, /^View$/),
        back = byTxt(gRun, /^◀◀|Back/),
        next = byTxt(gRun, /^▶▶|Next/),
        sels = gRun.querySelectorAll('select'),
        reset = byTxt(gRun, /^Reset$/);
      if (view) view.textContent = 'VIEW';
      gRun.prepend(E('div', { cls: 'lo-seg' }, [view, run]), next, pop([['Step back', back], ['Step size', sels[0]], ['Speed', sels[1]], ['Start again', reset]], 'Step back, step size, speed, start again'));
    }
    /* DITL */
    const dz = byTxt(gDitl, /^Zoom$/),
      dpn = byTxt(gDitl, /^Panel$/);
    {
      /* 2.5.0-beta.9: DITL = [VIEW | SIMULATE] Reset (no step, no ⏱ menu) */
      const run = gDitl.querySelector('.dui-run'),
        view = byTxt(gDitl, /^View$/);
      if (view) view.textContent = 'VIEW';
      gDitl.prepend(E('div', { cls: 'lo-seg' }, [view, run]));
      gDitl.querySelectorAll('.dui-sep').forEach(x => x.remove());
    }
    /* drawing tools on the corner of the drawing */
    const tools = E('div', { id: 'lotools' }),
      fit = byTxt(gView, /^Fit|^⤢/),
      zoom = byTxt(gView, /^Zoom$/),
      values = byTxt(gView, /^Values$/),
      wire = byTxt(gView, /^Wire/),
      xback = byTxt(gView, /^↩/),
      panel = byTxt(gView, /^Panel$/),
      dfit = $('bfit');
    if (fit) fit.textContent = 'Fit';
    /* Panel: shows / hides the right panel of the page in view (the old top bar Panel buttons, hidden, do the work) */
    const pnl = E('button', {
      cls: 'lo-pnl',
      txt: 'Panel',
      title: 'Show / hide the right panel',
      on: () => {
        const b = document.body.classList.contains('an') ? panel : dpn;
        if (b) b.click();
        setTimeout(place, 50);
      }
    });
    tools.append(E('div', { cls: 'lo-an' }, [xback, fit, zoom, values, wire]), E('div', { cls: 'lo-di' }, [dfit, dz]));
    /* 2.4.1-beta.9 (user could not find it on the drawing): Panel is in the top bar, next to ⏱ */
    gDitl.after(E('div', { cls: 'tb lo-pg' }, [pnl]));
    document.body.append(tools);
    [panel, dpn].forEach(x => x && x.classList.add('lo-gone'));
    gView.classList.add('lo-gone');
    const place = () => {
      const cv = $('cv'),
        r = cv && cv.getBoundingClientRect();
      if (!r || !r.width || document.body.dataset.tab !== 'logic') return (tools.style.display = 'none');
      tools.style.display = 'flex';
      {
        const an = document.body.classList.contains('an'),
          a = $('anp'),
          o = $('opp'),
          d = $('dp'),
          open = an ? (a && !a.classList.contains('min')) || (o && o.offsetWidth > 0) : !!(d && d.offsetWidth > 0);
        pnl.classList.toggle('on', !!open);
      }
      let right = r.right;
      for (const p of [$('anp'), $('opp'), $('dp')]) {
        const q = p && p.offsetParent && p.getBoundingClientRect();
        if (q && q.width && q.width < r.width * 0.9 && q.left < right && q.left > r.left) right = q.left;
      }
      tools.style.left = Math.max(r.left + 4, right - tools.offsetWidth - 12) + 'px';
      tools.style.top = r.top + 12 + 'px';
    };
    setInterval(place, 250);
    addEventListener('resize', place);
    place();
    return true;
  }
  /* ---- right panel with tabs ---- */
  const TABS = {
    an: [
      ['sel', 'Selected'],
      ['in', 'Inputs'],
      ['tm', 'Timers'],
      ['pid', 'Controllers'],
      ['frc', 'Forced'],
      ['op', 'Operator']
    ],
    di: [
      ['in', 'Inputs'],
      ['tm', 'Timers'],
      ['mv', 'Valves'],
      ['out', 'Outputs']
    ]
  };
  const kindAn = s => (/^Digital|^Analog|^Setpoints/i.test(s) ? 'in' : /^Timers/i.test(s) ? 'tm' : /^Controllers/i.test(s) ? 'pid' : 'frc');
  const kindDi = s => (/^Inputs|^Analog/i.test(s) ? 'in' : /^Timers/i.test(s) ? 'tm' : /^Valves|^Motor/i.test(s) ? 'mv' : 'out');
  let curAn = 'sel',
    curDi = 'in';
  try {
    curAn = localStorage.getItem('lo.an') || 'sel';
    curDi = localStorage.getItem('lo.di') || 'in';
  } catch (e) {}
  if (curAn === 'op') curAn = 'sel';
  const save = () => {
    try {
      localStorage.setItem('lo.an', curAn);
      localStorage.setItem('lo.di', curDi);
    } catch (e) {}
  };
  function strip(p, list, cur, set) {
    let s = p.querySelector(':scope > .lo-tabs');
    if (!s) {
      s = E('div', { cls: 'lo-tabs' });
      const ref = p.querySelector(':scope > .ph, :scope > .dp-top');
      ref ? ref.after(s) : p.prepend(s);
    }
    if (s.dataset.cur === cur) return;
    s.dataset.cur = cur;
    s.innerHTML = '';
    list.forEach(([k, l]) => s.append(E('button', { cls: k === cur ? 'on' : '', txt: l, 'data-k': k, on: () => set(k) })));
  }
  function tagAn() {
    const p = $('anp');
    if (!p) return;
    p.querySelectorAll('#anlists > details').forEach(d => {
      const k = kindAn((d.querySelector('summary') || d).textContent.trim());
      if (d.dataset.k !== k) d.dataset.k = k;
      if (!d.open) d.open = true;
    });
    if (p.dataset.pt !== curAn) p.dataset.pt = curAn;
    strip(p, TABS.an, curAn, k => {
      if (k === 'op') {
        /* the operator faceplate view (src/ui/hmi/hmi.js); its own Details tab comes back here */
        const b = byTxt(p.querySelector('.hmitabs') || p, /^Operator$/);
        if (b) b.click();
        return;
      }
      curAn = k;
      save();
      tagAn();
      p.scrollTop = 0;
    });
  }
  function tagDi() {
    const p = $('dp');
    if (!p) return;
    let k = 'in';
    [...p.children].forEach(c => {
      if (c.classList.contains('dp-h')) k = kindDi(c.textContent.trim());
      if (c.classList.contains('dp-top') || c.classList.contains('lo-tabs')) return;
      const v = c.classList.contains('dp-note') ? 'note' : k;
      if (c.dataset.k !== v) c.dataset.k = v;
    });
    if (p.dataset.pt !== curDi) p.dataset.pt = curDi;
    strip(p, TABS.di, curDi, k2 => {
      curDi = k2;
      save();
      tagDi();
      p.scrollTop = 0;
    });
  }
  const watched = new Set();
  function watch(id, f) {
    const p = $(id);
    if (!p || watched.has(id)) return !!p;
    watched.add(id);
    let busy = false;
    new MutationObserver(() => {
      if (busy) return;
      busy = true;
      requestAnimationFrame(() => {
        f();
        busy = false;
      });
    }).observe(p, { childList: true, subtree: true });
    f();
    return true;
  }
  /* a click on a block or a wire shows the Selected tab */
  document.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('#cv') && document.body.classList.contains('an') && curAn !== 'sel') {
      curAn = 'sel';
      save();
      setTimeout(tagAn, 30);
    }
  });
  window.LO = { setAn: k => ((curAn = k), tagAn()), setDi: k => ((curDi = k), tagDi()) };
  let n = 0,
    done = false;
  const iv = setInterval(() => {
    try {
      if (!done) done = bar();
      const a = watch('anp', tagAn),
        d = watch('dp', tagDi);
      if ((done && a && d) || ++n > 240) clearInterval(iv);
    } catch (e) {
      if (++n > 240) clearInterval(iv);
    }
  }, 250);
})();
