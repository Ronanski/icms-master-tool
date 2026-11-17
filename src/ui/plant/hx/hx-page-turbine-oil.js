/* HX page in the REALISTIC look: turbine oil (user 2026-11-17: "Ganyan ang HMI na gsto ko. Dapat iyan lang makita ko n mga
   itsura").
   THE PICTURE: the turbine and the generator on top with the bearing oil header above their bearings; below on the left the
   main oil tank with its pumps, the two lube oil coolers and the oil filter; on the right the two control oil pumps, the
   control oil filter, the control oil header to the turbine valves and the trip oil behind the master trip solenoid.
   THE CONNECTIONS, as the temporary page 04 "036 TURBINE OIL" binds them (its sources: control room snapshot 36.PNG, the
   turbine control system model tcs.js, ABC-053 for the cooler outlet temperature): main oil tank T-1920 with its vapour
   extractor F-1937 and the oil purifier P-1941 (local panel); main oil pumps P-1922A / B (PTLO1922A / B), DC emergency oil
   pump P-1923 (PTLO1923) straight to the bearing header; lube oil coolers A / B (inlet TELO1001, outlet TE-LO1002-1 / -2,
   cooling water valve TCV-CW1201 of TICLO1002), oil filter, bearing oil header (PTLO10031 / 32 / 33) to the turbine and
   generator bearings (generator bearings No. 3 / No. 4: TEGE1007 / TEGE1008); control oil pumps P-1931A / B (PTLO1931A / B),
   control oil filter, control oil header (PTLO10061 / 62 / 63) to the main stop valves, the control valves and the combined
   reheat valves; master trip solenoid and trip oil (PTLO10071 / 72 / 73).
   NO flow diagram of the oil system was read for this page (it is a drawing of the turbine maker, not in K1AU3-A1-0-001):
   the tags, names and order are those of temporary page 04. Check the page against the maker's oil diagram before the
   temporary page is removed.
   The pumps belong to the turbine control system: a click opens their turbine control system faceplate. */
