/* 038 AIR PREHEATER (PR-OPE-5002 section 17 "start the air preheater", section 27 sootblower): the mockup the user approved on
   2026-10-31 (v4, team-files/hmi-mockups/038-air-preheater.html; leader review: center drive, primary air on the inner hoods).
   One rotating Ljungstrom rotor H-1052 (FHI manual part 5 section 1: rotary, preheating the primary and the secondary air), drawn
   twice: a side cutaway (element baskets in three layers, hot end on top; counter-flow: flue gas down, air up) and a top view (the
   sectors turning; the sector angles are not in the plant documents, so flue gas 180°, primary and secondary air 90° each). The
   center drive on the rotor post (38.PNG): main drive motor M1 of DITL-43 (START M.1420, STOP M.1421, LOW / NORMAL speed M.1423 /
   M.1424, LOCAL I.0652, NOT TRIP I.0651) and the back-up air motor of DITL-44 (SV-PA1052). Sootblowers N1040 (hot end) / N1042
   (cold end) on the gas side. Values: the logic where a sheet reads the transmitter, else the plant estimate of the 007 page
   (PLANT_V2.EST, the same numbers on both pages). #59: two faceplates, CONTROL (click on the rotor or the drive) and PERMISSIVE ·
   TREND · MONITOR (the Y / N button). Page text in English (user 2026-10-31); the right strip (x >= 990) is kept free for the
   faceplates. */
