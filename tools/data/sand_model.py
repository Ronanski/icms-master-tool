"""Sand injection sheet -> logic model (gates, timers, flip-flops, flags, terminals) joined to the wire nets.

build() in tools/data/sand_build.py finds the symbols; here every symbol gets its pins on the nets.
model(svg, ocr) returns { 'blocks': [...], 'pool': wires with 'net', 'texts': ocr } ; every block has 'ins' / 'out' as net numbers.
"""
import math

from sand_build import build, net_at, cut_through, FRAME
from sand_symbols import nets_of, is_h, is_v, EPS, bbox


def arrows_on_bar(arrows, bar_x, y1, y2, d='R', tol=0.8):
    return [a for a in arrows if a['dir'] == d and abs(a['tip'][0] - bar_x) <= tol and y1 - 0.5 <= a['tip'][1] <= y2 + 0.5]


def find_bar(pool_all, x, y1, y2):
    """the thin vertical line of a gate (the arrows end on it) next to a body or circle at x"""
    best = None
    for g in pool_all:
        if is_v(g) and abs(g['a'][0] - x) <= 0.9:
            gy1, gy2 = sorted((g['a'][1], g['b'][1]))
            if gy1 <= y1 + 1.0 and gy2 >= y2 - 1.0:
                if best is None or (gy2 - gy1) < best[0]:
                    best = (gy2 - gy1, g)
    return best[1] if best else None


def model(svg, ocr, drop=()):
    m = build(svg, ocr)
    sc, pool = m['sc'], m['pool']
    arrows = sc['arrows']
    blocks = []
    cut = []  # boxes the wires must be cut through
    bars = []

    # --- AND bodies: thick rectangle, bar 1.5 left of it ---
    for b in m['bodies']:
        bar, rev, ins = None, 0, []
        for dx, r in ((-1.5, 0), (0.0, 0), (1.5, 1), (0.0, 1)):
            x = (b['x1'] if not r else b['x2']) + dx
            if r == 0 and dx == 0.0:
                x = b['x1']
            if r == 1 and dx == 0.0:
                x = b['x2']
            q = find_bar(pool, x, b['y1'], b['y2'])
            if q is None:
                continue
            qy1, qy2 = sorted((q['a'][1], q['b'][1]))
            a = arrows_on_bar(arrows, q['a'][0], qy1, qy2, 'L' if r else 'R')
            if bar is None or (a and not ins):
                bar, rev, ins = q, r, a
            if a:
                break
        if bar is None:
            blocks.append({'t': 'AND?', 'box': b})
            continue
        by1, by2 = sorted((bar['a'][1], bar['b'][1]))
        ins = arrows_on_bar(arrows, bar['a'][0], by1, by2, 'L' if rev else 'R')
        bars.append(bar)
        cut.append({'x1': b['x1'], 'x2': b['x2'], 'y1': b['y1'], 'y2': b['y2']})
        blocks.append({'t': 'AND', 'rev': rev, 'box': {'x1': b['x1'], 'y1': b['y1'], 'x2': b['x2'], 'y2': b['y2']}, 'bar': (bar['a'][0], by1, by2),
                       'arrows': ins, 'out_pt': (b['x1'] if rev else b['x2'], (b['y1'] + b['y2']) / 2), 'k': b['k']})

    # --- OR circles: circle touching a bar at its left ---
    for c in m['circles']:
        rev = 0
        bar = find_bar(pool, c['cx'] - c['r'], c['cy'] - 1, c['cy'] + 1)
        if bar is None:
            bar = find_bar(pool, c['cx'] + c['r'], c['cy'] - 1, c['cy'] + 1)
            rev = 1
        if bar is None:
            continue
        by1, by2 = sorted((bar['a'][1], bar['b'][1]))
        ins = arrows_on_bar(arrows, bar['a'][0], by1, by2, 'L' if rev else 'R')
        bars.append(bar)
        blocks.append({'t': 'OR', 'rev': rev, 'box': {'x1': c['cx'] - c['r'], 'y1': c['cy'] - c['r'], 'x2': c['cx'] + c['r'], 'y2': c['cy'] + c['r']},
                       'bar': (bar['a'][0], by1, by2), 'arrows': ins, 'out_pt': (c['cx'] - c['r'] if rev else c['cx'] + c['r'], c['cy']), 'c': c})

    for n in m['nots']:
        cut.append({'x1': n['x1'], 'x2': n['x2'], 'y1': n['y1'], 'y2': n['y2']})
    for t in m['timers'] + m['srs']:
        cut.append({'x1': t['x1'], 'x2': t['x2'], 'y1': t['y1'], 'y2': t['y2']})
    for r in m['rects']:
        cut.append({'x1': r['x1'], 'x2': r['x2'], 'y1': r['y1'], 'y2': r['y2']})

    # wires = pool without gate bars and without box outlines (a wire that runs on along an outline keeps only the part outside)
    wires = [g for g in pool if id(g) not in {id(b) for b in bars}]
    for r in m['rects']:
        nxt = []
        for g in wires:
            if is_h(g) and (abs(g['a'][1] - r['y1']) < 0.15 or abs(g['a'][1] - r['y2']) < 0.15):
                x1, x2 = sorted((g['a'][0], g['b'][0]))
                y = g['a'][1]
                if x2 > r['x1'] - 0.2 and x1 < r['x2'] + 0.2:
                    if x1 < r['x1'] - 0.3:
                        nxt.append({**g, 'a': (x1, y), 'b': (r['x1'], y)})
                    if x2 > r['x2'] + 0.3:
                        nxt.append({**g, 'a': (r['x2'], y), 'b': (x2, y)})
                    continue
            if is_v(g) and (abs(g['a'][0] - r['x1']) < 0.15 or abs(g['a'][0] - r['x2']) < 0.15):
                y1, y2 = sorted((g['a'][1], g['b'][1]))
                x = g['a'][0]
                if y2 > r['y1'] - 0.2 and y1 < r['y2'] + 0.2:
                    if y1 < r['y1'] - 0.3:
                        nxt.append({**g, 'a': (x, y1), 'b': (x, r['y1'])})
                    if y2 > r['y2'] + 0.3:
                        nxt.append({**g, 'a': (x, r['y2']), 'b': (x, y2)})
                    continue
            nxt.append(g)
        wires = nxt
    keep = wires
    wires = cut_through(keep, cut)
    # a part of a symbol outline that the wire reader took for a wire (the common edge of a two contact switch box): dropped before the nets are joined
    for x1, y1, x2, y2 in drop:
        wires = [g for g in wires if not all(x1 <= q[0] <= x2 and y1 <= q[1] <= y2 for q in (g['a'], g['b']))]
    nets_of(wires, sc['dots'])
    return {'m': m, 'blocks': blocks, 'wires': wires, 'cut': cut, 'bars': bars}


