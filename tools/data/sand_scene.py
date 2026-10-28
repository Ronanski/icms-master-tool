"""Sand injection PDF -> scene: the line work of one sheet sorted into symbols (see tools/data/sand_build.py).

Input: the SVG of `pdftocairo -svg E10210-3-77x.pdf` (tools/data/sand_pdf.py). Coordinates: landscape points, x right, y DOWN.
The drawing is an AutoCAD print: thin strokes (wires, arrow heads, box outlines, text characters) and thick lines that the printer
wrote as filled triangle pairs (gate bodies, the sheet frame) and tiny filled dots (junctions).
Output of scene(): dict with
  thick   [(x1, y1, x2, y2)]            thick center lines (gate / PO boxes, frame)
  dots    [(x, y)]                      junction dots
  arrows  [{tip, dir, tail}]            arrow heads, dir = 'R' 'L' 'U' 'D' = where the tip points
  segs    [(x1, y1, x2, y2)]            straight pieces of every other stroke that is not text (wires, bars, box edges)
  glyphs  [[stroke, ...]]               clusters of small strokes (text characters, symbols' letters)
"""
import collections, math

from sand_pdf import read_svg


def bbox(p):
    xs = [q[0] for q in p]
    ys = [q[1] for q in p]
    return min(xs), min(ys), max(xs), max(ys)


def fills_to_thick(fills):
    """thick lines = pairs of filled triangles; dots = tiny fills"""
    thick, dots = [], []
    used = [False] * len(fills)
    for i, p in enumerate(fills):
        if used[i]:
            continue
        x0, y0, x1, y1 = bbox(p)
        if max(x1 - x0, y1 - y0) < 0.6 and len(p) <= 4:
            used[i] = True
            dots.append(((x0 + x1) / 2, (y0 + y1) / 2))
    for i, p in enumerate(fills):
        if used[i] or i + 1 >= len(fills):
            continue
        q = fills[i + 1]
        pts = []
        for z in p + q:
            if not any(abs(z[0] - w[0]) < 0.011 and abs(z[1] - w[1]) < 0.011 for w in pts):
                pts.append(z)
        if len(pts) != 4:
            continue
        pr = sorted(((math.dist(pts[a], pts[b]), a, b) for a in range(4) for b in range(a + 1, 4)))
        d1, a1, b1 = pr[0]
        pair2 = [t for t in pr[1:] if t[1] not in (a1, b1) and t[2] not in (a1, b1)]
        if not pair2:
            continue
        d2, a2, b2 = pair2[0]
        m1 = ((pts[a1][0] + pts[b1][0]) / 2, (pts[a1][1] + pts[b1][1]) / 2)
        m2 = ((pts[a2][0] + pts[b2][0]) / 2, (pts[a2][1] + pts[b2][1]) / 2)
        used[i] = used[i + 1] = True
        thick.append((round(m1[0], 2), round(m1[1], 2), round(m2[0], 2), round(m2[1], 2)))
    return thick, dots


def arrow_of(p):
    """3-point stroke [tip, tail corner, notch] with the notch on the arrow axis -> (tip, dir, tail corner, notch) or None.
    Two sizes are drawn: 6.0 x 1.44 and 3.84 x 0.96 (the length : half width ratio is 0.24 in both)"""
    if len(p) != 3:
        return None
    t, c, n = p

    def ok(l, w, nl):
        return 3.0 < l < 7.5 and abs(w - 0.24 * l) < 0.2 and abs(nl - 0.8 * l) < 0.5

    if abs(n[1] - t[1]) < 0.05 and ok(abs(c[0] - t[0]), abs(c[1] - t[1]), abs(n[0] - t[0])) and (c[0] - t[0]) * (n[0] - t[0]) > 0:
        return (t, 'R' if c[0] < t[0] else 'L', c, n)
    if abs(n[0] - t[0]) < 0.05 and ok(abs(c[1] - t[1]), abs(c[0] - t[0]), abs(n[1] - t[1])) and (c[1] - t[1]) * (n[1] - t[1]) > 0:
        return (t, 'D' if c[1] < t[1] else 'U', c, n)
    return None


def ortho(p):
    return all(abs(p[i][0] - p[i + 1][0]) < 0.06 or abs(p[i][1] - p[i + 1][1]) < 0.06 for i in range(len(p) - 1))


def scene(svg):
    strokes, fills = read_svg(svg)
    thick, dots = fills_to_thick(fills)
    arrows, rest = [], []
    seen = {}

    def take(p):
        """pull the arrow triples out of a stroke (the plotter joins an arrow head with the wire that starts at its tail)"""
        for i in range(len(p) - 2):
            for rev in (0, 1):
                t = p[i:i + 3][::-1] if rev else p[i:i + 3]
                a = arrow_of(t)
                if a:
                    seen.setdefault((round(a[0][0], 1), round(a[0][1], 1), a[1]), []).append(a)
                    # the wire part keeps the notch point (index 2 of a forward triple, index i of a reversed one)
                    left, right = p[:i + (0 if rev else 1)], p[i + (3 if rev else 2):]
                    if rev:
                        left = p[:i + 1]
                        right = p[i + 3:]
                    else:
                        left = p[:i]
                        right = p[i + 2:]
                    for part in (left, right):
                        if len(part) >= 2:
                            take(part)
                    return
        rest.append(p)

    for p in strokes:
        take(p)
    # a junction dot is drawn as two nested closed outlines: 8 points 1.68 wide (and a 0.72 one inside)
    keep = []
    for p in rest:
        x0, y0, x1, y1 = bbox(p)
        w, h = x1 - x0, y1 - y0
        if len(p) in (6, 7, 8, 9) and 1.3 < w < 1.8 and 1.3 < h < 1.8 and max(w, h) > 1.55:
            dots.append(((x0 + x1) / 2, (y0 + y1) / 2))
            continue
        if len(p) in (5, 6) and w < 0.8 and h < 0.8 and w > 0.6:
            continue
        keep.append(p)
    rest[:] = keep
    for k, v in seen.items():
        arrows.append({'tip': v[0][0], 'dir': v[0][1], 'tail': v[0][2], 'notch': v[0][3], 'n': len(v)})
    return {'strokes': rest, 'thick': thick, 'dots': dots, 'arrows': arrows}
