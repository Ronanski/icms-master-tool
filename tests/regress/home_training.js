// 3.2.0-beta.8 GUIDED WORKBENCH (user pick 2026-10-23 "B + C"): HOME and TRAINING pages (src/ui/shell/home.js).
// 1. The app opens on HOME (window.LS_HOME = true: the tests otherwise keep the remembered page); the rail is Home / Plant view /
//    Logic / Library / Training; TOOLS has no rail button, ⚙ > Engineering tools opens it.
// 2. HOME "At 150 MW" = the Start ▾ button of the PLANT VIEW (AN.startState plantLoad150) and the PLANT VIEW opens.
// 3. VIEW | RUN shows RUN while the clock runs (AN.run) even when the page is in VIEW; VIEW then stops the clock.
// 4. A sheet opened in Logic is listed on HOME under "Sheets you opened"; its button opens it again.
// 5. TRAINING: PR-OPE-5002 = 44 sections + 2 of the app (3.2.0-beta.10: sync and initial load, load up to 150 MW) = 46, 681 steps; a tick is kept (localStorage ls-train) after a reload; Tick field steps; the tag of
//    a DCS controller (FICFA1071) opens its faceplate in the PLANT VIEW, a field valve (V-SW1002) says it is a field item.
// 6. Phone (390 px): the section list is a select; the 5 pages are the bottom tab bar. No page error.
// Usage: node tests/regress/home_training.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));let f=0;const ck=(ok,t)=>{console.log((ok?'PASS ':'FAIL ')+t);if(!ok)f++};
await p.addInitScript(()=>{window.LS_HOME=true;window.LS_PVWIN=false;window.open=()=>null});
const load=async()=>{await p.goto('file://'+require('path').resolve(html));await p.waitForTimeout(2000);await p.evaluate(()=>AN.setCat('an'));await p.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.lsHome,null,{timeout:90000});await p.waitForTimeout(1200)};
await load();await p.evaluate(()=>{localStorage.removeItem('ls-train');localStorage.removeItem('ls-recent')});
// 1
const r1=await p.evaluate(()=>({tab:document.body.dataset.tab,vis:getComputedStyle(document.getElementById('homews')).display,rail:[...document.querySelectorAll('#crrail .tabs button')].map(x=>x.textContent.trim()).join(),cards:[...document.querySelectorAll('#homews .hmcard b')].map(x=>x.textContent).join('|')}));
ck(r1.tab==='home'&&r1.vis==='block'&&r1.rail==='Home,Plant view,Logic,Library,Training','opens on HOME, rail '+r1.rail);
ck(/Continue/.test(r1.cards)&&/Operate the plant/.test(r1.cards)&&/Learn the start-up/.test(r1.cards)&&/F\(X\) curves/.test(r1.cards),'HOME cards: '+r1.cards);
await p.evaluate(()=>(document.querySelector('#crrail .gs-set > button')).click());await p.waitForTimeout(200);await p.click('#engtools');await p.waitForTimeout(400);
ck(await p.evaluate(()=>document.body.dataset.tab==='tools'&&getComputedStyle(document.getElementById('toolsws')).display==='block'),'⚙ > Engineering tools opens the TOOLS page');
// 2
await p.evaluate(()=>lsSetTab('home'));await p.waitForTimeout(300);
await p.evaluate(()=>[...document.querySelectorAll('#homews .hmstart')].find(x=>/150 MW/.test(x.textContent)).click());await p.waitForTimeout(3000);
const r2=await p.evaluate(()=>({tab:document.body.dataset.tab,st:AN.startState,seg:[...document.querySelectorAll('#gsbar .seg button')].map(x=>x.textContent+(x.classList.contains('on')?'*':'')).join('|')}));
ck(r2.tab==='operate'&&r2.st==='plantLoad150'&&r2.seg==='VIEW*|RUN','HOME At 150 MW: starting state '+r2.st+', page '+r2.tab+', switch '+r2.seg);
// 3
await p.evaluate(()=>{AN.view=true;AN.run=true});await p.waitForTimeout(700);
const r3=await p.evaluate(()=>[...document.querySelectorAll('#gsbar .seg button')].map(x=>x.textContent+(x.classList.contains('on')?'*':'')).join('|'));
await p.evaluate(()=>document.querySelector('#gsbar .seg button').click());await p.waitForTimeout(700);
const r3b=await p.evaluate(()=>({run:AN.run,view:AN.view,seg:[...document.querySelectorAll('#gsbar .seg button')].map(x=>x.textContent+(x.classList.contains('on')?'*':'')).join('|')}));
ck(r3==='VIEW|RUN*'&&!r3b.run&&r3b.view&&r3b.seg==='VIEW*|RUN','clock running in VIEW shows '+r3+'; VIEW stops it: '+JSON.stringify(r3b));
// 4
await p.evaluate(()=>{lsSetTab('logic');AN.go(AN.sheets.findIndex(s=>s.name==='ABC-010'))});await p.waitForTimeout(2600);
await p.evaluate(()=>{AN.go(AN.sheets.findIndex(s=>s.name==='ABC-001C'))});await p.waitForTimeout(2600);
await p.evaluate(()=>lsSetTab('home'));await p.waitForTimeout(300);
const r4=await p.evaluate(()=>[...document.querySelectorAll('#homews .hmrecent .hmlist:first-child .hmchip')].map(x=>x.textContent).join());
await p.evaluate(()=>[...document.querySelectorAll('#homews .hmchip')].find(x=>x.textContent==='ABC-010').click());await p.waitForTimeout(800);
const r4b=await p.evaluate(()=>({tab:document.body.dataset.tab,sh:AN.sheets[AN.i].name}));
ck(/^ABC-001C,ABC-010/.test(r4)&&r4b.tab==='logic'&&r4b.sh==='ABC-010','sheets you opened: '+r4+'; ABC-010 button -> '+JSON.stringify(r4b));
// 5
await p.evaluate(()=>lsSetTab('training'));await p.waitForTimeout(400);
const r5=await p.evaluate(()=>({n:LS_PROC5002.length,m:LS_PROC5002.reduce((a,s)=>a+s.s.length,0),list:document.querySelectorAll('#trainws .trsec').length,vis:getComputedStyle(document.getElementById('trainws')).display}));
ck(r5.n===46&&r5.m===681&&r5.list===46&&r5.vis==='flex','TRAINING: '+r5.n+' sections, '+r5.m+' steps, '+r5.list+' in the list');
await p.evaluate(()=>lsHome.show(0));await p.click('#trc0_0');await p.waitForTimeout(200);
const r5b=await p.evaluate(()=>({pct:document.querySelector('#trainws .trpct').textContent,ls:localStorage.getItem('ls-train')}));
await load();await p.evaluate(()=>lsSetTab('training'));await p.waitForTimeout(400);await p.evaluate(()=>lsHome.show(0));
const r5c=await p.evaluate(()=>({c:document.getElementById('trc0_0').checked,pct:document.querySelector('#trainws .trpct').textContent}));
ck(/^1 of 681/.test(r5b.pct)&&r5b.ls==='{"0.0":1}'&&r5c.c&&/^1 of 681/.test(r5c.pct),'tick step 1: "'+r5b.pct+'", kept after a reload: '+r5c.c);
await p.evaluate(()=>[...document.querySelectorAll('#trainws .trbtn')].find(x=>x.textContent==='Tick field steps').click());await p.waitForTimeout(200);
ck(await p.evaluate(()=>/^6 \/ 6 done$/.test(document.querySelector('#trainws .trcount').textContent)&&/6\/6/.test(document.querySelector('#trainws .trsec.on').textContent)),'Tick field steps: section 1 = 6 / 6');
const si=await p.evaluate(()=>LS_PROC5002.findIndex(s=>s.s.some(x=>x.g.includes('FICFA1071'))));
await p.evaluate(i=>lsHome.show(i),si);await p.waitForTimeout(200);
await p.evaluate(()=>[...document.querySelectorAll('#trainws .trtag')].find(x=>x.textContent==='FICFA1071').click());await p.waitForTimeout(1500);
const r5d=await p.evaluate(()=>{const c=document.getElementById('plfp');return {fp:c?c.dataset.tag:null,tab:document.body.dataset.tab}});
ck(r5d.fp==='FICFA1071'&&r5d.tab==='operate','tag FICFA1071 in section '+(si+1)+' opens its faceplate in the PLANT VIEW: '+JSON.stringify(r5d));
await p.evaluate(()=>lsSetTab('training'));await p.waitForTimeout(300);
await p.evaluate(()=>[...document.querySelectorAll('#trainws .trtag')].find(x=>x.textContent==='FICFA1071'&&lsHome.show(1)));
await p.evaluate(()=>lsHome.show(1));await p.waitForTimeout(200);
await p.evaluate(()=>[...document.querySelectorAll('#trainws .trtag')].find(x=>x.textContent==='V-SW1002').click());await p.waitForTimeout(1500);
ck(await p.evaluate(()=>!!document.querySelector('#trainws .trtag.nf')&&/field item/.test(document.querySelector('#trainws .trnf').textContent)),'field valve V-SW1002: "'+await p.evaluate(()=>(document.querySelector('#trainws .trnf')||{}).textContent)+'"');
// 6
await p.setViewportSize({width:390,height:844});await p.waitForTimeout(900);
const r6=await p.evaluate(()=>{const s=document.getElementById('trpick');s.value='19';s.dispatchEvent(new Event('change'));return {sel:getComputedStyle(s).display,list:getComputedStyle(document.querySelector('#trainws .trlist')).display,h:document.querySelector('#trainws .trshead h3').textContent,nav:[...document.querySelectorAll('#crnav .tabs button')].map(x=>x.textContent.trim()).join(),ow:document.documentElement.scrollWidth}});
ck(r6.sel!=='none'&&r6.list==='none'&&r6.h==='Steam drum filling'&&r6.nav==='Home,Plant view,Logic,Library,Training'&&r6.ow<=390,'phone: '+JSON.stringify(r6));
ck(!errs.length,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(f?'FAILED '+f:'ALL PASS');await b.close();process.exit(f?1:0)})();
