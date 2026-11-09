/* ===== RE-SHELL LAYOUT C, step 5 of 7 (build plan approved by the user 2026-11-09): the Instructor console (Instructor button of the strip)
   and the training step card (the Training panel folded). Only with ?shell=c (body.sc). Every control here presses the app's own control
   (the starting-state, save point, fault, TCS and recorder buttons of the TCS / Field menu, the Practise buttons of the Training page,
   the speed select) or calls the same function the Training dock calls (AN.turbine('trip')). Nothing here touches the engine. ===== */
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
  const call = (f, d) => {
    try {
      return f();
    } catch (e) {
      return d;
    }
  };
  const $ = id => document.getElementById(id);
  /* a press that cannot be undone asks for a second press within 5 s (the same rule as the Training dock, Yuna's design review 2026-11-08) */
  /* user 2026-11-09: a real confirmation dialog (shellc-ask.js) says what happens; the second press stays only if the dialog is missing */
  function arm(b, label, fn, o) {
    b.onclick = () => {
      if (window.lsAsk) {
        o = o || {};
        lsAsk({ q: o.q || label + '?', t: o.t || b.title, ok: o.ok || label, danger: !!o.danger }).then(ok => ok && fn());
        return;
      }
      if (!b.dataset.arm) {
        b.dataset.arm = '1';
        b.textContent = 'Press again: ' + label;
        b._t = setTimeout(() => {
          delete b.dataset.arm;
          b.textContent = label;
        }, 5000);
        return;
      }
      clearTimeout(b._t);
      delete b.dataset.arm;
      b.textContent = label;
      fn();
    };
  }
  const press = id => {
    const b = $(id);
    if (b) b.click();
    return !!b;
  };
  /* ---------- Instructor console ---------- */
  let con = null,
    pill = null;
  function head(t) {
    return E('h4', '', t);
  }
  function row() {
    return E('div', 'scirow');
  }
  function btn(t, title, fn, cls) {
    const b = E('button', cls || '', t);
    b.type = 'button';
    if (title) b.title = title;
    if (fn) b.onclick = fn;
    return b;
  }
  function fill() {
    if (!con || con.hidden) return;
    con.textContent = '';
    const hd = E('div', 'scihd');
    hd.append(E('b', '', 'Instructor console'));
    const x = btn('✕', 'Close (Esc)', () => (con.hidden = true), 'scx');
    x.setAttribute('aria-label', 'Close');
    hd.append(x);
    con.append(hd);
    const body = E('div', 'scibody');
    /* start state */
    body.append(head('Start state'));
    let r = row();
    for (const [t, id] of [['Cold', 'loadcold'], ['Warm', 'loadwarm'], ['Hot', 'loadhot'], ['150 MW', 'load150']]) {
      const b = btn(t, 'Loads the ' + t + ' starting state (the running plant is replaced)');
      arm(b, t, () => {
        if (window.AN && AN.run && !AN.view && AN.pauseOn) AN.pauseOn();
        press(id);
        con.hidden = true;
      }, { q: 'Load the ' + t + ' start state?', t: 'The running plant is replaced by the ' + t + ' starting state. What is not kept in a save point is lost.', ok: 'Load ' + t });
      r.append(b);
    }
    body.append(r);
    /* practice sections: the Practise buttons of the Training page (home.js), the same handlers */
    body.append(head('Practice sections'));
    r = row();
    const P = [...document.querySelectorAll('#trainws .trbtn, .trbtn')].filter((b, i, a) => /^Practise: /.test(b.textContent) && a.indexOf(b) === i);
    if (!P.length) r.append(E('p', 'scnone', 'Open the Training page once to load the practice list.'));
    for (const o of P) {
      const t = o.textContent.replace(/^Practise: /, '');
      const b = btn(t, o.title);
      arm(b, t, () => {
        o.click();
        con.hidden = true; /* Mina, live test of 269: the console stayed over the plant after the start */
        /* a Practise button that asks "Press again" itself gets its second press here (the trainer already pressed twice) */
        setTimeout(() => /^Press again/.test(o.textContent) && o.click(), 60);
      }, { q: 'Start the practice: ' + t + '?', t: (o.title ? o.title + ' ' : '') + 'The running plant is replaced.', ok: 'Start practice' });
      r.append(b);
    }
    body.append(r);
    /* save points */
    body.append(head('Save point'));
    /* Mina beta.210: SAVE asked the name with prompt(), which the built-in browser blocks: the name is asked here, and the save points
       are listed with Load and Delete (lsSaves of app.js, the same save, load and delete as the old menu) */
    r = row();
    const nm = E('input', 'scinp');
    nm.type = 'text';
    nm.id = 'scsvname';
    nm.setAttribute('aria-label', 'Name of the save point');
    nm.value = call(() => lsSaves.name(), '');
    const sv = btn('Save now', 'Keeps the whole plant at this moment in this browser under this name', () => {
      const t = nm.value.trim();
      if (!t) return nm.focus();
      sv.disabled = true;
      Promise.resolve(call(() => lsSaves.save(t))).then(() => fill(), () => fill());
    });
    r.append(nm, sv);
    body.append(r);
    const svl = E('div', 'scsvl');
    body.append(svl);
    call(() =>
      lsSaves.list().then(L => {
        svl.textContent = '';
        if (!L.length) return svl.append(E('p', 'scnone', 'No save point yet.'));
        for (const e of L.slice().reverse()) {
          const rr = E('div', 'scsvr');
          const ld = btn('Load', 'Puts the whole plant back as it was saved, then pauses');
          arm(ld, 'Load', () => ((con.hidden = true), call(() => lsSaves.load(e))), { q: 'Load the save point “' + e.name + '”?', t: 'The whole plant goes back to how it was saved, then pauses. The running plant is replaced.', ok: 'Load' });
          const dl = btn('Delete', 'Removes this save point from this browser; it cannot be undone');
          arm(dl, 'Delete', () => Promise.resolve(call(() => lsSaves.del(e))).then(fill), { q: 'Delete the save point “' + e.name + '”?', t: 'It is removed from this browser. This cannot be undone.', ok: 'Delete', danger: true });
          rr.append(E('span', '', e.name), ld, dl);
          svl.append(rr);
        }
      })
    );
    /* speed */
    body.append(head('Speed'));
    r = row();
    const sel = [...document.querySelectorAll('select')].find(q => q.title === 'Simulation speed');
    if (sel)
      for (const o of sel.options) {
        const b = btn('×' + o.value, 'Simulation speed ×' + o.value, () => {
          sel.value = o.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          fill();
        }, o.value === sel.value ? 'on' : '');
        r.append(b);
      }
    body.append(r);
    /* faults: the trainer faults of engine/faults.js and the motor trips of WORLD.ftrip, through their buttons (flt-*) */
    body.append(head('Faults (field)'));
    r = row();
    const FL = [...call(() => AN.fault(), []), ...call(() => WORLD.ftrip(), [])];
    if (!FL.length) r.append(E('p', 'scnone', 'Load a start state first.'));
    for (const f of FL) {
      const id = 'flt-' + f.id.replace(/\W/g, '-'),
        b = btn(f.t, f.on ? 'On: press to clear it' : 'Puts the fault on (asks first)', null, f.on ? 'flt on' : 'flt');
      if (f.on) b.onclick = () => (press(id), setTimeout(fill, 100));
      else arm(b, f.t, () => (press(id), setTimeout(fill, 100)), { q: 'Put this fault on: ' + f.t + '?', t: 'The fault acts on the running plant until you clear it.', ok: 'Put fault on', danger: true });
      r.append(b);
    }
    if (FL.length) r.append(btn('Clear all faults', 'Every fault that is on is cleared', () => (press('flt-clear'), setTimeout(fill, 100))));
    body.append(r);
    /* trips */
    body.append(head('Trips'));
    r = row();
    const tt = btn('Turbine trip', 'TURBINE TRIP (TA-1), the same command as the Training dock');
    arm(tt, 'Turbine trip', () => {
      const t = call(() => AN.turbine('trip'), '');
      call(() => lsEventAdd('TCS', 'TCS', 'Instructor: TURBINE TRIP (TA-1)' + (t ? ': ' + t : '')));
    }, { q: 'Trip the turbine?', t: 'TURBINE TRIP (TA-1): the turbine trips now and the plant reacts to it.', ok: 'Trip turbine', danger: true });
    tt.classList.add('trip');
    const mft = btn('Boiler trip (MFT): Purge and trip page', 'The master fuel trip push button is the operator’s control: it is on the Purge and trip page', () => {
      con.hidden = true;
      if (window.lsShellC && lsShellC.openPage) lsShellC.openPage('MK10');
    });
    r.append(tt, mft);
    body.append(r);
    /* turbine panel extras and the recorder */
    body.append(head('Turbine and recorder'));
    r = row();
    r.append(
      btn('Criteria bypass…', 'TCS panel: take one unsatisfied ATS criterion out of the step check, or put it back', () => press('tcsbyp')),
      btn('Recorder CSV', 'The plant values recorded each minute of plant time since the last starting state', () => press('recdl'))
    );
    body.append(r);
    con.append(body);
  }
  function openCon() {
    if (!con) return;
    con.hidden = !con.hidden;
    fill();
  }
  window.lsShellC = Object.assign(window.lsShellC || {}, { openCon });

  /* ---------- training step card: the Training panel folded (dock.js ls-gdock-min) ---------- */
  let card = null,
    cSig = '';
  const GD = () => window.LS_GUIDE;
  const setMin = m => {
    try {
      localStorage.setItem('ls-gdock-min', JSON.stringify(!!m));
    } catch (e) {}
    call(() => LS_DOCK.layout());
    if (!m) call(() => LS_DOCK.fill(true));
  };
  function tickCard() {
    const g = GD(),
      on = !!(g && g.on),
      min = document.documentElement.classList.contains('gd-min');
    card.hidden = !(on && min);
    document.body.classList.toggle('sccard', !card.hidden);
    if (card.hidden) return;
    const L = call(() => g.steps(), []),
      i = g.cur,
      s = L[i];
    if (!s) return;
    const ok = call(() => g.stepOk(s), false),
      rd = call(() => g.ready(), false);
    const sig = i + '|' + ok + '|' + rd;
    if (sig === cSig) return;
    cSig = sig;
    card.textContent = '';
    const top = E('div', 'scctop');
    top.append(E('span', '', 'Training · step ' + (i + 1) + ' of ' + L.length));
    const open = btn('Open ▲', 'Show the whole Training panel', () => setMin(false), 'sclink');
    top.append(open);
    const bar = E('div', 'sccbar'),
      fl = E('i');
    fl.style.width = Math.round(((i + (ok ? 1 : 0)) / Math.max(1, L.length)) * 100) + '%';
    bar.append(fl);
    const yn = E('div', 'sccyn');
    const sq = E('span', ok ? 'y' : 'n', ok ? 'Y' : 'N');
    yn.append(sq, E('span', '', ok ? 'This step is done' : 'This step is not done yet'));
    const bs = E('div', 'sccbs');
    const nx = btn('Next step', rd ? 'Go to the next step' : 'The step must be done first', () => (call(() => g.next()), (cSig = ''), tickCard()));
    nx.disabled = !rd;
    bs.append(nx, btn('All steps', 'The whole Training panel with every step', () => setMin(false)));
    card.append(top, bar, E('b', 'scct', s.t || ''), yn, bs);
  }

  /* wait for the strip */
  let n = 0;
  const iv = setInterval(() => {
    const strip = document.getElementById('scstrip');
    if (!strip || !window.LS_LIVE) {
      ++n; /* no time limit: the strip can come later (live check beta.241) */
      return;
    }
    clearInterval(iv);
    pill = E('button', 'pill ins', 'Instructor');
    pill.type = 'button';
    pill.title = 'Instructor console: start state, practice sections, save point, speed, faults, trips';
    pill.onclick = openCon;
    const sp = strip.querySelector('.spd');
    if (sp) sp.before(pill);
    else strip.querySelector('.scp').append(pill);
    con = E('div');
    con.id = 'scins';
    con.setAttribute('role', 'dialog');
    con.setAttribute('aria-label', 'Instructor console');
    con.hidden = true;
    document.body.append(con);
    /* Mina beta.210: Esc did not close the lists (a handler of the app stops the key first): caught in the capture phase */
    window.addEventListener(
      'keydown',
      e => {
        if ((e.key === 'Escape' || e.key === 'Esc') && !con.hidden) con.hidden = true;
      },
      true
    );
    card = E('div');
    card.id = 'sccard';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Training step');
    card.hidden = true;
    document.body.append(card);
    setInterval(() => {
      pill.classList.toggle('on', !con.hidden);
      tickCard();
    }, 1000);
  }, 250);
})();
