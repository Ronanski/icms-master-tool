/* ===================== HMI v2 ===================== */
AN.hmiUi.vw={};
hmiSync=function(){const s=new Set();if(AN.hmiUi.open)for(const p of AN.hmi.pages)for(const w of p.widgets){for(const a of[w.addr,w.addr2,w.addr3]){if(!a)continue;const c=w.type==='face'?(hmiBlk(w)||{}):(hmiPick(w,a)||{});if(c.sh)s.add(c.sh.name)}if(!w.addr&&w.nn!=null&&w.sheet)s.add(w.sheet)}AN.hmiSheets=[...s]};
const hmiDesc=(sh,t)=>{try{const a=adesFind(sh,t);return a?adesText(a.rec):''}catch(e){return''}};
/* the address text of a wire, when it has one that the HMI finds again on this very wire */
function hmiAddrOf(sh,n){const S=sh.S,c=[];if(S.lab[n]&&S.lab[n].t)c.push(S.lab[n].t);(S.tagN||[]).filter(q=>q.n===n).sort((a,b)=>a.d-b.d).forEach(q=>c.push(q.t));try{const w=wireTag(S,n);if(w)c.push(w)}catch(e){}
 for(const t of c){const f=hmiFind(t).filter(q=>q.sh===sh);if(f.length===1&&f[0].n===n)return t}return null}
const _spc=hmSvg.setPointerCapture.bind(hmSvg);hmSvg.setPointerCapture=id=>{try{_spc(id)}catch(e){}};
/* ---- zoom / pan ---- */
const hmiPgKey=()=>{const p=hmPg();return p.name+'#'+AN.hmi.cur};
function hmiVb(){const p=hmPg(),k=hmiPgKey();let v=AN.hmiUi.vw[k];if(!v)v=AN.hmiUi.vw[k]={x:0,y:0,w:p.w,h:p.h};return v}
function hmiApplyVb(){const v=hmiVb();hmSvg.setAttribute('viewBox',v.x+' '+v.y+' '+v.w+' '+v.h);const z=hmiZoomEl;if(z)z.textContent=Math.round(hmPg().w/v.w*100)+'%'}
let hmiZoomEl=null;
const _hr=hmiRender;hmiRender=function(){_hr();hmiApplyVb()};
function hmiZoomBy(f,cx,cy){const p=hmPg(),v=hmiVb(),k0=p.w/v.w,k1=Math.max(.2,Math.min(8,k0*f));const px=cx==null?v.x+v.w/2:cx,py=cy==null?v.y+v.h/2:cy;const nw=p.w/k1,nh=p.h/k1;v.x=px-(px-v.x)*nw/v.w;v.y=py-(py-v.y)*nh/v.h;v.w=nw;v.h=nh;hmiApplyVb()}
function hmiFit(){const p=hmPg();AN.hmiUi.vw[hmiPgKey()]={x:0,y:0,w:p.w,h:p.h};hmiApplyVb()}
hmSvg.addEventListener('wheel',e=>{e.preventDefault();const q=hmiPt(e);hmiZoomBy(e.deltaY>0?1/1.15:1.15,q.x,q.y)},{passive:false});
hmSvg.addEventListener('pointerdown',e=>{const gEl=e.target.closest&&e.target.closest('g[data-id]');if(e.button!==1&&(AN.hmiUi.edit&&gEl))return;if(e.button>1)return;if(AN.hmiUi.add&&e.button!==1)return;
 const v=hmiVb(),r=hmSvg.getBoundingClientRect(),sc=Math.min(r.width/v.w,r.height/v.h)||1;let x0=e.clientX,y0=e.clientY,moved=false;try{hmSvg.setPointerCapture(e.pointerId)}catch(x){}
 const mv=ev=>{const dx=(ev.clientX-x0)/sc,dy=(ev.clientY-y0)/sc;if(!moved&&Math.hypot(ev.clientX-x0,ev.clientY-y0)<4)return;moved=true;v.x-=dx;v.y-=dy;x0=ev.clientX;y0=ev.clientY;hmSvg.setAttribute('viewBox',v.x+' '+v.y+' '+v.w+' '+v.h)};
 const up=()=>{hmSvg.removeEventListener('pointermove',mv);hmSvg.removeEventListener('pointerup',up)};hmSvg.addEventListener('pointermove',mv);hmSvg.addEventListener('pointerup',up)});
