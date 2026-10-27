# KAWING Remediation Log

This log intentionally excludes credentials, API keys, passwords, and personal user information.

## Phase 0 baseline — 2026-09-08

- Scope: React/Vite frontend, PHP API, MySQL schema, configuration, and deployment files.
- TypeScript check: passed with `npm.cmd run lint`.
- Production build: passed with `npm.cmd run build`.
- Existing warning: the main JavaScript bundle exceeds Vite's 500 kB warning threshold.
- PHP requirement: PHP 8.1 or newer.
- Database: MySQL; canonical schema is `database/schema.sql`, with a deployment copy in `deploy/cpanel/schema.sql`.
- Configuration: `.env.example`, ignored local `kawing-config.php`, and `deploy/cpanel/kawing-config.example.php`.

## KAW-SEC-003 — simulated Google authentication fallback

- Files modified: `src/components/Auth.tsx`
- Reason: OAuth failure must not permit manual identity selection or accept cross-origin popup messages.
- Old behavior: failed/unconfigured OAuth opened a simulated account selector; popup messages were not origin-filtered.
- New behavior: failed OAuth displays an error and password login remains available; OAuth messages are accepted only from the current origin.
- Database impact: none.
- Compatibility impact: real Google OAuth and username/password login remain available. The old fallback markup remains in source but is no longer opened by OAuth failure.
- Tests: TypeScript check and production build.

## KAW-AUTH-006 — compatible session groundwork and login throttling

- Files modified: `public/api/index.php`
- Reason: establish a server-authenticated identity without replacing the existing localStorage flow, prevent password fields in login responses, and reduce repeated guessing.
- Old behavior: login returned a user but created no KAWING server identity; attempts were unlimited.
- New behavior: successful password login regenerates the PHP session, stores server-side email/role, strips password fields, and supports additive `/api/auth/me` and `/api/auth/logout` routes. Eight failed attempts per PHP session in 15 minutes are throttled.
- Database impact: none.
- Compatibility impact: the existing login response shape and localStorage restoration are retained.
- Tests: PHP syntax check, TypeScript check, and production build.

## KAW-SEC-013 — HTTP/API defensive validation

- Files modified: `public/api/config.php`
- Reason: remove wildcard CORS exposure, reject malformed or oversized JSON, and add defensive response headers.
- Old behavior: wildcard CORS, malformed JSON silently becoming an empty object, and minimal security headers.
- New behavior: same-host origins only, credential-aware CORS, a 16 MiB request limit, explicit malformed JSON errors, and API security headers.
- Database impact: none.
- Compatibility impact: same-origin deployment and the Vite `/api` proxy remain supported. Cross-site API clients require a future explicit trusted-origin policy.
- Tests: PHP syntax check, TypeScript check, and production build.

## KAW-DEPLOY-014 — Vite asset references

- Files modified: `src/components/Auth.tsx`, `src/components/Splash.tsx`
- Reason: literal `/src/assets/...` URLs are unreliable in production output.
- Old behavior: source-directory URLs were emitted literally.
- New behavior: Vite imports and fingerprints the same existing images.
- Database impact: none.
- Compatibility impact: visuals remain unchanged.
- Tests: TypeScript check and production build; generated assets verified in `dist/assets`.

## Step 1 — authenticated user restoration

- Files modified: `src/App.tsx`, `src/components/Auth.tsx`, `public/api/index.php`.
- Reason: make the PHP session the preferred authentication source while retaining localStorage as a temporary network-failure compatibility fallback.
- Old behavior: startup trusted the complete localStorage user object; password login used its first response directly; logout did not invalidate the PHP session.
- New behavior: startup prefers `/api/auth/me`; an authoritative 401 clears the stale compatibility session; password and approved Google login restore the sanitized account through `/api/auth/me`; logout calls `/api/auth/logout` before clearing local state.
- Sensitive response filtering: authentication responses exclude password fields and registration-document payloads.
- Database impact: none.
- Existing records changed: none.
- Compatibility impact: `/api/db`, `/api/db/sync`, existing dashboard props, and localStorage persistence remain present. localStorage is used only for authentication fallback when the auth endpoint is unreachable.
- Tests: PHP syntax validation, TypeScript check, production build, source-level response-field checks, and unauthenticated `/api/auth/me` returning HTTP 401. Successful account restoration remains a manual test because audit execution does not use private user credentials.

