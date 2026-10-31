/* 038 AIR PREHEATER (PR-OPE-5002 section 17 "start the air preheater", section 27 sootblower): mockup v5 (team-files/hmi-mockups/
   038-air-preheater.html; user 2026-10-31 "di ko maimagine paano dumadaan sa loob ang mga hangin at flue gas, pati na rin ang pag
   ikot"; leader review: clean layout). A 2.5D cutaway of the ONE Ljungstrom rotor H-1052 (FHI manual part 5 section 1) that teaches
   how it works: the element baskets turn around the drum while the drive runs (shown faster than the real ~1 rpm), they heat up in
   the flue gas half and give the heat to the air (the colour travels with the rotation), flue gas goes DOWN through the gas half (hot
   end on top), primary and secondary air go UP through their sectors (the particles move while their fan runs). Sector angles are not
   in the plant documents: flue gas 180°, primary air 30°, secondary air 150° here. Center drive on the rotor post (38.PNG): main drive
   motor M1 of DITL-43 (START M.1420, STOP M.1421, LOW / NORMAL speed M.1423 / M.1424, LOCAL I.0652, NOT TRIP I.0651) and the back-up
   air motor of DITL-44 (SV-PA1052). Sootblowers N1040 (hot end) / N1042 (cold end) on the gas side. Values: the logic where a sheet
   reads the transmitter, else the plant estimate of the 007 page (PLANT_V2.EST, the same numbers on both pages); description + value
   + unit at the duct it measures, the tag on hover and in the faceplate, the rest in the MONITORING of the second faceplate. #59: two
   faceplates, CONTROL (click on the rotor or the drive) and PERMISSIVE · TREND · MONITOR (the PERMISSIVE Y / N button). The faceplates
   open right of every value and button (measured), so they never cover one. */
