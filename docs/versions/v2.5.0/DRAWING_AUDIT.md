# Drawing audit: ABC logic + page linking vs PDF (2.3.0-beta.1, 2026-10-18 / 19)

Hiling ng user: ikumpara ang logic ng app sa drawing PDF ng mga sheet na hindi pa na-audit (CHECKLIST A #5), at isama ang DITL para masubok ang page linking.

**Sakop:** 50 ABC sheet (lahat maliban sa ABC-007 na tapos na at sa 3 legend sheet ABC-000 / 000A / 000B), at lahat ng link ng "iisang mundo": 1,430 DITL -> DITL, 110 DITL -> ABC, 118 ABC -> DITL.
**Batayan:** `document-references/analog-logic-abc-pdf.zip` (PDF ng bawat sheet), `digital-logic-ditl.zip` (PDF ng DITL), legend ABC-000, parameter workbook, memory list, I/O list.
**Paraan:** bawat block at wire ng app (basa ng app mula sa DWG, build v2.2.0 = `main` 9b0ae85) laban sa PDF na may grid; bawat "mali" ay pinalaki sa 400 ~ 600 dpi at sinubok sa totoong engine o sa headless app. Ang mga mode link (.MAN / .LOC / .REM) ay sinubok sa buong app (`AN.modeNets`), hindi lang sa engine.
**Hangganan:** hindi sinuri ang loob ng bawat DITL row (gate / timer ng DITL); ang DITL dito ay ang mga link lang. Ang PID tuning ay sinuri na noon (refcheck). Walang binago sa logic: report lang ito.

## Buod

| | Bilang |
|---|---|
| ABC sheet na walang mali | 28 sa 50 |
| ABC: mali (bug ng app) | 30 (22 sheet) |
| Page linking: mali | 4 uri (1 + 1 row + 4 label + 27 input) |
| Hindi mabasa sa drawing | 4 |

Walang mali (may ebidensya sa PDF): ABC-001A, 001B, 005, 006, 014, 015, 016, 017 (logic; ang link ay LINK-1), 019, 026, 027, 028, 029, 030, 031 ~ 039, 050, 052 (logic), 053, 055, 056.

## A. Kulang o maling link (ang tag ay hindi nakakabit; CLAUDE.md rule 1)

| ID | Saan | Ano ang mali | Epekto sa operator |
|---|---|---|---|
| ABC-001C-1 | HIC-BM force manual (M.2013) | Kulang ang 8th input ng OR: M.2000 = hindi REMOTE ang FIC-CM | Kapag hindi REMOTE ang coal master, hindi nag-MAN ang boiler master |
| ABC-001D-1 | F(X) LN60 (BIR gain) | Ang input "RATE (FROM ABC-001B) HIC-MWRL.PV" ay hindi nakakabit | BIR gain laging 0.95 (dapat ~1.1); walang epekto ang HIC-MWRL |
| ABC-013-1 | House operation OR | M.3200 / M.3220 / M.3221 ay nakapangalan sa paglalarawan, hindi sa tag | Turbine trip > 81.5 MW: hindi nagsisimula ang house operation; walang blow-off 100 % |
| ABC-011-1 | TICBR1140 force manual | TICBR1130.LOC hindi nakakabit sa M.0230 | LOCAL ng TICBR1130: hindi nag-MAN / track ang TICBR1140 |
| ABC-012-1 | TICMS1004 force manual | TICBR1150.LOC hindi nakakabit sa M.0240 | Pareho, sa main steam temp |
| ABC-057-1 | Front / rear wall AUTO / MANUAL | S3 M.144A / M.144B walang pangalan | 22 damper station ng 015 / 016 laging MANUAL; walang button |
| ABC-009A-1, 009B-1 | Screw cooler A ~ D | M.331D (DITL 21D-59) pinagsama sa ibang wire; kulang sa OR ng cooler B | DITL manual request hindi nagfo-force manual ng cooler A ~ C |
| ABC-009A-2 | AND M.0212 | SICL1060A / B.MAN hindi nakakabit | Lahat ng cooler MAN: hindi nag-MAN ang PIC-BASC |
| ABC-009A-3 | PIC-BASC.MAN | Walang pangalan ang wire | M ng PIC-BASC: hindi nag-MAN ang DPICFG108 |
| ABC-004A-2, 004A-3 | Tracking ng FIC-CF | "FEEDER B & C IN MANUAL", "FEEDER C IN MANUAL" hindi nakakabit | Maling deviation ang ginagamit sa tracking ng coal flow |
| ABC-008-2 | TR142 HYDRAULIC CONTROL SELECT | Walang M.0200 na pangalan | Hindi mapindot ang hydraulic select sa tag |
| ABC-020-1 | Connector "I" = HICHR1002B.MV | Hindi nakakabit (laging 0) | MAN -> AUTO ng RH/SH damper: SV nagsisimula sa 0 (may talon) |
| ABC-054-1 | PICHR1391 PV = HRP / 052 SI0180 | Hindi binasa ang connector | Sa RUN (walang unit model) hindi sumusunod ang PV sa HRH pressure |
| LINK-1 | ABC-017 I.024E "FROM DITL 80S-57" | Ikinabit sa DITL-80 (HRH drain pot); ang 80S ay sootblower PLC | Valve torque ng sootblower sumusunod sa drain valve |
| LINK-2 | DITL-21A row "21A" | Hindi binasa (numero "21A") | REMOTE ng 4 screw cooler walang pinagkukunan (6 input) |
| LINK-3 | ABC-001C / 008 "TO DITL 40-xx" | Label ikinabit sa net sa ilalim | Annunciator: "MSP HIGH" kapag mababa (< 100), "MSP H.H." sa 130, "FURNACE PRESS HIGH" kapag negatibo |
| LINK-4 | 27 DITL input "FROM ABC-xxx" | May address sa ABC pero walang link | Heater / DA HI-HI interlock (DITL-100 ~ 110, 115), HP / LP bypass MAN, bias damper, MFT sa DITL-15 ("3A-63") hindi sumusunod sa ABC |

## B. Mali sa behavior (engine)

| ID | Saan | Ano ang mali | Epekto |
|---|---|---|---|
| ABC-004A-1, 004B-1, 004C-1 | Coal feeder A / B / C MV high limit | Hindi ginagamit ang MHD = 83.3 % kapag M.3405 = 1 | Feeder MV puwedeng lumampas sa 33.3 T/H |
| ABC-003A-1 ~ 003D-1 | "IF M.0x5C = 1 SET SV = 49 T/H" | Sinusulat sa REMOTE leg lang, 2 s; ang LOCAL SV ay hindi | Sa house operation, hindi nagiging 49 T/H ang SV ng burner SA |
| ABC-003E-1 | Oil master RB-MV (SI0304) | Pinipili ang leg sa setting ng user, hindi sa M.009A ~ D (REMOTE ng burner) | Kapag B / C / D ang unang REMOTE, may talon ang oil master |
| ABC-002-1, 002-2 | Ramp "0.2 %/sec" air / PA demand | 0.2 T/H/s ang ginamit; ayon sa range ay 2.23 / 1.30 T/H/s | Mas mabagal 11x / 6.5x ang pagbaba ng air / PA demand |
| ABC-051-1 | BUMPLESS ramp "1.67 %/min" | Span 0 ~ 50 kg/cm2; dapat 0 ~ 600 °C | 12x mas mabagal ang SV ng HP bypass spray |

## C. Datos na kailangan ng hatol (drawing vs ibang reference)

| ID | Saan | Drawing | App | Mungkahi |
|---|---|---|---|---|
| ABC-010-1 | LICBR1001A range | -422 ~ 820 mm | -24 ~ 74 mm (workbook, salungat sa sariling PH 127 / PL -178) | Sundin ang drawing (source order 1 > 6); P action 12.7x mas malakas ngayon |
| ABC-008-1 | "B.0664 FURNACE PRESSURE (A) SIG.AB" | B.0664 (typo; ang kaliwa ng sheet ay B.0644) | Hindi nakakabit | Ikabit sa B.0644, isulat sa UNLINK_AUDIT |
| ABC-004B-2, 004C-2 | Pangalan ng <1 % comparator / TONS | M.0154 / M.0156, M.0164 / M.0166 | Baligtad (pangalan lang) | Itama ang pangalan |

## Hindi mabasa (may eksaktong bahagi)
- ABC-004A / B / C: ramp ng AUTO-MV (B75 / B26 / B26), walang rate na nakasulat; app = 1 /s.
- ABC-052: ramp SI0225 -> SI0224, "Ramp X % / sec", walang value ng X; app = walang limit.
- DITL-21C row 19 / 20 M.311A / M.311B (FURNACE DIFF. PRESSURE A / B SIGNAL ABNORMAL, FROM ABC-009A): walang ganitong address sa ABC-009A ng app; hahanapin ang SIG.AB sa PDF kasabay ng ayos ng LINK-4.

## Detalye bawat grupo (ebidensya: grid x / y, tile, netlist line, engine test)

---

### Page linking audit (DITL <-> DITL, DITL <-> ABC), v2.2.0, iisang mundo ON

Paraan: binasa sa headless app ang bawat link na ginagawa ng "iisang mundo" (WORLD.idx), at ikinumpara (1) ang paglalarawan ng input row sa paglalarawan ng output na kinukunan nito, (2) ang TO list ng output kung binabanggit pabalik ang row, (3) ang PDF ng mga kahina-hinala.

Bilang: 1,430 DITL -> DITL link (kasama ang machine B/C/D), 110 DITL -> ABC, 118 ABC -> DITL.

## TAMA
- 1,430 / 1,430 DITL -> DITL: tugma ang paglalarawan ng input at ng output na kinukunan (o binabanggit ng TO list ang row).
- 109 / 110 DITL -> ABC: tugma (ABC-014 I.0043 / I.008D, ABC-020 / 050 M.3103, ABC-009A 21A-53: tugma ayon sa TO list ng DITL).
- 114 / 118 ABC -> DITL: tugma ang comparator / gate ng ABC sa paglalarawan ng DITL row.
- 21 "FROM DITL" na net na kinukuwenta rin ng ABC (hal. ABC-004A M.3410 BNR A OIL S.I.V. ALL CL): tama, ganito mismo ang drawing (may kahon ng AND na nagpapaliwanag ng address).

## MALI
- [LINK-1] ABC-017 I.024E "S/B STEAM SUPPLY MOTOR VALVE TORQUE (FROM DITL 80S-57 FOR S/B LOGIC)". Ang "80S" ay sootblower PLC logic (sand-sootblower-logic.zip). Ang app ay nag-alis ng "S" at ikinabit sa DITL-80 out 57 = "HRH DRN POT DP-HR01 DRN VLV OPEN COMMAND". Epekto: kapag ON ang iisang mundo, ang sootblower valve torque sa ABC-017 ay sumusunod sa drain valve ng hot reheat. Ayos: huwag ikabit sa DITL-80; manual / FORCE input hanggang maipasok ang S/B PLC logic.
- [LINK-2] DITL-21A row "21A" (MIL-L1060A, BOTTOM ASH SCREW COOLER A REMOTE MODE SELECTED, I.0253/533/643/683) at output 71 "COOLER A REMOTE" (TO 21A-6, 21B-3, 21C-01, (21C-03/05/07)): ang drawing ay may numerong "21A" sa row 21, kaya hindi ito binasa ng app. Epekto: 6 input (21A-6, 21B-3, 21C-1/3/5/7) ng remote mode ng 4 na screw cooler ay walang pinagkukunan. Ayos: basahin ang "21A" bilang row 21.
- [LINK-3] ABC-001C at ABC-008 "TO DITL 40-xx": ang text ay nasa ilalim ng kahon na pinatutungkulan nito, at ikinabit ng app sa net sa ilalim. PDF DITL-40: row 6 MSP H.H. = O.0177 (> 134), row 7 HIGH = M.3109 (> 130), row 8 LOW = M.310A (< 100), row 9 LL = M.310D (< 72.9), row 13 FURNACE PRESS HIGH = M.3107 (> 30), row 14 LOW = M.3108 (< -50). App: row 6 <- M.3109, row 7 <- M.310A, row 8 <- M.310D, row 13 <- M.3108. Epekto: ang annunciator ay "MSP HIGH" kapag mababa ang pressure (< 100), "MSP H.H." sa 130 (dapat 134), "MSP LOW" sa 72.9, "FURNACE PRESS HIGH" kapag negatibo ang furnace pressure. Ayos: itama ang pagkakabit ng 4 na label.
- [LINK-4] 27 DITL input na "FROM ABC-xxx" na may address na nasa ABC, pero walang link (ang ABC drawing ay walang "TO DITL" na text para dito):
  - DITL-115 row 1 ~ 5 (M.0183, M.0193, M.0161, M.0233, M.0213 level H.H.) at row 17 / 18 (PICMS1006.MAN, PICHR1003.MAN, ABC-050 / 052);
  - DITL-100 ~ 110 heater / deaerator level HI-HI at HOUSE OPERATION (M.0203, M.0193, M.0161, M.0233, M.0213, M.3101) sa 15 row;
  - DITL-01 row 16 / 20 (M.0506 / M.0507 bias damper, ABC-020); DITL-25B row 25 / 26 (M.3440 / M.3441, ABC-20);
  - DITL-33 row 16 machine A (M.0248, ABC-012; ang machine B M.024C ay nakakabit);
  - DITL-79 row 6 (TICMS1022.MV, ABC-51);
  - DITL-15 row 10 MFT "3A-63" (typo sa drawing ng 03A-63; I.0560 = MFT).
  Epekto: kapag ON ang iisang mundo, hindi sumusunod sa ABC ang mga interlock na ito (hal. extraction MOV close sa HP heater HI-HI, MFT sa DITL-15). Ayos: ikabit ayon sa address / tag ng row (CLAUDE.md rule 1), at basahin ang "3A-63" bilang 03A-63.

## HINDI MABASA / WALANG SOURCE SA ABC
- DITL-21C row 19 / 20 "FURNACE DIFF. PRESSURE (A)/(B) SIGNAL ABNORMAL" M.311A / M.311B FROM ABC-009A: walang M.311A / M.311B sa ABC-009A ng app; kailangang hanapin sa PDF ng ABC-009A ang SIG.AB na pinagmulan (kasama sa ayos ng LINK-4).

---

### Group g1 findings: ABC-001A, 001B, 001C, 001D, 002, 013

Method: netlist line by line vs the tiles (zoomed at 600 dpi where needed, scratchpad g1/zoom.py). Suspected MALI items were confirmed in the real app (dist/logic-sim-v2.2.0.html, headless; AN.plantLoad150, then stepSet of ABC-001C; probe g1/b1.js). Mode nets (.MAN / .REM) checked with AN.modeNets.

## ABC-001A  COORDINATED CONTROL SYSTEM (unit load demand / MW high and low limit setters)
Blocks on drawing checked: 21   App blocks: 21
### MALI
- (none)
### HINDI MABASA
- (none)
### TAMA (short)
- HIC-ULD (MDL002), HIC-MWHL (MDL003), HIC-MWLL (MDL004): A/M T, BU-CMD T, B legs match (SI0200 RB-MV; SI0212 from 001B). The SV T and the BU-CMD T of HIC-ULD and the bottom T (B = SI0239 GEN MW from 001C) are selected by EIC-TM.MAN. The net is named "IN MANUAL", but AN.modeNets('EIC-TM') reaches it (001A n10).
- Deviation signs: M.2004 = SI0200 - HIC-MWHL.MV > 0.1 %; M.2006 = HIC-MWLL.MV - SI0200 > 0.1 % (0.2 MW, F-27). The > / < selectors (SI0204 / SI0206) and the high / low limiter on HIC-ULD.MV match.
- SET rule "IF HIC-ULD.MAN = 1 SET SI0200 => AB0117" is implemented; its control net is reached by AN.modeNets('HIC-ULD'). HIC-MWHL hi 151 MW = workbook MH 75.5 % of 200.

## ABC-001B  COORDINATED CONTROL SYSTEM (unit load max. rate of change, rate limit)
Blocks on drawing checked: 14   App blocks: 14
### MALI
- (none on this sheet; its RATE connector to ABC-001D is not linked, see ABC-001D-1)
### HINDI MABASA
- (none)
### TAMA (short)
- HIC-MWRL (MDL005, limits 0.1~3 MW/min from the workbook, F-5): A = own MV, B = COS, select M.0001 FORCE MANUAL. M.0001 is not driven on any ABC sheet; it comes from DITL.
- T = B/A x 100 / 60, where A = SI0208 = MV x 10/200 and B = 10000. The app computes B/A and checked this at runtime (2,000,000 = 10000 / 0.005). The rate limit is F-25, settled. BYPASS = EIC-TM.MAN (reached, 001B n9). SI0212 x 200/200 = SI0226 goes to 001A / 001C, and MWD SI0220 goes to 001D / 020.

## ABC-001C  CCS / BOILER MASTER / TURBINE MASTER
Blocks on drawing checked: ~100   App blocks: 102
### MALI
- [ABC-001C-1] OR that makes M.2013 (HIC-BM force manual), grid x~742 y~221, tile r2c3 | drawing says: the OR has 8 inputs. The 8th is M.2000 = NOT FIC-CM.REM ("COAL MASTER CONTROL REMOTE"): from the M.2000 junction (x~760, y~150) a wire runs left and enters the bottom of the OR bar (zoom confirmed) | app does: B67 OR has only 7 inputs (HP bypass, B.0641, M.0255, AND(B.069B, B.076E, M.201B), NOT M.0101, M.3200, B.0643); M.2000 is missing. Runtime check: FIC-CM.REM = 0 gives M.2000 = 1 but M.2013 = 0 | effect for the operator: when the coal master is not REMOTE, the app only switches the HIC-BM output to track total fuel SI0017 (BU-CMD T). The boiler master station stays AUTO (HIC-BM.MAN = 0), so PIC-COBM does not track through SI0224 and its PID keeps integrating. CCS mode M.201F and BF mode M.2010 stay on. When FIC-CM goes back to REMOTE, HIC-BM jumps from SI0017 back to the auto value; per the drawing it should stay MANUAL until the operator presses A | suggested fix: add M.2000 (net #80) as an input of the M.2013 OR (B67) in the reader (the wire that enters the bar from below through an L-bend).
### HINDI MABASA
- (none)
### TAMA (short)
- EIC-TM (MDL008): PV = SEL(AI0419, AI0774) x 240/200 (real MW). SV = SI0226 through LAG 150 s (enabled by NOT EIC-TM.MAN) + LN55(pressure deviation) SI0234. A/M is selected by M.2016, and the M.2016 OR inputs match. BU-CMD M.2017 = NOT I.0082 picks TCSAI1001.PV. M.311D < 50 MW and M.311F > 75 MW are right.
- PIC-COBM (MDL006, ACT:R): deviation SV - PV(AI0131). The H/L reads PV-SV > 1.5 -> M.2022 and < -1.0 -> M.2023 (negated correctly). The double-select A/M T (1:A NOT HIC-BM.MAN, 1:B HIC-BM.MAN) is right. In the BU-CMD, HIC-BM.MAN picks SI0224 = SI0213 - SI0201.
- Boiler master: SI0201 = SI0250 + LN54(SI0226) + BIR SI0219, and SI0225 = SI0201 + PIC-COBM.MV. HIC-BM (MDL007) BU-CMD M.2000 picks SI0017. SI0213 = MV x 1.2 T/H.
- Sootblower bias: FF M.201C (S = AND M.2022/M.3230/M.3231, R = OR M.3235/M.3236) -> TOF 1500 s -> M.201D. T 1:a -0.5 T/H / b 0, rate 18 %/h of 120 T/H, LAG 900 s enabled by NOT M.201D. All right.
- Steam flow AI0129 x LN32(TICMS1004) x LN31(AI0131) -> SQRT -> SUMA FIQMS1031: > 220 M.0101, < 69 M.2002, < 46 M.2001. Pressure comparators 134 / 130 / 100 / 72.9 are right. M.201E / M.2010 / M.201F gates, TON 2 s, TPS 2 s and O.0178 / O.0179 are right. Mode nets HIC-BM (5 wires), PIC-COBM (4), EIC-TM (3 + tag) are all reached. M.0255 from 013 is linked (runtime 1 = 1).
- Not logic: "AO0359 (TO TCS)" is only a text at the EIC-TM output (no AO symbol), and M.201E has no label in the app (no reader).

## ABC-001D  CCS BIR LOGIC
Blocks on drawing checked: 33   App blocks: 33
### MALI
- [ABC-001D-1] F(X) LN60 input "MWD CHANGE RATE (FROM ABC-001B) HIC-MWRL.PV", grid x~481 y~431..470, tile r1c2 | drawing says: LN60 input = the RATE connector from ABC-001B (HIC-MWRL MV/PV, 0~10 MW/min) | app does: B16 in:T = n59, an unnamed external input that is linked to nothing. Runtime: n59 = 0 while HIC-MWRL.MV = 3.0 | effect for the operator: the BIR gain SI0214 = LN60(0) = 0.95 always, instead of LN60(3 MW/min) = about 1.1. The boiler input rate (BIR) kick on load up / down is about 14 % too small, and changing HIC-MWRL does not change the BIR | suggested fix: link 001D n59 to 001B HIC-MWRL.MV through the "RATE" connector pair (001B circle at x~340 y~410, 001D circle at x~481 y~470).
### HINDI MABASA
- (none)
### TAMA (short)
- Deviations SI0220 - SI0212. H/L >= 2 / < 0.3 (FF M.2032 S/R), <= -2 / > -0.3 (FF M.2030 S/R), >= 0.3 M.200D, <= -0.3 M.200E. ABS -> LN58 / LN59. LN61 / LN62 on SI0212.
- M.2034 / M.2035 ANDs with M.201F. TOF 1 s -> M.2036 / M.2037 selects Y (1:Y). Rate V 0.045 / 0.03 T/min. Bypass M.2038 / M.2039 = OR(NOT M.201F, M.2034 / M.2035). SI0219 = SI0217 + SI0218 -> BIR 001C.

## ABC-002  COMBUSTION AIR CONTROL
Blocks on drawing checked: ~84   App blocks: 84
### MALI
- [ABC-002-1] Ramp "0.2 %/sec" on the air demand SI0033 -> SI0034, grid x~431 y~505, tile r1c2 | drawing says: 0.2 % per second of the total air range. The same line is compared with "32 % MIN. AIR FLOW", which the app itself converts as 32 % of 1115 T/H = 356.8 T/H (B1 th:1115), so 0.2 %/s = 2.23 T/H per s | app does: B76 RATE rate 0.2, pct with span 100 ("spanUnres: no range source found -> old behaviour kept"), so 0.2 T/H per s, 11 times slower | effect for the operator: the air demand cannot fall faster than 12 T/H/min (drawing: 134 T/H/min). After a load drop, runback or fuel cut, the TAF demand and the SA flow demand stay high for minutes longer than in the DCS, and O2 rises | suggested fix: B76 span = 1115 T/H (rate 2.23 T/H/s).
- [ABC-002-2] Ramp "0.2 %/sec" on the PA flow demand SI0040 -> SI0030, grid x~308 y~289, tile r2c2 | drawing says: 0.2 %/s of the PA range. SI0031 is scaled 648/1115 into the total air range, so the PA range is 0~648 T/H and the rate is 1.30 T/H per s | app does: B75 RATE rate 0.2 with span 100 (spanUnres), 0.2 T/H per s | effect for the operator: the PA flow demand falls 6.5 times slower than the DCS when the coal flow SI0140 drops | suggested fix: B75 span = 648 T/H (rate 1.296 T/H/s).
### HINDI MABASA
- (none)
### TAMA (short)
- Diesel to coal: TOF x 1 x (LN1(HS-OIL)/4450, F-14) x 140/1200 -> SI0004. SI0017 = SI0004 + SI0140 -> TFF. Cross limits: LS(SI0213, 1.2 x LN40(TAF)) = SI0014; HS(0.8 x LN22(SI0017), SI0033, ramp) = SI0021. M.2500 / M.2501 (ABS <= 0). Runtime: 0.8 and 1.2 factors applied, 487.3 = 0.8 x 609.1.
- Coal demand: SI0023 = SI0014 - SI0004, lead (30 s LAG), / SI0003 -> SI0010 (runtime 81.2 / 0.932 = 87.09). O2: SV = LAG 180 s(LN16(BM) + LN17(HS-O2)), bumpless 1 %/s, bypass AICFG112.LOC. PV = SEL(AI0273, AI0433) (runtime 4.296 = avg). M.0103 / M.0102 ORs, BU-CMD SI0054, LN15 / LN29.
- SA / PA: SI0041 = SI0036 - 648/1115 x SI0031; SI0042 = SI0041 - 35/1115 x FAF; SI0049 = a/b (SAF x 432/1115 / SI0042) with T 1:b NOT M.0101 -> 1.0; T 1:b M.008B -> LN7 / LN8(TOF). HIC-TADBS range +-50 T/H follows the faceplate workbook (drawing text says -30~30).

## ABC-013  MAIN STEAM PRESSURE CONTROL (BLOW-OFF)
Blocks on drawing checked: 36   App blocks: 36
### MALI
- [ABC-013-1] OR inputs of the house operation gate, grid x~704 y~521, tile r1c3 | drawing says: "52L1 OPEN FOR HOUSE OPERATION M.3221 (FROM S2 L0937)", "52G1 OPEN M.3220 (FROM S2 L0932)", "TURBINE TRIP M.3200 (FROM S2 L0400)" | app does: the three nets are named by their description ("52L1 OPEN FOR HOUSE OPERATION", "52G1 OPEN", "TURBINE TRIP", n10 / n9 / n19), not by the tags M.3221 / M.3220 / M.3200. The station wiring (unit.js U.bcast: I.0400 -> M.3200, I.0932 -> M.3220) and tag linking do not reach them. Runtime: ABC-050 I.0400 = 1 gives 001C M.3200 = 1 but 013 n19 = 0, so M.025B and M.025C stay 0 | effect for the operator: on a turbine trip or 52G1 open above 81.5 MW (M.025A), the drawing's house operation never comes on. M.025C (HOU1 to 029), the M.025D 7 s command (blow-off valve PCV-MS1001 to 100 % through BU-CMD) and M.025B to ABC-010 / 004A~C / 003A~D / 017 / 007 / DITL stay off | suggested fix: name n19 = M.3200, n9 = M.3220, n10 = M.3221 (tag text beside the wire), and add 013 M.3200 / M.3220 to U.bcast.
### HINDI MABASA
- (none)
### TAMA (short)
- PICMS1002 (MDL030, ACT:N): PV = PIC-COBM.PV (001C), and the SV is set by "IF M.0252 = 1 SET SI0361" (130 / 115 kg/cm2, T 1:b TOF 2 s of M.0256). The A/M T is 1:A M.0252 and 1:B B.0643 (both in b.cs, B wins).
- M.0252 = OR(TPS 9 s M.3225 from 050, TPS 2 s(NOT M.3225 AND M.0254 > 134)). BU-CMD M.025E = OR(M.0256, M.025D) picks SI0362 = T(LN18(BOF SI0161), 100 % on M.025D). M.0255 = MV > 5 % is linked to 001C / 010.
- FF M.025A: S > 81.5 MW, R < 76 MW. TOF 10 s, TPS 300 / 3 / 7 s. AO / I/P / valve chain is right.

## Summary
| sheet | MALI | HINDI MABASA |
|---|---|---|
| ABC-001A | 0 | 0 |
| ABC-001B | 0 | 0 |
| ABC-001C | 1 | 0 |
| ABC-001D | 1 | 0 |
| ABC-002 | 2 | 0 |
| ABC-013 | 1 | 0 |

---

### Group g2: drawing audit (ABC-003A, 003B, 003C, 003D, 003E, 006)

Method: netlist block by block against the tiles plus 600-dpi zooms of the PDF. Compiled fields (FF S/R, switch legs and selects, PRE/SET targets, q4 switch) were dumped from the real engine. Every external input on each sheet was run through `linksOf()` and `shareExt` (scripts in SCR/g2/). The SET SV rule was confirmed by running the engine (SCR/g2/sv.js).
Not findings: digital inputs from DITL (M.34xx, M.33xx, I.000F, M.008C/D) are shared by `shareExt`. The .LOC/.REM/.MAN tags are handled by `latchMode` and `modeNetsByTag`. Scale-convert constants and % to T/H conversions are settled (F-9, F-11, F-23).

## ABC-003A  A-START UP BURNER CONTROL (FUEL / AIR)
Blocks on drawing checked: 133   App blocks: 141 (7 TXD + 1 ACH are not logic)
### MALI
- [ABC-003A-1] Rule "IF M.035C = 1 SET SV = 49 T/H" (grid ~x760,y330, tile r2c3), FICFA1043A | drawing says: when M.035C pulses (house operation ON + BNR-A IN SERVICE, TPs 2 s), the SV of FICFA1043A is set to 49 T/H | app does: PRE rule on net SI0092#163, the A (REMOTE) leg of the SV switch B12 only, for the 2 s of the pulse. The operator SV (COS manual value#202, LOCAL leg) is not touched. The same M.025B also makes M.0122, which sets M.0121, which forces B12 to LOCAL at that moment. Engine run: M.035C = 1 gives SI0092 = 49.0 for 3 scans, but the PID SV (n162) stays 20.8 in both cases (SV switch left on LOCAL or put on REMOTE); after the pulse SI0092 goes back to 20.8 | effect for the operator: house operation with burner A in service never sets the SA flow SV to 49 T/H, so the SV stays where it was | suggested fix: make the SET write the controller SV: the LOCAL COS of B12, and hold it (not only the 2 s REMOTE-leg value).
### HINDI MABASA
- none
### TAMA (short)
- PICDO1043A (MDL062, 0~10 kg/cm2, ACT:R), FICDO1043A (MDL033, 0~3.5 T/H), FICFA1043A (MDL027, 0~65 T/H), SUMA FIQDO1043A MDL173, MAN HIC-AFAR MDL044 0.8~1.2, HIC-SADBSA MDL158 -10~10, and ALMs TIFA1086/1087, FIFA1043A, PIFA1088: tags, MDL numbers and ranges match.
- Force-manual ORs match the drawing input by input: M.0118 (B.067D, NOT REM, M.0341, M.0350), M.0351 (NOT M.0359, M.0352, MFT TPs 5 s), M.0110 (NOT M.008F, B.0723, NOT REM, M.0341, M.0350), M.0352, M.0353, M.0112, M.0121 (6 inputs incl. AND B.0759/B.0761, M.0098), M.0122, M.0123 (M.0124, M.012B, M.0122), M.0124.
- FF M.0359 (S = OR(B.0723, AND(M.0357 TPs, NOT B.067D)), R = mirror) and FF M.012C (S < 900, R > 1200 mmH2O): S and R are on the correct inputs.
- Switches: SI0070 (1:b M.3410 gives 0 %), SI0071 (1:a M.0352 gives 25 %, b = AO0209), 1:A NOT M.0359 picks FICDO, else PICDO MV, 1:B M.0341 gives 0 %, SI0093 (16 % / 25 % / SI0062), SI0062 (1:B M.012A < 130 MW gives 5 %, else 10 %).
- Air path SI0070 → LN19 × LN21(HIC-AFAR) → HS with 0 % → + LN9(HIC-SADBSA) → BUMPLESS RAMP 1 %/s (bypass FICFA1043A.LOC) → SV switch. DEV signs are right on all three loops. TP/SQRT FIFA1043A with SI0078 from PRI/SEC/AVG. Comparators < 18.7 % (12.155 T/H), > 47, < 50 T/H, 14/18/23/27 %. M.012B = AND of 8 inputs with TPs 2 s. M.035B/C/F chain (TON 5 s + TPs 2 s).
- All cross-sheet connectors are linked: 003B/C/D oil flows, 003E (SV-A, M.008F, M.0098, TOF), 001C MW, 013 HOU, 004A M.3410.

## ABC-003B  B-START UP BURNER CONTROL (FUEL / AIR)
Blocks on drawing checked: 104   App blocks: 111
### MALI
- [ABC-003B-1] "IF M.036C = 1 SET SV = 49 T/H" (tile r2c3) | same as ABC-003A-1: the app's PRE targets SI0097#30 (REMOTE leg of SV switch B6) for the 2 s pulse only. The LOCAL COS#158 is not set, and M.0125 (fed by M.0126, which comes from M.025B) forces LOCAL at the same time | effect: the SV of FICFA1043B is never set to 49 T/H | fix: the same as 003A-1.
### HINDI MABASA
- none
### TAMA (short)
- Same structure as 003A with B tags (PICDO1043B MDL063, FICDO1043B MDL034, FICFA1043B MDL028, FIQDO1043B MDL174, HIC-BFAR MDL045, HIC-SADBSB MDL159, FIFA1043B MDL169).
- M.0341 (MFT, 3 places), SAT, SI0062, M.012B, SV-B, M.008F and M.0098 are linked from 003A and 003E.
- B.0759/B.0761 are linked by tag from 003A. The FF M.0369 S/R is correct. M.3411/3413/3421/3423/3424/3434 and 16/25/25/0 % match.

## ABC-003C  C-START UP BURNER CONTROL (FUEL / AIR)
Blocks on drawing checked: 104   App blocks: 111
### MALI
- [ABC-003C-1] "IF M.037C = 1 SET SV = 49 T/H" | same as 003A-1: the PRE goes on SI0412#31 (REMOTE leg of B6) only; COS#158 is not set and M.0391 forces LOCAL at the same time | fix: the same.
### HINDI MABASA
- none
### TAMA (short)
- C tags/MDL (PICDO1043C 064, FICDO1043C 035, FICFA1043C 197, FIQDO1043C 175, HIC-CFAR 059, HIC-SADBSC 160, FIFA1043C 170) and M.3416/3418/3450/3452/3463 match. The ORs, FF M.0379, switches and comparators match.
- The app's coordinates for this sheet sit about 89 pt lower than the tile grid (blocks have y < 0). This is layout only; the logic matches.

## ABC-003D  D-START UP BURNER CONTROL (FUEL / AIR)
Blocks on drawing checked: 104   App blocks: 111
### MALI
- [ABC-003D-1] "IF M.038C = 1 SET SV = 49 T/H" | same as 003A-1: the PRE goes on SI0417#31 (REMOTE leg of B6) only; COS#158 is not set and M.0395 forces LOCAL | fix: the same.
### HINDI MABASA
- none
### TAMA (short)
- D tags/MDL (PICDO1043D 065, FICDO1043D 038, FICFA1043D 198, FIQDO1043D 176, HIC-DFAR 060, HIC-SADBSD 161, FIFA1043D 171) and M.3417/3419/3451/3453/3464 match.
- HIC-DFAR hi = 1.0752: this is MH 68.8 % from the parameter workbook (the drawn range 0.8~1.2 is kept), so it is TAMA.

## ABC-003E  OIL MASTER CONTROL
Blocks on drawing checked: 71   App blocks: 71
### MALI
- [ABC-003E-1] 4-leg switch SI0304 (RB-MV of FIC-OM, grid ~x330,y503, overview top-left; note box "(1) IF BNR-A OIL FLOW CONTROL REMOTE (M.009A) SELECT to a … (4) M.009D SELECT TO d") | drawing says: the leg is chosen by the signals M.009A / M.009B / M.009C / M.009D (the REMOTE status of each burner's oil flow control) | app does: B4 has q4 conditions with those tags, but the leg comes from the user parameters c1..c4 (all 0 by default, so leg a = FICDO1043A.SV is used). M.009A–D are not read as signals and are not linked (the "sel" n137 is the note-box arrow, unlinked) | effect for the operator: when all burners are LOCAL and one burner goes REMOTE, M.0092 (TOF 2 s) puts FIC-OM on its BU-CMD and it initialises to SI0304. If that burner is B, C or D, FIC-OM takes burner A's SV instead, so the oil master output jumps | suggested fix: drive the q4 selection from M.009A–D. Make them shared digital inputs, or derive them from the REMOTE status of FICDO1043A–D (the SV switch on its SV-A..D leg), instead of the c1..c4 parameters.
### HINDI MABASA
- none
### TAMA (short)
- FIC-OM (MDL164, 0~14 T/H, ACT:R, PV = TOF SI0061 from 003A). M.0091 = AND of the 4 FICDO .LOC (force MAN). M.0092 = TOF 2 s, giving BU-CMD with RB-MV. M.0093 = TON 2 s of NOT M.0091. FIC-OM.MV goes to all 4 function blocks.
- Function blocks A–D (FM332): T1 (1:Y = AND(NOT LOC TONS-path, M.0093), Y = FIC-OM.MV, N = FICDO.SV) → RATE 5 %/min (bypass .LOC) → T2 (1:Y = M.5010) → SV-A..D. DEV is +MV −SV into "< X%" with X = 3 %. FF M.5010: S = AND(< X%, TONS 2 s of NOT LOC), R = NOT TONS. All four copies are wired the same.
  - Note: "< X%" is signed in the app (x < 0.105 T/H). The drawing shows only "< X%", with no ABS block, so this matches the drawing as drawn.
- M.0095 = OR of the 4 oil flow SIG.AB, linked from 003A–D. M.008E = OR of the 4 FICFA .REM. M.0090 = AND of the 4 IN SERVICE. M.009F = OR of the 4 IN SERVICE.
- M.0097 OR has all 7 inputs, with NOTs on M.0090, 1081.REM, 1071.REM and M.008E. FF M.008F: S = TPs M.008C, R = M.0097. M.0098 = TPs of NOT M.008F, going to 007 and 003A–D. M.008B = AND(NOT M.0096 from 004A, M.009F), going to 002.

## ABC-006  TOTAL AIR FLOW (PAF / SAF / FAB)
Blocks on drawing checked: 56   App blocks: 66 (10 TXD)
### MALI
- none
### HINDI MABASA
- none
### TAMA (short)
- TP/SQRT for FIFA1081 (AI0628/AI0513), FIFA1071 (AI0580/AI0484), FIFA1079 (AVERAGE of AI0656/AI0672 with AI0166) and FIFA1055 (SI0159 with AI0545).
- SI0159 switch: 1:a M.025F gives TIFA1055A, else TIFA1055B. M.025F = OR(AND(M.3308, NOT B.0733), AND(NOT M.3308, B.074B)).
- TAF = Σ of the three flows; the scale-convert ratios are divided out (real T/H). TAF < 25 % MCR (151.5 T/H) gives M.0340, then TON 5 s gives M.3100. FIFA1055 < 20 T/H gives M.3114.
- ALM tags and MDL numbers match. Outgoing links (SAF/PAF/FAF/TAF to 002, 007, 014) are present. M.3308 (DITL 28A-55) is a shared digital input.

## Summary
| sheet | MALI | HINDI MABASA |
|---|---|---|
| ABC-003A | 1 | 0 |
| ABC-003B | 1 | 0 |
| ABC-003C | 1 | 0 |
| ABC-003D | 1 | 0 |
| ABC-003E | 1 | 0 |
| ABC-006 | 0 | 0 |

---

### Group g3 — drawing audit: ABC-004A, ABC-004B, ABC-004C, ABC-005, ABC-008

Paraan: binasa ang bawat tile (at 450–600 dpi na zoom ng mga siksik na bahagi: `g3/zoom.py`), ikinumpara sa netlist, sa `S.link` (same-sheet connector) at `S.xlk` (cross-sheet link) ng tunay na engine (`g3/p3.js` -> `g3/links.txt`). Mga hinala ay sinubok sa Node engine (`g3/t1.js`, `t2.js`, `t5.js`). Walang binago sa repo.

## ABC-004A  COAL MASTER CONTROL & A-COAL FEEDER CONTROL
Blocks on drawing checked: ~125   App blocks: 138 (kasama 7 COS, 2 TXD)
### MALI
- [ABC-004A-1] MAN FICCL1061A (S1-MDL011) @(218,232), MV HIGH LIMIT switch B42 @(117,252), tile r2c1 | drawing says: "FICCL1061A MV HIGH LIMIT SETTING VALUE" -> FICCL1061A.MHD = 83.3 % kapag M.3405 (A/B/C ALL IN REMOTE AND RUNNING) = 1, kung hindi 100 % | app does: binabasa ang net FICCL1061A.MHD#97 (B12 in:L) pero WALANG gumagamit nito sa engine (`plant.js` case 'MAN' ay naglilimit lang sa P.lo / P.hi = 0~40 T/H; walang "MHD" sa buong src) | effect for the operator: kapag lahat ng feeder ay REMOTE at tumatakbo, ang MV ng feeder ay dapat hanggang 83.3 % (33.3 T/H) lang; sa app ay umaabot sa 40 T/H (100 %) | suggested fix: sa MAN step, hi = min(P.hi, MHD x 0.4) para sa FICCL1061A/B/C (MHD ay % ng 40 T/H).
- [ABC-004A-2] input "COAL FEEDER B & C ALL IN MANUAL (FROM ABC-004B/C)" -> NOT -> M.013C -> select ng SW B28 @(415,119), tile r2c2 (zoom `g3/a_sw.png`) | drawing says: ang select ay galing sa estado na B at C ay parehong MANUAL (FICCL1061B.MAN at FICCL1061C.MAN) | app does: net n176 ay walang pangalan, walang link (ext, laging 0) -> M.013C laging 1 -> SI0145 (RB-MV ng FIC-CF) ay laging SI0146 (B/C deviation) | effect: kapag B at C ay MANUAL, ang tracking ng coal flow control (FIC-CF, BU-CMD M.0133) ay dapat kumuha ng A deviation (FICCL1061A.MV - SI0110); sa app ay B/C deviation pa rin, kaya hindi tama ang bumpless na balik sa AUTO | suggested fix: n176 = FICCL1061B.MAN AND FICCL1061C.MAN (mode status mula sa 004B / 004C), isulat ang ebidensya sa UNLINK_AUDIT.
- [ABC-004A-3] input "COAL FEEDER C IN MANUAL" -> NOT -> M.013B -> select ng SW B31 @(629,86), tile r2c3 | drawing says: estado ng FICCL1061C.MAN (MANUAL ng C feeder) | app does: net n149 walang pangalan, walang link (laging 0) -> laging pinipili ang C deviation (b) | effect: kapag C ay AUTO (hindi manual), dapat B deviation (FICCL1061B.MV - SI0120) ang SI0146; sa app ay laging C | suggested fix: i-link ang n149 sa FICCL1061C.MAN (mode status; parehong paraan ng `modeNetsByTag`).
### HINDI MABASA
- Ramp block B75 @(367,310) (tile r2c2): walang nakasulat na rate sa drawing; ang app ay gumagamit ng 1 /s. Hindi ito mali ng app, pero walang halaga sa drawing para ikumpara.
### TAMA (short)
- Coal master FIC-CM: SV = bumpless ramp 1 %/s ng CFD SI0010 (bypass FIC-CM.LOC), SV switch sa COS kapag M.0130 (1:B); PV = SI0144; ACT:R; AMT A/M (M.0130) at BU-CMD (M.0133, RB-MV SI0143).
- FIC-CF: SV = FIC-CM.MV kapag FORCE REMOTE M.0132 (1:A) = TON 2 s ng NOT M.0131; PV SI0143 = (SI0113+SI0123+SI0133) x 1/3; A/M = NOT M.0132; BU-CMD M.0133 = TOF 2 s ng M.0131 (AND ng tatlong .MAN), RB-MV SI0145.
- M.0130 OR: M.0138, M.0137, NOT FIC-CF.REM, NOT FICFA1071.REM, NOT FICFA1081.REM. M.0138 = feeder ANDs (M.340x & SIG.AB) + oil ANDs (NOT M.3410/11/16/17 & B.0723/072A/0725/072C). TOF 2 s -> B.080B/C/D. M.0137 = TON 30 s ng (M.014F/015F/016F) AND M.3405.
- HS-COAL: PV SI0237 = SI0203 + LN44(LAG150(SI0221) - SI0203); SV = TFF LAG 150 s, FORCE REMOTE M.2021 = TP 2 s ng NOT PIC-COBM.MAN; A/M M.2020 = OR(PIC-COBM.MAN, NOT M.014E/015E/016E, NOT M.3410/3411/3416/3417); LN3 -> SI0003; SI0140 = SI0144 x SI0003.
- Feeder A: OR M.0141 (M.025B, NOT M.0142, B.0718); M.0147 (NOT M.014E, M.0146); TPS 5 s / 25 s; RB-MV path (SI0311 4T/8T sa M.025B 1:b, 0 kapag stop, rate 1 T/s, bypass NOT M.0146); FF M.0145 (S = M.0144 AND NOT .MAN, R = .MAN); H/ >= 83.3 % -> M.014F; LN23 bias; TOF 2 s / TON 3 s ng M.3400 -> M.014E / M.0142; SI0114 switch; total coal flow sum x 40/120.
- Cross-sheet: SI0124 / SI0134, FICCL1061B/C.MV, SI0120 / SI0130, M.015E/F, M.016E/F, M.3401/3402, B.0720/0728, CFD (002), TFF (002), FFD (001C) — lahat naka-link.

## ABC-004B  B-COAL FEEDER CONTROL
Blocks on drawing checked: ~40   App blocks: 44
### MALI
- [ABC-004B-1] MAN FICCL1061B (S1-MDL012) MV HIGH LIMIT, SW B14 @(161,257), tile r2c1 | drawing says: FICCL1061B.MHD = 83.3 % kapag M.3405 = 1 | app does: net FICCL1061B.MHD#32 ay hindi ginagamit ng MAN (sinubok: M.3405 = 1, MHD = 83.3, manual MV 38 T/H -> MV nanatiling 38 T/H; dapat 33.3 T/H) | effect: lumalampas sa 83.3 % ang feeder B | suggested fix: parehong ayos ng ABC-004A-1.
- [ABC-004B-2] pangalan ng net ng "<1%" comparator B12 @(396,329), tile r2c2 (zoom `g3/b_ff.png`) | drawing says: output ng <1% = M.0154; output ng TONS 2 s (TR71) = M.0156 | app does: ang output ng comparator ay pinangalanang M.0156#45; ang TONS output n11 walang pangalan | effect: pareho ang logic (AND ng dalawa -> S; NOT ng TONS -> R), pero mali ang tag na nakikita ng operator sa trace / view; maling address kung may ibang sheet na gagamit ng M.0156 | suggested fix: ilipat ang label M.0156 sa TONS output at M.0154 sa comparator output.
### HINDI MABASA
- Ramp block B26 @(474,327): walang nakasulat na rate sa drawing (app: 1 /s).
### TAMA (short)
- A/M M.0151 = OR(M.025B, NOT M.0152, B.0720); BU-CMD M.0157 = OR(NOT M.015E, M.0158); M.0158 = TPS 5 s / TPS 25 s (AND M.025B); RB-MV: SI0311 (004A) kapag M.0158 (1:b), 0 kapag NOT M.015E (1:a), rate 1 T/s bypass NOT M.0158.
- AUTO-MV: SI0126 = LN25(B-BIAS) + FIC-CF.MV; tracking switch 1:Y = NOT .MAN AND M.0132 (004A); rate bypass .MAN; FF M.0155 (S = M.0154 AND TONS(NOT .MAN), R = NOT TONS).
- M.3401 -> TOF 2 s (M.015E) -> TON 3 s (M.0152); SI0124 = 0 kapag stop; H/ >= 83.3 % -> M.015F; SIG.AB B.0720; lahat ng connector 2/5/8/11/B/B-CF/B-CFCMV ay naka-link sa 004A.

## ABC-004C  C-COAL FEEDER CONTROL
Blocks on drawing checked: ~40   App blocks: 44
### MALI
- [ABC-004C-1] MAN FICCL1061C (S1-MDL013) MV HIGH LIMIT, SW B9 @(156,257), tile r2c1 | drawing says: FICCL1061C.MHD = 83.3 % kapag M.3405 = 1 | app does: FICCL1061C.MHD#43 hindi ginagamit ng MAN | effect: lumalampas sa 83.3 % ang feeder C | suggested fix: parehong ayos ng ABC-004A-1.
- [ABC-004C-2] pangalan ng net ng "<1%" comparator B20 @(392,327), tile r2c2 | drawing says: comparator output = M.0164, TONS 2 s (TR72) output = M.0166 | app does: comparator output pinangalanang M.0166#18 | effect: label lang (pareho ang logic); M.0166 ay ginagamit din sa ABC-031 (ibang station), kaya mas mahalaga na tama ang address | suggested fix: ilipat ang label.
### HINDI MABASA
- Ramp block B26 @(470,326): walang nakasulat na rate (app: 1 /s).
### TAMA (short)
- Kapareho ng 004B: M.0161 / M.0167 / M.0168 logic, LN27 C-BIAS, AUTO-MV tracking at FF M.0165, RB-MV path, M.3402 TOF 2 s / TON 3 s (M.016E, M.0162), SI0134, H/ -> M.016F, B.0728; lahat ng connector naka-link.

## ABC-005  LIMESTONE FEEDER CONTROL (SOx CONTROL)
Blocks on drawing checked: ~45   App blocks: 48
### MALI
- (wala)
### HINDI MABASA
- (wala)
### TAMA (short)
- AICFG10571 (S1-MDL037): Δ = PV AI0466 (+) - SV COS (-), ACT:N; OMV = PID + (MV - SI0337) + SI0337 gaya ng drawing; A/M M.0148; BU-CMD M.3403 (M.0149 wire) -> 0 % (PTN009001).
- M.0148 = OR(B.0712, OR[AND(NOT M.3400, NOT M.3401, NOT M.3402), M.3400&B.0718, M.3401&B.0720, M.3402&B.0728], B.064F, M.3403). M.3400/3401/3402 ay iisang signal sa 004A/B/C (sinubok: shareExt, sumusunod ang 005).
- Limestone chain: AB0114 / max(AB0115, 1) x 3.13 x 10000 -> SI0339 x SI0144 x 12000/2700 -> SI0334 x 1.3 -> DENSITY CORRECTION B/A (A = AB0116) -> SI0337; AB0116 / 13 x SIM1311.PV -> SI0336 -> SUMA LIME-SUM (real units, F-1 / F-8).

## ABC-008  FURNACE PRESSURE CONTROL
Blocks on drawing checked: ~75   App blocks: 84
### MALI
- [ABC-008-1] input "B.0664 FURNACE PRESSURE (A) SIG.AB" ng AND B74 @(528,378) (-> OR M.0204, force manual ng damper PICFG108A), tile r2c2 | drawing says: tag B.0664 na may text na "FURNACE PRESSURE (A) SIG.AB"; sa kaliwang kalahati ng parehong sheet ang FURNACE PRESSURE (A) SIG.AB ay B.0644 (SIG.AB ng AI0132); ang B.0664 sa repo ay SIG.AB ng AI0196 = ZT-FA1055-B1 FA blower-B inlet damper position (ABC-014 B21, wiring list) | app does: B.0664#85 ay ext, walang link, laging 0 -> ang AND ng tatlong furnace-pressure SIG.AB ay hindi kailanman 1 sa damper side | effect: kapag sira lahat ng tatlong furnace pressure transmitter, ang hydraulic coupling (PICFG108) ay napupunta sa MAN pero ang IDF inlet damper (PICFG108A) ay hindi | suggested fix: i-link sa B.0644 (tugma sa text at sa kaliwang kapares) at isulat ang ebidensya ng typo sa UNLINK_AUDIT; hindi sa ABC-014 B.0664 (ibang equipment).
- [ABC-008-2] input ng TPS TR142 B80 @(461,309) "HYDRAULIC CONTROL SELECT (CRT) M.0200", tile r2c2 | drawing says: address M.0200 | app does: net n53 walang pangalan (ang kapares na DAMPER CONTROL SELECT ay may M.0201#57) | effect: ang pindot ng operator na "HYDRAULIC CONTROL SELECT" ay hindi mahahanap sa tag (UAT `check.js` ay gumagamit ng `setx('ABC-008','M.0201')` lang; walang paraan para sa M.0200 by tag) | suggested fix: ilagay ang label M.0200 sa n53.
### HINDI MABASA
- (wala)
### TAMA (short)
- Furnace pressure: AVERAGE SELECT ng AI0132 / AI0260 / AI0388 -> SI0180; M.3107 > 30 mmH2O, M.3108 < -50 mmH2O.
- PICFG108 (H/C) at PICFG108A (damper): Δ = PV - SV, ACT:N; OMV = PID + (MV - SI0188/SI0189) + SI0188/SI0189; feedforward SI0187 = (PAF.MV x [M.3302] + SAF.MV x [M.3303]) / 2 -> LN50 / LN51.
- H/C: A/M M.0205 = OR(AND ng 3 SIG.AB, NOT M.3304, NOT M.0202, M.0206 [MV < 14 %]); BU-CMD M.020D = OR(M.020E TPS fan run -> 13 %, M.020F TPS fan stop -> 0 %), RB-MV SI0183 tama ang 1:a.
- Damper: A/M M.0204 = OR(M.0202, AND ng 3 SIG.AB, NOT M.3304); FF M.0202 (S = TPS(M.0200) AND M.0207, R = TPS(M.0201)); SW 1:a M.0202 -> SI0181 (LN13 ng H/C MV) at BU-CMD M.0202 RB-MV AO0226; M.0207 = |SI0181 - PICFG108A.MV| < 1 %.

## Summary

| sheet | MALI count | HINDI MABASA count |
|---|---|---|
| ABC-004A | 3 | 1 |
| ABC-004B | 2 | 1 |
| ABC-004C | 2 | 1 |
| ABC-005 | 0 | 0 |
| ABC-008 | 2 | 0 |

---

### Drawing audit, group g4: ABC-009A, ABC-009B, ABC-010, ABC-014, ABC-017

Paraan: bawat sheet ay binasa sa PDF (zoom 450~900 dpi, `g4/zoom.py`), block by block, wire by wire, laban sa netlist. Ang bawat MALI ay sinubok sa totoong engine (`g4/t9.js`, `g4/t14.js`, `g4/mn.js` = parehong `modeNetsByTag` ng `src/ui/hmi/hmi.js`).

## ABC-009A  FURNACE DIFF. PRESSURE CONTROL & A/B/C-BOTTOM ASH SCREW COOLER CONTROL
Blocks on drawing checked: ~150   App blocks: 166 (kasama ang TXD/COS)
### MALI
- [ABC-009A-1] M.331D "BOTTOM ASH SCREW COOLER SPEED CONTROL MANUAL MODE (FROM DITL 21D-59)", input ng tatlong OR (M.0280 @x185,y246; M.0290 @x443,y235; M.0300 @x698,y246), tile r2c1/r2c2/r2c3 | drawing says: 3 hiwalay na DITL input (iisang address), bawat isa ay pumapasok sa OR na nagfo-force manual ng SICL1060A / B / C | app does: (a) OR M.0290 (B115) ay 4 input lang, walang M.331D (net M.331D#32 @348,268 ay hindi nakakabit sa OR); (b) M.331D#31 (C) at #45 (A, LINK mula #31) ay KINUKUHA MULA sa ABC-009B net M.331D#11, na sa 009B ay ang output ng AND(B.0646, B.066E) (tingnan ABC-009B-1). Sinubok: user M.331D = 1 -> nananatiling 0 (#31, #45, #32); B.0646 = B.066E = 1 -> M.331D#31/#45 = 1 | effect for the operator: ang "manual mode" request ng DITL ay hindi kayang i-force manual ang screw cooler A / B / C; sa trace ay mukhang M.331D = SIG.AB ng furnace DP | suggested fix: ikabit ang M.331D#32 sa OR M.0290; gawing external DITL input ang M.331D (iisang address sa 009A at 009B, shareExt), hindi galing sa AND ng 009B.
- [ABC-009A-2] AND M.0212 "SICL1060A/B/C/D.MAN = SPEED CONTROL IN MANUAL" (B109 @x532,y504), tile r1c2 | drawing says: input = SICL1060A.MAN, SICL1060B.MAN, SICL1060C.MAN, SICL1060D.MAN (mode status ng 4 MAN station) | app does: ang 4 input ay unlabelled external n107 / n174 / n175 / n202; walang LINK. Ang HMI tag search (`modeNetsByTag`) ay nakakakita lang ng C (n174) at D (n107); ang A (n202) at B (n175) ay pangalang "M.0212" kaya tinatanggihan ng `descWire`. Sinubok: SICL1060A~D.MAN = 1 sa mga labelled net -> AND inputs [0,0,0,0], M.0212 = 0, M.0213 = 0 | effect for the operator: kapag lahat ng 4 screw cooler ay MANUAL, ang PIC-BASC ay HINDI na-fo-force manual (NOT M.0211 -> 1:B) at walang BU-CMD M.0213 (SI0199 tracking); FORCE REMOTE M.0211 nananatiling 1 | suggested fix: i-link ang 4 input sa SICL1060x.MAN (iisang address; tag text @422,480~525 ay nasa kaliwa ng wire).
- [ABC-009A-3] PIC-BASC.MAN "BOTTOM ASH SCREW COOLER CONTROL IN MANUAL" (net n167 @x116~282,y419~447), tile r1c1 | drawing says: PIC-BASC.MAN -> OR M.0210 (force manual ng DPICFG108) at diretso sa 1:B BU-CMD (B = SI0198) | app does: n167 ay unlabelled external, pangalan "1:B" (tinatanggihan ng `descWire`), `modeNetsByTag('PIC-BASC')` = wala | effect for the operator: ang pag-MAN ng PIC-BASC sa faceplate ay hindi nagfo-force manual / BU-CMD sa furnace DP controller DPICFG108 | suggested fix: lagyan ng label PIC-BASC.MAN ang n167 (owner = PID PIC-BASC sa sheet na ito).
### HINDI MABASA
- (wala)
### TAMA (short)
- DPICFG108: select circuit PRI/SEC/AVG ng AI0134/AI0262, DEV +PV / -SV, ACT:N, H/ >1900, H/ >1500, /L <1600, /L <1400, /L <1150 (M.3134~M.3137, M.3122); A/M 1:A = M.0214 (OR M.334C~F), 1:B = M.0210 = OR(4 coal feeder terms, PIC-BASC.MAN); AND(NOT M.3400, NOT M.3401, NOT M.3402) tama.
- PIC-BASC: SV T 1:A = M.0211 (FORCE REMOTE, A = DPICFG108.MV), DEV +SV / -SI0198, ACT:R, A/M 1:B = NOT M.0211, M.0211 = TON 2 s(NOT M.0212), BU-CMD M.0213 = TOF 2 s(M.0212), RB-MV = SI0199 4-way selector (a/b/c/d = A/B/C/J, IF M.021A~D notes = c1~c4).
- SI0198 = (SW 0 / SICL1060x.MV, 1:b = M.0281/M.0291/M.0301/M.0321) summed x 1/4 (app x5 = % of 5 rpm, F-22).
- Group A/B/C: LN34 F(X), SUM + PIC-BASC.MV, DEV <1 %, T N/Y + RATE BYPASS = .MAN, FF S/R, group A walang TONS (drawing: S = AND(<1 %, NOT .MAN), R = .MAN, 1:Y = NOT .MAN) at group B/C may TONS 2 s at AND M.0211 (5): sinusunod ng app ang pagkakaiba ng drawing. A/M 1:A = M.334C/D/E, 1:B = M.0280/0290/0300; BU-CMD OR = cycle sequence (M.331E/M.0286 line) + AND(NOT cycle, NOT M.0281) + AND(NOT cycle, TPS 5 s M.0285); TOF 2 s (M.3340/1/2), SW 12 % / 12 % = 0.6 rpm, DEV -> J/G/H/I.
- Pangalan lang (hindi logic): ang output ng <1 % ay naka-label na M.0294 / M.0304 sa app; sa drawing ay M.0292 / M.0302, at ang M.0294 / M.0304 ay ang output ng TONS. Pareho ang gate, pareho ang behavior.

## ABC-009B  D-BOTTOM ASH SCREW COOLER CONTROL
Blocks on drawing checked: 36   App blocks: 38
### MALI
- [ABC-009B-1] M.331D input ng OR M.0320 (B22 @x452,y250; label @357,284), tile r2c2 | drawing says: OR M.0320 = M.331D (FROM DITL 21D-59) + AND(B.0646, B.066E) + B.0641 + M.331E (6) + NOT M.0321 (5 input) | app does: 4 input lang; ang wire ng M.331D ay pinagsama sa output ng AND(B.0646, B.066E) (B24 OUT = "M.331D#11"), kaya walang DITL input na M.331D. Sinubok: user M.331D = 1 -> net #11 = 0; B.0646 = B.066E = 1 -> #11 = 1 (at kumakalat sa 009A) | effect for the operator: ang manual mode request ng DITL ay hindi nagfo-force manual sa SICL1060D; ang ABC-009A ay nakakakuha ng maling M.331D | suggested fix: hiwalay na net ang M.331D (external DITL input) at ang output ng AND bilang ika-5 input ng OR.
### HINDI MABASA
- (wala)
### TAMA (short)
- SICL1060D: SV A/M T (A = SI0321 AUTO-MV, 1:A = M.334F (S), 1:B = M.0320), MAN PV = AI0769, BU-CMD 1:B = M.0328 = OR((7) M.0286, AND(NOT (6), M.0325), AND(NOT (6), NOT M.0321)), RB-MV = SW 12 %/12 % (1:b M.0325), TOF 2 s -> M.0321 (4), TPS 5 s -> M.0325.
- Bias: HICL1060D -> LN34 -> SI0320 (K) + PIC-BASC.MV -> SI0324; DEV <1 % (+SI0324, -AO0787 = SICL1060D.MV), T 1:Y = AND(NOT .MAN, M.0211 (5)), RATE BYPASS = .MAN, FF S = AND(<1 %, TONS 2 s(NOT .MAN)), R = NOT TONS, T2 1:Y = M.0323; DEV (+SICL1060D.MV, -SI0320) -> J, L -> 009A.
- Pangalan lang: output ng <1 % ay "M.0324" sa app; sa drawing M.0322 (ang M.0324 ay output ng TONS). Pareho ang behavior.

## ABC-010  DRUM LEVEL CONTROL (FEED WATER FLOW CONTROL)
Blocks on drawing checked: ~125   App blocks: 134
### MALI
- [ABC-010-1] PID LICBR1001A "DRUM LEVEL 1 ELEMENT CONTROL -422 ~ 820 mm" (B20 @x634,y371), tile r1c2/r2c2 | drawing says: range -422 ~ 820 mm (span 1242 mm, kapareho ng LICBR1001 at LICBR1001B) | app does: rlo -24, rhi 74, span 98 mm (galing sa parameter workbook row 11: SH 74 / SL -24; pero sa parehong row PH 127 / PL -178 ay labas sa 74 / -24, kaya hindi tugma ang workbook sa sarili nito) | effect for the operator: ang P action ng single-element level control ay ~12.7x mas malakas (100 % MV bawat 118 mm imbes na 1490 mm); tugma sa nakitang pag-uugoy ng main valve 0 ~ 40 % sa v2.2.0 UPDATE_REPORT | suggested fix: span -422 ~ 820 mm ayon sa drawing (source hierarchy 1 > 6); itala sa UNLINK/AUDIT ang kontradiksyon ng workbook.
### HINDI MABASA
- (wala)
### TAMA (short)
- Level compensation: 100 % - AI, SI0251 (LN38) - x, ÷ b/a ng SI0252 (LN39) para sa 3 LT; select (1)/(3)/AVG -> SI0256; H/ / /L ±254 mm (M.0170~M.0175), ABS deviation > 5 % = 62.1 mm (B.0804); drum pressure PRI/SEC/AVG -> SI0156, /L 1.5 -> M.031C.
- Feedwater flow: AI x 1.03, LN30 temp. correction, SQRT, SUMA, AVERAGE -> SI0269; steam flow x 500/550 (F-7), LAG 30 s, SW 1:a = M.022B (OR M.0255, M.3200, M.3220, M.025B), /L 100 T/H -> M.022C -> TON 60 s.
- Interlocks: M.0228 = OR(NOT LICBR1001B.MAN, M.0220, M.022E); M.0220 = OR(AND SIG.AB level, AND SIG.AB pressure, AND(NOT M.3343, NOT M.3344)); M.022E; M.0221; FF M.0222; M.0223 = OR(M.0222, FICFW1007.LOC) at 1:A = NOT FICFW1007.LOC (naka-link sa faceplate); M.0224 = NOT M.0222; M.0227; M.0226; SW a/b 1:b M.0222 sa AO0227. SUM SI0246 + LICBR1001.MV, SUB SI0269 - SI0246 = SI0258. Lahat ng ACT:R.

## ABC-014  FLUIDIZING AIR FLOW CONTROL
Blocks on drawing checked: 40   App blocks: 42
### MALI
- (wala)
### HINDI MABASA
- (wala)
### TAMA (short)
- FICFA1055A / B: PV = FIFA1055.PV mula ABC-006 (parehong PID, naka-link; sinubok), DEV +SV -PV, ACT:R, 0~35 T/H; A/M 1:B = OR(B.0729 mula ABC-006 (flag link, sinubok: SIG.AB 1 -> M.0266 / M.0276 = 1), NOT I.0044/I.008E, NOT I.0043/I.008D, NOT M.3308/M.3309); BU-CMD 1:B = TPS 2 s(NOT running) M.0262 / M.0272, RB-MV 25 %; H/ > 23 % AND /L < 27 % -> M.3115 / M.3116.

## ABC-017  SOOTBLOWER STEAM PRESSURE CONTROL
Blocks on drawing checked: 20   App blocks: 21
### MALI
- (wala)
### HINDI MABASA
- (wala)
### TAMA (short)
- PICSB1052 0~50 kg/cm2, ACT:R, DEV +SV -PV (AI0533); IF M.0104 = 1 SET SV = 18 kg/cm2 (S.pre); TPS 15 s ng S1 M.025B (ABC-013) -> M.0104; A/M 1:A = M.0104, 1:B = M.0101 = AND(NOT M.0104, OR(B.0995, I.024E)); BU-CMD 1:B = TPS 2 s(I.024E) M.0103, RB-MV 0 %; H/ > 11 kg/cm2 M.3231, /L < 1 % M.3235.

## Summary

| sheet | MALI | HINDI MABASA |
|---|---|---|
| ABC-009A | 3 | 0 |
| ABC-009B | 1 | 0 |
| ABC-010 | 1 | 0 |
| ABC-014 | 0 | 0 |
| ABC-017 | 0 | 0 |

---

### Group g5 findings: ABC-011, ABC-012, ABC-015, ABC-016, ABC-057

Paraan: binasa ang bawat block at wire sa PDF (500 dpi crop ayon sa grid ng netlist), ikinumpara sa netlist, at sinubok ang mga hinala sa totoong engine (`tools/engine/node-engine.js`). Mga script / crop: `/tmp/claude-0/-home-user-icms-master-tool/34160028-0fb3-5713-8555-cecfcf1ebe40/scratchpad/g5/`.

## ABC-011  SUPERHEATER NO.2 OUTLET STEAM TEMP. CONTROL
Blocks on drawing checked: 74   App blocks: 74
### MALI
- [ABC-011-1] TICBR1130.LOC / M.0230, ang wire na pumapasok sa A/M T ng TICBR1140 (grid x285 y418) at sa BU-CMD T (x329 y398), tile r1c1/r2c1 | drawing: "1ST DE-S/H SPRAY WATER TEMP. CONTROL NOT IN REMOTE  TICBR1130.LOC" ay isang wire. May tuldok ito sa x≈285 y≈398, at ang sanga na pataas ang may label na M.0230 (memory list 101: M.0230 = "S/H NO.2 OUTLET STEAM TEMP. CONTROL FORCE MANUAL"). Ibig sabihin, M.0230 = TICBR1130.LOC. | app: ang net ay pinangalanang M.0230#15 lang (B13 sel, B14 sel). Ang text na TICBR1130.LOC ay wala sa `addr` at walang sheet na nagda-drive ng M.0230, kaya external input ito na laging 0 (sinubok sa engine: M.0230 = 0). Ang M / A / R ng faceplate ay nagsusulat lang sa net na ang pangalan ay `TICBR1130.LOC` (hmi-op.js MK.LOC, hmi.js modeNetsByTag), kaya hindi ito naaabot. | epekto sa operator: kapag inilagay ang 1st-stage spray TICBR1130 sa A (LOCAL / hindi REMOTE), hindi napupunta sa force-manual ang outlet master TICBR1140, at hindi sinusundan ng MV nito ang TICBR1130.PV (RB-MV). Patuloy nitong binabago ang SV kahit hindi na ginagamit, kaya may talon pagbalik sa R. | fix: itali ang text na TICBR1130.LOC sa net #15 (M.0230), bilang pangalawang pangalan ng net na mababasa ng modeNetsByTag at ng hmi-op MK.LOC.
### HINDI MABASA
- (wala)
### TAMA (short)
- TICBR1130 (ACT:N, DEV + = PV SI0271, − = SV), SV switch: A = SI0274, B = COS, sel M.0234 1:B. A/M sel M.0234 1:B. BU-CMD sel M.0235 1:B → 0 % (PTN009001).
- TICBR1140 (ACT:R, DEV + = SV, − = PV SI0270). FAULT hold switch sel M.0231. A/M at BU-CMD sel M.0230, RB-MV = TICBR1130.PV.
- M.0231 = (M.0237·M.023D + ¬M.0237·M.0236)·TICBR1130.REM. M.0236 = (SI0271 − TICBR1140.MV) > 15 °C.
- M.0234 = OR(M.0235, B.0742·B.0752, B.0741·B.0751, B.0640·B.0689). M.0235 = OR(¬B.0641·M.2001, I.0011·I.0091, I.000F). Tama ang lahat ng cross-sheet link (ABC-010, ABC-001C). Ang I.xxxx ay galing sa DITL world.
- LN42 (drum press → sat. temp) + 15 °C → SI0273. HS ">" kasama ang TICBR1140.MV → SI0274. M.2540 > 380, M.2541 < 350.
- LN47 → AO0225 valve (1), LN46 → AO0353 valve (2). Tugma ang curve sa graph (LN46: 0 → 22.22 %, LN47: 22.22 → 100 %). FF M.0238 / M.023C / M.023D: S = < 0.3 %, R = > 1 % (sinuri ang S/R pin sa engine).

## ABC-012  MAIN STEAM TEMPERATURE CONTROL
Blocks on drawing checked: 77   App blocks: 77
### MALI
- [ABC-012-1] TICBR1150.LOC / M.0240, ang wire na pumapasok sa A/M T ng TICMS1004 (x313 y410) at sa BU-CMD T (x358 y390), tile r1c1/r2c1 | drawing: "2ND DE-S/H SPRAY WATER TEMP. CONTROL NOT IN REMOTE  TICBR1150.LOC". May tuldok at sanga pataas na may label na M.0240 (memory list 101: M.0240 = "MAIN STEAM TEMP. CONTROL FORCE MANUAL"). Kapareho ito ng ABC-011-1. | app: net M.0240#15 lang ang pangalan. Ang text na TICBR1150.LOC ay nasa sheet (x269 y384) pero hindi nakatali sa net. Walang driver, kaya laging 0 (sinubok: M.0240 = 0). | epekto: kapag nasa A (LOCAL) ang 2nd-stage spray TICBR1150, hindi napupunta sa force-manual ang main steam temp master TICMS1004 at hindi ito nagta-track sa TICBR1150.PV. | fix: itali ang TICBR1150.LOC sa net #15 (M.0240).
### HINDI MABASA
- (wala)
### TAMA (short)
- TICBR1150 ACT:N, TICMS1004 ACT:R, at tama ang sign ng DEV. Tama ang SV / A/M / BU-CMD switches (M.0244, M.0245, 0 % PTN009001). FAULT sel M.0241 = (M.0247·M.024D + ¬M.0247·M.0246)·TICBR1150.REM.
- M.0244 = OR(M.0245, B.0643 [direktang input, tama ito], B.0744·B.0754, B.0743·B.0753). M.0245 = OR(¬B.0641·M.2001, I.0013·I.0093, I.000F).
- LN43 input = PIC-COBM.PV = AI0131 (ABC-001C) + 15 °C → SI0283. HS kasama ang TICMS1004.MV.
- SI0280 → ABC-001C "MST" link (umiiral). M.310E > 550, M.310B > 548, M.310C < 525, M.310F < 510, M.2543 > 440, M.2544 < 350.
- LN49 (18 → 100 %) → AO0229 valve (1), LN48 (0 → 22 %) → AO0358 valve (2). Tama ang FF M.0248 / M.024C / M.024D (S = < 0.3 %).

## ABC-015  FURNACE TEMPERATURE CONTROL (1)
Blocks on drawing checked: 12 stations (MAN, A/M T + COS, NOT, AI ×2, SIG.AB ×2, AO, damper) = 144   App blocks: 144
### MALI
- (wala)
### HINDI MABASA
- (wala)
### TAMA (short)
- Ang bawat A/M T: A = AUTO-MV mula sa ABC-057. Ang "1:A" ay mula sa M.144C, at ang "1:B" ay mula sa ⊠ (NOT M.144C). Iisa ang ginagawa sa app (sel = NOT M.144C, 1:B → COS).
- Mapping na sinuri isa-isa: 1005←SI0230(4), 1006←SI0250(15), 1007←SI0231(5), 1008←SI0251(16), 1009←SI0232(6), 1010←SI0252(17), 1011←SI0233(7), 1012←SI0253(18), 1013←SI0234(8), 1014←SI0254(19), 1015←SI0235(9), 1016←SI0255(20). Tugma ito sa LN title (odd = upper, even = lower).
- MAN PV = AI ng ZT. SV = sariling MV. AI0544~0549 / 0550, 0560~0564 at SIG.AB B.1008~B.100D / B.100E, B.1010~B.1014 ay tama. Ang AI na dalawang beses iginuhit (sa itaas at sa positioner) ay iisang value sa engine (sinubok: AI0544 itaas = ibaba = 10 %).

## ABC-016  FURNACE TEMPERATURE CONTROL (2)
Blocks on drawing checked: 10 stations = 120   App blocks: 120
### MALI
- (wala)
### HINDI MABASA
- (wala)
### TAMA (short)
- 1017←SI0236(10), 1018←SI0256(21), 1019←SI0237(11), 1020←SI0257(22), 1021←SI0238(12), 1022←SI0258(23), 1023←SI0239(13), 1024←SI0259(24), 1025←SI0240(14), 1026←SI0260(25). Lahat ay sel = NOT M.144C (1:B → COS).
- PV AI0565, AI0566, AI0416~AI0423, at SIG.AB B.1015, B.1016, B.0970~B.0977 ay tama.

## ABC-057  FURNACE TEMPERATURE CONTROL (3)
Blocks on drawing checked: 80   App blocks: 80
### MALI
- [ABC-057-1] S3 M.144A / S3 M.144B (grid x654 y173 / y111, tile r2c3) | drawing: "FURNACE FRONT / REAR WALL AUTO MODE (CRT)  S3 M.144A" → TPS 3 s TR708, at "... MANUAL MODE (CRT)  S3 M.144B" → TPS 3 s TR709. Ito ang push button ng operator sa CRT (memory list 103: M.144A / M.144B / M.144C = FURNACE FRONT/REAR WALL AUTO MODE(CRT) / MANUAL MODE(CRT) / AUTO MODE SELECTED). | app: ang input ng TPS ay mga net na walang pangalan, n79#79 at n74#74. Nasa sheet ang text na "S3 M.144A" / "S3 M.144B" pero hindi nakatali (wala sa `addr`, walang ibang sheet o HMI na may M.144A/B). | epekto: walang tag o button na mapipindot para piliin ang AUTO, kaya laging 0 ang M.144C at nananatili sa MANUAL (COS) ang lahat ng 22 front / rear wall damper ng ABC-015 / 016. Gumagana ang logic kapag direktang ni-force ang wire (sinubok: n79 = 1 → M.144C = 1, ang HICFA1005 ay sumusunod sa SI0230 = 10 %; n74 = 1 → M.144C = 0). | fix: itali ang "S3 M.144A" sa net #79 at ang "S3 M.144B" sa net #74 (label sa wire), para may AUTO / MANUAL button ang operator sa panel o sa HMI.
### HINDI MABASA
- (wala)
### TAMA (short)
- MW (ABC-001C EIC-TM.PV) → f(t) 15 s → SI0172 (1) at SI0174 (2). Column 1: LN1, 3, …, 21 + SI0170 (4, upper bias) → SI0230~SI0240. Column 2 / 3: LN2, 4, …, 22 + SI0178 (3) + SI0171 (5, lower bias) → SI0250~SI0260. Sinuri ang bawat LN at output number.
- HICFABIASU → LN23 → SI0170, HICFABIASL → LN24 → SI0171 (F-15 settled).
- AI0288 PIFA1085: > 1600 M.3156, < 1500 M.3157, < 1400 M.3158, > 1500 M.3159. M.315A = SIG.AB B.0678. FF M.145A: S = ¬M.315A·M.3156, R = M.315A + M.3157 → T 1:b +5 %. FF M.145B: S = ¬M.315A·M.3158, R = M.315A + M.3159 → −5 %. Σ → ramp 0.1 %/s → SI0178.
- M.311E = B.069B·B.076E (ABC-001C). FF M.144C: S = TPS(M.144A)·¬M.311E, R = TPS(M.144B) + M.311E.
- Paalala lang (hindi logic): ang net #0, ang top input ng column 2 / 3, ay may display label na "S3 SI0171", pero ang value nito ay galing sa SI0178 (link 0←65). Tama ang value. Ang pangalan lang sa Trace ang nakalilito.

## Summary

| sheet | MALI | HINDI MABASA |
|---|---|---|
| ABC-011 | 1 | 0 |
| ABC-012 | 1 | 0 |
| ABC-015 | 0 | 0 |
| ABC-016 | 0 | 0 |
| ABC-057 | 1 | 0 |

---

### Group g6 drawing audit: ABC-019, 020, 026, 027, 028, 029, 030

Paraan: bawat block at wire sa zoom ng PDF (600 dpi, `g6/zoom.py`) laban sa netlist; ang mga duda ay sinubok sa totoong engine (`g6/run.js` + `g6/e*.json`, S.rt.force, stepSet 0.5 s). Read-only, walang binago sa repo.

## ABC-019  REHEATER OUTLET HEADER TEMP. CONTROL
Blocks on drawing checked: 50   App blocks: 56 (kasama ang 5 TXD, 2 COS, ACH)
### MALI
- (wala)
### HINDI MABASA
- (wala)
### TAMA (short)
- TICHR1002 (S2-MDL005, ACT:N, 0~600 °C): DEV SV(−) / PV(+) = SI0100 (PRI/SEC/AVG ng AI0867 / AI0899); SV chain SI0120 (b/020) → LN9 → T (1:B M.0171 → 0) → Σ + SI0205 (a/020) → BUMPLESS 1 %/s (1:BYPASS TICHR1002.LOC) → T (1:A M.0175 = REMOTE, 1:B M.0170 = COS). Sinubok: ang b / a / RHTD na link mula ABC-020 ay tama (SI0120, SI0205, HICHR1002A.MV).
- FF M.0171: S = /L ≤ 10.1 %, R = H/ ≥ 15 % ng HICHR1002A.MV (engine: S = n16 /L, R = n15 H/).
- M.0172 = (SI0110 − LN2(PICR1006)) > 11 °C; PICR1006 T 1:B B.0991 = hawak ang huling halaga. On-page "1" M.0172 → NOT: sinubok, #38 = #8.
- M.0170 = OR(NOT M.0172, M.0173, AND(B.1073,B.1083), AND(B.1072,B.1082)); M.0173 = OR(NOT M.0172, NOT I.0418, I.000F, I.088F); M.0175 = TPS 2 s ng AND(M.2542 [TICR1004.PV > 300 °C, ABC-051], M.311F [ABC-001C], I.0418). A/M T 1:B M.0170 → COS, BU-CMD T 1:B M.0173 → 0 % (PTN009001), AO0578 diretso.
- B.1234 CRT(ANN.) ay annunciation output lang (walang logic consumer).

## ABC-020  REHEATER/SUPERHEATER FLUE GAS DAMPER CONTROL
Blocks on drawing checked: ~120   App blocks: 130
### MALI
- [ABC-020-1] on-page connector "I" (grid x≈835 y≈470 papunta sa x≈575 y≈515; tile r1c3 / r2c3) | drawing says: ang "I" ay HICHR1002B.MV (galing sa output ng MAN HICHR1002B S2-MDL032); pumapasok ito sa DEV (− leg, katapat ng + SI0140) at sa N leg ng tracking T bago ang ramp | app does: net n37 ay walang source (nasa "external inputs", laging 0) — B49 DEV −n37, B51 SW B=n37 | effect for the operator: sinubok: HICHR1002B MAN, MV = 10 → SV/SI0141 = 0 (dapat sumunod sa MV); pagpindot ng A: ang SV ay nagsisimula sa 0 at umaakyat sa 1 %/s (MV 10 → 32 % pagkalipas ng 30 s), ang M.0177 (|SI0140 − MV| < 1 %) ay HINDI kailanman nagse-set, kaya ang SH damper ay hindi bumpless at laging dumadaan sa ramp | suggested fix: i-link ang on-page connector "I" sa HICHR1002B.MV (#24) gaya ng ibang on-page connector ("1" sa ABC-019 ay gumagana).
### HINDI MABASA
- (wala)
### TAMA (short)
- TICHR1002A (S2-MDL006, ACT:R): PV = RHT/019 (SI0100); SV = SI0205 (LN6 ng SI0120) → BUMPLESS 1 %/min (1:BYPASS .LOC) → T 1:B HICHR1002A.MAN = COS. A/M T at BU-CMD T 1:B HICHR1002A.MAN, RB-MV = SI0122 = LN8(HICHR1002A.MV − SI0121); MV low limit TICHR1002A.MLD = 60 % − SI0121; LN7 + SI0121 = SI0130 (AUTO-MV).
- SI0120 = f(t) 100 s ng MWD (ABC-001B); LN3 → SI0121.
- MAN HICHR1002A: A/M 1:B M.0179 = OR(M.3154, TPs 3 s I.000F, AND(B.1073,B.1083) [sinubok: galing ABC-019], HICHR1002B.MAN, M.0178); BU-CMD 1:B M.0178 = OR(M.017B, AND(M.2502, I.000F, M.3103)), RB-MV SI0131 = T(1:a M.017B, 10 % / 10 %); M.017B = OR(TPs 2 s M.3406, TPs 2 s AND(M.250B, M.250C)).
- MAN HICHR1002B: SV T 1:B M.017A; FF M.017A S = AND(TPS 2 s ng NOT .MAN, NOT M.017C), R = M.017C = OR(M.017F, NOT M.3304); FF M.0177 S = AND(<1 %, NOT .MAN), R = .MAN; RATE 1:BYPASS .MAN; final T 1:Y M.0177 → SI0140 (LN5 ng HICHR1002A.MV).
- 8 damper AO (4× HICHR1002A.MV, 4× HICHR1002B.MV); bawat ZT: H/ > 95 % AND /L < 105 % → M.0340 ~ M.0347; AND → M.3440 / M.3441. Letters A~H → H/ ≥ 30 % (11~14) at ≥ 60 % (15~18) → M.0348 ~ M.034F → AND M.0506 / M.0507: sinubok sa engine, tama ang bawat letra at numero.
- Connector "9" (sa SI0120) ay walang katapat sa sheet na ito; walang logic na nawawala sa app.

## ABC-026  FURNACE TEMPERATURE (1)
Blocks on drawing checked: 80   App blocks: 91
### MALI
- (wala)
### HINDI MABASA
- (wala)
### TAMA (short)
- 9 channel (AI0816~0821, AI0848~0850, 0~1200 °C, SIG.AB B.1080~1085, B.1090~1092): T 1:b SIG.AB → 0 sa temperatura, at 1 / 0 sa bilang; Σ temperatura + DI0000 (02/027), Σ bilang + SI0120 (01/027) (sinubok: tama ang dalawang link) → low limit 1 → SI0100 "A" → ÷ (a = Σ temp, b = A) → f(t) 30 s → SI0102, ALM TIFG1091 S3-MDL237; /L < 150 °C M.2501, H/ > 980 °C M.3333, H/ > 950 °C M.3334, /L < 820 °C M.3335.
- Tala (walang epekto): ang "1" sa low limit ay text lang, kaya ang LLIM ng app ay max(bilang) lang. Kapag 0 ang bilang, 0 rin ang Σ temperatura (parehong SIG.AB switch), at ang DIV ng app ay nagbibigay ng 0 = kapareho ng 0 ÷ 1 ng drawing.
- Ang wire ay M.2501, ang output box ay "M.3331 FURNACE TEMP. < 150 °C TO DITL 03E-27": parehong signal, DITL side.

## ABC-027  FURNACE TEMPERATURE (2)
Blocks on drawing checked: 80   App blocks: 89
### MALI
- (wala)
### HINDI MABASA
- (wala)
### TAMA (short)
- 9 channel (AI0832~0837, AI0864~0866, B.1088, B.1089, B.108A~D, B.1098, B.1099, B.109A): pareho ng 026; Σ temperatura = DI0000 → (02/026), bilang → low limit 1 → SI0120 "A" → (01/026) at denominator ng ÷ (sinubok: n96 = n43); f(t) 30 s → SI0122, ALM TIFG1090L S3-MDL239; H/ > 700 °C M.2504 (box M.3339), H/ > 450 °C M.2505 (box M.333A).
- AI0866 dito (S3) ay hindi nakadikit sa AI0866 ng ABC-019 (S2): sinubok, magkahiwalay.
- Parehong tala tungkol sa low limit "1" (walang epekto).

## ABC-028  DIESEL OIL PUMP OUTLET OIL PRESSURE CONTROL
Blocks on drawing checked: 12   App blocks: 14
### MALI
- (wala)
### HINDI MABASA
- (wala)
### TAMA (short)
- PICDO0005 (S5-MDL001, ACT:N, 0~25 kg/cm2): PV(+) AI0181, SV(−) COS (operator SV); A/M T 1:B B.0305 (SIG.AB ng AI0181) → COS; AO0224 = 100 % − PICDO0005.MV → PCV-DO0002.

## ABC-029  OIL RETURN LINE PRESSURE CONTROL
Blocks on drawing checked: 38   App blocks: 42
### MALI
- (wala)
### HINDI MABASA
- (wala)
### TAMA (short)
- PICDO1008 (S1-MDL019, ACT:N): PV(+) AI0514, SV(−) COS; "IF M.025C = 1 SET SV = 11.5 kg/cm2": sinubok, SV = 11.5 kapag M.025C (HOU1/013) = 1. A/M T 1:A M.025C, 1:B M.0408 = OR(B.0722, M.0409); BU-CMD 1:B M.0409 = OR(M.0400 [on-page 1], TPs 2 s AND(4× OR(M.3410/3433, M.3411/3434, M.3416/3463, M.3417/3464))), RB-MV 100 % (PTN009003); AO0212 = 100 − MV.
- MAN HICDO1012 (S1-MDL061): PV AI0276, AUTO-MV / SV = connector 2 = HICDO1012.MV (sinubok: #3 = #4); A/M 1:B M.0001 FORCE MANUAL; BU-CMD 1:B M.0401 = OR(M.0400 = TPs 3 s I.000F, M.025C), RB-MV SI0300 = T(1:a M.025C → 100 %, b 0 %); AO0324 = 100 − MV.

## ABC-030  MAIN STEAM / COLD REHEAT TO AUX. STEAM PRESSURE CONTROL
Blocks on drawing checked: 50   App blocks: 56
### MALI
- (wala)
### HINDI MABASA
- (wala)
### TAMA (short)
- PV SI0270 = PRI/SEC/AVG ng AI0514 / AI0515 sa dalawang PID (ACT:R, SV + / PV −). PICAS1004: "IF M.0124 = 1 SET SV = 9.5 kg/cm2" (sinubok, SV = 9.5); A/M 1:B M.0120 = AND(B.098A, B.098B), 1:A M.0124 (02/050); BU-CMD 1:B M.0124 → 30 %; AO0580 diretso; /L < 2 % → M.012E (02/033), FF M.0128 S = H/ > 4 %, R = /L < 3 % → (01/033) (sinubok: ABC-033 tumatanggap ng dalawa).
- PICAS1005: A/M 1:B M.012A = OR(M.0120, M.0129); BU-CMD 1:B M.0129 = OR(M.0124, M.2541, M.2540) → 0 % (PTN009001); FF M.2541 S /L < 230 °C, R H/ > 235 °C (TICR1004.PV); FF M.2540 S /L < 9.5, R H/ > 11.5 kg/cm2 (PICR1003.PV, ABC-051); LN16 → 100 − → AO0614 (PCV-AS1002-2), LN17 → 100 − → AO0581 (PCV-AS1002-1). AI0387 (ZT-AS1010) ay walang output wire sa drawing rin.

## Summary
| sheet | MALI | HINDI MABASA |
|---|---|---|
| ABC-019 | 0 | 0 |
| ABC-020 | 1 | 0 |
| ABC-026 | 0 | 0 |
| ABC-027 | 0 | 0 |
| ABC-028 | 0 | 0 |
| ABC-029 | 0 | 0 |
| ABC-030 | 0 | 0 |

---

### Group g7 audit: ABC-031 ~ ABC-037 (drawing PDF vs app netlist)

Paraan: binasa ang bawat netlist line laban sa tile / overview at sa mga zoom (500 dpi) ng mga bahaging may logic (gates, switches, SET note). Legend ABC-000: kahon na may ekis = NOT, patag na gate na may maliit na kahon = AND, gate na may bilog = OR. Engine (Node) ay pinatakbo para sa tatlong bagay lang: S.pre (SET SV rules) ng 7 sheet, ABC-034 feed-forward / MV loop, at ABC-035 shared SV net.

## ABC-031  Condenser dumping to raw pit / make-up / deaerator storage tank level control
Blocks on drawing checked: 58 (lahat ng logic block; TXD/ACH/VLV kasama)   App blocks: 64
### MALI
- wala
### HINDI MABASA
- wala
### TAMA (short)
- LICCD1110B (S2-MDL011, ACT:N): DEV +PV(AI0640) -SV; H/ >150 mm = S, /L <50 mm = R -> FF M.0164 -> T (1:b) 100 % / 0 % = SI0282 (EX-MV); upper T 1:B EX-CMD = M.0165; lower A/M 1:A = M.0166 (TPS 2 s TR195), 1:B = B.1008; output 100 % - MV -> AO0402.
- M.0165 = AND( NOT I.000F (MFT, from DITL 03A-63), NOT B.1008 ) (zoom: dalawang ekis-kahon = NOT, legend ABC-000).
- LICCD1110A (S2-MDL010, ACT:R): DEV +SV -PV(AI0640); A/M 1:B = B.1008; 100 % - MV -> AO0576. M.3211 = AI0640 < -300 mm.
- LICCD1104 (S2-MDL004, ACT:R): AVERAGE SELECT ng AI0672 / AI0848 / AI0928; DEV +SV -PV; A/M 1:B = M.0160 = AND(B.1010, B.1068, B.1090); direct sa AO0579. M.0161 >300, M.0162 >200, M.0163 <-500, M.3208 <-2174 mm. Ang label na "SI0202" sa output ng average ay hindi naka-pangalan sa app pero walang ibang gumagamit nito sa S2 (pareho ang kilos).

## ABC-032  Condensate water flow / condensate polisher inlet water flow control
Blocks on drawing checked: 44   App blocks: 44
### MALI
- wala
### HINDI MABASA
- wala
### TAMA (short)
- FICCD1120 (S2-MDL012, ACT:R, 0~400 T/H): PV = SQRT(AI0437) (identity, V-18), SUMA FIQCD1120 S2-MDL087, A/M 1:B = B.0975, 100 % - MV -> AO0401.
- Polisher SV chain: FIQCD1120.PV x (SCALE CONVERT 400/200, real units = x1, F-7) / 2 (F-4 settled) -> T (1:B = I.0255 polisher inlet valve open; A = 0) = SI0230 -> BUMPLESS RAMP 1 %/s PTN003021 (1:BYPASS = FICCD1121.LOC) = SI0231 -> SV T (A = SI0231 remote, B = COS, 1:B = B.0974).
- FICCD1121 (S2-MDL013, ACT:N, 0~200 T/H): A/M 1:B = B.0974; BU-CMD T 1:B = M.0220 = OR(B.0974, NOT I.0255), RB-MV = 100 % (PTN009003); 100 % - MV -> AO0400.

## ABC-033  Main steam to aux. steam DE-S/H spray water temp. control
Blocks on drawing checked: 22   App blocks: 22
### MALI
- wala
### HINDI MABASA
- wala
### TAMA (short)
- TICAS1001 (S2-MDL014, ACT:N, 0~600 °C): DEV +PV(AI0641) -SV; A/M 1:B = M.0139 = OR(B.1009, M.012F), 1:A = M.012B; BU-CMD 1:B = M.0127 = OR(M.012F, M.0124); RB-MV SI0276 = T(1:a M.0124 -> 80 % "4.436 T/H") else T(1:a M.012F -> 0 %) else MV (hold). Zoom ng mga wire: kaliwang T (80 %) mula sa M.0124, kanang T (0 %) mula sa M.012F.
- M.012B = TPS 2 s (TR194) ng OR(M.0128 from ABC-030, M.0124 from ABC-050); M.012F = TPS 2 s (TR352) ng M.012E from ABC-030.
- "IF M.012B = 1 SET SV = 350 °C": nasa app bilang S.pre (target = SV input ng DEV, cond M.012B, value 350) - napatunayan sa engine (hindi lumalabas sa "SET / IF rules" ng netlist dump dahil S.sets lang ang ini-print doon).

## ABC-034  Gland steam DE-S/H spray water temp. control
Blocks on drawing checked: 33   App blocks: 33
### MALI
- wala
### HINDI MABASA
- wala
### TAMA (short)
- Feed-forward: F(X) LN18 (AI0886) + F(X) LN19 (AI0757) = SI0246; AI0642 -> RATE 1 %/min (= 6 °C/min of 0~600) = SI0244 -> F(X) LN20 = SI0245; SI0245 x SI0246, x 0.8 = SI0247 -> F(X) LN21 = SI0248.
- TICAS1017 (S2-MDL015, ACT:N, 0~300 °C): DEV +PV(AI0902) -SV; PID + (MV - SI0248) -> + SI0248 (OMV) -> A/M (1:B = B.1086) -> AO0612 direct. Engine run: MV umaakyat nang tuloy-tuloy habang may error at bumababa ang temperatura (velocity-type na loop, gaya ng drawing).
- B.100A / B.107E / B.103D SIG.AB: walang gumagamit sa drawing ng sheet na ito (at sa S2), kaya walang link na kulang.

## ABC-035  No.1 HPH level control
Blocks on drawing checked: 48   App blocks: 48
### MALI
- wala
### HINDI MABASA
- wala
### TAMA (short)
- PRI/SEC/AVG select ng AI0676 / AI0852 = SI0210 = PV ng dalawang PID; parehong DEV ay -SV +PV at iisang SV: LICHD11051.SV (engine: net 17 ang ginagamit ng dalawang DEV).
- LICHD11051 (S2-MDL016, ACT:N): A/M 1:B = M.0191 = AND(B.1014, B.106C); MV -> F(X) LN38 -> 100 % - -> AO0467; MV -> F(X) LN39 = SI0290 (7).
- LICHD11052 (S2-MDL017, ACT:N): EX-CMD 1:B = M.0196 = NOT LICHD11051.MAN, EX-MV = SI0290; A/M 1:B = LICHD11051.MAN, 1:A = NOT LICHD11051.MAN; 100 % - MV -> AO0483.
- Comparators >140 / >40 / <-40 mm (M.2510 ~ M.2515); M.0193 = 2-out-of-3 (M.2510, M.2513, I.029E); M.0194 = OR(M.2511, M.2514); M.0195 = OR(M.2512, M.2515).

## ABC-036  No.2 HPH level control
Blocks on drawing checked: 48   App blocks: 48
### MALI
- wala
### HINDI MABASA
- wala
### TAMA (short)
- Kapareho ng ABC-035 na istruktura: AI0677 / AI0853 -> SI0211; LICHD11061 (S2-MDL018) / LICHD11062 (S2-MDL019); M.0201 = AND(B.1015, B.106D); M.0206 = NOT LICHD11061.MAN; LN38 / LN39 = SI0300; M.2516 ~ M.251B; M.0203 2oo3 with I.029F; M.0204, M.0205; AO0468 / AO0484.

## ABC-037  No.1 LPH level control
Blocks on drawing checked: 48   App blocks: 48
### MALI
- wala
### HINDI MABASA
- wala
### TAMA (short)
- Kapareho ng ABC-035: AI0673 / AI0849 -> SI0212; range -320 ~ 290 mm; LICHD11011 (S2-MDL020) / LICHD11012 (S2-MDL021); M.0181 = AND(B.1011, B.1069); M.0186 = NOT LICHD11011.MAN; LN38 / LN39 = SI0310; M.2520 ~ M.2525; M.0183 2oo3 with I.029B; M.0184, M.0185; AO0464 / AO0480.

## Summary
| sheet | MALI count | HINDI MABASA count |
|---|---|---|
| ABC-031 | 0 | 0 |
| ABC-032 | 0 | 0 |
| ABC-033 | 0 | 0 |
| ABC-034 | 0 | 0 |
| ABC-035 | 0 | 0 |
| ABC-036 | 0 | 0 |
| ABC-037 | 0 | 0 |

---

### Group g8 findings (ABC-038 ABC-039 ABC-050 ~ ABC-056)

Method: every sheet was zoomed region by region from the PDF (500 dpi crops, same x/y grid as the netlist) and compared block by block with the netlist. Doubtful points were run in the real engine (tools/engine/node-engine.js): connector LINKs, S.pre SET rules, FF S/R order, ramp rates, the low-limit / "<" blocks. PID/PIDV tuning (P, I, D, PH/PL, range) was checked against summary-of-pid-pidv-suma-man-parameters.xlsx: all 12 controllers match.

## ABC-038  NO.2 LPH LEVEL CONTROL
Blocks on drawing checked: 48   App blocks: 48
### MALI
- (none)
### HINDI MABASA
- (none)
### TAMA (short)
- AI0674 / AI0850 (-315 ~ 295 mm), PRI/SEC/AVG -> SI0213 = PV of both PIDs; one SV LICHD11021.SV feeds both DEVs (drawn as one line to both). Comparators >140 / >40 / <-40 mm -> M.2526..252B; M.0213 = (2526&2529)|(2529&I.029C)|(2526&I.029C), M.0214, M.0215 as drawn.
- LICHD11021 A/M: 1:B M.0211 = B.1012 & B.106A. LN38 -> 100 - F(MV) -> AO0465. LN39(LICHD11021.MV) = SI0320 -> EX-MV of LICHD11022 (1:B M.0216 = NOT LICHD11021.MAN, "⊠" = NOT per legend ABC-000); LICHD11022 A/M 1:B LICHD11021.MAN, 1:A NOT MAN; 100 - MV -> AO0481. Tuning S2-MDL022/023 = workbook.

## ABC-039  NO.3 LPH LEVEL CONTROL
Blocks on drawing checked: 48   App blocks: 48
### MALI
- (none)
### HINDI MABASA
- (none)
### TAMA (short)
- Same structure as ABC-038 with AI0675 / AI0851 (-310 ~ 300 mm), SI0214, M.2530..2535, M.0231/0233..0236, I.029D, SI0330, LN38 / LN39 (drawing uses LN38/LN39 here too). Tuning S2-MDL024 (Ti 600) / 025 (Ti 270) = workbook.

## ABC-050  HP TURBINE BYPASS STEAM PRESSURE CONTROL
Blocks on drawing checked: ~120   App blocks: 120
### MALI
- (none)
### HINDI MABASA
- (none)
### TAMA (short)
- SV chain: 60.2 / 80.3 / 109 kg/cm2 (COLD / WARM I.0413 / HOT I.0414), 1:B I.0418 | M.0686 (6 x ICV/IV > 80 %) -> SI0151 = SI0150 + 2; BUMPLESS 1 %/s of 0 ~ 150 (bypass PICMS1006.LOC); SV switch 1:A M.070D, 1:B M.0703. "IF M.0704 = 1 SET SV = 109" is in S.pre (engine run: turbine trip -> SV 109 during the M.0704 pulse).
- Interlocks: M.0124 = TPS5(I.0400|I.0937|I.0932); M.0700 = TPS5(I.0932 & NOT I.0400); M.0701 = TPS10(M.0124); M.0702 = TON15(NOT M.3343 & NOT M.3344); M.0703 = (B.0968&B.0988)|M.0702; M.0704 = TPS5(M.0708)|M.0124; M.0705 = M.0706|I.041F|M.0124|M.0702|I.041E; M.0706 = M.0708 & MV <= MLD; M.0708 = I.000F & M.3103; M.070C >= 2 %, M.070D = TPS2((I.0418|M.070C) & I.0931), M.070E FF (S M.070D, R M.071C MV <= 0 %); M.0713 TON1; ramp 5 %/s bypassed by NOT M.070E; M.0707 FF S > 4 % R < 3 % (engine run confirmed S/R); M.0709 > 5 %, M.071A > 0 %, M.071E < 2 %.
- RB-MV chain (MLD / 0 % / 0 % / 100 % with M.0706 / M.0702 / M.0124 / O.0844) and LN31; MLD = 12 % on M.0708 (engine run: MFT + cyclone > 535 C -> MV held at 12 %); max flow 140 / 160 T/H on M.0700, house load 45 T/H on I.0400|I.0932, x1.21 -> LN32 -> LP bypass SW (1:a M.012D 100 %); TPh time X = SI0169 (3 s / 1.5 s on I.0937); SI0161 = SI0158 - SI0159 -> BOF/013. All connectors (1..9, 05/051, MSF/001C) resolve to the right nets.

## ABC-051  HP TURBINE BYPASS STEAM SPRAY WATER TEMP. CONTROL
Blocks on drawing checked: ~67   App blocks: 67
### MALI
- [ABC-051-1] BUMPLESS ramp PTN003009 "RAMP:1.67 % / min" (SI0173 -> SI0174, grid x500 y498, tile r1c2) | drawing says: 1.67 %/min of the temperature set point signal (SI0173 = HS of SI0171 °C and LN10 output, LN10 Y range 0 ~ 600 °C; destination TICMS1022 0 ~ 600 °C) = 10 °C/min | app does: span taken from "upstream AI#13 0~50 kg/cm2" (PICR1003 pressure, before the LN10 pressure->temperature table), rate 0.0139 /s = 0.83 °C/min (netlist B24; engine run: SV moved 220 -> 220.8 °C in 60 s after I.0418 = 1, target 300 °C) | effect for the operator: the HP bypass spray temperature SV takes about 96 min instead of about 8 min to go from 220 to 300 °C; the TICMS1022 SV lags far behind the start-up mode set point | suggested fix: take the ramp span from the downstream PID (0 ~ 600 °C), as on ABC-050 / 052 / 053, i.e. do not pass a span through an F(X) whose unit changes.
### HINDI MABASA
- (none)
### TAMA (short)
- SV chain 220 / 220 / 220 °C (COLD / WARM I.0413 / HOT I.0414), 1:A I.0418 -> 300 °C, HS with LN10(PICR1003.PV) -> SI0173; bypass of ramp = TICMS1022.LOC (net named by AN.nm). SV switch 1:B M.0715; "IF M.0716 = 1 SET SI0176 => TICMS1022.SV" with SI0176 = HS(LN10, I.0400 ? 300 : 220).
- M.0715 = (B.1071 & B.1081) | M.070A; M.070A = TPS2(M.071E/050); M.0716 = TPS2(M.0707/050) | M.0124; M.0174 = M.070A | M.0124 | M.0702; RB-MV: 1:a M.012C (05/050 = O.0844 net) 100 %, 1:a M.070A 0 %, else LN33(PICMS1006.MV) x (I.0400 ? 0.5 : 1.0). M.0717 = (SI0160 - LN13(SI0207)) < 11 °C, AND M.071A -> B.1233. B.1006 hold switch. Tuning S2-MDL003 = workbook.

## ABC-052  LP TURBINE BYPASS STEAM CONTROL
Blocks on drawing checked: ~142   App blocks: 142
### MALI
- (none)
### HINDI MABASA
- [ABC-052-H1] Ramp block between SI0225 (LN11 of PICHR1003.DV) and SI0224 (grid x555 y433, tile r1c2): the drawing writes only "Ramp X% / sec" with no value and no "SET X" source (unlike ABC-050 TPh "SET X (TIME)" = SI0169). The app has rate 0 = no limit ("NO RATE", netlist B87), so EX-MV SI0224 follows LN11 instantly while M.070F = 1. The X value is not on the sheet.
### TAMA (short)
- PV: SI0252/0253 = AI0421/AI0513 + 0.6 kg/cm2 -> PRI/SEC/AVG SI0180. SV: AVERAGE(AI0883/0884/0885) -> LN12 + LAG 3 s of (M.008A: PICMS1006.MV < 3 % ? 5.1 : 0) -> HS with 7.6 -> BUMPLESS 1 %/s of 0 ~ 50 (PICHR1003.LOC) -> SV switch 1:A M.070D (06/050), 1:B M.0723.
- SET rules in S.pre: M.0124 -> SI0196 (I.0400 ? SI0183 hold : 13.5); M.0136 -> SI0199 (7.5 on M.0134, else SV, ramp 2 kg/cm2/min bypassed by NOT M.0135); M.072B -> SI0254 (136.5 / 173.5 °C on I.0937). M.0136 = NOT M.0138 & TPS190(M.0134) & M.0137 & NOT REM & LOC & NOT MAN; timers 118 / 120 / 190 / 320 s as drawn.
- M.0727 2oo3 condenser switches; M.0729 = M.0727 | TON15(I.0892 & M.0721) | TON10(no CP) | TON10(no SWP); M.0722, M.0723, M.0726, M.072B, M.072C, M.070B = TPS2(M.071F < 2 %), M.070F FF (S M.070D, R M.071D <= 0 %), M.072A FF (> 4 % / < 3 %), M.0714 TON1, RB chains (LPB/050 SI0163, 0 / 100 % on M.012D / 0 % on M.070B, LN34). Tuning S2-MDL026/027 = workbook.

## ABC-053  TURBINE OIL COOLER OUTLET OIL TEMP. CONTROL
Blocks on drawing checked: 46   App blocks: 46
### MALI
- (none)
### HINDI MABASA
- (none)
### TAMA (short)
- SV: LAG 2 s of AI0534 (turbine speed) -> LN22, 1:A I.0931 -> 46 °C, 1:A I.0417 -> 38 °C, high limit 46 °C, BUMPLESS 0.5 %/s of 0 ~ 100 °C (TICLO1002.LOC). M.0132 FF S > 45 °C R < 40 °C (engine run: latched at 43, reset at 39) -> MLD 20 % else 0 %; MV low limit MLD; the "<" box feeding the AND is compiled as the comparator MV < MLD (cmp), not a min-select, so M.0133 = MV < MLD & NOT TICLO1002.MAN -> EX-CMD = MLD. A/M and SV switch 1:B M.0131 = B.097C & B.098C; AO = 100 - MV. Tuning S2-MDL028 = workbook.

## ABC-054  HOT REHEAT STEAM PRESSURE CONTROL (BLOW-OFF)
Blocks on drawing checked: 18   App blocks: 18
### MALI
- [ABC-054-1] PV of PICHR1391 (connector "HRP / 052  S2 SI0180" -> STN102017 -> DEV +PV, grid x411 y660, tile r1c2) | drawing says: the PV is the hot reheat steam pressure SI0180 of ABC-052 (the PRI/SEC/AVG of AI0421 / AI0513 + 0.6) | app does: the reader finds no connector on this sheet (S.conn empty, no xlk); DEV input n21 "STN102017" stays an external input. It is tied to ABC-052 SI0180 only by the unit model alink (src/analog/engine/unit.js about line 330), i.e. only while the unit model runs (Start cold / warm); in plain RUN the PV is a separate loop-model value | effect for the operator: with the unit model off, PICHR1391 PV is not the PICHR1003 hot reheat pressure; raising RH pressure on ABC-052 does not move the blow-off controller | suggested fix: read the "HRP / 052" pill as a cross-sheet link (ABC-052 SI0180 -> ABC-054 STN102017), as done for MSF/001C and DP/010.
### HINDI MABASA
- (none)
### TAMA (short)
- M.0333 = TPs5((I.0400 | I.000F) & M.3216); M.0330 = M.0333 & NOT M.320A; M.320A = B.096D & B.0989 (from ABC-052, linked); "IF S1 M.0330 = 1 SET SV = 35.5 kg/cm2" in S.pre; A/M 1:A M.0330, 1:B M.320A; PIDV MVA = S2 AI0737 (ZT-HR1391); PO -> MCC. Tuning S1-MDL046 = workbook (P 500).

## ABC-055  NO.1 S/H OUTLET HEADER TO REHEATER MOTOR VALVE POSITION CONTROL
Blocks on drawing checked: 41   App blocks: 41
### MALI
- (none)
### HINDI MABASA
- (none)
### TAMA (short)
- DP/010 SI0156 (linked from ABC-010) -> DROP RATE (X/MIN) -> SI0155 -> FF S > 5 R < 4.7 kg/cm2 -> M.0314. M.0315 = TON2(I.000F) & M.254F & NOT M.3302 & M.321C & NOT M.3407; M.0316/0317/0318 TPs 2 s; M.0319 FF (S M.0316 & NOT B.065D, R M.0318); M.031A, M.031B; M.0310 = OR -> A/M 1:A, 1:B B.065D. SET SV 20 / 25 / 0 % on M.0319 / M.031A / M.031B in S.pre. DEV = SV - PV (SV +, ACT:R). BU-CMD contact M.000A FF (S NOT I.000F, R M.031C | (I.000F & NOT M.3304)). Tuning S1-MDL071 = workbook (GAP 2.5).

## ABC-056  DEAERATOR PRESSURE CONTROL
Blocks on drawing checked: 21   App blocks: 21
### MALI
- (none)
### HINDI MABASA
- (none)
### TAMA (short)
- DEV SV - PV (ACT:R); A/M 1:B B.0969, 1:A M.0124 (02/050); "IF M.0124 = 1 SET SV = 3.5 kg/cm2" in S.pre; BU-CMD M.0124 -> SI0048 100 %. SI0220 = AI0562 x SCALE CONVERT 5/10 (real units kept, engine run: 4 kg/cm2 in = 4 out) - AI0417 -> > 0 kg/cm2 -> M.025F. Tuning S2-MDL009 = workbook.

## Summary

| Sheet | MALI | HINDI MABASA |
|---|---|---|
| ABC-038 | 0 | 0 |
| ABC-039 | 0 | 0 |
| ABC-050 | 0 | 0 |
| ABC-051 | 1 | 0 |
| ABC-052 | 0 | 1 |
| ABC-053 | 0 | 0 |
| ABC-054 | 1 | 0 |
| ABC-055 | 0 | 0 |
| ABC-056 | 0 | 0 |
| Total | 2 | 1 |
