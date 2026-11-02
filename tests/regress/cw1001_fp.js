// Mina's retest step 8 (PR-OPE-5002 7.20 "Open Expansion tank outlet valve to prime the close cooling line (V-CW1001)"): on the
// 027 CLOSED COOLING WATER page a click on V-CW1001 opens its floating field-valve faceplate (fp-pop.js FIELDV, #57). Before, the
// valve was a plain grey symbol and the click did nothing. Checks (cold plant, RUN): the click opens the pop-out named V-CW1001;
// it shows CLOSED (cold start state, unit.js AN_SRC.field.cw1001 = false) and the valve symbol is green; OPEN in the pop-out sets
// the field valve (AN.fieldState().cw1001), logs "Field operator" in Events and turns the symbol red; the dock key 'F:cw1001'
// opens the same pop-out; XV-MU1109 on the same page still opens its own valve pop-out.
// Usage: node tests/regress/cw1001_fp.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);await AN.plantCold();if(AN.view)AN.viewSet(false);AN.run=true});
await page.evaluate(()=>lsPlant(true));await page.waitForTimeout(1500);
await page.evaluate(()=>document.querySelector('#pllist button[data-id="CW"]').click());await page.waitForTimeout(2500);
const title=()=>page.evaluate(()=>{const x=document.getElementById('fpop');return x&&x.isConnected?x.querySelector('.fpo-tt b').textContent:null});
const fill=()=>page.evaluate(()=>{const e=document.querySelector('[data-vl="CW1001"]');return e?e.getAttribute('fill'):null});
ck(await page.evaluate(()=>!!document.querySelector('[data-hit="CW1001"]')),'027: V-CW1001 is a clickable item');
await page.locator('[data-hit="CW1001"]').first().click();await page.waitForTimeout(800);
const t1=await title();ck(t1==='V-CW1001','click on V-CW1001 opens its pop-out faceplate (title '+t1+')');
const st=await page.evaluate(()=>({fs:!!AN.fieldState().cw1001,val:(document.querySelector('#fpop .fpo-hv')||{}).textContent||''}));
ck(!st.fs&&/CLOSED/.test(st.val),'cold plant: the pop-out shows CLOSED ('+st.val.trim()+')');
await page.waitForTimeout(700);ck(await fill()==='#3fa34d','cold plant: the V-CW1001 symbol is green (closed): '+await fill());
const op=await page.evaluate(async()=>{if(AN.view)AN.viewSet(false);AN.run=true;await new Promise(r=>setTimeout(r,700));const b=[...document.querySelectorAll('#fpop button')].find(x=>x.textContent==='OPEN');if(!b||b.disabled)return {err:'OPEN '+(b?'disabled':'missing')};b.click();await new Promise(r=>setTimeout(r,1200));
 return {fs:!!AN.fieldState().cw1001,ev:(window.lsEvents||[]).slice(-3).map(e=>e.text).join(' | ')}});
ck(op.fs===true,'OPEN in the pop-out opens the field valve'+(op.err?' ('+op.err+')':''));
ck(/Field operator: OPEN V-CW1001/.test(op.ev||''),'Events: "Field operator: OPEN V-CW1001" ('+(op.ev||'')+')');
await page.waitForTimeout(700);ck(await fill()==='#d64545','after OPEN the V-CW1001 symbol is red (open): '+await fill());
await page.evaluate(()=>LS_FPOP.close());await page.waitForTimeout(300);
await page.evaluate(()=>LS_FPREG['F:cw1001'].open());await page.waitForTimeout(800);
ck(await title()==='V-CW1001','the dock key F:cw1001 opens the same pop-out');
await page.evaluate(()=>LS_FPOP.close());await page.waitForTimeout(300);
await page.locator('[data-hit="XV"]').first().click();await page.waitForTimeout(800);
const t2=await title();ck(!!t2&&/XV-MU1109/.test(t2),'XV-MU1109 on 027 still opens its own pop-out (title '+t2+')');
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
