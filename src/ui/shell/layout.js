/* 3.2.0-beta.1: what is left of the 2.4.1-beta.7 LOGIC layout. The 3.1 shell has its own VIEW | RUN switch, ribbon and ABC
   Inspector, so the top bar part and the ABC tabs are gone. Kept: the DITL right panel tabs (2.5.0-beta.13, user "same function
   sa ABC ang DITL"): Selected / Inputs / Timers / Valves / Outputs. Only hides list sections; no handler, engine or drawing change. */
(() => {
  const $ = id => document.getElementById(id),
    E = (t, a = {}, k = []) => {
      const e = document.createElement(t);
      for (const x in a) x === 'txt' ? (e.textContent = a[x]) : x === 'cls' ? (e.className = a[x]) : x === 'on' ? (e.onclick = a[x]) : e.setAttribute(x, a[x]);
      k.forEach(c => c && e.append(c));
      return e;
    };
  /* ---- right panel with tabs ---- */
  const TABS = {
    di: [
      ['sel', 'Selected'],
      ['in', 'Inputs'],
      ['tm', 'Timers'],
      ['mv', 'Valves'],
      ['out', 'Outputs']
    ]
  };
  const kindDi = s => (/^Inputs|^Analog/i.test(s) ? 'in' : /^Timers/i.test(s) ? 'tm' : /^Valves|^Motor/i.test(s) ? 'mv' : 'out');
  let curDi = 'in';
  try {
    curDi = localStorage.getItem('lo.di') || 'in';
  } catch (e) {}
  const save = () => {
    try {
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
  function tagDi() {
    const p = $('dp');
    if (!p) return;
    let k = 'in';
    [...p.children].forEach(c => {
      if (c.classList.contains('dp-h')) k = kindDi(c.textContent.trim());
      if (c.classList.contains('dp-top') || c.classList.contains('lo-tabs')) return;
      const v = c.classList.contains('dp-sel') ? 'sel' : c.classList.contains('dp-note') ? 'note' : k;
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
  window.LO = { setAn: () => {}, setDi: k => ((curDi = k), tagDi()) };
  let n = 0;
  const iv = setInterval(() => {
    try {
      if (watch('dp', tagDi) || ++n > 240) clearInterval(iv);
    } catch (e) {
      if (++n > 240) clearInterval(iv);
    }
  }, 250);
})();
