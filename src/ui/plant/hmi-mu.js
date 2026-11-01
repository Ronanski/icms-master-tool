/* MAKE-UP WATER SYSTEM (roadmap step 6, PR-OPE-5002 section 7 "MAKE UP WATER PUMP / EXPANSION TANK FILLING").
   3.2.0-beta.70: redrawn with the shared symbol library HSYM (hmi-sym.js) after the mockup the user approved on 2026-10-30
   (https://claude.ai/artifact/D7QHoST3PTVzav5Pw1T1q7): process left to right (tanks -> pumps -> header -> users), continuous
   pipes with welded tees and rounded elbows, equipment that moves (impeller and motor fan, check valve flapper, gauge needles,
   valve travel, tank water and inflow). Equipment and tags after the flow diagrams K1AU3-PD-024 MAKE-UP WATER SYSTEM Rev D
   (flow-diagram-K1AU3-A1-0-001.zip, RB page 21) and PD-021 AUX COOLING WATER Rev D (RB page 15, the expansion tank):
   - demi water tanks T-0708A / B (from CED1 permeate, water treatment) -> V-MU0001 / 0002 -> suction header MU-0-003 12";
   - MWP P-0709A / B / C (DITL-112): suction V-MU0003 / 4 / 5, strainer STR-MU0001 ~ 3 (DPT-MU0709-A / B / C), PG-MU0709-A / B / C,
     check V-MU0006 / 8 / 10, discharge V-MU0007 / 9 / 11, recirculation RO + check V-MU0012 / 14 / 16 + V-MU0013 / 15 / 17 back
     to the tanks (V-MU0018 / 0019);
   - common header MU-0-010 12" (PT-MU0709) -> MU-1-020 to unit 1 (FT-MU1001): sampling, boiler and deaerator initial fill, #1
     condenser (LCV-MU1110 of ABC-031 parallel to MV-MU1001 of DITL-60), expansion tank T-1109 (MU-1-021 3": V-MU1031, XV-MU1109 of
     DITL-78 with bypass V-MU1033, V-MU1032; LT-CW1109, LSLL-CW1109) -> ACWP suction; MU-2-020 to unit 2.
   Run state = the motor drawing of the one world (LS_DOCK.mst, as the Training dock lamps): red = running, green = stopped, red
   blinking = trip; valves red = open, green = closed, amber blinking = travelling. Values = the plant model (unit.js AN_MU,
   written into the analog rows of DITL-112 / 76 / 77 / 78 by plantsw.js, so the logic reads the same number); never from this
   page. The flow animation speed follows FIMU1001 (the pumps share it); the recirculation moves while a pump runs.
   Frame 1280 x 860 of the HMI standard (docs/hmi/HMI_STYLE.md, readable with the dock open) in two tabs: TANKS & PUMPS and
   #1 UNIT USERS & EXPANSION TANK, each drawn 1:1 in the 1280 x 770 area. */
