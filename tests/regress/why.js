// 3.2.0-beta.6 "BAKIT?" (WHY) and FIRST-OUT, what the operator sees:
// 1. At 150 MW the start-up drum level controller LICBR1001B is held in MANUAL: its faceplate "Why?" names the drawing reason
//    (M.0226 = 1 <- NOT <- FICFW1007.MAN = 0 / LICBR1001A.MAN = 0, ABC-010) and offers the input to change.
// 2. The info card of a tag answers "Why = value?" with the same walk.
// 3. One world ON: pressing BOILER EMERGENCY TRIP P.B. (DITL-03A input row 14) logs MASTER FUEL TRIP (MFT) in the Event log with
//    its cause captured at that scan (first-out).
// Usage: node tests/regress/why.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));let f=0;const ck=(ok,t)=>{console.log((ok?'PASS ':'FAIL ')+t);if(!ok)f++};
await p.addInitScript(()=>{try{localStorage.setItem('ls-world','1')}catch(e){}});
await p.goto('file://'+require('path').resolve(html));await p.waitForTimeout(1500);
await p.evaluate(()=>AN.setCat('an'));await p.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54,null,{timeout:60000});
await p.evaluate(()=>lsSetTab('operate'));await p.waitForTimeout(800);
await p.evaluate(()=>document.getElementById('load150').click());await p.waitForTimeout(3000);
await p.evaluate(()=>{lsSetTab('logic');AN.go(AN.sheets.findIndex(s=>s.name==='ABC-010'))});await p.waitForTimeout(1200);
await p.evaluate(()=>{const x=[...document.querySelectorAll('button')].find(x=>x.offsetParent&&x.textContent.trim()==='RUN');x&&x.click()});await p.waitForTimeout(3000);
// 1. faceplate Why?
const w=await p.evaluate(async()=>{const fp=[...document.querySelectorAll('.fp')].find(x=>x.offsetParent&&/LICBR1001B/.test(x.textContent));if(!fp)return {err:'no LICBR1001B faceplate'};
 const bt=fp.querySelector('.whyb');if(!bt||!bt.offsetParent)return {err:'no Why? button'};bt.click();await new Promise(r=>setTimeout(r,300));
 const rows=[...fp.querySelectorAll('.whyr')].map(r=>r.textContent);const set=[...fp.querySelectorAll('.whyr.k-input .b')].map(x=>x.textContent);return {rows,set,fm:fp.querySelector('.whyx span').textContent}});
ck(!w.err&&/FORCE MANUAL \(M\.0226 = 1\)/.test(w.fm)&&w.rows.some(r=>/^M\.0226 = 1 · OR/.test(r))&&w.rows.some(r=>/FICFW1007\.MAN = 0 · input of the operator/.test(r))&&w.rows.some(r=>/LICBR1001A\.MAN = 0 · input/.test(r))&&w.set.length===2,
 'LICBR1001B (ABC-010) at 150 MW: "'+(w.fm||w.err)+'", Why? shows '+(w.rows||[]).length+' lines: '+JSON.stringify((w.rows||[]).slice(0,5))+', change buttons '+JSON.stringify(w.set));
// 2. info card Why = ?
const ic=await p.evaluate(async()=>{const S=AN.sheets[AN.i].S;let n=-1;for(const k in S.lab||{})if(S.lab[k]&&S.lab[k].t==='M.0226')n=+k;const L=AN.why(AN.sheets[AN.i],n).lines;return L.map(l=>l.txt)});
ck(ic.length>=3&&/^M\.0226 = 1/.test(ic[0]),'AN.why(ABC-010, M.0226) = the same walk for the info card: '+JSON.stringify(ic.slice(0,3)));
// 3. first-out of an MFT
await p.evaluate(()=>{lsEvents.length=0;const s=S.sheets.find(x=>/DITL-03A/.test(x.name));s.sig['13:S']=true});await p.waitForTimeout(2500);
await p.evaluate(()=>{const s=S.sheets.find(x=>/DITL-03A/.test(x.name));s.sig['13:S']=false});await p.waitForTimeout(1200);
const ev=await p.evaluate(()=>lsEvents.filter(e=>e.kind==='TRIP'&&/MASTER FUEL TRIP \(MFT\)/.test(e.text)).map(e=>({sh:e.sh,t:e.text,why:(e.why||[]).map(l=>l.txt)})));
ck(ev.length===1&&/DITL-03A/.test(ev[0].sh)&&ev[0].why.length===1&&/BOILER EMERGENCY TRIP P\.B\. ON \(CRT\) = 1/.test(ev[0].why[0]),'press BOILER EMERGENCY TRIP P.B.: Event log "'+(ev[0]?ev[0].t:'-')+'", cause '+JSON.stringify(ev[0]&&ev[0].why));
const nt=await p.evaluate(()=>lsEvents.filter(e=>/NO (\w+ )?TRIP/i.test(e.text)).length);ck(nt===0,'"NO TRIP PRESENT" is not logged as a trip ('+nt+')');
ck(!errs.length,errs.length?'page errors '+errs.join(' | '):'no page error');
console.log(f?'FAILED '+f:'ALL PASS');await b.close();process.exit(f?1:0)})();
