// Desktop shell: starts the simulator copy built into the exe (www/index.html), so it opens at once and works without internet.
// The page itself checks the site for a newer version and asks the user (I-update ngayon / Huwag muna).
const{app,BrowserWindow}=require('electron');const path=require('path');const cfg=require('./config.json');
function make(){const w=new BrowserWindow({width:1400,height:900,backgroundColor:'#10151c',title:cfg.name,autoHideMenuBar:true});
 w.webContents.on('did-fail-load',(e,code,desc,url,main)=>{if(main&&!/offline\.html/.test(url))w.loadFile(path.join(__dirname,'offline.html'),{query:{site:cfg.url}})});
 w.loadFile(path.join(__dirname,'www','index.html'))}
app.whenReady().then(make);app.on('window-all-closed',()=>app.quit());
