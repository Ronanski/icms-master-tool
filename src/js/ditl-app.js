
const NS='http://www.w3.org/2000/svg',$=id=>document.getElementById(id);const BV=28;/* v23: dash-dot (CEN) analog wires are part of the netlist -> built-in sheets re-exported *//* parser version: sheets imported with an older version keep old geometry/text and must be imported again */
let S={sheets:[],cur:0},hist=[],fut=[],sel=null,VB={},SIM=false;const LEFT=['F','L','T','S'];
try{const j=localStorage.getItem('ditl.v1');if(j)S=JSON.parse(j)}catch(e){}
const dec=s=>s.replace(/\\+U\+([0-9A-Fa-f]{4})/g,(m,h)=>String.fromCharCode(parseInt(h,16))).replace(/%%%/g,'%').replace(/%%[cC]/g,'Ø').replace(/%%[dD]/g,'°').replace(/%%[pP]/g,'±');
const cur=()=>S.sheets[S.cur];
/* ---------- DXF parse ---------- */
const SYM={LAMP1:'lamp','0LAMP1':'lamp',SOLENOID:'solenoid',LSWITCH:'limit',ICD130:'icd',SIGHI:'hi',SIGLO:'lo','0SIGHI':'hi','0SIGLO':'lo','0ADJ':'adj',LEADER:'leader'},SKIPB=/^(00_FORM|WMF6|test|GENAXEH|ACAD)/i;
const NLY=l=>/I-(WIRE|INST)$/i.test(l)?'CON':/I-TEXT$/i.test(l)?'TXT1':l;
const mul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]],ap=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
function explode(E,B,OFF){OFF=OFF||new Set();const out=[];out.S=[];
 const go=(ents,M,pl,sym,d)=>{let lastN=null;for(const e of ents){const g=e.g,N=k=>+g[k];
  if(e.t==='SEQEND')lastN=null;
  if(OFF.has(e.l))continue;
  if(e.t==='ATTRIB'&&d===0&&lastN==='0NO'&&g[1]!=null&&String(g[1]).trim()!==''){/* v17: the number of a numbered connector circle is the ATTRIB of block 0NO (it was skipped, the circles looked empty) */const o={t:'TEXT',l:NLY(e.l==='0'?pl:e.l),g:{1:g[1],10:N(10),20:N(20),40:N(40)||2,50:0,72:g[72],73:g[74]!=null?g[74]:g[73]},p:[]};if(g[11]!=null){o.g[11]=N(11);o.g[21]=N(21)}out.push(o);continue}
  if(e.t==='INSERT'){lastN=g[2];const n=g[2],b=B[n];if(!b||SKIPB.test(n)||d>6)continue;const a=(N(50)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),sx=g[41]!=null?N(41):1,sy=g[42]!=null?N(42):1;
   const M2=mul(M,mul([1,0,0,1,N(10)||0,N(20)||0],mul([c,s,-s,c,0,0],mul([sx,0,0,sy,0,0],[1,0,0,1,-b.b[0],-b.b[1]]))));
   if(SYM[n]&&!sym){const q=ap(M,N(10)||0,N(20)||0);out.S.push({k:SYM[n],n,x:q[0],y:q[1]})}
   go(b.e,M2,e.l==='0'?pl:e.l,sym||SYM[n]||null,d+1);continue}
  if(/^(ATTRIB|ATTDEF|SEQEND|VIEWPORT)$/.test(e.t))continue;
  const l0=e.l==='0'?pl:e.l;if(l0==='VPORTS'||OFF.has(l0))continue;const o={t:e.t,l:sym?'SYM':NLY(l0),g:{},p:[]},sc=Math.hypot(M[0],M[1]),rot=Math.atan2(M[1],M[0])*180/Math.PI,det=M[0]*M[3]-M[1]*M[2];
  if(e.t==='LINE'){const A=ap(M,N(10),N(20)),C=ap(M,N(11),N(21));Object.assign(o.g,{10:A[0],20:A[1],11:C[0],21:C[1]})}
  else if(e.t==='LWPOLYLINE'){o.p=e.p.map(q=>ap(M,q[0],q[1]));o.g[70]=g[70];o.g[43]=Math.max(N(43)||0,N(40)||0,N(41)||0)*sc}
  else if(e.t==='CIRCLE'){const A=ap(M,N(10),N(20));Object.assign(o.g,{10:A[0],20:A[1],40:N(40)*sc})}
  else if(e.t==='ARC'){const r=N(40),cx=N(10),cy=N(20),A=ap(M,cx,cy),an=d=>{const q=ap(M,cx+r*Math.cos(d*Math.PI/180),cy+r*Math.sin(d*Math.PI/180));return(Math.atan2(q[1]-A[1],q[0]-A[0])*180/Math.PI+360)%360};
   let a0=an(N(50)),a1=an(N(51));if(det<0)[a0,a1]=[a1,a0];Object.assign(o.g,{10:A[0],20:A[1],40:r*sc,50:a0,51:a1})}
  else if(e.t==='SOLID'){for(const[kx,ky]of[[10,20],[11,21],[12,22],[13,23]])if(g[kx]!=null){const q=ap(M,N(kx),N(ky));o.g[kx]=q[0];o.g[ky]=q[1]}}
  else if(e.t==='TEXT'){const A=ap(M,N(10),N(20));Object.assign(o.g,{1:g[1],10:A[0],20:A[1],40:(N(40)||2.5)*sc,50:(N(50)||0)+rot,72:g[72],73:g[73]});
   if(g[11]!=null){const q=ap(M,N(11),N(21));o.g[11]=q[0];o.g[21]=q[1]}}
  else continue;
  out.push(o)}};
 go(E,[1,0,0,1,0,0],'0',null,0);return out}
function parse(txt){
 const L=txt.split(/\r?\n/),E=[],B={},LY={};let sec='',c0=null,cb=null,ly=null;
 for(let i=0;i+1<L.length;i+=2){const c=L[i].trim(),v=L[i+1].trim();
  if(c==='0'){
   if(v==='SECTION'){sec=(L[i+3]||'').trim();c0=null;cb=null;continue}
   if(v==='ENDSEC'){sec='';c0=null;cb=null;continue}
   if(sec==='TABLES'){ly=v==='LAYER'?{}:null;if(ly)(LY.list=LY.list||[]).push(ly);continue}
   if(sec==='BLOCKS'){if(v==='BLOCK'){cb={n:null,b:[0,0],e:[]};c0=null}else if(v==='ENDBLK'){cb=null;c0=null}else if(cb){c0={t:v,l:'0',g:{},p:[]};cb.e.push(c0)}continue}
   if(sec==='ENTITIES'){c0={t:v,l:'0',g:{},p:[]};E.push(c0)}continue}
  if(sec==='TABLES'&&ly){if(c==='2'&&ly.n==null)ly.n=v;else if(c==='62')ly.c=+v;else if(c==='70')ly.f=+v;continue}
  if(sec==='BLOCKS'&&cb&&!c0){if(c==='2'&&cb.n===null){cb.n=v;B[v]=cb}else if(c==='10')cb.b[0]=+v;else if(c==='20')cb.b[1]=+v;continue}
  if(!c0)continue;
  if(c==='8')c0.l=v;
  else if(c0.t==='LWPOLYLINE'&&c==='10')c0.p.push([+v,0]);
  else if(c0.t==='LWPOLYLINE'&&c==='20'&&c0.p.length)c0.p[c0.p.length-1][1]=+v;
  else if(!(c in c0.g))c0.g[c]=v}
 /* v10: layers that are OFF (negative color) or FROZEN are not shown in the PDF: skip them (DCS placeholders M., I.0000, (S1) I.0091 ... and chinese) */
 const off=new Set((LY.list||[]).filter(l=>l.n&&(l.c<0||(l.f&1))).map(l=>l.n));return explode(E,B,off)}
function build(E,name){
 const raw={ln:[],pl:[],ci:[],ar:[],so:[],lamp:[]},tx=[];
 for(const e of E){const g=e.g,l=e.l,n=k=>+g[k];if(l.toLowerCase()==='chinese')continue;
  if(e.t==='LINE')raw.ln.push([n(10),n(20),n(11),n(21),l]);
  else if(e.t==='LWPOLYLINE')raw.pl.push([e.p,(+g[70]||0)&1,l,Math.max(+g[43]||0,+g[40]||0,+g[41]||0)]);
  else if(e.t==='CIRCLE')raw.ci.push([n(10),n(20),n(40),l]);
  else if(e.t==='ARC')raw.ar.push([n(10),n(20),n(40),n(50),n(51),l]);
  else if(e.t==='SOLID'){const p3=g[13]!=null?[n(13),n(23)]:[n(12),n(22)];raw.so.push([[[n(10),n(20)],[n(11),n(21)],p3,[n(12),n(22)]],l])}
  else if(e.t==='TEXT'){const t=dec(g[1]||'').trim();if(!t||/[\u3000-\u9fff]/.test(t))continue;
   const a=+g[72]||0,b=+g[73]||0,al=a||b;
   tx.push({t,ix:n(10),iy:n(20),x:al&&g[11]!=null?n(11):n(10),y:al&&g[21]!=null?n(21):n(20),h:n(40)||2.5,r:n(50)||0,a,b,l})}}
 const lc={};const CK=['HID','CEN','DCS','SYM','TXT1'];raw.ln.forEach(q=>{if(!CK.includes(q[4])&&(Math.abs(q[0]-q[2])<.05||Math.abs(q[1]-q[3])<.05)&&Math.hypot(q[0]-q[2],q[1]-q[3])<130)lc[q[4]]=(lc[q[4]]||0)+1});
 let lyr='';if((lc.CON||0)<5){const b=Object.keys(lc).sort((a,c)=>lc[c]-lc[a])[0];if(b&&lc[b]>=10){lyr=b;raw.ln.forEach(q=>{if(q[4]===b)q[4]='CON'});raw.pl.forEach(q=>{if(q[2]===b)q[2]='CON'});raw.so.forEach(q=>{if(q[1]===b)q[1]='CON'});raw.ar.forEach(q=>{if(q[5]===b)q[5]='CON'});raw.ci.forEach(q=>{if(q[3]===b)q[3]='CON'})}}
 /* v10: a few wires are drawn on the text layer (e.g. DITL-69 OR outputs at x=228-232): an orthogonal text-layer line chained to a wire = wire */
 {const o=q=>(Math.abs(q[0]-q[2])<.05||Math.abs(q[1]-q[3])<.05)&&Math.hypot(q[0]-q[2],q[1]-q[3])>.3,tl=raw.ln.filter(q=>(q[4]==='TXT1'||q[4]==='0')&&Math.hypot(q[0]-q[2],q[1]-q[3])<215&&o(q)),/* v27: long text-layer wires (DITL-76 / 77 vertical 132 long); they are chained only when they touch a wire end */tc=(x,y,c)=>Math.min(c[0],c[2])-.35<=x&&x<=Math.max(c[0],c[2])+.35&&Math.min(c[1],c[3])-.35<=y&&y<=Math.max(c[1],c[3])+.35;
  const CI=raw.ci.filter(c=>c[3]==='CON'),SO=raw.so.filter(z=>z[1]==='CON').map(z=>{const xs=z[0].map(p=>p[0]),ys=z[0].map(p=>p[1]);return[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]}),
   onC=(x,y)=>CI.some(c=>Math.abs(Math.hypot(x-c[0],y-c[1])-c[2])<.4),onS=(x,y)=>SO.some(b=>x>=b[0]-.35&&x<=b[2]+.35&&y>=b[1]-.35&&y<=b[3]+.35),hit=(q,C)=>[[q[0],q[1]],[q[2],q[3]]].map(([x,y])=>C.some(c=>tc(x,y,c))||onC(x,y)||onS(x,y));
  const PE=[];raw.pl.forEach(([p,c,l])=>{if(l!=='CON')return;const m=p.length+(c&&p.length>2?1:0);for(let i=0;i+1<m;i++){const A=p[i],B=p[(i+1)%p.length];PE.push([A[0],A[1],B[0],B[1],'CON'])}});/* v16: edges of CON boxes (S/R, AND) also seed the chain, so output wires drawn on the text layer are found */
  for(let ch=1,it=0;ch&&it<10;it++){ch=0;const C=raw.ln.filter(q=>q[4]==='CON').concat(PE);for(const q of tl){if(q[4]!=='TXT1'&&q[4]!=='0')continue;const h=hit(q,C);if(h[0]&&h[1]||((h[0]||h[1])&&C.some(c=>tc(q[0],q[1],c)||tc(q[2],q[3],c)))){q[4]='CON';ch=1}}}}
 const isN=t=>/^\d+$/.test(t.t),cl=[];tx.filter(isN).forEach(t=>{const c=cl.find(c=>Math.abs(c.x-t.ix)<2.6);/* v20: one-digit and two-digit row numbers differ by ~2 in x (DITL-111 rows 4..8 were lost) */c?c.m.push(t):cl.push({x:t.ix,m:[t]})});
 const pit=c=>{const y=c.m.map(t=>t.iy).sort((a,b)=>b-a).map((v,i,a)=>i?a[i-1]-v:0).slice(1).sort((a,b)=>a-b);return y.length&&Math.abs(y[y.length>>1]-9)<.6},
  good=cl.filter(c=>c.m.length>=5&&pit(c)).sort((a,b)=>a.x-b.x),gl=good[0],gr=gl&&good.length>1&&good[good.length-1].x-gl.x>200?good[good.length-1]:null;
 let Ln=gl?gl.m:tx.filter(t=>isN(t)&&t.ix<100),Rn=gr?gr.m:tx.filter(t=>isN(t)&&t.ix>300&&t.ix<400);Ln=Ln.slice().sort((a,b)=>b.iy-a.iy);
 if(!Ln.length)return null;
 const avg=a=>a.reduce((s,t)=>s+t.ix,0)/a.length,x0=avg(Ln),x1=Rn.length?avg(Rn):x0+316.2;
 const rows=Ln.map(t=>({n:+t.t,y:t.iy})),skip=new Set([...Ln,...Rn]);
 const yv=rows.map(r=>r.y),span=Math.max(...yv)+9-Math.min(...yv),fx=[];raw.ln.forEach(q=>{if(Math.abs(q[0]-q[2])<.05&&Math.abs(q[3]-q[1])>span*.6)fx.push(q[0])});
 /* v12b: column lines drawn as many short dashed pieces (new template) count too: sum the vertical pieces per x */
 const fv=fx.slice();{const G={};raw.ln.forEach(q=>{if(Math.abs(q[0]-q[2])<.05){const k=Math.round(q[0]*5)/5;G[k]=(G[k]||0)+Math.abs(q[3]-q[1])}});for(const k in G)if(G[k]>span*.6&&!fv.some(f=>Math.abs(f-k)<.3))fv.push(+k)}
 const snv=x=>{let b=x,d=4;fv.forEach(f=>{if(Math.abs(f-x)<d){d=Math.abs(f-x);b=f}});return b};
 const sn=x=>{let b=x,d=2.5;fx.forEach(f=>{if(Math.abs(f-x)<d){d=Math.abs(f-x);b=f}});return b};
 const LC=[-35.9,-15.2,-1.7,7.3,29.8,74.8].map(d=>sn(x0+d)),RC=[-43.4,-2.9,6.1,19.6,37.9].map(d=>sn(x1+d));
 const LV=LC.map(snv),RV=RC.map(snv),vr={F:[LV[0],LV[1]],L:[LV[1],LV[2]],T:[LV[2],LV[4]],S:[LV[4],LV[5]],RS:[RV[0],RV[1]],RL:[RV[2],RV[3]],RT:[RV[3],RV[4]]};/* v12b: visual cell boxes snapped to the real dashed column lines (logic still uses rng) */
 const rng={F:[LC[0],LC[1]],L:[LC[1],LC[2]],T:[LC[2],LC[4]],S:[LC[4],LC[5]],RS:[RC[0],RC[1]],RL:[RC[2],RC[3]],RT:[RC[3],RC[4]]};
 const cells={},rest=[];
 for(const t of tx){if(skip.has(t)){rest.push(t);continue}
  let ri=rows.findIndex(r=>t.y>=r.y-3.3&&t.y<r.y+5.7);if(ri<0)ri=rows.findIndex(r=>t.iy>=r.y-3.3&&t.iy<r.y+5.7);let col=null;
  if(ri>=0){for(const k in rng)if(t.ix>=rng[k][0]&&t.ix<rng[k][1]){col=k;break}
   if(!col)for(const k in rng)if(t.x>=rng[k][0]&&t.x<rng[k][1]){col=k;break}}
  if(col){(cells[ri+':'+col]=cells[ri+':'+col]||[]).push(t)}else rest.push(t)}
 for(const k in cells)cells[k].sort((a,b)=>b.y-a.y);
 /* v12b: row band = between the real horizontal row lines (dashed) around each row, so highlights stay inside the row */
 const HY={};raw.ln.forEach(q=>{if(q[4]==='HID'&&Math.abs(q[1]-q[3])<.05&&Math.min(q[0],q[2])<LV[5]&&Math.max(q[0],q[2])>LV[4]){/* v17: only the dashed row separators (layer HID); a wire that starts at the cell edge was cutting the shading in half */const k=(Math.round(q[1]*10)/10).toFixed(1);HY[k]=1}});const hy=Object.keys(HY).map(Number).sort((a,b)=>a-b);
 const rb=rows.map(r=>{const c=r.y+1.2,dn=hy.filter(y=>y<c&&c-y<7).pop(),up=hy.find(y=>y>c&&y-c<7);return dn!==undefined&&up!==undefined&&up-dn>5&&up-dn<11?[dn,up]:[r.y-3.3,r.y+5.7]});
 
 /* v26: the sheet content lines of the title block (bottom of the drawing: 1 line on old sheets, 3 lines on new ones) */
 const title=(()=>{const D=rest.find(t=>/^DITL-/i.test(t.t)&&t.x>380);const yd=D?-D.y:300.9;/* the drawing-number text sits in the same row band as the title block; its y changes with the page placement */
  const L=rest.filter(t=>t.x>112&&t.x<222&&(-t.y)>yd-13&&(-t.y)<yd+8&&!/^(TON|TPS|SHT|DWG|DITL)/i.test(t.t)&&!/^\d+(\.\d+)?\s*(secs?|s)?$/i.test(t.t)&&!/^[IOM]\.[0-9A-F]{4}/.test(t.t)&&t.t.length>2).sort((a,b)=>b.y-a.y||a.x-b.x);
  const o=[];L.forEach(t=>{const v=t.t.trim();if(v&&!o.includes(v))o.push(v)});return o.join(' ').replace(/\s+/g,' ').trim()})();
 const sh={name,title,raw,tx:rest,rows,rng,vr,rb,cells,sig:{},syms:E.S||[],lyr,bv:BV};sh.nl=netlist(sh);return sh}
