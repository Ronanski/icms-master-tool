// Search info card (1.23.0): an address typed in the global search + Enter opens a card made from the netlist:
// where it comes from, who reads it, what it reaches (force manual / trip / TO DITL / other sheets). Read only.
// Usage: node tests/regress/infocard.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const card=async q=>{await page.fill('#ansb',q);await page.press('#ansb','Enter');await page.waitForTimeout(1200);return page.evaluate(()=>{const c=document.getElementById('infocard');return c?c.innerText:''})};
let t=await card('M.0228');
ck(/FEED WATER CONTROL FORCE MANUAL/.test(t),'M.0228: description from the memory list');
ck(/kinukuwenta dito ng OR/.test(t)&&/2 block/.test(t),'M.0228: computed by an OR, read by 2 blocks');
ck(/FORCE MANUAL ng FICFW1007/.test(t),'M.0228: reaches the force manual of FICFW1007');
t=await card('M.3410');
ck(/4 sa ABC/.test(t),'M.3410: 4 places in the ABC');
ck(/galing sa ABC-004A/.test(t),'M.3410 on ABC-029 / 003A: comes from ABC-004A (link)');
ck(/FORCE MANUAL ng HS-COAL/.test(t)&&/TO DITL DITL 07-05/.test(t),'M.3410: force manual of HS-COAL, TO DITL 07-05');
const v0=await page.evaluate(()=>JSON.stringify(AN.sheets.filter(s=>s.S).map(s=>Object.keys(s.S.rt.force).length)));
await page.evaluate(()=>{const b=[...document.querySelectorAll('#infocard .b')].find(x=>x.textContent==='✕');b&&b.click()});
ck(await page.evaluate(()=>!document.getElementById('infocard')),'✕ closes the card');
ck(v0===await page.evaluate(()=>JSON.stringify(AN.sheets.filter(s=>s.S).map(s=>Object.keys(s.S.rt.force).length))),'read only: no force added');
ck(errs.length===0,'no page error'+(errs.length?' ('+errs[0]+')':''));
await browser.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
