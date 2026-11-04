#!/usr/bin/env python3
"""Shared helpers of the mockup annotators (tools/hmi-mock/pNN.py): read the approved temporary HMI mockup SVG
(docs/hmi/mockups/temp/), add ONLY live hooks (data-* attributes for src/ui/plant/hmi-mock.js, transparent click areas, page
links), never change the drawing, and write src/ui/plant/hmi-mock-<name>.js from its head (tools/hmi-mock/<name>-head.js)."""
import re, os, html
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# the mockup pages and their Plant view ids (CW = CWN, the first one)
IDS = {
    'WASfNFFwTtKCn6MYb67QXb': 'CWN', 'FzdN7gLGASa6JDTkyCBSgP': 'MK02', 'QcfpTM5eF6mxRiNutPyy3p': 'MK03', 'KYaMCg7nCLTnEXALKE3WJN': 'MK04',
    'J2D4qvmaQHLmscKQ51xx3x': 'MK05', 'MLuFYtozMSDeQBxeb3Uab7': 'MK06', 'JBq9Y1n3nsFfYH58ByeBMn': 'MK07', 'XEtY7Xhgj132UmaieAVCLh': 'MK08',
    '8KiKvimCrt5D5rHEYy6dS4': 'MK09', 'M3hcqWAzx8B7yyijEpzW8f': 'MK10', '8dqQQkyBod3HRtMEf5hu9e': 'MK11', 'RG2DDWKBS7wkyPAhgQUTk7': 'MK12',
    '8QWx5jwWNWQ4xj5t58X1hK': 'MK13', 'Vw9BytVyewXoTc5T6cUqyj': 'MK14', 'Y6hCvfK5YCMjpSUcks1rs3': 'MK00', '94UPTgfb4xaDSm5VhqvSoi': 'MK15',
    'AoX1jobef4HKX7mvVDkvEJ': 'MK16', 'NUZAQJHuAipNnDwur3Fx8v': 'MK17', 'UKFBXRHbZmZ52NVstCXJm1': 'MK18'}
NAMES = {'Circulating Water': 'CWN', 'Make-Up &amp; Closed Cooling': 'MK02', 'Instrument &amp; Plant Air': 'MK03', 'Turbine Oil': 'MK04',
         'Condensate': 'MK05', 'Feedwater': 'MK06', 'Drum &amp; Main Steam': 'MK07', 'Aux Steam &amp; Vacuum': 'MK08',
         'Air &amp; Flue Gas': 'MK09', 'Purge &amp; Trip': 'MK10', 'Diesel &amp; Burners': 'MK11', 'Coal, Limestone &amp; Sand': 'MK12',
         'Turbine Start': 'MK13', 'ESP &amp; Ash': 'MK14', 'Overview': 'MK00', 'Sootblowers': 'MK15', 'Sampling &amp; Dosing': 'MK16',
         'Generator': 'MK17', 'Extraction &amp; Drains': 'MK18'}
TAG = re.compile(r'^[A-Z]{1,5}-[A-Z]{1,3}\d{3,4}[A-Z0-9-]*$')


