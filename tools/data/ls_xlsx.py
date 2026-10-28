"""Limestone injection logic (limestone_logic.xls, ROTOFEED, station 104) -> DITL sheets of the app.

The drawing is an Excel sheet: the wires and the block outlines are CELL BORDERS, the negation circles, the junction dots, the
>=1 glyph and a few wires are drawing objects, the texts are cell values. This reads the LibreOffice .xlsx copy of the .xls
(soffice --headless --convert-to xlsx) and writes one sheet object per logic sheet (the same object the DITL reader makes from a
DXF), with the blocks (sh.lsg) read here: AND (&), OR (>=1), time delay (t1 / t2), pulse (PO), compare (X >= Y), SET / RESET,
and the negation circles. Usage: python3 tools/data/ls_xlsx.py <xlsx folder> <out.json>
"""
import sys, re, json, bisect, os, xml.etree.ElementTree as ET

# ---------- the .xlsx reader: cell grid, texts, borders, drawing shapes (EMU) ----------

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
      'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
RID = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'


def col_ix(ref):
    m = re.match(r'([A-Z]+)(\d+)', ref)
    c = 0
    for ch in m.group(1):
        c = c * 26 + ord(ch) - 64
    return c - 1, int(m.group(2)) - 1


class Book:
    def __init__(self, root):
        self.root = root
        wb = ET.parse(os.path.join(root, 'xl/workbook.xml')).getroot()
        rel = ET.parse(os.path.join(root, 'xl/_rels/workbook.xml.rels')).getroot()
        rmap = {r.get('Id'): r.get('Target') for r in rel}
        self.sheets = [(s.get('name'), 'xl/' + rmap[s.get(RID)]) for s in wb.find('m:sheets', NS)]
        ss = ET.parse(os.path.join(root, 'xl/sharedStrings.xml')).getroot()
        self.sst = [''.join(t.text or '' for t in si.iter('{%s}t' % NS['m'])) for si in ss]
        st = ET.parse(os.path.join(root, 'xl/styles.xml')).getroot()
        self.fonts = []
        for f in st.find('m:fonts', NS):
            sz = f.find('m:sz', NS)
            self.fonts.append(float(sz.get('val')) if sz is not None else 10)
        self.borders = []
        for b in st.find('m:borders', NS):
            d = {}
            for side in ('left', 'right', 'top', 'bottom'):
                e = b.find('m:' + side, NS)
                if e is not None and e.get('style'):
                    d[side] = e.get('style')
            self.borders.append(d)
        self.xf = []
        for x in st.find('m:cellXfs', NS):
            al = x.find('m:alignment', NS)
            self.xf.append({'font': int(x.get('fontId', 0)), 'border': int(x.get('borderId', 0)),
                            'h': al.get('horizontal') if al is not None else None,
                            'v': al.get('vertical') if al is not None else None,
                            'wrap': al is not None and al.get('wrapText') in ('true', '1')})

    def sheet(self, name):
        path = dict(self.sheets)[name]
        return Sheet(self, os.path.join(self.root, path))


