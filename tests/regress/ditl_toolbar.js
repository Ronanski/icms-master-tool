// 2.4.1-beta.4: the DITL page works like ABC. The top bar shows Run / Pause, View, Fit (no editor: Simulate / Edit, Delete sheet,
// Clear cells are gone), the old ABC and DITL toolbars are hidden, Health still opens from TOOLS, and switching to ABC brings
// the ABC groups back. Desktop, tablet, phone.
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
 ck(gsH<=(n==='desktop'?70:n==='phone'?150:110),n+': top bar height '+gsH+' px');
 // 2.4.1-beta.10: on the phone the LOGIC tools (VIEW | Run, ▶▶, ⏱, Panel, ☰ Sheets) have their own row so none is off screen (3 rows)
 ck(await page.evaluate(()=>document.body.dataset.tab==='logic'),n+': LOGIC tab');
 const run=()=>page.evaluate(()=>{const b=document.querySelector('#gsbar .g-ditl .dui-run');return b&&b.offsetHeight>0?b.textContent.trim():null});
 ck(!!(await run()),n+': Run button in the top bar');
 ck(await vis('bfit'),n+': Fit in view');
 ck(!(await vis('bmode'))&&!(await vis('bdel'))&&!(await vis('bclr')),n+': no Simulate / Edit, Delete sheet, Clear cells');
 // Run -> Pause -> View
 await page.evaluate(()=>document.querySelector('#gsbar .g-ditl .dui-run').click());
 ck(await page.evaluate(()=>SIM===true&&DPAUSE===false),n+': Run starts the DITL simulation');
 await page.evaluate(()=>document.querySelector('#gsbar .g-ditl .dui-run').click());
 ck(await page.evaluate(()=>SIM===true&&DPAUSE===true),n+': Pause holds it');
 await page.evaluate(()=>[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>/^view$/i.test(b.textContent.trim())).click());
 ck(await page.evaluate(()=>SIM===false),n+': View stops it');
 // TOOLS tab: Health works, no editor tools
 await page.evaluate(()=>[...document.querySelectorAll('#gsbar .tabs button')].find(b=>/TOOLS/i.test(b.textContent)).click());await page.waitForTimeout(600);
 ck(await vis('bhp')&&!(await vis('bdel'))&&!(await vis('bmode')),n+': TOOLS tab shows Health, no editor tools');
 await page.evaluate(()=>document.getElementById('bhp').click());await page.waitForTimeout(300);
 ck(await page.evaluate(()=>!document.getElementById('hp').hidden&&/sheets/.test(document.getElementById('hp').textContent)),n+': Health panel opens ('+(await page.evaluate(()=>document.getElementById('hp').textContent.slice(0,60)))+')');
 await page.evaluate(()=>{const c=document.getElementById('hpc');if(c)c.click()});
 // back to LOGIC, switch to ABC: the ABC groups come back, the DITL group goes
 await page.evaluate(()=>[...document.querySelectorAll('#gsbar .tabs button')].find(b=>/LOGIC/i.test(b.textContent)).click());await page.waitForTimeout(300);
 await page.evaluate(()=>[...document.querySelectorAll('#gsbar .sub button')].find(b=>b.textContent.trim()==='ABC').click());
 await page.waitForFunction(()=>document.body.classList.contains('an'),null,{timeout:20000});await page.waitForTimeout(600);
 const gv=await page.evaluate(()=>{const v=s=>{const e=document.querySelector(s);return !!e&&e.offsetHeight>0};return {run:v('#gsbar .g-run'),view:v('#lotools .lo-an'),ditl:v('#gsbar .g-ditl')}});
 ck(gv.run&&gv.view&&!gv.ditl&&!(await vis('anbar')),n+': ABC page shows Run group and drawing tools (2.4.1-beta.7: on the drawing), no DITL group, no old toolbar');
 ck(errs.length===0,n+': no page error'+(errs.length?' ('+errs[0]+')':''));
 await ctx.close();
}
await browser.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
