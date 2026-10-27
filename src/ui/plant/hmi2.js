/* NEW PLANT HMI (2026-10-26, roadmap step 6, sample): the plant screens REDRAWN with our own vector graphics (user 2026-10-26:
   "new HMI using your own graphics, guide lang ang snapshots"). The control-room snapshots (document-references/hmi-snapshot-
   sample.zip) are only the guide for the system: equipment, flow paths, instruments.
   Art (7th pass, 2026-10-27): three styles the operator picks on the screen (STYLE buttons in the navigation bar, remembered):
   CUTAWAY (default; user: "yung cutaway muna gawin"): light engineering illustration, every vessel and duct in section, the
     process visible inside (particles in the ducts, circulating solids, water in the drum);
   STEEL: realistic machined metal on a dark ground, cutaway windows (fire and bed, tube banks, APH tubes);
   THERMAL: dark, fine silhouettes, colour = temperature of the medium (cold air blue, hot air amber, flue gas red cooling to
     grey), glowing pulses with the flow (user 2026-10-27: "gawin rin ang steel at thermal as option ng HMI").
   Pipes and ducts (user 2026-10-27: "parang pinagpatong na rectangle, d man lang inayos"): ONE pipe renderer for every style:
   each duct is one continuous path with rounded elbows (radius ~ the duct width), drawn in layers over ALL ducts at once (all
   walls, then all insides, then the highlights), so elbows and tees join cleanly with the same thickness.
   Everything that moves follows the live signal: a fan turns only while its run bit is 1, a duct moves only while its fan runs
   (no flow = a dark / grey empty duct), damper blades turn with the real position, the fire follows the bed temperature.
   Values and faceplates are the same live links (click = faceplate). The flow (approved 2026-10-27) is unchanged.
   plant.js draws a system with `v2: true` through PLANT_V2.draw. */
