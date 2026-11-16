const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [w,tag] of [[1280,'pc'],[400,'ph']]){const p=await b.newPage({viewport:{width:w,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///mnt/project-files/tutor-2026-11-11/signal-path-finder.html');await p.waitForTimeout(600);
await p.screenshot({path:`/tmp/claude-0/tr2/ff-${tag}-0.png`});
const ks=await p.$$eval('#ff [data-k]',e=>e.map(x=>x.dataset.k));console.log(tag,'rows',ks.join(','));
const vals={real:'13.8'};ks.filter(k=>k!=='real').forEach((k,i,a)=>vals[k]=i===a.length-1?'18':'13.8');
for(const k of ks){await p.fill(`#ff [data-k="${k}"]`,vals[k])}
await p.waitForTimeout(200);console.log(await p.$eval('#ffv',e=>e.innerText));
await p.fill('#ffv [data-m="0"]','16.27').catch(e=>console.log('no m input'));await p.waitForTimeout(100);
console.log(await p.$eval('#ffv',e=>e.innerText.split('\n').slice(-3).join(' / ')));
const box=await p.$('#ff');await box.screenshot({path:`/tmp/claude-0/tr2/ff-${tag}-1.png`});
console.log('sus cells',await p.$$eval('.cell.sus',e=>e.length),'errs',errs);
// digital
await p.fill('#q','XV-FW1111-1');await p.press('#q','Enter');await p.waitForTimeout(300);
const k2=await p.$$eval('#ff [data-k]',e=>e.map(x=>x.dataset.k));console.log('XV rows',k2);
await p.selectOption(`#ff [data-k="${k2[0]}"]`,'ON');await p.selectOption(`#ff [data-k="real"]`,'OFF');await p.waitForTimeout(100);
console.log(await p.$eval('#ffv',e=>e.innerText.slice(0,400)));console.log('errs',errs)}
await b.close()})();
