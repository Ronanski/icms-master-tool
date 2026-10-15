// SCENARIO TEST (headless): pinapatakbo ang MISMONG in-app UAT scenario runner (src/ui/uat/scen.js) sa totoong page; pareho ito ng pinipindot ng user sa UAT panel.
// Ang scenarios ay nasa src/ui/uat/scenarios/<sheet>.json (inaasahang sagot mula sa PDF, hindi kinuwenta ng engine).
// Usage: node tests/scenarios/run.js [html] [sheet ...]
const fs=require('fs');const {open}=require('../regress/lib.js');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+\.html$/.test(x));
const want=process.argv.slice(2).filter(a=>!/\.html$/.test(a));
(async()=>{const {browser,page,errs}=await open(html);let pass=0,fail=0;
const sheets=await page.evaluate(()=>Object.keys(JSON.parse(document.getElementById('uatdata').textContent).scen));
for(const sh of sheets.filter(x=>!want.length||want.includes(x))){
 const ids=await page.evaluate(s=>JSON.parse(document.getElementById('uatdata').textContent).scen[s].scenarios.map(x=>x.id),sh);
 console.log('\n=== '+sh);
 for(const id of ids){const r=await page.evaluate(async([s,id])=>{const sp=JSON.parse(document.getElementById('uatdata').textContent).scen[s];const sc=sp.scenarios.find(x=>x.id===id);const r=await UATS.run(s,sc);return{title:sc.title,drawing:sc.drawing,lines:r.lines,pass:r.pass,fail:r.fail}},[sh,id]);
  console.log('\n['+id+'] '+r.title+'  →  '+(r.fail?r.fail+' MALI':'tama lahat')+' ('+r.pass+'/'+(r.pass+r.fail)+')');
  for(const l of r.lines)if(l.k==='bad')console.log('   ✘ '+l.t+'  → inaasahan: '+l.exp+' | nakita: '+l.got);
  pass+=r.pass;fail+=r.fail}}
console.log('\nKABUUAN: '+pass+' tama, '+fail+' mali'+(errs.length?' | page errors: '+errs.slice(0,2):''));await browser.close();process.exit(fail?1:0)})();
