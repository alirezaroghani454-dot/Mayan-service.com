<?php
/* مایان سرویس — api/ping.php : تشخیص فعال بودن PHP */
require_once __DIR__ . '/helpers.php';
ensure_dirs();
json_out(['ok' => true, 'app' => 'mayan']);
