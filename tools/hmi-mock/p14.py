#!/usr/bin/env python3
"""ESP AND ASH, the approved temporary mockup page 14 (docs/hmi/mockups/temp/14-esp-ash.html) in the app: hooks only
(tools/hmi-mock/mock.py). Screw ash coolers DITL-21A / #B / #C / #D input row 1 BOTTOM ASH SCREW COOLER x FORWARD RUNNING (I.0250 ...);
chain conveyor L-1090, bucket elevator L-1091, screw conveyor L-1092, vibrating screens S-1092 A / B, filter venting fan F-1091 =
DITL-BA59 input rows 8 ~ 14 (MIR-x RUNNING); DPIC-FG108, SIC-L1060A (logic); DPT-FG1081 / 1082, PT / TT-CW1156, TT-BH1060-x1 / x2,
TT-CW1060-x1 / x2, LT-BH1750 (I/O list). Run: python3 tools/hmi-mock/p14.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('14-esp-ash.html')
p.links()
p.valves()
V = lambda tag, dp=0, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
C = lambda tag, f, dp=1, u='': f'<tspan data-ctl="{tag}|{f}|{dp}|{u}">-----</tspan>'
MODE = lambda tag: f'<tspan data-ctl="{tag}|mode|U">-----</tspan>'
DY = lambda spec, on, off: f'<tspan data-dy="{spec}" data-on="{on}" data-off="{off}">-----</tspan>'
RUN = lambda row: DY(f'DITL-BA59|i|{row}', 'RUNNING', 'STOPPED')
p.inner(480, 512, 'furnace grate floor · bed DP ' + V('DPT-FG1081') + ' / ' + V('DPT-FG1082', 0, ' mmH2O') + ' (DPT-FG1081 / 1082)')
p.inner(30, 580, V('PT-CW1156', 1, ' kg/cm2'))
p.inner(30, 594, V('TT-CW1156', 0, ' °C'))
for k, (X, inst) in enumerate((('A', ''), ('B', ' #B'), ('C', ' #C'), ('D', ' #D'))):
    d = 170 * k
    p.inner(230 + d, 540, NS)
    p.inner(142 + d, 672, DY(f'DITL-21A{inst}|i|0', 'RUNNING', 'STOPPED') + ' · ' + NS + ' A')
    p.inner(142 + d, 688, 'ash in / out ' + V(f'TT-BH1060-{X}1') + ' / ' + V(f'TT-BH1060-{X}2', 0, ' °C'))
    p.inner(142 + d, 704, 'water ' + V(f'TT-CW1060-{X}1') + ' / ' + V(f'TT-CW1060-{X}2', 0, ' °C'))
    p.mach('BC' + X, hits=[(80 + d, 626, 130, 52)])
p.inner(30, 830, 'Inlet valves XV-BH1060A to D (snapshot tag HVBH1060): ' + NS + '.')
p.inner(490, 768, 'chain conveyor L-1090 · ' + RUN(7))
p.inner(860, 822, 'L-1091 ' + RUN(8))
p.inner(912, 556, 'L-1092 ' + RUN(9))
p.inner(1022, 624, 'S-1092 A / B ' + RUN(10) + ' / ' + RUN(12))
p.inner(1280, 666, V('LT-BH1750', 1, ' %'))
p.inner(1266, 818, NS)
p.inner(1402, 558, 'PV ' + C('DPICFG108', 'pv', 0, ' mmH2O'))
p.inner(1402, 580, 'SV ' + C('DPICFG108', 'sv', 0) + ' · MV ' + C('DPICFG108', 'mv', 1, ' %'))
p.inner(1402, 602, MODE('DPICFG108'))
p.inner(1402, 664, 'PV ' + C('SICL1060A', 'pv') + ' / SV ' + C('SICL1060A', 'sv', 1, ' rpm') + ', ' + MODE('SICL1060A'))
p.inner(1402, 790, 'Bag filter fan F-1091 ' + RUN(13))
p.mach('DP', hits=[(1396, 540, 200, 70)])
p.mach('SA', hits=[(1396, 640, 200, 44)])
# tracker e1: the ESP start note = the FIELD pop-out of the precipitator (EP PLC panel)
p.mach('ESP', hits=[(1396, 68, 200, 80)])
bad = p.check()
assert not bad, bad
p.write('p14-head.js', 'hmi-mock-ea.js')
