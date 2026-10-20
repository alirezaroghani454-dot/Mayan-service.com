/* ==========================================================================
   مایان سرویس — admin/js/admin-ui.js
   اجزای رابط: مودال، تأیید، فیلد، توست، ابزارهای فرم
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan, A = root.MayanAdmin, doc = root.document;
  var U = root.MayanUI = {};
  var esc = M.esc;

  U.$ = function (s, c) { return (c || doc).querySelector(s); };
  U.$$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  U.ic = M.icon;

  U.toast = function (msg, type) {
    var el = doc.createElement('div'); el.className = 'toast ' + (type || 'ok'); el.textContent = msg;
    U.$('#toastRoot').appendChild(el); setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
    setTimeout(function () { el.remove(); }, 3600);
  };

  /* ---------- مودال ---------- */
  U.modal = function (o) {
    var back = doc.createElement('div'); back.className = 'modal-back';
    var acts = (o.actions || []).map(function (a, i) { return '<button type="button" class="btn ' + (a.cls || '') + '" data-i="' + i + '">' + (a.icon ? M.icon(a.icon) : '') + esc(a.label) + '</button>'; }).join('');
    back.innerHTML = '<div class="modal ' + (o.narrow ? 'narrow' : '') + '" role="dialog" aria-modal="true"><div class="modal-head"><h3>' + esc(o.title || '') +
      '</h3><button type="button" class="icon-btn" data-x aria-label="بستن">' + M.icon('x') + '</button></div><div class="modal-body">' + (o.body || '') + '</div>' +
      (acts ? '<div class="modal-foot">' + acts + '</div>' : '') + '</div>';
    U.$('#modalRoot').appendChild(back);
    var prevFocus = doc.activeElement;
    function close() { back.remove(); doc.removeEventListener('keydown', onKey); if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) {} }
    function onKey(e) { if (e.key === 'Escape') close(); }
    doc.addEventListener('keydown', onKey);
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    U.$('[data-x]', back).addEventListener('click', close);
    U.$$('.modal-foot .btn', back).forEach(function (b) {
      b.addEventListener('click', function () { var a = o.actions[+b.dataset.i]; if (a.onClick) a.onClick(back, close); else close(); });
    });
    var first = U.$('input:not([type=hidden]),select,textarea', back); if (first && !M.isTouch()) first.focus();
    if (o.onOpen) o.onOpen(back, close);
    return { el: back, close: close };
  };
  U.confirm = function (msg, okLabel, danger) {
    return new Promise(function (resolve) {
      var done = false;
      var m = U.modal({ title: 'تأیید', narrow: true, body: '<p style="margin:0">' + esc(msg) + '</p>', actions: [
        { label: okLabel || 'تأیید', cls: danger ? 'danger' : 'gold', onClick: function (b, c) { done = true; c(); resolve(true); } },
        { label: 'انصراف', cls: 'ghost', onClick: function (b, c) { c(); resolve(false); } }] });
      m.el.addEventListener('click', function (e) { if (!done && (e.target === m.el)) resolve(false); });
    });
  };

  /* ---------- فیلدها ---------- */
  U.field = function (name, label, value, o) {
    o = o || {}; var v = value == null ? '' : value, t = o.type || 'text', cls = o.span ? ' span2' : '', extra = o.attrs || '';
    if (t === 'textarea') return '<label class="fld' + cls + '"><span>' + esc(label) + '</span><textarea name="' + name + '" rows="' + (o.rows || 3) + '" ' + extra + '>' + esc(v) + '</textarea></label>';
    if (t === 'select') return '<label class="fld' + cls + '"><span>' + esc(label) + '</span><select name="' + name + '" ' + extra + '>' +
      o.options.map(function (op) { var val = Array.isArray(op) ? op[0] : op, lb = Array.isArray(op) ? op[1] : op; return '<option value="' + esc(val) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + esc(lb) + '</option>'; }).join('') + '</select></label>';
    if (t === 'checkbox') return '<label class="chk' + cls + '"><input type="checkbox" name="' + name + '"' + (v ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
    if (t === 'money') return '<label class="fld' + cls + '"><span>' + esc(label) + '</span><input type="text" inputmode="numeric" class="ltr" data-money name="' + name + '" value="' + esc(M.fmtPrice(v).replace(/[۰-۹]/g, function (c) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(c); })) + '" ' + extra + '></label>';
    return '<label class="fld' + cls + '"><span>' + esc(label) + '</span><input type="' + t + '" name="' + name + '" value="' + esc(v) + '"' + (o.ltr ? ' class="ltr" dir="ltr"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + ' ' + extra + '></label>';
  };
  U.bindMoney = function (ctx) {
    U.$$('[data-money]', ctx).forEach(function (i) {
      i.addEventListener('input', function () {
        var n = parseInt(M.toEn(i.value).replace(/\D/g, ''), 10); i.value = isNaN(n) ? '' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      });
    });
  };
  U.num = function (v) { var n = parseInt(M.toEn(String(v == null ? '' : v)).replace(/[^\d-]/g, ''), 10); return isNaN(n) ? 0 : n; };
  U.read = function (ctx) {
    var out = {};
    U.$$('[name]', ctx).forEach(function (el) {
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.hasAttribute('data-money')) out[el.name] = U.num(el.value);
      else if (el.type === 'number') out[el.name] = Number(M.toEn(el.value)) || 0;
      else out[el.name] = el.value.trim();
    });
    return out;
  };
  U.iconOptions = function (kind) {
    var list = kind === 'product' ? Object.keys(M.PRODUCT_ICON_LABELS || {}) : M.UI_ICONS.filter(function (n) { return ['tv', 'dishwasher', 'microwave'].indexOf(n) < 0 || true; });
    return list;
  };
  U.pill = function (text, tone) { return '<span class="pill ' + (tone || 'info') + '">' + esc(text) + '</span>'; };
  U.statusPill = function (s) { var st = M.STATUS[s] || M.STATUS['new']; return U.pill(st.label, st.tone); };
  U.fmtMoney = function (n) { return M.toFa(M.fmtPrice(n)) + ' تومان'; };

  U.csvEscape = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
})(window);
