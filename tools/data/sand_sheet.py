"""Sand injection system logic (E10210-3-771 ~ 777) -> one DITL sheet object of the app (name "(D71)DITL-771").

model() of tools/data/sand_model.py gives the symbols joined to the wire nets of one sheet. Here that becomes the sheet:
  raw      the drawing: wires (layer CON, one net each), the other strokes (SYM), arrow heads and thick bodies (filled)
  tx       the texts of the drawing (OCR of the PDF + the manual corrections of tools/data/sand_text.json)
  rows     one row per TERMINAL: an input row = a net that no block drives (field switch, push button, FROM flag), an output row = a
           net that no block reads (lamp, field output, alarm, TO flag); the texts that belong to it are its cells
  sd       the logic (nets, gates, terminals, FROM / TO links) that src/digital/parts/02b-sand.js turns into the netlist of the sheet
Usage: python3 tools/data/sand_sheet.py <svg folder> <ocr.json> <out.json> [sheet ...]
"""
import json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from sand_model import (model, resolve, resolve_not, resolve_timers, resolve_po, resolve_sr, resolve_flags, find_hex, pin_net, box_nets)  # noqa: E402
from sand_symbols import bbox, is_h, is_v  # noqa: E402
from sand_pdf import read_svg  # noqa: E402
from sand_scene import fills_to_thick  # noqa: E402

K = 0.32  # sheet points -> app units (text height 2.1)
ADDR = re.compile(r'^-?([IMOB]\.[0-9A-F]{4}|A[IO][0-9A-F]{4})$')
TITLE = 'SAND INJECTION SYSTEM CONTROL LOGIC (%d)'
REGION = (40, 45, 712, 496)  # the drawing (frame, bands); the title block below is not part of the logic


def P(x, y):
    return [round(x * K, 3), round(-y * K, 3)]


def refit(o, t):
    """a text that lost characters (arrow / hexagon / symbol glyphs the OCR read as letters): the box shrinks to the characters that are left (kept at the end the text
    shares with the OCR text: 'Ako (SV-1)' -> '(SV-1)' keeps the right end, 'M.0880<D' -> 'M.0880' keeps the left end)"""
    old = o['t']
    if t == old or not old:
        return {**o, 't': t}
    w = o['x1'] - o['x0']
    nw = w * len(t) / len(old)
    if old.endswith(t) or (len(t) < len(old) and not old.startswith(t)):
        return {**o, 't': t, 'x0': o['x1'] - nw}
    return {**o, 't': t, 'x1': o['x0'] + nw}


def clean(sheet, ocr, ovr, hexes=(), add=()):
    """OCR text -> drawing text: the typos the OCR makes in this font, then the manual corrections (sand_text.json: 'sheet:x0:y0' -> text, null = not text);
    the digits / letters inside a hexagon are replaced by the hexagon value read from the drawing (sand_hex.json)"""
    out = []
    for a in add:
        if a[0] == sheet:
            out.append({'t': a[1], 'x0': a[2], 'y0': a[3], 'x1': a[4], 'y1': a[5], 'c': 1})
    for o in ocr:
        t = o['t'].strip()
        key = '%d:%d:%d' % (sheet, round(o['x0']), round(o['y0']))
        m = re.match(r'^([IMOB]\.[0-9A-F]{4})\s+(\S.*)$', t)
        if m and key not in ovr:
            w = o['x1'] - o['x0']
            k = len(m.group(1)) / len(t)
            out.append({**o, 't': m.group(1), 'x1': o['x0'] + w * k})
            out.append({**o, 't': m.group(2), 'x0': o['x0'] + w * (len(t) - len(m.group(2))) / len(t)})
            continue
        if key in ovr:
            if ovr[key] is None:
                continue
            t = ovr[key]
        else:
            t = re.sub(r'^[A-Za-z?4]{1,3}\s+(?=\()', '', t)
            t = re.sub(r'^[1lI]\.([0-9A-F]{4})$', r'I.\1', t)
            t = re.sub(r'^[0O]\.([0-9A-F]{4})$', r'O.\1', t)
        cx, cy = ctr(o)
        if any(h['x1'] - 1 <= cx <= h['x2'] + 1 and h['y1'] - 1 <= cy <= h['y2'] + 1 for h in hexes):
            continue
        out.append(refit(o, t))
    for h in hexes:
        if h.get('v') and h['v'] != '?':
            out.append({'t': h['v'], 'x0': h['x1'] + 0.9, 'x1': h['x2'] - 0.9, 'y0': h['y1'] + 1.2, 'y1': h['y2'] - 0.9, 'c': 1})
    return out


def secs(txt):
    m = re.match(r'^(\d+)\s*S$', txt.strip(), re.I)
    return int(m.group(1)) if m else None


def ctr(o):
    return (o['x0'] + o['x1']) / 2, (o['y0'] + o['y1']) / 2


