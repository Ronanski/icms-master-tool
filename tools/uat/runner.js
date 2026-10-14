/* UAT runner: runs one test case of one block on the simulator (AN) and compares the result with the expected rows. Used by the generator (dry run) and by the UAT panel. */
window.UATR=(function(){
 const fmt=x=>x==null||!isFinite(x)?'—':Math.abs(x)>=1000?x.toFixed(0):Math.abs(x)>=100?x.toFixed(1):Math.abs(x)>=10?x.toFixed(2):x.toFixed(3);
 function plantOff(){const sv=[];for(const x of AN.sheets)if(x.S)for(const b of x.S.procs||[]){sv.push([b,b.proc.on]);b.proc.on=false}return sv}
 function plantRestore(sv){for(const [b,o] of sv)b.proc.on=o}
 function apply(S,st){for(const n in st.force||{})S.rt.force[n]=st.force[n];for(const n in st.unforce||{})delete S.rt.force[n];for(const n in st.ext||{})S.rt.ext[n]=st.ext[n];for(const id in st.fm||{}){const q=S.rt.st[id];if(q)q.fm=st.fm[id]}for(const id in st.st||{}){const q=S.rt.st[id];if(q)Object.assign(q,st.st[id])}}
 function runCase(sh,c){const S=AN.ensure(sh);
  if(c.skipMsg)return {ok:true,skip:c.skipMsg,rows:[]};
  if(c.reset!==false){AN.reset();plantOff()}
  S.rt.force={};
  let start={};
  for(let i=0;i<c.steps.length;i++){const st=c.steps[i];
   if(i===c.steps.length-1){for(const r of c.rows)if(r.k!=null)start[r.k]=S.rt.v[r.k]}
   apply(S,st);const dt=st.secs>0?.25:0,n=st.secs>0?Math.round(st.secs*4):3;for(let k=0;k<n;k++)AN.stepSet(sh,dt)}
  if(c.skipTrk!=null&&S.rt.st[c.skipTrk]&&S.rt.st[c.skipTrk].trk!=null)return {ok:true,skip:'tracking is active (the downstream selector is on another leg or interlock BU-CMD): the output follows that value, so it is not tested here',rows:[]};
  if(c.skipBu!=null&&S.rt.st[c.skipBu]&&S.rt.st[c.skipBu].bu!=null)return {ok:true,skip:'interlock back-up value (BU-CMD) is active on this selector: it forces its own value, not tested here',rows:[]};
  const out=[];let ok=true;
  for(const r of c.rows){let a=r.st?(S.rt.st[r.st.id]||{})[r.st.f]:S.rt.v[r.k],good,exp;
   if(r.cmp==='inc'){const s0=start[r.k];good=isFinite(a)&&(a>s0+r.d||(r.lim&&s0>=r.lim[1]-0.5));exp='rises (from '+fmt(s0)+')'}
   else if(r.cmp==='dec'){const s0=start[r.k];good=isFinite(a)&&(a<s0-r.d||(r.lim&&s0<=r.lim[0]+0.5));exp='falls (from '+fmt(s0)+')'}
   else if(r.cmp==='delta'){const s0=start[r.k];good=isFinite(a)&&isFinite(s0)&&Math.abs((a-s0)-r.v)<=r.tol;exp='rises by '+fmt(r.v)+' (from '+fmt(s0)+')'}
   else if(r.eqk!=null){const b2=S.rt.v[r.eqk];good=isFinite(a)&&Math.abs(a-b2)<=r.tol;exp='= '+fmt(b2)}
   else{good=isFinite(a)&&Math.abs(a-r.v)<=r.tol;exp=r.txt||fmt(r.v)}
   if(!good)ok=false;out.push({t:r.t,exp,act:fmt(a),ok:good})}
  return {ok,rows:out}}
 function runItem(sh,item){const sv=plantOff();let ok=true;const res=[];try{for(const c of item.cases){const r=runCase(sh,c);res.push({l:c.l,rows:r.rows,ok:r.ok,skip:r.skip});if(!r.ok)ok=false}}finally{plantRestore(sv)}return {ok,res}}
 return {runCase,runItem,fmt,plantOff,plantRestore}})();
