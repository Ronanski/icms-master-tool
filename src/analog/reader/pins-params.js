/* ===== ANALOG builder part 4: pins, pin labels, parameters, signal labels, connectors ===== */
/* THE ADDRESS TABLE (v1.20.6): one table  address text -> (sheet, net, how it was tied, gap, alternatives)  built ONCE per sheet.
   The engine (same address on several wires = one signal) and the display (one value beside each address text) both read S.addr; nothing else decides which net an address names.
   This file is the source of function anAddr(S); tools/patch-1.20.6.js inserts it into the analog script (above function anWire), the tests load it with tools/addr-lib.js.
   RULES (user 2026-10-09: "mali ang method; hindi dapat kung sino ang malapit; dapat iintindihin ang diagram at ang flow ng logic"):
   1. An address is tied to a SYMBOL or a WIRE END it belongs to, never to "the nearest wire that happens to be free".
      controller / station tag (PID, PIDV, MAN, SUMA, SUMP + .PV / .SV / .MV) -> the pin of that block;  AO#### -> the INPUT (command) pin of the AO block it is paired with;
      AI#### -> the OUTPUT pin of the AI block it is paired with;  valve / actuator tag -> the command pin of the block it is paired with;  circle tag -> the signal of its own circle;
      reader label -> the wire the reader found the label ON;  anything else -> only a wire whose box-gap to the text is small AND clearly smaller than the next wire (unique).
   2. PAIRING IS ONE TO ONE (a text belongs to one symbol, a symbol owns one text): the pairs are chosen by smallest gap first, not "each text takes the nearest".
   3. A text that cannot be tied without guessing is NOT given a value: it goes to S.addrUn with the reason (no wire / ambiguous between nets a, b) for the engineer to confirm on the drawing. No value is better than a wrong value.
   4. Distances are measured from the BOX of the text (start x, width = length x height x 0.62, height) to the wire, not from the start point of the text (a long address left of a vertical wire was 16 units away by the start point). */
