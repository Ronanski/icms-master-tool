const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,tag] of [[1280,900,'pc'],[400,860,'ph']]){const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///mnt/project-files/plant-workbench/connection-lessons.html');await p.waitForTimeout(500);
 let ov=0;for(let k=0;k<12;k++){await p.click('#b-lost');ov=Math.max(ov,await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));const n=await p.locator('.opts button').count();if(n!==4)errs.push('opts '+k+' '+n);if(k==2){await p.locator('.opts button').first().click();await p.screenshot({path:'cl-'+tag+'.png',fullPage:true})}await p.click('#next')}
 console.log(tag,'overflow',ov)}
console.log(errs);await b.close()})();
