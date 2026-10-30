/* 030 SEAWATER SYSTEM (roadmap step 6, user 2026-10-29: STEEL style, mock-up approved "g na yan"). Own vector graphics after the flow
   diagrams K1AU3-PD-020 SEAWATER (flow-diagram-K1AU3-A1-0-001.zip, RA page 16) and PD-021 AUX COOLING WATER (page 17); the HMI snapshot
   30.PNG is only the guide for the equipment and the instruments.
   - SWP P-1501A / B / C -> 96" header -> debris filter S-1502 (backwash MV-SW1001) -> condenser H-1110 A / B (in at the bottom
     V-SW1007 / 1008, 2 pass, out at the top V-SW1009 / 1010, ball separators L-1111 / 1112) -> siphon pit -> discharge channel;
   - condenser tube cleaning CTCS-A / B (DITL-119): ball recirculating pumps P-1113 / 1114, ball vessels T-1115 / 1116, V-pieces
     Z-1115 / 1116 on the inlets;
   - SWBP P-1503A / B / C (DITL-30) from the header -> debris filter S-1504 (backwash MV-SW1002) -> CCWHE H-1107A / B / C -> channel;
   - the closed aux cooling water loop of the CCWHE (PD-021): ACWP P-1108A / B (DITL-76 / 77), expansion tank T-1109, the users;
   - hypo-chlorinated dosing P-0761A / B, P-0762A / B (STN105 status DI only, no DCS command).
   Run state = the motor drawing of the one world (LS_DOCK.mst, the same as the Training dock lamps): red = running, green = stopped,
   red blinking = trip. Values = the logic (I/O list transmitters); a value with no transmitter on a logic sheet (condenser seawater T / P,
   forebay level, debris filter DP, motor currents) comes from the plant model (unit.js AN_SW, beta.59), never from this page. Click on a machine =
   its info card (I/O list, DITL places), like the 007 fans. Drawn in a 1760 x 900 space, scaled to the 1920 x 1000 frame of hmi2.js. */
