#!/usr/bin/env python3
"""Plant tools design standard v1 (2026-11-16). Rewrites a tutor page to the shared look.
usage: std.py in.html out.html pagekey"""
import re,sys
HUB='https://claude.ai/artifact/CLWF6fLkvX8VNvtbjfYLwS'
BASE=''':root{--sans:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--mono:var(--sans);
--bg:#f6f7f9;--paper:#ffffff;--fg:#1b2129;--muted:#5b6673;--faint:#a3acb6;--edge:#d6dce3;--fill:#eef1f4;--accent:#1f5fae;--on-accent:#ffffff;--selbg:#e8f0fb;
--ok:#1e6b34;--okbg:#e6f4ea;--warnc:#8a5a00;--warnbg:#fdf3d8;--badc:#b3261e;--badbg:#fdecea;
--c-red:#c62828;--c-orange:#c8660a;--c-blue:#2474b5;--c-green:#1e8a3c;--c-yellow:#c99700;--c-purple:#7b4fd6;--c-teal:#0e8a8c;--c-steam:#8b98a5;--c-oil:#a67c00;
--eq:#e9edf1;--metal:#7b8794;--pipe:#c5cdd5;--panel:var(--paper);--line:var(--edge);--dim:var(--muted);color-scheme:light;
@@L@@}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){@@DARK@@}}
:root[data-theme="dark"]{@@DARK@@}
'''
DARK='''--bg:#16191d;--paper:#1e2227;--fg:#e6e9ed;--muted:#9aa5b1;--faint:#5f6872;--edge:#343b44;--fill:#262c33;--accent:#6aa5ee;--on-accent:#0e1620;--selbg:#1d2c40;
--ok:#7fd29a;--okbg:#17301f;--warnc:#e7bf5c;--warnbg:#33290f;--badc:#f2948c;--badbg:#3a1c1a;
--c-red:#ef5b5b;--c-orange:#f0954a;--c-blue:#5aa9e6;--c-green:#4cc27a;--c-yellow:#f2c94c;--c-purple:#a585f0;--c-teal:#3cc0c2;--c-steam:#c3ccd4;--c-oil:#d9b13a;
--eq:#2a3138;--metal:#7c8893;--pipe:#3f4852;color-scheme:dark;@@D@@'''
OVER='''
/* ---- plant tools standard v1: one font, sizes 12/13/14/16/20, weights 400/500/600, 4 px spacing grid, radius 6 and 10 ---- */
*{box-sizing:border-box}
html,body{background:var(--bg);color:var(--fg);margin:0}
body{font-family:var(--sans);font-size:14px;line-height:1.5;font-variant-numeric:tabular-nums;padding-block:16px 48px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1{font-size:20px;font-weight:600;line-height:1.3;margin:0}h2{font-size:16px;font-weight:600;line-height:1.35}h3{font-size:14px;font-weight:600}
b,strong{font-weight:600}
.sub{color:var(--muted);font-size:14px;margin:4px 0 0;max-width:76ch}
.box,.sheet,.rule,.tip,.step,figure{background:var(--paper);border:1px solid var(--edge);border-radius:10px}
.box{padding:16px}
.lab,.label,.gh{font-size:12px;font-weight:600;letter-spacing:0;text-transform:none;color:var(--muted);margin:0 0 8px}
.note,.src,.hint{font-size:13px;color:var(--muted)}
button,.b,.btn,.f,.st{font-family:var(--sans);min-height:36px;border-radius:6px}
.b,.st{font-size:14px;font-weight:600;border-width:1px;padding:8px 12px}
.b small{font-size:12px;font-weight:400}
.b.on,.f.on,.b.on.l{border-color:var(--accent);background:var(--selbg);box-shadow:inset 0 0 0 1px var(--accent)}
button:focus-visible,.b:focus-visible,.f:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible,a:focus-visible,.tap:focus-visible,.part:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
input[type=range]{accent-color:var(--accent);min-height:32px}
.say,.now,.info{font-size:16px;line-height:1.5}
.say b,.info b,.terms b,.now strong{color:var(--fg)}
a{color:var(--accent)}
.seg button[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
dl dt{color:var(--fg);font-weight:600}
.tag{color:var(--fg);font-weight:500}
.g .v,.ro b,.v b{font-size:16px;font-weight:600}
.st b{letter-spacing:0;font-weight:500}
.cw{color:var(--fg);text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:3px;text-decoration-color:var(--cw)}
.appbar{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);min-height:32px;margin:0}
.appbar a{color:var(--accent);text-decoration:none;font-weight:500;display:inline-flex;align-items:center;min-height:32px}
.appbar a:hover{text-decoration:underline}
.appbar i{font-style:normal;color:var(--muted)}
.seq i,.g .seq i{color:var(--muted)}
summary{padding-block:8px}
@media (max-width:640px){button,.b,.btn,.f,.st,.appbar a,summary{min-height:44px}input[type=range]{min-height:44px}.box{overflow-x:auto}.box>svg,.box>canvas{min-width:640px}}
'''
SIZE={11:12,12.5:12,13.5:13,15:14,17:16,18:16,19:16,22:20,24:20}
SPACE={3:4,5:4,6:8,7:8,9:8,10:12,14:16,18:16,20:24,22:24,26:24}
RAD={2:6,3:6,4:6,8:10,12:10}
STD_KEYS={'metal','eq','bg','panel','line','fg','dim','paper','muted','faint','edge','fill','sans','mono','accent','ok','okbg','color-scheme'}
SVGSEL=re.compile(r'(^|[\s,>])(#d|#map|svg)\b|\.lbl|\.small|\.t-s|\.t-m|\.brk text|\.at\b')
HEX={'#2f363b':'var(--eq)','#5b656b':'var(--metal)','#20262a':'var(--fill)','#3a3520':'var(--selbg)','#1f3140':'var(--selbg)','#1f2e25':'var(--okbg)',
 '#3a4146':'var(--pipe)','#9aa4aa':'var(--muted)','#8a949a':'var(--metal)','#aab3b8':'var(--metal)','#1d2124':'var(--paper)',
 '#3fb26b':'var(--c-green)','#5aa9e6':'var(--c-blue)','#c792ea':'var(--c-purple)','#f2c94c':'var(--c-yellow)','#8fc0ef':'var(--paper)'}
