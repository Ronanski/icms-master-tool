#!/usr/bin/env python3
"""SOOTBLOWERS, the approved temporary mockup page 15 (docs/hmi/mockups/temp/15-sootblowers.html) in the app: hooks only
(tools/hmi-mock/mock.py). Blower N-10xx = its output "N-10xx SOOTBLOWER OPERATING" (DITL-80A row 26, 80B ~ 80E rows 2 / 6 / 10 / 14 /
18 / 22 / 26), air heater blowers = DITL-80F row 26; DITL-80A: input 2 STEAM SUPPLY MOTOR VALVE OPEN, 24 / 23 -M.423A / -M.4239 DRAIN
TEMPERATURE > 220 (NOT), 14 M.4008 ALL ON RETRACT, 15 I.073F REMOTE, 13 -I.073E AIR PREHEATER REMOTE, output 21 BLOWING PERMISSIVE,
6 PROGRAM ON, 10 MANUAL MODE; DITL-80S outputs 6 FULL CLOSED, 20 / 25 OPEN / CLOSE OVER TIME; DITL-80Q output 4 WARMING UP FAILURE;
DITL-80R outputs 21 SOV(L) OPENED (XV-SB1054), 12 SOV(R) OPENED (XV-SB1059, DITL-80P I.0044). Run: python3 tools/hmi-mock/p15.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('15-sootblowers.html')
p.links()
p.valves()
V = lambda tag, dp=0, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
C = lambda tag, f, dp=1, u='': f'<tspan data-ctl="{tag}|{f}|{dp}|{u}">-----</tspan>'
MODE = lambda tag: f'<tspan data-ctl="{tag}|mode|U">-----</tspan>'
DY = lambda spec, on, off: f'<tspan data-dy="{spec}" data-on="{on}" data-off="{off}">-----</tspan>'
OP = {'N-1011': 'DITL-80A|o|25'}
for sh, tags in (('DITL-80B', range(1012, 1019)), ('DITL-80C', range(1019, 1026)), ('DITL-80D', range(1026, 1033)), ('DITL-80E', range(1033, 1039))):
    for i, n in enumerate(tags):
        OP[f'N-{n}'] = f'{sh}|o|{1 + 4 * i}'
OP['N-1040'] = OP['N-1042'] = 'DITL-80F|o|25'
POS = {195: 172, 640: 617, 760: 737, 1210: 1187}
import re
for m in re.finditer(r'<text[^>]*\bx="(\d+)" y="(\d+)"[^>]*>(N-10\d\d)</text>', p.s):
    x, y, n = int(m.group(1)), int(m.group(2)), m.group(3)
for x, y, n in [(int(a), int(b), c) for a, b, c in re.findall(r'<text[^>]*\bx="(\d+)" y="(\d+)"[^>]*>(N-10\d\d)</text>', p.s)]:
    p.text(x, y, f'data-dy="{OP[n]}" data-on="{n}" data-off="{n}"')
    p.rect(POS[x], y - 13, f'data-dyr="{OP[n]}"')
# steam supply
p.inner(1504, 142, DY('DITL-80S|o|5|neg', 'OPEN', 'CLOSED') + ' ' + NS + ' %')
p.inner(1420, 70, C('PICSB1052', 'mv', 1, ' %') + '  ' + MODE('PICSB1052'))
p.inner(1180, 72, V('PT-SB1052', 1, ' kg/cm2'))
p.inner(560, 978, V('PT-SB1040', 1) + ' · ' + V('PT-SB1042', 1, ' kg/cm2'))
p.inner(70, 870, V('TT-SB1056', 0, ' °C'))
p.inner(1262, 990, V('TT-SB1057', 0, ' °C'))
p.inner(310, 982, 'XV-SB1054 bypass ' + DY('DITL-80R|o|20', 'OPEN', 'CLOSED'))
p.inner(1590, 1000, 'XV-SB1059 bypass ' + DY('DITL-80R|o|11', 'OPEN', 'CLOSED'))
# system panel
p.inner(1314, 244, DY('DITL-80A|i|13', 'ALL RETRACTED', 'NOT ALL RETRACTED') + ' · ' + NS + ' blowing')
p.inner(1314, 264, 'program ' + DY('DITL-80A|o|5', 'ON', 'OFF') + ', ' + DY('DITL-80A|o|9', 'MANUAL', 'AUTO') + ' mode')
p.inner(1314, 294, V('IT-SB01', 1, ' A'))
p.inner(1314, 334, 'Forward ' + NS + ' · reverse ' + NS)
p.inner(1314, 354, 'Steam valve warm-up ' + NS + ' of 10 min')
p.inner(1314, 398, 'Blowing permissive  ' + DY('DITL-80A|o|20', 'Y', 'N'))
for y, spec in ((430, 'DITL-80A|i|1'), (470, 'DITL-80A|i|23|neg'), (510, 'DITL-80A|i|22|neg'), (592, 'DITL-80A|i|13'),
                (632, 'DITL-80A|i|14'), (672, 'DITL-80A|i|12'), (754, 'DITL-80S|o|19'), (794, 'DITL-80S|o|24'), (834, 'DITL-80Q|o|3')):
    p.text(1328, y, f'data-dy="{spec}"')
    p.rect(1314, y - 16, f'data-dyr="{spec}"')
p.mach('PIC', hits=[(1370, 56, 110, 20)])
bad = p.check()
assert not bad, bad
p.write('p15-head.js', 'hmi-mock-sb.js')
