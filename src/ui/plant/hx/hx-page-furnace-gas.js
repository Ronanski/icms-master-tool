/* HX page in the REALISTIC look: furnace and flue gas, from the bed to the stack (user 2026-11-17: "Ganyan ang HMI na gsto ko.
   Dapat iyan lang makita ko n mga itsura").
   THE PICTURE: the way of the gas through the plant as it stands, every large piece cut open: furnace, recycle cyclone with
   its seal pot, back pass with its two gas dampers, rotary air heater, electrostatic precipitator, induced draft fan, stack.
   THE CONNECTIONS: K1AU3-PD-051 Rev A, combustion air / flue gas system: furnace H-1001 with the furnace pressures
   PT-FG1085 / 1086 / 1087, the bed and furnace temperatures TT-FG1090 / 1091 and the differential pressures DPT-FG1081 ~ 1084;
   cyclone S-1009A / B (TT-FG1095-A / -B) and seal pot T-1009A / B (TT-FG1009, PT-FG1009); back pass with reheater, finishing
   superheater and economizers, the gas dampers TCV-FG1116 / 1117 under the two passes, economizer No. 1 (TT-FG1110, TT-FG1113);
   the duct to the air preheater H-1052 (PT-FG1121, O2 AE-FG1122 / 1123, TT-FG1124 / 1125), its differential pressure
   PDT-FG1052-5, after it O2 AE-FG1131, TT-FG1132 / 1133, PT-FG1134 and the fly ash hopper; the precipitator Z-1010; the
   induced draft fan F-1056 with its hydraulic coupling Z-1056 and inlet damper PCD-FG1056-1 (PT-FG1141, TT-FG1152,
   PT-FG1151); the stack Z-1057 with the gas analyzers AT-FG1057-1 ~ -6, the velocity FT-FG1057-7 and TT-FG1057-8.
   Names of the values as the temporary page 09 gives them (bed DP, plenum to lower bed DP, lower to upper DP, solids down).
   Drawn simpler than the sheet:
   - 2 cyclones and 2 seal pots: one of each is drawn (a section through the boiler), both temperatures are shown;
   - the air side of the air heater, the fans and blowers of the combustion air: the Combustion air page;
   - the single bank temperatures of the back pass TT-FG1100 ~ 1109 and 1111 have no signal in hx-registry.js: not shown.
   Left out on purpose, all without a signal in hx-registry.js: hand valves, test points, the single bed thermocouples, the
   bearing, winding and vibration measurements of the fan, the fly ash transmitters under the hoppers. */
