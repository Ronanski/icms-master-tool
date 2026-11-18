/* HX page in the REALISTIC look: the overview of the unit (user 2026-11-17: "Lahat ng luma na HMI, alisin dyan s app";
   "Bsta hmi tpusin m muna").
   THE PICTURE: the whole unit on one page, small. Above, the way of the gas: furnace, cyclone, back pass, air heater,
   precipitator, induced draft fan, stack. Below, the water and steam cycle: drum, main steam to the turbine and generator,
   condenser, condensate pump, deaerator, feed pump, back to the drum. Every part of the picture has the link to its own
   page beside it; the five controllers of the coordinated control are on the right.
   THE VALUES AND CONTROLLERS are those of temporary page 00 (same keys): load GCP-AI1001, main steam pressure PT-MS1002,
   temperature TICMS1004, flow ABC-001C SI0230, feedwater flow FICFW1007, drum level LICBR1001B, furnace pressure
   PT-FG1085, total air flow ABC-002 SI0060, coal flow FIC-CM, turbine speed SI-TB, condenser pressure PT-CD1110, generator
   breaker 52G1 (DITL-03E input 2); controllers HIC-ULD, EIC-TM, PIC-COBM, HIC-BM, FIC-CM.
   Drawn simpler (an overview, not a flow diagram): the reheat lines, the heaters, the polisher, the bypass valves, the fans
   of the combustion air and the fuel feeding are not drawn here; their pages are linked. No connection of this page was
   read from a flow diagram: each line is the connection its own page already shows. */
