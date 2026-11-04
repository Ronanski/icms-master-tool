# Manual valves sa plant model (3.2.1-beta.3)

IRENE : PLANT MODEL, 2026-11-04 PHT. Utos ng user: "D naman need kunin lahat ng manual valves pre.. dami non. Kung ano lng ang
mapapakinabangan ntn s simulation." Code: `src/analog/engine/unit.js` `AN_FV0` / `anFv` (kasama ang dating `AN_SW_V0` ng seawater),
faceplate `src/ui/plant/fp-pop.js` `fieldPct`. Test: `tests/regress/field_valves.js` (10 PASS).

## Paano gamitin
- Pindutin ang valve sa HMI page. Bubukas ang FIELD faceplate: CLOSE, OPEN, at throttle 5 / 10 / 22 / 40 / 50 / 75 %.
- Ang 5, 10, 22 at 40 % ay galing sa SOP (ACWP 5 %, SWP 10 %, condenser outlet 22 / 40 %).
- Pula = bukas (kahit anong %), berde = sarado. Nakatala sa Events bilang "Field operator".
- Start at 150 MW at Cold: bumabalik ang lahat sa normal line-up.

## Ang mga valve at ang epekto
**Seawater (dati na, 3.2.1-beta.1):**
- V-SW1002 / 1004 / 1006: SWP discharge.
- V-SW1007 / 1008: condenser inlet.
- V-SW1009 / 1010: condenser outlet.
- V-SW1016 / 1018 / 1020: SWBP discharge.
- Pump curve ang flow at pressure.

**Closed cooling (PD-021 Rev D):**
- V-CW1002 / 1004 (ACWP suction): sarado = walang tubig ang pump, walang flow.
- V-CW1007 / 1009 (ACWP discharge): throttle (loss / opening⁴); sarado = walang flow.
- V-CW1010 ~ 1012 (CCWHE inlet) at V-CW1013 ~ 1015 (CCWHE outlet):
  - In service ang CCWHE kapag bukas pareho ang inlet at outlet. Normal: A at B in service, C standby (MB-021: 2 × 750 T/H).
  - Isang CCWHE lang: mas mababa ang flow, tumataas ang PT-CW1152, at kalahati na lang ang paglamig.
  - Wala nang CCWHE: walang flow, PT-CW1152 ay nasa shut-off, at umiinit ang closed cooling.

**Make-up (PD-024 Rev D):**
- V-MU0001 / 0002 (demi tank outlet) at V-MU0003 / 4 / 5 (suction): sarado = walang tubig ang pump.
- V-MU0007 / 9 / 11 (discharge): sarado = hindi nagbibigay sa header ang pump. Kapag wala nang pump na nagbibigay, static na lang ang PT-MU0709 (2.5 kg/cm2).
- V-MU0013 / 15 / 17 (recirculation): sarado = walang minimum flow.

**Air (PD-023 Rev C):**
- V-IA1101 / V-PA1087 (unit 1 header): sarado = bumababa ang PT-IA1706 / PT-PA1705 (PSL-IA1706 LOW, MFT row ng DITL-03G).
- V-PA0013 (cross-tie, PA → IA tanks, normal sarado): kapag bukas, binubuhay ng plant air ang instrument air tanks.

## Resulta (cloud test, 150 MW)
- Sarado ang outlet ng CCWHE A: 1 CCWHE, flow 1334 m3/h, PT-CW1152 6.72.
- Sarado rin ang outlet ng B: flow 0, PT-CW1152 8.16 (shut-off).
- ACWP-A discharge sa 5 %: 22 m3/h ang flow ng ACWP-A. Bumaba ang PT-CW1152 sa ilalim ng 3.5, kaya pinatakbo ng logic ang ACWP-B (DITL-77). Bumalik sa 1505 m3/h.
- Sarado ang discharge ng MWP-A at C: PT-MU0709 2.51 kg/cm2 (static), pareho ang basa ng DITL-112.
- Sarado ang V-IA1101: PT-IA1706 1.5 kg/cm2 pagkatapos ng 90 s, PSL-IA1706 LOW, tanks 7.0.
- Lahat ng IA compressor naka-trip at bukas ang V-PA0013: IA tanks 6.45 kg/cm2 mula sa plant air (1117 m3/h), walang MFT.

## NO-SOURCE (hindi nakita sa docs; nakasulat ang ginamit)
- Aling CCWHE ang standby (C).
- Loss ng bukas na ACWP discharge valve: 0.05 kg/cm2 sa 1500 m3/h.
- Bahagi ng unit 1 sa gamit ng hangin: 50 %. Bleed-down ng unit header: 60 s.
- Cross-tie V-PA0013: 1500 m3/h sa 1 kg/cm2 na diperensya.
- Ang pump na tumatakbo pero walang tubig ay may shut-off power.

## Hindi pa ginawa
- Ang daloy (animation) ng pipe sa HMI page ay sumusunod pa sa tumatakbong pump, hindi pa sa valve.
- Ang hotwell make-up ay hindi pa humihinto kapag walang MWP na nagbibigay.
- Hindi pa live-tested sa PC ng user.

## DCS command na walang interlock (utos ng user, 2026-11-04)
- Hinanap sa I/O list (lahat ng DO) at sa text ng lahat ng DITL drawing.
- Sa seawater, make-up, closed cooling at air: may logic sheet ang bawat DCS command:
  - SWP: DITL-29A / 29B;
  - SWBP: DITL-30;
  - debris filter: DITL-39;
  - MWP: DITL-112;
  - XV-MU1109: DITL-78;
  - ACWP: DITL-76 / 77;
  - compressor: DITL-113 / 114;
  - dryer: DITL-45.
- Ang B / C ng iisang drawing ay machine instance (#B / #C).
- Wala pang kailangang simpleng OPEN / CLOSE faceplate sa apat na system na ito. Susuriin ulit sa bawat bagong system (Turbine Oil ang susunod).
