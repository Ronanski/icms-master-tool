/* HX: the plant pages of 3.2.3 (user 2026-11-16: "gawan ng mga HMI pages ... lahat ng planta macocover pati operator controls at
   trend", "BE ORIGINAL WALA KA DAPAT GAGAYAHIN"). This file is the SYMBOL SET of those pages: one drawing per kind of equipment, made
   for this app (not taken from the control room screens, the old pages or another DCS). Every symbol is drawn around (0, 0) and gives
   back { svg, ports, box }: ports are the points where a line may join it, box = [x0, y0, x1, y1] is the room it takes.
   Classes (hx.css): hxo = body (outline + fill), hxn = outline only, hxd = thin detail, hxk = solid ink, hxs = the part that takes the
   state colour (RUN / OPEN red, STOP / CLOSED green, TRIP blinking red, no signal grey), hxr = the part that turns while running,
   hxlv = the liquid of a vessel (the page sets its height from the level). No colour is written here: the theme does that. */
(function () {
  const n = x => String(Math.round(x * 10) / 10);
  const P = (...a) => a.map(n).join(' ');
  /* petals of a rotor: k blades of radius R, swept */
  const rotor = (k, R) => {
    let s = '';
    for (let i = 0; i < k; i++)
      s += `<path class="hxs" transform="rotate(${n((360 / k) * i)})" d="M0 0Q${P(R * 0.15, -R * 0.95)} ${P(R * 0.8, -R * 0.62)}Q${P(R * 0.42, -R * 0.12)} 0 0Z"/>`;
    return `<g class="hxr">${s}</g>`;
  };
  const capsule = (w, h) =>
    `M${P(-w / 2 + h / 2, -h / 2)}H${n(w / 2 - h / 2)}A${P(h / 2, h / 2)} 0 0 1 ${P(w / 2 - h / 2, h / 2)}H${n(-w / 2 + h / 2)}A${P(h / 2, h / 2)} 0 0 1 ${P(-w / 2 + h / 2, -h / 2)}Z`;
  const vcapsule = (w, h) =>
    `M${P(-w / 2, -h / 2 + w / 2)}A${P(w / 2, w / 2)} 0 0 1 ${P(w / 2, -h / 2 + w / 2)}V${n(h / 2 - w / 2)}A${P(w / 2, w / 2)} 0 0 1 ${P(-w / 2, h / 2 - w / 2)}Z`;
  const rrect = (w, h, r) =>
    `<rect class="hxo" x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}"/>`;
  const zig = (x0, x1, y, a, k) => {
    let d = `M${P(x0, y)}`;
    const st = (x1 - x0) / k;
    for (let i = 0; i < k; i++) d += `L${P(x0 + st * (i + 0.5), y + (i % 2 ? a : -a))}`;
    return d + `L${P(x1, y)}`;
  };
  const ports4 = (w, h) => ({ l: [-w / 2, 0], r: [w / 2, 0], t: [0, -h / 2], b: [0, h / 2] });
  /* a level: the liquid is a rect clipped by the vessel; the page moves rect[data-lv] (y, height) between y1 (empty) and y0 (full) */
  const level = (id, shape, x0, y0, x1, y1) =>
    `<clipPath id="hxc-${id}"><path d="${shape}"/></clipPath><rect class="hxlv" data-lv="${n(y0)},${n(y1)}" clip-path="url(#hxc-${id})" x="${n(x0)}" y="${n(y1)}" width="${n(x1 - x0)}" height="0"/>`;
  const S = {};

  /* ---- machines that turn ---- */
  S.pump = o => {
    const r = o.r || 16;
    return {
      box: [-r - 2, -r - 2, r + 2, r + 7],
      ports: { l: [-r, 0], r: [r, 0], t: [0, -r], b: [0, r] },
      svg:
        `<path class="hxn" d="M${P(-r * 0.75, r + 5)}H${n(r * 0.75)}M${P(-r * 0.5, r * 0.86)}L${P(-r * 0.75, r + 5)}M${P(r * 0.5, r * 0.86)}L${P(r * 0.75, r + 5)}"/>` +
        `<circle class="hxo" r="${r}"/>${rotor(3, r * 0.72)}<circle class="hxk" r="2"/>`
    };
  };
  S.fan = o => {
    const r = o.r || 20;
    let bl = '';
    for (let i = 0; i < 8; i++)
      bl += `<path class="hxs" transform="rotate(${i * 45})" d="M${P(-2, -r * 0.3)}L${P(-3.2, -r * 0.8)}H${n(3.2)}L${P(2, -r * 0.3)}Z"/>`;
    return {
      box: [-r - 2, -r - 2, r + 12, r + 2],
      ports: { l: [-r, 0], r: [r + 10, 0], t: [0, -r], b: [0, r] },
      svg: `<path class="hxo" d="M${P(r * 0.7, -r * 0.5)}L${P(r + 10, -r * 0.42)}V${n(r * 0.42)}L${P(r * 0.7, r * 0.5)}Z"/><circle class="hxo" r="${r}"/><g class="hxr">${bl}</g><circle class="hxo" r="${n(r * 0.24)}"/>`
    };
  };
  S.blower = o => {
    const r = o.r || 15;
    return {
      box: [-r * 1.5 - 2, -r - 2, r * 1.5 + 2, r + 2],
      ports: { l: [-r * 1.5, 0], r: [r * 1.5, 0], t: [0, -r], b: [0, r] },
      svg:
        `<path class="hxo" d="${capsule(r * 3, r * 2)}"/>` +
        `<g transform="translate(${n(-r * 0.5)} 0)"><g class="hxr"><path class="hxs" d="${capsule(r * 1.5, r * 0.62)}"/></g></g>` +
        `<g transform="translate(${n(r * 0.5)} 0)"><g class="hxr"><path class="hxs" transform="rotate(90)" d="${capsule(r * 1.5, r * 0.62)}"/></g></g>`
    };
  };
  S.compressor = o => {
    const r = o.r || 17;
    return {
      box: [-r - 2, -r - 2, r + 2, r + 2],
      ports: { l: [-r, 0], r: [r, 0], t: [0, -r], b: [0, r] },
      svg: `<circle class="hxo" r="${r}"/><path class="hxs" d="M${P(-r * 0.72, -r * 0.62)}L${P(r * 0.82, -r * 0.22)}V${n(r * 0.22)}L${P(-r * 0.72, r * 0.62)}Z"/>`
    };
  };
  /* a motor alone (agitator, rotary valve, drive of a conveyor) */
  S.motor = o => {
    const w = o.w || 30,
      h = o.h || 20;
    return {
      box: [-w / 2 - 6, -h / 2 - 2, w / 2 + 2, h / 2 + 2],
      ports: ports4(w, h),
      svg:
        `<path class="hxn" d="M${P(-w / 2 - 6, 0)}H${n(-w / 2)}"/>${rrect(w, h, 4)}` +
        `<rect class="hxs" x="${n(-w / 2 + 5)}" y="${n(-h / 2 + 5)}" width="${n(w - 10)}" height="${n(h - 10)}" rx="2"/>`
    };
  };

  /* ---- valves and dampers ---- */
  const bow = (w, h) => `M${P(-w / 2, -h / 2)}L0 0L${P(-w / 2, h / 2)}ZM${P(w / 2, -h / 2)}L0 0L${P(w / 2, h / 2)}Z`;
  S.valve = o => {
    const w = 24,
      h = 16,
      k = o.kind || 'manual',
      fl = `<rect class="hxo" x="${n(-w / 2 - 2.2)}" y="${n(-h / 2 - 1.5)}" width="2.6" height="${n(h + 3)}" rx="0.8"/><rect class="hxo" x="${n(w / 2 - 0.4)}" y="${n(-h / 2 - 1.5)}" width="2.6" height="${n(h + 3)}" rx="0.8"/>`;
    let top = '',
      ty = -h / 2;
    if (k === 'control') {
      /* diaphragm actuator: yoke, plate, dome */
      top = `<path class="hxn" d="M0 -1V-12M-4 -6L-6 -12M4 -6L6 -12"/><path class="hxo" d="M-10.5 -12H10.5V-14.5Q10.5 -23 0 -23Q-10.5 -23 -10.5 -14.5Z"/><path class="hxd" d="M-10.5 -14.5H10.5"/>`;
      ty = -23;
    } else if (k === 'motor') {
      /* electric actuator: gear box with its hand wheel */
      top = `<path class="hxn" d="M0 -1V-10"/><rect class="hxo" x="-8.5" y="-23" width="14" height="13" rx="2"/><circle class="hxo" cx="8.6" cy="-16.5" r="4.2"/><path class="hxd" d="M8.6 -20.7V-12.3M4.4 -16.5H12.8"/>`;
      ty = -23;
    } else if (k === 'shutoff') {
      /* piston actuator of an on / off valve */
      top = `<path class="hxn" d="M0 -1V-9"/><rect class="hxo" x="-6.5" y="-23" width="13" height="14" rx="1.6"/><path class="hxd" d="M-6.5 -17H6.5M0 -17V-9"/>`;
      ty = -23;
    } else if (k === 'manual') {
      top = `<path class="hxn" d="M0 -1V-11"/><rect class="hxk" x="-8" y="-13.2" width="16" height="2.8" rx="1.4"/>`;
      ty = -13;
    } else if (k === 'safety') {
      /* spring loaded: bonnet with its spring */
      top = `<path class="hxo" d="M-4.5 -2H4.5V-22H-4.5Z"/><path class="hxd" d="M-4.5 -5L4.5 -8L-4.5 -11L4.5 -14L-4.5 -17L4.5 -20"/>`;
      ty = -22;
    }
    const body =
      k === 'check'
        ? `<path class="hxo" d="${bow(w, h)}"/><path class="hxk" d="M${P(w / 2, -h / 2)}L0 0L${P(w / 2, h / 2)}Z"/>`
        : `<path class="hxo hxs" d="${bow(w, h)}"/>`;
    return {
      box: [-w / 2 - 3, ty - 1, w / 2 + 3, h / 2 + 2.5],
      ports: { l: [-w / 2 - 2, 0], r: [w / 2 + 2, 0], t: [0, ty], b: [0, h / 2] },
      svg: top + fl + body + (k === 'check' || k === 'plain' ? '' : '<circle class="hxk" r="1.6"/>')
    };
  };
  /* damper: a piece of duct with blades; the page turns g[data-bl] by the position (0 % = shut = blades across the flow) */
  S.damper = o => {
    const w = 26,
      h = o.h || 22,
      k = o.kind || 'control';
    let bl = '';
    for (const y of [-h / 4, h / 4])
      bl += `<g transform="translate(0 ${n(y)})"><path class="hxblade" data-bl="1" d="M0 ${n(-h / 4 + 1)}V${n(h / 4 - 1)}"/></g>`;
    const top =
      k === 'none'
        ? ''
        : `<path class="hxn" d="M0 ${n(-h / 2)}V${n(-h / 2 - 7)}"/>` +
          (k === 'motor'
            ? `<rect class="hxo" x="-7" y="${n(-h / 2 - 20)}" width="14" height="13" rx="2"/><circle class="hxd" cy="${n(-h / 2 - 13.5)}" r="3.4"/>`
            : `<path class="hxo" d="M-8 ${n(-h / 2 - 7)}A8 7 0 0 1 8 ${n(-h / 2 - 7)}Z"/>`);
    const ty = k === 'none' ? -h / 2 : k === 'motor' ? -h / 2 - 20 : -h / 2 - 14;
    return {
      box: [-w / 2 - 1, ty - 1, w / 2 + 1, h / 2 + 1],
      ports: { l: [-w / 2, 0], r: [w / 2, 0], t: [0, ty], b: [0, h / 2] },
      svg:
        top +
        `<rect class="hxo" x="${n(-w / 2)}" y="${n(-h / 2)}" width="${w}" height="${n(h)}" rx="2"/><g class="hxbl">${bl}</g>`
    };
  };

  /* ---- vessels ---- */
  S.tank = o => {
    const w = o.w || 70,
      h = o.h || 90,
      r = Math.min(10, w / 5),
      sh = `M${P(-w / 2, -h / 2 + r)}A${P(r, r)} 0 0 1 ${P(-w / 2 + r, -h / 2)}H${n(w / 2 - r)}A${P(r, r)} 0 0 1 ${P(w / 2, -h / 2 + r)}V${n(h / 2)}H${n(-w / 2)}Z`;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: Object.assign(ports4(w, h), {
        lb: [-w / 2, h / 2 - 12],
        rb: [w / 2, h / 2 - 12],
        lt: [-w / 2, -h / 2 + 14],
        rt: [w / 2, -h / 2 + 14]
      }),
      svg: `<path class="hxo" d="${sh}"/>${level(o.id, sh, -w / 2, -h / 2 + 4, w / 2, h / 2)}<path class="hxn" d="${sh}"/>`
    };
  };
  S.vessel = o => {
    const w = o.w || 44,
      h = o.h || 80,
      sh = vcapsule(w, h);
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: Object.assign(ports4(w, h), {
        lb: [-w / 2, h / 4],
        rb: [w / 2, h / 4],
        lt: [-w / 2, -h / 4],
        rt: [w / 2, -h / 4]
      }),
      svg: `<path class="hxo" d="${sh}"/>${level(o.id, sh, -w / 2, -h / 2 + 4, w / 2, h / 2)}<path class="hxn" d="${sh}"/>`
    };
  };
  S.drum = o => {
    const w = o.w || 190,
      h = o.h || 54,
      sh = capsule(w, h);
    let tk = '';
    for (const y of [-h / 4, 0, h / 4]) tk += `M${P(w / 2 - 20, y)}h6`;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: Object.assign(ports4(w, h), {
        tl: [-w / 4, -h / 2],
        tr: [w / 4, -h / 2],
        bl: [-w / 4, h / 2],
        br: [w / 4, h / 2]
      }),
      svg: `<path class="hxo" d="${sh}"/>${level(o.id, sh, -w / 2, -h / 2 + 3, w / 2, h / 2 - 3)}<path class="hxn" d="${sh}"/><path class="hxd" d="${tk}"/>`
    };
  };
  /* shell and tube exchanger (cooler, heater, condenser of a small system) */
  S.exchanger = o => {
    const w = o.w || 110,
      h = o.h || 40,
      sh = capsule(w, h);
    let tb = '';
    for (const y of [-h / 4, 0, h / 4]) tb += `M${P(-w / 2 + h / 2, y)}H${n(w / 2 - h / 2)}`;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: Object.assign(ports4(w, h), {
        tl: [-w / 4, -h / 2],
        tr: [w / 4, -h / 2],
        bl: [-w / 4, h / 2],
        br: [w / 4, h / 2]
      }),
      svg: `<path class="hxo" d="${sh}"/><path class="hxd" d="${tb}M${P(-w / 2 + h / 2, -h / 2)}v${n(h)}M${P(w / 2 - h / 2, -h / 2)}v${n(h)}"/>`
    };
  };
  /* feedwater heater: shell with the U tubes and its own level of drains */
  S.heater = o => {
    const w = o.w || 120,
      h = o.h || 44,
      sh = capsule(w, h),
      x0 = -w / 2 + h / 2,
      x1 = w / 2 - h * 0.7;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: Object.assign(ports4(w, h), {
        tl: [-w / 4, -h / 2],
        tr: [w / 4, -h / 2],
        bl: [-w / 4, h / 2],
        br: [w / 4, h / 2],
        lt: [-w / 2 + 3, -h / 5],
        lb: [-w / 2 + 3, h / 5]
      }),
      svg:
        `<path class="hxo" d="${sh}"/>${level(o.id, sh, -w / 2, h / 2 - h * 0.42, w / 2, h / 2)}<path class="hxn" d="${sh}"/>` +
        `<path class="hxd" d="M${P(x0, -h / 5)}H${n(x1)}A${P(h / 5, h / 5)} 0 0 1 ${P(x1, h / 5)}H${n(x0)}M${P(x0, -h / 2)}v${n(h)}"/>`
    };
  };
  S.deaerator = o => {
    const w = o.w || 190,
      h = o.h || 46,
      w2 = w * 0.42,
      h2 = 26,
      sh = capsule(w, h),
      y2 = -h / 2 - 8 - h2 / 2;
    return {
      box: [-w / 2 - 1, y2 - h2 / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: Object.assign(ports4(w, h), {
        t: [0, y2 - h2 / 2],
        tl: [-w2 / 2, y2],
        tr: [w2 / 2, y2],
        bl: [-w / 4, h / 2],
        br: [w / 4, h / 2],
        sl: [-w / 3, -h / 2],
        sr: [w / 3, -h / 2]
      }),
      svg:
        `<path class="hxn" d="M${P(-w2 / 4, y2 + h2 / 2)}V${n(-h / 2)}M${P(w2 / 4, y2 + h2 / 2)}V${n(-h / 2)}"/>` +
        `<path class="hxo" transform="translate(0 ${n(y2)})" d="${capsule(w2, h2)}"/><path class="hxd" d="${zig(-w2 / 2 + 12, w2 / 2 - 12, y2, 4, 6)}"/>` +
        `<path class="hxo" d="${sh}"/>${level(o.id, sh, -w / 2, -h / 2 + 3, w / 2, h / 2)}<path class="hxn" d="${sh}"/>`
    };
  };
  /* surface condenser with its hotwell */
  S.condenser = o => {
    const w = o.w || 170,
      h = o.h || 86,
      hw = 26,
      y1 = h / 2 - hw,
      sh = `M${P(-w * 0.3, y1)}H${n(w * 0.3)}V${n(h / 2)}H${n(-w * 0.3)}Z`;
    let tb = '';
    for (let i = 0; i < 4; i++) tb += `M${P(-w / 2 + 14, -h / 2 + 14 + i * ((y1 + h / 2 - 28) / 3))}H${n(w / 2 - 14)}`;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: {
        l: [-w / 2, -hw / 2],
        r: [w / 2, -hw / 2],
        t: [0, -h / 2],
        b: [0, h / 2],
        lt: [-w / 2, -h / 2 + 16],
        lb: [-w / 2, y1 - 16],
        rt: [w / 2, -h / 2 + 16],
        rb: [w / 2, y1 - 16],
        hl: [-w * 0.3, y1 + hw / 2],
        hr: [w * 0.3, y1 + hw / 2]
      },
      svg: `<rect class="hxo" x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h - hw)}" rx="6"/><path class="hxd" d="${tb}"/><path class="hxo" d="${sh}"/>${level(o.id, sh, -w * 0.3, y1 + 2, w * 0.3, h / 2)}<path class="hxn" d="${sh}"/>`
    };
  };

  /* ---- turbine, generator, electrical ---- */
  S.turbine = o => {
    const w = o.w || 90,
      h = o.h || 70,
      a = o.flip ? 1 : 0.42,
      b = o.flip ? 0.42 : 1;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: {
        l: [-w / 2, 0],
        r: [w / 2, 0],
        t: [0, (-h / 4) * (a + b)],
        b: [0, (h / 4) * (a + b)],
        in: [o.flip ? w / 2 - 12 : -w / 2 + 12, (-h / 2) * (o.flip ? b : a) - 0],
        out: [o.flip ? -w / 2 + 14 : w / 2 - 14, (h / 2) * (o.flip ? a : b) * 0.98]
      },
      svg: `<path class="hxo" d="M${P(-w / 2, (-h / 2) * a)}L${P(w / 2, (-h / 2) * b)}V${n((h / 2) * b)}L${P(-w / 2, (h / 2) * a)}Z"/><path class="hxd" d="${[0.14, 0.3, 0.46, 0.62, 0.78, 0.92].map(f => `M${P(-w / 2 + w * f, (-h / 2) * (a + (b - a) * f) + 3)}V${n((h / 2) * (a + (b - a) * f) - 3)}`).join('')}"/>`
    };
  };
  S.generator = o => {
    const w = o.w || 84,
      h = o.h || 56;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: ports4(w, h),
      svg:
        rrect(w, h, 8) +
        `<circle class="hxn" r="${n(h * 0.3)}"/><path class="hxs" d="M${P(-h * 0.17, 0)}q${P(h * 0.085, -h * 0.2)} ${P(h * 0.17, 0)}t${P(h * 0.17, 0)}l0 3q${P(-h * 0.085, h * 0.2)} ${P(-h * 0.17, 0)}t${P(-h * 0.17, 0)}Z"/>`
    };
  };
  /* breaker: closed = solid (red), open = hollow (green) */
  S.breaker = () => ({
    box: [-11, -11, 11, 11],
    ports: ports4(20, 20),
    svg: `<rect class="hxo" x="-10" y="-10" width="20" height="20" rx="2"/><rect class="hxs" x="-5.5" y="-5.5" width="11" height="11" rx="1"/>`
  });
  S.transformer = o => {
    const r = o.r || 13;
    return {
      box: [-r - 1, -r * 1.7 - 1, r + 1, r * 1.7 + 1],
      ports: { t: [0, -r * 1.7], b: [0, r * 1.7], l: [-r, 0], r: [r, 0] },
      svg: `<circle class="hxn" cy="${n(-r * 0.7)}" r="${r}"/><circle class="hxn" cy="${n(r * 0.7)}" r="${r}"/>`
    };
  };

  /* ---- boiler ---- */
  /* circulating fluidized bed furnace: tapered lower furnace with the bed, the air distributor and the wind box */
  S.furnace = o => {
    const w = o.w || 130,
      h = o.h || 380,
      wb = 26,
      t = h * 0.26,
      wl = w * 0.6,
      yb = h / 2 - wb,
      yt = yb - t,
      sh = `M${P(-w / 2, -h / 2)}H${n(w / 2)}V${n(yt)}L${P(wl / 2, yb)}H${n(-wl / 2)}L${P(-w / 2, yt)}Z`;
    let dots = '';
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 7; i++)
        dots += `<circle class="hxbed" cx="${n(-wl / 2 + 8 + ((wl - 16) / 6) * i + (j % 2 ? 4 : -2))}" cy="${n(yb - 8 - j * 9)}" r="1.5"/>`;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: {
        l: [-w / 2, 0],
        r: [w / 2, 0],
        t: [0, -h / 2],
        b: [0, h / 2],
        rt: [w / 2, -h / 2 + 34],
        lt: [-w / 2, -h / 2 + 34],
        rm: [w / 2, yt - 30],
        lm: [-w / 2, yt - 30],
        rl: [(w + wl) / 4, yt + t / 2],
        ll: [-(w + wl) / 4, yt + t / 2],
        wl: [-wl / 2, yb + wb / 2],
        wr: [wl / 2, yb + wb / 2]
      },
      svg: `<path class="hxo" d="${sh}"/>${dots}<path class="hxd" d="M${P(-wl / 2, yb)}H${n(wl / 2)}" style="stroke-dasharray:3 3"/><rect class="hxo" x="${n(-wl / 2)}" y="${n(yb)}" width="${n(wl)}" height="${wb}" rx="2"/>`
    };
  };
  S.cyclone = o => {
    const w = o.w || 70,
      h = o.h || 150,
      c = h * 0.36;
    return {
      box: [-w / 2 - 1, -h / 2 - 9, w / 2 + 1, h / 2 + 1],
      ports: { l: [-w / 2, -h / 2 + 16], r: [w / 2, -h / 2 + 16], t: [0, -h / 2 - 8], b: [0, h / 2] },
      svg: `<path class="hxo" d="M${P(-w / 2, -h / 2)}H${n(w / 2)}V${n(-h / 2 + c)}L${P(7, h / 2)}H-7L${P(-w / 2, -h / 2 + c)}Z"/><path class="hxo" d="M-9 ${n(-h / 2 - 8)}H9V${n(-h / 2 + c * 0.55)}H-9Z"/><path class="hxd" d="M${P(-w / 2, -h / 2 + c)}H${n(w / 2)}"/>`
    };
  };
  /* loop seal (seal pot) that returns the solids of the cyclone to the furnace */
  S.sealpot = o => {
    const w = o.w || 56,
      h = o.h || 30;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: Object.assign(ports4(w, h), { tl: [-w / 4, -h / 2], tr: [w / 4, -h / 2] }),
      svg: `<path class="hxo" d="M${P(-w / 2, -h / 2)}H${n(w / 2)}V${n(h / 2 - 6)}Q${P(w / 2, h / 2)} ${P(w / 2 - 6, h / 2)}H${n(-w / 2 + 6)}Q${P(-w / 2, h / 2)} ${P(-w / 2, h / 2 - 6)}Z"/><path class="hxd" d="M0 ${n(-h / 2)}V${n(h / 2 - 10)}"/>`
    };
  };
  /* a pass of the back pass with its tube banks: banks = number of banks */
  S.backpass = o => {
    const w = o.w || 110,
      h = o.h || 300,
      k = o.banks || 4,
      g = (h - 40) / k;
    let b = '';
    for (let i = 0; i < k; i++)
      b += zig(-w / 2 + 10, w / 2 - 10, -h / 2 + 20 + g * (i + 0.5), Math.min(9, g * 0.28), 9);
    const ports = { l: [-w / 2, 0], r: [w / 2, 0], t: [0, -h / 2], b: [0, h / 2] };
    for (let i = 0; i < k; i++) {
      ports['l' + (i + 1)] = [-w / 2, -h / 2 + 20 + g * (i + 0.5)];
      ports['r' + (i + 1)] = [w / 2, -h / 2 + 20 + g * (i + 0.5)];
    }
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports,
      svg: rrect(w, h, 4) + `<path class="hxd" d="${b}"/>`
    };
  };
  /* one tube bank alone (a superheater, a reheater, an economizer drawn on the steam or water side) */
  S.bank = o => {
    const w = o.w || 84,
      h = o.h || 44;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: ports4(w, h),
      svg: rrect(w, h, 5) + `<path class="hxd" d="${zig(-w / 2 + 9, w / 2 - 9, 0, h * 0.26, 7)}"/>`
    };
  };
  /* rotary (regenerative) air preheater seen from above: the rotor turns while its drive runs */
  S.airheater = o => {
    const r = o.r || 46;
    let sp = '';
    for (let i = 0; i < 12; i++)
      sp += `M0 0L${P(r * 0.9 * Math.cos((i * Math.PI) / 6), r * 0.9 * Math.sin((i * Math.PI) / 6))}`;
    return {
      box: [-r - 1, -r - 1, r + 1, r + 1],
      ports: {
        l: [-r, 0],
        r: [r, 0],
        t: [0, -r],
        b: [0, r],
        lt: [-r * 0.7, -r * 0.7],
        lb: [-r * 0.7, r * 0.7],
        rt: [r * 0.7, -r * 0.7],
        rb: [r * 0.7, r * 0.7]
      },
      svg: `<circle class="hxo" r="${r}"/><g class="hxr hxslow"><path class="hxd" d="${sp}"/></g><circle class="hxn" r="${n(r * 0.9)}"/><circle class="hxo hxs" r="${n(r * 0.16)}"/>`
    };
  };
  /* electrostatic precipitator: fields = number of fields, each with its hopper */
  S.precipitator = o => {
    const w = o.w || 200,
      h = o.h || 90,
      k = o.fields || 5,
      hp = 22,
      y1 = h / 2 - hp,
      fw = w / k;
    let d = '',
      hop = '';
    for (let i = 0; i < k; i++) {
      if (i) d += `M${P(-w / 2 + fw * i, -h / 2)}V${n(y1)}`;
      hop += `M${P(-w / 2 + fw * i + 3, y1)}L${P(-w / 2 + fw * (i + 0.5), h / 2)}L${P(-w / 2 + fw * (i + 1) - 3, y1)}`;
    }
    const ports = { l: [-w / 2, -hp / 2], r: [w / 2, -hp / 2], t: [0, -h / 2], b: [0, h / 2] };
    for (let i = 0; i < k; i++) ports['h' + (i + 1)] = [-w / 2 + fw * (i + 0.5), h / 2];
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports,
      svg: `<rect class="hxo" x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h - hp)}" rx="3"/><path class="hxd" d="${d}"/><path class="hxn" d="${hop}"/>`
    };
  };
  S.stack = o => {
    const w = o.w || 34,
      h = o.h || 200;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: { l: [-w / 2 + 2, h / 2 - 16], r: [w / 2 - 2, h / 2 - 16], t: [0, -h / 2], b: [0, h / 2] },
      svg: `<path class="hxo" d="M${P(-w * 0.3, -h / 2)}H${n(w * 0.3)}L${P(w / 2, h / 2)}H${n(-w / 2)}Z"/>`
    };
  };
  /* oil burner: the flame shows only while the page says it is lit (class hx-run on the node) */
  S.burner = () => ({
    box: [-22, -11, 30, 11],
    ports: { l: [-22, 0], r: [28, 0], t: [-8, -9], b: [-8, 9] },
    svg: `<path class="hxo" d="M-22 -6H-2L6 -9V9L-2 6H-22Z"/><path class="hxs hxflame" d="M8 0Q14 -9 28 0Q14 9 8 0Z"/>`
  });

  /* ---- solids ---- */
  S.bunker = o => {
    const w = o.w || 70,
      h = o.h || 100,
      c = h * 0.38,
      sh = `M${P(-w / 2, -h / 2)}H${n(w / 2)}V${n(h / 2 - c)}L${P(7, h / 2)}H-7L${P(-w / 2, h / 2 - c)}Z`;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: ports4(w, h),
      svg: `<path class="hxo" d="${sh}"/>${level(o.id, sh, -w / 2, -h / 2 + 4, w / 2, h / 2)}<path class="hxn" d="${sh}"/>`
    };
  };
  /* belt feeder or conveyor: the pulleys take the state colour */
  S.conveyor = o => {
    const w = o.w || 90,
      h = 14;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: {
        l: [-w / 2, 0],
        r: [w / 2, 0],
        t: [-w / 2 + 12, -h / 2],
        b: [w / 2 - 8, h / 2],
        tl: [-w / 2 + 12, -h / 2],
        br: [w / 2 - 8, h / 2]
      },
      svg: `<path class="hxo" d="${capsule(w, h)}"/><circle class="hxs" cx="${n(-w / 2 + h / 2)}" r="3.6"/><circle class="hxs" cx="${n(w / 2 - h / 2)}" r="3.6"/>`
    };
  };
  /* screw conveyor / water cooled screw cooler */
  S.screw = o => {
    const w = o.w || 90,
      h = 18;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: { l: [-w / 2, 0], r: [w / 2, 0], t: [-w / 2 + 12, -h / 2], b: [w / 2 - 10, h / 2] },
      svg: `<path class="hxo" d="${capsule(w, h)}"/><path class="hxn hxs2" d="${zig(-w / 2 + 8, w / 2 - 8, 0, 5, Math.round(w / 9))}"/>`
    };
  };
  /* rotary (air lock) valve under a hopper */
  S.rotary = o => {
    const r = o.r || 11;
    return {
      box: [-r - 1, -r - 1, r + 1, r + 1],
      ports: { l: [-r, 0], r: [r, 0], t: [0, -r], b: [0, r] },
      svg: `<circle class="hxo" r="${r}"/><g class="hxr"><path class="hxs" d="M${P(-r * 0.8, -1.6)}H${n(r * 0.8)}V1.6H${n(-r * 0.8)}ZM-1.6 ${n(-r * 0.8)}V${n(r * 0.8)}H1.6V${n(-r * 0.8)}Z"/></g>`
    };
  };

  /* drain pot under a steam line */
  S.pot = () => ({
    box: [-6, -11, 6, 11],
    ports: { t: [0, -10], b: [0, 10], l: [-5, 0], r: [5, 0] },
    svg: `<path class="hxo" d="${vcapsule(10, 20)}"/>`
  });
  /* reheater: inlet header, four tube assemblies, outlet header (steam from the top header to the bottom one in the drawing) */
  S.reheater = o => {
    const w = o.w || 104,
      h = o.h || 124,
      hd = 15,
      g = (h - 2 * hd - 8) / 4;
    let b = '';
    for (let i = 0; i < 4; i++)
      b += zig(-w / 2 + 16, w / 2 - 16, -h / 2 + hd + 4 + g * (i + 0.5), Math.min(7, g * 0.3), 9);
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: {
        t: [0, -h / 2],
        b: [0, h / 2],
        l: [-w / 2, 0],
        r: [w / 2, 0],
        tl: [-w / 2, -h / 2 + hd / 2],
        tr: [w / 2, -h / 2 + hd / 2],
        bl: [-w / 2, h / 2 - hd / 2],
        br: [w / 2, h / 2 - hd / 2]
      },
      svg: `<rect class="hxo" x="${n(-w / 2 + 8)}" y="${n(-h / 2 + hd)}" width="${n(w - 16)}" height="${n(h - 2 * hd)}"/><path class="hxd" d="${b}"/><rect class="hxo" x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${hd}" rx="4"/><rect class="hxo" x="${n(-w / 2)}" y="${n(h / 2 - hd)}" width="${n(w)}" height="${hd}" rx="4"/>`
    };
  };

  /* ---- small things on a line ---- */
  S.filter = o => {
    const w = o.w || 26;
    return {
      box: [-w / 2 - 1, -w / 2 - 1, w / 2 + 1, w / 2 + 1],
      ports: ports4(w, w),
      svg: `<rect class="hxo" x="${n(-w / 2)}" y="${n(-w / 2)}" width="${w}" height="${w}" rx="3"/><path class="hxd" style="stroke-dasharray:3 2.4" d="M${P(-w / 2, w / 2)}L${P(w / 2, -w / 2)}"/>`
    };
  };
  /* dryer of compressed air: twin towers */
  S.dryer = () => ({
    box: [-19, -21, 19, 21],
    ports: ports4(36, 40),
    svg: `<path class="hxo" transform="translate(-9 0)" d="${vcapsule(14, 40)}"/><path class="hxo" transform="translate(9 0)" d="${vcapsule(14, 40)}"/><path class="hxd" d="M-9 -8H9M-9 8H9"/>`
  });
  /* spray (attemperator / desuperheater) on a steam line */
  S.spray = () => ({
    box: [-11, -11, 11, 11],
    ports: ports4(20, 20),
    svg: `<circle class="hxo" r="10"/><path class="hxd" d="M0 -10V-3M0 -3L-5 4M0 -3V5M0 -3L5 4"/>`
  });
  /* ejector / silencer / vent to atmosphere */
  S.vent = () => ({
    box: [-9, -16, 9, 1],
    ports: { b: [0, 0], t: [0, -15], l: [-8, -8], r: [8, -8] },
    svg: `<path class="hxo" d="M-4 0V-6L-8 -15H8L4 -6V0Z"/>`
  });
  /* analyzer / instrument that stands alone */
  S.analyzer = () => ({
    box: [-12, -10, 12, 10],
    ports: ports4(22, 18),
    svg: `<rect class="hxo" x="-11" y="-9" width="22" height="18" rx="4"/><path class="hxd" d="M-6 2q3 -8 6 0t6 0"/>`
  });
  /* header / bus bar: a thick bar that lines join */
  S.header = o => {
    const w = o.w || 120,
      h = o.h || 8;
    return {
      box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1],
      ports: ports4(w, h),
      svg: `<rect class="hxk" x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(Math.min(w, h) / 2)}"/>`
    };
  };
  /* a plain block for a package that has no picture of its own (a skid, a panel) */
  S.block = o => {
    const w = o.w || 100,
      h = o.h || 50;
    return { box: [-w / 2 - 1, -h / 2 - 1, w / 2 + 1, h / 2 + 1], ports: ports4(w, h), svg: rrect(w, h, 6) };
  };
  window.HXSYM = S;
})();
