// 3.2.0-beta.23 TRAINING DOCK (user 2026-10-24 "gawin ayon sa mockup"): Training > "Gabay: Cold → 150 MW" (a real click):
// 1. the plant cold; the dock beside the logic (side on a wide screen, bottom sheet on a portrait one), the app narrower / shorter
// 2. the step card, the values strip and the lamps are filled; a motor step shows its interlock rows from the DITL
// 3. ABC -> DITL -> ABC keeps the simulation running (one RUN); hide -> the tab brings the dock back; stop -> the app full size
// Brought up to date 2026-11-03 (beta.88), behaviour kept, only the design the user approved since:
// - the Cold now loads in slices with a progress bar (Retest 4 #54, ~25 s): the test waits for the load, was a fixed 7 s;
// - the Training starts PAUSED at x1 (walkthrough #1 #16: field steps first); the test presses the dock's RUN pill as the operator does,
//   then checks the one RUN across ABC -> DITL -> ABC as before;
// - the strip (dock mock-up v2, user 2026-10-30 "g na yan"): the 8 plant values in the dock, at most 3 on one line, "All" opens the 8
//   and the equipment lamps (was: 4 values, no lamps, beta.57);
// - the hide icon's title is English (user 2026-10-31);
// - a hidden panel comes back from "▶ Training n / N" in the top bar beside Events (live test #60, user G 2026-10-31), not the side tab.
// Usage: node tests/regress/training_dock.js [html] [shotdir]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const shots=process.argv.slice(2).find(a=>!/\.html$/.test(a));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let f=0;const ck=(ok,t)=>{console.log((ok?'PASS ':'FAIL ')+t);if(!ok)f++};
for(const [w,h,side] of [[1440,900,1],[800,1280,0]]){
const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));
/* 3.2.3: the dock (#gdock) belongs to the old layout; layout C (default since 3.2.1-beta.254) shows the guide in the Training tab of the
   Details column. The old layout is still offered (start screen "Old layout", ls-shell = old), so this test opens it */
await p.addInitScript(()=>{try{localStorage.setItem('ls-shell','old')}catch(e){}});
await p.addInitScript(()=>{window.LS_HOME=false;window.LS_PVWIN=false;window.open=()=>null;try{localStorage.setItem('ls-tab','"logic"');localStorage.removeItem('ls-guide');localStorage.removeItem('ls-gdock-min')}catch(e){}});
await p.goto('file://'+require('path').resolve(html));await p.waitForTimeout(4000);
const clickTxt=async(sel,txt)=>{for(const e of await p.$$(sel)){const t=(await e.textContent()).trim();if(t.includes(txt)&&await e.isVisible()){await e.click();return true}}return false};
const shot=async n=>{if(shots)await p.screenshot({path:shots+'/'+w+'x'+h+'-'+n+'.png'})};
const tag=w+'x'+h+': ';
await clickTxt('button','Training');await p.waitForTimeout(800);
ck(await clickTxt('#trainws button','Guide: Cold'),tag+'Gabay pressed');
await p.waitForFunction(()=>window.AN&&!AN._loading&&AN.startState==='plantCold'&&window.LS_GUIDE&&LS_GUIDE.on,null,{timeout:180000}).catch(()=>{});await p.waitForTimeout(2000);
const a=await p.evaluate(()=>{const d=document.getElementById('gdock'),r=d&&d.getBoundingClientRect(),bw=document.body.getBoundingClientRect();const U=AN.unit||{};
 return {dock:!!d&&!d.hidden,side:document.documentElement.classList.contains('gd-side'),bottom:document.documentElement.classList.contains('gd-bottom'),dw:r&&r.width,dh:r&&r.height,bw:bw.width,bh:bw.height,run:AN.run,view:AN.view,Pd:U.Pd,ss:AN.startState,
  card:(d&&d.querySelector('.gd-stl h3')||{}).textContent||'',spd:AN.spd||1,pill:(d&&d.querySelector('.gd-pill')||{}).textContent||'',on:LS_GUIDE.on,cur:LS_GUIDE.cur}});
const strip=()=>p.evaluate(()=>{const d=document.getElementById('gdock'),vis=e=>!!e.offsetParent;const K=d?[...d.querySelectorAll('.gd-kv')]:[],L=d?[...d.querySelectorAll('.gd-lamp')]:[];
 return {vals:K.length,shown:K.filter(vis).length,lamps:L.length,lampsShown:L.filter(vis).length,hx:document.documentElement.scrollWidth>innerWidth+1}});
