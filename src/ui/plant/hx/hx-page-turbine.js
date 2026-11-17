/* HX page in the REALISTIC look: turbine start and turbine protection (user 2026-11-17: "Ganyan ang HMI na gsto ko. Dapat iyan
   lang makita ko n mga itsura"; "Lahat ng luma na HMI, alisin dyan s app").
   THE PICTURE: the turbine and the generator on the left with their valves and breakers as states; on the right the values
   the automatic turbine start-up watches; below the nine steps of the automatic turbine start-up, the push buttons of the
   turbine control system and the trip first out list.
   EVERYTHING on this page is what temporary page 13 "TURBINE START" shows and presses (its sources: TCS drawings 310SC90-775
   automatic turbine start-up sequence, 310SC90-776 criteria, IBD 310SC90-794 sheets TA-1 push buttons, TA-9 first out, TA-10
   vacuum trip; PR-OPE-5002; snapshots 4.PNG and 37.PNG):
   - steps 1 ~ 8 and step 9 (shut-down) = the step of the turbine control system model (tcs.js), Y = the step is reached;
   - push buttons SHUT-DOWN, HOLD OFF, TURBINE TRIP, TURBINE RESET = the same presses (RUN mode only);
   - TRIPPED / RESET and the first out = tcs-trip.js; the 23 trip inputs of TA-9, red = the one that came first;
   - main stop valves and reheat stop valves OPEN / CLOSED = turbine reset; control valves ZI-CV, intercept valves ZI-ICV,
     speed SI-TB = the turbine model; 52G1 and 52L1 = DITL-03E inputs 2 and 1; field breaker and the generator values = the
     generator model.
   NO-SOURCE in the app, as on page 13 (not shown here): disconnecting switch, differential expansion, rotor position, thermal
   stress. NOT on this page yet: the three check items under each step card of page 13 (live Cold start 2026-11-14). */
