/* HX page in the REALISTIC look: circulating sea water (user 2026-11-17: "Ganyan ang HMI na gsto ko. Dapat iyan lang makita
   ko n mga itsura").
   THE PICTURE: the pump inlet pool with the three vertical sea water pumps on the left, the debris filter and the condenser
   in the middle, the discharge to the sea on top; below on the right the three booster pumps, their debris filter and the
   three closed cooling water heat exchangers.
   THE CONNECTIONS, read from K1AU3-PD-020 Rev D (seawater system):
   - sea water pumps P-1501A / B / C into the 96 inch header SW-1-004, debris filter S-1502 (backwash valve MV-SW1001 at the
     local panel), two 66 inch lines (path A and path B) through the condenser H-1110: inlet PT / TT-SW1110-A1 / -B1, outlet
     PT / TT-SW1110-A2 / -B2; the 96 inch line SW-1-009 to the siphon pit and the sea water discharge channel;
   - the 24 inch line SW-1-055 from the header to the sea water booster pumps P-1503A / B / C, debris filter S-1504, the
     closed cooling water heat exchangers H-1107A / B / C, the 24 inch line SW-1-026 to the discharge;
   - condenser tube cleaning: ball recirculating pumps P-1113 / P-1114 with the ball separators and ball vessels (DITL-119);
   - pool level LT-SW1501; hypochlorite dosing pumps P-0762A / B and unloading pump P-0761A (K1AU3-PD-043, local panel).
   Machines, currents and values are the ones temporary page 01 "030 CIRCULATING WATER" binds (DITL-29A, DITL-30, DITL-39).
   Drawn simpler: the ball separators, ball vessels and V pieces of the tube cleaning are not drawn (the two tube cleaning
   systems are two machines under the condenser); the priming air ejectors Z-1131A / B are not drawn; the two paths of the
   condenser are one line with the values of path A / path B side by side.
   NOT on this page yet: the hand valves V-SW1002 ~ V-SW1020 (pump discharge, condenser inlet / outlet, booster discharge)
   that the temporary page lets the operator set: the new look has no hand valve piece yet. */
