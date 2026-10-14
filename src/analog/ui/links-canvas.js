/* ---------- links between sheets: circle with 2 numbers (02 / 051) and numbered circles continued on the next sheet of a family (004A -> 004B) ---------- */
const famOf=n=>{const m=/^ABC-(\d+)/.exec(n);return m?+m[1]:null};
const codeOf=n=>String(n).replace(/^ABC-/,''),hasL=t=>/[A-Z]$/.test(String(t)),posCmp=(a,b)=>b.y-a.y||a.x-b.x;
/* sheets a circle points to: exact code (003E) or, for a bare number (061), the sheet of that number */
const tgtOf=(c,sh)=>AN.sheets.filter(p=>p!==sh&&(codeOf(p.name)===String(c.tgt)||(!hasL(c.tgt)&&famOf(p.name)===parseInt(c.tgt,10)&&!AN.sheets.some(z=>codeOf(z.name)===String(c.tgt)))));
const pointsTo=(q,sh)=>String(q.tgt)===codeOf(sh.name)||(!hasL(q.tgt)&&parseInt(q.tgt,10)===famOf(sh.name));
/* true = this end sends the signal out, false = it receives, null = cannot tell */
const role=(sh,c)=>{if(c.sink||c.nets.some(n=>sh.S.drv[n].some(d=>d.k!=='LINK')))return true;if(c.nets.some(n=>sh.S.cns[n].length))return false;return null};
/* both ends say 'sends out' (or both 'receives'): the end whose wire has consumers in its sheet is the receiving one */
const pairRoles=(sh,c,p,pc)=>{let a=role(sh,c),b=role(p,pc);if(a!==null&&a===b){const ca=c.nets.some(n=>sh.S.cns[n].length),cb=pc.nets.some(n=>p.S.cns[n].length);if(ca&&!cb){a=false;b=true}else if(cb&&!ca){b=false;a=true}}return[a,b]};
const effSink=(sh,c)=>role(sh,c)===true;/* an arrow-less circle that is fed by a block in its own sheet sends the signal out */
function addLink(out,sh,c,p,pc,hint){let[a,b]=pairRoles(sh,c,p,pc);if(hint&&(a===null||b===null||a===b)){a=hint==='out';b=!a}if(a!==null&&a===b)return;const here=a===true||b===false?true:(b===true||a===false?false:null);if(here===null)return;const f=here?{sh,c}:{sh:p,c:pc},t=here?{sh:p,c:pc}:{sh,c};out.push({from:f.sh,to:t.sh,fromNets:f.c.nets,toNets:t.c.nets,fromC:f.c,toC:t.c,num:c.num,at:{sh,c},peer:{sh:p,c:pc}})}
const TAGX=/^(S\d\s*)?[MB]\.[0-9A-F]{3,5}[A-Z]?$|^(S\d\s*)?(AI|S[IO])\d{3,5}$|^[A-Z0-9]{3,}[A-Z0-9-]*\.(MV|PV|SV|REM|LOC|OUT|SIG)$/;
/* index: signal tag -> the sheets / nets where a block DRIVES it (built once, all sheets) */
const ADDRK=/^(?:S(\d)\s*)?([MB]\.[0-9A-F]{3,5}[A-Z]?|(?:AI|S[IO])\d{3,5})$/;
function tkey(sh,t){const m=ADDRK.exec(String(t).trim());if(!m)return String(t).trim();let st=m[1];if(!st){try{st=shStn(sh)}catch(e){}}return(st==null?'?':st)+'|'+m[2]}
function tagIndex(){if(AN.tagIdx)return AN.tagIdx;const ix=AN.tagIdx=new Map();
 for(const p of AN.sheets){let PS;try{PS=ensure(p)}catch(e){continue}
  const add=(t,n)=>{if(!t||!PS.drv[n].some(d=>d.k!=='LINK'))return;const kk=tkey(p,t),a=ix.get(kk)||[];if(!a.some(q=>q.sh===p&&q.n===n))a.push({sh:p,n});ix.set(kk,a)};
  PS.lab.forEach((l,n)=>{if(l)add(l.t,n)});(PS.tagN||[]).forEach(q=>{if(q.d<=4)add(q.t,q.n)});for(const g of PS.blk)if(g.k==='SIGAB'){const f=(g.txt||[]).map(x=>String(x).trim()).find(x=>/^[A-Z]\.[0-9A-F]{4}$/.test(x));if(f){const kk=tkey(p,f),a=ix.get(kk)||[];if(!a.some(q=>q.flag===g.id)){a.push({sh:p,n:-1,flag:g.id});ix.set(kk,a)}}}}
 return ix}
function linksOf(sh){if(sh.lk)return sh.lk;const S=ensure(sh),out=sh.lk=[],my=famOf(sh.name);
 for(const c of S.xc||[]){let hit=null;for(const p of tgtOf(c,sh)){let PS;try{PS=ensure(p)}catch(e){continue}
   const mine=(S.xc||[]).filter(q=>q.num===c.num&&String(q.tgt)===String(c.tgt)).sort(posCmp),idx=mine.indexOf(c);
   let theirs=(PS.xc||[]).filter(q=>q.num===c.num&&pointsTo(q,sh)).sort(posCmp);if(!theirs.length)theirs=(PS.conn||[]).filter(q=>q.num===c.num).sort(posCmp);
   if(theirs.length){const sh_=theirs.filter(q=>(c.tags||[]).some(t=>(q.tags||[]).includes(t))),pc=sh_.length===1?sh_[0]:theirs[Math.min(idx,theirs.length-1)],[a,b]=pairRoles(sh,c,p,pc);if(a===null||b===null||a!==b){hit=[p,pc];break}}}
  if(hit)addLink(out,sh,c,hit[0],hit[1]);else c.nolink=1}
 const grp={};S.conn.forEach(c=>{if(!c.lt)(grp[c.num]=grp[c.num]||[]).push(c)});
 for(const n in grp){const g=grp[n];for(const c of g){if(g.some(q=>q!==c&&q.sink!==c.sink))continue;
  for(const p of AN.sheets){if(p===sh||famOf(p.name)!==my)continue;let PS;try{PS=ensure(p)}catch(e){continue}const pg=PS.conn.filter(q=>q.num===c.num),pc=pg.find(q=>q.sink!==c.sink&&!pg.some(z=>z!==q&&z.sink!==q.sink));if(pc)addLink(out,sh,c,p,pc)}}}
 /* v1.9.0: single circles that say "( FROM ABC-003A )" / "TO ABC-xxx": go to that drawing, match number + the M.xxxx tag written next to the circle */
 {const linked=new Set(out.map(l=>l.at.c));
  for(const c of S.conn){if(linked.has(c)||!c.ref)continue;const rc=role(sh,c);
   if(S.conn.some(q=>q!==c&&q.num===c.num&&role(sh,q)!==null&&rc!==null&&role(sh,q)!==rc))continue;
   const bests=[];for(const p of AN.sheets){if(p===sh||!((c.ref.codes||[c.ref.code]).includes(codeOf(p.name))||(!hasL(c.ref.code)&&famOf(p.name)===parseInt(c.ref.code,10))))continue;let PS;try{PS=ensure(p)}catch(e){continue}let best=null;
    for(const q of PS.conn.filter(z=>z.num===c.num)){const[a,b]=pairRoles(sh,c,p,q),sc=(c.tags||[]).filter(t=>(q.tags||[]).includes(t)).length*4+(q.ref&&((q.ref.codes||[q.ref.code]).includes(codeOf(sh.name))||(!hasL(q.ref.code)&&+q.ref.code===my))?2:0)+(a!==null&&b!==null&&a!==b?1:0);if(!best||sc>best.sc)best={sc,p,q}}
    if(best&&best.sc>=1)bests.push(best)}
   for(const best of bests)addLink(out,sh,c,best.p,best.q,c.ref.dir==='FROM'?'in':'out')}}
 /* v1.0.1: a signal tag that is an OUTPUT on one sheet and an INPUT on another sheet is ONE signal (M.0124, B.0646, SICL1060A.MV ...) */
 {const done=new Set(out.filter(l=>l.to===sh).flatMap(l=>l.toNets));let ix=null;
  for(const n of S.ext){if(done.has(n))continue;let lb=S.lab[n];
   /* v1.9.0: tag a bit further from the wire, and the "( FROM ABC-xxx )" text next to it, are used too */
   const near=(rx,mx)=>{let b=null,bd=mx;for(const t of S.tx){if(!rx.test(t.t.trim()))continue;for(const i of S.nets[n].segs){const d=anPtSeg(t.x,t.y,S.seg[i]);if(d<bd){bd=d;b=t}}}return b};
   if(!lb||!TAGX.test(lb.t)){const t=near(TAGX,9);if(t)lb={t:t.t.trim(),x:t.x,y:t.y};else{let w=null;try{w=wireTag(S,n)}catch(e){}if(!w||!TAGX.test(String(w).trim()))continue;const sg0=S.seg[S.nets[n].segs[0]];lb={t:String(w).trim(),x:sg0?sg0.x1:0,y:sg0?sg0.y1:0}}}
   const fr=near(/FROM\s+ABC[-\s]?\d{3}/i,14),fm=fr&&/FROM\s+ABC[-\s]?(\d{3}[A-Z]?)/i.exec(fr.t),rcode=fm&&fm[1].toUpperCase(),rs=rcode?AN.sheets.filter(p=>codeOf(p.name)===rcode||(!hasL(rcode)&&famOf(p.name)===parseInt(rcode,10))):[];
   ix=ix||tagIndex();let cl=(ix.get(tkey(sh,lb.t))||[]).filter(q=>q.sh!==sh&&(q.flag!=null||q.sh.S.nets[q.n].dig===S.nets[n].dig));
   if(rs.length){const pr=cl.filter(q=>rs.includes(q.sh));if(pr.length)cl=pr;else for(const p of rs){let PS;try{PS=ensure(p)}catch(e){continue}for(const q of PS.tagN||[])if(q.t===lb.t&&PS.drv[q.n].some(d=>d.k!=='LINK')&&PS.nets[q.n].dig===S.nets[n].dig&&p!==sh)cl.push({sh:p,n:q.n})}}
   const c=cl[0];if(!c)continue;
   const CS=c.sh.S,gb=c.flag!=null?CS.blk.find(z=>z.id===c.flag):null,sg=gb?null:CS.seg[CS.nets[c.n].segs[0]],sl=gb?{x:gb.cx,y:gb.cy}:(CS.lab[c.n]||(sg?{x:sg.x1,y:sg.y1}:{x:0,y:0}));
   out.push({from:c.sh,to:sh,fromNets:c.flag!=null?[]:[c.n],flagSrc:c.flag,toNets:[n],fromC:{x:sl.x,y:sl.y,r:4},toC:{x:lb.x,y:lb.y,r:4},num:lb.t,tag:1,at:{sh,c:null},peer:{sh:c.sh,c:null}})}}
 /* mark the nets that are fed from another sheet */
 for(const l of out)if(l.to===sh){S.xlk=S.xlk||{};for(const n of l.toNets)if(S.ext.includes(n)){S.xlk[n]=l;try{const FS=l.from.S,fn=l.fromNets.find(m=>FS.drv[m].some(d=>d.k!=='LINK'));if(fn!==undefined&&!!FS.nets[fn].dig!==!!S.nets[n].dig&&!FS.nets[fn].sigab&&!S.nets[n].sigab)S.nets[n].dig=FS.nets[fn].dig}catch(e){}}}
 return out}
