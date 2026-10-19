// PLANT VIEW (2.4.0-beta.5): click a controller on the plant graphic = its faceplate; M / MV / A on it drive the engine the same
// way as the LOGIC pane. On a PC the PLANT VIEW opens in its own window (same engine), Dock brings it back.
// Usage: node tests/regress/plant_view.js [html]
const fs=require('fs');const {open}=require('./lib.js');
const html=process.argv[2]||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ok=(c,t)=>{console.log((c?'PASS ':'FAIL ')+t);if(!c)fail++};
const T='TICBR1140',SH='ABC-011';
const eng=()=>page.evaluate(([T,SH])=>{const sh=AN.sheets.find(s=>s.name===SH),S=sh.S,c=AN.hmiCtrls(S).find(x=>x.tag===T);const pk=c.amt&&S.rt.st[c.amt.id]?S.rt.st[c.amt.id].pk:c.autoLeg;return{man:pk!==c.autoLeg,mv:S.rt.v[c.out]}},[T,SH]);
await page.evaluate(()=>{AN.reset();AN.plantLoad150();AN.settle()});
const tabTxt=await page.evaluate(()=>[...document.querySelectorAll('#gsbar .tabs button')].map(b=>b.textContent).join(','));
ok(/PLANT VIEW/.test(tabTxt)&&!/OPERATE/.test(tabTxt),'tab name: '+tabTxt);
ok(await page.evaluate(()=>![...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Plant window')),'old Plant window button removed');
/* 1. tab mode (phone / tablet / Android, and this automated browser) */
await page.evaluate(()=>[...document.querySelectorAll('#gsbar .tabs button')].find(b=>/PLANT VIEW/.test(b.textContent)).click());await page.waitForTimeout(600);
ok(await page.evaluate(()=>{const w=document.getElementById('plantws');return !!w&&w.style.display==='grid'}),'tab mode: PLANT VIEW shows in the main window');
await page.evaluate(()=>[...document.querySelectorAll('#pllist button')].find(x=>x.dataset.id==='03').click());await page.waitForTimeout(1500);
/* a real click on the controller box of the graphic */
const clicked=await page.evaluate(T=>{const t=[...document.querySelectorAll('#plsvg text')].find(e=>e.textContent.trim()===T);if(!t)return 'no text';let g=t;while(g&&g.id!=='plsvg'){const h=[...(g.parentNode?g.parentNode.children:[])].find(x=>x.style&&x.style.cursor==='pointer'&&x.contains(t))||(g.style&&g.style.cursor==='pointer'?g:null);if(h){h.dispatchEvent(new MouseEvent('click',{bubbles:true}));return 'ok'}g=g.parentNode}const p=[...document.querySelectorAll('#plsvg *')].filter(x=>x.style&&x.style.cursor==='pointer');const r=t.getBoundingClientRect();const h=p.find(x=>{const b=x.getBoundingClientRect();return r.left>=b.left-2&&r.right<=b.right+2&&r.top>=b.top-2&&r.bottom<=b.bottom+2});if(h){h.dispatchEvent(new MouseEvent('click',{bubbles:true}));return 'ok'}return 'no hit'},T);
await page.waitForTimeout(400);
let fpTag=await page.evaluate(()=>{const f=document.getElementById('plfp');return f&&f.dataset.tag});
ok(fpTag===T,'click on '+T+' on the graphic opens its faceplate ('+clicked+', faceplate: '+fpTag+')');
if(fpTag!==T)await page.evaluate(T=>window.lsPlantFp(T),T);
const e0=await eng();
await page.click('#plfp button.ra.man');await page.waitForTimeout(400);
const e1=await eng();ok(!e0.man&&e1.man,'M on the faceplate: '+T+' goes MANUAL (engine A/M switch)');
await page.evaluate(()=>[...document.querySelectorAll('#plfp button.b')].find(b=>b.textContent.trim()==='50').click());await page.waitForTimeout(400);
const e2=await eng();ok(Math.abs(e2.mv-50)<0.6,'MV 50 on the faceplate: engine MV = '+(+e2.mv).toFixed(1));
await page.waitForTimeout(400);const shown=await page.evaluate(()=>{const f=document.getElementById('plfp');return /(^|\D)50\.0/.test(f.textContent)||[...f.querySelectorAll('input')].some(i=>Math.abs(+i.value-50)<0.6)});
ok(shown,'faceplate shows MV 50.0');
await page.click('#plfp button.ra:not(.man)');await page.waitForTimeout(400);
const e3=await eng();ok(!e3.man,'A on the faceplate: back to AUTO');
await page.evaluate(()=>[...document.querySelectorAll('#plfp .plfph button')].find(b=>b.textContent==='✕').click());
ok(await page.evaluate(()=>!document.getElementById('plfp')),'✕ closes the faceplate');
/* 2. PC mode: its own window */
await page.evaluate(()=>{window.LS_PVWIN=true;window.lsSetTab('logic')});
const [pop]=await Promise.all([page.waitForEvent('popup',{timeout:8000}),page.evaluate(()=>[...document.querySelectorAll('#gsbar .tabs button')].find(b=>/PLANT VIEW/.test(b.textContent)).click())]);
await pop.waitForTimeout(800);
ok(await pop.evaluate(()=>{const w=document.getElementById('plantws');return !!w&&getComputedStyle(w).display==='grid'&&w.getBoundingClientRect().height>300}),'PC: PLANT VIEW opens in its own window');
ok(await page.evaluate(()=>!document.getElementById('plantws')&&document.body.dataset.tab!=='operate'),'PC: the main window keeps its own tab (LOGIC)');
ok(await pop.evaluate(()=>document.querySelectorAll('#plsvg text').length>20),'PC window: the graphic is drawn');
await page.evaluate(T=>window.lsPlantFp(T),T);await pop.waitForTimeout(300);
ok(await pop.evaluate(T=>{const f=document.getElementById('plfp');return !!f&&f.dataset.tag===T},T),'PC window: faceplate opens in the window');
await pop.click('#plfp button.ra.man');await pop.waitForTimeout(400);
ok((await eng()).man,'PC window: M drives the same engine');
await pop.click('#plfp button.ra:not(.man)');await pop.waitForTimeout(300);
const r0=await page.evaluate(()=>!!(document.getElementById('stchip')||{}).textContent);
await pop.evaluate(()=>[...document.querySelectorAll('#pvbar>button')][0].click());await pop.waitForTimeout(1500);
const st=await pop.evaluate(()=>[...document.querySelectorAll('#pvbar .pvs')].map(x=>x.textContent).join(' | '));
const rn=await page.evaluate(()=>(document.querySelector('#stchip span')||{}).textContent||'');
ok(/^RUN/.test(rn)&&/RUN/.test(st),'PC window: Run button runs the simulation (main: '+rn+'; window bar: '+st+')');
await pop.evaluate(()=>[...document.querySelectorAll('#pvbar>button')][0].click());
await Promise.all([pop.waitForEvent('close',{timeout:5000}).catch(()=>null),pop.evaluate(()=>[...document.querySelectorAll('#pvbar>button')].find(b=>b.textContent==='Dock').click())]);
await page.waitForTimeout(600);
ok(await page.evaluate(()=>{const w=document.getElementById('plantws');return !!w&&w.style.display==='grid'&&document.body.dataset.tab==='operate'}),'Dock: PLANT VIEW back in the main window (tab)');
ok(pop.isClosed(),'Dock: the window is closed');
ok(!errs.length,'no page error'+(errs.length?': '+errs[0]:''));
console.log(fail?'FAIL':'ALL PASS');await browser.close();process.exit(fail?1:0)})();