/* ---------- netlist + simulation ---------- */
/* v27: nets with two drivers (two gate outputs, or an input row and a gate) are a short between different signals: such a sheet is rebuilt with the strict T rule and that one is used when it has fewer shorts */
function mdCount(nl,sh){const d={};const add=(n,id)=>{(d[n]=d[n]||new Set()).add(id)};nl.src.forEach(z=>{if(LEFT.some(c=>(sh.cells[z.row+':'+c]||[]).length))add(z.n,'r'+z.row)});nl.gates.forEach((g,i)=>{if(g.t==='NOT'&&!g.done&&g.vert)return;(g.out||[]).forEach(n=>add(n,'g'+i))});return Object.values(d).filter(x=>x.size>1).length}
function netlist(sh){const a=netlistCore(sh,false),c=mdCount(a,sh);if(!c)return a;const b=netlistCore(sh,true);if(mdCount(b,sh)<c){b.strict=1;return b}return a}
function netlistCore(sh,strict){
 const r=sh.raw,S1=sh.rng.S[1],R0=sh.rng.RS[0],H=[],V=[],bars=[],dots=[],E=.4;
 const fr=[],plk={};for(const c in sh.rng)fr.push(sh.rng[c][0],sh.rng[c][1]);
 r.ln.forEach((q,k)=>{const[a,b,c,d,l]=q;if(l!=='CON'||(Math.hypot(a-c,b-d)>130&&Math.abs(a-c)<.05&&fr.some(x=>Math.abs(x-a)<.5)))return;
  if(Math.hypot(a-c,b-d)<.5)return;/* v21 / v27: zero-length or 0.4 long drawing noise (DITL-83, 102) */
  const dx=Math.abs(a-c),dy=Math.abs(b-d),ln=Math.hypot(dx,dy),sk=Math.min(dx,dy),isO=sk<.05||(sk<.25&&sk/ln<.02);/* v24: a wire drawn 0.06-0.2 off the grid over a long run is still a straight wire (DITL-06 reset bus 0.1 over 235; 03F, 03H, 17, 21E) */
  if(isO&&dy<dx)H.push({k,x1:Math.min(a,c),x2:Math.max(a,c),y:(b+d)/2});else if(isO)V.push({k,x:(a+c)/2,y1:Math.min(b,d),y2:Math.max(b,d)})});
 const addH=(k,a,b,y)=>{if(Math.abs(b-a)>.05)H.push({k,x1:Math.min(a,b),x2:Math.max(a,b),y})},addV=(k,x,a,b)=>{if(Math.abs(b-a)>.05)V.push({k,x,y1:Math.min(a,b),y2:Math.max(a,b)})};
 const tabT=sh.tx.filter(t=>/^TIMER SETTING$/i.test(t.t)),tabB=[];/* v18: the TIMER SETTING table frame (CON layer lines) is not a wire */
 tabT.forEach(t=>{const c=r.pl.filter(([p,cl])=>cl&&p.length>=4).map(([p])=>{const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);return{x1:Math.min(...xs),x2:Math.max(...xs),y1:Math.min(...ys),y2:Math.max(...ys)}}).filter(b=>t.x>=b.x1-.5&&t.x<=b.x2+.5&&t.y>=b.y1-.5&&t.y<=b.y2+.5).sort((a,b)=>(b.x2-b.x1)*(b.y2-b.y1)-(a.x2-a.x1)*(a.y2-a.y1))[0];
  if(c){tabB.push(c);return}const ls=r.ln.filter(q=>Math.abs(q[0]-t.x)<40&&Math.abs(q[1]-t.y)<35);if(ls.length>3){const xs=ls.flatMap(q=>[q[0],q[2]]),ys=ls.flatMap(q=>[q[1],q[3]]);tabB.push({x1:Math.min(...xs),x2:Math.max(...xs),y1:Math.min(...ys),y2:Math.max(...ys)})}});
 const inTab=(x,y)=>tabB.some(b=>x>=b.x1-.4&&x<=b.x2+.4&&y>=b.y1-.4&&y<=b.y2+.4);
 const fbx=sh.tx.filter(t=>/^COMM\.?$|^SV-/.test(t.t)),fbr=[];/* v9: a big closed rectangle around OPEN/CLOSE COMM. text = MOV function block outline (any layer), not a wire */
 r.pl.forEach(([p],k)=>{if(p.length<4||!fbx.length)return;const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]),b={k,x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};if(b.x1-b.x0>15&&b.y1-b.y0>15&&fbx.some(t=>t.x>b.x0&&t.x<b.x1&&t.y>b.y0&&t.y<b.y1))fbr.push(b)});
 r.pl.forEach(([p,c,l,w],k)=>{if(l!=='CON'||fbr.some(b=>b.k===k))return;
  if(p.length===2){const[a,b]=p,len=Math.hypot(a[0]-b[0],a[1]-b[1]);
   if(len<1.5){dots.push([(a[0]+b[0])/2,(a[1]+b[1])/2]);return}
   if(Math.abs(a[0]-b[0])<.05&&(w===undefined||w>0)){bars.push({k,x:a[0],y1:Math.min(a[1],b[1]),y2:Math.max(a[1],b[1])});return}}
  const m=p.length+(c&&p.length>2?1:0);plk[k]=[];
  for(let q=0;q+1<m;q++){const A=p[q],B=p[(q+1)%p.length],kk='p'+k+'_'+q;plk[k].push(kk);
   {const dx=Math.abs(A[0]-B[0]),dy=Math.abs(A[1]-B[1]),ln=Math.hypot(dx,dy),sk=Math.min(dx,dy);if(sk<.05||(sk<.25&&sk/ln<.02)){if(dy<dx)addH(kk,A[0],B[0],(A[1]+B[1])/2);else addV(kk,(A[0]+B[0])/2,A[1],B[1])}}}});
 /* v23: dash-dot (CEN) lines that are connected to the wiring are WIRES too (analog PV wires TT-/AI- running from an input row to the H/ and /L comparators, DITL-03F, 03H, 23A, 44). Box outlines, row separators and field boxes are closed loops / very long lines and stay out. */
 /* v25: the dash-dot frame of the input / output cell columns (a vertical line ON the cell edge x=S1 or x=R0, or a horizontal line that crosses the cell edge) is NOT a wire: it merged all input rows of DITL-09 into one net */
 const isEdge=q=>{const v=Math.abs(q[0]-q[2])<.3,h=Math.abs(q[1]-q[3])<.3;if(v)return Math.abs(q[0]-S1)<1.6||Math.abs(q[0]-R0)<1.6;if(h){const a=Math.min(q[0],q[2]),b=Math.max(q[0],q[2]);return (a<S1-2&&b>S1-3)||(a<R0+2&&b>R0+3&&a<R0-3)||(a<S1-2)||(b>R0+2)}return false};
 {const C=[];r.ln.forEach((q,k)=>{if(q[4]!=='CEN')return;const ort=Math.abs(q[0]-q[2])<.05||Math.abs(q[1]-q[3])<.05,len=Math.hypot(q[0]-q[2],q[1]-q[3]);if(!ort||len<.8||len>150)return;const x=(q[0]+q[2])/2;if(x<S1-6||x>R0+6)return;if(isEdge(q))return;C.push({k,q})});
  r.pl.forEach(([p,c,l],k)=>{if(l!=='CEN'||p.length<2)return;const m=p.length+(c&&p.length>2?1:0);for(let i=0;i+1<m;i++){const A=p[i],B=p[(i+1)%p.length],ort=Math.abs(A[0]-B[0])<.05||Math.abs(A[1]-B[1])<.05,len=Math.hypot(A[0]-B[0],A[1]-B[1]),x=(A[0]+B[0])/2;if(!ort||len<.8||len>150||x<S1-6||x>R0+6)continue;if(isEdge([A[0],A[1],B[0],B[1]]))continue;C.push({k:'p'+k+'_'+i,pk:k,q:[A[0],A[1],B[0],B[1]]})}});
  if(C.length){const P=C.map((_,i)=>i),f=i=>P[i]===i?i:(P[i]=f(P[i])),near=(a,b)=>[[a.q[0],a.q[1]],[a.q[2],a.q[3]]].some(p=>[[b.q[0],b.q[1]],[b.q[2],b.q[3]]].some(o=>Math.hypot(p[0]-o[0],p[1]-o[1])<.45))||[[a.q[0],a.q[1]],[a.q[2],a.q[3]]].some(p=>onL(p[0],p[1],b.q))||[[b.q[0],b.q[1]],[b.q[2],b.q[3]]].some(p=>onL(p[0],p[1],a.q)),
   onL=(x,y,q)=>x>=Math.min(q[0],q[2])-.35&&x<=Math.max(q[0],q[2])+.35&&y>=Math.min(q[1],q[3])-.35&&y<=Math.max(q[1],q[3])+.35;
   C.forEach((a,i)=>C.forEach((b,j)=>{if(j>i&&near(a,b))P[f(i)]=f(j)}));
   const conL=[...H.map(h=>[h.x1,h.y,h.x2,h.y]),...V.map(v=>[v.x,v.y1,v.x,v.y2])],gp={};C.forEach((c,i)=>(gp[f(i)]=gp[f(i)]||[]).push(c));
   for(const g of Object.values(gp)){const pts=[];g.forEach(c=>{pts.push([c.q[0],c.q[1]],[c.q[2],c.q[3]])});
    const free=pts.filter(p=>pts.filter(o=>Math.hypot(o[0]-p[0],o[1]-p[1])<.45).length===1);if(!free.length)continue;/* closed loop = outline */
    const touches=pts.some(p=>conL.some(l=>onL(p[0],p[1],l))||dots.some(d=>Math.hypot(d[0]-p[0],d[1]-p[1])<.9));if(!touches)continue;
    g.forEach(c=>{const q=c.q;if(Math.abs(q[1]-q[3])<.05)addH(c.k,q[0],q[2],q[1]);else addV(c.k,q[0],q[1],q[3]);if(c.pk!==undefined)(plk[c.pk]=plk[c.pk]||[]).push(c.k)})}}}
 /* v12: pulse glyph (small ⎍ drawn just above a wire, label TR## near it) = PULSE timer in that wire. The glyph lines are not wires; the wire is split at the glyph: left part = input, right part = output.
    ⎍ (middle high) = pulse on rising edge, ⊔ (middle low) = pulse on falling edge. Default 2 s, editable in the Timers panel. */
 const PG=[];{const gk=new Set(),allTx=[...sh.tx,...Object.values(sh.cells).flat()];
  for(const h of H){const L=h.x2-h.x1;if(L<.8||L>2.6||gk.has(h.k))continue;
   const vv=x=>V.find(v=>!gk.has(v.k)&&Math.abs(v.x-x)<.06&&v.y2-v.y1>=1.4&&v.y2-v.y1<=3.6&&(Math.abs(v.y1-h.y)<.06||Math.abs(v.y2-h.y)<.06)),a=vv(h.x1),b=vv(h.x2);if(!a||!b)continue;
   const oa=Math.abs(a.y1-h.y)<.06?a.y2:a.y1,ob=Math.abs(b.y1-h.y)<.06?b.y2:b.y1;if(Math.abs(oa-ob)>.06)continue;const pos=oa<h.y,lo=Math.min(oa,h.y),hi=Math.max(oa,h.y);
   const legs=H.filter(q=>q!==h&&!gk.has(q.k)&&Math.abs(q.y-oa)<.06&&q.x2-q.x1<=2.6&&(Math.abs(q.x2-h.x1)<.06||Math.abs(q.x1-h.x2)<.06));
   const cx=(h.x1+h.x2)/2,host=H.filter(q=>q!==h&&!legs.includes(q)&&q.x2-q.x1>4&&q.x1<=cx-1.6&&q.x2>=cx+1.6&&((q.y<lo&&lo-q.y<6)||(q.y>hi&&q.y-hi<2.7))).sort((p,q)=>Math.min(Math.abs(p.y-lo),Math.abs(p.y-hi))-Math.min(Math.abs(q.y-lo),Math.abs(q.y-hi)))[0];if(!host)continue;
   [h,a,b,...legs].forEach(q=>gk.add(q.k));const tg=allTx.filter(t=>/^TR\s?\d/i.test(t.t)&&Math.hypot(t.x-cx,t.y-(lo+hi)/2)<9).sort((p,q)=>Math.hypot(p.x-cx,p.y-hi)-Math.hypot(q.x-cx,q.y-hi))[0];
   const near=allTx.filter(t=>Math.hypot(t.x-cx,t.y-(lo+hi)/2)<10),cm=near.map(t=>/^(\d+(?:\.\d+)?)\s*(SEC|MIN|MS|S)\b/i.exec(t.t)).find(Boolean),nm=!cm&&near.find(t=>/^\d+(\.\d+)?$/.test(t.t)&&near.some(u=>/^SEC/i.test(u.t))),dur=cm?{v:+cm[1],u:unorm(cm[2])||'SEC'}:nm?{v:+nm.t,u:'SEC'}:null;/* duration written beside the glyph, e.g. DITL-69 TR23 "3 SEC." */
   PG.push({cx,wy:host.y,pos,host,dur,tag:tg?tg.t:'',key:tg?tg.t+'@'+cx.toFixed(0):'P'+cx.toFixed(0)+'_'+host.y.toFixed(0)})}
  for(let i=H.length-1;i>=0;i--)if(gk.has(H[i].k))H.splice(i,1);for(let i=V.length-1;i>=0;i--)if(gk.has(V[i].k))V.splice(i,1);
  for(const g of PG){const h=g.host,i=H.indexOf(h);if(i<0)continue;const A={k:h.k+'#a',x1:h.x1,x2:g.cx-1.5,y:h.y},B={k:h.k+'#b',x1:g.cx+1.5,x2:h.x2,y:h.y};H.splice(i,1,A,B);g.A=A.k;g.B=B.k;g.hk=h.k}}
 const tri=[];r.so.forEach(([q,l])=>{if(l!=='CON'&&l!=='SYM')return;/* v25: some arrowheads are on the SYM layer (DITL-18) */const u=[];q.forEach(p=>{if(!u.some(v=>Math.hypot(v[0]-p[0],v[1]-p[1])<.05))u.push(p)});if(u.length!==3)return;
  const xs=u.map(p=>p[0]),a0=Math.min(...xs),a1=Math.max(...xs),w=a1-a0,h=Math.max(...u.map(p=>p[1]))-Math.min(...u.map(p=>p[1]));if(w<.8||w>5||h>3.5)return;
  const lo=u.filter(p=>Math.abs(p[0]-a0)<.05),hi=u.filter(p=>Math.abs(p[0]-a1)<.05);
  if(lo.length===2&&hi.length===1)tri.push({x:hi[0][0],y:hi[0][1],d:1,bx:a0,by:(lo[0][1]+lo[1][1])/2});else if(hi.length===2&&lo.length===1)tri.push({x:lo[0][0],y:lo[0][1],d:-1,bx:a1,by:(hi[0][1]+hi[1][1])/2});
  else{/* v25: vertical arrowheads (tip up / down): they decide the flow direction of vertical NOT gates (DITL-09 row 14 bus through the NOT) */const y0=Math.min(...u.map(p=>p[1])),y1=Math.max(...u.map(p=>p[1])),bo=u.filter(p=>Math.abs(p[1]-y0)<.05),bi=u.filter(p=>Math.abs(p[1]-y1)<.05);
   if(bo.length===2&&bi.length===1)tri.push({x:bi[0][0],y:bi[0][1],d:0,v:1,bx:(bo[0][0]+bo[1][0])/2,by:y0});else if(bi.length===2&&bo.length===1)tri.push({x:bo[0][0],y:bo[0][1],d:0,v:-1,bx:(bi[0][0]+bi[1][0])/2,by:y1})}});/* v20: keep the BASE of the arrowhead too: a wire ends at the base, the tip touches the gate pin */
 const TM=[],uA=new Set();
 /* v27: label <-> D matching is global (nearest pairs first): a label written BELOW its timer was taken by the timer under it (DITL-21D TR561 / TR623) */
 const asg=new Map();{const spn=a=>(a[4]-a[3]+360)%360,Ls=sh.tx.filter(t=>t.ix>S1&&t.ix<R0&&/DELAY|PULSE/i.test(t.t)),pr=[];
  Ls.forEach(t=>r.ar.forEach(a=>{if(spn(a)>100&&spn(a)<260&&Math.abs(a[1]-t.y)<12.5&&Math.abs(a[0]-t.x)<14)pr.push({t,a,d:Math.hypot(a[0]-t.x,a[1]-t.y)})}));
  pr.sort((p,q)=>p.d-q.d);const ua=new Set(),ut=new Set();pr.forEach(o=>{if(ua.has(o.a)||ut.has(o.t))return;ua.add(o.a);ut.add(o.t);asg.set(o.t,o.a)})}
 for(const t of sh.tx.filter(t=>t.ix>S1&&t.ix<R0&&/DELAY|PULSE/i.test(t.t))){
  const sp=a=>(a[4]-a[3]+360)%360,dd=(p,q)=>Math.hypot(p[0]-t.x,p[1]-t.y)-Math.hypot(q[0]-t.x,q[1]-t.y),cd=r.ar.filter(a=>sp(a)>100&&sp(a)<260&&Math.hypot(a[0]-t.x,a[1]-t.y)<30&&!uA.has(a)),
   a=(asg.get(t)&&!uA.has(asg.get(t))?asg.get(t):null)||cd.filter(a=>a[5]==='CON'&&a[1]<t.y+2).sort(dd)[0]||cd.filter(a=>a[5]==='SYM'&&Math.abs(a[1]-t.y)<10).sort(dd)[0]||cd.filter(a=>a[5]==='CON'&&Math.abs(a[1]-t.y)<9).sort(dd)[0];/* v18: CON-layer D with the label BELOW it (DITL-21C..E, 23A..) *//* v18: label above (DITL-81 TR161) or below (TR191) the D */
  if(!a)continue;uA.add(a);const ax=a[0],ay=a[1],rr=a[2];
  const md=(a[3]+sp(a)/2)%360,rev=md>90&&md<270;/* v10: D that bulges to the LEFT = timer drawn right-to-left (e.g. DITL-69 TR164): input on the right, output on the left */
  let x0,bx1,bx2,ia,ib,oa,ob;
  const VS=[...V,...r.ln.filter(q=>q[4]==='SYM'&&Math.abs(q[0]-q[2])<.05).map(q=>({x:q[0],y1:Math.min(q[1],q[3]),y2:Math.max(q[1],q[3])}))];/* flat side may be on the symbol layer */
  if(!rev){const lv=VS.filter(v=>v.x<ax+.5&&v.x>ax-2*rr-1&&v.y2-v.y1<=2*rr+1.5&&v.y1<=ay+.5&&v.y2>=ay-.5).sort((p,q)=>q.x-p.x)[0];x0=lv?lv.x:(a[5]==='SYM'?ax:ax-rr);bx1=x0;bx2=ax+rr;ia=x0-4;ib=x0+1;oa=bx2-.7;ob=bx2+1.5}
  else{const rv=VS.filter(v=>v.x>ax-.5&&v.x<ax+2*rr+1&&v.y2-v.y1<=2*rr+1.5&&v.y1<=ay+.5&&v.y2>=ay-.5).sort((p,q)=>p.x-q.x)[0];bx2=rv?rv.x:(a[5]==='SYM'?ax:ax+rr);x0=bx2;bx1=ax-rr;ia=bx2-1;ib=bx2+4;oa=bx1-1.5;ob=bx1+.7}
  const ins=sh.tx.filter(q=>q!==t&&q.x>=bx1-1&&q.x<=bx2+.5&&q.y>=ay-rr&&q.y<=ay+rr),
   cmb=ins.find(q=>/^\d+(\.\d+)?\s*[A-Za-z.]+$/.test(q.t)&&unorm(q.t.replace(/^[\d.\s]+/,''))),
   nt=cmb||ins.find(q=>/^\d+(\.\d+)?$/.test(q.t)),ut=cmb||ins.find(q=>!/^\d/.test(q.t)&&unorm(q.t)),
   tg=sh.tx.find(q=>/^TR\d+/i.test(q.t)&&Math.abs(q.x-ax)<20&&q.y<ay&&q.y>ay-rr-14)||sh.tx.filter(q=>/^TR\d+/i.test(q.t)&&Math.abs(q.x-ax)<12&&Math.abs(q.y-ay)<rr+10).sort((p,q)=>Math.abs(p.y-ay)-Math.abs(q.y-ay))[0];
  TM.push({lab:t.t,kind:/OFF/i.test(t.t)?'off':/PULSE/i.test(t.t)?'pulse':'on',ax,ay,rr,x0,rev,bx1,bx2,ia,ib,oa,ob,nt,ut,tag:tg?tg.t:''})}
 const inT=(x1,y1,x2,y2)=>TM.some(m=>[[x1,y1],[x2,y2]].every(p=>p[0]>=m.bx1-E&&p[0]<=m.bx2+E&&p[1]>=m.ay-m.rr-E&&p[1]<=m.ay+m.rr+E));
 for(let i=H.length-1;i>=0;i--)if(inT(H[i].x1,H[i].y,H[i].x2,H[i].y))H.splice(i,1);
 for(let i=H.length-1;i>=0;i--)if(inTab(H[i].x1,H[i].y)&&inTab(H[i].x2,H[i].y))H.splice(i,1);for(let i=V.length-1;i>=0;i--)if(inTab(V[i].x,V[i].y1)&&inTab(V[i].x,V[i].y2))V.splice(i,1);
 for(let i=V.length-1;i>=0;i--)if(inT(V[i].x,V[i].y1,V[i].x,V[i].y2))V.splice(i,1);
 const VE=[...V.map(v=>({...v,bar:0})),...bars.map(v=>({...v,bar:1}))],rects=[];
 for(const h1 of H)for(const h2 of H){const dy=h2.y-h1.y;if(dy<2||dy>12||Math.abs(h1.x1-h2.x1)>E||Math.abs(h1.x2-h2.x2)>E||h1.x1<S1-1||h1.x2>R0+4)continue;
  const ve=x=>VE.find(v=>Math.abs(v.x-x)<E&&v.y1<=h1.y+E&&v.y2>=h2.y-E),lv=ve(h1.x1),rv=ve(h1.x2);if(!lv||!rv)continue;
  rects.push({L:h1.x1,R:h1.x2,B:lv.bar?Math.min(h1.y,lv.y1):h1.y,T:lv.bar?Math.max(h2.y,lv.y2):h2.y,cx:(h1.x1+h1.x2)/2,cy:(h1.y+h2.y)/2})}
 const lab=sh.tx.filter(t=>t.ix>S1&&t.ix<R0&&/^(AND|OR|NOT|S|R)$/.test(t.t)),claim=new Set(),G=[];
 for(const t of lab.filter(t=>t.t!=='OR')){const c=rects.map((q,i)=>({q,i,d:Math.hypot(q.cx-t.ix,q.cy-t.iy)})).filter(o=>!claim.has(o.i)&&o.d<16).sort((a,b)=>a.d-b.d)[0];
  if(c){claim.add(c.i);G.push({t:t.t,q:c.q})}}
 for(const t of lab.filter(t=>t.t==='OR')){const c=r.ci.find(c=>c[3]==='CON'&&Math.hypot(c[0]-t.ix,c[1]-t.iy)<c[2]+1.5);
  if(c){const bus=bars.find(b=>Math.abs(b.x-(c[0]-c[2]))<.9&&c[1]>=b.y1-.5&&c[1]<=b.y2+.5);let hb=null;
   if(!bus){const[cx,cy,rr]=c;/* v16: vertical-flow OR: the input bar is a horizontal line touching the circle at the bottom (or top), inputs come from that side, output leaves on the other side (DITL-25A..29A, 05) */
    hb=H.filter(h=>h.x1<=cx-rr*.6&&h.x2>=cx+rr*.6&&h.x2-h.x1>1.4*rr&&h.x2-h.x1<14*rr&&(Math.abs(h.y-(cy-rr))<1.4||Math.abs(h.y-(cy+rr))<1.4)).sort((a,b)=>(a.x2-a.x1)-(b.x2-b.x1))[0]||null;
    if(hb){hb={...hb,below:hb.y<cy};H.splice(H.indexOf(H.find(h=>h.k===hb.k)),1)}}
   G.push({t:'OR',c,bus,hb})}}
 /* v9: small box with an X inside = NOT gate (legend DITL-00, block 0NOT). v8 wrongly passed it through as a jumper. */
 const dg=r.ln.filter(q=>q[4]==='CON'&&Math.abs(q[0]-q[2])>.5&&Math.abs(q[1]-q[3])>.5);
 rects.forEach((q,i)=>{if(claim.has(i)||q.R-q.L>6.3||q.T-q.B>6.3)return;/* v27: bigger NOT symbols (DITL-117 5.7 x 5.4) */const w=q.R-q.L,x=dg.filter(d=>Math.min(d[0],d[2])>=q.L-E&&Math.max(d[0],d[2])<=q.R+E&&Math.min(d[1],d[3])>=q.B-E&&Math.max(d[1],d[3])<=q.T+E&&Math.abs(d[0]-d[2])>w*.7).length;
  if(x>=2&&!G.some(g=>g.q&&Math.abs(g.q.cx-q.cx)<.6&&Math.abs(g.q.cy-q.cy)<.6)){claim.add(i);G.push({t:'NOT',q,xb:1})}});
 /* v20: a gate input bar can be drawn as MANY short collinear vertical pieces (DITL-21C ORs): chain pieces that touch, a chain longer than minLen that overlaps [ylo,yhi] is the bar */
 const barPieces=(x0,x1,minLen,ylo,yhi)=>{const gx={},out=[];VE.filter(v=>v.x>=x0&&v.x<=x1).forEach(v=>{(gx[Math.round(v.x*10)]=gx[Math.round(v.x*10)]||[]).push(v)});
  for(const k in gx){const a=gx[k].sort((p,q)=>p.y1-q.y1);let cur=null,grp=[];const flush=()=>{if(cur&&cur.y2-cur.y1>=minLen&&cur.y1<=yhi&&cur.y2>=ylo)out.push(...grp)};
   a.forEach(v=>{if(cur&&v.y1<=cur.y2+.5){cur.y2=Math.max(cur.y2,v.y2);grp.push(v)}else{flush();cur={y1:v.y1,y2:v.y2};grp=[v]}});flush()}return out};
 /* v9: thick AND input bar (2-3 parallel verticals at the AND left edge, longer than the box) = input bus, not a wire that joins all inputs */
 const vskip=new Set();G.filter(g=>g.t==='AND').forEach(g=>{const q=g.q,pr=barPieces(q.L-1.3,q.L+1.3,(q.T-q.B)+1,q.B,q.T);if(pr.length<2&&!pr.some(v=>v.bar))return;/* v20: the bar can sit up to 1.2 inside the box edge (DITL-83) and a thick bar alone is already a bus */
  g.bus={x1:Math.min(...pr.map(v=>v.x)),x2:Math.max(...pr.map(v=>v.x)),y1:Math.min(...pr.map(v=>v.y1)),y2:Math.max(...pr.map(v=>v.y2))};pr.forEach(v=>{if(!v.bar)vskip.add(v.k)});/* v20: shorter pieces of the same bar (split bar) are bus too */VE.forEach(v=>{if(!v.bar&&v.x>=g.bus.x1-.7&&v.x<=g.bus.x2+.7&&v.y1>=g.bus.y1-.7&&v.y2<=g.bus.y2+.7)vskip.add(v.k)})});
 /* v10: same for the OR input bar: the bar is drawn as a thick polyline plus a plain line beside it; the plain line merged all OR inputs into one net */
 G.filter(g=>g.t==='OR').forEach(g=>{const[cx,cy,rr]=g.c,pr=barPieces(cx-rr-1.3,cx-rr+1.3,rr*1.6,cy-.5,cy+.5);if(!pr.length)return;
  g.ob={x1:Math.min(...pr.map(v=>v.x)),x2:Math.max(...pr.map(v=>v.x)),y1:Math.min(...pr.map(v=>v.y1)),y2:Math.max(...pr.map(v=>v.y2))};pr.forEach(v=>{if(!v.bar)vskip.add(v.k)});VE.forEach(v=>{if(!v.bar&&v.x>=g.ob.x1-.7&&v.x<=g.ob.x2+.7&&v.y1>=g.ob.y1-.7&&v.y2<=g.ob.y2+.7)vskip.add(v.k)})});
 const rr_=rects.filter((q,i)=>claim.has(i)||q.R-q.L>5.2||q.T-q.B>5.2),inb=(x,y,x2,y2)=>rr_.some(q=>[[x,y],[x2,y2]].every(p=>p[0]>=q.L-E&&p[0]<=q.R+E&&p[1]>=q.B-E&&p[1]<=q.T+E)),segs=[];
 const edge=v=>{/* v27: the vertical must lie inside a STACK of boxes that touch each other (S over R of a flip-flop); it used the span of ALL boxes with the same x, which also swallowed the wire between two separate NOT gates (DITL-12A) */
  const b=rr_.filter(q=>Math.abs(v.x-q.L)<E||Math.abs(v.x-q.R)<E).sort((p,q)=>p.B-q.B);if(!b.length)return false;const st=[];let cur=null;b.forEach(q=>{if(cur&&q.B<=cur.T+.7){cur.T=Math.max(cur.T,q.T)}else{cur={B:q.B,T:q.T};st.push(cur)}});
  return st.some(g=>v.y1>=g.B-E&&v.y2<=g.T+E)};
 for(const h of H)if(h.x1>S1-4.5&&h.x2<R0+6&&!inb(h.x1,h.y,h.x2,h.y))segs.push({k:h.k,h:1,x1:h.x1,x2:h.x2,y1:h.y,y2:h.y});
 for(const v of V)if(!vskip.has(v.k)&&v.x>S1-1&&v.x<R0+6&&!inb(v.x,v.y1,v.x,v.y2)&&!edge(v))segs.push({k:v.k,h:0,x1:v.x,x2:v.x,y1:v.y1,y2:v.y2});
 const P=segs.map((_,i)=>i),f=i=>P[i]===i?i:(P[i]=f(P[i])),u=(a,b)=>{P[f(a)]=f(b)};
 const on=(x,y,s,t=.35)=>x>=s.x1-t&&x<=s.x2+t&&y>=s.y1-t&&y<=s.y2+t,en=s=>[[s.x1,s.y1],[s.h?s.x2:s.x1,s.h?s.y1:s.y2]];
 if(strict){/* v27: strict T: an end that lies on the SIDE of a perpendicular wire connects only through a junction dot (the dots are complete); end-to-end and collinear overlaps still join */
  const near2=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1])<.4;
  segs.forEach((a,i)=>segs.forEach((b,j)=>{if(j<=i)return;const ea=en(a),eb=en(b);let ok=false;if(ea.some(p=>eb.some(q=>near2(p,q))))ok=true;else if(a.h===b.h)ok=ea.some(p=>on(p[0],p[1],b))||eb.some(p=>on(p[0],p[1],a));if(ok)u(i,j)}))}
 else segs.forEach((a,i)=>segs.forEach((b,j)=>{if(j>i&&(en(a).some(p=>on(p[0],p[1],b))||en(b).some(p=>on(p[0],p[1],a))))u(i,j)}));
 dots.forEach(d=>{const m=segs.map((s,i)=>on(d[0],d[1],s,.8)?i:-1).filter(i=>i>=0);m.forEach(i=>u(m[0],i))});
 /* v14: ICD130 (two small arcs ")(" on a wire, DITL-61A/76/77 rows 53/54 VCB ON/OFF) = field contact in the wire: the wire is drawn with a gap there, bridge it */
 const CM=[];/* v26: limit comparators (H/ /L boxes and SIGHI / SIGLO symbols): kept as CMP gates with a numeric input, the setpoint is read from the text beside the box. Without a readable setpoint they stay a plain pass-through. */
 /* v18: limit comparator box "H/" or "/L" (legend DITL-00) on a wire (temperature / vibration switches, DITL-61B, 21A..): the wire has a gap at the box, the signal passes through */
 [...sh.tx,...Object.values(sh.cells).flat()].filter(t=>/^(H\/|\/L|H\/L|HH\/|\/LL)$/.test(t.t)&&t.x>S1&&t.x<R0).forEach(t=>{const cy=t.y+(t.b===0?1.3:0),cand=(f,lim)=>segs.map((q,i)=>({q,i})).filter(o=>o.q.h&&Math.abs(o.q.y1-cy)<3.6&&f(o.q)).sort((a,b)=>lim(a.q)-lim(b.q)||Math.abs(a.q.y1-cy)-Math.abs(b.q.y1-cy))[0];
  const Lf=cand(q=>q.x2<=t.x+.6&&q.x2>=t.x-9,q=>-q.x2),Rt=cand(q=>q.x1>=t.x-.6&&q.x1<=t.x+10,q=>q.x1);if(Lf&&Rt)CM.push({Lf:Lf.i,Rt:Rt.i,cx:t.x,cy,kind:/^H/.test(t.t)?'H':'L',txt:t.t})});
 (sh.syms||[]).filter(z=>z.k==='icd'||z.k==='hi'||z.k==='lo').forEach(z=>{/* v21: SIGHI / SIGLO limit comparator symbols (DITL-86, 92, 93, 94...) have a 6 unit gap in the wire, bridged like ICD130 */const c=(f,lim)=>segs.map((q,i)=>({q,i})).filter(o=>o.q.h&&Math.abs(o.q.y1-z.y)<2.8&&f(o.q)).sort((a,b)=>lim(a.q)-lim(b.q)||Math.abs(a.q.y1-z.y)-Math.abs(b.q.y1-z.y))[0];
  const Lf=c(q=>q.x2<=z.x+1&&q.x2>=z.x-12,q=>-q.x2),Rt=c(q=>q.x1>=z.x-1&&q.x1<=z.x+12,q=>q.x1);if(Lf&&Rt){if(z.k==='icd')u(Lf.i,Rt.i);else CM.push({Lf:Lf.i,Rt:Rt.i,cx:z.x+3,cy:z.y,kind:z.k==='hi'?'H':'L',txt:z.k==='hi'?'SIGHI':'SIGLO'})}});
 {for(let i=CM.length-1;i>=0;i--){if(CM.some((o,j)=>j<i&&Math.abs(o.cx-CM[i].cx)<5&&Math.abs(o.cy-CM[i].cy)<2&&o.kind===CM[i].kind))CM.splice(i,1)}/* the same symbol can be listed twice (block inside block) */
  const allT=[...sh.tx,...Object.values(sh.cells).flat()].filter(t=>/^[<>≥≤]=?\s*(-?\d|[A-Z]{1,3}\d{3,5}$)/.test(t.t));
  CM.forEach(c=>{const o=allT.filter(t=>t.x>=c.cx-11&&t.x<=c.cx+42&&Math.abs(t.y-c.cy)<8).sort((a,b)=>Math.hypot(a.x-c.cx-8,a.y-c.cy)-Math.hypot(b.x-c.cx-8,b.y-c.cy))[0];if(!o)return;const tt=o.t.trim(),m=/^([<>≥≤]=?)\s*(-?\d+(?:\.\d+)?)\s*(.*)$/.exec(tt),mv=!m&&/^([<>≥≤]=?)\s*([A-Z]{1,3}\d{3,5})$/.exec(tt);if(!m&&!mv)return;const op=(m||mv)[1];c.op=(op[0]==='<'||op[0]==='≤')?'<':'>';c.eq=/[=≥≤]/.test(op);c.sptxt=tt;
   if(m){c.sp=+m[2];c.unit=m[3].trim()}else{/* v27: the limit is another analog signal (DITL-60 ">=AB0383"): its wire enters the box from above */const v=segs.map((q,i)=>({q,i})).filter(o2=>!o2.q.h&&Math.abs(o2.q.x1-c.cx)<6&&o2.q.y1-(c.cy+3)>-1&&o2.q.y1-(c.cy+3)<10).sort((a,b)=>Math.abs(a.q.y1-c.cy)-Math.abs(b.q.y1-c.cy))[0];if(v){c.spSeg=v.i;c.spVar=mv[2];c.sp=NaN}}});
  CM.forEach(c=>{if(c.sp===undefined)u(c.Lf,c.Rt)})}
 /* v17: numbered circle connectors (1..14 in a small circle at the end of a wire): the same number on the same sheet = the same wire (DITL-76 timer output M.1237 -> (1) -> MOS gate). A number that appears once goes to another sheet (linking, on hold). */
 const cons=[];{const alltx=[...sh.tx,...Object.values(sh.cells).flat()],byN={};
  r.ci.forEach(([x,y,rr,l])=>{if(rr<1.8||rr>4.6)return;const t=alltx.find(q=>/^\d{1,2}$/.test(q.t)&&Math.hypot(q.ix-x,q.iy-y)<=rr+1.2);if(!t)return;
   const c=segs.map((q,i)=>({q,i})).map(o=>{const q=o.q;let d=1e9;if(q.h&&Math.abs(q.y1-y)<1.2){if(q.x2<=x-rr+1&&q.x2>=x-rr-4.6)d=x-rr-q.x2;else if(q.x1>=x+rr-1&&q.x1<=x+rr+4.6)d=q.x1-(x+rr)}else if(!q.h&&Math.abs(q.x1-x)<1.2){if(q.y2<=y-rr+1&&q.y2>=y-rr-4.6)d=y-rr-q.y2;else if(q.y1>=y+rr-1&&q.y1<=y+rr+4.6)d=q.y1-(y+rr)}return{i:o.i,d:Math.abs(d)}}).filter(o=>o.d<1e8).sort((a,b)=>a.d-b.d)[0];
   cons.push({x,y,r:rr,num:t.t,i:c?c.i:-1});if(c)(byN[t.t]=byN[t.t]||[]).push(c.i)});
  for(const k in byN)if(byN[k].length>1)byN[k].forEach(i=>u(byN[k][0],i))}
 (sh.links||[]).forEach(([a,b])=>{const i=segs.findIndex(q=>q.k===a),j=segs.findIndex(q=>q.k===b);if(i>=0&&j>=0)u(i,j)});
 let healed=0;const gd=(x,y,t)=>Math.hypot(Math.max(t.x1-x,0,x-t.x2),Math.max(t.y1-y,0,y-t.y2));
 segs.forEach((a,i)=>en(a).forEach(([x,y],ei)=>{const ak=String(a.k);if((/#b$/.test(ak)&&ei===0)||(/#a$/.test(ak)&&ei===1))return;/* v20: the artificial end made by cutting a wire at a pulse glyph must not heal onto a neighbour wire */if(tri.some(t=>Math.hypot(t.x-x,t.y-y)<1.4||Math.hypot(t.bx-x,t.by-y)<1.4))return;/* v20: an end with an ARROWHEAD is the end of the signal flow (it points into a gate pin): never glue it to a wire that happens to run 1 unit away (DITL-94 AND output next to the OR output wire) */if(segs.some((b,j)=>j!==i&&on(x,y,b))||dots.some(d=>Math.hypot(d[0]-x,d[1]-y)<.8))return;let bj=-1,bd=1.2;segs.forEach((b,j)=>{if(j===i||f(j)===f(i))return;const d=gd(x,y,b);if(d<bd){bd=d;bj=j}});if(bj>=0){u(i,bj);healed++}}));
 /* v21: two free ends that face each other on the same line with a gap up to 3 units are one wire (a hop, a broken drawing line) */
 {const fe=[];segs.forEach((a,i)=>en(a).forEach(([x,y],ei)=>{const ak=String(a.k);if((/#b$/.test(ak)&&ei===0)||(/#a$/.test(ak)&&ei===1))return;if(segs.some((b,j)=>j!==i&&on(x,y,b))||dots.some(d=>Math.hypot(d[0]-x,d[1]-y)<.8)||tri.some(t=>Math.hypot(t.x-x,t.y-y)<1.4||Math.hypot(t.bx-x,t.by-y)<1.4))return;fe.push({i,x,y,h:a.h,out:a.h?(ei===0?-1:1):(ei===0?-1:1)})}));
  fe.forEach((a,ia)=>fe.forEach((b,ib)=>{if(ib<=ia||a.h!==b.h||f(a.i)===f(b.i))return;const g=a.h?Math.abs(a.y-b.y)<.2&&Math.abs(a.x-b.x):Math.abs(a.x-b.x)<.2&&Math.abs(a.y-b.y);if(g<.4||g>3.0||a.x<S1+6||b.x<S1+6||a.x>R0-6||b.x>R0-6)return;const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;if(rects.some(q=>mx>=q.L-.5&&mx<=q.R+.5&&my>=q.B-.5&&my<=q.T+.5)||TM.some(m=>mx>=m.bx1-1.5&&mx<=m.bx2+1.5&&Math.abs(my-m.ay)<m.rr+2)||PG.some(pg=>Math.abs(mx-pg.cx)<3.2&&Math.abs(my-pg.wy)<2))return;/* never heal across a gate / timer body */const d=a.h?Math.sign(b.x-a.x):Math.sign(b.y-a.y);if(d===a.out&&d===-b.out){u(a.i,b.i);healed++}}))}
 const id={};let n=0;segs.forEach((s,i)=>{const q=f(i);if(!(q in id))id[q]=n++;s.n=id[q]});
 const ends=[];const freeEnd=(s,x,y)=>!segs.some(b=>b!==s&&on(x,y,b,.4))&&!dots.some(d=>Math.hypot(d[0]-x,d[1]-y)<.8);/* v20: a real input / output wire starts with a FREE end; a bend that merely sits near the cell edge touches another wire and is not a source */
 segs.forEach(s=>{if(s.h){const k=String(s.k);ends.push({x:s.x1,y:s.y1,n:s.n,cut:/#b$/.test(k),free:freeEnd(s,s.x1,s.y1)});ends.push({x:s.x2,y:s.y1,n:s.n,cut:/#a$/.test(k),free:freeEnd(s,s.x2,s.y1)})}});
 const at=(x0,x1,y0,y1)=>[...new Set(ends.filter(e=>e.x>=x0&&e.x<=x1&&e.y>=y0-.7&&e.y<=y1+.7).map(e=>e.n))],gates=[];
 const ai=(x,b,t)=>at(x-4.3,x+.7,b,t),ao=(x,b,t)=>at(x-.7,x+1.2,b,t);
 for(const g of G){if(g.t==='NOT'){const q=g.q,nr=(d,x)=>tri.some(a=>a.d===d&&Math.abs(a.x-x)<1.6&&a.y>=q.B-.8&&a.y<=q.T+.8),ev=nr(-1,q.R)&&!nr(1,q.L)?1:nr(1,q.L)&&!nr(-1,q.R)?-1:0,rev=ev===1;
   gates.push({t:'NOT',rev,ev,done:ev!==0,Q:q,A:at(q.L-4.3,q.L+.7,q.B,q.T),Bn:at(q.R-.7,q.R+4.1,q.B,q.T),ins:rev?at(q.R-.7,q.R+4.1,q.B,q.T):ai(q.L,q.B,q.T),out:rev?at(q.L-1.2,q.L+.7,q.B,q.T):ao(q.R,q.B,q.T),box:{x1:q.L,x2:q.R,y1:q.B,y2:q.T}});
   const ng=gates[gates.length-1];if(!ng.A.length&&!ng.Bn.length){/* v9: X-box NOT with vertical flow (wire enters top/bottom), default top -> bottom, direction fixed below by driven nets */
    const cx0=(q.L+q.R)/2,vt=top=>[...new Set(segs.filter(z=>!z.h&&Math.abs(z.x1-cx0)<1.4&&(top?(z.y1>=q.T-.9&&z.y1<=q.T+3.9):(z.y2<=q.B+.9&&z.y2>=q.B-3.9))).map(z=>z.n))];/* v16: the arrow head sits between the wire end and the box, so the wire ends up to ~3.9 away */ng.vert=1;ng.A=vt(true);ng.Bn=vt(false);ng.ins=ng.A;ng.out=ng.Bn;ng.ev=0;ng.done=false;
    const upIn=tri.some(t=>t.v===1&&Math.abs(t.x-cx0)<1.8&&Math.abs(t.y-q.B)<2.2),dnIn=tri.some(t=>t.v===-1&&Math.abs(t.x-cx0)<1.8&&Math.abs(t.y-q.T)<2.2);/* arrow tip on the bottom edge pointing up = signal enters from below (flow up); tip on the top edge pointing down = enters from above */
    if(upIn&&!dnIn){ng.rev=true;ng.ins=ng.Bn;ng.out=ng.A;ng.done=true;ng.ev=1}else if(dnIn&&!upIn){ng.done=true;ng.ev=1}}
   else if(!ng.A.length&&ng.Bn.length){/* v27: a NOT whose signal enters from the top / bottom and leaves to the right as well (DITL-21A row 22): top and bottom nets decide the input, the right wire is an extra output */
    const cx0=(q.L+q.R)/2,vt=top=>[...new Set(segs.filter(z=>!z.h&&Math.abs(z.x1-cx0)<1.4&&(top?(z.y1>=q.T-.9&&z.y1<=q.T+3.9):(z.y2<=q.B+.9&&z.y2>=q.B-3.9))).map(z=>z.n))],tp=vt(true),bt=vt(false);
    if(tp.length&&bt.length){ng.vert=1;ng.tap=ng.Bn;ng.A=tp;ng.Bn=bt;ng.ins=tp;ng.out=[...bt,...ng.tap];ng.ev=0;ng.done=false}}}
  else if(g.t==='AND')gates.push({t:g.t,bus:g.bus,ins:g.bus?[...new Set([...ai(g.q.L,g.q.B,g.q.T),...at(g.bus.x1-4.3,g.bus.x2+.9,g.bus.y1,g.bus.y2)])]:ai(g.q.L,g.q.B,g.q.T),out:ao(g.q.R,g.q.B,g.q.T),box:{x1:g.q.L,x2:g.q.R,y1:g.q.B,y2:g.q.T}});
  else if(g.t==='OR'&&g.hb){const[cx,cy,rr]=g.c,hb=g.hb,vs=segs.filter(z=>!z.h),ii=vs.filter(z=>z.x1>=hb.x1-.7&&z.x1<=hb.x2+.7&&(hb.below?(z.y2<=hb.y+.7&&z.y2>=hb.y-4.4):(z.y1>=hb.y-.7&&z.y1<=hb.y+4.4))),oo=vs.filter(z=>Math.abs(z.x1-cx)<1.4&&(hb.below?(z.y1>=cy+rr-.9&&z.y1<=cy+rr+1.4):(z.y2<=cy-rr+.9&&z.y2>=cy-rr-1.4)));
   gates.push({t:'OR',bar:-1,hv:1,ins:[...new Set(ii.map(z=>z.n))],out:[...new Set(oo.map(z=>z.n))],vz:[{x1:hb.x1-.7,x2:hb.x2+.7,y1:hb.below?hb.y-4.5:hb.y-.7,y2:hb.below?hb.y+.7:hb.y+4.5},{x1:cx-1.4,x2:cx+1.4,y1:hb.below?cy+rr-.9:cy-rr-1.5,y2:hb.below?cy+rr+1.5:cy-rr+.9}],box:{x1:hb.x1,x2:hb.x2,y1:Math.min(cy-rr,hb.y),y2:Math.max(cy+rr,hb.y)}})}
  else if(g.t==='OR'){const[cx,cy,rr]=g.c;gates.push({t:'OR',bar:g.bus?g.bus.k:-1,bus:g.ob,ins:g.ob?at(g.ob.x1-4.3,g.ob.x2+.9,g.ob.y1,g.ob.y2):g.bus?at(g.bus.x-4.3,g.bus.x+.9,g.bus.y1,g.bus.y2):ai(cx-rr,cy-rr,cy+rr),out:ao(cx+rr,cy-1,cy+1),box:{x1:g.bus?g.bus.x:cx-rr,x2:cx+rr,y1:Math.min(cy-rr,g.bus?g.bus.y1:1e9),y2:Math.max(cy+rr,g.bus?g.bus.y2:-1e9)}})}}
 const usedR=new Set();/* v15: the S/R box can be drawn with R on TOP and S below (DITL-62, 63, 72...): pair either way */
 for(const s of G.filter(g=>g.t==='S')){const R=G.filter(g=>g.t==='R'&&!usedR.has(g)&&Math.abs(g.q.cx-s.q.cx)<1&&Math.abs(g.q.cy-s.q.cy)<16&&Math.abs(g.q.cy-s.q.cy)>1).sort((a,b)=>Math.abs(a.q.cy-s.q.cy)-Math.abs(b.q.cy-s.q.cy))[0];
  if(R){usedR.add(R);gates.push({t:'FF',rt:R.q.cy>s.q.cy,s:ai(s.q.L,s.q.B,s.q.T),r:ai(R.q.L,R.q.B,R.q.T),out:[...ao(s.q.R,s.q.B,s.q.T),...ao(R.q.R,R.q.B,R.q.T)],q:0,box:{x1:Math.min(s.q.L,R.q.L),x2:Math.max(s.q.R,R.q.R),y1:Math.min(s.q.B,R.q.B),y2:Math.max(s.q.T,R.q.T)}})}}
 for(const m of TM){gates.push({t:'TMR',k:m.kind,tm:m,ins:at(m.ia,m.ib,m.ay-2.5,m.ay+2.5),out:at(m.oa,m.ob,m.ay-2.5,m.ay+2.5),st:{acc:0,out:0,pre:0,run:0},box:{x1:m.bx1,x2:m.bx2,y1:m.ay-m.rr,y2:m.ay+m.rr}})}
 {const sn={};segs.forEach(q=>sn[q.k]=q.n);for(const p of PG){if(sn[p.A]===undefined||sn[p.B]===undefined)continue;const pd=sh.pdur&&sh.pdur[p.key];
   gates.push({t:'TMR',k:p.pos?'pulse':'npulse',tm:{lab:'PULSE',pg:1,key:p.key,tag:p.tag,ax:p.cx,ay:p.wy,rr:1.5,bx1:p.cx-1.5,bx2:p.cx+1.5,nt:null,ut:null,fv:pd||p.dur||{v:2,u:'SEC'}},ins:[sn[p.A]],out:[sn[p.B]],st:{acc:0,out:0,pre:0,run:0},box:{x1:p.cx-1.5,x2:p.cx+1.5,y1:p.wy-1.2,y2:p.wy+1.2}})}}
 /* v26 CMP gates: input = analog wire (left net), output = digital wire (right net) */
 CM.forEach(c=>{if(c.sp===undefined)return;const nL=segs[c.Lf].n,nR=segs[c.Rt].n;if(nL===nR)return;gates.push({t:'CMP',cmp:c.op,eq:c.eq,kind:c.kind,sp:c.sp,spNet:c.spSeg!==undefined?segs[c.spSeg].n:undefined,spVar:c.spVar,unit:c.unit,sptxt:c.sptxt,ins:[nL],out:[nR],miss:[],pp:[],box:{x1:c.cx-3.2,x2:c.cx+3.2,y1:c.cy-2.6,y2:c.cy+2.6}})});
 const row=y=>sh.rows.findIndex(r=>y>=r.y-3.3&&y<r.y+5.7),src=[],outs=[];
 const gOut=new Set();gates.forEach(g=>(g.out||[]).forEach(n=>gOut.add(n)));/* v20: a net that a gate drives (e.g. the wire after a pulse timer) cannot also be an input row source */
 const minX={},maxX={};segs.forEach(q=>{minX[q.n]=Math.min(minX[q.n]===undefined?1e9:minX[q.n],q.x1);maxX[q.n]=Math.max(maxX[q.n]===undefined?-1e9:maxX[q.n],q.x2)});
 for(const e of ends){const i=row(e.y);if(i<0||e.cut)continue;
  /* v20: a wire START is a free end, or the left-most point of its net (a bend near the cell edge has more wire to its left: DITL-99 row 1 / row 3) */
  if(e.x<=S1+2.2){if((e.free||minX[e.n]>=e.x-1.5)&&!gOut.has(e.n))src.push({n:e.n,row:i})}else if(e.x>=R0-4){if(e.free||maxX[e.n]<=e.x+1.5)outs.push({n:e.n,row:i})}}
 /* v20: pulse glyph drawn right at the cell edge (DITL-21D, 83, 60...): no wire before the glyph, the input row feeds the timer input */
 gates.forEach(g=>{if(g.t!=='TMR'||!g.tm||!g.tm.pg||!g.ins.length)return;const i=row(g.tm.ay);if(i<0||src.some(z=>z.row===i))return;if(!LEFT.some(c=>(sh.cells[i+':'+c]||[]).length))return;if(!src.some(z=>z.n===g.ins[0]))src.push({n:g.ins[0],row:i})});
 for(let it=0,ch=true;ch&&it<8;it++){ch=false;const D=new Set(src.map(z=>z.n));
  gates.forEach(g=>{if(g.t==='NOT'&&!g.done)return;(g.out||[]).forEach(n=>D.add(n))});
  for(const g of gates)if(g.t==='NOT'&&!g.done){const dA=g.A.some(n=>D.has(n)),dB=g.Bn.some(n=>D.has(n));
   if(dA===dB)continue;g.done=true;ch=true;const q=g.Q;
   if(dB){g.rev=true;if(g.vert){g.ins=g.Bn;g.out=g.A.concat(g.tap||[])}else{g.ins=at(q.R-.7,q.R+4.1,q.B,q.T);g.out=at(q.L-1.2,q.L+.7,q.B,q.T)}}else if(g.vert&&g.tap){g.ins=g.A;g.out=g.Bn.concat(g.tap)}}}
 const seg={};segs.forEach(q=>seg[q.k]=q.n);
 const plnet={};for(const k in plk){const f=plk[k].find(kk=>seg[kk]!==undefined);if(f!==undefined)plnet[k]=seg[f]}
 r.so.forEach(([q,l])=>{if(l!=='CON')return;const u=[];q.forEach(p=>{if(!u.some(v=>Math.hypot(v[0]-p[0],v[1]-p[1])<.05))u.push(p)});if(u.length!==3)return;
  const xs=u.map(p=>p[0]),x0=Math.min(...xs),x1=Math.max(...xs),w=x1-x0,h=Math.max(...u.map(p=>p[1]))-Math.min(...u.map(p=>p[1]));if(w<.8||w>5||h>3.5)return;
  const lo=u.filter(p=>Math.abs(p[0]-x0)<.05),hi=u.filter(p=>Math.abs(p[0]-x1)<.05);if(lo.length!==2||hi.length!==1)return;
  const tx=hi[0][0],ty=hi[0][1],gi=gates.findIndex(g=>tx>=g.box.x1-.8&&tx<=g.box.x1+1.5&&ty>=g.box.y1-.5&&ty<=g.box.y2+.5);if(gi<0)return;
  const sg=segs.find(z=>z.h&&Math.abs(z.y1-ty)<.6&&z.x1<=tx+.5&&z.x2>=tx-4.5);if(!sg)return;const g=gates[gi],a=g.t==='FF'?((ty>(g.box.y1+g.box.y2)/2)!==!!g.rt?g.s:g.r):g.ins;if(!a.includes(sg.n))a.push(sg.n)});
 (sh.pins||[]).forEach(p=>{const g=gOf({gates},p),n=seg[p.k];if(!g||n===undefined)return;const a=p.kind==='in'?g.ins:p.kind==='out'?g.out:p.kind==='s'?g.s:g.r;if(a&&!a.includes(n))a.push(n)});
 gates.forEach(g=>{const b=g.box;g.pp=ends.filter(e=>e.y>=b.y1-.7&&e.y<=b.y2+.7&&((e.x>=b.x1-4.3&&e.x<=b.x1+.7)||(e.x>=b.x2-.7&&e.x<=b.x2+1.2))).map(e=>({x:e.x,y:e.y,n:e.n}))});
 gates.forEach(g=>{g.miss=(g.t==='FF'?[!g.s.length&&'S input',!g.r.length&&'R input',!g.out.length&&'output']:[!g.ins.length&&'input',!g.out.length&&'output']).filter(Boolean)});
 const termTx=[...sh.tx,...Object.values(sh.cells).flat()].filter(t=>/^\(?(DC\s*24V|24V\s*DC|DC|24V|0V|COMMON|COM|L1|N|PE|\+|-)\)?$/i.test(t.t));
 const fieldBoxes=[];{const cs=[];r.ln.forEach(q=>{if(q[4]==='CEN'&&Math.hypot(q[0]-q[2],q[1]-q[3])<130)cs.push([[q[0],q[1]],[q[2],q[3]]])});r.pl.forEach(([p,c,l])=>{if(l==='CEN')for(let i=0;i+1<p.length;i++)cs.push([p[i],p[i+1]])});
  const cp=cs.map((_,i)=>i),cf=i=>cp[i]===i?i:(cp[i]=cf(cp[i])),cn=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<.6;cs.forEach((a,i)=>cs.forEach((b,j)=>{if(j>i&&a.some(p=>b.some(q=>cn(p,q))))cp[cf(i)]=cf(j)}));
  const cg={};cs.forEach((q,i)=>(cg[cf(i)]=cg[cf(i)]||[]).push(...q));Object.values(cg).forEach(w=>{const b={x1:Math.min(...w.map(z=>z[0])),x2:Math.max(...w.map(z=>z[0])),y1:Math.min(...w.map(z=>z[1])),y2:Math.max(...w.map(z=>z[1]))};if(b.x2-b.x1>12&&b.y2-b.y1>8&&b.x2-b.x1<200)fieldBoxes.push(b)})}
 const termA=[];const adrTx=[...sh.tx,...Object.values(sh.cells).flat()].filter(t=>/^[IO]\.[0-9A-F]{4}|^0\.[0-9A-F]{4}/.test(t.t)&&t.x>S1&&t.x<R0+2);
 const eqPts=[];[...sh.tx,...Object.values(sh.cells).flat()].forEach(t=>{if(/^\((RED|GREEN)\)$/i.test(t.t)&&t.x>S1&&t.x<R0)eqPts.push([t.x+10,t.y+1,18,4.6]);/* MCC / softstarter indicating lamps */if(/^(H\/|\/L|H\/L|HH\/|\/LL)$/.test(t.t)&&t.x>S1&&t.x<R0)eqPts.push([t.x,t.y-3,8,9.5]);/* v27: also the setpoint input that enters from above (DITL-60) */if(/^MO[PT]-/.test(t.t)&&t.x>S1&&t.x<R0)eqPts.push([t.x,t.y,9,5])});
 (sh.syms||[]).forEach(z=>{if(z.k==='icd')eqPts.push([z.x,z.y,8,3.6]);else if(z.k==='hi'||z.k==='lo')eqPts.push([z.x,z.y+3,8,8.5]);/* limit symbol: the limit signal may enter from above (DITL-60) */else if(z.k==='lamp'&&z.x>S1&&z.x<R0)eqPts.push([z.x,z.y,13,3.8])});
 const cenL=[];r.ln.forEach(q=>{if(q[4]==='CEN')cenL.push([Math.min(q[0],q[2]),Math.min(q[1],q[3]),Math.max(q[0],q[2]),Math.max(q[1],q[3])])});r.pl.forEach(([p,c,l])=>{if(l==='CEN')for(let i=0;i+1<p.length;i++)cenL.push([Math.min(p[i][0],p[i+1][0]),Math.min(p[i][1],p[i+1][1]),Math.max(p[i][0],p[i+1][0]),Math.max(p[i][1],p[i+1][1])])});
 const pentB=r.pl.filter(([p])=>p.length>=5&&p.length<=8).map(([p])=>{const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);return{x1:Math.min(...xs)-6,x2:Math.max(...xs)+6,y1:Math.min(...ys)-4,y2:Math.max(...ys)+4}});
 const zone=(x,y)=>gates.some(g=>{const b=g.box,u=g.bus;return (y>=b.y1-.7&&y<=b.y2+.7&&((x>=b.x1-4.3&&x<=b.x1+.7)||(x>=b.x2-.7&&x<=b.x2+1.2)))||(u&&y>=u.y1-2.2&&y<=u.y2+2.2&&x>=u.x1-4.3&&x<=u.x2+1.5)||(g.vert&&x>=b.x1-.7&&x<=b.x2+.7&&(Math.abs(y-b.y1)<2.6||Math.abs(y-b.y2)<2.6))})||cons.some(c=>Math.hypot(x-c.x,y-c.y)<c.r+5)||gates.some(g=>g.t==='TMR'&&g.tm&&g.tm.ia!==undefined&&((x>=g.tm.ia-1&&x<=g.tm.ib+1)||(x>=g.tm.oa-1.5&&x<=g.tm.ob+2.2))&&Math.abs(y-g.tm.ay)<g.tm.rr+2)||(gates.some(g=>g.vz&&g.vz.some(u=>x>=u.x1&&x<=u.x2&&y>=u.y1&&y<=u.y2)))||fbr.some(b=>x>=b.x0-2.5&&x<=b.x1+2.5&&y>=b.y0-2.5&&y<=b.y1+2.5),
  dist=(x,y,t)=>Math.hypot(Math.max(t.x1-x,0,x-t.x2),Math.max(t.y1-y,0,y-t.y2)),dang=[];
 segs.forEach((a,i)=>en(a).forEach(([x,y])=>{
  if(segs.some((b,j)=>j!==i&&on(x,y,b)))return;
  if(dots.some(d=>Math.hypot(d[0]-x,d[1]-y)<.8))return;
  if(zone(x,y)||((x<=S1+2.2||x>=R0-4)&&row(y)>=0))return;
  /* v18: a wire end is NOT loose when it is a real terminal: touches any circle (contact, terminal, connector), points to a field terminal with an arrowhead (DCS output), sits at a DC / 24V / COMMON label, ends inside a dashed field assembly box, or on a pentagon (off-sheet) */
  if(r.ci.some(c=>c[2]>.7&&c[2]<5&&Math.abs(Math.hypot(x-c[0],y-c[1])-c[2])<(c[2]<2.3?2.4:1.1)))return;
  if(tri.some(a=>Math.hypot(a.x-x,a.y-y)<1.1||Math.hypot(a.bx-x,a.by-y)<1.1||(a.d!==0?(x>=Math.min(a.x,a.bx)-.6&&x<=Math.max(a.x,a.bx)+.6&&Math.abs(y-a.y)<1.5):(y>=Math.min(a.y,a.by)-.6&&y<=Math.max(a.y,a.by)+.6&&Math.abs(x-a.x)<1.5))))return;/* v25: a wire that ends inside the arrowhead is a terminal */
  if(termTx.some(t=>x>=t.x-3&&x<=t.x+16&&Math.abs(t.y-y)<8))return;
  if(fieldBoxes.some(b=>x>=b.x1-2.5&&x<=b.x2+2.5&&y>=b.y1-2.5&&y<=b.y2+2.5))return;
  if(pentB.some(b=>x>=b.x1&&x<=b.x2&&y>=b.y1&&y<=b.y2))return;
  if(cenL.some(q=>Math.hypot(Math.max(q[0]-x,0,x-q[2]),Math.max(q[1]-y,0,y-q[3]))<1.2))return;
  if(eqPts.some(e=>Math.abs(e[0]-x)<e[2]&&Math.abs(e[1]-y)<e[3]))return;
  if(gates.some(g=>g.box&&g.t!=='TMR'&&x>=g.box.x1-.3&&x<=g.box.x2+.3&&y>=g.box.y1-.5&&y<=g.box.y2+.5))return;/* v27: a wire drawn along / inside a gate box (the part past the arrowhead, DITL-94, 96, 24) */
  {const at=adrTx.find(t=>t.x>=x-34&&t.x<=x+18&&t.y>=y-7.5&&t.y<=y+7.5);if(at){termA.push({n:a.n,x,y,lab:at.t});return}}/* v25: the address label may be written to the LEFT / above the arrow end (DITL-18 DCS outputs of the OR gates) *//* v21: a gate output that ends at its DCS output address label (O.0093 / 0.0733) is a terminal *//* v21: ends at a comparator box, a limit symbol, an ICD130 contact or a lamp symbol are terminals *//* v21: touches a dash-dot (CEN) station / field wiring line */
  if(segs.some((b,j)=>j!==i&&b.n===a.n&&dist(x,y,b)<3))return;
  let best=null;segs.forEach(b=>{if(b.n===a.n)return;const d=dist(x,y,b);if(d<3&&(!best||d<best.d))best={d,b}});
  dang.push(best?{x,y,k:a.k,nk:best.b.k,nx:Math.min(Math.max(x,best.b.x1),best.b.x2),ny:Math.min(Math.max(y,best.b.y1),best.b.y2)}:{x,y,k:a.k,nk:-1})}));
 const NL={v:10,split:PG.filter(p=>p.A).map(p=>({k:p.hk,cx:p.cx,a:p.A,b:p.B})),healed,n,seg,gates,src,outs,dang,plnet,dots:dots.map(d=>{const q=segs.find(z=>on(d[0],d[1],z,.8));return{x:d[0],y:d[1],n:q?q.n:-1}}),segs:segs.map(q=>({k:q.k,h:q.h,x1:q.x1,x2:q.x2,y1:q.y1,y2:q.y2,n:q.n}))};/* v26 analog inputs: one per left net of the CMP gates; default value = a normal value that leaves every comparator of that net OFF */
 {const by={};NL.gates.forEach((g,gi)=>{if(g.t==='CMP'){(by[g.ins[0]]=by[g.ins[0]]||[]).push(gi);if(g.spNet!==undefined)(by[g.spNet]=by[g.spNet]||[]).push(gi)}});NL.an=[];NL.anRows=new Set();
  for(const n in by){const gs=by[n].map(i=>NL.gates[i]),asIn=gs.filter(g=>g.ins[0]===+n),asSp=gs.filter(g=>g.spNet===+n),num=asIn.filter(g=>g.spNet===undefined),hs=num.filter(g=>g.cmp==='>').map(g=>g.sp),ls=num.filter(g=>g.cmp==='<').map(g=>g.sp);let def;
   if(asIn.length&&!num.length)def=asIn.some(g=>g.cmp==='>')?0:100;else if(!asIn.length)def=asSp.some(g=>g.cmp==='>')?100:0;/* limit signals sit above (H) / below (L) the measured value */
   else if(hs.length&&ls.length)def=(Math.min(...hs)+Math.max(...ls))/2;else if(hs.length){const m=Math.min(...hs);def=m>0?m*.5:m-1}else{const m=Math.max(...ls);def=m>=0?(m===0?1:m*1.5):m+1}
   const rows=[...new Set(src.filter(z=>z.n===+n&&LEFT.some(c=>(sh.cells[z.row+':'+c]||[]).length)).map(z=>z.row))],r0=rows[0];
   const lab=r0!==undefined?(sh.cells[r0+':S']||[]).map(t=>t.t).join(' ').replace(/\\s+/g,' ').trim():'',tag=r0!==undefined?(sh.cells[r0+':T']||[]).map(t=>t.t).join(' ').trim():'';
   const key=r0!==undefined?'r'+sh.rows[r0].n:'n'+gs[0].box.x1.toFixed(0)+','+gs[0].box.y1.toFixed(0)+(asSp.length&&!asIn.length?'s':'');
   NL.an.push({key,net:+n,row:r0!==undefined?r0:-1,label:(tag?tag+' ':'')+lab,unit:(gs.find(g=>g.unit)||{}).unit||'',def:+def.toFixed(2),g:by[n]});if(r0!==undefined&&rows.length===1)NL.anRows.add(r0)}}
 NL.mv=movModel(sh,NL);NL.mir=mirModel(sh,NL);
 /* v28: a numbered circle in the FROM column of an input row = the signal comes from the connector with the same number in the logic (DITL-21A row 5 <- (4) <- end of the row 26 wire): the row follows that net, it is not a hand switch */
 cons.filter(c=>c.i<0&&c.x<S1-1).forEach(c=>{const peer=cons.find(o=>o.num===c.num&&o.i>=0&&o.x>S1);if(!peer)return;const ri=row(c.y);if(ri<0||!NL.src.some(z=>z.row===ri)||NL.mir.some(m=>m.row===ri))return;NL.mir.push({row:ri,n:segs[peer.i].n,adr:'conn '+c.num})});
 NL.ind=[];NL.mot=motModel(sh,NL);NL.usr=usrModel(sh,NL);NL.usr=NL.usr.concat(fieldInModel(sh,NL,NL.usr));NL.grp=grpModel(sh,NL);
 /* v21: the wire that ends at an equipment block (MOV / SV command, motor start / stop / running, test switch) is a terminal, not a loose end */
 {const cmd=new Set();NL.mv.forEach(b=>{if(b.open)cmd.add(b.open.n);if(b.close)cmd.add(b.close.n)});NL.mot.forEach(m=>{cmd.add(m.mor);if(m.mos>=0)cmd.add(m.mos);cmd.add(m.mir)});NL.usr.forEach(u=>cmd.add(u.n));NL.ind.forEach(m=>cmd.add(m.n));
  /* v26 field outputs: an arrowhead that does not enter a gate, a timer, a comparator, a connector or a right-hand cell is a DCS output going to the field (DITL-18 outputs to the LCP lamps, SV coil circuits, MOV / MCC command). The indicator at its tip shows whether the DCS output is ON; a lamp symbol on the same level lights with it. */
  NL.term=[];{const gOut=new Set(),srcN=new Set(src.map(z=>z.n));gates.forEach(g=>(g.out||[]).forEach(n=>gOut.add(n)));
   const lamps=(sh.syms||[]).filter(z=>z.k==='lamp'&&z.x>S1&&z.x+6<R0-10).map(z=>({x:z.x+6,y:z.y-4.3,sx:z.x,sy:z.y}));/* centre of the lamp symbol (block box x 1.5..10.5, y -7.3..-1.3) */
   const inBox=(P,b,m)=>P[0]>=b.x1-m&&P[0]<=b.x2+m&&P[1]>=b.y1-m&&P[1]<=b.y2+m;
   tri.forEach(t=>{const tip=[t.x,t.y],P=[t.x+(t.d||0)*1.1,t.y+(t.v||0)*1.1];if(t.x>=R0-6||t.x<=S1+2)return;
    if(gates.some(g=>g.box&&inBox(P,g.box,1.6))||gates.some(g=>g.vz&&g.vz.some(u=>P[0]>=u.x1&&P[0]<=u.x2&&P[1]>=u.y1&&P[1]<=u.y2))||cons.some(c=>Math.hypot(c.x-P[0],c.y-P[1])<c.r+3))return;
    const sg=segs.find(q=>q.h?(Math.hypot(q.x1-t.bx,q.y1-t.by)<1.6||Math.hypot(q.x2-t.bx,q.y1-t.by)<1.6):(Math.hypot(q.x1-t.bx,q.y1-t.by)<1.6||Math.hypot(q.x1-t.bx,q.y2-t.by)<1.6));if(!sg||(!gOut.has(sg.n)&&!srcN.has(sg.n)))return;
    const lab=[...sh.tx,...Object.values(sh.cells).flat()].filter(q=>/^([O0]\.[0-9A-F]{4}|[A-Z]{1,3}\d?-[A-Z0-9]{2,}-?[A-Z0-9-]*)/.test(q.t)&&Math.abs(q.y-t.y)<8&&q.x>t.x-40&&q.x<t.x+12).sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y))[0];
    const lp=lamps.filter(l=>l.x>t.x&&Math.abs(l.y-t.y)<7.5&&l.x-t.x<200).sort((a,b)=>a.x-b.x)[0];
    if(!NL.term.some(o=>o.n===sg.n&&Math.abs(o.x-t.x)<2&&Math.abs(o.y-t.y)<2))NL.term.push({n:sg.n,x:t.x,y:t.y,lab:lab?lab.t:'',lamp:lp?{x:lp.x,y:lp.y}:null})});
   /* a gate output that nobody consumes and that ends at a DCS output address label (O.0093 / 0.0733) is a field output (DITL-18 ORs -> LCP lamps) */
   {const used=new Set();gates.forEach(g=>{[...(g.ins||[]),...(g.s||[]),...(g.r||[])].forEach(n=>used.add(n))});outs.forEach(o=>used.add(o.n));
    gates.forEach(g=>{(g.out||[]).forEach(n=>{if(used.has(n))return;const pts=[];segs.filter(q=>q.n===n).forEach(q=>{pts.push([q.x1,q.y1]);pts.push([q.h?q.x2:q.x1,q.h?q.y1:q.y2])});if(!pts.length)return;const e=pts.reduce((a,p2)=>p2[0]>a[0]?p2:a,pts[0]);
     const at=adrTx.find(q=>q.x>=e[0]-34&&q.x<=e[0]+18&&Math.abs(q.y-e[1])<7.5&&/^[O0]\./.test(q.t));if(at)termA.push({n,x:e[0],y:e[1],lab:at.t})})})}
   termA.forEach(o=>{if(!gOut.has(o.n)&&!srcN.has(o.n))return;if(NL.term.some(q=>q.n===o.n&&Math.abs(q.x-o.x)<3&&Math.abs(q.y-o.y)<3))return;const lp=lamps.filter(l=>l.x>o.x&&Math.abs(l.y-o.y)<7.5&&l.x-o.x<200).sort((a,b)=>a.x-b.x)[0];NL.term.push({n:o.n,x:o.x,y:o.y,lab:o.lab,lamp:lp?{x:lp.x,y:lp.y}:null})});
   /* lamps drawn inside the sheet (MCC GREEN / RED): lit when a live wire touches them */
   NL.lamps=lamps.map(l=>{const near=segs.filter(q=>q.h?(Math.abs(q.y1-l.y)<2.6&&q.x2>=l.sx-.5&&q.x1<=l.sx+12):(q.x1>=l.sx-.5&&q.x1<=l.sx+12&&q.y1<=l.y+2.6&&q.y2>=l.y-2.6)).map(q=>q.n);return {x:l.x,y:l.y,nets:[...new Set(near)],linked:NL.term.some(o=>o.lamp&&Math.abs(o.lamp.x-l.x)<.5&&Math.abs(o.lamp.y-l.y)<.5)}})}
  const kn={};segs.forEach(q=>kn[q.k]=q.n);NL.dang=NL.dang.filter(d=>!cmd.has(kn[d.k])&&!NL.usr.some(u=>d.x>=u.pent[0]&&d.x<=u.pent[1]&&d.y>=u.pent[2]&&d.y<=u.pent[3]))}
 return NL}
/* ---------- MOV block model (v9) ----------
 OPEN / CLOSE COMM. text = command entry of a MOV function block. Feedback rows on the right are found by tag:
 ZSO / ZSC = limit switches (follow valve position), MIL = local/remote, MIT = trip, TS/TSC/TSO = torque, ZT = position.
 A right row whose address is also a left input on the same sheet = the same signal (mir = that left row). */
function movModel0(sh,nl){const all=[...sh.tx,...Object.values(sh.cells).flat()],ADR=/[IOM]\.[0-9A-F]{4}/,rowOf=y=>sh.rows.findIndex(r=>y>=r.y-3.3&&y<r.y+5.7),mid=(sh.rng.S[1]+sh.rng.RS[0])/2;
 let cm=all.filter(t=>/^(OPEN|CLOSE)$/.test(t.t)&&t.x>mid-40&&all.some(c=>/^COMM\.?$/.test(c.t)&&Math.abs(c.x-t.x)<2&&Math.abs(c.y-t.y)<5)),old=0;
 if(!cm.length&&all.some(t=>/^ZSO$/.test(t.t)&&t.x>mid)){/* v16: old template MOV (DITL-38): one text "MCV OPEN COMMAND" / "MCV CLOSE COMMAND" inside the MCC box, bare MIL/MIT/ZSO/ZSC/TSC labels, no addresses */
  cm=all.filter(t=>/(^|\s)(OPEN|CLOSE)\s+COMMAND$/i.test(t.t)&&t.x>mid-40&&t.x<sh.rng.RS[0]-30);old=1}if(!cm.length)return[];
 const B=[];for(const t of cm.sort((a,b)=>b.y-a.y)){const k=/OPEN/i.test(t.t)?'open':'close',near=re=>all.filter(q=>re.test(q.t)&&q.x<t.x&&t.x-q.x<30&&Math.abs(q.y-t.y)<6).sort((a,b)=>Math.abs(a.y-t.y)-Math.abs(b.y-t.y))[0];
  const tg=near(/^MO[RS]-/),oa=near(/^O\.[0-9A-F]{4}$/),suf=tg?tg.t.replace(/^MO[RS]-/,''):'',sg=nl.segs.filter(q=>q.h&&Math.abs(q.y1-t.y)<4&&q.x2<=t.x+.5&&q.x2>=t.x-(old?24:6)).sort((a,b)=>b.x2-a.x2)[0];
  let b=B.find(b=>!b[k]&&(b.suf===suf||!suf||!b.suf)&&Math.abs(b.y-t.y)<70);if(!b){b={suf,y:t.y,fb:[]};B.push(b)}if(!b.suf)b.suf=suf;
  b[k]={n:sg?sg.n:-1,tag:tg?tg.t:'',adr:oa?oa.t:'',x:t.x,y:t.y}}
 const L={};sh.rows.forEach((r,i)=>LEFT.forEach(c=>(sh.cells[i+':'+c]||[]).forEach(t=>{const m=t.t.match(ADR);if(m&&!(m[0] in L))L[m[0]]=i})));
 const FB=/^(ZSO|ZSC|MIL|MIT|TSC|TSO|TS|ZT)(?:-(\S+))?$/;
 for(const t of all){const m=FB.exec(t.t);if(!m||t.x<mid)continue;const i=rowOf(t.y);if(i<0)continue;
  const b=B.find(b=>b.suf&&b.suf===m[2])||B.slice().sort((p,q)=>Math.abs(p.y-t.y)-Math.abs(q.y-t.y))[0],ty=/^TS/.test(m[1])?'TS':m[1];
  if(b.fb.some(f=>f.row===i))continue;const ad=all.filter(q=>q.x>t.x-5&&rowOf(q.y)===i&&ADR.test(q.t)).map(q=>q.t.match(ADR)[0])[0]||'';
  let mir=ad&&ad in L?L[ad]:-1;if(mir<0&&!ad){/* no address (old template): the left input row with the same service text is the same signal */const sv=j=>['S','T'].map(c=>(sh.cells[j+':'+c]||[]).map(q=>q.t).join(' ')).join(' ').replace(/\s+/g,' ').trim(),rt=(sh.cells[i+':RS']||[]).map(q=>q.t).join(' ').replace(/\s+/g,' ').trim();if(rt){const j=sh.rows.findIndex((r,jj)=>sv(jj)&&sv(jj)===rt&&nl.src.some(z=>z.row===jj));if(j>=0)mir=j}}
  b.fb.push({ty,tag:t.t,row:i,adr:ad,mir})}
 return B.filter(b=>b.open||b.close).map(b=>({tag:b.suf,open:b.open||null,close:b.close||null,fb:b.fb}))}
const ADRX=/^[IOM]\.[0-9A-F]{4}$/;
function movModel(sh,nl){return movModel0(sh,nl).concat(svModel(sh,nl))}
/* v15 SOLENOID: dashed assembly box (SV-xxx coil, DC 24V contact, ZSO/ZSC) driven by the DCS output wire that enters the box (through a NOT = inverted output: command ON -> coil OFF -> valve goes to its spring position).
   Direction from the text "OPEN COMMAND" / "CLOSE COMMAND" next to that wire. Command ON -> commanded position, command OFF -> opposite position (spring return). ZSO/ZSC on the right follow the position, both OFF while moving. Stroke 3 s. */
function svModel(sh,nl){const all=[...sh.tx,...Object.values(sh.cells).flat()],S1=sh.rng.S[1],R0=sh.rng.RS[0],mid=(S1+R0)/2,res=[],rowOf=y=>sh.rows.findIndex(r=>y>=r.y-3.3&&y<r.y+5.7);
 const D=new Set(nl.src.map(z=>z.n));nl.gates.forEach(g=>(g.out||[]).forEach(n=>D.add(n)));
 const rects=sh.raw.pl.filter(([p,c,l])=>(l==='CEN'||l==='CON')&&p.length>=4&&c).map(([p])=>{const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);return{x1:Math.min(...xs),x2:Math.max(...xs),y1:Math.min(...ys),y2:Math.max(...ys)}}).filter(b=>b.x2-b.x1>15&&b.x2-b.x1<150&&b.y2-b.y1>10&&b.y2-b.y1<90&&b.x1>S1&&b.x2<R0+4);
 const cs=[];sh.raw.ln.forEach(q=>{if(q[4]==='CEN'&&Math.hypot(q[0]-q[2],q[1]-q[3])<130)cs.push([[q[0],q[1]],[q[2],q[3]]])});sh.raw.pl.forEach(([p,c,l])=>{if(l==='CEN'&&!(p.length>=4&&c))for(let i=0;i+1<p.length;i++)cs.push([p[i],p[i+1]])});
 const cp=cs.map((_,i)=>i),cf=i=>cp[i]===i?i:(cp[i]=cf(cp[i])),cn=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<.5;/* v15: dashed assembly box drawn as separate CEN pieces (old template): union pieces that touch, bbox of each cluster */
 cs.forEach((a,i)=>cs.forEach((b,j)=>{if(j>i&&a.some(p=>b.some(q=>cn(p,q))))cp[cf(i)]=cf(j)}));
 const cg={};cs.forEach((q,i)=>(cg[cf(i)]=cg[cf(i)]||[]).push(...q));const clus=Object.values(cg).map(w=>({x1:Math.min(...w.map(z=>z[0])),x2:Math.max(...w.map(z=>z[0])),y1:Math.min(...w.map(z=>z[1])),y2:Math.max(...w.map(z=>z[1]))})).filter(b=>b.x2-b.x1>15&&b.x2-b.x1<150&&b.y2-b.y1>10&&b.y2-b.y1<130);
 const boxAt=t=>{const f=a=>a.filter(b=>t.x>=b.x1&&t.x<=b.x2&&t.y>=b.y1&&t.y<=b.y2).sort((a,b)=>(a.x2-a.x1)*(a.y2-a.y1)-(b.x2-b.x1)*(b.y2-b.y1))[0];return f(rects)||f(clus)||null};
 const L={};sh.rows.forEach((r,i)=>LEFT.forEach(c=>(sh.cells[i+':'+c]||[]).forEach(t=>{const m=t.t.match(/[IOM]\.[0-9A-F]{4}/);if(m&&!(m[0] in L))L[m[0]]=i})));const seen=new Set();
 for(const t of all.filter(t=>/^SV-/.test(t.t)&&t.x>S1&&t.x<R0)){const suf=t.t.slice(3),bx=boxAt(t);if(!bx||seen.has(suf+'@'+bx.x1.toFixed(0)+bx.y1.toFixed(0)))continue;
  let zs=all.filter(q=>/^ZS[OC]-/.test(q.t)&&q.x>mid&&q.t.slice(4)===suf);if(!zs.length)zs=all.filter(q=>/^ZS[OC]-/.test(q.t)&&q.x>mid&&q.x>=bx.x1&&q.x<=bx.x2+4&&q.y>=bx.y1&&q.y<=bx.y2);const noZS=!zs.length;/* ZS tag may differ from the SV tag (DITL-20 CL1061-A7): inside the same box counts. v26: no ZS at all (DITL-44, 86, 92, 93) = only the coil is shown */
  const sg=nl.segs.filter(q=>q.h&&D.has(q.n)&&q.x2<=bx.x1+1&&q.x2>=bx.x1-46&&q.y1>=bx.y1-4&&q.y1<=bx.y2+4&&Math.abs(q.y1-t.y)<28).sort((a,b)=>b.x2-a.x2||Math.abs(a.y1-t.y)-Math.abs(b.y1-t.y))[0];if(!sg)continue;seen.add(suf+'@'+bx.x1.toFixed(0)+bx.y1.toFixed(0));
  const ct=all.filter(q=>/(OPEN|CLOSE)\s+COMMAND/i.test(q.t)&&Math.abs(q.y-sg.y1)<20&&q.x<bx.x1+5).sort((a,b)=>Math.abs(a.y-sg.y1)-Math.abs(b.y-sg.y1))[0],dir=ct&&/CLOSE/i.test(ct.t)?'close':'open',ng=nl.gates.find(g=>g.t==='NOT'&&(g.out||[]).includes(sg.n)),after=!!(ng&&ct&&ct.x>=ng.box.x2-.5),inv=!!ng&&!after;/* the label before the NOT (left row) names the DCS command, the label after it (DITL-62 CLOSE COMMAND over the contact) names what the energized coil does */
  /* right row of ZSO/ZSC: the row whose service text says OPEN / CLOS(ED) and is nearest to the label (old template draws the label between two rows) */
  const rsT=[];sh.rows.forEach((r,i)=>(sh.cells[i+':RS']||[]).forEach(q=>rsT.push({q,i})));
  const zr=z=>{const re=/^ZSO/.test(z.t)?/OPEN/i:/CLOS/i,cs=rsT.filter(o=>re.test(o.q.t)&&!/COMMAND/i.test(o.q.t)).map(o=>{const hd=rsT.filter(h=>h!==o&&!/^[IOM]\.[0-9A-F]{4}/.test(h.q.t)&&h.q.y>o.q.y&&h.q.y-o.q.y<10).sort((a,b)=>a.q.y-b.q.y)[0],row=hd?rowOf(hd.q.y):o.i;return{row,d:Math.abs(sh.rows[row>=0?row:o.i].y+1.2-z.y)}}).sort((a,b)=>a.d-b.d)[0];return cs&&cs.row>=0?cs.row:rowOf(z.y)};/* the cell block starts at its first text line: OPENED / CLOSED can be written on the 2nd line (old template) */
  const fb=[];for(const z of zs){const i=zr(z);if(i<0)continue;const ad=all.filter(q=>q.x>z.x-5&&q.x<z.x+30&&Math.abs(q.y-z.y)<7&&/[IOM]\.[0-9A-F]{4}/.test(q.t)).map(q=>q.t.match(/[IOM]\.[0-9A-F]{4}/)[0])[0]||'';fb.push({ty:z.t.slice(0,3),tag:z.t,row:i,adr:ad,mir:ad&&ad in L?L[ad]:-1})}
  const sv0=all.find(q=>q.t==='SV'&&q.x>=bx.x1&&q.x<=bx.x2&&q.y>=bx.y1&&q.y<=bx.y2),ci=sv0&&sh.raw.ci.filter(c=>c[2]>2.5&&c[2]<7&&Math.hypot(c[0]-sv0.x,c[1]-sv0.y)<c[2]+3).sort((a,b)=>Math.hypot(a[0]-sv0.x,a[1]-sv0.y)-Math.hypot(b[0]-sv0.x,b[1]-sv0.y))[0];
  if(fb.length||noZS)res.push({tag:suf,sv:1,noZS,dir,inv,coil:ci?{x:ci[0],y:ci[1],r:ci[2]}:null,open:{n:sg.n,tag:t.t,adr:'',x:bx.x1,y:sg.y1},close:null,fb})}
 return res}
/* v14 mirror: a left input whose address is also the label of an INTERNAL signal on the same sheet (e.g. DITL-81 M.0603 on the open-command latch, left row 23) is that signal, not a hand switch */
function mirModel(sh,nl){const D=new Set(),SN=new Set(nl.src.map(z=>z.n)),S1=sh.rng.S[1],R0=sh.rng.RS[0],res=[];nl.gates.forEach(g=>(g.out||[]).forEach(n=>D.add(n)));
 const L={};sh.rows.forEach((r,i)=>LEFT.forEach(c=>(sh.cells[i+':'+c]||[]).forEach(t=>{if(ADRX.test(t.t)&&nl.src.some(z=>z.row===i))(L[t.t]=L[t.t]||new Set()).add(i)})));
 for(const t of sh.tx.filter(t=>ADRX.test(t.t)&&t.x>S1+4&&t.x<R0-4&&L[t.t])){const sg=nl.segs.filter(q=>q.h&&Math.abs(q.y1-t.y)<5&&q.x1-1<=t.x+4&&q.x2+1>=t.x-4&&D.has(q.n)&&!SN.has(q.n)).sort((a,b)=>Math.abs(a.y1-t.y)-Math.abs(b.y1-t.y))[0];if(!sg)continue;
  L[t.t].forEach(i=>{if(!res.some(m=>m.row===i)&&!nl.src.some(z=>z.row===i&&z.n===sg.n))res.push({row:i,n:sg.n,adr:t.t})})}
 return res}
/* v14 MOTOR: MOR-xxx (start command) -> motor runs after 2 s -> MIR-/MIF-xxx running feedback net. Only when that feedback net is not already driven by logic drawn on the sheet (DITL-76 draws its own softstarter logic) */
function motModel(sh,nl){const all=[...sh.tx,...Object.values(sh.cells).flat()],D=new Set(),SN=new Set(nl.src.map(z=>z.n)),S1=sh.rng.S[1],R0=sh.rng.RS[0],res=[];nl.gates.forEach(g=>(g.out||[]).forEach(n=>D.add(n)));
 const L={},AB=x=>{const m=String(x).match(/[IOM]\.[0-9A-F]{4}/);return m?m[0]:x};sh.rows.forEach((r,i)=>LEFT.forEach(c=>(sh.cells[i+':'+c]||[]).forEach(t=>{if(nl.src.some(z=>z.row===i))(L[AB(t.t)]=L[AB(t.t)]||new Set()).add(i)})));
 const used=new Set();
 for(const t of all.filter(t=>/^MI[RF]-/.test(t.t)&&t.x>S1&&t.x<R0)){const suf=t.t.slice(4),hasF=all.some(q=>q.t==='MIF-'+suf),mosR=all.find(q=>q.t==='MOS-'+suf&&q.x>S1&&all.some(w=>/^REVERSE$/i.test(w.t)&&Math.abs(w.x-q.x)<6&&w.y>q.y-1&&w.y-q.y<14)),rev=t.t[2]==='R'&&hasF&&!!mosR;/* v17: inverter drive (DITL-21A): MOR = START/FORWARD -> MIF, MOS = REVERSE -> MIR */
  const ms=all.filter(q=>(rev?/^MOS-/:/^MOR-/).test(q.t)&&q.t.slice(4)===suf&&q.x<t.x&&q.x>S1).sort((a,b)=>Math.abs(a.y-t.y)-Math.abs(b.y-t.y));
  /* v16: the running-feedback net is the net that reaches the right cell of the row where the MIR/MIF label is written (it is free = not driven by drawn logic) */
  const ou=nl.outs.filter(o=>!D.has(o.n)&&!SN.has(o.n)&&!used.has(o.n)&&Math.abs(sh.rows[o.row].y+1.2-t.y)<3.5).sort((a,b)=>Math.abs(sh.rows[a.row].y+1.2-t.y)-Math.abs(sh.rows[b.row].y+1.2-t.y))[0];
  const sg=ou?{n:ou.n}:nl.segs.filter(q=>q.h&&Math.abs(q.y1-t.y)<4&&q.x1>=t.x+3&&q.x1<=t.x+60).sort((a,b)=>a.x1-b.x1)[0];if(!sg||D.has(sg.n)||SN.has(sg.n)||used.has(sg.n))continue;
  for(const m of ms){const mg=nl.segs.filter(q=>q.h&&Math.abs(q.y1-m.y)<4&&q.x2>=m.x-12&&q.x2<=m.x+14&&!SN.has(q.n)).sort((a,b)=>Math.abs(a.x2-m.x)-Math.abs(b.x2-m.x))[0];if(!mg||!D.has(mg.n))continue;
   used.add(sg.n);const ad=all.filter(q=>/^I\.[0-9A-F]{4}/.test(q.t)&&Math.abs(q.x-t.x)<50&&q.y>=t.y-12.5&&q.y<=t.y+3).sort((a,b)=>Math.abs(a.y-t.y)-Math.abs(b.y-t.y))[0]||all.filter(q=>/^[IO]\.[0-9A-F]{4}/.test(q.t)&&Math.abs(q.x-t.x)<50&&Math.abs(q.y-t.y)<9).sort((a,b)=>Math.abs(a.y-t.y)-Math.abs(b.y-t.y))[0];
   /* STOP command MOS-xxx (pulse, DITL-45): the field panel seals the START pulse in until the STOP pulse arrives */
   const mo=rev?null:all.find(q=>q.t==='MOS-'+suf&&q.x<t.x&&q.x>S1&&!mosR),og=mo&&nl.segs.filter(q=>q.h&&Math.abs(q.y1-mo.y)<4&&q.x2>=mo.x-12&&q.x2<=mo.x+14&&!SN.has(q.n)).sort((a,b)=>Math.abs(a.x2-mo.x)-Math.abs(b.x2-mo.x))[0];
   res.push({tag:suf+(t.t[2]==='F'?' (fwd)':rev?' (rev)':''),kind:t.t.slice(0,3),mor:mg.n,mos:og&&D.has(og.n)?og.n:-1,mir:sg.n,adr:ad?ad.t:''});if(ad&&L[AB(ad.t)])L[AB(ad.t)].forEach(i=>{if(!nl.mir.some(x=>x.row===i))nl.mir.push({row:i,n:sg.n,adr:ad.t})});break}}
 /* v17: any right row whose net is free (not driven by drawn logic, not a model output) and whose address (written in the cell or beside the MIL/MIT/MIA label) is the SAME as a left input = indication of that input (field alarm shown on the CRT). */
 for(const o of nl.outs){const i=o.row;if(D.has(o.n)||SN.has(o.n)||used.has(o.n))continue;if(nl.ind.some(m=>m.n===o.n))continue;const cy=sh.rows[i].y+1.2;
  const ad=all.filter(q=>/^[IM]\.[0-9A-F]{4}/.test(q.t)&&q.x>S1&&Math.abs(q.y-cy)<6.5&&(q.x>R0-2||(q.x>S1+60&&q.x<R0))).map(q=>AB(q.t)).filter(a=>L[a]);
  const a=ad[0];if(!a)continue;used.add(o.n);L[a].forEach(r=>nl.ind.push({row:r,n:o.n,adr:a}))}
 return res}
/* v14 user test switch: pentagon ELECTRICAL TROUBLE (arrow pointing into the wire) is a field/relay signal that does not come from the DCS: give it a switch */
/* v17 address groups: left input rows that carry the SAME address are one signal. One row writes (the PB row if there is one, else the first), the others read it (a leading "-" reads it inverted). A PB that has readers is a mode selector (AUTO PB): press = toggle, the DCS keeps the state. */
function grpModel(sh,nl){const AB=x=>{const m=String(x).match(/[IOM]\.[0-9A-F]{4}/);return m?m[0]:null},G={};
 sh.rows.forEach((r,i)=>{if(!nl.src.some(z=>z.row===i)||(nl.mir||[]).some(m=>m.row===i))return;/* v28: a row that follows an internal signal / connector is never part of an address group */const txt=LEFT.map(c=>(sh.cells[i+':'+c]||[]).map(q=>q.t)).flat();const a=txt.map(AB).find(Boolean);if(!a||!LEFT.some(c=>(sh.cells[i+':'+c]||[]).length))return;
  const inv=txt.some(t=>/^\s*-\s*[IOM]\./.test(t)),pb=txt.some(t=>/(^|[^A-Z])P\.?\s?B\.?($|[^A-Z])|PUSH\s*-?\s*BUTTON/i.test(t));(G[a]=G[a]||[]).push({row:i,inv,pb,adr:a})});
 const res=[];for(const a in G){const g=G[a];if(g.length<2)continue;const m=g.find(x=>x.pb&&!x.inv)||g.find(x=>!x.inv)||g[0];res.push({master:m.row,toggle:!!m.pb,adr:a,readers:g.filter(x=>x!==m).map(x=>({row:x.row,inv:x.inv}))})}
 return res}
function fieldInModel(sh,nl,exist){const S1=sh.rng.S[1],R0=sh.rng.RS[0],all=[...sh.tx,...Object.values(sh.cells).flat()],drv=new Set(),con=new Set(),res=[];
 nl.src.forEach(z=>{if(LEFT.some(c=>(sh.cells[z.row+':'+c]||[]).length))drv.add(z.n)});nl.gates.forEach(g=>{(g.out||[]).forEach(n=>drv.add(n));[...(g.ins||[]),...(g.s||[]),...(g.r||[])].forEach(n=>con.add(n))});
 (nl.mot||[]).forEach(m=>drv.add(m.mir));(nl.ind||[]).forEach(m=>drv.add(m.n));(nl.mir||[]).forEach(m=>drv.add(m.n));(exist||[]).forEach(u=>drv.add(u.n));
 const mod=new Set();(nl.mv||[]).forEach(b=>b.fb.forEach(f=>mod.add(f.row)));nl.outs.forEach(o=>{if(!mod.has(o.row))con.add(o.n)});
 const circ=sh.raw.ci.filter(c=>c[2]>1.8&&c[2]<4.6);
 for(const n of con){if(drv.has(n))continue;const sg=nl.segs.filter(q=>q.n===n);if(!sg.length)continue;const pts=[];sg.forEach(q=>{pts.push([q.x1,q.y1]);pts.push([q.h?q.x2:q.x1,q.h?q.y1:q.y2])});
  if(sg.some(q=>q.x1<S1+3))continue;if(pts.some(p=>circ.some(c=>Math.hypot(p[0]-c[0],p[1]-c[1])<c[2]+3)))continue;
  const e=pts.reduce((a,p)=>p[0]<a[0]?p:a,pts[0]);
  const tg=all.filter(q=>/^[A-Z]{1,4}\d?-[A-Z0-9]{2,}[A-Z0-9-]*$/.test(q.t.trim())&&q.x>e[0]-62&&q.x<e[0]+10&&q.y>=e[1]-5&&q.y<=e[1]+9).sort((a,b)=>Math.hypot(a.x-e[0],a.y-e[1])-Math.hypot(b.x-e[0],b.y-e[1]))[0];/* the field tag is written above the wire start (BI8-DO1043-A, MIA-CL1061-A2) */
  if(!tg)continue;res.push({n,x:e[0]-5,y:e[1],key:'FI'+tg.t,label:tg.t,fin:1,pent:[1e9,1e9,1e9,1e9]})}
 return res}
function usrModel(sh,nl){const res=[],S1=sh.rng.S[1],R0=sh.rng.RS[0],all=[...sh.tx,...Object.values(sh.cells).flat()],T=all.filter(t=>/^(ELECTRIC(AL)?(\s*TROUBLE)?|TROUBLE)$/i.test(t.t)&&t.x>S1&&t.x<R0),used=new Set();
 /* v21: the pentagon ELECTRICAL TROUBLE is drawn as lines (or a polyline) with the text in one or two lines inside; its left tip is the end of the wire. Field / relay signal: gets a TEST SWITCH. */
 for(const t of T){if(used.has(t))continue;const grp=T.filter(q=>!used.has(q)&&Math.abs(q.x-t.x)<16&&Math.abs(q.y-t.y)<14);grp.forEach(q=>used.add(q));
  const minX=Math.min(...grp.map(q=>q.x)),maxX=Math.max(...grp.map(q=>q.x))+20,my=grp.reduce((a,q)=>a+q.y,0)/grp.length;
  const sg=nl.segs.filter(q=>q.h&&q.x2>=minX-14&&q.x2<=minX+1&&Math.abs(q.y1-my)<8).sort((a,b)=>Math.abs(a.y1-my)-Math.abs(b.y1-my))[0];if(!sg)continue;
  res.push({n:sg.n,x:maxX+4,y:sg.y1,key:'ET'+Math.round(minX)+'_'+Math.round(sg.y1),label:'ELECTRICAL TROUBLE',pent:[minX-9,maxX,sg.y1-8,sg.y1+8]})}
 return res}
function simulate(nl,act){/* v10: keeps the last state (seal-in / latch memory) and applies one net change per step, so cross interlocks (NOT of the other command) settle instead of flipping */
 const N=nl.n;let v=nl._v&&nl._v.length===N?nl._v.slice():new Array(N).fill(0);
 const q0=nl.gates.map(g=>g.q);
 for(let it=0;it<4*N+60;it++){const w=new Array(N).fill(0);(nl.fx||[]).forEach(n=>w[n]=1);(nl.ufx||[]).forEach(n=>w[n]=1);const MR=nl.mir||[];nl.src.forEach(s=>{if(act.has(s.row)&&!MR.some(m=>m.row===s.row))w[s.n]=1});MR.forEach(m=>{if(v[m.n])nl.src.forEach(z=>{if(z.row===m.row)w[z.n]=1})});(nl.ind||[]).forEach(m=>{if(act.has(m.row))w[m.n]=1});
  nl.gates.forEach((g,gi)=>{const I=a=>a.some(n=>v[n]);let o=0;
   if(g.t==='AND')o=g.ins.length&&g.ins.every(n=>v[n]);else if(g.t==='OR')o=I(g.ins);else if(g.t==='NOT')o=g.ins.length&&!I(g.ins);
   else if(g.t==='CMP'){const val=n=>{const a=(nl.an||[]).find(x=>x.net===n);return (a&&nl.avk&&nl.avk[a.key]!==undefined)?nl.avk[a.key]:(a?a.def:0)},v0=val(g.ins[0]),sp=g.spNet!==undefined?val(g.spNet):g.sp;o=g.cmp==='>'?(g.eq?v0>=sp:v0>sp):(g.eq?v0<=sp:v0<sp)}
   else if(g.t==='TMR')o=g.st.out;
   else{const s=I(g.s),r=I(g.r);if(r)g.q=0;else if(s)g.q=1;o=g.q}
   if(o)g.out.forEach(n=>w[n]=1)});
  const d=[];for(let n=0;n<N;n++)if(w[n]!==v[n])d.push(n);if(!d.length)break;
  const src=new Set(nl.src.map(z=>z.n));const pick=d.find(n=>src.has(n));if(pick!==undefined)d.filter(n=>src.has(n)).forEach(n=>v[n]=w[n]);else v[d[0]]=w[d[0]]}
 nl._v=v;return v}
/* ---------- render ---------- */
const COL={CON:'#4fd18b',HID:'#35505f',CEN:'#e0a030',DCS:'#ffd24a',SYM:'#4fd18b'},stk=l=>COL[l]||'#cfd8dc';
const dash=l=>l==='HID'?'2 1.2':l==='CEN'?'4 1 1 1':null;
function el(n,a,p){const e=document.createElementNS(NS,n);for(const k in a)if(a[k]!=null)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function tx(t,p){const e=el('text',{x:t.x,y:-t.y,'font-size':t.h,fill:t.l==='DCS'?COL.DCS:'#e6edf3','text-anchor':(t.a===1||t.a===4)?'middle':t.a===2?'end':'start','dominant-baseline':t.a===4?'central':t.b===1?'text-after-edge':t.b===2?'central':t.b===3?'text-before-edge':'alphabetic'},p);
 if(t.r)e.setAttribute('transform',`rotate(${-t.r} ${t.x} ${-t.y})`);e.style.fontFamily="Consolas,'Cascadia Mono',monospace";e.textContent=t.t}
const SIDE={L:['F','L','T','S'],R:['RS','RL','RT']};
function render(){
 const svg=$('svg'),s=cur();svg.innerHTML='';$('meta').hidden=!s;
 if(s&&(!s.nl||s.nl.v!==10)){s.nl=netlist(s);s.uvDone=false}if(s&&s.nl)s.nl.avk=s.av||null;uvApply(s);uvSave();
 let SV=null,rowOn=new Set(),outOn=new Set(),barLit=new Set();
 let FRC=new Map();if(SIM&&s){s.nl.ufx=(s.nl.usr||[]).filter(u=>s.usw&&s.usw[u.key]).map(u=>u.n);FRC=mvForced(s);rowOn=simIn(s);
  SV=simulate(s.nl,rowOn);(s.nl.mir||[]).forEach(m=>FRC.set(m.row,!!SV[m.n]));grpState(s).forEach((v,i)=>FRC.set(i,v));s.nl.outs.forEach(o=>{if(SV[o.n])outOn.add(o.row)});mvOut(s,rowOn).forEach((v,row)=>{if(v){outOn.add(row);s.nl.outs.forEach(o=>{if(o.row===row)SV[o.n]=1})}else outOn.delete(row)});if(!s.nl.gates.length)rowOn.forEach(i=>outOn.add(i));s.nl.gates.forEach(g=>{if(g.bar>=0&&g.ins.some(n=>SV[n]))barLit.add(g.bar)})}
 try{localStorage.setItem('ditl.v1',J(S));LSF=false}catch(e){if(window.PRE_N){try{localStorage.removeItem('ditl.v1')}catch(x){}}else if(!LSF){LSF=true;msg('Autosave is FULL (browser storage ~5 MB). Use Save project now.')}}
 try{if(cur())localStorage.setItem('ditl.curname',cur().name)}catch(e){}
 if(s)fixSave(s);
 $('bundo').disabled=!hist.length;$('bredo').disabled=!fut.length;
 {const ss=$('shsel');if(ss){ss.innerHTML='';S.sheets.forEach((x,i)=>{const o=document.createElement('option');o.value=i;o.textContent=(x.bv!==BV?'⚠ ':'')+x.name;if(i===S.cur)o.selected=true;ss.appendChild(o)})}}
 drawSide();
 if(!s){svg.setAttribute('viewBox','0 0 400 100');el('text',{x:200,y:50,'text-anchor':'middle',fill:'#7d8e9a','font-size':6},svg).textContent='Import a DXF (ASCII) to start';return}
 const g=el('g',{},svg);let a=[1e9,1e9,-1e9,-1e9];const ext=(x,y)=>{a[0]=Math.min(a[0],x);a[1]=Math.min(a[1],-y);a[2]=Math.max(a[2],x);a[3]=Math.max(a[3],-y)};
 const SPL={};(s.nl.split||[]).forEach(p=>SPL[p.k]=p);
 s.raw.ln.forEach(([x1,y1,x2,y2,l],k)=>{ext(x1,y1);ext(x2,y2);const sp=SPL[k];if(sp){const xa=Math.min(x1,x2),xb=Math.max(x1,x2);[[xa,sp.cx,sp.a],[sp.cx,xb,sp.b]].forEach(([u1,u2,kk])=>{const n=SV?s.nl.seg[kk]:undefined,lit=n!==undefined&&SV[n];el('line',{x1:u1,y1:-y1,x2:u2,y2:-y1,stroke:n===undefined?stk(l):lit?LIVES[LIVE]:'#2b5f46','stroke-width':lit?.7:.35},g)});return}const n=SV?s.nl.seg[k]:undefined,lit=n!==undefined&&SV[n];
  el('line',{x1,y1:-y1,x2,y2:-y2,stroke:n===undefined?stk(l):lit?LIVES[LIVE]:'#2b5f46','stroke-width':lit?.7:.35,'stroke-dasharray':dash(l)},g)});
 s.raw.pl.forEach(([p,c,l],k)=>{p.forEach(q=>ext(q[0],q[1]));const pn=SV&&s.nl.plnet?s.nl.plnet[k]:undefined,lit=barLit.has(k)||(pn!==undefined&&SV[pn]);el('path',{d:'M'+p.map(q=>q[0]+' '+-q[1]).join('L')+(c?'Z':''),fill:'none',stroke:lit?LIVES[LIVE]:pn!==undefined?'#2b5f46':stk(l),'stroke-width':lit?.9:.35,'stroke-dasharray':dash(l)},g)});
 (s.nl.dots||[]).forEach(d=>el('circle',{cx:d.x,cy:-d.y,r:.9,fill:SV?(d.n>=0&&SV[d.n]?LIVES[LIVE]:'#2b5f46'):COL.CON},g));
 for(const[x,y,r,l]of s.raw.ci){ext(x,y);el('circle',{cx:x,cy:-y,r,fill:'none',stroke:stk(l),'stroke-width':.35},g)}
 for(const[x,y,r,a0,a1,l]of s.raw.ar){const P=d=>[x+r*Math.cos(d*Math.PI/180),-(y+r*Math.sin(d*Math.PI/180))],A=P(a0),B=P(a1);
  el('path',{d:`M${A[0]} ${A[1]}A${r} ${r} 0 ${((a1-a0+360)%360)>180?1:0} 0 ${B[0]} ${B[1]}`,fill:'none',stroke:stk(l),'stroke-width':.35},g)}
 for(const[q,l]of s.raw.so)el('polygon',{points:q.map(p=>p[0]+','+-p[1]).join(' '),fill:stk(l),stroke:stk(l),'stroke-width':.1},g);
 for(const[x,y]of(s.raw.lamp||[]))el('path',{d:'M-3 -3L3 3L3 -3L-3 3Z',transform:`translate(${x} ${-y})`,fill:'none',stroke:COL.CON,'stroke-width':.35},g);
 for(const t of s.tx){ext(t.x,t.y);tx(t,g)}
 for(const k in s.cells)for(const t of s.cells[k]){ext(t.x,t.y);tx(t,g)}
 if(!VB[S.cur])VB[S.cur]=[a[0]-6,a[1]-6,a[2]-a[0]+12,a[3]-a[1]+12];
 svg.setAttribute('viewBox',VB[S.cur].join(' '));
const VR=s.vr||s.rng;s.rows.forEach((r,i)=>{for(const c in s.rng){const k=i+':'+c,pop=SIM?(LEFT.includes(c)?fbk(s,i,c):c==='RS'&&outOn.has(i)):(!!s.cells[k]||fbk(s,i,c)),[x1,x2]=VR[c],sl=sel&&sel.k===k;
  const RB=s.rb&&s.rb[i]||[r.y-3.3,r.y+5.7];el('rect',{x:x1,y:-RB[1],width:x2-x1,height:RB[1]-RB[0],class:'hit'+(pop&&SIM&&LEFT.includes(c)?' pop':'')+(SIM&&pop&&(FRC.has(i)&&LEFT.includes(c)?FRC.get(i):s.sig[k])?' on':'')+(SIM&&pop&&FRC.has(i)&&LEFT.includes(c)?' frc':'')+(SIM&&pop&&!LEFT.includes(c)&&outOn.has(i)?' out':'')+(!SIM&&sl?' selc':'')},g)}});
 if(SIM){const xr=VR.S[1];s.rows.forEach((r,i)=>{if(!fbk(s,i,'S'))return;const cy=-(r.y+1.2),on=FRC.has(i)?FRC.get(i):!!s.sig[i+':S'],L=LIVES[LIVE];
  if(FRC.has(i))return;
  if(isPB(s,i)){const w=6.4,h=3.6,x=xr-w-1.2;el('rect',{x,y:cy-h/2,width:w,height:h,rx:.9,fill:on?L:'#1b2731',stroke:on?L:'#7d8e9a','stroke-width':.3,'pointer-events':'none'},g);
   const t=el('text',{x:x+w/2,y:cy+.65,'font-size':1.9,'text-anchor':'middle',fill:on?'#0b1013':'#cfd8dc','pointer-events':'none'},g);t.style.fontFamily='Consolas,monospace';t.style.fontWeight='bold';t.textContent='PB'}
  else{const x=xr-4.6;el('rect',{x,y:cy-1.3,width:3.6,height:2.6,rx:1.3,fill:on?L:'#1b2731',stroke:on?L:'#7d8e9a','stroke-width':.25,'pointer-events':'none'},g);el('circle',{cx:on?x+2.3:x+1.3,cy,r:.85,fill:on?'#0b1013':'#7d8e9a','pointer-events':'none'},g)}})}
 if(SIM)(s.nl.usr||[]).forEach(u=>{const on=!!(s.usw&&s.usw[u.key]),L=LIVES[LIVE],x=u.x-1.8,cy=-u.y;el('rect',{x,y:cy-1.3,width:3.6,height:2.6,rx:1.3,fill:on?L:'#1b2731',stroke:on?L:'#7d8e9a','stroke-width':.25,'pointer-events':'none'},g);el('circle',{cx:on?x+2.3:x+1.3,cy,r:.85,fill:on?'#0b1013':'#7d8e9a','pointer-events':'none'},g);
  const t=el('text',{x:u.fin?x:x+4.4,y:u.fin?cy-2:cy+.6,'font-size':1.6,fill:'#7d8e9a','pointer-events':'none'},g);t.style.fontFamily='Consolas,monospace';t.textContent=u.fin?u.label+' (field)':'TEST SWITCH'});
 if(SIM&&SV){const L=LIVES[LIVE];
  (s.nl.term||[]).forEach(o=>{const on=!!SV[o.n];el('circle',{cx:o.x+(o.dx||0),cy:-o.y,r:1.15,fill:on?L:'#0b1013',stroke:on?L:'#7d8e9a','stroke-width':.3,'pointer-events':'none'},g);
   if(o.lamp&&on)el('ellipse',{cx:o.lamp.x,cy:-o.lamp.y,rx:5,ry:3.1,fill:L,opacity:.5,'pointer-events':'none'},g)});
  (s.nl.lamps||[]).forEach(l=>{if(l.linked)return;if(l.nets.some(n=>SV[n]))el('ellipse',{cx:l.x,cy:-l.y,rx:5,ry:3.1,fill:L,opacity:.5,'pointer-events':'none'},g)});
  (s.nl.mv||[]).forEach(b=>{if(b.sv&&b.coil&&SV[b.open.n])el('circle',{cx:b.coil.x,cy:-b.coil.y,r:b.coil.r-.5,fill:L,opacity:.45,'pointer-events':'none'},g)})}
 if(SIM)(s.nl.an||[]).forEach(a=>{if(a.row<0)return;const r=s.rows[a.row],xr=VR.S[1],v=anVal(s,a),on=a.g.some(i=>cmpOn(s,s.nl.gates[i])),L=LIVES[LIVE];
  const w=Math.max(9,(String(v).length+(a.unit||'').length)*1.25+3);el('rect',{x:xr-w-1,y:-(r.y+1.2)-1.9,width:w,height:3.8,rx:.9,fill:on?L:'#1b2731',stroke:on?L:'#7d8e9a','stroke-width':.25,'pointer-events':'none'},g);
  const t=el('text',{x:xr-1-w/2,y:-(r.y+1.2)+.7,'font-size':2.1,'text-anchor':'middle',fill:on?'#0b1013':'#cfd8e0','pointer-events':'none'},g);t.style.fontFamily='Consolas,monospace';t.style.fontWeight='bold';t.textContent=v+(a.unit?' '+a.unit.slice(0,6):'')});
 el('g',{id:'ov','pointer-events':'none'},svg);drawOv();updatePanel();buildTP();renderMeta();$('bwire').textContent='Wire fix: '+(WT?'On':'Off');$('bwire').className=WT?'on':'';$('bmode').textContent='Mode: '+(SIM?'Simulate':'Edit');$('bmode').className=SIM?'on':''}
/* ---------- state ---------- */
function push(){hist.push(J(S));if(hist.length>40)hist.shift();fut=[]}
function undo(){if(!hist.length)return;fut.push(J(S));S=JSON.parse(hist.pop());render()}
function redo(){if(!fut.length)return;hist.push(J(S));S=JSON.parse(fut.pop());render()}
function xy(ev){const m=$('svg').getScreenCTM().inverse(),p=new DOMPoint(ev.clientX,ev.clientY).matrixTransform(m);return[p.x,-p.y]}
function hit(e){const s=cur();if(!s)return null;const[x,y]=xy(e),i=s.rows.findIndex(r=>y>=r.y-3.3&&y<r.y+5.7);if(i<0)return null;
 const VR=s.vr||s.rng;for(const c in VR)if(x>=VR[c][0]&&x<VR[c][1])return{i,c,k:i+':'+c};return null}
let mt;function msg(t){const e=$('toast');e.textContent=t;e.hidden=false;clearTimeout(mt);mt=setTimeout(()=>e.hidden=true,7000)}
let EDH=null;
function closeEd(){EDH=null;$('ed').hidden=true}
function openEd(h,cx,cy){const s=cur(),ed=$('ed');EDH=h;$('edt').textContent=`Row ${s.rows[h.i].n} · ${h.c}`;
 $('eta').value=(s.cells[h.k]||[]).map(t=>t.t).join('\n');ed.hidden=false;ed.style.left=Math.max(4,Math.min(cx,innerWidth-285))+'px';ed.style.top=Math.max(4,Math.min(cy+14,innerHeight-130))+'px';$('eta').focus();$('eta').select()}
function commitEd(){const h=EDH,s=cur();if(!h)return;push();const it=s.cells[h.k]||[],ls=$('eta').value.split('\n').map(x=>x.trim()).filter(Boolean),x0=s.rng[h.c][0];
 const out=ls.map((t,j)=>it[j]?{...it[j],t}:{t,ix:x0+1.5,iy:s.rows[h.i].y,x:x0+1.5,y:s.rows[h.i].y-j*3.4,h:2.5,r:0,a:0,b:0,l:'TXT1'});
 if(out.length)s.cells[h.k]=out;else delete s.cells[h.k];sel=h;closeEd();render()}
$('eta').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();commitEd()}else if(e.key==='Escape')closeEd();e.stopPropagation()});
function clearSel(){if(!sel||SIM)return;push();const s=cur();delete s.cells[sel.k];delete s.sig[sel.k];render()}
function report(s){const n=s.nl,c={};n.gates.forEach(g=>c[g.t]=(c[g.t]||0)+1);
 const bad=n.gates.filter(g=>g.t==='FF'?!g.s.length||!g.r.length||!g.out.length:!g.ins.length||!g.out.length).length,tm=s.tx.filter(t=>/DELAY|PULSE/.test(t.t)).length-n.gates.filter(g=>g.t==='TMR').length;
 return `${s.name}: ${n.gates.length} gates (${Object.entries(c).map(e=>e[0]+' '+e[1]).join(', ')}), ${n.n} nets, ${n.dots.length} junction dots, ${new Set(n.src.map(x=>x.row)).size} input rows, ${new Set(n.outs.map(x=>x.row)).size} output rows`+(bad?` · ${bad} gate(s) with missing pins`:'')+(n.dang.length?` · ${n.dang.length} loose wire end(s) (${n.dang.filter(d=>d.nk>=0).length} with a gap to a nearby wire) — use Wire fix`:'')+(tm>0?` · ${tm} timer label(s) without a detected symbol (not simulated)`:'')}

/* ---------- live color, wire fix ---------- */
const J=o=>JSON.stringify(o,(k,v)=>k==='nl'?undefined:v);
const LIVES={Red:'#ff4d4d',Yellow:'#ffe14a',Blue:'#4da3ff',Magenta:'#ff4dd2',Green:'#8dffb8'};
let LIVE='Red',WT=false,PEND=null,HOVN=-1,HFIX=-1,NC=true;
try{const v=localStorage.getItem('ditl.live');if(LIVES[v])LIVE=v}catch(e){}
function setLive(){const c=LIVES[LIVE],h=c.slice(1),rgb=[0,2,4].map(i=>parseInt(h.substr(i,2),16)).join(',');
 document.documentElement.style.setProperty('--live',c);document.documentElement.style.setProperty('--lives',`rgba(${rgb},.32)`);
 try{localStorage.setItem('ditl.live',LIVE)}catch(e){}}
for(const k in LIVES){const o=document.createElement('option');o.value=k;o.textContent='Live: '+k;$('slive').appendChild(o)}
$('slive').value=LIVE;setLive();$('slive').onchange=e=>{LIVE=e.target.value;setLive();render()};
function nearSeg(nl,x,y,t){let b=null;for(const q of nl.segs){const d=Math.hypot(Math.max(q.x1-x,0,x-q.x2),Math.max(q.y1-y,0,y-q.y2));if(d<t&&(!b||d<b.d))b={d,q}}return b&&b.q}
function gOf(nl,p){return p.gt?nl.gates.find(q=>q.t===p.gt&&Math.abs((q.box.x1+q.box.x2)/2-p.gx)<2&&Math.abs((q.box.y1+q.box.y2)/2-p.gy)<2):nl.gates[p.g]}
function fixLoad(){try{return JSON.parse(localStorage.getItem('ditl.fixes')||'{}')}catch(e){return{}}}
function fixSave(s){try{const f=fixLoad(),has=(s.links&&s.links.length)||(s.pins&&s.pins.length);if(!has&&!(s.name in f))return;f[s.name]={links:s.links||[],pins:s.pins||[]};localStorage.setItem('ditl.fixes',JSON.stringify(f))}catch(e){}}
const PK={in:'input',out:'output',s:'S input',r:'R input'};
function wl(s,q){const y=(q.y1+q.y2)/2,i=s.rows.findIndex(r=>y>=r.y-3.3&&y<r.y+5.7);return(i>=0?'row '+s.rows[i].n+' ':'')+'x'+Math.round((q.x1+q.x2)/2)}
function fixMk(s){const nl=s.nl,sk={};nl.segs.forEach(q=>sk[q.k]=q);const mid=q=>[(q.x1+q.x2)/2,(q.y1+q.y2)/2],out=[];
 (s.links||[]).forEach((l,i)=>{const p=sk[l[0]],q=sk[l[1]];if(!p||!q){out.push({t:'l',i,stale:true,txt:'Stale join (wire not found)'});return}
  const a=l.length>=6?[l[2],l[3]]:mid(p),b=l.length>=6?[l[4],l[5]]:mid(q);out.push({t:'l',i,x1:a[0],y1:a[1],x2:b[0],y2:b[1],x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,txt:'Join '+wl(s,p)+' ↔ '+wl(s,q)})});
 (s.pins||[]).forEach((p,i)=>{const g=gOf(nl,p),q=sk[p.k];if(!g||!q){out.push({t:'p',i,stale:true,txt:'Stale pin (gate/wire not found)'});return}
  const a=p.px!==undefined?[p.px,p.py]:mid(q),b=[(g.box.x1+g.box.x2)/2,(g.box.y1+g.box.y2)/2];out.push({t:'p',i,x1:a[0],y1:a[1],x2:b[0],y2:b[1],x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,txt:g.t+' '+PK[p.kind]+' ← '+wl(s,q)})});
 return out}
function drawOv(){const o=$('ov'),s=cur();if(!o)return;o.innerHTML='';if(!s||SIM||!WT||!s.nl)return;const nl=s.nl,nc=n=>`hsl(${(n*137.5)%360} 85% 62%)`;
 const ln=(q,c,w,op)=>el('line',{x1:q.x1,y1:-q.y1,x2:q.x2,y2:-q.y2,stroke:c,'stroke-width':w,'stroke-linecap':'round',opacity:op},o);
 if(NC)nl.segs.forEach(q=>ln(q,nc(q.n),.9,.9));
 nl.dots.forEach(d=>el('circle',{cx:d.x,cy:-d.y,r:1.1,fill:'#fff',stroke:'#000','stroke-width':.2},o));
 nl.gates.forEach(g=>{g.pp.forEach(p=>el('circle',{cx:p.x,cy:-p.y,r:.9,fill:nc(p.n),stroke:'#fff','stroke-width':.3},o));if(!g.miss.length)return;const b=g.box;
  el('rect',{x:b.x1-1,y:-b.y2-1,width:b.x2-b.x1+2,height:b.y2-b.y1+2,fill:'rgba(255,154,46,.08)',stroke:'#ff9a2e','stroke-width':.5,'stroke-dasharray':'1.5 1'},o);
  el('text',{x:b.x1-1,y:-b.y2-1.6,'font-size':2.6,fill:'#ff9a2e'},o).textContent='missing: '+g.miss.join(', ')});
 nl.dang.forEach(d=>{const gap=d.nk>=0;if(gap)el('line',{x1:d.x,y1:-d.y,x2:d.nx,y2:-d.ny,stroke:'#ffe14a','stroke-width':.4,'stroke-dasharray':'.8 .6'},o);
  el('circle',{cx:d.x,cy:-d.y,r:1.3,fill:'none',stroke:gap?'#ffe14a':'#ff4d4d','stroke-width':.5},o)});
 fixMk(s).forEach((m,i)=>{if(m.stale)return;const hot=i===HFIX;el('line',{x1:m.x1,y1:-m.y1,x2:m.x2,y2:-m.y2,stroke:hot?'#fff':'#38c9ff','stroke-width':hot?.8:.45,'stroke-dasharray':'1 1'},o);
  el('circle',{cx:m.x,cy:-m.y,r:1.5,fill:hot?'#fff':'#38c9ff',stroke:'#0f1418','stroke-width':.3},o);
  el('text',{x:m.x,y:-m.y,'font-size':2.2,'text-anchor':'middle','dominant-baseline':'central',fill:'#0f1418'},o).textContent='×'});
 if(HOVN>=0)nl.segs.forEach(q=>{if(q.n===HOVN)ln(q,'#fff',1.3)});
 if(PEND){if(PEND.t==='s')nl.segs.forEach(q=>{if(q.n===PEND.n)ln(q,'#ff4dd2',1.3)});else{const b=nl.gates[PEND.gi].box;el('rect',{x:b.x1-1,y:-b.y2-1,width:b.x2-b.x1+2,height:b.y2-b.y1+2,fill:'none',stroke:'#ff4dd2','stroke-width':.8},o)}}}
function updatePanel(){const p=$('wp'),s=cur();p.hidden=!(WT&&!SIM&&s&&s.nl);if(p.hidden)return;const nl=s.nl,mk=fixMk(s);
 $('wsum').textContent=`${nl.n} nets · ${nl.dots.length} junction dots · ${nl.gates.filter(g=>g.miss.length).length} gate(s) missing pins · ${nl.dang.length} loose end(s)`;
 const L=$('wlist');L.innerHTML='';if(!mk.length){L.textContent='No manual fixes yet.';return}
 mk.forEach((m,i)=>{const d=document.createElement('div'),t=document.createElement('span'),b=document.createElement('button');d.className='r';t.textContent=m.txt;b.textContent='✕';b.title='Delete this fix';
  d.onmouseenter=()=>{HFIX=i;drawOv()};d.onmouseleave=()=>{HFIX=-1;drawOv()};b.onclick=()=>delFix(m);d.append(t,b);L.appendChild(d)})}
function delFix(m){const s=cur();push();(m.t==='l'?s.links:s.pins).splice(m.i,1);HFIX=-1;rebuild(s);msg('Fix deleted (Ctrl+Z to undo).')}
function rebuild(s){s.nl=netlist(s);render()}
function pinKind(g,q){const cx=(g.box.x1+g.box.x2)/2,cy=(g.box.y1+g.box.y2)/2,ex=q.h?(Math.abs(q.x1-cx)<Math.abs(q.x2-cx)?q.x1:q.x2):q.x1,ey=q.y1;
 if(g.rev?ex<cx:ex>=cx)return'out';return g.t==='FF'?(ey>cy?'s':'r'):'in'}
function wireClick(e){const s=cur();if(!s||!s.nl)return;const[x,y]=xy(e),nl=s.nl,mk=fixMk(s);
 const m=mk.find(m=>!m.stale&&Math.hypot(m.x-x,m.y-y)<1.8);if(m){delFix(m);return}
 const d=nl.dang.find(d=>d.nk>=0&&Math.hypot(d.x-x,d.y-y)<1.8);
 if(d){push();(s.links=s.links||[]).push([d.k,d.nk,d.x,d.y,d.nx,d.ny]);PEND=null;rebuild(s);msg('Gap connected.');return}
 const sg=nearSeg(nl,x,y,1),snap=q=>({px:Math.min(Math.max(x,q.x1),q.x2),py:Math.min(Math.max(y,q.y1),q.y2)});let pk=null;
 if(sg)pk={t:'s',k:sg.k,seg:sg,n:sg.n,...snap(sg)};else{const gi=nl.gates.findIndex(g=>x>=g.box.x1-2&&x<=g.box.x2+2&&y>=g.box.y1-1&&y<=g.box.y2+1);if(gi>=0)pk={t:'g',gi}}
 if(!pk){PEND=null;drawOv();return}
 if(!PEND){PEND=pk;drawOv();return}
 const a=PEND,b=pk;PEND=null;
 if(a.t==='s'&&b.t==='s'){if(a.n===b.n){drawOv();msg('Those two wires are already in the same net.');return}push();(s.links=s.links||[]).push([a.k,b.k,a.px,a.py,b.px,b.py]);rebuild(s);msg('Wires joined.')}
 else if(a.t==='g'&&b.t==='g')drawOv();
 else{const gi=a.t==='g'?a.gi:b.gi,w=a.t==='s'?a:b,g=nl.gates[gi],kind=pinKind(g,w.seg);push();(s.pins=s.pins||[]).push({gt:g.t,gx:(g.box.x1+g.box.x2)/2,gy:(g.box.y1+g.box.y2)/2,kind,k:w.k,px:w.px,py:w.py});rebuild(s);msg('Wire attached to '+g.t+' as '+PK[kind]+'.')}}
$('bwire').onclick=()=>{if(SIM||!cur())return;WT=!WT;PEND=null;HOVN=-1;render();const n=cur().nl;
 if(WT)msg(`Wire fix: wires are colored per net (same color = connected). ${n.gates.filter(g=>g.miss.length).length} gate(s) with missing pins (orange box), ${n.dang.length} loose end(s): yellow ring = gap to a nearby wire (click it to connect), red ring = nothing nearby.`)};
$('bfix').onclick=()=>{const s=cur();if(!s||!((s.links&&s.links.length)||(s.pins&&s.pins.length)))return;push();s.links=[];s.pins=[];PEND=null;rebuild(s);msg('All manual wire fixes cleared for this sheet.')};
$('wnc').onchange=e=>{NC=e.target.checked;drawOv()};
$('wsave').onclick=()=>{const s=cur();if(s)fixSave(s);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(fixLoad(),null,1)],{type:'application/json'}));a.download='ditl-wire-fixes.json';a.click();msg('Wire fixes saved to file. They are also kept in this browser and re-applied automatically when you import a DXF with the same name.')};
$('wload').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text()),st=fixLoad();Object.assign(st,j);localStorage.setItem('ditl.fixes',JSON.stringify(st));push();let c=0;S.sheets.forEach(x=>{if(j[x.name]){x.links=j[x.name].links||[];x.pins=j[x.name].pins||[];x.nl=null;c++}});render();msg(c+' sheet(s) updated from file.')}catch(x){msg('Invalid fixes file.')}e.target.value=''};
/* ---------- timers ---------- */
const UN={MS:.001,SEC:1,MIN:60,HR:3600},UT={MS:'MS',SEC:'SEC.',MIN:'MIN.',HR:'HR.'};let TSP=1;const tick={t:0};
function unorm(s){const u=s.replace(/[.\s]/g,'').toUpperCase();return u==='MS'?'MS':/^S(EC(OND)?)?S?$/.test(u)?'SEC':/^M(IN(UTE)?)?S?$/.test(u)?'MIN':/^H(R|OUR)?S?$/.test(u)?'HR':null}
function tmGet(m){let v=NaN,u=null;if(m.nt&&m.nt===m.ut){const x=/^(\d+(?:\.\d+)?)\s*([A-Za-z.]+)$/.exec(m.nt.t);if(x){v=+x[1];u=unorm(x[2])}}else{if(m.nt)v=+m.nt.t;if(m.ut)u=unorm(m.ut.t)}
 if(!isFinite(v)&&m.fv)return m.fv;return{v:isFinite(v)?v:5,u:u||'SEC'}}
function tmSet(m,v,u){const t=UT[u];if(!m.nt){m.fv={v,u};return}if(m.nt===m.ut)m.nt.t=v+' '+t;else{m.nt.t=String(v);if(m.ut)m.ut.t=t}}
const tmSecs=m=>{const p=tmGet(m);return p.v*UN[p.u]};
function tmStep(g,inp,dt){const st=g.st,P=tmSecs(g.tm),was=st.out;
 if(g.k==='on'){if(inp){st.acc=Math.min(st.acc+dt,P);st.out=st.acc>=P?1:0}else{st.acc=0;st.out=0}}
 else if(g.k==='off'){if(inp){st.out=1;st.acc=0}else if(st.out){st.acc+=dt;if(st.acc>=P){st.out=0;st.acc=0}}}
 else{const trg=g.k==='npulse'?(!inp&&st.pre):(inp&&!st.pre);if(trg&&!st.run){st.run=1;st.acc=0}if(st.run){st.acc+=dt;if(st.acc>=P){st.run=0;st.acc=0}}st.out=st.run?1:0}
 st.pre=inp?1:0;return st.out!==was}
/* v9 MOV runtime: valve position 0..100 %, starts CLOSED. OPEN command -> runs to 100 %, CLOSE -> runs to 0 % (sealed in, so a pulse command is enough).
 Both commands = stop. Trip (MIT input ON) = motor stops. LOCAL (MIL off) = DCS commands ignored. ZSO = 100 %, ZSC = 0 %; a left input with the same address follows it. */
let MST={},MS={};
function motRT(s){const mt=s.nl&&s.nl.mot||[];let r=MS[s.name];if(!r||r.length!==mt.length)r=MS[s.name]=mt.map(()=>({run:0,acc:0}));return r}
function mtDelay(s){const v=s.mtd&&+s.mtd;return v>0?v:.5}/* contactor / drive feedback delay, 0.5 s (editable): a push button held ~0.6 s must be able to seal in through the running feedback */
function motStep(s,v,dt){const mt=s.nl&&s.nl.mot||[];if(!mt.length)return false;const r=motRT(s),md=mtDelay(s);let ch=false;
 mt.forEach((m,j)=>{const t=!!v[m.mor],sp=m.mos>=0&&!!v[m.mos],x=r[j];
  if(m.mos>=0){if(t&&!x.pm){x.tgt=1;x.acc=0}if(sp&&!x.ps){x.tgt=0;x.acc=0}x.pm=t;x.ps=sp;if(x.tgt===undefined)x.tgt=0;
   if(!!x.tgt!==!!x.run){x.acc+=dt;if(x.acc>=md){x.run=x.tgt;x.acc=0;ch=true}}else x.acc=0}
  else if(t!==!!x.run){x.acc+=dt;if(x.acc>=md){x.run=t?1:0;x.acc=0;ch=true}}else x.acc=0});s.nl.fx=mt.filter((m,j)=>r[j].run).map(m=>m.mir);return ch}
function motTxt(s){const mt=s.nl.mot||[],r=motRT(s);return mt.map((m,j)=>'MOT '+m.tag+': '+(r[j].run?'RUNNING':'STOPPED')+(m.mos<0&&!!r[j].run!==!!simulate(s.nl,simIn(s))[m.mor]||m.mos>=0&&!!r[j].tgt!==!!r[j].run?' (changing…)':'')).join(' | ')}
function mvRT(s){const mv=s.nl&&s.nl.mv||[];let r=MST[s.name];if(!r||r.length!==mv.length)r=MST[s.name]=mv.map(b=>({pos:(b.sv&&b.dir==='close')?100:0,run:0,lr:1,tq:0}));return r}
function mvTr(s,j){const v=s.mvt&&+s.mvt[j];return v>0?v:((s.nl.mv[j]&&s.nl.mv[j].sv)?3:10)}
function mvForced(s){const F=new Map(),mv=s.nl&&s.nl.mv||[];if(!mv.length)return F;const rt=mvRT(s);
 mv.forEach((b,j)=>b.fb.forEach(f=>{if((f.ty==='ZSO'||f.ty==='ZSC')&&f.mir>=0)F.set(f.mir,f.ty==='ZSO'?rt[j].pos>=100:rt[j].pos<=0)}));return F}
function grpState(s){const m=new Map();(s.nl&&s.nl.grp||[]).forEach(g=>{const v=!!s.sig[g.master+':S'];g.readers.forEach(r=>m.set(r.row,r.inv?!v:v))});return m}
function simIn(s){const on=new Set(),F=SIM?mvForced(s):new Map(),GR=SIM?grpState(s):new Map();for(const k in s.sig)if(s.sig[k]&&k.split(':')[1]==='S'){const i=+k.split(':')[0];if(!F.has(i)&&!GR.has(i))on.add(i)}GR.forEach((v,i)=>{if(v)on.add(i)});F.forEach((v,i)=>{if(v)on.add(i)});if(SIM&&s.nl&&s.nl.mv&&s.nl.mv.length){const rt=mvRT(s);s.nl.mv.forEach((b,j)=>{if(rt[j].tq)b.fb.forEach(f=>{if(f.ty==='TS'&&f.mir>=0)on.add(f.mir)})})}return on}
function mvOut(s,act){const M=new Map(),mv=s.nl&&s.nl.mv||[];if(!mv.length)return M;const rt=mvRT(s);
 mv.forEach((b,j)=>{const r=rt[j];b.fb.forEach(f=>{let v=0;if(f.ty==='ZSO')v=r.pos>=100;else if(f.ty==='ZSC')v=r.pos<=0;else if(f.ty==='MIL')v=f.mir>=0?act.has(f.mir):!!r.lr;else if(f.ty==='MIT')v=f.mir>=0&&act.has(f.mir);else if(f.ty==='TS')v=(f.mir>=0&&act.has(f.mir))||r.tq;M.set(f.row,v?1:0)})});return M}
function mvFlags(s,j,act){const b=s.nl.mv[j],r=mvRT(s)[j],mil=b.fb.find(f=>f.ty==='MIL');return{rem:!mil||(mil.mir>=0?act.has(mil.mir):!!r.lr),trip:b.fb.some(f=>f.ty==='MIT'&&f.mir>=0&&act.has(f.mir))}}
function mvStep(s,v,dt){const mv=s.nl&&s.nl.mv||[];if(!mv.length)return false;const rt=mvRT(s),act=simIn(s);let ch=false;
 mv.forEach((b,j)=>{const r=rt[j],o=!!(b.open&&b.open.n>=0&&v[b.open.n]),c=!!(b.close&&b.close.n>=0&&v[b.close.n]),{rem,trip}=mvFlags(s,j,act),st=x=>x>=100?2:x<=0?0:1,s0=st(r.pos),run0=r.run;
  if(b.sv){const cmd=b.inv?!o:o,wantOpen=(b.dir==='close')?!cmd:cmd;if(!r.init){r.init=1;r.pos=wantOpen?100:0}r.run=wantOpen?(r.pos<100?1:0):(r.pos>0?-1:0)}else if(trip)r.run=0;else if(rem){if(o&&c)r.run=0;else if(o&&r.pos<100)r.run=1;else if(c&&r.pos>0)r.run=-1}
  r.pos=Math.max(0,Math.min(100,r.pos+r.run*dt*100/mvTr(s,j)));if((r.run>0&&r.pos>=100)||(r.run<0&&r.pos<=0))r.run=0;
  const tq0=r.tq;r.tq=(!b.sv&&((r.pos<=0&&c&&!o)||(r.pos>=100&&o&&!c)))?1:0;/* v12b: torque switch (TS) trips when the valve is at the end and the motor is still commanded (seats the valve, breaks the seal-in) */
  if(st(r.pos)!==s0||r.run!==run0||r.tq!==tq0)ch=true});return ch}
function mvTxt(s,j){const r=mvRT(s)[j],f=mvFlags(s,j,simIn(s));if(s.nl.mv[j].noZS)return (s.nl._v&&s.nl._v[s.nl.mv[j].open.n])?'SV COIL ENERGIZED (DCS output ON)':'SV coil de-energized';return (s.nl.mv[j].sv?'SV ':'ZT ')+Math.round(r.pos)+'% · '+(r.run>0?'OPENING':r.run<0?'CLOSING':r.pos>=100?'OPEN':r.pos<=0?'CLOSED':'STOPPED')+(f.trip?' · TRIPPED':'')+(f.rem?'':' · LOCAL (DCS command ignored)')}
function mvUI(s){(s.nl.an||[]).forEach((a,k)=>{const e=$('anst'+k);if(!e)return;const v=anVal(s,a);e.textContent=SIM?a.g.map(i=>{const g=s.nl.gates[i];return (g.cmp==='>'?'H ':'L ')+g.cmp+(g.eq?'=':'')+(g.spNet!==undefined?g.spVar:g.sp)+(cmpOn(s,g)?' ON':' off')}).join(' · '):'';e.className='v'});const me=$('motst');if(me&&SIM)me.textContent=motTxt(s);(s.nl&&s.nl.mv||[]).forEach((b,j)=>{const r=mvRT(s)[j],t=$('mvzt'+j),bar=$('mvzb'+j),e=$('mvs'+j);if(t)t.textContent=Math.round(r.pos)+'%';if(bar)bar.setAttribute('width',(bar.dataset.w*r.pos/100).toFixed(2));if(e){e.textContent=SIM?mvTxt(s,j):'';e.className='v'+(SIM&&r.run?' hi':'')}})}
const KN={on:'ON DELAY',off:'OFF DELAY',pulse:'PULSE',npulse:'PULSE (falling)'};
function tmList(){const s=cur();return s&&s.nl?s.nl.gates.filter(g=>g.t==='TMR'):[]}
/* ---------- v22 left sheet pane (replaces the wrapped tab buttons) ---------- */
/* v27: values the user typed (timers, analog values, MOV travel, motor delay, pulse times) are kept in localStorage 'ditl.uv' per sheet name and re-applied when the sheet is shown */
let UVL={};try{UVL=JSON.parse(localStorage.getItem('ditl.uv')||'{}')||{}}catch(e){UVL={}}let UVKEY=JSON.stringify(UVL);
const tmKey=g=>(g.tm.tag||'')+'|'+(g.tm.lab||'')+'|'+g.tm.ax.toFixed(0)+','+g.tm.ay.toFixed(0);
function uvApply(s){if(!s||s.uvDone||!s.nl)return;s.uvDone=true;const u=UVL[s.name];if(!u)return;if(u.av)s.av={...(s.av||{}),...u.av};if(u.mvt)s.mvt={...(s.mvt||{}),...u.mvt};if(u.pdur)s.pdur={...(s.pdur||{}),...u.pdur};if(u.mtd)s.mtd=u.mtd;
 if(u.tmo){s.tmo={...(s.tmo||{}),...u.tmo};s.nl.gates.forEach(g=>{if(g.t!=='TMR'||!g.tm)return;const o=s.tmo[tmKey(g)];if(o&&o[0]>=0){if(g.tm.pg)g.tm.fv={v:o[0],u:o[1]};else tmSet(g.tm,o[0],o[1])}})}
 s.nl.avk=s.av||null}
function uvSave(){const o={...UVL};S.sheets.forEach(s=>{if(!s.uvDone)return;/* not applied yet: keep what is stored */const u={};if(s.av&&Object.keys(s.av).length)u.av=s.av;if(s.mvt&&Object.keys(s.mvt).length)u.mvt=s.mvt;if(s.pdur&&Object.keys(s.pdur).length)u.pdur=s.pdur;if(s.mtd)u.mtd=s.mtd;if(s.tmo&&Object.keys(s.tmo).length)u.tmo=s.tmo;if(Object.keys(u).length)o[s.name]=u;else delete o[s.name]});
 const j=JSON.stringify(o);if(j!==UVKEY){UVKEY=j;UVL=o;try{localStorage.setItem('ditl.uv',j)}catch(e){}}}
let SIDEKEY='',SIDEFL='',SIDEMIN=null;try{SIDEMIN=localStorage.getItem('ditl.side')}catch(e){}if(SIDEMIN===null)SIDEMIN=innerWidth<820?'1':'0';
function drawSide(){const sd=$('side'),list=$('sidelist');if(!sd)return;sd.classList.toggle('min',SIDEMIN==='1');$('sidetg').textContent=SIDEMIN==='1'?'▶':'◀';
 const cn=S.sheets[S.cur]?S.sheets[S.cur].name:'';$('sidect').textContent='Sheets ('+S.sheets.length+')';$('sidevt').textContent=cn?cn+'  ·  '+(S.cur+1)+'/'+S.sheets.length:'Sheets';
 const key=S.sheets.map(x=>x.name+(x.bv!==BV?'!':'')).join('|')+'#'+SIDEFL;
 if(key!==SIDEKEY){SIDEKEY=key;list.innerHTML='';const f=SIDEFL.trim().toLowerCase();
  S.sheets.forEach((x,i)=>{if(f&&(x.name+' '+(x.title||'')).toLowerCase().indexOf(f)<0)return;const b=document.createElement('button');b.dataset.i=i;const l1=document.createElement('span');l1.className='sn';l1.textContent=(x.bv!==BV?'⚠ ':'')+x.name;b.appendChild(l1);if(x.title){const l2=document.createElement('span');l2.className='st';l2.textContent=x.title;b.appendChild(l2)}b.title=x.bv!==BV?'Imported with an older version: import this DXF again (same name replaces it)':x.name+(x.title?' - '+x.title:'');
   b.onclick=()=>{S.cur=i;sel=null;if(innerWidth<820){SIDEMIN='1';try{localStorage.setItem('ditl.side','1')}catch(e){}}render()};list.appendChild(b)})}
 let on=null;list.querySelectorAll('button').forEach(b=>{const o=+b.dataset.i===S.cur;if(o!==b.classList.contains('on'))b.classList.toggle('on',o);if(o)on=b});
 if(on&&SIDEMIN!=='1'&&drawSide.last!==S.cur){on.scrollIntoView({block:'nearest'})}drawSide.last=S.cur}
{const tg=document.getElementById('sidetg');if(tg)tg.onclick=()=>{SIDEMIN=SIDEMIN==='1'?'0':'1';try{localStorage.setItem('ditl.side',SIDEMIN)}catch(e){}drawSide();render()};const fl=document.getElementById('sidefl');if(fl)fl.oninput=()=>{SIDEFL=fl.value;drawSide()};}
let TPMIN=(innerWidth<820);function buildTP(){const p=$('tp'),T=tmList(),s0=cur(),MV=s0&&s0.nl&&s0.nl.mv||[];const MT0=s0&&s0.nl&&s0.nl.mot||[],AN=s0&&s0.nl&&s0.nl.an||[];p.hidden=!T.length&&!MV.length&&!MT0.length&&!AN.length;if(p.hidden)return;p.innerHTML='';
 const h=document.createElement('div');h.innerHTML='<b>'+(T.length?'Timers':(MV.length&&MV[0].sv?'Solenoid':MV.length?'MOV':MT0.length?'Motor':'Analog inputs'))+'</b> ';p.appendChild(h);
 const mb=document.createElement('button');mb.textContent=TPMIN?'▲':'▼';mb.title=TPMIN?'Show panel':'Hide panel';mb.style.cssText='float:right;padding:0 6px';mb.onclick=()=>{TPMIN=!TPMIN;buildTP()};h.appendChild(mb);if(TPMIN){p.style.width='auto';return}p.style.width='';
 if(SIM){const sp=document.createElement('select');[[1,'Speed 1x (real time)'],[10,'Speed 10x'],[60,'Speed 60x'],[300,'Speed 300x']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;sp.appendChild(o)});sp.value=TSP;sp.onchange=e=>{TSP=+e.target.value};h.appendChild(sp)}
 T.forEach((g,i)=>{const d=document.createElement('div'),pr=tmGet(g.tm),a=document.createElement('span'),n=document.createElement('input'),u=document.createElement('select'),v=document.createElement('div');d.className='r';
  a.textContent=(g.tm.tag?g.tm.tag+' · ':'')+KN[g.k];a.style.minWidth='110px';n.type='number';n.min=0;n.step='any';n.value=pr.v;
  Object.keys(UN).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k==='SEC'?'sec':k==='MIN'?'min':k==='HR'?'hr':'ms';u.appendChild(o)});u.value=pr.u;
  const ch=()=>{const x=parseFloat(n.value);if(!(x>=0))return;push();tmSet(g.tm,x,u.value);{const s1=cur();s1.tmo=s1.tmo||{};s1.tmo[tmKey(g)]=[x,u.value]}if(g.tm.pg){const s=cur();s.pdur=s.pdur||{};s.pdur[g.tm.key]={v:x,u:u.value}}g.st={acc:0,out:0,pre:0,run:0};render()};n.onchange=ch;u.onchange=ch;
  d.append(a,n,u);
  if(SIM){const b=document.createElement('button');b.textContent='Skip';b.title='Finish this timer now';b.onclick=()=>{const s=cur(),vv=simulate(s.nl,simIn(s));tmStep(g,g.ins.some(q=>vv[q]),tmSecs(g.tm)+1);render()};d.appendChild(b)}
  v.className='v';v.id='tpv'+i;d.appendChild(v);p.appendChild(d)});
 if(MV.length&&T.length){const h2=document.createElement('div');h2.innerHTML='<b>'+(MV[0].sv?'Solenoid':'MOV')+'</b>';h2.style.marginTop='6px';p.appendChild(h2)}
 MV.forEach((b,j)=>{const d=document.createElement('div'),a=document.createElement('span'),n=document.createElement('input'),v=document.createElement('div');d.className='r';
  a.textContent=(b.sv?'SV ':'MOV ')+(b.tag||j+1)+(b.noZS?' · coil':b.sv?' · stroke':' · travel');n.type='number';n.min=1;n.step='any';n.value=mvTr(s0,j);n.title='Full stroke time (sec), 0 to 100 %';
  n.onchange=()=>{const x=parseFloat(n.value);if(!(x>0))return;push();s0.mvt=s0.mvt||{};s0.mvt[j]=x;render()};if(b.noZS)d.append(a);else d.append(a,n,document.createTextNode('sec'));
  const mil=b.fb.find(f=>f.ty==='MIL');if(SIM&&mil&&mil.mir<0){const lr=document.createElement('button'),r=mvRT(s0)[j];lr.textContent=r.lr?'REMOTE':'LOCAL';lr.className=r.lr?'on':'';lr.title='MIL '+(mil.adr||'')+' has no input on this sheet: select LOCAL / REMOTE here';lr.onclick=()=>{r.lr=r.lr?0:1;render()};d.appendChild(lr)}
  v.className='v';v.id='mvs'+j;d.appendChild(v);p.appendChild(d)});
 if(AN.length){const h3=document.createElement('div');h3.innerHTML='<b>Analog inputs (high / low limits)</b>';h3.style.marginTop='6px';p.appendChild(h3);
  AN.forEach(a=>{const d=document.createElement('div'),sp=document.createElement('span'),n=document.createElement('input'),st=document.createElement('div');d.className='r';sp.textContent=(a.label||a.key).slice(0,34);sp.title=a.label||a.key;
   n.type='number';n.step='any';n.value=anVal(s0,a);n.title='Process value'+(a.unit?' ('+a.unit+')':'');n.onchange=()=>{const x=parseFloat(n.value);if(!isFinite(x))return;push();s0.av=s0.av||{};s0.av[a.key]=x;s0.nl.avk=s0.av;render()};
   d.append(sp,n,document.createTextNode(a.unit||''));st.className='v';st.id='anst'+AN.indexOf(a);p.appendChild(d);p.appendChild(st)})}
 if(MT0.length){const d=document.createElement('div');d.className='r';const a=document.createElement('span'),n=document.createElement('input'),v=document.createElement('div');a.textContent='Motor run feedback delay';n.type='number';n.min=.1;n.step='any';n.value=mtDelay(s0);n.onchange=()=>{const x=parseFloat(n.value);if(!(x>0))return;push();s0.mtd=x;render()};d.append(a,n,document.createTextNode('sec'));v.className='v';v.id='motst';d.appendChild(v);p.appendChild(d)}
 updateTP();if(s0)mvUI(s0)}
