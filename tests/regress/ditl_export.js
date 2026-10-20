// 2.5.0-beta.10 (user: "PANO DITL? YUNG PDF REFERENCE ... PAG NAINTINDIHAN MO ANG FLOW AS PDF. KAPAREHA DAPAT NG SA APP"):
// writes the app's reading of every DITL sheet as plain text, one file per sheet, so it can be compared with the drawing PDF:
//  - every row: FROM / input text / signal (left) and signal / output text / TO (right);
//  - every output row: the logic that drives it, traced back through the gates to the input rows
//    (AND / OR / NOT / FF set-reset (reset wins) / timer / comparator / pulse), as the simulation computes it.
// Usage: node tests/regress/ditl_export.js <outdir> [html]
const {open}=require('./lib.js');const fs=require('fs'),path=require('path');
const out=process.argv[2];const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);fs.mkdirSync(out,{recursive:true});
await page.evaluate(()=>AN.setCat('dig'));await page.waitForTimeout(500);
const all=await page.evaluate(()=>{const res=[];
 for(let si=0;si<S.sheets.length;si++){const s=S.sheets[si];if(!s.nl||s.nl.v!==10){s.nl=netlist(s)}const nl=s.nl;if(!nl)continue;
  const cell=(i,c)=>(s.cells[i+':'+c]||[]).map(x=>x.t).join(' ').replace(/\s+/g,' ').trim();
  const rows=s.rows.map((r,i)=>({n:r.n,F:cell(i,'F'),L:cell(i,'L'),T:cell(i,'T'),S:cell(i,'S'),RS:cell(i,'RS'),RL:cell(i,'RL'),RT:cell(i,'RT')}));
  const srcOf=new Map();nl.src.forEach(z=>{if(!srcOf.has(z.n))srcOf.set(z.n,[]);srcOf.get(z.n).push(z.row)});
  (nl.mir||[]).forEach(m=>{if(!srcOf.has(m.n))srcOf.set(m.n,[]);});
  const drv=new Map();nl.gates.forEach((g,gi)=>(g.out||[]).forEach(n=>{if(!drv.has(n))drv.set(n,[]);drv.get(n).push(gi)}));
  const fx=new Set([...(nl.fx||[])]);const used=new Map();
  const rlab=i=>'IN'+s.rows[i].n;
  const gname=g=>{if(g.t==='TMR'){const t=g.tm||{},fv=t.fv;const k=g.k==='on'?'ON-DELAY':g.k==='off'?'OFF-DELAY':g.k==='pulse'?'PULSE':g.k==='npulse'?(g.nc?'N.C.CONTACT':'FALL-PULSE'):g.k;let sec='';try{sec=' '+tmSecs(t)+' s'}catch(e){}return k+sec}
   if(g.t==='CMP')return 'CMP('+g.cmp+(g.eq?'=':'')+' '+(g.sptxt||g.sp)+(g.unit?' '+g.unit:'')+')';return g.t};
  const ex=(n,d,seen)=>{if(fx.has(n))return '1';const r=srcOf.get(n);const G=drv.get(n)||[];const parts=[];
   if(r&&r.length)parts.push(r.map(rlab).join('|'));
   (nl.mir||[]).filter(m=>m.n===n).forEach(m=>parts.push('MIRROR'+s.rows[m.row].n));
   if(seen.has(n))return '↺n'+n;if(d>14)return '…n'+n;const sn=new Set(seen);sn.add(n);
   for(const gi of G){const g=nl.gates[gi];
    if(g.t==='FF')parts.push('FF[S:'+(g.s.map(x=>ex(x,d+1,sn)).join(' OR ')||'-')+' ; R:'+(g.r.map(x=>ex(x,d+1,sn)).join(' OR ')||'-')+']');
    else if(g.t==='CMP')parts.push(gname(g)+'{'+(g.ins.map(x=>{const a=(nl.an||[]).find(z=>z.net===x);return a?(a.key||'')+' '+(a.lab||a.t||''):'n'+x}).join(',')+'}'));
    else parts.push(gname(g)+'('+g.ins.map(x=>ex(x,d+1,sn)).join(', ')+')');}
   if(!parts.length)return 'NOTHING(n'+n+')';return parts.length>1?'WIRED-OR('+parts.join(', ')+')':parts[0]};
  const outs=[];const seenRow=new Set();
  nl.outs.forEach(o=>{const k=o.row+':'+o.n;if(seenRow.has(k))return;seenRow.add(k);outs.push({row:s.rows[o.row].n,e:ex(o.n,0,new Set())})});
  const mv=(nl.mv||[]).map(b=>({fb:b.fb.map(f=>f.ty+'@'+(f.row>=0?s.rows[f.row].n:'?'))}));
  res.push({name:s.name,rows,outs,gates:nl.gates.reduce((a,g)=>(a[g.t]=(a[g.t]||0)+1,a),{}),mv,inst:!!(s._inst&&s._inst.k)})}
 return res});
const idx=[];
for(const s of all){const f=s.name.replace(/[^\w\-().]/g,'_')+'.txt';idx.push(s.name+'\t'+f);
 const L=['SHEET '+s.name,'GATES '+JSON.stringify(s.gates)+(s.mv.length?' MOTOR/VALVE BLOCKS '+JSON.stringify(s.mv):''),'','ROWS (n | FROM | input text | sig || sig | output text | TO)'];
 for(const r of s.rows){if(!(r.F||r.L||r.T||r.S||r.RS||r.RL||r.RT))continue;L.push(r.n+' | '+[r.F,r.L,r.T,r.S].filter(Boolean).join(' / ')+' || '+[r.RS,r.RL,r.RT].filter(Boolean).join(' / '))}
 L.push('','OUTPUT LOGIC (INn = input row n; the output row is ON when the expression is 1)');for(const o of s.outs)L.push('OUT'+o.row+' = '+o.e);
 fs.writeFileSync(path.join(out,f),L.join('\n')+'\n')}
fs.writeFileSync(path.join(out,'INDEX.tsv'),idx.join('\n')+'\n');
console.log('sheets '+all.length+(errs.length?' errors '+errs.slice(0,2).join(' | '):''));await browser.close()})();
