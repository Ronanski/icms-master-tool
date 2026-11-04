#!/usr/bin/env python3
"""COAL, LIMESTONE AND SAND, the approved temporary mockup page 12 (docs/hmi/mockups/temp/12-coal-limestone-sand.html) in the app:
hooks only (tools/hmi-mock/mock.py).
Coal: feeders DITL-19 / #B / #C (alarms = its CRT outputs 14 INLET PLUGED, 16 BELT TRACKING; clean-out conveyor AUTO = output 23),
outlet discharge valves DITL-20 (output 6 OPENED), FICCL1061A ~ C, FIC-CM, HS-COAL, LT-CL1008-x, MIA-CL1061-x1 (I/O list).
Limestone (Rotofeed PLC): vessel inlet dome valves = the solenoid outputs (row 2) of DITL-LS170 (XV-LM1812, lock vessel inlet) and
LS180 (XV-LM1815, dispensing vessel inlet), vent LS160, balance LS190, equalising LS200; isolating valves A ~ H = DITL-LS212 output
rows 12 ~ 19, bypass air A / B = rows 10 / 11; rotofeed RUNNING = DITL-LS110 output 21; vent filter RUNNING = DITL-LS214 output 18.
Sand: inlet DV XV-SD1804 = DITL-771 output 22 (O.0600 INLET DV OPEN), outlet XV-SD1801 = output 24 (SV-SD1801), conveying air
XV-PA1800 = output 25, vent filter = DITL-774 output 22 (the run command the plant model uses), isolating A / B = DITL-776 outputs
11 / 13, bypass air XV-PA1807 = output 12. Run: python3 tools/hmi-mock/p12.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('12-coal-limestone-sand.html')
p.links()
p.valves()
V = lambda tag, dp=0, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
C = lambda tag, f, dp=1, u='': f'<tspan data-ctl="{tag}|{f}|{dp}|{u}">-----</tspan>'
MODE = lambda tag: f'<tspan data-ctl="{tag}|mode|U">-----</tspan>'
ST = lambda i: f'<tspan data-st="{i}">-----</tspan>'
DY = lambda spec, on, off: f'<tspan data-dy="{spec}" data-on="{on}" data-off="{off}">-----</tspan>'
OC = lambda spec: DY(spec, 'OPEN', 'CLOSED')
ALM = lambda sh, row, t: f'<tspan data-do="{sh}|{row}|{t}| |alarm">-----</tspan>'
# coal feeders A / B / C (370 apart)
for k, (X, inst) in enumerate((('A', ''), ('B', ' #B'), ('C', ' #C'))):
    d = 370 * k
    p.inner(190 + d, 152, V(f'LT-CL1008-{X}', 2, ' m'))
    p.inner(190 + d, 290, ST('CF' + X))
    p.inner(272 + d, 264, C(f'FICCL1061{X}', 'pv', 1, ' T/H'))
    p.inner(272 + d, 279, 'SV ' + C(f'FICCL1061{X}', 'sv') + ' · MV ' + C(f'FICCL1061{X}', 'mv', 1, ' %') + ' ' + MODE(f'FICCL1061{X}'))
    p.inner(272 + d, 308, 'total ' + V(f'MIA-CL1061-{X}1', 1, ' T'))
    p.inner(272 + d, 236, ALM(f'DITL-19{inst}', 13, 'alarm: inlet plugging'))
    xv = {'A': 222, 'B': 592, 'C': 962}[X]
    p.inner(xv, 372, OC(f'DITL-20{inst}|o|5'))
    p.mach('CF' + X, hits=[(130 + d, 260, 120, 36)])
    p.mach('FC' + X, hits=[(230 + d, 250, 120, 34)])
    p.mach('XV' + X, hits=[(xv - 40, 360, 100, 30)])
p.inner(642, 222, ALM('DITL-19 #B', 15, 'alarm: belt tracking'))
# coal master, total coal flow correction
p.inner(1554, 94, MODE('FIC-CM'))
p.inner(1236, 116, 'total coal flow PV ' + C('FIC-CM', 'pv') + ' / SV ' + C('FIC-CM', 'sv', 1, ' T/H'))
p.inner(1236, 132, 'MV ' + C('FIC-CM', 'mv', 1, ' %') + '  ·  FIC-CM  ABC-004A')
p.inner(1554, 160, MODE('HS-COAL'))
p.inner(1236, 182, 'PV ' + C('HS-COAL', 'pv') + ' / SV ' + C('HS-COAL', 'sv', 1, ' T/H') + ' · MV ' + C('HS-COAL', 'mv', 1, ' %'))
p.inner(1236, 226, 'Coal calorie correction  ' + NS)
p.inner(1236, 244, 'Coal / power ratio  ' + NS)
p.inner(1236, 262, 'Unit output ' + NS + ' · coal ' + C('FIC-CM', 'pv', 1, ' T/H'))
p.inner(1220, 384, 'Clean-out conveyors A, B, C: ' + DY('DITL-19|o|22', 'AUTO', 'not AUTO') + ' / ' + DY('DITL-19 #B|o|22', 'AUTO', 'not AUTO')
        + ' / ' + DY('DITL-19 #C|o|22', 'AUTO', 'not AUTO'))
for i, x, y, w, h in (('CM', 1230, 80, 340, 56), ('HSC', 1230, 146, 340, 56)):
    p.mach(i, hits=[(x, y, w, h)])
# limestone
p.inner(160, 698, V('LT-LM1800', 1, ' %'))
p.inner(236, 622, DY('DITL-LS214|o|17', 'RUNNING', 'STOPPED'))
p.inner(146, 790, 'XV-LM1812 ' + OC('DITL-LS170|o|1'))
p.inner(160, 838, V('PT-LM1811', 1, ' kg/cm2'))
p.inner(146, 882, 'XV-LM1815 ' + OC('DITL-LS180|o|1'))
p.inner(160, 944, V('PT-LM1812', 1, ' kg/cm2'))
p.inner(146, 1014, DY('DITL-LS110|o|20', 'RUNNING', 'STOPPED') + ' · ' + NS)
p.inner(36, 1080, 'vent XV-LM1814A ' + OC('DITL-LS160|o|1') + ', balance XV-LM1814B ' + OC('DITL-LS190|o|1') + ', equalising XV-PA1814C '
        + OC('DITL-LS200|o|1'))
for i, (X, y) in enumerate(zip('ABCDEFGH', (594, 634, 714, 754, 834, 874, 954, 994))):
    p.inner(632, y, DY(f'DITL-LS212|o|{11 + i}', X + ' OPEN', X + ' CLOSED'))
p.inner(710, 1050, OC('DITL-LS212|o|9+10'))
# sand
p.inner(1040, 698, V('LT-SD1800', 1, ' %'))
p.inner(1128, 670, DY('DITL-774|o|21', 'RUNNING', 'STOPPED'))
p.inner(1026, 790, 'XV-SD1804 ' + OC('DITL-771|o|21'))
p.inner(1040, 866, V('PT-SD1800', 1, ' kg/cm2'))
p.inner(1026, 948, OC('DITL-771|o|23'))
p.inner(1196, 980, 'XV-PA1800 ' + OC('DITL-771|o|24'))
p.inner(1110, 814, 'vent XV-AV1803 ' + OC('DITL-771|o|19') + ', bypass')
p.inner(1110, 842, 'XV-PA1805B: ' + NS)
p.inner(1370, 972, DY('DITL-776|o|10', 'A OPEN', 'A CLOSED'))
p.inner(1370, 1072, DY('DITL-776|o|12', 'B OPEN', 'B CLOSED'))
p.inner(1446, 898, OC('DITL-776|o|11'))
bad = p.check()
assert not bad, bad
p.write('p12-head.js', 'hmi-mock-cls.js')
