/* 3.2.0-beta.11 (user 2026-10-23: "assume na may power plant basic knowledge kami ... more on operations effect or function ang maganda
   maipaliwanag"; card "Lahat ng tatlo"): four more fields for each F(X) table, added to LS_FXINFO, for an operator or engineer who knows
   the plant but not the DCS.
   hmi  = On the HMI: which values on the graphics / faceplates move because of this table.
   bad  = If it is wrong or the input fails: what you notice in the plant (troubleshooting).
   rise / fall = what the plant does when the OUTPUT of the table goes up / down (the "Try it" slider says it in one sentence).
   From the same paths as fx-info.js (the drawings), the A / M rules of CLAUDE.md and the FHI design data. No fixed operating point. */
(function () {
  const T = window.LS_FXINFO;
  if (!T) return;
  const O = {};
  const put = (keys, o) => keys.forEach(k => (O[k] = o));

  /* ---------- STN101: fuel ---------- */
  put(['S1-LN1'], {
    hmi: 'Diesel oil flow and total fuel flow on the combustion graphic; the air demand follows them while oil is burning.',
    bad: 'Set too high: the DCS thinks the oil gives more heat than it does, cuts the fuel demand and the bed / steam pressure rise more slowly during start-up. Too low: more air than needed, O2 high. No effect at all when the burners are out.',
    rise: 'each ton of oil counts as more heat: total fuel flow rises, so the air demand rises and the coal demand allowed for falls',
    fall: 'each ton of oil counts as less heat: total fuel flow falls, the air demand falls and more coal demand is allowed'
  });
  put(['S1-LN3'], {
    hmi: 'Coal feeder speed and total coal flow (feeder graphic), total fuel flow and, behind them, main steam pressure on the boiler master faceplate.',
    bad: 'Too high: the coal is counted as stronger than it is, the feeders run slow, the boiler is underfired and MSP sags at the same MW. Too low: overfired, MSP and steam temperature climb, more SH spray. A sudden jump means HS-COAL was moved in MANUAL or its PV (LN44) is wrong.',
    rise: 'each ton of coal counts as more heat: the corrected fuel flow rises, so the coal master slows the feeders for the same MW',
    fall: 'each ton of coal counts as less heat: the corrected fuel flow falls, so the coal master speeds the feeders up to keep the heat'
  });
  put(['S1-LN44'], {
    hmi: 'HS-COAL PV on its faceplate (ABC-004A): 0 most of the time, ±1 only after a lasting mismatch of fuel demand and corrected fuel flow.',
    bad: 'If the band is too narrow HS-COAL hunts on every load ramp and the calorie factor wanders; too wide and a new coal cargo is never corrected (MSP drifts at the same MW).',
    rise: 'HS-COAL sees a positive error and raises the calorie factor slowly',
    fall: 'HS-COAL sees a negative error and lowers the calorie factor slowly'
  });
  put(['S1-LN5'], {
    hmi: 'Total air flow demand and the PA / SA flow SVs on the air graphic; FICFA1071 / FICFA1081 SV move with the boiler master.',
    bad: 'Too low: not enough air for the coal, O2 falls, CO rises, the O2 loop runs at its limit. Too high: O2 high, more stack loss, furnace pressure control (IDF) works harder.',
    rise: 'more total air is asked for: the SA (and PA) flow SVs rise, the fans open up, O2 rises',
    fall: 'less total air is asked for: the SA flow SV falls, O2 falls'
  });
  put(['S1-LN22'], {
    hmi: 'Total air flow required on the air graphic, compared with the actual total air flow; the SA flow SV follows it.',
    bad: 'Too low: on a fuel increase the air lags, O2 dips and CO rises (air does not lead fuel). Too high: O2 stays high at all loads.',
    rise: 'the fuel needs more air: total air demand rises (high select with LN5), SA flow SV up',
    fall: 'the fuel needs less air: total air demand falls if LN5 is not higher'
  });
  put(['S1-LN40'], {
    hmi: 'Coal flow demand on the coal master FIC-CM; it limits the fuel demand to what the air can burn (air rich protection).',
    bad: 'Too high: the fuel demand is allowed above what the air can burn, CO and low O2 on a fast load up. Too low: the coal master is held back, MW cannot reach the demand.',
    rise: 'the air can burn more fuel: the fuel demand limit rises, the coal master may take more coal',
    fall: 'the air can burn less fuel: the fuel demand is cut back (low select), the feeders slow'
  });
  put(['S1-LN7', 'S1-LN8'], {
    hmi: 'PA / SA air flow SV on the air graphic during oil firing (start-up burners in service).',
    bad: 'Too low: oil burns short of air, smoke, flame unstable. Too high: the bed cools, slower warm-up. No effect without oil flow.',
    rise: 'more air is asked for with the oil: the air flow SV rises',
    fall: 'less air is asked for with the oil: the air flow SV falls'
  });
  put(['S1-LN12'], {
    hmi: 'PA flow SV (FICFA1071) on the air graphic; the SA flow SV takes the rest of the total air.',
    bad: 'Too low: the bed is not fluidized well at high coal flow (bed temperature spread, clinker risk). Too high: too much air at the bottom, carry-over, less SA for combustion control.',
    rise: 'more primary air: PA flow SV up, SA share of the total air down',
    fall: 'less primary air: PA flow SV down, SA share up'
  });
  put(['S1-LN14'], {
    hmi: 'PA flow SV on the air graphic (FICFA1071): it moves by the bias the operator sets on HIC-TADBS.',
    bad: 'A bias left far from 50 % keeps the PA flow away from the load curve: bed temperature and fluidization differ from normal at every load.',
    rise: 'the PA flow SV is biased up: more fluidizing air',
    fall: 'the PA flow SV is biased down: less fluidizing air'
  });
  put(['S1-LN15'], {
    hmi: 'AICFG112 MV and the SA flow SV after O2 correction on the air graphic; O2 on the flue gas graphic answers.',
    bad: 'If the O2 analyser fails low, AICFG112 drives this ratio to its top: SA flow high, real O2 high. Fails high: SA flow cut, CO. Put AICFG112 in MANUAL and hold the ratio near 1.0.',
    rise: 'the SA demand is multiplied up: more secondary air, O2 rises',
    fall: 'the SA demand is multiplied down: less secondary air, O2 falls'
  });
  put(['S1-LN16'], {
    hmi: 'O2 SV on the AICFG112 faceplate: higher at low load, about 3.5 % at full load.',
    bad: 'Too low: O2 too lean at low load, CO and unstable combustion. Too high: excess air, stack loss, higher fan power.',
    rise: 'the O2 SV rises: AICFG112 adds secondary air',
    fall: 'the O2 SV falls: AICFG112 takes secondary air away'
  });
  put(['S1-LN17'], {
    hmi: 'O2 SV on the AICFG112 faceplate, shifted by HS-O2.',
    bad: 'A bias left away from its normal value keeps O2 high or low at every load, even with AICFG112 in AUTO.',
    rise: 'the O2 SV is biased up: more secondary air',
    fall: 'the O2 SV is biased down: less secondary air'
  });
  put(['S1-LN29'], {
    hmi: 'AICFG112 MV while the O2 loop is in MANUAL or tracking: it follows the actual SA / SA demand ratio.',
    bad: 'Wrong tracking makes a bump when AICFG112 is put back to AUTO: the SA flow jumps and O2 swings.',
    rise: 'the O2 station tracks a higher MV (more SA is already flowing than asked)',
    fall: 'the O2 station tracks a lower MV'
  });
  put(['S1-LN9'], {
    hmi: 'Burner hot SA flow SV (FICFA1043A ~ D) on the start-up burner graphic.',
    bad: 'Bias too high: the burner gets too much air, flame blows off or cools the bed. Too low: smoky, unstable flame.',
    rise: 'the burner SA flow SV is biased up: more air to that burner',
    fall: 'the burner SA flow SV is biased down'
  });
  put(['S1-LN19'], {
    hmi: 'Burner hot SA flow SV (FICFA1043A ~ D) on the start-up burner graphic, rising with the burner oil flow.',
    bad: 'Too low: rich flame, smoke, flame scanner may lose the flame. Too high: lean, flame lifts off. With both oil valves closed the demand drops to the minimum.',
    rise: 'more air for the burner oil: the burner SA flow SV rises',
    fall: 'less air for the burner oil: the burner SA flow SV falls'
  });
  put(['S1-LN21'], {
    hmi: 'Burner hot SA flow SV (FICFA1043A ~ D), multiplied by the fuel / air ratio station of that burner.',
    bad: 'A ratio far from 1.0 makes one burner rich or lean compared with the others: uneven flame, bed temperature spread.',
    rise: 'the burner air is multiplied up: leaner flame',
    fall: 'the burner air is multiplied down: richer flame'
  });
  put(['S1-LN23', 'S1-LN25', 'S1-LN27'], {
    hmi: 'Feeder speed and coal flow of that feeder on the coal feeder graphic; the other feeders share the rest of the coal demand.',
    bad: 'A bias left on one feeder loads it more than the others: uneven coal across the bed, local high bed temperature.',
    rise: 'that feeder is biased up: it takes more of the coal demand, its speed rises',
    fall: 'that feeder is biased down: it takes less, its speed falls'
  });

  /* ---------- STN101: furnace draft ---------- */
  put(['S1-LN13'], {
    hmi: 'IDF inlet damper position (PCD-FG1056-1) and furnace pressure on the draft graphic; the hydraulic coupling takes over above the knee.',
    bad: 'If the damper curve is wrong the furnace pressure control has a dead zone or a jump at the change-over from damper to coupling: furnace pressure swings around that load.',
    rise: 'the IDF damper opens: more draft, furnace pressure goes more negative',
    fall: 'the IDF damper closes: less draft, furnace pressure rises toward 0'
  });
  put(['S1-LN50', 'S1-LN51'], {
    hmi: 'IDF demand (coupling or damper) moving together with the PA / SA fan demands, before the furnace pressure changes.',
    bad: 'Without a correct feed forward the IDF follows the fans late: on a fan change the furnace pressure goes positive (puffing) or too negative.',
    rise: 'the fans push more air: the IDF is opened ahead of the furnace pressure',
    fall: 'the fans push less air: the IDF is closed ahead'
  });
  put(['S1-LN34'], {
    hmi: 'Bottom ash screw cooler speed (SICL1060A ~ D) on the bottom ash graphic.',
    bad: 'A bias left on one cooler drains that side faster: bed height and bed pressure differ between sides.',
    rise: 'that screw cooler runs faster: more bed drained',
    fall: 'that screw cooler runs slower: bed builds up'
  });

  /* ---------- STN101: flow / level compensation ---------- */
  put(['S1-LN30'], {
    hmi: 'Feedwater flow (FICFW1007 PV) and the drum level control on the feedwater graphic.',
    bad: 'If the feedwater temperature fails, the compensated feedwater flow is wrong: the three-element level control sees a false steam / water mismatch and the drum level drifts.',
    rise: 'the water is taken as denser: the feedwater flow reads higher',
    fall: 'the water is taken as lighter: the feedwater flow reads lower'
  });
  put(['S1-LN31', 'S1-LN32'], {
    hmi: 'Main steam flow on the boiler master and drum level graphics; the low-flow signals (< 10 % / < 15 % MCR, > 220 T/H) switch on it.',
    bad: 'If the pressure or temperature transmitter fails, the main steam flow is wrong: drum level control (steam minus water) drifts, the boiler master gets a false steam flow, and the < 220 T/H or low-flow interlocks can switch at the wrong load.',
    rise: 'the steam is taken as denser: the main steam flow reads higher',
    fall: 'the steam is taken as lighter: the main steam flow reads lower'
  });
  put(['S1-LN38', 'S1-LN39'], {
    hmi: 'Drum level (LIBR1001 1 / 2 / 3) on the drum graphic and the LICBR1001 PV; the LL / HH trips use the same level.',
    bad: 'If the drum pressure fails, every compensated level is wrong together: the level looks normal while the real level is low or high, and the LL / HH trips act at the wrong real level. Compare with the local gauge glass.',
    rise: 'the compensation changes: the indicated drum level shifts (see the curve for the direction)',
    fall: 'the compensation changes the other way: the indicated drum level shifts back'
  });
  put(['S1-LN42', 'S1-LN43'], {
    hmi: 'R-SV of the SH spray control (TICBR1130 / TICBR1150): saturation + 15 °C is the lowest temperature the spray may cool to.',
    bad: 'If the pressure fails low the minimum is too low: the spray can cool the steam to saturation and water reaches the superheater. Fails high: the spray is held back, steam temperature high.',
    rise: 'the saturation temperature is higher: the spray must stop at a higher temperature',
    fall: 'the saturation temperature is lower: the spray may cool further'
  });
  put(['S1-LN46', 'S1-LN48'], {
    hmi: 'Small spray valve (2) position on the SH spray graphic: it does the first 22 % of the controller MV.',
    bad: 'If valve (2) sticks, the controller has to reach 22 % before valve (1) helps: steam temperature overshoots on a load up.',
    rise: 'spray valve (2) opens: more spray water, steam temperature falls',
    fall: 'spray valve (2) closes: less spray, steam temperature rises'
  });
  put(['S1-LN47', 'S1-LN49'], {
    hmi: 'Large spray valve (1) position on the SH spray graphic: it opens only above 22 % MV.',
    bad: 'If valve (1) leaks while it should be closed, the steam temperature stays low even with the controller MV small.',
    rise: 'spray valve (1) opens: much more spray water, steam temperature falls fast',
    fall: 'spray valve (1) closes'
  });
  put(['S1-LN18'], {
    hmi: 'Main steam blow-off valve position on the main steam graphic during start-up or a pressure upset.',
    bad: 'Too high: steam is wasted, MSP falls. Too low: MSP rises on a turbine trip before the bypass takes the steam.',
    rise: 'the blow-off valve opens more: steam to atmosphere, MSP falls',
    fall: 'the blow-off valve closes: MSP held'
  });

  /* ---------- STN101: load and CCS ---------- */
  put(['S1-LN54'], {
    hmi: 'Boiler master demand and PIC-COBM SV on the boiler master faceplate; coal and air demands move with the unit load demand.',
    bad: 'Too low: at a given MW demand the boiler is underfired and the pressure controller has to add the rest (MSP lags on load up). Too high: overfired, MSP high, turbine throttles.',
    rise: 'more fuel is asked for this load: the coal master and the air demand rise',
    fall: 'less fuel is asked for this load: coal and air demand fall'
  });
  put(['S1-LN55'], {
    hmi: 'Turbine master SV (EIC-TM) on the CCS faceplate: it moves by ±2 MW only when MSP is more than 3.5 kg/cm2 from its SV.',
    bad: 'Without it the turbine keeps taking steam while MSP collapses (or holds back while MSP climbs); with the band too narrow the MW hunts with the pressure.',
    rise: 'the turbine is allowed to take more MW (pressure is high)',
    fall: 'the turbine takes less MW to help the pressure recover'
  });
  put(['S1-LN58', 'S1-LN59', 'S1-LN60', 'S1-LN61', 'S1-LN62'], {
    hmi: 'BIR fuel demand added to the boiler master during a load change: coal flow leads the MW demand for a while, then settles.',
    bad: 'Too much BIR: MSP overshoots after every load step. Too little: MSP sags on load up and MW lags the demand.',
    rise: 'more extra fuel during the load change: faster pressure response, risk of overshoot',
    fall: 'less extra fuel: slower response, smaller overshoot'
  });

  /* ---------- STN102: reheater, bypass, aux steam, heaters ---------- */
  put(['S2-LN2'], {
    hmi: 'RH spray control TICHR1002: it is allowed in AUTO only when the desuperheater outlet is more than 11 °C above saturation.',
    bad: 'If the cold reheat pressure fails high, the spray is forced to MANUAL with steam well above saturation; fails low, it may spray down to saturation (wet steam to the reheater).',
    rise: 'the saturation limit is higher: the spray is forced to MANUAL sooner',
    fall: 'the saturation limit is lower: the spray may stay in AUTO at a lower temperature'
  });
  put(['S2-LN9'], {
    hmi: 'TICHR1002 SV on the reheater graphic: the spray setpoint sits a few °C above the damper setpoint so that the damper works first.',
    bad: 'Bias too small: the spray works together with the damper and wastes efficiency. Too large: RH temperature can overshoot before the spray acts.',
    rise: 'the spray SV moves up: the spray waits longer before it acts',
    fall: 'the spray SV moves down: the spray acts sooner'
  });
  put(['S2-LN3'], {
    hmi: 'RH / SH flue gas bias damper positions (HICHR1002A / B) on the back-pass graphic, moving with the load.',
    bad: 'A wrong feed forward leaves the damper controller to do all the work: RH temperature lags on load changes and the spray is used more.',
    rise: 'the RH damper opens more (SH damper closes): more gas over the reheater, RH temperature rises',
    fall: 'the RH damper closes (SH damper opens): RH temperature falls, SH side gets more gas'
  });
  put(['S2-LN5'], {
    hmi: 'S/H flue gas bias damper (HICHR1002B) on the back-pass graphic: it moves opposite to the R/H damper.',
    bad: 'If the two dampers close together, the back-pass gas path is choked: furnace pressure rises and the IDF opens.',
    rise: 'the S/H damper opens: more gas over the superheater side',
    fall: 'the S/H damper closes: gas pushed to the reheater side'
  });
  put(['S2-LN6'], {
    hmi: 'TICHR1002A SV (RH outlet temperature) on the reheater graphic: lower at low load, 538 °C from about 112 MW.',
    bad: 'Too high at low load: RH metal temperature high during start-up. Too low: lower efficiency, wetter LP exhaust.',
    rise: 'the RH temperature SV rises: the damper opens toward the RH side',
    fall: 'the RH temperature SV falls: the damper closes'
  });
  put(['S2-LN7'], {
    hmi: 'R/H damper AUTO-MV: the TICHR1002A correction added to the load feed forward.',
    bad: 'If the correction range is too small the damper cannot correct a fouled reheater; too large and the RH temperature hunts.',
    rise: 'the correction adds opening: RH damper opens',
    fall: 'the correction takes opening away: RH damper closes'
  });
  put(['S2-LN8'], {
    hmi: 'TICHR1002A MV while the damper is in MANUAL: it tracks the damper so that A gives no bump.',
    bad: 'Wrong tracking: the damper jumps when TICHR1002A goes back to AUTO, RH temperature swings.',
    rise: 'the controller tracks a higher MV',
    fall: 'the controller tracks a lower MV'
  });
  put(['S2-LN10'], {
    hmi: 'TICMS1022 SV (HP bypass spray) on the bypass graphic: saturation of the cold reheat pressure plus a margin.',
    bad: 'If the cold reheat pressure fails low the spray cools the bypass steam to saturation: water in the cold reheat line, hammering.',
    rise: 'the spray SV rises: less spray',
    fall: 'the spray SV falls: more spray'
  });
  put(['S2-LN13'], {
    hmi: 'HP bypass outlet temperature alarm / permissive (M.0717) on the bypass graphic.',
    bad: 'Wrong saturation temperature: the outlet-temperature check switches at the wrong temperature (false alarm or no warning of wet steam).',
    rise: 'the saturation temperature is higher: the check needs a higher outlet temperature',
    fall: 'the saturation temperature is lower'
  });
  put(['S2-LN33'], {
    hmi: 'HP bypass spray valve position, opening ahead with the HP bypass pressure valve.',
    bad: 'Too little spray for the steam: the cold reheat line overheats on a turbine trip. Too much: wet steam, hammering.',
    rise: 'the HP bypass spray valve opens more',
    fall: 'the HP bypass spray valve closes'
  });
  put(['S2-LN34'], {
    hmi: 'LP bypass spray valve (TICHR1012) position, opening with the LP bypass pressure valve.',
    bad: 'Too little spray: hot steam dumped to the condenser, condenser pressure and exhaust temperature rise. Too much: condensate wasted, wet steam.',
    rise: 'the LP bypass spray valve opens more',
    fall: 'the LP bypass spray valve closes'
  });
  put(['S2-LN11'], {
    hmi: 'How fast the LP bypass valve moves: slow when the hot reheat pressure is far from its SV.',
    bad: 'Too fast: the bypass opens with a jump, condenser and reheat pressure swing. Too slow: reheat pressure overshoots on a trip.',
    rise: 'a longer time constant: the LP bypass moves more slowly',
    fall: 'a shorter time constant: the LP bypass moves faster'
  });
  put(['S2-LN12'], {
    hmi: 'PICHR1003 SV (LP bypass pressure) on the bypass graphic: it follows the HP turbine first stage pressure (load).',
    bad: 'If the first stage pressure fails low the LP bypass SV collapses: the LP bypass opens and dumps reheat steam to the condenser while the turbine is on load.',
    rise: 'the LP bypass pressure SV rises: the LP bypass closes',
    fall: 'the LP bypass pressure SV falls: the LP bypass opens'
  });
  put(['S2-LN31'], {
    hmi: 'HP bypass valve (PICMS1006) position on a turbine trip, house load or 52G1 open: it opens at once to the steam flow of that moment.',
    bad: 'Too small: MSP rises after a trip, safety valves may lift. Too large: MSP and drum level drop, the boiler may trip on low pressure.',
    rise: 'the HP bypass opens more: more steam passed to the cold reheat',
    fall: 'the HP bypass opens less: MSP held higher'
  });
  put(['S2-LN32'], {
    hmi: 'LP bypass valve demand on a turbine trip: it opens to pass the reheat steam to the condenser.',
    bad: 'Too small: reheat pressure rises, RH safety valves may lift. Too large: condenser vacuum suffers.',
    rise: 'the LP bypass opens more',
    fall: 'the LP bypass opens less'
  });
  put(['S2-LN16'], {
    hmi: 'Small aux steam control valve (2) from the cold reheat (PICAS1005) on the aux steam graphic.',
    bad: 'If valve (2) sticks the aux steam pressure dips until the controller reaches 13 % and valve (1) opens.',
    rise: 'valve (2) opens: more cold reheat steam to aux steam, aux pressure rises',
    fall: 'valve (2) closes: aux pressure falls'
  });
  put(['S2-LN17'], {
    hmi: 'Large aux steam control valve (1) from the cold reheat, opening above 13 % MV.',
    bad: 'If valve (1) leaks, the aux steam pressure stays high with a small MV.',
    rise: 'valve (1) opens: much more steam to aux steam',
    fall: 'valve (1) closes'
  });
  put(['S2-LN18', 'S2-LN19'], {
    hmi: 'Gland steam desuperheater spray (TICAS1017) moving ahead when the seal feed or HP warming valve opens.',
    bad: 'A wrong Cv gives the spray too much or too little feed forward: gland steam temperature swings when these valves move.',
    rise: 'more steam flow is expected: more spray is fed forward',
    fall: 'less steam flow expected: less spray'
  });
  put(['S2-LN20'], {
    hmi: 'Gland steam spray feed forward: none while the aux steam header is cold (below 250 °C).',
    bad: 'If the aux steam temperature fails high, spray is fed forward to cold steam: water in the gland supply.',
    rise: 'the spray feed forward is let through',
    fall: 'the spray feed forward is cut'
  });
  put(['S2-LN21'], {
    hmi: 'Gland steam spray valve position (TICAS1017 OMV).',
    bad: 'Wrong curve: gland steam temperature too high (seal damage) or too low (water to the glands).',
    rise: 'the gland spray valve opens more',
    fall: 'the gland spray valve closes'
  });
  put(['S2-LN22'], {
    hmi: 'Lube oil temperature SV (TICLO1002) on the lube oil graphic: lower at turning gear, higher at 3600 rpm.',
    bad: 'If the speed signal fails low at full speed the oil is kept too cold: higher bearing friction; fails high at turning gear: oil too warm.',
    rise: 'the lube oil temperature SV rises: less cooling water',
    fall: 'the lube oil temperature SV falls: more cooling water'
  });
  put(['S2-LN38'], {
    hmi: 'Normal drain valve of the heater on the feedwater heater graphic: it does all the work below 60 % MV.',
    bad: 'If the normal drain valve sticks the heater level rises until the alternate drain opens (55 %): drain dumped to the condenser, lower feedwater temperature.',
    rise: 'the normal drain valve opens: heater level falls',
    fall: 'the normal drain valve closes: heater level rises'
  });
  put(['S2-LN39'], {
    hmi: 'Alternate (emergency) drain valve of the heater, opening only above 55 % MV.',
    bad: 'Alternate drain open in normal operation means the normal drain cannot pass the flow: check the normal valve and the next heater.',
    rise: 'the alternate drain opens: heater drain to the condenser',
    fall: 'the alternate drain closes'
  });

  /* ---------- STN103: furnace secondary air dampers ---------- */
  const sa = (w, k) => ({
    hmi: 'Secondary air damper ' + k + ' (' + w + ' level) on the furnace air graphic, opening with the generator MW.',
    bad: 'Wrong curve: the ' + w + ' air at that load is off design: bed / freeboard temperature profile changes, CO or NOx up, steam temperature shifts.',
    rise: 'damper ' + k + ' opens: more secondary air at the ' + w + ' level',
    fall: 'damper ' + k + ' closes: less secondary air at the ' + w + ' level'
  });
  for (let n = 1; n <= 22; n++) put(['S3-LN' + n], sa(n % 2 ? 'upper' : 'lower', 'MCV-FA' + (1004 + n)));
  put(['S3-LN23', 'S3-LN24'], {
    hmi: 'Front and rear wall secondary air dampers: one wall opens and the other closes by the same bias.',
    bad: 'A bias left away from 50 % makes one wall air rich: uneven bed temperature front to rear.',
    rise: 'one wall gets more air, the other less',
    fall: 'the bias swings to the other wall'
  });

  for (const k in O) if (T[k]) Object.assign(T[k], O[k]);
})();
