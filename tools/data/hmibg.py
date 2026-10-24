#!/usr/bin/env python3
"""PLANT VIEW 1:1 graphics (2.5.0-beta.15, user 2026-10-20: "kopyahin mo ang reference 1:1 ... pati lines, dashed lines").

Each plant screen shows the control-room HMI snapshot itself (document-references/hmi-snapshot-sample.zip) as its picture, so
every shape, line, dashed line, label and colour is the one of the plant HMI. On top of it the app draws only what moves:
  - a LIVE number exactly over the snapshot number (found here: the cyan digits next to the item of systems.js),
  - the colour of a valve / damper / pump / fan / motor / lamp / check box (a mask of the symbol pixels, found here),
  - the PV / SV / MV of a controller box and the seven numbers of the header bar.
Not linked items keep the snapshot picture (the same snapshot value as before).

Usage: python3 tools/data/hmibg.py [--debug DIR]   -> writes src/ui/plant/hmibg.js
The item index (systems.js order) is the key: run this again after a change of systems.js (tests/regress/plant_bg.js checks it).
"""
import base64, io, json, os, re, subprocess, sys, zipfile
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ZIP = os.path.join(ROOT, 'document-references', 'hmi-snapshot-sample.zip')
OUT = os.path.join(ROOT, 'src', 'ui', 'plant', 'hmibg.js')
RIGHT = 1886  # the HMI "MENU / SUB MENU" side strip starts here (window chrome, not the graphic)
# parts of a snapshot that are not the HMI graphic (the TOOL WINDOW of the screenshot program over 03 / 11 / 28 / 5 / 9): painted black
ERASE = {'03.png': [(262, 1000, 664, 1080)], '11.png': [(1440, 1008, 1846, 1080)], '28.png': [(1100, 1012, 1506, 1080)], '5.png': [(1228, 1010, 1636, 1080)], '9.png': [(988, 1008, 1396, 1080)]}
# the Windows task bar under the HMI window (4 / 8 / 29 / 30 / 36 / 37 / 38): the picture ends above it
BOTTOM = {n: 995 for n in ('4.PNG', '8.PNG', '29.PNG', '30.PNG', '36.PNG', '37.PNG', '38.PNG')}
NCOL = 256  # palette size of the stored picture (PNG, no dither; 32 colours changed the fan / ESP / check box colours)


def systems():
    js = "global.window={};eval(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(JSON.stringify(window.PLANT_SYS))"
    return json.loads(subprocess.check_output(['node', '-e', js, os.path.join(ROOT, 'src', 'ui', 'plant', 'systems.js')]))


def load(zf, name):
    for n in zf.namelist():
        if n.endswith('/' + name):
            return np.array(Image.open(io.BytesIO(zf.read(n))).convert('RGB')).astype(np.int16)
    return None


def crop_top(a):
    """top of the HMI window title bar = 38 px above the pink header bar (MSP / MST / ... line)"""
    pink = (abs(a[:, :, 0] - 250) < 12) & (abs(a[:, :, 1] - 158) < 12) & (abs(a[:, :, 2] - 204) < 12)
    rows = np.where(pink.sum(1) > 400)[0]
    return (max(0, int(rows[0]) - 38) if len(rows) else 0), (int(rows[0]) if len(rows) else 70)


def cyan(a):
    # the value digits of the HMI: cyan core (ClearType fringes around it are blue / green, dilated in)
    return (a[:, :, 0] < 110) & (a[:, :, 1] > 170) & (a[:, :, 2] > 170)


def nowhite(a, m):
    # white text (tags, units) has cyan / yellow ClearType fringes: those pixels are not part of a number
    w = (a[:, :, 0] > 170) & (a[:, :, 1] > 170) & (a[:, :, 2] > 170)
    return m & ~nd.binary_dilation(w, structure=np.ones((3, 5)))


def valcol(a):
    # a value is cyan, or yellow when it is in alarm (7.PNG furnace temperatures 957 / 956 C)
    return nowhite(a, cyan(a) | ((a[:, :, 0] > 200) & (a[:, :, 1] > 200) & (a[:, :, 2] < 90)))


def anycol(a):
    # last try (a value in alarm colour, red / pink / white: 7.PNG TIFG1100 861 C, AIFG1123 2.2 %): any bright pixel, used
    # only where no cyan / yellow number is found, in a tight window and with the width of the snapshot number
    return a.max(axis=2) > 150


