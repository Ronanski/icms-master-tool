// Load down from "Start at 150 MW" (2.2.0-beta.2): ABC-001A HIC-ULD faceplate in AUTO, ▼▼ x 6 = TARGET MW 120; after 10 min the MW demand
// (SI0226) is 120 (change rate HIC-MWRL 3 MW/min), the coal demand and the feeders go down. Usage: node tests/regress/loaddown.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1400,height:900});
await page.evaluate(()=>{AN.reset();AN.plantLoad150();AN.settle();AN.go(AN.sheets.findIndex(s=>s.name==='ABC-001A'));[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Operator').forEach(b=>b.click())});
await page.waitForSelector('#opp .fpman',{timeout:20000});await page.waitForTimeout(800);
const st=()=>page.evaluate(()=>{const g=(n,l)=>{const S=AN.sheets.find(s=>s.name===n).S;const i=S.lab.findIndex(x=>x&&x.t===l);return +S.rt.v[i]};return {mv:g('ABC-001A','HIC-ULD.MV'),dem:g('ABC-001A','SI0226'),coal:g('ABC-002','SI0010'),fa:g('ABC-004A','AI0480')}});
/* 2.2.0-beta.9: like the app, ONE stepSet per 0.5 s (the 36 linked sheets of ABC-001C step once each); before, every sheet stepped
   all its linked sheets, so ABC-001B ran about 30 times per tick and the 0.1 MW/MIN of the broken HIC-MWRL looked like 3 MW/MIN */
const run=s=>page.evaluate(s=>{const C1=AN.sheets.find(x=>x.name==='ABC-001C');for(let k=0;k<s*2;k++)AN.stepSet(C1,.5)},s);
await run(120);const a=await st();
for(let k=0;k<6;k++){await page.evaluate(()=>{const f=[...document.querySelectorAll('#opp .fpman')].find(x=>x.dataset.tag==='HIC-ULD');const b=[...f.querySelectorAll('button')].find(e=>e.textContent==='▼▼');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));b.click()});await page.waitForTimeout(150)}
const b=await st();await run(240);const c=await st();await run(360);const d=await st();
ck(Math.abs(a.dem-150)<0.5,'150 MW: MW demand '+a.dem.toFixed(1)+', coal demand '+a.coal.toFixed(1)+' T/H, feeder A '+a.fa.toFixed(1)+' T/H');
ck(Math.abs(b.mv-120)<0.5,'HIC-ULD ▼▼ x 6 in AUTO: TARGET MW '+b.mv.toFixed(1));
ck(c.dem<145&&c.dem>125,'after 4 min: MW demand '+c.dem.toFixed(1)+' (3 MW/min)');
ck(Math.abs(d.dem-120)<0.5&&d.coal<a.coal-10&&d.fa<a.fa-3,'after 10 min: MW demand '+d.dem.toFixed(1)+', coal demand '+d.coal.toFixed(1)+' T/H, feeder A '+d.fa.toFixed(1)+' T/H');
ck(!errs.length,'no page error');console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
