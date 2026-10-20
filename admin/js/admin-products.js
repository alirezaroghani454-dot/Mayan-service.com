/* مایان سرویس — admin/js/admin-products.js : مدیریت محصولات و قیمت‌ها + تغییر گروهی قیمت */
(function (root) {
  'use strict';
  var M = root.Mayan, A = root.MayanAdmin, U = root.MayanUI, V = root.MayanViews, esc = M.esc;
  var F = { q: '', cat: '', st: '' }, sel = {};

  function filtered() {
    var q = M.toEn(F.q).trim().toLowerCase();
    return A.site.products.filter(function (p) {
      if (F.cat && p.cat !== F.cat) return false;
      if (F.st === 'on' && p.active === false) return false;
      if (F.st === 'off' && p.active !== false) return false;
      if (q && (p.name + ' ' + (p.desc || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function nextId() {
    var n = 0; A.site.products.forEach(function (p) { var m = /^p(\d+)$/.exec(p.id); if (m) n = Math.max(n, +m[1]); });
    n++; return 'p' + (n < 10 ? '0' + n : n);
  }

  function editModal(p, rerender) {
    var isNew = !p; p = p || { id: nextId(), name: '', cat: (A.site.categories[0] || {}).id || '', price: 0, icon: 'appliance', desc: '', active: true };
    var cats = A.site.categories.map(function (c) { return [c.id, c.name]; });
    var body = '<form class="grid g2" id="pf" novalidate>' +
      U.field('name', 'نام محصول', p.name, { span: true }) +
      U.field('cat', 'دسته‌بندی', p.cat, { type: 'select', options: cats }) +
      U.field('price', 'قیمت (تومان)', p.price, { type: 'money' }) +
      U.field('icon', 'آیکون محصول', p.icon, { type: 'select', options: U.PRODUCT_ICON_CHOICES() }) +
      U.field('active', 'فعال و قابل نمایش در سایت', p.active !== false, { type: 'checkbox' }) +
      U.field('desc', 'توضیح کوتاه (اختیاری)', p.desc, { type: 'textarea', span: true, rows: 2 }) + '</form>';
    U.modal({ title: isNew ? 'محصول جدید' : 'ویرایش محصول', body: body, onOpen: function (m) { U.bindMoney(m); }, actions: [
      { label: 'ذخیره', cls: 'gold', icon: 'check', onClick: function (m, close) {
        var d = U.read(U.$('#pf', m));
        if (d.name.length < 2) { U.toast('نام محصول را وارد کنید', 'err'); return; }
        if (d.price < 0) { U.toast('قیمت نامعتبر است', 'err'); return; }
        p.name = d.name; p.cat = d.cat; p.price = d.price; p.icon = d.icon; p.desc = d.desc; p.active = d.active;
        if (isNew) A.site.products.push(p);
        A.markDirty(); close(); rerender();
      } }, { label: 'انصراف', cls: 'ghost' }] });
  }

  var ROUND = [['0', 'بدون رُند'], ['1000', 'نزدیک‌ترین هزار تومان'], ['10000', 'نزدیک‌ترین ده هزار تومان'], ['100000', 'نزدیک‌ترین صد هزار تومان']];
  function bulkModal(rerender) {
    var selCount = Object.keys(sel).filter(function (k) { return sel[k]; }).length;
    var cats = [['all', 'همه‌ی محصولات']].concat(A.site.categories.map(function (c) { return ['cat:' + c.id, 'دسته: ' + c.name]; }));
    if (selCount) cats.push(['sel', 'فقط محصولات انتخاب‌شده (' + M.toFa(selCount) + ')']);
    var body = '<div class="stack"><p class="hint" style="margin:0">برای کاهش قیمت، عدد را منفی بنویسید (مثلاً -۵). قبل از اعمال، پیش‌نمایش را ببینید؛ بعد از اعمال باید «انتشار تغییرات» را بزنید.</p>' +
      '<form class="grid g2" id="bf" novalidate>' +
      U.field('scope', 'اعمال روی', selCount ? 'sel' : 'all', { type: 'select', options: cats }) +
      U.field('mode', 'نوع تغییر', 'pct', { type: 'select', options: [['pct', 'درصدی'], ['fix', 'مبلغ ثابت (تومان)']] }) +
      U.field('amount', 'مقدار', '10', { ltr: true, ph: 'مثلاً 10 یا -5', attrs: 'inputmode="decimal"' }) +
      U.field('round', 'گرد کردن', '10000', { type: 'select', options: ROUND }) + '</form><div id="bprev"></div></div>';
    var m = U.modal({ title: 'تغییر گروهی قیمت', body: body, actions: [
      { label: 'اعمال تغییر', cls: 'gold', icon: 'check', onClick: function (mm, close) {
        var r = compute(); if (!r.changes.length) { U.toast('تغییری برای اعمال وجود ندارد', 'err'); return; }
        r.changes.forEach(function (c) { c.p.price = c.to; });
        A.markDirty(); close(); rerender(); U.toast(M.toFa(r.changes.length) + ' قیمت تغییر کرد؛ برای نمایش در سایت «انتشار تغییرات» را بزنید.');
      } }, { label: 'انصراف', cls: 'ghost' }] });
    function compute() {
      var d = U.read(U.$('#bf', m.el)), amt = parseFloat(M.toEn(d.amount).replace(/[٫,]/g, '.').replace(/[^\d.\-]/g, '')) || 0, step = +d.round || 0;
      var list = A.site.products.filter(function (p) {
        if (d.scope === 'all') return true; if (d.scope === 'sel') return !!sel[p.id]; return p.cat === d.scope.slice(4);
      });
      var changes = [];
      list.forEach(function (p) {
        var to = d.mode === 'pct' ? p.price * (1 + amt / 100) : p.price + amt;
        if (step) to = Math.round(to / step) * step; else to = Math.round(to);
        to = Math.max(0, to); if (to !== p.price) changes.push({ p: p, from: p.price, to: to });
      });
      return { changes: changes, total: list.length };
    }
    function preview() {
      var r = compute(), box = U.$('#bprev', m.el);
      box.innerHTML = '<div class="small muted" style="margin-bottom:8px">' + M.toFa(r.changes.length) + ' محصول از ' + M.toFa(r.total) + ' محصول تغییر می‌کند.</div>' +
        (r.changes.length ? '<div class="tbl-wrap"><table style="min-width:0"><tbody>' + r.changes.slice(0, 8).map(function (c) {
          return '<tr><td>' + esc(c.p.name) + '</td><td class="price">' + M.toFa(M.fmtPrice(c.from)) + ' ← ' + M.toFa(M.fmtPrice(c.to)) + '</td></tr>'; }).join('') +
          (r.changes.length > 8 ? '<tr><td colspan="2" class="muted small">و ' + M.toFa(r.changes.length - 8) + ' مورد دیگر…</td></tr>' : '') + '</tbody></table></div>' : '');
    }
    U.$('#bf', m.el).addEventListener('input', preview); U.$('#bf', m.el).addEventListener('change', preview); preview();
  }

  V.register({ id: 'products', title: 'محصولات و قیمت‌ها', icon: 'tag', render: function (el) {
    function draw() {
      var list = filtered(), all = A.site.products, noFilter = !F.q && !F.cat && !F.st;
      el.innerHTML = '<div class="stack"><div class="hint">قیمت‌ها و محصولات از اسکرین‌شات‌های سایت فعلی وارد شده‌اند. بعد از هر تغییر، دکمه‌ی «انتشار تغییرات» (بالای صفحه) را بزنید تا در سایت دیده شود.</div>' +
        '<div class="toolbar"><div class="grow"><input type="search" id="fq" placeholder="جستجوی محصول…" value="' + esc(F.q) + '"></div>' +
        '<select id="fc"><option value="">همه‌ی دسته‌ها</option>' + A.site.categories.map(function (c) { return '<option value="' + esc(c.id) + '"' + (F.cat === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>' +
        '<select id="fs"><option value="">همه‌ی وضعیت‌ها</option><option value="on"' + (F.st === 'on' ? ' selected' : '') + '>فعال</option><option value="off"' + (F.st === 'off' ? ' selected' : '') + '>غیرفعال</option></select>' +
        '<button class="btn" id="bulk">' + M.icon('sliders') + 'تغییر گروهی قیمت</button><button class="btn gold" id="addp">' + M.icon('plus') + 'محصول جدید</button></div>' +
        '<div class="tbl-wrap"><table><thead><tr><th style="width:44px"><input type="checkbox" id="selall" aria-label="انتخاب همه"></th><th>محصول</th><th>دسته</th><th>قیمت</th><th>وضعیت</th><th></th></tr></thead><tbody>' +
        (list.length ? list.map(function (p, i) {
          return '<tr data-id="' + esc(p.id) + '"><td><input type="checkbox" data-sel ' + (sel[p.id] ? 'checked' : '') + '></td><td><div style="display:flex;gap:10px;align-items:center"><span class="picon" style="width:34px;height:34px;display:inline-block;color:var(--gold-400)">' + M.productIcon(p.icon) + '</span><b>' + esc(p.name) + '</b></div></td>' +
            '<td>' + esc(A.catName(p.cat)) + '</td><td class="price">' + U.fmtMoney(p.price) + '</td><td>' + (p.active === false ? U.pill('غیرفعال', 'off') : U.pill('فعال', 'ok')) + '</td>' +
            '<td><div class="row-actions"><button class="icon-btn" data-a="up" aria-label="بالا">' + M.icon('up') + '</button><button class="icon-btn" data-a="down" aria-label="پایین">' + M.icon('down') + '</button><button class="icon-btn" data-a="edit" aria-label="ویرایش">' + M.icon('edit') + '</button><button class="icon-btn bad" data-a="del" aria-label="حذف">' + M.icon('trash') + '</button></div></td></tr>';
        }).join('') : '<tr><td colspan="6" class="empty">محصولی پیدا نشد.</td></tr>') + '</tbody></table></div>' +
        '<div class="small muted">' + M.toFa(list.length) + ' محصول نمایش داده می‌شود' + (noFilter ? '' : ' (از ' + M.toFa(all.length) + ')') + '.</div></div>';
      U.$('#fq', el).oninput = M.debounce(function (e) { F.q = e.target.value; var pos = e.target.selectionStart; draw(); var n = U.$('#fq', el); n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} }, 250);
      U.$('#fc', el).onchange = function (e) { F.cat = e.target.value; draw(); };
      U.$('#fs', el).onchange = function (e) { F.st = e.target.value; draw(); };
      U.$('#addp', el).onclick = function () { editModal(null, draw); };
      U.$('#bulk', el).onclick = function () { bulkModal(draw); };
      U.$('#selall', el).onchange = function (e) { list.forEach(function (p) { sel[p.id] = e.target.checked; }); draw(); };
      U.$$('[data-sel]', el).forEach(function (c) { c.onchange = function () { sel[c.closest('tr').dataset.id] = c.checked; }; });
      U.$$('[data-a]', el).forEach(function (b) {
        b.onclick = function () {
          var id = b.closest('tr').dataset.id, prods = A.site.products, i = prods.findIndex(function (p) { return p.id === id; }), act = b.dataset.a;
          if (act === 'edit') editModal(prods[i], draw);
          else if (act === 'del') U.confirm('«' + prods[i].name + '» حذف شود؟', 'حذف', true).then(function (ok) { if (ok) { prods.splice(i, 1); A.markDirty(); draw(); } });
          else {
            var li = list.findIndex(function (p) { return p.id === id; }), nb = list[li + (act === 'up' ? -1 : 1)]; if (!nb) return;
            var j = prods.findIndex(function (p) { return p.id === nb.id; }); var t = prods[i]; prods[i] = prods[j]; prods[j] = t; A.markDirty(); draw();
          }
        };
      });
    }
    draw();
  } });
})(window);
