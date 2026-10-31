/* start-up error banner: if the program stops while starting, the message is shown here instead of an empty page */ window.addEventListener(
  'error',
  function (e) {
    try {
      /* live test #69: the browser's "ResizeObserver loop" warning is not a program error (the layout settles in the next frame) */
      if (/ResizeObserver loop/i.test(e.message || '')) return;
      var d = document.getElementById('errbn');
      if (!d) {
        d = document.createElement('div');
        d.id = 'errbn';
        d.style.cssText =
          'position:fixed;left:0;right:0;top:0;z-index:99999;background:#7a1f1f;color:#fff;font:13px/1.4 system-ui;padding:8px 12px;white-space:pre-wrap';
        (document.body || document.documentElement).append(d);
      }
      d.textContent +=
        (d.textContent ? '\n' : '') +
        'ERROR: ' +
        (e.message || e) +
        ' (' +
        (e.lineno || '?') +
        ':' +
        (e.colno || '?') +
        ')';
    } catch (x) {}
  }
);
window.addEventListener('unhandledrejection', function (e) {
  try {
    var d = document.getElementById('errbn');
    if (!d) {
      d = document.createElement('div');
      d.id = 'errbn';
      d.style.cssText =
        'position:fixed;left:0;right:0;top:0;z-index:99999;background:#7a1f1f;color:#fff;font:13px/1.4 system-ui;padding:8px 12px;white-space:pre-wrap';
      (document.body || document.documentElement).append(d);
    }
    d.textContent += (d.textContent ? '\n' : '') + 'ERROR: ' + ((e.reason && e.reason.message) || e.reason);
  } catch (x) {}
});
