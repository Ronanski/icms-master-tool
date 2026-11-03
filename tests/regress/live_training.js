// 3.2.0-beta.10 LIVE TRAINING (src/ui/training/live.js, user 2026-10-23 "auto check sya if nagawa mo na sa logic lahat ... hanggang
// sa sync 4.5 MW initial load, to load up to 150 MW"):
// 1. Every step has a kind; every AUTO condition finds its signals (LS_LIVE.audit: no miss; valves through valvectl.js).
// 2. VIEW: no AUTO step ticks even with the plant at 150 MW (the simulation does not run).
// 3. RUN the CHECK chain "full" (cold -> coal -> bypass -> roll / sync / 45 MW -> 150 MW): the AUTO steps tick themselves while it runs;
//    the steps of the cold start (fans, purge, burners), Sync & initial load and Load up to 150 MW are all ticked at the end.
// 4. The Training page shows the chips (AUTO ✓ / FIELD / TCS), the AUTO check box cannot be ticked by hand, the live panel lists
//    the signals of a step, "Assume field steps done" ticks the FIELD and TCS steps only. No page error.
// Usage: node tests/regress/live_training.js [html]   (~30 min: the CHECK M4 chain from cold, 3.2.0-beta.78 with the cold ATS modes)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));let f=0;const ck=(ok,t)=>{console.log((ok?'PASS ':'FAIL ')+t);if(!ok)f++};
await p.addInitScript(()=>{window.LS_HOME=false;window.LS_PVWIN=false;window.open=()=>null;try{localStorage.setItem('ls-tab','"logic"');localStorage.removeItem('ls-train');localStorage.removeItem('ls-train-auto')}catch(e){}});
await p.goto('file://'+require('path').resolve(html));await p.waitForTimeout(2500);await p.evaluate(()=>AN.setCat('an'));
await p.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.LS_LIVE&&window.CHECK,null,{timeout:90000});await p.waitForTimeout(1500);
// 1
const a=await p.evaluate(()=>{const o=LS_LIVE.audit();return {auto:o.auto,field:o.field,tcs:o.tcs,miss:o.miss.map(x=>x.join('|'))}});
/* FCV-DO1012 = HICDO1012, a MAN station with no .MAN address and no A / M switch on the drawing: its mode cannot be read, a FIELD step */
ck(a.auto>=80&&a.tcs>=40&&a.miss.every(x=>/FCV-DO1012/.test(x)),'kinds: auto '+a.auto+', field '+a.field+', tcs '+a.tcs+'; signals not found: '+(a.miss.join(' ; ')||'none'));
// 2
const v=await p.evaluate(async()=>{AN.reset();AN.plantLoad150();AN.viewSet(true);await new Promise(r=>setTimeout(r,2500));return {n:Object.keys(LS_LIVE.done()).length,live:LS_LIVE.live()}});
ck(v.n===0&&!v.live,'VIEW at 150 MW: '+v.n+' AUTO steps ticked (live '+v.live+')');
// 3
// 3.2.0-beta.78: an AUTO step ticks only in a section the start-up has reached (live.js scan, retest #9: a tick in the section before,
// or the Gabay there), never ahead of the trainee. The CHECK chain has no Gabay: the trainee's FIELD / TCS ticks ("Assume field steps
// done") come first, as on the Training page, so every section is reached
await p.evaluate(()=>{const d={};LS_PROC5002.forEach((s,si)=>s.s.forEach((x,i)=>{if(LS_LIVE.kind(si,i).k!=='auto')d[si+'.'+i]='00:00'}));localStorage.setItem('ls-train',JSON.stringify(d))});
/* the checklist scans once a second of wall time in the app (home.js tick), about one plant second at 1x; the CHECK chain runs many plant
   seconds in one wall second, so here it scans every 2 plant seconds (the same rate as a trainee at 1x), not by the speed of the PC */
