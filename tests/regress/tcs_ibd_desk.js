// Plan c2: the turbine trip through the IBD gates, in Node with plant values set by hand (no browser). Usage: node tests/regress/tcs_ibd_desk.js
const fs=require('fs'),vm=require('vm');
const ctx={window:{},console,AN_CD:{Ptrip:.26},AN_UNIT:{},TCS:{},Math,isFinite,Array,Object,String,Number,
 tcsLin:(p,x)=>{for(let i=1;i<p.length;i++)if(x<=p[i][0]){const[a,b]=p[i-1],[c,d]=p[i];return b+(d-b)*(x-a)/(c-a)}return p[p.length-1][1]},
 tcsSteam:U=>({mst:U.mst}),anUnitVal:L=>L.v};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/analog/engine/tcs-ibd-data.js','utf8')+fs.readFileSync('src/analog/engine/tcs-trip.js','utf8')+';this.API={tcsTripScan,tcsTripHold,tcsTripManual,tcsTripReset,tcsTripFault,tcsIbdMissing}',ctx);
const {tcsTripScan,tcsTripHold,tcsTripManual,tcsTripReset,tcsIbdMissing}=ctx.API;
const mk=()=>({MW:150,cdP:.056,mst:540,pist:[{v:96}],rhp:[{v:35},{v:35},{v:35}],loCtl:162.6,loBrg:3.3,loTrip:162.6,tb:{st:'load',rpm:3600},t:0,vtrip:null,tc:{rst:true,Tx:40,trip:''}});
const run=(U,n)=>{for(let i=0;i<n;i++){if(U.tc.trip)tcsTripHold(U,.5);else tcsTripScan(U,.5)}};
const st=U=>({ta1:U.tc.ib.v['TA-1'][3],trip:U.tc.trip});
let fail=0;const ck=(ok,w,U)=>{console.log((ok?'PASS ':'FAIL ')+w+' '+JSON.stringify(st(U)));if(!ok)fail++};
let U=mk();run(U,10);ck(st(U).ta1===1&&!st(U).trip,'150 MW latched, no trip',U);
U.loCtl=100;U.loTrip=100;run(U,10);ck(/CONTROL OIL/.test(st(U).trip),'control oil low trips',U);
U.loCtl=162.6;U.loTrip=162.6;run(U,6);tcsTripReset(U);run(U,8);ck(st(U).ta1===1&&!st(U).trip,'reset after the cause is gone',U);
U.cdP=.3;run(U,6);ck(/VACUUM/.test(st(U).trip),'vacuum trip',U);
U=mk();run(U,10);tcsTripManual(U);run(U,4);ck(st(U).trip==='MANUAL TRIP','manual trip',U);
U=mk();run(U,10);U.mst=380;run(U,12);ck(/MAIN STEAM/.test(st(U).trip),'main steam temperature at load',U);
U=mk();run(U,10);U.tb.rpm=4000;run(U,4);ck(/OVERSPEED/.test(st(U).trip),'overspeed',U);
U=mk();U.tc.rst=false;U.MW=0;U.tb={st:'off',rpm:3};U.cdP=1.03;U.loCtl=0;U.loBrg=0;U.loTrip=0;U.pist[0].v=0;run(U,10);ck(st(U).ta1===0&&!st(U).trip,'cold: not reset, no trip event',U);
U.cdP=.05;U.loCtl=162;U.loBrg=3;U.tc.rst=true;U.tb.st='roll';run(U,1);U.loTrip=162;run(U,10);ck(st(U).ta1===1&&!st(U).trip,'ATS reset latches',U);
console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0);
