/* HX page in the REALISTIC look: feedwater, from the deaerator to the feedwater control valves (user 2026-11-17: "Ganyan ang
   HMI na gsto ko. Dapat iyan lang makita ko n mga itsura").
   THE PICTURE: the deaerator high up on the left, the two boiler feed pumps below it, the two high pressure heaters one above
   the other in the middle (cut open: the feedwater goes through the tubes, the extraction steam condenses on them), the
   feedwater control valves on the right, on the way to the economizers.
   THE CONNECTIONS: K1AU3-PD-017 Rev D, feedwater system: deaerator storage tank T-1104; one suction line that splits to the
   two pumps P-1115A / B (suction valve, strainer with DPT-FW1115-A / -B); each pump with its automatic recirculation valve
   back to the deaerator, its discharge valve MV-FW1001 / 1002 and the bypass MV-FW1391 / 1392 around it; the common discharge
   line (PT-FW1011, TT-FW1011) with the take-off of the spray water; No. 1 high pressure heater H-1105 (TT-FW1105 after it)
   with its inlet valve V-FW1009, outlet valve V-FW1010 and bypass valve V-FW1011, No. 2 high pressure heater H-1106
   (TT-FW1106 after it) with V-FW1012 / 1013 / bypass 1014: gear operated hand valves without a DCS signal (PD-017;
   team-files/plant-study/11-heater-valves.md), valve symbols of the plant model here (a click opens the field faceplate;
   unit.js reads the same six valves); flow element FE-FW1007 (FT-FW1007-1 / -2); the main valve
   FCV-FW1130-1 and the start-up valve FCV-FW1130-2 side by side; on to the boiler economizer (PD-019).
   The extraction steam valves: MV-TS1001 to No. 2 heater (from the cold reheat line, PD-011 "TO #2 HIGH PRESSURE HEATER"),
   MV-TS1002 to No. 1 heater, MV-TS1003 to the deaerator (order and transmitters PT-TS1017 / PT-TS1013 / TT-TS1011 as the
   temporary page 06 binds them).
   Drawn simpler than the sheet:
   - the recirculation line of a pump: a short line with the words "to deaerator";
   - the drain of No. 2 heater goes to No. 1 heater, the drain of No. 1 heater to the deaerator (words at its end);
   - the suction valves V-FW1001 / 1002 (hand valves with a limit switch) and the strainers are not drawn; the strainer
     differential pressure stands at the suction of each pump.
   Left out on purpose, all without a signal in hx-registry.js: the other hand valves, vents, drains, the lube
   oil systems Z-1115A / B (the lube oil pumps are in the faceplate of their feed pump), the bearing and winding temperatures
   and vibrations of the pumps, the initial fill line from the make-up water.
   NOT on this page yet: the 1 ELEMENT / 3 ELEMENT push buttons of the drum level control (temporary page 06). */
