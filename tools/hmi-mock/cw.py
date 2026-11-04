#!/usr/bin/env python3
"""030 CIRCULATING WATER, the approved temporary mockup (docs/hmi/mockups/temp/01-circulating-water.html, JISOO 2026-11-04,
audited by HAEWON) made into the app page: the SVG of the mockup is kept as drawn; this script only adds the live hooks
(data-* attributes, the field valve <g><title>, transparent click areas) and writes src/ui/plant/hmi-mock-cw.js.
Run: python3 tools/hmi-mock/cw.py"""
import re, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src = open(os.path.join(ROOT, 'docs/hmi/mockups/temp/01-circulating-water.html')).read()
svg = re.search(r'<svg id="dia".*?</svg>', src, re.S).group(0)
inner = re.sub(r'^<svg[^>]*>', '', svg)[:-len('</svg>')]


def text_at(x, y, attrs):
    """add attributes to the one <text> at (x, y)"""
    global inner
    pat = re.compile(r'<text(?=[^>]*\bx="%s")(?=[^>]*\by="%s")([^>]*)>' % (x, y))
    ms = list(pat.finditer(inner))
    assert len(ms) == 1, (x, y, len(ms))
    m = ms[0]
    inner = inner[:m.start()] + '<text' + m.group(1) + ' ' + attrs + '>' + inner[m.end():]


def rect_at(x, y, attrs):
    global inner
    pat = re.compile(r'<rect(?=[^>]*\bx="%s")(?=[^>]*\by="%s")([^>]*)>' % (x, y))
    ms = list(pat.finditer(inner))
    assert len(ms) == 1, (x, y, len(ms))
    m = ms[0]
    inner = inner[:m.start()] + '<rect' + m.group(1) + ' ' + attrs + '>' + inner[m.end():]


def sub1(old, new):
    global inner
    assert inner.count(old) == 1, old
    inner = inner.replace(old, new)


# seawater pumps A / B / C: state, REMOTE / LOCAL + AUTO / MAN, breaker, current, permissive Y / N
for k, y0 in (('A', 0), ('B', 150), ('C', 300)):
    i = 'SW' + k
    text_at(40, 184 + y0, f'data-st="{i}"')
    text_at(40, 204 + y0, f'data-md="{i}"')
    text_at(40, 222 + y0, f'data-vcb="{i}"')
    text_at(280, 222 + y0, f'data-v="IIP1501{k}" data-u=" A" data-dp="1"')
    rect_at(200, 196 + y0, f'data-ynr="{i}"')
    text_at(215, 212 + y0, f'data-ynt="{i}"')
# booster pumps A / B / C
for k, dx in (('A', 0), ('B', 140), ('C', 280)):
    i = 'BP' + k
    text_at(1187 + dx, 788, f'data-st="{i}"')
    text_at(1187 + dx, 804, f'data-md="{i}"')
    text_at(1223 + dx, 735, f'data-v="IIP1503{k}" data-u=" A" data-dp="1"')
    rect_at(1187 + dx, 720, f'data-ynr="{i}"')
    text_at(1201 + dx, 735, f'data-ynt="{i}"')
# inlet pool level, condenser inlet / outlet pressure and temperature
text_at(360, 72, 'data-v="LISW1501" data-u=" m" data-dp="2"')
for x, s in ((648, 'A'), (852, 'B')):
    text_at(x, 618, f'data-v="PISW1110{s}1" data-u=" kg/cm2" data-dp="1"')
    text_at(x, 660, f'data-v="TISW1110{s}1" data-u=" °C" data-dp="1"')
    text_at(x, 148, f'data-v="PISW1110{s}2" data-u=" kg/cm2" data-dp="1"')
    text_at(x, 190, f'data-v="TISW1110{s}2" data-u=" °C" data-dp="1"')
