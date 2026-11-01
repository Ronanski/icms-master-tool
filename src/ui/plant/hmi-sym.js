/* HSYM: the shared symbol library of the HMI pages (3.2.0-beta.70, user 2026-10-30: "ipakita ang totoong laman ng bawat
   equipment with animations", "iwasan ung mga halatang pinagdugtong"). One look for every page; first used by MAKE-UP WATER.

   Drawing (strings, in a page's own coordinate space):
     const b = HSYM.scene('mu');                     // prefix for the gradient ids of this page
     b.pipe(points, { w, med, f });                  // one pipe: rounded elbows; all outlines are drawn under all bodies,
                                                     // so tees and elbows weld into one pipe (no seams, no gaps)
     b.tee(x, y, { w, med });                        // the weld dot of a branch
     b.add(HSYM.pump(x, y, id)) ...                  // equipment layer (over the pipes)
     b.txt(HSYM.vbox(x, y, tag, unit, key))          // text layer (over everything)
     g.innerHTML = b.svg(); g.setAttribute('transform', HSYM.fit(1280, 770));  // frame 1280 x 860, area 1280 x 770 (HSYM.tabs if big)
   Symbols: pump (casing cutaway + impeller, coupling, motor with cooling fan, status ring), valve (man / mov / xv / cv with a
   position bar), check (swing flapper), gauge (dial + needle), strainer (Y type), orifice, tank (shell, water, wave, inflow
   stream, level marks), vbox (tag + value + unit), dest (end card of a line), legend.

   Live (after the svg is in the page):
     const A = HSYM.live(rootEl);
     A.pump(id, 'RUN' | 'STOP' | 'TRIP' | null)      // ring + state text colour, impeller and fan speed (spin-up 3 s, coast 6 s)
     A.flow(key, q)                                   // q = flow (any unit, sign = direction): dash speed, 0 = still pipe
     A.valve(id, pos 0..1 | null)                     // travels to pos; amber blink while moving, red open, green closed
     A.check(id, open 0..1), A.gauge(id, v, max), A.tank(id, level, max, inflow)
   The loop runs only while the page is in the document and visible, and freezes while the simulation is paused. */
