/* Tesai · one language for the whole site (English by default).
   Every page loads this file first, then listens with TesaiLang.on(fn). The choice is stored under "tesai.lang"
   and a "tesai:lang" event tells the page (and any other script on it) when it changes. */
(function () {
  var KEY = 'tesai.lang';
  function clean(v) { return v === 'es' ? 'es' : 'en'; }
  function read() {
    var v = null;
    try {   /* an old link with ?lang=es still works once; the address is cleaned afterwards */
      var u = new URL(location.href), q = u.searchParams.get('lang');
      if (q === 'es' || q === 'en') { v = q; try { localStorage.setItem(KEY, q); } catch (e2) {} u.searchParams.delete('lang'); history.replaceState(null, '', u.pathname + u.search + u.hash); }
    } catch (e) {}
    try { v = v || localStorage.getItem(KEY) || localStorage.getItem('higia.lang') || localStorage.getItem('pulso-lang'); } catch (e) {}
    return clean(v);
  }
  var current = read();
  function apply(l) { document.documentElement.lang = l; }
  apply(current);
  window.TesaiLang = {
    get: function () { return current; },
    set: function (l) {
      l = clean(l);
      var changed = l !== current;
      current = l; apply(l);
      try { localStorage.setItem(KEY, l); } catch (e) {}
      if (changed) window.dispatchEvent(new CustomEvent('tesai:lang', { detail: l }));
    },
    /* run fn now with the current language and again every time it changes */
    on: function (fn) {
      window.addEventListener('tesai:lang', function (e) { fn(e.detail); });
      fn(current);
    }
  };
})();
