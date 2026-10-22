// Operator panel overview + force list (1.23.0): one card per controller; a click shows only that faceplate and its force
// list; FORCE 0 of the force-manual signal makes AUTO possible; release (×) brings the drawing value back.
// Usage: node tests/regress/overview.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(()=>{AN.go(AN.sheets.findIndex(s=>s.name==='ABC-010'));[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Faceplate').forEach(b=>b.click());AN.run=true});
await page.waitForSelector('.fpov .ovc',{timeout:20000});
const n=await page.evaluate(()=>document.querySelectorAll('.fpov .ovc').length);ck(n===4,'ABC-010: '+n+' controller cards');
await page.evaluate(()=>[...document.querySelectorAll('.fpov .ovc')].find(x=>x.dataset.t==='FICFW1007').click());await page.waitForTimeout(800);
const vis=await page.evaluate(()=>[...document.querySelectorAll('#opp .fp')].filter(f=>f.querySelector('.tg b')&&f.style.display!=='none').map(f=>f.querySelector('.tg b').textContent));
ck(vis.length===1&&vis[0]==='FICFW1007','only the chosen faceplate shows: '+vis.join(','));
const rows=await page.evaluate(()=>[...document.querySelectorAll('.fpov .ovf tr')].map(r=>r.querySelector('b').textContent));
ck(rows.includes('M.0228'),'force list: '+rows.join(', '));
const aOff=()=>page.evaluate(()=>{const f=[...document.querySelectorAll('#opp .fp')].find(x=>x.querySelector('.tg b')&&x.querySelector('.tg b').textContent==='FICFW1007');const b=[...f.querySelectorAll('button')].find(e=>e.textContent==='A');return b.disabled});
ck(await aOff(),'before: AUTO disabled (M.0228 = 1, force manual of the drawing)');
await page.evaluate(()=>{const r=[...document.querySelectorAll('.fpov .ovf tr')].find(x=>x.querySelector('b').textContent==='M.0228');[...r.querySelectorAll('button')].find(b=>b.textContent==='0').click()});
await page.waitForTimeout(1500);
const f1=await page.evaluate(()=>{const S=AN.sheets[AN.i].S;const n=S.nets.findIndex((x,k)=>AN.nm(S,k)==='M.0228');return {f:S.rt.force[n],v:S.rt.v[n]}});
ck(f1.f===0&&f1.v===0,'FORCE 0 on M.0228: forced '+f1.f+', value '+f1.v);
ck(!(await aOff()),'AUTO is enabled while M.0228 is forced to 0');
await page.evaluate(()=>{const r=[...document.querySelectorAll('.fpov .ovf tr')].find(x=>x.querySelector('b').textContent==='M.0228');[...r.querySelectorAll('button')].find(b=>b.textContent==='×').click()});
await page.waitForTimeout(1500);
const f2=await page.evaluate(()=>{const S=AN.sheets[AN.i].S;const n=S.nets.findIndex((x,k)=>AN.nm(S,k)==='M.0228');return {f:S.rt.force[n],v:S.rt.v[n]}});
ck(f2.f===undefined&&f2.v===1,'release: back to the drawing value '+f2.v);
await page.evaluate(()=>document.querySelector('.fpov .ovh .b').click());await page.waitForTimeout(500);
ck(await page.evaluate(()=>[...document.querySelectorAll('#opp .fp')].filter(f=>f.querySelector('.tg b')&&f.style.display!=='none').length===4),'"Lahat" shows the 4 faceplates again');
ck(errs.length===0,'no page error'+(errs.length?' ('+errs[0]+')':''));
await browser.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