function updateTP(){tmList().forEach((g,i)=>{const e=$('tpv'+i);if(!e)return;if(!SIM){e.textContent='';return}const P=tmSecs(g.tm),f=x=>x>=60?(x/60).toFixed(1)+' min':x.toFixed(1)+' s';
  e.textContent=`${f(g.st.acc)} / ${f(P)} · OUT ${g.st.out?'1':'0'}`;e.className='v'+(g.st.out?' hi':'')})}
setInterval(()=>{const s=cur();if(!SIM||!s||!s.nl){tick.t=0;return}const T=tmList(),MV=s.nl.mv||[],MT=s.nl.mot||[];if(!T.length&&!MV.length&&!MT.length)return;
 const now=performance.now(),dt=Math.min((now-(tick.t||now))/1000,1)*TSP;tick.t=now;const v=simulate(s.nl,simIn(s));let ch=false;
 T.forEach(g=>{if(tmStep(g,g.ins.some(n=>v[n]),dt))ch=true});if(mvStep(s,v,dt))ch=true;if(motStep(s,v,dt))ch=true;if(ch)render();else{updateTP();mvUI(s)}},100);
/* ---------- title banner ---------- */
let MUI={al:'center',sz:'M'};try{const v=JSON.parse(localStorage.getItem('ditl.meta')||'null');if(v&&v.al)MUI=v}catch(e){}
const mpar=n=>{const m=/^[_(\s]*(\d+)[_)\s]+(.+)$/.exec(n||'');return m?{no:m[1],dwg:m[2].trim()}:{no:'',dwg:n||''}};
const MSZ={S:[15,11],M:[22,13],L:[32,17]};
function renderMeta(){const s=cur(),m=$('meta');m.hidden=!s;if(!s)return;if(!s.meta)s.meta={...mpar(s.name),title:s.title||''};if(!s.meta.title&&s.title)s.meta.title=s.title;
 const z=MSZ[MUI.sz]||MSZ.M,al=MUI.al;$('mtx').style.textAlign=al;$('m_sub').style.justifyContent=al==='left'?'flex-start':al==='right'?'flex-end':'center';
 $('m_title').style.fontSize=z[0]+'px';$('m_sub').style.fontSize=z[1]+'px';$('msz').value=MUI.sz;
 document.querySelectorAll('#mctl button').forEach(b=>b.className=b.dataset.al===al?'on':'');
 document.querySelectorAll('#meta .ed').forEach(e=>{if(document.activeElement!==e)e.textContent=s.meta[e.dataset.k]||''})}
