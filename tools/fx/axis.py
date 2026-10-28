# 3.2.0-beta.7: axis names of each F(X) chart of document-references/linear-curves-fx.xls (text boxes of the chart drawings).
# The xls is converted first:  soffice --headless --convert-to xlsx linear-curves-fx.xls ; unzip it into DIR.
# Usage: python3 tools/fx/axis.py DIR > tools/fx/axis.json
import re, os, sys, json
d = sys.argv[1]
wb = open(d + '/xl/workbook.xml').read()
rels = open(d + '/xl/_rels/workbook.xml.rels').read()
rid = {}
for m in re.findall(r'<Relationship [^>]*>', rels):
    i = re.search(r'Id="([^"]+)"', m); t = re.search(r'Target="([^"]+)"', m)
    if i and t: rid[i.group(1)] = t.group(1)
out = {}
for name, r in re.findall(r'<sheet name="([^"]+)"[^>]*r:id="([^"]+)"', wb):
    sr = d + '/xl/worksheets/_rels/' + os.path.basename(rid.get(r, '')) + '.rels'
    if not os.path.exists(sr): continue
    dr = re.findall(r'Target="\.\./drawings/([^"]+)"', open(sr).read())
    if not dr: continue
    x = open(d + '/xl/drawings/' + dr[0]).read()
    L = []
    for s in re.findall(r'<xdr:sp>.*?</xdr:sp>', x, flags=re.S):
        t = ''.join(re.findall(r'<a:t>([^<]*)</a:t>', s)).strip()
        if t: L.append([t.replace('&amp;', '&'), 'eaVert' in s])
    out[name] = L
json.dump(out, sys.stdout, indent=0)
