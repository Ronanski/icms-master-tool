/* HX in the app (user 2026-11-17: "Ganyan ang HMI na gsto ko. Dapat iyan lang makita ko"): the adapter HX.data of README section 5 and
   the registration of every HX page as a page of the Plant view.
   ONE source of every number: the page never reads the simulator itself.
   - a value key      = the same link a temporary page uses for that tag (plant.js api.reg 'val': the logic transmitter first, else
                        the plant model key of the temporary page, LS_MOCK.defs[].unit), so both pages can never show two numbers;
   - a controller     = plant.js api.reg 'ctl' (PV, SV, MV, mode), click = the controller faceplate of the app;
   - a valve of a DITL sheet = the resolver of hmi-mock.js (position, AUTO / MANUAL, Y / N), read through a hidden page of
                        hmi-mock.js built from the bind of hx-registry.js; click = the two faceplates of fp-pop.js.
   Nothing here presses or forces anything: the faceplates do. */
(function () {
  if (!window.PLANT_V2 || !window.HX || !window.LS_MOCK || !HX.pages) return;
  const NS = 'http://www.w3.org/2000/svg',
    R = window.HXREG || { machines: {}, loops: {}, sample: { valves: {} } };
  const call = (f, d) => {
    try {
      const r = f();
      return r == null ? d : r;
    } catch (e) {
      return d;
    }
  };
  const fin = x => (x != null && isFinite(x) ? +x : null);
  const unitKey = tag => {
    for (const d of LS_MOCK.defs) if (d.unit && d.unit[tag]) return d.unit[tag];
    return null;
  };
  /* the sheet and tag of a valve: hx-registry.js (what the temporary pages bind) */
  const bindOf = tag => {
    const m = R.machines[tag],
      v = (R.sample && R.sample.valves && R.sample.valves[tag]) || null;
    if (m && m.bind && m.bind.mov) return { mov: m.bind.mov, tg: m.bind.tg || tag, t: m.t || tag };
    if (v && v.bind) return { mov: v.bind, tg: tag, t: tag };
    return null;
  };
  let S = null; /* the store of the page that is open: one page of the Plant view at a time */
  let lastXY = [200, 200];
  document.addEventListener('pointerdown', e => (lastXY = [e.clientX, e.clientY]), true);
  function store(api, g) {
    const st = { api, LOG: {}, PM: {}, CT: {}, vals: new Set(), loops: {}, valves: {}, machs: {}, px: null, pm: {} };
    /* hidden holder of the click targets of the controllers and of the page of hmi-mock.js that resolves the valves */
    st.px = document.createElementNS(NS, 'g');
    st.px.setAttribute('opacity', '0');
    st.px.setAttribute('aria-hidden', 'true');
    g.append(st.px);
    return st;
  }
  const needVal = key => S && S.vals.add(key);
  const needLoop = tag => {
    if (!S || S.loops[tag]) return;
    const st = S,
      hit = document.createElementNS(NS, 'rect');
    hit.setAttribute('width', '1');
    hit.setAttribute('height', '1');
    st.px.append(hit);
    st.loops[tag] = hit;
    st.api.reg({ t: 'ctl', tag }, X => (st.CT[tag] = X || null), hit);
  };
  const needValve = tag => S && !(tag in S.valves) && (S.valves[tag] = bindOf(tag));
  /* a machine (pump, fan ...): the SAME description the temporary page has for it (LS_MOCK.defs: its DITL sheet, I/O tag, lube oil
     pumps ...), found by the page and id of hx-registry.js, so state, mode, Y / N and both faceplates are the ones of that page */
  const machDef = name => {
    const m = R.machines[name],
      d = m && LS_MOCK.defs.find(x => x.id === m.page);
    return (d && d.mach && d.mach[m.id]) || null;
  };
  const needMach = name => S && !(name in S.machs) && (S.machs[name] = machDef(name));
  /* after the first pass of the page (every key it asks is known): the hidden page of hmi-mock.js for its valves */
  function proxy() {
    const mach = {},
      unit = {};
    let art = '';
    /* values: [data-v] of hmi-mock.js (the logic transmitter, else the plant model key, 'tt:' and 'ux:' keys of the temporary pages) */
    for (const key of S.vals) {
      const u = unitKey(key);
      if (u) unit[key] = u;
      art += '<text data-v="' + key + '" data-dp="6"></text>';
    }
    for (const tag in S.valves) {
      const b = S.valves[tag];
      if (!b) continue;
      mach[tag] = { n: tag, t: b.t, mov: b.mov, tg: b.tg };
      art +=
        '<text data-mov="' +
        b.mov +
        '|' +
        b.tg +
        '|pct" data-hxp="' +
        tag +
        '"></text>' +
        '<text data-mov="' +
        b.mov +
        '|' +
        b.tg +
        '|am" data-hxm="' +
        tag +
        '"></text>' +
        '<text data-ynt="' +
        tag +
        '" data-hxy="' +
        tag +
        '"></text>' +
        '<rect data-hit="' +
        tag +
        '" width="1" height="1"/><rect data-yn="' +
        tag +
        '" width="1" height="1"/>';
    }
    for (const name in S.machs) {
      if (!S.machs[name]) continue;
      mach[name] = S.machs[name];
      art +=
        '<text data-st="' +
        name +
        '" data-hxs="' +
        name +
        '"></text><text data-md="' +
        name +
        '" data-hxd="' +
        name +
        '"></text>' +
        '<text data-ynt="' +
        name +
        '" data-hxy="' +
        name +
        '"></text>' +
        '<rect data-hit="' +
        name +
        '" width="1" height="1"/><rect data-yn="' +
        name +
        '" width="1" height="1"/>';
    }
    if (!art) return;
    const g2 = document.createElementNS(NS, 'g');
    S.px.append(g2);
    S.pm = { g: g2 };
    call(() => LS_MOCK.page({ id: 'HXP', title: '', w: 10, h: 10, art, mach, unit })(g2, S.api));
  }
  const pq = sel => (S && S.pm.g ? S.pm.g.querySelector(sel) : null);
  /* the faceplate of fp-pop.js opens beside the element that was clicked: the hidden click target is moved under the pointer first */
  const under = el => {
    const m = call(() => el.parentNode.getScreenCTM().inverse(), null);
    if (!m) return;
    const p = new DOMPoint(lastXY[0], lastXY[1]).matrixTransform(m);
    el.setAttribute('x', p.x);
    el.setAttribute('y', p.y);
  };
  const click = el =>
    el &&
    (under(el), true) &&
    el.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, clientX: lastXY[0], clientY: lastXY[1] })
    );
  HX.data = {
    time: () => call(() => (window.AN && AN.unit && isFinite(AN.unit.t) ? AN.unit.t : null), Date.now() / 1000),
    value(key) {
      needVal(key);
      const e = pq('[data-v="' + key + '"]'),
        t = e ? e.textContent : '';
      return /^-?[0-9]/.test(t) ? parseFloat(t) : null;
    },
    machine(name) {
      needMach(name);
      const e = pq('[data-hxs="' + name + '"]');
      if (!e) return null;
      const t = e.textContent || '',
        md = (pq('[data-hxd="' + name + '"]') || {}).textContent || '',
        y = (pq('[data-hxy="' + name + '"]') || {}).textContent || '';
      return {
        st: t === 'RUNNING' ? 'run' : t === 'STOPPED' ? 'stop' : t === 'TRIP' ? 'trip' : null,
        /* a part the page of hmi-mock.js cannot tell (a machine without an AUTO selection) is left out */
        mode:
          md
            .split(' · ')
            .filter(x => x && x !== '-----')
            .join(' · ') || null,
        perm: y === 'Y' ? true : y === 'N' ? false : null
      };
    },
    loop(tag) {
      needLoop(tag);
      const X = S && S.CT[tag];
      if (!X) return null;
      const u = (R.loops[tag] && R.loops[tag].s && R.loops[tag].s.unit) || '';
      return {
        pv: fin(X.pv),
        sv: fin(X.sv),
        mv: fin(X.mv),
        mode: X.m === 'M' ? 'MANUAL' : X.m === 'R' ? 'REMOTE' : X.m === 'A' ? 'AUTO' : null,
        unit: u
      };
    },
    valve(tag) {
      needValve(tag);
      const p = pq('[data-hxp="' + tag + '"]');
      if (!p) return null;
      const m = /-?\d+(?:\.\d+)?/.exec(p.textContent || ''),
        pct = m ? +m[0] : null,
        am = (pq('[data-hxm="' + tag + '"]') || {}).textContent || '',
        y = (pq('[data-hxy="' + tag + '"]') || {}).textContent || '';
      return {
        pct,
        open: pct == null ? null : pct > 0.5,
        mode: /^AUTO/.test(am) ? 'AUTO' : /^MANUAL/.test(am) ? 'MANUAL' : null,
        perm: y === 'Y' ? true : y === 'N' ? false : null
      };
    },
    flag: () => null,
    open(kind, id, second) {
      if (kind === 'loop') return click(S && S.loops[id]);
      click(pq(second ? '[data-yn="' + id + '"]' : '[data-hit="' + id + '"]'));
    }
  };
  /* one HX page = one page of the Plant view: the HTML page of HX inside the 1920 x 1000 frame of the Plant view */
  const FW = 1920,
    FH = 1140;
  function screen(def) {
    return function (g, api) {
      S = store(api, g);
      const fo = document.createElementNS(NS, 'foreignObject');
      for (const [a, v] of Object.entries({ x: 0, y: 0, width: FW, height: FH })) fo.setAttribute(a, v);
      const host = document.createElement('div');
      host.className = 'hx-app';
      fo.append(host);
      g.append(fo);
      const h = HX.mount(host, def.id, { noTimer: true, go: id => call(() => window.lsPlant && lsPlant('HX-' + id)) });
      /* every view once, so each key the page reads is linked before plant.js resolves the links of the page */
      for (const v of ['controls', 'trends', 'process']) call(() => h.show(v));
      proxy();
      const t = setInterval(() => {
        if (!host.isConnected) return (clearInterval(t), call(() => h.destroy && h.destroy()));
        call(() => h.tick());
      }, 500);
      return fo;
    };
  }
  const L = (window.PLANT_SYS = window.PLANT_SYS || []);
  HX.pages.forEach((def, i) => {
    const id = 'HX-' + def.id;
    PLANT_V2.screens[id] = screen(def);
    L.splice(i, 0, {
      fitAll: 1,
      id,
      title: def.title,
      num: 'R' + String(i + 1).padStart(2, '0'),
      name: def.title.toUpperCase(),
      src: '',
      w: FW,
      h: FH,
      v2: true,
      screen: id,
      style: 'steel',
      items: [],
      hx: true
    });
  });
  window.LS_HX = { pages: () => HX.pages.map(p => p.id), store: () => S };
})();
