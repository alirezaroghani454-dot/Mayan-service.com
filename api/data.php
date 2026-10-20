<?php
/* مایان سرویس — api/data.php : داده‌ی عمومی سایت (محصولات، خدمات، تنظیمات ...) */
require_once __DIR__ . '/helpers.php';
require_method('GET');
json_out(['ok' => true, 'data' => site_data()]);
