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
   Drawn simpler: the strainer is not drawn (its differential pressure stands at the pump suction); the shut-off valves, the
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
    PAX = 330,
    PBX = 520,
    PY = 760,
    PS = 1.6 /* pumps */,
    DY = 600 /* pump discharge line */,
    HX0 = 700 /* oil line up to the four burners */,
    BUX = 1250,
    ROW = [170, 370, 570, 770],
    AIRX = 1560; /* hot secondary air down to the four burners */
  const N = ['A', 'B', 'C', 'D'];
  const OIL = 'm:DIESEL OIL PUMP A|m:DIESEL OIL PUMP B';
  const burner = i => {
    const n = N[i],
      y = ROW[i],
      fl = 'l:FICDO1043' + n,
      ar = 'l:FICFA1043' + n;
    return {
      items: [
        at(
          C('FICDO1043' + n, 'Oil valve ' + n, { tag: 'FCV-DO1043-' + n + '3', cname: 'Burner ' + n + ' oil valve' }),
          900,
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
        )
      ],
      pipes: [
        { med: 'oil', w: W_O, pts: [[HX0, y], 'o' + i + '.l'], flow: fl, arrow: false },
        { med: 'oil', w: W_O, pts: ['o' + i + '.r', 'b' + i + '.l'], flow: fl },
        { med: 'hotair', w: W_A, pts: [[AIRX, y + 86], 'a' + i + '.r'], flow: ar, arrow: false },
        { med: 'hotair', w: W_A, pts: ['a' + i + '.l', [BUX, y + 86], 'b' + i + '.b'], flow: ar }
      ],
      taps: [
        { x: 780, y, side: 't', label: 'Oil flow', key: 'FT-DO1043-' + n, unit: 't/h', dp: 2, tag: 'FT-DO1043-' + n },
        { x: 1050, y, side: 't', label: 'Pressure', key: 'PT-DO1043-' + n + '2', unit: K, tag: 'PT-DO1043-' + n + '2' }
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
        at(C('PICDO0005', 'Recirculation valve', { tag: 'PCV-DO0002', wrap: 14 }), 420, 440, {
          id: 'rc',
          rot: -90,
          lab: 'r'
        }),
        at(C('HICDO1012', 'Supply valve to the burners', { tag: 'FCV-DO1012', wrap: 16 }), 620, DY, {
          id: 'sup',
          lab: 'b'
        }),
        at(C('PICDO1008', 'Oil return valve', { tag: 'PCV-DO1009' }), 430, 90, { id: 'ret', lab: 'b' }),
        at(C('FIC-OM', 'Oil master', { sym: 'ctl', unit: 't/h', pvdp: 2 }), 900, 940, { id: 'om', lab: 't' }),
        ...B.flatMap(b => b.items),
        at(L('combustion-air', 'Hot secondary air', { back: true }), AIRX + 80, 90, { id: 'hsa' })
      ],
      pipes: [
        /* tank to the two pumps */
        { med: 'oil', w: W_O, pts: ['tk.b', [TX, 880], [250, 880]], flow: OIL },
        { med: 'oil', w: W_O, pts: [[250, 880], [250, PY], 'pa.s'], flow: 'm:DIESEL OIL PUMP A', arrow: false },
        {
          med: 'oil',
          w: W_O,
          pts: [[250, 880], [440, 880], [440, PY], 'pb.s'],
          flow: 'm:DIESEL OIL PUMP B',
          arrow: false
        },
        /* discharge, recirculation back to the tank, supply to the burners */
        { med: 'oil', w: W_O, pts: ['pa.d', [PAX - 2 * PS, DY], [420, DY]], flow: 'm:DIESEL OIL PUMP A', arrow: false },
        { med: 'oil', w: W_O, pts: ['pb.d', [PBX - 2 * PS, DY], [420, DY]], flow: 'm:DIESEL OIL PUMP B', arrow: false },
        { med: 'oil', w: W_S, pts: [[420, DY], 'rc.l'], flow: 'l:PICDO0005', arrow: false },
        { med: 'oil', w: W_S, pts: ['rc.r', [420, 330], [TX + 34 * TS, 330]], flow: 'l:PICDO0005' },
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
        { x: 250, y: 830, side: 'l', label: 'Strainer', key: 'DPT-DO0001', unit: K, dp: 2, tag: 'DPT-DO0001' },
        { x: 380, y: DY, side: 'b', label: 'Pump outlet', key: 'PT-DO0005', unit: K, tag: 'PT-DO0005' },
        { x: 560, y: 90, side: 'b', label: 'Return pressure', key: 'PT-DO1008', unit: K, tag: 'PT-DO1008' },
        ...B.flatMap(b => b.taps)
      ],
      texts: []
    }
  });
})();
