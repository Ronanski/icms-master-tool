/* ===== RE-SHELL LAYOUT C: one confirmation dialog for the presses that replace or change the running plant (user 2026-11-09
   "Wala ba mga user confirmation dialog mga buttons dyan"). Only with ?shell=c (body.sc). The dialog only stops the click and,
   on Yes, presses the same button again: nothing here touches the logic, the plant model or the engine.
   Standard: Nielsen #5 error prevention, Material 3 dialogs (title = the question, text = what happens, the verb on the button,
   Cancel first and focused). The faceplate START / STOP / OPEN / CLOSE keep their own question (fp-pop.js ask). ===== */
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
    card.append(q, t, row);
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
    /* Mina beta.244: Esc never reached the dialog (a page handler stops it first); the dialog listens first, on the window, while open */
    addEventListener('keydown', e => {
      if (box.hidden) return;
      if (e.key === 'Escape') (e.preventDefault(), e.stopImmediatePropagation(), done(false));
      if (e.key === 'Tab') {
        e.preventDefault();
        (document.activeElement === no ? go : no).focus();
      }
    }, true);
    box._q = q;
    box._t = t;
    box._go = go;
    box._no = no;
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
    box.hidden = false;
    box._no.focus();
    return new Promise(r => (pend = r));
  }
  window.lsAsk = ask;

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
