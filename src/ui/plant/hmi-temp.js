/* TEMPORARY HMI PAGES (user 2026-11-03: "Yung mga HMI na wala, gawan nyo muna temporary para may matesting si tester Mina. Huwag nyo na
   paaprub sa akin. Basta may HMI na temporary kahit hindi maganda. Basta magtuloy-tuloy lang ang testing").
   One page per group of PR-OPE-5002 sections that the live test (Cold -> 150 MW) needs and that has no new HMI page yet. The content is
   NOT drawn by hand: each page reads the Training steps of its sections (LS_GUIDE.steps(), guide.js) and shows their equipment with the
   SAME tags, addresses and calls as the Training dock:
   - a motor of a step (its address, M.xxxx or the DITL sheet) = a symbol, red = running, green = stopped, blinking = trip
     (LS_DOCK.mst), click = its floating motor faceplate (fp-pop.js LS_FPOP.hit, #57);
   - a controller / valve / MAN station of a step (fps) = a box with PV / SV / MV and A / M / R (LS_LIVE), click = its faceplate
     (plant.js fpOpen, the one of every Plant page);
   - a CRT push button of a drawing (dg: DITL sheet + row) = a DCS button (the same dPress of the dock), lit when its step reads done;
   - a FIELD action (no DCS signal) = a FIELD button, logged in Events as "Field operator";
   - a TCS operation (turbine control system screen, no DCS logic) = a TCS button.
   The values are the simulation, never a snapshot number. Each page is replaced by its new HMI page (approved mockup) when that is built;
   then its entry is deleted here. */
