# Marshalling panel -> FCS wiring (LMYP-1 #1 WIRING.xls, in document-references/dcs-hardware-wiring.zip) -> src/ui/plant/wiring.js
# Merged cells: the value of a merged range is copied to every row it covers. One signal = the row with an address (ADD.)
# and the rows below it until the next address (terminal + / -, cores). FCS code 10SN = STN10S (1012 = STN101, unit 2).
# Usage: python3 tools/data/wiring.py   (needs xlrd; reads the zip, writes src/ui/plant/wiring.js)
import xlrd, zipfile, io, json, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
z = zipfile.ZipFile(os.path.join(ROOT, 'document-references', 'dcs-hardware-wiring.zip'))
name = [n for n in z.namelist() if n.endswith('LMYP-1(#1) WIRING.xls') and 'Copy of' not in n][0]
b = xlrd.open_workbook(file_contents=z.read(name), formatting_info=True)
def cell(v):
    if isinstance(v, float):
        return str(int(v)) if v == int(v) else str(v)
    return str(v).strip()
COLS = ['item', 'mpl', 'jb', 'tb', 'xcab', 'xspec', 'xcore', 'mpl2', 'tbs', 'tbn', 'cab', 'spec', 'core', 'ext', 'exttb', '_', 'fcstb', 'board', 'fcab', 'stn', 'node', 'slot', 'ch', 'a', 'tag', 'd', 'sig', 'check']
out = []
for shn in ['AIO', 'DI', 'DO']:
    sh = b.sheet_by_name(shn)
    g = [[cell(sh.cell_value(r, c)) for c in range(sh.ncols)] for r in range(sh.nrows)]
    for (rl, rh, cl, ch) in sh.merged_cells:
        v = g[rl][cl]
        for r in range(rl, rh):
            for c in range(cl, ch):
                g[r][c] = v
    cols = COLS if shn != 'DO' else ['dw', 'fcstb'] + COLS[2:15] + ['_', '_2'] + COLS[17:]
    if shn == 'DO':
        # DO sheet: D/W, O/P, Board, CAB, STN, NODE, SLOT, Ch, ADD, TAG, Desc on the FCS side start at col 0 of the right half
        pass
    rec = None
    for r in range(10, sh.nrows):
        row = g[r]
        def get(k):
            i = COLS.index(k)
            return row[i] if i < len(row) else ''
        addr = get('a')
        if re.match(r'^(AI|AO|I\.|O\.)', addr) and (rec is None or addr != rec['a'] or get('ch') != rec['ch']):
            stn = get('stn')
            m = re.match(r'^10(\d)\d$', stn)
            rec = {k: get(k) for k in COLS if k not in ('_',)}
            rec['k'] = shn
            rec['s'] = m.group(1) if m else ''
            for k in ('tb', 'xcore', 'tbn', 'core', 'fcstb'):
                rec[k] = [rec[k]] if rec[k] else []
            out.append(rec)
        elif rec is not None and not addr:
            for k in ('tb', 'xcore', 'tbn', 'core', 'fcstb'):
                v = get(k)
                if v and v not in rec[k]:
                    rec[k].append(v)
# compact: one array per signal, field order in F
F = ['k', 's', 'a', 'tag', 'd', 'sig', 'board', 'fcab', 'stn', 'node', 'slot', 'ch', 'fcstb', 'ext', 'exttb', 'cab', 'spec', 'core', 'mpl2', 'tbs', 'tbn', 'xcab', 'xspec', 'xcore', 'mpl', 'jb', 'tb']
rows = [[(','.join(r[f]) if isinstance(r.get(f), list) else r.get(f, '')) for f in F] for r in out]
js = ('/* Marshalling panel -> FCS wiring of LMYP-1 #1 (document-references/dcs-hardware-wiring.zip, 12.Wiring/LMYP-1(#1) WIRING.xls),\n'
      '   made by tools/data/wiring.py. One row per signal; fields in WIRING_F. Read only. */\n'
      'window.WIRING_F = ' + json.dumps(F) + ';\nwindow.WIRING = ' + json.dumps(rows, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'src', 'ui', 'plant', 'wiring.js'), 'w').write(js)
print(len(rows), 'signals', len(js), 'bytes')
for r in out[:2] + [x for x in out if x['k'] == 'DO'][:1]:
    print({k: r[k] for k in F})
