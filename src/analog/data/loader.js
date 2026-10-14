/* ---------- data (built-in sheets, lazy) ---------- */
/* descriptions: station -> address -> record (IO list rows: tag, description, range, unit, type, SIG.AB address; memory lists: description, remark, timer type / seconds) */
let ADES=null;
async function adesLoad(){if(ADES)return ADES;const e=document.getElementById('ades');if(!e||!e.textContent.trim()){ADES={};return ADES}try{const bin=Uint8Array.from(atob(e.textContent.trim()),c=>c.charCodeAt(0));ADES=JSON.parse(await gunz(bin))}catch(x){ADES={}}return ADES}
function shStn(sh){if(sh.stn===undefined&&sh.S)sh.stn=stnOf(sh.S);return sh.stn}
function adesFind(sh,text){if(!ADES||!text)return null;const t=String(text).trim();let m=/^(?:S(\d)\s*)?([A-Z]{1,2})\.([0-9A-F]{3,4})$/i.exec(t),pre,num,dot='.';
 if(m){pre=m[2].toUpperCase();num=m[3].toUpperCase().padStart(4,'0')}else{m=/^(?:S(\d)\s*)?(TR|SI|SO|AI|AO|DI|DO|FP|PTN)(\d{1,6})$/i.exec(t);if(!m)return null;pre=m[2].toUpperCase();dot='';num=pre==='PTN'?m[3].padStart(6,'0'):m[3].padStart(4,'0')}
 const stn=m[1]?+m[1]:(sh?shStn(sh):null),T=ADES[String(stn)],key=pre+dot+num,r=T&&T[key];return r?{rec:r,stn,key}:null}
function adesText(r){if(!r)return'';return r.k==='io'?[r.tag,r.d].filter(Boolean).join(' · '):[r.d,r.r].filter(Boolean).join(' · ')}
function adesLines(a){const r=a.rec,o=[];if(r.k==='io'){o.push((r.tag||'')+'   ['+a.key+(a.stn?' · STN10'+a.stn:'')+']');if(r.d)o.push(r.d);const x=[r.t,(r.lo!=null||r.hi!=null)?(r.lo+' ~ '+r.hi+' '+(r.u||'')):'',r.ab?'signal abnormal '+r.ab:''].filter(Boolean).join('  ·  ');if(x)o.push(x)}
 else{o.push(a.key+'   [STN10'+a.stn+']');if(r.d)o.push(r.d);const x=[r.t?('timer '+r.t+(r.v!=null?' '+r.v+' s':'')):'',r.r].filter(Boolean).join('  ·  ');if(x)o.push(x)}return o}
let CARD=null;
function tagCard(){if(!CARD){CARD=h$('div',{id:'antag',style:'position:absolute;left:10px;top:10px;max-width:440px;background:#0f1a22ee;border:1px solid #2b4a5a;border-left:4px solid #ffe14a;padding:6px 10px;font:12px sans-serif;color:#e7eef3;display:none;z-index:6;pointer-events:none;line-height:1.45'});const c=$('cv');if(c){if(!/relative|absolute|fixed/.test(getComputedStyle(c).position))c.style.position='relative';c.append(CARD)}}return CARD}
{const sv_=$('svg');let hc=null;const HC=()=>{if(!hc){hc=h$('div',{id:'anhov',style:'position:absolute;max-width:420px;background:#0f1a22f5;border:1px solid #2b4a5a;border-left:4px solid #5cc8ff;padding:5px 9px;font:12px sans-serif;color:#e7eef3;display:none;z-index:7;pointer-events:none;line-height:1.4'});const c=$('cv');if(c){if(!/relative|absolute|fixed/.test(getComputedStyle(c).position))c.style.position='relative';c.append(hc)}}return hc};
 sv_.addEventListener('mousemove',e=>{if(!live()||e.buttons)return;const sh=cs();if(!sh||!sh.S||!ADES)return;const[x,y]=xy(e);let f=null;for(const t of sh.S.tx){const s=t.t.trim();if(s.length<4||s.length>14)continue;const h=t.h||2.6;if(x>=t.x-.6&&x<=t.x+s.length*h*.62+.6&&y>=t.y-h*.3&&y<=t.y+h*1.15){const a=adesFind(sh,s);if(a){f=a;break}}}
  const c=HC();if(!c)return;if(!f){c.style.display='none';return}cardFill(c,f);const cr=$('cv').getBoundingClientRect();c.style.left=Math.max(4,Math.min(cr.width-330,e.clientX-cr.left+14))+'px';c.style.top=Math.max(4,Math.min(cr.height-80,e.clientY-cr.top+16))+'px';c.style.display='block'});
 sv_.addEventListener('mouseleave',()=>{if(hc)hc.style.display='none'})}
