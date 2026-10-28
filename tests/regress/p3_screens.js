// 3.2.0-beta.4 (P3 of the Control Room redesign, UI only): PLANT VIEW frame (graphic full width, ☰ Systems drawer, screen picker
// ◀ / list / ▶ and chips, faceplate docked at the right with the same zoom), DITL panel ((S22)DITL-80S output text from the label of
// its own wire, PDF output 57 = "... TORQUE"; the timer card does not cover the panel, "Edit presets" shows it; the group titles of
// the sheet list do not pile up) and the ABC Inspector (comes from / goes to). Usage: node tests/regress/p3_screens.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=require('path').resolve(process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x)));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let f=0;const ck=(c,t)=>{console.log((c?'PASS ':'FAIL ')+t);if(!c)f++};
const p=await b.newPage({viewport:{width:1333,height:833}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.open=()=>null});
await p.goto('file://'+html);await p.waitForTimeout(2500);await p.evaluate(()=>AN.setCat('an'));
await p.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&document.body.classList.contains('cr'),null,{timeout:90000});
/* ---- PLANT VIEW ---- */
await p.evaluate(()=>lsSetTab('operate'));await p.waitForTimeout(2000);
const fr=await p.evaluate(()=>{const ws=document.getElementById('plantws'),l=document.getElementById('plleft'),sv=document.getElementById('plsvg');return {crw:ws.classList.contains('crw'),list:getComputedStyle(l).display,svw:Math.round(sv.getBoundingClientRect().width),wsw:Math.round(ws.getBoundingClientRect().width),chips:[...ws.querySelectorAll('.plchip')].map(c=>c.textContent).join(','),opts:ws.querySelector('.plpick').options.length,items:document.querySelectorAll('#pllist button').length}});
ck(fr.crw&&fr.list==='none'&&fr.svw>=fr.wsw-2,'graphic uses the whole width, the system list is closed ('+fr.svw+' / '+fr.wsw+' px)');
ck(fr.opts===fr.items&&/^UNIT,003 Water,004 Extraction,007 Air,011 Coal,033 CCS$/.test(fr.chips),'screen picker lists '+fr.opts+' screens; chips '+fr.chips);
const cur=()=>p.evaluate(()=>({pick:document.querySelector('#plantws .plpick').value,on:(document.querySelector('#pllist button.on')||{}).dataset?.id,title:document.getElementById('pltitle').textContent}));
await p.evaluate(()=>[...document.querySelectorAll('#plantws .plchip')].find(c=>c.dataset.id==='04').click());await p.waitForTimeout(1200);
let c1=await cur();ck(c1.pick==='04'&&c1.on==='04'&&/004/.test(c1.title),'chip 004 Extraction opens 004 ('+c1.title+')');
await p.click('#plantws .plstep >> nth=1');await p.waitForTimeout(1200);c1=await cur();
ck(c1.pick===c1.on&&c1.on!=='04','▶ opens the next screen ('+c1.title+')');
await p.click('#plantws .plstep >> nth=0');await p.waitForTimeout(1200);c1=await cur();ck(c1.on==='04','◀ goes back to 004');
await p.selectOption('#plantws .plpick','03');await p.waitForTimeout(1200);c1=await cur();ck(c1.on==='03','the list opens 003');
await p.click('#plsys');await p.waitForTimeout(300);
ck(await p.evaluate(()=>getComputedStyle(document.getElementById('plleft')).display!=='none'),'☰ Systems opens the system list');
await p.evaluate(()=>[...document.querySelectorAll('#pllist button')].find(x=>x.dataset.id==='UNIT').click());await p.waitForTimeout(1200);
ck(await p.evaluate(()=>getComputedStyle(document.getElementById('plleft')).display==='none'&&document.querySelector('#plantws .plpick').value==='UNIT'),'a system in the list opens it and closes the list');
const vb0=await p.evaluate(()=>{const s=document.getElementById('plsvg');return [s.getAttribute('viewBox').split(' ').map(Number),s.getBoundingClientRect().width]});
await p.evaluate(()=>lsPlantFp('PICMS1006'));await p.waitForTimeout(800);
const dk=await p.evaluate(()=>{const f=document.getElementById('plfp'),s=document.getElementById('plsvg');const r=f.getBoundingClientRect();return {par:f.parentNode.id,right:Math.round(r.right),top:Math.round(r.top),h:Math.round(r.height),svw:s.getBoundingClientRect().width,svr:s.getBoundingClientRect().right,l:r.left,vb:s.getAttribute('viewBox').split(' ').map(Number)}});
ck(dk.par==='plantws'&&dk.right>=1331&&dk.h>500&&dk.svr<=dk.l+1,'faceplate docked at the right, full height, beside the graphic ('+Math.round(dk.l)+'..'+dk.right+', '+dk.h+' px high)');
const sc0=vb0[0][2]/vb0[1],sc1=dk.vb[2]/dk.svw;
ck(Math.abs(sc0-sc1)/sc0<0.01&&Math.abs(dk.vb[0]-vb0[0][0])<0.5,'same zoom when the faceplate opens (scale '+sc0.toFixed(3)+' -> '+sc1.toFixed(3)+')');
await p.evaluate(()=>[...document.querySelectorAll('#plfp .plfph button')].find(b=>b.textContent==='✕').click());await p.waitForTimeout(500);
ck(await p.evaluate(()=>!document.getElementById('plfp')&&Math.abs(document.getElementById('plsvg').getBoundingClientRect().width-document.getElementById('plantws').getBoundingClientRect().width)<3),'✕ closes it, the graphic is full width again');
/* narrow window: the old frame (list on the left, pop-up faceplate) */
await p.setViewportSize({width:820,height:1000});await p.waitForTimeout(800);
await p.evaluate(()=>lsPlantFp('PICMS1006'));await p.waitForTimeout(500);
ck(await p.evaluate(()=>!document.getElementById('plantws').classList.contains('crw')&&document.getElementById('plfp').parentNode.id==='plmid'&&getComputedStyle(document.getElementById('plleft')).display!=='none'),'820 px: list on the left, faceplate pops up over the graphic (as before)');
await p.evaluate(()=>[...document.querySelectorAll('#plfp .plfph button')].find(b=>b.textContent==='✕').click());
await p.setViewportSize({width:1280,height:800});await p.waitForTimeout(800);
/* ---- DITL ---- */
await p.evaluate(()=>{lsSetTab('logic');[...document.querySelectorAll('.sub button')].find(x=>/DITL/.test(x.textContent)).click()});await p.waitForTimeout(1500);
await p.evaluate(()=>{const i=S.sheets.findIndex(x=>/^\(S22\)DITL-80S$/.test(x.name));const s=document.getElementById('shsel');s.value=i;s.onchange({target:s})});await p.waitForTimeout(1500);
const tab=t=>p.evaluate(t=>[...document.querySelectorAll('button')].find(x=>x.offsetParent&&x.textContent.trim()===t).click(),t);
await tab('Outputs');await p.waitForTimeout(500);
const outs=await p.evaluate(()=>[...document.querySelectorAll('#dp .dp-r')].filter(x=>x.offsetParent).map(r=>r.textContent));
const o57=outs.find(t=>/row 57|57/.test(t)&&/TORQUE/.test(t)),o58=outs.find(t=>/TRIP$|TRIP\b/.test(t)&&!/TORQUE/.test(t));
ck(outs.some(t=>/MOTOR VALVE TORQUE/.test(t))&&outs.some(t=>/MOTOR VALVE REMOTE SELECTED/.test(t))&&!outs.some(t=>/^FULL CLOSED|SELECTED S\/B/.test(t)),'(S22)DITL-80S outputs read like the PDF: '+outs.filter(t=>/TORQUE|REMOTE/.test(t)).map(t=>t.slice(0,60)).join(' | '));
ck(await p.evaluate(()=>{const t=document.getElementById('tp');return !t||t.hidden||getComputedStyle(t).display==='none'}),'the timer card does not cover the drawing or the panel while the panel is open');
await tab('Timers');await p.waitForTimeout(400);await tab('Edit presets');await p.waitForTimeout(500);
const tp=await p.evaluate(()=>{const t=document.getElementById('tp'),d=document.getElementById('dp');const r=t.getBoundingClientRect();return {vis:getComputedStyle(t).display!=='none',right:r.right,dl:d.getBoundingClientRect().left,inp:t.querySelectorAll('input').length}});
ck(tp.vis&&tp.right<=tp.dl+1&&tp.inp>=1,'Edit presets: the preset card opens beside the panel ('+tp.inp+' presets)');
await tab('Hide presets');await p.waitForTimeout(300);
const gh=await p.evaluate(()=>{const H=[...document.querySelectorAll('#sidelist .fhc')];return {n:H.length,pos:H.length?getComputedStyle(H[0]).position:'-'}});
ck(gh.n===0||gh.pos==='static','sheet list group titles scroll with the list (no pile-up): '+gh.n+' groups, position '+gh.pos);
/* ---- ABC Inspector ---- */
await p.evaluate(()=>[...document.querySelectorAll('.sub button')].find(x=>/ABC/.test(x.textContent)).click());await p.waitForTimeout(800);
await p.evaluate(()=>AN.go(AN.sheets.findIndex(s=>s.name==='ABC-010')));await p.waitForTimeout(1500);
await p.evaluate(()=>[...document.querySelectorAll('button')].find(x=>x.offsetParent&&/^Fit$/.test(x.textContent.trim())).click());await p.waitForTimeout(600);
const tgt=await p.evaluate(()=>{const S=AN.sheets[AN.i].S,b=S.blk.find(b=>b.k==='PID'&&b.tag==='FICFW1007');const g=[...document.querySelectorAll('#svg text, svg text')].find(t=>t.textContent.trim()==='FICFW1007');if(!g)return null;const r=g.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}});
if(tgt)await p.mouse.click(tgt.x,tgt.y);await p.waitForTimeout(700);
const ins=await p.evaluate(()=>{const c=document.getElementById('selcard');return c?[...c.querySelectorAll('.scl')].map(x=>x.textContent.replace(/\s+/g,' ').trim()):[]});
ck(ins.length===2&&/^COMES FROM/.test(ins[0])&&/^GOES TO/.test(ins[1]),'Inspector shows where the block signals come from and go to: '+ins.join(' / '));
ck(errs.length===0,'no page error'+(errs.length?' ('+errs[0]+')':''));
await b.close();console.log(f?f+' FAIL':'ALL PASS');process.exit(f?1:0)})();
