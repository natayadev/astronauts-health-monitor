/* Tesai · interacciones mínimas: idioma ES/EN, guía de sensores y video del Visor. */
(function () {
  var root = document.documentElement;

  /* ---- idioma: cada texto trae data-es / data-en ---- */
  function setLang(l) {
    root.lang = l;
    document.querySelectorAll('[data-es][data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-' + l); });
    document.querySelectorAll('[data-es-alt]').forEach(function (el) { el.alt = el.getAttribute('data-' + l + '-alt'); });
    document.querySelectorAll('.pin[data-l-es]').forEach(function (p) { p.setAttribute('aria-label', p.getAttribute('data-l-' + l)); });
    document.title = l === 'en' ? 'Tesai · A second doctor inside your visor' : 'Tesai · Un segundo médico dentro de tu visor';
    document.querySelectorAll('[data-es-label]').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute('data-' + l + '-label')); });
    /* capturas de Tesai en el idioma elegido */
    document.querySelectorAll('img[data-img-es]').forEach(function (img) { img.src = img.getAttribute('data-img-' + l); });
    var v = document.getElementById('visor-loop');
    if (v) {
      var src = v.getAttribute('data-src-' + l);
      if (v.dataset.cur !== src) {
        v.dataset.cur = src;
        v.poster = v.getAttribute('data-poster-' + l);
        var s = v.querySelector('source'); s.src = src; v.load();
        if (!v.dataset.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      }
    }
  }
  /* el video del Visor no arranca solo si la persona pidió reducir el movimiento */
  var vid = document.getElementById('visor-loop'), tog = document.getElementById('visor-toggle');
  if (vid && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) vid.dataset.paused = '1';
  TesaiLang.on(setLang);   /* the switch lives in the site bar (shared/site-bar.js); English by default */

  /* ---- video del Visor: se reproduce solo, en silencio, y se puede pausar ---- */
  if (vid && tog) {
    var sync = function () {
      var paused = !!vid.dataset.paused;
      tog.setAttribute('aria-pressed', String(paused));
      var label = tog.querySelector('span');
      label.setAttribute('data-es', paused ? 'Reproducir' : 'Pausar');
      label.setAttribute('data-en', paused ? 'Play' : 'Pause');
      label.textContent = label.getAttribute('data-' + root.lang);
    };
    tog.addEventListener('click', function () {
      if (vid.dataset.paused) { delete vid.dataset.paused; var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
      else { vid.dataset.paused = '1'; vid.pause(); }
      sync();
    });
    sync();
  }

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