def near_text(texts, used, box, rx, dx=(-14, 14), dy=(-13, 15)):
    best = None
    for o in texts:
        if id(o) in used or not rx.match(o['t']):
            continue
        cx, cy = ctr(o)
        if box['x1'] + dx[0] <= cx <= box['x2'] + dx[1] and box['y1'] + dy[0] <= cy <= box['y2'] + dy[1]:
            d = abs(cx - (box['x1'] + box['x2']) / 2) + abs(cy - (box['y1'] + box['y2']) / 2)
            if best is None or d < best[0]:
                best = (d, o)
    return best[1] if best else None


def gates_of(M, ocr_raw, ocr, sheet):
    """AND / OR / NOT / timers / PO / flip-flops with raw net ids (the union-find roots)"""
    G, lamps = [], []
    ors = [o for o in ocr_raw if o['t'].strip().upper() in ('OR', 'OR)', '(OR')]
    for b in M['blocks']:
        bx = b['box']
        ins = [n for n in b.get('ins', []) if n is not None]
        if b['t'] == 'AND':
            G.append({'t': 'AND', 'ins': ins, 'out': b['out'], 'box': bx, 'bar': b['bar'], 'rev': b.get('rev')})
        elif b['t'] == 'OR':
            has = (bx['x2'] - bx['x1']) < 11.5  # the OR circle is 8.4 ~ 10.6 wide, F(t) 12.2
            if has and b['out'] is not None:
                G.append({'t': 'OR', 'ins': ins, 'out': b['out'], 'box': bx, 'bar': b['bar'], 'rev': b.get('rev')})
            else:
                lamps.append({'box': bx, 'ins': ins, 'out': b['out']})
    for b in resolve_not(M):
        G.append({'t': 'NOT', 'ins': b['ins'][:1], 'out': b['out'], 'box': b['box']})
    tm = []
    for b in resolve_timers(M):
        tm.append({'t': 'TMR', 'k': b['k'], 'ins': b['ins'][:1], 'out': b['out'], 'box': b['box']})
    for b in resolve_po(M, ocr_raw):
        tm.append({'t': 'TMR', 'k': 'pulse', 'ins': b['ins'][:1], 'out': b['out'], 'box': b['box']})
    used = set()
    for g in tm:
        tg = near_text(ocr, used, g['box'], re.compile(r'^TR\d{3}$'))
        if tg:
            used.add(id(tg))
            g['tag'] = tg['t']
        sc = near_text(ocr, used, g['box'], re.compile(r'^\d+\s*S$', re.I), dy=(-4, 14))
        if sc:
            used.add(id(sc))
            g['v'] = secs(sc['t'])
        G.append(g)
    for b in resolve_sr(M):
        G.append({'t': 'FF', 's': b['s'][:], 'r': b['r'][:], 'out': b['out'][0] if b['out'] else None, 'box': b['box']})
    return G, lamps


def letter_hexes(M, sheet, hextab):
    """a letter hexagon is a broken line on the same sheet: an arrow head INTO it = the signal goes there (sink), a wire that leaves it = the
    signal comes from there (source)"""
    res = []
    for h in find_hex(M):
        if h['kind'] != 'let':
            continue
        v = hextab.get('%d:%.1f:%.1f' % (sheet, h['x1'], h['y1']), '?')
        cy = (h['y1'] + h['y2']) / 2
        sink = src = None
        for a in M['m']['sc']['arrows']:
            if abs(a['tip'][1] - cy) > 1.4:
                continue
            if (a['dir'] == 'R' and abs(a['tip'][0] - h['x1']) <= 1.8) or (a['dir'] == 'L' and abs(a['tip'][0] - h['x2']) <= 1.8):
                n = pin_net(M['wires'], a)
                if n is not None:
                    sink = n
        cx = (h['x1'] + h['x2']) / 2
        for a in M['m']['sc']['arrows']:
            if abs(a['tip'][0] - cx) <= 1.4 and ((a['dir'] == 'D' and abs(a['tip'][1] - h['y1']) <= 1.8) or (a['dir'] == 'U' and abs(a['tip'][1] - h['y2']) <= 1.8)):
                n = pin_net(M['wires'], a)
                if n is not None:
                    sink = n
        for g in M['wires']:
            for p in (g['a'], g['b']):
                side = abs(p[1] - cy) <= 1.4 and (abs(p[0] - h['x1']) <= 1.6 or abs(p[0] - h['x2']) <= 1.6)
                vert = abs(p[0] - cx) <= 1.4 and (abs(p[1] - h['y1']) <= 1.6 or abs(p[1] - h['y2']) <= 1.6)
                if (side or vert) and g['net'] != sink:
                    src = g['net']
        res.append({'v': v, 'sink': sink, 'src': src, 'box': h})
    return res


