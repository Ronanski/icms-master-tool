// Dry run of the generated block tests on the engine: node src/ui/uat/dry.js [html] [sheet]
const fs=require('fs');const {open}=require('../../../tests/regress/lib');
const html=process.argv[2]||fs.readdirSync('dist').map(x=>'dist/'+x).find(x=>/logic-sim-v\d+\.\d+\.\d+\.html$/.test(x));const only=process.argv[3];
(async()=>{const {browser,page}=await open(html);
await page.addScriptTag({content:fs.readFileSync(__dirname+'/runner.js','utf8')});await page.addScriptTag({content:fs.readFileSync(__dirname+'/gen.js','utf8')});
const r=await page.evaluate(async(only)=>{const stat={},fails=[],known={};let items=0,cases=0;const t0=Date.now();
 for(const x of AN.sheets)AN.ensure(x);
 for(const sh of AN.sheets){if(/^ABC-000/.test(sh.name)||(only&&sh.name!==only))continue;const spec=UATG.sheetSpec(sh);
  for(const g of spec.groups){for(const it of g.items){items++;const res=UATR.runItem(sh,it);cases+=it.cases.length;const s=stat[g.g]=stat[g.g]||{items:0,bad:0};s.items++;if(!res.ok){s.bad++;(known[sh.name]=known[sh.name]||[]).push(it.id);if(fails.length<400)fails.push(sh.name+' | '+g.g+' | '+it.n+' | '+res.res.filter(c=>!c.ok).map(c=>c.l+' => '+c.rows.filter(w=>!w.ok).map(w=>w.t+' expected '+w.exp+' got '+w.act).join('; ')).join(' || '))}}}
  await new Promise(r=>setTimeout(r,0))}
 return {stat,items,cases,fails,known,sec:Math.round((Date.now()-t0)/1000)}},only);
console.log(JSON.stringify(r.stat,null,1));console.log('items',r.items,'cases',r.cases,'time',r.sec,'s','failing',r.fails.length);
fs.writeFileSync('/tmp/dry-fails.txt',r.fails.join('\n'));if(!only)fs.writeFileSync(__dirname+'/known.json',JSON.stringify(r.known));await browser.close()})();