(function () {
  const { V, E, M, C, X, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const W_FW = 6,
    W_SM = 4,
    W_ST = 5,
    W_DR = 3;
  /* places (the drawing is 1760 x 1000) */
  const DAX = 330,
    DAY = 190,
    DAS = 1.6 /* deaerator */,
    PAX = 330,
    PBX = 700,
    PY = 800,
    PS = 1.6 /* the two pumps */,
    SUX = 110,
    SUY = 950 /* suction line: down at the left, along the bottom */,
    DHY = 520 /* common discharge line */,
    HX1 = 1150,
    H1Y = 660,
    H2Y = 400,
    HS = 1.7 /* heaters (drawn mirrored: water box on the left) */,
    WX = HX1 - 53 * HS /* the water box nozzles of the heaters */,
    RX = 985 /* the feedwater line up past the two heaters */,
    VX = 1023 /* inlet and outlet valves */,
    BO = 70 /* a heater branch leaves the line this far below and comes back this far above the heater */,
    STX = HX1 + 17.4 * HS /* steam into a heater */,
    DRX = HX1 + 34.7 * HS /* drain out of a heater */,
    FY = 210; /* line to the control valves */
  const A = 'm:BFWP-A',
    B = 'm:BFWP-B',
    FW = A + '|' + B;

  /* one high pressure heater on the feedwater line: inlet valve, heater, outlet valve (gear operated hand valves), and the
     bypass valve in the line. The feedwater goes up. */
  const fv = t => 'h:fv-' + t;
  const heater = (n, y, vi, vo, vb) => {
    const h = 'h' + n,
      through = FW + '&' + fv(vi) + '&' + fv(vo),
      past = FW + '&' + fv(vb);
    return {
      items: [
        at(E('heater', '', '', [], { id: h, flow: through }), HX1, y, { id: h, under: true, sc: HS, mir: true }),
        at(HX.HV(vi), VX, y + BO, { id: h + 'i', lab: 'b' }),
        at(HX.HV(vo), VX, y - BO, { id: h + 'o', lab: 't' }),
        at(HX.HV(vb), RX, y, { id: h + 'b', rot: -90, lab: 'l' })
      ],
      pipes: [
        { med: 'water', w: W_FW, pts: [[RX, y + BO], h + 'i.l'], flow: FW + '&' + fv(vi), arrow: false },
        { med: 'water', w: W_FW, pts: [h + 'i.r', [WX, y + BO], h + '.in'], flow: through },
        { med: 'water', w: W_FW, pts: [h + '.out', [WX, y - BO], h + 'o.r'], flow: through, arrow: false },
        { med: 'water', w: W_FW, pts: [h + 'o.l', [RX, y - BO]], flow: through },
        { med: 'water', w: W_SM, pts: [[RX, y + BO], h + 'b.l'], flow: past, arrow: false },
        { med: 'water', w: W_SM, pts: [h + 'b.r', [RX, y - BO]], flow: past, arrow: false }
      ]
    };
  };
  const HP1 = heater(1, H1Y, 'V-FW1009', 'V-FW1010', 'V-FW1011'),
    HP2 = heater(2, H2Y, 'V-FW1012', 'V-FW1013', 'V-FW1014');

  page({
    id: 'feedwater',
    group: 'Water and steam',
    title: 'Feedwater',
    about:
      'Deaerator, boiler feed pumps, high pressure heaters and the feedwater control valves. Connections: flow diagram K1AU3-PD-017 Rev D.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        /* ---- deaerator ---- */
        at(E('deaerator', '', '', [], { id: 'dea' }), DAX, DAY, { id: 'da', under: true, sc: DAS }),
        at(L('condensate', 'Condensate', { back: true }), 110, DAY - 30 * DAS, { id: 'cdl' }),
        at(X('MV-TS1003', 'Extraction 3 valve'), 520, DAY - 12 * DAS, { id: 'ts3', lab: 't' }),
        at(L('extraction', 'Extraction steam', { back: true }), 680, DAY - 12 * DAS, { id: 'exl3' }),

        /* ---- the two boiler feed pumps with their discharge valves ---- */
        at(
          M('pump', 'BFWP-A', 'Boiler feed pump A', [
            V('Current', 'IT-P1115A', 'A'),
            V('Strainer', 'DPT-FW1115-A', K, 2)
          ]),
          PAX,
          PY,
          {
            id: 'pa',
            sc: PS,
            lab: 'b'
          }
        ),
        at(
          M('pump', 'BFWP-B', 'Boiler feed pump B', [
            V('Current', 'IT-P1115B', 'A'),
            V('Strainer', 'DPT-FW1115-B', K, 2)
          ]),
          PBX,
          PY,
          {
            id: 'pb',
            sc: PS,
            lab: 'b'
          }
        ),
        at(X('MV-FW1001', 'Discharge valve', { cname: 'Feed pump A discharge valve' }), PAX - 3, 640, {
          id: 'dva',
          rot: -90,
          lab: 'l'
        }),
        at(X('MV-FW1391', 'Bypass', { cname: 'Feed pump A discharge bypass valve' }), PAX + 70, 640, {
          id: 'bva',
          rot: -90,
          lab: 'r'
        }),
        at(X('MV-FW1002', 'Discharge valve', { cname: 'Feed pump B discharge valve' }), PBX - 3, 640, {
          id: 'dvb',
          rot: -90,
          lab: 'l'
        }),
        at(X('MV-FW1392', 'Bypass', { cname: 'Feed pump B discharge bypass valve' }), PBX + 70, 640, {
          id: 'bvb',
          rot: -90,
          lab: 'r'
        }),
        at(L('drum-steam', 'Spray water to the superheaters'), 520, 430, { id: 'spl' }),

        /* ---- the two high pressure heaters ---- */
        ...HP1.items,
        ...HP2.items,
        at(X('MV-TS1002', 'Extraction 2 valve'), 1460, 580, { id: 'ts2', lab: 'b' }),
        at(L('extraction', 'Extraction steam', { back: true }), 1620, 580, { id: 'exl2' }),
        at(X('MV-TS1001', 'Extraction 1 valve'), 1330, 338, { id: 'ts1', lab: 'b' }),
        at(L('reheat-steam', 'Cold reheat steam', { back: true }), 1460, 338, { id: 'exl1' }),
        at(C('LICHD11061', 'Heater 2 drain valve', { tag: 'LCV-HD1106-1' }), DRX, 530, { id: 'd2', rot: 90, lab: 'r' }),
        at(C('LICHD11051', 'Heater 1 drain valve', { tag: 'LCV-HD1105-1' }), DRX, 790, { id: 'd1', rot: 90, lab: 'r' }),

        /* ---- feedwater control valves, to the economizers ---- */
        at(C('FICFW1007', 'Main feedwater valve', { tag: 'FCV-FW1130-1' }), 1450, 170, { id: 'fcm', lab: 't' }),
        at(C('LICBR1001B', 'Start-up feedwater valve', { tag: 'FCV-FW1130-2' }), 1450, 250, { id: 'fcs', lab: 'b' }),
        at(L('drum-steam', 'To the economizers and the drum'), 1640, 110, { id: 'ecl' }),
        at(C('LICBR1001', 'Drum level, three element', { sym: 'ctl', unit: 'mm', pvdp: 0, wrap: 30 }), 1060, 70, {
          id: 'lc3',
          lab: 't'
        }),
        at(C('LICBR1001A', 'Drum level, one element', { sym: 'ctl', unit: 'mm', pvdp: 0, wrap: 30 }), 1270, 70, {
          id: 'lc1',
          lab: 't'
        }),
        /* the two push buttons of ABC-010 (drum level control): lit = the selection of M.0222 */
        at(HX.B('3 ELEMENT', 'data-apb="ABC-010|M.054E|M.0222=0"', { press: true }), 1060, 130, { id: 'pb3' }),
        at(HX.B('1 ELEMENT', 'data-apb="ABC-010|M.054F|M.0222=1"', { press: true }), 1270, 130, { id: 'pb1' })
      ],
      pipes: [
        /* into the deaerator */
        { med: 'condensate', w: W_FW, pts: ['cdl.r', 'da.cin'], flow: 'v:PT-CD1104>0.05' },
        { med: 'steam', w: W_ST, pts: ['exl3.l', 'ts3.r'], flow: 'x:MV-TS1003', arrow: false },
        { med: 'steam', w: W_ST, pts: ['ts3.l', 'da.stin'], flow: 'x:MV-TS1003' },
        /* suction: one line from the deaerator, a branch to each pump */
        { med: 'water', w: W_FW, pts: ['da.out', [DAX + 48 * DAS, 300], [SUX, 300], [SUX, SUY], [250, SUY]], flow: FW },
        { med: 'water', w: W_FW, pts: [[250, SUY], [250, PY], 'pa.s'], flow: A, arrow: false },
        { med: 'water', w: W_FW, pts: [[250, SUY], [620, SUY], [620, PY], 'pb.s'], flow: B, arrow: false },
        /* discharge of pump A: valve and its bypass, recirculation */
        { med: 'water', w: W_FW, pts: ['pa.d', 'dva.l'], flow: A, arrow: false },
        { med: 'water', w: W_FW, pts: ['dva.r', [PAX - 3, DHY]], flow: 'x:MV-FW1001' },
        { med: 'water', w: W_SM, pts: [[PAX - 3, 700], [PAX + 70, 700], 'bva.l'], flow: 'x:MV-FW1391', arrow: false },
        { med: 'water', w: W_SM, pts: ['bva.r', [PAX + 70, 580], [PAX - 3, 580]], flow: 'x:MV-FW1391', arrow: false },
        {
          med: 'water',
          w: W_DR,
          pts: [
            [PAX - 3, 730],
            [PAX - 60, 730]
          ],
          to: 'to deaerator',
          flow: A
        },
        /* discharge of pump B */
        { med: 'water', w: W_FW, pts: ['pb.d', 'dvb.l'], flow: B, arrow: false },
        { med: 'water', w: W_FW, pts: ['dvb.r', [PBX - 3, DHY]], flow: 'x:MV-FW1002' },
        { med: 'water', w: W_SM, pts: [[PBX - 3, 700], [PBX + 70, 700], 'bvb.l'], flow: 'x:MV-FW1392', arrow: false },
        { med: 'water', w: W_SM, pts: ['bvb.r', [PBX + 70, 580], [PBX - 3, 580]], flow: 'x:MV-FW1392', arrow: false },
        {
          med: 'water',
          w: W_DR,
          pts: [
            [PBX - 3, 730],
            [PBX - 60, 730]
          ],
          to: 'to deaerator',
          flow: B
        },
        /* common discharge line, spray water take-off, through the two heaters */
        {
          med: 'water',
          w: W_FW,
          pts: [
            [PAX - 3, DHY],
            [PBX - 3, DHY]
          ],
          flow: 'x:MV-FW1001|x:MV-FW1391',
          arrow: false
        },
        {
          med: 'water',
          w: W_FW,
          pts: [
            [PBX - 3, DHY],
            [870, DHY],
            [870, 800],
            [RX, 800],
            [RX, H1Y + BO]
          ],
          flow: FW
        },
        /* the two heaters, each with its inlet valve, its outlet valve and its bypass valve in the line */
        ...HP1.pipes,
        {
          med: 'water',
          w: W_FW,
          pts: [
            [RX, H1Y - BO],
            [RX, H2Y + BO]
          ],
          flow: FW
        },
        ...HP2.pipes,
        { med: 'water', w: W_SM, pts: [[520, DHY], 'spl.b'], flow: FW, arrow: false },
        {
          med: 'water',
          w: W_FW,
          pts: [
            [RX, H2Y - BO],
            [RX, FY],
            [1370, FY]
          ],
          flow: FW
        },
        /* the two control valves side by side */
        { med: 'water', w: W_FW, pts: [[1370, FY], [1370, 170], 'fcm.l'], flow: 'l:FICFW1007', arrow: false },
        { med: 'water', w: W_FW, pts: ['fcm.r', [1530, 170], [1530, FY]], flow: 'l:FICFW1007', arrow: false },
        { med: 'water', w: W_SM, pts: [[1370, FY], [1370, 250], 'fcs.l'], flow: 'l:LICBR1001B', arrow: false },
        { med: 'water', w: W_SM, pts: ['fcs.r', [1530, 250], [1530, FY]], flow: 'l:LICBR1001B', arrow: false },
        { med: 'water', w: W_FW, pts: [[1530, FY], [1730, FY], [1730, 110], 'ecl.r'], flow: FW },
        /* extraction steam into the heaters */
        { med: 'steam', w: W_ST, pts: ['exl2.l', 'ts2.r'], flow: 'x:MV-TS1002', arrow: false },
        { med: 'steam', w: W_ST, pts: ['ts2.l', [STX, 580], 'h1.st'], flow: 'x:MV-TS1002' },
        { med: 'reheat', w: W_ST, pts: ['exl1.l', 'ts1.r'], flow: 'x:MV-TS1001', arrow: false },
        { med: 'reheat', w: W_ST, pts: ['ts1.l', [STX, 338], 'h2.st'], flow: 'x:MV-TS1001' },
        /* heater drains: No. 2 to No. 1, No. 1 to the deaerator */
        { med: 'drain', w: W_DR, pts: ['h2.dr', 'd2.l'], flow: 'l:LICHD11061', arrow: false },
        { med: 'drain', w: W_DR, pts: ['d2.r', [DRX, H1Y - 21 * HS]], flow: 'l:LICHD11061' },
        { med: 'drain', w: W_DR, pts: ['h1.dr', 'd1.l'], flow: 'l:LICHD11051', arrow: false },
        { med: 'drain', w: W_DR, pts: ['d1.r', [DRX, 850]], to: 'to deaerator', flow: 'l:LICHD11051' }
      ],
      taps: [
        { x: 405, y: DAY - 12 * DAS, side: 't', label: 'Pressure', key: 'PT-TS1017', unit: K, tag: 'PT-TS1017' },
        { x: 250, y: 880, side: 'l', label: 'Suction', key: 'PT-FW1115-A', unit: K, tag: 'PT-FW1115-A' },
        { x: 620, y: 880, side: 'l', label: 'Suction', key: 'PT-FW1115-B', unit: K, tag: 'PT-FW1115-B' },
        { x: 410, y: DHY, side: 't', label: 'Pressure', key: 'PT-FW1011', unit: K, tag: 'PT-FW1011' },
        { x: 610, y: DHY, side: 't', label: 'Temperature', key: 'TT-FW1011', unit: '°C', dp: 0, tag: 'TT-FW1011' },
        {
          x: RX,
          y: (H1Y + H2Y) / 2,
          side: 'l',
          label: 'After heater 1',
          key: 'TT-FW1105',
          unit: '°C',
          dp: 0,
          tag: 'TT-FW1105'
        },
        { x: RX, y: 270, side: 'l', label: 'After heater 2', key: 'TT-FW1106', unit: '°C', dp: 0, tag: 'TT-FW1106' },
        {
          x: 1130,
          y: FY,
          side: 't',
          label: 'Feedwater flow',
          key: 'FT-FW1007-1',
          key2: 'FT-FW1007-2',
          unit: 't/h',
          tag: 'FT-FW1007-1 / -2'
        },
        { x: 1590, y: FY, side: 'b', label: 'Pressure', key: 'PT-FW1160', unit: K, tag: 'PT-FW1160' },
        { x: 1680, y: FY, side: 'b', label: 'Temperature', key: 'TT-FW1160', unit: '°C', dp: 0, tag: 'TT-FW1160' },
        { x: 1400, y: 580, side: 't', label: 'Pressure', key: 'PT-TS1013', unit: K, tag: 'PT-TS1013' },
        { x: 1270, y: 338, side: 't', label: 'Temperature', key: 'TT-TS1011', unit: '°C', dp: 0, tag: 'TT-TS1011' }
      ],
      texts: [
        { x: DAX, y: DAY + 74 * DAS - 22, s: 'Deaerator', cls: 'hx-name', anchor: 'middle' },
        { x: 520, y: 230, s: 'Level 1', key: 'LT-CD1104-1', unit: 'mm', dp: 0 },
        { x: 520, y: 246, s: 'Level 2', key: 'LT-CD1104-2', unit: 'mm', dp: 0 },
        { x: 520, y: 262, s: 'Level 3', key: 'LT-CD1104-3', unit: 'mm', dp: 0 },
        { x: 520, y: 278, s: 'Pressure', key: 'PT-CD1104', unit: K },
        { x: 520, y: 294, s: 'Temperature', key: 'TTCD1104', unit: '°C', dp: 0 },
        { x: DRX + 12, y: H1Y + 64, s: 'High pressure heater 1', cls: 'hx-name' },
        { x: DRX + 12, y: H2Y + 64, s: 'High pressure heater 2', cls: 'hx-name' },
        { x: 1380, y: 660, s: 'Level 1', key: 'LT-HD1105-1', unit: 'mm', dp: 0 },
        { x: 1380, y: 676, s: 'Level 2', key: 'LT-HD1105-2', unit: 'mm', dp: 0 },
        { x: 1380, y: 410, s: 'Level 1', key: 'LT-HD1106-1', unit: 'mm', dp: 0 },
        { x: 1380, y: 426, s: 'Level 2', key: 'LT-HD1106-2', unit: 'mm', dp: 0 }
      ]
    }
  });
})();