def wire_covered(p, wires, e=0.6):
    """a stroke that is only wire (already drawn as a CON line)"""
    def on(pt):
        for g in wires:
            if is_h(g):
                x1, x2 = sorted((g['a'][0], g['b'][0]))
                if abs(pt[1] - g['a'][1]) <= e and x1 - e <= pt[0] <= x2 + e:
                    return True
            else:
                y1, y2 = sorted((g['a'][1], g['b'][1]))
                if abs(pt[0] - g['a'][0]) <= e and y1 - e <= pt[1] <= y2 + e:
                    return True
        return False
    for i in range(len(p) - 1):
        a, b = p[i], p[i + 1]
        if not (on(a) and on(b) and on(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2))):
            return False
    return True


_TXT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sand_text.json')
from sand_build import net_at  # noqa: E402
NOTSW = json.load(open(_TXT)).get('notsw', {}) if os.path.exists(_TXT) else {}
FLIPNOT = json.load(open(_TXT)).get('flipnot', {}) if os.path.exists(_TXT) else {}
MOVE = json.load(open(_TXT)).get('move', {}) if os.path.exists(_TXT) else {}


def sheet_parts(svg, sheet, ocr_raw, ovr, hextab):
    """everything of one sheet, in sheet points (the app scale is applied in sheet_json)"""
    M = resolve(model(svg, ocr_raw, ovr.get('drop', {}).get(str(sheet), [])))
    hexes = [dict(h, v=hextab.get('%d:%.1f:%.1f' % (sheet, h['x1'], h['y1']), '?')) for h in find_hex(M)]
    ocr = clean(sheet, ocr_raw, ovr.get('fix', {}), hexes, ovr.get('add', []))
    # a transmitter symbol (the box LT / PT inside a U shaped bracket): the bracket is the symbol, the wire that leaves it is the signal
    for o in ocr:
        if o['t'] in ('LT', 'PT', 'TT', 'FT'):
            x1, y1, x2, y2 = o['x0'] - 14, o['y0'] - 9, o['x1'] + 16, o['y1'] + 9
            M['wires'] = [g for g in M['wires'] if not all(x1 <= q[0] <= x2 and y1 <= q[1] <= y2 for q in (g['a'], g['b']))]
    G, lamps = gates_of(M, ocr_raw, ocr, sheet)
    F = resolve_flags(M, ocr, sheet, hextab)
    LH = letter_hexes(M, sheet, hextab)
    return {'M': M, 'ocr': ocr, 'G': G, 'lamps': lamps, 'F': F, 'LH': LH}



def rects_of(M):
    return M['m']['rects']


def net_ends(wires):
    """net -> list of (x, y) wire end points"""
    d = {}
    for g in wires:
        d.setdefault(g['net'], []).extend([g['a'], g['b']])
    return d


def inside(o, x1, y1, x2, y2, m=0.5):
    cx, cy = ctr(o)
    return x1 - m <= cx <= x2 + m and y1 - m <= cy <= y2 + m


def text_obj(o, K=K):
    """OCR box -> drawing text of the app (monospace font: the width of the box fits the characters)"""
    w, h = (o['x1'] - o['x0']) * K, (o['y1'] - o['y0']) * K
    n = max(len(o['t']), 1)
    hh = round(max(1.4, min(h * 0.92, w / (0.6 * n))), 2)
    x, y = round(o['x0'] * K, 3), round(-o['y1'] * K + (h - hh) * 0.35, 3)
    return {'t': o['t'], 'ix': x, 'iy': y, 'x': x, 'y': y, 'h': hh, 'r': 0, 'a': 0, 'b': 0, 'l': 'DCS' if ADDR.match(o['t']) else 'TXT1'}