(function () {
  /* palette of the current style (filled from STYLES at each draw) */
  const C = {};
  const NS = 'http://www.w3.org/2000/svg';
  const S_ = (t, a) => {
    const e = document.createElementNS(NS, t);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    return e;
  };
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  const UF = "Barlow, 'IBM Plex Sans', 'Segoe UI', Roboto, Arial, sans-serif",
    MF = "'Roboto Mono', 'JetBrains Mono', Consolas, monospace";
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  /* ---------- geometry of the Air & Flue Gas screen (process area, drawn 24 px under the title and alarm bar) ---------- */
  const OY = 24;
  /* cold SA enters the upper (SA) section of the air heater, cold PA the lower (PA) section: the two never cross
     (user 2026-10-27: "bakit common na ang pipe papasok ng air heater?").
     ducts: medium (air cold air, hot hot air, gas / gasm / gasc flue gas hot / after the economizer / after the APH, sol solids)
     and the flow signal that moves them (G IDF, S SAF, P PAF, F FA air) */
  const DUCTS = [
    { m: 'gas', w: 18, f: 'G', pts: [[280, 150], [334, 150]] },
    { m: 'gas', w: 18, f: 'G', pts: [[365, 128], [365, 92], [610, 92], [610, 112]] },
    { m: 'gasm', w: 18, f: 'G', pts: [[610, 456], [610, 478], [880, 478], [880, 502]] },
    { m: 'gasc', w: 18, f: 'G', pts: [[880, 660], [880, 690], [946, 690]] },
    { m: 'gasc', w: 18, f: 'G', pts: [[1150, 690], [1212, 690]] },
    { m: 'gasc', w: 16, f: 'G', pts: [[1250, 672], [1302, 672]] },
    { m: 'sol', w: 6, f: 'P', pts: [[342, 430], [300, 430], [300, 470], [281, 470]] },
    { m: 'air', w: 5, f: 'F', pts: [[352, 471], [352, 456], [396, 456], [396, 471]] },
    { m: 'air', w: 5, f: 'F', pts: [[374, 456], [374, 444]] },
    { m: 'air', w: 12, f: 'S', pts: [[60, 760], [238, 760]] },
    { m: 'air', w: 12, f: 'P', pts: [[60, 840], [238, 840]] },
    { m: 'air', w: 12, f: 'S', pts: [[278, 742], [796, 742], [796, 600], [840, 600]] },
    { m: 'air', w: 12, f: 'P', pts: [[278, 822], [820, 822], [820, 636], [840, 636]] },
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
    { tag: 'PCDFG10561', x: 1186, y: 690, w: 18, ref: 'mv:PICFG108A', fp: 'PICFG108A', desc: 'IDF inlet vane control damper (PCD-FG1056-1)' },
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

  /* ---------- drawing helpers ---------- */
  const legs = p => p.slice(1).map((b, i) => [p[i], b]);
  const plen = p => legs(p).reduce((s, [a, b]) => s + Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]), 0);
  /* one continuous path through orthogonal points, every elbow rounded (radius r, limited by the legs) */
  function roundPath(p, r) {
    let d = 'M' + p[0][0] + ' ' + p[0][1];
    for (let i = 1; i < p.length - 1; i++) {
      const [a, b, c] = [p[i - 1], p[i], p[i + 1]],
        l1 = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]),
        l2 = Math.abs(c[0] - b[0]) + Math.abs(c[1] - b[1]),
        rr = Math.min(r, l1 / 2, l2 / 2),
        u1 = [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])],
        u2 = [Math.sign(c[0] - b[0]), Math.sign(c[1] - b[1])];
      d += ` L${b[0] - u1[0] * rr} ${b[1] - u1[1] * rr} Q${b[0]} ${b[1]} ${b[0] + u2[0] * rr} ${b[1] + u2[1] * rr}`;
    }
    const e = p[p.length - 1];
    return d + ` L${e[0]} ${e[1]}`;
  }
  const ductPath = d => roundPath(d.pts, d.w * 1.1);
  const T = (x, y, s, o) => {
    o = o || {};
    return `<text x="${x}" y="${y}" font-family="${o.mono ? MF : UF}" font-size="${o.z || 10}"${o.b ? ` font-weight="${o.b === 1 ? 600 : o.b}"` : ''} fill="${o.c || C.text}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.k ? ` data-k="${o.k}"` : ''}>${esc(s)}</text>`;
  };
  const R = (x, y, w, h, f, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${o == null ? ` stroke="${C.ol}" stroke-width="${C.olw}"` : o}/>`;
  const P = (d, f, o) => `<path d="${d}" fill="${f}"${o == null ? ` stroke="${C.ol}" stroke-width="${C.olw}"` : o}/>`;
  const NAME = (x, y, s, a) => T(x, y, s, { z: 10, b: 700, c: C.name, a: a || 'middle', ls: 0.6 });
  const smoke = (col, op, n) => {
    let s = '<g data-k="smoke">';
    for (let i = 0; i < n; i++)
      s += `<circle cx="1322" cy="226" r="6" fill="${col}" opacity="0" filter="url(#h2blur)"><animate attributeName="cy" values="226;140" dur="5s" begin="-${i}s" repeatCount="indefinite"/><animate attributeName="r" values="5;20" dur="5s" begin="-${i}s" repeatCount="indefinite"/><animate attributeName="opacity" values="${op};0" dur="5s" begin="-${i}s" repeatCount="indefinite"/><animate attributeName="cx" values="1322;1340" dur="5s" begin="-${i}s" repeatCount="indefinite"/></circle>`;
    return s + '</g>';
  };
  /* serpentine tube bank */
  const bankPath = b => {
    let d = '';
    const n = Math.floor((b.h - 4) / 5);
    for (let i = 0; i < n; i++) {
      const yy = b.y + 3 + i * 5;
      d += (i ? ' L' : 'M') + (i % 2 ? b.x + b.w - 3 : b.x + 3) + ' ' + yy + ' L' + (i % 2 ? b.x + 3 : b.x + b.w - 3) + ' ' + yy;
    }
    return d;
  };
  const CYC = 'M334 128 H398 V240 L376 338 H356 L334 240 Z',
    BPH = 'M540 434 L596 456 H624 L680 434 Z',
    FURL = 'M160 600 L190 650 L250 650 L280 600 Z',
    ESPH = i => {
      const x = 980 + i * 52;
      return `M${x} 740 H${x + 40} L${x + 24} 772 H${x + 16} Z`;
    };
  /* solids spiralling down the cyclone wall */
  const VORTEX = (() => {
    let sp = 'M340 150';
    for (let k = 0; k < 8; k++) {
      const y = 150 + k * 22,
        wl = k < 5 ? 26 : 26 - (k - 4) * 6;
      sp += ` Q366 ${y + 6} ${366 + wl} ${y + 11} Q366 ${y + 16} ${366 - wl} ${y + 22}`;
    }
    return sp + ' L366 336 L366 400';
  })();
  const vortex = (col, n, glow) => {
    let s = '<g data-k="vortex">';
    for (let i = 0; i < n; i++) s += `<circle r="1.6" fill="${col}"${glow ? ' filter="url(#h2glow)"' : ''}><animateMotion dur="4s" begin="-${(i * (4 / n)).toFixed(2)}s" repeatCount="indefinite" path="${VORTEX}"/></circle>`;
    return s + '</g>';
  };
  const rising = (col, n, glow, op) => {
    let s = '<g data-k="solids">';
    for (let i = 0; i < n; i++) {
      const cx = 172 + ((i * 29) % 96),
        d = 3 + (i % 5) * 0.6,
        y0 = 570 - (i % 3) * 10,
        b = ((i * 0.37) % d).toFixed(2);
      s += `<circle cx="${cx}" cy="${y0}" r="${1.2 + (i % 3) * 0.5}" fill="${col}" opacity="${op}"${glow ? ' filter="url(#h2glow)"' : ''}><animate attributeName="cy" values="${y0};${130 + (i % 4) * 8}" dur="${d.toFixed(1)}s" begin="-${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="${op};${op * 0.6};0" dur="${d.toFixed(1)}s" begin="-${b}s" repeatCount="indefinite"/></circle>`;
    }
    return s + '</g>';
  };
  const bpGas = (col, glow) => {
    let s = '<g data-k="bpgas">';
    for (let i = 0; i < 16; i++) s += `<circle cx="${552 + ((i * 23) % 116)}" r="1.5" fill="${col}" opacity="0.6"${glow ? ' filter="url(#h2glow)"' : ''}><animate attributeName="cy" values="120;440" dur="${(3.2 + (i % 4) * 0.4).toFixed(1)}s" begin="-${(i * 0.4).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
    return s + '</g>';
  };
  const espHop = () => [0, 1, 2].map(ESPH);
  const ESPBODY = 'M946 681 L966 640 H1130 L1150 681 V699 L1130 740 H966 L946 699 Z';

  /* ================= the three styles ================= */
  const STYLES = {};
  /* ---- CUTAWAY: light engineering illustration, everything in section ---- */
  STYLES.cut = {
    name: 'CUTAWAY',
    C: {
      bg: '#d5d9dc', frame: '#bfc5ca', alarmBar: '#cdd2d6', ol: '#3a434c', olw: 1.4, text: '#1b2127', name: '#26303a', lab: '#45505b', dim: '#5f6a75',
      unit: '#5f6a75', val: '#0e1317', sv: '#34495e', none: '#8a949d', box: '#f5f7f8', boxs: '#8f9aa4', chip: '#eceff1', chipS: '#9ea8b1',
      track: '#c3cad0', bar: '#3d6589', rule: '#aab3bb', run: '#c62828', stop: '#2e7d32', alarm: '#c62828', warn: '#a14a06', cas: '#1a5aa0',
      aut: '#3f4a55', ok: '#167a3b', off: '#e2e5e8', nav: '#e4e7ea', navOn: '#26303a', navOnT: '#ffffff', hover: '#d3d8dc',
      eq: '#f1f3f4', eqIn: '#7d8790', imp: '#3a434c', blade: '#1b2127', bedHot: '#ffffff', bedCold: '#26303a',
      heat: v => (v >= 955 ? '#c2410c' : v >= 935 ? '#ea580c' : '#f59e0b')
    },
    defs: `<linearGradient id="h2furIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4e7d6"/><stop offset="0.6" stop-color="#f6c98f"/><stop offset="1" stop-color="#ef8a3a"/></linearGradient>
<linearGradient id="h2wallX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d969e"/><stop offset="0.5" stop-color="#c3c9ce"/><stop offset="1" stop-color="#8d969e"/></linearGradient>
<linearGradient id="h2concX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a9adb0"/><stop offset="0.4" stop-color="#e3e5e6"/><stop offset="1" stop-color="#9da1a4"/></linearGradient>
<pattern id="h2hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#d9c3a5"/><line x1="0" y1="0" x2="0" y2="6" stroke="#a88a63" stroke-width="1.2"/></pattern>
<filter id="h2lift" x="-0.1" y="-0.1" width="1.2" height="1.3"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#2a3138" flood-opacity="0.22"/></filter>`,
    /* pipe layers: [colour (or medium map), extra width, opacity, flow-dependent] */
    pipe: [
      [() => '#3a434c', 2.8, 1, 0],
      [m => ({ air: '#cfe0ee', hot: '#f5d7b0', gas: '#e8cdbf', gasm: '#e3d5cc', gasc: '#d8dadc', sol: '#c8b183' })[m], 0, 1, 1]
    ],
    flow(d, i) {
      const DOT = { air: '#2c6aa0', hot: '#c2570c', gas: '#8a4a32', gasm: '#7a5546', gasc: '#5f6469', sol: '#7a5a22' };
      const L = plen(d.pts),
        sp = d.m === 'sol' ? 40 : 90,
        n = Math.max(2, Math.round(L / (d.w > 8 ? 26 : 18))),
        dur = L / sp,
        r = d.w > 14 ? 2 : d.w > 8 ? 1.7 : 1.2,
        path = ductPath(d);
      let s = `<g data-pg="${i}">`;
      /* two lanes in a wide duct: the same path shifted across the first leg */
      const hor = d.pts[0][1] === d.pts[1][1],
        off = d.w > 10 ? [-d.w * 0.22, d.w * 0.22] : [0];
      off.forEach((o, k) => {
        for (let j = 0; j < n; j++)
          s += `<circle r="${r}" fill="${DOT[d.m]}" opacity="0.8" transform="translate(${hor ? '0 ' + o : o + ' 0'})"><animateMotion dur="${dur.toFixed(2)}s" repeatCount="indefinite" begin="-${((dur * (j + k * 0.5)) / n).toFixed(2)}s" path="${path}"/></circle>`;
      });
      return s + '</g>';
    },
    drum() {
      const x = 150, y = 64, w = 142, h = 26;
      let s = '';
      for (const xx of [194, 221, 248]) s += R(xx - 3, y + h, 6, 120 - y - h, '#cfe0ee');
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#f1f3f4" stroke="${C.ol}" stroke-width="1.6" filter="url(#h2lift)"/>`;
      s += `<clipPath id="h2dc"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/></clipPath>`;
      s += `<g clip-path="url(#h2dc)"><path fill="#7fb0d8" d="M${x - 20} ${y + 13} q10 -2 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V${y + 40} H${x - 20} Z"><animateTransform attributeName="transform" type="translate" values="0 0;20 0" dur="2s" repeatCount="indefinite"/></path></g>`;
      return s + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="none" stroke="${C.ol}" stroke-width="1.6"/>`;
    },
    furnace() {
      let s = P(FURL, 'url(#h2hatch)') + P('M168 600 L194 642 L246 642 L272 600 Z', '#e6dccf', '') + P('M168 600 L194 642 L246 642 L272 600 Z', '#f08a3a', ' data-k="heat0"');
      s += R(185, 650, 70, 40, '#f5d7b0');
      for (let i = 0; i < 6; i++) s += `<path d="M${194 + i * 10.4} 650 v-6 m-2 0 h4" stroke="${C.ol}" stroke-width="1.2" fill="none"/>`;
      s += `<rect x="160" y="120" width="120" height="480" fill="url(#h2wallX)" stroke="${C.ol}" stroke-width="1.4" filter="url(#h2lift)"/>`;
      s += R(165, 125, 110, 475, '#ece8e3', '') + '<g data-k="heat">' + R(165, 125, 110, 475, 'url(#h2furIn)', '');
      s += '<path d="M165 560 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 V600 H165 Z" fill="#ea7a2c"><animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="0.9s" repeatCount="indefinite"/></path>';
      s += R(165, 568, 110, 32, '#e5702a', '') + '</g>' + rising('#b4531a', 34, 0, 0.75);
      return s + T(220, 142, 'FURNACE', { z: 10, b: 700, c: C.name, a: 'middle', ls: 0.8 }) + T(220, 155, 'CFB combustor', { z: 8.5, c: C.dim, a: 'middle' });
    },
    cyclone() {
      let s = R(356, 116, 18, 30, '#e8cdbf') + `<path d="${CYC}" fill="#efe4d8" stroke="${C.ol}" stroke-width="1.6" filter="url(#h2lift)"/>`;
      s += R(356, 128, 18, 34, '#e8cdbf') + R(360, 338, 12, 66, '#d8c19a') + vortex('#8a5a2a', 12);
      s += R(340, 404, 60, 40, '#e9dcc6') + R(342, 424, 56, 18, '#c8a56b', '');
      for (let i = 0; i < 8; i++) s += `<circle cx="${346 + i * 7}" cy="434" r="1.4" fill="#7a5a22"><animate attributeName="cy" values="436;429;436" dur="${(0.6 + (i % 3) * 0.2).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
      return s;
    },
    backpass() {
      let s = P(BPH, '#e3d5cc') + `<rect x="540" y="112" width="140" height="322" fill="url(#h2wallX)" stroke="${C.ol}" stroke-width="1.4" filter="url(#h2lift)"/>`;
      s += R(545, 117, 130, 317, '#efe6e0', '') + R(608, 122, 4, 196, '#9aa3ab', '');
      for (const b of BANKS) s += T(b.x + b.w / 2, b.y - 3, b.n, { z: 7.5, b: 600, c: C.dim, a: 'middle', ls: 0.3 }) + `<path d="${bankPath(b)}" fill="none" stroke="${b.hot ? '#b4532a' : '#3d6f9e'}" stroke-width="1.5" stroke-linejoin="round"/>`;
      return s + bpGas('#8a4a32');
    },
    aph() {
      let s = P('M836 502 H924 L918 494 H842 Z', '#e3d5cc') + `<rect x="840" y="502" width="80" height="158" fill="url(#h2wallX)" stroke="${C.ol}" stroke-width="1.4" filter="url(#h2lift)"/>`;
      s += R(845, 507, 70, 148, '#eef1f3', '');
      for (let xx = 850; xx < 914; xx += 5) s += `<line x1="${xx}" y1="510" x2="${xx}" y2="652" stroke="#9c8a80" stroke-width="1.3"/>`;
      for (const yy of [532, 584, 628]) s += `<line x1="845" y1="${yy}" x2="898" y2="${yy}" stroke="${C.ol}" stroke-width="1.6"/>`;
      return s;
    },
    esp() {
      let s = '';
      espHop().forEach((d, i) => {
        const x = 980 + i * 52;
        s += P(d, '#d8dadc') + `<path d="M${x + 8} 748 H${x + 32} L${x + 22} 768 H${x + 18} Z" fill="#9a9184"/>` + R(x + 10, 628, 20, 12, '#eceff1');
      });
      s += P(ESPBODY, '#f0f2f3', ` stroke="${C.ol}" stroke-width="1.4" filter="url(#h2lift)"`);
      for (let x = 974; x < 1126; x += 8) s += `<line x1="${x}" y1="646" x2="${x}" y2="734" stroke="${x % 16 ? '#7f8a94' : '#c0c7cd'}" stroke-width="${x % 16 ? 0.8 : 1.6}"/>`;
      for (const x of [966, 1018, 1070, 1130]) s += `<line x1="${x}" y1="640" x2="${x}" y2="740" stroke="${C.ol}" stroke-width="1.4"/>`;
      return s;
    },
    stack: () => `<path d="M1300 760 L1308 228 H1336 L1344 760 Z" fill="url(#h2concX)" stroke="${C.ol}" stroke-width="1.4" filter="url(#h2lift)"/>` + smoke('#9aa1a7', 0.45, 5)
  };
  /* ---- STEEL: machined metal on a dark ground, cutaway windows ---- */
  const MS = {
    air: ['#33495e', '#5d7f9e', '#94b6d3'],
    hot: ['#523519', '#9a6e3e', '#c99a62'],
    gas: ['#3f2f2b', '#77605a', '#9a7f75'],
    gasm: ['#3b302d', '#6c5c56', '#8d7a72'],
    gasc: ['#36393c', '#686c71', '#8a8e93'],
    sol: ['#5a4a2f', '#6d5a3a', '#8a7450']
  };
  const grad = (id, c, v) => `<linearGradient id="${id}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="${v ? 1 : 0}"><stop offset="0" stop-color="${c[3]}"/><stop offset="0.3" stop-color="${c[1]}"/><stop offset="0.62" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[0]}"/></linearGradient>`;
  STYLES.steel = {
    name: 'STEEL',
    C: {
      bg: '#1c2229', frame: '#12171c', alarmBar: '#161b21', ol: '#0b0f13', olw: 0.8, text: '#e6ebef', name: '#d3dbe2', lab: '#aab6c1', dim: '#7f8b97',
      unit: '#8995a1', val: '#f0f4f7', sv: '#b9c7d5', none: '#59636d', box: '#0c1014', boxs: '#3c4854', chip: '#20272e', chipS: '#46535f',
      track: '#38424c', bar: '#a3b6c8', rule: '#343f4a', run: '#e5484d', stop: '#3fa34d', alarm: '#e5484d', warn: '#f5a524', cas: '#6cb4ff',
      aut: '#c9d2db', ok: '#5ccf86', off: '#2f363d', nav: '#222a32', navOn: '#cdd6de', navOnT: '#12171c', hover: '#2b343e',
      eq: 'url(#h2steelY)', eqIn: '#55606b', imp: '#a9b5c1', blade: '#e3c06a', bedHot: '#ffd9a8', bedCold: '#d3dbe2', impFill: '#101418',
      heat: v => (v >= 955 ? '#f97316' : v >= 935 ? '#fb923c' : '#fdba74')
    },
    defs:
      grad('h2steelX', ['#3f4852', '#8f9ba8', '#66717d', '#323a42'], 0) +
      grad('h2steelY', ['#3f4852', '#8f9ba8', '#66717d', '#323a42'], 1) +
      grad('h2darkX', ['#2f363d', '#626d78', '#47515b', '#262c32'], 0) +
      grad('h2darkY', ['#2f363d', '#626d78', '#47515b', '#262c32'], 1) +
      grad('h2concX', ['#5d6063', '#a7a9ab', '#86888a', '#4e5052'], 0) +
      `<pattern id="h2tubes" width="4" height="8" patternUnits="userSpaceOnUse"><line x1="0.5" y1="0" x2="0.5" y2="8" stroke="#000" stroke-opacity="0.28" stroke-width="1"/></pattern>
<pattern id="h2aphT" width="5" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="10" fill="#14181c"/><rect x="1" y="0" width="2.4" height="10" fill="#7b8794"/><rect x="1" y="0" width="0.8" height="10" fill="#b7c2cc"/></pattern>
<radialGradient id="h2fire" cx="0.5" cy="0.85" r="0.9"><stop offset="0" stop-color="#ffd27a"/><stop offset="0.35" stop-color="#f08a24"/><stop offset="0.7" stop-color="#8f2c0c"/><stop offset="1" stop-color="#2a0d05"/></radialGradient>
<filter id="h2lift" x="-0.2" y="-0.2" width="1.4" height="1.4"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.45"/></filter>`,
    /* round pipe: dark rim, body, lit band, highlight line (a cylinder lit from above) */
    pipe: [
      [() => '#0b0f13', 1.6, 1, 0],
      [m => MS[m][0], 0, 1, 1],
      [m => MS[m][1], -0.38, 1, 1],
      [m => MS[m][2], -0.78, 0.8, 1]
    ],
    flow(d, i) {
      if (d.m === 'sol') return `<g data-pg="${i}"><path d="${ductPath(d)}" fill="none" stroke="#c9a46a" stroke-width="2" stroke-dasharray="2 6" opacity="0.7"><animate attributeName="stroke-dashoffset" from="16" to="0" dur="1.6s" repeatCount="indefinite"/></path></g>`;
      return `<g data-pg="${i}"><path d="${ductPath(d)}" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="${(d.w * 0.4).toFixed(1)}" stroke-linecap="round" stroke-dasharray="22 46"><animate attributeName="stroke-dashoffset" from="68" to="0" dur="0.8s" repeatCount="indefinite"/></path></g>`;
    },
    drum() {
      const x = 150, y = 64, w = 142, h = 26;
      let s = '';
      for (const xx of [194, 221, 248]) s += R(xx - 2.5, y + h, 5, 120 - y - h, 'url(#h2steelX)');
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="url(#h2steelY)" stroke="${C.ol}" stroke-width="0.8" filter="url(#h2lift)"/>`;
      s += R(x + 30, y + 8, 82, 10, '#0f1a24', ' stroke="#2c3946" stroke-width="0.6"') + R(x + 30, y + 13, 82, 5, '#2f6fa3', '');
      return s + `<rect x="${x + 30}" y="${y + 12.4}" width="82" height="1" fill="#8fd0ff"><animate attributeName="y" values="${y + 12.4};${y + 11.6};${y + 12.4}" dur="3s" repeatCount="indefinite"/></rect>`;
    },
    furnace() {
      let s = P(FURL, 'url(#h2darkX)') + R(185, 650, 70, 40, 'url(#h2steelY)') + '<line x1="188" y1="652" x2="252" y2="652" stroke="#1a1f24" stroke-width="2" stroke-dasharray="2 3"/>';
      s += `<rect x="160" y="120" width="120" height="480" fill="url(#h2steelX)" stroke="${C.ol}" stroke-width="0.8" filter="url(#h2lift)"/>` + R(160, 120, 120, 480, 'url(#h2tubes)', '') + R(158, 116, 124, 8, 'url(#h2steelY)');
      const wx = 174, wy = 452, ww = 92, wh = 140;
      s += `<rect x="${wx - 2}" y="${wy - 2}" width="${ww + 4}" height="${wh + 4}" rx="3" fill="#0d1014"/><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="#1a1d20"/><g data-k="heat">`;
      s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="2" fill="url(#h2fire)"><animate attributeName="opacity" values="1;0.86;0.96;0.82;1" dur="1.7s" repeatCount="indefinite"/></rect>`;
      for (let i = 0; i < 7; i++) {
        const x = wx + 8 + i * 12.5, h = 26 + ((i * 37) % 30);
        s += `<g transform="translate(${x} ${wy + 108})"><path d="M-5 0 Q0 ${-h} 5 0 Z" fill="#ffe2a0" opacity="0.55"><animateTransform attributeName="transform" type="scale" values="1 1;1 1.25;1 0.9;1 1" dur="${(0.9 + (i % 3) * 0.23).toFixed(2)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.55;0.25;0.6;0.55" dur="${(1.1 + (i % 2) * 0.4).toFixed(1)}s" repeatCount="indefinite"/></path></g>`;
      }
      s += R(wx, wy + 104, ww, wh - 104, '#c2621f', '') + '</g><g data-k="heat0"></g>';
      s += rising('#ffd89a', 0, 0, 1);
      s += '<g data-k="bedp">';
      for (let i = 0; i < 26; i++) {
        const x = wx + 4 + ((i * 37) % (ww - 8)), y = wy + 110 + ((i * 13) % 24);
        s += `<circle cx="${x}" cy="${y}" r="${1.2 + (i % 3) * 0.5}" fill="#ffd89a"><animate attributeName="cy" values="${y};${y - 9};${y}" dur="${(0.6 + (i % 5) * 0.17).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
      }
      s += `</g><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="2" fill="none" stroke="#5c6772" stroke-width="1"/>`;
      return s + T(220, 140, 'FURNACE', { z: 10, b: 700, c: '#0f1317', a: 'middle', ls: 0.8 });
    },
    cyclone() {
      let s = R(356, 116, 18, 14, 'url(#h2steelX)') + `<path d="${CYC}" fill="url(#h2steelX)" stroke="${C.ol}" stroke-width="0.8" filter="url(#h2lift)"/>`;
      s += '<line x1="334" y1="240" x2="398" y2="240" stroke="#000" stroke-opacity="0.35"/>' + R(360, 338, 12, 66, 'url(#h2steelX)') + vortex('#fff', 0);
      return s + R(340, 404, 60, 40, 'url(#h2steelY)');
    },
    backpass() {
      let s = P(BPH, 'url(#h2steelX)') + `<rect x="540" y="112" width="140" height="322" fill="url(#h2steelX)" stroke="${C.ol}" stroke-width="0.8" filter="url(#h2lift)"/>`;
      s += R(546, 126, 128, 302, '#14181c', ' stroke="#4b5763" stroke-width="0.8"') + R(608, 126, 4, 190, 'url(#h2steelX)', '');
      for (const b of BANKS) s += T(b.x + b.w / 2, b.y - 3, b.n, { z: 7.5, c: '#9aa6b2', a: 'middle', ls: 0.3 }) + `<path d="${bankPath(b)}" fill="none" stroke="#1b2026" stroke-width="3.2" stroke-linejoin="round"/><path d="${bankPath(b)}" fill="none" stroke="#9aa7b4" stroke-width="1.7" stroke-linejoin="round"/>`;
      return s + bpGas('#000', 0).replace('<g data-k="bpgas">', '<g data-k="bpgas" opacity="0">');
    },
    aph() {
      let s = P('M836 502 H924 L918 494 H842 Z', 'url(#h2steelY)') + `<rect x="840" y="502" width="80" height="158" fill="url(#h2steelX)" stroke="${C.ol}" stroke-width="0.8" filter="url(#h2lift)"/>`;
      return s + R(848, 512, 64, 138, 'url(#h2aphT)', ' stroke="#4b5763" stroke-width="0.8"') + R(844, 582, 72, 3, '#2a3138', '');
    },
    esp() {
      let s = '';
      espHop().forEach((d, i) => (s += P(d, 'url(#h2steelX)') + R(990 + i * 52, 628, 20, 12, 'url(#h2darkY)')));
      s += P(ESPBODY, 'url(#h2steelX)', ` stroke="${C.ol}" stroke-width="0.8" filter="url(#h2lift)"`);
      for (const x of [966, 1018, 1070, 1130]) s += `<line x1="${x}" y1="642" x2="${x}" y2="738" stroke="#000" stroke-opacity="0.35"/>`;
      for (let i = 0; i < 3; i++) s += `<rect x="${976 + i * 52}" y="650" width="34" height="80" fill="url(#h2tubes)"/>`;
      return s;
    },
    stack: () => `<path d="M1300 760 L1308 228 H1336 L1344 760 Z" fill="url(#h2concX)" stroke="#0b0f13" stroke-width="0.8" filter="url(#h2lift)"/>` + R(1305, 250, 34, 3, '#3a3d40', '') + smoke('#c9cdd1', 0.35, 4)
  };
  /* ---- THERMAL: dark, fine silhouettes, colour = temperature, glowing flow ---- */
  const COL = { air: '#3b82f6', hot: '#f59e0b', gas: '#ef4444', gasm: '#f97316', gasc: '#9ca3af', sol: '#d97706' };
  STYLES.thermal = {
    name: 'THERMAL',
    C: {
      bg: '#0e1216', frame: '#080b0e', alarmBar: '#0b0f12', ol: '#5d6b78', olw: 1.1, text: '#e2e8ee', name: '#c9d3dc', lab: '#9aa7b4', dim: '#738190',
      unit: '#7d8a97', val: '#f1f5f9', sv: '#a9bccf', none: '#56616c', box: '#06090c', boxs: '#2b3743', chip: '#121920', chipS: '#2f3c48',
      track: '#26313b', bar: '#38bdf8', rule: '#25303a', run: '#ef4444', stop: '#22c55e', alarm: '#ef4444', warn: '#fbbf24', cas: '#38bdf8',
      aut: '#cbd5e1', ok: '#4ade80', off: '#262d34', nav: '#121920', navOn: '#e2e8ee', navOnT: '#0e1216', hover: '#1a232c',
      eq: '#141a20', eqIn: '#5d6b78', imp: '#3b82f6', blade: '#e2e8f0', bedHot: '#fff7ed', bedCold: '#c9d3dc',
      heat: v => (v >= 955 ? '#ef4444' : v >= 935 ? '#f97316' : '#f59e0b')
    },
    defs: `<filter id="h2glow" x="-0.5" y="-0.5" width="2" height="2"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<radialGradient id="h2furHeat" cx="0.5" cy="0.92" r="1"><stop offset="0" stop-color="#ffcc66" stop-opacity="0.95"/><stop offset="0.25" stop-color="#ef4444" stop-opacity="0.7"/><stop offset="0.7" stop-color="#b91c1c" stop-opacity="0.35"/><stop offset="1" stop-color="#7f1d1d" stop-opacity="0.15"/></radialGradient>
<linearGradient id="h2bpHeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef4444" stop-opacity="0.45"/><stop offset="0.55" stop-color="#f97316" stop-opacity="0.28"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0.18"/></linearGradient>
<linearGradient id="h2cyHeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef4444" stop-opacity="0.45"/><stop offset="1" stop-color="#d97706" stop-opacity="0.35"/></linearGradient>
<linearGradient id="h2aphGas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f97316" stop-opacity="0.45"/><stop offset="1" stop-color="#9ca3af" stop-opacity="0.3"/></linearGradient>
<linearGradient id="h2aphAir" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3b82f6" stop-opacity="0.45"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0.45"/></linearGradient>
<linearGradient id="h2legend" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b82f6"/><stop offset="0.35" stop-color="#f59e0b"/><stop offset="0.65" stop-color="#f97316"/><stop offset="1" stop-color="#ef4444"/></linearGradient>`,
    /* translucent tube: coloured wall, dark inside, tinted core */
    pipe: [
      [m => COL[m], 2, 0.85, 1],
      [() => '#0e1216', 0, 1, 0],
      [m => COL[m], 0, 0.22, 1],
      [m => COL[m], -0.8 , 0.5, 1]
    ],
    flow(d, i) {
      const c = COL[d.m],
        gap = d.w > 8 ? 70 : 40,
        v = d.m === 'sol' ? 35 : 110;
      return `<g data-pg="${i}"><path d="${ductPath(d)}" fill="none" stroke="${c}" stroke-width="${Math.max(2, d.w * 0.4).toFixed(1)}" stroke-linecap="round" stroke-dasharray="12 ${gap}" filter="url(#h2glow)"><animate attributeName="stroke-dashoffset" from="${12 + gap}" to="0" dur="${((gap / v) * 1.6).toFixed(2)}s" repeatCount="indefinite"/></path></g>`;
    },
    extra: () => T(760, 58, 'COLD', { z: 8, b: 600, c: C.dim, a: 'end', ls: 0.5 }) + '<rect x="766" y="52" width="150" height="5" rx="2.5" fill="url(#h2legend)"/>' + T(922, 58, 'HOT', { z: 8, b: 600, c: C.dim, ls: 0.5 }) + T(841, 70, 'colour = medium temperature', { z: 8, c: C.dim, a: 'middle' }),
    drum() {
      const x = 150, y = 64, w = 142, h = 26;
      let s = '';
      for (const xx of [194, 221, 248]) s += `<line x1="${xx}" y1="${y + h}" x2="${xx}" y2="120" stroke="#3b82f6" stroke-opacity="0.7" stroke-width="2"/>`;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#141a20" stroke="${C.ol}" stroke-width="1.2"/><rect x="${x + 6}" y="${y + 13}" width="${w - 12}" height="${h / 2 - 3}" rx="4" fill="#3b82f6" fill-opacity="0.35"/>`;
      return s + `<line x1="${x + 8}" y1="${y + 13}" x2="${x + w - 8}" y2="${y + 13}" stroke="#7dd3fc" stroke-width="1.2" filter="url(#h2glow)"><animate attributeName="stroke-opacity" values="1;0.5;1" dur="2.4s" repeatCount="indefinite"/></line>`;
    },
    furnace() {
      let s = P(FURL, '#141a20') + P('M164 600 L192 646 L248 646 L276 600 Z', '#ef4444', ' fill-opacity="0.55" data-k="heat0"');
      s += R(185, 650, 70, 40, '#141a20') + R(189, 654, 62, 32, '#f59e0b', ' fill-opacity="0.22"') + R(160, 120, 120, 480, '#141a20');
      s += '<g data-k="heat"><rect x="163" y="123" width="114" height="477" fill="url(#h2furHeat)"><animate attributeName="opacity" values="0.9;1;0.82;0.95;0.9" dur="3.2s" repeatCount="indefinite"/></rect></g>';
      for (let i = 0; i < 9; i++) s += `<line x1="${168 + i * 13}" y1="126" x2="${168 + i * 13}" y2="596" stroke="#000" stroke-opacity="0.18"/>`;
      return s + rising('#fde68a', 18, 1, 1) + T(220, 142, 'FURNACE', { z: 10, b: 700, c: '#fde2c4', a: 'middle', ls: 0.8 });
    },
    cyclone() {
      let s = R(356, 116, 18, 14, '#141a20') + `<path d="${CYC}" fill="#141a20" stroke="${C.ol}" stroke-width="1.1"/><path d="${CYC}" fill="url(#h2cyHeat)" data-k="heat"/>`;
      s += `<path d="${VORTEX}" fill="none" stroke="#fbbf24" stroke-opacity="0.18" stroke-width="1"/>` + vortex('#fbbf24', 6, 1);
      s += R(360, 338, 12, 66, '#141a20') + R(362, 340, 8, 62, '#d97706', ' fill-opacity="0.4" data-k="heat"');
      return s + R(340, 404, 60, 40, '#141a20') + R(342, 422, 56, 20, '#d97706', ' fill-opacity="0.45" data-k="heat"');
    },
    backpass() {
      let s = P(BPH, '#141a20') + R(540, 112, 140, 322, '#141a20') + R(543, 115, 134, 319, 'url(#h2bpHeat)', ' data-k="heat"') + R(608, 122, 4, 196, '#2a333c', '');
      for (const b of BANKS) s += T(b.x + b.w / 2, b.y - 3, b.n, { z: 7.5, b: 600, c: '#c6ced6', a: 'middle', ls: 0.3 }) + `<path d="${bankPath(b)}" fill="none" stroke="${b.hot ? '#fca5a5' : '#93c5fd'}" stroke-opacity="0.8" stroke-width="1.1" stroke-linejoin="round"/>`;
      return s + bpGas('#fca5a5', 1);
    },
    aph() {
      let s = P('M836 502 H924 L918 494 H842 Z', '#141a20') + R(840, 502, 80, 158, '#141a20') + R(843, 505, 37, 152, 'url(#h2aphAir)', '') + R(880, 505, 37, 152, 'url(#h2aphGas)', ' data-k="heat"');
      for (let x = 848; x < 916; x += 6) s += `<line x1="${x}" y1="510" x2="${x}" y2="652" stroke="#cbd5e1" stroke-opacity="0.25" stroke-width="1"/>`;
      return s;
    },
    esp() {
      let s = '';
      espHop().forEach((d, i) => (s += P(d, '#141a20') + R(990 + i * 52, 628, 20, 12, '#141a20')));
      s += P(ESPBODY, '#141a20') + R(969, 643, 158, 94, '#9ca3af', ' fill-opacity="0.12"');
      for (let x = 976; x < 1126; x += 10) s += `<line x1="${x}" y1="648" x2="${x}" y2="732" stroke="#a5b4fc" stroke-opacity="0.35" stroke-width="1"><animate attributeName="stroke-opacity" values="0.35;0.15;0.4;0.35" dur="${(1.5 + (x % 30) / 20).toFixed(2)}s" repeatCount="indefinite"/></line>`;
      for (const x of [966, 1018, 1070, 1130]) s += `<line x1="${x}" y1="640" x2="${x}" y2="740" stroke="${C.ol}" stroke-width="1.1"/>`;
      return s;
    },
    stack: () => `<path d="M1300 760 L1308 228 H1336 L1344 760 Z" fill="#141a20" stroke="${C.ol}" stroke-width="1.1"/><path d="M1304 756 L1311 232 H1333 L1340 756 Z" fill="#9ca3af" fill-opacity="0.12"/>` + smoke('#9ca3af', 0.3, 4)
  };
  const ORDER = ['cut', 'steel', 'thermal'];
  let SK = 'cut';
  try {
    const k = localStorage.getItem('ls-hmi-style');
    if (STYLES[k]) SK = k;
  } catch (e) {}

  /* ---------- shared drawing (every style) ---------- */
  /* all ducts in layers: every wall first, then every inside, so elbows and tees join cleanly */
  function pipes(S) {
    let s = '';
    S.pipe.forEach(([col, dw, op, fl]) => {
      DUCTS.forEach((d, i) => {
        const w = d.w + (dw > -1 && dw < 0 ? dw * d.w : dw);
        if (w <= 0.5) return;
        const c = col(d.m);
        s += `<path d="${ductPath(d)}" fill="none" stroke="${c}" stroke-width="${w.toFixed(1)}" stroke-linejoin="round"${op < 1 ? ` stroke-opacity="${op}"` : ''}${fl ? ` data-in="${i}" data-c="${c}"` : ''}/>`;
      });
    });
    return s;
  }
  function intake(x, y) {
    let s = R(x - 8, y - 15, 22, 30, C.eq);
    for (let i = 0; i < 5; i++) s += `<line x1="${x - 6}" y1="${y - 11 + i * 6}" x2="${x + 12}" y2="${y - 8 + i * 6}" stroke="${C.eqIn}" stroke-width="1.2"/>`;
    return s + T(x + 3, y + 26, 'ATM', { z: 8, c: C.dim, a: 'middle' });
  }
  /* fan: volute, the impeller turns while the run bit is 1; motor with the state (red running, green stopped) */
  function fan(f, i) {
    const { cx, cy, r } = f;
    let s = '';
    /* outlet of the volute: tangent at the top, the duct starts at its end */
    if (!f.small) s += R(cx, cy - r, (f.idf ? 1252 : 280) - cx, f.idf ? 16 : 12, C.eq);
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.eq}" stroke="${C.ol}" stroke-width="${C.olw + 0.2}" filter="url(#h2lift)" data-fan="${i}"/>`;
    if (C.impFill) s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.74}" fill="${C.impFill}" stroke="${C.eqIn}" stroke-width="0.8"/>`;
    let bl = '';
    for (let k = 0; k < 9; k++) {
      const a = (k * 2 * Math.PI) / 9;
      bl += `M${(cx + Math.cos(a) * r * 0.22).toFixed(1)} ${(cy + Math.sin(a) * r * 0.22).toFixed(1)} Q${(cx + Math.cos(a + 0.3) * r * 0.5).toFixed(1)} ${(cy + Math.sin(a + 0.3) * r * 0.5).toFixed(1)} ${(cx + Math.cos(a + 0.55) * r * 0.7).toFixed(1)} ${(cy + Math.sin(a + 0.55) * r * 0.7).toFixed(1)} `;
    }
    s += `<g data-imp="${i}"><path d="${bl}" fill="none" stroke="${C.imp}" stroke-width="${f.small ? 1 : 1.7}" stroke-linecap="round"${SK === 'thermal' ? ' filter="url(#h2glow)"' : ''}/><circle cx="${cx}" cy="${cy}" r="${r * 0.17}" fill="${C.imp}"/></g>`;
    if (f.small) return s + `<circle cx="${cx}" cy="${cy + r + 6}" r="2.6" fill="${C.none}" data-mot="${i}"/>` + T(cx, cy + r + 18, f.name, { z: 8, b: 700, c: C.name, a: 'middle' });
    let mx, my;
    if (f.idf) {
      mx = cx - 12;
      my = cy + r + 8;
      s += R(cx - 7, cy + r + 1, 14, 6, C.eq, ` stroke="${C.ol}" stroke-width="1"`) + T(cx + 10, cy + r + 7, 'HC', { z: 7, b: 700, c: C.dim });
    } else {
      mx = cx + r + 6;
      my = cy + 4;
      s += `<line x1="${cx + r}" y1="${cy + 10}" x2="${mx}" y2="${cy + 10}" stroke="${C.eqIn}" stroke-width="2"/>`;
    }
    s += `<rect x="${mx}" y="${my}" width="24" height="13" rx="2" fill="${C.eq}" stroke="${C.ol}" stroke-width="1.1"/>`;
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
        s += `<line x1="${bx - 5}" y1="${d.y}" x2="${bx + 5}" y2="${d.y}" stroke="${C.blade}" stroke-width="2" stroke-linecap="round" data-bl="${bx} ${d.y}"/><circle cx="${bx}" cy="${d.y}" r="1.1" fill="${C.bg}"/>`;
      }
    } else {
      const w = d.w;
      s += `<rect x="${d.x - 8}" y="${d.y - w / 2 - 16}" width="16" height="${w + 18}" fill="#000" fill-opacity="0"/>`;
      s += R(d.x - 4, d.y - w / 2 - 2, 8, w + 4, 'none', ` stroke="${C.eqIn}" stroke-width="1.2"`);
      s += `<line x1="${d.x}" y1="${d.y - w / 2 + 1}" x2="${d.x}" y2="${d.y + w / 2 - 1}" stroke="${C.blade}" stroke-width="2.2" stroke-linecap="round" data-bl="${d.x} ${d.y}"/><circle cx="${d.x}" cy="${d.y}" r="1.4" fill="${C.bg}" stroke="${C.blade}" stroke-width="0.8"/>`;
      s += `<line x1="${d.x}" y1="${d.y - w / 2 - 2}" x2="${d.x}" y2="${d.y - w / 2 - 8}" stroke="${C.eqIn}" stroke-width="1.2"/>` + R(d.x - 6, d.y - w / 2 - 15, 12, 7, C.eq, ` stroke="${C.ol}" stroke-width="1"`);
      s += `<text x="${d.x}" y="${d.y + w / 2 + 13}" font-family="${MF}" font-size="9" fill="${C.none}" text-anchor="middle" data-dv="${i}">-----</text>`;
    }
    return s + `<title>${esc(d.tag + ' · ' + d.desc + ' · click: faceplate of ' + d.fp)}</title></g>`;
  }
  function tagBox(t, i) {
    const [x, y, tag, u, , label, , desc] = t;
    let s = label ? T(x, y - 6, label, { z: 8.5, b: 700, c: C.lab, ls: 0.5 }) : '';
    s += T(x, y + 7, tag, { z: 8.5, c: C.dim });
    s += `<rect x="${x}" y="${y + 10}" width="52" height="16" rx="2" fill="${C.box}" stroke="${C.boxs}" stroke-width="0.8" data-vb="${i}"><title>${esc(tag + ' · ' + desc)}</title></rect>`;
    s += `<text x="${x + 48}" y="${y + 22}" font-family="${MF}" font-size="11" fill="${C.none}" text-anchor="end" data-vt="${i}">-----</text>`;
    return s + T(x + 55, y + 22, u, { z: 8.5, c: C.unit });
  }
  function chip(c, i) {
    const [x, y, tag, svc] = c,
      w = 116;
    let s = `<g class="chip" style="cursor:pointer"><rect x="${x}" y="${y}" width="${w}" height="44" rx="2" fill="${C.chip}" stroke="${C.chipS}" stroke-width="0.8" data-cr="${i}"><title>${esc(tag + ' · ' + svc + ' · click: faceplate (A / M / R, SV, MV)')}</title></rect>`;
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
      s += `<rect x="${cx - 5}" y="${y + 56}" width="4.5" height="0" fill="${C.none}" data-k="bu${i}"><title>TIFG1091${c} bed temperature (upper)</title></rect>`;
      s += `<rect x="${cx + 0.5}" y="${y + 56}" width="4.5" height="0" fill="${C.none}" opacity="0.75" data-k="bl${i}"><title>TIFG1090${c} bed temperature (lower)</title></rect>`;
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
    return s + T(x, y + 8, 'No active alarm', { z: 9.5, c: C.dim, k: 'alist' });
  }
  function art(S) {
    let s = (S.extra ? S.extra() : '') + pipes(S);
    s += S.drum() + NAME(221, 58, 'DRUM') + S.furnace() + NAME(220, 706, 'PLENUM') + T(220, 590, 'BED  ----- °C', { z: 8.5, b: 700, c: C.bedHot, a: 'middle', ls: 0.4, k: 'bedavg' });
    s += S.cyclone() + NAME(448, 190, 'CYCLONE A / B') + T(336, 416, 'LOOP SEAL', { z: 8.5, b: 700, c: C.name, a: 'end', ls: 0.4 });
    s += S.backpass() + NAME(505, 124, 'BACKPASS') + S.aph() + NAME(978, 556, 'AIR HEATER') + T(978, 569, 'H-1052  tubular', { z: 8.5, c: C.dim, a: 'middle' });
    s += S.esp() + NAME(1048, 790, 'ESP  Z-1010') + S.stack() + NAME(1322, 778, 'STACK') + intake(48, 760) + intake(48, 840);
    FANS.forEach((f, i) => (s += fan(f, i)));
    DAMPERS.forEach((d, i) => (s += damper(d, i)));
    DUCTS.forEach((d, i) => (s += S.flow(d, i)));
    NOTES.forEach(n => (s += T(n[0], n[1], n[2], { z: 8.5, c: C.dim, a: 'middle', ls: 0.4 })));
    TAGS.forEach((t, i) => (s += tagBox(t, i)));
    CHIPS.forEach((c, i) => (s += chip(c, i)));
    return s + panel();
  }

  /* ---------- live links ---------- */
  function airFlueGas(g, api) {
    const pg = S_('g', { transform: `translate(0 ${OY})` });
    pg.innerHTML = art(STYLES[SK]);
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
        pg.querySelectorAll(`[data-in="${i}"]`).forEach(r => r.setAttribute('stroke', on ? r.dataset.c : C.off));
      });
      if (k === 'P') {
        vis(K('solids'), on);
        vis(K('vortex'), on);
        vis(K('bedp'), on);
      }
      if (k === 'G') {
        vis(K('smoke'), on);
        vis(K('bpgas'), on);
      }
    };
    for (const k of ['G', 'S', 'P']) live(FL[k], '', v => ((flowOn[k] = v == null ? true : v > 0.5), applyFlow(k)));
    live('', 'FIFA1055', v => ((flowOn.F = v == null ? true : v > 1), applyFlow('F')));
    /* fans */
    FANS.forEach((f, i) => {
      const imp = q(`[data-imp="${i}"]`),
        mot = q(`[data-mot="${i}"]`),
        body = q(`[data-fan="${i}"]`);
      let anim = null;
      api.reg(
        { t: 'fan', tag: f.tag },
        X => {
          const ok = X && isFinite(X.v),
            on = ok && X.v > 0.5,
            col = !ok ? C.none : on ? C.run : C.stop;
          mot.setAttribute('fill', col);
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
          const d = K('fd' + i),
            t = K('ft' + i);
          d.setAttribute('fill', col);
          t.textContent = !ok ? '-----' : on ? 'RUNNING' : 'STOPPED';
          t.setAttribute('fill', col);
        },
        body
      );
      const ti = S_('title', {});
      ti.textContent = f.name + ' · run state from the DCS logic (motor: red = running, green = stopped)';
      body.append(ti);
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
          for (const b of bls) b.setAttribute('transform', `rotate(${-p * 0.9} ${b.dataset.bl})`);
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
    /* bed temperature: 18 thermocouples (TE-FG1091 A ~ I upper, TE-FG1090 A ~ I lower, ABC-026 / 027); the fire follows the average */
    const TT = {};
    const calc = () => {
      const v = Object.values(TT).filter(x => x != null),
        avg = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
      for (const [k, x] of [['bavg', avg], ['bmax', v.length ? Math.max(...v) : null], ['bmin', v.length ? Math.min(...v) : null]]) {
        K(k).textContent = fmt(x, 0);
        K(k).setAttribute('fill', x == null ? C.none : C.val);
      }
      const op = avg == null ? 1 : Math.max(0.06, Math.min(1, (avg - 60) / 700));
      pg.querySelectorAll('[data-k="heat"],[data-k="heat0"]').forEach(e => e.setAttribute('opacity', op));
      K('bedavg').textContent = 'BED  ' + fmt(avg, 0) + ' °C';
      K('bedavg').setAttribute('fill', op > 0.4 ? C.bedHot : C.bedCold);
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
          bar.setAttribute('fill', v == null ? C.none : C.heat(v));
          t.textContent = v == null ? '---' : fmt(v, 0);
          t.setAttribute('fill', v == null ? C.none : s === 'u' ? C.val : C.sv);
          calc();
        }, bar);
      })
    );
    return pg;
  }
  const SCREENS = { AFG: airFlueGas };

  /* ---------- frame: title with the process header, alarm bar, navigation with the style choice ---------- */
  function frame(g, sys, api) {
    const W = sys.w,
      H = sys.h,
      tx = (x, y, s, o, p) => {
        const e = S_('g', {});
        e.innerHTML = T(x, y, s, o);
        const t = e.firstChild;
        (p || g).append(t);
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
    g.append(S_('rect', { x: 0, y: 34, width: W, height: 20, fill: C.alarmBar }));
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
    /* navigation: buttons to the related screens (the old screens open until the new set replaces them); STYLE at the right */
    const y = H - 32;
    g.append(S_('rect', { x: 0, y, width: W, height: 32, fill: C.frame }));
    const btn = (x, s, on, title, go) => {
      const w = s.length * 6.3 + 22,
        gg = S_('g', { class: on ? '' : 'h2btn', style: on ? '' : 'cursor:pointer' });
      gg.append(S_('rect', { x, y: y + 6, width: w, height: 20, rx: 3, fill: on ? C.navOn : C.nav, stroke: C.chipS, 'stroke-width': 0.6 }));
      tx(x + w / 2, y + 19.5, s, { z: 8.5, b: 600, c: on ? C.navOnT : C.lab, a: 'middle', ls: 0.4 }, gg);
      const ti = S_('title', {});
      ti.textContent = title;
      gg.append(ti);
      if (!on && go) gg.addEventListener('click', e => (e.stopPropagation(), go()));
      g.append(gg);
      return w;
    };
    let x = 12;
    for (const [id, s] of NAV) x += btn(x, s, id === sys.id, id === sys.id ? 'this screen' : 'open ' + s, api.go && (() => api.go(id))) + 6;
    x = W - 12 - ORDER.reduce((a, k) => a + STYLES[k].name.length * 6.3 + 28, 0);
    tx(x - 8, y + 19.5, 'STYLE', { z: 8.5, b: 700, c: C.dim, a: 'end', ls: 0.6 });
    for (const k of ORDER)
      x +=
        btn(x, STYLES[k].name, k === SK, k === SK ? 'graphic style in use' : 'show the graphics in the ' + STYLES[k].name.toLowerCase() + ' style', () => {
          SK = k;
          try {
            localStorage.setItem('ls-hmi-style', k);
          } catch (e) {}
          if (api.go) api.go(sys.id);
        }) + 6;
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
    styles: ORDER,
    get style() {
      return SK;
    },
    draw(g, sys, api) {
      const S = STYLES[SK];
      for (const k in C) delete C[k];
      Object.assign(C, S.C);
      const defs = S_('defs', {});
      defs.innerHTML =
        S.defs +
        `<filter id="h2blur" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="3"/></filter>` +
        (SK === 'thermal' ? '' : `<filter id="h2glow" x="-0.5" y="-0.5" width="2" height="2"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`) +
        (SK === 'thermal' ? `<filter id="h2lift"><feOffset dx="0" dy="0"/></filter>` : '') +
        `<style>.h2blink{animation:h2blink 1s steps(2,start) infinite}@keyframes h2blink{to{visibility:hidden}}@media (prefers-reduced-motion:reduce){.h2blink{animation:none}}.h2btn:hover rect{fill:${C.hover}}</style>`;
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
