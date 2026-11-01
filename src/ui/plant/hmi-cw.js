/* 027 CLOSED COOLING WATER (roadmap step 6, PR-OPE-5002 section 7 "CLOSE COOLING LINE PRIMING" and section 8 "AUXILLIARY COOLING WATER
   PUMP"). Own vector graphics in the STEEL style of 030 SEAWATER and MAKE-UP WATER, after the flow diagram K1AU3-PD-021 AUXILIARY
   COOLING WATER SYSTEM Rev D (flow-diagram-K1AU3-A1-0-001.zip, RB page 15); the HMI snapshot 27.PNG is only the guide.
   - return header CW-1-002 20" from the users + expansion tank T-1109 (outlet V-CW1001 CW-1-001 8"; make-up XV-MU1109 of DITL-78 with
     V-MU1031 / 1032 and bypass V-MU1033; LT-CW1109, LSLL-CW1109, PG / TG-CW1151) -> suction header CW-1-003 20";
   - ACWP P-1108A / B (DITL-76 / 77): suction V-CW1002 / 1004, strainer STR-CW1001 / 1002 (DPT-CW1108-A / B), check V-CW1006 / 1008,
     discharge V-CW1007 / 1009 (SOP: 5 % at start, then open until PG-CW1108A / B reads 7 kg/cm2);
   - common discharge CW-1-007 20" (PT / TT-CW1152) -> CCWHE H-1107A / B / C (in V-CW1010 / 1011 / 1012, out V-CW1013 / 1014 / 1015;
     the seawater side from the SWBP, 030 SEAWATER) -> supply CW-1-014 20" (PT / TT-CW1153);
   - the users: sampling rack, BFP P-1115A / B (motor cooler, pump, lube oil cooler Z-1115A / B), generator air coolers A ~ D,
     turbine oil coolers A / B (TCV-CW1201 of ABC-053 TICLO1002), bottom ash screw conveyors L-1060A ~ D (PT / TT-CW1156, TT-CW1060),
     PA fan oil cooler Z-1053, SA fan bearings F-1054, gas air heater H-1052, ID fan oil cooler Z-1056 and bearings F-1056,
     IA compressors C-0704A / B / C and dryers D-0704A / B / C, PA compressors C-0703A / B / C and dryers D-0703A / B / C; the
     cross-tie to unit 2.
   Run state = the motor drawing of the one world (LS_DOCK.mst): red = running, green = stopped, red blinking = trip. REM / LOC and
   AUTO / MAN = the REMOTE SELECTED and AUTO SELECTED outputs of DITL-76 / 77 (rows 12 and 1). Values = the plant model (unit.js
   AN_ACW, the pressures and strainer DP written into DITL-76 / 77 by plantsw.js, so the logic reads the same number), TCV-CW1201 and
   the lube oil temperatures = ABC-053; never from this page. Drawn in a 1760 x 900 space, scaled to the 1920 x 1000 frame of hmi2.js. */