function actSet(sh){const set=[sh],seen=new Set([sh]),grow=()=>{for(let i=0;i<set.length&&set.length<64;i++){for(const l of linksOf(set[i]))for(const y of[l.from,l.to])if(!seen.has(y)&&set.length<64){seen.add(y);set.push(y)}}};grow();if(AN.p2&&!seen.has(AN.p2)){seen.add(AN.p2);set.push(AN.p2)}for(const nm of (AN.hmiSheets||[]).concat(AN.plantSheets||[])){const p=AN.sheets.find(s=>s.name===nm);if(p&&!seen.has(p)){seen.add(p);set.push(p)}}grow();return set}
function stepSet(sh,dt){const set=actSet(sh);
 for(const x of set)for(const l of x.lk||[]){if(l.to!==x)continue;const FS=l.from.S,TS=x.S;if(!FS||!TS)continue;const val=l.flagSrc!=null?(FS.rt.st[l.flagSrc]&&FS.rt.st[l.flagSrc].val>.5?1:0):FS.rt.v[l.fromNets.find(n=>FS.drv[n].length)??l.fromNets[0]];for(const n of l.toNets)if(TS.ext.includes(n)){TS.rt.ext[n]=val;TS.xlk=TS.xlk||{};TS.xlk[n]=l}}
 for(const x of set)try{procRemote(x)}catch(e){}for(const x of set)anStep(x.S,dt)}
/* TIERED STEPPING (RUN only). The whole boiler keeps running, but the sheet you look at and the sheets joined to it by a signal are calculated at every tick, the rest of the plant every K-th tick with K times the time step (K is chosen by the app from the time one tick needs: 1 on a fast PC, up to 6 on a slow tablet). */
function stepTier(sh,dt,K){const full=actSet(sh),near=new Set([sh]);try{for(const l of linksOf(sh)){near.add(l.from);near.add(l.to)}}catch(e){}
 const tk=AN._tk=(AN._tk||0)+1,due=tk%K===0,set=full.filter(x=>near.has(x)||due);
 for(const x of set)for(const l of x.lk||[]){if(l.to!==x)continue;const FS=l.from.S,TS=x.S;if(!FS||!TS)continue;const val=l.flagSrc!=null?(FS.rt.st[l.flagSrc]&&FS.rt.st[l.flagSrc].val>.5?1:0):FS.rt.v[l.fromNets.find(n=>FS.drv[n].length)??l.fromNets[0]];for(const n of l.toNets)if(TS.ext.includes(n)){TS.rt.ext[n]=val;TS.xlk=TS.xlk||{};TS.xlk[n]=l}}
 for(const x of set)try{procRemote(x)}catch(e){}
 for(const x of set){if(near.has(x))anStep(x.S,dt);else{const T=dt*K,m=Math.max(1,Math.ceil(T/.5));for(let i=0;i<m;i++)anStep(x.S,T/m)}}}
/* ---------- jump to the other end of a numbered circle ---------- */
AN.hist=[];
function flash(x,y,r){if(!L||!L.selg)return;const sh=cs(),v=AN.av[sh.name],W=v?v[2]:100,R0=Math.max(r+1.5,W*.022),sw=Math.max(.5,W*.0035),g=L.selg,
  a=el('circle',{cx:x,cy:-y,r:R0,fill:'var(--sel)','fill-opacity':.22,stroke:'var(--sel)','stroke-width':sw,'pointer-events':'none'},g),b=el('circle',{cx:x,cy:-y,r:R0,fill:'none',stroke:'var(--sel)','stroke-width':sw*.7,'pointer-events':'none'},g);
 const t0=performance.now(),T=3.6;const tick=now=>{const t=(now-t0)/1000;if(t>T||!a.isConnected){a.remove();b.remove();return}const ph=(t%1.2)/1.2;b.setAttribute('r',R0*(1+ph*2.4));b.setAttribute('stroke-opacity',1-ph);a.setAttribute('fill-opacity',(.26*(1-t/T)+.05)*(Math.floor(t*3)%2?.6:1));requestAnimationFrame(tick)};requestAnimationFrame(tick)}
function centerOn(x,y){const sh=cs(),v=AN.av[sh.name],svg=$('svg');if(!v)return;v[0]=x-v[2]/2;v[1]=-y-v[3]/2;svg.setAttribute('viewBox',v.join(' '))}
function jumpTo(sh2,c2){const cur_=cs(),pv=(AN.av[cur_.name]||[]).slice();AN.hist.push({name:cur_.name,view:pv});updBack();
 if(sh2!==cur_){go(AN.sheets.indexOf(sh2));const v=AN.av[sh2.name],r=$('svg').getBoundingClientRect();if(v&&pv.length&&r.width){v[2]=pv[2];v[3]=pv[2]*r.height/r.width}}/* keep the zoom you had */
 centerOn(c2.x,c2.y);selBox();flash(c2.x,c2.y,c2.r)}
function updBack(){bBk.style.display=AN.hist.length?'':'none'}
function goBack(){const h=AN.hist.pop();updBack();if(!h)return;const i=AN.sheets.findIndex(s=>s.name===h.name);if(i<0)return;if(AN.sheets[i]!==cs())go(i);if(h.view.length){AN.av[h.name]=h.view;$('svg').setAttribute('viewBox',h.view.join(' '))}}
AN.cj={};
/* every other end of a circle: same number on this sheet, and on every sheet named by the sheet code under the number / letter or by the text ( FROM / TO ABC-xxx ) ("004B/C" = both) */
function endsOf(sh,c){const S=ensure(sh),ends=[],addE=(s2,c2)=>{if(!(s2===sh&&c2===c)&&!ends.some(e=>e.sh===s2&&e.c===c2))ends.push({sh:s2,c:c2})},lk=linksOf(sh).find(l=>l.at.c===c);
 if(!c.tgt)S.conn.filter(q=>q!==c&&q.num===c.num).forEach(q=>addE(sh,q));
 const names=c.tgt?[String(c.tgt)]:(c.ref?(c.ref.codes||[c.ref.code]):[]);
 for(const code of names)for(const p of AN.sheets){if(p===sh||!(codeOf(p.name)===code||(!hasL(code)&&famOf(p.name)===parseInt(code,10))))continue;let PS;try{PS=ensure(p)}catch(e){continue}
  (PS.xc||[]).filter(q=>q.num===c.num&&pointsTo(q,sh)).concat((PS.conn||[]).filter(q=>q.num===c.num)).forEach(q=>addE(p,q))}
 if(lk)addE(lk.peer.sh,lk.peer.c);return ends}
