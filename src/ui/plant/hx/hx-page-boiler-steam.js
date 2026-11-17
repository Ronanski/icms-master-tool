/* HX page in the REALISTIC look: the steam side of the boiler, from the drum to the main steam line (user 2026-11-17: "Ganyan
   ang HMI na gsto ko. Dapat iyan lang makita ko n mga itsura").
   THE PICTURE: the boiler as it stands, cut open. Furnace with the drum on top and the two superheater panels in its upper
   front, the recycle cyclone with its seal pot behind it, then the back pass with the finishing superheater in the superheater
   pass. The steam goes: drum, superheater panel No. 1, spray 1, superheater panel No. 2, spray 2, finishing superheater, main
   steam line.
   THE CONNECTIONS:
     K1AU3-PD-019 Rev D  boiler vent and drain: drum T-1001 with its safety valves and silencers Z-1001 / Z-1002, level
                         transmitters LT-BR1001-1 / -2 / -3, pressure PT-BR1001; downcomers, evaporator panels and the furnace
                         water walls; back pass side, front / roof / rear and division walls; S.H. PANEL #1 (inlet header,
                         inlet tubes, outlet tubes, outlet header, TT-BR1110 before it, TT-BR1120-1 / -2 after it); S.H. PANEL
                         #2 (TT-BR1130-1 / -2 and PT-BR1130 before it, TT-BR1140-1 / -2 after it); FSH inlet header, lower,
                         intermediate and upper assembly, outlet header (TT-BR1150-1 / -2 and PT-BR1150 before it); the line
                         to the reheater with MV-BR1391; continuous blowdown MV-BD1002 to the flash tank T-1050, mass
                         blowdown MV-BD1001 to the blowdown tank T-1051
     K1AU3-PD-011 Rev D  main steam: finishing superheater outlet header, FT-MS1031, PT-MS1002, the blow-off valve
                         PCV-MS1001 to the silencer Z-1003, the safety valve ZV-MS1001, on to the turbine
     K1AU3-PD-017 Rev D  the spray water lines (block valve and spray valve, two parallel lines per spray)
   THE ARRANGEMENT: FHI boiler manual Part 2 Sect 1 and Part 4 Sect 1 (superheater panels No. 1 and No. 2 in the upper front of
   the furnace, finishing superheater in the back pass, 2 recycle cyclones with a seal pot each). What is a picture only is
   listed at the top of hx-real.js.
   Drawn simpler than the sheets:
   - the saturated steam leaves the drum through the walls of the back pass before it reaches panel No. 1 (PD-019): drawn as
     one line from the drum to the panel, with those words on it;
   - downcomers, evaporator panels and water walls: two short pipes between the drum and the furnace;
   - the boiler has 2 cyclones: one is drawn (the page is a section through the boiler);
   - feedwater reaches the drum through economizer 1, 2 and 3 in the back pass: drawn as a link at the drum (the Feedwater
     page), the three economizer temperatures stand beside the back pass.
   Left out on purpose, all without a signal in hx-registry.js: hand valves, vents and drains of the headers, the level gauges
   and switches of the drum (the three drum levels on the page are the COMPENSATED levels LIBR10011 / 2 / 3.PV of ABC-010: the
   transmitters LT-BR1001-1 / -2 / -3 give a raw differential pressure, the drawing corrects it with the drum pressure), the sampling and chemical dosing lines, the soot blowing steam take-off, TT-MS1004 (its value is
   the measured value of the main steam temperature controller on the page). */
