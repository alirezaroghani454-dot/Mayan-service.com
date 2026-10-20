/* ==========================================================================
   مایان سرویس — admin/js/admin-listeditor.js
   ویرایشگر عمومی لیست‌ها (خدمات، مراحل، سوالات، دسته‌بندی‌ها، آمار ...)
   و ثبت‌کننده‌ی صفحه‌های پنل
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan, A = root.MayanAdmin, U = root.MayanUI, esc = M.esc;

  /* ---------- ثبت صفحه‌ها ---------- */
  var V = root.MayanViews = root.MayanViews || { list: [] };
  V.register = function (v) { V.list.push(v); };

  /* ---------- آیکون‌های قابل انتخاب برای خدمات و ویژگی‌ها ---------- */
  U.UI_ICON_CHOICES = [
    ['shield-check', 'سپر تأییدشده'], ['shield', 'سپر'], ['search', 'جستجو'], ['wrench', 'آچار'], ['tools', 'ابزار'], ['truck', 'حمل / نصب'],
    ['refresh', 'سرویس دوره‌ای'], ['headset', 'پشتیبانی'], ['bolt', 'برق / سرعت'], ['tag', 'قیمت'], ['grid', 'دسته‌بندی'], ['doc', 'سند'],
    ['gear', 'چرخ‌دنده'], ['star', 'ستاره'], ['phone', 'تلفن'], ['clock', 'ساعت'], ['calendar', 'تقویم'], ['box', 'جعبه'], ['home', 'خانه'],
    ['bell', 'زنگ'], ['message', 'پیام'], ['users', 'کاربران'], ['sparkle', 'درخشش'], ['chart', 'نمودار'], ['lock', 'قفل'], ['check', 'تیک']
  ];
  U.PRODUCT_ICON_CHOICES = function () {
    var L = M.PRODUCT_ICON_LABELS || {};
    return Object.keys(L).map(function (k) { return [k, L[k]]; });
  };

  /* ---------- ویرایشگر لیست ----------
     cfg: { key|getList, title(item,i), fields:[{k,label,type,span,options,ph,ltr}], blank(), canDelete(item,i)->پیام|null,
            addLabel, note, min }                                                          */
  U.listEditor = function (el, cfg) {
    function list() { return cfg.getList ? cfg.getList() : A.site[cfg.key]; }
    function draw() {
      var items = list();
      var html = (cfg.note ? '<p class="hint" style="margin:0 0 14px">' + cfg.note + '</p>' : '') + '<div class="items">';
      if (!items.length) html += '<div class="empty card">هنوز موردی ثبت نشده است.</div>';
      items.forEach(function (it, i) {
        html += '<section class="item" data-i="' + i + '"><div class="item-head"><b>' + esc(cfg.title ? cfg.title(it, i) : 'مورد ' + M.toFa(i + 1)) + '</b>' +
          '<button type="button" class="icon-btn" data-act="up" aria-label="بالا" ' + (i === 0 ? 'disabled' : '') + '>' + M.icon('up') + '</button>' +
          '<button type="button" class="icon-btn" data-act="down" aria-label="پایین" ' + (i === items.length - 1 ? 'disabled' : '') + '>' + M.icon('down') + '</button>' +
          '<button type="button" class="icon-btn bad" data-act="del" aria-label="حذف">' + M.icon('trash') + '</button></div><div class="grid g2">' +
          cfg.fields.map(function (f) {
            var o = { type: f.type, span: f.span, ph: f.ph, ltr: f.ltr, rows: f.rows };
            if (f.type === 'select') o.options = typeof f.options === 'function' ? f.options(it) : f.options;
            if (f.type === 'icon') { o.type = 'select'; o.options = f.kind === 'product' ? U.PRODUCT_ICON_CHOICES() : U.UI_ICON_CHOICES; }
            if (f.type === 'number') o.type = 'number';
            if (f.readonly && f.readonly(it)) o.attrs = 'readonly';
            return U.field(f.k, f.label, it[f.k], o);
          }).join('') + '</div></section>';
      });
      html += '</div><div style="margin-top:14px"><button type="button" class="btn" data-act="add">' + M.icon('plus') + esc(cfg.addLabel || 'افزودن مورد جدید') + '</button></div>';
      el.innerHTML = html;
      U.$$('[data-money]', el).length && U.bindMoney(el);
    }
    function idx(t) { var s = t.closest('[data-i]'); return s ? +s.dataset.i : -1; }
    el.oninput = el.onchange = function (e) {
      var t = e.target; if (!t.name) return; var i = idx(t); if (i < 0) return;
      var it = list()[i], v;
      if (t.type === 'checkbox') v = t.checked; else if (t.type === 'number') v = Number(M.toEn(t.value)) || 0; else v = t.value;
      it[t.name] = v; A.markDirty();
      if (e.type === 'change' && cfg.title) { var b = t.closest('.item').querySelector('.item-head b'); if (b) b.textContent = cfg.title(it, i); }
    };
    el.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b || !el.contains(b)) return;
      var act = b.dataset.act, items = list(), i = idx(b);
      if (act === 'add') { items.push(cfg.blank()); A.markDirty(); draw(); var cards = U.$$('.item', el); var last = cards[cards.length - 1]; if (last) { last.scrollIntoView({ behavior: 'smooth', block: 'center' }); var inp = U.$('input,textarea', last); if (inp) inp.focus({ preventScroll: true }); } return; }
      if (i < 0) return;
      if (act === 'up' && i > 0) { var t1 = items[i]; items[i] = items[i - 1]; items[i - 1] = t1; A.markDirty(); draw(); }
      else if (act === 'down' && i < items.length - 1) { var t2 = items[i]; items[i] = items[i + 1]; items[i + 1] = t2; A.markDirty(); draw(); }
      else if (act === 'del') {
        var why = cfg.canDelete ? cfg.canDelete(items[i], i) : null;
        if (why) { U.toast(why, 'err'); return; }
        U.confirm('این مورد حذف شود؟', 'حذف', true).then(function (ok) { if (ok) { items.splice(i, 1); A.markDirty(); draw(); } });
      }
    };
    draw();
  };
})(window);