/* selected wire: its address text turns yellow (digital) / sky blue (analog) and the description is shown on the drawing */
function cardFill(c,a){c.innerHTML='';adesLines(a).forEach((x,i)=>{const d=document.createElement('div');d.textContent=x;if(i===0)d.style.fontWeight='700';c.append(d)})}
function tagHi(){const sh=cs(),S=sh&&sh.S,n=S&&AN.sel&&AN.sel.net!=null?AN.sel.net:null,key=n==null?(S&&AN.sel&&AN.sel.blk?sh.name+'b'+AN.sel.blk.id:''):sh.name+'#'+n;if(tagHi.k===key)return;tagHi.k=key;
 (tagHi.prev||[]).forEach(([e,f,w])=>{e.setAttribute('fill',f);if(w==null)e.removeAttribute('font-weight');else e.setAttribute('font-weight',w)});tagHi.prev=[];const c=tagCard();c.style.display='none';
 if(n==null&&S&&AN.sel&&AN.sel.blk&&L&&L.txe){const b=AN.sel.blk;let hit=null;for(const[t,e]of L.txe){if(t.x>=b.x0-14&&t.x<=b.x1+14&&t.y>=b.y0-14&&t.y<=b.y1+14){const a=adesFind(sh,t.t.trim());if(a){hit={e,a};break}}}
  if(hit){c.style.borderLeftColor='#ffe14a';tagHi.prev.push([hit.e,hit.e.getAttribute('fill'),hit.e.getAttribute('font-weight')]);hit.e.setAttribute('fill','#ffe14a');hit.e.setAttribute('font-weight','700');cardFill(c,hit.a);c.style.display='block'}return}
 if(n==null||!L||!L.txe)return;
 const l=S.lab[n]||((S.tagN||[]).filter(q=>q.n===n).sort((a,b)=>a.d-b.d)[0]&&{t:S.tagN.filter(q=>q.n===n).sort((a,b)=>a.d-b.d)[0].t});if(!l||!l.t)return;
 const col=S.nets[n].dig?'#ffe14a':'#5cc8ff';c.style.borderLeftColor=col;
 for(const[t,e]of L.txe)if(t.t.trim()===String(l.t).trim()&&(l.x==null||Math.hypot(t.x-l.x,t.y-l.y)<4)){tagHi.prev.push([e,e.getAttribute('fill'),e.getAttribute('font-weight')]);e.setAttribute('fill',col);e.setAttribute('font-weight','700')}
 const a=adesFind(sh,l.t);c.innerHTML='';if(a){adesLines(a).forEach((x,i)=>{const d=document.createElement('div');d.textContent=x;if(i===0){d.style.fontWeight='700';d.style.color=col}c.append(d)});c.style.display='block'}else{const d=document.createElement('div');d.textContent=l.t;d.style.fontWeight='700';d.style.color=col;c.append(d);const d2=document.createElement('div');d2.style.color='#9fb3c0';d2.textContent='no description in the IO / memory lists';c.append(d2);c.style.display='block'}}
async function loadData(){if(AN.data)return AN.data;
 AN.data=(async()=>{try{await AN.kv}catch(e){}try{await adesLoad()}catch(e){}AN.adesLoad=adesLoad;AN.adesFind=adesFind;AN.shStn=shStn;AN.tagHi=tagHi;if(document.readyState==='loading')await new Promise(r=>addEventListener('DOMContentLoaded',r,{once:true}));const e0=document.getElementById('apre');let rows=[];
  if(e0&&e0.textContent.trim()){const bin=Uint8Array.from(atob(e0.textContent.trim()),c=>c.charCodeAt(0));
   const txt=await gunz(bin);rows=txt.split('\n').filter(Boolean).map(l=>JSON.parse(l))}
  const keep=AN.sheets.filter(s=>s.imp);AN.sheets=rows.concat(keep);try{await impRestore()}catch(x){AN.impErr=String(x&&x.message||x)}return AN.sheets})();return AN.data}
