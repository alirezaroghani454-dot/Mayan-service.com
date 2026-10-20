/* ==========================================================================
   مایان سرویس — js/modules/forms.js
   اعتبارسنجی فرم‌ها، استعلام گارانتی / پیگیری، فرم درخواست خدمات، فرم تماس
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan, $ = M.$, $$ = M.$$, esc = M.esc;
  var F = M.forms = { mode: 'warranty' };

  /* ---------- ابزارهای مشترک ---------- */
  F.busy = function (btn, on) {
    if (!btn) return; btn.disabled = !!on; btn.classList.toggle('is-busy', !!on);
    var s = $('span', btn); if (s) { if (on) { btn.dataset.t = s.textContent; s.textContent = 'در حال ارسال…'; } else if (btn.dataset.t) s.textContent = btn.dataset.t; }
  };
  F.validate = function (form) {
    var ok = true, first = null;
    $$('.field', form).forEach(function (fld) {
      var inp = $('input,select,textarea', fld); if (!inp || inp.classList.contains('hp-field')) return;
      var v = inp.value.trim(), bad = false;
      if (inp.required && !v) bad = true;
      else if (inp.type === 'tel' && v && !M.isMobile(v)) bad = true;
      else if (inp.minLength > 0 && v && v.length < inp.minLength) bad = true;
      fld.classList.toggle('invalid', bad);
      if (bad) { ok = false; if (!first) first = inp; }
    });
    if (first) { first.focus(); }
    return ok;
  };
  function clearOnInput(form) {
    form.addEventListener('input', function (e) { var f = e.target.closest('.field'); if (f) f.classList.remove('invalid'); });
  }
  function value(form, name) { var el = form.elements[name]; return el ? String(el.value).trim() : ''; }

  /* ---------- پاسخ موفق (فرم‌های درخواست و تماس) ---------- */
  function successBox(code, text, waText) {
    var s = M.store.data.settings, wa = (s.whatsapp && waText) ? M.waLink(s.whatsapp, waText.replace('{CODE}', code)) : '';
    return '<div class="success-box"><div class="tick">' + M.icon('check') + '</div><h3>' + esc(text) + '</h3>' +
      '<p class="muted">کد پیگیری شما:</p><div class="code-box"><span class="num">' + esc(code) + '</span></div>' +
      '<div style="display:flex;gap:.7rem;justify-content:center;flex-wrap:wrap">' +
      (wa ? '<a class="btn btn-outline" href="' + esc(wa) + '" target="_blank" rel="noopener">' + M.icon('whatsapp') + ' ارسال در واتساپ</a>' : '') +
      '<button class="btn btn-ghost" type="button" data-track="' + esc(code) + '">' + M.icon('search') + ' پیگیری</button></div></div>';
  }

  /* ---------- درخواست خدمات ---------- */
  F.initRequest = function () {
    var form = $('#requestForm'), box = $('#requestResult'); clearOnInput(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!F.validate(form)) return;
      if (value(form, 'website')) return;
      var btn = $('#rqSubmit'); F.busy(btn, true);
      var p = { kind: value(form, 'type'), device: value(form, 'device'), brand: value(form, 'brand'), model: value(form, 'model'), serial: value(form, 'serial'),
        problem: value(form, 'problem'), name: value(form, 'name'), mobile: M.normMobile(value(form, 'mobile')), city: value(form, 'city'),
        address: value(form, 'address'), preferred: value(form, 'preferred'), website: '' };
      M.store.submit('service', p).then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.error) || 'خطا در ثبت');
        form.hidden = true; box.innerHTML = successBox(r.code, 'درخواست شما ثبت شد',
          'سلام، درخواست ' + p.kind + ' با کد {CODE} ثبت شد.\nنام: ' + p.name + '\nدستگاه: ' + p.device + (p.brand ? ' ' + p.brand : '') + '\nمشکل: ' + p.problem);
        box.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }).catch(function (err) { F.busy(btn, false); M.toast(err.message || 'ارسال انجام نشد؛ دوباره تلاش کنید.', 'error'); });
    });
  };

  /* ---------- تماس ---------- */
  F.initContact = function () {
    var form = $('#contactForm'), box = $('#contactResult'); clearOnInput(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!F.validate(form)) return;
      if (value(form, 'website')) return;
      var btn = $('#ctSubmit'); F.busy(btn, true);
      var mob = value(form, 'mobile');
      M.store.submit('message', { name: value(form, 'name'), mobile: mob ? M.normMobile(mob) : '', subject: value(form, 'subject'), text: value(form, 'text'), website: '' })
        .then(function (r) {
          if (!r || !r.ok) throw new Error((r && r.error) || 'خطا در ارسال');
          form.hidden = true; box.innerHTML = '<div class="form-ok"><b>پیام شما ارسال شد.</b><br>به‌زودی پاسخ می‌دهیم. سپاس از شما.</div>';
        }).catch(function (err) { F.busy(btn, false); M.toast(err.message || 'ارسال انجام نشد.', 'error'); });
    });
  };

  /* ---------- استعلام گارانتی / پیگیری ---------- */
  var CFG = {
    warranty: { label: 'کد گارانتی یا شماره سریال', ph: 'مثلاً DEMO-1234', icon: 'shield-check', btn: 'استعلام کنید' },
    track:    { label: 'کد پیگیری سفارش یا درخواست', ph: 'مثلاً ORD-XXXXXX یا SRV-XXXXXX', icon: 'doc', btn: 'پیگیری کنید' }
  };
  F.setMode = function (mode) {
    F.mode = mode; var c = CFG[mode];
    $$('.tab').forEach(function (t) { var on = t.dataset.mode === mode; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
    $('#inqLabel').textContent = c.label; $('#inqInput').placeholder = c.ph; $('#inqInput').value = '';
    $('#inqSubmit span').textContent = c.btn; $('.inq-input-wrap .ic').outerHTML = M.icon(c.icon);
    $('#inqResult').innerHTML = '';
    $('#demoHint').hidden = !(mode === 'warranty' && M.store.data.settings.showDemoHint);
  };
  F.prefillTrack = function (code) {
    F.setMode('track'); $('#inqInput').value = code; $('#inquiryForm').requestSubmit ? $('#inquiryForm').requestSubmit() : $('#inquiryForm').dispatchEvent(new Event('submit', { cancelable: true }));
  };

  function renderWarranty(w) {
    var st = M.warrantyState(w), tone = { active: 'ok', expired: 'bad', void: 'bad', pending: 'warn' }[st.state];
    var note = w.note ? '<p class="res-note">' + esc(w.note) + '</p>' : '';
    var meter = (st.state === 'active' || st.state === 'expired') ?
      '<div class="meter" id="resMeter"><i></i></div><div class="meter-label"><span>' + M.toFa(st.percentUsed) + '٪ از دوره سپری شده</span><span>' +
      (st.state === 'active' ? M.toFa(st.daysLeft) + ' روز مانده' : 'پایان یافته') + '</span></div>' : '';
    $('#inqResult').innerHTML = '<div class="res-card"><div class="res-head"><h4>نتیجه استعلام گارانتی</h4><span class="status status-' + tone + '">' + M.WARRANTY_LABELS[st.state] + '</span></div>' +
      '<div class="res-grid"><div><small>محصول</small><b>' + esc(w.product) + '</b></div><div><small>کد گارانتی</small><b dir="ltr">' + esc(w.code) + '</b></div>' +
      '<div><small>مشتری</small><b>' + esc(w.customerMasked || '—') + '</b></div><div><small>مدت گارانتی</small><b>' + M.toFa(w.months) + ' ماه</b></div>' +
      '<div><small>تاریخ شروع</small><b>' + M.jalali.format(w.start) + '</b></div><div><small>تاریخ پایان</small><b>' + M.jalali.format(st.end) + '</b></div></div>' + meter + note + '</div>';
    var m = $('#resMeter'); if (m) requestAnimationFrame(function () { requestAnimationFrame(function () { m.style.setProperty('--w', st.percentUsed + '%'); }); });
  }

  function renderTrack(t) {
    var s = M.STATUS[t.status] || M.STATUS['new'], steps = ['new', 'review', 'progress', 'done'], idx = steps.indexOf(t.status);
    var labels = ['ثبت شد', 'در حال بررسی', 'در حال انجام', 'تکمیل شد'];
    var tl = t.status === 'canceled' ? '' : '<div class="track-steps">' + labels.map(function (l, i) { return '<div class="' + (i <= idx ? 'on' : '') + '"><i></i>' + l + '</div>'; }).join('') + '</div>';
    $('#inqResult').innerHTML = '<div class="res-card"><div class="res-head"><h4>' + esc(t.title) + '</h4><span class="status status-' + s.tone + '">' + s.label + '</span></div>' +
      '<div class="res-grid"><div><small>کد پیگیری</small><b dir="ltr">' + esc(t.code) + '</b></div><div><small>تاریخ ثبت</small><b>' + M.jalali.format(String(t.createdAt).slice(0, 10)) + '</b></div>' +
      '<div style="grid-column:1/-1"><small>جزئیات</small><b>' + (t.lines || []).map(function (l) { return esc(M.toFa(l)); }).join('<br>') + '</b></div>' +
      (t.total ? '<div><small>مبلغ</small><b>' + M.fmtPrice(t.total) + ' تومان</b></div>' : '') + '</div>' + tl +
      (t.publicNote ? '<p class="res-note">' + esc(t.publicNote) + '</p>' : '') + '</div>';
  }

  F.initInquiry = function () {
    var form = $('#inquiryForm');
    $$('.tab').forEach(function (t) { t.addEventListener('click', function () { F.setMode(t.dataset.mode); }); });
    $('#demoFill').addEventListener('click', function () { $('#inqInput').value = 'DEMO-1234'; $('#inqInput').focus(); });
    $('#demoHint').hidden = !M.store.data.settings.showDemoHint;
    form.addEventListener('input', function () { $('.field', form).classList.remove('invalid'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = $('#inqInput').value.trim(), fld = $('.field', form);
      if (q.length < 3) { fld.classList.add('invalid'); $('#inqInput').focus(); return; }
      var btn = $('#inqSubmit'); F.busy(btn, true);
      var call = F.mode === 'warranty' ? M.store.warrantyLookup(q) : M.store.trackLookup(q);
      call.then(function (r) {
        F.busy(btn, false);
        if (r && r.ok && r.found) { F.mode === 'warranty' ? renderWarranty(r.warranty) : renderTrack(r.track); }
        else if (r && r.ok) $('#inqResult').innerHTML = '<div class="res-empty"><b>موردی پیدا نشد.</b><br>کد را دوباره بررسی کنید یا با پشتیبانی تماس بگیرید.</div>';
        else throw new Error((r && r.error) || 'خطا');
      }).catch(function (err) { F.busy(btn, false); M.toast(err.message === 'HTTP 429' ? 'تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.' : 'ارتباط با سرور برقرار نشد.', 'error'); });
    });
    // دکمه‌ی «پیگیری» در پاسخ فرم‌ها
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-track]'); if (!b) return;
      var sec = $('#inquiry'); sec.scrollIntoView({ behavior: 'smooth' }); setTimeout(function () { F.prefillTrack(b.dataset.track); }, 500);
    });
  };

  F.init = function () { F.initInquiry(); F.initRequest(); F.initContact(); };
})(window);