# ---------------------------------------------------------------- pins

def box_nets(wires, x1, y1, x2, y2, e=0.8):
    """nets that touch the outline of a box, by side: {'L': [...], 'R': [...], 'T': [...], 'B': [...]} (net, position)"""
    out = {'L': [], 'R': [], 'T': [], 'B': []}
    for g in wires:
        for p in (g['a'], g['b']):
            if abs(p[0] - x1) <= e and y1 - e <= p[1] <= y2 + e:
                out['L'].append((g['net'], p[1]))
            if abs(p[0] - x2) <= e and y1 - e <= p[1] <= y2 + e:
                out['R'].append((g['net'], p[1]))
            if abs(p[1] - y1) <= e and x1 - e <= p[0] <= x2 + e:
                out['T'].append((g['net'], p[0]))
            if abs(p[1] - y2) <= e and x1 - e <= p[0] <= x2 + e:
                out['B'].append((g['net'], p[0]))
    for k in out:
        seen = {}
        for n, pos in out[k]:
            seen.setdefault(n, pos)
        out[k] = sorted(seen.items(), key=lambda t: t[1])
    return out


def pin_net(wires, arrow, e=1.2):
    """net of the wire that ends at the tail of an arrow head (the notch point)"""
    n = arrow['notch']
    best = None
    for g in wires:
        for p in (g['a'], g['b']):
            d = math.dist(p, n)
            if d <= e and (best is None or d < best[0]):
                best = (d, g['net'])
    if best:
        return best[1]
    return net_at(wires, n, e)


def resolve(M):
    wires = M['wires']
    for b in M['blocks']:
        if b['t'] in ('AND', 'OR'):
            ins = [pin_net(wires, a) for a in b['arrows']]
            bx, by1, by2 = b['bar']
            # a wire may end on the bar itself, without an arrow head
            for g in wires:
                for p in (g['a'], g['b']):
                    if abs(p[0] - bx) <= 0.9 and by1 - 0.3 <= p[1] <= by2 + 0.3 and not any(math.dist(p, a['tip']) < 6.5 for a in b['arrows']):
                        # the wire must come from the input side
                        other = g['b'] if p == g['a'] else g['a']
                        if (other[0] < bx - 0.3) != bool(b['rev']) or abs(other[0] - bx) <= 0.3:
                            if abs(other[0] - bx) > 0.3 and g['net'] not in ins:
                                ins.append(g['net'])
            b['ins'] = ins
            b['out'] = net_at(wires, b['out_pt'], 1.3)
    return M


