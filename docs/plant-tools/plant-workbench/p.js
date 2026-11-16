const {chromium}=require('playwright');const fs=require('fs');const FAKE=fs.readFileSync('t.js','utf8').match(/const FAKE=`([\s\S]*?)`;/)[1];
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,tag] of [[1280,900,'pc'],[400,860,'ph']]){const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(FAKE);
 await p.goto('file:///mnt/project-files/plant-workbench/plant-workbench.html#performance');await p.waitForTimeout(500);if(w<720)await p.click('#fbox summary');
 await p.fill('#f-mwh','3000');await p.fill('#f-hrs','24');await p.fill('#f-coal','1800');await p.fill('#f-hv','4450');await p.fill('#f-trips','1');await p.click('#savebtn');await p.waitForTimeout(400);
 console.log(tag,await p.locator('#chipbox').textContent(),'|',await p.locator('.row .meta').first().textContent(),'| ov',await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));
 await p.screenshot({path:'perf-'+tag+'.png',fullPage:true})}
console.log(errs);await b.close()})();