document.querySelectorAll('#meta .ed').forEach(e=>{e.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();e.blur()}else if(ev.key==='Escape'){e.textContent=(cur().meta||{})[e.dataset.k]||'';e.blur()}ev.stopPropagation()});
 e.addEventListener('paste',ev=>{ev.preventDefault();document.execCommand('insertText',false,(ev.clipboardData.getData('text')||'').replace(/\s+/g,' '))});
 e.addEventListener('blur',()=>{const s=cur();if(!s)return;const t=e.textContent.trim();if(t===(s.meta[e.dataset.k]||''))return;push();s.meta[e.dataset.k]=t;render()})});
document.querySelectorAll('#mctl button').forEach(b=>b.onclick=()=>{MUI.al=b.dataset.al;try{localStorage.setItem('ditl.meta',JSON.stringify(MUI))}catch(e){}renderMeta()});
$('msz').onchange=e=>{MUI.sz=e.target.value;try{localStorage.setItem('ditl.meta',JSON.stringify(MUI))}catch(x){}renderMeta()};
/* ---------- events ---------- */
const svg=$('svg');let dn=null,tm=null,last={t:0,k:''};
const PTR=new Map();let pinch=null;
svg.addEventListener('pointerdown',e=>{PTR.set(e.pointerId,[e.clientX,e.clientY]);if(PTR.size===2){const a=[...PTR.values()];pinch={d:Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1])};if(dn)dn.m=true;PBD=null;return}closeEd();dn={x:e.clientX,y:e.clientY,m:false};svg.setPointerCapture(e.pointerId);
 const s=cur();if(SIM&&s){const h=hit(e);if(h&&h.c==='S'&&fbk(s,h.i,'S')&&isPB(s,h.i)&&!lockd(s,h.i)){if((s.nl.grp||[]).some(g=>g.master===h.i&&g.toggle)){s.sig[h.k]=!s.sig[h.k];dn.pb=2;render();return}PBD={k:h.k,t:Date.now()};s.sig[h.k]=true;dn.pb=1;render()}}});
