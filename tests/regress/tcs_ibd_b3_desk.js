// c2 batch 3 (3.2.3): IBD inputs bound to the model (TA-17 / 18 vibration, TD-2 bearing metal, TA-20 HP exhaust, TD-1 oil, TD-4 shell expansion), in Node. Usage: node tests/regress/tcs_ibd_b3_desk.js
const fs=require('fs'),vm=require('vm');
const ctx={window:{},console,AN_CD:{Ptrip:.26},AN_UNIT:{},TCS:{},Math,isFinite,Array,Object,String,Number,
 tcsOilState:U=>U.tc||U.tco,tcsOilSet:c=>{c.lop=!!(c.mop[0]||c.mop[1]);c.eh=!!(c.cop[0]||c.cop[1])},tcsLin:(p,x)=>{for(let i=1;i<p.length;i++)if(x<=p[i][0]){const[a,b]=p[i-1],[c,d]=p[i];return b+(d-b)*(x-a)/(c-a)}return p[p.length-1][1]},
 tcsSteam:U=>({mst:U.mst}),anUnitVal:L=>L.v};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/analog/engine/tcs-ibd-data.js','utf8')+fs.readFileSync('src/analog/engine/tcs-trip.js','utf8')+';this.API={tcsTripScan,tcsTripHold}',ctx);
const {tcsTripScan,tcsTripHold}=ctx.API;
const oil=()=>({lop:true,eh:true,mop:[true,false],mopAu:[false,true],cop:[true,false],copAu:[false,true]});
const mk=()=>({loPa:6.1,loPb:0,loCa:163,loCb:0,MW:150,cdP:.056,mst:540,pist:[{v:96}],rhp:[{v:35},{v:35},{v:35}],loCtl:162.6,loBrg:3.3,loTrip:162.6,tb:{st:'load',rpm:3600},t:0,vtrip:null,
 loVx1:.033,loVy1:.035,loVx2:.038,loVy2:.028,loVx3:.016,loVy3:.016,loVx4:.063,loVy4:.037,loM1:91,loM2:102,loM3:80,loM4:78,loThF:54.5,loThR:61.5,loTout:46,xt:{T:{cr:370}},genT:{ts:[81,84,81,83,79,84],ta:[39,38,43,44],ex:80},
 tc:{rst:true,Tx:40,trip:'',Thp:480,Trh:480,sexp:8,...oil()}});
const run=(U,n)=>{for(let i=0;i<n;i++){if(U.tc.trip)tcsTripHold(U,.5);else tcsTripScan(U,.5)}};
let fail=0;const ck=(ok,w,x)=>{console.log((ok?'PASS ':'FAIL ')+w+(x!==undefined?' '+JSON.stringify(x):''));if(!ok)fail++};
const v=(U,id)=>U.tc.ib.v[id];
let U=mk();run(U,10);
ck(!U.tc.trip,'150 MW: no trip',U.tc.trip);
ck(v(U,'TA-18')[9]===1,'TA-18 no HIGH vibration: ATS 1.24 OK (NOT = 1)');
ck(v(U,'TD-2')[6]===1&&v(U,'TD-2')[17]===1,'TD-2 bearing temps normal: ATS 1.30 / 1.31 = 1',[v(U,'TD-2')[6],v(U,'TD-2')[17]]);
ck(v(U,'TA-20')[7]===370,'TA-20 HP exhaust MID = 370',v(U,'TA-20')[7]);
ck(v(U,'TD-1')[14]===1,'TD-1 oil 46 C at rated speed: bearing oil temp OK (after 60 s)',v(U,'TD-1')[14]);
ck(v(U,'TD-4')[6]===1,'TD-4 shell expansion 8 mm NORMAL',v(U,'TD-4')[6]);
U.loM2=116;run(U,4);ck(v(U,'TD-2')[6]===0&&!U.tc.trip,'No.2 journal 116 C: ATS 1.30 off, alarm only',v(U,'TD-2')[25]);
U=mk();run(U,10);U.loVx4=.13;run(U,4);ck(v(U,'TA-18')[9]===0&&!U.tc.trip,'No.4 X 0.13 mm: HIGH, no trip');
U.loVx1=.21;run(U,10);ck(/VIBRATION/.test(U.tc.trip),'No.1 X 0.21 mm VERY HIGH + other HIGH: trip after 3 s',U.tc.trip);
U=mk();run(U,10);U.loVx1=.21;run(U,10);ck(!U.tc.trip,'No.1 X 0.21 mm alone (no other HIGH): no trip (note *2)',U.tc.trip);
U=mk();run(U,10);U.loVx2=.21;run(U,10);ck(!U.tc.trip,'No.2 X 0.21 mm alone: no trip',U.tc.trip);U.loVy3=.13;run(U,10);ck(/VIBRATION/.test(U.tc.trip),'No.2 X 0.21 mm + No.3 Y HIGH 0.13 mm: trip',U.tc.trip);
U=mk();run(U,10);U.xt.T.cr=425;run(U,6);ck(/EXHAUST/.test(U.tc.trip),'HP exhaust 425 C: trip',U.tc.trip);
U=mk();run(U,4);ck(v(U,'GD-5')[23]===0,'GD-5 generator temperatures normal: no alarm');U.genT.ts[1]=124;run(U,2);ck(v(U,'GD-5')[23]===1&&!U.tc.trip,'GD-5 stator coil 124 C: GENERATOR ALARM, no trip');
console.log(fail?"FAILED "+fail:"ALL PASS");process.exit(fail?1:0);
