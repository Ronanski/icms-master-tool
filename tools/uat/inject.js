// Builds the UAT scenarios from the simulator (expected values) and injects the data and the panel into the html.
// Usage: node tools/uat/inject.js [html]   (idempotent: an earlier block is replaced)
const fs=require('fs');const {open}=require('../regress/lib');
const html=process.argv[2]||fs.readdirSync('.').find(x=>/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x));
const ver=html.match(/v(\d+\.\d+\.\d+)/)[1];
const MARK_A='<!--UAT-BEGIN-->',MARK_B='<!--UAT-END-->';
let src=fs.readFileSync(html,'utf8');const i=src.indexOf(MARK_A);if(i>=0){const j=src.indexOf(MARK_B);src=src.slice(0,i)+src.slice(j+MARK_B.length)}
const tmp=html.replace(/\.html$/,'.clean.tmp.html');fs.writeFileSync(tmp,src);
(async()=>{const {browser,page}=await open(tmp);
const data=await page.evaluate(()=>{
 const fmt=x=>Math.abs(x)>=100?x.toFixed(0):Math.abs(x)>=10?x.toFixed(1):x.toFixed(2);
 const out={};
 for(const sh of AN.sheets){if(/^ABC-000/.test(sh.name))continue;const S=AN.ensure(sh);
  const named={};for(const k in S.lab){const l=S.lab[k];if(l&&l.t){const t=l.t.trim();if(/^[A-Z][A-Za-z0-9.\-]{3,}$/.test(t)&&!/^(FROM|SIG|TO|AND|NOT|LINK)/i.test(t))named[+k]=t}}
  const aoList=[];for(const b of S.blk.filter(q=>q.k==='AO')){let best=null,bd=1e9;for(const t of S.tx){if(!/^AO\d{3,4}/.test(t.t.trim()))continue;const d=Math.hypot(b.cx-t.x,b.cy-t.y);if(d<bd){bd=d;best=t.t.trim().split(/\s+/)[0]}}if(best&&bd<60&&b.i[0]!=null){named[b.i[0]]=best;aoList.push(b.i[0])}}
  const run=(sc,secs)=>{AN.reset();S.rt.force={};for(const n in sc.force)S.rt.force[n]=sc.force[n];for(const n in sc.ext)S.rt.ext[n]=sc.ext[n];for(const id in sc.fm){const st=S.rt.st[id];if(st)st.fm=sc.fm[id]}for(let i=0;i<secs*4;i++)AN.stepSet(sh,.25);const v={};for(const n in named)v[n]=S.rt.v[n];return v};
  const tolOf=v=>Math.max(0.05,Math.abs(v)*0.05);
  const L=[];const base=run({force:{},ext:{},fm:{}},12);
  L.push({n:'1. Normal, walang force',s:'Walang ifo-force. Plant model naka-on. Hintayin ang 12 s.',secs:12,force:{},ext:{},fm:{},rows:aoList.slice(0,3).map(n=>({k:n,t:named[n],v:base[n],tol:tolOf(base[n])}))});
  if(!L[0].rows.length)L[0].rows=Object.keys(named).slice(0,2).map(n=>({k:+n,t:named[n],v:base[n],tol:tolOf(base[n])}));
  const dig=[];for(const n of S.ext){if(!S.nets[n].dig)continue;const l=S.lab[n]&&S.lab[n].t&&S.lab[n].t.trim();if(l&&/^[A-Z][A-Za-z0-9.\-]{3,}$/.test(l)&&!/^(FROM|SIG)/i.test(l))dig.push([n,l])}
  let used=0;
  for(const [n,l] of dig){if(used>=2)break;const sc={force:{[n]:1},ext:{},fm:{}};const v1=run(sc,10);const ch=[];for(const k in named){if(+k===n)continue;const a=base[k],b=v1[k];if(!isFinite(a)||!isFinite(b))continue;if(Math.abs(a-b)>0.01*Math.max(1,Math.abs(a)))ch.push(+k)}
   if(!ch.length)continue;ch.sort((x,y)=>(/^(AO|M\.|SI|SO)/.test(named[y])?1:0)-(/^(AO|M\.|SI|SO)/.test(named[x])?1:0));
   const seen=new Set(),rows=[];for(const k of ch){if(seen.has(named[k]))continue;seen.add(named[k]);rows.push({k,t:named[k],v:v1[k],tol:tolOf(v1[k])});if(rows.length>=4)break}
   L.push({n:(used+2)+'. Kondisyon: '+l+' = 1',s:'Ang SETUP ay nagfo-force ng '+l+' = 1 (naka-reset, naka-RUN). Hintayin ang 10 s.',secs:10,force:sc.force,ext:{},fm:{},rows});used++}
  for(const b of S.blk.filter(z=>z.k==='PID'&&z.proc&&z.proc.on)){const q=AN.anPins(S,b);if(!q||q.sv==null||q.pv==null||q.pv<0||!S.ext.includes(q.sv))continue;const tag=(b.txt||[])[1];if(!tag||/^X+-/.test(tag))continue;
   const P=b.p,lo=P.rlo!=null?P.rlo:0,hi=P.rhi!=null?P.rhi:100,mid=lo+.5*(hi-lo),span=Math.max(1e-9,hi-lo);
   const amt=S.blk.filter(z=>(z.k==='AMT'||z.k==='SW')&&(b.o.includes(z.a)||b.o.includes(z.b)))[0];const fm={};if(amt)fm[amt.id]=b.o.includes(amt.a)?'A':'B';
   const sc={force:{},ext:{[q.sv]:mid},fm};
   named[q.pv]=tag+'.PV';named[b.o[0]]=tag+'.MV';
   AN.reset();S.rt.ext[q.sv]=mid;for(const id in fm){const st=S.rt.st[id];if(st)st.fm=fm[id]}for(let i=0;i<240;i++)AN.stepSet(sh,.25);const pv0=S.rt.v[q.pv];for(let i=0;i<240;i++)AN.stepSet(sh,.25);const pv1=S.rt.v[q.pv],mv=S.rt.v[b.o[0]];
   if(!(Math.abs(pv1-pv0)>0.03*span&&Math.abs(pv1-mid)<Math.abs(pv0-mid)))continue;
   L.push({n:(used+2)+'. Loop '+tag+' sa AUTO',s:'Ang SETUP ay naglalagay ng '+tag+' sa AUTO (A) at ng SV = '+fmt(mid)+(P.unit?' '+P.unit:'')+'. Hintayin ang 120 s (maaaring i-speed up sa taas).',secs:120,force:{},ext:sc.ext,fm,rows:[{k:q.pv,t:tag+'.PV (SV '+fmt(mid)+')',v:pv1,tol:Math.max(0.1*span,0.05)},{k:b.o[0],t:tag+'.MV %',v:mv,tol:Math.max(10,Math.abs(mv)*.15)}]});break}
  // ---- commissioning checks (loop-check style), each one is a scenario that the AUTO-TEST runs by itself
  const addSc=(n,sx,secs,force,rows)=>L.push({n,s:sx,secs,force,ext:{},fm:{},rows});
  let nSw=0;for(const b of S.blk.filter(z=>(z.k==='SW'||z.k==='AMT')&&!z.q4&&!z.latch&&!(z.cs&&z.cs.length>1)&&z.sel>=0&&z.a>=0&&z.b>=0&&z.o[0]!=null)){if(nSw>=2)break;nSw++;
   for(const leg of [0,1]){const f={[b.a]:11,[b.b]:22,[b.sel]:leg};const v=run({force:f,ext:{},fm:{}},3);const o=S.rt.v[b.o[0]];if(!isFinite(o))continue;
    L.push({n:'Switch #'+b.id+': select = '+leg,s:'Ang SETUP ay nagfo-force ng input A = 11, input B = 22 at select = '+leg+' ng switch #'+b.id+'. Dapat ang output ay ang napiling leg.',secs:3,force:f,ext:{},fm:{},rows:[{k:b.o[0],t:'Output ng switch #'+b.id+' (A=11, B=22)',v:o,tol:0.05}]})}}
  let nFx=0;for(const b of S.blk.filter(z=>z.k==='FX'&&z.p&&z.p.tbl&&z.i[0]!=null&&z.o[0]!=null)){if(nFx>=2)break;nFx++;const pts=b.p.tbl.pts;const xs=[pts[Math.floor(pts.length/2)],pts[pts.length-3]].filter(Boolean);
   for(const pt of xs){const x=pt[0];const f={[b.i[0]]:x};run({force:f,ext:{},fm:{}},3);const o=S.rt.v[b.o[0]];if(!isFinite(o))continue;
    L.push({n:'Curve '+b.p.ln+': input = '+fmt(x),s:'Ang SETUP ay nagfo-force ng input ng F(X) '+b.p.ln+' = '+fmt(x)+'. Ang output ay sumusunod sa curve ng workbook (linear-curves-fx.xls).',secs:3,force:f,ext:{},fm:{},rows:[{k:b.o[0],t:'Output ng F(X) '+b.p.ln,v:o,tol:tolOf(o)}]})}}
  let nCm=0;for(const b of S.blk.filter(z=>(z.k==='LC'||z.k==='HC')&&z.p&&isFinite(z.p.sp)&&z.i[0]!=null&&z.o[0]!=null)){if(nCm>=2)break;nCm++;const d=Math.max(1,Math.abs(b.p.sp)*0.1);
   for(const [lab,x] of [['mababa ng set point',b.p.sp-d],['mataas sa set point',b.p.sp+d]]){const f={[b.i[0]]:x};run({force:f,ext:{},fm:{}},3);const o=S.rt.v[b.o[0]];if(!isFinite(o))continue;
    L.push({n:'Comparator '+(b.p.op||'')+' '+b.p.sp+(b.p.u?' '+b.p.u:'')+': '+lab,s:'Ang SETUP ay nagfo-force ng input = '+fmt(x)+' ('+lab+' '+b.p.sp+'). Dapat 1 kung totoo ang kondisyon, 0 kung hindi.',secs:3,force:f,ext:{},fm:{},rows:[{k:b.o[0],t:'Output ng comparator '+(b.p.op||'')+' '+b.p.sp,v:o,tol:0.05}]})}}
  let nTm=0;for(const b of S.blk.filter(z=>(z.k==='TON'||z.k==='TOF'||z.k==='TPS')&&z.p&&z.p.sec>0&&z.p.sec<=20&&z.i[0]!=null&&z.o[0]!=null&&!(S.pre&&S.pre[z.o[0]])&&!(S.multi&&S.multi[z.o[0]]))){if(nTm>=2)break;nTm++;const secs=Math.ceil(b.p.sec)+1;const f={[b.i[0]]:1};run({force:f,ext:{},fm:{}},secs);const o=S.rt.v[b.o[0]];if(!isFinite(o))continue;
   L.push({n:b.k+' '+b.p.sec+' s (#'+b.id+')',s:'Ang SETUP ay nagfo-force ng input ng timer = 1. Pagkalipas ng '+secs+' s (lampas sa '+b.p.sec+' s) ay dapat ganito ang output.',secs,force:f,ext:{},fm:{},rows:[{k:b.o[0],t:'Output ng '+b.k+' '+b.p.sec+' s',v:o,tol:0.05}]})}
  for(const sc of L)if(/^(Switch|Curve|Comparator|TON|TOF|TPS)/.test(sc.n))sc.det=1;
  const swb=S.blk.filter(b=>b.k==='SW'||b.k==='AMT')[0];
  if(swb){const pin=swb.pins.find(p=>p.role==='out');AN.reset();for(let i=0;i<48;i++)AN.stepSet(sh,.25);const pk=S.rt.st[swb.id]&&S.rt.st[swb.id].pk;if(pk&&swb.o[0]!=null)L.push({n:'Kulay ng linya',s:'Tingnan ang unang switch (T o A/M). Pindutin ang 📍 para makita ito sa diagram.',secs:0,force:{},ext:{},fm:{},rows:[{k:swb.o[0],t:'Output ng switch (napili ang leg '+pk+')',v:S.rt.v[swb.o[0]],tol:tolOf(S.rt.v[swb.o[0]])}],look:`Tingnan: DILAW at maliwanag ang linya ng leg ${pk}, ABO ang kabilang leg. Kapag lumipat ang switch, magpapalit ang kulay.`})}
  AN.reset();out[sh.name]=L}
 return out});
await browser.close();fs.unlinkSync(tmp);
const block=MARK_A+'<script id="uatdata" type="application/json">'+JSON.stringify({ver,sheets:data}).replace(/</g,'\\u003c')+'</script><script id="uatui">'+fs.readFileSync(__dirname+'/uat-ui.js','utf8')+'</script>'+MARK_B;
const k=src.lastIndexOf('</body>');fs.writeFileSync(html,src.slice(0,k)+block+src.slice(k));
const n=Object.values(data).reduce((a,l)=>a+l.length,0);console.log(html,Object.keys(data).length+' sheets,',n+' scenarios')})();
