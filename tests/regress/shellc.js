// 3.2.1 re-shell layout C (user approved mockup C and the build plan 2026-11-09): smoke test of the new layout behind ls-shell = c.
// Report only (PASS / FAIL lines). The page opens with localStorage ls-shell = c set before the load, at 1366 x 768. Checks: the start
// screen, 150 MW + Operator -> the overview, the 11 strip values (finite and drawn), each overview tile opens its page and the breadcrumb
// brings the overview back, the alarm list opens and Esc closes it, the Instructor console lists the practice sections, the Engineer
// button shows the tool rail and Library / Curves / Loop check open, a turbine trip from the Instructor gives the "Turbine trip · MFT"
// pill and the 2 unit rows of the alarm list, and without ls-shell there is no #scstrip. The plant steps as the app does: one
// AN.stepSet of ABC-001C (it steps every active sheet) and one WORLD.tick per 0.5 s. Usage: node tests/regress/shellc.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs'),path=require('path');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const url='file://'+path.resolve(html);
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium',args:(process.env.CHROME_ARGS||'').split(' ').filter(Boolean)});
let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const errs=[];const wait=ms=>new Promise(r=>setTimeout(r,ms));
/* one real click (Playwright moves the mouse to the element); a covered or missing element is a FAIL line, not a crash */
const click=async(page,sel,txt)=>{try{const l=txt?page.locator(sel,{hasText:typeof txt==='string'?new RegExp('^\\s*'+txt.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')):txt}).first():page.locator(sel).first();await l.click({timeout:8000});return true}catch(e){console.log('     click '+sel+(txt?' "'+txt+'"':'')+': '+String(e.message).split('\n')[0]);return false}};
const step=(page,sec)=>page.evaluate(sec=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');for(let k=0;k<sec*2;k++){AN.stepSet(C,.5);WORLD.tick(.5)}},sec);
try{
 const ctx=await browser.newContext({viewport:{width:1366,height:768}});
 await ctx.addInitScript(()=>{try{localStorage.setItem('ls-shell','c')}catch(e){}});
 const page=await ctx.newPage();page.on('pageerror',e=>errs.push(String(e.message)));
 await page.goto(url);
 /* 1. start screen, 150 MW + Operator -> the overview */
 let st=false;try{await page.waitForSelector('#scstart',{state:'visible',timeout:60000});st=true}catch(e){}
 ck(st,'start screen shows (#scstart)');
 await click(page,'#scstart .scchips button','150 MW');await click(page,'#scstart .sccard','Operator');
 let ov=false;try{await page.waitForFunction(()=>window.AN&&AN.startState&&window.DITL150&&DITL150.on&&!AN._loading&&document.body.classList.contains('scov'),null,{timeout:150000});ov=true}catch(e){}
 const s0=await page.evaluate(()=>({ss:AN.startState,tab:document.body.dataset.tab,tiles:document.querySelectorAll('#scov .sctile:not(.scalm)').length,shown:!!(document.getElementById('scov')&&document.getElementById('scov').offsetHeight)}));
 ck(ov&&s0.shown&&s0.tiles===9,'150 MW + Operator: '+s0.ss+', overview shown '+s0.shown+', '+s0.tiles+' system tiles (tab '+s0.tab+')');
 /* 2. the 11 strip values: finite and drawn */
 await step(page,10);await wait(1600);
 const v=await page.evaluate(()=>[...document.querySelectorAll('#scstrip .sck')].map(c=>({n:(c.querySelector('i')||{}).textContent,t:(c.querySelector('b')||{}).textContent,h:c.offsetHeight,bh:(c.querySelector('b')||{}).offsetHeight||0})));
 const badV=v.filter(x=>!isFinite(parseFloat(String(x.t).replace('−','-')))||!(x.h>0)||!(x.bh>0));
 ck(v.length===11&&!badV.length,'strip: '+v.length+' values, finite and drawn'+(badV.length?' · bad: '+badV.map(x=>x.n+'='+x.t+' h'+x.h).join(', '):' ('+v.map(x=>x.t).join(' | ')+')'));
 /* 3. each tile opens its page; the breadcrumb brings the overview back */
 const T=await page.evaluate(()=>[...document.querySelectorAll('#scov .sctile:not(.scalm) h3')].map(h=>h.textContent));
 for(let i=0;i<T.length;i++){
  const ok1=await click(page,'#scov .sctile:not(.scalm)',T[i]);await wait(1500);
  const a=await page.evaluate(()=>({tab:document.body.dataset.tab,ov:document.body.classList.contains('scov'),pg:(document.querySelector('#plantws .plpick')||{}).value,ws:!!(document.getElementById('plantws')&&document.getElementById('plantws').offsetHeight),cr:(document.querySelector('.sccrumb')||{}).offsetHeight||0}));
  const ok2=a.cr>0&&await click(page,'.sccrumb');await wait(700);
  const b=await page.evaluate(()=>document.body.classList.contains('scov'));
  ck(ok1&&a.tab==='operate'&&!a.ov&&a.ws&&ok2&&b,'tile "'+T[i]+'" -> page '+a.pg+' (tab '+a.tab+', page shown '+a.ws+'), breadcrumb back to the overview '+b);
 }
 /* 4. alarm list: opens from the strip, Esc closes it */
 await click(page,'#scstrip .pill',/alarm/);await wait(600);
 const al1=await page.evaluate(()=>{const a=document.getElementById('scal');return !!a&&!a.hidden&&a.offsetHeight>0});
 await page.keyboard.press('Escape');await wait(400);
 const al2=await page.evaluate(()=>{const a=document.getElementById('scal');return !!a&&a.hidden});
 ck(al1&&al2,'alarm list opens from the strip ('+al1+') and Esc closes it ('+al2+')');
 /* 5. Instructor console with the practice sections */
 await click(page,'#scstrip .pill.ins');await wait(600);
 const ins=await page.evaluate(()=>{const c=document.getElementById('scins');if(!c||c.hidden)return{open:false};const h=[...c.querySelectorAll('*')].find(e=>e.children.length===0&&e.textContent.trim()==='Practice sections');const r=h&&(h.nextElementSibling||h.parentElement.nextElementSibling);return{open:c.offsetHeight>0,n:r?r.querySelectorAll('button').length:0,names:r?[...r.querySelectorAll('button')].map(b=>b.textContent).slice(0,3):[]}});
 ck(ins.open&&ins.n>0,'Instructor console opens and lists '+(ins.n||0)+' practice sections ('+(ins.names||[]).join(' | ')+')');
 await page.keyboard.press('Escape');await wait(300);
 /* 6. Engineer: the tool rail; Library, Curves, Loop check open */
 await click(page,'#scstrip .seg button','Engineer');await wait(2500);
 const e0=await page.evaluate(()=>({sceng:document.body.classList.contains('sceng'),rail:(document.getElementById('scetools')||{}).offsetHeight||0,tools:[...document.querySelectorAll('#scetools button')].map(b=>b.textContent)}));
 ck(e0.sceng&&e0.rail>0&&e0.tools.length===6,'Engineer: tool rail shown ('+e0.tools.join(', ')+')');
 const tool=async(t,f)=>{await click(page,'#scetools button',t);await wait(1500);return page.evaluate(f)};
 ck(await tool('Library',()=>{const w=document.getElementById('libws');return document.body.classList.contains('scet-lib')&&!!w&&getComputedStyle(w).display!=='none'&&w.offsetWidth>0}),'Engineer: Library opens in the right pane');
 ck(await tool('Curves',()=>{const w=document.getElementById('fxws');return document.body.classList.contains('scet-fx')&&!!w&&w.classList.contains('open')&&w.offsetWidth>0}),'Engineer: Curves opens in the right pane');
 ck(await tool('Loop check',()=>{const w=document.getElementById('lcdock');return document.body.classList.contains('scet-loop')&&!!w&&!w.hidden&&w.offsetWidth>0&&document.body.dataset.tab==='logic'}),'Engineer: Loop check opens in the right pane (stays in Engineer)');
 ck(await tool('Logic side by side',()=>document.body.classList.contains('scet-logic')&&(document.getElementById('plantws')||{}).offsetWidth>0&&(document.getElementById('mid')||{}).offsetWidth>0),'Engineer: Logic side by side, plant page and sheet both shown');
 /* 7. turbine trip from the Instructor: the pill and the 2 unit rows */
 await click(page,'#scstrip .pill.ins');await wait(500);
 /* exact text: the practice section "Turbine trip and hot restart" is a button of the same console */
 await click(page,'#scins button',/^\s*Turbine trip\s*$/);await wait(200);await click(page,'#scins button',/^\s*Press again: Turbine trip\s*$/);await wait(300);
 await page.keyboard.press('Escape');
 await step(page,30);await wait(1600);
 const tr=await page.evaluate(()=>({pill:(document.querySelector('#scstrip .pill.trip')||{}).textContent||'',st:AN.unit&&AN.unit.tb&&AN.unit.tb.st,rows:window.lsShellC&&lsShellC.alarms?lsShellC.alarms().filter(a=>a.unit).map(a=>a.nm):[]}));
 await click(page,'#scstrip .pill','Turbine trip');await wait(700);
 const shown=await page.evaluate(()=>[...document.querySelectorAll('#scal .scrow')].map(r=>r.textContent).filter(t=>/TURBINE TRIP \(ABC-050|MASTER FUEL TRIP \(MFT/.test(t)).length);
 ck(/Turbine trip · MFT/.test(tr.pill)&&tr.rows.length===2&&shown===2,'turbine trip from the Instructor: pill "'+tr.pill.trim()+'" (turbine '+tr.st+'), unit rows '+tr.rows.length+' ('+tr.rows.join(' | ')+'), in the alarm list '+shown);
 ck(!errs.length,'no page error (ls-shell = c) '+errs.slice(0,3).join(' | '));
 await ctx.close();
 /* 8. without ls-shell: the old layout, no #scstrip */
 const ctx2=await browser.newContext({viewport:{width:1366,height:768}});const p2=await ctx2.newPage();const e2=[];p2.on('pageerror',e=>e2.push(String(e.message)));
 await p2.goto(url);await wait(8000);
 const old=await p2.evaluate(()=>({strip:!!document.getElementById('scstrip'),sc:document.body.classList.contains('sc'),band:!!document.getElementById('crband')}));
 ck(!old.strip&&!old.sc&&old.band,'without ls-shell: no #scstrip, no body.sc, the old band is there ('+old.band+')');
 ck(!e2.length,'no page error (old layout) '+e2.slice(0,3).join(' | '));
 await ctx2.close();
}catch(e){console.log('ERROR '+String(e&&e.stack||e).split('\n').slice(0,3).join(' | '));fail++}
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
