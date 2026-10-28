/* 3.2.0-beta.7 (user 2026-10-23: "may explanation ang bawat linear ... saan ito nanggaling hanggang sa huling pupuntahan, purpose, function,
   effect, causes"): what each F(X) table does, where its input comes from, where its output goes, why it is there and what a change does.
   Written from: the drawing title and the axis names of the LINEAR CURVE workbook (document-references/linear-curves-fx.xls), the
   signal path read from the drawings in this app (tools/fx/trace.js, src/ui/fx/fx-paths.js), the I/O and memory lists, the PID / MAN
   parameter summary, PR-OPE-5002 and the FHI boiler design data (MCR 460 T/H). The numbers quoted are the table points. */
window.LS_FXINFO = (function () {
  const T = {};
  const put = (keys, o) => keys.forEach(k => (T[k] = o));
  /* ---------- STN101: combustion, fuel and air (ABC-002 / 003 / 004) ---------- */
  put(['S1-LN1'], {
    what: 'Turns the MV of the diesel oil calorie station HS-OIL (0 ~ 100 %) into a correction factor 0.8 ~ 1.2 (50 % = 1.0).',
    from: 'HS-OIL, a MAN station on ABC-002 that the operator sets by hand.',
    to: 'Multiplies the measured diesel oil flow: the result is DIESEL OIL FLOW (SI0004), part of TOTAL FUEL FLOW (SI0017). That total sets the air the boiler needs (LN22) and the coal flow demand (SI0010).',
    why: 'Diesel oil does not always carry the same heat per ton. The factor tells the combustion control how much "real fuel" the oil flow is, so the air follows the heat, not only the tons.',
    change: 'Higher LY: the same oil flow counts as more fuel, so total fuel flow and the air demand go up and the coal demand goes down. Lower LY: the opposite.'
  });
  put(['S1-LN3'], {
    what: 'Turns the MV of the total coal flow correction controller HS-COAL (0 ~ 100 %) into a coal calorie factor 0.8 ~ 1.2 (50 % = 1.0).',
    from: 'HS-COAL (ABC-004A), a PID. Its PV is the fuel flow deviation after LN44; when the station is forced to manual (M.2020) the MV holds.',
    to: 'Multiplies the measured coal flow (SI0003). On the 150 MW snapshot: MV 33.1 % gives 0.932, so 87.0 T/H of coal counts as 81.1 T/H (the screen shows 4450 x 0.932 = 4150 kcal/kg). The corrected coal flow goes into TOTAL FUEL FLOW and the coal master.',
    why: 'Coal heat value changes from cargo to cargo. HS-COAL slowly trims this factor so the boiler gets the heat it is asked for (BTU correction).',
    change: 'Higher LY: each ton counts as more heat, the corrected coal flow rises and the coal master cuts the feeders. Lower LY: the feeders are pushed up for the same load.'
  });
  put(['S1-LN44'], {
    what: 'Dead band of ±1 on the fuel flow deviation: above +1 the output is -1, below -1 it is +1, in between it is 0.',
    from: 'SI0207: the difference of two lagged signals on ABC-004A (fuel demand against the corrected fuel flow).',
    to: 'TOTAL COAL FLOW CORRECT. CONTROL PV (SI0237), the PV of HS-COAL, which then moves the calorie factor of LN3.',
    why: 'Small, normal differences must not move the calorie factor. Only a lasting deviation bigger than 1 makes HS-COAL correct.',
    change: 'A wider dead band (move the ±1 points out) makes the correction lazier; a narrower one makes it react to small swings.'
  });
  put(['S1-LN5'], {
    what: 'Boiler master demand (fuel, 0 ~ 120 T/H) to the air the boiler needs (0 ~ 1115 T/H) on coal firing.',
    from: 'The boiler master (HIC-BM / PIC-COBM on ABC-001C) through ABC-002.',
    to: 'TOTAL AIR FLOW REQUIRED (SI0021), then TAF DEMAND (SI0036), the secondary air demand (SI0042 / SI0043 / SI0317) and the O2 tracking.',
    why: 'Air leads fuel: when the load demand goes up, the air is raised from the demand itself, before the coal arrives. The table keeps a minimum of 446 T/H (purge and fluidizing floor) up to 35 T/H of fuel, then 616 T/H at 81 T/H (150 MW).',
    change: 'Higher LY: more excess air for the same demand (O2 goes up, fan power goes up). Lower LY: less air; too low and the O2 control and the cross limit (LN40) start limiting the fuel.'
  });
  put(['S1-LN22'], {
    what: 'Total fuel flow (0 ~ 120 T/H) to the total air flow it needs (0 ~ 1115 T/H).',
    from: 'TOTAL FUEL FLOW (SI0017): corrected coal flow plus diesel oil flow (LN1, LN3).',
    to: 'TFF VS AIR REQUIRED (SI0018), high-selected with LN5 into TOTAL AIR FLOW REQUIRED (SI0021), then TAF DEMAND and the secondary air demand.',
    why: 'Second half of the cross limit: the air demand is the HIGHER of "air for the fuel demand" (LN5) and "air for the fuel that is really burning" (this table). On a load drop the air stays up until the fuel has really gone down, so the boiler never runs short of air.',
    change: 'Higher LY: more air for the fuel that burns (safer, more O2). Lower LY: the measured fuel asks for less air.'
  });
  put(['S1-LN40'], {
    what: 'Total air flow (0 ~ 1115 T/H) back to the fuel flow that air can burn (0 ~ 120 T/H). It is the inverse of LN22: 446 T/H = 35 T/H, 606 T/H = 81 T/H.',
    from: 'The total air flow measured (TAF) on ABC-002.',
    to: 'TOTAL UNIT AIR FLOW - FUEL DEMAND (SI0019), the low select BOILER LOAD SELECT MIN. (SI0014) and the COAL FLOW DEMAND (SI0010 / SI0023).',
    why: 'Fuel follows air: the coal demand can never be more than the air that is really there. If a fan trips or lags, the coal demand is cut to what the air can burn.',
    change: 'Higher LY: the same air allows more fuel (less margin). Lower LY: the fuel is limited earlier.'
  });
  put(['S1-LN7'], {
    what: 'Total diesel oil flow (0 ~ 14 T/H) to a secondary air flow demand (180 ~ 245 T/H).',
    from: 'The total start-up burner oil flow, through a page link of ABC-002.',
    to: 'The secondary air flow demand of ABC-002 during oil firing.',
    why: 'When only the start-up burners fire, the boiler master is low but the burners still need air. The table gives a minimum secondary air for the oil that is burning.',
    change: 'Higher LY: more secondary air with the burners in service.'
  });
  put(['S1-LN8'], {
    what: 'Total diesel oil flow (0 ~ 14 T/H) to a primary air flow demand (180 ~ 245 T/H).',
    from: 'The total start-up burner oil flow, through a page link of ABC-002.',
    to: 'The primary air flow demand of ABC-002 during oil firing.',
    why: 'The bed must stay fluidized while the oil burners heat it: the table keeps the primary air up with the oil flow.',
    change: 'Higher LY: more primary air (stronger fluidizing, more bed cooling).'
  });
  put(['S1-LN12'], {
    what: 'Total coal flow (0 ~ 120 T/H) to the primary air flow demand (0 ~ 648 T/H): 285 T/H up to 35 T/H of coal, 380 T/H at 81 T/H.',
    from: 'TCF, the total coal flow (SI0140) on ABC-002.',
    to: 'PRI. AIR FLOW DEMAND (SI0030 / SI0031), PA FLOW DEMAND1 (SI0310); the rest of the total air demand becomes the secondary air demand (SI0041 / SI0042).',
    why: 'In a CFB the primary air fluidizes the bed and burns the coal in the lower furnace. More coal needs more primary air; the floor of 285 T/H keeps the bed fluidized at low load.',
    change: 'Higher LY: more primary air and less secondary air for the same total (bed temperature drops, more carry-over). Lower LY: less fluidizing (risk of a defluidized bed at low load).'
  });
  put(['S1-LN14'], {
    what: 'The MV of the PA flow bias station HIC-TADBS (0 ~ 100 %) to a primary air flow bias in T/H.',
    from: 'HIC-TADBS, a MAN station the operator sets on ABC-002.',
    to: 'Added to PA FLOW DEMAND1 (SI0310), the setpoint side of the primary air flow control.',
    why: 'Lets the operator add or take primary air by hand (bed temperature, fluidizing) without touching the curve.',
    change: 'Change the curve to change how much bias each % of the station gives.'
  });
  put(['S1-LN15'], {
    what: 'The O2 controller MV (0 ~ 100 %) to a correction ratio 0.8 ~ 1.2 on the secondary air demand.',
    from: 'AICFG112, the O2 controller (ABC-002), through its MAN / AUTO transfer (force manual M.0103, tracking M.0102).',
    to: 'SEC. AIR FLOW DEMAND AFTER O2 CORRECT (SI0043) and SEC. AIR FLOW DEMAND (SI0317).',
    why: 'The O2 loop trims the secondary air: if the flue gas O2 is low, the ratio rises above 1.0 and the SA fan gives more air.',
    change: 'A steeper curve makes the O2 trim stronger; a flatter curve makes it weaker.'
  });
  put(['S1-LN16'], {
    what: 'Boiler master (fuel, 0 ~ 120 T/H) to the O2 setpoint (0 ~ 25 %): 8 % at low load, 3.5 % at full load.',
    from: 'The boiler master demand of ABC-001C.',
    to: 'O2 CONTROL SV (SI0052, SI0053 after the ramp), the SV of AICFG112.',
    why: 'At low load the furnace needs more excess air (mixing, flame stability); at full load 3.5 % O2 is enough (the DATA sheet of the workbook: 8.0 % at 40 % load, 3.5 % at 100 %).',
    change: 'Higher LY: more O2 is asked, the SA fan gives more air. Lower LY: less air, better efficiency, but a risk of CO.'
  });
  put(['S1-LN17'], {
    what: 'The MV of the O2 bias station HS-O2 (0 ~ 100 %) to an O2 setpoint bias (0 ~ 21 %).',
    from: 'HS-O2, a MAN station on ABC-002.',
    to: 'Added to the O2 setpoint: O2 CONTROL SV (SI0052 / SI0053) of AICFG112.',
    why: 'The operator moves the O2 setpoint up or down without changing the curve of LN16.',
    change: 'Change the curve to change how much O2 each % of HS-O2 adds.'
  });
  put(['S1-LN29'], {
    what: 'SA flow parameter (actual SA over SA demand, in %) to the O2 station tracking value: 0 up to 80 %, 50 at 100 %, 100 at 120 %.',
    from: 'SI0047, the SA flow / SA flow demand ratio on ABC-002.',
    to: 'The O2 station (AMT of AICFG112) as its tracking value: O2 CORRECT FACTOR (SI0046) while the O2 loop is not in AUTO.',
    why: 'Bumpless transfer: while the O2 loop is in manual its output follows the real ratio, so pressing A gives no jump in the secondary air.',
    change: 'Only the manual-to-auto transfer point changes; normal AUTO control is not affected.'
  });
  put(['S1-LN9'], {
    what: 'The MV of a burner secondary air bias station (HIC-SADBSA / B / C / D, 0 ~ 100 %) to a bias of 0 ~ 65 T/H.',
    from: 'HIC-SADBSA ~ D, MAN stations on ABC-003A ~ D (one per start-up burner).',
    to: 'The hot secondary air SV of that burner: x-BNR SA (HOT) CONTROL SV (SI0091 / SI0096 / SI0411 / SI0416), the SV of FICFA1043A ~ D.',
    why: 'Each start-up burner can get more or less air by hand (flame shape, purge position at 25 %).',
    change: 'Change the curve to change how much air each % of the bias station adds.'
  });
  put(['S1-LN19'], {
    what: 'Burner oil flow (0 ~ 3.5 T/H) to the burner secondary air demand (0 ~ 65 T/H): 26 T/H minimum, 70 T/H at 3.5 T/H.',
    from: 'The burner supply oil flow FT-DO1043-A ~ D (AI0515 / AI0546 / AI0517 / AI0548); a switch takes 0 when both oil valves are closed (M.3410 ~ M.3417).',
    to: 'BNR-x SA FLOW DEMAND1 (SI0105 ~ SI0108), then the SV of FICFA1043A ~ D (hot air to that burner).',
    why: 'Each burner gets the air that its oil needs; the 26 T/H floor keeps a cooling and purge flow through the burner.',
    change: 'Higher LY: richer air at each oil flow (cleaner flame, more O2). Lower LY: the flame may smoke.'
  });
  put(['S1-LN21'], {
    what: 'The MV of a burner fuel / air ratio station (HIC-AFAR ~ DFAR, 0 ~ 100 %) to a ratio 0.8 ~ 1.2.',
    from: 'HIC-AFAR / BFAR / CFAR / DFAR, MAN stations on ABC-003A ~ D.',
    to: 'Multiplies the burner air demand of LN19: BNR-x SA FLOW DEMAND1, then the SV of FICFA1043A ~ D.',
    why: 'Fine tuning of the air of each start-up burner without changing the curve of LN19.',
    change: 'Change the curve to change the ratio range of the station.'
  });
  put(['S1-LN23', 'S1-LN25', 'S1-LN27'], {
    what: 'The MV of a coal feeder bias station (A-BIAS / B-BIAS / C-BIAS, 0 ~ 100 %) to a coal flow bias of 0 ~ 40 T/H.',
    from: 'A-BIAS, B-BIAS, C-BIAS: MAN stations on ABC-004A ~ C.',
    to: 'x-COAL FLOW DEMAND (SI0116 / SI0126 / SI0136), the AUTO MV of the feeder (SI0111 / SI0121 / SI0131) and the feeder station FICCL1061A ~ C (its AO to the feeder speed).',
    why: 'Shares the coal between the three feeders: one feeder can be given more or less than the others while the total stays with the coal master.',
    change: 'Change the curve to change how many T/H each % of bias moves.'
  });
  put(['S1-LN13'], {
    what: 'IDF furnace pressure demand (hydraulic coupling MV, 0 ~ 100 %) to the IDF inlet damper demand: the damper opens 0 → 100 % while the demand goes 0 → 14 %, then stays fully open.',
    from: 'PICFG108.MV, the furnace pressure controller on the hydraulic coupling (ABC-008), with its BU-CMD M.020D and force manual M.0205.',
    to: 'AO0226 PCD-FG1056-1, the IDF inlet vane / damper, through PICFG108A.',
    why: 'Split range: at a small draft demand the damper does the work; above 14 % the damper is wide open and the hydraulic coupling speed controls the draft (PR-OPE-5002 IDF start-up: coupling about 13 %, damper about 93 %).',
    change: 'Moving the 14 % point right makes the damper share a bigger part of the range (slower coupling action).'
  });
  put(['S1-LN50'], {
    what: 'PA + SA flow control demand (0 ~ 100 %) to a furnace pressure demand for the hydraulic coupling (straight line 0 → 100).',
    from: 'SI0187 on ABC-008: the sum of the PA and SA fan demands (PAF-MV, SAF-MV) when the fans run (M.3302 / M.3303).',
    to: 'The furnace pressure control of the IDF hydraulic coupling (feed forward).',
    why: 'Feed forward: when the forced draft fans push more air, the IDF is told at once to pull more gas, so the furnace pressure does not swing positive.',
    change: 'Higher LY: a stronger IDF feed forward.'
  });
  put(['S1-LN51'], {
    what: 'PA + SA flow control demand (0 ~ 100 %) to a furnace pressure demand for the IDF damper (straight line 0 → 100).',
    from: 'SI0187 on ABC-008: the sum of the PA and SA fan demands when the fans run.',
    to: 'The furnace pressure control of the IDF damper (feed forward).',
    why: 'The same feed forward as LN50, for the damper side of the split range.',
    change: 'Higher LY: a stronger damper feed forward.'
  });
  put(['S1-LN34'], {
    what: 'The MV of a bottom ash cooler bias station (HICL1060A ~ D, 0 ~ 100 %) to a speed bias of -25 ~ +25 % (50 % = 0).',
    from: 'HICL1060A ~ D, MAN stations on ABC-009A / 009B.',
    to: 'x-ASH SCREW COOLER SPEED DEMAND (SI0344 / SI0354 / SI0374 / SI0324), the AUTO MV and the screw cooler speed station SICL1060A ~ D.',
    why: 'Shares the ash removal between the four screw coolers: the bed level (bed pressure) is kept by the master while one cooler can run faster or slower.',
    change: 'Change the curve to change the bias range.'
  });
  /* ---------- STN101: water, steam and spray (ABC-010 / 011 / 012 / 013 / 001C / 001D) ---------- */
  put(['S1-LN30'], {
    what: 'Feedwater temperature (0 ~ 300 °C) to the water density (kg/m3): 1007.8 at 0 °C, 833.3 at 245.4 °C (the design point).',
    from: 'AI0592, the feedwater temperature.',
    to: 'FEED WATER FLOW COMPENSATION (SI0266 / SI0267), FEED WATER FLOW AVERAGE (SI0269), the PV of FICFW1007 and the three-element drum level control LICBR1001 (feedwater minus steam flow, SI0258).',
    why: 'A flow orifice measures a differential pressure; the real mass flow depends on the density. Hot water is lighter, so the flow is corrected with the temperature.',
    change: 'Wrong density = wrong feedwater flow: the drum level control then balances feedwater against steam with an error.'
  });
  put(['S1-LN31'], {
    what: 'Main steam pressure (0 ~ 150 kg/cm2) to a density term: 35.971 at 125 kg/cm2 (the design point).',
    from: 'AI0131 PT-MS1002, the finishing superheater outlet pressure.',
    to: 'MSF AFTER TP COMPENSATION (SI0230), the main steam flow used by the three-element drum level control, the boiler master and the low-flow signals M.2001 (< 10 % MCR, 46 T/H), M.2002 (< 15 %, 69 T/H), M.0101 (> 220 T/H).',
    why: 'Steam density changes a lot with pressure: the steam flow from the nozzle is corrected so that 460 T/H means 460 T/H at any pressure.',
    change: 'A wrong curve shifts the steam flow, the drum level balance and the 220 T/H boiler master permissive.'
  });
  put(['S1-LN32'], {
    what: 'Main steam temperature (0 ~ 600 °C) to a density term: 35.971 at 538 °C (the design point).',
    from: 'The main steam temperature, through a page link of ABC-001C.',
    to: 'MSF AFTER TP COMPENSATION (SI0230) together with LN31, and the same users (drum level, boiler master, M.2001 / M.2002 / M.0101).',
    why: 'The temperature part of the steam density correction.',
    change: 'Same as LN31.'
  });
  put(['S1-LN38'], {
    what: 'Drum pressure (0 ~ 250 kg/cm2) to the factor N (x 100 %) of the drum level pressure compensation.',
    from: 'SI0156, the selected drum pressure of PT-BR1001-1 (AI0128) and PT-BR1001-2 (AI0385).',
    to: 'The compensated drum levels LIBR10011 / 10012 / 10013.PV, the drum level control PV (SI0256, LICBR1001 / 1001A / 1001B) and the level trips M.0170 / M.0172 (LL -254 mm), M.0173 / M.0175 (HH +254 mm), B.0804 deviation 5 %.',
    why: 'A level transmitter sees the water and the steam above it; their densities change with the drum pressure. Without this the level reads wrong at low pressure (start-up) or at full pressure (from the Drum Level Calculation file).',
    change: 'A wrong curve shifts the drum level: the control holds the wrong real level and the LL / HH trips act at the wrong water level.'
  });
  put(['S1-LN39'], {
    what: 'Drum pressure (0 ~ 250 kg/cm2) to the factor K (a ratio) of the drum level pressure compensation.',
    from: 'SI0156, the selected drum pressure (AI0128, AI0385).',
    to: 'The same as LN38: LIBR10011 ~ 10013.PV, LICBR1001 and the LL / HH level trips.',
    why: 'Second factor of the same density correction (see LN38).',
    change: 'Same as LN38.'
  });
  put(['S1-LN42'], {
    what: 'Drum pressure (0 ~ 250 kg/cm2) to its saturation temperature (0 ~ 600 °C).',
    from: 'The drum pressure, through a page link of ABC-011.',
    to: '+15 °C (SI0273), then the R-SV of the 1st desuperheater spray control TICBR1130 (SI0274).',
    why: 'The steam after the 1st spray must stay superheated: its temperature setpoint is never lower than saturation + 15 °C, so the spray cannot make wet steam.',
    change: 'Higher LY: a higher minimum spray outlet temperature (less spray allowed).'
  });
  put(['S1-LN43'], {
    what: 'Main steam pressure (0 ~ 150 kg/cm2) to its saturation temperature (0 ~ 600 °C).',
    from: 'The main steam pressure from ABC-001C (page link 001C).',
    to: '+15 °C (SI0283), then the R-SV of the 2nd desuperheater spray control TICBR1150 (SI0284).',
    why: 'The same protection as LN42 for the 2nd spray: no wet steam to the finishing superheater and the turbine.',
    change: 'Higher LY: a higher minimum spray outlet temperature.'
  });
  put(['S1-LN46', 'S1-LN48'], {
    what: 'Spray temperature control MV (0 ~ 100 %) to control valve (2): it opens 0 → 100 % while the MV goes 0 → 22 %.',
    from: 'TICBR1130.MV (1st spray, ABC-011) or TICBR1150.MV (2nd spray, ABC-012), with their BU-CMD and force manual.',
    to: 'The AO of spray control valve (2) and the memory "valve (2) < 0.3 % set, > 1 % reset" (M.023C / M.024C).',
    why: 'Split range: the small valve (2) takes the small sprays, the big valve (1) joins only above 22 % (LN47 / LN49). Small flows are controlled finely.',
    change: 'Moving the 22 % point changes where valve (1) takes over.'
  });
  put(['S1-LN47', 'S1-LN49'], {
    what: 'Spray temperature control MV (0 ~ 100 %) to control valve (1): closed up to 22 %, then 0 → 100 % at MV 100 %.',
    from: 'TICBR1130.MV (1st spray) or TICBR1150.MV (2nd spray).',
    to: 'The AO of spray control valve (1) and the memory "valve (1) < 0.3 % set, > 1 % reset" (M.0238 / M.0248).',
    why: 'The second half of the split range (see LN46 / LN48).',
    change: 'Moving the 22 % point changes where valve (1) starts to open.'
  });
  put(['S1-LN18'], {
    what: 'Blow-off flow request (0 ~ 500 T/H) to the blow-off control valve demand: 14 % at 8.8 T/H, 76 % at 184 T/H, 100 % at 221 T/H.',
    from: 'STN102018, a signal from station 2 (STN102).',
    to: 'Boiler steam blow-off press. ctl RB-MV (SI0362), the AO of the main steam blow-off valve, and M.0255 (open demand > 5 %).',
    why: 'Turns a steam flow that must be blown off into the valve opening that passes it (valve characteristic).',
    change: 'Higher LY: the valve opens more for the same request.'
  });
  put(['S1-LN54'], {
    what: 'Unit load demand ULD (0 ~ 200 MW) to the fuel flow demand (0 ~ 120 T/H): 60 MW = 35 T/H, 150 MW = 81 T/H.',
    from: 'SI0226, the unit load demand on ABC-001C.',
    to: 'BOILER MASTER DEMAND (SI0213), BOILER MASTER SV (SI0225), PIC-COBM and HIC-BM (the boiler master).',
    why: 'Feed forward of the boiler master: the fuel moves with the load demand at once; the pressure controller PIC-COBM only trims the rest.',
    change: 'Higher LY: more fuel per MW (pressure rises on a load change). Lower LY: the pressure sags and PIC-COBM must correct.'
  });
  put(['S1-LN55'], {
    what: 'Main steam pressure deviation (PV - SV of PIC-COBM, kg/cm2) to a turbine override in MW: ±3 dead band, -2 MW below -3.5, +2 MW above +3.5.',
    from: 'The deviation of PIC-COBM; the PV is AI0131 PT-MS1002.',
    to: 'TURBINE MASTER R-SV (SI0236), the setpoint of the turbine master EIC-TM.',
    why: 'If the boiler cannot hold the pressure, the turbine gives back up to 2 MW so the pressure is not pulled down further (boiler follow / coordinated control).',
    change: 'A narrower dead band makes the turbine help the boiler sooner; a bigger MW value makes the help stronger.'
  });
  put(['S1-LN58'], {
    what: 'Load demand deviation (|MWD DV|, MW) to a BIR gain on a load increase: 0.55 below 5 MW, 1.0 from 5 MW, 1.2 from 20 MW.',
    from: 'The absolute load demand deviation on ABC-001D.',
    to: 'ULD UP BIR FUEL DEMAND (SI0215, SI0217 after the ramp), then BIR FUEL DEMAND (SI0219).',
    why: 'BIR (boiler input rate) gives extra fuel on a load change to store the heat the boiler needs; a bigger step gets a bigger kick.',
    change: 'Higher LY: a stronger fuel kick on a load increase (faster pressure, risk of overshoot).'
  });
  put(['S1-LN59'], {
    what: 'Load demand deviation (|MWD DV|, MW) to a BIR gain on a load decrease.',
    from: 'The absolute load demand deviation on ABC-001D.',
    to: 'ULD DOWN BIR FUEL DEMAND (SI0216, SI0218), then BIR FUEL DEMAND (SI0219).',
    why: 'The same as LN58 for a load decrease (less fuel first).',
    change: 'Higher LY: a deeper fuel cut on a load decrease.'
  });
  put(['S1-LN60'], {
    what: 'Load ramp rate (0 ~ 10 MW/min) to a BIR gain: 0.95 below 0.6 MW/min, 1.1 from 1.2 MW/min.',
    from: 'HIC-MWRL.MV, the MW rate station on ABC-001D.',
    to: 'The four BIR signals SI0215 ~ SI0218 and BIR FUEL DEMAND (SI0219).',
    why: 'A fast ramp needs a stronger BIR; a slow ramp almost none.',
    change: 'Higher LY: more BIR at the same ramp rate.'
  });
  put(['S1-LN61'], {
    what: 'Load demand (0 ~ 200 MW) to the BIR fuel on a load increase: 0 below 64 MW, 0.5 from 75 MW, 0.65 from 92 MW, 0.6 above 110 MW.',
    from: 'SI0212, the load demand on ABC-001D.',
    to: 'ULD UP BIR FUEL DEMAND (SI0215, SI0217), then BIR FUEL DEMAND (SI0219).',
    why: 'How much extra fuel the load increase gets depends on where the unit is: none at low load, most in the middle.',
    change: 'Higher LY: more extra fuel at that load.'
  });
  put(['S1-LN62'], {
    what: 'Load demand (0 ~ 200 MW) to the BIR fuel on a load decrease.',
    from: 'SI0212, the load demand on ABC-001D.',
    to: 'ULD DOWN BIR FUEL DEMAND (SI0216, SI0218), then BIR FUEL DEMAND (SI0219).',
    why: 'The same as LN61 for a load decrease.',
    change: 'Higher LY: a bigger fuel cut at that load.'
  });
  /* ---------- STN102: reheater, bypass, turbine auxiliaries ---------- */
  put(['S2-LN2'], {
    what: 'Reheater inlet header pressure (0 ~ 50 kg/cm2) to its saturation temperature (0 ~ 600 °C).',
    from: 'AI0529 PT-CR1006, the reheat inlet header pressure (with its signal status B.0991).',
    to: 'M.0172 "REHEATER IN. DE-S/H TEMP. > 11 °C ABOVE SATURATION", the permissive / force manual of the reheater spray TICHR1002.',
    why: 'The reheater spray may only work while the steam is well superheated; this curve gives the saturation temperature to compare with.',
    change: 'Higher LY: the 11 °C margin is reached later (the spray is held back longer).'
  });
  put(['S2-LN9'], {
    what: 'Load (0 ~ 200 MW) to a bias on the reheater spray temperature setpoint: 10 °C up to 75 MW, 5 °C from 112 MW.',
    from: 'The load through a page link of ABC-019.',
    to: 'R/H DE-SH SPRAY WATER TEMP. CTL SV (SI0101 before the ramp, SI0102), the SV of TICHR1002.',
    why: 'The spray only acts above the outlet temperature the gas dampers aim at: a margin of 10 °C at low load and 5 °C at high load keeps the spray as a back-up.',
    change: 'Higher LY: the spray opens later (higher temperature allowed).'
  });
  put(['S2-LN3'], {
    what: 'Unit load demand (0 ~ 200 MW) to the reheater gas damper position: 10 % at 0 MW, 45 % at 75 MW, 25 % from 112 MW.',
    from: 'S2 SI0120, the unit load demand (STN101017, lagged) on ABC-020.',
    to: 'TICHR1002A.MLD, the R/H flue gas bias damper AUTO-MV (S2 SI0130), HICHR1002A (R/H damper) and, through LN5, HICHR1002B (S/H damper).',
    why: 'Feed forward of the reheat temperature: the gas biasing dampers in the back pass split the flue gas between the reheater and the superheater side. The curve gives the damper position each load needs; TICHR1002A trims around it.',
    change: 'Higher LY: more gas to the reheater (higher reheat temperature, lower superheat).'
  });
  put(['S2-LN5'], {
    what: 'R/H gas damper demand (0 ~ 100 %) to the S/H gas damper demand: 0 → 100 %, 50 → 50 %, 90 → 10 %.',
    from: 'HICHR1002A.MV, the R/H flue gas bias damper (ABC-020).',
    to: 'S/H FLUE GAS BIAS DAMPER DEMAND (S2 SI0140), the AUTO-MV (S2 SI0141) and HICHR1002B (S/H damper AO).',
    why: 'The two dampers work against each other: when the reheater side opens, the superheater side closes, so the total gas path stays open (PR-OPE-5002 furnace purge: RH 30 % / SH 70 %, then RH 10 % / SH 90 %).',
    change: 'Changing the curve changes how the gas is shared; never close both sides.'
  });
  put(['S2-LN6'], {
    what: 'Load (0 ~ 200 MW) to the reheater outlet header temperature setpoint: 420 °C at 0 MW, 520 °C at 75 MW, 538 °C from 112 MW.',
    from: 'S2 SI0120, the unit load demand on ABC-020.',
    to: 'MW TO RH OUTLET TEMP. CTRL R-SV (SI0205, SI0206 after the ramp), the SV of TICHR1002A.',
    why: 'At low load the reheater cannot reach the rated 538 °C (FHI design: RH 370 → 541 °C); the setpoint follows what the boiler can give at each load.',
    change: 'Higher LY: a higher reheat temperature is asked at that load.'
  });
  put(['S2-LN7'], {
    what: 'Reheater outlet temperature control MV (0 ~ 100 %) to a demand of -50 ~ +50 % (straight line).',
    from: 'The limited output of TICHR1002A (LLIM after TICHR1002A.MLD).',
    to: 'REHEATER OUTLET HEADER TEMP. CONTROL DEMAND (S2 SI0129), added to the load feed forward (LN3) in the R/H damper AUTO-MV (S2 SI0130).',
    why: 'Turns the controller output into a plus / minus correction around the feed forward position of the dampers.',
    change: 'A steeper line makes the temperature correction stronger.'
  });
  put(['S2-LN8'], {
    what: 'Deviation between the damper and the feed forward (-50 ~ +50 %) to a tracking value 0 ~ 100 % (straight line).',
    from: 'S2 SI0128: the R/H damper position (HICHR1002A.MV) minus the feed forward of LN3.',
    to: 'The tracking value of TICHR1002A (S2 SI0122 RB-MV) for a bumpless return to AUTO.',
    why: 'The inverse of LN7: while the dampers are in manual, the controller output follows them so that pressing A gives no jump.',
    change: 'Must stay the inverse of LN7, otherwise the dampers jump on the transfer to AUTO.'
  });
  put(['S2-LN10'], {
    what: 'Cold reheat steam pressure (0 ~ 50 kg/cm2) to its saturation temperature (0 ~ 600 °C).',
    from: 'The cold reheat steam pressure, through a page link of ABC-051.',
    to: 'HP BYPASS STM SPRAY TEMP. CTL SV (SI0173, SI0176), the SV of TICMS1022.',
    why: 'The HP bypass spray cools the bypassed steam to cold reheat conditions; the setpoint is kept above saturation so no water reaches the reheater.',
    change: 'Higher LY: a higher HP bypass outlet temperature setpoint.'
  });
  put(['S2-LN13'], {
    what: 'HP bypass outlet pressure (0 ~ 50 kg/cm2) to its saturation temperature (0 ~ 600 °C).',
    from: 'AI0566 PT-MS1021, the HP turbine bypass outlet pressure (status B.1006).',
    to: 'The comparison with the outlet temperature (M.0717) on ABC-051.',
    why: 'Checks that the steam after the HP bypass is still superheated.',
    change: 'Higher LY: the superheat check is stricter.'
  });
  put(['S2-LN33'], {
    what: 'HP bypass pressure valve demand (0 ~ 100 %) to the HP bypass spray (temperature) valve demand: 19 → 19 %, 42 → 62 %, 92 → 100 %.',
    from: 'The HP bypass pressure control valve demand (PICMS1006), through a page link of ABC-051.',
    to: 'HP T/B bypass stm spray temp ctl BU-CMD demand2 (SI0178) and the spray valve RB-MV (SI0177) / AO.',
    why: 'Feed forward: when the bypass valve opens, spray water is given at once in proportion, before the temperature rises.',
    change: 'Higher LY: more spray for the same bypass opening (colder outlet steam).'
  });
  put(['S2-LN34'], {
    what: 'LP bypass pressure valve demand (0 ~ 100 %) to the LP bypass spray valve demand.',
    from: 'The LP bypass pressure control output (PICHR1003 through its AMT, BU-CMD M.0722, turbine trip pulse M.0124).',
    to: 'LP T/B bypass steam spray temp. control RB-MV (SI0165) and TICHR1012 (spray valve AO).',
    why: 'The same feed forward as LN33 for the LP bypass to the condenser: the steam must be cooled before the condenser.',
    change: 'Higher LY: more spray for the same LP bypass opening.'
  });
  put(['S2-LN11'], {
    what: 'LP bypass pressure deviation (PICHR1003.DV, 0 ~ 50 kg/cm2) to a time constant: 33 s at 0, 1667 s at 50 kg/cm2.',
    from: 'PICHR1003.DV: the hot reheat pressure (AI0421 / AI0513) against the SV.',
    to: 'LP BPV DEMAND RAMP TIME CONSTANT (SI0225) and the EX-MV of the LP bypass control (SI0224).',
    why: 'Sets how fast the LP bypass demand ramps for a given deviation.',
    change: 'Higher LY: a slower ramp.'
  });
  put(['S2-LN12'], {
    what: 'HP turbine first stage pressure (0 ~ 150 kg/cm2) to the LP bypass pressure setpoint: 0 → 0, 108.94 → 34.77 kg/cm2, held above.',
    from: 'SI0181, the selected first stage pressure PT-ST1001-1 / 2 / 3 (AI0883 ~ AI0885).',
    to: 'PICHR1003.SV (SI0185, SI0186), the SV of the LP bypass pressure control.',
    why: 'The first stage pressure tells the steam flow through the turbine; the hot reheat pressure normally follows it (FHI design: RH 35.1 kg/cm2 at MCR). The LP bypass setpoint sits on that line so it stays closed in normal operation and opens only when the reheat pressure rises above it.',
    change: 'Lower LY: the LP bypass opens at a lower reheat pressure.'
  });
  put(['S2-LN31'], {
    what: 'Steam flow (0 ~ 500 T/H) to an HP bypass pressure valve demand: 19 % at 8.6 T/H, 62 % at 141, 80 % at 193, 100 % at 227 T/H.',
    from: 'The steam flow (STN101015) through a switch that acts on a turbine trip / house load / generator breaker open (M.0701).',
    to: 'HP TURBINE BYPASS STEAM PRESSURE CONTROL RB-MV (SI0164), PICMS1006 (HP bypass valve AO) and the memories M.0706 / M.0707 / M.0709 / M.071A / M.071E.',
    why: 'Fast opening: when the turbine trips, the HP bypass jumps at once to the opening that passes the steam the boiler is making, so the pressure does not rise to the safety valves.',
    change: 'Higher LY: a bigger first opening on a trip.'
  });
  put(['S2-LN32'], {
    what: 'Steam flow (0 ~ 500 T/H) to an LP bypass pressure valve demand: 19 % at 12.6 T/H, 46 % at 172, 81 % at 388, 100 % at 503 T/H.',
    from: 'The steam flow, with the same turbine trip switch (M.0701, I.0400 turbine trip, I.0932 GCB 52G1 off).',
    to: 'LP BYPASS PRESSURE CONTROL VALVE DEMAND (SI0163).',
    why: 'The same fast opening as LN31 for the LP bypass to the condenser.',
    change: 'Higher LY: a bigger first opening of the LP bypass on a trip.'
  });
  put(['S2-LN16'], {
    what: 'Cold reheat to aux. steam pressure control MV (0 ~ 100 %) to control valve (2): 0 → 100 % while the MV goes 0 → 13 %.',
    from: 'PICAS1005.MV (ABC-030), with its BU-CMD M.0129 and force manual M.012A.',
    to: 'The AO of control valve (2) of the cold reheat to aux. steam line.',
    why: 'Split range: the small valve first, the big valve (LN17) from 13 %.',
    change: 'Moving the 13 % point changes where valve (1) takes over.'
  });
  put(['S2-LN17'], {
    what: 'Cold reheat to aux. steam pressure control MV (0 ~ 100 %) to control valve (1): closed up to 13 %, then 0 → 100 %.',
    from: 'PICAS1005.MV (ABC-030).',
    to: 'The AO of control valve (1) of the cold reheat to aux. steam line.',
    why: 'The second half of the split range (see LN16).',
    change: 'Moving the 13 % point changes where valve (1) starts to open.'
  });
  put(['S2-LN18'], {
    what: 'Steam seal feed valve position (0 ~ 100 %) to its Cv value (0 ~ 28).',
    from: 'AI0886 PV-GS1031, the steam seal feed valve manipulation value.',
    to: 'Summed with LN19 (SI0246), then LN21 and the gland steam desuperheater spray TICAS1017 (feed forward, SI0248 OMV).',
    why: 'The spray needed for the gland steam depends on how much steam flows; the Cv of the feed valves tells that flow.',
    change: 'Higher LY: more spray feed forward for the same valve position.'
  });
  put(['S2-LN19'], {
    what: 'HP turbine warming valve position (0 ~ 100 %) to its Cv value.',
    from: 'AI0757 ZT-AS1011, the HP turbine warming valve position.',
    to: 'Summed with LN18 (SI0246), then LN21 and TICAS1017.',
    why: 'The second steam user of the same header (see LN18).',
    change: 'Higher LY: more spray feed forward for the same warming valve position.'
  });
  put(['S2-LN20'], {
    what: 'Aux. steam header temperature (0 ~ 600 °C) to a factor 0 ~ 100 %: 0 up to 250 °C, 100 % from 350 °C.',
    from: 'AI0642 TT-AS1003, the aux. steam header temperature (rate block).',
    to: 'Multiplies the spray feed forward: GLAND STEAM DE-S/H SPRAY WATER TEMP. CONTROL OMV (SI0248), TICAS1017.',
    why: 'No spray is needed while the aux. steam is cooler than 250 °C; the feed forward grows as the steam gets hotter.',
    change: 'Moving the 250 / 350 °C points changes when the spray feed forward starts and ends.'
  });
  put(['S2-LN21'], {
    what: 'Total Cv (0 ~ 100 %) to the spray valve output: 10 % at 2.5, 20 % at 7, 80 % at 40, 100 % at 50.',
    from: 'SI0247: the Cv of the steam users (LN18 + LN19) times the temperature factor (LN20).',
    to: 'GLAND STEAM DE-S/H SPRAY WATER TEMP. CONTROL OMV (SI0248), TICAS1017 (spray valve AO).',
    why: 'Turns the needed spray flow into the spray valve opening (valve characteristic).',
    change: 'Higher LY: the spray valve opens more for the same steam flow.'
  });
  put(['S2-LN22'], {
    what: 'Turbine speed (0 ~ 4000 rpm) to the lube oil cooler outlet temperature setpoint: 38 °C at 0 rpm, 46 °C at 3600 rpm.',
    from: 'AI0534 TCS-AI1004, the turbine speed from the TCS.',
    to: 'TURBINE LUBE OIL TEMP. CTL SV (SI0264, SI0265), the SV of TICLO1002.',
    why: 'At rated speed the bearings run best with warmer, thinner oil; at turning gear the oil is kept cooler.',
    change: 'Higher LY: warmer lube oil at that speed.'
  });
  put(['S2-LN38'], {
    what: 'Heater drain level control MV (0 ~ 100 %) to the PRIMARY drain valve: 0 → 100 % while the MV goes 0 → 60 %.',
    from: 'The heater drain level controller LICHD11051 / 11061 (HP heaters 1 / 2) or LICHD11011 / 11021 / 11031 (LP heaters 1 / 2 / 3), ABC-035 ~ 039.',
    to: 'The AO of the primary (normal) drain valve to the next heater.',
    why: 'Normal drain cascades to the next lower heater; the primary valve does the work in normal operation.',
    change: 'Moving the 60 % point changes when the primary valve is wide open.'
  });
  put(['S2-LN39'], {
    what: 'Heater drain level control MV (0 ~ 100 %) to the ALTERNATE drain valve: closed up to 55 %, then 0 → 100 %.',
    from: 'The same drain level controllers as LN38 (LICHD11051 / 11061 / 11011 / 11021 / 11031).',
    to: 'The alternate (emergency) drain valve, normally to the condenser.',
    why: 'If the level keeps rising with the primary valve almost fully open (55 % and up), the alternate drain opens too, so water cannot back up into the turbine extraction line.',
    change: 'Moving the 55 % point changes when the alternate drain starts to open.'
  });
  /* ---------- STN103: furnace secondary air dampers (ABC-057) ---------- */
  const s3 = (n, mcv, up) => ({
    what:
      'Generator power (0 ~ 200 MW) to the position demand of the furnace ' +
      (up ? 'upper' : 'lower') +
      ' secondary air damper ' +
      mcv +
      ': the table gives the opening at each load.',
    from: 'The generator power, through a page link of ABC-057.',
    to: mcv + ' position demand, together with the wall bias of LN' + (up ? '23' : '24') + ' (HICFABIAS' + (up ? 'U' : 'L') + ').',
    why: 'Air staging of the CFB furnace: the ' + (up ? 'upper' : 'lower') + ' secondary air nozzles open with the load so the coal burns in stages (low NOx, even furnace temperature).',
    change: 'Higher LY: that damper opens more at that load (more air at that level of the furnace).'
  });
  for (let i = 1; i <= 22; i++) T['S3-LN' + i] = s3(i, 'MCV-FA' + (1004 + i), i % 2 === 1);
  put(['S3-LN23'], {
    what: 'The MV of the upper wall front / rear bias station (0 ~ 100 %) to a bias of -10 ~ +10 % (50 % = 0).',
    from: 'HICFABIASU, a MAN station on ABC-057.',
    to: 'The upper secondary air dampers of the front and rear walls (one side up, the other side down).',
    why: 'Balances the air between the front and the rear wall of the furnace.',
    change: 'Change the curve to change the bias range.'
  });
  put(['S3-LN24'], {
    what: 'The MV of the lower wall front / rear bias station (0 ~ 100 %) to a bias of -10 ~ +10 % (50 % = 0).',
    from: 'HICFABIASL, a MAN station on ABC-057.',
    to: 'The lower secondary air dampers of the front and rear walls.',
    why: 'Balances the lower furnace air between the walls.',
    change: 'Change the curve to change the bias range.'
  });
  return T;
})();
