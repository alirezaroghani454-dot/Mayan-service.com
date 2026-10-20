/* ==========================================================================
   مایان سرویس — js/core/store.js
   لایه داده‌ی سایت (سمت بازدیدکننده)

   دو حالت کار:
   • server : روی هاست دارای PHP  → داده‌ها از api/ خوانده و ذخیره می‌شود.
   • local  : بدون PHP / باز کردن مستقیم فایل → داده‌ها از data/site-data.json یا مقادیر پیش‌فرض؛
              سفارش‌ها و پیام‌ها در localStorage همین مرورگر نگه‌داری می‌شود (برای آزمایش).
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan;

  var KEYS = {
    draft: 'mayan_site_draft_v1',     // پیش‌نویس محتوای سایت (فقط حالت محلی)
    inbox: 'mayan_inbox_v1',          // سفارش‌ها، درخواست‌ها و پیام‌ها (فقط حالت محلی)
    warr:  'mayan_warranties_v1',     // گارانتی‌های ثبت‌شده (فقط حالت محلی)
    cart:  'mayan_cart_v1'
  };
  var API = 'api/';
  var S = M.store = { mode: 'local', data: null, KEYS: KEYS, API: API };

  /* ---------- fetch با مهلت زمانی ---------- */
  S.fetchJSON = function (url, opts, ms) {
    opts = opts || {};
    var ctrl = ('AbortController' in root) ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || 6000) : null;
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(url, opts).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
      return r.text();
    }).then(function (t) { return JSON.parse(t); });
  };

  /* ---------- تشخیص حالت (سرور / محلی) ---------- */
  S.detect = function () {
    if (root.location.protocol === 'file:') { S.mode = 'local'; return Promise.resolve('local'); }
    return S.fetchJSON(API + 'ping.php', { cache: 'no-store' }, 2500).then(function (j) {
      S.mode = (j && j.ok && j.app === 'mayan') ? 'server' : 'local';
      return S.mode;
    }).catch(function () { S.mode = 'local'; return 'local'; });
  };

  /* ---------- یکدست‌سازی داده‌ها ---------- */
  S.normalize = function (d) {
    d.settings = d.settings || {};
    ['categories', 'products', 'services', 'steps', 'features', 'faq', 'reviews', 'stats'].forEach(function (k) {
      if (!Array.isArray(d[k])) d[k] = [];
    });
    d.products.forEach(function (p, i) {
      p.price = Number(p.price) || 0;
      p.order = Number(p.order) || (i + 1);
      if (p.active === undefined) p.active = true;
    });
    d.products.sort(function (a, b) { return a.order - b.order; });
    delete d.warranties;                 // اطلاعات گارانتی مشتریان هرگز در داده‌ی عمومی نیست
    return d;
  };

  /* ---------- بارگذاری داده‌ی سایت ---------- */
  S.load = function () {
    return S.detect().then(function () {
      var defaults = M.defaults(), p;
      if (S.mode === 'server') {
        p = S.fetchJSON(API + 'data.php', { cache: 'no-store' }, 6000).then(function (r) { return r && r.data || null; }).catch(function () { return null; });
      } else if (root.location.protocol !== 'file:') {
        p = S.fetchJSON('data/site-data.json', { cache: 'no-cache' }, 5000).catch(function () { return null; });
      } else { p = Promise.resolve(null); }
      return p.then(function (loaded) {
        var data = M.deepMerge(defaults, loaded || {});
        if (S.mode === 'local') {                          // پیش‌نمایش تغییرات مدیر در همین مرورگر
          var draft = M.ls.get(KEYS.draft, null);
          if (draft) data = M.deepMerge(defaults, draft);
        }
        S.data = S.normalize(data);
        return S.data;
      });
    });
  };

  S.activeProducts = function () { return S.data.products.filter(function (p) { return p.active !== false; }); };
  S.productById = function (id) { return S.data.products.filter(function (p) { return p.id === id; })[0] || null; };
  S.categoryById = function (id) { return S.data.categories.filter(function (c) { return c.id === id; })[0] || null; };

  /* ---------- صندوق محلی ---------- */
  function inbox() {
    var x = M.ls.get(KEYS.inbox, null) || {};
    x.orders = x.orders || []; x.services = x.services || []; x.messages = x.messages || [];
    return x;
  }
  function localWarranties() {
    var w = M.ls.get(KEYS.warr, null);
    return Array.isArray(w) ? w : M.clone(root.MAYAN_DEFAULTS.warranties || []);
  }
  function uniqueCode(prefix, list) {
    var code; do { code = M.makeCode(prefix, 6); } while (list.some(function (r) { return r.id === code; }));
    return code;
  }

  /* ---------- ثبت سفارش / درخواست / پیام ---------- */
  S.submit = function (kind, payload) {
    if (S.mode === 'server') {
      return S.fetchJSON(API + 'submit.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: kind, payload: payload })
      }, 15000);
    }
    return new Promise(function (resolve) {
      var box = inbox(), now = new Date().toISOString(), rec;
      if (kind === 'order') {
        var items = [], total = 0;
        (payload.items || []).forEach(function (it) {
          var p = S.productById(it.id); if (!p) return;
          var q = M.clamp(parseInt(it.qty, 10) || 1, 1, 20);
          items.push({ id: p.id, name: p.name, price: p.price, qty: q }); total += p.price * q;
        });
        rec = { id: uniqueCode('ORD', box.orders), type: 'order', status: 'new', createdAt: now, customer: payload.customer, items: items, total: total, adminNote: '', publicNote: '' };
        box.orders.unshift(rec);
      } else if (kind === 'service') {
        rec = M.deepMerge({ adminNote: '', publicNote: '' }, payload);
        rec.id = uniqueCode('SRV', box.services); rec.type = 'service'; rec.status = 'new'; rec.createdAt = now;
        box.services.unshift(rec);
      } else {
        rec = M.deepMerge({}, payload);
        rec.id = uniqueCode('MSG', box.messages); rec.type = 'message'; rec.status = 'new'; rec.read = false; rec.createdAt = now;
        box.messages.unshift(rec);
      }
      M.ls.set(KEYS.inbox, box);
      resolve({ ok: true, code: rec.id, local: true });
    });
  };

  /* ---------- استعلام گارانتی ---------- */
  S.warrantyLookup = function (q) {
    q = String(q || '').trim();
    if (S.mode === 'server') return S.fetchJSON(API + 'inquiry.php?type=warranty&q=' + encodeURIComponent(q), { cache: 'no-store' }, 9000);
    var key = M.toEn(q).toUpperCase().replace(/\s+/g, '');
    var w = localWarranties().filter(function (x) {
      return String(x.code).toUpperCase() === key || String(x.serial || '').toUpperCase().replace(/\s+/g, '') === key;
    })[0];
    if (!w) return Promise.resolve({ ok: true, found: false });
    return Promise.resolve({ ok: true, found: true, warranty: {
      code: w.code, product: w.product, start: w.start, months: w.months, status: w.status,
      customerMasked: M.maskName(w.customer), note: w.publicNote || ''
    } });
  };

  /* ---------- پیگیری سفارش / درخواست با کد ---------- */
  S.trackLookup = function (q) {
    q = String(q || '').trim();
    if (S.mode === 'server') return S.fetchJSON(API + 'inquiry.php?type=track&q=' + encodeURIComponent(q), { cache: 'no-store' }, 9000);
    var key = M.toEn(q).toUpperCase().replace(/\s+/g, '');
    var box = inbox(), r, track = null;
    r = box.orders.filter(function (x) { return x.id === key; })[0];
    if (r) track = { type: 'order', code: r.id, status: r.status, createdAt: r.createdAt, title: 'سفارش ثبت گارانتی',
      lines: r.items.map(function (i) { return i.name + ' × ' + M.toFa(i.qty); }), total: r.total, publicNote: r.publicNote || '' };
    else {
      r = box.services.filter(function (x) { return x.id === key; })[0];
      if (r) track = { type: 'service', code: r.id, status: r.status, createdAt: r.createdAt, title: 'درخواست ' + (r.kind || 'خدمات'),
        lines: [[r.device, r.brand, r.model].filter(Boolean).join(' — ')], total: 0, publicNote: r.publicNote || '' };
    }
    return Promise.resolve(track ? { ok: true, found: true, track: track } : { ok: true, found: false });
  };
})(window);
