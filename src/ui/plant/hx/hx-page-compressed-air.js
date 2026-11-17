/* HX page in the REALISTIC look: instrument air and plant air (user 2026-11-17: "Lahat ng luma na HMI, alisin dyan s app";
   "Kumpletuhin muna lahat ng HMI pages").
   THE PICTURE: two trains one above the other, instrument air on top and plant air below: three compressors, three air
   dryers with their filters, the two air tanks and the line to Unit 1.
   THE CONNECTIONS, as temporary page 03 "INSTRUMENT AND PLANT AIR" binds them (its source: K1AU3-PD-023 Rev C sheet 2 of 6
   instrument air, sheet 1 of 6 plant air; the sheets were NOT re-read for this page):
   - instrument air compressors C-0704A / B / C (current IT-C0704A / B / C, started at the local panel, DITL-113), air dryers
     D-0704A / B / C with two pre-filters and two after-filters each (flow FI-D0704A / B / C, outlet PT-IA0107 / 0127 / 0147,
     DITL-45), air tanks T-0706A / B (PT-IA0706-A / -B, 5 m3), to Unit 1 instrument air (PT-IA1706), Unit 2, the utility
     area and the compressor control air;
   - plant air compressors C-0703A / B / C (IT-C0703A / B / C, DITL-114), air dryers D-0703A / B / C (FI-D0703A / B / C,
     PT-PA0107 / 0127 / 0147), air tanks T-0705A / B (PT-PA0705-A / -B, 10 m3), to Unit 1 plant air (PT-PA1705), Unit 2 and
     the utility area.
   The standby compressors start by themselves when two of tank A, tank B and Unit 1 pressure are below 5 kg/cm2 for 3 s.
   Drawn simpler: the filters are not drawn; the start-up compressor C-0707 and the compressor control air strip are not
   drawn. Of the hand valves V-IA / V-PA of temporary page 03 only V-PA0013 is a valve of the plant model: it is the
   HX.H piece between the two trains; the others have no state and no faceplate on page 03 either. */
