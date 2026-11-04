#!/usr/bin/env python3
"""INSTRUMENT AND PLANT AIR, the approved temporary mockup page 03 (docs/hmi/mockups/temp/03-instrument-plant-air.html) in the app:
hooks only (tools/hmi-mock/mock.py). Machines and values = the old INSTRUMENT & PLANT AIR page (hmi-ia.js): compressor RUNNING / TRIP =
input rows of DITL-113 / 114 (local panel start), dryer RUNNING = output row of DITL-45, REMOTE = its input row, values = plant model
AN_AIR. Run: python3 tools/hmi-mock/p03.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('03-instrument-plant-air.html')
p.links()
p.valves()
for k, X, off, cn, tk, ut in (('ia', 'IA', 0, '0704', '0706', '1706'), ('pa', 'PA', 610, '0703', '0705', '1705')):
    for i, L in enumerate('ABC'):
        y = 120 * i + off
        p.mach(f'{k}c{i}', st=(52, 154 + y), short=True, hits=[(40, 98 + y, 236, 88)])
        p.val(52, 174 + y, f'IIC{cn}{L}', ' A', 0)
        p.mach(f'{k}d{i}', st=(564, 138 + y), short=True, md=(612, 138 + y), hits=[(552, 98 + y, 150, 84)])
        p.inner(564, 172 + y, f'Flow <tspan data-v="FID{cn}{L}" data-u=" m3/h" data-dp="0">-----</tspan> FI-D{cn}{L}')
        p.val(812, 162 + y, f'PI{X}01{i * 2}7', ' kg/cm2', 2)
    p.val(1000, 272 + off, f'PI{X}{tk}B', '', 2)
    p.val(1120, 272 + off, f'PI{X}{tk}A', '', 2)
    p.val(1330, 166 + off, f'PI{X}{ut}', ' kg/cm2', 2)
bad = p.check()
assert not bad, bad
p.write('p03-head.js', 'hmi-mock-ia.js')
