/* HX page in the REALISTIC look: extraction steam (user 2026-11-17: "Ganyan ang HMI na gsto ko. Dapat iyan lang makita ko n
   mga itsura").
   THE PICTURE: the turbine cut open on the left, on its condenser; the extraction lines leave the casing and run to the
   heaters on the right, one line per heater, each with its shut-off valve and its drain valves.
   THE CONNECTIONS, read from K1AU3-PD-013 Rev D (extraction steam system):
   - No. 1 extraction: from the cold reheat line (PD-011), TT-TS1011, shut-off valve MV-TS1001, into the No. 2 high pressure
     heater H-1106; drain valves MV-TS1397 and MV-TS1391 to the flash chamber;
   - extraction II: PT-TS1013, TT-TS1014, MV-TS1002, into the No. 1 high pressure heater H-1105; drains MV-TS1396, MV-TS1392;
   - extraction III: PT-TS1017, TT-TS1018, MV-TS1003, into the deaerator H-1104 (joined there by the auxiliary steam of
     PD-014); drains MV-TS1393, MV-TS1398, MV-TS1399;
   - extraction IV: PT-TS1022, TT-TS1023, MV-TS1004, into the No. 3 low pressure heater H-1103; drains MV-TS1394, MV-TS1390;
   - extraction V: PT-TS1026, TT-TS1027, MV-TS1005, into the No. 2 low pressure heater H-1102; drains MV-TS1395, MV-TS1389;
   - extraction VI: straight into the No. 1 low pressure heater H-1101 in the condenser neck, no valve.
   Shut-off valves = DITL-94 ~ 98, drain valves = DITL-99 ~ 110, flash pipe drain valve XV-FS1005 = DITL-57 (temporary
   page 18). MV-TS1400 (DITL-110) is a drain valve of extraction III that is NOT on PD-013: drawn with the other three.
   Pressure of the No. 1 extraction = PICR19011 (high pressure turbine exhaust steam pressure A, DCS loop list), condenser pressure = PT-CD1110.
   Drawn simpler: the air assisted check valves XV-TS1700 ~ 1740 are not drawn (NO-SOURCE: not in the DCS input / output
   list); traps, hand valves, local gauges and the heater relief valves are not drawn; the two pipes of extraction V and of
   extraction VI are one line each. */
