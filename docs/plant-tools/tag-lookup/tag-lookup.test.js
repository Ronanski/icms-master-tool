const {chromium}=require('playwright');
const FAKE=`window.claude={use:async n=>n==='sample'?(async(inp,o)=>{window.__P=inp;o&&o.onText&&o.onText({text:'partial'});return{text:'ANSWER for: '+inp.split('Question: ')[1],truncated:false}}):null};`;
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,tag] of [[1280,900,'pc'],[400,860,'ph']]){const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(tag+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(tag+' console: '+m.text())});
 await p.addInitScript(FAKE);await p.goto('file:///mnt/project-files/plant-workbench/tag-lookup.html');await p.waitForTimeout(500);
 console.log(tag,'count0',await p.textContent('#count'));
 await p.screenshot({path:tag+'-0.png'});
 await p.fill('#q','drum pressure');await p.waitForTimeout(300);console.log(tag,'count',await p.textContent('#count'));
 await p.click('.hit >> nth=0');await p.waitForTimeout(300);
 console.log(tag,'card',(await p.textContent('#cardbox')).replace(/\s+/g,' ').slice(0,900));
 await p.click('button[data-q] >> nth=1');await p.waitForTimeout(300);console.log(tag,'ans',await p.textContent('#ans'));
 console.log(tag,'prompt has card',await p.evaluate(()=>/PT-BR1001-1/.test(window.__P)&&/6ATB101/.test(window.__P)));
 await p.screenshot({path:tag+'-1.png',fullPage:true});
 console.log(tag,'overflow',await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'hash',await p.evaluate(()=>location.hash));
 if(w<820){await p.click('#back');await p.waitForTimeout(200)}
 // a DI with source arrow, no logic
 await p.fill('#q','I.0005');await p.selectOption('#fs','101');await p.waitForTimeout(300);await p.click('.hit >> nth=0');await p.waitForTimeout(200);
 console.log(tag,'DI',(await p.textContent('#cardbox')).replace(/\s+/g,' ').slice(0,700));
 await p.screenshot({path:tag+'-2.png',fullPage:true});
 if(w<820){await p.click('#back');await p.waitForTimeout(200)}
 await p.fill('#q','GCP-AI1001');await p.selectOption('#fs','');await p.waitForTimeout(300);await p.click('.hit >> nth=0');await p.waitForTimeout(200);
 await p.screenshot({path:tag+'-3.png',fullPage:true});
 if(w<820){await p.click('#back');await p.waitForTimeout(200)}
 await p.fill('#q','zzzz');await p.waitForTimeout(300);console.log(tag,'empty',await p.textContent('#hits'));
 await p.fill('#q','');await p.selectOption('#fl','y');await p.waitForTimeout(300);console.log(tag,'logic y',await p.textContent('#count'));
 await p.click('#more');console.log(tag,'hits',await p.locator('.hit').count());
 // sweep all cards for render errors + overflow
 const bad=await p.evaluate(()=>{let n=0,und=0;for(let i=0;i<R.length;i++){cur=i;drawCard();const t=document.getElementById('cardbox').textContent;if(/undefined|null|NaN/.test(t))und++;if(document.documentElement.scrollWidth>innerWidth)n++}return [n,und]});
 console.log(tag,'sweep overflow/undefined',bad);
 // deep link
 await p.goto('file:///mnt/project-files/plant-workbench/tag-lookup.html#AI0128-101');await p.waitForTimeout(400);console.log(tag,'deeplink',await p.textContent('.head .tag'));
 await p.close()}
// no-sample case
const p=await b.newPage();await p.goto('file:///mnt/project-files/plant-workbench/tag-lookup.html#AI0128-101');await p.waitForTimeout(400);console.log('nosample hidden',await p.evaluate(()=>document.getElementById('askbox').hidden));
// dark
const q=await b.newPage({viewport:{width:1280,height:900},colorScheme:'dark'});await q.goto('file:///mnt/project-files/plant-workbench/tag-lookup.html#AI0128-101');await q.waitForTimeout(600);await q.screenshot({path:'dark.png'});
console.log('ERRS',errs);await b.close()})();