function dsGoRef(r){const m=/(?:DITL\s*)?([0-9]{2}[A-Z]?)\s*-\s*(\d+)/i.exec(String(r));if(!m){msg('DITL reference not understood: '+r);return false}const code=m[1].toUpperCase(),nn=m[2];let i=S.sheets.findIndex(x=>new RegExp('DITL-'+code+'$','i').test(x.name));if(i<0)i=S.sheets.findIndex(x=>new RegExp('DITL-'+code.replace(/[A-Z]$/,'')+'$','i').test(x.name));if(i<0){msg('DITL sheet '+code+' ('+r+') is not in the DITL page');return false}setCat('dig');S.cur=i;sel=null;render();msg('DITL page: '+S.sheets[i].name+' (reference '+r+', item '+nn+')');return true}
function connClick(c){const sh=cs(),S=sh.S;AN.sel={net:c.nets[0]};selBox();paint();panelUpd(true);
 {const dt=S.tx.filter(t=>/DITL\s*[0-9]{2}[A-Z]?\s*-\s*\d+/i.test(t.t)&&Math.hypot(t.x-c.x,t.y-c.y)<c.r+16).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0];const own=dt&&(S.conn||[]).concat(S.xc||[]).slice().sort((a,b)=>Math.hypot(a.x-dt.x,a.y-dt.y)-Math.hypot(b.x-dt.x,b.y-dt.y))[0];const lk0=linksOf(sh).find(l=>l.at.c===c);if(dt&&own===c&&!(lk0&&lk0.to===sh&&lk0.from!==sh&&lk0.peer&&lk0.peer.sh&&lk0.peer.c)){const m=/DITL\s*([0-9]{2}[A-Z]?)\s*-\s*(\d+)/i.exec(dt.t);if(m&&dsGoRef('DITL '+m[1]+'-'+m[2]))return}}
 const lk=linksOf(sh).find(l=>l.at.c===c);
 if(lk&&lk.to===sh&&lk.from!==sh&&lk.peer&&lk.peer.sh&&lk.peer.c){jumpTo(lk.peer.sh,lk.peer.c);msg('Circle '+c.num+(c.tgt?' / '+c.tgt:'')+' ← this signal comes from '+lk.peer.sh.name+'. Click the circle there to follow it onward.');return}
 {/* the group = this circle + all circles reached from it, also through the other circles (a receiver knows only its sender, the sender knows all receivers); walk the group in a fixed order (sheet, then top to bottom, left to right): every click goes to the next member, after the last it starts again. Click the circle you are at to continue. */
  const seen=[{sh,c}];for(let i=0;i<seen.length&&seen.length<64;i++)for(const e of endsOf(seen[i].sh,seen[i].c))if(!seen.some(x=>x.sh===e.sh&&x.c===e.c))seen.push(e);
  if(seen.length>1){const grp=seen.slice().sort((a,b)=>AN.sheets.indexOf(a.sh)-AN.sheets.indexOf(b.sh)||posCmp(a.c,b.c)),me=grp.findIndex(e=>e.sh===sh&&e.c===c),k=(me+1)%grp.length,e=grp[k];jumpTo(e.sh,e.c);
   msg('Circle '+c.num+(c.tgt?' / '+c.tgt:'')+' → '+(e.sh===sh?'same sheet':e.sh.name)+'  (end '+(k+1)+' of '+grp.length+'; click the circle you are at to go to the next end, after the last it starts again)'+(lk&&e.c===lk.peer.c&&e.sh===lk.peer.sh?'  · signal link':''));return}}
 if(c.tgt){if(lk){jumpTo(lk.peer.sh,lk.peer.c);return}
  const cand=tgtOf(c,sh);
  if(cand.length){let hit=null;for(const p of cand){let PS;try{PS=ensure(p)}catch(e){continue}const q=(PS.xc||[]).find(z=>z.num===c.num&&pointsTo(z,sh))||(PS.xc||[]).find(z=>z.num===c.num)||(PS.conn||[]).find(z=>z.num===c.num);if(q){hit=[p,q];break}}
   if(hit){jumpTo(hit[0],hit[1]);msg('Circle '+c.num+' → '+hit[0].name+' (the other end has no opposite arrow, so no live signal is carried)');return}
   AN.hist.push({name:sh.name,view:(AN.av[sh.name]||[]).slice()});updBack();go(AN.sheets.indexOf(cand[0]));msg('Opened '+cand[0].name+' (circle '+c.num+' was not found there, check by eye).');return}
  msg('Circle '+c.num+' / '+c.tgt+': drawing ABC-'+c.tgt+' is not in the sheet list.');return}
 const pr=S.conn.filter(q=>q!==c&&q.num===c.num).sort((a,b)=>(b.sink!==c.sink)-(a.sink!==c.sink));
 if(pr.length){const k=AN.cj[sh.name+'#'+c.num]=((AN.cj[sh.name+'#'+c.num]||0)+1)%pr.length;const t=pr[(k+pr.length-1)%pr.length];jumpTo(sh,t);msg('Circle '+c.num+(t.sink!==c.sink?(c.sink?' · signal goes out here and comes in at this end':' · signal comes from here'):' · another end of the same number')+(pr.length>1?' ('+((k+pr.length-1)%pr.length+1)+'/'+pr.length+', click again for the next)':''));return}
 if(lk){jumpTo(lk.peer.sh,lk.peer.c);msg('Continues on '+lk.peer.sh.name);return}
 msg('Circle '+c.num+' has no other end on this sheet (it continues on another drawing that is not marked).')}
let L=null;/* live layer refs */
function anRender(){const svg=$('svg'),sh=cs();anSide();sTh.value=AN.ws.th||'color';
 if(!sh){svg.innerHTML='';svg.setAttribute('viewBox','0 0 400 100');el('text',{x:200,y:50,'text-anchor':'middle',fill:'#7d8e9a','font-size':6},svg).textContent=AN.data?'No analog sheet':'Loading analog sheets…';return}
 sSh.innerHTML='';anOrd().forEach(i=>{const s=AN.sheets[i];sSh.append(h$('option',{value:i,txt:s.name+(s.no?' · '+s.no:''),...(i===AN.i?{selected:'selected'}:{})}))});
 let S;try{S=ensure(sh)}catch(e){svg.innerHTML='';msg('Sheet '+sh.name+' could not be compiled: '+e.message);console.error(e);return}
 if(AN.key!==sh.name){AN.key=sh.name;try{linksOf(sh)}catch(e){console.error(e)}try{anFXRe(sh)}catch(e){console.error(e)}drawSheet(sh);buildPanel();if(AN.ah)showPanel(!!AN.sel);}
 meta.innerHTML='';meta.append(h$('b',{txt:sh.name}),h$('span',{txt:(sh.no?'SHEET '+sh.no+' · ':'')+(sh.title||'')}),h$('span',{id:'anmode',style:'margin-left:12px;padding:2px 8px;border-radius:4px;font:700 12px sans-serif'}),h$('span',{cls:'sp'}),lgd(),h$('small',{txt:S.blk.length+' blocks · '+S.ext.length+' external inputs · '+sh.fam}));
 catB.forEach(x=>x._u());{const r=svg.getBoundingClientRect();if(r.width)AN.sz={w:r.width,h:r.height}}try{p2Sync()}catch(e){console.error('p2Sync',e)}paint();panelUpd()}
function bbox(R){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const a=(x,y)=>{if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y};
 R.seg.forEach(s=>{a(s.x1,s.y1);a(s.x2,s.y2)});R.pl.forEach(p=>p.p.forEach(q=>a(q[0],q[1])));R.ci.forEach(c=>{a(c.x-c.r,c.y-c.r);a(c.x+c.r,c.y+c.r)});R.tx.forEach(t=>{a(t.x,t.y);a(t.x+t.t.length*t.h*.6,t.y+t.h)});
 if(x0>x1)return[0,0,100,100];return[x0,y0,x1,y1]}
function fitView(){const sh=cs();if(!sh)return;const b=sh.bb||(sh.bb=bbox(sh.R)),svg=$('svg'),r=svg.getBoundingClientRect();let w=b[2]-b[0]+20,h=b[3]-b[1]+20;const ar=(r.width||800)/(r.height||600);if(w/h<ar)w=h*ar;else h=w/ar;
 const cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;AN.av[sh.name]=[cx-w/2,-cy-h/2,w,h];AN.sz={w:r.width,h:r.height};svg.setAttribute('viewBox',AN.av[sh.name].join(' '))}
