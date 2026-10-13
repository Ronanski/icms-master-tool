// Injects the block-by-block UAT (runner + generator + panel) into the html. Usage: node tools/uat/inject.js [html]  (idempotent)
const fs=require('fs');
const html=process.argv[2]||fs.readdirSync('.').find(x=>/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x));
const ver=html.match(/v(\d+\.\d+\.\d+)/)[1];
const MARK_A='<!--UAT-BEGIN-->',MARK_B='<!--UAT-END-->';
let src=fs.readFileSync(html,'utf8');const i=src.indexOf(MARK_A);if(i>=0){const j=src.indexOf(MARK_B);src=src.slice(0,i)+src.slice(j+MARK_B.length)}
const rd=f=>fs.readFileSync(__dirname+'/'+f,'utf8');
let known={};try{known=JSON.parse(rd('known.json'))}catch(e){}
const block=MARK_A+'<script id="uatdata" type="application/json">'+JSON.stringify({ver,known}).replace(/</g,'\\u003c')+'</script><script id="uatui">'+rd('runner.js')+'\n'+rd('gen.js')+'\n'+rd('uat-ui.js')+'</script>'+MARK_B;
const k=src.lastIndexOf('</body>');fs.writeFileSync(html,src.slice(0,k)+block+src.slice(k));
console.log(html,'UAT injected, known mismatches:',Object.values(known).reduce((a,l)=>a+l.length,0));
