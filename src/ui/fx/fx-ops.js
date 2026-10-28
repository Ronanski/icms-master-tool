/* 3.2.0-beta.9 (user 2026-10-23: "ayaw ko na nagbibigay ng fix scenario e like 150 MW, pano kung hindi. ... effect nya sa operations,
   kailan at paano sya nagbabago, auto at manual, talagang learning"): two more fields for each F(X) table, added to LS_FXINFO.
   ops = In operation: when the input moves (start-up, load up / down, shutdown, trip) and what the output then does.
   am  = AUTO / MANUAL: what the table does when the controller or station around it is in AUTO, MANUAL or BU-CMD.
   Written from the same sources as fx-info.js (the drawing paths, PR-OPE-5002 / 5003, the FHI design curves) and the A / M rules of
   CLAUDE.md (MANUAL holds the MV, BU-CMD = MANUAL with the MV held, tracking gives a bumpless return to AUTO). No fixed operating point. */
(function () {
  const T = window.LS_FXINFO;
  if (!T) return;
  const O = {};
  const put = (keys, o) => keys.forEach(k => (O[k] = o));
  /* a MAN station (bias / ratio / calorie set by hand) */
  const manSt = (st, eff) =>
    st + ' is a MAN station: the operator sets its MV by hand and it stays there. The table never moves on its own; it moves only when someone changes ' +
    st + '. ' + (eff || '');
  /* a split range valve pair */
  const split = (ctl, small) =>
    'Follows ' + ctl + '.MV. In AUTO the controller moves the MV and the two valves share it: ' + small +
    '. In MANUAL (operator or force manual) the MV holds, so both valves hold. On a BU-CMD the station goes to MANUAL with the MV held; it does not return to AUTO until the operator presses A.';

  /* ---------- STN101: combustion, fuel and air ---------- */
  put(['S1-LN1'], {
    ops: 'Matters only while diesel oil is burning: during start-up (oil burners heating the bed) and when oil supports a low load or an unstable bed. When the burners are off, the oil flow is 0 and the factor multiplies nothing, whatever its value.',
    am: manSt('HS-OIL', 'Normally left at 50 % (factor 1.0) unless the oil quality is known to differ.')
  });
  put(['S1-LN3'], {
    ops: 'Coal heat value changes with every cargo, so this factor drifts slowly over hours, not seconds. During start-up, before coal feeding, the coal flow is 0 and the factor has no effect. After coal is in and HS-COAL is in AUTO, the factor creeps up or down until fuel demand and the corrected fuel flow agree. On a load change the factor does not jump: the dead band of LN44 and the lags keep it steady.',
    am: 'HS-COAL in AUTO: the factor is trimmed by the fuel flow deviation. HS-COAL in MANUAL or forced manual (M.2020): the MV holds, so the factor is frozen at its last value. Press A only when the deviation is small; the PID then moves the factor slowly again.'
  });
  put(['S1-LN44'], {
    ops: 'In steady operation the deviation stays inside ±1 and the output is 0, so HS-COAL rests. During a load ramp the demand leads the real coal flow for a while; if the deviation stays outside the band, HS-COAL starts to correct. When the load settles, the deviation returns inside the band and the correction stops.',
    am: 'The table itself has no mode. Its output is the PV of HS-COAL: it acts only while HS-COAL is in AUTO; in MANUAL the PV is shown but the MV does not follow it.'
  });
  put(['S1-LN5'], {
    ops: 'Start-up: the demand is low, the table sits on its floor, so the air stays at the purge and fluidizing minimum while the bed heats. Load up: the demand rises first and the air rises with it, before the coal arrives (air leads fuel). Load down: the demand falls but LN22 keeps the air up until the real fuel has dropped. Above the floor, every T/H of fuel demand adds air along the slope of the curve.',
    am: 'Follows the boiler master. Boiler master in AUTO: the demand comes from the load and the pressure trim. Boiler master in MANUAL or BU-CMD: the demand is the operator MV, held still, so the air demand from this table holds too. The air flow controllers downstream keep their own A / M.'
  });
  put(['S1-LN22'], {
    ops: 'Rises and falls with the fuel that is really burning, so it lags the demand. On a load increase it stays below LN5 (demand leads). On a load decrease or a fuel cut it is the higher signal and holds the air up until the fuel has gone, so the furnace is never short of air.',
    am: 'No mode of its own: it follows the measured fuel. Even with the boiler master in MANUAL this side still works, because it reads the real fuel flow.'
  });
  put(['S1-LN40'], {
    ops: 'In normal operation the air is already above what the fuel needs, so this limit is not the low select and does nothing. It takes over when the air falls behind: a slow fan on a fast load increase, a fan trip, a damper stuck. Then the coal demand is cut to what the air can burn until the air recovers.',
    am: 'Works in every mode; it is a protection, not a control. In MANUAL of the air controllers the air may stay low, and this table then keeps limiting the coal demand.'
  });
  put(['S1-LN7', 'S1-LN8'], {
    ops: 'Start-up: as the operator lights burners one by one and raises the oil, the air demand from this table rises from its minimum. When coal takes over and the oil burners are stopped, the oil flow goes to 0 and the table falls back to its minimum; the coal side of the air demand then sets the air.',
    am: 'No mode of its own: it follows the measured oil flow. The fan and air flow controllers downstream need to be in AUTO for the demand to reach the air; in MANUAL they hold their MV.'
  });
  put(['S1-LN12'], {
    ops: 'Low load and start-up: the coal flow is small and the table holds its floor, so the bed stays fluidized. As coal rises with the load, the primary air rises along the slope and the rest of the total air goes to the secondary air. On a load drop the primary air falls back toward the floor, never below it.',
    am: 'Follows the measured coal flow. The PA flow controller must be in AUTO to follow it; in MANUAL its MV holds and only the setpoint display moves.'
  });
  put(['S1-LN14'], {
    ops: 'Used when the bed needs help: bed temperature drifting, poor fluidizing, a change of coal. The operator adds or takes primary air by hand on top of the curve of LN12; the bias stays until it is changed back.',
    am: manSt('HIC-TADBS', 'Leave it at the zero bias point when no correction is needed.')
  });
  put(['S1-LN15'], {
    ops: 'In steady firing the O2 controller trims the ratio a little around 1.0. On a load change the O2 swings and the ratio moves to bring it back. During start-up on oil the O2 loop is normally in MANUAL and the ratio stays near 1.0.',
    am: 'AICFG112 in AUTO: the ratio moves with the O2 error. In MANUAL or force manual (M.0103): the MV holds and so does the ratio. While it is in MANUAL, LN29 makes it track the real air ratio, so pressing A gives no jump.'
  });
  put(['S1-LN16'], {
    ops: 'Low load and start-up: more excess air is asked (higher O2 setpoint) for flame stability and mixing. As the load rises the setpoint walks down along the curve; as the load falls it walks back up. The setpoint is ramped, so a fast load change does not make it jump.',
    am: 'Follows the boiler master. It becomes the SV of AICFG112, which acts on it only in AUTO. In MANUAL the SV is still shown, but the MV holds.'
  });
  put(['S1-LN17'], {
    ops: 'Used when the operator wants a different O2 than the curve: for example more O2 when combustion looks poor or CO rises, less when the stack loss is high. The bias stays until it is changed back.',
    am: manSt('HS-O2', 'The bias adds to the setpoint in every mode, but only an AUTO O2 controller acts on it.')
  });
  put(['S1-LN29'], {
    ops: 'Works in the background whenever the O2 loop is not in AUTO, for example during start-up and after a trip. It keeps the O2 station output equal to the real secondary air ratio, so the operator can put O2 in AUTO at any load without a bump.',
    am: 'Active only while AICFG112 is not in AUTO (tracking, M.0102). In AUTO it is ignored and the PID owns the output.'
  });
  put(['S1-LN9'], {
    ops: 'Used around each start-up burner: purge (the air is set to the purge position), light-off, and while the burner is in service. When the burner is stopped the air goes back to the purge or cooling minimum.',
    am: manSt('HIC-SADBSA ~ D', 'Each burner has its own station.')
  });
  put(['S1-LN19'], {
    ops: 'Before light-off the oil valves are closed and the table gives its floor (cooling and purge air). When the burner is lit and the oil is raised, the air rises with the oil. When the burner is shut, the switch takes 0 oil and the air returns to the floor.',
    am: 'Follows the measured burner oil flow. FICFA1043A ~ D must be in AUTO to follow the demand; in MANUAL the damper holds.'
  });
  put(['S1-LN21'], {
    ops: 'Used during start-up burner firing to fine-tune each flame (too smoky: more air; too lean: less). It has no effect when the burner is out because the demand it multiplies is at its floor.',
    am: manSt('HIC-AFAR ~ DFAR', 'Leave it at 50 % (ratio 1.0) unless a burner needs correction.')
  });
  put(['S1-LN23', 'S1-LN25', 'S1-LN27'], {
    ops: 'Used when one feeder must carry more or less coal than the others: a feeder starting or stopping, uneven coal, a mill or feeder problem. The coal master keeps the total; the bias only shifts the share.',
    am: manSt('A-BIAS / B-BIAS / C-BIAS', 'The feeder station must be in AUTO for the bias to reach the feeder speed; in MANUAL the feeder holds its speed.')
  });
  put(['S1-LN13'], {
    ops: 'IDF start-up and low draft: the damper does the work while the coupling demand is small. When the draft demand passes the split point, the damper is fully open and only the coupling speed moves. On a load drop the coupling slows first; below the split point the damper starts to close again.',
    am: 'Follows PICFG108.MV. AUTO: the MV follows the furnace pressure. MANUAL or force manual (M.0205): the MV holds, damper and coupling hold. BU-CMD (M.020D): MANUAL with the MV held until the operator presses A. Force manual also comes when the MV is below 14 % (raise the MV first).'
  });
  put(['S1-LN50', 'S1-LN51'], {
    ops: 'Whenever the PA or SA fans change their output (load change, O2 trim, a fan start or stop), the IDF gets the same change at once, so the furnace pressure stays near its setpoint. With the fans stopped the sum is 0 and so is the feed forward.',
    am: 'Feed forward reaches the IDF only while the furnace pressure control is in AUTO. In MANUAL the IDF holds and the furnace pressure follows the fans; watch it closely.'
  });
  put(['S1-LN34'], {
    ops: 'Used when the bed level or the ash coolers are uneven: one cooler blocked, too hot, or out of service. The bed master keeps the total ash removal; this bias changes how one cooler shares it.',
    am: manSt('HICL1060A ~ D', 'SICL1060A ~ D must be in AUTO for the bias to reach the cooler speed.')
  });
  /* compensations: they always work */
  const comp = what =>
    'A compensation has no mode: it works all the time, in AUTO and in MANUAL. But the controllers that use ' + what +
    ' see the corrected value, so a wrong curve shows up as a wrong PV in AUTO and as a wrong reading in MANUAL.';
  put(['S1-LN30'], {
    ops: 'Start-up: the feedwater is cold and dense, so the correction is small in one direction. As the heaters come in and the feedwater gets hotter, the water gets lighter and the correction grows. On a heater trip the feedwater cools and the correction swings back.',
    am: comp('the feedwater flow (FICFW1007, the three-element drum level)')
  });
  put(['S1-LN31', 'S1-LN32'], {
    ops: 'Start-up: pressure and temperature are low, the steam is light and the raw flow reading would be far off; the correction is biggest here. As the boiler reaches its rated pressure and temperature the factor comes to its design point. After a trip or a pressure swing the correction follows at once.',
    am: comp('the main steam flow (drum level, boiler master, the low-flow memories)')
  });
  put(['S1-LN38', 'S1-LN39'], {
    ops: 'Start-up from cold: the drum pressure is low and the water and steam densities are very different from the design point, so the correction is large. As pressure rises it walks toward the design point. On a shutdown or a pressure drop it walks back. The level trips use the corrected level, so a wrong curve can trip the boiler.',
    am: comp('the drum level (LICBR1001 / 1001A / 1001B and the LL / HH trips)')
  });
  put(['S1-LN42', 'S1-LN43'], {
    ops: 'The saturation temperature rises with the pressure: low during start-up, highest at full pressure, falling on a shutdown. The spray setpoint built from it rises and falls with it, so the spray can never cool the steam to wet.',
    am: 'No mode: it is a property of steam. It shapes the SV of the spray controller, which acts on it only in AUTO.'
  });
  put(['S1-LN46', 'S1-LN48'], {
    ops: 'Start-up and low load: little or no spray, the MV is small and only valve (2) opens. As the load and steam temperature rise the MV grows; valve (2) is fully open at the split point and valve (1) takes over above it (LN47 / LN49). On a load drop the big valve closes first.',
    am: split('TICBR1130 / TICBR1150', 'valve (2) up to 22 %, valve (1) above')
  });
  put(['S1-LN47', 'S1-LN49'], {
    ops: 'Stays closed at small sprays (start-up, low load). Opens only when valve (2) is already fully open and more spray is needed: high load, a fast load increase, high steam temperature. Closes first when the spray demand drops.',
    am: split('TICBR1130 / TICBR1150', 'valve (2) up to 22 %, valve (1) above')
  });
  put(['S1-LN18'], {
    ops: 'Used during start-up (steam blow-off before the turbine takes steam) and when there is more steam than the users can take. The more steam must be blown off, the more the valve opens along the valve characteristic.',
    am: 'Follows the blow-off flow request from station 2. The blow-off pressure control must be in AUTO for the valve to follow; in MANUAL the valve holds.'
  });
  put(['S1-LN54'], {
    ops: 'Every change of unit load demand moves the fuel demand along this curve at once (feed forward). Load up: more fuel. Load down: less fuel. The pressure controller PIC-COBM only corrects the error left over, so the boiler follows the load without waiting for the pressure to fall.',
    am: 'Used while the boiler master is in AUTO. Boiler master in MANUAL or BU-CMD (for example a turbine trip or low steam flow): the operator MV is held and the table is not used. Press A when the conditions are back (PR-OPE-5002 "Put Boiler Master to Auto").'
  });
  put(['S1-LN55'], {
    ops: 'In steady operation the main steam pressure is near its setpoint and the output is 0. On a fast load increase the pressure can fall; once it is below the dead band the turbine gives back a little load so the boiler can catch up. On a load drop the pressure rises and the turbine takes a little more.',
    am: 'Acts on the turbine master setpoint. It matters only when the turbine master is in AUTO (coordinated control); in MANUAL the turbine holds its own load.'
  });
  put(['S1-LN58', 'S1-LN59'], {
    ops: 'Active only during a load change: a small step gets a small fuel kick, a big step gets a bigger one. When the load reaches its target the deviation goes to 0 and the kick fades out.',
    am: 'BIR adds to the boiler master demand only in AUTO. With the boiler master in MANUAL or BU-CMD there is no BIR.'
  });
  put(['S1-LN60'], {
    ops: 'Follows the load ramp the operator sets on HIC-MWRL. A slow ramp gives almost no extra gain; a faster ramp gives more, because the boiler must store heat faster.',
    am: manSt('HIC-MWRL', 'The rate is used only while the load is ramping with the boiler master in AUTO.')
  });
  put(['S1-LN61', 'S1-LN62'], {
    ops: 'Matters only during a load change. At low load there is no BIR fuel; in the middle of the range the boiler gets the most; near full load a little less. So the same load step gets a different fuel kick depending on where the unit is.',
    am: 'Used only with the boiler master in AUTO, during a load change.'
  });

  /* ---------- STN102: steam temperatures, bypasses, turbine auxiliaries ---------- */
  put(['S2-LN2'], {
    ops: 'Start-up and low reheat pressure: the saturation temperature is low. As the reheat pressure rises, it rises. The reheat spray is allowed only while the steam is more than 11 °C above it; below that the spray is forced to manual.',
    am: 'No mode. It sets the permissive M.0172: when it is lost, TICHR1002 goes to MANUAL and holds; press A again after the steam is well superheated.'
  });
  put(['S2-LN9'], {
    ops: 'Low load: a wider margin, so the spray rarely acts. Higher load: a smaller margin. The setpoint is ramped, so it follows load changes smoothly.',
    am: 'Becomes the SV of TICHR1002, which uses it only in AUTO.'
  });
  put(['S2-LN3'], {
    ops: 'Start-up and low load: the reheater needs more gas, so the R/H damper is opened more as the load rises in the low range. Higher load: the reheater gets enough heat and the damper comes back to a smaller opening. The S/H damper moves the other way through LN5.',
    am: 'Feed forward for TICHR1002A. In AUTO it gives the base position and the controller trims around it. With the dampers in MANUAL the operator position holds and this table is not used.'
  });
  put(['S2-LN5'], {
    ops: 'Moves every time the R/H damper moves: purge, start-up, load changes. When the R/H side opens the S/H side closes, so the total gas path stays open.',
    am: 'Follows HICHR1002A.MV. The S/H damper station must be in AUTO to follow; in MANUAL it holds.'
  });
  put(['S2-LN6'], {
    ops: 'Start-up and low load: the reheater cannot reach the rated temperature, so the setpoint is lower. As the load rises the setpoint walks up to the rated value and then stays there. On a load drop it walks back down, ramped.',
    am: 'Becomes the SV of TICHR1002A, used in AUTO only.'
  });
  put(['S2-LN7'], {
    ops: 'Moves with the reheat temperature error: too cold, the correction opens the R/H damper more; too hot, it closes it. In steady operation it rests near the middle.',
    am: 'TICHR1002A in AUTO: the MV moves with the error. In MANUAL: the MV holds. LN8 makes it track the dampers, so pressing A gives no jump.'
  });
  put(['S2-LN8'], {
    ops: 'Works in the background whenever the reheat temperature control is not in AUTO (start-up, manual operation of the dampers).',
    am: 'Active only while TICHR1002A is not in AUTO. In AUTO the PID owns the output.'
  });
  put(['S2-LN10', 'S2-LN13'], {
    ops: 'Matter when the bypass system is used: start-up before the turbine takes steam, shutdown, and a turbine trip. The saturation temperature follows the cold reheat or bypass outlet pressure.',
    am: 'No mode. It shapes the setpoint or the superheat check of the HP bypass spray, which acts in AUTO.'
  });
  put(['S2-LN33', 'S2-LN34'], {
    ops: 'Start-up, shutdown and turbine trip: as the bypass valve opens, spray water is given at once in proportion, before the temperature rises. When the bypass closes, the spray demand falls back.',
    am: 'Feed forward to the spray valve. On a BU-CMD (turbine trip) the spray station goes to MANUAL and holds the opening it was given; the operator returns it to AUTO.'
  });
  put(['S2-LN11'], {
    ops: 'A small pressure deviation gives a short time constant, so the LP bypass answers quickly. A big deviation gives a long time constant, so the demand ramps slowly instead of slamming.',
    am: 'No mode. It shapes the LP bypass demand, which is used in AUTO.'
  });
  put(['S2-LN12'], {
    ops: 'Start-up: low first stage pressure, low setpoint. As the turbine takes steam and load, the first stage pressure and the setpoint rise along the line, staying just above the normal reheat pressure, so the LP bypass stays closed. On a turbine trip the first stage pressure falls, the reheat pressure is above the setpoint and the LP bypass opens.',
    am: 'Becomes the SV of PICHR1003, which acts in AUTO. On its BU-CMD (M.0722) the station goes to MANUAL with the MV held.'
  });
  put(['S2-LN31', 'S2-LN32'], {
    ops: 'Normally not in use. On a turbine trip, house load or generator breaker open, the switch passes the steam flow at that moment and the bypass jumps to the opening that passes it. More steam flow at the trip means a bigger opening.',
    am: 'Acts as a BU-CMD: the station is pushed to the fast-open value and then stays in MANUAL with that MV until the operator takes it.'
  });
  put(['S2-LN16', 'S2-LN17'], {
    ops: 'Start-up and low aux. steam demand: the small valve does the work. When the aux. steam header needs more steam (more users, low pressure), the big valve opens above the split point. When demand falls, the big valve closes first.',
    am: split('PICAS1005', 'valve (2) up to 13 %, valve (1) above') + ' Its BU-CMD and force manual come from M.0129 / M.012A.'
  });
  put(['S2-LN18', 'S2-LN19'], {
    ops: 'Follow the valve positions: the more the steam seal feed valve or the HP warming valve opens (turbine start-up, warming), the higher the Cv and the steam flow, so the spray feed forward grows.',
    am: 'No mode: it reads valve positions. The spray control TICAS1017 must be in AUTO to use it.'
  });
  put(['S2-LN20'], {
    ops: 'Start-up: the aux. steam is cool and the factor is 0. As it heats up past the low point, the spray feed forward grows, and it is full once the steam is hot.',
    am: 'No mode. It multiplies the feed forward of TICAS1017, used in AUTO.'
  });
  put(['S2-LN21'], {
    ops: 'Grows as the gland steam flow grows (turbine start-up, warming) and falls when the flow falls.',
    am: 'Feed forward to TICAS1017, used in AUTO. In MANUAL the spray valve holds.'
  });
  put(['S2-LN22'], {
    ops: 'Turning gear: low speed, cooler oil setpoint. Turbine run-up: the setpoint rises with the speed to the rated value. Coast-down after a trip: it falls back with the speed.',
    am: 'Becomes the SV of TICLO1002, used in AUTO.'
  });
  put(['S2-LN38'], {
    ops: 'Normal operation: the level controller opens the primary valve as the heater drain flow rises with load. Load down or a heater out of service: the drain flow falls and the valve closes.',
    am: 'Follows the drain level controller. In MANUAL the MV holds and so does the valve; watch the heater level.'
  });
  put(['S2-LN39'], {
    ops: 'Normally closed. Opens only when the primary valve is almost fully open and the level still rises: a heater upset, a high load swing, the next heater not taking drain.',
    am: 'Follows the same level controller. In MANUAL it holds; the alternate valve does not open on its own.'
  });

  /* ---------- STN103: furnace secondary air dampers ---------- */
  const s3 = up => ({
    ops:
      'Start-up and low load: the ' + (up ? 'upper' : 'lower') +
      ' damper sits at the opening the table gives for low power. As the generator power rises the damper follows the curve; on a load drop it follows back. A trip brings the power to 0 and the damper to its low-power position.',
    am: 'The damper station must be in AUTO to follow the table and the wall bias (LN' + (up ? '23' : '24') + '). In MANUAL the damper holds its position.'
  });
  for (let i = 1; i <= 22; i++) O['S3-LN' + i] = s3(i % 2 === 1);
  put(['S3-LN23', 'S3-LN24'], {
    ops: 'Used when the furnace is uneven between the front and the rear wall (temperatures, O2 or bed differences). One side gets more air, the other less, while the total stays the same.',
    am: manSt('HICFABIASU / HICFABIASL', 'Leave it at 50 % (no bias) when the walls are even.')
  });

  /* fixed operating points removed from the general text (the table points stay in "What it does") */
  if (T['S1-LN3'])
    T['S1-LN3'].to =
      'Multiplies the measured coal flow (SI0003): the result counts the tons of coal as tons of "design heat". The corrected coal flow goes into TOTAL FUEL FLOW and the coal master. Example: a factor of 0.9 makes 10 T/H of coal count as 9 T/H.';
  if (T['S1-LN5'])
    T['S1-LN5'].why =
      'Air leads fuel: when the load demand goes up, the air is raised from the demand itself, before the coal arrives. The table keeps a minimum air (purge and fluidizing floor) at low demand, then the air rises with the fuel demand.';
  for (const k in O) if (T[k]) Object.assign(T[k], O[k]);
})();
