// Builds the Plant Tools web app (docs/plant-tools/app/) from the pages in this folder.
// Run: node docs/plant-tools/build-app.js      Check only (no write): node docs/plant-tools/build-app.js --check
// The app is plain files: it runs from any web server or from the repo website at /tools/, installs like an app, and works offline.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const D=__dirname,OUT=path.join(D,'app'),SRC=path.join(D,'app-src');
const PAGES=[ // [output file, source, artifact id of the Claude copy]
 ['index.html','plant-tools-list/plant-tools.html','CLWF6fLkvX8VNvtbjfYLwS'],
 ['tag-lookup.html','tag-lookup/tag-lookup.html','DxJaK1sZU45T1VNfuJbQTW'],
 ['signal-path-finder.html','signal-path-finder/signal-path-finder.html','2A5FFvEhkDPnggoM4i95wk'],
 ['plant-workbench.html','plant-workbench/plant-workbench.html','4fXaZ2RGqamjnCRb9pYXhJ'],
 ['connection-lessons.html','connection-lessons/connection-lessons.html','NrXakPC4qHBDZagBt3Ztt1'],
 ['drum-swell-lab.html','tutor-pages/drum-swell-lab.html','DGPMzcCw3VC6dhpyyTrXdx'],
 ['breaker-lab.html','tutor-pages/breaker-lab.html','9sa5hstmeApg1YSkArA1sM'],
 ['sync-lab.html','tutor-pages/sync-lab.html','JYehhTtobFpiBNDmJxMRri'],
 ['cv-demand-lab.html','tutor-pages/cv-demand-lab.html','FUxNzDMV4Ms5HwLyCZL96w'],
 ['transfer-lab.html','tutor-pages/transfer-lab.html','Wiy6NDxu7oSUiFDzc4jahC'],
 ['turbine-valves.html','tutor-pages/turbine-valves-standard.html','KuTyWZpGoB1RsLZGEMGU3A'],
 ['gen-voltage-bc-flow.html','tutor-pages/gen-voltage-bc-flow.html','KVddKmqbHmxh7fj9e5Fekz'],
 ['gen-voltage-bc-troubleshooter.html','tutor-pages/gen-voltage-bc-troubleshooter.html','RUet573mt7QS675aqFfjqK'],
 ['ai-in-plant.html','tutor-pages/ai-in-plant.html','RrhP6eonrHX7njzh6uStbT'],
 ['gen-metering-hardware.html','tutor-pages/gen-metering-hardware.html','VDNq62a8JjwcVG21sUsX7K'],
];
const HEAD='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
 +'<meta name="theme-color" content="#1f5fae"><link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png">'
 +'<link rel="stylesheet" href="fonts.css"><style>*,*::before,*::after{box-sizing:border-box}html,body{margin:0}</style></head><body>';
const TAIL='<script>if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("sw.js")</script></body></html>';
const files={};
for(const [out,src,id] of PAGES){
  let s=fs.readFileSync(path.join(D,src),'utf8');
  s=s.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>\s*/g,'').replace(/<meta name="claude:[^>]*>\s*/g,'');
  for(const [o,,i] of PAGES)s=s.split('https://claude.ai/artifact/'+i).join(o);
  // links inside the app open in the same window
  s=s.replace(/(<a\b[^>]*href="[a-z0-9-]+\.html[^"]*"[^>]*?)\s+target="_blank"(\s+rel="noopener")?/g,'$1');
  // links built by script: inside the app they open in the same window; only a link to another site opens a new tab
  const sw=(from,to)=>{if(!s.includes(from))throw new Error(out+': expected text not found: '+from);s=s.split(from).join(to)};
  if(out==='index.html')sw(`'<a class="tool" href="'+x[4]+'" target="_blank" rel="noopener">'`,`'<a class="tool" href="'+x[4]+'"'+(/^http/.test(x[4])?' target="_blank" rel="noopener"':'')+'>'`);
  if(out==='tag-lookup.html')sw('<a href="${FINDER}" target="_blank" rel="noopener">','<a href="${FINDER}">');
  if(out==='index.html')sw('Pick a card to open the tool in a new tab.','Pick a card to open the tool.');
  if(out==='plant-workbench.html')sw('Shared records for the team. Everything saved here is kept for everyone who can open this page.','Records for the shift. Everything saved here is kept on this device; save a backup file to move it to another device.');
  let pre='';
  if(out==='plant-workbench.html'){pre='<script src="local-db.js"></script>';s+='<script src="backup.js"></script>'}
  files[out]=HEAD+pre+s+TAIL;
}
files['fonts.css']=[400,500,600].map(w=>`@font-face{font-family:"IBM Plex Sans";font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/ibm-plex-sans-latin-${w}-normal.woff2) format("woff2")}`).join('\n')+'\n';
files['manifest.webmanifest']=JSON.stringify({name:'Plant Tools',short_name:'Plant Tools',description:'Tools for the instrumentation and control section: find a signal, run the shift, learn the plant.',start_url:'./index.html',scope:'./',display:'standalone',background_color:'#f6f7f9',theme_color:'#1f5fae',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},null,1)+'\n';
for(const f of ['local-db.js','backup.js'])files[f]=fs.readFileSync(path.join(SRC,f),'utf8');
const bin=['icon-192.png','icon-512.png','fonts/ibm-plex-sans-latin-400-normal.woff2','fonts/ibm-plex-sans-latin-500-normal.woff2','fonts/ibm-plex-sans-latin-600-normal.woff2'];
const h=crypto.createHash('sha1');Object.keys(files).sort().forEach(k=>h.update(k+files[k]));bin.forEach(b=>h.update(fs.readFileSync(path.join(SRC,b))));
const ver=h.digest('hex').slice(0,10);
files['sw.js']=`// Plant Tools web app: keeps every page on the device so the app opens without a network.
const C='plant-tools-${ver}';const FILES=${JSON.stringify(['./',...Object.keys(files).filter(f=>f!=='sw.js'),...bin])};
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith('plant-tools-')&&n!==C).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)))});
`;
const check=process.argv.includes('--check');let bad=0;
for(const [f,c] of Object.entries(files)){const p=path.join(OUT,f);
  if(check){if(!fs.existsSync(p)||fs.readFileSync(p,'utf8')!==c){console.log('differs:',f);bad++}}
  else{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,c)}}
if(!check)for(const b of bin){const p=path.join(OUT,b);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(path.join(SRC,b),p)}
const left=Object.entries(files).filter(([f,c])=>/\.html$/.test(f)&&/claude\.ai\/artifact\//.test(c)).map(([f,c])=>f+': '+[...new Set(c.match(/claude\.ai\/artifact\/\w+/g))].join(' '));
console.log((check?'checked ':'built ')+Object.keys(files).length+' files, version '+ver+(left.length?'\nlinks that still go to Claude: '+left.join('; '):''));
process.exit(bad?1:0);
