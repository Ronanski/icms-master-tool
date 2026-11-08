#!/usr/bin/env python3
"""GENERATOR, the approved temporary mockup page 17 (docs/hmi/mockups/temp/17-generator.html) in the app: hooks only
(tools/hmi-mock/mock.py). 52G1 open = DITL-03E input 3 (M.3220), 52L1 open for house load = DITL-03E input 2 (M.3221), GCB 52G1 ON =
DITL-89 input 15 (I.0931), GCB 52G1 OFF = DITL-03H input 18 (MIG-52G1-2); the other breaker signals are digital inputs of the I/O list
with no sheet (MIL-52G1 I.0930, MIG-52G1-3 ~ 6 I.0933 ~ I.0936, RY-52G I.041B, RY-52L I.041C, MIT-GEN I.041A); generator MW =
GCP-AI1001 / 1002; bearing No. 3 / 4 = the turbine oil model (tcs.js tcsOil, AN.unit loM3 / loM4 / loTb3 / loTb4 / loVx3 ...).
kV / Hz / MVar / power factor / kA / field / energy and the field breaker = the generator model (unit.js anGenEl).
NO-SOURCE: the TCS-only values (TCA3xx, TCA775, cooling air, stator coil, 86G-A / B, leakage).
Run: python3 tools/hmi-mock/p17.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('17-generator.html')
p.links()
p.valves()
V = lambda tag, dp=1, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
DY = lambda spec, on, off: f'<tspan data-dy="{spec}" data-on="{on}" data-off="{off}">-----</tspan>'
DI = lambda tag, on, off, neg='': f'<tspan data-di="{tag}|{on}|{off}{"|neg" if neg else ""}">-----</tspan>'
G1, L1 = 'DITL-03E|i|2|neg', 'DITL-03E|i|1|neg'
p.inner(24, 50, 'breakers and switches as in snapshot 37: red = closed, green = open')
# single line: 52L1, earth switch, disconnect switch, 52G1, field breaker
p.inner(254, 124, DY(L1, 'CLOSED', 'OPEN'))
p.rect(216, 96, f'data-dyr="{L1}"')
p.sub1('<path d="M230 96 V124" stroke="#ff6b6b"', f'<path d="M230 96 V124" data-dyr="{L1}" stroke="#ff6b6b"')
p.inner(342, 290, DI('MIG-52G1-5', 'CLOSED', 'OPEN'))
p.sub1('<path d="M320 262 L332 280" stroke="#4fd06a"', '<path d="M320 262 L332 280" data-dir="MIG-52G1-5" stroke="#4fd06a"')
p.inner(254, 334, DI('MIG-52G1-3', 'CLOSED', 'OPEN'))
p.rect(216, 306, 'data-dir="MIG-52G1-3"')
p.sub1('<path d="M230 306 V334" stroke="#ff6b6b"', '<path d="M230 306 V334" data-dir="MIG-52G1-3" stroke="#ff6b6b"')
p.inner(254, 394, DY(G1, 'CLOSED', 'OPEN') + ' · ' + DI('MIL-52G1', 'REMOTE', 'LOCAL'))
p.rect(216, 366, f'data-dyr="{G1}"')
p.sub1('<path d="M230 366 V394" stroke="#ff6b6b"', f'<path d="M230 366 V394" data-dyr="{G1}" stroke="#ff6b6b"')
FB = 'gen.fcb|1|CLOSED|OPEN'  # the field breaker = the TCS excitation (unit.js anGenEl)
p.inner(364, 578, f'<tspan data-uy="{FB}">-----</tspan>')
p.rect(350, 516, f'data-uyr="{FB}"')
p.sub1('<path d="M350 530 H378" stroke="#ff6b6b"', f'<path d="M350 530 H378" data-uyr="{FB}" stroke="#ff6b6b"')
p.inner(188, 492, V('GCP-AI1001', 1, ' MW'))
p.inner(188, 508, V('GEN.KV') + ' kV')
p.inner(480, 552, V('GEN.VF') + ' VDC · ' + V('GEN.IF') + ' A')
# generator values
p.inner(950, 82, V('GCP-AI1001', 1, ' MW'))
p.inner(950, 118, V('GCP-AI1002', 1, ' MW'))
# the generator model (unit.js anGenEl: data sheet GAE-2013-0136 R2 + snapshot 37.PNG)
for y, t, dp, u in ((154, 'GEN.MVAR', 1, ' MVar'), (190, 'GEN.PF', 3, ''), (226, 'GEN.HZ', 1, ' Hz'), (262, 'GEN.KV', 1, ' kV'),
                    (298, 'GEN.KV', 1, ' kV'), (334, 'GEN.KV', 1, ' kV'), (370, 'GEN.KA', 2, ' kA'), (406, 'GEN.KA', 2, ' kA'),
                    (442, 'GEN.KA', 2, ' kA'), (478, 'GEN.VF', 1, ' VDC'), (514, 'GEN.IF', 1, ' A'), (550, 'GEN.MWH', 0, ' MWh'),
                    (586, 'GEN.MVARH', 0, ' MVarh')):
    p.inner(950, y, V(t, dp) + u)
# breaker status and protection check list
CK = {86: ('di', 'MIL-52G1'), 124: ('dy', 'DITL-89|i|14'), 162: ('dy', 'DITL-03H|i|17'), 200: ('di', 'MIG-52G1-3'), 238: ('di', 'MIG-52G1-4'),
      276: ('di', 'MIG-52G1-5'), 314: ('di', 'MIG-52G1-6'), 352: ('dy', 'DITL-03E|i|1'), 390: ('dy', 'NS'), 428: ('dy', 'NS'),
      466: ('di', 'RY-52G'), 504: ('di', 'RY-52L'), 542: ('di', 'MIT-GEN'), 580: ('dy', 'NS')}
for y, (k, spec) in CK.items():
    if k == 'di':
        p.text(1210, y, f'data-di="{spec}|Y|N"')
        p.rect(1196, y - 16, f'data-dir="{spec}"')
    else:
        p.text(1210, y, f'data-dy="{spec}"')
        p.rect(1196, y - 16, f'data-dyr="{spec}"')
# generator monitoring: bearings No. 3 / 4 (turbine oil model), cooling air and stator coil NO-SOURCE
p.inner(24, 690, 'snapshot P35SHAFT (035 SHAFT MONITOR) and 36.PNG · TCS IO list tags · bearings = the turbine oil model')
p.inner(390, 748, V('TEGE1001', 0, ' °C'))
p.inner(390, 804, V('TEGE1007', 0, ' °C'))
p.inner(390, 860, V('VEGE10011', 3) + ' / ' + V('VEGE10012', 3, ' mm'))
p.inner(780, 748, V('TEGE1002', 0, ' °C'))
p.inner(780, 804, V('TEGE1008', 0, ' °C'))
p.inner(780, 860, V('VEGE10021', 3) + ' / ' + V('VEGE10022', 3, ' mm'))
# cooling air, exciter air, stator coil = the generator model (unit.js anGenTemp, snapshot P35SHAFT)
G = iter(['GEN.TA1', 'GEN.TA2', 'GEN.TA3', 'GEN.TA4', 'GEN.TEX', 'GEN.TS1', 'GEN.TS2', 'GEN.TS3', 'GEN.TS4', 'GEN.TS5', 'GEN.TS6'])
for x in (1170, 1560):
    for y in (748, 804, 860):
        if (x, y) == (1170, 860):
            p.inner(x, y, V(next(G), 0) + ' °C')
        else:
            p.inner(x, y, V(next(G), 0) + ' / ' + V(next(G), 0) + ' °C')
bad = p.check()
assert not bad, bad
p.write('p17-head.js', 'hmi-mock-gn.js')
