/* HX page in the REALISTIC look: turbine start and turbine protection (user 2026-11-17: "Ganyan ang HMI na gsto ko"; "dapat
   may originality ha. Maintain ang quality at design na nasimulan"; "Ilink dpat ilink"; "necessary animation for every
   events").
   THE PICTURE: the turbine cut open on its condenser with the generator on its shaft. The steam comes from above through its
   valves as they stand on the machine: main steam through the main stop valves and the control valves into the high
   pressure turbine, hot reheat through the reheat stop valves and the intercept valves into the intermediate pressure
   turbine; the high pressure exhaust leaves to the cold reheat. The generator breaker and the line breaker stand above the
   generator. The values the start-up watches stand at the machine. Below: the steps of the automatic turbine start-up as
   one line of cards, the push buttons of the turbine control system, the trip first out; on the right the trip inputs.
   WHAT IS LINKED (the signals of temporary page 13 "TURBINE START"; its sources: TCS drawings 310SC90-775 automatic turbine
   start-up sequence, 310SC90-776 criteria, IBD 310SC90-794 sheets TA-1 push buttons, TA-9 first out, TA-10 vacuum trip;
   PR-OPE-5002; snapshots 4.PNG and 37.PNG):
   - main stop valves and reheat stop valves = turbine reset (tcs.rst): red and open after the reset, green after a trip;
     control valves ZI-CV, intercept valves ZI-ICV, speed SI-TB = the turbine model;
   - 52G1 / 52L1 = DITL-03E inputs 2 / 1 (the same states as on the Generator page);
   - step cards 1 ~ 8 = the step of the turbine control system model and its three check items (hmi-mock.js ATS_CK, the
     check list of page 13): the running step is lit and shows its live value; step 9 shut-down = tcs.st9;
   - push buttons SHUT-DOWN, HOLD OFF, TURBINE TRIP, TURBINE RESET = the same presses (RUN mode only);
   - TRIPPED / RESET and the first out = tcs-trip.js; the 23 trip inputs of TA-9, red = the one that came first.
   NO-SOURCE in the app, as on page 13 (not shown): disconnecting switch, differential expansion, rotor position, thermal
   stress. The warming limits of PR-OPE-5002 that page 13 lists as text are in the procedure, not on this page. */
