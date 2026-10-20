<?php
/* مایان سرویس — api/helpers.php : توابع مشترک API */
declare(strict_types=1);
require_once __DIR__ . '/config.php';

const COLLECTIONS = ['orders', 'services', 'messages', 'warranties'];

function json_out($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail(string $msg, int $code = 400): void { json_out(['ok' => false, 'error' => $msg], $code); }

function ensure_dirs(): void {
    foreach ([DATA_DIR, PRIVATE_DIR] as $d) { if (!is_dir($d)) @mkdir($d, 0755, true); }
    $ht = PRIVATE_DIR . '/.htaccess';
    if (!file_exists($ht)) @file_put_contents($ht, "Require all denied\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
    $ix = PRIVATE_DIR . '/index.html';
    if (!file_exists($ix)) @file_put_contents($ix, '');
}
function read_json(string $file, $default) {
    if (!is_file($file)) return $default;
    $raw = @file_get_contents($file);
    if ($raw === false || $raw === '') return $default;
    $d = json_decode($raw, true);
    return $d === null ? $default : $d;
}
function write_json(string $file, $data): bool {
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    $ok = @file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT), LOCK_EX);
    if ($ok === false) return false;
    return @rename($tmp, $file);
}
/** اجرای عملیات خواندن-تغییر-نوشتن با قفل فایل */
function with_lock(callable $fn) {
    ensure_dirs();
    $fh = fopen(PRIVATE_DIR . '/.lock', 'c');
    flock($fh, LOCK_EX);
    try { return $fn(); } finally { flock($fh, LOCK_UN); fclose($fh); }
}
function body_json(int $max = 65536): array {
    $raw = file_get_contents('php://input', false, null, 0, $max + 1);
    if ($raw === false || strlen($raw) > $max) fail('حجم درخواست زیاد است', 413);
    $d = json_decode($raw, true);
    if (!is_array($d)) fail('درخواست نامعتبر است');
    return $d;
}
function require_method(string $m): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $m) fail('روش درخواست مجاز نیست', 405);
}
function clean($s, int $max): string {
    if (!is_string($s) && !is_numeric($s)) return '';
    $s = trim(strip_tags((string)$s));
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $s) ?? '';
    return mb_substr($s, 0, $max);
}
function norm_digits(string $s): string {
    return strtr($s, ['۰'=>'0','۱'=>'1','۲'=>'2','۳'=>'3','۴'=>'4','۵'=>'5','۶'=>'6','۷'=>'7','۸'=>'8','۹'=>'9','٠'=>'0','١'=>'1','٢'=>'2','٣'=>'3','٤'=>'4','٥'=>'5','٦'=>'6','٧'=>'7','٨'=>'8','٩'=>'9']);
}
function norm_mobile(string $s): string {
    $s = preg_replace('/[^\d+]/', '', norm_digits($s)) ?? '';
    if (strpos($s, '+98') === 0) $s = '0' . substr($s, 3);
    elseif (strpos($s, '0098') === 0) $s = '0' . substr($s, 4);
    elseif (strlen($s) === 12 && strpos($s, '98') === 0) $s = '0' . substr($s, 2);
    elseif (strlen($s) === 10 && $s[0] === '9') $s = '0' . $s;
    return $s;
}
function client_ip(): string { return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'; }

/** محدودیت تعداد درخواست؛ $count=false فقط بررسی می‌کند (برای تلاش‌های ناموفق ورود) */
function rate_limit(string $bucket, int $max, int $window, bool $count = true): void {
    with_lock(function () use ($bucket, $max, $window, $count) {
        $f = PRIVATE_DIR . '/rate.json'; $d = read_json($f, []); $now = time();
        $key = $bucket . ':' . hash('sha256', client_ip());
        foreach ($d as $k => $v) { if (($v['t'] ?? 0) < $now - $window * 2) unset($d[$k]); }
        $e = $d[$key] ?? ['t' => $now, 'n' => 0];
        if ($now - $e['t'] > $window) $e = ['t' => $now, 'n' => 0];
        if ($count) { $e['n']++; $d[$key] = $e; write_json($f, $d); }
        if ($e['n'] > $max) fail('تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.', 429);
    });
}
function rate_fail_hit(string $bucket, int $window): void {
    with_lock(function () use ($bucket, $window) {
        $f = PRIVATE_DIR . '/rate.json'; $d = read_json($f, []); $now = time();
        $key = $bucket . ':' . hash('sha256', client_ip());
        $e = $d[$key] ?? ['t' => $now, 'n' => 0];
        if ($now - $e['t'] > $window) $e = ['t' => $now, 'n' => 0];
        $e['n']++; $d[$key] = $e; write_json($f, $d);
    });
}
function rate_reset(string $bucket): void {
    with_lock(function () use ($bucket) {
        $f = PRIVATE_DIR . '/rate.json'; $d = read_json($f, []);
        unset($d[$bucket . ':' . hash('sha256', client_ip())]); write_json($f, $d);
    });
}

/* ---------- نشست مدیر ---------- */
function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    ensure_dirs();
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_name('mayan_admin');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Strict']);
    session_start();
}
function require_admin(bool $csrf = false): void {
    start_session();
    if (empty($_SESSION['mayan_ok'])) fail('وارد نشده‌اید', 401);
    if ($csrf) {
        $t = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)$t)) fail('توکن امنیتی نامعتبر است؛ صفحه را تازه کنید.', 403);
    }
}
function load_auth(): array {
    ensure_dirs();
    $f = PRIVATE_DIR . '/auth.json';
    $a = read_json($f, null);
    if (!is_array($a) || empty($a['hash'])) {
        $a = ['hash' => password_hash(DEFAULT_ADMIN_PASSWORD, PASSWORD_DEFAULT), 'must_change' => true, 'updated' => date('c')];
        write_json($f, $a);
    }
    return $a;
}

/* ---------- مجموعه‌ها ---------- */
function col_file(string $col): string {
    if (!in_array($col, COLLECTIONS, true)) fail('مجموعه نامعتبر است');
    return PRIVATE_DIR . '/' . $col . '.json';
}
function col_read(string $col): array { $d = read_json(col_file($col), []); return is_array($d) ? array_values($d) : []; }
function new_code(string $prefix, array $list): string {
    $alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    do {
        $c = $prefix . '-';
        for ($i = 0; $i < 6; $i++) $c .= $alpha[random_int(0, strlen($alpha) - 1)];
        $exists = false; foreach ($list as $r) { if (($r['id'] ?? '') === $c) { $exists = true; break; } }
    } while ($exists);
    return $c;
}
function site_data(): ?array { $d = read_json(SITE_JSON, null); return is_array($d) ? $d : null; }
