/* INSTRUMENT & PLANT AIR (roadmap step 6, PR-OPE-5002 sections 9 ~ 12 "INSTRUMENT AIR DRYER", "INSTRUMENT AIR COMPRESSOR/MOTOR",
   "PLANT AIR DRYER", "PLANT AIR COMPRESSOR/MOTOR"). Own vector graphics in the STEEL style of 030 SEAWATER and MAKE-UP WATER, after the
   flow diagram K1AU3-PD-023 Rev C COMPRESSED AIR SYSTEM sheet 2/6 (instrument air) and sheet 1/6 (plant air), flow-diagram
   K1AU3-A1-0-001 RA pages 24 / 23 (no Rev B of these sheets). Two systems of the same build, one band each:
   - air intake + silencer Z-0712x / Z-0710x -> compressor package C-0704A / B / C (IA) or C-0703A / B / C (PA) with its motor M-070xx,
     lube oil system Z-070xx, intercoolers (vendor package), check valve V-xA0001 ~ 0005 -> discharge header xA-0-013;
   - dryer trains D-0704A ~ C / D-0703A ~ C: inlet V-xA0007 ~ 9, pre-filters S-070xA1 / A2, refrigerated dryer, after-filters A3 / A4,
     PT-xA0107 / 0127 / 0147 (dryer outlet), check V-xA0010 ~ 12 -> header xA-0-020;
   - air tanks T-0706A / B (IA, 5 m3) or T-0705A / B (PA, 10 m3): PT-IA0706-A / B, PT-PA0705-A / B -> distribution: unit 1
     (PT-IA1706 / PSL-IA1706, PT-PA1705 / PSL-PA1705), unit 2, utility area; cross-tie PA -> IA tanks V-PA0013; start-up compressor C-0707.
   Logic: DITL-113 (IA compressors) / DITL-114 (PA compressors): RUNNING / TRIP contacts of the local panel (rows 6 / 13 / 20, 7 / 14 /
   21), auto start of a standby compressor when 2 of 3 pressures < 5 kg/cm2 for 3 s (M.0300 / M.0310, START COMMAND to the local panel);
   DITL-45 (+ machine instances #B / #C): dryer START / STOP P.B. on the CRT, REMOTE, ALARM, RUNNING; DITL-03G rows 9 ~ 11: MFT on
   instrument air < 3.5 kg/cm2 (2 of 3), row 7 PSL-IA1706. The PA compressor VCB on / off is an STN105 DI that no logic sheet reads.
   Run state = the drawings of the one world (red = running, green = stopped, red blinking = trip). Values = the plant model (unit.js
   AN_AIR, written into the analog rows of DITL-113 / 114 / 03G by plantsw.js, so the logic reads the same number); never from this
   page. Drawn in a 1760 x 900 space, placed 1 : 1 in the 1920 x 1000 frame of hmi2.js, between its alarm bar and its navigation. */
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
    band: '#151b21',
    /* media: i instrument air (dry), p plant air, w wet air (compressor discharge, before the dryers) */
    med: {
      i: ['#6f8fb3', '#dbe8f6'],
      p: ['#8a8f6a', '#eef0d6'],
      w: ['#7d8791', '#e6ebef'],
      off: ['#3a424b', null]
    }
  };
  const T = (x, y, s, c, a) => `<text x="${x}" y="${y}" class="${c}"${a ? ' ' + a : ''}>${s}</text>`;
  const OL = `stroke="${S.ol}" stroke-width="1"`;
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  /* the two systems: [key, band top, title, P&ID sheet, compressor drawing, letter of the tag (IA / PA), equipment numbers, tank m3,
     dryer RUNNING row of DITL-45 (0-based), REMOTE row, ALARM row, unit 1 transmitter, low switch, auto start memory] */
  const SYS = [
    {
      k: 'ia',
      y: 0,
      ttl: 'INSTRUMENT AIR',
      dwg: 'K1AU3-PD-023 2/6',
      c: 'DITL-113',
      x: 'IA',
      cn: '0704',
      sil: '0712',
      lo: '0704',
      tk: '0706',
      m3: 5,
      dr: 14,
      rem: 15,
      alm: 16,
      ut: '1706',
      mem: 'M.0300',
      cur: 500,
      fr: 2700,
      sec: 'SOP section 9 / 10'
    },
    {
      k: 'pa',
      y: 452,
      ttl: 'PLANT AIR',
      dwg: 'K1AU3-PD-023 1/6',
      c: 'DITL-114',
      x: 'PA',
      cn: '0703',
      sil: '0710',
      lo: '0703',
      tk: '0705',
      m3: 10,
      dr: 3,
      rem: 4,
      alm: 5,
      ut: '1705',
      mem: 'M.0310',
      cur: 140,
      fr: 5800,
      sec: 'SOP section 11 / 12'
    }
  ];
  const LET = ['A', 'B', 'C'],
    LY = [104, 214, 324],
    DRY = ['DITL-45', 'DITL-45 #B', 'DITL-45 #C'],
    ROW = [5, 12, 19];

  function art() {
    const o = [],
      B = [],
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
        G[3].push(
          `<path d="${d}" class="iafl" data-f="${f}" stroke="${med[1]}" stroke-width="${w > 10 ? 2.4 : w > 5 ? 1.8 : 1.3}"/>`
        );
    };
    const vbox = (x, y, tag, u, k) =>
      `<g data-vb="${k || tag}" style="cursor:pointer">${T(x, y - 4, tag, 'ia9')}<rect x="${x}" y="${y}" width="58" height="17" rx="1.5" fill="${S.box}" stroke="${S.boxs}"/>${T(x + 54, y + 13, '-----', 'iav', `text-anchor="end" data-v="${k || tag}"`)}${T(x + 62, y + 13, u, 'ia9')}</g>`;
    /* manual valve of the field (no DCS signal): grey */
    const valve = (x, y, vert, lab, la) => {
      const b = vert
        ? `M${x - 6} ${y - 7} L${x + 6} ${y - 7} L${x - 6} ${y + 7} L${x + 6} ${y + 7} Z`
        : `M${x - 7} ${y - 6} L${x + 7} ${y + 6} L${x + 7} ${y - 6} L${x - 7} ${y + 6} Z`;
      const t = !lab
        ? ''
        : la === 'up'
          ? T(x, y - 10, lab, 'ia8', 'text-anchor="middle"')
          : la === 'dn'
            ? T(x, y + 18, lab, 'ia8', 'text-anchor="middle"')
            : la === 'l'
              ? T(x - 9, y + 3, lab, 'ia8', 'text-anchor="end"')
              : T(x + 10, y + 3, lab, 'ia8');
      return `<g><title>${lab} · manual valve (field)</title><path d="${b}" fill="${S.m[1]}" ${OL}/>${t}</g>`;
    };
    /* check valve (flow left -> right) */
    const check = (x, y, lab, la) =>
      `<g><title>${lab} · check valve</title><path d="M${x - 7} ${y - 6} L${x + 7} ${y} L${x - 7} ${y + 6} Z" fill="${S.m[1]}" ${OL}/><line x1="${x + 7}" y1="${y - 6}" x2="${x + 7}" y2="${y + 6}" stroke="${S.ol}" stroke-width="2"/>${T(x, la === 'up' ? y - 10 : y + 18, lab, 'ia8', 'text-anchor="middle"')}</g>`;
    /* air filter (coalescing element in a housing) with its DP gauge (package, local) */
    const filt = (x, y, tag) =>
      `<g><title>${tag} · air filter (local DP gauge, no DCS signal)</title><path d="M${x} ${y - 11} L${x + 11} ${y} L${x} ${y + 11} L${x - 11} ${y} Z" fill="url(#iamv)" ${OL}/><line x1="${x - 7}" y1="${y}" x2="${x + 7}" y2="${y}" stroke="#59636d" stroke-dasharray="2 2"/>${T(x, y - 15, tag, 'ia8', 'text-anchor="middle"')}</g>`;
    /* the silencer of the air intake */
    const silencer = (x, y, tag) =>
      `<g><title>${tag} · air intake silencer</title><path d="M${x - 22} ${y - 8} L${x + 8} ${y - 8} L${x + 14} ${y - 4} V${y + 4} L${x + 8} ${y + 8} H${x - 22} Z" fill="url(#iamv)" ${OL}/>${[-14, -6, 2].map(d => `<line x1="${x + d}" y1="${y - 8}" x2="${x + d}" y2="${y + 8}" stroke="${S.ol}" stroke-opacity=".5"/>`).join('')}${T(x - 4, y + 21, tag, 'ia8', 'text-anchor="middle"')}</g>`;
    /* the compressor package: motor (left), screw / stage casing (right), lamp under the motor (red RUN, green STOP) */
    const comp = (x, y, id) =>
      `<g data-hit="${id}" style="cursor:pointer"><rect x="${x}" y="${y - 22}" width="62" height="44" rx="4" fill="url(#iamt)" ${OL}/>${[-14, -6, 2, 10].map(d => `<line x1="${x + 3}" y1="${y + d}" x2="${x + 59}" y2="${y + d}" stroke="${S.ol}" stroke-opacity=".45"/>`).join('')}<rect x="${x}" y="${y + 22}" width="62" height="4" fill="${S.none}" data-lamp="${id}"/><rect x="${x + 62}" y="${y - 5}" width="12" height="10" fill="${S.m[1]}" ${OL}/><path d="M${x + 74} ${y - 26} H${x + 130} Q${x + 140} ${y - 26} ${x + 140} ${y - 16} V${y + 16} Q${x + 140} ${y + 26} ${x + 130} ${y + 26} H${x + 74} Z" fill="url(#iamv)" ${OL}/><g data-imp="${id}" transform="translate(${x + 107} ${y})">${[0, 1, 2].map(i => `<path d="M-15 0 Q0 -9 15 0" transform="rotate(${i * 60})" stroke="#c3ccd5" stroke-width="2.4" fill="none" stroke-linecap="round"/>`).join('')}</g><circle cx="${x + 107}" cy="${y}" r="3.5" fill="#c3ccd5"/></g>`;
    /* the refrigerated dryer: cabinet with the heat exchanger and a lamp */
    const dryer = (x, y, id) =>
      `<g data-hit="${id}" style="cursor:pointer"><rect x="${x}" y="${y - 24}" width="86" height="48" rx="4" fill="url(#iamt)" ${OL}/><rect x="${x + 8}" y="${y - 16}" width="44" height="32" rx="2" fill="#232a31" stroke="#59636d"/>${[0, 1, 2, 3].map(i => `<path d="M${x + 12} ${y - 10 + i * 7} h36" stroke="#5d7f9e" stroke-width="1.6"/>`).join('')}<circle cx="${x + 68}" cy="${y - 4}" r="8" fill="#1b2127" stroke="#59636d"/><g data-imp="${id}" transform="translate(${x + 68} ${y - 4})"><path d="M-6 0 H6 M0 -6 V6" stroke="#c3ccd5" stroke-width="1.6"/></g><rect x="${x}" y="${y + 24}" width="86" height="4" fill="${S.none}" data-lamp="${id}"/></g>`;

    for (const Y of SYS) {
      const y0 = Y.y,
        X = Y.x,
        m = Y.k === 'ia' ? 'i' : 'p',
        k = Y.k;
      /* the band of the system, under the pipes */
      B.push(`<rect x="8" y="${y0 + 6}" width="1744" height="440" rx="4" fill="${S.band}" stroke="#262e36"/>`);
      o.push(
        T(24, y0 + 26, Y.ttl + ' SYSTEM', 'ia13') +
          T(24 + Y.ttl.length * 9.4 + 76, y0 + 26, `P&amp;ID ${Y.dwg} · ${Y.sec} · common to units 1 and 2`, 'ia8')
      );
      /* ---------- compressors ---------- */
      o.push(T(140, y0 + 44, `${X === 'IA' ? 'INSTRUMENT' : 'PLANT'} AIR COMPRESSORS  (local panel LCP · ${Y.c})`, 'ia11'));
      LY.forEach((ly, i) => {
        const yy = y0 + ly,
          id = k + 'c' + i,
          L = LET[i];
        pipe(
          [
            [30, yy - 30],
            [54, yy - 30],
            [54, yy],
            [140, yy]
          ],
          'w',
          5,
          id
        );
        o.push(T(26, yy - 36, 'AIR INTAKE', 'ia8'));
        o.push(silencer(96, yy, 'Z-' + Y.sil + L));
        o.push(comp(140, yy, id));
        o.push(
          T(212, yy - 46, (X === 'IA' ? 'IA' : 'PA') + ' COMPRESSOR-' + L, 'ia11', `text-anchor="middle" data-hit="${id}"`) /* #48 */ +
            T(212, yy - 34, 'C-' + Y.cn + L + ' · M-' + Y.cn + L, 'ia8', 'text-anchor="middle"')
        );
        o.push(
          T(171, yy + 40, '-----', 'ia9b', `text-anchor="middle" data-st="${id}"`) +
            T(247, yy + 40, 'LCP', 'ia9b', `text-anchor="middle" style="fill:#ffd27a"`)
        );
        if (X === 'PA') o.push(T(171, yy + 52, '-----', 'ia9b', `text-anchor="middle" data-vcb="${id}"`));
        o.push(T(247, yy + 52, 'Z-' + Y.lo + L + ' lube oil', 'ia8', 'text-anchor="middle"'));
        /* discharge: check valve -> header */
        pipe(
          [
            [280, yy],
            [470, yy]
          ],
          'w',
          6,
          id
        );
        o.push(check(392, yy, 'V-' + X + '000' + (i + 1 === 3 ? 5 : i + 1 === 2 ? 3 : 1), 'up'));
        o.push(vbox(296, yy + 20, 'II' + 'C' + Y.cn + L, 'A', id + 'I'));
        if (X === 'PA')
          o.push(
            vbox(296, yy - 44, 'TIM0703' + L + '1', '°C', id + 'W') + T(296, yy - 22, 'motor winding U', 'ia8')
          );
      });
      /* discharge header xA-0-013 6" */
      pipe(
        [
          [470, y0 + LY[0]],
          [490, y0 + LY[0]],
          [490, y0 + LY[2]],
          [470, y0 + LY[2]]
        ],
        'w',
        10,
        k
      );
      pipe(
        [
          [470, y0 + LY[1]],
          [490, y0 + LY[1]]
        ],
        'w',
        10,
        k
      );
      o.push(T(498, y0 + LY[2] + 46, X + '-0-013 6"', 'ia8'));
      /* the start-up compressor (IA) / the line from it (PA) */
      pipe(
        [
          [400, y0 + 428],
          [490, y0 + 428],
          [490, y0 + LY[2]]
        ],
        'w',
        4,
        ''
      );
      o.push(
        X === 'IA'
          ? T(30, y0 + 432, 'C-0707 STARTUP COMPRESSOR (portable, ambient start-up) · IA-0-031 2"', 'ia8')
          : T(30, y0 + 432, 'FROM STARTUP COMPRESSOR (IA-0-044 2", K1AU3-PD-023 2/6)', 'ia8')
      );
      /* the auto start of a standby compressor (DITL-113 / 114) */
      o.push(
        T(30, y0 + 400, `STANDBY AUTO START: 2 of 3 pressures &lt; 5.0 kg/cm² for 3 s (${Y.mem}) → START COMMAND to the LCP`, 'ia8') +
          T(30, y0 + 413, '-----', 'ia9b', `data-am="${k}"`)
      );
      /* ---------- dryers ---------- */
      o.push(T(560, y0 + 44, `${X === 'IA' ? 'INSTRUMENT' : 'PLANT'} AIR DRYERS  (CRT START / STOP · DITL-45)`, 'ia11'));
      LY.forEach((ly, i) => {
        const yy = y0 + ly,
          id = k + 'd' + i,
          L = LET[i];
        pipe(
          [
            [490, yy],
            [1010, yy]
          ],
          'w',
          6,
          id
        );
        o.push(valve(520, yy, 0, 'V-' + X + '000' + (7 + i), 'dn'));
        o.push(filt(562, yy, 'S-' + Y.cn + L + '1/2'));
        o.push(dryer(620, yy, id));
        o.push(filt(756, yy, 'S-' + Y.cn + L + '3/4'));
        o.push(check(866, yy, 'V-' + X + '00' + (10 + i), 'dn'));
        o.push(
          T(663, yy - 46, (X === 'IA' ? 'IA' : 'PA') + ' DRYER-' + L, 'ia11', `text-anchor="middle" data-hit="${id}"`) /* #48 */ +
            T(663, yy - 34, 'D-' + Y.cn + L + ' · ' + DRY[i], 'ia8', 'text-anchor="middle"')
        );
        o.push(
          T(614, yy + 42, '-----', 'ia9b', `text-anchor="middle" data-st="${id}"`) +
            T(663, yy + 42, '---', 'ia9b', `text-anchor="middle" data-rem="${id}"`) +
            T(712, yy + 42, '-----', 'ia9b', `text-anchor="middle" data-alm="${id}"`)
        );
        o.push(vbox(786, yy - 44, 'FID' + Y.cn + L, 'm³/h', id + 'F'));
        o.push(vbox(786, yy + 22, 'PI' + X + '01' + i * 2 + '7', 'kg/cm²', id + 'P'));
      });
      /* dryer outlet header xA-0-020 6" -> tanks */
      pipe(
        [
          [1010, y0 + LY[0]],
          [1030, y0 + LY[0]],
          [1030, y0 + LY[2]],
          [1010, y0 + LY[2]]
        ],
        m,
        10,
        k
      );
      pipe(
        [
          [1010, y0 + LY[1]],
          [1030, y0 + LY[1]]
        ],
        m,
        10,
        k
      );
      o.push(T(1038, y0 + LY[2] + 46, X + '-0-020 6"', 'ia8'));
      /* ---------- air tanks ---------- */
      const TX = [1090, 1220],
        TY = y0 + 120,
        TW = 92,
        TH = 170;
      pipe(
        [
          [1030, y0 + 72],
          [TX[1] + TW / 2, y0 + 72],
          [TX[1] + TW / 2, TY]
        ],
        m,
        8,
        k
      );
      pipe(
        [
          [TX[0] + TW / 2, y0 + 72],
          [TX[0] + TW / 2, TY]
        ],
        m,
        8,
        k
      );
      o.push(valve(TX[0] + TW / 2, y0 + 96, 1, 'V-' + X + (X === 'IA' ? '0018' : '0029'), 'l'));
      /* the cross-tie PA -> IA tanks (V-PA0013, IA-0-030 / PA-0-033 6") */
      if (X === 'IA') {
        pipe(
          [
            [TX[1] + TW / 2 + 40, y0 + 40],
            [TX[1] + TW / 2 + 40, y0 + 72],
            [TX[1] + TW / 2, y0 + 72]
          ],
          'p',
          5,
          ''
        );
        o.push(valve(TX[1] + TW / 2 + 40, y0 + 56, 1, '', '') + T(TX[1] + TW / 2 + 52, y0 + 46, 'FROM PLANT AIR · V-PA0013 (IA-0-030 6")', 'ia8'));
      } else
        o.push(T(TX[1] + TW / 2 + 12, y0 + 62, 'TO IA TANKS · V-PA0013 (PA-0-033 6")', 'ia8'));
      ['B', 'A'].forEach((L, j) => {
        const x = TX[j];
        o.push(
          `<g data-hit="${k}t${L}" style="cursor:pointer"><path d="M${x} ${TY + 26} Q${x + TW / 2} ${TY - 14} ${x + TW} ${TY + 26} V${TY + TH - 26} Q${x + TW / 2} ${TY + TH + 14} ${x} ${TY + TH - 26} Z" fill="url(#iamt)" ${OL}/><rect x="${x + 14}" y="${TY + 34}" width="${TW - 28}" height="${TH - 68}" rx="3" fill="#232a31" stroke="#59636d"/><rect x="${x + 14}" y="${TY + TH - 34}" width="${TW - 28}" height="0" fill="#5d7f9e" fill-opacity=".55" data-k="${k}t${L}"/><path d="M${x + 10} ${TY + TH + 2} l-8 18 M${x + TW - 10} ${TY + TH + 2} l8 18" stroke="#59636d" stroke-width="3"/></g>`
        );
        o.push(
          T(x + TW / 2, TY + 50, 'T-' + Y.tk + L, 'ia11', 'text-anchor="middle"') +
            T(x + TW / 2, TY + 64, Y.m3 + ' m³ AIR TANK', 'ia8', 'text-anchor="middle" style="fill:#c9d3dc"')
        );
        o.push(vbox(x + 12, TY + TH + 56, 'PI' + X + Y.tk + L, 'kg/cm²', k + 'P' + L));
        o.push(T(x + 12, TY + TH + 86, X === 'IA' ? 'L 5.0 · LL 3.5 (MFT)' : 'L 5.0', 'ia8'));
        /* outlet: check + valve to the distribution header */
        pipe(
          [
            [x + TW, TY + TH - 40],
            [x + TW + 18, TY + TH - 40],
            [x + TW + 18, TY + TH + 30],
            [1370, TY + TH + 30]
          ],
          m,
          7,
          k
        );
      });
      o.push(T(1356, TY + TH + 46, X + '-0-022 / 023 6"', 'ia8'));
      /* ---------- distribution ---------- */
      pipe(
        [
          [1370, TY + TH + 30],
          [1370, y0 + 104],
          [1480, y0 + 104]
        ],
        m,
        10,
        k
      );
      const dest = (y, a, b) =>
        `<rect x="1508" y="${y - 15}" width="236" height="30" rx="3" fill="#232a31" stroke="#46525e"/>` +
        T(1516, y - 2, a, 'ia7') +
        T(1516, y + 10, b, 'ia8');
      const dv = X === 'IA' ? ['V-IA1101', 'V-IA2101', 'V-IA0059', 'V-IA0060'] : ['V-PA1087', 'V-PA2087', 'V-PA0028', ''];
      o.push(valve(1404, y0 + 104, 0, dv[0], 'up') + dest(y0 + 104, '▸ TO UNIT NO.1 ' + (X === 'IA' ? 'INSTRUMENT' : 'PLANT') + ' AIR', `${X}-1-${X === 'IA' ? '101 3"' : '041 6"'} · K1AU3-PD-023 ${X === 'IA' ? '4/6' : '3/6'}`));
      pipe(
        [
          [1480, y0 + 104],
          [1508, y0 + 104]
        ],
        m,
        10,
        k
      );
      [
        [y0 + 236, dv[1], '▸ TO UNIT NO.2 ' + (X === 'IA' ? 'INSTRUMENT' : 'PLANT') + ' AIR', `${X}-2-${X === 'IA' ? '101 3"' : '041 6"'}`],
        [y0 + 286, dv[2], '▸ TO UTILITY AREA', `K1AU3-PD-023 ${X === 'IA' ? '4/6' : '3/6'} · ${X}-0-${X === 'IA' ? '067' : '025'} 2"`]
      ].forEach(([y, v, a, b]) => {
        pipe(
          [
            [1370, y],
            [1508, y]
          ],
          m,
          7,
          k
        );
        o.push(valve(1404, y, 0, v, 'up') + dest(y, a, b));
      });
      /* unit 1 header transmitter and low switch */
      o.push(vbox(1420, y0 + 132, 'PI' + X + Y.ut, 'kg/cm²', k + 'PU'));
      o.push(
        T(1532, y0 + 144, 'PT-' + X + Y.ut + ' · PSL-' + X + Y.ut + ' 2.8', 'ia8') +
          T(1532, y0 + 158, X === 'IA' ? 'L 5.0 · LL 3.5 · PSL trip (MFT)' : 'L 5.0 · PSL alarm', 'ia8') +
          T(1532, y0 + 176, '-----', 'ia9b', `data-psl="${k}"`)
      );
      /* the local panel items the SOP asks the operator to check (no DCS signal) */
      const lcp =
        X === 'IA'
          ? [
              'LCP (local, no DCS signal) · SOP limits:',
              'dryer air inlet 5 ~ 50 °C · evaporator out 0 ~ 45 °C',
              'condensing 15 ~ 52 °C · discharge 40 ~ 115 °C',
              'compressor: lube oil tank NL 300 L, oil tank',
              '−1.0 ~ −2.0 kPa, filter regulator 0.5 MPa,',
              'AOP permits start after 20 s, stops after 40 s'
            ]
          : [
              'LCP (local, no DCS signal) · SOP limits:',
              'dryer air inlet 5 ~ 50 °C · evaporator out 0 ~ 45 °C',
              'suction −5 ~ 30 °C · exp. valve out 5 ~ 15 °C',
              'compressor: lube oil tank NL 300 L, load control',
              'FORCE UNLOAD at start, AUTO after RUN; APH soot',
              'blower needs plant air ≥ 7 kg/cm² (SOP 26)'
            ];
      lcp.forEach((t, i) => o.push(T(1508, y0 + 330 + i * 12, t, i ? 'ia8' : 'ia7')));
    }
    /* legend */
    o.push(
      `<rect x="760" y="415" width="18" height="5" fill="${S.med.w[0]}"/><rect x="900" y="415" width="18" height="5" fill="${S.med.i[0]}"/><rect x="1060" y="415" width="18" height="5" fill="${S.med.p[0]}"/>` +
        T(782, 421, 'WET AIR (compressor)', 'ia8') +
        T(922, 421, 'INSTRUMENT AIR (dry)', 'ia8') +
        T(1082, 421, 'PLANT AIR (dry)', 'ia8')
    );
    o.push(T(1744, 438, 'values: plant model (Plant model ON); the logic reads the same value', 'ia8', 'text-anchor="end"'));
    const defs = `<defs><linearGradient id="iamt" x1="0" x2="1"><stop offset="0" stop-color="${S.m[0]}"/><stop offset=".45" stop-color="${S.m[1]}"/><stop offset="1" stop-color="${S.m[2]}"/></linearGradient>
<linearGradient id="iamv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.m[2]}"/><stop offset=".4" stop-color="${S.m[1]}"/><stop offset="1" stop-color="${S.m[0]}"/></linearGradient></defs>`;
    const UF = "font-family:Barlow,'IBM Plex Sans','Segoe UI',Roboto,Arial,sans-serif",
      MF = "font-family:'Roboto Mono','JetBrains Mono',Consolas,monospace";
    const css = `<style>.ia7{font-size:8.5px;fill:${S.nm};${UF}}.ia8{font-size:8.5px;fill:${S.dim};${UF}}.ia9{font-size:9.5px;fill:${S.dim};${UF}}.ia9b{font-size:9.5px;font-weight:600;fill:${S.none};${UF}}.ia11{font-size:11px;font-weight:600;fill:${S.nm};${UF}}.ia13{font-size:13px;font-weight:700;letter-spacing:.6px;fill:${S.nm};${UF}}
.iav{font-size:12px;fill:${S.none};${MF}}
.iafl{fill:none;stroke-dasharray:2 14;stroke-linecap:round;animation:iafl 1.1s linear infinite}@keyframes iafl{to{stroke-dashoffset:-32}}
@media (prefers-reduced-motion:reduce){.iafl{animation:none}}</style>`;
    return css + defs + B.join('') + G.map(l => l.join('')).join('') + o.join('');
  }

  /* ---------- live links ---------- */
  function air(g, api) {
    const pg = document.createElementNS(NS, 'g');
    /* the frame of hmi2.js: title 0 ~ 34, alarm bar 34 ~ 56, navigation from 968: the page between them, centred */
    pg.setAttribute('transform', 'translate(80 60)');
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
        return f();
      } catch (e) {
        return d;
      }
    };
    const D = () => window.LS_DOCK;
    /* an input row of a drawing (the field contacts: RUNNING / TRIP of a compressor, REMOTE / ALARM of a dryer) */
    const rin = (nm, row) =>
      call(() => {
        const s = D() && D().dOf(nm);
        return s && window.DUI ? (DUI.rowVal(s, row) ? 1 : 0) : null;
      }, null);
    const rout = (nm, row) => call(() => (D() ? D().dout(nm, row) : null), null);
    const spin = {};
    const setSpin = (id, on) => {
      const el = q(`[data-imp="${id}"]`);
      if (!el) return;
      if (on && !spin[id]) {
        spin[id] = document.createElementNS(NS, 'animateTransform');
        const b = el.getAttribute('transform') || '';
        for (const [k, v] of Object.entries({
          attributeName: 'transform',
          type: 'rotate',
          from: '0',
          to: '360',
          dur: id.includes('d') ? '2s' : '0.8s',
          repeatCount: 'indefinite',
          additive: 'sum'
        }))
          spin[id].setAttribute(k, v);
        el.dataset.t0 = b;
        el.append(spin[id]);
        try {
          spin[id].beginElement();
        } catch (e) {}
      } else if (!on && spin[id]) {
        spin[id].remove();
        spin[id] = null;
        el.setAttribute('transform', el.dataset.t0 || '');
      }
    };
    const flow = (k, on) =>
      qa(`[data-f="${k}"],[data-fb="${k}"]`).forEach(e => {
        if (e.dataset.f) e.setAttribute('visibility', on ? 'visible' : 'hidden');
        else e.setAttribute('stroke', on ? e.dataset.c : S.med.off[0]);
      });
    const paint = (id, s, txt) => {
      const col = s == null ? S.none : s === 'TRIP' || s === 'RUN' ? S.run : S.stop;
      qa(`[data-lamp="${id}"]`).forEach(e => e.setAttribute('fill', col));
      qa(`[data-st="${id}"]`).forEach(e => {
        e.textContent = s == null ? '-----' : s === 'TRIP' ? 'TRIP' : s === 'RUN' ? txt || 'RUNNING' : 'STOPPED';
        e.style.fill = col;
        e.classList.toggle('h2blink', s === 'TRIP');
      });
      setSpin(id, s === 'RUN');
    };
    const ST = {},
      V = {};
    const txt = (sel, t, c, blink) => {
      const e = q(sel);
      if (!e) return;
      e.textContent = t;
      e.style.fill = c;
      e.classList.toggle('h2blink', !!blink);
    };
    const tick = () => {
      for (const Y of SYS) {
        const k = Y.k;
        let anyC = false;
        LET.forEach((L, i) => {
          /* compressor: RUNNING / TRIP contacts of the local panel on DITL-113 / 114 */
          const r = rin(Y.c, ROW[i]),
            t = rin(Y.c, ROW[i] + 1),
            s = r == null ? null : t ? 'TRIP' : r ? 'RUN' : 'STOP',
            id = k + 'c' + i;
          if (s === 'RUN') anyC = true;
          if (ST[id] !== s) {
            ST[id] = s;
            paint(id, s);
            flow(id, s === 'RUN');
            /* PA compressor VCB (STN105 DI I.0013 / 14, I.0093 / 94, I.0333 / 34; no logic sheet reads them): closed while it runs */
            qa(`[data-vcb="${id}"]`).forEach(e => {
              e.textContent = s == null ? '-----' : s === 'RUN' ? 'VCB ON' : 'VCB OFF';
              e.style.fill = s == null ? S.none : s === 'RUN' ? S.run : S.stop;
            });
          }
        });
        let nd = 0;
        const ds = LET.map((L, i) => {
          /* dryer: RUNNING output, REMOTE and ALARM inputs of DITL-45 (instance of the dryer) */
          const s0 = rout(DRY[i], Y.dr),
            s = s0 == null ? null : s0 === 1 ? 'RUN' : 'STOP',
            id = k + 'd' + i;
          if (s === 'RUN') nd++;
          if (ST[id] !== s) {
            ST[id] = s;
            paint(id, s, 'IN SERVICE');
          }
          const rm = rin(DRY[i], Y.rem),
            al = rin(DRY[i], Y.alm);
          txt(`[data-rem="${id}"]`, rm == null ? '---' : rm ? 'REM' : 'LOC', rm == null ? S.none : rm ? '#5cd6ff' : '#ffd27a');
          txt(`[data-alm="${id}"]`, al == null ? '-----' : al ? 'ALARM' : 'NO ALARM', al == null ? S.none : al ? '#ffb340' : S.dim, al === 1);
          return s;
        });
        ds.forEach((s, i) => flow(k + 'd' + i, anyC && (nd ? s === 'RUN' : true)));
        flow(k, anyC);
        /* the auto start memory (M.0300 / M.0310 = output row 1 of DITL-113 / 114) */
        const am = rout(Y.c, 0);
        txt(`[data-am="${k}"]`, am == null ? '-----' : am ? Y.mem + ' ACTIVE: tank pressure < 5.0' : Y.mem + ' normal', am == null ? S.none : am ? '#ffb340' : S.stop, am === 1);
        /* the low pressure switch of unit 1: IA = DITL-03G row 7 (the MFT); PA = STN104 DI I.052A that no logic sheet reads: the plant
           model header pressure against its alarm list set point 2.8 kg/cm2 */
        const pl =
          k === 'ia'
            ? rout('DITL-03G', 6)
            : V[k + 'PU'] == null
              ? null
              : V[k + 'PU'] < 2.8
                ? 1
                : 0;
        txt(`[data-psl="${k}"]`, pl == null ? '-----' : pl ? 'PSL-' + Y.x + Y.ut + ' LOW' : 'PSL-' + Y.x + Y.ut + ' NORMAL', pl == null ? S.none : pl ? S.run : S.stop, pl === 1);
        /* the tank pressure as the blue fill of the tank (0 ~ 10 kg/cm2) */
        for (const L of ['A', 'B']) {
          const r = q(`[data-k="${k}t${L}"]`);
          if (!r) continue;
          const v = V[k + 'P' + L],
            h = 102,
            f = v == null ? 0 : Math.max(0, Math.min(1, v / 10));
          const y1 = +r.getAttribute('y') + +r.getAttribute('height');
          r.setAttribute('height', h * f);
          r.setAttribute('y', y1 - h * f);
        }
      }
    };
    /* the values: the plant model (unit.js AN_AIR) */
    const UNIT = {},
      IO = {},
      DP = {};
    for (const Y of SYS) {
      const k = Y.k,
        X = Y.x;
      UNIT[k + 'PA'] = k + 'PA';
      UNIT[k + 'PB'] = k + 'PB';
      UNIT[k + 'PU'] = k + 'PU';
      IO[k + 'PA'] = 'PT-' + X + Y.tk + '-A';
      IO[k + 'PB'] = 'PT-' + X + Y.tk + '-B';
      IO[k + 'PU'] = 'PT-' + X + Y.ut;
      LET.forEach((L, i) => {
        UNIT[k + 'c' + i + 'I'] = k + 'I' + i;
        IO[k + 'c' + i + 'I'] = 'IT-C' + Y.cn + L;
        DP[k + 'c' + i + 'I'] = 0;
        UNIT[k + 'd' + i + 'F'] = k + 'F' + i;
        IO[k + 'd' + i + 'F'] = 'FI-D' + Y.cn + L;
        DP[k + 'd' + i + 'F'] = 0;
        UNIT[k + 'd' + i + 'P'] = k + 'PD';
        IO[k + 'd' + i + 'P'] = 'PT-' + X + '01' + (i * 2) + '7';
        if (k === 'pa') {
          UNIT[k + 'c' + i + 'W'] = 'paW' + i;
          IO[k + 'c' + i + 'W'] = 'TE-M0703-' + L + '1';
          DP[k + 'c' + i + 'W'] = 1;
        }
      });
    }
    const showV = key => {
      const t = q(`[data-v="${key}"]`);
      if (!t) return;
      const v = V[key];
      t.textContent = fmt(v, DP[key] != null ? DP[key] : 2);
      t.setAttribute('fill', v == null ? S.none : S.val);
    };
    for (const key in UNIT)
      api.reg(
        { t: 'val', tag: 'UNIT.' + UNIT[key], v: '' },
        X => ((V[key] = X && isFinite(X.v) ? +X.v : null), showV(key)),
        null
      );
    for (const key in IO) {
      const b = q(`[data-vb="${key}"]`);
      if (!b) continue;
      const ti = document.createElementNS(NS, 'title');
      ti.textContent = IO[key] + ' · plant model · click = its I/O list line';
      b.append(ti);
      b.addEventListener('click', e => (e.stopPropagation(), info(IO[key])));
      showV(key);
    }
    /* the equipment: click = info card */
    const HIT = {};
    for (const Y of SYS)
      LET.forEach((L, i) => {
        HIT[Y.k + 'c' + i] = ['MIR-C' + Y.cn + L, `${Y.ttl} compressor-${L} C-${Y.cn}${L} · ${Y.c} (LCP start; red = running, green = stopped, blinking = trip)`];
        HIT[Y.k + 'd' + i] = ['MIR-D' + Y.cn + L, `${Y.ttl} dryer-${L} D-${Y.cn}${L} · ${DRY[i]} (red = in service, green = stopped)`];
        if (i < 2) HIT[Y.k + 't' + 'AB'[i]] = ['PT-' + Y.x + Y.tk + '-' + 'AB'[i], `T-${Y.tk}${'AB'[i]} ${Y.ttl.toLowerCase()} tank · PT-${Y.x}${Y.tk}-${'AB'[i]}`];
      });
    for (const id in HIT)
      qa(`[data-hit="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = HIT[id][1] + ' · click = info card';
        h.append(ti);
        h.addEventListener('click', e => (e.stopPropagation(), info(HIT[id][0])));
      });
    tick();
    /* P2: the shared driver, only while the page is on the screen */
    HSYM.every(g, 500, tick);
    return pg;
  }
  PLANT_V2.screens.IA = air;
  /* after MAKE-UP WATER / 036 TURBINE OIL (or 030 SEAWATER) in the list of the Plant view */
  const L = (window.PLANT_SYS = window.PLANT_SYS || []),
    i = Math.max(
      L.findIndex(x => x.id === 'MU'),
      L.findIndex(x => x.id === 'TO'),
      L.findIndex(x => x.id === 'SW')
    );
  L.splice(i >= 0 ? i + 1 : L.length, 0, {
    fitAll: 1,
    id: 'IA',
    title: 'INSTRUMENT & PLANT AIR',
    num: 'IA',
    name: 'INSTRUMENT & PLANT AIR SYSTEM',
    src: 'PD-023',
    w: 1920,
    h: 1000,
    v2: true,
    screen: 'IA',
    style: 'steel',
    items: []
  });
})();
