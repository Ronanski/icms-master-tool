// 3.2.0-beta.83 (user 2026-11-03 "Pano mamonitor mga major parameters ng plant?" -> "G lahat"): the unit band on top (Control Room
// shell, 900 px and up) shows the major values of the plant: LOAD, MSP, DRUM LVL, FW FLOW + FURNACE PRESS, O2, MAIN STEAM TEMP,
// BED TEMP, VACUUM. Checks at 150 MW (plant model ON, RUN): all nine have a number, near the 150 MW snapshot (4.PNG / UNIT screen);
// all nine fit in the band at 1366 and 1920 px (none cut off); screenshots to the scratch folder given as 2nd arg; no page error.
// Usage: node tests/regress/band_major.js [html] [shotdir]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const shot=process.argv.slice(2).find(a=>!/\.html$/.test(a));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1920,height:1000});
await page.waitForFunction(()=>window.AN&&AN.sheets&&AN.sheets.length>=54&&AN.loadStart&&document.getElementById('load150'),null,{timeout:120000});
await page.evaluate(()=>{const d=document.getElementById('lsask');if(d)d.remove();document.getElementById('load150').click()});
await page.waitForFunction(()=>AN.startState==='plantLoad150',null,{timeout:180000});
await page.evaluate(()=>{if(AN.viewSet)AN.viewSet(false);AN.run=true});await page.waitForTimeout(5000);
const read=()=>page.evaluate(()=>[...document.querySelectorAll('#crband .crkpi')].map(b=>{const r=b.getBoundingClientRect(),p=b.parentElement.getBoundingClientRect(),u=b.querySelector('small').getBoundingClientRect();return {k:b.querySelector('i').textContent,v:b.querySelector('b').textContent,u:(b.querySelector('small')||{}).textContent,in:r.width>0&&r.right<=p.right+1&&r.left>=p.left-1&&u.right<=r.right+1&&r.bottom<=p.bottom+1}}));
const others=()=>page.evaluate(()=>['#cralarm','#crband .seg'].every(s=>{const e=document.querySelector(s);if(!e)return true;const r=e.getBoundingClientRect();return r.width>0&&r.right<=innerWidth-(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gdw'))||0)*(document.documentElement.classList.contains('gd-side')?1:0)+1}));
let K=await read();console.log(K.map(k=>k.k+' '+k.v+' '+k.u).join(' | '));
const want={LOAD:[140,160],MSP:[110,135],'DRUM LVL':[-150,150],'FW FLOW':[400,520],'FURNACE PRESS':[-60,20],O2:[1,8],'MAIN STEAM TEMP':[520,560],'BED TEMP':[750,950],VACUUM:[90,100.1]};
ck(K.length===9,'nine values in the band ('+K.length+')');
for(const k in want){const x=K.find(z=>z.k===k),n=x?parseFloat(x.v):NaN;ck(isFinite(n)&&n>=want[k][0]&&n<=want[k][1],k+' = '+(x?x.v:'missing')+' (150 MW: '+want[k].join(' ~ ')+')')}
for(const [w,side] of [[1920,0],[1366,0],[1920,1],[1366,1],[1280,1]]){await page.setViewportSize({width:w,height:900});
 /* side = the Training dock open beside the app (dock.css gd-side, 440 / 380 px) */
 await page.evaluate(([side,w])=>{const R=document.documentElement;R.classList.toggle('gd-side',!!side);R.style.setProperty('--gdw',(w>=1300?440:380)+'px')},[side,w]);await page.waitForTimeout(800);K=await read();
 const nm=w+' px'+(side?' with the Training dock':''),cut=K.filter(k=>!k.in).map(k=>k.k);ck(K.length===9&&!cut.length,nm+': all nine values shown whole'+(cut.length?': cut '+cut.join(', '):''));
 ck(await others(),nm+': the alarm banner and VIEW | RUN still on the screen');
 if(shot)await page.screenshot({path:shot+'/band-'+w+(side?'-dock':'')+'.png',clip:{x:0,y:0,width:w,height:130}});}
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
