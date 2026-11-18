/* HX page in the REALISTIC look: limestone feed and sand injection into the furnace (user 2026-11-17: "Lahat ng luma na HMI,
   alisin dyan s app"; "Maintain ang quality at design na nasimulan").
   THE PICTURE: the furnace cut open in the middle. On its left the limestone train as it stands, one piece above the other:
   the daily silo with its vent fan, the lock vessel, the dense phase (dispensing) vessel, the rotary feeder, and the
   conveying line that carries the limestone with air to the injection valves of the furnace. On its right the sand train: the
   sand silo with its vent fan, the dense phase vessel, its outlet valve and the conveying line to the rear wall.
   THE CONNECTIONS:
     K1AU3-PD-062 Rev A sheet 1  limestone feed system: daily silo T-1311 (LT-LM1800) with vent filter S-1313 and vent fan
                                 F-1313; dome valve into the lock vessel S-1311 (PT-LM1811) with its vent valve and balance
                                 valve; dome valve into the dense phase vessel S-1312 (PT-LM1812); limestone feeder L-1311
                                 (rotary, variable speed); conveying line LM-1-812 with its line air; air tank T-1312 on plant air
     K1AU3-PD-063 Rev A sheet 1  sand injection system: sand silo T-1300 (LT-SD1800) with vent filter S-1301 and vent fan
                                 F-1301; dome valve XV-SD1804 into the dense phase vessel S-1300 (PT-SD1800), vent valve
                                 XV-AV1803, outlet valve XV-SD1801, conveying air XV-PA1800 from the air tank T-1301, line
                                 SD-1-800 to the boiler
   The valve tags and every OPEN / CLOSED / RUNNING are those the temporary page 12 binds to the logic (DITL-LS110 ~ LS214 for
   limestone, DITL-771 / 774 / 776 for sand): the eight furnace injection valves XV-LM1811A ~ H (A to F, and G, H on the rear
   side) and the two sand valves XV-SD1802A / B on the rear side are on sheet 2 of each drawing, NOT re-read for this page.
   Drawn simpler than the sheets: the vent filters are part of the silo top; the pneumatic control panels, the fluidizing
   valves, the density stabilisers, the 4 way splitter and the hand valves are not drawn; the eight injection valves are a row
   of states at the furnace, not eight lines.
   The start controls are the three faceplates the old page has (hmi-mock-pb.js): the system (silo; DITL-LS10 / DITL-771), the
   isolating valves (DITL-LS212 switch row 10; DITL-776 row 3) and the limestone feeder (DITL-LS110 rows 8 / 9). The order in the
   notes on the page is the one that starts the system in the app (headless 2026-11-18: isolating valves, feeder, system;
   the system START pressed first does not latch).
   The SOx controller AICFG10571 (ABC-005) that sets the feeder speed has its faceplate next to the feeder (F-AM 2026-11-18).
   NO-SOURCE in the app: the speed of the limestone feeder (ST-M1311 has no signal in hx-registry.js). */