class Sheet:
    def __init__(self, bk, path):
        root = ET.parse(path).getroot()
        fmt = root.find('m:sheetFormatPr', NS)
        dcw = float(fmt.get('defaultColWidth', 9.14))
        drh = float(fmt.get('defaultRowHeight', 12.75))
        cw = {}
        cols = root.find('m:cols', NS)
        if cols is not None:
            for c in cols:
                for i in range(int(c.get('min')) - 1, int(c.get('max'))):
                    cw[i] = float(c.get('width'))
        rh = {}
        self.cells = {}
        for r in root.find('m:sheetData', NS):
            ri = int(r.get('r')) - 1
            if r.get('ht'):
                rh[ri] = float(r.get('ht'))
            for c in r:
                ci, _ = col_ix(c.get('r'))
                v = c.find('m:v', NS)
                t = c.get('t')
                txt = None
                if v is not None:
                    txt = bk.sst[int(v.text)] if t == 's' else v.text
                    if t != 's' and txt is not None:
                        try:
                            f = float(txt)
                            txt = str(int(f)) if f == int(f) else txt
                        except ValueError:
                            pass
                is_ = c.find('m:is', NS)
                if is_ is not None:
                    txt = ''.join(x.text or '' for x in is_.iter('{%s}t' % NS['m']))
                self.cells[(ri, ci)] = {'t': txt, 'xf': bk.xf[int(c.get('s', 0))]}
        self.merges = []
        mc = root.find('m:mergeCells', NS)
        if mc is not None:
            for m in mc:
                a, b = m.get('ref').split(':')
                c0, r0 = col_ix(a)
                c1, r1 = col_ix(b)
                self.merges.append((r0, c0, r1, c1))
        K = 70364  # EMU per character of column width (fitted on the drawing anchors)
        self.cx = [0]
        for i in range(300):
            self.cx.append(self.cx[-1] + cw.get(i, dcw) * K + (6000 if i == 0 else 0))
        self.ry = [0]
        for i in range(400):
            self.ry.append(self.ry[-1] + rh.get(i, drh) * 12700)
        self.borders = bk.borders
        # drawing
        self.shapes = []
        rel = os.path.join(os.path.dirname(path), '_rels', os.path.basename(path) + '.rels')
        if os.path.exists(rel):
            for r in ET.parse(rel).getroot():
                if r.get('Type').endswith('/drawing'):
                    dp = os.path.normpath(os.path.join(os.path.dirname(path), r.get('Target')))
                    self._drawing(ET.parse(dp).getroot())
        # calibrate the columns on the anchors (LibreOffice writes both)
        self._calib(path)

    def _calib(self, path):
        pass

    def _drawing(self, root):
        for an in root:
            for ch in an:
                tag = ch.tag.split('}')[1]
                if tag in ('sp', 'grpSp', 'cxnSp'):
                    self._shape(ch, None)

    def _shape(self, e, T):
        tag = e.tag.split('}')[1]
        if tag == 'grpSp':
            x = e.find('xdr:grpSpPr/a:xfrm', NS)
            off = x.find('a:off', NS); ext = x.find('a:ext', NS)
            co = x.find('a:chOff', NS); ce = x.find('a:chExt', NS)
            ox, oy, ex, ey = [int(v) for v in (off.get('x'), off.get('y'), ext.get('cx'), ext.get('cy'))]
            cx, cy, cex, cey = [int(v) for v in (co.get('x'), co.get('y'), ce.get('cx'), ce.get('cy'))]
            sx = ex / cex if cex else 1
            sy = ey / cey if cey else 1
            T2 = (lambda X, Y, ox=ox, oy=oy, cx=cx, cy=cy, sx=sx, sy=sy: (ox + (X - cx) * sx, oy + (Y - cy) * sy))
            T3 = T2 if T is None else (lambda X, Y, T2=T2, T=T: T(*T2(X, Y)))
            for ch in e:
                t = ch.tag.split('}')[1]
                if t in ('sp', 'grpSp', 'cxnSp'):
                    self._shape(ch, T3)
            return
        sp = e.find('xdr:spPr', NS)
        x = sp.find('a:xfrm', NS)
        if x is None:
            return
        off = x.find('a:off', NS); ext = x.find('a:ext', NS)
        X, Y, W, H = int(off.get('x')), int(off.get('y')), int(ext.get('cx')), int(ext.get('cy'))
        p0, p1 = (X, Y), (X + W, Y + H)
        if T:
            p0, p1 = T(*p0), T(*p1)
        fh, fv = x.get('flipH') == '1', x.get('flipV') == '1'
        pg = sp.find('a:prstGeom', NS)
        prst = pg.get('prst') if pg is not None else 'custom'
        fill = sp.find('a:solidFill/a:srgbClr', NS)
        nofill = sp.find('a:noFill', NS) is not None
        ln = sp.find('a:ln', NS)
        lnno = ln is not None and ln.find('a:noFill', NS) is not None
        dash = ln.find('a:prstDash', NS).get('val') if ln is not None and ln.find('a:prstDash', NS) is not None else None
        head = tail = None
        if ln is not None:
            if ln.find('a:headEnd', NS) is not None:
                head = ln.find('a:headEnd', NS).get('type')
            if ln.find('a:tailEnd', NS) is not None:
                tail = ln.find('a:tailEnd', NS).get('type')
        txt = ' '.join(''.join(t.text or '' for t in p.iter('{%s}t' % NS['a'])) for p in e.iter('{%s}p' % NS['a'])).strip()
        self.shapes.append({'k': prst, 'x0': min(p0[0], p1[0]), 'y0': min(p0[1], p1[1]), 'x1': max(p0[0], p1[0]), 'y1': max(p0[1], p1[1]),
                            'fh': fh, 'fv': fv, 'fill': fill.get('val') if fill is not None else None, 'nofill': nofill,
                            'lnno': lnno, 'dash': dash, 'head': head, 'tail': tail, 'txt': txt,
                            'name': e.find('.//xdr:cNvPr', NS).get('name')})


# ---------- the geometry in DITL units (row pitch 9, y up): wires, frame, texts, circles, dots ----------

K = 9 / 266700.0  # units per EMU (one LINE = 4 rows of 5.25 pt = 9 units, like the DITL row pitch)
L0, L1 = 6, 32  # logic area: column lines 6 .. 32 (left table cols 1..5, right table cols 32..39)
R0, R1 = 5, 89  # logic rows 5 .. 88


def X(s, emu):
    return round(emu * K, 3)


def Y(s, emu):
    return round(-emu * K, 3)