def words(a, box, mask_fn=valcol, gap=9):
    """cyan words inside box (x0, y0, x1, y1): list of [x0, y0, x1, y1]"""
    H, W = a.shape[:2]
    x0, y0, x1, y1 = [int(v) for v in box]
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    if x1 <= x0 or y1 <= y0:
        return []
    m = mask_fn(a[y0:y1, x0:x1])
    if not m.any():
        return []
    dm = nd.binary_dilation(m, structure=np.ones((3, gap)))
    lab, n = nd.label(dm)
    out = []
    for s in nd.find_objects(lab):
        sub = m[s]
        if sub.sum() < 6:
            continue
        ys, xs = np.where(sub)
        if ys.max() - ys.min() > 24 or xs.max() - xs.min() > 130:
            continue  # a duct, a bar or a box of that colour, not a number
        bw, bh = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
        if bw > 10 and bh > 10 and sub.sum() > 0.6 * bw * bh:
            continue  # a lit mode button (the yellow A / M / R square of 33.PNG), not digits
        out.append([x0 + s[1].start + xs.min(), y0 + s[0].start + ys.min(), x0 + s[1].start + xs.max() + 1, y0 + s[0].start + ys.max() + 1])
    # one number in a large font has wide gaps ("238.4" of 33.PNG): join the pieces on one line closer than 0.9 x the digit height
    out.sort(key=lambda w: (w[1], w[0]))
    done = True
    while done:
        done = False
        for i in range(len(out)):
            for j in range(len(out)):
                if i == j:
                    continue
                p, q = out[i], out[j]
                h = min(p[3] - p[1], q[3] - q[1])
                if q[0] >= p[2] and q[0] - p[2] <= 0.9 * h and min(p[3], q[3]) - max(p[1], q[1]) > 0.6 * h and abs((p[3] - p[1]) - (q[3] - q[1])) <= 3:
                    out[i] = [p[0], min(p[1], q[1]), q[2], max(p[3], q[3])]
                    out.pop(j)
                    done = True
                    break
            if done:
                break
    return out


def bgcol(a, b):
    x0, y0, x1, y1 = b
    ring = np.concatenate([a[y0 - 3, x0 - 3:x1 + 3], a[y1 + 2, x0 - 3:x1 + 3], a[y0 - 3:y1 + 3, x0 - 3], a[y0 - 3:y1 + 3, x1 + 2]])
    v, c = np.unique(ring.reshape(-1, 3), axis=0, return_counts=True)
    return '#%02x%02x%02x' % tuple(int(x) for x in v[c.argmax()])


def num(a, w, v=None):
    """spec of a number: box (with 2 px for the ClearType fringe), its colour and background; the box reaches left over the
    whole snapshot number (a blurred snapshot, 02.png, splits "0.1" at the point)"""
    x0, y0, x1, y1 = w
    if v:
        x0 = min(x0, int(x1 - len(str(v).strip()) * 0.56 * (y1 - y0)))
    sub = a[y0:y1, x0:x1]
    m = valcol(sub)
    if m.sum() <= 4:
        m = anycol(sub)  # a white / pink number (alarm colour) keeps its colour
    fc = '#00ffff'
    if m.sum() > 4:
        v_, c_ = np.unique(sub[m].reshape(-1, 3), axis=0, return_counts=True)
        fc = '#%02x%02x%02x' % tuple(int(x) for x in v_[c_.argmax()])
    # bold digits (the faceplate fields of 33.PNG): thick strokes = many value pixels in the box
    fr = float(m.sum()) / max(1, (x1 - x0) * (y1 - y0))
    # background = the commonest pixel inside the box that is not part of the digits (a ring outside it can hit the white frame
    # of a faceplate field, 33.PNG)
    nb = ~nd.binary_dilation(a[y0:y1, x0:x1].max(axis=2) > 90, structure=np.ones((3, 3)))
    if nb.sum() > 8:
        v_, c_ = np.unique(sub[nb].reshape(-1, 3), axis=0, return_counts=True)
        bgc = '#%02x%02x%02x' % tuple(int(x) for x in v_[c_.argmax()])
    else:
        bgc = bgcol(a, [x0 - 2, y0 - 2, x1 + 2, y1 + 2])
    return {'b': [int(x0) - 2, int(y0) - 2, int(x1 - x0) + 4, int(y1 - y0) + 4], 'bg': bgc, 'h': int(y1 - y0), 'c': fc, 'fr': round(fr, 2)}


