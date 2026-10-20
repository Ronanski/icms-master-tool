// Adds DITL drawings (DXF) to the built-in DITL sheets (src/data/pre.txt): each DXF is read with the app's own reader (parse + build,
// the same code as the "Import DXF" of the DITL page) and written as one line of pre.txt. A sheet with the same name is replaced.
// Usage: node tools/data/ditl_import.js <prefix> <file.dxf>...   (the sheet name = "(<prefix><n>)DITL-<code>", from "(n)Ditl<code>.dxf")
const fs=require('fs'),path=require('path'),zlib=require('zlib'),vm=require('vm');
const {loadEngine}=require('../engine/node-engine.js');
const PRE=path.join(__dirname,'..','..','src','data','pre.txt');
(async()=>{const [prefix,...files]=process.argv.slice(2);if(!files.length){console.log('usage: ditl_import.js <prefix> <file.dxf>...');process.exit(1)}
 const {win}=await loadEngine();
 const lines=zlib.gunzipSync(Buffer.from(fs.readFileSync(PRE,'utf8').trim(),'base64')).toString().split('\n').filter(Boolean);
 const byName=new Map(lines.map((l,i)=>[JSON.parse(l).name,i]));
 for(const f of files){const m=/^\((\d+)\)\s*Ditl\s*-?\s*(\w+)\.dxf$/i.exec(path.basename(f));if(!m){console.log('SKIP (name)',f);continue}
  const name='('+prefix+m[1]+')DITL-'+m[2].toUpperCase();
  win.__t=fs.readFileSync(f,'latin1');win.__n=name;
  let o;try{o=vm.runInContext('(()=>{const s=build(parse(__t),__n);if(!s)return null;s.name=__n;delete s.nl;return JSON.stringify(s)})()',win)}catch(e){o=null;console.log('FAIL',name,e.message)}
  if(!o){console.log('SKIP (no rows: not a logic sheet)',name);continue}
  if(byName.has(name))lines[byName.get(name)]=o;else{byName.set(name,lines.length);lines.push(o)}
  console.log('OK',name)}
 fs.writeFileSync(PRE,zlib.gzipSync(Buffer.from(lines.join('\n')+'\n'),{level:9}).toString('base64')+'\n');
 console.log(lines.length,'sheets in pre.txt');
})();
