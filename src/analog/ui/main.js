/* ===== v29 ANALOG UI: category switch, sheet list, canvas, live simulation, panels ===== */
const AN={ws:{th:'color',ac:'auto',as:'solid',wv:2,aw:1,dw:1,dc:'live',ds:'solid',fc:'white',pc:'sky',vc:'green',vi:'cyan',vz:'amber',vs:1,vf:'mono',vw:600},wsr:0,ramp:0,cat:'dig',sheets:[],i:-1,run:false,spd:1,vals:true,sel:null,data:null,sv:{},lne:{},fl:'',av:{}};
try{AN.sv=JSON.parse(localStorage.getItem('ditl.an')||'{}')||{}}catch(e){AN.sv={}}
try{AN.lne=JSON.parse(localStorage.getItem('ditl.an.lne')||'{}')||{}}catch(e){AN.lne={}}
const lneSave=()=>{const s=JSON.stringify(AN.lne);try{localStorage.setItem('ditl.an.lne',s)}catch(e){}persistAll()};
try{const r=localStorage.getItem('ditl.an.ramp2');void r}catch(e){}
try{wsIn(JSON.parse(localStorage.getItem('ditl.an.ws')||'{}'))}catch(e){}
const wsSave=()=>{const s=JSON.stringify(AN.ws);try{localStorage.setItem('ditl.an.ws',s)}catch(e){}KV.set('ws',s);WN.put('ws',AN.ws);persistAll()};

try{window.ANLN=JSON.parse(localStorage.getItem('ditl.ln')||'{}')||{}}catch(e){window.ANLN={}}
/* the engine reads the manual F(X) tables as AN.ln (no page access in the engine): it is the same object as window.ANLN, also when the page replaces it */
Object.defineProperty(AN,'ln',{get:()=>window.ANLN,set:v=>{window.ANLN=v},configurable:true,enumerable:false});
/* the raw LINEAR tables: the page reads them from its data block, the engine asks for them */
AN.lnSrc=()=>{const e=document.getElementById('aln');return e?JSON.parse(e.textContent):[]};
const KV=(()=>{const open=()=>new Promise(res=>{try{const r=indexedDB.open('ditl-an',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);r.onblocked=()=>res(null)}catch(e){res(null)}}),p=open();
 return{get:k=>p.then(d=>new Promise(res=>{if(!d)return res(undefined);try{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>res(undefined)}catch(e){res(undefined)}})),set:(k,v)=>p.then(d=>new Promise(res=>{if(!d)return res(false);try{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>res(true);t.onerror=()=>res(false);t.onabort=()=>res(false)}catch(e){res(false)}}))}})();
