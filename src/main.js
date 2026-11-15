/* Higía · interacciones mínimas: idioma ES/EN y guía de sensores. */
(function () {
  var root = document.documentElement;
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* ---- idioma: cada texto trae data-es / data-en ---- */
  function setLang(l) {
    root.lang = l;
    document.querySelectorAll('[data-es][data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-' + l); });
    document.querySelectorAll('[data-es-alt]').forEach(function (el) { el.alt = el.getAttribute('data-' + l + '-alt'); });
    document.querySelectorAll('.pin[data-l-es]').forEach(function (p) { p.setAttribute('aria-label', p.getAttribute('data-l-' + l)); });
    document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
    document.title = l === 'en' ? 'Higía · A second doctor inside your visor' : 'Higía · Un segundo médico dentro de tu visor';
    /* la simulación hereda el idioma: por almacenamiento compartido y, de respaldo, por ?lang= */
    document.querySelectorAll('a[href^="simulacion/"]').forEach(function (a) {
      if (!a.dataset.base) a.dataset.base = a.getAttribute('href').split('?')[0];
      a.setAttribute('href', a.dataset.base + '?lang=' + l);
    });
    save('higia.lang', l);
  }
  document.querySelectorAll('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
  var saved = load('higia.lang');
  setLang(saved === 'en' || (!saved && /^en/i.test(navigator.language || '')) ? 'en' : 'es');

  /* ---- guía de sensores: punto del astronauta <-> tarjeta ---- */
  var sens = document.getElementById('sens');
  function pick(s) {
    sens.dataset.active = s;
    sens.querySelectorAll('.scard').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.s === s)); });
    sens.querySelectorAll('.pin').forEach(function (p) { p.classList.toggle('on', p.dataset.s === s); });
  }
  sens.querySelectorAll('.scard, .pin').forEach(function (el) {
    el.addEventListener('click', function () { pick(el.dataset.s); });
    el.addEventListener('mouseenter', function () { pick(el.dataset.s); });
  });
  pick('patch');
})();
