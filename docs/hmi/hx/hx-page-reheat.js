/* HX sample of a FULL operator drawing in the REALISTIC look (user 2026-11-17: "gawa ka muna ng sample mockup for hmi sa reheat
   system", then "wag yung parang P&ID ha. realistic with animation ha. magaan din dapat sa app").
   THE PICTURE: the plant as it stands. Left = the turbine on its foundation, cut open (high pressure casing, intermediate and
   low pressure casing, one shaft, the condenser under the exhaust). Right = the back pass of the boiler, cut open, with the
   reheater coils in the reheater pass and the gas dampers below them. Between them the steam lines as pipes, every valve as a
   body with its actuator, every transmitter on its line with a small display.
   THE CONNECTIONS (unchanged, checked against the flow diagrams by a second thread on 2026-11-17):
     K1AU3-PD-011 Rev D  main steam: stop valve MV-MS1391 and its bypass, drain pot DP-MS01, HP turbine bypass PCV-MS1020,
                         HP turbine exhaust, ventilator, warming steam, non-return valve, drain pots DP-CR01 / DP-CR02 / DP-MS02
     K1AU3-PD-012 Rev D  cold reheat and hot reheat: desuperheater, reheater headers, safety valves, start-up vent,
                         drain pots DP-HR01 / DP-HR02, the two reheat valves, LP turbine bypass PCV-HR1010
   THE ARRANGEMENT: FHI boiler manual Part 2 Sect 1 and Part 4 Sect 3 (reheater in the front pass of the split back pass, inlet
   header below, outlet header on top, gas dampers under the passes), I/O list TT-FG1100 ~ 1113 (names of the banks). What is a
   picture only is listed at the top of hx-real.js.
   GREY = on the flow diagram, but hx-registry.js (what the app binds today) has no signal for it.
   Left out on purpose, all without a signal in the registry: hand valves other than the three isolating valves shown, test
   points and thermowells, the level switches LS-CR1001-1 / -2 of DP-CR01, PT-CR1901-3, PT-HR1901 / TE-HR1902 at reheat valve A,
   the motor drain valves of the two reheat valves (no tag on PD-012, only TP-1204 / TP-1205), the control valve leak-off line
   into the branch of reheat valve A, the warming line of the HP bypass to the deaerator (V-MS1511 / 1512, OR-MS1001). */
