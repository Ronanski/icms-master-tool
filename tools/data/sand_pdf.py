"""Sand injection system logic (E10210-3-771 ~ 777, PDF only: no DWG / DXF exists for it) -> raw geometry.

The PDF (doPDF print of an AutoCAD drawing) has every wire, block outline and text character as a stroked polyline. This reads the
SVG that `pdftocairo -svg` writes and returns the paths in LANDSCAPE sheet coordinates (x right, y DOWN, points):
  strokes: list of polylines [[x, y], ...]      fills: list of filled polygons (arrow heads, junction dots)
Usage: python3 tools/data/sand_pdf.py <file.svg>   (prints counts)
"""
import re, sys

W_PORTRAIT, H_PORTRAIT = 595.0, 842.0


def landscape(dx, dy):
    """svg path coordinates (the path carries matrix(1,0,0,-1,0,842)) -> landscape (x right, y down)"""
    y_down = H_PORTRAIT - dy
    return (round(y_down, 3), round(W_PORTRAIT - dx, 3))


def landscape_fill(x, y):
    """a filled path has no transform: its coordinates are already svg user space (y down)"""
    return (round(y, 3), round(W_PORTRAIT - x, 3))


def read_svg(path):
    body = open(path).read().split('</defs>')[1]
    strokes, fills = [], []
    for attrs in re.findall(r'<path ([^>]*)/>', body):
        d = re.search(r' d="([^"]*)"', attrs).group(1)
        for sub in re.split(r'(?=M )', d):
            nums = re.findall(r'-?\d+\.?\d*', sub)
            if len(nums) < 4:
                continue
            stroke = 'stroke=' in attrs
            f = landscape if stroke else landscape_fill
            pts = [f(float(nums[i]), float(nums[i + 1])) for i in range(0, len(nums) - 1, 2)]
            (strokes if stroke else fills).append(pts)
    return strokes, fills


if __name__ == '__main__':
    s, f = read_svg(sys.argv[1])
    print(len(s), 'strokes', len(f), 'fills')
