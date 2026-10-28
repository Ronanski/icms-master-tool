"""Sand injection scene -> symbols (NOT boxes, gate bodies, timers, flip-flop boxes, label boxes, circles) and the wires left over.

Every symbol takes the line segments it is made of out of the pool; what stays in the pool and is long and straight is wire.
All coordinates are landscape points (x right, y down). See tools/data/sand_scene.py for the scene.
"""
import math

from sand_scene import scene, bbox

EPS = 0.35


def segs_of(strokes):
    out = []
    for si, p in enumerate(strokes):
        for i in range(len(p) - 1):
            a, b = p[i], p[i + 1]
            if math.dist(a, b) > 0.01:
                out.append({'a': a, 'b': b, 's': si, 'used': None})
    return out


def is_h(g):
    return abs(g['a'][1] - g['b'][1]) < 0.06


def is_v(g):
    return abs(g['a'][0] - g['b'][0]) < 0.06


def near(p, q, e=EPS):
    return abs(p[0] - q[0]) <= e and abs(p[1] - q[1]) <= e


def find_not(segs):
    """NOT gate = a 5.0-5.2 square with both diagonals, drawn inline on a wire; returns boxes and marks the 6 segments used"""
    diag = [g for g in segs if not is_h(g) and not is_v(g) and 5.5 < math.dist(g["a"], g["b"]) < 8.3 and 3.8 < abs(g["a"][0] - g["b"][0]) < 6.2 and 3.8 < abs(g["a"][1] - g["b"][1]) < 6.2]
    out = []
    for i, g in enumerate(diag):
        for h in diag[i + 1:]:
            gx = (g['a'][0] + g['b'][0]) / 2
            gy = (g['a'][1] + g['b'][1]) / 2
            hx = (h['a'][0] + h['b'][0]) / 2
            hy = (h['a'][1] + h['b'][1]) / 2
            if abs(gx - hx) < 0.1 and abs(gy - hy) < 0.1:
                x1 = min(g['a'][0], g['b'][0])
                x2 = max(g['a'][0], g['b'][0])
                y1 = min(g['a'][1], g['b'][1])
                y2 = max(g['a'][1], g['b'][1])
                out.append({'t': 'NOT', 'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2})
                g['used'] = h['used'] = 'NOT'
                for e in segs:
                    if e['used']:
                        continue
                    ex1, ex2 = sorted((e['a'][0], e['b'][0]))
                    ey1, ey2 = sorted((e['a'][1], e['b'][1]))
                    on_edge = (is_h(e) and (abs(e['a'][1] - y1) < 0.1 or abs(e['a'][1] - y2) < 0.1) and ex1 >= x1 - 0.1 and ex2 <= x2 + 0.1) or (
                        is_v(e) and (abs(e['a'][0] - x1) < 0.1 or abs(e['a'][0] - x2) < 0.1) and ey1 >= y1 - 0.1 and ey2 <= y2 + 0.1)
                    if on_edge:
                        e['used'] = 'NOT'
    return out


def thick_groups(thick):
    n = len(thick)
    par = list(range(n))

    def f(i):
        while par[i] != i:
            par[i] = par[par[i]]
            i = par[i]
        return i

    for i in range(n):
        for j in range(i + 1, n):
            a, b = thick[i], thick[j]
            if any(math.dist(p, q) < 0.5 for p in ((a[0], a[1]), (a[2], a[3])) for q in ((b[0], b[1]), (b[2], b[3]))):
                par[f(i)] = f(j)
    g = {}
    for i in range(n):
        g.setdefault(f(i), []).append(thick[i])
    out = []
    for v in g.values():
        xs = [x for s in v for x in (s[0], s[2])]
        ys = [y for s in v for y in (s[1], s[3])]
        out.append({'segs': v, 'x1': min(xs), 'x2': max(xs), 'y1': min(ys), 'y2': max(ys), 'w': max(xs) - min(xs), 'h': max(ys) - min(ys)})
    return out


def classify_thick(g):
    w, h, n = g['w'], g['h'], len(g['segs'])
    if w > 100 or h > 100 or g['y1'] > 490 or g['x1'] > 800:
        return 'FRAME'
    if n == 4 and 4.8 < w < 6.5 and 9.8 < h < 12.5:
        return 'AND'
    if n in (7, 8) and 3.8 < w < 4.8 and 10.5 < h < 12.5:
        return 'TMRH'  # D shape, flow along x
    if n in (7, 8) and 3.8 < h < 4.8 and 10.5 < w < 12.5:
        return 'TMRV'  # D shape, flow along y
    if n == 8 and 9.8 < w < 11.6 and 19.8 < h < 22.5:
        return 'SR'
    if n == 8 and 4.8 < w < 6.5 and 11.5 < h < 12.5:
        return 'ANDT'
    return 'OTHER'


def inside(o, x, y, m=0.0):
    return o['x0'] - m <= x <= o['x1'] + m and o['y0'] - m <= y <= o['y1'] + m


def wire_pool(strokes, segs, ocr, frame, arrows=()):
    """orthogonal segments that can be wire: not used by a symbol, not part of a text character, inside the logic frame.
    A short piece (< 4 long, from a small stroke: it may be a letter stroke) is wire only when it touches a wire, an arrow tail or a dot"""
    fx1, fy1, fx2, fy2 = frame
    stroke_bb = [bbox(p) for p in strokes]
    pool, short = [], []
    for g in segs:
        if g['used']:
            continue
        if not (is_h(g) or is_v(g)):
            continue
        mx = (g['a'][0] + g['b'][0]) / 2
        my = (g['a'][1] + g['b'][1]) / 2
        if not (fx1 <= mx <= fx2 and fy1 <= my <= fy2):
            continue
        L = math.dist(g['a'], g['b'])
        b = stroke_bb[g['s']]
        big = max(b[2] - b[0], b[3] - b[1])
        if L < 4.0 and big < 5.0:
            if not any(inside(o, mx, my, 0.2) for o in ocr):
                short.append(g)
            continue
        if any(inside(o, mx, my, 0.2) for o in ocr) and L < 6:
            continue
        pool.append(g)
    anchors = [a['notch'] for a in arrows]
    changed = True
    while changed and short:
        changed = False
        for g in list(short):
            ends = (g['a'], g['b'])
            ok = any(math.dist(e, an) <= 0.5 for e in ends for an in anchors)
            if not ok:
                for q in pool:
                    if any(touches(e, q) for e in ends):
                        ok = True
                        break
            if ok:
                pool.append(g)
                short.remove(g)
                changed = True
    return pool


def touches(p, g, e=EPS):
    if is_h(g):
        x1, x2 = sorted((g['a'][0], g['b'][0]))
        return abs(p[1] - g['a'][1]) <= e and x1 - e <= p[0] <= x2 + e
    y1, y2 = sorted((g['a'][1], g['b'][1]))
    return abs(p[0] - g['a'][0]) <= e and y1 - e <= p[1] <= y2 + e


def nets_of(pool, dots):
    """union-find over the wire pool: ends that meet, or an end that lands on another wire (T); crossings do not join"""
    n = len(pool)
    par = list(range(n))

    def f(i):
        while par[i] != i:
            par[i] = par[par[i]]
            i = par[i]
        return i

    def on(p, g):
        if is_h(g):
            y = g['a'][1]
            x1, x2 = sorted((g['a'][0], g['b'][0]))
            return abs(p[1] - y) <= 0.5 and x1 - 0.5 <= p[0] <= x2 + 0.5
        x = g['a'][0]
        y1, y2 = sorted((g['a'][1], g['b'][1]))
        return abs(p[0] - x) <= 0.5 and y1 - 0.5 <= p[1] <= y2 + 0.5

    for i in range(n):
        for j in range(i + 1, n):
            gi, gj = pool[i], pool[j]
            if any(on(p, gj) for p in (gi['a'], gi['b'])) or any(on(p, gi) for p in (gj['a'], gj['b'])):
                par[f(i)] = f(j)
    # a junction dot joins every wire that passes within 0.8 of it (the drawing puts the dot on the junction, the wires can be 0.4 off)
    def near(p, g, e=0.8):
        if is_h(g):
            x1, x2 = sorted((g['a'][0], g['b'][0]))
            return abs(p[1] - g['a'][1]) <= e and x1 - e <= p[0] <= x2 + e
        y1, y2 = sorted((g['a'][1], g['b'][1]))
        return abs(p[0] - g['a'][0]) <= e and y1 - e <= p[1] <= y2 + e

    for d in dots or []:
        hit = [i for i, g in enumerate(pool) if near(d, g)]
        for i in hit[1:]:
            par[f(i)] = f(hit[0])
    for i, g in enumerate(pool):
        g['net'] = f(i)
    return pool


def merge_collinear(pool):
    """join collinear overlapping or touching pieces into maximal straight segments (keeps the net-free geometry only)"""
    H, V = {}, {}
    for g in pool:
        if is_h(g):
            H.setdefault(round(g['a'][1] / 0.2), []).append(g)
        else:
            V.setdefault(round(g['a'][0] / 0.2), []).append(g)
    out = []
    for horiz, D in ((True, H), (False, V)):
        keys = sorted(D)
        # buckets at +-1 of the key hold the same line (rounding)
        used = set()
        for k in keys:
            if k in used:
                continue
            members = []
            for kk in (k - 1, k, k + 1):
                if kk in D and kk not in used:
                    members += D[kk]
                    used.add(kk)
            iv = []
            for g in members:
                if horiz:
                    iv.append(sorted((g['a'][0], g['b'][0])) + [g['a'][1]])
                else:
                    iv.append(sorted((g['a'][1], g['b'][1])) + [g['a'][0]])
            iv.sort()
            cur = None
            for lo, hi, c in iv:
                if cur and lo <= cur[1] + 0.35:
                    cur[1] = max(cur[1], hi)
                    cur[2].append(c)
                else:
                    if cur:
                        out.append(cur + [horiz])
                    cur = [lo, hi, [c]]
            if cur:
                out.append(cur + [horiz])
    res = []
    for lo, hi, cs, horiz in out:
        c = sum(cs) / len(cs)
        res.append({'a': (lo, c) if horiz else (c, lo), 'b': (hi, c) if horiz else (c, hi), 's': -1, 'used': None})
    return res


def find_rects(pool, ocr, maxw=140, maxh=60):
    Hs = [g for g in pool if is_h(g)]
    Vs = [g for g in pool if is_v(g)]
    out = []
    for i, A in enumerate(Hs):
        ax1, ax2 = sorted((A['a'][0], A['b'][0]))
        for B in Hs:
            if B is A or B['a'][1] <= A['a'][1] + 2.4 or B['a'][1] - A['a'][1] > maxh:
                continue
            bx1, bx2 = sorted((B['a'][0], B['b'][0]))
            lo, hi = max(ax1, bx1), min(ax2, bx2)
            if hi - lo < 3.5:
                continue
            ya, yb = A['a'][1], B['a'][1]
            cand = [v for v in Vs if lo - EPS <= v['a'][0] <= hi + EPS and min(v['a'][1], v['b'][1]) <= ya + EPS and max(v['a'][1], v['b'][1]) >= yb - EPS]
            xs = sorted(set(round(v['a'][0], 1) for v in cand))
            for u in range(len(xs)):
                for w in range(u + 1, len(xs)):
                    x1, x2 = xs[u], xs[w]
                    if x2 - x1 < 3.0 or x2 - x1 > maxw:
                        continue
                    # a symbol box is closed: its edges end at the corners; a wire loop has edges that run on
                    if abs(ax1 - x1) > 0.45 or abs(ax2 - x2) > 0.45 or abs(bx1 - x1) > 0.45 or abs(bx2 - x2) > 0.45:
                        continue
                    out.append({'x1': x1, 'y1': ya, 'x2': x2, 'y2': yb, 'edges': (A, B)})
    # keep rectangles with nothing wire-like inside
    keep = []
    for r in out:
        bad = False
        for g in pool:
            mx = (g['a'][0] + g['b'][0]) / 2
            my = (g['a'][1] + g['b'][1]) / 2
            if r['x1'] + 0.5 < mx < r['x2'] - 0.5 and r['y1'] + 0.5 < my < r['y2'] - 0.5:
                bad = True
                break
        if not bad:
            keep.append(r)
    # drop a rectangle that contains another one (keep the minimal ones)
    res = []
    for r in keep:
        if any(q is not r and q['x1'] >= r['x1'] - 0.3 and q['x2'] <= r['x2'] + 0.3 and q['y1'] >= r['y1'] - 0.3 and q['y2'] <= r['y2'] + 0.3 for q in keep):
            continue
        res.append(r)
    return res


def find_circles(strokes, rmin=3.0, rmax=6.5):
    out = []
    for si, p in enumerate(strokes):
        if len(p) < 12:
            continue
        b = bbox(p)
        w, h = b[2] - b[0], b[3] - b[1]
        if not (2 * rmin <= w <= 2 * rmax and abs(w - h) < 0.5):
            continue
        cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
        r = (w + h) / 4
        if all(abs(math.dist(q, (cx, cy)) - r) < 0.45 for q in p) and math.dist(p[0], p[-1]) < 2.7:
            out.append({'cx': cx, 'cy': cy, 'r': r, 's': si})
    return out


def find_po_boxes(strokes, segs):
    """PO / F boxes: a 4-point orthogonal stroke 7.0 x 5.3 (the left or the top edge is the wire end); marks its segments used"""
    out = []
    for si, p in enumerate(strokes):
        if len(p) in (4, 5) and ortho_poly(p):
            b = bbox(p)
            w, h = b[2] - b[0], b[3] - b[1]
            if 6.0 <= w <= 8.0 and 4.6 <= h <= 6.0:
                out.append({'x1': b[0], 'y1': b[1], 'x2': b[2], 'y2': b[3], 's': si})
                for g in segs:
                    if g['s'] == si:
                        g['used'] = 'PO'
    # a box whose four edges are four strokes (DITL sheet 774 TR385)
    have = {(round(o['x1']), round(o['y1'])) for o in out}
    H = [g for g in segs if is_h(g)]
    V = [g for g in segs if is_v(g)]
    for v in V:
        vy1, vy2 = sorted((v['a'][1], v['b'][1]))
        if not (4.6 <= vy2 - vy1 <= 6.0):
            continue
        x1 = v['a'][0]
        for v2 in V:
            x2 = v2['a'][0]
            w = x2 - x1
            if not (6.0 <= w <= 8.0):
                continue
            wy1, wy2 = sorted((v2['a'][1], v2['b'][1]))
            if abs(wy1 - vy1) > 0.1 or abs(wy2 - vy2) > 0.1:
                continue
            top = [g for g in H if abs(g['a'][1] - vy1) < 0.1 and min(g['a'][0], g['b'][0]) <= x1 + 0.1 and max(g['a'][0], g['b'][0]) >= x2 - 0.1 and abs(max(g['a'][0], g['b'][0]) - min(g['a'][0], g['b'][0]) - w) < 0.2]
            bot = [g for g in H if abs(g['a'][1] - vy2) < 0.1 and min(g['a'][0], g['b'][0]) <= x1 + 0.1 and max(g['a'][0], g['b'][0]) >= x2 - 0.1 and abs(max(g['a'][0], g['b'][0]) - min(g['a'][0], g['b'][0]) - w) < 0.2]
            if top and bot and (round(x1), round(vy1)) not in have:
                have.add((round(x1), round(vy1)))
                out.append({'x1': x1, 'y1': vy1, 'x2': x2, 'y2': vy2, 's': -1})
                for g in (v, v2, top[0], bot[0]):
                    g['used'] = 'PO'
    return out


def ortho_poly(p):
    return all(abs(p[i][0] - p[i + 1][0]) < 0.06 or abs(p[i][1] - p[i + 1][1]) < 0.06 for i in range(len(p) - 1))
