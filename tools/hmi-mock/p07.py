#!/usr/bin/env python3
"""DRUM AND MAIN STEAM, the approved temporary mockup page 07 (docs/hmi/mockups/temp/07-drum-main-steam.html) in the app: hooks only
(tools/hmi-mock/mock.py). Values of the logic (drum, superheaters, main steam, reheat), controllers of the logic (PICMS1002, PICMS1006,
TICMS1022, TICHR1002, PICHR1003, TICHR1012, HICBR1391, PICHR1391), MOVs of DITL-38 (MV-BD1001 / 1002, MV-MS1391 / 1392) and DITL-94,
drain pot valves DITL-73 / 80 / 81 / 88, turbine speed of the plant model. Run: python3 tools/hmi-mock/p07.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('07-drum-main-steam.html')
p.links()
p.valves()
V = lambda tag, dp, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
GR = lambda t: f'<tspan fill="#9aa3ab">{t}</tspan>'
MV_ = lambda tag: f'<tspan data-ctl="{tag}|mv|1| %">-----</tspan>'
MODE = lambda tag: f'<tspan data-ctl="{tag}|mode|U">-----</tspan>'
MOV = lambda sh, tg, k='pct': f'<tspan data-mov="{sh}|{tg}|{k}">-----</tspan>'
T2 = lambda a, b, dp, u: V(a, dp) + ' / ' + V(b, dp, u)
# drum (ABC-010 drum level control: LICBR1001B PV = the compensated drum level)
p.inner(225, 132, V('PT-BR1001-1', 1, ' kg/cm2') + '  PT-BR1001-1/-2')
p.inner(225, 150, 'level <tspan data-ctl="LICBR1001B|pv|0| mm">-----</tspan> (' + V('LT-BR1001-1', 0) + ' / ' + V('LT-BR1001-2', 0) + ' / ' + V('LT-BR1001-3', 0) + ')  LT-BR1001-1/2/3')
p.inner(68, 900, V('PT-FW1160', 1, ' kg/cm2') + ' · ' + V('TT-FW1160', 0, ' °C'))
p.val(138, 602, 'TT-BR1020', ' °C', 0)
p.val(258, 602, 'TT-BR1030', ' °C', 0)
p.val(378, 602, 'TT-BR1040', ' °C', 0)
p.inner(146, 690, 'MV-BD1002 ' + MOV('DITL-38 #MV-BD1002', 'MV-BD1002'))
p.inner(146, 790, 'MV-BD1001 ' + MOV('DITL-38', 'MV-BD1001'))
# superheaters and sprays
p.val(512, 186, 'TT-BR1110', ' °C', 0)
p.inner(700, 186, T2('TT-BR1120-1', 'TT-BR1120-2', 0, ' °C'))
p.inner(806, 40, 'Spray 1: ' + V('FT-FW1109', 1, ' T/H') + ' FT-FW1109')
p.inner(806, 54, 'TCV-FW1110-1 ' + V('ZT-FW1110-1', 1, ' %') + ' · -2 ' + V('ZT-FW1110-2', 1, ' %'))
p.inner(816, 186, T2('TT-BR1130-1', 'TT-BR1130-2', 0, ' °C'))
p.val(816, 222, 'PT-BR1130', ' kg/cm2', 1)
p.inner(945, 246, 'MV-BR1391 ' + MV_('HICBR1391'))
p.inner(1050, 186, T2('TT-BR1140-1', 'TT-BR1140-2', 0, ' °C'))
p.inner(1136, 40, 'Spray 2: ' + V('FT-FW1119', 1, ' T/H') + ' FT-FW1119')
p.inner(1136, 54, 'TCV-FW1120-1 ' + V('ZT-FW1120-1', 1, ' %') + ' · -2 ' + V('ZT-FW1120-2', 1, ' %'))
p.inner(1146, 186, T2('TT-BR1150-1', 'TT-BR1150-2', 0, ' °C'))
p.val(1146, 222, 'PT-BR1150', ' kg/cm2', 1)
# main steam
p.val(1430, 214, 'FT-MS1031', ' T/H', 1)
p.inner(1430, 254, V('PT-MS1002', 1, ' kg/cm2') + ' · ' + '<tspan data-ctl="TICMS1004|pv|0| °C">-----</tspan>')
p.inner(1496, 344, MV_('PICMS1002') + ' ' + MODE('PICMS1002'))
p.inner(1404, 500, MOV('DITL-38 #MV-MS1391', 'MV-MS1391') + ' ' + MOV('DITL-38 #MV-MS1391', 'MV-MS1391', 'oc'))
p.inner(1514, 500, MOV('DITL-38 #MV-MS1392', 'MV-MS1392') + ' bypass')
p.inner(1468, 564, GR('XV-MS1011 ') + MOV('DITL-88', 'XV-MS1011', 'oc'))
p.inner(1430, 590, V('PT-MS1006-1', 1, ' kg/cm2') + ' · ' + V('TT-MS1007', 0, ' °C'))
# HP bypass
p.inner(1292, 678, 'PCV-MS1020 ' + MV_('PICMS1006'))
p.inner(1268, 710, MV_('TICMS1022') + ' ' + MODE('TICMS1022') + ' · ' + V('FT-FW1059', 1, ' T/H'))
p.inner(1290, 778, T2('TT-MS1022-1', 'TT-MS1022-2', 0, ' °C'))
p.val(1290, 820, 'PT-MS1021', ' kg/cm2', 1)
# turbine (TCS of the plant model: speed; the stop / control / reheat valve positions are not in the DCS logic)
p.inner(1454, 702, NS + ' / ' + NS)
p.inner(1454, 747, NS + ' / ' + NS)
p.inner(1480, 829, 'G-1901 · ' + V('RPM', 0, ' rpm'))
p.inner(1046, 710, 'valves A / B ' + NS)
# cold reheat
p.inner(1060, 930, V('PT-CR1003', 1, ' kg/cm2') + ' · ' + V('TT-CR1004', 0, ' °C'))
p.inner(1372, 954, GR('XV-CR1011 ') + MOV('DITL-73', 'XV-CR1011', 'oc'))
p.inner(780, 926, GR('XV-CR1901 ') + NS)
p.inner(780, 942, GR('FV-CR1902 ') + NS + GR(' (ventilator)'))
p.inner(868, 876, 'MV-TS1001 ' + MOV('DITL-94', 'MV-TS1001'))
p.inner(556, 758, 'TCV-FW1150 ' + MV_('TICHR1002') + ' ' + MODE('TICHR1002') + ' · ' + V('FT-FW1149', 1, ' T/H'))
p.inner(700, 706, T2('TT-CR1005-1', 'TT-CR1005-2', 0, ' °C'))
p.val(700, 650, 'PT-CR1006', ' kg/cm2', 1)
# hot reheat
p.inner(680, 420, T2('TT-HR1002-1', 'TT-HR1002-2', 0, ' °C'))
p.val(680, 384, 'PT-HR1001', ' kg/cm2', 1)
p.inner(990, 330, 'MV-HR1391 ' + MV_('PICHR1391'))
p.inner(720, 388, V('PT-HR1003-1', 1) + ' / ' + V('PT-HR1003-2', 1, ' kg/cm2') + ' · ' + V('TT-HR1004', 0, ' °C'))
p.inner(1024, 434, GR('XV-HR1021/1022 ') + MOV('DITL-80', 'XV-HR1021', 'oc') + ' / ' + MOV('DITL-81', 'XV-HR1022', 'oc'))
p.inner(1112, 476, MV_('PICHR1003'))
p.inner(1112, 532, MV_('TICHR1012') + ' ' + MODE('TICHR1012'))
# faceplates (transparent hits over the texts)
for i, x, y, w in (('BD2', 142, 680, 130), ('BD1', 142, 780, 130), ('BR', 941, 236, 130), ('PMS2', 1492, 320, 110), ('MS1', 1300, 476, 110),
                   ('MS2', 1510, 476, 90), ('D88', 1464, 554, 130), ('PMS6', 1288, 668, 130), ('TMS22', 1264, 686, 200), ('D73', 1310, 944, 130),
                   ('TS1', 864, 866, 130), ('THR2', 552, 748, 260), ('PHR391', 986, 320, 130), ('D80', 900, 424, 130), ('PHR3', 1108, 452, 130),
                   ('THR12', 1108, 508, 130)):
    p.mach(i, hits=[(x, y, w, 16)])
bad = p.check()
assert not bad, bad
p.write('p07-head.js', 'hmi-mock-ms.js')
