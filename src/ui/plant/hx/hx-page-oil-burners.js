/* HX page in the REALISTIC look: diesel oil and the four start-up burners (user 2026-11-17: "Ganyan ang HMI na gsto ko. Dapat
   iyan lang makita ko n mga itsura").
   THE PICTURE: the oil service tank cut open on the left with the two diesel oil pumps under it, the oil line to the four
   burners one above the other on the right, each with its oil valve and its combustion air damper.
   THE CONNECTIONS, as the temporary page 11 binds them (its sources: K1AU3-PD-022 diesel oil system, 5 sheets; ABC-003E,
   ABC-028, ABC-029): oil service tank T-0701 (LT-DO0701, range 0 to 8.2 m), strainer STR-DO0001 (DPT-DO0001), diesel oil
   pumps P-0702A / B, pump outlet PT-DO0005, the recirculation valve PCV-DO0002 (PIC-DO0005) back to the tank, the supply
   valve to the burners FCV-DO1012 (HIC-DO1012); per burner A / B / C / D: FT-DO1043, oil valve FCV-DO1043-x3 (FIC-DO1043x),
   the shut-off valves XV-DO1043-x1 / x2, PT-DO1043-x2, oil gun L-1043x with atomizing and purge air, flame detector
   BT-DO1043-x, combustion air damper MCV-FA1043-x (FIC-FA1043x) from the hot secondary air; the oil return valve PCV-DO1009
   (PIC-DO1008, PT-DO1008) back to the tank; oil master FIC-OM.
   The 5 sheets of PD-022 were NOT re-read for this page: the tags, names and order are those of temporary page 11. Check the
   page against the sheets before the temporary page is removed.
   The six field valves of the diesel oil line-up (boiler.js fv0; PD-022 1/5 Rev D, SOP 20): tank outlet V-DO0003, strainer
   inlet V-DO0004, pump A suction V-DO0015 / discharge V-DO0007, pump B suction V-DO0016 / discharge V-DO0009, as valve
   symbols of the plant model (a click opens the field faceplate). Per burner four states read from the drawings as page 11
   reads them: oil shut-off valves (DITL-16 outputs 20 + 22), atomizing air valve XV-PA1043-x2 (DITL-07 input 20), burner in
   service (DITL-10 input 18), igniter (DITL-10 output 15).
   Drawn simpler: the shut-off valves, the
   atomizing air and purge air valves of a burner are not drawn: they are operated by the burner push buttons, which are the
   faceplate of the burner itself (a click on the burner). The lines to and from Unit 2 are not drawn. */
