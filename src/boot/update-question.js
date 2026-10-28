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
        /* 2.1.0-beta.12: a write is done only when its TRANSACTION is complete (on the disk). Before, the app reloaded at the
           request success: on a real exe / apk the 6 MB write was still running and the reload aborted it, so the Beta was
           not there at the start, the app went back to Stable and the user downloaded again (user report, v2.0.0) */
        if (mode === 'readonly') {
          q.onsuccess = function () {
            ok(q.result);
          };
        } else {
          tx.oncomplete = function () {
            ok(q.result);
          };
          tx.onabort = function () {
            no(tx.error || new Error('storage write aborted'));
          };
        }
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
      /* 2.0.0: a stored copy OLDER than the copy inside the app is never opened (it was a Beta downloaded by an older
         install, e.g. 1.22.0-beta.4 under Stable 1.23.0: choosing Beta opened that old copy, so the switch looked broken).
         It is dropped; the update check then offers the newest Beta. */
      if (want && cmp(want, T) < 0) {
        delete STORE[CH];
        ls('ls-store', JSON.stringify(STORE));
        want = '';
      }
      /* Beta: the downloaded Beta; Stable: the downloaded Stable only when it is newer than the copy inside the app */
      if (want && (CH === 'beta' || cmp(want, T) > 0)) {
        /* the rest of this page (the copy inside the app) becomes hidden text, so its scripts do not start */
        document.write('<plaintext style="display:none">');
        idb('readonly', CH)
          .then(function (h) {
            if (!h || (h.indexOf('<title>Logic Sim ' + want) < 0 && h.indexOf('<title>DCS Logic Simulator ' + want) < 0)) throw new Error('no copy');
            try {
              sessionStorage.setItem('ls-swapped', CH);
            } catch (e) {}
            document.open();
            document.write(h);
            document.close();
          })
          .catch(function (e) {
            delete STORE[CH];
            ls('ls-store', JSON.stringify(STORE));
            /* 2.1.0-beta.12: say why, once, on the copy inside the app (before: back to Stable without a word) */
            ls(
              'ls-swap-err',
              (CH === 'beta' ? 'Beta ' : 'Update ') +
                want +
                ' could not be opened (' +
                ((e && e.message) || 'storage') +
                '). Choose it again to download it once more.'
            );
            try {
              sessionStorage.setItem('ls-swapped', 'stable');
            } catch (e) {}
            location.reload();
          });
        return;
      }
    }
  }
  if (B && ls('ls-swap-err')) {
    var se = ls('ls-swap-err');
    ls('ls-swap-err', null);
    setTimeout(function () {
      say(se);
    }, 1500);
  }
  /* download the page of a channel into the app; then it runs from the app (no internet needed after this) */
  function download(ch) {
    say('Downloading ' + (ch === 'beta' ? 'Beta' : 'Stable') + ' (about 6 MB)...');
    return fetch(SITE + (ch === 'beta' ? 'beta/' : '') + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (h) {
        var m = h.match(/<title>(?:Logic Sim|DCS Logic Simulator) (v\d+(\.\d+)+(-beta\.\d+)?)<\/title>/);
        if (!m || h.length < 500000) throw new Error('incomplete download');
        return idb('readwrite', ch, h)
          .then(function () {
            /* read it back before the reload: the copy that will be opened is really there */
            return idb('readonly', ch);
          })
          .then(function (b) {
            if (!b || b.length !== h.length) throw new Error('the copy was not saved in the app (storage)');
          })
          .then(function () {
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
        'position:fixed;left:50%;bottom:44px;transform:translateX(-50%);z-index:99998;background:var(--c-pane);color:var(--c-tx);border:1px solid var(--c-acc);border-radius:8px;padding:8px 14px;font:14px system-ui;max-width:90vw';
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
    /* 3.2.0 retest #23 (R4: the PC kept the old Beta with no clear notice): a banner across the top of the page, over every page,
       until Update now or Later */
    d.setAttribute('role', 'alert');
    d.style.cssText =
      'position:fixed;left:0;right:0;top:0;z-index:100001;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 14px;background:#b45309;color:#fff;border-bottom:2px solid #fbbf24;padding:10px 16px;font:15px/1.4 system-ui;box-shadow:0 4px 20px #0008';
    d.innerHTML =
      '<span><b>New ' +
      (beta ? 'Beta' : 'Stable') +
      ' available: ' +
      v +
      '</b> · installed: ' +
      T +
      '. Update now to test the same build.</span><span id=updbs style="display:inline-flex;gap:8px"></span>';
    function bt(t, f, c) {
      var b = document.createElement('button');
      b.textContent = t;
      b.style.cssText =
        'padding:8px 14px;border-radius:6px;border:1px solid var(--c-acc);background:' +
        c +
        ';color:#fff;font:600 14px system-ui;cursor:pointer';
      b.onclick = f;
      d.querySelector('#updbs').append(b);
    }
    bt(
      'Update now',
      function () {
        d.remove();
        go();
      },
      '#1d6b45'
    );
    bt(
      'Later',
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
          say('Download failed (' + ((e && e.message) || 'no connection') + '). Subukan ulit kapag may internet.');
        });
      return;
    }
    var sw = navigator.serviceWorker;
    if (sw && sw.controller) {
      say('Downloading the update...');
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
        if (manual) say('No connection: cannot check for updates.');
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
        } else if (manual) say('Up to date: ' + T + ' (' + (beta ? 'Beta' : 'Stable') + ').');
      }
    }
  }
  window.lsCheckUpdate = check;
  if (!B && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register(dir + 'sw.js', { scope: dir }).catch(function () {});
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data === 'updated') location.reload();
      if (e.data === 'failed') say('The update could not be downloaded. Try again.');
    });
  }
  window.addEventListener('load', function () {
    setTimeout(function () {
      var g = document.getElementById('gsbar');
      if (g && !document.getElementById('updbtn')) {
        var b = document.createElement('button');
        b.id = 'updbtn';
        b.textContent = '⟳ Update?';
        b.title = 'Check for a new version';
        b.style.cssText = 'margin-left:6px';
        b.onclick = function () {
          check(true);
        };
        /* 3.2.0 retest #23: into the settings menu of the shell at once (not over the Home heading) */
        if (window.lsUpdHome) window.lsUpdHome(b);
        else g.append(b);
      }
      check(false);
      /* 3.2.0 retest #23: a Beta published while the app is open is announced too (every 10 min) */
      setInterval(function () {
        if (!document.getElementById('updask')) check(false);
      }, 600000);
    }, 1500);
  });
})();
