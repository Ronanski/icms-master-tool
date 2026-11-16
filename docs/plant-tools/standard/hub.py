#!/usr/bin/env python3
"""Builds the Plant Tools home page (hub) with the shared standard."""
import re,json,std
ex=open('hub-explainer.html').read()
ex=std.fix_rule('x',ex) if False else ex
ex=ex.replace('<p style="margin:0">','<p>').replace('class="card"','class="idcard"')
WB='https://claude.ai/artifact/4fXaZ2RGqamjnCRb9pYXhJ'
A=lambda i:'https://claude.ai/artifact/'+i
T=[
 # group, title, description, status, url
 ['Find a signal','Tag Lookup','One card per hardwired signal: range, cabinet, terminals, main test point, logic sheets. Has an assistant that answers from the card.','ready',A('DxJaK1sZU45T1VNfuJbQTW')],
 ['Find a signal','Signal Path Finder','The full path of a signal as a drawing, from the field device to the operator screen, with a fault finder.','ready',A('2A5FFvEhkDPnggoM4i95wk')],
 ['Find a signal','Connection Lessons','Twelve lessons on what happens when one logic connection is lost, each with a reverse quiz.','ready',A('NrXakPC4qHBDZagBt3Ztt1')],
 ['Run the shift','Shift log','What happened in the shift, open follow-ups, and what to pass on.','ready',WB+'#shift-log'],
 ['Run the shift','Work orders','Corrective and preventive jobs. A repeating job creates its next one when marked done.','ready',WB+'#work-orders'],
 ['Run the shift','Calibration record','As-found and as-left at five points, error and pass or fail against your tolerance.','ready',WB+'#calibration'],
 ['Run the shift','Spare parts','Stock, minimum level and a reorder flag.','ready',WB+'#spare-parts'],
 ['Run the shift','Trip analyzer','Paste an event list: sorted by time, first event marked, gap between events. It does not guess the cause.','ready',WB+'#trip-analyzer'],
 ['Run the shift','Reports','Daily report, shift handover, maintenance backlog and trip records built from your entries.','ready',WB+'#reports'],
 ['Run the shift','Performance','Daily energy, coal and trips, entered by hand. Works out load factor and heat rate.','part',WB+'#performance'],
 ['Learn the plant','Drum Swell Lab','Watch water and steam in the drum and see why the level swells and shrinks.','ready',A('DGPMzcCw3VC6dhpyyTrXdx')],
 ['Learn the plant','52G and 52L Lab','Generator and line breakers: where power flows when each one opens.','ready',A('9sa5hstmeApg1YSkArA1sM')],
 ['Learn the plant','Sync Lab','Match speed, voltage and phase, then close the generator breaker.','ready',A('JYehhTtobFpiBNDmJxMRri')],
 ['Learn the plant','CV Demand Lab','Governor, load limiter and unloading: the lowest signal drives the control valves.','ready',A('FUxNzDMV4Ms5HwLyCZL96w')],
 ['Learn the plant','Transfer Lab','Steam path through the bypasses, the intercept valves and the control valves during start-up.','ready',A('Wiy6NDxu7oSUiFDzc4jahC')],
 ['Learn the plant','Turbine Valves Guide','The high and intermediate pressure turbine valves, and the inside of one control valve.','ready',A('KuTyWZpGoB1RsLZGEMGU3A')],
 ['Learn the plant','Generator Voltage Path','Generator voltage B-C from the voltage transformer to every screen that shows it.','ready',A('KVddKmqbHmxh7fj9e5Fekz')],
 ['Learn the plant','Generator Voltage Troubleshooter','Pick the symptom and see which stop to check first.','ready',A('RUet573mt7QS675aqFfjqK')],
 ['Learn the plant','Generator Metering Hardware','What the voltage transformer cubicle and the generator control panel look like.','ready','@@GMH@@'],
 ['Learn the plant','Artificial Intelligence in the Plant','Where an assistant could connect to the control network, and what it needs first.','ready',A('RrhP6eonrHX7njzh6uStbT')],
 ['Other tools in this project','Three-Dimensional Plant','Where equipment and instruments are, and what is inside them.','part',A('5ZnVRLm3WPBXd6LAKMucri')],
 ['Other tools in this project','Plant Simulator','Cold start to 150 MW on the simulated control system. It is a separate application.','part',''],
 ['Other tools in this project','Logic Viewer','Why a loop will not go to automatic and which permissive blocks it. Inside the simulator.','ready',''],
 ['Other tools in this project','Loop Check Helper','Checklist and expected value for each loop. Inside the simulator.','part',''],
 ['Not built yet','Drawings and memory tags in Tag Lookup','Tag Lookup holds the hardwired signals only. Drawings and tags without a wire are not in it.','none',''],
 ['Not built yet','Assistant with live plant data','Read-only data from the plant server needs approval from the plant and from information technology.','none',''],
]
CSS=std.BASE.replace('@@DARK@@',std.DARK).replace('@@L@@','').replace('@@D@@','')+std.OVER+'''
/* layout: search and filter on top, tools as cards grouped by job, notes collapsed at the end */
.wrap{max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
input[type=search]{flex:1 1 240px;min-width:0;font:inherit;color:var(--fg);background:var(--paper);border:1px solid var(--edge);border-radius:6px;padding:8px 12px;min-height:40px}
.f{font-size:13px;font-weight:500;color:var(--fg);background:var(--paper);border:1px solid var(--edge);padding:4px 12px;cursor:pointer}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.tool{display:flex;flex-direction:column;gap:8px;background:var(--paper);border:1px solid var(--edge);border-radius:10px;padding:16px;color:var(--fg);text-decoration:none;min-width:0}
a.tool:hover{border-color:var(--accent)}
.tool h3{margin:0;display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
.tool p{margin:0;font-size:13px;color:var(--muted);flex:1}
.tool .go{font-size:13px;font-weight:500;color:var(--accent)}
.tool .go.no{color:var(--muted);font-weight:400}
.pill{flex:none;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:600;white-space:nowrap}
.pill.ready{background:var(--okbg);color:var(--ok)}.pill.part{background:var(--warnbg);color:var(--warnc)}.pill.none{background:var(--fill);color:var(--muted)}
.empty{border:1px dashed var(--edge);border-radius:10px;padding:24px;text-align:center;color:var(--muted)}
details.box summary{font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center}
details.box[open] summary{margin-bottom:8px}
details.box p,details.box ol{margin:0 0 8px}details.box ol{padding-left:24px}details.box li{margin:4px 0}
.idcard{font-size:13px;background:var(--fill);border-radius:6px;padding:12px;overflow-x:auto;white-space:pre;line-height:1.6;margin:0 0 8px}
@media (max-width:640px){.grid{grid-template-columns:minmax(0,1fr)}#fl{flex-wrap:nowrap;overflow-x:auto;width:100%;padding-bottom:4px}#fl .f{flex:none}.f{min-height:44px}input[type=search]{min-height:44px}}
'''
HTML='''<title>Plant Tools</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>'''+CSS+'''</style>
<div class="wrap">
<div><h1>Plant Tools</h1>
<p class="sub">Every tool for LMYP Unit 1 in one place. Pick a card to open the tool in a new tab.</p></div>
<div class="bar"><input id="q" type="search" placeholder="Search tools, like trip or calibration" aria-label="Search tools"><div class="bar" id="fl"></div></div>
<div id="list" style="display:flex;flex-direction:column;gap:16px"></div>
<details class="box"><summary>Plant data core: notes and document sources</summary>'''+ex+'''</details>
<p class="note">Updated 2026-11-16. Status: Ready = works now, Partly built = works with limits, Not built = needs data or approval first.</p>
</div>
<script>
const T='''+json.dumps(T,ensure_ascii=False)+''';
const SL={ready:'Ready',part:'Partly built',none:'Not built'};
const G=[...new Set(T.map(x=>x[0]))];let grp='All';
const fl=document.getElementById('fl'),esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
['All',...G].forEach(g=>{const b=document.createElement('button');b.type='button';b.className='f'+(g===grp?' on':'');b.textContent=g;b.setAttribute('aria-pressed',g===grp);b.onclick=()=>{grp=g;[...fl.children].forEach(c=>{c.classList.toggle('on',c===b);c.setAttribute('aria-pressed',c===b)});draw()};fl.appendChild(b)});
function draw(){const q=document.getElementById('q').value.trim().toLowerCase();
 const rows=T.filter(x=>(grp==='All'||x[0]===grp)&&(!q||(x[1]+' '+x[2]+' '+x[0]).toLowerCase().includes(q)));
 let h='';G.forEach(g=>{const r=rows.filter(x=>x[0]===g);if(!r.length)return;
  h+='<section><p class="lab">'+esc(g)+'</p><div class="grid">'+r.map(x=>{const inner='<h3><span>'+esc(x[1])+'</span><span class="pill '+x[3]+'">'+SL[x[3]]+'</span></h3><p>'+esc(x[2])+'</p>'+(x[4]?'<span class="go">Open</span>':'<span class="go no">No page here</span>');
   return x[4]?'<a class="tool" href="'+x[4]+'" target="_blank" rel="noopener">'+inner+'</a>':'<div class="tool">'+inner+'</div>'}).join('')+'</div></section>'});
 document.getElementById('list').innerHTML=h||'<div class="empty">No tool matches. Try another word.</div>'}
document.getElementById('q').oninput=draw;draw();
</script>
'''
import sys
gmh=sys.argv[1] if len(sys.argv)>1 else ''
if not gmh:
    HTML=HTML.replace('"@@GMH@@"','""')
else: HTML=HTML.replace('@@GMH@@',gmh)
open('out/plant-tools.html','w').write(HTML)
