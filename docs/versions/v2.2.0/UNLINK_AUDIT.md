# 2.2.0 — Audit ng mga hindi ikinabit / binago para gumana (user, 2026-10-16)

Tanong ng user: ilang address ang tinanggal o nilaktawan para lang may gumana, at sinuri ba sa PDF bago tanggalin? Ito ang buong listahan ng 2.2.0-beta.1 ~ beta.5, na may ebidensya.

## LAHAT NG MALI KO SA 2.2.0 (beta.1 ~ beta.6), at ang ayos
Hindi ako sumangguni sa drawing / repo bago gumawa. Ito ang buong listahan:
1. **Inalis ang link ng protection** DITL-40 MAIN STEAM PRESSURE LOW LOW (beta.3). Ayos (beta.4): ABC-001C M.310D (< 72.9 kg/cm2).
2. **Nilaktawan ang LAHAT ng ref na may panaklong** "(19-57)" (beta.3): 79 DITL row + 48 ABC input ng makinang B / C / D ay hindi nakakabit. Ayos: beta.5 (4 row ng DITL-21E), beta.6 (lahat, 73 machine instance).
3. **Self cross-reference rule** (beta.3): ginawa at inalis bago na-push.
4. **Address group** (beta.3 ~ 5): ang row na pareho ang address ay pindot lang ang binabasa, hindi ang nakakabit na row, kaya nag-trip ang PAF ("PAF LUB OIL PUMP ALL STOPPED" = 1 kahit tumatakbo ang LOP B). Ayos: beta.6.
5. **TO column hindi binabasa:** ang FAB B (DITL-28A #B) ay kumukuha ng "FAB A STOPPED" (03B out 70) at ng "FAB A STOP COMMAND" ng IRP (03D out 68). Sa PDF: out 71 / out 69 ang para sa FAB B ("TO (28A-29)", "(28A-21)"). Ayos: beta.6.
6. **Relay contact ng DCS output hindi binabasa:** DITL-21A lamp 66 RUNNING / 68 STOPPED sa LCP (contact ng LOR-L1060A O.021C / LOS-L1060A O.021D sa DC 24V) ay laging patay, sa 4 na screw cooler. Ayos: beta.6 (`02-netlist.js`).
7. **Mga text rule na hula, hindi galing sa snapshot o drawing** (DITL 150):
   - beta.3: INADEQUATE, BLOCK, FIRE, EMERGENCY, COMPLETED, PURGE, POS.
   - beta.6, naitama:
     - silencer SOV ng FAB B (sarado ang hula, BUKAS sa 9.png);
     - gland drain at gland desuperheater spray (bukas ang hula, SARADO sa 29.PNG);
     - "NO TRIP PRESENT" (nabasang trip);
     - ang READY at PULSE output na itinuring na estado;
     - ang output na papunta sa PLC (DITL-65 63) na itinuring na posisyon ng valve;
     - ang "PB" na walang tuldok, HI-HI, at ang address sa gitna ng text na humaharang sa rule;
     - GCB / house operation (37.PNG);
     - LPH, ejector, polisher, make-up (02.png / 28.png / 29.PNG).
8. **Bagong rule na mali, inalis bago na-push** (beta.6): "MOV TORQUE = 0". Sa snapshot, "TQ" ang sarado na MOV (28.png MVCD1007 "R TQ").
9. **Itinanong sa user ang kayang sagutin ng repo:** ang "⊔" ng DITL-03F (sagot sa seksyon 3), at ang "hinihintay ang OK" sa instances ng B / C / D (dapat ginawa agad dahil drawing na ang nagsasabi).

## 0. 2.2.0-beta.6: WALA NANG HINDI NAKAKABIT
Utos ng user (2026-10-16): "Wala kang tatanggalin. Ikokonek mo sa tamang connection. Magbabase sa PDF / diagram."
- Ang drawing na may note na "THE DIAGRAM IS THE SAME FOR B / C / D" at address list (hal. `I.0056/376`, `M.0122/222/1622/1722`) ay ginagaya na para sa BAWAT makina: 73 machine instance (`DITL-23A #B`, `DITL-19 #C`, …), bawat isa may sariling logic at estado (`src/world/world.js` `makeInst`).
- Ang row ng makinang B / C / D (seksyon 2 sa ibaba, "SKIPPED 79" at ang 48 ABC input) ay nakakabit na sa output ng TAMANG instance. Paano pinili ang makina, ayon sa drawing:
  1. ang posisyon ng address sa address list ng row (62 link; hal. 23A row 5 / 14);
  2. ang letra ng makina sa text ng row (672; hal. DITL-01 r10 "BURNER B OIL VALVES ALL CLOSED" -> `DITL-07 #B` out 66); ang letra ay iniikot lang sa kaparehong pamilya ng kagamitan (DITL-19 BURNER row ay hindi iniikot sa coal feeder);
  3. ang kapatid na sheet (36; hal. DITL-19 r19 "BURNER B" -> DITL-12A / 12B / 12C);
  4. ABC: ang letra sa memory list description ("B-BFWP") o ang address ng ABC net sa address list ng row (M.3344 -> `23A #B`, M.3401 / M.3402 -> `19 #B` / `#C`, M.3309 -> `28A #B`, M.3351 -> `61A #B`, M.3354 / M.3355 -> `29A #B` / `#C`, M.3411.. -> `07 #B`..).
- Bilang (headless, `WORLD.stat`): beta.5 = 71 FROM DITL + 12 sa logic + 48 HINDI nakakabit; beta.6 = 110 + 21 + **0**. DITL -> DITL: 798 + 76 hindi nakakabit -> 1430 (kasama ang instances), **0** lost.
- 2 row na sariling sheet ang source (tama ayon sa PDF): DITL-21E r2 / r5 "SCREW COOLER D START / STOP COMMAND" <- 21E-70 / 21E-74 "B~D" (ang output ay para sa B~D).
- Bug na naayos kasabay: ang address group (row na pareho ang address, hal. DITL-24 row 6 "LOP B RUNNING" at row 26 "-I.037C LOP B STOPPED") ay sumusunod na sa estado ng nakakabit na row; dati ang pindot lang ang binabasa, kaya "PAF LUB OIL PUMP ALL STOPPED" = 1 at nag-trip ang PAF (`grpState`, 05-overlay-interaction.js).

Ang seksyon 2 sa ibaba ay ang listahan ng beta.5 (kasaysayan); lahat ng nasa listahan ay nakakabit na sa beta.6.

## 1. Mali, naayos na
- **ABC-001C TO DITL 40-09 (MAIN STEAM PRESSURE LOW LOW):** beta.3 inalis ang link (hindi sinuri ang drawing). beta.4: nakakabit sa M.310D (AI0131 < 72.9 kg/cm2), sinubok 122 -> 0, 60 -> 1.
- **DITL-21E row 2 / 5 / 16 / 19 (screw cooler D at A~C START / STOP COMMAND <- 21E-70 / 21E-74 "B~D"):** beta.3 nilaktawan dahil may panaklong. Sa PDF, ang output 70 / 74 ay ang command ng B~D (M.2148/50/58), kaya kasama ang D. beta.5: nakakabit na.
- **Self cross-reference rule:** ginawa at inalis bago na-push (walang naipadala).

## 2. Hindi ikinakabit, may ebidensya (ibang makina sa drawing ng makinang A)
Ang DITL ay ginagaya para sa makinang A lang. Ang row ng makinang B / C / D na tumuturo sa output ng A ("(19-57)" atbp.) ay hindi ikinakabit. Dati, sumusunod ang B sa A (BFWP B tumatakbo kapag tumatakbo ang A). Ebidensya: ang row ay may ibang letra ng makina kaysa sa output, o ang drawing ay may note na "THE DIAGRAM IS THE SAME FOR ..." (35 sheet). beta.6: GINAWA na ang hiwalay na instance ng B / C / D (seksyon 0).

### DITL -> DITL
```
LINKED 5
DITL-21E r2 "BOTTOM ASH SCREW COOLER D START COMMAND" <- (21E-70) "BOTTOM ASH SCREW COOLER START COMMAND B~D"
DITL-21E r5 "BOTTOM ASH SCREW COOLER D STOP COMMAND" <- (21E-74) "BOTTOM ASH SCREW COOLER STOP COMMAND B~D"
DITL-21E r16 "BOTTOM ASH SCREW COOLER A~C" <- (21E-70) "BOTTOM ASH SCREW COOLER START COMMAND B~D"
DITL-21E r19 "BOTTOM ASH SCREW COOLER A~C STOP COMMAND" <- (21E-74) "BOTTOM ASH SCREW COOLER STOP COMMAND B~D"
DITL-30 r17 "SEAWATER PUMP A RUNNING" <- (29A-55) "SEAWATER PUMP A RUNNING"

SKIPPED 79
DITL-01 r6 "BURNER B FLAME DETECTOR ON" <- (18-76) "BURNER A FLAME DETECTOR ON"
DITL-01 r7 "BURNER C FLAME DETECTOR ON" <- (18-76) "BURNER A FLAME DETECTOR ON"
DITL-01 r8 "BURNER D FLAME DETECTOR ON" <- (18-76) "BURNER A FLAME DETECTOR ON"
DITL-01 r10 "BURNER B OIL VALVES ALL CLOSED" <- (07-66) "BURNER A OIL VALVES ALL CLOSED"
DITL-01 r11 "BURNER C OIL VALVES ALL CLOSED" <- (07-66) "BURNER A OIL VALVES ALL CLOSED"
DITL-01 r12 "BURNER D OIL VALVES ALL CLOSED" <- (07-66) "BURNER A OIL VALVES ALL CLOSED"
DITL-01 r18 "COAL FEEDER B OUTLET DISCHARGE VALVE CLOSED" <- (20-62) "COAL FEEDER A OUTLET DISCHARGE VALVE CLOSED"
DITL-01 r19 "COAL FEEDER C OUTLET DISCHARGE VALVE CLOSED" <- (20-62) "COAL FEEDER A OUTLET DISCHARGE VALVE CLOSED"
DITL-01 r22 "COAL FEEDER B STOPPED" <- (19-58) "COAL FEEDER A STOPPED"
DITL-01 r23 "COAL FEEDER C STOPPED" <- (19-58) "COAL FEEDER A STOPPED"
DITL-03B r15 "FAB B STOPPED" <- (28A-58) "FAB A STOPPED"
DITL-03F r5 "BURNER B OIL VALVES ALL CLOSED" <- (07-66) "BURNER A OIL VALVES ALL CLOSED"
DITL-03F r6 "BURNER C OIL VALVES ALL CLOSED" <- (07-66) "BURNER A OIL VALVES ALL CLOSED"
DITL-03F r7 "BURNER D OIL VALVES ALL CLOSED" <- (07-66) "BURNER A OIL VALVES ALL CLOSED"
DITL-03F r9 "COAL FEEDER B RUNNING" <- (19-57) "COAL FEEDER A RUNNING"
DITL-03F r10 "COAL FEEDER C RUNNING" <- (19-57) "COAL FEEDER A RUNNING"
DITL-03F r12 "BURNER B OIL VALVES ALL OPENED" <- (07-75) "BURNER A OIL VALVES ALL OPENED"
DITL-03F r13 "BURNER C OIL VALVES ALL OPENED" <- (07-75) "BURNER A OIL VALVES ALL OPENED"
DITL-03F r14 "BURNER D OIL VALVES ALL OPENED" <- (07-75) "BURNER A OIL VALVES ALL OPENED"
DITL-19 r19 "BURNER B IN SERVICE" <- (12-70) "BURNER A IN SERVICE"
DITL-19 r20 "BURNER C IN SERVICE" <- (12-70) "BURNER A IN SERVICE"
DITL-19 r21 "BURNER D IN SERVICE" <- (12-70) "BURNER A IN SERVICE"
DITL-19 r25 "COAL FEEDER B REMOTE SELECTED" <- (19-56) "COAL FEEDER A REMOTE SELECTED"
DITL-19 r26 "COAL FEEDER B RUNNING" <- (19-57) "COAL FEEDER A RUNNING"
DITL-19 r27 "COAL FEEDER C REMOTE SELECTED" <- (19-56) "COAL FEEDER A REMOTE SELECTED"
DITL-19 r28 "COAL FEEDER C RUNNING" <- (19-57) "COAL FEEDER A RUNNING"
DITL-21C r3 "BOTTOM ASH SCREW COOLER B REMOTE MODE SELECTE" <- (21A-71) ""
DITL-21C r5 "BOTTOM ASH SCREW COOLER C REMOTE MODE SELECTE" <- (21A-71) ""
DITL-21C r7 "BOTTOM ASH SCREW COOLER D REMOTE MODE SELECTE" <- (21A-71) ""
DITL-21C r11 "BOTTOM ASH SCREW COOLER B AUTO SEQUENCE MODE " <- (21B-52) "BOTTOM ASH SCREW COOLER A AUTO SEQUENCE MODE "
DITL-21C r13 "BOTTOM ASH SCREW COOLER C AUTO SEQUENCE MODE " <- (21B-52) "BOTTOM ASH SCREW COOLER A AUTO SEQUENCE MODE "
DITL-21C r15 "BOTTOM ASH SCREW COOLER D AUTO SEQUENCE MODE " <- (21B-52) "BOTTOM ASH SCREW COOLER A AUTO SEQUENCE MODE "
DITL-21E r3 "BOTTOM ASH SCREW COOLER D RUNNING" <- (21A-53) "ASH SCREW COOLER A FORWARD RUNNING"
DITL-21E r4 "BOTTOM ASH COOLER INLET VALVE D CLOSE COMMAND" <- (117-63) "BOTTOM ASH COOLER INLET GATE VALVE CLOSE COMM"
DITL-21E r15 "BOTTOM ASH SCREW COOLER B~D AUTO SEQUENCE MOD" <- (21B-52) "BOTTOM ASH SCREW COOLER A AUTO SEQUENCE MODE "
DITL-21E r23 "BOTTOM ASH SCREW COOLER B~D FORWARD RUNNING" <- (21A-53) "ASH SCREW COOLER A FORWARD RUNNING"
DITL-22 r9 "BFWP A AUX. LOP B TRIP" <- (22-64) "BFWP A AUX. LOP A TRIP"
DITL-23A r4 "BFWP B TRIP" <- (23A-65) "BFWP A TRIP I.0057/377"
DITL-23A r5 "BFWP B RUNNING" <- (23A-55) "BFWP A RUNNING I.0056/376"
DITL-23A r7 "BFWP B TRIP OR STOP INTERLOCK CONDITION" <- (23B-76) "BFWP A TRIP OR STOP INTERLOCK CONDITION"
DITL-23A r10 "BFWP B SUCTION STRAINER DIFF. PRESSURE > 0.8k" <- (23B-69) "BFWP A SUCTION STRAINER DIFF. PRESSURE > 0.8k"
DITL-23A r16 "BFWP B AUTO STARTING" <- (23A-60) "BFWP A AUTO STARTING"
DITL-24 r6 "PAF LUB. OIL PUMP B RUNNING" <- (24-58) "PAF LUB. OIL PUMP A RUNNING"
DITL-24 r8 "PAF LUB. OIL PUMP B TRIP" <- (24-64) "PAF LUB. OIL PUMP A TRIP"
DITL-24 r26 "PAF LUB. OIL PUMP B STOPPED" <- (24-61) "PAF LUB. OIL PUMP A STOPPED"
DITL-28A r18 "FAB B TRIP" <- (28A-66) "FAB A TRIP I.0047/367"
DITL-28A r19 "FAB B RUNNING" <- (28A-55) "FAB A RUNNING"
DITL-28A r28 "FAB B RUNNING" <- (28A-55) "FAB A RUNNING"
DITL-29A r8 "SEAWATER PUMP B TRIP" <- (29A-67) "SEAWATER PUMP A TRIP"
DITL-29A r9 "SEAWATER PUMP B RUNNING" <- (29A-55) "SEAWATER PUMP A RUNNING"
DITL-29A r12 "SEAWATER PUMP C TRIP" <- (29A-67) "SEAWATER PUMP A TRIP"
DITL-29A r13 "SEAWATER PUMP C RUNNING" <- (29A-55) "SEAWATER PUMP A RUNNING"
DITL-30 r8 "SEAWATER BOOSTER PUMP B TRIP" <- (30-64) "SWBP A TRIP"
DITL-30 r9 "SEAWATER BOOSTER PUMP B RUNNING" <- (30-58) "SEAWATER BOOSTER PUMP A RUNNING"
DITL-30 r10 "SEAWATER BOOSTER PUMP C TRIP" <- (30-64) "SWBP A TRIP"
DITL-30 r11 "SEAWATER BOOSTER PUMP C RUNNING" <- (30-58) "SEAWATER BOOSTER PUMP A RUNNING"
DITL-30 r18 "SEAWATER PUMP B RUNNING" <- (29A-55) "SEAWATER PUMP A RUNNING"
DITL-30 r19 "SEAWATER PUMP C RUNNING" <- (29A-55) "SEAWATER PUMP A RUNNING"
DITL-31 r6 "DOP B RUNNING" <- (31-58) "DOP A RUNNING I.0003/323"
DITL-31 r8 "DOP B TRIP" <- (31-64) "DOP A TRIP I.0004/324"
DITL-39 r3 "SEAWATER PUMP B RUNNING" <- (29A-55) "SEAWATER PUMP A RUNNING"
DITL-39 r4 "SEAWATER PUMP C RUNNING" <- (29A-55) "SEAWATER PUMP A RUNNING"
DITL-61A r8 "" <- (61A-67) "CONDENSATE PUMP A TRIP"
DITL-61A r9 "" <- (61A-55) "CONDENSATE PUMP A RUNNING"
DITL-61A r10 "" <- (61B-62) "CONDENSATE PUMP A TRIP INTERLOCK CONDITION"
DITL-63 r15 "" <- (61A-55) "CONDENSATE PUMP A RUNNING"
DITL-65 r19 "" <- (61A-55) "CONDENSATE PUMP A RUNNING"
DITL-111 r6 "IWP B RUNNING" <- (111-58) "IWP A RUNNING I.0006/326"
DITL-111 r8 "IWP B TRIP" <- (111-64) "IWP A TRIP I.0007/327"
DITL-111 r10 "IWP B SUCTION STRAINER DIFF. PRESSURE >= 0.8k" <- (111-71) "IWP A SUCTION STRAINER DIFF. PRESSURE >= 0.8k"
DITL-112 r6 "MWP B RUNNING" <- (112-58) "MWP A RUNNING I.0000/080/320"
DITL-112 r8 "MWP B TRIP" <- (112-64) "MWP A TRIP I.0001/081/321"
DITL-112 r9 "MWP B SUCTION STRAINER DIFF. PRESSURE >= 0.8k" <- (112-51) "MWP A SUCTION STRAINER DIFF. PRESSURE >=0.8kg"
DITL-112 r10 "MWP C SUCTION STRAINER DIFF. PRESSURE >= 0.8k" <- (112-51) "MWP A SUCTION STRAINER DIFF. PRESSURE >=0.8kg"
DITL-112 r12 "MWP C RUNNING" <- (112-58) "MWP A RUNNING I.0000/080/320"
DITL-112 r14 "MWP C TRIP" <- (112-64) "MWP A TRIP I.0001/081/321"
DITL-112 r26 "MWP B AUTO STARTING" <- (112-70) "MWP A AUTO STARTING"
DITL-112 r27 "MWP C AUTO STARTING" <- (112-70) "MWP A AUTO STARTING"
DITL-120 r14 "INDUSTRIAL WATER PUMP B RUNNING" <- (111-58) "IWP A RUNNING I.0006/326"
```

### ABC input ng makinang B / C (48)
```
ABC-003B M.3423 (13-69)
ABC-003B M.3421 (15-66)
ABC-003B M.3434 (14-72)
ABC-003B M.3411 (07-64)
ABC-003B M.3413 (12-70)
ABC-003B M.3434 (14-72)
ABC-003C M.3452 (13-69)
ABC-003C M.3450 (15-66)
ABC-003C M.3463 (14-72)
ABC-003C M.3416 (07-64)
ABC-003C M.3418 (12-70)
ABC-003C M.3463 (14-72)
ABC-003D M.3453 (13-69)
ABC-003D M.3451 (15-66)
ABC-003D M.3464 (14-72)
ABC-003D M.3417 (07-64)
ABC-003D M.3419 (12-70)
ABC-003D M.3464 (14-72)
ABC-003E M.3413 (12-70)
ABC-003E M.3418 (12-70)
ABC-003E M.3419 (12-70)
ABC-003E M.3413 (12-70)
ABC-003E M.3418 (12-70)
ABC-003E M.3419 (12-70)
ABC-004A M.3411 (07-64)
ABC-004A M.3416 (07-64)
ABC-004A M.3417 (07-64)
ABC-004B M.3401 (19-57)
ABC-004C M.3402 (19-57)
ABC-009A M.3401 (19-57)
ABC-009A M.3402 (19-57)
ABC-010 M.3344 (23A-55)
ABC-014 I.008E (28C-76)
ABC-014 I.008D (28C-74)
ABC-014 M.3309 (28A-55)
ABC-029 M.3411 (07-64)
ABC-029 M.3434 (14-72)
ABC-029 M.3416 (07-64)
ABC-029 M.3463 (14-72)
ABC-029 M.3417 (07-64)
ABC-029 M.3464 (14-72)
ABC-050 M.3344 (23A-55)
ABC-052 M.3351 (61A-55)
ABC-052 M.3354 (29A-55)
ABC-052 M.3355 (29A-55)
ABC-003A M.3413 (12-70)
ABC-003A M.3418 (12-70)
ABC-003A M.3419 (12-70)
```

## 3. Basa ng simbolo "⊔" sa DITL-03F (beta.6: may ebidensya na)
- **DITL-03F row 25 / 26 BOILER EMERGENCY TRIP P.B.(1)(2) (N.C.) -> "⊔" -> OR -> NOT.** Ang "⊔" / "⊓" sa tabi ng push button ay ang hugis ng signal habang pinipindot: "⊓" = N.O. (0 -> 1 -> 0), "⊔" = N.C. (1 -> 0 -> 1). Ebidensya sa repo: DITL-22 row 23 "LOCAL START P.B." = "⊓", row 26 "LOCAL STOP P.B." = "⊔"; ang text ng DITL-03F ay "(N.C.)".
- Sa DITL-03F, ang N.C. contact ay 1 habang hindi pinipindot -> OR = 1 -> NOT = 0 (walang trip). Trip lang kapag parehong pinindot ang (1) at (2), na siyang gawi ng emergency trip ng boiler (dalawang button nang sabay, para walang aksidenteng trip). Kapag pulse ang basa (bago ang beta.3), laging ON ang trip: mali iyon.
- Status: (b) tama, may ebidensya. Hindi na hinihintay ang user.

## 4. Estado ng DITL 150 (beta.6: bawat isa may pinagmulan)
| Estado | Pinagmulan |
|---|---|
| FAB A silencer SOV sarado, FAB B silencer SOV BUKAS | 9.png XVFA1055A2 closed (green), XVFA1055B2 open (red). Dati: "sarado lahat" (MALI, naitama) |
| FAB A discharge bukas, FAB B discharge sarado | 9.png XVFA1055A3 open, XVFA1055B3 closed |
| 52G1 / 52L1 sarado, hindi house operation | 37.PNG: synchronized, 52L1 / DS / 52G1 / field CB red, NORMAL OPERATION MODE |
| Drains sarado (kasama ang gland steam drains) | 29.PNG MVAS1392 / 1393 / 1397 0.0 % TQ. Dati: ang gland drain ay nabasang BUKAS dahil nauna ang rule na "GLAND" (MALI, naitama) |
| Gland steam desuperheater spray sarado | 29.PNG XVCD1125 closed. Dati: bukas (MALI, naitama) |
| Main steam to aux / aux header bukas | 29.PNG MVAS1391 98.6 % |
| Start-up ejector sarado, steam jet air ejector bukas | 29.PNG MVAS1395 0.0 %, MVAS1396 100.6 % |
| #1 LPH inlet / outlet bukas, bypass sarado | 02.png MVCD1001 99.6 %, MVCD1002 99.4 %, MVCD1003 0.0 % TQ |
| Condensate polisher MOV sarado; make-up to condenser MOV sarado | 28.png MVCD1007 / MVCD1008 0.0 % TQ (FCVCD1121 100.6 %); MVMU1001 0.0 % |
| Condenser vacuum breaker sarado | 4.PNG condenser 0.057 kg/cm2A (may vacuum) |
| Coal silo outlet bukas | 11.png: feeders A / B / C 29 T/H (physics: may coal na dumadaloy mula sa silo) |
| BFWP AUX. LOP A / B: standby, AUTO | DITL-22: auto start = AUTO at (BFWP LUB OIL PRESS LOW < 1.5 kg/cm2, 23B-59) o (AUTO at kabilang LOP TRIP); walang auto stop. Ang aux LOP ay ang standby source kapag bumaba ang lube oil pressure; normal ang pressure habang tumatakbo ang BFWP A sa 150 MW (03.png 207 A, walang trip) |
| First-out memories (DITL-05 / 06) malinis | DITL-05 / 06 row 2 RESET FIRST OUT <- DITL-02 out 58 (MFT reset sa dulo ng purge ng huling start-up). Dati: naiwang "PAF STOPPED FIRST OUT" (MALI, naitama) |

## 5. Hindi pa isinasaalang-alang
- Boiler at turbine physics (fuel -> heat -> steam -> pressure -> MW): wala pa; ang plant model ay per loop lang.
- 344 field input row ng DITL na wala pang sariling rule at naiiwan sa 0: 212 analog (temperature / vibration / DP / position, ang comparator ay nasa normal), 89 AUTO / MANUAL mode ng MOV at pump na wala sa snapshot, 36 MOV limit / torque (ang MOV model ang nagbibigay), 7 iba pa. Hindi binabasa ng ABC ang mga ito at tugma ang lahat ng 868 output na may inaasahang estado. Susunod: basahin ang bawat isa sa I/O list at memory list.

## 6. beta.20 — mga DAGDAG na link (walang tinanggal): tag text sa kaliwang dulo ng wire
Rule (`src/ui/hmi/hmi.js modeNetsByTag`, 2.2.0-beta.20): kapag walang wire na malapit sa tag text (< 8 unit, rule ng beta.9), ang digital description wire na ang kaliwang dulo ay nasa loob ng 60 unit sa kanan ng text at nasa parehong linya (|dy| ≤ 4) ay ang address na iyon: ang text ay LABEL ng wire ("FICCL1061B.MAN  C/F B FLOW CTL IN MANUAL ( FROM ABC-004B )"). Walang descs propagation mula sa rule na ito. Dagdag (lahat sinuri sa PDF, crop ng drawing):
| Sheet | Address | Wire (netlist) | PDF |
|---|---|---|---|
| ABC-004A | FICCL1061A.MAN, FICCL1061B.MAN, FICCL1061C.MAN | n103, n105 "( FROM ABC-004B )", n104 "( FROM ABC-004C )" → AND **M.0131** → FIC-CF force manual | Tatlong wire sa kaliwa ng AND M.0131, bawat isa may tag text sa kaliwang dulo at description "C/F A / B / C FLOW CTL IN MANUAL"; ang B at C ay "( FROM ABC-004B / 004C )" = ang .MAN status ng feeder controller ng ibang sheet (iisang address, CLAUDE.md 1) |
| ABC-007 | PICFG108.MAN, PICFG108A.MAN | n87, n100 → AND **M.0181** → BU-CMD ng FICFA1071 (PA fan) | Dalawang wire sa kaliwa ng AND M.0181 "FURNACE PRESS. CTL IN MANUAL" (108 at 108A): kapag parehong MANUAL ang furnace pressure control, BU-CMD ang PA flow control |
| ABC-009A | SICL1060C.MAN, SICL1060D.MAN | n174, n107 → AND **M.0212** → TON 2 s TR36 (A/M ng PIC-BASC), TOF 2 s TR37 → M.0213 BU-CMD | Apat na wire "BOTTOM ASH SCREW COOLER A / B / C / D SPEED CONTROL IN MANUAL" sa kaliwa ng AND M.0212; ang A at B ay nakakabit na dati (malapit ang text), ang C at D ay hindi (mas malayo ang text) |
Epekto: ABC-004A FIC-CF ay force manual habang MANUAL ang lahat ng feeder (cold start bago ang coal transfer: tama, ang coal flow master ay walang kinokontrol); ABC-007 FICFA1071 BU-CMD habang MANUAL ang furnace pressure control (cold start: PA sa MANUAL din ng operator, walang pagbabago sa CHECK "M4 · Cold start" 10 / 10); ABC-009A PIC-BASC A/M ayon sa apat na cooler. Regression ng beta.20: tingnan ang `UPDATE_REPORT.md`.

