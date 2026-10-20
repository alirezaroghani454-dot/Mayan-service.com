/* ==========================================================================
   مایان سرویس — js/modules/icons.js
   کتابخانه آیکون‌های SVG: آیکون محصولات (طلایی) + آیکون‌های رابط کاربری + لوگو
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan = root.Mayan || {};

  /* ---------- گرادیان‌های طلایی (یک‌بار در body تزریق می‌شود) ---------- */
  var DEFS =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".45" stop-color="#fcc64c"/><stop offset="1" stop-color="#c58a14"/></linearGradient>' +
    '<linearGradient id="gGoldF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe49a"/><stop offset=".5" stop-color="#e9ae2c"/><stop offset="1" stop-color="#b9801a"/></linearGradient>' +
    '<linearGradient id="gGoldText" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#fcc64c"/><stop offset="1" stop-color="#e8a921"/></linearGradient>' +
    '</defs></svg>';
  M.injectIconDefs = function () {
    if (document.getElementById('gGold')) return;
    var d = document.createElement('div'); d.innerHTML = DEFS;
    document.body.insertBefore(d.firstChild, document.body.firstChild);
  };

  /* ---------- آیکون محصولات (viewBox 64×64) ----------
     کلاس‌ها: f = بدنه طلایی، d = بخش تیره، s = خط طلایی، dl = خط تیره نازک */
  var P = {
    'tv':
      '<rect class="f" x="6" y="10" width="52" height="35" rx="5"/><rect class="d" x="11" y="15" width="42" height="25" rx="2.5"/>' +
      '<path class="s t" d="M16 22l9-5M16 29l17-12" opacity=".8"/><path class="s" d="M32 45v7M21 54l5-2h12l5 2"/>',
    'vacuum':
      '<path class="f" d="M6 41c0-9 6-15 15-15h14c8 0 12 6 12 15v3H6z"/><circle class="f" cx="21" cy="47" r="8"/><circle class="d" cx="21" cy="47" r="3"/>' +
      '<path class="s" d="M44 33V19c0-6 4-10 8-10s6 3 6 8v31"/><rect class="f" x="47" y="49" width="15" height="6" rx="1.5"/><path class="s" d="M54 42v7"/><rect class="d" x="12" y="31" width="9" height="4" rx="1"/>',
    'robot':
      '<circle class="f" cx="30" cy="36" r="22"/><circle class="d" cx="30" cy="36" r="15"/><rect class="f" x="21" y="32" width="18" height="9" rx="4.5"/><circle class="d" cx="26" cy="36.5" r="1.8"/><circle class="d" cx="34" cy="36.5" r="1.8"/>' +
      '<path class="s" d="M8 15a28 28 0 0 1 14-9M13 22a19 19 0 0 1 9-6"/><rect class="f" x="45" y="6" width="13" height="19" rx="3"/><circle class="d" cx="49" cy="12" r="1.5"/><circle class="d" cx="54" cy="12" r="1.5"/><circle class="d" cx="49" cy="18" r="1.5"/><circle class="d" cx="54" cy="18" r="1.5"/>',
    'stick':
      '<path class="f" d="M30 5h8c2 0 3 1 3 3v9c0 2-1 3-3 3h-8z"/><rect class="d" x="32" y="8" width="5" height="9" rx="1.5"/><rect class="f" x="33" y="20" width="4" height="30"/>' +
      '<path class="f" d="M20 52h28l5 6H15z"/><path class="s t" d="M24 55h20"/>',
    'heater':
      '<path class="s" d="M20 4c-4 3 3 5-1 9M32 4c-4 3 3 5-1 9M44 4c-4 3 3 5-1 9"/><rect class="f" x="9" y="17" width="46" height="36" rx="6"/>' +
      '<path class="dl" d="M19 24v22M27 24v22M35 24v22M43 24v22"/><path class="s" d="M14 58h8M42 58h8"/>',
    'dishwasher':
      '<rect class="f" x="9" y="5" width="46" height="54" rx="5"/><rect class="d" x="13" y="9" width="38" height="7" rx="2"/><circle class="f" cx="45" cy="12.5" r="1.8"/>' +
      '<rect class="d" x="13" y="20" width="38" height="35" rx="3"/><ellipse class="s t" cx="32" cy="29" rx="11" ry="3.2"/>' +
      '<path class="f" d="M19 40h11v8a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3z"/><path class="f" d="M35 40h13a6.5 6.5 0 0 1-13 0z"/>',
    'oven':
      '<rect class="f" x="7" y="9" width="50" height="46" rx="4"/><circle class="d" cx="19" cy="17" r="2.8"/><circle class="d" cx="32" cy="17" r="2.8"/><circle class="d" cx="45" cy="17" r="2.8"/>' +
      '<path class="s" d="M17 25h30"/><rect class="d" x="13" y="29" width="38" height="21" rx="2.5"/>' +
      '<path class="s t" d="M24 35c-3 2 3 3 0 6M32 35c-3 2 3 3 0 6M40 35c-3 2 3 3 0 6"/>',
    'ac-split':
      '<rect class="f" x="5" y="11" width="54" height="26" rx="5"/><path class="dl" d="M11 30h42M11 34h42"/><circle class="d" cx="48" cy="19" r="1.6"/><circle class="d" cx="53" cy="19" r="1.6"/><rect class="d" x="14" y="18" width="14" height="2.4" rx="1.2"/>' +
      '<path class="s" d="M20 43c-3 4 3 6 0 11M32 43c-3 4 3 6 0 11M44 43c-3 4 3 6 0 11"/>',
    'ac-tower':
      '<rect class="f" x="19" y="4" width="26" height="56" rx="6"/><rect class="d" x="23" y="8" width="18" height="14" rx="2"/><path class="s t" d="M26 12h12M26 16h12"/>' +
      '<ellipse class="d" cx="32" cy="29" rx="5.5" ry="2"/><path class="dl" d="M19 37h26M24 43h16M24 47h16M24 51h16M24 55h16"/>',
    'washer':
      '<rect class="f" x="9" y="4" width="46" height="56" rx="5"/><rect class="d" x="13" y="8" width="15" height="6" rx="2"/><circle class="d" cx="39" cy="11" r="2.6"/><circle class="d" cx="47" cy="11" r="2.6"/>' +
      '<path class="dl" d="M9 19h46"/><circle class="d" cx="32" cy="39" r="17"/><circle class="f" cx="32" cy="39" r="12"/><path class="s t" d="M24 36a9 9 0 0 1 8-6" opacity=".85"/>',
    'microwave':
      '<rect class="f" x="4" y="14" width="56" height="37" rx="5"/><rect class="d" x="9" y="19" width="33" height="27" rx="3"/><path class="dl" d="M46 19v27"/>' +
      '<circle class="d" cx="53" cy="27" r="4.2"/><path class="dl" d="M49 36h8M49 41h8"/><path class="s t" d="M14 25l8-3" opacity=".7"/>',
    'miniwash':
      '<rect class="f" x="12" y="9" width="40" height="48" rx="5"/><rect class="d" x="17" y="14" width="30" height="16" rx="3"/>' +
      '<path class="s t" d="M22 23c4-5 8 4 12 0s6 0 8-3"/><circle class="d" cx="22" cy="42" r="2.8"/><circle class="d" cx="32" cy="42" r="2.8"/><circle class="d" cx="42" cy="42" r="2.8"/><path class="dl" d="M18 50h28"/>',
    'fridge-bottom':
      '<rect class="f" x="15" y="4" width="34" height="56" rx="5"/><path class="dl" d="M15 24h34"/><rect class="d" x="21" y="9" width="3.4" height="10" rx="1.7"/><rect class="d" x="21" y="29" width="3.4" height="16" rx="1.7"/><path class="s t" d="M24 57h16" opacity=".7"/>',
    'fridge-side':
      '<rect class="f" x="7" y="4" width="50" height="56" rx="5"/><path class="dl" d="M30 4v56M30 30h27"/><rect class="d" x="12" y="19" width="13" height="16" rx="2.4"/><path class="s t" d="M15.5 25h6M15.5 29h6"/><rect class="d" x="34" y="14" width="3.4" height="9" rx="1.7"/><rect class="d" x="34" y="36" width="3.4" height="14" rx="1.7"/>',
    'appliance':
      '<rect class="f" x="9" y="9" width="46" height="46" rx="9"/><circle class="d" cx="32" cy="32" r="12"/><path class="s" d="M32 14v5M32 45v5M14 32h5M45 32h5M19 19l3.5 3.5M41.5 41.5L45 45M45 19l-3.5 3.5M22.5 41.5L19 45"/>'
  };
  M.PRODUCT_ICONS = Object.keys(P);
  M.PRODUCT_ICON_LABELS = {
    'tv': 'تلویزیون', 'vacuum': 'جاروبرقی', 'robot': 'جارو رباتیک', 'stick': 'جارو شارژی', 'heater': 'سولاردوم / بخاری',
    'dishwasher': 'ظرفشویی', 'oven': 'فر', 'ac-split': 'کولر دیواری', 'ac-tower': 'کولر ایستاده', 'washer': 'لباسشویی',
    'microwave': 'ماکروویو', 'miniwash': 'مینی واش', 'fridge-bottom': 'یخچال بالا پایین', 'fridge-side': 'یخچال ساید', 'appliance': 'عمومی'
  };
  M.productIcon = function (key, cls) {
    var body = P[key] || P.appliance;
    return '<svg class="pi ' + (cls || '') + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + body + '</svg>';
  };

  /* ---------- آیکون‌های رابط (viewBox 24×24، خطی) ---------- */
  var U = {
    'bag': '<path d="M6 8h12l1.2 12H4.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    'cart': '<path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
    'search': '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    'phone': '<path d="M5 4h3.5l1.8 4.6-2.3 1.4a11 11 0 0 0 6 6l1.4-2.3L20 15.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    'whatsapp': '<path d="M4 20l1.3-4.2A8.5 8.5 0 1 1 8.4 18.8z"/><path d="M9.2 8.8c-.3 2.8 3 6.2 6 6l1-1.4-2-1-.9.8a4.3 4.3 0 0 1-1.9-1.9l.8-.9-1-2z"/>',
    'pin': '<path d="M12 21s7-5.8 7-11a7 7 0 1 0-14 0c0 5.200 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2.2"/><path d="M3.5 7.5l8.500 6 8.500-6"/>',
    'shield': '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/>',
    'shield-check': '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/><path d="M8.500 12l2.500 2.500 4.500-5"/>',
    'wrench': '<path d="M14.500 6.200a4 4 0 0 0 4.900 4.900l.9-.9a6 6 0 0 1-8 8L6 21.500A2 2 0 0 1 3.500 19l3.300-6.300a6 6 0 0 1 8-8z" transform="translate(0 -1)"/>',
    'tools': '<path d="M14 7l3-3 3 3-3 3z"/><path d="M16 9L6 19l-2-2 10-10"/><circle cx="6" cy="6" r="3"/><path d="M8 8l3 3"/>',
    'gear': '<circle cx="12" cy="12" r="3"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M18.700 5.300l-2.100 2.100M7.400 16.600l-2.100 2.100"/>',
    'calendar': '<rect x="3.500" y="5" width="17" height="15" rx="2.200"/><path d="M3.500 10h17M8 3v4M16 3v4"/>',
    'check': '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
    'x': '<path d="M6 6l12 12M18 6L6 18"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'minus': '<path d="M5 12h14"/>',
    'trash': '<path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    'chevron-left': '<path d="M15 6l-6 6 6 6"/>',
    'chevron-right': '<path d="M9 6l6 6-6 6"/>',
    'menu': '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    'users': '<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20c0-3.500 3-5.500 6.500-5.500s6.500 2 6.500 5.500"/><path d="M16 4.800a3.500 3.500 0 0 1 0 6.400M18 14.800c2 .7 3.500 2.300 3.500 5.200"/>',
    'edit': '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
    'eye': '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'download': '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    'upload': '<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
    'bell': '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.500 2h-15z"/><path d="M10 21h4"/>',
    'home': '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    'box': '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    'message': '<path d="M4 5h16v11H9l-5 4z"/>',
    'star': '<path d="M12 3l2.800 5.800 6.200.9-4.500 4.400 1.100 6.200L12 17.300 6.400 20.300l1.100-6.200L3 9.700l6.200-.9z"/>',
    'truck': '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.500" r="1.800"/><circle cx="17" cy="17.500" r="1.800"/>',
    'headset': '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.500"/><rect x="17" y="14" width="4" height="6" rx="1.500"/><path d="M20 20c0 1.500-2 2-5 2"/>',
    'doc': '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    'sparkle': '<path d="M11 3l1.800 5.200L18 10l-5.200 1.800L11 17l-1.800-5.200L4 10l5.200-1.800z"/><path d="M18.500 15l.8 2.200 2.200.8-2.200.8-.8 2.200-.8-2.200-2.200-.8 2.200-.8z"/>',
    'tag': '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.500" cy="8.500" r="1.300"/>',
    'grid': '<rect x="4" y="4" width="7" height="7" rx="1.500"/><rect x="13" y="4" width="7" height="7" rx="1.500"/><rect x="4" y="13" width="7" height="7" rx="1.500"/><rect x="13" y="13" width="7" height="7" rx="1.500"/>',
    'list': '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.500" cy="6" r="1"/><circle cx="4.500" cy="12" r="1"/><circle cx="4.500" cy="18" r="1"/>',
    'sliders': '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    'logout': '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
    'lock': '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    'copy': '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    'chart': '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',
    'refresh': '<path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500v.5"/>',
    'alert': '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    'bolt': '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
    'instagram': '<rect x="4" y="4" width="16" height="16" rx="4.500"/><circle cx="12" cy="12" r="3.600"/><circle cx="16.800" cy="7.200" r=".6"/>',
    'telegram': '<path d="M21 4L3 11l6 2 2 6 3-4 4 3z"/><path d="M9 13l8-6"/>',
    'filter': '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
    'inbox': '<path d="M4 13l2-8h12l2 8v6H4z"/><path d="M4 13h5l1 2h4l1-2h5"/>',
    'print': '<path d="M7 9V4h10v5M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="6"/>',
    'save': '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    'database': '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.700 3 3 7 3s7-1.300 7-3V6M5 12v6c0 1.700 3 3 7 3s7-1.300 7-3v-6"/>',
    'up': '<path d="M7 14l5-5 5 5"/>',
    'down': '<path d="M7 10l5 5 5-5"/>',
    'dots': '<circle cx="5" cy="12" r="1.200"/><circle cx="12" cy="12" r="1.200"/><circle cx="19" cy="12" r="1.200"/>'
  };
  M.UI_ICONS = Object.keys(U);
  M.icon = function (name, cls) {
    var body = U[name] || U.info;
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  };

  /* ---------- لوگو: سپر طلایی با حرف M ---------- */
  var logoN = 0;
  M.logoMark = function (cls) {
    var id = 'lmG' + (++logoN);
    return '<svg class="logo-mark ' + (cls || '') + '" viewBox="0 0 64 72" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#fcc64c"/><stop offset="1" stop-color="#b9801a"/></linearGradient></defs>' +
      '<path d="M32 3L58 12v22c0 17-11 28-26 35C17 62 6 51 6 34V12z" fill="url(#' + id + ')"/>' +
      '<path d="M32 9.500L52 16.500v17.500c0 13.500-8.500 22.500-20 28-11.500-5.500-20-14.500-20-28V16.500z" fill="#031632"/>' +
      '<path d="M19 46V25.500l6.500-1.500L32 36l6.500-12 6.500 1.500V46h-5.200V31.500L32 44.500l-7.800-13V46z" fill="url(#' + id + ')"/>' +
      '</svg>';
  };

  /* ---------- جایگزینی خودکار: <i data-ic="cart"> و <span data-pi="tv"> ---------- */
  M.hydrateIcons = function (ctx) {
    M.$$('[data-ic]', ctx).forEach(function (el) {
      if (el.dataset.icDone) return;
      el.insertAdjacentHTML('afterbegin', M.icon(el.dataset.ic));
      el.dataset.icDone = '1';
    });
    M.$$('[data-pi]', ctx).forEach(function (el) {
      if (el.dataset.piDone) return;
      el.innerHTML = M.productIcon(el.dataset.pi);
      el.dataset.piDone = '1';
    });
    M.$$('[data-logo]', ctx).forEach(function (el) {
      if (el.dataset.logoDone) return;
      el.innerHTML = M.logoMark(); el.dataset.logoDone = '1';
    });
  };
})(window);
