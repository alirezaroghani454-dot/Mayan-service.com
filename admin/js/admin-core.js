/* ==========================================================================
   مایان سرویس — admin/js/admin-core.js
   هسته‌ی پنل: حالت کار (سرور/محلی)، احراز هویت، خواندن و ذخیره‌ی داده‌ها
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan;
  var API = '../api/';
  var KEYS = { draft: 'mayan_site_draft_v1', inbox: 'mayan_inbox_v1', warr: 'mayan_warranties_v1', lock: 'mayan_admin_lock_v1', sess: 'mayan_admin_sess_v1' };
  var A = root.MayanAdmin = {
    mode: 'local', csrf: '', mustChange: false,
    site: null, dirty: false,
    cols: { orders: [], services: [], messages: [], warranties: [] },
    COLS: ['orders', 'services', 'messages', 'warranties']
  };

  /* ---------- شبکه ---------- */
  function req(url, opts) {
    opts = opts || {}; opts.credentials = 'same-origin'; opts.cache = 'no-store';
    opts.headers = opts.headers || {};
    if (opts.body) opts.headers['Content-Type'] = 'application/json';
    if (opts.method === 'POST' && A.csrf) opts.headers['X-CSRF-Token'] = A.csrf;
    return fetch(url, opts).then(function (r) {
      return r.text().then(function (t) {
        var j; try { j = JSON.parse(t); } catch (e) { j = null; }
        if (!r.ok || !j || j.ok === false) {
          var err = new Error((j && j.error) || ('خطای سرور (' + r.status + ')')); err.status = r.status; throw err;
        }
        return j;
      });
    });
  }
  A.call = function (action, body, query) {
    var url = API + 'admin.php?action=' + action + (query || '');
    return req(url, body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) });
  };

  /* ---------- تشخیص حالت ---------- */
  A.detect = function () {
    if (root.location.protocol === 'file:') { A.mode = 'local'; return Promise.resolve('local'); }
    return fetch(API + 'ping.php', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      A.mode = (j && j.ok && j.app === 'mayan') ? 'server' : 'local'; return A.mode;
    }).catch(function () { A.mode = 'local'; return 'local'; });
  };

  /* ---------- احراز هویت ---------- */
  A.authState = function () {
    if (A.mode === 'server') {
      return A.call('me').then(function (j) {
        A.csrf = j.csrf || ''; A.mustChange = !!j.mustChange;
        return { auth: !!j.auth, setup: false };
      });
    }
    var lock = M.ls.get(KEYS.lock, null);
    var ok = false; try { ok = root.sessionStorage.getItem(KEYS.sess) === '1'; } catch (e) {}
    return Promise.resolve({ auth: !!lock && ok, setup: !lock });
  };
  A.login = function (pw) {
    if (A.mode === 'server') {
      return A.call('login', { password: pw }).then(function (j) { A.csrf = j.csrf; A.mustChange = !!j.mustChange; });
    }
    var lock = M.ls.get(KEYS.lock, null);
    if (lock !== M.sha256('mayan|' + pw)) return Promise.reject(new Error('رمز عبور نادرست است'));
    try { root.sessionStorage.setItem(KEYS.sess, '1'); } catch (e) {}
    return Promise.resolve();
  };
  A.setupLocal = function (pw) {
    M.ls.set(KEYS.lock, M.sha256('mayan|' + pw));
    try { root.sessionStorage.setItem(KEYS.sess, '1'); } catch (e) {}
  };
  A.logout = function () {
    if (A.mode === 'server') return A.call('logout', {}).catch(function () {});
    try { root.sessionStorage.removeItem(KEYS.sess); } catch (e) {}
    return Promise.resolve();
  };
  A.changePassword = function (cur, next) {
    if (A.mode === 'server') return A.call('change_password', { current: cur, next: next }).then(function () { A.mustChange = false; });
    if (M.ls.get(KEYS.lock, null) !== M.sha256('mayan|' + cur)) return Promise.reject(new Error('رمز فعلی نادرست است'));
    M.ls.set(KEYS.lock, M.sha256('mayan|' + next));
    return Promise.resolve();
  };

  /* ---------- داده‌ی سایت ---------- */
  function normalize(d) {
    d.settings = d.settings || {};
    ['categories', 'products', 'services', 'steps', 'features', 'faq', 'reviews', 'stats'].forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });
    d.products.forEach(function (p, i) {
      p.price = Number(p.price) || 0; p.order = i + 1; if (p.active === undefined) p.active = true;
    });
    delete d.warranties;
    return d;
  }
  A.loadSite = function () {
    var defaults = M.defaults(), p;
    if (A.mode === 'server') p = A.call('get_site', undefined).then(function (j) { return j.data; });
    else {
      var draft = M.ls.get(KEYS.draft, null);
      if (draft) p = Promise.resolve(draft);
      else if (root.location.protocol !== 'file:') p = fetch('../data/site-data.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
      else p = Promise.resolve(null);
    }
    return p.catch(function () { return null; }).then(function (loaded) {
      A.site = normalize(M.deepMerge(defaults, loaded || {})); A.dirty = false; return A.site;
    });
  };
  A.markDirty = function () { A.dirty = true; if (A.onDirty) A.onDirty(); };
  A.saveSite = function () {
    normalize(A.site);
    var done = function () { A.dirty = false; if (A.onDirty) A.onDirty(); };
    if (A.mode === 'server') return A.call('save_site', { data: A.site }).then(done);
    M.ls.set(KEYS.draft, A.site); done(); return Promise.resolve();
  };
  A.resetSite = function () { A.site = normalize(M.defaults()); A.markDirty(); };

  /* ---------- صندوق‌ها (سفارش، درخواست، پیام، گارانتی) ---------- */
  function localBox() {
    var x = M.ls.get(KEYS.inbox, null) || {};
    return { orders: x.orders || [], services: x.services || [], messages: x.messages || [] };
  }
  function localWarr() {
    var w = M.ls.get(KEYS.warr, null);
    return Array.isArray(w) ? w : M.clone(root.MAYAN_DEFAULTS.warranties || []);
  }
  function persistLocal() {
    M.ls.set(KEYS.inbox, { orders: A.cols.orders, services: A.cols.services, messages: A.cols.messages });
    M.ls.set(KEYS.warr, A.cols.warranties);
  }
  A.loadCols = function () {
    if (A.mode === 'server') {
      return A.call('list', undefined, '&col=all').then(function (j) {
        A.COLS.forEach(function (c) { A.cols[c] = j.data[c] || []; });
      });
    }
    var b = localBox(); A.cols.orders = b.orders; A.cols.services = b.services; A.cols.messages = b.messages; A.cols.warranties = localWarr();
    return Promise.resolve();
  };
  A.upsert = function (col, item) {
    var list = A.cols[col], i = -1;
    list.forEach(function (r, k) { if (r.id === item.id) i = k; });
    var apply = function () { if (i >= 0) list[i] = M.deepMerge(list[i], item); else list.unshift(item); if (A.mode === 'local') persistLocal(); };
    if (A.mode === 'server') return A.call('upsert', { col: col, item: item }).then(apply);
    apply(); return Promise.resolve();
  };
  A.remove = function (col, id) {
    var apply = function () { A.cols[col] = A.cols[col].filter(function (r) { return r.id !== id; }); if (A.mode === 'local') persistLocal(); };
    if (A.mode === 'server') return A.call('remove', { col: col, id: id }).then(apply);
    apply(); return Promise.resolve();
  };

  /* ---------- پشتیبان ---------- */
  A.exportAll = function () {
    return { _app: 'mayan-service', _at: new Date().toISOString(), site: A.site, orders: A.cols.orders, services: A.cols.services, messages: A.cols.messages, warranties: A.cols.warranties };
  };
  A.importAll = function (d) {
    if (!d || typeof d !== 'object' || !d.site) return Promise.reject(new Error('فایل پشتیبان معتبر نیست'));
    var prev = A.site;
    A.site = normalize(M.deepMerge(M.defaults(), d.site));
    A.COLS.forEach(function (c) { if (Array.isArray(d[c])) A.cols[c] = d[c]; });
    if (A.mode === 'server') {
      return A.call('import_all', { data: { site: A.site, orders: A.cols.orders, services: A.cols.services, messages: A.cols.messages, warranties: A.cols.warranties } })
        .then(function () { A.dirty = false; }).catch(function (e) { A.site = prev; throw e; });
    }
    persistLocal(); return A.saveSite();
  };
  A.download = function (name, obj) {
    var blob = new Blob([typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var a = root.document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; root.document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ---------- ابزارهای مشترک ---------- */
  A.newCount = function (col) { return A.cols[col].filter(function (r) { return col === 'messages' ? !r.read : r.status === 'new'; }).length; };
  A.catName = function (id) { var c = A.site.categories.filter(function (x) { return x.id === id; })[0]; return c ? c.name : '—'; };
})(window);
