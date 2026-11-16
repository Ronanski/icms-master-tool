const {chromium}=require('playwright');
const FAKE=`window.__S={};window.__subs=[];let n=0;
const fire=()=>window.__subs.forEach(([c,f])=>f({docs:Object.entries(window.__S[c]||{}).map(([id,d])=>({id,data:()=>d}))}));
const col=c=>({limit(){return this},doc(id){id=id||('d'+(++n));return{id,async set(d){(window.__S[c]=window.__S[c]||{})[id]=d;setTimeout(fire)},async update(d){Object.assign(window.__S[c][id],d);setTimeout(fire)},async delete(){delete window.__S[c][id];setTimeout(fire)}}},onSnapshot(f){window.__subs.push([c,f]);setTimeout(fire)}});
window.claude={use:async n=>n==='db'?{collection:col}:null};`;
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,tag] of [[1280,900,'pc'],[400,860,'ph']]){const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(tag+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(tag+' console: '+m.text())});
 await p.addInitScript(FAKE);await p.goto('file:///mnt/project-files/plant-workbench/plant-workbench.html');await p.waitForTimeout(600);
 // shift log
 if(w<720)await p.click('#fbox summary');await p.fill('#f-text','Feeder 2 tripped on overload, restarted after check.');await p.fill('#f-by','Operator A');await p.selectOption('#f-status','Open');await p.click('#savebtn');await p.waitForTimeout(300);
 await p.screenshot({path:tag+'-shift.png',fullPage:true});
 // work orders
 await p.goto('file:///mnt/project-files/plant-workbench/plant-workbench.html#work-orders');await p.waitForTimeout(400);
 if(w<720)await p.click('#fbox summary');await p.fill('#f-title','Check transmitter impulse line');await p.fill('#f-tag','PT-BR1001-1');await p.selectOption('#f-kind','Preventive');await p.fill('#f-due','2026-11-01');await p.fill('#f-repeat','90');await p.click('#savebtn');await p.waitForTimeout(300);
 await p.click('button[data-act=quick]:has-text("Mark done")');await p.waitForTimeout(400);
 const wo=await p.evaluate(()=>Object.values(window.__S.workorders).map(r=>r.status+'|'+r.due+'|'+(r.doneOn||'')));console.log(tag,'WO',wo);
 await p.screenshot({path:tag+'-wo.png',fullPage:true});
 // calibration
 await p.goto('file:///mnt/project-files/plant-workbench/plant-workbench.html#calibration');await p.waitForTimeout(400);
 if(w<720)await p.click('#fbox summary');await p.fill('#f-tag','PT-BR1001-1');await p.dispatchEvent('#f-tag','change');await p.fill('#f-tol','0.5');
 const vals=[0,62.5,127,187.5,250];for(let i=0;i<5;i++){await p.fill('#af-'+i,String(vals[i]));await p.fill('#al-'+i,String([0,62.5,125,187.5,250][i]))}
 console.log(tag,'range',await p.inputValue('#f-lo'),await p.inputValue('#f-hi'),await p.inputValue('#f-unit'),await p.inputValue('#f-desc'));
 await p.click('#savebtn');await p.waitForTimeout(300);console.log(tag,'pill',await p.locator('.row .pill').first().textContent(),await p.locator('.chips').textContent());
 await p.screenshot({path:tag+'-cal.png',fullPage:true});
 // parts
 await p.goto('file:///mnt/project-files/plant-workbench/plant-workbench.html#spare-parts');await p.waitForTimeout(400);
 if(w<720)await p.click('#fbox summary');await p.fill('#f-name','Pressure transmitter');await p.fill('#f-qty','2');await p.fill('#f-min','1');await p.click('#savebtn');await p.waitForTimeout(300);await p.click('button:has-text("− 1")');await p.waitForTimeout(300);
 console.log(tag,'parts',await p.locator('.row').first().textContent());
 // trip
 await p.goto('file:///mnt/project-files/plant-workbench/plant-workbench.html#trip-analyzer');await p.waitForTimeout(400);
 await p.fill('#t-title','Test list');await p.fill('#t-text','10:15:03.120 B event\n10:15:02.345 A first event\nno time line\n2026-11-16 10:15:04 C event');await p.click('#tfrm button[type=submit]');await p.waitForTimeout(300);
 console.log(tag,'trip',await p.locator('.card').nth(1).locator('p').first().textContent());await p.click('button[data-act=tripsave]');await p.waitForTimeout(400);
 await p.screenshot({path:tag+'-trip.png',fullPage:true});
 await p.goto('file:///mnt/project-files/plant-workbench/plant-workbench.html#reports');await p.waitForTimeout(400);
 console.log(tag,'report\n'+await p.locator('#reptext').textContent());
 await p.screenshot({path:tag+'-rep.png',fullPage:true});
 console.log(tag,'overflow',await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));
 await p.close()}
console.log('ERRS',errs);await b.close()})();