# debris filters: DITL-39 outputs (IN OPERATION row 3 / 14, COMMON FAIL row 4 / 15)
text_at(440, 578, 'data-do="DITL-39|3|IN OPERATION|NOT IN OPERATION|run"')
text_at(440, 596, 'data-do="DITL-39|4|COMMON FAIL|Common fail: no|alarm"')
text_at(1522, 538, 'data-do="DITL-39|14|IN OPERATION|NOT IN OPERATION|run"')
text_at(1522, 556, 'data-do="DITL-39|15|COMMON FAIL|Common fail: no|alarm"')
# hypochlorite: P-0762A follows its field start (plant model "hypo"); the others are STN105 status DI with no model = NO-SOURCE
text_at(340, 734, 'data-st="HDA"')
text_at(340, 814, 'data-ns="1"')
sub1('<tspan font-weight="600" fill="#4fd06a">STOPPED</tspan>', '<tspan font-weight="600" fill="#4fd06a" data-ns="1">STOPPED</tspan>')
sub1('<tspan font-weight="600" fill="#e6e6e6">NORMAL</tspan>', '<tspan font-weight="600" fill="#e6e6e6" data-ns="1">NORMAL</tspan>')
# tube cleaning: no running feedback comes back to the DCS (DITL-119 sends the panel its start / stop only) = NO-SOURCE
text_at(1101, 426, 'data-ns="1"')
text_at(1101, 446, 'data-ns="1"')
# the field valves of the plant model (unit.js AN_SW_V0): the field faceplate of fp-pop.js opens on a <g> whose <title> is the tag
FV = {
    'V-SW1002': ('M416 184 L434 198 L434 184 L416 198 Z', 'Seawater pump A discharge'),
    'V-SW1004': ('M416 334 L434 348 L434 334 L416 348 Z', 'Seawater pump B discharge'),
    'V-SW1006': ('M416 484 L434 498 L434 484 L416 498 Z', 'Seawater pump C discharge'),
    'V-SW1007': ('M653 721 L667 739 L653 739 L667 721 Z', 'Condenser path A inlet'),
    'V-SW1008': ('M833 721 L847 739 L833 739 L847 721 Z', 'Condenser path B inlet'),
    'V-SW1009': ('M653 241 L667 259 L653 259 L667 241 Z', 'Condenser path A outlet'),
    'V-SW1010': ('M833 241 L847 259 L833 259 L847 241 Z', 'Condenser path B outlet'),
    'V-SW1016': ('M1158 651 L1172 669 L1158 669 L1172 651 Z', 'Booster pump A discharge'),
    'V-SW1018': ('M1298 651 L1312 669 L1298 669 L1312 651 Z', 'Booster pump B discharge'),
    'V-SW1020': ('M1438 651 L1452 669 L1438 669 L1452 651 Z', 'Booster pump C discharge'),
}
for tag, (d, what) in FV.items():
    sub1(f'<path d="{d}"></path>', f'<g data-fv="{tag}" style="cursor:pointer"><title>{tag} · {what} · field valve, click = field faceplate</title><path d="{d}"></path><rect x="{int(d.split()[0][1:]) - 6}" y="{int(d.split()[1]) - 6}" width="26" height="30" fill="transparent" stroke="none"></rect></g>')
# the links to the other mockup pages = that page of the Plant view (mock.py)
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mock
_pg = mock.Page.__new__(mock.Page)
_pg.s = inner
_pg.links()
inner = _pg.s
# click areas (transparent, on top): the equipment = CONTROL faceplate, the Y / N square = PERMISSIVE · TREND · MONITOR
HIT = []
for k, y0 in (('A', 0), ('B', 150), ('C', 300)):
    HIT.append(('SW' + k, 30, 128 + y0, 280, 114))
    HIT.append(('yn:SW' + k, 196, 192 + y0, 38, 30))
for k, dx in (('A', 0), ('B', 140), ('C', 280)):
    HIT.append(('BP' + k, 1146 + dx, 750, 40, 40))
    HIT.append(('BP' + k, 1185 + dx, 740, 100, 84))
    HIT.append(('yn:BP' + k, 1183 + dx, 716, 36, 28))
HIT += [('DF1', 452, 582, 36, 36), ('DF1', 300, 544, 146, 74), ('DF2', 1527, 522, 36, 36), ('DF2', 1380, 502, 146, 76),
        ('CTA', 925, 412, 190, 22), ('CTB', 925, 432, 190, 22), ('HDA', 182, 690, 172, 62), ('HDB', 182, 770, 172, 62),
        ('HUA', 52, 656, 380, 18)]
hits = ''.join(
    f'<rect data-{"yn" if i.startswith("yn:") else "hit"}="{i[3:] if i.startswith("yn:") else i}" x="{x}" y="{y}" width="{w}" height="{h}" fill="transparent" style="cursor:pointer"></rect>'
    for i, x, y, w, h in HIT)
inner += hits
art = (inner.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${'))
head = open(os.path.join(ROOT, 'tools/hmi-mock/cw-head.js')).read()
out = head.replace('/*@@ART@@*/', '`' + art + '`')
open(os.path.join(ROOT, 'src/ui/plant/hmi-mock-cw.js'), 'w').write(out)
print('written src/ui/plant/hmi-mock-cw.js', len(out))