(function () {
  const C = {
    edge: '#090d11',
    run: '#e5484d',
    stop: '#2fa56a',
    amber: '#f2a531',
    none: '#6b7480',
    nm: '#dce4eb',
    dim: '#8a99a8',
    tag: '#a9b8c6',
    val: '#eaf6ff',
    box: '#05090d',
    boxs: '#2f3d4a',
    steel: ['#3b4651', '#8794a1', '#5e6d7b'],
    /* media: body, flow dots */
    med: {
      d: ['#2f8fc0', '#a8e4ff'] /* demineralized water */,
      r: ['#3f86a8', '#c8ecff'] /* recirculation */,
      c: ['#4a77b8', '#cfe0ff'] /* closed cooling water */,
      l: ['#c99a3c', '#ffe2a0'] /* lube oil */,
      dr: ['#8a6a30', '#e6c88c'] /* oil drain (gravity return) */,
      co: ['#d0773b', '#ffc79a'] /* control oil (high pressure) */,
      to: ['#c25f98', '#ffc4e4'] /* trip oil */,
      st: ['#8c98a5', '#f2f6fa'] /* steam / vapour */,
      air: ['#5f87a8', '#d6ecff'] /* cold air (primary / secondary / fluidizing) */,
      ha: ['#b07a3c', '#ffd9a0'] /* hot air (after the air preheater) */,
      fg: ['#77706a', '#e2dad2'] /* flue gas */,
      off: ['#33414e', null]
    }
  };
  const UF = "font-family:Barlow,'IBM Plex Sans','Segoe UI',Roboto,Arial,sans-serif",
    MF = "font-family:'Roboto Mono','JetBrains Mono',Consolas,monospace";
  const T = (x, y, s, c, a) => `<text x="${x}" y="${y}" class="${c}"${a ? ' ' + a : ''}>${s}</text>`;
  const OL = `stroke="${C.edge}" stroke-width="1.4"`;

  function rpath(p, r) {
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
  }

  /* ---------- scene builder ---------- */
  function scene(px) {
    const L = { edge: [], body: [], hi: [], flow: [], oedge: [], obody: [], ohi: [], oflow: [], eq: [], txt: [] };
    const b = {
      px,
      /* p = points, o.w = body width, o.med = a key of C.med, o.f = flow key ('' = never flows); o.over = a bridge: drawn whole
         over the other pipes (its own outline shows the crossing), for the few lines that must cross another one */
      pipe(p, o) {
        const w = o.w || 9,
          med = C.med[o.med || 'd'],
          d = rpath(p, Math.max(10, w * 1.8)),
          f = o.f || '',
          Lp = o.over ? { edge: L.oedge, body: L.obody, hi: L.ohi, flow: L.oflow } : L;
        Lp.edge.push(`<path d="${d}" fill="none" stroke="${C.edge}" stroke-width="${w + 5}"/>`);
        Lp.body.push(
          `<path d="${d}" fill="none" stroke="${med[0]}" stroke-width="${w}"${f ? ` data-pb="${f}"` : ''} opacity="${f ? 0.5 : 0.35}"/>`
        );
        Lp.hi.push(
          `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.13" stroke-width="${Math.max(1, w * 0.25)}" transform="translate(0 ${(-w * 0.2).toFixed(1)})"/>`
        );
        if (f)
          Lp.flow.push(
            `<path d="${d}" fill="none" data-pf="${f}" stroke="${med[1]}" stroke-width="${w > 10 ? 3.2 : w > 6 ? 2.6 : 2}" stroke-linecap="round" stroke-dasharray="1 ${w > 6 ? 15 : 11}" visibility="hidden"/>`
          );
        return b;
      },
      tee(x, y, o = {}) {
        const w = o.w || 9,
          med = C.med[o.med || 'd'];
        L.edge.push(`<circle cx="${x}" cy="${y}" r="${(w + 5) / 2 + 0.5}" fill="${C.edge}"/>`);
        L.body.push(
          `<circle cx="${x}" cy="${y}" r="${w / 2}" fill="${med[0]}"${o.f ? ` data-pb="${o.f}"` : ''} opacity="${o.f ? 0.5 : 0.35}"/>`
        );
        return b;
      },
      add(s) {
        L.eq.push(s);
        return b;
      },
      txt(s) {
        L.txt.push(s);
        return b;
      },
      svg() {
        return (
          css() +
          defs(px) +
          ['edge', 'body', 'hi', 'flow', 'oedge', 'obody', 'ohi', 'oflow', 'eq', 'txt'].map(k => L[k].join('')).join('')
        );
      }
    };
    return b;
  }
  const defs = px => `<defs>
<linearGradient id="${px}-sh" x1="0" x2="1"><stop offset="0" stop-color="#36414c"/><stop offset=".45" stop-color="#6e7c8a"/><stop offset="1" stop-color="#2a333c"/></linearGradient>
<linearGradient id="${px}-mt" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${C.steel[2]}"/><stop offset=".5" stop-color="${C.steel[1]}"/><stop offset="1" stop-color="${C.steel[0]}"/></linearGradient>
<linearGradient id="${px}-cs" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7d8a97"/><stop offset="1" stop-color="#3a4550"/></linearGradient>
<linearGradient id="${px}-wt" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3fa6d8"/><stop offset="1" stop-color="#1a5f86"/></linearGradient>
<linearGradient id="${px}-wc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5b8fd6"/><stop offset="1" stop-color="#22457a"/></linearGradient>
<linearGradient id="${px}-ol" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#b98523"/><stop offset="1" stop-color="#5a3d0e"/></linearGradient>
<linearGradient id="${px}-sf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6f7c89"/><stop offset=".4" stop-color="#e6ecf1"/><stop offset="1" stop-color="#4b5662"/></linearGradient>
<linearGradient id="${px}-bb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#cdb980"/><stop offset="1" stop-color="#7d6c3e"/></linearGradient>
<linearGradient id="${px}-cu" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e8a86c"/><stop offset="1" stop-color="#8a4f22"/></linearGradient>
<linearGradient id="${px}-bl" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#f1f4f7"/><stop offset=".6" stop-color="#aab6c2"/><stop offset="1" stop-color="#6a7682"/></linearGradient>
<linearGradient id="${px}-vn" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#8e9aa6"/><stop offset="1" stop-color="#4f5a66"/></linearGradient></defs>`;
  const css = () =>
    `<style>.hs-zone{font-size:14px;font-weight:600;letter-spacing:.14em;fill:#6f8091;${UF}}.hs-eq{font-size:18px;font-weight:700;letter-spacing:.03em;fill:${C.nm};${UF}}.hs-sub{font-size:13px;fill:${C.dim};${UF}}.hs-tag{font-size:13px;fill:${C.tag};${MF}}.hs-st{font-size:13px;font-weight:700;letter-spacing:.1em;${UF}}.hs-val{font-size:22px;font-weight:600;${MF}}.hs-unit{font-size:12px;fill:${C.dim};${MF}}.hs-hit{cursor:pointer}.hs-hit:hover .hs-hl{stroke:#5fb3e6;stroke-width:2.5}.hs-tab{cursor:pointer}.hs-tab:hover rect{fill:#2a3a48}</style>`;

  /* ---------- symbols (each returns svg text) ---------- */
  /* end-suction pump: casing cutaway with impeller in the line, coupling, motor above with its cooling fan; ring = run state */
  function pump(x, y, id, px) {
    let imp = '';
    for (let k = 0; k < 6; k++)
      imp += `<path d="M${x} ${y} q8 -6 6 -20" fill="none" stroke="#9fd9f5" stroke-width="3" stroke-linecap="round" transform="rotate(${k * 60} ${x} ${y})"/>`;
    let fins = '';
    for (let k = 0; k < 6; k++)
      fins += `<line x1="${x - 26 + k * 10}" x2="${x - 26 + k * 10}" y1="${y - 92}" y2="${y - 56}" stroke="#3b4651" stroke-width="1.5"/>`;
    let fan = '';
    for (let k = 0; k < 3; k++)
      fan += `<path d="M${x + 44} ${y - 74} l2 -10 l4 2 z" fill="#aab6c1" transform="rotate(${k * 120} ${x + 44} ${y - 74})"/>`;
    return (
      `<g class="hs-hit" data-hit="${id}"><rect x="${x - 62}" y="${y + 30}" width="124" height="8" rx="2" fill="#2a333c" ${OL}/>` +
      `<circle cx="${x}" cy="${y}" r="37" fill="none" stroke="${C.none}" stroke-width="4" class="hs-hl" data-ring="${id}"/>` +
      `<circle cx="${x}" cy="${y}" r="31" fill="url(#${px}-cs)" ${OL}/><circle cx="${x}" cy="${y}" r="23" fill="#0b2433"/>` +
      `<g data-imp="${id}" data-cx="${x}" data-cy="${y}">${imp}<circle cx="${x}" cy="${y}" r="5" fill="#cfd8e0"/></g>` +
      `<rect x="${x - 4}" y="${y - 52}" width="8" height="20" fill="#7b8894" ${OL}/>` +
      `<rect x="${x - 34}" y="${y - 96}" width="68" height="44" rx="5" fill="url(#${px}-mt)" ${OL}/>${fins}` +
      `<circle cx="${x + 44}" cy="${y - 74}" r="12" fill="#1c252e" ${OL}/><g data-fan="${id}" data-cx="${x + 44}" data-cy="${y - 74}">${fan}</g></g>`
    );
  }
  /* valve; kind: man (field, handwheel), mov (motor operated), xv (on-off, pneumatic), cv (control valve, globe + diaphragm).
     id = live key (DCS valves) or '' (manual: drawn open = red or closed = green as the line-up of the P&ID says) */
  function valve(x, y, o) {
    const k = o.kind || 'man',
      v = o.vert;
    const body = v
      ? `M${x - 8} ${y - 11} L${x} ${y} L${x + 8} ${y - 11} Z M${x - 8} ${y + 11} L${x} ${y} L${x + 8} ${y + 11} Z`
      : `M${x - 11} ${y - 8} L${x} ${y} L${x - 11} ${y + 8} Z M${x + 11} ${y - 8} L${x} ${y} L${x + 11} ${y + 8} Z`;
    const fill = o.id ? C.none : o.open ? C.run : C.stop;
    let a = '';
    if (k === 'man')
      a = `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 15}" stroke="#9aa7b3" stroke-width="1.5"/><ellipse cx="${x}" cy="${y - 16}" rx="7" ry="2.5" fill="none" stroke="#9aa7b3" stroke-width="1.5"/>`;
    else if (k === 'mov')
      a = `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 12}" stroke="#9aa7b3" stroke-width="2"/><rect x="${x - 10}" y="${y - 30}" width="20" height="18" rx="2" fill="url(#${o.px}-mt)" ${OL}/>${T(x, y - 17, 'M', 'hs-st', 'text-anchor="middle" fill="#0b1117"')}`;
    else
      a = `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 14}" stroke="#9aa7b3" stroke-width="2"/><path d="M${x - 13} ${y - 14} A13 11 0 0 1 ${x + 13} ${y - 14} Z" fill="url(#${o.px}-mt)" ${OL}/>${k === 'cv' ? `<circle cx="${x}" cy="${y}" r="4" fill="${C.edge}"/>` : ''}`;
    const bar = o.id
      ? `<rect x="${x - 14}" y="${y + 13}" width="28" height="4" rx="1" fill="${C.box}" stroke="${C.boxs}" stroke-width=".8"/><rect x="${x - 14}" y="${y + 13}" width="0" height="4" rx="1" fill="#a8e4ff" data-vp="${o.id}"/>`
      : '';
    const la = o.la || 'dn',
      lab = !o.lab
        ? ''
        : la === 'up'
          ? T(x, y - (k === 'man' ? 26 : 38), o.lab, 'hs-tag', 'text-anchor="middle"')
          : la === 'r'
            ? T(x + 18, y + 5, o.lab, 'hs-tag')
            : la === 'l'
              ? T(x - 18, y + 5, o.lab, 'hs-tag', 'text-anchor="end"')
              : T(x, y + (o.id ? 36 : 30), o.lab, 'hs-tag', 'text-anchor="middle"');
    return `<g${o.id ? ` class="hs-hit" data-hit="${o.hit || o.id}"` : ''}><title>${o.title || o.lab || ''}</title><path d="${body}" fill="${fill}" stroke="${C.edge}" stroke-width="1.5" stroke-linejoin="round" class="hs-hl"${o.id ? ` data-vb="${o.id}"` : ''}/>${a}${bar}${lab}</g>`;
  }
  /* swing check valve (flow left to right); the flapper opens with the flow */
  const check = (x, y, id, lab) =>
    `<g><title>${lab || ''} · check valve</title><circle cx="${x}" cy="${y}" r="11" fill="#1b252f" ${OL}/><line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}" stroke="#cfd8e0" stroke-width="2.5" stroke-linecap="round" data-ck="${id}" data-cx="${x}" data-cy="${y - 9}"/><path d="M${x - 6} ${y - 16} h12 l-3 -3 m3 3 l-3 3" fill="none" stroke="#6f8091" stroke-width="1.2"/>${lab ? T(x, y + 26, lab, 'hs-tag', 'text-anchor="middle"') : ''}</g>`;
  /* dial gauge on a stem above the line (r = dial radius); needle = live value */
  function gauge(x, y, id, tag, r = 13, stem = 20) {
    const cy = y - stem - r + 1;
    let t = '';
    for (let k = 0; k <= 8; k++) {
      const a = ((-120 + k * 30) * Math.PI) / 180;
      t += `<line x1="${(x + Math.sin(a) * r * 0.7).toFixed(1)}" y1="${(cy - Math.cos(a) * r * 0.7).toFixed(1)}" x2="${(x + Math.sin(a) * r * 0.9).toFixed(1)}" y2="${(cy - Math.cos(a) * r * 0.9).toFixed(1)}" stroke="#26323e" stroke-width="1"/>`;
    }
    return `<g><title>${tag}</title><line x1="${x}" y1="${y}" x2="${x}" y2="${y - stem}" stroke="#9aa7b3" stroke-width="2"/><circle cx="${x}" cy="${cy}" r="${r}" fill="#e9eef2" ${OL}/>${t}<line x1="${x}" y1="${cy}" x2="${x}" y2="${cy - r * 0.78}" stroke="${C.run}" stroke-width="1.8" stroke-linecap="round" transform="rotate(-120 ${x} ${cy})" data-gn="${id}" data-cx="${x}" data-cy="${cy}"/>${tag ? T(x, cy - r - 6, tag, 'hs-tag', 'text-anchor="middle"') : ''}</g>`;
  }
  const strainer = (x, y, lab, px) =>
    `<g><title>${lab} · Y-strainer</title><rect x="${x - 18}" y="${y - 9}" width="36" height="18" rx="3" fill="url(#${px}-cs)" ${OL}/><path d="M${x - 6} ${y + 8} l14 20 h10 l-12 -20 z" fill="url(#${px}-cs)" ${OL}/>${T(x, y + 46, lab, 'hs-tag', 'text-anchor="middle"')}</g>`;
  const orifice = (x, y) =>
    `<g><title>RO · restriction orifice (minimum flow)</title><rect x="${x - 2}" y="${y - 11}" width="4" height="22" fill="#cfd8e0" ${OL}/>${T(x, y - 15, 'RO', 'hs-tag', 'text-anchor="middle"')}</g>`;
  /* vertical tank: shell, water (live), wave, inflow stream from (sx, sy), level marks [[m, label, colour]] */
  function tank(x, y, w, h, id, o) {
    const cid = `${o.px}-tk${id}`,
      max = o.max;
    const yOf = m => y + h - 6 - ((h - 12) * m) / max;
    let wd = `M${x - 60} 0`;
    for (let i = 0; i <= Math.ceil((w + 120) / 30); i++) wd += ' q7.5 -4 15 0 q7.5 4 15 0';
    wd += ` V12 H${x - 60} Z`;
    const marks = (o.marks || [])
      .map(
        ([m, lab, col]) =>
          `<line x1="${x + w - 22}" x2="${x + w - 4}" y1="${yOf(m).toFixed(1)}" y2="${yOf(m).toFixed(1)}" stroke="${col}" stroke-width="2"/>${lab ? (o.markIn ? T(x + w - 26, (yOf(m) + 4).toFixed(1), lab, 'hs-tag', `fill="${col}" text-anchor="end"`) : T(x + w + 6, (yOf(m) + 4).toFixed(1), lab, 'hs-tag', `fill="${col}"`)) : ''}`
      )
      .join('');
    return (
      `<g class="hs-hit" data-hit="${o.hit || 'TK' + id}"><clipPath id="${cid}"><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="10"/></clipPath>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="url(#${o.px}-sh)" stroke="${C.edge}" stroke-width="2" class="hs-hl"/>` +
      `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="10" fill="#0a1219"/>` +
      `<g clip-path="url(#${cid})"><rect x="${x + 4}" y="${y + h}" width="${w - 8}" height="0" fill="url(#${o.px}-${o.water || 'wt'})" data-tl="${id}" data-y="${y}" data-h="${h}" data-max="${max}"/>` +
      `<path d="${wd}" fill="${o.water === 'ol' ? '#e7b75a' : '#5ec1ee'}" opacity=".5" data-tw="${id}" visibility="hidden"/>` +
      `<line x1="${o.sx || x + w / 2}" y1="${o.sy || y + 2}" x2="${o.sx || x + w / 2}" y2="${y + h}" stroke="${o.water === 'ol' ? '#ffe2a0' : '#a8e4ff'}" stroke-width="3" stroke-dasharray="6 8" stroke-linecap="round" data-ts="${id}" visibility="hidden"/></g>${marks}</g>`
    );
  }
  /* tag over a dark value box, unit after; key = data-v of the value text, click key = data-vbx */
  const vbox = (x, y, tag, unit, key, w = 84) =>
    `<g class="hs-hit" data-vbx="${key || tag}">${T(x, y - 5, tag, 'hs-tag')}<rect x="${x}" y="${y}" width="${w}" height="29" rx="2" fill="${C.box}" stroke="${C.boxs}"/>${T(x + w - 6, y + 22, '-----', 'hs-val', `text-anchor="end" fill="${C.none}" data-v="${key || tag}"`)}${T(x + w + 5, y + 21, unit, 'hs-unit')}</g>`;
  /* end of a line: arrow card (title, sub) pointing in from the left */
  const dest = (x, y, w, title, sub) =>
    `<g><path d="M${x} ${y - 26} h${w} a4 4 0 0 1 4 4 v44 a4 4 0 0 1 -4 4 h-${w} l-12 -26 z" fill="#1b252f" stroke="#33424f"/>${T(x + 12, y - 4, title, 'hs-eq', 'style="font-size:15px"')}${sub ? T(x + 12, y + 15, sub, 'hs-sub') : ''}</g>`;
  /* a value with a plain description (user 2026-10-31: no acronyms as labels): description above the box, the tag (small) and the unit
     at its right; key = data-v of the value, click key = data-vbx */
  const vb = (x, y, desc, tag, unit, key, w = 70) =>
    `<g class="hs-hit" data-vbx="${key}">${T(x, y - 6, desc, 'hs-sub', 'fill="#c3ced8"')}<rect x="${x}" y="${y}" width="${w}" height="29" rx="2" fill="${C.box}" stroke="${C.boxs}"/>${T(x + w - 6, y + 22, '-----', 'hs-val', `text-anchor="end" fill="${C.none}" data-v="${key}"`)}${T(x + w + 5, y + 11, tag, 'hs-tag', 'style="font-size:10.5px"')}${T(x + w + 5, y + 26, unit, 'hs-unit')}</g>`;
  /* a small motor box with fins and a run ring (drives, actuators); A.pump(id, ...) colours the ring */
  const motor = (x, y, id, px, o = {}) => {
    const w = o.w || 60,
      h = o.h || 40;
    return `<g class="hs-hit" data-hit="${id}"><rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="7" fill="none" stroke="${C.none}" stroke-width="4" data-ring="${id}" class="hs-hl"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="url(#${px}-mt)" ${OL}/>${[0, 1, 2, 3, 4].map(k => `<line x1="${x + 6 + k * ((w - 12) / 4)}" x2="${x + 6 + k * ((w - 12) / 4)}" y1="${y + 5}" y2="${y + h - 5}" stroke="#3b4651" stroke-width="1.5"/>`).join('')}${T(x + w / 2, y + h / 2 + 5, o.lab || 'M', 'hs-st', 'fill="#0c1014" text-anchor="middle"')}</g>`;
  };
  /* #59 (user 2026-10-31): the one button beside an equipment that opens its second faceplate (permissive, monitoring, trend);
     small and quiet (leader review, clean layout): "PERMISSIVE" + the Y / N square, Y = red = every permissive complete, N = green =
     not complete (A.eqb(id, ok) sets it) */
  const eqb = (x, y, id) =>
    `<g data-eqb="${id}" class="hs-hit" role="button" aria-label="Permissive, trend and monitoring"><title>Permissive, trend and monitoring</title><rect x="${x}" y="${y}" width="112" height="22" rx="3" fill="#161e26" stroke="#3a4b5a" data-eqbr="${id}"/>${T(x + 8, y + 15, 'PERMISSIVE', 'hs-st', 'fill="#b8c4cf" style="font-size:10px;letter-spacing:.04em"')}<rect x="${x + 92}" y="${y + 4}" width="14" height="14" rx="2" fill="${C.none}" data-eqbk="${id}"/>${T(x + 99, y + 15.5, '-', 'hs-st', 'fill="#04150c" text-anchor="middle" style="font-size:11px" data-eqbt="' + id + '"')}</g>`;
  /* clean layout (leader review 2026-10-31): a value with its description and unit, the tag only on hover (and in the faceplate);
     vb2 = an A / B pair as one two-cell block */
  const vbc = (x, y, desc, tag, unit, key, w = 76) =>
    `<g class="hs-hit" data-vbx="${key}"><title>${tag}</title>${T(x, y - 6, desc, 'hs-sub', 'fill="#c3ced8"')}<rect x="${x}" y="${y}" width="${w}" height="28" rx="2" fill="${C.box}" stroke="${C.boxs}"/>${T(x + w - 6, y + 21, '-----', 'hs-val', `text-anchor="end" fill="${C.none}" data-v="${key}" style="font-size:20px"`)}${T(x + w + 5, y + 21, unit, 'hs-unit')}</g>`;
  const vb2 = (x, y, desc, tags, unit, keys, w = 56) =>
    `<g class="hs-hit" data-vbx="${keys[0]}"><title>${tags.join(' / ')}</title>${T(x, y - 6, desc, 'hs-sub', 'fill="#c3ced8"')}${[0, 1].map(i => `<rect x="${x + i * (w + 3)}" y="${y}" width="${w}" height="28" rx="2" fill="${C.box}" stroke="${C.boxs}"/>${T(x + i * (w + 3) + w - 5, y + 21, '-----', 'hs-val', `text-anchor="end" fill="${C.none}" data-v="${keys[i]}" style="font-size:20px"`)}`).join('')}${T(x + 2 * w + 8, y + 21, unit, 'hs-unit')}</g>`;
  /* a flow arrow on a duct (direction instead of a sentence): dir r / l / u / d */
  const arrow = (x, y, dir, c = '#dce4eb') =>
    `<path d="M${x - 7} ${y - 6} L${x + 5} ${y} L${x - 7} ${y + 6} Z" fill="${c}" opacity=".85" transform="rotate(${{ r: 0, d: 90, l: 180, u: 270 }[dir] || 0} ${x} ${y})"/>`;
  const legend = (x, y, items) =>
    items
      .map(
        ([m, lab], i) =>
          `<rect x="${x + i * 250}" y="${y - 7}" width="24" height="8" rx="2" fill="${C.med[m][0]}"/>${T(x + i * 250 + 30, y + 2, lab, 'hs-sub')}`
      )
      .join('');

  /* vertical submerged pump on a tank roof (y = roof): motor on top (ring = run state), discharge head with the nozzle on the right
     at y - 34 (a pipe starts at x + 36), column through the roof, bowl with the impeller at y + depth (cutaway) */
  function vpump(x, y, id, px, depth = 110) {
    const by = y + depth - 18;
    let imp = '';
    for (let k = 0; k < 5; k++)
      imp += `<path d="M${x} ${by} q6 -4 5 -13" fill="none" stroke="#ffe2a0" stroke-width="2.6" stroke-linecap="round" transform="rotate(${k * 72} ${x} ${by})"/>`;
    let fins = '';
    for (let k = 0; k < 6; k++)
      fins += `<line x1="${x - 25 + k * 10}" x2="${x - 25 + k * 10}" y1="${y - 128}" y2="${y - 74}" stroke="#3b4651" stroke-width="1.5"/>`;
    return (
      `<g class="hs-hit" data-hit="${id}"><rect x="${x - 36}" y="${y - 138}" width="72" height="70" rx="6" fill="none" stroke="${C.none}" stroke-width="4" class="hs-hl" data-ring="${id}"/>` +
      `<rect x="${x - 31}" y="${y - 133}" width="62" height="60" rx="5" fill="url(#${px}-mt)" ${OL}/>${fins}` +
      `<rect x="${x - 22}" y="${y - 66}" width="44" height="60" rx="3" fill="url(#${px}-cs)" ${OL}/><rect x="${x + 22}" y="${y - 42}" width="14" height="16" fill="url(#${px}-cs)" ${OL}/>` +
      `<rect x="${x - 36}" y="${y - 7}" width="72" height="7" fill="#2a333c" ${OL}/>` +
      `<rect x="${x - 7}" y="${y}" width="14" height="${depth - 36}" fill="url(#${px}-cs)" ${OL}/>` +
      `<path d="M${x - 20} ${by - 18} h40 v24 l8 12 h-56 l8 -12 z" fill="url(#${px}-cs)" ${OL}/><circle cx="${x}" cy="${by}" r="15" fill="#1d150a"/>` +
      `<g data-imp="${id}" data-cx="${x}" data-cy="${by}">${imp}<circle cx="${x}" cy="${by}" r="3.5" fill="#cfd8e0"/></g></g>`
    );
  }
  /* small centrifugal blower (vapour extractor): scroll casing, impeller, outlet up; motor on the right */
  function blower(x, y, id, px) {
    let imp = '';
    for (let k = 0; k < 8; k++)
      imp += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 12}" stroke="#cfd8e0" stroke-width="2.2" transform="rotate(${k * 45} ${x} ${y})"/>`;
    return (
      `<g class="hs-hit" data-hit="${id}"><circle cx="${x}" cy="${y}" r="24" fill="none" stroke="${C.none}" stroke-width="4" class="hs-hl" data-ring="${id}"/>` +
      `<rect x="${x + 6}" y="${y - 30}" width="14" height="14" fill="url(#${px}-cs)" ${OL}/><circle cx="${x}" cy="${y}" r="19" fill="url(#${px}-cs)" ${OL}/><circle cx="${x}" cy="${y}" r="14" fill="#141b22"/>` +
      `<g data-imp="${id}" data-cx="${x}" data-cy="${y}">${imp}</g><rect x="${x + 26}" y="${y - 11}" width="30" height="22" rx="3" fill="url(#${px}-mt)" ${OL}/></g>`
    );
  }
  /* shell and tube heat exchanger, horizontal (y = centre line): channel heads at both ends, tubes (tube medium, live key id + 't'),
     baffles and the shell side path (shell medium, live key id + 's'). Pipes connect at the ends (x, y) / (x + w, y) or on the shell */
  function hx(x, y, w, h, id, o) {
    const tm = C.med[o.tube || 'c'],
      sm = C.med[o.shell || 'l'],
      t = y - h / 2,
      n = 5;
    let tubes = '',
      tfl = '',
      baf = '',
      zz = `M${x + 22} ${y}`;
    for (let i = 0; i < n; i++) {
      const ty = (t + 9 + (i * (h - 18)) / (n - 1)).toFixed(1);
      tubes += `<line x1="${x + 16}" x2="${x + w - 16}" y1="${ty}" y2="${ty}" stroke="${tm[0]}" stroke-width="2.6"/>`;
      tfl += `<line x1="${x + 16}" x2="${x + w - 16}" y1="${ty}" y2="${ty}" stroke="${tm[1]}" stroke-width="1.8" stroke-dasharray="1 9" stroke-linecap="round" data-pf="${id}t" visibility="hidden"/>`;
    }
    const nb = 4;
    for (let k = 1; k <= nb; k++) {
      const bx = x + 16 + (k * (w - 32)) / (nb + 1),
        up = k % 2;
      baf += `<rect x="${(bx - 1.5).toFixed(1)}" y="${up ? t + 3 : y - h / 2 + h * 0.3}" width="3" height="${(h * 0.7 - 3).toFixed(1)}" fill="#6f7c89"/>`;
      zz += ` L${(bx - 8).toFixed(1)} ${up ? y + h * 0.36 : t + h * 0.14} L${(bx + 8).toFixed(1)} ${up ? y + h * 0.36 : t + h * 0.14}`;
    }
    zz += ` L${x + w - 22} ${y}`;
    return (
      `<g class="hs-hit" data-hit="${o.hit || 'HX' + id}"><title>${o.title || ''}</title>` +
      `<rect x="${x + 12}" y="${t}" width="${w - 24}" height="${h}" rx="${h / 2.6}" fill="#191109" stroke="${C.edge}" stroke-width="2" class="hs-hl"/>` +
      `<rect x="${x + 14}" y="${t + 2}" width="${w - 28}" height="${h - 4}" rx="${h / 2.8}" fill="url(#${o.px}-ol)" opacity=".55"/>` +
      `${tubes}${baf}<path d="${zz}" fill="none" stroke="${sm[1]}" stroke-width="2" stroke-dasharray="1 10" stroke-linecap="round" data-pf="${id}s" visibility="hidden"/>${tfl}` +
      `<rect x="${x}" y="${t - 3}" width="16" height="${h + 6}" rx="5" fill="url(#${o.px}-cs)" ${OL}/><rect x="${x + w - 16}" y="${t - 3}" width="16" height="${h + 6}" rx="5" fill="url(#${o.px}-cs)" ${OL}/></g>`
    );
  }
  /* cartridge filter on a vertical line (x, y = centre): vessel, lid, pleated element */
  function filter(x, y, id, px, title) {
    let pl = '';
    for (let k = 0; k < 6; k++)
      pl += `<line x1="${x - 10 + k * 4}" x2="${x - 10 + k * 4}" y1="${y - 16}" y2="${y + 20}" stroke="#c3ccd6" stroke-width="1.4"/>`;
    return `<g class="hs-hit" data-hit="${id}"><title>${title || ''}</title><rect x="${x - 17}" y="${y - 30}" width="34" height="62" rx="7" fill="url(#${px}-cs)" stroke="${C.edge}" stroke-width="1.6" class="hs-hl"/><rect x="${x - 21}" y="${y - 34}" width="42" height="8" rx="2" fill="url(#${px}-mt)" ${OL}/><rect x="${x - 12}" y="${y - 20}" width="24" height="44" rx="3" fill="#141b22"/>${pl}</g>`;
  }
  /* status lamp of a switch: dot + tag, the state text under it (live: data-lp / data-lt, see the page) */
  const lamp = (x, y, key, tag) =>
    `<g data-lpg="${key}"><circle cx="${x}" cy="${y}" r="7" fill="${C.none}" ${OL} data-lp="${key}"/>${T(x + 14, y + 5, tag, 'hs-tag')}${T(x + 14, y + 23, '-----', 'hs-st', `fill="${C.none}" data-lt="${key}"`)}</g>`;

  /* the page frame of the standard (user 2026-10-30 "malabo / maliit"): 1280 x 860, so a PC with the dock open (~910 px for the
     page) shows it at ~0.71 x (text 13 ~ 18 -> 9 ~ 13 px, values 22 -> ~16 px). The drawing area is under the frame bars of hmi2.js
     (title 34 + alarm 20) and above the page tabs (H - 32): 1280 x 770, drawn 1:1 (fit(1280, 770) = translate(0 56)) */
  const FRAME = { w: 1280, h: 860 };
  const AREA = { x: 0, y: 56, w: 1280, h: 770 };
  function fit(w, h) {
    const k = Math.min(AREA.w / w, AREA.h / h);
    return `translate(${((AREA.w - w * k) / 2).toFixed(1)} ${(AREA.y + (AREA.h - h * k) / 2).toFixed(1)}) scale(${k.toFixed(4)})`;
  }

  /* tabs inside a page (a system too big for one 1280 x 770 area): a bar at the top of the area, one <g> per tab. The open tab
     is kept per page while the app runs. Returns the tab groups; draw tab i's art in tabs[i] (its own space starts at y 44) */
  const TABSEL = {};
  function tabs(root, page, names) {
    const NS = 'http://www.w3.org/2000/svg';
    const bar = document.createElementNS(NS, 'g'),
      gs = names.map(() => document.createElementNS(NS, 'g'));
    let x = 8;
    const btns = names.map((n, i) => {
      const w = n.length * 9.6 + 34,
        b = document.createElementNS(NS, 'g');
      b.setAttribute('class', 'hs-tab');
      b.innerHTML = `<rect x="${x}" y="6" width="${w}" height="30" rx="4" stroke="#33424f"/>${T(x + w / 2, 26, n, 'hs-st', 'text-anchor="middle" style="font-size:14px"')}`;
      b.addEventListener('click', e => (e.stopPropagation(), show(i)));
      x += w + 6;
      bar.append(b);
      return b;
    });
    function show(i) {
      TABSEL[page] = i;
      gs.forEach((g, j) => g.setAttribute('display', j === i ? 'inline' : 'none'));
      btns.forEach((b, j) => {
        b.firstChild.setAttribute('fill', j === i ? '#3d6f93' : '#1b252f');
        b.lastChild.setAttribute('fill', j === i ? '#ffffff' : C.dim);
      });
    }
    gs.forEach(g => root.append(g));
    root.append(bar);
    show(TABSEL[page] || 0);
    gs.show = show;
    return gs;
  }

  /* ---------- live ---------- */
  /* simulation running (same test as the Training dock): analog RUN and not VIEW, or the digital SIM not paused */
  function simRunning() {
    try {
      const A = window.AN;
      if (!A) return true;
      if (A.cat === 'an') return !!(A.run && !A.view);
      return typeof SIM !== 'undefined' && !!SIM && !(typeof DPAUSE !== 'undefined' && DPAUSE);
    } catch (e) {
      return true;
    }
  }
  function live(root) {
    const q = s => root.querySelector(s),
      qa = s => Array.from(root.querySelectorAll(s));
    const P = {},
      F = {},
      V = {},
      CK = {},
      G = {},
      TK = {},
      EACH = [];
    const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const A = {
      pump(id, s) {
        const p = (P[id] = P[id] || {
          spd: 0,
          ang: 0,
          imp: q(`[data-imp="${id}"]`),
          fan: q(`[data-fan="${id}"]`),
          ring: q(`[data-ring="${id}"]`),
          st: qa(`[data-st="${id}"]`)
        });
        p.s = s;
        p.on = s === 'RUN';
        if (reduce || p.first === undefined) p.spd = p.on ? 1 : 0;
        p.first = 1;
        paintPump(p);
      },
      flow(key, qv) {
        const f = (F[key] = F[key] || { off: 0, el: qa(`[data-pf="${key}"]`), b: qa(`[data-pb="${key}"]`) });
        f.q = isFinite(qv) ? qv : 0;
        const on = Math.abs(f.q) > 0.05;
        if (on !== f.on) {
          f.on = on;
          f.el.forEach(e => e.setAttribute('visibility', on ? 'visible' : 'hidden'));
          f.b.forEach(e => e.setAttribute('opacity', on ? 1 : 0.5));
        }
      },
      valve(id, pos) {
        const v = (V[id] = V[id] || { pos: null, b: qa(`[data-vb="${id}"]`), bar: q(`[data-vp="${id}"]`) });
        v.cmd = pos == null || !isFinite(pos) ? null : Math.max(0, Math.min(1, pos));
        if (v.pos == null || reduce) v.pos = v.cmd;
        paintValve(v);
      },
      check(id, o) {
        CK[id] = CK[id] || { el: q(`[data-ck="${id}"]`), a: 0 };
        CK[id].t = Math.max(0, Math.min(1, o || 0));
      },
      gauge(id, v, max) {
        G[id] = G[id] || { el: q(`[data-gn="${id}"]`), a: -120 };
        G[id].t = -120 + 240 * Math.max(0, Math.min(1, (isFinite(v) ? v : 0) / max));
      },
      tank(id, lv, max, inflow) {
        const t = (TK[id] = TK[id] || {
          liq: q(`[data-tl="${id}"]`),
          wave: q(`[data-tw="${id}"]`),
          str: q(`[data-ts="${id}"]`),
          ph: 0,
          so: 0
        });
        t.lv = lv;
        t.inflow = inflow || 0;
        if (!t.liq) return;
        const y = +t.liq.dataset.y,
          h = +t.liq.dataset.h,
          mx = max || +t.liq.dataset.max,
          ok = lv != null && isFinite(lv),
          f = ok ? Math.max(0, Math.min(1, lv / mx)) : 0;
        t.yl = y + h - 6 - (h - 12) * f;
        t.liq.setAttribute('y', t.yl.toFixed(1));
        t.liq.setAttribute('height', Math.max(0, y + h - 4 - t.yl).toFixed(1));
        t.wave.setAttribute('visibility', ok && f > 0.01 ? 'visible' : 'hidden');
        t.wave.setAttribute('transform', `translate(${(-t.ph).toFixed(1)} ${(t.yl - 5).toFixed(1)})`);
        t.str.setAttribute('y2', t.yl.toFixed(1));
        t.str.setAttribute('visibility', t.inflow > 0.05 ? 'visible' : 'hidden');
      }
    };
    let blink = true;
    function paintPump(p) {
      const moving = p.spd > 0.001 && p.spd < 0.999 && !reduce;
      const col = p.s == null ? C.none : p.s === 'TRIP' ? (blink ? C.run : C.edge) : p.on ? C.run : C.stop;
      if (p.ring) p.ring.setAttribute('stroke', moving && !blink ? C.amber : col);
      const txt =
        p.s == null
          ? '-----'
          : p.s === 'TRIP'
            ? 'TRIP'
            : p.on
              ? moving
                ? 'STARTING'
                : 'RUNNING'
              : moving
                ? 'COASTING DOWN'
                : 'STOPPED';
      p.st.forEach(e => {
        e.textContent = txt;
        e.setAttribute('fill', moving ? C.amber : p.s === 'TRIP' ? C.run : col);
      });
    }
    function paintValve(v) {
      const moving = v.cmd != null && v.pos != null && Math.abs(v.cmd - v.pos) > 0.002;
      const col = v.pos == null ? C.none : moving ? (blink ? C.amber : '#5a4a2a') : v.pos > 0.01 ? C.run : C.stop;
      v.b.forEach(e => e.setAttribute('fill', col));
      if (v.bar) v.bar.setAttribute('width', (28 * (v.pos || 0)).toFixed(1));
    }
    let last = 0,
      bt = 0,
      seen = false,
      raf = 0;
    function frame(now) {
      if (!root.isConnected) {
        if (seen) return;
        raf = requestAnimationFrame(frame);
        return;
      }
      seen = true;
      const dt = Math.min(0.1, last ? (now - last) / 1000 : 0);
      last = now;
      if (document.hidden) {
        raf = requestAnimationFrame(frame);
        return;
      }
      bt += dt;
      if (bt > 0.5) ((bt = 0), (blink = !blink));
      const run = simRunning(),
        adt = run && !reduce ? dt : 0;
      for (const id in P) {
        const p = P[id];
        p.spd = Math.max(0, Math.min(1, p.spd + (p.on ? adt / 3 : -adt / 6)));
        p.ang = (p.ang + p.spd * 900 * adt) % 360;
        if (p.imp)
          p.imp.setAttribute('transform', `rotate(${p.ang.toFixed(1)} ${p.imp.dataset.cx} ${p.imp.dataset.cy})`);
        if (p.fan)
          p.fan.setAttribute('transform', `rotate(${p.ang.toFixed(1)} ${p.fan.dataset.cx} ${p.fan.dataset.cy})`);
        paintPump(p);
      }
      for (const k in F) {
        const f = F[k];
        if (!f.on || !adt) continue;
        f.off -= Math.sign(f.q) * Math.min(160, 16 + Math.abs(f.q) * 5) * adt;
        const s = f.off.toFixed(1);
        f.el.forEach(e => e.setAttribute('stroke-dashoffset', s));
      }
      for (const id in V) {
        const v = V[id];
        if (v.cmd != null && v.pos != null && run) {
          const d = v.cmd - v.pos,
            m = dt / (v.travel || 5);
          v.pos = Math.abs(d) <= m ? v.cmd : v.pos + Math.sign(d) * m;
        }
        paintValve(v);
      }
      for (const id in CK) {
        const c = CK[id];
        if (!c.el) continue;
        c.a += (c.t - c.a) * Math.min(1, (reduce ? 1 : adt * 3) || 0);
        c.el.setAttribute('transform', `rotate(${(-65 * c.a).toFixed(1)} ${c.el.dataset.cx} ${c.el.dataset.cy})`);
      }
      for (const id in G) {
        const g = G[id];
        if (!g.el) continue;
        g.a += (g.t - g.a) * Math.min(1, reduce ? 1 : dt * 3);
        g.el.setAttribute('transform', `rotate(${g.a.toFixed(1)} ${g.el.dataset.cx} ${g.el.dataset.cy})`);
      }
      for (const id in TK) {
        const t = TK[id];
        if (!t.liq || !adt) continue;
        t.ph = (t.ph + adt * (10 + t.inflow * 2)) % 30;
        t.wave.setAttribute('transform', `translate(${(-t.ph).toFixed(1)} ${(t.yl - 5).toFixed(1)})`);
        if (t.inflow > 0.05) t.str.setAttribute('stroke-dashoffset', (t.so -= adt * 60).toFixed(1));
      }
      for (const fn of EACH) fn(adt, dt);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    A.travel = (id, s) => (
      (V[id] = V[id] || { pos: null, b: qa(`[data-vb="${id}"]`), bar: q(`[data-vp="${id}"]`) }),
      (V[id].travel = s)
    );
    A.stop = () => cancelAnimationFrame(raf);
    /* a page's own motion (a turbine shaft, an actuator): fn(adt, dt) every frame; adt = 0 while the simulation is paused */
    A.each = fn => EACH.push(fn);
    /* a switch lamp: ok true = normal (green), false = alarm (red, blinking text), null = no value */
    A.lamp = (key, ok, tOk, tAl) => {
      const col = ok == null ? C.none : ok ? C.stop : C.run;
      qa(`[data-lp="${key}"]`).forEach(e => e.setAttribute('fill', col));
      qa(`[data-lt="${key}"]`).forEach(e => {
        e.textContent = ok == null ? '-----' : ok ? tOk || 'NORMAL' : tAl || 'ALARM';
        e.setAttribute('fill', col);
        e.classList.toggle('h2blink', ok === false);
      });
    };
    /* the #59 button: ok true = Y (red, every permissive complete), false = N (green), null = no logic */
    A.eqb = (id, ok) => {
      const col = ok == null ? C.none : ok ? C.run : C.stop;
      qa(`[data-eqbr="${id}"]`).forEach(e => e.setAttribute('stroke', col));
      qa(`[data-eqbk="${id}"]`).forEach(e => e.setAttribute('fill', col));
      qa(`[data-eqbt="${id}"]`).forEach(e => {
        e.textContent = ok == null ? '-' : ok ? 'Y' : 'N';
        e.setAttribute('fill', ok ? '#fff' : '#04150c');
      });
    };
    return A;
  }

  /* ---------- light pages (user 2026-11-01: light on a tablet, PENDING_HMI_BUILD rule 5) ---------- */
  /* one shared 15 Hz clock for everything that moves on the pages built from an approved mockup (pipe flows, rotor, fans): one
     small repaint 15 times a second instead of CSS / SMIL animations on the big drawing. fn(t seconds) returns false to leave */
  const TICKS = new Set();
  let tickIv = 0;
  function clock(fn) {
    TICKS.add(fn);
    if (!tickIv)
      tickIv = setInterval(() => {
        if (document.hidden) return;
        const t = performance.now() / 1000;
        for (const f of TICKS) if (f(t) === false) TICKS.delete(f);
        if (!TICKS.size) (clearInterval(tickIv), (tickIv = 0));
      }, 66);
  }
  /* an HTML layer over the plant svg that follows its pan and zoom (CSS transform only, the compositor moves it): the drawing of an
     approved mockup as it is (its own svg, HTML flue gas behind it, the flow overlay over it). anchor = a <g> of the page whose
     user space is the mockup space (w x h). Only the .hs-lay [data-hit] elements take the pointer; a wheel over them zooms the plant
     as anywhere else. Removed with the page */
  function layer(anchor, w, h) {
    const svg = anchor.ownerSVGElement,
      par = svg && svg.parentNode;
    if (!par) return null;
    const clip = document.createElement('div'),
      root = document.createElement('div');
    clip.className = 'hs-lay';
    clip.style.cssText = 'position:absolute;overflow:hidden;pointer-events:none;z-index:1;left:0;top:0;width:0;height:0';
    root.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;transform-origin:0 0`;
    clip.append(root);
    par.append(clip);
    if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
    const sync = () => {
      if (!anchor.isConnected) return gone();
      const m = anchor.getScreenCTM(),
        P = par.getBoundingClientRect(),
        R = svg.getBoundingClientRect();
      if (!m) return;
      Object.assign(clip.style, { left: R.left - P.left + par.scrollLeft + 'px', top: R.top - P.top + par.scrollTop + 'px', width: R.width + 'px', height: R.height + 'px' });
      root.style.transform = `matrix(${m.a},${m.b},${m.c},${m.d},${m.e - R.left},${m.f - R.top})`;
    };
    const mo = new MutationObserver(sync),
      ro = window.ResizeObserver ? new ResizeObserver(sync) : null;
    mo.observe(svg, { attributes: true, attributeFilter: ['viewBox'] });
    if (ro) ro.observe(svg);
    addEventListener('resize', sync);
    const iv = setInterval(() => anchor.isConnected || gone(), 1000);
    function gone() {
      mo.disconnect();
      if (ro) ro.disconnect();
      removeEventListener('resize', sync);
      clearInterval(iv);
      clip.remove();
    }
    clip.addEventListener('wheel', e => (e.preventDefault(), svg.dispatchEvent(new WheelEvent('wheel', e))), { passive: false });
    sync();
    requestAnimationFrame(sync);
    return { root, sync };
  }

  window.HSYM = {
    C,
    clock,
    layer,
    T,
    FRAME,
    AREA,
    fit,
    tabs,
    rpath,
    scene,
    pump,
    vpump,
    blower,
    hx,
    filter,
    lamp,
    valve,
    check,
    gauge,
    strainer,
    orifice,
    tank,
    vbox,
    vb,
    motor,
    eqb,
    vbc,
    vb2,
    arrow,
    dest,
    legend,
    live,
    simRunning
  };
})();
