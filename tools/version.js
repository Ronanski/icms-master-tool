// prints the version of the html at the repo root (logic-sim-vX.Y.Z.html); --github writes version/tag/html to $GITHUB_OUTPUT
const fs=require('fs');const f=fs.readdirSync('.').filter(x=>/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x));
if(f.length!==1){console.error('expected exactly one logic-sim-vX.Y.Z.html in the root, found: '+f.join(', '));process.exit(1)}
const v=f[0].match(/v(\d+\.\d+\.\d+)/)[1];
if(process.argv.includes('--github')&&process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`version=${v}\ntag=v${v}\nhtml=${f[0]}\n`);
console.log(v);
