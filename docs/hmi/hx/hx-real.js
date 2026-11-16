/* HX REAL: the realistic symbol set (user 2026-11-17: "wag yung parang P&ID ha. realistic with animation ha. magaan din dapat
   sa app"). A page with look: 'real' in its plan is drawn with these instead of the line symbols of hx-sym.js: equipment as steel
   bodies cut open so the inside shows (rotor and blades, tube bundle, reheater coils, spray mist), valves as a body with its
   actuator, pipes as tubes. Original work: drawn for this app, nothing traced from the control room screens or another DCS.
   Same contract as hx-sym.js: every symbol is drawn around (0, 0) and gives back { svg, ports, box }.
   LIGHT ON THE APP BY DESIGN: plain SVG shapes, no picture file, no filter, no blur. Shading = 4 shared gradients and 1 pattern
   (HXREAL._defs, added once per document). Movement = CSS only (hx.css, "REAL"): it runs only on what is running or flowing, the
   browser stops it when the page is hidden, and prefers-reduced-motion turns it off.
   Classes: rx = steel lit from above, rxv = steel lit from the side (upright cylinders), rxd = dark steel (flanges, caps),
   rxe = a thin edge, rxs = the part in the state colour (open red, closed green, no signal grey), rxvoid = the inside of a cut,
   rxhi = a light line that gives a body its roundness.
   WHAT IS FROM A SOURCE AND WHAT IS ONLY A PICTURE
   - Back pass: FHI manual Part 2 Sect 1 (back pass with division wall, reheater pass with 4 reheater banks + 1 economizer bank,
     superheater pass with 3 finishing superheater banks + 3 economizer banks, 1 economizer bank in the common duct), Part 4
     Sect 3 Fig. 1 (reheater in the front pass, inlet header R-2 below, outlet header R-7 on top, steam upward), the names of the
     banks = I/O list TT-FG1100 ~ 1113 and the app page Air & flue gas. Dampers TCV-FG1116A-D / 1117A-D: four each (their tags).
   - Turbine: K1AU3-PD-011 / -012 name the two casings HP TURBINE and ILP TURBINE on one shaft. The NUMBER of blade rows, the
     shape of the casings, the condenser inside and the foundation are a picture only (NO-SOURCE: no turbine section drawing in
     document-references). They show what kind of machine it is, not its dimensions. */
