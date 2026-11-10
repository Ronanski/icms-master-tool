# TCS IBD: the inputs with no source in the app (plan c2 register)

3.2.3-beta.55 (SAKURA, 2026-11-11 PHT). Source: `src/analog/engine/tcs-ibd-data.js` (the 99 IBD pages of the TCS, read by the reader) and the
binding of `tcsIbdBind()` (`src/analog/engine/tcs-trip.js`). An input has a source when a gate of its own sheet drives it, an off-page link
from another sheet gives it, a plant model value is bound to it (`TCS_IBD_PV` by name, `TCS_IBD_NET` by net), or it is the BOILER MFT.

Count: 797 inputs, 374 with no source (was 383). Every one of the 374 is in one of the three kinds of CLAUDE.md rule 5:
(a) bug, fixed; (b) correct, with the reason; (c) the drawing or the reader cannot give it, with the exact part named.

## Fixed in this version (a)

- TA-41 net 28 MSV(B) FULL OPEN, TA-42 net 21 MSV(B) FULL OPEN, TA-42 net 26 MSV(A) FULL OPEN: the name rule `MSV([AB]) FULL OPEN` had
  unescaped parentheses and matched no input. Now `MSV\([AB]\) FULL OPEN` = the stop valve position of the model at 100 %. The other
  MSV FULL OPEN inputs (linked from TA-31 / TA-32) now read the same model value, as the FULL CLOSE ones already did.
- TA-42 net 27 (name garbled by the reader) = GENERATOR LOAD, off-page link 10 from TA-41 net 23 (GENERATOR LOAD >= 75 MW).
- TA-10 net 11: the CONDENSER VACUUM LOW ALARM comparator (>= 0.14 kg/cm2 abs, page 30) had the label as input; now the condenser pressure
  of the model (the MID of PT-STn110-1 / 2 / 3, all three = U.cdP). Goes to TC-20 link 6.
- TC-35 net 7 GEN. LOAD <15%: model load < 22.5 MW (15 % of 150 MW).
- TC-20 net 43 AUX. STEAM HEADER PRESS. (LOWER): the aux steam header of the ATS model (c.Pa, PIAS1004).
- TC-17 net 5 HP TURBINE HEAT SOAK EXECUTE: ATS phase soak1800 / soak3600 (ASSUMED, no other source on the IBD).
- TC-18 net 0 INTERCEPT VALVE OPEN DEMAND >0.1%: ICV position of the model > 0.1 % (ASSUMED, the model has no separate demand).

## Open findings for a next PR

- TA-11 net 3 MAIN STEAM TEMP. LOW TRIP (290 C): see the row below. Binding it changes a trip path; it needs a full Cold > 150 MW run.
- TA-21 HP INLET / EXHAUST DIFF. PRESS. VERY HIGH TRIP: the differential blocks and set points are not read.
- TC-7 net 27 CV CHEST WARMING COMPLETE and TE-1 net 0 HP TURBINE WARMING START COMMAND FROM ATS: the ATS model has these phases; to be
  tied to the IBD group control in the next batch.

## OTH (39)

Other inputs, one by one.

