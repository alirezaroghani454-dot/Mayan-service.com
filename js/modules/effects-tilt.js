/* ==========================================================================
   مایان سرویس — js/modules/effects-tilt.js
   افکت سه‌بعدی کارت‌ها (Tilt + درخشش)، دکمه‌های مغناطیسی و موج لمس (Ripple)
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan, $$ = M.$$;
  var FX = M.fx = {};

  function bindTilt(el) {
    if (el.__tilt) return; el.__tilt = true;
    var glare = document.createElement('span'); glare.className = 'tilt-glare'; el.appendChild(glare);
    var max = parseFloat(el.dataset.tilt) || 8;
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((px - 0.5) * 2 * max).toFixed(2) + 'deg');
      el.style.setProperty('--rx', (-(py - 0.5) * 2 * max).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      el.classList.add('tilting');
    });
    el.addEventListener('pointerleave', function () {
      el.classList.remove('tilting'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
    });
  }

  function bindMagnetic(el) {
    if (el.__mag) return; el.__mag = true;
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = el.getBoundingClientRect();
      el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  }

  FX.refresh = function (ctx) {
    if (M.isTouch() || M.reducedMotion()) return;
    $$('[data-tilt]', ctx).forEach(bindTilt);
    $$('[data-magnetic]', ctx).forEach(bindMagnetic);
  };

  FX.initRipple = function () {
    document.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.btn'); if (!b || b.disabled) return;
      var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), x = document.createElement('span');
      x.className = 'ripple'; x.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
      b.appendChild(x); setTimeout(function () { x.remove(); }, 750);
    }, { passive: true });
  };

  FX.init = function () { FX.refresh(document); FX.initRipple(); };
})(window);
