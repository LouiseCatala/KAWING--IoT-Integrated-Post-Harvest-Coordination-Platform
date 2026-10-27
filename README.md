<div align="center">

# KAWING

### IoT-Integrated Post-Harvest Coordination Platform

Connecting farmers, buyers, and agricultural service providers across Pampanga.

**React 19 ? TypeScript ? Tailwind CSS 4 ? PHP ? MySQL ? PalaySense**

[Overview](#overview) ? [Features](#features) ? [Local development](#local-development) ? [Deployment](#deployment) ? [PalaySense API](#palaysense-api)

</div>

![KAWING landing page with a floating green island against a dark background](kawing.jpg)

## Overview

KAWING brings harvest trading, post-harvest services, production loans, and grain moisture readings into one platform. Farmers connect with buyers and service providers, while administrators manage accounts and platform activity.

## Features

| Area | What you can do |
| --- | --- |
| Harvest marketplace | Post harvests, receive price offers, and open harvests for bidding. |
| Partner hub | Find buyers and providers for trucking, drying, storage, and milling. |
| Production loans | Publish a loan service, apply for financing, and manage applications. |
| PalaySense IoT | Receive grain moisture readings with color-coded classifications. |
| Grainy AI | Access in-app guidance and answers to common questions. |
| Administration | Manage users, verifications, announcements, and reports. |
| Personalization | Switch between English and Tagalog, with dark mode by default and optional light mode. |

## Architecture

```text
React + Vite frontend
        |
        v
PHP / PDO API  <---  PalaySense moisture readings
        |
        v
MySQL / MariaDB
```

| Location | Contents |
| --- | --- |
| `src/` | React interface, role dashboards, and shared state |
| `public/api/` | PHP endpoints and server-side validation |
| `database/` | Local database schema and migrations |
| `deploy/cpanel/` | Hosting setup and production schema |
| `scripts/` | Development tools and verification checks |

See [Concurrency safeguards](CONCURRENCY.md) for write conflicts, duplicate submissions, and shared-resource protection.

## Local development

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

## Deployment

Deploy the static React build alongside the PHP/PDO API and MySQL. Node.js and Docker are not required on the cPanel server.

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

## Project checks

```bash
npm run lint
npm run build
```

`lint` checks TypeScript types. `build` creates the production bundle in `dist/`.

Keep real credentials in the ignored `kawing-config.php` or local environment files. Commit only the example configuration files; keep database backups out of Git.
