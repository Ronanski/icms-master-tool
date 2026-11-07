// Mina F57, F50: the diesel oil step with the operator's clicks, Worker: the top button leads to the controls, M and the arrows of the dock move HICDO1012.
// Usage: node tests/regress/guide_step31.js [html]
const {open}=require('./lib.js');const fs=require('fs'),url=require('url'),path=require('path');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.goto(url.pathToFileURL(path.resolve(html)).href+'?worker=1');await page.waitForTimeout(2500);await page.evaluate(()=>AN.setCat('an'));
await page.waitForFunction(()=>window.ENG&&(ENG.mode==='mirror'||ENG.err),null,{timeout:120000});
await page.evaluate(()=>{lsSetTab('training')});await page.waitForTimeout(800);
await page.evaluate(()=>[...document.querySelectorAll('#trainws button.trbtn')].find(x=>/^Guide/.test(x.textContent)).click());
await page.waitForFunction(()=>LS_GUIDE.on&&document.getElementById('gdock')&&!ENG.heavy,null,{timeout:60000});await page.waitForTimeout(1500);
const idx=await page.evaluate(()=>LS_GUIDE.steps().findIndex(s=>/^Diesel oil pump and oil/.test(s.t)));console.log('step',idx+1);
console.log(await page.evaluate(()=>JSON.stringify({on:LS_GUIDE.on,cur:LS_GUIDE.cur})));
await page.evaluate(i=>{LS_GUIDE.open(i);AN.runOn&&AN.runOn()},idx);await page.waitForTimeout(3000);
const top=await page.evaluate(()=>[...document.querySelectorAll('#gdock button')].filter(b=>b.offsetParent).map(b=>b.textContent).filter(t=>/Open the controls|Open faceplate/.test(t)));
ck(top.some(t=>/Open the controls/.test(t)),'top button: '+top.join(' | '));
const clickT=async re=>{const b=await page.evaluate(s=>{const R=new RegExp(s);const e=[...document.querySelectorAll('#gdock button')].find(x=>x.offsetParent&&R.test(x.textContent));if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},re);if(b)await page.mouse.click(b[0],b[1]);return !!b};
ck(await clickT('Open the controls'),'click it');await page.waitForTimeout(800);
const row=()=>page.evaluate(()=>{const r=[...document.querySelectorAll('#gdock .gd-ctl')].find(x=>/HICDO1012/.test(x.textContent)&&x.offsetParent);if(!r)return null;r.scrollIntoView({block:'center'});const B=[...r.querySelectorAll('button')].map(b=>{const q=b.getBoundingClientRect();return [b.textContent,q.x+q.width/2,q.y+q.height/2,b.disabled]});return {B,mv:[...r.querySelectorAll('.gd-v b')].map(x=>x.textContent).pop()}});
let R=await row();ck(!!R,'HICDO1012 row in the dock');
if(R){const p=async t=>{const b=(await row()).B.find(x=>x[0]===t);await page.mouse.click(b[1],b[2]);await page.waitForTimeout(700)};
 await p('M');for(let i=0;i<3;i++)await p('▲▲');await page.waitForTimeout(2500);R=await row();ck(parseFloat(R.mv)>=10,'three ▲▲ moved HICDO1012: '+R.mv)}
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})().catch(e=>{console.log('ERR',String(e).slice(0,300));process.exit(1)});
