// 2.4.1-beta.7: LOGIC page layout. Top bar [VIEW | Run] ▶▶ ⏱ (step back / step size / speed / Reset in the ⏱ menu), drawing tools
// (Fit / Zoom / Values / Wire) on the drawing, right panel with tabs on ABC and DITL, VIEW keeps the panel readable (no fading).
// The same buttons as before (moved, same handlers): Run here = SIM. Usage: node tests/regress/layout.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=require('path').resolve(process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x)));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let f=0;const ck=(c,t)=>{console.log((c?'PASS ':'FAIL ')+t);if(!c)f++};
for(const [n,w,h] of [['desktop',1440,900],['phone',390,844]]){
const p=await b.newPage({viewport:{width:w,height:h},isMobile:w<500,hasTouch:w<500});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+html);await p.waitForTimeout(1500);await p.evaluate(()=>AN.setCat('an'));await p.waitForFunction(()=>window.AN&&AN.sheets&&AN.sheets.length>=54&&window.lsSetTab&&window.LO,null,{timeout:90000});
await p.evaluate(()=>{AN.setCat('an');lsSetTab('logic');AN.go(AN.sheets.findIndex(s=>/ABC-010/.test(s.name)))});await p.waitForTimeout(1500);
const vis=s=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.offsetHeight>0&&getComputedStyle(e).visibility!=='hidden'},s);
const bar=await p.evaluate(()=>{const g=document.querySelector('#gsbar .g-run');const seg=g.querySelector('.lo-seg');return {seg:seg&&[...seg.children].map(x=>x.textContent.trim()),tm:!!g.querySelector('.lo-tm'),loose:[...g.querySelectorAll(':scope > button, :scope > select, :scope > span > button')].filter(x=>x.offsetHeight).map(x=>x.textContent.trim())}});
ck(bar.seg&&/^VIEW$/.test(bar.seg[0])&&/Run|Pause/.test(bar.seg[1])&&bar.tm,n+': ABC top bar = [VIEW | Run] + ⏱ ('+JSON.stringify(bar)+')');
const menu=await p.evaluate(()=>[...document.querySelectorAll('.lo-pop')].map(m=>[...m.querySelectorAll('.lo-row span')].map(s=>s.textContent)));
ck(menu.some(m=>m.join()==='Step back,Step size,Speed,Start again'),n+': ⏱ menu holds Step back / Step size / Speed / Start again');
ck(await vis('#lotools .lo-an')&&!(await vis('#gsbar .g-view')),n+': Fit / Zoom / Values / Wire on the drawing, not in the top bar');
await p.evaluate(()=>[...document.querySelectorAll('#gsbar .lo-tm')].find(x=>x.offsetHeight).click());await p.waitForTimeout(200);
const reset=await p.evaluate(()=>{const m=document.querySelector('.lo-pop.open');const r=m&&[...m.querySelectorAll('button')].find(x=>/^Reset$/.test(x.textContent.trim()));return !!r&&r.offsetHeight>0});
ck(reset,n+': ⏱ opens and Reset is there');await p.mouse.click(5,h-60);
// VIEW: no fading, banner
await p.evaluate(()=>{if(!AN.view)[...document.querySelectorAll('#gsbar .g-run .lo-seg button')][0].click()});await p.waitForTimeout(400);
const vw=await p.evaluate(()=>{const a=document.getElementById('anp');const i=a&&[...a.querySelectorAll('input,select')].find(x=>x.offsetHeight);return {view:document.body.classList.contains('anview'),op:i?getComputedStyle(i).opacity:'none',ban:a?getComputedStyle(a,'::before').content:''}});
ck(vw.view&&vw.op==='1'&&/locked/.test(vw.ban),n+': VIEW keeps panel inputs readable (opacity '+vw.op+') with the locked banner');
// Run via the segment
await p.evaluate(()=>[...document.querySelectorAll('#gsbar .g-run .lo-seg button')][1].click());await p.waitForTimeout(800);
ck(await p.evaluate(()=>!AN.view),n+': Run in the switch starts the simulation');
// ABC tabs
const tabs=await p.evaluate(()=>[...document.querySelectorAll('#anp .lo-tabs button')].map(x=>x.textContent));
ck(tabs.join()==='Selected,Inputs,Timers,Controllers,Forced,Operator',n+': ABC panel tabs '+tabs.join(' / '));
const secs=async k=>{await p.evaluate(k=>LO.setAn(k),k);await p.waitForTimeout(250);return p.evaluate(()=>[...document.querySelectorAll('#anlists > details')].filter(d=>d.offsetHeight).map(d=>d.dataset.k))};
const si=await secs('in'),sp=await secs('pid'),ss=await secs('sel');
ck(si.length>0&&si.every(k=>k==='in'),n+': Inputs tab shows only input lists ('+si.length+')');
ck(sp.length===1&&sp[0]==='pid',n+': Controllers tab shows the controllers');
ck(ss.length===0&&await vis('#ansel'),n+': Selected tab shows the selected block box');
// DITL
await p.evaluate(()=>{try{localStorage.setItem('ditl.dp','1')}catch(e){}[...document.querySelectorAll('#gsbar .sub button')].find(x=>x.textContent.trim()==='DITL').click()});
await p.waitForFunction(()=>!document.body.classList.contains('an'),null,{timeout:20000});await p.waitForTimeout(1200);
const dseg=await p.evaluate(()=>{const s=document.querySelector('#gsbar .g-ditl .lo-seg');return s&&s.offsetHeight>0&&[...s.children].map(x=>x.textContent.trim())});
ck(dseg&&/^VIEW$/.test(dseg[0]),n+': DITL top bar = [VIEW | Run] ('+dseg+')');
ck(await vis('#lotools .lo-di #bfit')&&!(await vis('#lotools .lo-an')),n+': DITL Fit / Zoom on the drawing');
if(!(await p.evaluate(()=>{const d=document.getElementById('dp');return !!d&&d.offsetHeight>0}))){await p.evaluate(()=>{const t=document.getElementById('dptab');t&&t.click()});await p.waitForTimeout(400)}
const dt=await p.evaluate(()=>[...document.querySelectorAll('#dp .lo-tabs button')].map(x=>x.textContent));
ck(dt.join()==='Inputs,Timers,Valves,Outputs',n+': DITL panel tabs '+dt.join(' / '));
const drows=async k=>{await p.evaluate(k=>LO.setDi(k),k);await p.waitForTimeout(250);return p.evaluate(()=>[...document.querySelectorAll('#dp .dp-r')].filter(d=>d.offsetHeight).map(d=>d.dataset.k))};
const di=await drows('in');ck(di.every(k=>k==='in'),n+': DITL Inputs tab shows only inputs ('+di.length+' rows)');
const dto=await drows('out');ck(dto.every(k=>k==='out'),n+': DITL Outputs tab shows only outputs ('+dto.length+' rows)');
ck(errs.length===0,n+': no page error'+(errs.length?' ('+errs[0]+')':''));await p.close()}
await b.close();console.log(f?f+' FAIL':'ALL PASS');process.exit(f?1:0)})();
