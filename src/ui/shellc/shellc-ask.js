/* ===== RE-SHELL LAYOUT C: one confirmation dialog for the presses that replace or change the running plant (user 2026-11-09
   "Wala ba mga user confirmation dialog mga buttons dyan"). Only with ?shell=c (body.sc). The dialog only stops the click and,
   on Yes, presses the same button again: nothing here touches the logic, the plant model or the engine.
   Standard: Nielsen #5 error prevention, Material 3 dialogs (title = the question, text = what happens, the verb on the button,
   Cancel first and focused). The faceplate START / STOP / OPEN / CLOSE keep their own question (fp-pop.js ask). ===== */
/* Layout C is the DEFAULT layout from beta.254 (user 2026-11-09 "Gawin na": build the redesign, then make it the default). This is the
   first shell script, so it decides for all of them: ?shell=old or the start screen "Old layout" keeps the old layout (ls-shell = old),
   ?shell=c brings C back; with nothing stored the app opens in C. */
(function () {
  try {
    const q = new URLSearchParams(location.search).get('shell');
    if (q === 'old') localStorage.setItem('ls-shell', 'old');
    else if (q === 'c' || localStorage.getItem('ls-shell') !== 'old') localStorage.setItem('ls-shell', 'c');
  } catch (e) {}
})();
/* Proportional shell (user 2026-11-09 "Bakit dependent sa resolution? ... Scalable? Proportional?"): --scs = the screen against a
   1366 px wide laptop (height against 640 px, a laptop browser window; the smaller ratio wins), kept between 0.9 and 1.5. shellc-dense.css multiplies its sizes by it, so
   the bars, buttons and text look the same on a tablet, a laptop, a large monitor or a TV. The drawings already scale with Fit. */