PAGE={ # legacy token -> standard, light (same expression works in dark: they point at palette vars)
 'plant-tools':{'done':'var(--c-green)','half':'var(--c-blue)','none':'var(--muted)','plan':'var(--c-purple)'},
 'ai-in-plant':{'new':'var(--c-green)','lan':'var(--c-blue)','mb':'var(--c-purple)','hw':'var(--metal)'},
 'breaker-lab':{'power':'var(--c-yellow)','run':'var(--c-red)','stop':'var(--c-green)','off':'var(--pipe)'},
 'cv-demand-lab':{'gov':'var(--c-yellow)','llm':'var(--c-blue)','unl':'var(--c-purple)','flow':'var(--c-green)','bad':'var(--c-red)'},
 'drum-swell-lab':{'water':'var(--c-blue)','steam':'var(--c-steam)','fire':'var(--c-orange)','warn':'var(--c-yellow)','bad':'var(--c-red)'},
 'sync-lab':{'grid':'var(--c-blue)','gen':'var(--c-yellow)','bad':'var(--c-red)'},
 'transfer-lab':{'ms':'var(--c-red)','rh':'var(--c-orange)','lp':'var(--c-blue)','warn':'var(--c-yellow)'},
 'turbine-valves-guide':{'ms':'var(--c-red)','rh':'var(--c-orange)','lp':'var(--c-blue)','oil':'var(--c-oil)','warn':'var(--c-yellow)'},
 'gen-voltage-bc-troubleshooter':{'acc':'var(--accent)','accbg':'var(--selbg)'},
 'turbine-page-v4':{'acc':'var(--accent)'},
}
def decls(block):
    return [(m.group(1),m.group(2).strip()) for m in re.finditer(r'--([\w-]+)\s*:\s*([^;}]+)',block)]
def fix_rule(sel,body):
    svg=bool(SVGSEL.search(sel))
    body=body.replace('var(--mono)','var(--sans)')
    body=re.sub(r'(font(?:-weight)?\s*:\s*)700',r'\g<1>600',body)
    if not svg:
        def fs(m):
            v=float(m.group(2));return m.group(1)+('%g'%SIZE.get(v,v))+'px'
        body=re.sub(r'(font-size\s*:\s*)([\d.]+)px',fs,body)
        body=re.sub(r'(font\s*:\s*(?:\d{3}\s+)?)([\d.]+)px',fs,body)
    def sp(m):
        return m.group(1)+re.sub(r'(?<![\d.])(\d+)px',lambda n:'%dpx'%SPACE.get(int(n.group(1)),int(n.group(1))),m.group(2))
    body=re.sub(r'((?:padding|margin|gap|row-gap|column-gap)(?:-(?:top|bottom|left|right|block|inline))?\s*:)([^;}]*)',sp,body)
    body=re.sub(r'(border-radius\s*:\s*)(\d+)px',lambda m:m.group(1)+'%dpx'%RAD.get(int(m.group(2)),int(m.group(2))),body)
    body=re.sub(r'(border(?:-width)?\s*:\s*)1\.5px',r'\g<1>1px',body)
    for h,v in HEX.items(): body=re.sub(re.escape(h)+r'\b',v,body,flags=re.I)
    return body
