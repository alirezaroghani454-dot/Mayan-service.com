/* ==========================================================================
   مایان سرویس — js/modules/products.js
   فهرست محصولات: فیلتر دسته‌بندی، جستجو، مرتب‌سازی، دکمه‌ی فعال‌سازی ثبت گارانتی
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan, $ = M.$, $$ = M.$$, esc = M.esc;
  var P = M.products = { state: { cat: 'all', q: '', sort: 'default' } };

  function norm(s) {
    return M.toEn(s).toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\s‌‏]+/g, '');
  }

  P.list = function () {
    var d = M.store.data, st = P.state, q = norm(st.q);
    var list = M.store.activeProducts().filter(function (p) {
      if (st.cat !== 'all' && p.cat !== st.cat) return false;
      if (!q) return true;
      var c = M.store.categoryById(p.cat);
      return norm(p.name).indexOf(q) > -1 || (c && norm(c.name).indexOf(q) > -1) || norm(p.desc || '').indexOf(q) > -1;
    });
    if (st.sort === 'asc') list.sort(function (a, b) { return a.price - b.price; });
    else if (st.sort === 'desc') list.sort(function (a, b) { return b.price - a.price; });
    else if (st.sort === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name, 'fa'); });
    return list;
  };

  P.renderChips = function () {
    var d = M.store.data, act = M.store.activeProducts();
    var html = '<button class="fchip' + (P.state.cat === 'all' ? ' active' : '') + '" data-cat="all" type="button">همه<small>' + M.toFa(act.length) + '</small></button>';
    d.categories.forEach(function (c) {
      var n = act.filter(function (p) { return p.cat === c.id; }).length;
      if (!n) return;
      html += '<button class="fchip' + (P.state.cat === c.id ? ' active' : '') + '" data-cat="' + esc(c.id) + '" type="button">' + esc(c.name) + '<small>' + M.toFa(n) + '</small></button>';
    });
    $('#catChips').innerHTML = html;
  };

  function card(p, i) {
    var c = M.store.categoryById(p.cat), inCart = M.cart && M.cart.has(p.id);
    return '<article class="p-card' + (inCart ? ' is-in' : '') + '" data-tilt="8" data-reveal="up" data-id="' + esc(p.id) + '" style="--d:' + ((i % 4) * 0.07).toFixed(2) + 's">' +
      '<div class="p-media">' +
        (c ? '<span class="p-cat">' + esc(c.name) + '</span>' : '') +
        '<button class="p-quick' + (inCart ? ' in-cart' : '') + '" type="button" data-act="add" data-id="' + esc(p.id) + '" aria-label="افزودن ' + esc(p.name) + ' به سبد">' + M.icon(inCart ? 'check' : 'bag') + '</button>' +
        '<div class="p-icon" style="--fd:' + (-(i % 6) * 0.8) + 's">' + M.productIcon(p.icon) + '</div>' +
      '</div>' +
      '<h3 class="p-title">' + esc(p.name) + '</h3>' +
      '<div class="p-price"><strong class="num">' + M.fmtPrice(p.price) + '</strong><small>تومان</small></div>' +
      '<button class="btn btn-gold p-add" type="button" data-act="add" data-id="' + esc(p.id) + '"><span>فعال‌سازی ثبت گارانتی</span>' + (inCart ? M.icon('check') : '') + '</button>' +
    '</article>';
  }

  P.render = function () {
    var list = P.list(), grid = $('#productGrid');
    grid.innerHTML = list.length ? list.map(card).join('') :
      '<div class="no-results">' + M.icon('search') + '<p>محصولی با این مشخصات پیدا نشد.</p></div>';
    $('#resultMeta').textContent = M.toFa(list.length) + ' محصول' + (P.state.q ? ' برای «' + P.state.q + '»' : '');
    if (M.motion) M.motion.observe(grid);
    if (M.fx) M.fx.refresh(grid);
  };

  /* همگام‌سازی وضعیت «در سبد» بدون ساخت دوباره‌ی کارت‌ها */
  P.syncCart = function () {
    $$('#productGrid .p-card').forEach(function (el) {
      var inCart = M.cart.has(el.dataset.id);
      el.classList.toggle('is-in', inCart);
      var q = $('.p-quick', el); q.classList.toggle('in-cart', inCart); q.innerHTML = M.icon(inCart ? 'check' : 'bag');
      var b = $('.p-add', el); b.innerHTML = '<span>فعال‌سازی ثبت گارانتی</span>' + (inCart ? M.icon('check') : '');
    });
  };

  P.setCategory = function (id, scroll) {
    P.state.cat = id; P.renderChips(); P.render();
    if (scroll) { var el = $('#products'); if (el) el.scrollIntoView({ behavior: M.reducedMotion() ? 'auto' : 'smooth', block: 'start' }); }
  };

  P.init = function () {
    P.renderChips(); P.render();
    $('#catChips').addEventListener('click', function (e) {
      var b = e.target.closest('.fchip'); if (b) P.setCategory(b.dataset.cat);
    });
    $('#productSearch').addEventListener('input', M.debounce(function (e) { P.state.q = e.target.value.trim(); P.render(); }, 180));
    $('#productSort').addEventListener('change', function (e) { P.state.sort = e.target.value; P.render(); });
    $('#productGrid').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act="add"]'); if (!b) return;
      var id = b.dataset.id;
      if (M.cart.has(id)) { M.cart.open(); return; }
      M.cart.add(id);
      var p = M.store.productById(id);
      M.toast('«' + p.name + '» به سبد اضافه شد', 'ok');
    });
    document.addEventListener('cart:change', P.syncCart);
  };
})(window);
