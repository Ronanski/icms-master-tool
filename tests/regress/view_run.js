// 3.2.0-beta.9 VIEW | RUN, one rule (user 2026-10-23: "sa VIEW nagagawa mo lahat, maliban lang sa SIMULATE / FORCE / CONTROL").
// VIEW: the Inspector tabs, F(X) page, trend range work; FORCE, switches, A / M / R and the input values are locked (a press says
// "press RUN"). RUN: they work, the analog inputs are typed in the side Inputs list again (as in the 2.4.0 Inspector list), and
// the I/O list / F(X) buttons stay in the ribbon.
// Usage: node tests/regress/view_run.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));let f=0;const ck=(ok,t)=>{console.log((ok?'PASS ':'FAIL ')+t);if(!ok)f++};
await p.addInitScript(()=>{window.LS_HOME=false;window.LS_PVWIN=false;window.open=()=>null;try{localStorage.setItem('ls-tab','logic')}catch(e){}});
await p.goto('file://'+require('path').resolve(html));await p.waitForTimeout(2000);await p.evaluate(()=>AN.setCat('an'));await p.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54,null,{timeout:90000});await p.waitForTimeout(800);
await p.evaluate(()=>document.getElementById('load150').click());await p.waitForTimeout(2500);
await p.evaluate(()=>{lsSetTab('logic');AN.go(AN.sheets.findIndex(s=>s.name==='ABC-010'))});await p.waitForTimeout(1200);
const seg=async m=>{await p.evaluate(m=>[...document.querySelectorAll('#gsbar .seg button')][m].click(),m);await p.waitForTimeout(900)};
const tab=t=>p.evaluate(t=>{[...document.querySelectorAll('.hmitabs button')].find(b=>b.textContent.trim()===t&&b.getBoundingClientRect().width>0).click()},t);
const mode=tag=>p.evaluate(tag=>{const c=[...document.querySelectorAll('#opp .fp')].find(x=>x.textContent.includes(tag));if(!c)return null;const o=c.querySelector('.fpr button.on');return o?o.textContent.trim():null},tag);
await seg(0);
// tabs in VIEW
await tab('Faceplate');await p.waitForTimeout(400);
const t1=await p.evaluate(()=>[...document.querySelectorAll('.hmitabs button')].find(b=>b.classList.contains('on')&&b.getBoundingClientRect().width>0).textContent.trim());
await p.click('.hmitabs button:visible:has-text("Inspector")');await p.waitForTimeout(400);
const t2=await p.evaluate(()=>[...document.querySelectorAll('.hmitabs button')].find(b=>b.classList.contains('on')&&b.getBoundingClientRect().width>0).textContent.trim());
ck(t1==='Faceplate'&&t2==='Inspector','VIEW: the Inspector / Faceplate tabs switch with a real click ('+t1+' -> '+t2+')');
// F(X) page from the Inspector in VIEW
await p.evaluate(()=>{AN.go(AN.sheets.findIndex(s=>s.name==='ABC-004A'));const S=AN.sheets[AN.i].S;AN.sel={blk:S.blk.find(x=>x.k==='FX')};AN.panelUpd(true)});await p.waitForTimeout(500);
await p.click('#anp button:has-text("F(X) page")');await p.waitForTimeout(600);
ck(await p.evaluate(()=>document.getElementById('fxws').classList.contains('open')),'VIEW: "F(X) page" in the Inspector opens the F(X) curves page');
await p.evaluate(()=>document.getElementById('fxclose').click());
// FORCE locked in VIEW, with the message
const fi=await p.$('#anp .fc input');await fi.click();await p.keyboard.type('5');
const fv=await p.evaluate(()=>({v:document.querySelector('#anp .fc input').value,lock:document.querySelector('#anp .fc input').hasAttribute('data-vlock'),toast:(document.getElementById('lsvtoast')||{}).textContent||''}));
ck(fv.v===''&&fv.lock&&/Press RUN/.test(fv.toast),'VIEW: FORCE field locked (typed nothing), dashed, message "'+fv.toast+'"');
// A / M locked in VIEW on the faceplate
await p.evaluate(()=>{AN.go(AN.sheets.findIndex(s=>s.name==='ABC-010'));AN.sel=null;AN.panelUpd(true)});await p.waitForTimeout(500);await tab('Faceplate');await p.waitForTimeout(600);
const tg=await p.evaluate(()=>{for(const c of document.querySelectorAll('#opp .fp')){const on=c.querySelector('.fpr button.on'),o=[...c.querySelectorAll('.fpr button')].find(x=>x!==on&&!x.disabled&&/^[AM]$/.test(x.textContent.trim()));if(on&&o){const t=(c.querySelector('.fpt,.fph,b')||{}).textContent;return {i:[...document.querySelectorAll('#opp .fp')].indexOf(c),want:o.textContent.trim(),on:on.textContent.trim()}}}return null});
const fpBtn=()=>p.evaluateHandle(t=>{const c=document.querySelectorAll('#opp .fp')[t.i];c.scrollIntoView();return [...c.querySelectorAll('.fpr button')].find(x=>x.textContent.trim()===t.want)},tg);
const fpOn=()=>p.evaluate(t=>{const o=document.querySelectorAll('#opp .fp')[t.i].querySelector('.fpr button.on');return o?o.textContent.trim():null},tg);
await (await fpBtn()).click({force:true});await p.waitForTimeout(500);
ck(tg&&await fpOn()===tg.on,'VIEW: pressing '+(tg&&tg.want)+' on faceplate #'+(tg&&tg.i)+' does nothing (mode stays '+(tg&&tg.on)+')');
// side Inputs: the analog field is locked in VIEW
await p.evaluate(()=>[...document.querySelectorAll('#sidetabs button')].find(b=>/^Inputs/.test(b.textContent)).click());await p.waitForTimeout(600);
const ai0=await p.evaluate(()=>{const it=[...document.querySelectorAll('#inlist .ini')].find(x=>/AI0258/.test(x.textContent));return it&&it.querySelector('.inset')?it.querySelector('.inset').value:null});
ck(ai0!==null,'side Inputs list: AI0258 has a value field ('+ai0+')');
// RUN
await seg(1);await p.waitForTimeout(500);
await (await fpBtn()).click();await p.waitForTimeout(600);
ck(await fpOn()===tg.want,'RUN: pressing '+tg.want+' on the same faceplate works');
const sel='#inlist .ini:has-text("AI0258") .inset';await p.click(sel);await p.keyboard.press('Control+A');await p.keyboard.type('333');await p.keyboard.press('Enter');await p.waitForTimeout(800);
const ai=await p.evaluate(()=>{const S=AN.sheets[AN.i].S;const bl=S.blk.find(x=>x.k==='AI'&&x.tagAI==='AI0258');return bl?+S.rt.st[bl.id].val:null});
ck(ai!==null&&Math.abs(ai-333)<0.01,'RUN: typing 333 in the side Inputs list sets AI0258 = '+ai);
// all the groups of the 2.4.0 Inspector list are in the side Inputs list again: force M.3131 (ABC-007, signals to force) from there
await p.evaluate(()=>{AN.go(AN.sheets.findIndex(s=>s.name==='ABC-007'))});await p.waitForTimeout(1200);
const gr=await p.evaluate(()=>[...document.querySelectorAll('#inlist .ingh')].map(h=>h.textContent.replace(/ · \d+$/,'')).join(' | '));
ck(/DIGITAL/.test(gr)&&/ANALOG/.test(gr)&&/COS/.test(gr)&&/SETPOINTS/.test(gr)&&/TIMERS/.test(gr)&&/SIGNALS TO FORCE/.test(gr)&&/FROM OTHER SHEETS/.test(gr),'ABC-007 side Inputs groups: '+gr);
await p.fill('#inlist .inq','M.3131');await p.waitForTimeout(300);
const vis=await p.evaluate(()=>[...document.querySelectorAll('#inlist .ini')].filter(x=>x.style.display!=='none').map(x=>(x.querySelector('.tg,b')||{}).textContent));
await p.click('#inlist .inrow:has-text("M.3131") .fc button:has-text("1")');await p.waitForTimeout(800);
const m31=await p.evaluate(()=>{const S=AN.sheets[AN.i].S;const n=S.nets.findIndex((x,i)=>(AN.nm(S,i)||'').trim()==='M.3131');return {v:S.rt.v[n],f:S.rt.force[n]}});
ck(vis.some(t=>/^M\.3131/.test(t))&&m31.v===1&&m31.f===1,'filter "M.3131" shows '+vis.join(',')+'; FORCE 1 from the side list: value '+m31.v);
await p.click('#inlist .inrow:has-text("M.3131") .fc button:has-text("Release")');await p.waitForTimeout(600);
ck(await p.evaluate(()=>{const S=AN.sheets[AN.i].S;const n=S.nets.findIndex((x,i)=>(AN.nm(S,i)||'').trim()==='M.3131');return S.rt.force[n]===undefined}),'Release from the side list');
await p.fill('#inlist .inq','');
const rib=await p.evaluate(()=>['I/O list','F(X)'].map(t=>{const x=[...document.querySelectorAll('#gsbar button')].find(b=>b.textContent.trim()===t);return x&&x.getBoundingClientRect().width>0}));
ck(rib.every(Boolean),'RUN: I/O list and F(X) are in the ribbon');
// back to VIEW: the lock comes back
await seg(0);
ck(await p.evaluate(()=>document.body.classList.contains('lsview')&&!!document.querySelector('#opp [data-vlock]')),'VIEW again: the faceplate controls are locked again');
// Plant view faceplate in VIEW
await p.evaluate(()=>lsSetTab('operate'));await p.waitForTimeout(1000);await p.evaluate(()=>lsPlantFp('FICFA1071'));await p.waitForTimeout(600);
const pm0=await p.evaluate(()=>document.querySelector('#plfp .fpr button.on').textContent.trim());
await p.click('#plfp .fpr button:not(.on)');await p.waitForTimeout(500);
ck(await p.evaluate(()=>document.querySelector('#plfp .fpr button.on').textContent.trim())===pm0,'VIEW: Plant view faceplate FICFA1071 mode stays '+pm0);
ck(!errs.length,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(f?'FAILED '+f:'ALL PASS');await b.close();process.exit(f?1:0)})();
