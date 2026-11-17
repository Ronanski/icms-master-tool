/* HX page in the REALISTIC look: generator (user 2026-11-17: "Lahat ng luma na HMI, alisin dyan s app"; "dapat may
   originality ha. Maintain ang quality at design na nasimulan"; "Wag mo bibilisan ... Ilink dpat ilink").
   THE PICTURE: the generator at the bottom of its line to the grid, drawn as the equipment stands: generator, generator
   breaker 52G1, disconnect switch with its earth switch, main transformer, line breaker 52L1, the grid on top. Beside the
   generator its excitation: exciter transformer, voltage regulator, field breaker, the field line to the rotor. A breaker
   or a switch is red when closed and green when open; the line carries its dashes while the turbine turns.
   WHAT IS LINKED (the same signals temporary page 17 "GENERATOR" reads; its sources: snapshot 37.PNG, snapshot P35SHAFT,
   the turbine control system input / output list, generator data sheet GAE-2013-0136 R2):
   - 52G1 / 52L1 = DITL-03E inputs 2 / 1; disconnect switch MIG-52G1-3, earth switch MIG-52G1-5, 52G1 remote MIL-52G1 =
     digital inputs of the input / output list; field breaker = the generator model;
   - generator breaker on / off = DITL-89 input 14 / DITL-03H input 17; ready to synchronize RY-52G / RY-52L, generator trip
     MIT-GEN;
   - power = GCP-AI1001 / 1002; kV, kA, Hz, MVar, power factor, field, energy, cooling air, stator coil = the generator
     model; bearings No. 3 / No. 4 = the turbine oil model.
   NO-SOURCE in the app (as on page 17): generator lockout 86G-A / 86G-B, water and oil leakage. The three phase voltages and
   currents of page 17 are one value each (the model has one). The page has no push button: the generator is synchronized
   by the turbine control system (Turbine start page).
   Shapes of the switchgear and the transformers are a picture only (no outline drawing in document-references); their
   order on the line is the single line of page 17. */
