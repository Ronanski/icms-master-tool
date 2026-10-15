// Stale stored Beta (2.0.0): an install that once downloaded an OLD Beta (older than the copy inside the app) must not open it.
// Choosing Beta downloads the newest Beta (online); the old copy is dropped at start. Site is simulated (no internet needed).
// Usage: node tests/regress/stale_beta.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const src=fs.readFileSync(html,'utf8'),V=(src.match(/<title>Logic Sim v([^<]+)<\/title>/)||[])[1];
const m=/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/.exec(V),APP=`${m[1]}.${m[2]}.${m[3]}`,NEWB=`${m[1]}.${+m[2]+1}.0-beta.1`,OLDB=`${Math.max(0,+m[1]-1)}.9.0-beta.4`;
const as=v=>src.split(`Logic Sim v${V}`).join(`Logic Sim v${v}`).split(`'v${V}'`).join(`'v${v}'`);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'appdir-'));fs.writeFileSync(path.join(dir,'app.html'),as(APP));cp.execFileSync('node',['tools/build/app-folder.js',path.join(dir,'app.html'),path.join(dir,'www')]);
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1180,height:820},isMobile:true,hasTouch:true});
let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};const H={'access-control-allow-origin':'*'};
await ctx.route('https://ronanski.github.io/**',r=>{const u=r.request().url();if(/version\.json/.test(u))return r.fulfill({headers:H,contentType:'application/json',body:JSON.stringify({stable:'v'+APP,beta:'v'+NEWB})});
 if(/\/beta\/(\?|$)/.test(u))return r.fulfill({headers:H,contentType:'text/html',body:as(NEWB)});return r.fulfill({headers:H,contentType:'text/html',body:as(APP)})});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const url='file://'+dir+'/www/index.html';await p.goto(url);await p.waitForFunction(()=>document.getElementById('chsel'),null,{timeout:30000});
await p.evaluate(async([h,v])=>{await new Promise(ok=>{const r=indexedDB.open('logic-sim-app',1);r.onupgradeneeded=()=>r.result.createObjectStore('pages');r.onsuccess=()=>{const tx=r.result.transaction('pages','readwrite');tx.objectStore('pages').put(h,'beta');tx.oncomplete=ok}});localStorage.setItem('ls-store',JSON.stringify({beta:'v'+v}));localStorage.setItem('logic.channel','stable')},[as(OLDB),OLDB]);
await p.reload();await p.waitForFunction(()=>document.getElementById('chsel'),null,{timeout:30000});
ck((await p.title())==='Logic Sim v'+APP,'starts with the app copy v'+APP+' (old Beta v'+OLDB+' stored)');
await p.evaluate(()=>{const c=document.getElementById('chsel');c.value='beta';c.dispatchEvent(new Event('change'))});
await p.waitForFunction(v=>document.title.includes(v)||document.title.includes('9.0-beta.4'),NEWB,{timeout:30000});await p.waitForTimeout(1500);
ck((await p.title()).includes(NEWB),'Beta chosen: runs the NEWEST Beta v'+NEWB+', not the old stored one: '+(await p.title()));
ck(await p.evaluate(v=>JSON.parse(localStorage.getItem('ls-store')).beta==='v'+v,NEWB),'store now holds the newest Beta');
ck(errs.length===0,'no page error'+(errs.length?' ('+errs[0]+')':''));
await b.close();fs.rmSync(dir,{recursive:true,force:true});console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