def edges(s):
    """unit border edges, Excel semantics: an edge is drawn when either cell beside it has it"""
    H, V = {}, {}
    rank = {'hair': 1, 'thin': 2, 'medium': 3, 'double': 3, 'thick': 4}
    for (r, c), x in s.cells.items():
        b = s.borders[x['xf']['border']]
        for side, st in b.items():
            if side == 'top':
                k = (r, c); d = H
            elif side == 'bottom':
                k = (r + 1, c); d = H
            elif side == 'left':
                k = (c, r); d = V
            else:
                k = (c + 1, r); d = V
            if rank.get(st, 0) > rank.get(d.get(k), 0):
                d[k] = st
    for r0, c0, r1, c1 in s.merges:
        for r in range(r0 + 1, r1 + 1):
            for c in range(c0, c1 + 1):
                H.pop((r, c), None)
        for c in range(c0 + 1, c1 + 1):
            for r in range(r0, r1 + 1):
                V.pop((c, r), None)
    return H, V


def runs(keys):
    """merge unit edges (line, i) into runs (line, i0, i1)"""
    by = {}
    for a, i in keys:
        by.setdefault(a, []).append(i)
    out = []
    for a, L in by.items():
        L.sort()
        i0 = p = L[0]
        for i in L[1:]:
            if i != p + 1:
                out.append((a, i0, p + 1)); i0 = i
            p = i
        out.append((a, i0, p + 1))
    return out


def geometry(s):
    H, V = edges(s)
    inL = lambda c: L0 <= c < L1
    ln = []  # [x1, y1, x2, y2, layer]
    # logic wires: thin edges inside the logic area (not on its frame lines); hair = the printed grid, frame
    hw = [(r, c) for (r, c), st in H.items() if inL(c) and R0 < r < R1 and st != 'hair']
    vw = [(c, r) for (c, r), st in V.items() if L0 < c < L1 and R0 <= r < R1 and st != 'hair']
    for r, c0, c1 in runs(hw):
        ln.append([X(s, s.cx[c0]), Y(s, s.ry[r]), X(s, s.cx[c1]), Y(s, s.ry[r]), 'CON'])
    for c, r0, r1 in runs(vw):
        ln.append([X(s, s.cx[c]), Y(s, s.ry[r0]), X(s, s.cx[c]), Y(s, s.ry[r1]), 'CON'])
    used_h = set(hw); used_v = set(vw)
    fh = [k for k in H if k not in used_h]
    fv = [k for k in V if k not in used_v]
    for r, c0, c1 in runs(fh):
        ln.append([X(s, s.cx[c0]), Y(s, s.ry[r]), X(s, s.cx[c1]), Y(s, s.ry[r]), 'FRM'])
    for c, r0, r1 in runs(fv):
        ln.append([X(s, s.cx[c]), Y(s, s.ry[r0]), X(s, s.cx[c]), Y(s, s.ry[r1]), 'FRM'])
    return ln


def shapes(s):
    """drawing objects: lines (wires, the >= glyph), ellipses (black = junction dot, white = negation circle), rectangles"""
    ln, ci, dots, rect, stx = [], [], [], [], []
    for sh in s.shapes:
        x0, y0, x1, y1 = X(s, sh['x0']), Y(s, sh['y0']), X(s, sh['x1']), Y(s, sh['y1'])
        if sh['k'] == 'line':
            a, b = (x1, x0) if sh['fh'] else (x0, x1)
            c, d = (y1, y0) if sh['fv'] else (y0, y1)
            ln.append([a, c, b, d, 'CON', sh['head'], sh['tail']])
        elif sh['k'] == 'ellipse':
            cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, max(abs(x1 - x0), abs(y1 - y0)) / 2
            if sh['fill'] and sh['fill'].lower() == '000000':
                dots.append([round(cx, 3), round(cy, 3), round(r, 3)])
            else:
                ci.append([round(cx, 3), round(cy, 3), round(r, 3)])
        elif sh['k'] == 'rect':
            rect.append({'x1': min(x0, x1), 'x2': max(x0, x1), 'y1': min(y0, y1), 'y2': max(y0, y1), 'txt': sh['txt'], 'lnno': sh['lnno']})
    return ln, ci, dots, rect


def merged(s):
    m = {}
    for r0, c0, r1, c1 in s.merges:
        m[(r0, c0)] = (r1, c1)
    return m


def texts(s, bk):
    out = []
    M = merged(s)
    for (r, c), x in s.cells.items():
        t = (x['t'] or '').strip()
        if not t:
            continue
        r1, c1 = M.get((r, c), (r, c))
        xl, xr = s.cx[c], s.cx[c1 + 1]
        yt, yb = s.ry[r], s.ry[r1 + 1]
        sz = bk.fonts[x['xf']['font']]
        h = sz * 12700 * K * 0.8
        al = x['xf']['h']
        num = t.replace('.', '', 1).isdigit() and x['t'] == t
        if al is None:
            al = 'right' if num else 'left'
        pad = 15000
        if al in ('center', 'centerContinuous'):
            tx, a = (xl + xr) / 2, 1
        elif al == 'right':
            tx, a = xr - pad, 2
        else:
            tx, a = xl + pad, 0
        va = x['xf']['v'] or 'bottom'
        if va == 'center':
            ty = (yt + yb) / 2 + h / K / 2
        elif va == 'top':
            ty = yt + h / K * 1.15
        else:
            ty = yb - 12000
        # a wrapped text (wrapText) in a box too narrow for it: one text per line, centred on the box like the drawing
        lines = [t]
        wid = (xr - xl) * K
        if x['xf'].get('wrap') and len(t) * h * 0.62 > wid:
            lines, cur = [], ''
            for w in t.split():
                if cur and len(cur + ' ' + w) * h * 0.62 > wid:
                    lines.append(cur)
                    cur = w
                else:
                    cur = (cur + ' ' + w).strip()
            lines.append(cur)
        if len(lines) > 1:
            lh = h * 1.25
            top = (yt + yb) / 2 * K - lh * (len(lines) - 1) / 2 + h / 2 if va == 'center' else yt * K + h * 1.15
            for k, li in enumerate(lines):
                out.append({'t': li, 'x': X(s, tx), 'y': round(-(top + k * lh), 3), 'h': round(h, 3), 'a': a, 'r': r, 'c': c, 'r1': r1, 'c1': c1})
            continue
        out.append({'t': t, 'x': X(s, tx), 'y': Y(s, ty), 'h': round(h, 3), 'a': a, 'r': r, 'c': c, 'r1': r1, 'c1': c1})
    return out


