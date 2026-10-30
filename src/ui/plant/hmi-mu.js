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
   Drawn in a 1600 x 880 space, scaled to the 1920 x 1000 frame of hmi2.js. */
(function () {
  if (!window.PLANT_V2 || !window.HSYM) return;
  const NS = 'http://www.w3.org/2000/svg';
  const H = HSYM,
    T = H.T,
    PX = 'mu';
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  /* the machines: name, tag, run state address (LS_DOCK.mst), info card tag, logic sheet */
  const MACH = {
    PA: { n: 'MWP-A', t: 'P-0709A', ad: 'DITL-112', io: 'MIR-P0709A', d: 'DITL-112' },
    PB: { n: 'MWP-B', t: 'P-0709B', ad: 'DITL-112 #B', io: 'MIR-P0709B', d: 'DITL-112 #B' },
    PC: { n: 'MWP-C', t: 'P-0709C', ad: 'DITL-112 #C', io: 'MIR-P0709C', d: 'DITL-112 #C' }
  };
  /* id, y, letter, suction valve, strainer, check, discharge valve, recirc check, recirc valve */
  const ROWS = [
    ['PA', 230, 'A', 'V-MU0003', 'STR-MU0001', 'V-MU0006', 'V-MU0007', 'V-MU0012', 'V-MU0013'],
    ['PB', 445, 'B', 'V-MU0004', 'STR-MU0002', 'V-MU0008', 'V-MU0009', 'V-MU0014', 'V-MU0015'],
    ['PC', 660, 'C', 'V-MU0005', 'STR-MU0003', 'V-MU0010', 'V-MU0011', 'V-MU0016', 'V-MU0017']
  ];
  const CX = 560; /* pump centre */

  function art() {
    const b = H.scene(PX);
    const zone = (x, w, s) =>
      b.add(
        `<rect x="${x}" y="8" width="${w}" height="864" rx="6" fill="#ffffff" fill-opacity=".018"/>` +
          T(x + 12, 28, s, 'hs-zone')
      );
    zone(8, 252, 'SUPPLY · DEMI WATER TANKS');
    zone(268, 600, 'MAKE-UP WATER PUMPS · DITL-112');
    zone(876, 150, 'HEADER');
    zone(1034, 558, '#1 UNIT USERS · MU-1-020 12"');
    const man = (x, y, lab, open, o = {}) => b.add(H.valve(x, y, Object.assign({ lab, open, px: PX }, o)));

    /* ---------- demi water tanks: outlets, suction header MU-0-003 12" ---------- */
    b.pipe(
      [
        [200, 330],
        [280, 330]
      ],
      { w: 11, f: 'sucA' }
    );
    b.pipe(
      [
        [200, 600],
        [280, 600]
      ],
      { w: 11, f: 'sucB' }
    );
    b.pipe(
      [
        [280, 330],
        [280, 230],
        [530, 230]
      ],
      { w: 11, f: 'sA' }
    );
    b.pipe(
      [
        [280, 330],
        [280, 445]
      ],
      { w: 11, f: 'sB1' }
    );
    b.pipe(
      [
        [280, 600],
        [280, 445]
      ],
      { w: 11, f: 'sB2' }
    );
    b.pipe(
      [
        [280, 600],
        [280, 660],
        [530, 660]
      ],
      { w: 11, f: 'sC' }
    );
    b.pipe(
      [
        [280, 445],
        [530, 445]
      ],
      { w: 11, f: 'sB' }
    );
    b.tee(280, 330, { w: 11, f: 'sucA' }).tee(280, 600, { w: 11, f: 'sucB' }).tee(280, 445, { w: 11, f: 'sB' });
    man(240, 330, 'V-MU0001', 1, { la: 'up' });
    man(240, 600, 'V-MU0002', 1, { la: 'up' });
    b.add(
      H.tank(50, 110, 150, 260, 'A', {
        px: PX,
        max: 15,
        hit: 'TKA',
        sx: 125,
        marks: [[2, 'SOP 2 m', '#f2a531']],
        markIn: 1
      })
    );
    b.add(
      H.tank(50, 470, 150, 260, 'B', {
        px: PX,
        max: 15,
        hit: 'TKB',
        sx: 125,
        marks: [[2, 'SOP 2 m', '#f2a531']],
        markIn: 1
      })
    );
    b.txt(T(56, 398, 'T-0708A', 'hs-eq') + T(56, 758, 'T-0708B', 'hs-eq'));
    b.txt(H.vbox(138, 382, 'LIMU0708A', 'm', 'LIMU0708A', 58) + H.vbox(138, 742, 'LIMU0708B', 'm', 'LIMU0708B', 58));
    b.txt(
      T(16, 800, 'fill: CED1 permeate (water treatment)', 'hs-sub') +
        T(16, 814, 'MWP trip < 0.2 m (both tanks)', 'hs-sub')
    );

    /* ---------- pumps ---------- */
    ROWS.forEach(([id, y, n, sv, st, ck, dv, rck, rv], i) => {
      b.pipe(
        [
          [590, y],
          [720, y]
        ],
        { f: 'dr' + i }
      );
      b.pipe(
        i === 2
          ? [
              [720, y],
              [720, y - 55],
              [840, y - 55],
              [840, 390]
            ]
          : [
              [720, y],
              [720, y - 55],
              [840, y - 55]
            ],
        { w: 6, med: 'r', f: 'r' + i }
      );
      b.tee(720, y, { f: 'dr' + i });
      man(380, y, sv, 1);
      b.add(H.strainer(458, y, st, PX));
      b.txt(H.vbox(398, y - 52, 'DPIMU0709' + n, 'kg/cm²', 'DPIMU0709' + n, 58));
      b.add(H.pump(CX, y, id, PX));
      b.txt(
        T(CX - 44, y - 126, '-----', 'hs-st', `data-st="${id}" fill="#6b7480"`) +
          T(CX - 44, y - 110, MACH[id].n, 'hs-eq') +
          T(CX + 18, y - 110, MACH[id].t, 'hs-sub')
      );
      b.txt(H.vbox(CX + 64, y - 86, 'IIP0709' + n, 'A', 'IIP0709' + n, 54));
      b.add(H.check(640, y, 'ck' + i, ''));
      b.add(H.gauge(674, y, 'pg' + i, 'PG-MU0709-' + n));
      b.add(H.orifice(748, y - 55));
      b.add(
        `<g><title>${rck} · check valve</title><circle cx="776" cy="${y - 55}" r="8" fill="#1b252f" stroke="#090d11" stroke-width="1.4"/><line x1="776" y1="${y - 62}" x2="776" y2="${y - 48}" stroke="#cfd8e0" stroke-width="2" stroke-linecap="round" data-ck="rck${i}" data-cx="776" data-cy="${y - 62}"/></g>`
      );
      man(806, y - 55, rv, 1, { la: 'up' });
      man(800, y, dv, 1);
      b.add(`<title>${ck}</title>`);
    });
    b.txt(T(560, 62, 'MINIMUM FLOW RECIRCULATION (RO) TO T-0708A / B', 'hs-sub', 'text-anchor="middle"'));
    /* recirculation collector back to both tanks (V-MU0018 / 0019) */
    b.pipe(
      [
        [840, 390],
        [840, 175]
      ],
      { w: 6, med: 'r', f: 'rc1' }
    );
    b.pipe(
      [
        [840, 175],
        [840, 40],
        [125, 40]
      ],
      { w: 6, med: 'r', f: 'rcAll' }
    );
    b.pipe(
      [
        [125, 40],
        [125, 112]
      ],
      { w: 6, med: 'r', f: 'rcHalf' }
    );
    b.pipe(
      [
        [125, 40],
        [30, 40],
        [30, 455],
        [125, 455],
        [125, 472]
      ],
      { w: 6, med: 'r', f: 'rcHalf' }
    );
    b.tee(840, 390, { w: 6, med: 'r', f: 'rc1' })
      .tee(840, 175, { w: 6, med: 'r', f: 'rcAll' })
      .tee(125, 40, { w: 6, med: 'r', f: 'rcAll' });
    man(125, 78, 'V-MU0018', 1, { vert: 1, la: 'r' });
    man(78, 455, 'V-MU0019', 1, { la: 'up' });

    /* ---------- discharge header MU-0-010 12" (PT-MU0709) ---------- */
    b.pipe(
      [
        [720, 230],
        [900, 230],
        [900, 400]
      ],
      { f: 'd0' }
    );
    b.pipe(
      [
        [900, 400],
        [900, 445]
      ],
      { f: 'h1' }
    );
    b.pipe(
      [
        [720, 445],
        [900, 445]
      ],
      { f: 'd1' }
    );
    b.pipe(
      [
        [900, 445],
        [900, 660]
      ],
      { f: 'h2' }
    );
    b.pipe(
      [
        [720, 660],
        [900, 660]
      ],
      { f: 'd2' }
    );
    b.pipe(
      [
        [900, 660],
        [900, 830],
        [990, 830]
      ],
      { f: 'u2' }
    );
    b.tee(900, 400, { f: 'u1' }).tee(900, 445, { f: 'd1' }).tee(900, 660, { f: 'd2' });
    b.add(
      `<line x1="900" y1="545" x2="930" y2="545" stroke="#9aa7b3" stroke-width="2"/>` +
        H.gauge(948, 563, 'pt', '', 18, 0).replace(/<line x1="948" y1="563"[^>]*\/>/, '')
    );
    b.txt(H.vbox(918, 580, 'PIMU0709', 'kg/cm²', 'PIMU0709', 62) + T(918, 620, 'SOP > 6.0 · 0 ~ 10', 'hs-sub'));
    b.txt(T(912, 316, 'MU-0-010 12"', 'hs-sub'));
    b.add(H.dest(990, 830, 170, 'TO UNIT 2', 'MU-2-020 12"'));

    /* ---------- unit 1: FT-MU1001 and the users ---------- */
    b.pipe(
      [
        [900, 400],
        [1060, 400]
      ],
      { w: 11, f: 'u1' }
    );
    b.add(
      `<g><title>FE-MU1001 · flow orifice</title><rect x="974" y="384" width="5" height="32" fill="#cfd8e0" stroke="#090d11"/></g>`
    );
    b.txt(H.vbox(946, 350, 'FIMU1001', 'm³/h', 'FIMU1001', 62));
    b.pipe(
      [
        [1060, 400],
        [1060, 260]
      ],
      { f: 'bd' }
    );
    b.pipe(
      [
        [1060, 260],
        [1060, 150]
      ],
      { f: 'blr' }
    );
    b.pipe(
      [
        [1060, 150],
        [1400, 150]
      ],
      { f: 'blr' }
    );
    b.pipe(
      [
        [1060, 150],
        [1060, 80],
        [1400, 80]
      ],
      { w: 4, f: 'smp' }
    );
    b.pipe(
      [
        [1060, 260],
        [1400, 260]
      ],
      { f: 'da' }
    );
    b.tee(1060, 400, { w: 11, f: 'u1' }).tee(1060, 260, { f: 'bd' }).tee(1060, 150, { f: 'blr' });
    man(1240, 80, 'SP-1-003 ½"', 0, { la: 'up' });
    man(1240, 150, 'initial fill (manual)', 0);
    man(1240, 260, 'initial fill (manual)', 0);
    b.add(H.dest(1400, 80, 170, 'SAMPLING', 'K1AU3-PD-044'));
    b.add(H.dest(1400, 150, 170, '#1 BOILER', 'initial fill only · MU-1-022 6"'));
    b.add(H.dest(1400, 260, 170, '#1 DEAERATOR', 'initial fill only · MU-1-023 6"'));
    /* condenser hotwell: LCV-MU1110 (ABC-031) parallel to MV-MU1001 (DITL-60) */
    b.pipe(
      [
        [1060, 400],
        [1110, 400]
      ],
      { f: 'hw' }
    );
    b.pipe(
      [
        [1110, 400],
        [1110, 350],
        [1290, 350],
        [1290, 400]
      ],
      { f: 'lcvF' }
    );
    b.pipe(
      [
        [1110, 400],
        [1110, 450],
        [1290, 450],
        [1290, 400]
      ],
      { f: 'movF' }
    );
    b.pipe(
      [
        [1290, 400],
        [1400, 400]
      ],
      { f: 'hw' }
    );
    b.tee(1110, 400, { f: 'hw' }).tee(1290, 400, { f: 'hw' });
    b.add(
      H.valve(1200, 350, {
        kind: 'cv',
        id: 'LCV',
        px: PX,
        lab: 'LCV-MU1110',
        la: 'up',
        title: 'LCV-MU1110 condenser make-up level control valve · ABC-031 LICCD1110A'
      })
    );
    b.add(
      H.valve(1200, 450, {
        kind: 'mov',
        id: 'MV',
        px: PX,
        lab: 'MV-MU1001',
        title: 'MV-MU1001 make-up water to condenser shut-off MOV · DITL-60'
      })
    );
    b.txt(H.vbox(1310, 312, 'LCVMU1110', '%', 'LCV', 44));
    b.txt(H.vbox(1300, 470, 'MVMU1001', '%', 'MV', 44));
    b.add(H.dest(1400, 400, 170, '#1 CONDENSER HOTWELL', 'MU-1-024 8" · 028 CONDENSATE'));
    /* expansion tank T-1109: MU-1-021 3", V-MU1031, XV-MU1109 (bypass V-MU1033), V-MU1032 */
    b.pipe(
      [
        [1060, 400],
        [1060, 575],
        [1330, 575]
      ],
      { w: 7, f: 'et' }
    );
    b.pipe(
      [
        [1150, 575],
        [1150, 528],
        [1230, 528],
        [1230, 575]
      ],
      { w: 6, f: 'byp' }
    );
    b.tee(1150, 575, { w: 7, f: 'et' }).tee(1230, 575, { w: 7, f: 'et' });
    man(1100, 575, 'V-MU1031', 1);
    man(1280, 575, 'V-MU1032', 1);
    man(1190, 528, 'V-MU1033 bypass', 0, { la: 'up' });
    b.add(
      H.valve(1190, 575, {
        kind: 'xv',
        id: 'XV',
        px: PX,
        lab: 'XV-MU1109',
        title: 'XV-MU1109 make-up water to expansion tank inlet shut-off · DITL-78'
      })
    );
    b.txt(
      T(1190, 625, '-----', 'hs-st', 'text-anchor="middle" data-k="xvst" fill="#6b7480"') +
        T(1190, 640, 'AUTO: open < 40 %, close > 85 %', 'hs-sub', 'text-anchor="middle"')
    );
    b.pipe(
      [
        [1390, 786],
        [1390, 830],
        [1470, 830]
      ],
      { med: 'c', f: 'acw' }
    );
    b.add(
      H.tank(1330, 545, 120, 241, 'E', {
        px: PX,
        max: 2.4,
        hit: 'ET',
        water: 'wc',
        sx: 1342,
        sy: 575,
        marks: [
          [1.7, 'LAH 85 %', '#f2a531'],
          [0.8, 'LAL 40 %', '#f2a531'],
          [0.3, 'LL 0.3 m', '#e5484d']
        ]
      })
    );
    b.txt(T(1330, 520, 'T-1109', 'hs-eq') + T(1330, 536, '#1 EXPANSION TANK', 'hs-sub'));
    b.txt(H.vbox(1516, 560, 'LT-CW1109', 'm', 'LICW1109', 56) + H.vbox(1516, 612, 'LICW1109', '%', 'ETPCT', 56));
    b.txt(T(1516, 652, 'LSLL-CW1109', 'hs-sub') + T(1516, 664, 'ACWP trip < 0.3 m', 'hs-sub'));
    b.add(H.dest(1470, 830, 112, 'ACWP SUCTION', '030 · CW-1-001 8"'));

    /* legend and sources */
    b.txt(
      H.legend(300, 862, [
        ['d', 'DEMINERALIZED WATER'],
        ['r', 'RECIRCULATION (min. flow)'],
        ['c', 'CLOSED COOLING WATER']
      ])
    );
    b.txt(
      T(
        1592,
        874,
        'K1AU3-PD-024 Rev D · PD-021 Rev D · SOP PR-OPE-5002 sec. 7 · values: plant model',
        'hs-sub',
        'text-anchor="end"'
      )
    );
    return b.svg();
  }

  /* ---------- live links ---------- */
  function makeup(g, api) {
    const pg = document.createElementNS(NS, 'g');
    pg.setAttribute('transform', H.fit(1600, 880));
    pg.innerHTML = art();
    g.append(pg);
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
      LCV: [
        'LCV-MU1110',
        'LCV-MU1110 condenser make-up level control valve · ABC-031 LICCD1110A (red = open, green = closed)'
      ],
      MV: ['MOR-MU1001', 'MV-MU1001 make-up water to condenser shut-off MOV · DITL-60 (red = open, green = closed)'],
      ET: ['LT-CW1109', 'T-1109 expansion tank · LT-CW1109']
    };
    for (const id in HIT)
      qa(`[data-hit="${id}"]`).forEach(h => {
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = HIT[id][1] + ' · click = info card';
        h.append(ti);
        h.addEventListener('click', e => (e.stopPropagation(), info(HIT[id][0])));
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
    const showV = k => {
      const t = q(`[data-v="${k}"]`);
      if (!t) return;
      const v = V[k],
        dp = /^DP/.test(k) ? 3 : /^(LI|PI)/.test(k) ? 2 : 1;
      t.textContent = fmt(v, dp);
      t.setAttribute('fill', v == null ? H.C.none : H.C.val);
    };
    for (const k in UNIT)
      api.reg(
        { t: 'val', tag: 'UNIT.' + UNIT[k], v: '' },
        X => ((V[k] = X && isFinite(X.v) ? +X.v : null), showV(k), tick()),
        null
      );
    api.reg(
      { t: 'valve', tag: 'LCVMU1110', v: '' },
      X => ((V.LCV = X && isFinite(X.v) ? +X.v : null), showV('LCV'), tick()),
      null
    );
    for (const k in IO) {
      const b = q(`[data-vbx="${k}"]`);
      if (!b) continue;
      const ti = document.createElementNS(NS, 'title');
      ti.textContent =
        IO[k] + (k === 'LCV' ? ' · MV of LICCD1110A (ABC-031)' : ' · plant model') + ' · click = its I/O list line';
      b.append(ti);
      b.addEventListener('click', e => (e.stopPropagation(), info(IO[k])));
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
    w: 1920,
    h: 1000,
    v2: true,
    screen: 'MU',
    style: 'steel',
    items: []
  });
})();