svg.addEventListener('pointermove',e=>{const s=cur();if(!s)return;if(PTR.has(e.pointerId))PTR.set(e.pointerId,[e.clientX,e.clientY]);
 if(PTR.size===2&&pinch){const a=[...PTR.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]),v=VB[S.cur];if(d>8&&pinch.d>8){const f=pinch.d/d,r=svg.getBoundingClientRect(),cx=(a[0][0]+a[1][0])/2-r.left,cy=(a[0][1]+a[1][1])/2-r.top,k=svg.getScreenCTM().a,px=v[0]+cx/k,py=v[1]+cy/k;v[0]=px-(px-v[0])*f;v[1]=py-(py-v[1])*f;v[2]*=f;v[3]*=f;svg.setAttribute('viewBox',v.join(' '));pinch.d=d}return}
 if(dn&&(dn.m||Math.hypot(e.clientX-dn.x,e.clientY-dn.y)>4)){dn.m=true;const k=svg.getScreenCTM().a,v=VB[S.cur];v[0]-=(e.clientX-dn.x)/k;v[1]-=(e.clientY-dn.y)/k;dn.x=e.clientX;dn.y=e.clientY;svg.setAttribute('viewBox',v.join(' '))}
 const p=xy(e),h=hit(e);$('st').textContent=`X ${p[0].toFixed(1)}  Y ${p[1].toFixed(1)}`+(h?`   |  row ${s.rows[h.i].n} · ${h.c}`:'');
 if(WT&&!SIM&&s.nl&&!(dn&&dn.m)){const sg=nearSeg(s.nl,p[0],p[1],1.2),hn=sg?sg.n:-1;if(hn!==HOVN){HOVN=hn;drawOv()}}});
