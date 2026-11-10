// Mina's live test 2026-11-05 (ESP AND ASH, beta.33): the ASH COOLER A faceplate (DITL-21A) had its local START grey ("LOCAL START /
// FORWARD P.B.", row 22 I.0257, was not read) and E-STOP "not on DITL-21A" although row 18 I.0256 NOT EMERGENCY STOP = 0 at Cold holds
// the cooler stopped. Real clicks: RELEASE -> row 18 = 1; local START enabled in LOCAL; EMERGENCY STOP -> row 18 = 0.
// Usage: node tests/regress/ash_fp.js [html]
// 3.2.3-beta.59: the app opens on the start screen (Cold / Operator) and the plant page opens through the shell, as in field_ctl.js;
// the old path (lsPlant + #pllist) is under the start screen. The checks below are unchanged.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs'),path=require('path');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const errs=[];const ctx=await browser.newContext({viewport:{width:1600,height:900}});
await ctx.addInitScript(()=>{try{localStorage.setItem('ls-shell','c')}catch(e){}});
const page=await ctx.newPage();page.on('pageerror',e=>errs.push(String(e.message)));
await page.goto('file://'+path.resolve(html));
await page.waitForSelector('#scstart',{state:'visible',timeout:60000});
await page.locator('#scstart .scchips button',{hasText:/^\s*Cold/}).first().click();await page.locator('#scstart .sccard',{hasText:/^\s*Operator/}).first().click();
await page.waitForFunction(()=>window.AN&&AN.startState&&!AN._loading&&document.body.classList.contains('scov'),null,{timeout:150000});
await page.evaluate(()=>{if(window.lsSetRun)lsSetRun(true);else if(AN.setRun)AN.setRun(true)});
if(!await page.evaluate(()=>!!(AN.run&&!AN.view))){try{await page.locator('#scstrip button',{hasText:/RUN/}).first().click({timeout:3000})}catch(e){}await page.waitForTimeout(500)}
console.log('     state '+await page.evaluate(()=>AN.startState)+', RUN '+await page.evaluate(()=>!!(AN.run&&!AN.view)));
await page.evaluate(id=>lsShellC.openPage(id),'MK14');await page.waitForTimeout(2000);
const wait=ms=>page.waitForTimeout(ms);
const clk=async sel=>{const b=await page.evaluate(sel=>{const e=[...document.querySelectorAll(sel)].find(x=>x.getBoundingClientRect().width>0);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},sel);if(b)await page.mouse.click(b[0],b[1]);return !!b};
const btn=async (t,i)=>{const b=await page.evaluate(([t,i])=>{const p=document.getElementById('fpop');if(!p)return null;const e=[...p.querySelectorAll('button')].filter(x=>x.textContent.trim()===t&&x.offsetParent)[i||0];if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,e.disabled]},[t,i]);if(b&&!b[2])await page.mouse.click(b[0],b[1]);return b?(b[2]?'disabled':'ok'):'none'};
const es=()=>page.evaluate(()=>DUI.rowVal(LS_DOCK.dOf('DITL-21A'),17));
ck(await clk('[data-hit="BCA"]'),'ash cooler A on the page');await wait(700);
// 3.2.3-beta.63: since 3.2.1-beta.264 (src/world/plantsw.js) the E-stop is a released N.C. contact at Cold, row 18 = 1 (it stood 0 only
// because the tag matched no row, and that tripped the cooler); the order is now EMERGENCY STOP -> 0, then RELEASE -> 1.
ck(await es()===1,'Cold: NOT EMERGENCY STOP (row 18) = 1 (stop released)');
const ls=await page.evaluate(()=>{const p=document.getElementById('fpop');const b=[...p.querySelectorAll('button')].filter(x=>x.textContent.trim()==='START'&&x.offsetParent);return b.map(x=>x.disabled)});
ck(ls.length===2&&ls[1]===false,'local panel START enabled in LOCAL ('+JSON.stringify(ls)+')');
ck(await btn('EMERGENCY STOP')==='ok','EMERGENCY STOP enabled');await wait(300);await btn('EXECUTE');await wait(2500);
ck(await es()===0,'after EMERGENCY STOP: row 18 = 0');
ck(await btn('RELEASE')==='ok','E-STOP RELEASE enabled');await wait(300);await btn('EXECUTE');await wait(2500);
ck(await es()===1,'after RELEASE: row 18 = 1');
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