(function () {
  const { V, E, M, C, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const W_O = 5,
    W_S = 3.4,
    W_A = 8;
  /* places (the drawing is 1760 x 1000) */
  const TX = 215,
    TY = 330,
    TS = 2.4 /* tank */,
    PAX = 400,
    PBX = 590,
    SAX = 320,
    SBX = 510 /* suction risers */,
    SUY = 940 /* suction header */,
    PY = 760,
    PS = 1.6 /* pumps */,
    DY = 600 /* pump discharge line */,
    HX0 = 770 /* oil line up to the four burners */,
    BUX = 1250,
    ROW = [170, 370, 570, 770],
    AIRX = 1560; /* hot secondary air down to the four burners */
  const N = ['A', 'B', 'C', 'D'];
  const fv = t => 'h:fv-' + t;
  const TKO = fv('V-DO0003') + '&' + fv('V-DO0004') /* the tank outlet and the strainer inlet open */,
    PA = 'm:DIESEL OIL PUMP A&' + fv('V-DO0015') + '&' + fv('V-DO0007') + '&' + TKO,
    PB = 'm:DIESEL OIL PUMP B&' + fv('V-DO0016') + '&' + fv('V-DO0009') + '&' + TKO;
  const OIL = 'm:DIESEL OIL PUMP A|m:DIESEL OIL PUMP B';
  const dy = (k, on, off) => 'data-dy="' + k + '" data-on="' + on + '" data-off="' + off + '"';
  const INST = ['', ' #B', ' #C', ' #D']; /* the drawing instance of burner A ~ D */
  const burner = i => {
    const n = N[i],
      y = ROW[i],
      fl = 'l:FICDO1043' + n,
      ar = 'l:FICFA1043' + n;
    return {
      items: [
        at(
          C('FICDO1043' + n, 'Oil valve ' + n, { tag: 'FCV-DO1043-' + n + '3', cname: 'Burner ' + n + ' oil valve' }),
          940,
          y,
          {
            id: 'o' + i,
            lab: 'b'
          }
        ),
        at(
          M('burner', 'Burner ' + n, 'Burner ' + n, [V('Flame', 'BT-DO1043-' + n, '%', 1)], {
            on: 'v:BT-DO1043-' + n + '>5'
          }),
          BUX,
          y,
          {
            id: 'b' + i,
            sc: 2.6,
            lab: 'r'
          }
        ),
        at(
          C('FICFA1043' + n, 'Air damper ' + n, { tag: 'MCV-FA1043-' + n, cname: 'Burner ' + n + ' air damper' }),
          1420,
          y + 86,
          {
            id: 'a' + i,
            lab: 'b'
          }
        ),
        at(
          HX.B('Oil shut-off valves', dy('DITL-16' + INST[i] + '|o|20+22|neg', 'OPEN', 'CLOSED'), { w: 150 }),
          1140,
          y + 36,
          {
            id: 'so' + i
          }
        ),
        at(HX.B('Atomizing air valve', dy('DITL-07' + INST[i] + '|i|20', 'OPEN', 'CLOSED'), { w: 150 }), 1140, y + 74, {
          id: 'aa' + i
        }),
        at(HX.B('Burner', dy('DITL-10' + INST[i] + '|i|18', 'IN SERVICE', 'OFF'), { w: 130 }), 1660, y - 22, {
          id: 'sv' + i
        }),
        at(HX.B('Igniter', dy('DITL-10' + INST[i] + '|o|15', 'ON', 'OFF'), { w: 130 }), 1660, y + 18, { id: 'ig' + i })
      ],
      pipes: [
        { med: 'oil', w: W_O, pts: [[HX0, y], 'o' + i + '.l'], flow: fl, arrow: false },
        { med: 'oil', w: W_O, pts: ['o' + i + '.r', 'b' + i + '.l'], flow: fl },
        { med: 'hotair', w: W_A, pts: [[AIRX, y + 86], 'a' + i + '.r'], flow: ar, arrow: false },
        { med: 'hotair', w: W_A, pts: ['a' + i + '.l', [BUX, y + 86], 'b' + i + '.b'], flow: ar }
      ],
      taps: [
        { x: 850, y, side: 't', label: 'Oil flow', key: 'FT-DO1043-' + n, unit: 't/h', dp: 2, tag: 'FT-DO1043-' + n },
        { x: 1080, y, side: 't', label: 'Pressure', key: 'PT-DO1043-' + n + '2', unit: K, tag: 'PT-DO1043-' + n + '2' }
      ]
    };
  };
  const B = [0, 1, 2, 3].map(burner);

  page({
    id: 'oil-burners',
    group: 'Boiler',
    title: 'Diesel oil and burners',
    about:
      'Oil service tank, diesel oil pumps and the four start-up burners. Tags and order as temporary page 11 binds them (flow diagram K1AU3-PD-022).',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(
          E('tank', 'Oil service tank', 'T-0701', [V('Level', 'LT-DO0701', 'm', 2)], {
            id: 'do',
            liquid: 'oil',
            level: ['LT-DO0701', 0, 8.2]
          }),
          TX,
          TY,
          { id: 'tk', sc: TS, lab: 'l' }
        ),
        at(M('pump', 'DIESEL OIL PUMP A', 'Diesel oil pump A', [V('Current', 'IT-P0702A', 'A')]), PAX, PY, {
          id: 'pa',
          sc: PS,
          lab: 'b'
        }),
        at(M('pump', 'DIESEL OIL PUMP B', 'Diesel oil pump B', [V('Current', 'IT-P0702B', 'A')]), PBX, PY, {
          id: 'pb',
          sc: PS,
          lab: 'b'
        }),
        at(HX.HV('V-DO0003'), TX, 520, { id: 'v03', rot: 90, lab: 'l' }),
        at(HX.HV('V-DO0004'), TX, 620, { id: 'v04', rot: 90, lab: 'l' }),
        at(E('strainer', 'Strainer', 'STR-DO0001', [], { flow: OIL + '&' + TKO }), TX, 740, {
          id: 'str',
          rot: 90,
          lab: 'r',
          sc: 1.3
        }),
        at(HX.HV('V-DO0015'), SAX, 895, { id: 'v15', rot: -90, lab: 'r' }),
        at(HX.HV('V-DO0016'), SBX, 895, { id: 'v16', rot: -90, lab: 'r' }),
        at(HX.HV('V-DO0007'), PAX - 2 * PS, 645, { id: 'v07', rot: -90, lab: 'r' }),
        at(HX.HV('V-DO0009'), PBX - 2 * PS, 685, { id: 'v09', rot: -90, lab: 'l' }),
        at(C('PICDO0005', 'Recirculation valve', { tag: 'PCV-DO0002', wrap: 14 }), 490, 440, {
          id: 'rc',
          rot: -90,
          lab: 'r'
        }),
        at(C('HICDO1012', 'Supply valve to the burners', { tag: 'FCV-DO1012', wrap: 16 }), 690, DY, {
          id: 'sup',
          lab: 'b'
        }),
        at(C('PICDO1008', 'Oil return valve', { tag: 'PCV-DO1009' }), 430, 90, { id: 'ret', lab: 'b' }),
        at(C('FIC-OM', 'Oil master', { sym: 'ctl', unit: 't/h', pvdp: 2 }), 900, 940, { id: 'om', lab: 't' }),
        /* 3.2.5-beta.1 (JENNIE live Cold 2026-11-18, F-N): the two CRT push buttons of ABC-003E (OIL MASTER USE M.008C, OIL MASTER
           NOT USE M.008D, TPs 2 s -> FF M.008F, which lets FICDO1043A ~ D go to AUTO under FIC-OM); lit = the selection of M.008F.
           No operator page had them: the burner oil valves stayed forced to MANUAL */
        at(HX.B('OIL MASTER USE', 'data-apb="ABC-003E|M.008C|M.008F=1"', { press: true }), 1100, 915, { id: 'omu' }),
        at(HX.B('NOT USE', 'data-apb="ABC-003E|M.008D|M.008F=0"', { press: true }), 1100, 965, { id: 'omn' }),
        ...B.flatMap(b => b.items),
        at(L('combustion-air', 'Hot secondary air', { back: true }), AIRX + 80, 90, { id: 'hsa' }),
        /* 3.2.5-beta.1 (JENNIE live Cold 2026-11-18, F-M): the atomizing air of the burners is plant air (DITL-07 row 11
           PSL-PA1043-x1): the burners stayed not ready with no plant air compressor running, and no page of the burners led to it */
        at(L('compressed-air', 'Plant air (atomizing air)'), 1350, 960, { id: 'pal' })
      ],
      pipes: [
        /* tank outlet, strainer, the suction header and the suction valve of each pump */
        { med: 'oil', w: W_O, pts: ['tk.b', 'v03.l'], flow: OIL + '&' + fv('V-DO0003'), arrow: false },
        { med: 'oil', w: W_O, pts: ['v03.r', 'v04.l'], flow: OIL + '&' + TKO, arrow: false },
        { med: 'oil', w: W_O, pts: ['v04.r', 'str.l'], flow: OIL + '&' + TKO, arrow: false },
        { med: 'oil', w: W_O, pts: ['str.r', [TX, SUY], [SAX, SUY]], flow: OIL + '&' + TKO },
        { med: 'oil', w: W_O, pts: [[SAX, SUY], 'v15.l'], flow: PA, arrow: false },
        { med: 'oil', w: W_O, pts: ['v15.r', [SAX, PY], 'pa.s'], flow: PA, arrow: false },
        { med: 'oil', w: W_O, pts: [[SAX, SUY], [SBX, SUY], 'v16.l'], flow: PB, arrow: false },
        { med: 'oil', w: W_O, pts: ['v16.r', [SBX, PY], 'pb.s'], flow: PB, arrow: false },
        /* discharge valve of each pump, recirculation back to the tank, supply to the burners */
        { med: 'oil', w: W_O, pts: ['pa.d', 'v07.l'], flow: PA, arrow: false },
        { med: 'oil', w: W_O, pts: ['v07.r', [PAX - 2 * PS, DY], [490, DY]], flow: PA, arrow: false },
        { med: 'oil', w: W_O, pts: ['pb.d', 'v09.l'], flow: PB, arrow: false },
        { med: 'oil', w: W_O, pts: ['v09.r', [PBX - 2 * PS, DY], [490, DY]], flow: PB, arrow: false },
        { med: 'oil', w: W_S, pts: [[490, DY], 'rc.l'], flow: 'l:PICDO0005', arrow: false },
        { med: 'oil', w: W_S, pts: ['rc.r', [490, 330], [TX + 34 * TS, 330]], flow: 'l:PICDO0005' },
        { med: 'oil', w: W_O, pts: [[PBX - 2 * PS, DY], 'sup.l'], flow: OIL },
        { med: 'oil', w: W_O, pts: ['sup.r', [HX0, DY]], flow: 'l:HICDO1012', arrow: false },
        {
          med: 'oil',
          w: W_O,
          pts: [
            [HX0, ROW[3]],
            [HX0, ROW[0]]
          ],
          flow: 'l:HICDO1012',
          arrow: false
        },
        /* oil return to the tank */
        { med: 'oil', w: W_S, pts: [[HX0, ROW[0]], [HX0, 90], 'ret.r'], flow: 'l:PICDO1008', arrow: false },
        { med: 'oil', w: W_S, pts: ['ret.l', [TX, 90], 'tk.t'], flow: 'l:PICDO1008' },
        /* hot secondary air to the four air dampers */
        { med: 'hotair', w: W_A, pts: ['hsa.l', [AIRX, 90], [AIRX, ROW[3] + 86]], flow: 'm:SAF', arrow: false },
        ...B.flatMap(b => b.pipes)
      ],
      taps: [
        { x: TX, y: 800, side: 'l', label: 'Strainer', key: 'DPT-DO0001', unit: K, dp: 2, tag: 'DPT-DO0001' },
        { x: 440, y: DY, side: 't', label: 'Pump outlet', key: 'PT-DO0005', unit: K, tag: 'PT-DO0005' },
        { x: 560, y: 90, side: 'b', label: 'Return pressure', key: 'PT-DO1008', unit: K, tag: 'PT-DO1008' },
        ...B.flatMap(b => b.taps)
      ],
      texts: []
    }
  });
})();
