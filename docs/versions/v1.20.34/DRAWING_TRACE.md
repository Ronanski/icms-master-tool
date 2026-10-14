# Trace sa drawing ng mga pagbabago sa engine (v1.20.34)

Ayon sa CLAUDE.md: bago baguhin ang engine, i-trace ang drawing (input, mga block sa gitna, output, cross-sheet). Ginawa ito pagkatapos ng pagbabago (mali ang pagkakasunod); ang resulta ay nasa ibaba. Pinagmulan: `document-references/analog-logic-abc.zip` (PDF ng bawat sheet) at `analog logic symbols legend.pdf`.

## 1. PID sumusunod sa manual value sa chain ng selector (ABC-007 FICFA1081)
- **Nasa drawing (ABC-007, SAF loop):** SA FLOW (SAF 006) -> deviation (SV +, PV -) -> PID FICFA1081 S1-MDL024 (ACT:R) -> T switch na may "1:B" at "FAULT" (kapag may fault, hawak ang huling value: bumabalik ang output nito sa sarili nitong B input) -> T switch na may COS at "A/M" (1:A, 1:B galing M.0190 at M.019C) -> AO.
- **Legend (ABC-000):** ang "AUTO/MANUAL SWITCH FOR PID CONTROLLER & MANUAL CONTROL STATION" ay ang T na may COS, at ang "INTERLOCK TRACKING FOR PID CONTROLLER & MANUAL CONTROL STATION" ay ang T/diamond na may "1:B". Ibig sabihin, kapag manual ang A/M switch, ang PID ay sumusunod sa output (walang talon pagbalik sa AUTO).
- **Dati sa simulator:** sumusunod lang ang PID kung ang A/M switch ay direktang kasunod ng PID. Sa ABC-007 ay may FAULT switch sa gitna, kaya hindi sumunod ang PID (MV = 0 habang manual 37; talon pagbalik sa AUTO). 9 PID ang ganito (ABC-007, 031, 035 ~ 039, 052, 053).
- **Konklusyon:** tugma ang fix (sumusunod ang PID sa output ng selector sa dulo ng chain) sa legend at sa drawing.

## 2. Maling 2 s pulse pagkabukas ng page (ABC-013 PICMS1002, TR86)
- **Nasa drawing (ABC-013):** "M.0254 (MAIN STEAM PRESSURE > 134 kg/cm2, galing ABC-001C)" -> TPS TR86 (pulse 2 s) -> M.0256, at ang inverse nito na M.0252 ay ang "1:A" ng A/M switch ng PICMS1002 at ang "IF M.0252 = 1 SET SI0361 => PICMS1002.SV". Ang pulse ay lalabas lang kapag lumampas ang main steam pressure sa 134 kg/cm2.
- **Sa simulator:** sa startup ang pressure ay 75 (mas mababa sa 134), kaya hindi dapat may pulse. Pero tumunog ang TR86 pagkabukas ng page dahil ang halaga galing ABC-001C ay hindi pa kumpleto sa unang step (pagkakasunod ng pag-initialize ng mga sheet).
- **Konklusyon:** ayon sa drawing, walang pulse sa startup na may 75 kg/cm2. Tugma ang fix (kunin muna ang halaga ng pinagmulang sheet bago mag-settle).

## 3. Reset
- Walang espesyal na drawing: ang Reset ay dapat magbalik sa parehong simula ng bagong bukas na page (rule ng user). Nasukat na pareho (51 sa 51 sheet).

## Tuntunin mula ngayon
Bawat pagbabago sa engine ay may nakasulat na trace ng drawing (sheet, tag, block, legend) BAGO ang pagbabago, sa `docs/versions/<version>/DRAWING_TRACE.md`.

## 4. Minimum air flow "32 %" (ABC-002) - Excel finding 11
- **Nasa drawing (ABC-002, PDF):** ang constant na "32 % MIN. AIR FLOW" ay pumapasok sa isang HIGH SELECT (">") kasama ang SI0021; ang output ay SI0036 "TAF DEMAND". Ang mga SCALE CONVERT constant ng sheet ay 648 / 1115 (PAF), 432 / 1115 (SAF) at 35 / 1115 (FA): 648 + 432 + 35 = 1115. Kaya ang TOTAL AIR FLOW scale ay 0 ~ 1115 T/H at ang 32 % ay 0.32 x 1115 = **356.8 T/H**.
- **Dati sa simulator:** 400 T/H ang default (walang batayan sa drawing) kaya 128 T/H.
- **Ngayon:** 1115 T/H; 356.8 T/H. May UAT na (expected galing sa mga constant ng sheet).
- **Babala:** ang 356.8 T/H ay 59 % ng design base na 606 T/H ng planta. Ito ang resulta ng aritmetika ng drawing; kung may ibang basehan ng 32 % (halimbawa MCR), sabihin lang ng user.

## 5. Range sa tabi ng input (Excel findings 4 at 17)
- **Nasa drawing:** halimbawa ABC-005 "RANGE : 0.01 ~ 9.99 %", "RANGE : 1.1 ~ 1.5", ABC-011 "0 ~ 600 degC", ABC-017 "0.0 ~ 50.0 kg/cm2".
- **Dati:** 34 sa 200 na analog input ay may range na nakasulat pero hindi pinipilit ng simulator. **Ngayon:** 23 pa ang nasama (ang range text ay iniuugnay sa pinakamalapit na external input, hanggang 60 units); 14 ang nananatiling hindi iniuugnay (tingnan ang EXCEL_FINDINGS_STATUS).

## 6. Select circuit (Excel finding 16)
- **Legend (ABC-000):** AVERAGE SELECT CIRCUIT Y = (A + B + C) / 3; PRIMARY / SECONDARY / AVERAGE SELECT CIRCUIT. Ang SIG.AB ay nakasulat sa bawat transmitter.
- **Utos ng user:** ang input na zero ay lost signal: hindi na ina-average, ang primary / secondary ay lumilipat sa healthy; ang path nito ay hindi na iilaw. Ito ang ipinatupad (hindi ito nakasulat sa drawing; ito ang kahulugan na ibinigay ng user).
