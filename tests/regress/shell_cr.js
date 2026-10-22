// 3.2.0-beta.3 (P2 Control Room shell, src/ui/shell/cr.js): 900 px and wider = rail (Plant view / Logic / Library / Tools / ⚙),
// unit band (LOAD, MSP, DRUM LVL, FW FLOW), alarm banner (alarm chip, Events), ABC | DITL and the sheet at the start of the ribbon;
// narrower = the old top bar, every element back in its place. The ⚙ menu and Start ▾ open and are on screen (lost in the merge:
// 3.2.0-beta.1 / 2 opened an empty menu). Usage: node tests/regress/shell_cr.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=require('path').resolve(process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x)));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let f=0;const ck=(c,t)=>{console.log((c?'PASS ':'FAIL ')+t);if(!c)f++};
const p=await b.newPage({viewport:{width:1333,height:833}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.open=()=>null});
await p.goto('file://'+html);await p.waitForTimeout(2000);await p.evaluate(()=>AN.setCat('an'));
await p.waitForFunction(()=>window.AN&&AN.sheets&&AN.sheets.length>=54&&document.body.classList.contains('cr'),null,{timeout:90000});
await p.evaluate(()=>{lsSetTab('logic');AN.go(AN.sheets.findIndex(s=>s.name==='ABC-010'))});await p.waitForTimeout(1500);
const rail=await p.evaluate(()=>{const r=document.getElementById('crrail');return r?{w:r.getBoundingClientRect().width,tabs:[...r.querySelectorAll('.tabs button')].map(x=>x.textContent.trim()),gear:!!r.querySelector('.gs-set > button')}:null});
ck(rail&&rail.tabs.join()==='Plant view,Logic,Library,Tools'&&rail.gear,'rail: '+(rail?rail.tabs.join(' / ')+' + ⚙':'none'));
const band=await p.evaluate(()=>[...document.querySelectorAll('#crband .crkpi')].map(k=>k.querySelector('i').textContent+' '+k.querySelector('b').textContent));
ck(band.length===4&&/^LOAD/.test(band[0])&&/^DRUM LVL -?\d/.test(band[2])&&/^FW FLOW -?\d/.test(band[3]),'unit band: '+band.join(' | ')+' (ABC-010 runs: drum level and feedwater flow are numbers)');
ck(await p.evaluate(()=>!!document.querySelector('#cralarm .crchip')&&!!document.querySelector('#cralarm #evbtn')&&!!document.querySelector('#crband .seg')&&!!document.querySelector('#gsbar .tbar .crwhere .sub')),'alarm banner with Events; VIEW | RUN in the band; ABC | DITL in the ribbon');
// the page starts right of the rail
ck(await p.evaluate(()=>{const r=document.getElementById('crrail').getBoundingClientRect().right;return ['gsbar','mid','sfoot'].every(id=>document.getElementById(id).getBoundingClientRect().left>=r-1)}),'top bar, drawing and status bar start right of the rail');
// ⚙ menu: opens, visible, inside the screen, right of the rail
await p.click('#crrail .gs-set > button');await p.waitForTimeout(400);
const gm=await p.evaluate(()=>{const m=document.querySelector('.ddm.ddm-open');if(!m)return null;const r=m.getBoundingClientRect();return {w:r.width,h:r.height,l:r.left,t:r.top,b:r.bottom,rr:document.getElementById('crrail').getBoundingClientRect().right,n:m.querySelectorAll('select,button').length}});
ck(gm&&gm.w>100&&gm.h>100&&gm.l>=gm.rr&&gm.t>=0&&gm.b<=833&&gm.n>=3,'⚙ menu opens on screen beside the rail ('+(gm?Math.round(gm.w)+'x'+Math.round(gm.h)+' at '+Math.round(gm.l)+','+Math.round(gm.t)+', '+gm.n+' controls':'none')+')');
await p.keyboard.press('Escape');await p.waitForTimeout(200);
// Start ▾ in the PLANT VIEW
await p.evaluate(()=>lsSetTab('operate'));await p.waitForTimeout(2500);
await p.evaluate(()=>[...document.querySelectorAll('#gsbar .tbar button')].find(x=>/^Start/.test(x.textContent.trim())).click());await p.waitForTimeout(400);
const sm=await p.evaluate(()=>{const m=document.querySelector('.ddm.ddm-open');if(!m)return null;const r=m.getBoundingClientRect();return {w:r.width,h:r.height,b:r.bottom,n:[...m.querySelectorAll('button')].filter(x=>/150 MW/.test(x.textContent)).length}});
ck(sm&&sm.w>100&&sm.h>100&&sm.b<=833&&sm.n>=1,'Start ▾ opens its menu on screen with Start at 150 MW ('+(sm?Math.round(sm.w)+'x'+Math.round(sm.h):'none')+')');
await p.keyboard.press('Escape');await p.evaluate(()=>lsSetTab('logic'));await p.waitForTimeout(500);
// a KPI opens its sheet
await p.evaluate(()=>{AN.go(AN.sheets.findIndex(s=>s.name==='ABC-013'));[...document.querySelectorAll('#crband .crkpi')].find(k=>/FW FLOW/.test(k.textContent)).click()});await p.waitForTimeout(800);
ck(await p.evaluate(()=>AN.sheets[AN.i].name==='ABC-010'),'FW FLOW opens ABC-010');
// narrow: the old top bar, elements back
await p.setViewportSize({width:820,height:1000});await p.waitForTimeout(700);
const nw=await p.evaluate(()=>({cr:document.body.classList.contains('cr'),rail:!!document.getElementById('crrail'),tabs:!!document.querySelector('#gsbar > .tabs'),set:!!document.querySelector('#gsbar > .gs-set'),sub:!!document.querySelector('#gsbar > .sub'),ev:!!document.querySelector('#sfoot #evbtn'),band:!!document.getElementById('crband')}));
ck(!nw.cr&&!nw.rail&&nw.tabs&&nw.set&&nw.sub&&nw.ev&&!nw.band,'820 px: the old top bar, every element back in its place '+JSON.stringify(nw));
await p.setViewportSize({width:1333,height:833});await p.waitForTimeout(700);
ck(await p.evaluate(()=>document.body.classList.contains('cr')&&!!document.querySelector('#crrail .tabs')&&!!document.querySelector('#cralarm #evbtn')),'back to 1333 px: Control Room again');
ck(errs.length===0,'no page error'+(errs.length?' ('+errs[0]+')':''));
await b.close();console.log(f?f+' FAIL':'ALL PASS');process.exit(f?1:0)})();
