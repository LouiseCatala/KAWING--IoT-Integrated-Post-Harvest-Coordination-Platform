# KAWING cPanel deployment (PHP + MySQL)

## Requirements

- PHP 8.1+ with PDO MySQL, JSON, OpenSSL, and outbound SMTP connections
- MySQL 5.7+ or MariaDB 10.2+
- Apache `mod_rewrite` (standard on cPanel)

## Deploy

1. In **MySQL Databases**, create a database and user, then grant the user **All Privileges**.
2. Select that database in phpMyAdmin and import `deploy/cpanel/schema.sql`.
3. Copy `deploy/cpanel/kawing-config.example.php` to `/home/CPANEL_USERNAME/kawing-config.php`. Replace the database credentials, domain, and IoT key. Do not put this file inside `public_html`.
4. On your development computer run `npm install`, install PHP dependencies with `php composer.phar install --no-dev --optimize-autoloader`, then run `npm run build:cpanel`.
5. Upload the **contents** of `dist/` into `public_html/`. Include hidden `.htaccess` files and the `api/` directory.
6. Open `https://YOUR_DOMAIN/api/health`. It should report `"runtime":"php-mysql"`.
7. Open the app and create/test one record. Confirm it appears in MySQL.

## Gmail SMTP notifications

1. Create a dedicated Gmail account for KAWING. Do not use a personal account.
2. Turn on Google **2-Step Verification** for that account.
3. In the Google Account security settings, create an **App Password** for KAWING.
4. Open `/home/CPANEL_USERNAME/kawing-config.php` and configure:
   - `admin_api_key`: a long random secret used only for protected maintenance tests.
   - `smtp_enabled`: `true`.
   - `smtp_username` and `smtp_from_email`: the dedicated Gmail address.
   - `smtp_password`: the 16-character Google App Password, without spaces. Never enter the normal Gmail password.
   - `smtp_test_recipient`: the address that should receive the setup test.
5. Ensure the uploaded `public_html/vendor/` folder exists. The cPanel build copies PHPMailer there automatically.
6. Check configuration without exposing secrets: `https://YOUR_DOMAIN/api/email/status`. It should return `{"configured":true,"provider":"gmail-smtp"}`.
7. Send one protected test request:

```bash
curl -X POST "https://YOUR_DOMAIN/api/email/test" \
  -H "X-API-Key: YOUR_ADMIN_API_KEY"
```

Users receive email only after choosing **Allow Email Updates** in KAWING. Each notification ID is recorded in `email_deliveries`, preventing duplicate emails when the frontend synchronizes repeatedly. SMTP failures are recorded in that table and the cPanel PHP error log without interrupting normal app use.

## ESP32 / PalaySense

Send JSON to `https://YOUR_DOMAIN/api/moisture-readings` (or the legacy `/api/moisture_iot.php`) with the `x-api-key` configured in `~/kawing-config.php`.

```json
{
  "deviceId": "ESP32-GRAIN-01",
  "farmerEmail": "farmer@example.com",
  "rawValue": 2310,
  "moisturePercentage": 18.4
}
```

## Notes

- Docker, Node.js, and Composer are not needed on cPanel after the locally built `dist/` folder is uploaded.
- `/api/db`, `/api/db/sync`, `/api/db/clear-demo`, and PalaySense use PHP/PDO.
- Grainy and ID analysis keep their existing browser fallbacks; their server-side Gemini implementation is optional and not enabled by this PHP migration.
- Google sign-in falls back to the app's account chooser until the PHP OAuth callback is configured.
