/* HX page in the REALISTIC look: furnace purge and master fuel trip (user 2026-11-17: "Lahat ng luma na HMI, alisin dyan s
   app"; "Maintain ang quality at design na nasimulan").
   THE PICTURE: what a furnace purge is, on the plant itself. The furnace cut open in the middle; the air comes in from the
   secondary air fan (wall), the primary air fan (under the bed) and the fluidizing air blowers (seal pot); the gas leaves
   through the cyclone, the back pass with its two gas dampers and the induced draft fan to the stack. In front of the
   furnace the fuel that must be off: a coal bunker with its feeder and a start-up burner. Every permissive of the purge
   stands at the piece of plant it asks about; while the fans run the air is seen sweeping the furnace.
   THE LOGIC, every Y / N read from the drawing itself (the same data-dy rows as temporary page 10 of hmi-mock.js):
   - furnace purge permissive: DITL-01, all 15 must be Y;
   - purge sequence: DITL-02 (permissive, burner air dampers at purge position, FURNACE PURGE START, 5 minutes, completed) and
     the reset of the master fuel trip (DITL-03A output 16);
   - master fuel trip: the 18 trip inputs of DITL-03A and its first out.
   THE CONNECTIONS: K1AU3-PD-051 Rev A (furnace, cyclone, seal pot, back pass, induced draft fan, stack), PD-052 / PD-053 /
   PD-054 Rev A (primary air, secondary air, fluidizing air), as the Furnace and Combustion air pages draw them in full.
   Drawn simpler than the sheets, on purpose (this page is about the purge, the full trains are on their own pages): one
   coal bunker and feeder stand for A / B / C, one burner for A / B / C / D, one blower for A / B, one cyclone for A / B; the
   air heater, the precipitator and the limestone feed are not drawn.
   NO-SOURCE in the app (as on page 10): the purge time (the 300 s on-delay of DITL-02 has no readout).
   The furnace purge start push button is pressed on its drawing (DITL-02, M.0500), as on page 10. */
