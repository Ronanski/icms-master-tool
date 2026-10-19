// In-app update and channel (apk / exe copy, 1.22.0): the Beta and the update are DOWNLOADED into the app and run from it,
// also without internet; the app never goes to the web page (Chrome). The site is simulated here (no internet needed):
// Stable = this build as v<x>.<y>.<z+1>, Beta = this build as -beta.<n+1>.
// Usage: node tests/regress/inapp_update.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const src=fs.readFileSync(html,'utf8'),V=(src.match(/<title>Logic Sim v([^<]+)<\/title>/)||[])[1];
const m=/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/.exec(V),SV=`${m[1]}.${m[2]}.${+m[3]+1}`,BV=m[4]?`${m[1]}.${m[2]}.${m[3]}-beta.${+m[4]+1}`:`${m[1]}.${+m[2]+1}.0-beta.1`;/* a Stable app: the next Beta is the Beta of the next MINOR (a Beta older than the app copy is never opened, 2.0.0) */
const as=v=>src.split(`Logic Sim v${V}`).join(`Logic Sim v${v}`).split(`'v${V}'`).join(`'v${v}'`);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'appdir-'));cp.execFileSync('node',['tools/build/app-folder.js',html,dir]);
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1024,height:768}});
let online=true,nav=[];
await ctx.route('https://ronanski.github.io/**',r=>{const u=r.request().url();if(!online)return r.abort();
 if(/version\.json/.test(u))return r.fulfill({headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify({stable:'v'+SV,beta:'v'+BV})});
 if(/\/beta\/(\?|$)/.test(u))return r.fulfill({headers:{'access-control-allow-origin':'*'},contentType:'text/html',body:as(BV)});return r.fulfill({headers:{'access-control-allow-origin':'*'},contentType:'text/html',body:as(SV)})});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('framenavigated',f=>{if(f===p.mainFrame())nav.push(f.url())});
let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const title=()=>p.evaluate(()=>document.title.replace(/^DCS Logic Simulator /,'Logic Sim '));const ready=()=>p.waitForFunction(()=>document.getElementById('chsel'),null,{timeout:30000});
await p.goto('file://'+dir+'/index.html');await ready();
ck((await title())==='Logic Sim v'+V,'starts with the copy inside the app: '+(await title()));
// choose Beta: downloaded into the app, then it runs from the app
await p.evaluate(()=>{const c=document.getElementById('chsel');c.value='beta';c.dispatchEvent(new Event('change'))});await p.waitForFunction(v=>document.title.includes(v),BV,{timeout:30000});await ready();
ck((await title()).includes(BV),'Beta chosen: runs the downloaded Beta '+(await title()));
ck(nav.every(u=>u.startsWith('file:')),'never left the app (no web page / Chrome): '+[...new Set(nav)].join(' '));
ck(await p.evaluate(()=>document.getElementById('chsel').value==='beta'),'channel box says Beta');
// no internet: start again, the Beta still runs
online=false;await p.reload();await p.waitForFunction(v=>document.title.includes(v),BV,{timeout:30000});await ready();
ck((await title()).includes(BV),'no internet, app started again: still the Beta '+(await title()));
const ok1=await p.evaluate(async()=>{const has=()=>typeof S!=="undefined"&&S.sheets&&S.sheets.length;for(let i=0;i<60&&!has();i++)await new Promise(r=>setTimeout(r,250));return has()||0});
ck(ok1>=100,'the Beta works offline: '+ok1+' DITL sheets');
// back to Stable (offline): the copy inside the app
await p.evaluate(()=>{const c=document.getElementById('chsel');c.value='stable';c.dispatchEvent(new Event('change'))});await p.waitForFunction(v=>document.title.replace(/^DCS Logic Simulator /,'Logic Sim ')==='Logic Sim v'+v,V,{timeout:30000});await ready();
ck((await title())==='Logic Sim v'+V,'Stable chosen offline: the copy inside the app '+(await title()));
// update of the Stable when online: question, Update now, downloaded, runs from the app
online=true;await p.evaluate(()=>window.lsCheckUpdate(true));await p.waitForSelector('#updask',{timeout:20000});
ck(/v[\d.]+/.test(await p.textContent('#updask'))&&(await p.textContent('#updask')).includes(SV),'asks: '+(await p.textContent('#updask')).replace(/\s+/g,' ').slice(0,80));
await p.click('text=Update now');await p.waitForFunction(v=>document.title.replace(/^DCS Logic Simulator /,'Logic Sim ')==='Logic Sim v'+v,SV,{timeout:30000});await ready();
ck((await title())==='Logic Sim v'+SV,'updated in the app: '+(await title()));
online=false;await p.reload();await p.waitForFunction(v=>document.title.replace(/^DCS Logic Simulator /,'Logic Sim ')==='Logic Sim v'+v,SV,{timeout:30000});
ck(true,'no internet, started again: still the updated Stable');
ck(nav.every(u=>u.startsWith('file:')),'never left the app');
ck(errs.length===0,'no page error'+(errs.length?' ('+errs[0]+')':''));
await b.close();fs.rmSync(dir,{recursive:true,force:true});console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
