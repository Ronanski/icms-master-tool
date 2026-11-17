/* HX page in the REALISTIC look: water and steam sampling and chemical dosing (user 2026-11-17: "Lahat ng luma na HMI, alisin
   dyan s app"; "Maintain ang quality at design na nasimulan").
   THE PICTURE: above, the sampling rack: the eight sample streams of the water and steam cycle, each through its sample
   cooler to its analyzers. Below, the three chemical dosing skids: a solution tank and two dosing pumps each (A runs, B
   stands by), with the place in the cycle where the chemical goes.
   THE CONNECTIONS (as temporary page 16 has them, flow diagram K1AU3-PD-042 / PD-044; the drawings were NOT re-read for
   this page):
     sample points SP-1-001 ~ 008 and their analyzers AT-SP1001 ~ 1021: I/O list AI0320 ~ AI0358 (name, range and unit of
       every analyzer are the I/O list line)
     alarms AL1-SP01 / AL2-SP01 / AL3-SP01 / AL-Z1110: I/O list I.053C ~ I.053F
     dosing pumps Z-1107A / B (phosphate), Z-1108A / B (neutral amine), Z-1109A / B (carbohydrazide), agitator Z-1101:
       RUNNING inputs I.0120 ~ I.012C; field equipment, no DCS command in the I/O list (PR-OPE-5002: one pump of each
       chemical runs, B stands by)
     tank level switches LSH / LSL / LSLL-CH1101 / 1103 / 1105: I.0130 ~ I.0138
   No ABC / DITL sheet reads these signals: the plant model gives them (unit.js AN_CHEM). Without a value in the plant model
   (shown as -----): make-up conductivity and silica, saturated steam conductivity, the silica analyzers, the tank level
   switches.
   Drawn simpler: the pressure reducers, the grab sample sink, the chilled water lines of the coolers, the measuring vessels
   Z-1102 / 1104 / 1106 and the demineralized water fill are not drawn. */