/* ---- P7: persistent DXF import + drawing-change report ---- */
const impBuild=(R,name)=>anWire(anModel(anNets(anBuild(R,name))));
function impSnap(R,name){const S=impBuild(R,name),kinds={},blk=[],tx=[];
 for(const b of S.blk){kinds[b.k]=(kinds[b.k]||0)+1;blk.push({s:b.k,x:b.cx,y:b.cy})}
 for(const q of R.tx)tx.push({s:q.t,x:q.x,y:q.y});
 return{kinds,blk,tx,nets:S.nets.length,blocks:S.blk.length,conn:S.conn.length,circles:R.ci.length,segs:R.seg.length,texts:R.tx.length,warn:S.warn.length}}
/* items of P that have no partner in Q: same text / kind and a position within tol units (1:1 matching, nearest first) */
function impMiss(P,Q,tol){const g={};for(const q of Q)(g[q.s]=g[q.s]||[]).push({q,u:0});const out=[];
 for(const p of P){const c=g[p.s]||[];let bi=-1,bd=tol;c.forEach((e,i)=>{if(e.u)return;const d=Math.hypot(e.q.x-p.x,e.q.y-p.y);if(d<=bd){bd=d;bi=i}});if(bi>=0)c[bi].u=1;else out.push(p.s+'@'+Math.round(p.x)+','+Math.round(p.y))}
 return out}
function impDiff(oldR,newR,name){const A=impSnap(oldR,name),B=impSnap(newR,name),rows=[],add=(what,a,b)=>rows.push({what,a,b,d:b-a});
 for(const k of ['blocks','nets','conn','segs','circles','texts','warn'])add(k==='conn'?'connector circles':k==='warn'?'reader warnings':k,A[k],B[k]);
 const kinds=[...new Set(Object.keys(A.kinds).concat(Object.keys(B.kinds)))].sort().map(k=>({k,a:A.kinds[k]||0,b:B.kinds[k]||0})).filter(x=>x.a!==x.b);
 const bgone=impMiss(A.blk,B.blk,3),bnew=impMiss(B.blk,A.blk,3),tgone=impMiss(A.tx,B.tx,1.5),tnew=impMiss(B.tx,A.tx,1.5);
 return{name,rows,kinds,bgone,bnew,tgone,tnew,same:!rows.some(r=>r.d)&&!kinds.length&&!bgone.length&&!bnew.length&&!tgone.length&&!tnew.length,ts:Date.now()}}
function impApply(name,txt,fname,ts,fresh){const R=anRead(txt);const old=AN.sheets.findIndex(s=>s.name===name),base=old>=0?(AN.sheets[old].imp?AN.sheets[old].orig:AN.sheets[old]):null;
 const o={name,no:'',title:'(imported from '+fname+', kept in this browser)',fam:base?base.fam:'IMPORTED',R,imp:1,orig:base,impTs:ts,impFile:fname};
 if(base){o.no=base.no;o.title='(imported from '+fname+', kept in this browser) '+base.title;try{o.rep=impDiff(base.R,R,name)}catch(x){o.rep={name,err:String(x&&x.message||x)}}}
 if(old>=0)AN.sheets[old]=o;else AN.sheets.push(o);
 if(fresh&&AN.sv&&AN.sv[name]){delete AN.sv[name];try{anSave()}catch(x){}}/* saved values use net numbers of the OLD drawing */
 return o}
async function impRestore(){const list=await KV.get('imp:list');if(!Array.isArray(list))return;const done=[];
 for(const name of list){const r=await KV.get('imp:'+name);if(!r||!r.txt)continue;try{impApply(name,r.txt,r.fname||name+'.dxf',r.ts||0,false);done.push(name)}catch(x){AN.impErr=(AN.impErr||'')+name+': '+x.message+' '}}
 AN.impRestored=done}
async function impSave(name,txt,fname){const list=(await KV.get('imp:list'))||[];if(!list.includes(name))list.push(name);const a=await KV.set('imp:'+name,{txt,fname,ts:Date.now()}),b=await KV.set('imp:list',list);return a&&b}
async function impDrop(name){const list=((await KV.get('imp:list'))||[]).filter(n=>n!==name);await KV.set('imp:'+name,null);await KV.set('imp:list',list);
 const i=AN.sheets.findIndex(s=>s.name===name&&s.imp);if(i>=0){const o=AN.sheets[i];if(o.orig)AN.sheets[i]=o.orig;else AN.sheets.splice(i,1);if(AN.i>=AN.sheets.length)AN.i=0}
 if(AN.sv&&AN.sv[name]){delete AN.sv[name];try{anSave()}catch(x){}}AN.tagIdx=null;AN.sheets.forEach(s=>{delete s.lk;if(s.S)s.S.xlk=null});AN.key=null;AN.lkey=null;render()}
