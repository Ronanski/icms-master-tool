// KARANIWANG SCENARIO NG OPERATOR + PROSESO para BAWAT controller (kusang gawa mula sa drawing, src/ui/uat/scen.js: UATS.generic).
// Usage: node tests/scenarios/generic.js [html] [sheet ...]   (default: lahat ng sheet)
const fs=require('fs');const {open}=require('../regress/lib.js');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const want=process.argv.slice(2).filter(a=>!/\.html$/.test(a));
(async()=>{const {browser,page,errs}=await open(html);let pass=0,fail=0,nc=0,noclean=[];
const sheets=await page.evaluate(()=>AN.sheets.map(s=>s.name).filter(n=>!/^ABC-000/.test(n)));
for(const sh of sheets.filter(x=>!want.length||want.includes(x))){
 const tags=await page.evaluate(s=>{const sh=AN.sheets.find(x=>x.name===s);AN.go(AN.sheets.indexOf(sh));return AN.hmiCtrls(sh.S).filter(c=>c.amt&&c.manNet!=null).map(c=>c.tag)},sh);
 for(const tag of tags){nc++;
  const g=await page.evaluate(async([s,t])=>{[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Operator').forEach(b=>b.click());const g=await UATS.generic(s,t);if(!g||!g.scenarios)return g;const out=[];for(const sc of g.scenarios){const r=await UATS.run(s,sc);out.push({id:sc.id,title:sc.title,pass:r.pass,fail:r.fail,skip:r.lines.filter(l=>/^HINDI SINUSURI/.test(l.t)).length,bad:r.lines.filter(l=>l.k==='bad').map(l=>l.t+' → inaasahan: '+l.exp+' | nakita: '+l.got)})}return{loop:t,trig:g.trig,res:out,notes:g.notes||[]}},[sh,tag]);
  if(!g||!g.res){noclean.push(sh+' '+tag+' ('+(g&&g.note||'walang A/M o MV')+')');console.log(sh+' '+tag+': HINDI NASUBOK — '+(g&&g.note||'walang A/M o manual MV'));continue}
  const f=g.res.filter(r=>r.fail),p=g.res.reduce((a,r)=>a+r.pass,0),fl=g.res.reduce((a,r)=>a+r.fail,0);pass+=p;fail+=fl;
  console.log(sh+' '+tag+': '+(fl?fl+' MALI':'tama lahat')+' ('+p+'/'+(p+fl)+') trip: '+(g.trig||'walang nakitang input')+(g.res.length<6?' | scenarios: '+g.res.map(r=>r.id).join(','):''));
  for(const n of g.notes||[])console.log('     · '+n);
  for(const r of g.res.filter(r=>r.skip))console.log('     · ['+r.id+'] natitirang hakbang hindi sinuri: ang trip ay hindi nagpa-force sa estado ng scenario (depende sa proseso)');
  for(const r of f)for(const b of r.bad)console.log('     ✘ ['+r.id+'] '+b)}}
console.log('\nKABUUAN: '+nc+' controller, '+pass+' tama, '+fail+' mali, '+noclean.length+' hindi nasubok'+(errs.length?' | errors '+errs.slice(0,2):''));await browser.close();process.exit(fail?1:0)})();