def run(src,key,title=None,extra=''):
    s=src
    m=re.search(r'<style>(.*?)</style>',s,re.S);css=m.group(1)
    light={};dark={}
    # collect and strip root blocks
    def grab(mm):
        blk=mm.group(0);isdark='dark' in blk.split('{')[0] or 'prefers-color-scheme:dark' in blk
        for k,v in decls(blk):
            if k in STD_KEYS: continue
            (dark if isdark else light)[k]=v
        return ''
    css=re.sub(r'@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root[^{]*\{[^}]*\}\s*\}',grab,css)
    css=re.sub(r':root[^{]*\{[^}]*\}',grab,css)
    pm=PAGE.get(key,{})
    for k,v in pm.items(): light[k]=v; dark.pop(k,None)
    for k in list(light):
        if k not in pm and k not in dark and re.match(r'#',light[k]) and key not in('gen-metering-hardware','gen-voltage-bc-flow','gen-voltage-bc-troubleshooter','turbine-page-v4'):
            print('  WARN unmapped legacy token --%s:%s'%(k,light[k]))
    # per rule fixes (handles one level of @media nesting)
    def rules(text):
        return re.sub(r'([^{}@]+)\{([^{}]*)\}',lambda mm:mm.group(1)+'{'+fix_rule(mm.group(1),mm.group(2))+'}',text)
    css=rules(css)
    L=''.join('--%s:%s;'%kv for kv in light.items());D=''.join('--%s:%s;'%kv for kv in dark.items())
    base=BASE.replace('@@DARK@@',DARK).replace('@@L@@',L).replace('@@D@@',D)
    css='\n'+base+css+OVER+extra
    s=s[:m.start(1)]+css+s[m.end(1):]
    head,body=s[:s.index('</style>')+8],s[s.index('</style>')+8:]
    for h,v in HEX.items(): body=re.sub(re.escape(h)+r'\b',v,body,flags=re.I)
    body=body.replace('IBM Plex Mono, monospace','IBM Plex Sans, sans-serif').replace('font-family="monospace"','font-family="IBM Plex Sans, sans-serif"').replace('font-family="sans-serif"','font-family="IBM Plex Sans, sans-serif"')
    body=re.sub(r'<(b|i) style="color:var\((--[\w-]+)\)">',r'<\1 class="cw" style="--cw:var(\2)">',body)
    body=body.replace('ang puti ay steam bubble','ang kulay-abo ay steam bubble')
    if 'class="appbar"' not in body:
        t=title or re.search(r'<title>(.*?)</title>',s).group(1)
        bar='<div class="appbar">'+('<a href="%s" target="_blank" rel="noopener">Plant Tools</a><i>/</i><span>%s</span>'%(HUB,t) if key!='plant-tools' else '<span>Plant Tools</span>')+'</div>'
        body=re.sub(r'(<div class="wrap"[^>]*>)',lambda mm:mm.group(1)+bar,body,count=1)
    if 'fonts.googleapis.com' not in head:
        head=head.replace('<style>','<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap">\n<style>',1)
    else:
        head=re.sub(r'<link[^>]*fonts.googleapis.com[^>]*>','<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap">',head)
    return head+body
LOVER='''
/* ---- plant tools standard v1 ---- */
b,strong{font-weight:600}
.appbar{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);min-height:32px;margin:0}
.appbar a{color:var(--accent);text-decoration:none;font-weight:500;display:inline-flex;align-items:center;min-height:32px;background:none;border:0;padding:0}
.appbar a:hover{text-decoration:underline}
.appbar i{font-style:normal;color:var(--muted)}
summary{padding-block:8px}
@media (max-width:640px){button,select,input:not([type=checkbox]):not([type=radio]),summary,nav a,.appbar a{min-height:44px}button.sm{min-height:44px}}
'''
def light(src,key,title=None):
    global RAD
    s=src;m=re.search(r'<style>(.*?)</style>',s,re.S);css=m.group(1)
    old=dict(RAD);RAD.update({8:6})
    css=re.sub(r'([^{}@]+)\{([^{}]*)\}',lambda mm:mm.group(1)+'{'+(mm.group(2) if ':root' in mm.group(1) else fix_rule(mm.group(1),mm.group(2)))+'}',css)
    RAD.clear();RAD.update(old)
    css=css.replace('wght@400;500;600;700','wght@400;500;600')
    s=s[:m.start(1)]+css+LOVER+s[m.end(1):]
    if 'class="appbar"' not in s:
        t=title or re.search(r'<title>(.*?)</title>',s).group(1)
        bar='<div class="appbar"><a href="%s" target="_blank" rel="noopener">Plant Tools</a><i>/</i><span>%s</span></div>'%(HUB,t)
        s=re.sub(r'(<div class="wrap"[^>]*>)',lambda mm:mm.group(1)+bar,s,count=1)
    return s
if __name__=='__main__':
    import importlib.util,os
    key=sys.argv[3];extra=''
    if len(sys.argv)>4 and sys.argv[4]=='light':
        open(sys.argv[2],'w').write(light(open(sys.argv[1]).read(),key));sys.exit()
    xp=os.path.join(os.path.dirname(os.path.abspath(__file__)),'extra',key+'.css')
    if os.path.exists(xp): extra=open(xp).read()
    open(sys.argv[2],'w').write(run(open(sys.argv[1]).read(),key,extra=extra))
