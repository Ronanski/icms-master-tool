/* CHECKPOINT RUN of the Training (roadmap 2 batch 3, 2026-10-27, test tool only: the app does not change). The human-like run of
 tools/training/human_run.js (mouse clicks on the step card, x300) that can SAVE the whole state (ABC rt, DITL sheets, plant, turbine / TCS,
 world, guide step and coaches: ckstate.js) when a step opens, and start FROM a saved state instead of Cold, so a retest begins one step
 before the problem. The full Cold run stays the final test of a batch. A step is STUCK after 6 min wall AND 1800 plant minutes (or 20 min
 wall): the page slows down after ~30 min of x300, a wall-clock limit alone stopped a run that had no hold.
 Usage: node tools/training/checkpoint/run.js <outdir> <abs html> [--save 49,64] [--from <outdir>/ck_49.json] [--until 54] [--trace 10] [--mins 15]
 Checked faithful from steps 40 ~ 52 (restore check: 0 state differences, the run goes on as before); from step 64 (coal / CCS) the
 restored plant does not follow the original (pressure falls after HS-COAL R): a state outside these roots, not found yet */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const OUT=process.argv[2],HTML=process.argv[3];const opt=k=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:null};
const SAVE=new Set((opt('save')||'').split(',').filter(Boolean).map(Number)),FROM=opt('from'),UNTIL=opt('until')?+opt('until'):1e9;
fs.mkdirSync(OUT,{recursive:true});const CKJS=fs.readFileSync(__dirname+'/ckstate.js','utf8');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:1440,height:860},recordVideo:{dir:OUT+'/vid',size:{width:1280,height:764}}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>{errs.push(e.message);if(errs.length<3)console.log('PAGEERR',e.stack)});
await p.addInitScript(()=>{window.LS_PVWIN=false;window.open=()=>null;window.LS_HOME=true;try{localStorage.clear()}catch(e){}});
await p.goto('file://'+HTML);await p.waitForTimeout(4000);
const log=[];const L=(...a)=>{const t=new Date().toISOString().slice(11,19)+' '+a.join(' ');log.push(t);console.log(t)};
// what the eye sees: the visible buttons of the step card (text, disabled look, where)
const see=()=>p.evaluate(()=>[...document.querySelectorAll('#gdock .gd-card button')].filter(e=>e.getClientRects().length).map((e,i)=>{const r=e.getBoundingClientRect();return {i,t:e.textContent.trim(),dis:e.classList.contains('dis'),did:e.classList.contains('did'),fld:e.classList.contains('gd-fld'),ov:e.classList.contains('gd-ov'),lk:e.classList.contains('gd-lk'),y:r.y,h:r.height}}));
// scroll it into view like a hand on the wheel, read its place and click there at once
const press=async (txt)=>{const pt=await p.evaluate(t=>{const e=[...document.querySelectorAll('#gdock .gd-card button')].find(x=>x.getClientRects().length&&x.textContent.trim()===t);if(!e)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}},txt);if(!pt)return false;await p.mouse.click(pt.x,pt.y);return true};
const card=()=>p.evaluate(()=>{const c=document.querySelector('#gdock .gd-card');if(!c)return {eb:'',h:'',cond:''};const q=s=>(c.querySelector(s)||{}).textContent||'';return {eb:q('.gd-eb').trim(),h:q('h3').trim(),cond:q('.gd-cond').replace(/\s+/g,' ').trim()}});
await p.getByText('Training',{exact:true}).first().click();await p.waitForTimeout(1500);
await p.getByRole('button',{name:/Gabay: Cold/}).first().click();await p.waitForTimeout(6000);
await p.addScriptTag({content:CKJS});
if(FROM){const t0=Date.now();const r=await p.evaluate(t=>{const r=__CK.load(t);r.back=__CK.save();return r},fs.readFileSync(FROM,'utf8'));
const A=JSON.parse(fs.readFileSync(FROM,'utf8')),Bk=JSON.parse(r.back);delete r.back;const df=[];const cmp=(a,b,pa)=>{if(df.length>60)return;if(a&&typeof a==='object'&&b&&typeof b==='object'){if(a.$r||b.$r)return;for(const k of new Set([...Object.keys(a),...Object.keys(b)]))if(k!=='at')cmp(a[k],b[k],pa+'.'+k);return}if(JSON.stringify(a)!==JSON.stringify(b))df.push(pa+' '+JSON.stringify(a)+' -> '+JSON.stringify(b))};cmp(A,Bk,'');L('restore check: '+df.length+' differences');df.slice(0,40).forEach(x=>L('   diff '+x.slice(0,200)));L('RESTORED','MST',await p.evaluate(()=>{try{return CHECK.H().MST().toFixed(1)}catch(e){return e.message}}),FROM,JSON.stringify(r),'in',((Date.now()-t0)/1000).toFixed(1),'s');await p.waitForTimeout(1500)}
await p.locator('#gdock .gd-seg button',{hasText:'×300'}).first().click();L('speed ×300 clicked');
const started=new Set();let last='',since=Date.now(),done=new Set(),n=0;const lastPress={};const T0=Date.now();
while(Date.now()-T0<(+opt('mins')||55)*60e3){
 const c=await card();const key=c.eb+'|'+c.h;
 if(key!==last){last=key;since=Date.now();done=new Set();n++;L('STEP',c.eb,'«'+c.h+'»');L('   values:',(await p.evaluate(()=>((document.querySelector('#gdock .gd-kv')||document.querySelector('#gdock')).innerText||'').replace(/\s+/g,' ').slice(0,200))));await p.screenshot({path:OUT+'/st'+String(n).padStart(2,'0')+'.png'})}
 const hn=+((/^HAKBANG (\d+)/.exec(c.eb)||[])[1]||-1);
 if(key===last&&hn>=0&&SAVE.has(hn)&&!global['__s'+hn]){global['__s'+hn]=1;const t0=Date.now();const j=await p.evaluate(()=>__CK.save());fs.writeFileSync(OUT+'/ck_'+hn+'.json',j);L('SAVED checkpoint HAKBANG',hn,'MST',await p.evaluate(()=>{try{return CHECK.H().MST().toFixed(1)+' t '+AN.unit.t.toFixed(0)}catch(e){return e.message}}),(j.length/1e6).toFixed(1)+' MB in',((Date.now()-t0)/1000).toFixed(1),'s')}
 if(hn>=UNTIL){L('UNTIL reached',c.eb);break}
 if(/TAPOS|PRACTICE/i.test(c.eb)){L('REACHED',c.eb,c.h);break}
 if(/^HAKBANG 64/.test(c.eb)&&Date.now()-since>60e3&&!global.__v64||(/^HAKBANG 64/.test(c.eb)&&Date.now()-(global.__v64||0)>60e3)){global.__v64=Date.now();L('   hold:',c.cond.slice(0,260))}
 const band=await p.evaluate(()=>((document.querySelector('#crband')||document.body).textContent||'').slice(0,4000));if(/\bMFT\b/.test(band)&&/TRIP/.test(band)){L('TRIP on screen');await p.screenshot({path:OUT+'/trip.png'});break}
 const mt=await p.evaluate(()=>{try{const H=CHECK.H();return {mst:H.MST(),mw:H.MW(),i:H.pv('ABC-012','TICBR1150'),x:H.pv('ABC-011','TICBR1140')}}catch(e){return null}});if(mt&&isFinite(mt.mst)){if(!global.__mx||mt.mst>global.__mx.mst)global.__mx=mt;if(Date.now()-(global.__mt||0)>60e3){global.__mt=Date.now();L('   temp: MST '+mt.mst.toFixed(1)+' MW '+(+mt.mw).toFixed(1)+' inlet '+(+mt.i).toFixed(0)+' SH2 '+(+mt.x).toFixed(0)+' | max MST '+global.__mx.mst.toFixed(1)+' at MW '+(+global.__mx.mw).toFixed(1))}}
 if(opt('trace')&&Date.now()-(global.__tr||0)>+opt('trace')*1000){global.__tr=Date.now();L('   trace: '+await p.evaluate(()=>{try{const H=CHECK.H(),o=LS_GUIDE.CO.ofire||{},T=AN.tcs()||{},U=AN.unit,f=x=>x==null||!isFinite(x)?'-':(+x).toFixed(1);let bp='';try{bp=f(H.sh('ABC-050').rt.v[H.ctl('ABC-050','PICMS1006').q.sv])+'/'+f(H.sh('ABC-050').rt.v[H.ctl('ABC-050','PICMS1006').q.mv])}catch(e){bp=e.message}return 't '+f(U.t/60)+'m MSP '+f(H.MSP())+' RHP '+f(H.RHP())+' MSF '+f(H.MSF())+' MW '+f(H.MW())+' rpm '+((U.tb&&U.tb.rpm)|0)+' ats '+T.cur+'/'+T.ph+' bypSV/MV '+bp+' oil ab '+f(o.ab)+' cd '+f(o.cd)+' hp '+f(o.hp)+' coach '+Object.keys(LS_GUIDE.CO).join(',')+' | MST '+f(H.MST())+' '+['ABC-012:TICBR1150','ABC-012:TICMS1004','ABC-011:TICBR1140'].map(x=>{const [k,t]=x.split(':');try{const c=H.ctl(k,t),v=H.sh(k).rt.v;return t+' '+f(v[c.q.pv])+'/'+f(v[c.q.sv])+'/'+f(v[c.q.mv])+' '+(H.mode?H.mode(k,t):'')}catch(e){return t+' ERR'}}).join(' ')+' sp '+JSON.stringify(LS_GUIDE.CO.spray||{}).slice(0,120)+' | FP '+f(H.FP())+' lvl '+f(H.lvl())+' oil '+f(U.oilF)+' IDF MV '+f(H.mv('ABC-008','PICFG108'))+' sw '+(WORLD.plantSw?WORLD.plantSw().filter(x=>x.on).map(x=>x.tag).join(','):'')}catch(e){return 'ERR '+e.message}}))}
 const B=await see();let acted=false;
 for(const x of B.filter(x=>x.fld||x.t==='Tapos na ito sa field')){if(await press(x.t)){L('   click:',x.t);acted=true;break}}
 if(!acted)for(const x of B){if(x.fld||x.ov||x.lk||x.did||/^STOP|^Tapos na ito/.test(x.t))continue;
   if(/^START/.test(x.t)){if(started.has(x.t))continue;if(x.dis){if(!done.has('w'+x.t)){L('   waiting, START locked by interlock:',x.t);done.add('w'+x.t)}break}if(await press(x.t)){started.add(x.t);L('   click:',x.t);acted=true}break}
   if(done.has(x.t)&&Date.now()-(lastPress[x.t]||0)<60e3)continue;if(x.dis)continue;if(await press(x.t)){done.add(x.t);lastPress[x.t]=Date.now();await p.waitForTimeout(300);L('   click:',x.t,'| miss:',await p.evaluate(()=>{try{const T=AN.tcs();return 'step '+T.step+' cur '+T.cur+' rpm '+(AN.unit.tb&&AN.unit.tb.rpm|0)+' '+Object.values(T.crit||{}).filter(x=>x&&!x.ok).map(x=>x.no+'='+(x.val!=null&&isFinite(x.val)?(+x.val).toFixed(1):'')).join(' ')}catch(e){return e.message}}));acted=true;break}}
 const simNow=await p.evaluate(()=>+(AN.unit&&AN.unit.t)||0);if(key!==global.__sk){global.__sk=key;global.__st0=simNow}
 if(Date.now()-since>6*60e3&&(simNow-global.__st0>1800*60||Date.now()-since>20*60e3)){L('   sim minutes on this step: '+((simNow-global.__st0)/60).toFixed(0));L('STUCK 6 min on',c.eb,'«'+c.h+'» need:',c.cond.slice(0,300));await p.screenshot({path:OUT+'/stuck.png'});break}
 await p.waitForTimeout(acted?800:1500);
}
fs.writeFileSync(OUT+'/log.txt',log.join('\n'));L('page errors',errs.length,errs.slice(0,3).join(' | '));
await ctx.close();await b.close()})();
