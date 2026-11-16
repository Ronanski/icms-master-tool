/* HX sample of a FULL operator drawing (user 2026-11-17: "gawa ka muna ng sample mockup for hmi sa reheat system"; before that:
   "nakahiwalay ang controls, valves, ang nakadikit lamang o yung may flow ay yung mga major equipments").
   Here every valve, spray, drain pot and transmitter sits on its own line. The connections are read from the flow diagrams
   K1AU3-PD-011 (main steam: HP turbine exhaust, HP bypass, ventilator, warming steam, non-return valve) and K1AU3-PD-012
   (cold reheat and hot reheat) Rev D; the list of what an operator expects on the page was checked against control room page
   005 REHEATER STEAM SYSTEM. The drawing itself is original: turbine on the left, boiler on the right, cold reheat going out on
   the upper line and hot reheat coming back on the lower one.
   Items in grey are on the flow diagram but the app registry (hx-registry.js) has no signal for them yet. */
(function () {
  const { V, E, C, X, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  /* a drain pot under a steam line at (x, y) with its drain valve; valve = an item made with X (bound) or E (grey) */
  const drain = (id, x, y, valve) => ({
    items: [
      at(E('pot', '', '', []), x, y + 21, { id: id + 'p' }),
      at(valve, x, y + 80, { id: id + 'v', rot: -90, lab: 'r' })
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
        pts: [id + 'v.l', [x, y + 116]],
        to: 'flash chamber',
        flow: valve.valve ? 'x:' + valve.valve : ''
      }
    ]
  });
  const d1 = drain('d1', 290, 372, X('XV-CR1011', 'Drain DP-CR01', { cname: 'Cold reheat drain pot DP-CR01 valve' }));
  const d2 = drain('d2', 574, 372, E('valve', 'Drain DP-CR02', 'XV-CR1012', [], { kind: 'shutoff' }));
  const d3 = drain('d3', 640, 610, X('XV-HR1021', 'Drain DP-HR01', { cname: 'Hot reheat drain pot DP-HR01 valve' }));
  const d4 = drain('d4', 455, 610, X('XV-HR1022', 'Drain DP-HR02', { cname: 'Hot reheat drain pot DP-HR02 valve' }));
  const LOAD = 'v:ZI-CV>1',
    ICV = 'v:ZI-ICV>1';

  page({
    id: 'reheat-steam',
    group: 'New sample: full operator drawing',
    title: 'Reheat steam',
    about:
      'Every valve, spray, drain pot and transmitter on its own line. Connections: flow diagrams K1AU3-PD-011 and PD-012 Rev D.',
    plan: {
      h: 924,
      items: [
        /* ---- main steam, turbine valves, high pressure bypass ---- */
        at(L('drum-steam', 'Main steam', { back: true }), 126, 120, { id: 'ms' }),
        at(
          E('valve', 'Stop and control valves', '', [V('Position', 'ZI-CV', '%')], {
            kind: 'control',
            on: LOAD,
            wrap: 16
          }),
          126,
          268,
          { id: 'cv', rot: -90, lab: 'r' }
        ),
        at(E('turbine', '', '', [], { w: 72, h: 60 }), 150, 372, { id: 'hp' }),
        at(C('PICMS1006', 'High pressure bypass valve', { tag: 'PCV-MS1020' }), 300, 186, { id: 'hpb' }),
        at(E('spray', '', '', []), 372, 186, { id: 'hps' }),
        at(
          C('TICMS1022', 'Bypass spray valve', { tag: 'TCV-FW1060', cname: 'High pressure bypass spray valve' }),
          446,
          92,
          { id: 'tcms' }
        ),
        at(X('XV-FW1061', 'Spray block valve', { cname: 'High pressure bypass spray block valve' }), 568, 92, {
          id: 'xfw61'
        }),
        at(L('feedwater', 'Feedwater', { back: true }), 760, 92, { id: 'fw1' }),
        /* ---- cold reheat ---- */
        ...d1.items,
        at(E('valve', 'Ventilator valve', 'FV-CR1902', [], { kind: 'control' }), 345, 316, {
          id: 'fv',
          rot: -90,
          lab: 'l'
        }),
        at(L('aux-steam', 'Aux steam', { back: true }), 432, 258, { id: 'aux1' }),
        at(E('valve', 'Turbine warming steam valve', 'MV-AS1011', [], { kind: 'motor', wrap: 16 }), 432, 316, {
          id: 'was',
          rot: -90,
          lab: 'r'
        }),
        at(E('valve', 'Non-return valve', 'XV-CR1901', [], { kind: 'check' }), 512, 372, { id: 'nrv', lab: 'b' }),
        ...d2.items,
        at(C('PICAS1005', 'Cold reheat to auxiliary steam valve', { tag: 'PCV-AS1020', wrap: 14 }), 722, 316, {
          id: 'pas',
          rot: -90,
          lab: 'r'
        }),
        at(L('aux-steam', 'Auxiliary steam'), 722, 244, { id: 'aux2' }),
        at(X('MV-TS1001', 'Extraction 1 valve'), 790, 430, { id: 'ext', rot: -90, lab: 'r' }),
        at(L('extraction', 'High pressure heater 2'), 790, 496, { id: 'hph' }),
        at(E('spray', '', '', []), 990, 372, { id: 'dsh' }),
        at(C('TICHR1002', 'Reheater spray valve', { tag: 'TCV-FW1150', wrap: 14 }), 990, 306, {
          id: 'tfw50',
          rot: -90,
          lab: 'r'
        }),
        at(X('XV-FW1151', 'Spray block valve', { wrap: 14, cname: 'Reheater spray block valve' }), 990, 240, {
          id: 'xfw51',
          rot: -90,
          lab: 'r'
        }),
        at(L('feedwater', 'Feedwater', { back: true }), 990, 140, { id: 'fw2' }),
        at(C('HICBR1391', 'Superheater steam to reheater', { tag: 'MV-BR1391', kind: 'motor', wrap: 12 }), 1150, 300, {
          id: 'mbr',
          rot: -90,
          lab: 'r'
        }),
        at(L('drum-steam', 'Superheater 2 inlet', { back: true }), 1150, 196, { id: 'sh2' }),
        at(E('reheater', 'Reheater', 'four tube assemblies', [], { w: 104, h: 124 }), 1196, 498, {
          id: 'rh',
          lab: 'l'
        }),
        /* ---- hot reheat ---- */
        at(E('valve', '3 safety valves', 'ZV-HR1001 to 1003', [], { kind: 'safety' }), 985, 578, {
          id: 'sv',
          rot: -90,
          lab: 'r'
        }),
        at(E('vent', '', 'to silencers', []), 985, 540, { id: 'sil1', lab: 'r' }),
        at(C('PICHR1391', 'Reheater start-up vent valve', { tag: 'MV-HR1391', kind: 'motor', wrap: 18 }), 900, 566, {
          id: 'vent',
          rot: -90,
          lab: 'l'
        }),
        at(E('vent', '', 'silencer', []), 900, 522, { id: 'sil2', lab: 'r' }),
        ...d3.items,
        ...d4.items,
        at(E('valve', 'Reheat stop and intercept valves', 'A and B', [], { kind: 'plain', on: ICV }), 404, 528, {
          id: 'crvb'
        }),
        at(E('valve', '', '', [V('Position', 'ZI-ICV', '%')], { kind: 'plain', on: ICV }), 404, 552, {
          id: 'crva',
          lab: 'b'
        }),
        at(E('turbine', '', '', [], { w: 80, h: 110, flip: true }), 150, 540, { id: 'ilp' }),
        /* ---- low pressure bypass ---- */
        at(E('valve', 'Bypass isolating valve', 'V-HR1001 · manual', [], { kind: 'manual', wrap: 16 }), 380, 668, {
          id: 'vhr',
          rot: -90,
          lab: 'l'
        }),
        at(C('PICHR1003', 'Low pressure bypass valve', { tag: 'PCV-HR1010' }), 316, 770, { id: 'lpb' }),
        at(E('spray', '', '', []), 244, 770, { id: 'lps' }),
        at(
          C('TICHR1012', 'Bypass spray valve', {
            tag: 'TCV-CD1115',
            pv: '°C',
            pvdp: 0,
            cname: 'Low pressure bypass spray valve'
          }),
          404,
          840,
          { id: 'tcd', lab: 'b' }
        ),
        at(X('XV-CD1114', 'Spray block valve', { cname: 'Low pressure bypass spray block valve' }), 530, 840, {
          id: 'xcd',
          lab: 'b'
        }),
        at(L('condensate', 'Condensate', { back: true }), 650, 840, { id: 'cdl' }),
        at(
          E('condenser', 'Condenser', '', [V('Pressure', 'PT-CD1110', 'kg/cm² abs', 3)], { w: 112, h: 64 }),
          142,
          782,
          { id: 'cd', lab: 'b' }
        ),
        /* ---- reheat temperature by the flue gas dampers of the back pass ---- */
        at(
          C('TICHR1002A', 'Reheat temperature control', { sym: 'block', w: 124, h: 34, pv: '°C', pvdp: 0, wrap: 30 }),
          930,
          772,
          { id: 'tic' }
        ),
        at(C('HICHR1002A', 'Reheater pass damper', { sym: 'damper', tag: 'TCV-FG1116A-D' }), 1085, 772, {
          id: 'dma',
          lab: 'b'
        }),
        at(C('HICHR1002B', 'Superheater pass damper', { sym: 'damper', tag: 'TCV-FG1117A-D' }), 1200, 772, {
          id: 'dmb',
          lab: 'b'
        }),
        at(L('furnace-gas', 'Furnace and flue gas'), 1142, 890, { id: 'fgl' })
      ],
      pipes: [
        /* main steam to the turbine and to the bypass */
        { med: 'steam', pts: ['ms.b', [126, 186], 'hpb.l'], flow: 'l:PICMS1006' },
        { med: 'steam', pts: [[126, 186], 'cv.r'], flow: LOAD, arrow: false },
        { med: 'steam', pts: ['cv.l', 'hp.in'], flow: LOAD },
        { med: 'steam', pts: ['hpb.r', 'hps.l'], flow: 'l:PICMS1006', arrow: false },
        { med: 'steam', pts: ['hps.r', [640, 186], [640, 372]], flow: 'l:PICMS1006' },
        { med: 'water', w: 2.6, pts: ['fw1.l', 'xfw61.r'], flow: 'l:TICMS1022' },
        { med: 'water', w: 2.6, pts: ['xfw61.l', 'tcms.r'], flow: 'l:TICMS1022', arrow: false },
        { med: 'water', w: 2.6, pts: ['tcms.l', [372, 92], 'hps.t'], flow: 'l:TICMS1022' },
        /* cold reheat: turbine exhaust to the reheater */
        { med: 'reheat', pts: ['hp.r', 'nrv.l'], flow: LOAD },
        { med: 'reheat', pts: ['nrv.r', 'dsh.l'], flow: LOAD + '|l:PICMS1006' },
        { med: 'reheat', pts: ['dsh.r', [1196, 372], 'rh.t'], flow: LOAD + '|l:PICMS1006' },
        ...d1.pipes,
        { med: 'reheat', w: 2.6, pts: [[345, 372], 'fv.l'], arrow: false },
        { med: 'reheat', w: 2.6, pts: ['fv.r', [345, 282]], to: 'flash chamber', arrow: false },
        { med: 'steam', w: 2.6, pts: ['aux1.b', 'was.r'], arrow: false },
        { med: 'steam', w: 2.6, pts: ['was.l', [432, 372]], arrow: false },
        ...d2.pipes,
        { med: 'reheat', w: 2.6, pts: [[722, 372], 'pas.l'], flow: 'l:PICAS1005', arrow: false },
        { med: 'reheat', w: 2.6, pts: ['pas.r', 'aux2.b'], flow: 'l:PICAS1005', arrow: false },
        { med: 'reheat', w: 2.6, pts: [[790, 372], 'ext.r'], flow: 'x:MV-TS1001', arrow: false },
        { med: 'reheat', w: 2.6, pts: ['ext.l', 'hph.t'], flow: 'x:MV-TS1001', arrow: false },
        { med: 'water', w: 2.6, pts: ['fw2.b', 'xfw51.r'], flow: 'l:TICHR1002', arrow: false },
        { med: 'water', w: 2.6, pts: ['xfw51.l', 'tfw50.r'], flow: 'l:TICHR1002', arrow: false },
        { med: 'water', w: 2.6, pts: ['tfw50.l', 'dsh.t'], flow: 'l:TICHR1002', arrow: false },
        { med: 'steam', w: 2.6, pts: ['sh2.b', 'mbr.r'], flow: 'l:HICBR1391', arrow: false },
        { med: 'steam', w: 2.6, pts: ['mbr.l', [1150, 372]], flow: 'l:HICBR1391', arrow: false },
        /* hot reheat: reheater back to the turbine */
        { med: 'reheat', pts: ['rh.b', [1196, 610], [520, 610]], flow: ICV + '|l:PICHR1003' },
        { med: 'reheat', pts: [[575, 610], [575, 528], 'crvb.r'], flow: ICV },
        { med: 'reheat', pts: ['crvb.l', [190, 528]], flow: ICV, arrow: false },
        { med: 'reheat', pts: [[520, 610], [520, 552], 'crva.r'], flow: ICV, arrow: false },
        { med: 'reheat', pts: ['crva.l', [190, 552]], flow: ICV, arrow: false },
        { med: 'steam', w: 2.4, pts: [[985, 610], 'sv.l'], arrow: false },
        { med: 'steam', w: 2.4, pts: ['sv.r', 'sil1.b'], arrow: false },
        { med: 'reheat', w: 2.6, pts: [[900, 610], 'vent.l'], flow: 'l:PICHR1391', arrow: false },
        { med: 'reheat', w: 2.6, pts: ['vent.r', 'sil2.b'], flow: 'l:PICHR1391', arrow: false },
        ...d3.pipes,
        ...d4.pipes,
        /* low pressure bypass to the condenser */
        { med: 'reheat', pts: [[520, 610], [380, 610], 'vhr.r'], flow: 'l:PICHR1003', arrow: false },
        { med: 'reheat', pts: ['vhr.l', [380, 770], 'lpb.r'], flow: 'l:PICHR1003', arrow: false },
        { med: 'reheat', pts: ['lpb.l', 'lps.r'], flow: 'l:PICHR1003', arrow: false },
        { med: 'reheat', pts: ['lps.l', [198, 770]], flow: 'l:PICHR1003' },
        { med: 'condensate', w: 2.6, pts: ['cdl.l', 'xcd.r'], flow: 'l:TICHR1012', arrow: false },
        { med: 'condensate', w: 2.6, pts: ['xcd.l', 'tcd.r'], flow: 'l:TICHR1012', arrow: false },
        { med: 'condensate', w: 2.6, pts: ['tcd.l', [244, 840], 'lps.b'], flow: 'l:TICHR1012' },
        /* turbine exhaust and the shaft */
        { med: 'steam', pts: [[142, 583], 'cd.t'], flow: ICV },
        {
          med: 'power',
          w: 3,
          pts: [
            [150, 394],
            [150, 500]
          ],
          arrow: false
        }
      ],
      signals: [{ pts: ['tic.r', 'dma.l'] }, { pts: ['dma.r', 'dmb.l'] }],
      taps: [
        { x: 192, y: 186, side: 't', label: 'Turbine inlet', key: 'PT-MS1006-1', unit: K, tag: 'PT-MS1006' },
        { x: 664, y: 92, side: 't', label: 'Spray water', key: 'FT-FW1059', unit: 't/h', tag: 'FT-FW1059' },
        { x: 432, y: 186, side: 'b', label: 'After bypass', key: 'PT-MS1021', unit: K, tag: 'PT-MS1021' },
        {
          x: 520,
          y: 186,
          side: 'b',
          label: 'Temperature',
          key: 'TT-MS1022-1',
          key2: 'TT-MS1022-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-MS1022-1 / -2'
        },
        { x: 232, y: 372, side: 'b', label: 'Exhaust', key: 'PICR19011', unit: K, tag: 'PT-CR1901' },
        { x: 905, y: 372, side: 't', label: 'Pressure', key: 'PT-CR1003', unit: K, tag: 'PT-CR1003' },
        { x: 945, y: 372, side: 'b', label: 'Temperature', key: 'TT-CR1004', unit: '°C', dp: 0, tag: 'TT-CR1004' },
        { x: 990, y: 186, side: 'l', label: 'Spray water', key: 'FT-FW1149', unit: 't/h', tag: 'FT-FW1149' },
        {
          x: 1052,
          y: 372,
          side: 'b',
          label: 'After spray',
          key: 'TT-CR1005-1',
          key2: 'TT-CR1005-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-CR1005-1 / -2'
        },
        { x: 1196, y: 404, side: 'l', label: 'Inlet', key: 'PT-CR1006', unit: K, tag: 'PT-CR1006' },
        { x: 1140, y: 610, side: 'b', label: 'Outlet', key: 'PT-HR1001', unit: K, tag: 'PT-HR1001' },
        {
          x: 1040,
          y: 610,
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
          y: 610,
          side: 'b',
          label: 'Pressure',
          key: 'PT-HR1003-1',
          key2: 'PT-HR1003-2',
          unit: K,
          tag: 'PT-HR1003-1 / -2'
        },
        { x: 715, y: 610, side: 'b', label: 'Temperature', key: 'TT-HR1004', unit: '°C', dp: 0, tag: 'TT-HR1004' },
        { x: 150, y: 446, side: 'r', label: 'Speed', key: 'SI-TB', unit: 'rpm', dp: 0, tag: 'one shaft' },
        { x: 305, y: 840, side: 'b', label: 'Spray water', key: 'FTCD1115', unit: 't/h', tag: 'FT-CD1115' }
      ],
      texts: [
        { x: 104, y: 366, s: 'High pressure', cls: 'hx-name', anchor: 'end' },
        { x: 104, y: 382, s: 'turbine', cls: 'hx-name', anchor: 'end' },
        { x: 104, y: 526, s: 'Intermediate and', cls: 'hx-name', anchor: 'end' },
        { x: 104, y: 542, s: 'low pressure', cls: 'hx-name', anchor: 'end' },
        { x: 104, y: 558, s: 'turbine', cls: 'hx-name', anchor: 'end' },
        { x: 1090, y: 360, s: 'Cold reheat', cls: 'hx-zone', anchor: 'middle' },
        { x: 690, y: 598, s: 'Hot reheat', cls: 'hx-zone', anchor: 'middle' },
        { x: 868, y: 710, s: 'Reheat temperature: flue gas dampers of the back pass', cls: 'hx-zone' }
      ]
    },
    trends: [
      {
        title: 'Reheat steam',
        pens: [
          ['Hot reheat temperature', 'TT-HR1002-1', '°C', 0],
          ['Hot reheat pressure', 'PT-HR1003-1', K],
          ['Cold reheat temperature', 'TT-CR1004', '°C', 0],
          ['After reheater spray', 'TT-CR1005-1', '°C', 0]
        ]
      },
      {
        title: 'Turbine bypass',
        pens: [
          ['High pressure bypass output', 'mv:PICMS1006', '%'],
          ['Low pressure bypass output', 'mv:PICHR1003', '%'],
          ['After high pressure bypass', 'TT-MS1022-1', '°C', 0],
          ['Reheater spray water', 'FT-FW1149', 't/h']
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