def sheet_json(S, sheet, svg):
    M, G, F, LH, ocr, lamps = S['M'], S['G'], S['F'], S['LH'], S['ocr'], S['lamps']
    wires = M['wires']
    sc = M['m']['sc']
    # ----- nets
    roots = sorted({g['net'] for g in wires})
    ix = {r: i for i, r in enumerate(roots)}
    N = lambda r: ix[r] if r in ix else None
    gates, notes = [], []
    for g in G:
        ins = [N(n) for n in g.get('ins', []) if N(n) is not None]
        o = N(g['out']) if g.get('out') is not None else None
        if g['t'] == 'FF':
            s_ = [N(n) for n in g['s'] if N(n) is not None]
            r_ = [N(n) for n in g['r'] if N(n) is not None]
            if o is None or not s_:
                notes.append('FF without %s at %.0f,%.0f' % ('Q' if o is None else 'S', g['box']['x1'], g['box']['y1']))
                continue
            gates.append({'t': 'FF', 's': s_, 'r': r_, 'out': [o], 'box': g['box']})
            continue
        if o is None or not ins:
            notes.append('%s without %s at %.0f,%.0f' % (g['t'], 'output' if o is None else 'input', g['box']['x1'], g['box']['y1']))
            continue
        d = {'t': g['t'], 'ins': ins, 'out': [o], 'box': g['box']}
        for k in ('k', 'tag', 'v'):
            if k in g:
                d[k] = g[k]
        gates.append(d)
    # a NOT drawn with its flow up or left and no arrow head (the reader takes the lower / left side as the input): turned round by hand
    for fx, fy in FLIPNOT.get(str(sheet), []):
        for g in gates:
            if g['t'] == 'NOT' and abs(g['box']['x1'] - fx) < 1.5 and abs(g['box']['y1'] - fy) < 1.5:
                g['ins'], g['out'] = g['out'], g['ins']
    # ----- F(t) = a first order lag filter of an analog signal: the logic only needs the signal to pass through
    for r in rects_of(M):
        if any(re.match(r'^F\s*\(?t\)?$', o['t']) and inside(o, r['x1'], r['y1'], r['x2'], r['y2']) for o in ocr):
            bn = box_nets(wires, r['x1'], r['y1'], r['x2'], r['y2'])
            L_, R_ = [N(n) for n, _ in bn['L']], [N(n) for n, _ in bn['R']]
            if L_ and R_:
                gates.append({'t': 'OR', 'ins': L_[:1], 'out': R_[:1], 'box': {k: r[k] for k in ('x1', 'y1', 'x2', 'y2')}, 'hid': 1, 'ft': 1})
            else:
                notes.append('F(t) box without wires at %.0f,%.0f' % (r['x1'], r['y1']))
    # ----- a two position switch drawn as OPEN / CLOSE contacts of one memory (M.0870 and -M.0870): the CLOSE wire is the NOT of the OPEN wire
    for a, b in NOTSW.get(str(sheet), []):
        na, nb = net_at(wires, a), net_at(wires, b)
        if na is not None and nb is not None and N(na) is not None and N(nb) is not None:
            gates.append({'t': 'NOT', 'ins': [N(na)], 'out': [N(nb)], 'box': {'x1': a[0], 'y1': a[1], 'x2': b[0], 'y2': b[1]}, 'hid': 1})
        else:
            notes.append('switch OPEN / CLOSE wires not found at %s %s' % (a, b))
    # ----- letter hexagons: the same signal on the same sheet
    driven = {n for g in gates for n in g['out']}
    for f in F:
        if f['from']:
            driven.update(N(n) for n in f['netR'] if N(n) is not None)
    letters = {}
    for h in LH:
        sn, sr = N(h['sink']) if h['sink'] is not None else None, N(h['src']) if h['src'] is not None else None
        if sn is None and sr is None:
            notes.append('letter hexagon %s at %.0f,%.0f has no wire' % (h['v'], h['box']['x1'], h['box']['y1']))
            continue
        d = letters.setdefault(h['v'], {'in': [], 'out': []})
        if sn is not None:
            d['in'].append((sn, h['box']))
        elif sr in driven:
            d['in'].append((sr, h['box']))
        else:
            d['out'].append((sr, h['box']))
    for v, d in letters.items():
        if not d['in'] or not d['out']:
            notes.append('letter %s: %d to / %d from' % (v, len(d['in']), len(d['out'])))
            continue
        for net, b in d['out']:
            gates.append({'t': 'OR', 'ins': [x[0] for x in d['in']], 'out': [net], 'box': b, 'hid': 1})
    drv = {n for g in gates for n in g['out']}
    use = {n for g in gates for n in g.get('ins', []) + g.get('s', []) + g.get('r', [])}
    ends = net_ends(wires)
    # ----- terminals
    rects = rects_of(M)
    T = [o for o in ocr if inside(o, *REGION) and o['y0'] > 50]
    claimed = set()
    for o in T:
        if o['y0'] < 79 and o['y1'] < 79:  # the band titles
            claimed.add(id(o))
    terms = []

    def flag_of(net):
        raw = roots[net]
        for f in F:
            if raw in f['netR'] or raw in f['netL'] or raw in f['netT'] or raw in f['netB']:
                return f
        return None

    def claim(region, rx=None, only_addr=False):
        out = []
        for o in T:
            if id(o) in claimed:
                continue
            if not inside(o, *region):
                continue
            if only_addr and not ADDR.match(o['t']):
                continue
            if rx and not rx.match(o['t']):
                continue
            out.append(o)
        return out

    def pick_addr(c, ref):
        a = [o for o in c if ADDR.match(o['t'])]
        a.sort(key=lambda o: math.dist(ctr(o), ref))
        return a[:1]

    # a net is a real wire only if a block pin, a flag or a hexagon is on it, or it is long (the little wires inside a switch, a lamp or a
    # solenoid symbol are the drawing of that symbol)
    pinned = set(drv) | set(use)
    for f in F:
        for k in ('netL', 'netR', 'netT', 'netB'):
            pinned.update(N(n) for n in f[k] if N(n) is not None)
    for v, d in letters.items():
        pinned.update(x[0] for x in d['in'] + d['out'])
    length, ext = {}, {}
    for g in wires:
        k = N(g['net'])
        length[k] = length.get(k, 0) + math.dist(g['a'], g['b'])
        e = ext.setdefault(k, [1e9, 1e9, -1e9, -1e9])
        for p_ in (g['a'], g['b']):
            e[0], e[1], e[2], e[3] = min(e[0], p_[0]), min(e[1], p_[1]), max(e[2], p_[0]), max(e[3], p_[1])
    real = {n for n in range(len(roots)) if n in pinned or (length.get(n, 0) >= 25 and max(ext[n][2] - ext[n][0], ext[n][3] - ext[n][1]) > 40)}
    # ----- the free ends of the wires = the terminals
    byroot = {}
    for g in wires:
        byroot.setdefault(g['net'], []).append(g)

    def touch(p, h, e=0.6):
        if math.dist(p, h['a']) <= e or math.dist(p, h['b']) <= e:
            return True
        if is_h(h):
            x1, x2 = sorted((h['a'][0], h['b'][0]))
            return abs(p[1] - h['a'][1]) <= e and x1 - e <= p[0] <= x2 + e
        y1, y2 = sorted((h['a'][1], h['b'][1]))
        return abs(p[0] - h['a'][0]) <= e and y1 - e <= p[1] <= y2 + e

    def free_ends(root):
        L = byroot[root]
        out = []
        for g in L:
            for p in (g['a'], g['b']):
                if any(h is not g and touch(p, h) for h in L):
                    continue
                if not any(math.dist(p, q) < 1.0 for q in out):
                    out.append(p)
        return out

    pinboxes = []  # (x1, y1, x2, y2): a wire end inside is the pin of a block
    for g in G:
        bx = g['box']
        if g['t'] in ('AND', 'OR') and g.get('bar'):
            bxx, by1, by2 = g['bar']
            lo, hi = (bxx - 8.8, bxx + 1.6) if not g.get('rev') else (bxx - 1.6, bxx + 8.8)
            pinboxes.append((lo, by1 - 1.0, hi, by2 + 1.0))
            pinboxes.append((bx['x1'] - 1.6, bx['y1'] - 1.6, bx['x2'] + 1.6, bx['y2'] + 1.6))
        else:
            pinboxes.append((bx['x1'] - 7.2, bx['y1'] - 2.0, bx['x2'] + 7.2, bx['y2'] + 2.0))
            pinboxes.append((bx['x1'] - 2.0, bx['y1'] - 7.2, bx['x2'] + 2.0, bx['y2'] + 7.2))
    for g in gates:
        if g.get('ft'):
            bx = g['box']
            pinboxes.append((bx['x1'] - 7.2, bx['y1'] - 2.0, bx['x2'] + 7.2, bx['y2'] + 2.0))
    for h in LH:
        bx = h['box']
        pinboxes.append((bx['x1'] - 7.0, bx['y1'] - 2.2, bx['x2'] + 7.0, bx['y2'] + 2.2))
        pinboxes.append((bx['x1'] - 2.2, bx['y1'] - 7.0, bx['x2'] + 2.2, bx['y2'] + 7.0))
    flagboxes = [(f['box']['x1'] - 7.2, f['box']['y1'] - 1.8, f['box']['x2'] + 7.2, f['box']['y2'] + 1.8) for f in F]
    inb = lambda p, b: b[0] <= p[0] <= b[2] and b[1] <= p[1] <= b[3]
    terms, late = [], []

    def add(kind, n, E, f=None):
        texts, hit = [], None
        if f:
            b = f['box']
            texts = claim((b['x1'], b['y1'], b['x2'], b['y2']))
            tag = pick_addr(claim((b['x1'] - 34, b['y1'] - 11, b['x2'] + 6, b['y2'] + 2)) + claim((b['x1'] - 34, b['y1'] - 2, b['x1'], b['y2'] + 8)) + (claim((b['x2'] - 2, b['y1'] - 12, b['x2'] + 40, b['y1'] + 3)) if kind == 'in' else []), ((b['x1'] + b['x2']) / 2, b['y1']))
            texts += tag
            hit = [b['x1'] - (22 if f['from'] and kind == 'in' else 0), b['x2'] + (22 if f['to'] and kind == 'out' else 0)]
            E = ((b['x1'] if kind == 'in' else b['x2']), (b['y1'] + b['y2']) / 2)
        elif kind == 'in':
            desc = claim((E[0] - 105, E[1] - 9, E[0] + 1, E[1] + 9))
            adr = pick_addr(claim((E[0] - 6, E[1] - 11, E[0] + 70, E[1] + 1)) + claim((E[0] - 40, E[1] + 1, E[0] + 1, E[1] + 12)), E)
            texts = desc + adr
            hit = [min([o['x0'] for o in texts] + [E[0] - 30]) - 0.5, E[0] + 1]
        else:
            texts = claim((E[0] - 1, E[1] - 8, E[0] + 125, E[1] + 12))
            hit = [E[0] - 14, max([o['x1'] for o in texts] + [E[0] + 8]) + 0.5]
            late.append(len(terms))
        for o in texts:
            claimed.add(id(o))
        terms.append({'kind': kind, 'n': n, 'E': E, 'texts': texts, 'hit': hit, 'flag': f})

    done = set()
    for f in F:  # a flag box: FROM / TO hexagons or a push button / switch box
        b = f['box']
        for raw in f['netR']:
            n = N(raw)
            if n is not None and (f['from'] or n not in drv) and (n, 'in', id(f)) not in done:
                done.add((n, 'in', id(f)))
                add('in', n, (b['x2'], (b['y1'] + b['y2']) / 2), f)
        for raw in f['netL']:
            n = N(raw)
            if n is not None and (f['to'] or not f['from']) and (n, 'out', id(f)) not in done:
                done.add((n, 'out', id(f)))
                add('out', n, (b['x1'], (b['y1'] + b['y2']) / 2), f)
    flagnets = {(n, k) for n, k, _ in done}
    for n in sorted(real):
        raw = roots[n]
        fe = [p for p in free_ends(raw) if not any(inb(p, pb) for pb in pinboxes) and not any(inb(p, fb) for fb in flagboxes)]
        if not fe:
            continue
        undriven = n not in drv and (n, 'in') not in flagnets
        fe.sort(key=lambda p: (p[0], p[1]))
        if undriven:
            add('in', n, fe[0])
            ie = fe[0]
            fe = [p for p in fe[1:] if math.dist(p, ie) > 22]  # the other ends of a switch / box outline are not outputs
        for p in fe:
            add('out', n, p)
    # the text of a lamp / solenoid / field output: a caption sits above or beside the symbol; each text goes to the nearest output end
    def gap(o, E):
        dy = 0 if o['y0'] - 0.5 <= E[1] <= o['y1'] + 0.5 else min(abs(o['y0'] - E[1]), abs(o['y1'] - E[1]))
        dx = max(0, o['x0'] - E[0] - 14)
        return math.hypot(0.5 * dx, dy)

    for o in T:
        if id(o) in claimed:
            continue
        best = None
        for i in late:
            E = terms[i]['E']
            if E[0] - 1 <= o['x0'] <= E[0] + 125 and E[1] - 25 <= (o['y0'] + o['y1']) / 2 <= E[1] + 12:
                d = gap(o, E)
                if best is None or d < best[0]:
                    best = (d, i)
        if best:
            terms[best[1]]['texts'].append(o)
            claimed.add(id(o))
    for mv in MOVE.get(str(sheet), []):  # a caption the drawing puts between two output ends: moved by hand to the end it belongs to
        src = [(t, o) for t in terms for o in t['texts'] if o['t'] == mv[0]] or [(None, o) for o in T if o['t'] == mv[0] and id(o) not in claimed]
        near = sorted(terms, key=lambda t: math.dist(t['E'], (mv[1], mv[2])))
        if src and near and math.dist(near[0]['E'], (mv[1], mv[2])) < 6:
            if src[0][0] is not None:
                src[0][0]['texts'].remove(src[0][1])
            near[0]['texts'].append(src[0][1])
            claimed.add(id(src[0][1]))
    # an end of the same signal that has no text of its own (a stub of a wire) is not a row when the signal has an end with text
    swn = {g['out'][0]: g['box'] for g in gates if g.get('hid') and g['t'] == 'NOT'}
    drop = [t for t in terms if t['kind'] == 'out' and not t['flag'] and (
        (not t['texts'] and any(u is not t and u['n'] == t['n'] and u['kind'] == 'out' and u['texts'] for u in terms))
        or (t['n'] in swn and math.dist(t['E'], (swn[t['n']]['x2'], swn[t['n']]['y2'])) < 4))]
    late = [i for i in late if terms[i] not in drop]
    terms[:] = [t for t in terms if t not in drop]
    late = [terms.index(t) for t in terms if t['kind'] == 'out' and not t['flag']]
    for i in late:
        t = terms[i]
        t['hit'] = [t['E'][0] - 14, max([o['x1'] for o in t['texts']] + [t['E'][0] + 8]) + 0.5]
    return {'N': len(roots), 'gates': gates, 'terms': terms, 'notes': notes, 'roots': roots, 'letters': letters, 'T': T, 'claimed': claimed}



