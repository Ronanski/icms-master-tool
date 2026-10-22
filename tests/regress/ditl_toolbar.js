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
 // 3.2.0-beta.1 (3.1 shell): one top bar + a ribbon; VIEW | RUN is the switch of the top bar for ABC and DITL
 ck(gsH<=(n==='phone'?220:150),n+': top bar + ribbon height '+gsH+' px');
 ck(await page.evaluate(()=>document.body.dataset.tab==='logic'),n+': LOGIC tab');
 const seg=k=>page.evaluate(k=>document.querySelector('#gsbar .seg button:'+(k?'last':'first')+'-child').click(),k);
 ck(await page.evaluate(()=>{const s=[...document.querySelectorAll('#gsbar .seg button')];return s.length===2&&s.every(b=>b.offsetHeight>0)&&s[1].textContent.trim()==='RUN'}),n+': VIEW | RUN switch in the top bar');
 ck(await vis('bfit'),n+': Fit in view');
 ck(!(await vis('bmode'))&&!(await vis('bdel'))&&!(await vis('bclr')),n+': no Simulate / Edit, Delete sheet, Clear cells');
 ck(await page.evaluate(()=>[...document.querySelectorAll('#gsbar .g-ditl button')].some(b=>b.offsetHeight>0&&b.textContent.trim()==='Reset')),n+': DITL Reset in the ribbon');
 // 2.5.0-beta.9: RUN / VIEW only (no Pause, no step: user "VIEW at SIMULATE ON/OFF nalang")
 await seg(1);
 ck(await page.evaluate(()=>SIM===true&&DPAUSE===false),n+': RUN starts the DITL simulation');
 await seg(1);
 ck(await page.evaluate(()=>SIM===true&&DPAUSE===false),n+': RUN again keeps it running (no Pause)');
 await seg(0);
 ck(await page.evaluate(()=>SIM===false),n+': VIEW stops it');
 // TOOLS tab: Health works, no editor tools
 await page.evaluate(()=>[...document.querySelectorAll(':is(#gsbar,#crrail,#crnav) .tabs button')].find(b=>/^tools$/i.test(b.textContent.trim())).click());await page.waitForTimeout(600);
 ck(await vis('bhp')&&!(await vis('bdel'))&&!(await vis('bmode')),n+': TOOLS tab shows Health, no editor tools');
 await page.evaluate(()=>document.getElementById('bhp').click());await page.waitForTimeout(300);
 ck(await page.evaluate(()=>!document.getElementById('hp').hidden&&/sheets/.test(document.getElementById('hp').textContent)),n+': Health panel opens ('+(await page.evaluate(()=>document.getElementById('hp').textContent.slice(0,60)))+')');
 await page.evaluate(()=>{const c=document.getElementById('hpc');if(c)c.click()});
 // back to LOGIC, switch to ABC: the ABC groups come back, the DITL group goes
 await page.evaluate(()=>[...document.querySelectorAll(':is(#gsbar,#crrail,#crnav) .tabs button')].find(b=>/^logic$/i.test(b.textContent.trim())).click());await page.waitForTimeout(300);
 await page.evaluate(()=>[...document.querySelectorAll('#gsbar .sub button')].find(b=>b.textContent.trim()==='ABC').click());
 await page.waitForFunction(()=>document.body.classList.contains('an'),null,{timeout:20000});await page.waitForTimeout(600);
 const gv=await page.evaluate(()=>{const v=s=>{const e=document.querySelector(s);return !!e&&e.offsetHeight>0};return {run:v('#gsbar .g-run'),view:v('#gsbar .g-view'),ditl:v('#gsbar .g-ditl')}});
 ck(!gv.run&&gv.view&&!gv.ditl&&!(await vis('anbar')),n+': ABC page in VIEW: Layers group, no SIM group (RUN only), no DITL group, no old toolbar');
 ck(errs.length===0,n+': no page error'+(errs.length?' ('+errs[0]+')':''));
 await ctx.close();
}
await browser.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
