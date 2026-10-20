/* ==========================================================================
   مایان سرویس — js/main.js
   نقطه‌ی شروع: بارگذاری داده → ساخت صفحه → فعال‌سازی افکت‌ها
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan;

  function safe(name, fn) {
    try { fn(); } catch (e) { if (root.console) console.error('[مایان] خطا در ' + name + ':', e); }
  }

  function boot() {
    M.injectIconDefs();
    M.hydrateIcons(document);
    M.ui.hidePreloader(function () { safe('hero', function () { M.motion.splitWords(M.$('#heroTitle')); }); });

    M.store.load().then(function () {
      var d = M.store.data;
      safe('render', function () { M.render.all(d); });
      safe('faq', M.render.bindFaq);
      safe('cart-load', function () { M.cart.load(); });
      safe('products', M.products.init);
      safe('cart', M.cart.init);
      safe('forms', M.forms.init);
      safe('ring', M.ring3d.init);
      safe('shell', M.ui.init);
      safe('fx', M.fx.init);
      safe('motion', M.motion.init);
      safe('dust', M.goldDust.init);
      safe('emblem', function () {
        var ok = false;
        try { ok = M.emblem.init(); } catch (e) { if (root.console) console.warn('WebGL:', e); }
        if (!ok) { M.$('#emblemFallback').hidden = false; M.$('#emblemCanvas').style.display = 'none'; M.hydrateIcons(M.$('#emblemFallback')); }
      });
      var nm = d.settings.showDemoHint; void nm;
    }).catch(function (e) {
      if (root.console) console.error(e);
      document.documentElement.classList.add('no-motion'); document.body.classList.add('ready');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
