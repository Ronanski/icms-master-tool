/* MAKE-UP WATER SYSTEM (roadmap step 6, PR-OPE-5002 section 7 "MAKE UP WATER PUMP / EXPANSION TANK FILLING"). Own vector graphics in
   the STEEL style of 030 SEAWATER, after the flow diagrams K1AU3-PD-024 MAKE-UP WATER SYSTEM Rev D (flow-diagram-K1AU3-A1-0-001.zip,
   RB page 21) and PD-021 AUX COOLING WATER Rev D (RB page 15, the expansion tank); the HMI snapshots 28.png / 27.PNG are only the
   guide for the instruments.
   - demi water tanks T-0708A / B (from CED1 permeate, water treatment) -> V-MU0001 / 0002 -> suction header MU-0-003 12";
   - MWP P-0709A / B / C (DITL-112): suction V-MU0003 / 4 / 5, strainer STR-MU0001 ~ 3 (DPT-MU0709-A / B / C), PG-MU0709-A / B / C,
     check V-MU0006 / 8 / 10, discharge V-MU0007 / 9 / 11, recirculation RO + V-MU0012 ~ 17 back to the tanks (V-MU0018 / 0019);
   - common header MU-0-010 12" (PT-MU0709) -> MU-1-020 to unit 1 (FT-MU1001): #1 condenser (LCV-MU1110 of ABC-031, MV-MU1001 of
     DITL-60), deaerator and boiler initial fill, sampling, expansion tank T-1109 (MU-1-021 3": V-MU1031, XV-MU1109 of DITL-78 with
     bypass V-MU1033, V-MU1032; LT-CW1109, LSLL-CW1109) -> ACWP suction; MU-2-020 to unit 2.
   Run state = the motor drawing of the one world (LS_DOCK.mst, as the Training dock lamps): red = running, green = stopped, red
   blinking = trip; XV-MU1109 red = open, green = closed. Values = the plant model (unit.js AN_MU, written into the analog rows of
   DITL-112 / 76 / 77 / 78 by plantsw.js, so the logic reads the same number); never from this page. Drawn in a 1760 x 900 space,
   scaled to the 1920 x 1000 frame of hmi2.js. */
