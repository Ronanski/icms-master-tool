#!/usr/bin/env python3
"""MAKE-UP WATER + CLOSED COOLING WATER, the approved temporary mockup page 02 (docs/hmi/mockups/temp/02-makeup-closed-cooling.html)
in the app: hooks only (tools/hmi-mock/mock.py). Machines and values = the old MAKE-UP WATER (hmi-mu.js) and 027 CLOSED COOLING
WATER (hmi-cw.js) pages. Run: python3 tools/hmi-mock/p02.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('02-makeup-closed-cooling.html')
p.links()
p.valves()
# demineralized water tanks
p.val(42, 140, 'LIMU0708A', ' m', 1)
p.val(42, 310, 'LIMU0708B', ' m', 1)
# make-up pumps A / B / C (rows 130 apart)
for k, y in (('A', 0), ('B', 130), ('C', 260)):
    p.val(375, 139 + y, 'DPIMU0709' + k, ' kg/cm2', 3)
    p.val(470, 141 + y, 'IIP0709' + k, ' A', 1)
    p.mach('P' + k, st=(300, 71 + y), md=(372, 71 + y), ynt=(582, 53 + y), ynr=(568, 37 + y),
           hits=[(448, 83 + y, 44, 44), (296, 38 + y, 250, 40)], yn=(566, 35 + y, 32, 26))
p.val(676, 172, 'PIMU0709', ' kg/cm2', 1)
p.val(676, 282, 'FIMU1001', ' m3/h', 1)
# expansion tank: fill valve XV-MU1109 (open / closed of the model, AUTO SELECTED row of DITL-78), LT-CW1109
p.text(888, 624, 'data-vt="XV-MU1109"')
p.inner(888, 640, '<tspan data-ox="muXv|OPEN|CLOSED">-----</tspan><tspan fill="#a9b0b7"> · </tspan>'
        '<tspan data-dsvc="DITL-78|AUTO SELECTED|Auto|Manual">-----</tspan>')
p.val(832, 700, 'LICW1109', ' m', 2)
# closed cooling pumps A / B (rows 110 apart)
for k, i, y in (('A', 'ACA', 0), ('B', 'ACB', 110)):
    p.val(545, 884 + y, 'DPICW1108' + k, ' kg/cm2', 2)
    p.val(460, 886 + y, 'IIP1108' + k, ' A', 1)
    p.mach(i, st=(200, 816 + y), md=(272, 816 + y), ynt=(522, 816 + y), ynr=(508, 800 + y),
           hits=[(438, 828 + y, 44, 44), (196, 784 + y, 300, 38)], yn=(506, 798 + y, 32, 26))
p.val(160, 662, 'PICW1152', ' kg/cm2', 1)
p.val(160, 696, 'TICW1152', ' °C', 0)
p.val(520, 510, 'PICW1153', ' kg/cm2', 1)
p.val(700, 510, 'TICW1153', ' °C', 0)
# turbine oil coolers: TCV-CW1201 = MV of TICLO1002 (ABC-053), lube oil = its PV
p.inner(1082, 608, 'Temperature control valve TCV-CW1201 <tspan data-ctl="TICLO1002|mv|1| %">-----</tspan> '
        '<tspan data-ctl="TICLO1002|mode">-----</tspan><tspan fill="#a9b0b7"> · lube oil </tspan><tspan data-ctl="TICLO1002|pv|0| °C">-----</tspan>')
p.mach('TIC', hits=[(1076, 596, 410, 16)])
bad = p.check()
assert not bad, bad
p.write('p02-head.js', 'hmi-mock-mu.js')
