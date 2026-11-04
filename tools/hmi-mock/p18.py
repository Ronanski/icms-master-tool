#!/usr/bin/env python3
"""EXTRACTION AND DRAINS, the approved temporary mockup page 18 (docs/hmi/mockups/temp/18-extraction-drains.html) in the app: hooks only
(tools/hmi-mock/mock.py). Shut-off MOVs MV-TS1001 ~ 1005 = DITL-94 ~ 98 (DITL-0D rows 9 ~ 13), drain MOVs MV-TS1391 / 1397 / 1392 / 1396 /
1393 / 1399 / 1398 / 1394 / 1390 / 1395 / 1389 / 1400 = DITL-99 ~ 110 (DITL-0D rows 14 ~ 25): position, OPEN / CLOSED, AUTO / REMOTE
and the MOV faceplate; flash pipe drain XV-FS1005 and level switches LS-FS1410 / 1411 = DITL-57 (inputs 4 / 8); extraction pressures and
temperatures = the logic transmitters, else the plant model (unit.js anFwTagStep: PT-TS1013 / 1017, TT-TS1011; condenser cdP).
NO-SOURCE: the air-assisted check valves XV-TS1700 ~ 1740 (not in the DCS I/O list). Run: python3 tools/hmi-mock/p18.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page, ROOT
p = Page('18-extraction-drains.html')
p.links()
p.valves()
V = lambda tag, dp=1, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
MV = lambda sh, tg, how: f'<tspan data-mov="{sh}|{tg}|{how}">-----</tspan>'
mach = []
# shut-off MOVs: (tag, sheet, label x, label y)
for i, (tg, x, y) in enumerate((('MV-TS1001', 112, 394), ('MV-TS1002', 392, 574), ('MV-TS1003', 662, 609), ('MV-TS1004', 932, 574), ('MV-TS1005', 1202, 574))):
    sh = f'DITL-{94 + i}'
    p.inner(x, y + 16, MV(sh, tg, 'pct') + ' ' + MV(sh, tg, 'oc'))
    p.inner(x, y + 31, MV(sh, tg, 'am'))
    mid = 'S' + tg[-1]
    mach.append(f"      {mid}: {{ n: '{tg}', t: 'Extraction steam No. {i + 1} shut-off valve', mov: '{sh}', tg: '{tg}' }}")
    p.mach(mid, hits=[(x - 110, y - 14, 140, 52)])
# drain MOVs: (tag, sheet, text x, text y, symbol path start)
DR = (('MV-TS1391', 99, 234, 362, 'M211 317'), ('MV-TS1397', 100, 234, 542, 'M211 497'), ('MV-TS1392', 101, 514, 382, 'M491 337'),
      ('MV-TS1396', 102, 514, 542, 'M491 497'), ('MV-TS1393', 103, 784, 382, 'M761 337'), ('MV-TS1399', 104, 784, 542, 'M761 497'),
      ('MV-TS1398', 105, 784, 782, 'M761 737'), ('MV-TS1394', 106, 1054, 382, 'M1031 337'), ('MV-TS1390', 107, 1054, 542, 'M1031 497'),
      ('MV-TS1395', 108, 1324, 382, 'M1301 337'), ('MV-TS1389', 109, 1324, 542, 'M1301 497'))
NO = {99: 1, 100: 1, 101: 2, 102: 2, 103: 3, 104: 3, 105: 3, 106: 4, 107: 4, 108: 5, 109: 5, 110: 3}
for tg, n, x, y, d in DR:
    sh = f'DITL-{n}'
    p.inner(x, y, MV(sh, tg, 'pct') + '  ' + MV(sh, tg, 'oc'))
    p.sub1(f'<path d="{d}', f'<path data-movr="{sh}|{tg}" d="{d}')
    mid = 'D' + tg[-4:]
    mach.append(f"      {mid}: {{ n: '{tg}', t: 'Extraction steam No. {NO[n]} drain valve', mov: '{sh}', tg: '{tg}' }}")
    sx, sy = [int(v) for v in d[1:].split()]
    p.mach(mid, hits=[(sx - 3, sy - 3, 24, 20), (x - 2, y - 30, 110, 34)])
p.inner(590, 980, 'Turbine warming MV-AS1011 and drain MV-AS1394: page 8 · MV-TS1400 (No. 3 extraction drain, ' + MV('DITL-110', 'MV-TS1400', 'pct')
        + ', DITL-110) is not drawn on PD-013 Rev D')
mach.append("      D1400: { n: 'MV-TS1400', t: 'Extraction steam No. 3 drain valve (not on PD-013)', mov: 'DITL-110', tg: 'MV-TS1400' }")
p.mach('D1400', hits=[(980, 966, 220, 18)])
# air-assisted check valves: not in the DCS I/O list
for x, y in ((394, 413), (664, 413), (934, 413), (1204, 413), (664, 681)):
    p.inner(x, y, NS + '<tspan fill="#a9b0b7"> · air-assisted check</tspan>')
# extraction pressures and temperatures
p.inner(162, 186, V('PICR19011', 1) + ' / ' + V('PICR19012', 1) + ' / ' + V('PICR19013', 1, ' kg/cm2'))
p.inner(162, 228, V('TT-TS1011', 0, ' °C'))
for x, pt, tt in ((442, 'PT-TS1013', 'TT-TS1014'), (712, 'PT-TS1017', 'TT-TS1018'), (982, 'PT-TS1022', 'TT-TS1023'), (1252, 'PT-TS1026', 'TT-TS1027')):
    p.inner(x, 210, V(pt, 2, ' kg/cm2'))
    p.inner(x, 250, V(tt, 0, ' °C'))
p.inner(1490, 876, 'condenser ' + V('PT-CD1110', 3, ' kg/cm2 abs'))
# flash pipe (DITL-57)
p.inner(30, 984, MV('DITL-57', 'XV-FS1005', 'oc'))
p.mach('XF', hits=[(26, 952, 190, 38)])
mach.append("      XF: { n: 'XV-FS1005', t: 'Flash pipe drain valve', mov: 'DITL-57', tg: 'XV-FS1005' }")
p.text(234, 966, 'data-dy="DITL-57|i|3"')
p.text(234, 990, 'data-dy="DITL-57|i|7"')
bad = p.check()
assert not bad, bad
head = open(os.path.join(ROOT, 'tools/hmi-mock/p18-head.js')).read()
open(os.path.join(ROOT, 'tools/hmi-mock/p18-head.js'), 'w').write(head.split('    mach: {')[0] + '    mach: {\n' + ',\n'.join(mach) + '\n    },' + head.split('\n    },', 1)[1])
p.write('p18-head.js', 'hmi-mock-ex.js')
