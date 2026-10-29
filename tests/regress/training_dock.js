// 3.2.0-beta.23 TRAINING DOCK (user 2026-10-24 "gawin ayon sa mockup"): Training > "Gabay: Cold → 150 MW" (a real click):
// 1. the plant cold and RUN; the dock beside the logic (side on a wide screen, bottom sheet on a portrait one), the app narrower / shorter
// 2. the step card, the values strip and the lamps are filled; a motor step shows its interlock rows from the DITL
// 3. ABC -> DITL -> ABC keeps the simulation running (one RUN); hide -> the tab brings the dock back; stop -> the app full size
// Usage: node tests/regress/training_dock.js [html] [shotdir]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const shots=process.argv.slice(2).find(a=>!/\.html$/.test(a));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let f=0;const ck=(ok,t)=>{console.log((ok?'PASS ':'FAIL ')+t);if(!ok)f++};
for(const [w,h,side] of [[1440,900,1],[800,1280,0]]){
const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));
await p.addInitScript(()=>{window.LS_HOME=false;window.LS_PVWIN=false;window.open=()=>null;try{localStorage.setItem('ls-tab','"logic"');localStorage.removeItem('ls-guide');localStorage.removeItem('ls-gdock-min')}catch(e){}});
await p.goto('file://'+require('path').resolve(html));await p.waitForTimeout(4000);
const clickTxt=async(sel,txt)=>{for(const e of await p.$$(sel)){const t=(await e.textContent()).trim();if(t.includes(txt)&&await e.isVisible()){await e.click();return true}}return false};
const shot=async n=>{if(shots)await p.screenshot({path:shots+'/'+w+'x'+h+'-'+n+'.png'})};
const tag=w+'x'+h+': ';
await clickTxt('button','Training');await p.waitForTimeout(800);
ck(await clickTxt('#trainws button','Gabay: Cold'),tag+'Gabay pressed');await p.waitForTimeout(7000);
const a=await p.evaluate(()=>{const d=document.getElementById('gdock'),r=d&&d.getBoundingClientRect(),bw=document.body.getBoundingClientRect();const U=AN.unit||{};
 return {dock:!!d&&!d.hidden,side:document.documentElement.classList.contains('gd-side'),bottom:document.documentElement.classList.contains('gd-bottom'),dw:r&&r.width,dh:r&&r.height,bw:bw.width,bh:bw.height,run:AN.run,view:AN.view,Pd:U.Pd,ss:AN.startState,
  card:(d&&d.querySelector('.gd-stl h3')||{}).textContent||'',vals:d?d.querySelectorAll('.gd-kv b').length:0,lamps:d?d.querySelectorAll('.gd-lamp').length:0,on:LS_GUIDE.on,cur:LS_GUIDE.cur,hx:document.documentElement.scrollWidth>innerWidth+1}});
ck(a.dock&&(side?a.side&&a.bw<=w-300:a.bottom&&a.bh<=h-250),tag+'dock open, app '+(side?'narrower':'shorter')+' '+JSON.stringify({side:a.side,bottom:a.bottom,bw:a.bw,bh:a.bh,dw:a.dw,dh:a.dh}));
ck(a.run&&!a.view&&a.ss==='plantCold'&&a.Pd===0&&a.on&&a.cur===0,tag+'cold, RUN, step 1: '+a.card);
ck(a.vals===4&&a.lamps===0&&!a.hx,tag+'one line of 4 values (the lamps are on the HMI), no sideways scroll');
await shot('1-start');
// a motor step: the IDF interlock (DITL-25A) in the card, the main area on the DITL of the motor
const m=await p.evaluate(()=>{const S=LS_GUIDE.steps();const i=S.findIndex(s=>/Simulan ang ID fan/.test(s.t));LS_GUIDE.open(i);LS_DOCK.fill(true);return {i,t:S[i]&&S[i].t}});
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
await p.click('#gdock .gd-ic[title^="Itago"]');await p.waitForTimeout(600);
const hd=await p.evaluate(()=>({dock:!document.getElementById('gdock').hidden,tab:!!document.getElementById('gdtab')&&!document.getElementById('gdtab').hidden,bw:document.body.getBoundingClientRect().width,bh:document.body.getBoundingClientRect().height}));
ck(!hd.dock&&hd.tab&&hd.bw>=w-2,tag+'hidden: tab shown, app full size '+JSON.stringify(hd));
await shot('5-hidden');
await p.click('#gdtab');await p.waitForTimeout(600);
ck(await p.evaluate(()=>!document.getElementById('gdock').hidden&&AN.run),tag+'tab brings the dock back, still RUN');
ck(!errs.length,tag+'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await p.context().close()}
console.log(f?'FAILED '+f:'ALL PASS');await b.close();process.exit(f?1:0)})();
