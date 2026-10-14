// Dependency map of the analog closure (OPLAN-L1PAT): which top-level function / const of which file uses which other one, and which ones touch the page (DOM, window, storage).
// Usage: node tools/engine/deps.js                      -> summary of the engine core closure
//        node tools/engine/deps.js --who NAME           -> where NAME is defined and who uses it
const fs=require('fs'),path=require('path');
const {parseAst}=require('rollup/parseAst');
const root=path.resolve(__dirname,'..','..');
const list=fs.readFileSync(path.join(root,'src/analog/order.list'),'utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let code='';const spans=[];for(const f of list){const t=fs.readFileSync(path.join(root,'src/analog',f),'utf8');spans.push({f,a:code.length,b:code.length+t.length});code+=t}
const ast=parseAst(code);
const iife=ast.body[0].expression.callee.body.body;/* (function(){ ... })() */
const fileOf=pos=>(spans.find(s=>pos>=s.a&&pos<s.b)||{}).f;
const tops=new Map();/* name -> {file,start,end,node} */
const declNames=n=>{if(n.type==='FunctionDeclaration')return[n.id.name];if(n.type==='VariableDeclaration')return n.declarations.flatMap(d=>d.id.type==='Identifier'?[d.id.name]:d.id.type==='ObjectPattern'?d.id.properties.map(p=>p.value&&p.value.name).filter(Boolean):d.id.type==='ArrayPattern'?d.id.elements.filter(Boolean).map(e=>e.name).filter(Boolean):[]);return[]};
for(const st of iife)for(const nm of declNames(st))tops.set(nm,{file:fileOf(st.start),start:st.start,end:st.end,st});
/* free variables of a statement (scope aware: parameters, var / let / const / function / catch names of the enclosing functions and blocks are NOT free) */
const patNames=(p,o=[])=>{if(!p)return o;if(p.type==='Identifier')o.push(p.name);else if(p.type==='ObjectPattern')p.properties.forEach(x=>patNames(x.type==='RestElement'?x.argument:x.value,o));else if(p.type==='ArrayPattern')p.elements.forEach(x=>patNames(x,o));else if(p.type==='AssignmentPattern')patNames(p.left,o);else if(p.type==='RestElement')patNames(p.argument,o);return o};
const hoisted=(body,o=new Set())=>{(function w(n){if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(w);return}if(typeof n.type!=='string')return;
  if(n.type==='VariableDeclaration')n.declarations.forEach(d=>patNames(d.id).forEach(x=>o.add(x)));
  if(n.type==='FunctionDeclaration'){o.add(n.id.name);return}/* its own inner names belong to it */
  if(n.type==='ClassDeclaration'&&n.id)o.add(n.id.name);
  if(n.type==='FunctionExpression'||n.type==='ArrowFunctionExpression')return;
  for(const k in n){if(k==='type'||k==='start'||k==='end')continue;w(n[k])}})(body);return o};
const freeIn=(top)=>{const free=new Set();
 const walk=(n,scopes,key,parent)=>{if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(x=>walk(x,scopes,key,parent));return}if(typeof n.type!=='string')return;
  const isFn=n.type==='FunctionDeclaration'||n.type==='FunctionExpression'||n.type==='ArrowFunctionExpression';
  if(isFn){const sc=new Set();n.params.forEach(p=>patNames(p).forEach(x=>sc.add(x)));if(n.type==='FunctionExpression'&&n.id)sc.add(n.id.name);if(n.body&&n.body.type==='BlockStatement')hoisted(n.body.body,sc);else{};
   n.params.forEach(p=>walk(p,[...scopes,sc],'param',n));walk(n.body,[...scopes,sc],'body',n);return}
  if(n.type==='CatchClause'){const sc=new Set(patNames(n.param));walk(n.body,[...scopes,sc],'body',n);return}
  if(n.type==='Identifier'){const isKey=parent&&((parent.type==='MemberExpression'&&key==='property'&&!parent.computed)||(parent.type==='Property'&&key==='key'&&!parent.computed&&!parent.shorthand)||(parent.type==='MethodDefinition'&&key==='key')||(parent.type==='LabeledStatement')||((parent.type==='BreakStatement'||parent.type==='ContinueStatement')));
   const isDecl=parent&&parent.type==='VariableDeclarator'&&key==='id';
   if(!isKey&&!isDecl&&!scopes.some(sc=>sc.has(n.name)))free.add(n.name);return}
  for(const k in n){if(k==='type'||k==='start'||k==='end')continue;walk(n[k],scopes,k,n)}};
 /* the top-level statement itself: a function declaration is analysed as a function, a const as its initialisers */
 if(top.type==='FunctionDeclaration'){const sc=new Set();walk({...top,type:'FunctionExpression',id:null},[sc],null,null)}
 else walk(top,[new Set(hoisted(top.type==='VariableDeclaration'?[]:[]))],null,null);return free};
