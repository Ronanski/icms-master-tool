/* ===== RE-SHELL LAYOUT C, step 1 of 7 (user approved the mockup C and the build plan on 2026-11-09):
   the new status strip, built BESIDE the old app. It shows only when the user opens the app with ?shell=c (kept in ls-shell until
   "Old layout" is pressed or the link has ?shell=old). It READS the plant (the same values the Training recorder writes, LS_LIVE.getV)
   and drives only the controls the old app already has (alarm list, speed, Plant view / Logic). Nothing here touches the engine.
   The 11 values: user decisions of 2026-11-08 (team-files/reshell/BRIEF.md item 6). ===== */
(function () {
  const KEY = 'ls-shell';
  try {
    const q = new URLSearchParams(location.search).get('shell');
    if (q === 'c') localStorage.setItem(KEY, 'c');
    else if (q === 'old') localStorage.removeItem(KEY);
  } catch (e) {}
  let want = false;
  try {
    want = localStorage.getItem(KEY) === 'c';
  } catch (e) {}
  if (!want) return;

  const E = (t, cls, txt) => {
    const e = document.createElement(t);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  /* [label, unit, how to read, decimals, source for the tooltip] */
  const L = () => window.LS_LIVE;
  const g = k => () => +L().getV(k);
  const rht = () => {
    const f = L().fp('TICHR1002');
    return f ? L().pvOf(f) : NaN;
  };
  const K = [
    ['Load', 'MW', g('MW'), 1, 'Generator MW, ABC-001C AI0419'],
    ['Main steam pressure', 'kg/cm²', g('MSP'), 1, 'PT-MS1002, ABC-001C AI0131'],
    ['Main steam temperature', '°C', g('MST'), 0, 'PV of TICMS1004, ABC-012'],
    ['Main steam flow', 't/h', g('MSF'), 1, 'Compensated main steam flow, ABC-001C SI0230'],
    ['Reheat steam pressure', 'kg/cm²', g('RHP'), 1, 'PV of PICHR1003, ABC-052'],
    ['Reheat steam temperature', '°C', rht, 0, 'PV of TICHR1002, ABC-019'],
    ['Drum level', 'mm', g('lvl'), 0, 'PV of LICBR1001, ABC-010'],
    ['Bed temperature', '°C', g('Tb'), 0, 'Plant model bed temperature (FHI Fig 8)'],
    ['Furnace pressure', 'mmH₂O', g('FP'), 0, 'PV of PICFG108, ABC-008'],
    ['Total coal flow', 't/h', g('coal'), 1, 'Coal master PV, ABC-004A'],
    ['Total air flow', 't/h', g('AIR'), 1, 'Primary + secondary + fluidizing air, ABC-006']
  ];
  let S = null;
  function build() {
    const band = document.getElementById('crband');
    if (!band || !window.LS_LIVE) return false;
    const strip = E('div');
    strip.id = 'scstrip';
    strip.setAttribute('role', 'region');
    strip.setAttribute('aria-label', 'Major plant values');
    const vals = E('div', 'scv');
    const cells = K.map(([n, u, , , src]) => {
      const c = E('div', 'sck'),
        v = E('b', '', '—');
      c.append(E('i', '', n), v, E('small', '', u));
      c.title = n + ', ' + u + '. Source: ' + src + '.';
      vals.append(c);
      return { c, v };
    });
    const pills = E('div', 'scp');
    const trip = E('button', 'pill');
    trip.type = 'button';
    const tripT = E('span', '', 'No trip');
    trip.append(E('span', 'dot'), tripT);
    trip.title = 'Trip status. Click: the alarm list';
    const alm = E('button', 'pill');
    alm.type = 'button';
    const almT = E('span', '', 'No alarm');
    alm.append(E('span', 'dot'), almT);
    alm.title = 'Alarms of the whole DCS. Click: the alarm list with Acknowledge';
    /* step 2: the new alarm list (shellc-home.js) with its Events tab; the old list while that is not there */
    const openAlarms = () => {
      if (window.lsShellC && lsShellC.openAl) return lsShellC.openAl();
      const c = document.querySelector('#cralarm .crchip:not(.frc)');
      if (c) c.click();
    };
    trip.onclick = openAlarms;
    alm.onclick = openAlarms;
    /* speed: the app's own speed control (the Simulation speed select), shown as ×1 ▾ with the choices */
    const spd = E('div', 'spd'),
      spdB = E('button', 'pill', 'Speed ×1'),
      spdM = E('div', 'spdm');
    spdB.type = 'button';
    spdB.title = 'Simulation speed';
    spdB.setAttribute('aria-haspopup', 'true');
    spdB.onclick = () => {
      const sel = speedSel();
      spdM.textContent = '';
      if (sel)
        for (const o of sel.options) {
          const b = E('button', o.value === sel.value ? 'on' : '', '×' + o.value);
          b.type = 'button';
          b.onclick = () => {
            sel.value = o.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            spd.classList.remove('open');
          };
          spdM.append(b);
        }
      spd.classList.toggle('open');
    };
    spd.append(spdB, spdM);
    document.addEventListener('click', e => {
      if (!spd.contains(e.target)) spd.classList.remove('open');
    });
    /* Operator = the plant pages, Engineer = the logic sheets (step 4 brings the side-by-side view) */
    const seg = E('div', 'seg');
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Mode');
    const bOp = E('button', '', 'Operator'),
      bEn = E('button', '', 'Engineer');
    bOp.type = bEn.type = 'button';
    /* step 2: Operator opens the overview of the unit (shellc-home.js) */
    bOp.onclick = () => (window.lsShellC && lsShellC.showOv ? lsShellC.showOv() : window.lsSetTab && lsSetTab('operate'));
    bEn.onclick = () => {
      if (window.lsShellC && lsShellC.hideOv) lsShellC.hideOv();
      if (window.lsSetTab) lsSetTab('logic');
    };
    seg.append(bOp, bEn);
    /* Mina beta.209: "Old layout" in the strip reloaded the page and lost the running plant with no warning; it is on the start screen
       now (no plant yet there), lsShellC.oldLayout */
    /* Mina beta.210: RUN / PAUSE was covered on the overview (it is in the bar under the strip): the simulation's own Run / Pause
       (AN.runOn / AN.pauseOn, the Run button of the app) in the strip, on every screen */
    const runB = E('button', 'pill run');
    runB.type = 'button';
    const runT = E('span', '', 'Paused');
    runB.append(E('span', 'dot'), runT);
    runB.onclick = () => {
      try {
        /* Mina beta.236: on a DITL page the plant runs on the DITL Run (SIM, DPAUSE), not AN.run (world.js 1438) */
        if (AN.cat !== 'an' && typeof SIM !== 'undefined') {
          if (SIM && !DPAUSE) DPAUSE = true;
          else {
            const r = document.querySelector('.tb-run.dui-run');
            if (r) r.click();
          }
          return;
        }
        if (AN.run && !AN.view) AN.pauseOn();
        else AN.runOn();
      } catch (e) {}
    };
    pills.append(trip, alm, runB, spd, seg);
    strip.append(vals, pills);
    band.prepend(strip);
    document.body.classList.add('sc');
    S = { cells, trip, tripT, alm, almT, spdB, bOp, bEn, runB, runT };
    setTimeout(() => dispatchEvent(new Event('resize')), 0);
    setInterval(tick, 1000);
    tick();
    return true;
  }
  function speedSel() {
    return [...document.querySelectorAll('select')].find(x => x.title === 'Simulation speed') || null;
  }
  const fmt = (x, d) => (isFinite(x) ? x.toFixed(d).replace(/^-(0(?:\.0)?)$/, '$1') : '—');
  function tick() {
    if (!S) return;
    const none = window.AN && AN.plantOn && !AN.startState;
    K.forEach(([, , rd, d], i) => {
      let x = NaN;
      if (!none)
        try {
          x = rd();
        } catch (e) {}
      const t = fmt(x, d);
      if (S.cells[i].v.textContent !== t) S.cells[i].v.textContent = t;
      S.cells[i].c.classList.toggle('na', !isFinite(x));
    });
    /* Mina beta.209: the pill named the newest equipment trip (SAND INJECTION SYSTEM) after a turbine trip. The unit trips come first:
       the turbine trip to the DCS (ABC-050 I.0400, TA-6 out 16, unit.js U.vtrip) and the MFT (I.000F, the address the Training reads);
       an equipment trip of the alarm list only when the unit is not tripped */
    let tt = 0,
      mft = 0;
    try {
      const l = AN.unit && AN.unit.vtrip;
      tt = l && +l.S.rt.v[l.n] > 0.5 ? 1 : 0;
    } catch (e) {}
    try {
      mft = +L().val('I.000F') > 0.5 ? 1 : 0;
    } catch (e) {}
    if (none) tt = mft = 0;
    /* one count with the alarm list (shellc-home.js): the standing alarms of lsAlarms (not returned, not suppressed) */
    let AL = [];
    try {
      /* the same rows as the alarm list, the unit trips included (shellc-home.js lsShellC.alarms) */
      AL = window.lsShellC && lsShellC.alarms ? lsShellC.alarms() : window.lsAlarms ? lsAlarms.list().filter(a => !a.rtn && !a.sd) : [];
    } catch (e) {}
    const eqT = AL.filter(a => a.kind === 'TRIP');
    S.trip.classList.toggle('trip', !!(tt || mft || eqT.length));
    S.tripT.textContent =
      tt && mft
        ? 'Turbine trip · MFT'
        : tt
          ? 'Turbine trip'
          : mft
            ? 'Boiler trip (MFT)'
            : eqT.length
              ? eqT.length + (eqT.length === 1 ? ' equipment trip' : ' equipment trips')
              : 'No trip';
    S.trip.title = (tt || mft ? 'Unit trip: turbine trip ABC-050 I.0400, master fuel trip I.000F. ' : '') + (eqT.length ? 'Equipment trips: ' + eqT.map(a => a.nm).join(', ') + '. ' : '') + 'Click: the alarm list';
    const un = AL.filter(a => !a.ack).length;
    const n = AL.length;
    S.alm.classList.toggle('alm', n > 0);
    S.alm.classList.toggle('new', un > 0);
    S.almT.textContent = n ? n + (n === 1 ? ' alarm' : ' alarms') + (un ? ' · ' + un + ' new' : '') : 'No alarm';
    /* Mina beta.213: at 1366 the strip (two-line labels, value, unit) was taller than the top bar and the page under it covered the
       units and the reheat values: the top bar takes the height the strip needs (any width, dock open or not) */
    try {
      const st = document.getElementById('scstrip'),
        /* the content of the strip (its rows), not the strip itself: the strip is as tall as the bar */
        tops = [...st.children].map(c => c.getBoundingClientRect()).filter(r => r.height > 0),
        need = Math.ceil(Math.max(...tops.map(r => r.bottom)) - Math.min(...tops.map(r => r.top))) + 12,
        cur = parseFloat(getComputedStyle(document.body).getPropertyValue('--top')) * (/rem/.test(getComputedStyle(document.body).getPropertyValue('--top')) ? 16 : 1);
      if (need > 40 && Math.abs(need - cur) > 2) {
        document.body.style.setProperty('--top', need + 'px');
        dispatchEvent(new Event('resize'));
      }
    } catch (e) {}
    /* Mina beta.219: with the Training dock open the strip started under the left rail ("Load" and Search hidden) and its right end
       (RUN) went under the dock; on the overview the overview's own bar covered the button row. The strip keeps clear of the rail and
       of the dock, and everything placed under the top bar takes the bar's real bottom (--scb) */
    try {
      const st = document.getElementById('scstrip'),
        band = document.getElementById('crband'),
        br = band.getBoundingClientRect(),
        /* Mina beta.220: the rail and the dock are position: fixed, whose offsetParent is always null: seen by their boxes instead */
        vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none'),
        rail = document.getElementById('crrail'),
        dock = document.getElementById('gdock');
      let ml = 0,
        mr = 0;
      let rl = 0;
      if (vis(rail)) {
        const r = rail.getBoundingClientRect();
        rl = Math.max(0, Math.ceil(r.right));
        if (r.top < br.bottom && r.right > br.left + 1) ml = Math.ceil(r.right - br.left) + 6;
      }
      if (vis(dock)) {
        const d = dock.getBoundingClientRect();
        if (d.top < br.bottom - 1 && d.left < br.right - 1 && d.left > br.left) mr = Math.ceil(br.right - d.left) + 6;
      }
      /* the whole bar (the strip and the app's own buttons beside it) keeps clear: padding of the bar, over the !important of shellc.css */
      const mls = Math.max(8, ml) + 'px',
        mrs = Math.max(8, mr) + 'px';
      if (band.style.getPropertyValue('padding-left') !== mls) band.style.setProperty('padding-left', mls, 'important');
      if (band.style.getPropertyValue('padding-right') !== mrs) band.style.setProperty('padding-right', mrs, 'important');
      void st;
      /* the overview starts right of the rail as it is drawn (with the dock open --railW is 14 px while the rail stays wide) */
      const rls = rl + 'px';
      if (document.documentElement.style.getPropertyValue('--scl') !== rls) document.documentElement.style.setProperty('--scl', rls);
      /* the lowest of the bar and the strip's rows (a row that outgrows the bar is never covered) */
      const rows = [...st.children].map(c => c.getBoundingClientRect()).filter(r => r.height > 0),
        b = Math.ceil(Math.max(band.getBoundingClientRect().bottom, ...rows.map(r => r.bottom + 4))) + 'px';
      if (document.documentElement.style.getPropertyValue('--scb') !== b) document.documentElement.style.setProperty('--scb', b);
      /* live check beta.233: a faceplate placed beside the clicked equipment ran 23 px under the footer (its last buttons hidden);
         it moves up inside the page area, same faceplate, same size */
      for (const id of ['fpop', 'fpop2']) {
        const fp = document.getElementById(id),
          box = fp && fp.offsetParent;
        if (!fp || !box || !fp.offsetHeight) continue;
        const over = fp.offsetTop + fp.offsetHeight - (box.clientHeight - 6);
        if (over > 0) fp.style.top = Math.max(6, fp.offsetTop - over) + 'px';
      }
      /* live check beta.233 (source hmi2.js frame(), Yuna): the old dark row of page buttons at the foot of every HMI page is
         navigation, not plant drawing; shell C has the page picker and the path for that, so the row is hidden (drawing unchanged) */
      const ps = document.getElementById('plsvg');
      if (ps && !ps._scnav) {
        ps._scnav = 1;
        const hide = () => {
          for (const r of ps.querySelectorAll('rect[height="32"]:not([data-scnav])')) {
            if (+r.getAttribute('width') < 900 || r.getAttribute('x') !== '0') continue;
            let e = r;
            while (e) {
              e.setAttribute('data-scnav', '');
              e = e.nextElementSibling;
            }
          }
          /* user 2026-11-09: the old header (values) and the alarm line at the top of the page repeat the strip and its alarm pill: hidden too (frame, not drawing) */
          for (const r of ps.querySelectorAll('rect[height="34"][y="0"]:not([data-schd])')) {
            if (+r.getAttribute('width') < 900 || r.getAttribute('x') !== '0') continue;
            for (let e = r; e && !(e.tagName === 'rect' && e.getAttribute('height') === '32'); e = e.nextElementSibling) e.setAttribute('data-schd', '');
          }
        };
        hide();
        new MutationObserver(hide).observe(ps, { childList: true, subtree: true });
      }
      /* the footer hint is one line now (shellc.css): its full text in the tooltip */
      for (const el of document.querySelectorAll('#sfoot #st, #sfoot .sinfo')) if (el.title !== el.textContent) el.title = el.textContent;
    } catch (e) {}
    /* Mina beta.236: the pill said Paused while the plant ran on a DITL page; the same test as the plant clock (world.js 1438) */
    let on = false;
    try {
      on = !!(window.AN && (AN.cat === 'an' ? AN.run && !AN.view : typeof SIM !== 'undefined' && SIM && !DPAUSE));
    } catch (e) {}
    S.runB.classList.toggle('on', on);
    const rt = on ? 'Running' : 'Paused';
    if (S.runT.textContent !== rt) S.runT.textContent = rt;
    S.runB.title = on ? 'The simulation runs. Click: pause' : 'The simulation is paused. Click: run';
    const sel = speedSel();
    const sp = 'Speed ×' + (sel ? sel.value : '1');
    if (S.spdB.textContent !== sp) S.spdB.textContent = sp;
    const tab = document.body.dataset.tab;
    S.bOp.classList.toggle('on', tab === 'operate');
    S.bEn.classList.toggle('on', tab === 'logic');
  }
  /* the old shell builds #crband after load (cr.js, only on a window 900 px wide or more). Live check beta.241: after 30 s the wait
     stopped, so a slow or narrow first load showed the old dark app for good; now it waits until the band is there (every 0.5 s, then 2 s) */
  let n = 0;
  const wait = () => {
    if (build()) return;
    setTimeout(wait, ++n > 60 ? 2000 : 500);
  };
  wait();
})();
