/* The IBD drawing on the PC that holds it: the user picks the file made by tools/data/ibd_build.mjs, it stays in this browser (IndexedDB), the TCS sheets of the
   Logic page take its lines and words (tcsDraw, src/digital/parts/02c-tcs.js). The file never comes with the app. */
(function () {
  const DBN = 'ls-ibd-drawing';
  let on = false;
  const db = () =>
    new Promise((ok, no) => {
      const r = indexedDB.open(DBN, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('d');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => no(r.error);
    });
  async function dbGet() {
    try {
      const d = await db();
      return await new Promise(ok => {
        const q = d.transaction('d').objectStore('d').get('v');
        q.onsuccess = () => ok(q.result || null);
        q.onerror = () => ok(null);
      });
    } catch (e) {
      return null;
    }
  }
  async function dbPut(v) {
    try {
      const d = await db(),
        s = d.transaction('d', 'readwrite').objectStore('d');
      if (v) s.put(v, 'v');
      else s.delete('v');
    } catch (e) {}
  }
  const take = v => {
    on = !!(v && v.sheets);
    tcsDraw(on ? v.sheets : null);
    render();
  };
  function pick() {
    if (on) {
      take(null);
      dbPut(null);
      return;
    }
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = '.gz,.json';
    i.onchange = async () => {
      const f = i.files && i.files[0];
      if (!f) return;
      try {
        const b = new Uint8Array(await f.arrayBuffer()),
          v = JSON.parse(/gz$/i.test(f.name) ? await gunz(b) : new TextDecoder().decode(b));
        if (!v.sheets || !/310SC90-794/.test(v.doc || '')) throw new Error('not the IBD drawing file');
        take(v);
        dbPut(v);
      } catch (e) {
        msg('This file cannot be read: ' + e.message);
      }
    };
    i.click();
  }
  window.LS_TCSD = { pick, on: () => on };
  /* a drawing kept in this browser comes back when the sheets are there */
  const t = setInterval(() => {
    if (typeof S === 'undefined' || !S.sheets.some(x => x.tcs)) return;
    clearInterval(t);
    dbGet().then(v => v && take(v));
  }, 500);
})();
