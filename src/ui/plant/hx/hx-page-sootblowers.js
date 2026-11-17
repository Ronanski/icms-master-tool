/* HX page in the new look: steam sootblowers (user 2026-11-17: "Lahat ng luma na HMI, alisin dyan s app"; "Kumpletuhin muna
   lahat ng HMI pages").
   THE PICTURE: the steam supply on the left; in the middle the two passes of the back pass, each with its seven levels of
   two sootblowers (left wall and right wall) and the tube banks between them, the air heater blowers below; on the right the
   sequence states, permissives and alarms.
   THE ARRANGEMENT, read from K1AU3-PD-015 Rev D (steam soot blowing system):
   - steam from the outlet of superheater panel 1 (PD-019), steam supply valve MV-SB1001, pressure control valve PCV-SB1053
     (PIC-SB1053; the logic tag is PICSB1052, ABC-017), header PT-SB1052, relief ZV-SB1001 to the silencer;
   - reheater pass, from the top: N-1011 / 1012 above the reheater upper bank, N-1015 / 1016 above reheater intermediate
     upper, N-1019 / 1020 above reheater intermediate lower, N-1023 / 1024 above reheater lower, N-1027 / 1028 and N-1031 /
     1032 above the No. 2 economizer R, N-1035 / 1036 below the common economizer pass;
   - superheater pass, from the top: N-1014 / 1013 above the final superheater upper bank, N-1018 / 1017 above final
     superheater intermediate, N-1022 / 1021 above final superheater lower, N-1026 / 1025 above the No. 3 economizer upper,
     N-1030 / 1029 above the No. 3 economizer lower, N-1034 / 1033 above the No. 2 economizer S, N-1038 / 1037 below the
     common economizer pass;
   - N-1040 and N-1042 on the gas side of the rotary air heater (PT-SB1040 hot end, PT-SB1042 cold end);
   - drains A and B (TT-SB1056, TT-SB1057) with their bypass valves XV-SB1054 and XV-SB1059 to the blowdown tank.
   THE STATES are the ones temporary page 15 reads: a blower is red while its "SOOTBLOWER OPERATING" output is on (DITL-80A
   ~ 80E, air heater blowers DITL-80F), permissives and sequence DITL-80A, steam supply valve DITL-80S, drain valves DITL-80R,
   alarms DITL-80S / 80Q.
   NO-SOURCE in the app (as on page 15): number of blowers blowing, forward / reverse and warm-up timers, MV-SB1001
   position in %. */
