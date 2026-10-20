<?php
/* مایان سرویس — api/inquiry.php : استعلام گارانتی و پیگیری سفارش (فقط با کد دقیق؛ بدون افشای اطلاعات شخصی) */
require_once __DIR__ . '/helpers.php';
require_method('GET');
rate_limit('inquiry', MAX_INQUIRIES_PER_HOUR, 3600);

$type = $_GET['type'] ?? '';
$q = strtoupper(preg_replace('/\s+/', '', norm_digits(clean($_GET['q'] ?? '', 60))) ?? '');
if (strlen($q) < 3) json_out(['ok' => true, 'found' => false]);

function mask_name(string $n): string {
    $parts = preg_split('/\s+/u', trim($n)) ?: [];
    return implode(' ', array_map(fn($p) => mb_substr($p, 0, 1) . '•••', array_filter($parts)));
}

if ($type === 'warranty') {
    foreach (col_read('warranties') as $w) {
        $serial = strtoupper(preg_replace('/\s+/', '', (string)($w['serial'] ?? '')) ?? '');
        if (strtoupper((string)($w['code'] ?? '')) === $q || ($serial !== '' && $serial === $q)) {
            json_out(['ok' => true, 'found' => true, 'warranty' => [
                'code' => $w['code'], 'product' => $w['product'] ?? '', 'start' => $w['start'] ?? '', 'months' => (int)($w['months'] ?? 0),
                'status' => $w['status'] ?? 'active', 'customerMasked' => mask_name((string)($w['customer'] ?? '')), 'note' => $w['publicNote'] ?? '']]);
        }
    }
    json_out(['ok' => true, 'found' => false]);
}

if ($type === 'track') {
    foreach (col_read('orders') as $r) {
        if (strtoupper((string)$r['id']) === $q) {
            json_out(['ok' => true, 'found' => true, 'track' => ['type' => 'order', 'code' => $r['id'], 'status' => $r['status'], 'createdAt' => $r['createdAt'],
                'title' => 'سفارش ثبت گارانتی', 'lines' => array_map(fn($i) => $i['name'] . ' × ' . $i['qty'], $r['items'] ?? []),
                'total' => (int)($r['total'] ?? 0), 'publicNote' => $r['publicNote'] ?? '']]);
        }
    }
    foreach (col_read('services') as $r) {
        if (strtoupper((string)$r['id']) === $q) {
            json_out(['ok' => true, 'found' => true, 'track' => ['type' => 'service', 'code' => $r['id'], 'status' => $r['status'], 'createdAt' => $r['createdAt'],
                'title' => 'درخواست ' . ($r['kind'] ?? 'خدمات'), 'lines' => [trim(implode(' — ', array_filter([$r['device'] ?? '', $r['brand'] ?? '', $r['model'] ?? ''])))],
                'total' => 0, 'publicNote' => $r['publicNote'] ?? '']]);
        }
    }
    json_out(['ok' => true, 'found' => false]);
}
fail('نوع استعلام نامعتبر است');
