// Desktop shell: loads the Logic Sim site (Stable or Beta, chosen at build time in config.json) so the app updates itself.
const{app,BrowserWindow}=require('electron');const path=require('path');const cfg=require('./config.json');
function make(){const w=new BrowserWindow({width:1400,height:900,backgroundColor:'#10151c',title:cfg.name,autoHideMenuBar:true});
 w.webContents.on('did-fail-load',(e,code,desc,url,main)=>{if(main)w.loadFile(path.join(__dirname,'offline.html'),{query:{site:cfg.url}})});
 w.loadURL(cfg.url)}
app.whenReady().then(make);app.on('window-all-closed',()=>app.quit());
