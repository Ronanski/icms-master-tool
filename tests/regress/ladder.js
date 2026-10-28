// 3.2.0-beta.25 LADDER VIEW (preview, CHECKLIST 0.2, user 2026-10-24 "ladder sample"): the ladder that the app makes from the logic of a
// DITL sheet (src/ui/ladder/ladder.js) must give the SAME answer as the engine:
// 1. every one of the 241 DITL sheets is translated (no error), every output row has its rung;
// 2. 8 random states of the input rows per sheet (2 scans each, flip-flops settle): the power flow of every rung (left rail ->
//    contacts -> coil, or the S / R / input of a flip-flop or timer) equals the engine's value of that net;
// 3. the Ladder button of the DITL bar opens the panel on DITL-29A (seawater pump A) with live values while ▶ Run, and closes.
// Usage: node tests/regress/ladder.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForTimeout(3000);
const t=await page.evaluate(()=>{const o={sheets:0,err:[],noRung:[]};for(const s of S.sheets){o.sheets++;try{const P=LADDER.build(s);const rows=new Set(s.nl.outs.map(x=>x.row));const got=new Set(P.rungs.filter(r=>r.kind==='out').map(r=>r.row));for(const r of rows)if(!got.has(r))o.noRung.push(s.name+' row '+(r+1))}catch(e){o.err.push(s.name+' '+e.message)}}return o});
ck(t.sheets===241&&!t.err.length,'all '+t.sheets+' DITL sheets translated to ladder'+(t.err.length?' (errors: '+t.err.slice(0,3).join('; ')+')':''));
ck(!t.noRung.length,'every output row has its rung'+(t.noRung.length?' (missing: '+t.noRung.slice(0,5).join('; ')+')':''));
const r=await page.evaluate(()=>{let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;const o={cases:0,rungs:0,bad:0,ex:[]};
 for(const s of S.sheets){const rows=[...new Set(s.nl.src.map(z=>z.row))];
  for(let k=0;k<8;k++){const act=new Set(rows.filter(()=>rnd()<0.5));simulate(s.nl,act);simulate(s.nl,act);const c=LADDER.check(s);o.cases++;o.rungs+=c.rungs;if(c.bad.length){o.bad++;if(o.ex.length<5)o.ex.push(s.name+' '+JSON.stringify(c.bad[0]))}}}
 return o});
ck(r.bad===0,'ladder = engine: '+r.cases+' random input states, '+r.rungs+' rungs, '+r.bad+' differ'+(r.ex.length?' ('+r.ex.join('; ')+')':''));
await page.reload();await page.waitForTimeout(3500);
const u=await page.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));AN.setCat('dig');S.cur=S.sheets.findIndex(s=>/DITL-29A$/.test(s.name));render();await sl(500);
 const b=[...document.querySelectorAll('.dui-lad')].find(x=>x.offsetParent);if(!b)return {btn:0};b.click();await sl(700);
 const run=document.querySelector('#gsbar .g-ditl .dui-run')||document.querySelector('.dui-run');run&&run.click();await sl(2500);
 const L=document.getElementById('ladder');const vis=()=>!!L&&getComputedStyle(L).display!=='none';const o={btn:1,sim:!!SIM,open:vis(),rungs:L?L.querySelectorAll('.lk').length:0,head:L?L.querySelector('.lh-s').textContent:'',on:L?L.querySelectorAll('.lw.on').length:0};
 L.querySelector('.lh-x').click();await sl(300);o.closed=!vis();return o});
ck(u.btn&&u.open&&u.rungs>=10,'Ladder button on the DITL bar opens DITL-29A as ladder ('+u.rungs+' rungs)');
ck(u.sim&&/· live ·/.test(u.head)&&/all \d+ agree/.test(u.head)&&u.on>0,'live while ▶ Run, energized wires shown, header: '+u.head);
ck(u.closed,'✕ closes the ladder');
ck(!errs.length,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(fail?fail+' FAIL':'ALL PASS');await browser.close();process.exit(fail?1:0)})();
