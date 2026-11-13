#!/usr/bin/env python3
"""AIR AND FLUE GAS, the approved temporary mockup page 09 (docs/hmi/mockups/temp/09-air-flue-gas.html) in the app: hooks only
(tools/hmi-mock/mock.py). Fans by their DITL drawing (boiler.js AN_FN.run: PAF DITL-26A, SAF DITL-27A, IDF DITL-25A, FA blowers DITL-28A /
#B), air preheater DITL-43 (hmi-aph.js), controllers of the logic (FICFA1071, FICFA1081, PICFG108, PICFG108A, HICHR1002A / B,
TICHR1002A, AICFG112), transmitters of the logic, else the plant model (boiler.js AN_FN currents and pressures). Run: python3 tools/hmi-mock/p09.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('09-air-flue-gas.html')
p.links()
p.valves()
V = lambda tag, dp=0, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
C = lambda tag, f, dp=1, u='': f'<tspan data-ctl="{tag}|{f}|{dp}|{u}">-----</tspan>'
MODE = lambda tag: f'<tspan data-ctl="{tag}|mode|U">-----</tspan>'
ST = lambda i: f'<tspan data-st="{i}">-----</tspan>'
G = lambda t: f'<tspan fill="#9aa3ab">{t}</tspan>'
# furnace
p.inner(235, 208, V('PT-FG1085') + ' / ' + V('PT-FG1086') + ' / ' + V('PT-FG1087') + ' / ' + NS)
p.inner(235, 272, V('TT-FG1091') + ' / ' + V('TT-FG1090', 0, ' °C'))
p.inner(235, 336, V('DPT-FG1081', 0, ' mmH2O'))
p.inner(235, 400, V('DPT-FG1084') + ' / ' + V('DPT-FG1184', 0, ' mmH2O'))
p.inner(235, 464, V('DPT-FG1083') + ' / ' + V('DPT-FG1183', 0, ' mmH2O'))
# cyclones and seal pots
p.inner(420, 354, V('TT-FG1009-A') + ' / ' + V('TT-FG1009-B', 0, ' °C'))
p.inner(458, 586, 'A2 ' + V('PT-FG1009-A2') + ' · B2 ' + V('PT-FG1009-B2'))
p.inner(480, 72, 'cyclone outlet ' + V('TT-FG1095-A') + ' / ' + V('TT-FG1095-B', 0, ' °C') + '  TT-FG1095-A/B')
# back pass: the gas temperatures in front of each bank have no transmitter
for x, ys in ((585, (182, 236, 290, 344, 398)), (735, (179, 224, 269, 314, 359, 404))):
    for y in ys:
        p.inner(x, y, 'gas in ' + NS)
p.inner(585, 466, 'RH damper ' + C('HICHR1002A', 'mv', 1, ' %'))
p.inner(735, 466, 'SH damper ' + C('HICHR1002B', 'mv', 1, ' %'))
p.inner(660, 528, 'gas in ' + V('TT-FG1110') + ' / ' + V('TT-FG1113', 0, ' °C') + '  TT-FG1110 / 1113')
# air preheater (DITL-43)
p.inner(750, 686, 'DP ' + V('DPT-FG1052-5', 0, ' mmH2O'))
p.inner(750, 720, 'motor ' + NS + ' A <tspan data-st="APH" data-short="1">-----</tspan>')
p.inner(760, 586, V('TT-FG1124') + ' / ' + V('TT-FG1125', 0, ' °C') + ' · ' + V('PT-FG1121', 0, ' mmH2O'))
p.inner(760, 622, 'O2 ' + V('AT-FG1122', 1) + ' / ' + V('AT-FG1123', 1, ' %'))
p.inner(760, 830, V('TT-FG1132') + ' / ' + V('TT-FG1133', 0, ' °C') + ' · ' + V('PT-FG1134', 0, ' mmH2O') + ' · O2 ' + V('AT-FG1131', 1, ' %'))
# precipitator, ID fan, stack
p.inner(1104, 760, V('PT-FG1141-A') + ' / ' + V('PT-FG1141-B', 0, ' mmH2O'))
p.inner(1210, 878, ST('IDF') + ' ' + V('IT-F1056', 1, ' A'))
p.inner(1210, 894, 'coupling ' + C('PICFG108', 'mv', 1, ' %') + ' · ' + NS + ' rpm')
p.inner(1210, 910, 'inlet damper PCD-FG1056-1 ' + C('PICFG108A', 'mv', 1, ' %') + ' ' + MODE('PICFG108A'))
p.inner(1260, 716, V('TT-FG1152', 0, ' °C') + ' · ' + V('PT-FG1151', 0, ' mmH2O'))
for y, tag, dp, u in ((420, 'AT-FG1057-4', 1, ' %'), (438, 'AT-FG1057-2', 0, ' ppm'), (456, 'AT-FG1057-1', 0, ' ppm'), (474, 'AT-FG1057-3', 0, ' ppm'),
                      (492, 'AT-FG1057-6', 1, ' %'), (510, 'AT-FG1057-5', 1, ' mg/m3'), (528, 'TT-FG1057-8', 0, ' °C'), (546, 'FT-FG1057-7', 1, ' m/s')):
    p.val(1590, y, tag, u, dp)
# hot air to the furnace
p.inner(345, 680, V('TT-FA1087') + ' / ' + V('TT-FA1086', 0, ' °C') + ' · ' + V('PT-FA1088', 0, ' mmH2O'))
p.inner(530, 760, 'hot primary air ' + V('FT-FA1079', 1, ' T/H') + ' FT-FA1079')
p.inner(530, 774, V('TT-FA1076') + ' / ' + V('TT-FA1077', 0, ' °C') + ' · ' + V('PT-FA1078', 0, ' mmH2O'))
# primary / secondary air fans
p.inner(296, 868, ST('PAF') + ' ' + V('IT-F1053', 1, ' A'))
p.inner(296, 882, C('FICFA1071', 'pv', 1, ' T/H') + ' FT-FA1071 · SV ' + C('FICFA1071', 'sv', 1))
p.inner(296, 908, 'inlet ' + V('TT-FA1072', 0, ' °C') + ' · out ' + V('PT-FA1075', 0, ' mmH2O') + ' PT-FA1075 · ' + V('TT-FA1073') + ' / ' + V('TT-FA1074', 0, ' °C'))
p.inner(204, 924, 'MCV-FA1053-1 ' + C('FICFA1071', 'mv', 1, ' %'))
p.inner(296, 958, ST('SAF') + ' ' + V('IT-F1054', 1, ' A'))
p.inner(296, 972, C('FICFA1081', 'pv', 1, ' T/H') + ' FT-FA1081 · SV ' + C('FICFA1081', 'sv', 1))
p.inner(296, 998, 'inlet ' + V('TT-FA1082', 0, ' °C') + ' · out ' + V('PT-FA1085', 0, ' mmH2O') + ' PT-FA1085 · ' + V('TT-FA1083') + ' / ' + V('TT-FA1084', 0, ' °C'))
p.inner(204, 1014, 'MCV-FA1054-1 ' + C('FICFA1081', 'mv', 1, ' %'))
# fluidizing air blowers
p.inner(20, 46, 'A ' + ST('FA') + ' ' + V('IT-F1055A', 1, ' A') + ' · B ' + ST('FB') + ' ' + V('IT-F1055B', 1, ' A'))
p.inner(20, 60, G(V('FT-FA1055', 1, ' T/H') + ' FT-FA1055 · ') + V('PT-FA1055-A') + ' / ' + V('PT-FA1055-B', 0, ' mmH2O'))
# Mina F151-3: the inlet dampers FCV-FA1055-A1 / B1 of the blowers (ABC-014 FICFA1055A / B) under the FA line, with their faceplates
_i = p.s.index('<text x="20" y="60"')
_e = p.s.index('</text>', _i) + len('</text>')
p.s = (p.s[:_e] + '<text x="20" y="74" font-size="11" fill="#9aa3ab">inlet damper A ' + C('FICFA1055A', 'mv', 1, ' %') + ' ' + MODE('FICFA1055A')
       + ' · B ' + C('FICFA1055B', 'mv', 1, ' %') + ' ' + MODE('FICFA1055B') + '</text>' + p.s[_e:])
# live run 2026-11-13 F6: the surge (to silencer) and outlet SOVs of the blowers XV-FA1055-A2 / A3 / B2 / B3 (DITL-28C and #B), with their faceplates:
# the blower start needs FCD READY (DITL-28A row 4) = damper demand 25 % AND surge SOV opened, and the operator had no control of them
_MV = lambda sh, ph, how: '<tspan data-mov="' + sh + '|~' + ph + '|' + how + '">-----</tspan>'
_i = p.s.index('<text x="20" y="74"')
_e = p.s.index('</text>', _i) + len('</text>')
for _y, _l, _ph in ((88, 'surge SOV', 'TO SILENCE'), (102, 'outlet SOV', 'OUTLET SOV')):
    _t = ('<text x="20" y="' + str(_y) + '" font-size="11" fill="#9aa3ab">' + _l + ' A ' + _MV('DITL-28C', _ph, 'oc') + ' ' + _MV('DITL-28C', _ph, 'md') + '</text>'
          + '<text x="190" y="' + str(_y) + '" font-size="11" fill="#9aa3ab">B ' + _MV('DITL-28C #B', _ph, 'oc') + ' ' + _MV('DITL-28C #B', _ph, 'md') + '</text>')
    p.s = p.s[:_e] + _t + p.s[_e:]
    _e += len(_t)
# F8: the primary air fan lube oil pumps A / B (DITL-24 and #B) had no faceplate on any page: the PA fan needs one running (DITL-26A)
_t = '<text x="360" y="924" font-size="11" fill="#9aa3ab">lube oil pump A ' + ST('LOA') + ' · B ' + ST('LOB') + '</text>'
p.s = p.s[:_e] + _t + p.s[_e:]
# combustion controls
p.inner(1360, 292, C('AICFG112', 'sv', 1, ' %'))
p.inner(1360, 310, V('ABC-006|SI0060', 1, ' T/H'))  # total air = ABC-006 SI0060 (live sweep 2026-11-14)
p.inner(1360, 328, NS + ' / ' + NS)
p.inner(1360, 346, 'PV ' + C('TICHR1002A', 'pv', 0) + ' · SV ' + C('TICHR1002A', 'sv', 0, ' °C'))
p.inner(1360, 364, 'RH ' + C('HICHR1002A', 'mv', 1, ' %') + ' · SH ' + C('HICHR1002B', 'mv', 1, ' %') + ' ' + MODE('HICHR1002A'))
p.inner(860, 390, '')
# faceplates (transparent hits over the texts)
for i, x, y, w, h in (('PAF', 230, 856, 140, 16), ('SAF', 230, 946, 140, 16), ('IDF', 1150, 866, 120, 16), ('FA', 16, 34, 124, 16),
                      ('FB', 140, 34, 140, 16), ('FCA', 16, 64, 150, 14), ('FCB', 166, 64, 120, 14), ('SVA', 16, 78, 170, 14), ('SVB', 186, 78, 140, 14), ('OVA', 16, 92, 170, 14), ('OVB', 186, 92, 140, 14), ('LOA', 356, 913, 128, 14), ('LOB', 484, 913, 80, 14), ('APH', 700, 708, 100, 16), ('CPA', 200, 870, 260, 16), ('CSA', 200, 960, 260, 16),
                      ('MPA', 200, 912, 140, 16), ('MSA', 200, 1002, 140, 16), ('IDC', 1150, 882, 120, 16), ('IDD', 1110, 898, 200, 16),
                      ('RHD', 540, 454, 90, 16), ('SHD', 690, 454, 90, 16), ('O2', 1300, 280, 70, 16), ('RHT', 1290, 334, 80, 16)):
    p.mach(i, hits=[(x, y, w, h)])
bad = p.check()
assert not bad, bad
p.write('p09-head.js', 'hmi-mock-fg.js')
