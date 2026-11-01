/* 039 RH / SH BIASING DAMPER: the APPROVED mockup (user 2026-11-01 "ok approved", Style B v12 x-ray side cut-away, flue gas option A;
   user 2026-11-01 "Yung mga approved. Ipalagay mo na sa app."; team-files/hmi-mockups/039-biasing-damper-APPROVED.html, artifact
   He9LATqBJ5Cniahco5AAr8) as it is: same coordinates, colours and sizes ("ganyan na ganyan"), in an HTML layer over the plant svg
   that follows its pan and zoom (HSYM.layer). LIGHT (PENDING_HMI_BUILD rule 5): the flue gas is HTML layers behind the drawing that
   move by CSS transform only (a noise texture made once, feathered zone edges); the tube flows are in an overlay svg and move on the
   one 15 Hz clock of HSYM; nothing else is animated. Sources (the table of the mockup): FHI manual Part 4 Sect 1 / 3 Fig. 1 and
   Part 3 Sect 3 p.3-3-3 (backpass, banks, headers, pipe routes), DCS I/O list station 104 (TIFG1100 ~ 1113, ZT-FG1116 / 1117 A ~ D,
   PIIA1064A / B), ABC-020 (HICHR1002A / B, TCV-FG1116 / 1117, interlocks M.0506 / 0507 / 3440 / 3441), ABC-019 (TICHR1002 spray
   TCV-FW1150), PR-OPE-5002 (start-up sequence). Live: the controllers (PV / SV / MV / mode of the faceplates), the damper positions
   (ZT feedback, else the valve on the drawing), the interlock memories, the gas temperatures (the logic where a sheet reads them, else
   the plant estimate of 007, PLANT_V2.EST). #59: click on a controller, a damper row or the spray valve = its faceplate; the Y / N
   square = PERMISSIVE · TREND · MONITOR (Y red = purge permissive made, N green). */