(function () {
  if (!window.PLANT_V2 || !window.HSYM) return;
  const NS = 'http://www.w3.org/2000/svg';
  const H = HSYM,
    T = H.T;
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  /* the machines: name, tag, run state address (LS_DOCK.mst), info card tag, logic sheet */
  const MACH = {
    PA: { n: 'MWP-A', t: 'P-0709A', ad: 'DITL-112', io: 'MIR-P0709A', d: 'DITL-112' },
    PB: { n: 'MWP-B', t: 'P-0709B', ad: 'DITL-112 #B', io: 'MIR-P0709B', d: 'DITL-112 #B' },
    PC: { n: 'MWP-C', t: 'P-0709C', ad: 'DITL-112 #C', io: 'MIR-P0709C', d: 'DITL-112 #C' }
  };
  /* id, y, letter, suction valve, strainer, check, discharge valve, recirc check, recirc valve */
  const ROWS = [
    ['PA', 200, 'A', 'V-MU0003', 'STR-MU0001', 'V-MU0006', 'V-MU0007', 'V-MU0012', 'V-MU0013'],
    ['PB', 420, 'B', 'V-MU0004', 'STR-MU0002', 'V-MU0008', 'V-MU0009', 'V-MU0014', 'V-MU0015'],
    ['PC', 640, 'C', 'V-MU0005', 'STR-MU0003', 'V-MU0010', 'V-MU0011', 'V-MU0016', 'V-MU0017']
  ];
  /* tab 1: TANKS & PUMPS (1280 x 770 area, tab bar on top, content from y 44) */
  const CX = 560; /* pump centre */
  function art1() {
    const b = H.scene('mua'),
      PX = 'mua';
    const zone = (x, w, s) =>
      b.add(
        `<rect x="${x}" y="42" width="${w}" height="724" rx="6" fill="#ffffff" fill-opacity=".018"/>` +
          T(x + 12, 62, s, 'hs-zone')
      );
    zone(4, 250, 'DEMI WATER TANKS');
    zone(258, 666, 'MAKE-UP WATER PUMPS · DITL-112');
    zone(928, 348, 'HEADER');
    const man = (x, y, lab, open, o = {}) => b.add(H.valve(x, y, Object.assign({ lab, open, px: PX }, o)));
    /* tank outlets, suction header MU-0-003 12" */
    b.pipe(
      [
        [190, 300],
        [280, 300]
      ],
      { w: 11, f: 'sucA' }
    );
    b.pipe(
      [
        [190, 630],
        [280, 630]
      ],
      { w: 11, f: 'sucB' }
    );
    b.pipe(
      [
        [280, 300],
        [280, 200],
        [530, 200]
      ],
      { w: 11, f: 'sA' }
    );
    b.pipe(
      [
        [280, 300],
        [280, 420]
      ],
      { w: 11, f: 'sB1' }
    );
    b.pipe(
      [
        [280, 630],
        [280, 420]
      ],
      { w: 11, f: 'sB2' }
    );
    b.pipe(
      [
        [280, 630],
        [280, 640],
        [530, 640]
      ],
      { w: 11, f: 'sC' }
    );
    b.pipe(
      [
        [280, 420],
        [530, 420]
      ],
      { w: 11, f: 'sB' }
    );
    b.tee(280, 300, { w: 11, f: 'sucA' }).tee(280, 630, { w: 11, f: 'sucB' }).tee(280, 420, { w: 11, f: 'sB' });
    man(232, 300, 'V-MU0001', 1, { la: 'up' });
    man(232, 630, 'V-MU0002', 1, { la: 'up' });
    b.add(
      H.tank(40, 128, 150, 212, 'A', {
        px: PX,
        max: 15,
        hit: 'TKA',
        sx: 115,
        marks: [[2, 'SOP 2 m', '#f2a531']],
        markIn: 1
      })
    );
    b.add(
      H.tank(40, 450, 150, 220, 'B', {
        px: PX,
        max: 15,
        hit: 'TKB',
        sx: 115,
        marks: [[2, 'SOP 2 m', '#f2a531']],
        markIn: 1
      })
    );
    b.txt(T(40, 374, 'T-0708A', 'hs-eq') + T(40, 704, 'T-0708B', 'hs-eq'));
    b.txt(H.vbox(126, 354, 'LIMU0708A', 'm', 'LIMU0708A', 70) + H.vbox(126, 684, 'LIMU0708B', 'm', 'LIMU0708B', 70));
    /* pumps */
    ROWS.forEach(([id, y, n, sv, st, ck, dv, rck, rv], i) => {
      b.pipe(
        [
          [590, y],
          [720, y]
        ],
        { f: 'dr' + i }
      );
      b.tee(720, y, { f: 'dr' + i });
      man(380, y, sv, 1);
      b.add(H.strainer(458, y, st, PX));
      b.txt(H.vbox(392, y - 60, 'DPIMU0709' + n, 'kg/cm²', 'DPIMU0709' + n, 76));
      b.add(H.pump(CX, y, id, PX));
      b.txt(
        T(CX - 44, y - 128, '-----', 'hs-st', `data-st="${id}" fill="#6b7480"`) +
          T(CX - 44, y - 108, MACH[id].n, 'hs-eq', `data-hit="${id}"`) + /* #48: the name opens what the symbol opens */
          /* live test 2026-10-30 #22: REMOTE / LOCAL (field selector, DITL-112 row 22 = I/O MIL-P0709x) and AUTO / MAN (CRT, row 15) as
             030; the MWP is an MCC motor (I/O list: running, electric trouble, remote; no VCB DI) */
          T(CX - 44, y - 90, '--- · ---', 'hs-sub', `data-md="${id}" fill="#6b7480"`) +
          T(CX, y + 58, MACH[id].t, 'hs-sub', 'text-anchor="middle"')
      );
      b.txt(H.vbox(CX + 60, y - 104, 'IIP0709' + n, 'A', 'IIP0709' + n, 76));
      b.add(H.check(640, y, 'ck' + i, ''));
      b.add(`<title>${ck}</title>`);
      b.add(H.gauge(670, y, 'pg' + i, 'PG-MU0709-' + n));
      b.add(H.orifice(748, y - 55));
      b.add(
        `<g><title>${rck} · check valve</title><circle cx="776" cy="${y - 55}" r="8" fill="#1b252f" stroke="#090d11" stroke-width="1.4"/><line x1="776" y1="${y - 62}" x2="776" y2="${y - 48}" stroke="#cfd8e0" stroke-width="2" stroke-linecap="round" data-ck="rck${i}" data-cx="776" data-cy="${y - 62}"/></g>`
      );
      man(806, y - 55, rv, 1, { la: 'up' });
      man(800, y, dv, 1);
    });
    /* minimum flow recirculation (RO) back to T-0708A / B (V-MU0018 / 0019), along the bottom */
    b.pipe(
      [
        [720, 200],
        [720, 145],
        [840, 145],
        [840, 365]
      ],
      { w: 6, med: 'r', f: 'r0' }
    );
    b.pipe(
      [
        [720, 420],
        [720, 365],
        [840, 365]
      ],
      { w: 6, med: 'r', f: 'r1' }
    );
    b.pipe(
      [
        [840, 365],
        [840, 585]
      ],
      { w: 6, med: 'r', f: 'rc1' }
    );
    b.pipe(
      [
        [720, 640],
        [720, 585],
        [840, 585]
      ],
      { w: 6, med: 'r', f: 'r2' }
    );
    b.pipe(
      [
        [840, 585],
        [840, 740],
        [24, 740],
        [24, 420]
      ],
      { w: 6, med: 'r', f: 'rcAll' }
    );
    b.pipe(
      [
        [24, 420],
        [24, 104],
        [115, 104],
        [115, 130]
      ],
      { w: 6, med: 'r', f: 'rcHalf' }
    );
    b.pipe(
      [
        [24, 420],
        [115, 420],
        [115, 452]
      ],
      { w: 6, med: 'r', f: 'rcHalf' }
    );
    b.tee(840, 365, { w: 6, med: 'r', f: 'rc1' })
      .tee(840, 585, { w: 6, med: 'r', f: 'rcAll' })
      .tee(24, 420, { w: 6, med: 'r', f: 'rcAll' });
    man(66, 104, 'V-MU0018', 1, { la: 'up' });
    man(66, 420, 'V-MU0019', 1, { la: 'up' });
    b.txt(T(300, 760, 'MIN. FLOW RECIRCULATION (RO) TO T-0708A / B', 'hs-sub'));
    /* discharge header MU-0-010 12" (PT-MU0709) */
    b.pipe(
      [
        [720, 200],
        [940, 200],
        [940, 300]
      ],
      { f: 'd0' }
    );
    b.pipe(
      [
        [940, 300],
        [940, 420]
      ],
      { f: 'h1' }
    );
    b.pipe(
      [
        [720, 420],
        [940, 420]
      ],
      { f: 'd1' }
    );
    b.pipe(
      [
        [940, 420],
        [940, 560]
      ],
      { f: 'h2' }
    );
    b.pipe(
      [
        [720, 640],
        [940, 640],
        [940, 560]
      ],
      { f: 'd2' }
    );
    b.pipe(
      [
        [940, 300],
        [1110, 300]
      ],
      { w: 11, f: 'u1' }
    );
    b.pipe(
      [
        [940, 560],
        [1110, 560]
      ],
      { f: 'u2' }
    );
    b.tee(940, 300, { f: 'u1' }).tee(940, 420, { f: 'd1' }).tee(940, 560, { f: 'u2' });
    b.add(
      `<g><title>FE-MU1001 · flow orifice</title><rect x="1002" y="283" width="5" height="34" fill="#cfd8e0" stroke="#090d11"/></g>`
    );
    b.txt(H.vbox(972, 246, 'FIMU1001', 'm³/h', 'FIMU1001', 76));
    b.add(
      `<line x1="940" y1="480" x2="964" y2="480" stroke="#9aa7b3" stroke-width="2"/>` +
        H.gauge(984, 498, 'pt', '', 18, 0)
    );
    b.txt(H.vbox(1014, 456, 'PIMU0709', 'kg/cm²', 'PIMU0709', 76) + T(1014, 506, 'SOP > 6.0 · 0 ~ 10', 'hs-sub'));
    b.txt(T(952, 386, 'MU-0-010 12"', 'hs-sub'));
    b.add(`<g class="hs-hit" data-tab="1">${H.dest(1122, 300, 140, '#1 UNIT USERS', 'open tab 2 ▸')}</g>`);
    b.add(H.dest(1122, 560, 140, 'TO UNIT 2', 'MU-2-020 12"'));
    b.txt(
      H.legend(940, 700, [['d', 'DEMIN. WATER']]) +
        H.legend(940, 724, [['r', 'RECIRCULATION']]) +
        H.legend(940, 748, [['c', 'CLOSED COOLING WATER']])
    );
    return b.svg();
  }

  /* tab 2: #1 UNIT USERS & EXPANSION TANK */
  function art2() {
    const b = H.scene('mub'),
      PX = 'mub';
    b.add(
      `<rect x="4" y="42" width="1272" height="724" rx="6" fill="#ffffff" fill-opacity=".018"/>` +
        T(16, 62, '#1 UNIT USERS · MU-1-020 12"', 'hs-zone')
    );
    const man = (x, y, lab, open, o = {}) => b.add(H.valve(x, y, Object.assign({ lab, open, px: PX }, o)));
    b.add(`<g class="hs-hit" data-tab="0">${T(20, 384, '◂ FROM HEADER (tab 1)', 'hs-sub')}</g>`);
    b.pipe(
      [
        [20, 400],
        [300, 400]
      ],
      { w: 11, f: 'u1' }
    );
    b.add(
      `<g><title>FE-MU1001 · flow orifice</title><rect x="108" y="383" width="5" height="34" fill="#cfd8e0" stroke="#090d11"/></g>`
    );
    b.txt(H.vbox(140, 430, 'FIMU1001', 'm³/h', 'FIMU1001', 76));
    /* initial fill and sampling (manual, closed) */
    b.pipe(
      [
        [300, 400],
        [300, 110],
        [900, 110]
      ],
      { f: 'up' }
    );
    b.pipe(
      [
        [300, 180],
        [900, 180]
      ],
      { f: 'blr' }
    );
    b.pipe(
      [
        [300, 250],
        [900, 250]
      ],
      { f: 'da' }
    );
    b.tee(300, 400, { w: 11, f: 'u1' }).tee(300, 180, { f: 'up' }).tee(300, 250, { f: 'up' });
    man(600, 110, 'SP-1-003 ½"', 0);
    man(600, 180, 'initial fill (manual)', 0);
    man(600, 250, 'initial fill (manual)', 0);
    b.add(H.dest(912, 110, 300, 'SAMPLING', 'K1AU3-PD-044'));
    b.add(H.dest(912, 180, 300, '#1 BOILER', 'initial fill only · MU-1-022 6"'));
    b.add(H.dest(912, 250, 300, '#1 DEAERATOR', 'initial fill only · MU-1-023 6"'));
    /* condenser hotwell: LCV-MU1110 (ABC-031) parallel to MV-MU1001 (DITL-60) */
    b.pipe(
      [
        [300, 400],
        [380, 400]
      ],
      { f: 'hw' }
    );
    b.pipe(
      [
        [380, 400],
        [380, 340],
        [660, 340],
        [660, 400]
      ],
      { f: 'lcvF' }
    );
    b.pipe(
      [
        [380, 400],
        [380, 460],
        [660, 460],
        [660, 400]
      ],
      { f: 'movF' }
    );
    b.pipe(
      [
        [660, 400],
        [900, 400]
      ],
      { f: 'hw' }
    );
    b.tee(380, 400, { f: 'hw' }).tee(660, 400, { f: 'hw' });
    b.add(
      H.valve(520, 340, {
        kind: 'cv',
        id: 'LCV',
        px: PX,
        lab: 'LCV-MU1110',
        la: 'up',
        title: 'LCV-MU1110 condenser make-up level control valve · ABC-031 LICCD1110A'
      })
    );
    b.add(
      H.valve(520, 460, {
        kind: 'mov',
        id: 'MV',
        px: PX,
        lab: 'MV-MU1001',
        title: 'MV-MU1001 make-up water to condenser shut-off MOV · DITL-60'
      })
    );
    b.txt(H.vbox(700, 304, 'LCVMU1110', '%', 'LCV', 70) + H.vbox(700, 470, 'MVMU1001', '%', 'MV', 70));
    b.add(H.dest(912, 400, 300, '#1 CONDENSER HOTWELL', 'MU-1-024 8" · 028 CONDENSATE'));
    /* expansion tank T-1109: MU-1-021 3", V-MU1031, XV-MU1109 (bypass V-MU1033), V-MU1032 */
    b.pipe(
      [
        [300, 400],
        [300, 590],
        [760, 590]
      ],
      { w: 7, f: 'et' }
    );
    b.pipe(
      [
        [420, 590],
        [420, 548],
        [520, 548],
        [520, 590]
      ],
      { w: 6, f: 'byp' }
    );
    b.tee(420, 590, { w: 7, f: 'et' }).tee(520, 590, { w: 7, f: 'et' });
    man(360, 590, 'V-MU1031', 1);
    man(620, 590, 'V-MU1032', 1);
    /* live test beta.74 #23: the bypass is a FIELD valve with a state (AN.field mu1033): live, and a click = its pop-out */
    man(470, 548, 'V-MU1033 bypass', 0, { la: 'up', id: 'BYP', title: 'V-MU1033 expansion tank bypass (manual, field)' });
    b.add(
      H.valve(470, 590, {
        kind: 'xv',
        id: 'XV',
        px: PX,
        lab: 'XV-MU1109',
        title: 'XV-MU1109 make-up water to expansion tank inlet shut-off · DITL-78'
      })
    );
    b.txt(
      T(470, 650, '-----', 'hs-st', 'text-anchor="middle" data-k="xvst" fill="#6b7480"') +
        T(470, 668, 'AUTO: open < 40 %, close > 85 %', 'hs-sub', 'text-anchor="middle"')
    );
    b.pipe(
      [
        [890, 740],
        [1060, 740]
      ],
      { med: 'c', f: 'acw' }
    );
    b.add(
      H.tank(760, 560, 130, 200, 'E', {
        px: PX,
        max: 2.4,
        hit: 'ET',
        water: 'wc',
        sx: 772,
        sy: 590,
        marks: [
          [1.7, 'LAH 85 %', '#f2a531'],
          [0.8, 'LAL 40 %', '#f2a531'],
          [0.3, 'LL 0.3', '#e5484d']
        ]
      })
    );
    b.txt(T(760, 532, 'T-1109', 'hs-eq') + T(830, 532, '#1 EXPANSION TANK', 'hs-sub'));
    b.txt(H.vbox(980, 586, 'LT-CW1109', 'm', 'LICW1109', 70) + H.vbox(980, 642, 'LICW1109', '%', 'ETPCT', 70));
    b.txt(T(980, 692, 'LSLL-CW1109: ACWP trip < 0.3 m', 'hs-sub'));
    b.add(H.dest(1072, 740, 190, 'ACWP SUCTION', '030 · CW-1-001 8"'));
    b.txt(T(16, 760, 'K1AU3-PD-024 Rev D · PD-021 Rev D · SOP PR-OPE-5002 sec. 7 · values: plant model', 'hs-sub'));
    return b.svg();
  }

  /* ---------- live links ---------- */
  function makeup(g, api) {
    const pg = document.createElementNS(NS, 'g');
    pg.setAttribute('transform', H.fit(1280, 770));
    g.append(pg);
    const tabs = H.tabs(pg, 'MU', ['TANKS & PUMPS', '#1 UNIT USERS & EXPANSION TANK']);
    tabs[0].innerHTML = art1();
    tabs[1].innerHTML = art2();
    pg.querySelectorAll('[data-tab]').forEach(e =>
      e.addEventListener('click', ev => (ev.stopPropagation(), tabs.show(+e.dataset.tab)))
    );
    const q = s => pg.querySelector(s),
      qa = s => pg.querySelectorAll(s);
    const A = H.live(pg);
    A.travel('XV', 5);
    A.travel('MV', 1);
    A.travel('LCV', 1);
    const info = tag => {
      try {
        if (window.lsInfo) window.lsInfo(tag);
      } catch (e) {}
    };
    const ST = {},
      V = {};
    const mst = M => {
      try {
        return M.ad && window.LS_DOCK && LS_DOCK.mst ? LS_DOCK.mst(M.ad) : null;
      } catch (e) {
        return null;
      }
    };
    const tick = () => {
      const run = [];
      for (const id in MACH) {
        const s = mst(MACH[id]);
        if (s !== ST[id]) A.pump(id, s);
        ST[id] = s;
        let m = null;
        try {
          m = window.LS_DOCK && LS_DOCK.modeOf ? LS_DOCK.modeOf(MACH[id].ad) : null;
        } catch (e) {}
        const md = q(`[data-md="${id}"]`),
          mt = (!m || m.rem == null ? '---' : m.rem ? 'REM' : 'LOC') + ' · ' + (!m || m.au == null ? '---' : m.au ? 'AUTO' : 'MAN') + ' · MCC';
        if (md && md.textContent !== mt) {
          md.textContent = mt;
          md.setAttribute('fill', m && m.rem && m.au ? '#9ff0c4' : m && m.rem ? '#5cd6ff' : '#ffd27a');
        }
        run.push(s === 'RUN' ? 1 : 0);
      }
      const n = run[0] + run[1] + run[2],
        F = n && isFinite(V.FIMU1001) ? Math.max(0, V.FIMU1001) : 0,
        et = n && V.ETF === 1 ? (window.AN_MU && AN_MU.etQ) || 10 : 0,
        hw = Math.max(0, F - et),
        wl = V.LCV > 1 ? V.LCV * 0.4 : 0,
        wm = V.MV > 1 ? V.MV * 0.3 : 0,
        lcvF = wl + wm ? (hw * wl) / (wl + wm) : 0,
        movF = hw - lcvF;
      const fwd = run.map(r => (r ? F / n : 0)),
        rec = run.map(r => (r ? 4 : 0)),
        suc = fwd.map((f, i) => f + rec[i]),
        recAll = rec[0] + rec[1] + rec[2];
      const flows = {
        sucA: suc[0] + suc[1] / 2,
        sucB: suc[2] + suc[1] / 2,
        sA: suc[0],
        sB1: suc[1] / 2,
        sB2: suc[1] / 2,
        sB: suc[1],
        sC: suc[2],
        dr0: suc[0],
        dr1: suc[1],
        dr2: suc[2],
        r0: rec[0],
        r1: rec[1],
        r2: rec[2],
        rc1: rec[1] + rec[2],
        rcAll: recAll,
        rcHalf: recAll / 2,
        d0: fwd[0],
        d1: fwd[1],
        d2: fwd[2],
        h1: fwd[0] - F,
        h2: fwd[0] - F + fwd[1],
        u2: 0,
        u1: F,
        bd: 0,
        blr: 0,
        smp: 0,
        da: 0,
        hw,
        lcvF: n ? lcvF : 0,
        movF: n ? movF : 0,
        et,
        byp: 0,
        acw: 0
      };
      for (const k in flows) A.flow(k, flows[k]);
      run.forEach((r, i) => {
        A.check('ck' + i, r ? 1 : 0);
        A.check('rck' + i, r ? 0.7 : 0);
        /* the local gauge sits before the check valve: discharge pressure when running, else the static head of the tanks */
        const head = isFinite(V.LIMU0708A) ? V.LIMU0708A / 10 : 0;
        A.gauge('pg' + i, r && isFinite(V.PIMU0709) ? V.PIMU0709 + 0.1 : head, 16);
      });
      A.gauge('pt', V.PIMU0709, 10);
      A.valve('XV', V.XV == null ? null : V.XV);
      A.valve('BYP', AN.fieldState && AN.fieldState().mu1033 ? 1 : 0);
      A.valve('LCV', V.LCV == null ? null : V.LCV / 100);
      A.valve('MV', V.MV == null ? null : V.MV / 100);
      const xs = q('[data-k="xvst"]');
      if (xs) {
        const xo = V.XV == null ? null : V.XV === 1;
        xs.textContent = xo == null ? '-----' : xo ? 'OPEN' : 'CLOSED';
        xs.setAttribute('fill', xo == null ? H.C.none : xo ? H.C.run : H.C.stop);
      }
      A.tank('A', V.LIMU0708A, 15, flows.rcHalf);
      A.tank('B', V.LIMU0708B, 15, flows.rcHalf);
      A.tank('E', V.LICW1109, 2.4, et);
    };
    tick();
    let seen = false;
    const iv = setInterval(
      () => (g.isConnected ? ((seen = true), tick()) : seen && (clearInterval(iv), A.stop())),
      500
    );
    const HIT = {
      PA: [MACH.PA.io, MACH.PA.n + ' ' + MACH.PA.t + ' · DITL-112 (red = running, green = stopped)'],
      PB: [MACH.PB.io, MACH.PB.n + ' ' + MACH.PB.t + ' · DITL-112 #B (red = running, green = stopped)'],
      PC: [MACH.PC.io, MACH.PC.n + ' ' + MACH.PC.t + ' · DITL-112 #C (red = running, green = stopped)'],
      TKA: ['LT-MU0708-A', 'T-0708A demineralized water tank · LT-MU0708-A'],
      TKB: ['LT-MU0708-B', 'T-0708B demineralized water tank · LT-MU0708-B'],
      XV: [
        'XV-MU1109',
        'XV-MU1109 make-up water to expansion tank inlet shut-off · DITL-78 (red = open, green = closed)'
      ],
      BYP: ['V-MU1033', 'V-MU1033 expansion tank bypass, manual valve (FIELD) (red = open, green = closed)'],
      LCV: [
        'LCV-MU1110',
        'LCV-MU1110 condenser make-up level control valve · ABC-031 LICCD1110A (red = open, green = closed)'
      ],
      MV: ['MOR-MU1001', 'MV-MU1001 make-up water to condenser shut-off MOV · DITL-60 (red = open, green = closed)'],
      ET: ['LT-CW1109', 'T-1109 expansion tank · LT-CW1109']
    };
    /* the dock's "Buksan ang faceplate" of a step motor (fp-pop.js LS_FPOP.openAd) */
    for (const id in MACH)
      (window.LS_FPREG = window.LS_FPREG || {})[MACH[id].ad] = { open: () => q(`[data-hit="${id}"]`).dispatchEvent(new MouseEvent('click')), el: () => q(`[data-hit="${id}"]`), n: MACH[id].n, cur: () => (AN.unit && AN.unit.on ? AN.unit['muI' + 'ABC'.indexOf(id[1])] : null) };
    /* XV-MU1109 is on MAKE-UP WATER and on 027 CCW (the same data-hit): the one on screen opens */
    /* (the MAKE-UP page shows tab 2 first: the valves are there; the one on screen = has a size) */
    const onScr = id => [...document.querySelectorAll(`[data-hit="${id}"]`)].find(e => e.getBoundingClientRect().width) || null,
      fpV = id => ({
        open: () => {
          if (!onScr(id) && pg.isConnected) tabs.show(1);
          const e = onScr(id);
          if (e) e.dispatchEvent(new MouseEvent('click'));
        },
        el: () => (pg.isConnected && !onScr(id) && tabs.show(1), onScr(id))
      });
    Object.assign((window.LS_FPREG = window.LS_FPREG || {}), { 'DITL-78': fpV('XV'), 'F:mu1033': fpV('BYP') });
    for (const id in HIT)
      qa(`[data-hit="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = HIT[id][1] + (MACH[id] || id === 'XV' || id === 'BYP' ? ' · click = faceplate' : ' · click = info card');
        h.append(ti);
        /* 3.2.0-beta.74: a pump = its pop-out faceplate beside it (fp-pop.js), the I/O wiring a link inside; the rest: the info card */
        h.addEventListener('click', e => {
          e.stopPropagation();
          const go = () => info(HIT[id][0]),
            M = MACH[id];
          if (M && window.LS_FPOP) LS_FPOP.hit({ ...M, cur: () => (AN.unit && AN.unit.on ? AN.unit['muI' + 'ABC'.indexOf(id[1])] : null) }, go);
          /* live test beta.74: XV-MU1109 = its valve pop-out (DITL-78 OPEN / CLOSE, AUTO / MAN, ZSO / ZSC) */
          else if (!((id === 'XV' || id === 'BYP') && window.LS_FPOP && LS_FPOP.valveTag(HIT[id][0]))) go();
        });
      });
    /* the values: the plant model (unit.js AN_MU), except LCV-MU1110 = the MV of its controller (ABC-031 LICCD1110A) */
    const UNIT = {
      LIMU0708A: 'muLvA',
      LIMU0708B: 'muLvB',
      DPIMU0709A: 'muDp0',
      DPIMU0709B: 'muDp1',
      DPIMU0709C: 'muDp2',
      IIP0709A: 'muI0',
      IIP0709B: 'muI1',
      IIP0709C: 'muI2',
      PIMU0709: 'muP',
      FIMU1001: 'muF',
      LICW1109: 'etLvl',
      ETPCT: 'etPct',
      MV: 'muMv',
      XV: 'muXv',
      ETF: 'muFill'
    };
    const IO = {
      LIMU0708A: 'LT-MU0708-A',
      LIMU0708B: 'LT-MU0708-B',
      DPIMU0709A: 'DPT-MU0709-A',
      DPIMU0709B: 'DPT-MU0709-B',
      DPIMU0709C: 'DPT-MU0709-C',
      IIP0709A: 'IT-P0709A',
      IIP0709B: 'IT-P0709B',
      IIP0709C: 'IT-P0709C',
      PIMU0709: 'PT-MU0709',
      FIMU1001: 'FT-MU1001',
      LICW1109: 'LT-CW1109',
      ETPCT: 'LT-CW1109',
      LCV: 'LCV-MU1110',
      MV: 'ZT-MU1001'
    };
    /* speed (user 2026-11-01, 6x CPU): every value of the LIVE refresh asked for the whole page; now once after that refresh */
    let tq = 0;
    const tickSoon = () => tq || (tq = Promise.resolve().then(() => ((tq = 0), tick())));
    const showV = k => {
      const v = V[k],
        dp = /^DP/.test(k) ? 3 : /^(LI|PI)/.test(k) ? 2 : 1;
      const tx = fmt(v, dp),
        fl = v == null ? H.C.none : H.C.val;
      qa(`[data-v="${k}"]`).forEach(t => {
        if (t.textContent !== tx) t.textContent = tx;
        if (t.getAttribute('fill') !== fl) t.setAttribute('fill', fl);
      });
    };
    for (const k in UNIT)
      api.reg(
        { t: 'val', tag: 'UNIT.' + UNIT[k], v: '' },
        X => ((V[k] = X && isFinite(X.v) ? +X.v : null), showV(k), tickSoon()),
        null
      );
    api.reg(
      { t: 'valve', tag: 'LCVMU1110', v: '' },
      X => ((V.LCV = X && isFinite(X.v) ? +X.v : null), showV('LCV'), tickSoon()),
      null
    );
    for (const k in IO) {
      qa(`[data-vbx="${k}"]`).forEach(b => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent =
          IO[k] + (k === 'LCV' ? ' · MV of LICCD1110A (ABC-031)' : ' · plant model') + ' · click = its I/O list line';
        b.append(ti);
        b.addEventListener('click', e => (e.stopPropagation(), info(IO[k])));
      });
      showV(k);
    }
    return pg;
  }
  PLANT_V2.screens.MU = makeup;
  /* after 030 SEAWATER in the list of the Plant view */
  const L = (window.PLANT_SYS = window.PLANT_SYS || []),
    i = L.findIndex(x => x.id === 'SW');
  L.splice(i >= 0 ? i + 1 : L.length, 0, {
    fitAll: 1,
    id: 'MU',
    title: 'MAKE-UP WATER',
    num: 'MU',
    name: 'MAKE-UP WATER SYSTEM',
    src: '28.png',
    w: H.FRAME.w,
    h: H.FRAME.h,
    v2: true,
    screen: 'MU',
    style: 'steel',
    items: []
  });
})();
