/* NEW PLANT HMI (2026-10-26, roadmap step 6, sample): the plant screens REDRAWN with our own vector graphics (user 2026-10-26:
   "new HMI using your own graphics, guide lang ang snapshots"). The control-room snapshots (document-references/hmi-snapshot-
   sample.zip) are only the guide for the system: equipment, flow paths, instruments.
   8th pass (2026-10-27, user: "ang daming kulang na tags, walang descriptions, di kita ang mga internals at externals pipes ...
   flue gas, water, steam, kung san malamig, mainit, temperature, pressure, flow, level, analyticals, hydraulic coupling, esp"):
   - the process after the flow diagram K1AU3-PD-051 COMBUSTION AIR / FLUE GAS, PD-052 PRIMARY AIR, PD-053 SECONDARY AIR,
     PD-054 FLUIDIZING AIR (flow-diagram-K1AU3-A1-0-001.zip, RA pages 42 ~ 45) and the boiler manual Part 5 Sect 1: furnace ->
     cyclones S-1009A / B -> seal pots T-1009A / B back to the furnace; backpass: reheater pass (RH-1 ~ 4, ECO #2R) and
     superheater pass (FINISH S/H 1 ~ 3, ECO #3 upper / lower, ECO #2S) with the gas biasing dampers TCV-FG1116 / 1117 under
     them, then ECO #1; the LJUNGSTROM (rotary, three sector: PA / SA / gas) air preheater H-1052 (was drawn tubular: wrong);
     hopper; ESP Z-1010; IDF F-1056 with its hydraulic coupling Z-1056; stack Z-1057 with the CEMS (AT-FG1057-1 ~ 6, FT / TT);
     PAF F-1053 and SAF F-1054 with their silencers, flow venturis and inlet dampers; the cold PA branch to the coal feeders,
     the hot PA to the plenum and the coal pipes, the hot SA to the wall ports and the start-up burners; the FA blowers
     F-1055A / B (one running, one spare) with filter silencers, inlet dampers and check valves to the seal pots;
   - the water and steam of the boiler: drum, downcomer, risers, saturated steam, feedwater to the economizers, superheater,
     reheater; every medium its own colour (cold air, hot air, flue gas from hot to cool, solids, water, water / steam, main
     steam, reheat steam) with the legend;
   - EVERY transmitter of these systems in the I/O list (about 110), each with its tag, a short description and its unit.
     A transmitter that a DCS logic sheet uses shows the value of the logic (click = its faceplate or info card). A transmitter
     that no logic sheet uses (the backpass gas temperatures, the gas path pressures, the CEMS, the motor currents ...) has no
     value in the simulation: it shows a PLANT ESTIMATE (marked with a small dot) from the live values (bed temperature, air
     flows, furnace pressure, fans in service), anchored to the 150 MW snapshot 7.PNG / 9.png / 38.PNG (ASSUMED proportions,
     written next to each). Click = its line of the I/O list.
   Three graphic styles (STYLE buttons in the navigation bar, remembered): CUTAWAY (default), STEEL, THERMAL. One pipe renderer:
   every duct and pipe one continuous path with rounded elbows, drawn in layers over all pipes (walls, insides, highlights), a
   pipe that crosses another is drawn over it with a gap (a bridge). Everything that moves follows the live signal.
   plant.js draws a system with `v2: true` through PLANT_V2.draw. */
