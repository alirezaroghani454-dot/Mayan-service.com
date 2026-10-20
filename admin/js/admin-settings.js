/* مایان سرویس — admin/js/admin-settings.js : اطلاعات سایت، آمار، امنیت و پشتیبان */
(function (root) {
  'use strict';
  var M = root.Mayan, A = root.MayanAdmin, U = root.MayanUI, V = root.MayanViews, esc = M.esc;
  var tab = 'brand';

  var GROUPS = {
    brand: { label: 'هویت و تماس', fields: [
      ['brandName', 'نام برند'], ['brandLatin', 'نام لاتین', 'ltr'], ['slogan', 'شعار زیر نام', '', 1], ['manager', 'نام مدیر (نمایش در سایت)'],
      ['phone', 'تلفن ثابت', 'ltr'], ['mobile', 'موبایل پشتیبانی', 'ltr'], ['whatsapp', 'شماره واتساپ', 'ltr'], ['email', 'ایمیل', 'ltr'],
      ['address', 'نشانی دفتر', 'textarea', 1], ['hours', 'ساعت کاری'], ['mapUrl', 'لینک نقشه (نشان / گوگل‌مپ)', 'ltr', 1],
      ['instagram', 'لینک اینستاگرام', 'ltr'], ['telegram', 'لینک تلگرام', 'ltr']] },
    hero: { label: 'صفحه اصلی', fields: [
      ['heroEyebrow', 'عبارت بالای عنوان'], ['heroTitleTop', 'عنوان بزرگ (نام)'], ['heroTitleMain', 'عنوان اصلی', '', 1],
      ['heroLead', 'متن معرفی', 'textarea', 1], ['announce', 'نوار اعلان بالای سایت (خالی = مخفی)', '', 1], ['reviewsTitle', 'عنوان بخش نظرات']] },
    other: { label: 'گارانتی و سایر', fields: [
      ['defaultWarrantyMonths', 'مدت پیش‌فرض گارانتی (ماه)', 'number'], ['showDemoHint', 'نمایش راهنمای کد نمونه در بخش استعلام', 'checkbox']] },
    stats: { label: 'آمار صفحه اصلی' }
  };

  V.register({ id: 'site', title: 'اطلاعات و متن‌های سایت', icon: 'edit', render: function (el) {
    var g = GROUPS[tab], s = A.site.settings;
    el.innerHTML = '<div class="tabs">' + Object.keys(GROUPS).map(function (k) { return '<button type="button" class="tab' + (k === tab ? ' on' : '') + '" data-t="' + k + '">' + GROUPS[k].label + '</button>'; }).join('') + '</div><div id="gb"></div>';
    U.$$('.tab', el).forEach(function (b) { b.onclick = function () { tab = b.dataset.t; V.go('site'); }; });
    var box = U.$('#gb', el);
    if (tab === 'stats') {
      U.listEditor(box, { key: 'stats', addLabel: 'آمار جدید', title: function (x) { return x.label || 'آمار'; },
        note: 'این اعداد در نوار شمارنده‌ی صفحه‌ی اصلی نمایش داده می‌شوند. «محاسبه‌ی خودکار» تعداد واقعی محصولات یا دسته‌ها را می‌گذارد. این آمار نمونه است؛ فقط مقادیر واقعی را نگه دارید.',
        fields: [{ k: 'label', label: 'عنوان' }, { k: 'auto', label: 'مقدار', type: 'select', options: [['', 'عدد دستی'], ['products', 'تعداد محصولات (خودکار)'], ['categories', 'تعداد دسته‌ها (خودکار)']] },
          { k: 'value', label: 'عدد (برای حالت دستی)', type: 'number' }, { k: 'suffix', label: 'پسوند (مثلاً + یا /۷)' }],
        blank: function () { return { auto: '', value: 0, suffix: '', label: '' }; } });
      return;
    }
    box.innerHTML = '<form class="card grid g2" id="sf" novalidate>' + g.fields.map(function (f) {
      var k = f[0], label = f[1], t = f[2] || '', span = !!f[3];
      if (t === 'checkbox') return U.field(k, label, s[k], { type: 'checkbox', span: true });
      if (t === 'textarea') return U.field(k, label, s[k], { type: 'textarea', rows: 2, span: true });
      if (t === 'number') return U.field(k, label, s[k], { type: 'number' });
      return U.field(k, label, s[k], { ltr: t === 'ltr', span: span });
    }).join('') + '</form>';
    var form = U.$('#sf', box);
    function sync(e) { var t = e.target; if (!t.name) return; s[t.name] = t.type === 'checkbox' ? t.checked : (t.type === 'number' ? (Number(M.toEn(t.value)) || 0) : t.value.trim()); A.markDirty(); }
    form.oninput = form.onchange = sync;
  } });

  /* ---------- امنیت و پشتیبان ---------- */
  V.register({ id: 'system', title: 'امنیت و پشتیبان', icon: 'lock', render: function (el) {
    var locked = A.mode === 'server' && A.mustChange;
    var pwCard = '<section class="card"><h3>' + M.icon('lock') + 'تغییر رمز عبور</h3>' +
      (locked ? '<div class="hint warn" style="margin-bottom:14px"><b>برای ادامه، رمز پیش‌فرض را عوض کنید.</b> تا زمانی که رمز را تغییر ندهید، سایر بخش‌های پنل قفل است.</div>' : '') +
      '<form class="grid g2" id="pw" novalidate>' + '<label class="fld span2"><span>رمز فعلی</span><input type="password" name="cur" dir="ltr" autocomplete="current-password"></label>' +
      '<label class="fld"><span>رمز جدید (حداقل ۸ نویسه)</span><input type="password" name="n1" dir="ltr" autocomplete="new-password"></label>' +
      '<label class="fld"><span>تکرار رمز جدید</span><input type="password" name="n2" dir="ltr" autocomplete="new-password"></label>' +
      '<p class="err span2" id="pwErr"></p><div class="span2"><button class="btn gold" type="submit">' + M.icon('check') + 'تغییر رمز</button></div></form></section>';
    if (locked) { el.innerHTML = '<div class="stack">' + pwCard + '</div>'; bindPw(); return; }

    el.innerHTML = '<div class="stack">' + pwCard +
      '<section class="card"><h3>' + M.icon('database') + 'پشتیبان‌گیری و بازیابی</h3><p class="muted" style="margin-top:0">یک فایل کامل شامل محتوا، محصولات، سفارش‌ها، پیام‌ها و گارانتی‌ها. هر چند وقت یک بار نسخه‌ی پشتیبان بگیرید.</p>' +
      '<div class="toolbar" style="margin:0"><button class="btn gold" id="bk">' + M.icon('download') + 'دانلود پشتیبان کامل</button>' +
      '<label class="btn" style="cursor:pointer">' + M.icon('upload') + 'بازیابی از فایل<input type="file" id="rs" accept="application/json,.json" hidden></label></div></section>' +
      '<section class="card"><h3>' + M.icon('doc') + 'فایل داده‌ی عمومی سایت (site-data.json)</h3><p class="muted" style="margin-top:0">' +
      (A.mode === 'server' ? 'روی هاست PHP نیازی به این کار نیست؛ «انتشار تغییرات» مستقیم ذخیره می‌کند. این فایل فقط برای نسخه‌ی پشتیبان است.' :
        'در حالت بدون PHP، این فایل را دانلود و جایگزین <b class="ltr">data/site-data.json</b> کنید تا همه‌ی بازدیدکنندگان تغییرات را ببینند.') + '</p>' +
      '<button class="btn" id="sd">' + M.icon('download') + 'دانلود site-data.json</button></section>' +
      '<section class="card"><h3>' + M.icon('refresh') + 'بازنشانی محتوای سایت</h3><p class="muted" style="margin-top:0">محصولات، قیمت‌ها و متن‌ها به مقادیر اولیه برمی‌گردند (سفارش‌ها و گارانتی‌ها دست نمی‌خورند). پس از آن «انتشار تغییرات» را بزنید.</p>' +
      '<button class="btn danger" id="rz">' + M.icon('trash') + 'بازنشانی به پیش‌فرض</button></section></div>';
    bindPw();
    U.$('#bk', el).onclick = function () { A.download('mayan-backup-' + M.todayISO() + '.json', A.exportAll()); };
    U.$('#sd', el).onclick = function () { var d = M.clone(A.site); delete d.warranties; A.download('site-data.json', d); };
    U.$('#rz', el).onclick = function () { U.confirm('همه‌ی محتوای سایت به حالت اولیه برگردد؟', 'بازنشانی', true).then(function (ok) { if (ok) { A.resetSite(); U.toast('بازنشانی شد؛ «انتشار تغییرات» را بزنید.'); } }); };
    U.$('#rs', el).onchange = function (e) {
      var f = e.target.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () {
        var data; try { data = JSON.parse(rd.result); } catch (x) { U.toast('فایل خراب است', 'err'); return; }
        U.confirm('اطلاعات فعلی با فایل پشتیبان جایگزین شود؟', 'بازیابی', true).then(function (ok) {
          if (ok) A.importAll(data).then(function () { U.toast('بازیابی انجام شد'); if (root.MayanApp) root.MayanApp.refreshBadges(); V.go('system'); }).catch(function (er) { U.toast(er.message, 'err'); });
        });
      };
      rd.readAsText(f); e.target.value = '';
    };
    function bindPw() {
      var f = U.$('#pw', el); if (!f) return;
      f.onsubmit = function (ev) {
        ev.preventDefault(); var err = U.$('#pwErr', el), cur = f.cur.value, n1 = f.n1.value, n2 = f.n2.value; err.textContent = '';
        if (n1.length < 8) { err.textContent = 'رمز جدید حداقل ۸ نویسه باشد'; return; }
        if (n1 !== n2) { err.textContent = 'تکرار رمز یکسان نیست'; return; }
        if (n1 === cur) { err.textContent = 'رمز جدید باید با رمز فعلی فرق کند'; return; }
        A.changePassword(cur, n1).then(function () { U.toast('رمز عبور تغییر کرد'); f.reset(); if (root.MayanApp) root.MayanApp.afterPassword(); }).catch(function (e) { err.textContent = e.message; });
      };
    }
  } });
})(window);
