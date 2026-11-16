/* HX sample of a FULL operator drawing (user 2026-11-17: "gawa ka muna ng sample mockup for hmi sa reheat system"; before that:
   "nakahiwalay ang controls, valves, ang nakadikit lamang o yung may flow ay yung mga major equipments").
   Here every valve, spray, drain pot and transmitter sits on its own line, in the order of the flow diagrams:
     K1AU3-PD-011 Rev D  main steam: stop valve MV-MS1391 and its bypass, drain pot DP-MS01, HP turbine bypass PCV-MS1020,
                         HP turbine exhaust, ventilator, warming steam, non-return valve, drain pots DP-CR01 / DP-CR02 / DP-MS02
     K1AU3-PD-012 Rev D  cold reheat and hot reheat: desuperheater, reheater headers, safety valves, start-up vent,
                         drain pots DP-HR01 / DP-HR02, the two reheat valves, LP turbine bypass PCV-HR1010
   What an operator expects on the page was checked against control room page 005 REHEATER STEAM SYSTEM (content only).
   The drawing is original: turbine on the left, boiler on the right, cold reheat out on the upper line, hot reheat back on the
   lower one. A second thread compared it with both sheets connection by connection (2026-11-17) and its findings are in.
   GREY = on the flow diagram, but hx-registry.js (what the app binds today) has no signal for it.
   Left out on purpose, all without a signal in the registry: hand valves other than the three isolating valves shown, test
   points and thermowells, the level switches LS-CR1001-1 / -2 of DP-CR01, PT-CR1901-3, PT-HR1901 / TE-HR1902 at reheat valve A,
   the motor drain valves of the two reheat valves (no tag on PD-012, only TP-1204 / TP-1205), the control valve leak-off line
   into the branch of reheat valve A, the warming line of the HP bypass to the deaerator (V-MS1511 / 1512, OR-MS1001). */