(function () {
  const n = x => String(Math.round(x * 10) / 10);
  const R = {};
  const vcap = (w, h) =>
    `M${n(-w / 2)} ${n(-h / 2 + w / 2)}A${n(w / 2)} ${n(w / 2)} 0 0 1 ${n(w / 2)} ${n(-h / 2 + w / 2)}V${n(h / 2 - w / 2)}A${n(w / 2)} ${n(w / 2)} 0 0 1 ${n(-w / 2)} ${n(h / 2 - w / 2)}Z`;
  /* a part that moves only while a line flows: the page sets hx-on / hx-idle on the outer group (rule = flow rule of hx-core) */
  const live = (rule, inner) => `<g data-flow="${rule || ''}" class="hx-idle">${inner}</g>`;

  /* the shared shading. Colours are tokens (hx.css), so both themes work */
  R._defs =
    '<linearGradient id="rxh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--rx-st1)"/><stop offset="0.42" style="stop-color:var(--rx-st2)"/><stop offset="1" style="stop-color:var(--rx-st3)"/></linearGradient>' +
    '<linearGradient id="rxv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--rx-st2)"/><stop offset="0.3" style="stop-color:var(--rx-st1)"/><stop offset="1" style="stop-color:var(--rx-st3)"/></linearGradient>' +
    '<linearGradient id="rxglow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--rx-hot);stop-opacity:0.34"/><stop offset="0.55" style="stop-color:var(--rx-hot);stop-opacity:0.1"/><stop offset="1" style="stop-color:var(--rx-hot);stop-opacity:0"/></linearGradient>' +
    '<linearGradient id="rxcoil" gradientUnits="userSpaceOnUse" x1="0" y1="270" x2="0" y2="34"><stop offset="0" style="stop-color:var(--rx-coil0)"/><stop offset="1" style="stop-color:var(--rx-coil1)"/></linearGradient>' +
    '<pattern id="rxtube" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.45" style="fill:var(--hx-m-sea)"/></pattern>';

  /* ---------------- valves ---------------- */
  const BODY =
    'M-13.8 -6.2Q-8.5 -6.4 -6.5 -9.2Q0 -13.4 6.5 -9.2Q8.5 -6.4 13.8 -6.2V6.2Q8.5 6.4 6.5 9.2Q0 13.4 -6.5 9.2Q-8.5 6.4 -13.8 6.2Z';
  const HI = '<path class="rxhi" d="M-12.4 -3.5Q-7.6 -3.9 -5.5 -6.5Q0 -9.9 5.5 -6.5Q7.6 -3.9 12.4 -3.5"/>';
  const FL = '<path class="rxd" d="M-17 -9.5h3.2v19h-3.2zM13.8 -9.5h3.2v19h-3.2z"/>';
  const BON = '<path class="rx" d="M-3.6 -16.5h7.2v5.6h-7.2z"/>';
  R.valve = o => {
    const k = o.kind || 'manual';
    if (k === 'safety') return R.safeties(o);
    if (k === 'plain') return R.chest(o);
    let top = '',
      ty = -17;
    if (k === 'control') {
      /* spring and diaphragm actuator: the mark on the stem rises with the opening */
      top =
        BON +
        '<path class="rxe" d="M-3.3 -16.5L-5.6 -25M3.3 -16.5L5.6 -25"/><path class="rxst" d="M0 -16.5V-26"/>' +
        '<rect class="rxix" data-stem="5" x="-2.8" y="-19" width="5.6" height="2.3" rx="0.7"/>' +
        '<path class="rxd" d="M-12 -25.2h24l-1.7 -2.9h-20.6z"/><path class="rx" d="M-11.3 -28.1H11.3Q11.3 -36.6 0 -36.6Q-11.3 -36.6 -11.3 -28.1Z"/>';
      ty = -37;
    } else if (k === 'motor') {
      /* electric actuator: gear box, motor, hand wheel */
      top =
        BON +
        '<path class="rxst" d="M0 -16.5V-21"/><rect class="rxd" x="-14.6" y="-31.4" width="7" height="8.4" rx="1.8"/>' +
        '<rect class="rx" x="-8.2" y="-33.4" width="14.6" height="12.6" rx="2.2"/><circle class="rxw" cx="10.8" cy="-27" r="4.7"/><circle class="rxk" cx="10.8" cy="-27" r="1.3"/>';
      ty = -34;
    } else if (k === 'shutoff') {
      /* air cylinder with its solenoid */
      top =
        BON +
        '<path class="rxst" d="M0 -16.5V-21"/><rect class="rxv" x="-6" y="-35" width="12" height="15" rx="1.2"/>' +
        '<path class="rxd" d="M-7.4 -21.6h14.8v2.6h-14.8zM-7.4 -36.6h14.8v2.6h-14.8z"/><rect class="rxd" x="7.4" y="-31.4" width="4.8" height="6.2" rx="1"/>';
      ty = -37;
    } else if (k === 'manual') {
      top =
        BON +
        '<path class="rxst" d="M0 -16.5V-25"/><ellipse class="rxw" cx="0" cy="-25.8" rx="10.6" ry="2.9"/><circle class="rxk" cx="0" cy="-25.8" r="1.3"/>';
      ty = -29;
    } else if (k === 'check') {
      top = '<path class="rxd" d="M-7.6 -16.4h15.2v4.6h-15.2z"/>';
    }
    const body =
      k === 'check'
        ? `<path class="rx" d="${BODY}"/>${HI}<path class="rxar" d="M-6.5 0H5M1.6 -3.4L5.6 0L1.6 3.4"/>`
        : `<path class="rxs" d="${BODY}"/>${HI}`;
    return {
      box: [-18, ty - 1, 18, 14],
      ports: { l: [-17, 0], r: [17, 0], t: [0, ty], b: [0, 13.4] },
      svg: FL + top + body
    };
  };
  /* a valve chest of the turbine (stop / control / intercept valves): hydraulic servo on top */
  R.chest = () => ({
    box: [-13, -23, 13, 10.5],
    ports: { l: [-12, 0], r: [12, 0], t: [0, -22], b: [0, 9.5] },
    svg:
      '<path class="rxd" d="M-12 -7h2.6v14h-2.6zM9.4 -7h2.6v14h-2.6z"/><rect class="rxv" x="-4.2" y="-22" width="8.4" height="12" rx="1.6"/><path class="rxd" d="M-5.6 -11.6h11.2v2.4h-11.2z"/>' +
      '<rect class="rxs" x="-9.4" y="-9.2" width="18.8" height="18.4" rx="4.4"/><path class="rxhi" d="M-6.6 -5.6H6.6"/>'
  });
  /* three spring loaded safety valves on a line, each with its own exhaust pipe and silencer */
  R.safeties = () => {
    let s = '';
    for (const x of [-16, 0, 16])
      s +=
        `<path class="rxpe" d="M${x + 4} -10h4.2v-21"/><rect class="rxv" x="${x + 4.6}" y="-45" width="7.2" height="14" rx="2.4"/>` +
        `<path class="rxd" d="M${x - 2.2} -6h4.4v6h-4.4z"/><rect class="rxs" x="${x - 4.6}" y="-14.5" width="9.2" height="9" rx="2"/>` +
        `<rect class="rxv" x="${x - 3}" y="-27.5" width="6" height="13" rx="1"/><path class="rxe" d="M${x - 3} -17.5l6 -2.5l-6 -2.5l6 -2.5"/><path class="rxd" d="M${x - 3.8} -30h7.6v2.6h-7.6z"/>`;
    return { box: [-22, -46, 29, 1], ports: { l: [-22, 0], r: [29, 0], b: [0, 0], t: [0, -45] }, svg: s };
  };

  /* ---------------- small things on a line ---------------- */
  /* drain pot: a small upright vessel under a steam line */
  R.pot = () => ({
    box: [-7, -13, 7, 13],
    ports: { t: [0, -12], b: [0, 12], l: [-5.5, 0], r: [5.5, 0] },
    svg: `<path class="rxv" d="${vcap(11, 24)}"/><path class="rxlq" d="M2.4 1V8"/>`
  });
  /* desuperheater: a sleeve on the steam line, cut open so the spray shows. Steam goes left to right (flip: right to left); the
     water nozzle is on top (noz: 'b' = below). flow = the rule that makes the mist move */
  R.spray = o => {
    const f = o.flip ? -1 : 1,
      b = o.noz === 'b' ? 1 : -1;
    return {
      box: [-20, b < 0 ? -13 : -8, 20, b < 0 ? 8 : 13],
      ports: { l: [-19, 0], r: [19, 0], t: [-7 * f, -12], b: [-7 * f, 12] },
      svg:
        `<g transform="scale(${f} ${-b})"><path class="rxd" d="M-9.4 -12h4.8v6h-4.8z"/><rect class="rx" x="-19" y="-7" width="38" height="14" rx="3.2"/>` +
        `<rect class="rxvoid" x="-10" y="-4.5" width="25.5" height="9" rx="2"/><path class="rxk" d="M-8.4 -4.5h2.8l-1.4 3.2z"/>` +
        live(o.flow, '<path class="rx-mist" d="M-6.4 -0.8L13 -3.2M-6.4 0H13.6M-6.4 0.8L13 3.2"/>') +
        '</g>'
    };
  };
  /* silencer of a vent to the atmosphere: the steam cloud moves only while its valve is open (flow) */
  R.vent = o => ({
    box: [-9, -37, 9, 1],
    ports: { b: [0, 0], t: [0, -36], l: [-8, -18], r: [8, -18] },
    svg:
      live(
        o.flow,
        '<g class="rx-plume"><circle cx="0" cy="-41" r="3.8"/><circle cx="2.6" cy="-48" r="5.2"/><circle cx="-2.2" cy="-57" r="6.6"/></g>'
      ) +
      '<path class="rxd" d="M-2.3 0v-5.4h4.6v5.4z"/><rect class="rxv" x="-7.6" y="-31.4" width="15.2" height="26.4" rx="3.6"/>' +
      '<path class="rxe" d="M-7.6 -12.4h15.2M-7.6 -24h15.2"/><path class="rxd" d="M-5.2 -31.4l1.8 -4.4h6.8l1.8 4.4z"/>'
  });
  /* a controller as a small instrument: measured value large, set point small (the page fills [data-lp]) */
  R.ctl = o => {
    const t = o.loop || '',
      dp = o.pvdp == null ? 1 : o.pvdp;
    return {
      box: [-49, -19, 49, 19],
      ports: { l: [-48, 0], r: [48, 0], t: [0, -18], b: [0, 18] },
      svg:
        '<rect class="rx" x="-48" y="-18" width="96" height="36" rx="5"/><rect class="rxscr" x="-44" y="-14" width="88" height="28" rx="3"/>' +
        `<text class="rx-pv" x="-39" y="6" data-lp="${t}|pv|${dp}">-----</text><text class="rx-sl" x="40" y="-3" text-anchor="end">Set point</text>` +
        `<text class="rx-sv" x="40" y="9.4" text-anchor="end"><tspan data-lp="${t}|sv|${dp}">-----</tspan><tspan class="rx-su"> ${o.unit || ''}</tspan></text>`
    };
  };
  /* louver damper across a gas pass that goes down: k blades, shut = flat. The page turns [data-blr] by the opening */
  R.louver = o => {
    const w = o.w || 92,
      k = o.blades || 4,
      st = w / k;
    let b = '';
    for (let i = 0; i < k; i++) {
      const cx = -w / 2 + st * (i + 0.5);
      b += `<path class="rxbl" data-blr d="M${n(cx - st / 2 + 2.4)} 0H${n(cx + st / 2 - 2.4)}"/><circle class="rxk" cx="${n(cx)}" cy="0" r="1.25"/>`;
    }
    return {
      box: [-w / 2 - 1, -23, w / 2 + 1, 11],
      ports: { l: [-w / 2, 0], r: [w / 2, 0], t: [0, -22], b: [0, 10], a: [0, -16] },
      svg:
        `<rect class="rxfr" x="${n(-w / 2)}" y="-10" width="${n(w)}" height="20" rx="1.5"/>${b}` +
        '<path class="rxst" d="M0 -10V-13"/><rect class="rx" x="-8" y="-22" width="16" height="10" rx="2"/>'
    };
  };

  /* ---------------- the turbine set: two casings on one shaft, cut open, on its foundation, condenser below ---------------- */
  /* origin = the shaft at the coupling between the two casings. Left: intermediate and low pressure casing with its exhaust
     hood, right: high pressure casing. Ports: hpIn / hpEx (main steam in, cold reheat out), ipA / ipB (hot reheat in),
     cdIn (bypass steam into the condenser), gen (shaft end towards the generator), floor (local y of the basement floor). */
  R.tgset = () => {
    const rows = (xs, hs) => xs.map((x, i) => `M${x} ${-hs[i]}V${hs[i]}`).join('');
    const dia = (xs, hs) => xs.map((x, i) => `M${x} ${-hs[i]}V-8M${x} 8V${hs[i]}`).join('');
    const hpX = [50, 61, 72, 83, 94, 105],
      hpH = [21, 22.5, 24, 25.5, 27, 28.5],
      ipX = [-50, -62, -74, -86, -98, -110, -144, -164],
      ipH = [22.5, 25, 27.5, 29.5, 32, 34.5, 46, 51];
    const ped = x =>
      `<path class="rx" d="M${x - 16} 62V-6Q${x - 16} -15 ${x - 7} -15H${x + 7}Q${x + 16} -15 ${x + 16} -6V62Z"/><path class="rxe" d="M${x - 16} -1H${x + 16}M${x - 16} 34H${x + 16}"/>`;
    const svg =
      /* foundation: columns, deck, floor of the condenser pit */
      '<path class="rxcol" d="M-256 74h10v236h-10zM-22 74h10v236h-10zM168 74h10v236h-10zM-224 248h10v62h-10zM-98 248h10v62h-10z"/>' +
      '<path class="rxconc" d="M-262 62h56v12h-56zM-106 62h204v12h-204zM122 62h64v12h-64z"/>' +
      /* shaft */
      '<rect class="rx" x="-262" y="-4.5" width="430" height="9"/>' +
      /* condenser: neck, shell, tube bundles (the tube ends), hotwell */
      '<path class="rx" d="M-190 62L-224 102H-88L-122 62Z"/><rect class="rx" x="-236" y="100" width="160" height="124" rx="8"/>' +
      '<rect class="rx" x="-249" y="112" width="14" height="14" rx="1.5"/>' +
      '<path class="rxvoid" d="M-184.5 62L-214 104H-230Q-231 104 -231 106V216Q-231 219 -228 219H-84Q-81 219 -81 216V106Q-81 104 -82 104H-98L-127.5 62Z"/>' +
      '<ellipse class="rxtb" cx="-188" cy="166" rx="28" ry="40"/><ellipse class="rxtb" cx="-124" cy="166" rx="28" ry="40"/>' +
      '<rect class="rx" x="-198" y="222" width="84" height="28" rx="3"/><rect class="rxwt" x="-194" y="233" width="76" height="13.5" rx="2"/>' +
      '<path class="rx-rip" d="M-194 233.4q4.75 -2.2 9.5 0t9.5 0t9.5 0t9.5 0t9.5 0t9.5 0t9.5 0t9.5 0"/>' +
      /* intermediate and low pressure casing with the exhaust hood */
      '<path class="rx" d="M-30 -20Q-31 -31 -46 -31L-122 -46V-60Q-122 -64 -126 -64H-186Q-190 -64 -190 -60V62H-122V46L-46 31Q-31 31 -30 20Z"/>' +
      '<path class="rxvoid" d="M-35.5 -17Q-36.5 -25.5 -46 -25.5L-127.5 -41.5V-55Q-127.5 -58.5 -131 -58.5H-181Q-184.5 -58.5 -184.5 -55V62.5H-127.5V41.5L-46 25.5Q-36.5 25.5 -35.5 17Z"/>' +
      '<path class="rx-steam" style="--m:var(--hx-m-reheat)" d="M-35.5 -17Q-36.5 -25.5 -46 -25.5L-127.5 -41.5V-55Q-127.5 -58.5 -131 -58.5H-181Q-184.5 -58.5 -184.5 -55V62.5H-127.5V41.5L-46 25.5Q-36.5 25.5 -35.5 17Z"/>' +
      `<path class="rx-dia" d="${dia([-56, -68, -80, -92, -104, -127], [24.5, 27, 29.5, 32, 34, 40])}"/>` +
      `<path class="rx-disc" d="${rows(ipX, ipH)}"/><path class="rx-blade" d="${rows(ipX, ipH)}"/>` +
      '<path class="rx-jet" style="--m:var(--hx-m-reheat)" d="M-39 -13H-126M-39 13H-126M-136 22V96M-154 30V98M-172 22V96"/>' +
      '<rect class="rx" x="-190" y="-6.5" width="160" height="13"/>' +
      '<rect class="rx" x="-52" y="-43" width="12" height="13" rx="1.5"/><rect class="rx" x="-80" y="-49" width="12" height="14" rx="1.5"/>' +
      /* high pressure casing */
      '<path class="rx" d="M30 -20Q31 -30 46 -30L112 -38Q126 -38 126 -27V27Q126 38 112 38L46 30Q31 30 30 20Z"/>' +
      '<path class="rxvoid" d="M35.5 -17Q36.5 -24.5 46 -24.5L111.5 -32.5Q120.5 -32.5 120.5 -26V26Q120.5 32.5 111.5 32.5L46 24.5Q36.5 24.5 35.5 17Z"/>' +
      '<path class="rx-steam" style="--m:var(--hx-m-steam)" d="M35.5 -17Q36.5 -24.5 46 -24.5L111.5 -32.5Q120.5 -32.5 120.5 -26V26Q120.5 32.5 111.5 32.5L46 24.5Q36.5 24.5 35.5 17Z"/>' +
      `<path class="rx-dia" d="${dia([55.5, 66.5, 77.5, 88.5, 99.5], [24.5, 26, 27.3, 28.7, 30])}"/>` +
      `<path class="rx-disc" d="${rows(hpX, hpH)}"/><path class="rx-blade" d="${rows(hpX, hpH)}"/>` +
      '<path class="rx-jet" style="--m:var(--hx-m-steam)" d="M39 -12H118M39 12H118"/>' +
      '<rect class="rx" x="30" y="-6" width="96" height="12"/>' +
      '<rect class="rx" x="40" y="-42" width="12" height="13" rx="1.5"/><rect class="rx" x="102" y="35" width="16" height="13" rx="1.5"/>' +
      /* bearing pedestals */
      ped(0) +
      ped(149) +
      ped(-211);
    return {
      box: [-262, -66, 186, 310],
      ports: {
        hpIn: [46, -42],
        hpEx: [110, 48],
        ipB: [-46, -43],
        ipA: [-74, -49],
        cdIn: [-249, 119],
        gen: [-262, 0],
        t: [0, -15]
      },
      svg
    };
  };

  /* ---------------- the back pass of the boiler, cut open ---------------- */
  /* origin = the top left corner of the casing. Reheater pass on the left (front), superheater pass on the right, the
     division wall between them, the common duct below. The reheater is one tube from the inlet header (below) to the outlet
     header (on top): four banks, steam upward against the gas. Ports: rin / rout (headers), gin (gas in), gout (gas out).
     o.gasA / o.gasB = flow rules of the gas in the two passes (their dampers), o.steam = rule of the steam in the coils. */
  R.backpass = o => {
    const p = 9.5;
    const run = (xl, xr, y0, rows, fromLeft) => {
      let d = '',
        left = fromLeft,
        y = y0;
      for (let i = 0; i < rows; i++) {
        d += `H${left ? xr : xl}`;
        left = !left;
        if (i < rows - 1) {
          d += `A${p / 2} ${p / 2} 0 0 ${left ? 1 : 0} ${left ? xl : xr} ${n(y - p)}`;
          y -= p;
        }
      }
      return d;
    };
    /* the reheater: bank 4 (lowest) to bank 1, linked on alternate sides */
    const coil =
      'M-18 260' +
      run(18, 94, 260, 5, true) +
      'A10 10 0 0 0 94 202' +
      run(18, 94, 202, 5, false) +
      'A14 14 0 0 1 18 136' +
      run(18, 94, 136, 5, true) +
      'A10 10 0 0 0 94 78' +
      run(18, 94, 78, 5, false) +
      'H-18';
    const bank = (xl, xr, yb, rows) => `M${xl} ${yb}` + run(xl, xr, yb, rows, true);
    const eco =
      bank(18, 94, 310, 4) +
      bank(122, 198, 204, 4) +
      bank(122, 198, 248, 4) +
      bank(122, 198, 310, 4) +
      bank(18, 198, 452, 3);
    const fsh = bank(122, 198, 66, 4) + bank(122, 198, 110, 4) + bank(122, 198, 154, 4);
    const gas = xs => xs.map(x => `M${x} 10V344`).join('');
    const svg =
      /* casing: tube walls, roof with the gas inlet, hopper and outlet */
      '<path class="rx" d="M16 0V-50h6V0zM70 0V-50h6V0z"/><path class="rxv" d="M0 0H216V466L146 496V512H70V496L0 466Z"/>' +
      '<path class="rxvoid" d="M22 -50H70V8H208V462L138 492V512H78V492L8 462V8H22Z"/>' +
      '<path class="rxglow" d="M22 -50H70V8H208V462L138 492V512H78V492L8 462V8H22Z"/>' +
      '<path class="rxwall" d="M108 8V362"/>' +
      /* gas on its way down */
      live(o.gasA, `<path class="rx-gas" d="${gas([30, 56, 82])}"/>`) +
      live(o.gasB, `<path class="rx-gas" d="${gas([134, 160, 186])}"/>`) +
      live(
        (o.gasA || '') + (o.gasA && o.gasB ? '|' : '') + (o.gasB || ''),
        '<path class="rx-gas" d="M34 -48V6M46 -48V6M58 -48V6M60 366V470M108 366V508M156 366V470"/>'
      ) +
      /* the other banks of the pass: economizers (water) and finishing superheater (steam), as background */
      `<path class="rx-bank" style="--m:var(--hx-m-water)" d="${eco}"/><path class="rx-bank" style="--m:var(--hx-m-steam)" d="${fsh}"/>` +
      /* the reheater coils and their headers */
      `<path class="rx-coile" d="${coil}"/><path class="rx-coil" d="${coil}"/>` +
      live(o.steam, `<path class="rx-coilf" d="${coil}"/>`) +
      '<circle class="rx" cx="-18" cy="260" r="8.6"/><circle class="rxm" cx="-18" cy="260" r="4.4"/><circle class="rx" cx="-18" cy="40" r="8.6"/><circle class="rxm" cx="-18" cy="40" r="4.4"/>' +
      '';
    /* names inside (the core writes them, so they stay readable when the piece is mirrored) */
    const words = [
      { x: 56, y: 24, s: 'Reheater pass', cls: 'rx-in', size: 8 },
      { x: 160, y: 24, s: 'Superheater pass', cls: 'rx-in', size: 8 },
      { x: 56, y: 153.5, s: 'Reheater', cls: 'rx-in2', size: 8.8 },
      { x: 56, y: 299, s: 'Economizer 2R', cls: 'rx-in2', size: 8.8 },
      { x: 160, y: 87, s: 'Finishing', cls: 'rx-in2', size: 8.8 },
      { x: 160, y: 97, s: 'superheater', cls: 'rx-in2', size: 8.8 },
      { x: 160, y: 230, s: 'Economizer 3', cls: 'rx-in2', size: 8.8 },
      { x: 160, y: 299, s: 'Economizer 2S', cls: 'rx-in2', size: 8.8 },
      { x: 108, y: 446, s: 'Economizer 1', cls: 'rx-in2', size: 8.8 }
    ];
    return {
      box: [-28, -50, 217, 512],
      ports: { rin: [-26.6, 260], rout: [-26.6, 40], gin: [46, -50], gout: [108, 512], l: [0, 150], r: [216, 150] },
      svg,
      words
    };
  };

  /* ---------------- scenery ---------------- */
  /* the basement floor: o.w wide from (0, 0) */
  R.floor = o => ({
    box: [0, 0, o.w, 8],
    ports: {},
    svg: `<rect class="rxconc" x="0" y="0" width="${n(o.w)}" height="7" rx="1"/>`
  });
  window.HXREAL = R;
})();