(function () {
  const { V, E, L, page } = HX;
  const B = HX.B;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const ON = 'v:SI-TB>50';
  /* named states */
  const RST = HX.hk('tb-rst', 'data-uy="tcs.rst|1|OPEN|CLOSED" data-h="1"'),
    G1 = HX.hk('gen-g1', 'data-dy="DITL-03E|i|2|neg" data-on="CLOSED" data-off="OPEN"'),
    L1 = HX.hk('gen-l1', 'data-dy="DITL-03E|i|1|neg" data-on="CLOSED" data-off="OPEN"');
  /* places (the drawing is 1760 x 1000) */
  const TX = 640,
    TY = 320,
    TS = 1.4 /* turbine: shaft centre */,
    tp = (x, y) => [Math.round(TX + x * TS), Math.round(TY + y * TS)],
    HPX = tp(46, 0)[0] /* main steam comes down here */,
    IPX = tp(-60, 0)[0] /* hot reheat comes down here */,
    GX = TX - Math.round(262 * TS) - Math.round(70 * TS) /* generator */,
    VX = 1010; /* the values at the turbine */
  const STEP = [
    ['1 HP turbine warming', ['Warming start', 'Metal above 150 °C', 'Criteria D0']],
    ['2 Turbine preparation', ['Chest warming', 'Turbine reset', 'Main stop valves open']],
    ['3 Rub check', ['Speed 200 rpm', 'Valves close', 'Below 100 rpm']],
    ['4 Acceleration', ['Soak 1800 rpm', 'Speed 3600 rpm', 'Soak 3600 rpm']],
    ['5 Excitation', ['Excitation on', 'Rated voltage', 'Criteria D4']],
    ['6 Synch. and initial load', ['Auto sync', '52G closed', 'Initial load hold']],
    ['7 Load up', ['Intercept to control valves', 'Load to target', 'Criteria D6']],
    ['8 Normal operation', ['No hold', 'Rate limit', 'Criteria D7']]
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
    x: VX,
    y: 262 + i * 64,
    side: 'r',
    label,
    key,
    key2,
    unit,
    dp,
    tag: tag || ''
  });
  const SY = 856 /* the step cards */,
    PY = 950; /* push buttons */

  page({
    id: 'turbine',
    group: 'Turbine and generator',
    title: 'Turbine start',
    about:
      'The turbine with its steam valves and the generator breaker, the steps of the automatic turbine start-up, the push buttons of the turbine control system and the trip first out.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        at(E('tgset', '', '', [], { on: ON }), TX, TY, { id: 'tg', under: true, sc: TS }),
        at(E('generator', '', '', [], { on: ON }), GX, TY, { id: 'gen', under: true, sc: TS }),
        /* the steam valves, as they stand above the machine */
        at(L('drum-steam', 'Main steam', { back: true }), HPX, 40, { id: 'msl' }),
        at(E('valve', 'Main stop valves', 'A / B', [], { kind: 'shutoff', on: RST, wrap: 10 }), HPX, 100, {
          id: 'msv',
          rot: 90,
          lab: 'r'
        }),
        at(
          E('valve', 'Control valves', 'A / B', [V('Position', 'ZI-CV', '%', 1)], {
            kind: 'control',
            on: 'v:ZI-CV>1',
            wrap: 10
          }),
          HPX,
          180,
          {
            id: 'cv',
            rot: 90,
            lab: 'r'
          }
        ),
        at(L('reheat-steam', 'Hot reheat steam', { back: true }), IPX, 40, { id: 'hrl' }),
        at(E('valve', 'Reheat stop valves', 'A / B', [], { kind: 'shutoff', on: RST, wrap: 10 }), IPX, 100, {
          id: 'rsv',
          rot: 90,
          lab: 'l'
        }),
        at(
          E('valve', 'Intercept valves', 'A / B', [V('Position', 'ZI-ICV', '%', 1)], {
            kind: 'control',
            on: 'v:ZI-ICV>1',
            wrap: 10
          }),
          IPX,
          180,
          {
            id: 'icv',
            rot: 90,
            lab: 'l'
          }
        ),
        at(L('reheat-steam', 'Cold reheat steam'), 880, tp(0, 48)[1] + 46, { id: 'crl' }),
        /* generator breaker and line breaker above the generator */
        at(E('breaker', 'Line breaker 52L1', '', [], { on: L1, wrap: 12 }), GX, 90, { id: 'l1', sc: 0.8, lab: 'r' }),
        at(E('breaker', 'Generator breaker 52G1', '', [], { on: G1, wrap: 12 }), GX, 190, {
          id: 'g1',
          sc: 0.8,
          lab: 'r'
        }),
        at(L('generator', 'Generator page'), GX, 470, { id: 'gnl' }),
        at(L('turbine-oil', 'Turbine oil'), VX + 200, 640, { id: 'tol' }),
        /* automatic turbine start-up */
        at(B('Start-up mode', 'data-ut="tcs.mode"', { w: 150 }), 330, 784, { id: 'mode' }),
        ...STEP.map((s, i) => at(HX.S(i, s[0], s[1], { w: 184 }), 104 + i * 194, SY, { id: 'st' + i })),
        at(B('9 Shut-down', 'data-uy="tcs.st9|1|Y|N"', { w: 150 }), 104 + 8 * 194 - 16, SY - 32, { id: 'st8' }),
        at(B('SHUT-DOWN', 'data-tpb="shutdown"', { press: true, w: 150 }), 104 + 8 * 194 - 16, SY + 8, { id: 'pbsd' }),
        at(B('HOLD OFF', 'data-tpb="holdoff"', { press: true, w: 150 }), 104 + 8 * 194 - 16, SY + 42, { id: 'pbho' }),
        /* turbine protection */
        at(B('Turbine', 'data-tt="st"', { w: 150 }), 90, PY, { id: 'tst' }),
        at(B('Trip first out', 'data-tt="fo"', { w: 560 }), 460, PY, { id: 'tfo' }),
        at(B('TURBINE TRIP', 'data-tpb="trip"', { press: true, w: 170 }), 860, PY, { id: 'pbtr' }),
        at(B('TURBINE RESET', 'data-tpb="tripreset"', { press: true, w: 170 }), 1050, PY, { id: 'pbrs' }),
        ...TRIP.map((t, i) =>
          at(B(t[0], 'data-tfo="' + t[1] + '"', { plain: true, w: 330 }), 1570, 92 + i * 26, { id: 'tf' + i })
        )
      ],
      pipes: [
        /* main steam: stop valves, control valves, into the high pressure turbine */
        { med: 'steam', w: 6, pts: ['msl.b', 'msv.l'], flow: ON, arrow: false },
        { med: 'steam', w: 6, pts: ['msv.r', 'cv.l'], flow: RST + '&' + ON, arrow: false },
        { med: 'steam', w: 6, pts: ['cv.r', 'tg.hpIn'], flow: 'v:ZI-CV>1&' + ON },
        /* high pressure exhaust to the cold reheat */
        { med: 'reheat', w: 6, pts: ['tg.hpEx', [tp(110, 0)[0], tp(0, 48)[1] + 46], 'crl.l'], flow: 'v:ZI-CV>1&' + ON },
        /* hot reheat: reheat stop valves, intercept valves, into the intermediate pressure turbine */
        { med: 'reheat', w: 6, pts: ['hrl.b', 'rsv.l'], flow: ON, arrow: false },
        { med: 'reheat', w: 6, pts: ['rsv.r', 'icv.l'], flow: RST + '&' + ON, arrow: false },
        { med: 'reheat', w: 6, pts: ['icv.r', 'tg.ipA'], flow: 'v:ZI-ICV>1&' + ON },
        /* generator to the grid */
        { med: 'power', w: 4, pts: [[GX, 30], 'l1.t'], flow: L1, arrow: false },
        { med: 'power', w: 4, pts: ['l1.b', 'g1.t'], flow: L1, arrow: false },
        { med: 'power', w: 4, pts: ['g1.b', 'gen.t'], flow: ON, arrow: false },
        /* the sequence line under the step cards */
        ...STEP.slice(1).map((s, i) => ({ med: 'signal', w: 2, pts: ['st' + i + '.r', 'st' + (i + 1) + '.l'] }))
      ],
      taps: [
        { x: HPX + 60, y: 40, side: 'r', label: 'Main steam', key: 'PT-MS1006-1', unit: K, dp: 1, tag: 'PT-MS1006-1' },
        {
          x: GX,
          y: TY + 70,
          side: 'b',
          label: 'Generator load',
          key: 'GCP-AI1001',
          unit: 'MW',
          dp: 1,
          tag: 'GCP-AI1001'
        },
        {
          x: tp(-210, 0)[0],
          y: tp(0, 150)[1],
          side: 'l',
          label: 'Exhaust hood',
          key: 'TT-HOOD',
          unit: '°C',
          dp: 0,
          tag: ''
        },
        {
          x: tp(-210, 0)[0],
          y: tp(0, 210)[1],
          side: 'l',
          label: 'Condenser pressure',
          key: 'PT-CD',
          unit: K + ' abs',
          dp: 3,
          tag: ''
        },
        val(0, 'Speed', 'SI-TB', 'rpm', 0),
        val(1, 'Vibration, highest', 'VIST-MAX', 'mm', 3, null, 'VIST1001 / 1002'),
        val(2, 'Shell expansion', 'ZI-SEXP', 'mm', 1, null, 'ZIST1001'),
        val(3, 'Thrust bearing front / rear', 'TIST-THF', '°C', 0, 'TIST-THR', 'TIST1011 / 1012'),
        val(4, 'Bearing oil pressure', 'PT-BRG', K, 1, null, 'PTLO10031 ~ 33'),
        val(5, 'Control oil / trip oil', 'PT-CTL', K, 0, 'PT-TRIP', 'PTLO10061 / 10071'),
        val(6, 'Lube oil after cooler', 'TT-LOCOOL', '°C', 0, null, 'TILO10021 / 22'),
        /* the target load of the turbine control system (the old UNIT page: TCS target MW) */
        val(7, 'Target load', 'TCS-AI1001', 'MW', 1, null, 'TCS-AI1001')
      ],
      texts: [
        { x: GX + 14, y: 34, s: 'to the grid', cls: 'hx-note' },
        { x: 20, y: 788, s: 'AUTOMATIC TURBINE START-UP', cls: 'hx-name' },
        { x: 1404, y: 60, s: 'TRIP FIRST OUT · red = came first', cls: 'hx-name' },
        { x: 1250, y: PY + 4, s: 'push buttons work in RUN', cls: 'hx-note' },
        { x: VX - 10, y: 220, s: 'AT THE TURBINE', cls: 'hx-name' }
      ]
    }
  });
})();