function anAddr(S){
 const ADRE=/^(S\d\s*)?([A-Za-z]{1,6}\.?\d{3,6}[A-Za-z]?|[A-Z]{2,}[A-Z0-9\-]*\d[A-Z0-9\-]*)(\.(PV|SV|MV))?$/,
  SKIP=/^(LN\d+|ABC-\d+[A-Z]?|PTN\d+|SIG\.AB|PID|PIDV|MAN|SUMA|FX|HS|AI|AO|TR\d+|P[SM]\d{4}|P\.\d+|HOU\w*|STN\d*|MW\d*|FM\d*|DP\d*|S|AB|TCF\d*|MOF-.*|SC-L.*|INV-M.*)$/i,
  DIGRE=/^(S\d\s*)?[MBIO]\.[0-9A-Fa-f]{3,4}$/,
  nets=S.nets,TX=S.tx,out=[],un=[];
 const bx=t=>{/* box of the text with its DXF alignment: a = 0 left, 1 / 4 centre, 2 right; b = 0 / 1 baseline / bottom, 2 middle, 3 top (the same convention the reader uses for text boxes) */
  const h=t.h||3,s=String(t.t).trim(),w=s.length*h*.62,x0=t.a===2?t.x-w:(t.a===1||t.a===4)?t.x-w/2:t.x,y0=t.b===3?t.y-h:t.b===2?t.y-h/2:t.y;return{x0,x1:x0+w,y0,y1:y0+h}};
 const rd=(p,q)=>{const dx=Math.max(p.x0-q.x,0,q.x-p.x1),dy=Math.max(p.y0-q.y,0,q.y-p.y1);return Math.hypot(dx,dy)};
 const gapSeg=(r,s)=>{/* distance between the text box and a wire segment (0 when they touch / cross) */
  let t0=0,t1=1;const dx=s.x2-s.x1,dy=s.y2-s.y1;const P=[-dx,dx,-dy,dy],Q=[s.x1-r.x0,r.x1-s.x1,s.y1-r.y0,r.y1-s.y1];let hit=true;
  for(let i=0;i<4;i++){if(P[i]===0){if(Q[i]<0){hit=false;break}}else{const u=Q[i]/P[i];if(P[i]<0){if(u>t1){hit=false;break}if(u>t0)t0=u}else{if(u<t0){hit=false;break}if(u<t1)t1=u}}}
  if(hit&&t0<=t1)return 0;
  let d=Math.min(rd(r,{x:s.x1,y:s.y1}),rd(r,{x:s.x2,y:s.y2}));
  for(const[x,y]of[[r.x0,r.y0],[r.x1,r.y0],[r.x0,r.y1],[r.x1,r.y1]])d=Math.min(d,anPtSeg(x,y,s));
  return d};
 const gapNet=(r,n)=>{let d=1e9;for(const i of nets[n].segs)d=Math.min(d,gapSeg(r,S.seg[i]));return d};
 const gapBlk=(r,b)=>{if(b.x0==null)return 1e9;const dx=Math.max(b.x0-r.x1,0,r.x0-b.x1),dy=Math.max(b.y0-r.y1,0,r.y0-b.y1);return Math.hypot(dx,dy)};
 const live=n=>n!=null&&n>=0&&nets[n]&&nets[n].segs.length&&!nets[n].dig;
 const items=[],seen=new Set();
 for(const t of TX){const s=String(t.t).trim();if(!ADRE.test(s)||SKIP.test(s.replace(/^S\d\s*/,''))||DIGRE.test(s))continue;const kk=s+'|'+Math.round(t.x)+'|'+Math.round(t.y);if(seen.has(kk))continue;seen.add(kk);items.push({t,s,r:bx(t),n:null,how:null,gap:null,alt:[],why:null})}
 const done=it=>it.n!=null;
 const set=(it,n,how,gap)=>{it.n=n;it.how=how;it.gap=gap};
 /* (1) the tag of a controller / station names its own pin (.PV / .SV / .MV) or its output */
 const byTag=s=>{const base=s.replace(/\.(PV|SV|MV)$/i,''),suf=((/\.(PV|SV|MV)$/i.exec(s)||[])[1]||'').toUpperCase();const b=S.blk.find(q=>q.pins&&(q.txt||[]).some(z=>String(z).trim()===base));if(!b)return null;
  if(b.k==='PID'||b.k==='PIDV'){const pn=anPins(S,b);if(suf==='PV'&&pn)return{n:pn.pv,b};if(suf==='SV'&&pn)return{n:pn.sv,b};return{n:(b.o||[]).find(k=>live(k)&&(S.cns[k]||[]).length)??(b.o||[]).find(live)??(b.o||[])[0],b}}
  if(b.k==='ALM'||b.k==='TXD')return{n:(b.i||[])[0],b};
  const o=(b.o||[]).find(k=>live(k)&&(S.cns[k]||[]).length)??(b.o||[]).find(live)??(b.o||[])[0];return{n:o!=null?o:(b.i||[])[0],b}};
 for(const it of items){const q=S.blk.find(z=>z.pins&&['PID','PIDV','MAN','SUMA','SUMP'].includes(z.k)&&(z.txt||[]).some(x=>String(x).trim()===it.s.replace(/\.(PV|SV|MV)$/i,'')));if(!q)continue;const r=byTag(it.s);if(r&&live(r.n))set(it,r.n,'controller tag',0)}
 /* (2) symbols that carry an address beside them: AO triangle (command = its INPUT), AI triangle (its OUTPUT). One text per symbol, one symbol per text, smallest gap first. */
 const pairSym=(its,kinds,maxGap,netOf,how,margin)=>{const prs=[];for(const it of its)for(const b of S.blk){if(!kinds.includes(b.k)||b.cx==null)continue;const d=gapBlk(it.r,b);if(d<=maxGap)prs.push({it,b,d})}
  prs.sort((a,c)=>a.d-c.d);const ui=new Set(),ub=new Set();for(const p of prs){if(ui.has(p.it)||ub.has(p.b))continue;const n=netOf(p.b);if(!(live(n)||(p.b.k==='AI'&&n!=null&&n>=0&&nets[n]&&nets[n].segs.length)))continue;
   const others=prs.filter(z=>z.it===p.it&&z.b!==p.b&&!ub.has(z.b));if(margin&&others.length&&others[0].d-p.d<margin){p.it.why='ambiguous: symbols '+p.b.id+' ('+p.d.toFixed(1)+') and '+others[0].b.id+' ('+others[0].d.toFixed(1)+') are equally close';continue}
   ui.add(p.it);ub.add(p.b);set(p.it,n,how,p.d);if(p.b.k==='AI')p.it.ai=p.b.id;p.it.alt=others.map(z=>z.b.id+':'+z.d.toFixed(1))}};
 pairSym(items.filter(it=>!done(it)&&/^(S\d\s*)?AO\d{3,5}$/i.test(it.s)),['AO'],22,b=>(b.i||[])[0],'AO block input');
 /* tags that the reader tied to a block output: the AI triangle names its own output wire */
 pairSym(items.filter(it=>!done(it)&&/^(S\d\s*)?AI\d{3,5}$/i.test(it.s)),['AI'],32,b=>{const o=b.pins.find(q=>q.role==='out')||(b.pins.length===1?b.pins[0]:null);return o?o.n:null},'AI block output');
 /* (3) the tag of a link circle ("( FROM / TO ABC-xxx )", number / letter circles): the text must be right beside THAT circle (gap to the disc <= 12) and no other analog wire may be clearly closer than the circle's own wires (v1.20.3 / v1.20.4 tied SI0061 to SI0380 and SI0219 to the wrong circle by "nearest circle within r + 50"). One text per circle, one circle per text, smallest gap first. The value is the one of the circle wire that is right beside the text (all wires of one circle number are one signal, the engine links them). */
 {const CI=(S.conn||[]).concat(S.xc||[]).filter(c=>c.nets&&c.nets.some(live)),prs=[];
  const own=(it,c)=>{let g=1e9,n=null;for(const k of c.nets){if(!live(k))continue;const x=gapNet(it.r,k);if(x<g){g=x;n=k}}return{g,n}};
  for(const it of items){if(done(it))continue;for(const c of CI){const dc=Math.max(0,rd(it.r,{x:c.x,y:c.y})-c.r);if(dc>12)continue;const o=own(it,c);if(o.n==null)continue;
    let ob=1e9;for(const nn of nets){if(!nn.segs.length||nn.dig||c.nets.includes(nn.id))continue;ob=Math.min(ob,gapNet(it.r,nn.id))}
    if(ob<o.g-1&&dc+2>ob)continue;/* another wire is clearly closer than the circle AND than the circle disc itself: the text is the label of that wire, not of the circle */
    prs.push({it,c,dc,n:o.n,g:o.g})}}
  prs.sort((p,q)=>p.dc-q.dc);const ui=new Set(),uc=new Set();for(const p of prs){if(ui.has(p.it)||uc.has(p.c))continue;ui.add(p.it);uc.add(p.c);p.it.eng=p.c.nets.find(k=>(S.drv[k]||[]).some(d=>d.k!=='LINK'))??p.c.nets.find(k=>!(S.drv[k]||[]).length&&(S.cns[k]||[]).length)??p.c.nets[0];set(p.it,p.it.eng,'circle tag',p.dc);p.it.alt=prs.filter(z=>z.it===p.it&&z.c!==p.c).map(z=>(z.c.num||'?')+':'+z.dc.toFixed(1))}}
 for(const it of items){if(done(it))continue;let n=null,g=null;S.lab.forEach((l,m)=>{if(n==null&&l&&l.t===it.t.t&&Math.hypot(l.x-it.t.x,l.y-it.t.y)<1&&live(m)){n=m;g=l.d}});
  if(n==null&&items.filter(z=>z.t.t===it.t.t).length===1){/* the reader's tie of a text that has no position record: only when this string is written ONCE on the sheet (the same string at several places cannot be told apart by name) */const q=(S.tagN||[]).filter(z=>z.t===it.t.t&&!z.by&&live(z.n)).sort((a,b)=>a.d-b.d)[0];if(q){n=q.n;g=q.d}}
  if(n!=null)set(it,n,'label on wire (reader)',g)}
 /* (4) the tag of a block / valve / actuator, and the AI of the IO list: only a symbol that is NOT yet paired, one to one, within 70 */
 {const eq=items.filter(it=>!done(it)&&/^[A-Z]{2,4}-[A-Z]{1,3}\d/.test(it.s)),isT=it=>/^[A-Z]*T-/.test(it.s);
  pairSym(eq.filter(isT),['AI'],40,b=>{const o=b.pins.find(q=>q.role==='out')||(b.pins.length===1?b.pins[0]:null);return o?o.n:null},'transmitter tag -> AI block');
  pairSym(eq.filter(it=>!done(it)&&!isT(it)),['IP','AO','ACT','VLV','PO'],64,b=>(b.i||[])[0]!=null?b.i[0]:(b.o||[])[0],'valve / actuator tag -> command pin',8);
  pairSym(eq.filter(it=>!done(it)),['AI'],40,b=>{const o=b.pins.find(q=>q.role==='out')||(b.pins.length===1?b.pins[0]:null);return o?o.n:null},'instrument tag -> AI block')}
 for(const it of items){if(done(it))continue;const r=byTag(it.s);if(r&&live(r.n))set(it,r.n,'tag of a block',0)}
 /* (4b) an address written right beside the box of a constant / manual value (the "A" box of ABC-007 SI0168) names the wire that leaves that box */
 pairSym(items.filter(it=>!done(it)&&/^(S\d\s*)?(SI|AI)\d{3,5}$/i.test(it.s)),['CONST'],5,b=>{const o=b.pins.find(q=>q.role==='out');return o?o.n:(b.o||[])[0]},'constant box output',3);
 /* (5) a wire that carries no address yet, with the text right beside it: the BOX gap must be small and clearly smaller than the next wire, and only ONE text may claim the wire */
 {const named=new Set();S.lab.forEach((l,m)=>{if(l)named.add(m)});(S.tagN||[]).forEach(q=>{if(!q.by||q.by==='circle')named.add(q.n)});items.forEach(it=>{if(done(it))named.add(it.n)});
  const WMAX=10,MARGIN=3,cand=new Map();
  for(const it of items){if(done(it))continue;const c=[];for(const nn of nets){if(!nn.segs.length||nn.dig)continue;const g=gapNet(it.r,nn.id);if(g<=WMAX*2)c.push({n:nn.id,g,al:named.has(nn.id)})}c.sort((a,b)=>a.g-b.g);cand.set(it,c)}
  const claim=new Map();for(const[it,c]of cand){if(!c.length||c[0].g>WMAX){it.why=c.length?'nearest free wire is '+c[0].g.toFixed(1)+' away (limit '+WMAX+')':'no free analog wire beside the text';continue}
   if(c[1]&&c[1].g-c[0].g<MARGIN){it.why='ambiguous: wires '+c[0].n+' ('+c[0].g.toFixed(1)+') and '+c[1].n+' ('+c[1].g.toFixed(1)+') are equally close';it.alt=c.slice(0,3).map(z=>z.n+':'+z.g.toFixed(1));continue}
   (claim.get(c[0].n)||claim.set(c[0].n,[]).get(c[0].n)).push({it,g:c[0].g})}
  for(const[n,a]of claim){a.sort((p,q)=>p.g-q.g);const names=[...new Set(a.map(y=>y.it.s))];
   /* the SAME address written several times along one wire is one address; DIFFERENT addresses claiming one wire at nearly the same distance cannot be told apart */
   if(names.length>1&&a.find(y=>y.it.s!==a[0].it.s).g-a[0].g<MARGIN){for(const z of a)z.it.why='ambiguous: texts '+names.join(' / ')+' all claim wire '+n;continue}
   const w=a.filter(y=>y.it.s===a[0].it.s);for(const z of w)set(z.it,n,named.has(n)?'wire beside the text (wire has a second address)':'wire beside the text (unique)',z.g);for(const z of a.filter(y=>y.it.s!==a[0].it.s))z.it.why='wire '+n+' belongs to '+a[0].it.s}}
 for(const it of items){if(it.n==null)un.push({t:it.s,x:it.t.x,y:it.t.y,why:it.why||'no wire, symbol or circle of this address found',alt:it.alt});else out.push({t:it.s,x:it.t.x,y:it.t.y,x1:it.r.x1,h:it.t.h||3,n:it.n,eng:it.eng!=null?it.eng:it.n,ai:it.ai,how:it.how,gap:+(it.gap||0).toFixed(2),alt:it.alt})}
 S.addr=out;S.addrUn=un;return S}

