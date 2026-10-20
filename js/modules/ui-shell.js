/* ==========================================================================
   مایان سرویس — js/modules/ui-shell.js
   هدر، منوی موبایل، نوار پیشرفت، دکمه بازگشت، منوی فعال، پری‌لودر، نور ماوس
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan, $ = M.$, $$ = M.$$;
  var UI = M.ui = {};

  UI.initMenu = function () {
    var nav = $('#mainNav'), btn = $('#menuToggle');
    function set(open) {
      nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); document.body.classList.toggle('no-scroll', open);
      btn.innerHTML = M.icon(open ? 'x' : 'menu');
    }
    btn.addEventListener('click', function () { set(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) set(false); });
    root.addEventListener('resize', M.debounce(function () { if (root.innerWidth > 980) set(false); }, 150));
  };

  UI.initScroll = function () {
    var header = $('#siteHeader'), bar = $('#scrollBar'), top = $('#toTop'), links = $$('.main-nav a'), steps = $('#stepsList');
    var secs = links.map(function (a) { return $(a.getAttribute('href')); });
    var announce = $('#announceBar');
    var onScroll = M.rafThrottle(function () {
      var y = root.scrollY, max = document.documentElement.scrollHeight - root.innerHeight;
      header.classList.toggle('scrolled', y > 30);
      bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')';
      top.classList.toggle('show', y > 700);
      var ah = announce.hidden ? 0 : announce.offsetHeight;
      header.style.top = Math.max(0, ah - y) + 'px';
      // لینک فعال منو
      var cur = -1, line = root.innerHeight * 0.35;
      secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) cur = i; });
      links.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
      // پیشرفت خط مراحل
      if (steps) { var r = steps.getBoundingClientRect(), p = M.clamp((root.innerHeight * 0.75 - r.top) / Math.max(r.height, 1), 0, 1); steps.style.setProperty('--p', p.toFixed(3)); }
    });
    root.addEventListener('scroll', onScroll, { passive: true }); root.addEventListener('resize', onScroll); onScroll();
    top.addEventListener('click', function () { root.scrollTo({ top: 0, behavior: M.reducedMotion() ? 'auto' : 'smooth' }); });
  };

  UI.initCursor = function () {
    var g = $('#cursorGlow'); if (!g || M.isTouch() || M.reducedMotion()) return;
    var x = 0, y = 0, tx = 0, ty = 0;
    root.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; g.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', function () { g.classList.remove('on'); });
    (function loop() { x += (tx - x) * 0.12; y += (ty - y) * 0.12; g.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; requestAnimationFrame(loop); })();
  };

  /* پری‌لودر: بعد از بارگذاری (یا حداکثر ۲.۸ ثانیه) محو می‌شود */
  UI.hidePreloader = function (cb) {
    var done = false;
    function go() { if (done) return; done = true; document.body.classList.add('ready'); document.body.classList.remove('is-loading'); if (cb) cb(); }
    var min = M.reducedMotion() ? 0 : 1500, t0 = performance.now();
    function afterLoad() { setTimeout(go, Math.max(0, min - (performance.now() - t0))); }
    if (document.readyState === 'complete') afterLoad(); else root.addEventListener('load', afterLoad);
    setTimeout(go, 2800);
  };

  UI.init = function () { UI.initMenu(); UI.initScroll(); UI.initCursor(); };
})(window);