- TA-1 (page 24) net 1: TURBINE AUTO RESET COMMAND = (b) the ATS AUTO RESET is driven in code (tcsIbdStep, c.rst), not by net binding
- TA-12 (page 32) net 8: ZE-STn003-3 TURBINE ROTOR POSITION = (c) model gap: the model has no thrust position; 0 mm is inside the trip band (+0.8 / -1.18 mm, page 32)
- TA-12 (page 32) net 9: ZE-STn003-2 TURBINE ROTOR POSITION = (c) same as net 8
- TA-12 (page 32) net 10: ZE-STn003-1 TURBINE ROTOR POSITION = (c) same as net 8
- TA-12 (page 32) net 18: ZE-STn003-3 TURBINE ROTOR POSITION (C) - = (c) same as net 8
- TA-33 (page 45) net 11: POWER LOAD UNBALANCE RELAY OPERATED = (b) relay contact of the governor (POWER LOAD UNBALANCE); 0 = not operated, the model has no load rejection relay
- TA-33 (page 45) net 12: ACCELERATION RELAY OPERATED = (b) ACCELERATION RELAY; 0 = not operated (same as net 11)
- TC-5 (page 66) net 15: ZT-STn008 CV(B) BELOW SEAT SECONDARY = (c) ZT-STn008 drain valve position: the label is cut by the reader (page 66)
- TC-7 (page 67) net 27: CV CHEST WARMING COMPLETE = (c) CV CHEST WARMING COMPLETE: the ATS model has phase chest -> reset (tcs.js), the sheet source is not read; next batch
- TC-12 (page 69) net 11: ICV TO CV TRANSFER START = (c) the reader lists net 11 as an off-page OUTPUT to TC-13 (link 3); the input side is not read
- TC-17 (page 71) net 6: TURBINE FLOW DEMAND = (c) TURBINE FLOW DEMAND enters an OR as a contact with no set point on the sheet (page 71)
- TC-19 (page 73) net 3: DE-ENERGIZE = (c) output label (solenoid) read as input
- TC-19 (page 73) net 5: SOLENOID VALVE ENERGIZE = (c) output label (solenoid) read as input
- TC-20 (page 74) net 0: ZT-ASn011 HP TURBINE WARMING VALVE = (c) model gap: ZT-ASn011 warming valve position; the model has no warming valve position
- TC-36 (page 78) net 12: TE-STn008 LP TURBINE EXTRACTION = (c) model gap: TE-STn008 LP extraction temperature, not in the model
- TC-36 (page 78) net 18: ZSC-GSn032 SSFV BYPASS VALVE = (c) ZSC-GSn032 SSFV bypass valve closed: not in the model
- TC-41 (page 79) net 0: DE-ENERGIZE = (c) output label (DE-ENERGIZE) read as input
- TC-41 (page 79) net 1: SV-TSn700 SV = (c) SV-TSn7x0 solenoid name, output side read as input
- TC-42 (page 80) net 0: DE-ENERGIZE = (c) output label (DE-ENERGIZE) read as input
- TC-42 (page 80) net 1: SV-TSn710 SV = (c) SV-TSn7x0 solenoid name, output side read as input
- TC-43 (page 81) net 0: DE-ENERGIZE = (c) output label (DE-ENERGIZE) read as input
- TC-43 (page 81) net 1: SV-TSn740 SV = (c) SV-TSn7x0 solenoid name, output side read as input
- TC-44 (page 82) net 0: DE-ENERGIZE = (c) output label (DE-ENERGIZE) read as input
- TC-44 (page 82) net 1: SV-TSn720 SV = (c) SV-TSn7x0 solenoid name, output side read as input
- TC-45 (page 83) net 0: TCS DE-ENERGIZE = (c) output label (DE-ENERGIZE) read as input
- TC-45 (page 83) net 1: SV-TSn730 SV = (c) SV-TSn7x0 solenoid name, output side read as input
- TD-3 (page 86) net 0: PRESS (A) SEL PT-GSn001-2 GLAND STEAM SEAL HEADER = (c) model gap: the model has gland seal in / out (c.gland), not the header pressure PT-GSn001-2
- TD-3 (page 86) net 2: LSL-LOn920-1 MAIN OIL TANK LEVEL LOW = (b) main oil tank level LOW: 0 = normal; the model has no tank level
- TD-3 (page 86) net 3: LSH-LOn920-2 MAIN OIL TANK LEVEL HIGH = (b) main oil tank level HIGH: 0 = normal
- TD-4 (page 87) net 0: ZE-STn004 LOW SPEED ECCENTRICITY = (c) model gap: ZE-STn004 eccentricity not modelled; 0 = normal
- TD-4 (page 87) net 7: ZE-STn002-1,2 LP TURBINE DIFF. EXPANSION = (c) model gap: ZE-STn002 LP diff. expansion not modelled; 0 = normal
- TE-1 (page 90) net 0: HP TURBINE WARMING START COMMAND FROM ATS = (c) HP TURBINE WARMING START COMMAND FROM ATS: the ATS model warms by itself (phase warm); the IBD group control is not driven by it yet
- TE-6 (page 94) net 22: TURBINE GLAND SEAL GROUP START COMMAND = (b) GLAND SEAL GROUP START COMMAND: the operator gland button of the app (tcs.js gland) does the same work; 0 here
- TE-6 (page 94) net 30: STEAM SEAL AUXILIARY FEED VALVE IN AUTO = (b) feed valve IN AUTO: 0 = not used by the model
- TE-6 (page 94) net 31: STEAM PACKING UNLOADING VALVE IN AUTO = (b) unloading valve IN AUTO: 0 = not used by the model
- TE-6 (page 94) net 36: GLAND STEAM DRAIN SEPARATOR = (c) GLAND STEAM DRAIN SEPARATOR: label cut by the reader
- TE-6 (page 94) net 42: - DCS = (c) "- DCS": label cut by the reader
- TE-7 (page 95) net 22: TURBINE GLAND SEAL GROUP STOP COMMAND = (b) GLAND SEAL GROUP STOP COMMAND: as TE-6 net 22
- GD-5 (page 99) net 22: TEMP. LSH-GEn001 GEN. WATER & OIL LEAKAGE = (b) LSH-GEn001 generator water & oil leakage: 0 = no leak

## RDR (10)

Garbled or empty names, or off-page links the reader did not resolve. (c) the exact part is named in each row.