/* ---- header: zoom, snap, lock ---- */
const _hh=hmiHeader;hmiHeader=function(){_hh();const H=AN.hmi;if(H.lock){AN.hmiUi.edit=false;AN.hmiUi.add=null}
 const b=(t,f,ti)=>h$('button',{txt:t,title:ti||'',onclick:f}),lk=b(H.lock?'🔒 Locked':'🔓 Lock',()=>{H.lock=!H.lock;if(H.lock){AN.hmiUi.edit=false;hmSel=null}hmiSave();hmiHeader();hmiRender()},'Lock: no editing, no moving; you can still operate, zoom and pan');lk.classList.toggle('on',!!H.lock);
 hmiZoomEl=h$('span',{style:'min-width:38px;text-align:center;color:#9ab'});const zi=b('+',()=>hmiZoomBy(1.25),'Zoom in (wheel)'),zo=b('−',()=>hmiZoomBy(1/1.25),'Zoom out (wheel)'),zf=b('Fit',hmiFit,'Whole page'),sn=h$('label',{title:'Snap to a 5 px grid while moving (Shift = snap once)'},[h$('input',{type:'checkbox'}),document.createTextNode('Snap')]);sn.firstChild.checked=!!AN.hmiUi.snap;sn.firstChild.onchange=()=>{AN.hmiUi.snap=sn.firstChild.checked};
 const first=[...hmHdr.children].find(c=>c.tagName==='BUTTON'&&/Edit/.test(c.textContent));if(first){if(H.lock){first.disabled=true;first.title='Locked: unlock to edit'}}
 const spacer=[...hmHdr.children].find(c=>c.tagName==='SPAN'&&c.style.flex);const ins=x=>hmHdr.insertBefore(x,spacer||null);[zo,hmiZoomEl,zi,zf,sn,lk].forEach(ins);hmiApplyVb()};
/* ---- resize handle on the selected widget + smooth drag (no snap) ---- */
const _hr2=hmiRender;hmiRender=function(){_hr2();if(!AN.hmiUi.edit||hmSel==null)return;const w=hmPg().widgets.find(x=>x.id===hmSel);if(!w)return;
 const hd=hs$('rect',{x:w.x+w.w-4,y:w.y+w.h-4,width:10,height:10,fill:'#ffd84d',style:'cursor:nwse-resize'});hmSvg.append(hd);
 hd.onpointerdown=e=>{e.stopPropagation();hd.setPointerCapture(e.pointerId);const mv=ev=>{const q=hmiPt(ev);w.w=Math.max(20,snap(q.x-w.x));w.h=Math.max(12,snap(q.y-w.y));hd.setAttribute('x',w.x+w.w-4);hd.setAttribute('y',w.y+w.h-4)};
  const up=()=>{hd.removeEventListener('pointermove',mv);hd.removeEventListener('pointerup',up);hmiSave();hmiRender()};hd.addEventListener('pointermove',mv);hd.addEventListener('pointerup',up)}};
/* ---- address picker ---- */
function hmiList(face){const out=[];const ix=hmiIndex();if(face){for(const[t,c]of ix.blk){const q=c[0],b=q.sh.S.blk.find(x=>x.id===q.b);out.push({addr:t,sheet:q.sh.name,kind:b?b.k:'block',desc:hmiDesc(q.sh,t)||((AN_DEF.FACE&&AN_DEF.FACE.desc)||''),sh:q.sh})}return out}
 for(const[t,c]of ix.ix){for(const q of c){const S=q.sh.S;if(!S||S.nets[q.n]===undefined)continue;const ext=S.ext.includes(q.n)&&!(S.xlk&&S.xlk[q.n]);out.push({addr:t,sheet:q.sh.name,kind:(S.nets[q.n].dig?'digital ':'analog ')+(ext?'input':(q.ditl?'DITL '+q.ditl:'computed')),desc:hmiDesc(q.sh,t)||(()=>{try{return nm(S,q.n)}catch(e){return''}})(),n:q.n,sh:q.sh})}}return out}