const cs=()=>AN.sheets[AN.i];
/* built-in LN tables (from DCS LINEAR CURVE.xls) */
function lnTables(){if(window.ANLT)return window.ANLT;let a=[];try{const e=document.getElementById('aln');if(e)a=JSON.parse(e.textContent)}catch(x){}
 a.forEach(t=>{const o=[];(t.pts||[]).forEach(p=>{const q=o[o.length-1];if(!q||q[0]!==p[0]||q[1]!==p[1])o.push([p[0],p[1]])});o.sort((p,q)=>p[0]-q[0]);t.p2=o});window.ANLT=a;lnApplyEdits();return a}
/* the edited tables (LX % / LY % of the ranges) replace the points of the table; the original points stay in o0 */
function lnApplyEdits(){for(const t of lnTables()){if(!t.o0)t.o0=(t.pts||[]).map(p=>[p[0],p[1]]);const e=AN.lne&&AN.lne[t.key];let pts=t.o0;if(e&&e.lx&&e.ly&&e.lx.length===t.o0.length&&t.xr&&t.yr)pts=e.lx.map((lx,i)=>[t.xr[0]+lx*(t.xr[1]-t.xr[0])/100,t.yr[0]+e.ly[i]*(t.yr[1]-t.yr[0])/100]);
  t.pts=pts;const o=[];pts.forEach(p=>{const q=o[o.length-1];if(!q||q[0]!==p[0]||q[1]!==p[1])o.push([p[0],p[1]])});o.sort((p,q)=>p[0]-q[0]);t.p2=o;t.edited=!!e}}
/* station of a sheet = prefix of its own MDL tags (S1-MDL028); without any: the only station that has all the LN numbers of its FX blocks */
function stnOf(S){const c={};for(const t of S.tx){const m=/^S(\d)-(?:MDL|LN)/i.exec(t.t.trim());if(m)c[m[1]]=(c[m[1]]||0)+1}const e=Object.entries(c).sort((a,b)=>b[1]-a[1]);if(e.length)return+e[0][0];
 const L=[...new Set(S.blk.filter(b=>b.k==='FX'&&b.p.ln).map(b=>+(/LN(\d+)/i.exec(b.p.ln)||[])[1]).filter(Boolean))];if(!L.length)return null;const tb=lnTables(),cand=[1,2,3,4,5].filter(s=>L.every(n=>tb.some(t=>t.stn===s&&t.ln===n)));return cand.length===1?cand[0]:null}
function lnResolve(name,ln,stn){const m=/LN(\d+)/i.exec(ln||'');if(!m)return{};const n=+m[1],all=lnTables().filter(t=>t.ln===n);if(!all.length)return{warn:'no table LN'+n+' in the LINEAR data: the block passes the value (y = x)'};
 if(stn!=null){const ex=all.find(t=>t.stn===stn);if(ex)return{t:ex};if(all.length===1)return{t:all[0],warn:'station S'+stn+' has no LN'+n+': using '+all[0].key+' (the only one that exists). Check the drawing.'};return{warn:'station S'+stn+' has no LN'+n+' (exists in '+all.map(t=>'S'+t.stn).join(', ')+'): no table, y = x'}}
 const t=lnFind(name,ln);return t?{t,warn:'station of this sheet unknown: table chosen by drawing name ('+t.key+')'}:{warn:'station unknown and table LN'+n+' ambiguous'}}
function lnFind(name,ln){const m=/LN(\d+)/i.exec(ln||'');if(!m)return null;const n=+m[1],c=lnTables().filter(t=>t.ln===n);if(!c.length)return null;const fo=x=>{const q=/^ABC-(\d+)/.exec(x||'');return q?+q[1]:null};
 return c.find(t=>t.dwg===name)||c.find(t=>fo(t.dwg)!=null&&fo(t.dwg)===fo(name))||(c.length===1?c[0]:null)}
