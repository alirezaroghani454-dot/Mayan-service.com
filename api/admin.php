<?php
/* مایان سرویس — api/admin.php : API پنل مدیریت (نیازمند ورود)
   اقدام‌ها: me, login, logout, list, upsert, remove, get_site, save_site, change_password, export_all, import_all */
require_once __DIR__ . '/helpers.php';
ensure_dirs();
$action = $_GET['action'] ?? '';

if ($action === 'me') {
    start_session(); $auth = load_auth();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
    json_out(['ok' => true, 'auth' => !empty($_SESSION['mayan_ok']), 'csrf' => !empty($_SESSION['mayan_ok']) ? $_SESSION['csrf'] : '', 'mustChange' => !empty($_SESSION['mayan_ok']) && !empty($auth['must_change'])]);
}

if ($action === 'login') {
    require_method('POST'); start_session();
    rate_limit('login', 8, 900, false);
    $in = body_json(4096); $auth = load_auth();
    if (!password_verify((string)($in['password'] ?? ''), $auth['hash'])) {
        rate_fail_hit('login', 900); usleep(400000); fail('رمز عبور نادرست است', 401);
    }
    rate_reset('login'); session_regenerate_id(true);
    $_SESSION['mayan_ok'] = true; $_SESSION['csrf'] = bin2hex(random_bytes(16));
    json_out(['ok' => true, 'csrf' => $_SESSION['csrf'], 'mustChange' => !empty($auth['must_change'])]);
}

if ($action === 'logout') {
    require_method('POST'); start_session(); $_SESSION = []; session_destroy(); json_out(['ok' => true]);
}

/* ---- از اینجا به بعد: فقط مدیر وارد‌شده ---- */
$isPost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
require_admin($isPost);

if ($action === 'list') {
    $col = $_GET['col'] ?? 'all';
    if ($col === 'all') { $out = []; foreach (COLLECTIONS as $c) $out[$c] = col_read($c); json_out(['ok' => true, 'data' => $out]); }
    json_out(['ok' => true, 'data' => col_read($col)]);
}

if ($action === 'upsert') {
    require_method('POST'); $in = body_json(65536);
    $col = (string)($in['col'] ?? ''); $item = $in['item'] ?? null; col_file($col);
    if (!is_array($item) || !preg_match('/^[A-Za-z0-9_\-]{1,40}$/', (string)($item['id'] ?? ''))) fail('شناسه نامعتبر است');
    if (strlen(json_encode($item)) > 20000) fail('رکورد بیش از حد بزرگ است');
    with_lock(function () use ($col, $item) {
        $list = col_read($col); $found = false;
        foreach ($list as $i => $r) { if (($r['id'] ?? '') === $item['id']) { $list[$i] = array_merge($r, $item); $found = true; break; } }
        if (!$found) array_unshift($list, $item);
        write_json(col_file($col), $list);
    });
    json_out(['ok' => true]);
}

if ($action === 'remove') {
    require_method('POST'); $in = body_json(4096); $col = (string)($in['col'] ?? ''); $id = (string)($in['id'] ?? ''); col_file($col);
    with_lock(function () use ($col, $id) {
        $list = array_values(array_filter(col_read($col), fn($r) => ($r['id'] ?? '') !== $id));
        write_json(col_file($col), $list);
    });
    json_out(['ok' => true]);
}

if ($action === 'get_site') { json_out(['ok' => true, 'data' => site_data()]); }

function save_site_data(array $d): void {
    if (empty($d['settings']) || !is_array($d['products'] ?? null)) fail('ساختار داده نامعتبر است');
    foreach ($d['products'] as $p) { if (empty($p['id']) || !isset($p['name']) || !is_numeric($p['price'] ?? null)) fail('یکی از محصولات ناقص است'); }
    unset($d['warranties']);
    with_lock(function () use ($d) {
        if (is_file(SITE_JSON)) {
            $bk = PRIVATE_DIR . '/backups'; if (!is_dir($bk)) @mkdir($bk, 0755, true);
            @copy(SITE_JSON, $bk . '/site-' . date('Ymd-His') . '.json');
            $files = glob($bk . '/site-*.json') ?: []; sort($files);
            while (count($files) > 15) @unlink(array_shift($files));
        }
        if (!write_json(SITE_JSON, $d)) fail('ذخیره‌سازی ممکن نشد؛ دسترسی نوشتن پوشه data را بررسی کنید.', 500);
    });
}
if ($action === 'save_site') { require_method('POST'); $in = body_json(2 * 1024 * 1024); save_site_data($in['data'] ?? []); json_out(['ok' => true]); }

if ($action === 'change_password') {
    require_method('POST'); $in = body_json(4096); $auth = load_auth();
    if (!password_verify((string)($in['current'] ?? ''), $auth['hash'])) fail('رمز فعلی نادرست است', 401);
    $new = (string)($in['next'] ?? '');
    if (mb_strlen($new) < 8) fail('رمز جدید باید حداقل ۸ نویسه باشد');
    if ($new === DEFAULT_ADMIN_PASSWORD) fail('رمز جدید نباید همان رمز پیش‌فرض باشد');
    with_lock(function () use ($new) { write_json(PRIVATE_DIR . '/auth.json', ['hash' => password_hash($new, PASSWORD_DEFAULT), 'must_change' => false, 'updated' => date('c')]); });
    session_regenerate_id(true); json_out(['ok' => true]);
}

if ($action === 'export_all') {
    $out = ['site' => site_data()]; foreach (COLLECTIONS as $c) $out[$c] = col_read($c);
    json_out(['ok' => true, 'data' => $out]);
}

if ($action === 'import_all') {
    require_method('POST'); $in = body_json(8 * 1024 * 1024); $d = $in['data'] ?? [];
    if (!empty($d['site'])) save_site_data($d['site']);
    foreach (COLLECTIONS as $c) {
        if (isset($d[$c]) && is_array($d[$c])) with_lock(function () use ($c, $d) { write_json(col_file($c), array_values($d[$c])); });
    }
    json_out(['ok' => true]);
}
fail('اقدام نامعتبر است', 404);