# ---------- the blocks, the wires and the sheet object ----------

WL, WR = 7, 32  # wires between the column lines 7 (end of the input table) and 32 (start of the output table)
RT0, RB0 = 5, 89  # logic rows
TSEED = re.compile(r'^(\d+)\s*(s|S|SEC)$')


def ux(s, c):
    return round(s.cx[c] * K, 3)


def uy(s, r):
    return round(-s.ry[r] * K, 3)


def cell_at(s, xu, yu):
    return bisect.bisect_right(s.ry, -yu / K) - 1, bisect.bisect_right(s.cx, xu / K) - 1


def wire_sets(s):
    H, V = edges(s)
    h = {k for k, st in H.items() if st != 'hair' and WL <= k[1] < WR and RT0 < k[0] < RB0}
    v = {k for k, st in V.items() if st != 'hair' and WL < k[0] < WR and RT0 <= k[1] < RB0}
    return H, V, h, v


def find_box(h, v, r, c, need=None, widest=False, maxw=6):
    """fully bordered rectangle around cell (r, c) (and cell `need`): narrowest first (a gate is 1 or 2 columns), or the widest
    (a time delay box: its t1 and t2 cells are bordered inside)"""
    cand = []
    for cl in range(c, max(WL - 1, c - maxw), -1):
        if (cl, r) not in v:
            continue
        for cr in range(c + 1, min(WR + 1, c + maxw + 1)):
            if (cr, r) not in v:
                continue
            if need and not (cl <= need[1] < cr):
                continue
            rt = r
            while (cl, rt - 1) in v and (cr, rt - 1) in v:
                rt -= 1
            rb = r + 1
            while (cl, rb) in v and (cr, rb) in v:
                rb += 1
            top = next((t for t in range(rt, r + 1) if all((t, x) in h for x in range(cl, cr))), None)
            bot = next((b for b in range(rb, r, -1) if all((b, x) in h for x in range(cl, cr))), None)
            if top is None or bot is None:
                continue
            if need and not (top <= need[0] < bot):
                continue
            cand.append((cr - cl, bot - top, top, bot, cl, cr))
    if not cand:
        return None
    cand.sort(key=lambda q: (-q[0] * q[1]) if widest else (q[0], -q[1]))
    w, hh, top, bot, cl, cr = cand[0]
    return {'rt': top, 'rb': bot, 'cl': cl, 'cr': cr}