(function () {
  if (!window.PLANT_V2) return;
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    run: '#d64545',
    stop: '#3fa34d',
    none: '#6b7480',
    nm: '#d3dbe2',
    dim: '#8b97a3',
    val: '#e8eef3',
    card: '#11171d',
    cs: '#2c3640',
    man: '#ffd27a',
    aut: '#9ff0c4',
    rem: '#8fc7ff'
  };
  /* [id, list title, page heading, PR-OPE-5002 sections (guide.js sec)] */
  const PAGES = [
    ['TCF', 'TEMP 028 CONDENSATE & FEEDWATER', 'CONDENSATE, DEAERATOR AND FEEDWATER', [18, 19, 20]],
    ['TDO', 'TEMP 006 DIESEL OIL', 'DIESEL OIL SYSTEM (START-UP BURNER OIL)', [21]],
    [
      'TFN',
      'TEMP FANS (ID, FA, SA, PA)',
      'ID FAN, FLUIDIZING AIR BLOWER, SECONDARY AND PRIMARY AIR FANS',
      [22, 23, 24, 25]
    ],
    ['TPG', 'TEMP PURGE & SOOT BLOWER', 'FURNACE PURGE AND AIR HEATER SOOT BLOWER', [26, 27]],
    ['TBR', 'TEMP 012-015 BURNERS & STEAM', 'START-UP BURNERS A ~ D, MAIN STEAM, DRUM PRESSURE AND LEVEL', [28]],
    [
      'TTA',
      'TEMP TURBINE AUXILIARIES',
      'TURBINE AUXILIARIES: TCS OIL, TURNING GEAR, AUX STEAM, GLAND, VACUUM, BYPASS',
      [14, 30, 31, 33, 35]
    ],
    [
      'TTS',
      'TEMP TURBINE START (ATS)',
      'TURBINE START: ATS STEPS, SYNCHRONIZING, INITIAL LOAD, FEEDWATER CHANGE-OVER',
      [41, 42]
    ],
    ['TCC', 'TEMP 011 / 033 COAL & CCS', 'COAL FEEDERS AND COMBUSTION / COORDINATED CONTROL', [44, 47]]
  ];
  const call = (f, d) => {
    try {
      const r = f();
      return r === undefined ? d : r;
    } catch (e) {
      return d;
    }
  };
  const esc = s =>
    String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fmt = (x, dp = 1) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp));
  const D = () => window.LS_DOCK,
    LV = () => window.LS_LIVE,
    G = () => window.LS_GUIDE;
  /* the kind of a step action (guide.js mot / pbB / fldB / btn) */
  const kind = a =>
    a.ad && !a.dg && /^START /.test(a.l || '')
      ? 'mot'
      : a.dg
        ? 'dg'
        : a.loc || /^\s*FIELD\b/.test(a.l || '')
          ? 'fld'
          : /TCS|ATS|TURNING GEAR|GLAND STEAM|VACUUM UP|WARMING|PREPARATION|RUB CHECK|ACCELERATION|EXCITATION|SYNCH|LOAD UP|NORMAL OPERATION|PUMP START|EXTRACTOR START|^\s*(START|STOP) /i.test(
                a.l || ''
              ) && !/^\s*(A|M|R)\b[ ,(]|MV|SV|▲|▼/.test(a.l || '')
            ? 'tcs'
            : /\(DITL-[^)]*\)/.test(a.l || '') && !/^\s*(A|M|R)\b[ ,(]|MV|SV|▲|▼/.test(a.l || '')
              ? 'dg'
              : null; /* a shortcut of the dock that sets a controller (A, SV 150 ...): done on the controller faceplate here */
  function page(P) {
    return function (g, api) {
      const pg = document.createElementNS(NS, 'g');
      pg.setAttribute('transform', 'translate(80 60)');
      const fo = document.createElementNS(NS, 'foreignObject');
      fo.setAttribute('width', 1760);
      fo.setAttribute('height', 900);
      pg.append(fo);
      g.append(pg);
      const root = document.createElement('div');
      root.className = 'tmpg';
      fo.append(root);
      const st = call(() => G().steps(), [])
        .map((s, i) => Object.assign({ n: i + 1 }, s))
        .filter(s => P[3].includes(s.sec));
      const mots = new Map(),
        ctls = new Map(),
        btns = [];
      let h = `<div class="tmpg-hd"><b>${esc(P[2])}</b><span>TEMPORARY PAGE · PR-OPE-5002 sections ${P[3].join(', ')} · same tags and faceplates as the Training steps · click a symbol or a box = its faceplate</span></div><div class="tmpg-grid">`;
      for (const s of st) {
        let it = '';
        for (const t0 of s.fps || []) {
          const t = call(() => LV().ctlTag(t0), null) || t0;
          if (!call(() => LV().fp(t), null)) continue;
          const k = 'c' + ctls.size;
          ctls.set(k, t);
          it += `<button type="button" class="tmpg-ctl" data-c="${k}" title="${esc(t)} · click = faceplate"><b>${esc(t0)}</b>${t !== t0 ? `<small>${esc(t)}</small>` : ''}<span data-v="${k}">PV ----- · SV ----- · MV -----</span><i data-m="${k}">-</i></button>`;
        }
        for (const a of s.a || []) {
          const kd = kind(a);
          if (kd === 'mot') {
            if (mots.has(a.ad)) continue;
            const n = String(a.l).replace(/^START\s+/, '');
            mots.set(a.ad, n);
            it += `<button type="button" class="tmpg-mot" data-ad="${esc(a.ad)}" title="${esc(n)} · ${esc(a.ad)} · click = faceplate"><svg viewBox="-16 -16 32 32" width="30" height="30"><circle r="13" fill="none" stroke-width="3" data-ring="${esc(a.ad)}"/><path d="M-6 -7 L8 0 L-6 7 Z" data-sym="${esc(a.ad)}"/></svg><b>${esc(n)}</b><small>${esc(a.ad)}</small><span data-st="${esc(a.ad)}">-----</span></button>`;
          } else if (kd) {
            const k = btns.length;
            btns.push(a);
            const lab = String(a.l || '').trim(),
              cls = kd === 'fld' ? 'fld' : kd === 'tcs' ? 'tcs' : 'dcs';
            it += `<button type="button" class="tmpg-pb ${cls}" data-b="${k}" title="${esc(kd === 'dg' ? (a.dg ? a.dg[0] + ' row ' + (a.dg[1] + 1) : (/\((DITL-[^)]*)\)/.exec(a.l) || [])[1] || 'DCS') : kd === 'fld' ? 'Field operator (no DCS signal)' : 'TCS screen (turbine control system)')}"><em>${kd === 'fld' ? 'FIELD' : kd === 'tcs' ? 'TCS' : 'DCS P.B.'}</em>${esc(lab.replace(/^FIELD:\s*/, ''))}</button>`;
          }
        }
        if (!it) continue;
        h += `<section class="tmpg-card"><header>Step ${s.n} · ${esc(s.t)}</header><div class="tmpg-its">${it}</div></section>`;
      }
      root.innerHTML = h + '</div>';
      const q = s => root.querySelector(s),
        qa = s => root.querySelectorAll(s);
      /* clicks: the same faceplates as the other Plant pages */
      qa('.tmpg-mot').forEach(b =>
        b.addEventListener('click', e => {
          e.stopPropagation();
          const ad = b.dataset.ad,
            M = { ad, n: mots.get(ad), t: ad, d: ad };
          if (window.LS_FPOP)
            LS_FPOP.hit(M, () => call(() => LS_FPOP.motor(M), null) || call(() => window.lsInfo(ad), null));
        })
      );
      qa('.tmpg-ctl').forEach(b =>
        b.addEventListener('click', e => {
          e.stopPropagation();
          api.fp(ctls.get(b.dataset.c));
        })
      );
      qa('.tmpg-pb').forEach(b =>
        b.addEventListener('click', e => {
          e.stopPropagation();
          const a = btns[+b.dataset.b],
            r = call(() => a.f(), '');
          if (r && window.msg) msg(r);
          setTimeout(tick, 200);
        })
      );
      /* registered for the dock's "Open faceplate" (fp-pop.js LS_FPOP.openAd) when no other page has the motor */
      const R = (window.LS_FPREG = window.LS_FPREG || {});
      for (const [ad, n] of mots)
        if (!R[ad] || !call(() => R[ad].el() && R[ad].el().isConnected, false))
          R[ad] = {
            open: () => q(`[data-ad="${ad}"]`) && q(`[data-ad="${ad}"]`).click(),
            el: () => q(`[data-ad="${ad}"]`),
            n
          };
      function tick() {
        if (!pg.isConnected) return;
        const blink = Math.floor(Date.now() / 500) % 2;
        for (const [ad] of mots) {
          const m = call(() => D().mst(ad), null),
            c = m === 'RUN' ? C.run : m === 'TRIP' ? (blink ? C.run : '#f59e0b') : m === 'STOP' ? C.stop : C.none,
            md = call(() => D().modeOf(ad), null) || {};
          const r = q(`[data-ring="${ad}"]`),
            y = q(`[data-sym="${ad}"]`),
            t = q(`[data-st="${ad}"]`);
          if (r) r.setAttribute('stroke', c);
          if (y) y.setAttribute('fill', c);
          if (t) {
            const x =
              (m || '-----') +
              (md.rem == null ? '' : md.rem ? ' · REM' : ' · LOC') +
              (md.au == null ? '' : md.au ? ' · AUTO' : ' · MAN');
            if (t.textContent !== x) t.textContent = x;
            t.style.color = c;
          }
        }
        for (const [k, t] of ctls) {
          const f = call(() => LV().fp(t), null);
          if (!f) continue;
          const pv = call(() => LV().pvOf(f), NaN),
            sv = call(() => LV().svOf(f), NaN),
            mv = call(() => LV().mvOf(f), NaN),
            md = call(() => LV().modeOf(f), '?'),
            v = q(`[data-v="${k}"]`),
            m = q(`[data-m="${k}"]`);
          const x =
            (isFinite(pv) ? 'PV ' + fmt(pv) + ' · ' : '') +
            (isFinite(sv) ? 'SV ' + fmt(sv) + ' · ' : '') +
            'MV ' +
            fmt(mv) +
            ' %';
          if (v && v.textContent !== x) v.textContent = x;
          if (m) {
            const y = /^A/.test(md) ? 'A' : /^R/.test(md) ? 'R' : /^M/.test(md) ? 'M' : md || '-';
            if (m.textContent !== y) m.textContent = y;
            m.style.color = y === 'M' ? C.man : y === 'R' ? C.rem : y === 'A' ? C.aut : C.none;
          }
        }
        qa('.tmpg-pb').forEach(b => {
          const a = btns[+b.dataset.b];
          b.classList.toggle('on', !!call(() => a.on && a.on(), false));
          b.hidden = !!call(() => a.hide && a.hide(), false);
        });
      }
      tick();
      const iv = setInterval(() => (pg.isConnected ? tick() : clearInterval(iv)), 500);
      return pg;
    };
  }
  if (!document.getElementById('tmpgcss')) {
    const s = document.createElement('style');
    s.id = 'tmpgcss';
    s.textContent = `
.tmpg{width:1760px;height:900px;overflow:auto;font:14px/1.3 system-ui,sans-serif;color:${C.nm};box-sizing:border-box;padding:4px 8px}
.tmpg-hd{display:flex;gap:16px;align-items:baseline;margin:0 0 10px}.tmpg-hd b{font-size:20px;letter-spacing:.04em}
.tmpg-hd span{color:${C.dim};font-size:13px}
.tmpg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;align-items:start}
.tmpg-card{background:${C.card};border:1px solid ${C.cs};border-radius:6px;padding:8px 10px}
.tmpg-card header{font-weight:600;font-size:14px;margin:0 0 8px;color:${C.val}}
.tmpg-its{display:flex;flex-wrap:wrap;gap:8px}
.tmpg button{font:inherit;color:inherit;background:#0b0f13;border:1px solid #3a4550;border-radius:5px;cursor:pointer;text-align:left}
.tmpg button:hover{border-color:#8fb3d1}
.tmpg-mot{display:grid;grid-template-columns:34px auto;column-gap:6px;align-items:center;padding:4px 8px;min-width:170px}
.tmpg-mot svg{grid-row:1/4}.tmpg-mot b{font-size:14px}.tmpg-mot small{color:${C.dim};font-size:12px}.tmpg-mot span{font:600 13px ui-monospace,monospace}
.tmpg-ctl{display:grid;grid-template-columns:1fr auto;column-gap:8px;padding:5px 8px;min-width:250px}
.tmpg-ctl b{font-size:14px}.tmpg-ctl small{grid-column:1;color:${C.dim};font-size:12px}
.tmpg-ctl span{grid-column:1;font:13px ui-monospace,monospace;color:#5cd6ff}.tmpg-ctl i{grid-column:2;grid-row:1/4;align-self:center;font:700 18px ui-monospace,monospace;font-style:normal}
.tmpg-pb{padding:6px 10px;font-size:13px}.tmpg-pb em{display:block;font-style:normal;font-size:11px;color:${C.dim};letter-spacing:.06em}
.tmpg-pb.fld em{color:#e0b860}.tmpg-pb.tcs em{color:#8fc7ff}.tmpg-pb.on{border-color:${C.run};box-shadow:inset 0 0 0 1px ${C.run}}`;
    document.head.append(s);
  }
  const L = (window.PLANT_SYS = window.PLANT_SYS || []);
  for (const P of PAGES) {
    PLANT_V2.screens[P[0]] = page(P);
    L.push({
      id: P[0],
      title: P[1],
      num: '',
      name: P[2],
      src: P[0],
      w: 1920,
      h: 1000,
      v2: true,
      screen: P[0],
      temp: 1,
      items: []
    });
  }
})();
