/* HX page in the REALISTIC look: coal, limestone and sand into the furnace (user 2026-11-17: "Ganyan ang HMI na gsto ko.
   Dapat iyan lang makita ko n mga itsura").
   THE PICTURE: the three coal bunkers with their gravimetric feeders in front of the furnace, each feeder dropping its coal
   through its discharge valve into the fuel ports of the front wall; the furnace cut open on the right; behind it the
   limestone silo and the sand silo with their lines into the furnace.
   THE CONNECTIONS, as the temporary page 12 binds them (its sources: K1AU3-PD-061 coal firing, PD-062 limestone feed, PD-063
   sand feed, Rev A; snapshot 11.png): coal bunkers T-1008A / B / C (LT-CL1008-A / -B / -C), coal feeders L-1061A / B / C with
   their feed rate controllers FIC-CL1061A / B / C and totalizers, the outlet discharge valves XV-CL1061-A / -B / -C, six fuel
   ports on the furnace front wall, hot primary air to the fuel ports, cold primary air as seal air of the feeders (not drawn); coal
   master FIC-CM and the total coal flow correction HS-COAL (ABC-004A); limestone silo T-1311 (LT-LM1800) with lock vessel
   (PT-LM1811) and dispensing vessel (PT-LM1812), eight injection points; sand silo T-1300 (LT-SD1800) with the dense phase
   vessel S-1300 (PT-SD1800), two injection points on the rear side.
   The flow diagrams PD-061 / 062 / 063 were NOT re-read for this page: the tags, names and order are those of temporary
   page 12. Check the page against the three sheets before the temporary page is removed.
   Drawn simpler: the two fuel ports of a feeder are one line; the limestone and sand trains (lock vessel, dispensing vessel,
   rotary feeder, valve sets) are one silo each, with their pressures as values; their single valves are in the faceplate of
   "Limestone system" / "Sand system" and stay on temporary page 12 until the Limestone and sand page is drawn. */
