/* HX page in the REALISTIC look: generator (user 2026-11-17: "Lahat ng luma na HMI, alisin dyan s app"; "Kumpletuhin muna
   lahat ng HMI pages").
   THE PICTURE: the generator on the left with its single line to the grid above it (generator breaker, disconnect switch,
   earth switch, main transformer, line breaker) and its excitation below; on the right the generator values and its
   monitoring; below the breaker status and protection list.
   EVERYTHING on this page is what temporary page 17 "GENERATOR" shows (its sources: snapshot 37.PNG, snapshot P35SHAFT, the
   turbine control system input / output list, generator data sheet GAE-2013-0136 R2):
   - 52G1 / 52L1 = DITL-03E inputs 2 / 1; generator breaker on / off = DITL-89 input 14 / DITL-03H input 17; earth switch,
     disconnect switch, remote, ready to synchronize, generator trip = digital inputs of the input / output list (MIG-52G1-3
     ~ 6, MIL-52G1, RY-52G, RY-52L, MIT-GEN);
   - power = GCP-AI1001 / 1002; kV, kA, Hz, MVar, power factor, field, energy, field breaker, cooling air, stator coil = the
     generator model; bearings No. 3 / No. 4 = the turbine oil model.
   NO-SOURCE in the app (as on page 17): generator lockout 86G-A / 86G-B, water and oil leakage. The three phase voltages and
   currents of page 17 are one value each here (the model has one). The page has no push button: the generator is
   synchronized by the turbine control system (Turbine start page). */
