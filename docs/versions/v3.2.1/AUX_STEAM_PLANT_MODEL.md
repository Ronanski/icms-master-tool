# Plant model: page 08 AUX STEAM AND VACUUM, mga value (3.2.1-beta.23)

Ang page 08 (JISOO, beta.20) ay may 14 value na '-----' dahil walang ABC / DITL sheet na bumabasa sa mga ito (TCS tag o DCS AI na
display lang). Galing na ang mga ito sa plant model: `src/analog/engine/unit.js` anAsTagStep → `AN.unit.tt`, binabasa ng page sa
`def.unit[TAG] = 'tt:TAG'` (`tools/hmi-mock/p08-head.js`).

## Sources
- **TCS IO list** (`document-references/iolist-tcs.zip`, HMI_AI - 06092016.xls): PTST11101 ~ 3 "LP TURBINE EXHAUST HOOD STEAM PRESS.
  (CONDENSER VACUUM) (A / B / C)" kg/cm2 abs; TEST11101 ~ 3 "LP TURBINE EXHAUST HOOD STEAM TEMP." 0 ~ 150 °C; PTGS10011 / 2 "GLAND STEAM
  SEAL HEADER PRESS." -1 ~ 2 kg/cm2g; TEGS1002 "GLAND STEAM SEAL HEADER TEMP."; TEGS1003 "GLAND STEAM SEAL LP INLET TEMP."; ZTGS1034
  "STEAM PACKING UNLOADING VALVE POSITION"; ZTAS1011 / MVAS1011 "HP TURBINE WARMING VALVE POSITION".
- **DCS IO list**: STN102 AI0643 TT-AS1015 gland steam desuperheater outlet; AI0706 / AI0720 ZT-AS1020-1 / -2.
- **ABC-030**: PIC-AS1005 MV → F(X) LN17 (valve 1) at LN16 (valve 2).
- **29.PNG** (151 MW): condenser 0.056 / 0.053 / 0.053 kg/cm2A, hood 38 / 38 / 37 °C, PCV-AS1020-1 / -2 0.1 / 32.2 % (MV 4.2), gland
  header 0.32 / 0.32 kg/cm2, TEGS1002 / 1003 364 / 362 °C, TT-AS1015 257 °C, TT-AS1003 236 °C, PV-GS1034 42.6 %. 4.PNG MV-AS1011 0.0 %.
- **PR-OPE-5002** GLAND SEALING: TIAS1015 220 °C (cold 150 ~ 260); HP TURBINE WARMING: binubuksan ng TCS ang MV-AS1011 sa 40 ~ 42 %,
  sinasara sa dulo.

## Paano gumagana
- **PTST11101 ~ 3** = PT-CD1110 ng model (condenser `U.cdP`). Iisang value ang tatlo: walang dokumento ng pagkakaiba ng transmitter.
- **TEST11101 ~ 3** = LP exhaust hood. Sa start-up (TCS model `c.Tx`): dati na ang windage at hood spray. Bago: kapag may load,
  ang hood ay wet steam sa saturation ng condenser (29.PNG 38 °C sa 0.056). ASSUMED: mula sa windage value sa 7.5 MW hanggang
  saturation sa 22.5 MW (15 % load, PR-OPE-5002 9195), linear; walang binago sa ilalim ng 7.5 MW (ang hold < 80 °C at < 52 °C bago load
  up ay pareho). Walang TCS model (Start at 150 MW): saturation ng condenser.
- **ZT-AS1020-1 / -2** = F(X) ng PIC-AS1005 MV (hawak ng airlock kapag walang hangin, AN_AV). MV 4.2 → 0.0 / 32.3 % (29.PNG 0.1 / 32.2).
- **Gland steam header** (in service = TCS gland sealing, o turbine na may load): 0.32 kg/cm2 = 29.PNG (CALIBRATED: wala sa docs ang SV
  ng TCS steam seal controller); out of service 0.
- **TT-AS1015, TEGS1002 / 1003, PV-GS1034** (ASSUMED ang hugis, walang load curve sa docs): sa walang load galing sa aux steam header
  (TT-AS1015 = TT-AS1003), sa 150 MW self-sealing (29.PNG); linear sa load: TT-AS1015 + 21 °C, TEGS1002 = TT-AS1015 + 107 °C,
  TEGS1003 = TEGS1002 − 2, PV-GS1034 42.6 %. Sumusunod ang temperatura sa 300 s.
- **MV-AS1011** = 40 % habang nasa HP TURBINE WARMING ang TCS (step 0), 0 sa iba.

## Resulta (cloud test `tests/regress/as_page_values.js`, 150 MW)
- 0.062 kg/cm2A × 3, 37 °C × 3 (condenser ng model; ang 36.6 vs 40 °C ay nasa `CONDENSATE_PLANT_MODEL.md`).
- PCV-AS1020-1 / -2 0.0 / 32.3 %; TT-AS1015 257 °C; gland 0.32 kg/cm2, 364 / 362 °C; PV-GS1034 42.6 %; MV-AS1011 0.0 %.
- PIC-AS1005 MANUAL 50 %: PCV-AS1020-1 / -2 42.5 / 100 % (F(X)).
- TCS model sa 150 MW (tcsInit 'load', 30 min): hood 45 → 37.0 °C (dati ~58 °C, ASSUMED na 37 × 0.35 windage).

## Hindi pa ginawa
- Ang ZT-AS1011 (STN102 AI0757) ay ginagamit ng ABC-034; ang value ng model ay nasa page lang, hindi pa ipinapasok sa AI ng sheet.
- Ang HP warming valve control (5 % sa HP exhaust 5 ksc, 40 % sa 4 ksc, PR-OPE-5002) ay hindi pa; 40 % lang habang warming.
- Hindi pa live-tested.
