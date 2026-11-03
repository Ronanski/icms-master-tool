// User 2026-11-03: TEMPORARY HMI pages (hmi-temp.js) so the live test goes on past Step 16 (PR-OPE-5002, Cold -> 150 MW). Checks (cold
// plant, RUN): the eight TEMP pages are in the Plant view list and draw their step cards; every motor of a Training step in their
// sections is on a page and shows a run state; a click on a motor opens its floating faceplate (fp-pop.js); a click on a controller
// box opens its faceplate (line drawing + live text, no colour: user 2026-11-03) (plant.js fpOpen); a DCS push button of a drawing (DITL-38 MV-FW1391 OPEN, Step 27) works from the page; no
// page error.
// Usage: node tests/regress/temp_hmi.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.waitForFunction(()=>window.LS_GUIDE&&window.LS_DOCK&&window.LS_LIVE,null,{timeout:60000});
await page.evaluate(async()=>{if(AN.plantColdAsync)await AN.plantColdAsync();else AN.plantCold();if(AN.view)AN.viewSet(false);AN.run=true});
await page.evaluate(()=>lsPlant(true));await page.waitForTimeout(2000);
const ids=await page.evaluate(()=>[...document.querySelectorAll('#pllist button')].map(b=>b.dataset.id).filter(x=>/^T[A-Z]{2}$/.test(x)));
ck(ids.length===8,'8 TEMP pages in the Plant view list ('+ids.join(', ')+')');
const go=id=>page.evaluate(id=>document.querySelector('#pllist button[data-id="'+id+'"]').click(),id);
const seen=new Set();let empty=[];
for(const id of ids){await go(id);await page.waitForTimeout(1200);
 const r=await page.evaluate(()=>({cards:document.querySelectorAll('.tmpg-mot,.tmpg-ctl,.tmpg-pb').length,mot:[...document.querySelectorAll('.tmpg-mot')].map(b=>[b.dataset.ad,b.querySelector('[data-st]').textContent])}));
 if(!r.cards)empty.push(id);for(const [ad,st] of r.mot)if(/^(RUN|STOP|TRIP)/.test(st))seen.add(ad);}
ck(!empty.length,'every TEMP page draws its step equipment'+(empty.length?': empty '+empty.join(','):''));
const need=await page.evaluate(()=>{const secs=[18,19,20,21,22,23,24,25,26,27,28,14,30,31,33,35,41,42,44,47],o=new Set();for(const s of LS_GUIDE.steps())if(secs.includes(s.sec))for(const a of s.a||[])if(a.ad&&!a.dg&&/^START /.test(a.l||''))o.add(a.ad);return [...o]});
const miss=need.filter(a=>!seen.has(a));
ck(need.length>0&&!miss.length,'every motor of those Training steps is on a TEMP page with its run state ('+need.length+')'+(miss.length?': missing '+miss.join(','):''));
await go('TCF');await page.waitForTimeout(1200);
await page.locator('.tmpg-mot[data-ad="M.3350"]').click();await page.waitForTimeout(800);
const t1=await page.evaluate(()=>{const x=document.getElementById('fpop');return x&&x.isConnected?x.querySelector('.fpo-tt b').textContent:null});
ck(!!t1&&/CEP-A|P-1116A|CONDENSATE/i.test(t1),'click on CEP-A opens its floating faceplate ('+t1+')');
await page.evaluate(()=>window.LS_FPOP&&LS_FPOP.close());
await page.locator('.tmpg-ctl').first().click();await page.waitForTimeout(800);
const t2=await page.evaluate(()=>{const x=document.getElementById('plfp');return x?x.dataset.tag:null});
ck(!!t2,'click on a controller box opens its faceplate ('+t2+')');
const pb=await page.evaluate(async()=>{const b=[...document.querySelectorAll('.tmpg-pb')].find(x=>/MV-FW1391 OPEN/.test(x.textContent));if(!b)return 'no button';b.dispatchEvent(new MouseEvent('click'));await new Promise(r=>setTimeout(r,800));return 'ok'});
ck(pb==='ok','Step 27: the DCS P.B. MV-FW1391 OPEN (DITL-38) is pressed from the page');
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