- TA-11 (page 31) net 3: LOW 21? ???r& = (c) FINDING, not fixed here: the reader took the label "LOW TRIP 290 C" as the input of the CMP at (541, 703) of page 31; on the drawing that comparator reads the median of TE-MSn902-1 / 2 / 3 (MID, net 29). Bound, it arms the MAIN STEAM TEMP. LOW TRIP before 20 % load (A gate net 0) and can trip a cold start at reset: it needs a full Cold > 150 MW run first, own PR
- TA-12 (page 32) net 12: HIGH 21? +0.6mm = (c) the label "HIGH ALARM +0.6 mm" read as the input of the CMP at (647, 339) page 32; on the drawing it reads the MID net 11. The model has no thrust position (0 mm), so no change
- TA-21 (page 39) net 11: + ? - = (c) the four "+ / -" inputs of page 39 are the differential (first stage minus exhaust) blocks the reader did not read; the CMP set points are not read either (null). HP INLET / EXHAUST DIFF. PRESS. VERY HIGH TRIP has no live path in the app
- TA-21 (page 39) net 12: + ? - = (c) as net 11
- TA-21 (page 39) net 17: + ? - = (c) as net 11
- TA-21 (page 39) net 22: + ? - = (c) as net 11
- TE-6 (page 94) net 8: > 2))?????r& (PERMISSIVE) TCS = (c) garbled name; the net is the gland steam exhauster permissive, off-page OUTPUT 2 to TC-28 (the reader lists it as an input)
- TE-6 (page 94) net 44: TURBINE GLAND SEAL START GC RELATED AUX IN AUTO [link not resolved] = (c) off-page link 1 from TE-8 not resolved (TE-8 has no matching outgoing link 1)
- TE-7 (page 95) net 24: (no name) = (c) empty name, input of the A gate (465, 377) page 95
- TE-7 (page 95) net 27: TURBINE GLAND SEAL STOP GC RELATED AUX IN AUTO [link not resolved] = (c) off-page link 2 from TE-8 not resolved

## OK0 (21)

Fault and trouble contacts (electrical trouble, overload, cut-off, TSI trouble, metal temp. ABNORMAL, MAJOR / MINOR TROUBLE, protection relays, master trip handle, hand turning). (b) correct: 0 = healthy, the normal plant state. A fault is put in with the Instructor force.

- TA-6 (page 27) net 14: TCS MAJOR TROUBLE
- TA-7 (page 28) net 6: MASTER TRIP HANDLE OPERATED
- TB-1 (page 54) net 18: MAIN OIL PUMP (A) MOTOR ELECTRICAL TROUBLE
- TB-2 (page 55) net 18: MAIN OIL PUMP (B) MOTOR ELECTRICAL TROUBLE
- TB-5 (page 56) net 16: DC EMERGENCY OIL PUMP STARTER CUT-OFF AT BREAKER
- TB-5 (page 56) net 17: DC EMERGENCY OIL PUMP MOTOR OVERLOAD
- TB-5 (page 56) net 18: EMERGENCY OIL PUMP MOTOR ELECTRICAL TROUBLE
- TB-9 (page 58) net 24: TURNING GEAR MOTOR ELECTRICAL TROUBLE
- TB-9 (page 58) net 53: ZS-LOn003 HAND TURNING INTERLOCK
- TB-12 (page 60) net 10: MAIN OIL TANK VAPOUR EXTRACTOR MOTOR ELECTRICAL TROUBLE
- TB-15 (page 61) net 3: OIL PURIFIER PUMP MOTOR ELECTRICAL TROUBLE
- TB-21 (page 62) net 13: CONTROL OIL PUMP (A) MOTOR ELECTRICAL TROUBLE
- TB-22 (page 63) net 19: CONTROL OIL PUMP (B) MOTOR ELECTRICAL TROUBLE
- TC-28 (page 75) net 15: GLAND STEAM EXHAUSTER MOTOR ELECTRICAL TROUBLE
- TD-1 (page 84) net 16: TCS MINOR TROUBLE
- TD-4 (page 87) net 11: TURBINE SUPERVISORY INSTRUMENT TROUBLE
- TE-8 (page 96) net 10: REHEAT BOWL INNER WALL METAL TEMP.(A) (TE-STn004-1) ABNORMAL
- TE-8 (page 96) net 11: REHEAT BOWL INNER WALL METAL TEMP.(B) (TE-STn004-2) ABNORMAL
- TE-8 (page 96) net 12: HP TURBINE FIRST STAGE INNER WALL METAL TEMP.(TE-STn001-1) ABNORMAL
- GD-1 (page 97) net 4: SPACE HEATER FOR GEN. ELECTRICAL TROUBLE
- GD-2 (page 98) net 4: SPACE HEATER FOR AC EXCITER ELECTRICAL TROUBLE

## PB (117)

Operator push buttons and selectors of the TCS HMI. (b) correct: 0 = not pressed. The pressed ones the app uses are driven in code (TA-1 reset / trip / auto reset, TA-9 shut-down).

