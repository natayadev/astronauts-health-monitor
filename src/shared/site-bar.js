/* Tesai · the two pieces every top bar has, on every page:
   <tesai-brand root="./"></tesai-brand>   the Tesai logo and name, always linking to the home page
   <tesai-lang></tesai-lang>               the EN | ES switch (one language for the whole site)
   Everything else in a bar (links, tabs, status) belongs to the page it is on. Needs shared/lang.js loaded first. */
(function () {
  var MARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  class TesaiBrand extends HTMLElement {
    connectedCallback() {
      this.setAttribute('data-i18n', 'off');          /* the page's own translators leave it alone */
      var root = this.getAttribute('root') || './';
      this.innerHTML = '<a class="sn-brand" href="' + esc(root) + '" aria-label="Tesai"><span class="sn-logo" aria-hidden="true">' + MARK + '</span><b>Tesai</b></a>';
    }
  }

  class TesaiLang extends HTMLElement {
    connectedCallback() {
      if (this._on) return;
      this._on = true;
      var self = this;
      this.setAttribute('data-i18n', 'off');
      this._fn = function () { self.render(); };
      window.addEventListener('tesai:lang', this._fn);
      this.addEventListener('click', function (e) {
        var b = e.target.closest('[data-lang]');
        if (b && window.TesaiLang) window.TesaiLang.set(b.getAttribute('data-lang'));
      });
      this.render();
    }
    disconnectedCallback() { window.removeEventListener('tesai:lang', this._fn); this._on = false; }
    render() {
      var l = (window.TesaiLang && window.TesaiLang.get()) || 'en';
      this.innerHTML = '<div class="sn-lang" role="group" aria-label="' + (l === 'es' ? 'Idioma' : 'Language') + '">' +
        '<button type="button" data-lang="en" lang="en" aria-label="English" aria-pressed="' + (l === 'en') + '">EN</button>' +
        '<button type="button" data-lang="es" lang="es" aria-label="Español" aria-pressed="' + (l === 'es') + '">ES</button></div>';
    }
  }

  if (!customElements.get('tesai-brand')) customElements.define('tesai-brand', TesaiBrand);
  if (!customElements.get('tesai-lang')) customElements.define('tesai-lang', TesaiLang);
})();
