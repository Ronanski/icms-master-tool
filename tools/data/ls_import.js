// Adds the limestone injection DITL sheets (ROTOFEED, station 104) to the built-in DITL sheets (src/data/pre.txt).
// The drawing is an Excel book (document-references/bottomash-limestone-logic.zip -> Limestone Logic/limestone_logic.xls), not a
// DXF: tools/data/ls_xlsx.py reads it (cell borders = wires and block outlines, drawing objects = negation circles, dots, >=1)
// and writes the sheets as JSON; this puts them in pre.txt (a sheet with the same name is replaced).
// Usage: soffice --headless --convert-to xlsx limestone_logic.xls; unzip limestone_logic.xlsx -d x
//        python3 tools/data/ls_xlsx.py x ls.json; node tools/data/ls_import.js ls.json
const fs = require('fs'),
  path = require('path'),
  zlib = require('zlib');
const PRE = path.join(__dirname, '..', '..', 'src', 'data', 'pre.txt');
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const lines = zlib.gunzipSync(Buffer.from(fs.readFileSync(PRE, 'utf8').trim(), 'base64')).toString().split('\n').filter(Boolean);
const byName = new Map(lines.map((l, i) => [JSON.parse(l).name, i]));
for (const s of L) {
  const o = JSON.stringify(s);
  if (byName.has(s.name)) lines[byName.get(s.name)] = o;
  else {
    byName.set(s.name, lines.length);
    lines.push(o);
  }
  console.log('OK', s.name, s.title);
}
fs.writeFileSync(PRE, zlib.gzipSync(Buffer.from(lines.join('\n') + '\n'), { level: 9 }).toString('base64') + '\n');
console.log(lines.length, 'sheets in pre.txt');