def convert(bk, name, code):
    s = bk.sheet(name)
    H, V, h, v = wire_sets(s)
    sl, ci, dots, rect = shapes(s)
    T = texts(s, bk)
    cellT = {(t['r'], t['c']): t for t in T}
    # ---------- blocks ----------
    seeds = []
    for t in T:
        if not (WL <= t['c'] < WR and RT0 <= t['r'] < RB0):
            continue
        x = t['t'].strip()
        if x == '&':
            seeds.append(('AND', t['r'], t['c'], t))
        elif TSEED.match(x) and not any(u['c'] == t['c'] and 0 < u['r'] - t['r'] <= 3 and u['t'].strip() == 'PO' for u in T):  # not the time of a PO
            seeds.append(('TMR', t['r'], t['c'], t))
        elif re.match(r'^X\s*(>=|/|£|<=)\s*Y$', x):
            seeds.append(('CMP', t['r'], t['c'], t))
        elif x == 'PO':
            seeds.append(('PO', t['r'], t['c'], t))
        elif x == 'R':
            seeds.append(('FF', t['r'], t['c'], t))
    for q in rect:
        if re.match(r'^1(\s+1)*$', q['txt'].strip()):  # '1 1 1 1' (LS50): the text box of the >=1 glyph repeats the 1
            r, c = cell_at(s, (q['x1'] + q['x2']) / 2, (q['y1'] + q['y2']) / 2)
            seeds.append(('OR', r, c, q))
    G = []
    for k, r, c, t in seeds:
        if k == 'TMR':
            z = next((u for u in T if u['r'] == r and c < u['c'] <= c + 3 and u['t'].strip() == '0'), None)
            bx = find_box(h, v, r, c, need=(r, z['c']) if z else None, widest=True)
        elif k == 'CMP':
            bx = find_box(h, v, r, c, need=(r + 8, c), widest=True)
        else:
            bx = find_box(h, v, r, c)
        if not bx:
            print('NO BOX', name, k, r, c, file=sys.stderr)
            continue
        key = (bx['rt'], bx['rb'], bx['cl'], bx['cr'])
        if any((g['rt'], g['rb'], g['cl'], g['cr']) == key for g in G):
            continue
        g = dict(bx, t=k, seed=(r, c))
        if k == 'TMR':
            g['t1'] = int(TSEED.match(t['t'].strip()).group(1))
            g['t2'] = 0
        G.append(g)
    # a box with a negation circle and no symbol = NEGATE
    for q in ci:
        r, c = cell_at(s, q[0] + q[2] + 0.6, q[1])
        if any(g['rt'] <= r < g['rb'] and g['cl'] <= c < g['cr'] for g in G):
            continue
        bx = find_box(h, v, r, c)
        if bx and bx['rb'] - bx['rt'] <= 6:
            G.append(dict(bx, t='OR', neg=1, seed=(r, c)))  # the NEGATE box: its circle is the NOT
    # ---------- the block outlines are not wires ----------
    box_h, box_v = set(), set()
    for g in G:
        for r in range(g['rt'], g['rb'] + 1):
            for c in range(g['cl'], g['cr']):
                box_h.add((r, c))
        for c in range(g['cl'], g['cr'] + 1):
            for r in range(g['rt'], g['rb']):
                box_v.add((c, r))
    wh = h - box_h
    wv = v - box_v
    # a vertical wire is drawn with small gaps on some rows (cell borders missing): gaps up to 2 rows are the same wire
    byc = {}
    for c, r in wv:
        byc.setdefault(c, set()).add(r)
    for c, rs in byc.items():
        L = sorted(rs)
        for a, b in zip(L, L[1:]):
            if 1 < b - a <= 3 and not any((c, x) in box_v for x in range(a + 1, b)):
                for x in range(a + 1, b):
                    wv.add((c, x))
    # the label of a timer written on a wire ("TR400", "TR401": the HMI push button pulse) is a bordered cell: its top and sides
    # are not wires (the bottom border is the wire)
    M = {(a, b): (c, d) for a, b, c, d in s.merges}
    for t in T:
        if re.match(r'^TR\s?\d{3}$', t['t'].strip()) and WL <= t['c'] < WR:
            r1, c1 = M.get((t['r'], t['c']), (t['r'], t['c']))
            for c in range(t['c'], c1 + 1):
                wh.discard((t['r'], c))
            for cc in (t['c'], c1 + 1):
                # a side that goes on above or below the label is a wire (LS210 TR419: the timer input comes down the left side)
                if (cc, t['r'] - 1) in wv or (cc, r1 + 1) in wv:
                    continue
                for r in range(t['r'], r1 + 1):
                    wv.discard((cc, r))
    # a vertical wire that stops on a horizontal wire without a junction dot goes on (the dashed verticals of the drawing: the cell
    # borders are missing on some rows); it joins the next piece of the same column
    dotc = [(d[0], d[1]) for d in dots]
    isdot = lambda x, y: any(abs(a - x) < 0.8 and abs(b - y) < 0.8 for a, b in dotc)
    for _ in range(40):
        ch = False
        HR = runs(wh)
        onH = lambda c, r: any(rr == r and c0 < c < c1 for rr, c0, c1 in HR)
        for c, r0, r1 in runs(list(wv)):
            for end, d in ((r0, -1), (r1, 1)):
                touch = any(rr == end and c0 <= c <= c1 for rr, c0, c1 in HR)
                # it goes on when it stops on a horizontal wire without a dot, or when its end touches nothing
                if touch and (not onH(c, end) or isdot(ux(s, c), uy(s, end))):
                    continue
                nxt = sorted(r for (cc, r) in wv if cc == c and ((d > 0 and r >= end) or (d < 0 and r < end)))
                if not nxt:
                    continue
                tgt = nxt[0] if d > 0 else nxt[-1] + 1
                for x in (range(end, tgt) if d > 0 else range(tgt, end)):
                    if (c, x) not in box_v:
                        wv.add((c, x))
                ch = True
        if not ch:
            break
    ln = []
    for r, c0, c1 in runs(wh):
        ln.append([ux(s, c0), uy(s, r), ux(s, c1), uy(s, r), 'CON'])
    for c, r0, r1 in runs(list(wv)):
        ln.append([ux(s, c), uy(s, r0), ux(s, c), uy(s, r1), 'CON'])
    # the frame and the table: thin / medium lines; the hair lines (sub-row lines of the table) are drawn dashed (HID)
    for lay, hair in (('FRM', False), ('HID', True)):
        for r, c0, c1 in runs([k for k in H if k not in h and (H[k] == 'hair') == hair]):
            ln.append([ux(s, c0), uy(s, r), ux(s, c1), uy(s, r), lay])
        for c, r0, r1 in runs([k for k in V if k not in v and (V[k] == 'hair') == hair]):
            ln.append([ux(s, c), uy(s, r0), ux(s, c), uy(s, r1), lay])
    for g in G:
        g.update(x1=ux(s, g['cl']), x2=ux(s, g['cr']), y2=uy(s, g['rt']), y1=uy(s, g['rb']))
    GX = [ux(s, c) for c in range(0, 45)]
    GY = [uy(s, r) for r in range(0, 100)]
    snap = lambda v, G, e=0.3: min(G, key=lambda g: abs(g - v)) if min(abs(g - v) for g in G) <= e else v
    inbox = lambda x, y, g, e=0.3: g['x1'] - e <= x <= g['x2'] + e and g['y1'] - e <= y <= g['y2'] + e
    for g in G:
        ln.append([g['x1'], g['y1'], g['x2'], g['y1'], 'BOX'])
        ln.append([g['x1'], g['y2'], g['x2'], g['y2'], 'BOX'])
        ln.append([g['x1'], g['y1'], g['x1'], g['y2'], 'BOX'])
        ln.append([g['x2'], g['y1'], g['x2'], g['y2'], 'BOX'])
    for q in sl:
        lay = 'BOX' if any(inbox(q[0], q[1], g) and inbox(q[2], q[3], g) for g in G) else 'CON'
        if lay == 'CON':
            # a drawing-object line is placed a little off the cell grid: snap it to the nearest column / row line
            q = [snap(q[0], GX), snap(q[1], GY), snap(q[2], GX), snap(q[3], GY)]
        ln.append([q[0], q[1], q[2], q[3], lay])
    # the dashed verticals (drawing-object pieces and cell borders in the same column): pieces with small gaps are one wire
    vx = {}
    for q in ln:
        if q[4] == 'CON' and abs(q[0] - q[2]) < 0.05 and abs(q[1] - q[3]) > 0.05:
            vx.setdefault(round(q[0], 2), []).append(q)
    for x, L in vx.items():
        L.sort(key=lambda q: -max(q[1], q[3]))
        for a, b in zip(L, L[1:]):
            lo, hi = min(a[1], a[3]), max(b[1], b[3])
            if 0 < lo - hi <= 3.5 and not any(inbox(x, (lo + hi) / 2, g, 0) for g in G):
                ln.append([a[0], hi, a[0], lo, 'CON'])
    return s, G, ln, ci, dots, rect, T


