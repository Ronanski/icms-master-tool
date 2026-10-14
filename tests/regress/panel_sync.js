// Operator panel in the REAL page (DOM clicks) must match the diagram's switching signals (user rule, 2026-10-14):
// the panel shows the select signals of the A/M station (name, MAN / AUTO role, live 0/1), the mode inputs (.MAN .LOC .REM) are buttons on the same signals,
// FORCE MANUAL (signal = 1) disables AUTO, and when the signal goes the station is AUTO again by itself.
// Usage: node tests/regress/panel_sync.js [html] [sheet] [tag]    (default ABC-007 FICFA1081)
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+\.html$/.test(x));
const args=process.argv.filter(a=>!/\.html$/.test(a)).slice(2),sheet=args[0]||'ABC-007',tag=args[1]||'FICFA1081';
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(s=>AN.go(AN.sheets.findIndex(x=>x.name===s)),sheet);
await page.evaluate(()=>{[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Operator').forEach(b=>b.click());AN.run=true});await page.waitForTimeout(1500);
const stepN=k=>page.evaluate(k=>{const sh=AN.sheets[AN.i];for(let j=0;j<k;j++)AN.stepSet(sh,.5)},k);
const card=()=>page.evaluate(t=>{const fp=[...document.querySelectorAll('#opp .fp')].find(x=>x.querySelector('.tg b')&&x.querySelector('.tg b').textContent===t);if(!fp)return null;const bs=[...fp.querySelectorAll('button')];const g=n=>bs.find(e=>e.textContent===n);return{auto:g('AUTO')&&g('AUTO').classList.contains('on'),man:g('MAN')&&g('MAN').classList.contains('on'),autoOff:g('AUTO')&&g('AUTO').disabled,chips:[...fp.querySelectorAll('.sg')].map(e=>e.textContent),modes:bs.filter(e=>/^\.(MAN|LOC|REM|AUTO)/.test(e.textContent)).map(e=>e.textContent)}},tag);
await stepN(8);await page.waitForTimeout(600);let c=await card();ck(!!c,'faceplate '+tag+' is on the panel');if(!c){await browser.close();process.exit(1)}
const mansig=(c.chips.find(x=>/→ MAN/.test(x))||'').split(' → ')[0];ck(!!mansig,'the force-manual signal is shown on the panel ('+mansig+'); chips: '+c.chips.join(' | ')+'; mode inputs: '+(c.modes.join(' ')||'none'));
const frc=v=>page.evaluate(([n,v])=>{const S=AN.sheets[AN.i].S;const i=S.nets.findIndex((x,k)=>S.lab[k]&&S.lab[k].t===n);if(v===null)delete S.rt.force[i];else S.rt.force[i]=v;try{AN.settle()}catch(e){}},[mansig,v]);
const sync=async()=>{await stepN(8);await page.waitForTimeout(600);return card()};
await frc(0);c=await sync();ck(c.chips.some(x=>x.startsWith(mansig+' → MAN 0'))&&!c.autoOff,'signal 0: AUTO is available');
await page.evaluate(t=>{const fp=[...document.querySelectorAll('#opp .fp')].find(x=>x.querySelector('.tg b').textContent===t);[...fp.querySelectorAll('button')].find(e=>e.textContent==='AUTO').click()},tag);c=await sync();ck(c.auto&&!c.man,'AUTO pressed: the panel shows AUTO');
await frc(1);c=await sync();ck(c.man&&!c.auto&&c.autoOff,'signal 1 (force manual): the panel shows MAN, AUTO is disabled');
await frc(0);c=await sync();ck(c.auto&&!c.man,'signal back to 0: AUTO again by itself');
if(errs.length)console.log('page errors',errs.slice(0,3));await browser.close();process.exit(fail?1:0)})();