(function () {
  const { V, E, X, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const W_S = 6,
    W_D = 3;
  /* places (the drawing is 1760 x 1000) */
  const TX = 370,
    TY = 330,
    TS = 1.15 /* turbine: shaft centre */,
    VX = 850 /* shut-off valves */,
    DX = [960, 1110, 1260, 1410] /* drain valves */,
    HX1 = 1630,
    HS = 1.5,
    STX = HX1 - 26; /* steam nozzle of a heater */
  const tp = (x, y) => [Math.round(TX + x * TS), Math.round(TY + y * TS)];
  /* n, row, heater name, heater tag, pressure key, temperature key, drain valves, where the line leaves, way to the row */
  const EXT = [
    {
      n: 5,
      y: 150,
      name: 'Low pressure heater 2',
      tag: 'H-1102',
      p: 'PT-TS1026',
      t: 'TT-TS1027',
      d: ['MV-TS1395', 'MV-TS1389'],
      way: [tp(-140, -64), [tp(-140, 0)[0], 150]]
    },
    {
      n: 4,
      y: 320,
      name: 'Low pressure heater 3',
      tag: 'H-1103',
      p: 'PT-TS1022',
      t: 'TT-TS1023',
      d: ['MV-TS1394', 'MV-TS1390'],
      way: [tp(-110, -44), [tp(-110, 0)[0], 185], [700, 185], [700, 320]]
    },
    {
      n: 3,
      y: 490,
      name: 'Deaerator',
      tag: 'H-1104',
      p: 'PT-TS1017',
      t: 'TT-TS1018',
      d: ['MV-TS1393', 'MV-TS1398', 'MV-TS1399', 'MV-TS1400'],
      way: [tp(-85, -39), [tp(-85, 0)[0], 215], [670, 215], [670, 490]]
    },
    {
      n: 2,
      y: 660,
      name: 'High pressure heater 1',
      tag: 'H-1105',
      p: 'PT-TS1013',
      t: 'TT-TS1014',
      d: ['MV-TS1396', 'MV-TS1392'],
      way: [tp(-60, -34), [tp(-60, 0)[0], 245], [640, 245], [640, 660]]
    },
    {
      n: 1,
      y: 840,
      name: 'High pressure heater 2',
      tag: 'H-1106',
      p: 'PICR19011',
      t: 'TT-TS1011',
      d: ['MV-TS1397', 'MV-TS1391'],
      way: ['tg.hpEx', [tp(110, 0)[0], 840]]
    }
  ];
  const line = e => {
    const n = e.n,
      y = e.y,
      fl = 'x:MV-TS100' + n,
      dea = n === 3;
    return {
      items: [
        at(X('MV-TS100' + n, 'Extraction ' + n + ' shut-off valve', { wrap: 14 }), VX, y, { id: 's' + n, lab: 't' }),
        ...e.d.map((d, i) =>
          at(X(d, 'Drain valve', { cname: 'Extraction ' + n + ' drain valve' }), DX[i], y + 58, {
            id: 'd' + n + i,
            rot: 90,
            lab: 'r'
          })
        ),
        dea
          ? at(E('deaerator', e.name, e.tag, [], { id: 'dea' }), HX1, y + 88, { id: 'h' + n, sc: 1.2, lab: 'b' })
          : at(E('heater', e.name, e.tag, [], { id: 'e' + n, flow: fl }), HX1, y + 76, {
              id: 'h' + n,
              sc: HS,
              lab: 'b'
            })
      ],
      pipes: [
        { med: 'steam', w: W_S, pts: [...e.way, 's' + n + '.l'], flow: fl, arrow: false },
        dea
          ? { med: 'steam', w: W_S, pts: ['s' + n + '.r', [HX1 + 37, y], 'h' + n + '.stin'], flow: fl }
          : { med: 'steam', w: W_S, pts: ['s' + n + '.r', [STX, y], 'h' + n + '.st'], flow: fl },
        ...e.d.flatMap((d, i) => [
          { med: 'drain', w: W_D, pts: [[DX[i], y], 'd' + n + i + '.l'], flow: 'x:' + d, arrow: false },
          { med: 'drain', w: W_D, pts: ['d' + n + i + '.r', [DX[i], y + 108]], flow: 'x:' + d }
        ])
      ],
      taps: [
        {
          x: 740,
          y,
          side: 't',
          label: n === 1 ? 'Turbine exhaust pressure' : 'Pressure',
          key: e.p,
          unit: K,
          dp: 2,
          tag: e.p
        },
        { x: 740, y, side: 'b', label: 'Temperature', key: e.t, unit: '°C', dp: 0, tag: e.t }
      ]
    };
  };
  const LN = EXT.map(line);

  page({
    id: 'extraction',
    group: 'Water and steam',
    title: 'Extraction steam',
    about:
      'Six extractions from the turbine heat the condensate and the feedwater. Five have a shut-off valve and drain valves to the flash chamber (flow diagram K1AU3-PD-013 Rev D).',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(E('tgset', '', '', [], { on: 'v:SI-TB>50' }), TX, TY, { id: 'tg', under: true, sc: TS }),
        ...LN.flatMap(l => l.items),
        at(
          E('heater', 'Low pressure heater 1', 'H-1101', [V('Condenser pressure', 'PT-CD1110', K + ' abs', 3)], {
            id: 'e6',
            flow: 'v:SI-TB>50'
          }),
          170,
          860,
          { id: 'h6', sc: 1.3, lab: 'b' }
        ),
        at(X('XV-FS1005', 'Flash pipe drain valve', { wrap: 12 }), 470, 940, { id: 'fs', lab: 't' }),
        at(L('reheat-steam', 'Cold reheat steam', { back: true }), 590, 700, { id: 'crl' }),
        at(L('feedwater', 'Feedwater heaters'), 1660, 60, { id: 'fwl' }),
        at(L('condensate', 'Condensate heaters'), 1480, 60, { id: 'cdl' })
      ],
      pipes: [
        ...LN.flatMap(l => l.pipes),
        /* extraction VI straight into the heater in the condenser neck */
        {
          med: 'steam',
          w: W_S,
          pts: [tp(-172, -64), [tp(-172, 0)[0], 110], [30, 110], [30, 790], [147, 790], 'h6.st'],
          flow: 'v:SI-TB>50'
        },
        { med: 'drain', w: W_D, pts: [[380, 940], 'fs.l'], flow: 'x:XV-FS1005', arrow: false },
        { med: 'drain', w: W_D, pts: ['fs.r', [570, 940]], to: 'condenser', flow: 'x:XV-FS1005' }
      ],
      taps: LN.flatMap(l => l.taps),
      texts: [
        { x: 960, y: 975, s: 'All drain valves open to the flash chamber.', cls: 'hx-note' },
        { x: 40, y: 100, s: 'extraction 6, no valve', cls: 'hx-note' },
        { x: 372, y: 944, s: 'flash pipe', cls: 'hx-note', anchor: 'end' },
        { x: 170, y: 780, s: 'in the condenser neck', cls: 'hx-note', anchor: 'middle' }
      ]
    }
  });
})();
