// Event log (1.23.0): mode change, force manual signal, alarm, with the simulation time. Read only.
// ABC-010: FORCE 0 on M.0228 (force manual of FICFW1007) must log "force manual cleared"; AUTO press must log "→ AUTO".
// Usage: node tests/regress/events.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
// 3.2.3-beta.152: layout C (3.2.1) keeps the old status-bar button hidden (class an-only) and shows the Event log as the Events tab of the
// alarm panel (shellc-home.js openAl). The start screen covers the app: close it the way the operator does
await page.waitForSelector('#evbtn',{state:'attached',timeout:20000});ck(true,'Event log mounted');
await page.waitForTimeout(1500);await page.evaluate(()=>{const k=document.querySelector('#scstart .scskip');if(k&&k.offsetParent)k.click()});await page.waitForTimeout(1000);
await page.evaluate(()=>{AN.go(AN.sheets.findIndex(s=>s.name==='ABC-010'));[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Faceplate').forEach(b=>b.click());AN.run=true});await page.waitForSelector('#opp .fp',{timeout:20000});await page.waitForTimeout(1500);
await page.evaluate(()=>{const S=AN.sheets[AN.i].S;const n=S.nets.findIndex((x,k)=>AN.nm(S,k)==='M.0228');S.rt.force[n]=0;AN.settle&&AN.settle()});
await page.waitForTimeout(2000);
let L=await page.evaluate(()=>lsEvents.map(e=>e.kind+' '+e.text));
ck(L.some(t=>/^FM FICFW1007 force manual cleared ← M.0228 = 0/.test(t)),'FM event: '+(L.find(t=>/^FM/.test(t))||'none'));
await page.evaluate(()=>{const f=[...document.querySelectorAll('#opp .fp')].find(x=>x.querySelector('.tg b')&&x.querySelector('.tg b').textContent==='FICFW1007');if(f)[...f.querySelectorAll('button')].find(e=>e.textContent==='A').click()});
await page.waitForTimeout(2000);
L=await page.evaluate(()=>lsEvents.map(e=>e.kind+' '+e.text));
ck(L.some(t=>/^MODE FICFW1007 → AUTO/.test(t)),'MODE event: '+(L.find(t=>/^MODE/.test(t))||'none'));
const shellC=await page.evaluate(()=>!!(window.lsShellC&&lsShellC.openAl)&&!document.getElementById('evbtn').offsetParent);
if(shellC){await page.evaluate(()=>lsShellC.openAl('events'));await page.waitForTimeout(800);
ck(await page.evaluate(()=>document.querySelectorAll('.scrow.ev').length>=2),'Events tab of the alarm panel shows the rows');}
else{await page.evaluate(()=>document.getElementById('evbtn').click());await page.waitForTimeout(300);
ck(await page.evaluate(()=>document.querySelectorAll('#evbox .evr').length>=2),'drawer shows the rows');}
ck(errs.length===0,'no page error'+(errs.length?' ('+errs[0]+')':''));
await browser.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