class Page:
    def __init__(self, name):
        src = open(os.path.join(ROOT, 'docs/hmi/mockups/temp', name)).read()
        svg = re.search(r'<svg id="dia".*?</svg>', src, re.S).group(0)
        m = re.match(r'<svg[^>]*viewBox="0 0 (\d+) (\d+)"', svg)
        self.w, self.h = int(m.group(1)), int(m.group(2))
        self.s = re.sub(r'^<svg[^>]*>', '', svg)[:-len('</svg>')]
        self.hits = []

    def _one(self, el, x, y):
        pat = re.compile(r'<%s(?=[^>]*\bx="%s")(?=[^>]*\by="%s")([^>]*)>' % (el, x, y))
        ms = list(pat.finditer(self.s))
        assert len(ms) == 1, (el, x, y, len(ms))
        return ms[0]

    def text(self, x, y, attrs):
        m = self._one('text', x, y)
        self.s = self.s[:m.start()] + '<text' + m.group(1) + ' ' + attrs + '>' + self.s[m.end():]

    def rect(self, x, y, attrs):
        m = self._one('rect', x, y)
        a = m.group(1)
        end = '/>' if a.endswith('/') else '>'
        self.s = self.s[:m.start()] + '<rect' + a.rstrip('/') + ' ' + attrs + end + self.s[m.end():]

    def inner(self, x, y, new):
        """replace the content of the <text> at (x, y) (tspans with hooks)"""
        m = self._one('text', x, y)
        e = self.s.index('</text>', m.end())
        self.s = self.s[:m.end()] + new + self.s[e:]

    def sub1(self, old, new):
        assert self.s.count(old) == 1, old
        self.s = self.s.replace(old, new)

    # hooks
    def val(self, x, y, tag, u='', dp=1):
        self.text(x, y, f'data-v="{tag}" data-u="{html.escape(u)}" data-dp="{dp}"')

    def ns(self, x, y):
        self.text(x, y, 'data-ns="1"')

    def mach(self, id, st=None, md=None, vcb=None, ynt=None, ynr=None, hits=(), yn=None, short=False):
        if st: self.text(*st, f'data-st="{id}"' + (' data-short="1"' if short else ''))
        if md: self.text(*md, f'data-md="{id}"')
        if vcb: self.text(*vcb, f'data-vcb="{id}"')
        if ynt: self.text(*ynt, f'data-ynt="{id}"')
        if ynr: self.rect(*ynr, f'data-ynr="{id}"')
        for h in hits: self.hits.append(('hit', id) + tuple(h))
        if yn: self.hits.append(('yn', id) + tuple(yn))

    def links(self):
        """the links of the mockup to the other mockup pages = that page of the Plant view (data-go); "page: X" texts too"""
        def a(m):
            k = m.group(1).rsplit('/', 1)[-1]
            return m.group(2).replace('<text ', f'<text data-go="{IDS[k]}" ', 1)
        self.s = re.sub(r'<a href="(https://claude\.ai/artifact/[A-Za-z0-9]+)"[^>]*>(<text[^>]*>.*?</text>)</a>', a, self.s)
        def p(m):
            n = m.group(2)
            return m.group(1) + (f' data-go="{NAMES[n]}"' if n in NAMES else '') + '>page: ' + n + '</text>'
        self.s = re.sub(r'(<text(?![^>]*data-go)[^>]*)>page: (.*?)</text>', p, self.s)

    def valves(self):
        """every italic tag label (field / manual valves) = data-vt: the runtime opens a faceplate only when fp-pop.js knows it"""
        def f(m):
            t = m.group(2).strip()
            return m.group(1) + (f' data-vt="{t}"' if TAG.match(t) else '') + '>' + m.group(2) + '</text>'
        self.s = re.sub(r'(<text(?![^>]*data-vt)[^>]*font-style="italic"[^>]*)>([^<]*)</text>', f, self.s)

    def check(self, ok=()):
        """a number or a state in white / red / green that has no hook is a snapshot value: not allowed in the app"""
        bad = []
        for m in re.finditer(r'<text([^>]*)>(.*?)</text>', self.s):
            a, t = m.group(1), re.sub('<[^>]+>', '', m.group(2))
            if 'data-' in a or 'data-' in m.group(2): continue
            col = re.search(r'fill="(#[0-9a-f]+)"', a)
            col = col.group(1) if col else ''
            if col in ('#ffffff', '#ff6b6b', '#4fd06a') and (re.search(r'\d', t) or re.search(r'RUNNING|STOPPED|OPEN|CLOSED|TRIP|Remote|Local', t)):
                xy = re.search(r'x="([\d.]+)" y="([\d.]+)"', a)
                key = (xy.group(1), xy.group(2)) if xy else ('?', '?')
                if key not in ok and t not in ok: bad.append((key, t))
        return bad

    def write(self, head, out):
        hits = ''.join(f'<rect data-{k}="{i}" x="{x}" y="{y}" width="{w}" height="{h}" fill="transparent" style="cursor:pointer"></rect>'
                       for k, i, x, y, w, h in self.hits)
        import xml.etree.ElementTree as ET
        ET.fromstring('<svg xmlns="http://www.w3.org/2000/svg">' + (self.s + hits).replace('&nbsp;', ' ') + '</svg>')  # well formed
        art = (self.s + hits).replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
        hd = open(os.path.join(ROOT, 'tools/hmi-mock', head)).read()
        o = hd.replace('/*@@ART@@*/', '`' + art + '`').replace('/*@@W@@*/', str(self.w)).replace('/*@@H@@*/', str(self.h))
        open(os.path.join(ROOT, 'src/ui/plant', out), 'w').write(o)
        print('written src/ui/plant/' + out, len(o))
