# Bottom ash plant model (3.2.1, SEULGI : PLANT MODEL boiler side)

Code: `src/analog/engine/boiler.js` `AN_BA` / `anBaStep`. Switch rows: `src/world/plantsw.js` (`baSw`, `baRun`). 150 MW state: `src/world/ditl150.js` (EQ rules at B.A RESET). Test: `tests/regress/bottom_ash.js`.

## Mga source
- O&M L6 "Bottom ash" (J.A.T. Engineering 130225-OMM-01). Nasa PC lang: `document-references/o&m-package-phase-1/L6 Bottom ash/L6 Bottom ash.pdf` (scan, binasa bilang larawan). Mga pahina: p.4 ~ 5 mechanical conveying at faults, p.6 ~ 8 ash transmitter (primary conditions, manual / auto, cleaning), p.9 equipment list at "values setting", p.10 faults.
- Drawing `bottomash-limestone-logic.zip` 130225C-BA-01 ~ BA-74 (DITL-BA01 ~ BA74, station 103). Binasa ang PDF: BA03 (charging precondition), BA05 (step 2), BA25 (pressure low latches), BA62 (EMG.STOP).
- IO list "Station 103": I.0163 ~ I.017A, I.0240 ~ I.0249, I.0482 ~ I.0498, O.0201 ~ O.021E.
- Snapshot 16.PNG (150 MW): chain conveyor, bucket elevator, screw conveyor, venting fan tumatakbo (R); vibrating screens at ash coolers naka-hinto; auto sequence MANUAL. Walang snapshot ng transmitter (PICT 17).
- 20.PNG: F-1301 sand silo venting fan naka-hinto.

## Ang model (field devices lang; hindi binago ang logic ng drawing)
- Transmitter valves: inlet knife gate SV-BH1759 (DITL-BA53 OUT7), venting SV-BH1753 (OUT1), outlet SV-BH1752 (OUT8), pressing SVO / SVC-BH1750 (OUT9 / OUT10, dalawang solenoid: nananatili sa puwesto sa pagitan). Bumabalik ang ZSO / ZSC I.0482 ~ I.0489.
- Vessel: PSH-BH1750 I.048A (>= 1.8 kg/cm2), PSL-BH1750 I.048B (< 0.5, 1 = low; BA25), LS-BH1750 I.048F (puno). Pressing air hanggang regulator 3.5 kg/cm2 (O&M p.9).
- Air tank PS-BH1750 I.048D: 1 = low < 7 kg/cm2 (O&M p.9; BA03 NOT, BA25 TR359). Basa: plant air header ng model (`paPU`).
- Conveyors (DITL-BA59 / BA60, tag lang ang row): remote selectors sa REMOTE (16.PNG R), local EMG stop contacts sarado (IO list "not emergency stop", N.C.), speed switches SS-BH1750 ~ 1752 = tumatakbo ang makina (IO list "1 : speed OK").
- MIR-M1301 sa DITL-BA sheets = ang F-1301 ng sand model (iisang field contact; ang destinasyon ng transmitter ay ang sand silo).
- ditl150: idinagdag ang bucket elevator, screw conveyor, venting fan (tumatakbo) at vibrating screens (hinto) mula 16.PNG; at ang B.A RESET_HMI / RESET(DCS) sa reset ng operator sa 150 MW (dati: naka-latch ang CONVEYORS EMG.STOP mula sa cold start).

## Resulta sa 150 MW
Bago: INLET GATE / PRESSING / OUTLET / VENT VALVE ABNORMAL, VALVE ABNORMAL FILTER, CHAIN CONVEYOR SPEED FAULT, CONVEYORS EMG.STOP, SYSTEM FAULT. Ngayon: wala na ang valve abnormal, speed fault at EMG.STOP. Natitira: AIR SOURCE PRESSURE LOW at SYSTEM FAULT (tingnan ang desisyon sa ibaba).

## NO-SOURCE (walang dokumento, ipinapakita)
| Item | Gamit |
|---|---|
| Valve stroke | 2 s |
| Charging ng vessel (inlet bukas) | 30 s |
| Conveying ng isang batch | 60 s |
| Vessel pressure habang conveying | 1.5 kg/cm2 |
| Buffer tank (LS-BH1751 / 1752) | hindi modelado: ang charge ay may abo sa buffer tank |

## Desisyon ng user (nakabinbin)
Ang O&M ay 7 kg/cm2 para sa air source switch; ang plant air header ng model ay 6.8 (ang 0.2 na bawas ay NO-SOURCE ng air model). Kaya lumalabas ang AIR SOURCE PRESSURE LOW sa 150 MW. Hindi ito tinono. Ginamit ang O&M 7 habang wala pang sagot.

## Mga finding
1. Ang CHAIN CONVEYOR RUNNING ay 1 sa 150 MW (ditl150 rule) habang 0 ang CHAIN CONVEYOR ON COMMAND (DITL-BA68 OUT5): ang static na running ay hindi galing sa command. Ganito rin ang bagong bucket / screw / fan. Hindi pa sumasagot ang motor sa command sa model.
2. Two-way separator ZSO / ZSC-BH1754 (DITL-BA60 rows 7 / 8): hindi pa modelado (walang fault output sa 150 MW).
3. Ang dulo ng row text ng DITL-BA59 / BA60 ay "_INPUT" (hal. "REMOTE_INPUT"); hindi ito nababasa ng `\bREMOTE\b` ng ditl150, kaya ang plant model ang nagbibigay ng REMOTE.

## Hindi nasubok
Buong cycle (conveying, cleaning, auto mode), buffer tank, two-way separator, live test sa PC ng user.