(function () {
  const { V, E, M, C, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const W_L = 6,
    W_S = 4;
  /* places (the drawing is 1760 x 1000) */
  const TX = 560,
    TY = 200 /* turbine: shaft centre */,
    BH = 100 /* bearing oil header */,
    RX = 880 /* riser to the bearing oil header */,
    KX = 200,
    KY = 760,
    KS = 2.8 /* main oil tank */,
    PX = 430,
    PS = 1.3,
    AY = 660,
    BY = 800,
    EY = 940 /* main oil pumps A, B, emergency oil pump */,
    SX = 330 /* suction line of the lube oil pumps */,
    DX = 640 /* discharge header of the main oil pumps */,
    CX = 780,
    CS = 1.6 /* coolers */,
    QX = 1180 /* control oil pumps */,
    HX2 = 1400 /* control oil riser */,
    CH = 330; /* control oil header */
  const MOP = 'm:MOP-A|m:MOP-B',
    LUBE = MOP + '|m:EOP',
    COP = 'm:COP-A|m:COP-B',
    ON = 'v:SI-TB>50';
  const drop = x => ({
    med: 'lube',
    w: W_S,
    pts: [
      [x, BH],
      [x, TY - 15]
    ],
    flow: LUBE
  });
  const act = (id, name, tag, x) => ({
    item: at(E('valve', name, tag, [], { kind: 'control', wrap: 12 }), x, 200, { id, rot: -90, lab: 't' }),
    pipe: { med: 'lube', w: W_S, pts: [[x, CH], id + '.l'], flow: COP }
  });
  const A = [
    act('msv', 'Main stop valves', 'A, B', 1250),
    act('cv', 'Control valves', 'A, B', 1400),
    act('crv', 'Combined reheat valves', 'A1, A2, B1, B2', 1550)
  ];

  page({
    id: 'turbine-oil',
    group: 'Turbine and generator',
    title: 'Turbine oil',
    about:
      'Lubricating oil to the turbine and generator bearings, control oil to the turbine valves. Tags and order as temporary page 04 binds them (control room snapshot 36).',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(E('tgset', '', '', [], { on: ON }), TX, TY, { id: 'tg', under: true }),
        at(E('generator', '', '', [], { on: ON }), TX - 332, TY, { id: 'gen', under: true }),
        at(E('tank', 'Main oil tank', 'T-1920', [], { id: 'mot', liquid: 'oil' }), KX, KY, {
          id: 'tk',
          sc: KS,
          lab: 'l'
        }),
        at(M('fan', 'VAPOUR EXTRACTOR', 'Vapour extractor', [], { tag: 'F-1937' }), KX + 34, 560, {
          id: 'vx',
          sc: 0.8,
          lab: 'r'
        }),
        at(M('pump', 'OIL PURIFIER', 'Oil purifier', [], { tag: 'P-1941' }), 90, 940, {
          id: 'pu',
          mir: true,
          lab: 'b'
        }),
        at(M('pump', 'MOP-A', 'Main oil pump A', [V('Discharge', 'PTLO1922A', K, 1)], { tag: 'P-1922A' }), PX, AY, {
          id: 'pa',
          sc: PS,
          lab: 'r'
        }),
        at(M('pump', 'MOP-B', 'Main oil pump B', [V('Discharge', 'PTLO1922B', K, 1)], { tag: 'P-1922B' }), PX, BY, {
          id: 'pb',
          sc: PS,
          lab: 'r'
        }),
        at(M('pump', 'EOP', 'Emergency oil pump', [V('Discharge', 'PTLO1923', K, 1)], { tag: 'P-1923' }), PX, EY, {
          id: 'pe',
          sc: PS,
          lab: 'r'
        }),
        at(E('cooler', 'Lube oil cooler A', '', []), CX, AY, { id: 'ca', sc: CS, lab: 'b' }),
        at(E('cooler', 'Lube oil cooler B', '', []), CX, BY, { id: 'cb', sc: CS, lab: 'b' }),
        at(C('TICLO1002', 'Oil temperature valve', { tag: 'TCV-CW1201', wrap: 14 }), 710, 575, { id: 'tv', lab: 't' }),
        at(L('makeup-cooling', 'Cooling water', { back: true }), 575, 575, { id: 'cwl' }),
        at(E('strainer', 'Oil filter', '', []), RX, 520, { id: 'of', rot: -90, lab: 'r' }),
        at(M('pump', 'COP-A', 'Control oil pump A', [V('Discharge', 'PTLO1931A', K, 1)], { tag: 'P-1931A' }), QX, AY, {
          id: 'qa',
          sc: PS,
          lab: 'r'
        }),
        at(M('pump', 'COP-B', 'Control oil pump B', [V('Discharge', 'PTLO1931B', K, 1)], { tag: 'P-1931B' }), QX, BY, {
          id: 'qb',
          sc: PS,
          lab: 'r'
        }),
        at(E('strainer', 'Control oil filter', '', []), HX2, 500, { id: 'cf', rot: -90, lab: 'r' }),
        ...A.map(a => a.item),
        at(E('valve', 'Master trip solenoid', '', [], { kind: 'control', wrap: 12 }), 1660, CH, {
          id: 'mts',
          lab: 't'
        }),
        at(L('turbine', 'Turbine'), 1000, 40, { id: 'tbl' })
      ],
      pipes: [
        /* main oil tank: vapour extractor, purifier, suction of the pumps */
        { med: 'air', w: W_S, pts: ['tk.t', [KX, 560], 'vx.in'], flow: 'm:VAPOUR EXTRACTOR', arrow: false },
        { med: 'air', w: W_S, pts: ['vx.out', [KX + 32, 500]], to: 'outdoor', flow: 'm:VAPOUR EXTRACTOR' },
        { med: 'lube', w: W_S, pts: ['tk.b', [KX, 940], 'pu.s'], flow: 'm:OIL PURIFIER', arrow: false },
        { med: 'lube', w: W_S, pts: ['pu.d', [92, 838], 'tk.l'], flow: 'm:OIL PURIFIER' },
        { med: 'lube', w: W_L, pts: ['tk.r', [SX, 838]], flow: LUBE, arrow: false },
        {
          med: 'lube',
          w: W_L,
          pts: [
            [SX, AY],
            [SX, EY]
          ],
          flow: LUBE,
          arrow: false
        },
        { med: 'lube', w: W_L, pts: [[SX, AY], 'pa.s'], flow: 'm:MOP-A', arrow: false },
        { med: 'lube', w: W_L, pts: [[SX, BY], 'pb.s'], flow: 'm:MOP-B', arrow: false },
        { med: 'lube', w: W_L, pts: [[SX, EY], 'pe.s'], flow: 'm:EOP', arrow: false },
        /* main oil pumps, coolers, filter, bearing oil header */
        {
          med: 'lube',
          w: W_L,
          pts: ['pa.d', [PX - 3, AY - 60], [DX, AY - 60], [DX, AY]],
          flow: 'm:MOP-A',
          arrow: false
        },
        {
          med: 'lube',
          w: W_L,
          pts: ['pb.d', [PX - 3, BY - 60], [DX, BY - 60], [DX, BY]],
          flow: 'm:MOP-B',
          arrow: false
        },
        {
          med: 'lube',
          w: W_L,
          pts: [
            [DX, AY],
            [DX, BY]
          ],
          flow: MOP,
          arrow: false
        },
        { med: 'lube', w: W_L, pts: [[DX, AY], 'ca.l'], flow: MOP },
        { med: 'lube', w: W_L, pts: [[DX, BY], 'cb.l'], flow: MOP },
        { med: 'lube', w: W_L, pts: ['cb.r', [RX, BY], [RX, AY]], flow: MOP, arrow: false },
        { med: 'lube', w: W_L, pts: ['ca.r', [RX, AY], 'of.l'], flow: MOP },
        { med: 'lube', w: W_L, pts: ['of.r', [RX, BH], [185, BH]], flow: LUBE },
        /* emergency oil pump straight to the bearing oil header */
        {
          med: 'lube',
          w: W_S,
          pts: ['pe.d', [PX - 3, EY - 60], [1010, EY - 60], [1010, 420], [RX, 420]],
          flow: 'm:EOP'
        },
        drop(TX + 149),
        drop(TX),
        drop(TX - 211),
        drop(TX - 281),
        drop(TX - 375),
        /* cooling water to the coolers */
        { med: 'cooling', w: W_S, pts: ['cwl.r', 'tv.l'], flow: 'l:TICLO1002', arrow: false },
        { med: 'cooling', w: W_S, pts: ['tv.r', [CX, 575], 'ca.t'], flow: 'l:TICLO1002' },
        /* control oil */
        { med: 'lube', w: W_S, pts: ['tk.b', [KX, 985], [1090, 985], [1090, AY]], flow: COP, arrow: false },
        { med: 'lube', w: W_S, pts: [[1090, AY], 'qa.s'], flow: 'm:COP-A', arrow: false },
        { med: 'lube', w: W_S, pts: [[1090, BY], 'qb.s'], flow: 'm:COP-B', arrow: false },
        { med: 'lube', w: W_S, pts: ['qa.d', [QX - 3, AY - 60], [HX2, AY - 60]], flow: 'm:COP-A', arrow: false },
        {
          med: 'lube',
          w: W_S,
          pts: ['qb.d', [QX - 3, BY - 60], [HX2, BY - 60], [HX2, AY - 60]],
          flow: 'm:COP-B',
          arrow: false
        },
        { med: 'lube', w: W_S, pts: [[HX2, AY - 60], 'cf.l'], flow: COP },
        { med: 'lube', w: W_S, pts: ['cf.r', [HX2, CH]], flow: COP, arrow: false },
        { med: 'lube', w: W_S, pts: [[1250, CH], 'mts.l'], flow: COP, arrow: false },
        { med: 'lube', w: W_S, pts: ['mts.r', [1730, CH], [1730, 490]], to: 'trip oil', flow: COP },
        ...A.map(a => a.pipe)
      ],
      taps: [
        {
          x: TX - 375,
          y: BH,
          side: 't',
          label: 'Generator bearing 3',
          key: 'TEGE1007',
          unit: '°C',
          dp: 0,
          tag: 'TEGE1007'
        },
        {
          x: TX - 245,
          y: BH,
          side: 't',
          label: 'Generator bearing 4',
          key: 'TEGE1008',
          unit: '°C',
          dp: 0,
          tag: 'TEGE1008'
        },
        {
          x: RX,
          y: 300,
          side: 'r',
          label: 'Bearing oil header',
          key: 'PTLO10031',
          key2: 'PTLO10032',
          unit: K,
          dp: 1,
          tag: 'PTLO10031 / 32'
        },
        { x: RX, y: 360, side: 'r', label: 'Third transmitter', key: 'PTLO10033', unit: K, dp: 1, tag: 'PTLO10033' },
        { x: DX, y: 765, side: 'r', label: 'Cooler inlet', key: 'TELO1001', unit: '°C', dp: 0, tag: 'TELO1001' },
        {
          x: RX,
          y: 765,
          side: 'r',
          label: 'Cooler outlet',
          key: 'TE-LO1002-1',
          key2: 'TE-LO1002-2',
          unit: '°C',
          dp: 0,
          tag: 'TE-LO1002-1 / -2'
        },
        {
          x: 1325,
          y: CH,
          side: 'b',
          label: 'Control oil header',
          key: 'PTLO10061',
          key2: 'PTLO10062',
          unit: K,
          dp: 1,
          tag: 'PTLO10061 / 62'
        },
        { x: 1475, y: CH, side: 'b', label: 'Third transmitter', key: 'PTLO10063', unit: K, dp: 1, tag: 'PTLO10063' },
        {
          x: 1730,
          y: 390,
          side: 'l',
          label: 'Trip oil',
          key: 'PTLO10071',
          key2: 'PTLO10072',
          unit: K,
          dp: 1,
          tag: 'PTLO10071 / 72'
        },
        { x: 1730, y: 440, side: 'l', label: 'Third transmitter', key: 'PTLO10073', unit: K, dp: 1, tag: 'PTLO10073' }
      ],
      texts: [
        { x: 560, y: 978, s: 'control oil from the main oil tank', cls: 'hx-note' },
        { x: 1020, y: 700, s: 'straight to the bearing oil header', cls: 'hx-note' }
      ]
    }
  });
})();
