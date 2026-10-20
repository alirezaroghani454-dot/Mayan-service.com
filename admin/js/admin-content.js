/* مایان سرویس — admin/js/admin-content.js : دسته‌بندی‌ها و بخش‌های محتوا (خدمات، مراحل، ویژگی‌ها، سوالات، نظرات) */
(function (root) {
  'use strict';
  var M = root.Mayan, A = root.MayanAdmin, U = root.MayanUI, V = root.MayanViews;
  var tab = 'services';

  V.register({ id: 'categories', title: 'دسته‌بندی‌ها', icon: 'grid', render: function (el) {
    U.listEditor(el, {
      key: 'categories', addLabel: 'دسته‌بندی جدید',
      note: 'این دسته‌ها در چرخ سه‌بعدی و فیلتر محصولات سایت نمایش داده می‌شوند.',
      title: function (c) { return c.name || 'دسته‌بندی بدون نام'; },
      fields: [{ k: 'name', label: 'نام دسته' }, { k: 'icon', label: 'آیکون', type: 'icon', kind: 'product' }, { k: 'desc', label: 'توضیح کوتاه', span: true }],
      blank: function () { return { id: 'c_' + Date.now().toString(36), name: '', icon: 'appliance', desc: '' }; },
      canDelete: function (c) {
        var n = A.site.products.filter(function (p) { return p.cat === c.id; }).length;
        return n ? 'این دسته ' + M.toFa(n) + ' محصول دارد؛ ابتدا محصولات را به دسته‌ی دیگر ببرید.' : null;
      }
    });
  } });

  var TABS = {
    services: { label: 'خدمات', cfg: {
      key: 'services', addLabel: 'خدمت جدید', title: function (s) { return s.title || 'خدمت جدید'; },
      fields: [{ k: 'title', label: 'عنوان' }, { k: 'icon', label: 'آیکون', type: 'icon' }, { k: 'text', label: 'توضیح', type: 'textarea', span: true, rows: 2 },
        { k: 'cta', label: 'متن دکمه' }, { k: 'link', label: 'مقصد دکمه', type: 'select', options: [['#products', 'محصولات'], ['#inquiry', 'استعلام'], ['#request', 'درخواست خدمات'], ['#contact', 'تماس با ما'], ['#faq', 'سوالات متداول']] }],
      blank: function () { return { icon: 'wrench', title: '', text: '', link: '#request', cta: 'ثبت درخواست' }; } } },
    steps: { label: 'مراحل کار', cfg: {
      key: 'steps', addLabel: 'مرحله جدید', title: function (s, i) { return M.toFa(i + 1) + '. ' + (s.title || 'مرحله جدید'); },
      fields: [{ k: 'title', label: 'عنوان', span: true }, { k: 'text', label: 'توضیح', type: 'textarea', span: true, rows: 2 }],
      blank: function () { return { title: '', text: '' }; } } },
    features: { label: 'چرا ما؟', cfg: {
      key: 'features', addLabel: 'ویژگی جدید', title: function (s) { return s.title || 'ویژگی جدید'; },
      fields: [{ k: 'title', label: 'عنوان' }, { k: 'icon', label: 'آیکون', type: 'icon' }, { k: 'text', label: 'توضیح', type: 'textarea', span: true, rows: 2 }],
      blank: function () { return { icon: 'sparkle', title: '', text: '' }; } } },
    faq: { label: 'سوالات متداول', cfg: {
      key: 'faq', addLabel: 'سوال جدید', title: function (s) { return s.q || 'سوال جدید'; },
      fields: [{ k: 'q', label: 'سوال', span: true }, { k: 'a', label: 'پاسخ', type: 'textarea', span: true, rows: 4 }],
      blank: function () { return { q: '', a: '' }; } } },
    reviews: { label: 'نظر مشتریان', cfg: {
      key: 'reviews', addLabel: 'نظر جدید', note: 'فقط نظرهای واقعی و با رضایت مشتری را اضافه کنید. تا وقتی نظری ثبت نشود، این بخش در سایت دیده نمی‌شود.',
      title: function (s) { return s.name || 'نظر جدید'; },
      fields: [{ k: 'name', label: 'نام مشتری' }, { k: 'role', label: 'شهر / توضیح (اختیاری)' },
        { k: 'stars', label: 'امتیاز', type: 'select', options: [['5', '۵ ستاره'], ['4', '۴ ستاره'], ['3', '۳ ستاره']] },
        { k: 'text', label: 'متن نظر', type: 'textarea', span: true, rows: 3 }],
      blank: function () { return { name: '', role: '', stars: '5', text: '' }; } } }
  };

  V.register({ id: 'content', title: 'بخش‌های محتوا', icon: 'list', render: function (el) {
    el.innerHTML = '<div class="tabs" role="tablist">' + Object.keys(TABS).map(function (k) {
      return '<button type="button" class="tab' + (k === tab ? ' on' : '') + '" data-t="' + k + '" role="tab">' + TABS[k].label + '</button>'; }).join('') + '</div><div id="tabBody"></div>';
    U.$$('.tab', el).forEach(function (b) { b.onclick = function () { tab = b.dataset.t; V.go('content'); }; });
    U.listEditor(U.$('#tabBody', el), TABS[tab].cfg);
  } });
})(window);
