// PLANT workspace LIVE link (2.1.0-beta.5): after "Start at 150 MW", the plant graphics read the simulation.
// Checks: links found on every drawn system, known links resolve to the right place, values on screen = engine values, no page error.
// Usage: node tests/regress/plant_live.js [html]
const fs=require('fs');const {open}=require('./lib.js');
const html=process.argv[2]||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ok=(c,t)=>{console.log((c?'PASS ':'FAIL ')+t);if(!c)fail++};
await page.evaluate(()=>{AN.reset();AN.plantLoad150();AN.settle()});await page.evaluate(()=>window.lsPlant(true));await page.waitForTimeout(800);
const ids=await page.evaluate(()=>[...document.querySelectorAll('#pllist button')].filter(b=>!b.classList.contains('novg')).map(b=>b.dataset.id));
let tot=0,lk=0;const got={};
for(const id of ids){await page.evaluate(id=>[...document.querySelectorAll('#pllist button')].find(x=>x.dataset.id===id).click(),id);await page.waitForTimeout(1500);
 const L=await page.evaluate(()=>window.lsPlantLive());tot+=L.length;lk+=L.filter(x=>x.how).length;for(const x of L)if(x.how&&!got[x.tag])got[x.tag]=x}
ok(lk>=200,'linked items: '+lk+' of '+tot+' (values, controllers, valves of '+ids.length+' systems)');
const want={FIQMS1031:['FIQMS1031.PV','ABC-010'],TICBR1140:['ctl','ABC-011'],TIBR11401:['AI of TTBR11401','ABC-011'],TCVFW11101:['valve on the drawing','ABC-011'],DPIFG1081:['AI of DPTFG1081','ABC-009A']};
for(const [t,[how,sh]] of Object.entries(want))ok(got[t]&&got[t].how===how&&got[t].sh===sh,t+' -> '+(got[t]?got[t].how+' '+got[t].sh:'not linked')+' (expected '+how+' '+sh+')');
/* the number on screen follows the engine: change the MV of TICBR1140 and read the box again */
await page.evaluate(id=>[...document.querySelectorAll('#pllist button')].find(x=>x.dataset.id===id).click(),'03');await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{const sh=AN.sheets.find(s=>s.name==='ABC-011');const c=AN.hmiCtrls(sh.S).find(x=>x.tag==='TICBR1140');const n=c.out;const old=sh.S.rt.force[n];sh.S.rt.force[n]=33.3;sh.S.rt.v[n]=33.3;await new Promise(r=>setTimeout(r,1300));const t=[...document.querySelectorAll('#plsvg text')].map(e=>e.textContent).find(s=>/^MV 33\.3/.test(s));sh.S.rt.force[n]=old;return t||null});
ok(!!r,'TICBR1140 box shows the engine MV 33.3 % ('+r+')');
const eq={'BFWP-A P-1115A':['M.3343',1],'BFWP-B P-1115B':['M.3344',0],'F-1056 IDF':['M.3304',1],'F-1055B FA BLOWER-B':['M.3309',0]};
for(const [t,[a,v]] of Object.entries(eq))ok(got[t]&&got[t].how.startsWith(a)&&got[t].live===v,t+' -> '+(got[t]?got[t].how+' = '+got[t].live:'not linked')+' (expected '+a+' = '+v+', 150 MW)');
ok(!errs.length,'no page error'+(errs.length?': '+errs[0]:''));
console.log(fail?'FAIL':'ALL PASS');await browser.close();process.exit(fail?1:0)})();