svg.addEventListener('pointercancel',e=>{PTR.delete(e.pointerId);if(PTR.size<2)pinch=null});
svg.addEventListener('pointerup',e=>{PTR.delete(e.pointerId);if(pinch){if(PTR.size<2)pinch=null;dn=null;return}if(!dn)return;const d=dn;dn=null;if(d.pb===2){return}if(PBD){const p=PBD,sh=cur();PBD=null;setTimeout(()=>{if(sh){sh.sig[p.k]=false;render()}},Math.max(0,600-(Date.now()-p.t)));return}if(d.m)return;const h=hit(e),now=Date.now(),s=cur();if(!s)return;
 clearTimeout(tm);
 if(SIM){const[ux,uy]=xy(e),u=(s.nl.usr||[]).find(u=>Math.abs(ux-u.x)<3.2&&Math.abs(uy-u.y)<2.4);if(u){s.usw=s.usw||{};s.usw[u.key]=!s.usw[u.key];render();return}}
 if(!SIM&&WT){wireClick(e);return}
 if(!SIM&&h&&last.k===h.k&&now-last.t<350){last={t:0,k:''};openEd(h,e.clientX,e.clientY);return}
 last={t:now,k:h?h.k:''};
 if(SIM){if(h&&LEFT.includes(h.c)&&isAn(s,h.i)){const a=s.nl.an.find(x=>x.row===h.i);if(a)anAsk(s,a);return}if(h&&LEFT.includes(h.c)&&fbk(s,h.i,h.c)){if(lockd(s,h.i)){msg('This input follows the equipment (limit switch / feedback of an internal signal), it is not clicked by hand.');return}s.sig[h.k]=!s.sig[h.k];render()}return}
 tm=setTimeout(()=>{sel=h;render()},h?330:0)});
