/* مایان سرویس — admin/js/admin-inbox.js : سفارش‌ها، درخواست‌های خدمات، پیام‌ها و گارانتی‌ها */
(function (root) {
  'use strict';
  var M = root.Mayan, A = root.MayanAdmin, U = root.MayanUI, V = root.MayanViews, esc = M.esc;
  var F = { orders: { q: '', st: '' }, services: { q: '', st: '' }, messages: { q: '', st: '' }, warranties: { q: '', st: '' } };

  function statusOptions() { return M.STATUS_ORDER.map(function (k) { return [k, M.STATUS[k].label]; }); }
  function contactLinks(mobile) {
    if (!mobile) return '—';
    return '<span class="ltr">' + esc(mobile) + '</span> <a class="btn sm ghost" href="' + M.telLink(mobile) + '">' + M.icon('phone') + 'تماس</a> ' +
      '<a class="btn sm ghost" target="_blank" rel="noopener" href="' + M.waLink(mobile, '') + '">' + M.icon('whatsapp') + 'واتساپ</a>';
  }
  function kv(rows) { return '<dl class="kv">' + rows.filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + (r[2] ? r[1] : esc(r[1])) + '</dd>'; }).join('') + '</dl>'; }
  function match(rec, q) { return !q || JSON.stringify(rec).toLowerCase().indexOf(M.toEn(q).toLowerCase()) >= 0; }
  function save(col, rec, okMsg) {
    return A.upsert(col, rec).then(function () { U.toast(okMsg || 'ذخیره شد'); if (root.MayanApp) root.MayanApp.refreshBadges(); }).catch(function (e) { U.toast(e.message, 'err'); throw e; });
  }
  function csv(name, head, rows) {
    var out = '﻿' + [head].concat(rows).map(function (r) { return r.map(U.csvEscape).join(','); }).join('\r\n');
    var blob = new Blob([out], { type: 'text/csv;charset=utf-8' }), a = root.document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; root.document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- ساخت گارانتی از سفارش ---------- */
  function warrantyFromOrder(o, close) {
    var n = 0, today = M.todayISO(), months = +A.site.settings.defaultWarrantyMonths || 12;
    var jobs = [];
    (o.items || []).forEach(function (it) {
      for (var k = 0; k < Math.min(it.qty || 1, 20); k++) {
        var code; do { code = M.makeCode('MS', 6); } while (A.cols.warranties.some(function (w) { return w.id === code; }));
        jobs.push({ id: code, code: code, customer: (o.customer || {}).name || '', mobile: (o.customer || {}).mobile || '', product: it.name, serial: '', start: today, months: months, status: 'active', publicNote: '', orderId: o.id });
        n++;
      }
    });
    jobs.reduce(function (p, w) { return p.then(function () { return A.upsert('warranties', w); }); }, Promise.resolve()).then(function () {
      U.toast(M.toFa(n) + ' گارانتی ساخته شد؛ شماره سریال را در بخش گارانتی‌ها تکمیل کنید.'); close(); location.hash = '#/warranties';
    }).catch(function (e) { U.toast(e.message, 'err'); });
  }

  /* ---------- جزئیات رکورد ---------- */
  function openRecord(col, rec, rerender) {
    var body = '', c = rec.customer || rec;
    if (col === 'orders') {
      body = kv([['کد سفارش', rec.id], ['تاریخ ثبت', M.fmtDateTime(rec.createdAt)], ['نام', c.name], ['موبایل', contactLinks(c.mobile), 1], ['شهر', c.city], ['نشانی', c.address], ['توضیحات مشتری', c.notes]]) +
        '<div class="tbl-wrap" style="margin:14px 0"><table style="min-width:0"><thead><tr><th>محصول</th><th>تعداد</th><th>قیمت واحد</th></tr></thead><tbody>' +
        (rec.items || []).map(function (i) { return '<tr><td>' + esc(i.name) + '</td><td>' + M.toFa(i.qty) + '</td><td class="price">' + U.fmtMoney(i.price) + '</td></tr>'; }).join('') +
        '<tr><td colspan="2"><b>جمع کل</b></td><td class="price">' + U.fmtMoney(rec.total) + '</td></tr></tbody></table></div>';
    } else if (col === 'services') {
      body = kv([['کد درخواست', rec.id], ['تاریخ ثبت', M.fmtDateTime(rec.createdAt)], ['نوع خدمت', rec.kind], ['دستگاه', rec.device], ['برند', rec.brand], ['مدل', rec.model], ['سریال', rec.serial],
        ['شرح مشکل', rec.problem], ['نام', rec.name], ['موبایل', contactLinks(rec.mobile), 1], ['شهر', rec.city], ['نشانی', rec.address], ['زمان ترجیحی', rec.preferred]]) + '<div style="height:14px"></div>';
    } else {
      body = kv([['کد پیام', rec.id], ['تاریخ', M.fmtDateTime(rec.createdAt)], ['نام', rec.name], ['موبایل', contactLinks(rec.mobile), 1], ['موضوع', rec.subject], ['متن پیام', rec.text]]) + '<div style="height:14px"></div>';
    }
    if (col !== 'messages') {
      body += '<form class="grid g2" id="rf" novalidate>' + U.field('status', 'وضعیت', rec.status, { type: 'select', options: statusOptions() }) + '<div></div>' +
        U.field('publicNote', 'یادداشت قابل نمایش به مشتری (در پیگیری با کد)', rec.publicNote, { type: 'textarea', span: true, rows: 2 }) +
        U.field('adminNote', 'یادداشت داخلی (فقط مدیر)', rec.adminNote, { type: 'textarea', span: true, rows: 2 }) + '</form>';
    }
    var actions = [];
    if (col !== 'messages') actions.push({ label: 'ذخیره', cls: 'gold', icon: 'check', onClick: function (m, close) {
      var d = U.read(U.$('#rf', m)); save(col, { id: rec.id, status: d.status, publicNote: d.publicNote, adminNote: d.adminNote }, 'ذخیره شد').then(function () { close(); rerender(); }); } });
    else actions.push({ label: rec.read ? 'علامت: خوانده‌نشده' : 'علامت: خوانده‌شده', cls: 'gold', onClick: function (m, close) { save(col, { id: rec.id, read: !rec.read }).then(function () { close(); rerender(); }); } });
    if (col === 'orders') actions.push({ label: 'ساخت گارانتی از این سفارش', icon: 'shield-check', onClick: function (m, close) { warrantyFromOrder(rec, close); } });
    actions.push({ label: 'حذف', cls: 'danger', icon: 'trash', onClick: function (m, close) {
      U.confirm('این مورد برای همیشه حذف شود؟', 'حذف', true).then(function (ok) { if (ok) A.remove(col, rec.id).then(function () { close(); rerender(); if (root.MayanApp) root.MayanApp.refreshBadges(); }).catch(function (e) { U.toast(e.message, 'err'); }); }); } });
    U.modal({ title: ({ orders: 'سفارش', services: 'درخواست خدمات', messages: 'پیام' })[col] + ' ' + rec.id, body: body, actions: actions });
    if (col === 'messages' && !rec.read) A.upsert(col, { id: rec.id, read: true }).then(function () { if (root.MayanApp) root.MayanApp.refreshBadges(); rerender(); });
  }

  /* ---------- جدول‌های سه‌گانه ---------- */
  function inboxView(col, title, icon, cols, cells, csvInfo) {
    V.register({ id: col, title: title, icon: icon, badge: function () { return A.newCount(col); }, render: function (el) {
      function draw() {
        var f = F[col], list = A.cols[col].filter(function (r) { return match(r, f.q) && (!f.st || (col === 'messages' ? (f.st === 'unread' ? !r.read : r.read) : r.status === f.st)); });
        el.innerHTML = '<div class="stack"><div class="toolbar"><div class="grow"><input type="search" id="fq" placeholder="جستجو (نام، موبایل، کد…)" value="' + esc(f.q) + '"></div>' +
          '<select id="fs"><option value="">همه</option>' + (col === 'messages' ? '<option value="unread"' + (f.st === 'unread' ? ' selected' : '') + '>خوانده‌نشده</option><option value="read"' + (f.st === 'read' ? ' selected' : '') + '>خوانده‌شده</option>' :
            statusOptions().map(function (o) { return '<option value="' + o[0] + '"' + (f.st === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('')) + '</select>' +
          '<button class="btn" id="exp">' + M.icon('download') + 'خروجی CSV</button></div>' +
          '<div class="tbl-wrap"><table><thead><tr>' + cols.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' +
          (list.length ? list.map(function (r) { return '<tr data-id="' + esc(r.id) + '" style="cursor:pointer' + (col === 'messages' && !r.read ? ';font-weight:700' : '') + '">' + cells(r).map(function (c) { return '<td>' + c + '</td>'; }).join('') +
            '<td><div class="row-actions"><button class="icon-btn" aria-label="مشاهده">' + M.icon('eye') + '</button></div></td></tr>'; }).join('') :
            '<tr><td colspan="' + (cols.length + 1) + '" class="empty">' + (A.cols[col].length ? 'موردی با این فیلتر پیدا نشد.' : 'هنوز موردی ثبت نشده است.') + '</td></tr>') + '</tbody></table></div></div>';
        U.$('#fq', el).oninput = M.debounce(function (e) { f.q = e.target.value; var p = e.target.selectionStart; draw(); var n = U.$('#fq', el); n.focus(); try { n.setSelectionRange(p, p); } catch (x) {} }, 250);
        U.$('#fs', el).onchange = function (e) { f.st = e.target.value; draw(); };
        U.$('#exp', el).onclick = function () { csv(col + '-' + M.todayISO() + '.csv', csvInfo.head, list.map(csvInfo.row)); };
        U.$$('tbody tr[data-id]', el).forEach(function (tr) { tr.onclick = function () { var r = A.cols[col].filter(function (x) { return x.id === tr.dataset.id; })[0]; if (r) openRecord(col, r, draw); }; });
      }
      draw();
    } });
  }
  var d = function (r) { return M.fmtDateTime(r.createdAt); };
  inboxView('orders', 'سفارش‌های گارانتی', 'inbox', ['کد', 'تاریخ', 'مشتری', 'موبایل', 'مبلغ', 'وضعیت'],
    function (r) { var c = r.customer || {}; return ['<span class="ltr">' + esc(r.id) + '</span>', d(r), esc(c.name || ''), '<span class="ltr">' + esc(c.mobile || '') + '</span>', '<span class="price">' + U.fmtMoney(r.total) + '</span>', U.statusPill(r.status)]; },
    { head: ['کد', 'تاریخ', 'نام', 'موبایل', 'شهر', 'محصولات', 'مبلغ (تومان)', 'وضعیت'], row: function (r) { var c = r.customer || {}; return [r.id, r.createdAt, c.name, c.mobile, c.city, (r.items || []).map(function (i) { return i.name + ' x' + i.qty; }).join(' | '), r.total, (M.STATUS[r.status] || {}).label]; } });
  inboxView('services', 'درخواست‌های خدمات', 'wrench', ['کد', 'تاریخ', 'نوع', 'دستگاه', 'مشتری', 'وضعیت'],
    function (r) { return ['<span class="ltr">' + esc(r.id) + '</span>', d(r), esc(r.kind || ''), esc([r.device, r.brand].filter(Boolean).join(' — ')), esc(r.name || '') + ' <span class="muted ltr">' + esc(r.mobile || '') + '</span>', U.statusPill(r.status)]; },
    { head: ['کد', 'تاریخ', 'نوع', 'دستگاه', 'برند', 'مدل', 'سریال', 'مشکل', 'نام', 'موبایل', 'شهر', 'نشانی', 'وضعیت'], row: function (r) { return [r.id, r.createdAt, r.kind, r.device, r.brand, r.model, r.serial, r.problem, r.name, r.mobile, r.city, r.address, (M.STATUS[r.status] || {}).label]; } });
  inboxView('messages', 'پیام‌های تماس', 'message', ['تاریخ', 'نام', 'موبایل', 'موضوع'],
    function (r) { return [d(r) + (r.read ? '' : ' ' + U.pill('جدید', 'info')), esc(r.name || ''), '<span class="ltr">' + esc(r.mobile || '') + '</span>', esc(r.subject || (r.text || '').slice(0, 40))]; },
    { head: ['کد', 'تاریخ', 'نام', 'موبایل', 'موضوع', 'متن'], row: function (r) { return [r.id, r.createdAt, r.name, r.mobile, r.subject, r.text]; } });

  /* ---------- گارانتی‌ها ---------- */
  var WL = { active: ['فعال', 'ok'], expired: ['منقضی‌شده', 'bad'], void: ['باطل‌شده', 'off'], pending: ['در انتظار شروع', 'warn'] };
  function warrantyModal(w, rerender) {
    var isNew = !w, code = isNew ? (function () { var c; do { c = M.makeCode('MS', 6); } while (A.cols.warranties.some(function (x) { return x.id === c; })); return c; })() : w.id;
    w = w || { id: code, code: code, customer: '', mobile: '', product: '', serial: '', start: M.todayISO(), months: +A.site.settings.defaultWarrantyMonths || 12, status: 'active', publicNote: '' };
    var prodNames = A.site.products.map(function (p) { return p.name; });
    var body = '<form class="grid g2" id="wf" novalidate>' +
      U.field('code', 'کد گارانتی (یکتا)', w.code, { ltr: true, attrs: isNew ? '' : 'readonly' }) +
      U.field('status', 'وضعیت', w.status === 'void' ? 'void' : 'active', { type: 'select', options: [['active', 'فعال'], ['void', 'باطل‌شده']] }) +
      U.field('customer', 'نام مشتری', w.customer) + U.field('mobile', 'موبایل', w.mobile, { ltr: true, type: 'tel' }) +
      '<label class="fld span2"><span>محصول</span><input type="text" name="product" list="plist" value="' + esc(w.product) + '"><datalist id="plist">' + prodNames.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist></label>' +
      U.field('serial', 'شماره سریال', w.serial, { ltr: true }) + U.field('months', 'مدت گارانتی (ماه)', w.months, { type: 'number' }) +
      U.field('start', 'تاریخ شروع (میلادی؛ معادل شمسی زیر نمایش داده می‌شود)', w.start, { type: 'date' }) + '<div class="fld"><span>معادل شمسی</span><div id="jd" style="min-height:44px;display:flex;align-items:center" class="muted"></div></div>' +
      U.field('publicNote', 'یادداشت قابل نمایش در استعلام (اختیاری)', w.publicNote || w.note, { type: 'textarea', span: true, rows: 2 }) + '</form>';
    var m = U.modal({ title: isNew ? 'ثبت گارانتی جدید' : 'ویرایش گارانتی ' + w.id, body: body, actions: [
      { label: 'ذخیره', cls: 'gold', icon: 'check', onClick: function (mm, close) {
        var d = U.read(U.$('#wf', mm)), cd = M.toEn(d.code).toUpperCase().replace(/\s+/g, '');
        if (!/^[A-Z0-9_\-]{3,40}$/.test(cd)) { U.toast('کد باید ۳ تا ۴۰ نویسه‌ی انگلیسی/عدد/خط تیره باشد', 'err'); return; }
        if (isNew && A.cols.warranties.some(function (x) { return x.id === cd; })) { U.toast('این کد قبلاً ثبت شده است', 'err'); return; }
        if (!d.product) { U.toast('محصول را وارد کنید', 'err'); return; }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d.start)) { U.toast('تاریخ شروع را انتخاب کنید', 'err'); return; }
        var rec = { id: cd, code: cd, customer: d.customer, mobile: M.normMobile(d.mobile), product: d.product, serial: d.serial, start: d.start, months: Math.max(1, d.months | 0), status: d.status, publicNote: d.publicNote, demo: false };
        save('warranties', rec, 'گارانتی ذخیره شد').then(function () { close(); rerender(); });
      } }, { label: 'انصراف', cls: 'ghost' }] });
    var si = U.$('[name=start]', m.el), jd = U.$('#jd', m.el);
    function showJ() { jd.textContent = /^\d{4}-\d{2}-\d{2}$/.test(si.value) ? M.jalali.format(si.value) : '—'; }
    si.addEventListener('input', showJ); showJ();
  }

  V.register({ id: 'warranties', title: 'گارانتی‌ها', icon: 'shield-check', render: function (el) {
    function draw() {
      var f = F.warranties, now = M.todayISO();
      var list = A.cols.warranties.map(function (w) { return { w: w, st: M.warrantyState(w, now) }; }).filter(function (x) { return match(x.w, f.q) && (!f.st || x.st.state === f.st); });
      el.innerHTML = '<div class="stack"><div class="hint">مشتری در سایت با «کد گارانتی» یا «شماره سریال» استعلام می‌گیرد. فقط نام ماسک‌شده نمایش داده می‌شود. رکورد <b class="ltr">DEMO-1234</b> نمونه‌ی آزمایشی است و باید پس از تست حذف شود.</div>' +
        '<div class="toolbar"><div class="grow"><input type="search" id="fq" placeholder="جستجو (کد، سریال، نام…)" value="' + esc(f.q) + '"></div>' +
        '<select id="fs"><option value="">همه‌ی وضعیت‌ها</option>' + Object.keys(WL).map(function (k) { return '<option value="' + k + '"' + (f.st === k ? ' selected' : '') + '>' + WL[k][0] + '</option>'; }).join('') + '</select>' +
        '<button class="btn" id="exp">' + M.icon('download') + 'خروجی CSV</button><button class="btn gold" id="addw">' + M.icon('plus') + 'گارانتی جدید</button></div>' +
        '<div class="tbl-wrap"><table><thead><tr><th>کد</th><th>محصول</th><th>مشتری</th><th>سریال</th><th>شروع</th><th>پایان</th><th>وضعیت</th><th></th></tr></thead><tbody>' +
        (list.length ? list.map(function (x) { var w = x.w, s = WL[x.st.state];
          return '<tr data-id="' + esc(w.id) + '"><td class="ltr">' + esc(w.code) + (w.demo ? ' ' + U.pill('نمونه', 'warn') : '') + '</td><td>' + esc(w.product) + '</td><td>' + esc(w.customer || '') + '</td><td class="ltr">' + esc(w.serial || '—') + '</td>' +
            '<td>' + (w.start ? M.jalali.format(w.start) : '—') + '</td><td>' + (x.st.end ? M.jalali.format(x.st.end) : '—') + '</td><td>' + U.pill(s[0], s[1]) + '</td>' +
            '<td><div class="row-actions"><button class="icon-btn" data-a="edit" aria-label="ویرایش">' + M.icon('edit') + '</button><button class="icon-btn" data-a="copy" aria-label="کپی کد">' + M.icon('copy') + '</button><button class="icon-btn bad" data-a="del" aria-label="حذف">' + M.icon('trash') + '</button></div></td></tr>'; }).join('') :
          '<tr><td colspan="8" class="empty">گارانتی‌ای پیدا نشد.</td></tr>') + '</tbody></table></div></div>';
      U.$('#fq', el).oninput = M.debounce(function (e) { f.q = e.target.value; var p = e.target.selectionStart; draw(); var n = U.$('#fq', el); n.focus(); try { n.setSelectionRange(p, p); } catch (x) {} }, 250);
      U.$('#fs', el).onchange = function (e) { f.st = e.target.value; draw(); };
      U.$('#addw', el).onclick = function () { warrantyModal(null, draw); };
      U.$('#exp', el).onclick = function () {
        csv('warranties-' + now + '.csv', ['کد', 'محصول', 'مشتری', 'موبایل', 'سریال', 'شروع', 'ماه', 'پایان', 'وضعیت'],
          list.map(function (x) { var w = x.w; return [w.code, w.product, w.customer, w.mobile, w.serial, w.start, w.months, x.st.end, WL[x.st.state][0]]; }));
      };
      U.$$('[data-a]', el).forEach(function (b) { b.onclick = function () {
        var id = b.closest('tr').dataset.id, w = A.cols.warranties.filter(function (x) { return x.id === id; })[0], a = b.dataset.a;
        if (a === 'edit') warrantyModal(w, draw);
        else if (a === 'copy') { M.copy(w.code); }
        else U.confirm('گارانتی «' + w.code + '» حذف شود؟', 'حذف', true).then(function (ok) { if (ok) A.remove('warranties', id).then(draw).catch(function (e) { U.toast(e.message, 'err'); }); });
      }; });
    }
    draw();
  } });
})(window);
