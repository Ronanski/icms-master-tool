/* ===== RE-SHELL LAYOUT C, step 2 of 7 (build plan approved by the user 2026-11-09): the start screen, the overview of the unit (9 system
   tiles and the alarm tile) and the alarm list with its Events tab. Only with ?shell=c (body.sc, shellc.js). It READS the plant (LS_LIVE,
   LS_DOCK.mst, lsAlarms, lsEvents) and drives only what the app already has: the starting-state buttons (load150 / loadcold / loadwarm /
   loadhot), the save points (lsSaves), the Plant view page picker, ACK. Nothing here touches the engine. ===== */
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
  const none = () => !!(window.AN && AN.plantOn && !AN.startState);
  const gv = k => call(() => (typeof k === 'function' ? +k() : +LS_LIVE.getV(k)), NaN);
  const fmt = (x, d) => (isFinite(x) ? x.toFixed(d).replace(/^-(0(?:\.0*)?)$/, '$1') : '—');
  const U = () => (window.AN && AN.unit) || {};
  /* the 9 systems of the unit: the page each opens (the Plant view pages of hmi-mock-*.js) and its values (the Training reader) */
  const TILES = [
    { t: 'Coal, limestone and sand', pg: 'MK12', v: [['Total coal flow', 'coal', 't/h', 1]] },
    { t: 'Boiler and drum', pg: 'MK07', v: [['Bed temperature', 'Tb', '°C', 0], ['Drum level', 'lvl', 'mm', 0], ['Drum pressure', 'Pd', 'kg/cm²', 1]] },
    { t: 'Steam and turbine', pg: 'MK13', v: [['Main steam temperature', 'MST', '°C', 0], ['Main steam pressure', 'MSP', 'kg/cm²', 1], ['Turbine speed', 'rpm', 'rpm', 0]] },
    { t: 'Generator', pg: 'MK17', v: [['Load', 'MW', 'MW', 1]] },
    { t: 'Air and flue gas', pg: 'MK09', v: [['Total air flow', 'AIR', 't/h', 1], ['Furnace pressure', 'FP', 'mmH₂O', 0], ['Flue gas oxygen', 'O2', '%', 1]] },
    { t: 'Feedwater', pg: 'MK06', v: [['Feedwater flow', 'FW', 't/h', 1], ['Main steam flow', 'MSF', 't/h', 1]] },
    { t: 'Condenser and condensate', pg: 'MK05', v: [['Condenser pressure, absolute', () => U().cdP, 'kg/cm²', 3], ['Hotwell level', () => U().cdHw, 'mm', 0]] },
    { t: 'Cooling and seawater', pg: 'CWN', v: [] },
    { t: 'Ash and precipitator', pg: 'MK14', v: [] }
  ];
  /* the machines of a page (its mach list): RUN / STOP / TRIP as the page shows them (hmi-mock.js mst) */
  function machines(pg) {
    const d = call(() => LS_MOCK.defs.find(x => x.id === pg), null);
    if (!d || !d.mach) return null;
    let run = 0,
      trip = 0,
      n = 0;
    for (const id in d.mach) {
      const m = d.mach[id];
      if (m.ctl || !(m.ad || m.fld)) continue;
      const s = call(() => (m.fld ? (AN.fieldState && AN.fieldState()[m.fld] ? 'RUN' : 'STOP') : LS_DOCK.mst(m.ad)), null);
      if (s == null) continue;
      n++;
      if (s === 'RUN') run++;
      else if (s === 'TRIP') trip++;
    }
    return { n, run, trip };
  }
  /* open a page of the Plant view (the page picker of plant.js) */
  function openPage(pg) {
    hideOv();
    if (window.lsSetTab) lsSetTab('operate');
    let k = 0;
    const iv = setInterval(() => {
      const pk = document.querySelector('#plantws .plpick');
      if (pk && [...pk.options].some(o => o.value === pg)) {
        clearInterval(iv);
        pk.value = pg;
        pk.dispatchEvent(new Event('change'));
        if (crumb) crumb.querySelector('b').textContent = TILES.find(x => x.pg === pg).t;
      } else if (++k > 40) clearInterval(iv);
    }, 100);
  }

  /* ---------- overview ---------- */
  let ov = null,
    crumb = null,
    tiles = [],
    almTile = null;
  const HIST = TILES.map(() => []);
  function buildOv() {
    ov = E('div');
    ov.id = 'scov';
    ov.setAttribute('role', 'region');
    ov.setAttribute('aria-label', 'Overview of the unit');
    const bar = E('div', 'scbar');
    bar.append(E('span', 'scbc', 'Plant'), E('span', 'scsep', '›'), E('b', '', 'Overview'));
    const grid = E('div', 'scgrid');
    tiles = TILES.map((T, i) => {
      const b = E('button', 'sctile');
      b.type = 'button';
      b.title = 'Open the ' + T.t + ' page';
      const h = E('h3', '', T.t),
        kv = E('div', 'sckv'),
        vs = T.v.map(([n, , u]) => {
          const v = E('b', '', '—');
          kv.append(E('span', '', n), v);
          v.dataset.u = u;
          return v;
        });
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 180 40');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('class', 'scspark');
      svg.setAttribute('aria-hidden', 'true');
      const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      svg.append(pl);
      const lamp = E('div', 'sclamp');
      b.append(h, kv, svg, lamp);
      if (!T.v.length) svg.style.display = 'none';
      b.onclick = () => openPage(T.pg);
      grid.append(b);
      return { b, vs, pl, lamp };
    });
    almTile = E('button', 'sctile scalm');
    almTile.type = 'button';
    almTile.title = 'Open the alarm list';
    almTile.onclick = () => openAl('alarms');
    grid.append(almTile);
    ov.append(bar, grid);
    document.body.append(ov);
    crumb = E('button', 'sccrumb');
    crumb.type = 'button';
    crumb.title = 'Back to the overview of the unit';
    crumb.append(E('span', 'scbc', 'Plant'), E('span', 'scsep', '›'), E('b', '', ''));
    crumb.onclick = showOv;
    document.body.append(crumb);
  }
  function showOv() {
    if (!ov) return;
    if (window.lsSetTab && document.body.dataset.tab !== 'operate') lsSetTab('operate');
    document.body.classList.add('scov');
  }
  function hideOv() {
    document.body.classList.remove('scov');
  }
  window.lsShellC = Object.assign(window.lsShellC || {}, { showOv, hideOv, openPage });
  /* a start state or save point loaded (and not run yet): the lamps wait for the first scan */
  let stale = false,
    lastSS = null;
  function tickOv() {
    if (!ov) return;
    const ss = window.AN ? AN.startState : null;
    if (ss !== lastSS) (lastSS = ss), (stale = true);
    if (window.AN && AN.run && !AN.view) stale = false;
    const n0 = none();
    TILES.forEach((T, i) => {
      const t = tiles[i];
      T.v.forEach(([, k, u, d], j) => {
        const x = n0 ? NaN : gv(k),
          s = fmt(x, d) + (isFinite(x) ? ' ' + u : '');
        if (t.vs[j].textContent !== s) t.vs[j].textContent = s;
      });
      const m = n0 ? null : machines(T.pg);
      t.lamp.textContent = '';
      /* Mina beta.210: after a start state loaded while paused the machine states of the drawings are not scanned yet (they came right
         after RUN): grey until the plant has run */
      if (stale && m && m.n) {
        t.lamp.append(E('span', 'dot none'), E('span', '', 'press Run to read the machines'));
      } else if (m && m.n) {
        const dot = E('span', 'dot ' + (m.trip ? 'trip' : m.run ? 'run' : 'stop'));
        t.lamp.append(dot, E('span', '', m.trip ? m.trip + ' tripped · ' + m.run + ' running' : m.run ? m.run + ' running' : 'all stopped'));
      }
      /* the trend line of the first value: last 30 min, one point each 10 s of the clock */
      const pts = HIST[i];
      if (pts.length > 1) {
        let lo = Math.min(...pts),
          hi = Math.max(...pts);
        if (hi - lo < 1e-6) (lo -= 1), (hi += 1);
        t.pl.setAttribute('points', pts.map((y, k) => (k * 180) / 179 + ',' + (36 - ((y - lo) / (hi - lo)) * 32).toFixed(1)).join(' '));
      } else t.pl.removeAttribute('points');
    });
    /* the alarm tile: the newest six */
    const AL = call(() => lsAlarms.list().filter(a => !a.rtn && !a.sd), []).slice(-6).reverse();
    almTile.textContent = '';
    almTile.append(E('h3', '', 'Alarms · newest first'));
    if (!AL.length) almTile.append(E('p', 'scnone', 'No alarm'));
    for (const a of AL) {
      const r = E('div', 'scar' + (a.ack ? '' : ' new'));
      r.append(E('span', 'sct', a.t || ''), E('span', 'scn', (a.nm || '') + ' ' + (a.lv || '')), E('span', 'scs', a.ack ? 'acknowledged' : '• new'));
      almTile.append(r);
    }
    almTile.classList.toggle('on', AL.some(a => !a.ack));
    /* the breadcrumb of a system page: the page on screen (the picker of the Plant view) */
    const pk = document.querySelector('#plantws .plpick'),
      T = pk && TILES.find(x => x.pg === pk.value),
      nm = T ? T.t : pk && pk.selectedOptions[0] ? pk.selectedOptions[0].textContent : '';
    if (crumb.lastChild.textContent !== nm) crumb.lastChild.textContent = nm;
  }
  setInterval(() => {
    if (none()) return;
    TILES.forEach((T, i) => {
      if (!T.v.length) return;
      const x = gv(T.v[0][1]);
      if (!isFinite(x)) return;
      HIST[i].push(x);
      if (HIST[i].length > 180) HIST[i].shift();
    });
  }, 10000);

  /* ---------- alarm list with the Events tab ---------- */
  let al = null,
    alSig = '',
    alTab = 'alarms';
  function buildAl() {
    al = E('div');
    al.id = 'scal';
    al.setAttribute('role', 'dialog');
    al.setAttribute('aria-label', 'Alarm list');
    al.hidden = true;
    document.body.append(al);
    /* Mina beta.210: Esc did not close the list (a handler of the app stops the key first): caught in the capture phase */
    document.addEventListener(
      'keydown',
      e => {
        if (e.key === 'Escape' && !al.hidden) al.hidden = true;
      },
      true
    );
  }
  function openAl(tab) {
    if (!al) return;
    if (tab) alTab = tab;
    al.hidden = tab ? false : !al.hidden;
    alSig = "";
    fillAl();
  }
  window.lsShellC = Object.assign(window.lsShellC || {}, { openAl });
  function fillAl() {
    if (!al || al.hidden) return;
    /* redrawn only when the list changed, so a button is never replaced under the mouse */
    const sig = alTab + '|' + call(() => lsAlarms.list().map(a => a.k + (a.ack ? 1 : 0) + (a.rtn ? 1 : 0)).join(), '') + '|' + call(() => lsEvents.length, 0);
    if (sig === alSig) return;
    alSig = sig;
    al.textContent = '';
    const hd = E('div', 'schd'),
      tabs = E('div', 'sctabs');
    tabs.setAttribute('role', 'tablist');
    const tb = (k, t) => {
      const b = E('button', alTab === k ? 'on' : '', t);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(alTab === k));
      b.onclick = () => ((alTab = k), (alSig = ''), fillAl());
      tabs.append(b);
    };
    const AL = call(() => lsAlarms.list().filter(a => !a.rtn && !a.sd), []).reverse(),
      un = AL.filter(a => !a.ack).length;
    tb('alarms', 'Alarms ' + AL.length);
    tb('events', 'Events ' + call(() => lsEvents.length, 0));
    const x = E('button', 'scx', '✕');
    x.type = 'button';
    x.title = 'Close (Esc)';
    x.setAttribute('aria-label', 'Close');
    x.onclick = () => (al.hidden = true);
    hd.append(tabs, x);
    al.append(hd);
    const body = E('div', 'scbody');
    if (alTab === 'alarms') {
      const ackAll = E('button', 'scack', 'Acknowledge all (' + un + ')');
      ackAll.type = 'button';
      ackAll.disabled = !un;
      ackAll.onclick = () => (call(() => lsAlarms.ack()), (alSig = ''), fillAl());
      al.append(ackAll);
      if (!AL.length) body.append(E('p', 'scnone', 'No alarm'));
      for (const a of AL) {
        const r = E('div', 'scrow' + (a.ack ? '' : ' new') + (a.kind === 'TRIP' ? ' trip' : ''));
        r.append(E('span', 'sct', a.t || ''), E('span', 'scn', (a.nm || '') + ' ' + (a.lv || '')));
        if (!a.ack) {
          const b = E('button', '', 'Acknowledge');
          b.type = 'button';
          b.onclick = () => (call(() => lsAlarms.ack(a.k)), (alSig = ''), fillAl());
          r.append(b);
        } else r.append(E('span', 'scs', 'acknowledged'));
        body.append(r);
      }
    } else {
      const L = call(() => lsEvents.slice(0, 300), []);
      if (!L.length) body.append(E('p', 'scnone', 'No event yet'));
      for (const e of L) {
        const r = E('div', 'scrow ev');
        r.append(E('span', 'sct', e.t || ''), E('span', 'sck2', e.kind || ''), E('span', 'scn', (e.sh && e.sh !== 'DCS' ? e.sh + ': ' : '') + (e.text || '')));
        if (e.why) r.title = e.why;
        body.append(r);
      }
    }
    al.append(body);
  }

  /* ---------- start screen ---------- */
  const STATES = [
    ['Cold', 'loadcold', 'Start-up from zero: drum 0 kg/cm², bed and water 30 °C'],
    ['Warm', 'loadwarm', 'Warm restart: drum 40 kg/cm², bed about 360 °C'],
    ['Hot', 'loadhot', 'Hot restart: drum 100 kg/cm², bed about 700 °C'],
    ['150 MW', 'load150', 'The unit at 150 MW (control-room snapshot)']
  ];
  function loadState(id) {
    return new Promise(ok => {
      let k = 0;
      const iv = setInterval(() => {
        const r = window.AN && AN.sheets && AN.sheets.length >= 54 && AN.loadStart;
        if (!r && ++k < 240) return;
        clearInterval(iv);
        const b = r && document.getElementById(id);
        if (b) b.click();
        ok();
      }, 250);
    });
  }
  function buildStart() {
    const st = E('div');
    st.id = 'scstart';
    st.setAttribute('role', 'dialog');
    st.setAttribute('aria-label', 'Start');
    const box = E('div', 'scsbox');
    box.append(E('h1', '', 'Unit 1 boiler and turbine simulator'), E('p', 'scsub', '460 t/h circulating fluidized bed boiler · 150 MW'));
    let sel = 'load150';
    const chips = E('div', 'scchips');
    chips.setAttribute('role', 'radiogroup');
    chips.setAttribute('aria-label', 'Start state');
    const cb = STATES.map(([t, id, w]) => {
      const b = E('button', id === sel ? 'on' : '', t);
      b.type = 'button';
      b.title = w;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(id === sel));
      b.onclick = () => {
        sel = id;
        cb.forEach(x => {
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-checked', String(x === b));
        });
      };
      chips.append(b);
      return b;
    });
    const cards = E('div', 'sccards');
    const card = (t, d, fn) => {
      const b = E('button', 'sccard');
      b.type = 'button';
      b.append(E('b', '', t), E('span', '', d));
      b.onclick = fn;
      cards.append(b);
    };
    const go = toEng => {
      close();
      /* Mina beta.210: the old "No starting state picked" question showed behind the loading bar: the state is picked here */
      if (window.AN) AN._askNo = 1;
      stale = true;
      loadState(sel).then(() => (toEng ? window.lsSetTab && lsSetTab('logic') : showOv()));
    };
    card('Operator', 'Run the plant from the overview and its pages, with the training guide', () => go(false));
    card('Engineer', 'Read and trace the control logic, signals and I/O of the same running plant', () => go(true));
    const lab = E('div', 'sclab', 'Start state');
    const cont = E('button', 'sccont');
    cont.type = 'button';
    cont.disabled = true;
    cont.append(E('b', '', 'Continue'), E('span', '', 'Looking for a save point…'));
    let last = null;
    call(() =>
      lsSaves
        .list()
        .then(L => {
          last = L && L.length ? L[L.length - 1] : null;
          cont.lastChild.textContent = last ? 'last save point: ' + last.name : 'no save point yet (SAVE one from the Instructor)';
          cont.disabled = !last;
        })
        .catch(() => (cont.lastChild.textContent = 'no save point yet'))
    );
    cont.onclick = () => {
      if (!last) return;
      close();
      if (window.AN) AN._askNo = 1;
      stale = true;
      let k = 0;
      const iv = setInterval(() => {
        const r = window.AN && AN.sheets && AN.sheets.length >= 54 && window.DITL150;
        if (!r && ++k < 240) return;
        clearInterval(iv);
        if (r) call(() => lsSaves.load(last).then(showOv));
      }, 250);
    };
    const foot = E('div', 'scsfoot');
    const gear = E('button', 'scgear', 'Settings');
    gear.type = 'button';
    gear.title = 'Settings of the app';
    gear.onclick = () => {
      close();
      const g = document.querySelector('#crrail .gs-set > button');
      if (g) setTimeout(() => g.click(), 50);
    };
    const skip = E('button', 'scskip', 'Open without a start state');
    skip.type = 'button';
    skip.onclick = close;
    /* Mina beta.209: "Old layout" moved here from the strip (there it reloaded a running plant); no plant runs yet on this screen */
    const old = E('button', 'scskip', 'Old layout');
    old.type = 'button';
    old.title = 'The old layout of the app (the new one comes back with the link ?shell=c)';
    old.onclick = () => {
      try {
        localStorage.removeItem('ls-shell');
      } catch (e) {}
      location.search = location.search.replace(/([?&])shell=c&?/, '$1').replace(/[?&]$/, '');
    };
    /* Mina beta.210: no version on the start screen (APP_VERSION is not a global): the version of the page title "Logic Sim v…" */
    const vm = /v(\d+\.\d+\.\d+(?:-beta\.\d+)?)/.exec(document.title || ''),
      ver = E('span', 'scver', vm ? 'Version ' + vm[1] : '');
    foot.append(gear, skip, old, ver);
    box.append(cards, lab, chips, cont, foot);
    st.append(box);
    document.body.append(st);
    function close() {
      st.remove();
    }
    setTimeout(() => call(() => cards.firstChild.focus()), 50);
  }

  /* Mina beta.210: the old Home showed for about 1 s before the start screen: a plain cover in the colour of the start screen until it is built */
  const cover = E('div');
  cover.id = 'scboot';
  const putCover = () => document.body && !document.getElementById('scboot') && document.body.append(cover);
  if (document.body) putCover();
  else document.addEventListener('DOMContentLoaded', putCover);
  setTimeout(() => cover.remove(), 30000);
  /* wait for the new strip (shellc.js) and the app */
  let n = 0;
  const iv = setInterval(() => {
    if (!document.getElementById('scstrip') || !window.LS_LIVE) {
      if (++n > 80) clearInterval(iv);
      return;
    }
    clearInterval(iv);
    buildOv();
    buildAl();
    buildStart();
    cover.remove();
    setInterval(() => {
      tickOv();
      fillAl();
    }, 1000);
  }, 250);
})();