function ensure(sh){if(sh.S)return sh.S;const S=anWire(anModel(anNets(anBuild(sh.R,sh.name))));anAoIp(S);anCompile(S);anInit(S);S.procs=anProcList(S);if(AN.procDefault===true||(AN.procDefault===undefined&&AN.plantOn===true))for(const b of S.procs)b.proc.on=true;sh.S=S;sh.cnt={};S.blk.forEach(b=>{sh.cnt[b.k]=(sh.cnt[b.k]||0)+1;if(b.k==='FX'&&b.p.ln){if(sh.stn===undefined)sh.stn=stnOf(S);const r=lnResolve(sh.name,b.p.ln,sh.stn);if(r.t){Object.defineProperty(b.p,'tbl',{value:r.t,writable:true,enumerable:false,configurable:true});const q=anFXIn(S,b);b.fxin=q&&q.k!=='?'&&q.k!=='id'?q:null;b.fxrev=!!(q&&q.k==='?')}if(r.warn)Object.defineProperty(b.p,'lnWarn',{value:r.warn,writable:true,enumerable:false,configurable:true})}b.p0=JSON.stringify(b.p)});anRngRe(S);applySaved(sh);anPull(sh);anSettle(S,6);return S}
/* inputs that come from another sheet take the value of that sheet BEFORE the first settle: otherwise a pulse timer sees a false rising edge at start-up (ABC-013 TPS#29: the link from ABC-001C arrived after the first step) */
function anPull(sh){try{const S=sh.S;if(!S)return;for(const l of linksOf(sh)){if(l.to!==sh)continue;const FS=l.from.S||ensure(l.from);if(!FS)continue;const val=l.flagSrc!=null?(FS.rt.st[l.flagSrc]&&FS.rt.st[l.flagSrc].val>.5?1:0):FS.rt.v[l.fromNets.find(n=>FS.drv[n].length)??l.fromNets[0]];for(const n of l.toNets)if(S.ext.includes(n)){S.rt.ext[n]=val;S.xlk=S.xlk||{};S.xlk[n]=l}}}catch(e){}}
const AN_PV=17;/* BUMP THIS whenever the drawing reader changes (net / block numbers move) *//* saved values use net / block numbers: they are dropped when the drawing reader changes */
const sv=sh=>{const o=AN.sv[sh.name];if(o&&o.pv===AN_PV)return o;return AN.sv[sh.name]={pv:AN_PV}};
function applySaved(sh){const S=sh.S,v=AN.sv[sh.name];if(!v)return;if(v.pv!==AN_PV){delete AN.sv[sh.name];anSave();return}
 for(const id in v.ai||{}){const s=S.rt.st[id];if(s)s.val=v.ai[id]}
 for(const n in v.ext||{})if(n in S.rt.ext)S.rt.ext[n]=v.ext[n];
 for(const id in v.p||{}){const b=S.blk[id];if(b)Object.assign(b.p,v.p[id])}
 for(const n in v.force||{})S.rt.force[n]=v.force[n];
 for(const id in v.man||{}){const s=S.rt.st[id];if(s)s.val=v.man[id]}
 for(const id in v.proc||{}){const b=S.blk.find(q=>String(q.id)===String(id));if(b&&b.proc){const q=v.proc[id];if(q.ver===2)Object.assign(b.proc,q);else{b.proc.on=q.on;b.proc.dist=q.dist||0}if(!(AN.procDefault===true||(AN.procDefault===undefined&&AN.plantOn===true)))b.proc.on=false}}
 for(const id in v.sw||{}){const s=S.rt.st[id];if(s&&v.sw[id])s.fm=v.sw[id]}
 S.look=Object.assign({},v.look||{})}
function reset(){/* RESET = everything back to the drawing: all sheets, all forced signals, switches, sliders, timers, tuning */
 {const keep={};for(const k in AN.sv){const q=AN.sv[k];if(q&&q.p&&Object.keys(q.p).length)keep[k]={pv:q.pv,p:q.p}}AN.sv=keep;anSave()}
 for(const sh of AN.sheets){if(!sh.S)continue;const S=sh.S;S.look={};anInit(S);const v=AN.sv[sh.name];if(v&&v.p)for(const id in v.p){const b=S.blk[id];if(b)Object.assign(b.p,v.p[id])}sh._hs=[]}
 {const seen=new Set(),fr=sh=>{if(!sh.S||seen.has(sh))return;seen.add(sh);try{for(const l of linksOf(sh))if(l.to===sh)fr(l.from)}catch(e){}anPull(sh);anSettle(sh.S,6)};for(const sh of AN.sheets)fr(sh)}/* all sheets are re-initialised first, then settled: the same start as a fresh load, whatever the sheet order (cross-sheet back-up values) */
 const sh=cs();if(!sh||!sh.S)return;for(let i=0;i<6;i++)stepSet(sh,0);AN.sel=null;selBox();buildPanel();paint();panelUpd(true);msg('Reset done: values, forced signals, switches and timers are back to the start. Block settings (rate, stroke time, tuning, limits) are kept: use "Reset this block to default" in the block panel.')}
