/* Plant Tools web app: records are kept in this browser (localStorage) when the page is not opened inside Claude. */
(function(){
  if(window.claude&&window.claude.use)return;
  var P='plant-tools:';var subs={};
  function read(c){try{return JSON.parse(localStorage.getItem(P+c)||'{}')}catch(e){return {}}}
  function write(c,o){localStorage.setItem(P+c,JSON.stringify(o));fire(c)}
  function snap(c){var o=read(c);return {docs:Object.keys(o).map(function(id){return {id:id,data:function(){return o[id]}}})}}
  function fire(c){(subs[c]||[]).forEach(function(f){try{f(snap(c))}catch(e){}})}
  function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
  function col(c){var q={
    limit:function(){return q},
    onSnapshot:function(ok,bad){(subs[c]=subs[c]||[]).push(ok);setTimeout(function(){try{ok(snap(c))}catch(e){bad&&bad(e)}},0);return function(){subs[c]=subs[c].filter(function(f){return f!==ok})}},
    doc:function(id){id=id||newId();return {id:id,
      set:async function(d){var o=read(c);o[id]=d;write(c,o)},
      update:async function(d){var o=read(c);o[id]=Object.assign({},o[id]||{},d);write(c,o)},
      delete:async function(){var o=read(c);delete o[id];write(c,o)}}}};return q}
  var db={collection:col,
    exportAll:function(){var out={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf(P)===0)out[k.slice(P.length)]=read(k.slice(P.length))}return out},
    importAll:function(o){Object.keys(o).forEach(function(c){write(c,Object.assign(read(c),o[c]))})}};
  window.addEventListener('storage',function(e){if(e.key&&e.key.indexOf(P)===0)fire(e.key.slice(P.length))});
  window.claude={use:async function(n){return n==='db'?db:null}};
  window.plantToolsLocalDb=db;
})();
