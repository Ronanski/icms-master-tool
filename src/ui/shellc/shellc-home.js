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
  /* the 9 systems of the unit: the page each opens (the Plant view pages of hmi-mock-*.js) and its values (the Training reader).
     UNIT FLOW overview (user 2026-11-09 "bahala ka, basta ireshell niyo"; Jennie's sketch, artifact 4ihKkopvcTx4Z6s5vJ1cSc): each system
     is a block at its place in the flow of the unit (c = column, r = row of the flow grid). g = the pages of its group: their tripped
     machines and active alarms turn the block red. The grouping of the other pages (by their titles) is a layout choice of the shell */
  const TILES = [
    { k: 'coal', t: 'Coal, limestone and sand', pg: 'MK12', c: 1, r: 1, g: ['MK12'], v: [['Total coal flow', 'coal', 't/h', 1]] },
    { k: 'air', t: 'Air and flue gas', pg: 'MK09', c: 1, r: 2, g: ['MK09', 'AFG', 'APH'], v: [['Total air flow', 'AIR', 't/h', 1], ['Furnace pressure', 'FP', 'mmH₂O', 0], ['Flue gas oxygen', 'O2', '%', 1]] },
    { k: 'ash', t: 'Ash and precipitator', pg: 'MK14', c: 1, r: 3, g: ['MK14'], v: [] },
    { k: 'boil', t: 'Boiler and drum', pg: 'MK07', c: 2, r: '1 / span 2', g: ['MK07', 'MK10', 'MK11', 'MK15', 'BIAS'], v: [['Bed temperature', 'Tb', '°C', 0], ['Drum level', 'lvl', 'mm', 0], ['Drum pressure', 'Pd', 'kg/cm²', 1]] },
    { k: 'fw', t: 'Feedwater', pg: 'MK06', c: 2, r: 3, g: ['MK06', 'MK16'], v: [['Feedwater flow', 'FW', 't/h', 1], ['Main steam flow', 'MSF', 't/h', 1]] },
    { k: 'tb', t: 'Steam and turbine', pg: 'MK13', c: 3, r: '1 / span 2', g: ['MK13', 'MK08', 'MK04', 'TO', 'MK18'], v: [['Main steam temperature', 'MST', '°C', 0], ['Main steam pressure', 'MSP', 'kg/cm²', 1], ['Turbine speed', 'rpm', 'rpm', 0]] },
    { k: 'cd', t: 'Condenser and condensate', pg: 'MK05', c: 3, r: 3, g: ['MK05'], v: [['Condenser pressure, absolute', () => U().cdP, 'kg/cm²', 3], ['Hotwell level', () => U().cdHw, 'mm', 0]] },
    { k: 'gen', t: 'Generator', pg: 'MK17', c: 4, r: '1 / span 2', g: ['MK17'], v: [['Load', 'MW', 'MW', 1]] },
    { k: 'cw', t: 'Cooling and seawater', pg: 'CWN', c: 4, r: 3, g: ['CWN', 'SW', 'CW', 'MK02', 'MU'], v: [] }
  ];
  /* the lines of the flow: from, to, the side of the "from" block it leaves (r right, l left, b bottom, t top), its name */
  const LINKS = [
    ['coal', 'boil', 'r', 'fuel'],
    ['air', 'boil', 'r', 'air'],
    ['air', 'ash', 'b', 'flue gas'],
    ['boil', 'tb', 'r', 'steam'],
    ['tb', 'gen', 'r', 'shaft'],
    ['gen', 'grid', 'r', 'power'],
    ['tb', 'cd', 'b', 'exhaust'],
    ['cd', 'fw', 'l', 'condensate'],
    ['fw', 'boil', 't', 'feedwater'],
    ['cw', 'cd', 'l', 'cooling']
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
      } else if (++k > 40) clearInterval(iv);
    }, 100);
  }

  /* Mina beta.213: the alarm list had no row for the turbine trip or the MFT (they are logic signals, not motor alarms of lsAlarms):
     the unit trips are rows of their own at the top (ABC-050 I.0400 turbine trip, I.000F MFT, the same as the trip pill), with their
     own Acknowledge; the strip counts the same rows (lsShellC.alarms) */
  const UACK = {},
    USEEN = {};
  function unitTrips() {
    const out = [];
    if (none()) return out;
    let tt = 0,
      mft = 0;
    try {
      const l = AN.unit && AN.unit.vtrip;
      tt = l && +l.S.rt.v[l.n] > 0.5 ? 1 : 0;
    } catch (e) {}
    try {
      mft = +LS_LIVE.val("I.000F") > 0.5 ? 1 : 0;
    } catch (e) {}
    const clk = () => call(() => (lsEvents[0] && lsEvents[0].t) || "", "");
    for (const [k, on, nm] of [["U|TT", tt, "TURBINE TRIP (ABC-050 I.0400)"], ["U|MFT", mft, "MASTER FUEL TRIP (MFT, I.000F)"]]) {
      if (!on) {
        delete UACK[k];
        delete USEEN[k];
        continue;
      }
      if (!USEEN[k]) USEEN[k] = clk();
      out.push({ k, nm, lv: "", t: USEEN[k], kind: "TRIP", ack: !!UACK[k], unit: 1 });
    }
    return out;
  }
  function allAlarms() {
    /* Mina, live test of 269: the unit trips stayed on top of newer alarms: every list is in time order (the readers reverse it, newest first) */
    const sec = a => String(a.t || '').split(':').reduce((n, x) => n * 60 + (+x || 0), 0);
    return [...call(() => lsAlarms.list().filter(a => !a.rtn && !a.sd), []), ...unitTrips()].sort((a, b) => sec(a) - sec(b));
  }
  const ackOne = a => (a.unit ? (UACK[a.k] = 1) : call(() => lsAlarms.ack(a.k)));
  const ackAllU = () => {
    for (const a of unitTrips()) UACK[a.k] = 1;
    call(() => lsAlarms.ack());
  };
  window.lsShellC = Object.assign(window.lsShellC || {}, { alarms: allAlarms });

  /* ---------- overview ---------- */
  let ov = null,
    crumb = null,
    tiles = [],
    almTile = null,
    lines = null;
  const NS = 'http://www.w3.org/2000/svg';
  function buildOv() {
    ov = E('div');
    ov.id = 'scov';
    ov.setAttribute('role', 'region');
    ov.setAttribute('aria-label', 'Overview of the unit');
    const bar = E('div', 'scbar');
    bar.append(E('span', 'scbc', 'Plant'), E('span', 'scsep', '›'), E('b', '', 'Overview'));
    const grid = E('div', 'scflow');
    grid.setAttribute('aria-label', 'The unit as one flow: fuel and air to the boiler, steam to the turbine, power to the grid, the water back to the boiler');
    lines = document.createElementNS(NS, 'svg');
    lines.setAttribute('class', 'scflines');
    lines.setAttribute('aria-hidden', 'true');
    const defs = document.createElementNS(NS, 'defs'),
      mk = document.createElementNS(NS, 'marker'),
      ap = document.createElementNS(NS, 'path');
    for (const [k, v] of [['id', 'scfarrow'], ['viewBox', '0 0 10 10'], ['refX', '9'], ['refY', '5'], ['markerWidth', '6'], ['markerHeight', '6'], ['orient', 'auto']]) mk.setAttribute(k, v);
    ap.setAttribute('d', 'M0 0 L10 5 L0 10 z');
    mk.append(ap);
    defs.append(mk);
    lines.append(defs);
    grid.append(lines);
    tiles = TILES.map(T => {
      const b = E('button', 'sctile scfb');
      b.type = 'button';
      b.dataset.k = T.k;
      b.title = 'Open the ' + T.t + ' page';
      b.style.gridColumn = String(T.c);
      b.style.gridRow = String(T.r);
      const h = E('h3', '', T.t),
        kv = E('div', 'scfkv'),
        vs = T.v.map(([n, , u]) => {
          const v = E('b', '', '—');
          kv.append(E('span', '', n), v);
          v.dataset.u = u;
          return v;
        });
      const lamp = E('div', 'sclamp');
      b.append(h);
      if (T.v.length) b.append(kv);
      b.append(lamp);
      b.onclick = () => openPage(T.pg);
      grid.append(b);
      return { b, vs, lamp };
    });
    const end = E('div', 'scfend', 'To the grid');
    end.dataset.k = 'grid';
    end.style.gridColumn = '5';
    end.style.gridRow = '1 / span 2';
    grid.append(end);
    almTile = E('button', 'sctile scalm scfalm');
    almTile.type = 'button';
    almTile.title = 'Open the alarm list';
    almTile.onclick = () => openAl('alarms');
    ov.append(bar, grid, almTile);
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
    /* Mina, live test of 270: Operator with Loop check open left the Engineer tabs and the panel over the overview */
    call(() => lsShellC.engTool && lsShellC.engTool('logic'));
    if (window.lsSetTab && document.body.dataset.tab !== 'operate') lsSetTab('operate');
    document.body.classList.add('scov');
  }
  function hideOv() {
    document.body.classList.remove('scov');
  }
  window.lsShellC = Object.assign(window.lsShellC || {}, { showOv, hideOv, openPage });
  /* the page of the sheet of an alarm point (cached; the same rule as the Engineer mode, shellc-eng.js pageOf): a digital sheet = the
     page whose machine is drawn on it; an analog sheet = the page with the most of its tags */
  const PGS = {};
  const base = n => String(n || '').replace(/^\(\w+\)/, '').trim();
  const nz = x =>
    String(x || '')
      .toUpperCase()
      .split('.')[0]
      .replace(/[^A-Z0-9]/g, '');
  /* the tags each page shows (its transmitter values data-v and its controllers ctl / io) */
  let PTAGS = null;
  function pageTags() {
    if (PTAGS) return PTAGS;
    const defs = call(() => LS_MOCK.defs, []) || [];
    if (!defs.length) return [];
    PTAGS = defs.map(d => {
      const T = new Set();
      for (const m of String(d.art || '').matchAll(/data-v="([^"|]+)"/g)) T.add(nz(m[1]));
      for (const k in d.mach || {}) {
        const m = d.mach[k];
        if (m.ctl) T.add(nz(m.ctl));
        if (m.io) T.add(nz(m.io));
      }
      return { id: d.id, T };
    });
    return PTAGS;
  }
  /* the page of an alarm: the page that shows its tag (the first word of its name, PIST10013 ...), else the page of its sheet */
  const TGP = {};
  function pageOfAlarm(a) {
    const tg = nz(String(a.nm || '').split(/\s/)[0]);
    if (tg.length >= 5) {
      if (!(tg in TGP) && pageTags().length) {
        const hit = pageTags().filter(p => p.T.has(tg)).map(p => p.id);
        /* a tag drawn on a page of the block's own group first (the first hit of the page list otherwise) */
        TGP[tg] = hit.find(id => TILES.some(T => T.pg === id)) || hit[0] || null;
      }
      if (TGP[tg]) return TGP[tg];
    }
    return pageOfSheet(a.sh);
  }
  /* the words of an analog sheet title and the block they belong to (first match wins; a layout choice of the shell, by the titles) */
  const TITLEKEY = [
    [/ASH|PRECIPITATOR/, 'MK14'],
    [/CONDENS|HOTWELL|LPH|GLAND/, 'MK05'],
    [/FEED ?WATER|DEAERATOR|HPH|ECONOMI/, 'MK06'],
    [/COOLING|SEA ?WATER|CIRCULATING|MAKE-?UP/, 'CWN'],
    [/GENERATOR|EXCIT/, 'MK17'],
    [/TURBINE|BYPASS|EXTRACTION|REHEAT/, 'MK13'],
    [/COAL|LIMESTONE|SAND|FEEDER|MILL/, 'MK12'],
    [/AIR|FAN|FURNACE PRESSURE|FLUE|OXYGEN|O2/, 'MK09'],
    [/DRUM|BOILER|BED|BURNER|COMBUST|FUEL|STEAM|SPRAY|SUPERHEAT/, 'MK07']
  ];
  function pageOfSheet(sh) {
    const b = base(sh);
    if (!b) return null;
    if (b in PGS) return PGS[b];
    const defs = call(() => LS_MOCK.defs, []) || [];
    let pg = null;
    for (const d of defs) {
      for (const id in d.mach || {}) {
        const m = d.mach[id],
          L = [m.d, m.mov, m.sti && m.sti[0], m.sto && m.sto[0], m.ad && !/@/.test(m.ad) ? call(() => LS_DOCK.dName(LS_DOCK.dOf(m.ad)), null) : null];
        if (L.some(x => x && base(x) === b)) {
          pg = d.id;
          break;
        }
      }
      if (pg) break;
    }
    if (!pg && /^ABC/.test(b)) {
      const sht = call(() => AN.sheets.find(x => base(x.name) === b), null),
        S0 = sht && sht.S;
      /* the title of the sheet names its system (ABC-052 "LP TURBINE BYPASS STEAM CONTROL", ABC-038 "NO.2 LPH LEVEL CONTROL") */
      const ttl = String((sht && sht.title) || '').toUpperCase(),
        bt = ttl && TITLEKEY.find(([re]) => re.test(ttl));
      if (bt) {
        PGS[b] = bt[1];
        return bt[1];
      }
      if (!S0 || !S0.nets) return null; /* not read yet: ask again at the next tick */
      const tags = new Set();
      for (let n = 0; n < S0.nets.length; n++) {
        const t = nz(call(() => AN.nm(S0, n), ''));
        if (t.length >= 5) tags.add(t);
      }
      let bn = 0;
      for (const p of pageTags()) {
        let n = 0;
        for (const t of p.T) if (tags.has(t)) n++;
        if (n > bn) ((bn = n), (pg = p.id));
      }
    }
    PGS[b] = pg;
    return pg;
  }
  /* the lines between the blocks, from their places on screen: flat, one width, an arrow at the end, no motion */
  let lineKey = '';
  function drawLines() {
    if (!lines || !document.body.classList.contains('scov')) return;
    const box = lines.parentElement.getBoundingClientRect(),
      R = {};
    if (!box.width) return;
    for (const el of lines.parentElement.querySelectorAll('[data-k]')) {
      const r = el.getBoundingClientRect();
      /* a hidden block ("To the grid" beside the Training dock) has no line */
      if (!r.width) continue;
      R[el.dataset.k] = { l: r.left - box.left, t: r.top - box.top, r: r.right - box.left, b: r.bottom - box.top };
    }
    const key = Math.round(box.width) + 'x' + Math.round(box.height) + JSON.stringify(R);
    if (key === lineKey) return;
    lineKey = key;
    lines.setAttribute('width', Math.round(box.width));
    lines.setAttribute('height', Math.round(box.height));
    lines.setAttribute('viewBox', '0 0 ' + Math.round(box.width) + ' ' + Math.round(box.height));
    for (const p of lines.querySelectorAll('.scfl, text')) p.remove();
    const mid = (a, b) => (a + b) / 2,
      /* the shared span of two blocks (the line runs straight through it) */
      over = (a0, a1, b0, b1) => mid(Math.max(a0, b0), Math.min(a1, b1));
    for (const [f, to, side, name] of LINKS) {
      const a = R[f],
        b = R[to];
      if (!a || !b) continue;
      let d, lx, ly, anc;
      if (side === 'r' || side === 'l') {
        const y = Math.round(over(a.t, a.b, b.t, b.b)),
          x0 = side === 'r' ? a.r : a.l,
          x1 = side === 'r' ? b.l : b.r;
        d = 'M' + x0 + ' ' + y + ' H' + x1;
        lx = mid(x0, x1);
        ly = y - 5;
        anc = 'middle';
      } else {
        const x = Math.round(over(a.l, a.r, b.l, b.r)),
          y0 = side === 'b' ? a.b : a.t,
          y1 = side === 'b' ? b.t : b.b;
        d = 'M' + x + ' ' + y0 + ' V' + y1;
        lx = x + 6;
        ly = mid(y0, y1) + 4;
        anc = 'start';
      }
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('class', 'scfl');
      p.setAttribute('d', d);
      p.setAttribute('marker-end', 'url(#scfarrow)');
      lines.append(p);
      if (name) {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', Math.round(lx));
        t.setAttribute('y', Math.round(ly));
        t.setAttribute('text-anchor', anc);
        t.textContent = name;
        lines.append(t);
        /* a name wider than the gap between two blocks is left out (the arrow says the direction, the block names say the rest) */
        if (anc === 'middle' && call(() => t.getComputedTextLength(), 0) > (side === 'r' ? b.l - a.r : a.l - b.r) - 8) t.remove();
      }
    }
  }
  addEventListener('resize', () => ((lineKey = ''), drawLines()));
  /* a start state or save point loaded (and not run yet): the lamps wait for the first scan */
  let stale = false,
    lastSS = null;
  function tickOv() {
    if (!ov) return;
    const ss = window.AN ? AN.startState : null;
    if (ss !== lastSS) (lastSS = ss), (stale = true);
    if (window.AN && AN.run && !AN.view) stale = false;
    const n0 = none();
    /* the active alarms (not back to normal, not suppressed: the same rows as the alarm list) by the page of their sheet; the unit trips
       go to the boiler (MFT) and to the turbine (turbine trip) */
    const byPg = {};
    if (!n0)
      for (const a of allAlarms()) {
        const p = a.unit ? (a.k === 'U|MFT' ? 'MK07' : 'MK13') : pageOfAlarm(a);
        if (p) (byPg[p] = byPg[p] || []).push(a);
      }
    /* the blocks read about 20 pages of machines: only while the overview is on screen (light app) */
    if (document.body.classList.contains('scov')) TILES.forEach((T, i) => {
      const t = tiles[i];
      T.v.forEach(([, k, u, d], j) => {
        const x = n0 ? NaN : gv(k),
          s = fmt(x, d) + (isFinite(x) ? ' ' + u : '');
        if (t.vs[j].textContent !== s) t.vs[j].textContent = s;
      });
      const m = n0 ? null : machines(T.pg),
        al = n0 ? [] : [].concat(...T.g.map(p => byPg[p] || [])),
        trips = n0 ? 0 : T.g.reduce((a, p) => a + ((p === T.pg ? m : machines(p)) || { trip: 0 }).trip, 0),
        hot = trips > 0 || al.length > 0;
      /* Jennie's rule 2: red (border and this one line) only with a tripped machine or an active alarm of the group */
      t.b.classList.toggle('hot', hot);
      let line = null,
        tip = 'Open the ' + T.t + ' page';
      if (hot) {
        const last = al[al.length - 1],
          txt = trips ? trips + ' tripped' + (al.length ? ' · ' + al.length + (al.length > 1 ? ' alarms' : ' alarm') : '') : al.length > 1 ? al.length + ' alarms · ' + (last.nm || '') : ((last.nm || '') + ' ' + (last.lv || '')).trim() || '1 alarm';
        line = [E('span', 'scfwarn', txt)];
        tip += '. ' + (trips ? trips + ' tripped. ' : '') + al.map(a => ((a.nm || '') + ' ' + (a.lv || '')).trim()).join('; ');
      } else if (stale && m && m.n) {
        /* Mina beta.210: after a start state loaded while paused the machine states of the drawings are not scanned yet */
        line = [E('span', 'dot none'), E('span', '', 'press Run to read the machines')];
      } else if (m && m.n) {
        /* the dot: RUN = red, STOP = green (COMMANDMENT 5); the block stays neutral */
        line = [E('span', 'dot ' + (m.run ? 'run' : 'stop')), E('span', '', m.run ? m.run + ' running' : 'all stopped')];
      }
      const sig = hot + '|' + (line ? line.map(x => x.className + x.textContent).join('|') : '');
      if (t.lamp.dataset.sig !== sig) {
        t.lamp.dataset.sig = sig;
        t.lamp.textContent = '';
        if (line) t.lamp.append(...line);
      }
      if (t.b.title !== tip) t.b.title = tip;
    });
    drawLines();
    /* the alarm tile: the newest six */
    const AL = allAlarms().slice(-6).reverse();
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
      nm = pk && pk.selectedOptions[0] ? pk.selectedOptions[0].textContent.trim() : '';
    if (crumb.lastChild.textContent !== nm) {
      crumb.lastChild.textContent = nm;
      crumb.lastChild.title = nm;
    }
  }

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
    window.addEventListener(
      'keydown',
      e => {
        if ((e.key === 'Escape' || e.key === 'Esc') && !al.hidden) al.hidden = true;
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
    const sig = alTab + '|' + allAlarms().map(a => a.k + (a.ack ? 1 : 0)).join() + '|' + call(() => lsEvents.length, 0);
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
    const AL = allAlarms().reverse(),
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
      ackAll.onclick = () => (ackAllU(), (alSig = ''), fillAl());
      al.append(ackAll);
      if (!AL.length) body.append(E('p', 'scnone', 'No alarm'));
      for (const a of AL) {
        const r = E('div', 'scrow' + (a.ack ? '' : ' new') + (a.kind === 'TRIP' ? ' trip' : ''));
        r.append(E('span', 'sct', a.t || ''), E('span', 'scn', (a.nm || '') + ' ' + (a.lv || '')));
        if (!a.ack) {
          const b = E('button', '', 'Acknowledge');
          b.type = 'button';
          b.onclick = () => (ackOne(a), (alSig = ''), fillAl());
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
    /* Giselle beta.221: with the app on the digital sheets (AN.cat 'dig', the last page was a DITL sheet) the analog sheets were never
       read, so this waited 60 s and loaded nothing. Like the Home page's Practise buttons (home.js abcReady): the analog sheets first,
       and no starting-state question meanwhile */
    try {
      AN._startPending = 1;
      if (AN.cat !== 'an') AN.setCat('an');
    } catch (e) {}
    return new Promise(ok => {
      let k = 0;
      const iv = setInterval(() => {
        const r = window.AN && AN.cat === 'an' && AN.sheets && AN.sheets.length >= 54 && AN.loadStart;
        if (r || k >= 239)
          try {
            if (!AN._gdWait) AN._startPending = 0;
          } catch (e) {}
        if (!r && ++k < 240) return;
        clearInterval(iv);
        const b = r && document.getElementById(id);
        if (b) b.click();
        ok();
      }, 250);
    });
  }
  function buildStart() {
    /* live check 2026-11-09: the old dark "No starting state picked" question showed on top of this start screen; the start state
       is picked here, so the old question is not asked by itself (the RUN press with no state still asks) */
    if (window.AN) AN._askNo = 1;
    call(() => document.getElementById('lsask').remove());
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
      /* Mina, live test of 271: a Training left on from before does not follow this new plant */
      call(() => LS_DOCK.quit());
      stale = true;
      /* Mina beta.264: Engineer from here was covered by the overview: it leaves the overview like the Engineer button of the bar */
      loadState(sel).then(() => {
        if (!toEng) return showOv();
        hideOv();
        if (window.lsSetTab) lsSetTab('logic');
      });
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
        if (k === 0) call(() => AN.cat !== 'an' && AN.setCat('an'));
        const r = window.AN && AN.cat === 'an' && AN.sheets && AN.sheets.length >= 54 && window.DITL150;
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
      const g = document.querySelector('#scstrip .scgearb') || document.querySelector('#crrail .gs-set > button');
      if (g) setTimeout(() => g.click(), 50);
    };
    const skip = E('button', 'scskip', 'Open without a start state');
    skip.type = 'button';
    /* Jennie's finding on 259: "Open without a start state" left the old Home page of the app (What do you want …, Starting state, Sheets
       you opened) under layout C. With no start state the Operator overview opens (an empty plant: the values read —); the start screen
       stays the one place to choose a start state */
    skip.onclick = () => {
      close();
      showOv();
    };
    /* Mina beta.209: "Old layout" moved here from the strip (there it reloaded a running plant); no plant runs yet on this screen */
    const old = E('button', 'scskip', 'Old layout');
    old.type = 'button';
    old.title = 'The old layout of the app (the new one comes back with the link ?shell=c)';
    old.onclick = () => {
      try {
        localStorage.setItem('ls-shell', 'old');
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
      /* live check beta.241: no 60 s limit, the strip can come later (a narrow first window) */
      ++n;
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
