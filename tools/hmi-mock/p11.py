#!/usr/bin/env python3
"""DIESEL AND BURNERS, the approved temporary mockup page 11 (docs/hmi/mockups/temp/11-diesel-burners.html) in the app: hooks only
(tools/hmi-mock/mock.py). Pumps DITL-31 / #B; controllers PICDO0005 (PCV-DO0002), HICDO1012 (FCV-DO1012), PICDO1008 (PCV-DO1009),
FIC-OM (oil master), FICDO1043A ~ D (FCV-DO1043-x3), FICFA1043A ~ D (MCV-FA1043-x); transmitters (I/O list) written by boiler.js
AN_DO: LT-DO0701, DPT-DO0001, PT-DO0005, PT-DO1008, IT-P0702A / B, ZT-DO0002 / 1012 / 1009 / 1043-x3, FT-DO1043-x, PT-DO1043-x2,
BT-DO1043-x. Burner IN SERVICE = DITL-10 input row 18 (M.0139 ...), igniter = DITL-10 output row 16 ENERGIZE IGNITER TRANS., oil
shut-off valves = DITL-16 output rows 21 / 23 (VALVE (1) / (2) CLOSED · CRT), atomizing air valve = DITL-07 input row 20 (ATOM. AIR
VALVE OPENED). Run: python3 tools/hmi-mock/p11.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mock import Page
p = Page('11-diesel-burners.html')
p.links()
p.valves()
V = lambda tag, dp=0, u='': f'<tspan data-v="{tag}" data-u="{u}" data-dp="{dp}">-----</tspan>'
NS = '<tspan data-ns="1">-----</tspan>'
C = lambda tag, f, dp=1, u='': f'<tspan data-ctl="{tag}|{f}|{dp}|{u}">-----</tspan>'
MODE = lambda tag: f'<tspan data-ctl="{tag}|mode|U">-----</tspan>'
ST = lambda i: f'<tspan data-st="{i}">-----</tspan>'
MD = lambda i: f'<tspan data-md="{i}">-----</tspan>'
DY = lambda spec, on, off: f'<tspan data-dy="{spec}" data-on="{on}" data-off="{off}">-----</tspan>'
# tank, strainer, pumps
p.inner(130, 440, V('LT-DO0701', 3, ' m'))
p.inner(140, 552, V('DPT-DO0001', 3, ' kg/cm2'))
p.inner(352, 662, ST('PA'))
p.inner(260, 678, V('IT-P0702A', 1, ' A') + ' · ' + MD('PA'))
p.inner(352, 822, ST('PB'))
p.inner(260, 838, V('IT-P0702B', 1, ' A') + ' · ' + MD('PB'))
p.inner(412, 470, V('PT-DO0005', 1, ' kg/cm2'))
p.inner(280, 124, V('ZT-DO0002', 1, ' %') + '  ' + MODE('PICDO0005'))
p.inner(600, 204, V('ZT-DO1012', 1, ' %') + '  ' + MODE('HICDO1012'))
p.inner(640, 864, V('ZT-DO1009', 1, ' %') + '  ' + MODE('PICDO1008'))
p.inner(612, 600, V('PT-DO1008', 1, ' kg/cm2'))
# oil master
p.inner(1566, 40, NS + ' · ' + MODE('FIC-OM'))
p.inner(1254, 60, 'flow PV ' + C('FIC-OM', 'pv') + ' / SV ' + C('FIC-OM', 'sv', 1, ' T/H') + ' · MV ' + C('FIC-OM', 'mv', 1, ' %'))
p.inner(1254, 78, 'Total diesel oil used  ' + NS)
# burners A ~ D (rows 160 apart)
for k, (X, inst) in enumerate((('A', ''), ('B', ' #B'), ('C', ' #C'), ('D', ' #D'))):
    d = 160 * k
    p.inner(910, 344 + d, V(f'FT-DO1043-{X}', 2, ' T/H'))
    p.inner(975, 284 + d, V(f'ZT-DO1043-{X}3', 1, ' %'))
    p.inner(1075, 344 + d, DY(f'DITL-16{inst}|o|20+22|neg', 'OPEN', 'CLOSED'))
    p.inner(1250, 284 + d, V(f'PT-DO1043-{X}2', 1, ' kg/cm2'))
    p.inner(1146, 408 + d, f'XV-PA1043-{X}2 ' + DY(f'DITL-07{inst}|i|20', 'OPEN', 'CLOSED'))
    p.inner(1447, 326 + d, DY(f'DITL-10{inst}|i|18', 'IN SERVICE', 'OFF') + ' · igniter ' + DY(f'DITL-10{inst}|o|15', 'ON', 'OFF'))
    p.inner(1447, 362 + d, V(f'BT-DO1043-{X}', 1, ' %'))
    p.inner(1447, 398 + d, 'air ' + C(f'FICFA1043{X}', 'pv', 1, ' T/H'))
    p.inner(1540, 324 + d, C(f'FICFA1043{X}', 'mv', 1, ' %'))
    side = {'A': 'L', 'B': 'R', 'C': 'L', 'D': 'L'}[X]
    p.inner(1544, 396 + d, MODE(f'FICFA1043{X}') + f' ({side})')
    p.mach('F' + X, hits=[(940, 270 + d, 80, 34)])
    p.mach('A' + X, hits=[(1500, 310 + d, 90, 90)])
# faceplates
for i, x, y, w, h in (('PA', 250, 634, 160, 50), ('PB', 250, 794, 160, 50), ('REC', 230, 110, 100, 20), ('SUP', 550, 190, 100, 20),
                      ('RET', 590, 850, 100, 20), ('OM', 1250, 26, 330, 40)):
    p.mach(i, hits=[(x, y, w, h)])
# the field valves of the diesel oil line-up (Mina beta.92 note: no V-DO0003 on the page). Flow diagram K1AU3-PD-022 1/5 Rev D and
# PR-OPE-5002 section 20; modelled in boiler.js AN_DO.fv0, field faceplate fp-pop.js (a <g> with the tag in its <title>)
FV = (
    ('V-DO0003', 'M123 539 L137 557 L123 557 L137 539 Z', 118, 552, 'end', 'Oil service tank T-0701 outlet'),
    ('V-DO0004', 'M155 593 L169 607 L169 593 L155 607 Z', 162, 622, 'middle', 'Strainer inlet'),
    ('V-DO0015', 'M264 595 L274 605 L274 595 L264 605 Z', 254, 590, 'end', 'Diesel oil pump A suction'),
    ('V-DO0016', 'M264 755 L274 765 L274 755 L264 765 Z', 254, 750, 'end', 'Diesel oil pump B suction'),
    ('V-DO0007', 'M371 593 L385 607 L385 593 L371 607 Z', 371, 624, 'middle', 'Diesel oil pump A discharge'),
    ('V-DO0009', 'M371 753 L385 767 L385 753 L371 767 Z', 371, 784, 'middle', 'Diesel oil pump B discharge'),
)
for tag, d, tx, ty, anc, what in FV:
    p.s += (f'<g data-fv="{tag}" fill="none" stroke="#e6e6e6" stroke-width="1.6" stroke-linejoin="round"><title>{tag} · {what} · '
            f'field valve, click = field faceplate</title><path d="{d}"></path></g>'
            f'<text x="{tx}" y="{ty}" font-size="10" fill="#9aa3ab" text-anchor="{anc}">{tag}</text>')
bad = p.check()
assert not bad, bad
p.write('p11-head.js', 'hmi-mock-db.js')
