/* NEW PLANT HMI (2026-10-26, roadmap step 6, sample): the plant screens REDRAWN with our own vector graphics (user 2026-10-26:
   "new HMI using your own graphics, guide lang ang snapshots"). The control-room snapshots (document-references/hmi-snapshot-
   sample.zip) are only the guide for the system: equipment, flow paths, instruments.
   Art (6th pass, 2026-10-27, user: "yung cutaway muna gawin. temporary"): of three proposals (Steel, Cutaway, Thermal) the
   user picked CUTAWAY for now. Light engineering-illustration style: every vessel and duct is drawn in section, so the operator
   sees the process inside: air and gas particles moving in the ducts, solids rising in the furnace and spiralling down the
   cyclone, the water level in the drum, smoke at the stack, fans turning. Everything that moves follows the live signal: a
   fan turns only while its run bit is 1, the particles of a duct move only while its fan runs (no flow = an empty grey duct),
   damper blades turn with the real position. Values and faceplates are the same live links as before (click = faceplate).
   The flow (approved 2026-10-27) is unchanged. plant.js draws a system with `v2: true` through PLANT_V2.draw. */
(function () {
  const C = {
    bg: '#d5d9dc',
    frame: '#bfc5ca',
    ol: '#3a434c',
    text: '#1b2127',
    name: '#26303a',
    lab: '#45505b',
    dim: '#5f6a75',
    unit: '#5f6a75',
    val: '#0e1317',
    sv: '#34495e',
    none: '#8a949d',
    box: '#f5f7f8',
    boxs: '#8f9aa4',
    chip: '#eceff1',
    chipS: '#9ea8b1',
    track: '#c3cad0',
    bar: '#3d6589',
    rule: '#aab3bb',
    run: '#c62828',
    stop: '#2e7d32',
    alarm: '#c62828',
    warn: '#a14a06',
    cas: '#1a5aa0',
    aut: '#3f4a55',
    ok: '#167a3b',
    off: '#e2e5e8',
    nav: '#e4e7ea'
  };
  const NS = 'http://www.w3.org/2000/svg';
  const S_ = (t, a) => {
    const e = document.createElementNS(NS, t);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    return e;
  };
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  const UF = "Barlow, 'Segoe UI', Roboto, Arial, sans-serif",
    MF = "'Roboto Mono', 'JetBrains Mono', Consolas, monospace";
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  /* medium of a duct: inside colour and the colour of its particles */
  const FILL = { air: '#cfe0ee', hot: '#f5d7b0', gas: '#e8cdbf', gasm: '#e3d5cc', gasc: '#d8dadc', sol: '#c8b183' },
    DOT = { air: '#2c6aa0', hot: '#c2570c', gas: '#8a4a32', gasm: '#7a5546', gasc: '#5f6469', sol: '#7a5a22' };
  const DEFS = `
<linearGradient id="h2furIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4e7d6"/><stop offset="0.6" stop-color="#f6c98f"/><stop offset="1" stop-color="#ef8a3a"/></linearGradient>
<linearGradient id="h2wallX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d969e"/><stop offset="0.5" stop-color="#c3c9ce"/><stop offset="1" stop-color="#8d969e"/></linearGradient>
<linearGradient id="h2concX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a9adb0"/><stop offset="0.4" stop-color="#e3e5e6"/><stop offset="1" stop-color="#9da1a4"/></linearGradient>
<pattern id="h2hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#d9c3a5"/><line x1="0" y1="0" x2="0" y2="6" stroke="#a88a63" stroke-width="1.2"/></pattern>
<filter id="h2blur" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="h2lift" x="-0.1" y="-0.1" width="1.2" height="1.3"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#2a3138" flood-opacity="0.22"/></filter>
<style>.h2blink{animation:h2blink 1s steps(2,start) infinite}@keyframes h2blink{to{visibility:hidden}}
@media (prefers-reduced-motion:reduce){.h2blink{animation:none}}.h2btn:hover rect{fill:#d3d8dc}</style>`;

  /* ---------- geometry of the Air & Flue Gas screen (process area, drawn 24 px under the title and alarm bar) ---------- */
  const OY = 24;
  /* ducts; medium + the flow signal that moves them (fG IDF, fS SAF, fP PAF, fF FA air) */
  const DUCTS = [
    { m: 'gas', w: 18, f: 'G', pts: [[280, 150], [334, 150]] },
    { m: 'gas', w: 18, f: 'G', pts: [[365, 128], [365, 92], [610, 92], [610, 112]] },
    { m: 'gasm', w: 18, f: 'G', pts: [[610, 456], [610, 478], [880, 478], [880, 502]] },
    { m: 'gasc', w: 18, f: 'G', pts: [[880, 660], [880, 690], [946, 690]] },
    { m: 'gasc', w: 18, f: 'G', pts: [[1150, 690], [1212, 690]] },
    { m: 'gasc', w: 16, f: 'G', pts: [[1262, 672], [1300, 672]] },
    { m: 'sol', w: 6, f: 'P', pts: [[342, 430], [300, 430], [300, 470], [281, 470]] },
    { m: 'air', w: 5, f: 'F', pts: [[352, 470], [352, 456], [396, 456], [396, 470]] },
    { m: 'air', w: 5, f: 'F', pts: [[374, 456], [374, 444]] },
    { m: 'air', w: 12, f: 'S', pts: [[78, 760], [238, 760]] },
    { m: 'air', w: 12, f: 'P', pts: [[78, 840], [238, 840]] },
    { m: 'air', w: 12, f: 'S', pts: [[290, 742], [800, 742], [800, 640], [840, 640]] },
    { m: 'air', w: 12, f: 'P', pts: [[290, 822], [816, 822], [816, 616], [840, 616]] },
    { m: 'hot', w: 11, f: 'S', pts: [[840, 526], [281, 526]] },
    { m: 'hot', w: 11, f: 'P', pts: [[840, 552], [312, 552], [312, 670], [256, 670]] }
  ];
  const BANKS = [
    { n: 'REHEATER', x: 552, y: 146, w: 50, h: 82, hot: 1 },
    { n: 'FINISH SH', x: 618, y: 146, w: 50, h: 52, hot: 1 },
    { n: 'ECO #3', x: 618, y: 206, w: 50, h: 34 },
    { n: 'ECO #2R', x: 552, y: 248, w: 50, h: 44 },
    { n: 'ECO #2S', x: 618, y: 248, w: 50, h: 44 },
    { n: 'ECO #1', x: 552, y: 350, w: 116, h: 66 }
  ];
  /* fans: run state from the logic (memory list M.3302 PAF / M.3303 SAF / M.3304 IDF; FA blowers by their tag) */
  const FANS = [
    { tag: 'F-1054 SAF', name: 'SAF  F-1054', cx: 262, cy: 760, r: 24 },
    { tag: 'F-1053 PAF', name: 'PAF  F-1053', cx: 262, cy: 840, r: 24 },
    { tag: 'F-1056 IDF', name: 'IDF  F-1056', cx: 1238, cy: 690, r: 26, idf: 1 },
    { tag: 'F-1055A FA BLOWER-A', name: 'FAB-A', cx: 352, cy: 482, r: 11, small: 1 },
    { tag: 'F-1055B FA BLOWER-B', name: 'FAB-B', cx: 396, cy: 482, r: 11, small: 1 }
  ];
  const DAMPERS = [
    { tag: 'MCVFA10541', x: 170, y: 760, w: 12, ref: 'mv:FICFA1081', fp: 'FICFA1081', desc: 'SAF inlet flow control damper (MCV-FA1054-1)' },
    { tag: 'MCVFA10531', x: 170, y: 840, w: 12, ref: 'mv:FICFA1071', fp: 'FICFA1071', desc: 'PAF inlet flow control damper (MCV-FA1053-1)' },
    { tag: 'PCDFG10561', x: 1186, y: 690, w: 16, ref: 'mv:PICFG108A', fp: 'PICFG108A', desc: 'IDF inlet vane control damper (PCD-FG1056-1)' },
    { tag: 'HICHR1002A', x: 577, y: 320, len: 50, ref: 'mv:HICHR1002A', fp: 'HICHR1002A', desc: 'RH gas biasing damper', hor: 1 },
    { tag: 'HICHR1002B', x: 643, y: 320, len: 50, ref: 'mv:HICHR1002B', fp: 'HICHR1002B', desc: 'SH gas biasing damper', hor: 1 }
  ];
  /* measured values: x, y (top left), tag, unit, dp, group label, ref, description */
  const TAGS = [
    [30, 62, 'LICBR1001', 'mm', 1, 'DRUM LEVEL', 'pv:LICBR1001', 'Drum level (LICBR1001 PV, ABC-010)'],
    [30, 150, 'PIFG1085', 'mmH2O', 1, 'FURNACE PRESS', null, 'Furnace pressure (A)'],
    [30, 190, 'PIFG1086', 'mmH2O', 1, '', null, 'Furnace pressure (B)'],
    [30, 230, 'PIFG10871', 'mmH2O', 1, '', null, 'Furnace pressure (C)'],
    [30, 580, 'DPIFG1081', 'mmH2O', 0, 'BED DP', null, 'Furnace plenum / upper layer DP (A)'],
    [30, 620, 'DPIFG1082', 'mmH2O', 0, '', null, 'Furnace plenum / upper layer DP (B)'],
    [420, 404, 'FIFA1055', 'T/H', 1, 'FLUIDIZING AIR', null, 'FA blower outlet common air flow'],
    [700, 440, 'AIFG1122', '%', 1, 'O2 APH IN', null, 'APH inlet flue gas O2 (A)'],
    [774, 440, 'AIFG1123', '%', 1, '', null, 'APH inlet flue gas O2 (B)'],
    [70, 714, 'FIFA1081', 'T/H', 1, '', null, 'SAF inlet air flow'],
    [140, 714, 'TIFA1082', '°C', 0, '', null, 'SAF inlet air temperature'],
    [70, 794, 'FIFA1071', 'T/H', 1, '', null, 'PAF inlet air flow'],
    [140, 794, 'TIFA1072', '°C', 0, '', null, 'PAF inlet air temperature'],
    [560, 712, 'PIFA1085', 'mmH2O', 0, '', null, 'SAF outlet to APH air pressure'],
    [440, 494, 'PIFA1088', 'mmH2O', 0, '', null, 'APH outlet to furnace secondary air pressure'],
    [540, 494, 'TIFA1086', '°C', 0, '', null, 'APH outlet secondary air temp (A)'],
    [610, 494, 'TIFA1087', '°C', 0, '', null, 'APH outlet secondary air temp (B)'],
    [440, 566, 'FIFA1079', 'T/H', 1, '', null, 'APH outlet to furnace primary air flow'],
    [540, 566, 'TIFA1076', '°C', 0, '', null, 'APH outlet primary air temp (A)'],
    [610, 566, 'TIFA1077', '°C', 0, '', null, 'APH outlet primary air temp (B)'],
    [1196, 754, 'ZT-LO1756', '%', 1, 'HC SCOOP', 'ABC-008|AI0482', 'IDF hydraulic coupling scoop position (ZT-LO1756)']
  ];
  /* controllers on the mimic: x, y, tag, service, unit */
  const CHIPS = [
    [420, 296, 'FICFA1055A', 'FA blower A flow', 'T/H'],
    [420, 344, 'FICFA1055B', 'FA blower B flow', 'T/H'],
    [700, 262, 'HICHR1002A', 'RH gas biasing damper', '%'],
    [700, 308, 'HICHR1002B', 'SH gas biasing damper', '%'],
    [700, 354, 'AICFG112', 'O2 trim (air demand bias)', '%'],
    [420, 690, 'FICFA1081', 'Secondary air flow / SAF inlet damper', 'T/H'],
    [420, 770, 'FICFA1071', 'Primary air flow / PAF inlet damper', 'T/H'],
    [1130, 598, 'PICFG108A', 'Furnace pressure / IDF inlet vane', 'mmH2O'],
    [1176, 790, 'PICFG108', 'Furnace pressure / IDF hydraulic coupling', 'mmH2O']
  ];
  const NOTES = [
    [760, 518, 'HOT SA → FURNACE WALLS'],
    [760, 572, 'HOT PA → PLENUM'],
    [700, 734, 'COLD SA'],
    [700, 814, 'COLD PA'],
    [470, 80, 'FLUE GAS']
  ];

  /* ---------- drawing helpers (SVG text) ---------- */
  const legs = p => p.slice(1).map((b, i) => [p[i], b]);
  const pathD = p => 'M' + p.map(q => q[0] + ' ' + q[1]).join(' L');
  const plen = p => legs(p).reduce((s, [a, b]) => s + Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]), 0);
  const T = (x, y, s, o) => {
    o = o || {};
    return `<text x="${x}" y="${y}" font-family="${o.mono ? MF : UF}" font-size="${o.z || 10}"${o.b ? ` font-weight="${o.b === 1 ? 600 : o.b}"` : ''} fill="${o.c || C.text}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.k ? ` data-k="${o.k}"` : ''}>${esc(s)}</text>`;
  };
  const R = (x, y, w, h, f, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${o == null ? ` stroke="${C.ol}" stroke-width="1.4"` : o}/>`;
  const NAME = (x, y, s, a) => T(x, y, s, { z: 10, b: 700, c: C.name, a: a || 'middle', ls: 0.6 });
  function legRects(d, pad) {
    const n = d.pts.length - 1,
      w = d.w + pad * 2;
    return legs(d.pts).map(([a, b], i) => {
      const e0 = i > 0 ? d.w / 2 + pad : 0,
        e1 = i < n - 1 ? d.w / 2 + pad : 0;
      if (a[1] === b[1]) {
        const lo = a[0] < b[0],
          x0 = Math.min(a[0], b[0]) - (lo ? e0 : e1),
          x1 = Math.max(a[0], b[0]) + (lo ? e1 : e0);
        return [x0, a[1] - w / 2, x1 - x0, w];
      }
      const lo = a[1] < b[1],
        y0 = Math.min(a[1], b[1]) - (lo ? e0 : e1),
        y1 = Math.max(a[1], b[1]) + (lo ? e1 : e0);
      return [a[0] - w / 2, y0, w, y1 - y0];
    });
  }
  /* duct in section: dark wall, the medium inside (data-in: grey while there is no flow) */
  function duct(d, i) {
    let s = '';
    for (const [x, y, w, h] of legRects(d, 1.4)) s += R(x, y, w, h, C.ol, '');
    for (const [x, y, w, h] of legRects(d, 0)) s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${FILL[d.m]}" data-in="${i}" data-c="${FILL[d.m]}"/>`;
    return s;
  }
  /* particles moving with the medium (hidden while its fan is stopped) */
  function particles(d, i) {
    const L = plen(d.pts),
      sp = d.m === 'sol' ? 40 : 90,
      n = Math.max(2, Math.round(L / (d.w > 8 ? 26 : 18))),
      dur = L / sp,
      r = d.w > 14 ? 2 : d.w > 8 ? 1.7 : 1.2,
      hor = d.pts[0][1] === d.pts[1][1],
      off = d.w > 10 ? [-d.w * 0.22, d.w * 0.22] : [0];
    let s = `<g data-pg="${i}">`;
    off.forEach((o, k) => {
      for (let j = 0; j < n; j++)
        s += `<circle r="${r}" fill="${DOT[d.m]}" opacity="0.8" transform="translate(${hor ? '0 ' + o : o + ' 0'})"><animateMotion dur="${dur.toFixed(2)}s" repeatCount="indefinite" begin="-${((dur * (j + k * 0.5)) / n).toFixed(2)}s" path="${pathD(d.pts)}"/></circle>`;
    });
    return s + '</g>';
  }
  function drum() {
    const x = 150,
      y = 64,
      w = 142,
      h = 26;
    let s = '';
    for (const xx of [194, 221, 248]) s += R(xx - 3, y + h, 6, 120 - y - h, '#cfe0ee');
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#f1f3f4" stroke="${C.ol}" stroke-width="1.6" filter="url(#h2lift)"/>`;
    s += `<clipPath id="h2dc"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/></clipPath>`;
    s += `<g clip-path="url(#h2dc)"><g data-k="lvl"><path fill="#7fb0d8" d="M${x - 20} ${y + 13} q10 -2 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V${y + 40} H${x - 20} Z"><animateTransform attributeName="transform" type="translate" values="0 0;20 0" dur="2s" repeatCount="indefinite"/></path></g></g>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="none" stroke="${C.ol}" stroke-width="1.6"/>`;
    return s + NAME(221, 58, 'DRUM');
  }
  function furnace() {
    const x = 160,
      y = 120,
      w = 120,
      h = 480;
    let s = `<path d="M${x} ${y + h} L190 650 L250 650 L${x + w} ${y + h} Z" fill="url(#h2hatch)" stroke="${C.ol}" stroke-width="1.4"/>`;
    s += '<path d="M168 600 L194 642 L246 642 L272 600 Z" fill="#e6dccf"/><path data-k="heat0" d="M168 600 L194 642 L246 642 L272 600 Z" fill="#f08a3a"/>';
    s += R(185, 650, 70, 40, '#f5d7b0');
    for (let i = 0; i < 6; i++) s += `<path d="M${194 + i * 10.4} 650 v-6 m-2 0 h4" stroke="${C.ol}" stroke-width="1.2" fill="none"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#h2wallX)" stroke="${C.ol}" stroke-width="1.4" filter="url(#h2lift)"/>`;
    /* the fire and the hot bed fade with the live bed temperature (cold plant = a grey empty furnace) */
    s += R(x + 5, y + 5, w - 10, h, '#ece8e3', '') + '<g data-k="heat">' + R(x + 5, y + 5, w - 10, h, 'url(#h2furIn)', '');
    s += '<path d="M165 560 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 V600 H165 Z" fill="#ea7a2c"><animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="0.9s" repeatCount="indefinite"/></path>';
    s += R(165, 568, 110, 32, '#e5702a', '');
    s += '</g>';
    /* circulating solids rising through the furnace (move while the PA fan fluidizes the bed) */
    s += '<g data-k="solids">';
    for (let i = 0; i < 34; i++) {
      const cx = 172 + ((i * 29) % 96),
        d = 3 + (i % 5) * 0.6,
        y0 = 570 - (i % 3) * 10,
        b = ((i * 0.37) % d).toFixed(2);
      s += `<circle cx="${cx}" cy="${y0}" r="${1.3 + (i % 3) * 0.5}" fill="#b4531a" opacity="0.75"><animate attributeName="cy" values="${y0};${130 + (i % 4) * 8}" dur="${d.toFixed(1)}s" begin="-${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.85;0.5;0" dur="${d.toFixed(1)}s" begin="-${b}s" repeatCount="indefinite"/></circle>`;
    }
    s += '</g>';
    s += T(220, 142, 'FURNACE', { z: 10, b: 700, c: C.name, a: 'middle', ls: 0.8 }) + T(220, 155, 'CFB combustor', { z: 8.5, c: C.dim, a: 'middle' });
    s += T(220, 590, 'BED  ----- °C', { z: 8.5, b: 700, c: '#fff', a: 'middle', ls: 0.4, k: 'bedavg' });
    return s + NAME(220, 706, 'PLENUM');
  }
  function cyclone() {
    const out = 'M334 128 H398 V240 L376 338 H356 L334 240 Z';
    let s = R(356, 116, 18, 30, '#e8cdbf');
    s += `<path d="${out}" fill="#efe4d8" stroke="${C.ol}" stroke-width="1.6" filter="url(#h2lift)"/>`;
    s += R(356, 128, 18, 34, '#e8cdbf') + R(360, 338, 12, 66, '#d8c19a');
    let sp = 'M340 150';
    for (let k = 0; k < 8; k++) {
      const y = 150 + k * 22,
        wl = k < 5 ? 26 : 26 - (k - 4) * 6;
      sp += ` Q366 ${y + 6} ${366 + wl} ${y + 11} Q366 ${y + 16} ${366 - wl} ${y + 22}`;
    }
    sp += ' L366 336 L366 400';
    s += '<g data-k="vortex">';
    for (let i = 0; i < 12; i++) s += `<circle r="1.6" fill="#8a5a2a"><animateMotion dur="4s" begin="-${(i / 3).toFixed(2)}s" repeatCount="indefinite" path="${sp}"/></circle>`;
    s += '</g>';
    /* loop seal with the fluidized solids */
    s += R(340, 404, 60, 40, '#e9dcc6') + R(342, 424, 56, 18, '#c8a56b', '');
    for (let i = 0; i < 8; i++) s += `<circle cx="${346 + i * 7}" cy="434" r="1.4" fill="#7a5a22"><animate attributeName="cy" values="436;429;436" dur="${(0.6 + (i % 3) * 0.2).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
    return s + NAME(448, 190, 'CYCLONE A / B') + T(336, 416, 'LOOP SEAL', { z: 8.5, b: 700, c: C.name, a: 'end', ls: 0.4 });
  }
  function backpass() {
    let s = `<path d="M540 434 L596 456 H624 L680 434 Z" fill="#e3d5cc" stroke="${C.ol}" stroke-width="1.4"/>`;
    s += `<rect x="540" y="112" width="140" height="322" fill="url(#h2wallX)" stroke="${C.ol}" stroke-width="1.4" filter="url(#h2lift)"/>`;
    s += R(545, 117, 130, 317, '#efe6e0', '') + R(608, 122, 4, 196, '#9aa3ab', '');
    for (const b of BANKS) {
      let d = '';
      const n = Math.floor((b.h - 4) / 5);
      for (let i = 0; i < n; i++) {
        const yy = b.y + 3 + i * 5;
        d += (i ? ' L' : 'M') + (i % 2 ? b.x + b.w - 3 : b.x + 3) + ' ' + yy + ' L' + (i % 2 ? b.x + 3 : b.x + b.w - 3) + ' ' + yy;
      }
      s += T(b.x + b.w / 2, b.y - 3, b.n, { z: 7.5, b: 600, c: C.dim, a: 'middle', ls: 0.3 });
      s += `<path d="${d}" fill="none" stroke="${b.hot ? '#b4532a' : '#3d6f9e'}" stroke-width="1.5" stroke-linejoin="round"/>`;
    }
    s += '<g data-k="bpgas">';
    for (let i = 0; i < 16; i++) s += `<circle cx="${552 + ((i * 23) % 116)}" r="1.5" fill="#8a4a32" opacity="0.6"><animate attributeName="cy" values="120;440" dur="${(3.2 + (i % 4) * 0.4).toFixed(1)}s" begin="-${(i * 0.4).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
    return s + '</g>' + NAME(505, 124, 'BACKPASS');
  }
  function aph() {
    const x = 840,
      y = 502,
      w = 80,
      h = 158;
    let s = `<path d="M836 502 H924 L918 494 H842 Z" fill="#e3d5cc" stroke="${C.ol}" stroke-width="1.4"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#h2wallX)" stroke="${C.ol}" stroke-width="1.4" filter="url(#h2lift)"/>`;
    s += R(x + 5, y + 5, w - 10, h - 10, '#eef1f3', '');
    for (let xx = x + 10; xx < x + w - 6; xx += 5) s += `<line x1="${xx}" y1="${y + 8}" x2="${xx}" y2="${y + h - 8}" stroke="#9c8a80" stroke-width="1.3"/>`;
    for (const yy of [532, 584, 628]) s += `<line x1="${x + 5}" y1="${yy}" x2="${x + w - 22}" y2="${yy}" stroke="${C.ol}" stroke-width="1.6"/>`;
    return s + NAME(978, 556, 'AIR HEATER') + T(978, 569, 'H-1052  tubular', { z: 8.5, c: C.dim, a: 'middle' });
  }
  function esp() {
    let s = '';
    for (let i = 0; i < 3; i++) {
      const x = 980 + i * 52;
      s += `<path d="M${x} 740 H${x + 40} L${x + 24} 772 H${x + 16} Z" fill="#d8dadc" stroke="${C.ol}" stroke-width="1.4"/><path d="M${x + 8} 748 H${x + 32} L${x + 22} 768 H${x + 18} Z" fill="#9a9184"/>` + R(x + 10, 628, 20, 12, '#eceff1');
    }
    s += `<path d="M946 681 L966 640 V740 L946 699 Z" fill="#d8dadc" stroke="${C.ol}" stroke-width="1.4"/><path d="M1150 681 L1130 640 V740 L1150 699 Z" fill="#d8dadc" stroke="${C.ol}" stroke-width="1.4"/>`;
    s += `<rect x="966" y="640" width="164" height="100" fill="#f0f2f3" stroke="${C.ol}" stroke-width="1.4" filter="url(#h2lift)"/>`;
    for (let x = 974; x < 1126; x += 8) s += `<line x1="${x}" y1="646" x2="${x}" y2="734" stroke="${x % 16 ? '#7f8a94' : '#c0c7cd'}" stroke-width="${x % 16 ? 0.8 : 1.6}"/>`;
    for (const x of [1018, 1070]) s += `<line x1="${x}" y1="640" x2="${x}" y2="740" stroke="${C.ol}" stroke-width="1.4"/>`;
    return s + NAME(1048, 790, 'ESP  Z-1010');
  }
  function stack() {
    let s = `<path d="M1300 760 L1308 228 H1336 L1344 760 Z" fill="url(#h2concX)" stroke="${C.ol}" stroke-width="1.4" filter="url(#h2lift)"/><g data-k="smoke">`;
    for (let i = 0; i < 5; i++)
      s += `<circle cx="1322" cy="226" r="6" fill="#9aa1a7" opacity="0" filter="url(#h2blur)"><animate attributeName="cy" values="226;140" dur="5s" begin="-${i}s" repeatCount="indefinite"/><animate attributeName="r" values="5;20" dur="5s" begin="-${i}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.45;0" dur="5s" begin="-${i}s" repeatCount="indefinite"/><animate attributeName="cx" values="1322;1340" dur="5s" begin="-${i}s" repeatCount="indefinite"/></circle>`;
    return s + '</g>' + NAME(1322, 778, 'STACK');
  }
  function intake(x, y) {
    let s = R(x - 8, y - 15, 22, 30, '#eceff1');
    for (let i = 0; i < 5; i++) s += `<line x1="${x - 6}" y1="${y - 11 + i * 6}" x2="${x + 12}" y2="${y - 8 + i * 6}" stroke="${C.ol}" stroke-width="1.2"/>`;
    return s + T(x + 3, y + 26, 'ATM', { z: 8, c: C.dim, a: 'middle' });
  }
  /* fan: volute in section, the impeller turns while the run bit is 1; motor with the state (red running, green stopped) */
  function fan(f, i) {
    const { cx, cy, r } = f;
    let s = '';
    if (!f.small) s += R(cx, cy - r, (f.idf ? 1262 : 290) - cx, f.idf ? 16 : 12, '#f1f3f4');
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f1f3f4" stroke="${C.ol}" stroke-width="1.6" filter="url(#h2lift)" data-fan="${i}"/>`;
    let bl = '';
    for (let k = 0; k < 10; k++) {
      const a = (k * Math.PI) / 5;
      bl += `M${(cx + Math.cos(a) * r * 0.25).toFixed(1)} ${(cy + Math.sin(a) * r * 0.25).toFixed(1)} L${(cx + Math.cos(a + 0.45) * r * 0.78).toFixed(1)} ${(cy + Math.sin(a + 0.45) * r * 0.78).toFixed(1)} `;
    }
    s += `<g data-imp="${i}"><circle cx="${cx}" cy="${cy}" r="${r * 0.8}" fill="none" stroke="#7d8790" stroke-width="0.8"/><path d="${bl}" stroke="${C.ol}" stroke-width="${f.small ? 1 : 1.6}" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="${r * 0.22}" fill="${C.ol}"/></g>`;
    if (f.small) return s + `<circle cx="${cx}" cy="${cy + r + 6}" r="2.6" fill="${C.none}" data-mot="${i}"/>` + T(cx, cy + r + 18, f.name, { z: 8, b: 700, c: C.name, a: 'middle' });
    let mx, my;
    if (f.idf) {
      mx = cx - 12;
      my = cy + r + 8;
      s += R(cx - 7, cy + r + 1, 14, 6, '#e4e7ea', ` stroke="${C.ol}" stroke-width="1"`) + T(cx + 10, cy + r + 7, 'HC', { z: 7, b: 700, c: C.dim });
    } else {
      mx = cx + r + 6;
      my = cy + 4;
      s += `<line x1="${cx + r}" y1="${cy + 10}" x2="${mx}" y2="${cy + 10}" stroke="${C.ol}" stroke-width="2"/>`;
    }
    s += `<rect x="${mx}" y="${my}" width="24" height="13" rx="2" fill="#e4e7ea" stroke="${C.ol}" stroke-width="1.2"/>`;
    s += `<rect x="${mx + 2}" y="${my + 2}" width="20" height="9" rx="1" fill="${C.none}" data-mot="${i}"/>` + T(mx + 12, my + 9.5, 'M', { z: 7.5, b: 700, c: '#fff', a: 'middle' });
    return s + (f.idf ? T(cx, cy - r - 8, f.name, { z: 9.5, b: 700, c: C.name, a: 'middle', ls: 0.4 }) : T(mx + 30, my + 10, f.name, { z: 9.5, b: 700, c: C.name, ls: 0.4 }));
  }
  /* damper: blades turned by the real position (across the flow = closed, along = open); click = its controller's faceplate */
  function damper(d, i) {
    let s = `<g data-dmp="${i}" style="cursor:pointer">`;
    if (d.hor) {
      s += `<rect x="${d.x - d.len / 2}" y="${d.y - 8}" width="${d.len}" height="16" fill="#000" fill-opacity="0"/>`;
      for (let k = 0; k < 4; k++) {
        const bx = d.x - d.len / 2 + 6.5 + k * 12.3;
        s += `<line x1="${bx - 5}" y1="${d.y}" x2="${bx + 5}" y2="${d.y}" stroke="#1b2127" stroke-width="2" stroke-linecap="round" data-bl="${bx} ${d.y} h"/><circle cx="${bx}" cy="${d.y}" r="1.2" fill="#fff"/>`;
      }
    } else {
      const w = d.w;
      s += `<rect x="${d.x - 8}" y="${d.y - w / 2 - 16}" width="16" height="${w + 18}" fill="#000" fill-opacity="0"/>`;
      s += `<line x1="${d.x}" y1="${d.y - w / 2}" x2="${d.x}" y2="${d.y + w / 2}" stroke="#1b2127" stroke-width="2.2" stroke-linecap="round" data-bl="${d.x} ${d.y} v"/><circle cx="${d.x}" cy="${d.y}" r="1.5" fill="#fff" stroke="#1b2127" stroke-width="0.8"/>`;
      s += `<line x1="${d.x}" y1="${d.y - w / 2 - 1}" x2="${d.x}" y2="${d.y - w / 2 - 8}" stroke="${C.ol}" stroke-width="1.2"/>` + R(d.x - 6, d.y - w / 2 - 15, 12, 7, '#e4e7ea', ` stroke="${C.ol}" stroke-width="1"`);
      s += `<text x="${d.x}" y="${d.y + w / 2 + 13}" font-family="${MF}" font-size="9" fill="${C.none}" text-anchor="middle" data-dv="${i}">-----</text>`;
    }
    return s + `<title>${esc(d.tag + ' · ' + d.desc + ' · click: faceplate of ' + d.fp)}</title></g>`;
  }
  function tagBox(t, i) {
    const [x, y, tag, u, , label, , desc] = t;
    let s = label ? T(x, y - 6, label, { z: 8.5, b: 700, c: C.lab, ls: 0.5 }) : '';
    s += T(x, y + 7, tag, { z: 8.5, c: C.dim });
    s += `<rect x="${x}" y="${y + 10}" width="52" height="16" rx="3" fill="${C.box}" stroke="${C.boxs}" stroke-width="0.8" data-vb="${i}"><title>${esc(tag + ' · ' + desc)}</title></rect>`;
    s += `<text x="${x + 48}" y="${y + 22}" font-family="${MF}" font-size="11" fill="${C.none}" text-anchor="end" data-vt="${i}">-----</text>`;
    return s + T(x + 55, y + 22, u, { z: 8.5, c: C.unit });
  }
  function chip(c, i) {
    const [x, y, tag, svc] = c,
      w = 116;
    let s = `<g class="chip" style="cursor:pointer"><rect x="${x}" y="${y}" width="${w}" height="44" rx="3" fill="${C.chip}" stroke="${C.chipS}" stroke-width="0.8" data-cr="${i}"><title>${esc(tag + ' · ' + svc + ' · click: faceplate (A / M / R, SV, MV)')}</title></rect>`;
    s += T(x + 6, y + 12, tag, { z: 9.5, b: 600 });
    s += T(x + w - 18.5, y + 11.5, '---', { z: 7.5, b: 700, c: C.none, a: 'middle', ls: 0.4, k: 'cm' + i });
    s += `<rect x="${x + w - 32}" y="${y + 3}" width="27" height="11" rx="5.5" fill="none" stroke="${C.none}" stroke-width="0.9" data-cp="${i}"/>`;
    s += T(x + 6, y + 26, 'PV', { z: 7.5, c: C.dim }) + `<text x="${x + 54}" y="${y + 26}" font-family="${MF}" font-size="10.5" fill="${C.none}" text-anchor="end" data-k="cpv${i}">-----</text>`;
    s += T(x + 60, y + 26, 'SV', { z: 7.5, c: C.dim }) + `<text x="${x + w - 6}" y="${y + 26}" font-family="${MF}" font-size="10.5" fill="${C.none}" text-anchor="end" data-k="csv${i}">-----</text>`;
    s += T(x + 6, y + 39, 'MV', { z: 7.5, c: C.dim }) + R(x + 22, y + 34, 44, 4, C.track, '') + `<rect x="${x + 22}" y="${y + 34}" width="0" height="4" fill="${C.bar}" data-k="cbar${i}"/>`;
    s += `<text x="${x + w - 14}" y="${y + 39.5}" font-family="${MF}" font-size="10" fill="${C.none}" text-anchor="end" data-k="cmv${i}">-----</text>` + T(x + w - 12, y + 39.5, '%', { z: 7.5, c: C.unit });
    return s + '</g>';
  }
  /* side panel: combustion summary, bed temperature bars (18 TE), fan states, alarms */
  const PROWS = [
    ['Total air flow', 'ABC-006|SUM out', 1, 'T/H'],
    ['Coal flow', 'pv:FIC-CM', 1, 'T/H'],
    ['PA flow', 'pv:FICFA1071', 1, 'T/H'],
    ['SA flow', 'pv:FICFA1081', 1, 'T/H'],
    ['Furnace press', 'pv:PICFG108', 1, 'mmH2O'],
    ['O2 (APH inlet)', 'pv:AICFG112', 1, '%']
  ];
  function panel() {
    const x = 1380,
      w = 206;
    let y = 52,
      s = '';
    const head = t => {
      s += T(x, y + 10, t, { z: 9, b: 700, c: C.lab, ls: 0.8 }) + `<line x1="${x}" y1="${y + 16}" x2="${x + w}" y2="${y + 16}" stroke="${C.rule}" stroke-width="0.8"/>`;
      y += 26;
    };
    const num = (k, xx, yy, z) => `<text x="${xx}" y="${yy}" font-family="${MF}" font-size="${z}" fill="${C.none}" text-anchor="end" data-k="${k}">-----</text>`;
    head('COMBUSTION');
    PROWS.forEach((p, i) => {
      s += `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="17" fill="#000" fill-opacity="0" data-pr="${i}"><title>${esc(p[0] + ' (' + p[1] + ')')}</title></rect>`;
      s += T(x, y + 10, p[0], { z: 9.5, c: C.lab }) + num('pv' + i, x + w - 40, y + 10.5, 11.5) + T(x + w - 36, y + 10, p[3], { z: 8.5, c: C.unit });
      y += 19;
    });
    s += T(x, y + 10, 'Air / coal ratio', { z: 9.5, c: C.lab }) + num('ratio', x + w - 40, y + 10.5, 11.5);
    y += 19;
    s += T(x, y + 10, 'MFT', { z: 9.5, c: C.lab }) + `<rect x="${x + w - 58}" y="${y}" width="58" height="14" rx="7" fill="none" stroke="${C.none}" stroke-width="0.9" data-k="mftr"><title>MFT (ABC-007 M.0182)</title></rect>` + T(x + w - 29, y + 10, '-----', { z: 8, b: 700, c: C.none, a: 'middle', ls: 0.5, k: 'mftt' });
    y += 30;
    head('BED TEMPERATURE  °C');
    const cw = w / 9;
    'ABCDEFGHI'.split('').forEach((c, i) => {
      const cx = x + i * cw + cw / 2;
      s += `<rect x="${cx - 5}" y="${y + 56}" width="4.5" height="0" fill="#ea580c" data-k="bu${i}"><title>TIFG1091${c} bed temperature (upper)</title></rect>`;
      s += `<rect x="${cx + 0.5}" y="${y + 56}" width="4.5" height="0" fill="#f59e0b" data-k="bl${i}"><title>TIFG1090${c} bed temperature (lower)</title></rect>`;
      s += T(cx, y + 68, c, { z: 8.5, c: C.dim, a: 'middle' });
      s += `<text x="${cx}" y="${y + 81}" font-family="${MF}" font-size="8.5" fill="${C.none}" text-anchor="middle" data-k="tu${i}">---</text><text x="${cx}" y="${y + 92}" font-family="${MF}" font-size="8.5" fill="${C.none}" text-anchor="middle" data-k="tl${i}">---</text>`;
    });
    s += `<line x1="${x}" y1="${y + 56.5}" x2="${x + w}" y2="${y + 56.5}" stroke="${C.rule}" stroke-width="0.8"/>` + T(x + w, y + 4, 'upper / lower  (bar 850 ~ 1000)', { z: 8, c: C.dim, a: 'end' });
    s += T(x, y + 112, 'AVG', { z: 8.5, c: C.dim }) + num('bavg', x + 52, y + 112, 10.5) + T(x + 72, y + 112, 'MAX', { z: 8.5, c: C.dim }) + num('bmax', x + 124, y + 112, 10.5) + T(x + 144, y + 112, 'MIN', { z: 8.5, c: C.dim }) + num('bmin', x + 196, y + 112, 10.5);
    y += 132;
    head('FANS');
    FANS.forEach((f, i) => {
      s += T(x, y + 10, f.small ? f.name + '  ' + f.tag.split(' ')[0] : f.name, { z: 9.5, c: C.lab }) + `<circle cx="${x + w - 54}" cy="${y + 7}" r="3.5" fill="${C.none}" data-k="fd${i}"/>` + T(x + w, y + 10, '-----', { z: 8.5, b: 700, c: C.none, a: 'end', ls: 0.4, k: 'ft' + i });
      y += 19;
    });
    y += 10;
    head('ALARMS');
    s += T(x, y + 8, 'No active alarm', { z: 9.5, c: C.dim, k: 'alist' });
    return s;
  }
  function art() {
    let s = '';
    DUCTS.forEach((d, i) => (s += duct(d, i)));
    s += drum() + furnace() + cyclone() + backpass() + aph() + esp() + stack() + intake(48, 760) + intake(48, 840);
    FANS.forEach((f, i) => (s += fan(f, i)));
    DAMPERS.forEach((d, i) => (s += damper(d, i)));
    DUCTS.forEach((d, i) => (s += particles(d, i)));
    NOTES.forEach(n => (s += T(n[0], n[1], n[2], { z: 8.5, c: C.dim, a: 'middle', ls: 0.4 })));
    TAGS.forEach((t, i) => (s += tagBox(t, i)));
    CHIPS.forEach((c, i) => (s += chip(c, i)));
    return s + panel();
  }

  /* ---------- live links ---------- */
  function airFlueGas(g, api) {
    const pg = S_('g', { transform: `translate(0 ${OY})` });
    pg.innerHTML = art();
    g.append(pg);
    const q = s => pg.querySelector(s),
      K = k => q(`[data-k="${k}"]`);
    const live = (ref, tag, set, hit) => api.reg({ t: 'val', tag: tag || '', ref, v: '' }, X => set(X && isFinite(X.v) ? +X.v : null), hit || null);
    /* flows: a duct moves while its fan runs (no signal = shown moving, like the logic default) */
    const FL = { G: 'ABC-008|M.3304', S: 'ABC-007|M.3303', P: 'ABC-007|M.3302' };
    const flowOn = {},
      vis = (el, on) => el && el.setAttribute('visibility', on ? 'visible' : 'hidden');
    const applyFlow = k => {
      const on = flowOn[k] !== false;
      DUCTS.forEach((d, i) => {
        if (d.f !== k) return;
        vis(q(`[data-pg="${i}"]`), on);
        pg.querySelectorAll(`[data-in="${i}"]`).forEach(r => r.setAttribute('fill', on ? r.dataset.c : C.off));
      });
      if (k === 'P') {
        vis(K('solids'), on);
        vis(K('vortex'), on);
      }
      if (k === 'G') {
        vis(K('smoke'), on);
        vis(K('bpgas'), on);
      }
    };
    for (const k of ['G', 'S', 'P']) live(FL[k], '', v => ((flowOn[k] = v == null ? true : v > 0.5), applyFlow(k)));
    live('', 'FIFA1055', v => ((flowOn.F = v == null ? true : v > 1), applyFlow('F')));
    /* fans */
    const fanSt = [];
    FANS.forEach((f, i) => {
      const imp = q(`[data-imp="${i}"]`),
        mot = q(`[data-mot="${i}"]`);
      let anim = null;
      api.reg(
        { t: 'fan', tag: f.tag },
        X => {
          const ok = X && isFinite(X.v),
            on = ok && X.v > 0.5;
          mot.setAttribute('fill', !ok ? C.none : on ? C.run : C.stop);
          if (on && !anim) {
            anim = S_('animateTransform', { attributeName: 'transform', type: 'rotate', from: `0 ${f.cx} ${f.cy}`, to: `360 ${f.cx} ${f.cy}`, dur: f.small ? '0.6s' : '1s', repeatCount: 'indefinite' });
            imp.append(anim);
            try {
              anim.beginElement();
            } catch (e) {}
          } else if (!on && anim) {
            anim.remove();
            anim = null;
            imp.removeAttribute('transform');
          }
          fanSt[i] = !ok ? null : on;
          const d = K('fd' + i),
            t = K('ft' + i);
          d.setAttribute('fill', !ok ? C.none : on ? C.run : C.stop);
          t.textContent = !ok ? '-----' : on ? 'RUNNING' : 'STOPPED';
          t.setAttribute('fill', !ok ? C.none : on ? C.run : C.stop);
        },
        q(`[data-fan="${i}"]`)
      );
      const ti = S_('title', {});
      ti.textContent = f.name + ' · run state from the DCS logic (motor: red = running, green = stopped)';
      q(`[data-fan="${i}"]`).append(ti);
    });
    /* dampers */
    DAMPERS.forEach((d, i) => {
      const gg = q(`[data-dmp="${i}"]`),
        bls = [...gg.querySelectorAll('[data-bl]')],
        dv = q(`[data-dv="${i}"]`);
      api.reg(
        { t: 'damper', tag: d.tag, ref: d.ref, v: '' },
        X => {
          const ok = X && isFinite(X.v),
            p = ok ? Math.max(0, Math.min(100, +X.v)) : 0;
          for (const b of bls) {
            const [bx, by, o] = b.dataset.bl.split(' ');
            /* vertical blade across a horizontal duct = closed; a horizontal louvre across the pass = closed */
            b.setAttribute('transform', `rotate(${o === 'v' ? -p * 0.9 : -p * 0.9} ${bx} ${by})`);
          }
          if (dv) {
            dv.textContent = ok ? fmt(p, 1) + '%' : '-----';
            dv.setAttribute('fill', ok ? C.val : C.none);
          }
        },
        null
      );
      gg.addEventListener('click', e => (e.stopPropagation(), api.fp(d.fp)));
    });
    /* measured values */
    TAGS.forEach((t, i) => {
      const vt = q(`[data-vt="${i}"]`);
      api.reg(
        { t: 'val', tag: t[2], ref: t[6] || undefined, v: '' },
        X => {
          const ok = X && isFinite(X.v);
          vt.textContent = ok ? fmt(X.v, t[4]) : '-----';
          vt.setAttribute('fill', ok ? C.val : C.none);
        },
        q(`[data-vb="${i}"]`)
      );
    });
    /* controllers */
    CHIPS.forEach((c, i) => {
      const pill = q(`[data-cp="${i}"]`),
        pt = K('cm' + i),
        pv = K('cpv' + i),
        sv = K('csv' + i),
        bar = K('cbar' + i),
        mv = K('cmv' + i);
      api.reg(
        { t: 'ctl', tag: c[2] },
        X => {
          const ok = !!X,
            m = ok ? X.m : '';
          const [lab, col] = m === 'M' ? ['MAN', C.warn] : m === 'R' ? ['CAS', C.cas] : m === 'A' ? ['AUT', C.aut] : ['---', C.none];
          pt.textContent = lab;
          pt.setAttribute('fill', col);
          pill.setAttribute('stroke', col);
          pv.textContent = ok ? fmt(X.pv, 1) : '-----';
          sv.textContent = ok ? fmt(X.sv, 1) : '-----';
          pv.setAttribute('fill', ok ? C.val : C.none);
          sv.setAttribute('fill', ok ? C.sv : C.none);
          const m0 = ok && isFinite(X.mv) ? Math.max(0, Math.min(100, X.mv)) : 0;
          bar.setAttribute('width', (44 * m0) / 100);
          mv.textContent = ok ? fmt(X.mv, 1) : '-----';
          mv.setAttribute('fill', ok ? C.val : C.none);
        },
        q(`[data-cr="${i}"]`)
      );
    });
    /* combustion summary */
    let taf = null,
      coal = null;
    const ratio = () => {
      const r = taf != null && coal != null && coal > 1 ? taf / coal : null,
        t = K('ratio');
      t.textContent = fmt(r, 2);
      t.setAttribute('fill', r == null ? C.none : C.val);
    };
    PROWS.forEach((p, i) => {
      const t = K('pv' + i);
      live(
        p[1],
        '',
        v => {
          t.textContent = fmt(v, p[2]);
          t.setAttribute('fill', v == null ? C.none : C.val);
          if (i === 0) (taf = v), ratio();
          if (i === 1) (coal = v), ratio();
        },
        q(`[data-pr="${i}"]`)
      );
    });
    live('ABC-007|M.0182', '', v => {
      const r = K('mftr'),
        t = K('mftt'),
        on = v != null && v > 0.5,
        col = v == null ? C.none : on ? C.alarm : C.ok;
      t.textContent = v == null ? '-----' : on ? 'TRIPPED' : 'RESET';
      t.setAttribute('fill', on ? '#fff' : col);
      r.setAttribute('stroke', col);
      r.setAttribute('fill', on ? C.alarm : 'none');
    }, K('mftr'));
    /* bed temperature: 18 thermocouples (TE-FG1091 A ~ I upper, TE-FG1090 A ~ I lower, ABC-026 / 027) */
    const TT = {};
    const calc = () => {
      const v = Object.values(TT).filter(x => x != null),
        avg = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
      for (const [k, x] of [['bavg', avg], ['bmax', v.length ? Math.max(...v) : null], ['bmin', v.length ? Math.min(...v) : null]]) {
        K(k).textContent = fmt(x, 0);
        K(k).setAttribute('fill', x == null ? C.none : C.val);
      }
      K('bedavg').textContent = 'BED  ' + fmt(avg, 0) + ' °C';
      const op = avg == null ? 1 : Math.max(0.06, Math.min(1, (avg - 60) / 700));
      K('heat').setAttribute('opacity', op);
      K('heat0').setAttribute('opacity', op);
      K('bedavg').setAttribute('fill', op > 0.4 ? '#fff' : C.name);
    };
    'ABCDEFGHI'.split('').forEach((c, i) =>
      [['TIFG1091', 'u'], ['TIFG1090', 'l']].forEach(([pre, s]) => {
        const bar = K('b' + s + i),
          t = K('t' + s + i),
          y0 = +bar.getAttribute('y');
        live('', pre + c, v => {
          TT[pre + c] = v;
          const h = v == null ? 0 : Math.max(0, Math.min(50, ((v - 850) / 150) * 50));
          bar.setAttribute('height', h);
          bar.setAttribute('y', y0 - h);
          bar.setAttribute('fill', v == null ? C.none : v >= 955 ? '#c2410c' : v >= 935 ? '#ea580c' : '#f59e0b');
          t.textContent = v == null ? '---' : fmt(v, 0);
          t.setAttribute('fill', v == null ? C.none : s === 'u' ? C.val : C.sv);
          calc();
        }, bar);
      })
    );
    return pg;
  }
  const SCREENS = { AFG: airFlueGas };

  /* ---------- frame: title with the process header, alarm bar, navigation ---------- */
  function frame(g, sys, api) {
    const W = sys.w,
      H = sys.h,
      tx = (x, y, s, o) => {
        const e = S_('g', {});
        e.innerHTML = T(x, y, s, o);
        const t = e.firstChild;
        g.append(t);
        return t;
      };
    g.append(S_('rect', { x: 0, y: 0, width: W, height: 34, fill: C.frame }));
    tx(16, 22, sys.num || '', { z: 12, b: 700, c: C.dim, mono: 1 });
    tx(48, 22, sys.name || sys.title, { z: 13, b: 700, ls: 0.6 });
    [['MSP', 1, 'kg/cm²'], ['MST', 0, '°C'], ['MSF', 1, 'T/H'], ['RHP', 1, 'kg/cm²'], ['RHT', 0, '°C'], ['COAL', 1, 'T/H'], ['PWR', 1, 'MW']].forEach(([k, dp, u], i) => {
      const x = 560 + i * 148;
      tx(x, 22, k === 'PWR' ? 'LOAD' : k, { z: 9, b: 600, c: C.dim, ls: 0.5 });
      const t = tx(x + 88, 22.5, '-----', { z: 12.5, mono: 1, c: C.none, a: 'end' });
      tx(x + 92, 22, u, { z: 8.5, c: C.unit });
      if (api.HDR[k])
        api.reg({ t: 'val', tag: k, ref: api.HDR[k], v: '' }, X => {
          const ok = X && isFinite(X.v);
          t.textContent = ok ? fmt(X.v, dp) : '-----';
          t.setAttribute('fill', ok ? C.val : C.none);
        }, null);
    });
    /* alarm bar: one line; colour only while an alarm is active (high = red blinking, medium = amber) */
    g.append(S_('rect', { x: 0, y: 34, width: W, height: 20, fill: '#cdd2d6' }));
    const al = tx(16, 48, 'NO ACTIVE ALARM', { z: 9.5, b: 600, c: C.dim, ls: 0.5 });
    const rules = [
      { k: 'mft', ref: 'ABC-007|M.0182', msg: 'MFT TRIPPED', hi: 1 },
      { k: 'fp', ref: 'pv:PICFG108', when: v => v > 50 || v < -100, msg: 'FURNACE PRESSURE ABNORMAL', hi: 1 },
      { k: 'idf', ref: 'ABC-008|M.3304', when: v => v < 0.5, msg: 'IDF F-1056 STOPPED' },
      { k: 'paf', ref: 'ABC-007|M.3302', when: v => v < 0.5, msg: 'PAF F-1053 STOPPED' },
      { k: 'saf', ref: 'ABC-007|M.3303', when: v => v < 0.5, msg: 'SAF F-1054 STOPPED' }
    ];
    const st = {};
    const upd = () => {
      const act = rules.filter(r => st[r.k]);
      al.textContent = '';
      const list = g.querySelector('[data-k="alist"]');
      if (!act.length) {
        al.textContent = 'NO ACTIVE ALARM';
        al.setAttribute('fill', C.dim);
        if (list) (list.textContent = 'No active alarm'), list.setAttribute('fill', C.dim);
        return;
      }
      act.forEach((r, i) => {
        const s = S_('tspan', { fill: r.hi ? C.alarm : C.warn, dx: i ? 28 : 0 });
        s.textContent = (r.hi ? '■ ' : '▲ ') + r.msg;
        if (r.hi) s.setAttribute('class', 'h2blink');
        al.append(s);
      });
      if (list) (list.textContent = act.length + ' active (see the bar above)'), list.setAttribute('fill', act.some(r => r.hi) ? C.alarm : C.warn);
    };
    for (const r of rules)
      api.reg({ t: 'val', tag: '', ref: r.ref, v: '' }, X => {
        const ok = X && isFinite(X.v);
        st[r.k] = ok && (r.when ? r.when(+X.v) : X.v > 0.5);
        upd();
      }, null);
    /* navigation: buttons to the related screens (the old screens open until the new set replaces them) */
    const y = H - 32;
    g.append(S_('rect', { x: 0, y, width: W, height: 32, fill: C.frame }));
    let x = 12;
    for (const [id, s] of NAV) {
      const w = s.length * 6.3 + 22,
        on = id === sys.id,
        gg = S_('g', { class: on ? '' : 'h2btn', style: on ? '' : 'cursor:pointer' });
      gg.append(S_('rect', { x, y: y + 6, width: w, height: 20, rx: 3, fill: on ? C.name : C.nav, stroke: C.chipS, 'stroke-width': 0.6 }));
      gg.innerHTML += T(x + w / 2, y + 19.5, s, { z: 8.5, b: 600, c: on ? '#fff' : C.lab, a: 'middle', ls: 0.4 });
      const ti = S_('title', {});
      ti.textContent = on ? 'this screen' : 'open ' + s;
      gg.append(ti);
      if (!on && api.go) gg.addEventListener('click', e => (e.stopPropagation(), api.go(id)));
      g.append(gg);
      x += w + 6;
    }
  }
  const NAV = [
    ['UNIT', 'UNIT'],
    ['AFG', '007 AIR & FLUE GAS'],
    ['08', '008 PA / SA'],
    ['09', '009 FLUIDIZING AIR'],
    ['39', '039 RH / SH BIASING'],
    ['38', '038 AIR PREHEATER'],
    ['11', '011 COAL FEEDER'],
    ['33', '033 CCS']
  ];
  window.PLANT_V2 = {
    C,
    draw(g, sys, api) {
      const defs = S_('defs', {});
      defs.innerHTML = DEFS;
      g.append(defs);
      g.append(S_('rect', { x: 0, y: 0, width: sys.w, height: sys.h, fill: C.bg }));
      (SCREENS[sys.screen] || (() => {}))(g, api);
      frame(g, sys, api);
    }
  };
  /* the new screens come first in the list of the Plant view; the old ones stay until the new set replaces them */
  window.PLANT_SYS = window.PLANT_SYS || [];
  window.PLANT_SYS.unshift({ id: 'AFG', title: 'AIR & FLUE GAS (new HMI)', num: '007', name: 'AIR & FLUE GAS SYSTEM', src: '7.PNG', w: 1600, h: 960, v2: true, screen: 'AFG', items: [] });
})();
