// Desktop shell: starts the simulator copy built into the exe (www/index.html), so it opens at once and works without internet.
// The page itself checks the site for a newer version and asks the user (I-update ngayon / Huwag muna).
const{app,BrowserWindow}=require('electron');const path=require('path');const cfg=require('./config.json');
// 2.4.0: the app is named DCS Logic Simulator; the saved settings stay in the folder of the old name (Logic Sim)
app.setPath('userData',path.join(app.getPath('appData'),'Logic Sim'));
function make(){const w=new BrowserWindow({width:1400,height:900,backgroundColor:'#10151c',title:cfg.name,autoHideMenuBar:true,icon:path.join(__dirname,'icon.png')});
 // 2.4.0: the PLANT VIEW opens in its own window (window.open from the page): same look and icon as the main window
 w.webContents.setWindowOpenHandler(()=>({action:'allow',overrideBrowserWindowOptions:{autoHideMenuBar:true,backgroundColor:'#10151c',icon:path.join(__dirname,'icon.png')}}));
 w.webContents.on('did-fail-load',(e,code,desc,url,main)=>{if(main&&!/offline\.html/.test(url))w.loadFile(path.join(__dirname,'offline.html'),{query:{site:cfg.url}})});
 w.loadFile(path.join(__dirname,'www','index.html'))}
app.whenReady().then(make);app.on('window-all-closed',()=>app.quit());
