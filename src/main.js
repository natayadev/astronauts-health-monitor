/* Tesai · interacciones mínimas: idioma ES/EN y guía de sensores. */
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
    document.title = l === 'en' ? 'Tesai · A second doctor inside your visor' : 'Tesai · Un segundo médico dentro de tu visor';
  }
  TesaiLang.on(setLang);   /* the switch lives in the site bar (shared/site-bar.js); English by default */

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