function vplace(R,S,L,bs){
 const rot=(r,t)=>{const A=-t.r*Math.PI/180,cx=t.x,cy=-t.y,pts=[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]].map(([x,y])=>[cx+(x-cx)*Math.cos(A)-(y-cy)*Math.sin(A),cy+(x-cx)*Math.sin(A)+(y-cy)*Math.cos(A)]);return[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))]};
 const TX=[];(L.txe||new Map()).forEach((e,t)=>{let b;try{b=e.getBBox()}catch(x){b=null}if(!b||(!b.width&&!b.height)){const w=t.t.length*t.h*.6,hh=t.h;b={x:t.x,y:-(t.y+hh),width:w,height:hh*1.1}}let r=[b.x,b.y,b.x+b.width,b.y+b.height];if(t.r&&Math.abs(Math.sin(t.r*Math.PI/180))>.2)r=rot(r,t);const sh=(r[3]-r[1])*.18;TX.push({r:[r[0]+.1,r[1]+sh,r[2]-.1,r[3]-sh],t:t.t.trim(),x:t.x,y:-t.y,full:r})});
 const BLK=S.blk.map(b=>[b.x0-.3,-b.y1-.3,b.x1+.3,-b.y0+.3]);
 const SG=[];for(const s of[].concat(R.seg,S.seg,S.gl||[],S.edge||[]))SG.push([s.x1,-s.y1,s.x2,-s.y2]);
 const SH=[];for(const c of R.ci||[])SH.push([c.x-c.r,-c.y-c.r,c.x+c.r,-c.y+c.r]);for(const p of R.pl||[]){const xs=p.p.map(q=>q[0]),ys=p.p.map(q=>-q[1]);SH.push([Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)])}
 const W0=6*bs*.62,W=W0,H=bs*.95,GAP=[.9,1.7,2.8,4.2,6,8.5,12];
 const ov=(a,c)=>{const w=Math.min(a[2],c[2])-Math.max(a[0],c[0]),h=Math.min(a[3],c[3])-Math.max(a[1],c[1]);return w>.05&&h>.05?w*h:0};
 const lb=(x1,y1,x2,y2,r)=>{let t0=0,t1=1;const dx=x2-x1,dy=y2-y1;for(const[p,q]of[[-dx,x1-r[0]],[dx,r[2]-x1],[-dy,y1-r[1]],[dy,r[3]-y1]]){if(Math.abs(p)<1e-9){if(q<0)return false}else{const t=q/p;if(p<0){if(t>t1)return false;if(t>t0)t0=t}else{if(t<t0)return false;if(t<t1)t1=t}}}return true};
 const PB=[];const near=(A,r,m)=>A.filter(q=>q[2]>r[0]-m&&q[0]<r[2]+m&&q[3]>r[1]-m&&q[1]<r[3]+m);
 /* grid index: score() only looks at the items near the box (same result, same order of the sum; was a loop over every item of the sheet) */
 const CELL=12,grid=(items,bx)=>{const m=new Map(),st=new Int32Array(items.length).fill(-1);let id=0;const key=(i,j)=>i*65536+j;items.forEach((it,k)=>{const b=bx(it);for(let i=Math.floor(b[0]/CELL);i<=Math.floor(b[2]/CELL);i++)for(let j=Math.floor(b[1]/CELL);j<=Math.floor(b[3]/CELL);j++){const kk=key(i,j);let a=m.get(kk);if(!a)m.set(kk,a=[]);a.push(k)}});
  return r=>{id++;const out=[];for(let i=Math.floor(r[0]/CELL);i<=Math.floor(r[2]/CELL);i++)for(let j=Math.floor(r[1]/CELL);j<=Math.floor(r[3]/CELL);j++){const a=m.get(key(i,j));if(a)for(const k of a)if(st[k]!==id){st[k]=id;out.push(k)}}return out.sort((a,b)=>a-b)}};
 const gTX=grid(TX,t=>t.r),gBLK=grid(BLK,q=>q),gSH=grid(SH,q=>q),gSG=grid(SG,q=>[Math.min(q[0],q[2]),Math.min(q[1],q[3]),Math.max(q[0],q[2]),Math.max(q[1],q[3])]);
 const score=(r,own)=>{let s=0;const ex=[r[0]-.45,r[1]-.45,r[2]+.45,r[3]+.45];for(const k of gTX(r)){const t=TX[k];if(t!==own)s+=ov(r,t.r)*40}for(const k of gBLK(r))s+=ov(r,BLK[k])*30;for(const q of PB)s+=ov(r,q)*60;for(const k of gSH(r))s+=ov(r,SH[k])*20;let n=0;for(const k of gSG(ex)){const q=SG[k];if(q[0]>ex[2]&&q[2]>ex[2])continue;if(q[0]<ex[0]&&q[2]<ex[0])continue;if(q[1]>ex[3]&&q[3]>ex[3])continue;if(q[1]<ex[1]&&q[3]<ex[1])continue;if(lb(q[0],q[1],q[2],q[3],ex))n++}return s+n*12};
 const put=(b,r,al,ax,ay)=>{PB.push(r);const t=b.t;if(al==='r'){t.setAttribute('x',r[0]);t.setAttribute('text-anchor','start')}else if(al==='l'){t.setAttribute('x',r[2]);t.setAttribute('text-anchor','end')}else{t.setAttribute('x',(r[0]+r[2])/2);t.setAttribute('text-anchor','middle')}t.setAttribute('y',(r[1]+r[3])/2);t.setAttribute('dominant-baseline','central');t.dataset.al=al;t.dataset.ax=ax;t.dataset.ay=ay;b.al=al};
 /* a box anchor (the text of an address / tag): right, below, above, left; level / centred */
 const around=(b,T,own,pf,W=W0,GP=GAP)=>{pf=pf||{r:0,b:.4,t:.8,l:1.2};let best=null;const cx=(T[0]+T[2])/2,cy=(T[1]+T[3])/2;for(const g of GP)for(const[al,r,ax,ay]of[['r',[T[2]+g,cy-H/2,T[2]+g+W,cy+H/2],T[2],cy],['b',[cx-W/2,T[3]+g*.6,cx+W/2,T[3]+g*.6+H],cx,T[3]],['t',[cx-W/2,T[1]-g*.6-H,cx+W/2,T[1]-g*.6],cx,T[1]],['l',[T[0]-g-W,cy-H/2,T[0]-g,cy+H/2],T[0],cy]]){const s=score(r,own)+g*.3+pf[al];if(!best||s<best.s)best={s,r,al,ax,ay};if(best.s<.9)break}if(best){put(b,best.r,best.al,best.ax,best.ay);b.t.dataset.at=own?own.t:''}return best?best.s:1e9};
 /* a point on a wire: along the wire, beside a vertical piece (level), above / below a horizontal one (centred) */
 const alongNet=(b)=>{const n=b.n,segs=(S.nets[n].segs||[]).map(i=>S.seg[i]).filter(Boolean);if(!segs.length){if(b.pin)around(b,[b.pin[0]-.3,-b.pin[1]-.3,b.pin[0]+.3,-b.pin[1]+.3],null);return}const pin=b.pin||[segs[0].x1,segs[0].y1],px=pin[0],py=-pin[1];let best=null;
  for(const s of segs){const x1=s.x1,y1=-s.y1,x2=s.x2,y2=-s.y2,L_=Math.hypot(x2-x1,y2-y1);const hz=Math.abs(y1-y2)<=Math.abs(x1-x2);const ts=[];for(let d=1.5;d<L_-.8;d+=1.8)ts.push(d/L_);ts.push(.5);
   /* beyond each end of the piece (a short stub has no room beside it): level with a horizontal end, centred under / over a vertical end */
   for(const[ex,ey,sx,sy]of[[x1,y1,Math.sign(x1-x2),Math.sign(y1-y2)],[x2,y2,Math.sign(x2-x1),Math.sign(y2-y1)]])for(const g of[.9,1.7,3,4.6,6.6,9,12]){let c;if(hz)c=sx>=0?[['r',[ex+g,ey-H/2,ex+g+W,ey+H/2]]]:[['l',[ex-g-W,ey-H/2,ex-g,ey+H/2]]];else c=sy>=0?[['b',[ex-W/2,ey+g,ex+W/2,ey+g+H]]]:[['t',[ex-W/2,ey-g-H,ex+W/2,ey-g]]];for(const[al,r]of c){const s_=score(r)+Math.hypot(ex-px,ey-py)*.35+g*.3+.5;if(!best||s_<best.s)best={s:s_,r,al,ax:ex,ay:ey}}}
   for(const t of ts){const qx=x1+(x2-x1)*t,qy=y1+(y2-y1)*t,dist=Math.hypot(qx-px,qy-py);for(const g of[.9,1.7,3,4.6,6.6,9,12]){const c=hz?[['b',[qx-W/2,qy+g,qx+W/2,qy+g+H],qx,qy],['t',[qx-W/2,qy-g-H,qx+W/2,qy-g],qx,qy]]:[['r',[qx+g,qy-H/2,qx+g+W,qy+H/2],qx,qy],['l',[qx-g-W,qy-H/2,qx-g,qy+H/2],qx,qy]];for(const[al,r,ax,ay]of c){const s=score(r)+dist*.35+g*.3;if(!best||s<best.s)best={s,r,al,ax,ay}}}}}
  if(!best&&b.pin)around(b,[px-.3,py-.3,px+.3,py+.3],null);if(best){put(b,best.r,best.al,best.ax,best.ay);b.vs=best.s;(L.vbad=L.vbad||[]).push&&best.s>=1&&L.vbad.push({n:b.n,s:+best.s.toFixed(1),pin:b.pin,segs:segs.length})}};
 for(const o of L.ov||[])if(o.t)o.t.dataset.eq=o.k;
 /* the timer / valve / switch / AO values (placed before, with their own rule) are taken: no wire value on top of them */
 for(const o of L.ov||[]){if(!o.t)continue;/* these never show a number (the leg-label colours, the COS and ACH colours; an AO whose address already shows it): no room is kept for them */if(o.k==='SW'||o.k==='COS'||o.k==='ACH'||((o.k==='AO'||o.k==='PO')&&L.addrN&&o.b.pins.some(p=>L.addrN.has(p.n))))continue;const x=+o.t.getAttribute('x'),y=+o.t.getAttribute('y'),w=(o.k==='TMR'?10:o.k==='VLV'||o.k==='SW'?5:6)*bs*.62,md=o.t.getAttribute('text-anchor')==='middle';if(isFinite(x)&&isFinite(y))PB.push([md?x-w/2:x,y-H*.85,(md?x-w/2:x)+w,y+H*.2])}
 const rp=new Map();for(const q of L.addrRep||[])rp.set(q.b,q);
 const boxOf=(txt,x,y)=>{let bst=null,bd=1e9;for(const t of TX){if(t.t!==txt)continue;const d=Math.hypot(t.x-x,t.y-y);if(d<bd){bd=d;bst=t}}return bst};
 const A=[],C=[],Wb=[],K=[];for(const b of L.bd){if(!b.t||!b.t.isConnected)continue;if(b.addr&&rp.has(b))A.push(b);else if(b.circ)C.push(b);else if(b.skip)K.push(b);else Wb.push(b)}
 for(const b of A){const q=rp.get(b),T=boxOf(String(q.t).trim(),q.x,-q.y);if(T)around(b,T.full,T);else if(b.pin)alongNet(b)}
 for(const b of C){const T=b.anc&&boxOf(String(b.anc.t).trim(),b.anc.x,-b.anc.y);if(T)around(b,T.full,T)}
 for(const b of Wb)alongNet(b);for(const b of K)alongNet(b)}
