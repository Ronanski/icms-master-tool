(function(){
/* ===== ANALOG (ABC) reader: DXF text -> raw geometry (own tokenizer: keeps LEADER vertices, MTEXT, arrows) ===== */
const AN_dec=s=>String(s==null?'':s).replace(/\\+U\+([0-9A-Fa-f]{4})/g,(m,h)=>String.fromCharCode(parseInt(h,16))).replace(/%%%/g,'%').replace(/%%[cC]/g,'Ø').replace(/%%[dD]/g,'°').replace(/%%[pP]/g,'±');
function anRead(txt){
 const L=txt.split(/\r?\n/),E=[],B={},LY={};let sec='',c0=null,cb=null,ly=null,lastVx=null;
 const push=(v,tgt)=>({t:v,l:'0',g:{},v:[],ts:[]});
 for(let i=0;i+1<L.length;i+=2){const c=L[i].trim(),v=L[i+1].trim();
  if(c==='0'){
   if(v==='SECTION'){sec=(L[i+3]||'').trim();c0=null;cb=null;continue}
   if(v==='ENDSEC'){sec='';c0=null;cb=null;continue}
   if(sec==='TABLES'){ly=v==='LAYER'?{}:null;if(ly)(LY.list=LY.list||[]).push(ly);continue}
   if(sec==='BLOCKS'){if(v==='BLOCK'){cb={n:null,b:[0,0],e:[]};c0=null}else if(v==='ENDBLK'){cb=null;c0=null}else if(cb){c0=push(v);cb.e.push(c0)}continue}
   if(sec==='ENTITIES'){c0=push(v);E.push(c0)}continue}
  if(sec==='TABLES'&&ly){if(c==='2'&&ly.n==null)ly.n=v;else if(c==='62')ly.c=+v;else if(c==='70')ly.f=+v;continue}
  if(sec==='BLOCKS'&&cb&&!c0){if(c==='2'&&cb.n===null){cb.n=v;B[v]=cb}else if(c==='10')cb.b[0]=+v;else if(c==='20')cb.b[1]=+v;continue}
  if(!c0)continue;
  if(c==='8'){c0.l=v;continue}
  if(c0.t==='LWPOLYLINE'||c0.t==='LEADER'){
   if(c==='10'){c0.v.push([+v,0]);continue}
   if(c==='20'&&c0.v.length){c0.v[c0.v.length-1][1]=+v;continue}
   if(c0.t==='LWPOLYLINE'&&(c==='40'||c==='41'||c==='43')){c0.g.w=Math.max(c0.g.w||0,+v||0)}
  }
  if(c0.t==='MTEXT'&&(c==='1'||c==='3')){c0.ts.push(v);continue}
  if(!(c in c0.g))c0.g[c]=v}
 const off=new Set((LY.list||[]).filter(l=>l.n&&(l.c<0||(l.f&1))).map(l=>l.n));
 const LYC={};(LY.list||[]).forEach(l=>{if(l.n)LYC[l.n]=Math.abs(l.c||7)});return anExplode(E,B,off,LYC)}
const anMul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]],anAp=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
function anExplode(E,B,OFF,LYC){LYC=LYC||{};
 const R={seg:[],pl:[],dot:[],ci:[],ar:[],so:[],tx:[],arw:[]};
 const go=(ents,M,pl,d,pc)=>{for(const e of ents){const g=e.g,N=k=>+g[k];const l1=e.l==='0'?pl:e.l;const cc=(g[62]!=null&&+g[62]>0&&+g[62]<256)?+g[62]:(g[62]!=null&&+g[62]===0&&pc)?pc:(LYC[l1]||7);
  const l0=e.l==='0'?pl:e.l;if(OFF.has(l0)||l0==='VPORTS'||/FLAME$/i.test(e.t==='INSERT'?g[2]||'':''))continue;
  if(e.t==='INSERT'){const n=g[2],b=B[n];if(!b||d>5)continue;const a=(N(50)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),sx=g[41]!=null?N(41):1,sy=g[42]!=null?N(42):1;
   const M2=anMul(M,anMul([1,0,0,1,N(10)||0,N(20)||0],anMul([c,s,-s,c,0,0],anMul([sx,0,0,sy,0,0],[1,0,0,1,-b.b[0],-b.b[1]]))));
   if(/^_open\d+$/i.test(n)){const q=anAp(M,N(10)||0,N(20)||0),rot=(N(50)||0)+Math.atan2(M[1],M[0])*180/Math.PI;R.arw.push({x:q[0],y:q[1],a:rot,s:sx*Math.hypot(M[0],M[1])});continue}
   if(/FLAME$/i.test(n)&&!b.e.length)continue;
   go(b.e,M2,l0,d+1,cc);continue}
  const sc=Math.hypot(M[0],M[1]),rot=Math.atan2(M[1],M[0])*180/Math.PI;
  if(e.t==='LINE'){const A=anAp(M,N(10),N(20)),C=anAp(M,N(11),N(21));R.seg.push({x1:A[0],y1:A[1],x2:C[0],y2:C[1],l:l0,ar:0,c:cc})}
  else if(e.t==='LEADER'){const v=e.v.map(q=>anAp(M,q[0],q[1])),ah=g[71]==null?1:+g[71];for(let i=0;i+1<v.length;i++)R.seg.push({x1:v[i][0],y1:v[i][1],x2:v[i+1][0],y2:v[i+1][1],l:l0,ar:(i===0&&ah)?1:0,c:cc})}
  else if(e.t==='LWPOLYLINE'){const p=e.v.map(q=>anAp(M,q[0],q[1])),cl=((+g[70]||0)&1)===1,w=(g.w||0)*sc;
   if(cl&&p.length===2){R.dot.push({x:(p[0][0]+p[1][0])/2,y:(p[0][1]+p[1][1])/2,r:Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])/2+w/2,l:l0,c:cc})}
   else if(cl&&p.length>=3)R.pl.push({p,l:l0,c:cc});
   else{for(let i=0;i+1<p.length;i++)R.seg.push({x1:p[i][0],y1:p[i][1],x2:p[i+1][0],y2:p[i+1][1],l:l0,ar:0,c:cc})}}
  else if(e.t==='CIRCLE'){const A=anAp(M,N(10),N(20));R.ci.push({x:A[0],y:A[1],r:N(40)*sc,l:l0,c:cc})}
  else if(e.t==='ARC'){const A=anAp(M,N(10),N(20));R.ar.push({x:A[0],y:A[1],r:N(40)*sc,a0:(N(50)+rot+360)%360,a1:(N(51)+rot+360)%360,l:l0,c:cc})}
  else if(e.t==='SOLID'){const P=[];for(const[kx,ky]of[[10,20],[11,21],[12,22],[13,23]])if(g[kx]!=null)P.push(anAp(M,N(kx),N(ky)));R.so.push({p:P,l:l0,c:cc})}
  else if(e.t==='TEXT'||e.t==='MTEXT'){let t=e.t==='MTEXT'?(e.ts.join('')+(g[1]||'')).replace(/\\P/g,' ').replace(/\{?\\[A-Za-z][^;]*;/g,'').replace(/[{}]/g,''):(g[1]||'');t=AN_dec(t).trim();if(!t||/[　-鿿]/.test(t))continue;
   const a=+g[72]||0,b=+g[74]!=null&&e.t==='MTEXT'?0:(+g[73]||0),A=anAp(M,N(10),N(20));let X=A[0],Y=A[1];if(e.t==='TEXT'&&(a||b)&&g[11]!=null){const q=anAp(M,N(11),N(21));X=q[0];Y=q[1]}
   R.tx.push({t,x:X,y:Y,h:(N(40)||2.5)*sc,a,b,r:(N(50)||0)+rot,l:l0,c:cc,mt:e.t==='MTEXT'?1:0})}}};
 go(E,[1,0,0,1,0,0],'0',0,0);return R}