(function () {
  const { V, E, C, X, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const W_ST = 6,
    W_SM = 4,
    W_WT = 3.4,
    W_GS = 14;
  /* places (the drawing is 1760 x 1000) */
  const FX = 620,
    FY = 300,
    FS = 1.75 /* furnace: roof centre */,
    DX = 620,
    DY = 170,
    DS = 1.4 /* drum */,
    CX = 850,
    CY = 316,
    CS = 1.7 /* cyclone */,
    BPX = 1090,
    BPY = 330,
    BS = 1.15 /* back pass: top left corner */,
    P1X = 340 /* the leg between panel 1 and panel 2 with spray 1 */,
    SATX = 300 /* saturated steam down to panel 1 */,
    LOWX = 28,
    LOWY = 968 /* panel 2 outlet round the boiler to the finishing superheater */,
    UPX = 1480 /* up to the finishing superheater inlet header, with spray 2 */,
    MSY = BPY + 37.5 * BS /* main steam line = the outlet header */,
    INY = BPY + 154 * BS;
  const fy = y => FY + y * FS;
  const STEAM = 'v:FT-MS1031>5',
    SP1 = 'l:TICBR1130',
    SP1B = 'v:ZT-FW1110-2>1',
    SP2 = 'l:TICBR1150',
    SP2B = 'v:ZT-FW1120-2>1';

  page({
    id: 'drum-steam',
    group: 'Boiler',
    title: 'Drum and superheaters',
    about:
      'The boiler as it stands, cut open: drum, superheater panels, finishing superheater, main steam. Connections: flow diagrams K1AU3-PD-019, PD-011 and PD-017 Rev D.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        /* ---- the large pieces ---- */
        at(E('furnace', '', '', [], { fire: STEAM }), FX, FY, { id: 'fu', under: true, sc: FS }),
        at(E('drum', '', '', [], { w: 190, id: 'drum' }), DX, DY, { id: 'dr', under: true, sc: DS }),
        at(E('cyclone', '', '', [], { flow: STEAM }), CX, CY, { id: 'cy', under: true, sc: CS }),
        at(E('sealpot', '', '', [], { flow: STEAM }), CX, CY + 196 * CS, { id: 'sp', under: true, sc: CS, mir: true }),
        at(E('backpass', '', '', [], { focus: 'sh', gasA: STEAM, gasB: STEAM, steam: STEAM }), BPX, BPY, {
          id: 'bp',
          under: true,
          sc: BS
        }),
        at(L('furnace-gas', 'Furnace and flue gas'), BPX + 108 * BS, BPY + 512 * BS + 24, { id: 'fgl' }),

        /* ---- drum: feedwater, safety valves, blowdown ---- */
        at(L('feedwater', 'Feedwater from the economizers', { back: true }), 420, 244, { id: 'fwl' }),
        at(E('valve', 'Drum safety valves', 'ZV-BR1001 / 1002', [], { kind: 'safety' }), 700, 124, {
          id: 'dsv',
          lab: 't'
        }),
        at(X('MV-BD1002', 'Continuous blowdown valve', { wrap: 14 }), 870, 150, { id: 'cbd', lab: 't' }),
        at(X('MV-BD1001', 'Mass blowdown valve', { wrap: 14 }), 1070, 196, { id: 'mbd', lab: 't' }),

        /* ---- spray 1: between superheater panel No. 1 and No. 2, two parallel water lines ---- */
        at(E('spray', '', '', [], { flow: SP1 + '|' + SP1B }), P1X, 440, { id: 'ds1', rot: 90 }),
        at(X('XV-FW1111-1', 'Block valve 1', { cname: 'Superheater spray 1 block valve (1)' }), 140, 356, {
          id: 'x11a',
          lab: 't'
        }),
        at(C('TICBR1130', 'Spray valve 1', { tag: 'TCV-FW1110-1', cname: 'Superheater spray 1 valves' }), 232, 356, {
          id: 't11a',
          lab: 't'
        }),
        at(X('XV-FW1111-2', 'Block valve 2', { cname: 'Superheater spray 1 block valve (2)' }), 140, 500, {
          id: 'x11b',
          lab: 'b'
        }),
        at(
          E('valve', 'Spray valve 2', 'TCV-FW1110-2', [V('Position', 'ZT-FW1110-2', '%')], {
            kind: 'control',
            on: SP1B
          }),
          232,
          500,
          { id: 't11b', lab: 'b' }
        ),
        at(L('feedwater', 'Feedwater', { back: true }), 62, 250, { id: 'fw1' }),
        at(L('reheat-steam', 'To reheater'), 455, 436, { id: 'rhl' }),
        at(C('TICBR1140', 'Superheater 2 outlet temperature', { sym: 'ctl', unit: '°C', pvdp: 0, wrap: 34 }), 150, 96, {
          id: 'tm1',
          lab: 't'
        }),

        /* ---- spray 2: before the finishing superheater ---- */
        at(E('spray', '', '', [], { flow: SP2 + '|' + SP2B }), UPX, 770, { id: 'ds2', rot: -90 }),
        at(C('TICBR1150', 'Spray valve 1', { tag: 'TCV-FW1120-1', cname: 'Superheater spray 2 valves' }), 1590, 716, {
          id: 't21a',
          lab: 't'
        }),
        at(X('XV-FW1121-1', 'Block valve 1', { cname: 'Superheater spray 2 block valve (1)' }), 1680, 716, {
          id: 'x21a',
          lab: 't'
        }),
        at(
          E('valve', 'Spray valve 2', 'TCV-FW1120-2', [V('Position', 'ZT-FW1120-2', '%')], {
            kind: 'control',
            on: SP2B
          }),
          1590,
          840,
          { id: 't21b', lab: 'b' }
        ),
        at(X('XV-FW1121-2', 'Block valve 2', { cname: 'Superheater spray 2 block valve (2)' }), 1680, 840, {
          id: 'x21b',
          lab: 'b'
        }),
        at(L('feedwater', 'Feedwater', { back: true }), 1690, 620, { id: 'fw2' }),
        at(C('TICMS1004', 'Main steam temperature', { sym: 'ctl', unit: '°C', pvdp: 0, wrap: 30 }), 1640, 540, {
          id: 'tm2',
          lab: 't'
        }),

        /* ---- main steam: blow-off, safety valve, to the turbine ---- */
        at(C('PICMS1002', 'Main steam blow-off valve', { tag: 'PCV-MS1001', wrap: 16 }), 1500, 300, {
          id: 'bov',
          rot: 90,
          lab: 'r'
        }),
        at(E('vent', '', '', [], { flow: 'l:PICMS1002' }), 1500, 258, { id: 'sil' }),
        at(E('valve', 'Safety valve', 'ZV-MS1001', [], { kind: 'safety' }), 1684, MSY - 4, { id: 'msv', lab: 't' }),
        at(L('reheat-steam', 'Main steam to the turbine'), 1620, 440, { id: 'msl' })
      ],
      pipes: [
        /* drum and furnace: downcomer and riser */
        { med: 'water', w: W_ST, pts: ['dr.dn1', 'fu.dn1'], arrow: false },
        { med: 'water', w: W_ST, pts: ['fu.dn2', 'dr.dn2'], flow: STEAM, arrow: false },
        { med: 'water', w: W_SM, pts: ['fwl.r', [DX - 55 * DS, 244], 'dr.fw'], flow: 'v:PT-BR1001-1>1' },
        /* gas: furnace, cyclone, back pass; the solids back to the furnace */
        { med: 'gas', w: W_GS, pts: ['fu.out', 'cy.in'], flow: STEAM, arrow: false },
        { med: 'gas', w: W_GS, pts: ['cy.gas', [CX, 256], [BPX + 46 * BS, 256], 'bp.gin'], flow: STEAM },
        { med: 'solid', w: W_ST, pts: ['sp.out', [752, CY + 212 * CS], [752, fy(290)], 'fu.ret'], flow: STEAM },
        /* saturated steam: drum to superheater panel No. 1 */
        { med: 'steam', w: W_ST, pts: ['dr.st', [DX, 110], [SATX, 110], [SATX, fy(16)], 'fu.sh1i'], flow: STEAM },
        /* panel No. 1 to panel No. 2 with spray 1 */
        { med: 'steam', w: W_ST, pts: ['fu.sh1o', [P1X, fy(40)], 'ds1.l'], flow: STEAM },
        { med: 'steam', w: W_ST, pts: ['ds1.r', [P1X, fy(104)], 'fu.sh2i'], flow: STEAM },
        { med: 'steam', w: W_SM, pts: [[455, fy(104)], 'rhl.b'], flow: 'l:HICBR1391', arrow: false },
        /* panel No. 2 round the boiler to the finishing superheater with spray 2 */
        { med: 'steam', w: W_ST, pts: ['fu.sh2o', [LOWX, fy(150)], [LOWX, LOWY], [UPX, LOWY], 'ds2.l'], flow: STEAM },
        { med: 'steam', w: W_ST, pts: ['ds2.r', [UPX, INY], 'bp.shin'], flow: STEAM },
        /* main steam */
        { med: 'steam', w: W_ST, pts: ['bp.shout', [1500, MSY]], flow: STEAM },
        { med: 'steam', w: W_ST, pts: [[1500, MSY], [1736, MSY], [1736, 440], 'msl.r'], flow: STEAM },
        { med: 'steam', w: W_SM, pts: [[1500, MSY], 'bov.l'], flow: 'l:PICMS1002', arrow: false },
        { med: 'steam', w: W_SM, pts: ['bov.r', 'sil.b'], flow: 'l:PICMS1002', arrow: false },
        /* blowdown */
        { med: 'drain', w: W_SM, pts: ['dr.r', [810, DY], [810, 150], 'cbd.l'], flow: 'x:MV-BD1002', arrow: false },
        { med: 'drain', w: W_SM, pts: ['cbd.r', [926, 150]], to: 'flash tank', flow: 'x:MV-BD1002' },
        { med: 'drain', w: W_SM, pts: [[810, DY], [810, 196], 'mbd.l'], flow: 'x:MV-BD1001', arrow: false },
        { med: 'drain', w: W_SM, pts: ['mbd.r', [1130, 196]], to: 'blowdown tank', flow: 'x:MV-BD1001' },
        /* spray 1 water */
        { med: 'water', w: W_WT, pts: ['fw1.b', [62, 356], 'x11a.l'], flow: SP1, arrow: false },
        { med: 'water', w: W_WT, pts: ['x11a.r', 't11a.l'], flow: SP1 },
        { med: 'water', w: W_WT, pts: [[62, 356], [62, 500], 'x11b.l'], flow: SP1B, arrow: false },
        { med: 'water', w: W_WT, pts: ['x11b.r', 't11b.l'], flow: SP1B },
        { med: 'water', w: W_WT, pts: ['t11a.r', [286, 356], [286, 440]], flow: SP1, arrow: false },
        { med: 'water', w: W_WT, pts: ['t11b.r', [286, 500], [286, 440]], flow: SP1B, arrow: false },
        { med: 'water', w: W_WT, pts: [[286, 440], 'ds1.t'], flow: SP1 + '|' + SP1B, arrow: false },
        /* spray 2 water */
        { med: 'water', w: W_WT, pts: ['fw2.b', [1736, 660], [1736, 716], 'x21a.r'], flow: SP2, arrow: false },
        { med: 'water', w: W_WT, pts: ['x21a.l', 't21a.r'], flow: SP2 },
        { med: 'water', w: W_WT, pts: [[1736, 716], [1736, 840], 'x21b.r'], flow: SP2B, arrow: false },
        { med: 'water', w: W_WT, pts: ['x21b.l', 't21b.r'], flow: SP2B },
        { med: 'water', w: W_WT, pts: ['t21a.l', [1532, 716], [1532, 770]], flow: SP2, arrow: false },
        { med: 'water', w: W_WT, pts: ['t21b.l', [1532, 840], [1532, 770]], flow: SP2B, arrow: false },
        { med: 'water', w: W_WT, pts: [[1532, 770], 'ds2.t'], flow: SP2 + '|' + SP2B, arrow: false }
      ],
      taps: [
        { x: 440, y: fy(16), side: 't', label: 'Panel 1 inlet', key: 'TT-BR1110', unit: '°C', dp: 0, tag: 'TT-BR1110' },
        {
          x: 430,
          y: fy(40),
          side: 'b',
          label: 'Panel 1 outlet',
          key: 'TT-BR1120-1',
          key2: 'TT-BR1120-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-BR1120-1 / -2'
        },
        {
          x: 390,
          y: fy(104),
          side: 'b',
          label: 'Panel 2 inlet',
          key: 'TT-BR1130-1',
          key2: 'TT-BR1130-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-BR1130-1 / -2'
        },
        { x: 474, y: fy(104), side: 'b', label: 'Pressure', key: 'PT-BR1130', unit: K, tag: 'PT-BR1130' },
        {
          x: 420,
          y: fy(150),
          side: 'b',
          label: 'Panel 2 outlet',
          key: 'TT-BR1140-1',
          key2: 'TT-BR1140-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-BR1140-1 / -2'
        },
        { x: 62, y: 430, side: 'r', label: 'Spray water', key: 'FT-FW1109', unit: 't/h', tag: 'FT-FW1109' },
        {
          x: UPX,
          y: 600,
          side: 'l',
          label: 'Inlet temperature',
          key: 'TT-BR1150-1',
          key2: 'TT-BR1150-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-BR1150-1 / -2'
        },
        { x: UPX, y: 680, side: 'l', label: 'Pressure', key: 'PT-BR1150', unit: K, tag: 'PT-BR1150' },
        { x: 1532, y: 800, side: 'r', label: 'Spray water', key: 'FT-FW1119', unit: 't/h', tag: 'FT-FW1119' },
        { x: 1410, y: MSY, side: 'b', label: 'Steam flow', key: 'FT-MS1031', unit: 't/h', tag: 'FT-MS1031' },
        { x: 1600, y: MSY, side: 'b', label: 'Pressure', key: 'PT-MS1002', unit: K, tag: 'PT-MS1002' }
      ],
      texts: [
        { x: DX, y: 262, s: 'Drum', cls: 'hx-name', anchor: 'middle' },
        { x: 474, y: 146, s: 'Pressure', key: 'PT-BR1001-1', unit: K, anchor: 'end' },
        { x: 474, y: 162, s: 'Level 1', key: 'ABC-010|LIBR10011.PV', unit: 'mm', dp: 0, anchor: 'end' },
        { x: 474, y: 178, s: 'Level 2', key: 'ABC-010|LIBR10012.PV', unit: 'mm', dp: 0, anchor: 'end' },
        { x: 474, y: 194, s: 'Level 3', key: 'ABC-010|LIBR10013.PV', unit: 'mm', dp: 0, anchor: 'end' },
        { x: 450, y: 100, s: 'through the walls of the back pass', cls: 'hx-note', anchor: 'middle' },
        { x: FX + 6, y: fy(200), s: 'Furnace', cls: 'hx-name', anchor: 'middle' },
        { x: FX - 30, y: fy(31), s: 'Panel 1', cls: 'hx-note', anchor: 'middle' },
        { x: FX - 14, y: fy(130), s: 'Panel 2', cls: 'hx-note', anchor: 'middle' },
        { x: CX, y: CY + 62, s: 'Cyclone', cls: 'hx-name', anchor: 'middle' },
        { x: 985, y: 640, s: 'Economizer 1 outlet', key: 'TT-BR1020', unit: '°C', dp: 0, anchor: 'middle' },
        { x: 985, y: 656, s: 'Economizer 2 outlet', key: 'TT-BR1030', unit: '°C', dp: 0, anchor: 'middle' },
        { x: 985, y: 672, s: 'Economizer 3 outlet', key: 'TT-BR1040', unit: '°C', dp: 0, anchor: 'middle' },
        { x: 1640, y: 596, s: 'sets spray 2', cls: 'hx-note', anchor: 'middle' },
        { x: 150, y: 152, s: 'sets spray 1', cls: 'hx-note', anchor: 'middle' }
      ]
    }
  });
})();