const WN={get(){try{if(String(window.name).startsWith('ditl-an:'))return JSON.parse(window.name.slice(8))}catch(e){}return{}},put(k,v){try{if(window.name&&!String(window.name).startsWith('ditl-an:'))return;const o=WN.get();o[k]=v;window.name='ditl-an:'+JSON.stringify(o)}catch(e){}}};
let _ht=null;const HB=()=>{try{const m=/[#&]a=([^&]+)/.exec(location.hash);if(m)return JSON.parse(decodeURIComponent(escape(atob(m[1]))))}catch(e){}return null};
const BOOT={};try{BOOT.ls=JSON.parse(localStorage.getItem('ditl.an.bundle'))}catch(e){}BOOT.wn=WN.get().bundle;BOOT.hb=HB();/* what the page was opened with, read BEFORE anything is written */
function persistAll(){if(!AN._ready){AN._pend=1;return}const o={sv:AN.sv,ln:AN.lne,ws:AN.ws,hmi:AN.hmi,cur:(AN.sheets[AN.i]||{}).name||AN._cur||null,cat:AN.cat,ts:Date.now()},s=JSON.stringify(o);
 try{localStorage.setItem('ditl.an.bundle',s)}catch(e){}KV.set('bundle',s);WN.put('bundle',o);
 clearTimeout(_ht);_ht=setTimeout(()=>{try{if(s.length<150000)history.replaceState(null,'',location.pathname+location.search+'#a='+btoa(unescape(encodeURIComponent(s))))}catch(e){}},250)}
const anSave=()=>{const s=JSON.stringify(AN.sv);try{localStorage.setItem('ditl.an',s)}catch(e){if(!anSave.w){anSave.w=1;try{msg('Browser storage is full or blocked: using the backup storage (IndexedDB). See Legend & style > Saving.')}catch(x){}}}KV.set('sv',s);WN.put('sv',AN.sv);persistAll()};
/* read back: IndexedDB first (never full), then localStorage (already read above), then window.name (survives F5) */
AN.kv=Promise.all([KV.get('sv'),KV.get('ws'),KV.get('cur'),KV.get('bundle')]).then(([a,b,c,bd])=>{const w=WN.get();AN._src='nothing found (defaults)';
 const cand=[];const add=(name,o)=>{if(o&&typeof o==='object'&&o.ts)cand.push([name,o])};
 add('browser storage',BOOT.ls);try{if(bd)add('backup storage (IndexedDB)',JSON.parse(bd))}catch(e){}add('tab memory',BOOT.wn);add('address bar',BOOT.hb);
 cand.sort((x,y)=>y[1].ts-x[1].ts);
 if(cand.length){const[nm,o]=cand[0];AN._src=nm;if(o.sv&&typeof o.sv==='object')AN.sv=o.sv;if(o.ln&&typeof o.ln==='object')AN.lne=o.ln;if(o.ws)wsIn(o.ws);if(o.hmi&&typeof o.hmi==='object')AN.hmi=hmiNorm(o.hmi);AN._cur=o.cur||null;if(o.cat)AN._cat=o.cat}
 else{
  try{if(a){const o=JSON.parse(a);if(o&&typeof o==='object'){AN.sv=o;AN._src='backup storage (older)'}}else if(w.sv&&!Object.keys(AN.sv).length)AN.sv=w.sv}catch(e){}
  try{if(b)wsIn(JSON.parse(b));else if(w.ws&&!localStorage.getItem('ditl.an.ws'))wsIn(w.ws)}catch(e){}
  AN._cur=c||w.cur||null;if(Object.keys(AN.sv).length)AN._src=AN._src.startsWith('nothing')?'browser storage (older)':AN._src}AN._ready=1;if(AN._pend)persistAll()}).catch(()=>{AN._ready=1});
const FAMS=['INDEX & SYMBOLS','COORDINATED CONTROL','FUEL & BURNERS','AIR & FURNACE','WATER & LEVEL','TEMPERATURE','STEAM PRESSURE','OTHER','IMPORTED'];
const h$=(t,a,ch)=>{const e=document.createElement(t);if(a)for(const k in a){if(k==='cls')e.className=a[k];else if(k==='txt')e.textContent=a[k];else if(k.startsWith('on'))e[k]=a[k];else e.setAttribute(k,a[k])}(ch||[]).forEach(c=>e.append(c));return e};
const aci=c=>{const M={1:'#ff4d4d',2:'#ffe94d',3:'#4dff7a',4:'#4de6ff',5:'#6f95ff',6:'#ff6bff',7:'#e6edf3',8:'#8a98a3',9:'#c3ccd3'};if(c==null||c<=0)return '#e6edf3';if(M[c])return M[c];if(c>=250){const g=40+(c-250)*30;return `rgb(${g+60},${g+60},${g+60})`}
 const h=Math.floor((c-10)/10)*15,k=(c-10)%10;return `hsl(${h},${k%2?60:100}%,${68-k*3}%)`};
const fmt=v=>{if(v==null||!isFinite(v))return '--';const a=Math.abs(v);return a>=1000?v.toFixed(0):a>=100?v.toFixed(1):v.toFixed(2)};
/* ---------- CSS + DOM ---------- */
document.head.appendChild(h$('style',{txt:`
body.an #bar,body.an #meta,body.an #tp,body.an #wp,body.an #hp,body.an #ed,body.an #shbox{display:none!important}
#anbar,#anmeta,#anp,#anhp,#anln,#anau{display:none}body:not(.an) #anerr{display:none!important}
body.an #anbar{display:flex;gap:6px;align-items:center;padding:6px 10px;background:var(--panel);border-bottom:1px solid var(--line);flex-wrap:wrap}
body.an #anmeta{display:flex;align-items:center;gap:14px;padding:5px 14px;background:var(--panel);border-bottom:1px solid var(--line)}
#anmeta b{color:#fff;letter-spacing:.04em}#anmeta small{color:var(--dim)}#anmeta .sp{flex:1}
.cat{display:inline-flex;border:1px solid var(--line)}.cat button{border:0;padding:5px 10px}.cat button.on{background:#14231b;color:var(--acc)}
body.an #anp{display:block;width:380px;flex:none;overflow-x:hidden;overflow-y:auto;overflow-wrap:anywhere;word-break:break-word;background:var(--panel);border-left:1px solid var(--line);padding:8px;font-size:12px}
body.an #anp.min{display:none}
body.an #anp.ov{position:fixed;right:0;z-index:30;box-shadow:-6px 0 18px #000a;border-top:1px solid var(--line)}
#anp h4{margin:10px 0 4px;font-size:12px;color:var(--acc);border-bottom:1px solid var(--line);padding-bottom:2px}#anp h4:first-child{margin-top:0}
#anp .r{display:flex;align-items:center;gap:5px;flex-wrap:wrap;padding:3px 0;border-bottom:1px solid #1d2830}#anp .r>span.n{flex:1;min-width:90px;word-break:break-all}
#anp *{max-width:100%;box-sizing:border-box;overflow-wrap:anywhere}
#anp canvas,#anp svg{max-width:100%}
#anp input[type=number]{min-width:0}
#anp .fc,#anp .r,#anp .ph{flex-wrap:wrap}
#anp small,#anp div,#anp span{white-space:normal}
#anp input[type=number],#anp select{background:#0b1013;color:var(--tx);border:1px solid var(--line);padding:2px 4px;font:inherit;width:70px}#anp input[type=range]{width:100%}
#anp .v{font-family:Consolas,monospace;color:var(--acc)}#anp .v.d1{color:var(--live)}#anp small{color:var(--dim)}
#anp button{padding:2px 8px}
body.an #anlist{display:block}#anlist{display:none;overflow:auto;flex:1;min-height:0}
#anlist .fh{padding:4px 8px;font-size:10.5px;color:var(--acc);background:#10181d;letter-spacing:.06em;position:sticky;top:0}
#anlist button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #18242c;border-left:3px solid transparent;background:transparent;padding:5px 8px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#anlist button:hover{background:#1b2830}#anlist button.on{color:var(--acc);background:#14231b;border-left-color:var(--acc)}
#anlist .sn{display:block;font-weight:600}#anlist .st{display:block;font-size:10.5px;color:var(--dim);white-space:normal;line-height:1.25;max-height:2.5em;overflow:hidden}
body.an #sidelist{display:none}
#anhp,#anln,#anau{position:fixed;top:56px;right:8px;width:620px;max-width:96vw;max-height:78vh;overflow:auto;background:#0f1a22;border:1px solid #2b4a5a;padding:8px;z-index:60;font:12px sans-serif;color:#cfd8dc}
#anln textarea{width:100%;height:150px;background:#0b1013;color:var(--tx);border:1px solid var(--line);font:12px Consolas,monospace}
#anhp table{border-collapse:collapse;width:100%}#anhp td,#anhp th{border-bottom:1px solid #1d2c36;padding:2px 6px;text-align:left}#anhp .bad{color:#ffb86b}
.fc{display:inline-flex;gap:3px;align-items:center}#anp .fc button{font-size:11px;padding:1px 6px}#anp button.fo,#anp input.fo{border-color:#ffb020;color:#ffb020}#anp .ph{display:flex;align-items:center;gap:6px;margin-bottom:4px}#anp .ph label{display:flex;gap:3px;align-items:center;color:var(--dim)}
#anp .ir{padding:4px 2px;border-bottom:1px solid #1d2830;border-radius:3px}#anp .ir .l1{display:flex;align-items:center;gap:5px;flex-wrap:wrap}#anp .ir .tg{flex:1;min-width:80px;font-weight:600;color:#e6edf3;cursor:pointer;word-break:break-all}#anp .ir .ds{font-size:11px;color:var(--dim);line-height:1.25;cursor:pointer;margin-top:1px}#anp .ir.hl{background:#2a3a14;outline:1px solid var(--acc)}#anp .ir input[type=range]{margin-top:2px}
#anp details.sec>summary{cursor:pointer;color:var(--acc);font-weight:600;padding:5px 0;border-bottom:1px solid var(--line);margin-top:8px}#anp .sh{margin:7px 0 2px;font-size:10.5px;letter-spacing:.05em;color:#8fb5c9;text-transform:uppercase}
#anptab{display:none;position:fixed;right:0;top:50%;z-index:40;padding:8px 6px;writing-mode:vertical-rl;border-right:0;background:var(--panel);border-color:var(--acc);color:var(--acc)}
.cj{fill:transparent;pointer-events:all;cursor:pointer}.cj:hover{stroke:var(--acc);stroke-width:.5}
.bd{font:var(--vfw,600) var(--bs,2.4px) var(--vff,Consolas,monospace);fill:var(--vcol,#8dffb8);paint-order:stroke;stroke:#05080a;stroke-width:.3px;pointer-events:none}.bd.dg{fill:var(--vcol,#8dffb8)}.bd.inp{fill:var(--vin,#8fe3ff)}.bd.frc{fill:var(--vfr,#ffd27a)}
@media(max-width:820px){body.an #anp{position:fixed;right:0;top:auto;bottom:0;width:100%;max-height:42vh;z-index:30;border-left:0;border-top:1px solid var(--acc)}body.an #anshbox{display:flex!important}}
#anshbox{display:none;align-items:center;gap:4px}body.an #anshbox{display:flex}
#anlg{display:none;position:fixed;top:100px;right:310px;max-height:calc(100vh - 120px);overflow-y:auto;z-index:70;background:#0f1a22;border:1px solid #2b4a5a;padding:10px 14px;font:12px sans-serif;color:#cfd8dc;max-width:380px;box-shadow:0 6px 24px #000a}#anlg b{display:block;margin:8px 0 3px;color:#8fb5c9;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase}#anlg b:first-child{margin-top:0}#anlg .it{display:flex;gap:8px;align-items:center;margin:3px 0}#anlg .sw{flex:none;width:24px;height:13px;border:2px solid;box-sizing:border-box;border-radius:2px}#anlg .dt{flex:none;width:13px;height:13px;border-radius:50%}#anlg svg{flex:none;display:block;width:24px;height:13px}
@keyframes anblink{0%,100%{opacity:1}50%{opacity:.18}}.blink{animation:anblink .7s steps(2,jump-none) infinite}
.lg{display:inline-flex;gap:14px;align-items:center;color:var(--dim);font-size:11px}.lg i{white-space:nowrap;display:inline-flex;align-items:center;gap:5px;font-style:normal}`}));
const bar=h$('div',{id:'anbar'}),meta=h$('div',{id:'anmeta'}),errB=h$('div',{id:'anerr',style:'display:none;background:#5a1d1d;color:#ffd7d7;padding:4px 12px;font:12px Consolas,monospace;cursor:pointer',title:'click to hide'});errB.onclick=()=>{errB.style.display='none'};
const mkCat=()=>{const d=h$('div',{cls:'cat'}),a=h$('button',{txt:'Digital · DITL',title:'Digital interlock logic'}),b=h$('button',{txt:'Analog · ABC',title:'Analog interlock control logic (boiler)'});a.onclick=()=>setCat('dig');b.onclick=()=>setCat('an');d.append(a,b);d._u=()=>{a.classList.toggle('on',AN.cat==='dig');b.classList.toggle('on',AN.cat==='an')};return d};
const catB=[mkCat(),mkCat()];document.getElementById('bar').prepend(catB[0]);
const bRun=h$('button',{txt:'▶ Run',title:'Run / pause simulation (Space)'}),sSpd=h$('select',{title:'Simulation speed'},[1,5,10,60,300].map(v=>h$('option',{value:v,txt:v+'x'}))),
 bRst=h$('button',{txt:'Reset',title:'Reset this sheet to the start: forced signals, switches and sliders cleared (PID tuning and parameters are kept)'}),bFit=h$('button',{txt:'Fit'}),bVal=h$('button',{txt:'Values',cls:'on',title:'Show live values on the drawing (beside the address / tag text)'}),bRv=h$('button',{txt:'Review marks',title:'Amber dashed boxes on the drawing where the reader could not recognise a shape, a pin is missing, an F(X) has no table or a RATE has no span: the result there is NOT verified (NEEDS REVIEW).'}),bWv=h$('button',{txt:'Wire values',title:'Show the number on analog wires that have NO address text (a wire with an address shows its value beside the address only). Computed by the blocks. On / off.'}),
 bHp=h$('button',{txt:'Health'}),bP2=h$('button',{txt:'2nd sheet',title:'Open a second sheet beside this one (maximum 2, never the same sheet twice); it is simulated live with the main sheet'}),bAu=h$('button',{txt:'Audit',title:'Simulation Audit: your PASS / FAIL / NEEDS REVIEW results with expected vs actual, kept in this browser; export the report to send it'}),bLn=h$('button',{txt:'LN tables',title:'F(X) linearization tables'}),bHm=h$('button',{txt:'HMI',style:'display:none'}),bPm=h$('button',{txt:'Plant model: OFF',title:'OFF = every transmitter / PV is a free input and only the drawn logic runs (simulation debugging). ON = the process model makes the PV follow the controller output.'}),bPl=h$('button',{txt:'Plant',title:'Plant window: plant graphics of a system (pop-out window), live values of the addresses, F box (FORCE / SIM)'}),bDs=h$('button',{txt:'DITL signals',title:'Signals that come FROM the DITL page (one-click inputs) and go TO it (live values)'}),bIm=h$('button',{txt:'Imports',title:'DXF files you imported (kept in this browser) and what is different from the built-in drawing'}),bAs=h$('button',{txt:'Assumed values',title:'Every value that is not written on the drawings: from the Compensation file, or ASSUMED (150 MW CFB with reheat)'}),bPn=h$('button',{txt:'Panel',cls:'on'}),
 fImp=h$('input',{type:'file',accept:'.dxf',multiple:'multiple'}),lImp=h$('label',{cls:'b',txt:'Import ABC DXF'},[fImp]),
 bBk=h$('button',{txt:'↩ Back',title:'Go back to where you jumped from',style:'display:none'}),bPv=h$('button',{txt:'◀'}),sSh=h$('select',{style:'max-width:46vw'}),bNx=h$('button',{txt:'▶'}),shb=h$('span',{id:'anshbox'},[bPv,sSh,bNx]),tClk=h$('span',{style:'color:var(--dim);font:12px Consolas,monospace',txt:'t = 0:00'});
const sLv=h$('select',{title:'Live signal colour (same setting as DITL)'});
{const o=$('slive');if(o)[...o.options].forEach(x=>sLv.append(h$('option',{value:x.value,txt:x.textContent})));sLv.onchange=()=>{o.value=sLv.value;o.dispatchEvent(new Event('change'))}}
const sTh=h$('select',{title:'Drawing theme: Colour = symbols coloured by type · Engineering = white symbols and text, only the wires, live values and valves are coloured'},[['color','Theme: Colour'],['eng','Theme: Engineering']].map(([v,t])=>h$('option',{value:v,txt:t})));
sTh.onchange=()=>setTheme(sTh.value);
function setTheme(v){AN.ws.th=v;wsSave();AN.wsr++;AN.key=null;try{render()}catch(e){}}
const bSv=h$('button',{txt:'💾 Save',title:'Save the project file (Ctrl+S). First time asks where; after that it overwrites the same file.'}),bSa=h$('button',{txt:'Save as…',title:'Save the project to a new file'}),bOp=h$('button',{txt:'📂 Open',title:'Open a project file'}),lPrj=h$('span',{style:'color:var(--dim);font:12px Consolas,monospace;max-width:16ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap',txt:'no project file'}),fPrj=h$('input',{type:'file',accept:'.json,.dcsproj',style:'display:none'});
/* ---- project file (v1.10.0) ---- */
const PRJ={fh:null,name:''};
const prjLbl=()=>{lPrj.textContent=PRJ.name||'no project file';lPrj.title=PRJ.name?'Project file: '+PRJ.name:''};
const prjData=()=>JSON.stringify({app:'dcs-ditl-workbench',kind:'analog-project',ver:(document.title.match(/v([\d.]+)/)||[])[1]||'',saved:new Date().toISOString(),sv:AN.sv,ln:AN.lne,ws:AN.ws,hmi:AN.hmi,cur:(AN.sheets[AN.i]||{}).name||null},null,1);
const PJT=[{description:'Project file',accept:{'application/json':['.json']}}];
async function prjSave(as){const txt=prjData();
 if(window.nativeFS){try{const r=await nativeFS.save(as?null:PRJ.path,txt,PRJ.name||'plant-project.json');if(!r)return;PRJ.path=r.path;PRJ.name=r.name;prjLbl();msg('Project saved: '+r.path);return}catch(e){msg('Save failed: '+e.message);return}}
 if(window.showSaveFilePicker){try{if(as||!PRJ.fh)PRJ.fh=await showSaveFilePicker({suggestedName:PRJ.name||'plant-project.json',types:PJT});const w=await PRJ.fh.createWritable();await w.write(txt);await w.close();PRJ.name=PRJ.fh.name;prjLbl();msg('Project saved: '+PRJ.name);return}catch(e){if(e&&e.name==='AbortError')return;console.error(e)}}
 const a=h$('a',{href:URL.createObjectURL(new Blob([txt],{type:'application/json'})),download:PRJ.name||'plant-project.json'});document.body.append(a);a.click();a.remove();msg('Project downloaded (this browser cannot overwrite a file: use the same name next time)')}
function prjApply(o,nm){if(!o||typeof o!=='object'||(!o.sv&&!o.ws))throw new Error('not a project file');
 AN.sv=(o.sv&&typeof o.sv==='object')?o.sv:{};AN.lne=(o.ln&&typeof o.ln==='object')?o.ln:{};lnApplyEdits();if(o.ws)wsIn(o.ws);if(o.hmi&&typeof o.hmi==='object'){AN.hmi=hmiNorm(o.hmi);try{hmiHeader();hmiRender();hmiApplyMode()}catch(e){}}if(o.cur)AN._cur=o.cur;anSave();wsSave();
 for(const sh of AN.sheets){delete sh.S;delete sh.lk}AN.tagIdx=null;AN.hist=[];updBack();const i=AN.sheets.findIndex(s=>s.name===(o.cur||''));AN.i=i>=0?i:AN.i;AN.key=null;AN.lkey=null;AN.sel=null;PRJ.name=nm||PRJ.name;prjLbl();render();msg('Project opened: '+(nm||'file'))}
async function prjOpen(){if(window.nativeFS){try{const r=await nativeFS.open();if(!r)return;prjApply(JSON.parse(r.text),r.name);PRJ.path=r.path}catch(e){msg('Cannot read that file: '+e.message)}return}
 if(window.showOpenFilePicker){try{const[fh]=await showOpenFilePicker({types:PJT});const f=await fh.getFile();prjApply(JSON.parse(await f.text()),fh.name);PRJ.fh=fh;return}catch(e){if(e&&e.name==='AbortError')return;if(!(e instanceof SyntaxError)&&!/not a project/.test(e.message)){console.error(e)}else{msg('Cannot read that file: '+e.message);return}}}
 fPrj.click()}
fPrj.onchange=async()=>{const f=fPrj.files[0];fPrj.value='';if(!f)return;try{prjApply(JSON.parse(await f.text()),f.name);PRJ.fh=null}catch(e){msg('Cannot read that file: '+e.message)}};
bSv.onclick=()=>prjSave(false);bSa.onclick=()=>prjSave(true);bOp.onclick=()=>prjOpen();
addEventListener('keydown',e=>{if(AN.cat==='an'&&(e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()==='s'){e.preventDefault();e.stopPropagation()/* v1.20.8: Save is removed from the UI */}},true);
/* ---- diagnostics (v1.10.1): what goes wrong on one computer but not on another ---- */
AN.errs=[];{const note=(m,src)=>{AN.errs.push((new Date().toLocaleTimeString())+' '+m+(src?' @'+src:''));if(AN.errs.length>20)AN.errs.shift();try{if(AN.cat==='an'){const t=$('anerr');if(t){t.textContent='⚠ Error: '+m+'  (Legend & style > Saving > Diagnostics)';t.style.display='block'}}}catch(e){}};
 addEventListener('error',e=>note(e.message||'error',(e.filename||'').split('/').pop()+':'+e.lineno));addEventListener('unhandledrejection',e=>note('promise: '+(e.reason&&e.reason.message||e.reason)))}
function anDiag(){const L_=[];const P=(k,v)=>L_.push(k+': '+v);P('app',document.title);P('browser',navigator.userAgent);P('platform',navigator.platform+' · touch points '+navigator.maxTouchPoints);P('window',innerWidth+'x'+innerHeight+' @'+devicePixelRatio+'x · screen '+screen.width+'x'+screen.height);P('file',location.protocol+'//'+location.pathname.slice(-60));
 let ls='blocked';try{localStorage.setItem('ditl.probe','1');ls=localStorage.getItem('ditl.probe')==='1'?'ok':'bad';localStorage.removeItem('ditl.probe')}catch(e){ls='blocked: '+e.message}P('localStorage',ls);P('IndexedDB',typeof indexedDB);P('loaded from',AN._src||'?');P('sheets',AN.sheets.length+' · current '+((AN.sheets[AN.i]||{}).name||'-'));P('errors so far',AN.errs.length?'\n  '+AN.errs.join('\n  '):'none');
 try{const sh=cs(),S=sh&&sh.S,ai=S&&S.blk.find(b=>b.k==='AI'),inp=document.querySelector('#anp input[type=number]');
  if(!S)P('input test','no sheet');else if(!ai)P('input test','this sheet has no analog input (go to ABC-050 or ABC-057 and run it again)');else if(!inp)P('input test','FAIL: no number box in the right panel (is the panel open?)');else{const st=S.rt.st[ai.id],old=st.val,tgt=(+old||0)+1;inp.value=String(tgt);inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
   const now=S.rt.st[ai.id].val;P('input test (type a number in the panel)',now===tgt?'PASS':'FAIL: wanted '+tgt+' got '+now);S.rt.st[ai.id].val=old;inp.value=String(old);inp.dispatchEvent(new Event('change',{bubbles:true}))}}catch(e){P('input test','ERROR '+e.message)}
 return L_.join('\n')}
const sRmp=h$('select',{title:'How fast an analog input you set moves to the new value (like a real process). Instant = jumps at once.'},[['0.025','Analog: slow'],['0.05','Analog: normal'],['0.2','Analog: fast'],['0','Analog: instant']].map(([v,t])=>h$('option',{value:v,txt:t})));
sRmp.value=String(AN.ramp);if(sRmp.value!==String(AN.ramp)){sRmp.value='0'}
sRmp.onchange=()=>{AN.ramp=+sRmp.value;try{localStorage.setItem('ditl.an.ramp2',String(AN.ramp))}catch(e){}for(const sh of AN.sheets)if(sh.S)sh.S.rt.ramp=AN.ramp};
const sStp=h$('select',{title:'Pause: how far Next / Back moves the time'},[1,5,10,30,60].map(v=>h$('option',{value:v,txt:v+' s'}))),bSb=h$('button',{txt:'◀ Back',title:'Pause: roll the simulation back by the selected time'}),bSn=h$('button',{txt:'Next ▶',title:'Pause: run the simulation forward by the selected time'}),
 bVw=h$('button',{txt:'View',title:'View mode (default): grey drawing, nothing simulated. Click a block or wire = trace it.'});
bar.append(catB[1],bVw,bRun,bSb,sStp,bSn,sSpd,bRst,bFit,bVal,bWv,bRv,sLv,sTh,bBk,bHp,bAu,bLn,bAs,bDs,bP2,bPn,shb,tClk);bP2.onclick=()=>{if(AN.p2){p2Close();p2Sync();return}const m=cs();let t=null;try{const L2=linksOf(m);const l=L2.find(q=>q.from!==m&&!/ABC-000/.test(q.from.name))||L2.find(q=>q.to!==m&&!/ABC-000/.test(q.to.name));t=l?(l.from!==m?l.from:l.to):null}catch(e){}if(!t)t=AN.sheets.find((s,i)=>i>AN.i&&!/ABC-000/.test(s.name))||AN.sheets.find(s=>s!==m&&!/ABC-000/.test(s.name));if(t)p2Open(t.name)};for(const x of[bVw,bFit,bHp,bPn,shb])x.style.marginLeft='12px';
const anau=h$('div',{id:'anau',hidden:'hidden'}),anp=h$('div',{id:'anp'}),anhp=h$('div',{id:'anhp',hidden:'hidden'}),anln=h$('div',{id:'anln',hidden:'hidden'}),anlist=h$('div',{id:'anlist'});
const barEl=document.getElementById('bar');barEl.after(bar);bar.after(meta);meta.after(errB);document.getElementById('mid').append(anp);{const c2=document.createElement('div');c2.id='cv2';c2.innerHTML='<div id="cv2h"></div><svg id="svg2"></svg>';document.getElementById('cv').after(c2);document.head.appendChild(h$('style',{txt:'#cv2{display:none;flex:1;min-height:0;min-width:0;flex-direction:column;border-left:3px solid #3a6a8a}body.an #cv2.on{display:flex}#cv2h{display:flex;gap:6px;align-items:center;padding:3px 6px;background:#10202b;font:12px sans-serif;color:#cfd8dc}#cv2 svg{flex:1;height:auto;min-height:0;cursor:grab}'}))}document.body.append(anhp,anln,anau);
document.getElementById('sidebody').append(anlist);