def pick(cands, ax, ay, used, dx=(-28, 60), dy=(-16, 12)):
    """the word whose left-bottom corner is nearest to the anchor (ax, ay), not used by another item"""
    best, bd = None, 1e9
    for w in cands:
        k = (w[0], w[1])
        if k in used:
            continue
        ddx, ddy = w[0] - ax, w[3] - ay
        if not (dx[0] <= ddx <= dx[1] and dy[0] <= ddy <= dy[1]):
            continue
        d = abs(ddx) + 2.5 * abs(ddy)
        if d < bd:
            bd, best = d, w
    return best


def colourcls(a):
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    red = (r > 150) & (g < 110) & (b < 110)
    grn = (g > 140) & (r < 130) & (b < 130)
    wht = (r > 170) & (g > 170) & (b > 170)
    return red, grn, wht


def symbol(a, cx, cy, rad=17, core=7, white=True, black=False):
    """mask of the red / green (/ white) symbol pixels around (cx, cy): the components that touch the core square"""
    H, W = a.shape[:2]
    x0, y0, x1, y1 = max(0, cx - rad), max(0, cy - rad), min(W, cx + rad), min(H, cy + rad)
    sub = a[y0:y1, x0:x1]
    red, grn, wht = colourcls(sub)
    best = None
    for nm, m in (('r', red), ('g', grn)) + ((('w', wht),) if white else ()) + ((('k', np.all(sub < 40, axis=2)),) if black else ()):
        lab, n = nd.label(m, structure=np.ones((3, 3)))
        if not n:
            continue
        cxl, cyl = cx - x0, cy - y0
        ids = set(np.unique(lab[max(0, cyl - core):cyl + core, max(0, cxl - core):cxl + core])) - {0}
        if not ids:
            continue
        mm = np.isin(lab, list(ids))
        if nm == 'k' and (mm[0].any() or mm[-1].any() or mm[:, 0].any() or mm[:, -1].any()):
            continue  # black that runs out of the window is the background, not a lamp
        cnt = int(mm.sum())
        if cnt >= 12 and (best is None or cnt > best[2]):
            best = (nm, mm, cnt)
    if not best:
        return None
    nm, mm, _ = best
    mm = nd.binary_fill_holes(mm)  # a lamp with a highlight (012 BURNER-A OFF) is one disk
    if nm != 'k':
        mm = nd.binary_dilation(mm, structure=np.ones((3, 3))) & ~(np.all(sub < 40, axis=2))  # the antialias edge, not the black outline
    ys, xs = np.where(mm)
    bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    im = Image.fromarray((mm[by0:by1, bx0:bx1] * 255).astype(np.uint8), 'L').convert('1')
    bio = io.BytesIO()
    im.save(bio, 'PNG', optimize=True)
    return {'b': [int(x0 + bx0), int(y0 + by0), int(bx1 - bx0), int(by1 - by0)], 's': nm, 'm': 'data:image/png;base64,' + base64.b64encode(bio.getvalue()).decode()}


def flen(v):
    return max(1, len(str(v if v is not None else '').strip()))


