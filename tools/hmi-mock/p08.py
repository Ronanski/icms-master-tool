#!/usr/bin/env python3
"""AUX STEAM AND VACUUM, the approved temporary mockup page 08 (docs/hmi/mockups/temp/08-aux-steam-vacuum.html) in the app: hooks only
(tools/hmi-mock/mock.py). MOVs by their DITL drawing (service name of the drawing = the I/O list ZT description): MV-AS1391 DITL-51 main steam
to aux header, MV-AS1392 DITL-52 aux header drain, MV-AS1393 DITL-53 gland steam drain separator drain, MV-AS1395 DITL-54 start-up ejector,
MV-AS1396 DITL-55 air ejectors, MV-AV1391 DITL-56 vacuum breaker, MV-AS1394 DITL-75 turbine warming line drain; spray block XV-CD1123 /
1125 DITL-67 / 68; controllers PICAS1004, PICAS1005, PICCD1104, TICAS1001, TICAS1017 (ABC-029 / 030); values of the logic or of the
plant model. Run: python3 tools/hmi-mock/p08.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('08-aux-steam-vacuum.html')
p.links()
p.valves()
V = lambda tag, dp, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
C = lambda tag, f, dp=1, u='': f'<tspan data-ctl="{tag}|{f}|{dp}|{u}">-----</tspan>'
MODE = lambda tag: f'<tspan data-ctl="{tag}|mode|U">-----</tspan>'
MOV = lambda sh, tg, k='pct': f'<tspan data-mov="{sh}|{tg}|{k}">-----</tspan>'
# aux steam header
p.val(508, 540, 'PT-AS1004', ' kg/cm2', 1)
p.val(508, 580, 'TT-AS1003', ' °C', 0)
p.inner(120, 170, MOV('DITL-51', 'MV-AS1391') + ' ' + MOV('DITL-51', 'MV-AS1391', 'oc'))
p.inner(220, 170, C('PICAS1004', 'mv', 1, ' %') + ' ' + MODE('PICAS1004'))
p.inner(326, 182, C('TICAS1001', 'mv', 1, ' %') + ' ' + MODE('TICAS1001'))
p.inner(326, 196, 'XV-CD1123 ' + MOV('DITL-67', 'XV-CD1123', 'oc'))
p.val(360, 108, 'TT-AS1001', ' °C', 0)
p.inner(20, 248, 'Pressure control PIC-AS1004 (ABC-030): SV ' + C('PICAS1004', 'sv', 1, ' kg/cm2') + ', MV ' + C('PICAS1004', 'mv', 1, ' %'))
p.inner(276, 296, 'PCV-AS1020-1 ' + V('ZT-AS1020-1', 1, ' %'))
p.inner(276, 384, 'PCV-AS1020-2 ' + V('ZT-AS1020-2', 1, ' %'))
p.inner(20, 412, 'Pressure control PIC-AS1005 (ABC-030 / 029): SV ' + C('PICAS1005', 'sv', 1, ' kg/cm2') + ', MV ' + C('PICAS1005', 'mv', 1, ' %') + ', ' + MODE('PICAS1005'))
p.inner(440, 884, 'MV-AS1392 ' + MOV('DITL-52', 'MV-AS1392') + ' drain')
p.inner(640, 100, 'PCV-AS1030 ' + C('PICCD1104', 'mv', 1, ' %') + ' ' + MODE('PICCD1104'))
# ejectors and vacuum
p.inner(620, 250, MOV('DITL-54', 'MV-AS1395') + ' ' + MOV('DITL-54', 'MV-AS1395', 'oc'))
p.inner(620, 358, MOV('DITL-55', 'MV-AS1396') + ' ' + MOV('DITL-55', 'MV-AS1396', 'oc'))
p.inner(855, 434, 'cooled by condensate · ' + V('TT-CD1119', 0, ' °C') + ' TT-CD1119')
p.val(1350, 402, 'PT-CD1110', ' kg/cm2 abs  PT-CD1110', 3)
p.inner(1350, 420, NS + ' / ' + NS + ' / ' + NS + '  PTST11101/2/3')
p.inner(1350, 436, NS + ' / ' + NS + ' / ' + NS + '  TEST11101/2/3')
p.inner(1446, 310, 'position ' + MOV('DITL-56', 'MV-AV1391'))
# gland steam
p.inner(646, 676, C('TICAS1017', 'mv', 1, ' %') + ' ' + MODE('TICAS1017'))
p.inner(646, 690, 'XV-CD1125 ' + MOV('DITL-68', 'XV-CD1125', 'oc'))
p.val(680, 596, 'TT-AS1015', ' °C', 0)
p.inner(848, 716, 'MV-AS1393 ' + MOV('DITL-53', 'MV-AS1393'))
p.inner(966, 530, 'MV-AS1011 ' + NS + ' · drain MV-AS1394 ' + MOV('DITL-75', 'MV-AS1394'))
p.inner(1050, 660, V('PV-GS1031', 1, ' %') + ' feed')
p.inner(1140, 646, NS)
p.inner(1336, 646, NS + ' / ' + NS)
p.inner(1490, 566, 'PV-GS1034 ' + NS)
p.inner(1336, 694, V('TT-AS1017', 0, ' °C') + ' turbine side')
p.inner(985, 902, 'cooled by condensate · ' + V('TT-CD1120', 0, ' °C') + ' TT-CD1120')
# faceplates (transparent hits over the texts)
for i, x, y, w in (('M51', 116, 146, 110), ('PAS4', 216, 146, 100), ('TAS1', 322, 158, 120), ('X67', 322, 186, 130), ('PAS5', 16, 402, 560),
                   ('M52', 436, 874, 150), ('PCD4', 636, 90, 150), ('M54', 616, 212, 110), ('M55', 616, 322, 110), ('M56', 1442, 286, 150),
                   ('TAS17', 642, 652, 120), ('X68', 642, 680, 130), ('M53', 844, 706, 120), ('M75', 1060, 520, 140)):
    p.mach(i, hits=[(x, y, w, 16 if i not in ('M51', 'PAS4', 'TAS1', 'M54', 'M55', 'M56', 'TAS17') else 30)])
bad = p.check()
assert not bad, bad
p.write('p08-head.js', 'hmi-mock-as.js')
