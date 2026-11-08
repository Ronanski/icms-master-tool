#!/usr/bin/env python3
"""TURBINE START, the approved temporary mockup page 13 (docs/hmi/mockups/temp/13-turbine-start.html) in the app: hooks only
(tools/hmi-mock/mock.py). ATS steps 1 ~ 8 = tcs.js AN.tcs().step (the last finished step, 0 ~ 7); main steam PT-MS1006 / TT-MS1007
(logic AI); CV = unit.js U.gv, ICV = U.tb.icv, speed U.rpm; generator MW GCP-AI1001 / 1002 (I/O list AI0419 / AI0774); 52G1 = DITL-03E
input row 3 M.3220 52G1 OPEN (NOT = closed); oil = AN.unit (loMop / loCop / loEopR as page 04, loLube / loCtl / loTrip / loEop / loBrg /
loCoolOut); exhaust hood / shell expansion = AN.tcs() Tx / sexp, condenser U.cdP. e6 (2026-11-08): the shut-down step and the turbine
protection band (y 1020 ~ 1400) carry their hooks in the mockup source itself (data-tpb / data-tt / data-tfo, hmi-mock.js). Run: python3 tools/hmi-mock/p13.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('13-turbine-start.html')
p.links()
p.valves()
V = lambda tag, dp=0, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
UY = lambda k, n, on, off: f'<tspan data-uy="{k}|{n}|{on}|{off}">-----</tspan>'
# ATS steps
# the start-up mode of the TCS (tcs.js TCS.modes: AMBIENT COLD, COLD 1, COLD 2, WARM, HOT), text of the plant model (hmi-mock.js data-ut)
p.sub1('Automatic turbine start-up (ATS) steps</text>', 'Automatic turbine start-up (ATS) steps</text><text x="1576" y="34" font-size="14" fill="#a9b0b7" text-anchor="end">start-up mode <tspan data-ut="tcs.mode" font-weight="600" fill="#ffffff">-----</tspan></text>')
for i, x in enumerate((166, 358, 550, 742, 934, 1126, 1318, 1510)):
    spec = f'tcs.step|{i}|Y|N' if i < 8 else 'tcs.st9|1|Y|N'  # step 9 SHUT-DOWN stays Y after its trip (tcs.js st9)
    p.text(x, 170, f'data-uy="{spec}"')
    p.rect(x - 14, 154, f'data-uyr="{spec}"')
# turbine and generator
p.inner(30, 492, V('PT-MS1006', 1, ' kg/cm2') + ' · ' + V('TT-MS1007', 0, ' °C'))
MS = 'tcs.rst|1|OPEN|CLOSED'  # MSV / RSV open = the turbine reset (tcs.js c.rst, ATS criteria 1.21 MSV OPEN)
p.inner(150, 436, UY(*MS.split('|')) + ' / ' + UY(*MS.split('|')))
p.inner(260, 436, V('ZI-CV', 1, ' %'))
p.inner(610, 362, 'RSV A / B  ' + UY(*MS.split('|')) + ' / ' + UY(*MS.split('|')))
p.inner(704, 362, 'ICV A / B  ' + V('ZI-ICV', 1, ' %'))
p.inner(1010, 482, V('GCP-AI1001', 1, ' MW'))
p.inner(940, 550, 'speed ' + V('SI-TB', 0, ' rpm'))
p.text(1140, 502, 'data-dy="DITL-03E|i|2|neg" data-on="CLOSED" data-off="OPEN"')
p.rect(1128, 458, 'data-dyr="DITL-03E|i|2|neg"')
# DS = MIG-52G1-3 (as page 17), 52L1 = DITL-03E input 2 (M.3221, NOT = closed)
p.inner(1250, 502, '<tspan data-di="MIG-52G1-3|CLOSED|OPEN">-----</tspan>')
p.rect(1238, 458, 'data-dir="MIG-52G1-3"')
p.inner(1360, 502, '<tspan data-dy="DITL-03E|i|1|neg" data-on="CLOSED" data-off="OPEN">-----</tspan>')
p.rect(1348, 458, 'data-dyr="DITL-03E|i|1|neg"')
# the generator model (unit.js anGenEl), as page 17
p.inner(1060, 560, 'field breaker ' + UY('gen.fcb', 1, 'CLOSED', 'OPEN') + ' · field ' + V('GEN.VF', 1) + ' V DC, ' + V('GEN.IF', 1) + ' A')
p.inner(1060, 578, V('GEN.KV', 1) + ' kV · ' + V('GEN.KA', 2) + ' kA · ' + V('GEN.HZ', 1) + ' Hz · ' + V('GEN.MVAR', 1) + ' MVar · power factor ' + V('GEN.PF', 3))
# ATS monitoring criteria
p.inner(554, 708, 'Vibration high · ' + V('VIST-MAX', 3) + ' mm')  # tcs.js U.loVt, snapshot P35SHAFT
p.inner(554, 744, 'Differential expansion high · ' + NS + ' mm')
p.inner(554, 780, 'Exhaust hood temperature high · ' + V('TT-HOOD', 0, ' °C'))
p.inner(554, 816, 'Condenser vacuum low · ' + V('PT-CD', 3, ' kg/cm2 abs'))
p.inner(554, 852, 'Bearing oil pressure low · ' + V('PT-BRG', 1, ' kg/cm2'))
p.inner(554, 924, 'Shell expansion ' + V('ZI-SEXP', 1, ' mm') + ' · rotor position ' + NS + ' mm')
p.inner(554, 960, 'Thrust bearing ' + V('TIST-THF') + ' / ' + V('TIST-THR') + ' °C')  # front / rear, tcs.js loThF / loThR
# oil and generator now
p.inner(1094, 708, 'Main oil pump A ' + UY('loMop.0', 1, 'running', 'stopped') + ', discharge ' + V('PT-LUBE', 1, ' kg/cm2'))
p.inner(1094, 744, 'Control oil pump B ' + UY('loCop.1', 1, 'running', 'stopped') + ', ' + V('PT-CTL', 1, ' kg/cm2'))
p.inner(1094, 759, 'PTLO1931B · pump A ' + UY('loCop.0', 1, 'running', 'stopped'))
p.inner(1094, 780, 'Emergency oil pump ' + UY('loEopR', 1, 'running', 'stopped') + ', ' + V('PT-EOP', 1, ' kg/cm2'))
p.inner(1094, 816, 'Control oil / trip oil ' + V('PT-CTL', 1) + ' / ' + V('PT-TRIP', 1, ' kg/cm2'))
p.inner(1094, 852, 'Lube oil after cooler ' + V('TT-LOCOOL', 0, ' °C'))
p.inner(1094, 888, 'Generator MW C / D ' + V('GCP-AI1001', 1) + ' / ' + V('GCP-AI1002', 1, ' MW'))
p.inner(1094, 924, 'Stator coil ' + V('GEN.TSMAX') + ' °C')  # unit.js anGenTemp, snapshot P35SHAFT
p.inner(1094, 960, 'Generator cooling air ' + V('GEN.TAIR') + ' °C')
# Mina 2026-11-08 #4: at Fit with the dock open (1366 x 768) the page is drawn at ~0.43 and the 11 ~ 14 px text was ~5 ~ 6 px on the
# screen. The lamp band (the 8 ATS steps, y 140 ~ 230) and the three check lists (x 24 / 554 / 1094, y 700 ~ 980) get a bigger font in the
# same style (colour, weight, place); the second line of a check item moves down 3 with its bigger font. The columns take it (the longest
# item, 53 characters at 17, is ~470 of 530).
import re
def _big(m):
    a = m.group(1)
    x = float(re.search(r' x="([\d.]+)"', a).group(1))
    y = float(re.search(r' y="([\d.]+)"', a).group(1))
    fs = int(re.search(r' font-size="(\d+)"', a).group(1))
    if 140 <= y <= 230:
        nf = {14: 20, 12: 15, 11: 13}.get(fs, fs)
    elif 700 <= y <= 980 and x in (24.0, 554.0, 1094.0):
        nf = {12: 17, 11: 14}.get(fs, fs)
        if fs == 11:
            a = re.sub(r' y="[\d.]+"', f' y="{y + 3:g}"', a, count=1)
    else:
        return m.group(0)
    return '<text' + re.sub(r' font-size="\d+"', f' font-size="{nf}"', a, count=1) + '>'
p.s = re.sub(r'<text((?=[^>]* x="[\d.]+")(?=[^>]* y="[\d.]+")(?=[^>]* font-size="\d+")[^>]*)>', _big, p.s)
bad = p.check()
assert not bad, bad
p.write('p13-head.js', 'hmi-mock-ts.js')
