/* SCENARIO UAT (in the page): isang operator + proseso nang sabay, mula INPUT hanggang OUTPUT ng mismong engine.
   Ang mga hakbang at ang inaasahang sagot ay nasa src/ui/uat/scenarios/<sheet>.json at isinulat mula sa drawing (PDF), hindi kinuwenta ng engine.
   Ang AUTO / MAN / REMOTE / LOCAL / MV / SV ay pindot sa tunay na operator panel. Ginagamit ito ng app (UAT panel) at ng tests/scenarios/run.js. */
window.UATS = (function () {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const expand = sc => {
    if (!sc.cases) return sc;
    const steps = [];
    for (const c of sc.cases) {
      steps.push({ do: 'reset', say: 'Bagong simula: ' + c.say });
      steps.push({ do: 'wait', s: 3, say: 'hintayin ang startup pulse ng ibang sheet' });
      for (const b of sc.base || []) steps.push(Object.assign({ do: 'set' }, b));
      for (const x of c.set || []) steps.push(Object.assign({ do: 'set' }, x));
      steps.push({ do: 'wait', s: c.wait || sc.wait || 12, say: 'maghintay' });
      for (const e of c.expect)
        steps.push(Object.assign({ expect: 'signal' }, e, { say: c.say + ': ' + (e.say || e.tag) }));
    }
    return Object.assign({}, sc, { steps });
  };
  const labTxt = (S, n) => (S.lab[n] && S.lab[n].t ? S.lab[n].t.trim() : '');
  function ctx(sheet, loop) {
    const sh = AN.sheets.find(x => x.name === sheet),
      S = sh.S,
      rt = S.rt;
    const netOf = t => {
      for (let n = 0; n < S.nets.length; n++) if (labTxt(S, n) === t) return n;
      return -1;
    };
    const nearOf = txt => {
      const tx = (S.tx || []).find(x => x.t.trim() === txt);
      if (!tx) return -1;
      let bn = -1,
        bd = 60;
      for (const m of S.ext)
        for (const i of S.nets[m].segs) {
          const s = S.seg[i];
          for (const [x, y] of [
            [s.x1, s.y1],
            [s.x2, s.y2]
          ]) {
            const d = Math.hypot(tx.x - x, tx.y - y);
            if (d < bd) {
              bd = d;
              bn = m;
            }
          }
        }
      return bn;
    };
    const net = o => (o.net !== undefined ? o.net : o.near ? nearOf(o.near) : netOf(o.tag));
    const ctl = AN.hmiCtrls(S).find(c => c.tag === loop),
      fp = [...document.querySelectorAll('#opp .fp')].find(
        x => x.querySelector('.tg b') && x.querySelector('.tg b').textContent === loop
      );
    return { sh, S, rt, net, ctl, fp, stn: ctl && ctl.amt ? rt.st[ctl.amt.id] : null };
  }
  const stepSim = async (sh, secs) => {
    const n = Math.round(secs * 2);
    for (let i = 0; i < n; i++) {
      AN.stepSet(sh, 0.5);
      if (i % 150 === 149) await sleep(0);
    }
  };
  /* run one scenario: returns {lines:[{k:'do'|'ok'|'bad',t,exp,got}],pass,fail} */
  async function run(sheet, sc0, onLine) {
    const sc = expand(sc0),
      L = [],
      run0 = AN.run,
      mk = {};
    let pass = 0,
      fail = 0;
    const push = l => {
      L.push(l);
      if (onLine) onLine(l);
    };
    const idx = AN.sheets.findIndex(x => x.name === sheet);
    AN.go(idx);
    AN.reset();
    AN.go(idx);
    [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Operator').forEach(b => b.click());
    AN.run = false;
    await sleep(1200);
    let skipRest = false;
    try {
      for (const st of sc.steps) {
        if (skipRest) continue;
        const c = ctx(sheet, sc.loop),
          { sh, S, rt, net, ctl, fp, stn } = c;
        const AL = { AUTO: 'A', MAN: 'M', REMOTE: 'R', LOCAL: 'A' },
          btn = t => fp && [...fp.querySelectorAll('button')].find(e => e.textContent.trim() === (AL[t] || t));
        const mode = () => (!stn ? '?' : stn.pk === ctl.autoLeg ? 'AUTO' : 'MANUAL');
        const val = w => (w === 'mv' ? rt.v[ctl.out] : w === 'sv' ? rt.v[ctl.q.sv] : rt.v[ctl.q.pv]);
        if (st.do) {
          let note = '';
          if (st.do === 'set' && st.sheet) {
            const o = AN.sheets.find(x => x.name === st.sheet);
            AN.ensure(o);
            const S2 = o.S;
            let n2 = -1;
            for (let n = 0; n < S2.nets.length; n++) if (labTxt(S2, n) === st.tag) n2 = n;
            if (n2 < 0) {
              push({ k: 'bad', t: 'walang ' + st.tag + ' sa ' + st.sheet });
              fail++;
              continue;
            }
            S2.rt.force[n2] = st.value;
            try {
              AN.settle();
            } catch (e) {}
          } else if (st.do === 'set') {
            const n = net(st);
            if (n < 0) {
              push({ k: 'bad', t: 'walang input na ' + (st.tag || st.near) });
              fail++;
              continue;
            }
            if ((S.xlk && S.xlk[n]) || !S.ext.includes(n)) rt.force[n] = st.value;
            else rt.ext[n] = st.value;
            try {
              AN.settle();
            } catch (e) {}
          } else if (st.do === 'ai') {
            /* itakda ang transmitter (AI block): block = id, o tag = pangalan ng AI (hal. AI0866) */
            const bk = S.blk.find(
              b =>
                b.k === 'AI' && (st.block != null ? b.id === st.block : (b.o || []).some(n => labTxt(S, n) === st.tag))
            );
            if (!bk) {
              push({ k: 'bad', t: 'walang transmitter ' + (st.tag || st.block) });
              fail++;
              continue;
            }
            const t = rt.st[bk.id];
            t.val = t.act = st.value;
            try {
              AN.settle();
            } catch (e) {}
          } else if (st.do === 'partnerman') {
            /* the other controllers on the SAME measurement (valves in parallel) go to MANUAL at a fixed MV, so this valve alone moves the PV */
            for (const t of st.tags || []) {
              const pc = (AN.hmiCtrls(S) || []).find(x => x.tag === t);
              if (!pc || !pc.amt || pc.manNet == null) continue;
              const q = rt.st[pc.amt.id];
              if (q) {
                q.al = pc.autoLeg;
                q.fm = pc.autoLeg === 'A' ? 'B' : 'A';
              }
              if (pc.manBlk && rt.st[pc.manBlk.id]) rt.st[pc.manBlk.id].val = st.value;
              else rt.ext[pc.manNet] = st.value;
            }
            try {
              AN.settle();
            } catch (e) {}
          } else if (st.do === 'wait') await stepSim(sh, st.s);
          else if (st.do === 'reset') {
            AN.reset();
            AN.go(idx);
          } else if (st.do === 'press') {
            const b = btn(st.button);
            if (!b) {
              push({ k: 'bad', t: 'walang button ' + st.button });
              fail++;
              continue;
            }
            if (b.disabled) note = ' (disabled, hindi napindot)';
            else {
              b.click();
              await stepSim(sh, 0.5);
            }
          } else if (st.do === 'mv' || st.do === 'sv') {
            const ins = [...fp.querySelectorAll('input')],
              f = st.do === 'sv' ? ins[0] : ins[ins.length - 1];
            if (f.disabled) note = ' (disabled ang field)';
            else {
              f.value = st.value;
              f.dispatchEvent(new Event('change'));
              await stepSim(sh, 0.5);
            }
          } else if (st.do === 'popopen') {
            const ins = [...fp.querySelectorAll('input')],
              f = st.name === 'SV' ? ins[0] : ins[ins.length - 1];
            f.closest('.fpb').click();
          } else if (st.do === 'popbtn') {
            const pp = fp.querySelector('.fpop'),
              b = pp && [...pp.querySelectorAll('button')].find(e => e.textContent.trim() === st.button);
            if (!b) {
              push({ k: 'bad', t: 'walang button ' + st.button + ' sa popup' });
              fail++;
              continue;
            }
            b.click();
            await stepSim(sh, 0.5);
          } else if (st.do === 'popclose') {
            const pp = fp.querySelector('.fpop'),
              b = pp && [...pp.querySelectorAll('button')].find(e => e.textContent.trim() === '✕');
            if (b) b.click();
          } else if (st.do === 'dump') {
            const a = ctl.amt,
              q = rt.st[a.id];
            push({
              k: 'do',
              t:
                'DUMP mv=' +
                rt.v[ctl.out].toFixed(2) +
                ' pv=' +
                rt.v[ctl.q.pv].toFixed(1) +
                ' sv=' +
                rt.v[ctl.q.sv].toFixed(1) +
                ' pk=' +
                q.pk +
                ' fman=' +
                q.fman +
                ' fm=' +
                q.fm +
                ' COSext=' +
                (+rt.ext[a.b]).toFixed(2) +
                ' forced=' +
                (rt.force[a.b] !== undefined) +
                ' A=' +
                (+rt.v[a.a]).toFixed(2)
            });
          } else if (st.do === 'settle') {
            let prev = val(st.what);
            for (let t = 0; t < (st.max || 240); t += 2) {
              AN.stepSet(sh, 2);
              const cur = val(st.what);
              if (Math.abs(cur - prev) < 0.005) break;
              prev = cur;
              if (t % 40 === 38) await sleep(0);
            }
          } else if (st.do === 'waitforce') {
            const lim = Math.round((st.max || 40) * 2);
            for (let i = 0; i < lim; i++) {
              AN.stepSet(sh, 0.5);
              if (stn && stn.fman) break;
              if (i % 150 === 149) await sleep(0);
            }
            await stepSim(sh, 0.5);
          } else if (st.do === 'skipunless') {
            if (!(stn && stn.fman)) {
              skipRest = true;
              push({
                k: 'do',
                t: 'HINDI SINUSURI ANG NATITIRA: ang trip na input ay hindi nagpa-force sa estado ng scenario na ito (ang kondisyon ay depende sa proseso, hal. PV / temperatura); sinuri ito sa panimulang estado lang'
              });
            }
          } else if (st.do === 'watch') {
            let seen = 0;
            const n = Math.round(st.s * 2);
            for (let i = 0; i < n; i++) {
              AN.stepSet(sh, 0.5);
              for (const z of ctl.sigs) if (z.role === 'AUTO' && rt.v[z.n] > 0.5) seen = z.name;
              if (ctl.svSw && ctl.remote && rt.st[ctl.svSw.id] && rt.st[ctl.svSw.id].pk === 'A')
                seen = 'REMOTE (SV switch A)';
              if (i % 150 === 149) await sleep(0);
            }
            mk.__autoSeen = seen;
          } else if (st.do === 'mark') mk[st.as] = val(st.what);
          if (st.say && st.do !== 'wait' && st.do !== 'mark') push({ k: 'do', t: st.say + note });
          await sleep(450);
          continue;
        }
        let got, ok;
        const tol = st.tol == null ? 0.05 : st.tol;
        if (st.expect === 'signal') {
          const n = net(st);
          if (n < 0) {
            push({ k: 'bad', t: 'walang signal na ' + (st.tag || st.near) });
            fail++;
            continue;
          }
          got = +rt.v[n].toFixed(3);
        } else if (st.expect === 'pop') {
          const pp = fp.querySelector('.fpop');
          got = pp && pp.style.display === 'block' ? 'bukas' : 'hindi bumukas';
        } else if (st.expect === 'mv') got = +rt.v[ctl.out].toFixed(2);
        else if (st.expect === 'cut') {
          const g = (ctl.dn || []).find(d => {
            const t = rt.st[d.id];
            return t && t.pk === 'B';
          });
          got = g ? 'putol' : 'malaya';
        } else if (st.expect === 'mode-after-clear') {
          const sn = mk.__autoSeen;
          got = mode() + (sn ? ' (may AUTO signal ng drawing: ' + sn + ')' : '');
        } else if (st.expect === 'bumpless') {
          const cut = (ctl.dn || []).find(d => {
              const t = rt.st[d.id];
              return t && t.pk === 'B';
            }),
            d = rt.v[ctl.out] - mk[st.than];
          got = cut
            ? 'putol ng interlock ng drawing'
            : Math.abs(d) <= (st.tol == null ? 0.3 : st.tol)
              ? 'pareho'
              : (d > 0 ? 'tumaas' : 'bumaba') + ' (' + d.toFixed(1) + ')';
        } else if (st.expect === 'mode') got = mode();
        else if (st.expect === 'disabled') {
          const b = btn(st.button);
          got = b ? (b.disabled ? 'disabled' : 'enabled') : 'walang button';
        } else if (st.expect === 'field') {
          const ins = [...fp.querySelectorAll('input')],
            f = st.name === 'SV' ? ins[0] : ins[ins.length - 1];
          got = f.disabled ? 'disabled' : 'enabled';
        } else if (st.expect === 'faceplate') got = /FORCE MANUAL/.test(fp.textContent) ? 'FORCE MANUAL' : 'wala';
        else if (st.expect === 'sv-switch') {
          const q = ctl.svSw && rt.st[ctl.svSw.id];
          got = !q ? '?' : q.pk === 'A' ? 'A (logic / REMOTE)' : 'B (operator / LOCAL)';
        } else if (st.expect === 'sv') got = +rt.v[ctl.q.sv].toFixed(2);
        else if (st.expect === 'near-pv') {
          const sv = rt.v[ctl.q.sv],
            pv = rt.v[ctl.q.pv],
            sp = ctl.b.p.rhi - ctl.b.p.rlo || 100;
          got =
            Math.abs(sv - pv) <= (sp * (st.pct || 3)) / 100
              ? 'abot-SV'
              : 'malayo sa SV (SV ' + sv.toFixed(1) + ', PV ' + pv.toFixed(1) + ')';
        } else if (st.expect === 'cmp') {
          /* PV vs MV while an interlock selector of the drawing sends 0 % to the valve: the process cannot answer, NOT TESTED (not pass, not fail) */
          const cutB =
            st.what === 'pv' &&
            (ctl.dn || []).find(d => {
              const t = rt.st[d.id];
              return t && t.pk === 'B';
            });
          if (cutB) {
            const sw = S.blk.find(z => z.id === cutB.id),
              sn = sw && sw.sel != null && sw.sel >= 0 ? AN.nm(S, sw.sel) + ' = ' + (rt.v[sw.sel] > 0.5 ? 1 : 0) : '?';
            push({
              k: 'do',
              t:
                'HINDI NASURI (' +
                (st.say || 'PV') +
                '): sarado ang valve dahil sa interlock ng drawing (' +
                sn +
                ' → leg B); ang PV ay hindi gagalaw hangga’t hindi nawawala ang kondisyon'
            });
            continue;
          }
          const d = val(st.what) - mk[st.than];
          got = st.min
            ? (d >= st.min ? 'tumaas' : d <= -st.min ? 'bumaba' : 'kulang ang galaw') + ' (' + d.toFixed(1) + ')'
            : Math.abs(d) <= (st.tol == null ? 1 : st.tol)
              ? 'pareho'
              : (d > 0 ? 'tumaas' : 'bumaba') + ' (' + d.toFixed(1) + ')';
        } else {
          push({ k: 'bad', t: 'hindi kilalang tseke ' + st.expect });
          fail++;
          continue;
        }
        if (st.expect === 'bumpless') ok = got === 'pareho' || /^putol/.test(got);
        else if (st.expect === 'mode-after-clear') ok = String(got).startsWith(mk.__autoSeen ? 'AUTO' : 'MANUAL');
        else
          ok =
            typeof st.value === 'number'
              ? Math.abs(got - st.value) <= tol
              : st.expect === 'cmp' && st.min
                ? String(got).startsWith(String(st.value))
                : String(got) === String(st.value);
        ok ? pass++ : fail++;
        push({ k: ok ? 'ok' : 'bad', t: st.say || st.expect, exp: st.value, got, why: st.why });
      }
    } finally {
      try {
        AN.reset();
      } catch (e) {}
      AN.run = run0;
    }
    return { lines: L, pass, fail };
  }

  /* GENERIC: ang karaniwang scenario ng operator + proseso para sa BAWAT controller, kusang ginagawa mula sa drawing (walang isinusulat na isa-isa).
    Ang panimulang estado (walang force, walang putol na output) at ang input na nagpapa-force-manual ay hinahanap ng pagsubok sa engine; ang INAASAHAN ay ang mga patakaran ng operator (user): M = ang operator ang MV; A = SV ng operator; sa AUTO ang SV ang ginagalaw; bumpless; REMOTE = AUTO talaga;
    force manual = MANUAL agad, walang talon ng MV, hindi automatic na bumabalik sa AUTO. */
  async function generic(sheet, tag, onNote) {
    const sh = AN.sheets.find(x => x.name === sheet),
      idx = AN.sheets.indexOf(sh);
    AN.go(idx);
    AN.reset();
    AN.go(idx);
    const S = sh.S,
      run0 = AN.run;
    AN.run = false;
    try {
      const c0 = AN.hmiCtrls(S).find(c => c.tag === tag);
      if (!c0 || !c0.amt || c0.manNet == null) return null;
      const dg = S.ext.filter(n => S.nets[n].dig),
        P = c0.b.p,
        rlo = P.rlo != null ? P.rlo : 0,
        rhi = P.rhi != null ? P.rhi : 100,
        span = rhi - rlo;
      let seed = 777;
      const rnd = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };
      const bases = [[], dg.map(n => [n, 1]), dg.map((n, k) => [n, k % 2]), dg.map((n, k) => [n, (k + 1) % 2])];
      for (let j = 0; j < 10; j++) bases.push(dg.map(n => [n, rnd() < 0.3 ? 1 : 0]));
      /* mga analog na input mula sa ibang sheet / field (flow, pressure ...) ay nasa GITNA ng range ("boiler in service"), hindi 0: ang 0 ay nagti-trip ng mga low-flow interlock; hindi kasama ang PV, SV at MV ng mismong controller */
      const an = S.ext
        .filter(
          n =>
            !S.nets[n].dig &&
            n !== c0.q.pv &&
            n !== c0.q.sv &&
            n !== c0.manNet &&
            !(S.lab[n] && S.lab[n].t === 'COS manual value')
        )
        .map(n => {
          const r = AN.extRange && AN.extRange(S, n);
          return [n, r && r.hi > r.lo ? (r.lo + r.hi) / 2 : 50];
        });
      let mvPre =
        null; /* MV (manual) na ipinapasok ng operator bago subukan: may controller na naka-force manual hangga't mababa ang MV (PICFG108: MV < 14 %, M.0206) */
      const aiOv = new Map(),
        anOv =
          new Map(); /* analog na binago ng paghahanap (hal. PV malapit sa SV para pumasa ang deviation permissive) */
      const put = (n, v) => {
        if ((S.xlk && S.xlk[n]) || !S.ext.includes(n)) S.rt.force[n] = v;
        else S.rt.ext[n] = v;
      };
      /* estado = {sets:[[net,value]], pulses:[net]}: ang pulse ay pagtatakda ng 1 nang 3 s at pagbalik sa 0 (para sa latch / flip-flop na kailangang i-set) */
      const setup = async stt => {
        if (Array.isArray(stt)) stt = { sets: stt, pulses: [] };
        AN.reset();
        AN.go(idx);
        for (const [n, v] of an.map(([n, v]) => [n, anOv.has(n) ? anOv.get(n) : v]).concat(stt.sets)) put(n, v);
        for (const [id, v] of aiOv) {
          const t = S.rt.st[id];
          if (t) t.val = t.act = v;
        }
        if (mvPre != null) {
          if (c0.manBlk && S.rt.st[c0.manBlk.id]) S.rt.st[c0.manBlk.id].val = mvPre;
          else S.rt.ext[c0.manNet] = mvPre;
        }
        try {
          AN.settle();
        } catch (e) {}
        if (stt.pulses.length) {
          await stepSim(sh, 5);
          for (const n of stt.pulses) {
            const cur = (stt.sets.find(x => x[0] === n) || [n, 0])[1];
            put(n, cur ? 0 : 1);
            await stepSim(sh, 3);
            put(n, cur);
            await stepSim(sh, 5);
          }
        }
        await stepSim(sh, 20);
        const c = AN.hmiCtrls(S).find(c => c.tag === tag),
          st = S.rt.st[c.amt.id];
        return { st, c };
      };
      /* score = force + putol (1000 bawat isa) + dami ng aktibong net sa itaas ng pumipiling signal at ng mga selector na pumuputol: may "slope" ang paghahanap kahit OR ng maraming NOT */
      const up = new Set();
      {
        const q = c0.sigs
          .filter(z => z.role === 'MAN')
          .map(z => z.n)
          .concat((c0.dn || []).map(d => d.sel));
        while (q.length && up.size < 600) {
          const n = q.pop();
          if (n == null || up.has(n)) continue;
          up.add(n);
          if (S.ext.includes(n)) continue;
          for (const g of S.drv[n] || []) for (const i of g.i || []) if (i >= 0) q.push(i);
        }
      }
      const cands = [...up].filter(n => S.ext.includes(n) && S.nets[n].dig),
        cd = cands.length ? cands : dg;
      const score = async stt => {
        const { st, c } = await setup(stt);
        const cut = (c.dn || []).some(d => {
          const t = S.rt.st[d.id];
          return t && t.pk === 'B';
        });
        let cnt = 0;
        for (const n of up) if (!S.ext.includes(n) && S.rt.v[n] > 0.5) cnt++;
        return (st.fman ? 1000 : 0) + (cut ? 1000 : 0) + cnt;
      };
      const flip = (stt, n) => ({
        sets: stt.sets.filter(x => x[0] !== n).concat([[n, (stt.sets.find(x => x[0] === n) || [n, 0])[1] ? 0 : 1]]),
        pulses: stt.pulses.slice()
      });
      const pul = (stt, n) => ({
        sets: stt.sets.map(x => x.slice()),
        pulses: stt.pulses.includes(n) ? stt.pulses.filter(x => x !== n) : stt.pulses.concat([n])
      });
      let base = null,
        best = null,
        bs0 = 1e9;
      for (const b of bases) {
        const st0 = { sets: b, pulses: [] };
        const sc0 = await score(st0);
        if (sc0 < bs0) {
          bs0 = sc0;
          best = st0;
        }
      }
      /* paghahanap ng estado ng digital (flip, pulse ng latch, pares) hanggang mawala ang force / putol */
      const climb = async (cur, cs) => {
        for (let it = 0; it < 16 && cs >= 1000; it++) {
          let imp = false;
          for (const n of cd) {
            const nb = flip(cur, n),
              sc1 = await score(nb);
            if (sc1 < cs) {
              cur = nb;
              cs = sc1;
              imp = true;
              if (cs < 1000) break;
            }
          }
          if (!imp && cs >= 1000 && cd.length <= 14) {
            outer: for (let a = 0; a < cd.length; a++)
              for (let b2 = a + 1; b2 < cd.length; b2++) {
                const nb = flip(flip(cur, cd[a]), cd[b2]),
                  sc1 = await score(nb);
                if (sc1 < cs) {
                  cur = nb;
                  cs = sc1;
                  imp = true;
                  break outer;
                }
              }
          }
          if (!imp && cs >= 1000)
            for (const n of cd) {
              if (cs < 1000) break;
              const nb = pul(cur, n),
                sc1 = await score(nb);
              if (sc1 < cs) {
                cur = nb;
                cs = sc1;
                imp = true;
                break;
              }
            }
          if (!imp) break;
        }
        return { cur, cs };
      };
      if (bs0 >= 1000 && best) {
        const r0 = await climb(best, bs0);
        const cur = r0.cur,
          cs = r0.cs;
        if (cs < 1000) base = cur;
        else best = cur;
      } else if (best) base = best;
      if (!base && best) {
        /* huling pagsubok: analog na input sa cone (deviation / limit na kailangang pumasa): subukan ang 10 / 30 / 70 / 90 % ng range, isa-isa, hawak ang pinakamababang score */
        const ac = an.filter(([n]) => up.has(n));
        /* ang operator ay nagtataas ng MV sa manual (50 %) bago ang lahat */
        mvPre = 50;
        {
          const r0 = await climb(best, await score(best));
          if (r0.cs < bs0) {
            best = r0.cur;
            bs0 = r0.cs;
          }
          if (bs0 < 1000) base = best;
        }
        if (!base) {
          let cur = best,
            cs = bs0;
          /* lahat ng analog na input sa cone sabay (hal. hangin at gatong na may kaugnayan: SI0019 = 1.2 x ...) */
          if (cs >= 1000 && ac.length > 1)
            for (const f of [0.5, 0.7, 0.9, 0.3]) {
              for (const [n] of ac) {
                const r = AN.extRange && AN.extRange(S, n);
                if (r && r.hi > r.lo) anOv.set(n, r.lo + f * (r.hi - r.lo));
              }
              const r1 = await climb(cur, await score(cur));
              if (r1.cs < cs) {
                cs = r1.cs;
                cur = r1.cur;
                break;
              }
              anOv.clear();
            }
          for (let pass = 0; pass < 2 && cs >= 1000; pass++)
            for (const [n, mid] of ac) {
              const r = AN.extRange && AN.extRange(S, n),
                keep = anOv.has(n) ? anOv.get(n) : mid;
              let bv = keep;
              /* walang range na kilala (linked na PV mula sa ibang sheet): mga karaniwang halaga ng proseso (°C, kg/cm2, T/H) */
              const cand =
                r && r.hi > r.lo ? [0.1, 0.3, 0.7, 0.9].map(f => r.lo + f * (r.hi - r.lo)) : [10, 100, 250, 400, 700];
              for (const v of cand) {
                {
                  anOv.set(n, v);
                  const r1 = await climb(cur, await score(cur)),
                    sc1 = r1.cs;
                  if (sc1 < cs) {
                    cs = sc1;
                    cur = r1.cur;
                    bv = anOv.get(n);
                  }
                }
              }
              anOv.set(n, bv);
              if (cs < 1000) break;
            }
          /* mga transmitter (AI) sa cone: hal. temperatura na kailangang lampas sa saturation + 11 °C (TICHR1002, M.0172) */
          const aib = S.blk.filter(
            b => b.k === 'AI' && (b.o || []).some(n => up.has(n)) && b.rng && b.rng.hi > b.rng.lo
          );
          /* lahat ng transmitter sa cone ay sabay na itinataas / ibinababa (hal. dalawang sensor ng parehong temperatura) */
          if (cs >= 1000 && aib.length > 1)
            for (const f of [0.1, 0.3, 0.5, 0.7, 0.9]) {
              for (const b of aib) aiOv.set(b.id, b.rng.lo + f * (b.rng.hi - b.rng.lo));
              const r1 = await climb(cur, await score(cur)),
                sc1 = r1.cs;
              if (sc1 < cs) {
                cs = sc1;
                cur = r1.cur;
                break;
              }
              aiOv.clear();
            }
          if (cs >= 1000)
            for (const b of S.blk.filter(
              b => b.k === 'AI' && (b.o || []).some(n => up.has(n)) && b.rng && b.rng.hi > b.rng.lo
            )) {
              const keep = aiOv.has(b.id) ? aiOv.get(b.id) : null;
              let bv = keep;
              for (const f of [0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
                aiOv.set(b.id, b.rng.lo + f * (b.rng.hi - b.rng.lo));
                const r1 = await climb(cur, await score(cur)),
                  sc1 = r1.cs;
                if (sc1 < cs) {
                  cs = sc1;
                  cur = r1.cur;
                  bv = aiOv.get(b.id);
                }
              }
              if (bv == null) aiOv.delete(b.id);
              else aiOv.set(b.id, bv);
              if (cs < 1000) break;
            }
          if (cs < 1000) base = cur;
          else {
            anOv.clear();
            aiOv.clear();
            mvPre = null;
          }
        }
      }
      if (!base) {
        let why = '';
        try {
          const { st, c } = await setup(best || { sets: [], pulses: [] });
          const ms = c.sigs.filter(z => z.role === 'MAN' && S.rt.v[z.n] > 0.5).map(z => z.name + ' = 1');
          const ct = (c.dn || [])
            .filter(d => {
              const t = S.rt.st[d.id];
              return t && t.pk === 'B';
            })
            .map(d => (labTxt(S, d.sel) || 'n' + d.sel) + ' = 1 (output putol)');
          why = ' | natitira: ' + (st.fman ? 'force manual [' + ms.join(', ') + '] ' : '') + ct.join(', ');
        } catch (e) {}
        return {
          loop: tag,
          note: 'walang malinis na estado (sinubok: panimulang kondisyon, pag-flip, pulse ng latch, pares)' + why
        };
      }
      let trig = null;
      for (const n of cd.concat(dg.filter(x => !cd.includes(x)))) {
        const cur = (base.sets.find(x => x[0] === n) || [n, 0])[1];
        const { st } = await setup({
          sets: base.sets.filter(x => x[0] !== n).concat([[n, cur ? 0 : 1]]),
          pulses: base.pulses
        });
        if (st.fman) {
          trig = [n, cur ? 0 : 1];
          break;
        }
      }
      const bs = an
          .map(([n, v]) => [n, anOv.has(n) ? anOv.get(n) : v])
          .concat(base.sets)
          .map(([n, v]) => ({ do: 'set', net: n, value: v }))
          .concat(
            [...aiOv].map(([id, v]) => ({ do: 'ai', block: id, value: v, say: 'transmitter (AI) ' + id + ' = ' + v }))
          ),
        hasR = !!c0.remote;
      if (base.pulses.length) {
        bs.push({ do: 'wait', s: 5, say: 'maghintay' });
        for (const n of base.pulses) {
          const cur = (base.sets.find(x => x[0] === n) || [n, 0])[1];
          bs.push(
            { do: 'set', net: n, value: cur ? 0 : 1, say: 'pulse (i-set ang latch): ' + (labTxt(S, n) || 'n' + n) },
            { do: 'wait', s: 3 },
            { do: 'set', net: n, value: cur },
            { do: 'wait', s: 5 }
          );
        }
      }
      if (mvPre != null)
        bs.push({
          do: 'mv',
          value: mvPre,
          say: 'itaas ang MV sa manual = ' + mvPre + ' (kailangan para mawala ang force manual ng drawing)'
        });
      const pr = (S.procs || []).find(b => b.id === c0.b.id),
        T = pr && pr.proc && pr.proc.T ? pr.proc.T : 150,
        wp = Math.max(120, Math.min(1500, Math.round(T * 6)));
      const sc = [];
      const pre = bs
        .concat([{ do: 'wait', s: 20 }])
        .concat(hasR ? [{ do: 'press', button: 'A', say: 'A (lumabas muna sa REMOTE kung nasa REMOTE)' }] : []);
      sc.push({
        id: 'G1',
        loop: tag,
        title: tag + ': MANUAL — MV field at mga button (0 / 50 / 100); proseso',
        drawing: 'A/M switch B = manual MV ng operator; ang MV ay lumalabas sa output ng A/M switch.',
        steps: pre.concat([
          { do: 'press', button: 'M', say: 'pindutin ang M' },
          { expect: 'mode', value: 'MANUAL', say: 'mode' },
          { expect: 'field', name: 'MV', value: 'enabled', say: 'MV field sa MANUAL' },
          { do: 'mv', value: 75, say: 'i-type ang MV = 75' },
          { do: 'settle', what: 'mv' },
          { expect: 'mv', value: 75, tol: 0.6, say: 'MV' },
          { do: 'press', button: '0', say: 'pindutin ang 0' },
          { do: 'settle', what: 'mv' },
          { expect: 'mv', value: 0, tol: 0.6, say: 'MV matapos ang 0' },
          { do: 'press', button: '50', say: 'pindutin ang 50' },
          { do: 'settle', what: 'mv' },
          { expect: 'mv', value: 50, tol: 0.6, say: 'MV matapos ang 50' },
          { do: 'press', button: '100', say: 'pindutin ang 100' },
          { do: 'settle', what: 'mv' },
          { expect: 'mv', value: 100, tol: 0.6, say: 'MV matapos ang 100' },
          { do: 'popopen', name: 'MV', say: 'i-click ang kahon ng MV' },
          { expect: 'pop', name: 'MV', value: 'bukas', say: 'lumabas ang control ng MV (MANUAL)' },
          { do: 'popbtn', button: '▼▼', say: 'pindutin ang ▼▼ (-10)' },
          { do: 'settle', what: 'mv' },
          { expect: 'mv', value: 90, tol: 0.6, say: 'MV pagkatapos ng ▼▼' },
          { do: 'popbtn', button: '▲', say: 'pindutin ang ▲ (+1)' },
          { do: 'settle', what: 'mv' },
          { expect: 'mv', value: 91, tol: 0.6, say: 'MV pagkatapos ng ▲' },
          { do: 'popbtn', button: '50', say: 'pindutin ang 50 sa popup' },
          { do: 'settle', what: 'mv' },
          { expect: 'mv', value: 50, tol: 0.6, say: 'MV pagkatapos ng 50' },
          { do: 'popclose' }
        ])
      });
      /* cascade master: ang output ay SV ng ibang controller (walang AO sa daan); shared: ang PV ay hawak ng ibang controller. Hindi sinusuri ang PV-vs-MV dito: ang proseso ay sinusuri sa controller na tunay na may hawak (tinatala sa ulat) */
      const casc = (() => {
        const stn = c0.amt;
        let cur = [stn.o[0]],
          seen = new Set(),
          ao = false,
          pid = false;
        for (let k = 0; k < 12 && cur.length; k++) {
          const nx = [];
          for (const n of cur) {
            if (seen.has(n)) continue;
            seen.add(n);
            for (const b of S.blk.concat(S.ord || [])) {
              if (!(b.i || []).includes(n)) continue;
              if (b.k === 'AO') ao = true;
              else if ((b.k === 'PID' || b.k === 'PIDV') && b !== c0.b) pid = true;
              else for (const o of b.o || []) nx.push(o);
            }
          }
          cur = nx;
        }
        return pid && !ao;
      })();
      const notes = [];
      if (pr && pr.proc && pr.proc.mode === 'shared')
        notes.push(
          'G2 (PV vs MV) hindi sinuri: ang PV ay hawak ng ' + (pr.proc.of || 'ibang controller') + ' (shared)'
        );
      else if (casc) notes.push('G2 (PV vs MV) hindi sinuri: cascade master (ang output ay SV ng ibang controller)');
      /* valves in parallel on this measurement (same sheet): the operator puts the others in MANUAL at 50 % first, else an AUTO partner holds the PV */
      const partners = pr
        ? (S.procs || [])
            .filter(g => g !== pr && g.proc && g.proc.mode === 'shared' && g.proc.pv === pr.proc.pv)
            .map(g => (g.txt || [])[1])
            .filter(Boolean)
        : [];
      if (pr && pr.proc && pr.proc.on && !notes.length)
        sc.push({
          id: 'G2',
          loop: tag,
          title: tag + ': ang PV ay sumasagot sa MV (proseso)',
          drawing: 'Ang proseso ay first-order na may dead time; ang PV ay lumilipat ayon sa MV.',
          steps: pre.concat([
            ...(partners.length
              ? [
                  {
                    do: 'partnerman',
                    tags: partners,
                    value: 50,
                    say: 'ilagay sa MAN = 50 % ang katabing controller sa parehong PV: ' + partners.join(', ')
                  }
                ]
              : []),
            { do: 'press', button: 'M', say: 'M' },
            { do: 'mv', value: 0, say: 'MV = 0' },
            { do: 'wait', s: wp },
            { do: 'mark', what: 'pv', as: 'p0' },
            { do: 'mv', value: 100, say: 'MV = 100' },
            { do: 'wait', s: wp },
            {
              expect: 'cmp',
              what: 'pv',
              than: 'p0',
              value: Math.abs(pr.proc.sg) === 1 && pr.proc.sg < 0 ? 'bumaba' : 'tumaas',
              min: span * 0.08,
              say: 'PV pagkatapos ng ' + wp + ' s sa MV = 100 kumpara sa MV = 0',
              why: 'ang direksyon ay ayon sa action ng controller / proseso'
            }
          ])
        });
      sc.push({
        id: 'G3',
        loop: tag,
        title: tag + ': SV ng operator (LOCAL) — SV field, + at −',
        drawing: 'SV switch B = SV ng operator (o ang SV pin ng controller kung walang switch).',
        steps: pre.concat([
          { do: 'press', button: 'M', say: 'M' },
          { expect: 'field', name: 'SV', value: 'disabled', say: 'SV field sa MANUAL', why: 'SV ay para sa AUTO lang' },
          { do: 'popopen', name: 'SV', say: 'i-click ang kahon ng SV sa MANUAL' },
          { expect: 'pop', name: 'SV', value: 'hindi bumukas', say: 'control ng SV sa MANUAL' },
          { do: 'press', button: 'A', say: 'A' },
          { do: 'sv', value: +(rlo + span * 0.4).toFixed(3), say: 'i-type ang SV = 40 % ng range' },
          { do: 'settle', what: 'sv' },
          { expect: 'sv', value: +(rlo + span * 0.4).toFixed(3), tol: span * 0.002, say: 'SV' },
          { do: 'press', button: '+', say: 'pindutin ang +' },
          { do: 'settle', what: 'sv' },
          { expect: 'sv', value: +(rlo + span * 0.41).toFixed(3), tol: span * 0.002, say: 'SV pagkatapos ng +' },
          { do: 'popopen', name: 'SV', say: 'i-click ang kahon ng SV' },
          { expect: 'pop', name: 'SV', value: 'bukas', say: 'lumabas ang control ng SV' },
          { do: 'popbtn', button: '▲▲', say: 'pindutin ang ▲▲ (+10 %)' },
          { do: 'settle', what: 'sv' },
          { expect: 'sv', value: +(rlo + span * 0.51).toFixed(3), tol: span * 0.002, say: 'SV pagkatapos ng ▲▲' },
          { do: 'popbtn', button: '▼', say: 'pindutin ang ▼ (-1 %)' },
          { do: 'settle', what: 'sv' },
          { expect: 'sv', value: +(rlo + span * 0.5).toFixed(3), tol: span * 0.002, say: 'SV pagkatapos ng ▼' },
          { do: 'popbtn', button: '▼▼', say: 'pindutin ang ▼▼ (-10 %)' },
          { do: 'settle', what: 'sv' },
          { expect: 'sv', value: +(rlo + span * 0.4).toFixed(3), tol: span * 0.002, say: 'SV pagkatapos ng ▼▼' },
          { do: 'popclose' },
          { do: 'press', button: '−', say: 'pindutin ang −' },
          { do: 'settle', what: 'sv' },
          {
            expect: 'sv',
            value: +(rlo + span * 0.39).toFixed(3),
            tol: span * 0.002,
            say: 'SV pagkatapos ng − (40 % → 39 %)'
          }
        ])
      });
      sc.push({
        id: 'G4',
        loop: tag,
        title: tag + ': AUTO — MV field naka-disable; AUTO -> MAN na walang talon ng MV (bumpless)',
        drawing:
          'Sa AUTO, ang SV ang ginagalaw ng operator, hindi ang MV. Ang PID at ang COS ay sumusunod sa output kaya walang talon.',
        steps: pre.concat([
          { do: 'press', button: 'M', say: 'M' },
          { do: 'mv', value: 50, say: 'MV = 50' },
          { do: 'wait', s: 30 },
          { do: 'press', button: 'A', say: 'pindutin ang A' },
          { do: 'sv', value: +(rlo + span * 0.5).toFixed(3), say: 'SV = 50 % ng range' },
          { expect: 'mode', value: 'AUTO', say: 'mode' },
          { expect: 'field', name: 'MV', value: 'disabled', say: 'MV field sa AUTO' },
          { do: 'popopen', name: 'MV', say: 'i-click ang kahon ng MV sa AUTO' },
          {
            expect: 'pop',
            name: 'MV',
            value: 'hindi bumukas',
            say: 'control ng MV sa AUTO',
            why: 'MV ay para sa MANUAL lang'
          },
          { do: 'wait', s: wp },
          { do: 'mark', what: 'mv', as: 'mA' },
          { do: 'press', button: 'M', say: 'pindutin ang M' },
          { do: 'wait', s: 1 },
          { expect: 'mode', value: 'MANUAL', say: 'mode' },
          {
            expect: 'cmp',
            what: 'mv',
            than: 'mA',
            value: 'pareho',
            tol: 0.3,
            say: 'MV pagkatapos ng M kumpara sa MV bago ito (bumpless, eksakto)'
          }
        ])
      });
      if (hasR)
        sc.push({
          id: 'G5',
          loop: tag,
          title: tag + ': REMOTE — AUTO talaga, hindi mamamanual, pati SV; A ay bumabalik sa operator',
          drawing: 'REMOTE: ang SV switch ay A (SV galing sa logic). Ang operator ay hindi makapag-M, SV o MV.',
          steps: pre.concat([
            { do: 'press', button: 'R', say: 'pindutin ang R' },
            { do: 'wait', s: 3 },
            { do: 'mark', what: 'sv', as: 'svR' },
            { expect: 'sv-switch', value: 'A (logic / REMOTE)', say: 'SV switch' },
            { expect: 'mode', value: 'AUTO', say: 'mode' },
            { expect: 'disabled', button: 'M', value: 'disabled', say: 'M button' },
            { expect: 'field', name: 'SV', value: 'disabled', say: 'SV field' },
            { expect: 'field', name: 'MV', value: 'disabled', say: 'MV field' },
            { do: 'popopen', name: 'SV', say: 'i-click ang kahon ng SV sa REMOTE' },
            {
              expect: 'pop',
              name: 'SV',
              value: 'hindi bumukas',
              say: 'control ng SV sa REMOTE',
              why: 'REMOTE: hindi mababago ng operator ang SV'
            },
            { do: 'press', button: 'A', say: 'pindutin ang A' },
            { do: 'wait', s: 1 },
            {
              expect: 'cmp',
              what: 'sv',
              than: 'svR',
              value: 'pareho',
              tol: span * 0.002,
              say: 'SV pagkatapos ng A kumpara sa SV sa REMOTE (bumpless)'
            },
            { expect: 'sv-switch', value: 'B (operator / LOCAL)', say: 'SV switch pagkatapos ng A' },
            { expect: 'disabled', button: 'M', value: 'enabled', say: 'M button' },
            { expect: 'field', name: 'SV', value: 'enabled', say: 'SV field' }
          ])
        });
      if (trig)
        sc.push({
          id: 'G6',
          loop: tag,
          title:
            tag +
            ': trip (force manual) habang AUTO — MANUAL agad na walang talon ng MV; pagkawala ng signal ay HINDI automatic na AUTO',
          drawing:
            'Ang signal na pumipili ng B leg ng A/M switch (force manual) ay may prayoridad. Ang operator ang pipili ng AUTO pagkatapos.',
          steps: pre.concat([
            { do: 'press', button: 'M', say: 'M' },
            { do: 'mv', value: 50, say: 'MV = 50' },
            { do: 'wait', s: 30 },
            { do: 'press', button: 'A', say: 'A' },
            { do: 'sv', value: +(rlo + span * 0.5).toFixed(3), say: 'SV' },
            { do: 'wait', s: Math.min(wp, 300) },
            { expect: 'mode', value: 'AUTO', say: 'mode bago ang trip' },
            { do: 'mark', what: 'mv', as: 'mT' },
            {
              do: 'set',
              net: trig[0],
              value: trig[1],
              say: 'itakda ang input na nagpapa-force: ' + (labTxt(S, trig[0]) || 'n' + trig[0]) + ' = ' + trig[1]
            },
            { do: 'waitforce', max: 40 },
            { do: 'skipunless' },
            { expect: 'mode', value: 'MANUAL', say: 'mode pagkatapos ng trip' },
            {
              expect: 'bumpless',
              than: 'mT',
              value: 'pareho',
              tol: 0.3,
              say: 'MV pagkatapos ng trip kumpara sa dati (bumpless, eksakto; maliban kung may interlock na pumuputol sa output sa drawing)'
            },
            { expect: 'disabled', button: 'A', value: 'disabled', say: 'A button' },
            { do: 'set', net: trig[0], value: trig[1] ? 0 : 1, say: 'alisin ang trip' },
            { do: 'watch', s: 15 },
            {
              expect: 'mode-after-clear',
              value: 'MANUAL',
              say: 'mode pagkatapos mawala ang trip',
              why: 'hindi automatic, maliban kung ang drawing mismo ay may 1:A (AUTO) signal'
            },
            { expect: 'disabled', button: 'A', value: 'enabled', say: 'A button' },
            { do: 'press', button: 'A', say: 'pindutin ang A' },
            { expect: 'mode', value: 'AUTO', say: 'mode pagkatapos pindutin ang A' }
          ])
        });
      return {
        loop: tag,
        scenarios: sc,
        notes,
        base: base.sets.length,
        pulses: base.pulses.length,
        trig: trig ? labTxt(S, trig[0]) || 'n' + trig[0] : null
      };
    } finally {
      try {
        AN.reset();
      } catch (e) {}
      AN.run = run0;
    }
  }
  return { run, expand, generic };
})();
