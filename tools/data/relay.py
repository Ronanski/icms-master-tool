# Interposing relay (IRP), alarm relay (ARP) and sequence-of-events (SER) connection lists of LMYP-1 #1
# (document-references/dcs-hardware-wiring.zip, 12.Wiring/LMYP-1(#1) IRP_ARP_SER.xls) -> src/ui/plant/relay.js
# Merged cells are filled; one record per ITEM (the rows from an item number to the next one). Column titles come from the
# header rows (6..9). Addresses written in the text ("DCS S103:0.0771") and tags (MOT-F1056, S-MFT) are indexed for the
# info card. Usage: python3 tools/data/relay.py
import xlrd, zipfile, json, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
z = zipfile.ZipFile(os.path.join(ROOT, 'document-references', 'dcs-hardware-wiring.zip'))
name = [n for n in z.namelist() if n.endswith('IRP_ARP_SER.xls')][0]
b = xlrd.open_workbook(file_contents=z.read(name), formatting_info=True)
def cell(v):
    if isinstance(v, float):
        return str(int(v)) if v == int(v) else str(v)
    return str(v).strip()
out = []
for sh in b.sheets():
    g = [[cell(sh.cell_value(r, c)) for c in range(sh.ncols)] for r in range(sh.nrows)]
    for (rl, rh, cl, ch) in sh.merged_cells:
        v = g[rl][cl]
        for r in range(rl, rh):
            for c in range(cl, ch):
                if r != rl or c != cl:
                    g[r][c] = v if r < 6 else (v if c != cl or True else '')
    # column titles: the header rows 6..9 joined (group title of a merged header + the column name)
    title = []
    for c in range(sh.ncols):
        parts = []
        for r in (6, 8, 9):
            t = g[r][c].replace('\n', ' ').strip()
            if t and t not in parts:
                parts.append(t)
        title.append(' '.join(parts))
    rec = None
    for r in range(10, sh.nrows):
        row = g[r]
        it = row[0]
        if re.match(r'^\d{1,3}$', it) and (rec is None or it != rec['item']):
            rec = {'sh': sh.name, 'item': it, 'cols': {}}
            out.append(rec)
        if rec is None:
            continue
        for c in range(1, sh.ncols):
            v = row[c].replace('\n', ' ').strip()
            if not v or v in ('-', ' -'):
                continue
            k = title[c] or 'Remark'
            lst = rec['cols'].setdefault(k, [])
            if v not in lst:
                lst.append(v)
for rec in out:
    txt = ' '.join(x for l in rec['cols'].values() for x in l)
    keys = set()
    for m in re.finditer(r'S10(\d)\s*:\s*([0-9OIA-Z])\.(\d{4})', txt):
        p = 'O' if m.group(2) in '0O' else m.group(2)
        keys.add(m.group(1) + '|' + p + '.' + m.group(3))
    for m in re.finditer(r'\b([A-Z]{1,5}-[A-Z]{0,4}\d{3,5}[A-Z0-9-]*|S-[A-Z0-9]{3,})\b', txt):
        keys.add('T|' + m.group(1))
    pk = [k for k in rec['cols'] if 'PANL NO' in k]
    ak = [k for k in rec['cols'] if k.endswith('ADD.')]
    sts = set()
    for k in pk:
        for m in re.finditer(r'\b10(\d)\d\b', ' '.join(rec['cols'][k])):
            sts.add(m.group(1))
    for k in ak:
        for m in re.finditer(r'\b([IOM])\.([0-9A-F]{4})\b', ' '.join(rec['cols'][k])):
            for st in sts or {'?'}:
                keys.add(st + '|' + m.group(1) + '.' + m.group(2))
    rec['keys'] = sorted(keys)
    rec['cols'] = {k: ' / '.join(v) for k, v in rec['cols'].items()}
js = ('/* IRP / ARP / SER connection lists of LMYP-1 #1 (document-references/dcs-hardware-wiring.zip), made by tools/data/relay.py.\n'
      '   One record per item; keys = addresses (station|address) and tags found in the text. Read only. */\n'
      'window.RELAY = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'src', 'ui', 'plant', 'relay.js'), 'w').write(js)
from collections import Counter
print(len(out), 'items', Counter(r['sh'] for r in out), len(js), 'bytes')
for r in out[:1] + [x for x in out if x['sh'].startswith('IRP')][:1] + [x for x in out if x['sh'].startswith('SER')][:1]:
    print(json.dumps(r, ensure_ascii=False)[:700])
