/* HX page in the REALISTIC look: steam sootblowers (user 2026-11-17: "Lahat ng luma na HMI, alisin dyan s app"; "dapat may
   originality ha. Maintain ang quality at design na nasimulan").
   THE PICTURE: the back pass of the boiler cut open in the middle, the same drawing as on the Reheat steam and the Furnace
   and flue gas pages, with a sootblower lance going into the pass at each of its seven levels: the reheater pass from the
   left, the superheater pass from the right. Each level has two sootblowers (left wall and right wall): their two tags
   stand at the lance, red while that blower blows (the lance carries its steam only then). The steam comes down the two risers beside the casing. Below on the left
   the rotary air heater with its two blowers; on the right the sequence, its permissives and alarms.
   THE ARRANGEMENT, read from K1AU3-PD-015 Rev D (steam soot blowing system):
   - steam from the outlet of superheater panel 1 (PD-019), steam supply valve MV-SB1001, pressure control valve PCV-SB1053
     (PIC-SB1053; the logic tag is PICSB1052, ABC-017), header PT-SB1052;
   - reheater pass, from the top: N-1011 / 1012 above the reheater upper bank, N-1015 / 1016 above reheater intermediate
     upper, N-1019 / 1020 above reheater intermediate lower, N-1023 / 1024 above reheater lower, N-1027 / 1028 and N-1031 /
     1032 between the reheater and the No. 2 economizer R, N-1035 / 1036 below the common economizer pass;
   - superheater pass, from the top: N-1014 / 1013 above the finishing superheater upper bank, N-1018 / 1017 above the
     intermediate bank, N-1022 / 1021 above the lower bank, N-1026 / 1025 above the No. 3 economizer upper, N-1030 / 1029
     above the No. 3 economizer lower, N-1034 / 1033 above the No. 2 economizer S, N-1038 / 1037 below the common economizer
     pass;
   - N-1040 and N-1042 on the gas side of the rotary air heater (PT-SB1040 hot end, PT-SB1042 cold end);
   - drains A and B (TT-SB1056, TT-SB1057) with their bypass valves XV-SB1054 and XV-SB1059 to the blowdown tank.
   THE STATES are read from the logic: a blower is red while its "SOOTBLOWER OPERATING" output is on (DITL-80A ~ 80E, air
   heater blowers DITL-80F), permissives and sequence DITL-80A, steam supply valve DITL-80S, drain valves DITL-80R, alarms
   DITL-80S / 80Q.
   NO-SOURCE in the app: number of blowers blowing, forward / reverse and warm-up timers, MV-SB1001 position in %. */
