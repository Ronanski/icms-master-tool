// Injects the block-by-block UAT (runner + generator + panel) into the html. Usage: node src/ui/uat/inject.js [html]  (idempotent)
const fs=require('fs');
const html=process.argv[2]||fs.readdirSync('dist').map(x=>'dist/'+x).find(x=>/logic-sim-v\d+\.\d+\.\d+(?:-beta\.\d+)?\.html$/.test(x));
const ver=html.match(/v(\d+\.\d+\.\d+(?:-beta\.\d+)?)\.html/)[1];
const MARK_A='<!--UAT-BEGIN-->',MARK_B='<!--UAT-END-->';
let src=fs.readFileSync(html,'utf8');const i=src.indexOf(MARK_A);if(i>=0){const j=src.indexOf(MARK_B);src=src.slice(0,i)+src.slice(j+MARK_B.length)}
const rd=f=>fs.readFileSync(__dirname+'/'+f,'utf8');
let known={};try{known=JSON.parse(rd('known.json'))}catch(e){}
const scen={};for(const f of fs.readdirSync(__dirname+'/scenarios'))if(/^ABC-.*\.json$/.test(f)){const j=JSON.parse(rd('scenarios/'+f));scen[j.sheet]=j}
const block=MARK_A+'<script id="uatdata" type="application/json">'+JSON.stringify({ver,known,scen}).replace(/</g,'\\u003c')+'</script><script id="uatui">'+rd('runner.js')+'\n'+rd('gen.js')+'\n'+rd('scen.js')+'\n'+rd('uat-ui.js')+'</script>'+MARK_B;
const k=src.lastIndexOf('</body>');fs.writeFileSync(html,src.slice(0,k)+block+src.slice(k));
console.log(html,'UAT injected, known mismatches:',Object.values(known).reduce((a,l)=>a+l.length,0));
