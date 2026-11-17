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
    '<linearGradient id="rxfire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--rx-hot);stop-opacity:0.75"/><stop offset="0.45" style="stop-color:var(--rx-hot);stop-opacity:0.3"/><stop offset="1" style="stop-color:var(--rx-hot);stop-opacity:0.1"/></linearGradient>' +
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
    return { box: [-22, -46, 29, 9], ports: { l: [-22, 0], r: [29, 0], b: [0, 0], t: [0, -45] }, svg: s };
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
  /* origin = the shaft at the coupling between the two casings. As drawn here: intermediate and low pressure casing with its
     exhaust hood on the left, high pressure casing on the right; the steam enters both casings at the middle of the train and
     leaves at the far ends. A page that shows the train as the control room does (screen 035 SHAFT MONITOR: thrust bearing,
     HP, ILP, turning gear, generator, exciter from left to right) places it with mir: true.
     Ports: hpIn / hpB (main steam into the top / the bottom of the high pressure casing: line A / line B), hpEx (cold reheat
     out), ipA / ipB (hot reheat into the top / the bottom), cdIn (bypass steam into the condenser), gen (shaft end towards the
     generator). The basement floor is at local y 310. */
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
      '<rect class="rx" x="-66" y="-47" width="12" height="14" rx="1.5"/><rect class="rx" x="-66" y="33" width="12" height="14" rx="1.5"/>' +
      /* high pressure casing */
      '<path class="rx" d="M30 -20Q31 -30 46 -30L112 -38Q126 -38 126 -27V27Q126 38 112 38L46 30Q31 30 30 20Z"/>' +
      '<path class="rxvoid" d="M35.5 -17Q36.5 -24.5 46 -24.5L111.5 -32.5Q120.5 -32.5 120.5 -26V26Q120.5 32.5 111.5 32.5L46 24.5Q36.5 24.5 35.5 17Z"/>' +
      '<path class="rx-steam" style="--m:var(--hx-m-steam)" d="M35.5 -17Q36.5 -24.5 46 -24.5L111.5 -32.5Q120.5 -32.5 120.5 -26V26Q120.5 32.5 111.5 32.5L46 24.5Q36.5 24.5 35.5 17Z"/>' +
      `<path class="rx-dia" d="${dia([55.5, 66.5, 77.5, 88.5, 99.5], [24.5, 26, 27.3, 28.7, 30])}"/>` +
      `<path class="rx-disc" d="${rows(hpX, hpH)}"/><path class="rx-blade" d="${rows(hpX, hpH)}"/>` +
      '<path class="rx-jet" style="--m:var(--hx-m-steam)" d="M39 -12H118M39 12H118"/>' +
      '<rect class="rx" x="30" y="-6" width="96" height="12"/>' +
      '<rect class="rx" x="40" y="-42" width="12" height="13" rx="1.5"/><rect class="rx" x="40" y="29" width="12" height="13" rx="1.5"/><rect class="rx" x="102" y="35" width="16" height="13" rx="1.5"/>' +
      /* bearing pedestals */
      ped(0) +
      ped(149) +
      ped(-211);
    return {
      box: [-262, -66, 186, 310],
      ports: {
        hpIn: [46, -42],
        hpB: [46, 42],
        hpEx: [110, 48],
        ipA: [-60, -47],
        ipB: [-60, 47],
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
    /* focus 'sh' (the superheater page): the finishing superheater as ONE tube from its inlet header (below) to its outlet header
       (on top), both at the rear wall: lower, intermediate and upper assembly (K1AU3-PD-019); the reheater is then a bank */
    const sh = o.focus === 'sh',
      fcoil =
        'M234 154' +
        run(122, 198, 154, 4, false) +
        'A7.75 7.75 0 0 0 198 110' +
        run(122, 198, 110, 4, false) +
        'A7.75 7.75 0 0 0 198 66' +
        run(122, 198, 66, 4, false) +
        'H234',
      rbank = bank(18, 94, 78, 5) + bank(18, 94, 136, 5) + bank(18, 94, 202, 5) + bank(18, 94, 260, 5);
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
      `<path class="rx-bank" style="--m:var(--hx-m-water)" d="${eco}"/>` +
      (sh
        ? `<path class="rx-bank" style="--m:var(--hx-m-reheat)" d="${rbank}"/>` +
          `<path class="rx-coile" d="${fcoil}"/><path class="rx-coil" d="${fcoil}"/>` +
          live(o.steam, `<path class="rx-coilf" d="${fcoil}"/>`) +
          '<circle class="rx" cx="234" cy="154" r="8.6"/><circle class="rxm" cx="234" cy="154" r="4.4"/><circle class="rx" cx="234" cy="37.5" r="8.6"/><circle class="rxm" cx="234" cy="37.5" r="4.4"/>'
        : `<path class="rx-bank" style="--m:var(--hx-m-steam)" d="${fsh}"/>` +
          /* the reheater coils and their headers */
          `<path class="rx-coile" d="${coil}"/><path class="rx-coil" d="${coil}"/>` +
          live(o.steam, `<path class="rx-coilf" d="${coil}"/>`) +
          '<circle class="rx" cx="-18" cy="260" r="8.6"/><circle class="rxm" cx="-18" cy="260" r="4.4"/><circle class="rx" cx="-18" cy="40" r="8.6"/><circle class="rxm" cx="-18" cy="40" r="4.4"/>');
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
      box: sh ? [-1, -50, 244, 512] : [-28, -50, 217, 512],
      ports: sh
        ? { shin: [242.6, 154], shout: [242.6, 37.5], gin: [46, -50], gout: [108, 512], l: [0, 150], r: [216, 150] }
        : { rin: [-26.6, 260], rout: [-26.6, 40], gin: [46, -50], gout: [108, 512], l: [0, 150], r: [216, 150] },
      svg,
      words
    };
  };

  /* ---------------- machines ---------------- */
  /* a liquid level inside a cut vessel: the page moves rect[data-lv] between y1 (empty) and y0 (full) when the item has
     level: [key, low, high]; without it the level stands where it is drawn (f = 0 .. 1) */
  const lvl = (id, shape, x0, y0, x1, y1, f) =>
    `<clipPath id="rxc-${id}"><path d="${shape}"/></clipPath><rect class="rxwt" data-lv="${n(y0)},${n(y1)}" clip-path="url(#rxc-${id})" x="${n(x0)}" y="${n(y1 - (y1 - y0) * f)}" width="${n(x1 - x0)}" height="${n((y1 - y0) * f)}"/>`;
  /* a wheel that turns while its machine runs (drawn around the centre cx, cy): k curved vanes */
  const wheel = (cx, cy, r, k) => {
    let v = '';
    for (let i = 0; i < k; i++)
      v += `<path transform="rotate(${n((360 / k) * i)})" d="M0 0Q${n(r * 0.35)} ${n(-r * 0.75)} ${n(r * 0.96)} ${n(-r * 0.3)}"/>`;
    return `<g transform="translate(${n(cx)} ${n(cy)})"><g class="rxrot">${v}</g><circle class="rxk" r="${n(r * 0.2)}"/></g>`;
  };
  /* centrifugal pump with its motor on one base plate. The casing is cut open: the impeller turns while the pump runs. The
     motor takes the state colour. Ports: s = suction (at the side), d = discharge (on top). mir: true = motor on the left */
  R.pump = () => ({
    box: [-37, -28, 46, 23],
    ports: { s: [-36, 0], d: [-2, -27], l: [-36, 0], t: [-2, -27], r: [45, 0], b: [0, 22] },
    svg:
      '<path class="rxd" d="M-31 17h76v4.5h-76z"/><path class="rx" d="M-22 12l-3 5h26l-3 -5z"/>' +
      '<path class="rx" d="M-33 -6.5h8v13h-8zM-7 -24h10v13h-10z"/><path class="rxd" d="M-36 -8.5h3.2v17h-3.2zM-9 -27h14v3.2h-14z"/>' +
      '<circle class="rx" cx="-12" cy="0" r="15.5"/><circle class="rxvoid" cx="-12" cy="0" r="11"/>' +
      wheel(-12, 0, 10, 6) +
      '<path class="rxd" d="M3.5 -2.2h8v4.4h-8z"/><path class="rx" d="M5 -4.6h5v9.2h-5z"/>' +
      '<rect class="rxs" x="11.5" y="-11.5" width="29" height="23" rx="3.5"/><path class="rxe" d="M17 -11.5v23M22.5 -11.5v23M28 -11.5v23M33.5 -11.5v23"/>' +
      '<path class="rxhi" d="M14 -8h24"/><path class="rxd" d="M40.5 -9h4v18h-4zM20 -16.5h11v5h-11zM15 11.5h6v5.5h-6zM31 11.5h6v5.5h-6z"/>'
  });
  /* vertical pump in a can (a condensate extraction pump): motor on top, the can cut open. Ports: s = suction into the can,
     d = discharge from the head */
  R.vpump = () => ({
    box: [-23, -44, 23, 38],
    ports: { s: [-22, 12], d: [22, -11], l: [-22, 12], r: [22, -11], t: [0, -43], b: [0, 37] },
    svg:
      '<path class="rx" d="M-21 8h14v8h-14zM7 -15h14v8h-14z"/><path class="rxd" d="M-23 6h3v12h-3zM20 -17h3v12h-3z"/>' +
      '<rect class="rxv" x="-8" y="-6" width="16" height="42" rx="3"/><rect class="rxvoid" x="-5" y="-1" width="10" height="33" rx="2"/>' +
      '<path class="rxst" d="M0 -6V30"/><path class="rxd" d="M-4 6h8l-1.5 5h-5zM-4 17h8l-1.5 5h-5z"/><path class="rx-lift" d="M-2.6 30V0M2.6 30V0"/>' +
      '<path class="rx" d="M-11 -18h22v12h-22z"/><rect class="rxs" x="-9.5" y="-42" width="19" height="24" rx="3"/><path class="rxe" d="M-9.5 -36h19M-9.5 -30h19M-9.5 -24h19"/><path class="rxd" d="M-6 -44.5h12v3h-12z"/>'
  });
  /* feedwater heater, lying, cut open: the feedwater goes through the U tubes, the steam condenses on them. w = length.
     Ports: in / out (feedwater at the channel head: below / on top), st (steam in, on top), dr (drain, below).
     flow = the rule that moves the water in the tubes; level: [key, low, high] moves the condensate level */
  R.heater = o => {
    const w = o.w || 124,
      a = -w / 2,
      b = w / 2,
      id = o.id || 'h',
      shell = `M${a + 10} -19H${b - 18}V19H${a + 10}Q${a} 19 ${a} 0Q${a} -19 ${a + 10} -19Z`,
      inner = `M${a + 11} -14H${b - 22}V14H${a + 11}Q${a + 5} 14 ${a + 5} 0Q${a + 5} -14 ${a + 11} -14Z`,
      tubes = [9.5, 6, 2.6]
        .map((r, i) => `M${b - 22} ${-r}H${a + 22 + i * 5}A${r} ${r} 0 0 0 ${a + 22 + i * 5} ${r}H${b - 22}`)
        .join('');
    return {
      box: [a - 1, -27, b + 1, 27],
      ports: {
        in: [b - 9, 26],
        out: [b - 9, -26],
        st: [a + w * 0.36, -26],
        dr: [a + w * 0.22, 26],
        l: [a, 0],
        r: [b, 0]
      },
      svg:
        `<path class="rxd" d="M${a + 18} 19l-3 6h14l-3 -6zM${b - 44} 19l-3 6h14l-3 -6z"/>` +
        `<path class="rx" d="M${n(a + w * 0.36 - 5)} -26h10v8h-10zM${n(a + w * 0.22 - 4)} 18h8v8h-8zM${b - 14} -26h10v8h-10zM${b - 14} 18h10v8h-10z"/>` +
        `<path class="rx" d="${shell}"/><path class="rxvoid" d="${inner}"/>` +
        lvl(id, inner, a + 5, 2, b - 22, 14, 0.45) +
        `<path class="rx-tube" style="--m:var(--hx-m-water)" d="${tubes}"/>` +
        live(o.flow, `<path class="rx-tubef" d="${tubes}"/>`) +
        `<path class="rx" d="M${b - 18} -20.5H${b - 6}Q${b} -20.5 ${b} -14V14Q${b} 20.5 ${b - 6} 20.5H${b - 18}Z"/><path class="rxd" d="M${b - 21} -21.5h3.4v43h-3.4z"/><path class="rxe" d="M${b - 17} 0H${b - 1}"/>`
    };
  };
  /* deaerator: the deaerating dome with its trays on the storage tank, both cut open. Ports: cin (condensate into the dome),
     stin (heating steam under the trays), vent (top of the dome), out (from the tank down to the feed pumps), l / r (tank
     ends). flow = the rule that shows the water falling over the trays; level: [key, low, high] moves the water level */
  R.deaerator = o => {
    const id = o.id || 'd',
      tank = 'M-68 2H68Q88 2 88 23Q88 44 68 44H-68Q-88 44 -88 23Q-88 2 -68 2Z',
      inner = 'M-66 7H66Q82 7 82 23Q82 39 66 39H-66Q-82 39 -82 23Q-82 7 -66 7Z';
    return {
      box: [-89, -52, 89, 53],
      ports: {
        cin: [-31, -30],
        stin: [31, -12],
        vent: [0, -51],
        out: [48, 52],
        l: [-88, 23],
        r: [88, 23],
        t: [0, -51],
        b: [0, 44]
      },
      svg:
        '<path class="rxd" d="M-56 44l-4 8h20l-4 -8zM44 44l-4 8h20l-4 -8z"/><path class="rx" d="M43 43h10v9h-10zM-30 -34h8v8h-8zM22 -16h8v8h-8zM-3 -51h6v6h-6z"/>' +
        `<path class="rx" d="${tank}"/><path class="rxv" d="M-23 -34Q-23 -46 0 -46Q23 -46 23 -34V6H-23Z"/>` +
        `<path class="rxvoid" d="${inner}"/><path class="rxvoid" d="M-18 -33Q-18 -41 0 -41Q18 -41 18 -33V8H-18Z"/>` +
        lvl(id, inner, -82, 12, 82, 39, 0.62) +
        '<path class="rxtray" d="M-18 -28H9M-9 -20H18M-18 -12H9M-9 -4H18"/>' +
        live(
          o.flow,
          '<path class="rx-fall" style="--m:var(--hx-m-condensate)" d="M-13 -33V-28M13 -27V-20M-13 -19V-12M13 -11V-4M-13 -3V14M0 2V14"/>'
        )
    };
  };
  /* steam drum seen from the side, cut open: water below, steam above, the separators along the water line. w = length.
     Ports: fw (feedwater in), st (steam out, on top), sv (safety valves, on top), dn1 / dn2 (downcomers, below), ri1 / ri2
     (risers coming back, on the side below the water line), l / r (ends). level: [key, low, high] moves the water level */
  R.drum = o => {
    const w = o.w || 190,
      a = -w / 2,
      b = w / 2,
      id = o.id || 'dr',
      shell = `M${a + 24} -24H${b - 24}Q${b} -24 ${b} 0Q${b} 24 ${b - 24} 24H${a + 24}Q${a} 24 ${a} 0Q${a} -24 ${a + 24} -24Z`,
      inner = `M${a + 24} -18.5H${b - 24}Q${b - 6} -18.5 ${b - 6} 0Q${b - 6} 18.5 ${b - 24} 18.5H${a + 24}Q${a + 6} 18.5 ${a + 6} 0Q${a + 6} -18.5 ${a + 24} -18.5Z`;
    let sep = '';
    for (let x = a + 34; x <= b - 34; x += 16) sep += `M${n(x - 3.5)} -7h7v9h-7z`;
    return {
      box: [a - 1, -31, b + 1, 31],
      ports: {
        st: [0, -30],
        sv: [b - 46, -30],
        fw: [a + 40, 30],
        dn1: [a + 70, 30],
        dn2: [b - 70, 30],
        ri1: [a, 8],
        ri2: [b, 8],
        l: [a, 0],
        r: [b, 0],
        t: [0, -30],
        b: [0, 30]
      },
      svg:
        `<path class="rx" d="M-5 -30h10v7h-10zM${b - 51} -30h10v7h-10zM${a + 35} 23h10v7h-10zM${a + 65} 23h10v7h-10zM${b - 75} 23h10v7h-10z"/>` +
        `<path class="rx" d="${shell}"/><path class="rxvoid" d="${inner}"/>` +
        lvl(id, inner, a + 6, -18.5, b - 6, 18.5, 0.5) +
        `<path class="rxd" d="${sep}"/><path class="rxtray" d="M${a + 30} -12H${b - 30}"/><path class="rx-rip" d="M${a + 10} 0.4q5 -2.2 10 0t10 0t10 0"/>`
    };
  };

  /* centrifugal fan with its motor: the housing is cut open, the wheel turns while the fan runs, the motor takes the state
     colour. Ports: in (the inlet box at the side), out (the outlet, upward). mir: true = motor on the left */
  R.fan = () => ({
    box: [-45, -34, 49, 26],
    ports: { in: [-44, 0], out: [-2, -33], l: [-44, 0], t: [-2, -33], r: [48, 0], b: [0, 25] },
    svg:
      '<path class="rxd" d="M-36 20h84v4.5h-84z"/><path class="rx" d="M-27 14l-4 6h34l-4 -6z"/>' +
      '<path class="rx" d="M-9 -30h14v30h-14zM-41 -10h9v20h-9z"/><path class="rxd" d="M-11 -33h18v3.4h-18zM-44 -12h3.2v24h-3.2z"/>' +
      '<circle class="rx" cx="-14" cy="0" r="20"/><circle class="rxvoid" cx="-14" cy="0" r="15.5"/>' +
      wheel(-14, 0, 14.5, 9) +
      '<path class="rxd" d="M6 -2.4h10v4.8h-10z"/><rect class="rxs" x="15.5" y="-12" width="29" height="24" rx="3.5"/><path class="rxe" d="M21 -12v24M26.5 -12v24M32 -12v24M37.5 -12v24"/>' +
      '<path class="rxhi" d="M18 -8.5h24"/><path class="rxd" d="M44.5 -9.5h4v19h-4zM24 -17h11v5h-11zM19 12h6v8h-6zM35 12h6v8h-6z"/>'
  });
  /* upright storage tank, cut open, with its liquid. w, h = size. Ports: t (top), b (bottom), l / r (low at the sides).
     level: [key, low, high] moves the level; liquid = 'water' | 'oil' picks its colour */
  R.tank = o => {
    const w = o.w || 56,
      h = o.h || 76,
      a = -w / 2,
      t = -h / 2,
      id = o.id || 'tk',
      inner = `M${a + 4.5} ${t + 9}H${-a - 4.5}V${-t - 4.5}H${a + 4.5}Z`;
    return {
      box: [a - 1, t - 7, -a + 1, -t + 1],
      ports: { t: [0, t - 6], b: [0, -t], l: [a, -t - 10], r: [-a, -t - 10] },
      svg:
        `<path class="rx" d="M-4 ${t - 6}h8v6h-8z"/><path class="rxv" d="M${a} ${t + 6}L0 ${t}L${-a} ${t + 6}V${-t}H${a}Z"/><path class="rxvoid" d="${inner}"/>` +
        lvl(id, inner, a + 4.5, t + 9, -a - 4.5, -t - 4.5, 0.6).replace(
          'class="rxwt"',
          `class="rxwt${o.liquid === 'oil' ? ' rxoil' : ''}"`
        ) +
        `<path class="rxe" d="M${a} ${t + 6}H${-a}"/>`
    };
  };
  /* generator with its exciter, closed (seen from the side). The shaft comes in at the left. The body takes the state colour
     of the rule in "on". Ports: l (shaft end), t (terminals, on top), r (exciter end) */
  R.generator = () => ({
    box: [-61, -34, 71, 37],
    ports: { l: [-60, 0], t: [0, -33], r: [70, 0], b: [0, 36] },
    svg:
      '<path class="rxd" d="M-48 30h112v6h-112z"/><rect class="rx" x="-60" y="-4.5" width="130" height="9"/>' +
      '<path class="rx" d="M-52 30V-6Q-52 -14 -45 -14H-41Q-34 -14 -34 -6V30Z"/>' +
      '<rect class="rxs" x="-30" y="-27" width="62" height="54" rx="6"/><path class="rxhi" d="M-25 -22h52"/><path class="rxe" d="M-18 -27v54M-6 -27v54M6 -27v54M18 -27v54"/>' +
      '<path class="rx" d="M-22 -33h46v7h-46zM-24 27h8v4h-8zM18 27h8v4h-8z"/><rect class="rx" x="42" y="-14" width="22" height="28" rx="3"/><path class="rxe" d="M49 -14v28M56 -14v28"/><path class="rxd" d="M40 14h26v16h-26z"/>'
  });
  /* plate heat exchanger (a cooler): the pack of plates between two frames. Ports: a1 / a2 (one side, left), b1 / b2
     (the other side, right) */
  R.cooler = () => ({
    box: [-27, -25, 27, 26],
    ports: {
      a1: [-26, -14],
      a2: [-26, 14],
      b1: [26, -14],
      b2: [26, 14],
      l: [-26, 0],
      r: [26, 0],
      t: [0, -24],
      b: [0, 25]
    },
    svg:
      '<path class="rx" d="M-26 -17h7v6h-7zM-26 11h7v6h-7zM19 -17h7v6h-7zM19 11h7v6h-7z"/><path class="rxd" d="M-18 21h36v4h-36z"/>' +
      '<rect class="rx" x="-19" y="-24" width="6" height="46" rx="1.5"/><rect class="rx" x="13" y="-24" width="6" height="46" rx="1.5"/>' +
      '<rect class="rxv" x="-13" y="-21" width="26" height="40"/><path class="rxe" d="M-9.7 -21v40M-6.5 -21v40M-3.2 -21v40M0 -21v40M3.2 -21v40M6.5 -21v40M9.7 -21v40"/><path class="rxd" d="M-21 -21.5h42v2.6h-42zM-21 15.5h42v2.6h-42z"/>'
  });
  /* strainer on a line: a pot with its basket. Ports: l / r */
  R.strainer = () => ({
    box: [-14, -15, 14, 17],
    ports: { l: [-13, 0], r: [13, 0], t: [0, -14], b: [0, 16] },
    svg: '<path class="rxd" d="M-13 -8h3v16h-3zM10 -8h3v16h-3z"/><path class="rx" d="M-10 -6H10V6H6L3 16H-3L-6 6H-10Z"/><path class="rxe" d="M-5 -2L0 12L5 -2"/><path class="rxd" d="M-6 -11h12v5h-12z"/>'
  });

  /* ---------------- the boiler: furnace, cyclone, seal pot, air heater, precipitator, stack ---------------- */
  /* What is from a source: FHI manual Part 2 Sect 1 (circulating fluidized bed furnace with its grate, superheater panels
     No. 1 and No. 2 in the furnace, 2 recycle cyclones with a seal pot each, 4 start-up burners, 4 screw ash coolers, a rotary
     air heater), Part 4 Sect 1 (the superheater panels hang in the upper FRONT of the furnace, opposite the cyclone inlets).
     Shapes and proportions are a picture only (the boiler general arrangement K1AU3-B-0-001 is not in document-references). */
  /* the furnace, cut open; front wall on the left, the outlet to the cyclone on the upper right. fire = the rule that shows
     the fire (bed bubbling, solids rising). Ports: out (to the cyclone), ret (solids back from the seal pot), coal / lime
     (front wall, low), sa1 / sa2 (secondary air, front / rear), pa (primary air into the wind box), ash1 / ash2 (bed drains),
     bur (start-up burner, front), roof, sh1i / sh1o / sh2i / sh2o (headers of superheater panel No. 1 and
     No. 2 at the front wall), dn1 / dn2 (downcomer and riser at the roof, under the drum) */
  R.furnace = o => {
    const inner = 'M-54 6H54V234L29 314H-29L-54 234Z';
    return {
      box: [-61, -1, 63, 351],
      ports: {
        out: [62, 44],
        ret: [43, 290],
        coal: [-45, 276],
        lime: [-50, 258],
        sa1: [-60, 214],
        sa2: [60, 214],
        pa: [0, 350],
        ash1: [-20, 350],
        ash2: [20, 350],
        bur: [-56, 238],
        roof: [0, 0],
        sh1i: [-63, 16],
        sh1o: [-63, 40],
        sh2i: [-63, 104],
        sh2o: [-63, 150],
        dn1: [-20, 0],
        dn2: [20, 0],
        l: [-60, 120],
        r: [60, 120]
      },
      svg:
        '<path class="rxv" d="M-60 0H60V236L34 316V350H-34V316L-60 236Z"/>' +
        `<path class="rxvoid" d="${inner}"/><path class="rxvoid" d="M53 18h9v52h-9zM-29 319h58v25h-58z"/>` +
        live(
          o.fire,
          `<path class="rxfire" d="${inner}"/><path class="rx-rise" d="M-38 280V40M-13 290V20M13 290V20M38 280V74"/>`
        ) +
        '<path class="rxbed" d="M-37 290L-29 314H29L37 290Z"/>' +
        live(
          o.fire,
          '<g class="rx-bub"><circle cx="-18" cy="300" r="3.2"/><circle cx="2" cy="304" r="2.6"/><circle cx="19" cy="299" r="3"/></g>'
        ) +
        /* superheater panel No. 1 (above) and No. 2: each a loop from its inlet header to its outlet header at the front wall */
        '<path class="rx-bank" style="--m:var(--hx-m-steam)" d="M-60 16H-16a12 12 0 0 1 0 24H-60M-60 104H-16a23 23 0 0 1 0 46H-60"/>' +
        '<path class="rxd" d="M-63 12h5v8h-5zM-63 36h5v8h-5zM-63 100h5v8h-5zM-63 146h5v8h-5z"/>' +
        '<path class="rxtray" d="M-29 316.5H29"/><path class="rxe" d="M-51 12V230M51 76V230"/>'
    };
  };
  /* a recycle cyclone, cut open: gas and solids in at the side, clean gas out through the pipe on top, solids down the leg.
     flow = the rule that turns the swirl. Ports: in, gas (top), dip (bottom of the leg) */
  R.cyclone = o => ({
    box: [-41, -15, 33, 197],
    ports: { in: [-40, 36], gas: [0, -14], dip: [0, 196], l: [-40, 36], t: [0, -14], b: [0, 196] },
    svg:
      '<path class="rxv" d="M-32 0H32V86L9 160V196H-9V160L-32 86Z"/><path class="rxvoid" d="M-27 5H27V84L5.5 158V196H-5.5V158L-27 84Z"/><path class="rxvoid" d="M-40 14h14v44h-14z"/>' +
      live(
        o.flow,
        '<path class="rx-swirl" d="M-24 24Q0 36 24 24M-24 50Q0 62 24 50M-21 78Q0 88 21 78M-14 110Q0 118 14 110M-8 138Q0 144 8 138"/><path class="rx-fall" style="--m:var(--hx-m-solid)" d="M0 150V194"/>'
      ) +
      '<path class="rx" d="M-13 -14h26v58h-26z"/><path class="rxvoid" d="M-9 -14h18v54h-18z"/>'
  });
  /* the seal pot under a cyclone: the solids come down the leg, are kept fluid by air and flow over into the furnace.
     flow = the rule that shows them moving. Ports: in (top, from the leg), out (to the furnace), air (below) */
  R.sealpot = o => ({
    box: [-17, -1, 49, 47],
    ports: { in: [0, 0], out: [48, 16], air: [16, 46], t: [0, 0], r: [48, 16], b: [16, 46] },
    svg:
      '<path class="rx" d="M-16 0H16V8H48V24H44V46H-16Z"/><path class="rxvoid" d="M-11 0H11V13H43V19H39V41H-11Z"/><path class="rxbed" d="M-11 16H11V22H39V41H-11Z"/><path class="rxwall" style="stroke-width:3" d="M13 13V30"/>' +
      live(o.flow, '<g class="rx-bub"><circle cx="-2" cy="34" r="2.6"/><circle cx="24" cy="34" r="2.6"/></g>')
  });
  /* rotary air heater seen from the side, cut open: the rotor with its heating elements turns through the gas side (right)
     and the two air sides (primary left, secondary middle). The drive takes the state colour (use M(...) or "on").
     Ports: paB / paT, saB / saT (air in below, out on top), gasT / gasB (gas in on top, out below) */
  R.airheater = () => {
    let el = '';
    for (let y = -22; y <= 22; y += 5.5) el += `M-51 ${y}H51`;
    return {
      box: [-59, -45, 59, 39],
      ports: {
        paT: [-36, -31],
        paB: [-36, 31],
        saT: [-4, -31],
        saB: [-4, 31],
        gasT: [34, -31],
        gasB: [34, 31],
        l: [-58, 0],
        r: [58, 0],
        t: [0, -44],
        b: [0, 38]
      },
      svg:
        '<path class="rxv" d="M-58 -31H58V31H-58Z"/><path class="rxvoid" d="M-53 -26H53V26H-53Z"/><path class="rx-tint" style="--m:var(--rx-hot)" d="M14 -26H53V26H14Z"/><path class="rx-tint" style="--m:var(--hx-m-air)" d="M-53 -26H14V26H-53Z"/>' +
        `<path class="rx-elem" d="${el}"/><path class="rxwall" style="stroke-width:2.4" d="M-20 -26V26M14 -26V26"/>` +
        '<path class="rx" d="M-2.5 -36h5v72h-5z"/><rect class="rxs" x="-9" y="-44" width="18" height="9" rx="2"/><path class="rxd" d="M-58 31h8v7h-8zM50 31h8v7h-8z"/>'
    };
  };
  /* electrostatic precipitator, cut open: three fields of collecting plates, the ash hoppers below. on / machine state colours
     the rectifiers on the roof. Ports: l (gas in), r (gas out), h1 / h2 / h3 (hoppers) */
  R.esp = () => {
    let pl = '';
    for (let x = -66; x <= 66; x += 6) if (Math.abs(x + 24) > 3 && Math.abs(x - 24) > 3) pl += `M${x} -22V20`;
    return {
      box: [-95, -37, 95, 53],
      ports: { l: [-94, 0], r: [94, 0], h1: [-48, 52], h2: [0, 52], h3: [48, 52], t: [0, -36], b: [0, 52] },
      svg:
        '<path class="rxv" d="M-94 -9L-74 -28H74L94 -9V9L74 26H-74L-94 9Z"/><path class="rxvoid" d="M-89 -7L-72 -23H72L89 -7V7L72 22H-72L-89 7Z"/>' +
        `<path class="rx-plate" d="${pl}"/>` +
        '<path class="rx" d="M-70 26L-54 52H-42L-26 26ZM-22 26L-6 52H6L22 26ZM26 26L42 52H54L70 26Z"/>' +
        '<rect class="rxs" x="-56" y="-36" width="16" height="8" rx="1.5"/><rect class="rxs" x="-8" y="-36" width="16" height="8" rx="1.5"/><rect class="rxs" x="40" y="-36" width="16" height="8" rx="1.5"/>'
    };
  };
  /* the stack. flow = the rule that shows the plume. Ports: in (at the foot, side), l / r */
  R.stack = o => ({
    box: [-21, -196, 21, 1],
    ports: { in: [-18, -14], l: [-18, -14], r: [18, -14], b: [0, 0], t: [0, -195] },
    svg:
      live(
        o.flow,
        '<g class="rx-plume"><circle cx="2" cy="-200" r="6"/><circle cx="7" cy="-210" r="8"/><circle cx="1" cy="-222" r="10"/></g>'
      ) +
      '<path class="rxv" d="M-18 0L-9 -190H9L18 0Z"/><path class="rxe" d="M-15 -60H15M-12 -124H12"/><path class="rxd" d="M-10.5 -195h21v5h-21z"/>'
  });

  /* ---------------- vessels and small machines of the other systems ---------------- */
  /* lying pressure vessel, cut open (a flash tank, a drain separator, a heater shell without tubes). w = length.
     level: [key, low, high] moves the level; without liquid: 'none'. Ports: t, b, l, r, t2 (second nozzle on top) */
  R.vessel = o => {
    const w = o.w || 90,
      a = -w / 2,
      b = w / 2,
      id = o.id || 'v',
      inner = `M${a + 16} -12.5H${b - 16}Q${b - 4.5} -12.5 ${b - 4.5} 0Q${b - 4.5} 12.5 ${b - 16} 12.5H${a + 16}Q${a + 4.5} 12.5 ${a + 4.5} 0Q${a + 4.5} -12.5 ${a + 16} -12.5Z`;
    return {
      box: [a - 1, -24, b + 1, 24],
      ports: { t: [0, -23], t2: [b - 22, -23], b: [0, 23], l: [a, 0], r: [b, 0] },
      svg:
        `<path class="rxd" d="M${a + 14} 17l-3 6h14l-3 -6zM${b - 28} 17l-3 6h14l-3 -6z"/><path class="rx" d="M-4 -23h8v7h-8zM${b - 26} -23h8v7h-8zM-4 16h8v7h-8z"/>` +
        `<path class="rx" d="M${a + 16} -17H${b - 16}Q${b} -17 ${b} 0Q${b} 17 ${b - 16} 17H${a + 16}Q${a} 17 ${a} 0Q${a} -17 ${a + 16} -17Z"/><path class="rxvoid" d="${inner}"/>` +
        (o.liquid === 'none' ? '' : lvl(id, inner, a + 4.5, -12.5, b - 4.5, 12.5, 0.4))
    };
  };
  /* upright pressure vessel on legs, closed (an air receiver, a filter vessel, a polisher). Ports: t, b, l, r */
  R.vvessel = o => {
    const h = o.h || 70,
      w = o.w || 34;
    return {
      box: [-w / 2 - 1, -h / 2 - 7, w / 2 + 1, h / 2 + 9],
      ports: { t: [0, -h / 2 - 6], b: [0, h / 2 + 2], l: [-w / 2, h / 4], r: [w / 2, h / 4] },
      svg:
        `<path class="rxd" d="M${n(-w / 2 + 3)} ${n(h / 2 - 6)}v14h4v-14zM${n(w / 2 - 7)} ${n(h / 2 - 6)}v14h4v-14z"/><path class="rx" d="M-3.5 ${n(-h / 2 - 6)}h7v7h-7z"/>` +
        `<path class="rxv" d="${vcap(w, h)}"/><path class="rxe" d="M${n(-w / 2)} ${n(-h / 2 + w / 2)}H${n(w / 2)}M${n(-w / 2)} ${n(h / 2 - w / 2)}H${n(w / 2)}"/>`
    };
  };
  /* steam jet ejector: motive steam in at the left, the suction from below, the mixture out at the right.
     flow = the rule that shows the jet. Ports: l (steam), b (suction), r (discharge) */
  R.ejector = o => ({
    box: [-27, -10, 31, 16],
    ports: { l: [-26, 0], r: [30, 0], b: [-10, 15], t: [-10, -9] },
    svg:
      '<path class="rxd" d="M-26 -7h3v14h-3zM27 -8h3v16h-3zM-15 12h10v3h-10z"/><path class="rx" d="M-23 -5H-18L-16 -9H-4L-2 -5L10 -2.5L27 -6.5V6.5L10 2.5L-2 5V12H-18V5H-23Z"/>' +
      live(o.flow, '<path class="rx-mist" style="stroke:var(--hx-m-steam)" d="M-18 0H24"/>')
  });
  /* coal bunker, cut open: the coal inside, the outlet below. level: [key, low, high]. Ports: t, b */
  R.bunker = o => {
    const id = o.id || 'bk',
      inner = 'M-25 -40H25V6L8 38H-8L-25 6Z';
    return {
      box: [-31, -46, 31, 45],
      ports: { t: [0, -45], b: [0, 44], l: [-30, -10], r: [30, -10] },
      svg:
        '<path class="rxv" d="M-30 -45H30V8L11 44H-11L-30 8Z"/>' +
        `<path class="rxvoid" d="${inner}"/>` +
        lvl(id, inner, -25, -40, 25, 38, 0.7).replace('class="rxwt"', 'class="rxwt rxcoal"')
    };
  };
  /* belt feeder (a gravimetric coal feeder), cut open: the belt runs while the feeder runs, the drive takes the state colour.
     Ports: in (on top, at the left), out (below, at the right), l, r */
  R.feeder = () => ({
    box: [-43, -19, 47, 20],
    ports: { in: [-26, -18], out: [28, 19], l: [-42, 0], r: [46, 0], t: [-26, -18], b: [28, 19] },
    svg:
      '<path class="rx" d="M-31 -18h10v7h-10zM23 12h10v7h-10z"/><rect class="rx" x="-42" y="-12" width="76" height="25" rx="3"/><rect class="rxvoid" x="-38" y="-8" width="68" height="17" rx="2"/>' +
      '<path class="rxcoalp" d="M-30 -1.5H22L26 3H-34Z"/><path class="rx-belt" d="M-33 3.2H25"/><circle class="rxd" cx="-33" cy="4" r="3.4"/><circle class="rxd" cx="25" cy="4" r="3.4"/>' +
      '<rect class="rxs" x="34" y="-7" width="12" height="15" rx="2"/>'
  });
  /* start-up oil burner in the furnace wall: the flame shows while the rule "on" / the machine state says it fires.
     The flame points to the right (into the furnace). Ports: l (oil and air in), r (flame end) */
  R.burner = () => ({
    box: [-21, -9, 30, 9],
    ports: { l: [-20, 0], r: [12, 0], t: [0, -8], b: [0, 8] },
    svg: '<path class="rxflame" d="M10 0Q16 -7 28 0Q16 7 10 0Z"/><path class="rxd" d="M-20 -6h3v12h-3z"/><path class="rx" d="M-17 -4.5H2L10 -2.5V2.5L2 4.5H-17Z"/><rect class="rxs" x="-12" y="-7.5" width="9" height="15" rx="1.5"/>'
  });
  /* air compressor as a package: the motor and the air end inside the enclosure, cut open. Ports: in (air in, left), out
     (compressed air, right) */
  R.compressor = () => ({
    box: [-37, -24, 37, 25],
    ports: { in: [-36, -6], out: [36, -6], l: [-36, -6], r: [36, -6], t: [0, -23], b: [0, 24] },
    svg:
      '<path class="rx" d="M-36 -10h6v8h-6zM30 -10h6v8h-6z"/><rect class="rxv" x="-30" y="-23" width="60" height="43" rx="4"/><rect class="rxvoid" x="-25" y="-18" width="50" height="33" rx="2.5"/><path class="rxd" d="M-28 20h56v4h-56z"/>' +
      '<rect class="rxs" x="-21" y="-9" width="19" height="18" rx="3"/><path class="rxe" d="M-15 -9v18M-9 -9v18"/><path class="rxd" d="M-2 -1.8h5v3.6h-5z"/><circle class="rx" cx="13" cy="0" r="10"/>' +
      wheel(13, 0, 7.5, 4)
  });
  /* compressed air dryer: two towers side by side. Ports: l (in), r (out) */
  R.dryer = () => ({
    box: [-22, -29, 22, 29],
    ports: { l: [-21, 18], r: [21, 18], t: [0, -28], b: [0, 28] },
    svg: `<path class="rxd" d="M-18 22h36v5h-36z"/><path class="rxv" transform="translate(-9.5 -2)" d="${vcap(15, 46)}"/><path class="rxv" transform="translate(9.5 -2)" d="${vcap(15, 46)}"/><path class="rxe" d="M-9.5 -25V-28H9.5V-25M-17 18h-4M17 18h4"/>`
  });
  /* tall silo with its cone, cut open, with what it holds (limestone, sand, ash). level: [key, low, high]. Ports: t, b */
  R.silo = o => {
    const h = o.h || 96,
      id = o.id || 'si',
      t = -h / 2,
      inner = `M-17 ${t + 8}H17V${-t - 26}L5 ${-t - 4}H-5L-17 ${-t - 26}Z`;
    return {
      box: [-23, t - 1, 23, -t + 1],
      ports: { t: [0, t], b: [0, -t], l: [-22, 0], r: [22, 0] },
      svg:
        `<path class="rxv" d="M-22 ${t + 6}L0 ${t}L22 ${t + 6}V${-t - 24}L8 ${-t}H-8L-22 ${-t - 24}Z"/><path class="rxvoid" d="${inner}"/>` +
        lvl(id, inner, -17, t + 8, 17, -t - 4, 0.6).replace('class="rxwt"', 'class="rxwt rxsolid"') +
        `<path class="rxd" d="M-22 ${-t - 24}v24h3.5v-24zM18.5 ${-t - 24}v24h3.5v-24z"/>`
    };
  };
  /* belt conveyor: the belt moves while it runs, the drive takes the state colour. w = length. Ports: l (feed end, on top),
     r (discharge end) */
  R.conveyor = o => {
    const w = o.w || 110,
      a = -w / 2,
      b = w / 2;
    return {
      box: [a - 6, -9, b + 14, 10],
      ports: { l: [a + 6, -8], r: [b + 4, 4], t: [0, -8], b: [0, 9] },
      svg:
        `<path class="rxd" d="M${a + 10} 5v4h4v-4zM${b - 14} 5v4h4v-4z"/><rect class="rx" x="${a - 5}" y="-5" width="${w + 10}" height="10" rx="5"/><path class="rx-belt" d="M${a} -5H${b}"/>` +
        `<circle class="rxd" cx="${a}" cy="0" r="3.6"/><circle class="rxd" cx="${b}" cy="0" r="3.6"/><rect class="rxs" x="${b + 3}" y="-8" width="10" height="12" rx="2"/>`
    };
  };
  /* screw conveyor / screw ash cooler, cut open: the flights move while it runs, the drive takes the state colour.
     w = length. Ports: in (on top, left), out (below, right) */
  R.screw = o => {
    const w = o.w || 100,
      a = -w / 2,
      b = w / 2;
    return {
      box: [a - 1, -15, b + 16, 15],
      ports: { in: [a + 12, -14], out: [b - 12, 14], l: [a, 0], r: [b + 15, 0], t: [a + 12, -14], b: [b - 12, 14] },
      svg:
        `<path class="rx" d="M${a + 7} -14h10v6h-10zM${b - 17} 8h10v6h-10z"/><rect class="rx" x="${a}" y="-9" width="${w}" height="18" rx="4"/><rect class="rxvoid" x="${a + 4}" y="-5.5" width="${w - 8}" height="11" rx="2.5"/>` +
        `<path class="rxst" d="M${a + 4} 0H${b - 4}"/><path class="rx-flight" d="M${a + 6} 0H${b - 6}"/><rect class="rxs" x="${b + 1}" y="-7.5" width="14" height="15" rx="2"/>`
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