(function () {
  const { V, E, M, L, page } = HX;
  const B = HX.B;
  const US = 'µS/cm';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const di = (tag, on, off) => 'data-di="' + tag + '|' + on + '|' + off + '"';
  /* places (the drawing is 1760 x 1000) */
  const CX = i => 150 + i * 208,
    CY = 200,
    SX = [230, 790, 1330],
    TY = 730,
    PY = 790,
    HY = 640; /* dosing discharge line */
  const PH = (n, k) => V('pH', k, '', 1),
    CC = (n, k) => V(n || 'Cation conductivity', k, US, 3),
    SC = k => V('Conductivity', k, US, 1),
    O2 = k => V('Dissolved oxygen', k, 'ppb', 0),
    SI = k => V('Silica', k, 'ppb', 0);
  const STREAMS = [
    ['Deaerator inlet', 'SP-1-001', 'condensate', [PH(0, 'AT-SP1001'), CC(0, 'AT-SP1002')]],
    ['Deaerator outlet', 'SP-1-002', 'water', [PH(0, 'AT-SP1003'), O2('AT-SP1004'), CC(0, 'AT-SP1005')]],
    ['Make-up pump outlet', 'SP-1-003', 'water', [PH(0, 'AT-SP1006'), SC('AT-SP1007'), SI('AT-SP1008')]],
    ['Economizer inlet', 'SP-1-004', 'water', [PH(0, 'AT-SP1009'), O2('AT-SP1010')]],
    ['Drum water', 'SP-1-005', 'water', [PH(0, 'AT-SP1011'), SC('AT-SP1012'), SI('AT-SP1013')]],
    ['Saturated steam', 'SP-1-006', 'steam', [SC('AT-SP1014'), SI('AT-SP1015')]],
    ['Main steam', 'SP-1-007', 'steam', [PH(0, 'AT-SP1016'), SI('AT-SP1017'), CC(0, 'AT-SP1021')]],
    [
      'Condensate pump outlet',
      'SP-1-008',
      'condensate',
      [
        CC('Cation conductivity 1', 'AT-SP1018'),
        CC('Cation conductivity 2', 'AT-SP1019'),
        V('Sodium', 'AT-SP1020', 'ppb', 0)
      ]
    ]
  ];
  const SKIDS = [
    {
      name: 'Tri-sodium phosphate',
      tank: 'Z-1101',
      vol: '200 L',
      pump: 'Z-1107',
      what: 'Phosphate dosing pump',
      sw: 'CH1101',
      to: ['feedwater', 'To the economizer inlet'],
      duty: '200 ml/min at 184.62 kg/cm²'
    },
    {
      name: 'Neutral amine',
      tank: 'Z-1103',
      vol: '200 L',
      pump: 'Z-1108',
      what: 'Amine dosing pump',
      sw: 'CH1103',
      to: ['condensate', 'To the condensate line'],
      duty: '250 ml/min at 18.36 kg/cm²'
    },
    {
      name: 'Carbohydrazide',
      tank: 'Z-1105',
      vol: '100 L',
      pump: 'Z-1109',
      what: 'Carbohydrazide dosing pump',
      sw: 'CH1105',
      to: ['feedwater', 'To the deaerator'],
      duty: '100 ml/min at 12.24 kg/cm²'
    }
  ];
  const PS = 1.2; /* pump scale */
  const pa = sx => sx + 120,
    pb = sx => sx + 290;

  page({
    id: 'sampling',
    group: 'Water and steam',
    title: 'Sampling and chemical dosing',
    about:
      'The eight sample streams of the water and steam cycle with their analyzers, and the three chemical dosing skids. The analyzers are the lines of the I/O list; the dosing pumps are field equipment started at their local panel.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        /* ---- sampling rack: one cooler and its analyzers for every stream ---- */
        ...STREAMS.map((s, i) =>
          at(E('cooler', s[0], s[1], s[3], { wrap: 14 }), CX(i), CY, { id: 'c' + i, sc: 1.1, lab: 'b' })
        ),
        at(E('cubicle', 'Chiller unit', 'Z-1110', []), 1700, 400, { id: 'chl', lab: 'l' }),
        at(B('Power supply abnormal', di('AL1-SP01', 'ALARM', 'NORMAL'), { w: 210 }), 150, 410, { id: 'al1' }),
        at(B('Analyzer common alarm', di('AL2-SP01', 'ALARM', 'NORMAL'), { w: 210 }), 380, 410, { id: 'al2' }),
        at(B('Silica analyzer alarm', di('AL3-SP01', 'ALARM', 'NORMAL'), { w: 210 }), 610, 410, { id: 'al3' }),
        at(B('Chiller unit alarm', di('AL-Z1110', 'ALARM', 'NORMAL'), { w: 210 }), 1400, 410, { id: 'al4' }),

        /* ---- chemical dosing: tank, two pumps, where it goes ---- */
        ...SKIDS.flatMap((k, i) => {
          const sx = SX[i];
          return [
            at(
              E('tank', k.name + ' tank', k.tank + ' · ' + k.vol, [], { id: 'dt' + i, w: 64, h: 84, wrap: 16 }),
              sx - 110,
              TY,
              {
                id: 't' + i,
                sc: 1.5,
                lab: 'b'
              }
            ),
            at(M('pump', k.pump + 'A', k.what + ' A', [], { wrap: 14 }), pa(sx), PY, {
              id: 'pa' + i,
              sc: PS,
              lab: 'b'
            }),
            at(M('pump', k.pump + 'B', k.what + ' B', [], { wrap: 14 }), pb(sx), PY, {
              id: 'pb' + i,
              sc: PS,
              lab: 'b'
            }),
            at(L(k.to[0], k.to[1]), sx + 360, HY, { id: 'to' + i }),
            at(B('Level high', di('LSH-' + k.sw, 'YES', 'NO'), { w: 130 }), sx - 110, 900, { id: 'lh' + i }),
            at(B('Level low', di('LSL-' + k.sw, 'YES', 'NO'), { w: 130 }), sx - 110, 932, { id: 'll' + i }),
            at(B('Level low-low', di('LSLL-' + k.sw, 'YES', 'NO'), { w: 130 }), sx - 110, 964, { id: 'lll' + i })
          ];
        }),
        at(M('mixer', 'Z-1101', 'Agitator', []), SX[0] - 110, TY - 78, { id: 'agt', sc: 1.3, lab: 'l' })
      ],
      pipes: [
        /* the sample lines into the coolers */
        ...STREAMS.map((s, i) => ({ med: s[2], w: 3, pts: [[CX(i), 118], 'c' + i + '.t'], arrow: false })),
        /* dosing: tank to the two pumps, the pumps to the cycle */
        ...SKIDS.flatMap((k, i) => {
          const sx = SX[i],
            A = 'm:' + k.pump + 'A',
            Bp = 'm:' + k.pump + 'B',
            ys = TY + 32 * 1.5,
            xa = pa(sx) - 2 * PS,
            xb = pb(sx) - 2 * PS,
            xs = sx - 20;
          return [
            { med: 'water', w: 4, pts: ['t' + i + '.r', [xs, ys], [xs, PY], 'pa' + i + '.s'], flow: A, arrow: false },
            {
              med: 'water',
              w: 4,
              pts: [[xs, PY], [xs, 880], [pb(sx) - 70, 880], [pb(sx) - 70, PY], 'pb' + i + '.s'],
              flow: Bp,
              arrow: false
            },
            { med: 'water', w: 4, pts: ['pa' + i + '.d', [xa, HY], [xb, HY]], flow: A, arrow: false },
            { med: 'water', w: 4, pts: ['pb' + i + '.d', [xb, HY]], flow: Bp, arrow: false },
            { med: 'water', w: 4, pts: [[xb, HY], 'to' + i + '.l'], flow: A + '|' + Bp }
          ];
        })
      ],
      taps: [],
      texts: [
        { x: 24, y: 56, s: 'SAMPLING RACK', cls: 'hx-zone' },
        { x: 24, y: 76, s: 'Each sample is cooled, then goes to its analyzers.', cls: 'hx-note' },
        { x: 24, y: 90, s: 'The silica analyzer takes streams 3, 5, 6 and 7.', cls: 'hx-note' },
        ...STREAMS.map((s, i) => ({ x: CX(i), y: 110, s: String(i + 1), cls: 'hx-name', anchor: 'middle' })),
        { x: 24, y: 560, s: 'CHEMICAL DOSING', cls: 'hx-zone' },
        { x: 24, y: 580, s: 'Field equipment: the pumps start at their local panel.', cls: 'hx-note' },
        { x: 24, y: 594, s: 'One pump of each chemical runs, B stands by.', cls: 'hx-note' },
        ...SKIDS.map((k, i) => ({ x: pa(SX[i]) - 40, y: HY - 34, s: k.name, cls: 'hx-name' })),
        ...SKIDS.map((k, i) => ({ x: pa(SX[i]) - 40, y: HY - 18, s: k.duty, cls: 'hx-note' }))
      ]
    }
  });
})();