(function () {
  const { V, E, C, L, page } = HX;
  const B = HX.B;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const op = (sheet, row, tag) => 'data-dy="' + sheet + '|o|' + row + '" data-on="' + tag + '" data-off="' + tag + '"';
  /* the back pass: origin = top left corner of its casing (hx-real.js R.backpass, 216 wide, 512 high) */
  const BX = 700,
    BY = 120,
    BS = 1.6;
  const py = y => Math.round(BY + y * BS),
    px = x => Math.round(BX + x * BS);
  /* a pass: [height of the lance in the symbol, left wall blower, right wall blower], a blower = [tag, sheet, output row] */
  const RH = [
    [28, ['N-1011', 'DITL-80A', 25], ['N-1012', 'DITL-80B', 1]],
    [88, ['N-1015', 'DITL-80B', 13], ['N-1016', 'DITL-80B', 17]],
    [143, ['N-1019', 'DITL-80C', 1], ['N-1020', 'DITL-80C', 5]],
    [212, ['N-1023', 'DITL-80C', 17], ['N-1024', 'DITL-80C', 21]],
    [264, ['N-1027', 'DITL-80D', 5], ['N-1028', 'DITL-80D', 9]],
    [278, ['N-1031', 'DITL-80D', 21], ['N-1032', 'DITL-80D', 25]],
    [470, ['N-1035', 'DITL-80E', 9], ['N-1036', 'DITL-80E', 13]]
  ];
  const SH = [
    [28, ['N-1014', 'DITL-80B', 9], ['N-1013', 'DITL-80B', 5]],
    [74, ['N-1018', 'DITL-80B', 25], ['N-1017', 'DITL-80B', 21]],
    [118, ['N-1022', 'DITL-80C', 13], ['N-1021', 'DITL-80C', 9]],
    [165, ['N-1026', 'DITL-80D', 1], ['N-1025', 'DITL-80C', 25]],
    [212, ['N-1030', 'DITL-80D', 17], ['N-1029', 'DITL-80D', 13]],
    [266, ['N-1034', 'DITL-80E', 5], ['N-1033', 'DITL-80E', 1]],
    [470, ['N-1038', 'DITL-80E', 21], ['N-1037', 'DITL-80E', 17]]
  ];
  /* the two tags of a level stand at the outer end of its lance; two reheater levels are close: their tags move apart */
  const lift = (rows, i) => (rows === RH ? (i === 4 ? -11 : i === 5 ? 13 : 0) : 0);
  const CW2 = 80,
    RXA = 478,
    RXB = 566,
    RISR = 624 /* reheater side: left wall tag, right wall tag, riser */,
    RISS = 1076,
    SXA = 1134,
    SXB = 1222; /* superheater side */
  const tags = (rows, xa, xb, p) =>
    rows.flatMap((r, i) => [
      at(B(r[1][0], op(r[1][1], r[1][2], r[1][0]), { plain: true, w: CW2 }), xa, py(r[0]) + lift(rows, i), {
        id: p + i + 'a'
      }),
      at(B(r[2][0], op(r[2][1], r[2][2], r[2][0]), { plain: true, w: CW2 }), xb, py(r[0]) + lift(rows, i), {
        id: p + i + 'b'
      })
    ]);
  const FL = 'l:PICSB1052';
  /* a lance carries steam only while one of the two blowers of its level blows */
  const hk = b => HX.hk('sb-' + b[0], op(b[1], b[2], b[0]));
  const blow = r => hk(r[1]) + '|' + hk(r[2]);
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
  const SX = 1590,
    SW2 = 300;

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
        at(E('backpass', '', '', [], { gasA: 'm:IDF', gasB: 'm:IDF' }), BX, BY, { id: 'bp', under: true, sc: BS }),
        ...tags(RH, RXA, RXB, 'r'),
        ...tags(SH, SXA, SXB, 's'),
        /* steam supply */
        at(L('drum-steam', 'Superheater panel 1 outlet', { back: true }), 170, 70, { id: 'sl' }),
        at(
          B('Steam supply valve MV-SB1001', 'data-dy="DITL-80S|o|5|neg" data-on="OPEN" data-off="CLOSED"', { w: 230 }),
          170,
          150,
          {
            id: 'sv'
          }
        ),
        at(C('PICSB1052', 'Sootblower steam pressure valve', { tag: 'PCV-SB1053', wrap: 16 }), 170, 270, {
          id: 'pc',
          rot: 90,
          lab: 'r'
        }),
        /* drains */
        at(
          B('Drain A bypass valve XV-SB1054', 'data-dy="DITL-80R|o|20" data-on="OPEN" data-off="CLOSED"', { w: 240 }),
          170,
          560,
          {
            id: 'da'
          }
        ),
        at(
          B('Drain B bypass valve XV-SB1059', 'data-dy="DITL-80R|o|11" data-on="OPEN" data-off="CLOSED"', { w: 240 }),
          170,
          690,
          {
            id: 'db'
          }
        ),
        /* rotary air heater, gas side */
        at(
          E('airheater', 'Rotary air heater', '', [V('Hot end', 'PT-SB1040', K, 1), V('Cold end', 'PT-SB1042', K, 1)]),
          150,
          880,
          { id: 'ah', sc: 1.2, lab: 'b' }
        ),
        at(B('N-1040', op('DITL-80F', 25, 'N-1040') + ' data-n="40"', { plain: true, w: CW2 }), 300, 858, {
          id: 'a40'
        }),
        at(B('N-1042', op('DITL-80F', 25, 'N-1042') + ' data-n="42"', { plain: true, w: CW2 }), 300, 902, {
          id: 'a42'
        }),
        ...ST.map((s, i) => at(B(s[0], s[1], { w: SW2 }), SX, 110 + i * 46, { id: 'st' + i }))
      ],
      pipes: [
        { med: 'steam', w: 4, pts: ['sl.b', 'sv.t'], flow: FL, arrow: false },
        { med: 'steam', w: 4, pts: ['sv.b', 'pc.l'], flow: FL, arrow: false },
        { med: 'steam', w: 4, pts: ['pc.r', [170, 420], [400, 420], [400, 70], [RISS, 70]], flow: FL, arrow: false },
        /* the two risers beside the casing and a lance into the pass at each level */
        {
          med: 'steam',
          w: 3.4,
          pts: [
            [RISR, 70],
            [RISR, py(470)]
          ],
          flow: FL,
          arrow: false
        },
        {
          med: 'steam',
          w: 3.4,
          pts: [
            [RISS, 70],
            [RISS, py(470)]
          ],
          flow: FL,
          arrow: false
        },
        ...RH.map(r => ({
          med: 'steam',
          w: 2.6,
          pts: [
            [RISR, py(r[0])],
            [px(92), py(r[0])]
          ],
          flow: blow(r),
          arrow: false
        })),
        ...SH.map(r => ({
          med: 'steam',
          w: 2.6,
          pts: [
            [RISS, py(r[0])],
            [px(124), py(r[0])]
          ],
          flow: blow(r),
          arrow: false
        })),
        /* air heater blowers */
        {
          med: 'steam',
          w: 3,
          pts: [
            [400, 420],
            [400, 880]
          ],
          flow: FL,
          arrow: false
        },
        { med: 'steam', w: 2.6, pts: [[400, 858], 'a40.r'], flow: FL, arrow: false },
        { med: 'steam', w: 2.6, pts: [[400, 902], 'a42.r'], flow: FL, arrow: false },
        {
          med: 'steam',
          w: 2.6,
          pts: [
            [400, 858],
            [400, 902]
          ],
          flow: FL,
          arrow: false
        },
        { med: 'steam', w: 2.6, pts: ['a40.l', [222, 858]], flow: FL, arrow: false },
        { med: 'steam', w: 2.6, pts: ['a42.l', [222, 902]], flow: FL, arrow: false },
        /* drains */
        { med: 'drain', w: 2.6, pts: [[400, 560], 'da.r'], flow: FL, arrow: false },
        { med: 'drain', w: 2.6, pts: [[400, 690], 'db.r'], flow: FL, arrow: false },
        { med: 'drain', w: 2.6, pts: ['da.l', [30, 560], [30, 760]], flow: FL, arrow: false },
        { med: 'drain', w: 2.6, pts: ['db.l', [30, 690]], flow: FL, arrow: false },
        {
          med: 'drain',
          w: 2.6,
          pts: [
            [30, 760],
            [90, 760]
          ],
          to: 'blowdown tank',
          flow: FL
        }
      ],
      taps: [
        { x: 290, y: 420, side: 'b', label: 'Header', key: 'PT-SB1052', unit: K, dp: 1, tag: 'PT-SB1052' },
        { x: 340, y: 560, side: 't', label: 'Drain A', key: 'TT-SB1056', unit: '°C', dp: 0, tag: 'TT-SB1056' },
        { x: 340, y: 690, side: 't', label: 'Drain B', key: 'TT-SB1057', unit: '°C', dp: 0, tag: 'TT-SB1057' },
        { x: SX - 60, y: 740, side: 'r', label: 'System current', key: 'IT-SB01', unit: 'A', dp: 1, tag: 'IT-SB01' }
      ],
      texts: [
        { x: RXA - CW2 / 2, y: py(28) - 26, s: 'left wall', cls: 'hx-note' },
        { x: RXB - CW2 / 2, y: py(28) - 26, s: 'right wall', cls: 'hx-note' },
        { x: SXA - CW2 / 2, y: py(28) - 26, s: 'left wall', cls: 'hx-note' },
        { x: SXB - CW2 / 2, y: py(28) - 26, s: 'right wall', cls: 'hx-note' },
        { x: SX - SW2 / 2, y: 70, s: 'SEQUENCE, PERMISSIVES, ALARMS', cls: 'hx-name' },
        {
          x: 470,
          y: 985,
          s: 'Red tag = that blower is blowing. One lance is drawn per level; each level has a blower on the left wall and on the right wall.',
          cls: 'hx-note'
        }
      ]
    }
  });
})();
