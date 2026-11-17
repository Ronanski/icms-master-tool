/* HX page in the new look: furnace purge and master fuel trip (user 2026-11-17: "Lahat ng luma na HMI, alisin dyan s app").
   This page has no process picture: it is three lists of the logic, as temporary page 10 "PURGE AND TRIP" shows them. Every
   Y / N is read from the drawing itself (the same data-dy rows of hmi-mock.js):
   - furnace purge permissive: DITL-01, all 15 must be Y;
   - purge sequence: DITL-02 (permissive, burner air dampers at purge position, FURNACE PURGE START, 5 minutes, completed) and
     the reset of the master fuel trip (DITL-03A output 16);
   - master fuel trip: the 18 trip inputs of DITL-03A and its first out.
   NO-SOURCE in the app (as on page 10): the purge time (the 300 s on-delay of DITL-02 has no readout).
   The furnace purge start push button is pressed on its drawing (DITL-02, M.0500), as on page 10. */
(function () {
  const { L, page } = HX;
  const B = HX.B;
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const W = 440,
    Y0 = 150,
    DY = 44,
    X1 = 240,
    X2 = 880,
    X3 = 1510;
  const PERM = [
    ['Induced draft fan running', 'DITL-01|i|0'],
    ['Secondary air fan running', 'DITL-01|i|1'],
    ['Any fluidizing air blower running', 'DITL-01|i|2'],
    ['Primary air fan running', 'DITL-01|i|3'],
    ['Total air flow above 25 % of full load', 'DITL-01|i|12|neg'],
    ['All burners no flame (A to D)', 'DITL-01|o|4'],
    ['All burner oil valves closed (A to D)', 'DITL-01|i|8+9+10+11'],
    ['All coal feeders stopped (A, B, C)', 'DITL-01|o|21'],
    ['All coal feeder outlet valves closed', 'DITL-01|i|16+17+18'],
    ['Limestone rotary valve stopped', 'DITL-01|i|13|neg'],
    ['Reheater gas damper at least 30 %', 'DITL-01|i|15'],
    ['Superheater gas damper at least 60 %', 'DITL-01|i|19'],
    ['No boiler trip command', 'DITL-01|i|14'],
    ['Cyclone outlet gas temperature not high-high', 'DITL-03A|i|23|neg'],
    ['Reheater outlet header temperature not high-high', 'DITL-03A|i|24|neg']
  ];
  const SEQ = [
    ['1 Permissive OK', 'DITL-02|i|14'],
    ['2 Burner air dampers A to D at purge position 25 %', 'DITL-02|i|1+2+3+4'],
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
  const dy = (k, g) => 'data-dy="' + k + '"' + (g ? ' data-g="' + g + '"' : '');

  page({
    id: 'purge-trip',
    group: 'Boiler',
    title: 'Purge and trip',
    about:
      'Furnace purge permissive (DITL-01), purge sequence (DITL-02) and master fuel trip (DITL-03A), read from the logic drawings. Y = true.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(B('Purge permissive', 'data-dys="PP|DITL-01|9|PURGE PERMISSIVE"', { w: W }), X1, 100, { id: 'pps' }),
        ...PERM.map((p, i) => at(B(p[0], dy(p[1], 'PP'), { w: W }), X1, Y0 + i * DY, { id: 'pp' + i })),
        ...SEQ.map((p, i) => at(B(p[0], dy(p[1]), { w: W }), X2, Y0 + i * DY, { id: 'sq' + i })),
        at(B('Furnace purge', 'data-do="DITL-02|15|OK|NOT OK"', { w: 210 }), X2 - 115, Y0 + 7 * DY, { id: 'fp' }),
        at(B('Purge ready', 'data-do="DITL-02|9|YES|NO"', { w: 210 }), X2 + 115, Y0 + 7 * DY, { id: 'pr' }),
        at(L('combustion-air', 'Fans and air flow', { back: true }), X2 - 115, Y0 + 9 * DY, { id: 'cal' }),
        at(L('furnace-gas', 'Furnace and induced draft fan', { back: true }), X2 + 115, Y0 + 9 * DY, { id: 'fgl' }),
        at(L('oil-burners', 'Burners', { back: true }), X2 - 115, Y0 + 10 * DY, { id: 'obl' }),
        at(L('turbine', 'Turbine trip', { back: true }), X2 + 115, Y0 + 10 * DY, { id: 'tbl' }),
        at(B('Master fuel trip', 'data-dfo="DITL-03A|16|1-18"', { w: W }), X3, 100, { id: 'mfs' }),
        ...MFT.map((t, i) => at(B(t, dy('DITL-03A|i|' + (i + 1)), { w: W }), X3, Y0 + i * DY, { id: 'mf' + i }))
      ],
      pipes: [],
      taps: [],
      texts: [
        { x: X1 - W / 2, y: 60, s: 'FURNACE PURGE PERMISSIVE · all must be Y', cls: 'hx-name' },
        { x: X2 - W / 2, y: 60, s: 'PURGE SEQUENCE', cls: 'hx-name' },
        { x: X3 - W / 2, y: 60, s: 'MASTER FUEL TRIP · any one trips', cls: 'hx-name' },
        {
          x: X2 - W / 2,
          y: Y0 + 12 * DY,
          s: 'Hot restart: bed above 700 °C counts the purge complete 7 s after the trip.',
          cls: 'hx-note'
        },
        { x: X2 - W / 2, y: Y0 + 12 * DY + 20, s: 'Reset: purge completed and no trip input left.', cls: 'hx-note' }
      ]
    }
  });
})();