(function () {
  if (!window.PLANT_V2) return;
  const NS = 'http://www.w3.org/2000/svg';
  const S = {
    bar: '#11161b',
    ol: '#0c1014',
    nm: '#d3dbe2',
    lab: '#aab6c1',
    dim: '#7f8b97',
    box: '#0d1116',
    boxs: '#3a4550',
    val: '#e8eef3',
    run: '#d64545',
    stop: '#3fa34d',
    none: '#6b7480',
    m: ['#3e454c', '#b4bec7', '#4a525a'],
    cav: '#232a31',
    deck: '#59636d',
    conc: ['#3d4349', '#7b838a', '#353a3f'],
    water: ['#3d75a0', '#163a57'],
    wave: '#7fb0d8',
    air: '#20272e',
    /* media: c cold seawater, h warm seawater (after the condenser / CCWHE), w cooled water to the users, wr hot return from the users */
    med: {
      c: ['#5d7f9e', '#cfe3f3'],
      h: ['#a0805a', '#f3dcc0'],
      w: ['#4f8f86', '#c9efe9'],
      wr: ['#b0664a', '#f6cdb8'],
      off: ['#3a424b', null]
    }
  };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const OL = `stroke="${S.ol}" stroke-width="1"`;
  const T = (x, y, s, c, a) => `<text x="${x}" y="${y}" class="${c}"${a ? ' ' + a : ''}>${s}</text>`;
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  /* the machines: id, name, tag, run state address (LS_DOCK.mst), info card tag, kind of state text */
  const MACH = {
    SWA: { n: 'SWP-A', t: 'P-1501A', ad: 'M.3353', io: 'MIR-P1501A', d: 'DITL-29A' },
    SWB: { n: 'SWP-B', t: 'P-1501B', ad: 'M.3354', io: 'MIR-P1501B', d: 'DITL-29A #B' },
    SWC: { n: 'SWP-C', t: 'P-1501C', ad: 'M.3355', io: 'MIR-P1501C', d: 'DITL-29A #C' },
    BPA: { n: 'SWBP-A', t: 'P-1503A', ad: 'DITL-30', io: 'MIR-P1503A', d: 'DITL-30' },
    BPB: { n: 'SWBP-B', t: 'P-1503B', ad: 'DITL-30 #B', io: 'MIR-P1503B', d: 'DITL-30 #B' },
    BPC: { n: 'SWBP-C', t: 'P-1503C', ad: 'DITL-30 #C', io: 'MIR-P1503C', d: 'DITL-30 #C' },
    DF1: { n: 'S-1502', t: 'Debris filter', ad: 'DITL-39@3', io: 'DIR-DF1001', d: 'DITL-39', on: 'IN OPERATION' },
    DF2: { n: 'S-1504', t: 'Debris filter', ad: 'DITL-39@14', io: 'DIR-DF1002', d: 'DITL-39', on: 'IN OPERATION' },
    /* DITL-119 sends the panel its permission (DOP-CTCS100x "ON FEEDBACK CTCS") and REMOTE AUTO start / stop pulses; no running
       feedback comes back to the DCS: the run state is on the local control panel (LCP) */
    CTA: { n: 'CTCS-A', t: 'P-1113', lcp: 'STATUS AT LCP', io: 'DOP-CTCS1001', d: 'DITL-119' },
    CTB: { n: 'CTCS-B', t: 'P-1114', lcp: 'STATUS AT LCP', io: 'DOP-CTCS1002', d: 'DITL-119' },
    ACA: { n: 'ACWP-A', t: 'P-1108A', ad: 'DITL-76', io: 'MIR-P1108A', d: 'DITL-76' },
    ACB: { n: 'ACWP-B', t: 'P-1108B', ad: 'DITL-77', io: 'MIR-P1108B', d: 'DITL-77' },
    /* status DI of STN105 only (I/O list: running and overload of each pump, from the local panel HCDSP; P-0762A running = I.0329), no DCS
       command and no logic sheet reads them: the dosing pump the Training starts in the field (hypo) is P-0762A, its DI follows that start
       (live test 2026-10-30 #6: P-0762A said "field (local)", the other three "STN105 DI": all four are STN105 DI) */
    HUA: { n: 'P-0761A', t: 'Unloading', lcp: 'LOCAL', io: 'MIR-P0761A', d: 'STN105 DI' },
    HUB: { n: 'P-0761B', t: 'Unloading', lcp: 'LOCAL', io: 'MIR-P0761B', d: 'STN105 DI' },
    HDA: { n: 'P-0762A', t: 'NaOCl dosing', fld: 'hypo', io: 'MIR-P0762A', d: 'STN105 DI' },
    HDB: { n: 'P-0762B', t: 'NaOCl dosing', lcp: 'LOCAL', io: 'MIR-P0762B', d: 'STN105 DI' }
  };
  /* motor current tag of a pump (the value: plant model, unit.js AN_SW) */
  const AMP = {
    SWA: ['IIP1501A'],
    SWB: ['IIP1501B'],
    SWC: ['IIP1501C'],
    BPA: ['IIP1503A'],
    BPB: ['IIP1503B'],
    BPC: ['IIP1503C']
  };
  /* flow keys: a pipe moves while its key is on (SW any SWP, BP any SWBP, CL any ACWP, own machine for its branch, ST turbine steam) */
  const FLOW = {
    SW: ['SWA', 'SWB', 'SWC'],
    BP: ['BPA', 'BPB', 'BPC'],
    CL: ['ACA', 'ACB']
  };

  function art() {
    const o = [],
      G = { main: [[], [], [], []], ball: [[], [], [], []], cl: [[], [], [], []] };
    const rpath = (p, r) => {
      let d = `M${p[0][0]} ${p[0][1]}`;
      for (let i = 1; i < p.length - 1; i++) {
        const [x0, y0] = p[i - 1],
          [x1, y1] = p[i],
          [x2, y2] = p[i + 1];
        const l1 = Math.hypot(x1 - x0, y1 - y0),
          l2 = Math.hypot(x2 - x1, y2 - y1),
          rr = Math.min(r, l1 / 2, l2 / 2);
        const ax = x1 - ((x1 - x0) / l1) * rr,
          ay = y1 - ((y1 - y0) / l1) * rr,
          bx = x1 + ((x2 - x1) / l2) * rr,
          by = y1 + ((y2 - y1) / l2) * rr;
        d += ` L${ax.toFixed(1)} ${ay.toFixed(1)} Q${x1} ${y1} ${bx.toFixed(1)} ${by.toFixed(1)}`;
      }
      const e = p[p.length - 1];
      return d + ` L${e[0]} ${e[1]}`;
    };
    /* one pipe in 4 layers (outline, medium, highlight, moving dashes); f = flow key ('' = never flows: drawn as idle) */
    const pipe = (p, m, w, f, grp) => {
      const d = rpath(p, w * 1.6),
        med = S.med[m],
        L = G[grp || 'main'];
      L[0].push(`<path d="${d}" fill="none" stroke="${S.ol}" stroke-width="${w + 2.5}"/>`);
      L[1].push(
        `<path d="${d}" fill="none" stroke="${f ? med[0] : S.med.off[0]}" stroke-width="${w}"${f ? ` data-fb="${f}" data-c="${med[0]}"` : ''}/>`
      );
      L[2].push(
        `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="${Math.max(1, w * 0.28)}" transform="translate(0 ${-w * 0.18})"/>`
      );
      if (f)
        L[3].push(
          `<path d="${d}" class="swfl" data-f="${f}" stroke="${med[1]}" stroke-width="${w > 10 ? 2.4 : w > 5 ? 1.8 : 1.3}"/>`
        );
    };
    /* one label standard for every machine: NAME / tag or description / STATE (red RUN, green STOP) / logic sheet */
    const eq = (x, y, id, anchor) => {
      const M = MACH[id],
        a = `text-anchor="${anchor || 'start'}"`;
      return (
        T(x, y, M.n, 'sw11', a) +
        T(x, y + 12, M.t, 'sw9', a) +
        T(x, y + 24, '-----', 'sw9b', `${a} data-st="${id}"`) +
        T(x, y + 36, esc(M.d), 'sw8', a)
      );
    };
    const vbox = (x, y, tag, u, est, k) =>
      `<g data-vb="${k || tag}" style="cursor:pointer">${T(x, y - 4, tag, 'sw9')}<rect x="${x}" y="${y}" width="58" height="17" rx="1.5" fill="${S.box}" stroke="${S.boxs}"/>${T(x + 54, y + 13, '-----', 'swv', `text-anchor="end" data-v="${k || tag}"`)}${T(x + 62, y + 13, u, 'sw9')}</g>`;
    /* the mode line of a pump: REM / LOC (field selector) and AUTO / MAN (CRT selection), live from its drawing (LS_DOCK.modeOf) */
    const md = (x, y, id) =>
      `<g data-mdh="${id}" style="cursor:pointer">${T(x, y, `<tspan data-rem="${id}">---</tspan><tspan fill="${S.dim}"> · </tspan><tspan data-au="${id}">---</tspan>`, 'sw9b')}</g>`;
    const imp = (x, y, r, id) =>
      `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#11161b"/><g data-imp="${id}">${[0, 1, 2, 3, 4].map(i => `<path d="M0 0 Q${r * 0.55} ${-r * 0.2} ${r * 0.85} ${-r * 0.5}" transform="rotate(${i * 72})" stroke="#c3ccd5" stroke-width="${r / 5}" fill="none" stroke-linecap="round"/>`).join('')}</g><circle r="${r * 0.22}" fill="#c3ccd5"/></g>`;
    const valve = (x, y, vert, lab, la) => {
      const b = vert
        ? `M${x - 7} ${y - 8} L${x + 7} ${y - 8} L${x - 7} ${y + 8} L${x + 7} ${y + 8} Z`
        : `M${x - 8} ${y - 7} L${x + 8} ${y + 7} L${x + 8} ${y - 7} L${x - 8} ${y + 7} Z`;
      const st = vert
        ? `<line x1="${x}" y1="${y}" x2="${x + 12}" y2="${y}" stroke="${S.ol}"/><line x1="${x + 12}" y1="${y - 5}" x2="${x + 12}" y2="${y + 5}" stroke="#9aa5ae" stroke-width="2"/>`
        : `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 12}" stroke="${S.ol}"/><line x1="${x - 5}" y1="${y - 12}" x2="${x + 5}" y2="${y - 12}" stroke="#9aa5ae" stroke-width="2"/>`;
      const t = !lab
        ? ''
        : la === 'rb'
          ? T(x + 10, y + 20, lab, 'sw8')
          : la === 'up'
            ? T(x, y - 15, lab, 'sw8', 'text-anchor="middle"')
            : la === 'l'
              ? T(x - 10, y + 3, lab, 'sw8', 'text-anchor="end"')
              : T(x + 17, y + 3, lab, 'sw8');
      return `<g><title>${lab} · manual valve (field)</title><path d="${b}" fill="${S.m[1]}" ${OL}/>${st}${t}</g>`;
    };
    /* backwash valve: local (debris filter panel), no DCS signal: grey */
    const mov = (x, y, lab, tip) =>
      `<g><title>${tip}</title><path d="M${x - 8} ${y - 7} L${x + 8} ${y + 7} L${x + 8} ${y - 7} L${x - 8} ${y + 7} Z" fill="${S.none}" ${OL}/><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 10}" stroke="${S.ol}"/><rect x="${x - 8}" y="${y - 24}" width="16" height="14" rx="2" fill="url(#swmv)" ${OL}/>${T(x, y - 13, 'M', 'sw8', 'text-anchor="middle" style="fill:#0c1014;font-weight:600"')}${lab ? T(x, y + 20, lab, 'sw8', 'text-anchor="middle"') : ''}</g>`;
    const filt = (cx, cy, vert, id) => {
      const body = vert
        ? `<rect x="${cx - 22}" y="${cy - 34}" width="44" height="68" rx="20" fill="url(#swmt)" ${OL}/>`
        : `<rect x="${cx - 34}" y="${cy - 22}" width="68" height="44" rx="20" fill="url(#swmv)" ${OL}/>`;
      return `<g data-hit="${id}" style="cursor:pointer">${body}<circle cx="${cx}" cy="${cy}" r="15" fill="${S.cav}" ${OL}/><g transform="translate(${cx} ${cy})"><g data-imp="${id}" data-slow="1">${[0, 45, 90, 135].map(a => `<line x1="-13" y1="0" x2="13" y2="0" transform="rotate(${a})" stroke="#8fa0b0" stroke-width="1.6"/>`).join('')}</g></g></g>`;
    };
    const hpump = (x, y, id, r) => {
      r = r || 14;
      return `<g data-hit="${id}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#swmv)" ${OL}/><circle cx="${x}" cy="${y}" r="${r * 0.64}" fill="${S.cav}"/>${imp(x, y, r * 0.55, id)}<rect x="${x + r}" y="${y - 3}" width="8" height="6" fill="${S.m[1]}" ${OL}/><rect x="${x + r + 8}" y="${y - r * 0.65}" width="${r * 3.1}" height="${r * 1.3}" rx="3" fill="url(#swmv)" ${OL}/><rect x="${x + r + 8}" y="${y + r * 0.65 + 1}" width="${r * 3.1}" height="3" fill="${S.none}" data-lamp="${id}"/></g>`;
    };
    const hpumpL = (x, y, id, r) =>
      `<g data-hit="${id}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#swmv)" ${OL}/><circle cx="${x}" cy="${y}" r="${r * 0.64}" fill="${S.cav}"/>${imp(x, y, r * 0.55, id)}<rect x="${x - r - 8}" y="${y - 3}" width="8" height="6" fill="${S.m[1]}" ${OL}/><rect x="${x - r - 8 - r * 3.1}" y="${y - r * 0.65}" width="${r * 3.1}" height="${r * 1.3}" rx="3" fill="url(#swmv)" ${OL}/><rect x="${x - r - 8 - r * 3.1}" y="${y + r * 0.65 + 1}" width="${r * 3.1}" height="3" fill="${S.none}" data-lamp="${id}"/></g>`;

    /* ---------------- discharge: siphon pit + channel ---------------- */
    o.push(
      `<rect x="1170" y="70" width="70" height="66" fill="url(#swcc)" ${OL}/><rect x="1176" y="84" width="58" height="48" fill="url(#swwt)"/>` +
        T(1162, 154, 'SIPHON PIT', 'sw9', 'text-anchor="end"')
    );
    o.push(
      `<rect x="1240" y="74" width="512" height="34" fill="url(#swcc)" ${OL}/><rect x="1240" y="84" width="508" height="20" fill="url(#swwt)"/>`
    );
    o.push(
      `<path d="M1244 89 ${Array(25).fill('q10 -3 20 0').join(' ')}" fill="none" stroke="${S.wave}" stroke-width="1.2" class="swwv"/>`
    );
    o.push(T(1748, 68, 'SEAWATER DISCHARGE CHANNEL  ▸ TO SEA', 'sw11', 'text-anchor="end"'));
    /* ---------------- forebay + SWP ---------------- */
    o.push(
      `<rect x="22" y="300" width="378" height="420" fill="${S.air}"/><rect x="22" y="470" width="378" height="250" fill="url(#swwt)" data-k="pool"/>`
    );
    o.push(
      /* the wave in a group: the level moves the group (the CSS animation owns the transform of the path) */
      `<g data-k="poolw"><path d="M24 474 ${Array(19).fill('q10 -3 20 0').join(' ')}" fill="none" stroke="${S.wave}" stroke-width="1.3" class="swwv"/></g>`
    );
    o.push(
      `<path d="M18 300 V724 H404 V300" fill="none" stroke="url(#swcc)" stroke-width="8"/><rect x="4" y="296" width="410" height="5" fill="${S.deck}"/>` +
        T(408, 290, 'EL. ±0 (GL)', 'sw9', 'text-anchor="end"')
    );
    o.push(
      T(20, 746, 'SEAWATER PUMP INLET POOL (FOREBAY)', 'sw11') + T(20, 759, '◂ from sea, through trash screen', 'sw9')
    );
    o.push(vbox(300, 742, 'LISW1501', 'm', 1) + T(300, 773, 'NL 4 m below GL (PR-OPE-5002)', 'sw8'));
    [
      ['SWA', 80, 'V-SW1002'],
      ['SWB', 196, 'V-SW1004'],
      ['SWC', 312, 'V-SW1006']
    ].forEach(([id, x, v]) => {
      pipe(
        [
          [x + 16, 284],
          [x + 34, 284],
          [x + 34, 150]
        ],
        'c',
        11,
        id
      );
      o.push(`<g data-hit="${id}" style="cursor:pointer">`);
      o.push(`<rect x="${x - 6}" y="300" width="12" height="352" fill="url(#swmt)" ${OL}/>`);
      o.push(
        `<path d="M${x - 18} 650 h36 v38 q0 9 -7 13 h-22 q-7 -4 -7 -13z" fill="url(#swmt)" ${OL}/><path d="M${x - 24} 716 h48 l-7 -8 h-34z" fill="url(#swmt)" ${OL}/>`
      );
      o.push(`<circle cx="${x}" cy="676" r="13" fill="${S.cav}" ${OL}/>` + imp(x, 676, 11, id));
      o.push(`<rect x="${x - 17}" y="266" width="34" height="34" rx="2" fill="url(#swmt)" ${OL}/>`);
      o.push(
        `<rect x="${x - 24}" y="200" width="48" height="60" rx="4" fill="url(#swmt)" ${OL}/>` +
          [208, 217, 226, 235, 244]
            .map(y => `<line x1="${x - 22}" y1="${y}" x2="${x + 22}" y2="${y}" stroke="${S.ol}" stroke-opacity=".45"/>`)
            .join('')
      );
      o.push(
        `<ellipse cx="${x}" cy="200" rx="18" ry="5" fill="url(#swmt)" ${OL}/><rect x="${x - 24}" y="260" width="48" height="5" fill="${S.none}" data-lamp="${id}"/></g>`
      );
      o.push(
        T(x - 6, 180, MACH[id].n, 'sw11', 'text-anchor="middle"') +
          T(x - 6, 192, MACH[id].t, 'sw9', 'text-anchor="middle"')
      );
      o.push(vbox(x + 12, 326, AMP[id][0], 'A', 1));
      o.push(T(x + 12, 362, '-----', 'sw9b', `data-st="${id}"`) + T(x + 12, 374, MACH[id].d, 'sw8'));
      /* live test 2026-10-30 #5 (#121, snapshot 30.PNG: VCB ON / OFF, R, M / A at each SWP): REMOTE / LOCAL and AUTO / MAN of DITL-29A, the VCB */
      o.push(md(x + 12, 390, id) + T(x + 12, 402, '-----', 'sw9b', `data-vcb="${id}"`));
      /* live test beta.74 #35: the discharge pressure of the pump, local gauge PG-SW1501x (SOP 2.2 ~ 2.4 ksc) */
      o.push(vbox(x + 12, 428, 'PGSW1501' + id[2], 'kg/cm²', 1) + T(x + 12, 458, 'local · SOP 2.2 ~ 2.4', 'sw8'));
      o.push(valve(x + 34, 226, 1, v, 'rb'));
    });
    /* 96" header -> S-1502 -> condenser inlets */
    pipe(
      [
        [108, 150],
        [480, 150],
        [480, 640],
        [644, 640]
      ],
      'c',
      15,
      'SW'
    );
    o.push(filt(480, 360, 1, 'DF1'));
    o.push(eq(512, 342, 'DF1'));
    o.push(vbox(494, 406, 'DPISW1502', 'mmH2O', 1) + T(494, 434, 'backwash cut-in 816 (80 mbar)', 'sw8'));
    pipe(
      [
        [458, 380],
        [440, 380],
        [440, 432]
      ],
      'c',
      5,
      ''
    );
    o.push(
      mov(440, 412, 'MV-SW1001', 'MV-SW1001 backwash to drain · local (debris filter panel), no DCS signal') +
        T(442, 444, 'BACKWASH', 'sw8', 'text-anchor="middle"') +
        T(442, 455, '▾ DRAIN', 'sw8', 'text-anchor="middle"')
    );

    /* ---------------- condenser H-1110: front water box (2 pass), shell, return box ---------------- */
    const CX0 = 600,
      CX1 = 1000,
      CY0 = 320,
      CY1 = 540,
      MID = 430;
    pipe(
      [
        [638, 640],
        [638, 530]
      ],
      'c',
      12,
      'SW'
    );
    pipe(
      [
        [612, 640],
        [612, 530]
      ],
      'c',
      12,
      'SW'
    );
    o.push(valve(638, 612, 1, 'V-SW1008') + valve(612, 612, 1, 'V-SW1007', 'l'));
    pipe(
      [
        [612, 330],
        [612, 120],
        [1170, 120]
      ],
      'h',
      12,
      'SW'
    );
    pipe(
      [
        [638, 330],
        [638, 136],
        [1170, 136]
      ],
      'h',
      12,
      'SW'
    );
    o.push(valve(612, 262, 1, 'V-SW1009', 'l') + valve(638, 262, 1, 'V-SW1010'));
    o.push(
      `<rect x="600" y="196" width="24" height="34" rx="3" fill="url(#swmt)" ${OL}/><rect x="626" y="196" width="24" height="34" rx="3" fill="url(#swmt)" ${OL}/>`
    );
    o.push(
      `<path d="M603 200 l18 26 M629 200 l18 26" stroke="#8fa0b0" stroke-width="1.4"/>` +
        T(596, 210, 'L-1111 / 1112', 'sw8', 'text-anchor="end"') +
        T(596, 222, 'BALL SEP.', 'sw8', 'text-anchor="end"')
    );
    o.push(
      `<path d="M720 ${CY0} L742 286 H878 L900 ${CY0} Z" fill="url(#swmv)" ${OL}/>` +
        T(810, 306, 'LP TURBINE EXHAUST STEAM ▾', 'sw8', 'text-anchor="middle" style="fill:#0c1014;font-weight:600"')
    );
    o.push(T(810, 278, 'CONDENSER  H-1110  (A / B)', 'sw11', 'text-anchor="middle"'));
    o.push(
      `<rect x="${CX0 + 50}" y="${CY0}" width="${CX1 - CX0 - 50}" height="${CY1 - CY0}" rx="12" fill="url(#swmv)" ${OL}/>`
    );
    o.push(
      `<rect x="${CX0 + 60}" y="${CY0 + 8}" width="${CX1 - CX0 - 70}" height="${CY1 - CY0 - 16}" rx="6" fill="#141a20" stroke="#59636d"/>`
    );
    /* tube side: upper pass (outlet, warm, right -> left), lower pass (inlet, cold, left -> right) */
    const tubes = (y0, y1, m, dir) => {
      let s = '';
      for (let y = y0; y <= y1; y += 9) {
        s += `<line x1="${CX0 + 62}" y1="${y}" x2="${CX1 - 10}" y2="${y}" stroke="${S.med[m][0]}" stroke-width="3.2" data-fb="SW" data-c="${S.med[m][0]}"/>`;
        s += `<line x1="${CX0 + 62}" y1="${y}" x2="${CX1 - 10}" y2="${y}" class="${dir > 0 ? 'swfl' : 'swfl swflr'}" data-f="SW" stroke="${S.med[m][1]}" stroke-width="1.1" style="animation-delay:-${((y % 7) / 5).toFixed(2)}s"/>`;
      }
      return s;
    };
    o.push(tubes(CY0 + 34, MID - 14, 'h', -1) + tubes(MID + 14, CY1 - 34, 'c', 1));
    [740, 820, 900].forEach(x =>
      o.push(`<rect x="${x}" y="${CY0 + 14}" width="4" height="${CY1 - CY0 - 44}" fill="#59636d" opacity=".8"/>`)
    );
    /* shell side: exhaust steam through the bundle, condensate drops to the hotwell (while the turbine passes steam) */
    let st = '<g data-k="steam">';
    for (let i = 0; i < 26; i++) {
      const x = 680 + ((i * 53) % 300),
        dur = 2.4 + (i % 5) * 0.35,
        del = (i * 0.37) % dur;
      st += `<circle cx="${x}" cy="${CY0 + 10}" r="${1.4 + (i % 3) * 0.5}" fill="#e9edf0" opacity="0"><animate attributeName="cy" from="${CY0 + 6}" to="${CY1 - 26}" dur="${dur}s" begin="-${del.toFixed(2)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.75;.55;0" dur="${dur}s" begin="-${del.toFixed(2)}s" repeatCount="indefinite"/></circle>`;
    }
    for (let i = 0; i < 8; i++) {
      const x = 770 + i * 11,
        dur = 1.1 + (i % 3) * 0.2;
      st += `<ellipse cx="${x}" cy="${CY1 - 30}" rx="1.4" ry="2.4" fill="#7fb0d8"><animate attributeName="cy" from="${CY1 - 30}" to="${CY1 + 14}" dur="${dur}s" begin="-${(i * 0.29).toFixed(2)}s" repeatCount="indefinite"/></ellipse>`;
    }
    o.push(st + '</g>');
    o.push(
      `<rect x="750" y="${CY1 - 2}" width="120" height="34" rx="4" fill="url(#swmv)" ${OL}/><rect x="755" y="${CY1 + 12}" width="110" height="18" fill="url(#swwt)"/><path d="M757 ${CY1 + 14} q9 -3 18 0 t18 0 t18 0 t18 0 t18 0 t18 0" fill="none" stroke="${S.wave}" class="swwv"/>`
    );
    o.push(T(876, CY1 + 14, 'HOTWELL', 'sw8') + T(876, CY1 + 25, '▸ 028 CONDENSATE', 'sw8'));
    o.push(
      `<rect x="${CX0 + 60}" y="${CY0 + 10}" width="200" height="14" rx="2" fill="${S.bar}" fill-opacity=".92"/><rect x="${CX0 + 60}" y="${CY1 - 30}" width="140" height="14" rx="2" fill="${S.bar}" fill-opacity=".92"/>`
    );
    o.push(
      T(CX0 + 64, CY0 + 20, 'SHELL SIDE: steam condenses on the tubes', 'sw8') +
        T(CX0 + 64, CY1 - 20, 'TUBE SIDE: seawater, 2 pass', 'sw8')
    );
    o.push(
      `<rect x="${CX0}" y="${CY0 + 4}" width="52" height="${CY1 - CY0 - 8}" rx="6" fill="url(#swmt)" ${OL}/><line x1="${CX0}" y1="${MID}" x2="${CX0 + 52}" y2="${MID}" stroke="${S.ol}" stroke-width="3"/>`
    );
    o.push(
      T(CX0 + 26, MID - 50, 'OUT', 'sw8', 'text-anchor="middle" style="fill:#0c1014;font-weight:600"') +
        T(CX0 + 26, MID + 56, 'IN', 'sw8', 'text-anchor="middle" style="fill:#0c1014;font-weight:600"')
    );
    o.push(
      `<rect x="${CX1 - 8}" y="${CY0 + 4}" width="34" height="${CY1 - CY0 - 8}" rx="8" fill="url(#swmt)" ${OL}/><path d="M${CX1 + 8} ${MID + 40} C${CX1 + 22} ${MID + 20} ${CX1 + 22} ${MID - 20} ${CX1 + 8} ${MID - 40}" fill="none" stroke="${S.med.c[1]}" stroke-width="1.6" class="swfl" data-f="SW"/>`
    );
    o.push(
      T(CX1 + 9, CY1 + 4, 'RETURN', 'sw8', 'text-anchor="middle"') +
        T(CX1 + 9, CY1 + 14, 'WATER BOX', 'sw8', 'text-anchor="middle"')
    );
    [
      ['TISW1110A1', '°C'],
      ['PISW1110A1', 'kg/cm²'],
      ['TISW1110B1', '°C'],
      ['PISW1110B1', 'kg/cm²']
    ].forEach((q, i) => o.push(vbox(700 + i * 96, 624, q[0], q[1], 1)));
    o.push(T(700, 656, 'CONDENSER INLET A / B (normal 1.0 ~ 1.1 kg/cm²)', 'sw8'));
    [
      ['TISW1110A2', '°C'],
      ['PISW1110A2', 'kg/cm²'],
      ['TISW1110B2', '°C'],
      ['PISW1110B2', 'kg/cm²']
    ].forEach((q, i) => o.push(vbox(680 + i * 98, 200, q[0], q[1], 1)));
    o.push(T(680, 232, 'CONDENSER OUTLET A / B', 'sw8'));

    /* ---------------- condenser tube cleaning (sponge ball) A / B ---------------- */
    o.push(
      T(1066, 238, 'CONDENSER TUBE CLEANING', 'sw9', 'text-anchor="end"') +
        T(1066, 250, '(sponge ball)', 'sw8', 'text-anchor="end"')
    );
    [
      [1080, 'CTA', '1115', 600, 213, 586, 160, 590, 612, 404],
      [1180, 'CTB', '1116', 650, 222, 664, 174, 578, 638, 458]
    ].forEach(c => {
      const [x, id, tv, rx, ry, ux, uy, iy, ix, ey] = c;
      pipe(
        [
          [rx, ry],
          [ux, ry],
          [ux, uy],
          [x, uy],
          [x, 266]
        ],
        'c',
        3,
        id,
        'ball'
      );
      pipe(
        [
          [x, 286],
          [x, 330]
        ],
        'c',
        3,
        id,
        'ball'
      );
      pipe(
        [
          [x + 10, 384],
          [x + 10, iy],
          [ix, iy]
        ],
        'c',
        3,
        id,
        'ball'
      );
      o.push(hpump(x, 276, id, 9));
      o.push(
        `<path d="M${x - 8} 330 h36 v16 l-11 18 h-14 l-11 -18z" fill="url(#swmv)" ${OL}/><rect x="${x + 5}" y="364" width="10" height="20" fill="url(#swmt)" ${OL}/>` +
          T(x + 14, 378, 'T-' + tv, 'sw8')
      );
      o.push(eq(1094, ey, id));
    });
    o.push(T(700, 600, 'ball injection V-PIECE Z-1115 / Z-1116', 'sw8'));

    /* ---------------- SWBP from the 96" header (SW-1-055 24") ---------------- */
    pipe(
      [
        [520, 640],
        [520, 690],
        [560, 690],
        [560, 848],
        [604, 848]
      ],
      'c',
      10,
      'SW'
    );
    o.push(T(590, 690, 'SEAWATER BOOSTER PUMPS', 'sw11'));
    const BP = [
      ['BPA', 724, 'V-SW1016'],
      ['BPB', 786, 'V-SW1018'],
      ['BPC', 848, 'V-SW1020']
    ];
    BP.forEach(([id, y]) => {
      if (id !== 'BPC')
        pipe(
          [
            [560, y],
            [604, y]
          ],
          'c',
          9,
          'SW'
        );
      pipe(
        [
          [618, y - 14],
          [618, y - 26],
          [960, y - 26]
        ],
        'c',
        9,
        id
      );
    });
    pipe(
      [
        [960, 828],
        [960, 700],
        [1010, 700]
      ],
      'c',
      12,
      'BP'
    );
    BP.forEach(([id, y, v]) => {
      o.push(hpump(618, y, id));
      o.push(eq(704, y - 8, id));
      /* #5: REMOTE / LOCAL and AUTO / MAN of DITL-30 (30.PNG: R, M / A beside SWBP-A / B / C; the SWBP have no VCB DI) */
      o.push(md(760, y - 8, id));
      o.push(vbox(840, y - 6, AMP[id][0], 'A', 1));
      o.push(valve(930, y - 26, 0, v, 'up'));
    });
    o.push(filt(1044, 700, 0, 'DF2'));
    pipe(
      [
        [1060, 678],
        [1060, 668],
        [1112, 668]
      ],
      'c',
      5,
      ''
    );
    o.push(
      mov(1092, 668, '', 'MV-SW1002 backwash to drain · local (debris filter panel), no DCS signal') +
        T(1116, 672, 'MV-SW1002 BACKWASH', 'sw8')
    );
    o.push(eq(1044, 738, 'DF2', 'middle'));
    o.push(vbox(1112, 746, 'DPISW1504', 'mmH2O', 1) + T(1112, 774, 'backwash cut-in 816 (80 mbar)', 'sw8'));
    pipe(
      [
        [1078, 700],
        [1232, 700],
        [1232, 310],
        [1254, 310]
      ],
      'c',
      12,
      'BP'
    );

    /* ---------------- CCWHE H-1107A / B / C: seawater left -> right; the closed aux cooling water loop (PD-021) ---------------- */
    [
      ['A', 260],
      ['B', 360],
      ['C', 460]
    ].forEach(([n, y]) => {
      if (n !== 'A')
        pipe(
          [
            [1232, y + 50],
            [1254, y + 50]
          ],
          'c',
          9,
          'BP'
        );
      if (n !== 'C')
        pipe(
          [
            [1340, y + 24],
            [1366, y + 24]
          ],
          'h',
          9,
          'BP'
        );
      if (n !== 'C')
        pipe(
          [
            [1340, y + 8],
            [1410, y + 8]
          ],
          'w',
          6,
          'CL',
          'cl'
        );
      if (n !== 'A')
        pipe(
          [
            [1380, y + 56],
            [1340, y + 56]
          ],
          'wr',
          6,
          'CL',
          'cl'
        );
      o.push(
        `<rect x="1254" y="${y}" width="86" height="64" fill="url(#swpl)" ${OL}/><rect x="1250" y="${y - 4}" width="12" height="72" fill="url(#swmt)" ${OL}/><rect x="1332" y="${y - 4}" width="12" height="72" fill="url(#swmt)" ${OL}/><line x1="1256" y1="${y - 8}" x2="1338" y2="${y - 8}" stroke="#9aa5ae" stroke-width="2.4"/><line x1="1256" y1="${y + 72}" x2="1338" y2="${y + 72}" stroke="#9aa5ae" stroke-width="2.4"/>`
      );
      o.push(T(1297, y - 13, 'H-1107' + n + '  CCWHE-' + n, 'sw9', 'text-anchor="middle"'));
    });
    pipe(
      [
        [1340, 484],
        [1366, 484],
        [1366, 170],
        [1205, 170],
        [1205, 136]
      ],
      'h',
      12,
      'BP'
    );
    o.push(T(1297, 226, 'CCW HEAT EXCHANGERS', 'sw9', 'text-anchor="middle" style="font-weight:600"'));
    const USERS = [
      'Turbine lube oil cooler A / B',
      'Generator air coolers',
      'BFWP-A / B lube oil cooler and motor',
      'PAF / SAF / IDF oil cooler and bearings',
      'Gas air heater (APH) bearings',
      'Bottom ash screw conveyors A ~ D',
      'Instrument air compressors + dryers A ~ C',
      'Plant air compressors + dryers A ~ C',
      'Sampling rack'
    ];
    pipe(
      [
        [1340, 468],
        [1410, 468],
        [1410, 216],
        [1452, 216]
      ],
      'w',
      7,
      'CL',
      'cl'
    );
    o.push(T(1450, 184, 'AUX COOLING WATER USERS', 'sw11') + T(1450, 196, 'P&amp;ID K1AU3-PD-021', 'sw8'));
    USERS.forEach((u, i) => {
      const y = 216 + i * 29;
      if (i)
        pipe(
          [
            [1410, y],
            [1452, y]
          ],
          'w',
          4,
          'CL',
          'cl'
        );
      if (i)
        pipe(
          [
            [1682, y],
            [1712, y]
          ],
          'wr',
          4,
          'CL',
          'cl'
        );
      o.push(
        `<rect x="1452" y="${y - 10}" width="230" height="20" rx="3" fill="#232a31" stroke="#46525e"/><path d="M1457 ${y + 6} l4 -12 l4 12 l4 -12 l4 12" fill="none" stroke="${S.med.w[1]}" stroke-width="1"/>` +
          T(1482, y + 3.5, u, 'sw7')
      );
    });
    pipe(
      [
        [1682, 216],
        [1712, 216],
        [1712, 600],
        [1630, 600],
        [1630, 750],
        [1614, 750]
      ],
      'wr',
      7,
      'CL',
      'cl'
    );
    pipe(
      [
        [1630, 650],
        [1614, 650]
      ],
      'wr',
      6,
      'CL',
      'cl'
    );
    o.push(
      `<rect x="1638" y="500" width="50" height="74" rx="22" fill="url(#swmt)" ${OL}/><rect x="1642" y="532" width="42" height="36" rx="12" fill="url(#swwt)"/>` +
        T(1630, 528, 'T-1109', 'sw8', 'text-anchor="end"') +
        T(1630, 539, 'EXPANSION TANK', 'sw8', 'text-anchor="end"')
    );
    pipe(
      [
        [1663, 574],
        [1663, 600]
      ],
      'wr',
      5,
      'CL',
      'cl'
    );
    pipe(
      [
        [1600, 638],
        [1600, 628],
        [1450, 628]
      ],
      'wr',
      6,
      'ACA',
      'cl'
    );
    pipe(
      [
        [1600, 738],
        [1600, 728],
        [1450, 728]
      ],
      'wr',
      6,
      'ACB',
      'cl'
    );
    pipe(
      [
        [1450, 733],
        [1450, 620],
        [1380, 620],
        [1380, 316],
        [1340, 316]
      ],
      'wr',
      7,
      'CL',
      'cl'
    );
    o.push(hpumpL(1600, 650, 'ACA', 12) + eq(1572, 676, 'ACA', 'middle'));
    o.push(hpumpL(1600, 750, 'ACB', 12) + eq(1572, 776, 'ACB', 'middle'));
    o.push(
      `<rect x="1450" y="822" width="18" height="5" fill="${S.med.w[0]}"/><rect x="1590" y="822" width="18" height="5" fill="${S.med.wr[0]}"/>` +
        T(1472, 828, 'COOLED (to users)', 'sw8') +
        T(1612, 828, 'HOT RETURN (from users)', 'sw8')
    );
    o.push(
      T(1450, 846, 'Closed loop of clean water (not seawater): the seawater in the', 'sw8') +
        T(1450, 858, 'CCWHE takes away the heat of the users.', 'sw8')
    );

    /* ---------------- hypo-chlorinated dosing (status only, no DCS command) ---------------- */
    o.push(T(20, 796, 'HYPO-CHLORINATED DOSING', 'sw11'));
    o.push(
      `<rect x="22" y="806" width="40" height="50" rx="6" fill="#4a4f3a" ${OL}/>` +
        T(42, 836, 'NaOCl', 'sw8', 'text-anchor="middle"')
    );
    [
      ['HUA', 100],
      ['HUB', 172],
      ['HDA', 244],
      ['HDB', 316]
    ].forEach(([id, x]) =>
      o.push(
        `<g data-hit="${id}" style="cursor:pointer"><circle cx="${x}" cy="818" r="9" fill="url(#swmv)" ${OL}/><rect x="${x - 12}" y="829" width="24" height="3" fill="${S.none}" data-lamp="${id}"/></g>` +
          eq(x, 846, id, 'middle')
      )
    );
    o.push(T(360, 818, 'status only', 'sw8') + T(360, 829, '(no DCS command)', 'sw8'));
    o.push(
      T(
        1744,
        874,
        'values with no transmitter on a logic sheet: plant model (Plant model ON)',
        'sw8',
        'text-anchor="end"'
      )
    );

    const defs = `<defs><linearGradient id="swmt" x1="0" x2="1"><stop offset="0" stop-color="${S.m[0]}"/><stop offset=".45" stop-color="${S.m[1]}"/><stop offset="1" stop-color="${S.m[2]}"/></linearGradient>
<linearGradient id="swmv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.m[2]}"/><stop offset=".4" stop-color="${S.m[1]}"/><stop offset="1" stop-color="${S.m[0]}"/></linearGradient>
<linearGradient id="swcc" x1="0" x2="1"><stop offset="0" stop-color="${S.conc[0]}"/><stop offset=".45" stop-color="${S.conc[1]}"/><stop offset="1" stop-color="${S.conc[2]}"/></linearGradient>
<linearGradient id="swwt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.water[0]}"/><stop offset="1" stop-color="${S.water[1]}"/></linearGradient>
<pattern id="swpl" width="6" height="10" patternUnits="userSpaceOnUse"><rect width="6" height="10" fill="#3a434c"/><rect x="2" width="2" height="10" fill="#7f8a94"/></pattern></defs>`;
    const UF = "font-family:Barlow,'IBM Plex Sans','Segoe UI',Roboto,Arial,sans-serif",
      MF = "font-family:'Roboto Mono','JetBrains Mono',Consolas,monospace";
    const css = `<style>.sw7{font-size:8.5px;fill:${S.nm};${UF}}.sw8{font-size:8.5px;fill:${S.dim};${UF}}.sw9{font-size:9.5px;fill:${S.dim};${UF}}.sw9b{font-size:9.5px;font-weight:600;fill:${S.none};${UF}}.sw11{font-size:11px;font-weight:600;fill:${S.nm};${UF}}
.swv{font-size:12px;fill:${S.none};${MF}}
.swfl{fill:none;stroke-dasharray:2 14;stroke-linecap:round;animation:swfl 1.4s linear infinite}.swflr{animation-direction:reverse}@keyframes swfl{to{stroke-dashoffset:-32}}
.swwv{animation:swwv 3s ease-in-out infinite alternate}@keyframes swwv{to{transform:translateX(-8px)}}
@media (prefers-reduced-motion:reduce){.swfl,.swwv{animation:none}}</style>`;
    /* the pipes first (under the machines, the pit and the forebay), the closed loop over the seawater where they cross */
    return css + defs + ['ball', 'main', 'cl'].map(k => G[k].map(l => l.join('')).join('')).join('') + o.join('');
  }

  /* ---------- live links ---------- */
  function seawater(g, api) {
    const pg = document.createElementNS(NS, 'g');
    /* the 1760 x 900 drawing in the 1920 x 1000 frame (title and alarm bar of hmi2.js above y 54, navigation below y 968) */
    pg.setAttribute('transform', 'translate(0 2) scale(1.0909)');
    pg.innerHTML = art();
    g.append(pg);
    const q = s => pg.querySelector(s),
      qa = s => pg.querySelectorAll(s);
    const info = tag => {
      try {
        if (window.lsInfo) window.lsInfo(tag);
      } catch (e) {}
    };
    /* run states: the motor drawings of the one world (the Training dock lamps read the same) */
    const ST = {};
    const mst = M => {
      try {
        if (M.fld) return window.AN && AN.fieldState ? (AN.fieldState()[M.fld] ? 'RUN' : 'STOP') : null;
        return M.ad && window.LS_DOCK && LS_DOCK.mst ? LS_DOCK.mst(M.ad) : null;
      } catch (e) {
        return null;
      }
    };
    const spin = {};
    const setSpin = (id, on) => {
      const el = q(`[data-imp="${id}"]`);
      if (!el) return;
      if (on && !spin[id]) {
        const slow = el.dataset.slow;
        spin[id] = document.createElementNS(NS, 'animateTransform');
        for (const [k, v] of Object.entries({
          attributeName: 'transform',
          type: 'rotate',
          from: '0',
          to: '360',
          dur: slow ? '6s' : '1s',
          repeatCount: 'indefinite'
        }))
          spin[id].setAttribute(k, v);
        el.append(spin[id]);
        try {
          spin[id].beginElement();
        } catch (e) {}
      } else if (!on && spin[id]) {
        spin[id].remove();
        spin[id] = null;
        el.removeAttribute('transform');
      }
    };
    const flow = (k, on) =>
      qa(`[data-f="${k}"],[data-fb="${k}"]`).forEach(e => {
        if (e.dataset.f) e.setAttribute('visibility', on ? 'visible' : 'hidden');
        else e.setAttribute('stroke', on ? e.dataset.c : S.med.off[0]);
      });
    let steam = null;
    const MDS = ['SWA', 'SWB', 'SWC', 'BPA', 'BPB', 'BPC'],
      MD = {};
    const tick = () => {
      for (const id in MACH) {
        const M = MACH[id],
          s = mst(M);
        if (s === ST[id] && ST[id] !== undefined) continue;
        ST[id] = s;
        const col = s == null ? S.none : s === 'TRIP' ? S.run : s === 'RUN' ? S.run : S.stop;
        qa(`[data-lamp="${id}"]`).forEach(e => e.setAttribute('fill', col));
        qa(`[data-st="${id}"]`).forEach(e => {
          e.textContent =
            s == null ? M.lcp || '-----' : s === 'TRIP' ? 'TRIP' : s === 'RUN' ? M.on || 'RUNNING' : 'STOPPED';
          e.style.fill = col;
          e.classList.toggle('h2blink', s === 'TRIP');
        });
        setSpin(id, s === 'RUN');
        /* #5: the VCB of an SWP (I/O list STN103 DI "VCB on" / "VCB off", I.032E / F, I.052A / B, I.081E / F; no logic sheet reads them):
           closed while the motor runs */
        qa(`[data-vcb="${id}"]`).forEach(e => {
          e.textContent = s == null ? '-----' : s === 'RUN' ? 'VCB ON' : 'VCB OFF';
          e.style.fill = s == null ? S.none : s === 'RUN' ? S.run : S.stop;
        });
        /* the branch of the machine itself (riser, discharge, ball line) */
        flow(id, s === 'RUN');
      }
      /* #5: REMOTE / LOCAL and AUTO / MAN, every tick (a selection does not change the run state) */
      for (const id of MDS) {
        let m = null;
        try {
          m = window.LS_DOCK && LS_DOCK.modeOf ? LS_DOCK.modeOf(MACH[id].ad) : null;
        } catch (e) {}
        const k = m ? String(m.rem) + String(m.au) : '';
        if (k === MD[id]) continue;
        MD[id] = k;
        const r = q(`[data-rem="${id}"]`),
          a = q(`[data-au="${id}"]`);
        if (r) {
          r.textContent = !m || m.rem == null ? '---' : m.rem ? 'REM' : 'LOC';
          r.setAttribute('fill', !m || m.rem == null ? S.none : m.rem ? '#5cd6ff' : '#ffd27a');
        }
        if (a) {
          a.textContent = !m || m.au == null ? '---' : m.au ? 'AUTO' : 'MAN';
          a.setAttribute('fill', !m || m.au == null ? S.none : m.au ? '#9ff0c4' : '#ffd27a');
        }
      }
      for (const k in FLOW)
        flow(
          k,
          FLOW[k].some(id => ST[id] === 'RUN')
        );
      const sv = steam != null && steam > 5;
      const se = q('[data-k="steam"]');
      if (se) se.setAttribute('visibility', sv ? 'visible' : 'hidden');
    };
    tick();
    let seen = false;
    const iv = setInterval(() => (g.isConnected ? ((seen = true), tick()) : seen && clearInterval(iv)), 500);
    /* 3.2.0-beta.74: a click on a pump = its pop-out faceplate beside it (fp-pop.js; the I/O wiring is a link inside); a machine with no
       motor drawing (debris filter, CTCS panel, hypo pumps): its info card as before. Current = the same value as the page (plant model) */
    const CUR = { SWA: 'IIP1501A', SWB: 'IIP1501B', SWC: 'IIP1501C', BPA: 'IIP1503A', BPB: 'IIP1503B', BPC: 'IIP1503C' };
    const fpHit = id => {
      const M = MACH[id],
        c = CUR[id],
        go = () => info(M.io);
      if (!window.LS_FPOP || !c) return go();
      /* SOP section 2: SWP normal current 205 ~ 215 A */
      LS_FPOP.hit({ ...M, cur: () => (LOG[c] != null ? LOG[c] : PM[c]), band: /^SW/.test(id) ? [205, 215] : null }, go);
    };
    /* the dock's "Buksan ang faceplate" of a step motor (fp-pop.js LS_FPOP.openAd) */
    for (const id in CUR) {
      const R = (window.LS_FPREG = window.LS_FPREG || {}),
        o = { open: () => fpHit(id), el: () => q(`[data-hit="${id}"]`), n: MACH[id].n, cur: () => (LOG[CUR[id]] != null ? LOG[CUR[id]] : PM[CUR[id]]) };
      R[MACH[id].ad] = R[MACH[id].d] = o;
    }
    for (const id in MACH)
      qa(`[data-hit="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent =
          MACH[id].n + ' ' + MACH[id].t + ' · ' + MACH[id].d + ' (red = running, green = stopped) · click = faceplate';
        h.append(ti);
        h.addEventListener('click', e => (e.stopPropagation(), fpHit(id)));
      });
    for (const id of MDS)
      qa(`[data-mdh="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = MACH[id].n + ' · REM / LOC = REMOTE MODE SELECTED (field selector), AUTO / MAN = AUTO MODE SELECTED (CRT) of ' + MACH[id].d + ' · click = faceplate';
        h.append(ti);
        h.addEventListener('click', e => (e.stopPropagation(), fpHit(id)));
      });
    for (const id of ['SWA', 'SWB', 'SWC'])
      qa(`[data-vcb="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = MACH[id].n + ' VCB ON / OFF · STN103 DI (I/O list), no logic sheet reads it: shown closed while the motor runs';
        h.append(ti);
      });
    /* the turbine passes steam to the condenser: the main steam flow of the header */
    if (api.HDR && api.HDR.MSF)
      api.reg(
        { t: 'val', tag: 'MSF', ref: api.HDR.MSF, v: '' },
        X => ((steam = X && isFinite(X.v) ? +X.v : null), tick()),
        null
      );
    /* the transmitters: the value of the logic when a sheet has the transmitter; none of these is on a logic sheet now (the condenser
       seawater T / P are PICT 30 indications of STN102, LT-SW1501 of STN103, DPT-SW1502 / 1504 are PACKAGE gauges of the debris
       filters, the motor currents are not in the logic), so the value is the PLANT MODEL (unit.js AN_SW: the pumps running, the
       turbine exhaust steam, the debris filter dirt and backwash). This page only shows it; Plant model OFF = no value (-----) */
    const UNIT = {
      LISW1501: 'swLvl',
      TISW1110A1: 'swTiA',
      TISW1110B1: 'swTiB',
      PISW1110A1: 'swPiA',
      PISW1110B1: 'swPiB',
      PISW1110A2: 'swPoA',
      PISW1110B2: 'swPoB',
      TISW1110A2: 'swToA',
      TISW1110B2: 'swToB',
      DPISW1502: 'swDp1',
      DPISW1504: 'swDp2',
      PGSW1501A: 'swPd0',
      PGSW1501B: 'swPd1',
      PGSW1501C: 'swPd2',
      IIP1501A: 'swIa0',
      IIP1501B: 'swIa1',
      IIP1501C: 'swIa2',
      IIP1503A: 'swIb0',
      IIP1503B: 'swIb1',
      IIP1503C: 'swIb2'
    };
    const LOG = {},
      PM = {};
    const showV = tag => {
      const t = q(`[data-v="${tag}"]`),
        v = LOG[tag] != null ? LOG[tag] : PM[tag],
        dp = /^[PL]/.test(tag) ? 2 : /^DP/.test(tag) ? 0 : 1;
      if (!t) return;
      t.textContent = fmt(v, dp);
      t.setAttribute('fill', v == null ? S.none : S.val);
      /* the forebay water follows LISW1501 (range -14.8 ~ 0 m below GL; the pool drawn 0 ~ -10.5 m) */
      if (tag === 'LISW1501') {
        const y = v == null ? 470 : Math.max(300, Math.min(700, 300 + (-v / 10.5) * 400));
        q('[data-k="pool"]').setAttribute('y', y);
        q('[data-k="pool"]').setAttribute('height', 720 - y);
        q('[data-k="poolw"]').setAttribute('transform', `translate(0 ${y - 470})`);
      }
    };
    for (const tag in UNIT) {
      const b = q(`[data-vb="${tag}"]`);
      if (!b) continue;
      const ti = document.createElementNS(NS, 'title');
      ti.textContent = tag + ' · plant model (no transmitter of this tag on a logic sheet) · click = its I/O list / alarm list line';
      b.append(ti);
      api.reg(
        { t: 'val', tag, v: '' },
        X => ((LOG[tag] = X && isFinite(X.v) ? +X.v : null), showV(tag)),
        null
      );
      api.reg(
        { t: 'val', tag: 'UNIT.' + UNIT[tag], v: '' },
        X => ((PM[tag] = X && isFinite(X.v) ? +X.v : null), showV(tag)),
        null
      );
      b.addEventListener('click', e => (e.stopPropagation(), info(tag)));
      showV(tag);
    }
    return pg;
  }
  PLANT_V2.screens.SW = seawater;
  /* after 007 AIR & FLUE GAS in the list of the Plant view */
  const L = (window.PLANT_SYS = window.PLANT_SYS || []),
    i = L.findIndex(x => x.id === 'AFG');
  L.splice(i >= 0 ? i + 1 : 0, 0, {
    fitAll: 1,
    id: 'SW',
    title: '030 SEAWATER',
    num: '030',
    name: 'SEAWATER SYSTEM',
    src: '30.PNG',
    w: 1920,
    h: 1000,
    v2: true,
    screen: 'SW',
    style: 'steel',
    items: []
  });
})();