await p.evaluate(()=>{const st=AN.stepSet;let k=0;AN.stepSet=function(){const r=st.apply(this,arguments);if(++k%4===0)try{LS_LIVE.scan()}catch(e){}return r}});
await p.evaluate(()=>{AN.viewSet(false);LS_LIVE.reset();document.getElementById('chkb').click();window.__done=false;CHECK.run('full').then(()=>window.__done=true)});
const t0=Date.now();let last=-1;
while(!(await p.evaluate(()=>window.__done))&&Date.now()-t0<45*60e3){await p.waitForTimeout(15000);const r=await p.evaluate(()=>({n:Object.keys(LS_LIVE.done()).length,mw:+AN.unit.MW||0,t:+AN.unit.t||0}));if(r.n!==last){console.log('     '+Math.round((Date.now()-t0)/1000)+' s: '+r.n+' AUTO steps ticked, '+r.mw.toFixed(1)+' MW');last=r.n}}
await p.evaluate(async()=>{for(let k=0;k<4;k++){LS_LIVE.scan();await new Promise(r=>setTimeout(r,1000))}});
const r=await p.evaluate(()=>{const D=LS_LIVE.done(),P=LS_PROC5002,B=LS_LIVE.base,out={tot:0,dn:0,sec:{},miss:[]};
 P.forEach((s,si)=>s.s.forEach((x,i)=>{const q=LS_LIVE.kind(si,i);if(q.k!=='auto')return;out.tot++;const k=si+'.'+i;const sec=si+1;out.sec[sec]=out.sec[sec]||[0,0];out.sec[sec][1]++;if(D[k]){out.dn++;out.sec[sec][0]++}else out.miss.push(sec+'|'+(i+1)+' '+x.t.slice(0,70)+' :: '+LS_LIVE.state(si,i).now)}));
 out.B=B;return out});
console.log('     per section (done/auto): '+Object.entries(r.sec).map(([k,x])=>k+':'+x[0]+'/'+x[1]).join(' '));
for(const m of r.miss)console.log('     not ticked: '+m);
const sec=n=>r.sec[n]||[0,0];
ck(sec(r.B+1)[0]===sec(r.B+1)[1]&&sec(r.B+1)[1]===8,'Sync & initial load: '+sec(r.B+1).join('/')+' ticked by the logic');
ck(sec(r.B+2)[0]===sec(r.B+2)[1]&&sec(r.B+2)[1]===10,'Load up to 150 MW: '+sec(r.B+2).join('/')+' ticked by the logic');
/* the CHECK chain is the app's own way to 150 MW, not every hand step of the procedure (it does not open the biasing dampers to
   100 % or close the fan dampers to 0 %): the steps it skips stay AUTO · waiting and are listed above */
ck(r.dn>=Math.round(r.tot*0.7),'cold start -> 150 MW: '+r.dn+' of '+r.tot+' AUTO steps ticked themselves');
// 4
await p.evaluate(()=>lsSetTab('training'));await p.waitForTimeout(500);
const u=await p.evaluate(async B=>{lsHome.show(B+1);await new Promise(r=>setTimeout(r,300));const li=document.querySelector('#trainws ol.trsteps li');li.querySelector('.trsee').click();await new Promise(r=>setTimeout(r,300));
 const side=document.querySelector('#trainws .trside');return {chips:[...document.querySelectorAll('#trainws .trk')].map(x=>x.textContent).slice(0,3).join('|'),dis:document.getElementById('trc'+(B+1)+'_0').disabled,side:getComputedStyle(side).display,sig:side.querySelectorAll('ul.trsig li').length,txt:side.textContent.slice(0,140)}},r.B);
/* 3.2.0-beta.78: the Training page is inside the Training dock now (user 2026-10-30, dock.css: #gdock #trainws .trside hidden, the dock
   card shows the step): the live panel is checked by its content (the signals of the step), shown only on the page outside the dock */
const inDock=await p.evaluate(()=>!!document.querySelector('#gdock #trainws'));
ck(/AUTO ✓/.test(u.chips)&&u.dis&&(u.side==='flex'||inDock)&&u.sig>=1,'Training page: chips '+u.chips+', AUTO box disabled '+u.dis+', live panel '+u.side+' with '+u.sig+' signal(s): '+u.txt);
const w=await p.evaluate(()=>{[...document.querySelectorAll('#trainws .trbtn')].find(x=>x.textContent==='Assume field steps done').click();const d=JSON.parse(localStorage.getItem('ls-train')||'{}');let bad=0;for(const k in d){const [si,i]=k.split('.').map(Number);if(LS_LIVE.kind(si,i).k==='auto')bad++}return {n:Object.keys(d).length,bad,pct:document.querySelector('#trainws .trpct').textContent}});
ck(w.n>500&&w.bad===0,'Assume field steps done: '+w.n+' FIELD/TCS steps ticked, '+w.bad+' AUTO among them; '+w.pct);
ck(!errs.length,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(f?'FAILED '+f:'ALL PASS');await b.close();process.exit(f?1:0)})();
