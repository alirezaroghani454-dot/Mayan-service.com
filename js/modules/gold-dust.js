/* ==========================================================================
   مایان سرویس — js/modules/gold-dust.js
   ذرات طلایی شناور در پس‌زمینه (Canvas 2D سبک؛ با اسکرول پارالاکس می‌شود)
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan;
  M.goldDust = {
    init: function () {
      var cv = document.getElementById('gold-dust'); if (!cv || M.reducedMotion()) return;
      var ctx = cv.getContext('2d'); if (!ctx) return;
      var dpr = Math.min(root.devicePixelRatio || 1, 1.5), W = 0, H = 0, parts = [], scrollY = 0, running = true;
      var count = M.isTouch() ? 26 : 60;

      // اسپرایت درخشان یک‌بار روی بوم مجزا کشیده می‌شود (سریع‌تر از gradient در هر فریم)
      var sp = document.createElement('canvas'); sp.width = sp.height = 64;
      var g = sp.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,236,170,1)'); gr.addColorStop(0.25, 'rgba(252,198,76,.55)'); gr.addColorStop(1, 'rgba(252,198,76,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);

      function resize() {
        W = root.innerWidth; H = root.innerHeight; cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        parts = []; for (var i = 0; i < count; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, r: 2 + Math.random() * 7, d: 0.15 + Math.random() * 0.6, vx: (Math.random() - 0.5) * 0.15, vy: -0.05 - Math.random() * 0.25, p: Math.random() * 6.28 });
      }
      function frame(t) {
        if (!running) return;
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < parts.length; i++) {
          var q = parts[i]; q.x += q.vx; q.y += q.vy;
          if (q.y < -20) { q.y = H + 20; q.x = Math.random() * W; } if (q.x < -20) q.x = W + 20; if (q.x > W + 20) q.x = -20;
          var py = ((q.y - scrollY * q.d * 0.25) % (H + 40) + H + 40) % (H + 40) - 20;
          ctx.globalAlpha = (0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t / 900 + q.p))) * q.d + 0.1;
          ctx.drawImage(sp, q.x - q.r * 2, py - q.r * 2, q.r * 4, q.r * 4);
        }
        requestAnimationFrame(frame);
      }
      root.addEventListener('resize', M.debounce(resize, 200));
      root.addEventListener('scroll', function () { scrollY = root.scrollY; }, { passive: true });
      document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) requestAnimationFrame(frame); });
      resize(); requestAnimationFrame(frame);
    }
  };
})(window);
