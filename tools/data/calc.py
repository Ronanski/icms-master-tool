# Flow compensation (document-references/flow-compensation.xls) and drum level correction (drum-level-calculation.xls)
# -> src/ui/plant/calc.js (LIBRARY > CALC tab and the info card). Usage: python3 tools/data/calc.py
import xlrd, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ref = lambda f: os.path.join(ROOT, 'document-references', f)
def v(x):
    if isinstance(x, float):
        return x if x != int(x) else int(x)
    return str(x).strip()
sh = xlrd.open_workbook(ref('flow-compensation.xls')).sheet_by_index(0)
comp = []
for r in range(sh.nrows - 2):
    if str(sh.cell_value(r, 0)).strip() == 'STATION' and str(sh.cell_value(r + 1, 0)).startswith('STN'):
        a = [v(sh.cell_value(r + 1, c)) for c in range(sh.ncols)]
        b = [v(sh.cell_value(r + 2, c)) for c in range(sh.ncols)]
        comp.append({'stn': a[0], 'flow': a[1], 'desc': b[0], 'ptag': a[2], 'pfs': a[3], 'pbs': a[4], 'pop': a[5], 'atm': a[6],
                     'ttag': a[7], 'ttag2': b[7] if b[7] not in ('', 'at =') else '', 'tfs': a[8], 'tbs': a[9], 'top': a[10], 'abs': a[11],
                     'ap': b[4], 'bp': b[6], 'at': b[9], 'bt': b[11]})
d = xlrd.open_workbook(ref('drum-level-calculation.xls')).sheet_by_index(0)
hdr = [str(d.cell_value(9, c)).strip() for c in range(d.ncols)]
unit = [str(d.cell_value(10, c)).strip() for c in range(d.ncols)]
for c in range(2, len(hdr)):
    if not hdr[c] and unit[c]:
        hdr[c] = hdr[c - 1]  # merged header: the label covers the value and its % column
rows = []
for r in range(11, d.nrows):
    x = [d.cell_value(r, c) for c in range(d.ncols)]
    if isinstance(x[1], float) and isinstance(x[4], float):
        rows.append([round(y, 6) if isinstance(y, float) else y for y in x])
notes = [str(d.cell_value(r, 0)).strip() for r in range(30, d.nrows) if str(d.cell_value(r, 0)).strip()]
head = ' '.join(str(d.cell_value(1, c)).strip() for c in range(d.ncols) if str(d.cell_value(1, c)).strip())
js = ('/* Flow compensation and drum level correction from document-references (made by tools/data/calc.py). Read only. */\n'
      'window.CALC_COMP = ' + json.dumps(comp, ensure_ascii=False) + ';\n'
      'window.CALC_DRUM = ' + json.dumps({'head': head, 'cols': hdr, 'units': unit, 'rows': rows, 'notes': notes}, ensure_ascii=False) + ';\n')
open(os.path.join(ROOT, 'src', 'ui', 'plant', 'calc.js'), 'w').write(js)
print(len(comp), 'flows;', len(rows), 'drum rows;', hdr)