def sheet_object(S, R, sheet, svg):
    """the sheet object of the app (the same keys as the DITL reader makes) + the logic (sd) of the netlist builder"""
    M, wires, ocr = S['M'], S['M']['wires'], S['ocr']
    sc = M['m']['sc']
    roots, T = R['roots'], R['T']
    ix = {r: i for i, r in enumerate(roots)}
    ln, seg = [], []
    for g in wires:
        a, b = P(*g['a']), P(*g['b'])
        ln.append([a[0], a[1], b[0], b[1], 'CON'])
        seg.append(ix[g['net']])
    # the other strokes: symbol outlines (text strokes and wire strokes are left out)
    strokes, fills = read_svg(svg)
    thick, dots = fills_to_thick(fills)
    raw_o = S['ocr']
    glyph = lambda p: any(o['x0'] - 0.8 <= min(q[0] for q in p) and max(q[0] for q in p) <= o['x1'] + 0.8 and o['y0'] - 0.8 <= min(q[1] for q in p) and max(q[1] for q in p) <= o['y1'] + 0.8 for o in raw_o)
    pl = []
    for p in sc['strokes']:
        if len(p) < 2:
            continue
        x1, y1, x2, y2 = bbox(p)
        if x2 < REGION[0] or x1 > REGION[2] or y2 < REGION[1] or y1 > REGION[3]:
            continue
        if wire_covered(p, wires) or glyph(p):
            continue
        pl.append([[P(*q) for q in p], 0, 'SYM'])
    so = []
    for f in fills:
        x1, y1, x2, y2 = bbox(f)
        if max(x2 - x1, y2 - y1) < 0.6:
            continue
        if x2 < REGION[0] or x1 > REGION[2] or y2 < REGION[1] or y1 > REGION[3]:
            continue
        so.append([[P(*q) for q in f], 'SYM'])
    for a in sc['arrows']:
        t, c, n_ = a['tip'], a['tail'], a['notch']
        axis_h = abs(t[1] - n_[1]) < 0.05
        c2 = (c[0], 2 * t[1] - c[1]) if axis_h else (2 * t[0] - c[0], c[1])
        so.append([[P(*t), P(*c), P(*n_), P(*c2)], 'SYM'])
    # the terminals -> rows
    title_ids = {id(o) for o in T if o['y0'] < 79 and o['y1'] < 79}
    terms = sorted(R['terms'], key=lambda t: (t['kind'] != 'in', round((t['flag']['box']['y1'] + t['flag']['box']['y2']) / 2 if t['flag'] and t['texts'] else t['E'][1]), t['E'][0]))
    rows, cells, rb, src, outs, term = [], {}, [], [], [], []
    ni = sum(1 for t in terms if t['kind'] == 'in')
    for k, t in enumerate(terms):
        f = t['flag']
        yc = ((f['box']['y1'] + f['box']['y2']) / 2) if (f and t['texts'] and any(inside(o, f['box']['x1'], f['box']['y1'], f['box']['x2'], f['box']['y2']) for o in t['texts'])) else t['E'][1]
        ya = round(-yc * K, 3)
        row = {'n': k + 1, 'y': round(ya - 1.2, 3)}
        col = 'S' if t['kind'] == 'in' else 'RS'
        row['vx'] = {col: [round(t['hit'][0] * K, 3), round(t['hit'][1] * K, 3)]}
        if t['kind'] == 'out':
            row['rn'] = k + 1
        rows.append(row)
        rb.append([round(ya - 3.2, 3), round(ya + 3.2, 3)])
        for o in sorted(t['texts'], key=lambda o: (round(o['y0']), o['x0'])):
            cells.setdefault('%d:%s' % (k, col), []).append(text_obj(o))
        (src if t['kind'] == 'in' else outs).append({'n': t['n'], 'row': k})
        if t['kind'] == 'out':
            adr = next((o['t'] for o in t['texts'] if ADDR.match(o['t'])), '')
            lamp = None
            for c in M['m']['circles']:
                if math.dist((c['cx'], c['cy']), t['E']) < c['r'] + 4:
                    lamp = {'x': round(c['cx'] * K, 3), 'y': round(-c['cy'] * K, 3)}
            term.append({'n': t['n'], 'x': round(t['E'][0] * K, 3), 'y': round(-t['E'][1] * K, 3), 'lab': adr, 'lamp': lamp})
    for k in cells:
        cells[k].sort(key=lambda o: -o['y'])
    tx = [text_obj(o) for o in T if id(o) in title_ids or id(o) not in R['claimed']]
    L = lambda x: round(x * K, 3)
    rng = {'F': [L(46), L(46)], 'L': [L(46), L(46)], 'T': [L(46), L(46)], 'S': [L(46), L(200)], 'RS': [L(580), L(700)], 'RL': [L(700), L(700)], 'RT': [L(580), L(580)]}
    # dots and boxes in app units
    def bx(b):
        return {'x1': L(b['x1']), 'x2': L(b['x2']), 'y1': round(-b['y2'] * K, 3), 'y2': round(-b['y1'] * K, 3)}
    gates = []
    for g in R['gates']:
        d = dict(g)
        d['box'] = bx(g['box'])
        gates.append(d)
    from sand_build import net_at
    dts = []
    for d in sc['dots']:
        n_ = net_at(wires, d, 1.0)
        dts.append({'x': L(d[0]), 'y': round(-d[1] * K, 3), 'n': ix[n_] if n_ in ix else -1})
    sd = {'n': len(roots), 'seg': seg, 'gates': gates, 'src': src, 'outs': outs, 'term': term, 'dots': dts, 'xcon': []}
    name = '(D%d)DITL-%d' % (sheet - 700, sheet)
    sh = {'name': name, 'title': TITLE % (sheet - 770), 'raw': {'ln': ln, 'pl': pl, 'ci': [], 'ar': [], 'so': so, 'lamp': []}, 'tx': tx, 'rows': rows, 'rng': rng, 'vr': rng,
          'rb': rb, 'cells': cells, 'sig': {}, 'syms': [], 'lyr': '', 'bv': 28, 'sd': sd}
    return sh


