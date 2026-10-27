# KAWING Agricultural Platform

KAWING connects farmers with agricultural businesses, post-harvest services,
market opportunities, production support, PalaySense readings, and Grainy AI.
This repository contains the React/Vite frontend and the active PHP/MySQL API.

## Run locally with PHP + MySQL (no Docker)

The active backend is PHP/PDO.

### Requirements

- Node.js 20+ for the React/Vite frontend
- PHP 8.1+ with the PDO MySQL extension
- MySQL 5.7+ or MariaDB 10.2+ (XAMPP, WampServer, Laragon, or a normal local installation)

### Setup

1. Start MySQL.
2. Import `database/schema.sql` using phpMyAdmin or the MySQL command line. It creates the local `kawing` database.
3. Copy `kawing-config.example.php` to `kawing-config.php` and enter your local MySQL credentials.
4. Install frontend packages with `npm install`.
5. In terminal 1, start PHP: `npm run dev:php`.
6. In terminal 2, start React: `npm run dev`.
7. Open `http://localhost:3000`. Test the API at `http://127.0.0.1:8000/api/health`.

On Windows PowerShell, if script execution prevents `npm` from running, use
`npm.cmd run dev:php` and `npm.cmd run dev` instead. The `dev:php` command uses
the `php` executable on `PATH`, so it works with standalone PHP as well as
XAMPP, WampServer, and Laragon.

Vite proxies `/api` requests to the local PHP server on port 8000. The PHP source lives in `public/api`; database credentials in `kawing-config.php` are ignored by Git.

## Future cPanel deployment

The production deployment is now a static React build with a PHP/PDO API and MySQL. Node.js and Docker are not required on the cPanel server.

1. Create a cPanel MySQL database/user and grant all privileges.
2. Import `deploy/cpanel/schema.sql` into the selected database.
3. Copy and configure `deploy/cpanel/kawing-config.example.php` as `~/kawing-config.php` above `public_html`.
4. Build locally with `npm run build:cpanel`.
5. Upload the contents of `dist/` to `public_html`, including both `.htaccess` files.
6. Verify `https://YOUR_DOMAIN/api/health`.

See `deploy/cpanel/README.md` for the complete checklist and ESP32 payload.

### Database tables

The application uses dedicated tables for `users`, `harvests`, `service_requests`, `offered_services`, `offers`, `production_loans`, `notifications`, `iot_devices`, and `moisture_readings`.

### PalaySense API

PalaySense sends readings to `POST /api/moisture-readings` with the `x-api-key` header matching `IOT_API_KEY`. Both camelCase and snake_case payload fields are accepted. `farmerEmail` is required for the reading to appear automatically in that farmer's Post Harvest form.

```json
{
  "harvestId": "h1",
  "batchId": "BATCH-001",
  "moisturePercentage": 18.4,
  "farmerEmail": "magsasaka@kawing.com",
  "deviceId": "PALAYSENSE-01",
  "gatewayId": "INTEL-NUC-01"
}
```

Read recent history from `GET /api/moisture-readings`. Results can be filtered by `harvestId`, `farmerEmail`, `deviceId`, and `since`, with an optional `limit` from 1 to 500.
