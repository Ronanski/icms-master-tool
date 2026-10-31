/* 036 TURBINE OIL SYSTEM (roadmap step 6, PR-OPE-5002 "TURBINE CONTROL OIL": pre-start check, MAIN OIL PUMP & VAPOR EXTRACTOR
   START-UP, OIL PURIFIER START-UP, CONTROL OIL PUMP START-UP). Redrawn with the shared symbol library HSYM (hmi-sym.js, the HMI
   standard docs/hmi/HMI_STYLE.md) after the mockup v3 the user approved on 2026-10-30 ("OK v3 + bearing temp at vibration"): one page
   in three tabs, each 1:1 in the 1280 x 770 area of the 1280 x 860 frame (readable with the dock open):
   1 TURBINE & BEARINGS  the turbine cut open (HP / IP / LP rotor and stator blades, steam through the stages), MSV / CV / CRV, the
                         shaft, the bearings No.1 (+ thrust) ~ No.4 cut open with the oil film, the turning gear, the generator (core,
                         winding, rotor) and the exciter; the bearing oil header and the drains; per bearing the metal temperature and
                         the shaft vibration X / Y (TCS I/O list HMI_AI: 1TEST1009 / 1010, 1TEGE1001 / 1002, 1VEST10011 ~ 22,
                         1VEGE10011 ~ 22; plant model ASSUMED, tcs.js tcsOil);
   2 LUBE OIL            main oil tank T-1920 (LSH / LSL), MOP P-1922A / B and EOP P-1923 (vertical, submerged), lube oil coolers
                         H-1921A / B (cooling water TCV-CW1201 of TICLO1002, ABC-053: TE-LO1002-1 / -2), the oil filter (DPISL01932),
                         the bearing oil header (PSLO1004, PILO10031 ~ 33), the drain return, vapour extractor F-1937 (PGLO1920),
                         oil purifier P-1941 with the coalescer (local panel);
   3 CONTROL & TRIP OIL  COP P-1931A / B (suction: the bearing oil line), the control oil filter (DPISL01933), the control oil header
                         (PILO10061 ~ 63), the master trip solenoid valves A1 / A2 / B1 / B2 and the trip oil (PILO10071 ~ 73), the
                         MSV / CV / CRV actuators cut open (control oil lifts the piston against the spring; trip oil holds the dump
                         shut; without trip oil the spring closes the valve fast).
   The flow diagrams K1AU3-PD-0xx have no turbine oil sheet (the turbine is the MHPS package): the equipment and the instruments are
   those of the SOP and of the TCS I/O list (iolist-tcs HMI_AI / HMI_DI); the HMI snapshot 36.PNG is the guide for the flow.
   The pumps are TCS equipment (no DCS DITL): a click opens the TCS operation box (START / STOP / AUTO / MANUAL, SOP 2620 "COP(B) >
   MANUAL > EXECUTE > STOP"; EOP and vapour extractor START / STOP; the oil purifier at its local panel = FIELD). Values = the plant
   model (tcs.js TCS_OIL, AN_UNIT lo*) and the ABC-053 loop; never from this page. Run state: red = running, green = stopped. */
