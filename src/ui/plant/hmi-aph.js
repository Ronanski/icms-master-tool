/* 038 AIR PREHEATER (PR-OPE-5002 section 17 "start the air preheater", section 27 sootblower): the APPROVED mockup v15 as it is
   (user 2026-10-31 v14 "perfect!", v15; user 2026-11-01 "Yung mga approved. Ipalagay mo na sa app."; docs/hmi/mockups/038-air-
   preheater-v15.html, artifact ERonWczg8MEvi6AWsL7qCP). Same coordinates, colours and sizes ("ganyan na ganyan"); the drawing sits
   in an HTML layer over the plant svg that follows its pan and zoom (HSYM.layer). LIGHT (PENDING_HMI_BUILD rule 5): no CSS / SMIL
   animation on the drawing; the pipe flows and the streams in the rotor are in an overlay svg, and everything that moves (flows,
   rotor, top view, gears, fans, shafts) steps on the one 15 Hz clock of HSYM (the mockup ran ~30 fps at 6x CPU throttle).
   Live: main drive motor M1 of DITL-43 (run state LS_DOCK.mst), back-up air motor of DITL-44 (its air valve SV-PA1052, DO O.029F), the
   fans (memory list M.3302 PAF / M.3303 SAF / M.3304 IDF) move the air and gas flows, the values are the logic where a sheet reads
   the transmitter, else the plant estimate of the 007 page (PLANT_V2.EST, the same numbers on both pages). #59: click on a motor =
   the CONTROL faceplate, the Y / N square = PERMISSIVE · TREND · MONITOR (Y red = complete, N green). */
