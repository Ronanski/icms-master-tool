/* gunzip of the built-in data, with a second way if the first one fails in the browser */ window.gunz =
  async function (bin) {
    try {
      return await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    } catch (e1) {
      try {
        var ds = new DecompressionStream('gzip'),
          w = ds.writable.getWriter();
        w.write(bin);
        w.close();
        var r = ds.readable.getReader(),
          parts = [],
          n = 0;
        for (;;) {
          var q = await r.read();
          if (q.done) break;
          parts.push(q.value);
          n += q.value.length;
        }
        var all = new Uint8Array(n),
          o = 0;
        for (var i = 0; i < parts.length; i++) {
          all.set(parts[i], o);
          o += parts[i].length;
        }
        return new TextDecoder().decode(all);
      } catch (e2) {
        throw new Error('gunzip failed (' + bin.length + ' bytes): ' + e1.message + ' / ' + e2.message);
      }
    }
  };