(function () {
  const set = () => {
    const s = Math.min(1.5, Math.max(0.9, Math.min(innerWidth / 1366, innerHeight / 640)));
    document.documentElement.style.setProperty('--scs', s.toFixed(3));
  };
  set();
  addEventListener('resize', set);
})();
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
  let box = null,
    pend = null,
    back = null;
  function make() {
    box = E('div', 'scask');
    box.hidden = true;
    const card = E('div', 'scaskc');
    card.setAttribute('role', 'alertdialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'scaskq');
    card.setAttribute('aria-describedby', 'scaskt');
    const q = E('h3', '', '');
    q.id = 'scaskq';
    const t = E('p', '', '');
    t.id = 'scaskt';
    const row = E('div', 'scaskb');
    const no = E('button', 'scno', 'Cancel');
    /* not class go: the old app paints button.go blue through an id selector (app.css body.app2 :is(... button.go ...)), Mina beta.244 */
    const go = E('button', 'scok', 'Yes');
    no.type = go.type = 'button';
    row.append(no, go);
    const inp = E('input', 'scaski');
    inp.type = 'text';
    inp.setAttribute('aria-labelledby', 'scaskq');
    inp.hidden = true;
    card.append(q, t, inp, row);
    box.append(card);
    document.body.append(box);
    const done = ok => {
      const p = pend;
      pend = null;
      box.hidden = true;
      if (back && back.focus) back.focus();
      if (p) p(ok);
    };
    no.onclick = () => done(false);
    go.onclick = () => done(true);
    box.addEventListener('mousedown', e => e.target === box && done(false));
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') (e.preventDefault(), done(true));
    });
    /* Mina beta.244: Esc never reached the dialog (a page handler stops it first); the dialog listens first, on the window, while open */
    addEventListener('keydown', e => {
      if (box.hidden) return;
      if (e.key === 'Escape') (e.preventDefault(), e.stopImmediatePropagation(), done(false));
      if (e.key === 'Tab') {
        e.preventDefault();
        const L = (inp.hidden ? [] : [inp]).concat(no, go);
        L[(L.indexOf(document.activeElement) + (e.shiftKey ? L.length - 1 : 1)) % L.length].focus();
      }
    }, true);
    box._q = q;
    box._t = t;
    box._go = go;
    box._no = no;
    box._in = inp;
  }
  /* ask({q, t, ok, danger}) resolves true on the verb button, false on Cancel / Esc / a click outside */
  function ask(o) {
    if (!box) make();
    if (pend) pend(false);
    back = document.activeElement;
    box._q.textContent = o.q;
    box._t.textContent = o.t || '';
    box._t.hidden = !o.t;
    box._go.textContent = o.ok || 'Yes';
    box._go.classList.toggle('danger', !!o.danger);
    box._in.hidden = o.input == null;
    box._in.value = o.input || '';
    box.hidden = false;
    if (o.input == null) box._no.focus();
    else (box._in.focus(), box._in.select());
    return new Promise(r => (pend = r));
  }
  window.lsAsk = ask;
  /* Mina, live test of 278: prompt() is blocked in some browsers and app views: the question with a text box, in the page; the text, or null on Cancel */
  window.lsAskText = (q, def, ok) => ask({ q, input: def || '', ok: ok || 'OK' }).then(y => (y ? box._in.value : null));

  /* ---------- the app's own buttons that replace or change the running plant ---------- */
  const tx = el => (el.textContent || '').trim();
  /* the PLANT chip menu is locked in VIEW (app.js locked()): no question then, the menu says why itself */
  const viewLocked = () => {
    try {
      if (document.body.classList.contains('an')) return !!(window.AN && AN.view && !AN.run);
      return typeof SIM !== 'undefined' && !SIM;
    } catch (e) {
      return false;
    }
  };
  const LOSE = 'The running plant is replaced. What is not kept in a save point is lost.';
  const STATES = { Cold: 'Cold', '150 MW': '150 MW', Warm: 'Warm', Hot: 'Hot' };
  function rule(el) {
    const t = tx(el);
    if (el.closest('#plpop')) {
      if (viewLocked()) return null;
      if (el.closest('.plseg')) {
        if (t === 'OFF' && !el.classList.contains('on'))
          return { q: 'Turn the plant model OFF?', t: 'The plant physics stops. The transmitters become free inputs and only the drawn logic runs.', ok: 'Turn OFF' };
        if (STATES[t]) return { q: 'Load the ' + t + ' start state?', t: LOSE, ok: 'Load ' + t };
        return null;
      }
      if (t === 'Turbine trip') return { q: 'Trip the turbine?', t: 'TURBINE TRIP (TA-1): the turbine trips now and the plant reacts to it.', ok: 'Trip turbine', danger: true };
      if (t === 'Open 52L1 (house load)')
        return { q: 'Open the line breaker 52L1?', t: 'House load operation: the unit leaves the 230 kV grid and the generator carries the house load only.', ok: 'Open 52L1', danger: true };
      if (t === 'Close 52L1') return { q: 'Close the line breaker 52L1?', t: 'The unit goes back on the 230 kV grid and the generator carries its load again.', ok: 'Close 52L1' };
      if (t === 'Turbine reset') return { q: 'Reset the turbine trip?', t: 'TURBINE RESET (TA-1): the trip is reset when its causes are clear.', ok: 'Reset' };
      return null;
    }
    /* the DITL tool bar Reset (ditl.js) and the F(X) table resets (fx.js) */
    if (t === 'Reset' && /^Start again/.test(el.title || ''))
      return { q: 'Reset this logic sheet?', t: 'All inputs go OFF; timers, latches, valves and motors go back to the start.', ok: 'Reset', danger: true };
    /* the ABC / plant page Reset (analog/ui/main.js), Mina beta.244 */
    if (t === 'Reset' && /^Reset this sheet to the start/.test(el.title || ''))
      return { q: 'Reset this sheet?', t: 'Forced signals, switches and sliders are cleared. PID tuning and parameters are kept.', ok: 'Reset', danger: true };
    if (t === 'Reset all edits') return { q: 'Reset all edits?', t: 'Every changed F(X) table goes back to the drawing values.', ok: 'Reset all', danger: true };
    if (t === 'Reset this table') return { q: 'Reset this table?', t: 'This F(X) table goes back to the drawing values.', ok: 'Reset table', danger: true };
    return null;
  }
  document.addEventListener(
    'click',
    e => {
      if (!document.body.classList.contains('sc') || !e.isTrusted) return;
      const el = e.target.closest && e.target.closest('button');
      if (!el || el.disabled || (box && box.contains(el))) return;
      const o = rule(el);
      if (!o) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      ask(o).then(ok => ok && el.isConnected && el.click());
    },
    true
  );
})();