function drawSheet(sh){const svg=$('svg'),R=sh.R,S=sh.S;svg.innerHTML='';L={nets:[],bd:[]};
 const g0=el('g',{fill:'none','stroke-width':.25,'stroke-linecap':'round','stroke-opacity':.5},svg),P={};const pth=(c,d)=>{P[c]=(P[c]||'')+d};
 const covered=new Set(),kk=(a,b,c,d)=>[a,b,c,d].map(v=>Math.round(v*20)).join(',');for(const s of [].concat(S.seg,S.gl||[],S.edge||[],(S.gate||[]).flatMap(g=>g.used||[]))){covered.add(kk(s.x1,s.y1,s.x2,s.y2));covered.add(kk(s.x2,s.y2,s.x1,s.y1))}
 R.seg.forEach(s=>{if(!covered.has(kk(s.x1,s.y1,s.x2,s.y2)))pth(aci(s.c),`M${s.x1} ${-s.y1}L${s.x2} ${-s.y2}`)});
 R.pl.forEach(p=>pth(aci(p.c),'M'+p.p.map(q=>q[0]+' '+-q[1]).join('L')+'Z'));
 R.ci.forEach(c=>pth(aci(c.c),`M${c.x-c.r} ${-c.y}a${c.r} ${c.r} 0 1 0 ${2*c.r} 0a${c.r} ${c.r} 0 1 0 ${-2*c.r} 0`));
 R.ar.forEach(a=>{const t=v=>v*Math.PI/180,x1=a.x+a.r*Math.cos(t(a.a0)),y1=a.y+a.r*Math.sin(t(a.a0)),x2=a.x+a.r*Math.cos(t(a.a1)),y2=a.y+a.r*Math.sin(t(a.a1)),sw=((a.a1-a.a0)%360+360)%360;pth(aci(a.c),`M${x1} ${-y1}A${a.r} ${a.r} 0 ${sw>180?1:0} 0 ${x2} ${-y2}`)});
 for(const c in P)el('path',{d:P[c],stroke:c},g0);
 const gd=el('g',{},svg),gf=el('g',{},svg),gp=el('g',{},svg);L.arw=[];
 const DT=[];R.dot.forEach(d=>{DT.push([d,el('circle',{cx:d.x,cy:-d.y,r:Math.min(d.r,1.6),fill:aci(d.c)},gd)])});
 R.so.forEach(s=>{if(S.arrows.some(a=>s.p.some(q=>Math.hypot(q[0]-a.x,q[1]-a.y)<1.2)))return;el('path',{d:'M'+s.p.map(q=>q[0]+' '+-q[1]).join('L')+'Z',fill:aci(s.c)},gf)});
 S.nets.forEach(n=>n.arrows.forEach(a=>{const bx=a.x-a.dx*2.8,by=a.y-a.dy*2.8,px=-a.dy*1.05,py=a.dx*1.05;(L.arw[n.id]=L.arw[n.id]||[]).push(el('path',{d:`M${a.x} ${-a.y}L${bx+px} ${-(by+py)}L${bx-px} ${-(by-py)}Z`,fill:'#4a5660'},gf))}));
 const blkAt=(x,y,m)=>{let best=null,ba=1e12;for(const b of S.blk){if(b.k==='VLV')continue;if(x>=b.x0-m&&x<=b.x1+m&&y>=b.y0-m&&y<=b.y1+m){const a=(b.x1-b.x0)*(b.y1-b.y0);if(a<ba){ba=a;best=b}}}return best};
  const ENG=AN.ws.th==='eng',engC=c=>{const m=/^#([0-9a-f]{6})$/i.exec(c);if(!m)return c;const n=parseInt(m[1],16),g=[206,214,222],q=[n>>16,n>>8&255,n&255].map((v,i)=>Math.round(g[i]*.58+v*.42));return'#'+q.map(v=>v.toString(16).padStart(2,'0')).join('')},kc=k=>ENG?engC(anKcol(k)):anKcol(k),symC=(x,y)=>{const b=blkAt(x,y,.6);if(b)return kc(b.k);for(const c of S.conn.concat(S.xc||[]))if(anD(c.x,c.y,x,y)<=c.r+.6)return '#c9d3dc';return '#aeb9c3'};
  const tcol=t=>{const b=blkAt(t.x,t.y,0);return b?kc(b.k):'#d5dde3'};
  const CEN=new Set(['SW','AMT','COS','CONST','HC','LC','HLC','CMPK','MUL','DIV','ABS','SQRT','FX','LAG','HS','LS','HLIM','LLIM','TP','PO','IP','CTK','ADD','SUB','DEV','SUM']),tIn=new Map();for(const t of R.tx){const b=blkAt(t.x,t.y,0);if(b&&CEN.has(b.k)){(tIn.get(b)||tIn.set(b,[]).get(b)).push(t)}}
 const tcen=t=>{if(t.r)return null;const b=blkAt(t.x,t.y,0);if(!b||!CEN.has(b.k))return null;const a=tIn.get(b);return a&&a.length===1&&t.t.trim().length<=8?b:null};
 const TXE=new Map(),gt=el('g',{},svg);R.tx.forEach(t=>{const cb=tcen(t),e=el('text',{x:cb?cb.cx:t.x,y:-(cb?cb.cy:t.y),'font-size':t.h,fill:tcol(t),'text-anchor':cb?'middle':(t.a===1||t.a===4)?'middle':t.a===2?'end':'start','dominant-baseline':cb?'central':t.a===4?'central':t.b===1?'text-after-edge':t.b===2?'central':t.b===3?'text-before-edge':'alphabetic'},gt);
  if(t.r)e.setAttribute('transform',`rotate(${-t.r} ${t.x} ${-t.y})`);e.style.fontFamily="Consolas,'Cascadia Mono',monospace";e.textContent=t.t;TXE.set(t,e)});L.txe=TXE;
 /* live overlay: every net as one path */
 const go_=el('g',{fill:'none','stroke-linecap':'round','pointer-events':'none'},svg);
 const BR=(()=>{const T=[];for(const k of['edge','gl'])for(const q of S[k]||[])T.push(q);for(const g of S.gate||[])if(g.bar)T.push(g.bar);for(const q of S.seg)T.push(q);
 const cp=(px,py,a,b,c,e)=>{const dx=c-a,dy=e-b,l=dx*dx+dy*dy;let t=l?((px-a)*dx+(py-b)*dy)/l:0;t=Math.max(0,Math.min(1,t));return[a+t*dx,b+t*dy]};
 return(px,py,self)=>{let bd=1e9,bp=null;for(const o of T){if(o===self)continue;const q=cp(px,py,o.x1,o.y1,o.x2,o.y2),dd=Math.hypot(q[0]-px,q[1]-py);if(dd<bd){bd=dd;bp=q}}
  for(const c of R.ci){const r=Math.hypot(px-c.x,py-c.y),dd=Math.abs(r-c.r);if(r>0&&dd<bd){bd=dd;bp=[c.x+(px-c.x)/r*c.r,c.y+(py-c.y)/r*c.r]}}
  return bd>.4&&bd<=3.5?bp:null}})();
 const CORE=(()=>{try{const c=getComputedStyle($('cv')).backgroundColor;return c&&c!=='rgba(0, 0, 0, 0)'?c:'#0b1013'}catch(e){return '#0b1013'}})();L.core=[];
 S.nets.forEach(n=>{if(!n.segs.length)return;let d=n.segs.map(i=>{const s=S.seg[i];return `M${s.x1} ${-s.y1}L${s.x2} ${-s.y2}`}).join('');for(const a of n.arrows){let bd=1e9,bp=null;for(const i of n.segs){const s=S.seg[i];for(const[x,y]of[[s.x1,s.y1],[s.x2,s.y2]]){const q=Math.hypot(x-a.x,y-a.y);if(q<bd){bd=q;bp=[x,y]}}}if(bp&&bd>.15&&bd<9)d+=`M${bp[0]} ${-bp[1]}L${a.x} ${-a.y}`}
 const cnt={};for(const i of n.segs){const q=S.seg[i];for(const[x,y]of[[q.x1,q.y1],[q.x2,q.y2]]){const k=x.toFixed(1)+','+y.toFixed(1);cnt[k]=(cnt[k]||0)+1}}
 for(const i of n.segs){const q=S.seg[i];if(Math.hypot(q.x2-q.x1,q.y2-q.y1)<4)continue;for(const[x,y]of[[q.x1,q.y1],[q.x2,q.y2]]){if(cnt[x.toFixed(1)+','+y.toFixed(1)]>1)continue;const t=BR(x,y,q);if(t)d+=`M${x} ${-y}L${t[0]} ${-t[1]}`}}L.nets[n.id]=el('path',{d,stroke:'none','stroke-width':.55},go_);L.core[n.id]=el('path',{d,stroke:CORE,'stroke-width':.3},go_)});
 L.dots=[];{const dsd=(px,py,a,b,c,e)=>{const dx=c-a,dy=e-b,l=dx*dx+dy*dy;let t=l?((px-a)*dx+(py-b)*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(a+t*dx),py-(b+t*dy))};for(const[d,e]of DT){let bn=-1,bd=1.6;for(const n of S.nets)for(const i of n.segs){const q=S.seg[i],k=dsd(d.x,d.y,q.x1,q.y1,q.x2,q.y2);if(k<bd){bd=k;bn=n.id}}if(bn>=0){L.dots.push({e,n:bn,c:null});e.setAttribute('fill','#34404a')}}}
 const gleg=el('g',{fill:'none','stroke-linecap':'round','pointer-events':'none'},svg);L.legs=[];
 {const TP=.7,ends=s=>[[s.x1,s.y1],[s.x2,s.y2]];
  for(const b of S.blk){const hl=(b.k==='HS'||b.k==='LS')&&b.i.length>1&&new Set(b.i).size===b.i.length;if(!hl&&(!(b.k==='SW'||b.k==='AMT')||b.a<0||b.b<0||b.a===b.b))continue;
   for(const side of(hl?b.i.map((_,k)=>'h'+k):['a','b'])){const n=hl?b.i[+side.slice(1)]:b[side],net=S.nets[n],pin=b.pins.find(p=>p.n===n&&p.role==='in')||b.pins.find(p=>p.n===n);if(!pin||!net)continue;
    let cur=[pin.x,pin.y];const used=new Set(),segs=[];
    for(let st=0;st<14;st++){let bi=-1,bd=1e9;for(const i of net.segs){if(used.has(i))continue;const s=S.seg[i];const d=Math.min(anD(s.x1,s.y1,cur[0],cur[1]),anD(s.x2,s.y2,cur[0],cur[1]));if(d<=(st===0?8:TP)&&d<bd){bd=d;bi=i}}
     if(bi<0)break;used.add(bi);const s=S.seg[bi];segs.push(s);
     const far=anD(s.x1,s.y1,cur[0],cur[1])<=anD(s.x2,s.y2,cur[0],cur[1])?[s.x2,s.y2]:[s.x1,s.y1];
     const others=net.segs.filter(i=>!used.has(i)&&(ends(S.seg[i]).some(([x,y])=>anD(x,y,far[0],far[1])<=TP)||anPtSeg(far[0],far[1],S.seg[i])<=.45));
     if(others.length!==1)break;cur=far}
    if(!segs.length)continue;
    const e=el('path',{d:segs.map(s=>'M'+s.x1+' '+-s.y1+'L'+s.x2+' '+-s.y2).join(''),stroke:'#3b4651','stroke-width':.8},gleg);e.style.display='none';
    const arw=((L.arw&&L.arw[n])||[]).filter((q,k)=>net.arrows[k]&&anD(net.arrows[k].x,net.arrows[k].y,pin.x,pin.y)<=3.6);
    L.legs.push({b,side,n,e,arw,on:null})}}}
 const gcj=el('g',{fill:'none','stroke-linecap':'round','pointer-events':'none'},svg);S.conn.concat(S.xc||[]).forEach(c=>el('circle',{cx:c.x,cy:-c.y,r:c.r,class:'cj'},gcj));
 L.fo=[];S.blk.forEach(b=>{if(b.k==='FOUT')L.fo.push({b,e:el('path',{d:'M'+b.flag.map(q=>q[0]+' '+-q[1]).join('L')+'Z',fill:'none','fill-opacity':.45,stroke:'none'},gcj)})});
 const BGc=(()=>{try{const c=getComputedStyle($('cv')).backgroundColor;return c&&c!=='rgba(0, 0, 0, 0)'?c:'#0b1013'}catch(e){return '#0b1013'}})();
 const gfg=el('g',{'stroke-width':.6,'stroke-linecap':'round','stroke-linejoin':'round','pointer-events':'none'},svg);
 {const small=pts=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const q of pts){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}return x1-x0<130&&y1-y0<130&&x1-x0>.5};
  const poly=(pts,c)=>{let sx=0,sy=0;for(const q of pts){sx+=q[0];sy+=q[1]}const col=symC(sx/pts.length,sy/pts.length);return el('path',{d:'M'+pts.map(q=>q[0]+' '+-q[1]).join('L')+'Z',fill:anMix(col,BGc),stroke:col},gfg)};
  R.pl.forEach(q=>{if(small(q.p))poly(q.p,q.c)});S.shp.forEach(q=>{if(q.p&&small(q.p))poly(q.p,q.c)});
  R.ci.forEach(c=>{const col=symC(c.x,c.y);el('circle',{cx:c.x,cy:-c.y,r:c.r,fill:anMix(col,BGc),stroke:col},gfg)});
  const ln=q=>el('path',{d:`M${q.x1} ${-q.y1}L${q.x2} ${-q.y2}`,stroke:q.hatch?'var(--pnc,#5cc8ff)':symC((q.x1+q.x2)/2,(q.y1+q.y2)/2)},gfg);
  (S.edge||[]).forEach(ln);(S.gl||[]).forEach(ln);(S.gate||[]).forEach(g=>{(g.used||[]).forEach(ln);if(g.bar)ln(g.bar)});
  R.ar.forEach(a=>{const t=v=>v*Math.PI/180,x1=a.x+a.r*Math.cos(t(a.a0)),y1=a.y+a.r*Math.sin(t(a.a0)),x2=a.x+a.r*Math.cos(t(a.a1)),y2=a.y+a.r*Math.sin(t(a.a1)),sw=((a.a1-a.a0)%360+360)%360;el('path',{d:`M${x1} ${-y1}A${a.r} ${a.r} 0 ${sw>180?1:0} 0 ${x2} ${-y2}`,fill:'none',stroke:symC(a.x,a.y)},gfg)})}
 L.selg=el('g',{'pointer-events':'none'},svg);
 /* value badges */
 const th=R.tx.map(t=>t.h).sort((a,b)=>a-b),bs=Math.max(1.8,Math.min(3.2,(th[th.length>>1]||3)*.8))*(+AN.ws.vs||1);svg.style.setProperty('--bs',bs+'px');
 const gb=el('g',{},svg);L.gb=gb;L.bs=bs;
 /* symbols of the legend (ABC-000) that the drawing reader leaves blank or wrong: DEVIATION = triangle in the box (80 of 92 boxes were empty), DIVISION = bar with a dot above and below (was only a bar), SUBTRACTION = bar (2 empty) */
 {const hasInk=b=>S.seg.some(q=>{const mx=(q.x1+q.x2)/2,my=(q.y1+q.y2)/2;return mx>b.x0+.6&&mx<b.x1-.6&&my>b.y0+.6&&my<b.y1-.6})||(S.shp||[]).some(q=>q!==b.sh&&q.cx>b.x0+.6&&q.cx<b.x1-.6&&q.cy>b.y0+.6&&q.cy<b.y1-.6)||S.tx.some(t=>t.x>=b.x0&&t.x<=b.x1&&t.y>=b.y0-1&&t.y<=b.y1+1);
  for(const b of S.blk){if(b.x0==null||!(b.k==='DEV'||b.k==='DIV'||b.k==='SUB'))continue;const cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,u=Math.min(b.x1-b.x0,b.y1-b.y0),col=(typeof AN_KC!=='undefined'&&AN_KC[b.k])||'#4da3ff',A={fill:'none',stroke:col,'stroke-width':Math.max(.5,u*.08),'stroke-linejoin':'round','stroke-linecap':'round','pointer-events':'none'};
   if(b.k==='DEV'){const t=(S.shp||[]).find(q=>q.ty==='tri'&&q.w>u*.35&&q.w<u*.95&&q.cx>b.x0&&q.cx<b.x1&&q.cy>b.y0&&q.cy<b.y1),tw=t?t.w/2:u*.24,th=t?t.h/2:u*.24,tx=t?t.cx:cx,ty=t?t.cy:cy;el('path',{d:'M'+(tx-tw)+' '+-(ty-th)+'L'+(tx+tw)+' '+-(ty-th)+'L'+tx+' '+-(ty+th)+'Z',...A},gp)}
   else if(b.k==='SUB')el('path',{d:'M'+(cx-u*.25)+' '+-cy+'L'+(cx+u*.25)+' '+-cy,...A},gp);
   else if(b.k==='DIV'){for(const dy of[-.24,.24])el('circle',{cx:cx,cy:-(cy+u*dy),r:Math.max(.35,u*.07),fill:col,stroke:'none','pointer-events':'none'},gp)}}}
 L.ov=[];{const mkp=pts=>'M'+pts.map(q=>q[0]+' '+-q[1]).join('L')+'Z',inp=b=>{const p=(b.k==='AO'&&b.pins.find(q=>q.role==='out'))||b.pins.find(q=>q.role==='in');return p?p.n:-1};
  S.blk.forEach(b=>{
   if(b.k==='VLV'&&b.pins.length){const e=el('path',{d:b.v.tri.map(t=>'M'+t.map(q=>q[0]+' '+-q[1]).join('L')+'Z').join(''),fill:'#fff','fill-opacity':0,stroke:'#f1f6f9','stroke-width':.8,'stroke-linejoin':'round','pointer-events':'none'},gb),t=el('text',{x:b.x1+1.2,y:-b.cy+bs*.35,class:'bd','text-anchor':'start'},gb);L.ov.push({b,k:'VLV',e,t,last:null})}
   else if(b.k==='ACH'){const r=b.hd.r,e=el('path',{d:'M'+(b.hd.x-r)+' '+-b.hd.y+'A'+r+' '+r+' 0 0 '+(b.hd.up?1:0)+' '+(b.hd.x+r)+' '+-b.hd.y+'Z',fill:'none','stroke-width':.9,'stroke-linejoin':'round','stroke-linecap':'round','pointer-events':'none'},gp),t=el('text',{},gb);L.ov.push({b,k:'ACH',e,t,last:null})}
   else if(b.k==='COS'&&b.used&&b.sh&&b.sh.p){const e=el('path',{d:mkp(b.sh.p),fill:'none','stroke-width':.9,'stroke-linejoin':'round','pointer-events':'none'},gp),t=el('text',{},gb);L.ov.push({b,k:'COS',e,t,last:null})}
   else if(['TON','TOF','TPS','TPV'].includes(b.k)){const w=b.x1-b.x0,tk=el('rect',{x:b.x0,y:-b.y0+.5,width:w,height:.9,fill:'#1a2229','pointer-events':'none',visibility:'hidden'},gb),fl=el('rect',{x:b.x0,y:-b.y0+.5,width:0,height:.9,fill:'#b48cff','pointer-events':'none',visibility:'hidden'},gb),t=el('text',{x:b.cx,y:-b.y0+1.4+bs*1.05,class:'bd','text-anchor':'middle'},gb);t.style.fill=ENG?'#cfc6e6':'#d8c4ff';L.ov.push({b,k:'TMR',tk,fl,t,w,last:null})}
   else if((b.k==='AO'||b.k==='ACT'||b.k==='PO')&&b.sh&&b.sh.p){const e=el('path',{d:mkp(b.sh.p),fill:'none','pointer-events':'none'},gb),t=el('text',{x:b.cx,y:-b.y0+bs*1.1,class:'bd','text-anchor':'middle'},gb);L.ov.push({b,k:b.k,e,t,n:inp(b),last:null})}
   else if(b.k==='ALM'){const e=el('rect',{x:b.x0,y:-b.y1,width:b.x1-b.x0,height:b.y1-b.y0,fill:'none','pointer-events':'none'},gb),t=el('text',{x:(b.x0+b.x1)/2,y:-b.y0+bs*1.1,class:'bd','text-anchor':'middle'},gb);L.ov.push({b,k:'ALM',e,t,n:inp(b),last:null})}
   else if(b.k==='AMT'||b.k==='SW'){const t=el('text',{x:b.x1+.8,y:-b.y0-bs*.2,class:'bd'},gb);t.style.fill='#c9d1d9';const pa=b.pins.find(p=>p.n===b.a),pb=b.pins.find(p=>p.n===b.b),le=p=>p&&p.lt&&TXE.get(p.lt)||null;L.ov.push({b,k:'SW',t,ea:le(pa),eb:le(pb),ba:pa&&pa.lt?tcol(pa.lt):null,bb:pb&&pb.lt?tcol(pb.lt):null,last:null})}})}
 const placed=new Set();
 const TB=R.tx.map(t=>{const w=t.t.length*t.h*.6,hh=t.h;let x0=(t.a===1||t.a===4)?t.x-w/2:t.a===2?t.x-w:t.x,y0=(t.a===4||t.b===2)?t.y-hh/2:t.b===3?t.y-hh:t.y-hh*.2,W=w,H=hh*1.1;if(t.r&&Math.abs(Math.sin(t.r*Math.PI/180))>.7){x0=t.x-hh*.6;y0=t.r>0?t.y:t.y-w;W=hh*1.1;H=w}return[x0-.3,y0-.3,x0+W+.3,y0+H+.3]});
 const BB=S.blk.map(b=>[b.x0-1,b.y0-1,b.x1+1,b.y1+1]),PB=[];
 const ovl=(a,b)=>{const w=Math.min(a[2],b[2])-Math.max(a[0],b[0]),h=Math.min(a[3],b[3])-Math.max(a[1],b[1]);return w>.15&&h>.15?w*h:0};
 const WB=S.seg.map(s=>[Math.min(s.x1,s.x2)-.3,Math.min(s.y1,s.y2)-.3,Math.max(s.x1,s.x2)+.3,Math.max(s.y1,s.y2)+.3]);
 const sc0=(bx,tb,bb,wb,pb)=>{let s=0;for(const t of tb)s+=ovl(bx,t)*30;for(const q of bb)s+=ovl(bx,q)*20;for(const q of pb)s+=ovl(bx,q)*40;for(const q of wb)s+=ovl(bx,q)*8;return s};
 const place=(ax,ay,chars,below,nopush)=>{const w=chars*bs*.62,h=bs*.95,R2=26,nr=A=>A.filter(q=>q[2]>ax-R2&&q[0]<ax+R2&&q[3]>ay-R2&&q[1]<ay+R2),tb=nr(TB),bb=nr(BB),wb=nr(WB),pb=nr(PB);let best=null;const dirs=below?[[0,-1],[1,-1],[-1,-1],[0,1],[1,1],[-1,1],[1,0],[-1,0]]:[[1,1],[1,-1],[-1,1],[-1,-1],[0,1],[0,-1],[1,0],[-1,0]];
  for(const r of [1.4,2.4,3.6,5.2,7.5,10]){for(const[hx,hy]of dirs){const x0=hx>0?ax+r:hx<0?ax-r-w:ax-w/2,y0=hy>0?ay+r*.4:hy<0?ay-r*.4-h:ay-h/2,bx=[x0,y0,x0+w,y0+h],ov=sc0(bx,tb,bb,wb,pb),sc=ov+r*.5;if(!best||sc<best.sc)best={sc,ov,x:x0,y:y0,bx}}
   if(best&&best.ov<.01)break}
  if(!nopush)PB.push(best.bx);return best};
 /* no address text: walk along the 3 longest wire pieces of the net and sit just above / below (or beside a vertical one), clear of everything else */
 const placeAny=(n,chars)=>{const w=chars*bs*.62,h=bs*.95,own=new Set(S.nets[n].segs),ss=S.nets[n].segs.map(i=>S.seg[i]).map(s=>({s,L:Math.hypot(s.x2-s.x1,s.y2-s.y1)})).sort((u,v)=>v.L-u.L).slice(0,3);let best=null;
  for(const{s}of ss){const hz=Math.abs(s.y1-s.y2)<.06,vz=Math.abs(s.x1-s.x2)<.06;for(const t of[.5,.3,.7]){const x=s.x1+(s.x2-s.x1)*t,y=s.y1+(s.y2-s.y1)*t,R2=26,nr=A=>A.filter(q=>q[2]>x-R2&&q[0]<x+R2&&q[3]>y-R2&&q[1]<y+R2),tb=nr(TB),bb=nr(BB),pb=nr(PB),wb=WB.filter((q,i)=>!(own.has(i)&&(hz||vz))&&q[2]>x-R2&&q[0]<x+R2&&q[3]>y-R2&&q[1]<y+R2);
    const c=hz?[[x-w/2,y+.5],[x-w/2,y-.5-h]]:vz?[[x+.7,y-h/2],[x-.7-w,y-h/2]]:[[x+.7,y+.5],[x+.7,y-.5-h],[x-.7-w,y+.5],[x-.7-w,y-.5-h]];
    for(const[x0,y0]of c){const bx=[x0,y0,x0+w,y0+h],ov=sc0(bx,tb,bb,wb,pb),sc=ov+Math.abs(t-.5)*2;if(!best||sc<best.sc)best={sc,ov,x:x0,y:y0,bx}}}}
  return best};
 const PASS=['IP','AO','PO','TP','FIELD','VLV','ACT','ALM'],skipB=n=>{const D=S.drv[n]||[],C=S.cns[n]||[];return(D.length&&D.every(d=>PASS.includes(d.k)))||(C.length&&C.every(q=>PASS.includes(q.k)))};
 const addB=(n,ax,ay,below)=>{if(placed.has(n))return;const sk=skipB(n);placed.add(n);let q=place(ax,ay,6,below,true);if(q.ov>.01){const r=placeAny(n,6);if(r&&r.ov<q.ov-.01)q=r}PB.push(q.bx);const t=el('text',{x:q.x,y:-(q.y+bs*.2),class:'bd'+(S.nets[n].dig?' dg':''),'text-anchor':'start'},gb);t.dataset.n=n;if(sk)t.style.display='none';L.bd.push({n,t,last:null,skip:sk,wire:!S.lab[n],pin:[ax,ay]})};
 L.have=placed;L.mkBadge=n=>{if(placed.has(n)||!S.nets[n].segs.length)return;placed.add(n);const s=S.seg[S.nets[n].segs[0]],t=el('text',{x:(s.x1+s.x2)/2+1.2,y:-((s.y1+s.y2)/2+1.2),class:'bd'+(S.nets[n].dig?' dg':''),'text-anchor':'start'},gb);t.style.display='none';L.bd.push({n,t,last:null,skip:true})};
 for(const o of L.ov){const b=o.b;o.t.dataset.eq=o.k;let ch,ax,ay;if(o.k==='TMR'){ch=10;ax=b.cx;ay=b.y0-1.6}else if(o.k==='VLV'){ch=5;ax=b.x1;ay=b.cy}else if(o.k==='SW'){ch=5;ax=b.x1;ay=b.y0}else continue;
   const q=place(ax,ay,ch);o.t.setAttribute('x',q.x);o.t.setAttribute('y',-(q.y+bs*.2));o.t.setAttribute('text-anchor','start')}
 S.lab.forEach((l,n)=>{if(l&&!S.nets[n].dig)addB(n,l.x+l.t.length*(l.h||3)*.3,l.y-.3,true)});
 S.blk.forEach(b=>{if(['AI','AO','ACT','NOT','AND','OR','FF','TON','TOF','TPS','TPV','HC','LC','HLC','CMPK','PVSV','DCMP','SIGAB'].includes(b.k))return;b.pins.filter(p=>p.role==='out').forEach(p=>{if(!S.nets[p.n].dig)addB(p.n,p.x,p.y)})});
 S.blk.forEach(b=>{if(b.k==='AI'){b.pins.filter(p=>p.role==='out').forEach(p=>addB(p.n,p.x,p.y))}});
 S.ext.forEach(n=>{if(!S.nets[n].dig&&!placed.has(n)){const s=S.seg[S.nets[n].segs[0]];if(s)addB(n,s.x1,s.y1)}});
 for(const c of(S.conn||[]).concat(S.xc||[])){const n=c.nets&&(c.nets.find(k=>(S.drv[k]||[]).some(d=>d.k!=='LINK'))??c.nets.find(k=>S.ext.includes(k))??c.nets.find(k=>(S.cns[k]||[]).length)??c.nets[0]);if(n==null||!S.nets[n]||S.nets[n].dig||S.lab[n])continue;/* a circle has a stub wire and the signal wire: the value is the signal wire */const tt=S.tx.filter(t=>TAGRE.test(t.t.trim())&&Math.hypot(t.x-c.x,t.y-c.y)<c.r+14).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0];if(!tt)continue;
  const w=tt.t.trim().length*(tt.h||3)*.62,t=el('text',{x:tt.x+w+1.5,y:-(tt.y+bs*.2),class:'bd','text-anchor':'start'},gb);t.dataset.n=n;L.bd.push({n,t,last:null,skip:false,wire:false,circ:true,anc:tt})}
 {/* ONE live value per analog address text, read from the ADDRESS TABLE S.addr (built once by anAddr, the same table the engine uses). A text that the table could not tie without guessing has NO value (it is listed in S.addrUn / L.addrUn for the engineer). An old badge near the text is ADOPTED, the others are hidden (they are "wire values"). */
  const bx=q=>+q.t.getAttribute('x'),by=q=>-+q.t.getAttribute('y'),oldB=L.bd.filter(q=>!q.addr),used=new Set();
  const rp=L.addrRep=[],un=L.addrUn=[];let nUn=0;
  for(const u of S.addrUn||[]){nUn++;un.push(u.t+'@'+Math.round(u.x)+','+Math.round(u.y))}
  const an_=L.addrN=new Set();
  const prefer=n=>(S.drv[n]||[]).some(d=>d.k!=='LINK')?3:S.ext.includes(n)?2:(S.cns[n]||[]).length?1:0,AD0=S.addr||[],cnt={};AD0.forEach(a=>{cnt[a.n]=(cnt[a.n]||0)+1});
  const AD=AD0.filter((a,i)=>{
   if(/^circle tag/.test(a.how)){const g=AD0.filter(q=>q.t===a.t&&q.x===a.x&&q.y===a.y&&/^circle tag/.test(q.how));if(g.length>1){let best=g[0];for(const q of g)if(prefer(q.n)>prefer(best.n))best=q;if(best!==a)return false}}
   if(/^controller tag/.test(a.how)&&!/\.(MV|SV|PV|OUT)$/i.test(String(a.t).trim())&&AD0.some(q=>q!==a&&q.n===a.n))return false;
   const rk=q=>/^[A-Z]{2}d{4}$/.test(String(q.t).trim())?0:/.(MV|SV|PV)$/i.test(String(q.t).trim())?1:2;
   /* the same text twice on a net, or two labels of one net closer than 22 units: ONE number (the module address first) */
   return !AD0.some((q,j)=>q.n===a.n&&j!==i&&(q.t===a.t?(j<i&&Math.hypot(q.x-a.x,q.y-a.y)<25):Math.hypot(q.x1-a.x1,q.y-a.y)<22&&(rk(q)<rk(a)||(rk(q)===rk(a)&&j<i))))});
  for(const a of AD){const n=a.n,s=a.t;if(!S.nets[n]||(S.nets[n].dig&&a.ai==null))continue;if(/tag -> AI block/.test(a.how)||S.blk.some(q=>q.k==='ALM'&&a.x>=q.x0-.5&&a.x<=q.x1+.5&&a.y>=q.y0-.5&&a.y<=q.y1+.5))continue;an_.add(n);if(a.eng!=null)an_.add(a.eng);if(/^circle tag/.test(a.how))for(const c of(S.conn||[]).concat(S.xc||[]))if(c.nets&&Math.hypot(c.x-a.x,c.y-a.y)<c.r+14)c.nets.forEach(k=>{if(S.nets[k]&&!S.nets[k].dig)an_.add(k)});
   const ex=a.x1+1.5;let ad=oldB.filter(q=>q.n===n&&!used.has(q)&&Math.abs(by(q)-a.y)<7&&Math.abs(bx(q)-ex)<40).sort((p,c)=>Math.hypot(bx(p)-ex,by(p)-a.y)-Math.hypot(bx(c)-ex,by(c)-a.y))[0];
   if(ad){if(a.ai!=null)ad.ai=a.ai;ad.t.dataset.how=a.how;used.add(ad);ad.wire=false;ad.skip=false;ad.addr=true;ad.t.style.display='';rp.push({t:s,n,b:ad,x:a.x,y:a.y,how:a.how});continue}
   const e=el('text',{x:ex,y:-(a.y+bs*.2),class:'bd','text-anchor':'start'},gb);e.dataset.n=n;e.dataset.how=a.how;const nb={n,t:e,last:null,skip:false,wire:false,addr:true,ai:a.ai!=null?a.ai:null};L.bd.push(nb);rp.push({t:s,n,b:nb,x:a.x,y:a.y,how:a.how})}
  for(const q of oldB)if(!used.has(q)&&!q.circ){q.wire=true}
  for(const q of oldB)if(q.circ&&!q.addr&&an_.has(q.n)){q.skip=true;q.t.style.display='none'}
  /* one number per signal chain: AO / IP / field / LINK pass the same value on, so when two numbers of the same chain stand close together (less than 120 units) only the one nearest to the source is shown (the others return when the signal is forced) */
  {const PASS=['AO','IP','FIELD','PO','TP','LINK'],par=new Map(),fnd=x=>{while(par.get(x)!==x)x=par.get(x);return x},ad=x=>{if(!par.has(x))par.set(x,x)};
   for(const a of S.blk)if(PASS.includes(a.k)&&a.i&&a.o&&!(a.k==='LINK'&&a.gain!=null&&a.gain!==1))for(const i of a.i)for(const o of a.o)if(i>=0&&o>=0){ad(i);ad(o);const A=fnd(i),B=fnd(o);if(A!==B)par.set(A,B)}
   const depth=n=>{let d=0,x=n,g=0;while(g++<8){const dr=(S.drv[x]||[]).find(q=>PASS.includes(q.k)&&q.i&&q.i[0]!=null);if(!dr)break;x=dr.i[0];d++}return d};
   const cls={};for(const q of L.bd){if(q.skip||q.t.style.display==='none'||!par.has(q.n))continue;const k=fnd(q.n);(cls[k]=cls[k]||[]).push(q)}
   const pos=q=>[+q.t.getAttribute('x'),+q.t.getAttribute('y')],rank=q=>(q.addr?0:1)*100+depth(q.n);
   for(const k in cls){const g=cls[k];g.forEach((q,i)=>{q._rk=rank(q);q._ix=i});const hide=[];for(const q of g){for(const p of g){if(p===q||p.n===q.n)continue;if(p._rk<q._rk||(p._rk===q._rk&&p._ix<q._ix)){const a=pos(p),c=pos(q);if(Math.hypot(a[0]-c[0],a[1]-c[1])<120){hide.push(q);break}}}}for(const q of hide){q.skip=true;q.t.style.display='none'}}}
  L.nUn=nUn}
 const gx=el('g',{class:'xref'},svg);{const RX=/(ABC-\d{3}[A-Z]?)|DITL[ -]?(\d{1,2}[A-H]?)-\d{1,3}/g;let nx=0;
  for(const t of S.tx){const str=String(t.t),w=(t.h||3)*.62,h=(t.h||3);let m;RX.lastIndex=0;
   while((m=RX.exec(str))){const ab=m[1],dp=m[2],tok=m[0];let tgt=null;
    if(ab){if(ab===sh.name)continue;if(AN.sheets.some(z=>z.name===ab))tgt={a:ab}}
    else if(dp){const pg='DITL-'+(/^\d[A-H]?$/.test(dp)?'0'+dp:dp);tgt={d:pg}}
    if(!tgt)continue;nx++;const x0=t.x+m.index*w,r=el('rect',{x:x0-.4,y:-(t.y+h*.75),width:tok.length*w+.8,height:h*1.3,fill:'transparent',stroke:'none',style:'cursor:pointer'},gx),u=el('line',{x1:x0,x2:x0+tok.length*w,y1:-(t.y-h*.15),y2:-(t.y-h*.15),stroke:'#5aa9ff','stroke-width':.25,'stroke-dasharray':'1 .8',opacity:.8,'pointer-events':'none'},gx);
    const ti=el('title',{},r);ti.textContent='Go to '+(tgt.a||tgt.d);r._xr=tgt;
    r.addEventListener('mouseenter',()=>u.setAttribute('opacity',1));r.addEventListener('mouseleave',()=>u.setAttribute('opacity',.8))}}
  /* the sheet keeps the pointer captured (pan), so the click is read at document level: a press and release within 5 px on a link area */
  if(!AN._xr){AN._xr=1;let d0=null;document.addEventListener('pointerdown',e=>{d0=e.target&&e.target._xr?[e.clientX,e.clientY]:null},true);document.addEventListener('pointerup',e=>{if(!d0||Math.hypot(e.clientX-d0[0],e.clientY-d0[1])>5)return;d0=null;const t=document.elementFromPoint(e.clientX,e.clientY);if(t&&t._xr){e.stopPropagation();AN.xrefGo(t._xr)}},true)}
  L.nXref=nx}
 /* rules 7 / 8: an analog wire that has no number yet (driven by a bare connector / junction, so no block output pin gave it one) gets one */
 for(let n=0;n<S.nets.length;n++){const nt=S.nets[n];if(!nt||nt.dig||!nt.segs||!nt.segs.length||placed.has(n))continue;const D=S.drv[n]||[],C=S.cns[n]||[];if(!D.length&&!C.length)continue;if((L.addrN&&L.addrN.has(n))||skipB(n))continue;const s0=S.seg[nt.segs[0]];if(!s0)continue;placed.add(n);const t=el('text',{x:s0.x1,y:-s0.y1,class:'bd'},gb);t.dataset.n=n;L.bd.push({n,t,last:null,skip:false,wire:true,pin:[s0.x1,s0.y1]})}
 svg.append(g0,go_,gleg,gd,gfg,gf,gp,gt,gcj,L.selg,gb,gx);try{vplace(R,S,L,bs)}catch(e){console.error('vplace',e)}
 const av=AN.av[sh.name];if(av)svg.setAttribute('viewBox',av.join(' '));else fitView()}