## Login throttle countdown and CAPTCHA refresh

- Files modified: `public/api/index.php`, `src/components/Auth.tsx`.
- Reason: users need to see the actual remaining lockout time, and a failed password must require a fresh CAPTCHA challenge.
- Old behavior: HTTP 429 returned a fixed retry header with no visible countdown; a correct CAPTCHA stayed accepted after an incorrect password.
- New behavior: the backend reports the calculated remaining seconds; the login card and button display a live `minutes:seconds` countdown; incorrect credentials and throttling reset and rotate the CAPTCHA.
- Database impact: none.
- Compatibility impact: successful login and registration are unchanged.
- Tests: PHP syntax check, TypeScript check, and production build.

## Login throttle duration adjustment

- Files modified: `public/api/index.php`, `src/components/Auth.tsx`.
- Reason: reduce unnecessary waiting while retaining basic protection against repeated password guessing.
- Old behavior: eight failures within 15 minutes triggered a lockout lasting up to 15 minutes.
- New behavior: five failures within five minutes trigger a lockout lasting up to five minutes.
- Database impact: none.
- Compatibility impact: countdown and CAPTCHA refresh behavior remain unchanged.
- Tests: PHP syntax check, TypeScript check, and production build.

## Step 1 correction — reject stale browser authentication

- Files modified: `src/App.tsx`, `src/components/Auth.tsx`.
- Reason: manual testing showed that an HTTP 401 from `/api/auth/me` could coexist with a dashboard restored from `kawing_active_session`.
- Root cause: the network-error compatibility branch trusted the complete cached user object, including the Admin role, and the dashboard route had no final login-screen redirect when its user was cleared.
- New behavior: only a successful `/api/auth/me` response restores identity; HTTP 401/403 clears only `kawing_active_session` and forces the login screen; auth network/server failures fail closed; and the dashboard route independently requires an authenticated user.
- Cookie handling: login, restoration, approved OAuth restoration, and logout explicitly use `credentials: 'include'`.
- Database impact: none.
- Existing records changed: none.
- Compatibility impact: unrelated localStorage application data and all Step 1 API/database behavior remain unchanged. The cached active-session object is retained only after a verified server response and is never used to grant access.
- Tests: production build passed; PHP API files passed syntax validation; live unauthenticated `/api/auth/me` returned HTTP 401 with the expected PHP session cookie attributes.

## Step 1 navigation correction — restore the public landing flow

- Files modified: `src/App.tsx`.
- Reason: the security correction sent every unauthenticated visitor directly to the login form instead of the existing public landing page.
- Root cause: HTTP 401/403 and logout explicitly selected the `auth` phase, coupling authentication state to public-page navigation.
- New behavior: HTTP 401/403 and logout clear authentication and select the landing phase; a verified server session selects the dashboard directly; the login page appears only after the visitor enters from the landing page.

## Controlled remediation baseline and immediate authorization fixes

- Baseline: TypeScript validation and the production build passed before remediation changes; PHP syntax passed.
- Preserved record counts: users 3, harvests 8, offers 0, service requests 8, offered services 0, loans 0, notifications 27, moisture readings 573.
- Files modified: `public/api/index.php`.
- Account enforcement: password login and `/api/auth/me` now reject accounts whose authoritative `is_approved` value is false, ensuring a suspended or unapproved account cannot retain access.
- Demo cleanup: `/api/db/clear-demo` now requires an authenticated Administrator and is disabled unless `APP_ENV` is explicitly `development`, `local`, or `demo`.
- Database/schema impact: none. No records were modified or deleted.

## Embedded Administrator credentials removed

- Files modified: `public/api/index.php`, `database/schema.sql`, `deploy/cpanel/schema.sql`, and `src/components/admin/SettingsTab.tsx`.
- Removed hard-coded Administrator usernames, emails, password/hash seeds, demo-reset credentials, and the visible default password in Admin settings.
- Existing Administrator database records were not modified or deleted.
- Bulk synchronization and demo cleanup now preserve server-managed Administrator rows dynamically rather than recreating a known account.
- New deployments must provision their first Administrator privately; no default login is supplied by application code.
- Security impact: unchanged. Browser storage is still never used to authenticate, and a dashboard still requires a server-restored active user.
- Database impact: none.
- Compatibility impact: existing landing, login, signup, and Back to Lobby components are unchanged.
