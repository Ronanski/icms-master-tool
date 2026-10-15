// ACT:R / ACT:N audit: bawat PID / PIDV: ano ang nakasulat sa drawing (ACT:R / ACT:N) vs ano ang nabasa ng engine (P.act: -1 = R, +1 = N)
// Usage: node tests/scenarios/act.js [html]
const fs=require('fs');const {open}=require('../regress/lib.js');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page}=await open(html);
const R=await page.evaluate(()=>{const out=[];for(const sh of AN.sheets){if(/^ABC-000/.test(sh.name))continue;AN.go(AN.sheets.indexOf(sh));const S=sh.S;
 for(const b of S.blk){if(b.k!=='PID'&&b.k!=='PIDV')continue;
  const ts=S.tx.map(t=>({t:t.t.trim(),d:Math.hypot(t.x-b.cx,t.y-b.cy)})).filter(t=>/^ACT\s*:/i.test(t.t)).sort((a,c)=>a.d-c.d);
  out.push({sh:sh.name,tag:b.tag||'',k:b.k,act:b.p.act,txt:ts[0]&&ts[0].t,d:ts[0]&&Math.round(ts[0].d),n:ts.filter(t=>t.d<80).length})}}
 return out});
let bad=0;for(const r of R){const want=r.txt?(/R/i.test(r.txt.split(':')[1]||'')?-1:1):null;const ok=want!==null&&want===r.act&&r.d<=40&&r.n===1;if(!ok){bad++;console.log('CHECK',r.sh,r.tag,r.k,'engine='+(r.act<0?'R':'N'),'drawing='+(r.txt||'WALA'),'dist='+r.d,'texts<80='+r.n)}}
console.log('PID/PIDV: '+R.length+' | R: '+R.filter(r=>r.act<0).length+' | N: '+R.filter(r=>r.act>0).length+' | dapat suriin: '+bad);await browser.close()})();