ck(a.dock&&(side?a.side&&a.bw<=w-300:a.bottom&&a.bh<=h-250),tag+'dock open, app '+(side?'narrower':'shorter')+' '+JSON.stringify({side:a.side,bottom:a.bottom,bw:a.bw,bh:a.bh,dw:a.dw,dh:a.dh}));
ck(!a.run&&a.ss==='plantCold'&&a.Pd===0&&a.on&&a.cur===0&&a.spd===1&&/PAUSED/.test(a.pill)&&!!a.card.trim(),tag+'cold, PAUSED at x1, step 1: '+a.card+' ['+a.pill+', x'+a.spd+']');
const s1=await strip();
ck(s1.vals===8&&s1.shown<=3&&s1.lamps>=1&&s1.lampsShown===0&&!s1.hx,tag+'the 8 values in the dock, at most 3 on one line, the lamps folded, no sideways scroll '+JSON.stringify(s1));
await p.click('#gdock .gd-all');await p.waitForTimeout(600);
const s2=await strip();
ck(s2.shown===8&&s2.lampsShown===s2.lamps&&s2.lamps>=1&&!s2.hx,tag+'"All" opens the 8 values and the lamps, no sideways scroll '+JSON.stringify(s2));
await p.click('#gdock .gd-all');await p.waitForTimeout(400);
await shot('1-start');
await p.click('#gdock .gd-pill');await p.waitForTimeout(1500);
const r1=await p.evaluate(()=>({run:AN.run,view:AN.view,pill:(document.querySelector('#gdock .gd-pill')||{}).textContent||''}));
ck(r1.run&&!r1.view&&/RUN/.test(r1.pill),tag+'the RUN pill of the dock: RUN '+JSON.stringify(r1));
// a motor step: the IDF interlock (DITL-25A) in the card, the main area on the DITL of the motor
const m=await p.evaluate(()=>{const S=LS_GUIDE.steps();const i=S.findIndex(s=>/(Simulan ang|Start the) ID fan/.test(s.t));LS_GUIDE.open(i);LS_DOCK.fill(true);return {i,t:S[i]&&S[i].t}});
await p.waitForTimeout(2500);
const il=await p.evaluate(()=>{const d=document.getElementById('gdock');return {rows:d.querySelectorAll('.gd-ilr').length,x:d.querySelectorAll('.gd-ilr.x').length,dis:d.querySelectorAll('.gd-btn.dis').length,cat:AN.cat,sim:typeof SIM!=='undefined'&&SIM,txt:(d.querySelector('.gd-il')||{}).textContent||''}});
ck(il.rows>=5&&il.x>=1&&il.dis>=1,tag+'IDF step #'+m.i+' shows the interlock: '+il.rows+' rows, '+il.x+' missing, START blocked');
await shot('2-idf');
await p.evaluate(()=>AN.setCat('dig'));await p.waitForTimeout(2500);
const d1=await p.evaluate(()=>({cat:AN.cat,sim:SIM,dock:!document.getElementById('gdock').hidden}));
ck(d1.cat!=='an'&&d1.sim&&d1.dock,tag+'DITL: still simulating, dock still there '+JSON.stringify(d1));
await shot('3-ditl');
await p.evaluate(()=>AN.setCat('an'));await p.waitForTimeout(3000);
const d2=await p.evaluate(()=>({cat:AN.cat,run:AN.run,view:AN.view}));
ck(d2.cat==='an'&&d2.run&&!d2.view,tag+'back to ABC: still RUN '+JSON.stringify(d2));
await shot('4-abc');
await p.click('#gdock .gd-ic[title^="Hide the Training panel"]');await p.waitForTimeout(600);
const hd=await p.evaluate(()=>({dock:!document.getElementById('gdock').hidden,tab:!!(document.getElementById('gdtrb')||{}).offsetParent,tabTxt:(document.getElementById('gdtrb')||{}).textContent,bw:document.body.getBoundingClientRect().width,bh:document.body.getBoundingClientRect().height}));
ck(!hd.dock&&hd.tab&&hd.bw>=w-2,tag+'hidden: tab shown, app full size '+JSON.stringify(hd));
await shot('5-hidden');
await p.click('#gdtrb');await p.waitForTimeout(600);
ck(await p.evaluate(()=>!document.getElementById('gdock').hidden&&AN.run),tag+'tab brings the dock back, still RUN');
ck(!errs.length,tag+'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await p.context().close()}
console.log(f?'FAILED '+f:'ALL PASS');await b.close();process.exit(f?1:0)})();