def screen(zf, sysd, dbg=None):
    name = sysd['src']
    a = load(zf, name)
    if a is None:
        return None, 'no reference image'
    H = min(a.shape[0], BOTTOM.get(name, a.shape[0]))
    a = a[:H]
    top, ypink = crop_top(a)
    base = np.median(a[top:, :RIGHT].reshape(-1, 3), axis=0)
    for (x0, y0, x1, y1) in ERASE.get(name, []):
        a[y0:y1, x0:x1] = 0
    cw = words(a, (0, top, RIGHT, H))
    cyw = [w for w in words(a, (0, top, RIGHT, H), mask_fn=lambda b: nowhite(b, cyan(b))) if any(abs(w[0] - c[0]) <= 2 and abs(w[1] - c[1]) <= 2 for c in cw)]
    used = set()
    out = {}
    miss = []
    items = sysd['items']
    want = []  # (item index, slot, anchor x, anchor y, dx range, dy range): the numbers, matched below nearest first
    for i, it in enumerate(items):
        t = it['t']
        try:
            if t == 'header':
                # the seven dark value boxes of the pink header bar (MSP ... PWR), left to right
                band = a[ypink:ypink + 38, 660:RIGHT]
                lab, n = nd.label(np.all(band < 45, axis=2))
                bx = []
                for sl in nd.find_objects(lab):
                    w_, h_ = sl[1].stop - sl[1].start, sl[0].stop - sl[0].start
                    if 28 <= w_ <= 120 and 18 <= h_ <= 32 and cyan(band[sl]).sum() > 20:
                        bx.append([660 + sl[1].start, ypink + sl[0].start, 660 + sl[1].stop, ypink + sl[0].stop])
                bx.sort(key=lambda b: b[0])
                if len(bx) == len(it['items']):
                    out[i] = {'k': 'hdr', 'n': [{'b': [int(b[0]), int(b[1]), int(b[2] - b[0]), int(b[3] - b[1])], 'bg': '#000000', 'h': int(b[3] - b[1]) - 6} for b in bx]}
                    for w in cw:
                        if ypink <= w[1] <= ypink + 38 and w[0] > 660:
                            used.add((w[0], w[1]))
                else:
                    miss.append((i, t, 'header boxes %d' % len(bx)))
            elif t == 'ctl':
                x, y = int(it['x']), int(it['y'])
                ws_ = sorted([w for w in cyw if x + 30 <= w[0] <= x + (200 if name == '33.PNG' else 150) and y - (20 if name == '33.PNG' else 4) <= w[1] <= y + 112 and (w[0], w[1]) not in used], key=lambda w: (w[1], w[0]))
                # the rows of the HMI box (PV, SV, MV): one number per row, the right-most
                rows = []
                for w in ws_:
                    if rows and abs(rows[-1][0][1] - w[1]) < 8:
                        rows[-1].append(w)
                    else:
                        rows.append([w])
                rows = [max(r, key=lambda w: w[2]) for r in rows]
                spec = {'k': 'ctl', 'b': [x, y, 160, 108]}
                for k, w in zip(('pv', 'sv', 'mv'), rows[:3]):  # top down (a value below the box, X(DE) of 03.png, is not its MV)
                    spec[k] = num(a, w, it.get(k))
                    used.add((w[0], w[1]))
                # the mode letter of the HMI box (A / R cyan, M yellow) at its top left corner
                ml = [w for w in cw if ((x - 2 <= w[0] <= x + 42 and y - 14 <= w[1] <= y + 44) or (x + 130 <= w[0] <= x + 162 and y - 4 <= w[1] <= y + 26)) and 4 <= w[2] - w[0] <= 14 and 8 <= w[3] - w[1] <= 16 and (w[0], w[1]) not in used]
                if ml and name != '33.PNG':
                    w = min(ml, key=lambda w: (w[1], w[0]))
                    spec['ml'] = num(a, w, 'A')
                    used.add((w[0], w[1]))
                # 33.PNG: the faceplate has its own A / M (/ R) buttons, 106 px right of the box, A at y 698: the live mode lights them
                if name == '33.PNG':
                    am = {}
                    for L, yy in (('R', 664), ('A', 698), ('M', 732)):
                        bx_ = x + 106
                        if a[yy + 12, bx_ + 4].max() > 150:
                            am[L] = [bx_, yy, 31, 26]
                    if 'A' in am and 'M' in am:
                        spec['am'] = am
                    # the PV (cyan) and SV (yellow) bars: the column, its dark slot above, and the scale top from the snapshot
                    # value (PV 150.0 = 163 of 215 px -> 200.0 printed on the faceplate)
                    reg = a[560:830, x:x + 120]
                    for key, m, ref in (('bpv', (reg[:, :, 0] < 90) & (reg[:, :, 1] > 100) & (reg[:, :, 2] > 100), it.get('pv')),
                                        ('bsv', (reg[:, :, 0] > 120) & (reg[:, :, 1] > 100) & (reg[:, :, 2] < 70), it.get('sv'))):
                        lab, n = nd.label(m)
                        for sl in nd.find_objects(lab):
                            if sl[0].stop - sl[0].start > 40 and sl[1].stop - sl[1].start <= 16:
                                bx0, bx1, bt, bb = x + sl[1].start, x + sl[1].stop, 560 + sl[0].start, 560 + sl[0].stop
                                col = a[560:bb, (bx0 + bx1) // 2]
                                yt = bt
                                while yt > 562 and abs(int(col[yt - 1 - 560][0]) - int(col[bt - 2 - 560][0])) < 6 and col[yt - 1 - 560].max() < 70:
                                    yt -= 1
                                try:
                                    mx = float(ref) * (bb - yt) / max(1, bb - bt)
                                except (TypeError, ValueError):
                                    continue
                                nice = min((10, 20, 50, 100, 120, 150, 200, 250, 300, 500), key=lambda q: abs(q - mx))
                                c_ = a[(bt + bb) // 2, (bx0 + bx1) // 2]
                                spec[key] = {'b': [int(bx0), int(yt), int(bx1 - bx0), int(bb - yt)], 'max': nice, 'c': '#%02x%02x%02x' % tuple(int(q) for q in c_),
                                             'bg': '#%02x%02x%02x' % tuple(int(q) for q in col[bt - 2 - 560])}
                                break
                    if 'bpv' in spec and 'bsv' in spec:  # one scale for PV and SV (same unit): the SV slot is the PV slot height
                        spec['bsv']['b'][1], spec['bsv']['b'][3], spec['bsv']['max'] = spec['bpv']['b'][1], spec['bpv']['b'][3], spec['bpv']['max']
                out[i] = spec
                if len(rows) < 2:
                    miss.append((i, t, '%s rows %d' % (it.get('tag'), len(rows))))
            elif t == 'val':
                if not re.match(r'^-?[0-9][0-9.]*$', str(it.get('v', '')).strip()):
                    continue  # the AVERAGE / PIBR10012 button of the HMI, not a number
                want.append((i, 'num', it['x'], it['y'], (-28, 150), (-16, 12)))
            elif t in ('valve', 'damper', 'mov'):
                spec = {'k': 'sym'}
                sy = symbol(a, int(it['x']), int(it['y']))
                if sy:
                    spec['sym'] = sy
                out[i] = spec
                if t != 'mov' or it.get('v') is not None:
                    want.append((i, 'n', it['x'] + 14, it['y'] + 6, (-45, 50), (-14, 24)))
            elif t in ('pump', 'fan', 'motor'):
                sy = symbol(a, int(it['x']), int(it['y']), rad=26, core=10, white=False)
                if sy:
                    out[i] = {'k': 'sym', 'sym': sy}
                else:
                    miss.append((i, t, it.get('tag')))
            elif t == 'lamp':
                # the lamp disk (lit red / green, or black when off: 012 BURNER-A ON)
                sy = symbol(a, int(it['x']) + 10, int(it['y']) - 11, rad=26, core=5, white=False, black=True)
                if sy:
                    out[i] = {'k': 'sym', 'sym': sy}
                else:
                    miss.append((i, t, it.get('s')))
            elif t == 'flag':
                sy = symbol(a, int(it['x']) + 8, int(round(it['y'])) - 7, rad=12, core=5, white=False)
                if sy:
                    out[i] = {'k': 'sym', 'sym': sy}
                else:
                    miss.append((i, t, it.get('s')))
        except Exception as e:  # noqa
            miss.append((i, t, 'error ' + str(e)))
    # numbers: every (item, word) pair in range, nearest first, one word per item and one item per word
    pairs = []
    for (i, slot, ax, ay, dx, dy) in want:
        for w in cw:
            if (w[0], w[1]) in used:
                continue
            ddx, ddy = w[0] - ax, w[3] - ay
            if dx[0] <= ddx <= dx[1] and dy[0] <= ddy <= dy[1]:
                # and about as wide as the snapshot number (a mode letter R / A beside a valve is one glyph)
                v = str(items[i].get('v', '') or '').strip()
                ew = len(v) * 0.56 * (w[3] - w[1]) if v else w[2] - w[0]
                if len(v) >= 3 and w[2] - w[0] < 0.45 * ew:
                    continue  # one glyph (the R / A mode letter beside a valve) is not a number of 3 or more characters
                pairs.append((abs(ddx) + 2.5 * abs(ddy) + 1.5 * abs((w[2] - w[0]) - ew), i, slot, w))
    pairs.sort(key=lambda p: p[0])
    got = set()
    for d, i, slot, w in pairs:
        if i in got or (w[0], w[1]) in used:
            continue
        got.add(i)
        used.add((w[0], w[1]))
        v = items[i].get('v')
        if slot == 'num':
            out[i] = dict(k='num', **num(a, w, v))
        else:
            out[i]['n'] = num(a, w, v)
    rw = words(a, (0, top, RIGHT, H), mask_fn=anycol, gap=4)
    for (i, slot, ax, ay, dx, dy) in want:
        if i in got:
            continue
        v = str(items[i].get('v', '') or '').strip()
        best = None
        for w in rw:
            ddx, ddy = w[0] - ax, w[3] - ay
            ew = len(v) * 0.56 * (w[3] - w[1])
            if v and (w[0], w[1]) not in used and -12 <= ddx <= 40 and -9 <= ddy <= 9 and 0.6 * ew <= w[2] - w[0] <= 1.5 * ew + 4 and 9 <= w[3] - w[1] <= 14:
                d = abs(ddx) + 2.5 * abs(ddy)
                if best is None or d < best[0]:
                    best = (d, w)
        if best:
            w = best[1]
            got.add(i)
            used.add((w[0], w[1]))
            if slot == 'num':
                out[i] = dict(k='num', **num(a, w, v))
            else:
                out[i]['n'] = num(a, w, v)
    for (i, slot, ax, ay, dx, dy) in want:
        if i not in got and not (i in out and 'sym' in out[i]):
            miss.append((i, items[i]['t'], items[i].get('tag')))
            out.pop(i, None)
    img = Image.fromarray(np.clip(a[top:, :RIGHT], 0, 255).astype(np.uint8), 'RGB')
    q = img.quantize(NCOL, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    bio = io.BytesIO()
    q.save(bio, 'PNG', optimize=True)
    if dbg:
        d = img.copy()
        dr = ImageDraw.Draw(d)
        for i, s in out.items():
            for k in ('n', 'pv', 'sv', 'mv'):
                if k in s and s['k'] != 'hdr':
                    b = s[k]['b']
                    dr.rectangle([b[0], b[1] - top, b[0] + b[2], b[1] + b[3] - top], outline=(255, 0, 255))
            if s['k'] == 'num':
                b = s['b']
                dr.rectangle([b[0], b[1] - top, b[0] + b[2], b[1] + b[3] - top], outline=(255, 0, 255))
            if s['k'] == 'hdr':
                for n_ in s['n']:
                    b = n_['b']
                    dr.rectangle([b[0], b[1] - top, b[0] + b[2], b[1] + b[3] - top], outline=(255, 128, 0))
            if 'sym' in s:
                b = s['sym']['b']
                dr.rectangle([b[0], b[1] - top, b[0] + b[2], b[1] + b[3] - top], outline=(255, 255, 0))
        for i, t, why in miss:
            it = sysd['items'][i]
            if 'x' in it:
                dr.ellipse([it['x'] - 5, it['y'] - 5 - top, it['x'] + 5, it['y'] + 5 - top], outline=(255, 0, 0), width=2)
        d.save(os.path.join(dbg, sysd['id'] + '.png'))
    return {'img': 'data:image/png;base64,' + base64.b64encode(bio.getvalue()).decode(), 'x': 0, 'y': top, 'w': RIGHT, 'h': H - top,
            'n': len(sysd['items']), 'o': out}, miss


def main():
    dbg = None
    if '--debug' in sys.argv:
        dbg = sys.argv[sys.argv.index('--debug') + 1]
        os.makedirs(dbg, exist_ok=True)
    zf = zipfile.ZipFile(ZIP)
    res = {}
    allmiss = 0
    for s in systems():
        if not re.search(r'\.(png|PNG)$', s.get('src', '')):
            continue
        r, miss = screen(zf, s, dbg)
        if r is None:
            print(s['id'], 'SKIP', miss)
            continue
        res[s['id']] = r
        allmiss += len(miss)
        print('%-4s %-34s items %3d overlays %3d  not found %d  png %d KB' % (s['id'], s['title'][:34], len(s['items']), len(r['o']), len(miss), len(r['img']) * 3 // 4 // 1024))
        for m in miss:
            print('      not found:', m)
    js = ('/* generated by tools/data/hmibg.py (2.5.0-beta.15): the HMI snapshot of each plant screen (1:1 picture, palette PNG) and the\n'
          '   places of what moves on it (numbers, symbol masks, controller boxes), keyed by the item index of systems.js. Do not edit. */\n'
          'window.PLANT_BG = ' + json.dumps(res, separators=(',', ':')) + ';\n')
    with open(OUT, 'w') as f:
        f.write(js)
    print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB; not found', allmiss)


if __name__ == '__main__':
    main()