(function () {
  if (!window.PLANT_V2) return;
  const NS = 'http://www.w3.org/2000/svg';
  const S = {
    bar: '#11161b',
    ol: '#0c1014',
    nm: '#d3dbe2',
    dim: '#7f8b97',
    box: '#0d1116',
    boxs: '#3a4550',
    val: '#e8eef3',
    run: '#d64545',
    stop: '#3fa34d',
    none: '#6b7480',
    m: ['#3e454c', '#b4bec7', '#4a525a'],
    cav: '#232a31',
    water: ['#4f8f86', '#1d4a45'],
    wave: '#9fd6cc',
    air: '#20272e',
    /* media: d demineralized water, r recirculation to the tanks, c closed cooling water (expansion tank out) */
    med: {
      d: ['#4f8f86', '#c9efe9'],
      r: ['#6f8f6a', '#dcefd2'],
      c: ['#5d7f9e', '#cfe3f3'],
      off: ['#3a424b', null]
    }
  };
  const T = (x, y, s, c, a) => `<text x="${x}" y="${y}" class="${c}"${a ? ' ' + a : ''}>${s}</text>`;
  const OL = `stroke="${S.ol}" stroke-width="1"`;
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  /* the machines: name, tag, run state address (LS_DOCK.mst), info card tag, logic sheet */
  const MACH = {
    PA: { n: 'MWP-A', t: 'P-0709A', ad: 'DITL-112', io: 'MIR-P0709A', d: 'DITL-112' },
    PB: { n: 'MWP-B', t: 'P-0709B', ad: 'DITL-112 #B', io: 'MIR-P0709B', d: 'DITL-112 #B' },
    PC: { n: 'MWP-C', t: 'P-0709C', ad: 'DITL-112 #C', io: 'MIR-P0709C', d: 'DITL-112 #C' }
  };
  const ROWS = [
    ['PA', 236, 'A', 'V-MU0003', 'STR-MU0001', 'V-MU0006', 'V-MU0007', 'V-MU0012', 'V-MU0013', 0],
    ['PB', 446, 'B', 'V-MU0004', 'STR-MU0002', 'V-MU0008', 'V-MU0009', 'V-MU0014', 'V-MU0015', 1],
    ['PC', 656, 'C', 'V-MU0005', 'STR-MU0003', 'V-MU0010', 'V-MU0011', 'V-MU0016', 'V-MU0017', 2]
  ];

  function art() {
    const o = [],
      G = { main: [[], [], [], []] };
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
    const pipe = (p, m, w, f) => {
      const d = rpath(p, w * 1.6),
        med = S.med[m],
        L = G.main;
      L[0].push(`<path d="${d}" fill="none" stroke="${S.ol}" stroke-width="${w + 2.5}"/>`);
      L[1].push(
        `<path d="${d}" fill="none" stroke="${f ? med[0] : S.med.off[0]}" stroke-width="${w}"${f ? ` data-fb="${f}" data-c="${med[0]}"` : ''}/>`
      );
      L[2].push(
        `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="${Math.max(1, w * 0.28)}" transform="translate(0 ${-w * 0.18})"/>`
      );
      if (f)
        L[3].push(
          `<path d="${d}" class="mufl" data-f="${f}" stroke="${med[1]}" stroke-width="${w > 10 ? 2.4 : w > 5 ? 1.8 : 1.3}"/>`
        );
    };
    const vbox = (x, y, tag, u, k) =>
      `<g data-vb="${k || tag}" style="cursor:pointer">${T(x, y - 4, tag, 'mu9')}<rect x="${x}" y="${y}" width="58" height="17" rx="1.5" fill="${S.box}" stroke="${S.boxs}"/>${T(x + 54, y + 13, '-----', 'muv', `text-anchor="end" data-v="${k || tag}"`)}${T(x + 62, y + 13, u, 'mu9')}</g>`;
    const imp = (x, y, r, id) =>
      `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#11161b"/><g data-imp="${id}">${[0, 1, 2, 3, 4].map(i => `<path d="M0 0 Q${r * 0.55} ${-r * 0.2} ${r * 0.85} ${-r * 0.5}" transform="rotate(${i * 72})" stroke="#c3ccd5" stroke-width="${r / 5}" fill="none" stroke-linecap="round"/>`).join('')}</g><circle r="${r * 0.22}" fill="#c3ccd5"/></g>`;
    /* manual valve of the field (no DCS signal): grey */
    const valve = (x, y, vert, lab, la) => {
      const b = vert
        ? `M${x - 7} ${y - 8} L${x + 7} ${y - 8} L${x - 7} ${y + 8} L${x + 7} ${y + 8} Z`
        : `M${x - 8} ${y - 7} L${x + 8} ${y + 7} L${x + 8} ${y - 7} L${x - 8} ${y + 7} Z`;
      const t = !lab
        ? ''
        : la === 'up'
          ? T(x, y - 12, lab, 'mu8', 'text-anchor="middle"')
          : la === 'dn'
            ? T(x, y + 20, lab, 'mu8', 'text-anchor="middle"')
            : la === 'l'
              ? T(x - 10, y + 3, lab, 'mu8', 'text-anchor="end"')
              : T(x + 12, y + 3, lab, 'mu8');
      return `<g><title>${lab} · manual valve (field)</title><path d="${b}" fill="${S.m[1]}" ${OL}/>${t}</g>`;
    };
    /* check valve (flow left -> right or up) */
    const check = (x, y, lab) =>
      `<g><title>${lab} · check valve</title><path d="M${x - 8} ${y - 7} L${x + 8} ${y} L${x - 8} ${y + 7} Z" fill="${S.m[1]}" ${OL}/><line x1="${x + 8}" y1="${y - 7}" x2="${x + 8}" y2="${y + 7}" stroke="${S.ol}" stroke-width="2"/>${T(x, y + 20, lab, 'mu8', 'text-anchor="middle"')}</g>`;
    const orifice = (x, y) =>
      `<g><title>RO · restriction orifice (minimum flow)</title><rect x="${x - 2}" y="${y - 9}" width="4" height="18" fill="${S.m[1]}" ${OL}/>${T(x + 6, y - 6, 'RO', 'mu8')}</g>`;
    /* local gauge (field only, no DCS value) */
    const gauge = (x, y, tag) =>
      `<g><title>${tag} · local pressure gauge (field, no DCS signal)</title><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 14}" stroke="${S.m[1]}"/><circle cx="${x}" cy="${y - 22}" r="8" fill="#e5e9ec" ${OL}/><line x1="${x}" y1="${y - 22}" x2="${x + 4}" y2="${y - 27}" stroke="#11161b" stroke-width="1.2"/>${T(x + 11, y - 25, tag, 'mu8')}</g>`;
    const strainer = (x, y) =>
      `<g><title>suction strainer</title><path d="M${x - 16} ${y - 9} H${x + 16} L${x + 10} ${y + 9} H${x - 10} Z" fill="url(#mumv)" ${OL}/><path d="M${x - 9} ${y - 7} l6 13 M${x - 1} ${y - 7} l6 13 M${x + 7} ${y - 7} l5 11" stroke="#7f8a94" stroke-width="1.1"/></g>`;
    /* end-suction pump: casing in the line, motor above (lamp under the motor: red RUN, green STOP) */
    const pump = (x, y, id) =>
      `<g data-hit="${id}" style="cursor:pointer"><rect x="${x - 4}" y="${y - 50}" width="8" height="30" fill="${S.m[1]}" ${OL}/><rect x="${x - 26}" y="${y - 96}" width="52" height="46" rx="4" fill="url(#mumt)" ${OL}/>${[-86, -78, -70, -62].map(d => `<line x1="${x - 24}" y1="${y + d}" x2="${x + 24}" y2="${y + d}" stroke="${S.ol}" stroke-opacity=".45"/>`).join('')}<rect x="${x - 26}" y="${y - 54}" width="52" height="4" fill="${S.none}" data-lamp="${id}"/><circle cx="${x}" cy="${y}" r="21" fill="url(#mumv)" ${OL}/><circle cx="${x}" cy="${y}" r="13" fill="${S.cav}"/>${imp(x, y, 11, id)}<path d="M${x - 18} ${y + 14} L${x - 26} ${y + 30} H${x + 26} L${x + 18} ${y + 14}" fill="url(#mumv)" ${OL}/></g>`;

    /* ---------------- demi water tanks T-0708A / B ---------------- */
    o.push(T(24, 34, 'FROM CED1 PERMEATE (WATER TREATMENT)', 'mu9') + T(24, 46, 'LMYP-1-P3-110 · by VWST', 'mu8'));
    pipe(
      [
        [24, 60],
        [100, 60],
        [100, 128]
      ],
      'd',
      6,
      ''
    );
    pipe(
      [
        [100, 60],
        [60, 60],
        [60, 520],
        [100, 520],
        [100, 548]
      ],
      'd',
      6,
      ''
    );
    [
      ['A', 128, 'LIMU0708A', 'V-MU0001', 'LS-MU0708-A', 'V-MU0018'],
      ['B', 548, 'LIMU0708B', 'V-MU0002', 'LS-MU0708-B', 'V-MU0019']
    ].forEach(([n, y, lt, ov, ls, rv]) => {
      const x = 90,
        w = 170,
        h = 250;
      o.push(
        `<g data-hit="TK${n}" style="cursor:pointer"><path d="M${x} ${y + 26} Q${x + w / 2} ${y - 8} ${x + w} ${y + 26} V${y + h} H${x} Z" fill="url(#mumt)" ${OL}/><rect x="${x + 10}" y="${y + 30}" width="${w - 20}" height="${h - 38}" fill="${S.air}" stroke="#59636d"/><rect x="${x + 10}" y="${y + 30}" width="${w - 20}" height="0" fill="url(#muwt)" data-k="tk${n}"/><g data-k="tk${n}w"><path d="M${x + 12} 0 ${Array(7).fill('q10 -3 20 0').join(' ')}" fill="none" stroke="${S.wave}" stroke-width="1.2" class="muwv"/></g><path d="M${x - 6} ${y + h} h${w + 12} v8 h-${w + 12}z" fill="#59636d"/></g>`
      );
      o.push(
        T(x + w / 2, y - 16, 'T-0708' + n, 'mu11', 'text-anchor="middle"') +
          T(x + w / 2, y - 4, 'DEMINERALIZED WATER TANK', 'mu8', 'text-anchor="middle"')
      );
      o.push(vbox(x + 46, y + 92, lt, 'm'));
      o.push(T(x + 46, y + 128, 'range 0 ~ 15 m · SOP > 2 m', 'mu8'));
      o.push(T(x + 46, y + 150, ls + ' LOW', 'mu8') + T(x + 46, y + 161, 'MWP trip < 0.2 m (both tanks)', 'mu8'));
      /* recirculation in at the top (V-MU0018 / 0019) */
      o.push(valve(x + w - 30, y - 26, 1, rv));
      /* outlet to the suction header */
      pipe(
        [
          [x + w, y + h - 24],
          [380, y + h - 24]
        ],
        'd',
        10,
        'MU'
      );
      o.push(valve(x + w + 40, y + h - 24, 0, ov, 'up'));
    });
    /* suction header MU-0-003 12" */
    pipe(
      [
        [380, 194],
        [380, 774]
      ],
      'd',
      14,
      'MU'
    );
    o.push(T(372, 790, 'SUCTION HEADER  MU-0-003 12"', 'mu8', 'text-anchor="middle"'));

    /* ---------------- make-up water pumps P-0709A / B / C (DITL-112) ---------------- */
    o.push(T(470, 120, 'MAKE-UP WATER PUMPS  (DITL-112)', 'mu11'));
    ROWS.forEach(([id, y, n, sv, st, ck, dv, rck, rv, i]) => {
      pipe(
        [
          [380, y],
          [680, y]
        ],
        'd',
        10,
        id
      );
      pipe(
        [
          [720, y],
          [1000, y]
        ],
        'd',
        10,
        id
      );
      o.push(valve(430, y, 0, sv, 'dn'));
      o.push(strainer(520, y) + T(520, y + 26, st, 'mu8', 'text-anchor="middle"'));
      o.push(vbox(486, y - 60, 'DPIMU0709' + n, 'kg/cm²'));
      o.push(T(486, y - 28, 'trip ≥ 1.0 (10 s)', 'mu8'));
      o.push(
        `<rect x="590" y="${y - 7}" width="16" height="14" rx="3" fill="#2a3138" ${OL}/>` +
          T(598, y + 22, 'EJ', 'mu8', 'text-anchor="middle"')
      );
      o.push(pump(700, y, id));
      o.push(
        T(640, y - 74, MACH[id].n, 'mu11', 'text-anchor="end"') + T(640, y - 62, MACH[id].t, 'mu9', 'text-anchor="end"')
      );
      o.push(
        T(640, y - 48, '-----', 'mu9b', `text-anchor="end" data-st="${id}"`) +
          T(640, y - 36, MACH[id].d, 'mu8', 'text-anchor="end"')
      );
      o.push(vbox(736, y - 92, 'IIP0709' + n, 'A'));
      o.push(gauge(772, y, 'PG-MU0709-' + n));
      o.push(check(850, y, ck) + valve(920, y, 0, dv, 'dn'));
      /* minimum flow recirculation (RO, check, V-MU0013 / 15 / 17) back to the demi water tanks */
      pipe(
        [
          [810, y],
          [810, y - 64],
          [1010 + i * 8, y - 64]
        ],
        'r',
        4,
        id
      );
      o.push(orifice(860, y - 64) + check(900, y - 64, rck) + valve(950, y - 64, 0, rv, 'up'));
    });
    /* the recirculation header back to the tanks (over the top) */
    pipe(
      [
        [1010, 172],
        [1010, 84],
        [230, 84],
        [230, 106]
      ],
      'r',
      4,
      'MU'
    );
    pipe(
      [
        [330, 84],
        [330, 500],
        [230, 500],
        [230, 526]
      ],
      'r',
      4,
      'MU'
    );
    pipe(
      [
        [1018, 382],
        [1010, 382],
        [1010, 172]
      ],
      'r',
      4,
      'MU'
    );
    pipe(
      [
        [1026, 592],
        [1010, 592],
        [1010, 382]
      ],
      'r',
      4,
      'MU'
    );
    o.push(T(640, 78, 'MINIMUM FLOW RECIRCULATION TO T-0708A / B', 'mu8'));

    /* ---------------- common discharge header MU-0-010 12" ---------------- */
    pipe(
      [
        [1000, 236],
        [1060, 236],
        [1060, 656],
        [1000, 656]
      ],
      'd',
      14,
      'MU'
    );
    pipe(
      [
        [1000, 446],
        [1060, 446]
      ],
      'd',
      14,
      'MU'
    );
    o.push(T(1068, 700, 'DISCHARGE HEADER', 'mu8') + T(1068, 711, 'MU-0-010 12"', 'mu8'));
    o.push(gauge(1060, 560, 'PT-MU0709').replace('#e5e9ec', S.box));
    o.push(vbox(1078, 530, 'PIMU0709', 'kg/cm²') + T(1078, 562, 'SOP > 6.0 · range 0 ~ 10', 'mu8'));
    /* to unit 2 */
    pipe(
      [
        [1060, 656],
        [1060, 790],
        [1210, 790]
      ],
      'd',
      10,
      'MU'
    );
    o.push(T(1218, 794, '▸ TO UNIT NO.2  (MU-2-020 12")', 'mu9'));
    /* to unit 1 (MU-1-020 12"), FT-MU1001 */
    pipe(
      [
        [1060, 300],
        [1200, 300]
      ],
      'd',
      12,
      'MU'
    );
    o.push(vbox(1086, 318, 'FIMU1001', 'm³/h') + T(1086, 350, '#1 make-up flow', 'mu8'));
    o.push(T(1100, 286, 'TO UNIT NO.1  MU-1-020 12"', 'mu8'));

    /* ---------------- unit 1 users ---------------- */
    const DX = 1520;
    const dest = (y, a, b) =>
      `<rect x="${DX}" y="${y - 15}" width="226" height="30" rx="3" fill="#232a31" stroke="#46525e"/>` +
      T(DX + 8, y - 2, a, 'mu7') +
      T(DX + 8, y + 10, b, 'mu8');
    /* boiler and deaerator initial fill (manual, only for the first filling) */
    pipe(
      [
        [1200, 300],
        [1200, 150],
        [DX, 150]
      ],
      'd',
      7,
      ''
    );
    pipe(
      [
        [1240, 300],
        [1240, 214],
        [DX, 214]
      ],
      'd',
      7,
      ''
    );
    o.push(
      valve(1420, 150, 0, 'MU-1-022 6"', 'up') +
        dest(150, '#1 BOILER (INITIAL FILL)', 'K1AU3-PD-017 · manual, filling only')
    );
    o.push(
      valve(1420, 214, 0, 'MU-1-023 6"', 'up') +
        dest(214, '#1 DEAERATOR (INITIAL FILL)', 'K1AU3-PD-016 · manual, filling only')
    );
    /* the condenser: LCV-MU1110 (hotwell level control ABC-031) and MV-MU1001 (shut-off MOV DITL-60) in parallel */
    pipe(
      [
        [1200, 300],
        [1300, 300],
        [1300, 280],
        [1460, 280],
        [1460, 300],
        [DX, 300]
      ],
      'd',
      10,
      'HW'
    );
    pipe(
      [
        [1300, 300],
        [1300, 340],
        [1460, 340],
        [1460, 300]
      ],
      'd',
      8,
      'MV'
    );
    o.push(
      `<g data-hit="LCV" style="cursor:pointer"><path d="M1372 273 L1388 287 L1388 273 L1372 287 Z" fill="${S.none}" ${OL} data-vl="LCV"/><path d="M1370 262 q10 -12 20 0 z" fill="url(#mumv)" ${OL}/><line x1="1380" y1="262" x2="1380" y2="280" stroke="${S.ol}"/></g>` +
        T(1338, 258, 'LCVMU1110', 'mu9', 'text-anchor="end"') +
        T(1338, 270, 'hotwell level (ABC-031)', 'mu8', 'text-anchor="end"')
    );
    o.push(
      `<g data-hit="MV" style="cursor:pointer"><path d="M1372 333 L1388 347 L1388 333 L1372 347 Z" fill="${S.none}" ${OL} data-vl="MV"/><rect x="1372" y="315" width="16" height="12" rx="2" fill="url(#mumv)" ${OL}/>${T(1380, 325, 'M', 'mu8', 'text-anchor="middle" style="fill:#0c1014;font-weight:600"')}</g>` +
        T(1338, 358, 'MVMU1001', 'mu9', 'text-anchor="end"') +
        T(1338, 370, 'shut-off MOV (DITL-60)', 'mu8', 'text-anchor="end"')
    );
    o.push(vbox(1396, 238, 'LCVMU1110', '%', 'LCV') + vbox(1396, 368, 'MVMU1001', '%', 'MV'));
    o.push(dest(300, '#1 CONDENSER HOTWELL', 'K1AU3-PD-016 · MU-1-024 8" · 028 CONDENSATE'));
    /* sampling */
    pipe(
      [
        [1160, 300],
        [1160, 420],
        [DX, 420]
      ],
      'd',
      3,
      ''
    );
    o.push(dest(420, 'SAMPLING SYSTEM', 'K1AU3-PD-044 · SP-1-003 ½"'));

    /* ---------------- expansion tank T-1109 (PD-021): MU-1-021 3" ---------------- */
    pipe(
      [
        [1260, 300],
        [1260, 560],
        [1560, 560],
        [1560, 588]
      ],
      'd',
      6,
      'ET'
    );
    pipe(
      [
        [1316, 560],
        [1316, 516],
        [1440, 516],
        [1440, 560]
      ],
      'd',
      4,
      ''
    );
    o.push(T(1270, 474, 'TO #1 EXPANSION TANK  MU-1-021 3"', 'mu9'));
    o.push(
      valve(1300, 560, 0, 'V-MU1031', 'dn') +
        valve(1460, 560, 0, 'V-MU1032', 'dn') +
        valve(1378, 516, 0, 'V-MU1033 bypass', 'up')
    );
    o.push(
      `<g data-hit="XV" style="cursor:pointer"><path d="M1370 553 L1386 567 L1386 553 L1370 567 Z" fill="${S.none}" ${OL} data-vl="XV"/><line x1="1378" y1="560" x2="1378" y2="590" stroke="${S.ol}"/><rect x="1368" y="590" width="20" height="14" rx="2" fill="url(#mumv)" ${OL}/>${T(1378, 600, 'S', 'mu8', 'text-anchor="middle" style="fill:#0c1014;font-weight:600"')}</g>`
    );
    o.push(
      T(1378, 622, 'XV-MU1109', 'mu11', 'text-anchor="middle"') +
        T(1378, 634, 'inlet shut-off (DITL-78)', 'mu8', 'text-anchor="middle"') +
        T(1378, 648, '-----', 'mu9b', 'text-anchor="middle" data-k="xvst"') +
        T(1378, 672, 'AUTO (DITL-78): open < 40 %, close > 85 %', 'mu8', 'text-anchor="middle"')
    );
    const EX = 1500,
      EY = 588,
      EW = 120,
      EH = 150;
    o.push(
      `<g data-hit="ET" style="cursor:pointer"><rect x="${EX}" y="${EY}" width="${EW}" height="${EH}" rx="14" fill="url(#mumt)" ${OL}/><rect x="${EX + 8}" y="${EY + 10}" width="${EW - 16}" height="${EH - 20}" rx="6" fill="${S.air}" stroke="#59636d"/><rect x="${EX + 8}" y="${EY + 10}" width="${EW - 16}" height="0" fill="url(#muwc)" data-k="et"/><g data-k="etw"><path d="M${EX + 10} 0 ${Array(5).fill('q10 -3 20 0').join(' ')}" fill="none" stroke="#cfe3f3" stroke-width="1.2" class="muwv"/></g>` +
        /* NL 1.7 m (SOP) and LAL 40 % / LAH 85 % marks */
        [
          [1.7, 'NL 1.7 m'],
          [0.8, 'L 0.8'],
          [0.3, 'LL 0.3']
        ]
          .map(([m, l]) => {
            const yy = EY + 10 + (EH - 20) * (1 - m / 2);
            return `<line x1="${EX + EW - 8}" y1="${yy}" x2="${EX + EW + 6}" y2="${yy}" stroke="#aab6c1"/>${T(EX + EW + 9, yy + 3, l, 'mu8')}`;
          })
          .join('') +
        `</g>`
    );
    o.push(T(EX + EW / 2, EY - 10, 'T-1109  EXPANSION TANK', 'mu11', 'text-anchor="middle"'));
    o.push(
      vbox(1672, 600, 'LICW1109', 'm') +
        T(1672, 632, 'range 0 ~ 2 m', 'mu8') +
        T(1672, 644, 'LT-CW1109', 'mu8') + T(1672, 664, 'ACWP trip', 'mu8') + T(1672, 676, '< 0.3 m', 'mu8')
    );
    o.push(T(1672, 696, 'LSLL-CW1109', 'mu8'));
    /* tank outlet CW-1-001 8" to the ACWP suction */
    pipe(
      [
        [EX + 40, EY + EH],
        [EX + 40, 800],
        [1740, 800]
      ],
      'c',
      8,
      ''
    );
    o.push(
      T(1740, 820, '▸ ACWP P-1108A / B SUCTION', 'mu9', 'text-anchor="end"') +
        T(1740, 832, 'CW-1-001 8" · 030 SEAWATER (aux cooling water)', 'mu8', 'text-anchor="end"')
    );

    /* legend */
    o.push(
      `<rect x="24" y="830" width="18" height="5" fill="${S.med.d[0]}"/><rect x="190" y="830" width="18" height="5" fill="${S.med.r[0]}"/><rect x="390" y="830" width="18" height="5" fill="${S.med.c[0]}"/>` +
        T(46, 836, 'DEMINERALIZED WATER', 'mu8') +
        T(212, 836, 'RECIRCULATION (min. flow)', 'mu8') +
        T(412, 836, 'CLOSED COOLING WATER', 'mu8')
    );
    o.push(
      T(
        24,
        856,
        'P&amp;ID K1AU3-PD-024 Rev D (make-up water), K1AU3-PD-021 Rev D (expansion tank) · SOP PR-OPE-5002 section 7',
        'mu8'
      )
    );
    o.push(
      T(1744, 874, 'values: plant model (Plant model ON); the logic reads the same value', 'mu8', 'text-anchor="end"')
    );

    const defs = `<defs><linearGradient id="mumt" x1="0" x2="1"><stop offset="0" stop-color="${S.m[0]}"/><stop offset=".45" stop-color="${S.m[1]}"/><stop offset="1" stop-color="${S.m[2]}"/></linearGradient>
<linearGradient id="mumv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.m[2]}"/><stop offset=".4" stop-color="${S.m[1]}"/><stop offset="1" stop-color="${S.m[0]}"/></linearGradient>
<linearGradient id="muwt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.water[0]}"/><stop offset="1" stop-color="${S.water[1]}"/></linearGradient>
<linearGradient id="muwc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d75a0"/><stop offset="1" stop-color="#163a57"/></linearGradient></defs>`;
    const UF = "font-family:Barlow,'IBM Plex Sans','Segoe UI',Roboto,Arial,sans-serif",
      MF = "font-family:'Roboto Mono','JetBrains Mono',Consolas,monospace";
    const css = `<style>.mu7{font-size:8.5px;fill:${S.nm};${UF}}.mu8{font-size:8.5px;fill:${S.dim};${UF}}.mu9{font-size:9.5px;fill:${S.dim};${UF}}.mu9b{font-size:9.5px;font-weight:600;fill:${S.none};${UF}}.mu11{font-size:11px;font-weight:600;fill:${S.nm};${UF}}
.muv{font-size:12px;fill:${S.none};${MF}}
.mufl{fill:none;stroke-dasharray:2 14;stroke-linecap:round;animation:mufl 1.4s linear infinite}@keyframes mufl{to{stroke-dashoffset:-32}}
.muwv{animation:muwv 3s ease-in-out infinite alternate}@keyframes muwv{to{transform:translateX(-8px)}}
@media (prefers-reduced-motion:reduce){.mufl,.muwv{animation:none}}</style>`;
    /* the pipes first (under the machines and the tanks) */
    return css + defs + G.main.map(l => l.join('')).join('') + o.join('');
  }

  /* ---------- live links ---------- */
  function makeup(g, api) {
    const pg = document.createElementNS(NS, 'g');
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
    const ST = {},
      V = {};
    const mst = M => {
      try {
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
        spin[id] = document.createElementNS(NS, 'animateTransform');
        for (const [k, v] of Object.entries({
          attributeName: 'transform',
          type: 'rotate',
          from: '0',
          to: '360',
          dur: '1s',
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
    /* a level in a drawn vessel: the water rect and its wave group follow the level (0 ~ max) */
    const level = (k, v, max, y0, h) => {
      const r = q(`[data-k="${k}"]`),
        w = q(`[data-k="${k}w"]`);
      if (!r) return;
      const f = v == null || !isFinite(v) ? 0 : Math.max(0, Math.min(1, v / max)),
        hh = h * f;
      r.setAttribute('y', y0 + h - hh);
      r.setAttribute('height', hh);
      if (w) {
        w.setAttribute('transform', `translate(0 ${y0 + h - hh + 3})`);
        w.setAttribute('visibility', f > 0.02 ? 'visible' : 'hidden');
      }
    };
    const tick = () => {
      for (const id in MACH) {
        const M = MACH[id],
          s = mst(M);
        if (s === ST[id] && ST[id] !== undefined) continue;
        ST[id] = s;
        const col = s == null ? S.none : s === 'TRIP' || s === 'RUN' ? S.run : S.stop;
        qa(`[data-lamp="${id}"]`).forEach(e => e.setAttribute('fill', col));
        qa(`[data-st="${id}"]`).forEach(e => {
          e.textContent = s == null ? '-----' : s === 'TRIP' ? 'TRIP' : s === 'RUN' ? 'RUNNING' : 'STOPPED';
          e.style.fill = col;
          e.classList.toggle('h2blink', s === 'TRIP');
        });
        setSpin(id, s === 'RUN');
        flow(id, s === 'RUN');
      }
      const any = Object.keys(MACH).some(id => ST[id] === 'RUN');
      flow('MU', any);
      flow('HW', any && V.LCV > 1);
      flow('MV', any && V.MV > 1);
      flow('ET', any && V.XV === 1 && V.ETF === 1);
      /* XV-MU1109: red = open, green = closed (DITL-78 open command) */
      const xo = V.XV == null ? null : V.XV === 1;
      const xc = xo == null ? S.none : xo ? S.run : S.stop;
      const xv = q('[data-vl="XV"]');
      if (xv) xv.setAttribute('fill', xc);
      const xs = q('[data-k="xvst"]');
      if (xs) {
        xs.textContent = xo == null ? '-----' : xo ? 'OPEN' : 'CLOSED';
        xs.style.fill = xc;
      }
      for (const k of ['LCV', 'MV']) {
        const e = q(`[data-vl="${k}"]`);
        if (e) e.setAttribute('fill', V[k] == null ? S.none : V[k] > 1 ? S.run : S.stop);
      }
      level('tkA', V.LIMU0708A, 15, 128 + 30, 250 - 38);
      level('tkB', V.LIMU0708B, 15, 548 + 30, 250 - 38);
      level('et', V.LICW1109, 2, 588 + 10, 150 - 20);
    };
    tick();
    let seen = false;
    const iv = setInterval(() => (g.isConnected ? ((seen = true), tick()) : seen && clearInterval(iv)), 500);
    const HIT = {
      PA: [MACH.PA.io, MACH.PA.n + ' ' + MACH.PA.t + ' · DITL-112 (red = running, green = stopped)'],
      PB: [MACH.PB.io, MACH.PB.n + ' ' + MACH.PB.t + ' · DITL-112 #B (red = running, green = stopped)'],
      PC: [MACH.PC.io, MACH.PC.n + ' ' + MACH.PC.t + ' · DITL-112 #C (red = running, green = stopped)'],
      TKA: ['LT-MU0708-A', 'T-0708A demineralized water tank · LT-MU0708-A'],
      TKB: ['LT-MU0708-B', 'T-0708B demineralized water tank · LT-MU0708-B'],
      XV: [
        'XV-MU1109',
        'XV-MU1109 make-up water to expansion tank inlet shut-off · DITL-78 (red = open, green = closed)'
      ],
      LCV: [
        'LCV-MU1110',
        'LCV-MU1110 condenser make-up level control valve · ABC-031 LICCD1110A (red = open, green = closed)'
      ],
      MV: ['MOR-MU1001', 'MV-MU1001 make-up water to condenser shut-off MOV · DITL-60 (red = open, green = closed)'],
      ET: ['LT-CW1109', 'T-1109 expansion tank · LT-CW1109']
    };
    for (const id in HIT)
      qa(`[data-hit="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = HIT[id][1] + ' · click = info card';
        h.append(ti);
        h.addEventListener('click', e => (e.stopPropagation(), info(HIT[id][0])));
      });
    /* the values: the plant model (unit.js AN_MU), except LCV-MU1110 = the MV of its controller (ABC-031 LICCD1110A) */
    const UNIT = {
      LIMU0708A: 'muLvA',
      LIMU0708B: 'muLvB',
      DPIMU0709A: 'muDp0',
      DPIMU0709B: 'muDp1',
      DPIMU0709C: 'muDp2',
      IIP0709A: 'muI0',
      IIP0709B: 'muI1',
      IIP0709C: 'muI2',
      PIMU0709: 'muP',
      FIMU1001: 'muF',
      LICW1109: 'etLvl',
      MV: 'muMv',
      XV: 'muXv',
      ETF: 'muFill'
    };
    const IO = {
      LIMU0708A: 'LT-MU0708-A',
      LIMU0708B: 'LT-MU0708-B',
      DPIMU0709A: 'DPT-MU0709-A',
      DPIMU0709B: 'DPT-MU0709-B',
      DPIMU0709C: 'DPT-MU0709-C',
      IIP0709A: 'IT-P0709A',
      IIP0709B: 'IT-P0709B',
      IIP0709C: 'IT-P0709C',
      PIMU0709: 'PT-MU0709',
      FIMU1001: 'FT-MU1001',
      LICW1109: 'LT-CW1109',
      LCV: 'LCV-MU1110',
      MV: 'ZT-MU1001'
    };
    const showV = k => {
      const t = q(`[data-v="${k}"]`);
      if (!t) return;
      const v = V[k],
        dp = /^DP/.test(k) ? 3 : /^(LI|PI)/.test(k) ? 2 : 1;
      t.textContent = fmt(v, dp);
      t.setAttribute('fill', v == null ? S.none : S.val);
    };
    for (const k in UNIT)
      api.reg(
        { t: 'val', tag: 'UNIT.' + UNIT[k], v: '' },
        X => ((V[k] = X && isFinite(X.v) ? +X.v : null), showV(k), tick()),
        null
      );
    api.reg(
      { t: 'valve', tag: 'LCVMU1110', v: '' },
      X => ((V.LCV = X && isFinite(X.v) ? +X.v : null), showV('LCV'), tick()),
      null
    );
    for (const k in IO) {
      const b = q(`[data-vb="${k}"]`);
      if (!b) continue;
      const ti = document.createElementNS(NS, 'title');
      ti.textContent =
        IO[k] + (k === 'LCV' ? ' · MV of LICCD1110A (ABC-031)' : ' · plant model') + ' · click = its I/O list line';
      b.append(ti);
      b.addEventListener('click', e => (e.stopPropagation(), info(IO[k])));
      showV(k);
    }
    return pg;
  }
  PLANT_V2.screens.MU = makeup;
  /* after 030 SEAWATER in the list of the Plant view */
  const L = (window.PLANT_SYS = window.PLANT_SYS || []),
    i = L.findIndex(x => x.id === 'SW');
  L.splice(i >= 0 ? i + 1 : L.length, 0, {
    fitAll: 1,
    id: 'MU',
    title: 'MAKE-UP WATER',
    num: 'MU',
    name: 'MAKE-UP WATER SYSTEM',
    src: '28.png',
    w: 1920,
    h: 1000,
    v2: true,
    screen: 'MU',
    style: 'steel',
    items: []
  });
})();