# ---------------------------------------------------------------- NOT, timers, flip-flops, PO

def other_end(g, p):
    return g['b'] if math.dist(p, g['a']) <= math.dist(p, g['b']) else g['a']


def line_pins(M, x1, y1, x2, y2, horiz=True, band=1.0, lead=1.4):
    """pins of an inline symbol: nets whose wire ends at (or inside) the symbol on the entry / exit line.
    horiz: the signal flows along x (entries on the left / exits on the right of the box); else along y (entries on top / exits at the bottom).
    returns {'in_lo': [...], 'in_hi': [...]}: in_lo = nets arriving from the low side (left / top), in_hi = from the high side"""
    wires = M['wires']
    arrows = M['m']['sc']['arrows']
    cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
    lo, hi = [], []
    for g in wires:
        for p in (g['a'], g['b']):
            o = other_end(g, p)
            if horiz:
                if abs(p[1] - cy) > band or not (x1 - lead <= p[0] <= x2 + lead):
                    continue
                if o[0] < x1 - 0.5 and p[0] < cx and g['net'] not in lo:
                    lo.append(g['net'])
                if o[0] > x2 + 0.5 and p[0] > cx and g['net'] not in hi:
                    hi.append(g['net'])
            else:
                if abs(p[0] - cx) > band or not (y1 - lead <= p[1] <= y2 + lead):
                    continue
                if o[1] < y1 - 0.5 and p[1] < cy and g['net'] not in lo:
                    lo.append(g['net'])
                if o[1] > y2 + 0.5 and p[1] > cy and g['net'] not in hi:
                    hi.append(g['net'])
    for a in arrows:
        if horiz and abs(a['tip'][1] - cy) <= band and x1 - 0.8 <= a['tip'][0] <= x2 + 0.8 and a['dir'] in ('R', 'L'):
            n = pin_net(wires, a)
            if n is not None:
                tgt = lo if a['dir'] == 'R' and a['tip'][0] <= cx + 0.8 else hi if a['dir'] == 'L' and a['tip'][0] >= cx - 0.8 else None
                if tgt is not None and n not in tgt and n not in lo and n not in hi:
                    tgt.append(n)
        if (not horiz) and abs(a['tip'][0] - cx) <= band and y1 - 0.8 <= a['tip'][1] <= y2 + 0.8 and a['dir'] in ('U', 'D'):
            n = pin_net(wires, a)
            if n is not None:
                tgt = lo if a['dir'] == 'D' and a['tip'][1] <= cy + 0.8 else hi if a['dir'] == 'U' and a['tip'][1] >= cy - 0.8 else None
                if tgt is not None and n not in tgt and n not in lo and n not in hi:
                    tgt.append(n)
    return lo, hi


def resolve_not(M):
    res = []
    arrows = M['m']['sc']['arrows']
    for n in M['m']['nots']:
        x1, y1, x2, y2 = n['x1'], n['y1'], n['x2'], n['y2']
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        lo, hi = line_pins(M, x1, y1, x2, y2, True)
        vlo, vhi = line_pins(M, x1, y1, x2, y2, False)
        horiz = bool(lo or hi) and not (vlo or vhi)
        if not (lo or hi or vlo or vhi):
            horiz = True
        if not horiz and (vlo or vhi) and (lo or hi):
            horiz = True  # a wire passes by; treat as horizontal unless only vertical pins exist
        lo_, hi_ = (lo, hi) if horiz else (vlo, vhi)
        # which side is the input? the arrow head that points into the box
        ia = None
        for a in arrows:
            if horiz and abs(a['tip'][1] - cy) < 0.8:
                if a['dir'] == 'R' and abs(a['tip'][0] - x1) < 0.9:
                    ia = 'lo'
                if a['dir'] == 'L' and abs(a['tip'][0] - x2) < 0.9:
                    ia = 'hi'
            if not horiz and abs(a['tip'][0] - cx) < 0.8:
                if a['dir'] == 'D' and abs(a['tip'][1] - y1) < 0.9:
                    ia = 'lo'
                if a['dir'] == 'U' and abs(a['tip'][1] - y2) < 0.9:
                    ia = 'hi'
        if ia is None:
            ia = 'lo'
        ins, outs = (lo_, hi_) if ia == 'lo' else (hi_, lo_)
        res.append({'t': 'NOT', 'box': {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2}, 'ins': ins, 'out': outs[0] if outs else None, 'outs': outs,
                    'horiz': horiz, 'ia': ia})
    return res


