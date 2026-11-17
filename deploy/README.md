# KAWING cPanel deployment (PHP + MySQL)

## Requirements

- PHP 8.1+ with PDO MySQL, JSON, OpenSSL, and outbound SMTP connections
- MySQL 5.7+ or MariaDB 10.2+
- Apache `mod_rewrite` (standard on cPanel)

## Deploy

1. In **MySQL Databases**, create a database and user, then grant the user **All Privileges**.
2. Select that database in phpMyAdmin and import `deploy/schema.sql`.
3. Copy `deploy/kawing-config.example.php` to `/home/CPANEL_USERNAME/kawing-config.php`. Replace the database credentials, domain, and IoT key. Configure Grainy's `gemini_api_key`, `cloudflare_account_id`, and `cloudflare_ai_token` there too. Keep the config outside `public_html` and never commit it.
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
   - `kiosk_device_id`: optional ID for the locked local kiosk. Keep it private and leave it empty on public hosting unless kiosk access is deliberately configured there.
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

## Grainy AI provider limits

- Local development reads `GEMINI_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_AI_TOKEN` from the project-root `.env` file (or matching values in the project-root `kawing-config.php`). Restart `npm run dev` after changing these values.
- Hostinger reads the same three settings from `/home/CPANEL_USERNAME/kawing-config.php`; `.env` is not part of the uploaded `dist/` files.
- KAWING routes at most 120 questions per Philippine calendar day to Gemini, then at most 50 questions to Cloudflare Workers AI. If a provider errors or either provider's limit is reached, Grainy uses saved local help.
- To avoid provider charges, keep the Gemini project on Google's Free tier and the Cloudflare account on Workers Free. KAWING's request caps do not replace those provider account settings.
- Create a Cloudflare API token with Account → Workers AI → Read permission. Never place provider tokens in frontend code or `public_html`.

## ESP32 / PalaySense

Keep the ESP32 configured with the Hostinger `iot_api_key` and the PalaySense ID assigned to that device (for example, `001`). The ID must match the farmer's profile. It posts `deviceId`, `rawValue`, and `moisturePercentage` to `/api/moisture-readings`; it does not need a farmer email or database credentials.

When an approved farmer opens Post Harvest or Offer Harvest, the signed-in form pairs the device to that farmer temporarily. The API relays only the latest reading in a private server temporary file. Closing the form clears the pairing and reading; abandoned pairings expire. Only submitting the harvest stores its moisture percentage in the harvest record. No sensor history is written to MySQL.

Set `KAWING_API_URL` to `https://YOUR_DOMAIN/api/moisture-readings`. Use a strong, unique IoT API key that matches the server's `iot_api_key`, and protect the sketch because firmware contains that key.
## Notes

- Docker, Node.js, and Composer are not needed on cPanel after the locally built `dist/` folder is uploaded.
- `/api/db`, `/api/db/sync`, `/api/db/clear-demo`, and PalaySense use PHP/PDO.
- Grainy uses server-side Gemini first, then Cloudflare Workers AI within the daily caps above, and saved local help as a fallback.
- Google sign-in falls back to the app's account chooser until the PHP OAuth callback is configured.