- TA-1 (page 24) net 0: PB TURBINE RESET
- TA-1 (page 24) net 9: (TCS HMI) TURBINE TRIP PB
- TA-1 (page 24) net 10: (CENTRAL CONTROL ROOM) PB TURBINE TRIP
- TA-2 (page 25) net 1: MASTER TRIP PB
- TA-2 (page 25) net 4: MASTER TRIP PB
- TA-3 (page 26) net 1: MASTER TRIP PB
- TA-3 (page 26) net 4: MASTER TRIP PB
- TA-31 (page 43) net 22: MSV(A) PARTIAL PB
- TA-31 (page 43) net 23: MSV(A) PARTIAL PB
- TA-32 (page 44) net 23: MSV(B) PARTIAL PB
- TA-32 (page 44) net 25: MSV(B) PARTIAL PB
- TA-33 (page 45) net 27: CV(A) PARTIAL PB
- TA-33 (page 45) net 29: CV(A) PARTIAL PB
- TA-34 (page 46) net 24: CV(B) PARTIAL PB
- TA-34 (page 46) net 25: CV(B) PARTIAL PB
- TA-37 (page 48) net 1: CRV (A) TEST PB
- TA-38 (page 49) net 1: CRV (B) TEST PB
- TA-41 (page 51) net 18: MSV/CV(A) SEQUENTIAL PB
- TA-41 (page 51) net 26: MSV/CV(A) SEQUENTIAL PB
- TA-42 (page 52) net 18: MSV/CV(B) SEQUENTIAL PB
- TA-42 (page 52) net 24: MSV/CV(B) SEQUENTIAL PB
- TB-1 (page 54) net 4: MAIN OIL PUMP (A) PB MANUAL
- TB-1 (page 54) net 3: MAIN OIL PUMP (A) PB
- TB-1 (page 54) net 6: MAIN OIL PUMP (A) PB
- TB-1 (page 54) net 8: MAIN OIL PUMP (A) PB
- TB-2 (page 55) net 4: MAIN OIL PUMP (B) PB MANUAL
- TB-2 (page 55) net 3: MAIN OIL PUMP (B) PB
- TB-2 (page 55) net 6: MAIN OIL PUMP (B) PB
- TB-2 (page 55) net 8: MAIN OIL PUMP (B) PB
- TB-5 (page 56) net 9: DC EMERGENCY OIL PB
- TB-5 (page 56) net 13: DC EMERGENCY OIL PB
- TB-9 (page 58) net 9: (LOCAL) PB TURNING GEAR MOTOR
- TB-9 (page 58) net 18: PB TURNING GEAR MOTOR MANUAL
- TB-9 (page 58) net 16: TURNING GEAR MOTOR PB
- TB-9 (page 58) net 20: PB TURNING GEAR MOTOR
- TB-9 (page 58) net 22: PB TURNING GEAR MOTOR
- TB-10 (page 59) net 9: (LOCAL) PB TURNING GEAR ENGAGE
- TB-12 (page 60) net 7: MAIN OIL TANK PB
- TB-12 (page 60) net 11: MAIN OIL TANK PB
- TB-15 (page 61) net 0: PB OIL PURIFIER PUMP
- TB-15 (page 61) net 4: OIL PURIFIER PUMP PB
- TB-21 (page 62) net 4: CONTROL OIL PUMP (A) MANUAL PB
- TB-21 (page 62) net 3: CONTROL OIL PUMP (A) PB
- TB-21 (page 62) net 6: CONTROL OIL PUMP (A) PB
- TB-21 (page 62) net 8: CONTROL OIL PUMP (A) PB
- TB-22 (page 63) net 4: CONTROL OIL PUMP (B) MANUAL PB
- TB-22 (page 63) net 3: CONTROL OIL PUMP (B) PB
- TB-22 (page 63) net 6: CONTROL OIL PUMP (B) PB
- TB-22 (page 63) net 8: CONTROL OIL PUMP (B) PB
- TC-1 (page 64) net 2: MSV(A) ABOVE SEAT PB MANUAL
- TC-1 (page 64) net 0: MSV(A) ABOVE SEAT PB
- TC-1 (page 64) net 4: MSV(A) ABOVE SEAT PB
- TC-1 (page 64) net 6: MSV(A) ABOVE SEAT PB
- TC-2 (page 65) net 2: MSV(B) ABOVE SEAT PB MANUAL
- TC-2 (page 65) net 0: MSV(B) ABOVE SEAT PB
- TC-2 (page 65) net 4: MSV(B) ABOVE SEAT PB
- TC-2 (page 65) net 6: MSV(B) ABOVE SEAT PB
- TC-5 (page 66) net 4: CV(B) BELOW SEAT SECONDARY PB MANUAL
- TC-5 (page 66) net 3: CV(B) BELOW SEAT SECONDARY PB
- TC-5 (page 66) net 6: CV(B) BELOW SEAT SECONDARY PB
- TC-5 (page 66) net 8: CV(B) BELOW SEAT SECONDARY PB
- TC-7 (page 67) net 6: CV(A) ABOVE SEAT PB MANUAL
- TC-7 (page 67) net 5: CV(A) ABOVE SEAT PB
- TC-7 (page 67) net 8: CV(A) ABOVE SEAT PB
- TC-7 (page 67) net 9: CV(A) ABOVE SEAT PB
- TC-7 (page 67) net 26: CV CHEST WARMING MODE SET
- TC-8 (page 68) net 6: CV(B) ABOVE SEAT PB MANUAL
- TC-8 (page 68) net 5: CV(B) ABOVE SEAT PB
- TC-8 (page 68) net 8: CV(B) ABOVE SEAT PB
- TC-8 (page 68) net 9: CV(B) ABOVE SEAT PB
- TC-8 (page 68) net 16: CV CHEST WARMING MODE SET
- TC-12 (page 69) net 6: CRV(A) BELOW SEAT PB MANUAL
- TC-12 (page 69) net 5: CRV(A) BELOW SEAT PB
- TC-12 (page 69) net 8: CRV(A) BELOW SEAT PB
- TC-12 (page 69) net 9: CRV(A) BELOW SEAT PB
- TC-13 (page 70) net 6: CRV(B) BELOW SEAT PB MANUAL
- TC-13 (page 70) net 5: CRV(B) BELOW SEAT PB
- TC-13 (page 70) net 8: CRV(B) BELOW SEAT PB
- TC-13 (page 70) net 9: CRV(B) BELOW SEAT PB
- TC-19 (page 73) net 30: RETURN VALVE TEST COLD REHEAT NON PB
- TC-19 (page 73) net 32: COLD REHEAT NON PB
- TC-20 (page 74) net 19: HP TURBINE WARMING PB
- TC-20 (page 74) net 22: HP TURBINE WARMING PB MANUAL
- TC-20 (page 74) net 21: HP TURBINE WARMING PB
- TC-20 (page 74) net 23: STOP GROUP CONTROL HP TURBINE WARMING PB
- TC-20 (page 74) net 37: HP TURBINE WARMING PROGRAM PB
- TC-28 (page 75) net 5: GLAND STEAM PB MANUAL
- TC-28 (page 75) net 3: GLAND STEAM PB
- TC-28 (page 75) net 7: GLAND STEAM PB
- TC-28 (page 75) net 9: GLAND STEAM PB
- TC-31 (page 76) net 2: STEAM SEAL FEED PB MANUAL
- TC-31 (page 76) net 0: STEAM SEAL FEED PB
- TC-31 (page 76) net 4: STEAM SEAL FEED PB
- TC-31 (page 76) net 6: STEAM SEAL FEED PB
- TC-35 (page 77) net 0: LP EXHAUST HOOD PB
- TC-35 (page 77) net 9: LP EXHAUST HOOD PB MANUAL
- TC-35 (page 77) net 10: LP EXHAUST HOOD PB
- TC-36 (page 78) net 6: STEAM SEAL DIVERTING CONDENSER PB
- TC-36 (page 78) net 5: STEAM SEAL DIVERTING PB
- TC-41 (page 79) net 7: NON RETURN VALVE TEST NO.2 EXTRACTION STEAM NON PB
- TC-41 (page 79) net 9: NO.2 EXTRACTION STEAM PB
- TC-42 (page 80) net 7: VALVE TEST NO.3 EXTRACTION STEAM PRIMARY NON RETURN PB
- TC-42 (page 80) net 9: NO.3 EXTRACTION STEAM PRIMARY NON RETURN PB
- TC-43 (page 81) net 7: VALVE TEST NO.3 EXTRACTION STEAM SECONDARY NON RETURN PB
- TC-43 (page 81) net 9: NO.3 EXTRACTION STEAM SECONDARY NON RETURN PB
- TC-44 (page 82) net 7: NON RETURN VALVE TEST NO.4 EXTRACTION STEAM NON PB
- TC-44 (page 82) net 9: NO.4 EXTRACTION STEAM PB
- TC-45 (page 83) net 7: NON RETURN VALVE TEST NO.5 EXTRACTION STEAM NON PB
- TC-45 (page 83) net 9: NO.5 EXTRACTION STEAM PB
- TE-1 (page 90) net 1: COMMAND FROM ATS PB HP TURBINE WARMING
- TE-1 (page 90) net 49: PB HP TURBINE WARMING
- TE-1 (page 90) net 58: PB HP TURBINE WARMING
- TE-2 (page 91) net 1: PB HP TURBINE WARMING
- TE-6 (page 94) net 0: TURBINE GLAND SEAL PB
- TE-6 (page 94) net 23: PB TURBINE GLAND SEAL
- TE-7 (page 95) net 9: PB TURBINE GLAND SEAL
- TE-7 (page 95) net 23: PB TURBINE GLAND SEAL

