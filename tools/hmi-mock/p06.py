#!/usr/bin/env python3
"""FEEDWATER, the approved temporary mockup page 06 (docs/hmi/mockups/temp/06-feedwater.html) in the app: hooks only
(tools/hmi-mock/mock.py). BFWP A / B of DITL-23A / #B, MOVs of DITL-38 (#MV-FW1001 / 1391 / 1002 / 1392), extraction MOVs DITL-94 ~ 98,
spray block valves DITL-32 / #B, 33 / #B, 35, 79; controllers of the logic (FICFW1007, LICBR1001B, TICBR1130, TICBR1150, TICHR1002,
TICMS1022, LICHD11051 / 11061); values of the logic or of the plant model (AN_FW, AN_HP). Run: python3 tools/hmi-mock/p06.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('06-feedwater.html')
p.links()
p.valves()
V = lambda tag, dp, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
CTLMV = lambda tag: f'<tspan data-ctl="{tag}|mv|1| %">-----</tspan>'
MODE = lambda tag: f'<tspan data-ctl="{tag}|mode|U">-----</tspan>'
MOV = lambda sh, tg, k='pct': f'<tspan data-mov="{sh}|{tg}|{k}">-----</tspan>'
# deaerator storage tank (logic ABC-056)
p.inner(170, 196, 'level LT-CD1104-1/2/3 · ' + V('LT-CD1104-1', 0) + ' · ' + V('LT-CD1104-2', 0) + ' · ' + V('LT-CD1104-3', 0, ' mm'))
p.inner(170, 214, 'pressure PT-CD1104 · ' + V('PT-CD1104', 2, ' kg/cm2'))
# extraction steam (DITL-94 NO.1 MV-TS1001 ~ DITL-98 NO.5 MV-TS1005); the non-return valves XV-TS17x0 are on no DCS sheet
p.inner(244, 50, 'MV-TS1003 ' + MOV('DITL-96', 'MV-TS1003') + ' · XV-TS1710 ' + NS)
p.inner(244, 66, V('PT-TS1017', 2, ' kg/cm2') + ' PT-TS1017 · also aux steam')
p.inner(808, 84, 'MV-TS1002 ' + MOV('DITL-95', 'MV-TS1002') + ' · XV-TS1700 ' + NS)
p.inner(808, 100, V('PT-TS1013', 2, ' kg/cm2') + ' PT-TS1013')
p.inner(1108, 84, 'MV-TS1001 ' + MOV('DITL-94', 'MV-TS1001') + ' · ' + V('TT-TS1011', 0, ' °C'))
p.inner(614, 760, 'Low pressure heaters (Condensate page): extraction 4 to heater 3 (MV-TS1004 ' + MOV('DITL-97', 'MV-TS1004') +
        ', XV-TS1720), extraction 5 to heater 2 (MV-TS1005 ' + MOV('DITL-98', 'MV-TS1005') + ', XV-TS1730),')
# boiler feed water pumps (DITL-23A / #B; plant model AN_FW)
p.inner(110, 374, '<tspan data-st="PA">-----</tspan> · ' + V('IT-P1115A', 1, ' A'))
p.inner(110, 674, '<tspan data-st="PB">-----</tspan> · ' + V('IT-P1115B', 1, ' A'))
p.inner(130, 450, 'DP ' + V('DPT-FW1115-A', 2))
p.inner(130, 562, 'DP ' + V('DPT-FW1115-B', 2))
p.inner(130, 464, 'suction ' + V('PT-FW1115-A', 1, ' kg/cm2'))
p.inner(130, 576, 'suction ' + V('PT-FW1115-B', 1, ' kg/cm2'))
p.mach('PA', ynt=(258, 352), ynr=(244, 336), hits=[(238, 398, 44, 44), (106, 344, 130, 36)], yn=(244, 336, 28, 22))
p.mach('PB', ynt=(258, 652), ynr=(244, 636), hits=[(238, 578, 44, 44), (106, 644, 130, 36)], yn=(244, 636, 28, 22))
# discharge MOVs and their bypasses (DITL-38 instances)
p.inner(400, 392, 'MV-FW1001 ' + MOV('DITL-38 #MV-FW1001', 'MV-FW1001'))
p.inner(400, 630, 'MV-FW1002 ' + MOV('DITL-38 #MV-FW1002', 'MV-FW1002'))
p.inner(474, 482, MOV('DITL-38 #MV-FW1391', 'MV-FW1391'))
p.inner(474, 572, MOV('DITL-38 #MV-FW1392', 'MV-FW1392'))
# discharge, HP heaters
p.val(528, 296, 'PT-FW1011', ' kg/cm2', 1)
p.val(528, 334, 'TT-FW1011', ' °C', 0)
p.inner(728, 280, 'level ' + V('LT-HD1105-1', 0) + ' / ' + V('LT-HD1105-2', 0, ' mm'))
p.val(926, 186, 'TT-FW1105', ' °C', 0)
p.inner(1042, 280, 'level ' + V('LT-HD1106-1', 0) + ' / ' + V('LT-HD1106-2', 0, ' mm'))
p.val(1222, 252, 'TT-FW1106', ' °C', 0)
p.inner(1020, 340, 'LCV-HD1106-1 · ' + CTLMV('LICHD11061'))
p.inner(556, 390, 'LCV-HD1105-1 · ' + CTLMV('LICHD11051'))
# feedwater flow and the drum level control valves
p.inner(1270, 186, V('FT-FW1007-1', 1) + ' · ' + V('FT-FW1007-2', 1))
p.inner(1350, 186, CTLMV('LICBR1001B') + ' ' + MODE('LICBR1001B'))
p.inner(1350, 266, CTLMV('FICFW1007'))
p.inner(1350, 330, CTLMV('LICBR1001A') + ' ' + MODE('LICBR1001A'))  # Mina B87-1: the 1 element drum level loop (ABC-010), needed in MANUAL before LICBR1001B AUTO (M.0226)
p.inner(1350, 282, 'flow <tspan data-ctl="FICFW1007|pv|1">-----</tspan> SV <tspan data-ctl="FICFW1007|sv|1| T/H">-----</tspan>')
p.inner(1590, 318, V('PT-FW1160', 1, ' kg/cm2') + ' · ' + V('TT-FW1160', 0, ' °C'))
# superheater sprays (ABC-011 TICBR1130, ABC-012 TICBR1150; block valves DITL-32 / #B, DITL-33 / #B)
p.inner(1326, 368, V('FT-FW1109', 1, ' T/H') + ' FT-FW1109')
p.inner(1326, 462, 'TCV-FW1110-1 ' + V('ZT-FW1110-1', 1, ' %'))
p.inner(1326, 476, 'TCV-FW1110-2 ' + V('ZT-FW1110-2', 1, ' %'))
p.inner(1326, 490, 'XV-FW1111-1/-2 ' + MOV('DITL-32', 'XV-FW1111-1', 'oc') + ' / ' + MOV('DITL-32 #B', 'XV-FW1111-2', 'oc') + ' · ' + MOV('DITL-32', 'XV-FW1111-1', 'md'))
p.inner(1326, 548, V('FT-FW1119', 1, ' T/H') + ' FT-FW1119')
p.inner(1326, 642, 'TCV-FW1120-1 ' + V('ZT-FW1120-1', 1, ' %'))
p.inner(1326, 656, 'TCV-FW1120-2 ' + V('ZT-FW1120-2', 1, ' %'))
p.inner(1326, 670, 'XV-FW1121-1/-2 ' + MOV('DITL-33', 'XV-FW1121-1', 'oc') + ' / ' + MOV('DITL-33 #B', 'XV-FW1121-2', 'oc') + ' · ' + MOV('DITL-33', 'XV-FW1121-1', 'md'))
# reheater inlet and HP turbine bypass desuperheaters (ABC-019 TICHR1002 + DITL-35; ABC-051 TICMS1022 + DITL-79)
p.inner(910, 482, V('FT-FW1149', 1, ' T/H') + ' FT-FW1149')
p.inner(910, 498, 'XV-FW1151 ' + MOV('DITL-35', 'XV-FW1151', 'oc') + ' · TCV-FW1150 ' + CTLMV('TICHR1002') + ' ' + MODE('TICHR1002'))
p.inner(910, 514, '')
p.inner(910, 612, V('FT-FW1059', 1, ' T/H') + ' FT-FW1059')
p.inner(910, 628, 'XV-FW1061 ' + MOV('DITL-79', 'XV-FW1061', 'oc') + ' · TCV-FW1060 ' + CTLMV('TICMS1022') + ' ' + MODE('TICMS1022'))
p.inner(910, 644, '')
# faceplates: controllers and valves (transparent hits over their texts)
for i, x, y, w in (('C1061', 1016, 328, 160), ('C1051', 552, 378, 160), ('CSU', 1346, 160, 160), ('CMN', 1346, 238, 210), ('C1001A', 1346, 304, 110),
                   ('C1130', 1322, 452, 200), ('C1150', 1322, 632, 200), ('C1002', 906, 488, 330), ('C1022', 906, 618, 330),
                   ('M1003', 240, 40, 120), ('M1002', 804, 74, 120), ('M1001', 1104, 74, 120), ('MA', 396, 382, 120), ('MB', 396, 620, 120),
                   ('BA', 470, 458, 80), ('BB', 470, 548, 80), ('X11A', 1322, 480, 90), ('X21A', 1322, 660, 90)):
    p.mach(i, hits=[(x, y, w, 16)])
bad = p.check()
assert not bad, bad
p.write('p06-head.js', 'hmi-mock-fw.js')
