/* Operator station (user 2026-11-18): the new frame of the app. It only shows and presses what the app already has:
   the plant pages (HX), the unit numbers of the plant model (AN.unit), the alarm list (lsShellC.alarms), Run / Pause (AN.runOn / AN.pauseOn).
   No logic, plant model or drawing is changed here. */
(function () {
  if (!window.LS_STATION) return;
  const $ = (s, r) => (r || document).querySelector(s);
  const E = (t, c, x) => {
    const e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };
  const call = (f, d) => {
    try {
      const r = f();
      return r == null ? d : r;
    } catch (e) {
      return d;
    }
  };
  const mem = {
    get: k => call(() => localStorage.getItem('st-' + k)),
    set: (k, v) => call(() => localStorage.setItem('st-' + k, v))
  };
  /* the pages of the unit in the order an operator walks the plant; a page that is not in the app is left out */
  const GROUPS = [
    ['', ['overview']],
    [
      'Fuel and air',
      ['coal', 'limestone-sand', 'oil-burners', 'combustion-air', 'furnace-gas', 'purge-trip', 'sootblowers']
    ],
    ['Steam', ['drum-steam', 'reheat-steam', 'turbine', 'extraction', 'aux-steam', 'generator']],
    ['Water', ['feedwater', 'condensate', 'sea-water', 'makeup-cooling', 'sampling']],
    ['Auxiliaries', ['turbine-oil', 'compressed-air', 'ash']]
  ];
  /* the five numbers of the unit: the keys of the plant model that the unit overview of the app reads */
  const NUMS = [
    ['Load', 'MW', 'MW', 1],
    ['Steam pressure', 'MSP', 'kg/cm²', 1],
    ['Steam temperature', 'MST', '°C', 0],
    ['Drum level', 'lvl', 'mm', 0],
    ['Furnace pressure', 'FP', 'mmH₂O', 0]
  ];
  const vis = e => !!e && e.getBoundingClientRect().width > 0;
  const pick = () => $('#plantws .plpick');
  const pages = () => {
    const o = {},
      p = pick();
    if (p) for (const x of p.options) if (/^HX-/.test(x.value)) o[x.value.slice(3)] = x.textContent.trim();
    return o;
  };
  const cur = () => {
    const p = pick();
    return p && /^HX-/.test(p.value) ? p.value.slice(3) : '';
  };
  const go = id => {
    const p = pick();
    if (!p || ![...p.options].some(o => o.value === 'HX-' + id)) return;
    p.value = 'HX-' + id;
    p.dispatchEvent(new Event('change', { bubbles: true }));
    mem.set('page', id);
    setTimeout(paint, 50);
  };
  let root,
    list,
    title,
    tabs,
    kv,
    runB,
    almX,
    almT,
    almM,
    almN,
    almPop,
    condB,
    condPop,
    spdB,
    spdPop,
    sheets,
    mode,
    tools,
    eng = false;

  function drag(pop) {
    const h = $('header', pop);
    h.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      const r = pop.getBoundingClientRect(),
        x0 = e.clientX,
        y0 = e.clientY;
      pop.style.right = 'auto';
      pop.style.bottom = 'auto';
      h.setPointerCapture(e.pointerId);
      const mv = ev => {
        pop.style.left = Math.max(0, Math.min(innerWidth - 80, r.left + ev.clientX - x0)) + 'px';
        pop.style.top = Math.max(0, Math.min(innerHeight - 40, r.top + ev.clientY - y0)) + 'px';
      };
      const up = () => {
        h.removeEventListener('pointermove', mv);
        h.removeEventListener('pointerup', up);
      };
      h.addEventListener('pointermove', mv);
      h.addEventListener('pointerup', up);
    });
  }
  function popup(name, sub, w) {
    const p = E('section', 'st-pop');
    p.style.width = w + 'px';
    p.setAttribute('aria-label', name);
    const h = E('header'),
      x = E('button', 'st-t', '✕');
    x.setAttribute('aria-label', 'Close');
    x.onclick = () => (p.hidden = true);
    const s = E('small', '', sub);
    h.append(E('b', '', name), s, x);
    const b = E('div', 'st-body');
    p.append(h, b);
    p._sub = s;
    p._body = b;
    root.append(p);
    drag(p);
    return p;
  }

  function build() {
    /* the frame lives in a shadow root: its styles and the styles of the old frame cannot touch each other */
    const host = E('div');
    host.id = 'station';
    const sh = host.attachShadow({ mode: 'open' });
    sh.append(E('style', '', window.LS_STATION_CSS || ''));
    root = E('div', 'st-frame');
    sh.append(root);
    const rail = E('nav', 'st-rail');
    rail.setAttribute('aria-label', 'Pages of the unit');
    const unit = E('div', 'st-unit', 'LMYP Unit 1'),
      hide = E('button', 'st-t', '‹ Hide');
    hide.setAttribute('aria-label', 'Hide the page list');
    unit.append(hide);
    list = E('div', 'st-list');
    /* Engineer: the logic sheets instead of the plant pages */
    sheets = E('div', 'st-list');
    sheets.hidden = true;
    const foot = E('div', 'st-railfoot');
    mode = E('div', 'st-seg');
    for (const [t, e] of [
      ['Operator', false],
      ['Engineer', true]
    ]) {
      const b = E('button', 'st-b', t);
      b._e = e;
      b.onclick = () => setEng(e);
      mode.append(b);
    }
    const insB = E('button', 'st-b st-ins', 'Instructor');
    insB.title = 'Starting point, save points, faults and trips';
    insB.onclick = instructor;
    foot.append(mode, insB);
    rail.append(unit, list, sheets, foot);
    const top = E('header', 'st-top'),
      show = E('button', 'st-b', 'Pages ›');
    show.hidden = true;
    title = E('h1');
    tabs = E('div', 'st-tabs');
    kv = E('div', 'st-kv');
    const sim = E('div', 'st-sim');
    runB = E('button', 'st-b');
    spdB = E('button', 'st-b');
    spdB.title = 'Simulation speed';
    spdB.onclick = speeds;
    sim.append(runB, spdB);
    for (const [name, v] of [
      ['Process', 0],
      ['Trends', 2]
    ]) {
      const b = E('button', '', name);
      b.onclick = () => view(v);
      b._v = v;
      tabs.append(b);
    }
    for (const n of NUMS) {
      const s = E('span', '', n[0]),
        b = E('b', '', '--');
      s.append(b, n[2]);
      s._b = b;
      s._n = n;
      kv.append(s);
    }
    condB = E('button', 'st-b');
    condB.hidden = true;
    condB.onclick = () => {
      if (!condPop) {
        condPop = popup('Conditions', '', 420);
        condPop.style.left = 'calc(var(--st-rail) + 12px)';
        condPop.style.top = '56px';
      }
      condPop.hidden = false;
      tick();
    };
    top.append(show, title, tabs, condB, kv, sim);
    const alm = E('footer', 'st-alm');
    almM = E('i', 'st-mk');
    almT = E('span', 'st-tm');
    almX = E('span', 'st-x');
    almN = E('span', 'st-n');
    const open = E('button', 'st-t', 'Alarm list');
    alm.append(almM, almT, almX, almN, open);
    /* the tools of a logic sheet: the zoom controls the app already has, as one small bar */
    tools = E('div', 'st-tools');
    tools.hidden = true;
    for (const [t, lab, k] of [
      ['−', 'Zoom out', 'out'],
      ['+', 'Zoom in', 'in'],
      ['Readable', 'Zoom until the text of the drawing can be read', 'read'],
      ['Whole sheet', 'Show the whole sheet', 'fit']
    ]) {
      const b = E('button', 'st-b', t);
      b.title = lab;
      b.setAttribute('aria-label', lab);
      b.onclick = () => zoom(k);
      tools.append(b);
    }
    root.append(rail, top, alm, tools);
    document.body.append(host);
    const setRail = on => {
      document.body.classList.toggle('st-norail', !on);
      root.classList.toggle('norail', !on);
      show.hidden = on;
      mem.set('rail', on ? '1' : '0');
      setTimeout(() => dispatchEvent(new Event('resize')), 30);
    };
    hide.onclick = () => setRail(false);
    show.onclick = () => setRail(true);
    setRail(mem.get('rail') !== '0');
    runB.onclick = () => {
      const A = window.AN;
      if (!A) return;
      call(() => (A.run && !A.view ? A.pauseOn() : A.runOn()));
      setTimeout(tick, 100);
    };
    open.onclick = () => {
      if (!almPop) {
        almPop = popup('Alarms', '', 600);
        almPop.style.right = '12px';
        almPop.style.bottom = '44px';
        const ft = E('footer', 'st-foot');
        almPop._ack = E('button', 'st-b', 'Acknowledge all');
        almPop._ack.onclick = () => {
          ackAll();
          setTimeout(tick, 150);
        };
        ft.append(almPop._ack);
        almPop.append(ft);
      }
      almPop.hidden = false;
      tick();
    };
    const P = pages();
    for (const [g, ids] of GROUPS) {
      const have = ids.filter(i => P[i]);
      if (!have.length) continue;
      if (g) list.append(E('div', 'st-grp', g));
      for (const i of have) {
        const b = E('button', 'st-nav', P[i]);
        b._id = i;
        b.onclick = () => go(i);
        list.append(b);
      }
    }
  }
  /* Engineer shows the logic view of the app (its own drawing, zoom and trace) inside the station; Operator shows the plant pages */
  function setEng(on) {
    eng = !!on;
    document.body.classList.toggle('st-eng', eng);
    list.hidden = eng;
    sheets.hidden = !eng;
    if (eng) {
      call(() => lsSetTab('logic'));
      if (!sheets.firstChild) fillSheets();
      setTimeout(() => zoom('read'), 500);
    } else {
      call(() => lsSetTab('operate'));
      call(() => lsPlant(true));
    }
    if (condPop) condPop.hidden = true;
    tools.hidden = !eng;
    paint();
    setTimeout(() => dispatchEvent(new Event('resize')), 60);
    setTimeout(() => {
      tick();
      paint();
    }, 120);
  }
  function zoom(k) {
    if (k === 'read') return readable();
    const B = [...document.querySelectorAll('button')],
      b =
        k === 'out'
          ? B.find(x => x.title === 'Zoom out' && x.closest('#zbar'))
          : k === 'in'
            ? B.find(x => x.title === 'Zoom in' && x.closest('#zbar'))
            : B.find(x => x.closest('#zbar') && x.textContent.trim() === 'Fit');
    if (b) b.click();
  }
  /* readable: the wheel zoom of the drawing itself, around the top left of what is drawn, until its text is about 12 px high
     (the Readable size of the app stops at the height of the sheet in its Engineer layout) */
  function readable() {
    const sv = $('#svg');
    if (!sv) return;
    const R = [...sv.querySelectorAll('text')].map(t => t.getBoundingClientRect()).filter(r => r.height > 0);
    if (!R.length) return;
    const hs = R.map(r => r.height).sort((a, b) => a - b),
      px = hs[hs.length >> 1],
      box = sv.getBoundingClientRect();
    if (px >= 11.5) return;
    const x = Math.min(box.right - 4, Math.max(box.left + 4, Math.min(...R.map(r => r.left)) - 16)),
      y = Math.min(box.bottom - 4, Math.max(box.top + 4, Math.min(...R.map(r => r.top)) - 16)),
      n = Math.min(16, Math.ceil(Math.log(12 / px) / Math.log(1.15)));
    for (let i = 0; i < n; i++)
      sv.dispatchEvent(
        new WheelEvent('wheel', { deltaY: -100, clientX: x, clientY: y, bubbles: true, cancelable: true })
      );
    /* then the drag of the drawing itself, so that what is drawn starts at the top left of the view */
    const T = [...sv.querySelectorAll('text')].map(t => t.getBoundingClientRect()).filter(r => r.height > 0),
      dx = Math.min(...T.map(r => r.left)) - (box.left + 24),
      dy = Math.min(...T.map(r => r.top)) - (box.top + 24);
    if (Math.hypot(dx, dy) < 8) return;
    const cx = box.left + box.width / 2,
      cy = box.top + box.height / 2,
      o = { bubbles: true, cancelable: true, pointerId: 92, pointerType: 'mouse', isPrimary: true, button: 0 };
    /* a made pointer event has no live pointer, so the capture the drawing asks for is skipped for this one drag */
    const P = Element.prototype,
      cap = P.setPointerCapture,
      rel = P.releasePointerCapture;
    P.setPointerCapture = P.releasePointerCapture = function () {};
    try {
      sv.dispatchEvent(new PointerEvent('pointerdown', { ...o, buttons: 1, clientX: cx, clientY: cy }));
      sv.dispatchEvent(new PointerEvent('pointermove', { ...o, buttons: 1, clientX: cx - dx, clientY: cy - dy }));
      sv.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0, clientX: cx - dx, clientY: cy - dy }));
      sv.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, clientX: cx - dx, clientY: cy - dy })
      );
    } finally {
      P.setPointerCapture = cap;
      P.releasePointerCapture = rel;
    }
  }
  const sheetName = x => String((x && (x.name || x.id)) || '');
  const sheetTitle = x => String((x && (x.title || x.desc || x.t)) || '');
  /* the three families of logic sheets, as the app names them (its own family buttons and its own sheet list do the work) */
  const FAMS = [
    ['an', 'Analog', 'Analog logic'],
    ['dig', 'Digital', 'Digital interlock logic'],
    ['tcs', 'Turbine', 'Turbine control system']
  ];
  let fam = 'an';
  const shsel = () => $('#shsel');
  /* an entry of the sheet list of the app: "(6)DITL-01 · FURNACE PURGE CONDITION" */
  const optName = t =>
    String(t)
      .replace(/^\(\d+\)/, '')
      .split(' · ')[0]
      .trim();
  const optTitle = t => String(t).split(' · ').slice(1).join(' · ').trim();
  function setFam(f) {
    fam = f;
    const b = [...document.querySelectorAll('#gsbar button')].find(x =>
      x.title.startsWith(FAMS.find(y => y[0] === f)[2])
    );
    if (b) b.click();
    setTimeout(() => {
      fillSheets();
      tick();
      paint();
      zoom('read');
    }, 700);
  }
  function fillSheets() {
    const q0 = sheets._find ? sheets._find.value : '';
    sheets.textContent = '';
    const seg = E('div', 'st-fam');
    for (const [k, t] of FAMS) {
      const b = E('button', 'st-b' + (k === fam ? ' on' : ''), t);
      b.setAttribute('aria-pressed', String(k === fam));
      b.onclick = () => setFam(k);
      seg.append(b);
    }
    const find = E('input', 'st-find');
    find.type = 'search';
    find.placeholder = 'Find a sheet…';
    find.setAttribute('aria-label', 'Find a logic sheet');
    find.value = q0;
    sheets._find = find;
    sheets.append(seg, find);
    const add = (name, title, i, open) => {
      const b = E('button', 'st-nav', name);
      b._i = i;
      b.title = title;
      b._q = (name + ' ' + title).toLowerCase();
      b.onclick = () => {
        call(open);
        setTimeout(tick, 150);
        setTimeout(() => zoom('read'), 500);
      };
      sheets.append(b);
    };
    if (fam === 'an')
      ((window.AN && AN.sheets) || []).forEach((x, i) => add(sheetName(x), sheetTitle(x), i, () => AN.go(i)));
    else {
      const sel = shsel();
      if (sel)
        for (const o of sel.options) {
          const tcs = /TCS-/.test(o.textContent);
          if (tcs !== (fam === 'tcs')) continue;
          add(optName(o.textContent), optTitle(o.textContent), o.value, () => {
            sel.value = o.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          });
        }
    }
    find.oninput = () => {
      const q = find.value.trim().toLowerCase();
      for (const b of sheets.querySelectorAll('.st-nav')) b.hidden = !!q && !b._q.includes(q);
    };
    find.oninput();
  }
  /* the sheet the logic view shows: AN.i (set by AN.go) for the analog sheets, the entry of the sheet list of the app for the others */
  const curSheet = () =>
    fam === 'an' ? (window.AN && typeof AN.i === 'number' ? AN.i : -1) : shsel() ? shsel().value : -1;
  const curTitle = () => {
    if (fam === 'an') {
      const x = ((window.AN && AN.sheets) || [])[curSheet()];
      return sheetName(x) + (sheetTitle(x) ? ' · ' + sheetTitle(x) : '');
    }
    const o = shsel() && shsel().selectedOptions[0];
    return o ? optName(o.textContent) + (optTitle(o.textContent) ? ' · ' + optTitle(o.textContent) : '') : '';
  };

  /* acknowledge: the Acknowledge all of the alarm list of the app (it also acknowledges the unit and logic rows); the list stays hidden */
  function ackAll() {
    call(() => lsShellC.openAl('alarms'));
    const al = $('#scal'),
      b = al && $('.scack', al);
    if (b && !b.disabled) b.click();
    if (al) al.hidden = true;
  }
  /* speed: the Simulation speed control of the app, its own choices */
  const speedSel = () => [...document.querySelectorAll('select')].find(x => x.title === 'Simulation speed') || null;
  /* Instructor: the starting point, the save points, the faults and the trips of the app, through its own controls and functions
     (the same ones its Instructor console presses: shellc-ins.js). A press that changes the plant asks for a second press within 5 s */
  let insPop = null;
  const pressId = id => {
    const b = document.getElementById(id);
    if (b) b.click();
    return !!b;
  };
  function arm(b, label, fn) {
    b.onclick = () => {
      if (!b._arm) {
        b._arm = setTimeout(() => {
          b._arm = 0;
          b.textContent = label;
          b.classList.remove('arm');
        }, 5000);
        b.textContent = 'Press again: ' + label;
        b.classList.add('arm');
        return;
      }
      clearTimeout(b._arm);
      b._arm = 0;
      b.textContent = label;
      b.classList.remove('arm');
      fn();
    };
  }
  function instructor() {
    if (!insPop) {
      insPop = popup('Instructor', '', 360);
      insPop.style.left = 'calc(var(--st-rail) + 12px)';
      insPop.style.bottom = '44px';
      insPop.hidden = true;
    }
    insPop.hidden = !insPop.hidden;
    if (!insPop.hidden) fillIns();
  }
  function fillIns() {
    const body = insPop._body,
      keep = body.scrollTop;
    body.textContent = '';
    const head = t => body.append(E('h2', 'st-h', t));
    const row = () => {
      const r = E('div', 'st-row');
      body.append(r);
      return r;
    };
    const again = () => setTimeout(fillIns, 300);
    head('Starting point');
    let r = row();
    for (const [t, id] of [
      ['150 MW', 'load150'],
      ['Cold', 'loadcold']
    ]) {
      const b = E('button', 'st-b', t);
      b.title = 'The running plant is replaced by the ' + t + ' starting point';
      arm(b, t, () => {
        call(() => AN.run && !AN.view && AN.pauseOn());
        pressId(id);
        insPop.hidden = true;
        setTimeout(tick, 1500);
      });
      r.append(b);
    }
    head('Save points');
    r = row();
    const nm = E('input', 'st-find');
    nm.type = 'text';
    nm.setAttribute('aria-label', 'Name of the save point');
    nm.placeholder = 'Name…';
    nm.value = call(() => lsSaves.name(), '') || '';
    const sv = E('button', 'st-b', 'Save now');
    sv.title = 'Keeps the whole plant at this moment under this name';
    sv.onclick = () => {
      const t = nm.value.trim();
      if (!t) return nm.focus();
      sv.disabled = true;
      Promise.resolve(call(() => lsSaves.save(t))).then(fillIns, fillIns);
    };
    r.classList.add('st-save');
    r.append(nm, sv);
    const svl = E('div', 'st-svl');
    body.append(svl);
    Promise.resolve(call(() => lsSaves.list(), [])).then(
      L => {
        svl.textContent = '';
        if (!L || !L.length) return svl.append(E('p', 'st-none', 'No save point yet.'));
        for (const e of L.slice().reverse()) {
          const rr = E('div', 'st-svr'),
            ld = E('button', 'st-b', 'Load'),
            dl = E('button', 'st-b', 'Delete');
          ld.title = 'Puts the whole plant back as it was saved, then pauses';
          dl.title = 'Removes this save point; it cannot be undone';
          arm(ld, 'Load', () => {
            insPop.hidden = true;
            call(() => lsSaves.load(e));
            setTimeout(tick, 1500);
          });
          arm(dl, 'Delete', () => Promise.resolve(call(() => lsSaves.del(e))).then(fillIns, fillIns));
          rr.append(E('span', '', e.name), ld, dl);
          svl.append(rr);
        }
        body.scrollTop = keep;
      },
      () => svl.append(E('p', 'st-none', 'No save point yet.'))
    );
    head('Trips');
    r = row();
    const tt = E('button', 'st-b', 'Turbine trip');
    tt.title = 'The turbine trips now and the plant reacts to it';
    arm(tt, 'Turbine trip', () => {
      call(() => AN.turbine('trip'));
      call(() => lsEventAdd('TCS', 'TCS', 'Instructor: TURBINE TRIP (TA-1)'));
      again();
    });
    r.append(tt);
    const el = call(() => (AN.elec ? AN.elec() : null), null);
    if (el) {
      const t = el.l52 ? 'Open line breaker' : 'Close line breaker',
        lb = E('button', 'st-b', t);
      lb.title = el.l52
        ? '230 kV line breaker 52L1 opens: the generator carries the house load only'
        : '230 kV line breaker 52L1 closes: the unit is on the grid again';
      arm(lb, t, () => {
        const x = call(() => AN.turbine('52l', el.l52 ? 0 : 1), '');
        call(() =>
          lsEventAdd('TCS', 'TCS', 'Instructor: ' + (el.l52 ? 'open' : 'close') + ' 52L1' + (x ? ': ' + x : ''))
        );
        again();
      });
      r.append(lb);
    }
    head('Faults');
    r = row();
    r.classList.add('st-col');
    const FL = [...call(() => AN.fault(), []), ...call(() => WORLD.ftrip(), [])];
    if (!FL.length) r.append(E('p', 'st-none', 'No fault in this starting point.'));
    for (const f of FL) {
      const id = 'flt-' + String(f.id).replace(/\W/g, '-'),
        b = E('button', 'st-b' + (f.on ? ' on' : ''), f.t);
      b.setAttribute('aria-pressed', String(!!f.on));
      b.title = f.on ? 'On: press to clear it' : 'Puts the fault on the running plant until it is cleared';
      if (f.on)
        b.onclick = () => {
          pressId(id);
          again();
        };
      else
        arm(b, f.t, () => {
          pressId(id);
          again();
        });
      r.append(b);
    }
    if (FL.some(f => f.on)) {
      const c = E('button', 'st-b', 'Clear all faults');
      c.onclick = () => {
        pressId('flt-clear');
        again();
      };
      r.append(c);
    }
    body.scrollTop = keep;
  }
  function speeds() {
    const sel = speedSel();
    if (!sel) return;
    if (!spdPop) {
      spdPop = popup('Simulation speed', '', 220);
      spdPop.style.right = '12px';
      spdPop.style.top = '56px';
      spdPop._body.classList.add('st-two');
    }
    spdPop._body.textContent = '';
    const now = String((window.AN && AN.spd) || sel.value);
    for (const o of sel.options) {
      const b = E('button', 'st-b' + (String(o.value) === now ? ' on' : ''), '×' + o.value);
      b.onclick = () => {
        sel.value = o.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        spdPop.hidden = true;
        setTimeout(tick, 100);
      };
      spdPop._body.append(b);
    }
    spdPop.hidden = false;
  }

  /* the condition boxes of a plant page (state only, not its push buttons) are not drawn on the picture: they are read here and shown
     in one popup, under the section title the page gives them */
  const xy = e => {
    const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)/.exec(e.getAttribute('transform') || '');
    return m ? [+m[1], +m[2]] : [+e.getAttribute('x') || 0, +e.getAttribute('y') || 0];
  };
  function conds() {
    const pg = $('#plantws .hx-process');
    if (!pg) return [];
    const Z = [...pg.querySelectorAll('.hx-zone')].map(z => ({
      z,
      p: xy(z),
      t: z.textContent.replace(/\s+/g, ' ').trim(),
      n: 0
    }));
    const out = [];
    for (const h of pg.querySelectorAll('.hx-hook:not([data-press])')) {
      const p = xy(h),
        st = h.querySelector('.hx-hks');
      let g = null;
      for (const z of Z) if (z.p[1] < p[1] && Math.abs(z.p[0] - p[0]) < 360 && (!g || z.p[1] > g.p[1])) g = z;
      if (g) {
        g.n++;
        if (p[1] - g.p[1] < 80) g.near = 1;
      }
      /* the group of a condition = the logic sheet it is read from (the boxes of one sheet belong together on every page) */
      const hk = h.dataset.hook || '',
        sh = (/"((?:DITL|ABC)-[\w]+)\|/.exec(hk) || [])[1] || '',
        grp = (/data-g="(\w+)"/.exec(hk) || [])[1] || '';
      out.push({
        g: GROUPS_OF[grp] || SHEETS[sh] || '',
        label: h.dataset.label || '',
        state: st ? st.textContent.trim() : '',
        k: h.classList.contains('run') ? 'run' : h.classList.contains('stop') ? 'stop' : ''
      });
    }
    /* a section title that only headed boxes has nothing under it now */
    for (const z of Z) z.z.style.visibility = z.n && z.near ? 'hidden' : '';
    /* one block per group, in the order the groups first appear on the page */
    const ord = [...new Set(out.map(c => c.g))];
    return out
      .map((c, i) => [c, i])
      .sort((a, b) => ord.indexOf(a[0].g) - ord.indexOf(b[0].g) || a[1] - b[1])
      .map(x => x[0]);
  }
  /* the name of the group of a logic sheet, in the words of its plant page (hx-page-purge-trip.js); other sheets: one plain list */
  const SHEETS = {
    'DITL-01': 'Purge permissive',
    'DITL-02': 'Furnace purge sequence',
    'DITL-03A': 'Master fuel trip'
  };
  /* a page can mark the boxes of one group itself (data-g of the box): PP = the purge permissives */
  const GROUPS_OF = { PP: 'Purge permissive' };
  const title1 = t => t || 'Conditions';

  /* the faceplate of the page (its own popup): it takes the full name of the machine from the page, and it can be dragged by its title */
  function face() {
    faceOf($('#fpop'), '.fpo-h', f => {
      const b = $('.fpo-tt > b', f),
        key = b ? b.textContent.trim() : '',
        n = [...document.querySelectorAll('#plantws .hx-node[data-ms]')].find(x => x.dataset.ms === key),
        nm = n && $('.hx-name', n);
      return nm ? nm.textContent : key;
    });
    /* a controller: the name the page gives the loop (data-name of its card) */
    faceOf($('#plfp'), '.plfph', f => {
      const tag = f.dataset.tag || '',
        n = [...document.querySelectorAll('#plantws .hx-node[data-lv2]')].find(x => x.dataset.lv2 === tag);
      return (n && n.dataset.name) || tag;
    });
  }
  function faceOf(f, head, name) {
    if (!f) return;
    const nm = JSON.stringify(String(name(f)).replace(/\s+/g, ' ').trim());
    if (f._nm !== nm) f.style.setProperty('--st-name', (f._nm = nm));
    if (f._st) return;
    f._st = 1;
    const h = $(head, f);
    if (h)
      h.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) return;
        const x0 = e.clientX,
          y0 = e.clientY,
          l = f.offsetLeft,
          t = f.offsetTop;
        h.setPointerCapture(e.pointerId);
        const mv = ev => {
          f.style.left = l + ev.clientX - x0 + 'px';
          f.style.top = t + ev.clientY - y0 + 'px';
        };
        const up = () => {
          h.removeEventListener('pointermove', mv);
          h.removeEventListener('pointerup', up);
        };
        h.addEventListener('pointermove', mv);
        h.addEventListener('pointerup', up);
      });
  }

  /* the views of a plant page: its own Process and Trends views */
  function view(v) {
    const t = document.querySelectorAll('#plantws .hx-tabs button')[v];
    if (t) t.click();
    tabs._v = v;
    paint();
  }
  function paint() {
    const c = cur(),
      P = pages();
    const ci = eng ? curSheet() : -1;
    title.textContent = eng ? curTitle() : P[c] || '';
    tabs.hidden = eng;
    for (const b of mode.children) {
      b.classList.toggle('on', b._e === eng);
      b.setAttribute('aria-pressed', String(b._e === eng));
    }
    for (const b of sheets.querySelectorAll('.st-nav')) b.classList.toggle('on', b._i === ci);
    for (const b of list.querySelectorAll('.st-nav')) {
      const on = b._id === c;
      b.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    }
    for (const b of tabs.children) b.classList.toggle('on', (tabs._v || 0) === b._v);
  }
  const fmt = (v, dp) => (v == null || !isFinite(v) ? '--' : (+(+v).toFixed(dp) || 0).toFixed(dp).replace('-', '−'));
  const text = a =>
    String(a.nm ? a.nm + (a.lv ? ' ' + a.lv : '') : a.txt || a.text || a.msg || a.name || a.k || '')
      .replace(/\s+/g, ' ')
      .trim();
  function tick() {
    /* the reader of the unit overview of the app (LS_LIVE.getV); the plant model value where the reader has none.
       After a start state is loaded and before the first Run the reader still holds the numbers of the state before (shellc-home.js
       "stale"): only the 150 MW state is its own snapshot, so the other states show the plant model value, or "--", until Run */
    const U = (window.AN && AN.unit) || {},
      ss = window.AN ? AN.startState : null;
    if (ss !== tick._ss) {
      tick._ss = ss;
      tick._fresh = ss === 'plantLoad150';
    }
    if (window.AN && AN.run && !AN.view) tick._fresh = true;
    kv.title = tick._fresh ? '' : 'Press Paused to run the plant: the numbers are read on the first scan';
    for (const s of kv.children) {
      const v = tick._fresh ? call(() => +LS_LIVE.getV(s._n[1]), NaN) : NaN;
      s._b.textContent = fmt(isFinite(v) ? v : U[s._n[1]], s._n[3]);
    }
    const on = !!(window.AN && AN.run && !AN.view);
    runB.textContent = on ? 'Running' : 'Paused';
    runB.classList.toggle('on', on);
    runB.setAttribute('aria-pressed', String(on));
    runB.title = on ? 'Press to pause the simulation' : 'Press to run the simulation';
    const sel = speedSel();
    spdB.hidden = !sel;
    spdB.textContent = 'Speed ×' + ((window.AN && AN.spd) || (sel && sel.value) || 1);
    const A = call(() => lsShellC.alarms(), [])
        .slice()
        .reverse(),
      nw = A.filter(a => !a.ack).length,
      a = A[0];
    almM.hidden = !a;
    almM.classList.toggle('new', !!(a && !a.ack));
    almT.textContent = a ? a.t || '' : '';
    almX.textContent = a ? text(a) : 'No standing alarm';
    almN.textContent = '';
    almN.append(E('b', '', A.length), ' standing · ', E('b', '', nw), ' not acknowledged');
    if (almPop && almPop._ack) almPop._ack.disabled = !nw;
    if (almPop && !almPop.hidden) {
      almPop._sub.textContent = A.length + ' standing';
      almPop._body.textContent = '';
      if (!A.length) almPop._body.append(E('p', 'st-none', 'No standing alarm.'));
      for (const x of A.slice(0, 40)) {
        const r = E('div', 'st-arow');
        r.append(
          E('i', 'st-mk' + (x.ack ? '' : ' new')),
          E('span', 'st-tm', x.t || ''),
          E('span', '', text(x)),
          E('small', '', x.ack ? 'acknowledged' : 'not acknowledged')
        );
        almPop._body.append(r);
      }
    }
    const C = conds();
    condB.hidden = eng || !C.length || (tabs._v || 0) !== 0;
    condB.textContent = 'Conditions · ' + C.length;
    if (condPop && !C.length) condPop.hidden = true;
    if (condPop && !condPop.hidden) {
      const key = C.map(c => c.g + c.label + c.state + c.k).join('|');
      if (key !== condPop._key) {
        condPop._key = key;
        condPop._sub.textContent = pages()[cur()] || '';
        condPop._body.textContent = '';
        let last = null;
        for (const c of C) {
          if (c.g !== last) condPop._body.append(E('div', 'st-cg', title1(c.g)));
          last = c.g;
          const r = E('div', 'st-cond');
          r.append(E('i', c.k ? 'st-dot ' + c.k : 'st-dot'), E('span', '', c.label), E('em', '', c.state));
          condPop._body.append(r);
        }
      }
    }
    face();
    if (eng && curSheet() !== tick._s) {
      tick._s = curSheet();
      paint();
    }
    if (cur() !== tick._c) {
      tick._c = cur();
      tabs._v = 0;
      paint();
    }
  }

  /* the start: the state of the plant is chosen on the start screen of the station, and loaded by the start screen of the app under it */
  function start(state) {
    const st = $('#scstart');
    if (vis(st)) {
      const chip = [...st.querySelectorAll('.scchips button')].find(b => b.textContent.trim() === state),
        card = [...st.querySelectorAll('.sccard')].find(b => /Operator/.test(b.textContent));
      if (chip) chip.click();
      if (card) card.click();
    }
    /* loaded = the start screen of the app has shown its overview (shellc-home.js loadState, then showOv); at 150 MW the logic of that state is on too */
    const loaded = () =>
      window.AN &&
      !AN._loading &&
      AN.startState &&
      (document.body.classList.contains('scov') || !state) &&
      (state !== '150 MW' || (window.DITL150 && DITL150.on));
    let asked = 0;
    const t = setInterval(() => {
      if (!loaded()) return;
      /* the plant pages exist once the Plant view has been opened */
      if (!pick() || !Object.keys(pages()).length) {
        if (asked++ % 10 === 0) call(() => window.lsPlant && lsPlant(true));
        return;
      }
      clearInterval(t);
      document.body.classList.add('st');
      wait.remove();
      build();
      const P = pages(),
        want = mem.get('page');
      go(P[want] ? want : P.overview ? 'overview' : Object.keys(P)[0]);
      setInterval(tick, 500);
      tick();
      setTimeout(() => dispatchEvent(new Event('resize')), 200);
    }, 300);
  }
  /* the two starting points of the spec (docs/SPEC.md S5, S6): full load and cold start; Warm and Hot are not in the spec */
  const STATES = [
    ['150 MW', 'Normal operation at full load'],
    ['Cold', 'Start-up from zero: drum 0 kg/cm², bed and water 30 °C']
  ];
  const wait = E('div');
  wait.id = 'stationwait';
  const ws = wait.attachShadow({ mode: 'open' });
  ws.append(
    E(
      'style',
      '',
      ':host{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;background:#171b1f;color:#e6eaed;font:400 14px/1.4 "IBM Plex Sans","Segoe UI",system-ui,sans-serif}' +
        'main{width:min(560px,calc(100vw - 32px));display:grid;gap:8px}h1{font:600 20px/1.3 inherit;font-family:inherit;margin:0}p{margin:0 0 8px;color:#9aa4ae}' +
        'button{all:unset;box-sizing:border-box;display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:center;min-height:48px;padding:8px 12px;border:1px solid #7a8692;border-radius:2px;background:#20262c;cursor:pointer}' +
        'button:hover{background:#2b333b;border-color:#a9b3bd}button:focus-visible{outline:2px solid #e6eaed;outline-offset:2px}button b{font-weight:600}button span{color:#9aa4ae;font-size:13px}small{color:#9aa4ae;font-size:12px}'
    )
  );
  const wm = E('main');
  ws.append(wm);
  const ask = () => {
    wm.textContent = '';
    wm.append(E('h1', '', 'Unit 1 Operator Station'), E('p', '', 'Choose the state the plant starts from.'));
    for (const [k, d] of STATES) {
      const b = E('button');
      b.append(E('b', '', k), E('span', '', d));
      b.onclick = () => {
        wm.textContent = '';
        wm.append(E('h1', '', 'Unit 1 Operator Station'), E('p', '', 'Loading the plant: ' + k + '…'));
        start(k);
      };
      wm.append(b);
    }
  };
  wm.append(E('h1', '', 'Unit 1 Operator Station'), E('p', '', 'Starting…'));
  document.body.append(wait);
  const boot = setInterval(() => {
    const st = $('#scstart');
    if (vis(st)) {
      clearInterval(boot);
      /* ?state=... opens one state at once (the tests, a shortcut of the desktop) */
      const q = (/[?&]state=([^&]+)/.exec(location.search) || [])[1],
        k =
          q &&
          STATES.map(x => x[0]).find(
            x => x.toLowerCase().replace(/\s/g, '') === decodeURIComponent(q).toLowerCase().replace(/\s/g, '')
          );
      if (k) {
        wm.lastChild.textContent = 'Loading the plant: ' + k + '…';
        start(k);
      } else ask();
    } else if (window.AN && AN.startState && pick()) {
      clearInterval(boot);
      start('');
    }
  }, 200);
})();
