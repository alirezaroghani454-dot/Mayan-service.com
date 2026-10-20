<?php
/* مایان سرویس — api/submit.php : ثبت سفارش گارانتی، درخواست خدمات و پیام تماس */
require_once __DIR__ . '/helpers.php';
require_method('POST');
$in = body_json(65536);
$kind = $in['kind'] ?? '';
$p = is_array($in['payload'] ?? null) ? $in['payload'] : [];

if (!empty($p['website'])) json_out(['ok' => true, 'code' => 'OK-000000']);      // تله‌ی ربات (honeypot)
rate_limit('submit', MAX_SUBMITS_PER_HOUR, 3600);

function need_mobile($v): string {
    $m = norm_mobile(clean($v, 20));
    if (!preg_match('/^09\d{9}$/', $m)) fail('شماره موبایل معتبر نیست');
    return $m;
}

$now = date('c');
if ($kind === 'order') {
    $c = is_array($p['customer'] ?? null) ? $p['customer'] : [];
    $name = clean($c['name'] ?? '', 80);
    if (mb_strlen($name) < 2) fail('نام را وارد کنید');
    $customer = ['name' => $name, 'mobile' => need_mobile($c['mobile'] ?? ''), 'city' => clean($c['city'] ?? '', 60),
                 'address' => clean($c['address'] ?? '', 400), 'notes' => clean($c['notes'] ?? '', 600)];
    $site = site_data();
    if (!$site || empty($site['products'])) fail('فهرست محصولات هنوز تنظیم نشده است', 500);
    $byId = [];
    foreach ($site['products'] as $pr) { if (!empty($pr['id'])) $byId[$pr['id']] = $pr; }
    $items = []; $total = 0;
    foreach (array_slice((array)($p['items'] ?? []), 0, 30) as $it) {
        $id = is_array($it) ? (string)($it['id'] ?? '') : '';
        if (!isset($byId[$id]) || ($byId[$id]['active'] ?? true) === false) continue;
        $q = max(1, min(20, (int)($it['qty'] ?? 1)));
        $price = (int)round((float)$byId[$id]['price']);
        $items[] = ['id' => $id, 'name' => clean($byId[$id]['name'], 160), 'price' => $price, 'qty' => $q];
        $total += $price * $q;
    }
    if (!$items) fail('سبد خالی است');
    $code = with_lock(function () use ($customer, $items, $total, $now) {
        $list = col_read('orders'); $code = new_code('ORD', $list);
        array_unshift($list, ['id' => $code, 'type' => 'order', 'status' => 'new', 'createdAt' => $now, 'customer' => $customer,
                              'items' => $items, 'total' => $total, 'adminNote' => '', 'publicNote' => '']);
        write_json(col_file('orders'), $list); return $code;
    });
    json_out(['ok' => true, 'code' => $code]);
}

if ($kind === 'service') {
    $rec = ['kind' => clean($p['kind'] ?? 'تعمیر', 40), 'device' => clean($p['device'] ?? '', 80), 'brand' => clean($p['brand'] ?? '', 60),
            'model' => clean($p['model'] ?? '', 60), 'serial' => clean($p['serial'] ?? '', 60), 'problem' => clean($p['problem'] ?? '', 1000),
            'name' => clean($p['name'] ?? '', 80), 'mobile' => need_mobile($p['mobile'] ?? ''), 'city' => clean($p['city'] ?? '', 60),
            'address' => clean($p['address'] ?? '', 400), 'preferred' => clean($p['preferred'] ?? '', 30)];
    if (mb_strlen($rec['problem']) < 5) fail('توضیح مشکل را بنویسید');
    if (mb_strlen($rec['name']) < 2) fail('نام را وارد کنید');
    $code = with_lock(function () use ($rec, $now) {
        $list = col_read('services'); $code = new_code('SRV', $list);
        array_unshift($list, array_merge(['id' => $code, 'type' => 'service', 'status' => 'new', 'createdAt' => $now, 'adminNote' => '', 'publicNote' => ''], $rec));
        write_json(col_file('services'), $list); return $code;
    });
    json_out(['ok' => true, 'code' => $code]);
}

if ($kind === 'message') {
    $mob = clean($p['mobile'] ?? '', 20);
    $rec = ['name' => clean($p['name'] ?? '', 80), 'mobile' => $mob !== '' ? need_mobile($mob) : '', 'subject' => clean($p['subject'] ?? '', 120), 'text' => clean($p['text'] ?? '', 1500)];
    if (mb_strlen($rec['name']) < 2 || mb_strlen($rec['text']) < 5) fail('نام و پیام را کامل وارد کنید');
    $code = with_lock(function () use ($rec, $now) {
        $list = col_read('messages'); $code = new_code('MSG', $list);
        array_unshift($list, array_merge(['id' => $code, 'type' => 'message', 'status' => 'new', 'read' => false, 'createdAt' => $now], $rec));
        write_json(col_file('messages'), $list); return $code;
    });
    json_out(['ok' => true, 'code' => $code]);
}
fail('نوع درخواست نامعتبر است');