(function () {
  const { V, E, M, C, L, page } = HX;
  const B = HX.B;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const dy = (k, on, off) =>
    'data-dy="' + k + '" data-on="' + (on || 'OPEN') + '" data-off="' + (off || 'CLOSED') + '"';
  /* a valve of the logic as a valve symbol: red while the drawing says open */
  let nv = 0;
  const xv = (name, tag, k, o) =>
    E('valve', name, tag, [], Object.assign({ kind: 'shutoff', on: HX.hk('ls' + ++nv, dy(k)), wrap: 12 }, o || {}));
  const W_S = 6,
    W_A = 4;
  /* places (the drawing is 1760 x 1000) */
  const FX = 880,
    FY = 150,
    FS = 1.6 /* furnace: roof centre */,
    LX = 250 /* limestone train */,
    SX = 1500; /* sand train */
  const LM_RUN = HX.hk('lm-fd', dy('DITL-LS110|o|20', 'RUNNING', 'STOPPED')),
    LM_FAN = HX.hk('lm-fan', dy('DITL-LS214|o|17', 'RUNNING', 'STOPPED')),
    SD_FAN = HX.hk('sd-fan', dy('DITL-774|o|21', 'RUNNING', 'STOPPED')),
    SD_OUT = HX.hk('sd-out', dy('DITL-771|o|23')),
    SD_AIR = HX.hk('sd-air', dy('DITL-771|o|24'));
  const INJ = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  page({
    id: 'limestone-sand',
    group: 'Boiler',
    title: 'Limestone and sand',
    about:
      'Limestone feed and sand injection into the furnace: silo, vessels, feeder and conveying line of each. Connections: flow diagrams K1AU3-PD-062 and PD-063 Rev A; the states are read from the logic drawings.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(E('furnace', '', '', [], { fire: 'v:TT-FG1090>300' }), FX, FY, { id: 'fu', under: true, sc: FS }),

        /* ---- limestone ---- */
        at(
          M('silo', 'Limestone system', 'Limestone daily silo', [V('Level', 'LT-LM1800', '%', 1)], {
            id: 'lm',
            h: 110,
            level: ['LT-LM1800', 0, 100]
          }),
          LX,
          210,
          { id: 'lm', sc: 2, lab: 'l' }
        ),
        at(E('fan', 'Vent fan', 'F-1313', [], { on: LM_FAN }), LX + 150, 110, { id: 'lmf', sc: 0.8, lab: 'r' }),
        at(xv('Lock vessel inlet valve', 'XV-LM1812', 'DITL-LS170|o|1'), LX, 370, { id: 'lv1', rot: 90, lab: 'l' }),
        at(E('silo', 'Lock vessel', 'S-1311', [V('Pressure', 'PT-LM1811', K)], { id: 'lk', h: 76 }), LX, 480, {
          id: 'lk',
          sc: 1.5,
          lab: 'l'
        }),
        at(xv('Vent valve', 'XV-LM1814A', 'DITL-LS160|o|1'), LX + 130, 440, { id: 'lv3', lab: 't' }),
        at(xv('Balance valve', 'XV-LM1814B', 'DITL-LS190|o|1'), LX + 130, 520, { id: 'lv4', lab: 'b' }),
        at(xv('Dispensing vessel inlet valve', 'XV-LM1815', 'DITL-LS180|o|1', { wrap: 16 }), LX, 588, {
          id: 'lv2',
          rot: 90,
          lab: 'l'
        }),
        at(E('silo', 'Dispensing vessel', 'S-1312', [V('Pressure', 'PT-LM1812', K)], { id: 'dv', h: 76 }), LX, 700, {
          id: 'dv',
          sc: 1.5,
          lab: 'l'
        }),
        at(M('rotary', 'L-1311', 'Limestone feeder', []), LX, 812, { id: 'lfd', sc: 1.5, lab: 'l' }),
        /* the SOx control sets the feeder speed (ABC-005 AICFG10571, PV = stack SOx AT-FG1057-1 0 ~ 500 ppm, I/O list STN101 AI0466;
           HMI snapshot 19.PNG SV 200 ppm): the operator puts it in AUTO here (F-AM, Jennie live run 2026-11-18) */
        at(C('AICFG10571', 'Limestone feed, stack SOx control', { sym: 'ctl', unit: 'ppm', pvdp: 0, wrap: 26 }), LX + 190, 790, {
          id: 'sox',
          lab: 'r'
        }),
        at(M('valve', 'XV-LM1811A ~ H', 'Isolating valves A to H', [], { kind: 'shutoff', wrap: 12 }), 370, 890, {
          id: 'liso',
          lab: 't'
        }),
        at(M('valve', 'XV-SD1802A / B', 'Sand isolating valves', [], { kind: 'shutoff', wrap: 12 }), 1060, 560, {
          id: 'siso',
          rot: -90,
          lab: 'r'
        }),
        at(xv('Equalising air valve', 'XV-PA1814C', 'DITL-LS200|o|1'), 110, 890, { id: 'lv5', lab: 'b' }),
        at(L('compressed-air', 'Plant air', { back: true }), 40, 960, { id: 'pal' }),
        at(B('Bypass air valves', dy('DITL-LS212|o|9+10'), { w: 170 }), 640, 940, { id: 'lby' }),
        ...INJ.map((n, i) =>
          at(
            B('Injection valve ' + n, dy('DITL-LS212|o|' + (11 + i)), { w: 148 }),
            i < 6 ? 555 + (i % 2) * 156 : 1195,
            i < 6 ? 630 + Math.floor(i / 2) * 40 : 650 + (i - 6) * 40,
            { id: 'inj' + n }
          )
        ),

        /* ---- sand ---- */
        at(
          M('silo', 'Sand system', 'Sand silo', [V('Level', 'LT-SD1800', '%', 1)], {
            id: 'sd',
            h: 110,
            level: ['LT-SD1800', 0, 100]
          }),
          SX,
          210,
          { id: 'sd', sc: 2, lab: 'r' }
        ),
        at(E('fan', 'Vent fan', 'F-1301', [], { on: SD_FAN }), SX - 150, 110, {
          id: 'sdf',
          sc: 0.8,
          lab: 'l',
          mir: true
        }),
        at(xv('Inlet valve', 'XV-SD1804', 'DITL-771|o|21'), SX, 380, { id: 'sv1', rot: 90, lab: 'r' }),
        at(E('silo', 'Dense phase vessel', 'S-1300', [V('Pressure', 'PT-SD1800', K)], { id: 'sv', h: 86 }), SX, 510, {
          id: 'sv',
          sc: 1.6,
          lab: 'r'
        }),
        at(xv('Vent valve', 'XV-AV1803', 'DITL-771|o|19'), SX - 140, 470, { id: 'sv3', lab: 't' }),
        at(E('valve', 'Outlet valve', 'XV-SD1801', [], { kind: 'shutoff', on: SD_OUT }), SX, 640, {
          id: 'sv2',
          rot: 90,
          lab: 'r'
        }),
        at(E('vvessel', 'Air tank', 'T-1301', [], { h: 80, w: 40 }), 1680, 760, { id: 'sat', lab: 't' }),
        at(E('valve', 'Conveying air valve', 'XV-PA1800', [], { kind: 'shutoff', on: SD_AIR, wrap: 12 }), 1600, 730, {
          id: 'sv4',
          lab: 'b'
        }),
        at(B('Sand valve A, rear side', dy('DITL-776|o|10'), { w: 190 }), 1215, 420, { id: 'sda' }),
        at(B('Sand valve B, rear side', dy('DITL-776|o|12'), { w: 190 }), 1215, 460, { id: 'sdb' }),
        at(B('Bypass air valve', dy('DITL-776|o|11'), { w: 190 }), 1215, 500, { id: 'sdy' }),
        at(L('coal', 'Coal feeders', { back: true }), 880, 60, { id: 'col' })
      ],
      pipes: [
        /* limestone down the train */
        { med: 'solid', w: W_S, pts: ['lm.b', 'lv1.l'], flow: 'h:ls1', arrow: false },
        { med: 'solid', w: W_S, pts: ['lv1.r', 'lk.t'], flow: 'h:ls1' },
        { med: 'solid', w: W_S, pts: ['lk.b', 'lv2.l'], flow: 'h:ls4', arrow: false },
        { med: 'solid', w: W_S, pts: ['lv2.r', 'dv.t'], flow: 'h:ls4' },
        { med: 'solid', w: W_S, pts: ['dv.b', 'lfd.t'], flow: LM_RUN, arrow: false },
        /* vent and balance of the lock vessel */
        { med: 'air', w: W_A, pts: [[LX + 30, 440], 'lv3.l'], flow: 'h:ls2', arrow: false },
        { med: 'air', w: W_A, pts: ['lv3.r', [LX + 200, 440], [LX + 200, 250], [LX + 46, 250]], flow: 'h:ls2' },
        { med: 'air', w: W_A, pts: [[LX + 30, 520], 'lv4.l'], flow: 'h:ls3', arrow: false },
        { med: 'air', w: W_A, pts: ['lv4.r', [LX + 200, 520], [LX + 200, 700], [LX + 34, 700]], flow: 'h:ls3' },
        {
          med: 'air',
          w: W_A,
          pts: [[LX + 46, 130], [LX + 80, 130], [LX + 80, 110], 'lmf.in'],
          flow: LM_FAN,
          arrow: false
        },
        /* conveying line: air in at the feeder, limestone and air to the furnace */
        { med: 'air', w: W_A, pts: ['pal.r', [110, 960], 'lv5.b'], flow: 'h:ls5', arrow: false },
        {
          med: 'air',
          w: W_A,
          pts: [
            [110, 870],
            [110, 850],
            [LX, 850]
          ],
          flow: 'h:ls5',
          arrow: false
        },
        { med: 'solid', w: W_S, pts: ['lfd.b', [LX, 890], 'liso.l'], flow: LM_RUN, arrow: false },
        {
          med: 'solid',
          w: W_S,
          pts: ['liso.r', [470, 890], [470, FY + 258 * FS], 'fu.lime'],
          flow: LM_RUN + '&m:XV-LM1811A ~ H'
        },
        {
          med: 'solid',
          w: W_S,
          pts: [[470, 890], [1000, 890], [1000, FY + 290 * FS], 'fu.ret'],
          flow: LM_RUN + '&m:XV-LM1811A ~ H'
        },
        /* sand */
        { med: 'solid', w: W_S, pts: ['sd.b', 'sv1.l'], flow: 'h:ls6', arrow: false },
        { med: 'solid', w: W_S, pts: ['sv1.r', 'sv.t'], flow: 'h:ls6' },
        { med: 'solid', w: W_S, pts: ['sv.b', 'sv2.l'], flow: SD_OUT, arrow: false },
        { med: 'air', w: W_A, pts: [[SX - 30, 470], 'sv3.r'], flow: 'h:ls7', arrow: false },
        { med: 'air', w: W_A, pts: ['sv3.l', [SX - 200, 470], [SX - 200, 250], [SX - 46, 250]], flow: 'h:ls7' },
        {
          med: 'air',
          w: W_A,
          pts: [[SX - 46, 130], [SX - 80, 130], [SX - 80, 110], 'sdf.in'],
          flow: SD_FAN,
          arrow: false
        },
        { med: 'air', w: W_A, pts: ['sat.l', [1640, 780], [1640, 730], 'sv4.r'], flow: SD_AIR, arrow: false },
        { med: 'air', w: W_A, pts: ['sv4.l', [SX, 730]], flow: SD_AIR, arrow: false },
        { med: 'solid', w: W_S, pts: ['sv2.r', [SX, 800], [1060, 800], 'siso.l'], flow: SD_OUT, arrow: false },
        { med: 'solid', w: W_S, pts: ['siso.r', [1060, FY + 214 * FS], 'fu.sa2'], flow: SD_OUT + '&m:XV-SD1802A / B' }
      ],
      taps: [],
      texts: [
        /* DITL-776: with CLOSE selected the valves close 300 s after SYSTEM ON drops (TR328, line purge), 180 s after an
           emergency stop or a master fuel trip (TR329) (Jennie 2026-11-18) */
        {
          x: 1736,
          y: 58,
          s: 'After CLOSE the sand valves close 5 minutes after the system stops (line purge).',
          cls: 'hx-note',
          anchor: 'end'
        },
        {
          x: 24,
          y: 40,
          s: 'To start limestone: 1 Isolating valves OPEN · 2 Limestone feeder START · 3 Limestone system START',
          cls: 'hx-note'
        },
        {
          x: 1736,
          y: 40,
          s: 'To start sand: 1 Sand isolating valves OPEN · 2 Sand system START',
          cls: 'hx-note',
          anchor: 'end'
        },
        { x: 481, y: 604, s: 'LIMESTONE INJECTION · A to F', cls: 'hx-zone' },
        { x: 1121, y: 624, s: 'LIMESTONE · REAR SIDE', cls: 'hx-zone' },
        { x: 1120, y: 392, s: 'SAND · REAR SIDE', cls: 'hx-zone' },
        { x: 1121, y: 740, s: 'Bed temperature', key: 'TT-FG1090', unit: '°C', dp: 0 },
        { x: 1121, y: 756, s: 'Bed pressure drop', key: 'DPT-FG1081', unit: 'mmH₂O', dp: 0 }
      ]
    }
  });
})();
