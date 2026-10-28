"""Sand injection system logic (E10210-3-771 ~ 777) -> logic model of one sheet: blocks, pins, nets.

Reads the scene of tools/data/sand_scene.py + the OCR texts, finds the symbols of tools/data/sand_symbols.py and joins the
pins to the wire nets. Output of build(): dict { 'wires': [...], 'blocks': [...], 'nets': n, 'texts': [...] }.
Usage: python3 tools/data/sand_build.py <svg folder> <ocr.json> <sheet>   (prints the model of one sheet)
"""
import json, math, sys

from sand_scene import scene, bbox
from sand_symbols import (segs_of, find_not, thick_groups, classify_thick, wire_pool, merge_collinear, find_rects, find_circles,
                          nets_of, is_h, is_v, EPS, find_po_boxes)

FRAME = (46, 78.5, 704, 489)


def seg_has(g, p, e=EPS):
    if is_h(g):
        x1, x2 = sorted((g['a'][0], g['b'][0]))
        return abs(p[1] - g['a'][1]) <= e and x1 - e <= p[0] <= x2 + e
    y1, y2 = sorted((g['a'][1], g['b'][1]))
    return abs(p[0] - g['a'][0]) <= e and y1 - e <= p[1] <= y2 + e


def net_at(pool, p, e=0.7):
    """net of the wire that has the point p on it (end or body); nearest wins"""
    best = None
    for g in pool:
        if seg_has(g, p, e):
            d = min(math.dist(p, g['a']), math.dist(p, g['b']))
            if best is None or d < best[0]:
                best = (d, g['net'])
    return best[1] if best else None


def cut_through(pool, boxes):
    """a wire drawn straight through a symbol (timer, gate body, flip-flop, NOT box) is two wires: cut it at the symbol"""
    out = []
    for g in pool:
        parts = [g]
        for b in boxes:
            nxt = []
            for q in parts:
                if is_h(q):
                    y = q['a'][1]
                    x1, x2 = sorted((q['a'][0], q['b'][0]))
                    if b['y1'] + 0.4 < y < b['y2'] - 0.4 and x1 < b['x1'] + 0.4 and x2 > b['x2'] - 0.4:
                        nxt.append({**q, 'a': (x1, y), 'b': (b['x1'], y)})
                        nxt.append({**q, 'a': (b['x2'], y), 'b': (x2, y)})
                        continue
                else:
                    x = q['a'][0]
                    y1, y2 = sorted((q['a'][1], q['b'][1]))
                    if b['x1'] + 0.4 < x < b['x2'] - 0.4 and y1 < b['y1'] + 0.4 and y2 > b['y2'] - 0.4:
                        nxt.append({**q, 'a': (x, y1), 'b': (x, b['y1'])})
                        nxt.append({**q, 'a': (x, b['y2']), 'b': (x, y2)})
                        continue
                nxt.append(q)
            parts = nxt
        out += parts
    return out


def rect_is_symbol(r, ocr, segs):
    """a closed rectangle of wires is a symbol box only with text inside, or small, or a drawing (circles, slants) inside; a loop of plain wires is not"""
    w, h = r['x2'] - r['x1'], r['y2'] - r['y1']
    if any(r['x1'] - 0.3 <= (o['x0'] + o['x1']) / 2 <= r['x2'] + 0.3 and r['y1'] - 0.3 <= (o['y0'] + o['y1']) / 2 <= r['y2'] + 0.3 for o in ocr):
        return True
    if w <= 9.5 and h <= 8.0:
        return True
    if abs(w - 12.2) < 0.5 and abs(h - 12.2) < 0.5:
        return True
    for g in segs:
        mx, my = (g['a'][0] + g['b'][0]) / 2, (g['a'][1] + g['b'][1]) / 2
        if r['x1'] + 0.3 < mx < r['x2'] - 0.3 and r['y1'] + 0.3 < my < r['y2'] - 0.3 and not is_h(g) and not is_v(g) and math.dist(g['a'], g['b']) > 4.0 \
                and not any(o['x0'] - 0.5 <= mx <= o['x1'] + 0.5 and o['y0'] - 0.5 <= my <= o['y1'] + 0.5 for o in ocr):
            return True
    return False


def build(svg, ocr):
    sc = scene(svg)
    segs = segs_of(sc['strokes'])
    nots = find_not(segs)
    circles = find_circles(sc['strokes'])
    pos = find_po_boxes(sc['strokes'], segs)
    for c in circles:
        for g in segs:
            if g['s'] == c['s']:
                g['used'] = 'CIRCLE'
    groups = [g for g in thick_groups(sc['thick'])]
    for g in groups:
        g['k'] = classify_thick(g)
    bodies = [g for g in groups if g['k'] in ('AND', 'ANDT')]
    timers = [g for g in groups if g['k'] in ('TMRH', 'TMRV')]
    srs = [g for g in groups if g['k'] == 'SR']
    pool0 = wire_pool(sc['strokes'], segs, ocr, FRAME, sc['arrows'])
    pool = merge_collinear(pool0)
    rects = [r for r in find_rects(pool, ocr) if rect_is_symbol(r, ocr, segs)]
    return {'sc': sc, 'segs': segs, 'nots': nots, 'circles': circles, 'po': pos, 'bodies': bodies, 'timers': timers, 'srs': srs, 'pool': pool, 'rects': rects,
            'groups': groups}


if __name__ == '__main__':
    folder, ocrf, n = sys.argv[1], sys.argv[2], int(sys.argv[3])
    ocr = json.load(open(ocrf))[str(n)]
    m = build('%s/%d.svg' % (folder, n), ocr)
    for k in ('nots', 'circles', 'bodies', 'timers', 'srs', 'rects'):
        print(k, len(m[k]))
