/* update check: the page, the apk and the exe keep the installed version and ASK before updating (Stable or Beta, the channel the user chose) */
(function () {
  /* B = the copy built into the apk / exe (file: or https://localhost): it starts at once and works without internet; the update check asks the site */ var B =
    location.protocol === 'file:' ||
    (location.protocol === 'https:' && location.hostname === 'localhost' && !location.port);
  if (!B && !/^https?:$/.test(location.protocol)) return;
  var SITE = 'https://ronanski.github.io/icms-master-tool/',
    T = (document.title.match(/v\d+(\.\d+)+(-beta\.\d+)?/) || [''])[0],
    beta = !B && /\/beta\/(index\.html)?$/.test(location.pathname),
    dir = B ? '' : location.pathname.replace(/index\.html$/, ''),
    base = B ? SITE : dir.replace(/beta\/$/, '');
  /* IN-APP UPDATE (1.22.0, apk / exe): the update and the Beta are DOWNLOADED into the app (IndexedDB) and run from there,
     also without internet. Before: the app went to the web page, so Android opened Chrome and it needed internet. */
  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch (e) {}
    return null;
  }
  function idb(mode, key, val) {
    return new Promise(function (ok, no) {
      var r = indexedDB.open('logic-sim-app', 1);
      r.onupgradeneeded = function () {
        r.result.createObjectStore('pages');
      };
      r.onerror = function () {
        no(r.error);
      };
      r.onsuccess = function () {
        var tx = r.result.transaction('pages', mode),
          st = tx.objectStore('pages'),
          q = mode === 'readonly' ? st.get(key) : st.put(val, key);
        q.onsuccess = function () {
          ok(q.result);
        };
        q.onerror = function () {
          no(q.error);
        };
      };
    });
  }
  var CH = B ? ls('logic.channel') || 'stable' : null,
    STORE = {};
  if (B) {
    ls('ls-site', null); /* old flag of v1.20 ~ v1.21: it sent the app to the web page (Chrome) */
    try {
      STORE = JSON.parse(ls('ls-store') || '{}') || {};
    } catch (e) {}
    var sw0 = '';
    try {
      sw0 = sessionStorage.getItem('ls-swapped') || '';
      sessionStorage.removeItem('ls-swapped');
    } catch (e) {}
    if (sw0) beta = sw0 === 'beta';
    else {
      beta = CH === 'beta'; /* Beta chosen but not downloaded yet: the update check offers the Beta */
      var want = STORE[CH];
      /* Beta: the downloaded Beta; Stable: the downloaded Stable only when it is newer than the copy inside the app */
      if (want && (CH === 'beta' || cmp(want, T) > 0)) {
        /* the rest of this page (the copy inside the app) becomes hidden text, so its scripts do not start */
        document.write('<plaintext style="display:none">');
        idb('readonly', CH)
          .then(function (h) {
            if (!h || h.indexOf('<title>Logic Sim ' + want) < 0) throw new Error('no copy');
            try {
              sessionStorage.setItem('ls-swapped', CH);
            } catch (e) {}
            document.open();
            document.write(h);
            document.close();
          })
          .catch(function () {
            delete STORE[CH];
            ls('ls-store', JSON.stringify(STORE));
            try {
              sessionStorage.setItem('ls-swapped', 'stable');
            } catch (e) {}
            location.reload();
          });
        return;
      }
    }
  }
  /* download the page of a channel into the app; then it runs from the app (no internet needed after this) */
  function download(ch) {
    say('Dina-download ang ' + (ch === 'beta' ? 'Beta' : 'Stable') + ' (mga 4 MB)...');
    return fetch(SITE + (ch === 'beta' ? 'beta/' : '') + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (h) {
        var m = h.match(/<title>Logic Sim (v\d+(\.\d+)+(-beta\.\d+)?)<\/title>/);
        if (!m || h.length < 500000) throw new Error('hindi buo ang na-download');
        return idb('readwrite', ch, h).then(function () {
          STORE[ch] = m[1];
          ls('ls-store', JSON.stringify(STORE));
          return m[1];
        });
      });
  }
  window.lsDownload = download;
  window.lsStore = function () {
    return STORE;
  };
  /* SemVer: 1.21.0-beta.2 > 1.21.0-beta.1; 1.21.0 (Stable) > 1.21.0-beta.9; ang numero ng bersyon ay nag-a-advance lang kapag may Stable (PROJECT_RULES 5f) */
  function pv(a) {
    var m = a.replace('v', '').split('-beta.');
    return { n: m[0].split('.').map(Number), b: m.length > 1 ? Number(m[1]) : Infinity };
  }
  function cmp(a, b) {
    var x = pv(a),
      y = pv(b);
    for (var i = 0; i < 3; i++) {
      if ((x.n[i] || 0) !== (y.n[i] || 0)) return (x.n[i] || 0) - (y.n[i] || 0);
    }
    return x.b === y.b ? 0 : x.b > y.b ? 1 : -1;
  }
  function say(t) {
    var d = document.getElementById('updtoast');
    if (!d) {
      d = document.createElement('div');
      d.id = 'updtoast';
      d.style.cssText =
        'position:fixed;left:50%;bottom:44px;transform:translateX(-50%);z-index:99998;background:#18212a;color:#dbe5ec;border:1px solid #6aaee0;border-radius:8px;padding:8px 14px;font:14px system-ui;max-width:90vw';
      document.body.append(d);
    }
    d.textContent = t;
    d.style.display = 'block';
    clearTimeout(say.t);
    say.t = setTimeout(function () {
      d.style.display = 'none';
    }, 5000);
  }
  function ask(v) {
    var d = document.getElementById('updask');
    if (d) d.remove();
    d = document.createElement('div');
    d.id = 'updask';
    d.style.cssText =
      'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99997;background:#16324a;color:#fff;border:1px solid #6aaee0;border-radius:10px;padding:12px 16px;font:15px/1.4 system-ui;max-width:92vw;box-shadow:0 4px 20px #0008';
    d.innerHTML =
      '<b>May bagong bersyon: ' +
      v +
      '</b> (' +
      (beta ? 'Beta' : 'Stable') +
      ')<br>Ang gamit mo ngayon: ' +
      T +
      '. I-update ba?<br><span id=updbs style="display:inline-flex;gap:8px;margin-top:8px"></span>';
    function bt(t, f, c) {
      var b = document.createElement('button');
      b.textContent = t;
      b.style.cssText =
        'padding:8px 14px;border-radius:6px;border:1px solid #6aaee0;background:' +
        c +
        ';color:#fff;font:600 14px system-ui;cursor:pointer';
      b.onclick = f;
      d.querySelector('#updbs').append(b);
    }
    bt(
      'I-update ngayon',
      function () {
        d.remove();
        go();
      },
      '#1d6b45'
    );
    bt(
      'Huwag muna',
      function () {
        try {
          sessionStorage.setItem('updskip', v);
        } catch (e) {}
        d.remove();
      },
      '#2a3743'
    );
    document.body.append(d);
  }
  function go() {
    if (B) {
      var ch = beta ? 'beta' : 'stable';
      download(ch)
        .then(function (v) {
          say('Na-download: ' + v + '. Binubuksan...');
          setTimeout(function () {
            location.reload();
          }, 600);
        })
        .catch(function (e) {
          say('Hindi na-download (' + ((e && e.message) || 'walang koneksyon') + '). Subukan ulit kapag may internet.');
        });
      return;
    }
    var sw = navigator.serviceWorker;
    if (sw && sw.controller) {
      say('Dina-download ang update...');
      sw.controller.postMessage('update');
    } else location.reload();
  }
  function check(manual) {
    fetch(base + 'version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        var v = j[beta ? 'beta' : 'stable'];
        /* ang version.json ng lumang site.yml ay pinuputol ang '-beta.N' (v1.21.0 lang): sa Beta, basahin ang mismong pahina ng Beta para sa totoong bersyon */
        if (beta && v && !/-beta\./.test(v))
          return fetch(base + 'beta/?t=' + Date.now(), { cache: 'no-store' })
            .then(function (r) {
              return r.text();
            })
            .then(function (h) {
              var m = h.match(/<title>[^<]*?(v\d+(\.\d+)+(-beta\.\d+)?)/);
              fin(m ? m[1] : v, manual);
            });
        fin(v, manual);
      })
      .catch(function () {
        if (manual) say('Walang koneksyon: hindi ma-check ang update.');
      });
  }
  function fin(v, manual) {
    {
      {
        if (v && T && cmp(v, T) > 0) {
          var sk = '';
          try {
            sk = sessionStorage.getItem('updskip');
          } catch (e) {}
          if (manual || sk !== v) ask(v);
        } else if (manual) say('Updated ka na: ' + T + ' (' + (beta ? 'Beta' : 'Stable') + ').');
      }
    }
  }
  window.lsCheckUpdate = check;
  if (!B && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register(dir + 'sw.js', { scope: dir }).catch(function () {});
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data === 'updated') location.reload();
      if (e.data === 'failed') say('Hindi na-download ang update. Subukan ulit.');
    });
  }
  window.addEventListener('load', function () {
    setTimeout(function () {
      var g = document.getElementById('gsbar');
      if (g && !document.getElementById('updbtn')) {
        var b = document.createElement('button');
        b.id = 'updbtn';
        b.textContent = '⟳ Update?';
        b.title = 'I-check kung may bagong bersyon';
        b.style.cssText = 'margin-left:6px';
        b.onclick = function () {
          check(true);
        };
        g.append(b);
      }
      check(false);
    }, 1500);
  });
})();