(function () {
  if (!window.PLANT_V2 || !window.HSYM) return;
  const H = HSYM,
    T = H.T,
    C = H.C;
  const PX = 'aph';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  /* the drive of DITL-43 (the motor faceplate of fp-pop.js) */
  const M = { n: 'Air preheater', t: 'H-1052', ad: 'DITL-43', d: 'DITL-43' };
  /* the drum: centre x, radii, top (hot end) and bottom (cold end) ellipse centres; baskets around the rotor */
  const CX = 470,
    RX = 210,
    RY = 60,
    YT = 226,
    YB = 516,
    N = 24;
  const GAS = [-90, 90],
    PA = [90, 120],
    SA = [120, 270];
  const rad = a => (a * Math.PI) / 180;
  const px = a => CX + RX * Math.cos(rad(a));
  const py = (a, yc) => yc + RY * Math.sin(rad(a));
  /* basket temperature by its angle (the rotor turns with the angle decreasing: a basket enters the gas half at 90°, front centre,
     cold and leaves it at -90°, back, hot, then cools down through the air half 270° -> 90°); th / tc = gas in / air in */
  const tempAt = (a, th, tc) => {
    let p = ((a % 360) + 360) % 360;
    if (p > 270) p -= 360;
    const k = 1 - Math.exp(-2.4),
      f = t => (1 - Math.exp(-2.4 * t)) / k,
      lo = tc + 25,
      hi = th - 25;
    if (p <= 90) return lo + (hi - lo) * f((90 - p) / 180);
    return hi - (hi - lo) * f((270 - p) / 180);
  };
  const colAt = (t, th, tc) => {
    const u = clamp((t - tc) / Math.max(1, th - tc), 0, 1),
      a = [44, 74, 108],
      b = [236, 96, 36];
    return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * u)).join(',')})`;
  };
  function art() {
    const b = H.scene(PX);
    /* ducts: primary air on the inner hood (next to the centre post), secondary air outside; gas on the right */
    b.pipe([[420, 168], [420, 90], [10, 90]], { w: 22, med: 'ha', f: 'hpa' });
    b.pipe([[315, 182], [315, 140], [10, 140]], { w: 30, med: 'ha', f: 'hsa' });
    b.pipe([[315, 566], [315, 610], [10, 610]], { w: 30, med: 'air', f: 'csa' });
    b.pipe([[420, 576], [420, 650], [10, 650]], { w: 22, med: 'air', f: 'cpa' });
    b.pipe([[590, 170], [590, 110], [985, 110]], { w: 36, med: 'fg', f: 'gin' });
    b.pipe([[590, 570], [590, 690], [985, 690]], { w: 36, med: 'fg', f: 'gout' });
    b.add(H.arrow(160, 90, 'l') + H.arrow(160, 140, 'l') + H.arrow(160, 610, 'r') + H.arrow(160, 650, 'r') + H.arrow(800, 110, 'l') + H.arrow(800, 690, 'r'));
    /* hoods over and under the drum (gas half right, primary air inner left, secondary air outer left) */
    const hood = (x0, x1, top) =>
      top
        ? `<path d="M${x0} ${YT - 4} L${x0 + 6} ${YT - 50} L${x1 - 6} ${YT - 50} L${x1} ${YT - 4} Z" fill="url(#${PX}-cs)" stroke="#090d11" stroke-width="1.4"/>`
        : `<path d="M${x0} ${YB + 4} L${x0 + 6} ${YB + 50} L${x1 - 6} ${YB + 50} L${x1} ${YB + 4} Z" fill="url(#${PX}-cs)" stroke="#090d11" stroke-width="1.4"/>`;
    b.add(hood(266, 368, 1) + hood(372, 464, 1) + hood(476, 674, 1) + hood(266, 368, 0) + hood(372, 464, 0) + hood(476, 674, 0));
    /* streamlines (fixed): flue gas down in the gas half, air up in the primary and secondary sectors */
    const stream = [[20, 0], [48, 0], [76, 0], [104, 1], [140, 1], [166, 1]]
      .map(([a, up]) => {
        const x = +px(a).toFixed(1),
          y0 = py(a, YT) + 18,
          y1 = py(a, YB) - 14,
          c = up ? '#9fd0f5' : '#e6c8a8';
        return (
          `<line x1="${x}" y1="${y0.toFixed(1)}" x2="${x}" y2="${y1.toFixed(1)}" stroke="${c}" stroke-width="1.2" stroke-dasharray="5 5" opacity=".75"/>` +
          [0.3, 0.7]
            .map(f => {
              const y = y0 + (y1 - y0) * f,
                d = up ? 5 : -5;
              return `<path d="M${x - 6} ${(y + d).toFixed(1)} L${x} ${(y - d).toFixed(1)} L${x + 6} ${(y + d).toFixed(1)}" fill="none" stroke="${c}" stroke-width="2"/>`;
            })
            .join('')
        );
      })
      .join('');
    const plate = a => `<line x1="${px(a).toFixed(1)}" y1="${py(a, YT).toFixed(1)}" x2="${px(a).toFixed(1)}" y2="${py(a, YB).toFixed(1)}" stroke="#e8edf2" stroke-width="2.5" opacity=".8"/>`;
    /* the drum: back of the casing, the turning baskets (top face + the cut-open front), sector plates, the front rim */
    b.add(
      `<g class="hs-hit" data-hit="RTR"><title>Air preheater H-1052 · click: control faceplate</title>` +
        `<path d="M${CX - RX} ${YT} L${CX - RX} ${YB} A${RX} ${RY} 0 0 0 ${CX + RX} ${YB} L${CX + RX} ${YT} Z" fill="#1d2329" stroke="#5e6d7b" stroke-width="1.6"/>` +
        `<g data-front="1"></g><g data-top="1"></g>` +
        `<ellipse cx="${CX}" cy="${YT}" rx="${RX}" ry="${RY}" fill="none" stroke="#8b9aaa" stroke-width="2.2"/>` +
        `<path d="M${CX - RX} ${YB} A${RX} ${RY} 0 0 0 ${CX + RX} ${YB}" fill="none" stroke="#8b9aaa" stroke-width="2.2"/>` +
        `<line x1="${CX - RX}" y1="${YT}" x2="${CX - RX}" y2="${YB}" stroke="#8b9aaa" stroke-width="2.2"/><line x1="${CX + RX}" y1="${YT}" x2="${CX + RX}" y2="${YB}" stroke="#8b9aaa" stroke-width="2.2"/>` +
        [GAS[0], GAS[1], PA[1], SA[1]].map(a => `<line x1="${CX}" y1="${YT}" x2="${px(a).toFixed(1)}" y2="${py(a, YT).toFixed(1)}" stroke="#e8edf2" stroke-width="3.5"/>`).join('') +
        plate(GAS[1]) +
        plate(PA[1]) +
        stream +
        `<g data-parts="1"></g>` +
        `<rect x="${CX - 9}" y="${YT - 10}" width="18" height="${YB - YT + 20}" fill="#7b8894" stroke="#090d11" stroke-width="1.2" opacity=".9"/>` +
        `<circle cx="${CX}" cy="${YT}" r="8" fill="#c99a3c" stroke="#090d11"/><circle cx="${CX}" cy="${YB}" r="8" fill="#c99a3c" stroke="#090d11"/></g>`
    );
    /* centre drive above the top bearing: gear reducer, main drive motor, back-up air motor with its valve on the compressed air line */
    b.add(`<rect x="${CX - 16}" y="${YT - 66}" width="32" height="22" rx="3" fill="url(#${PX}-cs)" stroke="#090d11" stroke-width="1.4"/><line x1="${CX}" y1="${YT - 44}" x2="${CX}" y2="${YT - 10}" stroke="#7b8894" stroke-width="6"/>`);
    b.add(H.motor(CX - 18, YT - 120, 'MD', PX, { w: 36, h: 48 }) + H.motor(CX + 26, YT - 92, 'AM', PX, { w: 24, h: 22, lab: 'A' }));
    b.pipe([[CX + 38, 56], [CX + 38, YT - 96]], { w: 4, med: 'air', f: 'ia' });
    b.add(H.valve(CX + 38, 74, { kind: 'xv', id: 'SV', vert: 1 }));
    b.txt(T(CX + 52, 30, 'Main drive motor', 'hs-sub', 'fill="#dce4eb"') + T(CX + 52, 46, '-----', 'hs-st', 'data-st="MD" fill="#6b7480"') + T(CX + 172, 30, 'Air motor (back-up)', 'hs-sub') + T(CX + 172, 46, '-----', 'hs-st', 'data-st="AM" fill="#6b7480"'));
    /* sootblowers: retractable lances into the gas half, hot end and cold end */
    const sb = (y, id, t) => {
      b.pipe([[742, y], [CX + RX - 10, y]], { w: 5, med: 'st', f: '' });
      b.add(`<g class="hs-hit" data-hit="${id}"><title>${t}</title><rect x="740" y="${y - 13}" width="40" height="26" rx="4" fill="url(#${PX}-mt)" stroke="#090d11" stroke-width="1.4" class="hs-hl"/></g>`);
    };
    sb(262, 'SBH', 'Hot end sootblower N1040');
    sb(486, 'SBC', 'Cold end sootblower N1042');
    /* name and the #59 button */
    b.txt(T(CX + 52, 76, 'Air preheater', 'hs-eq', 'data-hit="RTR"'));
    b.add(H.eqb(CX + 182, 60, 'APH'));
    /* values at their ducts (description + value + unit, the tag on hover) */
    const v2 = (x, y, d, tags) => H.vb2(x, y, d, tags, '°C', tags);
    b.txt(v2(20, 42, 'Hot primary air out', ['TIFA1076', 'TIFA1077']) + v2(20, 176, 'Hot secondary air out', ['TIFA1086', 'TIFA1087']));
    b.txt(v2(20, 554, 'Cold secondary air in', ['TIFA1083', 'TIFA1084']) + v2(20, 682, 'Cold primary air in', ['TIFA1073', 'TIFA1074']));
    b.txt(v2(620, 152, 'Flue gas in', ['TIFG1124', 'TIFG1125']) + v2(620, 632, 'Flue gas out', ['TIFG1132', 'TIFG1133']));
    b.txt(H.vbc(696, 296, 'Hot end sootblower steam', 'PISB1040', 'kg/cm²', 'PISB1040') + H.vbc(696, 370, 'Gas side ΔP', 'DPIFG10525', 'mmH2O', 'DPIFG10525') + H.vbc(696, 520, 'Cold end sootblower steam', 'PISB1042', 'kg/cm²', 'PISB1042'));
    /* how it works, under the art (the temperatures are the values of the page) */
    b.txt(
      T(200, 726, 'Flue gas', 'hs-sub', 'fill="#e2dad2"') + T(270, 726, '-----', 'hs-sub', 'data-lg="g"') +
        T(200, 745, 'Air', 'hs-sub', 'fill="#d6ecff"') + T(270, 745, '-----', 'hs-sub', 'data-lg="a"') +
        T(200, 764, 'Rotor', 'hs-sub', 'fill="#c99a3c"') + T(270, 764, 'about 1 rpm (shown faster)', 'hs-sub')
    );
    return b.svg();
  }

  /* the values on the page [tag, decimals] and in the MONITORING of the second faceplate [label, tag, unit, decimals]; a tag a logic
     sheet reads = the logic value, else the plant estimate of 007 */
  const VALS = [
    ['TIFA1076', 0], ['TIFA1077', 0], ['TIFA1086', 0], ['TIFA1087', 0], ['TIFA1083', 0], ['TIFA1084', 0], ['TIFA1073', 0], ['TIFA1074', 0],
    ['TIFG1124', 0], ['TIFG1125', 0], ['TIFG1132', 0], ['TIFG1133', 0], ['DPIFG10525', 0], ['PISB1040', 1], ['PISB1042', 1]
  ];
  const MONV = [
    ['Hot sec. air, avg', 'TIFA1052', '°C', 0],
    ['Gas inlet press.', 'PIFG1121', 'mmH2O', 0],
    ['Gas outlet press.', 'PIFG1134', 'mmH2O', 0],
    ['Hot prim. air press.', 'PIFA1078', 'mmH2O', 0],
    ['Inlet oxygen', 'AIFG1122', '%', 1],
    ['Outlet oxygen', 'AIFG1131', '%', 1]
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
    const get = t => {
      if (V[t] !== undefined && V[t] !== null) return V[t];
      if (!EST[t]) return null;
      try {
        const v = EST[t](E);
        return v != null && isFinite(v) ? v : null;
      } catch (e) {
        return null;
      }
    };
    const avg = (a, b) => (a != null && b != null ? (a + b) / 2 : a != null ? a : b);
    /* the heat colours follow the page values: gas in (top) and air in (bottom) */
    let th = 338,
      tc = 35;
    const paint = () => {
      if (PLANT_V2.estPrep) PLANT_V2.estPrep(E);
      for (const [t, dp] of VALS) {
        const v = get(t);
        showV(t, v == null ? null : fmt(v, dp));
      }
      const gi = avg(get('TIFG1124'), get('TIFG1125')),
        go = avg(get('TIFG1132'), get('TIFG1133')),
        ai = avg(avg(get('TIFA1073'), get('TIFA1074')), avg(get('TIFA1083'), get('TIFA1084'))),
        ao = avg(get('TIFA1086'), get('TIFA1087'));
      if (gi != null) th = gi;
      if (ai != null) tc = ai;
      const lg = (k, t) => qa(`[data-lg="${k}"]`).forEach(e => (e.textContent = t));
      lg('g', gi == null || go == null ? '-----' : `${fmt(gi, 0)} → ${fmt(go, 0)} °C, heats the baskets`);
      lg('a', ai == null || ao == null ? '-----' : `${fmt(ai, 0)} → ${fmt(ao, 0)} °C, cools the baskets`);
      drum();
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
    live('', 'AIFG1122', v => ((o2a = v), (E.o2 = avg(o2a, o2b)), later()));
    live('', 'AIFG1123', v => ((o2b = v), (E.o2 = avg(o2a, o2b)), later()));
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
    for (const t of [...VALS.map(x => x[0]), ...MONV.map(x => x[1])]) if (!EST[t]) live('', t, v => ((V[t] = v), later()));
    /* the turning baskets: top face (all) and the cut-open front half, coloured by their temperature */
    const gTop = q('[data-top]'),
      gFront = q('[data-front]'),
      gParts = q('[data-parts]');
    let rot = 0;
    function drum() {
      let top = '',
        front = '';
      for (let i = 0; i < N; i++) {
        const a0 = rot + (i * 360) / N,
          a1 = a0 + 360 / N - 1.2,
          t0 = tempAt(a0 + 180 / N, th, tc);
        top += `<path d="M${CX} ${YT} L${px(a0).toFixed(1)} ${py(a0, YT).toFixed(1)} A${RX} ${RY} 0 0 1 ${px(a1).toFixed(1)} ${py(a1, YT).toFixed(1)} Z" fill="${colAt(t0, th, tc)}" opacity=".9" stroke="#0b0f13" stroke-width=".8"/>`;
        const s0 = ((a0 % 360) + 360) % 360,
          s1 = s0 + 360 / N - 1.2;
        if (s0 > 0 && s1 < 180) {
          const x0 = px(s0).toFixed(1),
            x1 = px(s1).toFixed(1),
            yy = (a, f) => (py(a, YT) + (py(a, YB) - py(a, YT)) * f).toFixed(1);
          /* three layers: hot end, intermediate, cold end */
          for (const [f0, f1, dk] of [[0, 0.24, 1.08], [0.26, 0.63, 0.86], [0.65, 1, 0.62]])
            front += `<path d="M${x0} ${yy(s0, f0)} L${x1} ${yy(s1, f0)} L${x1} ${yy(s1, f1)} L${x0} ${yy(s0, f1)} Z" fill="${colAt(tc + (t0 - tc) * dk, th, tc)}" opacity=".85" stroke="#0b0f13" stroke-width=".6"/>`;
        }
      }
      if (gTop) gTop.innerHTML = top;
      if (gFront) gFront.innerHTML = front;
    }
    /* particles: flue gas down (while the induced draft fan runs), primary / secondary air up (while their fan runs) */
    const P = [];
    const pick = k => (k === 'g' ? 6 + Math.random() * 80 : k === 'p' ? 92 + Math.random() * 26 : 122 + Math.random() * 54);
    for (let i = 0; i < 60 && gParts; i++) {
      const kind = i < 30 ? 'g' : i < 40 ? 'p' : 's',
        c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', kind === 'g' ? 3.4 : 3);
      c.setAttribute('stroke', '#0b0f13');
      c.setAttribute('stroke-width', '.6');
      gParts.append(c);
      P.push({ kind, a: pick(kind), t: Math.random(), c, v: 0.21 + Math.random() * 0.12 });
    }
    const movePart = (p, dt) => {
      const on = (p.kind === 'g' ? E.idf : p.kind === 'p' ? E.paf : E.saf) !== 0;
      p.c.setAttribute('visibility', on ? 'visible' : 'hidden');
      if (!on) return;
      p.t += p.v * dt;
      if (p.t > 1) ((p.t = 0), (p.a = pick(p.kind)));
      const yt = py(p.a, YT),
        yb = py(p.a, YB),
        down = p.kind === 'g',
        y = down ? yt + (yb - yt) * p.t : yb - (yb - yt) * p.t;
      p.c.setAttribute('cx', px(p.a).toFixed(1));
      p.c.setAttribute('cy', y.toFixed(1));
      p.c.setAttribute('fill', down ? `rgb(${Math.round(150 + 80 * (1 - p.t))},${Math.round(130 + 30 * (1 - p.t))},${Math.round(120 - 40 * (1 - p.t))})` : colAt(tc + (th - 60 - tc) * p.t, th, tc));
    };
    P.forEach(p => movePart(p, 0));
    /* the drive (DITL-43) and the air motor valve (DITL-44): run state, rotor turning, the #59 button */
    let st = null;
    A.each(dt => {
      P.forEach(p => movePart(p, dt));
      if (st !== 'RUN') return;
      rot = (rot - dt * 18 + 360) % 360; /* ~3 rpm on the screen, the real rotor ~1 rpm */
      drum();
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
    /* #59: click on the rotor, its name or the drive = CONTROL faceplate; the PERMISSIVE button = PERMISSIVE · TREND · MONITOR */
    const cur = () => (st === 'RUN' ? 4.7 : st ? 0 : null);
    /* the drive current while it runs (38.PNG 4.7 A), bearing oil warming towards 60 / 47 °C with the gas (38.PNG) */
    const oil = top => (E.tpa != null ? E.tpa + ((top ? 60 : 47) - 30) * clamp(E.kb || 0, 0, 1) : null);
    const MON = [
      ['Top bearing oil', () => oil(1), '°C', 'TIFA10526'],
      ['Bottom bearing oil', () => oil(0), '°C', 'TIFA10527'],
      ...MONV.map(([l, t, u, dp]) => [l, () => (get(t) == null ? null : +get(t).toFixed(dp)), u, t])
    ];
    /* the faceplates open in the right strip, CONTROL on top and the info one under it, each in its half of the HMI area (scrolls
       inside when longer); the left edge never left of the right end of any value or button of the page (measured, the descriptions
       included): narrower when the strip is narrow */
    const open = part => {
      if (!window.LS_FPOP || !LS_FPOP.motor({ ...M, part, cur, mon: MON })) return;
      const el = document.getElementById(part === 'info' ? 'fpop2' : 'fpop'),
        host = el && el.parentNode,
        m = pg.getScreenCTM && pg.getScreenCTM();
      if (!el || !host || !m) return;
      const Hr = host.getBoundingClientRect(),
        x0 = Math.max(...[...qa('[data-vbx], [data-eqb], [data-st]')].map(e => e.getBoundingClientRect().right)) + 4,
        x1 = new DOMPoint(990, 0).matrixTransform(m).x,
        half = Math.floor(Hr.height / 2) - 9,
        room = Hr.right - 6 - x0;
      el.dataset.side = 'n';
      el.style.maxHeight = half + 'px';
      if (room < el.offsetWidth) el.style.width = Math.max(240, Math.floor(room)) + 'px';
      el.style.left = Math.round(Math.max(6, Math.max(x0, Math.min(x1, Hr.right - el.offsetWidth - 6))) - Hr.left) + 'px';
      el.style.top = (part === 'info' ? half + 12 : 6) + 'px';
    };
    for (const id of ['RTR', 'MD', 'AM'])
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
