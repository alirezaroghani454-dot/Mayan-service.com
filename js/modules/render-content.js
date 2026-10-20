/* ==========================================================================
   مایان سرویس — js/modules/render-content.js
   ساخت محتوای صفحه از روی داده‌ها (تنظیمات، خدمات، مراحل، سوالات، تماس، فوتر)
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan, $ = M.$, $$ = M.$$, esc = M.esc;
  var R = M.render = {};

  /* فقط لینک‌های امن (#، http، https، tel، mailto) */
  function safeHref(h) {
    h = String(h || '').trim();
    return /^(#|https?:\/\/|tel:|mailto:)/i.test(h) ? h : '#';
  }
  function setText(sel, txt) { $$(sel).forEach(function (el) { el.textContent = txt; }); }
  function social(v, base) {
    v = String(v || '').trim(); if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    return base + v.replace(/^@/, '').replace(/^\/+/, '');
  }
  function pad2(n) { return M.toFa(n < 10 ? '0' + n : n); }

  /* ---------- تنظیمات عمومی ---------- */
  R.settings = function (d) {
    var s = d.settings;
    setText('.js-brand', s.brandName || 'مایان سرویس');
    setText('.js-brand-latin', String(s.brandLatin || 'Mayan Service').toUpperCase());
    setText('.js-manager', s.manager || '');
    document.title = (s.brandName || 'مایان سرویس') + ' | ' + (s.slogan || 'خدمات پس از فروش و گارانتی');
    setText('#heroEyebrow', s.heroEyebrow || '');
    setText('#heroTitleTop', s.heroTitleTop || s.brandName);
    setText('#heroTitleMain', s.heroTitleMain || s.slogan);
    setText('#heroLead', s.heroLead || '');
    setText('#footYear', M.toFa(M.jalali.currentYear()));
    $('#footerAbout').textContent = (s.brandName || 'مایان سرویس') + (s.manager ? ' با مدیریت ' + s.manager : '') + '، ارائه‌دهنده خدمات پس از فروش و ثبت گارانتی لوازم خانگی است.';
    setText('#reviewsTitle', s.reviewsTitle || 'نظر مشتریان');

    // نوار اعلان
    var bar = $('#announceBar');
    if (s.announce) { bar.textContent = s.announce; bar.hidden = false; root.document.documentElement.style.setProperty('--announce-h', bar.offsetHeight + 'px'); }
    else { bar.hidden = true; root.document.documentElement.style.setProperty('--announce-h', '0px'); }

    // واتساپ
    var wa = s.whatsapp ? M.waLink(s.whatsapp, 'سلام، از طریق سایت ' + (s.brandName || '') + ' پیام می‌دهم.') : '';
    $$('.js-wa-link').forEach(function (a) {
      if (wa) { a.href = wa; a.hidden = false; } else { a.hidden = true; }
    });
    $('.fab-wa').hidden = !wa;

    // اطلاعات تماس
    var rows = [];
    if (s.phone)  rows.push({ ic: 'phone',    label: 'تلفن',       val: M.toFa(s.phone),  href: M.telLink(s.phone), ltr: true });
    if (s.mobile) rows.push({ ic: 'phone',    label: 'موبایل',     val: M.toFa(s.mobile), href: M.telLink(s.mobile), ltr: true });
    if (s.whatsapp) rows.push({ ic: 'whatsapp', label: 'واتساپ',   val: M.toFa(s.whatsapp), href: M.waLink(s.whatsapp), ltr: true, ext: true });
    if (s.email)  rows.push({ ic: 'mail',     label: 'ایمیل',      val: s.email,          href: 'mailto:' + s.email, ltr: true });
    if (s.address) rows.push({ ic: 'pin',     label: 'نشانی',      val: s.address,        href: s.mapUrl ? safeHref(s.mapUrl) : '', ext: !!s.mapUrl });
    if (s.hours)  rows.push({ ic: 'clock',    label: 'ساعت کاری',  val: s.hours,          href: '' });

    $('#contactInfo').innerHTML = rows.map(function (r, i) {
      var tag = r.href ? 'a' : 'div';
      return '<' + tag + ' class="info-card glass" data-reveal="right" style="--d:' + (i * 0.07).toFixed(2) + 's"' +
        (r.href ? ' href="' + esc(r.href) + '"' + (r.ext ? ' target="_blank" rel="noopener"' : '') : '') + '>' +
        '<span class="info-ic">' + M.icon(r.ic) + '</span><span><small>' + esc(r.label) + '</small><b' + (r.ltr ? ' dir="ltr" style="unicode-bidi:plaintext"' : '') + '>' + esc(r.val) + '</b></span></' + tag + '>';
    }).join('');

    $('#footerContact').innerHTML = rows.filter(function (r) { return r.label !== 'واتساپ'; }).map(function (r) {
      return '<li>' + M.icon(r.ic) + '<span>' + esc(r.val) + '</span></li>';
    }).join('');

    // شبکه‌های اجتماعی
    var links = [];
    var ig = social(s.instagram, 'https://instagram.com/'), tg = social(s.telegram, 'https://t.me/');
    if (ig) links.push('<a href="' + esc(ig) + '" target="_blank" rel="noopener" aria-label="اینستاگرام">' + M.icon('instagram') + '</a>');
    if (tg) links.push('<a href="' + esc(tg) + '" target="_blank" rel="noopener" aria-label="تلگرام">' + M.icon('telegram') + '</a>');
    if (wa) links.push('<a href="' + esc(wa) + '" target="_blank" rel="noopener" aria-label="واتساپ">' + M.icon('whatsapp') + '</a>');
    $('#socialLinks').innerHTML = links.join('');
  };

  /* ---------- آمار ---------- */
  R.stats = function (d) {
    var active = d.products.filter(function (p) { return p.active !== false; }).length;
    $('#statsRow').innerHTML = d.stats.map(function (st, i) {
      var v = st.auto === 'products' ? active : st.auto === 'categories' ? d.categories.length : (Number(st.value) || 0);
      return '<div class="stat glass" data-reveal="up" style="--d:' + (i * 0.1).toFixed(2) + 's">' +
        '<strong class="gold-text num" data-count="' + v + '" data-suffix="' + esc(st.suffix || '') + '">' + M.toFa(v) + esc(st.suffix || '') + '</strong>' +
        '<span>' + esc(st.label) + '</span></div>';
    }).join('');
  };

  /* ---------- خدمات ---------- */
  R.services = function (d) {
    $('#servicesGrid').innerHTML = d.services.map(function (s, i) {
      return '<article class="svc-card glass" data-tilt="9" data-reveal="up" style="--d:' + ((i % 3) * 0.1).toFixed(2) + 's">' +
        '<span class="num-mark">' + pad2(i + 1) + '</span>' +
        '<div class="svc-ic">' + M.icon(s.icon || 'sparkle') + '</div>' +
        '<h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p>' +
        (s.cta ? '<a class="svc-link" href="' + esc(safeHref(s.link)) + '">' + esc(s.cta) + M.icon('arrow-left') + '</a>' : '') +
        '</article>';
    }).join('');
  };

  /* ---------- نوار متحرک ---------- */
  R.marquee = function (d) {
    var words = d.services.map(function (s) { return s.title; }).concat(d.categories.map(function (c) { return c.name; }));
    var one = words.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('');
    $('#marqueeTrack').innerHTML = one + one + one + one;
  };

  /* ---------- مراحل / ویژگی‌ها ---------- */
  R.steps = function (d) {
    $('#stepsList').innerHTML = d.steps.map(function (s, i) {
      return '<div class="step" data-reveal="up" style="--d:' + (i * 0.12).toFixed(2) + 's"><div class="step-num">' + M.toFa(i + 1) + '</div><div><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div></div>';
    }).join('');
  };
  R.features = function (d) {
    $('#featGrid').innerHTML = d.features.map(function (f, i) {
      return '<div class="feat glass" data-tilt="6" data-reveal="up" style="--d:' + ((i % 3) * 0.1).toFixed(2) + 's"><span class="fi">' + M.icon(f.icon || 'star') + '</span><div><h3>' + esc(f.title) + '</h3><p>' + esc(f.text) + '</p></div></div>';
    }).join('');
  };

  /* ---------- نظرات (بخش فقط وقتی نظری وجود دارد نمایش داده می‌شود) ---------- */
  R.reviews = function (d) {
    var sec = $('#reviews'), list = (d.reviews || []).filter(function (r) { return r && r.text; });
    sec.hidden = list.length === 0;
    $('#revGrid').innerHTML = list.map(function (r, i) {
      var n = M.clamp(parseInt(r.stars, 10) || 5, 1, 5);
      return '<div class="rev glass" data-reveal="up" style="--d:' + ((i % 3) * 0.1).toFixed(2) + 's"><div class="stars" aria-label="' + M.toFa(n) + ' ستاره">' + '★'.repeat(n) + '☆'.repeat(5 - n) + '</div><p>' + esc(r.text) + '</p>' +
        '<div class="who"><i>' + esc(String(r.name || '؟').charAt(0)) + '</i><span>' + esc(r.name || '') + '<small>' + esc(r.role || '') + '</small></span></div></div>';
    }).join('');
  };

  /* ---------- سوالات متداول ---------- */
  R.faq = function (d) {
    $('#faqList').innerHTML = d.faq.map(function (f, i) {
      return '<div class="faq-item glass" data-reveal="up" style="--d:' + (Math.min(i, 5) * 0.06).toFixed(2) + 's">' +
        '<button class="faq-q" type="button" aria-expanded="false" aria-controls="faqa' + i + '"><span>' + esc(f.q) + '</span>' + M.icon('chevron-down') + '</button>' +
        '<div class="faq-a" id="faqa' + i + '" role="region"><div><p>' + esc(f.a) + '</p></div></div></div>';
    }).join('');
  };

  /* ---------- انتخاب نوع دستگاه در فرم درخواست خدمات ---------- */
  R.deviceSelect = function (d) {
    var opts = d.categories.map(function (c) { return '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>'; });
    opts.push('<option value="سایر">سایر</option>');
    $('#rqDevice').innerHTML = opts.join('');
  };

  /* ---------- چرخه‌ی کامل ---------- */
  R.all = function (d) {
    R.settings(d); R.stats(d); R.services(d); R.marquee(d); R.steps(d); R.features(d);
    R.reviews(d); R.faq(d); R.deviceSelect(d);

    // ترسیم چرخ‌دنده‌ی تزئینی (SVG)
    var gp = $('#gearPath');
    if (gp) {
      var N = 12, Ro = 46, Ri = 36, pts = [];
      for (var i = 0; i < N; i++) {
        var a = i / N * Math.PI * 2, w = Math.PI * 2 / N;
        [[-0.46, Ri], [-0.28, Ro], [0.28, Ro], [0.46, Ri]].forEach(function (t) {
          pts.push((Math.cos(a + t[0] * w) * t[1]).toFixed(2) + ' ' + (Math.sin(a + t[0] * w) * t[1]).toFixed(2));
        });
      }
      gp.setAttribute('d', 'M' + pts.join('L') + 'Z');
    }
    M.hydrateIcons(document);
  };

  /* ---------- رفتار آکاردئون سوالات ---------- */
  R.bindFaq = function () {
    var list = $('#faqList');
    list.addEventListener('click', function (e) {
      var q = e.target.closest('.faq-q'); if (!q) return;
      var item = q.parentNode, open = !item.classList.contains('open');
      $$('.faq-item.open', list).forEach(function (it) { if (it !== item) { it.classList.remove('open'); it.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); } });
      item.classList.toggle('open', open);
      q.setAttribute('aria-expanded', String(open));
    });
  };
})(window);