def pins(G, ln, ci, T):
    """the wires of each block: inputs on the left side, outputs on the right side; a negation circle on a side = NOT"""
    con = [q for q in ln if q[4] == 'CON']
    hz = lambda q: abs(q[1] - q[3]) < 0.05
    out_g, hid = [], []
    for g in G:
        x1, x2, y1, y2 = g['x1'], g['x2'], g['y1'], g['y2']
        ins, outs = [], []
        for q in con:
            if not hz(q):
                continue
            y = q[1]
            if not (y1 + 0.2 < y < y2 - 0.2):
                continue
            a, b = min(q[0], q[2]), max(q[0], q[2])
            if abs(b - x1) < 0.35:
                ins.append([q, y])
            elif abs(a - x2) < 0.35:
                outs.append([q, y])
        # vertical wires ending on the top / bottom edge (the R input of SET / RESET, an input from above)
        top = []
        for q in con:
            if hz(q):
                continue
            x = q[0]
            if not (x1 + 0.2 < x < x2 - 0.2):
                continue
            lo, hi = min(q[1], q[3]), max(q[1], q[3])
            if abs(lo - y2) < 0.35 or abs(hi - y1) < 0.35:
                top.append([q, x])
        gi = {'t': g['t'], 'box': {'x1': x1, 'x2': x2, 'y1': y1, 'y2': y2}, 'ins': [], 'out': [], 'top': []}
        # negation circles
        for c in ci:
            cx, cy, r = c[:3]
            if len(c) > 3:
                continue
            if not (y1 < cy < y2):
                continue
            side = 'L' if abs(cx + r - x1) < 0.9 or (cx < x1 and cx + r > x1 - 0.2) else 'R' if abs(cx - r - x2) < 0.9 or (cx > x2 and cx - r < x2 + 0.2) else None
            if not side:
                continue
            c.append('used')
            L = ins if side == 'L' else outs
            w = next((p for p in L if abs(p[1] - cy) < 0.4), None)
            if w:
                q = w[0]
                # the wire is drawn to the box under the circle: it ends at the circle
                if side == 'L':
                    if q[0] > q[2]:
                        q[0] = round(cx - r, 3)
                    else:
                        q[2] = round(cx - r, 3)
                elif q[0] < q[2]:
                    q[0] = round(cx + r, 3)
                else:
                    q[2] = round(cx + r, 3)
                L.remove(w)
            # an inverted pin: [x, y, 1] at the outer side of the circle
            (gi['ins'] if side == 'L' else gi['out']).append([round(cx - r, 3) if side == 'L' else round(cx + r, 3), cy, 1])
        gi['ins'] += [[x1, p[1]] for p in ins]
        gi['out'] += [[x2, p[1]] for p in outs]
        gi['top'] = [[p[1], y2 if abs(min(p[0][1], p[0][3]) - y2) < 0.35 else y1] for p in top]
        gi['ins'].sort(key=lambda p: -p[1])
        for k in ('t1', 'rt', 'rb', 'cl', 'cr'):
            if k in g:
                gi[k] = g[k]
        out_g.append(gi)
    return out_g, hid


