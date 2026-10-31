/* HUMAN-LIKE RUN of the Training (3.2.0-beta.27 ~ 32, user 2026-10-25: "dapat actual na gamit ang test, hindi via code lang"):
 Training > Gabay: Cold > 150 MW, then only what a person does: read the step card on the screen, click its buttons with the mouse
 (Field operator, Tapos na ito sa field, START of the next motor, the action buttons; never a call into the guide code), x300.
 A step that does not move for 6 minutes is written STUCK with the card text and a screenshot. Records a video.
 Usage: npm run build; node tools/training/human_run.js <outdir> <absolute path of the html>   (about 20 ~ 25 min) */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const OUT=process.argv[2],HTML=process.argv[3];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:1440,height:860},recordVideo:{dir:OUT+'/vid',size:{width:1280,height:764}}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.LS_PVWIN=false;window.open=()=>null;window.LS_HOME=true;try{localStorage.clear()}catch(e){}});
await p.goto('file://'+HTML);await p.waitForTimeout(4000);
const log=[];const L=(...a)=>{const t=new Date().toISOString().slice(11,19)+' '+a.join(' ');log.push(t);console.log(t)};
// what the eye sees: the visible buttons of the step card (text, disabled look, where)
const see=()=>p.evaluate(()=>[...document.querySelectorAll('#gdock .gd-card button')].filter(e=>e.getClientRects().length).map((e,i)=>{const r=e.getBoundingClientRect();return {i,t:e.textContent.trim(),dis:e.classList.contains('dis'),did:e.classList.contains('did'),fld:e.classList.contains('gd-fld'),ov:e.classList.contains('gd-ov'),lk:e.classList.contains('gd-lk')||e.classList.contains('gd-rowl'),pre:/^Simulan ang .* h purge/.test(e.textContent),y:r.y,h:r.height}}));
// scroll it into view like a hand on the wheel, read its place and click there at once
const press=async (txt)=>{const pt=await p.evaluate(t=>{const e=[...document.querySelectorAll('#gdock .gd-card button')].find(x=>x.getClientRects().length&&x.textContent.trim()===t);if(!e)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}},txt);if(!pt)return false;await p.mouse.click(pt.x,pt.y);return true};
const card=()=>p.evaluate(()=>{const c=document.querySelector('#gdock .gd-card');if(!c)return {eb:'',h:'',cond:''};const q=s=>(c.querySelector(s)||{}).textContent||'';return {eb:q('.gd-eb').trim(),h:q('h3').trim(),cond:q('.gd-cond').replace(/\s+/g,' ').trim()}});
await p.getByText('Training',{exact:true}).first().click();await p.waitForTimeout(1500);
await p.getByRole('button',{name:/(Gabay|Guide): Cold/}).first().click();await p.waitForTimeout(6000);
await p.locator('#gdock .gd-seg button',{hasText:'×300'}).first().click();L('speed ×300 clicked');
/* 3.2.0 walkthrough #1: the Training starts PAUSED; the trainee presses RUN (the pill of the panel) */
await p.evaluate(()=>{const b=document.querySelector('#gdock .gd-pill');if(b&&/PAUSED/.test(b.textContent))b.click()});await p.waitForTimeout(500);
const started=new Set();let last='',since=Date.now(),done=new Set(),n=0;const lastPress={};const T0=Date.now();
while(Date.now()-T0<55*60e3){
 const c=await card();const key=c.eb+'|'+c.h;
 if(key!==last){last=key;since=Date.now();done=new Set();n++;L('STEP',c.eb,'«'+c.h+'»');L('   values:',(await p.evaluate(()=>((document.querySelector('#gdock .gd-kv')||document.querySelector('#gdock')).innerText||'').replace(/\s+/g,' ').slice(0,200))));await p.screenshot({path:OUT+'/st'+String(n).padStart(2,'0')+'.png'})}
 if(/TAPOS|PRACTICE/i.test(c.eb)){L('REACHED',c.eb,c.h);break}
 if(/^HAKBANG 64/.test(c.eb)&&Date.now()-since>60e3&&!global.__v64||(/^HAKBANG 64/.test(c.eb)&&Date.now()-(global.__v64||0)>60e3)){global.__v64=Date.now();L('   hold:',c.cond.slice(0,260))}
 const band=await p.evaluate(()=>((document.querySelector('#crband')||document.body).textContent||'').slice(0,4000));if(/\bMFT\b/.test(band)&&/TRIP/.test(band)){L('TRIP on screen');await p.screenshot({path:OUT+'/trip.png'});break}
 const B=await see();let acted=false;
 for(const x of B.filter(x=>x.fld||/^(Tapos na ito sa field|Susunod)/.test(x.t))){if(await press(x.t)){L('   click:',x.t);acted=true;break}}
 if(!acted)for(const x of B){if(x.fld||x.ov||x.lk||x.pre||x.did||/^STOP|^Tapos na ito/.test(x.t))continue;
   if(/^START/.test(x.t)){if(started.has(x.t))continue;if(x.dis){if(!done.has('w'+x.t)){L('   waiting, START locked by interlock:',x.t);done.add('w'+x.t)}break}if(await press(x.t)){started.add(x.t);L('   click:',x.t);acted=true}break}
   if(done.has(x.t)&&Date.now()-(lastPress[x.t]||0)<60e3)continue;if(x.dis)continue;if(await press(x.t)){done.add(x.t);lastPress[x.t]=Date.now();L('   click:',x.t);acted=true;break}}
 if(Date.now()-since>6*60e3){L('STUCK 6 min on',c.eb,'«'+c.h+'» need:',c.cond.slice(0,300));await p.screenshot({path:OUT+'/stuck.png'});break}
 await p.waitForTimeout(acted?800:1500);
}
fs.writeFileSync(OUT+'/log.txt',log.join('\n'));L('page errors',errs.length,errs.slice(0,3).join(' | '));
await ctx.close();await b.close()})();
