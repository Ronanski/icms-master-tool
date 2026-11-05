#!/usr/bin/env python3
"""PURGE AND TRIP, the approved temporary mockup page 10 (docs/hmi/mockups/temp/10-purge-trip.html) in the app: hooks only
(tools/hmi-mock/mock.py). Each Y / N = the rows of the drawing (hmi-mock.js data-dy): DITL-01 furnace purge permissive (input rows
0 ~ 27, output row 9 FURNACE PURGE PERMISSIVE), DITL-02 purge sequence, DITL-03A master fuel trip (input rows 1 ~ 18, output row 16
MASTER FUEL TRIP (MFT) SER; step 6 MFT reset = that row 0). Run: python3 tools/hmi-mock/p10.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('10-purge-trip.html')
p.links()
p.valves()


def yn(x, y, rx, ry, spec, g=''):
    p.text(x, y, f'data-dy="{spec}"' + (f' data-g="{g}"' if g else ''))
    p.rect(rx, ry, f'data-dyr="{spec}"')


# furnace purge permissive DITL-01 (Y = the line is made)
P = [(96, 'DITL-01|i|0'), (136, 'DITL-01|i|1'), (176, 'DITL-01|i|2'), (216, 'DITL-01|i|3'),
     (256, 'DITL-01|i|12|neg'),               # TOTAL AIR FLOW < 25% MCR = 0
     (296, 'DITL-01|o|4'),                    # ALL BURNER LOSS FLAME
     (336, 'DITL-01|i|8+9+10+11'),            # BURNER A ~ D OIL VALVES ALL CLOSED
     (376, 'DITL-01|o|21'),                   # ALL COAL FEEDER STOPPED
     (416, 'DITL-01|i|16+17+18'),             # COAL FEEDER A ~ C OUTLET DISCHARGE VALVE CLOSED
     (456, 'DITL-01|i|13|neg'),               # MIR-M1311 LIMESTONE FEEDER ROTARY VALVE RUNNING = 0
     (496, 'DITL-01|i|15'), (536, 'DITL-01|i|19'), (576, 'DITL-01|i|14'),
     (616, 'DITL-03A|i|23|neg'), (656, 'DITL-03A|i|24|neg')]   # M.3102 / M.3212 H.H. = 0
for y, spec in P:
    yn(50, y, 36, y - 16, spec, 'PP')
p.text(270, 727, 'data-dys="PP|DITL-01|9|PURGE PERMISSIVE"')
p.rect(36, 702, 'data-dysr="PP"')
# purge sequence DITL-02
for y, ry, spec in ((102, 86, 'DITL-02|i|14'), (182, 166, 'DITL-02|i|1+2+3+4'), (342, 326, 'DITL-02|o|5'),
                    (422, 406, 'DITL-02|o|14'), (502, 486, 'DITL-03A|o|16|neg')):
    yn(1024, y, 1010, ry, spec)
p.text(1024, 262, 'data-dy="DITL-02|i|5"')   # FURNACE PURGE START P.B. (no square in the mockup)
p.inner(560, 740, 'FURNACE PURGE: <tspan data-do="DITL-02|15|OK|NO OK">-----</tspan> · PURGE READY: <tspan data-do="DITL-02|9|1|0">-----</tspan>')
p.inner(560, 758, 'Purge time <tspan data-ns="1">-----</tspan>')
# master fuel trip DITL-03A (Y = the trip input is 1)
for i, y in enumerate(range(154, 784, 37)):
    yn(1110, y, 1096, y - 16, f'DITL-03A|i|{i + 1}')
p.text(1330, 102, 'data-dfo="DITL-03A|16|1-18"')
p.rect(1096, 76, 'data-dfor="1"')
# the fan rows = the fan faceplates
for i, y in (('IDF', 80), ('SAF', 120), ('FA', 160), ('PAF', 200)):
    p.mach(i, hits=[(70, y, 380, 22)])
bad = p.check()
assert not bad, bad
p.write('p10-head.js', 'hmi-mock-pt.js')
