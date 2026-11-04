#!/usr/bin/env python3
"""028 CONDENSATE, the approved temporary mockup page 05 (docs/hmi/mockups/temp/05-condensate.html) in the app: hooks only
(tools/hmi-mock/mock.py). Condensate extraction pumps of DITL-61A / 61B (M.3350 / M.3351), MOV / XV of DITL-60, 62 ~ 72, controllers
LICCD1110A / B, LICCD1104, FICCD1120, FICCD1121 of the logic, values of the plant model (unit.js AN_CD, AN_LP). Run: python3 tools/hmi-mock/p05.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('05-condensate.html')
p.links()
p.valves()
V = lambda tag, dp, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
G = lambda t: f'<tspan fill="#a9b0b7">{t}</tspan>'
GL = lambda t: f'<tspan fill="#9aa3ab">{t}</tspan>'
CTL = lambda tag: f'<tspan data-ctl="{tag}|mv|1| %">-----</tspan> <tspan data-ctl="{tag}|mode|U">-----</tspan>'
MOV = lambda sh, tg, k: f'<tspan data-mov="{sh}|{tg}|{k}">-----</tspan>'
# condenser and hotwell (plant model AN_CD)
p.val(74, 508, 'PTCD1110', ' kg/cm2A', 3)
p.val(74, 564, 'TTCD11103', ' °C', 0)
p.val(253, 492, 'TTCD11104', ' °C', 0)
p.val(170, 718, 'LTCD1110', ' mm', 0)
p.inner(170, 742, V('TTCD11101', 0) + G(' · ') + V('TTCD11102', 0, ' °C'))
# make-up to the hotwell
p.inner(132, 398, CTL('LICCD1110A'))
p.inner(244, 378, MOV('DITL-60', 'MV-MU1001', 'pct'))
# condensate extraction pumps
p.val(126, 886, 'DPCEPA', '', 3)
p.val(276, 886, 'DPCEPB', '', 3)
p.inner(90, 1022, '<tspan data-st="CA">-----</tspan>' + G(' · ') + V('ITP1116A', 1, ' A'))
p.inner(240, 1022, '<tspan data-st="CB">-----</tspan>' + G(' · ') + V('ITP1116B', 1, ' A'))
p.mach('CA', ynt=(98, 929), ynr=(84, 913), hits=[(122, 907, 36, 36), (86, 1006, 150, 36)], yn=(84, 913, 28, 22))
p.mach('CB', ynt=(248, 929), ynr=(234, 913), hits=[(272, 907, 36, 36), (236, 1006, 150, 36)], yn=(234, 913, 28, 22))
# condensate line to the polisher and the deaerator
p.val(420, 948, 'PTCD1117', ' kg/cm2', 1)
p.val(510, 948, 'TTCD1118', ' °C', 0)
p.val(800, 948, 'TTCD1119', ' °C', 0)
p.val(1100, 948, 'TTCD1120', ' °C', 0)
p.val(1282, 948, 'FTCD1120', ' T/H', 1)
p.inner(1440, 840, MOV('DITL-63', 'XV-CD1004', 'oc'))
p.inner(1440, 858, MOV('DITL-63', 'XV-CD1005', 'oc'))
p.inner(1494, 532, MOV('DITL-64', 'MV-CD1007', 'pct'))
p.val(1492, 452, 'FTCD1121', ' T/H', 1)
p.inner(1006, 486, MOV('DITL-65', 'MV-CD1008', 'pct'))
p.inner(1280, 606, CTL('FICCD1121'))
p.inner(1168, 668, MOV('DITL-62', 'XV-CD1006', 'oc') + G(' · to the condenser'))
p.inner(1058, 712, 'XV-CD1123 ' + MOV('DITL-67', 'XV-CD1123', 'oc') + ' · TCV-CD1124')
p.inner(1058, 772, 'XV-CD1125 ' + MOV('DITL-68', 'XV-CD1125', 'oc') + ' · TCV-CD1126')
p.inner(1058, 832, 'XV-CD1114 ' + MOV('DITL-66', 'XV-CD1114', 'oc') + ' · TCV-CD1115')
p.inner(1058, 852, 'LP bypass spray flow ' + V('FTCD1115', 1, ' T/H') + ' · FT-CD1115')
p.inner(330, 686, CTL('FICCD1120'))
p.inner(24, 244, CTL('LICCD1110B') + G(' · to condensate storage tank'))
p.inner(480, 196, CTL('LICCD1104'))
# LP heaters (plant model AN_LP)
p.val(500, 50, 'TT-CD1101', ' °C', 0)
p.inner(726, 60, MOV('DITL-71', 'MV-CD1003', 'pct'))
p.inner(600, 194, MOV('DITL-69', 'MV-CD1001', 'pct'))
p.inner(820, 194, MOV('DITL-70', 'MV-CD1002', 'pct'))
p.val(870, 50, 'TT-CD1102', ' °C', 0)
p.val(1090, 50, 'TT-CD1103-1', ' °C', 0)
p.val(1316, 50, 'TT-CD1103-2', ' °C', 0)
# to the deaerator
p.val(1316, 196, 'FTCD1122', ' T/H', 1)
p.val(1316, 232, 'PTCD1122', ' kg/cm2', 1)
p.val(1316, 268, 'TT-CD1122', ' °C', 0)
p.val(1500, 162, 'PTCD1104', ' kg/cm2', 1)
p.inner(1500, 256, V('LTCD11041', 0) + G(' · ') + V('LTCD11042', 0) + G(' · ') + V('LTCD11043', 0, ' mm'))
p.val(1500, 292, 'TTCD1104', ' °C', 0)
p.inner(1316, 24, '')
# faceplates of the controllers and of the MOV / XV (transparent hits over their labels and values)
for i, x, y, w in (('LA', 120, 368, 120), ('LB', 20, 194, 330), ('LD', 476, 166, 110), ('FR', 326, 656, 130), ('FP', 1276, 576, 200),
                   ('V60', 240, 350, 100), ('V63A', 1296, 828, 190), ('V63B', 1296, 846, 190), ('V64', 1490, 484, 100),
                   ('V65', 1002, 458, 100), ('V62', 1164, 640, 260), ('V67', 1054, 700, 150), ('V68', 1054, 760, 150),
                   ('V66', 1054, 820, 150), ('V71', 722, 32, 150), ('V69', 596, 166, 100), ('V70', 816, 166, 100)):
    p.mach(i, hits=[(x, y, w, 36)])
bad = p.check()
assert not bad, bad
p.write('p05-head.js', 'hmi-mock-cd.js')
