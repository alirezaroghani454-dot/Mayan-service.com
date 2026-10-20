/* ==========================================================================
   مایان سرویس — js/modules/cart.js
   سبد ثبت گارانتی + فرم نهایی‌سازی سفارش (داخل کشو)
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan, $ = M.$, $$ = M.$$, esc = M.esc;
  var C = M.cart = { items: {}, view: 'list', lastFocus: null };

  /* ---------- وضعیت سبد ---------- */
  C.load = function () {
    var saved = M.ls.get(M.store.KEYS.cart, {}), clean = {};
    Object.keys(saved || {}).forEach(function (id) { if (M.store.productById(id)) clean[id] = M.clamp(parseInt(saved[id], 10) || 1, 1, 9); });
    C.items = clean;
  };
  C.save = function () { M.ls.set(M.store.KEYS.cart, C.items); };
  C.has = function (id) { return !!C.items[id]; };
  C.count = function () { return Object.keys(C.items).reduce(function (n, id) { return n + C.items[id]; }, 0); };
  C.lines = function () {
    return Object.keys(C.items).map(function (id) { var p = M.store.productById(id); return p ? { p: p, qty: C.items[id] } : null; }).filter(Boolean);
  };
  C.total = function () { return C.lines().reduce(function (s, l) { return s + l.p.price * l.qty; }, 0); };
  function changed(bump) {
    C.save(); C.updateBadge(bump);
    if (C.view === 'list') C.render();
    document.dispatchEvent(new CustomEvent('cart:change'));
  }
  C.add = function (id) { C.items[id] = M.clamp((C.items[id] || 0) + 1, 1, 9); C.view = 'list'; changed(true); };
  C.setQty = function (id, q) { if (q < 1) delete C.items[id]; else C.items[id] = M.clamp(q, 1, 9); changed(); };
  C.remove = function (id) { delete C.items[id]; changed(); };
  C.clear = function () { C.items = {}; changed(); };

  C.updateBadge = function (bump) {
    var n = C.count();
    $$('.cart-count').forEach(function (b) {
      b.textContent = M.toFa(n); b.dataset.n = n;
      if (bump) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    });
  };

  /* ---------- کشو ---------- */
  C.open = function (view) {
    if (view) C.view = view; else if (C.view === 'done') C.view = 'list';
    C.render();
    C.lastFocus = document.activeElement;
    $('#cartDrawer').classList.add('open'); $('#cartDrawer').setAttribute('aria-hidden', 'false');
    $('#drawerBackdrop').classList.add('open'); document.body.classList.add('no-scroll');
    setTimeout(function () { var c = $('#drawerClose'); if (c) c.focus(); }, 350);
  };
  C.close = function () {
    $('#cartDrawer').classList.remove('open'); $('#cartDrawer').setAttribute('aria-hidden', 'true');
    $('#drawerBackdrop').classList.remove('open'); document.body.classList.remove('no-scroll');
    if (C.lastFocus && C.lastFocus.focus) C.lastFocus.focus();
  };

  /* ---------- نمایش‌ها ---------- */
  C.render = function () {
    var body = $('#drawerBody'), foot = $('#drawerFoot');
    if (C.view === 'checkout') return C.renderCheckout(body, foot);
    if (C.view === 'done') return;
    var lines = C.lines();
    if (!lines.length) {
      body.innerHTML = '<div class="empty-state"><div class="big">' + M.icon('bag') + '</div><h4>سبد شما خالی است</h4><p>از بخش محصولات، دستگاه خود را انتخاب و روی «فعال‌سازی ثبت گارانتی» بزنید.</p><a class="btn btn-gold" href="#products" data-close-cart>مشاهده محصولات</a></div>';
      foot.innerHTML = ''; foot.hidden = true; return;
    }
    foot.hidden = false;
    body.innerHTML = lines.map(function (l) {
      return '<div class="cart-item" data-id="' + esc(l.p.id) + '"><div class="thumb">' + M.productIcon(l.p.icon) + '</div>' +
        '<div><h4>' + esc(l.p.name) + '</h4><div class="price">' + M.fmtPrice(l.p.price) + ' تومان</div>' +
        '<div class="qty"><button type="button" data-q="+1" aria-label="افزایش">' + M.icon('plus') + '</button><span>' + M.toFa(l.qty) + '</span><button type="button" data-q="-1" aria-label="کاهش">' + M.icon('minus') + '</button></div></div>' +
        '<button class="rm" type="button" data-rm aria-label="حذف">' + M.icon('trash') + '</button></div>';
    }).join('');
    foot.innerHTML = '<div class="sum-row"><span>جمع مبلغ</span><strong class="gold-text num">' + M.fmtPrice(C.total()) + '<small>تومان</small></strong></div>' +
      '<button class="btn btn-gold btn-lg btn-block" type="button" id="goCheckout">' + M.icon('check') + ' ادامه و ثبت سفارش</button>';
  };

  C.renderCheckout = function (body, foot) {
    foot.hidden = true;
    body.innerHTML =
      '<button class="btn btn-ghost btn-sm" type="button" id="backToCart">' + M.icon('chevron-right') + ' بازگشت به سبد</button>' +
      '<div class="sum-row" style="margin:1rem 0 .4rem"><span>' + M.toFa(C.count()) + ' مورد</span><strong class="gold-text num">' + M.fmtPrice(C.total()) + '<small>تومان</small></strong></div>' +
      '<form id="checkoutForm" novalidate><input class="hp-field" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="form-grid" style="grid-template-columns:1fr">' +
      '<div class="field"><label for="coName">نام و نام خانوادگی<span class="req">*</span></label><input class="input" id="coName" name="name" required maxlength="80" autocomplete="name"><span class="err">نام را وارد کنید.</span></div>' +
      '<div class="field"><label for="coMobile">شماره موبایل<span class="req">*</span></label><input class="input" id="coMobile" name="mobile" type="tel" inputmode="tel" dir="ltr" required placeholder="09xxxxxxxxx" autocomplete="tel"><span class="err">شماره موبایل معتبر وارد کنید.</span></div>' +
      '<div class="field"><label for="coCity">شهر</label><input class="input" id="coCity" name="city" maxlength="60" autocomplete="address-level2"></div>' +
      '<div class="field"><label for="coAddr">نشانی</label><textarea class="textarea" id="coAddr" name="address" maxlength="400" style="min-height:80px" autocomplete="street-address"></textarea></div>' +
      '<div class="field"><label for="coNote">توضیحات (اختیاری)</label><textarea class="textarea" id="coNote" name="notes" maxlength="600" style="min-height:70px" placeholder="مثلاً شماره سریال یا ساعت مناسب تماس"></textarea></div>' +
      '</div><button class="btn btn-gold btn-lg btn-block" type="submit" id="coSubmit" style="margin-top:1.2rem">' + M.icon('check') + ' <span>ثبت نهایی سفارش</span></button></form>';
  };

  C.renderDone = function (code, summary) {
    C.view = 'done';
    var s = M.store.data.settings, foot = $('#drawerFoot'); foot.hidden = true;
    var wa = s.whatsapp ? M.waLink(s.whatsapp, summary) : '';
    $('#drawerBody').innerHTML = '<div class="success-box"><div class="tick">' + M.icon('check') + '</div>' +
      '<h3>سفارش شما ثبت شد</h3><p class="muted">این کد پیگیری را نگه دارید. همکاران ما به‌زودی با شما تماس می‌گیرند.</p>' +
      '<div class="code-box"><span id="doneCode">' + esc(code) + '</span><button class="icon-btn" style="width:38px;height:38px" type="button" id="copyCode" aria-label="کپی کد">' + M.icon('copy') + '</button></div>' +
      '<div style="display:grid;gap:.7rem">' +
      (wa ? '<a class="btn btn-outline" href="' + esc(wa) + '" target="_blank" rel="noopener">' + M.icon('whatsapp') + ' ارسال اطلاعات در واتساپ</a>' : '') +
      '<a class="btn btn-ghost" href="#inquiry" data-close-cart data-prefill="' + esc(code) + '">' + M.icon('search') + ' پیگیری سفارش</a></div></div>';
  };

  /* ---------- ثبت نهایی ---------- */
  C.submitOrder = function (form) {
    if (!M.forms.validate(form)) return;
    var f = new FormData(form);
    if (f.get('website')) return;                                   // ربات‌ها
    var btn = $('#coSubmit'); M.forms.busy(btn, true);
    var lines = C.lines(), customer = {
      name: String(f.get('name')).trim(), mobile: M.normMobile(f.get('mobile')),
      city: String(f.get('city') || '').trim(), address: String(f.get('address') || '').trim(), notes: String(f.get('notes') || '').trim()
    };
    var summary = 'سلام، سفارش ثبت گارانتی ' + '{CODE}' + ' ثبت شد.\nنام: ' + customer.name + '\nمحصولات:\n' +
      lines.map(function (l) { return '- ' + l.p.name + ' × ' + M.toFa(l.qty); }).join('\n') + '\nمبلغ: ' + M.fmtPrice(C.total()) + ' تومان';
    M.store.submit('order', { customer: customer, items: lines.map(function (l) { return { id: l.p.id, qty: l.qty }; }), website: '' })
      .then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.error) || 'خطا در ثبت سفارش');
        C.items = {}; C.save(); C.updateBadge(); document.dispatchEvent(new CustomEvent('cart:change'));
        C.renderDone(r.code, summary.replace('{CODE}', r.code));
      })
      .catch(function (e) { M.forms.busy(btn, false); M.toast(e.message || 'ارسال انجام نشد؛ دوباره تلاش کنید.', 'error'); });
  };

  /* ---------- رویدادها ---------- */
  C.init = function () {
    C.load(); C.updateBadge(); C.view = 'list'; C.render();
    $$('.cart-trigger').forEach(function (b) { b.addEventListener('click', function () { C.open('list'); }); });
    $('#drawerClose').addEventListener('click', C.close);
    $('#drawerBackdrop').addEventListener('click', C.close);
    document.addEventListener('keydown', function (e) {
      if (!$('#cartDrawer').classList.contains('open')) return;
      if (e.key === 'Escape') C.close();
      if (e.key === 'Tab') {                                         // محدود کردن فوکوس درون کشو
        var f = $$('button,a[href],input,textarea,select', $('#cartDrawer')).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    $('#cartDrawer').addEventListener('click', function (e) {
      var t = e.target, item = t.closest('.cart-item');
      if (t.closest('[data-q]')) { var id = item.dataset.id; C.setQty(id, C.items[id] + parseInt(t.closest('[data-q]').dataset.q, 10)); }
      else if (t.closest('[data-rm]')) C.remove(item.dataset.id);
      else if (t.closest('#goCheckout')) { C.view = 'checkout'; C.render(); $('#drawerBody').scrollTop = 0; }
      else if (t.closest('#backToCart')) { C.view = 'list'; C.render(); }
      else if (t.closest('#copyCode')) { M.copy($('#doneCode').textContent).then(function () { M.toast('کد کپی شد', 'ok'); }); }
      else if (t.closest('[data-close-cart]')) {
        var a = t.closest('[data-close-cart]'); C.close();
        if (a.dataset.prefill && M.forms) setTimeout(function () { M.forms.prefillTrack(a.dataset.prefill); }, 500);
      }
    });
    $('#drawerBody').addEventListener('submit', function (e) {
      if (e.target.id === 'checkoutForm') { e.preventDefault(); C.submitOrder(e.target); }
    });
  };
})(window);
