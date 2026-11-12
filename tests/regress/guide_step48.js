// Mina F62: Step "Start the air heater soot blowing" with the operator's click on the dock button, Worker, at x1, x60 and x300. The 3 s forward starter must end the step.
// Also the Check chip says "not done" before, and the page read of a drawing output (dock pout) gives the engine's net.
// Usage: node tests/regress/guide_step48.js [html]
const {open}=require('./lib.js');const fs=require('fs'),url=require('url'),path=require('path');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.goto(url.pathToFileURL(path.resolve(html)).href+'?worker=1');await page.waitForTimeout(2500);await page.evaluate(()=>AN.setCat('an'));
await page.waitForFunction(()=>window.ENG&&(ENG.mode==='mirror'||ENG.err),null,{timeout:120000});
await page.evaluate(()=>{lsSetTab('training')});await page.waitForTimeout(800);
await page.evaluate(()=>[...document.querySelectorAll('#trainws button.trbtn')].find(x=>/^Guide/.test(x.textContent)).click());
await page.waitForFunction(()=>LS_GUIDE.on&&document.getElementById('gdock')&&!ENG.heavy,null,{timeout:60000});await page.waitForTimeout(1500);
const idx=await page.evaluate(()=>LS_GUIDE.steps().findIndex(s=>/^Start the air heater soot blowing/.test(s.t)));console.log('step',idx+1);
const clickT=async re=>{const b=await page.evaluate(s=>{const R=new RegExp(s);const e=[...document.querySelectorAll('#gdock button')].find(x=>x.offsetParent&&!x.disabled&&R.test(x.textContent));if(!e)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},re);if(b)await page.mouse.click(b[0],b[1]);return !!b};
/* the two steps before, by click: lances retracted (field), plant air selected */
await page.evaluate(i=>{LS_GUIDE.open(i);AN.runOn&&AN.runOn()},idx-1);await page.waitForTimeout(1200);
ck(await clickT('S/B SELECT PLANT AIR'),'click S/B SELECT PLANT AIR');await page.waitForTimeout(1500);
await page.evaluate(i=>{LS_GUIDE.open(i)},idx-2);await page.waitForTimeout(1200);
await clickT('^2Field');await page.waitForTimeout(600);console.log(await page.evaluate(()=>[...document.querySelectorAll('#gdock button')].filter(x=>x.offsetParent).map(x=>x.textContent.trim().slice(0,40)).filter(t=>/FIELD|lance/i.test(t))));ck(await clickT('lances retracted'),'click lances retracted');await page.waitForTimeout(1500);
console.log('rows',await page.evaluate(()=>{const K=S.sheets.find(x=>/DITL-80K$/.test(x.name));return [4,8,19].map(r=>DUI.rowVal(K,r))}));
for(const sp of [1,60,300]){
 await page.evaluate(i=>{WORLD.pulseClear();LS_GUIDE.aphSbReset&&LS_GUIDE.aphSbReset();LS_GUIDE.open(i);AN.runOn&&AN.runOn()},idx);await page.waitForTimeout(600);
 await page.evaluate(sp=>{AN.spd=sp;DUI.rowVal&&0;const K=S.sheets.find(x=>/DITL-80K$/.test(x.name));},sp);await page.waitForTimeout(2500);
 const pre=await page.evaluate(()=>({aph:LS_GUIDE.aphSb(),cur:LS_GUIDE.cur,chips:[...document.querySelectorAll('#gdock *')].filter(e=>e.children.length==0&&/^not done$/.test(e.textContent)&&e.offsetParent).length}));
 ck(pre.cur===idx&&!pre.aph,'x'+sp+': step open, not started yet');if(sp===1)ck(pre.chips>0,'Check chip says not done');
 for(const t of ['Start','Lineup'])await page.evaluate(t=>{const e=[...document.querySelectorAll('#gdock *')].find(x=>x.children.length<3&&x.textContent.trim().startsWith(t)&&x.offsetParent&&x.tagName==='BUTTON');if(e&&t==='Start')e.click()},t);await page.waitForTimeout(300);
 await clickT('^FIELD: to REMOTE');await page.waitForTimeout(800);await clickT('^2Control room');await page.waitForTimeout(500);if(sp===1)console.log(await page.evaluate(()=>[...document.querySelectorAll('#gdock button')].filter(x=>x.offsetParent).map(x=>x.textContent.trim().slice(0,40)+(x.disabled?' [dis]':''))));ck(await clickT('^APH S/B START'),'x'+sp+': click APH S/B START');
 let done=false;for(let i=0;i<40&&!done;i++){await page.waitForTimeout(500);done=await page.evaluate(i=>LS_GUIDE.aphSb()&&(LS_GUIDE.cur>i||LS_GUIDE.stepOk(LS_GUIDE.steps()[i])),idx)}
 ck(done,'x'+sp+': the step ended, '+await page.evaluate(()=>JSON.stringify({cur:LS_GUIDE.cur,seen:WORLD.seen,t:AN.plantT()})));
 await page.evaluate(()=>{AN.spd=1});await page.waitForTimeout(sp===1?3500:500);/* the 3 s pulse ends before the next round clears the latch */
}
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})().catch(e=>{console.log('ERR',String(e).slice(0,300));process.exit(1)});
