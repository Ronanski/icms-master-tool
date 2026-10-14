/* ===== ANALOG builder part 2: nets (union-find), arrows, pins ===== */
/* a wire drawn straight through a timer half-disc would short its input and output: cut the part inside the symbol */
function anTimerCut(S){const out=[];const A=S.R.ar.filter(a=>/^CON$/i.test(a.l)&&a.r>=3.5&&a.r<=9&&Math.abs(((a.a1-a.a0+360)%360)-180)<12);if(!A.length)return;
 for(const a of A){const ch=S.seg.filter(s=>Math.abs(s.x1-s.x2)<.06&&Math.abs(s.x1-a.x)<.4&&Math.abs(s.y1-s.y2)>=a.r*1.2&&Math.min(s.y1,s.y2)<=a.y+a.r*.6&&Math.max(s.y1,s.y2)>=a.y-a.r*.6);ch.forEach(s=>{s.use=1;S.gl.push(s)});S.seg=S.seg.filter(s=>!ch.includes(s))}
 const iv=A.map(a=>{const right=!(a.a0>=80&&a.a0<=100&&a.a1>=260&&a.a1<=280);return{y:a.y,lo:(right?a.x:a.x-a.r)+.4,hi:(right?a.x+a.r:a.x)-.4}});
 const Q=S.seg.slice();while(Q.length){const s=Q.pop();let hit=null;if(Math.abs(s.y1-s.y2)<.2)for(const v of iv)if(Math.abs(s.y1-v.y)<=1.2){const mn=Math.min(s.x1,s.x2),mx=Math.max(s.x1,s.x2);if(mx>v.lo&&mn<v.hi){hit=v;break}}
  if(!hit){out.push(s);continue}
  const mn=Math.min(s.x1,s.x2),mx=Math.max(s.x1,s.x2),first=s.x1<=s.x2?'mn':'mx';
  if(mn<hit.lo)Q.push({...s,x1:mn,x2:hit.lo,ar:s.ar&&first==='mn'?1:0});
  if(mx>hit.hi)Q.push({...s,x1:mx,x2:hit.hi,ar:s.ar&&first==='mx'?1:0})}
 S.seg=out}