function hmiFindUi(w){const old=hmEl.querySelector('.hfind');if(old)old.remove();const face=w.type==='face',all=hmiList(face),box=h$('div',{cls:'hfind',style:'position:absolute;left:10px;top:44px;right:10px;bottom:10px;background:#0f1a22f5;border:1px solid #2b4a5a;z-index:30;display:flex;flex-direction:column;padding:8px;gap:6px'});
 const q=h$('input',{placeholder:face?'search a controller tag or description…':'search a tag, address or description…',style:'width:100%'}),ls=h$('div',{style:'flex:1;overflow:auto;font:12px sans-serif'}),info=h$('div',{style:'color:#9ab;font-size:11px'});
 const draw=()=>{const t=q.value.trim().toUpperCase();ls.innerHTML='';const m=all.filter(e=>!t||(e.addr+' '+e.desc+' '+e.sheet+' '+e.kind).toUpperCase().includes(t));m.slice(0,300).forEach(e=>{const r=h$('div',{style:'padding:3px 6px;cursor:pointer;border-bottom:1px solid #1d2b34'},[h$('b',{txt:e.addr}),document.createTextNode('  '+e.sheet+' · '+e.kind),h$('div',{txt:e.desc,style:'color:#9ab;font-size:11px'})]);r.onmouseenter=()=>r.style.background='#18303c';r.onmouseleave=()=>r.style.background='';
  r.onclick=()=>{w.addr=e.addr;w.nn=undefined;w.sheet=e.sheet;if(!w.label||/^(Button|Slider|Text)?$/.test(w.label))w.label=e.desc?e.desc.slice(0,40):e.addr;hmiSave();box.remove();hmiRender()};ls.append(r)});info.textContent=m.length+' found'+(m.length>300?' (first 300 shown, type more)':'')};
 q.oninput=draw;draw();box.append(h$('div',{style:'display:flex;gap:6px'},[q,h$('button',{txt:'Close',onclick:()=>box.remove()})]),info,ls);hmEl.append(box);q.focus()}
let hmiPickTm=null;
function hmiPickDiagram(w){clearInterval(hmiPickTm);if(AN.hmi.mode==='tab')hmiSetMode('float');const k0=JSON.stringify(AN.sel&&{n:AN.sel.net,b:AN.sel.blk&&AN.sel.blk.id});msg('HMI: click a wire'+(w.type==='face'?' or the block':'')+' on the diagram to take its address (Esc cancels)');let n=0;
 const stop=()=>{clearInterval(hmiPickTm);hmiPickTm=null};hmiPickTm=setInterval(()=>{if(++n>600){stop();return}const sh=cs();if(!sh||!sh.S||!AN.sel)return;const k=JSON.stringify({n:AN.sel.net,b:AN.sel.blk&&AN.sel.blk.id});if(k===k0)return;
  if(w.type==='face'){const b=AN.sel.blk;if(!b)return;const t=(b.txt||[]).find(x=>/^[A-Z][A-Z0-9\-.]{2,}$/.test(x)&&!/^(PID|PIDV|MAN|SUMA|ALM|AI|AO|FX)$/i.test(x)&&!/^S\d-MDL/i.test(x));if(!t){msg('This block has no tag; pick a PID / MAN');return}w.addr=t;w.sheet=sh.name}
  else{const nn=AN.sel.net;if(nn==null)return;const a=hmiAddrOf(sh,nn);if(a){w.addr=a;w.nn=undefined}else{w.addr='';w.nn=nn}w.sheet=sh.name;if(!w.label||/^(Button|Slider|Text)?$/.test(w.label)){const d=hmiDesc(sh,a||'');w.label=(d||nm(sh.S,nn)).slice(0,40)}}
  stop();hmiSave();hmiRender();msg('HMI: widget bound to '+(w.addr||('wire '+w.nn+' of '+w.sheet)))},200)}
