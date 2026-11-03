// ASSUMED REGISTER (no-cheat audit, 2026-11-03; user: "Bawal yang assumed"): lists EVERY value of the plant model and the field
// switches whose comment in the code says ASSUMED / "not in the repository" / "typical", with its file and line, so nobody has to trust a
// report: run it and read the list. Each entry is tagged:
//   NO-SOURCE  the code itself says the number has no document (ASSUMED, not in the repository, typical value, calibrated);
//   FOUND      the comment cites a document (PR-OPE-500x, FHI, Fig., a snapshot .PNG, PD-0xx, alarm list, I/O list, manual, ABC/DITL sheet)
//              AND does not say ASSUMED.
// Only NO-SOURCE lines are written in detail (FOUND ones are counted per file). The register does not judge the physics; it makes the
// unknowns visible. Usage: node tools/audit/assumed_register.js [out.md]   (default docs/audit/ASSUMED_REGISTER.md)
const fs = require('fs'),
  path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
/* every source file of the app (not the generated SOP data) */
const walk = d => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(d + '/' + e.name) : /\.js$/.test(e.name) ? [d + '/' + e.name] : []));
const FILES = walk('src').filter(f => !/pr-ope-5002(-lim)?\.js$/.test(f));
const NOSRC = /\bassum(e|ed|es|ing|ption)\b|not in the repository|not in any doc|typical value|typical of|Not measured|calibrated/i;
const DOC = /PR-OPE-500\d|FHI|Fig\.?\s?\d|\b\d+\.PNG\b|\b\d+\.png\b|PD-0\d\d|K1AU3|alarm list|I\/O list|memory list|manual|ABC-\d{3}|DITL-\d|snapshot|design data|SECT_?\d|TAB_\d|IO list/i;
/* a comment block with the code line it belongs to: the comment text (joined) and the first code line after / before it */
function blocks(src) {
  const out = [];
  const re = /\/\*([\s\S]*?)\*\//g;
  let m;
  while ((m = re.exec(src))) {
    const line = src.slice(0, m.index).split('\n').length;
    const lineEnd = line + m[0].split('\n').length - 1;
    const txt = m[1].replace(/\s+/g, ' ').trim();
    /* the code the comment describes: the text on the same line before it (a "key: value /* ... *\/" entry) or the next code line */
    const lines = src.split('\n');
    const before = lines[line - 1].slice(0, lines[line - 1].indexOf('/*')).trim();
    let code = before;
    if (!code) for (let i = lineEnd; i < Math.min(lines.length, lineEnd + 4); i++) if (lines[i].trim() && !/^\s*\/[*/]/.test(lines[i])) { code = lines[i].trim(); break; }
    out.push({ line, txt, code: code.slice(0, 160) });
  }
  return out;
}
/* the phrase that names what is missing: the words around ASSUMED / not in the repository */
function need(txt) {
  const i = txt.search(NOSRC);
  const a = Math.max(0, txt.lastIndexOf('.', i - 1) + 1, txt.lastIndexOf(':', i - 1) + 1, i - 220);
  let s = txt.slice(a, Math.min(txt.length, i + 120)).trim();
  return s.length > 340 ? s.slice(0, 340) + ' ...' : s;
}
const rows = [];
const per = {};
for (const f of FILES) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  per[f] = { found: 0, nosrc: 0 };
  for (const b of blocks(src)) {
    const no = NOSRC.test(b.txt),
      doc = DOC.test(b.txt);
    if (no) {
      per[f].nosrc++;
      rows.push({ f, ...b, partial: doc });
    } else if (doc && /\d/.test(b.code + b.txt)) per[f].found++;
  }
}
const out = process.argv[2] || path.join(ROOT, 'docs/audit/ASSUMED_REGISTER.md');
let md = '# ASSUMED REGISTER (awtomatiko)\n\n';
md += 'Gawa ng `node tools/audit/assumed_register.js` (huling takbo: ' + new Date().toISOString().slice(0, 10) + '). Hindi ito isinusulat ng kamay: bawat value na ang code mismo ay nagsasabing ASSUMED / "not in the repository" / typical / calibrated ay nakalista rito, kasama ang file at linya.\n\n';
md += 'Tag: **NO-SOURCE** = walang dokumento ang numero (ang code mismo ang umaamin). **NO-SOURCE (bahagi)** = may dokumento ang bahagi ng paliwanag pero may ASSUMED pa rin sa loob. **FOUND** = may binanggit na dokumento at walang ASSUMED (bilang lang bawat file sa ibaba).\n\n';
md += '## Bilang bawat file\n\n';
for (const f in per) if (per[f].nosrc) md += '- `' + f + '`: NO-SOURCE ' + per[f].nosrc + ', FOUND ' + per[f].found + '\n';
md += '\nKabuuang NO-SOURCE: **' + rows.length + '**\n\n## Bawat NO-SOURCE (file:linya, code, ano ang kulang)\n\n';
for (const r of rows) md += '- `' + r.f + ':' + r.line + '` ' + (r.partial ? '**NO-SOURCE (bahagi)**' : '**NO-SOURCE**') + (r.code ? ' · `' + r.code.replace(/`/g, "'") + '`' : '') + '\n  - Kulang: ' + need(r.txt) + '\n';
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md);
console.log('NO-SOURCE ' + rows.length + ' · ' + Object.entries(per).filter(([, c]) => c.nosrc).map(([f, c]) => path.basename(f) + ' ' + c.nosrc + '/' + c.found).join(', ') + ' -> ' + path.relative(ROOT, out));
