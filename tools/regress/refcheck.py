# Compares the simulator data (dump.js) with the reference workbooks: F(X) curves and PID / MAN / SUMA parameters.
# Usage: python3 tools/regress/refcheck.py [html]
import re,json,subprocess,sys,os,xlrd,openpyxl
root=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
html=sys.argv[1] if len(sys.argv)>1 else os.path.join(root,'logic-sim-v1.20.22.html')
out='/tmp/refcheck-dump.json'
subprocess.run(['node',os.path.join(root,'tools/regress/dump.js'),html,out],check=True)
D=json.load(open(out))
# ---- F(X)
wb=xlrd.open_workbook(os.path.join(root,'document-references/linear-curves-fx.xls'))
bad=[];n=0
for t in D['fx']:
    nm=t['key']
    if nm not in wb.sheet_names(): bad.append(nm+' sheet missing');continue
    s=wb.sheet_by_name(nm);n+=1
    rows=[(s.cell_value(r,1),s.cell_value(r,4)) for r in range(32,48)]
    pts=[tuple(p) for p in t['pts']]
    if len(rows)!=len(pts) or any(abs(a[0]-b[0])>1e-6 or abs(a[1]-b[1])>1e-6 for a,b in zip(rows,pts)):
        bad.append(nm+' ('+t['sheet']+')')
print('F(X): %d tables compared, %d differ%s'%(n,len(bad),(': '+', '.join(bad)) if bad else ''))
# ---- PID / MAN / SUMA parameters
wx=openpyxl.load_workbook(os.path.join(root,'document-references/summary-of-pid-pidv-suma-man-parameters.xlsx'),data_only=True)
def rows(ws):
    hdr=[c for c in next(ws.iter_rows(min_row=2,max_row=2,values_only=True))]
    for r in ws.iter_rows(min_row=4,values_only=True):
        if r[0] in (None,''): continue
        yield dict(zip(hdr,r))
def key(sheet,tag,mno): return (sheet,tag.strip())
sim={}
for b in D['blocks']:
    for t in ([b['tag']]+(b.get('all') or [])): sim.setdefault((b['sheet'],t.strip()),[]).append(b)
cmp={'PID':[('PH','ph'),('PL','pl'),('MH','hi'),('ML','lo'),('dMVH','dmvh'),('I','ti'),('D','td'),('DTI','dti'),('TF','tf'),('GAP','gap'),('CUT','cut'),('DH','dh')],
     'MAN':[('PH','ph'),('PL','pl'),('MH','hi'),('ML','lo'),('DH','dh'),('DT','dt'),('TF','tf'),('CUT','cut')],
     'SUMA':[('PH','ph'),('PL','pl'),('RSTS','rsts'),('K','kk'),('DT','dt'),('TF','tf'),('CUT','cut')]}
tot=0;diffs=[];missing=[];swap=[]
for sh in ('PID','MAN','SUMA'):
    for r in rows(wx[sh]):
        k=(r['Sheet'],str(r['Tag']).strip());tot+=1
        cand=sim.get(k)
        if not cand: missing.append('%s %s %s'%(sh,k[0],k[1]));continue
        b=cand[0]['p'];d=[]
        for wcol,pk in cmp[sh]:
            w=r.get(wcol)
            if w in (None,'','='): continue
            try:w=float(w)
            except: continue
            v=b.get(pk)
            if v is None: continue
            if sh=='MAN' and pk in ('hi','lo') and b.get('rhi') is not None and b.get('rlo') is not None:
                w=b['rlo']+w/100.0*(b['rhi']-b['rlo'])
            if abs(float(v)-w)>1e-6*max(1,abs(w)): d.append('%s wb %s sim %s'%(wcol,w,v))
        if sh=='PID' and r.get('P') not in (None,'','='):
            kp=b.get('kp')
            if kp and abs(100/kp-float(r['P']))>.01*max(1,float(r['P'])): d.append('P wb %s sim %.3f'%(r['P'],100/kp))
        sw=[x for x in d if x.startswith('CUT') or x.startswith('DH')]
        if sh=='PID' and len(sw)==2 and len(d)==2: swap.append('%s %s'%k);continue
        if d: diffs.append('%s %s %s: %s'%(sh,k[0],k[1],'; '.join(d)))
KNOWN={'S1-LN15':'ratio curve stored as factor (FINDINGS batch 3)','S1-LN21':'ratio curve stored as factor (FINDINGS batch 3)'}
print('  known F(X) exceptions in the list above: LN15, LN21 (ratio curves stored as a factor), LN38 / LN39 (compared with drum-level-calculation.xls, not this workbook)')
print('Parameters: %d workbook rows (PID / MAN / SUMA), %d not found in the simulator, %d with differences'%(tot,len(missing),len(diffs)))
print('  CUT / DH swapped between simulator data and workbook (F-2 / R-1): %d PID%s'%(len(swap),' (v1.20.21: CUT of F-31 reads 0)' if swap else ''))
for m in missing: print('  not found:',m)
for d in diffs: print('  diff:',d)

# ---- AI ranges against the I/O list (all stations)
io=xlrd.open_workbook(os.path.join(root,'document-references/dcs-io-list.xls'))
T={}
for sn in io.sheet_names():
    if not sn.startswith('Station'): continue
    sh=io.sheet_by_name(sn)
    for r in range(3,sh.nrows):
        v=sh.row_values(r)
        if len(v)>10 and str(v[5]).strip() and str(v[10]).startswith('AI'): T.setdefault(str(v[5]).strip(),[]).append(v)
n=0;nf=[];df=[]
seen=set()
for a in D['ai']:
    if re.match(r'^AI\d',a['tag']): continue
    k=(a['sheet'],a['tag'])
    if k in seen: continue
    seen.add(k)
    rows=T.get(a['tag'].strip())
    if not rows: nf.append(a['sheet']+' '+a['tag']);continue
    n+=1;r=rows[0]
    try:lo,hi=float(r[7]),float(r[8])
    except: continue
    if abs(lo-a['rng']['lo'])>1e-6 or abs(hi-a['rng']['hi'])>1e-6*max(1,abs(hi)): df.append('%s %s: I/O list %s ~ %s, sim %s ~ %s'%(a['sheet'],a['tag'],lo,hi,a['rng']['lo'],a['rng']['hi']))
print('AI ranges: %d AI tags compared with the I/O list, %d not found by tag, %d differ'%(n,len(nf),len(df)))
for x in df: print('  diff:',x)
for x in nf[:20]: print('  not found:',x)
