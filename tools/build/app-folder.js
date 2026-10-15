// MULTI-FILE na bersyon ng simulator para sa apk (Capacitor) at exe (Electron): mula sa iisang html na gawa ng build.
// Usage: node tools/build/app-folder.js [dist/logic-sim-vX.html] [labas na folder]   (default: dist/logic-sim-v<version>.html  ->  dist/app/)
// Ang laman ay pareho; ang mga malalaking <script> ay inilabas sa js/*.js at ang mga data block (text/plain, application/json) ay nagiging js/data-<id>.js
// na gumagawa ng parehong <script id="..."> element bago ito basahin ng app (document.getElementById(id).textContent). Ang maliliit na script at ang lahat ng <style> ay nananatili sa index.html.
// Hindi ito kasama sa repo (nabubuo sa build / release); ang Pages at ang release asset ay iisang html pa rin.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..','..');
const html=process.argv[2]||path.join(root,'dist',fs.readdirSync(path.join(root,'dist')).find(x=>/^logic-sim-v\d+\.\d+\.\d+(?:-beta\.\d+)?\.html$/.test(x)));
const out=path.resolve(process.argv[3]||path.join(root,'dist','app'));
let s=fs.readFileSync(html,'utf8');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'js'),{recursive:true});
let res='',pos=0,n=0,files=[];
const re=/<script([^>]*)>/g;let m;
while((m=re.exec(s))){const attrs=m[1],start=m.index,bodyStart=m.index+m[0].length,end=s.indexOf('</script>',bodyStart);if(end<0)throw new Error('script not closed at '+start);
 const body=s.slice(bodyStart,end);re.lastIndex=end+9;
 if(/\bsrc=/.test(attrs)||body.length<2000)continue;
 const id=(attrs.match(/\bid="([^"]+)"/)||[])[1]||'';const type=(attrs.match(/\btype="([^"]+)"/)||[])[1]||'';
 n++;const nn=String(n).padStart(2,'0');let name,code;
 if(type&&!/javascript/.test(type)){/* data block: recreate the element so that getElementById(id).textContent works */
  name='data-'+(id||nn)+'.js';
  code='(function(){var e=document.createElement("script");e.type='+JSON.stringify(type)+';'+(id?'e.id='+JSON.stringify(id)+';':'')+'e.textContent='+JSON.stringify(body)+';(document.body||document.documentElement).appendChild(e)})();\n'}
 else{name=nn+'-'+(id||'script')+'.js';code=body+'\n'}
 fs.writeFileSync(path.join(out,'js',name),code);files.push([name,code.length]);
 res+=s.slice(pos,start)+'<script src="js/'+name+'"'+(id&&!type?' id="'+id+'"':'')+'></script>';pos=end+9}
res+=s.slice(pos);
fs.writeFileSync(path.join(out,'index.html'),res);
console.log('app folder:',out,'| index.html',res.length,'bytes |',files.length,'script files:',files.map(f=>f[0]+' '+Math.round(f[1]/1024)+'KB').join(', '));
