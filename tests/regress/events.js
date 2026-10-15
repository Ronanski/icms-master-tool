// Event log (1.23.0): mode change, force manual signal, alarm, with the simulation time. Read only.
// ABC-010: FORCE 0 on M.0228 (force manual of FICFW1007) must log "force manual cleared"; AUTO press must log "→ AUTO".
// Usage: node tests/regress/events.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForSelector('#evbtn',{timeout:20000});ck(true,'Events button in the status bar');
await page.evaluate(()=>{AN.go(AN.sheets.findIndex(s=>s.name==='ABC-010'));[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Operator').forEach(b=>b.click());AN.run=true});await page.waitForSelector('#opp .fp',{timeout:20000});await page.waitForTimeout(1500);
await page.evaluate(()=>{const S=AN.sheets[AN.i].S;const n=S.nets.findIndex((x,k)=>AN.nm(S,k)==='M.0228');S.rt.force[n]=0;AN.settle&&AN.settle()});
await page.waitForTimeout(2000);
let L=await page.evaluate(()=>lsEvents.map(e=>e.kind+' '+e.text));
ck(L.some(t=>/^FM FICFW1007 force manual cleared ← M.0228 = 0/.test(t)),'FM event: '+(L.find(t=>/^FM/.test(t))||'none'));
await page.evaluate(()=>{const f=[...document.querySelectorAll('#opp .fp')].find(x=>x.querySelector('.tg b')&&x.querySelector('.tg b').textContent==='FICFW1007');if(f)[...f.querySelectorAll('button')].find(e=>e.textContent==='A').click()});
await page.waitForTimeout(2000);
L=await page.evaluate(()=>lsEvents.map(e=>e.kind+' '+e.text));
ck(L.some(t=>/^MODE FICFW1007 → AUTO/.test(t)),'MODE event: '+(L.find(t=>/^MODE/.test(t))||'none'));
await page.evaluate(()=>document.getElementById('evbtn').click());await page.waitForTimeout(300);
ck(await page.evaluate(()=>document.querySelectorAll('#evbox .evr').length>=2),'drawer shows the rows');
ck(errs.length===0,'no page error'+(errs.length?' ('+errs[0]+')':''));
await browser.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
