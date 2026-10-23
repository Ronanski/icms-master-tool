/* ===== 3.2.0-beta.9 VIEW | RUN, one rule for the whole app (user 2026-10-23: "sa VIEW nagagawa mo lahat, maliban lang sa
   SIMULATE / FORCE / CONTROL. Malinaw dapat ang hiwalay na function ng dalawa").
   VIEW (ABC page, Plant view): looking, tracing, opening, searching, the tabs, Why?, trend range, F(X) page all work; what
   changes the plant is locked: FORCE, the input switches and values, Bad Signal, A / M / R, SV / MV, the Engineering buttons of a
   faceplate, block parameters. Before, the whole Inspector was locked in VIEW (tabs, ✕, Edit table ... too) and the faceplates
   were not locked at all. RUN: everything works. The DITL page keeps its own VIEW | RUN (ditl.js). Nothing here touches the
   engine: it only stops a click / key on a control while the page is in VIEW and tells the user to press RUN. ===== */
(function () {
  /* VIEW = the ABC engine is in VIEW and its clock does not run */
  const inView = () => document.body.classList.contains('an') && !!(window.AN && AN.view && !AN.run);
  /* the places with controls */
  const ROOTS = '#anp,#opp,#plfp,#inlist';
  /* view-only things inside those places */
  const VIEWOK = '.keep,.ph,.hmitabs,.ovh,.ovg,summary,.plfph,.whyx,.sub,input.f,.inq,.ingh';
  const VIEWTXT = /^(Edit table|F\(X\) page|Load…|Why\?|Open faceplate|Show|Go|Zoom ⤢|Clear|Map\b.*|↗.*)$/;
  const isCtl = el => {
    const c = el && el.closest && el.closest('button,input,select,textarea,[role=button]');
    if (!c || !c.closest(ROOTS)) return null;
    if (c.closest(VIEWOK)) return null;
    if (c.tagName === 'BUTTON' && VIEWTXT.test(c.textContent.trim())) return null;
    /* the trend range and the look of a wire are view settings */
    if (c.tagName === 'SELECT' && [...c.options].some(o => /^(30 s|1 min|Colour: default|Thick: default)$/.test(o.textContent.trim()))) return null;
    return c;
  };
  let said = 0;
  /* the documents to guard: this one and the PLANT VIEW window of a PC (app.js pvWindow calls lsViewLock.attach) */
  const docs = [document];
  const say = (doc = document) => {
    if (Date.now() - said < 2500) return;
    said = Date.now();
    const t = 'VIEW: look and trace only. Press RUN (top right) to force, switch or operate.';
    try {
      if (typeof msg === 'function') msg(t);
    } catch (e) {}
    let n = doc.getElementById('lsvtoast');
    if (!n) {
      n = doc.createElement('div');
      n.id = 'lsvtoast';
      n.setAttribute('role', 'status');
      doc.body.append(n);
    }
    n.textContent = t;
    n.classList.add('on');
    clearTimeout(say.t);
    say.t = setTimeout(() => n.classList.remove('on'), 2600);
  };
  const stop = e => {
    if (!inView()) return;
    const c = isCtl(e.target);
    if (!c) return;
    if (e.type === 'keydown' && /^(Tab|Shift|Escape)$/.test(e.key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.type !== 'focusin') say(e.target.ownerDocument || document);
  };
  const listen = d =>
    ['pointerdown', 'mousedown', 'click', 'dblclick', 'keydown', 'beforeinput', 'wheel', 'change', 'input'].forEach(t =>
      d.addEventListener(t, stop, { capture: true, passive: false })
    );
  listen(document);
  function attach(d) {
    if (!d || docs.includes(d)) return;
    docs.push(d);
    listen(d);
    mark();
  }
  /* the look: in VIEW the controls are dashed and dim (not hidden: the values stay readable) */
  function mark() {
    const v = inView();
    for (let i = docs.length - 1; i > 0; i--) if (!docs[i].defaultView || docs[i].defaultView.closed) docs.splice(i, 1);
    for (const d of docs) {
      if (!d.body) continue;
      d.body.classList.toggle('lsview', v);
      for (const el of d.querySelectorAll('#anp :is(button,input,select),#opp :is(button,input,select),#plfp :is(button,input,select),#inlist :is(button,input)')) {
        const c = v && isCtl(el) === el;
        if (c !== el.hasAttribute('data-vlock')) c ? el.setAttribute('data-vlock', '') : el.removeAttribute('data-vlock');
      }
    }
  }
  setInterval(mark, 400);
  window.lsViewLock = { inView, isCtl, attach };
})();
