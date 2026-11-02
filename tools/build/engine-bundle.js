// The analog ENGINE alone as one script (3.2.0 Web Worker, stage a): the reader and engine files of src/analog/order.list in their order
// (the scheduler engine/sched.js is the page's), inside one closure like the page bundle, with the few page hooks the engine calls, in
// their engine form: AN.lnSrc (the LINEAR data), AN.reset (anResetAll + 6 scans of the current sheet, loader.js reset), AN.settle
// (6 scans of the current sheet, panel.js settle), AN.plantSwitch (plant-window.js, engine part). No DOM.
// bundle({aln}) -> code; the code defines globalThis.ENGINE = { AN, E: { ensure, stepSet, ... } }. Used by the worker build (stage d)
// and by tests/regress/eng_headless.js.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..', '..'), A = path.join(root, 'src', 'analog');
function files() {
  return fs.readFileSync(path.join(A, 'order.list'), 'utf8').split(/\r?\n/).map(s => s.trim())
    .filter(s => s && s[0] !== '#' && /^(reader|engine)\//.test(s) && s !== 'engine/sched.js');
}
function bundle(o) {
  o = o || {};
  const aln = o.aln != null ? o.aln : fs.readFileSync(path.join(root, 'src', 'data', 'aln.json'), 'utf8').trim();
  const body = files().map(f => {
    let s = fs.readFileSync(path.join(A, f), 'utf8');
    /* the page bundle opens its closure in the first file (reader/dxf.js) and closes it in boot.js */
    if (f === 'reader/dxf.js') s = s.replace(/^\(function\(\)\{/, '');
    return '/* ---- ' + f + ' ---- */\n' + s;
  }).join('\n');
  /* the AN of the page (ui/main.js), the fields the engine reads */
  const core = 'const AN={cat:"an",sheets:[],i:-1,run:false,spd:1,sv:{},lne:{},av:{},ws:{},plantUi:{}};\n' +
    'Object.defineProperty(AN,"ln",{get:()=>globalThis.ANLN||{},set:v=>{globalThis.ANLN=v}});\n';
  const hooks = 'Object.assign(AN,anEngAPI());\n' +
    'AN.lnSrc=()=>(' + aln + ');\n' +
    /* the descriptions (engine/ds.js ADES): the host puts them in (the page: data/loader.js adesLoad from its #ades data) */
    'AN.ades=()=>Promise.resolve(ADES||{});AN.adesPut=d=>{ADES=d};\n' +
    'const anCur=()=>AN.sheets[AN.i]||AN.sheets.find(x=>/057/.test(x.name));\n' +
    'AN.reset=()=>{anResetAll();const c=anCur();if(c&&c.S)for(let i=0;i<6;i++)stepSet(c,0)};\n' +
    'AN.settle=()=>{const c=anCur();if(c&&c.S)for(let i=0;i<6;i++)stepSet(c,0)};\n' +
    'AN.plantSwitch=on=>{AN.plantOn=!!on;for(const sh of AN.sheets){if(!sh.S)continue;for(const b of sh.S.procs||[])if(b.proc)b.proc.on=!!on;if(!on){sh.S.rt.pm={};sh.S.plantT=null;sh.S._rem=0}}};\n' +
    'globalThis.ENGINE={AN,E:{ensure,stepSet,anResetAll,anPlantLoad150,anPlantCold}};\n';
  return '(function(){\n' + core + body + '\n;\n' + hooks + '})();\n';
}
/* 3.2.0 Web Worker, stage b: the whole engine, the one world: the DITL engine parts of src/digital/order.list (up to 03d-state.js:
   parse, netlist, models, simulation, reader, keyframe; one global script as in the page), the analog engine above (its AN on globalThis, as
   ui/main.js puts it on window), then src/world/world.js, plantsw.js, ditl150.js and eng.js (the radio). The host gives msg (the page: the toast). */
function dFiles() {
  const D = path.join(root, 'src', 'digital');
  const l = fs.readFileSync(path.join(D, 'order.list'), 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s && s[0] !== '#');
  return l.slice(0, l.indexOf('parts/03d-state.js') + 1).map(f => path.join(D, f));
}
function worldBundle(o) {
  const rd = f => fs.readFileSync(f, 'utf8');
  const an = bundle(o).replace('globalThis.ENGINE=', 'globalThis.AN=AN;globalThis.ENGINE=');
  return (
    dFiles().map(f => '/* ---- ' + path.relative(root, f) + ' ---- */\n' + rd(f)).join('\n') +
    '\n;globalThis.DITL={get S(){return S},set S(v){S=v},get SIM(){return SIM},set SIM(v){SIM=v},get MST(){return MST},get MS(){return MS},get DREG(){return DREG},ditlStates,ditlCapture,ditlApply,simSheet,netlist};\n' +
    an +
    ['world.js', 'plantsw.js', 'ditl150.js', 'eng.js'].map(f => '/* ---- src/world/' + f + ' ---- */\n' + rd(path.join(root, 'src', 'world', f))).join('\n')
  );
}
module.exports = { bundle, files, worldBundle };
if (require.main === module) process.stdout.write(bundle());