(function () {
  const { V, E, C, X, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  /* a drain pot under a steam line at (x, y) with its drain valve to the flash chamber */
  const drain = (id, x, y, valve, o) => ({
    items: [
      at(E('pot', '', '', []), x, y + 21, { id: id + 'p' }),
      at(valve, x, y + ((o && o.dy) || 78), { id: id + 'v', rot: -90, lab: (o && o.lab) || 'r' })
    ],
    pipes: [
      { med: 'drain', w: 2.4, arrow: false, pts: [[x, y], id + 'p.t'] },
      {
        med: 'drain',
        w: 2.4,
        arrow: false,
        pts: [id + 'p.b', id + 'v.r'],
        flow: valve.valve ? 'x:' + valve.valve : ''
      },
      {
        med: 'drain',
        w: 2.4,
        arrow: false,
        pts: [id + 'v.l', [x, y + ((o && o.dy) || 78) + 34]],
        to: 'flash chamber',
        toSide: o && o.toSide,
        flow: valve.valve ? 'x:' + valve.valve : ''
      }
    ]
  });
  const d1 = drain(
    'd1',
    385,
    452,
    X('XV-CR1011', '', { tag: 'XV-CR1011 · DP-CR01', cname: 'Cold reheat drain pot DP-CR01 valve' })
  );
  const d2 = drain('d2', 578, 452, E('valve', '', 'XV-CR1012 · DP-CR02', [], { kind: 'shutoff' }));
  const d3 = drain(
    'd3',
    640,
    690,
    X('XV-HR1021', '', { tag: 'XV-HR1021 · DP-HR01', cname: 'Hot reheat drain pot DP-HR01 valve' })
  );
  const d4 = drain(
    'd4',
    494,
    690,
    X('XV-HR1022', '', { tag: 'XV-HR1022 · DP-HR02', cname: 'Hot reheat drain pot DP-HR02 valve' }),
    { toSide: 'r' }
  );
  const d5 = drain('d5', 600, 186, E('valve', '', 'XV-MS1023 · DP-MS02', [], { kind: 'shutoff' }), {
    lab: 'l',
    dy: 60
  });
  const LOAD = 'v:ZI-CV>1',
    ICV = 'v:ZI-ICV>1',
    HPB = 'l:PICMS1006',
    LPB = 'l:PICHR1003';

  page({
    id: 'reheat-steam',
    group: 'New sample: full operator drawing',
    title: 'Reheat steam and turbine bypass',
    about:
      'Every valve, spray, drain pot and transmitter on its own line. Connections: flow diagrams K1AU3-PD-011 and PD-012 Rev D.',
    plan: {
      h: 1046,
      items: [
        /* ---- main steam to the turbine: stop valve with its bypass, drain pot, stop and control valves ---- */
        at(L('drum-steam', 'Main steam', { back: true }), 170, 44, { id: 'ms' }),
        at(X('MV-MS1391', 'Main steam stop valve', { wrap: 12 }), 170, 250, { id: 'msv', rot: -90, lab: 'l' }),
        at(X('MV-MS1392', 'Stop valve bypass'), 214, 250, { id: 'msb', rot: -90, lab: 'r' }),
        at(E('pot', '', '', []), 224, 333, { id: 'dms1p' }),
        at(X('XV-MS1011', '', { tag: 'XV-MS1011 · DP-MS01', cname: 'Main steam drain pot DP-MS01 valve' }), 224, 368, {
          id: 'dms1v',
          rot: 90,
          lab: 'r'
        }),
        at(
          E('valve', 'Stop and control valves', '', [V('Control valves', 'ZI-CV', '%')], {
            kind: 'control',
            on: LOAD,
            wrap: 16
          }),
          170,
          404,
          { id: 'cv', rot: -90, lab: 'l' }
        ),
        at(E('turbine', '', '', [], { w: 72, h: 60 }), 194, 452, { id: 'hp' }),
        /* ---- high pressure bypass ---- */
        at(E('valve', 'Isolating valve', 'V-MS1003 · manual', [], { kind: 'manual' }), 236, 186, { id: 'vms' }),
        at(C('PICMS1006', 'High pressure bypass valve', { tag: 'PCV-MS1020' }), 345, 186, { id: 'hpb' }),
        at(E('spray', '', '', []), 415, 186, { id: 'hps' }),
        at(
          C('TICMS1022', 'Bypass spray valve', { tag: 'TCV-FW1060', cname: 'High pressure bypass spray valve' }),
          495,
          92,
          { id: 'tcms' }
        ),
        at(X('XV-FW1061', 'Spray block valve', { cname: 'High pressure bypass spray block valve' }), 615, 92, {
          id: 'xfw61'
        }),
        at(L('feedwater', 'Feedwater', { back: true }), 790, 92, { id: 'fw1' }),
        ...d5.items,
        /* ---- cold reheat ---- */
        at(E('valve', 'Ventilator valve', 'FV-CR1902', [], { kind: 'control' }), 256, 508, {
          id: 'fv',
          rot: -90,
          lab: 'r'
        }),
        ...d1.items,
        at(L('aux-steam', 'Auxiliary steam', { back: true }), 330, 330, { id: 'aux1' }),
        at(X('MV-AS1394', 'Warming line drain valve', { wrap: 14 }), 410, 296, { id: 'wad', rot: -90, lab: 'r' }),
        at(
          E('valve', 'Turbine warming steam valve', 'MV-AS1011', [V('Position', 'ZT-AS1011', '%')], {
            kind: 'motor',
            wrap: 16,
            on: 'v:ZT-AS1011>1'
          }),
          448,
          384,
          { id: 'was', rot: -90, lab: 'r' }
        ),
        at(E('valve', 'Non-return valve', 'XV-CR1901', [], { kind: 'check' }), 512, 452, { id: 'nrv', lab: 'b' }),
        ...d2.items,
        at(C('PICAS1005', 'Cold reheat to auxiliary steam valve', { tag: 'PCV-AS1020-1 / -2', wrap: 14 }), 722, 396, {
          id: 'pas',
          rot: -90,
          lab: 'r'
        }),
        at(L('aux-steam', 'Auxiliary steam'), 722, 318, { id: 'aux2' }),
        at(X('MV-TS1001', 'Extraction 1 valve'), 790, 510, { id: 'ext', rot: -90, lab: 'r' }),
        at(L('extraction', 'High pressure heater 2'), 790, 568, { id: 'hph' }),
        at(E('spray', '', '', []), 990, 452, { id: 'dsh' }),
        at(C('TICHR1002', 'Reheater spray valve', { tag: 'TCV-FW1150', wrap: 14 }), 990, 386, {
          id: 'tfw50',
          rot: -90,
          lab: 'r'
        }),
        at(X('XV-FW1151', 'Spray block valve', { wrap: 14, cname: 'Reheater spray block valve' }), 990, 320, {
          id: 'xfw51',
          rot: -90,
          lab: 'r'
        }),
        at(L('feedwater', 'Feedwater', { back: true }), 990, 220, { id: 'fw2' }),
        at(C('HICBR1391', 'Superheater steam to reheater', { tag: 'MV-BR1391', kind: 'motor', wrap: 12 }), 1150, 380, {
          id: 'mbr',
          rot: -90,
          lab: 'r'
        }),
        at(L('drum-steam', 'Superheater panel 2 inlet', { back: true }), 1150, 276, { id: 'sh2' }),
        /* the reheater as the flow diagram has it: inlet header below, outlet header on top */
        at(E('reheater', 'Reheater', 'four tube assemblies', [], { w: 104, h: 124 }), 1196, 578, { id: 'rh' }),
        /* ---- hot reheat ---- */
        at(E('valve', '3 safety valves', 'ZV-HR1001 to 1003', [], { kind: 'safety' }), 990, 658, {
          id: 'sv',
          rot: 90,
          lab: 'r'
        }),
        at(E('vent', '', 'to silencers', []), 990, 620, { id: 'sil1', lab: 'r' }),
        at(E('valve', '', 'V-HR1003 · manual', [], { kind: 'manual' }), 900, 666, { id: 'vhr3', rot: -90, lab: 'l' }),
        at(C('PICHR1391', 'Reheater start-up vent valve', { tag: 'MV-HR1391', kind: 'motor', wrap: 18 }), 900, 618, {
          id: 'vent',
          rot: -90,
          lab: 'l'
        }),
        at(E('vent', '', 'silencer', []), 900, 574, { id: 'sil2', lab: 'r' }),
        ...d3.items,
        ...d4.items,
        at(
          E('valve', 'Reheat stop and intercept valves', 'B above, A below', [], { kind: 'plain', on: ICV }),
          478,
          608,
          { id: 'crvb' }
        ),
        at(E('valve', '', '', [], { kind: 'plain', on: ICV }), 478, 632, { id: 'crva' }),
        at(E('turbine', '', '', [], { w: 80, h: 110, flip: true }), 194, 620, { id: 'ilp' }),
        /* ---- low pressure bypass ---- */
        at(E('valve', 'Bypass isolating valve', 'V-HR1001 · manual', [], { kind: 'manual', wrap: 16 }), 468, 748, {
          id: 'vhr',
          rot: -90,
          lab: 'l'
        }),
        at(E('valve', '', 'XV-HR1010-1', [], { kind: 'shutoff' }), 404, 812, { id: 'xhr10' }),
        at(C('PICHR1003', 'Low pressure bypass valve', { tag: 'PCV-HR1010' }), 404, 850, { id: 'lpb', lab: 'b' }),
        at(E('spray', '', '', []), 336, 850, { id: 'lps' }),
        at(
          C('TICHR1012', 'Bypass spray valve', { tag: 'TCV-CD1115', cname: 'Low pressure bypass spray valve' }),
          420,
          960,
          { id: 'tcd', lab: 'b' }
        ),
        at(X('XV-CD1114', 'Spray block valve', { cname: 'Low pressure bypass spray block valve' }), 545, 960, {
          id: 'xcd',
          lab: 'b'
        }),
        at(L('condensate', 'Condensate', { back: true }), 712, 960, { id: 'cdl' }),
        at(
          E('condenser', 'Condenser', '', [V('Pressure', 'PT-CD1110', 'kg/cm² abs', 3)], { w: 112, h: 64 }),
          186,
          862,
          { id: 'cd', lab: 'b' }
        ),
        /* ---- reheat temperature by the flue gas dampers of the back pass ---- */
        at(
          C('TICHR1002A', 'Reheat temperature control', { sym: 'block', w: 124, h: 34, pv: '°C', pvdp: 0, wrap: 30 }),
          930,
          866,
          { id: 'tic' }
        ),
        at(C('HICHR1002A', 'Reheater pass damper', { sym: 'damper', tag: 'TCV-FG1116A-D' }), 1085, 866, {
          id: 'dma',
          lab: 'b'
        }),
        at(C('HICHR1002B', 'Superheater pass damper', { sym: 'damper', tag: 'TCV-FG1117A-D' }), 1200, 866, {
          id: 'dmb',
          lab: 'b'
        }),
        at(L('furnace-gas', 'Furnace and flue gas'), 1142, 996, { id: 'fgl' })
      ],
      pipes: [
        /* main steam: common line, then to the turbine */
        { med: 'steam', pts: ['ms.b', [170, 186]], flow: LOAD + '|' + HPB },
        { med: 'steam', pts: [[170, 186], 'msv.r'], flow: 'x:MV-MS1391', arrow: false },
        { med: 'steam', pts: ['msv.l', 'cv.r'], flow: 'x:MV-MS1391|x:MV-MS1392' },
        { med: 'steam', w: 2.6, pts: [[170, 214], [214, 214], 'msb.r'], flow: 'x:MV-MS1392', arrow: false },
        { med: 'steam', w: 2.6, pts: ['msb.l', [214, 286], [170, 286]], flow: 'x:MV-MS1392', arrow: false },
        { med: 'drain', w: 2.4, pts: [[170, 312], [224, 312], 'dms1p.t'], arrow: false },
        { med: 'drain', w: 2.4, pts: ['dms1p.b', 'dms1v.l'], flow: 'x:XV-MS1011', arrow: false },
        { med: 'drain', w: 2.4, pts: ['dms1v.r', [224, 396]], to: 'flash pipe', flow: 'x:XV-MS1011', arrow: false },
        { med: 'steam', pts: ['cv.l', 'hp.in'], flow: LOAD, arrow: false },
        /* high pressure bypass with its spray water */
        { med: 'steam', pts: [[170, 186], 'vms.l'], flow: HPB, arrow: false },
        { med: 'steam', pts: ['vms.r', 'hpb.l'], flow: HPB, arrow: false },
        { med: 'steam', pts: ['hpb.r', 'hps.l'], flow: HPB, arrow: false },
        { med: 'steam', pts: ['hps.r', [640, 186], [640, 452]], flow: HPB },
        ...d5.pipes,
        { med: 'water', w: 2.6, pts: ['fw1.l', 'xfw61.r'], flow: 'l:TICMS1022' },
        { med: 'water', w: 2.6, pts: ['xfw61.l', 'tcms.r'], flow: 'l:TICMS1022', arrow: false },
        { med: 'water', w: 2.6, pts: ['tcms.l', [415, 92], 'hps.t'], flow: 'l:TICMS1022' },
        /* cold reheat: turbine exhaust to the reheater inlet header */
        { med: 'reheat', pts: ['hp.r', 'nrv.l'], flow: LOAD },
        { med: 'reheat', pts: ['nrv.r', [640, 452]], flow: LOAD, arrow: false },
        { med: 'reheat', pts: [[640, 452], 'dsh.l'], flow: LOAD + '|' + HPB },
        { med: 'reheat', pts: ['dsh.r', [1150, 452]], flow: LOAD + '|' + HPB, arrow: false },
        {
          med: 'reheat',
          pts: [[1150, 452], [1264, 452], [1264, 668], [1196, 668], 'rh.b'],
          flow: LOAD + '|' + HPB + '|l:HICBR1391'
        },
        { med: 'reheat', w: 2.6, pts: [[256, 452], 'fv.r'], arrow: false },
        { med: 'reheat', w: 2.6, pts: ['fv.l', [256, 538]], to: 'flash chamber', arrow: false },
        ...d1.pipes,
        { med: 'steam', w: 2.6, pts: ['aux1.r', [448, 330], 'was.r'], flow: 'v:ZT-AS1011>1', arrow: false },
        { med: 'steam', w: 2.6, pts: ['was.l', [448, 452]], flow: 'v:ZT-AS1011>1', arrow: false },
        { med: 'drain', w: 2.4, pts: [[410, 330], 'wad.l'], flow: 'x:MV-AS1394', arrow: false },
        { med: 'drain', w: 2.4, pts: ['wad.r', [410, 264]], to: 'flash chamber', flow: 'x:MV-AS1394', arrow: false },
        ...d2.pipes,
        { med: 'reheat', w: 2.6, pts: [[722, 452], 'pas.l'], flow: 'l:PICAS1005', arrow: false },
        { med: 'reheat', w: 2.6, pts: ['pas.r', 'aux2.b'], flow: 'l:PICAS1005', arrow: false },
        { med: 'reheat', w: 2.6, pts: [[790, 452], 'ext.r'], flow: 'x:MV-TS1001', arrow: false },
        { med: 'reheat', w: 2.6, pts: ['ext.l', 'hph.t'], flow: 'x:MV-TS1001', arrow: false },
        { med: 'water', w: 2.6, pts: ['fw2.b', 'xfw51.r'], flow: 'l:TICHR1002', arrow: false },
        { med: 'water', w: 2.6, pts: ['xfw51.l', 'tfw50.r'], flow: 'l:TICHR1002', arrow: false },
        { med: 'water', w: 2.6, pts: ['tfw50.l', 'dsh.t'], flow: 'l:TICHR1002', arrow: false },
        { med: 'steam', w: 2.6, pts: ['sh2.b', 'mbr.r'], flow: 'l:HICBR1391', arrow: false },
        { med: 'steam', w: 2.6, pts: ['mbr.l', [1150, 452]], flow: 'l:HICBR1391', arrow: false },
        /* hot reheat: reheater outlet header back to the turbine */
        {
          med: 'reheat',
          pts: ['rh.tl', [1120, 523.5], [1120, 690], [900, 690]],
          flow: ICV + '|' + LPB + '|l:PICHR1391'
        },
        {
          med: 'reheat',
          pts: [
            [900, 690],
            [520, 690]
          ],
          flow: ICV + '|' + LPB
        },
        { med: 'reheat', pts: [[575, 690], [575, 608], 'crvb.r'], flow: ICV, arrow: false },
        { med: 'reheat', pts: ['crvb.l', [234, 608]], flow: ICV },
        { med: 'reheat', pts: [[520, 690], [520, 632], 'crva.r'], flow: ICV, arrow: false },
        { med: 'reheat', pts: ['crva.l', [234, 632]], flow: ICV, arrow: false },
        { med: 'steam', w: 2.4, pts: [[990, 690], 'sv.r'], arrow: false },
        { med: 'steam', w: 2.4, pts: ['sv.l', 'sil1.b'], arrow: false },
        { med: 'reheat', w: 2.6, pts: [[900, 690], 'vhr3.l'], flow: 'l:PICHR1391', arrow: false },
        { med: 'reheat', w: 2.6, pts: ['vhr3.r', 'vent.l'], flow: 'l:PICHR1391', arrow: false },
        { med: 'reheat', w: 2.6, pts: ['vent.r', 'sil2.b'], flow: 'l:PICHR1391', arrow: false },
        ...d3.pipes,
        ...d4.pipes,
        /* low pressure bypass to the condenser */
        { med: 'reheat', pts: [[520, 690], [468, 690], 'vhr.r'], flow: LPB, arrow: false },
        { med: 'reheat', pts: ['vhr.l', [468, 850], 'lpb.r'], flow: LPB, arrow: false },
        { med: 'reheat', w: 2, pts: [[448, 850], [448, 812], 'xhr10.r'], arrow: false },
        { med: 'reheat', w: 2, pts: ['xhr10.l', [360, 812], [360, 850]], arrow: false },
        { med: 'reheat', pts: ['lpb.l', 'lps.r'], flow: LPB, arrow: false },
        { med: 'reheat', pts: ['lps.l', [242, 850]], flow: LPB },
        { med: 'condensate', w: 2.6, pts: ['cdl.l', 'xcd.r'], flow: 'l:TICHR1012' },
        { med: 'condensate', w: 2.6, pts: ['xcd.l', 'tcd.r'], flow: 'l:TICHR1012', arrow: false },
        { med: 'condensate', w: 2.6, pts: ['tcd.l', [336, 960], 'lps.b'], flow: 'l:TICHR1012', arrow: false },
        /* turbine exhaust and the shaft */
        { med: 'steam', pts: [[186, 663], 'cd.t'], flow: ICV },
        {
          med: 'power',
          w: 3,
          pts: [
            [194, 474],
            [194, 580]
          ],
          arrow: false
        }
      ],
      signals: [{ pts: ['tic.r', 'dma.l'] }, { pts: ['dma.r', 'dmb.l'] }],
      taps: [
        { x: 170, y: 100, side: 'l', label: 'Pressure', key: 'PT-MS1006-1', unit: K, tag: 'PT-MS1006-1' },
        { x: 170, y: 146, side: 'l', label: 'Temperature', key: 'TT-MS1007', unit: '°C', dp: 0, tag: 'TT-MS1007' },
        { x: 700, y: 92, side: 't', label: 'Spray water', key: 'FT-FW1059', unit: 't/h', tag: 'FT-FW1059' },
        { x: 470, y: 186, side: 'b', label: 'After bypass', key: 'PT-MS1021', unit: K, tag: 'PT-MS1021' },
        {
          x: 552,
          y: 186,
          side: 'b',
          label: 'Temperature',
          key: 'TT-MS1022-1',
          key2: 'TT-MS1022-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-MS1022-1 / -2'
        },
        {
          x: 312,
          y: 452,
          side: 't',
          label: 'Exhaust',
          key: 'PICR19011',
          key2: 'PICR19012',
          unit: K,
          tag: 'PT-CR1901-1 / -2'
        },
        { x: 905, y: 452, side: 't', label: 'Pressure', key: 'PT-CR1003', unit: K, tag: 'PT-CR1003' },
        { x: 945, y: 452, side: 'b', label: 'Temperature', key: 'TT-CR1004', unit: '°C', dp: 0, tag: 'TT-CR1004' },
        { x: 990, y: 266, side: 'l', label: 'Spray water', key: 'FT-FW1149', unit: 't/h', tag: 'FT-FW1149' },
        {
          x: 1052,
          y: 452,
          side: 'b',
          label: 'After spray',
          key: 'TT-CR1005-1',
          key2: 'TT-CR1005-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-CR1005-1 / -2'
        },
        { x: 1232, y: 668, side: 'b', label: 'Inlet header', key: 'PT-CR1006', unit: K, tag: 'PT-CR1006' },
        { x: 1120, y: 562, side: 'l', label: 'Outlet header', key: 'PT-HR1001', unit: K, tag: 'PT-HR1001' },
        {
          x: 1062,
          y: 690,
          side: 'b',
          label: 'Outlet',
          key: 'TT-HR1002-1',
          key2: 'TT-HR1002-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-HR1002-1 / -2'
        },
        {
          x: 805,
          y: 690,
          side: 'b',
          label: 'Pressure',
          key: 'PT-HR1003-1',
          key2: 'PT-HR1003-2',
          unit: K,
          tag: 'PT-HR1003-1 / -2'
        },
        { x: 715, y: 690, side: 'b', label: 'Temperature', key: 'TT-HR1004', unit: '°C', dp: 0, tag: 'TT-HR1004' },
        { x: 300, y: 632, side: 'b', label: 'After reheat valve A', unit: K, tag: 'PT-ST1002-1 / -2 / -3' },
        { x: 194, y: 526, side: 'l', label: 'Speed', key: 'SI-TB', unit: 'rpm', dp: 0, tag: 'one shaft' },
        { x: 314, y: 850, side: 't', label: 'After bypass', unit: K, tag: 'PT-HR1011' },
        {
          x: 292,
          y: 850,
          side: 'b',
          label: 'Temperature',
          key: 'pv:TICHR1012',
          unit: '°C',
          dp: 0,
          tag: 'TT-HR1012-1 / -2'
        },
        { x: 628, y: 960, side: 'b', label: 'Spray water', key: 'FTCD1115', unit: 't/h', tag: 'FT-CD1115' }
      ],
      texts: [
        { x: 150, y: 448, s: 'High pressure', cls: 'hx-name', anchor: 'end' },
        { x: 150, y: 464, s: 'turbine', cls: 'hx-name', anchor: 'end' },
        { x: 150, y: 606, s: 'Intermediate and', cls: 'hx-name', anchor: 'end' },
        { x: 150, y: 622, s: 'low pressure', cls: 'hx-name', anchor: 'end' },
        { x: 150, y: 638, s: 'turbine', cls: 'hx-name', anchor: 'end' },
        { x: 364, y: 652, s: 'Intercept valves', key: 'ZI-ICV', unit: '%' },
        { x: 585, y: 440, s: 'Cold reheat', cls: 'hx-zone', anchor: 'middle' },
        { x: 690, y: 678, s: 'Hot reheat', cls: 'hx-zone', anchor: 'middle' },
        { x: 868, y: 806, s: 'Reheat temperature: flue gas dampers of the back pass', cls: 'hx-zone' }
      ]
    },
    trends: [
      {
        title: 'Reheat steam',
        pens: [
          ['Hot reheat temperature', 'TT-HR1002-1', '°C', 0],
          ['Hot reheat pressure', 'PT-HR1003-1', K],
          ['After reheater spray', 'TT-CR1005-1', '°C', 0],
          ['Reheater spray water', 'FT-FW1149', 't/h']
        ]
      },
      {
        title: 'Turbine bypass',
        pens: [
          ['High pressure bypass output', 'mv:PICMS1006', '%'],
          ['Low pressure bypass output', 'mv:PICHR1003', '%'],
          ['After high pressure bypass', 'TT-MS1022-1', '°C', 0],
          ['High pressure bypass spray water', 'FT-FW1059', 't/h']
        ]
      },
      {
        title: 'Reheat temperature control',
        pens: [
          ['Reheat temperature', 'pv:TICHR1002A', '°C', 0],
          ['Set point', 'sv:TICHR1002A', '°C', 0],
          ['Reheater pass damper', 'mv:HICHR1002A', '%'],
          ['Superheater pass damper', 'mv:HICHR1002B', '%']
        ]
      }
    ]
  });
})();