## OUT (73)

Sheet OUTPUT labels on the right edge (x >= 700: SOLENOID ENERGIZE, OPEN / CLOSE answer, DCS outputs) that the reader also lists as inputs. (c) reader artifact: the part is the output label at the right edge of the page.

- TA-9 (page 29) net 17: GEN./UNIT TRANS. PROTECTION A & GEN. LOCKOUT RELAY A [link not resolved]
- TA-9 (page 29) net 18: TURBINE SHUTDOWN COMMAND
- TA-9 (page 29) net 19: GEN./UNIT TRANS. PROTECTION B & GEN. LOCKOUT RELAY B [link not resolved]
- TA-9 (page 29) net 20: TCS MAJOR TROUBLE
- TA-31 (page 43) net 11: *1 *2 MSV(A) TCS SERVO VALVE *3
- TA-31 (page 43) net 12: SOLENOID VALVE ENERGIZE
- TA-32 (page 44) net 7: *1 *2 MSV(B) TCS SERVO VALVE *3
- TA-32 (page 44) net 8: SOLENOID VALVE ENERGIZE
- TA-33 (page 45) net 8: *1 CLOSE TEST READY *2 CV(A) TCS SERVO VALVE *3
- TA-33 (page 45) net 9: SOLENOID VALVE 3s ENERGIZE
- TA-33 (page 45) net 31: (no name) [link not resolved]
- TA-34 (page 46) net 8: *1 CLOSE TEST READY *2 CV(B) TCS SERVO VALVE *3
- TA-34 (page 46) net 9: SOLENOID VALVE 3s ENERGIZE
- TA-34 (page 46) net 28: (no name) [link not resolved]
- TA-37 (page 48) net 15: 1s
- TA-37 (page 48) net 16: ACTING SOLENOID VALVE ENERGIZE
- TA-37 (page 48) net 31: ACTING SOLENOID VALVE ENERGIZE
- TA-37 (page 48) net 32: SOLENOID VALVE ENERGIZE
- TA-38 (page 49) net 15: 1s
- TA-38 (page 49) net 16: ACTING SOLENOID VALVE ENERGIZE
- TA-38 (page 49) net 31: ACTING SOLENOID VALVE ENERGIZE
- TA-38 (page 49) net 32: SOLENOID VALVE ENERGIZE
- TB-1 (page 54) net 21: START
- TB-2 (page 55) net 21: MAIN OIL PUMP (B) START
- TB-5 (page 56) net 21: DC EMERGENCY OIL PUMP TCS START
- TB-9 (page 58) net 55: TURNING GEAR MOTOR START
- TB-12 (page 60) net 13: VAPOUR EXTRACTOR START
- TB-15 (page 61) net 6: OIL PURIFIER PUMP START
- TB-21 (page 62) net 23: CONTROL OIL PUMP (A) START
- TB-22 (page 63) net 23: START
- TC-1 (page 64) net 23: SECONDARY DRAIN VALVE OPEN 3s
- TC-1 (page 64) net 25: 3s CLOSE
- TC-2 (page 65) net 17: SECONDARY DRAIN VALVE OPEN 3s
- TC-2 (page 65) net 19: 3s CLOSE
- TC-5 (page 66) net 20: DRAIN VALVE OPEN
- TC-5 (page 66) net 22: CLOSE
- TC-7 (page 67) net 30: SECONDARY DRAIN VALVE OPEN 3s
- TC-7 (page 67) net 32: 3s CLOSE
- TC-8 (page 68) net 22: SECONDARY DRAIN VALVE OPEN
- TC-8 (page 68) net 24: CLOSE
- TC-12 (page 69) net 16: SECONDARY DRAIN VALVE OPEN
- TC-12 (page 69) net 18: CLOSE
- TC-13 (page 70) net 16: SECONDARY DRAIN VALVE OPEN
- TC-13 (page 70) net 18: CLOSE
- TC-17 (page 71) net 25: SOLENOID VALVE VENTILATOR VALVE ENERGIZE OPEN
- TC-17 (page 71) net 27: DE-ENERGIZE CLOSE
- TC-18 (page 72) net 2: SOLENOID VALVE BLOWDOWN VALVE DE-ENERGIZE OPEN
- TC-18 (page 72) net 4: ENERGIZE CLOSE
- TC-19 (page 73) net 6: DE-ENERGIZE
- TC-19 (page 73) net 36: NON RETURN VALVE OPEN
- TC-19 (page 73) net 38: CLOSE
- TC-20 (page 74) net 10: ????NJ?FPtJ ????NJ?FPtJ HP TURBINE WARMING PERMISSIVE
- TC-20 (page 74) net 45: VALVE OPEN
- TC-20 (page 74) net 48: CLOSE
- TC-28 (page 75) net 17: GLAND STEAM EXHAUSTER START
- TC-31 (page 76) net 14: INLET VALVE OPEN
- TC-31 (page 76) net 16: CLOSE
- TC-35 (page 77) net 17: SOLENOID VALVE SPRAY VALVE ENERGIZE OPEN
- TC-35 (page 77) net 19: DE-ENERGIZE CLOSE
- TC-36 (page 78) net 14: VALVE SOLENOID VALVE VALVE ENERGIZE LP HEATER SIDE
- TC-36 (page 78) net 16: DE-ENERGIZE CONDENSER SIDE
- TC-41 (page 79) net 28: NON RETURN VALVE OPEN
- TC-41 (page 79) net 30: CLOSE
- TC-42 (page 80) net 28: NON RETURN VALVE OPEN
- TC-42 (page 80) net 30: CLOSE
- TC-43 (page 81) net 28: NON RETURN VALVE OPEN
- TC-43 (page 81) net 30: CLOSE
- TC-44 (page 82) net 28: NON RETURN VALVE OPEN
- TC-44 (page 82) net 30: CLOSE
- TC-45 (page 83) net 28: NON RETURN VALVE OPEN
- TC-45 (page 83) net 30: CLOSE
- GD-1 (page 97) net 6: GEN. START
- GD-2 (page 98) net 6: AC EXCITER START