(function () {
  const { V, E, C, X, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  /* pipe sizes: the reheat lines are the big ones */
  const W_MS = 6,
    W_RH = 8,
    W_BY = 6,
    W_SM = 4,
    W_WT = 3.4,
    W_DR = 2.8;
  /* a drain pot under a steam line at (x, y) with its drain valve to the flash chamber.
     o.side 'l' / 'r': the drain leaves sideways (where there is no room below) */
  const drain = (id, x, y, hw, valve, o) => {
    o = o || {};
    const fl = valve.valve ? 'x:' + valve.valve : '',
      py = y + hw + 15,
      dy = o.dy || 62;
    if (o.side) {
      const s = o.side === 'r' ? 1 : -1,
        vy = py + 30,
        vx = x + s * (o.dx || 44);
      return {
        items: [
          at(E('pot', '', '', []), x, py, { id: id + 'p' }),
          at(valve, vx, vy, { id: id + 'v', lab: o.lab || 'b', yn: o.yn })
        ],
        pipes: [
          { med: 'drain', w: W_DR, arrow: false, pts: [[x, y + hw], id + 'p.t'] },
          {
            med: 'drain',
            w: W_DR,
            arrow: false,
            pts: [id + 'p.b', [x, vy], id + 'v.' + (s > 0 ? 'l' : 'r')],
            flow: fl
          },
          {
            med: 'drain',
            w: W_DR,
            arrow: false,
            pts: [id + 'v.' + (s > 0 ? 'r' : 'l'), [vx + s * 32, vy]],
            to: o.to || 'flash chamber',
            flow: fl
          }
        ]
      };
    }
    return {
      items: [
        at(E('pot', '', '', []), x, py, { id: id + 'p' }),
        at(valve, x, y + dy, { id: id + 'v', rot: o.rot || -90, lab: o.lab || 'r', yn: o.yn })
      ],
      pipes: [
        { med: 'drain', w: W_DR, arrow: false, pts: [[x, y + hw], id + 'p.t'] },
        {
          med: 'drain',
          w: W_DR,
          arrow: false,
          pts: [id + 'p.b', id + 'v.' + ((o.rot || -90) < 0 ? 'r' : 'l')],
          flow: fl
        },
        {
          med: 'drain',
          w: W_DR,
          arrow: false,
          pts: [id + 'v.' + ((o.rot || -90) < 0 ? 'l' : 'r'), [x, y + dy + 34]],
          to: o.to || 'flash chamber',
          toSide: o.toSide,
          flow: fl
        }
      ]
    };
  };
  /* the drawing is 1760 x 1000 (16 : 9, one screen). Levels and places */
  const HY = 170 /* hot reheat */,
    MY = 310 /* main steam */,
    CY = 806 /* cold reheat */,
    TGX = 540,
    TGY = 578 /* the shaft; the turbine set is drawn 1.3 x */,
    TS = 1.3,
    BPX = 1450,
    BPY = 120 /* top left corner of the back pass, drawn 1.25 x */,
    BS = 1.25,
    RX = 1340 /* cold reheat riser to the inlet header */,
    BX = 1000 /* high pressure bypass */,
    JX = 1045 /* where the bypass joins the cold reheat */,
    LX = 72; /* low pressure bypass down to the condenser */
  const tx = x => TGX + x * TS,
    ty = y => TGY + y * TS,
    bx = x => BPX + x * BS,
    by = y => BPY + y * BS;
  const LOAD = 'v:ZI-CV>1',
    ICV = 'v:ZI-ICV>1',
    HPB = 'l:PICMS1006',
    LPB = 'l:PICHR1003',
    CR = LOAD + '|' + HPB,
    HR = ICV + '|' + LPB + '|l:PICHR1391';

  const dMS1 = drain(
    'dms1',
    752,
    MY,
    W_MS / 2,
    X('XV-MS1011', '', { tag: 'XV-MS1011 · DP-MS01', cname: 'Main steam drain pot DP-MS01 valve' }),
    { dy: 96, to: 'flash pipe' }
  );
  const dMS2 = drain('dms2', BX + 22, 640, W_BY / 2, E('valve', '', 'XV-MS1023 · DP-MS02', [], { kind: 'shutoff' }), {
    side: 'l',
    dx: 46
  });
  const dCR1 = drain(
    'dcr1',
    724,
    CY,
    W_RH / 2,
    X('XV-CR1011', '', { tag: 'XV-CR1011 · DP-CR01', cname: 'Cold reheat drain pot DP-CR01 valve' }),
    { side: 'l', dx: 50 }
  );
  const dCR2 = drain('dcr2', 978, CY, W_RH / 2, E('valve', '', 'XV-CR1012 · DP-CR02', [], { kind: 'shutoff' }), {
    dy: 56
  });
  const dHR1 = drain(
    'dhr1',
    740,
    HY,
    W_RH / 2,
    X('XV-HR1021', '', { tag: 'XV-HR1021 · DP-HR01', cname: 'Hot reheat drain pot DP-HR01 valve' }),
    { dy: 68, rot: 90, lab: 'l' }
  );
  const dHR2 = drain(
    'dhr2',
    392,
    HY,
    W_RH / 2,
    X('XV-HR1022', '', { tag: 'XV-HR1022 · DP-HR02', cname: 'Hot reheat drain pot DP-HR02 valve' }),
    { dy: 92, lab: 'l' }
  );

  page({
    id: 'reheat-steam',
    group: 'New sample: full operator drawing',
    title: 'Reheat steam and turbine bypass',
    about:
      'The plant as it stands, cut open: turbine, condenser and the back pass of the boiler. Connections: flow diagrams K1AU3-PD-011 and PD-012 Rev D.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        /* ---- the large pieces: the pipes pass in front of them ---- */
        at(E('floor', '', '', [], { w: 1720 }), 20, ty(310), { id: 'fl', under: true }),
        at(E('tgset', '', '', [], { on: 'v:SI-TB>50' }), TGX, TGY, { id: 'tg', under: true, sc: TS }),
        at(
          E('backpass', '', '', [], { gasA: 'l:HICHR1002A', gasB: 'l:HICHR1002B', steam: CR + '|l:HICBR1391' }),
          BPX,
          BPY,
          { id: 'bp', under: true, sc: BS }
        ),
        at(L('generator', 'Generator'), 152, TGY, { id: 'gen' }),

        /* ---- main steam to the turbine: stop valve with its bypass, drain pot, stop and control valves ---- */
        at(L('drum-steam', 'Main steam', { back: true }), 1265, MY, { id: 'ms' }),
        at(X('MV-MS1391', 'Main steam stop valve'), 860, MY, { id: 'msv', lab: 'b', yn: [-36, -32] }),
        at(X('MV-MS1392', 'Stop valve bypass'), 900, 272, { id: 'msb', rot: 90, lab: 'r', yn: [22, -34] }),
        ...dMS1.items,
        at(
          E('valve', 'Stop and control valves', '', [V('Position', 'ZI-CV', '%')], {
            kind: 'plain',
            on: LOAD,
            wrap: 16
          }),
          tx(46),
          462,
          { id: 'cv', rot: -90, lab: 'r' }
        ),

        /* ---- high pressure bypass ---- */
        at(E('valve', 'Isolating valve', 'V-MS1003 · manual', [], { kind: 'manual' }), BX, 354, {
          id: 'vms',
          rot: 90,
          lab: 'r'
        }),
        at(C('PICMS1006', 'High pressure bypass valve', { tag: 'PCV-MS1020' }), BX, 414, {
          id: 'hpb',
          rot: 90,
          lab: 'r'
        }),
        at(E('spray', '', '', [], { flow: 'l:TICMS1022' }), BX, 505, { id: 'hps', rot: 90 }),
        at(
          C('TICMS1022', 'Bypass spray valve', { tag: 'TCV-FW1060', cname: 'High pressure bypass spray valve' }),
          1072,
          498,
          { id: 'tcms', lab: 'b' }
        ),
        at(X('XV-FW1061', 'Spray block valve', { cname: 'High pressure bypass spray block valve' }), 1192, 498, {
          id: 'xfw61',
          lab: 'b'
        }),
        at(L('feedwater', 'Feedwater', { back: true }), 1290, 498, { id: 'fw1' }),
        ...dMS2.items,

        /* ---- cold reheat ---- */
        at(E('valve', 'Ventilator valve', 'FV-CR1902', [], { kind: 'control' }), 622, 780, { id: 'fv', lab: 'b' }),
        ...dCR1.items,
        at(
          E('valve', 'Turbine warming steam valve', 'MV-AS1011', [V('Position', 'ZT-AS1011', '%')], {
            kind: 'motor',
            wrap: 16,
            on: 'v:ZT-AS1011>1'
          }),
          812,
          866,
          { id: 'was', rot: -90, lab: 'r' }
        ),
        at(X('MV-AS1394', '', { tag: 'MV-AS1394 · warming line drain', cname: 'Warming line drain valve' }), 864, 928, {
          id: 'wad',
          lab: 'b'
        }),
        at(L('aux-steam', 'Auxiliary steam', { back: true }), 722, 946, { id: 'aux1' }),
        at(E('valve', 'Non-return valve', 'XV-CR1901', [], { kind: 'check' }), 912, CY, { id: 'nrv', lab: 't' }),
        ...dCR2.items,
        at(C('PICAS1005', 'Cold reheat to auxiliary steam valve', { tag: 'PCV-AS1020-1 / -2', wrap: 14 }), 1130, 866, {
          id: 'pas',
          rot: 90,
          lab: 'r'
        }),
        at(L('aux-steam', 'Auxiliary steam'), 1130, 944, { id: 'aux2' }),
        at(X('MV-TS1001', 'Extraction 1 valve'), 1290, 858, { id: 'ext', rot: 90, lab: 'r', yn: [22, -34] }),
        at(L('extraction', 'High pressure heater 2'), 1290, 918, { id: 'hph' }),
        at(E('spray', '', '', [], { flow: 'l:TICHR1002' }), RX, 690, { id: 'dsh', rot: -90 }),
        at(C('TICHR1002', 'Reheater spray valve', { tag: 'TCV-FW1150' }), 1268, 697, { id: 'tfw50', lab: 'b' }),
        at(X('XV-FW1151', 'Spray block valve', { cname: 'Reheater spray block valve' }), 1146, 697, {
          id: 'xfw51',
          lab: 'b',
          yn: [-38, -22]
        }),
        at(L('feedwater', 'Feedwater', { back: true }), 1100, 650, { id: 'fw2' }),
        at(C('HICBR1391', 'Superheater steam to reheater', { tag: 'MV-BR1391', kind: 'motor', wrap: 18 }), RX, 380, {
          id: 'mbr',
          rot: 90,
          lab: 'l'
        }),
        at(L('drum-steam', 'Superheater panel 2 inlet', { back: true }), 1240, 225, { id: 'sh2' }),

        /* ---- hot reheat ---- */
        at(E('valve', '3 safety valves', 'ZV-HR1001 to 1003', [], { kind: 'safety' }), 1200, HY - 4, {
          id: 'sv',
          lab: 'b'
        }),
        at(E('valve', '', 'V-HR1003 · manual', [], { kind: 'manual' }), 1090, 134, { id: 'vhr3', rot: -90, lab: 'l' }),
        at(C('PICHR1391', 'Reheater start-up vent valve', { tag: 'MV-HR1391', kind: 'motor', wrap: 18 }), 1090, 96, {
          id: 'vent',
          rot: -90,
          lab: 'l'
        }),
        at(E('vent', '', '', [], { flow: 'l:PICHR1391' }), 1090, 76, { id: 'sil' }),
        ...dHR1.items,
        at(
          E('valve', 'Reheat stop and intercept valves', 'A left, B right', [V('Position', 'ZI-ICV', '%')], {
            kind: 'plain',
            on: ICV,
            wrap: 16
          }),
          tx(-74),
          420,
          { id: 'crva', rot: -90, lab: 'l' }
        ),
        at(E('valve', '', '', [], { kind: 'plain', on: ICV }), tx(-46), 476, { id: 'crvb', rot: -90 }),
        ...dHR2.items,

        /* ---- low pressure bypass to the condenser ---- */
        at(E('valve', 'Bypass isolating valve', 'V-HR1001 · manual', [], { kind: 'manual', wrap: 24 }), 330, HY, {
          id: 'vhr',
          lab: 't'
        }),
        at(C('PICHR1003', 'Low pressure bypass valve', { tag: 'PCV-HR1010 · XV-HR1010-1' }), 220, HY, {
          id: 'lpb',
          lab: 'b'
        }),
        at(E('spray', '', '', [], { flow: 'l:TICHR1012', noz: 'b' }), LX, 240, { id: 'lps', rot: 90 }),
        at(
          C('TICHR1012', 'Bypass spray valve', { tag: 'TCV-CD1115', cname: 'Low pressure bypass spray valve' }),
          140,
          50,
          {
            id: 'tcd',
            lab: 'b'
          }
        ),
        at(X('XV-CD1114', 'Spray block valve', { cname: 'Low pressure bypass spray block valve' }), 262, 50, {
          id: 'xcd',
          lab: 'b'
        }),
        at(L('condensate', 'Condensate', { back: true }), 440, 50, { id: 'cdl' }),

        /* ---- reheat temperature: the controller and the two gas dampers of the back pass ---- */
        at(C('TICHR1002A', 'Reheat temperature control', { sym: 'ctl', unit: '°C', pvdp: 0, wrap: 30 }), 1660, 64, {
          id: 'tic',
          lab: 't'
        }),
        at(
          C('HICHR1002A', 'Reheater pass damper', { sym: 'louver', w: 112, tag: 'TCV-FG1116A-D', wrap: 14 }),
          bx(56),
          by(350),
          { id: 'dma', lab: 'b' }
        ),
        at(
          C('HICHR1002B', 'Superheater pass damper', { sym: 'louver', w: 112, tag: 'TCV-FG1117A-D', wrap: 14 }),
          bx(160),
          by(350),
          { id: 'dmb', lab: 'b' }
        ),
        at(L('furnace-gas', 'Furnace and flue gas'), bx(108), by(512) + 26, { id: 'fgl' })
      ],
      pipes: [
        /* main steam: common line, stop valve and its bypass, down into the high pressure casing */
        { med: 'steam', w: W_MS, pts: ['ms.l', [BX, MY]], flow: CR },
        {
          med: 'steam',
          w: W_MS,
          pts: [
            [BX, MY],
            [900, MY]
          ],
          flow: 'x:MV-MS1391|x:MV-MS1392',
          arrow: false
        },
        { med: 'steam', w: W_MS, pts: [[900, MY], 'msv.r'], flow: 'x:MV-MS1391', arrow: false },
        { med: 'steam', w: W_MS, pts: ['msv.l', [820, MY]], flow: 'x:MV-MS1391', arrow: false },
        { med: 'steam', w: W_SM, pts: [[900, MY], 'msb.r'], flow: 'x:MV-MS1392', arrow: false },
        { med: 'steam', w: W_SM, pts: ['msb.l', [900, 234], [820, 234], [820, MY]], flow: 'x:MV-MS1392', arrow: false },
        { med: 'steam', w: W_MS, pts: [[820, MY], [tx(46), MY], 'cv.r'], flow: LOAD },
        ...dMS1.pipes,
        { med: 'steam', w: W_MS, pts: ['cv.l', 'tg.hpIn'], flow: LOAD, arrow: false },
        /* high pressure bypass with its spray water */
        { med: 'steam', w: W_BY, pts: [[BX, MY], 'vms.l'], flow: HPB, arrow: false },
        { med: 'steam', w: W_BY, pts: ['vms.r', 'hpb.l'], flow: HPB, arrow: false },
        { med: 'steam', w: W_BY, pts: ['hpb.r', 'hps.l'], flow: HPB, arrow: false },
        { med: 'steam', w: W_BY, pts: ['hps.r', [BX, 640], [JX, 640], [JX, CY]], flow: HPB },
        ...dMS2.pipes,
        { med: 'water', w: W_WT, pts: ['fw1.l', 'xfw61.r'], flow: 'l:TICMS1022', arrow: false },
        { med: 'water', w: W_WT, pts: ['xfw61.l', 'tcms.r'], flow: 'l:TICMS1022' },
        { med: 'water', w: W_WT, pts: ['tcms.l', 'hps.t'], flow: 'l:TICMS1022', arrow: false },
        /* cold reheat: high pressure exhaust to the reheater inlet header */
        { med: 'reheat', w: W_RH, pts: ['tg.hpEx', [tx(110), CY], 'nrv.l'], flow: LOAD, vfirst: true },
        { med: 'reheat', w: W_RH, pts: ['nrv.r', [JX, CY]], flow: LOAD, arrow: false },
        { med: 'reheat', w: W_RH, pts: [[JX, CY], [RX, CY], 'dsh.l'], flow: CR },
        { med: 'reheat', w: W_RH, pts: ['dsh.r', [RX, by(260)]], flow: CR },
        { med: 'reheat', w: W_RH, pts: [[RX, by(260)], 'bp.rin'], flow: CR + '|l:HICBR1391', arrow: false },
        { med: 'reheat', w: W_SM, pts: [[tx(110), 780], 'fv.r'], arrow: false },
        { med: 'reheat', w: W_SM, pts: ['fv.l', [580, 780]], to: 'flash chamber', arrow: false },
        ...dCR1.pipes,
        { med: 'steam', w: W_SM, pts: ['aux1.r', [812, 946], 'was.l'], flow: 'v:ZT-AS1011>1', arrow: false },
        { med: 'steam', w: W_SM, pts: ['was.r', [812, CY]], flow: 'v:ZT-AS1011>1', arrow: false },
        { med: 'drain', w: W_DR, pts: [[812, 928], 'wad.l'], flow: 'x:MV-AS1394', arrow: false },
        { med: 'drain', w: W_DR, pts: ['wad.r', [896, 928]], to: 'flash chamber', flow: 'x:MV-AS1394', arrow: false },
        ...dCR2.pipes,
        { med: 'reheat', w: W_SM, pts: [[1130, CY], 'pas.l'], flow: 'l:PICAS1005', arrow: false },
        { med: 'reheat', w: W_SM, pts: ['pas.r', 'aux2.t'], flow: 'l:PICAS1005', arrow: false },
        { med: 'reheat', w: W_SM, pts: [[1290, CY], 'ext.l'], flow: 'x:MV-TS1001', arrow: false },
        { med: 'reheat', w: W_SM, pts: ['ext.r', 'hph.t'], flow: 'x:MV-TS1001', arrow: false },
        {
          med: 'water',
          w: W_WT,
          pts: ['fw2.b', [1100, 697], 'xfw51.l'],
          flow: 'l:TICHR1002',
          vfirst: true,
          arrow: false
        },
        { med: 'water', w: W_WT, pts: ['xfw51.r', 'tfw50.l'], flow: 'l:TICHR1002' },
        { med: 'water', w: W_WT, pts: ['tfw50.r', 'dsh.t'], flow: 'l:TICHR1002', arrow: false },
        { med: 'steam', w: W_SM, pts: ['sh2.r', [RX, 225], 'mbr.l'], flow: 'l:HICBR1391', arrow: false },
        { med: 'steam', w: W_SM, pts: ['mbr.r', [RX, by(260)]], flow: 'l:HICBR1391', arrow: false },
        /* hot reheat: reheater outlet header back to the turbine */
        { med: 'reheat', w: W_RH, pts: ['bp.rout', [1090, HY]], flow: HR },
        {
          med: 'reheat',
          w: W_RH,
          pts: [
            [1090, HY],
            [tx(-46), HY]
          ],
          flow: ICV + '|' + LPB
        },
        {
          med: 'reheat',
          w: W_RH,
          pts: [
            [tx(-46), HY],
            [tx(-74), HY]
          ],
          flow: ICV + '|' + LPB,
          arrow: false
        },
        { med: 'reheat', w: W_BY, pts: [[tx(-46), HY], 'crvb.r'], flow: ICV },
        { med: 'reheat', w: W_BY, pts: ['crvb.l', 'tg.ipB'], flow: ICV, arrow: false },
        { med: 'reheat', w: W_BY, pts: [[tx(-74), HY], 'crva.r'], flow: ICV },
        { med: 'reheat', w: W_BY, pts: ['crva.l', 'tg.ipA'], flow: ICV, arrow: false },
        { med: 'reheat', w: W_SM, pts: [[1090, HY], 'vhr3.l'], flow: 'l:PICHR1391', arrow: false },
        { med: 'reheat', w: W_SM, pts: ['vhr3.r', 'vent.l'], flow: 'l:PICHR1391', arrow: false },
        { med: 'reheat', w: W_SM, pts: ['vent.r', 'sil.b'], flow: 'l:PICHR1391', arrow: false },
        ...dHR1.pipes,
        ...dHR2.pipes,
        /* low pressure bypass to the condenser */
        { med: 'reheat', w: W_RH, pts: [[tx(-74), HY], 'vhr.r'], flow: LPB, arrow: false },
        { med: 'reheat', w: W_RH, pts: ['vhr.l', 'lpb.r'], flow: LPB, arrow: false },
        { med: 'reheat', w: W_RH, pts: ['lpb.l', [LX, HY], 'lps.l'], flow: LPB, arrow: false },
        { med: 'reheat', w: W_RH, pts: ['lps.r', [LX, ty(119)], 'tg.cdIn'], flow: LPB, vfirst: true },
        { med: 'condensate', w: W_WT, pts: ['cdl.l', 'xcd.r'], flow: 'l:TICHR1012', arrow: false },
        { med: 'condensate', w: W_WT, pts: ['xcd.l', 'tcd.r'], flow: 'l:TICHR1012' },
        { med: 'condensate', w: W_WT, pts: ['tcd.l', [44, 50], [44, 233], 'lps.b'], flow: 'l:TICHR1012', arrow: false }
      ],
      signals: [{ pts: ['tic.r', [1740, 64], [1740, by(350) - 16], 'dmb.a'] }, { pts: ['dmb.a', 'dma.a'] }],
      taps: [
        { x: 1180, y: MY, side: 't', label: 'Pressure', key: 'PT-MS1006-1', unit: K, tag: 'PT-MS1006-1' },
        { x: 1100, y: MY, side: 't', label: 'Temperature', key: 'TT-MS1007', unit: '°C', dp: 0, tag: 'TT-MS1007' },
        { x: 1131, y: 498, side: 't', label: 'Spray water', key: 'FT-FW1059', unit: 't/h', tag: 'FT-FW1059' },
        { x: BX, y: 560, side: 'l', label: 'After bypass', key: 'PT-MS1021', unit: K, tag: 'PT-MS1021' },
        {
          x: BX,
          y: 606,
          side: 'l',
          label: 'Temperature',
          key: 'TT-MS1022-1',
          key2: 'TT-MS1022-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-MS1022-1 / -2'
        },
        {
          x: tx(110),
          y: 716,
          side: 'l',
          label: 'Exhaust',
          key: 'PICR19011',
          key2: 'PICR19012',
          unit: K,
          tag: 'PT-CR1901-1 / -2'
        },
        { x: RX, y: 778, side: 'r', label: 'Pressure', key: 'PT-CR1003', unit: K, tag: 'PT-CR1003' },
        { x: RX, y: 730, side: 'r', label: 'Temperature', key: 'TT-CR1004', unit: '°C', dp: 0, tag: 'TT-CR1004' },
        { x: 1212, y: 697, side: 't', label: 'Spray water', key: 'FT-FW1149', unit: 't/h', tag: 'FT-FW1149' },
        {
          x: RX,
          y: 600,
          side: 'l',
          label: 'After spray',
          key: 'TT-CR1005-1',
          key2: 'TT-CR1005-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-CR1005-1 / -2'
        },
        { x: 1392, y: by(260), side: 'b', label: 'Inlet header', key: 'PT-CR1006', unit: K, tag: 'PT-CR1006' },
        { x: 1392, y: HY, side: 'b', label: 'Outlet header', key: 'PT-HR1001', unit: K, tag: 'PT-HR1001' },
        {
          x: 1300,
          y: HY,
          side: 't',
          label: 'Outlet',
          key: 'TT-HR1002-1',
          key2: 'TT-HR1002-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-HR1002-1 / -2'
        },
        {
          x: 990,
          y: HY,
          side: 'b',
          label: 'Pressure',
          key: 'PT-HR1003-1',
          key2: 'PT-HR1003-2',
          unit: K,
          tag: 'PT-HR1003-1 / -2'
        },
        { x: 900, y: HY, side: 't', label: 'Temperature', key: 'TT-HR1004', unit: '°C', dp: 0, tag: 'TT-HR1004' },
        { x: tx(-74), y: 470, side: 'l', label: 'After reheat valve A', unit: K, tag: 'PT-ST1002-1 / -2 / -3' },
        {
          x: TGX,
          y: ty(-15),
          side: 't',
          label: 'Speed',
          key: 'SI-TB',
          unit: 'rpm',
          dp: 0,
          digits: 4.4,
          tag: 'one shaft'
        },
        { x: LX, y: 350, side: 'r', label: 'After bypass', unit: K, tag: 'PT-HR1011' },
        {
          x: LX,
          y: 440,
          side: 'r',
          label: 'Temperature',
          key: 'pv:TICHR1012',
          unit: '°C',
          dp: 0,
          tag: 'TT-HR1012-1 / -2'
        },
        { x: 350, y: 50, side: 'b', label: 'Spray water', key: 'FTCD1115', unit: 't/h', tag: 'FT-CD1115' },
        {
          x: tx(-236),
          y: ty(170),
          side: 'l',
          label: 'Condenser',
          key: 'PT-CD1110',
          unit: 'kg/cm² abs',
          dp: 3,
          digits: 5,
          tag: 'PT-CD1110'
        },
        {
          x: tx(-114),
          y: ty(236),
          side: 'r',
          label: 'Hotwell level',
          key: 'LTCD1110',
          unit: 'mm',
          dp: 0,
          tag: 'LT-CD1110'
        },
        {
          x: bx(16),
          y: by(-30),
          side: 'l',
          label: 'Flue gas from the cyclones',
          key: 'TT-FG1095-A',
          key2: 'TT-FG1095-B',
          unit: '°C',
          dp: 0,
          tag: 'TT-FG1095-A / -B'
        }
      ],
      texts: [
        { x: 696, y: 716, s: 'High pressure turbine', cls: 'hx-name' },
        { x: 226, y: 508, s: 'Intermediate and low', cls: 'hx-name', anchor: 'end' },
        { x: 226, y: 525, s: 'pressure turbine', cls: 'hx-name', anchor: 'end' },
        { x: tx(-156), y: ty(268), s: 'Condenser', cls: 'hx-name', anchor: 'middle' },
        { x: 600, y: HY - 14, s: 'Hot reheat', cls: 'hx-zone', anchor: 'middle' },
        { x: 1200, y: CY - 14, s: 'Cold reheat', cls: 'hx-zone', anchor: 'middle' }
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