(function () {
  if (!window.PLANT_V2 || !window.HSYM) return;
  const H = HSYM,
    T = H.T,
    C = H.C;
  const PX = 'aph';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  /* the drive of DITL-43 (the motor faceplate of fp-pop.js) and its monitoring values */
  const M = { n: 'Air preheater', t: 'H-1052', ad: 'DITL-43', d: 'DITL-43' };
  /* rotor top view */
  const CX = 792,
    CY = 330,
    R = 80;
  function art() {
    const b = H.scene(PX);
    b.txt(T(16, 26, 'AIR SIDE', 'hs-zone') + T(975, 26, 'FLUE GAS SIDE', 'hs-zone', 'text-anchor="end"'));
    /* ducts: primary air on the inner hoods (next to the center post), secondary air outside; gas in on top, out at the bottom */
    b.pipe([[380, 200], [380, 100], [10, 100]], { w: 22, med: 'ha', f: 'hpa' });
    b.pipe([[310, 200], [310, 160], [10, 160]], { w: 30, med: 'ha', f: 'hsa' });
    b.pipe([[310, 500], [310, 560], [10, 560]], { w: 30, med: 'air', f: 'csa' });
    b.pipe([[380, 500], [380, 620], [10, 620]], { w: 22, med: 'air', f: 'cpa' });
    b.pipe([[487, 200], [487, 100], [985, 100]], { w: 36, med: 'fg', f: 'gin' });
    b.pipe([[487, 500], [487, 640], [985, 640]], { w: 36, med: 'fg', f: 'gout' });
    const hood = (x, w, y, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#${PX}-cs)" stroke="#090d11" stroke-width="1.5"/>`;
    b.add(hood(278, 64, 190, 16) + hood(348, 64, 190, 16) + hood(424, 128, 190, 16) + hood(278, 64, 494, 16) + hood(348, 64, 494, 16) + hood(424, 128, 494, 16));
    /* side cutaway: casing, element baskets in three layers, center post */
    const layer = (y, h, col) => {
      let l = '';
      for (let x = 274; x < 556; x += 7) l += `<line x1="${x}" y1="${y + 3}" x2="${x}" y2="${y + h - 3}" stroke="${col}" stroke-width="1.6" opacity=".7"/>`;
      return `<rect x="270" y="${y}" width="290" height="${h}" fill="#221c16"/>${l}`;
    };
    b.add(
      `<g class="hs-hit" data-hit="RTR"><title>Air preheater H-1052 · rotor (side cutaway) · click: control faceplate</title><rect x="266" y="206" width="298" height="288" rx="4" fill="#2b2620" stroke="#8b9aaa" stroke-width="2" class="hs-hl"/>` +
        layer(210, 70, '#d08a4a') +
        layer(284, 110, '#a3784a') +
        layer(398, 92, '#6f8aa0') +
        `<rect x="406" y="200" width="18" height="300" fill="#7b8894" stroke="#090d11" stroke-width="1.4"/></g>`
    );
    /* top (guide) and bottom (support) bearings on the center post */
    b.add(`<circle cx="415" cy="200" r="8" fill="#c99a3c" stroke="#090d11" stroke-width="1.4"/><circle cx="415" cy="500" r="8" fill="#c99a3c" stroke="#090d11" stroke-width="1.4"/>`);
    const arr = (x, y, up, c) => `<path d="M${x} ${y} l-7 ${up ? 10 : -10} h14 Z" fill="${c}"/>`;
    b.add(`<g data-k="arr">${[250, 330, 440].map(y => arr(330, y, 1, '#d6ecff') + arr(370, y + 20, 1, '#d6ecff') + arr(470, y + 12, 0, '#e2dad2') + arr(520, y - 6, 0, '#e2dad2')).join('')}</g>`);
    b.txt(
      T(260, 250, 'Hot end', 'hs-st', 'fill="#f0b47a" text-anchor="end" style="font-size:11px"') +
        T(260, 344, 'Intermediate', 'hs-st', 'fill="#d9c2a2" text-anchor="end" style="font-size:11px"') +
        T(260, 450, 'Cold end', 'hs-st', 'fill="#a9c6dc" text-anchor="end" style="font-size:11px"')
    );
    /* center drive on the rotor post, above the top bearing: gear reducer, main drive motor, back-up air motor */
    b.add(`<rect x="398" y="166" width="34" height="28" rx="3" fill="url(#${PX}-cs)" stroke="#090d11" stroke-width="1.4"/>`);
    b.add(H.motor(397, 116, 'MD', PX, { w: 36, h: 44 }) + H.motor(440, 146, 'AM', PX, { w: 24, h: 22, lab: 'A' }));
    b.pipe([[452, 66], [452, 142]], { w: 4, med: 'air', f: 'ia' });
    b.add(H.valve(452, 96, { kind: 'xv', id: 'SV', vert: 1 }));
    b.txt(T(300, 44, 'Main drive motor', 'hs-sub', 'fill="#dce4eb"') + T(300, 60, '-----', 'hs-st', 'data-st="MD" fill="#6b7480"'));
    b.txt(T(470, 44, 'Air motor', 'hs-sub', 'fill="#dce4eb"') + T(470, 60, '-----', 'hs-st', 'data-st="AM" fill="#6b7480"') + T(470, 76, 'valve SV-PA1052', 'hs-tag', 'style="font-size:10.5px"'));
    /* top view: the sectors and the turning element pattern (leader review: three clearly different fills) */
    const sec = (a0, a1, col) => {
      const p = a => [CX + R * Math.cos((a * Math.PI) / 180), CY + R * Math.sin((a * Math.PI) / 180)];
      const [x0, y0] = p(a0),
        [x1, y1] = p(a1);
      return `<path d="M${CX} ${CY} L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${col}" opacity=".7"/>`;
    };
    let sp = '';
    for (let k = 0; k < 24; k++) sp += `<line x1="${CX}" y1="${CY}" x2="${CX + R}" y2="${CY}" stroke="#d9c3a3" stroke-width="1.1" opacity=".5" transform="rotate(${k * 15} ${CX} ${CY})"/>`;
    for (let k = 1; k < 4; k++) sp += `<circle cx="${CX}" cy="${CY}" r="${(R * k) / 4}" fill="none" stroke="#d9c3a3" stroke-width="1" opacity=".4"/>`;
    const SEC = [['#6d6660', 'Flue gas'], ['#d0782c', 'Primary air'], ['#3f7fae', 'Secondary air']];
    b.add(
      `<g class="hs-hit" data-hit="RTR2"><title>Air preheater H-1052 · top view · click: control faceplate</title><circle cx="${CX}" cy="${CY}" r="${R + 10}" fill="#20262c" stroke="#8b9aaa" stroke-width="2" class="hs-hl"/>` +
        `<circle cx="${CX}" cy="${CY}" r="${R + 6}" fill="none" stroke="#c99a3c" stroke-width="3" stroke-dasharray="2 3"/>` +
        sec(-90, 90, SEC[0][0]) +
        sec(90, 180, SEC[1][0]) +
        sec(180, 270, SEC[2][0]) +
        `<g data-rot="1">${sp}</g>` +
        [-90, 90, 180, 270].map(a => `<line x1="${CX}" y1="${CY}" x2="${(CX + (R + 6) * Math.cos((a * Math.PI) / 180)).toFixed(1)}" y2="${(CY + (R + 6) * Math.sin((a * Math.PI) / 180)).toFixed(1)}" stroke="#d8dee4" stroke-width="4"/>`).join('') +
        `<circle cx="${CX}" cy="${CY}" r="10" fill="#7b8894" stroke="#090d11" stroke-width="1.4"/></g>`
    );
    b.add(`<path d="M${CX + 70} ${CY - 92} a 116 116 0 0 1 40 40" fill="none" stroke="#e8edf2" stroke-width="2.4"/><path d="M${CX + 112} ${CY - 48} l-2 -12 l-9 7 Z" fill="#e8edf2"/>`);
    b.txt(T(CX, CY + R + 28, 'Top view · rotor turns about 1 rpm', 'hs-sub', 'text-anchor="middle"'));
    b.add(SEC.map(([c], i) => `<rect x="${686 + i * 96}" y="${CY + R + 40}" width="12" height="12" rx="2" fill="${c}"/>`).join(''));
    b.txt(SEC.map(([, t], i) => T(702 + i * 96, CY + R + 51, t, 'hs-sub', 'style="font-size:12px"')).join(''));
    /* sootblowers: hot end and cold end lances on the gas side */
    const sb = (y, id, t) => {
      b.pipe([[600, y], [556, y]], { w: 5, med: 'st', f: '' });
      b.add(`<g class="hs-hit" data-hit="${id}"><title>${t}</title><rect x="598" y="${y - 13}" width="34" height="26" rx="4" fill="url(#${PX}-mt)" stroke="#090d11" stroke-width="1.4" class="hs-hl"/></g>`);
    };
    sb(244, 'SBH', 'Hot end sootblower N1040');
    sb(460, 'SBC', 'Cold end sootblower N1042');
    b.txt(T(572, 222, 'Hot end sootblower', 'hs-sub') + T(572, 494, 'Cold end sootblower', 'hs-sub'));
    /* name (leader review: clear of the hot end sootblower label) and the #59 button */
    b.txt(T(690, 192, 'Air preheater', 'hs-eq') + T(690, 210, 'H-1052 · Ljungstrom rotary', 'hs-sub'));
    b.add(H.eqb(720, 486, 'APH'));
    /* air side values between the hot and the cold ducts */
    b.txt(
      H.vb(16, 214, 'Hot secondary air, average', 'TIFA1052', '°C', 'TIFA1052', 56) +
        H.vb(16, 282, 'Hot secondary air A / B', 'TIFA1086/87', '°C', 'hsa', 84) +
        H.vb(16, 350, 'Hot primary air A / B', 'TIFA1076/77', '°C', 'hpa', 84) +
        H.vb(16, 418, 'Hot primary air pressure', 'PIFA1078', 'mmH2O', 'PIFA1078', 64) +
        H.vb(16, 486, 'Cold primary air A / B', 'TIFA1073/74', '°C', 'cpa', 84)
    );
    b.txt(H.vb(16, 690, 'Primary fan outlet', 'PIFA1075', 'mmH2O', 'PIFA1075', 56) + H.vb(150, 690, 'Cold secondary air A / B', 'TIFA1083/84', '°C', 'csa', 84) + H.vb(330, 690, 'Secondary fan outlet', 'PIFA1085', 'mmH2O', 'PIFA1085', 56));
    b.txt(T(16, 76, 'hot primary air to the furnace', 'hs-sub') + T(16, 140, 'hot secondary air to the furnace', 'hs-sub') + T(16, 594, 'cold secondary air from the fan', 'hs-sub') + T(16, 656, 'cold primary air from the fan', 'hs-sub'));
    /* gas side values */
    b.txt(H.vb(560, 140, 'Gas inlet temperature A / B', 'TIFG1124/25', '°C', 'gin', 84) + H.vb(724, 140, 'Gas inlet pressure', 'PIFG1121', 'mmH2O', 'PIFG1121', 56) + H.vb(852, 140, 'Inlet oxygen A', 'AIFG1122', '%', 'AIFG1122', 56));
    b.txt(H.vb(560, 700, 'Gas outlet temperature A / B', 'TIFG1132/33', '°C', 'gout', 84) + H.vb(760, 700, 'Gas outlet pressure', 'PIFG1134', 'mmH2O', 'PIFG1134', 56) + H.vb(880, 700, 'Outlet oxygen', 'AIFG1131', '%', 'AIFG1131', 46));
    b.txt(H.vb(560, 580, 'Gas side differential pressure', 'DPIFG10525', 'mmH2O', 'DPIFG10525', 56) + H.vb(800, 580, 'Drive motor current', 'IIFA1052M1', 'A', 'cur', 56));
    b.txt(H.vb(574, 290, 'Top bearing oil', 'TIFA10526', '°C', 'b6', 50) + H.vb(574, 360, 'Bottom bearing oil', 'TIFA10527', '°C', 'b7', 50));
    b.txt(H.vb(574, 418, 'Hot sootblower steam', 'PISB1040', 'kg/cm²', 'PISB1040', 50) + H.vb(574, 524, 'Cold sootblower steam', 'PISB1042', 'kg/cm²', 'PISB1042', 50));
    b.txt(T(975, 74, 'flue gas from the economizer', 'hs-sub', 'text-anchor="end"') + T(975, 672, 'flue gas to the precipitator', 'hs-sub', 'text-anchor="end"'));
    return b.svg();
  }

  /* the values: [key, tags (one or A / B), decimals]; a tag a logic sheet reads = the logic value, else the plant estimate of 007 */
  const VALS = [
    ['TIFA1052', ['TIFA1052'], 0],
    ['hsa', ['TIFA1086', 'TIFA1087'], 0],
    ['hpa', ['TIFA1076', 'TIFA1077'], 0],
    ['PIFA1078', ['PIFA1078'], 0],
    ['cpa', ['TIFA1073', 'TIFA1074'], 0],
    ['csa', ['TIFA1083', 'TIFA1084'], 0],
    ['PIFA1075', ['PIFA1075'], 0],
    ['PIFA1085', ['PIFA1085'], 0],
    ['gin', ['TIFG1124', 'TIFG1125'], 0],
    ['PIFG1121', ['PIFG1121'], 0],
    ['AIFG1122', ['AIFG1122'], 1],
    ['gout', ['TIFG1132', 'TIFG1133'], 0],
    ['PIFG1134', ['PIFG1134'], 0],
    ['AIFG1131', ['AIFG1131'], 1],
    ['DPIFG10525', ['DPIFG10525'], 0],
    ['PISB1040', ['PISB1040'], 1],
    ['PISB1042', ['PISB1042'], 1]
  ];

  function page(g, api) {
    const NS = 'http://www.w3.org/2000/svg';
    const pg = document.createElementNS(NS, 'g');
    pg.setAttribute('transform', H.fit(1280, 770));
    pg.innerHTML = art();
    g.append(pg);
    const q = s => pg.querySelector(s),
      qa = s => pg.querySelectorAll(s);
    const A = H.live(pg);
    const showV = (key, txt) =>
      qa(`[data-v="${key}"]`).forEach(t => {
        t.textContent = txt == null ? '-----' : txt;
        t.setAttribute('fill', txt == null ? C.none : C.val);
      });
    /* the plant estimate (PLANT_V2.EST of the 007 page) from the same live inputs */
    const EST = PLANT_V2.EST || {},
      E = { tb: null, pa0: 354, sa0: 213, fa0: 26.3 },
      V = {};
    const live = (ref, tag, set) => api.reg({ t: 'val', tag: tag || '', ref: ref || undefined, v: '' }, X => set(X && isFinite(X.v) ? +X.v : null), null);
    const paint = () => {
      if (PLANT_V2.estPrep) PLANT_V2.estPrep(E);
      for (const [key, tags, dp] of VALS) {
        const vs = tags.map(t => {
          if (V[t] !== undefined && V[t] !== null) return V[t];
          if (EST[t]) {
            try {
              const v = EST[t](E);
              return v != null && isFinite(v) ? v : null;
            } catch (e) {
              return null;
            }
          }
          return null;
        });
        showV(key, vs.every(v => v == null) ? null : vs.map(v => fmt(v, dp)).join('/'));
      }
      /* the drive: its current while it runs (38.PNG 4.7 A), bearing oil warming towards 60 / 47 °C with the gas (38.PNG) */
      const run = st === 'RUN';
      showV('cur', st == null ? null : fmt(run ? 4.7 : 0, 1));
      showV('b6', fmt(E.tpa != null ? E.tpa + (60 - 30) * clamp(E.kb || 0, 0, 1) : null, 0));
      showV('b7', fmt(E.tpa != null ? E.tpa + (47 - 30) * clamp(E.kb || 0, 0, 1) : null, 0));
    };
    let rq = 0;
    const later = () => rq || (rq = setTimeout(() => ((rq = 0), paint()), 60)); /* a timer, not a frame: the values also land while the window is in the background */
    /* the inputs of the estimate: the same as 007 */
    const inp = (k, ref, tag) => live(ref, tag, v => ((E[k] = v), later()));
    inp('fpa', 'pv:FICFA1071');
    inp('fsa', 'pv:FICFA1081');
    inp('ffa', '', 'FIFA1055');
    inp('pf0', '', 'PIFG1085');
    inp('ta', '', 'TIFA1072');
    inp('ts', '', 'TIFA1082');
    let o2a = null,
      o2b = null;
    live('', 'AIFG1122', v => ((o2a = v), (E.o2 = o2a != null && o2b != null ? (o2a + o2b) / 2 : o2a), later()));
    live('', 'AIFG1123', v => ((o2b = v), (E.o2 = o2a != null && o2b != null ? (o2a + o2b) / 2 : o2a), later()));
    const FAN = { idf: 'ABC-008|M.3304', saf: 'ABC-007|M.3303', paf: 'ABC-007|M.3302' };
    for (const k in FAN)
      live(FAN[k], '', v => {
        E[k] = v == null ? 1 : v > 0.5 ? 1 : 0;
        A.flow(k === 'idf' ? 'gin' : k === 'paf' ? 'hpa' : 'hsa', E[k] ? 1 : 0);
        if (k === 'idf') A.flow('gout', E[k] ? 1 : 0);
        if (k === 'paf') A.flow('cpa', E[k] ? 1 : 0);
        if (k === 'saf') A.flow('csa', E[k] ? 1 : 0);
        later();
      });
    const TT = {};
    'ABCDEFGHI'.split('').forEach(c =>
      ['TIFG1091', 'TIFG1090'].forEach(pre =>
        live('', pre + c, v => {
          TT[pre + c] = v;
          const L = Object.values(TT).filter(x => x != null);
          E.tb = L.length ? L.reduce((a, b) => a + b, 0) / L.length : null;
          later();
        })
      )
    );
    /* the transmitters a logic sheet reads (the logic value wins over the estimate) */
    for (const [, tags] of VALS) for (const t of tags) if (!EST[t]) live('', t, v => ((V[t] = v), later()));
    /* the drive (DITL-43) and the air motor valve (DITL-44): run state, rotor turning, the #59 button */
    let st = null,
      ang = 0;
    const g0 = q('[data-rot]');
    A.each(adt => {
      if (st !== 'RUN' || !g0) return;
      ang = (ang + adt * 6) % 360; /* ~1 rpm */
      g0.setAttribute('transform', `rotate(${ang.toFixed(2)} ${CX} ${CY})`);
    });
    const D = () => window.LS_DOCK;
    const tick = () => {
      if (!pg.isConnected) return clearInterval(iv);
      let s = null,
        sv = null;
      try {
        s = D() && D().mst ? D().mst('DITL-43') : null;
        sv = D() && D().dout ? D().dout('DITL-44', 7) : null;
      } catch (e) {}
      if (s !== st) ((st = s), later());
      A.pump('MD', st);
      A.pump('AM', sv === 1 ? 'RUN' : sv == null ? null : 'STOP');
      A.valve('SV', sv == null ? null : sv ? 1 : 0);
      A.flow('ia', sv === 1 ? 1 : 0);
      try {
        A.eqb('APH', window.LS_FPOP && LS_FPOP.yn ? LS_FPOP.yn(M) : null);
      } catch (e) {}
    };
    const iv = setInterval(tick, 1000);
    tick();
    /* #59: click on the rotor or the drive = CONTROL faceplate; the Y / N button = PERMISSIVE · TREND · MONITOR */
    const MON = [
      ['Top bearing oil', () => (q('[data-v="b6"]') ? parseFloat(q('[data-v="b6"]').textContent) : null), '°C', 'TIFA10526'],
      ['Bottom bearing oil', () => (q('[data-v="b7"]') ? parseFloat(q('[data-v="b7"]').textContent) : null), '°C', 'TIFA10527']
    ];
    const cur = () => (st === 'RUN' ? 4.7 : st ? 0 : null);
    /* the faceplates open in the right strip of the page (x >= 990, kept free for them): CONTROL on top, the info one under it */
    const open = part => {
      if (!window.LS_FPOP || !LS_FPOP.motor({ ...M, part, cur, mon: MON })) return;
      const el = document.getElementById(part === 'info' ? 'fpop2' : 'fpop'),
        host = el && el.parentNode,
        m = pg.getScreenCTM && pg.getScreenCTM();
      if (!el || !host || !m) return;
      /* each one in its half of the HMI area (scrolls inside when longer), at the strip x 990 (or as far right as it fits) */
      const Hr = host.getBoundingClientRect(),
        x = new DOMPoint(990, 0).matrixTransform(m).x,
        half = Math.floor(Hr.height / 2) - 9;
      el.dataset.side = 'n';
      el.style.maxHeight = half + 'px';
      el.style.left = Math.round(Math.max(6, Math.min(x, Hr.right - el.offsetWidth - 6) - Hr.left)) + 'px';
      el.style.top = (part === 'info' ? half + 12 : 6) + 'px';
    };
    for (const id of ['RTR', 'RTR2', 'MD', 'AM'])
      qa(`[data-hit="${id}"]`).forEach(h => h.addEventListener('click', e => (e.stopPropagation(), open('control'))));
    qa('[data-eqb="APH"]').forEach(h => h.addEventListener('click', e => (e.stopPropagation(), open('info'))));
    (window.LS_FPREG = window.LS_FPREG || {})['DITL-43'] = { open: () => open('control'), el: () => q('[data-hit="MD"]'), n: M.n, cur };
    paint();
    return pg;
  }
  PLANT_V2.screens.APH = page;
  /* after 007 AIR & FLUE GAS in the list of the Plant view */
  const L = (window.PLANT_SYS = window.PLANT_SYS || []),
    i = L.findIndex(x => x.id === 'AFG');
  L.splice(i >= 0 ? i + 1 : L.length, 0, {
    fitAll: 1,
    id: 'APH',
    title: '038 AIR PREHEATER',
    num: '038',
    name: 'AIR PREHEATER SYSTEM',
    src: '38.PNG',
    w: H.FRAME.w,
    h: H.FRAME.h,
    v2: true,
    screen: 'APH',
    style: 'steel',
    items: []
  });
})();