(function () {
  if (!window.PLANT_V2) return;
  const NS = 'http://www.w3.org/2000/svg';
  const S = {
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
    air: '#20272e',
    /* media: s cooled supply to the users, r hot return from the users, c seawater (CCWHE), d demineralized make-up water */
    med: {
      s: ['#4f8f86', '#c9efe9'],
      r: ['#b0664a', '#f6cdb8'],
      c: ['#5d7f9e', '#cfe3f3'],
      d: ['#6f8f6a', '#dcefd2'],
      off: ['#3a424b', null]
    }
  };
  const T = (x, y, s, c, a) => `<text x="${x}" y="${y}" class="${c}"${a ? ' ' + a : ''}>${s}</text>`;
  const OL = `stroke="${S.ol}" stroke-width="1"`;
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  /* the machines: name, tag, drawing (run state LS_DOCK.mst, REMOTE / AUTO outputs), info card tag, VCB DI of the I/O list */
  const MACH = {
    ACA: { n: 'ACWP-A', t: 'P-1108A', ad: 'DITL-76', io: 'MIR-P1108A', vcb: 'I.008A / I.008B' },
    ACB: { n: 'ACWP-B', t: 'P-1108B', ad: 'DITL-77', io: 'MIR-P1108B', vcb: 'I.040A / I.040B' }
  };
  const ROWS = [
    ['ACA', 670, 'A', 'V-CW1002', 'STR-CW1001', 'V-CW1006', 'V-CW1007'],
    ['ACB', 820, 'B', 'V-CW1004', 'STR-CW1002', 'V-CW1008', 'V-CW1009']
  ];
  const HX = [
    ['A', 640, 'V-CW1010', 'V-CW1013'],
    ['B', 730, 'V-CW1011', 'V-CW1014'],
    ['C', 820, 'V-CW1012', 'V-CW1015']
  ];

  function art() {
    const o = [],
      L = [[], [], [], []];
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
        med = S.med[m];
      L[0].push(`<path d="${d}" fill="none" stroke="${S.ol}" stroke-width="${w + 2.5}"/>`);
      L[1].push(
        `<path d="${d}" fill="none" stroke="${f ? med[0] : S.med.off[0]}" stroke-width="${w}"${f ? ` data-fb="${f}" data-c="${med[0]}"` : ''}/>`
      );
      L[2].push(
        `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="${Math.max(1, w * 0.28)}" transform="translate(0 ${-w * 0.18})"/>`
      );
      if (f)
        L[3].push(
          `<path d="${d}" class="cwfl" data-f="${f}" stroke="${med[1]}" stroke-width="${w > 10 ? 2.4 : w > 5 ? 1.8 : 1.3}"/>`
        );
    };
    const vbox = (x, y, tag, u, k) =>
      `<g data-vb="${k || tag}" style="cursor:pointer">${T(x, y - 4, tag, 'cw9')}<rect x="${x}" y="${y}" width="58" height="17" rx="1.5" fill="${S.box}" stroke="${S.boxs}"/>${T(x + 54, y + 13, '-----', 'cwv', `text-anchor="end" data-v="${k || tag}"`)}${T(x + 62, y + 13, u, 'cw9')}</g>`;
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
          ? T(x, y - 12, lab, 'cw8', 'text-anchor="middle"')
          : la === 'dn'
            ? T(x, y + 20, lab, 'cw8', 'text-anchor="middle"')
            : la === 'l'
              ? T(x - 10, y + 3, lab, 'cw8', 'text-anchor="end"')
              : T(x + 12, y + 3, lab, 'cw8');
      return `<g><title>${lab} · manual valve (field)</title><path d="${b}" fill="${S.m[1]}" ${OL}/>${t}</g>`;
    };
    /* check valve, flow right -> left */
    const check = (x, y, lab) =>
      `<g><title>${lab} · check valve</title><path d="M${x + 8} ${y - 7} L${x - 8} ${y} L${x + 8} ${y + 7} Z" fill="${S.m[1]}" ${OL}/><line x1="${x - 8}" y1="${y - 7}" x2="${x - 8}" y2="${y + 7}" stroke="${S.ol}" stroke-width="2"/>${T(x, y + 20, lab, 'cw8', 'text-anchor="middle"')}</g>`;
    /* local gauge (field only, no DCS value) */
    const gauge = (x, y, tag) =>
      `<g><title>${tag} · local pressure gauge (field, no DCS signal)</title><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 14}" stroke="${S.m[1]}"/><circle cx="${x}" cy="${y - 22}" r="8" fill="#e5e9ec" ${OL}/><line x1="${x}" y1="${y - 22}" x2="${x + 4}" y2="${y - 27}" stroke="#11161b" stroke-width="1.2"/>${T(x + 11, y - 25, tag, 'cw8')}</g>`;
    const strainer = (x, y) =>
      `<g><title>suction strainer</title><path d="M${x - 16} ${y - 9} H${x + 16} L${x + 10} ${y + 9} H${x - 10} Z" fill="url(#cwmv)" ${OL}/><path d="M${x - 9} ${y - 7} l6 13 M${x - 1} ${y - 7} l6 13 M${x + 7} ${y - 7} l5 11" stroke="#7f8a94" stroke-width="1.1"/></g>`;
    /* horizontal pump: casing in the line, motor above (lamp under the motor: red RUN, green STOP) */
    const pump = (x, y, id) =>
      `<g data-hit="${id}" style="cursor:pointer"><rect x="${x - 4}" y="${y - 50}" width="8" height="30" fill="${S.m[1]}" ${OL}/><rect x="${x - 26}" y="${y - 96}" width="52" height="46" rx="4" fill="url(#cwmt)" ${OL}/>${[-86, -78, -70, -62].map(d => `<line x1="${x - 24}" y1="${y + d}" x2="${x + 24}" y2="${y + d}" stroke="${S.ol}" stroke-opacity=".45"/>`).join('')}<rect x="${x - 26}" y="${y - 54}" width="52" height="4" fill="${S.none}" data-lamp="${id}"/><circle cx="${x}" cy="${y}" r="21" fill="url(#cwmv)" ${OL}/><circle cx="${x}" cy="${y}" r="13" fill="${S.cav}"/>${imp(x, y, 11, id)}<path d="M${x - 18} ${y + 14} L${x - 26} ${y + 30} H${x + 26} L${x + 18} ${y + 14}" fill="url(#cwmv)" ${OL}/></g>`;
    /* a user of the cooling water: a box with a cooler coil, supply valve at the left */
    const user = (x, y, w, h, a, b) =>
      `<rect x="${x}" y="${y - h / 2}" width="${w}" height="${h}" rx="3" fill="#232a31" stroke="#46525e"/><path d="M${x + 6} ${y + 6} l4 -12 l4 12 l4 -12 l4 12" fill="none" stroke="${S.med.s[1]}" stroke-width="1"/>` +
      T(x + 32, y - (b ? 2 : -3.5), a, 'cw7') +
      (b ? T(x + 32, y + 10, b, 'cw8') : '');
    /* one column of users: supply riser at sx (from the top header), return riser at rx (down to the return header) */
    const column = (sx, rx, bx, bw, list, title, sub) => {
      o.push(T(bx, 82, title, 'cw11') + T(bx + 7 * title.length + 8, 82, sub, 'cw8'));
      const y0 = list[0][0],
        y1 = list[list.length - 1][0];
      pipe(
        [
          [sx, 62],
          [sx, y1]
        ],
        's',
        8,
        'CL'
      );
      pipe(
        [
          [rx, y0],
          [rx, 560]
        ],
        'r',
        8,
        'CL'
      );
      for (const [y, h, a, b, flow] of list) {
        pipe(
          [
            [sx, y],
            [bx, y]
          ],
          's',
          4,
          flow === undefined ? 'CL' : flow
        );
        pipe(
          [
            [bx + bw, y],
            [rx, y]
          ],
          'r',
          4,
          flow === undefined ? 'CL' : flow
        );
        o.push(user(bx, y, bw, h, a, b));
        o.push(valve(sx + 26, y, 0, ''));
      }
    };

    /* ---------------- the users (PD-021) ---------------- */
    /* top supply header from the supply riser of column A */
    pipe(
      [
        [40, 62],
        [1150, 62]
      ],
      's',
      10,
      'CL'
    );
    column(40, 520, 150, 330, [
      [108, 30, 'SAMPLING RACK', 'CW-1-048 3"'],
      [148, 30, 'BFP P-1115A  BOILER FEEDWATER PUMP', 'BFP motor cooler · BFP lube oil cooler Z-1115A'],
      [188, 30, 'BFP P-1115B  BOILER FEEDWATER PUMP', 'BFP motor cooler · BFP lube oil cooler Z-1115B'],
      [228, 30, 'GENERATOR AIR COOLER (A)', 'V-CW1025 / 1026 · TG-CW1155-A1 ~ A4'],
      [268, 30, 'GENERATOR AIR COOLER (B)', 'V-CW1029 / 1030 · TG-CW1155-B1 ~ B4'],
      [308, 30, 'GENERATOR AIR COOLER (C)', 'V-CW1027 · TG-CW1155-C1 / C2'],
      [348, 30, 'GENERATOR AIR COOLER (D)', 'V-CW1028 · TG-CW1155-D1 / D2']
    ], 'TURBINE AND GENERATOR', 'CW-1-016 14"');
    /* turbine oil coolers A / B behind TCV-CW1201 (lube oil temperature control ABC-053 TICLO1002) */
    pipe(
      [
        [40, 422],
        [140, 422]
      ],
      's',
      8,
      'TOC'
    );
    pipe(
      [
        [140, 400],
        [140, 444]
      ],
      's',
      6,
      'TOC'
    );
    [
      [400, 'TURBINE OIL COOLER (B)', 'V-CW1019 / 1021 · TG-CW1154-B1 / B2'],
      [444, 'TURBINE OIL COOLER (A)', 'V-CW1020 / 1022 · TG-CW1154-A1 / A2']
    ].forEach(([y, a, b]) => {
      pipe(
        [
          [140, y],
          [150, y]
        ],
        's',
        4,
        'TOC'
      );
      pipe(
        [
          [480, y],
          [520, y]
        ],
        'r',
        4,
        'TOC'
      );
      o.push(user(150, y, 330, 30, a, b));
    });
    pipe(
      [
        [520, 444],
        [520, 560]
      ],
      'r',
      8,
      'CL'
    );
    o.push(
      `<g data-hit="TCV" style="cursor:pointer"><path d="M82 415 L98 429 L98 415 L82 429 Z" fill="${S.none}" ${OL} data-vl="TCV"/><path d="M80 404 q10 -12 20 0 z" fill="url(#cwmv)" ${OL}/><line x1="90" y1="404" x2="90" y2="422" stroke="${S.ol}"/></g>` +
        T(90, 386, 'TCVCW1201', 'cw9', 'text-anchor="middle"')
    );
    o.push(
      vbox(150, 490, 'TCVCW1201', '%', 'TCV') +
        vbox(256, 490, 'TILO10021', '°C') +
        vbox(362, 490, 'TILO10022', '°C') +
        T(150, 520, 'TICLO1002 (ABC-053) · SOP oil 46 °C, water in ≤ 37 °C', 'cw8')
    );

    column(580, 1100, 640, 410, [
      [110, 40, 'L-1060A  BOTTOM ASH SCREW CONVEYOR', 'FS-CW1060-A1 / A2 · ZV-CW1002'],
      [154, 40, 'L-1060B  BOTTOM ASH SCREW CONVEYOR', 'FS-CW1060-B1 / B2 · ZV-CW1004'],
      [198, 40, 'L-1060C  BOTTOM ASH SCREW CONVEYOR', 'FS-CW1060-C1 / C2 · ZV-CW1006'],
      [242, 40, 'L-1060D  BOTTOM ASH SCREW CONVEYOR', 'FS-CW1060-D1 / D2 · ZV-CW1008'],
      [320, 30, 'Z-1053  PA FAN OIL COOLER', 'V-CW1063 / 1066'],
      [358, 30, 'F-1054  SA FAN BEARINGS', 'V-CW1064 / 1067'],
      [396, 30, 'H-1052  GAS AIR HEATER', 'V-CW1089 / 1090'],
      [434, 30, 'Z-1056  ID FAN OIL COOLER', 'V-CW1065 / 1068'],
      [472, 30, 'F-1056  ID FAN BEARINGS', 'CW-1-107 2"']
    ], 'BOILER', 'bottom ash conveyors CW-1-056 6" · fans · APH');
    ['A', 'B', 'C', 'D'].forEach((n, i) => {
      const y = 110 + i * 44;
      o.push(vbox(880, y - 6, 'TICW1060' + n + '1', '°C') + vbox(960, y - 6, 'TICW1060' + n + '2', '°C'));
    });
    o.push(
      vbox(640, 280, 'PICW1156', 'kg/cm²') +
        vbox(760, 280, 'TICW1156', '°C') +
        T(860, 293, 'ash conveyor header · PT-CW1156 H 7 / L 3.5', 'cw8')
    );

    column(1150, 1540, 1200, 300, [
      [108, 30, 'C-0704A / B / C  IA COMPRESSORS', 'oil coolers, after coolers · V-CW0101 ~ 0103'],
      [148, 30, 'D-0704A / B / C  IA DRYERS', 'STR-CW0031 ~ 0033 · V-CW0107 ~ 0109'],
      [188, 30, 'C-0703A / B / C  PA COMPRESSORS', 'oil coolers, after coolers · V-CW0113 ~ 0115'],
      [228, 30, 'D-0703A / B / C  PA DRYERS', 'STR-CW0034 ~ 0036 · V-CW0119 ~ 0121']
    ], 'AIR COMPRESSORS', 'CW-1-087 6"');
    o.push(
      T(1200, 300, 'Cross-tie with unit 2 (CW-2-087 / CW-2-068 6", V-CW2071 ~ 2074):', 'cw8') +
        T(1200, 312, 'normally closed.', 'cw8') +
        T(1200, 340, 'SOP section 8: cooling water must reach the turbine', 'cw8') +
        T(1200, 352, 'cooler, generator air cooler, BFP, bottom ash screw', 'cw8') +
        T(1200, 364, 'cooler, PAF oil cooler, SAF bearing, GAH, IDF,', 'cw8') +
        T(1200, 376, 'PA / IA compressor and dryer, sampling rack.', 'cw8')
    );

    /* ---------------- return header CW-1-002 20" -> suction ---------------- */
    pipe(
      [
        [520, 560],
        [1745, 560],
        [1745, 745],
        [1510, 745]
      ],
      'r',
      14,
      'CL'
    );
    o.push(T(1130, 552, 'RETURN HEADER  CW-1-002 20"', 'cw8'));
    pipe(
      [
        [1510, 670],
        [1510, 820]
      ],
      'r',
      14,
      'CL'
    );
    o.push(T(1518, 838, 'SUCTION', 'cw8') + T(1518, 849, 'CW-1-003 20"', 'cw8'));

    /* ---------------- expansion tank T-1109 (above the return header; its outlet V-CW1001 joins the suction) ---------------- */
    const EX = 1615,
      EY = 400,
      EW = 90,
      EH = 120;
    /* make-up from MAKE-UP WATER (MU-1-021 3"), from the top: V-MU1031, XV-MU1109 (bypass V-MU1033), V-MU1032 */
    pipe(
      [
        [1660, 84],
        [1660, EY]
      ],
      'd',
      5,
      'ET'
    );
    o.push(T(1660, 74, 'MAKE-UP WATER  MU-1-021 3" ▾', 'cw9', 'text-anchor="middle"'));
    o.push(valve(1660, 130, 1, 'V-MU1031', 'l') + valve(1660, 330, 1, 'V-MU1032', 'l'));
    o.push(
      `<g data-hit="XV" style="cursor:pointer"><path d="M1653 222 L1667 222 L1653 238 L1667 238 Z" fill="${S.none}" ${OL} data-vl="XV"/><line x1="1667" y1="230" x2="1680" y2="230" stroke="${S.ol}"/><rect x="1680" y="223" width="14" height="14" rx="2" fill="url(#cwmv)" ${OL}/>${T(1687, 233, 'S', 'cw8', 'text-anchor="middle" style="fill:#0c1014;font-weight:600"')}</g>` +
        T(1648, 196, 'XV-MU1109', 'cw11', 'text-anchor="end"') +
        T(1648, 210, '-----', 'cw9b', 'text-anchor="end" data-k="xvst"') +
        T(1648, 223, '---', 'cw9b', 'text-anchor="end" data-k="xvau"') +
        T(1648, 236, 'DITL-78 AUTO:', 'cw8', 'text-anchor="end"') +
        T(1648, 248, 'open < 40 %', 'cw8', 'text-anchor="end"') +
        T(1648, 260, 'close > 85 %', 'cw8', 'text-anchor="end"') +
        T(1648, 278, 'bypass V-MU1033', 'cw8', 'text-anchor="end"') +
        T(1648, 290, '(field)', 'cw8', 'text-anchor="end"')
    );
    o.push(
      `<g data-hit="ET" style="cursor:pointer"><rect x="${EX}" y="${EY}" width="${EW}" height="${EH}" rx="14" fill="url(#cwmt)" ${OL}/><rect x="${EX + 8}" y="${EY + 10}" width="${EW - 16}" height="${EH - 20}" rx="6" fill="${S.air}" stroke="#59636d"/><rect x="${EX + 8}" y="${EY + 10}" width="${EW - 16}" height="0" fill="url(#cwwc)" data-k="et"/><g data-k="etw"><path d="M${EX + 10} 0 ${Array(3).fill('q11 -3 22 0').join(' ')}" fill="none" stroke="#c9efe9" stroke-width="1.2" class="cwwv"/></g>` +
        [
          [1.7, 'NL 1.7'],
          [0.8, 'L 0.8'],
          [0.3, 'LL 0.3']
        ]
          .map(([m, l]) => {
            const yy = EY + 10 + (EH - 20) * (1 - m / 2);
            return `<line x1="${EX + EW - 8}" y1="${yy}" x2="${EX + EW + 4}" y2="${yy}" stroke="#aab6c1"/>${T(EX + EW + 6, yy + 3, l, 'cw8')}`;
          })
          .join('') +
        `</g>`
    );
    o.push(T(EX - 6, EY + 40, 'T-1109', 'cw11', 'text-anchor="end"') + T(EX - 6, EY + 52, 'EXPANSION', 'cw8', 'text-anchor="end"') + T(EX - 6, EY + 63, 'TANK', 'cw8', 'text-anchor="end"'));
    o.push(vbox(1680, 330, 'LICW1109', 'm') + T(1680, 360, 'ACWP trip', 'cw8') + T(1680, 371, '< 0.3 m', 'cw8'));
    o.push(T(EX - 6, EY + 84, 'LSLL-CW1109', 'cw8', 'text-anchor="end"') + T(EX - 6, EY + 95, 'PG-CW1151', 'cw8', 'text-anchor="end"'));
    pipe(
      [
        [EX + 45, EY + EH],
        [EX + 45, 560]
      ],
      's',
      8,
      'CL'
    );
    o.push(valve(EX + 45, 540, 1, 'V-CW1001', 'l'));

    /* ---------------- ACWP P-1108A / B (DITL-76 / 77): flow right -> left ---------------- */
    o.push(T(820, 600, 'AUX. COOLING WATER PUMPS  (DITL-76 / 77)', 'cw11'));
    ROWS.forEach(([id, y, n, sv, st, ck, dv]) => {
      pipe(
        [
          [1510, y],
          [1252, y]
        ],
        'r',
        10,
        id
      );
      pipe(
        [
          [1208, y],
          [1000, y]
        ],
        'r',
        10,
        id
      );
      o.push(valve(1480, y, 0, sv, 'dn'));
      o.push(strainer(1425, y) + T(1425, y + 26, st, 'cw8', 'text-anchor="middle"'));
      o.push(vbox(1396, y - 62, 'DPICW1108' + n, 'kg/cm²'));
      o.push(T(1396, y - 30, 'H 0.6 · trip 0.8 (5 s)', 'cw8'));
      o.push(pump(1230, y, id));
      o.push(
        T(1268, y - 86, MACH[id].n, 'cw11', `data-hit="${id}"`) + /* #48: the name opens what the symbol opens */
          T(1268, y - 74, MACH[id].t + ' · ' + MACH[id].ad, 'cw8', `data-hit="${id}"`) +
          T(1268, y - 60, '-----', 'cw9b', `data-st="${id}"`) +
          `<g data-mdh="${id}" style="cursor:pointer">${T(1268, y - 47, `<tspan data-rem="${id}">---</tspan><tspan fill="${S.dim}"> · </tspan><tspan data-au="${id}">---</tspan>`, 'cw9b')}</g>` +
          T(1268, y - 34, '-----', 'cw9b', `data-vcb="${id}"`)
      );
      o.push(vbox(1130, y - 92, 'IIP1108' + n, 'A') + T(1130, y - 64, 'SOP 30 · H 33.7', 'cw8'));
      o.push(check(1160, y, ck) + valve(1100, y, 0, dv, 'dn') + gauge(1040, y, 'PG-CW1108-' + n));
    });
    /* common discharge CW-1-007 20" -> CCWHE */
    pipe(
      [
        [1000, 670],
        [1000, 820]
      ],
      'r',
      14,
      'CL'
    );
    pipe(
      [
        [1000, 730],
        [800, 730]
      ],
      'r',
      14,
      'CL'
    );
    o.push(T(900, 722, 'CW-1-007 20"', 'cw8', 'text-anchor="middle"'));
    o.push(vbox(840, 760, 'TICW1152', '°C') + vbox(840, 802, 'PICW1152', 'kg/cm²'));
    o.push(
      T(840, 832, 'PT-CW1152 H 7.0 · L 5.3', 'cw8') +
        T(840, 843, 'standby AUTO start < 3.5 (DITL-76)', 'cw8') +
        T(840, 854, 'TE-CW1152 H 60 · normal 50 °C', 'cw8')
    );

    /* ---------------- CCWHE H-1107A / B / C (plate type) ---------------- */
    pipe(
      [
        [800, 640],
        [800, 820]
      ],
      'r',
      10,
      'CL'
    );
    pipe(
      [
        [540, 640],
        [540, 820]
      ],
      's',
      10,
      'CL'
    );
    HX.forEach(([n, y, iv, ov]) => {
      pipe(
        [
          [800, y],
          [720, y]
        ],
        'r',
        7,
        'CL'
      );
      pipe(
        [
          [640, y],
          [540, y]
        ],
        's',
        7,
        'CL'
      );
      /* the seawater side (SWBP, 030 SEAWATER): in at the bottom, out at the top */
      pipe(
        [
          [652, y + 40],
          [652, y + 22]
        ],
        'c',
        5,
        'SWX'
      );
      pipe(
        [
          [712, y - 22],
          [712, y - 36]
        ],
        'c',
        5,
        'SWX'
      );
      o.push(
        `<g data-hit="HX${n}" style="cursor:pointer"><rect x="640" y="${y - 22}" width="80" height="44" fill="url(#cwmv)" ${OL}/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<line x1="${648 + i * 8}" y1="${y - 18}" x2="${648 + i * 8}" y2="${y + 18}" stroke="${S.ol}" stroke-opacity=".5"/>`).join('')}<rect x="636" y="${y - 25}" width="8" height="50" fill="url(#cwmt)" ${OL}/><rect x="716" y="${y - 25}" width="8" height="50" fill="url(#cwmt)" ${OL}/></g>`
      );
      o.push(T(664, y - 30, 'H-1107' + n + '  CCWHE-' + n, 'cw9', 'text-anchor="middle"'));
      o.push(valve(770, y, 0, iv, 'dn') + valve(590, y, 0, ov, 'dn'));
    });
    o.push(T(672, 868, 'seawater side: SWBP P-1503A / B / C → CCWHE → channel (030 SEAWATER)', 'cw8'));
    o.push(T(720, 608, 'SEAWATER', 'cw8'));

    /* ---------------- supply header CW-1-014 20" -> users ---------------- */
    pipe(
      [
        [540, 730],
        [40, 730],
        [40, 62]
      ],
      's',
      14,
      'CL'
    );
    o.push(T(60, 722, 'SUPPLY HEADER  CW-1-014 20"', 'cw8'));
    o.push(vbox(250, 752, 'TICW1153', '°C') + vbox(380, 752, 'PICW1153', 'kg/cm²'));
    o.push(
      T(250, 784, 'TE-CW1153 H 40 · normal 34 °C', 'cw8') + T(250, 796, 'PT-CW1153 H 7.0 · L 5.0 · LL 4.8', 'cw8')
    );

    /* legend */
    o.push(
      `<rect x="24" y="852" width="18" height="5" fill="${S.med.s[0]}"/><rect x="150" y="852" width="18" height="5" fill="${S.med.r[0]}"/><rect x="296" y="852" width="18" height="5" fill="${S.med.c[0]}"/><rect x="388" y="852" width="18" height="5" fill="${S.med.d[0]}"/>` +
        T(46, 858, 'COOLED (to users)', 'cw8') +
        T(172, 858, 'HOT RETURN (from users)', 'cw8') +
        T(318, 858, 'SEAWATER', 'cw8') +
        T(410, 858, 'MAKE-UP', 'cw8')
    );
    o.push(
      T(24, 876, 'P&amp;ID K1AU3-PD-021 Rev D (auxiliary cooling water) · SOP PR-OPE-5002 sections 7 ~ 8 · alarm list 20160912', 'cw8')
    );
    o.push(
      T(1744, 876, 'values: plant model (Plant model ON); the logic reads the same value', 'cw8', 'text-anchor="end"')
    );

    const defs = `<defs><linearGradient id="cwmt" x1="0" x2="1"><stop offset="0" stop-color="${S.m[0]}"/><stop offset=".45" stop-color="${S.m[1]}"/><stop offset="1" stop-color="${S.m[2]}"/></linearGradient>
<linearGradient id="cwmv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.m[2]}"/><stop offset=".4" stop-color="${S.m[1]}"/><stop offset="1" stop-color="${S.m[0]}"/></linearGradient>
<linearGradient id="cwwc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8f86"/><stop offset="1" stop-color="#1d4a45"/></linearGradient></defs>`;
    const UF = "font-family:Barlow,'IBM Plex Sans','Segoe UI',Roboto,Arial,sans-serif",
      MF = "font-family:'Roboto Mono','JetBrains Mono',Consolas,monospace";
    const css = `<style>.cw7{font-size:8.5px;fill:${S.nm};${UF}}.cw8{font-size:8.5px;fill:${S.dim};${UF}}.cw9{font-size:9.5px;fill:${S.dim};${UF}}.cw9b{font-size:9.5px;font-weight:600;fill:${S.none};${UF}}.cw11{font-size:11px;font-weight:600;fill:${S.nm};${UF}}
.cwv{font-size:12px;fill:${S.none};${MF}}
.cwfl{fill:none;stroke-dasharray:2 14;stroke-linecap:round;animation:cwfl 1.4s linear infinite}@keyframes cwfl{to{stroke-dashoffset:-32}}
.cwwv{animation:cwwv 3s ease-in-out infinite alternate}@keyframes cwwv{to{transform:translateX(-8px)}}
@media (prefers-reduced-motion:reduce){.cwfl,.cwwv{animation:none}}</style>`;
    /* the pipes first (under the machines and the tanks) */
    return css + defs + L.map(l => l.join('')).join('') + o.join('');
  }

  /* ---------- live links ---------- */
  function ccw(g, api) {
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
    const call = (f, d) => {
      try {
        const v = f();
        return v === undefined ? d : v;
      } catch (e) {
        return d;
      }
    };
    const ST = {},
      V = {},
      MD = {};
    const mst = M => call(() => (M.ad && window.LS_DOCK && LS_DOCK.mst ? LS_DOCK.mst(M.ad) : null), null);
    /* REMOTE SELECTED (row 12) and AUTO SELECTED (row 1) outputs of DITL-76 / 77, found by name on the drawing. LS_DOCK.modeOf looks for
       "REMOTE MODE SELECTED" / "AUTO MODE SELECTED" (DITL-29A / 30) and finds nothing on these drawings */
    const ORow = {};
    const outRow = (ad, re) => {
      const k = ad + re;
      if (ORow[k] === undefined)
        ORow[k] = call(() => {
          const s = LS_DOCK.dOf(ad),
            o = s && DUI.outs(s).find(x => re.test(x.name));
          return o ? o.row : null;
        }, null);
      return ORow[k];
    };
    const outV = (ad, re) => {
      const r = outRow(ad, re);
      return r == null ? null : call(() => LS_DOCK.dout(ad, r), null);
    };
    /* the AUTO SELECTED row that DITL-78 reads (row 3, M.1252) */
    const xvAuto = () =>
      call(() => {
        const s = LS_DOCK.dOf('DITL-78');
        if (!s) return null;
        for (let r = 0; r < 20; r++) {
          const I = DUI.rowInfo(s, r) || {};
          if (/AUTO SELECTED/.test(I.svc || '')) return DUI.rowVal(s, r) === 1 || !!(s.sig && s.sig[r + ':S']);
        }
        return null;
      }, null);
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
    const tick = () => {
      for (const id in MACH) {
        const M = MACH[id],
          s = mst(M);
        if (s !== ST[id] || ST[id] === undefined) {
          ST[id] = s;
          const col = s == null ? S.none : s === 'TRIP' || s === 'RUN' ? S.run : S.stop;
          qa(`[data-lamp="${id}"]`).forEach(e => e.setAttribute('fill', col));
          qa(`[data-st="${id}"]`).forEach(e => {
            e.textContent = s == null ? '-----' : s === 'TRIP' ? 'TRIP' : s === 'RUN' ? 'RUNNING' : 'STOPPED';
            e.style.fill = col;
            e.classList.toggle('h2blink', s === 'TRIP');
          });
          /* the VCB (I/O list STN103 DI "VCB on" / "VCB off"): the CRT lamps VCB ON / OFF of DITL-76 / 77 (rows 3 / 4) are drawn from
             these DI, which are not on the netlist of the sheet: shown closed while the motor runs, as 030 SEAWATER */
          qa(`[data-vcb="${id}"]`).forEach(e => {
            e.textContent = s == null ? '-----' : s === 'RUN' ? 'VCB ON' : 'VCB OFF';
            e.style.fill = s == null ? S.none : s === 'RUN' ? S.run : S.stop;
          });
          setSpin(id, s === 'RUN');
          flow(id, s === 'RUN');
        }
        const rem = outV(M.ad, /REMOTE SELECTED/),
          au = outV(M.ad, /AUTO SELECTED/),
          k = rem + '|' + au;
        if (k === MD[id]) continue;
        MD[id] = k;
        const r = q(`[data-rem="${id}"]`),
          a = q(`[data-au="${id}"]`);
        if (r) {
          r.textContent = rem == null ? '---' : rem ? 'REM' : 'LOC';
          r.setAttribute('fill', rem == null ? S.none : rem ? '#5cd6ff' : '#ffd27a');
        }
        if (a) {
          a.textContent = au == null ? '---' : au ? 'AUTO' : 'MAN';
          a.setAttribute('fill', au == null ? S.none : au ? '#9ff0c4' : '#ffd27a');
        }
      }
      const any = Object.keys(MACH).some(id => ST[id] === 'RUN');
      flow('CL', any);
      flow('TOC', any && V.TCV > 1);
      flow('SWX', V.SWN > 0);
      flow('ET', V.XV === 1 && V.ETF === 1);
      /* XV-MU1109: red = open, green = closed (DITL-78 open command); AUTO / MAN = the AUTO SELECTED row DITL-78 reads */
      const xo = V.XV == null ? null : V.XV === 1,
        xc = xo == null ? S.none : xo ? S.run : S.stop,
        xv = q('[data-vl="XV"]'),
        xs = q('[data-k="xvst"]'),
        xa = q('[data-k="xvau"]'),
        au = xvAuto();
      if (xv) xv.setAttribute('fill', xc);
      if (xs) {
        xs.textContent = xo == null ? '-----' : xo ? 'OPEN' : 'CLOSED';
        xs.style.fill = xc;
      }
      if (xa) {
        xa.textContent = au == null ? '---' : au ? 'AUTO' : 'MAN';
        xa.style.fill = au == null ? S.none : au ? '#9ff0c4' : '#ffd27a';
      }
      const tv = q('[data-vl="TCV"]');
      if (tv) tv.setAttribute('fill', V.TCV == null ? S.none : V.TCV > 1 ? S.run : S.stop);
      /* the expansion tank water follows LICW1109 (0 ~ 2 m) */
      const r = q('[data-k="et"]'),
        w = q('[data-k="etw"]');
      if (r) {
        const f = V.LICW1109 == null ? 0 : Math.max(0, Math.min(1, V.LICW1109 / 2)),
          h = 100 * f;
        r.setAttribute('y', 410 + 100 - h);
        r.setAttribute('height', h);
        if (w) {
          w.setAttribute('transform', `translate(0 ${410 + 100 - h + 3})`);
          w.setAttribute('visibility', f > 0.02 ? 'visible' : 'hidden');
        }
      }
    };
    tick();
    let seen = false;
    const iv = setInterval(() => (g.isConnected ? ((seen = true), tick()) : seen && clearInterval(iv)), 500);
    const HIT = {
      ACA: [MACH.ACA.io, 'ACWP-A P-1108A · DITL-76 (red = running, green = stopped)'],
      ACB: [MACH.ACB.io, 'ACWP-B P-1108B · DITL-77 (red = running, green = stopped)'],
      XV: ['XV-MU1109', 'XV-MU1109 make-up water to expansion tank inlet shut-off · DITL-78 (red = open, green = closed)'],
      TCV: ['TCV-CW1201', 'TCV-CW1201 turbine lube oil temperature control valve · ABC-053 TICLO1002 (red = open, green = closed)'],
      ET: ['LT-CW1109', 'T-1109 expansion tank · LT-CW1109'],
      HXA: ['TT-CW1153', 'H-1107A CCWHE-A (closed cooling water / seawater)'],
      HXB: ['TT-CW1153', 'H-1107B CCWHE-B (closed cooling water / seawater)'],
      HXC: ['TT-CW1153', 'H-1107C CCWHE-C (closed cooling water / seawater)']
    };
    /* 3.2.0-beta.74: a click on an ACWP = its pop-out faceplate beside it (fp-pop.js), the I/O wiring a link inside. DITL-76 / 77: REMOTE
       SELECTED from the local control panel (row 20, the field selector), AUTO PB of the CRT (row 1, maintained: OUT1 = IN1) */
    const fpHit = id => {
      const M = MACH[id],
        go = () => info(M.io);
      if (!window.LS_FPOP) return go();
      LS_FPOP.hit(
        {
          ...M,
          d: M.ad,
          remRows: [19],
          auRow: 0,
          modeFn: () => {
            const r = outV(M.ad, /REMOTE SELECTED/),
              a = outV(M.ad, /AUTO SELECTED/);
            return { rem: r == null ? null : r === 1, au: a == null ? null : a === 1 };
          },
          cur: () => (AN.unit && AN.unit.on ? AN.unit['acI' + (id === 'ACA' ? 0 : 1)] : null)
        },
        go
      );
    };
    /* the dock's "Buksan ang faceplate" of a step motor (fp-pop.js LS_FPOP.openAd) */
    for (const id in MACH) (window.LS_FPREG = window.LS_FPREG || {})[MACH[id].ad] = { open: () => fpHit(id), el: () => q(`[data-hit="${id}"]`), n: MACH[id].n, cur: () => (AN.unit && AN.unit.on ? AN.unit['acI' + (id === 'ACA' ? 0 : 1)] : null) };
    for (const id in HIT)
      qa(`[data-hit="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = HIT[id][1] + (MACH[id] || id === 'XV' ? ' · click = faceplate' : ' · click = info card');
        h.append(ti);
        h.addEventListener('click', e => (e.stopPropagation(), MACH[id] ? fpHit(id) : (id === 'XV' && window.LS_FPOP && LS_FPOP.valveTag(HIT[id][0])) || info(HIT[id][0])));
      });
    for (const id in MACH)
      qa(`[data-mdh="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent =
          MACH[id].n +
          ' · REM / LOC = REMOTE SELECTED (local control panel), AUTO / MAN = AUTO SELECTED (CRT) of ' +
          MACH[id].ad +
          ' · click = faceplate';
        h.append(ti);
        h.addEventListener('click', e => (e.stopPropagation(), fpHit(id)));
      });
    for (const id in MACH)
      qa(`[data-vcb="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = MACH[id].n + ' VCB ON / OFF · STN103 DI ' + MACH[id].vcb + ' (I/O list): shown closed while the motor runs';
        h.append(ti);
      });
    /* the values: the plant model (unit.js AN_ACW, AN_MU, AN_SW) */
    const UNIT = {
      PICW1152: 'acP1',
      PICW1153: 'acP2',
      TICW1152: 'acT1',
      TICW1153: 'acT2',
      DPICW1108A: 'acDp0',
      DPICW1108B: 'acDp1',
      IIP1108A: 'acI0',
      IIP1108B: 'acI1',
      PICW1156: 'acP6',
      TICW1156: 'acT6',
      TICW1060A1: 'acTb',
      TICW1060A2: 'acTb',
      TICW1060B1: 'acTb',
      TICW1060B2: 'acTb',
      TICW1060C1: 'acTb',
      TICW1060C2: 'acTb',
      TICW1060D1: 'acTb',
      TICW1060D2: 'acTb',
      LICW1109: 'etLvl',
      XV: 'muXv',
      ETF: 'muFill',
      SWN: 'swNb'
    };
    const IO = {
      PICW1152: 'PT-CW1152',
      PICW1153: 'PT-CW1153',
      TICW1152: 'TT-CW1152',
      TICW1153: 'TT-CW1153',
      DPICW1108A: 'DPT-CW1108-A',
      DPICW1108B: 'DPT-CW1108-B',
      IIP1108A: 'IT-P1108A',
      IIP1108B: 'IT-P1108B',
      PICW1156: 'PT-CW1156',
      TICW1156: 'TT-CW1156',
      LICW1109: 'LT-CW1109',
      TCV: 'TCV-CW1201',
      TILO10021: 'TILO10021',
      TILO10022: 'TILO10022'
    };
    for (const n of 'ABCD') for (const j of '12') IO['TICW1060' + n + j] = 'TT-CW1060-' + n + j;
    /* speed (user 2026-11-01, 6x CPU): every value of the LIVE refresh asked for the whole page; now once after that refresh */
    let tq = 0;
    const tickSoon = () => tq || (tq = Promise.resolve().then(() => ((tq = 0), tick())));
    const showV = k => {
      const t = q(`[data-v="${k}"]`);
      if (!t) return;
      const v = V[k],
        dp = /^DP/.test(k) ? 2 : /^(PI|LI)/.test(k) ? 2 : /^TI/.test(k) ? 0 : 1;
      const tx = fmt(v, dp),
        fl = v == null ? S.none : S.val;
      if (t.textContent !== tx) t.textContent = tx;
      if (t.getAttribute('fill') !== fl) t.setAttribute('fill', fl);
    };
    for (const k in UNIT)
      api.reg(
        { t: 'val', tag: 'UNIT.' + UNIT[k], v: '' },
        X => ((V[k] = X && isFinite(X.v) ? +X.v : null), showV(k), tickSoon()),
        null
      );
    /* ABC-053: TCV-CW1201 = the MV of TICLO1002, the lube oil temperatures of the logic */
    api.reg({ t: 'valve', tag: 'TCVCW1201', v: '' }, X => ((V.TCV = X && isFinite(X.v) ? +X.v : null), showV('TCV'), tickSoon()), null);
    for (const k of ['TILO10021', 'TILO10022'])
      api.reg({ t: 'val', tag: k, v: '' }, X => ((V[k] = X && isFinite(X.v) ? +X.v : null), showV(k)), null);
    for (const k in IO) {
      const b = q(`[data-vb="${k}"]`);
      if (!b) continue;
      const ti = document.createElementNS(NS, 'title');
      ti.textContent =
        IO[k] +
        (k === 'TCV' ? ' · MV of TICLO1002 (ABC-053)' : /^TILO/.test(k) ? ' · ABC-053' : ' · plant model') +
        ' · click = its I/O list line';
      b.append(ti);
      b.addEventListener('click', e => (e.stopPropagation(), info(IO[k])));
      showV(k);
    }
    return pg;
  }
  PLANT_V2.screens.CW = ccw;
  /* after MAKE-UP WATER in the list of the Plant view */
  const Ls = (window.PLANT_SYS = window.PLANT_SYS || []),
    i = Ls.findIndex(x => x.id === 'MU');
  Ls.splice(i >= 0 ? i + 1 : Ls.length, 0, {
    fitAll: 1,
    id: 'CW',
    title: '027 CLOSED COOLING WATER',
    num: '027',
    name: 'CLOSED COOLING WATER',
    src: '27.PNG',
    w: 1920,
    h: 1000,
    v2: true,
    screen: 'CW',
    style: 'steel',
    items: []
  });
})();