def near_text(T, g, rx, f):
    cx, cy = (g['x1'] + g['x2']) / 2, (g['y1'] + g['y2']) / 2
    c = [t for t in T if rx.search(t['t']) and f(t)]
    c.sort(key=lambda t: abs(t['x'] - cx) + abs(t['y'] - cy))
    return c[0] if c else None


CONTENTS = {}


def sheet_json(bk, name, num):
    s, G, ln, ci, dots, rect, T = convert(bk, name, '')
    lsg, hid = pins(G, ln, ci, T)
    # parameters of the blocks
    for g in lsg:
        b = g['box']
        inside = lambda t: b['x1'] - 0.3 <= t['x'] <= b['x2'] + 0.3 and b['y1'] - 0.3 <= t['y'] <= b['y2'] + 0.3
        if g['t'] in ('TMR', 'PO'):
            # the nearest timer tag that no other timer took (LS214: TR420 / TR421 are written under the two boxes)
            used = {x.get('tag') for x in lsg if x is not g}
            tg = near_text(T, b, re.compile(r'TR\s?\d{3}'), lambda t: abs(t['y'] - (b['y1'] + b['y2']) / 2) < 20 and abs(t['x'] - (b['x1'] + b['x2']) / 2) < 50
                           and re.search(r'TR\s?\d{3}', t['t']).group(0).replace(' ', '') not in used)
            g['tag'] = re.search(r'TR\s?\d{3}', tg['t']).group(0).replace(' ', '') if tg else ''
        if g['t'] == 'PO':
            d = near_text(T, b, re.compile(r'^\d+\s*(S|SEC|s)$', re.I), lambda t: t['y'] > b['y2'] - 0.5 and t['y'] - b['y2'] < 8)
            g['v'] = int(re.match(r'\d+', d['t']).group(0)) if d else 3
        if g['t'] == 'TMR':
            g['v'] = g.pop('t1')
        if g['t'] == 'CMP':
            sym = next((t['t'] for t in T if inside(t) and 'Y' in t['t'] and 'X' in t['t']), '')
            g['cmp'] = '<' if ('£' in sym or '<' in sym) else '>'
        if g['t'] == 'FF':
            rr = next(t for t in T if inside(t) and t['t'].strip() == 'R')
            ss = next(t for t in T if inside(t) and t['t'].strip() == 'S')
            g['r'] = [p for p in g['ins'] if abs(p[1] - rr['y']) < abs(p[1] - ss['y'])]
            g['s'] = [p for p in g['ins'] if abs(p[1] - rr['y']) >= abs(p[1] - ss['y'])]
            g['ins'] = []
    # ---------- the sheet object (the same as the DITL reader makes) ----------
    raw = {'ln': [q[:5] for q in ln] + hid, 'pl': [], 'ci': [], 'ar': [], 'so': [], 'lamp': []}
    for d in dots:
        raw['pl'].append([[[d[0] - 0.2, d[1]], [d[0] + 0.2, d[1]]], 0, 'CON', round(2 * d[2], 3)])
    for c in ci:
        raw['ci'].append([c[0], c[1], c[2], 'LSB'])
    for q in rect:
        if q['lnno']:
            continue
    rows, cells, rest, rb = [], {}, [], []
    lines = {}
    # the line numbers go 1 ~ 21 down the sheet; a few are mistyped in the drawing (LS240 "1, 1, 1", LS110 "... 20, 18"): the
    # position on the sheet is the line number
    nos = sorted((t['r'], int(t['t'])) for t in T if t['c'] == 1 and re.match(r'^\d+$', t['t']) and 5 <= t['r'] < 89)
    for k, (r, no) in enumerate(nos):
        lines[k + 1] = r
        if no != k + 1:
            print('LINE NO', name, 'printed', no, 'is line', k + 1, file=sys.stderr)
    for n in sorted(lines):
        r0 = lines[n]
        wy = uy(s, r0 + 2)
        rows.append({'n': n, 'y': round(wy - 1.2, 3)})
        rb.append([round(wy - 4.5, 3), round(wy + 4.5, 3)])
    def put(i, c, t):
        cells.setdefault('%d:%s' % (i, c), []).append(t)
    for t in T:
        # the comparator symbol is written in the Symbol font: '/' = >=, '£' = <=
        tt = re.sub(r'^X\s*/\s*Y$', 'X ≥ Y', re.sub(r'^X\s*£\s*Y$', 'X ≤ Y', t['t'].strip())) if re.match(r'^X\s*[/£]\s*Y$', t['t'].strip()) else t['t']
        o = {'t': tt, 'ix': t['x'], 'iy': t['y'], 'x': t['x'], 'y': t['y'], 'h': t['h'], 'r': 0, 'a': t['a'], 'b': 0,
             'l': 'DCS' if re.match(r'^[IMBO]\.[0-9A-F]{4}', t['t']) else 'TXT1'}
        i = next((k for k, n in enumerate(sorted(lines)) if lines[n] <= t['r'] < lines[n] + 4), -1)
        c = t['c']
        if i < 0 or c == 1 or c == 32 or WL <= c < WR or c > 38:
            rest.append(o)
            continue
        up = t['r'] - lines[sorted(lines)[i]] < 2
        if c == 2:
            put(i, 'F' if up else 'S', o)
        elif c == 3:
            put(i, 'T', o)
        elif c in (4, 5, 6):
            put(i, 'L', o)
        elif 33 <= c <= 35:
            put(i, 'RT' if up else 'RS', o)
        elif c == 36:
            put(i, 'RS', o)
        else:
            put(i, 'RL', o)
    # the text of a drawing text box (the "1" of the >=1 glyph)
    for q in rect:
        if q['txt'].strip():
            h = 2.2
            # LS50: the text box repeats the 1 ('1 1 1 1', it spills under the glyph in the print): one 1
            rest.append({'t': '1' if re.match(r'^1(\s+1)+$', q['txt'].strip()) else q['txt'].strip(), 'ix': q['x1'] + 0.3, 'iy': (q['y1'] + q['y2']) / 2 - h / 2, 'x': q['x1'] + 0.3,
                         'y': round((q['y1'] + q['y2']) / 2 - h / 2, 3), 'h': h, 'r': 0, 'a': 0, 'b': 0, 'l': 'TXT1'})
    for k in cells:
        cells[k].sort(key=lambda t: -t['y'])
    for i, r in enumerate(rows):
        if any(('%d:%s' % (i, c)) in cells for c in ('RT', 'RS')):
            r['rn'] = r['n']
    # an output wire drawn on the line between two rows (LS210 line 3): the row with the output text takes it (r.ry)
    xr = ux(s, WR)
    ends = [q[1] for q in raw['ln'] if q[4] == 'CON' and abs(q[1] - q[3]) < 0.05 and abs(max(q[0], q[2]) - xr) < 0.3]
    for i, r in enumerate(rows):
        if 'rn' not in r or any(rb[i][0] <= y < rb[i][1] for y in ends):
            continue
        free = [y for y in ends if abs(y - (r['y'] + 1.2)) < 6.8 and not any(rb[k][0] <= y < rb[k][1] and 'rn' in rows[k] for k in range(len(rows)) if k != i)]
        if free:
            r['ry'] = round(min(free, key=lambda y: abs(y - (r['y'] + 1.2))) - 1.2 + 0.01, 3)
    rng = {'F': [ux(s, 2), ux(s, 3)], 'L': [ux(s, 4), ux(s, 6)], 'T': [ux(s, 3), ux(s, 4)], 'S': [ux(s, 6), ux(s, WL)],
           'RS': [ux(s, WR), ux(s, 33)], 'RL': [ux(s, 36), ux(s, 39)], 'RT': [ux(s, 33), ux(s, 36)]}
    # the title: the CONTENTS sheet of the drawing (the title block of LS-212 / 213 repeats CONVEY AIR VALVE of LS-210)
    title = CONTENTS.get(num) or ' '.join(t['t'] for t in sorted([t for t in T if t['r'] == 90 and 20 <= t['c'] <= 30], key=lambda t: t['c']))
    code = 'LS' + str(num)
    sh = {'name': '(L%d)DITL-%s' % (num, code), 'title': title, 'raw': raw, 'tx': rest, 'rows': rows, 'rng': rng, 'vr': rng,
          'rb': rb, 'cells': cells, 'sig': {}, 'syms': [], 'lyr': '', 'bv': 28, 'ls': 1, 'lsg': lsg}
    return sh


if __name__ == '__main__':
    bk = Book(sys.argv[1])
    cs = bk.sheet('Contents')
    for (r, c), x in cs.cells.items():
        if c in (4, 9) and x['t'] and re.match(r'^\d+$', x['t']) and 6 < r < 30:
            d = cs.cells.get((r, c - 2 if c == 4 else c - 3))
            if d and d['t']:
                CONTENTS[int(x['t'])] = re.sub(r'\s+', ' ', d['t']).strip()
    out = []
    for n, _ in bk.sheets[1:24]:
        num = int(n.split()[0])
        sh = sheet_json(bk, n, num)
        out.append(sh)
        print(sh['name'], sh['title'], len(sh['rows']), [(g['t'], len(g.get('ins', [])), len(g['out']), len(g['top'])) for g in sh['lsg'] if g['t'] != 'NOT'], file=sys.stderr)
    json.dump(out, open(sys.argv[2], 'w'))

