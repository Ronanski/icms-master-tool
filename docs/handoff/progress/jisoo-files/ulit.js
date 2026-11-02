// usage: node ulit.js <html> <step.json>
// step.json: {done:"1 / 14", nf:"5", row:"<js row literal>", findings:["<js F literal>",...], fix:{"#":"text"}, extra:[[from,to],...]}
const fs=require("fs");const f=process.argv[2];const d=JSON.parse(fs.readFileSync(process.argv[3],"utf8"));
let s=fs.readFileSync(f,"utf8");
const rep=(a,b)=>{const t=s.replace(a,b);if(t===s)throw new Error("no match: "+a);s=t;};
if(!s.includes("/*ULIT_END*/")){
  rep("const ROWS=[\n","const ROWS=[\n/*ULIT_END*/\n");
  rep('<section class="strip" aria-label="Buod">','<section class="strip" aria-label="Buod">\n    <div class="kpi" style="border-color:#e5484d"><b id="ulit">0 / 14</b><span>ULIT H3 ~ H16, buong 12 check</span></div>\n    <div class="kpi" style="border-color:#e5484d"><b id="ulitf">0</b><span>bagong findings sa ulit (#92 ~)</span></div>');
  rep(/<h1>.*?<\/h1>/,"<h1>Live Retest · ULIT H3 → H16, buong 12 check (beta.77)</h1>");
}
s=s.replace(/<b id="ulit">.*?<\/b>/,'<b id="ulit">'+d.done+'</b>').replace(/<b id="ulitf">.*?<\/b>/,'<b id="ulitf">'+d.nf+'</b>');
if(d.row) rep("/*ULIT_END*/",d.row+",\n/*ULIT_END*/");
if(d.findings&&d.findings.length) rep("const F=[\n","const F=[\n"+d.findings.map(x=>" "+x+",").join("\n")+"\n");
for(const k in (d.fix||{})) rep("const FIX={",'const FIX={"'+k+'":'+JSON.stringify(d.fix[k])+",");
for(const [a,b] of (d.extra||[])) rep(a,b);
fs.writeFileSync(f,s);console.log("ok");