(function () {
  const { V, E, M, C, X, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const W_C = 8,
    W_A = 8,
    W_S = 5;
  /* places (the drawing is 1760 x 1000) */
  const BX = [230, 540, 850],
    BY = 290,
    BS = 2 /* bunkers */,
    FDY = 500,
    FDS = 2 /* feeders */,
    VY = 640 /* discharge valves */,
    CY = 780 /* coal into the fuel ports */,
    FX = 1340,
    FY = 190,
    FS = 1.75; /* furnace: roof centre */
  const N = ['A', 'B', 'C'];
  const run = i => 'm:COAL FEEDER ' + N[i];
  const train = i => {
    const bx = BX[i],
      n = N[i],
      fx = bx + 26 * FDS,
      ox = fx + 28 * FDS;
    return {
      items: [
        at(E('bunker', 'Coal bunker ' + n, 'T-1008' + n, [V('Level', 'LT-CL1008-' + n, 'm', 1)]), bx, BY, {
          id: 'b' + i,
          sc: BS,
          lab: 'l'
        }),
        at(
          M('feeder', 'COAL FEEDER ' + n, 'Coal feeder ' + n, [V('Total', 'MIA-CL1061-' + n + '1', 't', 0)]),
          fx,
          FDY,
          { id: 'f' + i, sc: FDS, lab: 'l' }
        ),
        at(
          C('FICCL1061' + n, 'Feed rate ' + n, {
            sym: 'ctl',
            unit: 't/h',
            pvdp: 1,
            cname: 'Coal feeder ' + n + ' feed rate'
          }),
          bx + 150,
          400,
          {
            id: 'c' + i,
            lab: 't'
          }
        ),
        at(
          X('XV-CL1061-' + n, 'Discharge valve ' + n, { cname: 'Coal feeder ' + n + ' discharge valve', wrap: 12 }),
          ox,
          VY,
          {
            id: 'v' + i,
            rot: 90,
            lab: 'r'
          }
        )
      ],
      pipes: [
        { med: 'coal', w: W_C, pts: ['b' + i + '.b', 'f' + i + '.in'], flow: run(i), arrow: false },
        { med: 'coal', w: W_C, pts: ['f' + i + '.out', 'v' + i + '.l'], flow: run(i), arrow: false },
        { med: 'coal', w: W_C, pts: ['v' + i + '.r', [ox, CY]], flow: 'x:XV-CL1061-' + n }
      ]
    };
  };
  const T = [0, 1, 2].map(train);
  const ANY = [0, 1, 2].map(run).join('|');

  page({
    id: 'coal',
    group: 'Boiler',
    title: 'Coal, limestone and sand',
    about:
      'Coal bunkers and feeders in front of the furnace, limestone and sand behind it. Tags and order as temporary page 12 binds them (flow diagrams K1AU3-PD-061, PD-062, PD-063 Rev A).',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(E('furnace', '', '', [], { fire: ANY }), FX, FY, { id: 'fu', under: true, sc: FS }),
        ...T.flatMap(t => t.items),
        at(L('combustion-air', 'Hot primary air', { back: true }), 110, CY, { id: 'hpa' }),
        at(C('FIC-CM', 'Coal master', { sym: 'ctl', unit: 't/h', pvdp: 1 }), 330, 90, { id: 'cm', lab: 't' }),
        at(C('HS-COAL', 'Total coal flow correction', { sym: 'ctl', unit: 't/h', pvdp: 1, wrap: 30 }), 640, 90, {
          id: 'hs',
          lab: 't'
        }),
        at(
          M('silo', 'Limestone system', 'Limestone silo', [
            V('Level', 'LT-LM1800', '%', 1),
            V('Lock vessel', 'PT-LM1811', K, 2),
            V('Dispensing vessel', 'PT-LM1812', K, 2)
          ]),
          1600,
          300,
          { id: 'lm', sc: 2, lab: 'b' }
        ),
        at(
          M('silo', 'Sand system', 'Sand silo', [
            V('Level', 'LT-SD1800', '%', 1),
            V('Dense phase vessel', 'PT-SD1800', K, 2)
          ]),
          1600,
          700,
          { id: 'sd', sc: 2, lab: 'b' }
        )
      ],
      pipes: [
        ...T.flatMap(t => t.pipes),
        /* hot primary air carries the coal of the three feeders into the fuel ports of the front wall */
        { med: 'hotair', w: W_A, pts: ['hpa.r', [BX[0] + 108, CY]], flow: 'm:PAF', arrow: false },
        {
          med: 'coal',
          w: W_C,
          pts: [
            [BX[0] + 108, CY],
            [BX[2] + 108, CY]
          ],
          flow: ANY,
          arrow: false
        },
        { med: 'coal', w: W_C, pts: [[BX[2] + 108, CY], [1180, CY], [1180, FY + 276 * FS], 'fu.coal'], flow: ANY },
        /* limestone and sand into the furnace */
        { med: 'solid', w: W_S, pts: ['lm.l', [1500, 300], [1500, FY + 214 * FS], 'fu.sa2'], flow: 'v:PT-LM1812>0.3' },
        { med: 'solid', w: W_S, pts: ['sd.l', [1520, 700], [1520, FY + 290 * FS], 'fu.ret'], flow: 'v:PT-SD1800>0.3' }
      ],
      texts: [
        { x: FX + 6, y: FY + 200 * FS, s: 'Furnace', cls: 'hx-name', anchor: 'middle' },
        { x: 1130, y: CY + 30, s: 'six fuel ports, front wall', cls: 'hx-note', anchor: 'middle' },
        { x: 1512, y: 440, s: 'eight injection points', cls: 'hx-note' },
        { x: 1532, y: 660, s: 'rear side', cls: 'hx-note' }
      ]
    }
  });
})();
