// Engine in ISOLATION (OPLAN-L1PAT): the reader + engine files (src/analog/reader, src/analog/engine) are run ALONE in a bare Node vm: no document, no window,
// none of the page / UI files. For all 54 sheets they must give exactly the same value on every net as the full simulator after the same 30 s of simulation.
// Usage: node tests/engine/isolated.js        (about 1 minute; the full simulator is loaded once as the reference)
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..');
const {loadEngine}=require(path.join(root,'tools','engine','node-engine.js'));
const list=fs.readFileSync(path.join(root,'src/analog/order.list'),'utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
const coreFiles=list.filter(f=>/^(reader|engine)\//.test(f));
const core=coreFiles.map(f=>fs.readFileSync(path.join(root,'src/analog',f),'utf8')).join('\n').replace(/^\(function\(\)\{/,'');/* the files are pieces of one closure: the first opens it, boot.js closes it */
const STEPS=60,DT=.5;
(async()=>{
 /* the page builds the sheet models in an order of its own (search index, links); the model of a sheet depends a little on that order, so the probe records it and the isolated engine does the same */
 const {AN:full}=await loadEngine({patch:c=>c.replace('function ensure(sh){if(sh.S)return sh.S;','function ensure(sh){if(sh.S)return sh.S;(AN.__ord=AN.__ord||[]).push(sh.name);')});
 const order=full.__ord||[];
 const sheets=full.sheets.map(s=>({name:s.name,json:JSON.stringify(s.R)}));/* the drawings as the reader gave them, before any use */
 /* the isolated context: only the language itself; AN is the one object the engine may use */
 const ctx={console,Math,JSON,Object,Array,Set,Map,Float64Array,Int32Array,Uint8Array,Number,String,parseFloat,parseInt,isFinite,isNaN,Infinity,NaN,Date,RegExp,Error,Symbol,structuredClone};
 vm.createContext(ctx);
 ctx.__aln=fs.readFileSync(path.join(root,'src/data/aln.json'),'utf8');
 vm.runInContext('var AN={plantOn:true,ramp:0,sv:{},lne:{},ln:{},sheets:[],lnSrc:()=>JSON.parse(__aln)}',ctx);
 let api;try{api=vm.runInContext('(function(){'+core+'\n;return {ensure,stepSet,anStep,anResetAll}})()',ctx,{filename:'engine-core'})}catch(e){console.log('LOAD ERROR:',e.message);process.exit(1)}
 console.log('engine core:',coreFiles.length,'files,',(core.length/1024|0),'KB: no document, no window, no UI');
 ctx.__sheets=sheets;vm.runInContext('AN.sheets=__sheets.map(s=>({name:s.name,R:JSON.parse(s.json)}))',ctx);
 const iso=vm.runInContext('AN.sheets',ctx);
 let bad=0,nets=0,err=null,fresh=null;
 try{/* the page builds the model of every sheet when it loads the data (search index, links): the same here, in the same order, before any stepping */const ord=order.map(n=>iso.findIndex(x=>x.name===n)).filter(i=>i>=0);for(const i of iso.keys())if(!ord.includes(i))ord.push(i);for(const i of ord)api.ensure(iso[i]);
  for(let i=0;i<iso.length;i++){full.ensure(full.sheets[i]);for(let k=0;k<STEPS;k++){api.stepSet(iso[i],DT);full.stepSet(full.sheets[i],DT)}
   const a=iso[i].S.rt.v,b=full.sheets[i].S.rt.v;nets+=a.length;let d=0;for(let n=0;n<a.length;n++)if(!(Math.abs(a[n]-b[n])<1e-9)&&!(a[n]!==a[n]&&b[n]!==b[n]))d++;
   if(d||iso[i].S.blk.length!==full.sheets[i].S.blk.length){bad++;const ex=[];for(let n=0;n<a.length&&ex.length<3;n++)if(!(Math.abs(a[n]-b[n])<1e-9)){const L=iso[i].S.lab[n];ex.push((L&&L.t||'n'+n)+' '+(+a[n]).toFixed(4)+' / '+(+b[n]).toFixed(4))}console.log('  DIFFERENT',iso[i].name,'nets',d,'of',a.length,'| isolated / full:',ex.join(' ; '))}}}catch(e){err=e;console.log('ERROR in the isolated engine:',e.message.slice(0,200))}
 /* RESET (anResetAll, now in the engine): after 30 s of simulation, Reset must give every net the same start value as the first Reset */
 let rb=0;try{api.anResetAll();fresh=iso.map(s=>Float64Array.from(s.S.rt.v));/* the start of every sheet = the state after a Reset (the model of a sheet depends a little on the order in which the sheets were built; Reset settles all sheets in one fixed order) */
  for(const s of iso)for(let k=0;k<STEPS;k++)api.stepSet(s,DT);api.anResetAll();iso.forEach((s,i)=>{const a=s.S.rt.v;let d=0;for(let n=0;n<a.length;n++)if(!(Math.abs(a[n]-fresh[i][n])<1e-6))d++;if(d){rb++;if(rb<=5)console.log('  RESET differs from the start:',s.name,d,'nets')}})}catch(e){rb=1;console.log('RESET error:',e.message.slice(0,160))}
 console.log(rb?'FAIL':'PASS','engine Reset: all nets of the sheets are back to the start values after 30 s of simulation (sheets that differ:',rb+')');if(rb)bad++;
 console.log(bad||err?'FAIL':'PASS','all',iso.length,'sheets,',nets,'nets: the engine alone gives the same value on every net as the full simulator after',STEPS*DT,'s');
 process.exit(bad||err?1:0);
})();