svg.addEventListener('wheel',e=>{if(!cur())return;e.preventDefault();const v=VB[S.cur],f=e.deltaY<0?.85:1.18,p=xy(e),px=p[0],py=-p[1];
 v[0]=px-(px-v[0])*f;v[1]=py-(py-v[1])*f;v[2]*=f;v[3]*=f;svg.setAttribute('viewBox',v.join(' '))},{passive:false});
addEventListener('keydown',e=>{if(document.activeElement===$('eta')||document.activeElement===$('sidefl')||(document.activeElement&&document.activeElement.isContentEditable))return;if(e.key==='PageDown'&&S.cur<S.sheets.length-1){e.preventDefault();S.cur++;sel=null;render();return}if(e.key==='PageUp'&&S.cur>0){e.preventDefault();S.cur--;sel=null;render();return}if(e.ctrlKey&&e.key==='z'){e.preventDefault();undo()}else if(e.ctrlKey&&e.key==='y'){e.preventDefault();redo()}else if(e.key==='Delete')clearSel();else if(e.key==='Escape'){sel=null;PEND=null;render()}});
$('bmode').onclick=()=>{SIM=!SIM;MST={};MS={};sel=null;WT=false;PEND=null;closeEd();S.sheets.forEach(x=>{x.sig={};x.usw={};if(x.nl){x.nl._v=null;x.nl.fx=[];x.nl.ufx=[]}(x.nl&&x.nl.gates||[]).forEach(g=>{if(g.t==='FF')g.q=0;if(g.t==='TMR')g.st={acc:0,out:0,pre:0,run:0}})});tick.t=0;if(SIM&&cur())msg('Simulate: click the SERVICE cell of an input row (switch icon) to turn it ON/OFF. PB rows are push buttons: press and hold.');render()};
$('shsel').onchange=e=>{S.cur=+e.target.value;sel=null;render()};$('shprev').onclick=()=>{if(S.cur>0){S.cur--;sel=null;render()}};$('shnext').onclick=()=>{if(S.cur<S.sheets.length-1){S.cur++;sel=null;render()}};
$('bundo').onclick=undo;$('bredo').onclick=redo;$('bclr').onclick=clearSel;$('bfit').onclick=()=>{delete VB[S.cur];render()};
let dt=null;$('bdel').onclick=function(){if(!cur())return;if(!dt){this.textContent='Click again to delete';dt=setTimeout(()=>{dt=null;this.textContent='Delete sheet'},3000);return}
 clearTimeout(dt);dt=null;this.textContent='Delete sheet';push();S.sheets.splice(S.cur,1);S.cur=Math.max(0,S.cur-1);sel=null;render()};
