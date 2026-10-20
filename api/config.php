<?php
/* ==========================================================================
   مایان سرویس — api/config.php
   تنظیمات API (فقط روی هاست دارای PHP استفاده می‌شود)
   ========================================================================== */
define('MAYAN_ROOT', dirname(__DIR__));
define('DATA_DIR', MAYAN_ROOT . '/data');

/* پوشه‌ی داده‌های خصوصی (سفارش‌ها، پیام‌ها، گارانتی مشتریان، رمز مدیر).
   امن‌ترین حالت: آن را خارج از public_html قرار دهید، مثلاً:
   define('PRIVATE_DIR', dirname(MAYAN_ROOT) . '/mayan-private');                         */
define('PRIVATE_DIR', DATA_DIR . '/private');

define('SITE_JSON', DATA_DIR . '/site-data.json');

/* رمز پیش‌فرض مدیر — در اولین ورود حتماً تغییر کنید (پنل شما را مجبور می‌کند) */
define('DEFAULT_ADMIN_PASSWORD', 'Mayan@2026');

/* حداکثر ثبت سفارش/پیام از یک IP در هر ساعت */
define('MAX_SUBMITS_PER_HOUR', 12);
/* حداکثر استعلام از یک IP در هر ساعت */
define('MAX_INQUIRIES_PER_HOUR', 80);
