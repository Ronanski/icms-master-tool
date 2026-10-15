// DITL page toolbar (1.22.0): the ABC toolbar is hidden on the DITL page, the DITL buttons are grouped (Simulate / Fit / Live in view,
// editor tools in "⋯ Tools"), every button still works, and the ABC page is unchanged. Desktop, tablet and phone.
// Usage: node tests/regress/ditl_toolbar.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
for(const [n,w,h] of [['desktop',1440,900],['tablet',1024,768],['phone',390,844]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h}});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{try{localStorage.setItem('ditl.cat','dig')}catch(e){}});
 await page.goto('file://'+require('path').resolve(html));
 await page.waitForFunction(()=>document.getElementById('bar')&&document.getElementById('bar').dataset.shell,null,{timeout:20000});
 const vis=id=>page.evaluate(id=>{const e=document.getElementById(id);return !!e&&e.offsetParent!==null&&e.offsetHeight>0},id);
 ck(!(await vis('anbar')),n+': ABC toolbar is not shown on the DITL page');
 const barH=await page.evaluate(()=>document.getElementById('bar').offsetHeight);
 ck(barH<=(n==='phone'?110:70),n+': DITL toolbar height '+barH+' px');
 ck(await vis('bmode'),n+': Simulate button in view');
 ck(await vis('bfit'),n+': Fit in view');
 ck(!(await vis('bdel'))&&!(await vis('bclr')),n+': Delete sheet / Clear cells are inside Tools (hidden until opened)');
 // Simulate toggles the DITL mode
 const t0=await page.textContent('#bmode');await page.click('#bmode');const t1=await page.textContent('#bmode');
 const sim=await page.evaluate(()=>typeof SIM!=='undefined'&&SIM);
 ck(/Simulate/.test(t0)&&/Edit/.test(t1)&&sim===true,n+': '+t0.trim()+' -> '+t1.trim()+' (SIM='+sim+')');
 await page.click('#bmode');ck(await page.evaluate(()=>SIM===false),n+': back to Edit');
 // Tools menu opens and Health works from it
 if(n==='phone'){await page.click('#mbtn2');}
 await page.click('#bar .tb-more>button');ck(await vis('bhp'),n+': Tools menu shows Health');
 await page.click('#bhp');await page.waitForTimeout(300);
 ck(await page.evaluate(()=>!document.getElementById('hp').hidden&&/sheets/.test(document.getElementById('hp').textContent)),n+': Health panel opens ('+(await page.evaluate(()=>document.getElementById('hp').textContent.slice(0,60)))+')');
 await page.evaluate(()=>{const c=document.getElementById('hpc');if(c)c.click()});
 // switch to ABC: the ABC toolbar comes back, the DITL toolbar goes
 await page.evaluate(()=>document.body.classList.add('mmenu'));
 await page.click('#bar .cat button:nth-child(2)');
 await page.waitForFunction(()=>document.body.classList.contains('an'),null,{timeout:20000});await page.waitForTimeout(500);
 ck(await vis('anbar')&&!(await vis('bar')),n+': ABC page shows the ABC toolbar only');
 ck(errs.length===0,n+': no page error'+(errs.length?' ('+errs[0]+')':''));
 await ctx.close();
}
await browser.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