(function () {
  const { V, E, M, C, L, page } = HX;
  const MM = 'mmH₂O';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const W_G = 14;
  /* places (the drawing is 1760 x 1000) */
  const FX = 340,
    FY = 200,
    FS = 1.6 /* furnace: roof centre */,
    CX = 545,
    CY = 216,
    CS = 1.5 /* cyclone */,
    BPX = 660,
    BPY = 150,
    BS = 1.1 /* back pass: top left corner */,
    GX = BPX + 108 * BS /* gas out of the back pass, down to the air heater */,
    AHX = GX - 34 * 1.4,
    AHY = 880,
    AS = 1.4 /* air heater */,
    EX = 1190,
    EY = 700,
    ES = 1.6 /* precipitator */,
    DX = 1378 /* duct down to the fan with the inlet damper */,
    IX = 1485,
    IY = 870,
    IS = 1.8 /* induced draft fan */,
    SX = 1670,
    SY = 870,
    SS = 3.4; /* stack */
  const GAS = 'm:IDF';

  page({
    id: 'furnace-gas',
    group: 'Boiler',
    title: 'Furnace and flue gas',
    about:
      'The way of the gas, cut open: furnace, cyclone, back pass, air heater, precipitator, induced draft fan, stack. Connections: flow diagram K1AU3-PD-051 Rev A.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        /* ---- the large pieces ---- */
        at(E('furnace', '', '', [], { fire: 'v:TT-FG1090>300' }), FX, FY, { id: 'fu', under: true, sc: FS }),
        at(E('cyclone', '', '', [], { flow: GAS }), CX, CY, { id: 'cy', under: true, sc: CS }),
        at(E('sealpot', '', '', [], { flow: GAS }), CX, CY + 196 * CS, { id: 'sp', under: true, sc: CS, mir: true }),
        at(E('backpass', '', '', [], { gasA: 'l:HICHR1002A', gasB: 'l:HICHR1002B' }), BPX, BPY, {
          id: 'bp',
          under: true,
          sc: BS
        }),
        at(M('airheater', 'AIR PREHEATER', 'Air heater', []), AHX, AHY, { id: 'ah', sc: AS, lab: 'l' }),
        at(E('esp', 'Precipitator', 'Z-1010', []), EX, EY, { id: 'esp', sc: ES, lab: 't' }),
        at(M('fan', 'IDF', 'Induced draft fan', [V('Current', 'IT-F1056', 'A')]), IX, IY, {
          id: 'idf',
          sc: IS,
          lab: 'b'
        }),
        at(E('stack', '', '', [], { flow: GAS }), SX, SY, { id: 'st', under: true, sc: SS }),

        /* ---- dampers and controllers ---- */
        at(
          C('HICHR1002A', 'Reheater pass damper', { sym: 'louver', w: 100, tag: 'TCV-FG1116A-D', wrap: 14 }),
          BPX + 56 * BS,
          BPY + 350 * BS,
          {
            id: 'dma',
            lab: 'b'
          }
        ),
        at(
          C('HICHR1002B', 'Superheater pass damper', { sym: 'louver', w: 100, tag: 'TCV-FG1117A-D', wrap: 14 }),
          BPX + 160 * BS,
          BPY + 350 * BS,
          { id: 'dmb', lab: 'b' }
        ),
        at(C('PICFG108A', 'Fan inlet damper', { sym: 'louver', w: 56, tag: 'PCD-FG1056-1', wrap: 12 }), DX, 800, {
          id: 'idd',
          lab: 'l'
        }),
        at(C('PICFG108', 'Furnace pressure, fan coupling', { sym: 'ctl', unit: MM, pvdp: 0, wrap: 32 }), 1500, 600, {
          id: 'pic',
          lab: 't'
        }),
        /* 3.2.5-beta.1 (JENNIE live Cold 2026-11-18): the two CRT push buttons of ABC-008 (memory list 101: M.0200 HYDRAULIC CONTROL
           SELECT, M.0201 DAMPER CONTROL SELECT, TPS 2 s -> FF M.0202); lit = the selection of M.0202. No operator page had them: with
           the hydraulic coupling selected the damper station tracks F(X) of the coupling (100 %), so the operator could not close the
           inlet damper for the ID fan START permissive (DITL-25A M.3117 IDF INLET VANE CLOSED) nor follow PR-OPE-5004 "change the
           furnace pressure control to DAMPER CONTROL" */
        at(HX.B('HYDRAULIC CONTROL', 'data-apb="ABC-008|M.0200|M.0202=1"', { press: true }), 1400, 700, { id: 'pbh' }),
        at(HX.B('DAMPER CONTROL', 'data-apb="ABC-008|M.0201|M.0202=0"', { press: true }), 1610, 700, { id: 'pbd' }),
        at(C('AICFG112', 'Oxygen control', { sym: 'ctl', unit: '%', pvdp: 1, wrap: 30 }), 1050, 400, {
          id: 'o2c',
          lab: 't'
        }),
        at(L('combustion-air', 'Combustion air'), 540, 810, { id: 'cal' }),
        /* 3.2.5-beta.1 (JENNIE live Cold 2026-11-18, F-G): no page linked to Purge and trip, the operator could not reach the purge */
        at(L('purge-trip', 'Purge and trip'), 760, 810, { id: 'ptl' }),
        /* 3.2.5-beta.1 (F-M): the diesel oil and burners page was reached only through Purge and trip */
        at(L('oil-burners', 'Burners'), 320, 810, { id: 'obl' })
      ],
      pipes: [
        { med: 'gas', w: W_G, pts: ['fu.out', 'cy.in'], flow: GAS, arrow: false },
        { med: 'gas', w: W_G, pts: ['cy.gas', [CX, 60], [BPX + 46 * BS, 60], 'bp.gin'], flow: GAS },
        { med: 'solid', w: 6, pts: ['sp.out', [466, CY + 212 * CS], [466, FY + 290 * FS], 'fu.ret'], flow: GAS },
        { med: 'gas', w: W_G, pts: ['bp.gout', 'ah.gasT'], flow: GAS },
        { med: 'gas', w: W_G, pts: ['ah.gasB', [GX, 972], [1012, 972], [1012, EY], 'esp.l'], flow: GAS },
        { med: 'gas', w: W_G, pts: ['esp.r', [DX, EY], [DX, IY], 'idf.in'], flow: GAS },
        {
          med: 'gas',
          w: W_G,
          pts: ['idf.out', [IX - 2 * IS, 740], [1575, 740], [1575, SY - 14 * SS], 'st.in'],
          flow: GAS
        }
      ],
      taps: [
        {
          x: 630,
          y: 60,
          side: 'b',
          label: 'Cyclone outlet',
          key: 'TT-FG1095-A',
          key2: 'TT-FG1095-B',
          unit: '°C',
          dp: 0,
          tag: 'TT-FG1095-A / -B'
        },
        {
          x: GX,
          y: 742,
          side: 'r',
          label: 'Economizer 1 outlet',
          key: 'TT-FG1110',
          key2: 'TT-FG1113',
          unit: '°C',
          dp: 0,
          tag: 'TT-FG1110 / 1113'
        },
        { x: 1520, y: 740, side: 't', label: 'Fan outlet', key: 'TT-FG1152', unit: '°C', dp: 0, tag: 'TT-FG1152' },
        { x: 1575, y: 790, side: 'l', label: 'Pressure', key: 'PT-FG1151', unit: MM, dp: 0, tag: 'PT-FG1151' }
      ],
      texts: [
        { x: 24, y: 150, s: 'FURNACE', cls: 'hx-zone' },
        { x: 24, y: 172, s: 'Pressure 1', key: 'PT-FG1085', unit: MM, dp: 0 },
        { x: 24, y: 188, s: 'Pressure 2', key: 'PT-FG1086', unit: MM, dp: 0 },
        { x: 24, y: 204, s: 'Pressure 3', key: 'PT-FG1087', unit: MM, dp: 0 },
        { x: 24, y: 228, s: 'Upper average', key: 'TT-FG1091', unit: '°C', dp: 0 },
        { x: 24, y: 244, s: 'Lower average', key: 'TT-FG1090', unit: '°C', dp: 0 },
        { x: 24, y: 268, s: 'Bed pressure drop', key: 'DPT-FG1081', unit: MM, dp: 0 },
        { x: 24, y: 284, s: 'Plenum to lower bed 1', key: 'DPT-FG1084', unit: MM, dp: 0 },
        { x: 24, y: 300, s: 'Plenum to lower bed 2', key: 'DPT-FG1184', unit: MM, dp: 0 },
        { x: 24, y: 316, s: 'Lower to upper 1', key: 'DPT-FG1083', unit: MM, dp: 0 },
        { x: 24, y: 332, s: 'Lower to upper 2', key: 'DPT-FG1183', unit: MM, dp: 0 },
        { x: FX, y: FY + 200 * FS, s: 'Furnace', cls: 'hx-name', anchor: 'middle' },
        { x: CX, y: CY + 58, s: 'Cyclone', cls: 'hx-name', anchor: 'middle' },
        { x: 486, y: 650, s: 'SEAL POT', cls: 'hx-zone' },
        { x: 486, y: 670, s: 'Solids down A', key: 'TT-FG1009-A', unit: '°C', dp: 0 },
        { x: 486, y: 686, s: 'Solids down B', key: 'TT-FG1009-B', unit: '°C', dp: 0 },
        { x: 486, y: 702, s: 'Pressure A', key: 'PT-FG1009-A2', unit: MM, dp: 0 },
        { x: 486, y: 718, s: 'Pressure B', key: 'PT-FG1009-B2', unit: MM, dp: 0 },
        { x: 834, y: 812, s: 'BEFORE THE AIR HEATER', cls: 'hx-zone' },
        { x: 834, y: 830, s: 'Oxygen 1', key: 'AT-FG1122', unit: '%', dp: 1 },
        { x: 834, y: 846, s: 'Oxygen 2', key: 'AT-FG1123', unit: '%', dp: 1 },
        { x: 834, y: 862, s: 'Temperature 1', key: 'TT-FG1124', unit: '°C', dp: 0 },
        { x: 834, y: 878, s: 'Temperature 2', key: 'TT-FG1125', unit: '°C', dp: 0 },
        { x: 834, y: 894, s: 'Pressure', key: 'PT-FG1121', unit: MM, dp: 0 },
        { x: 834, y: 916, s: 'Air heater pressure drop', key: 'DPT-FG1052-5', unit: MM, dp: 0 },
        { x: 600, y: 944, s: 'AFTER THE AIR HEATER', cls: 'hx-zone', anchor: 'end' },
        { x: 600, y: 962, s: 'Oxygen', key: 'AT-FG1131', unit: '%', dp: 1, anchor: 'end' },
        { x: 600, y: 978, s: 'Temperature 1', key: 'TT-FG1132', unit: '°C', dp: 0, anchor: 'end' },
        { x: 420, y: 962, s: 'Temperature 2', key: 'TT-FG1133', unit: '°C', dp: 0, anchor: 'end' },
        { x: 420, y: 978, s: 'Pressure', key: 'PT-FG1134', unit: MM, dp: 0, anchor: 'end' },
        { x: 1336, y: 850, s: 'Fan inlet A', key: 'PT-FG1141-A', unit: MM, dp: 0, anchor: 'end' },
        { x: 1336, y: 866, s: 'Fan inlet B', key: 'PT-FG1141-B', unit: MM, dp: 0, anchor: 'end' },
        { x: 1610, y: 150, s: 'STACK', cls: 'hx-zone', anchor: 'end' },
        { x: 1610, y: 172, s: 'Oxygen', key: 'AT-FG1057-4', unit: '%', dp: 1, anchor: 'end' },
        { x: 1610, y: 188, s: 'Nitrogen oxides', key: 'AT-FG1057-2', unit: 'ppm', dp: 0, anchor: 'end' },
        { x: 1610, y: 204, s: 'Sulphur oxides', key: 'AT-FG1057-1', unit: 'ppm', dp: 0, anchor: 'end' },
        { x: 1610, y: 220, s: 'Carbon monoxide', key: 'AT-FG1057-3', unit: 'ppm', dp: 0, anchor: 'end' },
        { x: 1610, y: 236, s: 'Opacity', key: 'AT-FG1057-6', unit: '%', dp: 1, anchor: 'end' },
        { x: 1610, y: 252, s: 'Dust', key: 'AT-FG1057-5', unit: 'mg/m³', dp: 1, anchor: 'end' },
        { x: 1610, y: 268, s: 'Temperature', key: 'TT-FG1057-8', unit: '°C', dp: 0, anchor: 'end' },
        { x: 1610, y: 284, s: 'Velocity', key: 'FT-FG1057-7', unit: 'm/s', dp: 1, anchor: 'end' }
      ]
    }
  });
})();