(function () {
  const { V, E, M, C, L, page } = HX;
  const B = HX.B;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const GAS = 'm:IDF',
    STM = 'v:SI-TB>50',
    FW = 'm:BFWP-A|m:BFWP-B',
    CD = 'm:CEP-A|m:CEP-B';
  /* places (the drawing is 1760 x 1000) */
  const FX = 250,
    FY = 170 /* furnace, top */,
    CYX = 410,
    CYY = 230 /* cyclone */,
    BX = 540,
    BY = 205,
    BS = 0.75 /* back pass */,
    AX = 940,
    AY = 530 /* air heater */,
    EX = 1105,
    EY = 590 /* precipitator */,
    IX = 1305,
    IY = 610 /* induced draft fan */,
    SX = 1420,
    SY = 640,
    SS = 1.5 /* stack */,
    TX = 1090,
    TY = 800,
    TS = 0.5 /* turbine set */,
    GX = 900,
    GS = 0.8 /* generator */,
    DX = 520,
    DY = 850,
    DS = 0.8; /* deaerator */

  page({
    id: 'overview',
    group: 'Unit',
    title: 'Unit overview',
    about:
      'The whole unit on one page: the way of the gas above, the water and steam cycle below, the main numbers, the five controllers of the coordinated control, and a link to every page.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        /* ---- the way of the gas ---- */
        at(E('furnace', '', '', [], { fire: GAS }), FX, FY, { id: 'fu', under: true }),
        at(E('drum', '', '', [], { id: 'ovdr' }), FX, 100, { id: 'dr', under: true, sc: 0.6 }),
        at(E('cyclone', '', '', [], { flow: GAS }), CYX, CYY, { id: 'cy', under: true }),
        at(E('backpass', '', '', [], { gasA: GAS, gasB: GAS, steam: STM }), BX, BY, { id: 'bp', under: true, sc: BS }),
        at(M('airheater', 'AIR PREHEATER', 'Air heater', []), AX, AY, { id: 'ah', lab: 'l' }),
        at(E('esp', '', '', [], { on: GAS }), EX, EY, { id: 'esp', under: true }),
        at(M('fan', 'IDF', 'Induced draft fan', []), IX, IY, { id: 'idf', lab: 'b' }),
        at(E('stack', '', '', [], { flow: GAS }), SX, SY, { id: 'st', under: true, sc: SS }),

        /* ---- water and steam ---- */
        at(E('tgset', '', '', [], { on: STM }), TX, TY, { id: 'tg', under: true, sc: TS }),
        at(E('generator', 'Generator', '', [V('Load', 'GCP-AI1001', 'MW', 1)], { on: STM }), GX, TY, {
          id: 'gen',
          sc: GS,
          lab: 'b'
        }),
        at(
          B('Generator breaker', 'data-dy="DITL-03E|i|2|neg" data-on="CLOSED" data-off="OPEN"', { w: 150 }),
          GX,
          TY - 70,
          {
            id: 'g52'
          }
        ),
        at(M('pump', 'CEP-A', 'Condensate pump A', []), 800, 940, { id: 'cep', sc: 0.8, lab: 'l', mir: true }),
        at(E('deaerator', 'Deaerator', '', []), DX, DY, { id: 'da', sc: DS, lab: 'b' }),
        at(M('pump', 'BFWP-A', 'Boiler feed pump A', []), 250, 930, { id: 'bfp', sc: 0.8, lab: 'b', mir: true }),

        /* ---- coordinated control ---- */
        at(C('HIC-ULD', 'Unit load demand, MW', { sym: 'ctl', unit: '', pvdp: 0, wrap: 18 }), 1560, 150, {
          id: 'uld',
          lab: 'r'
        }),
        at(C('EIC-TM', 'Turbine master, MW', { sym: 'ctl', unit: '', pvdp: 0, wrap: 18 }), 1560, 250, {
          id: 'tm',
          lab: 'r'
        }),
        at(C('PIC-COBM', 'Boiler pressure, kg/cm²', { sym: 'ctl', unit: '', pvdp: 0, wrap: 18 }), 1560, 350, {
          id: 'bpc',
          lab: 'r'
        }),
        at(C('HIC-BM', 'Boiler master', { sym: 'ctl', unit: '', pvdp: 1, wrap: 18 }), 1560, 450, {
          id: 'bm',
          lab: 'r'
        }),
        at(C('FIC-CM', 'Coal master, t/h', { sym: 'ctl', unit: '', pvdp: 1, wrap: 18 }), 1560, 550, {
          id: 'cm',
          lab: 'r'
        }),
        /* the rate limit of the unit load demand: HIC-MWRL, ULD MAX RATE OF CHANGE SETTER, 0 to 10 MW/MIN (ABC-001B; DCS loop list) */
        at(C('HIC-MWRL', 'Load change rate, MW/min', { sym: 'ctl', unit: '', pvdp: 1, wrap: 18 }), 1560, 650, {
          id: 'mwrl',
          lab: 'r'
        }),

        /* ---- the page of every part ---- */
        at(L('coal', 'Coal'), 70, 430, { id: 'l1' }),
        at(L('limestone-sand', 'Limestone and sand'), 70, 462, { id: 'l2' }),
        at(L('oil-burners', 'Oil burners'), 70, 494, { id: 'l3' }),
        at(L('combustion-air', 'Combustion air'), 70, 526, { id: 'l4' }),
        at(L('purge-trip', 'Purge and trip'), 70, 558, { id: 'l5' }),
        at(L('ash', 'Ash and precipitator'), 70, 590, { id: 'l6' }),
        at(L('furnace-gas', 'Furnace and flue gas'), 850, 250, { id: 'l7' }),
        at(L('sootblowers', 'Sootblowers'), 850, 282, { id: 'l8' }),
        at(L('drum-steam', 'Boiler steam'), 850, 314, { id: 'l9' }),
        at(L('reheat-steam', 'Reheat steam'), 850, 346, { id: 'l10' }),
        at(L('turbine', 'Turbine'), 1320, 760, { id: 'l11' }),
        at(L('turbine-oil', 'Turbine oil'), 1320, 792, { id: 'l12' }),
        at(L('extraction', 'Extraction and drains'), 1320, 824, { id: 'l13' }),
        at(L('aux-steam', 'Auxiliary steam and vacuum'), 1320, 856, { id: 'l14' }),
        at(L('generator', 'Generator'), 1320, 888, { id: 'l15' }),
        at(L('sea-water', 'Sea water'), 1320, 920, { id: 'l16' }),
        at(L('condensate', 'Condensate'), 940, 978, { id: 'l17' }),
        at(L('feedwater', 'Feedwater'), 400, 960, { id: 'l18' }),
        at(L('sampling', 'Sampling and dosing'), 1580, 760, { id: 'l19' }),
        at(L('makeup-cooling', 'Make-up and cooling water'), 1580, 792, { id: 'l20' }),
        at(L('compressed-air', 'Instrument and plant air'), 1580, 824, { id: 'l21' })
      ],
      pipes: [
        /* gas */
        { med: 'gas', w: 10, pts: ['fu.out', 'cy.in'], flow: GAS, arrow: false },
        { med: 'gas', w: 10, pts: ['cy.gas', [CYX, 185], [BX + 46 * BS, 185], 'bp.gin'], flow: GAS },
        { med: 'solid', w: 5, pts: ['cy.dip', [CYX, 470], 'fu.ret'], flow: GAS, arrow: false },
        {
          med: 'gas',
          w: 10,
          pts: ['bp.gout', [BX + 108 * BS, 620], [722, 620], [722, 460], [AX + 34, 460], 'ah.gasT'],
          flow: GAS
        },
        { med: 'gas', w: 10, pts: ['ah.gasB', [AX + 34, EY], 'esp.l'], flow: GAS },
        { med: 'gas', w: 10, pts: ['esp.r', [1225, EY], [1225, IY], 'idf.in'], flow: GAS },
        { med: 'gas', w: 10, pts: ['idf.out', [IX - 2, 548], [1360, 548], [1360, SY - 14 * SS], 'st.in'], flow: GAS },
        /* main steam: drum, superheaters, turbine */
        {
          med: 'steam',
          w: 6,
          pts: ['dr.st', [FX, 60], [1480, 60], [1480, 720], [TX + 46 * TS, 720], 'tg.hpIn'],
          flow: STM
        },
        /* condensate and feedwater */
        { med: 'condensate', w: 5, pts: [[TX - 78, TY + 128], [TX - 78, 940], 'cep.s'], flow: CD },
        { med: 'condensate', w: 5, pts: ['cep.d', [800 + 2 * 0.8, 790], [DX - 31 * DS, 790], 'da.cin'], flow: CD },
        { med: 'water', w: 5, pts: ['da.out', [DX + 48 * DS, 930], 'bfp.s'], flow: FW },
        {
          med: 'water',
          w: 5,
          pts: ['bfp.d', [250 + 2 * 0.8, 880], [150, 880], [150, 130], [FX - 55 * 0.6, 130], 'dr.fw'],
          flow: FW
        }
      ],
      taps: [
        { x: 900, y: 60, side: 'b', label: 'Main steam pressure', key: 'PT-MS1002', unit: K, tag: 'PT-MS1002' },
        { x: 1100, y: 60, side: 'b', label: 'Temperature', key: 'pv:TICMS1004', unit: '°C', dp: 0, tag: 'TICMS1004' },
        { x: 1300, y: 60, side: 'b', label: 'Flow', key: 'ABC-001C|SI0230', unit: 't/h', tag: 'FT-MS1031' },
        { x: 150, y: 700, side: 'r', label: 'Feedwater flow', key: 'pv:FICFW1007', unit: 't/h', tag: 'FICFW1007' }
      ],
      texts: [
        { x: 24, y: 40, s: 'BOILER', cls: 'hx-zone' },
        { x: FX + 80, y: 96, s: 'Drum level', key: 'pv:LICBR1001B', unit: 'mm', dp: 0 },
        { x: 24, y: 62, s: 'Furnace pressure', key: 'PT-FG1085', unit: 'mmH₂O', dp: 0 },
        { x: 24, y: 80, s: 'Total air flow', key: 'ABC-002|SI0060', unit: 't/h' },
        { x: 24, y: 98, s: 'Coal flow', key: 'pv:FIC-CM', unit: 't/h' },
        { x: FX, y: FY + 372, s: 'Furnace', cls: 'hx-name', anchor: 'middle' },
        { x: CYX + 44, y: CYY + 120, s: 'Cyclone', cls: 'hx-name' },
        { x: BX - 12, y: 166, s: 'Back pass', cls: 'hx-name', anchor: 'end' },
        { x: EX, y: EY + 74, s: 'Precipitator', cls: 'hx-name', anchor: 'middle' },
        { x: SX, y: SY + 22, s: 'Stack', cls: 'hx-name', anchor: 'middle' },
        { x: 24, y: 700, s: 'WATER AND STEAM', cls: 'hx-zone' },
        { x: TX - 50, y: TY + 152, s: 'Turbine and condenser', cls: 'hx-name' },
        { x: TX + 60, y: TY - 60, s: 'Speed', key: 'SI-TB', unit: 'rpm', dp: 0 },
        { x: TX - 50, y: TY + 170, s: 'Condenser pressure', key: 'PT-CD1110', unit: K + ' abs', dp: 3 },
        { x: 1490, y: 100, s: 'COORDINATED CONTROL', cls: 'hx-zone' },
        { x: 1490, y: 720, s: 'PAGES', cls: 'hx-zone' }
      ]
    }
  });
})();
