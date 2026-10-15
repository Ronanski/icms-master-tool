// DITL page "ALSO IN ABC" bar (2.1.0-beta.7): a selected DITL cell whose address is also on ABC sheets lists those sheets; ⓘ opens the info card.
// Usage: node tests/regress/abcbar.js [html]
const fs=require('fs');const {open}=require('./lib.js');
const html=process.argv[2]||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ok=(c,t)=>{console.log((c?'PASS ':'FAIL ')+t);if(!c)fail++};
const r=await page.evaluate(async()=>{AN.setCat('dig');await new Promise(r=>setTimeout(r,800));
 let hit=null;for(let i=0;i<S.sheets.length&&!hit;i++)for(const k in S.sheets[i].cells||{})if(S.sheets[i].cells[k].some(t=>/M\.3302/.test(t.t))){hit={i,k};break}
 S.cur=hit.i;render();const [r_,c]=hit.k.split(':');sel={k:hit.k,i:+r_,c};render();await new Promise(r=>setTimeout(r,1300));
 const b=document.getElementById('abcbar'),bar=b&&b.style.display!=='none'?b.innerText.replace(/\n/g,' '):'';
 [...b.querySelectorAll('button')].find(x=>x.textContent==='ⓘ').click();await new Promise(r=>setTimeout(r,800));const ic=document.getElementById('infocard');
 sel=null;await new Promise(r=>setTimeout(r,900));return {bar,card:ic?ic.innerText.slice(0,80):'',hidden:document.getElementById('abcbar').style.display==='none'}});
ok(/ALSO IN ABC/.test(r.bar)&&/ABC-007/.test(r.bar)&&/ABC-008/.test(r.bar),'DITL-01 M.3302 cell: bar lists ABC-007 and ABC-008 ('+r.bar+')');
ok(/^M\.3302/.test(r.card),'ⓘ opens the info card of M.3302');
ok(r.hidden,'bar hides when nothing is selected');
ok(!errs.length,'no page error');
console.log(fail?'FAIL':'ALL PASS');await browser.close();process.exit(fail?1:0)})();