(function () {
  const { C, L, page } = HX;
  const B = HX.B;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const op = (sheet, row, tag) => 'data-dy="' + sheet + '|o|' + row + '" data-on="' + tag + '" data-off="' + tag + '"';
  /* level: [reheater pass left, right, superheater pass left, right] = [tag, sheet, output row] */
  const LV = [
    [
      ['N-1011', 'DITL-80A', 25],
      ['N-1012', 'DITL-80B', 1],
      ['N-1014', 'DITL-80B', 9],
      ['N-1013', 'DITL-80B', 5]
    ],
    [
      ['N-1015', 'DITL-80B', 13],
      ['N-1016', 'DITL-80B', 17],
      ['N-1018', 'DITL-80B', 25],
      ['N-1017', 'DITL-80B', 21]
    ],
    [
      ['N-1019', 'DITL-80C', 1],
      ['N-1020', 'DITL-80C', 5],
      ['N-1022', 'DITL-80C', 13],
      ['N-1021', 'DITL-80C', 9]
    ],
    [
      ['N-1023', 'DITL-80C', 17],
      ['N-1024', 'DITL-80C', 21],
      ['N-1026', 'DITL-80D', 1],
      ['N-1025', 'DITL-80C', 25]
    ],
    [
      ['N-1027', 'DITL-80D', 5],
      ['N-1028', 'DITL-80D', 9],
      ['N-1030', 'DITL-80D', 17],
      ['N-1029', 'DITL-80D', 13]
    ],
    [
      ['N-1031', 'DITL-80D', 21],
      ['N-1032', 'DITL-80D', 25],
      ['N-1034', 'DITL-80E', 5],
      ['N-1033', 'DITL-80E', 1]
    ],
    [
      ['N-1035', 'DITL-80E', 9],
      ['N-1036', 'DITL-80E', 13],
      ['N-1038', 'DITL-80E', 21],
      ['N-1037', 'DITL-80E', 17]
    ]
  ];
  const RH = [
      'Reheater upper',
      'Reheater intermediate upper',
      'Reheater intermediate lower',
      'Reheater lower',
      '',
      'No. 2 economizer R · common economizer pass'
    ],
    SH = [
      'Final superheater upper',
      'Final superheater intermediate',
      'Final superheater lower',
      'No. 3 economizer upper',
      'No. 3 economizer lower',
      'No. 2 economizer S · common economizer pass'
    ];
  const CX = [520, 760, 1040, 1280],
    Y0 = 190,
    DY = 80,
    SX = 1585,
    SW2 = 310;
  const ST = [
    ['All blowers', 'data-dy="DITL-80A|i|13" data-on="ALL RETRACTED" data-off="NOT ALL RETRACTED" data-s="1"'],
    ['Program', 'data-dy="DITL-80A|o|5" data-on="ON" data-off="OFF"'],
    ['Mode', 'data-dy="DITL-80A|o|9" data-on="MANUAL" data-off="AUTO"'],
    ['Blowing permissive', 'data-dy="DITL-80A|o|20" data-on="Y" data-off="N"'],
    ['Steam supply valve open 600 s', 'data-dy="DITL-80A|i|1"'],
    ['Drain temperature A above 220 °C', 'data-dy="DITL-80A|i|23"'],
    ['Drain temperature B above 220 °C', 'data-dy="DITL-80A|i|22"'],
    ['All blowers on retract position', 'data-dy="DITL-80A|i|13"'],
    ['Sootblowers remote', 'data-dy="DITL-80A|i|14"'],
    ['Air heater blowers remote', 'data-dy="DITL-80A|i|12"'],
    ['Alarm: steam valve open over time', 'data-dy="DITL-80S|o|19"'],
    ['Alarm: steam valve close over time', 'data-dy="DITL-80S|o|24"'],
    ['Alarm: warming-up failure', 'data-dy="DITL-80Q|o|3"']
  ];

  page({
    id: 'sootblowers',
    group: 'Boiler',
    title: 'Sootblowers',
    about:
      'Steam sootblowers of the back pass and the air heater: a blower is red while it blows (flow diagram K1AU3-PD-015 Rev D, logic DITL-80A to 80S).',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(L('drum-steam', 'Superheater panel 1 outlet', { back: true }), 190, 70, { id: 'sl' }),
        at(
          B('Steam supply valve MV-SB1001', 'data-dy="DITL-80S|o|5|neg" data-on="OPEN" data-off="CLOSED"', { w: 230 }),
          190,
          150,
          {
            id: 'sv'
          }
        ),
        at(C('PICSB1052', 'Sootblower steam pressure valve', { tag: 'PCV-SB1053', wrap: 16 }), 190, 270, {
          id: 'pc',
          rot: 90,
          lab: 'r'
        }),
        ...LV.flatMap((lv, i) =>
          lv.map((b, j) =>
            at(B(b[0], op(b[1], b[2], b[0]), { plain: true, w: 110 }), CX[j], Y0 + i * DY, { id: 'n' + i + j })
          )
        ),
        at(B('N-1040', op('DITL-80F', 25, 'N-1040') + ' data-n="40"', { plain: true, w: 110 }), 760, 820, {
          id: 'a40'
        }),
        at(B('N-1042', op('DITL-80F', 25, 'N-1042') + ' data-n="42"', { plain: true, w: 110 }), 760, 880, {
          id: 'a42'
        }),
        at(
          B('Drain A bypass valve XV-SB1054', 'data-dy="DITL-80R|o|20" data-on="OPEN" data-off="CLOSED"', { w: 240 }),
          190,
          640,
          {
            id: 'da'
          }
        ),
        at(
          B('Drain B bypass valve XV-SB1059', 'data-dy="DITL-80R|o|11" data-on="OPEN" data-off="CLOSED"', { w: 240 }),
          190,
          800,
          {
            id: 'db'
          }
        ),
        ...ST.map((s, i) => at(B(s[0], s[1], { w: SW2 }), SX, 110 + i * 46, { id: 'st' + i })),
        at(L('furnace-gas', 'Air heater and flue gas', { back: true }), 1180, 850, { id: 'fgl' })
      ],
      pipes: [
        { med: 'steam', w: 4, pts: ['sl.b', 'sv.t'], flow: 'l:PICSB1052', arrow: false },
        { med: 'steam', w: 4, pts: ['sv.b', 'pc.l'], flow: 'l:PICSB1052', arrow: false },
        {
          med: 'steam',
          w: 4,
          pts: ['pc.r', [190, 450], [400, 450], [400, 120], [1160, 120]],
          flow: 'l:PICSB1052',
          arrow: false
        },
        {
          med: 'steam',
          w: 3,
          pts: [
            [640, 120],
            [640, Y0 + 6 * DY]
          ],
          flow: 'l:PICSB1052',
          arrow: false
        },
        {
          med: 'steam',
          w: 3,
          pts: [
            [1160, 120],
            [1160, Y0 + 6 * DY]
          ],
          flow: 'l:PICSB1052',
          arrow: false
        },
        ...LV.flatMap((lv, i) => [
          { med: 'steam', w: 2.5, pts: ['n' + i + '0.r', 'n' + i + '1.l'], flow: 'l:PICSB1052', arrow: false },
          { med: 'steam', w: 2.5, pts: ['n' + i + '2.r', 'n' + i + '3.l'], flow: 'l:PICSB1052', arrow: false }
        ]),
        {
          med: 'steam',
          w: 3,
          pts: [
            [400, 450],
            [400, 850],
            [640, 850]
          ],
          flow: 'l:PICSB1052',
          arrow: false
        },
        { med: 'steam', w: 2.5, pts: [[640, 820], 'a40.l'], flow: 'l:PICSB1052', arrow: false },
        { med: 'steam', w: 2.5, pts: [[640, 880], 'a42.l'], flow: 'l:PICSB1052', arrow: false },
        {
          med: 'steam',
          w: 3,
          pts: [
            [640, 820],
            [640, 880]
          ],
          flow: 'l:PICSB1052',
          arrow: false
        },
        { med: 'drain', w: 2.5, pts: ['da.b', [190, 690]], flow: 'l:PICSB1052' },
        { med: 'drain', w: 2.5, pts: ['db.b', [190, 860]], to: 'blowdown tank', flow: 'l:PICSB1052' }
      ],
      taps: [
        { x: 300, y: 450, side: 'b', label: 'Header', key: 'PT-SB1052', unit: K, dp: 1, tag: 'PT-SB1052' },
        { x: 190, y: 580, side: 't', label: 'Drain A', key: 'TT-SB1056', unit: '°C', dp: 0, tag: 'TT-SB1056' },
        { x: 190, y: 740, side: 't', label: 'Drain B', key: 'TT-SB1057', unit: '°C', dp: 0, tag: 'TT-SB1057' },
        { x: 870, y: 820, side: 'r', label: 'Hot end', key: 'PT-SB1040', unit: K, dp: 1, tag: 'PT-SB1040' },
        { x: 870, y: 880, side: 'r', label: 'Cold end', key: 'PT-SB1042', unit: K, dp: 1, tag: 'PT-SB1042' },
        { x: SX - 60, y: 740, side: 'r', label: 'System current', key: 'IT-SB01', unit: 'A', dp: 1, tag: 'IT-SB01' }
      ],
      texts: [
        { x: 656, y: 150, s: 'REHEATER PASS', cls: 'hx-name' },
        { x: 1176, y: 150, s: 'SUPERHEATER PASS', cls: 'hx-name' },
        ...RH.map((s, i) => ({ x: 652, y: Y0 + i * DY + 44, s, cls: 'hx-note' })),
        ...SH.map((s, i) => ({ x: 1172, y: Y0 + i * DY + 44, s, cls: 'hx-note' })),
        { x: 640, y: 780, s: 'ROTARY AIR HEATER, gas side', cls: 'hx-name', anchor: 'middle' },
        { x: SX - SW2 / 2, y: 70, s: 'SEQUENCE, PERMISSIVES, ALARMS', cls: 'hx-name' },
        {
          x: 400,
          y: 960,
          s: 'Red = the blower is blowing. Drain valves close by themselves when both drain temperatures pass 250 °C after the warm-up.',
          cls: 'hx-note'
        }
      ]
    }
  });
})();
