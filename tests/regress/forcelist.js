// 3.2.0-beta.6 (engineering audit, signals and forcing): the FORCED chip of the alarm banner counts only the USER's forces (not
// the values the plant model owns while it is ON), on every ABC sheet; a click opens one list of them with Go and Release.
// Usage: node tests/regress/forcelist.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page:p,errs}=await open(html);await p.setViewportSize({width:1440,height:900});let f=0;
const ck=(ok,t)=>{console.log((ok?'PASS ':'FAIL ')+t);if(!ok)f++};
const st=()=>p.evaluate(()=>{let user=0,plant=0;for(const s of AN.sheets)if(s.S&&s.S.rt){const F=s.S.rt.force||{},PF=s.S.rt.pf||{};for(const k in F)(PF[k]?plant++:user++)}
 const c=document.querySelector('#cralarm .crchip.frc');const L=document.getElementById('crflist');
 return {user,plant,chip:c&&c.offsetParent?c.textContent.trim():'(hidden)',list:L&&L.classList.contains('open')?[...L.querySelectorAll('.crfr')].map(r=>r.textContent):null}});
const go=n=>p.evaluate(n=>{lsSetTab('logic');AN.go(AN.sheets.findIndex(s=>s.name===n))},n);
await p.evaluate(()=>lsSetTab('operate'));await p.waitForTimeout(1500);
await p.evaluate(()=>{AN.plantSwitch(true);document.getElementById('load150').click()});await p.waitForTimeout(3000);
await go('ABC-010');await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.offsetParent&&x.textContent.trim()==='RUN');b&&b.click()});await p.waitForTimeout(3000);
let r=await st();ck(r.user===0&&r.chip==='(hidden)','Plant model ON, Start 150 MW, RUN: 0 user forces, chip '+r.chip+' (expected hidden: the plant model values are not forces)');
await go('ABC-010');await p.waitForTimeout(1500);
const n=await p.evaluate(()=>{const sh=AN.sheets[AN.i],S=sh.S;let n=-1;for(const k in S.lab||{})if(S.lab[k]&&S.lab[k].t==='M.0228')n=+k;if(n>=0)AN.setForce(sh,n,1);return n});
await p.waitForTimeout(1200);r=await st();ck(n>=0&&r.user===1&&r.chip==='1 FORCED','force M.0228 = 1 on ABC-010: chip "'+r.chip+'" (expected "1 FORCED")');
await go('ABC-001C');await p.waitForTimeout(1200);r=await st();ck(r.chip==='1 FORCED','open ABC-001C: chip still "'+r.chip+'" (the force is on another sheet)');
await p.click('#cralarm .crchip.frc');await p.waitForTimeout(300);r=await st();
ck(r.list&&r.list.length===1&&/ABC-010/.test(r.list[0])&&/M\.0228/.test(r.list[0])&&/FORCE 1/.test(r.list[0]),'click the chip: one list on every sheet: '+JSON.stringify(r.list));
await p.evaluate(()=>[...document.querySelectorAll('#crflist button')].find(b=>b.textContent==='Go').click());await p.waitForTimeout(800);
ck(await p.evaluate(()=>AN.sheets[AN.i].name)==='ABC-010','Go opens ABC-010');
await p.evaluate(()=>[...document.querySelectorAll('#crflist button')].find(b=>b.textContent==='Release').click());await p.waitForTimeout(1200);
r=await st();ck(r.user===0&&r.chip==='(hidden)','Release: 0 forces left, chip hidden');
ck(!errs.length,errs.length?'page errors '+errs.join(' | '):'no page error');
console.log(f?'FAILED '+f:'ALL PASS');await browser.close();process.exit(f?1:0)})();
