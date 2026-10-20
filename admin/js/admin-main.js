/* مایان سرویس — admin/js/admin-main.js : راه‌اندازی، ورود، منو و مسیریابی */
(function (root) {
  'use strict';
  var M = root.Mayan, A = root.MayanAdmin, U = root.MayanUI, V = root.MayanViews, doc = root.document, esc = M.esc;
  var $ = U.$, current = 'dashboard', App = root.MayanApp = {};

  function setHidden(id, h) { $(id).hidden = h; }

  /* ---------- مسیریابی ---------- */
  function viewById(id) { return V.list.filter(function (v) { return v.id === id; })[0]; }
  V.go = function (id) { render(id || current); };
  function render(id) {
    if (A.mode === 'server' && A.mustChange) id = 'system';
    var v = viewById(id) || V.list[0]; current = v.id;
    $('#viewTitle').textContent = v.title;
    doc.title = v.title + ' — پنل مایان سرویس';
    $('#view').innerHTML = '';
    try { v.render($('#view')); } catch (e) { $('#view').innerHTML = '<div class="card"><b>خطا در نمایش این بخش.</b><p class="muted">' + esc(e.message) + '</p></div>'; if (root.console) console.error(e); }
    M.hydrateIcons($('#view'));
    drawNav(); closeMenu();
    var sc = doc.scrollingElement || doc.documentElement; sc.scrollTop = 0;
  }
  function route() { var h = (location.hash || '').replace(/^#\/?/, ''); render(h || 'dashboard'); }

  function drawNav() {
    var locked = A.mode === 'server' && A.mustChange;
    $('#nav').innerHTML = V.list.map(function (v) {
      var n = v.badge ? v.badge() : 0;
      return '<a href="#/' + v.id + '" class="' + (v.id === current ? 'on' : '') + '"' + (locked && v.id !== 'system' ? ' style="opacity:.4;pointer-events:none"' : '') + '>' + M.icon(v.icon) + '<span>' + esc(v.title) + '</span>' + (n ? '<i class="badge">' + M.toFa(n) + '</i>' : '') + '</a>';
    }).join('');
  }
  App.refreshBadges = drawNav;
  App.afterPassword = function () { if (A.mode === 'server') { A.mustChange = false; } location.hash = '#/dashboard'; route(); };

  function openMenu() { $('#side').classList.add('open'); $('#scrim').classList.add('show'); }
  function closeMenu() { $('#side').classList.remove('open'); $('#scrim').classList.remove('show'); }

  /* ---------- ذخیره ---------- */
  A.onDirty = function () {
    $('#dirtyTag').hidden = !A.dirty; $('#saveBtn').disabled = !A.dirty;
  };
  function publish() {
    var b = $('#saveBtn'); b.disabled = true;
    A.saveSite().then(function () { U.toast(A.mode === 'server' ? 'تغییرات منتشر شد و در سایت اعمال شد ✓' : 'تغییرات در این مرورگر ذخیره شد (برای انتشار عمومی، site-data.json را بگیرید)'); })
      .catch(function (e) { U.toast(e.message, 'err'); b.disabled = false; });
  }

  /* ---------- ورود ---------- */
  function showLogin(setup) {
    setHidden('#appView', true); setHidden('#loginView', false);
    var form = $('#loginForm');
    $('#loginMode').textContent = A.mode === 'server' ? '' : 'حالت پیش‌نمایش: رمز فقط در همین مرورگر ذخیره می‌شود و امنیت واقعی ندارد.';
    if (setup) {
      $('#loginHint').textContent = 'برای اولین بار یک رمز عبور بسازید (حداقل ۸ نویسه).';
      $('#loginLabel').textContent = 'رمز جدید'; setHidden('#loginPass2Wrap', false); $('#loginBtn').textContent = 'ساخت رمز و ورود';
    } else if (A.mode === 'server') {
      $('#loginHint').textContent = 'رمز اولیه در README آمده است؛ پس از ورود باید آن را تغییر دهید.';
    }
    form.onsubmit = function (e) {
      e.preventDefault(); var pw = $('#loginPass').value, err = $('#loginErr'); err.textContent = '';
      if (!pw) { err.textContent = 'رمز عبور را وارد کنید'; return; }
      var btn = $('#loginBtn'); btn.disabled = true;
      var p;
      if (setup) {
        if (pw.length < 8) { err.textContent = 'رمز حداقل ۸ نویسه باشد'; btn.disabled = false; return; }
        if (pw !== $('#loginPass2').value) { err.textContent = 'تکرار رمز یکسان نیست'; btn.disabled = false; return; }
        A.setupLocal(pw); p = Promise.resolve();
      } else p = A.login(pw);
      p.then(startApp).catch(function (er) { err.textContent = er.message; btn.disabled = false; $('#loginPass').select(); });
    };
    M.hydrateIcons($('#loginView')); $('#loginPass').focus();
  }

  function startApp() {
    return Promise.all([A.loadSite(), A.loadCols()]).then(function () {
      setHidden('#loginView', true); setHidden('#appView', false);
      var mb = $('#modeBadge'); mb.textContent = A.mode === 'server' ? 'متصل به سرور ✓' : 'حالت پیش‌نمایش (بدون سرور)'; mb.className = 'mode-badge ' + A.mode;
      M.hydrateIcons($('#appView')); A.onDirty(); route();
    }).catch(function (e) {
      setHidden('#appView', true); setHidden('#loginView', false);
      $('#loginErr').textContent = 'بارگذاری داده‌ها ناموفق بود: ' + e.message; $('#loginBtn').disabled = false;
    });
  }

  /* ---------- راه‌اندازی ---------- */
  function boot() {
    M.hydrateIcons(doc);
    $('#menuBtn').onclick = openMenu; $('#scrim').onclick = closeMenu;
    $('#saveBtn').onclick = publish;
    $('#logoutBtn').onclick = function () {
      var go = function () { A.logout().then(function () { location.hash = ''; location.reload(); }); };
      if (A.dirty) U.confirm('تغییرات منتشرنشده از بین می‌رود. خارج می‌شوید؟', 'خروج', true).then(function (ok) { if (ok) go(); }); else go();
    };
    root.addEventListener('hashchange', function () { if (!$('#appView').hidden) route(); });
    root.addEventListener('beforeunload', function (e) { if (A.dirty) { e.preventDefault(); e.returnValue = ''; } });
    doc.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !$('#appView').hidden) { e.preventDefault(); if (A.dirty) publish(); } });

    A.detect().then(A.authState).then(function (st) {
      if (st.auth) startApp(); else showLogin(st.setup);
    }).catch(function (e) { showLogin(false); $('#loginErr').textContent = e.message; });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
