/* ===== RE-SHELL LAYOUT C, slice 2 of the redesign (user approved "two bars, one Details column", 2026-11-09 "Gawin na"; artifact
   DMAqPXBECUGeEShYRB2QX8): ONE Details column on the right, with tabs, in place of the boxes that floated over the drawing.
   - Engineer: Why (the "Why is it …?" box of shellc-eng.js), Inspector and Faceplate (the sheet's own side panels #anp / #opp, the
     DITL panel #dp), Training (the step card of shellc-ins.js), Alarms;
   - Operator: Training and Alarms (the faceplates still open beside their equipment).
   The "Details" button of the context bar opens and closes the column; the vertical "Panel" tab, the panel's own Hide ✕ and Auto-hide
   and the Inspector / Panel buttons of the sheet bar give their place to it (one control per task). Nothing is rebuilt: the panels are
   placed in the column (shellc-details.css) and pressed with their own buttons; the Why box and the step card are moved into it.
   No logic, HMI drawing, plant model, faceplate or engine change. Only with ?shell=c (body.sc). ===== */
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
  const call = (f, d) => {
    try {
      return f();
    } catch (e) {
      return d;
    }
  };
  const ls = (k, v) => {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) {}
    return null;
  };
  const TABS = {
    why: ['Why', 'Why is it …? The live cause of the selected wire, back to the root signal'],
    insp: ['Inspector', 'The inputs, forces and values of the sheet (analog: the Inspector; digital: the panel of the sheet)'],
    fp: ['Faceplate', 'The controller faceplates of the open analog sheet'],
    train: ['Training', 'The step of the training procedure you are on'],
    alm: ['Alarms', 'The standing alarms and the last event']
  };
  const ENG = ['why', 'insp', 'fp', 'train', 'alm'],
    OP = ['train', 'alm'];
  const wide = () => innerWidth >= 1280;
  let col = null,
    tl = null,
    tb = {},
    body = null,
    sec = {},
    btn = null,
    open = ls('ls-scdet') == null ? null : ls('ls-scdet') === '1';
  const eng = () => B.classList.contains('sceng');
  const tabOf = () => {
    const k = ls(eng() ? 'ls-scdet-eng' : 'ls-scdet-op');
    const L = eng() ? ENG : OP;
    return L.includes(k) ? k : L[0];
  };

  function build() {
    const scp = document.querySelector('#scctx .scp');
    if (!scp) return false;
    col = E('aside');
    col.id = 'scdet';
    col.setAttribute('aria-label', 'Details');
    const hd = E('div', 'scdh');
    tl = E('div', 'scdtl');
    tl.setAttribute('role', 'tablist');
    tl.setAttribute('aria-label', 'Details');
    for (const k in TABS) {
      const b = E('button', '', TABS[k][0]);
      b.type = 'button';
      b.title = TABS[k][1];
      b.setAttribute('role', 'tab');
      b.onclick = () => pick(k);
      tb[k] = b;
      tl.append(b);
    }
    const x = E('button', 'scdx', '✕');
    x.type = 'button';
    x.title = 'Close the Details column (the Details button of the bar opens it again)';
    x.setAttribute('aria-label', 'Close details');
    x.onclick = () => setOpen(false);
    hd.append(tl, x);
    body = E('div', 'scdb');
    body.setAttribute('role', 'tabpanel');
    sec.why = E('section', 'scdsec scdwhy');
    sec.train = E('section', 'scdsec scdtrain');
    sec.alm = E('section', 'scdsec scdalm');
    sec.ins = E('section', 'scdsec scdins');
    body.append(sec.why, sec.ins, sec.train, sec.alm);
    col.append(hd, body);
    document.body.append(col);
    /* the training section: the step card (moved in), or what to do when there is none */
    sec.trainNo = E('div', 'scdnone');
    sec.train.append(sec.trainNo);
    /* the alarms section */
    sec.almEv = E('p', 'scdev');
    sec.almL = E('div', 'scdal');
    const ob = E('button', 'scdlink', 'Open the alarm list (Acknowledge, Events)');
    ob.type = 'button';
    ob.onclick = () => call(() => lsShellC.openAl('alarms'));
    sec.alm.append(E('h4', '', 'Last event'), sec.almEv, E('h4', '', 'Standing alarms'), sec.almL, ob);
    /* the panel is empty while its sheet panel is closed: one press opens it */
    sec.insNo = E('div', 'scdnone');
    sec.ins.append(sec.insNo);
    /* the Details button of the context bar */
    btn = E('button', 'pill scdetb', 'Details');
    btn.type = 'button';
    btn.title = 'Show or hide the Details column: Why, Inspector, Faceplate, Training, Alarms';
    btn.setAttribute('aria-controls', 'scdet');
    btn.onclick = () => setOpen(!B.classList.contains('scdet'));
    scp.append(btn);
    /* Force a signal of the Why box needs the Inspector of the sheet: the column shows it first (shellc-eng.js force() then finds the
       panel open and presses its Inspector tab) */
    col.addEventListener(
      'click',
      e => {
        const t = e.target.closest && e.target.closest('#scewhy .scelk');
        if (t && /^Force a signal/.test(t.textContent.trim())) pick('insp');
      },
      true
    );
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && B.classList.contains('scdet') && !wide() && !document.querySelector('.fpo-box,#scal:not([hidden]),#scins:not([hidden]),#scask:not([hidden])')) setOpen(false);
    });
    return true;
  }
  function setOpen(on) {
    open = on;
    ls('ls-scdet', on ? '1' : '0');
    paint();
    dispatchEvent(new Event('resize'));
  }
  function pick(k) {
    ls(eng() ? 'ls-scdet-eng' : 'ls-scdet-op', k);
    if (open === false || !B.classList.contains('scdet')) open = true;
    paint();
    if (k === 'insp' || k === 'fp') showPanel(k);
    dispatchEvent(new Event('resize'));
  }
  /* the sheet's own panel, opened and switched with its own buttons */
  /* shown on screen (a panel placed in the column is position: fixed, whose offsetParent is always null) */
  const vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none' && el.offsetWidth > 0);
  function showPanel(k) {
    const an = call(() => AN.cat === 'an', false);
    if (an) {
      const anp = $('anp'),
        opp = $('opp');
      if (anp && anp.classList.contains('min')) call(() => $('anptab').click());
      const want = k === 'fp' ? 'Faceplate' : 'Inspector';
      setTimeout(() => {
        const b = [...document.querySelectorAll('#anp .hmitabs button, #opp .hmitabs button')].find(x => x.textContent.trim() === want && !x.classList.contains('on'));
        if (b) b.click();
        void opp;
      }, 0);
    } else {
      const dp = $('dp');
      if (dp && dp.classList.contains('min')) call(() => $('dptab').click());
    }
  }

  function paint() {
    if (!col) return;
    const ok = B.classList.contains('sc') && (B.dataset.tab === 'operate' || eng());
    /* the full Training panel (dock.js #gdock) is open: it has the right side; the column comes back when it is folded */
    const dock = $('gdock'),
      dockOn = !!(dock && vis(dock) && !document.documentElement.classList.contains('gd-min') && call(() => LS_GUIDE.on, false));
    const on = ok && !dockOn && (open == null ? wide() : open);
    B.classList.toggle('scdet', on);
    /* Giselle beta.265 (Jennie, Mina's live check of 263: at 1024 the column lay over the overview cards, the plant drawing and the
       sheet buttons): the page gives the column its width at every size (no overlay). Below 1280 px the column still starts closed */
    B.classList.remove('scdover');
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.hidden = !ok;
    const L = eng() ? ENG : OP,
      k = tabOf();
    for (const t in tb) {
      tb[t].hidden = !L.includes(t);
      tb[t].classList.toggle('on', t === k);
      tb[t].setAttribute('aria-selected', String(t === k));
    }
    const an = call(() => AN.cat === 'an', false);
    tb.fp.disabled = eng() && !an;
    tb.fp.title = an || !eng() ? TABS.fp[1] : 'Faceplates are on the analog sheets: open an ABC sheet';
    for (const t of Object.keys(TABS)) B.classList.toggle('scdt-' + t, on && t === k);
    B.classList.toggle('scdt-pan', on && (k === 'insp' || (k === 'fp' && an)));
  }

  function tick() {
    if (!col && !build()) return;
    paint();
    if (!B.classList.contains('scdet')) return;
    /* the Why box of shellc-eng.js lives in the Why section */
    const why = $('scewhy');
    if (why && why.parentElement !== sec.why) sec.why.append(why);
    /* the step card of shellc-ins.js lives in the Training section */
    const card = $('sccard'),
      /* Giselle beta.265 (Mina, live check of 263: "A training is running." on an empty plant, Open without a start state): a training
         runs only with a plant loaded and its Training panel built (dock.js #gdock), not on a guide flag left from before */
      gOn = call(() => !!(LS_GUIDE.on && AN.startState && $('gdock')), false);
    if (card && card.parentElement !== sec.train) sec.train.append(card);
    sec.trainNo.hidden = !!(card && !card.hidden);
    /* a training that runs with no step card (the panel is not open yet, e.g. after a reload): one press opens its panel (the
       "Open ▲" of the step card, shellc-ins.js setMin(false)) */
    const tn = gOn ? 'A training is running.' : 'No training is running. The Instructor console starts one (start state, practice sections).';
    if (sec.trainNo.dataset.t !== tn) {
      sec.trainNo.dataset.t = tn;
      sec.trainNo.textContent = '';
      sec.trainNo.append(E('p', '', tn));
      const b = E('button', 'scdlink', gOn ? 'Open the Training panel' : 'Open the Instructor console');
      b.type = 'button';
      b.onclick = gOn
        ? () => {
            ls('ls-gdock-min', 'false');
            call(() => LS_DOCK.layout());
            call(() => LS_DOCK.fill(true));
          }
        : () => call(() => lsShellC.openCon());
      sec.trainNo.append(b);
    }
    /* the alarms: the same rows as the alarm pill (shellc-home.js lsShellC.alarms), newest first */
    const AL = call(() => lsShellC.alarms(), []) || [];
    const sig = AL.map(a => a.k + (a.ack ? 1 : 0)).join('|');
    if (sec.almL.dataset.s !== sig) {
      sec.almL.dataset.s = sig;
      sec.almL.textContent = '';
      if (!AL.length) sec.almL.append(E('p', 'scdnone', 'No standing alarm.'));
      for (const a of AL.slice().reverse().slice(0, 40)) {
        const r = E('div', 'scdar' + (a.ack ? '' : ' new') + (a.kind === 'TRIP' ? ' trip' : ''));
        r.append(E('span', 'scdt', a.t || ''), E('span', 'scdn', a.nm || a.k), E('span', 'scds', a.kind === 'TRIP' ? 'Trip' : a.ack ? 'Acknowledged' : 'New'));
        sec.almL.append(r);
      }
    }
    const ev = call(() => lsEvents[0], null),
      et = ev ? (ev.sh && ev.sh !== 'DCS' ? ev.sh + ': ' : '') + (ev.text || '') + (ev.t ? ' · ' + ev.t : '') : 'No event yet.';
    if (sec.almEv.textContent !== et) sec.almEv.textContent = et;
    /* Inspector / Faceplate: the panel is placed over the body of the column (CSS); a closed panel shows a button to open it */
    const pn = ['anp', 'opp', 'dp'].map($).find(vis);
    const panOn = B.classList.contains('scdt-pan');
    sec.insNo.hidden = !(panOn && !pn);
    /* the column has the only way to close the panel now (its ✕): a panel closed by the app (a new sheet, the start) opens again by
       itself while its tab is chosen, at most once every 2 s */
    if (panOn && !pn && Date.now() - (tick.op || 0) > 2000) {
      tick.op = Date.now();
      showPanel(tabOf());
    }
    if (panOn && !pn && !sec.insNo.firstChild) {
      const b = E('button', 'scdlink', 'Show the panel of the sheet');
      b.type = 'button';
      b.onclick = () => showPanel(tabOf());
      sec.insNo.append(E('p', '', 'The panel of this sheet is closed.'), b);
    }
    const r = body.getBoundingClientRect();
    const v = Math.round(r.top) + 'px';
    if (B.style.getPropertyValue('--scdbt') !== v) B.style.setProperty('--scdbt', v);
    /* the panel's own Auto-hide (it would close the panel on a click on the sheet) gives its place to the column */
    for (const l of document.querySelectorAll('#anp .ph label, #dp label')) if (/Auto-hide/i.test(l.textContent) && !l.hasAttribute('data-scdh')) l.setAttribute('data-scdh', '');
    /* the tab follows the panel the app opened itself (Run moves the analog pane to its Faceplate tab, hmi.js) */
    if (panOn && call(() => AN.cat === 'an', false)) {
      const k = vis($('opp')) ? 'fp' : vis($('anp')) ? 'insp' : null;
      if (k && k !== tabOf()) {
        ls('ls-scdet-eng', k);
        paint();
      }
    }
  }
  const iv = setInterval(() => {
    if (!B.classList.contains('scbars')) return;
    if (build()) {
      clearInterval(iv);
      setInterval(tick, 300);
      addEventListener('resize', paint);
      tick();
    }
  }, 300);
})();
