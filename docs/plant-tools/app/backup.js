/* Backup bar for the Plant Workbench in the web app: the records live in this browser only, so offer a file copy. */
(function(){
  var db=window.plantToolsLocalDb;if(!db)return;
  var bar=document.createElement('div');bar.className='msg';bar.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0';
  var t=document.createElement('span');t.textContent='Records are saved on this device only.';t.style.flex='1 1 200px';
  var ex=document.createElement('button');ex.type='button';ex.textContent='Save backup file';
  var im=document.createElement('button');im.type='button';im.textContent='Load backup file';
  var inp=document.createElement('input');inp.type='file';inp.accept='application/json,.json';inp.hidden=true;
  ex.onclick=function(){var b=new Blob([JSON.stringify(db.exportAll(),null,1)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='plant-workbench-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)};
  im.onclick=function(){inp.click()};
  inp.onchange=function(){var f=inp.files[0];if(!f)return;f.text().then(function(s){db.importAll(JSON.parse(s));t.textContent='Backup loaded. Records are saved on this device only.'}).catch(function(){t.textContent='That file could not be read as a backup.'});inp.value=''};
  bar.append(t,ex,im,inp);
  var w=document.querySelector('.appbar');if(w)w.after(bar);else document.body.prepend(bar);
})();
