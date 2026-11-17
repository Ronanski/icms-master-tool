/* HX page in the REALISTIC look: bottom ash and the electrostatic precipitator (user 2026-11-17: "Lahat ng luma na HMI, alisin
   dyan s app"; "Maintain ang quality at design na nasimulan").
   THE PICTURE: above, the precipitator cut open in the flue gas duct with its hoppers and the fly ash silo. Below, the way of
   the bottom ash as it stands: the four screw ash coolers under the furnace grate floor drop their ash on the chain conveyor,
   the bucket elevator lifts it to the screw conveyor, the two way separator sends it to the bottom ash silo or over the
   vibrating screens back to the sand silo.
   THE CONNECTIONS:
     K1AU3-PD-071 Rev A sheet 1  bottom ash transfer and recycle system: bottom ash coolers A / B / C / D (PD-072) on the
                                 bottom ash chain conveyor L-1090, bucket elevator L-1091, screw conveyor L-1092, two way
                                 separator L-1094, vibrating screen S-1092, bottom ash silo T-1090 (LT-BH1750) with bag
                                 filter S-1091 and fan F-1091, loading spout L-1093 to the truck
   The coolers themselves (L-1060A ~ D, ash and cooling water temperatures, PT / TT-CW1156), the furnace differential pressure
   control DPIC-FG108 (ABC-009A) with the screw speed SIC-L1060A, and every RUNNING are as temporary page 14 binds them
   (DITL-21A instances, DITL-BA59 inputs 8 / 9 / 10 / 11 / 13 / 14). PD-072 and the fly ash sheets were NOT re-read.
   The precipitator has no signal in the app (no snapshot; it runs from its own panel, PR-OPE-5002 1.1): it is drawn with its
   field faceplate (machine "ESP" of page 14), without field voltages and currents. The fly ash silo T-1251 has no signal.
   Drawn simpler: the five fields of the precipitator are one casing with three hoppers; the ash transmitters under the
   hoppers, the buffer T-1091 and the ash transmitter S-1090 of the recycle line, the cooler inlet valves XV-BH1060A ~ D
   (no signal) are not drawn. */