(function () {
  if (!window.PLANT_V2 || !window.HSYM) return;
  const H = HSYM;
  const VW = 1280,
    VH = 1156;
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  const CSS = `.b9{--band:#ffffff07;--dim:#7f8b96;--run:#e5484d;--stop:#2fa56a;--val:#f4f7f9;--sans:Inter,"Segoe UI",Arial,sans-serif;--mono:"IBM Plex Mono",Consolas,monospace;background:#141a20;font-family:var(--sans)}
.b9 svg{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;display:block;pointer-events:none;z-index:1}
.b9 .flo{z-index:2;will-change:transform}
.b9 .zone{fill:var(--dim);font:600 13px var(--sans);letter-spacing:.14em}
.b9 .tag{fill:#c9d1d8;font:500 13px var(--mono)}
.b9 .num{fill:var(--val);font:600 18px var(--mono)}
.b9 .unit{fill:var(--dim);font:500 12px var(--sans)}
.b9 .st{font:700 11px var(--sans);letter-spacing:.12em}
.b9 .inside{fill:#f1f4f6;font:600 11px var(--sans);letter-spacing:.14em}
.b9 .card-t{fill:#f1f4f6;font:700 14px var(--sans);letter-spacing:.04em}
.b9 .card-s{fill:var(--dim);font:500 12px var(--sans)}
.b9 .bank{fill:#e9edf0;font:700 13px var(--sans);letter-spacing:.06em}
.b9 .bank-s{fill:#9aa6b1;font:500 12px var(--sans)}
.b9 .wl{fill:#10161b;font:700 9.5px var(--sans);letter-spacing:.16em}
.b9 .chip-t{fill:#c9d1d8;font:500 12px var(--mono)}
.b9 .chip-v{fill:var(--val);font:600 16px var(--mono)}
.b9 [data-hit]{pointer-events:auto;cursor:pointer}.b9 [data-hit]:focus-visible{outline:2px solid #6aa7dd}
.b9 [data-hit]:hover .tile-bg{stroke:#6aa7dd}
.b9 .gasL{position:absolute;inset:0;z-index:0;pointer-events:none}
.b9 .gz{position:absolute;overflow:hidden}
.b9 .gw{position:absolute;will-change:transform;animation:linear infinite}
.b9.still .gw{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.b9 .gw{animation:none}}`;
  /* the noise texture of the flue gas, made once (option A of the mockup) */
  let TEX = null;
  function noiseTex(w, h, gx, gy, seed) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d'),
      im = x.createImageData(w, h),
      d = im.data,
      AMP = 0.42;
    let s = seed || 7;
    const r = () => ((s = (s * 16807) % 2147483647), s / 2147483647);
    const lat = (n, m) => {
      const L = [];
      for (let j = 0; j < m; j++) {
        L.push([]);
        for (let i = 0; i < n; i++) L[j].push(r());
      }
      return L;
    };
    const oct = [[gx, gy, 0.55], [gx * 2, gy * 2, 0.3], [gx * 4, gy * 4, 0.15]].map(o => [o[0], o[1], o[2], lat(o[0], o[1])]);
    const sm = t => t * t * (3 - 2 * t);
    for (let py = 0; py < h; py++)
      for (let px = 0; px < w; px++) {
        let v = 0;
        for (const o of oct) {
          const fx = (px / w) * o[0],
            fy = (py / h) * o[1],
            i = Math.floor(fx),
            j = Math.floor(fy),
            u = sm(fx - i),
            q = sm(fy - j),
            L = o[3],
            n = o[0],
            m = o[1];
          const a = L[j % m][i % n],
            b = L[j % m][(i + 1) % n],
            cc = L[(j + 1) % m][i % n],
            dd = L[(j + 1) % m][(i + 1) % n];
          v += o[2] * ((a * (1 - u) + b * u) * (1 - q) + (cc * (1 - u) + dd * u) * q);
        }
        const k = (py * w + px) * 4;
        if (v > 0.5) ((d[k] = 255), (d[k + 1] = 228), (d[k + 2] = 196), (d[k + 3] = Math.min(255, (v - 0.5) * 2 * AMP * 255)));
        else ((d[k] = 0), (d[k + 1] = 0), (d[k + 2] = 0), (d[k + 3] = Math.min(255, (0.5 - v) * 2 * AMP * 0.9 * 255)));
      }
    x.putImageData(im, 0, 0);
    return c.toDataURL();
  }

  function page(g, api) {
    const NS = 'http://www.w3.org/2000/svg';
    const pg = document.createElementNS(NS, 'g');
    pg.setAttribute('transform', 'translate(0 56)');
    g.append(pg);
    const Lr = H.layer(pg, VW, VH);
    if (!Lr) return pg;
    const root = Lr.root;
    root.classList.add('b9');
    const K = ['inner', 'walls', 'tubes', 'hdrs', 'dmp', 'chips', 'lbl', 'tiles'];
    root.innerHTML =
      `<style>${CSS}</style><div class="gasL" aria-hidden="true"></div>` +
      `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Backpass side cut-away: flue gas from the cyclones enters at the top of the front wall and flows down the reheater pass and the superheater pass; biasing dampers at the bottom of each pass share the gas; reheat steam, main steam and feedwater flow up through continuous tube circuits"><defs></defs>` +
      `<rect x="0" y="0" width="354" height="1018" fill="var(--band)"/><rect x="356" y="0" width="598" height="958" fill="#ffffff03"/><rect x="956" y="0" width="324" height="1018" fill="var(--band)"/><rect x="0" y="1022" width="1280" height="134" fill="var(--band)"/>` +
      `<text class="zone" x="14" y="22">REHEAT STEAM</text><text class="zone" x="370" y="22">BACKPASS · SIDE CUT-AWAY</text><text class="zone" x="970" y="22">MAIN STEAM · FEEDWATER</text><text class="zone" x="14" y="1044">CONTROLLERS</text>` +
      `<g data-k="inner"></g><g data-k="walls"></g><g data-k="tubes"><g data-k="tRim"></g><g data-k="tCol"></g><g data-k="tCore"></g></g>${K.slice(3).map(k => `<g data-k="${k}"></g>`).join('')}</svg>` +
      `<svg class="flo" viewBox="0 0 ${VW} ${VH}" aria-hidden="true"></svg>`;
    const q = s => root.querySelector(s),
      $ = k => q(`[data-k="${k}"]`);
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
    const defs = q('defs');
    defs.innerHTML =
      `<linearGradient id="b9-metalV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2c343c"/><stop offset=".3" stop-color="#7d8892"/><stop offset=".45" stop-color="#a3adb6"/><stop offset=".7" stop-color="#5d6872"/><stop offset="1" stop-color="#262d34"/></linearGradient>` +
      `<linearGradient id="b9-metalH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a3adb6"/><stop offset=".5" stop-color="#6c7780"/><stop offset="1" stop-color="#2c343c"/></linearGradient>` +
      `<linearGradient id="b9-wallV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#262d34"/><stop offset=".22" stop-color="#6f7b86"/><stop offset=".5" stop-color="#b3bdc6"/><stop offset=".78" stop-color="#6f7b86"/><stop offset="1" stop-color="#262d34"/></linearGradient>` +
      `<linearGradient id="b9-wallH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262d34"/><stop offset=".22" stop-color="#6f7b86"/><stop offset=".5" stop-color="#b3bdc6"/><stop offset=".78" stop-color="#6f7b86"/><stop offset="1" stop-color="#262d34"/></linearGradient>`;
    const MH = 'url(#b9-metalH)',
      MV = 'url(#b9-metalV)';
    const med = { gas: '#b85a3c', gasc: '#8b7f70', ms: '#8c98a5', rh: '#a596cf', fw: '#2f8fc0', ia: '#9fb3c8' };
    /* rounded-corner path through points (round bends like the MAKE-UP WATER pipes) */
    function rp(P, R) {
      R = R || 9;
      let d = 'M' + P[0][0] + ' ' + P[0][1];
      for (let i = 1; i < P.length - 1; i++) {
        const a = P[i - 1],
          b = P[i],
          c = P[i + 1],
          l1 = Math.hypot(b[0] - a[0], b[1] - a[1]),
          l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
        if (!l1 || !l2) continue;
        const r = Math.min(R, l1 / 2, l2 / 2);
        d += ' L' + (b[0] - ((b[0] - a[0]) / l1) * r).toFixed(1) + ' ' + (b[1] - ((b[1] - a[1]) / l1) * r).toFixed(1) + ' Q' + b[0] + ' ' + b[1] + ' ' + (b[0] + ((c[0] - b[0]) / l2) * r).toFixed(1) + ' ' + (b[1] + ((c[1] - b[1]) / l2) * r).toFixed(1);
      }
      const z = P[P.length - 1];
      return d + ' L' + z[0] + ' ' + z[1];
    }
    /* pipe / tube: dark rim, medium colour, light core in three shared layers (no seam where pipes meet); the medium itself = two
       uneven soft textures in the overlay that drift with the flow at different speeds, on the 15 Hz clock */
    const FLO = q('svg.flo'),
      FLOWS = [];
    function pipe(P, m, w, dur, cls) {
      const d = typeof P === 'string' ? P : rp(P);
      for (const s of [['tRim', '#0b0f13', w + 4, 1], ['tCol', med[m], w, 1], ['tCore', sh(med[m], 0.45), Math.max(1.5, w * 0.28), 0.7]])
        mk($(s[0]), 'path', { d, fill: 'none', stroke: s[1], 'stroke-width': s[2], opacity: s[3], 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
      if (dur) {
        const wet = m === 'fw',
          air = m === 'ia',
          v = 100 / (dur * (cls === 'tf' ? 5.5 : 3.3));
        for (const t of [['7 5 16 9 3 12 22 6 4 16', 1, wet ? 0.22 : air ? 0.18 : 0.2], ['11 8 4 14 19 7 5 13 9 10', wet ? 1.2 : 1.35, wet ? 0.15 : air ? 0.12 : 0.14]]) {
          const f = mk(FLO, 'path', { d, fill: 'none', 'stroke-linecap': 'butt', 'stroke-linejoin': 'round', stroke: wet ? sh(med[m], 0.75) : '#ffffff', 'stroke-dasharray': t[0], 'stroke-width': Math.max(1.5, w * (air ? 0.55 : 0.8)), opacity: t[2] });
          FLOWS.push([f, v * t[1], m]);
        }
      }
    }
    /* serpentine bank: n horizontal runs, s apart, hairpin bends, starting at the bottom (yb) */
    function serp(P, xa, xb, yb, n, s, ltr, lastX) {
      const e = s / 2;
      for (let k = 0; k < n; k++) {
        const y = yb - k * s,
          d = (k % 2 === 0) === ltr;
        if (k < n - 1) {
          const xe = d ? xb + e : xa - e;
          P.push([xe, y], [xe, y - s]);
        } else P.push([lastX != null ? lastX : d ? xb : xa, y]);
      }
      return P;
    }
    const IN = $('inner'),
      WA = $('walls'),
      HD = $('hdrs'),
      DM = $('dmp'),
      CH = $('chips'),
      LB = $('lbl'),
      TI = $('tiles');
    /* gas window duct from the cyclones */
    mk(IN, 'path', { d: 'M366 104 L190 104 L190 184 L366 184', fill: 'none', stroke: '#0b0f13', 'stroke-width': 1.5 });

    /* ---------- tube circuits (continuous) ---------- */
    /* reheater: cold reheat -> R-1 spray -> R-2 -> R-3 -> R-4 -> R-5 -> R-6 -> R-7 -> hot reheat */
    pipe([[190, 590], [360, 590]], 'rh', 16, 1.6);
    const R = [[360, 590], [392, 590]];
    serp(R, 392, 626, 590, 5, 12, true);
    R.push([643, 542], [643, 500]);
    serp(R, 392, 626, 500, 6, 12, false);
    R.push([643, 440], [643, 398]);
    serp(R, 392, 626, 398, 6, 12, false);
    R.push([643, 338], [643, 296]);
    serp(R, 392, 626, 296, 5, 12, false);
    R.push([360, 248]);
    pipe(R, 'rh', 6, 1.15, 'tf');
    pipe([[360, 248], [300, 248]], 'rh', 16, 1.6);
    /* spray water through TCV-FW1150 into desuperheater R-1 */
    pipe([[190, 500], [242, 500], [242, 584]], 'fw', 5, 1.4);
    FLOWS[FLOWS.length - 1][2] = FLOWS[FLOWS.length - 2][2] = 'spray';
    /* finishing superheater: S-34 -> banks -> S-38 -> main steam */
    pipe([[1080, 100], [1080, 448], [948, 448]], 'ms', 12, 1.6);
    const S = [[948, 448], [916, 448]];
    serp(S, 688, 916, 448, 5, 10, false);
    S.push([671, 408], [671, 372]);
    serp(S, 688, 916, 372, 6, 10, true);
    S.push([671, 322], [671, 286]);
    serp(S, 688, 916, 286, 5, 10, true);
    S.push([948, 246]);
    pipe(S, 'ms', 5, 0.95, 'tf');
    pipe([[948, 246], [990, 246], [990, 58], [1110, 58]], 'ms', 12, 1.4);
    /* economizers (FHI Part 3 Sect 3, p.3-3-3): E-1 -> ECO #1 (E-2) -> E-3 -> link E-4 -> E-5 under the dampers -> E-8 / E-9 -> ECO #2R
       (E-10) and E-6 -> ECO #2S (E-7) -> junction E-11 -> link E-12 -> E-13 -> ECO #3 (E-14, E-15) -> E-16 -> link E-17 -> drum */
    pipe([[1110, 990], [764, 990]], 'fw', 9, 1.6);
    const Ec = [[764, 990]];
    serp(Ec, 572, 736, 990, 3, 16, false);
    Ec.push([544, 958]);
    pipe(Ec, 'fw', 5, 1.1, 'tf');
    pipe([[544, 958], [352, 958], [352, 667], [376, 667]], 'fw', 7, 1.6);
    pipe([[352, 784], [958, 784], [958, 667], [932, 667]], 'fw', 7, 1.6);
    const B1 = [[376, 667]];
    serp(B1, 392, 626, 667, 3, 13, true);
    B1.push([654, 641]);
    pipe(B1, 'fw', 5, 1.1, 'tf');
    const B2 = [[932, 667]];
    serp(B2, 688, 916, 667, 3, 13, false);
    B2.push([654, 641]);
    pipe(B2, 'fw', 5, 1.1, 'tf');
    pipe([[654, 641], [654, 628], [972, 628], [972, 590], [948, 590]], 'fw', 7, 1.6);
    const T3 = [[948, 590], [916, 590]];
    serp(T3, 688, 916, 590, 4, 10, false);
    T3.push([926, 560], [926, 524]);
    serp(T3, 688, 916, 524, 4, 10, false);
    T3.push([948, 494]);
    pipe(T3, 'fw', 5, 1.1, 'tf');
    pipe([[948, 494], [1116, 494], [1116, 300]], 'fw', 9, 1.6);

    /* ---------- casing walls (fin-welded tube panels) ---------- */
    function wallV(x, y, h) {
      mk(WA, 'rect', { x, y, width: 16, height: h, fill: 'url(#b9-wallV)', stroke: '#0b0f13', 'stroke-width': 1.2 });
      mk(WA, 'line', { x1: x + 3, y1: y, x2: x + 3, y2: y + h, stroke: '#0b0f1366' });
      mk(WA, 'line', { x1: x + 13, y1: y, x2: x + 13, y2: y + h, stroke: '#0b0f1366' });
    }
    wallV(360, 80, 24);
    wallV(360, 184, 616);
    wallV(932, 80, 720);
    mk(WA, 'rect', { x: 646, y: 206, width: 16, height: 586, rx: 6, fill: 'url(#b9-wallV)', stroke: '#0b0f13', 'stroke-width': 1.2 });
    mk(WA, 'rect', { x: 356, y: 78, width: 596, height: 18, fill: 'url(#b9-wallH)', stroke: '#0b0f13', 'stroke-width': 1.2 });
    mk(WA, 'polygon', { points: '360,800 376,800 560,848 560,864 544,864', fill: '#6f7b86', stroke: '#0b0f13', 'stroke-width': 1.2 });
    mk(WA, 'polygon', { points: '948,800 932,800 748,848 748,864 764,864', fill: '#6f7b86', stroke: '#0b0f13', 'stroke-width': 1.2 });
    mk(WA, 'rect', { x: 544, y: 862, width: 16, height: 150, fill: '#6f7b86', stroke: '#0b0f13', 'stroke-width': 1.2 });
    mk(WA, 'rect', { x: 748, y: 862, width: 16, height: 150, fill: '#6f7b86', stroke: '#0b0f13', 'stroke-width': 1.2 });
    mk(WA, 'rect', { x: 356, y: 100, width: 24, height: 6, fill: MH, stroke: '#0b0f13' });
    mk(WA, 'rect', { x: 356, y: 182, width: 24, height: 6, fill: MH, stroke: '#0b0f13' });
    for (const p of [[360, 590], [360, 248], [360, 667], [360, 784], [932, 246], [932, 448], [932, 494], [932, 590], [932, 628], [932, 667], [932, 784]])
      mk(HD, 'rect', { x: p[0] - 3, y: p[1] - 9, width: 22, height: 18, rx: 2, fill: MH, stroke: '#0b0f13' });
    const wtxt = (x, y, t, rot) => mk(WA, 'text', { x, y, class: 'wl', 'text-anchor': 'middle', transform: rot ? 'rotate(-90 ' + x + ' ' + y + ')' : '' }, t);
    wtxt(371.5, 440, 'FRONT WALL S-6', 1);
    wtxt(943.5, 320, 'REAR WALL S-9', 1);
    wtxt(657.5, 410, 'DIVISION WALL S-13 · STEAM-COOLED', 1);
    wtxt(500, 90.5, 'ROOF S-8');

    /* ---------- desuperheater R-1 and the spray valve TCV-FW1150 ---------- */
    mk(HD, 'rect', { x: 206, y: 579, width: 66, height: 22, rx: 6, fill: sh(med.rh, -0.25), stroke: '#0b0f13', 'stroke-width': 2 });
    mk(HD, 'rect', { x: 206, y: 585, width: 66, height: 4, fill: sh(med.rh, 0.4), opacity: 0.6 });
    for (const x of [210, 264]) mk(HD, 'rect', { x, y: 576, width: 4, height: 28, fill: '#a9b3bc', stroke: '#0b0f13' });
    const vT = mk(HD, 'g', { 'data-hit': 'TCV', tabindex: 0, role: 'button', 'aria-label': 'TCV-FW1150 reheater spray valve: open control faceplate' });
    mk(vT, 'title', {}, 'TCV-FW1150 reheater spray valve · TICHR1002 (ABC-019)');
    const vBody = mk(vT, 'path', { d: 'M232 530 L252 530 L232 550 L252 550Z', fill: '#1b2228', stroke: '#6b7480', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    mk(vT, 'line', { x1: 252, y1: 540, x2: 268, y2: 540, stroke: '#a9b3bc', 'stroke-width': 2 });
    mk(vT, 'rect', { x: 268, y: 532, width: 12, height: 16, rx: 2, fill: MH, stroke: '#0b0f13' });

    /* ---------- biasing dampers: multi-blade louvres, blade angle from % open (redrawn when the position moves) ---------- */
    const dG = { RH: mk(DM, 'g', {}), SH: mk(DM, 'g', {}) };
    function damper(g, x0, x1, open, front) {
      g.replaceChildren();
      const n = 5,
        pitch = (x1 - x0) / n,
        th = (open == null ? 0 : open) * 0.9,
        rad = (th * Math.PI) / 180,
        yc = 748;
      mk(g, 'rect', { x: x0, y: yc - 22, width: x1 - x0, height: 6, fill: MH, stroke: '#0b0f13' });
      mk(g, 'rect', { x: x0, y: yc + 16, width: x1 - x0, height: 6, fill: MH, stroke: '#0b0f13' });
      mk(g, 'rect', { x: x0, y: yc - 22, width: 6, height: 44, fill: MV, stroke: '#0b0f13' });
      mk(g, 'rect', { x: x1 - 6, y: yc - 22, width: 6, height: 44, fill: MV, stroke: '#0b0f13' });
      const ca = Math.cos(rad + Math.PI / 2) * 11,
        sa = Math.sin(rad + Math.PI / 2) * 11,
        tips = [];
      for (let i = 0; i < n; i++) {
        const px = x0 + pitch * (i + 0.5);
        const b = mk(g, 'g', { transform: 'translate(' + px.toFixed(1) + ' ' + yc + ') rotate(' + th.toFixed(1) + ')' });
        mk(b, 'path', { d: 'M-24 0 Q-12 -5.5 0 -5 Q12 -4 24 0 Q12 4 0 5 Q-12 5.5 -24 0Z', fill: MH, stroke: '#0b0f13', 'stroke-width': 1.2 });
        mk(b, 'line', { x1: -22, y1: 0, x2: 22, y2: 0, stroke: '#ffffff33', 'stroke-width': 1 });
        tips.push([px - ca, yc - sa]);
      }
      tips.forEach((t, i) => mk(g, 'line', { x1: x0 + pitch * (i + 0.5), y1: yc, x2: t[0], y2: t[1], stroke: '#c3ccd3', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
      mk(g, 'line', { x1: tips[0][0], y1: tips[0][1], x2: tips[n - 1][0], y2: tips[n - 1][1], stroke: '#c3ccd3', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
      for (let i = 0; i < n; i++) mk(g, 'circle', { cx: x0 + pitch * (i + 0.5), cy: yc, r: 3.2, fill: '#dfe5ea', stroke: '#0b0f13' });
      const wx = front ? 360 : 948,
        bx = front ? x0 + pitch * 0.5 : x1 - pitch * 0.5;
      mk(g, 'rect', { x: Math.min(wx, bx), y: yc - 2, width: Math.abs(bx - wx), height: 4, fill: '#a9b3bc', stroke: '#0b0f13', 'stroke-width': 0.8 });
    }
    mk(WA, 'rect', { x: 357, y: 739, width: 22, height: 18, rx: 2, fill: MH, stroke: '#0b0f13' });
    mk(WA, 'rect', { x: 929, y: 739, width: 22, height: 18, rx: 2, fill: MH, stroke: '#0b0f13' });

    /* ---------- pneumatic actuators A-D outside the walls: drive shaft out of the wall at damper level, the 4 actuators under it,
       positioners fed from the air manifold above, buffer tank at the outer end, % feedback boxes under the actuators ---------- */
    const DR = {};
    function drives(id, xs, wallX, label, tagSub, yn, aria, tank) {
      const g = mk(DM, 'g', { 'data-hit': id, tabindex: 0, role: 'button', 'aria-label': aria });
      mk(g, 'title', {}, label + ' · ' + tagSub);
      const right = wallX > 600,
        far = right ? Math.max(...xs) + 24 : Math.min(...xs) - 24,
        sy = 748,
        my = 716;
      const tk = right ? 1176 : 12,
        tx = right ? tk : tk + 92;
      pipe([[tx, my], [right ? Math.min(...xs) + 9 : Math.max(...xs) - 9, my]], 'ia', 4, 2.2);
      for (const xc of xs) {
        const px = right ? xc + 15 : xc - 15;
        pipe([[px, my], [px, 764]], 'ia', 3, 1.8);
      }
      mk(g, 'rect', { x: Math.min(wallX, far), y: sy - 2.5, width: Math.abs(far - wallX), height: 5, fill: '#a9b3bc', stroke: '#0b0f13', 'stroke-width': 0.8 });
      const cranks = mk(g, 'g', {}),
        vals = [];
      xs.forEach((xc, i) => {
        const px = right ? xc + 9 : xc - 21;
        mk(g, 'rect', { x: xc - 11, y: 760, width: 22, height: 5, rx: 1, fill: MH, stroke: '#0b0f13' });
        vals.push(mk(g, 'rect', { x: xc - 9, y: 764, width: 18, height: 40, rx: 3, fill: MV, stroke: '#6b7480', 'stroke-width': 2 }));
        mk(g, 'text', { x: xc, y: 789, 'text-anchor': 'middle', fill: '#0b0f13', 'font-weight': 800, 'font-size': 12, 'font-family': 'Inter,Arial' }, 'ABCD'[i]);
        mk(g, 'rect', { x: px, y: 764, width: 12, height: 16, rx: 2, fill: '#3b444c', stroke: '#0b0f13' });
        mk(g, 'circle', { cx: px + 6, cy: 772, r: 2.4, fill: '#c3ccd3' });
        mk(g, 'rect', { x: xc - 21, y: 812, width: 42, height: 24, fill: '#06090c', stroke: '#2c3640' });
        vals.push(mk(g, 'text', { x: xc + 17, y: 830, class: 'num', 'text-anchor': 'end', 'font-size': 15 }, '-----'));
      });
      mk(g, 'rect', { x: tk + 14, y: my + 12, width: 8, height: 10, fill: '#3b444c' });
      mk(g, 'rect', { x: tk + 70, y: my + 12, width: 8, height: 10, fill: '#3b444c' });
      mk(g, 'rect', { x: tk, y: my - 15, width: 92, height: 30, rx: 15, fill: MH, stroke: '#0b0f13', 'stroke-width': 1.5 });
      mk(g, 'text', { x: tk + 46, y: my + 4, 'text-anchor': 'middle', fill: '#0b0f13', 'font-weight': 800, 'font-size': 11, 'font-family': 'Inter,Arial', 'letter-spacing': '.06em' }, right ? 'T-1064B' : 'T-1064A');
      const ix = right ? tk + 70 : tk + 22,
        ty = right ? my - 96 : my - 58;
      pipe([[ix, ty], [ix, my - 15]], 'ia', 4, 2.2);
      mk(LB, 'path', { d: 'M' + ix + ' ' + (ty + 2) + ' L' + (ix - 6) + ' ' + (ty - 8) + ' L' + (ix + 6) + ' ' + (ty - 8) + 'Z', fill: med.ia });
      const lx = right ? ix - 12 : ix + 12,
        an = right ? 'end' : 'start';
      mk(LB, 'text', { x: lx, y: ty - 4, class: 'card-t', 'text-anchor': an }, 'INSTRUMENT AIR');
      mk(LB, 'text', { x: lx, y: ty + 11, class: 'card-s', 'text-anchor': an }, 'from header (dryers)');
      const bx = right ? tk + 16 : tk + 8;
      mk(LB, 'text', { x: bx, y: my + 40, class: 'tag' }, tank);
      mk(LB, 'rect', { x: bx, y: my + 46, width: 62, height: 26, fill: '#06090c', stroke: '#2c3640' });
      const tv = mk(LB, 'text', { x: bx + 56, y: my + 65, class: 'num', 'text-anchor': 'end', 'font-size': 17 }, '-----');
      mk(LB, 'text', { x: bx + 62, y: my + 88, class: 'unit', 'text-anchor': 'end' }, 'kg/cm²');
      const hx = right ? 996 : 20;
      mk(g, 'text', { x: hx + 38, y: 920, class: 'card-t' }, label);
      mk(g, 'text', { x: hx + 38, y: 937, class: 'card-s' }, tagSub);
      const yb = mk(LB, 'g', { 'data-hit': yn, 'data-eqb': yn, tabindex: 0, role: 'button', 'aria-label': 'Purge permissive: open permissive, monitor and trend' });
      mk(yb, 'title', {}, 'Permissive, monitor and trend');
      const ybR = mk(yb, 'rect', { x: hx, y: 904, width: 28, height: 22, rx: 3, fill: '#6b7480' });
      const ybT = mk(yb, 'text', { x: hx + 14, y: 920, 'text-anchor': 'middle', fill: '#fff', 'font-weight': 700, 'font-size': 14 }, '-');
      DR[id] = { xs, right, cranks, vals, tv, ybR, ybT, sy };
    }
    /* the crank on the shaft (angle follows % open) and the piston rod; the cylinder rim red when open */
    function cranks(id, P) {
      const d = DR[id];
      d.cranks.replaceChildren();
      d.xs.forEach((xc, i) => {
        const o = P[i],
          th = ((o == null ? 0 : o) * 0.9 * Math.PI) / 180,
          kx = xc + Math.cos(th) * 10 * (d.right ? 1 : -1),
          ky = d.sy + Math.sin(th) * 10;
        mk(d.cranks, 'line', { x1: xc, y1: d.sy, x2: kx, y2: ky, stroke: '#c3ccd3', 'stroke-width': 3, 'stroke-linecap': 'round' });
        mk(d.cranks, 'line', { x1: kx, y1: ky, x2: xc, y2: 762, stroke: '#dfe5ea', 'stroke-width': 3 });
        mk(d.cranks, 'circle', { cx: xc, cy: d.sy, r: 4, fill: '#5d6872', stroke: '#0b0f13' });
        d.vals[i * 2].setAttribute('stroke', o == null ? '#6b7480' : o > 1 ? '#e5484d' : '#2fa56a');
        d.vals[i * 2 + 1].textContent = fmt(o, 1);
        d.vals[i * 2 + 1].setAttribute('fill', o == null ? '#6b7480' : '#f4f7f9');
      });
    }
    drives('gRH', [330, 272, 214, 156], 360, 'REHEATER PASS DAMPERS', 'TCV-FG1116 A–D · % open', 'ynRH', 'Reheater pass dampers: open control faceplate', 'PIIA1064A');
    drives('gSH', [978, 1036, 1094, 1152], 948, 'SUPERHEATER PASS DAMPERS', 'TCV-FG1117 A–D · % open', 'ynSH', 'Superheater pass dampers: open control faceplate', 'PIIA1064B');

    /* ---------- gas temperature points: thermowell from the wall + reading ---------- */
    const CHV = {};
    function chip(tag, y, front) {
      const x = front ? 394 : 772,
        wx = front ? 376 : 932,
        tx = front ? 390 : 918;
      mk(CH, 'line', { x1: wx, y1: y, x2: tx, y2: y, stroke: '#c3ccd3', 'stroke-width': 3 });
      mk(CH, 'circle', { cx: tx, cy: y, r: 3, fill: '#e9edf0', stroke: '#0b0f13' });
      mk(CH, 'rect', { x, y: y - 12, width: 142, height: 24, rx: 4, fill: '#06090ce8', stroke: '#3a4652' });
      mk(CH, 'text', { x: x + 8, y: y + 4.5, class: 'chip-t' }, tag);
      CHV[tag] = mk(CH, 'text', { x: x + 114, y: y + 5.5, class: 'chip-v', 'text-anchor': 'end' }, '-----');
      mk(CH, 'text', { x: x + 118, y: y + 4.5, class: 'unit', 'font-size': 11 }, '°C');
    }
    const RHT = [['TIFG1100', 214], ['TIFG1102', 317], ['TIFG1104', 419], ['TIFG1106', 521], ['TIFG1108', 609], ['TIFG1110', 697]],
      SHT = [['TIFG1101', 214], ['TIFG1103', 304], ['TIFG1105', 390], ['TIFG1107', 466], ['TIFG1109', 542], ['TIFG1111', 609], ['TIFG1113', 697]];
    for (const c of RHT) chip(c[0], c[1], true);
    for (const c of SHT) chip(c[0], c[1], false);

    /* ---------- labels ---------- */
    function T2(x, y, a, parts) {
      const t = mk(LB, 'text', { x, y, 'text-anchor': a });
      for (const p of parts) mk(t, 'tspan', { class: p[1], dx: p[2] || 0 }, p[0]);
    }
    T2(350, 280, 'end', [['reheater', 'bank-s'], ['R-6', 'bank', 6]]);
    T2(350, 373, 'end', [['reheater', 'bank-s'], ['R-5', 'bank', 6]]);
    T2(350, 475, 'end', [['reheater', 'bank-s'], ['R-4', 'bank', 6]]);
    T2(350, 571, 'end', [['reheater', 'bank-s'], ['R-3', 'bank', 6]]);
    T2(350, 652, 'end', [['ECONOMIZER #2R', 'bank']]);
    mk(LB, 'text', { x: 962, y: 322, class: 'bank' }, 'FINISHING');
    mk(LB, 'text', { x: 962, y: 339, class: 'bank' }, 'SUPERHEATER');
    mk(LB, 'text', { x: 962, y: 356, class: 'bank-s' }, 'S-35 · S-36 · S-37');
    mk(LB, 'text', { x: 992, y: 516, class: 'bank' }, 'ECONOMIZER #3 UPPER');
    mk(LB, 'text', { x: 992, y: 576, class: 'bank' }, 'ECONOMIZER #3 LOWER');
    mk(LB, 'text', { x: 992, y: 660, class: 'bank' }, 'ECONOMIZER #2S');
    mk(LB, 'rect', { x: 574, y: 896, width: 160, height: 20, rx: 3, fill: '#0b0f13d9' });
    mk(LB, 'text', { x: 654, y: 910, class: 'inside', 'text-anchor': 'middle' }, 'ECONOMIZER #1 · COMMON');
    for (const h of [[346, 232, 'middle', 'R-7'], [958, 272, 'start', 'S-38'], [346, 614, 'middle', 'R-2'], [960, 438, 'start', 'S-34'], [772, 1008, 'start', 'E-1'], [632, 630, 'end', 'E-11'], [984, 612, 'start', 'E-12'], [530, 950, 'end', 'E-3 · E-4'], [384, 797, 'start', 'E-5']]) {
      if (h[3] === 'E-11') mk(LB, 'rect', { x: 596, y: 618, width: 40, height: 16, rx: 3, fill: '#0b0f13e6' });
      mk(LB, 'text', { x: h[0], y: h[1], class: 'tag', 'text-anchor': h[2] }, h[3]);
    }
    mk(LB, 'text', { x: 239, y: 622, class: 'card-s', 'text-anchor': 'middle' }, 'R-1 desuperheater');
    mk(LB, 'text', { x: 224, y: 536, class: 'tag', 'text-anchor': 'end' }, 'TCV-FW1150');
    const vTx = mk(LB, 'text', { x: 224, y: 552, class: 'st', 'text-anchor': 'end', fill: '#6b7480' }, '-----');
    mk(LB, 'text', { x: 511, y: 200, class: 'inside', 'text-anchor': 'middle', fill: '#c9d1d8' }, 'REHEATER PASS');
    mk(LB, 'text', { x: 797, y: 200, class: 'inside', 'text-anchor': 'middle', fill: '#c9d1d8' }, 'SUPERHEATER PASS');
    /* line ends like the plant HMI: medium name beside the line, small arrowhead for the direction */
    function endH(x, y, side, out, m, t, sub) {
      const Lf = side === 'L',
        x2 = Lf ? x - 16 : x + 16;
      mk(LB, 'line', { x1: x, y1: y, x2, y2: y, stroke: med[m], 'stroke-width': 3 });
      const tip = out ? x2 + (Lf ? -2 : 2) : x + (Lf ? -1 : 1),
        base = out ? tip + (Lf ? 10 : -10) : tip + (Lf ? -10 : 10);
      mk(LB, 'path', { d: 'M' + tip + ' ' + y + ' L' + base + ' ' + (y - 6) + ' L' + base + ' ' + (y + 6) + 'Z', fill: med[m] });
      const tx = Lf ? x - 24 : x + 24,
        an = Lf ? 'end' : 'start';
      mk(LB, 'text', { x: tx, y: y - 2, class: 'card-t', 'text-anchor': an }, t);
      if (sub) [].concat(sub).forEach((s, i) => mk(LB, 'text', { x: tx, y: y + 15 + i * 15, class: 'card-s', 'text-anchor': an }, s));
    }
    function endV(x, y, up, m) {
      const y2 = up ? y - 14 : y + 14;
      mk(LB, 'line', { x1: x, y1: y, x2: x, y2, stroke: med[m], 'stroke-width': 3 });
      const tip = up ? y2 - 2 : y2 + 2,
        base = up ? tip + 10 : tip - 10;
      mk(LB, 'path', { d: 'M' + x + ' ' + tip + ' L' + (x - 6) + ' ' + base + ' L' + (x + 6) + ' ' + base + 'Z', fill: med[m] });
    }
    endH(300, 248, 'L', 1, 'rh', 'HOT REHEAT', 'to intermediate-pressure turbine');
    endH(190, 144, 'L', 0, 'gas', 'FLUE GAS', 'from the cyclones');
    endH(190, 500, 'L', 0, 'fw', 'SPRAY WATER', 'reheater spray');
    endH(190, 590, 'L', 0, 'rh', 'COLD REHEAT', 'from high-pressure turbine');
    endH(1110, 58, 'R', 1, 'ms', 'MAIN STEAM', 'to high-pressure turbine');
    endH(1110, 990, 'R', 0, 'fw', 'FEEDWATER', ['from feed stop', 'and check valves']);
    mk(LB, 'line', { x1: 1080, y1: 100, x2: 1080, y2: 86, stroke: med.ms, 'stroke-width': 3 });
    mk(LB, 'path', { d: 'M1080 102 L1074 92 L1086 92Z', fill: med.ms });
    mk(LB, 'text', { x: 1096, y: 98, class: 'card-t' }, 'SUPERHEATED STEAM');
    mk(LB, 'text', { x: 1096, y: 115, class: 'card-s' }, 'from furnace panels');
    mk(LB, 'text', { x: 1096, y: 130, class: 'card-s' }, 'via desuperheater #2');
    endV(1116, 300, true, 'fw');
    mk(LB, 'text', { x: 1130, y: 294, class: 'card-t' }, 'FEEDWATER');
    mk(LB, 'text', { x: 1130, y: 310, class: 'card-s' }, 'to steam drum');
    mk(LB, 'path', { d: 'M654 1022 L644 1010 L664 1010Z', fill: med.gasc });
    mk(LB, 'text', { x: 536, y: 996, class: 'card-t', 'text-anchor': 'end' }, 'FLUE GAS');
    mk(LB, 'text', { x: 536, y: 1012, class: 'card-s', 'text-anchor': 'end' }, 'to air preheater H-1052 · page 038');
    [['FLUE GAS', '#b85a3c'], ['REHEAT STEAM', med.rh], ['MAIN STEAM', med.ms], ['FEEDWATER', med.fw], ['INSTRUMENT AIR', med.ia]].forEach((l, i) => {
      mk(LB, 'rect', { x: 1130, y: 330 + i * 22, width: 26, height: 8, fill: l[1] });
      mk(LB, 'text', { x: 1164, y: 339 + i * 22, class: 'unit', fill: '#c9d1d8' }, l[0]);
    });

    /* ---------- controller tiles along the bottom (live: mode, values, output bar) ---------- */
    const TL = [
      { id: 'tTIC', tag: 'TICHR1002A', fp: 'TICHR1002A', desc: 'Reheater outlet header temperature', vals: [['Measured', 'pv', '°C', 0], ['Setpoint', 'sv', '°C', 0], ['Output', 'mv', '%', 0]] },
      { id: 'tHICA', tag: 'HICHR1002A', fp: 'HICHR1002A', desc: 'Reheater gas bias damper · TCV-FG1116', vals: [['Output', 'mv', '%', 1]], lim: 'limits 10–100 %' },
      { id: 'tHICB', tag: 'HICHR1002B', fp: 'HICHR1002B', desc: 'Superheater gas bias damper · TCV-FG1117', vals: [['Output', 'mv', '%', 1]], lim: 'auto in normal operation' },
      { id: 'tTCV', tag: 'TCV-FW1150', fp: 'TICHR1002', desc: 'Reheater spray · desuperheater R-1', vals: [['Measured', 'pv', '°C', 0], ['Setpoint', 'sv', '°C', 0], ['Output', 'mv', '%', 1]] }
    ];
    TL.forEach((t, i) => {
      const x = 16 + i * 314,
        y = 1054,
        w = 300,
        h = 92;
      const g = mk(TI, 'g', { 'data-hit': t.id, tabindex: 0, role: 'button', 'aria-label': t.tag + ': open control faceplate' });
      mk(g, 'title', {}, t.fp + ' · click: faceplate');
      mk(g, 'rect', { class: 'tile-bg', x, y, width: w, height: h, rx: 4, fill: '#1a2128', stroke: '#2c3640', 'stroke-width': 1.5 });
      mk(g, 'text', { x: x + 14, y: y + 22, class: 'tag', 'font-weight': 600, fill: '#f1f4f6', 'font-size': 14 }, t.tag);
      t.mR = mk(g, 'rect', { x: x + w - 82, y: y + 9, width: 68, height: 19, rx: 3, fill: '#2a343e', stroke: '#47535f' });
      t.mT = mk(g, 'text', { x: x + w - 48, y: y + 22.5, class: 'st', 'text-anchor': 'middle', fill: '#f1f4f6' }, '-----');
      mk(g, 'text', { x: x + 14, y: y + 40, class: 'card-s' }, t.desc);
      t.vT = t.vals.map((v, k) => {
        const bx = x + 14 + k * 94;
        mk(g, 'text', { x: bx, y: y + 57, class: 'unit', 'font-size': 11 }, v[0]);
        mk(g, 'rect', { x: bx, y: y + 62, width: 86, height: 24, fill: '#06090c', stroke: '#2c3640' });
        const e = mk(g, 'text', { x: bx + 60, y: y + 80, class: 'num', 'font-size': 16, 'text-anchor': 'end' }, '-----');
        mk(g, 'text', { x: bx + 65, y: y + 79, class: 'unit', 'font-size': 11 }, v[2]);
        return e;
      });
      if (t.vals.length === 1) {
        const bx = x + 116,
          bw = w - 130;
        mk(g, 'text', { x: bx, y: y + 57, class: 'unit', 'font-size': 11 }, t.lim);
        mk(g, 'rect', { x: bx, y: y + 66, width: bw, height: 14, fill: '#06090c', stroke: '#2c3640' });
        t.bar = mk(g, 'rect', { x: bx + 1, y: y + 67, width: 0, height: 12, fill: '#5d7f9e' });
        t.bw = bw;
        for (const p of [0, 25, 50, 75, 100]) mk(g, 'line', { x1: bx + (bw * p) / 100, y1: y + 80, x2: bx + (bw * p) / 100, y2: y + 84, stroke: '#47535f' });
      }
    });

    /* ---------- flue gas: HTML layers behind the drawing (option A), CSS transform only ---------- */
    const GL = q('.gasL'),
      F = 36,
      TW = 360,
      TH = 820;
    if (!TEX) TEX = noiseTex(128, 256, 4, 6, 11);
    const RHg = [[206, 864], [317, 657], [419, 504], [521, 443], [609, 388], [697, 359], [800, 355]],
      SHg = [[206, 854], [304, 694], [390, 584], [466, 502], [542, 426], [609, 382], [697, 370], [800, 365]],
      CM = [[300, [40, 33, 30]], [380, [58, 39, 31]], [460, [82, 46, 33]], [560, [112, 52, 34]], [700, [140, 58, 36]], [870, [178, 80, 46]]];
    const col = t => {
      let c = CM[CM.length - 1][1];
      if (t <= CM[0][0]) c = CM[0][1];
      else
        for (let i = 1; i < CM.length; i++)
          if (t <= CM[i][0]) {
            const a = CM[i - 1],
              b = CM[i],
              f = (t - a[0]) / (b[0] - a[0]);
            c = [0, 1, 2].map(k => Math.round(a[1][k] + (b[1][k] - a[1][k]) * f));
            break;
          }
      return 'rgb(' + c + ')';
    };
    const grad = (T, y0, y1) => 'linear-gradient(to bottom,' + T.map(p => col(p[1]) + ' ' + (((p[0] - y0) / (y1 - y0)) * 100).toFixed(1) + '%').join(',') + ')';
    const kf = document.createElement('style');
    kf.textContent = `@keyframes b9gD{from{transform:translateY(-${TH}px)}to{transform:translateY(0)}}@keyframes b9gR{from{transform:translateX(-${TH}px)}to{transform:translateX(0)}}@keyframes b9gDR{from{transform:translate(-${TW}px,-${TH}px)}to{transform:translate(0,0)}}`;
    root.append(kf);
    const box = (x, y, w, h) => {
      const z = document.createElement('div');
      z.className = 'gz';
      z.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
      GL.appendChild(z);
      return z;
    };
    const HOP = y0 => {
      const h = 1010 - y0,
        t = 800 - y0,
        s = 848 - y0;
      return `polygon(0 0,100% 0,100% ${(t / h) * 100}%,${(372 / 556) * 100}% ${(s / h) * 100}%,${(372 / 556) * 100}% 100%,${(184 / 556) * 100}% 100%,${(184 / 556) * 100}% ${(s / h) * 100}%,0 ${(t / h) * 100}%)`;
    };
    const hot = col(866);
    box(190, 104, 186, 80).style.background = hot;
    box(376, 96, 556, 112).style.background = 'linear-gradient(to bottom,' + hot + ',' + col(864) + ')';
    box(376, 205, 279, 596).style.background = grad(RHg, 205, 801);
    box(654, 205, 278, 596).style.background = grad(SHg, 205, 801);
    const hb = box(376, 800, 556, 210);
    hb.style.background = 'linear-gradient(to bottom,' + col(360) + ',' + col(330) + ')';
    hb.style.clipPath = HOP(800);
    function wave(x, y, w, h, dir, dur, a, fade, clip) {
      const z = box(x, y, w, h);
      const m =
        fade === 'x'
          ? `linear-gradient(to right,#000 calc(100% - ${F}px),transparent)`
          : fade === 'tb'
            ? `linear-gradient(to bottom,transparent,#000 ${F}px,#000 calc(100% - ${F}px),transparent)`
            : fade === 't'
              ? `linear-gradient(to bottom,transparent,#000 ${F}px)`
              : `linear-gradient(to bottom,#000 calc(100% - ${F}px),transparent),linear-gradient(to right,transparent,#000 ${F}px)`;
      z.style.webkitMaskImage = z.style.maskImage = m;
      if (fade === 'lb') ((z.style.webkitMaskComposite = 'source-in'), (z.style.maskComposite = 'intersect'));
      if (clip) z.style.clipPath = clip;
      z.style.opacity = Math.min(1, a * 6);
      const gw = document.createElement('div');
      gw.className = 'gw';
      const T = `url(${TEX}) 0 0/${TW}px ${TH}px repeat`,
        TR = `url(${TEX}) 0 0/${TH}px ${TW}px repeat`;
      if (dir === 'R') gw.style.cssText = `left:0;top:0;bottom:0;width:calc(100% + ${TH}px);background:${TR};animation-name:b9gR`;
      else if (dir === 'DR') gw.style.cssText = `left:0;top:0;width:calc(100% + ${TW}px);height:calc(100% + ${TH}px);background:${T};animation-name:b9gDR`;
      else gw.style.cssText = `left:0;top:0;right:0;height:calc(100% + ${TH}px);background:${T};animation-name:b9gD`;
      gw.style.animationDuration = (dur * TH) / 120 + 's';
      z.appendChild(gw);
    }
    wave(190, 104, 186 + F, 80, 'R', 1.6, 0.15, 'x'); /* inlet window: in from the cyclones, sideways */
    wave(376 - F, 96, 556 + F, 110 + F, 'DR', 2.2, 0.15, 'lb'); /* under the roof: turning down */
    wave(376, 206 - F, 278, 516 + 2 * F, 'D', 6.5, 0.1, 'tb'); /* reheater pass: slow, faint */
    wave(654, 206 - F, 278, 516 + 2 * F, 'D', 2.8, 0.17, 'tb'); /* superheater pass */
    wave(376, 722 - F, 278, 78 + 2 * F, 'D', 3.2, 0.12, 'tb'); /* reheater damper gaps (~11 %) */
    wave(654, 722 - F, 278, 78 + 2 * F, 'D', 1.4, 0.19, 'tb'); /* superheater damper gaps (~89 %) */
    wave(376, 800 - F, 556, 210 + F, 'D', 0.95, 0.19, 't', HOP(800 - F)); /* hopper and ECO #1 duct: fastest, out to the air preheater */

    /* ---------- live ---------- */
    const live = (it, set) => api.reg(it, set, null);
    const val = (tag, ref, set) => live({ t: 'val', tag: tag || '', ref: ref || undefined, v: '' }, X => set(X && isFinite(X.v) ? +X.v : null));
    /* the gas temperatures: the logic value, else the plant estimate of 007 (the same inputs as 007 / 038) */
    const EST = PLANT_V2.EST || {},
      E = { tb: null, pa0: 354, sa0: 213, fa0: 26.3, idf: 1, paf: 1, saf: 1 },
      LV = {};
    const get = t => {
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
      for (const t in CHV) {
        const v = get(t);
        CHV[t].textContent = fmt(v, 0);
        CHV[t].setAttribute('fill', v == null ? '#6b7480' : '#f4f7f9');
      }
    };
    let rq = 0;
    const later = () => rq || (rq = setTimeout(() => ((rq = 0), paint()), 60));
    const inp = (k, ref, tag) => val(tag, ref, v => ((E[k] = v), later()));
    inp('fpa', 'pv:FICFA1071');
    inp('fsa', 'pv:FICFA1081');
    inp('ffa', '', 'FIFA1055');
    inp('pf0', '', 'PIFG1085');
    inp('ta', '', 'TIFA1072');
    inp('ts', '', 'TIFA1082');
    const FAN = { idf: 'ABC-008|M.3304', saf: 'ABC-007|M.3303', paf: 'ABC-007|M.3302' };
    for (const k in FAN) val('', FAN[k], v => ((E[k] = v == null ? 1 : v > 0.5 ? 1 : 0), later()));
    const TT = {};
    for (const c of 'ABCDEFGHI')
      for (const pre of ['TIFG1091', 'TIFG1090'])
        val(pre + c, '', v => {
          TT[pre + c] = v;
          const Lt = Object.values(TT).filter(x => x != null);
          E.tb = Lt.length ? Lt.reduce((a, b) => a + b, 0) / Lt.length : null;
          later();
        });
    for (const [t] of [...RHT, ...SHT]) if (!EST[t]) val(t, '', v => ((LV[t] = v), later()));
    /* the controllers: PV / SV / MV and mode (M / A / R) of their faceplate */
    const CT = {};
    const MODE = { M: 'MANUAL', A: 'AUTO', R: 'REMOTE' };
    for (const t of TL)
      live({ t: 'ctl', tag: t.fp }, X => {
        CT[t.fp] = X || null;
        t.mT.textContent = X ? MODE[X.m] || '-----' : '-----';
        t.mR.setAttribute('fill', X && X.m === 'R' ? '#2a5d8c' : '#2a343e');
        t.vals.forEach((v, k) => {
          const x = X ? X[v[1]] : null;
          t.vT[k].textContent = fmt(x, v[3]);
          t.vT[k].setAttribute('fill', x == null || !isFinite(x) ? '#6b7480' : '#f4f7f9');
        });
        if (t.bar) t.bar.setAttribute('width', (((t.bw - 2) * Math.max(0, Math.min(100, X && isFinite(X.mv) ? X.mv : 0))) / 100).toFixed(1));
      });
    /* the damper positions: ZT-FG1116 / 1117 A ~ D (I/O list station 104 AI0368 ~ AI0375, read by ABC-020), else the output of
       their MAN station HICHR1002A / B; the blades follow the average of the four */
    const POS = { RH: [null, null, null, null], SH: [null, null, null, null] },
      ZT = {};
    let pend = 0;
    const redraw = () =>
      pend ||
      (pend = setTimeout(() => {
        pend = 0;
        for (const [k, id, x0, x1, fr] of [['RH', 'gRH', 376, 632, 1], ['SH', 'gSH', 678, 932, 0]]) {
          const P = POS[k],
            ok = P.filter(x => x != null),
            av = ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null;
          const key = P.map(x => (x == null ? '-' : x.toFixed(1))).join();
          if (dG[k]._k === key) continue;
          dG[k]._k = key;
          damper(dG[k], x0, x1, av, fr);
          cranks(id, P);
        }
      }, 120));
    ['A', 'B', 'C', 'D'].forEach((c, i) => {
      for (const [k, ai, hic] of [['RH', 368, 'HICHR1002A'], ['SH', 372, 'HICHR1002B']]) {
        val('', 'ABC-020|S4 AI0' + (ai + i), v => ((ZT[k + c] = v != null), v != null && ((POS[k][i] = v), redraw())));
        val('', 'mv:' + hic, v => {
          if (ZT[k + c]) return;
          POS[k][i] = v;
          redraw();
        });
      }
    });
    redraw();
    /* the spray valve TCV-FW1150 (MV of TICHR1002, ABC-019) */
    let spray = null;
    live({ t: 'valve', tag: 'TCVFW1150', v: '' }, X => {
      spray = X && isFinite(X.v) ? +X.v : null;
      const o = spray != null && spray > 1;
      vBody.setAttribute('fill', spray == null ? '#1b2228' : o ? '#3a1618' : '#16301f');
      vBody.setAttribute('stroke', spray == null ? '#6b7480' : o ? '#e5484d' : '#2fa56a');
      vTx.textContent = spray == null ? '-----' : o ? 'OPEN ' + fmt(spray, 1) + ' %' : 'CLOSED';
      vTx.setAttribute('fill', spray == null ? '#6b7480' : o ? '#e5484d' : '#2fa56a');
    });
    /* the buffer tanks: PT-IA1064-A / B (I/O list AI0438 / AI0470, PICT 39) are on no logic sheet. The over-all instrument list puts
       them on P&ID PD-023 sheet 6/6, the instrument air drawing (with IA1706 instrument air to unit 1 and IA1128 the turning gear
       buffer tank): the tank is filled from the instrument air header, so without a logic value it shows the instrument air
       pressure of the plant model (unit.js AN_AIR, U.iaP; 7.0 kg/cm2 at 150 MW = these two gauges on 39.PNG). ASSUMED: no drop
       across the tank inlet (no data) */
    const PII = {},
      PIL = {},
      PIM = { v: null };
    const piShow = () => {
      for (const [id, tg] of [['gRH', 'PIIA1064A'], ['gSH', 'PIIA1064B']]) {
        const v = PIL[tg] != null ? PIL[tg] : PIM.v;
        PII[tg] = v;
        DR[id].tv.textContent = fmt(v, 1);
        DR[id].tv.setAttribute('fill', v == null ? '#6b7480' : '#f4f7f9');
      }
    };
    for (const tg of ['PIIA1064A', 'PIIA1064B']) val(tg, '', v => ((PIL[tg] = v), piShow()));
    val('UNIT.iaP', '', v => ((PIM.v = v), piShow()));
    /* the interlock memories of ABC-020: purge (reheater >= 30 % M.0506, superheater >= 60 % M.0507), ID fan start (> 95 %
       M.3440 / M.3441) */
    const MEM = {};
    for (const a of ['M.0506', 'M.0507', 'M.3440', 'M.3441']) val('', 'ABC-020|S4 ' + a, v => ((MEM[a] = v == null ? null : v > 0.5 ? 1 : 0), yn()));
    function yn() {
      for (const [id, a] of [['gRH', 'M.0506'], ['gSH', 'M.0507']]) {
        const v = MEM[a],
          d = DR[id];
        d.ybR.setAttribute('fill', v == null ? '#6b7480' : v ? '#e5484d' : '#2fa56a');
        d.ybT.textContent = v == null ? '-' : v ? 'Y' : 'N';
      }
    }
    yn();
    /* the main steam flow (header MSF): the steam and feedwater tubes flow while the boiler makes steam */
    let msf = null;
    if (api.HDR && api.HDR.MSF) val('MSF', api.HDR.MSF, v => (msf = v));

    /* everything that moves: the tube flows on the 15 Hz clock, the flue gas by CSS (paused with the simulation or the induced draft
       fan) */
    const still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    let t0 = null;
    H.clock(t => {
      if (!pg.isConnected) return false;
      const dt = t0 == null ? 0 : Math.min(0.2, t - t0);
      t0 = t;
      const go = !still && H.simRunning(),
        steam = msf == null || msf > 5,
        on = { rh: steam, ms: steam, fw: steam, ia: true, spray: spray != null && spray > 1 };
      root.classList.toggle('still', !go || !E.idf);
      for (const f of FLOWS) {
        const o = on[f[2]];
        if (f._o !== o) (f[0].setAttribute('visibility', o ? 'visible' : 'hidden'), (f._o = o));
        if (o && go) f[0].setAttribute('stroke-dashoffset', ((f._d = ((f._d || 0) - f[1] * dt) % 100)).toFixed(1));
      }
    });

    /* ---------- #59 faceplates ---------- */
    const bind = (id, f) =>
      root.querySelectorAll(`[data-hit="${id}"]`).forEach(h => {
        h.addEventListener('click', e => (e.stopPropagation(), f()));
        h.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), f()));
      });
    for (const t of TL) bind(t.id, () => api.fp(t.fp));
    bind('gRH', () => api.fp('HICHR1002A'));
    bind('gSH', () => api.fp('HICHR1002B'));
    bind('TCV', () => api.fp('TICHR1002'));
    const forced = ['Master fuel trip', 'Steam flow < 15 % of maximum continuous rating', 'High-pressure bypass closed', 'Cyclone outlet > 535 °C', 'Purge complete', 'Reheater outlet > 555 °C', 'ID fan running'];
    const sop = ['Cold: closed', 'After air preheater start: 100 %', 'Before ID / PA fan: 100 % (> 95 %)', 'After purge: reheater 30 / superheater 70', 'Operator sets 10 / 90, superheater to AUTO', 'After synchronization: reheater remote-auto'];
    const per = (k, n, tank, gin, gout, ginT, goutT, pm, im, pl, il) => () =>
      window.LS_FPOP &&
      LS_FPOP.info({
        n,
        t: 'ABC-020',
        permH: 'PERMISSIVE · ABC-020',
        perm: [[pl + ' · ' + pm, () => MEM[pm]], [il + ' · ' + im, () => MEM[im]]],
        lists: [['FORCED POSITION APPLIES ON', forced], ['START-UP SEQUENCE · PR-OPE-5002', sop]],
        mon: [
          ['A', () => POS[k][0], '%', 1],
          ['B', () => POS[k][1], '%', 1],
          ['C', () => POS[k][2], '%', 1],
          ['D', () => POS[k][3], '%', 1],
          ['Buffer tank · ' + tank, () => PII[tank], 'kg/cm² · low alarm 4.0', 1],
          [gin + ' · ' + ginT, () => get(ginT), '°C', 0],
          [gout + ' · ' + goutT, () => get(goutT), '°C', 0]
        ],
        trend: { h: 'TREND · 10 min · reheater outlet TICHR1002A °C', fn: () => (CT.TICHR1002A ? CT.TICHR1002A.pv : null), col: '#a596cf' }
      });
    bind('ynRH', per('RH', 'TCV-FG1116', 'PIIA1064A', 'Gas into reheater', 'Gas out of ECO #2R', 'TIFG1100', 'TIFG1110', 'M.0506', 'M.3440', 'Purge: reheater ≥ 30 %', 'ID fan start: reheater > 95 %'));
    bind('ynSH', per('SH', 'TCV-FG1117', 'PIIA1064B', 'Gas into superheater', 'Gas out of ECO #2S', 'TIFG1101', 'TIFG1113', 'M.0507', 'M.3441', 'Purge: superheater ≥ 60 %', 'ID fan start: superheater > 95 %'));
    paint();
    return pg;
  }
  PLANT_V2.screens.BIAS = page;
  /* after 038 AIR PREHEATER in the list of the Plant view */
  const Ls = (window.PLANT_SYS = window.PLANT_SYS || []),
    i = Ls.findIndex(x => x.id === 'APH');
  Ls.splice(i >= 0 ? i + 1 : Ls.length, 0, {
    fitAll: 1,
    id: 'BIAS',
    title: '039 RH / SH BIASING DAMPER',
    num: '039',
    name: 'RH / SH BIASING DAMPER',
    src: '39.PNG',
    w: 1280,
    h: 56 + VH + 32,
    v2: true,
    screen: 'BIAS',
    style: 'steel',
    nav: ['UNIT', 'AFG', 'APH', 'BIAS'],
    items: []
  });
})();