function anWire(S){
 const nets=S.nets,TX=S.tx,blk=S.blk,R=S.R;
 const near=(x,y,r,f)=>TX.filter(t=>anD(t.x,t.y,x,y)<=r&&(!f||f(t))).sort((a,b)=>anD(a.x,a.y,x,y)-anD(b.x,b.y,x,y));
 const arrAt=(n,x,y,tol)=>nets[n].arrows.some(a=>anD(a.x,a.y,x,y)<=tol);
 const polyOf=b=>b.sh?b.sh.p:[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]];
 const touch=(poly,x,y)=>anDistPoly(poly,x,y)<=.85;
 const pinsPoly=(poly,skip)=>{const o=[];for(const s of S.seg){for(const[x,y]of[[s.x1,s.y1],[s.x2,s.y2]]){if(!touch(poly,x,y))continue;if(skip&&skip.has(s.net))continue;if(o.some(q=>q.n===s.net&&anD(q.x,q.y,x,y)<1.5))continue;o.push({n:s.net,x,y,role:arrAt(s.net,x,y,1.7)?'in':'out'})}}
  /* arrow tips: a LEADER line stops at the arrow base, the tip is what touches the block */
  for(const n of nets)for(const a of n.arrows){if(!touch(poly,a.x,a.y))continue;if(skip&&skip.has(n.id))continue;if(o.some(q=>q.n===n.id&&anD(q.x,q.y,a.x,a.y)<8))continue;o.push({n:n.id,x:a.x,y:a.y,role:'in'})}
  return o};
 /* digital gate pins */
 for(const b of blk){if(b.fixed)continue;b.pins=[];const g=b.g;
  if(b.k==='AND'||b.k==='OR'){
   const ins=new Map();
   for(const n of nets)for(const a of n.arrows){const d=g.v?Math.abs(a.x-g.bp):Math.abs(a.y-g.bp),al=g.v?a.y:a.x;if(d<=1.3&&al>=g.a0-.8&&al<=g.a1+.8)ins.set(n.id,{n:n.id,x:a.x,y:a.y,role:'in'})}
   b.pins=[...ins.values()];
   const o=g.out;for(const s of S.seg)for(const[x,y]of[[s.x1,s.y1],[s.x2,s.y2]])if(anD(x,y,o.x,o.y)<=1.3&&!b.pins.some(p=>p.n===s.net&&p.role==='out'))b.pins.push({n:s.net,x,y,role:'out'})}/* the output may branch back to one of its own inputs (latch): the net is then both in and out */
  else if(b.k==='TON'||b.k==='TOF'||b.k==='TPS'||b.k==='TPV'){
   const a=b.arc,dir=b.right?1:-1,apx=a.x+dir*a.r;
   for(const s of S.seg)for(const[x,y]of[[s.x1,s.y1],[s.x2,s.y2]]){if(Math.abs(y-a.y)>1.6)continue;
    if(dir>0){if(x>=a.x-1.2&&x<=a.x+a.r*.8){if(!b.pins.some(p=>p.n===s.net))b.pins.push({n:s.net,x,y,role:'in'})}else if(x>a.x+a.r*.8&&x<=apx+2.2&&s.net!==undefined){if(!b.pins.some(p=>p.n===s.net))b.pins.push({n:s.net,x,y,role:'out'})}}
    else{if(x<=a.x+1.2&&x>=a.x-a.r*.8){if(!b.pins.some(p=>p.n===s.net))b.pins.push({n:s.net,x,y,role:'in'})}else if(x<a.x-a.r*.8&&x>=apx-2.2){if(!b.pins.some(p=>p.n===s.net))b.pins.push({n:s.net,x,y,role:'out'})}}}}
  else if(b.k==='COS'){}
  else{b.pins=pinsPoly(polyOf(b))}
 }
 for(const b of blk)if(b.k==='TPV'){/* variable-time pulse: the time (analog, seconds) arrives on an arrow into the body from above or below */const a=b.arc;for(const n of nets)for(const ar of n.arrows){if(ar.x>=b.x0-3&&ar.x<=b.x1+8&&(Math.abs(ar.y-(a.y-a.r))<4||Math.abs(ar.y-(a.y+a.r))<4)&&!b.pins.some(p=>p.n===n.id))b.pins.push({n:n.id,x:ar.x,y:ar.y,role:'in',lab:'X'})}}
 for(const b of blk)if(b.k==='SIGAB'){const g=S.sigab.find(q=>q.sh===b.sh);b.pins=b.pins.filter(p=>p.role==='in');if(g)b.pins.push({n:g.net,x:g.d2.x,y:g.d2.y,role:'out'})
  if(!b.pins.some(p=>p.role==='out')){for(const sg of S.seg){if(sg.net==null)continue;for(const [x,y] of [[sg.x1,sg.y1],[sg.x2,sg.y2]]){const eg=(Math.abs(y-b.y0)<1.5||Math.abs(y-b.y1)<1.5)&&x>=b.x0-.5&&x<=b.x1+.5;if(eg&&!b.pins.some(p=>p.n===sg.net))b.pins.push({n:sg.net,x,y,role:'out',fl:1})}}}}
 /* NOT gates: without an arrow on the input side the flow is left to right */
 for(const b of blk)if(b.k==='NOT'&&b.pins.length===2){const[p,q]=b.pins,ii=b.pins.filter(x=>x.role==='in').length;if(ii!==1){const hz=Math.abs(p.x-q.x)>=Math.abs(p.y-q.y),ha=nets[p.n].arrows.length>0,hb=nets[q.n].arrows.length>0;let first=hz?(p.x<q.x?p:q):(p.y>q.y?p:q);const loc=pp=>{let s=0;for(const ar of nets[pp.n].arrows){const vx=hz?Math.sign(pp.x-b.cx):0,vy=hz?0:Math.sign(pp.y-b.cy);if(hz?Math.abs(ar.y-pp.y)>1.5:Math.abs(ar.x-pp.x)>1.5)continue;if((ar.x-b.cx)*vx+(ar.y-b.cy)*vy<=0)continue;s+=(ar.dx*vx+ar.dy*vy)>0?1:-1}return s},lp=loc(p),lq=loc(q);if(lp!==lq)first=lp>lq?q:p;/* no local arrow: left to right / top to bottom (the old net-wide arrow test picked the wrong pin on ABC-055 #29, ABC-003E TR256) */ /* the wire that ends in an arrow further on is the one leaving the NOT */const sec=first===p?q:p;first.role='in';sec.role='out'}}
 for(const b of blk)if(b.k==='NOT'&&b.pins.length===2){const o=b.pins.find(x=>x.role==='out'),i=b.pins.find(x=>x.role==='in');if(!o||!i)continue;const dr=n=>blk.some(q=>q!==b&&q.pins&&q.pins.some(x=>x.n===n&&x.role==='out'));if(dr(o.n)&&!dr(i.n)){o.role='in';i.role='out'}}
 for(const b of blk)if(b.k==='MAN')b.pins=b.pins.filter(p=>!(p.role==='out'&&blk.some(q=>q!==b&&q.k!=='MAN'&&q.pins&&q.pins.some(x=>x.n===p.n&&x.role==='out'))));
 /* a net can never be both the in and the out of the same block: the in wins when an arrow is on it */
 /* v1.9.2: a function block that ended up with only 'out' pins: the pin whose wire has no arrow while another pin's wire has one is the INPUT (comparators drawn without an arrow head on the input) */
 for(const b of blk){if(!['HC','LC','HLC','DCMP','PVSV','FX','SQRT','LAG','RATE','HLIM','LLIM','ABS','SUM','SUB','ADD','MUL','DIV','DEV'].includes(b.k)||b.pins.length<2||b.pins.some(p=>p.role==='in'))continue;
  const wa=b.pins.filter(p=>nets[p.n].arrows.length),na=b.pins.filter(p=>!nets[p.n].arrows.length);if(wa.length&&na.length)na.forEach(p=>p.role='in');else if(b.pins.length===2){const[p,q]=b.pins;if(Math.abs(p.x-q.x)>Math.abs(p.y-q.y)+1)(p.x<q.x?p:q).role='in';else if(Math.abs(p.y-q.y)>Math.abs(p.x-q.x)+1)(p.y>q.y?p:q).role='in'}}
 /* AI / AO triangles: in = top edge, out = apex */
 for(const b of blk)if(b.k==='AI'||b.k==='AO'){const P3=b.sh.p,ys=P3&&P3.length===3?P3.map(q=>q[1]):null;let ay=b.y0;if(ys){const u=ys.find((y,i)=>ys.filter((z,j)=>j!==i&&Math.abs(z-y)<.5).length===0);if(u!==undefined)ay=u}const by=ys?ys.find(y=>Math.abs(y-ay)>.5):b.y1;for(const p of b.pins)p.role=Math.abs(p.y-ay)<=Math.abs(p.y-by)?'out':'in'}
 /* pin labels: nearest sign / letter text */
 const LAB=/^([ab]|[+\-−]|[NY]|\d\s*:\s*\S+)$/i;
 const Ts=blk.filter(q=>q.k==='SW'||q.k==='AMT'),Cs=blk.filter(q=>q.k==='COS'),nearestTb=t=>{let m=null,md=1e9;for(const q of Ts){const d=anD(q.cx,q.cy,t.x,t.y);if(d<md){md=d;m=q}}return m};
 {const pairs=[];for(const b of Ts)for(const p of b.pins){if(p.role!=='in'&&b.pins.filter(q=>q.role==='out').length<2)continue;for(const t of TX){if(!LAB.test(t.t.trim()))continue;if(t.x>=b.x0+.3&&t.x<=b.x1-.3&&t.y>=b.y0+.3&&t.y<=b.y1-.3)continue;if(Cs.some(c=>anD(c.cx,c.cy,t.x,t.y)<11))continue;const d=anD(p.x,p.y,t.x,t.y);if(d<=11)pairs.push({p,t,d})}}
  pairs.sort((x,y)=>x.d-y.d);const up=new Set(),ut=new Set();for(const q of pairs){if(up.has(q.p)||ut.has(q.t))continue;up.add(q.p);ut.add(q.t);q.p.lab=q.t.t.trim();q.p.lt=q.t}}
 for(const b of Ts){if(b.pins.some(p=>/^\d\s*:/.test(p.lab||'')))continue;const used=new Set(Ts.flatMap(q=>q.pins.map(p=>p.lt)).filter(Boolean));
  const lt=TX.filter(t=>/^\d\s*:\s*[A-Za-z]$/.test(t.t.trim())&&!used.has(t)&&anD(t.x,t.y,b.cx,b.cy)<=26&&nearestTb(t)===b)[0];if(!lt)continue;
  let best=null,bs=1e9;for(const s2 of S.seg)for(const[x,y]of[[s2.x1,s2.y1],[s2.x2,s2.y2]]){const d1=anD(x,y,lt.x,lt.y),d2=anDistPoly(polyOf(b),x,y);if(d1<=18&&d2<=7&&!b.pins.some(p=>p.n===s2.net)&&d1+d2<bs){bs=d1+d2;best={n:s2.net,x,y}}}
  if(best)b.pins.push({n:best.n,x:best.x,y:best.y,role:'in',lab:lt.t.trim(),lt})}
 for(const b of blk){if(!b.pins.length||b.k==='SW'||b.k==='AMT')continue;const cand=TX.filter(t=>LAB.test(t.t.trim())&&!(t.x>=b.x0+.3&&t.x<=b.x1-.3&&t.y>=b.y0+.3&&t.y<=b.y1-.3||false));
  const pairs=[];for(const p of b.pins)for(const t of cand){const d=anD(p.x,p.y,t.x,t.y);if(d<=9)pairs.push({p,t,d})}
  pairs.sort((x,y)=>x.d-y.d);const up=new Set(),ut=new Set();for(const q of pairs){if(up.has(q.p)||ut.has(q.t))continue;up.add(q.p);ut.add(q.t);q.p.lab=q.t.t.trim();q.p.lt=q.t}}
 for(const b of blk)if((b.k==='SW'||b.k==='AMT')&&b.pins.filter(p=>p.role==='out').length>1){for(const p of b.pins)if(p.role==='out'&&/^a$/i.test(p.lab||''))p.role='in'}
 /* side of every pin relative to the block centre */
 for(const b of blk)for(const p of b.pins){const dx=p.x-b.cx,dy=p.y-b.cy;p.side=Math.abs(dx)*(b.y1-b.y0)>Math.abs(dy)*(b.x1-b.x0)?(dx<0?'L':'R'):(dy<0?'B':'T')}
 /* signal labels: nearest text that looks like a signal name, assigned to a net */
 const SIGRX=/^(S\d\s*)?(S[IO]|AI|AO|[MBIO]\.)[0-9A-Fa-f]{3,5}[A-Za-z]?$|^\(?S\d\)?\s*[MBIO]\.[0-9A-F]{3,5}|^[A-Z0-9]{3,}[A-Z0-9-]*\.(MV|PV|SV|REM|LOC|OUT|SIG)$|^S\d[\s-]?[A-Z]{2,3}\d{3,5}$/;
 const lab=S.lab=new Array(nets.length).fill(null);
 for(const t of TX){const x=t.t.trim();if(!SIGRX.test(x)&&!/^[A-Z]{2,}[A-Z0-9]*\.[A-Z]{2,3}$/.test(x))continue;let best=null,bd=6.5;
  for(const s of S.seg){const hx=Math.abs(s.y1-s.y2)<.06,vx=Math.abs(s.x1-s.x2)<.06;let d=1e9;
   if(hx&&t.x>=Math.min(s.x1,s.x2)-t.t.length*t.h*.5-1&&t.x<=Math.max(s.x1,s.x2)+4)d=Math.abs(t.y+t.h*.5-s.y1);else if(vx&&t.y>=Math.min(s.y1,s.y2)-3&&t.y<=Math.max(s.y1,s.y2)+3)d=Math.abs(t.x-s.x1-1)*.9;else d=anPtSeg(t.x,t.y,s)+2;
   if(d<bd){bd=d;best=s}}
  if(best){const n=best.net;(S.tagN=S.tagN||[]).push({t:x,n,d:bd});if(!lab[n]||bd<lab[n].d)lab[n]={t:x,d:bd,x:t.x,y:t.y}}}
 for(const b of blk)if(b.k==='AI'){const o=b.pins.find(p=>p.role==='out');const tt=TX.filter(q=>/^(S\d\s*)?AI\d{3,5}$/.test(q.t.trim())&&anD(q.x,q.y,b.cx,b.cy)<30).sort((a,c)=>anD(a.x,a.y,b.cx,b.cy)-anD(c.x,c.y,b.cx,b.cy))[0];if(o&&tt){lab[o.n]={t:tt.t.trim(),d:0,x:tt.x,y:tt.y};b.tagAI=tt.t.trim()}}
 /* numbered connectors */
 S.conn=[];S.xc=[];
 for(const c of R.ci){if(c.r<2.2||c.r>12)continue;if(c.r>8.3&&!(TX.filter(q=>q.x>=c.x-c.r&&q.x<=c.x+c.r&&q.y>=c.y-c.r&&q.y<=c.y+c.r&&/^[A-Za-z0-9][A-Za-z0-9\-]{0,7}$/.test(q.t.trim())).length===2&&TX.some(q=>q.x>=c.x-c.r&&q.x<=c.x+c.r&&q.y>=c.y-c.r&&q.y<=c.y+c.r&&/^\d{3,4}[A-Z]?$/.test(q.t.trim()))))continue;if(S.gate.some(g=>g.body&&g.body.r&&anD(g.body.cx,g.body.cy,c.x,c.y)<.5))continue;if(S.shp.some(sh=>sh.ty==='quad'&&c.x>=sh.x0&&c.x<=sh.x1&&c.y>=sh.y0&&c.y<=sh.y1))continue;
  /* two numbers in one circle (upper = connector number, lower = DRAWING it goes to / comes from, e.g. 02 / 051) = link to another sheet */
  const ins=TX.filter(q=>q.x>=c.x-c.r&&q.x<=c.x+c.r&&q.y>=c.y-c.r&&q.y<=c.y+c.r&&/^[A-Za-z0-9][A-Za-z0-9\-]{0,7}$/.test(q.t.trim())).sort((a,b)=>b.y-a.y);
  let num,tgt=null;
  if(ins.length===2&&c.r>=3&&/^\d{3,4}[A-Z]?$/.test(ins[1].t.trim())){const u=ins[0].t.trim();num=/^\d+$/.test(u)?+u:u;tgt=ins[1].t.trim()}
  else{if(c.r>8.3)continue;const t=TX.filter(q=>anD(q.x,q.y,c.x,c.y)<=c.r*.9&&/^(\d{1,2}|[A-Z]{1,3})$/.test(q.t.trim()))[0];if(!t||(c.r>6.5&&t.t.trim()==='M'))continue;num=/^\d+$/.test(t.t.trim())?+t.t:t.t.trim()}
  const nl=new Set();let sink=false;for(const s of S.seg)for(const[x,y]of[[s.x1,s.y1],[s.x2,s.y2]]){const d=anD(x,y,c.x,c.y);if(Math.abs(d-c.r)<=1.2||d<c.r){nl.add(s.net);if(arrAt(s.net,x,y,2.2)&&nets[s.net].arrows.some(a=>anD(a.x,a.y,c.x,c.y)<=c.r+1.6))sink=true}}
  for(const nt of nets)for(const a of nt.arrows){if(anD(a.x,a.y,c.x,c.y)<=c.r+1.2&&((c.x-a.x)*a.dx+(c.y-a.y)*a.dy)>0){nl.add(nt.id);sink=true}}
  const tags=TX.filter(q=>/^(S\d\s*)?[MB]\.[0-9A-F]{3,5}[A-Z]?$|^(S\d\s*)?(AI|S[IO])\d{3,5}$|^[A-Z0-9]{3,}[A-Z0-9-]*\.(MV|PV|SV|REM|LOC|OUT|SIG)$/.test(q.t.trim())&&anD(q.x,q.y,c.x,c.y)<=c.r+24).sort((a,b)=>anD(a.x,a.y,c.x,c.y)-anD(b.x,b.y,c.x,c.y)).slice(0,4).map(q=>q.t.trim());
  let ref=null,rd=c.r+28;for(const q of TX){const m=/(FROM|TO)\s+ABC[-\s]?(\d{3}[A-Z]?)/i.exec(q.t);if(m){const d=anD(q.x,q.y,c.x,c.y);if(d<rd){rd=d;ref={dir:m[1].toUpperCase(),code:m[2].toUpperCase(),codes:[m[2].toUpperCase(),...((/ABC[-\s]?\d{3}[A-Z]?((?:\s*\/\s*[A-Z])+)/i.exec(q.t)||[0,''])[1].match(/[A-Za-z]/g)||[]).map(L=>m[2].slice(0,3)+L.toUpperCase())]}}}}
  if(nl.size)(tgt?S.xc:S.conn).push({num,tgt,x:c.x,y:c.y,r:c.r,nets:[...nl],sink,tags,ref,lt:!tgt&&typeof num==='string'})}
 {const al=S.conn.concat(S.xc);for(let pass=0;pass<3;pass++)for(const c of al)if(!c.sink)for(const d of al)if(d!==c&&d.sink&&Math.abs(anD(c.x,c.y,d.x,d.y)-(c.r+d.r))<=1.5&&(c.nets.some(n=>d.nets.includes(n))||String(c.num)===String(d.num))){c.sink=true;c.chain=1;c.nets=[...new Set([...c.nets,...d.nets])];break}}
 {const RX=/(FROM|TO)\s+ABC[-\s]?(\d{3}[A-Z]?)/i,all=S.conn.concat(S.xc),used=new Set(),codesOf=q=>{const m=RX.exec(q.t),ex=((/ABC[-\s]?\d{3}[A-Z]?((?:\s*\/\s*[A-Z])+)/i.exec(q.t)||[0,''])[1].match(/[A-Za-z]/g)||[]).map(L=>m[2].slice(0,3)+L.toUpperCase());return[m[2].toUpperCase()].concat(ex)};
  for(const c of all)if(c.ref){let bq=null,bd=c.r+28;for(const q of TX){if(!RX.test(q.t))continue;const d=anD(q.x,q.y,c.x,c.y);if(d<bd){bd=d;bq=q}}if(bq)used.add(bq)}
  const prs=[];for(const c of all)if(!c.ref&&!(!c.tgt&&S.conn.some(o=>o!==c&&o.num===c.num&&o.sink!==c.sink)))for(const q of TX){if(used.has(q)||!RX.test(q.t))continue;const d=anD(q.x,q.y,c.x,c.y);if(d<=80)prs.push({c,q,d})}
  prs.sort((a,b)=>a.d-b.d);const uc=new Set(),uq=new Set();for(const e of prs){if(uc.has(e.c)||uq.has(e.q))continue;uc.add(e.c);uq.add(e.q);const m=RX.exec(e.q.t);e.c.ref={dir:m[1].toUpperCase(),code:m[2].toUpperCase(),codes:codesOf(e.q)}}
  for(const q of TX){if(!RX.test(q.t)||uq.has(q))continue;let bc=null,bd=45;for(const c of all){const d=anD(q.x,q.y,c.x,c.y);if(d<bd){bd=d;bc=c}}if(bc&&bc.ref){bc.ref.codes=bc.ref.codes||[bc.ref.code];for(const cd of codesOf(q))if(!bc.ref.codes.includes(cd))bc.ref.codes.push(cd)}}}
 return S}
