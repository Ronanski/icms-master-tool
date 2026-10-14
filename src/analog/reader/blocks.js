/* ===== ANALOG builder part 3: blocks, pins, labels, connectors ===== */
const AN_HDR=/^(PID|PIDV|MAN|ALM|SUMA|SUMP)$/i;
const AN_KT={'/':'DIV','÷':'DIV','*':'MUL','×':'MUL','T':'SW','COS':'COS','A':'CONST','F(X)':'FX','F(x)':'FX','f(t)':'LAG','H/':'HC','/L':'LC','>':'HS','<':'LS','+':'ADD','-':'SUB','−':'SUB','X':'MUL','x':'MUL','ABS':'ABS','TP':'TP','PO':'PO','I/P':'IP','E/P':'IP','AI':'AI','AO':'AO','SIG.AB':'SIGAB'};
function anDistPoly(p,x,y){let m=1e9;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];m=Math.min(m,anPtSeg(x,y,{x1:a[0],y1:a[1],x2:b[0],y2:b[1]}))}return m}
function anInPoly(p,x,y){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])c=!c}return c}
function anModel(S){
 S.shp=S.shp.filter((s,i,a)=>a.findIndex(t=>t.ty===s.ty&&Math.abs(t.x0-s.x0)<.05&&Math.abs(t.y0-s.y0)<.05&&Math.abs(t.x1-s.x1)<.05&&Math.abs(t.y1-s.y1)<.05)===i);
 const nets=S.nets,TX=S.tx,blk=S.blk=[];let uid=0;
 const isH=s=>Math.abs(s.y1-s.y2)<.06,isV=s=>Math.abs(s.x1-s.x2)<.06;
 const txIn=(sh,m=.3)=>TX.filter(t=>t.x>=sh.x0-m&&t.x<=sh.x1+m&&t.y>=sh.y0-m&&t.y<=sh.y1+m);
 const near=(x,y,r,f)=>TX.filter(t=>anD(t.x,t.y,x,y)<=r&&(!f||f(t))).sort((a,b)=>anD(a.x,a.y,x,y)-anD(b.x,b.y,x,y));
 const num=s=>{const m=String(s).replace(/%%%/g,'%').match(/^\s*([<>≤≥]?)\s*(-?\d+(?:\.\d+)?)/);return m?+m[2]:null};
 /* pins of a polygon: every wire end that touches its outline from outside */
 const pinsOfPoly=(poly,skipNets)=>{const o=[];for(const s of S.seg){for(const[x,y]of[[s.x1,s.y1],[s.x2,s.y2]]){if(anDistPoly(poly,x,y)>.8)continue;if(skipNets&&skipNets.has(s.net))continue;if(o.some(q=>q.n===s.net&&anD(q.x,q.y,x,y)<1.2))continue;o.push({n:s.net,x,y})}}
  for(const p of o){p.role=nets[p.n].arrows.some(a=>anD(a.x,a.y,p.x,p.y)<=1.6)?'in':'out'}return o};
 const sigOf=sh=>{const g=S.gl.filter(s=>s.x1>=sh.x0-.25&&s.x1<=sh.x1+.25&&s.x2>=sh.x0-.25&&s.x2<=sh.x1+.25&&s.y1>=sh.y0-.25&&s.y1<=sh.y1+.25&&s.y2>=sh.y0-.25&&s.y2<=sh.y1+.25);
  const h=g.filter(isH),v=g.filter(isV),d=g.filter(s=>!isH(s)&&!isV(s));return{g,h,v,d,dots:S.dot.filter(q=>q.x>=sh.x0&&q.x<=sh.x1&&q.y>=sh.y0&&q.y<=sh.y1).length+((S.R&&S.R.ci)||[]).filter(c=>c.r<.6&&c.x>=sh.x0&&c.x<=sh.x1&&c.y>=sh.y0&&c.y<=sh.y1).length}};
 const gk=(sh,t,sg)=>{ // kind of a shape
  const tt=t.map(q=>q.t.trim());
  const hd=tt.find(q=>AN_HDR.test(q));if(hd)return hd.toUpperCase();
  if(tt.includes('S')&&tt.includes('R')&&sh.ty==='rect')return 'FF';
  if(tt.some(q=>/SIG\.AB/i.test(q)))return 'SIGAB';
  if(sh.ty==='tri'){if(tt.includes('AI'))return 'AI';if(tt.includes('AO'))return 'AO';if(tt.includes('PO'))return 'PO';return null}
  if(sh.ty==='quad'&&tt.includes('M')&&sh.w>=20&&sh.w<=36)return 'ACT';/* motor-driven damper / valve actuator */
  if(tt.some(q=>/^H\s*\/\s*L$/.test(q))&&sh.ty==='rect')return 'DCMP';/* one input, two outputs with their own comparison text */
  if(sh.ty==='dia'){if(tt.includes('COS')&&!tt.includes('T'))return 'COS';if(tt.includes('T'))return 'AMT';return null}
  if(sh.ty==='rect'&&tt.includes('<')&&tt.includes('>'))return 'HLLIM';/* legend: box with both < and > = HIGH / LOW LIMIT */
  for(const q of tt)if(AN_KT[q]){if(q==='T'&&sh.ty==='dia')return 'AMT';return AN_KT[q]}
  if(sh.ty==='rect'&&tt.length===1&&/^-?\d+(?:\.\d+)?\s*[%A-Za-z°\/]{0,8}$/.test(tt[0].replace(/%%%/g,'%')))return 'CONST';
  if(sh.ty==='rect'&&tt.some(q=>/^DROP\s*RATE/i.test(q)))return 'DRATE';
  if(sh.ty==='rect'&&sh.w<=16){
   if(S.shp.some(o=>o!==sh&&o.ty==='tri'&&o.w<=8&&o.x0>=sh.x0&&o.x1<=sh.x1&&o.y0>=sh.y0&&o.y1<=sh.y1))return 'DEV';
   if(tt.length===1){const q=tt[0].replace(/%%%/g,'%');
    if(/^[<>≤≥]\s*(-?\d+(\.\d+)?|X)\s*%?$/i.test(q))return 'CMPK';
    if(/^-?\d+(\.\d+)?\s*%?$/.test(q))return 'CONST';
    if(/^[HL]\/[HL]?$|^\/[HL]$/.test(q))return /H/.test(q)&&!/L/.test(q)?'HC':/L/.test(q)&&!/H/.test(q)?'LC':'HLC'}}
  if(tt.some(q=>/^PV\s*<\s*SV$/i.test(q)))return 'PVSV';
  if(tt.some(q=>/INVERTER|MCC PANEL|ALARM/i.test(q)))return 'FIELD';
  if(tt.some(q=>/SELECT\s*CIRCUIT|AVERAGE/i.test(q)))return 'SEL';
  if(tt.some(q=>/BUMPLESS/i.test(q))&&tt.some(q=>/RAMP/i.test(q)))return 'RAMPB';
  if(tt.some(q=>q.trim()==='V'))return 'RATE';
  if(sg.g.length){const{d,h,v}=sg;
   if(d.length===2&&h.length===2&&!v.length)return 'SUM';
   if(d.length>=2&&h.length===1&&!v.length){const hy=h[0].y1,dy=Math.min(...d.flatMap(s=>[s.y1,s.y2]));return hy<=dy+.35?'DEV':'SQRT'}
   if(d.length>=2&&h.length>=1&&(v.length>=1||d.length>=3))return 'SQRT';
   if(h.length===1&&!d.length&&!v.length)return sg.dots>=2?'DIV':'SUB';
   if(d.length===2&&!h.length){const ax=d[0],bx=d[1];const px=[[ax.x1,ax.y1],[ax.x2,ax.y2]],qx=[[bx.x1,bx.y1],[bx.x2,bx.y2]];let ap=null;for(const a of px)for(const b of qx)if(anD(a[0],a[1],b[0],b[1])<.3)ap=a;
     if(ap){const mx=(sh.x0+sh.x1)/2;const right=ap[0]>mx;return v.length?(right?'HLIM':'LLIM'):(right?'HS':'LS')}}
   if(d.length===2&&v.length===1&&!h.length){return 'HLIM'}
  }
  return null};
 for(const sh of S.shp){const t=txIn(sh),sg=sigOf(sh);if(sh.h>46||(sh.w>46&&!(sh.w<=64&&t.some(q=>/SELECT\s*CIRCUIT|AVERAGE/i.test(q.t)))))continue;let k=gk(sh,t,sg);if(!k)continue;
  if(k==='AMT'||k==='SW'){/* the rhombus with COS shares a vertex with T */}
  const b={id:uid++,k,sh,x0:sh.x0,y0:sh.y0,x1:sh.x1,y1:sh.y1,cx:sh.cx,cy:sh.cy,txt:t.map(q=>q.t),p:{}};
  blk.push(b)}
 for(const b of blk)if(b.k==='COS'){b.vnet=nets.length;nets.push({id:nets.length,segs:[],dig:false,ana:0,arrows:[],txt:[],virt:1})}
 /* rate limiter glyph box next to the text "Ramp" */
 for(const sh of S.shp){if(sh.ty!=='rect'||sh.w>21||blk.some(b=>b.sh===sh))continue;const sg=sigOf(sh);const rmp=sh.w>=17&&sh.w<=21&&sh.h>=10&&sh.h<=13&&!txIn(sh).length&&sg.d.length>=1&&sg.h.length>=1;if(sg.g.length<3&&!rmp)continue;const rt=TX.find(q=>/^ramp/i.test(q.t.trim())&&anD(q.x,q.y,sh.cx,sh.cy)<34)||rmp;if(rt)blk.push({id:uid++,k:'RATE',sh,x0:sh.x0,y0:sh.y0,x1:sh.x1,y1:sh.y1,cx:sh.cx,cy:sh.cy,txt:[],p:{}})}
 for(const sh of S.shp){if(sh.ty!=='rect'||sh.w>42||sh.h>50||blk.some(b=>b.sh===sh||(b.x0!=null&&sh.cx>=b.x0-1&&sh.cx<=b.x1+1&&sh.cy>=b.y0-1&&sh.cy<=b.y1+1)))continue;if(txIn(sh).length)continue;const sg=sigOf(sh);let k=null;
  const nearT=re=>TX.some(q=>re.test(q.t.trim())&&anD(q.x,q.y,sh.cx,sh.cy)<=50);
  if(sg.d.length>=1&&sg.h.length>=1){if(nearT(/^RATE\s*LIMIT/i))k='RATE';else if(nearT(/^(HIGH|LOW)\s*LIMIT/i))k='HLLIM'}
  else if(sg.h.length===1&&sg.v.length===1&&!sg.d.length)k='ADD';
  else if(!sg.g.length&&sh.w<=24&&sh.h<=14&&TX.some(q=>/^[+\-−]$/.test(q.t.trim())&&anD(q.x,q.y,sh.cx,sh.cy)<=18))k='SUB';
  else if(!sg.g.length&&sh.w<=16&&sh.h>=30)k='SUM';/* ABC-026 / 027: grey tall bar, 4 + 4 inputs, = summation (number of normal transmitters) */
  if(k)blk.push({id:uid++,k,sh,x0:sh.x0,y0:sh.y0,x1:sh.x1,y1:sh.y1,cx:sh.cx,cy:sh.cy,txt:[],p:{}})}
 /* control valves: the wire that touches the tip (stem) carries the position demand (0-100 %, or a digital 1 = open) */
 for(const v of S.valves||[]){const pins=[];for(const s of S.seg)for(const[x,y]of[[s.x1,s.y1],[s.x2,s.y2]])if(anD(x,y,v.x,v.y)<=1.3&&!pins.some(p=>p.n===s.net))pins.push({n:s.net,x,y,role:'in'});
  blk.push({id:uid++,k:'VLV',fixed:1,v,x0:v.x0,y0:v.y0,x1:v.x1,y1:v.y1,cx:(v.x0+v.x1)/2,cy:(v.y0+v.y1)/2,txt:[],p:{},pins})}
 for(const hd of S.heads||[]){const v=blk.find(b=>b.k==='VLV'&&Math.abs(b.cx-hd.x)<30&&Math.abs(b.cy-hd.y)<90);blk.push({id:uid++,k:'ACH',fixed:1,hd,vlv:v?v.id:-1,x0:hd.x-hd.r,x1:hd.x+hd.r,y0:hd.up?hd.y:hd.y-hd.r,y1:hd.up?hd.y+hd.r:hd.y,cx:hd.x,cy:hd.y,txt:[],p:{},pins:[]})}
 for(const p of S.pills||[])blk.push({id:uid++,k:'TXD',fixed:1,x0:p.x0,y0:p.y0,x1:p.x1,y1:p.y1,cx:(p.x0+p.x1)/2,cy:(p.y0+p.y1)/2,txt:[],p:{},pins:[]});
 /* NOT / AND / OR gates found earlier */
 for(const g of S.gate){if(g.k==='NOT'){const sh=g.box;if((S.xbox||[]).includes(sh))continue;blk.push({id:uid++,k:'NOT',sh,x0:sh.x0,y0:sh.y0,x1:sh.x1,y1:sh.y1,cx:sh.cx,cy:sh.cy,txt:[],p:{}})}
  else{const bx=g.k==='OR'?{x0:g.v?(g.side>0?g.bp:g.body.cx-g.body.r):g.a0,x1:g.v?(g.side>0?g.body.cx+g.body.r:g.bp):g.a1,y0:g.v?g.a0:(g.side>0?g.bp:g.body.cy-g.body.r),y1:g.v?g.a1:(g.side>0?g.body.cy+g.body.r:g.bp)}:{x0:g.v?Math.min(g.bp,g.body.x1):g.a0,x1:g.v?Math.max(g.bp,g.body.x1):g.a1,y0:g.v?g.a0:Math.min(g.bp,g.body.y1||g.bp),y1:g.v?g.a1:Math.max(g.bp,g.body.y1||g.bp)};
   const b={id:uid++,k:g.k,g,x0:bx.x0,y0:bx.y0,x1:bx.x1,y1:bx.y1,cx:(bx.x0+bx.x1)/2,cy:(bx.y0+bx.y1)/2,txt:[],p:{}};blk.push(b)}}
 /* timers: CON half-disc (ARC ~180deg) with the flat side on a vertical line */
 for(const a of R_arcs(S)){const tt=near(a.x,a.y,Math.max(a.r*2.2,a.r+10),q=>/^(TON|TOF|TPS|TPh|TP|TD)s?$/i.test(q.t.trim())||/^\d+(\.\d+)?\s*(s|sec|min|m)$/i.test(q.t.trim()));
  const lab=tt.find(q=>/^(TON|TOF|TPS|TPh|TP)s?$/i.test(q.t.trim()));if(!lab)continue;
  const TMRX=/^\d+(\.\d+)?\s*(s|sec|min|m)$/i;const tm=tt.find(q=>TMRX.test(q.t.trim()))||near(a.x,a.y,20,q=>TMRX.test(q.t.trim())&&!R_arcs(S).some(o=>o!==a&&anD(o.x,o.y,q.x,q.y)<=o.r*2.2))[0];const kind=/TON/i.test(lab.t)?'TON':/TOF/i.test(lab.t)?'TOF':/TPh/i.test(lab.t)?'TPV':'TPS';
  const right=!(a.a0>=80&&a.a0<=100&&a.a1>=260&&a.a1<=280);
  const bx={x0:a.x-(right?0:a.r),x1:a.x+(right?a.r:0),y0:a.y-a.r,y1:a.y+a.r};
  let sec=5;if(tm){const m=tm.t.trim().match(/^(\d+(?:\.\d+)?)\s*(s|sec|min|m)/i);sec=+m[1]*(/min|^m$/i.test(m[2])?60:1)}
  blk.push({id:uid++,k:kind,arc:a,right,x0:bx.x0,y0:bx.y0,x1:bx.x1,y1:bx.y1,cx:a.x,cy:a.y,txt:[lab.t,tm?tm.t:''],p:{sec}})}
 /* field output flags: a '<' tip on a wire end with an "O.0842" tag and a description to the right */
 {const dg=S.seg.filter(q=>Math.abs(q.y1-q.y2)>.5&&Math.abs(q.x1-q.x2)>.5),tips=[];
  const ends=q=>[[q.x1,q.y1,q.x2,q.y2],[q.x2,q.y2,q.x1,q.y1]];
  for(const a of dg)for(const[px,py,qx,qy]of ends(a)){if(qx<=px+1)continue;const m=dg.find(b2=>b2!==a&&ends(b2).some(([bx,by,cx,cy])=>anD(bx,by,px,py)<.3&&cx>bx+1&&Math.sign(cy-by)!==Math.sign(qy-py)));if(m&&!tips.some(t=>anD(t.x,t.y,px,py)<.5))tips.push({x:px,y:py,h:Math.abs(qy-py),dx:qx-px})}
  const usedT=new Set();
  for(const tp of tips){const tg=TX.filter(q=>/^O\.\d{3,4}[A-Z]?$/.test(q.t.trim())&&q.x>tp.x&&q.x-tp.x<90&&Math.abs(q.y-tp.y)<tp.h+9&&!usedT.has(q)).sort((a,b2)=>anD(a.x,a.y,tp.x,tp.y)-anD(b2.x,b2.y,tp.x,tp.y))[0];if(!tg)continue;usedT.add(tg);
   let net=-1;for(const q of S.seg){if(Math.abs(q.y1-q.y2)>.06)continue;for(const[x,y]of[[q.x1,q.y1],[q.x2,q.y2]])if(anD(x,y,tp.x,tp.y)<=.8&&q.x1!==undefined){net=q.net}}if(net<0)continue;
   const rows=TX.filter(q=>q.x>tp.x&&q.x-tp.x<90&&Math.abs(q.y-tp.y)<tp.h+2),right=Math.max(...rows.map(q=>q.x+q.t.length*q.h*.62),tp.x+tp.dx+4)+tp.dx*.6,y0=tp.y-tp.h,y1=tp.y+tp.h;
   blk.push({id:uid++,k:'FOUT',fixed:1,tag:tg.t.trim(),x0:tp.x,y0,x1:right,y1,cx:(tp.x+right)/2,cy:tp.y,txt:rows.filter(q=>q!==tg).map(q=>q.t),p:{},pins:[{n:net,x:tp.x,y:tp.y,role:'in'}],flag:[[tp.x,tp.y],[tp.x+tp.dx,y1],[right,y1],[right,y0],[tp.x+tp.dx,y0]]})}}
 /* contact in a signal line: two small circles on the line, a bar beside them with the control arrow (digital) coming in */
 {const C=S.R.ci.filter(c=>c.r>=.8&&c.r<=2.6),done=new Set();
  for(const a of C)for(const b of C){if(a===b||done.has(a)||done.has(b))continue;const vert=Math.abs(a.x-b.x)<.4&&a.y>b.y&&a.y-b.y>4&&a.y-b.y<9,hor=Math.abs(a.y-b.y)<.4&&a.x<b.x&&b.x-a.x>4&&b.x-a.x<9;if(!vert&&!hor)continue;
   const P1=vert?{x:a.x,y:a.y+a.r}:{x:a.x-a.r,y:a.y},P2=vert?{x:b.x,y:b.y-b.r}:{x:b.x+b.r,y:b.y};
   const netAt=P=>{let n=-1,bd=.9;for(const q of S.seg)for(const[x,y]of[[q.x1,q.y1],[q.x2,q.y2]]){const d=anD(x,y,P.x,P.y);if(d<bd){bd=d;n=q.net}}return n};
   const n1=netAt(P1),n2=netAt(P2);if(n1<0||n2<0||n1===n2)continue;
   /* control: an arrow tip near the middle of the bar (bar = line parallel to the circle axis, 2-5 units away) */
   const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;let ctl=-1,cp=null;
   for(const n of nets)for(const ar of n.arrows){if(vert?(Math.abs(ar.x-a.x)<5.8&&ar.y>b.y-1&&ar.y<a.y+1):(Math.abs(ar.y-a.y)<5.8&&ar.x>a.x-1&&ar.x<b.x+1)){ctl=n.id;cp=ar}}
   if(ctl<0||ctl===n1||ctl===n2)continue;
   const o1=nets[n1].arrows.length>0,o2=nets[n2].arrows.length>0;let in1=true;if(o1&&!o2)in1=false;else if(o2&&!o1)in1=true;
   done.add(a);done.add(b);
   const x0=Math.min(a.x,b.x)-a.r-4,x1=Math.max(a.x,b.x)+a.r+4,y0=Math.min(a.y,b.y)-a.r-(vert?0:4),y1=Math.max(a.y,b.y)+a.r+(vert?0:4);
   blk.push({id:uid++,k:'CTK',fixed:1,x0,y0,x1,y1,cx:mx,cy:my,txt:[],p:{},pins:[{n:n1,x:P1.x,y:P1.y,role:in1?'in':'out'},{n:n2,x:P2.x,y:P2.y,role:in1?'out':'in'},{n:ctl,x:cp.x,y:cp.y,role:'in',lab:'ctl'}]})}}
 return S}
function R_arcs(S){return S.R.ar.filter(a=>/^CON$/i.test(a.l)&&a.r>=3.5&&a.r<=9&&Math.abs(((a.a1-a.a0+360)%360)-180)<12)}