(function () {
  if (!window.PLANT_V2 || !window.HSYM) return;
  const H = HSYM;
  const M = { n: 'Air preheater', t: 'H-1052', ad: 'DITL-43', d: 'DITL-43' };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  const VW = 1280,
    VH = 830;
  /* the css of the mockup, kept to the layer */
  const CSS = `.a8{--band:#ffffff07;--dim:#7f8b96;--run:#e5484d;--stop:#2fa56a;--val:#f4f7f9;--sans:Inter,"Segoe UI",Arial,sans-serif;--mono:"IBM Plex Mono",Consolas,monospace;background:#141a20;font-family:var(--sans)}
.a8 svg{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;display:block;pointer-events:none}
.a8 .flo{will-change:transform}
.a8 .zone{fill:var(--dim);font:600 13px var(--sans);letter-spacing:.14em}
.a8 .tag{fill:#c9d1d8;font:500 13px var(--mono)}
.a8 .num{fill:var(--val);font:600 18px var(--mono)}
.a8 .unit{fill:var(--dim);font:500 12px var(--sans)}
.a8 .eq{fill:#f1f4f6;font:700 18px var(--sans);letter-spacing:.02em}
.a8 .st{font:700 11px var(--sans);letter-spacing:.12em}
.a8 .inside{fill:#f1f4f6;font:600 11px var(--sans);letter-spacing:.14em}
.a8 .card-t{fill:#f1f4f6;font:700 14px var(--sans);letter-spacing:.04em}
.a8 .card-s{fill:var(--dim);font:500 12px var(--sans)}
.a8 .pf{fill:none;stroke:#ffffff;stroke-width:2.5;stroke-dasharray:8 22;opacity:.5;stroke-linejoin:round}
.a8 .st-gas,.a8 .st-air{stroke:#ffffff;stroke-width:1.4;opacity:.35;stroke-dasharray:6 22;fill:none}
.a8 [data-hit]{pointer-events:auto;cursor:pointer}.a8 [data-hit]:focus-visible{outline:2px solid #6aa7dd}`;
  /* the static drawing of the mockup (@ = the id prefix of this page) */
  const ART = `<defs>
<linearGradient id="@metalV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2c343c"/><stop offset=".3" stop-color="#7d8892"/><stop offset=".45" stop-color="#a3adb6"/><stop offset=".7" stop-color="#5d6872"/><stop offset="1" stop-color="#262d34"/></linearGradient>
<linearGradient id="@metalH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a3adb6"/><stop offset=".5" stop-color="#6c7780"/><stop offset="1" stop-color="#2c343c"/></linearGradient>
<pattern id="@shaftV" width="8" height="16" patternUnits="userSpaceOnUse"><rect width="8" height="16" fill="#7d8892"/><path d="M-4 16 L4 0 M4 16 L12 0" stroke="#c3ccd3" stroke-width="2.5"/></pattern>
<pattern id="@shaftH" width="16" height="10" patternUnits="userSpaceOnUse"><rect width="16" height="10" fill="#7d8892"/><path d="M0 -4 L16 6 M0 4 L16 14" stroke="#c3ccd3" stroke-width="2.5"/></pattern>
<clipPath id="@win"><rect x="504" y="312" width="292" height="256"/></clipPath>
</defs>
<rect x="0" y="0" width="470" height="830" fill="var(--band)"/>
<rect x="474" y="0" width="356" height="830" fill="#ffffff04"/>
<rect x="834" y="0" width="446" height="830" fill="var(--band)"/>
<text class="zone" x="14" y="24">AIR SIDE · PRIMARY AND SECONDARY AIR</text>
<text class="zone" x="488" y="24">AIR PREHEATER · DITL-43 / 44</text>
<text class="zone" x="848" y="24">GAS SIDE · FLUE GAS</text>
<g transform="translate(0,30)">
<g data-k="ducts"></g>
<g data-k="cards"></g>
<rect x="638" y="280" width="24" height="16" rx="2" fill="url(#@metalH)" stroke="#0b0f13"/>
<rect x="634" y="586" width="32" height="18" rx="2" fill="url(#@metalH)" stroke="#0b0f13"/>
<rect x="622" y="604" width="56" height="6" fill="#4a545d"/>
<rect x="490" y="300" width="320" height="280" fill="url(#@metalV)" stroke="#0b0f13"/>
<rect x="482" y="294" width="336" height="12" fill="url(#@metalH)" stroke="#0b0f13"/>
<rect x="482" y="574" width="336" height="12" fill="url(#@metalH)" stroke="#0b0f13"/>
<rect x="504" y="312" width="292" height="256" fill="#0a0d10"/>
<g data-k="rotor" clip-path="url(#@win)"></g>
<g data-k="streams"></g>
<g stroke="#0b0f13" stroke-width="3"><line x1="504" y1="397" x2="796" y2="397"/><line x1="504" y1="483" x2="796" y2="483"/></g>
<rect x="504" y="312" width="292" height="256" fill="none" stroke="#0b0f13" stroke-width="2"/>
<rect x="642" y="306" width="16" height="268" fill="url(#@metalV)" stroke="#0b0f13"/>
<g fill="#b9c3cb" stroke="#0b0f13"><rect x="624" y="306" width="52" height="8"/><rect x="624" y="566" width="52" height="8"/><rect x="571" y="306" width="8" height="8"/><rect x="571" y="566" width="8" height="8"/></g>
<g class="inside" text-anchor="end" fill="#9aa6b1" font-size="11">
<text x="474" y="352">HOT END</text><text x="474" y="366" class="card-s" font-size="11">elements</text>
<text x="474" y="438">INTERMEDIATE</text><text x="474" y="452" class="card-s" font-size="11">elements</text>
<text x="474" y="524">COLD END</text><text x="474" y="538" class="card-s" font-size="11">enamelled</text>
</g>
<g font-size="11" class="inside" text-anchor="middle">
<rect x="522" y="528" width="38" height="16" rx="2" fill="#0b0f13cc"/><text x="541" y="540">PA</text>
<rect x="594" y="528" width="38" height="16" rx="2" fill="#0b0f13cc"/><text x="613" y="540">SA</text>
<rect x="701" y="528" width="48" height="16" rx="2" fill="#0b0f13cc"/><text x="725" y="540">GAS</text>
</g>
<rect x="645" y="84" width="10" height="196" fill="url(#@shaftV)" stroke="#0b0f13"/>
<rect x="616" y="40" width="68" height="46" rx="4" fill="url(#@metalH)" stroke="#0b0f13"/>
<rect x="628" y="46" width="44" height="34" rx="3" fill="#11161b" stroke="#0b0f13"/>
<g transform="translate(641,63)"><g data-rot="g1"><path d="M-11 0a11 11 0 1 0 22 0a11 11 0 1 0 -22 0" fill="#5d6872"/><g stroke="#a9b3bc" stroke-width="3"><line x1="0" y1="-13" x2="0" y2="13"/><line x1="-13" y1="0" x2="13" y2="0"/><line x1="-9" y1="-9" x2="9" y2="9"/><line x1="-9" y1="9" x2="9" y2="-9"/></g><circle r="4" fill="#2c343c"/></g></g>
<g transform="translate(662,63)"><g data-rot="g2"><path d="M-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" fill="#5d6872"/><g stroke="#a9b3bc" stroke-width="2.5"><line x1="0" y1="-9" x2="0" y2="9"/><line x1="-9" y1="0" x2="9" y2="0"/><line x1="-6" y1="-6" x2="6" y2="6"/><line x1="-6" y1="6" x2="6" y2="-6"/></g><circle r="3" fill="#2c343c"/></g></g>
<rect x="640" y="84" width="20" height="8" fill="url(#@metalH)" stroke="#0b0f13"/>
<rect x="606" y="58" width="10" height="10" fill="#7d8892" stroke="#0b0f13"/><rect x="684" y="58" width="10" height="10" fill="url(#@shaftH)" stroke="#0b0f13"/>
<g data-hit="MD" tabindex="0" role="button" aria-label="Main drive motor: open control faceplate"><title>Main drive motor M1 · DITL-43</title>
<rect x="694" y="42" width="86" height="42" rx="6" fill="url(#@metalH)" stroke="#6b7480" stroke-width="2.5" data-ring="MD"/>
<g stroke="#1b2228" stroke-width="2"><line x1="706" y1="46" x2="706" y2="80"/><line x1="716" y1="46" x2="716" y2="80"/><line x1="726" y1="46" x2="726" y2="80"/><line x1="736" y1="46" x2="736" y2="80"/><line x1="746" y1="46" x2="746" y2="80"/><line x1="756" y1="46" x2="756" y2="80"/></g>
<rect x="780" y="46" width="8" height="34" rx="2" fill="#3b444c" stroke="#0b0f13"/>
<g transform="translate(800,63)"><circle r="15" fill="#1b2228" stroke="#8d98a2" stroke-width="2"/><g data-rot="fan"><path d="M0 0 L-3 -12 L3 -12Z M0 0 L12 -3 L12 3Z M0 0 L3 12 L-3 12Z M0 0 L-12 3 L-12 -3Z" fill="#a9b3bc"/></g><circle r="3" fill="#5d6872"/></g>
</g>
<g data-hit="AM" tabindex="0" role="button" aria-label="Air motor: open control faceplate"><title>Air motor (back-up drive) · DITL-44 SV-PA1052</title>
<rect x="540" y="46" width="66" height="34" rx="6" fill="url(#@metalH)" stroke="#6b7480" stroke-width="2.5" data-ring="AM"/>
<g stroke="#1b2228" stroke-width="2"><line x1="552" y1="50" x2="552" y2="76"/><line x1="562" y1="50" x2="562" y2="76"/><line x1="572" y1="50" x2="572" y2="76"/></g>
</g>
<text class="st" x="737" y="12" text-anchor="middle" fill="#6b7480" data-st="MD">-----</text>
<text class="eq" x="737" y="32" text-anchor="middle" font-size="15">MAIN MOTOR</text>
<text class="st" x="573" y="12" text-anchor="middle" fill="#6b7480" data-st="AM">-----</text>
<text class="eq" x="573" y="32" text-anchor="middle" font-size="15">AIR MOTOR</text>
<g stroke="#0b0f13">
<rect x="668" y="314" width="160" height="5" fill="url(#@metalH)"/><rect x="668" y="561" width="160" height="5" fill="url(#@metalH)"/>
<g fill="#c3ccd3"><circle cx="690" cy="321" r="2"/><circle cx="725" cy="321" r="2"/><circle cx="760" cy="321" r="2"/><circle cx="690" cy="559" r="2"/><circle cx="725" cy="559" r="2"/><circle cx="760" cy="559" r="2"/></g>
<rect x="828" y="303" width="44" height="26" rx="3" fill="url(#@metalH)"/><rect x="828" y="550" width="44" height="26" rx="3" fill="url(#@metalH)"/>
</g>
<g stroke-linejoin="round" fill="none"><polyline points="872,316 900,316" stroke="#0b0f13" stroke-width="8"/><polyline points="872,316 900,316" stroke="#8c98a5" stroke-width="5"/><polyline points="872,563 900,563" stroke="#0b0f13" stroke-width="8"/><polyline points="872,563 900,563" stroke="#8c98a5" stroke-width="5"/></g>
<text class="st" x="848" y="350" fill="#6b7480" data-st="APH">-----</text>
<text class="eq" x="848" y="372">AIR PREHEATER H-1052</text>
<text class="card-s" x="848" y="390">Rotary regenerative · rotor ~1 rpm</text>
<g data-hit="YN" data-eqb="APH" tabindex="0" role="button" aria-label="Permissive, monitor and trend"><title>Permissive, monitor and trend</title>
<rect x="1078" y="354" width="28" height="22" rx="3" fill="#6b7480" data-yn="r"/>
<text x="1092" y="370" text-anchor="middle" fill="#fff" font-weight="700" font-size="14" data-yn="t">-</text>
</g>
<g data-k="vals"></g>
<text class="tag" x="1195" y="420" text-anchor="middle" fill="#9aa6b1">ROTOR · TOP VIEW</text>
<g transform="translate(1195,500)"><g data-k="plan"></g></g>
<circle cx="1195" cy="500" r="64" fill="none" stroke="#a9b3bc" stroke-width="4"/>
<g stroke="#b9c3cb" stroke-width="7"><line x1="1195" y1="436" x2="1195" y2="564"/><line x1="1195" y1="500" x2="1137" y2="473"/></g>
<circle cx="1195" cy="500" r="9" fill="#a9b3bc" stroke="#0b0f13"/>
<g class="inside" font-size="11"><text x="1262" y="440" text-anchor="end">GAS</text><text x="1122" y="470" text-anchor="end" fill="#c9d1d8">PA</text><text x="1122" y="540" text-anchor="end" fill="#c9d1d8">SA</text></g>
<g data-k="air"></g>
<g transform="translate(1080,740)">
<rect width="34" height="8" fill="#4f86b5"/><text class="unit" x="44" y="9" fill="#c9d1d8">COLD AIR</text>
<rect y="20" width="34" height="8" fill="#c98a4a"/><text class="unit" x="44" y="29" fill="#c9d1d8">HOT AIR</text>
<rect y="40" width="34" height="8" fill="#b85a3c"/><text class="unit" x="44" y="49" fill="#c9d1d8">FLUE GAS</text>
</g>
</g>`;
  /* the values: x, y (box top), tag, decimals (mockup V list) */
  const V = [
    [396, 104, 'TIFA1052', 0], [176, 104, 'TIFA1086', 0], [286, 104, 'TIFA1087', 0],
    [176, 318, 'TIFA1076', 0], [286, 318, 'TIFA1077', 0],
    [176, 540, 'TIFA1073', 0], [286, 540, 'TIFA1074', 0],
    [176, 754, 'TIFA1083', 0], [286, 754, 'TIFA1084', 0],
    [848, 84, 'TIFG1124', 0], [966, 84, 'TIFG1125', 0],
    [848, 712, 'TIFG1132', 0], [966, 712, 'TIFG1133', 0],
    [848, 428, 'DPIFG10525', 0], [1000, 428, 'IIFA1052M1', 1],
    [770, 205, 'TIFA10526', 0], [770, 612, 'TIFA10527', 0], [900, 302, 'PISB1040', 1], [900, 549, 'PISB1042', 1]
  ];
  const UNIT = { DPIFG10525: 'mmH₂O', IIFA1052M1: 'A', PISB1040: 'kg/cm²', PISB1042: 'kg/cm²' };
  function page(g, api) {
    const NS = 'http://www.w3.org/2000/svg';
    const pg = document.createElementNS(NS, 'g');
    pg.setAttribute('transform', 'translate(0 56)');
    g.append(pg);
    const L = H.layer(pg, VW, VH);
    if (!L) return pg;
    const root = L.root;
    root.classList.add('a8');
    root.innerHTML = `<style>${CSS}</style><svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Air preheater H-1052: flue gas passes down through the right half of the rotor and heats it; primary and secondary air pass up through the left half and take the heat">${ART.replace(/@/g, 'a8-')}</svg><svg class="flo" viewBox="0 0 ${VW} ${VH}" aria-hidden="true"><g transform="translate(0,30)" data-k="flo"></g></svg>`;
    const q = s => root.querySelector(s),
      qa = s => root.querySelectorAll(s),
      K = k => q(`[data-k="${k}"]`);
    function mk(p, n, a, t) {
      const e = document.createElementNS(NS, n);
      for (const k in a) e.setAttribute(k, a[k]);
      if (t != null) e.textContent = t;
      p.appendChild(e);
      return e;
    }
    function sh(h, f) {
      const n = parseInt(h.slice(1), 16),
        c = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
      return '#' + ((1 << 24) + (c(n >> 16) << 16) + (c((n >> 8) & 255) << 8) + c(n & 255)).toString(16).slice(1);
    }
    const defs = q('defs'),
      med = { cold: '#4f86b5', hot: '#c98a4a', gas: '#b85a3c', gasc: '#8b7f70' };
    for (const k in med)
      for (const o of ['h', 'v']) {
        const gr = mk(defs, 'linearGradient', { id: 'a8-d' + k + o, x1: 0, y1: 0, x2: o === 'v' ? 1 : 0, y2: o === 'h' ? 1 : 0 });
        for (const s of [[0, -0.6], [0.18, -0.15], [0.42, 0.28], [0.62, 0], [1, -0.65]]) mk(gr, 'stop', { offset: s[0], 'stop-color': sh(med[k], s[1]) });
      }
    /* pipes: same build as the MAKE-UP WATER lines (dark rim, medium colour, light core), round bends */
    const D = K('ducts'),
      FL = K('flo');
    const pipe = (pts, m, w) =>
      [['#0b0f13', w + 4, 1], [med[m], w, 1], [sh(med[m], 0.45), Math.max(2, w * 0.28), 0.7]].forEach(s =>
        mk(D, 'polyline', { points: pts, fill: 'none', stroke: s[0], 'stroke-width': s[1], opacity: s[2], 'stroke-linejoin': 'round', 'stroke-linecap': 'butt' })
      );
    pipe('232,168 613,168 613,300', 'hot', 12);
    pipe('232,264 541,264 541,300', 'hot', 12);
    pipe('232,612 541,612 541,580', 'cold', 12);
    pipe('232,702 613,702 613,580', 'cold', 12);
    pipe('1090,156 725,156 725,300', 'gas', 16);
    pipe('725,580 725,655 1090,655', 'gasc', 16);
    for (const n of [[541, 12], [613, 12], [725, 16]]) for (const y of [300, 580]) mk(D, 'rect', { x: n[0] - n[1] / 2 - 5, y: y - (y < 400 ? 8 : 0), width: n[1] + 10, height: 8, fill: '#a9b3bc', stroke: '#0b0f13' });
    /* the flows (overlay): [points, fan] */
    const PF = [['613,300 613,168 232,168', 'saf'], ['541,300 541,264 232,264', 'paf'], ['232,612 541,612 541,580', 'paf'], ['232,702 613,702 613,580', 'saf'], ['1090,156 725,156 725,300', 'idf'], ['725,580 725,655 1090,655', 'idf']].map(([p, f]) => [mk(FL, 'polyline', { points: p, class: 'pf' }), f, 25]);
    /* compressed air supply to the air motor, SV-PA1052 */
    const AG = K('air'),
      ia = '#9fb3c8';
    for (const s of [['#0b0f13', 9, 1], [ia, 6, 1], [sh(ia, 0.45), 2, 0.7]]) mk(AG, 'polyline', { points: '300,63 540,63', fill: 'none', stroke: s[0], 'stroke-width': s[1], opacity: s[2] });
    mk(AG, 'path', { d: 'M301 63 L291 57 L291 69Z', fill: ia });
    mk(AG, 'text', { x: 284, y: 61, class: 'card-t', 'font-size': '14', 'text-anchor': 'end' }, 'COMPRESSED AIR');
    mk(AG, 'text', { x: 284, y: 78, class: 'card-s', 'font-size': '12', 'text-anchor': 'end' }, 'supply to air motor');
    const svB = mk(AG, 'path', { d: 'M455 53 L475 73 L475 53 L455 73Z', fill: '#1b2228', stroke: '#6b7480', 'stroke-width': 2.5 });
    mk(AG, 'line', { x1: 465, y1: 63, x2: 465, y2: 45, stroke: '#a9b3bc', 'stroke-width': 2 });
    mk(AG, 'rect', { x: 457, y: 35, width: 16, height: 10, rx: 2, fill: 'url(#a8-metalH)', stroke: '#0b0f13' });
    mk(AG, 'text', { x: 448, y: 38, class: 'tag', 'text-anchor': 'end' }, 'SVPA1052');
    const svT = mk(AG, 'text', { x: 448, y: 51, class: 'st', 'text-anchor': 'end', fill: '#6b7480' }, '-----');
    /* gas and air passing through the element channels: gas down on the right, air up on the left (PA left of x 578, SA right) */
    const ST = [];
    for (let x = 516; x < 796; x += 13) {
      if (x > 636 && x < 664) continue;
      const gas = x > 650;
      ST.push([mk(FL, 'line', { x1: x, y1: 312, x2: x, y2: 568, class: gas ? 'st-gas' : 'st-air' }), gas ? 'idf' : x < 578 ? 'paf' : 'saf', gas ? 25.5 : -25.5]);
    }
    /* top view of the rotor: the same sectors turning through the gas, PA and SA zones */
    const P = K('plan'),
      rr = 62,
      NW = 24,
      wd = [];
    for (let i = 0; i < NW; i++) {
      const a0 = (i * 2 * Math.PI) / NW,
        a1 = ((i + 1) * 2 * Math.PI) / NW;
      wd.push(mk(P, 'path', { d: `M0 0 L${rr * Math.cos(a0)} ${rr * Math.sin(a0)} A${rr} ${rr} 0 0 1 ${rr * Math.cos(a1)} ${rr * Math.sin(a1)}Z`, stroke: '#0b0f13', 'stroke-width': 1.5 }));
    }
    /* turning rotor: 12 sectors (between radial diaphragms) carry the element baskets through the gas half (heat up) and the air half
       (give the heat to the air); shown as an unrolled ring, ~20 s per turn (real ~1 rpm) */
    const R = K('rotor'),
      N = 12,
      W = 292 / N,
      L0 = 504,
      LY = [[312, 85], [397, 86], [483, 85]],
      secs = [];
    const heat = t => {
      t = clamp(t, 0, 1);
      const a = [[63, 119, 166], [133, 122, 92], [197, 96, 58]],
        i = t < 0.5 ? 0 : 1,
        f = t < 0.5 ? t * 2 : (t - 0.5) * 2;
      return 'rgb(' + a[i].map((c, k) => Math.round(c + (a[i + 1][k] - c) * f)).join(',') + ')';
    };
    for (let s = 0; s < N + 1; s++) {
      const gs = mk(R, 'g', {}),
        ls = [];
      LY.forEach((ly, j) => {
        ls.push(mk(gs, 'rect', { x: 0, y: ly[0], width: W, height: ly[1] }));
        for (let p = 1; p < 4; p++) {
          const x = (p * W) / 4;
          let d = 'M' + x + ' ' + ly[0];
          for (let yy = ly[0]; yy < ly[0] + ly[1]; yy += 8) d += ' l' + (j === 2 ? 2 : 3) + ' 4 l' + (j === 2 ? -2 : -3) + ' 4';
          mk(gs, 'path', { d, fill: 'none', stroke: '#0b0f1399', 'stroke-width': 1.2 });
        }
      });
      mk(gs, 'rect', { x: 0, y: 312, width: 2, height: 256, fill: '#a9b3bc' });
      secs.push({ g: gs, ls });
    }
    /* the rotor at turn fraction u (0..1): the sectors, their colour by where they are, the top view */
    const rotor = u => {
      const off = (u * 292) % 292;
      secs.forEach((sc, i) => {
        const x = L0 + ((i * W + off) % (292 + W)) - W;
        sc.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',0)');
        const c = x + W / 2,
          ph = c >= 650 ? (c - 650) / 146 : 1 - (c - 504) / 146; /* 0 = coolest (leaving the air side), 1 = hottest (leaving the gas side) */
        sc.ls[0].setAttribute('fill', heat(0.35 + 0.6 * ph));
        sc.ls[1].setAttribute('fill', heat(0.2 + 0.55 * ph));
        sc.ls[2].setAttribute('fill', heat(0.02 + 0.45 * ph));
      });
      const ang = (u * 360) % 360;
      P.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ')');
      wd.forEach((w, i) => {
        const a = ((i + 0.5) * 360 / NW + ang) % 360,
          ph = a <= 90 || a >= 270 ? ((a + 90) % 360) / 180 : 1 - (a - 90) / 180;
        w.setAttribute('fill', heat(0.1 + 0.8 * ph));
      });
    };
    rotor(0);
    /* line ends like the plant HMI: the medium name beside the line, the arrowhead shows the way it flows */
    const C2 = K('cards');
    const card = (y, t, sub, side, out, m) => {
      const Lf = side === 'L',
        px = Lf ? 232 : 1090,
        ax = Lf ? 214 : 1108;
      mk(C2, 'line', { x1: Lf ? ax - 9 : px, y1: y, x2: Lf ? px : ax + 9, y2: y, stroke: med[m], 'stroke-width': 3 });
      const hx = Lf ? (out ? ax - 12 : px - 1) : out ? ax + 12 : px + 1,
        bx2 = Lf ? (out ? ax - 2 : px - 11) : out ? ax + 2 : px + 11;
      mk(C2, 'path', { d: 'M' + hx + ' ' + y + ' L' + bx2 + ' ' + (y - 6) + ' L' + bx2 + ' ' + (y + 6) + 'Z', fill: med[m] });
      const tx = Lf ? ax - 18 : ax + 18,
        an = Lf ? 'end' : 'start';
      mk(C2, 'text', { x: tx, y: y - 2, class: 'card-t', 'font-size': '14', 'text-anchor': an }, t);
      mk(C2, 'text', { x: tx, y: y + 15, class: 'card-s', 'font-size': '12', 'text-anchor': an }, sub);
    };
    card(168, 'HOT SECONDARY AIR', 'to furnace', 'L', 1, 'hot');
    card(264, 'HOT PRIMARY AIR', 'to furnace', 'L', 1, 'hot');
    card(612, 'COLD PRIMARY AIR', 'from PAF F-1053', 'L', 0, 'cold');
    card(702, 'COLD SECONDARY AIR', 'from SAF F-1054', 'L', 0, 'cold');
    card(156, 'FLUE GAS INLET', 'from economizer', 'R', 0, 'gas');
    card(655, 'FLUE GAS OUTLET', 'to ESP Z-1010', 'R', 1, 'gasc');
    /* the value boxes (live text: data-v) */
    const G = K('vals'),
      NM = { TIFA1052: 'avg hot SA', TIFA10526: 'top bearing', TIFA10527: 'bottom bearing' };
    for (const [x, y, tag] of V) {
      if (NM[tag]) (mk(G, 'text', { x, y: y - 7, class: 'tag' }, tag), mk(G, 'text', { x: x + 75, y: y - 7, class: 'card-s', 'font-size': '11' }, NM[tag]));
      else if (tag === 'PISB1040' || tag === 'PISB1042')
        (mk(G, 'text', { x: x + 80, y: y + 12, class: 'tag' }, tag), mk(G, 'text', { x: x + 80, y: y + 27, class: 'card-s', 'data-sb': tag }, tag === 'PISB1040' ? 'hot end soot blower · idle' : 'cold end soot blower · idle'));
      else mk(G, 'text', { x, y: y - 7, class: 'tag' }, tag);
      mk(G, 'rect', { x, y, width: 70, height: 28, fill: '#06090c', stroke: '#2c3640' });
      mk(G, 'text', { x: x + 63, y: y + 21, class: 'num', 'text-anchor': 'end', 'data-v': tag }, '-----');
      if (tag !== 'PISB1040' && tag !== 'PISB1042') mk(G, 'text', { x: x + 75, y: y + 19, class: 'unit' }, UNIT[tag] || '°C');
    }

    /* ---------- live ---------- */
    const EST = PLANT_V2.EST || {},
      E = { tb: null, pa0: 354, sa0: 213, fa0: 26.3, idf: 1, paf: 1, saf: 1 },
      LV = {};
    const live = (ref, tag, set) => api.reg({ t: 'val', tag: tag || '', ref: ref || undefined, v: '' }, X => set(X && isFinite(X.v) ? +X.v : null), null);
    const avg = (a, b) => (a != null && b != null ? (a + b) / 2 : a != null ? a : b);
    let st = null,
      sv = null;
    const cur = () => (st === 'RUN' ? 4.7 : st ? 0 : null);
    /* bearing oil warming towards 60 / 47 °C with the gas (38.PNG) */
    const oil = top => (E.tpa != null ? E.tpa + ((top ? 60 : 47) - 30) * clamp(E.kb || 0, 0, 1) : null);
    const OWN = { IIFA1052M1: cur, TIFA10526: () => oil(1), TIFA10527: () => oil(0) };
    const get = t => {
      if (OWN[t]) return OWN[t]();
      if (LV[t] != null) return LV[t];
      if (!EST[t]) return null;
      try {
        const v = EST[t](E);
        return v != null && isFinite(v) ? v : null;
      } catch (e) {
        return null;
      }
    };
    const paint = () => {
      if (PLANT_V2.estPrep) PLANT_V2.estPrep(E);
      for (const [, , tag, dp] of V) {
        const v = get(tag);
        qa(`[data-v="${tag}"]`).forEach(t => ((t.textContent = fmt(v, dp)), t.setAttribute('fill', v == null ? '#6b7480' : '#f4f7f9')));
      }
      for (const tag of ['PISB1040', 'PISB1042']) {
        const v = get(tag),
          on = v != null && v > 0.5;
        qa(`[data-sb="${tag}"]`).forEach(t => (t.textContent = (tag === 'PISB1040' ? 'hot end soot blower · ' : 'cold end soot blower · ') + (on ? 'blowing' : 'idle')));
      }
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
    for (const k in FAN) live(FAN[k], '', v => ((E[k] = v == null ? 1 : v > 0.5 ? 1 : 0), later()));
    const TT = {};
    for (const c of 'ABCDEFGHI')
      for (const pre of ['TIFG1091', 'TIFG1090'])
        live('', pre + c, v => {
          TT[pre + c] = v;
          const Lt = Object.values(TT).filter(x => x != null);
          E.tb = Lt.length ? Lt.reduce((a, b) => a + b, 0) / Lt.length : null;
          later();
        });
    /* the transmitters a logic sheet reads (the logic value wins over the estimate) */
    for (const t of [...V.map(x => x[2]), 'PIFG1121', 'PIFG1134', 'FIFA1079']) if (!EST[t] && !OWN[t]) live('', t, v => ((LV[t] = v), later()));
    /* the drive (DITL-43), the air motor valve (DITL-44 O.029F), the Y / N */
    const COL = s => (s === 'RUN' ? '#e5484d' : s === 'STOP' ? '#2fa56a' : s === 'TRIP' ? '#e5484d' : '#6b7480'),
      WORD = s => (s === 'RUN' ? 'RUNNING' : s === 'STOP' ? 'STOPPED' : s === 'TRIP' ? 'TRIP' : '-----');
    const state = (k, s) => {
      qa(`[data-ring="${k}"]`).forEach(e => e.setAttribute('stroke', COL(s)));
      qa(`[data-st="${k}"]`).forEach(e => ((e.textContent = WORD(s)), e.setAttribute('fill', COL(s))));
    };
    /* the air valve: DITL-44 O.029F (SV-PA1052 open command), else its point of the I/O list */
    let svIO = null;
    live('', 'SVPA1052', v => (svIO = v == null ? null : v > 0.5 ? 1 : 0));
    const Dk = () => window.LS_DOCK;
    const tick = () => {
      if (!pg.isConnected) return iv.stop();
      let s = null,
        v = null;
      try {
        s = Dk() && Dk().mst ? Dk().mst('DITL-43') : null;
        /* DITL-44 has no output row: its logic ends at the DO address O.029F (relay, DC 24 V, SV-PA1052) */
        v = Dk() && Dk().pout ? Dk().pout('DITL-44', 'O.029F') : null;
      } catch (e) {}
      if (s !== st) ((st = s), later());
      sv = v != null ? v : svIO;
      const am = sv === 1 ? 'RUN' : sv == null ? null : 'STOP';
      state('MD', st);
      state('AM', am);
      state('APH', st === 'TRIP' ? 'TRIP' : st === 'RUN' || am === 'RUN' ? 'RUN' : st || am);
      svB.setAttribute('fill', sv === 1 ? '#3a1618' : sv === 0 ? '#16301f' : '#1b2228');
      svB.setAttribute('stroke', sv === 1 ? '#e5484d' : sv === 0 ? '#2fa56a' : '#6b7480');
      svT.textContent = sv === 1 ? 'OPEN' : sv === 0 ? 'CLOSED' : '-----';
      svT.setAttribute('fill', sv === 1 ? '#e5484d' : sv === 0 ? '#2fa56a' : '#6b7480');
      let ok = null;
      try {
        ok = window.LS_FPOP && LS_FPOP.yn ? LS_FPOP.yn(M) : null;
      } catch (e) {}
      q('[data-yn="r"]').setAttribute('fill', ok == null ? '#6b7480' : ok ? '#e5484d' : '#2fa56a');
      q('[data-yn="t"]').textContent = ok == null ? '-' : ok ? 'Y' : 'N';
      q('[data-eqb="APH"]').setAttribute('aria-label', 'Permissive, monitor and trend: ' + (ok == null ? 'no logic' : ok ? 'Y, complete' : 'N, not complete'));
    };
    /* P2: the shared driver, only while the page is on the screen */
    const iv = H.every(pg, 1000, tick);
    tick();
    /* everything that moves, on the one 15 Hz clock: frozen while the simulation is paused or the motion is reduced */
    const still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const rot = {};
    qa('[data-rot]').forEach(e => (rot[e.dataset.rot] = e));
    const pV = q('#a8-shaftV'),
      pH = q('#a8-shaftH');
    let t0 = null,
      u = 0,
      a = { g1: 0, g2: 0, fan: 0, sv: 0, sh: 0 };
    H.clock(t => {
      if (!pg.isConnected) return false;
      const dt = t0 == null ? 0 : Math.min(0.2, t - t0);
      t0 = t;
      const go = !still && H.simRunning(),
        turn = go && (st === 'RUN' || sv === 1),
        k = go ? dt : 0;
      for (const [el, f, sp] of PF) {
        el.setAttribute('visibility', E[f] ? 'visible' : 'hidden');
        if (E[f] && k) el.setAttribute('stroke-dashoffset', ((el._o = ((el._o || 0) - sp * k) % 30)).toFixed(1));
      }
      for (const [el, f, sp] of ST) {
        el.setAttribute('visibility', E[f] ? 'visible' : 'hidden');
        if (E[f] && k) el.setAttribute('stroke-dashoffset', ((el._o = ((el._o || 0) - sp * k) % 28)).toFixed(1));
      }
      if (turn) {
        u = (u + dt / 20) % 1;
        rotor(u);
        a.g1 = (a.g1 - 150 * dt) % 360;
        a.g2 = (a.g2 + 240 * dt) % 360;
        a.sv = (a.sv + 16 * dt) % 8;
        rot.g1.setAttribute('transform', `rotate(${a.g1.toFixed(1)})`);
        rot.g2.setAttribute('transform', `rotate(${a.g2.toFixed(1)})`);
        pV.setAttribute('patternTransform', `translate(${a.sv.toFixed(1)} 0)`);
      }
      if (go && st === 'RUN') {
        /* 22.5° a step: the four blades never seem to turn backwards on the 15 Hz clock */
        a.fan = (a.fan + 22.5) % 360;
        a.sh = (a.sh + 40 * dt) % 10;
        rot.fan.setAttribute('transform', `rotate(${a.fan})`);
        pH.setAttribute('patternTransform', `translate(0 ${a.sh.toFixed(1)})`);
      }
    }, pg); /* P2: only while the page is on the screen */
    /* #59: the motors = CONTROL faceplate, the Y / N square = PERMISSIVE · TREND · MONITOR */
    const MON = [
      ['Top bearing', () => oil(1), '°C', 'TIFA10526'],
      ['Bottom bearing', () => oil(0), '°C', 'TIFA10527'],
      ['Inlet gas press.', () => (get('PIFG1121') == null ? null : +get('PIFG1121').toFixed(0)), 'mmH2O', 'PIFG1121'],
      ['Outlet gas press.', () => (get('PIFG1134') == null ? null : +get('PIFG1134').toFixed(0)), 'mmH2O', 'PIFG1134'],
      ['Hot PA flow', () => (get('FIFA1079') == null ? null : +get('FIFA1079').toFixed(0)), 'T/H', 'FIFA1079']
    ];
    const open = part => window.LS_FPOP && LS_FPOP.motor({ ...M, part, cur, mon: MON });
    const bind = (id, f) =>
      qa(`[data-hit="${id}"]`).forEach(h => {
        h.addEventListener('click', e => (e.stopPropagation(), f()));
        h.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), f()));
      });
    bind('MD', () => open('control'));
    bind('AM', () => (window.LS_FPOP && LS_FPOP.valveTag && LS_FPOP.valveTag('SVPA1052')) || open('control'));
    bind('YN', () => open('info'));
    (window.LS_FPREG = window.LS_FPREG || {})['DITL-43'] = { open: () => open('control'), el: () => q('[data-hit="MD"]'), n: M.n, cur };
    paint();
    return pg;
  }
  PLANT_V2.screens.APH = page;
  /* after 007 AIR & FLUE GAS in the list of the Plant view */
  const Ls = (window.PLANT_SYS = window.PLANT_SYS || []),
    i = Ls.findIndex(x => x.id === 'AFG');
  Ls.splice(i >= 0 ? i + 1 : Ls.length, 0, {
    fitAll: 1,
    id: 'APH',
    title: '038 AIR PREHEATER',
    num: '038',
    name: 'AIR PREHEATER SYSTEM',
    src: '38.PNG',
    w: 1280,
    h: 56 + VH + 32,
    v2: true,
    screen: 'APH',
    style: 'steel',
    nav: ['UNIT', 'AFG', 'SW', 'MU', 'TO', 'APH'],
    items: []
  });
})();