const idsIn=(node)=>freeIn(node);
const DOMRE=/\bdocument\b|\bwindow\b|localStorage|sessionStorage|indexedDB|requestAnimationFrame|\bnavigator\b|\binnerWidth\b|\bgetBBox\b|innerHTML|createElement|getElementById|\bmsg\(|\$\(|\bh\$\(|\bel\(/;
const info=new Map();for(const [nm,t] of tops){const src=code.slice(t.start,t.end);const ids=idsIn(t.st);info.set(nm,{file:t.file,deps:[...ids].filter(i=>i!==nm&&tops.has(i)),dom:DOMRE.test(src),size:t.end-t.start})}
const args=process.argv.slice(2);
if(args[0]==='--who'){const nm=args[1],i=info.get(nm);console.log(nm,'defined in',i&&i.file,'dom:',i&&i.dom,'size',i&&i.size);console.log('uses:',(i?i.deps:[]).join(', '));console.log('used by:',[...info].filter(([k,v])=>v.deps.includes(nm)).map(([k,v])=>k+' ('+v.file+')').join(', '));process.exit(0)}
/* closure of the core: start from everything declared in reader/ and engine/ */
const isCore=f=>/^(reader|engine)\//.test(f);
const need=new Map();const q=[...info].filter(([k,v])=>isCore(v.file)).map(([k])=>k);
const seen=new Set(q);while(q.length){const k=q.pop();for(const d of info.get(k).deps)if(!seen.has(d)){seen.add(d);q.push(d);need.set(d,k)}}
const outside=[...seen].filter(k=>!isCore(info.get(k).file));
console.log('top-level names:',info.size,'| core (reader+engine) names:',[...info].filter(([k,v])=>isCore(v.file)).length);
console.log('names OUTSIDE reader/engine that the core needs (closure):',outside.length);
const byFile={};for(const k of outside){(byFile[info.get(k).file]=byFile[info.get(k).file]||[]).push(k+(info.get(k).dom?'[DOM]':'')+(need.get(k)?'<'+need.get(k):''))}
for(const f in byFile)console.log('  ',f,':',byFile[f].join(', '));
const domCore=[...info].filter(([k,v])=>isCore(v.file)&&v.dom).map(([k])=>k);console.log('core names that touch the page:',domCore.join(', ')||'none');
/* names the core uses that are declared nowhere in the closure: they must be language / runtime globals (else the engine only works inside the page) */
if(args[0]==='--globals'||args.length===0){const G=new Set(['Math','JSON','Object','Array','Set','Map','Float64Array','Int32Array','Uint8Array','Number','String','parseFloat','parseInt','isFinite','isNaN','Infinity','NaN','Date','RegExp','Error','Symbol','undefined','console','structuredClone','Boolean','WeakMap','WeakSet','TypeError','Function','Promise','arguments','globalThis']);
 const un=new Map();for(const [nm,t] of tops){if(!isCore(info.get(nm).file))continue;for(const id of freeIn(t.st))if(!tops.has(id)&&!G.has(id))(un.get(id)||un.set(id,[]).get(id)).push(nm)}
 console.log('names the core uses that are declared nowhere:',[...un].map(([k,v])=>k+' (in '+v.slice(0,3).join(',')+')').join('; ')||'none')}
