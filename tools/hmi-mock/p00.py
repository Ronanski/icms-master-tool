#!/usr/bin/env python3
"""OVERVIEW, the approved temporary mockup page 00 (docs/hmi/mockups/temp/00-overview.html) in the app: hooks only (tools/hmi-mock/mock.py).
Every title = a link to its page. Values: generator MW GCP-AI1001, main steam PT-MS1002, TICMS1004 PV, ABC-001C SI0230 (the compensated flow, as the top bar), feedwater FICFW1007,
drum level LICBR1001B PV (compensated, ABC-010), furnace PT-FG1085, coal FIC-CM, condenser PT-CD1110 (plant model cdP), turbine speed (plant model rpm), 52G1 /
52L1 = DITL-03E inputs 3 / 2; the CCS controllers HIC-ULD, EIC-TM, PIC-COBM, HIC-BM, FIC-CM (PV / SV / mode of the logic).
Total air flow = ABC-006 SI0060 (the sum inside the ABC). NO-SOURCE: load rate, high limit, load up rate. Run: python3 tools/hmi-mock/p00.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('00-overview.html')
p.links()
p.valves()
V = lambda tag, dp=1, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
C = lambda tag, f, dp=1, u='': f'<tspan data-ctl="{tag}|{f}|{dp}|{u}">-----</tspan>'
MODE = lambda tag: f'<tspan data-ctl="{tag}|mode|U">-----</tspan>'
DY = lambda spec, on, off: f'<tspan data-dy="{spec}" data-on="{on}" data-off="{off}">-----</tspan>'
G1, L1 = 'DITL-03E|i|2|neg', 'DITL-03E|i|1|neg'
# top values
p.inner(36, 66, V('GCP-AI1001', 1, ' MW'))
p.inner(36, 86, 'set ' + C('HIC-ULD', 'sv', 1))
p.inner(208, 66, V('PT-MS1002', 1, ' kg/cm2'))
p.inner(380, 66, C('TICMS1004', 'pv', 0, ' °C'))
p.inner(552, 66, V('ABC-001C|SI0230', 1, ' T/H'))
p.inner(724, 66, C('FICFW1007', 'pv', 1, ' T/H'))
p.inner(896, 66, C('LICBR1001B', 'pv', 0, ' mm'))
p.inner(1068, 66, V('PT-FG1085', 0, ' mmH2O'))
p.inner(1240, 66, V('ABC-006|SI0060') + ' T/H')  # total air = ABC-006 SI0060 (PA + SA + FA, live sweep 2026-11-14)
p.inner(1412, 66, C('FIC-CM', 'pv', 1, ' T/H'))
p.inner(1412, 86, 'coal master ' + MODE('FIC-CM'))
p.inner(1580, 118, 'values: the logic and the plant model')
# blocks
p.inner(72, 342, V('GCP-AI1001', 1, ' MW'))
p.inner(72, 358, '52G1 ' + DY(G1, 'closed', 'open') + ' / 52L1 ' + DY(L1, 'closed', 'open'))
p.inner(312, 342, V('SI-TB', 0, ' rpm'))
p.inner(572, 342, 'drum ' + C('LICBR1001B', 'pv', 0, ' mm'))
p.inner(72, 602, V('PT-CD1110', 3, ' kg/cm2 abs'))
p.inner(572, 602, C('FICFW1007', 'pv', 1, ' T/H'))
p.inner(832, 226, V('PT-FG1085', 0, ' mmH2O'))
p.inner(1442, 482, V('ABC-006|SI0060') + ' T/H')
p.inner(1042, 342, 'coal ' + C('FIC-CM', 'pv', 1, ' T/H'))
p.inner(832, 618, 'oil master ' + MODE('FIC-OM'))
# coordinated control
p.inner(1564, 724, 'the controllers of the logic')
for x, y, tag, u in ((836, 756, 'HIC-ULD', ' MW'), (1084, 756, 'EIC-TM', ' MW'), (1332, 756, 'PIC-COBM', ' kg/cm2'), (836, 820, 'HIC-BM', ' %'),
                     (1084, 820, 'FIC-CM', ' T/H')):
    p.inner(x, y + 18, 'PV / SV ' + C(tag, 'pv', 1) + ' / ' + C(tag, 'sv', 1, u))
    p.inner(x, y + 34, tag + ' · ' + MODE(tag))
p.inner(1332, 820, 'Load rate ' + NS + ' MW/min')
p.inner(1332, 836, 'High limit ' + NS + ' MW')
p.inner(1332, 852, 'Load up rate ' + NS + ' %/min')
for tag, hit in (('HIC-ULD', (832, 740, 240, 56)), ('EIC-TM', (1080, 740, 240, 56)), ('PIC-COBM', (1328, 740, 240, 56)), ('HIC-BM', (832, 804, 240, 56)),
                 ('FIC-CM', (1080, 804, 240, 56))):
    p.mach(tag.replace('-', ''), hits=[hit])
bad = p.check()
assert not bad, bad
p.write('p00-head.js', 'hmi-mock-ov.js')
