// Runs the REAL simulator code (the same src/ files) in Node, without a browser: the page is replaced by a tolerant stand-in
// (every DOM call is accepted and does nothing), the data blocks (drawings, address list, F(X) tables) are real.
// Usage:  const {loadEngine}=require('./tools/engine/node-engine.js'); const {AN,win}=await loadEngine();  AN.sheets, AN.ensure(sh), AN.stepSet(sh,dt) ...
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..'),src=p=>path.join(root,'src',p);
function stub(name){const f=function(){};const p=new Proxy(f,{get(t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='then')return undefined;if(k==='length')return 0;if(k==='style'||k==='dataset'||k==='classList'||k==='attributes')return stub(name+'.'+String(k));return stub(name+'.'+String(k))},apply(){return stub(name+'()')},construct(){return stub('new '+name)},set(){return true},has(){return true}});return p}
async function loadEngine(opt={}){
 const ver=fs.readFileSync(src('version.txt'),'utf8').trim();
 const blobs={pre:'data/pre.txt',aln:'data/aln.json',ades:'data/ades.txt',apre:'data/apre.txt'};
 const doc=new Proxy({},{get(t,k){if(k==='getElementById')return id=>blobs[id]?{textContent:fs.readFileSync(src(blobs[id]),'utf8'),id}:stub('el#'+id);if(k==='readyState')return'complete';if(k==='createElement')return()=>stub('el');if(k==='documentElement'||k==='body'||k==='head')return stub(String(k));if(k==='querySelector'||k==='querySelectorAll')return()=>opt.all?[]:stub('q');return stub('document.'+String(k))},set(){return true}});
 const ls=new Map(),localStorage={getItem:k=>ls.has(k)?ls.get(k):null,setItem:(k,v)=>ls.set(k,String(v)),removeItem:k=>ls.delete(k),clear:()=>ls.clear()};
 const ctx={indexedDB:{open(){const r={};setTimeout(()=>r.onerror&&r.onerror(),0);return r}},document:doc,localStorage,sessionStorage:localStorage,console,setTimeout,clearTimeout,setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},addEventListener(){},removeEventListener(){},navigator:{userAgent:'node',clipboard:stub('clipboard')},location:{protocol:'file:',pathname:'/',href:'file:///',hostname:'',search:'',hash:''},
  atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),Response,Blob,DecompressionStream,TextDecoder,TextEncoder,performance,structuredClone,Uint8Array,Float64Array,Int32Array,URL,fetch:()=>Promise.reject(new Error('no network')),Image:function(){},HTMLElement:function(){},matchMedia:()=>({matches:false,addEventListener(){}}),getComputedStyle:()=>stub('cs'),devicePixelRatio:1,innerWidth:1280,innerHeight:720,open(){},alert(){},confirm:()=>true,prompt:()=>null};
 ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
 const run=(file,code)=>vm.runInContext(code,ctx,{filename:file});
 // the same scripts as the page, in the same order (the head scripts only define gunz)
 const T=(l)=>{if(opt.verbose){console.error(l,Date.now()-t0,'ms')}},t0=Date.now();
 run('head-gunz.js',fs.readFileSync(src('boot/gunz.js'),'utf8'));
 const analog=fs.readFileSync(src('analog/order.list'),'utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&s[0]!=='#').map(f=>fs.readFileSync(src('analog/'+f),'utf8')).join('');
 // the DITL script is not needed for the analog engine; the analog script needs a few names of it (it is written to be loaded after it)
 T('start');try{run('ditl-app.js',fs.readFileSync(src('digital/ditl-app.js'),'utf8').replace(/v@@VERSION@@/g,'v'+ver))}catch(e){if(opt.verbose)console.error('ditl-app:',e.message)}
 T('ditl done');run('analog',analog);T('analog script done');
 if(opt.verbose)console.error('types',['loadData','anBuild','AN','ensure','stepSet'].map(n=>n+':'+vm.runInContext('typeof '+n,ctx)).join(' '));
 const AN=vm.runInContext('AN',ctx);AN.setCat('an');/* the page does this when the user opens the analog tab: it loads the sheets */await AN.data;T('data loaded');
 return {AN,win:ctx,ver};
}
module.exports={loadEngine};
