// 3.2.0-beta.1: LOGIC page layout after the merge of the 2.5.0 line into the 3.1 shell (replaces the 2.4.1-beta.7 layout test).
// ABC and DITL: [VIEW | RUN] in the top bar; ABC ribbon (Layers: Values / Wire values / Inputs / Panel / Legend; SIM group in RUN with
// Reset, step and speed); Panel hides and shows the right panel; VIEW keeps the panel readable (no fading) with the locked note;
// right panel tabs Inspector / Faceplate on ABC, Selected / Inputs / Timers / Valves / Outputs on DITL (2.5.0-beta.13).
// The same buttons as before (moved, same handlers). Usage: node tests/regress/layout.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=require('path').resolve(process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x)));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let f=0;const ck=(c,t)=>{console.log((c?'PASS ':'FAIL ')+t);if(!c)f++};
for(const [n,w,h] of [['desktop',1440,900],['phone',390,844]]){
const p=await b.newPage({viewport:{width:w,height:h},isMobile:w<500,hasTouch:w<500});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+html);await p.waitForTimeout(1500);await p.evaluate(()=>AN.setCat('an'));await p.waitForFunction(()=>window.AN&&AN.sheets&&AN.sheets.length>=54&&window.lsSetTab&&window.LO,null,{timeout:90000});
await p.evaluate(()=>{AN.setCat('an');lsSetTab('logic');AN.go(AN.sheets.findIndex(s=>/ABC-010/.test(s.name)))});await p.waitForTimeout(1500);
const vis=s=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.offsetHeight>0&&getComputedStyle(e).visibility!=='hidden'},s);
const seg=k=>p.evaluate(k=>document.querySelector('#gsbar .seg button:'+(k?'last':'first')+'-child').click(),k);
const segT=await p.evaluate(()=>[...document.querySelectorAll('#gsbar .seg button')].filter(x=>x.offsetHeight).map(x=>x.textContent.trim()));
ck(segT.join()==='VIEW,RUN',n+': ABC top bar switch = [VIEW | RUN] ('+segT.join(' | ')+')');
// RUN: the SIM group (Run / Pause, Reset, speed, step) is in the ribbon
await seg(1);await p.waitForTimeout(800);
const sim=await p.evaluate(()=>[...document.querySelectorAll('#gsbar .g-run button,#gsbar .g-run select')].filter(x=>x.offsetHeight).map(x=>x.textContent.trim().slice(0,12)));
ck(await p.evaluate(()=>!AN.view&&AN.run)&&sim.some(t=>/^Reset$/.test(t))&&sim.length>=3,n+': RUN starts the simulation and shows the SIM group ('+sim.join(' | ')+')');
// Panel in the ribbon hides and shows the ABC panel
const anOpen=()=>p.evaluate(()=>{const a=document.getElementById('anp'),o=document.getElementById('opp');return (!!a&&!a.classList.contains('min')&&a.offsetWidth>0)||(!!o&&o.offsetWidth>0)});
const pnl=()=>p.evaluate(()=>[...document.querySelectorAll('#gsbar .tbar button')].find(x=>/^Panel$/.test(x.textContent.trim())).click());
if(!(await anOpen())){await pnl();await p.waitForTimeout(400)}
const o0=await anOpen();await pnl();await p.waitForTimeout(400);const o1=await anOpen();await pnl();await p.waitForTimeout(400);const o2=await anOpen();
ck(o0&&!o1&&o2,n+': Panel hides and shows the ABC panel');
// right panel tabs Inspector / Faceplate
const tabs=await p.evaluate(()=>[...document.querySelectorAll('.hmitabs button')].filter(x=>x.offsetHeight).map(x=>x.textContent.trim()));
ck(tabs.join()==='Inspector,Faceplate',n+': ABC panel tabs '+tabs.join(' / '));
// VIEW: no fading, the locked note
await seg(0);await p.waitForTimeout(500);
await p.evaluate(()=>{const b=[...document.querySelectorAll('.hmitabs button')].find(x=>x.textContent.trim()==='Inspector');b&&b.click()});await p.waitForTimeout(300);
const vw=await p.evaluate(()=>{const a=document.getElementById('anp');const i=a&&[...a.querySelectorAll('input,select')].find(x=>x.offsetHeight);return {view:!!AN.view,op:i?getComputedStyle(i).opacity:'none',locked:!!a&&/locked/i.test(getComputedStyle(a,'::before').content),shown:!!a&&a.offsetWidth>0}});
ck(vw.view&&(vw.op==='1'||(vw.op==='none'&&!vw.shown))&&(vw.locked||!vw.shown),n+': VIEW keeps the panel readable (opacity '+vw.op+') and says the inputs are locked');
// DITL
await p.evaluate(()=>{try{localStorage.setItem('ditl.dp','1')}catch(e){}[...document.querySelectorAll('#gsbar .sub button')].find(x=>x.textContent.trim()==='DITL').click()});
await p.waitForFunction(()=>!document.body.classList.contains('an'),null,{timeout:20000});await p.waitForTimeout(1200);
const dseg=await p.evaluate(()=>[...document.querySelectorAll('#gsbar .seg button')].filter(x=>x.offsetHeight).map(x=>x.textContent.trim()));
ck(dseg.join()==='VIEW,RUN',n+': DITL top bar switch = [VIEW | RUN]');
ck(await vis('#bfit'),n+': DITL Fit on the drawing');
const dOpen=()=>p.evaluate(()=>{const d=document.getElementById('dp');return !!d&&d.offsetWidth>0});
const dp=()=>p.evaluate(()=>[...document.querySelectorAll('#gsbar .g-ditl button')].find(x=>/^Panel$/.test(x.textContent.trim())).click());
if(!(await dOpen())){await dp();await p.waitForTimeout(400)}
const d0=await dOpen();await dp();await p.waitForTimeout(400);const d1=await dOpen();await dp();await p.waitForTimeout(400);const d2=await dOpen();
ck(d0&&!d1&&d2,n+': Panel hides and shows the DITL panel');
const dt=await p.evaluate(()=>[...document.querySelectorAll('#dp .lo-tabs button')].filter(x=>x.offsetHeight>0).map(x=>x.textContent));
ck(dt.join()==='Selected,Inputs,Timers,Valves,Outputs',n+': DITL panel tabs on screen '+dt.join(' / '));
const drows=async k=>{await p.evaluate(k=>LO.setDi(k),k);await p.waitForTimeout(250);return p.evaluate(()=>[...document.querySelectorAll('#dp .dp-r')].filter(d=>d.offsetHeight).map(d=>d.dataset.k))};
const di=await drows('in');ck(di.length>0&&di.every(k=>k==='in'),n+': DITL Inputs tab shows only inputs ('+di.length+' rows)');
const dto=await drows('out');ck(dto.length>0&&dto.every(k=>k==='out'),n+': DITL Outputs tab shows only outputs ('+dto.length+' rows)');
ck(await p.evaluate(()=>{const o=document.getElementById('opp');return !o||o.offsetWidth===0}),n+': operator faceplate panel not shown on DITL');
ck(errs.length===0,n+': no page error'+(errs.length?' ('+errs[0]+')':''));await p.close()}
await b.close();console.log(f?f+' FAIL':'ALL PASS');process.exit(f?1:0)})();