(function () {
  const { E, L, page } = HX;
  const B = HX.B;
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const ON = 'v:SI-TB>50';
  const GX = 340,
    GY = 450;
  const val = (i, label, key, unit, dp, key2, tag) => ({
    x: 730 + (i % 4) * 255,
    y: 110 + Math.floor(i / 4) * 78,
    side: 'r',
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

  page({
    id: 'generator',
    group: 'Turbine and generator',
    title: 'Generator',
    about:
      'Generator single line, excitation, values and monitoring, breaker status. What temporary page 17 shows (snapshot 37, turbine control system input / output list).',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(E('generator', 'Generator', '', [], { on: ON }), GX, GY, { id: 'gen', sc: 2.2, lab: 'b' }),
        at(L('turbine', 'Turbine', { back: true }), 110, GY, { id: 'tbl' }),
        at(B('Line breaker 52L1', 'data-dy="DITL-03E|i|1|neg" data-on="CLOSED" data-off="OPEN"', { w: 180 }), GX, 110, {
          id: 'l1'
        }),
        at(B('Disconnect switch', 'data-di="MIG-52G1-3|CLOSED|OPEN"', { w: 180 }), GX, 230, { id: 'ds' }),
        at(B('Earth switch', 'data-di="MIG-52G1-5|CLOSED|OPEN"', { w: 150 }), 555, 230, { id: 'es' }),
        at(
          B('Generator breaker 52G1', 'data-dy="DITL-03E|i|2|neg" data-on="CLOSED" data-off="OPEN"', { w: 180 }),
          GX,
          310,
          {
            id: 'g1'
          }
        ),
        at(B('52G1 control', 'data-di="MIL-52G1|REMOTE|LOCAL"', { w: 150 }), 555, 310, { id: 'g1m' }),
        at(B('Field breaker', 'data-uy="gen.fcb|1|CLOSED|OPEN"', { w: 180 }), GX, 640, { id: 'fb' }),
        ...ST.map((s, i) =>
          at(B(s[0], s[1] + ' data-row="' + i + '"', { w: 244 }), 800 + (i % 4) * 254, 610 + Math.floor(i / 4) * 46, {
            id: 's' + i
          })
        )
      ],
      pipes: [
        { med: 'power', w: 4, pts: [[GX, 60], 'l1.t'], flow: ON, arrow: false },
        { med: 'power', w: 4, pts: ['l1.b', 'ds.t'], flow: ON, arrow: false },
        { med: 'power', w: 4, pts: ['ds.b', 'g1.t'], flow: ON, arrow: false },
        { med: 'power', w: 4, pts: ['g1.b', 'gen.t'], flow: ON, arrow: false },
        { med: 'power', w: 2.5, pts: [[GX, 270], [555, 270], 'es.b'], arrow: false },
        { med: 'power', w: 2.5, pts: ['fb.t', [GX, 560]], flow: ON, arrow: false },
        { med: 'power', w: 2.5, pts: ['tbl.r', 'gen.l'], flow: ON, arrow: false }
      ],
      taps: [
        {
          x: GX,
          y: 700,
          side: 'b',
          label: 'Field voltage / current',
          key: 'GEN.VF',
          key2: 'GEN.IF',
          unit: '',
          dp: 0,
          tag: 'V DC / A'
        },
        val(0, 'Power (C)', 'GCP-AI1001', 'MW', 1, null, 'GCP-AI1001'),
        val(1, 'Power (D)', 'GCP-AI1002', 'MW', 1, null, 'GCP-AI1002'),
        val(2, 'Reactive power', 'GEN.MVAR', 'MVar', 1),
        val(3, 'Power factor', 'GEN.PF', '', 3),
        val(4, 'Voltage', 'GEN.KV', 'kV', 1),
        val(5, 'Current', 'GEN.KA', 'kA', 2),
        val(6, 'Frequency', 'GEN.HZ', 'Hz', 2),
        val(7, 'Energy', 'GEN.MWH', 'MWh', 0),
        val(8, 'Reactive energy', 'GEN.MVARH', 'MVarh', 0),
        val(9, 'Bearing 3 metal / outlet oil', 'TEGE1001', '°C', 0, 'TEGE1007', 'TEGE1001 / 1007'),
        val(10, 'Bearing 3 vibration X / Y', 'VEGE10011', 'mm', 3, 'VEGE10012', 'VEGE10011 / 12'),
        val(11, 'Bearing 4 metal / outlet oil', 'TEGE1002', '°C', 0, 'TEGE1008', 'TEGE1002 / 1008'),
        val(12, 'Bearing 4 vibration X / Y', 'VEGE10021', 'mm', 3, 'VEGE10022', 'VEGE10021 / 22'),
        val(13, 'Air cooler outlet A / B', 'GEN.TA1', '°C', 0, 'GEN.TA2', 'TEGE10041 / 42'),
        val(14, 'Air cooler outlet C / D', 'GEN.TA3', '°C', 0, 'GEN.TA4', 'TEGE10043 / 44'),
        val(15, 'Exciter outlet air', 'GEN.TEX', '°C', 0, null, 'TEGE1005'),
        val(16, 'Stator coil A / B', 'GEN.TS1', '°C', 0, 'GEN.TS2', 'TEGE10061 / 62'),
        val(17, 'Stator coil C / D', 'GEN.TS3', '°C', 0, 'GEN.TS4', 'TEGE10063 / 64'),
        val(18, 'Stator coil E / F', 'GEN.TS5', '°C', 0, 'GEN.TS6', 'TEGE10065 / 66')
      ],
      texts: [
        { x: GX + 14, y: 62, s: 'to the grid', cls: 'hx-note' },
        { x: GX + 14, y: 175, s: 'main transformer', cls: 'hx-note' },
        { x: GX + 14, y: 585, s: 'excitation: exciter transformer, voltage regulator', cls: 'hx-note' },
        { x: 720, y: 60, s: 'GENERATOR VALUES AND MONITORING', cls: 'hx-name' },
        { x: 680, y: 565, s: 'BREAKER STATUS AND PROTECTION · Y = true', cls: 'hx-name' },
        {
          x: 680,
          y: 770,
          s: 'Generator air coolers: closed cooling water. Bearing vibration very high trips the turbine.',
          cls: 'hx-note'
        }
      ]
    }
  });
})();