(function () {
  const { V, E, L, page } = HX;
  const B = HX.B;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const ON = 'v:SI-TB>50';
  /* places (the drawing is 1760 x 1000) */
  const TX = 470,
    TY = 170; /* turbine: shaft centre */
  const STEP = [
    ['1 HP turbine warming', 'tcs.step|0'],
    ['2 Turbine preparation', 'tcs.step|1'],
    ['3 Rub check', 'tcs.step|2'],
    ['4 Acceleration', 'tcs.step|3'],
    ['5 Excitation', 'tcs.step|4'],
    ['6 Synch. and initial load', 'tcs.step|5'],
    ['7 Load up', 'tcs.step|6'],
    ['8 Normal operation', 'tcs.step|7'],
    ['9 Shut-down', 'tcs.st9|1']
  ];
  const TRIP = [
    ['Main steam temperature very low', 'MAIN STEAM TEMP. VERY LOW TRIP'],
    ['Condenser vacuum very low', 'CONDENSER VACUUM VERY LOW TRIP'],
    ['Thrust bearing failure, front', 'THRUST BEARING FAILURE (FRONT) ABNORMAL TRIP'],
    ['Thrust bearing failure, rear', 'THRUST BEARING FAILURE (REAR) ABNORMAL TRIP'],
    ['Control oil pressure very low', 'CONTROL OIL PRESS. VERY LOW TRIP'],
    ['Bearing oil pressure very low', 'BEARING OIL PRESS. VERY LOW TRIP'],
    ['LP exhaust hood temperature very high', 'LP TURBINE EXHAUST HOOD STEAM TEMP. VERY HIGH TRIP'],
    ['Trip oil pressure very low', 'TURBINE TRIP OIL PRESS. VERY LOW TRIP'],
    ['Back-up overspeed', 'TURBINE SPEED (TURBINE BACK-UP OVERSPEED) TRIP'],
    ['Overspeed', 'TURBINE SPEED (TURBINE OVERSPEED) TRIP'],
    ['No. 1 turbine shaft vibration very high', 'NO.1 TURBINE SHAFT VIBRATION VERY HIGH TRIP'],
    ['No. 2 turbine shaft vibration very high', 'NO.2 TURBINE SHAFT VIBRATION VERY HIGH TRIP'],
    ['No. 3 generator shaft vibration very high', 'NO.3 GEN. SHAFT VIBRATION VERY HIGH TRIP'],
    ['No. 4 generator shaft vibration very high', 'NO.4 GEN. SHAFT VIBRATION VERY HIGH TRIP'],
    ['HP exhaust temperature very high', 'HP TURBINE EXHAUST STEAM TEMP. VERY HIGH TRIP'],
    ['HP inlet / exhaust diff. pressure very high', 'HP TURBINE INLET/EXHAUST STEAM DIFF. PRESS. VERY HIGH TRIP'],
    ['HP exhaust pressure very high', 'HP TURBINE EXHAUST STEAM PRESS. VERY HIGH TRIP'],
    ['Generator / unit transformer protection A', 'GEN./UNIT TRANS. PROTECTION A &amp; GEN. LOCKOUT RELAY A'],
    ['Generator / unit transformer protection B', 'GEN./UNIT TRANS. PROTECTION B &amp; GEN. LOCKOUT RELAY B'],
    ['Turbine shutdown command', 'TURBINE SHUTDOWN COMMAND'],
    ['TCS major trouble', 'TCS MAJOR TROUBLE'],
    ['Boiler MFT 1', 'BOILER MFT 1'],
    ['Boiler MFT 2', 'BOILER MFT 2']
  ];
  const val = (i, label, key, unit, dp, key2, tag) => ({
    x: 800 + (i % 4) * 235,
    y: 110 + Math.floor(i / 4) * 78,
    side: 'r',
    label,
    key,
    key2,
    unit,
    dp,
    tag: tag || ''
  });

  page({
    id: 'turbine',
    group: 'Turbine and generator',
    title: 'Turbine start',
    about:
      'Automatic turbine start-up steps, the push buttons of the turbine control system and the trip first out. What temporary page 13 shows and presses (TCS drawings 310SC90-775 / 776 / 794).',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(E('tgset', '', '', [], { on: ON }), TX, TY, { id: 'tg', under: true }),
        at(E('generator', '', '', [], { on: ON }), TX - 332, TY, { id: 'gen', under: true }),
        at(L('drum-steam', 'Main steam', { back: true }), 650, 60, { id: 'msl' }),
        at(L('reheat-steam', 'Reheat steam', { back: true }), 290, 60, { id: 'rhl' }),
        at(L('turbine-oil', 'Turbine oil'), 650, 470, { id: 'tol' }),
        at(L('generator', 'Generator'), 110, 470, { id: 'gnl' }),
        /* states at the machine */
        at(B('Main stop valves A / B', 'data-uy="tcs.rst|1|OPEN|CLOSED"', { w: 150 }), 650, 110, { id: 'msv' }),
        at(B('Reheat stop valves A / B', 'data-uy="tcs.rst|1|OPEN|CLOSED" data-rsv="1"', { w: 160 }), 290, 110, {
          id: 'rsv'
        }),
        at(
          B('Generator breaker 52G1', 'data-dy="DITL-03E|i|2|neg" data-on="CLOSED" data-off="OPEN"', { w: 160 }),
          110,
          300,
          {
            id: 'g1'
          }
        ),
        at(
          B('Line breaker 52L1', 'data-dy="DITL-03E|i|1|neg" data-on="CLOSED" data-off="OPEN"', { w: 160 }),
          110,
          350,
          {
            id: 'l1'
          }
        ),
        at(B('Field breaker', 'data-uy="gen.fcb|1|CLOSED|OPEN"', { w: 160 }), 110, 400, { id: 'fb' }),
        /* automatic turbine start-up */
        at(B('Start-up mode', 'data-ut="tcs.mode"', { w: 150 }), 420, 545, { id: 'mode' }),
        ...STEP.map((s, i) =>
          at(B(s[0], 'data-uy="' + s[1] + '|Y|N"', { w: 178 }), 100 + i * 190, 610, { id: 'st' + i })
        ),
        at(B('SHUT-DOWN', 'data-tpb="shutdown"', { press: true, w: 150 }), 1060, 545, { id: 'pbsd' }),
        at(B('HOLD OFF', 'data-tpb="holdoff"', { press: true, w: 150 }), 1230, 545, { id: 'pbho' }),
        /* turbine protection */
        at(B('Turbine', 'data-tt="st"', { w: 150 }), 100, 720, { id: 'tst' }),
        at(B('Trip first out', 'data-tt="fo"', { w: 560 }), 480, 720, { id: 'tfo' }),
        at(B('TURBINE TRIP', 'data-tpb="trip"', { press: true, w: 160 }), 1060, 720, { id: 'pbtr' }),
        at(B('TURBINE RESET', 'data-tpb="tripreset"', { press: true, w: 160 }), 1240, 720, { id: 'pbrs' }),
        ...TRIP.map((t, i) =>
          at(
            B(t[0], 'data-tfo="' + t[1] + '"', { plain: true, w: 330 }),
            190 + (i % 5) * 345,
            790 + Math.floor(i / 5) * 32,
            {
              id: 'tf' + i
            }
          )
        )
      ],
      pipes: [
        { med: 'steam', w: 5, pts: ['msv.b', [650, 128], 'tg.hpIn'], flow: ON },
        { med: 'reheat', w: 5, pts: ['rsv.b', [290, 128], [410, 128], 'tg.ipA'], flow: ON }
      ],
      taps: [
        {
          x: TX + 110,
          y: TY + 60,
          side: 'b',
          label: 'Control valves',
          key: 'ZI-CV',
          unit: '%',
          dp: 1,
          tag: 'ZIST1903 / 1904'
        },
        {
          x: TX + 5,
          y: TY - 62,
          side: 't',
          label: 'Intercept valves',
          key: 'ZI-ICV',
          unit: '%',
          dp: 1,
          tag: 'ZIST1905'
        },
        { x: TX, y: TY + 80, side: 'b', label: 'Speed', key: 'SI-TB', unit: 'rpm', dp: 0, tag: '' },
        {
          x: TX - 332,
          y: TY - 50,
          side: 't',
          label: 'Generator load',
          key: 'GCP-AI1001',
          unit: 'MW',
          dp: 1,
          tag: 'GCP-AI1001'
        },
        val(0, 'Main steam pressure', 'PT-MS1006-1', K, 1, null, 'PT-MS1006-1'),
        val(1, 'Vibration, highest', 'VIST-MAX', 'mm', 3, null, 'VIST1001 / 1002'),
        val(2, 'Exhaust hood', 'TT-HOOD', '°C', 0),
        val(3, 'Condenser pressure', 'PT-CD', K + ' abs', 3),
        val(4, 'Bearing oil pressure', 'PT-BRG', K, 1, null, 'PTLO10031 ~ 33'),
        val(5, 'Control oil / trip oil', 'PT-CTL', K, 0, 'PT-TRIP', 'PTLO10061 / 10071'),
        val(6, 'Lube oil after cooler', 'TT-LOCOOL', '°C', 0, null, 'TILO10021 / 22'),
        val(7, 'Shell expansion', 'ZI-SEXP', 'mm', 1, null, 'ZIST1001'),
        val(8, 'Thrust bearing front / rear', 'TIST-THF', '°C', 0, 'TIST-THR', 'TIST1011 / 1012'),
        val(9, 'Stator coil, highest', 'GEN.TSMAX', '°C', 0, null, 'TIGE10061 ~ 66'),
        val(10, 'Generator cooling air', 'GEN.TAIR', '°C', 0, null, 'TIGE10041 ~ 44'),
        val(11, 'Field voltage / current', 'GEN.VF', '', 0, 'GEN.IF', 'V DC / A'),
        val(12, 'Generator kV / kA', 'GEN.KV', '', 1, 'GEN.KA'),
        val(13, 'Frequency', 'GEN.HZ', 'Hz', 2),
        val(14, 'Reactive power', 'GEN.MVAR', 'MVar', 1),
        val(15, 'Power factor', 'GEN.PF', '', 2)
      ],
      texts: [
        { x: 20, y: 550, s: 'AUTOMATIC TURBINE START-UP', cls: 'hx-name' },
        { x: 20, y: 680, s: 'TURBINE PROTECTION', cls: 'hx-name' },
        { x: 20, y: 768, s: 'Trip first out: red = the trip input that came first.', cls: 'hx-note' },
        { x: 790, y: 60, s: 'VALUES THE START-UP WATCHES', cls: 'hx-name' },
        { x: 1340, y: 549, s: 'push buttons work in RUN', cls: 'hx-note' }
      ]
    }
  });
})();