function anNets(S){
 anTimerCut(S);const R=S.R,SG=S.seg;SG.forEach((s,i)=>s.id=i);
 const par=SG.map((_,i)=>i),f=i=>{while(par[i]!==i){par[i]=par[par[i]];i=par[i]}return i},un=(a,b)=>{a=f(a);b=f(b);if(a!==b)par[a]=b};
 const CS=10,grid=new Map(),key=(x,y)=>Math.floor(x/CS)+','+Math.floor(y/CS);
 const put=(s,i)=>{const x0=Math.floor((Math.min(s.x1,s.x2)-.6)/CS),x1=Math.floor((Math.max(s.x1,s.x2)+.6)/CS),y0=Math.floor((Math.min(s.y1,s.y2)-.6)/CS),y1=Math.floor((Math.max(s.y1,s.y2)+.6)/CS);
  for(let a=x0;a<=x1;a++)for(let b=y0;b<=y1;b++){const k=a+','+b;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i)}};
 SG.forEach(put);
 const near=(x,y,r)=>{const o=new Set();for(let a=Math.floor((x-r)/CS);a<=Math.floor((x+r)/CS);a++)for(let b=Math.floor((y-r)/CS);b<=Math.floor((y+r)/CS);b++){const L=grid.get(a+','+b);if(L)L.forEach(i=>o.add(i))}return o};
 /* SIG.AB box: the wire that leaves the junction next to the box carries the digital "signal abnormal" of the AI, it is not the analog wire */
 const cut=new Set(),ck=(a,b)=>a<b?a+','+b:b+','+a;S.sigab=[];
 for(const sh of S.shp){if(sh.ty!=='rect'||!R.tx.some(t=>/SIG\.AB/i.test(t.t)&&t.x>=sh.x0-.3&&t.x<=sh.x1+.3&&t.y>=sh.y0-.3&&t.y<=sh.y1+.3))continue;
  const Ls=SG.filter(s=>[[s.x1,s.y1],[s.x2,s.y2]].some(([x,y])=>anDistPoly(sh.p,x,y)<.8));if(!Ls.length)continue;const L=Ls[0];
  const dl=S.dot.filter(d=>anPtSeg(d.x,d.y,L)<=d.r+.4);if(!dl.length)continue;
  const bx=(Math.abs(L.x1-sh.cx)<Math.abs(L.x2-sh.cx)?[L.x1,L.y1]:[L.x2,L.y2]);dl.sort((a,b)=>anD(a.x,a.y,bx[0],bx[1])-anD(b.x,b.y,bx[0],bx[1]));const d2=dl[0];
  const onL=q=>anPtSeg(q[0],q[1],L)<.4;const br=SG.filter(j=>!Ls.includes(j)&&[[j.x1,j.y1],[j.x2,j.y2]].some(([x,y])=>anD(x,y,d2.x,d2.y)<=d2.r+.6)&&!([[j.x1,j.y1],[j.x2,j.y2]].every(onL)));
  const bs=(j,hz)=>{const m=hz?(j.x1+j.x2)/2-d2.x:(j.y1+j.y2)/2-d2.y,w=hz?bx[0]-d2.x:bx[1]-d2.y;return Math.abs(w)<.3||Math.abs(m)<.3||(m>0)===(w>0)};
   const lp=SG.filter(j=>Ls.includes(j)||(Math.abs(j.y1-j.y2)<.06&&Math.abs(L.y1-L.y2)<.06&&Math.abs(j.y1-L.y1)<.2&&bs(j,true))||(Math.abs(j.x1-j.x2)<.06&&Math.abs(L.x1-L.x2)<.06&&Math.abs(j.x1-L.x1)<.2&&bs(j,false)));
  for(const j of br)for(const l of lp)cut.add(ck(j.id,l.id));
  /* the other dots on the trunk must not re-join the branch either */
  if(br.length)S.sigab.push({sh,L,d2,br:br.map(j=>j.id),lp:lp.map(l=>l.id)})}
 const TOL=.4;
 SG.forEach((s,i)=>{for(const[x,y]of[[s.x1,s.y1],[s.x2,s.y2]])for(const j of near(x,y,TOL)){if(j===i||cut.has(ck(i,j)))continue;if(anPtSeg(x,y,SG[j])<=TOL){/* strict T (as DITL v27): an end on the SIDE of another wire joins only through a junction dot; end-to-end and collinear overlaps join; a plain crossing is a pass-through */
   const o=SG[j],e2=anD(x,y,o.x1,o.y1)<=TOL||anD(x,y,o.x2,o.y2)<=TOL,par=Math.abs((SG[i].x2-SG[i].x1)*(o.y2-o.y1)-(SG[i].y2-SG[i].y1)*(o.x2-o.x1))<1e-6*Math.max(1,Math.hypot(SG[i].x2-SG[i].x1,SG[i].y2-SG[i].y1)*Math.hypot(o.x2-o.x1,o.y2-o.y1));
   if(e2||par||S.dot.some(d=>anD(d.x,d.y,x,y)<=d.r+.5)||(s.ar&&x===s.x1&&y===s.y1))un(i,j)}}});
 for(const d of S.dot){const L=[];for(const j of near(d.x,d.y,d.r+.5))if(anPtSeg(d.x,d.y,SG[j])<=d.r+.4)L.push(j);for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++)if(!cut.has(ck(L[a],L[b])))un(L[a],L[b])}
 /* H-12: arrow in a gap of a straight wire */
  {const bridge=(tp,bm)=>{const L=anD(tp[0],tp[1],bm[0],bm[1]);if(L<1)return;const mx=(tp[0]+bm[0])/2,my=(tp[1]+bm[1])/2;if(R.ar.some(a=>a.r>2.5&&anD(a.x,a.y,mx,my)<a.r+3))return;/* the arrow inside the D of a timer separates its input from its output: no bridge */const ux=(tp[0]-bm[0])/L,uy=(tp[1]-bm[1])/L;
    const at=(x,y)=>{let r=-1,bd=.9;SG.forEach((q,i)=>{if(q.use)return;const dx=q.x2-q.x1,dy=q.y2-q.y1,l=Math.hypot(dx,dy)||1;if(Math.abs(dx*uy-dy*ux)/l>.05)return;for(const[px,py]of[[q.x1,q.y1],[q.x2,q.y2]]){const d=anD(px,py,x,y);if(d<bd){bd=d;r=i}}});return r};
    const a=at(tp[0],tp[1]),c=at(bm[0],bm[1]);if(a>=0&&c>=0&&a!==c&&f(a)!==f(c)){un(a,c);(S._br=S._br||[]).push([Math.round(tp[0]),Math.round(tp[1])])}};
   for(const so of R.so){if(so.p.length<3)continue;const P=so.p.slice(0,3);let bs=null;for(let k=0;k<3;k++){const b1=P[(k+1)%3],b2=P[(k+2)%3],bl=anD(b1[0],b1[1],b2[0],b2[1]);if(!bs||bl<bs.bl)bs={k,bl}}
    const q1=P[(bs.k+1)%3],q2=P[(bs.k+2)%3];bridge(P[bs.k],[(q1[0]+q2[0])/2,(q1[1]+q2[1])/2])}
   for(const w of R.arw){const a=w.a*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a);bridge([w.x,w.y],[w.x-dx*w.s,w.y-dy*w.s])}}
  /* a box with a cross (X) in the middle of a wire = hard-wired contact / signal break: the signal goes straight through */
 S.xbox=[];for(const sh of S.shp){if(sh.ty!=='rect'||sh.w>10||sh.h>10||sh.w<3||sh.h<3)continue;if(R.tx.some(t=>t.x>=sh.x0&&t.x<=sh.x1&&t.y>=sh.y0&&t.y<=sh.y1))continue;
  const g=S.gl.filter(q=>q.x1>=sh.x0-.3&&q.x1<=sh.x1+.3&&q.x2>=sh.x0-.3&&q.x2<=sh.x1+.3&&q.y1>=sh.y0-.3&&q.y1<=sh.y1+.3&&q.y2>=sh.y0-.3&&q.y2<=sh.y1+.3&&Math.abs(q.x1-q.x2)>1&&Math.abs(q.y1-q.y2)>1);
  if(g.length<2||g.length>3)continue;const ix=[];SG.forEach((q,i)=>{if([[q.x1,q.y1],[q.x2,q.y2]].some(([x,y])=>anDistPoly(sh.p,x,y)<.7))ix.push(i)});
  if(false&&ix.length>=2){for(let k=1;k<ix.length;k++)un(ix[0],ix[k]);S.xbox.push(sh)}}
 const id=new Map(),nets=[];
 SG.forEach((s,i)=>{const r=f(i);if(!id.has(r)){id.set(r,nets.length);nets.push({id:nets.length,segs:[],dig:0,ana:0,arrows:[],txt:[]})}const n=nets[id.get(r)];s.net=n.id;n.segs.push(i);if(/^CON$/i.test(s.l))n.dig++;else n.ana++});
 nets.forEach(n=>{n.dig=n.dig>n.ana});
 for(const g of S.sigab){const n=SG[g.br[0]].net;g.net=n;nets[n].dig=true;nets[n].sigab=1}
 /* arrows: LEADER first vertex, INSERT _OPEN arrows, SOLID triangles */
 const A=[];
 SG.forEach(s=>{if(s.ar){const L=anD(s.x1,s.y1,s.x2,s.y2)||1;A.push({x:s.x1,y:s.y1,dx:(s.x1-s.x2)/L,dy:(s.y1-s.y2)/L,net:s.net,src:'L'})}});
 for(const w of R.arw){const a=w.a*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a);let best=-1,bd=1e9;
  SG.forEach((s,i)=>{for(const[x,y]of[[s.x1,s.y1],[s.x2,s.y2]]){const d=Math.min(anD(x,y,w.x,w.y),anD(x,y,w.x-dx*w.s,w.y-dy*w.s));if(d<bd){bd=d;best=i}}});
  if(best>=0&&bd<2.2)A.push({x:w.x,y:w.y,dx,dy,net:SG[best].net,src:'I'})}
 for(const so of R.so){if(so.p.length<3)continue;const P=so.p.slice(0,3);let best=null;for(let k=0;k<3;k++){const b1=P[(k+1)%3],b2=P[(k+2)%3],bl=anD(b1[0],b1[1],b2[0],b2[1]);if(!best||bl<best.bl)best={k,bl}}
  if(best.bl>5.5||best.bl<.6)continue;const tip=P[best.k],b1=P[(best.k+1)%3],b2=P[(best.k+2)%3],mx=(b1[0]+b2[0])/2,my=(b1[1]+b2[1])/2,L=anD(tip[0],tip[1],mx,my)||1;
  let bi=-1,bd=1e9;SG.forEach((s,i)=>{const d=Math.min(anPtSeg(tip[0],tip[1],s),anPtSeg(mx,my,s));if(d<bd){bd=d;bi=i}});
  if(bi>=0&&bd<1.5)A.push({x:tip[0],y:tip[1],dx:(tip[0]-mx)/L,dy:(tip[1]-my)/L,net:SG[bi].net,src:'S'})}
 A.forEach(a=>nets[a.net].arrows.push(a));S.nets=nets;S.arrows=A;
 return S}
/* which nets touch a point / a segment-shaped port */
function anTouch(S,x,y,tol){const o=new Set();for(const s of S.seg){for(const[px,py]of[[s.x1,s.y1],[s.x2,s.y2]])if(anD(px,py,x,y)<=tol)o.add(s.net)}return o}
function anArrowAt(S,net,x,y,tol){return S.nets[net].arrows.some(a=>anD(a.x,a.y,x,y)<=tol)}
