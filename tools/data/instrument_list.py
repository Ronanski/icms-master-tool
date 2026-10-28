"""Over-all Instrument List (document-references/over-all-instrument-list.xlsx, sheet MASTER) -> JSON rows.

Usage: python3 tools/data/instrument_list.py <out.json>
Columns of MASTER (row 3 = header): ITEM, TAG NO. (full tag, type, loop no.), FUNCTION, P&ID DWG NO., DESIGN P / T, RANGE, SIGNAL,
CONNECTION FROM / TO, TYPE, SUPPLY SCOPE, REMARKS, REV, TYPE/PACKAGE. Used by tools/data/instrument_coverage.js.
"""
import json
import os
import sys

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'document-references', 'over-all-instrument-list.xlsx')


def s(x):
    return '' if x is None else ' '.join(str(x).split())


def main(out):
    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
    rows = []
    for i, r in enumerate(wb['MASTER'].iter_rows(values_only=True)):
        if i < 3 or not r[1]:
            continue
        r = list(r) + [None] * 20
        rows.append(dict(item=s(r[0]), tag=s(r[1]).replace(' ', ''), ty=s(r[2]), loop=s(r[3]).replace(' ', ''), desc=s(r[4]),
                         pd=s(r[5]), p=s(r[6]), t=s(r[7]), rng=s(r[8]), sig=s(r[9]), fr=s(r[10]), to=s(r[11]), vt=s(r[12]),
                         scope=s(r[13]), rem=s(r[14]), pkg=s(r[17])))
    with open(out, 'w') as f:
        json.dump(rows, f)
    print(len(rows), 'rows ->', out)


if __name__ == '__main__':
    main(sys.argv[1])