(function () {
  const { V, E, M, C, L, page } = HX;
  const B = HX.B;
  const MM = 'mmH₂O';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const run = (name, k) => HX.hk(name, 'data-dy="' + k + '" data-on="RUNNING" data-off="STOPPED"');
  const W_S = 6,
    W_G = 14;
  /* places (the drawing is 1760 x 1000) */
  const EX = 520,
    EY = 190,
    ES = 2.3 /* precipitator */,
    CXS = [165, 400, 635, 870],
    CY = 600 /* the four coolers */,
    KY = 800 /* chain conveyor */,
    LX = 1090 /* bucket elevator */,
    TOPY = 470 /* screw conveyor on top */,
    SLX = 1560,
    SLY = 720; /* bottom ash silo */
  const N = ['A', 'B', 'C', 'D'];
  const INST = ['', ' #B', ' #C', ' #D'];
  const cooler = i => 'm:ASH COOLER ' + N[i];
  const ANY = [0, 1, 2, 3].map(cooler).join('|');
  const CHAIN = run('ba-chain', 'DITL-BA59|i|7'),
    ELEV = run('ba-elev', 'DITL-BA59|i|8'),
    SCREW = run('ba-screw', 'DITL-BA59|i|9'),
    SCRA = run('ba-scra', 'DITL-BA59|i|10'),
    SCRB = run('ba-scrb', 'DITL-BA59|i|12'),
    BFAN = run('ba-fan', 'DITL-BA59|i|13');

  page({
    id: 'ash',
    group: 'Boiler',
    title: 'Ash and precipitator',
    about:
      'Bottom ash from the four screw ash coolers to the bottom ash silo, and the electrostatic precipitator with the fly ash silo. Connections: flow diagram K1AU3-PD-071 Rev A; the states are read from the logic drawings.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        /* ---- precipitator and fly ash ---- */
        at(L('furnace-gas', 'Flue gas from the air heater', { back: true }), 130, EY, { id: 'gin' }),
        at(E('esp', '', '', [], { on: 'm:ESP' }), EX, EY, { id: 'esp', under: true, sc: ES }),
        at(M('cubicle', 'ESP', 'Precipitator panel', []), 150, 320, { id: 'espp', lab: 'r' }),
        at(L('furnace-gas', 'To the induced draft fan'), 900, EY, { id: 'gout' }),
        at(E('silo', 'Fly ash silo', 'T-1251', [], { id: 'fa', h: 100 }), 1160, 250, { id: 'fa', sc: 1.7, lab: 'r' }),

        /* ---- furnace differential pressure and screw speed ---- */
        at(
          C('DPICFG108', 'Furnace differential pressure, mmH₂O', { sym: 'ctl', unit: '', pvdp: 0, wrap: 22 }),
          1480,
          130,
          {
            id: 'dpc',
            lab: 't'
          }
        ),
        at(C('SICL1060A', 'Screw speed A to D', { sym: 'ctl', unit: 'rpm', pvdp: 1, wrap: 30 }), 1660, 130, {
          id: 'sic',
          lab: 't'
        }),

        /* ---- the four screw ash coolers ---- */
        ...CXS.map((x, i) =>
          at(
            M(
              'screw',
              'ASH COOLER ' + N[i],
              'Ash cooler ' + N[i],
              [
                V('Ash in', 'TT-BH1060-' + N[i] + '1', '°C', 0),
                V('Ash out', 'TT-BH1060-' + N[i] + '2', '°C', 0),
                V('Water in', 'TT-CW1060-' + N[i] + '1', '°C', 0),
                V('Water out', 'TT-CW1060-' + N[i] + '2', '°C', 0)
              ],
              { w: 120, tag: 'L-1060' + N[i] }
            ),
            x,
            CY,
            { id: 'c' + i, sc: 1.3, lab: 'b' }
          )
        ),
        ...CXS.map((x, i) =>
          at(
            B('Forward', 'data-dy="DITL-21A' + INST[i] + '|i|0" data-on="RUNNING" data-off="STOPPED"', { w: 110 }),
            x + 20,
            CY - 58,
            {
              id: 'cf' + i
            }
          )
        ),

        /* ---- chain conveyor, bucket elevator, screw conveyor, screens, silo ---- */
        at(E('conveyor', 'Chain conveyor', 'L-1090', [], { w: 620, on: CHAIN }), 540, KY, {
          id: 'kc',
          sc: 1.4,
          lab: 'b'
        }),
        at(E('elevator', 'Bucket elevator', 'L-1091', [], { h: 250, on: ELEV, wrap: 10 }), LX, 650, {
          id: 'el',
          sc: 1.4,
          lab: 'l'
        }),
        at(E('screw', 'Screw conveyor', 'L-1092', [], { w: 130, on: SCREW }), 1260, TOPY, {
          id: 'sc',
          sc: 1.3,
          lab: 't'
        }),
        at(E('screen', 'Vibrating screen A', 'S-1092A', [], { on: SCRA, wrap: 12 }), 1290, 640, {
          id: 'vsa',
          sc: 1.4,
          lab: 'l'
        }),
        at(E('screen', 'Vibrating screen B', 'S-1092B', [], { on: SCRB, wrap: 12 }), 1290, 760, {
          id: 'vsb',
          sc: 1.4,
          lab: 'l'
        }),
        at(L('limestone-sand', 'Coarse ash to the sand silo'), 1300, 880, { id: 'rcl' }),
        at(
          E('silo', 'Bottom ash silo', 'T-1090', [V('Level', 'LT-BH1750', 'm', 1)], {
            id: 'ba',
            h: 110,
            level: ['LT-BH1750', 0, 12]
          }),
          SLX,
          SLY,
          { id: 'ba', sc: 1.9, lab: 'r' }
        ),
        at(E('fan', 'Bag filter fan', 'F-1091', [], { on: BFAN }), 1680, 560, { id: 'bf', sc: 0.8, lab: 't' })
      ],
      pipes: [
        /* flue gas through the precipitator */
        { med: 'gas', w: W_G, pts: ['gin.r', 'esp.l'], flow: 'm:IDF' },
        { med: 'gas', w: W_G, pts: ['esp.r', 'gout.l'], flow: 'm:IDF' },
        /* fly ash from the hoppers to the silo */
        { med: 'solid', w: 4, pts: ['esp.h1', [EX - 48 * ES, 382], [1000, 382]], flow: 'm:ESP', arrow: false },
        { med: 'solid', w: 4, pts: ['esp.h2', [EX, 382]], flow: 'm:ESP', arrow: false },
        { med: 'solid', w: 4, pts: ['esp.h3', [EX + 48 * ES, 382]], flow: 'm:ESP', arrow: false },
        { med: 'solid', w: 4, pts: [[1000, 382], [1000, 130], [1160, 130], 'fa.t'], flow: 'm:ESP' },
        { med: 'solid', w: 4, pts: ['fa.b', [1160, 372]], to: 'to truck' },
        /* bottom ash: furnace, coolers, chain conveyor */
        ...CXS.flatMap((x, i) => [
          { med: 'solid', w: W_S, pts: [[x - 48 * 1.3, 470], 'c' + i + '.in'], flow: cooler(i) },
          { med: 'solid', w: W_S, pts: ['c' + i + '.out', [x + 48 * 1.3, KY - 12]], flow: cooler(i) }
        ]),
        /* conveyor to the elevator, up, across, down to the silo or over the screens */
        {
          med: 'solid',
          w: W_S,
          pts: ['kc.r', [1030, KY + 4], [1030, 650 + 115 * 1.4], 'el.in'],
          flow: CHAIN,
          arrow: false
        },
        {
          med: 'solid',
          w: W_S,
          pts: ['el.out', [1150, 650 - 113 * 1.4], [1150, TOPY - 18.2], 'sc.in'],
          flow: ELEV,
          arrow: false
        },
        { med: 'solid', w: W_S, pts: ['sc.out', [1329, 540]], flow: SCREW, arrow: false },
        { med: 'solid', w: W_S, pts: [[1329, 540], [SLX, 540], 'ba.t'], flow: SCREW },
        { med: 'solid', w: W_S, pts: [[1329, 540], [1259, 540], 'vsa.in'], flow: SCRA },
        {
          med: 'solid',
          w: W_S,
          pts: [[1259, 540], [1200, 540], [1200, 720], [1259, 720], 'vsb.in'],
          flow: SCRB,
          arrow: false
        },
        { med: 'solid', w: 4, pts: ['vsa.over', [1400, 651], [1400, 880], 'rcl.r'], flow: SCRA + '|' + SCRB },
        { med: 'solid', w: 4, pts: ['vsb.over', [1400, 771]], flow: SCRB, arrow: false },
        { med: 'air', w: 4, pts: [[SLX + 30, 630], [1643, 630], [1643, 560], 'bf.in'], flow: BFAN, arrow: false },
        { med: 'solid', w: W_S, pts: ['ba.b', [SLX, 880]], to: 'to truck' }
      ],
      taps: [],
      texts: [
        { x: 24, y: 60, s: 'PRECIPITATOR AND FLY ASH', cls: 'hx-zone' },
        { x: EX, y: 86, s: 'Precipitator', cls: 'hx-name', anchor: 'middle' },
        { x: 24, y: 80, s: 'The precipitator runs from its own panel.', cls: 'hx-note' },
        { x: 24, y: 94, s: 'Field voltages and currents have no signal in the app.', cls: 'hx-note' },
        { x: 24, y: 440, s: 'BOTTOM ASH', cls: 'hx-zone' },
        { x: 24, y: 462, s: 'from the furnace grate floor', cls: 'hx-note' },
        { x: 300, y: 440, s: 'Bed pressure drop 1', key: 'DPT-FG1081', unit: MM, dp: 0 },
        { x: 520, y: 440, s: 'Bed pressure drop 2', key: 'DPT-FG1082', unit: MM, dp: 0 },
        { x: 760, y: 440, s: 'Cooling water', key: 'PT-CW1156', unit: 'kg/cm²' },
        { x: 930, y: 440, s: 'Temperature', key: 'TT-CW1156', unit: '°C', dp: 0 },
        { x: 1420, y: 250, s: 'Furnace differential pressure low stops the coolers.', cls: 'hx-note' },
        { x: 1420, y: 266, s: 'Cycle mode timer 15 minutes (DITL-21E).', cls: 'hx-note' }
      ]
    }
  });
})();