(function () {
  /* palette of the current style (filled from STYLES at each draw) */
  const C = {};
  const NS = 'http://www.w3.org/2000/svg';
  const S_ = (t, a) => {
    const e = document.createElementNS(NS, t);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    return e;
  };
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  const UF = "Barlow, 'IBM Plex Sans', 'Segoe UI', Roboto, Arial, sans-serif",
    MF = "'Roboto Mono', 'JetBrains Mono', Consolas, monospace";
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------- geometry of the Air & Flue Gas screen (process area, drawn OY px under the title and alarm bar) ---------- */
  const OY = 56;
  /* media: air cold air, hot hot air, faa fluidizing air, gas / gasm / gasc flue gas hot / after the backpass / after the APH,
     sol solids, fw water, mix water and steam (risers), stm steam, rh reheat steam.
     flow signal: G IDF running, S SAF, P PAF, F FA air flow, W feedwater flow, M steam flow. br = drawn over the others (bridge) */
  const DUCTS = [
    /* flue gas */
    { m: 'gas', w: 30, f: 'G', pts: [[410, 142], [454, 142]] },
    { m: 'gas', w: 24, f: 'G', pts: [[492, 106], [492, 72], [722, 72], [722, 94]] },
    { m: 'gasm', w: 24, f: 'G', pts: [[820, 582], [820, 612], [1210, 612], [1210, 674]] },
    { m: 'gasc', w: 24, f: 'G', pts: [[1210, 780], [1210, 800], [1292, 800]] },
    { m: 'gasc', w: 22, f: 'G', pts: [[1488, 800], [1532, 800], [1532, 874]] },
    { m: 'gasc', w: 20, f: 'G', pts: [[1566, 892], [1606, 892]] },
    /* solids: seal pot back to the furnace */
    { m: 'sol', w: 10, f: 'F', pts: [[448, 470], [410, 470]] },
    /* primary air: silencer, venturi, inlet damper, PAF, APH PA sector, hot PA to the plenum; branches to the coal feeders / pipes */
    { m: 'air', w: 14, f: 'P', pts: [[628, 820], [796, 820]] },
    { m: 'air', w: 14, f: 'P', pts: [[836, 800], [1055, 800], [1055, 782]] },
    { m: 'air', w: 6, f: 'P', pts: [[940, 800], [940, 828]] },
    { m: 'hot', w: 14, f: 'P', pts: [[1055, 672], [1055, 660], [460, 660], [460, 712], [370, 712]] },
    { m: 'hot', w: 7, f: 'P', pts: [[484, 660], [484, 700]] },
    /* secondary air: SAF, APH SA sector, hot SA to the wall ports; branch to the start-up burners */
    { m: 'air', w: 14, f: 'S', pts: [[628, 930], [796, 930]] },
    { m: 'air', w: 14, f: 'S', pts: [[836, 910], [1125, 910], [1125, 782]] },
    { m: 'hot', w: 14, f: 'S', pts: [[1125, 672], [1125, 640], [424, 640], [424, 600], [411, 600]] },
    { m: 'hot', w: 6, f: 'S', pts: [[438, 640], [438, 678], [377, 678]] },
    /* fluidizing air: FA blowers A / B, check valves, header to the seal pots (crosses the hot air ducts) */
    { m: 'faa', w: 6, f: 'F', pts: [[232, 930], [284, 930]] },
    { m: 'faa', w: 6, f: 'F', pts: [[392, 930], [444, 930]] },
    { m: 'faa', w: 7, f: 'F', pts: [[300, 914], [300, 876], [492, 876]] },
    { m: 'faa', w: 7, f: 'F', pts: [[460, 914], [460, 876]] },
    { m: 'faa', w: 7, f: 'F', pts: [[492, 876], [492, 496]], br: 1 },
    /* water and steam of the boiler */
    { m: 'fw', w: 5, f: 'W', pts: [[247, 64], [247, 80], [222, 80], [222, 650], [262, 650]] },
    { m: 'mix', w: 4, f: 'M', pts: [[285, 102], [285, 64]] },
    { m: 'mix', w: 4, f: 'M', pts: [[325, 102], [325, 64]] },
    { m: 'mix', w: 4, f: 'M', pts: [[365, 102], [365, 64]] },
    { m: 'stm', w: 5, f: 'M', pts: [[261, 36], [261, 12], [214, 12]] },
    { m: 'fw', w: 5, f: 'W', pts: [[952, 280], [972, 280], [972, 6], [395, 6], [395, 36]], br: 1 },
    { m: 'fw', w: 5, f: 'W', pts: [[1290, 470], [952, 470]] },
    { m: 'rh', w: 5, f: 'M', pts: [[760, 30], [760, 100]] },
    { m: 'rh', w: 5, f: 'M', pts: [[700, 108], [700, 30]], br: 1 },
    { m: 'stm', w: 5, f: 'M', pts: [[1290, 50], [900, 50], [900, 100]] },
    { m: 'stm', w: 5, f: 'M', pts: [[930, 100], [930, 70], [1290, 70]] }
  ];
  /* tube banks of the backpass (k: medium inside the tubes) */
  const BANKS = [
    { n: 'RH-1', x: 692, y: 108, w: 120, h: 36, k: 'rh' },
    { n: 'RH-2', x: 692, y: 156, w: 120, h: 36, k: 'rh' },
    { n: 'RH-3', x: 692, y: 204, w: 120, h: 36, k: 'rh' },
    { n: 'RH-4', x: 692, y: 252, w: 120, h: 36, k: 'rh' },
    { n: 'ECO #2R', x: 692, y: 324, w: 120, h: 56, k: 'fw' },
    { n: 'FINISH S/H-1', x: 830, y: 108, w: 120, h: 36, k: 'stm' },
    { n: 'FINISH S/H-2', x: 830, y: 156, w: 120, h: 36, k: 'stm' },
    { n: 'FINISH S/H-3', x: 830, y: 204, w: 120, h: 36, k: 'stm' },
    { n: 'ECO #3 UPPER', x: 830, y: 252, w: 120, h: 32, k: 'fw' },
    { n: 'ECO #3 LOWER', x: 830, y: 296, w: 120, h: 32, k: 'fw' },
    { n: 'ECO #2S', x: 830, y: 340, w: 120, h: 40, k: 'fw' },
    { n: 'ECO #1', x: 692, y: 438, w: 258, h: 56, k: 'fw' }
  ];
  /* fans: run state from the logic (memory list M.3302 PAF / M.3303 SAF / M.3304 IDF; FA blowers by their tag) */
  const FANS = [
    { tag: 'F-1053 PAF', name: 'PAF  F-1053', cx: 816, cy: 820, r: 24, out: 836 },
    { tag: 'F-1054 SAF', name: 'SAF  F-1054', cx: 816, cy: 930, r: 24, out: 836 },
    { tag: 'F-1056 IDF', name: 'IDF  F-1056', cx: 1540, cy: 900, r: 26, idf: 1 },
    { tag: 'F-1055A FA BLOWER-A', name: 'FAB-A  F-1055A', cx: 300, cy: 930, r: 15, small: 1 },
    { tag: 'F-1055B FA BLOWER-B', name: 'FAB-B  F-1055B', cx: 460, cy: 930, r: 15, small: 1 }
  ];
  /* dampers: click = the faceplate of its controller; hor = a row of louvres across a pass (the gas biasing dampers) */
  const DAMPERS = [
    { tag: 'MCVFA10531', x: 760, y: 820, w: 14, ref: 'mv:FICFA1071', fp: 'FICFA1071', desc: 'PAF inlet flow control damper MCV-FA1053-1' },
    { tag: 'MCVFA10541', x: 760, y: 930, w: 14, ref: 'mv:FICFA1081', fp: 'FICFA1081', desc: 'SAF inlet flow control damper MCV-FA1054-1' },
    { tag: 'PCDFG10561', x: 1532, y: 846, w: 22, ref: 'mv:PICFG108A', fp: 'PICFG108A', desc: 'IDF inlet vane control damper PCD-FG1056-1' },
    { tag: 'FCVFA1055A1', x: 258, y: 930, w: 6, ref: 'mv:FICFA1055A', fp: 'FICFA1055A', desc: 'FA blower-A inlet flow control damper FCV-FA1055-A1' },
    { tag: 'FCVFA1055B1', x: 418, y: 930, w: 6, ref: 'mv:FICFA1055B', fp: 'FICFA1055B', desc: 'FA blower-B inlet flow control damper FCV-FA1055-B1' },
    { tag: 'HICHR1002A', x: 752, y: 410, len: 112, ref: 'mv:HICHR1002A', fp: 'HICHR1002A', desc: 'RH pass flue gas biasing dampers TCV-FG1116-A ~ D', hor: 1 },
    { tag: 'HICHR1002B', x: 890, y: 410, len: 112, ref: 'mv:HICHR1002B', fp: 'HICHR1002B', desc: 'SH pass flue gas biasing dampers TCV-FG1117-A ~ D', hor: 1 }
  ];
  /* measured values: [x, y (top left), tag, unit, dp, description, ref | null, I/O address 'stn|addr', point of measurement] */
  const TAGS = [
    /* drum and furnace */
    [12, 598, 'LICBR1001', 'mm', 1, 'Drum level (compensated)', 'pv:LICBR1001', '1|AI0130', null],
    [12, 624, 'PIBR10011', 'kg/cm²', 1, 'Drum pressure', null, '1|AI0128', null],
    [12, 474, 'PIFG1085', 'mmH2O', 1, 'Furnace pressure (A)', null, '1|AI0132', null],
    [12, 500, 'PIFG1086', 'mmH2O', 1, 'Furnace pressure (B)', null, '1|AI0260', null],
    [12, 526, 'PIFG10871', 'mmH2O', 1, 'Furnace pressure (C)-1', null, '1|AI0388', null],
    [12, 552, 'PIFG10872', 'mmH2O', 1, 'Furnace pressure (C)-2', null, '1|AI0773', null],
    [12, 298, 'DPIFG1081', 'mmH2O', 0, 'Plenum / upper layer DP (A)', null, '1|AI0134', null],
    [12, 324, 'DPIFG1082', 'mmH2O', 0, 'Plenum / upper layer DP (B)', null, '1|AI0262', null],
    [12, 350, 'DPIFG1084', 'mmH2O', 0, 'Plenum / lower layer DP (1)', null, '1|AI0390', null],
    [12, 376, 'DPIFG1184', 'mmH2O', 0, 'Plenum / lower layer DP (2)', null, '1|AI0449', null],
    [12, 402, 'DPIFG1083', 'mmH2O', 0, 'Lower / upper layer DP (1)', null, '1|AI0389', null],
    [12, 428, 'DPIFG1183', 'mmH2O', 0, 'Lower / upper layer DP (2)', null, '1|AI0448', null],
    [12, 670, 'FIFA1043A', 'T/H', 1, 'Burner-A hot SA flow', null, '1|AI0164', null],
    [12, 696, 'FIFA1043B', 'T/H', 1, 'Burner-B hot SA flow', null, '1|AI0290', null],
    [12, 722, 'FIFA1043C', 'T/H', 1, 'Burner-C hot SA flow', null, '1|AI0403', null],
    [12, 748, 'FIFA1043D', 'T/H', 1, 'Burner-D hot SA flow', null, '1|AI0597', null],
    /* cyclones and seal pots */
    [548, 200, 'TIFG1092A', '°C', 0, 'Cyclone-A inlet gas', null, '1|AI0659', [440, 142]],
    [548, 226, 'TIFG1092B', '°C', 0, 'Cyclone-B inlet gas', null, '1|AI0675', [444, 142]],
    [548, 96, 'TIFG1095A', '°C', 0, 'Cyclone-A outlet gas (1)', null, '1|AI0660', [520, 72]],
    [548, 122, 'TIFG1096A', '°C', 0, 'Cyclone-A outlet gas (2)', null, '1|AI0676', [530, 72]],
    [548, 148, 'TIFG1095B', '°C', 0, 'Cyclone-B outlet gas (1)', null, '1|AI0661', [540, 72]],
    [548, 174, 'TIFG1096B', '°C', 0, 'Cyclone-B outlet gas (2)', null, '1|AI0677', [550, 72]],
    [548, 308, 'PIFG1009A1', 'mmH2O', 0, 'Seal pot-A fluidized (1)', null, '1|AI0146', [538, 446]],
    [548, 334, 'PIFG1009A2', 'mmH2O', 0, 'Seal pot-A fluidized (2)', null, '1|AI0401', [538, 486]],
    [548, 360, 'PIFG1009B1', 'mmH2O', 0, 'Seal pot-B fluidized (1)', null, '1|AI0147', [538, 450]],
    [548, 386, 'PIFG1009B2', 'mmH2O', 0, 'Seal pot-B fluidized (2)', null, '1|AI0402', [538, 490]],
    [548, 256, 'TIFG1009A', '°C', 0, 'Seal pot-A temperature', null, '1|AI0594', [538, 470]],
    [548, 282, 'TIFG1009B', '°C', 0, 'Seal pot-B temperature', null, '1|AI0662', [538, 474]],
    /* backpass: gas temperature at the inlet of each bank (RH pass | SH pass) */
    [990, 100, 'TIFG1100', '°C', 0, 'RH-1 inlet gas', null, '4|AI0448', [812, 108]],
    [990, 148, 'TIFG1102', '°C', 0, 'RH-2 inlet gas', null, '4|AI0449', [812, 156]],
    [990, 196, 'TIFG1104', '°C', 0, 'RH-3 inlet gas', null, '4|AI0464', [812, 204]],
    [990, 244, 'TIFG1106', '°C', 0, 'RH-4 inlet gas', null, '4|AI0465', [812, 252]],
    [990, 316, 'TIFG1108', '°C', 0, 'ECO #2R inlet gas', null, '4|AI0450', [812, 324]],
    [990, 364, 'TIFG1110', '°C', 0, 'ECO #2R outlet gas', null, '4|AI0466', [812, 382]],
    [1150, 100, 'TIFG1101', '°C', 0, 'Finish S/H-1 inlet gas', null, '4|AI0453', [950, 108]],
    [1150, 148, 'TIFG1103', '°C', 0, 'Finish S/H-2 inlet gas', null, '4|AI0454', [950, 156]],
    [1150, 196, 'TIFG1105', '°C', 0, 'Finish S/H-3 inlet gas', null, '4|AI0469', [950, 204]],
    [1150, 244, 'TIFG1107', '°C', 0, 'ECO #3 upper inlet gas', null, '4|AI0452', [950, 252]],
    [1150, 290, 'TIFG1109', '°C', 0, 'ECO #3 lower inlet gas', null, '4|AI0468', [950, 296]],
    [1150, 334, 'TIFG1111', '°C', 0, 'ECO #2S inlet gas', null, '4|AI0451', [950, 340]],
    [1150, 364, 'TIFG1113', '°C', 0, 'ECO #2S outlet gas', null, '4|AI0467', [950, 382]],
    /* steam and water of the backpass */
    [1306, 34, 'TIBR11401', '°C', 1, 'SH no.2 outlet (to finish S/H)', null, '1|AI0610', null],
    [1306, 60, 'TIMS10041', '°C', 1, 'Finish S/H outlet main steam', null, '1|AI0612', null],
    [1306, 86, 'PIMS1002', 'kg/cm²', 1, 'Finish S/H outlet main steam', null, '1|AI0131', null],
    [1306, 120, 'TICR1004', '°C', 1, 'Cold reheat steam', null, '2|AI0900', null],
    [1306, 146, 'PICR1006', 'kg/cm²', 1, 'Reheat inlet header', null, '2|AI0529', null],
    [1306, 172, 'TIHR10021', '°C', 1, 'Reheat outlet header (1)', null, '2|AI0867', null],
    [1306, 198, 'PIHR10031', 'kg/cm²', 1, 'Hot reheat steam (1)', null, '2|AI0421', null],
    [1306, 232, 'FIFW10071', 'T/H', 1, 'Feedwater flow (1)', null, '1|AI0256', null],
    [1306, 258, 'TIFW1160', '°C', 1, 'ECO #1 inlet water', null, '1|AI0592', null],
    /* APH inlet gas, APH outlet gas */
    [990, 500, 'PIFG1121', 'mmH2O', 0, 'APH inlet gas pressure', null, '1|AI0162', [1210, 640]],
    [1120, 500, 'DPIFG10525', 'mmH2O', 0, 'APH differential pressure', null, '1|AI0768', [1210, 700]],
    [990, 526, 'TIFG1124', '°C', 0, 'APH inlet gas (A)', null, '1|AI0658', [1210, 640]],
    [1120, 526, 'TIFG1125', '°C', 0, 'APH inlet gas (B)', null, '1|AI0674', [1210, 640]],
    [990, 552, 'AIFG1122', '%', 1, 'APH inlet O2 (A)', null, '1|AI0273', [1210, 640]],
    [1120, 552, 'AIFG1123', '%', 1, 'APH inlet O2 (B)', null, '1|AI0433', [1210, 640]],
    [1146, 812, 'TIFG1132', '°C', 0, 'APH outlet gas (A)', null, '1|AI0578', [1210, 790]],
    [1146, 838, 'TIFG1133', '°C', 0, 'APH outlet gas (B)', null, '1|AI0626', [1210, 790]],
    [1146, 864, 'PIFG1134', 'mmH2O', 0, 'APH outlet gas pressure', null, '1|AI0163', [1210, 790]],
    [1146, 890, 'AIFG1131', '%', 1, 'APH outlet O2', null, '1|AI0455', [1210, 790]],
    [1282, 684, 'TIFA1052', '°C', 0, 'APH hot SA average', null, '3|AI0402', null],
    [1412, 684, 'IIFA1052M1', 'A', 1, 'APH main drive motor', null, '3|AI0470', null],
    [1282, 710, 'PISB1040', 'kg/cm²', 1, 'APH hot end soot blow steam', null, '2|AI0549', null],
    [1412, 710, 'PISB1042', 'kg/cm²', 1, 'APH cold end soot blow steam', null, '2|AI0550', null],
    /* hot air to the furnace */
    [426, 594, 'TIFA1086', '°C', 0, 'APH outlet hot SA (A)', null, '1|AI0657', [560, 640]],
    [554, 594, 'TIFA1087', '°C', 0, 'APH outlet hot SA (B)', null, '1|AI0673', [580, 640]],
    [682, 594, 'PIFA1088', 'mmH2O', 0, 'APH outlet hot SA press', null, '1|AI0289', [700, 640]],
    [580, 674, 'FIFA1079', 'T/H', 1, 'APH outlet hot PA flow', null, '1|AI0166', [600, 660]],
    [710, 674, 'TIFA1076', '°C', 0, 'APH outlet hot PA (A)', null, '1|AI0656', [720, 660]],
    [840, 674, 'TIFA1077', '°C', 0, 'APH outlet hot PA (B)', null, '1|AI0672', [850, 660]],
    [580, 700, 'PIFA1078', 'mmH2O', 0, 'APH outlet hot PA press', null, '1|AI0161', [620, 660]],
    /* PAF and SAF */
    [628, 744, 'FIFA1071', 'T/H', 1, 'PAF inlet air flow', null, '1|AI0484', [700, 820]],
    [628, 770, 'TIFA1072', '°C', 0, 'PAF inlet air temp', null, '1|AI0580', [690, 820]],
    [628, 848, 'FIFA1081', 'T/H', 1, 'SAF inlet air flow', null, '1|AI0513', [700, 930]],
    [628, 874, 'TIFA1082', '°C', 0, 'SAF inlet air temp', null, '1|AI0628', [690, 930]],
    [990, 816, 'TIFA1073', '°C', 0, 'PAF outlet air (A)', null, '1|AI0576', [1000, 800]],
    [990, 842, 'TIFA1074', '°C', 0, 'PAF outlet air (B)', null, '1|AI0624', [1010, 800]],
    [990, 868, 'PIFA1075', 'mmH2O', 0, 'PAF outlet air press', null, '1|AI0160', [1020, 800]],
    [862, 944, 'TIFA1083', '°C', 0, 'SAF outlet air (A)', null, '1|AI0577', [900, 910]],
    [992, 944, 'TIFA1084', '°C', 0, 'SAF outlet air (B)', null, '1|AI0625', [1000, 910]],
    [862, 968, 'PIFA1085', 'mmH2O', 0, 'SAF outlet air press', null, '1|AI0288', [920, 910]],
    /* FA blowers */
    [232, 790, 'PIFA1055A', 'mmH2O', 0, 'FA blower-A outlet press', null, '1|AI0294', [300, 890]],
    [232, 816, 'TIFA1055A', '°C', 0, 'FA blower-A outlet temp', null, '1|AI0579', [300, 896]],
    [232, 842, 'ZIFA1055A1', '%', 1, 'FA blower-A inlet damper pos.', null, '1|AI0176', [258, 930]],
    [360, 790, 'PIFA1055B', 'mmH2O', 0, 'FA blower-B outlet press', null, '1|AI0417', [460, 890]],
    [360, 816, 'TIFA1055B', '°C', 0, 'FA blower-B outlet temp', null, '1|AI0627', [460, 896]],
    [360, 842, 'ZIFA1055B1', '%', 1, 'FA blower-B inlet damper pos.', null, '1|AI0196', [418, 930]],
    [500, 772, 'FIFA1055', 'T/H', 1, 'FA blower common outlet flow', null, '1|AI0545', [492, 800]],
    /* ESP outlet, IDF, hydraulic coupling */
    [1306, 560, 'PIFG1141A', 'mmH2O', 0, 'ESP outlet to IDF gas (1)', null, '1|AI0416', [1500, 800]],
    [1436, 560, 'PIFG1141B', 'mmH2O', 0, 'ESP outlet to IDF gas (2)', null, '1|AI0772', [1510, 800]],
    [1306, 470, 'ZILO1756', '%', 1, 'IDF hydraulic coupling scoop', 'ABC-008|AI0482', '1|AI0482', null],
    [1436, 470, 'SILO1756', 'rpm', 0, 'IDF speed (coupling output)', null, '1|AI0481', null],
    [1306, 496, 'IIF1056', 'A', 1, 'IDF motor current', null, '3|AI0453', null],
    [1436, 496, 'ZIFG10561', '%', 1, 'IDF inlet vane position', null, '1|AI0194', [1532, 846]],
    [1306, 522, 'PIFG1151', 'mmH2O', 0, 'IDF outlet gas press', null, '1|AI0432', [1590, 892]],
    [1436, 522, 'TIFG1152', '°C', 0, 'IDF outlet to stack gas', null, '1|AI0593', [1596, 892]]
  ];
  /* values that no DCS logic sheet uses: the plant estimate from the live values E (snapshot anchors, ASSUMED proportions).
     kb = bed temperature rise over the 150 MW one (7.PNG average 937 C), gas = (PA + SA + FA) / 594 T/H with the IDF running,
     pa / sa / fa = the flow over the 7.PNG / 9.png one */
  const EST = {
    /* gas temperatures: ambient + (snapshot - ambient) x kb; after a heat exchanger also a little lower at low gas flow */
    TIFG1092A: E => E.T(905, 0),
    TIFG1092B: E => E.T(900, 0),
    TIFG1095A: E => E.T(882, 0),
    TIFG1096A: E => E.T(855, 0),
    TIFG1095B: E => E.T(873, 0),
    TIFG1096B: E => E.T(846, 0),
    TIFG1009A: E => E.T(870, 0),
    TIFG1009B: E => E.T(870, 0),
    TIFG1100: E => E.T(861, 1),
    TIFG1101: E => E.T(850, 1),
    TIFG1102: E => E.T(657, 1),
    TIFG1103: E => E.T(691, 1),
    TIFG1104: E => E.T(504, 1),
    TIFG1105: E => E.T(583, 1),
    TIFG1106: E => E.T(443, 1),
    TIFG1107: E => E.T(501, 1),
    TIFG1108: E => E.T(388, 1),
    TIFG1109: E => E.T(425, 1),
    TIFG1110: E => E.T(359, 1),
    TIFG1111: E => E.T(383, 1),
    TIFG1113: E => E.T(369, 1),
    TIFG1124: E => E.T(313, 1),
    TIFG1125: E => E.T(317, 1),
    TIFG1132: E => E.T(146, 1),
    TIFG1133: E => E.T(134, 1),
    TIFG1152: E => E.T(148, 1),
    TIFA1052: E => E.T(287, 1),
    /* gas path pressures: furnace pressure + (snapshot drop) x gas^2 (IDF stopped: open to the stack) */
    PIFG10872: E => E.pf,
    PIFG1121: E => E.P(-233),
    PIFG1134: E => E.P(-372),
    PIFG1141A: E => E.P(-442),
    PIFG1141B: E => E.P(-450),
    PIFG1151: E => (E.idf ? -7 * E.g * E.g : 0),
    DPIFG10525: E => 113 * E.g * E.g,
    PIFG1009A1: E => E.P(-82),
    PIFG1009B1: E => E.P(-84),
    /* seal pot bottom: the solids head, fluidized by the FA air (9.png 465 / 382; 7.PNG 533 / 308) */
    PIFG1009A2: E => E.pf + 549 * clamp(E.fa, 0, 1.2),
    PIFG1009B2: E => E.pf + 324 * clamp(E.fa, 0, 1.2),
    /* bed DPs: distributor and bed, with the primary air (7.PNG) */
    DPIFG1084: E => 1016 * clamp(E.pa, 0, 1.3) ** 2,
    DPIFG1184: E => 1014 * clamp(E.pa, 0, 1.3) ** 2,
    DPIFG1083: E => 70 * clamp(E.pa, 0, 1.3),
    DPIFG1183: E => 41 * clamp(E.pa, 0, 1.3),
    /* air side: fan heat (outlet = inlet + rise x flow^2), pressures x flow^2 */
    TIFA1073: E => (E.paf ? E.tpa + 31 * clamp(E.pa, 0, 1.3) ** 2 : E.tpa),
    TIFA1074: E => (E.paf ? E.tpa + 32 * clamp(E.pa, 0, 1.3) ** 2 : E.tpa),
    TIFA1083: E => (E.saf ? E.tsa + 24 * clamp(E.sa, 0, 1.3) ** 2 : E.tsa),
    TIFA1084: E => (E.saf ? E.tsa + 24 * clamp(E.sa, 0, 1.3) ** 2 : E.tsa),
    PIFA1075: E => (E.paf ? 1551 * clamp(E.pa, 0, 1.3) ** 2 : 0),
    PIFA1078: E => (E.paf ? 1444 * clamp(E.pa, 0, 1.3) ** 2 : 0),
    PIFA1055A: E => (E.fabA ? 3257 : 0),
    PIFA1055B: E => (E.fabB ? 3315 : 0),
    TIFA1055A: E => (E.fabA ? E.tpa + 51 : E.tpa),
    TIFA1055B: E => (E.fabB ? E.tpa + 46 : E.tpa),
    /* motor currents: no-load share + load x flow^3 (7.PNG / 9.png), 0 stopped */
    IIF1056: E => (E.idf ? 199.6 * (0.3 + 0.7 * clamp(E.g, 0, 1.3) ** 3) : 0),
    IIF1053: E => (E.paf ? 253.6 * (0.3 + 0.7 * clamp(E.pa, 0, 1.3) ** 3) : 0),
    IIF1054: E => (E.saf ? 134 * (0.3 + 0.7 * clamp(E.sa, 0, 1.3) ** 3) : 0),
    IIF1055A: E => (E.fabA ? 37.3 : 0),
    IIF1055B: E => (E.fabB ? 37.3 : 0),
    IIFA1052M1: E => (E.idf ? 4.7 : 0),
    SILO1756: E => (E.idf ? 872 * clamp(E.scoop / 46.1, 0, 2.2) ** 0.5 : 0),
    PISB1040: () => 0,
    PISB1042: () => 0,
    /* APH outlet O2 (7.PNG 19.2 % at 4.3 % inlet: the snapshot analyzer, kept) */
    AIFG1131: E => (E.idf && E.o2 != null ? E.o2 + (21 - E.o2) * 0.892 : 21),
    /* stack CEMS (7.PNG): O2 from the APH inlet, NOx with the bed temperature, CO above 0 only with little O2 */
    AIFG10574: E => (E.idf && E.o2 != null ? E.o2 * (4.0 / 4.3) : 21),
    AIFG10572: E => (E.idf ? 69 * clamp(E.kb, 0, 1.3) ** 2 : 0),
    AIFG10573: E => (E.idf && E.o2 != null && E.kb > 0.3 ? Math.max(0, 2.5 - E.o2) * 150 : 0),
    AIFG10575: E => 2.9 * clamp(E.g, 0, 1.3),
    AIFG10576: E => 12.5 * clamp(E.g, 0, 1.3),
    FIFG10577: E => 21.5 * E.g,
    TIFG10578: E => E.T(50, 0)
  };
  /* stack CEMS rows of the side panel: tag, label, unit, dp, I/O */
  const CEMS = [
    ['AIFG10574', 'O2', '%', 1, '1|AI0469'],
    ['AIFG10572', 'NOx', 'ppm', 0, '1|AI0468'],
    ['AIFG10573', 'CO', 'ppm', 0, '1|AI0467'],
    ['AIFG10571', 'SOx', 'ppm', 0, '1|AI0466'],
    ['AIFG10575', 'Dust', 'mg/m³', 1, '1|AI0464'],
    ['AIFG10576', 'Opacity', '%', 1, '1|AI0465'],
    ['FIFG10577', 'Gas velocity', 'm/s', 1, '1|AI0471'],
    ['TIFG10578', 'Gas temp', '°C', 0, '1|AI0470']
  ];
  /* controllers on the mimic: x, y, tag, service */
  const CHIPS = [
    [862, 744, 'FICFA1071', 'Primary air flow / PAF inlet damper'],
    [862, 846, 'FICFA1081', 'Secondary air flow / SAF inlet damper'],
    [1306, 404, 'PICFG108A', 'Furnace pressure / IDF inlet vane'],
    [1436, 404, 'PICFG108', 'Furnace pressure / IDF hydraulic coupling']
  ];
  const NOTES = [
    [325, 778, 'BOTTOM ASH ↓ ASH COOLERS', 'middle'],
    [936, 840, '→ FEEDERS', 'end'],
    [490, 716, '→ COAL PIPES', 'start'],
    [210, 16, 'SAT. STEAM → SH NO.1 / NO.2', 'end'],
    [764, 26, 'COLD RH IN ↓', 'start'],
    [696, 26, 'HOT RH OUT ↑', 'end'],
    [1296, 47, 'FROM SH NO.2 (after spray)', 'end'],
    [1296, 82, 'MAIN STEAM → TURBINE', 'end'],
    [1296, 466, 'FEEDWATER → ECO #1', 'end'],
    [720, 631, 'HOT SA → FRONT / REAR WALL PORTS (22 × MCV-FA1005 ~ 1026) AND START-UP BURNERS', 'middle'],
    [1300, 886, 'FLY ASH ↓', 'start'],
    [1210, 836, '', 'middle']
  ];

  /* ---------- drawing helpers ---------- */
  const legs = p => p.slice(1).map((b, i) => [p[i], b]);
  const plen = p => legs(p).reduce((s, [a, b]) => s + Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]), 0);
  /* one continuous path through orthogonal points, every elbow rounded (radius r, limited by the legs) */
  function roundPath(p, r) {
    let d = 'M' + p[0][0] + ' ' + p[0][1];
    for (let i = 1; i < p.length - 1; i++) {
      const [a, b, c] = [p[i - 1], p[i], p[i + 1]],
        l1 = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]),
        l2 = Math.abs(c[0] - b[0]) + Math.abs(c[1] - b[1]),
        rr = Math.min(r, l1 / 2, l2 / 2),
        u1 = [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])],
        u2 = [Math.sign(c[0] - b[0]), Math.sign(c[1] - b[1])];
      d += ` L${b[0] - u1[0] * rr} ${b[1] - u1[1] * rr} Q${b[0]} ${b[1]} ${b[0] + u2[0] * rr} ${b[1] + u2[1] * rr}`;
    }
    const e = p[p.length - 1];
    return d + ` L${e[0]} ${e[1]}`;
  }
  const ductPath = d => roundPath(d.pts, Math.max(8, d.w * 1.1));
  const T = (x, y, s, o) => {
    o = o || {};
    return `<text x="${x}" y="${y}" font-family="${o.mono ? MF : UF}" font-size="${o.z || 10}"${o.b ? ` font-weight="${o.b === 1 ? 600 : o.b}"` : ''} fill="${o.c || C.text}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.k ? ` data-k="${o.k}"` : ''}>${esc(s)}</text>`;
  };
  const R = (x, y, w, h, f, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${o == null ? ` stroke="${C.ol}" stroke-width="${C.olw}"` : o}/>`;
  const P = (d, f, o) => `<path d="${d}" fill="${f}"${o == null ? ` stroke="${C.ol}" stroke-width="${C.olw}"` : o}/>`;
  const NAME = (x, y, s, a, sub) => T(x, y, s, { z: 10, b: 700, c: C.name, a: a || 'middle', ls: 0.6 }) + (sub ? T(x, y + 11, sub, { z: 8, c: C.dim, a: a || 'middle' }) : '');
  /* serpentine tube bank */
  const bankPath = b => {
    let d = '';
    const n = Math.max(2, Math.floor((b.h - 4) / 5));
    for (let i = 0; i < n; i++) {
      const yy = b.y + 3 + i * ((b.h - 6) / (n - 1));
      d += (i ? ' L' : 'M') + (i % 2 ? b.x + b.w - 4 : b.x + 4) + ' ' + yy.toFixed(1) + ' L' + (i % 2 ? b.x + 4 : b.x + b.w - 4) + ' ' + yy.toFixed(1);
    }
    return d;
  };
  /* outlines of the equipment */
  const FUR = 'M240 102 H410 V620 L368 690 H282 L240 620 Z',
    FURIN = 'M246 108 H404 V618 L365 684 H285 L246 618 Z',
    CYC = 'M452 104 H532 V250 L502 362 H482 L452 250 Z',
    SEAL = 'M446 432 H538 V492 Q538 500 530 500 H454 Q446 500 446 492 Z',
    BP = 'M680 94 H960 V510 L846 580 H794 L680 510 Z',
    ESPB = 'M1292 776 L1306 756 H1474 L1488 776 V824 L1474 844 H1306 L1292 824 Z',
    STK = 'M1606 912 L1612 130 H1646 L1652 912 Z';
  const espHop = i => {
    const x = 1312 + i * 40;
    return `M${x} 844 H${x + 34} L${x + 22} 870 H${x + 12} Z`;
  };
  /* solids spiralling down the cyclone wall */
  const VORTEX = (() => {
    let sp = 'M456 130';
    for (let k = 0; k < 8; k++) {
      const y = 130 + k * 26,
        wl = k < 4 ? 35 : 35 - (k - 3) * 6;
      sp += ` Q492 ${y + 6} ${492 + wl} ${y + 13} Q492 ${y + 20} ${492 - wl} ${y + 26}`;
    }
    return sp + ' L492 362 L492 430';
  })();
  const vortex = (col, n, glow) => {
    let s = '<g data-k="vortex">';
    for (let i = 0; i < n; i++) s += `<circle r="1.7" fill="${col}"${glow ? ' filter="url(#h2glow)"' : ''}><animateMotion dur="4.5s" begin="-${(i * (4.5 / n)).toFixed(2)}s" repeatCount="indefinite" path="${VORTEX}"/></circle>`;
    return s + '</g>';
  };
  /* solids rising in the furnace (the circulating bed) */
  const rising = (col, n, glow, op) => {
    let s = '<g data-k="solids">';
    for (let i = 0; i < n; i++) {
      const cx = 254 + ((i * 29) % 144),
        d = 3 + (i % 5) * 0.6,
        y0 = 600 - (i % 3) * 14,
        b = ((i * 0.37) % d).toFixed(2);
      s += `<circle cx="${cx}" cy="${y0}" r="${1.2 + (i % 3) * 0.5}" fill="${col}" opacity="${op}"${glow ? ' filter="url(#h2glow)"' : ''}><animate attributeName="cy" values="${y0};${118 + (i % 4) * 8}" dur="${d.toFixed(1)}s" begin="-${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="${op};${op * 0.6};0" dur="${d.toFixed(1)}s" begin="-${b}s" repeatCount="indefinite"/></circle>`;
    }
    return s + '</g>';
  };
  /* gas going down the two passes of the backpass */
  const bpGas = (col, glow) => {
    let s = '<g data-k="bpgas">';
    for (let i = 0; i < 18; i++) s += `<circle cx="${690 + ((i * 31) % 262)}" r="1.5" fill="${col}" opacity="0.55"${glow ? ' filter="url(#h2glow)"' : ''}><animate attributeName="cy" values="100;560" dur="${(3.4 + (i % 4) * 0.4).toFixed(1)}s" begin="-${(i * 0.4).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
    return s + '</g>';
  };
  const smoke = (col, op, n) => {
    let s = '<g data-k="smoke">';
    for (let i = 0; i < n; i++)
      s += `<circle cx="1629" cy="128" r="6" fill="${col}" opacity="0" filter="url(#h2blur)"><animate attributeName="cy" values="128;40" dur="5s" begin="-${i}s" repeatCount="indefinite"/><animate attributeName="r" values="5;22" dur="5s" begin="-${i}s" repeatCount="indefinite"/><animate attributeName="opacity" values="${op};0" dur="5s" begin="-${i}s" repeatCount="indefinite"/><animate attributeName="cx" values="1629;1650" dur="5s" begin="-${i}s" repeatCount="indefinite"/></circle>`;
    return s + '</g>';
  };

  /* ================= the three styles ================= */
  /* each style: palette C, defs, pipe layers [colour (by medium), extra width (a fraction below 0 = w x (1 + it)), opacity,
     flow-dependent], flow marks, and the skin of the equipment (sk) */
  const STYLES = {};
  const MED_NAMES = [
    ['air', 'COLD AIR'],
    ['hot', 'HOT AIR'],
    ['faa', 'FA AIR'],
    ['sol', 'SOLIDS'],
    ['gas', 'GAS > 700 °C'],
    ['gasm', 'GAS 300~700'],
    ['gasc', 'GAS < 300 °C'],
    ['fw', 'WATER'],
    ['mix', 'WATER+STEAM'],
    ['stm', 'MAIN STEAM'],
    ['rh', 'REHEAT STM']
  ];
  /* ---- CUTAWAY: light engineering illustration, everything in section ---- */
  const CUTF = { air: '#cfe0ee', hot: '#f5d0a2', faa: '#d9e9f4', gas: '#ecc4b1', gasm: '#e3d2c6', gasc: '#d8dadc', sol: '#cfb58a', fw: '#b5dfca', mix: '#bfe0e2', stm: '#f3bcbc', rh: '#e0c4ec' },
    CUTD = { air: '#2c6aa0', hot: '#c2570c', faa: '#2c6aa0', gas: '#9a3f22', gasm: '#7a5546', gasc: '#5f6469', sol: '#7a5a22', fw: '#1e7a52', mix: '#2a7f86', stm: '#b42323', rh: '#7b3fa0' };
  STYLES.cut = {
    name: 'CUTAWAY',
    C: {
      bg: '#d5d9dc', frame: '#bfc5ca', alarmBar: '#cdd2d6', ol: '#3a434c', olw: 1.3, text: '#1b2127', name: '#26303a', lab: '#45505b', dim: '#5f6a75',
      unit: '#5f6a75', val: '#0e1317', sv: '#34495e', none: '#8a949d', box: '#f7f8f9', boxs: '#9aa5ae', chip: '#eceff1', chipS: '#9ea8b1',
      track: '#c3cad0', bar: '#3d6589', rule: '#aab3bb', run: '#c62828', stop: '#2e7d32', alarm: '#c62828', warn: '#a14a06', cas: '#1a5aa0',
      aut: '#3f4a55', ok: '#167a3b', off: '#e2e5e8', nav: '#e4e7ea', navOn: '#26303a', navOnT: '#ffffff', hover: '#d3d8dc',
      eq: '#f1f3f4', eqIn: '#7d8790', imp: '#3a434c', blade: '#1b2127', bedHot: '#ffffff', bedCold: '#26303a', lead: '#8a949d', est: '#7d6b3a',
      heat: v => (v >= 955 ? '#c2410c' : v >= 935 ? '#ea580c' : '#f59e0b'),
      med: m => CUTF[m], medD: m => CUTD[m]
    },
    defs: `<linearGradient id="h2furIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4e2cf"/><stop offset="0.55" stop-color="#f6c48a"/><stop offset="1" stop-color="#ef8a3a"/></linearGradient>
<linearGradient id="h2bpIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d8c8"/><stop offset="0.6" stop-color="#ece0d6"/><stop offset="1" stop-color="#e3e0dc"/></linearGradient>
<linearGradient id="h2wallX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d969e"/><stop offset="0.5" stop-color="#c3c9ce"/><stop offset="1" stop-color="#8d969e"/></linearGradient>
<linearGradient id="h2concX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a9adb0"/><stop offset="0.4" stop-color="#e3e5e6"/><stop offset="1" stop-color="#9da1a4"/></linearGradient>
<pattern id="h2hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#d9c3a5"/><line x1="0" y1="0" x2="0" y2="6" stroke="#a88a63" stroke-width="1.2"/></pattern>
<pattern id="h2wwall" width="5" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="10" fill="#c3c9ce"/><rect x="1" width="3" height="10" fill="#9fb9c4"/></pattern>
<pattern id="h2elem" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#e9ecee"/><path d="M0 6 L6 0" stroke="#8f9aa4" stroke-width="0.8"/></pattern>
<filter id="h2lift" x="-0.1" y="-0.1" width="1.2" height="1.3"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#2a3138" flood-opacity="0.22"/></filter>`,
    pipe: [
      [() => '#3a434c', 2.6, 1, 0],
      [m => CUTF[m], 0, 1, 1]
    ],
    flow(d, i) {
      const L = plen(d.pts),
        sp = d.m === 'sol' ? 40 : d.w < 8 ? 60 : 90,
        n = Math.max(2, Math.round(L / (d.w > 8 ? 26 : 22))),
        dur = L / sp,
        r = d.w > 14 ? 2 : d.w > 8 ? 1.7 : 1.1,
        path = ductPath(d);
      let s = `<g data-pg="${i}">`;
      const hor = d.pts[0][1] === d.pts[1][1],
        off = d.w > 12 ? [-d.w * 0.22, d.w * 0.22] : [0];
      off.forEach((o, k) => {
        for (let j = 0; j < n; j++)
          s += `<circle r="${r}" fill="${CUTD[d.m]}" opacity="0.8" transform="translate(${hor ? '0 ' + o : o + ' 0'})"><animateMotion dur="${dur.toFixed(2)}s" repeatCount="indefinite" begin="-${((dur * (j + k * 0.5)) / n).toFixed(2)}s" path="${path}"/></circle>`;
      });
      return s + '</g>';
    },
    sk: {
      shell: 'url(#h2wallX)', shellOl: '#3a434c', wwall: 'url(#h2wwall)', furIn: '#ece8e3', furHeat: 'url(#h2furIn)', bpIn: 'url(#h2bpIn)', bpHeat: '#f1c9a8', bpHeatOp: 0.5,
      cycIn: '#efe4d8', cycHeat: '#f0c8a8', seal: '#e9dcc6', sealSol: '#c8a56b', drum: '#f1f3f4', water: '#7fb0d8', aph: 'url(#h2elem)', aphHeat: '#f3c9a2',
      esp: '#f0f2f3', espPlate: '#7f8a94', stack: 'url(#h2concX)', bed: '#e5702a', fire: '#ea7a2c', particle: '#b4531a', vort: '#8a5a2a', bpDot: '#8a4a32', smoke: '#9aa1a7',
      tube: m => CUTD[m], tubeW: 1.5, lift: 1
    }
  };
  /* ---- STEEL: machined metal on a dark ground, cutaway windows ---- */
  const MS = {
    air: ['#33495e', '#5d7f9e', '#94b6d3'],
    hot: ['#523519', '#9a6e3e', '#c99a62'],
    faa: ['#2f4757', '#56788f', '#8fb1c8'],
    gas: ['#4a2a22', '#86584a', '#b08070'],
    gasm: ['#3b302d', '#6c5c56', '#8d7a72'],
    gasc: ['#36393c', '#686c71', '#8a8e93'],
    sol: ['#5a4a2f', '#6d5a3a', '#8a7450'],
    fw: ['#1f4a3a', '#3f7f66', '#7fbfa4'],
    mix: ['#25484c', '#4f8389', '#8ec3c8'],
    stm: ['#4a1f1f', '#8f3a3a', '#d27f7f'],
    rh: ['#3b2547', '#6e4a85', '#a986bf']
  };
  const grad = (id, c, v) => `<linearGradient id="${id}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="${v ? 1 : 0}"><stop offset="0" stop-color="${c[3]}"/><stop offset="0.3" stop-color="${c[1]}"/><stop offset="0.62" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[0]}"/></linearGradient>`;
  STYLES.steel = {
    name: 'STEEL',
    C: {
      bg: '#1c2229', frame: '#12171c', alarmBar: '#161b21', ol: '#0b0f13', olw: 0.8, text: '#e6ebef', name: '#d3dbe2', lab: '#aab6c1', dim: '#8793a0',
      unit: '#8995a1', val: '#f0f4f7', sv: '#b9c7d5', none: '#59636d', box: '#0c1014', boxs: '#3c4854', chip: '#20272e', chipS: '#46535f',
      track: '#38424c', bar: '#a3b6c8', rule: '#343f4a', run: '#e5484d', stop: '#3fa34d', alarm: '#e5484d', warn: '#f5a524', cas: '#6cb4ff',
      aut: '#c9d2db', ok: '#5ccf86', off: '#2f363d', nav: '#222a32', navOn: '#cdd6de', navOnT: '#12171c', hover: '#2b343e',
      eq: 'url(#h2steelY)', eqIn: '#55606b', imp: '#a9b5c1', blade: '#e3c06a', bedHot: '#ffd9a8', bedCold: '#d3dbe2', impFill: '#101418', lead: '#4f5b67', est: '#d8b26a',
      heat: v => (v >= 955 ? '#f97316' : v >= 935 ? '#fb923c' : '#fdba74'),
      med: m => MS[m][1], medD: m => MS[m][2]
    },
    defs:
      grad('h2steelX', ['#3f4852', '#8f9ba8', '#66717d', '#323a42'], 0) +
      grad('h2steelY', ['#3f4852', '#8f9ba8', '#66717d', '#323a42'], 1) +
      grad('h2darkY', ['#2f363d', '#626d78', '#47515b', '#262c32'], 1) +
      grad('h2concX', ['#5d6063', '#a7a9ab', '#86888a', '#4e5052'], 0) +
      `<pattern id="h2tubes" width="4" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="8" fill="#56616c"/><line x1="0.5" y1="0" x2="0.5" y2="8" stroke="#000" stroke-opacity="0.35" stroke-width="1"/></pattern>
<pattern id="h2elem" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#14181c"/><path d="M0 5 L5 0" stroke="#7b8794" stroke-width="0.9"/></pattern>
<radialGradient id="h2fire" cx="0.5" cy="0.9" r="0.95"><stop offset="0" stop-color="#ffd27a"/><stop offset="0.3" stop-color="#f08a24"/><stop offset="0.7" stop-color="#8f2c0c"/><stop offset="1" stop-color="#2a0d05"/></radialGradient>
<linearGradient id="h2bpHeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f2c0c" stop-opacity="0.75"/><stop offset="1" stop-color="#2a1a14" stop-opacity="0.4"/></linearGradient>
<filter id="h2lift" x="-0.2" y="-0.2" width="1.4" height="1.4"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.45"/></filter>`,
    pipe: [
      [() => '#0b0f13', 1.6, 1, 0],
      [m => MS[m][0], 0, 1, 1],
      [m => MS[m][1], -0.38, 1, 1],
      [m => MS[m][2], -0.78, 0.8, 1]
    ],
    flow(d, i) {
      if (d.m === 'sol') return `<g data-pg="${i}"><path d="${ductPath(d)}" fill="none" stroke="#c9a46a" stroke-width="2.4" stroke-dasharray="2 6" opacity="0.8"><animate attributeName="stroke-dashoffset" from="16" to="0" dur="1.6s" repeatCount="indefinite"/></path></g>`;
      return `<g data-pg="${i}"><path d="${ductPath(d)}" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="${Math.max(1.4, d.w * 0.4).toFixed(1)}" stroke-linecap="round" stroke-dasharray="${d.w < 8 ? '8 22' : '22 46'}"><animate attributeName="stroke-dashoffset" from="${d.w < 8 ? 30 : 68}" to="0" dur="0.8s" repeatCount="indefinite"/></path></g>`;
    },
    sk: {
      shell: 'url(#h2steelX)', shellOl: '#0b0f13', wwall: 'url(#h2tubes)', furIn: '#14181c', furHeat: 'url(#h2fire)', bpIn: '#14181c', bpHeat: 'url(#h2bpHeat)', bpHeatOp: 1,
      cycIn: '#14181c', cycHeat: '#7a2a0e', seal: '#14181c', sealSol: '#8a6a3a', drum: 'url(#h2steelY)', water: '#2f6fa3', aph: 'url(#h2elem)', aphHeat: '#7a3a10',
      esp: 'url(#h2steelX)', espPlate: '#0d1014', stack: 'url(#h2concX)', bed: '#c2621f', fire: '#f08a24', particle: '#ffd89a', vort: '#ffd89a', bpDot: '#ffb37a', smoke: '#c9cdd1',
      tube: m => MS[m][2], tubeW: 1.8, lift: 1, dark: 1
    }
  };
  /* ---- THERMAL: dark, fine silhouettes, colour = medium and its temperature, glowing flow ---- */
  const COL = { air: '#3b82f6', hot: '#f59e0b', faa: '#60a5fa', gas: '#ef4444', gasm: '#f97316', gasc: '#9ca3af', sol: '#d97706', fw: '#22c55e', mix: '#2dd4bf', stm: '#f43f5e', rh: '#d946ef' };
  STYLES.thermal = {
    name: 'THERMAL',
    C: {
      bg: '#0e1216', frame: '#080b0e', alarmBar: '#0b0f12', ol: '#5d6b78', olw: 1.1, text: '#e2e8ee', name: '#c9d3dc', lab: '#9aa7b4', dim: '#7c8a98',
      unit: '#7d8a97', val: '#f1f5f9', sv: '#a9bccf', none: '#56616c', box: '#06090c', boxs: '#2b3743', chip: '#121920', chipS: '#2f3c48',
      track: '#26313b', bar: '#38bdf8', rule: '#25303a', run: '#ef4444', stop: '#22c55e', alarm: '#ef4444', warn: '#fbbf24', cas: '#38bdf8',
      aut: '#cbd5e1', ok: '#4ade80', off: '#262d34', nav: '#121920', navOn: '#e2e8ee', navOnT: '#0e1216', hover: '#1a232c',
      eq: '#141a20', eqIn: '#5d6b78', imp: '#3b82f6', blade: '#e2e8f0', bedHot: '#fff7ed', bedCold: '#c9d3dc', lead: '#3a4652', est: '#fcd34d',
      heat: v => (v >= 955 ? '#ef4444' : v >= 935 ? '#f97316' : '#f59e0b'),
      med: m => COL[m], medD: m => COL[m]
    },
    defs: `<radialGradient id="h2furHeat" cx="0.5" cy="0.92" r="1"><stop offset="0" stop-color="#ffcc66" stop-opacity="0.95"/><stop offset="0.25" stop-color="#ef4444" stop-opacity="0.7"/><stop offset="0.7" stop-color="#b91c1c" stop-opacity="0.35"/><stop offset="1" stop-color="#7f1d1d" stop-opacity="0.15"/></radialGradient>
<linearGradient id="h2bpHeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef4444" stop-opacity="0.45"/><stop offset="0.55" stop-color="#f97316" stop-opacity="0.28"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0.18"/></linearGradient>
<linearGradient id="h2aphHeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f97316" stop-opacity="0.5"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0.35"/></linearGradient>
<pattern id="h2elem" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 L6 0" stroke="#cbd5e1" stroke-opacity="0.22" stroke-width="0.8"/></pattern>`,
    pipe: [
      [m => COL[m], 2, 0.85, 1],
      [() => '#0e1216', 0, 1, 0],
      [m => COL[m], 0, 0.22, 1],
      [m => COL[m], -0.8, 0.5, 1]
    ],
    flow(d, i) {
      const c = COL[d.m],
        gap = d.w > 8 ? 70 : 40,
        v = d.m === 'sol' ? 35 : 110;
      return `<g data-pg="${i}"><path d="${ductPath(d)}" fill="none" stroke="${c}" stroke-width="${Math.max(2, d.w * 0.4).toFixed(1)}" stroke-linecap="round" stroke-dasharray="12 ${gap}" filter="url(#h2glow)"><animate attributeName="stroke-dashoffset" from="${12 + gap}" to="0" dur="${((gap / v) * 1.6).toFixed(2)}s" repeatCount="indefinite"/></path></g>`;
    },
    sk: {
      shell: '#141a20', shellOl: '#5d6b78', wwall: '#141a20', furIn: '#141a20', furHeat: 'url(#h2furHeat)', bpIn: '#141a20', bpHeat: 'url(#h2bpHeat)', bpHeatOp: 1,
      cycIn: '#141a20', cycHeat: '#b91c1c', seal: '#141a20', sealSol: '#d97706', drum: '#141a20', water: '#22c55e', aph: 'url(#h2elem)', aphHeat: 'url(#h2aphHeat)',
      esp: '#141a20', espPlate: '#a5b4fc', stack: '#141a20', bed: '#f59e0b', fire: '#ef4444', particle: '#fde68a', vort: '#fbbf24', bpDot: '#fca5a5', smoke: '#9ca3af',
      tube: m => COL[m], tubeW: 1.2, glow: 1, dark: 1
    }
  };
  const ORDER = ['cut', 'steel', 'thermal'];
  let SK = 'steel'; /* live check #97: Steel is the default; the last pick is kept (ls-hmi-style) */
  try {
    const k = localStorage.getItem('ls-hmi-style');
    if (STYLES[k]) SK = k;
  } catch (e) {}

  /* ---------- shared drawing (every style, skin sk) ---------- */
  /* all pipes in layers: every wall first, then every inside, so elbows and tees join cleanly; the bridge pipes after, over a gap */
  function pipes(S, bridge) {
    let s = '';
    const L = DUCTS.map((d, i) => [d, i]).filter(([d]) => !!d.br === bridge);
    if (bridge) for (const [d] of L) s += `<path d="${ductPath(d)}" fill="none" stroke="${C.bg}" stroke-width="${(d.w + 8).toFixed(1)}"/>`;
    S.pipe.forEach(([col, dw, op, fl]) => {
      for (const [d, i] of L) {
        const w = d.w + (dw > -1 && dw < 0 ? dw * d.w : dw);
        if (w <= 0.5) continue;
        const c = col(d.m);
        s += `<path d="${ductPath(d)}" fill="none" stroke="${c}" stroke-width="${w.toFixed(1)}" stroke-linejoin="round"${op < 1 ? ` stroke-opacity="${op}"` : ''}${fl ? ` data-in="${i}" data-c="${c}"` : ''}/>`;
      }
    });
    return s;
  }
  const lift = S => (S.sk.lift ? ' filter="url(#h2lift)"' : '');
  function drum(S) {
    const k = S.sk,
      x = 235,
      y = 34,
      w = 180,
      h = 30;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${k.drum}" stroke="${k.shellOl}" stroke-width="1.4"${lift(S)}/>`;
    s += `<clipPath id="h2dc"><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="${h / 2 - 2}"/></clipPath>`;
    s += `<g clip-path="url(#h2dc)"><path fill="${k.water}" fill-opacity="${k.dark ? 0.75 : 1}" d="M${x - 20} ${y + 16} q10 -2 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V${y + 40} H${x - 20} Z"><animateTransform attributeName="transform" type="translate" values="0 0;20 0" dur="2s" repeatCount="indefinite"/></path></g>`;
    return s + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="none" stroke="${k.shellOl}" stroke-width="1.4"/>` + NAME(325, y + 19, 'DRUM  T-1001');
  }
  function furnace(S) {
    const k = S.sk;
    /* water-wall shell, the bed and the fire inside, the distributor (nozzles) and the plenum (wind box) */
    let s = `<path d="${FUR}" fill="${k.wwall}" stroke="${k.shellOl}" stroke-width="1.4"${lift(S)}/>`;
    s += P(FURIN, k.furIn, '') + `<g data-k="heat"><path d="${FURIN}" fill="${k.furHeat}"><animate attributeName="opacity" values="0.92;1;0.86;0.96;0.92" dur="3.2s" repeatCount="indefinite"/></path>`;
    s += `<path d="M246 560 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t14 0 V618 L365 684 H285 L246 618 Z" fill="${k.bed}" fill-opacity="0.85"><animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="0.9s" repeatCount="indefinite"/></path></g>`;
    s += rising(k.particle, 40, k.glow, 0.8);
    s += `<path d="M282 690 H368 V730 H282 Z" fill="${S.C.eq}" stroke="${k.shellOl}" stroke-width="1.2"/>`;
    for (let i = 0; i < 8; i++) s += `<path d="M${288 + i * 10.4} 690 v-6 m-2 0 h4" stroke="${k.shellOl}" stroke-width="1.2" fill="none"/>`;
    s += `<path d="M317 730 V766 H333 V730" fill="${S.C.medD('sol')}" fill-opacity="0.35" stroke="${k.shellOl}" stroke-width="1.1"/>`;
    s += NAME(325, 124, 'FURNACE  H-1001', 'middle', 'CFB combustor, water-wall') + T(325, 722, 'PLENUM', { z: 8, b: 700, c: k.dark ? '#d3dbe2' : '#26303a', a: 'middle', ls: 0.3 });
    s += T(325, 548, 'BED  ----- °C', { z: 9, b: 700, c: S.C.bedHot, a: 'middle', ls: 0.4, k: 'bedavg' });
    return s;
  }
  function cyclone(S) {
    const k = S.sk;
    let s = `<path d="${CYC}" fill="${k.cycIn}" stroke="${k.shellOl}" stroke-width="1.4"${lift(S)}/><path d="${CYC}" fill="${k.cycHeat}" fill-opacity="0.45" data-k="heat"/>`;
    /* vortex finder (gas outlet tube) going into the cyclone from the top */
    s += R(482, 104, 20, 46, S.C.med('gas'), ` stroke="${k.shellOl}" stroke-width="1" fill-opacity="0.9"`);
    s += vortex(k.vort, 14, k.glow);
    s += R(484, 362, 16, 70, S.C.med('sol'), ` stroke="${k.shellOl}" stroke-width="1.1"`);
    s += `<path d="${SEAL}" fill="${k.seal}" stroke="${k.shellOl}" stroke-width="1.3"${lift(S)}/>` + R(450, 462, 84, 34, k.sealSol, ' fill-opacity="0.85"');
    for (let i = 0; i < 9; i++) s += `<circle cx="${456 + i * 9}" cy="482" r="1.4" fill="${S.C.medD('sol')}"><animate attributeName="cy" values="486;474;486" dur="${(0.6 + (i % 3) * 0.2).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
    /* FA nozzles under the seal pot */
    for (let i = 0; i < 6; i++) s += `<path d="M${458 + i * 13} 500 v-5" stroke="${S.C.medD('faa')}" stroke-width="1.2"/>`;
    return s + NAME(492, 98, 'CYCLONE S-1009A / B', 'middle') + T(492, 450, 'SEAL POT T-1009A/B', { z: 8.5, b: 700, c: k.dark ? '#d3dbe2' : '#26303a', a: 'middle', ls: 0.3 });
  }
  function backpass(S) {
    const k = S.sk;
    let s = `<path d="${BP}" fill="${k.shell}" stroke="${k.shellOl}" stroke-width="1.4"${lift(S)}/>`;
    s += `<path d="M686 100 H954 V506 L844 574 H796 L686 506 Z" fill="${k.bpIn}"/><path d="M686 100 H954 V506 L844 574 H796 L686 506 Z" fill="${k.bpHeat}" fill-opacity="${k.bpHeatOp}" data-k="heat"/>`;
    /* the baffle between the RH pass and the SH pass */
    s += R(818, 100, 6, 300, k.dark ? '#59636d' : '#9aa3ab', '');
    for (const b of BANKS)
      s +=
        T(b.x + b.w / 2, b.y + b.h / 2 + 3, b.n, { z: 7.5, b: 700, c: k.dark ? '#e6ebef' : '#26303a', a: 'middle', ls: 0.3 }) +
        `<path d="${bankPath(b)}" fill="none" stroke="${k.tube(b.k)}" stroke-width="${k.tubeW}" stroke-linejoin="round" stroke-opacity="0.85"${k.glow ? ' filter="url(#h2glow)"' : ''}/>`;
    s += T(752, 104, 'RH PASS', { z: 7.5, b: 700, c: S.C.dim, a: 'middle', ls: 0.5 }) + T(890, 104, 'SH PASS', { z: 7.5, b: 700, c: S.C.dim, a: 'middle', ls: 0.5 });
    s += bpGas(k.bpDot, k.glow);
    return s + NAME(820, 540, 'BACKPASS', 'middle');
  }
  /* LJUNGSTROM air preheater: rotor of heating elements turning through three sectors (PA, SA, gas); hot end at the top */
  function aph(S) {
    const k = S.sk,
      x = 1020,
      y = 674,
      w = 240,
      h = 106;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${k.shell}" stroke="${k.shellOl}" stroke-width="1.4"${lift(S)}/>`;
    s += R(x + 6, y + 12, w - 12, h - 24, k.aph, '') + `<rect x="${x + 6}" y="${y + 12}" width="${w - 12}" height="${h - 24}" fill="${k.aphHeat}" fill-opacity="0.45" data-k="heat"/>`;
    /* rotor turning: the element pattern moves to the right */
    s += `<g clip-path="url(#h2aphc)"><g><rect x="${x - 30}" y="${y + 12}" width="${w + 60}" height="${h - 24}" fill="url(#h2elem)" opacity="0.6"/><animateTransform attributeName="transform" type="translate" values="0 0;12 0" dur="1.2s" repeatCount="indefinite"/></g></g><clipPath id="h2aphc"><rect x="${x + 6}" y="${y + 12}" width="${w - 12}" height="${h - 24}"/></clipPath>`;
    /* sector plates */
    for (const xx of [1090, 1160]) s += `<line x1="${xx}" y1="${y}" x2="${xx}" y2="${y + h}" stroke="${k.shellOl}" stroke-width="3"/>`;
    s += `<line x1="${x}" y1="${y + 12}" x2="${x + w}" y2="${y + 12}" stroke="${k.shellOl}" stroke-width="1"/><line x1="${x}" y1="${y + h - 12}" x2="${x + w}" y2="${y + h - 12}" stroke="${k.shellOl}" stroke-width="1"/>`;
    const lab = (xx, t) => T(xx, y + h / 2 + 3, t, { z: 8, b: 700, c: k.dark ? '#e6ebef' : '#26303a', a: 'middle', ls: 0.4 });
    s += lab(1055, 'PA') + lab(1125, 'SA') + lab(1210, 'GAS');
    s += T(x + 8, y + 9, 'HOT END', { z: 6.5, b: 700, c: S.C.dim }) + T(x + 8, y + h - 3, 'COLD END', { z: 6.5, b: 700, c: S.C.dim });
    /* main drive motor */
    s += `<rect x="${x + w - 2}" y="${y + 40}" width="12" height="26" rx="2" fill="${S.C.none}" stroke="${k.shellOl}" stroke-width="1" data-aphm="1"/>` + T(x + w + 4, y + 56, 'M', { z: 7, b: 700, c: k.dark ? '#e6ebef' : '#26303a', a: 'middle' });
    /* R9 #87: the run state of the main drive (DITL-43), as the fans: red RUNNING, green STOPPED */
    s += T(x + w - 8, y + 9.5, '-----', { z: 7.5, b: 700, c: S.C.none, a: 'end', ls: 0.4, k: 'aphst' }); /* in the hot end strip (left of the box: the PAF faceplate) */
    return s + NAME(1012, 730, 'AIR PREHEATER  H-1052', 'end') + T(1012, 741, 'Ljungstrom rotary: PA / SA / gas', { z: 7.5, c: S.C.dim, a: 'end' });
  }
  function esp(S) {
    const k = S.sk;
    let s = '';
    for (let i = 0; i < 4; i++) s += P(espHop(i), k.dark ? k.espPlate === '#0d1014' ? 'url(#h2steelX)' : '#141a20' : '#d8dadc', ` stroke="${k.shellOl}" stroke-width="1.1"`) + `<path d="M${1324 + i * 40} 870 v10" stroke="${S.C.medD('sol')}" stroke-width="2" stroke-dasharray="2 3"/>`;
    s += P(ESPB, k.esp, ` stroke="${k.shellOl}" stroke-width="1.3"${lift(S)}`);
    for (let x = 1306; x < 1474; x += 7) s += `<line x1="${x}" y1="762" x2="${x}" y2="838" stroke="${k.espPlate}" stroke-opacity="${k.glow ? 0.35 : 0.7}" stroke-width="${x % 14 ? 0.8 : 1.6}"${k.glow ? '><animate attributeName="stroke-opacity" values="0.35;0.15;0.4;0.35" dur="' + (1.5 + (x % 30) / 20).toFixed(2) + 's" repeatCount="indefinite"/></line>' : '/>'}`;
    for (const x of [1348, 1390, 1432]) s += `<line x1="${x}" y1="758" x2="${x}" y2="842" stroke="${k.shellOl}" stroke-width="1.4"/>`;
    /* live test 2026-10-30 #18: the ESP purge air heater H-1201 and fan F-1201 (PR-OPE-5002 section 1, EP PLC panel, no DCS signal): status
       of the field equipment (Training: from "Simulan ang 6 h purge"; 150 MW: in service) and the purge time */
    s += T(1390, 736, 'PURGE AIR HTR H-1201 / FAN F-1201 · EP PLC (field)', { z: 7.5, c: S.C.dim, a: 'middle' }) + T(1390, 724, '-----', { z: 8, b: 700, c: S.C.none, a: 'middle', ls: 0.4, k: 'espst' });
    return s + NAME(1390, 750, 'ESP  Z-1010', 'middle');
  }
  function stack(S) {
    const k = S.sk;
    let s = P(STK, k.stack, ` stroke="${k.shellOl}" stroke-width="1.3"${lift(S)}`) + smoke(k.smoke, 0.4, 5);
    /* CEMS probes */
    for (const y of [210, 232, 254]) s += `<line x1="1652" y1="${y}" x2="1664" y2="${y}" stroke="${S.C.eqIn}" stroke-width="2"/><circle cx="1666" cy="${y}" r="2.6" fill="${S.C.eqIn}"/>`;
    return s + NAME(1629, 930, 'STACK  Z-1057', 'middle') + T(1658, 200, 'CEMS', { z: 7.5, b: 700, c: S.C.dim });
  }
  function intake(x, y, filt) {
    let s = R(x - 10, y - 15, 22, 30, C.eq);
    for (let i = 0; i < 5; i++) s += `<line x1="${x - 8}" y1="${y - 11 + i * 6}" x2="${x + 10}" y2="${y - 8 + i * 6}" stroke="${C.eqIn}" stroke-width="1.2"/>`;
    return s + T(x + 1, y + 26, filt ? 'FILTER SILENCER' : 'SILENCER', { z: 7, c: C.dim, a: 'middle' });
  }
  /* flow element (venturi) on a duct */
  const venturi = (x, y, w) => `<path d="M${x - 9} ${y - w / 2 - 2} L${x} ${y - w / 2 + 3} L${x + 9} ${y - w / 2 - 2} M${x - 9} ${y + w / 2 + 2} L${x} ${y + w / 2 - 3} L${x + 9} ${y + w / 2 + 2}" fill="none" stroke="${C.ol}" stroke-width="1.4"/>` + T(x, y + w / 2 + 11, 'FE', { z: 7, c: C.dim, a: 'middle' });
  /* check valve on a vertical pipe */
  const check = (x, y) => `<path d="M${x - 6} ${y + 6} L${x + 6} ${y + 6} L${x} ${y - 4} Z" fill="${C.eq}" stroke="${C.ol}" stroke-width="1.1"/><line x1="${x - 6}" y1="${y - 5}" x2="${x + 6}" y2="${y - 5}" stroke="${C.ol}" stroke-width="1.4"/>`;
  /* fan: volute, the impeller turns while the run bit is 1; motor with the state (red running, green stopped) */
  function fan(f, i) {
    const { cx, cy, r } = f;
    let s = '';
    if (f.out) s += R(cx, cy - r, f.out - cx, 14, C.eq);
    if (f.idf) s += R(cx, cy - 15, 30, 16, C.eq);
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.eq}" stroke="${C.ol}" stroke-width="${C.olw + 0.2}" data-fan="${i}"${STYLES[SK].sk.lift ? ' filter="url(#h2lift)"' : ''}/>`;
    if (C.impFill) s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.74}" fill="${C.impFill}" stroke="${C.eqIn}" stroke-width="0.8"/>`;
    let bl = '';
    for (let k = 0; k < 9; k++) {
      const a = (k * 2 * Math.PI) / 9;
      bl += `M${(cx + Math.cos(a) * r * 0.22).toFixed(1)} ${(cy + Math.sin(a) * r * 0.22).toFixed(1)} Q${(cx + Math.cos(a + 0.3) * r * 0.5).toFixed(1)} ${(cy + Math.sin(a + 0.3) * r * 0.5).toFixed(1)} ${(cx + Math.cos(a + 0.55) * r * 0.7).toFixed(1)} ${(cy + Math.sin(a + 0.55) * r * 0.7).toFixed(1)} `;
    }
    s += `<g data-imp="${i}"><path d="${bl}" fill="none" stroke="${C.imp}" stroke-width="${f.small ? 1 : 1.7}" stroke-linecap="round"${SK === 'thermal' ? ' filter="url(#h2glow)"' : ''}/><circle cx="${cx}" cy="${cy}" r="${r * 0.17}" fill="${C.imp}"/></g>`;
    /* motor (and for the IDF the hydraulic coupling between them) on the shaft */
    let mx = cx + r + 8,
      my = cy - 7;
    if (f.idf) {
      /* IDF: motor - hydraulic coupling Z-1056 - fan, on one shaft to the left */
      const hx = cx - r - 56;
      s += `<line x1="${cx - r}" y1="${cy}" x2="${hx - 46}" y2="${cy}" stroke="${C.eqIn}" stroke-width="3"/>`;
      s += `<rect x="${hx}" y="${cy - 13}" width="40" height="26" rx="5" fill="${C.eq}" stroke="${C.ol}" stroke-width="1.2"/><path d="M${hx + 8} ${cy - 8} q12 8 0 16 M${hx + 32} ${cy - 8} q-12 8 0 16" fill="none" stroke="${C.eqIn}" stroke-width="1.6"/>`;
      s += T(hx + 20, cy + 26, 'HYDRAULIC COUPLING Z-1056', { z: 7, b: 700, c: C.dim, a: 'middle' });
      mx = hx - 46;
      my = cy - 9;
      s += `<rect x="${mx - 30}" y="${my - 2}" width="34" height="22" rx="3" fill="${C.eq}" stroke="${C.ol}" stroke-width="1.1"/><rect x="${mx - 27}" y="${my + 1}" width="28" height="16" rx="2" fill="${C.none}" data-mot="${i}"/>` + T(mx - 13, my + 13, 'M', { z: 8, b: 700, c: '#fff', a: 'middle' });
      return s + T(cx, cy + r + 13, f.name, { z: 9.5, b: 700, c: C.name, a: 'middle', ls: 0.4 });
    }
    if (f.small) {
      s += `<line x1="${cx}" y1="${cy + r}" x2="${cx}" y2="${cy + r + 6}" stroke="${C.eqIn}" stroke-width="2"/><rect x="${cx - 9}" y="${cy + r + 6}" width="18" height="11" rx="2" fill="${C.eq}" stroke="${C.ol}" stroke-width="1"/><rect x="${cx - 7}" y="${cy + r + 8}" width="14" height="7" rx="1" fill="${C.none}" data-mot="${i}"/>`;
      const [n1, n2] = f.name.split('  ');
      return s + T(cx + r + 4, cy - 2, n1, { z: 8, b: 700, c: C.name }) + T(cx + r + 4, cy + 8, n2, { z: 7, c: C.dim });
    }
    s += `<line x1="${cx + r}" y1="${cy + 8}" x2="${mx}" y2="${cy + 8}" stroke="${C.eqIn}" stroke-width="2"/>`;
    s += `<rect x="${mx}" y="${my + 8}" width="24" height="13" rx="2" fill="${C.eq}" stroke="${C.ol}" stroke-width="1.1"/>`;
    s += `<rect x="${mx + 2}" y="${my + 10}" width="20" height="9" rx="1" fill="${C.none}" data-mot="${i}"/>` + T(mx + 12, my + 17.5, 'M', { z: 7.5, b: 700, c: '#fff', a: 'middle' });
    return s + T(cx, cy + r + 13, f.name, { z: 9, b: 700, c: C.name, a: 'middle', ls: 0.4 });
  }
  /* damper: blades turned by the real position (across the flow = closed, along = open); click = its controller's faceplate */
  function damper(d, i) {
    let s = `<g data-dmp="${i}" style="cursor:pointer">`;
    if (d.hor) {
      s += `<rect x="${d.x - d.len / 2}" y="${d.y - 8}" width="${d.len}" height="16" fill="#000" fill-opacity="0"/>`;
      for (let k = 0; k < 4; k++) {
        const bx = d.x - d.len / 2 + 14 + k * 28;
        s += `<line x1="${bx - 11}" y1="${d.y}" x2="${bx + 11}" y2="${d.y}" stroke="${C.blade}" stroke-width="2.2" stroke-linecap="round" data-bl="${bx} ${d.y}"/><circle cx="${bx}" cy="${d.y}" r="1.3" fill="${C.bg}"/>`;
      }
      s += `<text x="${d.x}" y="${d.y + 19}" font-family="${MF}" font-size="8.5" fill="${C.none}" text-anchor="middle" data-dv="${i}">-----</text>`;
    } else {
      const w = d.w;
      s += `<rect x="${d.x - 8}" y="${d.y - w / 2 - 16}" width="16" height="${w + 18}" fill="#000" fill-opacity="0"/>`;
      s += R(d.x - 4, d.y - w / 2 - 2, 8, w + 4, 'none', ` stroke="${C.eqIn}" stroke-width="1.2"`);
      s += `<line x1="${d.x}" y1="${d.y - w / 2 + 1}" x2="${d.x}" y2="${d.y + w / 2 - 1}" stroke="${C.blade}" stroke-width="2.2" stroke-linecap="round" data-bl="${d.x} ${d.y}"/><circle cx="${d.x}" cy="${d.y}" r="1.4" fill="${C.bg}" stroke="${C.blade}" stroke-width="0.8"/>`;
      s += `<line x1="${d.x}" y1="${d.y - w / 2 - 2}" x2="${d.x}" y2="${d.y - w / 2 - 8}" stroke="${C.eqIn}" stroke-width="1.2"/>` + R(d.x - 6, d.y - w / 2 - 15, 12, 7, C.eq, ` stroke="${C.ol}" stroke-width="1"`);
      s += `<text x="${d.x}" y="${d.y + w / 2 + 12}" font-family="${MF}" font-size="8.5" fill="${C.none}" text-anchor="middle" data-dv="${i}">-----</text>`;
    }
    return s + `<title>${esc(d.tag + ' · ' + d.desc + ' · click: faceplate of ' + d.fp)}</title></g>`;
  }
  /* a measured value: tag, value box, unit, and under them the description; a leader to the point of measurement */
  const TW = 126;
  function tagBox(t, i) {
    const [x, y, tag, u, , desc, , io, at] = t,
      est = !!EST[tag];
    let s = '';
    if (at) {
      const lx = at[0] < x ? x : at[0] > x + TW ? x + TW : x + TW / 2,
        ly = at[0] >= x && at[0] <= x + TW ? (at[1] < y ? y : y + 24) : y + 8;
      s += `<path d="M${lx} ${ly} L${at[0]} ${at[1]}" stroke="${C.lead}" stroke-width="0.7" stroke-dasharray="2 2" fill="none"/><circle cx="${at[0]}" cy="${at[1]}" r="1.8" fill="${C.lead}"/>`;
    }
    s += `<g style="cursor:pointer" data-vb="${i}"><rect x="${x - 2}" y="${y - 1}" width="${TW + 4}" height="25" fill="#000" fill-opacity="0"/>`;
    s += T(x, y + 10, tag, { z: 8.5, b: 700, c: C.lab, ls: 0.2 });
    s += `<rect x="${x + 58}" y="${y}" width="40" height="13" rx="1.5" fill="${C.box}" stroke="${C.boxs}" stroke-width="0.7"/>`;
    s += `<text x="${x + 95}" y="${y + 10}" font-family="${MF}" font-size="10" fill="${C.none}" text-anchor="end" data-vt="${i}">-----</text>`;
    if (est) s += `<circle cx="${x + 61}" cy="${y + 3}" r="1.5" fill="${C.est}"/>`;
    s += T(x + 101, y + 10, u, { z: 7.5, c: C.unit });
    s += T(x, y + 21, desc, { z: 7.5, c: C.dim });
    return s + `<title>${esc(tag + ' · ' + desc + (io ? ' · I/O STN10' + io.replace('|', ' ') : '') + (est ? ' · PLANT ESTIMATE: this transmitter is not used by any DCS logic sheet, the value is estimated from the live plant (bed temperature, air flows, fans) and the 150 MW snapshot' : ''))}</title></g>`;
  }
  function chip(c, i) {
    const [x, y, tag, svc] = c,
      w = TW;
    let s = `<g class="chip" style="cursor:pointer"><rect x="${x}" y="${y}" width="${w}" height="44" rx="2" fill="${C.chip}" stroke="${C.chipS}" stroke-width="0.8" data-cr="${i}"><title>${esc(tag + ' · ' + svc + ' · click: faceplate (A / M / R, SV, MV)')}</title></rect>`;
    s += T(x + 6, y + 12, tag, { z: 9.5, b: 700 });
    s += T(x + w - 18.5, y + 11.5, '---', { z: 7.5, b: 700, c: C.none, a: 'middle', ls: 0.4, k: 'cm' + i });
    s += `<rect x="${x + w - 32}" y="${y + 3}" width="27" height="11" rx="5.5" fill="none" stroke="${C.none}" stroke-width="0.9" data-cp="${i}"/>`;
    s += T(x + 6, y + 26, 'PV', { z: 7.5, c: C.dim }) + `<text x="${x + 60}" y="${y + 26}" font-family="${MF}" font-size="10.5" fill="${C.none}" text-anchor="end" data-k="cpv${i}">-----</text>`;
    s += T(x + 66, y + 26, 'SV', { z: 7.5, c: C.dim }) + `<text x="${x + w - 6}" y="${y + 26}" font-family="${MF}" font-size="10.5" fill="${C.none}" text-anchor="end" data-k="csv${i}">-----</text>`;
    s += T(x + 6, y + 39, 'MV', { z: 7.5, c: C.dim }) + R(x + 22, y + 34, 50, 4, C.track, '') + `<rect x="${x + 22}" y="${y + 34}" width="0" height="4" fill="${C.bar}" data-k="cbar${i}"/>`;
    s += `<text x="${x + w - 14}" y="${y + 39.5}" font-family="${MF}" font-size="10" fill="${C.none}" text-anchor="end" data-k="cmv${i}">-----</text>` + T(x + w - 12, y + 39.5, '%', { z: 7.5, c: C.unit });
    return s + '</g>';
  }
  /* left column: bed temperature table (18 thermocouples, lower layer above / under, A ~ I) with the averages */
  function bedTable() {
    const x = 12,
      w = 184;
    let y = 30,
      s = T(x, y + 10, 'BED TEMPERATURE  °C', { z: 9, b: 700, c: C.lab, ls: 0.8 }) + `<line x1="${x}" y1="${y + 15}" x2="${x + w}" y2="${y + 15}" stroke="${C.rule}" stroke-width="0.8"/>`;
    y += 28;
    s += T(x + 20, y, 'ABOVE  TIFG1091', { z: 7.5, b: 700, c: C.dim }) + T(x + 110, y, 'UNDER  TIFG1090', { z: 7.5, b: 700, c: C.dim });
    y += 6;
    'ABCDEFGHI'.split('').forEach((c, i) => {
      const yy = y + i * 17;
      s += T(x + 4, yy + 11, c, { z: 9, b: 700, c: C.lab });
      [['u', 20], ['l', 110]].forEach(([k, dx]) => {
        s += `<g style="cursor:pointer" data-k="bh${k}${i}"><title>${esc((k === 'u' ? 'TIFG1091' : 'TIFG1090') + c + ' · furnace lower layer ' + (k === 'u' ? 'above' : 'under') + ' temperature (' + c + ')')}</title>`;
        s += R(x + dx, yy + 1, 44, 13, C.box, ` stroke="${C.boxs}" stroke-width="0.7"`) + `<rect x="${x + dx + 46}" y="${yy + 3}" width="0" height="9" fill="${C.none}" data-k="b${k}${i}"/>`;
        s += `<text x="${x + dx + 41}" y="${yy + 11}" font-family="${MF}" font-size="10" fill="${C.none}" text-anchor="end" data-k="t${k}${i}">---</text></g>`;
      });
    });
    y += 9 * 17 + 6;
    const num = (k, xx, yy) => `<text x="${xx}" y="${yy}" font-family="${MF}" font-size="10.5" fill="${C.none}" text-anchor="end" data-k="${k}">-----</text>`;
    s += T(x, y + 10, 'AVG ABOVE', { z: 8, c: C.dim }) + num('bavgu', x + 96, y + 10) + T(x + 104, y + 10, 'UNDER', { z: 8, c: C.dim }) + num('bavgl', x + w, y + 10);
    y += 17;
    s += T(x, y + 10, 'AVG TOTAL', { z: 8, c: C.dim }) + num('bavg', x + 96, y + 10) + T(x + 104, y + 10, 'RATE', { z: 8, c: C.dim }) + num('brate', x + w - 26, y + 10) + T(x + w - 24, y + 10, '°C/min', { z: 7, c: C.unit });
    y += 17;
    s += T(x, y + 10, 'MAX', { z: 8, c: C.dim }) + num('bmax', x + 60, y + 10) + T(x + 74, y + 10, 'MIN', { z: 8, c: C.dim }) + num('bmin', x + 130, y + 10) + T(x + 136, y + 10, '°C', { z: 7.5, c: C.unit });
    return s;
  }
  const head = (x, y, w, t) => T(x, y + 10, t, { z: 9, b: 700, c: C.lab, ls: 0.8 }) + `<line x1="${x}" y1="${y + 15}" x2="${x + w}" y2="${y + 15}" stroke="${C.rule}" stroke-width="0.8"/>`;
  /* legend of the media */
  function legend() {
    let s = head(12, 780, 184, 'LEGEND');
    MED_NAMES.forEach(([m, n], i) => {
      const x = 14 + (i % 2) * 94,
        y = 808 + Math.floor(i / 2) * 15;
      s += `<line x1="${x}" y1="${y}" x2="${x + 20}" y2="${y}" stroke="${C.ol}" stroke-width="7" stroke-linecap="round"/><line x1="${x}" y1="${y}" x2="${x + 20}" y2="${y}" stroke="${C.med(m)}" stroke-width="5" stroke-linecap="round"/>` + T(x + 27, y + 3, n, { z: 7.5, c: C.lab });
    });
    s += `<circle cx="18" cy="904" r="2" fill="${C.est}"/>` + T(26, 907, 'plant estimate: transmitter not used', { z: 7.5, c: C.lab }) + T(26, 918, 'by a DCS logic sheet (see note)', { z: 7.5, c: C.lab });
    return s;
  }
  /* side panel: combustion summary, O2 trim, stack CEMS, fans, alarms */
  const PROWS = [
    ['Total air flow', 'ABC-006|SUM out', 1, 'T/H'],
    ['Coal flow', 'pv:FIC-CM', 1, 'T/H'],
    ['PA flow', 'pv:FICFA1071', 1, 'T/H'],
    ['SA flow', 'pv:FICFA1081', 1, 'T/H'],
    ['FA flow', 'pv:FICFA1055A', 1, 'T/H'],
    ['Furnace press', 'pv:PICFG108', 1, 'mmH2O'],
    ['O2 (APH inlet)', 'pv:AICFG112', 1, '%']
  ];
  function panel() {
    const x = 1690,
      w = 216;
    let y = 0,
      s = '';
    const num = (k, xx, yy, z) => `<text x="${xx}" y="${yy}" font-family="${MF}" font-size="${z}" fill="${C.none}" text-anchor="end" data-k="${k}">-----</text>`;
    s += head(x, y, w, 'COMBUSTION');
    y += 26;
    PROWS.forEach((p, i) => {
      s += `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="17" fill="#000" fill-opacity="0" data-pr="${i}"><title>${esc(p[0] + ' (' + p[1] + ')')}</title></rect>`;
      s += T(x, y + 10, p[0], { z: 9.5, c: C.lab }) + num('pv' + i, x + w - 44, y + 10.5, 11.5) + T(x + w - 40, y + 10, p[3], { z: 8.5, c: C.unit });
      y += 19;
    });
    s += T(x, y + 10, 'Air / coal ratio', { z: 9.5, c: C.lab }) + num('ratio', x + w - 44, y + 10.5, 11.5);
    y += 19;
    s += T(x, y + 10, 'MFT', { z: 9.5, c: C.lab }) + `<rect x="${x + w - 64}" y="${y}" width="64" height="14" rx="7" fill="none" stroke="${C.none}" stroke-width="0.9" data-k="mftr"><title>MFT (ABC-007 M.0182)</title></rect>` + T(x + w - 32, y + 10, '-----', { z: 8, b: 700, c: C.none, a: 'middle', ls: 0.5, k: 'mftt' });
    y += 26;
    s += chip([x, y, 'AICFG112', 'O2 trim (air demand bias)'], 'o');
    y += 58;
    s += head(x, y, w, 'STACK CEMS  (AT / FT / TT-FG1057)');
    y += 26;
    CEMS.forEach((r, i) => {
      s += `<g style="cursor:pointer" data-cems="${i}"><rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="17" fill="#000" fill-opacity="0"/><title>${esc(r[0] + ' · stack outlet flue gas ' + r[1] + ' · I/O STN10' + r[4].replace('|', ' ') + (EST[r[0]] ? ' · PLANT ESTIMATE (no DCS logic sheet uses this transmitter)' : ''))}</title>`;
      s += T(x, y + 10, r[1], { z: 9.5, c: C.lab }) + T(x + 70, y + 10, r[0], { z: 7.5, c: C.dim }) + num('ce' + i, x + w - 44, y + 10.5, 11.5) + T(x + w - 40, y + 10, r[2], { z: 8.5, c: C.unit });
      if (EST[r[0]]) s += `<circle cx="${x + 64}" cy="${y + 7}" r="1.6" fill="${C.est}"/>`;
      s += '</g>';
      y += 18;
    });
    y += 12;
    s += head(x, y, w, 'FANS');
    y += 26;
    const AMP = { 0: 'IIF1053', 1: 'IIF1054', 2: 'IIF1056', 3: 'IIF1055A', 4: 'IIF1055B' };
    FANS.forEach((f, i) => {
      s += T(x, y + 10, f.name, { z: 9.5, c: C.lab }) + num('fa' + i, x + w - 92, y + 10.5, 10.5) + T(x + w - 89, y + 10, 'A', { z: 8, c: C.unit });
      s += `<circle cx="${x + w - 72}" cy="${y + 7}" r="3.5" fill="${C.none}" data-k="fd${i}"/>` + T(x + w, y + 10, '-----', { z: 8.5, b: 700, c: C.none, a: 'end', ls: 0.4, k: 'ft' + i });
      s += `<title>${esc(f.name + ' · motor current ' + AMP[i] + ' (plant estimate) · run state from the DCS logic')}</title>`;
      y += 19;
    });
    y += 10;
    s += head(x, y, w, 'ALARMS');
    return s + T(x, y + 34, 'No active alarm', { z: 9.5, c: C.dim, k: 'alist' });
  }
  function art(S) {
    let s = pipes(S, false);
    s += drum(S) + furnace(S) + cyclone(S) + backpass(S) + aph(S) + esp(S) + stack(S);
    s += intake(616, 820) + intake(616, 930) + intake(220, 930, 1) + intake(380, 930, 1);
    s += venturi(700, 820, 14) + venturi(700, 930, 14) + venturi(492, 800, 7);
    s += check(300, 900) + check(460, 900);
    /* fly ash hopper under the APH gas outlet */
    s += `<path d="M1222 806 h14 l-4 10 h-6 Z" fill="${C.eq}" stroke="${C.ol}" stroke-width="1"/>`;
    s += pipes(S, true);
    FANS.forEach((f, i) => (s += fan(f, i)));
    DAMPERS.forEach((d, i) => (s += damper(d, i)));
    DUCTS.forEach((d, i) => (s += S.flow(d, i)));
    NOTES.forEach(n => n[2] && (s += T(n[0], n[1], n[2], { z: 8, c: C.dim, a: n[3], ls: 0.3 })));
    s += T(1306, 18, 'STEAM / WATER', { z: 9, b: 700, c: C.lab, ls: 0.8 }) + `<line x1="1306" y1="23" x2="1564" y2="23" stroke="${C.rule}" stroke-width="0.8"/>`;
    s += T(1306, 388, 'IDF  F-1056 / HYDRAULIC COUPLING', { z: 9, b: 700, c: C.lab, ls: 0.8 }) + `<line x1="1306" y1="393" x2="1564" y2="393" stroke="${C.rule}" stroke-width="0.8"/>`;
    s += T(990, 96, 'BACKPASS GAS TEMPERATURE  (RH PASS | SH PASS)', { z: 8.5, b: 700, c: C.lab, ls: 0.6 });
    s += T(990, 492, 'AIR PREHEATER INLET', { z: 9, b: 700, c: C.lab, ls: 0.6 });
    s += head(12, 280, 184, 'BED DIFFERENTIAL PRESSURE') + head(12, 456, 184, 'FURNACE PRESSURE') + head(12, 580, 184, 'DRUM') + head(12, 652, 184, 'START-UP BURNER HOT SA (B-1043)');
    TAGS.forEach((t, i) => (s += tagBox(t, i)));
    CHIPS.forEach((c, i) => (s += chip(c, i)));
    return s + bedTable() + legend() + panel();
  }

  /* ---------- live links ---------- */
  function airFlueGas(g, api) {
    const pg = S_('g', { transform: `translate(0 ${OY})` });
    pg.innerHTML = art(STYLES[SK]);
    g.append(pg);
    const q = s => pg.querySelector(s),
      K = k => q(`[data-k="${k}"]`);
    const live = (ref, tag, set, hit) => api.reg({ t: 'val', tag: tag || '', ref, v: '' }, X => set(X && isFinite(X.v) ? +X.v : null), hit || null);
    const info = io => {
      const [st, a] = io.split('|');
      try {
        if (window.lsInfo) window.lsInfo(a, { stn: +st });
      } catch (e) {}
    };
    /* the plant estimate: live inputs E, every estimated value is computed again when one changes */
    const E = { tb: null, pa0: 354, sa0: 213, fa0: 26.3 };
    const ESTV = [];
    const recalc = () => {
      E.kb = E.tb == null ? 0 : clamp((E.tb - 30) / (937 - 30), 0, 1.3);
      E.pa = (E.fpa || 0) / E.pa0;
      E.sa = (E.fsa || 0) / E.sa0;
      E.fa = (E.ffa || 0) / E.fa0;
      E.g = E.idf ? clamp(((E.fpa || 0) + (E.fsa || 0) + (E.ffa || 0)) / 594, 0, 1.4) : 0;
      E.pf = E.pf0 == null ? 0 : E.pf0;
      E.tpa = E.ta == null ? 30 : E.ta;
      E.tsa = E.ts == null ? E.tpa : E.ts;
      const amb = E.tpa;
      E.T = (t0, after) => amb + (t0 - amb) * E.kb * (after ? 0.85 + 0.15 * clamp(E.g, 0.2, 1.2) : 1);
      E.P = p0 => (E.idf ? E.pf + (p0 - -16) * E.g * E.g : E.pf);
      for (const o of ESTV) {
        let v = null;
        try {
          v = o.f(E);
        } catch (e) {}
        o.set(v != null && isFinite(v) ? v : null);
      }
    };
    let rq = 0;
    const later = () => rq || (rq = requestAnimationFrame(() => ((rq = 0), recalc())));
    const inp = (k, ref, tag) => live(ref || '', tag || '', v => ((E[k] = v), later()));
    inp('fpa', 'pv:FICFA1071');
    inp('fsa', 'pv:FICFA1081');
    inp('ffa', '', 'FIFA1055');
    inp('pf0', '', 'PIFG1085');
    inp('ta', '', 'TIFA1072');
    inp('ts', '', 'TIFA1082');
    inp('scoop', 'ABC-008|AI0482');
    let o2a = null,
      o2b = null;
    live('', 'AIFG1122', v => ((o2a = v), (E.o2 = o2a != null && o2b != null ? (o2a + o2b) / 2 : o2a), later()));
    live('', 'AIFG1123', v => ((o2b = v), (E.o2 = o2a != null && o2b != null ? (o2a + o2b) / 2 : o2a), later()));
    /* flows: a duct moves while its fan runs (no signal = shown moving, like the logic default) */
    const FL = { G: 'ABC-008|M.3304', S: 'ABC-007|M.3303', P: 'ABC-007|M.3302' };
    const flowOn = {},
      vis = (el, on) => el && el.setAttribute('visibility', on ? 'visible' : 'hidden');
    const applyFlow = k => {
      const on = flowOn[k] !== false;
      DUCTS.forEach((d, i) => {
        if (d.f !== k) return;
        vis(q(`[data-pg="${i}"]`), on);
        pg.querySelectorAll(`[data-in="${i}"]`).forEach(r => r.setAttribute('stroke', on ? r.dataset.c : C.off));
      });
      if (k === 'P') {
        vis(K('solids'), on);
        vis(K('vortex'), on);
      }
      if (k === 'G') {
        vis(K('smoke'), on);
        vis(K('bpgas'), on);
      }
    };
    for (const k of ['G', 'S', 'P'])
      live(FL[k], '', v => {
        flowOn[k] = v == null ? true : v > 0.5;
        if (k === 'G') E.idf = v == null ? 1 : v > 0.5 ? 1 : 0;
        if (k === 'P') E.paf = v == null ? 1 : v > 0.5 ? 1 : 0;
        if (k === 'S') E.saf = v == null ? 1 : v > 0.5 ? 1 : 0;
        applyFlow(k);
        later();
      });
    live('', 'FIFA1055', v => ((flowOn.F = v == null ? true : v > 1), applyFlow('F')));
    live('', 'FIFW10071', v => ((flowOn.W = v == null ? true : v > 5), applyFlow('W')));
    live(api.HDR.MSF || '', '', v => ((flowOn.M = v == null ? true : v > 5), applyFlow('M')));
    /* fans */
    FANS.forEach((f, i) => {
      const imp = q(`[data-imp="${i}"]`),
        mot = q(`[data-mot="${i}"]`),
        body = q(`[data-fan="${i}"]`);
      let anim = null;
      api.reg(
        { t: 'fan', tag: f.tag },
        X => {
          const ok = X && isFinite(X.v),
            on = ok && X.v > 0.5,
            col = !ok ? C.none : on ? C.run : C.stop;
          mot.setAttribute('fill', col);
          if (on && !anim) {
            anim = S_('animateTransform', { attributeName: 'transform', type: 'rotate', from: `0 ${f.cx} ${f.cy}`, to: `360 ${f.cx} ${f.cy}`, dur: f.small ? '0.6s' : '1s', repeatCount: 'indefinite' });
            imp.append(anim);
            try {
              anim.beginElement();
            } catch (e) {}
          } else if (!on && anim) {
            anim.remove();
            anim = null;
            imp.removeAttribute('transform');
          }
          const d = K('fd' + i),
            t = K('ft' + i);
          d.setAttribute('fill', col);
          t.textContent = !ok ? '-----' : on ? 'RUNNING' : 'STOPPED';
          t.setAttribute('fill', col);
          if (i === 3) (E.fabA = ok ? (on ? 1 : 0) : 1), later();
          if (i === 4) (E.fabB = ok ? (on ? 1 : 0) : 0), later();
        },
        body
      );
      const ti = S_('title', {});
      ti.textContent = f.name + ' · run state from the DCS logic (motor: red = running, green = stopped)';
      body.append(ti);
    });
    /* #18: the ESP purge air heater / fan (field equipment AN_SRC.field.esp) and its 6 h purge time (Training H1) */
    {
      const t = K('espst');
      const upd = () => {
        if (!t || !t.isConnected) return clearInterval(iv);
        let on = false,
          tx = '';
        try {
          on = !!(AN.fieldState && AN.fieldState().esp);
          const G = window.LS_GUIDE,
            s0 = G && G.on && G.steps()[0],
            hd = s0 && s0.pre ? G.holdOf(s0) : null;
          if (hd && on) tx = ' · purge ' + (Math.min(hd[0], hd[1]) / 3600).toFixed(1) + ' / ' + (hd[1] / 3600).toFixed(0) + ' h';
        } catch (e) {}
        t.textContent = (on ? 'RUNNING' : 'STOPPED') + tx;
        t.setAttribute('fill', on ? C.run : C.stop);
      };
      const iv = setInterval(upd, 1000);
      upd();
    }
    /* R9 #87: air preheater main drive, run state of DITL-43 (was: grey, no state) */
    {
      const mot = q('[data-aphm]'),
        t = K('aphst'),
        body = q('[data-aphm]');
      api.reg(
        { t: 'val', tag: '', ref: 'ditl:DITL-43', v: '' },
        X => {
          const ok = X && isFinite(X.v),
            on = ok && X.v > 0.5,
            col = !ok ? C.none : X.tr ? C.alarm : on ? C.run : C.stop;
          if (mot) mot.setAttribute('fill', col);
          if (t) (t.textContent = !ok ? '-----' : X.tr ? 'TRIP' : on ? 'RUNNING' : 'STOPPED'), t.setAttribute('fill', col);
        },
        body
      );
    }
    /* fan motor currents (plant estimate) */
    ['IIF1053', 'IIF1054', 'IIF1056', 'IIF1055A', 'IIF1055B'].forEach((tg, i) => {
      const t = K('fa' + i);
      ESTV.push({ f: EST[tg], set: v => ((t.textContent = fmt(v, 1)), t.setAttribute('fill', v == null ? C.none : C.val)) });
    });
    /* dampers */
    DAMPERS.forEach((d, i) => {
      const gg = q(`[data-dmp="${i}"]`),
        bls = [...gg.querySelectorAll('[data-bl]')],
        dv = q(`[data-dv="${i}"]`);
      api.reg(
        { t: 'damper', tag: d.tag, ref: d.ref, v: '' },
        X => {
          const ok = X && isFinite(X.v),
            p = ok ? clamp(+X.v, 0, 100) : 0;
          for (const b of bls) b.setAttribute('transform', `rotate(${-p * 0.9} ${b.dataset.bl})`);
          if (dv) {
            dv.textContent = ok ? (d.hor ? d.tag + '  ' : '') + fmt(p, 1) + '%' : '-----';
            dv.setAttribute('fill', ok ? C.val : C.none);
          }
        },
        null
      );
      gg.addEventListener('click', e => (e.stopPropagation(), api.fp(d.fp)));
    });
    /* measured values: the logic value, or the plant estimate (click = the I/O list line) */
    TAGS.forEach((t, i) => {
      const vt = q(`[data-vt="${i}"]`),
        hit = q(`[data-vb="${i}"]`),
        show = v => {
          vt.textContent = v == null ? '-----' : fmt(v, t[4]);
          vt.setAttribute('fill', v == null ? C.none : C.val);
        };
      if (EST[t[2]]) {
        ESTV.push({ f: EST[t[2]], set: show });
        hit.addEventListener('click', e => (e.stopPropagation(), info(t[7])));
      } else api.reg({ t: 'val', tag: t[2], ref: t[6] || undefined, v: '' }, X => show(X && isFinite(X.v) ? +X.v : null), hit);
    });
    /* stack CEMS */
    CEMS.forEach((r, i) => {
      const t = K('ce' + i),
        hit = q(`[data-cems="${i}"]`),
        show = v => {
          t.textContent = v == null ? '-----' : fmt(v, r[3]);
          t.setAttribute('fill', v == null ? C.none : C.val);
        };
      if (EST[r[0]]) {
        ESTV.push({ f: EST[r[0]], set: show });
        hit.addEventListener('click', e => (e.stopPropagation(), info(r[4])));
      } else api.reg({ t: 'val', tag: r[0], v: '' }, X => show(X && isFinite(X.v) ? +X.v : null), hit);
    });
    /* controllers */
    const ctl = (tag, i, hitSel) => {
      const pill = q(`[data-cp="${i}"]`),
        pt = K('cm' + i),
        pv = K('cpv' + i),
        sv = K('csv' + i),
        bar = K('cbar' + i),
        mv = K('cmv' + i);
      api.reg(
        { t: 'ctl', tag },
        X => {
          const ok = !!X,
            m = ok ? X.m : '';
          const [lab, col] = m === 'M' ? ['MAN', C.warn] : m === 'R' ? ['CAS', C.cas] : m === 'A' ? ['AUT', C.aut] : ['---', C.none];
          pt.textContent = lab;
          pt.setAttribute('fill', col);
          pill.setAttribute('stroke', col);
          pv.textContent = ok ? fmt(X.pv, 1) : '-----';
          sv.textContent = ok ? fmt(X.sv, 1) : '-----';
          pv.setAttribute('fill', ok ? C.val : C.none);
          sv.setAttribute('fill', ok ? C.sv : C.none);
          const m0 = ok && isFinite(X.mv) ? clamp(X.mv, 0, 100) : 0;
          bar.setAttribute('width', (50 * m0) / 100);
          mv.textContent = ok ? fmt(X.mv, 1) : '-----';
          mv.setAttribute('fill', ok ? C.val : C.none);
        },
        q(hitSel)
      );
    };
    CHIPS.forEach((c, i) => ctl(c[2], i, `[data-cr="${i}"]`));
    ctl('AICFG112', 'o', '[data-cr="o"]');
    /* combustion summary */
    let taf = null,
      coal = null;
    const ratio = () => {
      const r = taf != null && coal != null && coal > 1 ? taf / coal : null,
        t = K('ratio');
      t.textContent = fmt(r, 2);
      t.setAttribute('fill', r == null ? C.none : C.val);
    };
    PROWS.forEach((p, i) => {
      const t = K('pv' + i);
      live(
        p[1],
        '',
        v => {
          t.textContent = fmt(v, p[2]);
          t.setAttribute('fill', v == null ? C.none : C.val);
          if (i === 0) (taf = v), ratio();
          if (i === 1) (coal = v), ratio();
        },
        q(`[data-pr="${i}"]`)
      );
    });
    live('ABC-007|M.0182', '', v => {
      const r = K('mftr'),
        t = K('mftt'),
        on = v != null && v > 0.5,
        col = v == null ? C.none : on ? C.alarm : C.ok;
      t.textContent = v == null ? '-----' : on ? 'TRIPPED' : 'RESET';
      t.setAttribute('fill', on ? '#fff' : col);
      r.setAttribute('stroke', col);
      r.setAttribute('fill', on ? C.alarm : 'none');
    }, K('mftr'));
    /* bed temperature: 18 thermocouples (TE-FG1091 A ~ I above, TE-FG1090 A ~ I under, ABC-026 / 027); the fire follows the average */
    const TT = {};
    let last = null;
    const calc = () => {
      const all = Object.entries(TT).filter(([, x]) => x != null),
        v = all.map(([, x]) => x),
        av = L => (L.length ? L.reduce((a, b) => a + b, 0) / L.length : null),
        avg = av(v),
        au = av(all.filter(([k]) => /1091/.test(k)).map(([, x]) => x)),
        al = av(all.filter(([k]) => /1090/.test(k)).map(([, x]) => x));
      for (const [k, x] of [['bavg', avg], ['bavgu', au], ['bavgl', al], ['bmax', v.length ? Math.max(...v) : null], ['bmin', v.length ? Math.min(...v) : null]]) {
        K(k).textContent = fmt(x, 0);
        K(k).setAttribute('fill', x == null ? C.none : C.val);
      }
      /* rate of change of the average, over at least 10 s */
      const now = Date.now();
      if (avg != null && (!last || now - last.t > 10000)) {
        if (last) {
          const r = ((avg - last.v) / (now - last.t)) * 60000;
          K('brate').textContent = fmt(r, 2);
          K('brate').setAttribute('fill', C.val);
        }
        last = { t: now, v: avg };
      }
      E.tb = avg;
      later();
      const op = avg == null ? 1 : clamp((avg - 60) / 700, 0.06, 1);
      pg.querySelectorAll('[data-k="heat"]').forEach(e => e.setAttribute('opacity', op));
      K('bedavg').textContent = 'BED  ' + fmt(avg, 0) + ' °C';
      K('bedavg').setAttribute('fill', op > 0.4 ? C.bedHot : C.bedCold);
    };
    'ABCDEFGHI'.split('').forEach((c, i) =>
      [['TIFG1091', 'u'], ['TIFG1090', 'l']].forEach(([pre, s]) => {
        const bar = K('b' + s + i),
          t = K('t' + s + i);
        live('', pre + c, v => {
          TT[pre + c] = v;
          const w = v == null ? 0 : clamp(((v - 850) / 150) * 40, 0, 40);
          bar.setAttribute('width', w);
          bar.setAttribute('fill', v == null ? C.none : C.heat(v));
          t.textContent = v == null ? '---' : fmt(v, 0);
          t.setAttribute('fill', v == null ? C.none : C.val);
          calc();
        }, K('bh' + s + i));
      })
    );
    recalc();
    return pg;
  }
  const SCREENS = { AFG: airFlueGas };

  /* ---------- frame: title with the process header, alarm bar, navigation with the style choice ---------- */
  function frame(g, sys, api) {
    const W = sys.w,
      H = sys.h,
      tx = (x, y, s, o, p) => {
        const e = S_('g', {});
        e.innerHTML = T(x, y, s, o);
        const t = e.firstChild;
        (p || g).append(t);
        return t;
      };
    /* 3.2.0-beta.70 (user 2026-10-30 "malabo / maliit"): a page of the HMI standard (docs/hmi/HMI_STYLE.md) has a 1280 x 860 frame,
       so it is shown about 1.5 x larger on a PC with the dock open; its bars use larger text and show 4 header values */
    const k = W < 1600 ? 1.3 : 1,
      HV = [['MSP', 1, 'kg/cm²'], ['MST', 0, '°C'], ['MSF', 1, 'T/H'], ['RHP', 1, 'kg/cm²'], ['RHT', 0, '°C'], ['COAL', 1, 'T/H'], ['PWR', 1, 'MW']].filter(
        v => k === 1 || ['MSP', 'MST', 'MSF', 'PWR'].includes(v[0])
      );
    g.append(S_('rect', { x: 0, y: 0, width: W, height: 34, fill: C.frame }));
    tx(16, 22 + (k - 1) * 8, sys.num || '', { z: 12 * k, b: 700, c: C.dim, mono: 1 });
    tx(48 * k, 22 + (k - 1) * 8, sys.name || sys.title, { z: 13 * k, b: 700, ls: 0.6 });
    HV.forEach(([kk, dp, u], i) => {
      const x = k === 1 ? 760 + i * 158 : W - HV.length * 152 - 6 + i * 152,
        k_ = kk;
      tx(x, 22 + (k - 1) * 6, k_ === 'PWR' ? 'LOAD' : k_, { z: 9 * k, b: 600, c: C.dim, ls: 0.5 });
      const t = tx(x + 92 * (k === 1 ? 1 : 1.12), 22.5 + (k - 1) * 8, '-----', { z: 12.5 * k, mono: 1, c: C.none, a: 'end' });
      tx(x + 96 * (k === 1 ? 1 : 1.12), 22 + (k - 1) * 6, u, { z: 8.5 * k, c: C.unit });
      if (api.HDR[k_])
        api.reg({ t: 'val', tag: k_, ref: api.HDR[k_], v: '' }, X => {
          const ok = X && isFinite(X.v);
          t.textContent = ok ? fmt(X.v, dp) : '-----';
          t.setAttribute('fill', ok ? C.val : C.none);
        }, null);
    });
    /* alarm bar: one line; colour only while an alarm is active (high = red blinking, medium = amber) */
    g.append(S_('rect', { x: 0, y: 34, width: W, height: 20, fill: C.alarmBar }));
    const al = tx(16, 48 + (k - 1) * 6, 'NO ACTIVE ALARM', { z: 9.5 * k, b: 600, c: C.dim, ls: 0.5 });
    /* live check #92: the bar shows the alarm list of the header ALARM chip (cr.js lsActiveAlarms: the same alarms, trips and
       suppression of the shutdown state); before, its own rules said IDF / PAF / SAF STOPPED while the header said NO ALARM */
    let last = '';
    const upd = () => {
      const R = (window.lsActiveAlarms && lsActiveAlarms()) || { list: [], sup: 0 },
        act = R.list.slice().reverse(),
        key = act.map(a => a.text + (a.ack ? 1 : 0)).join('|') + '#' + R.sup;
      if (key === last) return;
      last = key;
      al.textContent = '';
      const list = g.querySelector('[data-k="alist"]');
      if (!act.length) {
        al.textContent = 'NO ACTIVE ALARM' + (R.sup ? ' · ' + R.sup + ' SUPPRESSED' : '');
        al.setAttribute('fill', C.dim);
        if (list) (list.textContent = 'No active alarm'), list.setAttribute('fill', C.dim);
        return;
      }
      act.slice(0, 4).forEach((r, i) => {
        const hi = r.kind === 'TRIP',
          s = S_('tspan', { fill: hi ? C.alarm : C.warn, dx: i ? 28 : 0 });
        s.textContent = (hi ? '■ ' : '▲ ') + r.text;
        if (hi && !r.ack) s.setAttribute('class', 'h2blink');
        al.append(s);
      });
      if (act.length > 4) {
        const s = S_('tspan', { fill: C.dim, dx: 28 });
        s.textContent = '+' + (act.length - 4) + ' more';
        al.append(s);
      }
      if (list)
        (list.textContent = act.length + ' active (header ALARM list)'), list.setAttribute('fill', act.some(r => r.kind === 'TRIP') ? C.alarm : C.warn);
    };
    upd();
    let seen = false;
    const iv = setInterval(() => (g.isConnected ? ((seen = true), upd()) : seen && clearInterval(iv)), 1000);
    /* navigation: buttons to the related screens (the old screens open until the new set replaces them); STYLE at the right */
    const y = H - 32;
    g.append(S_('rect', { x: 0, y, width: W, height: 32, fill: C.frame }));
    const btn = (x, s, on, title, go) => {
      const w = s.length * 6.3 * k + 22,
        gg = S_('g', { class: on ? '' : 'h2btn', style: on ? '' : 'cursor:pointer' });
      gg.append(S_('rect', { x, y: y + 6, width: w, height: 20, rx: 3, fill: on ? C.navOn : C.nav, stroke: C.chipS, 'stroke-width': 0.6 }));
      tx(x + w / 2, y + 19.5 + (k - 1) * 4, s, { z: 8.5 * k, b: 600, c: on ? C.navOnT : C.lab, a: 'middle', ls: 0.4 }, gg);
      const ti = S_('title', {});
      ti.textContent = title;
      gg.append(ti);
      if (!on && go) gg.addEventListener('click', e => (e.stopPropagation(), go()));
      g.append(gg);
      return w;
    };
    let x = 12;
    for (const [id, s] of NAV) x += btn(x, s, id === sys.id, id === sys.id ? 'this screen' : 'open ' + s, api.go && (() => api.go(id))) + 6;
    /* 030 SEAWATER, MAKE-UP WATER, 036 TURBINE OIL, INSTRUMENT & PLANT AIR and 027 CLOSED COOLING WATER are drawn in one style (user 2026-10-29: STEEL): no style choice there */
    if (sys.style) return;
    x = W - 12 - ORDER.reduce((a, k) => a + STYLES[k].name.length * 6.3 + 28, 0);
    tx(x - 8, y + 19.5, 'STYLE', { z: 8.5, b: 700, c: C.dim, a: 'end', ls: 0.6 });
    for (const k of ORDER)
      x +=
        btn(x, STYLES[k].name, k === SK, k === SK ? 'graphic style in use' : 'show the graphics in the ' + STYLES[k].name.toLowerCase() + ' style', () => {
          SK = k;
          try {
            localStorage.setItem('ls-hmi-style', k);
          } catch (e) {}
          if (api.go) api.go(sys.id);
        }) + 6;
  }
  const NAV = [
    ['UNIT', 'UNIT'],
    ['AFG', '007 AIR & FLUE GAS'],
    ['SW', '030 SEAWATER'],
    ['MU', 'MAKE-UP WATER'],
    ['TO', '036 TURBINE OIL'],
    ['IA', 'INSTRUMENT & PLANT AIR'],
    ['CW', '027 CLOSED COOLING WATER']
  ];
  window.PLANT_V2 = {
    C,
    styles: ORDER,
    get style() {
      return SK;
    },
    /* the screens of the other files (hmi-sw.js: 030 SEAWATER) */
    screens: SCREENS,
    draw(g, sys, api) {
      const S = STYLES[sys.style || SK];
      for (const k in C) delete C[k];
      Object.assign(C, S.C);
      const defs = S_('defs', {});
      defs.innerHTML =
        S.defs +
        `<filter id="h2blur" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="3"/></filter>` +
        `<filter id="h2glow" x="-0.5" y="-0.5" width="2" height="2"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
        (S.sk.lift ? '' : `<filter id="h2lift"><feOffset dx="0" dy="0"/></filter>`) +
        `<style>.h2blink{animation:h2blink 1s steps(2,start) infinite}@keyframes h2blink{to{visibility:hidden}}@media (prefers-reduced-motion:reduce){.h2blink{animation:none}}.h2btn:hover rect{fill:${C.hover}}</style>`;
      g.append(defs);
      g.append(S_('rect', { x: 0, y: 0, width: sys.w, height: sys.h, fill: C.bg }));
      (SCREENS[sys.screen] || (() => {}))(g, api);
      frame(g, sys, api);
    }
  };
  /* the new screens come first in the list of the Plant view; the old ones stay until the new set replaces them */
  window.PLANT_SYS = window.PLANT_SYS || [];
  window.PLANT_SYS.unshift({ id: 'AFG', title: '007 AIR & FLUE GAS', num: '007', name: 'AIR & FLUE GAS SYSTEM', src: '7.PNG', w: 1920, h: 1080, v2: true, screen: 'AFG', items: [] });
})();