def flags_xcon(S, R, sheet):
    """FROM / TO of the flags: (direction, peer sheet, name, net, x, y)"""
    ix = {r: i for i, r in enumerate(R['roots'])}
    out = []
    for f in S['F']:
        b = f['box']
        for peer in f['from']:
            for n in f['netR']:
                if n in ix:
                    out.append({'dir': 'in', 'peer': peer, 'name': f['name'], 'n': ix[n], 'x': round(b['x1'] * K, 3), 'y': round(-(b['y1'] + b['y2']) / 2 * K, 3)})
        for peer in f['to']:
            for n in f['netL']:
                if n in ix:
                    out.append({'dir': 'out', 'peer': peer, 'name': f['name'], 'n': ix[n], 'x': round(b['x2'] * K, 3), 'y': round(-(b['y1'] + b['y2']) / 2 * K, 3)})
    return out


def link_flags(sheets, xc):
    """the FROM flag of sheet A "from B" and the TO flag of sheet B "to A" are one signal: the FROM flag takes the signal of the TO flag whose name is the most alike
    (a TO flag that feeds several FROM flags is ONE signal: its number is kept)"""
    import difflib
    miss = []
    key = 0

    def sim(a, b):
        a, b = re.sub(r'\W+', '', a).upper(), re.sub(r'\W+', '', b).upper()
        return max(difflib.SequenceMatcher(None, a, b).ratio(), 0.9 if (a and b and (a in b or b in a)) else 0)

    for a, L in xc.items():
        for c in L:
            if c['dir'] != 'in':
                continue
            cand = [o for o in xc.get(int(c['peer']), []) if o['dir'] == 'out' and o['peer'] == str(a)]
            best = max(cand, key=lambda o: sim(o['name'], c['name'])) if cand else None
            if best is None or sim(best['name'], c['name']) < 0.6:
                miss.append((a, c['name'], c['peer']))
                continue
            if 'num' not in best:
                key += 1
                best['num'] = 'S%d' % key
            c['num'] = best['num']
    # the other way: a TO flag of A "to B" must have a FROM flag on B (a hexagon that was read wrong shows here)
    for a, L in xc.items():
        for o in L:
            if o['dir'] != 'out':
                continue
            if not any(c['dir'] == 'in' and c['peer'] == str(a) and c.get('num') == o.get('num') for c in xc.get(int(o['peer']), [])):
                miss.append((a, 'TO ' + o['name'], o['peer']))
    return miss


