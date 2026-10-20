/* ==========================================================================
   مایان سرویس — js/core/utils.js
   توابع کمکی عمومی: اعداد فارسی، قیمت، تاریخ شمسی، ذخیره‌سازی، SHA-256، Toast
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan = root.Mayan || {};

  /* ---------- انتخابگرها ---------- */
  M.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  M.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- اعداد فارسی ---------- */
  var FA = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩';
  M.toFa = function (v) {
    return String(v == null ? '' : v).replace(/\d/g, function (d) { return FA.charAt(+d); });
  };
  M.toEn = function (v) {
    return String(v == null ? '' : v)
      .replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return AR.indexOf(d); });
  };
  M.fmtPrice = function (n) {
    n = Math.round(Number(n) || 0);
    return M.toFa(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  };
  M.fmtNum = function (n) { return M.fmtPrice(n); };

  /* ---------- امنیت متن ---------- */
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  M.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  };

  /* ---------- ابزارهای عمومی ---------- */
  M.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  M.lerp = function (a, b, t) { return a + (b - a) * t; };
  M.debounce = function (fn, ms) {
    var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); };
  };
  M.rafThrottle = function (fn) {
    var busy = false;
    return function () {
      if (busy) return; busy = true; var a = arguments, c = this;
      requestAnimationFrame(function () { busy = false; fn.apply(c, a); });
    };
  };
  M.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  M.deepMerge = function (base, over) {
    if (Array.isArray(over)) return over.slice();
    if (over && typeof over === 'object') {
      var out = (base && typeof base === 'object' && !Array.isArray(base)) ? M.clone(base) : {};
      Object.keys(over).forEach(function (k) {
        out[k] = (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]))
          ? M.deepMerge(out[k], over[k]) : (Array.isArray(over[k]) ? over[k].slice() : over[k]);
      });
      return out;
    }
    return over === undefined ? base : over;
  };
  M.defaults = function () { return M.clone(root.MAYAN_DEFAULTS); };
  M.reducedMotion = function () {
    return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  M.isTouch = function () {
    return !!(root.matchMedia && root.matchMedia('(hover: none), (pointer: coarse)').matches);
  };

  /* ---------- کد رهگیری (بدون حروف مبهم) ---------- */
  var ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  M.makeCode = function (prefix, len) {
    var s = '', a = new Uint8Array(len || 6);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(a);
    else for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    for (var j = 0; j < a.length; j++) s += ALPHA.charAt(a[j] % ALPHA.length);
    return prefix + '-' + s;
  };
  M.uid = function (p) { return (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };

  /* ---------- موبایل و لینک‌ها ---------- */
  M.normMobile = function (v) {
    var s = M.toEn(v).replace(/[^\d+]/g, '');
    if (s.indexOf('+98') === 0) s = '0' + s.slice(3);
    else if (s.indexOf('0098') === 0) s = '0' + s.slice(4);
    else if (s.indexOf('98') === 0 && s.length === 12) s = '0' + s.slice(2);
    else if (s.length === 10 && s.charAt(0) === '9') s = '0' + s;
    return s;
  };
  M.isMobile = function (v) { return /^09\d{9}$/.test(M.normMobile(v)); };
  M.telLink = function (v) { return 'tel:' + M.toEn(v).replace(/[^\d+]/g, ''); };
  M.waNumber = function (v) {
    var s = M.toEn(v).replace(/\D/g, '');
    if (s.indexOf('00') === 0) s = s.slice(2);
    if (s.charAt(0) === '0') s = '98' + s.slice(1);
    return s;
  };
  M.waLink = function (num, text) {
    return 'https://wa.me/' + M.waNumber(num) + (text ? '?text=' + encodeURIComponent(text) : '');
  };

  /* ---------- ذخیره‌سازی امن (با جایگزین حافظه) ---------- */
  var mem = {};
  M.ls = {
    get: function (k, fb) {
      try { var v = root.localStorage.getItem(k); return v == null ? fb : JSON.parse(v); }
      catch (e) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : fb; }
    },
    set: function (k, v) {
      try { root.localStorage.setItem(k, JSON.stringify(v)); return true; }
      catch (e) { mem[k] = v; return false; }
    },
    del: function (k) { try { root.localStorage.removeItem(k); } catch (e) {} delete mem[k]; }
  };

  /* ---------- SHA-256 (برای قفل ساده پنل در حالت محلی) ---------- */
  M.sha256 = function (str) {
    var ascii = unescape(encodeURIComponent(String(str)));
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var maxWord = Math.pow(2, 32), result = '', i, j;
    var words = [], bitLen = ascii.length * 8;
    var hash = [], k = [], pc = 0, comp = {};
    for (var c = 2; pc < 64; c++) {
      if (!comp[c]) {
        for (i = 0; i < 313; i += c) comp[i] = c;
        hash[pc] = (Math.pow(c, 0.5) * maxWord) | 0;
        k[pc++] = (Math.pow(c, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = (bitLen / maxWord) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), old = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? '0' : '') + b.toString(16); }
    return result;
  };

  /* ---------- Toast ---------- */
  M.toast = function (msg, type, ms) {
    var wrap = document.getElementById('toasts');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toasts'; wrap.className = 'toast-wrap'; wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
    var t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'info');
    t.setAttribute('role', 'status');
    t.textContent = msg;
    wrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400); }, ms || 3200);
  };

  /* ---------- کپی در کلیپ‌بورد ---------- */
  M.copy = function (text) {
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;top:0'; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); return ok;
    }
    if (root.navigator.clipboard && root.isSecureContext) {
      return root.navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  };

  /* ======================================================================
     تقویم شمسی (الگوریتم jalaali) — بدون وابستگی
     ====================================================================== */
  var J = M.jalali = {};
  var BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  function div(a, b) { return ~~(a / b); }
  function mod(a, b) { return a - ~~(a / b) * b; }
  function jalCal(jy, withoutLeap) {
    var bl = BREAKS.length, gy = jy + 621, leapJ = -14, jp = BREAKS[0], jm, jump = 0, leap, leapG, march, n, i;
    if (jy < jp || jy >= BREAKS[bl - 1]) throw new Error('Invalid Jalaali year ' + jy);
    for (i = 1; i < bl; i += 1) {
      jm = BREAKS[i]; jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    march = 20 + leapJ - leapG;
    if (withoutLeap) return { gy: gy, march: march };
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap: leap, gy: gy, march: march };
  }
  function g2d(gy, gm, gd) {
    var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  }
  function d2g(jdn) {
    var j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    var i = div(mod(j, 1461), 4) * 5 + 308;
    var gd = div(mod(i, 153), 5) + 1, gm = mod(div(i, 153), 12) + 1, gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy: gy, gm: gm, gd: gd };
  }
  function j2d(jy, jm, jd) {
    var r = jalCal(jy, true);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }
  function d2j(jdn) {
    var gy = d2g(jdn).gy, jy = gy - 621, r = jalCal(jy, false), jdn1f = g2d(gy, 3, r.march), jd, jm, k;
    k = jdn - jdn1f;
    if (k >= 0) {
      if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { y: jy, m: jm, d: jd }; }
      k -= 186;
    } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
    jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
    return { y: jy, m: jm, d: jd };
  }
  J.monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  /** ISO (yyyy-mm-dd) → {y,m,d} شمسی */
  J.fromISO = function (iso) {
    var p = String(iso).split('-'); if (p.length < 3) return null;
    return d2j(g2d(+p[0], +p[1], +p[2]));
  };
  /** شمسی → ISO میلادی */
  J.toISO = function (jy, jm, jd) {
    var g = d2g(j2d(jy, jm, jd));
    return g.gy + '-' + (g.gm < 10 ? '0' : '') + g.gm + '-' + (g.gd < 10 ? '0' : '') + g.gd;
  };
  /** نمایش «۱۴۰۵/۰۷/۲۷» از ISO */
  J.format = function (iso, long) {
    if (!iso) return '—';
    var j = J.fromISO(String(iso).slice(0, 10)); if (!j) return '—';
    if (long) return M.toFa(j.d) + ' ' + J.monthNames[j.m - 1] + ' ' + M.toFa(j.y);
    return M.toFa(j.y + '/' + (j.m < 10 ? '0' : '') + j.m + '/' + (j.d < 10 ? '0' : '') + j.d);
  };
  /** «۱۴۰۵/۰۷/۲۷» یا «1405-7-27» → ISO میلادی یا '' */
  J.parse = function (str) {
    var p = M.toEn(str).replace(/[^\d]+/g, '/').split('/').filter(Boolean);
    if (p.length !== 3) return '';
    var y = +p[0], m = +p[1], d = +p[2];
    if (y < 100) y += 1400;
    if (m < 1 || m > 12 || d < 1 || d > 31) return '';
    try { var iso = J.toISO(y, m, d); var back = J.fromISO(iso); return (back && back.y === y && back.m === m && back.d === d) ? iso : ''; }
    catch (e) { return ''; }
  };
  J.currentYear = function () { return J.fromISO(M.todayISO()).y; };

  /* ---------- تاریخ میلادی (ISO) ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  M.todayISO = function () { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  M.addMonths = function (iso, n) {
    var p = iso.split('-').map(Number), d = new Date(p[0], p[1] - 1 + n, p[2]);
    if (d.getDate() !== p[2]) d = new Date(p[0], p[1] - 1 + n + 1, 0); // پایان ماه
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  M.daysBetween = function (a, b) {
    var x = a.split('-').map(Number), y = b.split('-').map(Number);
    return Math.round((Date.UTC(y[0], y[1] - 1, y[2]) - Date.UTC(x[0], x[1] - 1, x[2])) / 86400000);
  };
  M.fmtDateTime = function (iso) {
    if (!iso) return '—';
    var d = new Date(iso); if (isNaN(d)) return '—';
    var date = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    return J.format(date) + ' — ' + M.toFa(pad(d.getHours()) + ':' + pad(d.getMinutes()));
  };

  /* ---------- وضعیت گارانتی (مشترک بین سایت و پنل) ---------- */
  M.warrantyState = function (w, todayIso) {
    todayIso = todayIso || M.todayISO();
    var end = w.start ? M.addMonths(w.start, +w.months || 0) : '';
    var state = 'active', left = 0;
    if (w.status === 'void') state = 'void';
    else if (!w.start) state = 'pending';
    else {
      left = M.daysBetween(todayIso, end);
      if (left < 0) state = 'expired';
      else if (M.daysBetween(todayIso, w.start) > 0) state = 'pending';
    }
    var total = w.start ? Math.max(1, M.daysBetween(w.start, end)) : 1;
    var used = w.start ? M.clamp(M.daysBetween(w.start, todayIso), 0, total) : 0;
    return { state: state, end: end, daysLeft: left, percentUsed: Math.round(used / total * 100) };
  };
  M.WARRANTY_LABELS = { active: 'فعال', expired: 'منقضی‌شده', void: 'باطل‌شده', pending: 'در انتظار شروع' };

  /* ---------- وضعیت‌های سفارش و درخواست ---------- */
  M.STATUS = {
    'new':      { label: 'جدید',         tone: 'info' },
    'review':   { label: 'در حال بررسی', tone: 'warn' },
    'progress': { label: 'در حال انجام', tone: 'warn' },
    'done':     { label: 'تکمیل شد',     tone: 'ok' },
    'canceled': { label: 'لغو شده',      tone: 'bad' }
  };
  M.STATUS_ORDER = ['new', 'review', 'progress', 'done', 'canceled'];

  /* ---------- نام ماسک‌شده ---------- */
  M.maskName = function (name) {
    return String(name || '').split(/\s+/).filter(Boolean).map(function (p) { return p.charAt(0) + '•••'; }).join(' ');
  };
})(window);
