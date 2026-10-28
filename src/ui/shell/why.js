/* ===== 3.2.0-beta.6 "BAKIT?" (WHY): the live cause of a signal, read from the netlist of the drawings (user 2026-10-22: the app must
   explain WHY, e.g. "FICFW1007 will not go AUTO" -> "M.0228 = 1 <- LT-BR1001-2 BAD SIGNAL"). It walks UPSTREAM from a net with the
   values of RUN: through the gates that make the value what it is (OR = the inputs that are 1, AND = the inputs that are 0 ...),
   through the links to the other ABC sheets, and it stops at a root: an input of the operator / HMI, a transmitter, a bad signal,
   a comparator with its values, a timer, a flip-flop memory, a DITL signal (with the DITL "To make it ..." when that sheet runs),
   or a FORCE of the user. Read only: it never changes a value. AN.why(sheet, net) -> { lines: [{ d, txt, k, sh, n }] } ===== */
(function () {
  const MAXN = 60,
    MAXD = 14;
  const dig = (S, n) => !!(S.nets[n] && S.nets[n].dig);
  const val = (S, n) => {
    const x = S.rt && S.rt.v ? S.rt.v[n] : undefined;
    if (dig(S, n)) return x > 0.5 ? 1 : 0;
    return x;
  };
  const fmt = x =>
    x == null || !isFinite(x) ? '—' : (Math.abs(x) >= 100 ? x.toFixed(1) : Math.abs(x) >= 10 ? x.toFixed(2) : x.toFixed(3)).replace(/^-(0(?:\.0+)?)$/, '$1');
  const nm = (S, n) => {
    try {
      return (AN.nm(S, n) || '').trim();
    } catch (e) {
      return '';
    }
  };
  const shv = (S, n) => (dig(S, n) ? String(val(S, n)) : fmt(val(S, n)));
  const label = (S, n) => nm(S, n) || 'wire ' + n;
  /* the block that drives net n on this sheet (not a link) */
  const driver = (S, n) => (S.drv[n] || []).find(d => d.k !== 'LINK');
  const KN = {
    OR: 'OR',
    AND: 'AND',
    NOT: 'NOT',
    FF: 'FLIP-FLOP',
    TON: 'ON DELAY',
    TOF: 'OFF DELAY',
    TPS: 'PULSE',
    HC: 'HIGH MONITOR',
    LC: 'LOW MONITOR',
    DEV: 'DEVIATION MONITOR',
    CMPK: 'COMPARATOR',
    DCMP: 'COMPARATOR',
    SIGAB: 'BAD SIGNAL',
    ALM: 'ALARM',
    HS: 'HAND SWITCH'
  };
  function walk(sh, n0) {
    const out = [],
      seen = new Set();
    const add = (d, k, txt, s, n) => out.length < MAXN && out.push({ d, k, txt, sh: s && s.name, n });
    function go(s, n, d) {
      const S = s.S;
      if (!S || out.length >= MAXN) return;
      const key = s.name + ':' + n;
      if (seen.has(key)) return;
      seen.add(key);
      const L = label(S, n),
        v = shv(S, n);
      if (d > MAXD) return add(d, 'more', L + ' = ' + v + ' (… more)', s, n);
      /* a FORCE of the user (not the plant model) wins over everything */
      if (S.rt.force && S.rt.force[n] !== undefined && !(S.rt.pf && S.rt.pf[n])) return add(d, 'force', L + ' = ' + v + ' · FORCED by you (release it in the Inspector or the FORCED list)', s, n);
      const b = driver(S, n);
      if (!b) {
        const l = S.xlk && S.xlk[n];
        if (l && l.from && l.from !== s && l.fromNets && l.fromNets.length) {
          add(d, 'link', L + ' = ' + v + ' · comes from ' + l.from.name, s, n);
          const fs = AN.ensure ? (AN.ensure(l.from), l.from) : l.from;
          return go(fs, l.fromNets[0], d + 1);
        }
        if (l && (l.ditl || l.tag)) return ditl(d, s, n, L, v, l);
        if (S.ext && S.ext.includes(n)) return add(d, 'input', L + ' = ' + v + ' · input of the operator / HMI (switch, PB or value)', s, n);
        return add(d, 'root', L + ' = ' + v, s, n);
      }
      const ins = (b.i || []).filter(i => i != null && i >= 0),
        k = b.k,
        kn = KN[k] || k;
      const one = (txt, kind) => add(d, kind || 'gate', L + ' = ' + v + ' · ' + txt, s, n);
      if (k === 'AI') return one('transmitter ' + (b.tagAI || nm(S, n) || 'AI') + ' (measurement)', 'meas');
      if (k === 'SIGAB') return one('BAD SIGNAL of the transmitter ' + (b.ai && b.ai.tagAI ? b.ai.tagAI : '') + ' (SIG.AB): 1 = the signal is bad', 'bad');
      if (k === 'CONST') return one('constant on the drawing', 'root');
      if (dig(S, n)) {
        const on = i => val(S, i) === 1,
          V = val(S, n);
        if (k === 'OR') {
          one('OR: ' + (V ? 'one input is 1 is enough' : 'all inputs are 0'));
          return (V ? ins.filter(on) : ins).forEach(i => go(s, i, d + 1));
        }
        if (k === 'AND') {
          one('AND: ' + (V ? 'all inputs are 1' : 'one input at 0 blocks it'));
          return (V ? ins : ins.filter(i => !on(i))).forEach(i => go(s, i, d + 1));
        }
        if (k === 'NOT') {
          one('NOT of the input');
          return ins.forEach(i => go(s, i, d + 1));
        }
        if (k === 'FF') {
          one('FLIP-FLOP (memory): ' + (V ? 'was SET and is not reset' : 'was RESET or never set') + '; S = ' + (b.S >= 0 ? shv(S, b.S) : '?') + ', R = ' + (b.Rn >= 0 ? shv(S, b.Rn) : '?'), 'mem');
          if (V && b.Rn >= 0) go(s, b.Rn, d + 1);
          if (b.S >= 0) go(s, b.S, d + 1);
          return;
        }
        if (k === 'TON' || k === 'TOF' || k === 'TPS') {
          one(kn + ' ' + (b.p && b.p.t != null ? b.p.t + ' s' : ''), 'timer');
          return ins.forEach(i => go(s, i, d + 1));
        }
        if (k === 'HC' || k === 'LC' || k === 'DEV' || k === 'CMPK' || k === 'DCMP' || k === 'ALM') {
          const xs = ins.map(i => label(S, i) + ' ' + shv(S, i)).join(', ');
          const p = b.p || {},
            lim = ['sp', 'h', 'l', 'hh', 'll', 'k', 'dv']
              .filter(q => p[q] != null && isFinite(p[q]))
              .map(q => q.toUpperCase() + ' ' + p[q])
              .join(', ');
          return one(kn + ': ' + xs + (lim ? ' (limit ' + lim + ')' : ''), 'cmp');
        }
        one(kn);
        return ins.forEach(i => go(s, i, d + 1));
      }
      /* an analog value: name the block and its inputs, one level */
      one(kn + (ins.length ? ' of ' + ins.map(i => label(S, i) + ' ' + shv(S, i)).join(', ') : ''), 'an');
    }
    /* a DITL signal: its value on the DITL page and, when that sheet runs, what is missing (the DITL "To make it ..." list) */
    function ditl(d, s, n, L, v, l) {
      add(d, 'ditl', L + ' = ' + v + ' · from DITL ' + (l.tag || '') + (l.peer ? ' (' + l.peer + ')' : ''), s, n);
    }
    if (sh && sh.S) go(sh, n0, 0);
    return { lines: out };
  }
  /* the cause of a controller that cannot go AUTO: its force-manual signals that are 1 now, each walked to its root */
  const whyMan = (sh, c) => {
    const S = sh.S,
      on = (c.sigs || []).filter(z => z.role === 'MAN' && S.rt.v[z.n] > 0.5);
    return on.map(z => ({ sig: z.name, lines: walk(sh, z.n).lines }));
  };
  const put = () => (window.AN && AN.sheets ? Object.assign(AN, { why: walk, whyMan }) : setTimeout(put, 200));
  put();
})();