(function () {
  const { E, L, page } = HX;
  const B = HX.B;
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const ON = 'v:SI-TB>50';
  /* named states for the colour of the switchgear and the dashes of the line */
  const H = {
    l1: 'data-dy="DITL-03E|i|1|neg" data-on="CLOSED" data-off="OPEN"',
    g1: 'data-dy="DITL-03E|i|2|neg" data-on="CLOSED" data-off="OPEN"',
    ds: 'data-di="MIG-52G1-3|CLOSED|OPEN"',
    es: 'data-di="MIG-52G1-5|CLOSED|OPEN"',
    fb: 'data-uy="gen.fcb|1|CLOSED|OPEN"'
  };
  const R = {};
  for (const k in H) R[k] = HX.hk('gen-' + k, H[k]);
  /* places (the drawing is 1760 x 1000): the line stands at LX */
  const LX = 420,
    GY = 720,
    EXX = 700;
  const val = (i, label, key, unit, dp, key2, tag) => ({
    x: 980 + (i % 3) * 285,
    y: 128 + Math.floor(i / 3) * 78,
    side: 't',
    label,
    key,
    key2,
    unit,
    dp,
    tag: tag || ''
  });
  const ST = [
    ['Generator breaker 52G1 remote', 'data-di="MIL-52G1|Y|N"'],
    ['Generator breaker 52G1 on', 'data-dy="DITL-89|i|14"'],
    ['Generator breaker 52G1 off', 'data-dy="DITL-03H|i|17"'],
    ['Disconnect switch on', 'data-di="MIG-52G1-3|Y|N"'],
    ['Disconnect switch off', 'data-di="MIG-52G1-4|Y|N"'],
    ['Earth switch on', 'data-di="MIG-52G1-5|Y|N"'],
    ['Earth switch off', 'data-di="MIG-52G1-6|Y|N"'],
    ['Line breaker 52L1 open (house load)', 'data-dy="DITL-03E|i|1"'],
    ['52G1 ready to synchronize', 'data-di="RY-52G|Y|N"'],
    ['52L1 ready to synchronize', 'data-di="RY-52L|Y|N"'],
    ['Generator trip', 'data-di="MIT-GEN|Y|N"']
  ];
  const LIVE = ON + '|' + R.l1; /* the line above 52G1 is alive from the grid as well */

  page({
    id: 'generator',
    group: 'Turbine and generator',
    title: 'Generator',
    about:
      'The generator on its line to the grid, its excitation, its values and monitoring, the breaker status. Red = closed, green = open.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(E('breaker', 'Line breaker 52L1', '', [], { on: R.l1, wrap: 12 }), LX, 110, { id: 'l1', lab: 'l' }),
        at(E('transformer', 'Main transformer', '', [], { wrap: 12 }), LX, 250, { id: 'mt', sc: 1.25, lab: 'l' }),
        at(E('dswitch', 'Disconnect switch', '', [], { on: R.ds, wrap: 12 }), LX, 400, { id: 'ds', sc: 1.2, lab: 'l' }),
        at(E('dswitch', 'Earth switch', '', [], { on: R.es, earth: true, wrap: 12 }), LX + 150, 400, {
          id: 'es',
          sc: 1.2,
          lab: 'r'
        }),
        at(E('breaker', 'Generator breaker 52G1', '', [], { on: R.g1, wrap: 12 }), LX, 520, { id: 'g1', lab: 'l' }),
        at(E('generator', 'Generator', '', [], { on: ON }), LX, GY, { id: 'gen', sc: 2.2, lab: 'b' }),
        at(L('turbine', 'Turbine', { back: true }), 130, GY, { id: 'tbl' }),
        /* excitation */
        at(E('transformer', 'Exciter transformer', '', [], { wrap: 12 }), EXX, 600, { id: 'et', sc: 0.75, lab: 'r' }),
        at(E('cubicle', 'Voltage regulator', '', [], { wrap: 12 }), EXX, 710, { id: 'avr', lab: 'r' }),
        at(E('breaker', 'Field breaker', '', [], { on: R.fb, wrap: 12 }), EXX, 830, { id: 'fb', sc: 0.85, lab: 'r' }),
        /* the words of the three breakers beside them */
        at(B('52L1', H.l1 + ' data-t="1"', { w: 96 }), LX + 110, 110, { id: 'l1t' }),
        at(B('52G1', H.g1 + ' data-t="1"', { w: 96 }), LX + 110, 520, { id: 'g1t' }),
        at(B('52G1 control', 'data-di="MIL-52G1|REMOTE|LOCAL"', { w: 120 }), LX + 230, 520, { id: 'g1m' }),
        ...ST.map((s, i) =>
          at(B(s[0], s[1] + ' data-row="' + i + '"', { w: 270 }), 1000 + (i % 3) * 280, 690 + Math.floor(i / 3) * 46, {
            id: 's' + i
          })
        )
      ],
      pipes: [
        /* the line: grid, 52L1, main transformer, disconnect switch, 52G1, generator */
        { med: 'power', w: 4.5, pts: [[LX, 40], 'l1.t'], flow: LIVE, arrow: false },
        { med: 'power', w: 4.5, pts: ['l1.b', 'mt.t'], flow: LIVE, arrow: false },
        { med: 'power', w: 4.5, pts: ['mt.b', 'ds.t'], flow: LIVE, arrow: false },
        { med: 'power', w: 4.5, pts: ['ds.b', 'g1.t'], flow: LIVE, arrow: false },
        { med: 'power', w: 4.5, pts: ['g1.b', 'gen.t'], flow: ON, arrow: false },
        { med: 'power', w: 2.6, pts: [[LX, 338], [LX + 150, 338], 'es.t'], flow: R.es, arrow: false },
        /* excitation: from the generator terminals through the exciter transformer, the regulator and the field breaker to the rotor */
        {
          med: 'power',
          w: 2.6,
          pts: [[LX, 590], [LX + 150, 590], [LX + 150, 545], [EXX, 545], 'et.t'],
          flow: ON,
          arrow: false
        },
        { med: 'power', w: 2.6, pts: ['et.b', 'avr.t'], flow: ON, arrow: false },
        { med: 'power', w: 2.6, pts: ['avr.b', 'fb.t'], flow: ON, arrow: false },
        { med: 'power', w: 2.6, pts: ['fb.b', [EXX, 900], [620, 900], [620, GY], 'gen.r'], flow: R.fb },
        /* the shaft */
        { med: 'drain', w: 6, pts: ['tbl.r', 'gen.l'], flow: ON, arrow: false }
      ],
      taps: [
        {
          x: 620,
          y: 860,
          side: 'l',
          label: 'Field voltage / current',
          key: 'GEN.VF',
          key2: 'GEN.IF',
          unit: '',
          dp: 0,
          tag: 'V DC / A'
        },
        { x: LX, y: 605, side: 'l', label: 'Generator voltage', key: 'GEN.KV', unit: 'kV', dp: 1, tag: '' },
        val(0, 'Power (C)', 'GCP-AI1001', 'MW', 1, null, 'GCP-AI1001'),
        val(1, 'Power (D)', 'GCP-AI1002', 'MW', 1, null, 'GCP-AI1002'),
        val(2, 'Reactive power', 'GEN.MVAR', 'MVar', 1),
        val(3, 'Power factor', 'GEN.PF', '', 3),
        val(4, 'Current', 'GEN.KA', 'kA', 2),
        val(5, 'Frequency', 'GEN.HZ', 'Hz', 2),
        val(6, 'Energy', 'GEN.MWH', 'MWh', 0),
        val(7, 'Reactive energy', 'GEN.MVARH', 'MVarh', 0),
        val(8, 'Exciter outlet air', 'GEN.TEX', '°C', 0, null, 'TEGE1005'),
        val(9, 'Bearing 3 metal / outlet oil', 'TEGE1001', '°C', 0, 'TEGE1007', 'TEGE1001 / 1007'),
        val(10, 'Bearing 3 vibration X / Y', 'VEGE10011', 'mm', 3, 'VEGE10012', 'VEGE10011 / 12'),
        val(11, 'Air cooler outlet A / B', 'GEN.TA1', '°C', 0, 'GEN.TA2', 'TEGE10041 / 42'),
        val(12, 'Bearing 4 metal / outlet oil', 'TEGE1002', '°C', 0, 'TEGE1008', 'TEGE1002 / 1008'),
        val(13, 'Bearing 4 vibration X / Y', 'VEGE10021', 'mm', 3, 'VEGE10022', 'VEGE10021 / 22'),
        val(14, 'Air cooler outlet C / D', 'GEN.TA3', '°C', 0, 'GEN.TA4', 'TEGE10043 / 44'),
        val(15, 'Stator coil A / B', 'GEN.TS1', '°C', 0, 'GEN.TS2', 'TEGE10061 / 62'),
        val(16, 'Stator coil C / D', 'GEN.TS3', '°C', 0, 'GEN.TS4', 'TEGE10063 / 64'),
        val(17, 'Stator coil E / F', 'GEN.TS5', '°C', 0, 'GEN.TS6', 'TEGE10065 / 66')
      ],
      texts: [
        { x: LX + 14, y: 48, s: 'to the grid', cls: 'hx-note' },
        { x: 890, y: 60, s: 'GENERATOR VALUES AND MONITORING', cls: 'hx-name' },
        { x: 866, y: 645, s: 'BREAKER STATUS AND PROTECTION · Y = true', cls: 'hx-name' },
        {
          x: 866,
          y: 890,
          s: 'Generator air coolers: closed cooling water. Bearing vibration very high trips the turbine.',
          cls: 'hx-note'
        },
        { x: 866, y: 910, s: 'The generator is synchronized from the Turbine start page.', cls: 'hx-note' }
      ]
    }
  });
})();
