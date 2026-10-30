/* 036 TURBINE OIL SYSTEM (roadmap step 6, PR-OPE-5002 "TURBINE CONTROL OIL": pre-start check, MAIN OIL PUMP & VAPOR EXTRACTOR START-UP,
   OIL PURIFIER START-UP, CONTROL OIL PUMP START-UP). Own vector graphics in the STEEL style of 030 SEAWATER / MAKE-UP WATER. The flow
   diagrams K1AU3-PD-0xx have no turbine oil sheet (the turbine is the MHPS package), so the equipment and the instruments are those of
   the SOP section and of the TCS I/O list (iolist-tcs HMI_AI / HMI_DI: 1PTLO1922A / B, 1PTLO1931A / B, 1PTLO1923, 1PTLO10031 ~ 33,
   1PTLO10061 ~ 63, 1PTLO10071 ~ 73, 1TELO1001, 1TELO10021 / 22, 1TEGE1007 / 1008, 1P1922A / B, 1P1931A / B, 1P1923, 1F1937, oil purifier
   pump running DI, master trip solenoids A1 / A2 / B1 / B2, main oil tank level high / low); the HMI snapshot 36.PNG is only the guide
   for the flow (COP suction from the bearing oil line after the filter, EOP into the bearing oil line, trip oil to MSV / CV / CRV).
   - main oil tank T-1920 (drains V-LO1021 / 1032 NC), vapour extractor F-1937 (PGLO1920 -20 ~ -50 mmH2O);
   - MOP P-1922A / B -> lube oil header (pressure control V-LO1004, sensing V-LO1031) -> lube oil cooler H-1921A / B (cooling water
     TCV-CW1201 of TICLO1002, ABC-053, the DCS loop: TE-LO1002-1 / -2) -> oil filter (DPISL01932) -> bearing oil header (PSLO1004,
     PILO10031 ~ 33) -> bearings no. 1 ~ 4 (TIGE1007 / 1008); EOP P-1923 (DC) into the bearing oil header;
   - COP P-1931A / B (suction: the bearing oil line) -> control oil filter (DPISL01933A / B) -> control oil header (PILO10061 ~ 63) ->
     MSV / CV / CRV actuators; master trip solenoid valves -> trip oil (PILO10071 ~ 73);
   - oil purifier: V-LO1201 -> P-1941 -> V-LO1205 coalescer filter (water drain V-LO1223) -> back to the tank (local panel).
   The pumps are TCS equipment (no DCS DITL): a click opens the TCS operation box of the pump (START / STOP / AUTO / MANUAL, as SOP 2620
   "COP(B) > MANUAL > EXECUTE > STOP"; EOP and vapour extractor START / STOP; the oil purifier at its local panel = FIELD). Values = the
   plant model (tcs.js TCS_OIL, AN_UNIT lo*) and the ABC-053 loop; never from this page. Run state: red = running, green = stopped.
   Drawn in a 1760 x 900 space, scaled to the 1920 x 1000 frame of hmi2.js. */
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
    warn: '#e0a526',
    m: ['#3e454c', '#b4bec7', '#4a525a'],
    cav: '#232a31',
    air: '#20272e',
    /* media: l lube oil, c control oil, t trip oil, w cooling water */
    med: {
      l: ['#a8843a', '#f3dfb0'],
      c: ['#b0663e', '#f5cfb5'],
      t: ['#9a4f6c', '#f0c6d6'],
      w: ['#5d7f9e', '#cfe3f3'],
      off: ['#3a424b', null]
    }
  };
  const T = (x, y, s, c, a) => `<text x="${x}" y="${y}" class="${c}"${a ? ' ' + a : ''}>${s}</text>`;
  const OL = `stroke="${S.ol}" stroke-width="1"`;
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  /* the machines: name, tag, the TCS pump key (tcs.js oil command) or the field key, what the operation box offers */
  const MACH = {
    MB: { n: 'MOP-B', t: 'P-1922B', d: 'MAIN OIL PUMP (B)', k: 'mopB', ops: 1 },
    MA: { n: 'MOP-A', t: 'P-1922A', d: 'MAIN OIL PUMP (A)', k: 'mopA', ops: 1 },
    EO: { n: 'EOP', t: 'P-1923', d: 'DC EMERGENCY OIL PUMP', k: 'eop', ops: 0 },
    CA: { n: 'COP-A', t: 'P-1931A', d: 'CONTROL OIL PUMP (A)', k: 'copA', ops: 1 },
    CB: { n: 'COP-B', t: 'P-1931B', d: 'CONTROL OIL PUMP (B)', k: 'copB', ops: 1 },
    VX: { n: 'VAPOUR EXTRACTOR', t: 'F-1937', d: 'MAIN OIL TANK VAPOUR EXTRACTOR', k: 'vex', ops: 0 },
    PU: { n: 'OIL PURIFIER PUMP', t: 'P-1941', d: 'OIL PURIFIER PUMP (local panel)', k: 'pur', ops: 0, field: 1 }
  };

  function art() {
    const o = [],
      G = [[], [], [], []];
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
      G[0].push(`<path d="${d}" fill="none" stroke="${S.ol}" stroke-width="${w + 2.5}"/>`);
      G[1].push(
        `<path d="${d}" fill="none" stroke="${f ? med[0] : S.med.off[0]}" stroke-width="${w}"${f ? ` data-fb="${f}" data-c="${med[0]}"` : ''}/>`
      );
      G[2].push(
        `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="${Math.max(1, w * 0.28)}" transform="translate(0 ${-w * 0.18})"/>`
      );
      if (f)
        G[3].push(`<path d="${d}" class="tofl" data-f="${f}" stroke="${med[1]}" stroke-width="${w > 7 ? 1.8 : 1.3}"/>`);
    };
    /* value box: tag above, value, unit; k = the value key */
    const vbox = (x, y, tag, u, k, w) =>
      `<g data-vb="${k || tag}" style="cursor:pointer">${T(x, y - 4, tag, 'to9')}<rect x="${x}" y="${y}" width="${w || 58}" height="17" rx="1.5" fill="${S.box}" stroke="${S.boxs}"/>${T(x + (w || 58) - 4, y + 13, '-----', 'tov', `text-anchor="end" data-v="${k || tag}"`)}${T(x + (w || 58) + 4, y + 13, u, 'to9')}</g>`;
    /* status lamp line: a small square + text, data-lp = key */
    const lamp = (x, y, k, txt) =>
      `<g><rect x="${x}" y="${y - 8}" width="9" height="9" fill="${S.none}" ${OL} data-lp="${k}"/>${T(x + 14, y, txt, 'to8')}${T(x + 14, y + 11, '-----', 'to8b', `data-lt="${k}"`)}</g>`;
    const imp = (x, y, r, id) =>
      `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#11161b"/><g data-imp="${id}">${[0, 1, 2, 3, 4].map(i => `<path d="M0 0 Q${r * 0.55} ${-r * 0.2} ${r * 0.85} ${-r * 0.5}" transform="rotate(${i * 72})" stroke="#c3ccd5" stroke-width="${r / 5}" fill="none" stroke-linecap="round"/>`).join('')}</g><circle r="${r * 0.22}" fill="#c3ccd5"/></g>`;
    /* manual valve of the field (no signal): grey */
    const valve = (x, y, vert, lab, la, note) => {
      const b = vert
        ? `M${x - 7} ${y - 8} L${x + 7} ${y - 8} L${x - 7} ${y + 8} L${x + 7} ${y + 8} Z`
        : `M${x - 8} ${y - 7} L${x + 8} ${y + 7} L${x + 8} ${y - 7} L${x - 8} ${y + 7} Z`;
      const t = !lab
        ? ''
        : la === 'up'
          ? T(x, y - 12, lab, 'to8', 'text-anchor="middle"')
          : la === 'dn'
            ? T(x, y + 20, lab, 'to8', 'text-anchor="middle"')
            : la === 'l'
              ? T(x - 11, y + 3, lab, 'to8', 'text-anchor="end"')
              : T(x + 12, y + 3, lab, 'to8');
      return `<g><title>${lab} · ${note || 'manual valve (field)'}</title><path d="${b}" fill="${S.m[1]}" ${OL}/>${t}</g>`;
    };
    /* check valve in a vertical riser (flow up) */
    const checkV = (x, y) =>
      `<g><title>check valve</title><path d="M${x - 7} ${y + 8} L${x} ${y - 8} L${x + 7} ${y + 8} Z" fill="${S.m[1]}" ${OL}/><line x1="${x - 7}" y1="${y - 8}" x2="${x + 7}" y2="${y - 8}" stroke="${S.ol}" stroke-width="2"/></g>`;
    /* duplex filter on a line (hor or vert), its DP switch label */
    const filt = (x, y, vert, lab) =>
      `<g><title>${lab}</title>${vert ? `<rect x="${x - 13}" y="${y - 16}" width="26" height="32" rx="3" fill="url(#tomv)" ${OL}/><path d="M${x - 8} ${y - 11} v22 M${x} ${y - 11} v22 M${x + 8} ${y - 11} v22" stroke="#6d7781"/>` : `<rect x="${x - 16}" y="${y - 13}" width="32" height="26" rx="3" fill="url(#tomv)" ${OL}/><path d="M${x - 11} ${y - 8} h22 M${x - 11} ${y} h22 M${x - 11} ${y + 8} h22" stroke="#6d7781"/>`}</g>`;
    /* pump: casing, motor above (lamp under the motor: red RUN, green STOP); in = suction side */
    const pump = (x, y, id, sub) =>
      `<g data-hit="${id}" style="cursor:pointer"><rect x="${x - 4}" y="${y - 50}" width="8" height="30" fill="${S.m[1]}" ${OL}/><rect x="${x - 26}" y="${y - 96}" width="52" height="46" rx="4" fill="url(#tomt)" ${OL}/>${[-86, -78, -70, -62].map(d => `<line x1="${x - 24}" y1="${y + d}" x2="${x + 24}" y2="${y + d}" stroke="${S.ol}" stroke-opacity=".45"/>`).join('')}<rect x="${x - 26}" y="${y - 54}" width="52" height="4" fill="${S.none}" data-lamp="${id}"/><circle cx="${x}" cy="${y}" r="21" fill="url(#tomv)" ${OL}/><circle cx="${x}" cy="${y}" r="13" fill="${S.cav}"/>${imp(x, y, 11, id)}${sub ? '' : `<path d="M${x - 18} ${y + 14} L${x - 26} ${y + 30} H${x + 26} L${x + 18} ${y + 14}" fill="url(#tomv)" ${OL}/>`}</g>`;
    /* name / tag / state / mode beside a machine (right-aligned at x) */
    const label = (x, y, id, a) => {
      const M = MACH[id],
        an = a || 'end';
      return (
        T(x, y, M.n, 'to11', `text-anchor="${an}"`) +
        T(x, y + 12, M.t, 'to9', `text-anchor="${an}"`) +
        T(x, y + 26, '-----', 'to9b', `text-anchor="${an}" data-st="${id}"`) +
        T(x, y + 38, M.field ? 'LOCAL' : M.ops ? '---' : 'TCS', 'to8b', `text-anchor="${an}" data-md="${id}"`)
      );
    };

    /* ---------------- turbine / generator shaft and the bearings ---------------- */
    o.push(
      T(24, 62, 'TURBINE / GENERATOR BEARINGS', 'to11') +
        T(24, 74, 'bearing oil: lube oil cooler, filter', 'to8')
    );
    o.push(`<rect x="250" y="106" width="1100" height="8" rx="3" fill="url(#tomv)" ${OL}/>`);
    const casing = (x0, x1, h0, h1, lab) =>
      `<path d="M${x0} ${110 - h0} L${x1} ${110 - h1} L${x1} ${110 + h1} L${x0} ${110 + h0} Z" fill="url(#tomc)" ${OL}/>` +
      T((x0 + x1) / 2, 114, lab, 'to11', 'text-anchor="middle" style="fill:#0c1014"');
    o.push(casing(370, 530, 26, 46, 'HP'));
    o.push(casing(850, 610, 30, 56, 'IP / LP'));
    o.push(
      `<rect x="960" y="74" width="200" height="72" rx="6" fill="url(#tomc)" ${OL}/>` +
        T(1060, 114, 'GENERATOR', 'to11', 'text-anchor="middle" style="fill:#0c1014"')
    );
    o.push(
      `<rect x="1240" y="88" width="90" height="44" rx="4" fill="url(#tomc)" ${OL}/>` +
        T(1285, 114, 'EXCITER', 'to9', 'text-anchor="middle" style="fill:#0c1014"')
    );
    const BRG = [
      [330, 'NO.1'],
      [570, 'NO.2'],
      [930, 'NO.3'],
      [1190, 'NO.4']
    ];
    BRG.forEach(([x, n]) => {
      pipe(
        [
          [x, 200],
          [x, 134]
        ],
        'l',
        4,
        'BRG'
      );
      o.push(
        `<rect x="${x - 12}" y="118" width="24" height="16" rx="2" fill="${S.m[1]}" ${OL}/>` +
          T(x, 66, n, 'to8', 'text-anchor="middle"')
      );
    });
    o.push(vbox(942, 160, 'TIGE1007', '°C') + T(942, 190, 'no.3 bearing outlet', 'to8'));
    o.push(vbox(1202, 160, 'TIGE1008', '°C') + T(1202, 190, 'no.4 bearing outlet', 'to8'));
    o.push(vbox(24, 92, 'SPEED', 'rpm', 'RPM', 64) + T(24, 124, 'turbine (TCS)', 'to8'));
    /* bearing oil header */
    pipe(
      [
        [280, 200],
        [1190, 200]
      ],
      'l',
      7,
      'BRG'
    );
    o.push(T(600, 192, 'BEARING OIL HEADER', 'to8'));
    o.push(
      vbox(310, 226, 'PILO10031', 'kg/cm²') +
        vbox(420, 226, 'PILO10032', 'kg/cm²') +
        vbox(530, 226, 'PILO10033', 'kg/cm²')
    );
    o.push(T(310, 258, 'bearing oil (TCS) · SOP PGLO1008 > 1.05 · EOP auto start ≤ 1.05', 'to8'));
    o.push(lamp(24, 160, 'PSL', 'PSLO1004 BEARING OIL PRESS. LOW (EOP AUTO START)'));

    /* ---------------- main oil tank T-1920 ---------------- */
    const TX = 120,
      TY = 700,
      TW = 920,
      TH = 130;
    o.push(
      `<g data-hit="TK" style="cursor:pointer"><rect x="${TX}" y="${TY}" width="${TW}" height="${TH}" rx="6" fill="url(#tomt)" ${OL}/><rect x="${TX + 10}" y="${TY + 10}" width="${TW - 20}" height="${TH - 20}" rx="3" fill="${S.air}" stroke="#59636d"/><rect x="${TX + 10}" y="${TY + 40}" width="${TW - 20}" height="${TH - 50}" fill="url(#tool)"/><path d="M${TX + 12} ${TY + 42} ${Array(44).fill('q10 -3 20 0').join(' ')}" fill="none" stroke="${S.med.l[1]}" stroke-opacity=".7" stroke-width="1.2" class="towv"/></g>`
    );
    o.push(
      T(TX + TW / 2 - 60, TY + TH - 18, 'T-1920  MAIN OIL TANK', 'to11', 'text-anchor="middle" style="fill:#f6ead0"')
    );
    o.push(lamp(TX + 560, TY + 98, 'LVL', 'TANK LEVEL (LSH / LSL) · SOP > 0 mm'));
    o.push(
      valve(300, TY + TH + 14, 0, 'V-LO1021 (NC)', 'r', 'drain to the main oil tank, closed (SOP pre-start)') +
        valve(470, TY + TH + 14, 0, 'V-LO1032 (NC)', 'r', 'drain to the main oil tank, closed (SOP pre-start)')
    );
    o.push(
      `<line x1="300" y1="${TY + TH}" x2="300" y2="${TY + TH + 6}" stroke="${S.m[1]}" stroke-width="3"/><line x1="470" y1="${TY + TH}" x2="470" y2="${TY + TH + 6}" stroke="${S.m[1]}" stroke-width="3"/>`
    );

    /* ---------------- MOP B / A and EOP (vertical, submerged suction) ---------------- */
    o.push(T(150, 480, 'LUBE OIL HEADER', 'to8') + T(150, 491, 'SOP 5.6 ~ 6.6 · standby AUTO start ≤ 5.6', 'to8'));
    pipe(
      [
        [480, 500],
        [40, 500],
        [40, 317],
        [60, 317]
      ],
      'l',
      8,
      'LUB'
    );
    pipe(
      [
        [40, 387],
        [60, 387]
      ],
      'l',
      8,
      'LUB'
    );
    [
      ['MB', 240, 'PILO1922B', 'loPb'],
      ['MA', 440, 'PILO1922A', 'loPa']
    ].forEach(([id, x, tg, k]) => {
      pipe(
        [
          [x, TY + 70],
          [x, 661]
        ],
        'l',
        5,
        id
      );
      pipe(
        [
          [x + 21, 640],
          [x + 40, 640],
          [x + 40, 500]
        ],
        'l',
        6,
        id
      );
      o.push(pump(x, 640, id, 1) + checkV(x + 40, 580));
      o.push(label(x - 32, 552, id));
      o.push(vbox(x + 50, 524, tg, 'kg/cm²', k));
    });
    /* lube oil pressure control V-LO1004 (sensing V-LO1031) spills back to the tank */
    pipe(
      [
        [100, 500],
        [100, 760],
        [120, 760]
      ],
      'l',
      4,
      ''
    );
    o.push(
      valve(100, 560, 1, 'V-LO1031', 'l', 'lube oil pressure control valve sensing line adjusting valve, open (SOP)')
    );
    o.push(
      `<g><title>V-LO1004 · lube oil pressure control valve (set by hand with the instrument tech, SOP)</title><path d="M93 622 L107 622 L93 638 L107 638 Z" fill="${S.m[1]}" ${OL}/><path d="M92 616 q8 -10 16 0 z" fill="url(#tomv)" ${OL}/></g>` +
        T(89, 628, 'V-LO1004', 'to8', 'text-anchor="end"') +
        T(89, 639, 'PCV', 'to8', 'text-anchor="end"')
    );
    /* EOP into the bearing oil header */
    pipe(
      [
        [660, TY + 70],
        [660, 661]
      ],
      'l',
      5,
      'EO'
    );
    pipe(
      [
        [681, 640],
        [700, 640],
        [700, 200]
      ],
      'l',
      6,
      'EO'
    );
    o.push(pump(660, 640, 'EO', 1) + checkV(700, 590));
    o.push(label(628, 552, 'EO'));
    o.push(vbox(710, 524, 'PILO1923', 'kg/cm²', 'loEop'));
    o.push(T(710, 556, 'DC · auto start bearing oil ≤ 1.05', 'to8') + T(710, 567, 'stop by hand only (SOP)', 'to8'));

    /* ---------------- vapour extractor F-1937 ---------------- */
    pipe(
      [
        [900, TY],
        [900, 664]
      ],
      'l',
      5,
      ''
    );
    pipe(
      [
        [900, 636],
        [900, 604]
      ],
      'l',
      4,
      'VX'
    );
    o.push(
      `<g data-hit="VX" style="cursor:pointer"><circle cx="900" cy="650" r="17" fill="url(#tomv)" ${OL}/>${imp(900, 650, 11, 'VX')}<rect x="918" y="640" width="30" height="20" rx="3" fill="url(#tomt)" ${OL}/><rect x="918" y="661" width="30" height="3" fill="${S.none}" data-lamp="VX"/></g>`
    );
    o.push(valve(900, 682, 1, 'V-LO1041', 'r', 'vapour extractor suction valve, crack open ~ 10° (SOP)'));
    o.push(T(906, 600, '▴ oil vapour to atmosphere', 'to8'));
    o.push(label(866, 600, 'VX'));
    o.push(vbox(960, 640, 'PGLO1920', 'mmH₂O', 'loVac') + T(960, 672, 'SOP −20 ~ −50', 'to8'));

    /* ---------------- lube oil cooler H-1921A / B and the oil filter ---------------- */
    [
      ['B', 317, 'TILO10022', 'TE-LO1002-2'],
      ['A', 387, 'TILO10021', 'TE-LO1002-1']
    ].forEach(([n, y, tg, io]) => {
      o.push(
        `<g data-hit="CL${n}" style="cursor:pointer"><rect x="60" y="${y - 17}" width="180" height="34" rx="17" fill="url(#tomc)" ${OL}/>${[90, 120, 150, 180, 210].map(xx => `<line x1="${xx}" y1="${y - 15}" x2="${xx}" y2="${y + 15}" stroke="${S.ol}" stroke-opacity=".35"/>`).join('')}</g>` +
          T(
            150,
            y + 4,
            'LUBE OIL COOLER (' + n + ')',
            'to8',
            'text-anchor="middle" style="fill:#0c1014;font-weight:600"'
          )
      );
      pipe(
        [
          [240, y],
          [280, y]
        ],
        'l',
        8,
        'LUB'
      );
      o.push(vbox(296, y - 9, tg, '°C', io));
    });
    o.push(T(60, 290, 'H-1921A / B  (one in service, change-over valve at field)', 'to8'));
    pipe(
      [
        [280, 387],
        [280, 200]
      ],
      'l',
      8,
      'LUB'
    );
    o.push(
      filt(280, 252, 1, 'oil filter · DPISL01932 differential pressure') +
        T(250, 248, 'OIL', 'to8', 'text-anchor="end"') +
        T(250, 259, 'FILTER', 'to8', 'text-anchor="end"')
    );
    o.push(lamp(292, 272, 'DPF', 'DPISL01932'));
    /* cooling water through cooler A (closed cooling water), TCV-CW1201 of TICLO1002 */
    pipe(
      [
        [420, 470],
        [200, 470],
        [200, 404]
      ],
      'w',
      5,
      'CW'
    );
    pipe(
      [
        [120, 404],
        [120, 450],
        [60, 450]
      ],
      'w',
      5,
      'CW'
    );
    o.push(T(64, 444, '◂ CW OUT', 'to8') + T(424, 474, 'CW IN (ACW)', 'to8'));
    o.push(
      `<g data-hit="TCV" style="cursor:pointer"><path d="M332 463 L348 477 L348 463 L332 477 Z" fill="${S.none}" ${OL} data-vl="TCV"/><path d="M330 452 q10 -12 20 0 z" fill="url(#tomv)" ${OL}/><line x1="340" y1="452" x2="340" y2="470" stroke="${S.ol}"/></g>` +
        T(340, 492, 'TCV-CW1201', 'to9', 'text-anchor="middle"')
    );
    /* the DCS loop TICLO1002 (ABC-053): PV = the cooler outlet TE-LO1002, MV = TCV-CW1201; click = faceplate */
    const cx = 400,
      cy = 336,
      cw = 150;
    o.push(
      `<g data-hit="TIC" style="cursor:pointer"><rect x="${cx}" y="${cy}" width="${cw}" height="46" rx="2" fill="#121920" stroke="#2f3c48"/>` +
        T(cx + 6, cy + 13, 'TICLO1002', 'to11') +
        `<rect x="${cx + cw - 36}" y="${cy + 3}" width="31" height="12" rx="6" fill="none" stroke="${S.none}" data-k="cpill"/>` +
        T(cx + cw - 20.5, cy + 12.5, '---', 'to8b', 'text-anchor="middle" data-k="cmode"') +
        T(cx + 6, cy + 27, 'PV', 'to8') +
        T(cx + 66, cy + 27, '-----', 'tov', 'text-anchor="end" data-k="cpv"') +
        T(cx + 76, cy + 27, 'SV', 'to8') +
        T(cx + cw - 22, cy + 27, '-----', 'tov', 'text-anchor="end" data-k="csv"') +
        T(cx + cw - 19, cy + 27, '°C', 'to8') +
        T(cx + 6, cy + 41, 'MV', 'to8') +
        `<rect x="${cx + 24}" y="${cy + 35}" width="70" height="5" fill="#262d34"/><rect x="${cx + 24}" y="${cy + 35}" width="0" height="5" fill="#8fa3b6" data-k="cbar"/>` +
        T(cx + cw - 22, cy + 41, '-----', 'tov', 'text-anchor="end" data-k="cmv"') +
        T(cx + cw - 19, cy + 41, '%', 'to8') +
        `</g>`
    );
    o.push(T(cx, cy + 58, 'lube oil temp. control (ABC-053) · SOP: REMOTE, oil out 46 °C', 'to8'));
    o.push(T(cx, cy + 69, 'CW in ≤ 37 °C · click = faceplate', 'to8'));
    o.push(vbox(60, 246, 'TILO1001', '°C', 'loTin') + T(60, 276, 'cooler oil inlet (TCS)', 'to8'));

    /* ---------------- COP A / B, control oil, trip oil ---------------- */
    o.push(T(830, 300, 'CONTROL OIL PUMPS', 'to11') + T(830, 312, 'suction: bearing oil line', 'to8'));
    pipe(
      [
        [820, 200],
        [820, 520],
        [1210, 520]
      ],
      'l',
      6,
      'CSUC'
    );
    [
      ['CA', 980, 'PILO1931A', 'loCa'],
      ['CB', 1180, 'PILO1931B', 'loCb']
    ].forEach(([id, x, tg, k]) => {
      pipe(
        [
          [x - 30, 520],
          [x - 30, 450],
          [x - 21, 450]
        ],
        'l',
        5,
        id
      );
      pipe(
        [
          [x + 21, 450],
          [x + 40, 450],
          [x + 40, 280]
        ],
        'c',
        5,
        id
      );
      o.push(pump(x, 450, id) + checkV(x + 40, 400));
      o.push(label(x - 34, 360, id));
      o.push(vbox(x + 50, 330, tg, 'kg/cm²', k));
    });
    o.push(
      T(900, 545, 'SOP: COP out ~ 163.2 · standby AUTO start ≤ 133', 'to8') +
        T(900, 556, 'set the standby to AUTO at > 160 (SOP)', 'to8')
    );
    pipe(
      [
        [1020, 280],
        [1580, 280]
      ],
      'c',
      7,
      'CTL'
    );
    o.push(filt(1290, 280, 0, 'control oil filter · DPISL01933A / B differential pressure'));
    o.push(T(1290, 304, 'OIL FILTER', 'to8', 'text-anchor="middle"'));
    o.push(lamp(1320, 318, 'DPC', 'DPISL01933A / B'));
    o.push(
      vbox(1330, 232, 'PILO10061', 'kg/cm²', 'loCtl') +
        vbox(1430, 232, 'PILO10062', 'kg/cm²', 'loCtl') +
        vbox(1530, 232, 'PILO10063', 'kg/cm²', 'loCtl')
    );
    o.push(T(1330, 210, 'CONTROL OIL HEADER (TCS) · SOP 133 ~ 163', 'to8'));
    const act = (y0, med, key) =>
      ['MSV', 'CV', 'CRV']
        .map((n, i) => {
          const y = y0 + i * 44;
          pipe(
            [
              [1590, y],
              [1640, y]
            ],
            med,
            5,
            key
          );
          return (
            `<rect x="1640" y="${y - 15}" width="90" height="30" rx="3" fill="#232a31" stroke="#46525e"/>` +
            T(1685, y + 4, n, 'to11', 'text-anchor="middle"')
          );
        })
        .join('');
    pipe(
      [
        [1580, 280],
        [1590, 280],
        [1590, 236],
        [1590, 324]
      ],
      'c',
      5,
      'CTL'
    );
    o.push(act(236, 'c', 'CTL'));
    /* master trip solenoid valves -> trip oil */
    pipe(
      [
        [1440, 280],
        [1440, 420]
      ],
      'c',
      5,
      'CTL'
    );
    o.push(
      `<g data-hit="MTS" style="cursor:pointer"><rect x="1320" y="420" width="130" height="40" rx="3" fill="url(#tomc)" ${OL}/>` +
        T(1385, 437, 'MASTER TRIP', 'to8', 'text-anchor="middle" style="fill:#0c1014;font-weight:600"') +
        T(1385, 450, 'SOLENOID VALVES', 'to8', 'text-anchor="middle" style="fill:#0c1014;font-weight:600"') +
        `</g>`
    );
    pipe(
      [
        [1450, 440],
        [1590, 440],
        [1590, 396],
        [1590, 484]
      ],
      't',
      5,
      'TRP'
    );
    o.push(act(396, 't', 'TRP'));
    o.push(T(1460, 432, 'TRIP OIL', 'to8'));
    o.push(
      vbox(1330, 548, 'PILO10071', 'kg/cm²', 'loTrip') +
        vbox(1440, 548, 'PILO10072', 'kg/cm²', 'loTrip') +
        vbox(1550, 548, 'PILO10073', 'kg/cm²', 'loTrip')
    );
    o.push(T(1330, 530, 'TRIP OIL (TCS) · = control oil while the turbine is reset', 'to8'));
    ['A1', 'A2', 'B1', 'B2'].forEach((n, i) =>
      o.push(lamp(1330 + (i % 2) * 130, 480 + Math.floor(i / 2) * 26, 'MT' + n, 'MASTER TRIP VALVE (' + n + ')'))
    );

    /* ---------------- oil purifier (local skid) ---------------- */
    o.push(T(1100, 652, 'OIL PURIFIER  (local panel)', 'to11'));
    pipe(
      [
        [TX + TW, 800],
        [1259, 800]
      ],
      'l',
      5,
      'PU'
    );
    o.push(valve(1100, 800, 0, 'V-LO1201 (NO)', 'dn', 'oil purifier inlet oil supply connection valve, open (SOP)'));
    o.push(pump(1280, 800, 'PU'));
    o.push(label(1246, 712, 'PU'));
    pipe(
      [
        [1301, 800],
        [1420, 800]
      ],
      'l',
      5,
      'PU'
    );
    o.push(valve(1370, 800, 0, 'V-LO1205 (NO)', 'dn', 'coalescer filter inlet valve, open (SOP)'));
    o.push(
      `<g><title>coalescer filter (oil conditioner)</title><rect x="1420" y="740" width="64" height="100" rx="22" fill="url(#tomc)" ${OL}/>${[770, 790, 810].map(yy => `<line x1="1426" y1="${yy}" x2="1478" y2="${yy}" stroke="${S.ol}" stroke-opacity=".35"/>`).join('')}</g>` +
        T(1452, 732, 'COALESCER FILTER', 'to8', 'text-anchor="middle"')
    );
    o.push(valve(1452, 866, 1, 'V-LO1223 (NC) water drain', 'r', 'drain the accumulated water (SOP)'));
    o.push(`<line x1="1452" y1="840" x2="1452" y2="858" stroke="${S.m[1]}" stroke-width="3"/>`);
    pipe(
      [
        [1452, 740],
        [1452, 680],
        [1000, 680],
        [1000, TY]
      ],
      'l',
      5,
      'PU'
    );
    o.push(T(1060, 674, 'clean oil back to the tank', 'to8'));
    o.push(vbox(1150, 836, 'PI P-1941', 'kg/cm²', 'loPur') + T(1218, 849, 'local · SOP ~ 2.96', 'to8'));
    o.push(lamp(1500, 790, 'CCF', 'CONDITIONER COALESCER FILTER DP'));

    /* legend */
    o.push(
      `<rect x="24" y="868" width="18" height="5" fill="${S.med.l[0]}"/><rect x="140" y="868" width="18" height="5" fill="${S.med.c[0]}"/><rect x="272" y="868" width="18" height="5" fill="${S.med.t[0]}"/><rect x="380" y="868" width="18" height="5" fill="${S.med.w[0]}"/>` +
        T(46, 874, 'LUBE OIL', 'to8') +
        T(162, 874, 'CONTROL OIL', 'to8') +
        T(294, 874, 'TRIP OIL', 'to8') +
        T(402, 874, 'COOLING WATER', 'to8')
    );
    o.push(
      T(
        24,
        892,
        'SOP PR-OPE-5002 TURBINE CONTROL OIL · TCS I/O list (iolist-tcs) · DCS ABC-053 TICLO1002 · guide: snapshot 36.PNG',
        'to8'
      )
    );
    o.push(
      T(1744, 892, 'values: plant model (Plant model ON) · click a pump = TCS operation', 'to8', 'text-anchor="end"')
    );

    /* the TCS operation box of a pump (hidden; a click on a machine opens it) */
    const bx = 1400,
      by = 58;
    const bt = (i, op, l) =>
      `<g data-op="${op}" style="cursor:pointer"><rect x="${bx + 12 + i * 80}" y="${by + 64}" width="72" height="24" rx="3" fill="#1a232c" stroke="#55626f" data-ob="${op}"/>${T(bx + 48 + i * 80, by + 80, l, 'to9', 'text-anchor="middle" style="fill:#e2e8ee;font-weight:600"')}</g>`;
    o.push(
      `<g data-k="opbox" visibility="hidden"><rect x="${bx}" y="${by}" width="344" height="122" rx="4" fill="#0f1419" stroke="#6b7a88"/>` +
        T(bx + 12, by + 18, '-----', 'to11', 'data-k="obt"') +
        T(bx + 12, by + 32, '-----', 'to8', 'data-k="obs"') +
        T(bx + 12, by + 50, '-----', 'to9b', 'data-k="obst"') +
        `<g data-op="x" style="cursor:pointer"><rect x="${bx + 318}" y="${by + 6}" width="18" height="18" rx="2" fill="#1a232c" stroke="#55626f"/>${T(bx + 327, by + 19, '✕', 'to9', 'text-anchor="middle" style="fill:#e2e8ee"')}</g>` +
        bt(0, 'start', 'START') +
        bt(1, 'stop', 'STOP') +
        bt(2, 'auto', 'AUTO') +
        bt(3, 'man', 'MANUAL') +
        T(bx + 12, by + 108, '', 'to8', 'data-k="obm"') +
        `</g>`
    );

    const defs = `<defs><linearGradient id="tomt" x1="0" x2="1"><stop offset="0" stop-color="${S.m[0]}"/><stop offset=".45" stop-color="${S.m[1]}"/><stop offset="1" stop-color="${S.m[2]}"/></linearGradient>
<linearGradient id="tomv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.m[2]}"/><stop offset=".4" stop-color="${S.m[1]}"/><stop offset="1" stop-color="${S.m[0]}"/></linearGradient>
<linearGradient id="tomc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d98a3"/><stop offset=".45" stop-color="#c3ccd5"/><stop offset="1" stop-color="#6c7781"/></linearGradient>
<linearGradient id="tool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8843a"/><stop offset="1" stop-color="#4f3d17"/></linearGradient></defs>`;
    const UF = "font-family:Barlow,'IBM Plex Sans','Segoe UI',Roboto,Arial,sans-serif",
      MF = "font-family:'Roboto Mono','JetBrains Mono',Consolas,monospace";
    const css = `<style>.to8{font-size:8.5px;fill:${S.dim};${UF}}.to8b{font-size:8.5px;font-weight:600;fill:${S.none};${UF}}.to9{font-size:9.5px;fill:${S.dim};${UF}}.to9b{font-size:9.5px;font-weight:600;fill:${S.none};${UF}}.to11{font-size:11px;font-weight:600;fill:${S.nm};${UF}}
.tov{font-size:12px;fill:${S.none};${MF}}
.tofl{fill:none;stroke-dasharray:2 14;stroke-linecap:round;animation:tofl 1.4s linear infinite}@keyframes tofl{to{stroke-dashoffset:-32}}
.towv{animation:towv 3s ease-in-out infinite alternate}@keyframes towv{to{transform:translateX(-8px)}}
@media (prefers-reduced-motion:reduce){.tofl,.towv{animation:none}}</style>`;
    return css + defs + G.map(l => l.join('')).join('') + o.join('');
  }

  /* ---------- live links ---------- */
  function oil(g, api) {
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
    const V = {};
    const field = () => {
      try {
        return window.AN && AN.unit && AN.unit.on && AN.fieldState ? AN.fieldState() : null;
      } catch (e) {
        return null;
      }
    };
    /* the run state and mode of a machine: { run, au } (null = no plant model); the oil state of the unit model (tcs.js tcsOil) */
    const stOf = id => {
      const U = window.AN && AN.unit,
        M = MACH[id];
      if (!U || !U.on || !U.loMop) return null;
      if (M.field) {
        const f = field();
        return f ? { run: !!f.pur } : null;
      }
      if (M.k === 'vex') return { run: !!U.loVex };
      if (M.k === 'eop') return { run: !!U.loEopR };
      const m = /^(mop|cop)([AB])$/.exec(M.k),
        i = m[2] === 'A' ? 0 : 1,
        P = m[1] === 'mop' ? 'Mop' : 'Cop';
      return { run: !!U['lo' + P][i], au: !!U['lo' + P + 'Au'][i] };
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
    /* a status lamp: ok = normal (green square, text NORMAL), alarm (red, blinking text), null = no model */
    const lampSet = (k, ok, tOk, tAl) => {
      const r = q(`[data-lp="${k}"]`),
        t = q(`[data-lt="${k}"]`);
      const col = ok == null ? S.none : ok ? S.stop : S.run;
      if (r) r.setAttribute('fill', col);
      if (t) {
        t.textContent = ok == null ? '-----' : ok ? tOk || 'NORMAL' : tAl || 'ALARM';
        t.style.fill = col;
        t.classList.toggle('h2blink', ok === false);
      }
    };
    const ST = {};
    const tick = () => {
      const x = window.AN && AN.unit && AN.unit.on && AN.unit.loMop ? AN.unit : null;
      for (const id in MACH) {
        const s = stOf(id),
          key = s ? (s.run ? 1 : 0) + ':' + (s.au ? 1 : 0) : 'n';
        if (ST[id] === key) continue;
        ST[id] = key;
        const col = !s ? S.none : s.run ? S.run : S.stop;
        qa(`[data-lamp="${id}"]`).forEach(e => e.setAttribute('fill', col));
        qa(`[data-st="${id}"]`).forEach(e => {
          e.textContent = !s ? '-----' : s.run ? 'RUNNING' : 'STOPPED';
          e.style.fill = col;
        });
        if (MACH[id].ops)
          qa(`[data-md="${id}"]`).forEach(e => {
            e.textContent = !s ? '---' : s.au ? 'AUTO' : 'MANUAL';
            e.style.fill = !s ? S.none : s.au ? S.nm : S.warn;
          });
        setSpin(id, !!(s && s.run));
        flow(id, !!(s && s.run));
      }
      const run = id => ST[id] && ST[id][0] === '1';
      const lube = run('MA') || run('MB'),
        brg = lube || run('EO'),
        ctl = (run('CA') || run('CB')) && lube;
      flow('LUB', lube);
      flow('BRG', brg);
      flow('CSUC', ctl);
      flow('CTL', ctl);
      flow('TRP', ctl && V.loTrip > 1);
      flow('CW', V.MV != null && V.MV > 1);
      const tv = q('[data-vl="TCV"]');
      if (tv) tv.setAttribute('fill', V.MV == null ? S.none : V.MV > 1 ? S.run : S.stop);
      /* the switches of the TCS I/O list, from the model values */
      lampSet('PSL', x ? !(V.loBrg <= 1.05) : null, 'NORMAL', 'LOW');
      lampSet('LVL', x ? true : null, 'NORMAL (no high / low)');
      lampSet('DPF', x ? true : null, 'DP NORMAL');
      lampSet('DPC', x ? true : null, 'DP NORMAL');
      lampSet('CCF', x ? true : null, 'NORMAL', 'HIGH');
      ['A1', 'A2', 'B1', 'B2'].forEach(n => lampSet('MT' + n, x ? V.loRst === 1 : null, 'RESET', 'TRIP POSITION'));
      if (box.id) boxFill();
    };
    /* ---------- the TCS operation box ---------- */
    const box = { id: null, msg: '' };
    const boxEl = q('[data-k="opbox"]');
    const boxFill = () => {
      const M = MACH[box.id],
        s = stOf(box.id);
      q('[data-k="obt"]').textContent = (M.field ? 'FIELD (LOCAL PANEL) · ' : 'TCS OPERATION · ') + M.n + '  ' + M.t;
      q('[data-k="obs"]').textContent =
        M.d +
        (M.field ? ' · field operator at the local panel (SOP)' : M.ops ? ' · CRT: select, EXECUTE (SOP 2620)' : '');
      const st = q('[data-k="obst"]');
      st.textContent = !s
        ? 'no plant model: choose Cold or 150 MW (Plant model ON)'
        : (s.run ? 'RUNNING' : 'STOPPED') + (M.ops ? ' · ' + (s.au ? 'AUTO' : 'MANUAL') : '');
      st.style.fill = !s ? S.none : s.run ? S.run : S.stop;
      for (const op of ['auto', 'man']) {
        const b = q(`[data-op="${op}"]`);
        if (b) b.setAttribute('visibility', M.ops ? 'visible' : 'hidden');
      }
      const lit = { start: s && s.run, stop: s && !s.run, auto: s && s.au, man: s && M.ops && !s.au };
      for (const op in lit) {
        const r = q(`[data-ob="${op}"]`);
        if (r)
          r.setAttribute('stroke', lit[op] ? (op === 'start' ? S.run : op === 'stop' ? S.stop : '#e2e8ee') : '#55626f');
      }
      q('[data-k="obm"]').textContent = box.msg;
    };
    const boxOpen = id => {
      box.id = id;
      box.msg = '';
      boxEl.setAttribute('visibility', 'visible');
      boxFill();
    };
    const doOp = op => {
      if (op === 'x') {
        box.id = null;
        boxEl.setAttribute('visibility', 'hidden');
        return;
      }
      const M = MACH[box.id];
      if (!M) return;
      let r = '';
      try {
        if (!(window.AN && AN.unit && AN.unit.on)) r = 'walang plant model: piliin ang Cold o 150 MW (Plant model ON)';
        else if (M.field) r = AN.field && AN.field('pur', op === 'start') ? '' : 'oil purifier: walang plant model';
        else if (M.k === 'vex') r = AN.turbine('vex', op === 'start' ? 1 : 0) || '';
        else r = AN.turbine('oil', { p: M.k, op }) || '';
      } catch (e) {
        r = String(e && e.message ? e.message : e);
      }
      const L = { start: 'START', stop: 'STOP', auto: 'AUTO', man: 'MANUAL' }[op];
      box.msg = r ? '⚠ ' + r : M.n + ' ' + L + ': EXECUTED';
      if (!r && window.lsEventAdd)
        try {
          lsEventAdd(
            M.field ? 'FIELD' : 'TCS',
            M.field ? 'FIELD' : 'DCS',
            (M.field ? 'Field operator: ' : 'Operator (TCS): ') + M.n + ' ' + M.t + ' ' + L
          );
        } catch (e) {}
      tick();
      boxFill();
    };
    qa('[data-op]').forEach(b => b.addEventListener('click', e => (e.stopPropagation(), doOp(b.dataset.op))));
    boxEl.addEventListener('click', e => e.stopPropagation());
    tick();
    let seen = false;
    const iv = setInterval(() => (g.isConnected ? ((seen = true), tick()) : seen && clearInterval(iv)), 500);
    const HIT = {
      TK: 'T-1920 main oil tank · level switches LSH / LSL (TCS, MAIN OIL TANK LEVEL HIGH / LOW)',
      CLA: 'H-1921A lube oil cooler · outlet TE-LO1002-1 (DCS ABC-053)',
      CLB: 'H-1921B lube oil cooler · outlet TE-LO1002-2 (DCS ABC-053)',
      TCV: 'TCV-CW1201 lube oil temperature control valve · MV of TICLO1002 (ABC-053) (red = open, green = closed)',
      MTS: 'master trip solenoid valves A1 / A2 / B1 / B2 (TCS): TRIP POSITION while the turbine is not reset'
    };
    for (const id in MACH)
      qa(`[data-hit="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent =
          MACH[id].n +
          ' ' +
          MACH[id].t +
          ' · ' +
          MACH[id].d +
          ' (red = running, green = stopped) · click = ' +
          (MACH[id].field ? 'field operation (local panel)' : 'TCS operation');
        h.append(ti);
        h.addEventListener('click', e => (e.stopPropagation(), boxOpen(id)));
      });
    for (const id in HIT)
      qa(`[data-hit="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = HIT[id];
        h.append(ti);
        if (id === 'CLA' || id === 'CLB' || id === 'TCV')
          h.addEventListener(
            'click',
            e => (e.stopPropagation(), info(id === 'TCV' ? 'TICLO1002' : id === 'CLA' ? 'TE-LO1002-1' : 'TE-LO1002-2'))
          );
      });
    /* the values of the plant model (tcs.js TCS_OIL) */
    const UNIT = [
      'loPa',
      'loPb',
      'loEop',
      'loBrg',
      'loCa',
      'loCb',
      'loCtl',
      'loTrip',
      'loVac',
      'loPur',
      'loTin',
      'loTb3',
      'loTb4',
      'loRst',
      'rpm'
    ];
    const KEY = {
      PILO10031: 'loBrg',
      PILO10032: 'loBrg',
      PILO10033: 'loBrg',
      TIGE1007: 'loTb3',
      TIGE1008: 'loTb4',
      RPM: 'rpm'
    };
    const TCSIO = {
      PILO1922A: '1PTLO1922A',
      PILO1922B: '1PTLO1922B',
      loPa: '1PTLO1922A',
      loPb: '1PTLO1922B',
      loEop: '1PTLO1923',
      loCa: '1PTLO1931A',
      loCb: '1PTLO1931B',
      loCtl: '1PTLO10061 ~ 63',
      loTrip: '1PTLO10071 ~ 73',
      loBrg: '1PTLO10031 ~ 33',
      loTin: '1TELO1001',
      loTb3: '1TEGE1007',
      loTb4: '1TEGE1008',
      loVac: 'PGLO1920 local gauge (SOP)',
      loPur: 'local gauge of the purifier (SOP)',
      rpm: 'turbine speed (TCS)'
    };
    /* decimals: the low pressures 2, the control / trip oil and the temperatures 1, vacuum and speed 0 */
    const DP = {
      loCa: 1,
      loCb: 1,
      loCtl: 1,
      loTrip: 1,
      loTin: 1,
      TIGE1007: 1,
      TIGE1008: 1,
      'TE-LO1002-1': 1,
      'TE-LO1002-2': 1,
      loVac: 0,
      RPM: 0
    };
    const showV = (vk, v) =>
      qa(`[data-v="${vk}"]`).forEach(t => {
        const dp = vk in DP ? DP[vk] : 2;
        t.textContent = fmt(v, dp);
        t.setAttribute('fill', v == null ? S.none : S.val);
      });
    for (const k of UNIT)
      api.reg(
        { t: 'val', tag: 'UNIT.' + k, v: '' },
        X => {
          V[k] = X && isFinite(X.v) ? +X.v : null;
          showV(k, V[k]);
          for (const vk in KEY) if (KEY[vk] === k) showV(vk, V[k]);
        },
        null
      );
    /* the DCS loop TICLO1002 (ABC-053) and its transmitters TE-LO1002-1 / -2 (click = the faceplate / info card) */
    const K = s => q(`[data-k="${s}"]`);
    api.reg(
      { t: 'ctl', tag: 'TICLO1002' },
      X => {
        const ok = !!X,
          m = ok ? X.m : '';
        const [lab, col] =
          m === 'M' ? ['MAN', S.warn] : m === 'R' ? ['REM', '#7fb3e0'] : m === 'A' ? ['AUTO', S.nm] : ['---', S.none];
        K('cmode').textContent = lab;
        K('cmode').style.fill = col;
        K('cpill').setAttribute('stroke', col);
        K('cpv').textContent = ok ? fmt(X.pv, 1) : '-----';
        K('csv').textContent = ok ? fmt(X.sv, 1) : '-----';
        K('cmv').textContent = ok ? fmt(X.mv, 1) : '-----';
        for (const t of ['cpv', 'csv', 'cmv']) K(t).setAttribute('fill', ok ? S.val : S.none);
        V.MV = ok && isFinite(X.mv) ? +X.mv : null;
        K('cbar').setAttribute('width', V.MV == null ? 0 : (70 * Math.max(0, Math.min(100, V.MV))) / 100);
        tick();
      },
      q('[data-hit="TIC"]')
    );
    for (const io of ['TE-LO1002-1', 'TE-LO1002-2'])
      api.reg({ t: 'val', tag: io, v: '' }, X => showV(io, X && isFinite(X.v) ? +X.v : null), q(`[data-vb="${io}"]`));
    for (const k of Object.keys(TCSIO).concat(Object.keys(KEY))) {
      const b = q(`[data-vb="${k}"]`);
      if (!b || b.dataset.tt) continue;
      b.dataset.tt = 1;
      const ti = document.createElementNS(NS, 'title');
      ti.textContent = (TCSIO[k] || TCSIO[KEY[k]] || k) + ' · TCS signal (no DCS logic) · value: plant model';
      b.append(ti);
    }
    return pg;
  }
  PLANT_V2.screens.TO = oil;
  /* after MAKE-UP WATER (or 030 SEAWATER) in the list of the Plant view */
  const L = (window.PLANT_SYS = window.PLANT_SYS || []),
    i = Math.max(
      L.findIndex(x => x.id === 'MU'),
      L.findIndex(x => x.id === 'SW')
    );
  L.splice(i >= 0 ? i + 1 : L.length, 0, {
    fitAll: 1,
    id: 'TO',
    title: '036 TURBINE OIL',
    num: '036',
    name: 'TURBINE LUBE & CONTROL OIL SYSTEM',
    src: '36.PNG',
    w: 1920,
    h: 1000,
    v2: true,
    screen: 'TO',
    style: 'steel',
    items: []
  });
})();
