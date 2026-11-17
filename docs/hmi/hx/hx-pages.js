/* HX pages: the whole plant in 23 pages (LMYP #1, 460 T/H CFB boiler, 150 MW). Every tag, machine and loop below is one that the
   app already binds on its 19 temporary pages (hx-registry.js); the words are plain English, the tag is the small reference.
   A page = lanes (one stream each, left to right; [a, b] = in parallel). Add a page: copy one, change the lanes (README). */
(function () {
  const { V, E, M, C, X, L, page } = HX;
  const A = name => (name ? 'kg/cm²' : 'kg/cm²');
  const K = A();

  /* ================= UNIT ================= */
  page({
    id: 'overview',
    group: 'Unit',
    title: 'Plant overview',
    about: 'The whole unit as one cycle. Tap a block to open its page.',
    lanes: [
      {
        med: 'gas',
        label: 'Fuel, air and flue gas',
        items: [
          [
            E('conveyor', 'Coal feeders', '3 feeders', [V('Coal', 'pv:FIC-CM', 't/h')], {
              go: 'coal',
              med: 'coal',
              w: 70
            }),
            E('fan', 'Air fans', 'primary, secondary, fluidizing', [V('Total air', 'ABC-002|SI0060', 't/h')], {
              go: 'combustion-air',
              med: 'air',
              r: 15
            })
          ],
          E(
            'furnace',
            'Furnace',
            'circulating fluidized bed',
            [V('Bed', 'TT-FG1090', '°C', 0), V('Pressure', 'PT-FG1085', 'mmH₂O', 0)],
            { go: 'furnace-gas', w: 64, h: 104 }
          ),
          E('backpass', 'Back pass', 'superheater, reheater, economizer', [V('Gas out', 'TT-FG1110', '°C', 0)], {
            go: 'furnace-gas',
            w: 54,
            h: 92,
            banks: 3
          }),
          E('airheater', 'Air preheater', '', [V('Oxygen', 'AT-FG1122', '%')], { go: 'furnace-gas', r: 24 }),
          E('precipitator', 'Precipitator', 'fly ash', [], { go: 'furnace-gas', w: 90, h: 46, fields: 3 }),
          E('fan', 'Induced draft fan', '', [V('Current', 'IT-F1056', 'A')], { go: 'furnace-gas', r: 15 }),
          E('stack', 'Stack', '', [V('Gas', 'TT-FG1152', '°C', 0)], { w: 24, h: 96 })
        ]
      },
      {
        med: 'steam',
        label: 'Steam and power',
        cut: [4],
        items: [
          E('drum', 'Steam drum', '', [V('Pressure', 'PT-BR1001-1', K), V('Level', 'pv:LICBR1001B', 'mm', 0)], {
            id: 'drum',
            go: 'drum-steam',
            w: 120,
            h: 38
          }),
          E(
            'bank',
            'Superheaters',
            'sprays 1 and 2',
            [V('Main steam', 'pv:TICMS1004', '°C', 0), V('Flow', 'FT-MS1031', 't/h')],
            { go: 'drum-steam', w: 70, h: 36 }
          ),
          E('turbine', 'High pressure turbine', '', [V('Inlet', 'PT-MS1002', K)], { go: 'turbine', w: 60, h: 52 }),
          E('bank', 'Reheater', '', [V('Outlet', 'TT-HR1002-1', '°C', 0), V('Pressure', 'PT-HR1003-1', K)], {
            go: 'reheat-bypass',
            w: 70,
            h: 36
          }),
          E('turbine', 'Intermediate and low pressure turbine', '', [], { id: 'lpt', go: 'turbine', w: 84, h: 62 }),
          E('generator', 'Generator', '', [V('Load', 'GCP-AI1001', 'MW'), V('Speed', 'SI-TB', 'rpm', 0)], {
            id: 'gen',
            go: 'generator',
            w: 70,
            h: 46
          })
        ]
      },
      {
        med: 'water',
        label: 'Condensate and feedwater',
        rev: true,
        items: [
          E('condenser', 'Condenser', '', [V('Pressure', 'PT-CD1110', 'kg/cm² abs', 3)], {
            id: 'cond',
            go: 'condensate',
            w: 110,
            h: 60,
            med: 'condensate'
          }),
          E('pump', 'Condensate pumps', '', [V('Flow', 'FTCD1120', 't/h')], { go: 'condensate', med: 'condensate' }),
          E('heater', 'Low pressure heaters', '1 to 3', [V('Outlet', 'TT-CD1103-2', '°C', 0)], {
            go: 'condensate',
            w: 90,
            h: 34,
            med: 'condensate'
          }),
          E('deaerator', 'Deaerator', '', [V('Pressure', 'PT-CD1104', K, 2)], { go: 'feedwater', w: 110, h: 34 }),
          E('pump', 'Boiler feed pumps', '', [V('Discharge', 'PT-FW1011', K)], { go: 'feedwater' }),
          E(
            'heater',
            'High pressure heaters',
            '1 and 2',
            [V('Outlet', 'TT-FW1106', '°C', 0), V('Flow', 'pv:FICFW1007', 't/h')],
            { id: 'hph', go: 'feedwater', w: 90, h: 34 }
          )
        ]
      }
    ],
    joins: [
      { from: 'hph.l', to: 'drum.l', med: 'water', w: 4, via: 'h', mid: 46 },
      { from: 'lpt.b', to: 'cond.t', med: 'steam', w: 4, via: 'v' },
      { from: 'lpt.r', to: 'gen.l', med: 'power', w: 3 }
    ],
    trends: [
      {
        title: 'Load and steam',
        pens: [
          ['Load', 'GCP-AI1001', 'MW'],
          ['Main steam pressure', 'PT-MS1002', K],
          ['Main steam flow', 'FT-MS1031', 't/h'],
          ['Coal', 'pv:FIC-CM', 't/h']
        ]
      },
      {
        title: 'Boiler',
        pens: [
          ['Drum pressure', 'PT-BR1001-1', K],
          ['Bed temperature', 'TT-FG1090', '°C', 0],
          ['Furnace pressure', 'PT-FG1085', 'mmH₂O', 0],
          ['Oxygen', 'AT-FG1122', '%']
        ]
      }
    ]
  });

  page({
    id: 'unit-control',
    group: 'Unit',
    title: 'Unit load control',
    about:
      'Coordinated control: load demand to the turbine master and, through the boiler pressure, to the boiler and coal masters.',
    lanes: [
      {
        med: 'signal',
        w: 2.4,
        label: 'Turbine side',
        items: [
          C('HIC-ULD', 'Unit load demand', { id: 'uld', sym: 'block', w: 96, h: 40, pv: 'MW' }),
          C('EIC-TM', 'Turbine master', { sym: 'block', w: 96, h: 40, pv: 'MW' }),
          E('turbine', 'Turbine', '', [V('Speed', 'SI-TB', 'rpm', 0), V('Control valves', 'ZI-CV', '%')], {
            w: 70,
            h: 54,
            go: 'turbine'
          }),
          E('generator', 'Generator', '', [V('Load', 'GCP-AI1001', 'MW')], { w: 72, h: 46, go: 'generator' })
        ]
      },
      {
        med: 'signal',
        w: 2.4,
        label: 'Boiler side',
        items: [
          C('PIC-COBM', 'Boiler pressure control', { id: 'cobm', sym: 'block', w: 96, h: 40, pv: K }),
          C('HIC-BM', 'Boiler master', { sym: 'block', w: 96, h: 40 }),
          [
            C('FIC-CM', 'Coal master', { sym: 'block', w: 96, h: 40, pv: 't/h' }),
            C('FIC-OM', 'Oil master', { sym: 'block', w: 96, h: 40, pv: 't/h' })
          ],
          E(
            'furnace',
            'Boiler',
            '',
            [
              V('Main steam pressure', 'PT-MS1002', K),
              V('Main steam flow', 'ABC-001C|SI0230', 't/h'),
              V('Drum pressure', 'PT-BR1001-1', K)
            ],
            { w: 60, h: 100, go: 'furnace-gas' }
          )
        ]
      }
    ],
    joins: [{ from: 'uld.b', to: 'cobm.t', med: 'signal', w: 2.4, via: 'v' }],
    trends: [
      {
        title: 'Load',
        pens: [
          ['Load demand', 'pv:HIC-ULD', 'MW'],
          ['Generator load', 'GCP-AI1001', 'MW'],
          ['Turbine master', 'pv:EIC-TM', 'MW']
        ]
      },
      {
        title: 'Pressure and firing',
        pens: [
          ['Main steam pressure', 'pv:PIC-COBM', K],
          ['Pressure set point', 'sv:PIC-COBM', K],
          ['Boiler master output', 'mv:HIC-BM', '%'],
          ['Coal', 'pv:FIC-CM', 't/h']
        ]
      }
    ]
  });

  page({
    id: 'purge-trip',
    group: 'Unit',
    title: 'Furnace purge and trips',
    about: 'What must be true before the furnace purge, the purge itself and the master fuel trip.',
    lanes: [
      {
        med: 'air',
        label: 'Purge air path',
        items: [
          [
            M('blower', 'FA BLOWER-A', 'Fluidizing air blower A', [], { tag: 'F-1055A' }),
            M('fan', 'PAF', 'Primary air fan', [], { tag: 'F-1053', r: 16 }),
            M('fan', 'SAF', 'Secondary air fan', [], { tag: 'F-1054', r: 16 })
          ],
          E(
            'furnace',
            'Furnace',
            '',
            [V('Total air', 'ABC-002|SI0060', 't/h'), V('Pressure', 'PT-FG1085', 'mmH₂O', 0)],
            { w: 70, h: 130, med: 'gas' }
          ),
          M('fan', 'IDF', 'Induced draft fan', [V('Current', 'IT-F1056', 'A')], { tag: 'F-1056', med: 'gas' }),
          M('block', 'Furnace purge', 'Furnace purge start', [], { tag: 'screen push button · DITL-02', w: 104, h: 36 })
        ],
        cut: [2]
      }
    ],
    lists: [
      {
        title: 'Furnace purge permissive: all must be Y',
        src: 'DITL-01',
        key: 'DITL-01',
        rows: [
          'ID fan running',
          'Secondary air fan running',
          'Any fluidizing air blower running',
          'Primary air fan running',
          'Burner air dampers A to D at purge position 25 %',
          'Total air flow above 25 % MCR',
          'All burners no flame (A to D)',
          'All burner oil valves closed (A to D)',
          'All coal feeders stopped (A, B, C)',
          'All coal feeder outlet valves closed',
          'Limestone rotary valve stopped',
          'Reheater gas damper at least 30 %',
          'Superheater gas damper at least 60 %',
          'No boiler trip command',
          'Cyclone outlet gas temp not high-high',
          'Reheater outlet header temp not high-high'
        ]
      },
      {
        title: 'Purge sequence',
        src: 'DITL-02',
        key: 'DITL-02',
        rows: [
          'Permissive OK',
          'Purge in progress, 5 minutes',
          'Furnace purge completed',
          'MFT reset (no trip condition left)'
        ]
      },
      {
        title: 'Master fuel trip: any one trips',
        src: 'DITL-03A',
        key: 'DITL-03A',
        rows: [
          'ID fan stopped',
          'Secondary air fan stopped',
          'Primary air fan stopped',
          'All fluidizing air blowers stopped (60 s)',
          'Total air flow below 25 % MCR',
          'Furnace pressure high-high (2 of 3, 5 s)',
          'Furnace pressure low-low',
          'Drum level high-high (2 of 3, 5 s)',
          'Drum level low-low (2 of 3, 5 s)',
          'Loss of all fuel',
          'Primary air flow low-low',
          'Furnace temp inadequate for coal firing',
          'Emergency trip push button (screen)',
          'Emergency trip push button (desk)',
          'Instrument air pressure low-low',
          'Cyclone outlet gas temp high-high',
          'Reheater outlet header temp high-high',
          'Turbine trip'
        ]
      }
    ],
    trends: [
      {
        title: 'Purge air',
        pens: [
          ['Total air flow', 'ABC-002|SI0060', 't/h'],
          ['Furnace pressure', 'PT-FG1085', 'mmH₂O', 0]
        ]
      }
    ]
  });

  /* ================= FUEL ================= */
  const feeder = x =>
    M('conveyor', 'COAL FEEDER ' + x, 'Coal feeder ' + x, [V('Feed rate', 'pv:FICCL1061' + x, 't/h')], {
      tag: 'L-1061' + x + ' · DITL-19',
      w: 96,
      flow: 'm:COAL FEEDER ' + x
    });
  page({
    id: 'coal',
    group: 'Fuel',
    title: 'Coal feeding',
    about: 'Three bunkers and belt feeders to the furnace. The coal master shares the demand between the feeders.',
    lanes: [
      {
        med: 'signal',
        w: 2.4,
        label: 'Coal demand',
        items: [
          C('HS-COAL', 'Total coal flow correction', { sym: 'block', w: 96, h: 38, pv: 't/h', at: 30 }),
          C('FIC-CM', 'Coal master', { sym: 'block', w: 96, h: 38, pv: 't/h', at: 62 })
        ]
      },
      {
        med: 'coal',
        label: 'Coal',
        items: [
          ['A', 'B', 'C'].map(x => E('bunker', 'Coal bunker ' + x, '', [], { w: 54, h: 62 })),
          ['A', 'B', 'C'].map(feeder),
          ['A', 'B', 'C'].map(x => X('XV-CL1061-' + x, 'Feeder ' + x + ' outlet valve')),
          E('furnace', 'Furnace', '', [V('Total coal', 'pv:FIC-CM', 't/h'), V('Bed', 'TT-FG1090', '°C', 0)], {
            w: 80,
            h: 190,
            go: 'furnace-gas'
          })
        ]
      }
    ],
    loops: [
      ['FICCL1061A', 'Coal feeder A feed rate'],
      ['FICCL1061B', 'Coal feeder B feed rate'],
      ['FICCL1061C', 'Coal feeder C feed rate']
    ],
    trends: [
      {
        title: 'Coal flow',
        pens: [
          ['Total coal', 'pv:FIC-CM', 't/h'],
          ['Feeder A', 'pv:FICCL1061A', 't/h'],
          ['Feeder B', 'pv:FICCL1061B', 't/h'],
          ['Feeder C', 'pv:FICCL1061C', 't/h']
        ]
      },
      {
        title: 'Coal master',
        pens: [
          ['Demand', 'sv:FIC-CM', 't/h'],
          ['Output', 'mv:FIC-CM', '%'],
          ['Bed temperature', 'TT-FG1090', '°C', 0]
        ]
      }
    ]
  });

  const burner = x => [
    C('FICDO1043' + x, 'Burner ' + x + ' oil valve', { tag: 'FCV-DO1043-' + x + '3' }),
    E('burner', 'Burner ' + x, '', [V('Oil', 'FT-DO1043-' + x, 't/h', 2), V('Air', 'pv:FICFA1043' + x, 't/h')], {
      on: 'v:FT-DO1043-' + x + '>0.05',
      lab: 'r'
    })
  ];
  page({
    id: 'oil-burners',
    group: 'Fuel',
    title: 'Start-up oil and burners',
    about: 'Diesel oil from the tank to the four start-up burners, with the return to the tank.',
    lanes: [
      {
        med: 'oil',
        label: 'Diesel oil supply',
        items: [
          E('tank', 'Diesel oil tank', 'T-0701', [V('Level', 'LT-DO0701', 'm', 2)], { w: 64, h: 84 }),
          [
            M('pump', 'DIESEL OIL PUMP A', 'Diesel oil pump A', [V('Current', 'IT-P0702A', 'A')], {
              tag: 'P-0702A · DITL-31',
              flow: 'm:DIESEL OIL PUMP A'
            }),
            M('pump', 'DIESEL OIL PUMP B', 'Diesel oil pump B', [V('Current', 'IT-P0702B', 'A')], {
              tag: 'P-0702B · DITL-31',
              flow: 'm:DIESEL OIL PUMP B'
            })
          ],
          E('header', 'Pump outlet', '', [V('Pressure', 'PT-DO0005', K)], { w: 10, h: 60 }),
          C('HICDO1012', 'Supply to burners', { tag: 'FCV-DO1012' }),
          ['A', 'B', 'C', 'D'].map(x => burner(x)[0]),
          ['A', 'B', 'C', 'D'].map(x => burner(x)[1])
        ]
      },
      {
        med: 'oil',
        w: 2.6,
        noline: true,
        label: 'Recirculation and return',
        items: [
          C('PICDO0005', 'Pump recirculation valve', { tag: 'PCV-DO0002', at: 22 }),
          C('PICDO1008', 'Oil return pressure valve', { tag: 'PCV-DO1009', at: 44 }),
          E('header', 'Oil return', '', [V('Pressure', 'PT-DO1008', K), V('Return valve', 'ZT-DO1009', '%')], {
            w: 60,
            h: 6,
            at: 66
          }),
          C('FIC-OM', 'Oil master', { sym: 'block', w: 90, h: 36, pv: 't/h', at: 86 })
        ]
      }
    ],
    loops: ['A', 'B', 'C', 'D'].map(x => ['FICFA1043' + x, 'Burner ' + x + ' air damper']),
    machines: ['A', 'B', 'C', 'D'].map(x => ['Burner ' + x, 'Burner ' + x + ' igniter and burner push buttons']),
    trends: [
      {
        title: 'Oil header',
        pens: [
          ['Pump outlet pressure', 'PT-DO0005', K],
          ['Return pressure', 'PT-DO1008', K],
          ['Tank level', 'LT-DO0701', 'm', 2]
        ]
      },
      { title: 'Burner oil flow', pens: ['A', 'B', 'C', 'D'].map(x => ['Burner ' + x, 'FT-DO1043-' + x, 't/h', 2]) }
    ]
  });

  page({
    id: 'limestone-sand',
    group: 'Fuel',
    title: 'Limestone and sand',
    about:
      'Limestone for sulphur capture and sand for the bed inventory, each blown into the furnace by its own system.',
    lanes: [
      {
        med: 'solid',
        label: 'Limestone',
        items: [
          E('bunker', 'Limestone silo', '', [V('Level', 'LT-LM1800', '%')], {
            w: 60,
            h: 80,
            level: ['LT-LM1800', 0, 100]
          }),
          M('rotary', 'L-1311', 'Limestone rotary feeder', [], { tag: 'L-1311' }),
          M(
            'block',
            'Limestone system',
            'Limestone injection system',
            [V('Line 1', 'PT-LM1811', K), V('Line 2', 'PT-LM1812', K)],
            { tag: 'filling cycle', w: 110, h: 40 }
          ),
          M('valve', 'XV-LM1811A ~ H', 'Limestone isolating valves', [], { kind: 'shutoff' }),
          L('furnace-gas', 'To furnace')
        ]
      },
      {
        med: 'solid',
        label: 'Sand',
        items: [
          E('bunker', 'Sand silo', '', [V('Level', 'LT-SD1800', '%')], { w: 60, h: 80, level: ['LT-SD1800', 0, 100] }),
          M('block', 'Sand system', 'Sand injection system', [V('Conveying pressure', 'PT-SD1800', K)], {
            tag: 'conveying cycle',
            w: 110,
            h: 40
          }),
          M('valve', 'XV-SD1802A / B', 'Sand isolating valves', [], { kind: 'shutoff' }),
          L('furnace-gas', 'To furnace')
        ]
      }
    ],
    trends: [
      {
        title: 'Silos and conveying',
        pens: [
          ['Limestone silo level', 'LT-LM1800', '%'],
          ['Sand silo level', 'LT-SD1800', '%'],
          ['Limestone line 2 pressure', 'PT-LM1812', K, 2]
        ]
      }
    ]
  });

  /* ================= AIR AND GAS ================= */
  page({
    id: 'combustion-air',
    group: 'Air and flue gas',
    title: 'Combustion air',
    about: 'Primary air to the furnace grid, secondary air to the furnace walls and fluidizing air to the seal pots.',
    lanes: [
      {
        med: 'air',
        label: 'Primary air',
        flow: 'm:PAF',
        items: [
          M('fan', 'PAF', 'Primary air fan', [V('Current', 'IT-F1053', 'A'), V('Outlet', 'PT-FA1075', 'mmH₂O', 0)], {
            tag: 'F-1053 · DITL-26A'
          }),
          C('FICFA1071', 'Primary air flow damper', { sym: 'damper', tag: 'MCV-FA1053-1', pv: 't/h' }),
          E('bank', 'Air preheater, primary air side', '', [V('Air out', 'TT-FA1076', '°C', 0)], { med: 'hotair' }),
          E('header', 'Hot primary air', '', [V('Flow', 'FT-FA1079', 't/h')], { w: 10, h: 40, med: 'hotair' }),
          L('furnace-gas', 'To furnace grid')
        ]
      },
      {
        med: 'air',
        label: 'Secondary air',
        flow: 'm:SAF',
        items: [
          M('fan', 'SAF', 'Secondary air fan', [V('Current', 'IT-F1054', 'A'), V('Outlet', 'PT-FA1085', 'mmH₂O', 0)], {
            tag: 'F-1054 · DITL-27A'
          }),
          C('FICFA1081', 'Secondary air flow damper', { sym: 'damper', tag: 'MCV-FA1054-1', pv: 't/h' }),
          E('bank', 'Air preheater, secondary air side', '', [V('Air out', 'TT-FA1087', '°C', 0)], { med: 'hotair' }),
          E('header', 'Hot secondary air', '', [V('Pressure', 'PT-FA1088', 'mmH₂O', 0)], {
            w: 10,
            h: 40,
            med: 'hotair'
          }),
          L('furnace-gas', 'To furnace walls')
        ]
      },
      {
        med: 'air',
        label: 'Fluidizing air',
        items: [
          [
            M('blower', 'FA BLOWER-A', 'Fluidizing air blower A', [V('Current', 'IT-F1055A', 'A')], {
              tag: 'F-1055A · DITL-28A',
              flow: 'm:FA BLOWER-A'
            }),
            M('blower', 'FA BLOWER-B', 'Fluidizing air blower B', [V('Current', 'IT-F1055B', 'A')], {
              tag: 'F-1055B · DITL-28A',
              flow: 'm:FA BLOWER-B'
            })
          ],
          [
            C('FICFA1055A', 'Blower A inlet damper', { sym: 'damper', tag: 'FCV-FA1055-A1' }),
            C('FICFA1055B', 'Blower B inlet damper', { sym: 'damper', tag: 'FCV-FA1055-B1' })
          ],
          [X('XV-FA1055-A3', 'Blower A outlet valve'), X('XV-FA1055-B3', 'Blower B outlet valve')],
          E('header', 'Fluidizing air header', '', [V('Flow', 'FT-FA1055', 't/h')], { w: 10, h: 60 }),
          L('furnace-gas', 'To seal pots')
        ]
      }
    ],
    loops: [['AICFG112', 'Oxygen trim']],
    machines: [
      ['PAF LUBE OIL PUMP A', 'Primary air fan lube oil pump A'],
      ['PAF LUBE OIL PUMP B', 'Primary air fan lube oil pump B']
    ],
    valves: [
      ['XV-FA1055-A2', 'Blower A surge valve (to silencer)'],
      ['XV-FA1055-B2', 'Blower B surge valve (to silencer)']
    ],
    trends: [
      {
        title: 'Air flows',
        pens: [
          ['Primary air', 'pv:FICFA1071', 't/h'],
          ['Secondary air', 'pv:FICFA1081', 't/h'],
          ['Fluidizing air', 'FT-FA1055', 't/h'],
          ['Total air', 'ABC-002|SI0060', 't/h']
        ]
      },
      {
        title: 'Fans',
        pens: [
          ['Primary air fan current', 'IT-F1053', 'A'],
          ['Secondary air fan current', 'IT-F1054', 'A'],
          ['Oxygen', 'AT-FG1122', '%']
        ]
      }
    ]
  });

  page({
    id: 'furnace-gas',
    group: 'Air and flue gas',
    title: 'Furnace and flue gas',
    about: 'From the bed through the cyclones, the back pass, the air preheater and the precipitator to the stack.',
    lanes: [
      {
        med: 'gas',
        label: 'Flue gas',
        flow: 'm:IDF',
        items: [
          E(
            'furnace',
            'Furnace',
            '',
            [
              V('Pressure', 'PT-FG1085', 'mmH₂O', 0),
              V('Upper', 'TT-FG1091', '°C', 0),
              V('Bed', 'TT-FG1090', '°C', 0),
              V('Across bed', 'DPT-FG1081', 'mmH₂O', 0)
            ],
            { w: 84, h: 250 }
          ),
          E(
            'cyclone',
            'Cyclones A and B',
            '',
            [V('Outlet A', 'TT-FG1009-A', '°C', 0), V('Outlet B', 'TT-FG1009-B', '°C', 0)],
            { w: 60, h: 130, pin: 'l', pout: 'r' }
          ),
          [
            E('bank', 'Reheater pass', '', [], { w: 74, h: 38 }),
            E('bank', 'Superheater pass', '', [V('Gas in', 'TT-FG1095-A', '°C', 0)], { w: 74, h: 38 })
          ],
          [
            C('HICHR1002A', 'Reheater pass damper', { sym: 'damper', tag: 'TCV-FG1116A-D' }),
            C('HICHR1002B', 'Superheater pass damper', { sym: 'damper', tag: 'TCV-FG1117A-D' })
          ],
          E('bank', 'Economizer', '', [V('Gas out', 'TT-FG1110', '°C', 0)], { w: 70, h: 38 }),
          M(
            'airheater',
            'AIR PREHEATER',
            'Air preheater',
            [V('Gas in', 'TT-FG1124', '°C', 0), V('Gas out', 'TT-FG1132', '°C', 0), V('Oxygen', 'AT-FG1122', '%')],
            { tag: 'H-1052 · DITL-43', r: 34 }
          ),
          M('precipitator', 'ESP', 'Electrostatic precipitator', [V('Outlet', 'PT-FG1141-A', 'mmH₂O', 0)], {
            tag: 'five fields',
            w: 96,
            h: 56,
            fields: 5
          }),
          M(
            'fan',
            'IDF',
            'Induced draft fan',
            [V('Current', 'IT-F1056', 'A'), V('Coupling', 'mv:PICFG108', '%'), V('Inlet damper', 'mv:PICFG108A', '%')],
            { tag: 'F-1056 · DITL-25A' }
          ),
          E('stack', 'Stack', '', [V('Gas', 'TT-FG1152', '°C', 0), V('Sulphur oxides', 'AT-FG1057-1', 'ppm', 0)], {
            w: 26,
            h: 190
          })
        ]
      }
    ],
    loops: [
      ['PICFG108', 'Furnace pressure (ID fan coupling)'],
      ['PICFG108A', 'Furnace pressure (ID fan inlet damper)'],
      ['TICHR1002A', 'Reheater outlet temperature (gas dampers)'],
      ['AICFG112', 'Oxygen trim']
    ],
    trends: [
      {
        title: 'Furnace',
        pens: [
          ['Furnace pressure', 'PT-FG1085', 'mmH₂O', 0],
          ['Bed temperature', 'TT-FG1090', '°C', 0],
          ['Upper furnace', 'TT-FG1091', '°C', 0],
          ['Bed pressure drop', 'DPT-FG1081', 'mmH₂O', 0]
        ]
      },
      {
        title: 'Gas path',
        pens: [
          ['Cyclone outlet A', 'TT-FG1009-A', '°C', 0],
          ['Economizer gas out', 'TT-FG1110', '°C', 0],
          ['Air preheater gas out', 'TT-FG1132', '°C', 0],
          ['ID fan current', 'IT-F1056', 'A']
        ]
      }
    ]
  });

  page({
    id: 'bottom-ash',
    group: 'Air and flue gas',
    title: 'Bottom ash',
    about: 'Four water cooled screw coolers drain the bed and hold the bed pressure drop.',
    lanes: [
      {
        med: 'ash',
        label: 'Bottom ash',
        items: [
          E(
            'furnace',
            'Furnace bed',
            '',
            [V('Bed pressure drop', 'DPT-FG1081', 'mmH₂O', 0), V('Second transmitter', 'DPT-FG1082', 'mmH₂O', 0)],
            { w: 84, h: 200 }
          ),
          ['A', 'B', 'C', 'D'].map(x =>
            M('screw', 'ASH COOLER ' + x, 'Ash cooler ' + x, [], {
              tag: 'L-1060' + x + ' · DITL-21A',
              w: 110,
              flow: 'm:ASH COOLER ' + x
            })
          ),
          E('conveyor', 'Ash conveyors', '', [], { w: 110 }),
          E('bunker', 'Bottom ash silo', '', [V('Level', 'LT-BH1750', '')], { w: 64, h: 90 })
        ]
      }
    ],
    loops: [
      ['DPICFG108', 'Furnace bed pressure drop'],
      ['SICL1060A', 'Ash cooler screw speed']
    ],
    trends: [
      {
        title: 'Bed inventory',
        pens: [
          ['Bed pressure drop', 'pv:DPICFG108', 'mmH₂O', 0],
          ['Set point', 'sv:DPICFG108', 'mmH₂O', 0],
          ['Screw speed', 'pv:SICL1060A', 'rpm', 2]
        ]
      }
    ]
  });

  const SB = [
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38'
  ];
  page({
    id: 'sootblowers',
    group: 'Air and flue gas',
    title: 'Sootblowers',
    about: 'Steam from the superheater to 28 furnace and back pass sootblowers and 2 air preheater sootblowers.',
    lanes: [
      {
        med: 'steam',
        label: 'Sootblowing steam',
        flow: 'l:PICSB1052',
        items: [
          L('drum-steam', 'From superheater', { back: true }),
          C('PICSB1052', 'Sootblower steam pressure valve', { tag: 'PCV-SB1053' }),
          E(
            'header',
            'Sootblower steam header',
            '',
            [V('Pressure', 'PT-SB1052', K), V('Drain A', 'TT-SB1056', '°C', 0), V('Drain B', 'TT-SB1057', '°C', 0)],
            { w: 10, h: 70 }
          ),
          [
            E('block', 'Furnace and back pass sootblowers', 'N-1011 to N-1038', [], { w: 150, h: 40 }),
            E(
              'block',
              'Air preheater sootblowers',
              'N-1040 and N-1042',
              [V('Steam A', 'PT-SB1040', K), V('Steam B', 'PT-SB1042', K)],
              { w: 150, h: 40 }
            )
          ]
        ]
      }
    ],
    machines: SB.map(n => ['N-10' + n, 'Sootblower N-10' + n]).concat([
      ['N-1040', 'Air preheater sootblower N-1040'],
      ['N-1042', 'Air preheater sootblower N-1042']
    ]),
    trends: [
      {
        title: 'Sootblowing steam',
        pens: [
          ['Header pressure', 'PT-SB1052', K],
          ['Drain A temperature', 'TT-SB1056', '°C', 0],
          ['Drain B temperature', 'TT-SB1057', '°C', 0]
        ]
      }
    ]
  });

  /* ================= WATER AND STEAM ================= */
  page({
    id: 'condensate',
    group: 'Water and steam',
    title: 'Condensate',
    about: 'From the condenser hotwell through the condensate pumps and the low pressure heaters to the deaerator.',
    lanes: [
      {
        med: 'condensate',
        label: 'Condensate',
        items: [
          E(
            'condenser',
            'Condenser',
            'H-1110',
            [V('Pressure', 'PTCD1110', 'kg/cm² abs', 3), V('Hotwell level', 'LTCD1110', 'mm', 0)],
            { w: 120, h: 70, pout: 'hr' }
          ),
          [
            M('pump', 'CEP-A', 'Condensate pump A', [V('Current', 'ITP1116A', 'A')], {
              tag: 'P-1116A',
              flow: 'm:CEP-A'
            }),
            M('pump', 'CEP-B', 'Condensate pump B', [V('Current', 'ITP1116B', 'A')], {
              tag: 'P-1116B',
              flow: 'm:CEP-B'
            })
          ],
          E('header', 'Pump discharge', '', [V('Pressure', 'PTCD1117', K), V('Flow', 'FTCD1120', 't/h')], {
            w: 10,
            h: 60
          }),
          C('LICCD1104', 'Deaerator level valve', { tag: 'LCV-CD1104' }),
          X('MV-CD1001', 'Heater inlet valve'),
          E(
            'heater',
            'Low pressure heaters 1 to 3',
            '',
            [
              V('After heater 1', 'TT-CD1101', '°C', 0),
              V('After heater 2', 'TT-CD1102', '°C', 0),
              V('After heater 3', 'TT-CD1103-2', '°C', 0)
            ],
            { w: 110, h: 40 }
          ),
          X('MV-CD1002', 'Heater outlet valve'),
          L('feedwater', 'To deaerator')
        ]
      },
      {
        med: 'condensate',
        noline: true,
        label: 'Around the main line',
        items: [
          C('LICCD1110A', 'Hotwell make-up valve', { tag: 'LCV-MU1110' }),
          C('LICCD1110B', 'Hotwell dump valve', { tag: 'LCV-CD1110' }),
          C('FICCD1120', 'Pump minimum flow valve', { tag: 'FCV-CD1120' }),
          C('FICCD1121', 'Polisher bypass valve', { tag: 'FCV-CD1121' }),
          X('MV-MU1001', 'Make-up to hotwell'),
          X('MV-CD1003', 'Heater bypass valve')
        ]
      }
    ],
    valves: [
      ['MV-CD1007', 'Polisher inlet valve'],
      ['MV-CD1008', 'Polisher outlet valve'],
      ['XV-CD1004', 'Flash chamber spray (normal)'],
      ['XV-CD1005', 'Flash chamber spray'],
      ['XV-CD1006', 'Curtain spray'],
      ['XV-CD1114', 'LP bypass spray block valve']
    ],
    trends: [
      {
        title: 'Hotwell and deaerator',
        pens: [
          ['Hotwell level', 'LTCD1110', 'mm', 0],
          ['Condensate flow', 'FTCD1120', 't/h'],
          ['Deaerator level', 'LTCD11041', 'mm', 0],
          ['Level valve output', 'mv:LICCD1104', '%']
        ]
      },
      {
        title: 'Vacuum and temperatures',
        pens: [
          ['Condenser pressure', 'PTCD1110', 'kg/cm² abs', 3],
          ['After heater 3', 'TT-CD1103-2', '°C', 0],
          ['Pump discharge pressure', 'PTCD1117', K]
        ]
      }
    ]
  });

  page({
    id: 'feedwater',
    group: 'Water and steam',
    title: 'Feedwater',
    about: 'From the deaerator through the boiler feed pumps and the high pressure heaters to the economizer.',
    lanes: [
      {
        med: 'water',
        label: 'Feedwater',
        items: [
          E(
            'deaerator',
            'Deaerator',
            'H-1104 / T-1104',
            [V('Level', 'LT-CD1104-1', 'mm', 0), V('Pressure', 'PT-CD1104', K, 2)],
            { w: 130, h: 38, pout: 'br' }
          ),
          [
            M('pump', 'BFWP-A', 'Boiler feed pump A', [V('Current', 'IT-P1115A', 'A')], {
              tag: 'P-1115A · DITL-23A',
              flow: 'm:BFWP-A'
            }),
            M('pump', 'BFWP-B', 'Boiler feed pump B', [V('Current', 'IT-P1115B', 'A')], {
              tag: 'P-1115B · DITL-23A',
              flow: 'm:BFWP-B'
            })
          ],
          [
            X('MV-FW1001', 'Pump A discharge valve', { flow: 'm:BFWP-A' }),
            X('MV-FW1002', 'Pump B discharge valve', { flow: 'm:BFWP-B' })
          ],
          E('header', 'Discharge header', '', [V('Pressure', 'PT-FW1011', K), V('Temperature', 'TT-FW1011', '°C', 0)], {
            w: 10,
            h: 60
          }),
          E(
            'heater',
            'High pressure heater 1',
            '',
            [V('Outlet', 'TT-FW1105', '°C', 0), V('Level', 'LT-HD1105-1', 'mm', 0)],
            { w: 96, h: 38 }
          ),
          E(
            'heater',
            'High pressure heater 2',
            '',
            [V('Outlet', 'TT-FW1106', '°C', 0), V('Level', 'LT-HD1106-1', 'mm', 0)],
            { w: 96, h: 38 }
          ),
          [
            C('FICFW1007', 'Main feedwater valve', { tag: 'FCV-FW1130-1', pv: 't/h' }),
            C('LICBR1001B', 'Start-up feedwater valve', { tag: 'FCV-FW1130-2' })
          ],
          L('drum-steam', 'To economizer')
        ]
      },
      {
        med: 'water',
        noline: true,
        label: 'Spray water and heater drains',
        items: [
          C('LICHD11051', 'Heater 1 drain valve', { tag: 'LCV-HD1105-1' }),
          C('LICHD11061', 'Heater 2 drain valve', { tag: 'LCV-HD1106-1' }),
          C('TICBR1130', 'Superheater spray 1 valve', { tag: 'TCV-FW1110' }),
          C('TICBR1150', 'Superheater spray 2 valve', { tag: 'TCV-FW1120' }),
          C('TICHR1002', 'Reheater spray valve', { tag: 'TCV-FW1150' }),
          C('TICMS1022', 'HP bypass spray valve', { tag: 'TCV-FW1060' })
        ]
      }
    ],
    loops: [
      ['LICBR1001', 'Drum level, three element (master)'],
      ['LICBR1001A', 'Drum level, single element']
    ],
    valves: [
      ['MV-FW1391', 'Pump A discharge bypass'],
      ['MV-FW1392', 'Pump B discharge bypass'],
      ['XV-FW1111-1', 'Spray 1 block valve (1)'],
      ['XV-FW1111-2', 'Spray 1 block valve (2)'],
      ['XV-FW1121-1', 'Spray 2 block valve (1)'],
      ['XV-FW1121-2', 'Spray 2 block valve (2)']
    ],
    trends: [
      {
        title: 'Drum level, three element control',
        pens: [
          ['Drum level', 'pv:LICBR1001B', 'mm', 0],
          ['Feedwater flow', 'pv:FICFW1007', 't/h'],
          ['Main steam flow', 'FT-MS1031', 't/h'],
          ['Main valve output', 'mv:FICFW1007', '%']
        ]
      },
      {
        title: 'Feed pumps and heaters',
        pens: [
          ['Discharge pressure', 'PT-FW1011', K],
          ['Pump A current', 'IT-P1115A', 'A'],
          ['Heater 2 outlet', 'TT-FW1106', '°C', 0],
          ['Deaerator level', 'LT-CD1104-1', 'mm', 0]
        ]
      }
    ]
  });

  page({
    id: 'drum-steam',
    group: 'Water and steam',
    title: 'Drum and superheaters',
    about:
      'Feedwater becomes main steam: economizer, drum, three superheater stages with two sprays, then the turbine.',
    lanes: [
      {
        med: 'steam',
        label: 'Water and steam',
        items: [
          L('feedwater', 'From feedwater', { back: true, med: 'water' }),
          E('bank', 'Economizer', '', [V('Inlet', 'TT-FW1160', '°C', 0)], { w: 70, h: 38, med: 'water' }),
          E('drum', 'Steam drum', 'T-1001', [V('Pressure', 'PT-BR1001-1', K), V('Level', 'pv:LICBR1001B', 'mm', 0)], {
            w: 126,
            h: 42
          }),
          E('bank', 'Superheater 1', '', [], { w: 66, h: 38 }),
          E('spray', 'Spray 1', '', [V('Water', 'FT-FW1109', 't/h'), V('After', 'TT-BR1130-1', '°C', 0)]),
          E('bank', 'Superheater 2', '', [V('Outlet', 'TT-BR1140-1', '°C', 0)], { w: 66, h: 38 }),
          E('spray', 'Spray 2', '', [V('Water', 'FT-FW1119', 't/h'), V('After', 'TT-BR1150-1', '°C', 0)]),
          E(
            'bank',
            'Final superheater',
            '',
            [V('Main steam', 'pv:TICMS1004', '°C', 0), V('Pressure', 'PT-MS1002', K), V('Flow', 'FT-MS1031', 't/h')],
            { w: 70, h: 38 }
          ),
          X('MV-MS1391', 'Main steam stop valve'),
          L('turbine', 'To turbine')
        ]
      },
      {
        med: 'steam',
        noline: true,
        label: 'Blow-off, blowdown and drains',
        items: [
          C('PICMS1002', 'Main steam blow-off valve', { tag: 'PCV-MS1001' }),
          C('HICBR1391', 'Superheater steam to reheater inlet', { tag: 'MV-BR1391' }),
          X('MV-BD1002', 'Continuous blowdown'),
          X('MV-BD1001', 'Intermittent blowdown'),
          X('MV-MS1392', 'Main steam stop bypass'),
          X('XV-MS1011', 'Main steam drain pot')
        ]
      }
    ],
    loops: [
      ['TICBR1140', 'Superheater 2 outlet temperature (spray 1 master)'],
      ['TICMS1004', 'Main steam temperature (spray 2 master)'],
      ['TICBR1130', 'Superheater spray 1'],
      ['TICBR1150', 'Superheater spray 2'],
      ['LICBR1001', 'Drum level, three element (master)']
    ],
    machines: [['V-BD1005 ~ V-BD1021', 'Lower ring header drains (manual, field)']],
    trends: [
      {
        title: 'Main steam',
        pens: [
          ['Main steam temperature', 'pv:TICMS1004', '°C', 0],
          ['Main steam pressure', 'PT-MS1002', K],
          ['Main steam flow', 'FT-MS1031', 't/h']
        ]
      },
      {
        title: 'Superheater temperatures',
        pens: [
          ['After spray 1', 'TT-BR1130-1', '°C', 0],
          ['Superheater 2 outlet', 'TT-BR1140-1', '°C', 0],
          ['After spray 2', 'TT-BR1150-1', '°C', 0],
          ['Spray 1 water', 'FT-FW1109', 't/h']
        ]
      },
      {
        title: 'Drum',
        pens: [
          ['Drum pressure', 'PT-BR1001-1', K],
          ['Drum level', 'pv:LICBR1001B', 'mm', 0]
        ]
      }
    ]
  });

  page({
    id: 'reheat-bypass',
    group: 'Water and steam',
    title: 'Reheat and turbine bypass',
    about:
      'Cold reheat from the high pressure turbine, the reheater and the hot reheat to the turbine, with both bypasses.',
    lanes: [
      {
        med: 'reheat',
        label: 'Reheat steam',
        items: [
          E(
            'turbine',
            'High pressure turbine',
            '',
            [V('Exhaust', 'PT-MS1021', K), V('Temperature', 'TT-MS1022-1', '°C', 0)],
            { w: 64, h: 54 }
          ),
          E('header', 'Cold reheat line', '', [V('Pressure', 'PT-CR1003', K), V('Temperature', 'TT-CR1004', '°C', 0)], {
            id: 'crh',
            w: 60,
            h: 6
          }),
          E('spray', 'Reheater spray', '', [V('Water', 'FT-FW1149', 't/h')]),
          E('bank', 'Reheater', '', [V('Inlet', 'TT-CR1005-1', '°C', 0), V('Outlet', 'TT-HR1002-1', '°C', 0)], {
            w: 80,
            h: 40
          }),
          E(
            'header',
            'Hot reheat line',
            '',
            [V('Pressure', 'PT-HR1003-1', K), V('Temperature', 'TT-HR1004', '°C', 0)],
            { id: 'hrh', w: 60, h: 6 }
          ),
          E('turbine', 'Intermediate and low pressure turbine', '', [], { w: 90, h: 64 }),
          L('condensate', 'To condenser')
        ]
      },
      {
        med: 'steam',
        label: 'Turbine bypass',
        cut: [1],
        items: [
          L('drum-steam', 'Main steam', { back: true, at: 4 }),
          C('PICMS1006', 'High pressure bypass valve', { id: 'hpb', tag: 'PCV-MS1020', at: 14 }),
          C('PICHR1003', 'Low pressure bypass valve', { id: 'lpb', tag: 'PCV-HR1010', at: 74, med: 'reheat' }),
          L('condensate', 'To condenser', { at: 93 })
        ]
      },
      {
        med: 'reheat',
        noline: true,
        label: 'Sprays, vent and drains',
        items: [
          C('TICMS1022', 'HP bypass spray valve', { tag: 'TCV-FW1060' }),
          C('TICHR1002', 'Reheater spray valve', { tag: 'TCV-FW1150' }),
          C('TICHR1012', 'LP bypass spray valve', { tag: 'TCV-CD1115' }),
          C('PICHR1391', 'Reheater start-up vent valve', { tag: 'MV-HR1391' }),
          X('XV-CR1011', 'Cold reheat drain pot'),
          X('XV-HR1021', 'Hot reheat drain pot')
        ]
      }
    ],
    joins: [
      { from: 'hpb.r', to: 'crh.b', med: 'steam', via: 'hv', flow: 'l:PICMS1006' },
      { from: 'hrh.b', to: 'lpb.l', med: 'reheat', via: 'vh', flow: 'l:PICHR1003' }
    ],
    loops: [
      ['TICHR1002A', 'Reheater outlet temperature (gas dampers)'],
      ['HICHR1002A', 'Reheater pass damper'],
      ['HICHR1002B', 'Superheater pass damper']
    ],
    trends: [
      {
        title: 'Reheat steam',
        pens: [
          ['Hot reheat temperature', 'TT-HR1002-1', '°C', 0],
          ['Hot reheat pressure', 'PT-HR1003-1', K],
          ['Cold reheat temperature', 'TT-CR1004', '°C', 0]
        ]
      },
      {
        title: 'Bypass valves',
        pens: [
          ['HP bypass output', 'mv:PICMS1006', '%'],
          ['LP bypass output', 'mv:PICHR1003', '%'],
          ['Reheater spray output', 'mv:TICHR1002', '%']
        ]
      }
    ]
  });

  const EXT = [
    ['1', 'High pressure heater 2', 'TT-TS1011', '°C', 0, 'Temperature'],
    ['2', 'High pressure heater 1', 'PT-TS1013', K, 2, 'Pressure'],
    ['3', 'Deaerator', 'PT-TS1017', K, 2, 'Pressure'],
    ['4', 'Low pressure heater 3', 'PT-TS1022', K, 2, 'Pressure'],
    ['5', 'Low pressure heater 2', 'PT-TS1026', K, 2, 'Pressure']
  ];
  page({
    id: 'extraction',
    group: 'Water and steam',
    title: 'Extraction steam',
    about:
      'Five extractions from the turbine heat the feedwater. Each has a shut-off valve and drains to the flash chamber.',
    lanes: [
      {
        med: 'steam',
        label: 'Extraction steam',
        items: [
          E('turbine', 'Turbine', 'cold reheat for extraction 1', [], { w: 80, h: 210 }),
          EXT.map(e => X('MV-TS100' + e[0], 'Extraction ' + e[0] + ' shut-off valve', { flow: 'x:MV-TS100' + e[0] })),
          EXT.map(e =>
            E(e[1] === 'Deaerator' ? 'deaerator' : 'heater', e[1], '', [V(e[5], e[2], e[3], e[4])], {
              w: 100,
              h: 30,
              lab: 'r'
            })
          )
        ]
      }
    ],
    valves: [
      ['MV-TS1391', 'Extraction 1 drain valve'],
      ['MV-TS1397', 'Extraction 1 drain valve (2)'],
      ['MV-TS1392', 'Extraction 2 drain valve'],
      ['MV-TS1396', 'Extraction 2 drain valve (2)'],
      ['MV-TS1393', 'Extraction 3 drain valve'],
      ['MV-TS1399', 'Extraction 3 drain valve (2)'],
      ['MV-TS1398', 'Extraction 3 drain valve (3)'],
      ['MV-TS1400', 'Extraction 3 drain valve (4)'],
      ['MV-TS1394', 'Extraction 4 drain valve'],
      ['MV-TS1390', 'Extraction 4 drain valve (2)'],
      ['MV-TS1395', 'Extraction 5 drain valve'],
      ['MV-TS1389', 'Extraction 5 drain valve (2)'],
      ['XV-FS1005', 'Flash pipe drain valve']
    ],
    notes: [[26, -10, 'Low pressure heater 1 sits in the condenser neck and has no shut-off valve.']],
    trends: [
      {
        title: 'Extraction pressures',
        pens: [
          ['Extraction 2', 'PT-TS1013', K, 2],
          ['Extraction 3', 'PT-TS1017', K, 2],
          ['Extraction 4', 'PT-TS1022', K, 2],
          ['Extraction 1 temperature', 'TT-TS1011', '°C', 0]
        ]
      }
    ]
  });

  page({
    id: 'aux-steam',
    group: 'Water and steam',
    title: 'Auxiliary steam and gland seal',
    about: 'Auxiliary steam from main steam or cold reheat to the deaerator, the ejectors and the turbine gland seal.',
    lanes: [
      {
        med: 'steam',
        label: 'Auxiliary steam',
        items: [
          X('MV-AS1391', 'Main steam to auxiliary steam'),
          C('PICAS1004', 'Auxiliary steam pressure valve', { tag: 'PCV-AS1010', pv: K }),
          E('spray', 'Desuperheater', '', [V('Spray valve', 'mv:TICAS1001', '%')]),
          E(
            'header',
            'Auxiliary steam header',
            '',
            [V('Pressure', 'PT-AS1004', K), V('Temperature', 'TT-AS1003', '°C', 0)],
            { id: 'hdr', w: 10, h: 150 }
          ),
          [
            C('PICCD1104', 'Deaerator pegging steam valve', { tag: 'PCV-AS1030' }),
            X('MV-AS1396', 'Steam to air ejectors'),
            X('MV-AS1395', 'Steam to start-up ejector'),
            M('valve', 'GLAND STEAM SEAL', 'Gland steam seal valve', [V('Gland steam', 'PTGS10011', K, 2)], {
              kind: 'control',
              tag: 'PV-GS1031'
            })
          ]
        ]
      },
      {
        med: 'reheat',
        label: 'From cold reheat',
        items: [
          L('reheat-bypass', 'Cold reheat steam', { back: true, at: 12 }),
          C('PICAS1005', 'Cold reheat to auxiliary steam valve', { id: 'crv', tag: 'PCV-AS1020', at: 36, pv: K })
        ]
      },
      {
        med: 'steam',
        noline: true,
        label: 'Sprays, vacuum and drains',
        items: [
          C('TICAS1001', 'Auxiliary steam spray valve', { tag: 'TCV-CD1124' }),
          C('TICAS1017', 'Gland steam spray valve', { tag: 'TCV-CD1126' }),
          M('valve', 'LP EXHAUST HOOD SPRAY', 'Exhaust hood spray valve', [], { kind: 'control', tag: 'FV-CD1904' }),
          X('MV-AV1391', 'Condenser vacuum breaker'),
          X('MV-AS1392', 'Header drain valve'),
          X('MV-AS1394', 'Turbine warming line drain')
        ]
      }
    ],
    joins: [{ from: 'crv.r', to: 'hdr.b', med: 'reheat', via: 'hv', flow: 'l:PICAS1005' }],
    valves: [
      ['XV-CD1123', 'Auxiliary steam spray block valve'],
      ['XV-CD1125', 'Gland steam spray block valve'],
      ['MV-AS1393', 'Gland steam drain separator drain']
    ],
    trends: [
      {
        title: 'Auxiliary steam header',
        pens: [
          ['Header pressure', 'PT-AS1004', K],
          ['Header temperature', 'TT-AS1003', '°C', 0],
          ['Pressure valve output', 'mv:PICAS1005', '%']
        ]
      },
      {
        title: 'Gland steam and vacuum',
        pens: [
          ['Gland steam pressure', 'PTGS10011', K, 2],
          ['Gland steam temperature', 'TEGS1002', '°C', 0],
          ['Condenser pressure', 'PT-CD1110', 'kg/cm² abs', 3]
        ]
      }
    ]
  });

  const an = (name, list, at) =>
    E(
      'analyzer',
      name,
      '',
      list.map(a => V(a[0], a[1], a[2] || '', a[3] == null ? 1 : a[3])),
      { lab: 'r', wrap: 26, at }
    );
  page({
    id: 'sampling',
    group: 'Water and steam',
    title: 'Sampling and chemical dosing',
    about: 'Water and steam quality at seven sample points, and the three chemical dosing skids.',
    lanes: [
      {
        med: 'drain',
        w: 2,
        noline: true,
        label: 'Sample points',
        items: [
          [
            an(
              'Condensate pump outlet',
              [
                ['pH', 'AT-SP1001'],
                ['Cation conductivity', 'AT-SP1002', 'µS/cm', 3]
              ],
              5
            ),
            an('Deaerator upstream', [
              ['pH', 'AT-SP1003'],
              ['Specific conductivity', 'AT-SP1004', 'ppb'],
              ['Cation conductivity', 'AT-SP1005', 'µS/cm', 3]
            ])
          ],
          [
            an(
              'Deaerator outlet',
              [
                ['pH', 'AT-SP1006'],
                ['Dissolved oxygen', 'AT-SP1007', 'ppb']
              ],
              29
            ),
            an('Economizer inlet', [
              ['pH', 'AT-SP1009'],
              ['Specific conductivity', 'AT-SP1010', 'ppb']
            ])
          ],
          [
            an(
              'Drum water',
              [
                ['pH', 'AT-SP1011'],
                ['Conductivity', 'AT-SP1012', 'µS/cm']
              ],
              53
            ),
            an('Saturated steam', [
              ['Cation conductivity', 'AT-SP1016'],
              ['Sodium', 'AT-SP1020', 'ppb']
            ])
          ],
          [
            an(
              'Main steam',
              [
                ['Cation conductivity 1', 'AT-SP1018', 'µS/cm', 3],
                ['Cation conductivity 2', 'AT-SP1019', 'µS/cm', 3]
              ],
              77
            )
          ]
        ]
      },
      {
        med: 'drain',
        w: 2.6,
        label: 'Chemical dosing',
        items: [
          [
            E('tank', 'Tri-sodium phosphate tank', 'Z-1101 · 200 L', [], { w: 50, h: 56, lab: 'l' }),
            E('tank', 'Neutral amine tank', 'Z-1103 · 200 L', [], { w: 50, h: 56, lab: 'l' }),
            E('tank', 'Carbohydrazide tank', 'Z-1105 · 100 L', [], { w: 50, h: 56, lab: 'l' })
          ],
          [
            M('pump', 'Z-1107A', 'Phosphate dosing pump A', [], { r: 13, tag: 'Z-1107A' }),
            M('pump', 'Z-1108A', 'Amine dosing pump A', [], { r: 13, tag: 'Z-1108A' }),
            M('pump', 'Z-1109A', 'Carbohydrazide dosing pump A', [], { r: 13, tag: 'Z-1109A' })
          ],
          [
            M('pump', 'Z-1107B', 'Phosphate dosing pump B', [], { r: 13, tag: 'Z-1107B' }),
            M('pump', 'Z-1108B', 'Amine dosing pump B', [], { r: 13, tag: 'Z-1108B' }),
            M('pump', 'Z-1109B', 'Carbohydrazide dosing pump B', [], { r: 13, tag: 'Z-1109B' })
          ],
          [L('drum-steam', 'To economizer inlet'), L('condensate', 'To condensate'), L('feedwater', 'To deaerator')]
        ]
      }
    ],
    machines: [['Z-1101', 'Phosphate tank agitator']],
    trends: [
      {
        title: 'Water quality',
        pens: [
          ['Condensate pH', 'AT-SP1001', ''],
          ['Drum water pH', 'AT-SP1011', ''],
          ['Drum water conductivity', 'AT-SP1012', 'µS/cm'],
          ['Main steam cation conductivity', 'AT-SP1018', 'µS/cm', 3]
        ]
      }
    ]
  });

  /* ================= TURBINE AND GENERATOR ================= */
  page({
    id: 'turbine',
    group: 'Turbine and generator',
    title: 'Turbine',
    about:
      'Main steam through the control valves and the high pressure turbine, hot reheat through the intercept valves to the generator.',
    lanes: [
      {
        med: 'steam',
        label: 'Steam path',
        cut: [5],
        items: [
          L('drum-steam', 'Main steam', { back: true }),
          E('valve', 'Control valves', '', [V('Position', 'ZI-CV', '%'), V('Inlet pressure', 'PT-MS1006-1', K)], {
            kind: 'control',
            on: 'v:ZI-CV>1'
          }),
          E('turbine', 'High pressure turbine', '', [V('Exhaust', 'PT-MS1021', K)], { w: 70, h: 56 }),
          L('reheat-bypass', 'Reheater'),
          E('valve', 'Intercept valves', '', [V('Position', 'ZI-ICV', '%')], {
            kind: 'control',
            on: 'v:ZI-ICV>1',
            med: 'reheat'
          }),
          E(
            'turbine',
            'Intermediate and low pressure turbine',
            '',
            [V('Speed', 'SI-TB', 'rpm', 0), V('Exhaust hood', 'TT-HOOD', '°C', 0)],
            { id: 'lp', w: 110, h: 72 }
          ),
          E('generator', 'Generator', '', [V('Load', 'GCP-AI1001', 'MW')], { id: 'gen', w: 84, h: 54, go: 'generator' })
        ]
      },
      {
        med: 'condensate',
        noline: true,
        label: 'Condenser and supervision',
        items: [
          E('analyzer', 'Shaft vibration', 'highest of all bearings', [V('Vibration', 'VIST-MAX', 'mm', 3)], {
            at: 14
          }),
          E('analyzer', 'Thrust bearing', '', [V('Front', 'TIST-THF', '°C', 0), V('Rear', 'TIST-THR', '°C', 0)], {
            at: 32
          }),
          E('analyzer', 'Bearing oil', '', [V('Pressure', 'PT-BRG', K), V('Cooler outlet', 'TT-LOCOOL', '°C', 0)], {
            at: 50,
            go: 'turbine-oil'
          }),
          E('condenser', 'Condenser', '', [V('Pressure', 'PT-CD', 'kg/cm² abs', 3)], {
            id: 'cd',
            w: 110,
            h: 60,
            at: 77.5,
            go: 'condensate'
          })
        ]
      }
    ],
    joins: [
      { from: 'lp.r', to: 'gen.l', med: 'power', w: 3 },
      { from: 'lp.b', to: 'cd.t', med: 'steam', w: 4, via: 'v' }
    ],
    trends: [
      {
        title: 'Turbine',
        pens: [
          ['Load', 'GCP-AI1001', 'MW'],
          ['Speed', 'SI-TB', 'rpm', 0],
          ['Control valves', 'ZI-CV', '%'],
          ['Condenser pressure', 'PT-CD', 'kg/cm² abs', 3]
        ]
      },
      {
        title: 'Supervision',
        pens: [
          ['Shaft vibration', 'VIST-MAX', 'mm', 3],
          ['Thrust bearing front', 'TIST-THF', '°C', 0],
          ['Thrust bearing rear', 'TIST-THR', '°C', 0]
        ]
      }
    ]
  });

  page({
    id: 'turbine-oil',
    group: 'Turbine and generator',
    title: 'Turbine oil',
    about: 'Lubricating oil to the bearings and control oil to the turbine valves.',
    lanes: [
      {
        med: 'lube',
        label: 'Lubricating oil',
        items: [
          E('tank', 'Main oil tank', '', [], { w: 90, h: 80 }),
          [
            M('pump', 'MOP-A', 'Main oil pump A', [V('Discharge', 'PTLO1922A', K)], {
              tag: 'P-1922A',
              flow: 'm:MOP-A'
            }),
            M('pump', 'MOP-B', 'Main oil pump B', [V('Discharge', 'PTLO1922B', K)], {
              tag: 'P-1922B',
              flow: 'm:MOP-B'
            }),
            M('pump', 'EOP', 'Emergency oil pump', [V('Discharge', 'PTLO1923', K)], { tag: 'P-1923', flow: 'm:EOP' })
          ],
          E('exchanger', 'Oil coolers', '', [V('Inlet', 'TELO1001', '°C', 0), V('Outlet', 'TE-LO1002-1', '°C', 0)], {
            w: 110,
            h: 38
          }),
          C('TICLO1002', 'Oil temperature valve (cooling water)', { tag: 'TCV-CW1201', pv: '°C', med: 'cooling' }),
          E('header', 'Bearing oil header', '', [V('Pressure', 'PTLO10031', K)], { w: 10, h: 70 }),
          E(
            'block',
            'Turbine and generator bearings',
            '',
            [V('Generator bearing oil', 'TEGE1007', '°C', 0), V('Exciter end', 'TEGE1008', '°C', 0)],
            { w: 130, h: 40 }
          )
        ]
      },
      {
        med: 'lube',
        label: 'Control oil',
        items: [
          [
            M('pump', 'COP-A', 'Control oil pump A', [V('Discharge', 'PTLO1931A', K)], {
              tag: 'P-1931A',
              flow: 'm:COP-A'
            }),
            M('pump', 'COP-B', 'Control oil pump B', [V('Discharge', 'PTLO1931B', K)], {
              tag: 'P-1931B',
              flow: 'm:COP-B'
            })
          ],
          E('header', 'Control oil header', '', [V('Pressure', 'PTLO10061', K)], { w: 10, h: 60 }),
          E('block', 'Turbine valve actuators', 'stop, control and intercept valves', [V('Trip oil', 'PTLO10071', K)], {
            w: 130,
            h: 40
          })
        ]
      }
    ],
    machines: [
      ['VAPOUR EXTRACTOR', 'Oil tank vapour extractor'],
      ['OIL PURIFIER', 'Oil purifier']
    ],
    trends: [
      {
        title: 'Lubricating oil',
        pens: [
          ['Pump A discharge', 'PTLO1922A', K],
          ['Bearing header', 'PTLO10031', K],
          ['Cooler outlet', 'TE-LO1002-1', '°C', 0],
          ['Temperature valve output', 'mv:TICLO1002', '%']
        ]
      },
      {
        title: 'Control oil',
        pens: [
          ['Pump A discharge', 'PTLO1931A', K],
          ['Control oil header', 'PTLO10061', K],
          ['Trip oil', 'PTLO10071', K]
        ]
      }
    ]
  });

  page({
    id: 'generator',
    group: 'Turbine and generator',
    title: 'Generator',
    about: 'From the turbine shaft to the grid, with the excitation and the generator temperatures.',
    lanes: [
      {
        med: 'power',
        w: 3,
        label: 'Power to the grid',
        items: [
          E('turbine', 'Turbine', '', [V('Speed', 'SI-TB', 'rpm', 0)], { w: 70, h: 54, go: 'turbine' }),
          E(
            'generator',
            'Generator',
            '',
            [
              V('Load', 'GCP-AI1001', 'MW'),
              V('Reactive', 'GEN.MVAR', 'MVAR'),
              V('Voltage', 'GEN.KV', 'kV'),
              V('Current', 'GEN.KA', 'kA', 2),
              V('Frequency', 'GEN.HZ', 'Hz'),
              V('Power factor', 'GEN.PF', '', 3)
            ],
            { w: 96, h: 60 }
          ),
          E('breaker', 'Generator breaker', '52G1', [], { on: 'v:GCP-AI1001>1' }),
          E('transformer', 'Main transformer', '', []),
          E('breaker', 'Line breaker', '52L1', [], { on: 'v:GCP-AI1001>1' }),
          E('header', 'Grid', '', [], { w: 8, h: 90 })
        ]
      },
      {
        med: 'signal',
        noline: true,
        label: 'Excitation and temperatures',
        items: [
          E('block', 'Excitation', '', [V('Field voltage', 'GEN.VF', ''), V('Field current', 'GEN.IF', '')], {
            w: 90,
            h: 34
          }),
          E('analyzer', 'Stator winding', 'six detectors', [
            V('Highest', 'GEN.TSMAX', '°C', 0),
            V('Detector 1', 'GEN.TS1', '°C', 0)
          ]),
          E('analyzer', 'Cooling air', '', [V('Cold air', 'GEN.TAIR', '°C', 0), V('Exciter air', 'GEN.TEX', '°C', 0)]),
          E('analyzer', 'Bearings', '', [V('Metal', 'TEGE1001', '°C', 0), V('Vibration', 'VEGE10011', 'mm', 3)])
        ]
      }
    ],
    trends: [
      {
        title: 'Generator output',
        pens: [
          ['Load', 'GCP-AI1001', 'MW'],
          ['Reactive power', 'GEN.MVAR', 'MVAR'],
          ['Voltage', 'GEN.KV', 'kV'],
          ['Frequency', 'GEN.HZ', 'Hz']
        ]
      },
      {
        title: 'Temperatures',
        pens: [
          ['Stator winding, highest', 'GEN.TSMAX', '°C', 0],
          ['Cold air', 'GEN.TAIR', '°C', 0],
          ['Bearing metal', 'TEGE1001', '°C', 0]
        ]
      }
    ]
  });

  /* ================= COOLING AND UTILITIES ================= */
  const tri = (sym, base, label, cur, tagf, o) =>
    ['A', 'B', 'C'].map(x =>
      M(
        sym,
        base + x,
        label + ' ' + x,
        cur ? [V('Current', cur + x, 'A')] : [],
        Object.assign({ tag: tagf ? tagf(x) : '', flow: 'm:' + base + x }, o || {})
      )
    );
  page({
    id: 'sea-water',
    group: 'Cooling and utilities',
    title: 'Circulating sea water',
    about:
      'Sea water through the condenser, and through the booster pumps to the closed cooling water heat exchangers.',
    lanes: [
      {
        med: 'sea',
        label: 'Condenser cooling',
        items: [
          E('tank', 'Sea water intake', '', [V('Level', 'LISW1501', 'm', 2)], { w: 70, h: 70 }),
          tri('pump', 'SWP-', 'Circulating water pump', 'IIP1501', x => 'P-1501' + x),
          E('filter', 'Debris filter', 'S-1502', []),
          E(
            'condenser',
            'Condenser',
            '',
            [
              V('Inlet A', 'PISW1110A1', K),
              V('Inlet A', 'TISW1110A1', '°C'),
              V('Outlet A', 'TISW1110A2', '°C'),
              V('Outlet B', 'TISW1110B2', '°C')
            ],
            { w: 120, h: 70, pin: 'lt', pout: 'rt' }
          ),
          E('header', 'Discharge to the sea', '', [], { w: 8, h: 60 })
        ]
      },
      {
        med: 'sea',
        label: 'Cooling of the closed cooling water',
        items: [
          tri('pump', 'SWBP-', 'Sea water booster pump', 'IIP1503', x => 'P-1503' + x + ' · DITL-30'),
          E('filter', 'Debris filter', 'S-1504', []),
          E('exchanger', 'Closed cooling water heat exchangers', '', [], { w: 120, h: 38 }),
          L('makeup-cooling', 'Closed cooling water')
        ]
      }
    ],
    machines: [
      ['P-0762A', 'Hypochlorite dosing pump A'],
      ['P-0762B', 'Hypochlorite dosing pump B'],
      ['P-0761A', 'Hypochlorite unloading pump'],
      ['CTCS-A', 'Condenser tube cleaning A'],
      ['CTCS-B', 'Condenser tube cleaning B'],
      ['S-1502', 'Debris filter S-1502'],
      ['S-1504', 'Debris filter S-1504']
    ],
    trends: [
      {
        title: 'Sea water',
        pens: [
          ['Intake level', 'LISW1501', 'm', 2],
          ['Condenser inlet A', 'TISW1110A1', '°C'],
          ['Condenser outlet A', 'TISW1110A2', '°C'],
          ['Inlet pressure A', 'PISW1110A1', K, 2]
        ]
      },
      {
        title: 'Pump currents',
        pens: [
          ['Circulating pump B', 'IIP1501B', 'A'],
          ['Circulating pump C', 'IIP1501C', 'A'],
          ['Booster pump A', 'IIP1503A', 'A']
        ]
      }
    ]
  });

  page({
    id: 'makeup-cooling',
    group: 'Cooling and utilities',
    title: 'Make-up and closed cooling water',
    about: 'Demineralized water to the condenser hotwell, and the closed cooling water loop of the unit.',
    lanes: [
      {
        med: 'water',
        label: 'Make-up water',
        items: [
          [
            E('tank', 'Demineralized water tank A', '', [V('Level', 'LIMU0708A', 'm')], { w: 56, h: 60, lab: 'l' }),
            E('tank', 'Demineralized water tank B', '', [V('Level', 'LIMU0708B', 'm')], { w: 56, h: 60, lab: 'l' })
          ],
          tri('pump', 'MWP-', 'Make-up water pump', 'IIP0709', x => 'P-0709' + x + ' · DITL-112'),
          E('header', 'Make-up header', '', [V('Pressure', 'PIMU0709', K), V('Flow', 'FIMU1001', 'm³/h')], {
            w: 10,
            h: 70
          }),
          L('condensate', 'To condenser hotwell')
        ]
      },
      {
        med: 'cooling',
        label: 'Closed cooling water',
        items: [
          E('tank', 'Expansion tank', '', [V('Level', 'LICW1109', 'm', 2)], { w: 56, h: 56 }),
          [
            M('pump', 'ACWP-A', 'Closed cooling water pump A', [V('Current', 'IIP1108A', 'A')], {
              tag: 'P-1108A · DITL-76',
              flow: 'm:ACWP-A'
            }),
            M('pump', 'ACWP-B', 'Closed cooling water pump B', [V('Current', 'IIP1108B', 'A')], {
              tag: 'P-1108B · DITL-77',
              flow: 'm:ACWP-B'
            })
          ],
          E(
            'exchanger',
            'Cooling water heat exchangers',
            '',
            [V('Inlet', 'TICW1152', '°C', 0), V('Outlet', 'TICW1153', '°C', 0)],
            { w: 120, h: 38 }
          ),
          E('header', 'Supply to users', '', [V('Pressure', 'PICW1153', K)], { w: 10, h: 60 }),
          C('TICLO1002', 'Turbine oil cooler temperature valve', { tag: 'TCV-CW1201', pv: '°C' })
        ]
      }
    ],
    trends: [
      {
        title: 'Make-up water',
        pens: [
          ['Tank A level', 'LIMU0708A', 'm'],
          ['Header pressure', 'PIMU0709', K],
          ['Make-up flow', 'FIMU1001', 'm³/h']
        ]
      },
      {
        title: 'Closed cooling water',
        pens: [
          ['Supply temperature', 'TICW1153', '°C', 0],
          ['Supply pressure', 'PICW1153', K],
          ['Expansion tank level', 'LICW1109', 'm', 2]
        ]
      }
    ]
  });

  const airTrain = (kind, code, cur, flow) => [
    ['A', 'B', 'C'].map(x =>
      M('compressor', kind + ' air compressor ' + x, kind + ' air compressor ' + x, [V('Current', cur + x, 'A', 0)], {
        tag: 'C-' + code + x,
        flow: 'm:' + kind + ' air compressor ' + x
      })
    ),
    ['A', 'B', 'C'].map(x =>
      M('dryer', kind + ' air dryer ' + x, kind + ' air dryer ' + x, [V('Flow', flow + x, 'm³/h', 0)], {
        tag: 'D-' + code + x,
        flow: 'm:' + kind + ' air dryer ' + x
      })
    )
  ];
  page({
    id: 'compressed-air',
    group: 'Cooling and utilities',
    title: 'Instrument and plant air',
    about:
      'Three compressors and dryers for instrument air, three for plant air, each train to its receiver and header.',
    lanes: [
      {
        med: 'air',
        label: 'Instrument air',
        items: [
          ...airTrain('Instrument', '0704', 'IIC0704', 'FID0704'),
          E('vessel', 'Instrument air receiver', '', [V('Pressure', 'PIIA0706A', K, 2)], { w: 36, h: 76 }),
          E('header', 'Instrument air to the unit', '', [V('Pressure', 'PIIA1706', K, 2)], { w: 10, h: 70 })
        ]
      },
      {
        med: 'air',
        label: 'Plant air',
        items: [
          ...airTrain('Plant', '0703', 'IIC0703', 'FID0703'),
          E('vessel', 'Plant air receiver', '', [V('Pressure', 'PIPA0705A', K, 2)], { w: 36, h: 76 }),
          E('header', 'Plant air to the unit', '', [V('Pressure', 'PIPA1705', K, 2)], { w: 10, h: 70 })
        ]
      }
    ],
    trends: [
      {
        title: 'Air pressure',
        pens: [
          ['Instrument air to the unit', 'PIIA1706', K, 2],
          ['Plant air to the unit', 'PIPA1705', K, 2],
          ['Instrument air compressor A current', 'IIC0704A', 'A', 0]
        ]
      }
    ]
  });
})();