$('bsave').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([J(S)],{type:'application/json'}));a.download='ditl-project.json';a.click()};
$('fjson').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());push();S=j;VB={};sel=null;render()}catch(x){msg('Invalid project file.')}e.target.value=''};
let LSF=false,FAILS=[];
const isAn=(s,i)=>!!(s.nl&&s.nl.anRows&&s.nl.anRows.has(i));/* v26: row that feeds only limit comparators = analog input (numeric value, not a switch) */
const anVal=(s,a)=>(s.av&&s.av[a.key]!==undefined)?s.av[a.key]:a.def;
const anValN=(s,n)=>{const a=(s.nl.an||[]).find(x=>x.net===n);return a?anVal(s,a):0};
const cmpOn=(s,g)=>{const v=anValN(s,g.ins[0]),sp=g.spNet!==undefined?anValN(s,g.spNet):g.sp;return g.cmp==='>'?(g.eq?v>=sp:v>sp):(g.eq?v<=sp:v<sp)};
const cmpTxt=g=>(g.cmp==='>'?'High ':'Low ')+g.cmp+(g.eq?'=':'')+' '+(g.spNet!==undefined?g.spVar:g.sp)+(g.unit||'');
function anAsk(s,a){const g=a.g.map(i=>s.nl.gates[i]),v=prompt((a.label||a.key)+'\n'+g.map(cmpTxt).join('   ')+'\n\nProcess value'+(a.unit?' ('+a.unit+')':'')+':',anVal(s,a));if(v===null)return;const x=parseFloat(String(v).replace(',','.'));if(!isFinite(x))return;s.av=s.av||{};s.av[a.key]=x;s.nl.avk=s.av;render()}
const fbk=(s,i,c)=>c==='S'&&s.nl&&s.nl.src.some(z=>z.row===i)&&!isAn(s,i)&&LEFT.some(q=>(s.cells[i+':'+q]||[]).length);/* v17: no text in the row = wire stub of a bar / pulse glyph, not an input (no switch) */
/* v11: push button input = the row text says PB / P.B. / PUSH BUTTON: momentary (ON while pressed, at least 0.4 s) */
const isPB=(s,i)=>LEFT.some(c=>(s.cells[i+':'+c]||[]).some(t=>/(^|[^A-Z])P\.?\s?B\.?($|[^A-Z])|PUSH\s*-?\s*BUTTON/i.test(t.t)));let PBD=null;const lockd=(s,i)=>mvForced(s).has(i)||(s.nl.mir||[]).some(m=>m.row===i)||grpState(s).has(i);/* v10: the input of a row = its SERVICE cell, only rows that a wire reaches */
function diag(s){const n=s.nl,is=[],S1=s.rng.S[1],R0=s.rng.RS[0],sr=new Set(n.src.map(x=>x.row));
 const lab=s.tx.filter(t=>t.ix>S1&&t.ix<R0&&/^(AND|OR|NOT)$/.test(t.t));
 ['AND','OR','NOT'].forEach(k=>{const d=lab.filter(t=>t.t===k).length-n.gates.filter(g=>g.t===k).length;if(d>0)is.push(d+' '+k+' label(s) with no gate detected')});
 const bad=n.gates.filter(g=>g.t==='FF'?!g.s.length||!g.r.length||!g.out.length:!g.ins.length||!g.out.length).length;if(bad)is.push(bad+' gate(s) missing pins');
 if(n.dang.length)is.push(n.dang.length+' loose wire end(s)');
 const tm=s.tx.filter(t=>/DELAY|PULSE/.test(t.t)).length-n.gates.filter(g=>g.t==='TMR').length;if(tm>0)is.push(tm+' timer(s) not detected');
 let nw=0,nc=0;s.rows.forEach((r,i)=>{const has=LEFT.some(c=>s.cells[i+':'+c]);if(has&&!sr.has(i))nw++;if(!has&&sr.has(i))nc++});
 if(nw)is.push(nw+' input row(s) have text but no wire reaches them');if(nc)is.push(nc+' wired row(s) have no input text (clickable at T cell)');
 const x0=s.rng.F[0],orph=s.tx.filter(t=>t.ix>=x0-3&&t.ix<S1&&s.rows.some(r=>t.y>=r.y-3.3&&t.y<r.y+5.7&&!(/^\d{1,3}$/.test(t.t)&&+t.t===+r.n))).length;if(orph)is.push(orph+' text(s) in table rows outside any cell');
 if(!n.gates.length)is.push('no gates');if(!sr.size)is.push('no input wires');if(!n.outs.length)is.push('no output wires');
 return{is,sev:is.some(x=>/no gates|no input|no output|no gate detected|missing pins/.test(x))?2:is.length?1:0}}
function showHealth(only){const p=$('hp'),rows=S.sheets.map((s,i)=>({s,i,d:diag(s)})),bad=rows.filter(r=>r.d.sev),ok=rows.length-bad.length;
 const txt=`DITL health: ${rows.length} sheets, ${ok} OK, ${bad.length} with issues, ${FAILS.length} failed import\n`+FAILS.map(f=>'FAILED '+f).join('\n')+'\n'+bad.map(r=>`${r.s.name}: ${r.d.is.join('; ')}${r.s.lyr?' [wire layer '+r.s.lyr+']':''}${r.s.nl.healed?' [healed '+r.s.nl.healed+']':''}`).join('\n');
 p.hidden=false;p.innerHTML=`<b>Health</b> — ${rows.length} sheets · <span style="color:#4fd18b">${ok} OK</span> · <span style="color:#ffb84a">${bad.length} issues</span> · <span style="color:#ff6b6b">${FAILS.length} failed</span>${LSF?' · <span style="color:#ff6b6b">AUTOSAVE FULL, use Save project</span>':''} <label><input type="checkbox" id="hpo" ${only===false?'':'checked'}> problems only</label> <button id="hpc">Close</button><br>`;
 const L=document.createElement('div');p.appendChild(L);FAILS.forEach(f=>{const d=document.createElement('div');d.style.color='#ff6b6b';d.textContent='✕ '+f;L.appendChild(d)});
 const po=()=>$('hpo').checked;const draw=()=>{[...L.querySelectorAll('.hr')].forEach(x=>x.remove());rows.filter(r=>!po()||r.d.sev).forEach(r=>{const d=document.createElement('div');d.className='hr';d.style.cssText='cursor:pointer;padding:2px 0;border-top:1px solid #1f3340';d.innerHTML=`<b style="color:${r.d.sev===2?'#ff6b6b':r.d.sev?'#ffb84a':'#4fd18b'}">${r.s.name}</b> ${r.d.is.join(' · ')||'OK'}`;d.onclick=()=>{S.cur=r.i;sel=null;render()};L.appendChild(d)})};draw();
 const ta=document.createElement('textarea');ta.readOnly=true;ta.rows=4;ta.style.cssText='width:100%;margin-top:6px';ta.value=txt;ta.onfocus=()=>ta.select();p.appendChild(ta);
 $('hpo').onchange=draw;$('hpc').onclick=()=>p.hidden=true}
$('bhp').onclick=()=>showHealth();
$('fdxf').onchange=async e=>{const fl=[...e.target.files];if(!fl.length)return;FAILS=[];let ok=0,lastR='';push();
 for(let i=0;i<fl.length;i++){const f=fl[i];msg(`Importing ${i+1}/${fl.length}: ${f.name}`);await new Promise(r=>setTimeout(r,0));
  try{const E=parse(await f.text()),sh=E.length?build(E,f.name.replace(/\.dxf$/i,'')):null;
   if(!sh){FAILS.push(f.name+': no entities or row numbers found (export as ASCII DXF)');continue}
   const fx=fixLoad()[sh.name];if(fx&&((fx.links&&fx.links.length)||(fx.pins&&fx.pins.length))){sh.links=fx.links||[];sh.pins=fx.pins||[];sh.nl=netlist(sh)}
   {const oi=S.sheets.findIndex(x=>x.name===sh.name);if(oi>=0){sh.meta=S.sheets[oi].meta;sh.mvt=S.sheets[oi].mvt;sh.pdur=S.sheets[oi].pdur;S.sheets[oi]=sh;S.cur=oi;delete VB[oi]}else{S.sheets.push(sh);S.cur=S.sheets.length-1}}ok++;lastR=report(sh)+(sh.nl.healed?` · ${sh.nl.healed} tiny gap(s) auto-joined`:'')}catch(x){FAILS.push(f.name+': '+x.message)}}
 e.target.value='';sel=null;render();
 if(fl.length===1){msg(FAILS.length?FAILS[0]:lastR)}else{msg(`${ok}/${fl.length} imported`+(FAILS.length?`, ${FAILS.length} failed`:''));showHealth()}};
window.PRE_N=134;
render();{const n=S.sheets.filter(x=>x.bv!==BV&&!window.PRE_N).length;if(n)msg(n+' sheet(s) marked ⚠ were imported with an older version. Import the DXF again to apply the fixes (same name replaces the old sheet, your fixes are kept).')}

/* ---------- v19 built-in sheets: all DXF logic sheets are inside this file (no import needed, works on a phone) ---------- */
addEventListener('load',async()=>{const e0=document.getElementById('pre');if(!e0||!window.PRE_N)return;
 const stale=S.sheets.some(x=>x.bv!==BV);if(S.sheets.length>=PRE_N&&!stale)return;
 if(typeof DecompressionStream==='undefined'){msg('This browser is too old to open the built-in sheets. Update Chrome / Safari.');return}
 msg('Loading built-in sheets...');
 try{const bin=Uint8Array.from(atob(e0.textContent.trim()),c=>c.charCodeAt(0));
  const txt=await gunz(bin);
  const pre=txt.split('\n').filter(Boolean).map(l=>JSON.parse(l)),old=new Map(S.sheets.map(x=>[x.name,x])),fx=fixLoad();
  const out=pre.map(p=>{const o=old.get(p.name);if(o&&o.bv===BV)return o;if(o){p.meta=o.meta||p.meta;p.mvt=o.mvt;p.pdur=o.pdur}const f=fx[p.name];if(f){p.links=f.links||p.links;p.pins=f.pins||p.pins}return p});
  S.sheets.forEach(x=>{if(!pre.some(p=>p.name===x.name))out.push(x)});
  let cn=null;try{cn=localStorage.getItem('ditl.curname')}catch(e){}cn=cn||(S.sheets[S.cur]&&S.sheets[S.cur].name);
  S.sheets=out;const ix=out.findIndex(x=>x.name===cn);S.cur=ix>=0?ix:Math.max(0,out.findIndex(x=>/DITL-56$/.test(x.name)));VB={};hist=[];fut=[];render();
  msg(out.length+' sheets loaded. Pick a page from the sheet list on the left (the arrow button hides it).')}catch(e){msg('Could not load the built-in sheets: '+e.message)}});