def thick_side(g):
    """flat side of a D shape: 'L' 'R' 'T' 'B' (the long straight thick piece)"""
    best = None
    for (x1, y1, x2, y2) in g['segs']:
        L = math.dist((x1, y1), (x2, y2))
        if best is None or L > best[0]:
            best = (L, x1, y1, x2, y2)
    L, x1, y1, x2, y2 = best
    if abs(x1 - x2) < 0.3:
        return 'L' if abs(x1 - g['x1']) < abs(x1 - g['x2']) else 'R'
    return 'T' if abs(y1 - g['y1']) < abs(y1 - g['y2']) else 'B'


def resolve_timers(M):
    out = []
    strokes = M['m']['sc']['strokes']
    for g in M['m']['timers']:
        side = thick_side(g)
        x1, y1, x2, y2 = g['x1'], g['y1'], g['x2'], g['y2']
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        horiz = side in ('L', 'R')
        # the small circle of an OFF delay sits on the arc side
        bub = None
        for p in strokes:
            b = bbox(p)
            if len(p) >= 7 and 2.4 <= b[2] - b[0] <= 3.7 and 2.0 <= b[3] - b[1] <= 3.7:
                bx, by = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
                if horiz and abs(by - cy) < 0.6 and ((side == 'L' and x2 - 0.5 <= bx <= x2 + 3.0) or (side == 'R' and x1 - 3.0 <= bx <= x1 + 0.5)):
                    bub = b
                if (not horiz) and abs(bx - cx) < 0.6 and ((side == 'T' and y2 - 0.5 <= by <= y2 + 3.0) or (side == 'B' and y1 - 3.0 <= by <= y1 + 0.5)):
                    bub = b
        lo, hi = line_pins(M, x1, y1, x2, y2, horiz, lead=1.4 if not bub else 4.2)
        # flow: flat side = input side
        if side in ('L', 'T'):
            ins, outs = lo, hi
        else:
            ins, outs = hi, lo
        out.append({'t': 'TMR', 'k': 'off' if bub else 'on', 'box': {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2}, 'side': side,
                    'ins': ins, 'out': outs[0] if outs else None, 'outs': outs})
    return out


# ---------------------------------------------------------------- PO / flip-flop / flags / hexagons

def texts_in(ocr, x1, y1, x2, y2, m=0.3):
    return [o for o in ocr if x1 - m <= (o['x0'] + o['x1']) / 2 <= x2 + m and y1 - m <= (o['y0'] + o['y1']) / 2 <= y2 + m]


def resolve_po(M, ocr):
    out = []
    for r in M['m']['po']:
        lo, hi = line_pins(M, r['x1'], r['y1'], r['x2'], r['y2'], True, lead=1.6)
        out.append({'t': 'PO', 'box': {k: r[k] for k in ('x1', 'y1', 'x2', 'y2')}, 'ins': lo, 'out': hi[0] if hi else None, 'outs': hi})
    return out


def sr_letters(M, g):
    """S / R of the two halves of a flip-flop box: R has a vertical stem, S does not"""
    mid = (g['y1'] + g['y2']) / 2
    res = {}
    for name, (a, b) in (('top', (g['y1'], mid)), ('bot', (mid, g['y2']))):
        stem = False
        for p in M['m']['sc']['strokes']:
            bb_ = bbox(p)
            if bb_[0] > g['x1'] + 0.5 and bb_[2] < g['x2'] - 0.5 and bb_[1] > a + 0.5 and bb_[3] < b - 0.5 and max(bb_[2] - bb_[0], bb_[3] - bb_[1]) < 4.5:
                for i in range(len(p) - 1):
                    if abs(p[i][0] - p[i + 1][0]) < 0.06 and abs(p[i][1] - p[i + 1][1]) >= 2.4:
                        stem = True
        res[name] = 'R' if stem else 'S'
    return res