(function () {
  const { V, E, M, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const W_M = 9,
    W_B = 5,
    W_S = 3;
  /* places (the drawing is 1760 x 1000) */
  const PX = 330,
    PY = [290, 540, 790],
    PS = 1.5 /* sea water pumps */,
    SX = 240 /* suction from the pool */,
    HX0 = 460 /* discharge header */,
    MY = 540 /* main line through the condenser */,
    CX = 900,
    CY = 380,
    CS = 1.6 /* condenser */,
    TOP = 110 /* discharge to the sea */,
    BX = [1230, 1410, 1590],
    BY = 850 /* booster pumps */,
    EX = [1360, 1500, 1640],
    EY = 470; /* heat exchangers */
  const N = ['A', 'B', 'C'];
  const SW = N.map(n => 'm:SWP-' + n).join('|'),
    BP = N.map(n => 'm:SWBP-' + n).join('|');

  page({
    id: 'sea-water',
    group: 'Cooling and utilities',
    title: 'Circulating sea water',
    about:
      'Sea water through the condenser, and through the booster pumps to the closed cooling water heat exchangers (flow diagram K1AU3-PD-020 Rev D).',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(
          E('tank', 'Sea water pump inlet pool', '', [V('Level', 'LISW1501', 'm', 2)], {
            id: 'pool',
            w: 120,
            h: 70,
            level: ['LISW1501', -10, -5]
          }),
          120,
          MY,
          { id: 'pl', sc: 1.5, lab: 't' }
        ),
        ...N.map((n, i) =>
          at(
            M('vpump', 'SWP-' + n, 'Sea water pump ' + n, [V('Current', 'IIP1501' + n, 'A', 1)], { tag: 'P-1501' + n }),
            PX,
            PY[i],
            { id: 'p' + i, sc: PS, lab: 'b' }
          )
        ),
        at(M('strainer', 'S-1502', 'Debris filter', [], { tag: 'S-1502' }), 590, MY, { id: 'df1', sc: 1.6, lab: 'b' }),
        at(E('condenser', 'Condenser', 'H-1110', [], { id: 'cd', steam: 'v:SI-TB>50' }), CX, CY, {
          id: 'cd',
          sc: CS,
          lab: 't'
        }),
        at(M('pump', 'CTCS-A', 'Condenser tube cleaning A', [], { tag: 'P-1113' }), 820, 800, { id: 'ta', lab: 'b' }),
        at(M('pump', 'CTCS-B', 'Condenser tube cleaning B', [], { tag: 'P-1114' }), 1000, 800, { id: 'tb', lab: 'b' }),
        ...N.map((n, i) =>
          at(
            M('pump', 'SWBP-' + n, 'Booster pump ' + n, [V('Current', 'IIP1503' + n, 'A', 1)], { tag: 'P-1503' + n }),
            BX[i],
            BY,
            { id: 'b' + i, lab: 'b' }
          )
        ),
        at(M('strainer', 'S-1504', 'Debris filter', [], { tag: 'S-1504' }), 1710, 670, {
          id: 'df2',
          sc: 1.3,
          rot: -90,
          lab: 'l'
        }),
        ...N.map((n, i) => at(E('cooler', n, 'H-1107' + n, []), EX[i], EY, { id: 'e' + i, sc: 1.3, lab: 'r' })),
        at(L('makeup-cooling', 'Closed cooling water'), 1500, 290, { id: 'ccl' }),
        at(M('pump', 'P-0762A', 'Hypochlorite dosing pump A', [], { tag: 'P-0762A', wrap: 12 }), 80, 740, {
          id: 'ha',
          sc: 0.9,
          lab: 'r'
        }),
        at(M('pump', 'P-0762B', 'Hypochlorite dosing pump B', [], { tag: 'P-0762B', wrap: 12 }), 80, 840, {
          id: 'hb',
          sc: 0.9,
          lab: 'r'
        }),
        at(M('pump', 'P-0761A', 'Hypochlorite unloading pump', [], { tag: 'P-0761A', wrap: 12 }), 80, 940, {
          id: 'hu',
          sc: 0.9,
          lab: 'r'
        })
      ],
      pipes: [
        /* pool to the three pumps, the pumps into the header */
        { med: 'sea', w: W_M, pts: ['pl.r', [SX, 578]], flow: SW, arrow: false },
        {
          med: 'sea',
          w: W_M,
          pts: [
            [SX, PY[0] + 18],
            [SX, PY[2] + 18]
          ],
          flow: SW,
          arrow: false
        },
        ...N.flatMap((n, i) => [
          { med: 'sea', w: W_M, pts: [[SX, PY[i] + 18], 'p' + i + '.s'], flow: 'm:SWP-' + n, arrow: false },
          { med: 'sea', w: W_M, pts: ['p' + i + '.d', [HX0, PY[i] - 16]], flow: 'm:SWP-' + n, arrow: false }
        ]),
        {
          med: 'sea',
          w: W_M,
          pts: [
            [HX0, PY[0] - 16],
            [HX0, PY[2] - 16]
          ],
          flow: SW,
          arrow: false
        },
        /* header, debris filter, condenser, discharge */
        { med: 'sea', w: W_M, pts: [[HX0, MY], 'df1.l'], flow: SW },
        { med: 'sea', w: W_M, pts: ['df1.r', 'cd.l'], flow: SW },
        {
          med: 'sea',
          w: W_M,
          pts: ['cd.r', [1240, MY], [1240, TOP], [1560, TOP]],
          to: 'sea water discharge channel',
          flow: SW
        },
        /* booster pumps, their debris filter, the heat exchangers */
        {
          med: 'sea',
          w: W_B,
          pts: [
            [520, MY],
            [520, 975],
            [BX[2] - 90, 975]
          ],
          flow: BP,
          arrow: false
        },
        ...N.flatMap((n, i) => [
          {
            med: 'sea',
            w: W_B,
            pts: [[BX[i] - 90, 975], [BX[i] - 90, BY], 'b' + i + '.s'],
            flow: 'm:SWBP-' + n,
            arrow: false
          },
          { med: 'sea', w: W_B, pts: ['b' + i + '.d', [BX[i] - 2, 760]], flow: 'm:SWBP-' + n, arrow: false }
        ]),
        { med: 'sea', w: W_B, pts: [[BX[0] - 2, 760], [1710, 760], 'df2.l'], flow: BP },
        { med: 'sea', w: W_B, pts: ['df2.r', [1710, 560], [EX[0], 560]], flow: BP, arrow: false },
        ...N.flatMap((n, i) => [
          { med: 'sea', w: W_B, pts: [[EX[i], 560], 'e' + i + '.b'], flow: BP, arrow: false },
          { med: 'sea', w: W_B, pts: ['e' + i + '.t', [EX[i], 380]], flow: BP, arrow: false }
        ]),
        {
          med: 'sea',
          w: W_B,
          pts: [
            [EX[2], 380],
            [1290, 380],
            [1290, TOP]
          ],
          flow: BP
        },
        /* hypochlorite into the pool */
        { med: 'drain', w: W_S, pts: ['ha.d', [78, 640], [120, 640], 'pl.b'], flow: 'm:P-0762A|m:P-0762B' }
      ],
      taps: [
        {
          x: 720,
          y: MY,
          side: 't',
          label: 'Inlet pressure A / B',
          key: 'PISW1110A1',
          key2: 'PISW1110B1',
          unit: K,
          dp: 2,
          tag: 'PT-SW1110-A1 / -B1'
        },
        {
          x: 720,
          y: MY,
          side: 'b',
          label: 'Inlet temperature A / B',
          key: 'TISW1110A1',
          key2: 'TISW1110B1',
          unit: '°C',
          dp: 1,
          tag: 'TT-SW1110-A1 / -B1'
        },
        {
          x: 1130,
          y: MY,
          side: 't',
          label: 'Outlet pressure A / B',
          key: 'PISW1110A2',
          key2: 'PISW1110B2',
          unit: K,
          dp: 2,
          tag: 'PT-SW1110-A2 / -B2'
        },
        {
          x: 1130,
          y: MY,
          side: 'b',
          label: 'Outlet temperature A / B',
          key: 'TISW1110A2',
          key2: 'TISW1110B2',
          unit: '°C',
          dp: 1,
          tag: 'TT-SW1110-A2 / -B2'
        }
      ],
      texts: [
        { x: 1250, y: TOP - 14, s: 'siphon pit', cls: 'hx-note' },
        { x: 530, y: 965, s: 'to the booster pumps', cls: 'hx-note' },
        {
          x: 910,
          y: 900,
          s: 'Cleaning balls go with the sea water through the condenser tubes.',
          cls: 'hx-note',
          anchor: 'middle'
        },
        { x: 1500, y: 345, s: 'closed cooling water heat exchangers', cls: 'hx-note', anchor: 'middle' }
      ]
    }
  });
})();
