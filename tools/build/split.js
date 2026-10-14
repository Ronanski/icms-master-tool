// ONE-TIME splitter: cuts the single html (logic-sim-vX.Y.Z.html) into the source files under src/ (template, scripts, css, data).
// After this the sources are the truth and tools/build/build.js builds the html again, byte for byte. Usage: node tools/build/split.js [html]
const fs=require('fs'),path=require('path');
const html=process.argv[2]||fs.readdirSync('.').find(x=>/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x));
const ver=html.match(/v(\d+\.\d+\.\d+)/)[1];
if(fs.existsSync('src')&&!process.argv.includes('--force')){console.error('src/ already exists: the sources are the truth now. Use --force only to start again from the html (it deletes src/).');process.exit(1)}
let s=fs.readFileSync(html,'utf8');
// 1. the blocks that other tools inject (shell, hmi, theme, uat) are not part of the sources: build.js injects them again
const i0=s.indexOf('<!--SHELL-BEGIN-->'),i1=s.indexOf('<!--UAT-END-->');
if(i0<0||i1<0)throw new Error('injected blocks not found');
s=s.slice(0,i0)+s.slice(i1+'<!--UAT-END-->'.length);
// 2. the version is stamped by the build
s=s.split('v'+ver).join('v@@VERSION@@');
if(s.includes(ver))throw new Error('version '+ver+' is still in the text after the stamp: '+s.indexOf(ver));
const out=(p,t)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t)};
fs.rmSync('src',{recursive:true,force:true});
const parts=[{re:/<script>/,n:0}];
let tpl='',pos=0;const take=(a,b,rel,wrap)=>{tpl+=s.slice(pos,a)+wrap[0]+'@@FILE:'+rel+'@@'+wrap[1];out('src/'+rel,s.slice(a,b));pos=b};
const re=/<(script|style)\b([^>]*)>(.*?)<\/\1>/gs;let m,k=0;const names={};
const plan=[];
while((m=re.exec(s))){const a=m.index+m[0].indexOf('>')+1,b=a+m[3].length,tag=m[1],at=m[2].trim();plan.push({a,b,tag,at,len:m[3].length})}
// name each block
const nm=p=>{const id=(/id="([^"]+)"/.exec(p.at)||[])[1];if(id==='pre')return 'data/pre.txt';if(id==='aln')return 'data/aln.json';if(id==='ades')return 'data/ades.txt';if(id==='apre')return 'data/apre.txt';if(id==='analogjs')return null;
 if(p.tag==='style')return 'css/app.css';if(p.len>100000)return 'js/ditl-app.js';return null};
let headN=0;
for(const p of plan){let rel=nm(p);if(p.at===''&&p.tag==='script'&&p.len<5000)rel=['js/head-gunz.js','js/head-update.js','js/head-errbanner.js'][headN++];
 if(p.tag==='script'&&/id="analogjs"/.test(p.at)){// the analog app: cut at line boundaries into ordered parts
  const js=s.slice(p.a,p.b),lines=js.split('\n');
  /* sections of the analog app, cut at its own banner comments (line numbers, 1-based): reader, builder, engine, plant, UI ... */
  const SEC=[[1,'01-reader-dxf'],[51,'02-builder-shapes-nets'],[147,'03-builder-nets-pins'],[214,'04-builder-blocks'],[321,'05-builder-pins-params'],[484,'06-engine-compile-step'],[836,'07-engine-plant'],[983,'08-ui-main'],[1108,'09-ui-hmi-view'],[1264,'10-ui-hmi-v2'],[1337,'11-data-loader'],[1432,'12-ui-category-search'],[1532,'13-links-canvas'],[1816,'14-ui-paint'],[1945,'15-ui-interaction'],[1998,'16-ui-trace'],[2139,'17-ui-panel'],[2273,'18-ui-plant-window'],[2547,'19-ui-tables-health'],[2616,'20-boot']];
  SEC.forEach(([a0,name],i)=>{const b0=i+1<SEC.length?SEC[i+1][0]-1:lines.length;out('src/js/analog/'+name+'.js',lines.slice(a0-1,b0).join('\n')+(i+1<SEC.length?'\n':''))});
  tpl+=s.slice(pos,p.a)+'@@INCLUDE:js/analog@@';pos=p.b;continue}
 if(!rel)throw new Error('no name for block '+p.at+' len '+p.len);
 tpl+=s.slice(pos,p.a)+'@@FILE:'+rel+'@@';out('src/'+rel,s.slice(p.a,p.b));pos=p.b}
tpl+=s.slice(pos);
out('src/index.template.html',tpl);out('src/version.txt',ver+'\n');
console.log('split',html,'->','src/ (template',tpl.length,'chars)');