(function () {
  const { V, E, M, C, L, page } = HX;
  const B = HX.B;
  const MM = 'mmH₂O';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const dy = (k, g) => 'data-dy="' + k + '"' + (g ? ' data-g="' + g + '"' : '');
  const W_G = 12,
    W_A = 10,
    W_C = 7;
  /* places (the drawing is 1760 x 1000) */
  const FX = 800,
    FY = 70,
    FS = 1.5 /* furnace: roof centre */,
    CX = 999,
    CY = 82,
    CS = 1.5 /* cyclone */,
    BPX = 1120,
    BPY = 110,
    BS = 0.85 /* back pass: top left corner */,
    GX = BPX + 108 * BS /* gas out of the back pass, down to the fan */,
    IX = GX + 102,
    IY = 640,
    IS = 1.4 /* induced draft fan */,
    SX = 1680,
    SY = 700,
    SS = 2.6 /* stack */,
    QX = 150 /* purge sequence column */,
    QY = 300,
    QD = 42,
    CW = 270 /* a permissive at its equipment */,
    TY = 806,
    TD = 35,
    TW = 440; /* master fuel trip strip */
  const IDF = 'm:IDF',
    SAF = 'm:SAF',
    PAF = 'm:PAF',
    FAB = 'm:FA BLOWER-A|m:FA BLOWER-B',
    COAL = 'm:COAL FEEDER A|m:COAL FEEDER B|m:COAL FEEDER C',
    BUR = 'm:Burner A|m:Burner B|m:Burner C|m:Burner D';
  const SEQ = [
    ['1 Permissive OK', 'DITL-02|i|14'],
    ['2 Burner air dampers at purge position 25 %', 'DITL-02|i|1+2+3+4'],
    ['3 FURNACE PURGE START pressed', 'DITL-02|i|5'],
    ['4 Purge in progress, 5 minutes', 'DITL-02|o|5'],
    ['5 Furnace purge completed', 'DITL-02|o|14'],
    ['6 Master fuel trip reset', 'DITL-03A|o|16|neg']
  ];
  const MFT = [
    'Induced draft fan stopped',
    'Secondary air fan stopped',
    'All fluidizing air blowers stopped (60 s)',
    'Primary air fan stopped',
    'Total air flow below 25 % of full load',
    'Furnace pressure high-high (2 of 3, 5 s)',
    'Furnace pressure low-low',
    'Drum level high-high (2 of 3, 5 s)',
    'Drum level low-low (2 of 3, 5 s)',
    'Loss of all fuel',
    'Primary air flow low-low',
    'Furnace temperature inadequate for coal firing',
    'Emergency trip push button (screen)',
    'Emergency trip push button (desk)',
    'Instrument air pressure low-low',
    'Cyclone outlet gas temperature high-high',
    'Reheater outlet header temperature high-high',
    'Turbine trip'
  ];
  /* a permissive of DITL-01 beside the piece of plant it asks about */
  const pp = (id, text, k, x, y, w) => at(B(text, dy(k, 'PP'), { w: w || CW }), x, y, { id });

  page({
    id: 'purge-trip',
    group: 'Boiler',
    title: 'Purge and trip',
    about:
      'The furnace purge on the plant: air from the fans through the furnace to the stack, each permissive at its equipment (DITL-01), the purge sequence (DITL-02) and the master fuel trip (DITL-03A). Y = true.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        /* ---- the way of the purge air ---- */
        at(E('furnace', '', '', [], { fire: 'v:TT-FG1090>300' }), FX, FY, { id: 'fu', under: true, sc: FS }),
        at(E('cyclone', '', '', [], { flow: IDF }), CX, CY, { id: 'cy', under: true, sc: CS }),
        at(E('sealpot', '', '', [], { flow: FAB }), CX, CY + 196 * CS, { id: 'sp', under: true, sc: CS, mir: true }),
        at(E('backpass', '', '', [], { gasA: 'l:HICHR1002A', gasB: 'l:HICHR1002B' }), BPX, BPY, {
          id: 'bp',
          under: true,
          sc: BS
        }),
        at(
          C('HICHR1002A', 'Reheater pass damper', { sym: 'louver', w: 78, tag: 'TCV-FG1116A-D', wrap: 14 }),
          BPX + 56 * BS,
          BPY + 350 * BS,
          { id: 'dma', lab: 'b' }
        ),
        at(
          C('HICHR1002B', 'Superheater pass damper', { sym: 'louver', w: 78, tag: 'TCV-FG1117A-D', wrap: 14 }),
          BPX + 160 * BS,
          BPY + 350 * BS,
          { id: 'dmb', lab: 'b' }
        ),
        at(M('fan', 'IDF', 'Induced draft fan', [V('Current', 'IT-F1056', 'A')]), IX, IY, {
          id: 'idf',
          sc: IS,
          lab: 'b'
        }),
        at(E('stack', '', '', [], { flow: IDF }), SX, SY, { id: 'st', under: true, sc: SS }),
        at(M('fan', 'SAF', 'Secondary air fan', []), 150, 130, { id: 'saf', sc: 1.3, lab: 'b' }),
        at(M('fan', 'PAF', 'Primary air fan', []), 540, 705, { id: 'paf', sc: 1.3, lab: 'r' }),
        at(E('fan', 'Fluidizing air blowers', 'F-1055A / B', [], { on: FAB }), 977, 585, {
          id: 'fab',
          sc: 1.1,
          lab: 'b'
        }),

        /* ---- the fuel that must be off ---- */
        at(E('bunker', 'Coal bunkers', 'T-1008A / B / C', []), 420, 200, { id: 'bk', sc: 1.3, lab: 'l' }),
        at(E('feeder', 'Coal feeders', 'L-1061A / B / C', [], { on: COAL }), 454, 300, {
          id: 'fd',
          sc: 1.3,
          lab: 'l'
        }),
        at(E('burner', '', '', [], { on: BUR }), 692, 427, { id: 'bu', sc: 1.5 }),

        /* ---- the 15 permissives of DITL-01, each at its equipment ---- */
        pp('pp1', 'Secondary air fan running', 'DITL-01|i|1', 150, 232),
        pp('pp3', 'Primary air fan running', 'DITL-01|i|3', 300, 690),
        pp('pp4', 'Total air flow above 25 % of full load', 'DITL-01|i|12|neg', 300, 730),
        pp('pp2', 'Any fluidizing air blower running', 'DITL-01|i|2', 990, 676),
        pp('pp0', 'Induced draft fan running', 'DITL-01|i|0', IX, 734),
        pp('pp7', 'All coal feeders stopped (A, B, C)', 'DITL-01|o|21', 440, 388),
        pp('pp8', 'All coal feeder outlet valves closed', 'DITL-01|i|16+17+18', 440, 428),
        pp('pp5', 'All burners no flame (A to D)', 'DITL-01|o|4', 440, 490),
        pp('pp6', 'All burner oil valves closed (A to D)', 'DITL-01|i|8+9+10+11', 440, 530),
        pp('pp9', 'Limestone rotary valve stopped', 'DITL-01|i|13|neg', 440, 592),
        pp('pp10', 'Reheater gas damper at least 30 %', 'DITL-01|i|15', 1475, 400, 290),
        pp('pp11', 'Superheater gas damper at least 60 %', 'DITL-01|i|19', 1475, 440, 290),
        pp('pp13', 'Cyclone outlet gas temperature not high-high', 'DITL-03A|i|23|neg', 1490, 130, 320),
        pp('pp14', 'Reheater outlet header temperature not high-high', 'DITL-03A|i|24|neg', 1490, 170, 320),
        pp('pp12', 'No boiler trip command', 'DITL-01|i|14', 1475, 500, 290),

        /* ---- purge sequence (DITL-02) ---- */
        at(B('Purge permissive', 'data-dys="PP|DITL-01|9|PURGE PERMISSIVE"', { w: CW }), QX, QY, { id: 'pps' }),
        ...SEQ.map((p, i) => at(B(p[0], dy(p[1]), { w: CW }), QX, QY + (i + 1) * QD, { id: 'sq' + i })),
        at(B('Furnace purge', 'data-do="DITL-02|15|OK|NOT OK"', { w: CW }), QX, QY + 7 * QD + 10, { id: 'fp' }),
        at(B('Purge ready', 'data-do="DITL-02|9|YES|NO"', { w: CW }), QX, QY + 8 * QD + 10, { id: 'pr' }),

        /* ---- master fuel trip (DITL-03A) ---- */
        ...MFT.map((t, i) =>
          at(B(t, dy('DITL-03A|i|' + (i + 1)), { w: TW }), 240 + Math.floor(i / 6) * 460, TY + (i % 6) * TD, {
            id: 'mf' + i
          })
        ),
        at(B('Master fuel trip', 'data-dfo="DITL-03A|16|1-18"', { w: 330 }), 1570, TY, { id: 'mfs' }),
        at(L('combustion-air', 'Fans and air flow', { back: true }), 1485, TY + 50, { id: 'cal' }),
        at(L('furnace-gas', 'Furnace and flue gas', { back: true }), 1655, TY + 50, { id: 'fgl' }),
        at(L('oil-burners', 'Burners', { back: true }), 1485, TY + 92, { id: 'obl' }),
        at(L('coal', 'Coal feeders', { back: true }), 1655, TY + 92, { id: 'col' }),
        at(L('turbine', 'Turbine trip', { back: true }), 1485, TY + 128, { id: 'tbl' })
      ],
      pipes: [
        /* air in */
        { med: 'air', w: W_A, pts: ['saf.out', [147, 40], [670, 40], [670, FY + 214 * FS], 'fu.sa1'], flow: SAF },
        { med: 'air', w: W_A, pts: ['paf.out', [537, 640], [FX, 640], 'fu.pa'], flow: PAF },
        { med: 'air', w: 6, pts: ['fab.out', 'sp.air'], flow: FAB },
        /* gas out */
        { med: 'gas', w: W_G, pts: ['fu.out', 'cy.in'], flow: IDF, arrow: false },
        { med: 'gas', w: W_G, pts: ['cy.gas', [CX, 30], [BPX + 46 * BS, 30], 'bp.gin'], flow: IDF },
        { med: 'solid', w: 5, pts: ['sp.out', [915, CY + 212 * CS], [915, FY + 290 * FS], 'fu.ret'], flow: FAB },
        { med: 'gas', w: W_G, pts: ['bp.gout', [GX, IY], 'idf.in'], flow: IDF },
        {
          med: 'gas',
          w: W_G,
          pts: ['idf.out', [IX - 2 * IS, 570], [1600, 570], [1600, SY - 14 * SS], 'st.in'],
          flow: IDF
        },
        /* fuel */
        { med: 'coal', w: W_C, pts: ['bk.b', 'fd.in'], flow: COAL, arrow: false },
        { med: 'coal', w: W_C, pts: ['fd.out', [490.4, 345], [620, 345], [620, FY + 276 * FS], 'fu.coal'], flow: COAL }
      ],
      taps: [
        { x: 740, y: 640, side: 'b', label: 'Primary air', key: 'pv:FICFA1071', unit: 't/h', tag: 'FT-FA1071' },
        { x: 400, y: 40, side: 'b', label: 'Secondary air', key: 'pv:FICFA1081', unit: 't/h', tag: 'FT-FA1081' }
      ],
      texts: [
        { x: QX - CW / 2, y: QY - 30, s: 'PURGE SEQUENCE', cls: 'hx-zone' },
        { x: 440 - CW / 2, y: 362, s: 'COAL', cls: 'hx-zone' },
        { x: 440 - CW / 2, y: 464, s: 'BURNERS A TO D', cls: 'hx-zone' },
        { x: 440 - CW / 2, y: 566, s: 'LIMESTONE', cls: 'hx-zone' },
        { x: 1330, y: 230, s: 'FURNACE', cls: 'hx-zone' },
        { x: 1330, y: 250, s: 'Total air flow', key: 'ABC-002|SI0060', unit: 't/h' },
        { x: 1330, y: 266, s: 'Pressure 1', key: 'PT-FG1085', unit: MM, dp: 0 },
        { x: 1330, y: 282, s: 'Pressure 2', key: 'PT-FG1086', unit: MM, dp: 0 },
        { x: 1330, y: 298, s: 'Pressure 3', key: 'PT-FG1087', unit: MM, dp: 0 },
        { x: 1330, y: 314, s: 'Lower bed temperature', key: 'TT-FG1090', unit: '°C', dp: 0 },
        { x: 1330, y: 330, s: 'Cyclone outlet A', key: 'TT-FG1095-A', unit: '°C', dp: 0 },
        { x: 1330, y: 346, s: 'Cyclone outlet B', key: 'TT-FG1095-B', unit: '°C', dp: 0 },
        { x: 20, y: TY - 34, s: 'MASTER FUEL TRIP · any one trips', cls: 'hx-zone' },
        { x: 292, y: 624, s: 'Hot restart: bed above 700 °C counts', cls: 'hx-note' },
        { x: 292, y: 638, s: 'the purge complete 7 s after the trip.', cls: 'hx-note' },
        { x: 292, y: 652, s: 'Reset: purge completed, no trip input left.', cls: 'hx-note' }
      ]
    }
  });
})();