## TYP (114)

Typical sheets 15 ~ 23 (templates with "(NAME OF EQUIPMENT)", no plant tag). (b) correct: a template is not plant equipment, nothing to bind.

- 15 (page 15) net 0: AUTO START CONDITION
- 15 (page 15) net 4: NAME OF EQUIPMENT PB MANUAL
- 15 (page 15) net 3: NAME OF EQUIPMENT PB
- 15 (page 15) net 6: NAME OF EQUIPMENT PB
- 15 (page 15) net 8: NAME OF EQUIPMENT PB
- 15 (page 15) net 14: (NAME OF EQUIPMENT) MOTOR ELECTRICAL TROUBLE
- 15 (page 15) net 15: STOP ABSOLUTE CONDITION
- 15 (page 15) net 16: AUTO STOP CONDITION
- 15 (page 15) net 18: START
- 16 (page 16) net 0: AUTO OPEN CONDITION
- 16 (page 16) net 4: NAME OF EQUIPMENT PB MANUAL
- 16 (page 16) net 3: NAME OF EQUIPMENT PB
- 16 (page 16) net 6: NAME OF EQUIPMENT PB
- 16 (page 16) net 8: NAME OF EQUIPMENT PB
- 16 (page 16) net 12: AUTO CLOSE CONDITION
- 16 (page 16) net 15: OPEN CLOSE
- 16 (page 16) net 20: (no name)
- 16 (page 16) net 22: (NAME OF EQUIPMENT) MOTOR ELECTRICAL TROUBLE
- 16 (page 16) net 23: (no name)
- 16 (page 16) net 31: *
- 16 (page 16) net 32: (no name)
- 16 (page 16) net 39: NAME OF EQUIPMENT PB
- 16 (page 16) net 44: t2
- 16 (page 16) net 45: TORQUE SWITCH OF FULL OPEN SIDE
- 16 (page 16) net 47: TORQUE SWITCH OF FULL CLOSE SIDE
- 16 (page 16) net 50: TORQUE SWITCH OF OPEN SIDE
- 16 (page 16) net 52: LIMIT SWITCH OF FULL OPEN SIDE
- 16 (page 16) net 55: TORQUE SWITCH OF CLOSE SIDE
- 16 (page 16) net 67: *
- 16 (page 16) net 70: LIMIT SWITCH OF FULL CLOSE SIDE
- 16 (page 16) net 71: LIMIT SWITCH OF FULL OPEN SIDE
- 16 (page 16) net 72: LIMIT SWITCH OF FULL CLOSE SIDE
- 17 (page 17) net 0: AUTO OPEN CONDITION
- 17 (page 17) net 4: NAME OF EQUIPMENT PB MANUAL
- 17 (page 17) net 3: NAME OF EQUIPMENT PB
- 17 (page 17) net 6: NAME OF EQUIPMENT PB
- 17 (page 17) net 8: NAME OF EQUIPMENT PB
- 17 (page 17) net 13: AUTO CLOSE CONDITION
- 17 (page 17) net 14: OPEN
- 17 (page 17) net 16: CLOSE
- 18 (page 18) net 0: AUTO OPEN CONDITION
- 18 (page 18) net 4: NAME OF EQUIPMENT PB MANUAL
- 18 (page 18) net 3: NAME OF EQUIPMENT PB
- 18 (page 18) net 6: NAME OF EQUIPMENT PB
- 18 (page 18) net 8: NAME OF EQUIPMENT PB
- 18 (page 18) net 12: AUTO CLOSE CONDITION
- 18 (page 18) net 15: OPEN CLOSE
- 18 (page 18) net 20: OPEN *
- 18 (page 18) net 22: (NAME OF EQUIPMENT) MOTOR ELECTRICAL TROUBLE
- 18 (page 18) net 23: (no name)
- 18 (page 18) net 31: *
- 18 (page 18) net 32: (no name)
- 18 (page 18) net 39: NAME OF EQUIPMENT PB
- 18 (page 18) net 45: TORQUE SWITCH OF FULL OPEN SIDE
- 18 (page 18) net 47: TORQUE SWITCH OF FULL CLOSE SIDE
- 18 (page 18) net 50: TORQUE SWITCH OF OPEN SIDE
- 18 (page 18) net 52: LIMIT SWITCH OF FULL OPEN SIDE
- 18 (page 18) net 55: TORQUE SWITCH OF CLOSE SIDE
- 18 (page 18) net 62: LIMIT SWITCH OF FULL CLOSE SIDE
- 18 (page 18) net 68: LIMIT SWITCH OF FULL CLOSE SIDE *
- 18 (page 18) net 69: LIMIT SWITCH OF FULL OPEN SIDE
- 19 (page 19) net 0: AUTO OPEN CONDITION
- 19 (page 19) net 4: NAME OF EQUIPMENT PB MANUAL
- 19 (page 19) net 3: NAME OF EQUIPMENT PB
- 19 (page 19) net 6: NAME OF EQUIPMENT PB
- 19 (page 19) net 8: NAME OF EQUIPMENT PB
- 19 (page 19) net 13: AUTO CLOSE CONDITION
- 19 (page 19) net 14: OPEN
- 19 (page 19) net 16: CLOSE
- 20 (page 20) net 0: AUTO OPEN CONDITION
- 20 (page 20) net 4: NAME OF EQUIPMENT PB MANUAL
- 20 (page 20) net 3: NAME OF EQUIPMENT PB
- 20 (page 20) net 6: NAME OF EQUIPMENT PB
- 20 (page 20) net 8: NAME OF EQUIPMENT PB
- 20 (page 20) net 13: AUTO CLOSE CONDITION
- 20 (page 20) net 16: OPEN CLOSE
- 20 (page 20) net 24: TORQUE SWITCH OF FULL OPEN SIDE
- 20 (page 20) net 27: TORQUE SWITCH OF FULL CLOSE SIDE
- 20 (page 20) net 31: TORQUE SWITCH OF OPEN SIDE
- 20 (page 20) net 33: (NAME OF EQUIPMENT) MOTOR ELECTRICAL TROUBLE
- 20 (page 20) net 34: LIMIT SWITCH OF FULL OPEN SIDE
- 20 (page 20) net 37: TORQUE SWITCH OF CLOSE SIDE
- 20 (page 20) net 39: (no name)
- 20 (page 20) net 45: (no name)
- 20 (page 20) net 51: LIMIT SWITCH OF FULL CLOSE SIDE
- 20 (page 20) net 52: LIMIT SWITCH OF FULL OPEN SIDE
- 20 (page 20) net 53: LIMIT SWITCH OF FULL CLOSE SIDE
- 20 (page 20) net 54: (no name)
- 21 (page 21) net 0: AUTO OPEN CONDITION
- 21 (page 21) net 4: NAME OF EQUIPMENT PB MANUAL
- 21 (page 21) net 3: NAME OF EQUIPMENT PB
- 21 (page 21) net 6: NAME OF EQUIPMENT PB
- 21 (page 21) net 8: NAME OF EQUIPMENT PB
- 21 (page 21) net 13: AUTO CLOSE CONDITION
- 21 (page 21) net 14: OPEN
- 21 (page 21) net 16: CLOSE
- 22 (page 22) net 0: AUTO OPEN CONDITION
- 22 (page 22) net 4: NAME OF EQUIPMENT PB MANUAL
- 22 (page 22) net 3: NAME OF EQUIPMENT PB
- 22 (page 22) net 6: NAME OF EQUIPMENT PB
- 22 (page 22) net 8: NAME OF EQUIPMENT PB
- 22 (page 22) net 15: (NAME OF EQUIPMENT) OPEN FAULT *
- 22 (page 22) net 16: AUTO CLOSE CONDITION
- 22 (page 22) net 28: NAME OF EQUIPMENT PB
- 22 (page 22) net 30: (no name)
- 22 (page 22) net 32: (no name)
- 23 (page 23) net 0: AUTO OPEN CONDITION
- 23 (page 23) net 4: NAME OF EQUIPMENT PB MANUAL
- 23 (page 23) net 3: NAME OF EQUIPMENT PB
- 23 (page 23) net 6: NAME OF EQUIPMENT PB
- 23 (page 23) net 8: NAME OF EQUIPMENT PB
- 23 (page 23) net 14: AUTO CLOSE CONDITION
- 23 (page 23) net 16: SOLENOID VALVE AIR OPERATED VALVE ENERGIZE OPEN
- 23 (page 23) net 18: DE-ENERGIZE CLOSE