(function () {
  if (!window.PLANT_V2 || !window.HSYM) return;
  const NS = 'http://www.w3.org/2000/svg';
  const H = HSYM,
    T = H.T,
    C = H.C;
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  /* the machines: name, tag, the TCS pump key (tcs.js oil command) or the field key, what the operation box offers */
  const MACH = {
    MA: { n: 'MOP-A', t: 'P-1922A', d: 'MAIN OIL PUMP (A)', k: 'mopA', ops: 1 },
    MB: { n: 'MOP-B', t: 'P-1922B', d: 'MAIN OIL PUMP (B)', k: 'mopB', ops: 1 },
    EO: { n: 'EOP', t: 'P-1923', d: 'DC EMERGENCY OIL PUMP', k: 'eop', ops: 0 },
    CA: { n: 'COP-A', t: 'P-1931A', d: 'CONTROL OIL PUMP (A)', k: 'copA', ops: 1 },
    CB: { n: 'COP-B', t: 'P-1931B', d: 'CONTROL OIL PUMP (B)', k: 'copB', ops: 1 },
    VX: { n: 'VAPOUR EXTRACTOR', t: 'F-1937', d: 'MAIN OIL TANK VAPOUR EXTRACTOR', k: 'vex', ops: 0 },
    PU: { n: 'OIL PURIFIER', t: 'P-1941', d: 'OIL PURIFIER PUMP (local panel)', k: 'pur', ops: 0, field: 1 }
  };
  /* live test #53 (36.PNG shows three values): a redundant set of three transmitters (2oo3 trip) = three value boxes under one tag line;
     the three read the one header pressure of the plant model (tcs.js), so they show the same value */
  const vbox3 = (x, y, tag, unit, key, w = 58) =>
    `<g class="hs-hit" data-vbx="${key}">${T(x, y - 5, tag + '  ' + unit, 'hs-tag')}${[0, 1, 2].map(i => `<rect x="${x + i * (w + 4)}" y="${y}" width="${w}" height="29" rx="2" fill="${C.box}" stroke="${C.boxs}"/>${T(x + i * (w + 4) + w - 5, y + 22, '-----', 'hs-val', `text-anchor="end" fill="${C.none}" data-v="${key}"`)}`).join('')}</g>`;
  /* name, state and mode of a machine (state / mode filled live) */
  const label = (x, y, id, a = 'middle') =>
    T(x, y, MACH[id].n, 'hs-eq', `text-anchor="${a}" data-hit="${id}"`) + /* #48: the name opens what the symbol opens */
    T(x, y + 18, MACH[id].t, 'hs-tag', `text-anchor="${a}" data-hit="${id}"`) +
    T(x, y + 36, '-----', 'hs-st', `text-anchor="${a}" fill="${C.none}" data-st="${id}"`) +
    T(
      x,
      y + 52,
      MACH[id].field ? 'LOCAL' : MACH[id].ops ? '---' : 'TCS',
      'hs-sub',
      `text-anchor="${a}" data-md="${id}"`
    );
  const zone = (b, x, y, w, h, s) =>
    b.add(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#ffffff" fill-opacity=".018"/>` +
        T(x + 12, y + 20, s, 'hs-zone')
    );
  const P = (...a) => a.reduce((r, v, i) => (i % 2 ? r[r.length - 1].push(v) : r.push([v]), r), []);

  /* ---------------- tab 1: TURBINE & BEARINGS ---------------- */
  const CY = 310; /* shaft centre line */
  function art1() {
    const b = H.scene('to1'),
      PX = 'to1';
    /* casing inner radius and rotor root radius along the turbine (HP 170 ~ 340, IP 340 ~ 450, LP 450 ~ 580) */
    const rIn = x => (x < 340 ? 52 + (x - 170) * 0.08 : x < 450 ? 72 + (x - 340) * 0.16 : 92 + (x - 450) * 0.3),
      rootR = x => (x < 340 ? 30 : x < 450 ? 34 : 40),
      top = x => Math.round(CY - rIn(x) - 16);
    /* steam: main steam -> MSV -> CV -> HP; HP exhaust -> cold reheat; hot reheat -> CRV -> IP; LP exhaust -> condenser */
    b.pipe(P(0, 120, 260, 120, 260, top(260)), { w: 13, med: 'st', f: 'st' });
    b.pipe(P(320, top(320), 320, 66), { w: 11, med: 'st', f: 'st' });
    b.pipe(P(640, 100, 400, 100, 400, top(400)), { w: 13, med: 'st', f: 'st' });
    /* control oil to the actuators (from tab 3) */
    for (const [x, y] of [
      [150, 74],
      [215, 74],
      [480, 54]
    ])
      b.pipe(P(x, 44, x, y), { w: 6, med: 'co', f: 'co' });
    /* bearing oil header (from tab 2) and the risers; the drains (bridges over the header) back to the tank */
    b.pipe(P(0, 512, 1040, 512, 1040, 392), { w: 11, med: 'l', f: 'bh' });
    for (const x of [130, 620, 720])
      b.pipe(P(x, 512, x, 392), { w: 7, med: 'l', f: 'bh' }).tee(x, 512, { w: 11, med: 'l', f: 'bh' });
    b.pipe(P(1060, 392, 1060, 542, 0, 542), { w: 8, med: 'dr', f: 'dr', over: 1 });
    for (const x of [150, 640, 740]) b.pipe(P(x, 392, x, 542), { w: 8, med: 'dr', f: 'dr', over: 1 });
    /* turbine casing (cut open), rotor drum, stator vanes and rotor blades, steam path between the blades */
    let ct = [],
      cb = [],
      it = [],
      ib = [];
    for (let x = 170; x <= 580; x += 5) {
      ct.push(`${x},${CY - rIn(x) - 16}`);
      cb.unshift(`${x},${CY + rIn(x) + 16}`);
      it.push(`${x},${CY - rIn(x)}`);
      ib.unshift(`${x},${CY + rIn(x)}`);
    }
    let cas = `<polygon points="${ct.join(' ')} ${cb.join(' ')}" fill="#2b343e" stroke="#8b9aaa" stroke-width="2"/><polygon points="${it.join(' ')} ${ib.join(' ')}" fill="#151c23"/>`;
    for (let x = 176; x < 578; x += 12) {
      const r = rIn(x);
      cas += `<line x1="${x}" y1="${CY - r - 14}" x2="${x + 9}" y2="${CY - r - 2}" stroke="#56636f"/><line x1="${x}" y1="${CY + r + 2}" x2="${x + 9}" y2="${CY + r + 14}" stroke="#56636f"/>`;
    }
    for (const x of [340, 450])
      cas += `<rect x="${x - 3}" y="${CY - rIn(x)}" width="6" height="${rIn(x) - rootR(x) - 4}" fill="#56636f"/><rect x="${x - 3}" y="${CY + rootR(x) + 4}" width="6" height="${rIn(x) - rootR(x) - 4}" fill="#56636f"/>`;
    cas += `<path d="M180 ${CY - 30} H340 V${CY - 34} H450 V${CY - 40} H575 V${CY + 40} H450 V${CY + 34} H340 V${CY + 30} H180 Z" fill="url(#${PX}-sf)" stroke="#556"/>`;
    let st = '',
      rb = '';
    for (const [a, e, n] of [
      [190, 330, 8],
      [352, 440, 5],
      [460, 570, 4]
    ]) {
      const step = (e - a) / n;
      for (let i = 0; i < n; i++) {
        const xs = a + i * step,
          xr = xs + step * 0.5,
          R = rIn(xs),
          Rr = rIn(xr),
          r0 = rootR(xs),
          w = Math.max(6, step * 0.3),
          hv = R - r0 - 6,
          hb = Rr - r0 - 5;
        st += `<path d="M${xs} ${CY - R} h${w} l-1.5 ${hv} h${-w + 3} Z" fill="url(#${PX}-vn)"/><path d="M${xs} ${CY + R} h${w} l-1.5 ${-hv} h${-w + 3} Z" fill="url(#${PX}-vn)"/>`;
        rb += `<path d="M${xr} ${CY - r0} h${w} l-1.5 ${-hb} h${-w + 3} Z" fill="url(#${PX}-bl)"/><rect x="${xr - 1}" y="${CY - r0 - hb - 3}" width="${w}" height="3" fill="#cfd8e1"/>`;
        rb += `<path d="M${xr} ${CY + r0} h${w} l-1.5 ${hb} h${-w + 3} Z" fill="url(#${PX}-bl)"/><rect x="${xr - 1}" y="${CY + r0 + hb}" width="${w}" height="3" fill="#cfd8e1"/>`;
      }
    }
    let up = [],
      dn = [];
    for (let x = 190; x <= 572; x += 6) {
      const m = (rIn(x) + rootR(x)) / 2;
      up.push(`${x} ${(CY - m).toFixed(1)}`);
      dn.push(`${x} ${(CY + m).toFixed(1)}`);
    }
    const sp = `fill="none" stroke="#f2f6fa" stroke-width="2.4" stroke-dasharray="2 12" stroke-linecap="round" data-pf="st" visibility="hidden"`;
    b.add(
      `<g class="hs-hit" data-hit="TB"><title>steam turbine (cut open): HP / IP / LP rotor blades (bright) and stator blades (dark)</title>${cas}${st}<g data-blades="1">${rb}</g>` +
        `<path d="M${up.join(' L')}" ${sp}/><path d="M${dn.join(' L')}" ${sp}/>` +
        `<path d="M476 ${CY + rIn(476) + 16} V486 H536 V${CY + rIn(536) + 16}" fill="#2b343e" stroke="#8b9aaa" stroke-width="2"/><path d="M506 ${CY + rIn(506) + 20} V482" ${sp}/></g>`
    );
    /* shaft (rotation = moving marks) */
    let mk = '';
    for (let i = 0; i < 80; i++)
      mk += `<line x1="${60 + i * 16}" y1="${CY - 34}" x2="${76 + i * 16}" y2="${CY + 26}" stroke="#5d6873" stroke-width="2" opacity=".45"/>`;
    b.add(
      `<clipPath id="${PX}-shc"><rect x="60" y="${CY - 15}" width="1150" height="30"/></clipPath><rect x="60" y="${CY - 15}" width="1150" height="30" rx="5" fill="url(#${PX}-sf)"/><g clip-path="url(#${PX}-shc)"><g data-shaft="1">${mk}</g></g>`
    );
    /* steam valves (body + actuator; the actuator cut open is on tab 3) */
    const sv = (x, y, name) =>
      `<g class="hs-hit" data-tab="2"><title>${name} · actuator: see CONTROL & TRIP OIL (tab 3)</title><rect x="${x - 18}" y="${y - 13}" width="36" height="26" rx="4" fill="url(#${PX}-cs)" stroke="${C.edge}" stroke-width="1.4"/>` +
      `<rect x="${x - 12}" y="${y - 47}" width="24" height="32" rx="2" fill="url(#${PX}-mt)" stroke="${C.edge}"/><rect x="${x - 12}" y="${y - 47}" width="24" height="12" fill="${C.med.co[0]}" data-act="1"/>` +
      `<line x1="${x}" y1="${y - 15}" x2="${x}" y2="${y}" stroke="#1b232c" stroke-width="3"/></g>`;
    b.add(sv(150, 120, 'MSV') + sv(215, 120, 'CV') + sv(480, 100, 'CRV'));
    b.txt(
      T(150, 152, 'MSV', 'hs-tag', 'text-anchor="middle"') +
        T(215, 152, 'CV', 'hs-tag', 'text-anchor="middle"') +
        T(480, 132, 'CRV', 'hs-tag', 'text-anchor="middle"') +
        T(4, 108, 'MAIN STEAM', 'hs-sub') +
        T(4, 60, '▼ control oil (tab 3)', 'hs-sub') +
        T(334, 76, '▲ COLD REHEAT', 'hs-sub') +
        T(528, 88, '◀ HOT REHEAT', 'hs-sub') +
        T(544, 480, '▼ CONDENSER', 'hs-sub') +
        T(255, 418, 'HP', 'hs-eq', 'text-anchor="middle"') +
        T(395, 440, 'IP', 'hs-eq', 'text-anchor="middle"') +
        T(470, 478, 'LP', 'hs-eq', 'text-anchor="end"')
    );
    /* bearings: pedestal cut open, babbitt shells, oil film; vibration probes X / Y on top; No.1 with the thrust collar */
    const brg = (x, n, thrust) => {
      let s = `<g class="hs-hit" data-hit="BRG${n}"><title>No.${n} bearing${thrust ? ' + thrust bearing' : ''}: the shaft runs on an oil film (yellow)</title><path d="M${x - 34} 392 L${x - 27} 244 H${x + 27} L${x + 34} 392 Z" fill="#27313b" stroke="#8b9aaa" stroke-width="2" class="hs-hl"/>`;
      s += `<rect x="${x - 22}" y="${CY - 34}" width="44" height="19" fill="url(#${PX}-bb)"/><rect x="${x - 22}" y="${CY + 15}" width="44" height="19" fill="url(#${PX}-bb)"/>`;
      for (const yy of [CY - 15.5, CY + 15.5])
        s += `<line x1="${x - 22}" y1="${yy}" x2="${x + 22}" y2="${yy}" stroke="#ffd36b" stroke-width="2.5" stroke-dasharray="4 4" data-pf="film" visibility="hidden"/>`;
      s += `<line x1="${x - 16}" y1="250" x2="${x - 8}" y2="${CY - 36}" stroke="#c3ccd6" stroke-width="3"/><line x1="${x + 16}" y1="250" x2="${x + 8}" y2="${CY - 36}" stroke="#c3ccd6" stroke-width="3"/><circle cx="${x}" cy="${CY + 26}" r="3" fill="#e5484d"/>`;
      if (thrust)
        s += `<rect x="${x + 26}" y="${CY - 44}" width="9" height="88" fill="url(#${PX}-bb)"/><rect x="${x + 36}" y="${CY - 34}" width="7" height="68" fill="url(#${PX}-mt)"/>`;
      return s + '</g>';
    };
    b.add(brg(130, 1, 1) + brg(620, 2) + brg(720, 3) + brg(1040, 4));
    b.txt(
      T(130, 234, 'No.1 + THRUST', 'hs-tag', 'text-anchor="middle"') +
        T(620, 234, 'No.2', 'hs-tag', 'text-anchor="middle"') +
        T(720, 234, 'No.3', 'hs-tag', 'text-anchor="middle"') +
        T(1040, 234, 'No.4', 'hs-tag', 'text-anchor="middle"')
    );
    /* turning gear (engages at standstill, about 3 rpm) */
    b.add(
      `<g><title>turning gear: turns the shaft at about 3 rpm when no steam turns it (PR-OPE-5002 7955)</title><rect x="650" y="206" width="40" height="32" rx="3" fill="url(#${PX}-cs)" stroke="${C.edge}"/><line x1="670" y1="238" x2="670" y2="${CY - 44}" stroke="#9aa8b6" stroke-width="4"/>` +
        `<g data-tg="1" data-cx="670" data-cy="${CY - 30}"><circle cx="670" cy="${CY - 30}" r="13" fill="#44505c" stroke="#9aa8b6" stroke-width="2" stroke-dasharray="4 3"/></g>` +
        `<rect x="659" y="${CY - 17}" width="6" height="34" fill="#9aa8b6"/><rect x="675" y="${CY - 17}" width="6" height="34" fill="#9aa8b6"/></g>`
    );
    b.txt(T(670, 196, 'TURNING GEAR', 'hs-tag', 'text-anchor="middle"'));
    /* generator: frame, laminated core, stator winding and end turns, rotor (field), main leads */
    let core = '';
    for (let i = 0; i < 33; i++)
      core += `<line x1="${784 + i * 6}" y1="214" x2="${784 + i * 6}" y2="254" stroke="#59656f"/><line x1="${784 + i * 6}" y1="${CY + 62}" x2="${784 + i * 6}" y2="${CY + 102}" stroke="#59656f"/>`;
    let rs = '';
    for (let i = 0; i < 22; i++)
      rs += `<rect x="778" y="${CY - 80 + i * 8}" width="204" height="3" fill="#b2793f" opacity=".8"/>`;
    b.add(
      `<g class="hs-hit" data-hit="GEN"><title>generator: stator core and winding (copper), rotor with the field winding</title><rect x="755" y="190" width="250" height="240" rx="22" fill="#27313b" stroke="#8b9aaa" stroke-width="2" class="hs-hl"/>` +
        `<rect x="782" y="214" width="196" height="40" fill="#3d4853"/><rect x="782" y="${CY + 62}" width="196" height="40" fill="#3d4853"/>${core}` +
        `<rect x="768" y="248" width="224" height="9" fill="url(#${PX}-cu)"/><rect x="768" y="${CY + 59}" width="224" height="9" fill="url(#${PX}-cu)"/>` +
        `<path d="M768 248 q-14 18 0 40 M992 248 q14 18 0 40 M768 ${CY + 68} q-14 -18 0 -40 M992 ${CY + 68} q14 -18 0 -40" stroke="#c98448" stroke-width="6" fill="none"/>` +
        `<clipPath id="${PX}-grc"><rect x="778" y="${CY - 56}" width="204" height="112"/></clipPath><rect x="778" y="${CY - 56}" width="204" height="112" rx="8" fill="url(#${PX}-sf)"/>` +
        `<g clip-path="url(#${PX}-grc)"><g data-rotor="1">${rs}</g></g>` +
        `<rect x="772" y="${CY - 56}" width="10" height="112" fill="#9aa8b6"/><rect x="978" y="${CY - 56}" width="10" height="112" fill="#9aa8b6"/>` +
        `<rect x="850" y="430" width="60" height="22" fill="#33404c" stroke="#8b9aaa"/>${[0, 1, 2].map(i => `<line x1="${862 + i * 18}" y1="452" x2="${862 + i * 18}" y2="470" stroke="#c98448" stroke-width="4"/>`).join('')}</g>`
    );
    b.txt(
      T(880, 184, 'GENERATOR', 'hs-eq', 'text-anchor="middle" style="font-size:15px"') +
        T(920, 468, 'main leads ▶', 'hs-sub')
    );
    /* exciter: armature and the rotating diodes */
    b.add(
      `<g class="hs-hit" data-hit="EXC"><title>AC exciter: armature and the rotating diodes (brushless)</title><rect x="1080" y="${CY - 64}" width="104" height="128" rx="12" fill="#27313b" stroke="#8b9aaa" stroke-width="2" class="hs-hl"/>` +
        `<rect x="1092" y="${CY - 50}" width="44" height="24" fill="#3d4853"/><rect x="1092" y="${CY + 26}" width="44" height="24" fill="#3d4853"/>` +
        `<rect x="1094" y="${CY - 26}" width="40" height="7" fill="url(#${PX}-cu)"/><rect x="1094" y="${CY + 19}" width="40" height="7" fill="url(#${PX}-cu)"/>` +
        `${[0, 1, 2, 3, 4].map(i => `<rect x="1148" y="${CY - 44 + i * 18}" width="22" height="11" fill="#2d6a4f" stroke="#7fd1a8"/>`).join('')}</g>`
    );
    b.txt(T(1132, 236, 'EXCITER', 'hs-tag', 'text-anchor="middle"'));
    /* journal bearing end view (inset): shaft turning on the oil film */
    b.add(
      `<g><rect x="760" y="46" width="500" height="126" rx="4" fill="#0b1015" stroke="#3d4b59"/>` +
        `<circle cx="826" cy="109" r="54" fill="#27313b" stroke="#8b9aaa" stroke-width="2"/><circle cx="826" cy="109" r="43" fill="url(#${PX}-bb)"/>` +
        `<circle cx="826" cy="109" r="37" fill="#d9a441" opacity=".9" data-film="1"/><circle cx="826" cy="112" r="32" fill="url(#${PX}-sf)"/>` +
        `<g data-jn="1" data-cx="826" data-cy="112"><line x1="826" y1="112" x2="826" y2="84" stroke="#3b4652" stroke-width="4"/><line x1="826" y1="112" x2="852" y2="121" stroke="#3b4652" stroke-width="3"/></g></g>`
    );
    b.txt(
      T(898, 72, 'JOURNAL BEARING (cut open, end view)', 'hs-eq', 'style="font-size:15px"') +
        T(898, 98, 'oil from the header enters at the bottom', 'hs-sub') +
        T(898, 120, 'oil film (yellow): no metal touches the shaft', 'hs-sub') +
        T(898, 142, 'oil leaves at the sides → drain → tank', 'hs-sub')
    );
    b.txt(
      `<g class="hs-hit" data-tab="1">${T(180, 500, '◀ BEARING OIL HEADER (from LUBE OIL, tab 2)', 'hs-sub')}</g>` +
        `<g class="hs-hit" data-tab="1">${T(180, 562, '◀ DRAIN → MAIN OIL TANK (LUBE OIL, tab 2)', 'hs-sub')}</g>`
    );
    /* per bearing: metal temperature and shaft vibration X / Y (TCS I/O list HMI_AI; ASSUMED plant model) */
    const BRG = [
      [1, 'No.1 TURBINE', 'TEST1009', 'VEST10011', 'VEST10012'],
      [2, 'No.2 TURBINE', 'TEST1010', 'VEST10021', 'VEST10022'],
      [3, 'No.3 GENERATOR', 'TEGE1001', 'VEGE10011', 'VEGE10012'],
      [4, 'No.4 GENERATOR', 'TEGE1002', 'VEGE10021', 'VEGE10022']
    ];
    for (const [n, nm, tm, vx, vy] of BRG) {
      const x = 12 + (n - 1) * 317;
      b.txt(
        `<rect x="${x}" y="574" width="305" height="76" rx="4" fill="#0b1015" stroke="#2f3d4a"/>` +
          T(x + 10, 594, nm + ' BEARING', 'hs-st', `fill="${C.nm}"`) +
          T(x + 296, 594, 'metal · vib X / Y', 'hs-sub', 'text-anchor="end" style="font-size:12px"') +
          H.vbox(x + 8, 616, tm, '°C', 'm' + n, 74) +
          H.vbox(x + 116, 616, vx, '', 'vx' + n, 66) +
          H.vbox(x + 194, 616, vy, 'mm', 'vy' + n, 66)
      );
    }
    b.txt(
      H.vbox(20, 690, 'SPEED (TCS)', 'rpm', 'rpm', 92) +
        vbox3(196, 690, 'PILO10031 / 32 / 33', 'kg/cm²', 'loBrg') +
        H.lamp(394, 704, 'PSL', 'PSLO1004 bearing oil') +
        H.vbox(640, 690, 'TIGE1007 No.3 out', '°C', 'loTb3', 84) +
        H.vbox(820, 690, 'TIGE1008 No.4 out', '°C', 'loTb4', 84) +
        T(1270, 714, 'metal / vib: ASSUMED model', 'hs-sub', 'text-anchor="end" style="font-size:12px"')
    );
    b.txt(
      H.legend(20, 752, [
        ['l', 'lube oil'],
        ['dr', 'drain'],
        ['co', 'control oil'],
        ['st', 'steam']
      ])
    );
    return b.svg();
  }

  /* ---------------- tab 2: LUBE OIL ---------------- */
  const ROOF = 590;
  function art2() {
    const b = H.scene('to2'),
      PX = 'to2';
    zone(b, 4, 42, 726, 724, 'MAIN OIL TANK T-1920 · OIL PUMPS');
    zone(b, 734, 42, 542, 724, 'COOLERS · FILTER · BEARING OIL');
    const man = (x, y, lab, open, o = {}) => b.add(H.valve(x, y, Object.assign({ lab, open, px: PX }, o)));
    /* MOP-A / B discharge -> MOP header -> cooler inlet manifold */
    b.pipe(P(186, ROOF - 34, 202, ROOF - 34, 202, 300), { w: 10, med: 'l', f: 'mA' });
    b.pipe(P(346, ROOF - 34, 362, ROOF - 34, 362, 300), { w: 10, med: 'l', f: 'mB' });
    b.pipe(P(202, 300, 362, 300), { w: 11, med: 'l', f: 'mA' });
    b.pipe(P(362, 300, 790, 300), { w: 11, med: 'l', f: 'mh' }).tee(362, 300, { w: 11, med: 'l', f: 'mh' });
    b.pipe(P(790, 300, 790, 200, 830, 200), { w: 10, med: 'l', f: 'mh' });
    b.pipe(P(790, 300, 790, 340, 830, 340), { w: 10, med: 'l' }).tee(790, 300, { w: 11, med: 'l', f: 'mh' });
    /* cooler outlets -> manifold -> filter -> bearing oil header (right, to tab 1); EOP into it */
    b.pipe(P(1050, 200, 1120, 200, 1120, 480, 1280, 480), { w: 11, med: 'l', f: 'bh' });
    b.pipe(P(1050, 340, 1120, 340), { w: 10, med: 'l' }).tee(1120, 340, { w: 11, med: 'l', f: 'bh' });
    b.pipe(P(506, ROOF - 34, 522, ROOF - 34, 522, 480, 1120, 480), { w: 9, med: 'l', f: 'eo' });
    b.tee(1120, 480, { w: 11, med: 'l', f: 'bh' });
    /* drain from the bearings (tab 1) back into the tank */
    b.pipe(P(1280, 560, 690, 560, 690, ROOF + 4), { w: 10, med: 'dr', f: 'dr' });
    /* cooling water: cooler A in service (TCV-CW1201), cooler B standby (valves closed; bridges over the oil manifold) */
    b.pipe(P(1280, 140, 1020, 140, 1020, 174), { w: 8, med: 'c', f: 'cwA' });
    b.pipe(P(870, 174, 870, 116, 1280, 116), { w: 8, med: 'c', f: 'cwA' });
    b.pipe(P(1020, 366, 1020, 384, 1280, 384), { w: 8, med: 'c', over: 1 });
    b.pipe(P(870, 366, 870, 400, 1280, 400), { w: 8, med: 'c', over: 1 });
    /* vapour extractor on the tank roof, purifier loop */
    b.pipe(P(610, ROOF - 30, 610, 506), { w: 8, med: 'st', f: 'vx' });
    b.pipe(P(714, 700, 754, 700), { w: 8, med: 'l', f: 'pu' });
    b.pipe(P(826, 700, 900, 700), { w: 8, med: 'l', f: 'pu' });
    b.pipe(P(940, 612, 940, 580, 708, 580, 708, ROOF + 4), { w: 8, med: 'l', f: 'pu' });
    /* main oil tank */
    b.add(
      H.tank(30, ROOF, 690, 146, 'MT', {
        px: PX,
        max: 1,
        water: 'ol',
        hit: 'TK',
        sx: 690,
        sy: ROOF + 2,
        marks: [
          [0.85, '', C.amber],
          [0.4, '', C.amber]
        ],
        markIn: 1
      })
    );
    b.txt(T(44, ROOF + 26, 'T-1920', 'hs-eq') + T(44, ROOF + 46, 'MAIN OIL TANK', 'hs-sub'));
    b.txt(H.lamp(52, ROOF + 76, 'LVL', 'LSH/LSL'));
    /* pumps */
    b.add(H.vpump(150, ROOF, 'MA', PX, 120) + H.vpump(310, ROOF, 'MB', PX, 120) + H.vpump(470, ROOF, 'EO', PX, 120));
    b.txt(label(144, 390, 'MA') + label(304, 390, 'MB') + label(464, 390, 'EO'));
    b.add(H.check(202, 500, 'cA', '') + H.check(362, 500, 'cB', '') + H.check(522, 500, 'cE', ''));
    b.txt(
      H.vbox(214, 316, 'PILO1922A', 'kg/cm²', 'loPa', 76) +
        H.vbox(374, 316, 'PILO1922B', 'kg/cm²', 'loPb', 76) +
        H.vbox(534, 316, 'PILO1923', 'kg/cm²', 'loEop', 76)
    );
    /* vapour extractor and the purifier */
    b.add(H.blower(610, ROOF - 30, 'VX', PX));
    b.txt(
      T(560, 410, 'VAPOUR EXT.', 'hs-eq', 'style="font-size:15px"') +
        T(560, 428, 'F-1937 · oil vapour out', 'hs-tag') +
        T(560, 446, '-----', 'hs-st', `fill="${C.none}" data-st="VX"`) +
        H.vbox(632, 510, 'PGLO1920', 'mmH₂O', 'loVac', 54)
    );
    b.add(H.pump(790, 700, 'PU', PX));
    b.add(
      `<g class="hs-hit" data-hit="COA"><title>coalescer filter V-LO1205: takes water and dirt out of the oil (water drain V-LO1223)</title><rect x="900" y="612" width="80" height="124" rx="30" fill="url(#${PX}-cs)" stroke="${C.edge}" stroke-width="1.6" class="hs-hl"/>${[0, 1, 2, 3, 4].map(i => `<line x1="914" y1="${636 + i * 20}" x2="966" y2="${636 + i * 20}" stroke="#c3ccd6" stroke-dasharray="4 4"/>`).join('')}<path d="M940 736 V752" stroke="${C.med.c[0]}" stroke-width="4"/></g>`
    );
    b.txt(
      T(1000, 618, 'OIL PURIFIER', 'hs-eq', 'style="font-size:15px"') +
        T(1000, 636, 'P-1941 · coalescer', 'hs-tag') +
        T(1000, 654, '-----', 'hs-st', `fill="${C.none}" data-st="PU"`) +
        T(1000, 672, 'LOCAL panel (FIELD)', 'hs-sub') +
        H.vbox(1000, 700, 'PI P-1941', 'kg/cm²', 'loPur', 76)
    );
    /* coolers and the cooling water valve */
    b.add(
      H.hx(830, 200, 220, 52, 'hA', {
        px: PX,
        hit: 'CLA',
        title: 'H-1921A lube oil cooler (in service): oil outside the tubes, cooling water inside'
      }) + H.hx(830, 340, 220, 52, 'hB', { px: PX, hit: 'CLB', title: 'H-1921B lube oil cooler (standby)' })
    );
    man(810, 200, '', true);
    man(810, 340, '', false);
    man(1085, 200, '', true);
    man(1085, 340, '', false);
    man(1180, 384, '', false);
    man(1236, 400, '', false);
    b.add(
      H.valve(1100, 140, { kind: 'cv', id: 'TCV', lab: '', px: PX, title: 'TCV-CW1201 · MV of TICLO1002 (ABC-053)' })
    );
    b.txt(
      T(900, 166, 'H-1921A', 'hs-tag') +
        T(850, 300, 'H-1921B standby', 'hs-tag') +
        T(1066, 188, 'TCV-CW1201', 'hs-tag') +
        T(1276, 106, 'CCW RETURN ▶', 'hs-sub', 'text-anchor="end"') +
        T(1276, 134, '◀ CCW SUPPLY', 'hs-sub', 'text-anchor="end"')
    );
    b.add(H.filter(1120, 440, 'FLT', PX, 'lube oil filter · DP switch DPISL01932'));
    b.txt(
      H.lamp(960, 440, 'DPF', 'DPISL01932') +
        H.vbox(1134, 230, 'TILO10021', '°C', 'TE-LO1002-1', 72) /* #53: the DCS tag (36.PNG); the I/O line is TE-LO1002-1 */ +
        H.vbox(1134, 290, 'TILO10022', '°C', 'TE-LO1002-2', 72) +
        H.vbox(640, 328, 'TILO1001 in', '°C', 'loTin', 72)
    );
    b.txt(
      `<g class="hs-hit" data-tab="0">${T(1276, 470, 'TO BEARINGS ▶', 'hs-sub', 'text-anchor="end"')}</g>` +
        `<g class="hs-hit" data-tab="0">${T(1276, 550, '◀ DRAIN from bearings (tab 1)', 'hs-sub', 'text-anchor="end"')}</g>` +
        vbox3(1090, 506, 'PILO10031 / 32 / 33', 'kg/cm²', 'loBrg') +
        H.lamp(900, 506, 'PSL', 'PSLO1004')
    );
    /* the DCS loop TICLO1002 (ABC-053): PV = the cooler outlet TE-LO1002, MV = TCV-CW1201; click = faceplate */
    const cx = 540,
      cy = 120;
    b.txt(
      `<g class="hs-hit" data-hit="TIC"><rect x="${cx}" y="${cy}" width="220" height="108" rx="4" fill="${C.box}" stroke="#4a6074" class="hs-hl"/>` +
        T(cx + 10, cy + 22, 'TICLO1002', 'hs-st', `fill="${C.nm}"`) +
        `<rect x="${cx + 160}" y="${cy + 8}" width="52" height="20" rx="10" fill="none" stroke="${C.none}" data-k="cpill"/>` +
        T(cx + 186, cy + 23, '---', 'hs-st', `text-anchor="middle" fill="${C.none}" data-k="cmode"`) +
        T(cx + 10, cy + 52, 'PV', 'hs-unit') +
        T(cx + 104, cy + 54, '-----', 'hs-val', `text-anchor="end" fill="${C.none}" data-k="cpv"`) +
        T(cx + 120, cy + 52, 'SV', 'hs-unit') +
        T(
          cx + 196,
          cy + 54,
          '-----',
          'hs-val',
          `text-anchor="end" fill="${C.none}" style="font-size:18px" data-k="csv"`
        ) +
        T(cx + 200, cy + 52, '°C', 'hs-unit') +
        T(cx + 10, cy + 86, 'MV', 'hs-unit') +
        `<rect x="${cx + 40}" y="${cy + 76}" width="90" height="10" fill="#26303a"/><rect x="${cx + 40}" y="${cy + 76}" width="0" height="10" fill="${C.med.c[1]}" data-k="cbar"/>` +
        T(
          cx + 196,
          cy + 88,
          '-----',
          'hs-val',
          `text-anchor="end" fill="${C.none}" style="font-size:18px" data-k="cmv"`
        ) +
        T(cx + 200, cy + 86, '%', 'hs-unit') +
        `</g>` +
        T(cx, cy + 128, 'ABC-053 · SOP: oil out 46 °C', 'hs-sub', 'style="font-size:12px"')
    );
    b.txt(
      H.legend(20, 752, [
        ['l', 'lube oil'],
        ['dr', 'drain'],
        ['c', 'cooling water'],
        ['st', 'oil vapour']
      ])
    );
    return b.svg();
  }

  /* ---------------- tab 3: CONTROL & TRIP OIL ---------------- */
  const XA = [910, 1040, 1170],
    Y0 = 180;
  function art3() {
    const b = H.scene('to3'),
      PX = 'to3';
    /* COP suction from the bearing oil line (tab 2) */
    b.pipe(P(0, 548, 190, 548), { w: 10, med: 'l', f: 'cs' });
    b.pipe(P(190, 548, 190, 470, 228, 470), { w: 10, med: 'l', f: 'csA' });
    b.pipe(P(190, 548, 190, 650, 228, 650), { w: 10, med: 'l', f: 'csB' }).tee(190, 548, { w: 10, med: 'l', f: 'cs' });
    /* discharge -> manifold -> control oil filter -> header -> riser to the actuators */
    b.pipe(P(292, 470, 380, 470), { w: 9, med: 'co', f: 'cA' });
    b.pipe(P(292, 650, 380, 650, 380, 470), { w: 9, med: 'co', f: 'cB' });
    b.pipe(P(380, 470, 380, 400, 740, 400, 740, 130, 1240, 130), { w: 9, med: 'co', f: 'ch' }).tee(380, 470, {
      w: 9,
      med: 'co',
      f: 'ch'
    });
    for (const x of XA)
      b.pipe(P(x + 44, 130, x + 44, Y0 + 96), { w: 6, med: 'co', f: 'ch', over: 1 }).tee(x + 44, 130, {
        w: 9,
        med: 'co',
        f: 'ch'
      });
    /* master trip solenoid block fed from the riser; trip oil out to the dump valves */
    b.pipe(P(740, 260, 680, 260), { w: 8, med: 'co', f: 'ch' }).tee(740, 260, { w: 9, med: 'co', f: 'ch' });
    b.pipe(P(570, 210, 570, 160, 1240, 160), { w: 8, med: 'to', f: 'tr', over: 1 });
    for (const x of XA)
      b.pipe(P(x - 42, 160, x - 42, Y0 + 126), { w: 6, med: 'to', f: 'tr', over: 1 }).tee(x - 42, 160, {
        w: 8,
        med: 'to',
        f: 'tr'
      });
    /* steam: main steam -> MSV -> CV -> HP; hot reheat -> CRV -> IP */
    b.pipe(P(780, 434, XA[0] - 38, 434), { w: 14, med: 'st', f: 'st' });
    b.pipe(P(XA[0] + 38, 434, XA[1] - 38, 434), { w: 14, med: 'st', f: 'st' });
    b.pipe(P(XA[1] + 38, 434, 1090, 434, 1090, 520), { w: 14, med: 'st', f: 'st' });
    b.pipe(P(1124, 520, 1124, 434, XA[2] - 38, 434), { w: 14, med: 'st', f: 'st' });
    b.pipe(P(XA[2] + 38, 434, 1280, 434), { w: 14, med: 'st', f: 'st' });
    /* pumps */
    b.add(H.pump(260, 470, 'CA', PX) + H.pump(260, 650, 'CB', PX));
    b.add(H.check(330, 470, 'kA', '') + H.check(330, 650, 'kB', ''));
    b.txt(label(20, 398, 'CA', 'start') + label(20, 596, 'CB', 'start'));
    b.txt(
      H.vbox(396, 494, 'PILO1931A', 'kg/cm²', 'loCa', 84) +
        H.vbox(396, 674, 'PILO1931B', 'kg/cm²', 'loCb', 84) +
        `<g class="hs-hit" data-tab="1">${T(4, 538, '◀ bearing oil (tab 2)', 'hs-sub')}</g>`
    );
    b.add(
      H.filter(470, 400, 'FLC', PX, 'control oil filter · DP switch DPISL01933').replace(
        '<g ',
        `<g transform="rotate(90 470 400)" `
      )
    );
    b.txt(H.lamp(500, 450, 'DPC', 'DPISL01933') + vbox3(560, 494, 'PILO10061 / 62 / 63 control', 'kg/cm²', 'loCtl'));
    /* master trip solenoids: coils and spools */
    let mts = '';
    ['A1', 'A2', 'B1', 'B2'].forEach((n, i) => {
      mts += `<rect x="${478 + i * 50}" y="224" width="34" height="38" rx="3" fill="#56636f" stroke="#9aa8b6"/>`;
      for (let j = 0; j < 5; j++)
        mts += `<line x1="${480 + i * 50}" y1="${228 + j * 7}" x2="${510 + i * 50}" y2="${228 + j * 7}" stroke="#c98448" stroke-width="2"/>`;
      mts += `<rect x="${488 + i * 50}" y="266" width="14" height="40" fill="#8b98a6" data-spool="1"/>`;
    });
    b.add(
      `<g class="hs-hit" data-hit="MTS"><title>master trip solenoid valves A1 / A2 / B1 / B2 (TCS)</title><rect x="460" y="210" width="220" height="110" rx="6" fill="url(#${PX}-cs)" stroke="${C.edge}" stroke-width="2" class="hs-hl"/>${mts}</g>`
    );
    b.txt(
      ['A1', 'A2', 'B1', 'B2']
        .map(
          (n, i) =>
            `<circle cx="${495 + i * 50}" cy="338" r="7" fill="${C.none}" stroke="${C.edge}" data-lp="MT${n}"/>${T(495 + i * 50, 360, n, 'hs-tag', 'text-anchor="middle"')}`
        )
        .join('') +
        T(570, 196, 'MASTER TRIP SOLENOID', 'hs-st', `text-anchor="middle" fill="${C.nm}"`) +
        T(600, 382, '-----', 'hs-st', `fill="${C.none}" data-lt="MTS"`) +
        vbox3(780, 70, 'PILO10071 / 72 / 73 trip', 'kg/cm²', 'loTrip')
    );
    /* actuators cut open: spring on top, piston, oil under the piston (control oil), dump (trip oil), stem to the plug */
    const act = (x, name, k) => {
      let spr = `M${x - 22} ${Y0 + 6}`;
      for (let i = 0; i < 6; i++) spr += ` L${x + (i % 2 ? -22 : 22)} ${Y0 + 6 + (i + 1) * 12}`;
      return (
        `<g class="hs-hit" data-hit="ACT"><title>${name} actuator: control oil lifts the piston (open); trip oil keeps the dump shut; on a trip the dump opens and the spring closes the valve</title>` +
        `<rect x="${x - 30}" y="${Y0}" width="60" height="160" rx="4" fill="#1b232c" stroke="#9aa8b6" stroke-width="2" class="hs-hl"/>` +
        `<rect x="${x - 26}" y="${Y0 + 92}" width="52" height="64" fill="${C.med.co[0]}" data-oil="${k}" opacity=".15"/>` +
        `<g data-spr="${k}" style="transform-box:fill-box;transform-origin:50% 0;transition:transform 1.2s"><path d="${spr}" stroke="#c3ccd6" stroke-width="3" fill="none"/></g>` +
        `<rect x="${x - 38}" y="${Y0 + 176}" width="76" height="96" rx="6" fill="url(#${PX}-cs)" stroke="${C.edge}" stroke-width="2"/>` +
        `<rect x="${x - 38}" y="${Y0 + 246}" width="76" height="16" fill="#0b1015"/>` +
        `<g data-pis="${k}" style="transition:transform 1.2s"><rect x="${x - 26}" y="${Y0 + 78}" width="52" height="14" fill="url(#${PX}-mt)" stroke="#556"/><rect x="${x - 4}" y="${Y0 + 92}" width="8" height="150" fill="url(#${PX}-mt)"/><rect x="${x - 22}" y="${Y0 + 242}" width="44" height="24" rx="4" fill="url(#${PX}-mt)" stroke="#556"/></g>` +
        `<rect x="${x + 30}" y="${Y0 + 96}" width="24" height="30" rx="3" fill="url(#${PX}-cs)" stroke="${C.edge}"/>` +
        `<rect x="${x - 54}" y="${Y0 + 126}" width="24" height="30" rx="3" fill="url(#${PX}-cs)" stroke="${C.edge}"/><rect x="${x - 50}" y="${Y0 + 134}" width="16" height="14" fill="${C.none}" data-dump="${k}"/></g>`
      );
    };
    b.add(act(XA[0], 'MSV', 'msv') + act(XA[1], 'CV', 'cv') + act(XA[2], 'CRV', 'crv'));
    XA.forEach((x, i) => {
      const n = ['MSV', 'CV', 'CRV'][i];
      b.txt(
        T(x, 478, n, 'hs-eq', 'text-anchor="middle"') +
          T(x, 498, '-----', 'hs-st', `text-anchor="middle" fill="${C.none}" data-vs="${n}"`)
      );
    });
    b.txt(
      T(784, 420, 'main steam ▶', 'hs-sub') +
        T(1084, 540, '▼ HP', 'hs-sub', 'text-anchor="end"') +
        T(1130, 540, '▲ hot reheat · ▶ IP', 'hs-sub') +
        T(1040, 590, 'control oil lifts the piston = valve open', 'hs-sub', 'text-anchor="middle"') +
        T(1040, 612, 'trip oil keeps the dump shut; when it is lost the dump opens', 'hs-sub', 'text-anchor="middle"') +
        T(1040, 634, 'and the spring closes the valve (fast)', 'hs-sub', 'text-anchor="middle"')
    );
    b.txt(
      H.legend(20, 752, [
        ['l', 'lube oil'],
        ['co', 'control oil'],
        ['to', 'trip oil'],
        ['st', 'steam']
      ])
    );
    return b.svg();
  }

  /* ---------- the TCS operation box (over the page, opened by a click on a pump) ---------- */
  function opBoxArt() {
    const bx = 820,
      by = 48;
    const bt = (i, op, l) =>
      `<g data-op="${op}" class="hs-tab"><rect x="${bx + 14 + i * 104}" y="${by + 92}" width="96" height="34" rx="4" fill="#1a232c" stroke="#55626f" data-ob="${op}"/>${T(bx + 62 + i * 104, by + 115, l, 'hs-st', `text-anchor="middle" fill="#e2e8ee"`)}</g>`;
    return (
      `<g data-k="opbox" visibility="hidden"><rect x="${bx}" y="${by}" width="440" height="170" rx="6" fill="#0f1419" stroke="#6b7a88" stroke-width="1.5"/>` +
      T(bx + 14, by + 26, '-----', 'hs-eq', 'style="font-size:16px" data-k="obt"') +
      T(bx + 14, by + 48, '-----', 'hs-sub', 'data-k="obs"') +
      T(bx + 14, by + 74, '-----', 'hs-st', 'data-k="obst"') +
      `<g data-op="x" class="hs-tab"><rect x="${bx + 406}" y="${by + 8}" width="26" height="26" rx="3" fill="#1a232c" stroke="#55626f"/>${T(bx + 419, by + 27, '✕', 'hs-st', 'text-anchor="middle" fill="#e2e8ee"')}</g>` +
      bt(0, 'start', 'START') +
      bt(1, 'stop', 'STOP') +
      bt(2, 'auto', 'AUTO') +
      bt(3, 'man', 'MANUAL') +
      T(bx + 14, by + 154, '', 'hs-sub', 'data-k="obm"') +
      `</g>`
    );
  }

  /* ---------- live links ---------- */
  function oil(g, api) {
    const pg = document.createElementNS(NS, 'g');
    pg.setAttribute('transform', H.fit(1280, 770));
    g.append(pg);
    const tabs = H.tabs(pg, 'TO', ['TURBINE & BEARINGS', 'LUBE OIL', 'CONTROL & TRIP OIL']);
    tabs[0].innerHTML = art1();
    tabs[1].innerHTML = art2();
    tabs[2].innerHTML = art3();
    const ob = document.createElementNS(NS, 'g');
    ob.innerHTML = opBoxArt();
    pg.append(ob);
    pg.querySelectorAll('[data-tab]').forEach(e =>
      e.addEventListener('click', ev => (ev.stopPropagation(), tabs.show(+e.dataset.tab)))
    );
    const q = s => pg.querySelector(s),
      qa = s => pg.querySelectorAll(s);
    const A = H.live(pg);
    A.travel('TCV', 4);
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
        Pk = m[1] === 'mop' ? 'Mop' : 'Cop';
      return { run: !!U['lo' + Pk][i], au: !!U['lo' + Pk + 'Au'][i] };
    };
    /* the turbine's own motion: shaft marks, generator rotor, blades, turning gear, journal (speed = UNIT.rpm) */
    const mv = { sh: 0, ro: 0, jn: 0, tg: 0 };
    const elS = q('[data-shaft]'),
      elR = q('[data-rotor]'),
      elJ = q('[data-jn]'),
      elG = q('[data-tg]'),
      elB = q('[data-blades]');
    A.each(adt => {
      const r = V.rpm > 0 ? V.rpm : 0,
        f = r / 3600,
        vis = r > 0.5 ? Math.max(0.06, f) : 0;
      mv.sh = (mv.sh + adt * 100 * vis) % 16;
      mv.ro = (mv.ro + adt * 50 * vis) % 8;
      mv.jn = (mv.jn + adt * Math.min(720, r * 6)) % 360;
      const tgOn = r > 0.5 && r < 6;
      if (tgOn) mv.tg = (mv.tg + adt * 40) % 360;
      if (elS) elS.setAttribute('transform', `translate(0 ${mv.sh.toFixed(1)})`);
      if (elR) elR.setAttribute('transform', `translate(0 ${mv.ro.toFixed(1)})`);
      if (elJ) elJ.setAttribute('transform', `rotate(${mv.jn.toFixed(1)} ${elJ.dataset.cx} ${elJ.dataset.cy})`);
      if (elG) elG.setAttribute('transform', `rotate(${mv.tg.toFixed(1)} ${elG.dataset.cx} ${elG.dataset.cy})`);
      if (elB) elB.setAttribute('opacity', r > 1000 && adt && Math.random() < 0.5 ? 0.82 : 1);
    });
    let wasOpen = null;
    const tick = () => {
      const st = {};
      for (const id in MACH) {
        const s = (st[id] = stOf(id));
        A.pump(id, !s ? null : s.run ? 'RUN' : 'STOP');
        if (MACH[id].ops)
          qa(`[data-md="${id}"]`).forEach(e => {
            e.textContent = !s ? '---' : s.au ? 'AUTO' : 'MANUAL';
            e.setAttribute('fill', !s ? C.none : s.au ? C.nm : C.amber);
          });
      }
      const x = window.AN && AN.unit && AN.unit.on && AN.unit.loMop ? AN.unit : null,
        run = id => !!(st[id] && st[id].run);
      const lube = run('MA') || run('MB'),
        brg = x && V.loBrg > 0.3,
        ctl = x && V.loCtl > 5,
        trip = x && V.loTrip > 5,
        open = !!(x && V.loRst === 1 && V.loTrip > 100),
        sp = V.rpm > 0 ? V.rpm / 3600 : 0;
      /* tab 2 */
      A.flow('mA', run('MA') ? 6 : 0);
      A.flow('mB', run('MB') ? 6 : 0);
      A.flow('mh', lube ? 6 : 0);
      A.flow('hAs', lube ? 4 : 0);
      A.flow('eo', run('EO') ? 4 : 0);
      A.flow('bh', brg ? 6 : 0);
      A.flow('dr', brg ? 3 : 0);
      A.flow('vx', run('VX') ? 4 : 0);
      A.flow('pu', run('PU') ? 3 : 0);
      A.check('cA', run('MA') ? 1 : 0);
      A.check('cB', run('MB') ? 1 : 0);
      A.check('cE', run('EO') ? 1 : 0);
      const cw = V.MV != null && V.MV > 1;
      A.flow('cwA', cw ? 3 + V.MV / 20 : 0);
      A.flow('hAt', cw ? 3 : 0);
      A.valve('TCV', V.MV == null ? null : V.MV / 100);
      A.tank('MT', x ? 0.68 : null, 1, brg ? 3 : 0);
      /* tab 1 */
      A.flow('film', brg && V.rpm > 0.5 ? 2 + 6 * sp : 0);
      A.flow('st', open && V.rpm > 1 ? 4 + 20 * sp : 0);
      A.flow('co', ctl ? 8 : 0);
      qa('[data-film]').forEach(e => e.setAttribute('opacity', brg ? 0.9 : 0.15));
      qa('[data-act]').forEach(e => e.setAttribute('height', open ? 12 : 3));
      /* tab 3 */
      const cop = run('CA') || run('CB');
      A.flow('cs', cop ? 5 : 0);
      A.flow('csA', run('CA') ? 5 : 0);
      A.flow('csB', run('CB') ? 5 : 0);
      A.flow('cA', run('CA') ? 10 : 0);
      A.flow('cB', run('CB') ? 10 : 0);
      A.flow('ch', ctl ? 10 : 0);
      A.flow('tr', trip ? 10 : 0);
      A.check('kA', run('CA') ? 1 : 0);
      A.check('kB', run('CB') ? 1 : 0);
      if (wasOpen !== open) {
        const fast = wasOpen === true && !open;
        qa('[data-pis],[data-spr]').forEach(e => (e.style.transition = `transform ${fast ? 0.25 : 1.2}s`));
        qa('[data-pis]').forEach(e => (e.style.transform = open ? 'translateY(-44px)' : 'translateY(0)'));
        qa('[data-spr]').forEach(e => (e.style.transform = open ? 'scaleY(.39)' : 'scaleY(1)'));
        qa('[data-oil]').forEach(e => {
          e.setAttribute('y', open ? Y0 + 48 : Y0 + 92);
          e.setAttribute('height', open ? 108 : 64);
          e.setAttribute('opacity', open ? 0.9 : 0.15);
        });
        wasOpen = open;
      }
      qa('[data-dump]').forEach(e => e.setAttribute('fill', !x ? C.none : trip ? C.stop : C.run));
      qa('[data-vs]').forEach(e => {
        e.textContent = !x ? '-----' : open ? 'OPEN' : 'CLOSED';
        e.setAttribute('fill', !x ? C.none : open ? C.run : C.stop);
      });
      /* the switches of the TCS I/O list, from the model values */
      A.lamp('PSL', x ? !(V.loBrg <= 1.05) : null, 'NORMAL', 'LOW');
      A.lamp('LVL', x ? true : null, 'NORMAL');
      A.lamp('DPF', x ? true : null, 'DP NORMAL');
      A.lamp('DPC', x ? true : null, 'DP NORMAL');
      ['A1', 'A2', 'B1', 'B2'].forEach(n => A.lamp('MT' + n, x ? V.loRst === 1 : null));
      A.lamp('MTS', x ? V.loRst === 1 : null, 'RESET', 'TRIP POSITION');
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
      const stx = q('[data-k="obst"]');
      stx.textContent = !s
        ? 'no plant model: choose Cold or 150 MW (Plant model ON)'
        : (s.run ? 'RUNNING' : 'STOPPED') + (M.ops ? ' · ' + (s.au ? 'AUTO' : 'MANUAL') : '');
      stx.setAttribute('fill', !s ? C.none : s.run ? C.run : C.stop);
      for (const op of ['auto', 'man']) {
        const bb = q(`[data-op="${op}"]`);
        /* live test #67: 'inherit', not 'visible' (an SVG child with visibility=visible shows through its hidden box: AUTO / MANUAL stayed) */
        if (bb) bb.setAttribute('visibility', M.ops ? 'inherit' : 'hidden');
      }
      const lit = { start: s && s.run, stop: s && !s.run, auto: s && s.au, man: s && M.ops && !s.au };
      for (const op in lit) {
        const r = q(`[data-ob="${op}"]`);
        if (r)
          r.setAttribute('stroke', lit[op] ? (op === 'start' ? C.run : op === 'stop' ? C.stop : '#e2e8ee') : '#55626f');
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
      const Lb = { start: 'START', stop: 'STOP', auto: 'AUTO', man: 'MANUAL' }[op];
      box.msg = r ? '⚠ ' + r : M.n + ' ' + Lb + ': EXECUTED';
      if (!r && window.lsEventAdd)
        try {
          lsEventAdd(
            M.field ? 'FIELD' : 'TCS',
            M.field ? 'FIELD' : 'DCS',
            (M.field ? 'Field operator: ' : 'Operator (TCS): ') + M.n + ' ' + M.t + ' ' + Lb
          );
        } catch (e) {}
      tick();
      boxFill();
    };
    qa('[data-op]').forEach(bb => bb.addEventListener('click', e => (e.stopPropagation(), doOp(bb.dataset.op))));
    boxEl.addEventListener('click', e => e.stopPropagation());
    tick();
    let seen = false;
    const iv = setInterval(
      () => (g.isConnected ? ((seen = true), tick()) : seen && (clearInterval(iv), A.stop())),
      500
    );
    const HIT = {
      TK: 'T-1920 main oil tank · level switches LSH / LSL (TCS, MAIN OIL TANK LEVEL HIGH / LOW)',
      CLA: 'H-1921A lube oil cooler (in service) · outlet TE-LO1002-1 (DCS ABC-053)',
      CLB: 'H-1921B lube oil cooler (standby) · outlet TE-LO1002-2 (DCS ABC-053)',
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
        if (!h.querySelector('title')) {
          const ti = document.createElementNS(NS, 'title');
          ti.textContent = HIT[id];
          h.append(ti);
        }
        if (id === 'CLA' || id === 'CLB' || id === 'TCV')
          h.addEventListener(
            'click',
            e => (e.stopPropagation(), info(id === 'TCV' ? 'TICLO1002' : id === 'CLA' ? 'TE-LO1002-1' : 'TE-LO1002-2'))
          );
      });
    /* the values of the plant model (tcs.js TCS_OIL, the bearing metal / vibration ASSUMED) */
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
    const MV = { m: 'loM', vx: 'loVx', vy: 'loVy' };
    for (const p in MV) for (let n = 1; n <= 4; n++) UNIT.push(MV[p] + n);
    /* the value boxes of the bearing cards (m1 .. vy4) and their model keys */
    const KEY = {};
    for (const p in MV) for (let n = 1; n <= 4; n++) KEY[p + n] = MV[p] + n;
    const TCSIO = {
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
      rpm: 'turbine speed (TCS)',
      m1: '1TEST1009 No.1 turbine journal bearing metal temp. (ASSUMED model)',
      m2: '1TEST1010 No.2 turbine journal bearing metal temp. (ASSUMED model)',
      m3: '1TEGE1001 No.3 bearing metal temp. (ASSUMED model)',
      m4: '1TEGE1002 No.4 bearing metal temp. (ASSUMED model)',
      vx1: '1VEST10011 No.1 turbine shaft vibration X (ASSUMED model)',
      vy1: '1VEST10012 No.1 turbine shaft vibration Y (ASSUMED model)',
      vx2: '1VEST10021 No.2 turbine shaft vibration X (ASSUMED model)',
      vy2: '1VEST10022 No.2 turbine shaft vibration Y (ASSUMED model)',
      vx3: '1VEGE10011 No.3 generator shaft vibration X (ASSUMED model)',
      vy3: '1VEGE10012 No.3 generator shaft vibration Y (ASSUMED model)',
      vx4: '1VEGE10021 No.4 generator shaft vibration X (ASSUMED model)',
      vy4: '1VEGE10022 No.4 generator shaft vibration Y (ASSUMED model)'
    };
    /* decimals: the low pressures 2, the control / trip oil and the temperatures 1, vacuum and speed 0, vibration 3 */
    const dpOf = k =>
      /^(loCa|loCb|loCtl|loTrip|loTin|loTb3|loTb4|TE-LO|m\d)/.test(k)
        ? 1
        : /^(loVac|rpm)$/.test(k)
          ? 0
          : /^v[xy]\d/.test(k)
            ? 3
            : 2;
    const showV = (vk, v) =>
      qa(`[data-v="${vk}"]`).forEach(t => {
        t.textContent = fmt(v, dpOf(vk));
        t.setAttribute('fill', v == null ? C.none : C.val);
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
          m === 'M' ? ['MAN', C.amber] : m === 'R' ? ['REM', '#7fb3e0'] : m === 'A' ? ['AUTO', C.nm] : ['---', C.none];
        K('cmode').textContent = lab;
        K('cmode').setAttribute('fill', col);
        K('cpill').setAttribute('stroke', col);
        K('cpv').textContent = ok ? fmt(X.pv, 1) : '-----';
        K('csv').textContent = ok ? fmt(X.sv, 1) : '-----';
        K('cmv').textContent = ok ? fmt(X.mv, 1) : '-----';
        for (const t of ['cpv', 'csv', 'cmv']) K(t).setAttribute('fill', ok ? C.val : C.none);
        V.MV = ok && isFinite(X.mv) ? +X.mv : null;
        K('cbar').setAttribute('width', V.MV == null ? 0 : (90 * Math.max(0, Math.min(100, V.MV))) / 100);
        tick();
      },
      q('[data-hit="TIC"]')
    );
    for (const io of ['TE-LO1002-1', 'TE-LO1002-2'])
      api.reg({ t: 'val', tag: io, v: '' }, X => showV(io, X && isFinite(X.v) ? +X.v : null), q(`[data-vbx="${io}"]`));
    for (const k of Object.keys(TCSIO)) {
      qa(`[data-vbx="${k}"]`).forEach(bx => {
        if (bx.dataset.tt) return;
        bx.dataset.tt = 1;
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = TCSIO[k] + ' · TCS signal (no DCS logic) · value: plant model';
        bx.append(ti);
      });
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
    w: H.FRAME.w,
    h: H.FRAME.h,
    v2: true,
    screen: 'TO',
    style: 'steel',
    items: []
  });
})();