if __name__ == '__main__':
    folder, ocrf, outf = sys.argv[1], sys.argv[2], sys.argv[3]
    allocr = json.load(open(ocrf))
    ovr = json.load(open(os.path.join(HERE, 'sand_text.json'))) if os.path.exists(os.path.join(HERE, 'sand_text.json')) else {}
    hextab = json.load(open(os.path.join(HERE, 'sand_hex.json')))
    sheets, xc = [], {}
    for n in range(771, 778):
        svg = '%s/%d.svg' % (folder, n)
        S = sheet_parts(svg, n, allocr[str(n)], ovr, hextab)
        R = sheet_json(S, n, svg)
        sh = sheet_object(S, R, n, svg)
        xc[n] = flags_xcon(S, R, n)
        sheets.append((n, sh))
        print(n, 'nets', R['N'], 'gates', len(R['gates']), 'rows in/out', sum(1 for t in R['terms'] if t['kind'] == 'in'), sum(1 for t in R['terms'] if t['kind'] == 'out'), 'notes', R['notes'])
    miss = link_flags(sheets, xc)
    for n, sh in sheets:
        sh['sd']['xcon'] = [{'num': c.get('num'), 'n': c['n'], 'dir': c['dir'], 'peer': c['peer'], 'x': c['x'], 'y': c['y']} for c in xc[n] if c.get('num')]
    print('FROM / TO flags without a partner:', miss)
    json.dump([sh for _, sh in sheets], open(outf, 'w'))
