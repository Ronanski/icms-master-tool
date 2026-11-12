#!/usr/bin/env python3
"""SAMPLING AND DOSING, the approved temporary mockup page 16 (docs/hmi/mockups/temp/16-sampling-dosing.html) in the app: hooks only
(tools/hmi-mock/mock.py). Analyzers AT-SP1001 ~ 1021 = AI0320 ~ AI0358 of the I/O list (AI-R); alarms AL1-SP01 / AL2-SP01 / AL3-SP01 /
AL-Z1110 = I.053C ~ I.053F; dosing pumps MIR-Z1107A/B, MIR-Z1108A/B, MIR-Z1109A/B = I.0120 ~ I.012A (running); agitator MIR-Z1101A =
I.012C; tank level switches LSH / LSL / LSLL-CH1101 / 1103 / 1105 = I.0130 ~ I.0138. No ABC / DITL sheet reads these signals and the
plant model gives them (3.2.3 SOHEE: unit.js AN_CHEM; the ones still without a source stay '-----', never the snapshot 21 numbers).
Pump capacities (200 ml/min · 184.62 kg/cm2 ...) are design data of flow diagram K1AU3-PD-042. Run: python3 tools/hmi-mock/p16.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('16-sampling-dosing.html')
p.links()
p.valves()
V = lambda tag, dp=1, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
DI = lambda tag, on, off: f'<tspan data-di="{tag}|{on}|{off}">-----</tspan>'
CC, SC, PPB = ' µS/cm', ' µS/cm', ' ppb'
A = {  # value text (x, y): tag, decimals, unit, mark
    (204, 426): ('AT-SP1001', 1, ''), (204, 476): ('AT-SP1002', 3, CC),
    (400, 426): ('AT-SP1003', 1, ''), (400, 476): ('AT-SP1004', 1, PPB, ' *'), (400, 526): ('AT-SP1005', 3, CC),
    (596, 426): ('AT-SP1006', 1, ''), (596, 476): ('AT-SP1007', 1, SC), (596, 526): ('AT-SP1008', 1, PPB),
    (792, 426): ('AT-SP1009', 1, ''), (792, 476): ('AT-SP1010', 1, PPB),
    (988, 426): ('AT-SP1011', 1, ''), (988, 476): ('AT-SP1012', 1, SC), (988, 526): ('AT-SP1013', 1, PPB),
    (1184, 426): ('AT-SP1014', 1, SC), (1184, 476): ('AT-SP1015', 1, PPB, ' *'),
    (1380, 426): ('AT-SP1016', 1, ''), (1380, 476): ('AT-SP1017', 1, PPB, ' *'), (1380, 526): ('AT-SP1021', 3, CC),
    (1576, 426): ('AT-SP1018', 3, CC), (1576, 476): ('AT-SP1019', 3, CC), (1576, 526): ('AT-SP1020', 1, PPB)}
for (x, y), a in A.items():
    p.inner(x, y, V(a[0], a[1], a[2]) + (a[3] if len(a) > 3 else ''))
p.inner(22, 606, '* tag shown highlighted in snapshot 21: the value was above the 0 to 100 ppb range of AT-SP1004.')
for x, tag in ((654, 'AL1-SP01'), (890, 'AL2-SP01'), (1126, 'AL3-SP01'), (1362, 'AL-Z1110')):
    p.text(x, 614, f'data-di="{tag}|Y|N"')
    p.rect(x - 14, 598, f'data-dir="{tag}"')
# 3.2.3 (SOHEE): the dosing pumps are FIELD equipment of the plant model (unit.js AN_CHEM, AN.field tspA ...): their run state
# (data-st) and a click = the FIELD faceplate (start / stop at the local panel); the I/O list DI MIR-Z11xx is what the model gives
for x, i in ((300, 'TSPA'), (420, 'TSPB'), (815, 'AMNA'), (935, 'AMNB'), (1330, 'CHZA'), (1450, 'CHZB')):
    p.mach(i, st=(x, 978), hits=[(x - 40, 910, 80, 76)])
for x, n in ((130, '1101'), (645, '1103'), (1160, '1105')):
    p.inner(x, 838, 'level H / L / LL: ' + DI(f'LSH-CH{n}', 'Y', 'N') + ' / ' + DI(f'LSL-CH{n}', 'Y', 'N') + ' / ' + DI(f'LSLL-CH{n}', 'Y', 'N'))
p.inner(130, 870, 'agitator MIR-Z1101A running: ' + DI('MIR-Z1101A', 'Y', 'N'))
p.mach('AGT', hits=[(126, 858, 270, 18)])
bad = p.check()
assert not bad, bad
p.write('p16-head.js', 'hmi-mock-sp.js')
