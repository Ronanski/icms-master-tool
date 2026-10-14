// Builds logic-sim-vX.Y.Z.html from the sources in src/ (template + scripts + css + data), then puts in the blocks that the other tools inject
// (shell, operator faceplate, themes, UAT). The result is ONE html file (works without internet in the apk / exe).
// Usage: node tools/build/build.js            -> writes ./logic-sim-v<version>.html (version = src/version.txt)
//        node tools/build/build.js --out DIR  -> writes the html into DIR (the old html files in the repo are not touched)
//        node tools/build/build.js --check    -> builds in a temporary folder and compares with the committed html (exit 1 if different)
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'..','..'),src=p=>path.join(root,'src',p);
const ver=fs.readFileSync(src('version.txt'),'utf8').trim();
const rd=p=>fs.readFileSync(src(p),'utf8');
/* a .list file = the files of one script in order (paths relative to the folder of the list; # = comment) */
const fileList=l=>{const d=path.posix.dirname(l);return rd(l).split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&s[0]!=='#').map(f=>d+'/'+f)};
function assemble(){let t=rd('index.template.html');
 t=t.replace(/@@LIST:([\w\/.-]+)@@/g,(m,l)=>fileList(l).map(rd).join(''));
 t=t.replace(/@@FILE:([\w\/.-]+)@@/g,(m,f)=>rd(f));
 return t.split('@@VERSION@@').join(ver)}
function build(dir){const file=path.join(dir,'logic-sim-v'+ver+'.html');fs.writeFileSync(file,assemble());
 for(const t of['shell','hmi','theme','uat'])cp.execFileSync('node',[path.join(root,'tools',t,'inject.js'),file],{cwd:root,stdio:'pipe'});
 return file}
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const oi=process.argv.indexOf('--out');
if(oi>0){const d=path.resolve(process.argv[oi+1]);fs.mkdirSync(d,{recursive:true});console.log('built',build(d))}else if(process.argv.includes('--check')){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'logicsim-build-')),f=build(tmp),cur=path.join(root,'logic-sim-v'+ver+'.html');
 if(!fs.existsSync(cur)){console.error('the committed html logic-sim-v'+ver+'.html does not exist');process.exit(1)}
 const a=sha(f),b=sha(cur);console.log('built    ',a,fs.statSync(f).size,'bytes\ncommitted',b,fs.statSync(cur).size,'bytes');
 if(a!==b){console.error('DIFFERENT: run "node tools/build/build.js" and commit the html');process.exit(1)}console.log('SAME: the committed html is exactly what the sources build');
}else{
 const f=build(root);for(const x of fs.readdirSync(root))if(/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x)&&x!==path.basename(f))fs.unlinkSync(path.join(root,x));
 console.log('built',f,fs.statSync(f).size,'bytes');}