(function () {
  const { V, E, M, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const N = ['A', 'B', 'C'];
  const W = 5;
  const train = (p, y0, o) => {
    const rows = [y0 + 80, y0 + 205, y0 + 330],
      cmp = n => o.cname + ' ' + n,
      dry = n => o.dname + ' ' + n,
      ANY = N.map(n => 'm:' + cmp(n)).join('|'),
      items = [],
      pipes = [],
      taps = [];
    N.forEach((n, i) => {
      const y = rows[i];
      items.push(
        at(M('compressor', cmp(n), 'Compressor ' + n, [V('Current', o.cur + n, 'A', 1)], { tag: o.ctag + n }), 240, y, {
          id: p + 'c' + i,
          sc: 1.5,
          lab: 'l'
        }),
        at(M('dryer', dry(n), 'Air dryer ' + n, [V('Flow', o.flow + n, '', 1)], { tag: o.dtag + n }), 700, y - 20, {
          id: p + 'd' + i,
          sc: 1.5,
          lab: 'r'
        })
      );
      pipes.push(
        { med: 'air', w: W, pts: [p + 'c' + i + '.out', [480, y - 9]], flow: 'm:' + cmp(n), arrow: false },
        { med: 'air', w: W, pts: [[480, y + 7], p + 'd' + i + '.l'], flow: 'm:' + dry(n), arrow: false },
        { med: 'air', w: W, pts: [p + 'd' + i + '.r', [1000, y + 7]], flow: 'm:' + dry(n), arrow: false }
      );
      taps.push({
        x: 930,
        y: y + 7,
        side: 't',
        label: 'Dryer ' + n + ' outlet',
        key: o.pd[i],
        unit: K,
        dp: 1,
        tag: o.pdt[i]
      });
    });
    /* header between the compressors and the dryers, header after the dryers, the two tanks, the line to the unit */
    pipes.push(
      {
        med: 'air',
        w: W,
        pts: [
          [480, rows[0] - 9],
          [480, rows[2] + 7]
        ],
        flow: ANY,
        arrow: false
      },
      {
        med: 'air',
        w: W,
        pts: [
          [1000, rows[0] + 7],
          [1000, rows[2] + 7]
        ],
        flow: ANY,
        arrow: false
      },
      { med: 'air', w: W, pts: [[1000, rows[0] + 40], [1180, rows[0] + 40], p + 'ta.l'], flow: ANY, arrow: false },
      { med: 'air', w: W, pts: [[1000, rows[2] - 30], [1180, rows[2] - 30], p + 'tb.l'], flow: ANY, arrow: false },
      { med: 'air', w: W, pts: [p + 'ta.r', [1360, rows[0] + 40], [1360, rows[1]]], flow: ANY, arrow: false },
      { med: 'air', w: W, pts: [p + 'tb.r', [1360, rows[2] - 30], [1360, rows[1]]], flow: ANY, arrow: false },
      {
        med: 'air',
        w: W,
        pts: [
          [1360, rows[1]],
          [1640, rows[1]]
        ],
        to: o.to,
        flow: ANY
      }
    );
    items.push(
      at(E('vvessel', 'Air tank A', o.tank + 'A', [V('Pressure', o.pa, K, 1)]), 1230, rows[0] + 25, {
        id: p + 'ta',
        sc: 1.3,
        lab: 't'
      }),
      at(E('vvessel', 'Air tank B', o.tank + 'B', [V('Pressure', o.pb, K, 1)]), 1230, rows[2] - 45, {
        id: p + 'tb',
        sc: 1.3,
        lab: 'b'
      })
    );
    taps.push({ x: 1500, y: rows[1], side: 't', label: 'To Unit 1', key: o.pu, unit: K, dp: 1, tag: o.put });
    return { items, pipes, taps };
  };
  const IA = train('i', 40, {
      cname: 'Instrument air compressor',
      dname: 'Instrument air dryer',
      ctag: 'C-0704',
      dtag: 'D-0704',
      cur: 'IIC0704',
      flow: 'FID0704',
      pd: ['PIIA0107', 'PIIA0127', 'PIIA0147'],
      pdt: ['PT-IA0107', 'PT-IA0127', 'PT-IA0147'],
      tank: 'T-0706',
      pa: 'PIIA0706A',
      pb: 'PIIA0706B',
      pu: 'PIIA1706',
      put: 'PT-IA1706',
      to: 'Unit 1 instrument air'
    }),
    PA = train('p', 510, {
      cname: 'Plant air compressor',
      dname: 'Plant air dryer',
      ctag: 'C-0703',
      dtag: 'D-0703',
      cur: 'IIC0703',
      flow: 'FID0703',
      pd: ['PIPA0107', 'PIPA0127', 'PIPA0147'],
      pdt: ['PT-PA0107', 'PT-PA0127', 'PT-PA0147'],
      tank: 'T-0705',
      pa: 'PIPA0705A',
      pb: 'PIPA0705B',
      pu: 'PIPA1705',
      put: 'PT-PA1705',
      to: 'Unit 1 plant air'
    });

  page({
    id: 'compressed-air',
    group: 'Cooling and utilities',
    title: 'Instrument and plant air',
    about:
      'Instrument air and plant air: compressors, air dryers, air tanks and the lines to Unit 1. Tags and order as temporary page 03 binds them (flow diagram K1AU3-PD-023 Rev C).',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        ...IA.items,
        ...PA.items,
        at(L('makeup-cooling', 'Cooling water of compressors and dryers', { back: true }), 1560, 490, { id: 'cwl' }),
        /* the one hand valve of temporary page 03 that the plant model has: the tie from plant air to the instrument air tanks */
        at(HX.H('V-PA0013', 'Tie from plant air V-PA0013', { w: 210 }), 1230, 490, { id: 'tie' })
      ],
      pipes: [...IA.pipes, ...PA.pipes],
      taps: [...IA.taps, ...PA.taps],
      texts: [
        { x: 20, y: 40, s: 'INSTRUMENT AIR', cls: 'hx-name' },
        { x: 20, y: 510, s: 'PLANT AIR', cls: 'hx-name' },
        { x: 1380, y: 300, s: 'also to Unit 2, the utility area and the compressor control air', cls: 'hx-note' },
        { x: 1380, y: 770, s: 'also to Unit 2 and the utility area', cls: 'hx-note' },
        {
          x: 20,
          y: 985,
          s: 'Compressors are started at their local panel. A standby compressor starts by itself when two of tank A, tank B and Unit 1 pressure are below 5 kg/cm² for 3 s.',
          cls: 'hx-note'
        }
      ]
    }
  });
})();