addEventListener('keydown',e=>{if(e.key==='Escape'&&hmiPickTm){clearInterval(hmiPickTm);hmiPickTm=null;msg('HMI: pick cancelled')}},true);
const _hp=hmiProps;hmiProps=function(){_hp();if(!AN.hmiUi.edit)return;const p=hmPg(),w=p.widgets.find(x=>x.id===hmSel);if(!w||w.type==='label')return;
 const row=[h$('button',{txt:'Find…',title:'Search every tag / address with its description',onclick:()=>hmiFindUi(w)}),h$('button',{txt:'Pick on diagram',title:'Click a wire (or a PID / MAN block for a faceplate) on the diagram',onclick:()=>hmiPickDiagram(w)})];
 if(w.nn!=null&&!w.addr)row.push(h$('span',{txt:'bound to wire '+w.nn+' of '+w.sheet,style:'color:#9ab'}));const st=hmPr.querySelector('.st');row.forEach(x=>hmPr.insertBefore(x,st))};
/* ---- complete Auto page ---- */
hmiAuto=function(){const sh=cs();if(!sh||!sh.S){msg('Open an analog sheet first');return}if(AN.hmi.lock){msg('HMI is locked: unlock to build a page');return}const S=sh.S,H=AN.hmi,pg={name:sh.name,w:1060,h:620,bg:null,widgets:[]};H.pages.push(pg);H.cur=H.pages.length-1;
 const put=(t,o)=>{const d=HM_T[t],w=Object.assign({id:H.nid++,type:t,x:20,y:20,w:d.w,h:d.h,label:'',addr:'',addr2:'',addr3:'',sheet:sh.name,min:'',max:'',unit:'',col:'#35e08a',mom:false},o);pg.widgets.push(w);return w};
 const plant=[];let y=14;const head=t=>{put('label',{x:20,y,w:700,h:22,label:t,col:'#ffd84d'});y+=30};
 const faces=S.blk.filter(b=>['PID','PIDV','MAN'].includes(b.k)).map(b=>({b,t:(b.txt||[]).find(x=>/^[A-Z][A-Z0-9\-.]{2,}$/.test(x)&&!/^(PID|PIDV|MAN)$/i.test(x)&&!/^S\d-MDL/i.test(x))})).filter(x=>x.t);
 if(faces.length){head('Controllers (faceplates) — SV / MV from the HMI; A / M / CAS comes from the switching inputs listed below');faces.forEach((x,i)=>put('face',{x:20+(i%4)*255,y:y+Math.floor(i/4)*198,addr:x.t,label:x.t}));y+=Math.ceil(faces.length/4)*198+8}
 const ext=[],lnk=[];for(let n=0;n<S.nets.length;n++){if(!S.ext.includes(n))continue;let lk=null;try{lk=procLock(S,n)}catch(e){}if(S.xlk&&S.xlk[n])lnk.push({n});else if(lk)plant.push({n,why:'input of the PV of '+((lk.txt||[])[1]||lk.k)});else ext.push({n})}
 /* transmitters (AI blocks) and SIG.AB flags are manual inputs as well: they are the field side of the sheet */
 for(const b of S.blk){if(b.k!=='AI'&&b.k!=='SIGAB')continue;const o=b.pins.find(q=>q.role==='out');if(!o)continue;const n=o.n;if(b.k==='AI'&&b.fb){plant.push({n,why:'follows the position of its valve / actuator',fb:1});continue}let pb=null;try{pb=procAI(S,b.id)}catch(e){}if(pb)plant.push({n,why:'measurement of '+((pb.txt||[])[1]||pb.k)+' (plant model)'});else ext.push({n,blk:b})}
 for(const b of S.procs||[]){const pr=b.proc;if(pr&&pr.on&&pr.mode!=='shared'&&pr.mode!=='input'&&!plant.some(q=>q.n===pr.pv))plant.push({n:pr.pv,why:'PV of '+((b.txt||[])[1]||b.k)+' as the controller sees it (after the blocks of the sheet)'})}
 const lab=n=>{let t='';try{t=nm(S,n)}catch(e){}const a=hmiAddrOf(sh,n),d=hmiDesc(sh,a||'');return{a,txt:((a&&t!==a?t+' · ':'')+(d||'')).slice(0,36)||t||('wire '+n)}};
 const bind=(n,a)=>a?{addr:a}:{addr:'',nn:n};
 const an=ext.filter(q=>!S.nets[q.n].dig).sort((p,q)=>nm(S,p.n)<nm(S,q.n)?-1:1),dg=ext.filter(q=>S.nets[q.n].dig).sort((p,q)=>nm(S,p.n)<nm(S,q.n)?-1:1);
 if(an.length){head('Manual inputs — analog ('+an.length+')');an.forEach((q,i)=>{const n=q.n,L=lab(n);let lo=0,hi=100;try{if(q.blk&&q.blk.rng){lo=q.blk.rng.lo;hi=q.blk.rng.hi}else{const ci=cosInfo(S,n);let r=ci&&!ci.dig?cosRange(S,ci):null;if(!r){const sg=S.seg[S.nets[n].segs[0]];r=anRange(S,{cx:sg?sg.x1:0,cy:sg?sg.y1:0},45)}if(r){lo=r.lo;hi=r.hi}}}catch(e){}
  put('slider',Object.assign({x:20+(i%4)*255,y:y+Math.floor(i/4)*58,w:240,label:L.txt||L.a,min:lo,max:hi},bind(n,L.a)))});y+=Math.ceil(an.length/4)*58+8}
 if(dg.length){head('Manual inputs — digital ('+dg.length+'): switches, DITL inputs, mode inputs (.MAN / .LOC / .REM), signal-bad flags');dg.forEach((q,i)=>{const L=lab(q.n);put('button',Object.assign({x:20+(i%4)*255,y:y+Math.floor(i/4)*50,w:240,h:42,label:L.txt||L.a},bind(q.n,L.a)))});y+=Math.ceil(dg.length/4)*50+8}
 if(plant.length){head('Plant values ('+plant.length+') — the plant answers here; read only. Press F (SIM / FORCE) to hold a value like a forced point of the DCS');plant.forEach((q,i)=>{const L=lab(q.n),dgt=S.nets[q.n].dig;put(dgt?'lamp':'num',Object.assign({x:20+(i%5)*205,y:y+Math.floor(i/5)*(dgt?76:56),w:dgt?70:195,h:dgt?64:46,label:(L.txt||L.a||'wire '+q.n).slice(0,30),unit:''},bind(q.n,L.a)))});y+=Math.ceil(plant.length/5)*76+8}
 if(lnk.length){head('Inputs that come from other sheets ('+lnk.length+') — read only here, set them on their own sheet');lnk.forEach((q,i)=>{const n=q.n,L=lab(n),l=S.xlk[n],from=l&&l.from&&l.from.name?l.from.name:'another sheet';const dgt=S.nets[n].dig;put(dgt?'lamp':'num',Object.assign({x:20+(i%6)*170,y:y+Math.floor(i/6)*(dgt?72:52),w:dgt?70:160,h:dgt?64:46,label:(L.txt||L.a||'wire '+n).slice(0,26)+' ← '+from,unit:''},bind(n,L.a)))});y+=Math.ceil(lnk.length/6)*72+8}
 let tos=[];try{const ix=dsIdx(sh);for(const[n,refs]of ix.to)tos.push({n,ref:[...refs][0]})}catch(e){}tos=tos.filter(q=>S.nets[q.n]&&!plant.some(r=>r.n===q.n)).slice(0,60);
 if(tos.length){head('Logic outputs that go to the DITL ('+tos.length+') — read only; press F (FORCE) to hold a value and test what is downstream');tos.forEach((q,i)=>{const dgt=S.nets[q.n].dig;put(dgt?'lamp':'num',Object.assign({x:20+(i%5)*205,y:y+Math.floor(i/5)*(dgt?76:56),w:dgt?70:195,h:dgt?64:46,label:String(q.ref).slice(0,30),unit:''},{addr:String(q.ref)}))});y+=Math.ceil(tos.length/5)*76+8}
 pg.h=Math.max(620,y+20);AN.hmiUi.edit=false;hmSel=null;persistAll();hmiHeader();hmiRender();hmiFit();msg('HMI page "'+sh.name+'": '+faces.length+' faceplate(s), '+an.length+' analog + '+dg.length+' digital manual input(s), '+lnk.length+' input(s) from other sheets, '+plant.length+' plant value(s) and '+tos.length+' output(s) to the DITL (read only, F = force).')};


