// 2.4.1-beta.6: the ◀ Panel side tab on ABC and DITL (shows when that page's panel is closed, opens it) and the DITL panel follows an ABC <-> DITL switch at once. Usage: node tests/regress/sidetab.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=require('path').resolve(process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x)));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));let f=0;const ck=(c,t)=>{console.log((c?'PASS ':'FAIL ')+t);if(!c)f++};
await p.goto('file://'+html);await p.waitForTimeout(1500);await p.evaluate(()=>AN.setCat('an'));
await p.waitForFunction(()=>AN.sheets.length>=54&&window.lsSetTab,null,{timeout:60000});await p.evaluate(()=>lsSetTab('logic'));await p.waitForTimeout(800);
const vis=id=>p.evaluate(id=>{const e=document.getElementById(id);return !!e&&e.offsetHeight>0},id);
const sub=t=>p.evaluate(t=>[...document.querySelectorAll('#gsbar .sub button')].find(b=>b.textContent.trim()===t).click(),t);
ck(!(await vis('anptab'))&&!(await vis('dptab')),'ABC panel open: no side tab');
await p.evaluate(()=>document.getElementById('anp').querySelector('button[title^="Hide panel"]').click());await p.waitForTimeout(200);
ck(await vis('anptab'),'ABC panel closed: ◀ Panel tab shows');
await sub('DITL');await p.waitForTimeout(100);
ck(!(await vis('anptab')),'DITL page: ABC tab hidden');
// frame check: DITL panel present right after switch
const w=await p.evaluate(()=>document.getElementById('dp').getBoundingClientRect().width);ck(w>300,'DITL panel there 0.1 s after switch ('+w+')');
await p.evaluate(()=>document.querySelector('#dp .dp-top button').click());await p.waitForTimeout(100);
ck(await vis('dptab'),'DITL panel closed: ◀ Panel tab shows');
await p.evaluate(()=>document.getElementById('dptab').click());await p.waitForTimeout(100);
ck((await p.evaluate(()=>document.getElementById('dp').offsetWidth))>300&&!(await vis('dptab')),'tab click opens the DITL panel');
await sub('ABC');await p.waitForTimeout(100);
ck(await vis('anptab')&&!(await vis('dptab')),'back on ABC: ABC tab (panel still closed), no DITL tab');
await p.evaluate(()=>document.getElementById('anptab').click());await p.waitForTimeout(200);
ck(!(await vis('anptab'))&&(await p.evaluate(()=>!document.getElementById('anp').classList.contains('min'))),'ABC tab opens the ABC panel');
await p.evaluate(()=>lsSetTab('library'));await p.waitForTimeout(100);ck(!(await vis('anptab'))&&!(await vis('dptab')),'no side tab on LIBRARY');
ck(!errs.length,'no page error '+errs.join());console.log(f?'FAIL':'ALL PASS');await b.close();process.exit(f?1:0)})();
