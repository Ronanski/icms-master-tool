// Light app and Inject (user 2026-11-07). The 007 motion stands paused and is stepped; no body :has rule; while a signal is forced a banner stands in
// every view; the banner releases it; what the loop check injected goes when the Split view closes. Usage: node tests/regress/light_inject.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
const wait=ms=>page.waitForTimeout(ms);
await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);document.getElementById('load150').click();await AN._startP;if(AN.view)AN.viewSet(false);lsPlant(true)});await wait(2500);
const a=await page.evaluate(async()=>{const s=document.getElementById('plsvg'),t0=s.getCurrentTime();await new Promise(r=>setTimeout(r,1200));const has=[];for(const ss of document.styleSheets){let R;try{R=ss.cssRules}catch(e){continue}for(const r of R)if(r.selectorText&&/body[^ ]*:(not\(:)?has/.test(r.selectorText))has.push(r.selectorText)}return {paused:s.animationsPaused(),t0,t1:s.getCurrentTime(),has,cls:document.body.classList.contains('dp-open')+','+document.body.classList.contains('side-open')}});
console.log(JSON.stringify(a));
ck(a.paused,'the SMIL clock is not free running');ck(a.t1>a.t0+0.5,'the flow still moves by steps: '+a.t0+' to '+a.t1);ck(a.has.length===0,'no body :has rule: '+a.has.join(' | '));
const force=()=>page.evaluate(()=>{const sh=AN.sheets.find(s=>s.name==='ABC-006'),b=sh.S.blk.find(q=>q.k==='ALM');AN.setForce(sh,b.i[0],123)});
await force();await wait(1500);
const bar=()=>page.evaluate(()=>{const b=document.getElementById('crfbar');return b&&!b.hidden&&b.getClientRects().length?b.innerText.replace(/\n/g,' '):''});
let t=await bar();ck(/1 signal FORCED/.test(t),'banner on the Plant view: '+t);
await page.evaluate(()=>lsSetTab('logic'));await wait(1200);ck(/FORCED/.test(await bar()),'banner on the Logic page');
await page.evaluate(()=>[...document.querySelectorAll('#crfbar button')].find(b=>b.textContent==='Release all').click());await wait(1500);
ck(!(await bar()),'Release all takes it away');
ck(await page.evaluate(()=>{const sh=AN.sheets.find(s=>s.name==='ABC-006');return Object.keys(sh.S.rt.force||{}).every(k=>sh.S.rt.pf&&sh.S.rt.pf[k])}),'no operator force left');
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
