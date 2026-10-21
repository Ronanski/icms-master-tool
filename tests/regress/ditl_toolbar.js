// New shell (2.4.0): on the LOGIC tab the DITL page shows Simulate / Fit in the top bar, the old ABC and DITL toolbars are hidden,
// the editor tools live in the TOOLS tab, every button still works, and switching to ABC brings the ABC groups back. Desktop, tablet, phone.
// Usage: node tests/regress/ditl_toolbar.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
for(const [n,w,h] of [['desktop',1440,900],['tablet',1024,768],['phone',390,844]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h}});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{try{localStorage.setItem('ditl.cat','dig');localStorage.setItem('ls-tab','logic')}catch(e){}});
 await page.goto('file://'+require('path').resolve(html));
 await page.waitForFunction(()=>document.body.classList.contains('app2')&&document.getElementById('bar')&&document.getElementById('bar').dataset.shell,null,{timeout:20000});
 await page.waitForFunction(()=>!document.body.classList.contains('an'),null,{timeout:20000});await page.waitForTimeout(500);
 const vis=id=>page.evaluate(id=>{const e=document.getElementById(id);return !!e&&e.offsetParent!==null&&e.offsetHeight>0},id);
 ck(!(await vis('anbar'))&&!(await vis('bar')),n+': old ABC / DITL toolbars are not shown');
 const gsH=await page.evaluate(()=>document.getElementById('gsbar').offsetHeight);
 ck(gsH<=(n==='phone'?150:110),n+': top bar + ribbon height '+gsH+' px');
 ck(await page.evaluate(()=>document.body.dataset.tab==='logic'),n+': LOGIC tab');
 ck(await vis('bmode')&&await page.evaluate(()=>!!document.getElementById('bmode').closest('#gsbar .g-ditl')),n+': Simulate button in the top bar');
 ck(await vis('bfit'),n+': Fit in view');
 ck(!(await vis('bdel'))&&!(await vis('bclr')),n+': Delete sheet / Clear cells not in the top bar (TOOLS tab)');
 // Simulate toggles the DITL mode
 const t0=await page.textContent('#bmode');await page.evaluate(()=>document.getElementById('bmode').click());const t1=await page.textContent('#bmode');
 const sim=await page.evaluate(()=>typeof SIM!=='undefined'&&SIM);
 ck(/Run/.test(t0)&&/Stop/.test(t1)&&sim===true,n+': '+t0.trim()+' -> '+t1.trim()+' (SIM='+sim+')');
 await page.evaluate(()=>document.getElementById('bmode').click());ck(await page.evaluate(()=>SIM===false),n+': back to Edit');
 // TOOLS tab shows the editor tools and Health works from it
 await page.evaluate(()=>[...document.querySelectorAll('#gsbar .tabs button')].find(b=>/TOOLS/i.test(b.textContent)).click());await page.waitForTimeout(600);
 ck(await vis('bhp')&&await vis('bdel'),n+': TOOLS tab shows Health and Delete sheet');
 await page.evaluate(()=>document.getElementById('bhp').click());await page.waitForTimeout(300);
 ck(await page.evaluate(()=>!document.getElementById('hp').hidden&&/sheets/.test(document.getElementById('hp').textContent)),n+': Health panel opens ('+(await page.evaluate(()=>document.getElementById('hp').textContent.slice(0,60)))+')');
 await page.evaluate(()=>{const c=document.getElementById('hpc');if(c)c.click()});
 // back to LOGIC, switch to ABC: the ABC groups come back, the DITL group goes
 await page.evaluate(()=>[...document.querySelectorAll('#gsbar .tabs button')].find(b=>/LOGIC/i.test(b.textContent)).click());await page.waitForTimeout(300);
 await page.evaluate(()=>[...document.querySelectorAll('#gsbar .sub button')].find(b=>b.textContent.trim()==='ABC').click());
 await page.waitForFunction(()=>document.body.classList.contains('an'),null,{timeout:20000});await page.waitForTimeout(600);
 const gv=await page.evaluate(()=>{const v=s=>{const e=document.querySelector(s);return !!e&&e.offsetHeight>0};return {run:v('#gsbar .g-run'),view:v('#gsbar .g-view'),ditl:v('#gsbar .g-ditl')}});
 ck(gv.run&&gv.view&&!gv.ditl&&!(await vis('anbar')),n+': ABC page shows Run / View groups, no DITL group, no old toolbar');
 ck(errs.length===0,n+': no page error'+(errs.length?' ('+errs[0]+')':''));
 await ctx.close();
}
await browser.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
