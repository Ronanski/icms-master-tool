#!/usr/bin/env python3
"""036 TURBINE OIL, the approved temporary mockup page 04 (docs/hmi/mockups/temp/04-turbine-oil.html) in the app: hooks only
(tools/hmi-mock/mock.py). Same signals as the old 036 TURBINE OIL page (hmi-to.js): pumps of the TCS (tcs.js TCS_OIL, AN.unit lo*),
values of the plant model, TE-LO1002-1 / -2 of the logic (ABC-053). Run: python3 tools/hmi-mock/p04.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('04-turbine-oil.html')
p.links()
p.valves()
V = lambda tag, dp, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
G = lambda t: f'<tspan fill="#a9b0b7">{t}</tspan>'
for x, y, id, tag in ((452, 622, 'MA', 'PTLO1922A'), (452, 702, 'MB', 'PTLO1922B'), (380, 772, 'EO', 'PTLO1923'),
                      (1262, 550, 'CA', 'PTLO1931A'), (1262, 650, 'CB', 'PTLO1931B')):
    p.inner(x, y, f'<tspan data-st="{id}">-----</tspan>' + G(' · ') + V(tag, 1, ' kg/cm2'))
p.mach('MA', hits=[(330, 584, 32, 32), (448, 578, 200, 62)])
p.mach('MB', hits=[(330, 664, 32, 32), (448, 658, 200, 62)])
p.mach('EO', hits=[(330, 734, 32, 32), (376, 728, 320, 62)])
p.mach('CA', hits=[(1144, 524, 32, 32), (1258, 518, 220, 52)])
p.mach('CB', hits=[(1144, 624, 32, 32), (1258, 618, 220, 52)])
p.mach('VX', st=(280, 502), hits=[(170, 470, 100, 50), (276, 476, 170, 44)])
p.mach('PU', hits=[(120, 800, 80, 40)])
p.val(452, 440, 'TELO1001', ' °C', 0)
p.val(712, 408, 'TE-LO1002-1', ' °C', 0)
p.val(712, 428, 'TE-LO1002-2', ' °C', 0)
p.inner(880, 362, V('PTLO10031', 1) + G(' · ') + V('PTLO10032', 1) + G(' · ') + V('PTLO10033', 1, ' kg/cm2'))
p.val(980, 132, 'TEGE1007', ' °C', 0)
p.val(1110, 132, 'TEGE1008', ' °C', 0)
p.inner(1262, 194, V('PTLO10061', 1) + G(' · ') + V('PTLO10062', 1) + G(' · ') + V('PTLO10063', 1, ' kg/cm2'))
p.inner(1330, 708, V('PTLO10071', 1) + G(' · ') + V('PTLO10072', 1) + G(' · ') + V('PTLO10073', 1, ' kg/cm2'))
bad = p.check()
assert not bad, bad
p.write('p04-head.js', 'hmi-mock-to.js')
