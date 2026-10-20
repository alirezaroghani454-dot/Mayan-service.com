/* ==========================================================================
   مایان سرویس — js/modules/ring3d.js
   حلقه‌ی سه‌بعدی دسته‌بندی‌ها (CSS 3D) — با کشیدن، چرخش خودکار و کلیک برای فیلتر
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan, $ = M.$, esc = M.esc;
  var R = M.ring3d = {};

  R.init = function () {
    var stage = $('#ringStage'), ring = $('#ring3d'), cats = M.store.data.categories;
    if (!stage || !ring || !cats.length) { if (stage) stage.parentNode.parentNode.hidden = true; return; }
    var act = M.store.activeProducts(), n = cats.length;
    ring.innerHTML = cats.map(function (c, i) {
      var cnt = act.filter(function (p) { return p.cat === c.id; }).length;
      return '<div class="ring-item" data-i="' + i + '"><div class="ring-card" role="button" tabindex="0" data-cat="' + esc(c.id) + '">' +
        '<div class="rc-ic">' + M.productIcon(c.icon) + '</div><h4>' + esc(c.name) + '</h4><small>' + esc(c.desc || '') + '</small><span class="cnt">' + M.toFa(cnt) + ' محصول</span></div></div>';
    }).join('');
    var items = M.$$('.ring-item', ring), step = 360 / n, angle = 0, vel = 0, drag = false, moved = 0, lastX = 0, radius = 300, hover = false, visible = true, raf = 0;

    function layout() {
      var w = stage.clientWidth, cw = w < 520 ? 150 : 190, ch = Math.round(cw * 1.3);
      radius = Math.max(150, (cw / 2) / Math.tan(Math.PI / n) * 1.22 + 14);
      stage.style.setProperty('--iw', cw + 'px'); stage.style.setProperty('--ih', ch + 'px');
      items.forEach(function (it, i) { it.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + radius + 'px)'; });
      draw();
    }
    function draw() {
      ring.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + angle + 'deg)';
      items.forEach(function (it, i) {
        var a = (i * step + angle) * Math.PI / 180, front = (Math.cos(a) + 1) / 2;
        it.style.opacity = (0.28 + 0.72 * front).toFixed(2);
        it.style.pointerEvents = front > 0.35 ? 'auto' : 'none';
        it.style.zIndex = Math.round(front * 100);
      });
    }
    function tick() {
      raf = 0;
      if (!drag) {
        if (Math.abs(vel) > 0.02) { angle += vel; vel *= 0.95; }
        else if (!hover && !M.reducedMotion()) angle -= 0.16;
      }
      draw();
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    }
    function start() { if (!raf) raf = requestAnimationFrame(tick); }

    stage.addEventListener('pointerdown', function (e) { drag = true; moved = 0; lastX = e.clientX; vel = 0; hover = true; });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return; var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); angle += dx * 0.35; vel = dx * 0.35;
    });
    window.addEventListener('pointerup', function () { drag = false; });
    stage.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    stage.addEventListener('pointerleave', function () { hover = false; });
    function pick(card) { if (moved > 8) return; M.products.setCategory(card.dataset.cat, true); }
    ring.addEventListener('click', function (e) { var c = e.target.closest('.ring-card'); if (c) pick(c); });
    ring.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('ring-card')) { e.preventDefault(); moved = 0; pick(e.target); } });

    if ('IntersectionObserver' in root) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }, { threshold: 0.01 }).observe(stage);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    root.addEventListener('resize', M.debounce(layout, 150));
    layout(); start();
  };
})(window);
