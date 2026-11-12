# Plant model — Sampling at Chemical Dosing (3.2.3-beta.116)

SOHEE : PLANT MODEL HELPER, 2026-11-12 PHT. Tanong ng user: "may mga d pa ata nagagawan ng plant model eh?" Ang page na
SAMPLING AND DOSING (021 / 022) ay "-----" lang dati: walang model. Code: `src/analog/engine/unit.js` `AN_CHEM` / `anChemStep`.
Page: `tools/hmi-mock/p16.py`, `p16-head.js` (generated `src/ui/plant/hmi-mock-sp.js`), `src/ui/plant/hmi-mock.js` (`def.udi`).
Tests: `tests/regress/chem_model.js` (engine), `tests/regress/chem_page.js` (page, totoong click).

## Sources
- **Flow diagram K1AU3-PD-042 Rev D** (A1-0-001 RA PDF p 36): tatlong skid, bawat isa ay solution tank + 2 dosing pump.
  Z-1107A/B tri-sodium phosphate 200 ml/min, 184.62 kg/cm2 → economizer inlet (PD-017); Z-1108A/B neutral amine 250 ml/min →
  condensate; Z-1109A/B carbon hydraride (carbohydrazide) 100 ml/min → deaerator; tanks Z-1101 / 1103 200 L, Z-1105 100 L; agitator Z-1101.
- **I/O list:** RUNNING at ELECTRIC TROUBLE DI lang ng pumps (I.0120 ~ I.012D, STN101); walang DO = walang DCS command → FIELD equipment.
  Analyzers AT-SP1001 ~ 1021 (STN104 AI0320 ~ AI0358) at ang ranges nila.
- **Alarm list "Alarm List _20160912", sheet AT:** normal / H / L ng bawat analyzer (hal. AT-SP1010 H 4.2 / HH 4.4 ppb, AT-SP1011
  H 9.5 / L 8.8, AT-SP1012 H 10 / HH 15 µS/cm, AT-SP1006 normal 7.5); sheet LS: LSH / LSL / LSLL-CH1101 0.48 / 0.12 / 0.09 m.
- **FHI CFB manual Part 2 Sect 8 Tab 3 (Water Treatment) p 2-8-TAB_3-2:** deaerator 0.7 ~ 1.1 kg/cm2 → oxygen < 0.01 ppm; amines
  pH 8.8 ~ 9.2. **Figure 2-8-TAB_3-2:** coordinated phosphate PO4 5 ~ 10 ppm, pH 9.1 ~ 9.8; Na/PO4 ≤ 2.6. **Figure 2-8-TAB_3-3:** pH
  laban sa PO4 (curve Na/PO4 2.6). **Figure 2-8-TAB_3-1:** silica sa boiler water laban sa drum pressure.
- **PR-OPE-5002-02:** amine sa hotwell (3534 ~ 3569), pH 8.6 ~ 9.2 tapos 9.0 (3677, 3929); carbohydrazide sa deaerator (3770 ~ 3781);
  phosphate pagkatapos ng drum fill (4200 "OPEN V-CH1007 and Start Phosphate Dosing pump"). Isang pump bawat chemical.
- **Mass balance K1AU3-MB-019 item 22:** CBD 15 T/H (design). **Condenser O&M section 1 p 2:** hotwell 61.9 m3.
  **DA O&M section 1 p 2:** feedwater tank 140.4 t operating / 40 t empty, deaerator 13.37 / 9.83 t.
  **Hydrostatic test procedure K1AU3-R3-0-101 p 8:** boiler (walang reheater) ~252 m3.
- **HMI snapshot 21.PNG (check lang):** pH 9.5 at 4.6 µS/cm sa drum, 8.8 / 7.9 / 9.1 pH sa feedwater, deaerator O2 115.8 ppb (lampas
  sa 0 ~ 100 ppb range: sira ang analyzer o hindi deaerated), main steam pH 4.9 (= LL alarm, analyzer).

## Paano gumagana
- **Dosing pumps:** pinipindot ng field operator (click ang pump sa page = FIELD pop-out, START / STOP). Start 150 MW: A tumatakbo,
  B standby. Cold: lahat nakatigil.
- **Amine (pH ng feedwater at main steam, AT-SP1001 / 1003 / 1009 / 1016):** nananatili sa cycle (volatile), nawawala lang sa blowdown
  (CBD + MBD ng drum model). Ang dose ay ang humahawak ng target sa design CBD 15 T/H. pH = 9.0 + 0.5 log10(c) (weak base), hindi
  bababa sa 7.5 ng make-up. Ang inventory ng cycle (CALC) ≈ 61.9 + 100.4 + 3.5 t + boiler 252 m3 sa density ng drum water: time
  constant ~ 20 oras, kaya mabagal ang pagbaba ng pH kapag huminto ang pump.
- **Phosphate (drum, AT-SP1011 / 1012):** nananatili sa boiler water, lumalabas sa blowdown. Dose = 5 ppm PO4 sa design CBD (simula ng
  FHI band). pH mula sa FHI Fig. 3 (5 ppm = 9.5). Conductivity CALC mula sa mga ion (Na/PO4 2.6, limiting ionic conductivities).
- **Oxygen (AT-SP1004 / 1010):** deaerator ≥ 0.7 kg/cm2 → 10 ppb (FHI). Mababa ang pressure → hindi deaerated (air-saturated, ang
  transmitter ay nasa range top 100). Cold: 100 hanggang unang ma-pressurize ang deaerator. Economizer inlet: kinukuha ng
  carbohydrazide ang oxygen (0 ppb); huminto ang pump → umaabot ang oxygen ng deaerator sa loob ng ~1 residence ng tank (100.4 t /
  feedwater flow, ~12 min sa 150 MW).
- **Cation conductivity (AT-SP1002 / 1005 / 1018 / 1019 / 1021):** walang condenser leak sa model: purong tubig 0.055 µS/cm. Sodium 0.
- **Make-up pH (AT-SP1006):** 7.5 habang may make-up pump.
- **Alarms:** AL2-SP01 (analyzer common alarm) = may modelled analyzer na lampas sa H / L ng alarm list. AL1, AL3, AL-Z1110 = 0.

## Tala sa user (UNUSUAL, magkasalungat ang docs)
- **Drum conductivity:** sa FHI phosphate band (≥ 5 ppm PO4, Na/PO4 2.6) ang CALC ay ~19 µS/cm, pero ang alarm list H ay 10 at HH
  15 (DCS temporary value), at ang snapshot ay 4.6. Kaya sa 150 MW ay naka-Y ang analyzer common alarm (pula rin sa snapshot 21).
  Sinunod ang FHI manual; ang alarm list ay "temporary value".
- **Drum pH:** FHI band 9.1 ~ 9.8, alarm list H 9.5. Sa 5 ppm ang FHI curve ay 9.5 (= snapshot 9.5).

## NO-SOURCE (naiwang "-----" sa page)
- Make-up conductivity at silica (AT-SP1007 / 1008), saturated steam conductivity (AT-SP1014), lahat ng silica analyzer (AT-SP1013 /
  1015 / 1017): walang value ng make-up water quality sa docs na nabasa (WTP manual L11 hindi pa nabasa, 300 MB).
- Tank level switches LSH / LSL / LSLL-CH1101 / 1103 / 1105: wala sa PD-042 ang taas ng tank, kaya hindi maikabit ang 0.48 / 0.12 /
  0.09 m sa 200 L.
