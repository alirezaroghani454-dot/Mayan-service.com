/* ==========================================================================
   مایان سرویس — js/modules/motion.js
   موتور انیمیشن سبک (بدون کتابخانه): ظاهر شدن هنگام اسکرول، شمارنده‌ها، عنوان هیرو
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan, $ = M.$, $$ = M.$$;
  var MO = M.motion = {};
  var io = null;

  /* ---------- شمارنده‌ی عددی ---------- */
  function countUp(el) {
    var end = parseFloat(el.dataset.count) || 0, suf = el.dataset.suffix || '', t0 = null, dur = 1700;
    if (M.reducedMotion()) { el.textContent = M.toFa(end) + suf; return; }
    function ease(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = M.toFa(Math.round(end * ease(p))) + suf;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- مشاهده‌گر ظاهر شدن ---------- */
  MO.observe = function (ctx) {
    var els = $$('[data-reveal]:not(.in)', ctx || document);
    if (!('IntersectionObserver' in root)) { els.forEach(function (e) { e.classList.add('in'); }); $$('[data-count]').forEach(countUp); return; }
    if (!io) io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; el.classList.add('in'); io.unobserve(el);
        $$('[data-count]', el).forEach(function (c) { if (!c.__done) { c.__done = true; countUp(c); } });
        if (el.dataset.count && !el.__done) { el.__done = true; countUp(el); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  };

  /* ---------- عنوان هیرو: کلمه‌به‌کلمه (حروف فارسی هرگز جدا نمی‌شوند) ---------- */
  MO.splitWords = function (el) {
    if (!el || M.reducedMotion()) return;
    var i = 0;
    $$('.top, .main', el).forEach(function (line) {
      var words = line.textContent.trim().split(/\s+/);
      line.innerHTML = words.map(function (w) { return '<span class="sw"><span style="--i:' + (i++) + '">' + M.esc(w) + '</span></span>'; }).join(' ');
    });
    el.classList.add('split-init');
    void el.offsetWidth;
    requestAnimationFrame(function () { el.classList.remove('split-init'); el.classList.add('split-go'); });
  };

  MO.init = function () { MO.observe(document); };
})(window);