def resolve_sr(M):
    out = []
    for g in M['m']['srs']:
        x1, y1, x2, y2 = g['x1'], g['y1'], g['x2'], g['y2']
        mid = (y1 + y2) / 2
        let = sr_letters(M, g)
        res = {'t': 'FF', 'box': {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2}, 'letters': let}
        for name, (a, b) in (('top', (y1, mid)), ('bot', (mid, y2))):
            lo, hi = line_pins(M, x1, a, x2, b, True)
            res[name] = {'lo': lo, 'hi': hi}
        S = 'top' if let['top'] == 'S' else 'bot'
        R = 'bot' if S == 'top' else 'top'
        res['s'] = res[S]['lo']
        res['r'] = res[R]['lo']
        res['out'] = [n for n in res['top']['hi'] + res['bot']['hi']]
        out.append(res)
    return out


def find_hex(M):
    """hexagon connectors: digit hexes (sheet numbers) ~ 10.5 x 9, letter hexes ~ 7.3 x 6.3"""
    out = []
    for p in M['m']['sc']['strokes']:
        if len(p) in (6, 7):
            b = bbox(p)
            w, h = b[2] - b[0], b[3] - b[1]
            if 9.4 < w < 12 and 8.4 < h < 10.2:
                out.append({'kind': 'num', 'x1': b[0], 'y1': b[1], 'x2': b[2], 'y2': b[3]})
            elif 6.8 < w < 7.9 and 5.8 < h < 6.9:
                out.append({'kind': 'let', 'x1': b[0], 'y1': b[1], 'x2': b[2], 'y2': b[3]})
    return out


def hex_value(sheet, h, table):
    return table.get('%d:%.1f:%.1f' % (sheet, h['x1'], h['y1']), '?')


def resolve_flags(M, ocr, sheet, hextab):
    """boxes with text: a signal flag. Hexagons on the left = the signal comes from those sheets; on the right = it goes to those sheets"""
    hexes = find_hex(M)
    for h in hexes:
        h['v'] = hex_value(sheet, h, hextab)
    out = []
    for r in M['m']['rects']:
        txt = texts_in(ocr, r['x1'], r['y1'], r['x2'], r['y2'])
        if not txt:
            continue
        w = r['x2'] - r['x1']
        if w < 14:
            continue
        txt.sort(key=lambda o: (round(o['y0']), o['x0']))
        name = ' '.join(o['t'] for o in txt)
        cy = (r['y1'] + r['y2']) / 2
        left, right = [], []
        # hexagons that touch the box or the chain of hexagons next to it
        edge_l, edge_r = r['x1'], r['x2']
        for h in sorted(hexes, key=lambda h: h['x1']):
            if h['kind'] != 'num' or abs((h['y1'] + h['y2']) / 2 - cy) > 3.5:
                continue
            if abs(h['x2'] - edge_l) <= 2.0 or (left and abs(h['x2'] - left[-1]['x1']) <= 2.2 and False):
                left.append(h)
        # left hexes (a chain grows leftwards)
        chain = []
        cur = r['x1']
        for h in sorted([h for h in hexes if h['kind'] == 'num' and abs((h['y1'] + h['y2']) / 2 - cy) <= 3.5 and h['x2'] <= r['x1'] + 2.0], key=lambda h: -h['x2']):
            if abs(h['x2'] - cur) <= 2.2:
                chain.append(h)
                cur = h['x1']
        left = chain
        chain = []
        cur = r['x2']
        for h in sorted([h for h in hexes if h['kind'] == 'num' and abs((h['y1'] + h['y2']) / 2 - cy) <= 3.5 and h['x1'] >= r['x2'] - 2.0], key=lambda h: h['x1']):
            if abs(h['x1'] - cur) <= 2.2:
                chain.append(h)
                cur = h['x2']
        right = chain
        bn = box_nets(M['wires'], r['x1'], r['y1'], r['x2'], r['y2'])
        # an arrow head pointing into the box also gives the input net
        arr_in = []
        for a in M['m']['sc']['arrows']:
            if a['dir'] == 'R' and abs(a['tip'][0] - r['x1']) < 0.9 and r['y1'] - 0.5 <= a['tip'][1] <= r['y2'] + 0.5:
                n = pin_net(M['wires'], a)
                if n is not None:
                    arr_in.append(n)
        out.append({'t': 'FLAG', 'name': name, 'box': {k: r[k] for k in ('x1', 'y1', 'x2', 'y2')},
                    'from': [h['v'] for h in left], 'to': [h['v'] for h in right],
                    'netL': [n for n, _ in bn['L']] + arr_in, 'netR': [n for n, _ in bn['R']], 'netT': [n for n, _ in bn['T']], 'netB': [n for n, _ in bn['B']]})
    return out
